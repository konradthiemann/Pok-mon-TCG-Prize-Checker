import { useT } from '../i18n'

interface Props {
  onBack: () => void
  loggedIn: boolean
  onLogin: () => void
}

export function Paywall({ onBack, loggedIn, onLogin }: Props) {
  const t = useT()
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '18px 16px 8px' }}>
        <button
          className="btn btn-ghost"
          onClick={onBack}
          style={{ fontSize: 22, padding: '4px 10px', color: 'var(--ink)' }}
          aria-label={t.back}
        >
          ‹
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>{t.premium}</h1>
      </header>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 26px 40px',
        }}
      >
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 34,
            background: 'linear-gradient(140deg, #5FD0FF, #2E9FD8 55%, #1B7FB8)',
            boxShadow: '0 8px 20px rgba(27,127,184,.35)',
            animation: 'popIn .4s ease both',
          }}
        >
          🔒
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '22px 0 10px', color: 'var(--ink)' }}>
          {t.playAllDecks}
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--sub)', maxWidth: 340, margin: 0 }}>
          {t.premiumDesc}
        </p>

        <span
          style={{
            marginTop: 22,
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--accentInk)',
            background: 'var(--accentSoft)',
            padding: '8px 16px',
            borderRadius: 999,
          }}
        >
          {t.comingSoon}
        </span>

        {!loggedIn && (
          <>
            <p style={{ fontSize: 13, color: 'var(--sub)', margin: '26px 0 10px' }}>
              {t.loginForSub}
            </p>
            <button
              className="btn btn-primary"
              onClick={onLogin}
              style={{ padding: '13px 28px', fontSize: 15 }}
            >
              {t.signIn}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
