import { type Deck, type Round, fmt } from '../game'
import { CardFace } from '../CardFace'
import { NavBar } from './NavBar'

interface Props {
  decks: Deck[]
  history: Round[]
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onPlay: (deck: Deck) => void
  onImport: () => void
  onStats: () => void
}

export function Home({ decks, history, theme, onToggleTheme, onPlay, onImport, onStats }: Props) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '20px 20px 12px',
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
            Prize Checker
          </h1>
          <p style={{ margin: '2px 0 0', color: 'var(--sub)', fontSize: 13.5 }}>
            Trainiere dein Preis-Rechnen
          </p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={onToggleTheme}
          style={{ fontSize: 20, padding: 8 }}
          aria-label="Theme wechseln"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      <div className="pc-scroll" style={{ padding: '4px 16px 20px' }}>
        {decks.map((d) => (
          <DeckTile key={d.id} deck={d} history={history} onPlay={() => onPlay(d)} />
        ))}

        <button
          onClick={onImport}
          style={{
            width: '100%',
            marginTop: 6,
            padding: '18px',
            borderRadius: 18,
            border: '2px dashed var(--accent)',
            background: 'var(--accentSoft)',
            color: 'var(--accentInk)',
            fontWeight: 700,
            fontSize: 15.5,
          }}
        >
          ＋ Deck importieren
        </button>
      </div>

      <NavBar active="decks" onDecks={() => {}} onStats={onStats} />
    </div>
  )
}

function DeckTile({ deck, history, onPlay }: { deck: Deck; history: Round[]; onPlay: () => void }) {
  const rounds = history.filter((r) => r.d === deck.id)
  const best = rounds.length ? Math.min(...rounds.map((r) => r.t)) : null
  const acc = rounds.length
    ? Math.round((rounds.reduce((a, r) => a + r.h, 0) / rounds.length / 6) * 100)
    : null
  const star = deck.cards.find((c) => /ex$/.test(c.n)) || deck.cards[0]

  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        background: 'var(--surface)',
        borderRadius: 20,
        padding: 14,
        marginBottom: 12,
        boxShadow: 'var(--shadow)',
        animation: 'rise .35s ease both',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 62,
          height: 86,
          borderRadius: 12,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <CardFace img={star.img} name={star.n} radius={12} fontSize={10} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--ink)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {deck.name}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--accentInk)',
              background: 'var(--accentSoft)',
              padding: '2px 8px',
              borderRadius: 999,
            }}
          >
            {deck.format}
          </span>
        </div>
        <p style={{ margin: '4px 0 10px', fontSize: 12.5, color: 'var(--sub)' }}>
          Best {best != null ? fmt(best) : '—'} · {acc != null ? acc + '%' : '—'} Genau. ·{' '}
          {rounds.length} Runden
        </p>
        <button
          className="btn btn-primary"
          onClick={onPlay}
          style={{ padding: '9px 22px', fontSize: 14 }}
        >
          Spielen
        </button>
      </div>
    </div>
  )
}
