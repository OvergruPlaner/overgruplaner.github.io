/* Service Worker der Web-App: Der Planer startet auch ohne Internet.
   Dies ist die VORLAGE. web-bauen.js setzt Version (Hash über alle Dateien) und Dateiliste ein und legt das Ergebnis als sw.js
   in den Wurzelordner der veröffentlichten App. Nie von Hand in das Ergebnis schreiben.
   Ablauf: Beim Installieren kommen ALLE Dateien dieser Version in einen eigenen Cache. Danach wird nur noch aus dem Cache geantwortet,
   also nie eine Mischung aus alter und neuer Version. Eine neue Version lädt im Hintergrund und gilt ab dem nächsten Start der App.
   Deine Daten liegen nicht hier, sondern in IndexedDB (web/bruecke.js); der Cache enthält nur das Programm. */
const VERSION = "5e4370119df6", DATEIEN = ["css/planer.css","datenschutz.html","index.html","info.html","js/01-kern.js","js/02-zustand.js","js/03-zug.js","js/04-dashboard-layout.js","js/05-lernplan.js","js/06-abfragen.js","js/07-umstellungen.js","js/08-status.js","js/09-alltag.js","js/10-jetzt-fokus.js","js/11-bausteine.js","js/12-heute.js","js/13-kalender.js","js/14-seiten.js","js/15-schnelleingabe.js","js/16-termin-dialog.js","js/17-tagesfluss.js","js/18-heute-ruhig.js","js/19-briefing.js","js/20-haushalt-waechter.js","js/21-fenster.js","js/22-google.js","js/23-dialoge.js","js/24-widget.js","js/25-rendern.js","js/26-finanzen.js","js/27-diagramme.js","js/28-ereignisse.js","js/29-start.js","manifest.webmanifest","vendor/Sortable.min.js","web/bruecke.js","web/icons/icon-180.png","web/icons/icon-192.png","web/icons/icon-512.png","web/schrift/bricolage-grotesque-latin-opsz-normal.woff2","web/schrift/ibm-plex-mono-latin-400-normal.woff2","web/schrift/ibm-plex-mono-latin-500-normal.woff2","web/schrift/ibm-plex-sans-latin-400-normal.woff2","web/schrift/ibm-plex-sans-latin-500-normal.woff2","web/schrift/ibm-plex-sans-latin-600-normal.woff2","web/schrift/schrift.css","web/start.js"], CACHE = 'planer-' + VERSION;
const adresse = f => new URL(f, self.registration.scope).href;

self.addEventListener('install', e => {
  // cache:'reload' = am Browser-Zwischenspeicher vorbei, damit wirklich diese Version im Cache landet. Fehlt eine Datei, schlägt alles fehl
  // und die alte Version bleibt in Betrieb.
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(DATEIEN.map(f => new Request(adresse(f), { cache: 'reload' })))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('planer-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin || !u.href.startsWith(self.registration.scope)) return; // z. B. Google: nie anfassen
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const ziel = u.pathname.endsWith('/') ? u.origin + u.pathname + 'index.html' : u.origin + u.pathname; // „/“ ist index.html, ?… und #… sind egal
    return (await c.match(ziel)) || fetch(e.request);
  })());
});
