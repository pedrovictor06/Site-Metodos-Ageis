// Service worker: guarda os arquivos do app para funcionar offline.
// Estratégia "rede primeiro": com internet, sempre mostra a versão mais nova do site
// (e atualiza a cópia guardada); sem internet ou com rede muito lenta, usa a cópia guardada.
// Se alterar algum arquivo, mude a versão abaixo para renovar o cache.
const CACHE = 'bons-prompts-v10';
const ARQUIVOS = [
  './',
  './index.html',
  './style.css',
  './cartas.js',
  './validador.js',
  './script.js',
  './manifest.json',
  './imagens/icon-192.png',
  './imagens/icon-512.png'
];
const ESPERA_REDE_MS = 4000;

self.addEventListener('install', (e) => {
  // cache: 'reload' busca direto no servidor, sem pegar cópia velha do navegador
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS.map((u) => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const guardada = () => caches.match(req).then((r) => r || caches.match('./index.html'));
  e.respondWith(new Promise((responder) => {
    let pronto = false;
    const fim = (r) => { if (!pronto && r) { pronto = true; responder(r); } };
    // rede lenta demais: entrega a cópia guardada enquanto a rede termina em segundo plano
    const relogio = setTimeout(() => caches.match(req).then(fim), ESPERA_REDE_MS);
    fetch(req, { cache: 'no-cache' })
      .then((r) => {
        clearTimeout(relogio);
        if (r && r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
        fim(r);
      })
      .catch(() => { clearTimeout(relogio); guardada().then((r) => fim(r || Response.error())); });
  }));
});
