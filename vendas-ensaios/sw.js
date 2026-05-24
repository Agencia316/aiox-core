const CACHE = 'vendas-ensaios-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './icon.svg',
  './manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  // Apenas GET do proprio app (mesma origem). Chamadas ao Supabase passam direto.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  // Network-first: sempre tenta a versao mais recente; usa o cache somente offline.
  e.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(request))
  );
});
