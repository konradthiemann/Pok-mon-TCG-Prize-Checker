import { useState, type CSSProperties } from 'react'
import { type CardInput, type CardType } from '../game'
import { CardFace } from '../CardFace'

interface Props {
  onBack: () => void
  onSave: (name: string, cards: CardInput[]) => void
}

interface BuilderCard extends CardInput {
  img: string
  key: string
  basic: boolean
}

interface ApiCard {
  id: string
  name: string
  supertype: string
  number: string
  subtypes?: string[]
  set: { id: string; ptcgoCode?: string }
  images?: { small?: string }
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--ink)',
  fontSize: 15,
  fontFamily: 'inherit',
}

function typeOf(supertype: string): CardType {
  if (/^Pok/i.test(supertype)) return 'P'
  if (/^Energy/i.test(supertype)) return 'E'
  return 'T'
}

function mapCard(c: ApiCard): BuilderCard {
  const basic = c.subtypes?.includes('Basic') ?? false
  const t = typeOf(c.supertype)
  const api = `${c.set.id}/${c.number}`
  return {
    n: c.name,
    s: (c.set.ptcgoCode || c.set.id).toUpperCase(),
    c: c.number,
    api,
    t,
    q: 0,
    b: t === 'P' && basic ? 1 : undefined,
    img: c.images?.small || `https://images.pokemontcg.io/${api}.png`,
    key: `${c.name}|${(c.set.ptcgoCode || c.set.id).toUpperCase()}${c.number}`,
    basic,
  }
}

export function DeckBuilder({ onBack, onSave }: Props) {
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BuilderCard[]>([])
  const [selected, setSelected] = useState<Record<string, BuilderCard>>({})
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [tab, setTab] = useState<'search' | 'deck'>('search')

  async function search(e: React.FormEvent) {
    e.preventDefault()
    const term = query.trim()
    if (!term) return
    setLoading(true)
    setSearchError(null)
    try {
      const q = encodeURIComponent(`name:"${term}*"`)
      const res = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=30&orderBy=-set.releaseDate`,
      )
      if (!res.ok) throw new Error(`Suche fehlgeschlagen (${res.status})`)
      const json = (await res.json()) as { data: ApiCard[] }
      setResults(json.data.map(mapCard))
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Suche fehlgeschlagen')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const list = Object.values(selected)
  const total = list.reduce((a, c) => a + c.q, 0)
  const count = (t: CardType) => list.filter((c) => c.t === t).reduce((a, c) => a + c.q, 0)
  const maxFor = (c: BuilderCard) => (c.t === 'E' && c.basic ? 60 : 4)

  function change(card: BuilderCard, delta: number) {
    setSelected((prev) => {
      const cur = prev[card.key]
      const q = Math.max(0, Math.min((cur?.q ?? 0) + delta, maxFor(card)))
      if (delta > 0 && total >= 60 && !cur) return prev
      if (delta > 0 && total >= 60 && q > (cur?.q ?? 0)) return prev
      const next = { ...prev }
      if (q === 0) delete next[card.key]
      else next[card.key] = { ...card, q }
      return next
    })
  }

  const canSave = total === 60 && name.trim().length > 0

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '18px 16px 8px' }}>
        <button
          className="btn btn-ghost"
          onClick={onBack}
          style={{ fontSize: 22, padding: '4px 10px', color: 'var(--ink)' }}
          aria-label="Zurück"
        >
          ‹
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Deck erstellen</h1>
      </header>

      <div style={{ padding: '4px 16px 10px' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Deckname"
          style={{ ...inputStyle, marginBottom: 10 }}
        />
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            fontSize: 12.5,
            color: 'var(--sub)',
          }}
        >
          <Pill label="P" value={count('P')} />
          <Pill label="T" value={count('T')} />
          <Pill label="E" value={count('E')} />
          <span
            style={{
              marginLeft: 'auto',
              fontWeight: 800,
              color: total === 60 ? 'var(--good)' : total > 60 ? 'var(--bad)' : 'var(--sub)',
            }}
          >
            {total} / 60
          </span>
        </div>
      </div>

      {tab === 'search' ? (
        <>
          <form onSubmit={search} style={{ display: 'flex', gap: 8, padding: '0 16px 10px' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Karte suchen (z. B. Dragapult)"
              style={inputStyle}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: '0 18px', flexShrink: 0 }}
            >
              {loading ? '…' : '🔍'}
            </button>
          </form>
          <div className="pc-scroll" style={{ padding: '2px 16px 16px' }}>
            {searchError && <p style={{ color: 'var(--bad)', fontSize: 13 }}>{searchError}</p>}
            {!searchError && results.length === 0 && (
              <p style={{ color: 'var(--sub)', fontSize: 13.5, textAlign: 'center', marginTop: 24 }}>
                Suche nach Karten, um dein Deck zu füllen.
              </p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {results.map((c) => {
                const q = selected[c.key]?.q ?? 0
                return (
                  <div key={c.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '63 / 88', borderRadius: 10, overflow: 'hidden' }}>
                      <CardFace img={c.img} name={c.n} radius={10} fontSize={9} />
                      {q > 0 && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            background: 'var(--accentInk)',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 800,
                            borderRadius: 999,
                            minWidth: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 4px',
                          }}
                        >
                          {q}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Stepper onMinus={() => change(c, -1)} onPlus={() => change(c, +1)} disabled={q === 0} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="pc-scroll" style={{ padding: '2px 16px 16px' }}>
          {list.length === 0 && (
            <p style={{ color: 'var(--sub)', fontSize: 13.5, textAlign: 'center', marginTop: 24 }}>
              Noch keine Karten im Deck.
            </p>
          )}
          {list.map((c) => (
            <div
              key={c.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'var(--surface)',
                borderRadius: 12,
                padding: 8,
                marginBottom: 8,
              }}
            >
              <div style={{ position: 'relative', width: 40, height: 56, flexShrink: 0, borderRadius: 8, overflow: 'hidden' }}>
                <CardFace img={c.img} name={c.n} radius={8} fontSize={7} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.n}
                </div>
                <div style={{ fontSize: 12, color: 'var(--sub)' }}>{c.s} {c.c}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', minWidth: 18, textAlign: 'center' }}>{c.q}</span>
                <Stepper onMinus={() => change(c, -1)} onPlus={() => change(c, +1)} disabled={false} />
              </div>
            </div>
          ))}
        </div>
      )}

      <nav
        style={{
          display: 'flex',
          borderTop: '1px solid var(--line)',
          background: 'var(--surface)',
          position: 'sticky',
          bottom: 0,
          zIndex: 20,
          flexShrink: 0,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <TabBtn active={tab === 'search'} label="Suche" onClick={() => setTab('search')} />
        <TabBtn active={tab === 'deck'} label={`Deck (${total})`} onClick={() => setTab('deck')} />
        <button
          onClick={() => canSave && onSave(name.trim(), list.map(({ n, s, c, api, t, q, b }) => ({ n, s, c, api, t, q, b })))}
          disabled={!canSave}
          className="btn btn-primary"
          style={{ flex: 1.4, margin: 8, borderRadius: 14, padding: '12px 0', opacity: canSave ? 1 : 0.4 }}
        >
          Speichern
        </button>
      </nav>
    </div>
  )
}

function Pill({ label, value }: { label: string; value: number }) {
  return (
    <span style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 999, padding: '4px 10px' }}>
      {label} <b style={{ color: 'var(--ink)' }}>{value}</b>
    </span>
  )
}

function Stepper({ onMinus, onPlus, disabled }: { onMinus: () => void; onPlus: () => void; disabled: boolean }) {
  const btn: CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: '1px solid var(--line)',
    background: 'var(--surface)',
    color: 'var(--ink)',
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
  return (
    <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
      <button onClick={onMinus} disabled={disabled} style={{ ...btn, opacity: disabled ? 0.4 : 1 }} aria-label="Weniger">
        −
      </button>
      <button onClick={onPlus} style={btn} aria-label="Mehr">
        ＋
      </button>
    </div>
  )
}

function TabBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        border: 'none',
        background: 'transparent',
        padding: '14px 0',
        fontSize: 13,
        fontWeight: active ? 800 : 500,
        color: active ? 'var(--accentInk)' : 'var(--sub)',
      }}
    >
      {label}
    </button>
  )
}
