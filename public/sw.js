// ============================================================
// public/sw.js — Service Worker (Çevrimdışı Destek)
// ============================================================
// Uygulama kabuğunu (HTML, CSS, JS) önbelleğe alır.
// İnternet yokken bile sayfanın açılmasını sağlar.
// ============================================================

const CACHE = 'cartapp-v1'

// İlk kurulumda önbelleğe alınacak sayfalar
const SHELL = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// Kurulum: uygulama kabuğunu önbelleğe al
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(SHELL).catch(() => {})
    )
  )
  self.skipWaiting()
})

// Aktivasyon: eski önbellekleri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: ağ isteklerini yakala
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Sadece GET isteklerini ve aynı origin'i işle
  if (event.request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  // API ve Supabase isteklerini atla (veri katmanı IndexedDB tarafından yönetilir)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/supabase/')) return

  // _next/static: içerik hash'li, sonsuza kadar önbellekte tut (cache-first)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then(hit =>
        hit || fetch(event.request).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(event.request, res.clone()))
          return res
        })
      )
    )
    return
  }

  // Sayfalar ve diğer varlıklar: önce ağ, sonra önbellek
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(event.request, res.clone()))
        return res
      })
      .catch(async () => {
        const hit = await caches.match(event.request)
        return hit || caches.match('/') || new Response('Çevrimdışı', { status: 503 })
      })
  )
})
