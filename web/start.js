/* Start der Web-App. Die Module aus app/js erwarten, dass window.planer.load() sofort (synchron) den Stand liefert.
   IndexedDB antwortet aber erst später. Deshalb stehen die Module in der veröffentlichten index.html als
   <script type="planer/modul" data-src="…"> (läuft nicht von selbst) und werden hier der Reihe nach geladen,
   sobald die Brücke (web/bruecke.js) die Daten hat. Reihenfolge = die aus app/index.html, sie ist Teil des Codes. */
(function () {
  'use strict';
  // Widget- und Schnellfenster gibt es nur am Laptop.
  if (['#widget', '#quick'].includes(location.hash)) history.replaceState(null, '', location.pathname + location.search);
  document.documentElement.classList.add('web');
  const module = [...document.querySelectorAll('script[type="planer/modul"]')].map(s => s.dataset.src);
  const lade = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error(src)); document.body.append(s); });
  window.planerGestartet = (async () => {
    await window.planerBereit;
    document.body.classList.add('web');
    try { for (const m of module) await lade(m); } // nacheinander: bricht ein Modul ab, läuft danach nichts mit halbem Code
    catch (e) {
      const d = document.createElement('div'); d.className = 'web-hinweis'; d.setAttribute('role', 'alert');
      d.innerHTML = '<b>Der Planer konnte nicht ganz geladen werden.</b><p>Deine Daten sind unverändert. Meistens fehlt nur kurz das Internet.</p><button type="button">Neu laden</button>';
      d.querySelector('button').onclick = () => location.reload();
      d.style.cssText = 'margin:20vh auto;max-width:420px;padding:20px;font:16px/1.5 system-ui,sans-serif;text-align:center';
      document.querySelector('.app').replaceWith(d);
      throw e;
    }
    // Start ohne Internet: Der Service Worker (sw.js, von web-bauen.js erzeugt) hält das Programm im Cache. Geht das Anmelden schief
    // (alter Browser, privater Modus), läuft die App trotzdem, nur eben nicht offline.
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  })();
})();
