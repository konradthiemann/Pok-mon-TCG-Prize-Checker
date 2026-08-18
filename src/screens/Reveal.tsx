import { type Result, fmt } from '../game'
import { CardFace } from '../CardFace'

interface Props {
  result: Result
  onPlayAgain: () => void
  onHome: () => void
  onStats: () => void
}

const META = {
  hit: { color: 'var(--good)', label: 'Treffer' },
  part: { color: 'var(--warn)', label: 'Teilweise' },
  miss: { color: 'var(--bad)', label: 'Falsch' },
  missed: { color: 'var(--warn)', label: 'Verpasst' },
} as const

export function Reveal({ result, onPlayAgain, onHome, onStats }: Props) {
  const acc = Math.round((result.hits / 6) * 100) + '%'
  const hitsColor =
    result.hits >= 5 ? 'var(--good)' : result.hits >= 3 ? 'var(--warn)' : 'var(--bad)'
  const headline =
    result.hits === 6 ? 'Perfekte Lesung' : result.hits >= 4 ? 'Starke Lesung' : 'Weiter trainieren'

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
      }}
    >
      <div className="pc-scroll" style={{ padding: '24px 20px 12px' }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            margin: '0 0 4px',
            color: 'var(--ink)',
          }}
        >
          {headline}
        </h1>
        <p style={{ margin: '0 0 16px', color: 'var(--sub)', fontSize: 12 }}>
          {result.deck.name}
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <Metric value={fmt(result.time)} label="Zeit" />
          <Metric value={`${result.hits}/6`} label="Treffer" color={hitsColor} />
          <Metric value={acc} label="Genauigkeit" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {result.rows.map((r, idx) => {
            const m = META[r.st]
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'var(--surface)',
                  borderRadius: 10,
                  padding: '8px 10px',
                  animation: `rise .25s ${idx * 0.03}s ease both`,
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: 34,
                    height: 48,
                    borderRadius: 6,
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  <CardFace img={r.img} fallbackImg={r.fallbackImg} name={r.name} radius={6} fontSize={6} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
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
                    fontSize: 11,
                    fontWeight: 700,
                    color: m.color,
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
          padding: '12px 16px 16px',
          borderTop: '1px solid var(--line)',
          position: 'sticky',
          bottom: 0,
          background: 'var(--bg)',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <button className="btn btn-primary" onClick={onPlayAgain} style={{ flex: 1, padding: 14 }}>
          Nochmal
        </button>
        <button className="btn btn-ghost" onClick={onHome} style={{ padding: 14, color: 'var(--accentInk)' }}>
          Decks
        </button>
        <button className="btn btn-ghost" onClick={onStats} style={{ padding: 14, color: 'var(--accentInk)' }}>
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
        borderRadius: 10,
        padding: '12px 8px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: color || 'var(--ink)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>{label}</div>
    </div>
  )
}
