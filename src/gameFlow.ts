// Reine Hilfsfunktionen für den Spielfluss im GameScreen (Anheben, Auswahl,
// Kaskaden-Position). Bewusst getrennt von game.ts: deal()/score() bleiben unberührt.
import type { Card, CardType } from './game'

export type Raised = Record<number, boolean>
export type Selection = Record<string, number>

// Raise-Guard (Typ-Lock): Solange Karten angehoben sind, bestimmt deren Typ,
// welche weiteren Karten angehoben werden dürfen. Frei, sobald alles unten ist.
export function lockedType(raised: Raised, rest: Card[]): CardType | null {
  for (const [idx, up] of Object.entries(raised)) {
    if (up) return rest[+idx]?.t ?? null
  }
  return null
}

// Hebt eine Karte an bzw. senkt sie ab. `blocked` ist der gesperrte Typ, wenn
// die Typ-Sperre das Anheben verhindert hat (für einen sichtbaren Hinweis).
export function toggleRaise(
  raised: Raised,
  idx: number,
  rest: Card[],
): { raised: Raised; blocked: CardType | null } {
  const isUp = !!raised[idx]
  const lock = lockedType(raised, rest)
  if (!isUp && lock && rest[idx]?.t !== lock) return { raised, blocked: lock }
  return { raised: { ...raised, [idx]: !isUp }, blocked: null }
}

export function selectedTotal(sel: Selection): number {
  return Object.values(sel).reduce((a, b) => a + b, 0)
}

// Eine Kopie mehr auswählen. 'max' = alle Kopien dieser Karte gewählt,
// 'full' = schon 6 Preiskarten gewählt. In beiden Fällen bleibt die Auswahl gleich.
export function addCopy(
  sel: Selection,
  key: string,
  q: number,
): { sel: Selection; result: 'added' | 'max' | 'full' } {
  const cur = sel[key] || 0
  if (cur >= q) return { sel, result: 'max' }
  if (selectedTotal(sel) >= 6) return { sel, result: 'full' }
  return { sel: { ...sel, [key]: cur + 1 }, result: 'added' }
}

// Eine Kopie weniger auswählen; der Eintrag verschwindet bei 0.
export function removeCopy(sel: Selection, key: string): Selection {
  const cur = sel[key] || 0
  if (cur <= 0) return sel
  const next = { ...sel }
  if (cur === 1) delete next[key]
  else next[key] = cur - 1
  return next
}

// Welche Karten (1-basiert, inklusive) sind in der Kaskade gerade zu sehen?
// Jede Karte belegt `step` px (ihren Kopfbalken); eine Karte zählt, sobald
// mindestens die Hälfte ihres Balkens im sichtbaren Bereich liegt.
export function visibleRange(
  scrollTop: number,
  viewport: number,
  step: number,
  count: number,
): [number, number] {
  if (count <= 0) return [0, 0]
  if (step <= 0) return [1, 1]
  const first = Math.min(count, Math.max(1, Math.round(scrollTop / step) + 1))
  const last = Math.min(count, Math.round((scrollTop + viewport) / step))
  return [first, Math.max(first, last)]
}
