import { useEffect, useRef, useState } from 'react'
import { type GameState, fmt } from '../game'
import { CardFace } from '../CardFace'
import { DeckBackground } from '../DeckBackground'

interface Props {
  game: GameState
  dark: boolean
  onChange: (g: GameState) => void
  onQuit: () => void
  onConfirm: (g: GameState) => void
}

const LIMIT = 45

export function GameScreen({ game, dark, onChange, onQuit, onConfirm }: Props) {
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
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
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
        <TableTab game={game} dark={dark} onChange={onChange} />
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

function TableTab({
  game,
  dark,
  onChange,
}: {
  game: GameState
  dark: boolean
  onChange: (g: GameState) => void
}) {
  const len = game.rest.length
  const SPACING = 44

  // Kontinuierliche Scroll-Position (Bruchzahl) für Schwung-/Trägheits-Scrollen:
  // anstupsen, weiterlaufen lassen und sanft auf die nächste Karte einrasten —
  // wie eine echte Scrollbar, die nach dem Loslassen weiterläuft.
  const posRef = useRef(Math.max(0, Math.min(len - 1, game.deckIdx || 0)))
  const velRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const draggingRef = useRef(false)
  const lastYRef = useRef(0)
  const lastTRef = useRef(0)
  const committedRef = useRef(Math.round(posRef.current))
  const [pos, setPos] = useState(posRef.current)

  const clampPos = (p: number) => Math.max(0, Math.min(len - 1, p))

  const commitIdx = (p: number) => {
    const idx = clampPos(Math.round(p))
    if (idx !== committedRef.current) {
      committedRef.current = idx
      onChange({ ...game, deckIdx: idx })
    }
  }

  const applyPos = (p: number) => {
    const c = clampPos(p)
    posRef.current = c
    setPos(c)
    commitIdx(c)
    return c
  }

  const stopRaf = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  // Schwung: Position mit abklingender Geschwindigkeit weiterlaufen lassen,
  // dann sanft auf die nächste ganze Karte einrasten.
  const runMomentum = () => {
    stopRaf()
    const step = () => {
      let p = posRef.current + velRef.current
      if (p <= 0) {
        p = 0
        velRef.current = 0
      }
      if (p >= len - 1) {
        p = len - 1
        velRef.current = 0
      }
      velRef.current *= 0.92
      if (Math.abs(velRef.current) < 0.0015) {
        const target = clampPos(Math.round(p))
        const np = p + (target - p) * 0.22
        if (Math.abs(target - np) < 0.004) {
          applyPos(target)
          rafRef.current = null
          return
        }
        applyPos(np)
      } else {
        applyPos(p)
      }
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }

  // Sanftes Gleiten zu einer Zielkarte (Pfeiltasten).
  const glideTo = (target: number) => {
    stopRaf()
    velRef.current = 0
    const t = clampPos(target)
    const step = () => {
      const np = posRef.current + (t - posRef.current) * 0.22
      if (Math.abs(t - np) < 0.004) {
        applyPos(t)
        rafRef.current = null
        return
      }
      applyPos(np)
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }

  useEffect(() => stopRaf, [])

  const di = clampPos(Math.round(pos))

  // Sichtbares Fenster um die aktuelle Position (überlappender Stapel).
  const base = Math.round(pos)
  const winIdx: number[] = []
  for (let i = base - 3; i <= base + 3; i++) {
    if (i < 0 || i >= len) continue
    winIdx.push(i)
  }

  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '10px 16px 14px',
        overflow: 'hidden',
      }}
    >
      <DeckBackground deck={game.deck} dark={dark} intensity="full" />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Hand & aktives Pokémon in einer überlappenden Reihe (kein Scroll) */}
        <SectionLabel>Hand · {game.hand.length} · Aktiv</SectionLabel>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            paddingBottom: 4,
            marginBottom: 12,
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 54,
              height: 75,
              flexShrink: 0,
              borderRadius: 9,
              overflow: 'hidden',
              border: '2px solid var(--accent)',
              boxShadow: 'var(--shadow)',
              zIndex: 20,
            }}
          >
            <CardFace img={game.active.img} name={game.active.n} radius={9} fontSize={8} />
            <span
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: 8.5,
                fontWeight: 800,
                letterSpacing: 0.4,
                color: '#fff',
                background: 'var(--accentInk)',
                padding: '1px 0',
              }}
            >
              AKTIV
            </span>
          </div>
          {game.hand.map((c, idx) => (
            <div
              key={idx}
              style={{
                position: 'relative',
                width: 50,
                height: 70,
                flexShrink: 0,
                marginLeft: idx === 0 ? 8 : -22,
                borderRadius: 9,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(14,42,50,.18)',
                zIndex: idx + 1,
              }}
            >
              <CardFace img={c.img} name={c.n} radius={9} fontSize={8} />
            </div>
          ))}
        </div>

        {/* Deck-Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
            flexShrink: 0,
          }}
        >
          <SectionLabel>Deck durchblättern</SectionLabel>
          <span style={{ fontSize: 12, color: 'var(--sub)' }}>
            {di + 1} / {game.rest.length}
          </span>
        </div>

        {/* Überlappender Deck-Stapel mit Schwung-Scrollen (füllt den Rest) */}
        <div
          onWheel={(e) => {
            velRef.current = Math.max(
              -1.2,
              Math.min(1.2, velRef.current + (e.deltaY / SPACING) * 0.6),
            )
            runMomentum()
          }}
          onTouchStart={(e) => {
            stopRaf()
            draggingRef.current = true
            velRef.current = 0
            lastYRef.current = e.touches[0].clientY
            lastTRef.current = performance.now()
          }}
          onTouchMove={(e) => {
            if (!draggingRef.current) return
            const y = e.touches[0].clientY
            const now = performance.now()
            const dp = -(y - lastYRef.current) / SPACING
            const dt = Math.max(1, now - lastTRef.current)
            applyPos(posRef.current + dp)
            velRef.current = (dp / dt) * 16
            lastYRef.current = y
            lastTRef.current = now
          }}
          onTouchEnd={() => {
            draggingRef.current = false
            runMomentum()
          }}
          style={{
            position: 'relative',
            flex: 1,
            minHeight: 0,
            touchAction: 'none',
          }}
        >
          {winIdx.map((i) => {
            const c = game.rest[i]
            const d = i - pos
            const ad = Math.abs(d)
            const isCurrent = i === di
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  height: '86%',
                  aspectRatio: '63 / 88',
                  transform: `translate(-50%,-50%) translateY(${d * SPACING}px) scale(${1 - Math.min(ad, 3) * 0.06})`,
                  zIndex: 100 - Math.round(ad * 10),
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: isCurrent ? 'var(--shadow)' : 'none',
                  opacity: Math.max(0.45, 1 - ad * 0.14),
                }}
              >
                <CardFace img={c.img} name={c.n} radius={14} fontSize={15} />
                {isCurrent && (
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
                    {i + 1} / {len}
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
            marginTop: 10,
            flexShrink: 0,
          }}
        >
          <ArrowBtn
            dir="↑"
            disabled={di === 0}
            onClick={() => glideTo(Math.round(posRef.current) - 1)}
          />
          <span style={{ fontSize: 12, color: 'var(--sub)' }}>wischen oder Pfeile</span>
          <ArrowBtn
            dir="↓"
            disabled={di === len - 1}
            onClick={() => glideTo(Math.round(posRef.current) + 1)}
          />
        </div>
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
