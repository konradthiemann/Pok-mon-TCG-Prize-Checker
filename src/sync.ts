import { supabase } from './auth/supabase'
import { type CardInput, type Deck, type Round, cardsOf } from './game'

// Cloud-Persistenz (Supabase). Wird nur genutzt, wenn ein User eingeloggt ist;
// im Gast-Modus übernimmt storage.ts (localStorage).

interface DeckRow {
  id: string
  name: string
  format: string
  cards: CardInput[]
  archetype?: string
}

interface RoundRow extends Omit<Round, 'm'> {
  m: Round['m'] | null
}

// Ladefehler liefern null statt [] — eine leere Cloud löst in App.tsx die
// Erstmigration lokaler Daten aus, ein Fehler darf das nicht.
export async function cloudLoadDecks(): Promise<Deck[] | null> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('decks')
    .select('id,name,format,cards,archetype')
    .order('created_at')
  if (error || !data) return null
  return (data as DeckRow[]).map((d) => ({
    id: d.id,
    name: d.name,
    format: d.format,
    archetype: d.archetype,
    cards: cardsOf(d.cards),
  }))
}

export async function cloudUpsertDeck(userId: string, deck: Deck): Promise<void> {
  if (!supabase) return
  const cards: CardInput[] = deck.cards.map(({ n, s, c, api, t, q, b }) => ({ n, s, c, api, t, q, b }))
  await supabase
    .from('decks')
    .upsert(
      { user_id: userId, id: deck.id, name: deck.name, format: deck.format, cards, archetype: deck.archetype || null },
      { onConflict: 'user_id,id' },
    )
}

export async function cloudDeleteDeck(userId: string, deckId: string): Promise<void> {
  if (!supabase) return
  await supabase.from('decks').delete().match({ user_id: userId, id: deckId })
}

export async function cloudLoadHistory(): Promise<Round[] | null> {
  if (!supabase) return []
  const { data, error } = await supabase.from('rounds').select('d,t,h,ts,m').order('ts')
  if (error || !data) return null
  // Digitale Runden haben m = null in der DB; im Client fehlt das Feld dann.
  return (data as RoundRow[]).map(({ m, ...r }) => (m ? { ...r, m } : r))
}

export async function cloudInsertRound(userId: string, r: Round): Promise<void> {
  if (!supabase) return
  // m nur bei Offline-Runden mitsenden: digitale Inserts bleiben so unabhängig von Migration 004.
  const { error } = await supabase
    .from('rounds')
    .insert({ user_id: userId, d: r.d, t: r.t, h: r.h, ts: r.ts, ...(r.m ? { m: r.m } : {}) })
  if (error) console.error('cloudInsertRound failed', error.message)
}
