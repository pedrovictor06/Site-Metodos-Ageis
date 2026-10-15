// Service worker: guarda os arquivos do app para funcionar offline.
// Se alterar algum arquivo, mude a versão abaixo para atualizar o cache.
const CACHE = 'bons-prompts-v2';
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.json',
  './imagens/icon-192.png',
  './imagens/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
