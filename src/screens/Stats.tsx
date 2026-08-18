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
  const left = 38
  const right = 30
  const chartW = 320
  const plotW = chartW - left - right
  const px = (i: number) => (rounds.length > 1 ? left + i * (plotW / (rounds.length - 1)) : left + plotW / 2)
  const yT = (v: number) => 104 - (v / maxT) * 84
  const yA = (v: number) => 104 - (v / 6) * 84
  const timePts = rounds.map((x, i) => px(i).toFixed(1) + ',' + yT(x.t).toFixed(1)).join(' ')
  const accPts = rounds.map((x, i) => px(i).toFixed(1) + ',' + yA(x.h).toFixed(1)).join(' ')

  // Y-axis ticks for time (3 ticks: 0, mid, max)
  const maxTLabel = Math.ceil(maxT / 1.15)
  const midTLabel = Math.round(maxTLabel / 2)
  const timeTicks = [0, midTLabel, maxTLabel]
  // Y-axis ticks for accuracy (0, 3, 6)
  const accTicks = [0, 3, 6]

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60)
    return m > 0 ? `${m}:${(s - m * 60).toString().padStart(2, '0')}` : `${s}s`
  }

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 12 }}>
        <Legend color="var(--accentInk)" label={t.time} />
        <Legend color="var(--good)" label={t.accuracy} />
      </div>
      <svg viewBox={`0 0 ${chartW} 120`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={left}
            x2={chartW - right}
            y1={104 - f * 84}
            y2={104 - f * 84}
            stroke="var(--line)"
            strokeWidth="0.7"
          />
        ))}
        {/* Y-axis labels left: time */}
        {timeTicks.map((v) => (
          <text
            key={'t' + v}
            x={left - 4}
            y={yT(v) + 1}
            textAnchor="end"
            style={{ fontSize: 8.5, fill: 'var(--accentInk)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            {fmtTime(v)}
          </text>
        ))}
        {/* Y-axis labels right: accuracy (hits/6) */}
        {accTicks.map((v) => (
          <text
            key={'a' + v}
            x={chartW - right + 4}
            y={yA(v) + 1}
            textAnchor="start"
            style={{ fontSize: 8.5, fill: 'var(--good)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            {v}/6
          </text>
        ))}
        {/* Data lines */}
        <polyline points={timePts} fill="none" stroke="var(--accentInk)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={accPts} fill="none" stroke="var(--good)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* Data point dots + value labels for time */}
        {rounds.map((x, i) => (
          <g key={'dt' + i}>
            <circle cx={px(i)} cy={yT(x.t)} r="3" fill="var(--accentInk)" />
            <text
              x={px(i)}
              y={yT(x.t) - 6}
              textAnchor="middle"
              style={{ fontSize: 7.5, fill: 'var(--accentInk)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
            >
              {fmtTime(Math.round(x.t))}
            </text>
          </g>
        ))}
        {/* Data point dots + value labels for accuracy */}
        {rounds.map((x, i) => (
          <g key={'da' + i}>
            <circle cx={px(i)} cy={yA(x.h)} r="3" fill="var(--good)" />
            <text
              x={px(i)}
              y={yA(x.h) + 12}
              textAnchor="middle"
              style={{ fontSize: 7.5, fill: 'var(--good)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
            >
              {x.h}/6
            </text>
          </g>
        ))}
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
