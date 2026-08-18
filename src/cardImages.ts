// Löst für Karten ohne bekannte Set-Zuordnung die echte pokemontcg.io-Set-ID
// auf, damit ein Bild geladen werden kann.
//
// Strategie (bewusst request-sparsam, da die anonyme API rate-limitet und
// sporadisch "Failed to fetch"/500 liefert):
//   1) Set-Kürzel (ptcgoCode) -> Set-ID über den /sets-Endpoint, EINE Abfrage
//      pro Set (Ergebnis gecacht). Bild-URL wird dann deterministisch als
//      "<setId>/<nummer>" gebildet.
//   2) Ist das Kürzel unbekannt (z. B. Basis-Energie "Metal Energy MEE 8"),
//      Fallback über Name + Nummer -> "<setId>/<nummer>".
// Transiente Netzwerk-/Serverfehler werden mit Backoff mehrfach versucht und
// NICHT negativ gecacht. Lässt sich nichts auflösen, bleibt der Namens-Fallback
// in der UI (CardFace zeigt bei fehlendem/kaputtem Bild den Namen).

import { type Card, type CardInput } from './game'

const CARD_CACHE_KEY = 'pc_card_api_v3'
const SET_CACHE_KEY = 'pc_set_id_v1'
const BASE = 'https://api.pokemontcg.io/v2'
const RETRIES = 5

type Cache = Record<string, string> // ('' = definitiv nicht gefunden)

function loadCache(key: string): Cache {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}') as Cache
  } catch {
    return {}
  }
}

function saveCache(key: string, c: Cache) {
  try {
    localStorage.setItem(key, JSON.stringify(c))
  } catch {
    /* Speicher voll o. Ä. — Cache ist optional. */
  }
}

function has(c: Cache, k: string) {
  return Object.prototype.hasOwnProperty.call(c, k)
}

// Führt eine Query mit Backoff-Retries aus.
// null = anhaltender Netzwerk-/Serverfehler (Aufrufer soll NICHT cachen).
async function fetchData<T>(path: string): Promise<T[] | null> {
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`)
      if (res.ok) {
        const json = (await res.json()) as { data?: T[] }
        return json.data ?? []
      }
    } catch {
      /* Netzwerkfehler — erneut versuchen. */
    }
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)))
  }
  return null
}

// Set-Kürzel -> Set-ID.
// Rückgabe: Set-ID (Treffer) | '' (definitiv unbekannt) | null (transient).
async function resolveSetId(code: string): Promise<string | null> {
  const key = code.toUpperCase()
  const cache = loadCache(SET_CACHE_KEY)
  if (has(cache, key)) return cache[key]

  const data = await fetchData<{ id: string }>(
    `/sets?q=${encodeURIComponent(`ptcgoCode:"${code}"`)}`,
  )
  if (data === null) return null // transient — nicht cachen
  const id = data[0]?.id ?? ''
  cache[key] = id
  saveCache(SET_CACHE_KEY, cache)
  return id
}

// Gibt den api-Pfad ("<setId>/<number>") zurück oder null, wenn kein Bild
// ermittelt werden konnte.
export async function resolveCardApi(card: CardInput): Promise<string | null> {
  if (card.api) return card.api

  const key = card.s.toUpperCase() + '/' + card.c
  const cache = loadCache(CARD_CACHE_KEY)
  if (has(cache, key)) return cache[key] || null

  // 1) Über das Set-Kürzel.
  const setId = await resolveSetId(card.s)
  if (setId) {
    const api = `${setId}/${card.c}`
    cache[key] = api
    saveCache(CARD_CACHE_KEY, cache)
    return api
  }
  if (setId === null) return null // transient — später erneut versuchen

  // 2) Kürzel unbekannt: Fallback über Name + Nummer.
  //    Namen mit Anführungszeichen brechen die Query -> überspringen.
  if (/["']/.test(card.n)) return null
  const data = await fetchData<{ number: string; set: { id: string } }>(
    `/cards?q=${encodeURIComponent(`name:"${card.n}" number:${card.c}`)}&pageSize=5&orderBy=-set.releaseDate`,
  )
  if (data === null) return null // transient
  const hit = data[0]
  const api = hit ? `${hit.set.id}/${hit.number}` : ''
  cache[key] = api
  saveCache(CARD_CACHE_KEY, cache)
  return api || null
}

// Prüft über die pokemontcg.io-API ob ein Pokémon ein Basis-Pokémon ist.
// Gecacht in localStorage, damit ein Deck nur einmal aufgelöst werden muss.
const BASIC_CACHE_KEY = 'pc_basic_v1'

async function resolveBasicStatus(api: string): Promise<boolean | null> {
  const cache = loadCache(BASIC_CACHE_KEY)
  if (has(cache, api)) return cache[api] === '1'

  const id = api.replace('/', '-')
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${BASE}/cards/${id}?select=subtypes`)
      if (res.ok) {
        const json = (await res.json()) as { data?: { subtypes?: string[] } }
        const subtypes = json.data?.subtypes ?? []
        const isBasic = subtypes.includes('Basic')
        cache[api] = isBasic ? '1' : '0'
        saveCache(BASIC_CACHE_KEY, cache)
        return isBasic
      }
    } catch {
      /* Netzwerkfehler — erneut versuchen. */
    }
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)))
  }
  return null
}

// Füllt fehlende Bild-Pfade eines Decks nach (für Karten aus Sets, die nicht in
// SETMAP stehen — z. B. importierte Decks) UND löst den Basis-Status für Pokémon
// auf, damit deal() korrekt ein Basis-Pokémon als aktives Pokémon wählt.
// Sequenziell + gedrosselt, damit die anonyme pokemontcg.io-API nicht rate-limitet.
export async function resolveDeckImages(
  cards: Card[],
  onProgress: (cards: Card[]) => void,
  alive: () => boolean = () => true,
): Promise<void> {
  let next = cards
  // Phase 1: Fehlende Bilder auflösen
  for (let i = 0; i < next.length; i++) {
    if (!alive()) return
    const c = next[i]
    if (c.api) continue
    const api = await resolveCardApi(c)
    if (!alive()) return
    if (api) {
      const img = 'https://images.pokemontcg.io/' + api + '.png'
      next = next.map((x, j) => (j === i ? { ...x, api, img } : x))
      onProgress(next)
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  // Phase 2: Basis-Status für Pokémon ohne b-Flag auflösen
  for (let i = 0; i < next.length; i++) {
    if (!alive()) return
    const c = next[i]
    if (c.t !== 'P' || c.b !== undefined) continue
    const api = c.api
    if (!api) continue
    const basic = await resolveBasicStatus(api)
    if (!alive()) return
    if (basic !== null) {
      const b = basic ? 1 : 0
      next = next.map((x, j) => (j === i ? { ...x, b } : x))
      onProgress(next)
    }
    await new Promise((r) => setTimeout(r, 150))
  }
}
