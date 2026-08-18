import { useState, useRef, type CSSProperties } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { googleEnabled } from '../auth/supabase'
import { useT } from '../i18n'

type Mode = 'login' | 'register' | 'forgot'

interface Props {
  onBack: () => void
  onDone: () => void
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 14,
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--ink)',
  fontSize: 15,
  fontFamily: 'inherit',
}

function GoogleLogo() {
  return (
    <svg width={18} height={18} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

export function Login({ onBack, onDone }: Props) {
  const t = useT()
  const { signIn, signUp, signInWithGoogle, sendReset } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const failCount = useRef(0)
  const lockedUntil = useRef(0)

  const reset = () => {
    setError(null)
    setInfo(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (Date.now() < lockedUntil.current) {
      const secs = Math.ceil((lockedUntil.current - Date.now()) / 1000)
      setError(t.throttleWait(secs))
      return
    }
    reset()
    setLoading(true)
    let res
    if (mode === 'login') res = await signIn(email, password)
    else if (mode === 'register') res = await signUp(email, password, name.trim() || undefined)
    else res = await sendReset(email)
    setLoading(false)
    if (res.error) {
      failCount.current++
      if (failCount.current >= 3) {
        const delay = Math.min(30_000, failCount.current * 5_000)
        lockedUntil.current = Date.now() + delay
      }
      setError(res.error)
      return
    }
    failCount.current = 0
    if (res.info) {
      setInfo(res.info)
      return
    }
    onDone()
  }

  async function google() {
    reset()
    setLoading(true)
    const res = await signInWithGoogle()
    if (res.error) {
      setLoading(false)
      setError(res.error)
    }
  }

  const title = mode === 'login' ? t.signIn : mode === 'register' ? t.register : t.forgotPassword
  const submitLabel =
    mode === 'login' ? t.signIn : mode === 'register' ? t.createAccount : t.sendLink

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '18px 16px 10px' }}>
        <button
          className="btn btn-ghost"
          onClick={onBack}
          style={{ fontSize: 22, padding: '4px 10px', color: 'var(--ink)' }}
          aria-label={t.back}
        >
          ‹
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>{title}</h1>
      </header>

      <div className="pc-scroll" style={{ padding: '10px 20px 24px' }}>
        {mode !== 'forgot' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {(['login', 'register'] as const).map((m) => {
              const on = mode === m
              return (
                <button
                  key={m}
                  onClick={() => { setMode(m); reset() }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 12,
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 14,
                    background: on ? 'var(--accentInk)' : 'var(--surface)',
                    color: on ? '#fff' : 'var(--sub)',
                  }}
                >
                  {m === 'login' ? t.signIn : t.register}
                </button>
              )
            })}
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.nameOptional}
              autoComplete="name"
              style={inputStyle}
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.email}
            autoComplete="email"
            style={inputStyle}
          />
          {mode !== 'forgot' && (
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordMin8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={inputStyle}
            />
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: 14, fontSize: 15.5, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? t.pleaseWait : submitLabel}
          </button>
        </form>

        {mode === 'login' && (
          <button
            className="btn btn-ghost"
            onClick={() => { setMode('forgot'); reset() }}
            style={{ width: '100%', marginTop: 6, fontSize: 13.5, color: 'var(--accentInk)', fontWeight: 600 }}
          >
            {t.forgotPasswordQ}
          </button>
        )}
        {mode === 'forgot' && (
          <button
            className="btn btn-ghost"
            onClick={() => { setMode('login'); reset() }}
            style={{ width: '100%', marginTop: 6, fontSize: 13.5, color: 'var(--accentInk)', fontWeight: 600 }}
          >
            {t.backToLogin}
          </button>
        )}

        {error && (
          <p role="alert" style={{ marginTop: 14, fontSize: 13.5, color: 'var(--bad)' }}>
            {error}
          </p>
        )}
        {info && (
          <p role="status" style={{ marginTop: 14, fontSize: 13.5, color: 'var(--good)' }}>
            {info}
          </p>
        )}

        {mode !== 'forgot' && googleEnabled && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: 'var(--sub)' }}>
                {t.or}
              </span>
              <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </div>
            <button
              onClick={google}
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: 13,
                borderRadius: 14,
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--ink)',
                fontWeight: 700,
                fontSize: 14.5,
              }}
            >
              <GoogleLogo />
              {t.signInWithGoogle}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
