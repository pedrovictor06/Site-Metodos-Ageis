// Service worker: guarda os arquivos do app para funcionar offline.
// Se alterar algum arquivo, mude a versão abaixo para atualizar o cache.
const CACHE = 'bons-prompts-v3';
const ESSENCIAIS = ['./', './index.html'];                // sem estes, o app não funciona offline
const OPCIONAIS = ['./manifest.json', './imagens/icon-192.png', './imagens/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      // Os essenciais precisam entrar no cache (se falhar, a instalação é tentada de novo).
      // Os opcionais (ex.: ícones) não derrubam a instalação se estiverem faltando.
      c.addAll(ESSENCIAIS).then(() => Promise.all(OPCIONAIS.map((u) => c.add(u).catch(() => {}))))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((r) =>
      r || fetch(e.request).catch(() =>
        // Só páginas voltam para o index; imagens/arquivos faltando não viram HTML por engano.
        e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()
      )
    )
  );
});
