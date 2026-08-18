interface Props {
  active: 'decks' | 'stats'
  onDecks: () => void
  onStats: () => void
}

export function NavBar({ active, onDecks, onStats }: Props) {
  return (
    <nav
      style={{
        display: 'flex',
        borderTop: '1px solid var(--line)',
        background: 'var(--surface)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        position: 'sticky',
        bottom: 0,
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      <NavItem active={active === 'decks'} label="Decks" onClick={onDecks}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="10" height="14" rx="2" />
          <path d="M12 5h1a2 2 0 012 2v8a2 2 0 01-2 2h-1" />
        </svg>
      </NavItem>
      <NavItem active={active === 'stats'} label="Statistik" onClick={onStats}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="14" x2="5" y2="8" />
          <line x1="9" y1="14" x2="9" y2="4" />
          <line x1="13" y1="14" x2="13" y2="10" />
        </svg>
      </NavItem>
    </nav>
  )
}

function NavItem({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        padding: '10px 0 8px',
        border: 'none',
        background: 'transparent',
        color: active ? 'var(--accentInk)' : 'var(--sub)',
        fontWeight: active ? 600 : 400,
        fontSize: 11,
      }}
    >
      {children}
      {label}
    </button>
  )
}
