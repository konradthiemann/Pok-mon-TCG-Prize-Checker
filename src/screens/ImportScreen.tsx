import { useMemo, useState } from 'react'
import { parseImport } from '../game'

interface Props {
  onBack: () => void
  onSave: (name: string, text: string) => void
}

const PLACEHOLDER =
  'Pokémon: 21\n4 Dreepy TWM 128\n4 Drakloak TWM 129\n3 Dragapult ex TWM 130\n…\nTrainer: 32\n4 Lillie’s Determination MEG 119\n…\nEnergy: 7\n3 Psychic Energy MEE 5\n…'

export function ImportScreen({ onBack, onSave }: Props) {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const parsed = useMemo(() => parseImport(text), [text])

  const mark = parsed.total === 60 ? '✓' : parsed.total > 60 ? '– zu viele' : ''
  const totalColor =
    parsed.total === 60 ? 'var(--good)' : parsed.total > 0 ? 'var(--warn)' : 'var(--sub)'
  const canSave = parsed.total === 60 && parsed.errors.length === 0 && name.trim().length > 0

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '18px 16px 10px',
        }}
      >
        <button
          className="btn btn-ghost"
          onClick={onBack}
          style={{ fontSize: 22, padding: '4px 10px', color: 'var(--ink)' }}
          aria-label="Zurück"
        >
          ‹
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
          Deck importieren
        </h1>
      </header>

      <div className="pc-scroll" style={{ padding: '6px 16px 20px' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Deckname"
          style={{
            width: '100%',
            padding: '13px 14px',
            borderRadius: 14,
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            fontSize: 15,
            marginBottom: 12,
            fontFamily: 'inherit',
          }}
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={12}
          spellCheck={false}
          style={{
            width: '100%',
            padding: '13px 14px',
            borderRadius: 14,
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            fontSize: 13.5,
            lineHeight: 1.5,
            resize: 'vertical',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          }}
        />

        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
            margin: '14px 0 6px',
            fontSize: 13,
            color: 'var(--sub)',
          }}
        >
          <Pill label="Pokémon" value={parsed.pk} />
          <Pill label="Trainer" value={parsed.tr} />
          <Pill label="Energie" value={parsed.en} />
          <span style={{ fontWeight: 700, color: totalColor, marginLeft: 'auto' }}>
            → {parsed.total} / 60 {mark}
          </span>
        </div>

        {parsed.errors.slice(0, 4).map((er) => (
          <p
            key={er.line}
            style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--bad)' }}
          >
            ⚠ Zeile {er.line}: {er.msg}
          </p>
        ))}
      </div>

      <div style={{ padding: '10px 16px 18px', borderTop: '1px solid var(--line)' }}>
        <button
          className="btn btn-primary"
          onClick={() => canSave && onSave(name, text)}
          disabled={!canSave}
          style={{ width: '100%', padding: 15, fontSize: 16, opacity: canSave ? 1 : 0.45 }}
        >
          Deck speichern
        </button>
      </div>
    </div>
  )
}

function Pill({ label, value }: { label: string; value: number }) {
  return (
    <span
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 999,
        padding: '4px 10px',
      }}
    >
      {label} <b style={{ color: 'var(--ink)' }}>{value}</b>
    </span>
  )
}
