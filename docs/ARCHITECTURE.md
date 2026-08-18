# Prized — Technische Dokumentation

Architektur, Datenfluss und die wichtigsten Module. Für Setup siehe die [README](../README.md).

## Überblick

Prized ist eine **rein clientseitige Single-Page-App** (Vite + React 18 + TypeScript).
Spiel-Logik und Daten laufen im Browser. Ein Express-Server liefert im Produktionsbetrieb
nur die statischen Build-Artefakte aus. Optional lässt sich Supabase für Accounts und
Cloud-Sync anbinden.

```
Browser (React SPA)
  ├── localStorage             ← Decks, Verlauf, Einstellungen (Gast-Modus)
  ├── Supabase (optional)      ← Auth + Cloud-Sync
  ├── pokemontcg.io API        ← Set-/Karten-Auflösung + Basis-Status
  ├── images.pokemontcg.io     ← Kartenbilder (primär)
  └── limitlesstcg CDN         ← Kartenbilder (Fallback)

server/index.js (Express)      ← dist/ ausliefern, SPA-Fallback, /healthz
```

## Projektstruktur

```
src/
  App.tsx              Screen-State-Machine + globaler Zustand
  game.ts              Kern-Spiellogik: parseImport, deal, score, SETMAP
  storage.ts           localStorage-Persistenz (Decks + Verlauf)
  sync.ts              Supabase-Lese-/Schreib-Helfer (Cloud-Sync)
  cardImages.ts        Karten-Bild-Auflösung + Basis-Status-Erkennung
  CardFace.tsx         Kartenbild mit 2-stufigem Fallback
  DeckBackground.tsx   Archetype-basierter dekorativer Hintergrund
  auth/                Supabase-Client + AuthProvider (React Context)
  components/Drawer.tsx  Seitenmenü (Theme, Account, Rechtstexte)
  screens/             Onboarding, Home, ImportScreen, GameScreen,
                       Reveal, Stats, Login, AccountSettings,
                       ResetPassword, Paywall, Legal, NavBar
server/index.js        Express-Static-Server (Produktion)
public/                icon.svg, manifest.webmanifest, sw.js
```

## Screen-State-Machine (`App.tsx`)

Statt eines Routers steuert ein `screen`-State das aktive Bild. Werte:
`onboarding · home · import · game · reveal · stats · login · account ·
paywall · impressum · datenschutz · agb`.

Globaler Zustand in `App`: `decks`, `history`, `game`, `result`, `theme`, `premium`.

## Spiel-Logik (`game.ts`)

- **`parseImport(text)`** — parst Decklisten (`4 Dragapult ex TWM 130`) in `CardInput[]`.
  Bild-Pfad `api` wird deterministisch aus `SETMAP` gebaut, sonst `null`.
- **`cardsOf(cards)`** — ergänzt `img` (pokemontcg.io), `fallbackImg` (limitlesstcg CDN)
  und `key`.
- **`deal(deck)`** — mischt, zieht Preiskarten + Starthand. Aktives Pokémon muss ein
  Basis-Pokémon sein (3-stufig: persistiertes `b=1` → Cache-Ausschluss + Qty-Heuristik → Fallback).
- **`deckToText(deck)`** — konvertiert Cards zurück ins Import-Format (für Deck-Bearbeitung).
- **`score(state)`** — wertet Treffer (0–6) und Zeit aus.
- **`starCard(deck)`** — Archetype-Erkennung: Mega ex > ex > Pokémon, nach Kopienanzahl.
  `Deck.archetype` als manueller Override.
- **`SETMAP`** — Set-Kürzel → pokemontcg.io-Set-ID. Erweitern bei neuen Sets.

## Kartenbilder: 2-stufiger Fallback

1. **pokemontcg.io** (primär) — `images.pokemontcg.io/<setId>/<nummer>.png`. Set-ID
   über `SETMAP` oder Laufzeit-Auflösung via `/sets`-Endpoint.
2. **limitlesstcg CDN** (Fallback) — `limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/{SET}/{SET}_{NUM}_R_EN_LG.png`.
   Wird automatisch probiert wenn pokemontcg.io kein Bild hat oder den 640×892-Kartenrücken liefert.
3. **Namens-Platzhalter** — blauer Slot mit Kartenname, wenn beide Quellen fehlschlagen.

`cardImages.ts` löst zusätzlich den **Basis-Status** auf: für jedes Pokémon wird via
`/cards/{id}?select=subtypes` geprüft ob es ein Basic ist (`b: 1|0`). Gecacht in localStorage
(`pc_basic_v1`). Der Resolution-Effect in `App.tsx` triggert auch wenn alle Bilder vorhanden
sind aber Pokémon noch `b=undefined` haben — sonst würde Phase 2 nie laufen.

## Raise-Guard (Anti-Cheat)

Im Deck-Fächer können Karten angehoben werden um sie zu zählen. Zum Schutz vor
Deck-Durchleuchtung:
- **Typ-Lock**: Erste angehobene Karte bestimmt den erlaubten Typ (P/T/E).
- **Count-only**: Shelf zeigt nur die Anzahl, nicht das Verhältnis.
- **Visueller Hinweis**: Clock-Ring färbt sich von grün über blau zu warm-rot.

## Deck-Hintergrund (`DeckBackground.tsx`)

Archetype-basiert: `starCard()` bestimmt das Haupt-Pokémon, `speciesOf()` leitet den
PokeAPI-Speziesnamen ab (behandelt "Mega X ex" → "x"). Sprite-Quellen:
1. PokeAPI (96×96 Pixel-Sprite + Pokédex-Farbe für Gradient)
2. limitlesstcg (`r2.limitlesstcg.net/pokemon/gen9/{species}.png`, 41×34)
3. Nur Farbverlauf (aus `hueOf(deckName)`)

## Persistenz & Sync

- **Gast-Modus:** `storage.ts` — Decks und Verlauf in `localStorage`.
- **Angemeldet:** `sync.ts` — Decks und Runden nach Supabase gespiegelt.

## Server & Deployment

- **`server/index.js`** — Express: static, SPA-Fallback, `/healthz`. Port via `PORT`.
- **`railway.json`** — NIXPACKS-Builder, `healthcheckPath: /healthz`.
- **Railway** — Auto-Deploy bei Push auf `main`.

## Konventionen

- UI-Texte sind **deutsch**.
- Karten **überlappen** im Design (Fächer) — nicht durch Grid ersetzen.
- SVG-Icons statt Emoji. Flat Colors statt Gradients. Minimale Shadows.
- Border-radius: 8/10/12. Font-Größen: 12/14/16/20. Weights: 400/600/700.
