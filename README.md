# parkalot

Mobile App (iOS und Android) zum Teilen und Mieten privater Parkplätze. Gebaut mit React Native und Expo.

Erster Einsatz ist der Pilot am Einsiedler Weihnachtsmarkt (27.11. bis 6.12.2026). Konzept, Storyboard und Feature-Priorisierung liegen im Miro-Board „parkalot MVP-Konzept“.

## Stand

Der Pilot-Ablauf für Mieter ist durchspielbar:

1. **Suche:** Markttage wählen, freie Plätze nach Fussweg zum Klosterplatz sortiert.
2. **Detail:** Beschreibung, Ausstattung, Tage wählen, Preis.
3. **Buchen:** Kontrollschild eingeben, Preis inkl. 15 % Servicegebühr, bezahlen.
4. **Gebucht:** Zugangsinfo und Route zum Parkplatz.

Ohne Konfiguration läuft die App mit Beispieldaten im Testmodus (keine Zahlung). Sobald die Werte aus `.env.example` gesetzt sind, kommen Plätze und Buchungen aus Supabase und bezahlt wird mit Stripe.

Noch offen: Kartenansicht (braucht auf Android einen Google-Maps-API-Schlüssel) und ein Backoffice zum Erfassen der Plätze.

## Backend einrichten (Supabase und Stripe)

1. Supabase-Projekt in einer europäischen Region anlegen. Unter **Authentication > Sign In / Providers** die anonymen Anmeldungen aktivieren, damit Mieter ohne Registrierung buchen können.
2. Schema einspielen und Funktionen deployen:
   ```bash
   npx supabase login
   npx supabase link --project-ref <projekt-ref>
   npx supabase db push
   npx supabase secrets set STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_...
   npx supabase functions deploy create-booking stripe-webhook
   ```
3. In Stripe unter **Developers > Webhooks** einen Endpoint auf `https://<projekt-ref>.supabase.co/functions/v1/stripe-webhook` anlegen, mit den Ereignissen `payment_intent.succeeded`, `payment_intent.payment_failed` und `payment_intent.canceled`. Das Signing Secret ist `STRIPE_WEBHOOK_SECRET`. Unter **Settings > Payment methods** TWINT aktivieren.
4. `.env.example` nach `.env.local` kopieren und ausfüllen.
5. Plätze vorerst im Supabase Table Editor erfassen: `spots`, dazu `spot_access` (Zugangsinfo) und `spot_availability` (ein Eintrag pro freiem Tag).

So läuft eine Buchung ab:

1. Die App meldet den Mieter anonym an und ruft die Edge Function `create-booking` auf.
2. Die Funktion reserviert die Tage in der Datenbank (`create_pending_booking`), berechnet den Preis serverseitig und erstellt die Stripe-Zahlung.
3. Die App zeigt das Stripe Payment Sheet. Nach der Zahlung bestätigt der Webhook die Buchung, erst dann ist die Zugangsinfo sichtbar.
4. Unbezahlte Reservationen verfallen nach 30 Minuten. Kommt eine Zahlung erst danach an, wird sie automatisch zurückerstattet.

Zahlungen mit TWINT springen in die TWINT-App und zurück. Das funktioniert zuverlässig nur in einem Development Build (`npx expo run:ios` bzw. `run:android`), nicht in Expo Go.

## Entwickeln

```bash
npm install
npm start          # Expo Dev Server, App in Expo Go oder Simulator öffnen
npm run web        # Vorschau im Browser
npm test           # Unit-Tests
npm run typecheck
npm run lint
```

## Struktur

- `src/app/` Screens (Expo Router, jede Datei ist eine Route)
- `src/components/` UI-Bausteine
- `src/domain/` Geschäftslogik ohne UI: Preise, Distanz, Suche, Tage
- `src/config/pilot.ts` Daten und Ziel des Pilot-Events
- `src/data/` Datenquelle der Plätze (Supabase oder Beispieldaten)
- `src/services/` Buchen und Bezahlen (Supabase und Stripe oder Testmodus)
- `src/lib/supabase.ts` Supabase-Client
- `src/state/` Hooks zum Laden der Daten
- `supabase/migrations/` Datenbank-Schema mit Zugriffsregeln
- `supabase/functions/` Edge Functions für Buchung und Stripe-Webhook
