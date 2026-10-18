import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, fireEvent } from '@testing-library/react'
import { OfflineScreen } from './OfflineScreen'
import { I18nProvider } from '../i18n'
import { defaultDecks } from '../game'

const deck = defaultDecks()[0]
const START = 1_700_000_000_000

function renderOffline() {
  const onSave = vi.fn()
  const onQuit = vi.fn()
  render(
    <I18nProvider>
      <OfflineScreen deck={deck} onSave={onSave} onQuit={onQuit} />
    </I18nProvider>,
  )
  return { onSave, onQuit }
}

function playFor(ms: number) {
  fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  act(() => {
    vi.advanceTimersByTime(ms)
  })
  fireEvent.click(screen.getByRole('button', { name: 'Stopp' }))
}

beforeEach(() => {
  localStorage.setItem('pc_lang_v1', 'de')
  vi.useFakeTimers({ now: START })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('OfflineScreen', () => {
  it('startet erst auf Knopfdruck und zeigt das Deck', () => {
    renderOffline()
    expect(screen.getByText(deck.name)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Stopp' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })

  it('misst die Zeit bis zum Stopp und speichert die eingetragenen Treffer als Offline-Runde', () => {
    const { onSave } = renderOffline()
    playFor(83_437)

    expect(screen.getByText('1:23.4')).toBeInTheDocument()
    const save = screen.getByRole('button', { name: 'Runde speichern' })
    expect(save).toBeDisabled()

    const four = screen.getByRole('radio', { name: '4 von 6 richtig' })
    fireEvent.click(four)
    expect(four).toBeChecked()
    expect(screen.getAllByRole('radio')).toHaveLength(7)

    fireEvent.click(save)
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith({ d: deck.id, t: 83.4, h: 4, ts: START + 83_437, m: 'offline' })
  })

  it('lässt auch 0 Treffer zu', () => {
    const { onSave } = renderOffline()
    playFor(5_000)
    fireEvent.click(screen.getByRole('radio', { name: '0 von 6 richtig' }))
    fireEvent.click(screen.getByRole('button', { name: 'Runde speichern' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ h: 0, t: 5 }))
  })

  it('verwirft die Runde ohne zu speichern', () => {
    const { onSave, onQuit } = renderOffline()
    playFor(10_000)
    fireEvent.click(screen.getByRole('radio', { name: '3 von 6 richtig' }))
    fireEvent.click(screen.getByRole('button', { name: 'Verwerfen' }))
    expect(onQuit).toHaveBeenCalledTimes(1)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('kann vor dem Start ohne Runde verlassen werden', () => {
    const { onSave, onQuit } = renderOffline()
    fireEvent.click(screen.getByRole('button', { name: 'Zurück' }))
    expect(onQuit).toHaveBeenCalledTimes(1)
    expect(onSave).not.toHaveBeenCalled()
  })
})

describe('OfflineScreen — Schutz und Fokus', () => {
  it('blendet „Zurück“ nach dem Start aus, damit eine laufende Runde nicht versehentlich verloren geht', () => {
    renderOffline()
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(screen.queryByRole('button', { name: 'Zurück' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Stopp' }))
    expect(screen.queryByRole('button', { name: 'Zurück' })).not.toBeInTheDocument()
  })

  it('setzt nach dem Stopp den Fokus auf die Treffer-Frage', () => {
    renderOffline()
    playFor(3_000)
    expect(screen.getByRole('group', { name: 'Wie viele der 6 Preiskarten hattest du richtig?' })).toHaveFocus()
  })
})

describe('OfflineScreen — Wake Lock', () => {
  const release = vi.fn(async () => {})
  const request = vi.fn(async () => ({ release }))

  beforeEach(() => {
    release.mockClear()
    request.mockClear()
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
  })

  afterEach(() => {
    delete (navigator as unknown as Record<string, unknown>).wakeLock
  })

  it('hält das Display nur während der Messung wach', async () => {
    renderOffline()
    expect(request).not.toHaveBeenCalled()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    })
    expect(request).toHaveBeenCalledWith('screen')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stopp' }))
    })
    expect(release).toHaveBeenCalledTimes(1)
  })
})
