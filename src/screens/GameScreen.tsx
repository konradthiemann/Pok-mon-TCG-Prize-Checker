import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { type Card, type CardType, type GameState } from '../game'
import {
  addCopy,
  lockedType,
  removeCopy,
  selectedTotal,
  toggleRaise,
  visibleRange,
  type Raised,
} from '../gameFlow'
import { CardFace } from '../CardFace'
import { DeckBackground } from '../DeckBackground'
import { useT } from '../i18n'

interface Props {
  game: GameState
  dark: boolean
  onChange: (g: GameState) => void
  onQuit: () => void
  onConfirm: (g: GameState) => void
}

const LIMIT = 45
// Sichtbarer Kopfbalken jeder Karte in der Kaskade, als Anteil der Kartenhöhe:
// reicht für Stufe/Typ + Name, auch bei Trainern unter dem „Item"-Label.
const BAND = 0.13
const HINT_MS = 2500

type Tab = 'table' | 'list'

export function GameScreen({ game, dark, onChange, onQuit, onConfirm }: Props) {
  const t = useT()
  const [tab, setTab] = useState<Tab>('table')
  // Angehobene Karten, Scroll-Position & Tastatur-Fokus leben hier, damit der
  // Tab-Wechsel (TableTab wird dabei abgebaut) sie nicht zurücksetzt.
  const [raised, setRaised] = useState<Raised>({})
  const [focusIdx, setFocusIdx] = useState(0)
  const deckScroll = useRef(0)
  const [hint, setHint] = useState('')
  const hintTimer = useRef<ReturnType<typeof setTimeout>>()
  const ids = useId()
  const tabId = (k: Tab) => `${ids}-tab-${k}`
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ table: null, list: null })

  useEffect(() => () => clearTimeout(hintTimer.current), [])

  const showHint = (msg: string) => {
    clearTimeout(hintTimer.current)
    setHint(msg)
    hintTimer.current = setTimeout(() => setHint(''), HINT_MS)
  }

  const switchTab = (next: Tab) => {
    clearTimeout(hintTimer.current)
    setHint('')
    setTab(next)
  }

  // Tabs-Muster: Pfeiltasten/Pos1/Ende wechseln zwischen den beiden Tabs.
  const onTabKey = (e: React.KeyboardEvent) => {
    const next: Tab | null =
      e.key === 'ArrowLeft' || e.key === 'Home' ? 'table' : e.key === 'ArrowRight' || e.key === 'End' ? 'list' : null
    if (!next) return
    e.preventDefault()
    switchTab(next)
    tabRefs.current[next]?.focus()
  }

  const selTotal = selectedTotal(game.sel)
  const raisedCount = Object.values(raised).filter(Boolean).length
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
      {/* Kopf: Beenden (links) + Uhr (rechts) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 4px' }}>
        <button
          onClick={onQuit}
          aria-label={t.quit}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            flex: 'none',
            border: 'none',
            background: 'var(--surface)',
            color: 'var(--sub)',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" />
          </svg>
        </button>
        <ClockTimer start={game.start} end={game.end} raisedCount={raisedCount} />
      </div>

      <div
        role="tabpanel"
        id={`${ids}-panel`}
        aria-labelledby={tabId(tab)}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      >
        {tab === 'table' ? (
          <TableTab
            game={game}
            raised={raised}
            setRaised={setRaised}
            focusIdx={focusIdx}
            setFocusIdx={setFocusIdx}
            scrollPos={deckScroll}
            onHint={showHint}
          />
        ) : (
          <ListTab
            game={game}
            selTotal={selTotal}
            canConfirm={canConfirm}
            onChange={onChange}
            onConfirm={() => canConfirm && onConfirm(game)}
            onHint={showHint}
          />
        )}
      </div>

      {/* Hinweis bei blockierten Aktionen — schwebt über der Daumenzone, ohne Layout-Sprung */}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: tab === 'list' ? 138 : 76,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        {hint && (
          <span
            style={{
              background: 'var(--ink)',
              color: 'var(--bg)',
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.3,
              textAlign: 'center',
              padding: '8px 14px',
              borderRadius: 14,
              boxShadow: 'var(--shadow)',
              animation: 'popIn .15s ease',
            }}
          >
            {hint}
          </span>
        )}
      </div>

      {/* Untere Umschaltleiste: Tisch ⟷ Deckliste */}
      <div
        role="tablist"
        style={{
          flex: 'none',
          display: 'flex',
          gap: 6,
          background: 'var(--surface)',
          borderTop: '1px solid var(--line)',
          padding: '8px 18px 14px',
        }}
      >
        {(['table', 'list'] as const).map((k) => (
          <TabBtn
            key={k}
            id={tabId(k)}
            panelId={`${ids}-panel`}
            btnRef={(el) => {
              tabRefs.current[k] = el
            }}
            active={tab === k}
            onClick={() => switchTab(k)}
            onKeyDown={onTabKey}
          >
            {k === 'table' ? t.table : `${t.decklist} · ${selTotal}/6`}
          </TabBtn>
        ))}
      </div>
      </div>
    </div>
  )
}

function TabBtn({
  id,
  panelId,
  btnRef,
  active,
  onClick,
  onKeyDown,
  children,
}: {
  id: string
  panelId: string
  btnRef: (el: HTMLButtonElement | null) => void
  active: boolean
  onClick: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  children: React.ReactNode
}) {
  return (
    <button
      ref={btnRef}
      id={id}
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      onKeyDown={onKeyDown}
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
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {children}
    </button>
  )
}

// Aktiv + Hand: sichtbare Fakten, die beim Zählen in beiden Tabs gebraucht werden.
function HandRow({ game }: { game: GameState }) {
  const t = useT()
  return (
    <div style={{ flex: 'none' }}>
      <div style={{ display: 'flex', gap: 16, margin: '0 4px 6px' }}>
        <Label color="var(--accentInk)">{t.active}</Label>
        <Label color="var(--sub)">{t.hand} · {game.hand.length}</Label>
      </div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end' }}>
        <div
          role="group"
          aria-label={t.active}
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
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--line)', margin: '2px 3px' }} />
        <div role="group" aria-label={t.hand} style={{ flex: game.hand.length, display: 'flex', gap: 5 }}>
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
              <CardFace img={c.img} fallbackImg={c.fallbackImg} name={c.n} radius={8} fontSize={7} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TableTab({
  game,
  raised,
  setRaised,
  focusIdx,
  setFocusIdx,
  scrollPos,
  onHint,
}: {
  game: GameState
  raised: Raised
  setRaised: React.Dispatch<React.SetStateAction<Raised>>
  // Roving Tabindex: nur eine Karte ist im Tab-Fluss, Pfeiltasten wandern weiter.
  focusIdx: number
  setFocusIdx: (i: number) => void
  scrollPos: React.MutableRefObject<number>
  onHint: (msg: string) => void
}) {
  const t = useT()
  const N = game.rest.length
  const lock = lockedType(raised, game.rest)
  const raisedCount = Object.values(raised).filter(Boolean).length
  const typeLabel: Record<CardType, string> = { P: t.pokemon, T: t.trainer, E: t.energy }

  const scroller = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [range, setRange] = useState<[number, number]>(() => visibleRange(0, 0, 0, N))

  const updateRange = () => {
    const el = scroller.current
    if (!el) return
    const step = cardRefs.current[0]?.offsetHeight ?? 0
    const next = visibleRange(el.scrollTop, el.clientHeight, step, N)
    setRange((prev) => (prev[0] === next[0] && prev[1] === next[1] ? prev : next))
  }

  // Scroll-Position beim Abbauen (Tab-Wechsel) sichern und beim Aufbauen
  // wiederherstellen — unabhängig davon, ob zuletzt ein Scroll-Event kam.
  useLayoutEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = scrollPos.current
    updateRange()
    window.addEventListener('resize', updateRange)
    return () => {
      if (el) scrollPos.current = el.scrollTop
      window.removeEventListener('resize', updateRange)
    }
  }, [])

  const onScroll = () => {
    if (scroller.current) scrollPos.current = scroller.current.scrollTop
    updateRange()
  }

  const tap = (i: number) => {
    setFocusIdx(i)
    const { blocked } = toggleRaise(raised, i, game.rest)
    if (blocked) onHint(t.raiseLocked(typeLabel[blocked]))
    // Funktional, damit schnelle Taps nicht auf veraltetem Stand aufsetzen
    else setRaised((prev) => toggleRaise(prev, i, game.rest).raised)
  }

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    // Kombinationen (z. B. Alt+← = Zurück) gehören dem Browser
    if (e.altKey || e.metaKey || e.ctrlKey) return
    const moves: Record<string, number> = {
      ArrowDown: i + 1,
      ArrowRight: i + 1,
      ArrowUp: i - 1,
      ArrowLeft: i - 1,
      PageDown: i + 10,
      PageUp: i - 10,
      Home: 0,
      End: N - 1,
    }
    if (!(e.key in moves)) return
    e.preventDefault()
    const next = Math.max(0, Math.min(N - 1, moves[e.key]))
    setFocusIdx(next)
    cardRefs.current[next]?.focus()
  }

  const jumpTo = (idx: number) => {
    cardRefs.current[idx]?.scrollIntoView({ block: 'center' })
  }

  const rangeLabel = range[0] === range[1] ? `${range[0]}` : `${range[0]}–${range[1]}`

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '4px 18px 0',
        gap: 10,
      }}
    >
      <HandRow game={game} />

      {/* Deck: Kopfzeile, Regal (fester Platz), Kaskade */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '0 4px' }}>
          <Label color="var(--sub)">{t.deck}</Label>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--sub)', fontVariantNumeric: 'tabular-nums' }}>
            {raisedCount > 0 ? `${raisedCount} ${t.raised} · ` : ''}
            {rangeLabel} / {N}
          </span>
        </div>

        <RaisedShelf rest={game.rest} raised={raised} onJump={jumpTo} />

        {/* Volle Breite (negativer Rand), damit die Scrollbar am Rand sitzt */}
        <div
          ref={scroller}
          onScroll={onScroll}
          role="group"
          aria-label={t.deck}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            // Eigener Stacking-Kontext: die zIndex-Staffel der Karten bleibt drin
            isolation: 'isolate',
            margin: '0 -18px',
            padding: '6px 0 16px',
          }}
        >
          {game.rest.map((c, i) => {
            const up = !!raised[i]
            const locked = !up && lock !== null && c.t !== lock
            const last = i === N - 1
            return (
              <button
                key={i}
                ref={(el) => {
                  cardRefs.current[i] = el
                }}
                className="pc-cascade-card"
                aria-label={t.deckCardLabel(c.n, i + 1, N)}
                aria-pressed={up}
                aria-disabled={locked || undefined}
                tabIndex={i === focusIdx ? 0 : -1}
                onClick={() => tap(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                onFocus={() => setFocusIdx(i)}
                style={{
                  position: 'relative',
                  zIndex: i,
                  display: 'block',
                  width: 'min(72%, 300px)',
                  aspectRatio: last ? '63 / 88' : `63 / ${(88 * BAND).toFixed(2)}`,
                  minHeight: last ? undefined : 48,
                  margin: '0 auto',
                  padding: 0,
                  border: 'none',
                  // Unten eckig: die nächste Karte schließt direkt an
                  borderRadius: last ? 12 : '12px 12px 0 0',
                  background: 'none',
                  touchAction: 'manipulation',
                  // Angehoben: der ganze Balken rückt ein — Trefferfläche wandert mit
                  transform: up ? 'translateX(14px)' : 'none',
                }}
              >
                {/* Karte auf den eigenen Balken beschneiden, damit nichts neben den Folgekarten hervorsteht */}
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    overflow: 'hidden',
                    borderRadius: 'inherit',
                    pointerEvents: 'none',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      display: 'block',
                      width: '100%',
                      aspectRatio: '63 / 88',
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: `2px solid ${up ? 'var(--accentInk)' : 'var(--surface)'}`,
                    }}
                  >
                    <CardFace img={c.img} fallbackImg={c.fallbackImg} name={c.n} radius={10} fontSize={13} />
                    {/* Abdimmen per deckender Schicht statt opacity — sonst scheint die Karte darunter durch */}
                    {locked && (
                      <span style={{ position: 'absolute', inset: 0, background: 'var(--bg)', opacity: 0.6 }} />
                    )}
                  </span>
                </span>
                {up && (
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      left: -16,
                      top: 12,
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      background: 'var(--accentInk)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 0 2px var(--bg)',
                      pointerEvents: 'none',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--bg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2.5,6.5 5,9 9.5,3.5" />
                    </svg>
                  </span>
                )}
              </button>
            )
          })}
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
  onHint,
}: {
  game: GameState
  selTotal: number
  canConfirm: boolean
  onChange: (g: GameState) => void
  onConfirm: () => void
  onHint: (msg: string) => void
}) {
  const t = useT()
  const add = (c: Card) => {
    const r = addCopy(game.sel, c.key, c.q)
    if (r.result === 'max') onHint(t.allCopiesPicked(c.q))
    else if (r.result === 'full') onHint(t.prizesFull)
    else onChange({ ...game, sel: r.sel })
  }
  const remove = (c: Card) => onChange({ ...game, sel: removeCopy(game.sel, c.key) })

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="pc-scroll" style={{ padding: '4px 18px 16px' }}>
        <HandRow game={game} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 14 }}>
          {game.deck.cards.map((c) => {
            const sel = game.sel[c.key] || 0
            const isSel = sel > 0
            return (
              <div key={c.key} style={{ position: 'relative' }}>
                <button
                  aria-label={t.pickLabel(c.n, sel, c.q)}
                  onClick={() => add(c)}
                  style={{
                    position: 'relative',
                    touchAction: 'manipulation',
                    display: 'block',
                    width: '100%',
                    aspectRatio: '63 / 88',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: `3px solid ${isSel ? 'var(--accentInk)' : 'transparent'}`,
                    padding: 0,
                    background: 'var(--slot)',
                    opacity: isSel || selTotal < 6 ? 1 : 0.5,
                  }}
                >
                  <CardFace img={c.img} fallbackImg={c.fallbackImg} name={c.n} radius={6} fontSize={9} />
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      fontSize: 12,
                      fontWeight: 700,
                      lineHeight: 1,
                      color: '#fff',
                      background: 'rgba(14,42,50,.78)',
                      padding: '3px 5px',
                      borderRadius: 6,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    ×{c.q}
                  </span>
                  {isSel && (
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        bottom: 2,
                        left: 2,
                        fontSize: 12,
                        fontWeight: 800,
                        lineHeight: 1,
                        color: '#06323f',
                        background: 'var(--accent)',
                        padding: '4px 6px',
                        borderRadius: 6,
                        fontVariantNumeric: 'tabular-nums',
                        animation: 'popIn .15s ease',
                      }}
                    >
                      ✓{sel}
                    </span>
                  )}
                </button>
                {isSel && (
                  <button
                    aria-label={t.removeCopyLabel(c.n)}
                    onClick={() => remove(c)}
                    style={{
                      position: 'absolute',
                      touchAction: 'manipulation',
                      right: -6,
                      bottom: -6,
                      width: 32,
                      height: 32,
                      padding: 0,
                      borderRadius: 999,
                      border: '2px solid var(--bg)',
                      background: 'var(--accentInk)',
                      color: 'var(--bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <line x1="2" y1="6" x2="10" y2="6" />
                    </svg>
                  </button>
                )}
              </div>
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
          background: 'var(--surface)',
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
            background: canConfirm ? 'var(--accent)' : 'var(--panel)',
            color: canConfirm ? '#06323f' : 'var(--sub)',
            fontSize: 14,
            fontWeight: 600,
            cursor: canConfirm ? 'pointer' : 'default',
          }}
        >
          {t.confirm}
        </button>
      </div>
    </div>
  )
}

function Label({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 12,
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

// Mini-Thumbnails der angehobenen Karten, gruppiert nach Kartentyp — mit festem
// Platz, damit das erste Anheben die Kaskade nicht verschiebt. Zeigt nur die
// Anzahl (Raise-Guard „Count-only"). Tipp scrollt zur ersten angehobenen Kopie.
function RaisedShelf({
  rest,
  raised,
  onJump,
}: {
  rest: Card[]
  raised: Raised
  onJump: (idx: number) => void
}) {
  const t = useT()
  const groups = new Map<string, { card: Card; count: number; firstIdx: number }>()
  for (const [idx, up] of Object.entries(raised)) {
    if (!up) continue
    const i = +idx
    const c = rest[i]
    if (!c) continue
    const g = groups.get(c.key)
    if (g) {
      g.count++
      g.firstIdx = Math.min(g.firstIdx, i)
    } else groups.set(c.key, { card: c, count: 1, firstIdx: i })
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: 64,
        padding: '0 4px',
        borderRadius: 12,
        background: 'var(--surface)',
        overflowX: 'auto',
        flexShrink: 0,
      }}
    >
      {groups.size === 0 ? (
        <span style={{ fontSize: 12, color: 'var(--sub)', margin: '0 8px' }}>{t.raiseHint}</span>
      ) : (
        [...groups.values()].map(({ card, count, firstIdx }) => (
          <button
            key={card.key}
            aria-label={t.raisedOnShelf(card.n, count)}
            onClick={() => onJump(firstIdx)}
            style={{
              flex: 'none',
              width: 40,
              height: 56,
              borderRadius: 6,
              border: '2px solid var(--accentInk)',
              padding: 0,
              position: 'relative',
              overflow: 'hidden',
              background: 'var(--slot)',
            }}
          >
            <CardFace img={card.img} fallbackImg={card.fallbackImg} name={card.n} radius={4} fontSize={6} />
            <span
              aria-hidden
              style={{
                position: 'absolute',
                bottom: 1,
                right: 1,
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--bg)',
                background: 'var(--accentInk)',
                padding: '2px 4px',
                borderRadius: 4,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {count}
            </span>
          </button>
        ))
      )}
    </div>
  )
}

// Kreisförmige Uhr: Bogen füllt sich im Uhrzeigersinn. Zeigt die Zeit als Text.
// Ringfarbe wechselt dezent von Grün über Accent zu warmem Rot, je mehr Karten
// angehoben sind — ein visueller Hinweis ohne aufdringliche Warnung.
// Tickt selbst, damit nicht der ganze Screen 10× pro Sekunde neu rendert.
function ClockTimer({ start, end, raisedCount }: { start: number; end?: number; raisedCount: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (end) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [end])

  const elapsed = ((end || now) - start) / 1000
  // Anteil der verstrichenen Zeit (0→1), geclampt auf 1
  const fill = Math.min(1, elapsed / LIMIT)
  const r = 15
  const circ = 2 * Math.PI * r
  const dashOffset = circ * (1 - fill)
  const m = Math.floor(elapsed / 60)
  const s = Math.floor(elapsed % 60)
  const label = m + ':' + (s < 10 ? '0' : '') + s

  // 0 raised → grün (#2fbf71), ~10 → accent (#4fc3f7), 15+ → warm rot (#d97850)
  const t = Math.min(1, raisedCount / 15)
  const ringColor = raisedCount === 0
    ? '#2fbf71'
    : t < 0.5
      ? `color-mix(in srgb, #2fbf71 ${Math.round((1 - t * 2) * 100)}%, #4fc3f7)`
      : `color-mix(in srgb, #4fc3f7 ${Math.round((1 - (t - 0.5) * 2) * 100)}%, #d97850)`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--sub)',
        }}
      >
        {label}
      </span>
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--panel)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 18 18)"
          style={{ transition: 'stroke-dashoffset .3s linear, stroke .5s ease' }}
        />
      </svg>
    </div>
  )
}
