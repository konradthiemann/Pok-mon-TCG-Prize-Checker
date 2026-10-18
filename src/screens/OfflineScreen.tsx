import { useEffect, useRef, useState } from 'react'
import { type Deck, type Round, fmt, offlineRound } from '../game'
import { useT } from '../i18n'

interface Props {
  deck: Deck
  onQuit: () => void
  onSave: (round: Round) => void
}

type Phase = { k: 'ready' } | { k: 'running'; start: number } | { k: 'entry'; start: number; end: number }

// Offline-Modus: Der Spieler hat das Deck als echte Karten vor sich. Die App
// misst nur die Zeit; die Treffer trägt er nach dem Stoppen selbst ein.
export function OfflineScreen({ deck, onQuit, onSave }: Props) {
  const t = useT()
  const [phase, setPhase] = useState<Phase>({ k: 'ready' })
  const [hits, setHits] = useState<number | null>(null)
  const running = phase.k === 'running'
  const questionRef = useRef<HTMLFieldSetElement>(null)

  // Nach dem Stopp verschwindet der fokussierte Stopp-Button — Fokus auf die Frage setzen.
  useEffect(() => {
    if (phase.k === 'entry') questionRef.current?.focus()
  }, [phase.k])

  // Display beim Durchblättern wach halten. Die Zeit basiert auf Zeitstempeln
  // und stimmt auch ohne Wake Lock — das spart nur das Entsperren.
  // Der Browser gibt den Lock beim Tab-Wechsel frei, daher bei Rückkehr neu anfordern.
  useEffect(() => {
    if (!running || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let alive = true
    const acquire = () => {
      navigator.wakeLock
        .request('screen')
        .then((l) => {
          if (alive) lock = l
          else l.release().catch(() => {})
        })
        .catch(() => {})
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') acquire()
    }
    acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => {})
    }
  }, [running])

  const start = () => setPhase({ k: 'running', start: Date.now() })
  const stop = () => {
    if (phase.k === 'running') setPhase({ k: 'entry', start: phase.start, end: Date.now() })
  }
  const save = () => {
    if (phase.k === 'entry' && hits !== null) onSave(offlineRound(deck.id, phase.start, phase.end, hits))
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 12px', flexShrink: 0, minHeight: 40 }}>
        {/* Zurück nur vor dem Start — danach beenden Stopp bzw. Verwerfen die Runde bewusst. */}
        {phase.k === 'ready' && (
          <button
            onClick={onQuit}
            aria-label={t.back}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              flex: 'none',
              border: 'none',
              background: 'var(--surface)',
              color: 'var(--sub)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>{t.offlineTitle}</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {deck.name}
          </p>
        </div>
      </header>

      <div
        className="pc-scroll"
        style={{ padding: '4px 20px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}
      >
        {phase.k === 'ready' && (
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: 'var(--ink)', textAlign: 'center' }}>{t.offlineIntro}</p>
        )}

        {phase.k === 'running' && (
          <>
            <Stopwatch start={phase.start} />
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--sub)', textAlign: 'center' }}>{t.offlineStopHint}</p>
          </>
        )}

        {phase.k === 'entry' && (
          <>
            <TimeDisplay sec={(phase.end - phase.start) / 1000} />
            <fieldset ref={questionRef} tabIndex={-1} style={{ border: 'none', margin: 0, padding: 0, minWidth: 0, outline: 'none' }}>
              <legend style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', textAlign: 'center', marginBottom: 12, padding: 0, width: '100%' }}>
                {t.offlineHitsQuestion}
              </legend>
              <div className="pc-hits" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {[0, 1, 2, 3, 4, 5, 6].map((n) => {
                  const on = hits === n
                  return (
                    <label key={n} style={{ position: 'relative', display: 'block' }}>
                      <input
                        type="radio"
                        name="offline-hits"
                        value={n}
                        checked={on}
                        onChange={() => setHits(n)}
                        aria-label={t.hitsOption(n)}
                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', margin: 0, cursor: 'pointer' }}
                      />
                      <span
                        aria-hidden
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: 48,
                          borderRadius: 12,
                          fontSize: 20,
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                          background: on ? 'var(--accent)' : 'var(--surface)',
                          color: on ? '#06323f' : 'var(--ink)',
                          boxShadow: on ? 'none' : 'var(--shadow)',
                        }}
                      >
                        {n}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '12px 16px 16px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
        {phase.k === 'ready' && (
          <button className="btn btn-primary" onClick={start} style={{ flex: 1, padding: 16, fontSize: 16 }}>
            {t.startTimer}
          </button>
        )}
        {phase.k === 'running' && (
          <button className="btn btn-primary" onClick={stop} style={{ flex: 1, padding: 16, fontSize: 16 }}>
            {t.stopTimer}
          </button>
        )}
        {phase.k === 'entry' && (
          <>
            <button
              className="btn btn-primary"
              onClick={save}
              disabled={hits === null}
              style={{ flex: 1, padding: 14, opacity: hits === null ? 0.5 : 1 }}
            >
              {t.saveRound}
            </button>
            <button className="btn btn-ghost" onClick={onQuit} style={{ padding: 14, color: 'var(--accentInk)' }}>
              {t.discard}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// Tickt selbst, damit nur die Anzeige 10× pro Sekunde neu rendert.
function Stopwatch({ start }: { start: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [])
  return <TimeDisplay sec={(now - start) / 1000} />
}

function TimeDisplay({ sec }: { sec: number }) {
  return (
    <div
      role="timer"
      style={{
        fontSize: 56,
        fontWeight: 800,
        textAlign: 'center',
        color: 'var(--ink)',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: -1,
      }}
    >
      {fmt(sec)}
    </div>
  )
}
