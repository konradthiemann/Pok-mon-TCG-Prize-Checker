import { useState } from 'react'
import { ONBOARDING } from '../game'

interface Props {
  onDone: () => void
  onSkip: () => void
}

export function Onboarding({ onDone, onSkip }: Props) {
  const [i, setI] = useState(0)
  const step = ONBOARDING[i]
  const last = i === ONBOARDING.length - 1
  const next = () => (last ? onDone() : setI(i + 1))

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 22px 28px',
        background: 'var(--bg)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onSkip} style={{ padding: '8px 12px' }}>
          Überspringen
        </button>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <OnboardingArt index={i} />
        <h1
          key={'t' + i}
          style={{
            fontSize: 26,
            fontWeight: 800,
            margin: '30px 0 12px',
            color: 'var(--ink)',
            animation: 'rise .35s ease both',
          }}
        >
          {step.t}
        </h1>
        <p
          key={'b' + i}
          style={{
            fontSize: 15.5,
            lineHeight: 1.55,
            color: 'var(--sub)',
            maxWidth: 320,
            margin: 0,
            animation: 'rise .45s ease both',
          }}
        >
          {step.b}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 22 }}>
        {ONBOARDING.map((_, k) => (
          <span
            key={k}
            style={{
              height: 8,
              width: k === i ? 24 : 8,
              borderRadius: 999,
              background: k === i ? 'var(--accent)' : 'var(--line)',
              transition: 'width .25s ease, background .25s ease',
            }}
          />
        ))}
      </div>

      <button className="btn btn-primary" onClick={next} style={{ padding: '15px', fontSize: 16 }}>
        {last ? "Los geht's" : 'Weiter'}
      </button>
    </div>
  )
}

function OnboardingArt({ index }: { index: number }) {
  // Kleine dekorative Karten-Illustration passend zum jeweiligen Slide.
  const cards = [0, 1, 2, 3, 4, 5]
  return (
    <div
      key={index}
      style={{
        width: 220,
        height: 200,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {cards.map((c) => {
        const spread = (c - 2.5) * 26
        const isPrize = index >= 1 && c % 2 === 0
        return (
          <div
            key={c}
            style={{
              position: 'absolute',
              width: 62,
              height: 88,
              borderRadius: 12,
              background: isPrize ? 'var(--accent)' : 'var(--accentSoft)',
              border: '2px solid var(--surface)',
              boxShadow: 'var(--shadow)',
              transform: `translateX(${spread}px) rotate(${(c - 2.5) * 5}deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              color: '#fff',
              animation: `popIn .4s ${c * 0.05}s ease both`,
            }}
          >
            {isPrize && index >= 2 ? '?' : ''}
          </div>
        )
      })}
    </div>
  )
}
