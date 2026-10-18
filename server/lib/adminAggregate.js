// Reine Aggregations-Funktionen für die /api/admin/*-Endpoints. Bewusst
// getrennt von der Supabase-Anbindung, damit die eigentliche Auswertungs-
// logik ohne Netzwerk/Mocks testbar ist — die Routen selbst holen nur die
// Rohdaten und reichen sie hier durch.

const DAY_MS = 86_400_000

function round2(n) {
  return Math.round(n * 100) / 100
}

function groupByUserId(rows) {
  const map = new Map()
  for (const row of rows) {
    const list = map.get(row.user_id)
    if (list) list.push(row)
    else map.set(row.user_id, [row])
  }
  return map
}

function isBanned(user, now) {
  if (!user.banned_until) return false
  return new Date(user.banned_until).getTime() > now
}

function startOfUTCDay(ts) {
  const d = new Date(ts)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

// Offline-Runden (echte Karten, Treffer selbst eingetragen, Spalte m) zählen als
// Aktivität, fließen aber nicht in Ø-Dauer/Ø-Genauigkeit ein — ihre Werte sind
// mit digitalen Runden nicht vergleichbar.
function isOffline(round) {
  return round.m === 'offline'
}

function dateKey(ts) {
  return new Date(ts).toISOString().slice(0, 10)
}

export function buildStats(users, decks, rounds, now = Date.now()) {
  const newSince = (ms) => users.filter((u) => now - new Date(u.created_at).getTime() < ms).length
  return {
    totalUsers: users.length,
    totalDecks: decks.length,
    totalRounds: rounds.length,
    totalOfflineRounds: rounds.filter(isOffline).length,
    newUsersLast7d: newSince(7 * DAY_MS),
    newUsersLast30d: newSince(30 * DAY_MS),
  }
}

export function buildUsersList(users, decks, rounds, now = Date.now()) {
  const decksByUser = groupByUserId(decks)
  const roundsByUser = groupByUserId(rounds)

  return users
    .map((user) => {
      const userDecks = decksByUser.get(user.id) ?? []
      const userRounds = roundsByUser.get(user.id) ?? []
      const lastRoundAt = userRounds.length ? Math.max(...userRounds.map((r) => r.ts)) : null
      return {
        id: user.id,
        email: user.email ?? null,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        banned: isBanned(user, now),
        deckCount: userDecks.length,
        roundCount: userRounds.length,
        lastRoundAt,
      }
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function buildUsage(users, rounds, days, now = Date.now()) {
  const today = startOfUTCDay(now)
  const buckets = []
  for (let i = days - 1; i >= 0; i--) {
    buckets.push(dateKey(today - i * DAY_MS))
  }

  const byDate = new Map(
    buckets.map((date) => [
      date,
      { date, roundsPlayed: 0, offlineRounds: 0, digitalRounds: 0, durationSum: 0, accuracySum: 0, newUsers: 0, activeUserIds: new Set() },
    ]),
  )

  for (const r of rounds) {
    const bucket = byDate.get(dateKey(startOfUTCDay(r.ts)))
    if (!bucket) continue
    bucket.roundsPlayed++
    bucket.activeUserIds.add(r.user_id)
    if (isOffline(r)) {
      bucket.offlineRounds++
      continue
    }
    bucket.digitalRounds++
    bucket.durationSum += r.t
    bucket.accuracySum += r.h / 6
  }

  for (const u of users) {
    const bucket = byDate.get(dateKey(startOfUTCDay(new Date(u.created_at).getTime())))
    if (bucket) bucket.newUsers++
  }

  return buckets.map((date) => {
    const b = byDate.get(date)
    return {
      date: b.date,
      roundsPlayed: b.roundsPlayed,
      offlineRounds: b.offlineRounds,
      avgDurationSec: b.digitalRounds ? round2(b.durationSum / b.digitalRounds) : 0,
      avgAccuracy: b.digitalRounds ? round2(b.accuracySum / b.digitalRounds) : 0,
      newUsers: b.newUsers,
      activeUsers: b.activeUserIds.size,
    }
  })
}

export function buildDecksSummary(decks, rounds, limit = 20) {
  const deckByKey = new Map(decks.map((d) => [`${d.user_id}|${d.id}`, d]))
  const agg = new Map()

  for (const r of rounds) {
    const deck = deckByKey.get(`${r.user_id}|${r.d}`)
    const label = deck?.archetype || deck?.name || r.d
    const entry = agg.get(label) ?? { label, roundCount: 0, offlineRoundCount: 0, digitalRoundCount: 0, accuracySum: 0 }
    entry.roundCount++
    if (isOffline(r)) {
      entry.offlineRoundCount++
    } else {
      entry.digitalRoundCount++
      entry.accuracySum += r.h / 6
    }
    agg.set(label, entry)
  }

  return [...agg.values()]
    .map((e) => ({
      label: e.label,
      roundCount: e.roundCount,
      offlineRoundCount: e.offlineRoundCount,
      avgAccuracy: e.digitalRoundCount ? round2(e.accuracySum / e.digitalRoundCount) : 0,
    }))
    .sort((a, b) => b.roundCount - a.roundCount)
    .slice(0, limit)
}
