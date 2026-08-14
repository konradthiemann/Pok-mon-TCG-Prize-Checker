interface Props {
  active: 'decks' | 'stats'
  onDecks: () => void
  onStats: () => void
}

export function NavBar({ active, onDecks, onStats }: Props) {
  const item = (
    key: 'decks' | 'stats',
    icon: string,
    label: string,
    onClick: () => void,
  ) => (
    <button
      onClick={onClick}
      className="btn btn-ghost"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        padding: '8px 0',
        color: active === key ? 'var(--accentInk)' : 'var(--sub)',
        fontWeight: active === key ? 700 : 500,
        fontSize: 12,
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      {label}
    </button>
  )
  return (
    <nav
      style={{
        display: 'flex',
        borderTop: '1px solid var(--line)',
        background: 'var(--surface)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {item('decks', '🂠', 'Decks', onDecks)}
      {item('stats', '📈', 'Statistik', onStats)}
    </nav>
  )
}
