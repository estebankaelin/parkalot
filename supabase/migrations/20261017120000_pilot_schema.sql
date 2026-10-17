-- Schema für den Pilot am Einsiedler Weihnachtsmarkt.
-- Geld immer in Rappen (integer). Tage als date (Ortszeit Schweiz).

create table public.spots (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  type text not null check (type in ('garage', 'tiefgarage', 'carport', 'aussen')),
  covered boolean not null default false,
  ev_charging boolean not null default false,
  max_vehicle_size text not null check (max_vehicle_size in ('klein', 'mittel', 'gross')),
  price_per_day_rappen integer not null check (price_per_day_rappen > 0),
  description text not null default '',
  host_first_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Getrennt von spots, damit niemand die Zugangsinfo vor der Buchung lesen kann.
create table public.spot_access (
  spot_id uuid primary key references public.spots (id) on delete cascade,
  access_instructions text not null
);

create table public.spot_availability (
  spot_id uuid not null references public.spots (id) on delete cascade,
  day date not null,
  primary key (spot_id, day)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots (id),
  renter_id uuid not null references auth.users (id),
  days date[] not null check (cardinality(days) > 0),
  license_plate text not null,
  subtotal_rappen integer not null,
  fee_rappen integer not null,
  total_rappen integer not null,
  status text not null default 'ausstehend'
    check (status in ('ausstehend', 'bestaetigt', 'storniert')),
  stripe_payment_intent_id text unique,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

-- Ein Tag pro Platz kann nur einmal belegt sein. Ausstehende Buchungen halten den Tag,
-- bis die Zahlung bestätigt oder die Reservation abgelaufen ist.
create table public.booking_days (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  spot_id uuid not null references public.spots (id),
  day date not null,
  primary key (spot_id, day)
);

create index bookings_renter_idx on public.bookings (renter_id);

alter table public.spots enable row level security;
alter table public.spot_access enable row level security;
alter table public.spot_availability enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_days enable row level security;

create policy "Aktive Plätze sind öffentlich" on public.spots
  for select to anon, authenticated using (active);

create policy "Verfügbarkeit ist öffentlich" on public.spot_availability
  for select to anon, authenticated using (true);

create policy "Mieter sehen eigene Buchungen" on public.bookings
  for select to authenticated using (renter_id = auth.uid());

-- spot_access und booking_days haben bewusst keine Policies: nur über die Funktionen unten.

-- Freie Tage pro Platz: verfügbar und nicht durch eine Buchung belegt.
create view public.spot_free_days
with (security_invoker = false) as
  select a.spot_id, a.day
  from public.spot_availability a
  join public.spots s on s.id = a.spot_id and s.active
  where not exists (
    select 1 from public.booking_days b where b.spot_id = a.spot_id and b.day = a.day
  );

grant select on public.spot_free_days to anon, authenticated;

-- Plattformgebühr: 15 % pro Buchung, zahlt der Mieter (Entscheid vom 17.10.2026).
-- Muss mit src/domain/pricing.ts übereinstimmen.
create function public.platform_fee_rappen(subtotal integer)
returns integer
language sql immutable
as $$ select round(subtotal * 0.15)::integer $$;

-- Wie lange eine unbezahlte Reservation die Tage hält.
create function public.release_expired_holds()
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  released integer;
begin
  with expired as (
    update public.bookings
    set status = 'storniert'
    where status = 'ausstehend' and created_at < now() - interval '30 minutes'
    returning id
  )
  delete from public.booking_days d using expired e where d.booking_id = e.id;
  get diagnostics released = row_count;
  return released;
end;
$$;

-- Legt eine ausstehende Buchung an und reserviert die Tage. Wird von der Edge Function
-- create-booking im Namen des eingeloggten Mieters aufgerufen.
create function public.create_pending_booking(
  p_spot_id uuid,
  p_days date[],
  p_license_plate text
)
returns public.bookings
language plpgsql security definer set search_path = ''
as $$
declare
  v_renter uuid := auth.uid();
  v_spot public.spots;
  v_days date[];
  v_subtotal integer;
  v_booking public.bookings;
begin
  if v_renter is null then
    raise exception 'Nicht angemeldet' using errcode = '28000';
  end if;

  select array_agg(distinct d order by d) into v_days from unnest(p_days) as d;
  if v_days is null then
    raise exception 'Mindestens ein Tag nötig' using errcode = '22023';
  end if;

  select * into v_spot from public.spots where id = p_spot_id and active;
  if not found then
    raise exception 'Parkplatz nicht gefunden' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from unnest(v_days) as d
    where not exists (
      select 1 from public.spot_availability a where a.spot_id = p_spot_id and a.day = d
    )
  ) then
    raise exception 'Platz ist nicht an allen Tagen verfügbar' using errcode = '23P01';
  end if;

  perform public.release_expired_holds();

  v_subtotal := v_spot.price_per_day_rappen * cardinality(v_days);

  insert into public.bookings (
    spot_id, renter_id, days, license_plate, subtotal_rappen, fee_rappen, total_rappen
  ) values (
    p_spot_id,
    v_renter,
    v_days,
    p_license_plate,
    v_subtotal,
    public.platform_fee_rappen(v_subtotal),
    v_subtotal + public.platform_fee_rappen(v_subtotal)
  )
  returning * into v_booking;

  begin
    insert into public.booking_days (booking_id, spot_id, day)
    select v_booking.id, p_spot_id, d from unnest(v_days) as d;
  exception when unique_violation then
    raise exception 'Platz ist an mindestens einem Tag schon gebucht' using errcode = '23P01';
  end;

  return v_booking;
end;
$$;

-- Zugangsinfo nur für eigene, bezahlte Buchungen.
create function public.booking_access_instructions(p_booking_id uuid)
returns text
language sql stable security definer set search_path = ''
as $$
  select a.access_instructions
  from public.bookings b
  join public.spot_access a on a.spot_id = b.spot_id
  where b.id = p_booking_id and b.renter_id = auth.uid() and b.status = 'bestaetigt'
$$;

-- Vom Stripe-Webhook aufgerufen (Service-Rolle). Gibt false zurück, wenn die Reservation
-- schon abgelaufen war: dann muss die Zahlung zurückerstattet werden.
create function public.confirm_booking(p_payment_intent_id text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  update public.bookings
  set status = 'bestaetigt', confirmed_at = now()
  where stripe_payment_intent_id = p_payment_intent_id and status = 'ausstehend';
  if found then
    return true;
  end if;
  return exists (
    select 1 from public.bookings
    where stripe_payment_intent_id = p_payment_intent_id and status = 'bestaetigt'
  );
end;
$$;

create function public.cancel_booking_for_payment(p_payment_intent_id text)
returns void
language sql security definer set search_path = ''
as $$
  with cancelled as (
    update public.bookings
    set status = 'storniert'
    where stripe_payment_intent_id = p_payment_intent_id and status = 'ausstehend'
    returning id
  )
  delete from public.booking_days d using cancelled c where d.booking_id = c.id
$$;

revoke execute on function public.release_expired_holds() from public, anon, authenticated;
revoke execute on function public.confirm_booking(text) from public, anon, authenticated;
revoke execute on function public.cancel_booking_for_payment(text) from public, anon, authenticated;
revoke execute on function public.create_pending_booking(uuid, date[], text) from public, anon;
grant execute on function public.create_pending_booking(uuid, date[], text) to authenticated;
grant execute on function public.booking_access_instructions(uuid) to authenticated;
