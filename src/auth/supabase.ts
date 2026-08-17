import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

// Auth ist optional: ohne konfigurierte Keys läuft die App im lokalen Gast-Modus.
export const hasSupabase = Boolean(url && anon)

// Google-Login nur anzeigen, wenn serverseitig eingerichtet (analog zu Doewe).
export const googleEnabled = import.meta.env.VITE_GOOGLE_ENABLED === '1'

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url as string, anon as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
