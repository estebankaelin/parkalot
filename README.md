# parkalot

Mobile App (iOS und Android) zum Teilen und Mieten privater Parkplätze. Gebaut mit React Native und Expo.

Erster Einsatz ist der Pilot am Einsiedler Weihnachtsmarkt (27.11. bis 6.12.2026). Konzept, Storyboard und Feature-Priorisierung liegen im Miro-Board „parkalot MVP-Konzept“.

## Stand

Der Pilot-Ablauf für Mieter ist durchspielbar:

1. **Suche:** Markttage wählen, freie Plätze nach Fussweg zum Klosterplatz sortiert.
2. **Detail:** Beschreibung, Ausstattung, Tage wählen, Preis.
3. **Buchen:** Kontrollschild eingeben, Preis inkl. 15 % Servicegebühr, bezahlen.
4. **Gebucht:** Zugangsinfo und Route zum Parkplatz.

Noch nicht angebunden:

- **Backend:** Plätze kommen aus `src/data/sample-spots.ts` (Beispieldaten), Buchungen liegen nur im Speicher.
- **Zahlung:** `src/services/payments.ts` ist ein Testmodus ohne Belastung. Stripe braucht ein Backend, das den PaymentIntent erstellt.
- **Karte:** Für die Kartenansicht auf Android braucht es einen Google-Maps-API-Schlüssel.

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
- `src/data/` Datenquelle (heute Beispieldaten)
- `src/services/` Anbindung an externe Dienste (Zahlung)
- `src/state/` App-Zustand
