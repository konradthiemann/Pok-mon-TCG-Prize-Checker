import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fmt,
  ago,
  hueOf,
  cardsOf,
  parseImport,
  deckToText,
  deal,
  score,
  starCard,
  isDemoDeck,
  defaultDecks,
  seedHistory,
  type Card,
  type CardInput,
  type Deck,
  type GameState,
} from '../game'

// --- fmt ---

describe('fmt', () => {
  it('formats seconds under a minute', () => {
    expect(fmt(45.3)).toBe('0:45.3')
  })

  it('formats exactly 60 seconds', () => {
    expect(fmt(60)).toBe('1:00.0')
  })

  it('formats minutes and seconds', () => {
    expect(fmt(94.2)).toBe('1:34.2')
  })

  it('pads single-digit seconds', () => {
    expect(fmt(65.1)).toBe('1:05.1')
  })

  it('handles zero', () => {
    expect(fmt(0)).toBe('0:00.0')
  })
})

// --- ago ---

describe('ago', () => {
  it('returns "gerade eben" for recent timestamps', () => {
    expect(ago(Date.now() - 1000)).toBe('gerade eben')
  })

  it('returns hours for timestamps within a day', () => {
    const fiveHoursAgo = Date.now() - 5 * 3600_000
    expect(ago(fiveHoursAgo)).toBe('5h her')
  })

  it('returns days for older timestamps', () => {
    const threeDaysAgo = Date.now() - 3 * 86400_000
    expect(ago(threeDaysAgo)).toBe('3d her')
  })

  it('uses custom labels when provided', () => {
    const labels = {
      justNow: 'just now',
      hoursAgo: (h: number) => `${h}h ago`,
      daysAgo: (d: number) => `${d}d ago`,
    }
    expect(ago(Date.now() - 1000, labels)).toBe('just now')
    expect(ago(Date.now() - 5 * 3600_000, labels)).toBe('5h ago')
    expect(ago(Date.now() - 3 * 86400_000, labels)).toBe('3d ago')
  })
})

// --- hueOf ---

describe('hueOf', () => {
  it('returns a number between 0 and 359', () => {
    const h = hueOf('Dragapult ex')
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThan(360)
  })

  it('is deterministic', () => {
    expect(hueOf('test')).toBe(hueOf('test'))
  })

  it('produces different values for different strings', () => {
    expect(hueOf('Dragapult ex')).not.toBe(hueOf('Raging Bolt ex'))
  })
})

// --- cardsOf ---

describe('cardsOf', () => {
  const input: CardInput[] = [
    { n: 'Dreepy', s: 'TWM', c: '128', api: 'sv6/128', t: 'P', q: 4, b: 1 },
    { n: 'Ultra Ball', s: 'SVI', c: '196', api: null, t: 'T', q: 4 },
  ]

  it('generates img URL from api field', () => {
    const cards = cardsOf(input)
    expect(cards[0].img).toBe('https://images.pokemontcg.io/sv6/128.png')
  })

  it('sets empty img when api is null', () => {
    const cards = cardsOf(input)
    expect(cards[1].img).toBe('')
  })

  it('generates fallbackImg from limitlesstcg CDN', () => {
    const cards = cardsOf(input)
    expect(cards[0].fallbackImg).toContain('limitlesstcg')
    expect(cards[0].fallbackImg).toContain('TWM_128')
  })

  it('generates unique keys', () => {
    const cards = cardsOf(input)
    expect(cards[0].key).toBe('Dreepy|TWM128')
    expect(cards[1].key).toBe('Ultra Ball|SVI196')
  })
})

// --- parseImport ---

describe('parseImport', () => {
  it('parses a standard deck list', () => {
    const text = `Pokémon: 14
4 Dreepy TWM 128
3 Drakloak TWM 129

Trainer: 39
4 Ultra Ball SVI 196

Energy: 7
7 Psychic Energy SVE 5`

    const r = parseImport(text)
    expect(r.pk).toBe(7)
    expect(r.tr).toBe(4)
    expect(r.en).toBe(7)
    expect(r.total).toBe(18)
    expect(r.errors).toHaveLength(0)
    expect(r.cards).toHaveLength(4)
  })

  it('resolves known set codes to API paths', () => {
    const r = parseImport('4 Dreepy TWM 128')
    expect(r.cards[0].api).toBe('sv6/128')
  })

  it('returns null api for unknown set codes', () => {
    const r = parseImport('4 Dreepy XXX 128')
    expect(r.cards[0].api).toBeNull()
  })

  it('reports errors for malformed lines', () => {
    const r = parseImport('this is not a card')
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0].line).toBe(1)
  })

  it('skips empty lines', () => {
    const r = parseImport('\n\n4 Dreepy TWM 128\n\n')
    expect(r.cards).toHaveLength(1)
    expect(r.errors).toHaveLength(0)
  })

  it('detects section headers and switches card type', () => {
    const text = `Pokémon: 4
4 Dreepy TWM 128
Trainer: 4
4 Ultra Ball SVI 196
Energy: 1
1 Psychic Energy SVE 5`

    const r = parseImport(text)
    expect(r.cards[0].t).toBe('P')
    expect(r.cards[1].t).toBe('T')
    expect(r.cards[2].t).toBe('E')
  })

  it('handles card numbers with letter suffix', () => {
    const r = parseImport('1 Charizard MEW 6a')
    expect(r.cards[0].c).toBe('6a')
  })

  it('uses custom error message', () => {
    const r = parseImport('bad line', '— expected "4 Name SET 123"')
    expect(r.errors[0].msg).toContain('— expected')
  })

  it('truncates long malformed lines in error', () => {
    const longLine = 'a'.repeat(50) + ' no match'
    const r = parseImport(longLine)
    expect(r.errors[0].msg).toContain('…')
  })
})

// --- deckToText ---

describe('deckToText', () => {
  it('round-trips a parsed deck list', () => {
    const original = `Pokémon: 4
4 Dreepy TWM 128

Trainer: 4
4 Ultra Ball SVI 196

Energy: 7
7 Psychic Energy SVE 5`

    const parsed = parseImport(original)
    const deck: Deck = {
      id: 'test',
      name: 'Test',
      format: 'Standard',
      cards: cardsOf(parsed.cards),
    }
    const text = deckToText(deck)
    const reparsed = parseImport(text)
    expect(reparsed.total).toBe(parsed.total)
    expect(reparsed.cards).toHaveLength(parsed.cards.length)
  })

  it('groups cards by type with headers', () => {
    const text = deckToText({
      id: 't',
      name: 'T',
      format: 'S',
      cards: cardsOf([
        { n: 'Dreepy', s: 'TWM', c: '128', api: 'sv6/128', t: 'P', q: 4 },
        { n: 'Fire Energy', s: 'SVE', c: '2', api: 'sve/2', t: 'E', q: 6 },
      ]),
    })
    expect(text).toContain('Pokémon: 4')
    expect(text).toContain('Energy: 6')
    expect(text).not.toContain('Trainer')
  })
})

// --- deal ---

describe('deal', () => {
  // Mock localStorage for deal() which reads pc_basic_v1
  beforeEach(() => {
    const store: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v },
      removeItem: (k: string) => { delete store[k] },
    })
  })

  const testDeck = (): Deck => defaultDecks()[0]

  it('deals 1 active + 7 hand + 6 prizes + rest', () => {
    const g = deal(testDeck())
    expect(g.hand).toHaveLength(7)
    expect(g.prizes).toHaveLength(6)
    const totalCards = 1 + g.hand.length + g.prizes.length + g.rest.length
    expect(totalCards).toBe(60)
  })

  it('selects a basic Pokémon as active when available', () => {
    const deck = testDeck()
    // Run multiple times to account for randomness
    let foundBasic = false
    for (let i = 0; i < 20; i++) {
      const g = deal(deck)
      if (g.active.b === 1) {
        foundBasic = true
        break
      }
    }
    expect(foundBasic).toBe(true)
  })

  it('initializes game state correctly', () => {
    const g = deal(testDeck())
    expect(g.sel).toEqual({})
    expect(g.raised).toEqual({})
    expect(g.fanPos).toBe(0)
    expect(g.start).toBeGreaterThan(0)
    expect(g.end).toBeUndefined()
  })
})

// --- score ---

describe('score', () => {
  function makeGame(deck: Deck, prizes: Card[], sel: Record<string, number>): GameState {
    return {
      deck,
      active: deck.cards[0],
      hand: [],
      prizes,
      rest: [],
      sel,
      fanPos: 0,
      raised: {},
      start: Date.now() - 30000,
      end: Date.now(),
    }
  }

  it('counts perfect hits', () => {
    const deck = defaultDecks()[0]
    const prizes = [deck.cards[0], deck.cards[0], deck.cards[1], deck.cards[1], deck.cards[2], deck.cards[2]]
    const sel: Record<string, number> = {
      [deck.cards[0].key]: 2,
      [deck.cards[1].key]: 2,
      [deck.cards[2].key]: 2,
    }
    const r = score(makeGame(deck, prizes, sel))
    expect(r.hits).toBe(6)
    expect(r.rows.every((row) => row.st === 'hit')).toBe(true)
  })

  it('counts zero hits when nothing matches', () => {
    const deck = defaultDecks()[0]
    const prizes = [deck.cards[0], deck.cards[0], deck.cards[0], deck.cards[0], deck.cards[0], deck.cards[0]]
    const sel: Record<string, number> = {
      [deck.cards[5].key]: 6,
    }
    const r = score(makeGame(deck, prizes, sel))
    expect(r.hits).toBe(0)
  })

  it('detects partial matches', () => {
    const deck = defaultDecks()[0]
    const prizes = [deck.cards[0], deck.cards[0], deck.cards[0], deck.cards[1], deck.cards[1], deck.cards[1]]
    const sel: Record<string, number> = {
      [deck.cards[0].key]: 1, // picked 1, actual 3 → part
    }
    const r = score(makeGame(deck, prizes, sel))
    expect(r.hits).toBe(1)
    const partRow = r.rows.find((row) => row.st === 'part')
    expect(partRow).toBeDefined()
  })

  it('calculates time from start/end', () => {
    const deck = defaultDecks()[0]
    const g = makeGame(deck, [], {})
    const r = score(g)
    expect(r.time).toBeCloseTo(30, 0)
  })

  it('marks missed prizes', () => {
    const deck = defaultDecks()[0]
    const prizes = [deck.cards[0]]
    const sel: Record<string, number> = {}
    const r = score(makeGame(deck, prizes, sel))
    const missed = r.rows.find((row) => row.st === 'missed')
    expect(missed).toBeDefined()
  })
})

// --- starCard ---

describe('starCard', () => {
  it('returns archetype override when set', () => {
    const deck = defaultDecks()[0]
    deck.archetype = 'Dreepy'
    const star = starCard(deck)
    expect(star.n).toBe('Dreepy')
  })

  it('prefers ex cards by quantity', () => {
    const deck = defaultDecks()[0]
    const star = starCard(deck)
    expect(star.n).toContain('ex')
  })

  it('prefers Mega ex over regular ex', () => {
    const cards = cardsOf([
      { n: 'Mega Charizard ex', s: 'MEG', c: '1', api: null, t: 'P', q: 2 },
      { n: 'Pikachu ex', s: 'SVI', c: '1', api: null, t: 'P', q: 4 },
    ])
    const deck: Deck = { id: 't', name: 'T', format: 'S', cards }
    expect(starCard(deck).n).toBe('Mega Charizard ex')
  })

  it('falls back to first Pokémon if no ex cards', () => {
    const cards = cardsOf([
      { n: 'Pikachu', s: 'SVI', c: '1', api: null, t: 'P', q: 4 },
      { n: 'Ultra Ball', s: 'SVI', c: '196', api: null, t: 'T', q: 4 },
    ])
    const deck: Deck = { id: 't', name: 'T', format: 'S', cards }
    expect(starCard(deck).n).toBe('Pikachu')
  })

  it('falls back to first card if no Pokémon', () => {
    const cards = cardsOf([
      { n: 'Ultra Ball', s: 'SVI', c: '196', api: null, t: 'T', q: 4 },
    ])
    const deck: Deck = { id: 't', name: 'T', format: 'S', cards }
    expect(starCard(deck).n).toBe('Ultra Ball')
  })
})

// --- isDemoDeck ---

describe('isDemoDeck', () => {
  it('identifies demo decks', () => {
    const decks = defaultDecks()
    expect(isDemoDeck(decks[0])).toBe(true)
    expect(isDemoDeck(decks[1])).toBe(true)
  })

  it('rejects non-demo decks', () => {
    expect(isDemoDeck({ id: 'custom', name: 'X', format: 'S', cards: [] })).toBe(false)
  })
})

// --- defaultDecks ---

describe('defaultDecks', () => {
  it('returns two 60-card decks', () => {
    const decks = defaultDecks()
    expect(decks).toHaveLength(2)
    for (const d of decks) {
      const total = d.cards.reduce((a, c) => a + c.q, 0)
      expect(total).toBe(60)
    }
  })
})

// --- seedHistory ---

describe('seedHistory', () => {
  it('returns 10 rounds', () => {
    expect(seedHistory()).toHaveLength(10)
  })

  it('all rounds have valid fields', () => {
    for (const r of seedHistory()) {
      expect(r.d).toBeTruthy()
      expect(r.t).toBeGreaterThan(0)
      expect(r.h).toBeGreaterThanOrEqual(0)
      expect(r.h).toBeLessThanOrEqual(6)
      expect(r.ts).toBeGreaterThan(0)
    }
  })
})
