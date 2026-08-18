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
  // Fan-Position (Bruchzahl über game.rest) & angehobene Karten leben lokal,
  // damit Drag/Scrub flüssig bleibt und der Tab-Wechsel sie nicht zurücksetzt.
  const [fanPos, setFanPos] = useState(0)
  const [raised, setRaised] = useState<Record<number, boolean>>({})

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
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Dynamischer, deckabhängiger Pixel-Hintergrund (ganzer Screen) */}
      <DeckBackground deck={game.deck} dark={dark} intensity="full" />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
      {/* Kopf: Beenden + Timer/Restzeit + Fortschrittsbalken */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px 6px' }}>
        <button
          onClick={onQuit}
          aria-label="Beenden"
          style={{
            width: 38,
            height: 38,
            borderRadius: 13,
            flex: 'none',
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            fontSize: 16,
          }}
        >
          ✕
        </button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: 0.5,
                fontVariantNumeric: 'tabular-nums',
                color: timerColor,
              }}
            >
              {fmt(el)}
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                color: progColor,
              }}
            >
              {progLabel}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: 'var(--panel)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: progWidth,
                background: progColor,
                borderRadius: 999,
                transition: 'width .1s linear, background .3s',
              }}
            />
          </div>
        </div>
      </div>

      {tab === 'table' ? (
        <TableTab
          game={game}
          fanPos={fanPos}
          setFanPos={setFanPos}
          raised={raised}
          setRaised={setRaised}
        />
      ) : (
        <ListTab
          game={game}
          selTotal={selTotal}
          canConfirm={canConfirm}
          onChange={onChange}
          onConfirm={() => canConfirm && onConfirm(game)}
        />
      )}

      {/* Untere Umschaltleiste: Tisch ⟷ Deckliste */}
      <div
        style={{
          flex: 'none',
          display: 'flex',
          gap: 6,
          background: 'var(--surface)',
          borderTop: '1px solid var(--line)',
          padding: '8px 18px 14px',
        }}
      >
        <TabBtn active={tab === 'table'} onClick={() => setTab('table')}>
          Tisch
        </TabBtn>
        <TabBtn active={tab === 'list'} onClick={() => setTab('list')}>
          Deckliste · {selTotal}/6
        </TabBtn>
      </div>
      </div>
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
        height: 44,
        border: 'none',
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? 'var(--accentSoft)' : 'var(--panel)',
        color: active ? 'var(--accentInk)' : 'var(--sub)',
      }}
    >
      {children}
    </button>
  )
}

function TableTab({
  game,
  fanPos,
  setFanPos,
  raised,
  setRaised,
}: {
  game: GameState
  fanPos: number
  setFanPos: (p: number) => void
  raised: Record<number, boolean>
  setRaised: (r: Record<number, boolean>) => void
}) {
  const N = game.rest.length
  const maxPos = Math.max(0, N - 1)
  const clampP = (p: number) => Math.max(0, Math.min(maxPos, p))
  const pos = clampP(fanPos)
  const deckIdx1 = N ? Math.round(pos) + 1 : 0

  const raisedCount = Object.values(raised).filter(Boolean).length
  const raisedLabel = raisedCount > 0 ? `${raisedCount} angehoben · ` : ''

  const fdrag = useRef<{ x: number; pos: number } | null>(null)
  const fanMoved = useRef(false)
  const tapIdx = useRef<number | null>(null)
  const sdrag = useRef(false)

  const dragging = fdrag.current != null || sdrag.current
  const trans = dragging
    ? 'none'
    : 'transform .18s cubic-bezier(.2,.8,.3,1), box-shadow .18s, border-color .18s'

  // --- Fächer: horizontal ziehen / Rad, Tippen hebt eine Karte an ---
  const fanDown = (e: React.PointerEvent) => {
    fdrag.current = { x: e.clientX, pos }
    fanMoved.current = false
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }
  const fanMove = (e: React.PointerEvent) => {
    const fd = fdrag.current
    if (!fd) return
    const dx = e.clientX - fd.x
    if (Math.abs(dx) > 6) fanMoved.current = true
    setFanPos(clampP(fd.pos - dx / 40))
  }
  const fanUp = () => {
    const idx = tapIdx.current
    const tap = !fanMoved.current && idx != null
    fdrag.current = null
    tapIdx.current = null
    if (tap) setRaised({ ...raised, [idx!]: !raised[idx!] })
    else setFanPos(Math.round(pos))
  }
  const fanWheel = (e: React.WheelEvent) => {
    setFanPos(clampP(pos + (e.deltaY + e.deltaX) / 50))
  }

  // --- Scrubber-Leiste (Scrollbar) ---
  const scrubTo = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    const f = Math.max(0, Math.min(1, (e.clientX - r.left - 31) / (r.width - 62)))
    setFanPos(f * maxPos)
  }
  const scrubDown = (e: React.PointerEvent) => {
    sdrag.current = true
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    scrubTo(e)
  }
  const scrubMove = (e: React.PointerEvent) => {
    if (sdrag.current) scrubTo(e)
  }
  const scrubUp = () => {
    sdrag.current = false
    setFanPos(Math.round(pos))
  }

  const frac = N > 1 ? pos / (N - 1) : 0

  const cards: number[] = []
  for (let i = Math.max(0, Math.ceil(pos) - 9); i <= Math.min(N - 1, Math.floor(pos) + 9); i++) {
    cards.push(i)
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '4px 18px 8px',
        gap: 10,
      }}
    >
      {/* Aktiv + Hand */}
      <div style={{ flex: 'none' }}>
        <div style={{ display: 'flex', gap: 16, margin: '0 4px 6px' }}>
          <Label color="var(--accentInk)">Aktiv</Label>
          <Label color="var(--sub)">Hand · {game.hand.length}</Label>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end' }}>
          <div
            style={{
              flex: 1.12,
              aspectRatio: '63 / 88',
              borderRadius: 9,
              position: 'relative',
              overflow: 'hidden',
              background: 'var(--slot)',
              border: '2px solid var(--accentInk)',
            }}
          >
            <CardFace img={game.active.img} fallbackImg={game.active.fallbackImg} name={game.active.n} radius={9} fontSize={8} />
            <span
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: 6.5,
                fontWeight: 800,
                letterSpacing: 0.6,
                color: '#fff',
                background: 'var(--accentInk)',
                padding: '1.5px 0',
              }}
            >
              AKTIV
            </span>
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--line)', margin: '2px 3px' }} />
          {game.hand.map((c, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                aspectRatio: '63 / 88',
                borderRadius: 8,
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--slot)',
              }}
            >
              <CardFace img={c.img} fallbackImg={c.fallbackImg} name={c.n.split(' ')[0]} radius={8} fontSize={7} />
            </div>
          ))}
        </div>
      </div>

      {/* Deck-Fächer + Scrubber */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '0 4px' }}>
          <Label color="var(--sub)">Deck</Label>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sub)', fontVariantNumeric: 'tabular-nums' }}>
            {raisedLabel}
            {deckIdx1} / {N}
          </span>
        </div>

        {/* Raised-Cards-Shelf: angehobene Karten gruppiert als Mini-Thumbnails */}
        {raisedCount > 0 && (
          <RaisedShelf rest={game.rest} raised={raised} onJump={setFanPos} />
        )}

        <div
          onPointerDown={fanDown}
          onPointerMove={fanMove}
          onPointerUp={fanUp}
          onWheel={fanWheel}
          style={{
            flex: 1,
            minHeight: 0,
            position: 'relative',
            overflow: 'hidden',
            touchAction: 'none',
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          {cards.map((i) => {
            const c = game.rest[i]
            const d = i - pos
            const up = !!raised[i]
            const x = d * 34 + (d <= -0.5 ? -50 : d >= 0.5 ? 50 : d * 100) + 44
            const rot = Math.max(-14, Math.min(14, d * 3))
            const proximity = Math.max(0, 1 - Math.abs(d) / 3)
            const y = Math.abs(d) * 3.5 - proximity * 24 + (up ? -62 : 0)
            return (
              <div
                key={i}
                onPointerDown={() => {
                  tapIdx.current = i
                }}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 100,
                  width: '71%',
                  maxWidth: 275,
                  aspectRatio: '63 / 88',
                  zIndex: 200 + i,
                  transform: `translateX(calc(-50% + ${x.toFixed(1)}px)) translateY(${y.toFixed(
                    1,
                  )}px) rotate(${rot.toFixed(2)}deg)`,
                  transition: trans,
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: `2px solid ${up ? 'var(--accentInk)' : 'var(--surface)'}`,
                    boxShadow: up
                      ? '0 4px 12px rgba(0,0,0,.15)'
                      : 'var(--shadow)',
                  }}
                >
                  <CardFace img={c.img} fallbackImg={c.fallbackImg} name={c.n} radius={10} fontSize={13} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Scrubber */}
        <div
          onPointerDown={scrubDown}
          onPointerMove={scrubMove}
          onPointerUp={scrubUp}
          style={{
            position: 'relative',
            flex: 'none',
            height: 50,
            margin: '4px 2px 0',
            borderRadius: 999,
            background: 'var(--panel)',
            touchAction: 'none',
            cursor: 'pointer',
            overflow: 'hidden',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '13px 10px',
              pointerEvents: 'none',
              backgroundImage: `repeating-linear-gradient(90deg, var(--line) 0, var(--line) 1.5px, transparent 1.5px, transparent ${(
                100 / Math.max(N, 1)
              ).toFixed(3)}%)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: `calc((100% - 72px) * ${frac.toFixed(4)} + 6px)`,
              width: 60,
              height: 34,
              borderRadius: 999,
              background: 'var(--accentInk)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              pointerEvents: 'none',
              transition: dragging ? 'none' : 'left .18s',
            }}
          >
            {deckIdx1}
          </div>
        </div>
      </div>
    </div>
  )
}

function ListTab({
  game,
  selTotal,
  canConfirm,
  onChange,
  onConfirm,
}: {
  game: GameState
  selTotal: number
  canConfirm: boolean
  onChange: (g: GameState) => void
  onConfirm: () => void
}) {
  const toggle = (key: string, qty: number) => {
    const sel = { ...game.sel }
    const cur = sel[key] || 0
    if (cur > 0 && (cur >= qty || selTotal >= 6)) sel[key] = 0
    else if (selTotal < 6) sel[key] = cur + 1
    else sel[key] = 0
    onChange({ ...game, sel })
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="pc-scroll" style={{ padding: '2px 18px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
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
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: `2.5px solid ${isSel ? 'var(--accentInk)' : 'transparent'}`,
                  padding: 0,
                  background: 'var(--slot)',
                  opacity: isSel || selTotal < 6 ? 1 : 0.55,
                }}
              >
                <CardFace img={c.img} fallbackImg={c.fallbackImg} name={c.n.split(' ').slice(0, 2).join(' ')} radius={6} fontSize={7} />
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    fontSize: 8.5,
                    fontWeight: 700,
                    color: '#fff',
                    background: 'rgba(14,42,50,.75)',
                    padding: '1.5px 4.5px',
                    borderRadius: 6,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  ×{c.q}
                </span>
                {isSel && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      left: 2,
                      fontSize: 9,
                      fontWeight: 800,
                      color: '#fff',
                      background: 'var(--accent)',
                      padding: '2px 5px',
                      borderRadius: 6,
                      animation: 'popIn .15s ease',
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

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 18px',
          borderTop: '1px solid var(--line)',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {selTotal} / 6
        </div>
        <button
          onClick={onConfirm}
          disabled={!canConfirm}
          style={{
            flex: 1,
            height: 44,
            border: 'none',
            borderRadius: 10,
            background: 'var(--accent)',
            color: '#06323f',
            fontSize: 14,
            fontWeight: 600,
            opacity: canConfirm ? 1 : 0.4,
          }}
        >
          Bestätigen
        </button>
      </div>
    </div>
  )
}

function Label({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color,
      }}
    >
      {children}
    </span>
  )
}

// Mini-Thumbnails der angehobenen Karten, gruppiert nach Kartentyp.
// Zeigt z. B. "2/4" = 2 von 4 Kopien angehoben. Tipp scrollt zum Kartenindex.
function RaisedShelf({
  rest,
  raised,
  onJump,
}: {
  rest: import('../game').Card[]
  raised: Record<number, boolean>
  onJump: (idx: number) => void
}) {
  const groups = new Map<string, { card: import('../game').Card; count: number; firstIdx: number }>()
  for (const [idx, up] of Object.entries(raised)) {
    if (!up) continue
    const i = +idx
    const c = rest[i]
    if (!c) continue
    const g = groups.get(c.key)
    if (g) g.count++
    else groups.set(c.key, { card: c, count: 1, firstIdx: i })
  }
  if (!groups.size) return null
  return (
    <div
      style={{
        display: 'flex',
        gap: 5,
        padding: '2px 0',
        overflowX: 'auto',
        flexShrink: 0,
      }}
    >
      {[...groups.values()].map(({ card, count, firstIdx }) => (
        <button
          key={card.key}
          onClick={() => onJump(firstIdx)}
          style={{
            flex: 'none',
            width: 32,
            height: 45,
            borderRadius: 6,
            border: '1.5px solid var(--accentInk)',
            padding: 0,
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--slot)',
          }}
        >
          <CardFace img={card.img} fallbackImg={card.fallbackImg} name={card.n.split(' ')[0]} radius={6} fontSize={5} />
          <span
            style={{
              position: 'absolute',
              bottom: 1,
              right: 1,
              fontSize: 7.5,
              fontWeight: 800,
              color: '#fff',
              background: 'var(--accentInk)',
              padding: '1px 3px',
              borderRadius: 4,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {count}/{card.q}
          </span>
        </button>
      ))}
    </div>
  )
}
