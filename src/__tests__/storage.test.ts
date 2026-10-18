import { describe, it, expect, beforeEach } from 'vitest'
import { loadHistory } from '../storage'
import { seedHistory } from '../game'

const KEY = 'pc_history_v1'

beforeEach(() => localStorage.clear())

describe('loadHistory', () => {
  it('lädt Offline-Runden mit Modus-Feld', () => {
    const h = [
      { d: 'dragapult', t: 60, h: 4, ts: 1 },
      { d: 'dragapult', t: 90, h: 5, ts: 2, m: 'offline' },
    ]
    localStorage.setItem(KEY, JSON.stringify(h))
    expect(loadHistory()).toEqual(h)
  })

  it('verwirft nur ungültige Einträge (z. B. unbekannter Modus) und behält den Rest', () => {
    const valid = { d: 'dragapult', t: 60, h: 4, ts: 1 }
    localStorage.setItem(KEY, JSON.stringify([valid, { d: 'dragapult', t: 60, h: 4, ts: 2, m: 'foo' }]))
    expect(loadHistory()).toEqual([valid])
  })

  it('fällt auf die Seed-History zurück, wenn kein Eintrag gültig ist', () => {
    localStorage.setItem(KEY, JSON.stringify([{ d: 'dragapult', t: 60, h: 4, ts: 1, m: 'foo' }]))
    expect(loadHistory()).toHaveLength(seedHistory().length)
  })
})
