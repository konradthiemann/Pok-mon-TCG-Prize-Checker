import { useState, type CSSProperties } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useT } from '../i18n'

interface Props {
  onBack: () => void
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

export function AccountSettings({ onBack }: Props) {
  const t = useT()
  const { user, updatePassword, signOut } = useAuth()
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (pw1.length < 8) {
      setError(t.pwMin8Error)
      return
    }
    if (pw1 !== pw2) {
      setError(t.pwMismatchError)
      return
    }
    setLoading(true)
    const res = await updatePassword(pw1)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setInfo(res.info ?? t.passwordUpdated)
    setPw1('')
    setPw2('')
  }

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
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
          {t.accountSettings}
        </h1>
      </header>

      <div className="pc-scroll" style={{ padding: '10px 20px 24px' }}>
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 16, marginBottom: 18, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 12, color: 'var(--sub)' }}>{t.email}</div>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)', wordBreak: 'break-all' }}>
            {user?.email ?? '—'}
          </div>
          {user?.name && (
            <>
              <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 10 }}>{t.name}</div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)' }}>{user.name}</div>
            </>
          )}
        </div>

        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--sub)' }}>
          {t.changePassword}
        </p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            placeholder={t.newPassword}
            autoComplete="new-password"
            style={inputStyle}
          />
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder={t.confirmNewPassword}
            autoComplete="new-password"
            style={inputStyle}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: 14, fontSize: 15.5, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? t.pleaseWait : t.changePassword}
          </button>
        </form>

        {error && <p role="alert" style={{ marginTop: 14, fontSize: 13.5, color: 'var(--bad)' }}>{error}</p>}
        {info && <p role="status" style={{ marginTop: 14, fontSize: 13.5, color: 'var(--good)' }}>{info}</p>}

        <button
          onClick={signOut}
          style={{
            width: '100%',
            marginTop: 26,
            padding: 14,
            borderRadius: 14,
            border: '1px solid var(--bad)',
            background: 'transparent',
            color: 'var(--bad)',
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {t.signOut}
        </button>
      </div>
    </div>
  )
}
