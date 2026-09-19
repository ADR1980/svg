/* ==========================================================================
   Service Worker.

   Zweck ist die Bedienbarkeit im Funkloch, nicht Offline-Erfassung: App-Hülle
   und CDN-Bibliotheken liegen im Cache, damit Scannen und Nachschlagen im
   Keller oder in der Halle noch funktionieren. Daten aus Supabase werden
   bewusst NIE zwischengespeichert — in einer Anwendung, deren ganzer Sinn die
   Trennung von Gesellschaften ist, hat ein Cache mit fremden Zeilen nichts
   verloren, und ein abgemeldeter Browser soll nichts mehr hergeben.
   ========================================================================== */

const VERSION = 'inv-v4';
const HUELLE = VERSION + '-huelle';
const FREMD  = VERSION + '-fremd';

const DATEIEN = [
  './',
  './index.html',
  './labels.html',
  './manifest.webmanifest',
  './config.js',
  './css/app.css',
  './js/catalog.js',
  './js/db.js',
  './js/scan.js',
  './js/app.js',
  './img/icon.svg',
  './img/icon-192.png',
  './img/icon-512.png'
];

const CDN = [
  'https://cdn.jsdelivr.net/',
  'https://cdnjs.cloudflare.com/',
  'https://fonts.googleapis.com/',
  'https://fonts.gstatic.com/'
];

self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(HUELLE)
      .then(c => c.addAll(DATEIEN))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(namen => Promise.all(
        namen.filter(n => n.indexOf(VERSION) !== 0).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const cfg = self.INVENTAR_SUPABASE_HOST || '';

  /* Supabase und alles Unbekannte: unverändert durchreichen. */
  if (url.hostname.endsWith('.supabase.co') || url.hostname === cfg) return;

  const istCdn = CDN.some(p => req.url.indexOf(p) === 0);
  const istEigen = url.origin === self.location.origin;
  if (!istCdn && !istEigen) return;

  ev.respondWith((async () => {
    const speicher = await caches.open(istCdn ? FREMD : HUELLE);
    const dabei = await speicher.match(req, { ignoreVary: istCdn });
    const netz = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) speicher.put(req, res.clone()).catch(() => {});
      return res;
    }).catch(() => null);

    /* Cache zuerst, im Hintergrund erneuern. Beim ersten Aufruf und bei
       fehlendem Treffer bleibt nur das Netz — und wenn auch das fehlt, für
       eine Navigation die Startseite. */
    if (dabei) { netz; return dabei; }
    const frisch = await netz;
    if (frisch) return frisch;
    if (req.mode === 'navigate') {
      const start = await caches.match('./index.html');
      if (start) return start;
    }
    return new Response('Offline und nicht im Zwischenspeicher.', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  })());
});
