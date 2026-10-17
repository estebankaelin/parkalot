-- Beispieldaten für die lokale Entwicklung (supabase db reset). Keine echten Anbieter oder Adressen.
insert into public.spots
  (id, title, address, latitude, longitude, type, covered, ev_charging, max_vehicle_size,
   price_per_day_rappen, description, host_first_name)
values
  ('00000000-0000-4000-8000-000000000001', 'Garagenplatz nahe Hauptstrasse',
   'Beispieladresse 1, 8840 Einsiedeln', 47.1281, 8.7488, 'garage', true, false, 'mittel',
   2000, 'Einzelgarage im Hinterhof, ruhige Zufahrt.', 'Sandra'),
  ('00000000-0000-4000-8000-000000000002', 'Aussenplatz beim Mehrfamilienhaus',
   'Beispieladresse 2, 8840 Einsiedeln', 47.1245, 8.7551, 'aussen', false, false, 'gross',
   1500, 'Markierter Platz Nr. 7, auch für Kleinbusse.', 'Marco'),
  ('00000000-0000-4000-8000-000000000003', 'Tiefgaragenplatz mit Ladestation',
   'Beispieladresse 3, 8840 Einsiedeln', 47.1302, 8.7442, 'tiefgarage', true, true, 'mittel',
   2800, 'Tiefgarage mit Wallbox, Strom inklusive.', 'Nadia');

insert into public.spot_access (spot_id, access_instructions)
values
  ('00000000-0000-4000-8000-000000000001', 'Garagentor Nr. 3, Code wird nach der Buchung per SMS gesendet.'),
  ('00000000-0000-4000-8000-000000000002', 'Platz Nr. 7 links neben dem Eingang.'),
  ('00000000-0000-4000-8000-000000000003', 'Einfahrt über Rampe, Platz 14. Tor öffnet mit Code.');

-- Alle Plätze an allen Markttagen verfügbar.
insert into public.spot_availability (spot_id, day)
select s.id, d::date
from public.spots s
cross join generate_series('2026-11-27'::date, '2026-12-06'::date, interval '1 day') as d;
