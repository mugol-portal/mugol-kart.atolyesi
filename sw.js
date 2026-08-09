// MuGöl Kart Atölyesi — minimal service worker
// Amaç: PWA kurulabilirlik kriterini sağlamak ve ana sayfayı çevrimdışı da açılabilir kılmak.
// Diğer kart sayfalarına dokunmaz; sadece ana sayfa ve temel varlıkları önbelleğe alır.

const CACHE_NAME = 'mugol-kart-atolyesi-v1';
const CORE_ASSETS = [
  './index.html',
  './manifest.json',
  './logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Sadece kendi kayıtlı varlıklarımız için önbellek-öncelikli, ağ-yedekli strateji.
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Başarılı GET yanıtlarını sessizce önbelleğe ekle (sadece kendi originimiz).
        if (res && res.status === 200 && req.url.startsWith(self.location.origin)) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
