import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { App } from './App'
import { I18nProvider } from './i18n'

// Gast-Modus ohne Supabase; Netz-Zugriffe (Bilder, Basis-Status, Sprites) abschalten.
vi.mock('./auth/AuthProvider', () => ({
  useAuth: () => ({ recovery: false, user: null, ready: true, configured: false, signOut: vi.fn() }),
}))
vi.mock('./cardImages', () => ({ resolveDeckImages: async () => {} }))
vi.mock('./DeckBackground', () => ({ DeckBackground: () => null }))

function renderApp() {
  render(
    <I18nProvider>
      <App />
    </I18nProvider>,
  )
}

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

function playOfflineRound(hits: number) {
  click('Start')
  click('Stopp')
  fireEvent.click(screen.getByRole('radio', { name: `${hits} von 6 richtig` }))
  click('Runde speichern')
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('pc_onboarded_v1', '1')
  localStorage.setItem('pc_lang_v1', 'de')
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(cleanup)

describe('App — Offline-Modus', () => {
  it('speichert eine Offline-Runde lokal und zeigt sie als Offline-Ergebnis', () => {
    renderApp()
    click('Mit echten Karten spielen: Dragapult ex')
    playOfflineRound(4)

    expect(screen.getByText('Dragapult ex · Offline')).toBeInTheDocument()
    expect(screen.getByText('4/6')).toBeInTheDocument()

    const stored = JSON.parse(localStorage.getItem('pc_history_v1') || '[]')
    expect(stored.at(-1)).toMatchObject({ d: 'dragapult', h: 4, m: 'offline' })
  })

  it('startet mit „Nochmal“ wieder eine Offline-Runde mit demselben Deck', () => {
    renderApp()
    click('Mit echten Karten spielen: Raging Bolt ex')
    playOfflineRound(2)
    click('Nochmal')

    expect(screen.getByRole('heading', { name: 'Mit echten Karten' })).toBeInTheDocument()
    expect(screen.getByText('Raging Bolt ex')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })

  it('zeigt die Offline-Runde im Verlauf der Statistik', () => {
    renderApp()
    click('Mit echten Karten spielen: Dragapult ex')
    playOfflineRound(5)
    click('Statistik')

    expect(screen.getAllByText(/· Offline$/)).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Offline' })).toBeInTheDocument()
  })
})
