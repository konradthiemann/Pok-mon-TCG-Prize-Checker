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

import { type CardInput } from './game'

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
