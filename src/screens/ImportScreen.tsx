import { useMemo, useState } from 'react'
import { type Deck, parseImport, deckToText } from '../game'

interface Props {
  onBack: () => void
  onSave: (name: string, text: string) => void
  editDeck?: Deck
}

const PLACEHOLDER =
  'Pokémon: 21\n4 Dreepy TWM 128\n4 Drakloak TWM 129\n3 Dragapult ex TWM 130\n…\nTrainer: 32\n4 Lillie\'s Determination MEG 119\n…\nEnergy: 7\n3 Psychic Energy MEE 5\n…'

export function ImportScreen({ onBack, onSave, editDeck }: Props) {
  const [name, setName] = useState(editDeck?.name ?? '')
  const [text, setText] = useState(() => editDeck ? deckToText(editDeck) : '')
  const parsed = useMemo(() => parseImport(text), [text])

  const mark = parsed.total === 60 ? '✓' : parsed.total > 60 ? '– zu viele' : ''
  const totalColor =
    parsed.total === 60 ? 'var(--good)' : parsed.total > 0 ? 'var(--warn)' : 'var(--sub)'
  const canSave = parsed.total === 60 && parsed.errors.length === 0 && name.trim().length > 0

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '18px 16px 10px' }}>
        <button
          className="btn btn-ghost"
          onClick={onBack}
          style={{ padding: '4px 10px', color: 'var(--ink)' }}
          aria-label="Zurück"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
          {editDeck ? 'Deck bearbeiten' : 'Deck importieren'}
        </h1>
      </header>

      <div className="pc-scroll" style={{ padding: '6px 16px 20px' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Deckname"
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            fontSize: 14,
            marginBottom: 10,
            fontFamily: 'inherit',
          }}
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={14}
          spellCheck={false}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            fontSize: 13,
            lineHeight: 1.5,
            resize: 'vertical',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          }}
        />

        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
            margin: '12px 0 6px',
            fontSize: 12,
            color: 'var(--sub)',
          }}
        >
          <Pill label="Pokémon" value={parsed.pk} />
          <Pill label="Trainer" value={parsed.tr} />
          <Pill label="Energie" value={parsed.en} />
          <span style={{ fontWeight: 700, color: totalColor, marginLeft: 'auto' }}>
            {parsed.total} / 60 {mark}
          </span>
        </div>

        {parsed.errors.slice(0, 4).map((er) => (
          <p key={er.line} style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--bad)' }}>
            Zeile {er.line}: {er.msg}
          </p>
        ))}
      </div>

      <div style={{ padding: '10px 16px 16px', borderTop: '1px solid var(--line)' }}>
        <button
          className="btn btn-primary"
          onClick={() => canSave && onSave(name, text)}
          disabled={!canSave}
          style={{ width: '100%', padding: 14, fontSize: 14, opacity: canSave ? 1 : 0.4 }}
        >
          {editDeck ? 'Änderungen speichern' : 'Deck speichern'}
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
        borderRadius: 8,
        padding: '3px 8px',
      }}
    >
      {label} <b style={{ color: 'var(--ink)' }}>{value}</b>
    </span>
  )
}
