// Prized-Server: liefert die statisch gebaute SPA aus `dist/`.
// Die App ist rein clientseitig (localStorage) — kein Backend-State nötig.
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(__dirname, '..', 'dist')
const PORT = Number(process.env.PORT) || 8080

const app = express()

// Security Headers (X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, etc.)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'"],
        imgSrc: [
          "'self'",
          'data:',
          'https://images.pokemontcg.io',
          'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com',
          'https://r2.limitlesstcg.net',
          'https://raw.githubusercontent.com',
        ],
        connectSrc: [
          "'self'",
          'https://api.pokemontcg.io',
          'https://*.supabase.co',
          'https://pokeapi.co',
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Card-Bilder von externen CDNs
  }),
)

// Rate Limiting: max 120 Requests pro Minute pro IP
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }),
)

app.get('/healthz', (_req, res) => res.json({ ok: true }))

// Source Maps und dotfiles blockieren
app.use((_req, res, next) => {
  if (_req.path.endsWith('.map') || _req.path.includes('/.')) {
    return res.status(404).end()
  }
  next()
})

app.use(express.static(DIST_DIR, { maxAge: '1h', index: false }))

// SPA-Fallback: HTML-Requests + Root → index.html, alles andere → 404.
app.get('*', (req, res) => {
  const accept = req.headers.accept || ''
  if (req.path === '/' || accept.includes('text/html')) {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  } else {
    res.status(404).end()
  }
})

app.listen(PORT, () => {
  console.log(`Prized läuft auf Port ${PORT}`)
})
