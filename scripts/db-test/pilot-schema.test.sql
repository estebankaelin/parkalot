-- Prüft Buchungslogik und Zugriffsregeln der Migration. Bricht beim ersten Fehler ab.
\set ON_ERROR_STOP 1
create function pg_temp.check(ok boolean, what text) returns void language plpgsql as $$
begin
  if not ok then raise exception 'FEHLGESCHLAGEN: %', what; end if;
  raise notice 'ok: %', what;
end $$;

insert into auth.users values ('11111111-1111-1111-1111-111111111111'), ('22222222-2222-2222-2222-222222222222');
insert into spots (id, title, address, latitude, longitude, type, max_vehicle_size, price_per_day_rappen, host_first_name)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Garage', 'Adr', 47.1, 8.7, 'garage', 'mittel', 2000, 'Sandra');
insert into spot_access values ('aaaaaaaa-0000-0000-0000-000000000001', 'Tor 3');
insert into spot_availability
select 'aaaaaaaa-0000-0000-0000-000000000001', d::date
from generate_series('2026-11-27'::date, '2026-12-06', '1 day') d;

set role anon;
select pg_temp.check((select count(*) from spots) = 1, 'Gäste sehen aktive Plätze');
select pg_temp.check((select count(*) from spot_free_days) = 10, 'Gäste sehen freie Tage');
select pg_temp.check((select count(*) from spot_access) = 0, 'Gäste sehen keine Zugangsinfo');
reset role;

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select pg_temp.check(
  (select (b.subtotal_rappen, b.fee_rappen, b.total_rappen, b.days)
     = (4000, 600, 4600, array['2026-11-27', '2026-11-28']::date[])
   from create_pending_booking('aaaaaaaa-0000-0000-0000-000000000001',
     array['2026-11-28', '2026-11-27', '2026-11-28']::date[], 'SZ 1') b),
  'Preis inkl. 15 % Gebühr, doppelte Tage zusammengefasst');
select pg_temp.check((select booking_access_instructions(id) from bookings) is null,
  'Keine Zugangsinfo vor der Zahlung');
reset role;

set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
do $$ begin
  perform create_pending_booking('aaaaaaaa-0000-0000-0000-000000000001', array['2026-11-28']::date[], 'LU 2');
  raise exception 'FEHLGESCHLAGEN: Doppelbuchung möglich';
exception when sqlstate '23P01' then raise notice 'ok: Doppelbuchung verhindert'; end $$;
do $$ begin
  perform create_pending_booking('aaaaaaaa-0000-0000-0000-000000000001', array['2027-01-01']::date[], 'LU 2');
  raise exception 'FEHLGESCHLAGEN: nicht verfügbarer Tag buchbar';
exception when sqlstate '23P01' then raise notice 'ok: Nicht verfügbarer Tag abgelehnt'; end $$;
select pg_temp.check((select count(*) from bookings) = 0, 'Mieter sehen keine fremden Buchungen');
do $$ begin
  perform confirm_booking('x');
  raise exception 'FEHLGESCHLAGEN: Mieter kann Buchung bestätigen';
exception when insufficient_privilege then raise notice 'ok: Bestätigen nur für den Server'; end $$;
reset role;

select pg_temp.check((select count(*) from spot_free_days) = 8, 'Reservierte Tage sind nicht mehr frei');

update bookings set stripe_payment_intent_id = 'pi_1';
set role service_role;
select pg_temp.check(confirm_booking('pi_1'), 'Webhook bestätigt die Buchung');
select pg_temp.check(confirm_booking('pi_1'), 'Bestätigen ist wiederholbar');
reset role;

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select pg_temp.check((select booking_access_instructions(id) from bookings) = 'Tor 3',
  'Zugangsinfo nach der Zahlung');
reset role;

set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select create_pending_booking('aaaaaaaa-0000-0000-0000-000000000001', array['2026-12-01']::date[], 'LU 2');
reset role;
update bookings set created_at = now() - interval '31 minutes', stripe_payment_intent_id = 'pi_2'
where license_plate = 'LU 2';
select pg_temp.check(release_expired_holds() = 1, 'Abgelaufene Reservation wird freigegeben');
set role service_role;
select pg_temp.check(not confirm_booking('pi_2'), 'Späte Zahlung wird nicht bestätigt (Rückerstattung)');
reset role;
select pg_temp.check((select count(*) from spot_free_days) = 8, 'Freigegebener Tag ist wieder frei');
