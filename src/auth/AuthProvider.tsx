import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, hasSupabase } from './supabase'

export interface AuthUser {
  id: string
  email: string | null
  name?: string | null
}

interface AuthResult {
  error?: string
  info?: string
}

interface AuthContextValue {
  user: AuthUser | null
  ready: boolean
  configured: boolean
  recovery: boolean
  signIn(email: string, password: string): Promise<AuthResult>
  signUp(email: string, password: string, name?: string): Promise<AuthResult>
  signInWithGoogle(): Promise<AuthResult>
  sendReset(email: string): Promise<AuthResult>
  updatePassword(password: string): Promise<AuthResult>
  signOut(): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function msg(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return 'Unbekannter Fehler'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setReady(true)
      return
    }
    // Recovery-Link aus der E-Mail liefert #type=recovery zurück.
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setRecovery(true)
    }
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      setUser(u ? { id: u.id, email: u.email ?? null, name: u.user_metadata?.name ?? null } : null)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      const u = session?.user
      setUser(u ? { id: u.id, email: u.email ?? null, name: u.user_metadata?.name ?? null } : null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value: AuthContextValue = {
    user,
    ready,
    configured: hasSupabase,
    recovery,
    async signIn(email, password) {
      if (!supabase) return { error: 'Auth ist nicht konfiguriert.' }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error ? { error: msg(error) } : {}
    },
    async signUp(email, password, name) {
      if (!supabase) return { error: 'Auth ist nicht konfiguriert.' }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: name ? { name } : undefined },
      })
      if (error) return { error: msg(error) }
      // Wenn E-Mail-Bestätigung aktiv ist, gibt es noch keine Session.
      if (!data.session) return { info: 'Bestätige deine E-Mail, um fortzufahren.' }
      return {}
    },
    async signInWithGoogle() {
      if (!supabase) return { error: 'Auth ist nicht konfiguriert.' }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      return error ? { error: msg(error) } : {}
    },
    async sendReset(email) {
      if (!supabase) return { error: 'Auth ist nicht konfiguriert.' }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })
      return error ? { error: msg(error) } : { info: 'E-Mail zum Zurücksetzen wurde gesendet.' }
    },
    async updatePassword(password) {
      if (!supabase) return { error: 'Auth ist nicht konfiguriert.' }
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return { error: msg(error) }
      setRecovery(false)
      if (typeof window !== 'undefined' && window.location.hash) {
        history.replaceState(null, '', window.location.pathname)
      }
      return { info: 'Passwort aktualisiert.' }
    },
    async signOut() {
      if (supabase) await supabase.auth.signOut()
      setUser(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden')
  return ctx
}
