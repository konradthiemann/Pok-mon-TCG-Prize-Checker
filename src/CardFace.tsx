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
