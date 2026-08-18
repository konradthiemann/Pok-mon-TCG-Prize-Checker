import { useState } from 'react'

interface Props {
  img: string
  fallbackImg?: string
  name: string
  radius?: number
  fontSize?: number
}

// Zeigt das Karten-Artwork; fällt bei fehlendem/kaputtem Bild auf einen
// limitlesstcg-Fallback zurück, dann auf einen blauen Slot mit dem Kartennamen.
export function CardFace({ img, fallbackImg, name, radius = 10, fontSize = 10 }: Props) {
  const [failed, setFailed] = useState(false)
  const [fallbackFailed, setFallbackFailed] = useState(false)

  const useFallback = (!img || failed) && fallbackImg && !fallbackFailed
  const showImg = (img && !failed) || useFallback
  const src = useFallback ? fallbackImg : img

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
          src={src}
          alt={name}
          loading="lazy"
          onError={() => {
            if (useFallback) setFallbackFailed(true)
            else setFailed(true)
          }}
          onLoad={(e) => {
            const el = e.currentTarget
            if (el.naturalWidth === 640 && el.naturalHeight === 892) {
              if (useFallback) setFallbackFailed(true)
              else setFailed(true)
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
