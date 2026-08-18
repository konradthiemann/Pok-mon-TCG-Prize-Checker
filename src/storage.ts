import { type Deck, type Round, cardsOf, defaultDecks, seedHistory, type CardInput } from './game'

const HISTORY_KEY = 'pc_history_v1'
const DECKS_KEY = 'pc_decks_v1'

// Beim Speichern nur die Roh-Eingaben behalten; img/key werden neu abgeleitet.
interface StoredDeck {
  id: string
  name: string
  format: string
  cards: CardInput[]
  archetype?: string
}

function isValidRound(r: unknown): r is Round {
  return (
    typeof r === 'object' && r !== null &&
    typeof (r as Round).d === 'string' &&
    typeof (r as Round).t === 'number' && (r as Round).t > 0 &&
    typeof (r as Round).h === 'number' && (r as Round).h >= 0 && (r as Round).h <= 6 &&
    typeof (r as Round).ts === 'number' && (r as Round).ts > 0
  )
}

export function loadHistory(): Round[] {
  try {
    const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || 'null')
    if (Array.isArray(h) && h.length && h.every(isValidRound)) return h
  } catch {
    /* ignore */
  }
  return seedHistory()
}

export function saveHistory(h: Round[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h))
  } catch {
    /* ignore */
  }
}

function isValidStoredDeck(d: unknown): d is StoredDeck {
  return (
    typeof d === 'object' && d !== null &&
    typeof (d as StoredDeck).id === 'string' &&
    typeof (d as StoredDeck).name === 'string' &&
    Array.isArray((d as StoredDeck).cards)
  )
}

export function loadDecks(): Deck[] {
  try {
    const raw = JSON.parse(localStorage.getItem(DECKS_KEY) || 'null')
    if (Array.isArray(raw) && raw.length && raw.every(isValidStoredDeck)) {
      return raw.map((d) => ({ ...d, archetype: d.archetype, cards: cardsOf(d.cards) }))
    }
  } catch {
    /* ignore */
  }
  return defaultDecks()
}

export function saveDecks(decks: Deck[]): void {
  try {
    const raw: StoredDeck[] = decks.map((d) => ({
      id: d.id,
      name: d.name,
      format: d.format,
      archetype: d.archetype,
      cards: d.cards.map(({ n, s, c, api, t, q, b }) => ({ n, s, c, api, t, q, b })),
    }))
    localStorage.setItem(DECKS_KEY, JSON.stringify(raw))
  } catch {
    /* ignore */
  }
}
