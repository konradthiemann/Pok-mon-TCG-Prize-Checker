import { useState, type CSSProperties } from 'react'
import { useAuth } from '../auth/AuthProvider'

interface Props {
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

export function ResetPassword({ onDone }: Props) {
  const { updatePassword } = useAuth()
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (pw1.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben.')
      return
    }
    if (pw1 !== pw2) {
      setError('Passwörter stimmen nicht überein.')
      return
    }
    setLoading(true)
    const res = await updatePassword(pw1)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    onDone()
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--bg)', padding: '0 20px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px', color: 'var(--ink)' }}>
        Neues Passwort
      </h1>
      <p style={{ margin: '0 0 20px', color: 'var(--sub)', fontSize: 14 }}>
        Wähle ein neues Passwort für dein Konto.
      </p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="password"
          value={pw1}
          onChange={(e) => setPw1(e.target.value)}
          placeholder="Neues Passwort (min. 8 Zeichen)"
          autoComplete="new-password"
          style={inputStyle}
        />
        <input
          type="password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          placeholder="Passwort bestätigen"
          autoComplete="new-password"
          style={inputStyle}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: '100%', padding: 14, fontSize: 15.5, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Bitte warten…' : 'Passwort speichern'}
        </button>
      </form>
      {error && <p role="alert" style={{ marginTop: 14, fontSize: 13.5, color: 'var(--bad)' }}>{error}</p>}
    </div>
  )
}
