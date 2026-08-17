// Prized-Server: liefert die statisch gebaute SPA aus `dist/`.
// Die App ist rein clientseitig (localStorage) — kein Backend-State nötig.
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(__dirname, '..', 'dist')
const PORT = Number(process.env.PORT) || 8080

const app = express()

app.get('/healthz', (_req, res) => res.json({ ok: true }))

app.use(express.static(DIST_DIR, { maxAge: '1h', index: false }))

// SPA-Fallback: alle übrigen Routen liefern index.html.
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Prized läuft auf Port ${PORT}`)
})
