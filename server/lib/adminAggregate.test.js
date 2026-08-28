// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { buildStats, buildUsersList, buildUsage, buildDecksSummary } from './adminAggregate.js'

const DAY = 86_400_000
const NOW = new Date('2026-08-28T12:00:00.000Z').getTime()

function iso(ts) {
  return new Date(ts).toISOString()
}

describe('buildStats', () => {
  it('zählt Accounts/Decks/Runden und Signups der letzten 7/30 Tage', () => {
    const users = [
      { id: 'u1', created_at: iso(NOW - 1 * DAY) }, // in 7d & 30d
      { id: 'u2', created_at: iso(NOW - 10 * DAY) }, // nur 30d
      { id: 'u3', created_at: iso(NOW - 40 * DAY) }, // keins
    ]
    const decks = [{ user_id: 'u1', id: 'd1' }]
    const rounds = [
      { user_id: 'u1', ts: NOW },
      { user_id: 'u1', ts: NOW },
    ]

    const stats = buildStats(users, decks, rounds, NOW)

    expect(stats).toEqual({
      totalUsers: 3,
      totalDecks: 1,
      totalRounds: 2,
      newUsersLast7d: 1,
      newUsersLast30d: 2,
    })
  })
})

describe('buildUsersList', () => {
  it('aggregiert Deck-/Rundenzahl pro Account, erkennt aktive Sperren und sortiert nach Registrierung absteigend', () => {
    const users = [
      { id: 'u1', email: 'a@example.com', created_at: iso(NOW - 5 * DAY), last_sign_in_at: iso(NOW - 1 * DAY) },
      { id: 'u2', email: 'b@example.com', created_at: iso(NOW - 1 * DAY), banned_until: iso(NOW + DAY) }, // aktiv gesperrt
      { id: 'u3', email: 'c@example.com', created_at: iso(NOW - 10 * DAY), banned_until: iso(NOW - DAY) }, // abgelaufene Sperre
    ]
    const decks = [
      { user_id: 'u1', id: 'd1' },
      { user_id: 'u1', id: 'd2' },
    ]
    const rounds = [
      { user_id: 'u1', ts: NOW - 2 * DAY },
      { user_id: 'u1', ts: NOW - 1 * DAY },
    ]

    const list = buildUsersList(users, decks, rounds)

    expect(list.map((u) => u.id)).toEqual(['u2', 'u1', 'u3']) // neueste zuerst
    const u1 = list.find((u) => u.id === 'u1')
    expect(u1.deckCount).toBe(2)
    expect(u1.roundCount).toBe(2)
    expect(u1.lastRoundAt).toBe(NOW - 1 * DAY)
    expect(u1.banned).toBe(false)
    expect(list.find((u) => u.id === 'u2').banned).toBe(true)
    expect(list.find((u) => u.id === 'u3').banned).toBe(false) // Sperre abgelaufen
    expect(list.find((u) => u.id === 'u3').roundCount).toBe(0)
    expect(list.find((u) => u.id === 'u3').lastRoundAt).toBeNull()
  })
})

describe('buildUsage', () => {
  it('bildet pro Tag Runden/Ø-Dauer/Ø-Genauigkeit/Signups/aktive Nutzer', () => {
    const today = NOW
    const yesterday = NOW - DAY
    const users = [{ id: 'u1', created_at: iso(today) }]
    const rounds = [
      { user_id: 'u1', ts: yesterday, t: 40, h: 3 },
      { user_id: 'u1', ts: yesterday, t: 60, h: 6 },
      { user_id: 'u2', ts: today, t: 30, h: 0 },
    ]

    const usage = buildUsage(users, rounds, 2, today)

    expect(usage).toHaveLength(2)
    const [dayBefore, current] = usage
    expect(dayBefore.roundsPlayed).toBe(2)
    expect(dayBefore.avgDurationSec).toBe(50)
    expect(dayBefore.avgAccuracy).toBeCloseTo(0.75, 5) // (0.5 + 1) / 2
    expect(dayBefore.activeUsers).toBe(1)
    expect(dayBefore.newUsers).toBe(0)

    expect(current.roundsPlayed).toBe(1)
    expect(current.newUsers).toBe(1)
    expect(current.activeUsers).toBe(1)
  })

  it('liefert für Tage ohne Runden Nullen statt NaN', () => {
    const usage = buildUsage([], [], 1, NOW)
    expect(usage[0]).toMatchObject({ roundsPlayed: 0, avgDurationSec: 0, avgAccuracy: 0, activeUsers: 0, newUsers: 0 })
  })
})

describe('buildDecksSummary', () => {
  it('joint Runden über (user_id, deck-id) mit dem Deck und gruppiert nach Archetyp', () => {
    const decks = [
      { user_id: 'u1', id: 'd1', name: 'Dragapult ex', archetype: 'Dragapult' },
      { user_id: 'u2', id: 'd1', name: 'Dragapult Variant', archetype: 'Dragapult' }, // gleiche lokale id, anderer User
      { user_id: 'u2', id: 'd2', name: 'Charizard ex', archetype: null }, // fällt auf name zurück
    ]
    const rounds = [
      { user_id: 'u1', d: 'd1', h: 6 },
      { user_id: 'u2', d: 'd1', h: 3 },
      { user_id: 'u2', d: 'd2', h: 0 },
    ]

    const summary = buildDecksSummary(decks, rounds)

    expect(summary).toEqual([
      { label: 'Dragapult', roundCount: 2, avgAccuracy: 0.75 }, // (1 + 0.5) / 2
      { label: 'Charizard ex', roundCount: 1, avgAccuracy: 0 },
    ])
  })

  it('begrenzt auf die angegebene Anzahl', () => {
    const decks = Array.from({ length: 25 }, (_, i) => ({ user_id: 'u1', id: `d${i}`, name: `Deck ${i}`, archetype: null }))
    const rounds = decks.map((d) => ({ user_id: 'u1', d: d.id, h: 3 }))

    const summary = buildDecksSummary(decks, rounds, 20)

    expect(summary).toHaveLength(20)
  })
})
