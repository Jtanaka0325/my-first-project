const CACHE_NAME = 'menuvoice-v1'
const PRECACHE = ['/', '/customer', '/staff', '/kitchen', '/dashboard']

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(url).catch(() => {})))
    )
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // POSTやSupabase APIはキャッシュしない
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('supabase.co')) return

  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request).catch(() => cached))
  )
})
