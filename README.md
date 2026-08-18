<div align="center">
  <img src="public/icon.svg" width="80" height="80" alt="Prized Logo" />
  <h1>Prized</h1>
  <p><strong>Trainiere dein Preis-Gespür im Sammelkartenspiel.</strong></p>
  <p>
    <a href="https://prized.konradthiemann.de">Live-App</a> ·
    <a href="docs/ARCHITECTURE.md">Architektur</a>
  </p>
  <p>
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff" />
    <img alt="React" src="https://img.shields.io/badge/React_18-61DAFB?logo=react&logoColor=000" />
    <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff" />
    <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=fff" />
    <img alt="Railway" src="https://img.shields.io/badge/Railway-0B0D0E?logo=railway&logoColor=fff" />
  </p>
</div>

---

## Was ist Prized?

Zu Beginn jeder Partie im Sammelkartenspiel werden **6 der 60 Karten** verdeckt als
Preiskarten beiseitegelegt. Wer weiß, welche Karten das sind, hat einen echten
kompetitiven Vorteil — man leitet es per **Ausschlussprinzip** aus Hand und Deck ab.

**Prized** ist ein schnelles Trainings-Minispiel genau dafür: Deck wählen,
durchblättern, die 6 Preiskarten erraten.

## Features

- **Deck-Import** — Deckliste im Standard-TCG-Format einfügen, sofort spielen.
- **Kartenbilder** von pokemontcg.io mit limitlesstcg-Fallback — die App zeigt immer ein Bild.
- **Deck-Fächer** — horizontaler Kartenfächer mit Drag, Scrub und Tap-to-raise.
- **Statistik** — Zeit, Genauigkeit und Verlauf pro Deck.
- **Optionaler Account** (Supabase) für geräteübergreifende Cloud-Sync.
- **Dark/Light Mode**, PWA-fähig.

## Schnellstart

```bash
npm install
npm run dev        # Vite Dev-Server (http://localhost:5173)
npm run build      # Produktions-Build nach dist/
npm start          # Express-Server (Port via PORT, Default 8080)
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

| Schicht      | Technologie |
| ------------ | ----------- |
| Frontend     | React 18 + TypeScript + Vite |
| Persistenz   | localStorage, optional Supabase (Auth + Cloud-Sync) |
| Kartendaten  | [pokemontcg.io](https://pokemontcg.io) API + [limitlesstcg](https://limitlesstcg.com) CDN |
| Server       | Express (`server/index.js`), SPA-Fallback, `/healthz` |
| Hosting      | [Railway](https://railway.app) — Auto-Deploy bei Push auf `main` |

Architektur und Datenmodell: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

## Deployment

Push auf `main` löst automatisch ein Railway-Deploy aus.

## Rechtliches

Impressum, Datenschutz und AGB sind **in der App** über das Menü erreichbar
([`src/screens/Legal.tsx`](src/screens/Legal.tsx)).

> **Vor dem Live-Gang:** Anschrift im Impressum vervollständigen (`OPERATOR` in Legal.tsx).

## Disclaimer

Prized ist ein **inoffizielles, nicht-kommerzielles Fan-Projekt** und steht in keiner
Verbindung zu Nintendo, The Pokémon Company, Creatures Inc. oder GAME FREAK. Alle
Kartennamen, Bilder und Marken sind Eigentum der jeweiligen Rechteinhaber.
