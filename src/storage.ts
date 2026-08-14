import { type Deck, type Round, cardsOf, defaultDecks, seedHistory, type CardInput } from './game'

const HISTORY_KEY = 'pc_history_v1'
const DECKS_KEY = 'pc_decks_v1'

// Beim Speichern nur die Roh-Eingaben behalten; img/key werden neu abgeleitet.
interface StoredDeck {
  id: string
  name: string
  format: string
  cards: CardInput[]
}

export function loadHistory(): Round[] {
  try {
    const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || 'null')
    if (Array.isArray(h) && h.length) return h
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

export function loadDecks(): Deck[] {
  try {
    const raw = JSON.parse(localStorage.getItem(DECKS_KEY) || 'null') as StoredDeck[] | null
    if (Array.isArray(raw) && raw.length) {
      return raw.map((d) => ({ ...d, cards: cardsOf(d.cards) }))
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
      cards: d.cards.map(({ n, s, c, api, t, q, b }) => ({ n, s, c, api, t, q, b })),
    }))
    localStorage.setItem(DECKS_KEY, JSON.stringify(raw))
  } catch {
    /* ignore */
  }
}
