// OpenGym Service Worker
// Strategy: Cache-First for static assets, Network-First for API/pages

const CACHE_NAME = 'opengym-v1'
const OFFLINE_URL = '/offline'

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// ─── Install: pre-cache critical assets ───────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// ─── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

// ─── Fetch: routing strategy ──────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // API routes — Network-only (never cache sensitive data)
  if (url.pathname.startsWith('/api/')) return

  // _next/static assets — Cache-first (hashed filenames = safe to cache forever)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const clone = res.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
            return res
          })
      )
    )
    return
  }

  // Images & icons — Cache-first with network fallback
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((res) => {
              const clone = res.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
              return res
            })
            .catch(() => new Response('', { status: 404 }))
      )
    )
    return
  }

  // HTML pages — Network-first, fallback to cache, then offline page
  event.respondWith(
    fetch(request)
      .then((res) => {
        // Cache successful page responses
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return res
      })
      .catch(() =>
        caches
          .match(request)
          .then((cached) => cached || caches.match(OFFLINE_URL))
      )
  )
})

// ─── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'OpenGym', body: event.data.text() }
  }

  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    dir: 'rtl',
    lang: 'ar',
    data: { url: payload.url || '/dashboard' },
    actions: payload.actions || [],
    tag: payload.tag || 'opengym-notification',
    renotify: true,
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'OpenGym', options)
  )
})

// ─── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})

// ─── Message from client (e.g. SKIP_WAITING from PWARegister) ─────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
