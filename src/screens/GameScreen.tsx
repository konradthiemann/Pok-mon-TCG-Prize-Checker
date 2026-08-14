import { useEffect, useRef, useState } from 'react'
import { type GameState, fmt } from '../game'
import { CardFace } from '../CardFace'

interface Props {
  game: GameState
  onChange: (g: GameState) => void
  onQuit: () => void
  onConfirm: (g: GameState) => void
}

const LIMIT = 45

export function GameScreen({ game, onChange, onQuit, onConfirm }: Props) {
  const [tab, setTab] = useState<'table' | 'list'>('table')
  const [, force] = useState(0)

  // Timer-Tick, solange das Spiel läuft.
  useEffect(() => {
    if (game.end) return
    const id = setInterval(() => force((n) => n + 1), 100)
    return () => clearInterval(id)
  }, [game.end])

  const selTotal = Object.values(game.sel).reduce((a, b) => a + b, 0)
  const el = ((game.end || Date.now()) - game.start) / 1000
  const over = el > LIMIT
  const timerColor = over ? 'var(--bad)' : 'var(--ink)'
  const progWidth = Math.max(0, Math.min(1, (LIMIT - el) / LIMIT)) * 100 + '%'
  const progColor = over ? 'var(--bad)' : el > LIMIT - 10 ? 'var(--warn)' : 'var(--accent)'
  const progLabel = over ? '+' + fmt(el - LIMIT) : Math.ceil(LIMIT - el) + 's übrig'

  const canConfirm = selTotal === 6

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ padding: '14px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <button
            onClick={onQuit}
            aria-label="Beenden"
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              border: '1px solid var(--line)',
              background: 'var(--surface)',
              color: 'var(--ink)',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              color: timerColor,
            }}
          >
            {fmt(el)}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--sub)' }}>
            {progLabel}
          </span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 999,
            background: 'var(--line)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: progWidth,
              background: progColor,
              borderRadius: 999,
              transition: 'width .1s linear',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            marginTop: 12,
            background: 'var(--panel)',
            borderRadius: 14,
            padding: 4,
          }}
        >
          <TabBtn active={tab === 'table'} onClick={() => setTab('table')}>
            Tisch
          </TabBtn>
          <TabBtn active={tab === 'list'} onClick={() => setTab('list')}>
            Deckliste · {selTotal}/6
          </TabBtn>
        </div>
      </header>

      {tab === 'table' ? (
        <TableTab game={game} onChange={onChange} />
      ) : (
        <ListTab game={game} onChange={onChange} />
      )}

      {tab === 'list' && (
        <div style={{ padding: '10px 16px 18px', borderTop: '1px solid var(--line)' }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--sub)', textAlign: 'center' }}>
            Ausgewählt: {selTotal} / 6
          </p>
          <button
            className="btn btn-primary"
            onClick={() => canConfirm && onConfirm(game)}
            disabled={!canConfirm}
            style={{ width: '100%', padding: 15, fontSize: 16, opacity: canConfirm ? 1 : 0.45 }}
          >
            Bestätigen
          </button>
        </div>
      )}
    </div>
  )
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        border: 'none',
        borderRadius: 11,
        padding: '9px 6px',
        fontWeight: 700,
        fontSize: 13.5,
        background: active ? 'var(--surface)' : 'transparent',
        color: active ? 'var(--accentInk)' : 'var(--sub)',
        boxShadow: active ? 'var(--shadow)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

function TableTab({ game, onChange }: { game: GameState; onChange: (g: GameState) => void }) {
  const di = Math.max(0, Math.min(game.rest.length - 1, game.deckIdx || 0))
  const wheelRef = useRef(0)
  const touchY = useRef<number | null>(null)

  const move = (d: number) =>
    onChange({ ...game, deckIdx: Math.max(0, Math.min(game.rest.length - 1, di + d)) })

  const win: { k: number; i: number }[] = []
  for (let k = -2; k <= 2; k++) {
    const i = di + k
    if (i < 0 || i >= game.rest.length) continue
    win.push({ k, i })
  }

  return (
    <div className="pc-scroll" style={{ padding: '10px 16px 16px' }}>
      {/* Handkarten */}
      <SectionLabel>Hand · {game.hand.length}</SectionLabel>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {game.hand.map((c, idx) => (
          <div
            key={idx}
            style={{
              position: 'relative',
              width: 52,
              height: 72,
              flexShrink: 0,
              borderRadius: 9,
              overflow: 'hidden',
            }}
          >
            <CardFace img={c.img} name={c.n} radius={9} fontSize={8} />
          </div>
        ))}
      </div>

      {/* Aktive Position / Deck / Preise */}
      <div style={{ display: 'flex', gap: 10, margin: '14px 0' }}>
        <InfoSlot label="Aktiv">
          <div
            style={{
              position: 'relative',
              width: 30,
              height: 42,
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            <CardFace img={game.active.img} name={game.active.n} radius={6} fontSize={6} />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--ink)',
              lineHeight: 1.15,
            }}
          >
            {game.active.n}
          </span>
        </InfoSlot>
        <StatSlot label="Deck" value={String(game.rest.length)} solid />
        <StatSlot label="Preise" value="6" striped />
      </div>

      {/* Großer Deck-Stapel zum Durchblättern */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <SectionLabel>Deck · {game.rest.length} Karten</SectionLabel>
        <span style={{ fontSize: 12, color: 'var(--sub)' }}>
          {di + 1} / {game.rest.length}
        </span>
      </div>

      <div
        onWheel={(e) => {
          const now = Date.now()
          if (now - wheelRef.current < 260) return
          if (Math.abs(e.deltaY) < 8) return
          wheelRef.current = now
          move(e.deltaY > 0 ? 1 : -1)
        }}
        onTouchStart={(e) => (touchY.current = e.touches[0].clientY)}
        onTouchEnd={(e) => {
          const dy = e.changedTouches[0].clientY - (touchY.current ?? e.changedTouches[0].clientY)
          if (dy < -28) move(1)
          else if (dy > 28) move(-1)
        }}
        style={{
          position: 'relative',
          height: 300,
          borderRadius: 20,
          background: 'var(--panel)',
          overflow: 'hidden',
          touchAction: 'pan-y',
        }}
      >
        {win.map(({ k, i }) => {
          const c = game.rest[i]
          const tf =
            k === 0
              ? 'translate(-50%,-50%)'
              : `translate(-50%,-50%) translateY(${k * 44}px) scale(${1 - Math.abs(k) * 0.06})`
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                height: '78%',
                aspectRatio: '63 / 88',
                transform: tf,
                zIndex: 100 - Math.abs(k),
                transition: 'transform .26s cubic-bezier(.22,1,.36,1)',
                borderRadius: 14,
                overflow: 'hidden',
                boxShadow: k === 0 ? 'var(--shadow)' : 'none',
              }}
            >
              <CardFace img={c.img} name={c.n} radius={14} fontSize={15} />
              {k === 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                    background: 'rgba(6,50,63,.55)',
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  {i + 1} / {game.rest.length}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          marginTop: 12,
        }}
      >
        <ArrowBtn dir="↑" disabled={di === 0} onClick={() => move(-1)} />
        <span style={{ fontSize: 12, color: 'var(--sub)' }}>wischen oder Pfeile</span>
        <ArrowBtn dir="↓" disabled={di === game.rest.length - 1} onClick={() => move(1)} />
      </div>
    </div>
  )
}

function ListTab({ game, onChange }: { game: GameState; onChange: (g: GameState) => void }) {
  const selTotal = Object.values(game.sel).reduce((a, b) => a + b, 0)

  const toggle = (key: string, qty: number) => {
    const sel = { ...game.sel }
    const cur = sel[key] || 0
    if (cur > 0 && (cur >= qty || selTotal >= 6)) sel[key] = 0
    else if (selTotal < 6) sel[key] = cur + 1
    else sel[key] = 0
    onChange({ ...game, sel })
  }

  return (
    <div className="pc-scroll" style={{ padding: '10px 16px 12px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
        }}
      >
        {game.deck.cards.map((c) => {
          const sel = game.sel[c.key] || 0
          const isSel = sel > 0
          return (
            <button
              key={c.key}
              onClick={() => toggle(c.key, c.q)}
              style={{
                position: 'relative',
                aspectRatio: '63 / 88',
                borderRadius: 12,
                overflow: 'hidden',
                border: `3px solid ${isSel ? 'var(--accentInk)' : 'transparent'}`,
                padding: 0,
                background: 'var(--slot)',
              }}
            >
              <CardFace img={c.img} name={c.n} radius={9} fontSize={9} />
              <span
                style={{
                  position: 'absolute',
                  bottom: 4,
                  left: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  background: 'rgba(6,50,63,.6)',
                  padding: '1px 6px',
                  borderRadius: 999,
                }}
              >
                ×{c.q}
              </span>
              {isSel && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    minWidth: 20,
                    height: 20,
                    padding: '0 5px',
                    borderRadius: 999,
                    background: 'var(--accentInk)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✓{sel}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '0 0 6px',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: 'var(--sub)',
      }}
    >
      {children}
    </p>
  )
}

function InfoSlot({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: 10,
      }}
    >
      {children}
      <span style={{ marginLeft: 'auto', fontSize: 9.5, fontWeight: 700, color: 'var(--sub)' }}>
        {label.toUpperCase()}
      </span>
    </div>
  )
}

function StatSlot({
  label,
  value,
  solid,
  striped,
}: {
  label: string
  value: string
  solid?: boolean
  striped?: boolean
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: 10,
      }}
    >
      <div
        style={{
          width: 30,
          height: 42,
          borderRadius: 6,
          background: solid
            ? 'var(--accent)'
            : striped
              ? 'repeating-linear-gradient(45deg, var(--accentSoft), var(--accentSoft) 5px, var(--slot) 5px, var(--slot) 10px)'
              : 'var(--slot)',
        }}
      />
      <div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--sub)' }}>
          {label.toUpperCase()}
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>{value}</div>
      </div>
    </div>
  )
}

function ArrowBtn({
  dir,
  disabled,
  onClick,
}: {
  dir: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 42,
        height: 42,
        borderRadius: 999,
        border: '1px solid var(--line)',
        background: 'var(--surface)',
        color: 'var(--accentInk)',
        fontSize: 18,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {dir}
    </button>
  )
}
