import { supabase } from './auth/supabase'
import { type CardInput, type Deck, type Round, cardsOf } from './game'

// Cloud-Persistenz (Supabase). Wird nur genutzt, wenn ein User eingeloggt ist;
// im Gast-Modus übernimmt storage.ts (localStorage).

interface DeckRow {
  id: string
  name: string
  format: string
  cards: CardInput[]
}

export async function cloudLoadDecks(): Promise<Deck[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('decks')
    .select('id,name,format,cards')
    .order('created_at')
  if (error || !data) return []
  return (data as DeckRow[]).map((d) => ({
    id: d.id,
    name: d.name,
    format: d.format,
    cards: cardsOf(d.cards),
  }))
}

export async function cloudUpsertDeck(userId: string, deck: Deck): Promise<void> {
  if (!supabase) return
  const cards: CardInput[] = deck.cards.map(({ n, s, c, api, t, q, b }) => ({ n, s, c, api, t, q, b }))
  await supabase
    .from('decks')
    .upsert(
      { user_id: userId, id: deck.id, name: deck.name, format: deck.format, cards },
      { onConflict: 'user_id,id' },
    )
}

export async function cloudLoadHistory(): Promise<Round[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('rounds').select('d,t,h,ts').order('ts')
  if (error || !data) return []
  return data as Round[]
}

export async function cloudInsertRound(userId: string, r: Round): Promise<void> {
  if (!supabase) return
  await supabase.from('rounds').insert({ user_id: userId, d: r.d, t: r.t, h: r.h, ts: r.ts })
}
