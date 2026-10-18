import { describe, it, expect, vi, beforeEach } from 'vitest'

// Minimaler Supabase-Ersatz: zeichnet Inserts auf und liefert vorgegebene Zeilen.
const inserted: unknown[] = []
let rows: unknown[] = []
let loadError: unknown = null
const selected: string[] = []
vi.mock('../auth/supabase', () => ({
  supabase: {
    from: () => ({
      insert: async (row: unknown) => {
        inserted.push(row)
        return { error: null }
      },
      select: (cols: string) => {
        selected.push(cols)
        return { order: async () => (loadError ? { data: null, error: loadError } : { data: rows, error: null }) }
      },
    }),
  },
}))

import { cloudInsertRound, cloudLoadDecks, cloudLoadHistory } from '../sync'

beforeEach(() => {
  inserted.length = 0
  selected.length = 0
  rows = []
  loadError = null
})

describe('cloudInsertRound', () => {
  it('schreibt den Modus einer Offline-Runde mit', async () => {
    await cloudInsertRound('u1', { d: 'a', t: 90, h: 5, ts: 2, m: 'offline' })
    expect(inserted).toEqual([{ user_id: 'u1', d: 'a', t: 90, h: 5, ts: 2, m: 'offline' }])
  })

  it('lässt den Modus bei digitalen Runden weg (Insert funktioniert auch ohne Migration 004)', async () => {
    await cloudInsertRound('u1', { d: 'a', t: 60, h: 4, ts: 1 })
    expect(inserted).toEqual([{ user_id: 'u1', d: 'a', t: 60, h: 4, ts: 1 }])
  })
})

describe('cloudLoadHistory', () => {
  it('lädt den Modus und lässt ihn bei digitalen Runden weg', async () => {
    rows = [
      { d: 'a', t: 60, h: 4, ts: 1, m: null },
      { d: 'a', t: 90, h: 5, ts: 2, m: 'offline' },
    ]
    expect(await cloudLoadHistory()).toEqual([
      { d: 'a', t: 60, h: 4, ts: 1 },
      { d: 'a', t: 90, h: 5, ts: 2, m: 'offline' },
    ])
    expect(selected[0].split(',')).toContain('m')
  })
})

describe('Ladefehler', () => {
  // Ein Fehler (z. B. fehlende Spalte) darf nicht wie eine leere Cloud aussehen,
  // sonst kopiert App.tsx die lokalen Daten erneut hoch (Duplikate).
  it('liefert null statt [] für die History', async () => {
    loadError = { message: 'column rounds.m does not exist' }
    expect(await cloudLoadHistory()).toBeNull()
  })

  it('liefert null statt [] für die Decks', async () => {
    loadError = { message: 'boom' }
    expect(await cloudLoadDecks()).toBeNull()
  })
})
