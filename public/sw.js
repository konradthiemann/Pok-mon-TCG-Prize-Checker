// Prized Service Worker — App-Shell offline, Kartenbilder mit Cache.
const VERSION = 'v2'
const SHELL = `pc-shell-${VERSION}`
const IMG = `pc-img-${VERSION}`

// Minimal-Shell: index.html + Icon + Fonts. JS/CSS werden per stale-while-revalidate gecacht.
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icons/icon-192.png',
  '/fonts/sora-latin.woff2',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL && k !== IMG).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Pokémon-Kartenbilder: cache-first, dann Netzwerk. Max 200 Einträge.
  if (
    url.hostname === 'images.pokemontcg.io' ||
    url.hostname === 'limitlesstcg.nyc3.cdn.digitaloceanspaces.com'
  ) {
    e.respondWith(
      caches.open(IMG).then(async (cache) => {
        const hit = await cache.match(request)
        if (hit) return hit
        try {
          const res = await fetch(request)
          if (res.ok) {
            cache.put(request, res.clone())
            cache.keys().then((keys) => {
              if (keys.length > 200) {
                keys.slice(0, keys.length - 200).forEach((k) => cache.delete(k))
              }
            })
          }
          return res
        } catch {
          return new Response('', { status: 408 })
        }
      }),
    )
    return
  }

  // Navigation: network-first, Fallback auf gecachte index.html.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          // Erfolgreiche Navigation cachen (frische index.html).
          if (res.ok) {
            const clone = res.clone()
            caches.open(SHELL).then((c) => c.put('/index.html', clone))
          }
          return res
        })
        .catch(() => caches.match('/index.html').then((r) => r || offlineResponse())),
    )
    return
  }

  // Gleiche Origin (JS, CSS, Fonts): stale-while-revalidate.
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.open(SHELL).then(async (cache) => {
        const hit = await cache.match(request)
        const fetchPromise = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone())
            return res
          })
          .catch(() => hit)
        return hit || fetchPromise
      }),
    )
  }
})

function offlineResponse() {
  return new Response(
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Prized — Offline</title></head>' +
      '<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f1faf2;color:#0e2a32;text-align:center">' +
      '<div><h1 style="font-size:20px;margin:0 0 8px">Du bist offline</h1>' +
      '<p style="font-size:14px;color:#64837b;margin:0 0 16px">Prized braucht eine Internetverbindung. Bitte verbinde dich und versuche es erneut.</p>' +
      '<button onclick="location.reload()" style="padding:12px 24px;border:none;border-radius:12px;background:#4fc3f7;color:#06323f;font-weight:600;font-size:14px;cursor:pointer">Erneut versuchen</button>' +
      '</div></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}
