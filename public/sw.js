// キャッシュバージョンを上げて古いSWを強制更新
const CACHE_NAME = 'menuvoice-v3'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// キャッシュは使わない（常にネットワークから取得）
self.addEventListener('fetch', () => {})
