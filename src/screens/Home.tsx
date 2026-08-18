import { type Deck, type Round, fmt, isDeckFree, starCard } from '../game'
import { CardFace } from '../CardFace'
import { NavBar } from './NavBar'

interface Props {
  decks: Deck[]
  history: Round[]
  premium: boolean
  onMenu: () => void
  onPlay: (deck: Deck) => void
  onImport: () => void
  onStats: () => void
}

export function Home({ decks, history, premium, onMenu, onPlay, onImport, onStats }: Props) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 20px 12px',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--bg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/icon.svg" alt="Prized" width={36} height={36} style={{ borderRadius: 10, flexShrink: 0 }} />
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>Prized</h1>
            <p style={{ margin: 0, color: 'var(--sub)', fontSize: 12 }}>Trainiere dein Preis-Gespür</p>
          </div>
        </div>
        <button
          className="btn btn-ghost"
          onClick={onMenu}
          aria-label="Menü öffnen"
          style={{ padding: 8, color: 'var(--ink)' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="5" x2="17" y2="5" />
            <line x1="3" y1="10" x2="17" y2="10" />
            <line x1="3" y1="15" x2="17" y2="15" />
          </svg>
        </button>
      </header>

      <div className="pc-scroll" style={{ padding: '4px 16px 20px' }}>
        {decks.map((d) => (
          <DeckTile
            key={d.id}
            deck={d}
            history={history}
            locked={!premium && !isDeckFree(d)}
            onPlay={() => onPlay(d)}
          />
        ))}

        <button
          onClick={onImport}
          style={{
            width: '100%',
            padding: 16,
            marginTop: 4,
            borderRadius: 12,
            border: '1.5px dashed var(--line)',
            background: 'transparent',
            color: 'var(--accentInk)',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          + Deck importieren
        </button>
      </div>

      <NavBar active="decks" onDecks={() => {}} onStats={onStats} />
    </div>
  )
}

function DeckTile({
  deck,
  history,
  locked,
  onPlay,
}: {
  deck: Deck
  history: Round[]
  locked: boolean
  onPlay: () => void
}) {
  const rounds = history.filter((r) => r.d === deck.id)
  const best = rounds.length ? Math.min(...rounds.map((r) => r.t)) : null
  const acc = rounds.length
    ? Math.round((rounds.reduce((a, r) => a + r.h, 0) / rounds.length / 6) * 100)
    : null
  const star = starCard(deck)

  return (
    <button
      onClick={onPlay}
      disabled={locked}
      style={{
        width: '100%',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        background: 'var(--surface)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        border: 'none',
        textAlign: 'left',
        opacity: locked ? 0.55 : 1,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 52,
          height: 72,
          borderRadius: 8,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <CardFace img={star.img} fallbackImg={star.fallbackImg} name={star.n} radius={8} fontSize={9} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--ink)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {deck.name}
          </span>
          {locked && (
            <span style={{ fontSize: 12, color: 'var(--sub)' }}>
              Premium
            </span>
          )}
        </div>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--sub)' }}>
          {best != null ? `${fmt(best)} best` : 'Noch nicht gespielt'}
          {acc != null ? ` · ${acc}% Genau.` : ''}
          {rounds.length > 0 ? ` · ${rounds.length} Runden` : ''}
        </p>
      </div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0, color: 'var(--sub)' }}>
        <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
