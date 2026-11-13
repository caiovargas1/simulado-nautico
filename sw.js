// Service worker: guarda o app no aparelho para funcionar sem internet.
// Ao publicar uma nova versão do app, troque o número em VERSION.
const VERSION = 'simulado-nautico-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const mesmaOrigem = url.origin === location.origin;
  const fonte = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!mesmaOrigem && !fonte) return;

  // Páginas: tenta a rede (pega versão nova) e cai no cache se estiver offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put('index.html', c)); return r; })
        .catch(() => caches.match('index.html'))
    );
    return;
  }
  // Demais arquivos e fontes: usa o cache e atualiza em segundo plano.
  e.respondWith(
    caches.match(req).then(hit => {
      const rede = fetch(req).then(r => {
        if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); }
        return r;
      }).catch(() => hit);
      return hit || rede;
    })
  );
});
