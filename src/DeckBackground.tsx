import { useEffect, useState } from 'react'
import { type Deck, hueOf, starCard } from './game'

interface Props {
  deck: Deck
  dark: boolean
  // Stärke des Effekts. 'soft' für Screens mit viel Text, 'full' fürs Spiel.
  intensity?: 'soft' | 'full'
}

// Pokédex-Farbe (PokéAPI species.color.name) -> [Farbton, Sättigung%].
const COLOR_MAP: Record<string, [number, number]> = {
  black: [240, 8],
  blue: [208, 70],
  brown: [25, 48],
  gray: [210, 10],
  green: [130, 55],
  pink: [330, 62],
  purple: [275, 55],
  red: [6, 72],
  white: [200, 16],
  yellow: [48, 78],
}

interface BgData {
  sprite: string | null
  hue: number | null
  sat: number | null
}

const cache = new Map<string, BgData>()
const inflight = new Map<string, Promise<BgData>>()

// Kartennamen auf den PokéAPI-Speziesnamen abbilden.
// Entfernt: TCG-Suffixe (ex, gx, …), "Mega "-Präfix, Trainer-Präfixe ("N's ", "Rocket's ").
function speciesOf(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(ex|gx|v|vmax|vstar|v-union|break|prime)\b/g, ' ')
    .replace(/^mega\s+/, '')
    .replace(/^[a-z]+['']s\s+/i, '')
    .replace(/[.'':\u2018\u2019]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

async function fetchBg(species: string): Promise<BgData> {
  try {
    const [pRes, sRes] = await Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${species}`),
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${species}`),
    ])
    let sprite: string | null = null
    if (pRes.ok) {
      const p = await pRes.json()
      sprite = p?.sprites?.front_default ?? null
    }
    // Fallback: limitlesstcg-Sprite (41×34 Pixel-Art, guter TCG-Abgleich)
    if (!sprite) {
      const ltcg = `https://r2.limitlesstcg.net/pokemon/gen9/${species}.png`
      try {
        const r = await fetch(ltcg, { method: 'HEAD' })
        if (r.ok) sprite = ltcg
      } catch {
        /* ignore */
      }
    }
    let hue: number | null = null
    let sat: number | null = null
    if (sRes.ok) {
      const s = await sRes.json()
      const m = COLOR_MAP[s?.color?.name]
      if (m) {
        hue = m[0]
        sat = m[1]
      }
    }
    return { sprite, hue, sat }
  } catch {
    return { sprite: null, hue: null, sat: null }
  }
}

// Deckabhängiger Hintergrund: das Haupt-Pokémon als Pixel-Sprite (PokéAPI),
// ~70% breit und mit reduzierter Deckkraft, dahinter ein Farbverlauf, der sich
// an der Pokédex-Farbe des Pokémon orientiert. Fällt bei fehlendem Sprite auf
// einen reinen, aus dem Deck-Namen abgeleiteten Farbverlauf zurück.
export function DeckBackground({ deck, dark, intensity = 'full' }: Props) {
  const species = speciesOf(starCard(deck).n)
  const [data, setData] = useState<BgData | null>(() => cache.get(species) ?? null)

  useEffect(() => {
    const cached = cache.get(species)
    if (cached) {
      setData(cached)
      return
    }
    let alive = true
    let pr = inflight.get(species)
    if (!pr) {
      pr = fetchBg(species).then((d) => {
        cache.set(species, d)
        inflight.delete(species)
        return d
      })
      inflight.set(species, pr)
    }
    pr.then((d) => {
      if (alive) setData(d)
    })
    return () => {
      alive = false
    }
  }, [species])

  const full = intensity === 'full'
  const hue = data?.hue ?? hueOf(deck.name)
  const sat = data?.sat ?? 55
  const sprite = data?.sprite ?? null

  const tintA = dark
    ? `hsl(${hue} ${Math.min(sat, 45)}% 16%)`
    : `hsl(${hue} ${Math.min(sat, 60)}% ${full ? 90 : 93}%)`
  const tintB = dark
    ? `hsl(${(hue + 30) % 360} ${Math.min(sat, 40)}% 10%)`
    : `hsl(${(hue + 30) % 360} ${Math.min(sat, 50)}% ${full ? 95 : 97}%)`

  const spriteOpacity = full ? (dark ? 0.52 : 0.46) : dark ? 0.24 : 0.2

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Farbverlauf, abgestimmt auf die Pokédex-Farbe des Pokémon */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(120% 90% at 50% 42%, ${tintA}, ${tintB} 70%, var(--bg))`,
        }}
      />
      {/* Gekacheltes Muster aus vielen kleinen Pixel-Sprites des Haupt-Pokémon */}
      {sprite && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${sprite})`,
            backgroundRepeat: 'repeat',
            backgroundSize: `${full ? 78 : 62}px`,
            imageRendering: 'pixelated',
            opacity: spriteOpacity,
            filter: dark ? 'saturate(.95)' : 'none',
          }}
        />
      )}
      {/* Leichter Scrim, damit Vordergrund-Karten klar bleiben */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: dark
            ? `linear-gradient(180deg, rgba(12,22,19,.1), rgba(12,22,19,${full ? 0.2 : 0.4}))`
            : `linear-gradient(180deg, rgba(255,255,255,.1), rgba(255,255,255,${full ? 0.2 : 0.4}))`,
        }}
      />
    </div>
  )
}
