// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import { createAdminRouter } from './adminApi.js'

const TOKEN = 'test-service-token'

function fakeSupabase({ users = [], decks = [], rounds = [] } = {}) {
  const updateUserById = vi.fn(async (id, attrs) => {
    const user = users.find((u) => u.id === id)
    if (!user) return { data: null, error: { status: 404, message: 'not found' } }
    user.banned_until = attrs.ban_duration === 'none' ? null : '2099-01-01T00:00:00.000Z'
    return { data: { user }, error: null }
  })
  const deleteUser = vi.fn(async (id) => {
    const idx = users.findIndex((u) => u.id === id)
    if (idx === -1) return { data: null, error: { status: 404, message: 'not found' } }
    users.splice(idx, 1)
    return { data: {}, error: null }
  })
  const listUsers = vi.fn(async () => ({ data: { users, total: users.length }, error: null }))

  const tables = { decks, rounds }
  return {
    auth: { admin: { listUsers, updateUserById, deleteUser } },
    from: (table) => ({
      select: async () => ({ data: tables[table] ?? [], error: null }),
    }),
  }
}

function buildApp(supabaseAdmin) {
  const app = express()
  app.use('/api/admin', createAdminRouter({ supabaseAdmin, serviceToken: TOKEN }))
  return app
}

describe('Admin-API Auth', () => {
  it('lehnt Requests ohne gültigen Service-Token ab', async () => {
    const app = buildApp(fakeSupabase())
    const noAuth = await request(app).get('/api/admin/stats')
    const wrongAuth = await request(app).get('/api/admin/stats').set('Authorization', 'Bearer nope')

    expect(noAuth.status).toBe(401)
    expect(wrongAuth.status).toBe(401)
  })
})

describe('GET /api/admin/stats', () => {
  it('liefert die Gesamtzahlen', async () => {
    const supabase = fakeSupabase({
      users: [{ id: 'u1', created_at: new Date().toISOString() }],
      decks: [{ user_id: 'u1', id: 'd1' }],
      rounds: [{ user_id: 'u1', ts: Date.now(), t: 40, h: 5, d: 'd1' }],
    })
    const app = buildApp(supabase)

    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${TOKEN}`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ totalUsers: 1, totalDecks: 1, totalRounds: 1 })
  })
})

describe('GET /api/admin/users', () => {
  it('liefert die Account-Liste mit Deck-/Rundenzahlen', async () => {
    const supabase = fakeSupabase({
      users: [{ id: 'u1', email: 'a@example.com', created_at: new Date().toISOString() }],
      decks: [{ user_id: 'u1', id: 'd1' }],
      rounds: [],
    })
    const app = buildApp(supabase)

    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${TOKEN}`)

    expect(res.status).toBe(200)
    expect(res.body.users).toHaveLength(1)
    expect(res.body.users[0]).toMatchObject({ id: 'u1', email: 'a@example.com', deckCount: 1, roundCount: 0 })
  })
})

describe('POST /api/admin/users/:id/suspend', () => {
  it('sperrt einen existierenden Account', async () => {
    const supabase = fakeSupabase({ users: [{ id: 'u1', created_at: new Date().toISOString() }] })
    const app = buildApp(supabase)

    const res = await request(app)
      .post('/api/admin/users/u1/suspend')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ suspended: true })

    expect(res.status).toBe(200)
    expect(supabase.auth.admin.updateUserById).toHaveBeenCalledWith('u1', { ban_duration: '876000h' })
  })

  it('gibt 404 für unbekannte Accounts zurück', async () => {
    const app = buildApp(fakeSupabase())

    const res = await request(app)
      .post('/api/admin/users/ghost/suspend')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ suspended: true })

    expect(res.status).toBe(404)
  })
})

describe('POST /api/admin/users/:id/delete', () => {
  it('löscht einen existierenden Account', async () => {
    const supabase = fakeSupabase({ users: [{ id: 'u1', created_at: new Date().toISOString() }] })
    const app = buildApp(supabase)

    const res = await request(app).post('/api/admin/users/u1/delete').set('Authorization', `Bearer ${TOKEN}`)

    expect(res.status).toBe(200)
  })

  it('ist idempotent für bereits gelöschte Accounts (200 statt Fehler)', async () => {
    const app = buildApp(fakeSupabase({ users: [] }))

    const res = await request(app).post('/api/admin/users/ghost/delete').set('Authorization', `Bearer ${TOKEN}`)

    expect(res.status).toBe(200)
  })
})

describe('GET /api/admin/usage', () => {
  it('liefert Tages-Buckets für die angegebene Anzahl Tage', async () => {
    const supabase = fakeSupabase({ users: [], rounds: [] })
    const app = buildApp(supabase)

    const res = await request(app).get('/api/admin/usage?days=7').set('Authorization', `Bearer ${TOKEN}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(7)
  })
})

describe('GET /api/admin/decks-summary', () => {
  it('liefert die aggregierte Deck-Liste', async () => {
    const supabase = fakeSupabase({
      decks: [{ user_id: 'u1', id: 'd1', name: 'Dragapult ex', archetype: 'Dragapult' }],
      rounds: [{ user_id: 'u1', d: 'd1', h: 6 }],
    })
    const app = buildApp(supabase)

    const res = await request(app).get('/api/admin/decks-summary').set('Authorization', `Bearer ${TOKEN}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([{ label: 'Dragapult', roundCount: 1, avgAccuracy: 1 }])
  })
})
