import { createClient } from '@supabase/supabase-js'
import { createApp } from './app.js'

const PORT = Number(process.env.PORT) || 8080
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Admin-API ist optional wie der Rest von Prizeds Supabase-Anbindung — ohne
// diese beiden Envs läuft der Server einfach ohne /api/admin/*.
const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null

const app = createApp({ supabaseAdmin, adminServiceToken: process.env.PRIZED_SERVICE_TOKEN })

app.listen(PORT, () => {
  console.log(`Prized läuft auf Port ${PORT}`)
})
