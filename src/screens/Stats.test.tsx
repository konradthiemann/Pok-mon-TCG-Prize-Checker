import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { Stats } from './Stats'
import { I18nProvider } from '../i18n'
import { defaultDecks, type Round } from '../game'

const decks = defaultDecks()
const now = Date.now()

function renderStats(history: Round[]) {
  render(
    <I18nProvider>
      <Stats decks={decks} history={history} onMenu={() => {}} onHome={() => {}} />
    </I18nProvider>,
  )
}

const avgTime = () => screen.getByText('Ø Zeit').previousElementSibling?.textContent

beforeEach(() => localStorage.setItem('pc_lang_v1', 'de'))
afterEach(cleanup)

describe('Stats — Spielmodus', () => {
  const mixed: Round[] = [
    { d: 'dragapult', t: 50, h: 4, ts: now - 3000 },
    { d: 'dragapult', t: 90, h: 5, ts: now - 2000, m: 'offline' },
    { d: 'ragingbolt', t: 100, h: 6, ts: now - 1000, m: 'offline' },
  ]

  it('zeigt keinen Modus-Filter, solange es keine Offline-Runden gibt', () => {
    renderStats([{ d: 'dragapult', t: 50, h: 4, ts: now }])
    expect(screen.queryByRole('button', { name: 'Offline' })).not.toBeInTheDocument()
  })

  it('filtert Kennzahlen nach Spielmodus', () => {
    renderStats(mixed)
    expect(avgTime()).toBe('1:20.0')

    fireEvent.click(screen.getByRole('button', { name: 'Offline' }))
    expect(screen.getByRole('button', { name: 'Offline' })).toHaveAttribute('aria-pressed', 'true')
    expect(avgTime()).toBe('1:35.0')

    fireEvent.click(screen.getByRole('button', { name: 'Digital' }))
    expect(avgTime()).toBe('0:50.0')

    fireEvent.click(screen.getByRole('button', { name: 'Alle' }))
    expect(avgTime()).toBe('1:20.0')
  })

  it('kennzeichnet Offline-Runden im Verlauf', () => {
    renderStats(mixed)
    expect(screen.getAllByText(/· Offline$/)).toHaveLength(2)
  })
})

describe('Stats — Verlaufs-Chart', () => {
  it('zeigt das Chart erst ab zwei Runden (eine Runde ergibt keine Linie)', () => {
    renderStats([{ d: 'dragapult', t: 50, h: 4, ts: now }])
    expect(screen.queryByText('Zeit')).not.toBeInTheDocument()
  })

  it('zeigt das Chart ab zwei Runden', () => {
    renderStats([
      { d: 'dragapult', t: 50, h: 4, ts: now - 1000 },
      { d: 'dragapult', t: 60, h: 5, ts: now },
    ])
    expect(screen.getByText('Zeit')).toBeInTheDocument()
  })
})
