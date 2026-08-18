# Prized — Claude Code Projektanweisungen

## Was ist Prized?

Pokémon-TCG-Trainings-Minispiel: Spieler erraten die 6 verdeckten Preiskarten per Ausschlussprinzip. Rein clientseitige Web-App, optional mit Supabase-Backend für Accounts.

Live: https://prized.konradthiemann.de

## Tech-Stack

- **Frontend**: Vite + React 18 + TypeScript (strict)
- **Styling**: CSS Custom Properties + Inline Styles (kein CSS-Framework)
- **Backend**: Express Static Server (`server/index.js`) — nur SPA-Auslieferung
- **Auth/DB**: Supabase (optional, ohne Env-Vars = Gast-Modus)
- **i18n**: Eigener React Context (`src/i18n.tsx`), DE + EN
- **Deployment**: Railway (auto-deploy von `main`), Nixpacks Builder
- **PWA**: Service Worker + Web App Manifest

## Projektstruktur

```
src/
  game.ts          — Kernlogik: Typen, deal(), score(), parseImport()
  App.tsx           — Screen-State-Machine, Routing
  i18n.tsx          — Übersetzungen (DE/EN), useT() Hook
  storage.ts        — localStorage-Persistenz
  sync.ts           — Supabase Cloud-Sync (Decks + History)
  cardImages.ts     — Kartenbilder-Auflösung (pokemontcg.io + Fallback)
  CardFace.tsx      — Kartenbild mit 2-stufigem Fallback
  DeckBackground.tsx — Dynamischer deckabhängiger Hintergrund
  main.tsx          — Einstiegspunkt
  styles.css        — Globale Styles + Design Tokens
  auth/
    supabase.ts     — Supabase-Client-Init
    AuthProvider.tsx — Auth-Context
  screens/
    Home.tsx         — Deck-Übersicht
    GameScreen.tsx   — Spielfeld (Kartenfächer + Deckliste)
    Reveal.tsx       — Ergebnis-Anzeige
    ImportScreen.tsx  — Deck-Import (Textfeld)
    DeckBuilder.tsx   — Deck erstellen (Suche + Paste)
    Stats.tsx         — Statistik + Chart
    NavBar.tsx        — Bottom Navigation (Decks/Stats)
    Login.tsx         — Anmelden/Registrieren/Passwort vergessen
    AccountSettings.tsx — Kontoeinstellungen
    ResetPassword.tsx  — Passwort-Reset-Flow
    Paywall.tsx       — Premium-Platzhalter
    Onboarding.tsx    — Erstnutzer-Tutorial (4 Slides)
    Legal.tsx         — Impressum, Datenschutz, AGB
  components/
    Drawer.tsx       — Seitenmenü (Theme, Sprache, Account, Legal)
server/
  index.js          — Express Static + SPA-Fallback + /healthz
supabase/
  schema.sql        — DB-Schema (decks, rounds, RLS)
  002_add_archetype.sql — Migration
public/
  icon.svg          — App-Icon
  manifest.webmanifest
  sw.js             — Service Worker
```

## Designsystem

### Farben (CSS Custom Properties)

Immer über `var(--token)` referenzieren, nie hardcoded.

| Token | Light | Dark | Verwendung |
|-------|-------|------|------------|
| `--bg` | `#f1faf2` | `#0c1613` | Seitenhintergrund |
| `--surface` | `#f7fbf8` | `#1a2b24` | Karten, Panels |
| `--panel` | `#e2f3e6` | `#122019` | Scrubber, sekundäre Flächen |
| `--ink` | `#0e2a32` | `#eaf6f0` | Primärtext |
| `--sub` | `#64837b` | `#8ba79c` | Sekundärtext, Labels |
| `--line` | `rgba(14,42,50,.08)` | `rgba(234,246,240,.08)` | Trennlinien, Borders |
| `--accent` | `#4fc3f7` | `#4fc3f7` | Primäre Akzentfarbe |
| `--accentSoft` | `#e3f4fc` | `#0f2c3a` | Akzent-Hintergrund |
| `--accentInk` | `#0b5a7a` | `#8fdcff` | Akzent-Text |
| `--good` | `#2fbf71` | — | Erfolg, Treffer |
| `--bad` | `#e04940` | — | Fehler, Löschen |
| `--warn` | `#e8a020` | — | Teilweise, Warnung |
| `--slot` | `#c4e8f5` | `#155a78` | Kartenslot-Hintergrund |
| `--shadow` | `0 1px 3px ...` | `0 1px 4px ...` | Einheitlicher Schatten |

### Typografie

- Font: `Sora` (Google Fonts), Fallback: `system-ui, sans-serif`
- Größen: `12` / `14` / `16` / `20` / `24` px
- Weights: `400` (normal), `600` (semi), `700` (bold), `800` (extra-bold für Headings)
- `fontVariantNumeric: 'tabular-nums'` für alle Zahlen (Timer, Stats, Counts)

### Spacing & Radii

- Spacing-Stufen: `4` / `6` / `8` / `10` / `12` / `16` / `18` / `20` / `24` px
- Border-Radius: `6` (klein) / `8` (Pill) / `10` (Karten, Panels) / `12` (größere Karten) / `14` (Inputs, Buttons) / `999` (voll rund)
- Screen-Padding: `16px` horizontal, Header `20px`

### Layout-Muster

- **Screen-Aufbau**: `flex: 1, minHeight: 0, display: flex, flexDirection: column`
- **Header**: `flexShrink: 0` (NICHT `position: sticky` — Flex-Layout hält ihn oben)
- **Scrollbereich**: `className="pc-scroll"` (flex: 1, overflow-y: auto)
- **Footer/NavBar**: `flexShrink: 0` am Ende
- **App-Container**: `pc-app` mit `height: 100dvh` + `overflow: hidden` — nur `pc-scroll` scrollt

### Komponenten-Patterns

- **Buttons**: `.btn .btn-primary` (Akzent) oder `.btn .btn-ghost` (transparent)
- **Inputs**: Inline-Style mit `borderRadius: 14, border: '1px solid var(--line)', background: 'var(--surface)'`
- **Karten**: `<CardFace img={} fallbackImg={} name={} radius={} fontSize={} />`
- **Icons**: SVG inline, `stroke="currentColor"`, Größe `14`–`20px`
- **Keine Emoji in UI** — nur SVG-Icons (Ausnahme: Drawer-Menü-Items)

## i18n-Regeln

- Alle UI-Strings in `src/i18n.tsx` definieren, nie hardcoded in Komponenten
- `useT()` in jeder Komponente mit sichtbarem Text
- Neue Strings: in **beiden** Sprachen (de + en) gleichzeitig hinzufügen
- Rechtstexte (`Legal.tsx`) bleiben immer Deutsch (rechtlich bindend)
- `ago()` und `parseImport()` akzeptieren optionale Übersetzungs-Parameter

## Code-Konventionen

- **Sprache im Code**: Variablen/Funktionen Englisch, Kommentare Deutsch erlaubt
- **Keine externen UI-Libraries** — alles mit Inline Styles + CSS Custom Properties
- **Keine Gamification** — kein XP, Level, Ranks, Streaks, Stars, Confetti
- **Kein over-engineering** — einfachste Lösung bevorzugen
- **Inline Styles** statt CSS-Klassen für komponentenspezifisches Styling
- **CSS Custom Properties** für alle Farben und Schatten
- **Dark Mode**: über `.pc.dark` Klasse, alle Farben über Tokens

## Git-Konventionen

- **Branch**: Direkt auf `main` (Solo-Projekt)
- **Commit-Format**: Imperative englische Überschrift, optionaler deutscher Body
  ```
  Add prize card animation on reveal

  Karten fliegen jetzt beim Aufdecken einzeln ein.

  Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
  ```
- **Co-Author**: Immer `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>` wenn Claude beteiligt war
- **Push**: Nur nach expliziter User-Bestätigung
- **Keine force-pushes** auf `main`

## Do-Not-Modify

Diese Dateien/Bereiche nicht ändern ohne explizite Anweisung:

- `supabase/*.sql` — Migrationen sind bereits ausgeführt, neue als eigene Datei
- `server/index.js` — Express-Server ist stabil, Änderungen nur bei Bedarf
- `public/icon.svg` — Logo, nur bei explizitem Redesign-Auftrag
- Demo-Decks in `game.ts` (`defaultDecks()`) — IDs `dragapult` und `ragingbolt` sind stabil, werden von History referenziert
- `ONBOARDING` Array in `game.ts` — Onboarding-Texte jetzt in `i18n.tsx`, Array bleibt als Fallback

## Tests

- **Framework**: Vitest (Vite-nativ, Jest-kompatibel)
- **Skill installiert**: `.agents/skills/vitest/`
- **Browser-Tests**: Playwright via `.agents/skills/webapp-testing/`
- **Priorität**: `game.ts` Unit-Tests (deal, score, parseImport, ago, fmt)
- **Ausführen**: `npx vitest` (watch) / `npx vitest run` (einmalig)
- **Testdateien**: `src/__tests__/*.test.ts` oder Co-located `*.test.ts`

## Ungewöhnliche Patterns

Dinge die bewusst so sind und nicht "verbessert" werden sollen:

- **Kein React Router** — Screen-State-Machine in `App.tsx` mit `useState<Screen>`. Absichtlich simpel, kein URL-Routing nötig für eine App-artige PWA.
- **Kartenbilder 2-stufiger Fallback** — `CardFace.tsx` probiert pokemontcg.io → limitlesstcg CDN → Namens-Platzhalter. Drei Quellen statt einer, weil keine API 100% Coverage hat.
- **`b` Flag auf Cards** — `b: 1|0|undefined` markiert Basis-Pokémon. Wird asynchron per API aufgelöst und in localStorage gecached (`pc_basic_v1`). Nicht refactoren — das dreistufige System in `deal()` ist absichtlich so.
- **Inline Styles überall** — bewusste Entscheidung gegen CSS-Module/Tailwind. Hält die Komplexität niedrig für ein Solo-Projekt.
- **`parseImport()` akzeptiert Fehlermeldungs-String** — für i18n, damit der Parser sprachabhängige Fehler ausgibt.

## Build & Deploy

```bash
npm run dev        # Vite Dev Server (Port 5173)
npm run build      # tsc + vite build → dist/
npm run typecheck   # Nur Typprüfung
npm start          # Express Server (Port 8080)
```

- Push auf `main` → Railway auto-deploy
- Healthcheck: `GET /healthz`
- Env-Vars für Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Ohne diese Env-Vars läuft die App im Gast-Modus (nur Demo-Decks spielbar)

## Wichtige Architektur-Entscheidungen

- **Screen-Routing**: Kein React Router — einfache State-Machine in `App.tsx`
- **Daten-Persistenz**: localStorage (Gast) oder Supabase (eingeloggt), umgeschaltet via `cloudRef`
- **Kartenbilder**: 2-stufiger Fallback (pokemontcg.io → limitlesstcg CDN → Name-Platzhalter)
- **Basis-Pokémon-Erkennung**: API-Call → `b:1|0` Flag → localStorage-Cache (`pc_basic_v1`)
- **Demo-Decks** (dragapult, ragingbolt): nicht bearbeitbar/löschbar, immer kostenlos spielbar

## Bekannte TODOs

- Impressum-Adresse ist PLATZHALTER — vor echtem Go-Live ausfüllen
- Premium/Payment (Stripe) noch nicht implementiert
- Tests fehlen komplett — Priorität: `game.ts` Unit-Tests
