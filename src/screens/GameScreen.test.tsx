import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { useState } from 'react'
import { act, cleanup, render, screen, fireEvent, within } from '@testing-library/react'
import { GameScreen } from './GameScreen'
import { I18nProvider } from '../i18n'
import { cardsOf, type Deck, type GameState } from '../game'

// Hintergrund lädt Sprites aus dem Netz — für die Bedienung irrelevant.
vi.mock('../DeckBackground', () => ({ DeckBackground: () => null }))

const [ultra, psychic, dreepy, nest, klefki] = cardsOf([
  { n: 'Ultra Ball', s: 'SVI', c: '196', api: 'sv1/196', t: 'T', q: 4 },
  { n: 'Psychic Energy', s: 'SVE', c: '5', api: 'sve/5', t: 'E', q: 6 },
  { n: 'Dreepy', s: 'TWM', c: '128', api: 'sv6/128', t: 'P', q: 4, b: 1 },
  { n: 'Nest Ball', s: 'SVI', c: '181', api: 'sv1/181', t: 'T', q: 2 },
  { n: 'Klefki', s: 'SVI', c: '96', api: 'sv1/96', t: 'P', q: 1, b: 1 },
])

const deck: Deck = { id: 'test', name: 'Test', format: 'Standard', cards: [ultra, psychic, dreepy, nest, klefki] }

function makeGame(overrides: Partial<GameState> = {}): GameState {
  return {
    deck,
    active: dreepy,
    hand: [ultra, psychic, nest],
    prizes: [psychic, psychic, dreepy, ultra, nest, psychic],
    // Restdeck: Ultra Ball, Psychic Energy, Ultra Ball, Dreepy, Nest Ball
    rest: [ultra, psychic, ultra, dreepy, nest],
    sel: {},
    fanPos: 0,
    raised: {},
    start: Date.now(),
    ...overrides,
  }
}

function Harness({ onConfirm, initial }: { onConfirm: (g: GameState) => void; initial?: Partial<GameState> }) {
  const [game, setGame] = useState(() => makeGame(initial))
  return (
    <I18nProvider>
      <GameScreen game={game} dark={false} onChange={setGame} onQuit={() => {}} onConfirm={onConfirm} />
    </I18nProvider>
  )
}

function renderGame(initial?: Partial<GameState>) {
  const onConfirm = vi.fn()
  render(<Harness onConfirm={onConfirm} initial={initial} />)
  return { onConfirm }
}

const deckCards = (name: string) => screen.getAllByRole('button', { name: new RegExp(`^${name}, \\d+ von 5$`) })

beforeEach(() => {
  localStorage.setItem('pc_lang_v1', 'de')
  Element.prototype.scrollIntoView = vi.fn()
})

// Ohne Vitest-Globals räumt Testing Library nicht automatisch auf.
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('GameScreen — Tisch (Kaskade)', () => {
  it('zeigt jede Deckkarte als eigene Schaltfläche mit Name und Position', () => {
    renderGame()
    expect(deckCards('Ultra Ball')).toHaveLength(2)
    expect(deckCards('Psychic Energy')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Ultra Ball, 1 von 5' })).toBeInTheDocument()
  })

  it('hebt eine Karte per Antippen an und senkt sie wieder ab', () => {
    renderGame()
    const [first] = deckCards('Ultra Ball')
    expect(first).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(first)
    expect(first).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(first)
    expect(first).toHaveAttribute('aria-pressed', 'false')
  })

  it('zeigt im Regal vor dem ersten Anheben einen Hinweis und zählt dort angehobene Karten', () => {
    renderGame()
    expect(screen.getByText('Tippe Karten an, um sie anzuheben')).toBeInTheDocument()
    deckCards('Ultra Ball').forEach((b) => fireEvent.click(b))
    expect(screen.getByRole('button', { name: 'Ultra Ball: 2 angehoben' })).toBeInTheDocument()
    expect(screen.queryByText('Tippe Karten an, um sie anzuheben')).not.toBeInTheDocument()
  })

  it('springt beim Tipp aufs Regal zur ersten angehobenen Kopie', () => {
    renderGame()
    const ultras = deckCards('Ultra Ball')
    fireEvent.click(ultras[1])
    fireEvent.click(ultras[0])
    fireEvent.click(screen.getByRole('button', { name: 'Ultra Ball: 2 angehoben' }))
    const scroll = vi.mocked(Element.prototype.scrollIntoView)
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(scroll.mock.contexts[0]).toBe(ultras[0])
  })

  it('kennzeichnet durch die Typ-Sperre blockierte Karten und erklärt sie beim Antippen', () => {
    renderGame()
    const [energy] = deckCards('Psychic Energy')
    expect(energy).not.toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(deckCards('Ultra Ball')[0])
    expect(energy).toHaveAttribute('aria-disabled', 'true')
    expect(deckCards('Nest Ball')[0]).not.toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(energy)
    expect(energy).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('status')).toHaveTextContent('Nur Trainer anhebbar')
  })

  it('behält Scroll-Position und angehobene Karten über den Tab-Wechsel', () => {
    renderGame()
    fireEvent.click(deckCards('Ultra Ball')[1])
    // Bewusst ohne Scroll-Event: im Hintergrund-Tab kommt das u. U. nie an.
    screen.getByRole('group', { name: 'Deck' }).scrollTop = 600

    fireEvent.click(screen.getByRole('tab', { name: /Deckliste/ }))
    fireEvent.click(screen.getByRole('tab', { name: 'Tisch' }))

    expect(screen.getByRole('group', { name: 'Deck' }).scrollTop).toBe(600)
    expect(deckCards('Ultra Ball')[1]).toHaveAttribute('aria-pressed', 'true')
  })

  it('lässt sich per Pfeiltasten durchgehen, mit nur einem Tab-Stopp', () => {
    renderGame()
    const cards = screen.getAllByRole('button', { name: /, \d+ von 5$/ })
    expect(cards.filter((c) => c.tabIndex === 0)).toHaveLength(1)

    cards[0].focus()
    fireEvent.keyDown(cards[0], { key: 'ArrowDown' })
    expect(cards[1]).toHaveFocus()
    expect(cards.map((c) => c.tabIndex)).toEqual([-1, 0, -1, -1, -1])
    fireEvent.keyDown(cards[1], { key: 'End' })
    expect(cards[4]).toHaveFocus()
    fireEvent.keyDown(cards[4], { key: 'ArrowUp' })
    expect(cards[3]).toHaveFocus()
  })

  it('lässt Pfeiltasten mit Alt/Cmd/Strg dem Browser (z. B. Alt+← = Zurück)', () => {
    renderGame()
    const cards = screen.getAllByRole('button', { name: /, \d+ von 5$/ })
    cards[2].focus()
    fireEvent.keyDown(cards[2], { key: 'ArrowUp', altKey: true })
    fireEvent.keyDown(cards[2], { key: 'ArrowDown', metaKey: true })
    expect(cards[2]).toHaveFocus()
  })

  it('merkt sich die fokussierte Karte über den Tab-Wechsel', () => {
    renderGame()
    let cards = screen.getAllByRole('button', { name: /, \d+ von 5$/ })
    cards[0].focus()
    fireEvent.keyDown(cards[0], { key: 'End' })

    fireEvent.click(screen.getByRole('tab', { name: /Deckliste/ }))
    fireEvent.click(screen.getByRole('tab', { name: 'Tisch' }))

    cards = screen.getAllByRole('button', { name: /, \d+ von 5$/ })
    expect(cards.map((c) => c.tabIndex)).toEqual([-1, -1, -1, -1, 0])
  })

  it('blendet den Hinweis nach kurzer Zeit und beim Tab-Wechsel aus', () => {
    vi.useFakeTimers()
    renderGame()
    fireEvent.click(deckCards('Ultra Ball')[0])
    fireEvent.click(deckCards('Psychic Energy')[0])
    expect(screen.getByRole('status')).toHaveTextContent('Nur Trainer anhebbar')
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByRole('status')).toBeEmptyDOMElement()

    fireEvent.click(deckCards('Psychic Energy')[0])
    fireEvent.click(screen.getByRole('tab', { name: /Deckliste/ }))
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})

describe('GameScreen — Tabs und Uhr', () => {
  it('wechselt die Tabs auch per Pfeiltaste und verknüpft sie mit ihrem Bereich', () => {
    renderGame()
    const table = screen.getByRole('tab', { name: 'Tisch' })
    expect(table).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Tisch' })).toBeInTheDocument()

    table.focus()
    fireEvent.keyDown(table, { key: 'ArrowRight' })
    const list = screen.getByRole('tab', { name: /Deckliste/ })
    expect(list).toHaveAttribute('aria-selected', 'true')
    expect(list).toHaveFocus()
    expect(screen.getByRole('tabpanel', { name: /Deckliste/ })).toBeInTheDocument()
  })

  it('zählt die Zeit selbstständig hoch', () => {
    vi.useFakeTimers()
    vi.setSystemTime(100_000)
    renderGame({ start: 100_000 })
    expect(screen.getByText('0:00')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(2_100)
    })
    expect(screen.getByText('0:02')).toBeInTheDocument()
  })

  it('bleibt nach Rundenende stehen', () => {
    vi.useFakeTimers()
    vi.setSystemTime(100_000)
    renderGame({ start: 90_000, end: 95_000 })
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(screen.getByText('0:05')).toBeInTheDocument()
  })
})

describe('GameScreen — Deckliste (Auswahl)', () => {
  const openList = () => fireEvent.click(screen.getByRole('tab', { name: /Deckliste/ }))
  const pick = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name} – `) })

  it('zeigt Hand und Aktiv auch beim Auswählen', () => {
    renderGame()
    openList()
    expect(within(screen.getByRole('group', { name: 'Hand' })).getAllByRole('img')).toHaveLength(3)
    expect(within(screen.getByRole('group', { name: 'Aktiv' })).getAllByRole('img')).toHaveLength(1)
  })

  it('wählt per Antippen eine Kopie mehr und per „−“ eine weniger', () => {
    renderGame()
    openList()
    fireEvent.click(pick('Ultra Ball'))
    fireEvent.click(pick('Ultra Ball'))
    expect(pick('Ultra Ball')).toHaveAccessibleName('Ultra Ball – 2 von 4 gewählt')

    fireEvent.click(screen.getByRole('button', { name: 'Eine Kopie abwählen: Ultra Ball' }))
    expect(pick('Ultra Ball')).toHaveAccessibleName('Ultra Ball – 1 von 4 gewählt')
  })

  it('springt bei allen Kopien nicht zurück auf 0 und sagt warum', () => {
    renderGame()
    openList()
    fireEvent.click(pick('Nest Ball'))
    fireEvent.click(pick('Nest Ball'))
    fireEvent.click(pick('Nest Ball'))
    expect(pick('Nest Ball')).toHaveAccessibleName('Nest Ball – 2 von 2 gewählt')
    expect(screen.getByRole('status')).toHaveTextContent('Alle 2 Kopien gewählt')
  })

  it('formuliert den Hinweis bei Einzelkarten richtig', () => {
    renderGame()
    openList()
    fireEvent.click(pick('Klefki'))
    fireEvent.click(pick('Klefki'))
    expect(screen.getByRole('status')).toHaveTextContent('Einzige Kopie schon gewählt')
  })

  it('erklärt bei 6 gewählten Karten, warum keine weitere geht, und gibt Bestätigen frei', () => {
    const { onConfirm } = renderGame()
    openList()
    const confirm = screen.getByRole('button', { name: 'Bestätigen' })
    for (let i = 0; i < 5; i++) fireEvent.click(pick('Psychic Energy'))
    expect(confirm).toBeDisabled()

    fireEvent.click(pick('Psychic Energy'))
    expect(confirm).toBeEnabled()

    fireEvent.click(pick('Ultra Ball'))
    expect(pick('Ultra Ball')).toHaveAccessibleName('Ultra Ball – 0 von 4 gewählt')
    expect(screen.getByRole('status')).toHaveTextContent('6 von 6 gewählt')

    fireEvent.click(confirm)
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onConfirm.mock.calls[0][0].sel).toEqual({ [psychic.key]: 6 })
  })
})
