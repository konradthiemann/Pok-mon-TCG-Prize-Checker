// Prized Service Worker — App-Shell offline, Kartenbilder mit Cache.
const VERSION = 'v1'
const SHELL = `pc-shell-${VERSION}`
const IMG = `pc-img-${VERSION}`
const SHELL_ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()))
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

  // Pokémon-Kartenbilder: cache-first, dann Netzwerk (dauerhaft gecacht).
  if (url.hostname === 'images.pokemontcg.io') {
    e.respondWith(
      caches.open(IMG).then(async (cache) => {
        const hit = await cache.match(request)
        if (hit) return hit
        const res = await fetch(request)
        if (res.ok) cache.put(request, res.clone())
        return res
      }),
    )
    return
  }

  // Navigation / App-Shell: network-first mit Fallback auf Cache (SPA).
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((r) => r || Response.error())),
    )
    return
  }

  // Sonstige gleiche Origin: stale-while-revalidate.
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
