import { useAuth } from '../auth/AuthProvider'

interface Props {
  open: boolean
  theme: 'light' | 'dark'
  onClose: () => void
  onToggleTheme: () => void
  onLogin: () => void
  onAccount: () => void
}

export function Drawer({ open, theme, onClose, onToggleTheme, onLogin, onAccount }: Props) {
  const { user, configured, signOut } = useAuth()

  const row = (icon: string, label: string, onClick: () => void, danger = false) => (
    <button
      onClick={onClick}
      className="btn btn-ghost"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        justifyContent: 'flex-start',
        padding: '13px 16px',
        borderRadius: 14,
        fontSize: 15,
        fontWeight: 600,
        color: danger ? 'var(--bad)' : 'var(--ink)',
      }}
    >
      <span style={{ fontSize: 20, width: 24, textAlign: 'center' }}>{icon}</span>
      {label}
    </button>
  )

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,.42)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .22s ease',
          zIndex: 40,
        }}
      />
      <aside
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          height: '100%',
          width: 'min(82%, 320px)',
          background: 'var(--surface)',
          boxShadow: '-14px 0 40px rgba(0,0,0,.25)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .26s cubic-bezier(.4,0,.2,1)',
          zIndex: 41,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 16px 10px',
          }}
        >
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>Menü</span>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            aria-label="Schließen"
            style={{ fontSize: 22, padding: '4px 10px', color: 'var(--sub)' }}
          >
            ✕
          </button>
        </header>

        <div
          style={{
            margin: '4px 16px 12px',
            padding: '14px 16px',
            borderRadius: 16,
            background: 'var(--accentSoft)',
          }}
        >
          {user ? (
            <>
              <div style={{ fontSize: 12, color: 'var(--sub)' }}>Angemeldet als</div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--accentInk)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.name || user.email}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13.5, color: 'var(--accentInk)', fontWeight: 600 }}>
              {configured ? 'Nicht angemeldet – als Gast unterwegs.' : 'Gast-Modus (kein Konto konfiguriert).'}
            </div>
          )}
        </div>

        <nav style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {user && row('⚙️', 'Kontoeinstellungen', () => { onClose(); onAccount() })}
          {!user && configured && row('🔑', 'Anmelden', () => { onClose(); onLogin() })}
          {row(theme === 'dark' ? '☀️' : '🌙', theme === 'dark' ? 'Light Mode' : 'Dark Mode', onToggleTheme)}
          {user && row('🚪', 'Abmelden', async () => { onClose(); await signOut() }, true)}
        </nav>

        <div style={{ marginTop: 'auto', padding: '14px 20px', color: 'var(--sub)', fontSize: 11 }}>
          Prize Checker
        </div>
      </aside>
    </>
  )
}
