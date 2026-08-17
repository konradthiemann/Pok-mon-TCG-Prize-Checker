# Prized — Technische Dokumentation

Diese Datei beschreibt Architektur, Datenfluss und die wichtigsten Module von Prized.
Für Setup und Überblick siehe die [README](../README.md).

## Überblick

Prized ist eine **rein clientseitige Single-Page-App** (Vite + React 18 + TypeScript).
Es gibt keinen eigenen Backend-Zustand: Spiel-Logik und Daten laufen im Browser. Ein
kleiner Express-Server liefert im Produktionsbetrieb nur die statischen Build-Artefakte
aus. Optional lässt sich Supabase anbinden, um Accounts und Cloud-Sync zu aktivieren.

```
Browser (React SPA)
  ├── localStorage           ← Decks, Verlauf, Einstellungen (Gast-Modus)
  ├── Supabase (optional)    ← Auth + Cloud-Sync von Decks/Verlauf
  ├── pokemontcg.io API      ← Set-/Karten-Auflösung (bei Bedarf)
  └── images.pokemontcg.io   ← Kartenbilder (CDN)

server/index.js (Express)    ← liefert dist/ aus, SPA-Fallback, /healthz
```

## Projektstruktur

```
src/
  App.tsx              Screen-State-Machine + globaler Zustand (Decks, Verlauf, Theme)
  game.ts              Kern-Spiellogik: parseImport, deal, score, XP/Level, SETMAP
  storage.ts           localStorage-Persistenz (Decks + Verlauf)
  sync.ts              Supabase-Lese-/Schreib-Helfer (Cloud-Sync)
  cardImages.ts        Laufzeit-Auflösung von Karten-Bild-Pfaden (Fallback)
  CardFace.tsx         Kartenbild mit Namens-Fallback + Placeholder-Erkennung
  DeckBackground.tsx   dekorativer Hintergrund
  auth/                Supabase-Client + AuthProvider (React Context)
  components/Drawer.tsx  Seitenmenü (Theme, Account, Rechtstexte)
  screens/             Onboarding, Home, ImportScreen, DeckBuilder, GameScreen,
                       Reveal, Stats, Login, AccountSettings, ResetPassword,
                       Paywall, Legal, NavBar
server/index.js        Express-Static-Server (Produktion)
public/                icon.svg (Logo), manifest.webmanifest, sw.js (Service Worker)
```

## Screen-State-Machine (`App.tsx`)

Statt eines Routers steuert ein `screen`-State das aktive Bild. Werte:
`onboarding · home · import · builder · game · reveal · stats · login · account ·
paywall · impressum · datenschutz · agb`.

Globaler Zustand liegt in `App`: `decks`, `history`, `game`, `result`, `theme`,
`premium`. Beim Login-Wechsel werden Daten aus der Cloud geladen bzw. (bei erster
Anmeldung) die lokalen Daten migriert.

## Spiel-Logik (`game.ts`)

- **`parseImport(text)`** – parst eine Deckliste (`4 Dragapult ex TWM 130`) in
  `CardInput[]` inkl. Zähl-Summen und Zeilen-Fehlern. Baut den Bild-Pfad `api`
  deterministisch aus `SETMAP` (`<setId>/<nummer>`), sonst `null`.
- **`cardsOf(cards)`** – expandiert Mengen zu Einzelkarten und ergänzt `img` + `key`.
- **`deal(deck)`** – zieht zufällig 6 Preiskarten + Starthand, erzeugt den `GameState`.
- **`score(state)`** – wertet Treffer (`hits` 0–6) und Zeit aus.
- **Gamification** – `earnXp = hits*120 + max(0, 45 - t)*4`, `XP_PER_LEVEL = 600`,
  dazu `starsFor`, `rankFor`, `dayStreak`, `progressOf(history)`.
- **`SETMAP`** – Set-Kürzel → pokemontcg.io-Set-ID (z. B. `TWM → sv6`, `CRI → me4`,
  `MEE → sve`). Erweitern, sobald neue Sets erscheinen.

## Kartenbilder: Auflösung & Fallback

Bilder kommen von `https://images.pokemontcg.io/<setId>/<nummer>.png`. Die
pokemontcg.io-API ist zeitweise instabil, daher die mehrstufige, defensive Strategie:

1. **`SETMAP` (deterministisch, offline):** Ist das Set-Kürzel bekannt, wird der
   Bild-Pfad ohne API-Abfrage gebaut. Das ist der Normalfall.
2. **`cardImages.ts` (`resolveCardApi`)** – Fallback für unbekannte Kürzel: löst die
   Set-ID über den `/sets`-Endpoint auf (gecacht in `localStorage`), sonst über
   Name + Nummer über `/cards`. Transiente Netzwerkfehler werden mit Backoff
   wiederholt und **nicht** negativ gecacht.
3. **`CardFace.tsx`** – zeigt das Bild; bei fehlendem/kaputtem Bild **oder** wenn die
   CDN nur den generischen 640×892-Karten-Rücken liefert (Scan noch nicht
   veröffentlicht), wird auf den **Karten-Namen** zurückgefallen. Echte Vorderseiten
   sind 245×342. Erscheint später der echte Scan, zeigt die App ihn automatisch.

> Grundsatz: Ein Deck bleibt **immer spielbar** – notfalls mit Namen statt Bild.

## Persistenz & Sync

- **Gast-Modus:** `storage.ts` liest/schreibt Decks und Verlauf in `localStorage`.
- **Angemeldet:** `sync.ts` spiegelt Decks (`cloudUpsertDeck`, `cloudLoadDecks`) und
  Runden (`cloudInsertRound`, `cloudLoadHistory`) nach Supabase. `AuthProvider`
  (React Context) hält Session/User; `hasSupabase` schaltet Auth nur bei gesetzten
  Keys frei.

## Freemium-Gating

Demo-Decks sind frei spielbar (`isDeckFree`). Eigene Decks sind ohne Premium
(`localStorage: pc_premium_v1`) hinter der `Paywall` gesperrt. Zahlungsanbindung folgt.

## Rechtstexte (`screens/Legal.tsx`)

Impressum, Datenschutz und Nutzungsbedingungen sind ein einzelner Screen, gesteuert
über `doc: 'impressum' | 'datenschutz' | 'agb'`, erreichbar aus dem `Drawer`-Menü.
Die Kontakt-/Anschriftsdaten stehen zentral in der `OPERATOR`-Konstante.

## Server & Deployment

- **`server/index.js`** – Express: `express.static(dist)`, SPA-Fallback auf
  `index.html`, Health-Check unter `/healthz`. Port via `PORT` (Default 8080).
- **`railway.json`** – NIXPACKS-Builder, `healthcheckPath: /healthz`.
- **Railway** – Auto-Deploy bei Push auf `main`. Custom-Domain
  `prized.konradthiemann.de` (CNAME auf die Railway-App).

## Konventionen

- UI-Texte sind **deutsch**.
- Karten **überlappen** im Design (Fächer/Stapel) – nicht durch ein Grid ersetzen.
- Kommentare erklären das *Warum*, nicht das *Was*.
