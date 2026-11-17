const CACHE = 'formatkeeper-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navigations stay network-first so a deploy is picked up immediately, with
  // the last good shell as the offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request)
          if (response.ok) {
            const cache = await caches.open(CACHE)
            await cache.put('/', response.clone())
          }
          return response
        } catch {
          const cached = (await caches.match(request)) || (await caches.match('/'))
          return cached || Response.error()
        }
      })(),
    )
    return
  }

  // Hashed build assets never change under the same URL, so cache-first is safe
  // and a background refresh keeps the cache honest.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request)
      if (cached) {
        fetch(request)
          .then((response) => {
            if (!response.ok) return
            caches.open(CACHE).then((cache) => cache.put(request, response))
          })
          .catch(() => {})
        return cached
      }

      const response = await fetch(request)
      if (response.ok) {
        const cache = await caches.open(CACHE)
        cache.put(request, response.clone())
      }
      return response
    })(),
  )
})
