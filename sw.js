/* Mine Fire · sw.js: com internet, sempre confere a versão nova no site; sem internet, abre a última salva. */
const CACHE = 'minefire-rede-1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || req.headers.has('range')) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const page = req.mode === 'navigate';
    const saved = async () =>
      (await cache.match(req, { ignoreSearch: true })) ||
      (page ? await cache.match('index.html') : undefined) ||
      caches.match(req, { ignoreSearch: true });   /* último recurso: cópia guardada pelo sw anterior */
    try {
      const r = await fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' });
      if (page && r.redirected) return Response.redirect(r.url);
      if (r.status === 200) {
        e.waitUntil(cache.put(req.url, r.clone()).catch(() => {}));
        return r;
      }
      return (await saved()) || r;
    } catch (err) {
      return (await saved()) || Response.error();
    }
  })());
});
