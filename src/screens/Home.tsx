import { useState } from 'react'
import { type Deck, type Round, fmt, isDemoDeck, starCard } from '../game'
import { CardFace } from '../CardFace'
import { NavBar } from './NavBar'

interface Props {
  decks: Deck[]
  history: Round[]
  loggedIn: boolean
  onMenu: () => void
  onPlay: (deck: Deck) => void
  onImport: () => void
  onStats: () => void
  onDelete: (deckId: string) => void
  onRename: (deckId: string, name: string) => void
  onEdit: (deck: Deck) => void
}

export function Home({ decks, history, loggedIn, onMenu, onPlay, onImport, onStats, onDelete, onRename, onEdit }: Props) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/icon.svg" alt="Prized" width={36} height={36} style={{ borderRadius: 10, flexShrink: 0 }} />
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>Prized</h1>
            <p style={{ margin: 0, color: 'var(--sub)', fontSize: 12 }}>Trainiere dein Preis-Gespür</p>
          </div>
        </div>
        <button
          className="btn btn-ghost"
          onClick={onMenu}
          aria-label="Menü öffnen"
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
        {decks.map((d) => (
          <DeckTile
            key={d.id}
            deck={d}
            history={history}
            locked={!loggedIn && !isDemoDeck(d)}
            isDemo={isDemoDeck(d)}
            onPlay={() => onPlay(d)}
            onDelete={() => onDelete(d.id)}
            onRename={(name) => onRename(d.id, name)}
            onEdit={() => onEdit(d)}
          />
        ))}

        <button
          onClick={onImport}
          style={{
            width: '100%',
            padding: 16,
            marginTop: 4,
            borderRadius: 12,
            border: '1.5px dashed var(--line)',
            background: 'transparent',
            color: 'var(--accentInk)',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          + Deck importieren
        </button>
      </div>

      <NavBar active="decks" onDecks={() => {}} onStats={onStats} />
    </div>
  )
}

function DeckTile({
  deck,
  history,
  locked,
  isDemo,
  onPlay,
  onDelete,
  onRename,
  onEdit,
}: {
  deck: Deck
  history: Round[]
  locked: boolean
  isDemo: boolean
  onPlay: () => void
  onDelete: () => void
  onRename: (name: string) => void
  onEdit: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(deck.name)
  const [showActions, setShowActions] = useState(false)

  const rounds = history.filter((r) => r.d === deck.id)
  const best = rounds.length ? Math.min(...rounds.map((r) => r.t)) : null
  const acc = rounds.length
    ? Math.round((rounds.reduce((a, r) => a + r.h, 0) / rounds.length / 6) * 100)
    : null
  const star = starCard(deck)

  const submitRename = () => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== deck.name) onRename(trimmed)
    setEditing(false)
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        background: 'var(--surface)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        opacity: locked ? 0.55 : 1,
      }}
    >
      <button
        onClick={onPlay}
        disabled={locked}
        style={{
          display: 'contents',
          border: 'none',
          background: 'none',
          textAlign: 'left',
          padding: 0,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 52,
            height: 72,
            borderRadius: 8,
            flexShrink: 0,
            overflow: 'hidden',
            cursor: locked ? 'default' : 'pointer',
          }}
        >
          <CardFace img={star.img} fallbackImg={star.fallbackImg} name={star.n} radius={8} fontSize={9} />
        </div>
      </button>
      <div style={{ flex: 1, minWidth: 0 }} onClick={() => !locked && onPlay()}>
        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); submitRename() }} style={{ display: 'flex', gap: 6 }}>
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={submitRename}
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: 600,
                padding: '4px 8px',
                border: '1px solid var(--line)',
                borderRadius: 6,
                background: 'var(--bg)',
                color: 'var(--ink)',
                outline: 'none',
                minWidth: 0,
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </form>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  cursor: locked ? 'default' : 'pointer',
                }}
              >
                {deck.name}
              </span>
              {locked && (
                <span style={{ fontSize: 12, color: 'var(--sub)' }}>Konto nötig</span>
              )}
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--sub)' }}>
              {best != null ? `${fmt(best)} best` : 'Noch nicht gespielt'}
              {acc != null ? ` · ${acc}% Genau.` : ''}
              {rounds.length > 0 ? ` · ${rounds.length} Runden` : ''}
            </p>
          </>
        )}
      </div>
      {/* Actions: Bearbeiten/Löschen — nicht für Demo-Decks */}
      {!isDemo && !editing && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowActions(!showActions) }}
            style={{
              width: 28,
              height: 28,
              border: 'none',
              borderRadius: 8,
              background: 'transparent',
              color: 'var(--sub)',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Deck-Optionen"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <circle cx="7" cy="3" r="1.2" />
              <circle cx="7" cy="7" r="1.2" />
              <circle cx="7" cy="11" r="1.2" />
            </svg>
          </button>
          {showActions && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 30 }}
                onClick={() => setShowActions(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 32,
                  zIndex: 31,
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  padding: 4,
                  minWidth: 120,
                  boxShadow: '0 4px 12px rgba(0,0,0,.12)',
                }}
              >
                <ActionBtn
                  onClick={() => {
                    setShowActions(false)
                    onEdit()
                  }}
                >
                  Bearbeiten
                </ActionBtn>
                <ActionBtn
                  onClick={() => {
                    setShowActions(false)
                    setEditName(deck.name)
                    setEditing(true)
                  }}
                >
                  Umbenennen
                </ActionBtn>
                <ActionBtn
                  color="var(--bad)"
                  onClick={() => {
                    setShowActions(false)
                    onDelete()
                  }}
                >
                  Löschen
                </ActionBtn>
              </div>
            </>
          )}
        </div>
      )}
      {isDemo && !locked && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: 'var(--sub)' }}>
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

function ActionBtn({ onClick, color, children }: { onClick: () => void; color?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      style={{
        width: '100%',
        padding: '8px 12px',
        border: 'none',
        borderRadius: 6,
        background: 'transparent',
        color: color || 'var(--ink)',
        fontSize: 13,
        fontWeight: 600,
        textAlign: 'left',
      }}
    >
      {children}
    </button>
  )
}
