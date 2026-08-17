import { useState } from 'react'
import { type Deck, type Round, ago, fmt } from '../game'
import { NavBar } from './NavBar'

interface Props {
  decks: Deck[]
  history: Round[]
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onHome: () => void
}

export function Stats({ decks, history, theme, onToggleTheme, onHome }: Props) {
  const [filter, setFilter] = useState<string>('all')
  const rounds = history.filter((x) => filter === 'all' || x.d === filter)
  const dName: Record<string, string> = {}
  decks.forEach((d) => (dName[d.id] = d.name))

  const has = rounds.length > 0
  const avgT = has ? rounds.reduce((a, x) => a + x.t, 0) / rounds.length : 0
  const avgA = has ? Math.round((rounds.reduce((a, x) => a + x.h, 0) / rounds.length / 6) * 100) : 0
  const best = has ? Math.min(...rounds.map((x) => x.t)) : 0
  let streak = 0
  for (let i = rounds.length - 1; i >= 0 && rounds[i].h === 6; i--) streak++

  const chips = [{ id: 'all', label: 'Alle Decks' }, ...decks.map((d) => ({ id: d.id, label: d.name }))]

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 20px 10px',
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Statistik</h1>
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
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
          {chips.map((c) => {
            const on = filter === c.id
            return (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                style={{
                  flexShrink: 0,
                  border: `1px solid ${on ? 'var(--accentInk)' : 'var(--line)'}`,
                  background: on ? 'var(--accentInk)' : 'var(--surface)',
                  color: on ? '#fff' : 'var(--sub)',
                  borderRadius: 999,
                  padding: '7px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {c.label}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <Big value={has ? fmt(avgT) : '—'} label="Ø Zeit" />
          <Big value={has ? avgA + '%' : '—'} label="Ø Genauigkeit" />
          <Big value={has ? fmt(best) : '—'} label="Beste Zeit" />
          <Big
            value={`${rounds.length}${streak > 0 ? '  🔥' + streak : ''}`}
            label="Runden · perfekte Serie"
          />
        </div>

        {has && <Chart rounds={rounds.slice(-12)} />}

        <p
          style={{
            margin: '18px 0 8px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: 'var(--sub)',
          }}
        >
          Letzte Runden
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
                  borderRadius: 12,
                  padding: '10px 12px',
                  marginBottom: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                    {dName[r.d] || 'Deck'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--sub)' }}>{ago(r.ts)}</div>
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--ink)',
                  }}
                >
                  {fmt(r.t)}
                </span>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: '#fff',
                    background: color,
                    padding: '3px 9px',
                    borderRadius: 999,
                  }}
                >
                  {r.h}/6
                </span>
              </div>
            )
          })}
        {!has && (
          <p style={{ color: 'var(--sub)', fontSize: 14, textAlign: 'center', marginTop: 20 }}>
            Noch keine Runden gespielt.
          </p>
        )}
      </div>

      <NavBar active="stats" onDecks={onHome} onStats={() => {}} />
    </div>
  )
}

function Big({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 14, boxShadow: 'var(--shadow)' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function Chart({ rounds }: { rounds: Round[] }) {
  const maxT = Math.max(...rounds.map((x) => x.t)) * 1.15 || 1
  const px = (i: number) => (rounds.length > 1 ? 6 + i * (308 / (rounds.length - 1)) : 160)
  const timePts = rounds
    .map((x, i) => px(i).toFixed(1) + ',' + (104 - (x.t / maxT) * 92).toFixed(1))
    .join(' ')
  const accPts = rounds
    .map((x, i) => px(i).toFixed(1) + ',' + (104 - (x.h / 6) * 92).toFixed(1))
    .join(' ')

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 14, boxShadow: 'var(--shadow)' }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 8, fontSize: 12 }}>
        <Legend color="var(--accentInk)" label="Zeit" />
        <Legend color="var(--good)" label="Genauigkeit" />
      </div>
      <svg viewBox="0 0 320 110" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <polyline points={timePts} fill="none" stroke="var(--accentInk)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={accPts} fill="none" stroke="var(--good)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--sub)' }}>
      <span style={{ width: 12, height: 3, borderRadius: 2, background: color }} />
      {label}
    </span>
  )
}
