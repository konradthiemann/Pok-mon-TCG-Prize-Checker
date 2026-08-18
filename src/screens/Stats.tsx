import { useState } from 'react'
import { type Deck, type Round, ago, fmt } from '../game'
import { NavBar } from './NavBar'
import { useT } from '../i18n'

interface Props {
  decks: Deck[]
  history: Round[]
  onMenu: () => void
  onHome: () => void
}

export function Stats({ decks, history, onMenu, onHome }: Props) {
  const t = useT()
  const [filter, setFilter] = useState<string>('all')
  const rounds = history.filter((x) => filter === 'all' || x.d === filter)
  const dName: Record<string, string> = {}
  decks.forEach((d) => (dName[d.id] = d.name))

  const has = rounds.length > 0
  const avgT = has ? rounds.reduce((a, x) => a + x.t, 0) / rounds.length : 0
  const avgA = has ? Math.round((rounds.reduce((a, x) => a + x.h, 0) / rounds.length / 6) * 100) : 0
  const best = has ? Math.min(...rounds.map((x) => x.t)) : 0

  const chips = [{ id: 'all', label: t.allDecks }, ...decks.map((d) => ({ id: d.id, label: d.name }))]

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
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>{t.stats}</h1>
        <button
          className="btn btn-ghost"
          onClick={onMenu}
          aria-label={t.openMenu}
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
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12 }}>
          {chips.map((c) => {
            const on = filter === c.id
            return (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                style={{
                  flexShrink: 0,
                  border: 'none',
                  background: on ? 'var(--accentInk)' : 'var(--surface)',
                  color: on ? '#fff' : 'var(--sub)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {c.label}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Big value={has ? fmt(avgT) : '—'} label={t.avgTime} />
          <Big value={has ? avgA + '%' : '—'} label={t.avgAccuracy} />
          <Big value={has ? fmt(best) : '—'} label={t.bestTime} />
        </div>

        {has && <Chart rounds={rounds.slice(-12)} />}

        <p
          style={{
            margin: '16px 0 8px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: 'var(--sub)',
          }}
        >
          {t.recentRounds}
        </p>
        {rounds
          .slice(-8)
          .reverse()
          .map((r, idx) => {
            const color = r.h >= 5 ? 'var(--good)' : r.h >= 3 ? 'var(--warn)' : 'var(--bad)'
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'var(--surface)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  marginBottom: 6,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                    {dName[r.d] || t.deck}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--sub)' }}>{ago(r.ts, t)}</div>
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--ink)',
                  }}
                >
                  {fmt(r.t)}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {r.h}/6
                </span>
              </div>
            )
          })}
        {!has && (
          <p style={{ color: 'var(--sub)', fontSize: 14, textAlign: 'center', marginTop: 20 }}>
            {t.noRoundsYet}
          </p>
        )}
      </div>

      <NavBar active="stats" onDecks={onHome} onStats={() => {}} />
    </div>
  )
}

function Big({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function Chart({ rounds }: { rounds: Round[] }) {
  const t = useT()
  const maxT = Math.max(...rounds.map((x) => x.t)) * 1.15 || 1
  const px = (i: number) => (rounds.length > 1 ? 6 + i * (308 / (rounds.length - 1)) : 160)
  const timePts = rounds
    .map((x, i) => px(i).toFixed(1) + ',' + (104 - (x.t / maxT) * 92).toFixed(1))
    .join(' ')
  const accPts = rounds
    .map((x, i) => px(i).toFixed(1) + ',' + (104 - (x.h / 6) * 92).toFixed(1))
    .join(' ')

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 12 }}>
        <Legend color="var(--accentInk)" label={t.time} />
        <Legend color="var(--good)" label={t.accuracy} />
      </div>
      <svg viewBox="0 0 320 110" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <polyline points={timePts} fill="none" stroke="var(--accentInk)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={accPts} fill="none" stroke="var(--good)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--sub)' }}>
      <span style={{ width: 10, height: 2, borderRadius: 1, background: color }} />
      {label}
    </span>
  )
}
