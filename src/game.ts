// Kern-Spiellogik für Prize Checker — portiert aus dem Claude-Design-Prototyp.

export type CardType = 'P' | 'T' | 'E'

export interface Card {
  n: string // Name
  s: string // Set-Kürzel (z. B. TWM)
  c: string // Kartennummer
  api: string | null // pokemontcg.io Pfad, z. B. "sv6/128"
  t: CardType // Pokémon / Trainer / Energy
  q: number // Anzahl im Deck
  b?: number // Basis-Pokémon (mögliche aktive Position)
  img: string
  fallbackImg: string
  key: string
}

export type CardInput = Omit<Card, 'img' | 'fallbackImg' | 'key'>

export interface Deck {
  id: string
  name: string
  format: string
  cards: Card[]
  archetype?: string // Manueller Override für das Haupt-Pokémon (Hintergrund/Icon)
}

export interface Round {
  d: string // Deck-Id
  t: number // Zeit in Sekunden
  h: number // Treffer (0..6)
  ts: number // Zeitstempel
}

// Set-Kürzel -> pokemontcg.io Set-Id
export const SETMAP: Record<string, string> = {
  TWM: 'sv6',
  SFA: 'sv6pt5',
  SVI: 'sv1',
  PAL: 'sv2',
  PAR: 'sv4',
  TEF: 'sv5',
  OBF: 'sv3',
  MEW: 'sv3pt5',
  SCR: 'sv7',
  SSP: 'sv8',
  PRE: 'sv8pt5',
  JTG: 'sv9',
  DRI: 'sv10',
  SVE: 'sve',
  // Mega-Evolution-Ära (verifizierte Set-IDs)
  MEG: 'me1',
  PFL: 'me2',
  ASC: 'me2pt5',
  POR: 'me3',
  CRI: 'me4',
  PBL: 'me5',
  BLK: 'zsv10pt5',
  // Basis-Energie: "Metal Energy MEE 8" -> Basic Metal Energy sve/8
  MEE: 'sve',
}

export const ONBOARDING = [
  {
    t: 'Was sind Preiskarten?',
    b: 'Zu Beginn jedes Spiels werden 6 deiner 60 Karten verdeckt als Preise beiseitegelegt. Zu wissen, welche das sind, ist ein echter kompetitiver Vorteil.',
  },
  {
    t: 'Ausschlussprinzip',
    b: 'Schau dir deine Hand an und blättere durch dein Deck. Jede Karte, die du siehst, ist NICHT in den Preisen — was übrig bleibt, muss dort liegen.',
  },
  {
    t: 'Blättern & Auswählen',
    b: 'Wische durch den Kartenfächer und tippe Karten an, um sie anzuheben und zu zählen. Wähle dann in der Deckliste die 6 Karten, die du in den Preisen vermutest.',
  },
  {
    t: 'Dein Deck, dein Tempo',
    b: 'Importiere deine eigene Deckliste und trainiere damit. Zeit und Genauigkeit werden festgehalten, damit du deinen Fortschritt verfolgen kannst.',
  },
]

function limitlesstUrl(set: string, num: string): string {
  const pad = num.replace(/[a-z]+$/i, '').padStart(3, '0') + num.replace(/^\d+/, '')
  return `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${set}/${set}_${pad}_R_EN_LG.png`
}

export function cardsOf(list: CardInput[]): Card[] {
  return list.map((c) => ({
    ...c,
    img: c.api ? 'https://images.pokemontcg.io/' + c.api + '.png' : '',
    fallbackImg: limitlesstUrl(c.s, c.c),
    key: c.n + '|' + c.s + c.c,
  }))
}

export function defaultDecks(): Deck[] {
  const d1 = cardsOf([
    { n: 'Dreepy', s: 'TWM', c: '128', api: 'sv6/128', t: 'P', q: 4, b: 1 },
    { n: 'Drakloak', s: 'TWM', c: '129', api: 'sv6/129', t: 'P', q: 3 },
    { n: 'Dragapult ex', s: 'TWM', c: '130', api: 'sv6/130', t: 'P', q: 3 },
    { n: 'Fezandipiti ex', s: 'SFA', c: '38', api: 'sv6pt5/38', t: 'P', q: 2, b: 1 },
    { n: 'Klefki', s: 'SVI', c: '96', api: 'sv1/96', t: 'P', q: 1, b: 1 },
    { n: 'Budew', s: 'PRE', c: '4', api: 'sv8pt5/4', t: 'P', q: 1, b: 1 },
    { n: 'Buddy-Buddy Poffin', s: 'TEF', c: '144', api: 'sv5/144', t: 'T', q: 4 },
    { n: 'Ultra Ball', s: 'SVI', c: '196', api: 'sv1/196', t: 'T', q: 4 },
    { n: 'Rare Candy', s: 'SVI', c: '191', api: 'sv1/191', t: 'T', q: 4 },
    { n: 'Iono', s: 'PAL', c: '185', api: 'sv2/185', t: 'T', q: 4 },
    { n: 'Arven', s: 'SVI', c: '166', api: 'sv1/166', t: 'T', q: 3 },
    { n: "Boss's Orders", s: 'PAL', c: '172', api: 'sv2/172', t: 'T', q: 3 },
    { n: 'Counter Catcher', s: 'PAR', c: '160', api: 'sv4/160', t: 'T', q: 3 },
    { n: 'Earthen Vessel', s: 'PAR', c: '163', api: 'sv4/163', t: 'T', q: 3 },
    { n: 'Night Stretcher', s: 'SFA', c: '61', api: 'sv6pt5/61', t: 'T', q: 2 },
    { n: 'Switch', s: 'SVI', c: '194', api: 'sv1/194', t: 'T', q: 2 },
    { n: 'Nest Ball', s: 'SVI', c: '181', api: 'sv1/181', t: 'T', q: 2 },
    { n: 'Super Rod', s: 'PAL', c: '188', api: 'sv2/188', t: 'T', q: 2 },
    { n: 'TM: Evolution', s: 'PAR', c: '178', api: 'sv4/178', t: 'T', q: 2 },
    { n: 'Prime Catcher', s: 'TEF', c: '157', api: 'sv5/157', t: 'T', q: 1 },
    { n: 'Psychic Energy', s: 'SVE', c: '5', api: 'sve/5', t: 'E', q: 6 },
    { n: 'Fire Energy', s: 'SVE', c: '2', api: 'sve/2', t: 'E', q: 1 },
  ])
  const d2 = cardsOf([
    { n: 'Raging Bolt ex', s: 'TEF', c: '123', api: 'sv5/123', t: 'P', q: 4, b: 1 },
    { n: 'Teal Mask Ogerpon ex', s: 'TWM', c: '25', api: 'sv6/25', t: 'P', q: 4, b: 1 },
    { n: 'Fezandipiti ex', s: 'SFA', c: '38', api: 'sv6pt5/38', t: 'P', q: 2, b: 1 },
    { n: 'Squawkabilly ex', s: 'PAL', c: '169', api: 'sv2/169', t: 'P', q: 2, b: 1 },
    { n: "Professor Sada's Vitality", s: 'PAR', c: '170', api: 'sv4/170', t: 'T', q: 4 },
    { n: 'Earthen Vessel', s: 'PAR', c: '163', api: 'sv4/163', t: 'T', q: 4 },
    { n: 'Nest Ball', s: 'SVI', c: '181', api: 'sv1/181', t: 'T', q: 4 },
    { n: 'Ultra Ball', s: 'SVI', c: '196', api: 'sv1/196', t: 'T', q: 4 },
    { n: 'Iono', s: 'PAL', c: '185', api: 'sv2/185', t: 'T', q: 3 },
    { n: "Boss's Orders", s: 'PAL', c: '172', api: 'sv2/172', t: 'T', q: 3 },
    { n: 'Switch', s: 'SVI', c: '194', api: 'sv1/194', t: 'T', q: 3 },
    { n: 'Night Stretcher', s: 'SFA', c: '61', api: 'sv6pt5/61', t: 'T', q: 3 },
    { n: 'Prime Catcher', s: 'TEF', c: '157', api: 'sv5/157', t: 'T', q: 2 },
    { n: 'Lightning Energy', s: 'SVE', c: '4', api: 'sve/4', t: 'E', q: 10 },
    { n: 'Fighting Energy', s: 'SVE', c: '6', api: 'sve/6', t: 'E', q: 8 },
  ])
  return [
    { id: 'dragapult', name: 'Dragapult ex', format: 'Standard', cards: d1 },
    { id: 'ragingbolt', name: 'Raging Bolt ex', format: 'Standard', cards: d2 },
  ]
}

// Demo-Decks: im Gast-Modus ohne Account spielbar.
export const DEMO_DECK_IDS = ['dragapult', 'ragingbolt']

export function isDemoDeck(deck: Deck): boolean {
  return DEMO_DECK_IDS.includes(deck.id)
}

export function seedHistory(): Round[] {
  const now = Date.now()
  const h: Round[] = []
  const mk = (d: string, t: number, hi: number, ago: number) =>
    h.push({ d, t, h: hi, ts: now - ago * 864e5 })
  mk('dragapult', 94.2, 3, 9)
  mk('dragapult', 81.5, 4, 8)
  mk('ragingbolt', 77.0, 4, 7)
  mk('dragapult', 76.8, 4, 6)
  mk('dragapult', 70.1, 5, 5)
  mk('ragingbolt', 68.3, 5, 4)
  mk('dragapult', 66.4, 4, 3)
  mk('dragapult', 61.9, 6, 2)
  mk('ragingbolt', 59.5, 5, 1)
  mk('dragapult', 55.0, 6, 0.5)
  return h
}

export function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec - m * 60
  return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1)
}

export function ago(ts: number, labels?: { justNow: string; hoursAgo: (h: number) => string; daysAgo: (d: number) => string }): string {
  const d = (Date.now() - ts) / 36e5
  if (labels) {
    if (d < 1) return labels.justNow
    if (d < 24) return labels.hoursAgo(Math.round(d))
    return labels.daysAgo(Math.round(d / 24))
  }
  if (d < 1) return 'gerade eben'
  if (d < 24) return Math.round(d) + 'h her'
  return Math.round(d / 24) + 'd her'
}

export interface GameState {
  deck: Deck
  active: Card
  hand: Card[]
  prizes: Card[]
  rest: Card[]
  sel: Record<string, number>
  fanPos: number
  raised: Record<number, boolean>
  start: number
  end?: number
}

// Liest den Basis-Status-Cache aus localStorage (von cardImages.ts befüllt).
function loadBasicCache(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem('pc_basic_v1') || '{}')
  } catch {
    return {}
  }
}

// Prüft ob eine Karte ein Basis-Pokémon ist. Nutzt: Card.b → Cache → Heuristik.
function isBasic(c: Card, cache: Record<string, string>): boolean | null {
  if (c.b === 1) return true
  if (c.b === 0) return false
  if (c.api && cache[c.api] !== undefined) return cache[c.api] === '1'
  // Heuristik: "Mega X" ist nie Basis
  if (c.n.startsWith('Mega ')) return false
  return null // unbekannt
}

// Instanzen aus Deck bilden, mischen und Hand/Preise/aktive Position austeilen.
export function deal(deck: Deck): GameState {
  const inst: Card[] = []
  deck.cards.forEach((c) => {
    for (let i = 0; i < c.q; i++) inst.push(c)
  })
  for (let i = inst.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[inst[i], inst[j]] = [inst[j], inst[i]]
  }
  const basicCache = loadBasicCache()
  // 1. Persistierte Basis-Pokémon (b === 1, gesetzt nach API-Auflösung + Speichern)
  let cand = inst.map((c, i) => (c.b === 1 ? i : -1)).filter((i) => i >= 0)
  if (!cand.length) {
    // 2. Pokémon die NICHT als Nicht-Basis bestätigt sind (via b-Flag, Cache oder Mega-Heuristik).
    //    Unter den verbleibenden → höchste Kopienanzahl bevorzugen.
    const pokemon = inst
      .map((c, i) =>
        c.t === 'P' && isBasic(c, basicCache) !== false
          ? { i, q: c.q }
          : null,
      )
      .filter((x): x is { i: number; q: number } => x !== null)
    if (pokemon.length) {
      const maxQ = Math.max(...pokemon.map((p) => p.q))
      cand = pokemon.filter((p) => p.q === maxQ).map((p) => p.i)
    }
  }
  // 3. Irgendein Pokémon
  if (!cand.length) cand = inst.map((c, i) => (c.t === 'P' ? i : -1)).filter((i) => i >= 0)
  // 4. Irgendeine Karte
  if (!cand.length) cand = inst.map((_, i) => i)
  const active = inst.splice(cand[Math.floor(Math.random() * cand.length)], 1)[0]
  const hand = inst.slice(0, 7)
  const prizes = inst.slice(7, 13)
  const rest = inst.slice(13)
  return {
    deck,
    active,
    hand,
    prizes,
    rest,
    sel: {},
    fanPos: 0,
    raised: {},
    start: Date.now(),
  }
}

export interface RevealRow {
  name: string
  img: string
  fallbackImg: string
  picked: number
  actual: number
  st: 'hit' | 'part' | 'miss' | 'missed'
}

export interface Result {
  time: number
  hits: number
  rows: RevealRow[]
  deck: Deck
}

// Auswahl gegen die tatsächlichen Preise auswerten.
export function score(g: GameState): Result {
  const actual: Record<string, number> = {}
  g.prizes.forEach((c) => {
    actual[c.key] = (actual[c.key] || 0) + 1
  })
  let hits = 0
  Object.keys(g.sel).forEach((k) => {
    hits += Math.min(g.sel[k] || 0, actual[k] || 0)
  })
  const time = ((g.end || Date.now()) - g.start) / 1000
  const byKey: Record<string, Card> = {}
  g.deck.cards.forEach((c) => (byKey[c.key] = c))
  const keys = [
    ...new Set([...Object.keys(g.sel).filter((k) => g.sel[k] > 0), ...Object.keys(actual)]),
  ]
  const order = { hit: 0, part: 1, missed: 2, miss: 3 }
  const rows: RevealRow[] = keys
    .map((k) => {
      const p = g.sel[k] || 0
      const a = actual[k] || 0
      const c = byKey[k]
      const st: RevealRow['st'] = p > 0 && a > 0 ? (p === a ? 'hit' : 'part') : p > 0 ? 'miss' : 'missed'
      return { name: c.n, img: c.img, fallbackImg: c.fallbackImg, picked: p, actual: a, st }
    })
    .sort((x, y) => order[x.st] - order[y.st])
  return { time, hits, rows, deck: g.deck }
}

// --- Deck-abhängiges Aussehen ---

// Stabiler Farbton (0..360) aus einem String (Deck-Name), für ein dezentes,
// deckabhängiges Hintergrund-Tint. Bewusst niedrig gesättigt einsetzen.
export function hueOf(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360
  return h
}

// Haupt-Pokémon eines Decks (Archetype), Basis für Hintergrund & Farbe.
// Priorisiert: manueller Override > Mega ex > reguläres ex > erstes Pokémon.
export function starCard(deck: Deck): Card {
  if (deck.archetype) {
    const found = deck.cards.find((c) => c.n === deck.archetype)
    if (found) return found
  }
  const pokemon = deck.cards.filter((c) => c.t === 'P')
  const exCards = pokemon.filter((c) => /\bex$/i.test(c.n))
  if (exCards.length) {
    const mega = exCards.filter((c) => c.n.startsWith('Mega '))
    const pool = mega.length ? mega : exCards
    return pool.reduce((a, b) => (a.q >= b.q ? a : b))
  }
  return pokemon[0] || deck.cards[0]
}

export interface ParseResult {
  pk: number
  tr: number
  en: number
  total: number
  errors: { line: number; msg: string }[]
  cards: CardInput[]
}

// Deckliste im Standard-TCG-Format parsen ("4 Dreepy TWM 128").
export function parseImport(text: string, parseExpected?: string): ParseResult {
  const lines = (text || '').split('\n')
  let pk = 0
  let tr = 0
  let en = 0
  let sec: CardType = 'P'
  const errors: { line: number; msg: string }[] = []
  const cards: CardInput[] = []
  const expectedMsg = parseExpected ?? '— erwartet "4 Name SET 123"'
  lines.forEach((raw, i) => {
    const line = raw.trim()
    if (!line) return
    const h = line.match(/^(Pok|Trainer|Energ)/i)
    if (h) {
      sec = /^Pok/i.test(line) ? 'P' : /^Trainer/i.test(line) ? 'T' : 'E'
      return
    }
    const m = line.match(/^(\d+)\s+(.+?)\s+([A-Za-z]{2,5})\s+(\d+[a-z]?)$/)
    if (!m) {
      errors.push({
        line: i + 1,
        msg: '"' + (line.length > 28 ? line.slice(0, 28) + '…' : line) + '" ' + expectedMsg,
      })
      return
    }
    const q = +m[1]
    const set = m[3].toUpperCase()
    const api = SETMAP[set] ? SETMAP[set] + '/' + m[4] : null
    cards.push({ n: m[2], s: set, c: m[4], api, t: sec, q })
    if (sec === 'P') pk += q
    else if (sec === 'T') tr += q
    else en += q
  })
  return { pk, tr, en, total: pk + tr + en, errors, cards }
}

// Deck-Karten zurück ins Standard-Import-Format konvertieren.
export function deckToText(deck: Deck): string {
  const sections: Record<CardType, Card[]> = { P: [], T: [], E: [] }
  deck.cards.forEach((c) => sections[c.t].push(c))
  const labels: Record<CardType, string> = { P: 'Pokémon', T: 'Trainer', E: 'Energy' }
  const lines: string[] = []
  for (const t of ['P', 'T', 'E'] as CardType[]) {
    const cards = sections[t]
    if (!cards.length) continue
    const total = cards.reduce((a, c) => a + c.q, 0)
    lines.push(`${labels[t]}: ${total}`)
    cards.forEach((c) => lines.push(`${c.q} ${c.n} ${c.s} ${c.c}`))
    lines.push('')
  }
  return lines.join('\n').trim()
}
