import { type Deck, type Round, fmt, isDeckFree, progressOf } from '../game'
import { CardFace } from '../CardFace'
import { NavBar } from './NavBar'

function ProgressHeader({ history }: { history: Round[] }) {
  const p = progressOf(history)
  return (
    <div
      style={{
        borderRadius: 20,
        padding: '16px 18px',
        marginBottom: 14,
        background: 'linear-gradient(135deg, var(--accentInk), #2E9FD8)',
        color: '#eaf7ff',
        boxShadow: 'var(--shadow)',
        animation: 'rise .35s ease both',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,.16)',
            border: '1px solid rgba(255,255,255,.25)',
          }}
        >
          <span style={{ fontSize: 9, opacity: 0.8, lineHeight: 1 }}>LVL</span>
          <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>{p.level}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800 }}>{p.rank}</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            {p.xpInLevel} / 600 XP
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 14,
            fontWeight: 800,
            padding: '6px 10px',
            borderRadius: 999,
            background: 'rgba(255,255,255,.16)',
          }}
        >
          <span style={{ animation: 'flameFlick 1.4s ease-in-out infinite', display: 'inline-block' }}>
            🔥
          </span>
          {p.streakDays}
        </div>
      </div>
      <div
        style={{
          marginTop: 12,
          height: 8,
          borderRadius: 999,
          background: 'rgba(255,255,255,.22)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: p.levelPct + '%',
            height: '100%',
            borderRadius: 999,
            background: '#eaf7ff',
            transition: 'width .5s ease',
          }}
        />
      </div>
    </div>
  )
}

interface Props {
  decks: Deck[]
  history: Round[]
  premium: boolean
  onMenu: () => void
  onPlay: (deck: Deck) => void
  onImport: () => void
  onCreate: () => void
  onStats: () => void
}

export function Home({ decks, history, premium, onMenu, onPlay, onImport, onCreate, onStats }: Props) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '20px 20px 12px',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--bg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <img src="/icon.svg" alt="Prized" width={40} height={40} style={{ borderRadius: 11, flexShrink: 0 }} />
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
              Prized
            </h1>
            <p style={{ margin: '2px 0 0', color: 'var(--sub)', fontSize: 13.5 }}>
              Trainiere dein Preis-Gespür
            </p>
          </div>
        </div>
        <button
          className="btn btn-ghost"
          onClick={onMenu}
          style={{ fontSize: 22, padding: 8, color: 'var(--ink)' }}
          aria-label="Menü öffnen"
        >
          ☰
        </button>
      </header>

      <div className="pc-scroll" style={{ padding: '4px 16px 20px' }}>
        <ProgressHeader history={history} />

        {decks.map((d) => (
          <DeckTile
            key={d.id}
            deck={d}
            history={history}
            locked={!premium && !isDeckFree(d)}
            onPlay={() => onPlay(d)}
          />
        ))}

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button
            onClick={onCreate}
            style={{
              flex: 1,
              padding: '18px',
              borderRadius: 18,
              border: 'none',
              background: 'linear-gradient(140deg, #5FD0FF, #2E9FD8 55%, #1B7FB8)',
              color: '#06323f',
              fontWeight: 800,
              fontSize: 15,
              boxShadow: '0 6px 16px rgba(27,127,184,.3)',
            }}
          >
            ＋ Deck erstellen
          </button>
          <button
            onClick={onImport}
            style={{
              flex: 1,
              padding: '18px',
              borderRadius: 18,
              border: '2px dashed var(--accent)',
              background: 'var(--accentSoft)',
              color: 'var(--accentInk)',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            ⬇ Importieren
          </button>
        </div>
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
          {locked && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--sub)',
                background: 'var(--line)',
                padding: '2px 8px',
                borderRadius: 999,
                marginLeft: 'auto',
              }}
            >
              🔒 Premium
            </span>
          )}
        </div>
        <p style={{ margin: '4px 0 10px', fontSize: 12.5, color: 'var(--sub)' }}>
          Best {best != null ? fmt(best) : '—'} · {acc != null ? acc + '%' : '—'} Genau. ·{' '}
          {rounds.length} Runden
        </p>
        <button
          onClick={onPlay}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            border: 'none',
            borderRadius: 999,
            padding: '9px 20px',
            fontSize: 14,
            fontWeight: 800,
            color: locked ? 'var(--ink)' : '#06323f',
            background: locked
              ? 'var(--accentSoft)'
              : 'linear-gradient(140deg, #5FD0FF, #2E9FD8 55%, #1B7FB8)',
            boxShadow: locked ? 'none' : '0 6px 16px rgba(27,127,184,.35)',
          }}
        >
          {locked ? (
            <>
              <span style={{ fontSize: 12 }}>🔒</span> Freischalten
            </>
          ) : (
            <>
              <span style={{ fontSize: 11 }}>▶</span> Spielen
            </>
          )}
        </button>
      </div>
    </div>
  )
}
