import { type Result, fmt } from '../game'
import { CardFace } from '../CardFace'

interface Props {
  result: Result
  onPlayAgain: () => void
  onHome: () => void
  onStats: () => void
}

const META = {
  hit: { color: 'var(--good)', label: 'TREFFER' },
  part: { color: 'var(--warn)', label: 'TEILWEISE' },
  miss: { color: 'var(--bad)', label: 'FALSCH' },
  missed: { color: 'var(--warn)', label: 'VERPASST' },
} as const

export function Reveal({ result, onPlayAgain, onHome, onStats }: Props) {
  const acc = Math.round((result.hits / 6) * 100) + '%'
  const hitsColor =
    result.hits >= 5 ? 'var(--good)' : result.hits >= 3 ? 'var(--warn)' : 'var(--bad)'
  const headline =
    result.hits === 6 ? 'Perfekte Lesung! 🎯' : result.hits >= 4 ? 'Starke Lesung' : 'Weiter trainieren'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div className="pc-scroll" style={{ padding: '24px 18px 12px' }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            margin: '0 0 4px',
            color: 'var(--ink)',
            animation: 'rise .35s ease both',
          }}
        >
          {headline}
        </h1>
        <p style={{ margin: '0 0 18px', color: 'var(--sub)', fontSize: 13.5 }}>
          {result.deck.name} · Auswahl vs. tatsächliche Preise
        </p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <Metric value={fmt(result.time)} label="Zeit" />
          <Metric value={`${result.hits}/6`} label="Treffer" color={hitsColor} />
          <Metric value={acc} label="Genauigkeit" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {result.rows.map((r, idx) => {
            const m = META[r.st]
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'var(--surface)',
                  borderRadius: 14,
                  padding: 10,
                  boxShadow: 'var(--shadow)',
                  animation: `rise .3s ${idx * 0.03}s ease both`,
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: 38,
                    height: 53,
                    borderRadius: 8,
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  <CardFace img={r.img} name={r.name} radius={8} fontSize={7} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14.5,
                      fontWeight: 700,
                      color: 'var(--ink)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--sub)' }}>
                    Gewählt {r.picked} · in Preisen {r.actual}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    letterSpacing: 0.4,
                    color: '#fff',
                    background: m.color,
                    padding: '4px 9px',
                    borderRadius: 999,
                  }}
                >
                  {m.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '10px 16px 18px',
          borderTop: '1px solid var(--line)',
        }}
      >
        <button
          className="btn btn-primary"
          onClick={onPlayAgain}
          style={{ flex: 1, padding: 14 }}
        >
          Nochmal
        </button>
        <button
          className="btn btn-ghost"
          onClick={onHome}
          style={{ padding: 14, color: 'var(--accentInk)' }}
        >
          Decks
        </button>
        <button
          className="btn btn-ghost"
          onClick={onStats}
          style={{ padding: 14, color: 'var(--accentInk)' }}
        >
          Statistik
        </button>
      </div>
    </div>
  )
}

function Metric({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'var(--surface)',
        borderRadius: 16,
        padding: '14px 8px',
        textAlign: 'center',
        boxShadow: 'var(--shadow)',
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: color || 'var(--ink)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--sub)', marginTop: 2 }}>{label}</div>
    </div>
  )
}
