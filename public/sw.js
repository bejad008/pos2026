// ============================================================
// GG PASORYAN ENTERPRISE POS — Service Worker
// Strategy: Network First (karena Firebase butuh koneksi live)
// Cache fallback untuk assets statis saja
// ============================================================

const CACHE_NAME = 'gg-pos-v2';
const OFFLINE_URL = '/offline.html';

// Assets yang di-cache untuk offline fallback
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  OFFLINE_URL,
];

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(
        PRECACHE_ASSETS.filter(url => {
          // Jangan gagal install jika offline.html belum ada
          return true;
        })
      ).catch(() => {
        // Silent fail — tetap install meski ada asset yang gagal
      });
    })
  );
  // Langsung aktif tanpa tunggu tab lama ditutup
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Ambil alih semua tab yang terbuka
  self.clients.claim();
});

// ── Fetch ────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Lewati request non-GET
  if (request.method !== 'GET') return;

  // Lewati Firebase / Firestore / Auth requests — harus selalu network
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('unsplash.com') ||
    url.hostname.includes('api.github.com')
  ) {
    return; // Biarkan browser handle langsung
  }

  // Strategi: Network First → Cache Fallback → Offline page
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache response yang valid
        if (response && response.status === 200 && response.type === 'basic') {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        }
        return response;
      })
      .catch(() => {
        // Network gagal → coba cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // Untuk navigasi → tampilkan offline page
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// ── Background Sync (opsional, untuk future use) ─────────────
self.addEventListener('sync', (event) => {
  // Firebase SDK sudah handle retry sendiri, tidak perlu custom sync
  console.log('[SW] Background sync:', event.tag);
});
