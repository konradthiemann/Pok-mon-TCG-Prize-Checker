<div align="center">
  <img src="public/icon.svg" width="96" height="96" alt="Prized Logo" />
  <h1>Prized</h1>
  <p><strong>Trainiere dein Preis-Gespür im Sammelkartenspiel.</strong></p>
  <p>
    <a href="https://prized.konradthiemann.de">🔗 Live-App</a> ·
    <a href="docs/ARCHITECTURE.md">🛠 Technische Doku</a>
  </p>
</div>

---

## Was ist Prized?

Zu Beginn jeder Partie im Sammelkartenspiel werden **6 der 60 Karten** verdeckt als
Preiskarten beiseitegelegt. Wer weiß, welche Karten das sind, hat einen echten
kompetitiven Vorteil – man leitet es per **Ausschlussprinzip** aus Hand und Deck ab.

**Prized** ist ein kleines, schnelles Trainings-Minispiel genau dafür: Deck wählen,
durchblättern, die 6 Preiskarten erraten – und mit XP, Leveln, Rängen und Streaks
besser werden.

## Features

- 🎴 **Eigene Decks** per Decklisten-Import oder Deck-Builder (Regel: genau 60 Karten).
- 🃏 **Kartenbilder** von pokemontcg.io mit robustem Namens-Fallback, falls kein Bild
  verfügbar ist (die App bleibt immer spielbar).
- 🧠 **Ausschluss-Training**: aufgefächerter Deck-Browser, Preiskarten tippen, auflösen.
- 📈 **Gamification**: XP, Level, Ränge, Tages-Streak, Genauigkeits-Statistik.
- ☁️ **Optionaler Account** (Supabase) für geräteübergreifende Cloud-Sync – ohne Account
  läuft alles lokal im Browser.
- 🌗 **Dark/Light Mode**, PWA-fähig (installierbar, Offline-Shell).

## Rechtliches

Impressum, Datenschutz und Nutzungsbedingungen sind **in der App** über das Menü (☰)
erreichbar. Sie liegen als Screen in [`src/screens/Legal.tsx`](src/screens/Legal.tsx).

> ⚠️ **Vor dem Live-Gang:** Im Impressum die Anschrift in
> [`src/screens/Legal.tsx`](src/screens/Legal.tsx) (`OPERATOR`) vervollständigen –
> die Adresse ist eine Pflichtangabe nach § 5 DDG.

## Schnellstart

```bash
npm install
npm run dev        # Vite Dev-Server (http://localhost:5173)
npm run build      # Produktions-Build nach dist/
npm start          # dist/ über den Express-Server ausliefern (Port via PORT, Default 8080)
```

### Umgebungsvariablen (optional)

Ohne diese Variablen läuft Prized im lokalen Gast-Modus.

| Variable                  | Zweck                                          |
| ------------------------- | ---------------------------------------------- |
| `VITE_SUPABASE_URL`       | Supabase-Projekt-URL (aktiviert Accounts/Sync) |
| `VITE_SUPABASE_ANON_KEY`  | Supabase Anon-Key                              |
| `VITE_GOOGLE_ENABLED`     | `1` blendet den Google-Login ein               |
| `PORT`                    | Port des Prod-Servers (Default `8080`)         |

## Tech-Stack

- **Frontend:** Vite + React 18 + TypeScript (rein clientseitig)
- **Persistenz:** `localStorage`, optional Supabase (Auth + Cloud-Sync)
- **Kartendaten:** [pokemontcg.io](https://pokemontcg.io) API + Bild-CDN
- **Server:** kleiner Express-Static-Server (`server/index.js`), SPA-Fallback, `/healthz`
- **Hosting:** [Railway](https://railway.app) (Auto-Deploy bei Push auf `main`)

Details, Datenmodell und Architektur: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

## Deployment

Push auf `main` löst automatisch ein Railway-Deploy aus. Live-Domain:
`prized.konradthiemann.de` (CNAME auf die Railway-App).

## Disclaimer

Prized ist ein **inoffizielles, nicht-kommerzielles Fan-Projekt** und steht in keiner
Verbindung zu Nintendo, The Pokémon Company, Creatures Inc. oder GAME FREAK. Alle
Kartennamen, Bilder und Marken sind Eigentum der jeweiligen Rechteinhaber.
