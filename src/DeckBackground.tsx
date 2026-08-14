import { type Deck, hueOf, starCard } from './game'

interface Props {
  deck: Deck
  dark: boolean
  // Stärke des Effekts. 'soft' für Screens mit viel Text (Home), 'full' fürs Spiel.
  intensity?: 'soft' | 'full'
}

// Deckabhängiger Hintergrund: das Haupt-Pokémon als stark unscharfes,
// entsättigtes "Farbwolken"-Bild plus ein dezenter, aus dem Deck-Namen
// abgeleiteter Farbverlauf. Bewusst niedrig gesättigt, damit der Vordergrund
// lesbar bleibt. Fällt ohne CORS/Canvas aus — reines CSS.
export function DeckBackground({ deck, dark, intensity = 'full' }: Props) {
  const hue = hueOf(deck.name)
  const img = starCard(deck).img
  const full = intensity === 'full'

  const tintA = dark
    ? `hsl(${hue} 45% 16%)`
    : `hsl(${hue} 60% ${full ? 90 : 93}%)`
  const tintB = dark
    ? `hsl(${(hue + 40) % 360} 40% 10%)`
    : `hsl(${(hue + 40) % 360} 55% ${full ? 95 : 97}%)`

  const imgOpacity = img ? (dark ? (full ? 0.3 : 0.18) : full ? 0.28 : 0.16) : 0

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
      {/* Basis-Farbverlauf aus dem Deck-Farbton */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(120% 90% at 50% 0%, ${tintA}, ${tintB} 70%, var(--bg))`,
        }}
      />
      {/* Unscharfes Haupt-Pokémon als Farbwolke */}
      {img && (
        <img
          src={img}
          alt=""
          aria-hidden
          style={{
            position: 'absolute',
            top: '-12%',
            left: '50%',
            width: '150%',
            transform: 'translateX(-50%)',
            filter: `blur(64px) saturate(${dark ? 0.7 : 0.85})`,
            opacity: imgOpacity,
            objectFit: 'cover',
          }}
        />
      )}
      {/* Scrim, damit Vordergrund-Karten & Text klar bleiben */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: dark
            ? 'linear-gradient(180deg, rgba(12,22,19,.25), rgba(12,22,19,.55))'
            : 'linear-gradient(180deg, rgba(255,255,255,.28), rgba(255,255,255,.55))',
        }}
      />
    </div>
  )
}
