import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { Home } from './Home'
import { I18nProvider } from '../i18n'
import { cardsOf, defaultDecks, type Deck } from '../game'

const imported: Deck = {
  id: 'd1',
  name: 'Eigenes Deck',
  format: 'Standard',
  cards: cardsOf([{ n: 'Dreepy', s: 'TWM', c: '128', api: 'sv6/128', t: 'P', q: 60, b: 1 }]),
}
const decks = [...defaultDecks(), imported]

function renderHome(loggedIn: boolean) {
  const onOffline = vi.fn()
  const onPlay = vi.fn()
  render(
    <I18nProvider>
      <Home
        decks={decks}
        history={[]}
        loggedIn={loggedIn}
        onMenu={() => {}}
        onPlay={onPlay}
        onOffline={onOffline}
        onImport={() => {}}
        onStats={() => {}}
        onDelete={() => {}}
        onRename={() => {}}
        onEdit={() => {}}
      />
    </I18nProvider>,
  )
  return { onOffline, onPlay }
}

beforeEach(() => localStorage.setItem('pc_lang_v1', 'de'))
afterEach(cleanup)

describe('Home — Offline-Start', () => {
  it('startet über den Stoppuhr-Button eine Offline-Runde mit dem Deck', () => {
    const { onOffline, onPlay } = renderHome(false)
    fireEvent.click(screen.getByRole('button', { name: 'Mit echten Karten spielen: Dragapult ex' }))
    expect(onOffline).toHaveBeenCalledWith(decks[0])
    expect(onPlay).not.toHaveBeenCalled()
  })

  it('sperrt den Stoppuhr-Button für Gäste bei importierten Decks', () => {
    renderHome(false)
    const btn = screen.getByRole('button', { name: 'Mit echten Karten spielen: Eigenes Deck' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAccessibleDescription('Konto nötig')
  })

  it('erlaubt eingeloggten Nutzern Offline-Runden mit importierten Decks', () => {
    const { onOffline } = renderHome(true)
    fireEvent.click(screen.getByRole('button', { name: 'Mit echten Karten spielen: Eigenes Deck' }))
    expect(onOffline).toHaveBeenCalledWith(imported)
  })
})
