// Admin-API für die control-plane-Anbindung — Bearer-Service-Token-Auth
// (analog Doewes DOEWE_SERVICE_TOKEN), läuft serverseitig mit dem Supabase
// service_role-Key (bypasst RLS). Details/Vertrag: specs/admin-api.md.
import express from 'express'
import { buildStats, buildUsersList, buildUsage, buildDecksSummary } from './lib/adminAggregate.js'

const SUSPEND_DURATION = '876000h' // ~100 Jahre — Supabase kennt kein "für immer", das ist die übliche Konvention
const UNSUSPEND_DURATION = 'none'

async function fetchAllUsers(supabaseAdmin) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (error) throw error
  return data.users
}

async function fetchAllRows(supabaseAdmin, table, columns) {
  const { data, error } = await supabaseAdmin.from(table).select(columns)
  if (error) throw error
  return data
}

export function createAdminRouter({ supabaseAdmin, serviceToken }) {
  const router = express.Router()

  router.use(express.json())

  router.use((req, res, next) => {
    const expected = serviceToken ? `Bearer ${serviceToken}` : null
    if (!expected || req.headers.authorization !== expected) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    next()
  })

  router.get('/stats', async (req, res) => {
    const [users, decks, rounds] = await Promise.all([
      fetchAllUsers(supabaseAdmin),
      fetchAllRows(supabaseAdmin, 'decks', 'user_id'),
      fetchAllRows(supabaseAdmin, 'rounds', 'user_id, m'),
    ])
    res.json(buildStats(users, decks, rounds))
  })

  router.get('/users', async (req, res) => {
    const [users, decks, rounds] = await Promise.all([
      fetchAllUsers(supabaseAdmin),
      fetchAllRows(supabaseAdmin, 'decks', 'user_id, id'),
      fetchAllRows(supabaseAdmin, 'rounds', 'user_id, ts'),
    ])
    const list = buildUsersList(users, decks, rounds)
    res.json({ page: 1, pageSize: list.length, total: list.length, users: list })
  })

  router.post('/users/:id/suspend', async (req, res) => {
    const duration = req.body?.suspended ? SUSPEND_DURATION : UNSUSPEND_DURATION
    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, { ban_duration: duration })
    if (error) {
      return res.status(error.status === 404 ? 404 : 502).json({ error: error.message })
    }
    res.json({ ok: true })
  })

  router.post('/users/:id/delete', async (req, res) => {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id)
    // Idempotent: ein bereits gelöschter Account ist aus Aufrufersicht kein Fehler.
    if (error && error.status !== 404) {
      return res.status(502).json({ error: error.message })
    }
    res.json({ ok: true })
  })

  router.get('/usage', async (req, res) => {
    const days = Math.max(1, Math.min(90, Number(req.query.days) || 30))
    const [users, rounds] = await Promise.all([
      fetchAllUsers(supabaseAdmin),
      fetchAllRows(supabaseAdmin, 'rounds', 'user_id, ts, t, h, m'),
    ])
    res.json(buildUsage(users, rounds, days))
  })

  router.get('/decks-summary', async (req, res) => {
    const [decks, rounds] = await Promise.all([
      fetchAllRows(supabaseAdmin, 'decks', 'user_id, id, name, archetype'),
      fetchAllRows(supabaseAdmin, 'rounds', 'user_id, d, h, m'),
    ])
    res.json(buildDecksSummary(decks, rounds))
  })

  return router
}
