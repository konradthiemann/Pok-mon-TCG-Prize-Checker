import { useState } from 'react'

interface Props {
  img: string
  name: string
  radius?: number
  fontSize?: number
}

// Zeigt das Karten-Artwork; fällt bei fehlendem/kaputtem Bild auf einen
// blauen Slot mit dem Kartennamen zurück (wie im Design).
export function CardFace({ img, name, radius = 10, fontSize = 10 }: Props) {
  const [failed, setFailed] = useState(false)
  const showImg = img && !failed
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: radius,
        overflow: 'hidden',
        background: 'var(--slot)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {showImg ? (
        <img
          className="card-img"
          src={img}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          onLoad={(e) => {
            // pokemontcg.io liefert für noch nicht gescannte Karten (sehr neue
            // Sets) statt der Kartenvorderseite einen generischen Karten-Rücken
            // mit fester Größe 640×892. Echte Vorderseiten sind 245×342.
            // In dem Fall auf den Namens-Fallback wechseln.
            const el = e.currentTarget
            if (el.naturalWidth === 640 && el.naturalHeight === 892) {
              setFailed(true)
            }
          }}
        />
      ) : (
        <span
          style={{
            padding: '0 6px',
            textAlign: 'center',
            fontSize,
            fontWeight: 700,
            lineHeight: 1.15,
            color: 'var(--accentInk)',
          }}
        >
          {name}
        </span>
      )}
    </div>
  )
}
