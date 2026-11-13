/* Web-Variante von window.planer (iPad, Safari, „Zum Home-Bildschirm“). Gleiche Schnittstelle wie preload.js am Laptop,
   damit app/js auf beiden Geräten derselbe Code bleibt. Diese Datei lädt nur die Web-App, nie die Laptop-App.
   Daten: IndexedDB auf dem Gerät (Schlüssel „zustand“), pro Tag eine Sicherung (7 Tage). Der Abgleich mit Drive kommt später dazu.
   Was es am iPad nicht gibt (Zug live, WLAN, Titelleiste, Widget), fehlt hier absichtlich: die Oberfläche prüft, ob es da ist. */
(function () {
  'use strict';
  const DB = 'planer', STORE = 'daten', K_STATE = 'zustand', K_CFG = 'einstellungen', K_SICH = 'sicherung:', SICH_TAGE = 7;
  const L = {}, on = ch => fn => { (L[ch] = L[ch] || []).push(fn); };
  const emit = (ch, ...x) => (L[ch] || []).forEach(f => { try { f(...x); } catch (e) { console.error(e); } });
  let db = null, stateJson = null, REV = 0, cfg = {}, kette = Promise.resolve(), sichTag = null;
  const info = { speicher: 'indexeddb', fehler: null }; // für die Oberfläche (Einstellungen → Dieses Gerät) und die Tests

  const open = () => new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('IndexedDB blockiert'));
  });
  const tx = (mode, fn) => new Promise((res, rej) => {
    const t = db.transaction(STORE, mode), req = fn(t.objectStore(STORE));
    t.oncomplete = () => res(req && req.result); t.onerror = t.onabort = () => rej(t.error || new Error('IndexedDB-Fehler'));
  });
  const get = k => tx('readonly', s => s.get(k)), put = (k, v) => tx('readwrite', s => s.put(v, k));
  const heute = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

  // Einmal pro Tag den Stand VOR der ersten Änderung des Tages wegsichern (wie die tägliche Sicherung am Laptop).
  async function sichern(alt) {
    const tag = heute(); if (sichTag === tag || !alt) return; sichTag = tag;
    if (await get(K_SICH + tag)) return;
    await put(K_SICH + tag, alt);
    const keys = (await tx('readonly', s => s.getAllKeys())).filter(k => String(k).startsWith(K_SICH)).sort();
    while (keys.length > SICH_TAGE) { const k = keys.shift(); await tx('readwrite', s => s.delete(k)); }
  }
  function schreiben(json, alt) {
    if (!db) return;
    kette = kette.then(() => sichern(alt)).then(() => put(K_STATE, json)).then(() => { info.fehler = null; }, e => { info.fehler = String(e && e.message || e); console.error('Speichern:', e); });
  }
  let kanal = null; try { kanal = new BroadcastChannel('planer-zustand'); } catch (_) {}

  // Wie main.js: jeder gespeicherte Stand bekommt die nächste _rev, der Absender erfährt sie über state:rev.
  function save(json) {
    let o; try { o = JSON.parse(json); } catch (_) { return; }
    if (!o || o.v !== 2) return; // nie etwas Unlesbares über gute Daten schreiben
    const alt = stateJson;
    REV = Math.max(REV, o._rev || 0) + 1; o._rev = REV; stateJson = JSON.stringify(o);
    schreiben(stateJson, alt);
    if (kanal) try { kanal.postMessage(stateJson); } catch (_) {}
    Promise.resolve().then(() => emit('state:rev', REV));
  }
  // Zweiter Tab desselben Geräts hat gespeichert: Stand übernehmen (wie state:changed zwischen den Laptop-Fenstern).
  if (kanal) kanal.onmessage = e => { try { const o = JSON.parse(e.data); if (!o || o.v !== 2) return; REV = Math.max(REV, o._rev || 0); stateJson = e.data; emit('state:changed', stateJson); } catch (_) {} };

  // iPadOS beendet Web-Apps im Hintergrund ohne Vorwarnung: beim Verlassen sofort speichern, nicht erst nach der Wartezeit der Oberfläche.
  const sofort = () => { try { if (typeof flushSave === 'function' && typeof saveT !== 'undefined' && saveT) flushSave(); } catch (_) {} };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') sofort(); });
  window.addEventListener('pagehide', sofort);

  const gStatus = () => ({ configured: false, connected: false, web: true });
  window.planer = {
    web: true, info,
    load: () => stateJson, save, onState: on('state:changed'), onRev: on('state:rev'),
    getConfig: () => ({ ...cfg }),
    setConfig: (k, v) => { cfg[k] = v; if (db) put(K_CFG, cfg).catch(() => {}); emit('config:changed', { ...cfg }); return { error: null, config: { ...cfg } }; },
    onConfig: on('config:changed'),
    toggleWidget() {}, openMain() {}, onOpen: on('main:open'), hideQuick() {}, onQuickShow: on('quick:show'),
    openDataDir() {}, restart() { location.reload(); },
    google: { status: gStatus, connect: async () => ({ ok: false, error: 'Die Anmeldung wird für dieses Gerät noch eingerichtet.', status: gStatus() }), sync: async () => gStatus(), disconnect: async () => gStatus(), onStatus: on('google:status') },
    // Für Tests und später für den Abgleich: wartet, bis alles Gespeicherte wirklich in IndexedDB liegt.
    fertig: () => kette,
  };

  window.planerBereit = (async () => {
    try {
      db = await open();
      const [s, c] = [await get(K_STATE), await get(K_CFG)];
      if (typeof s === 'string') { try { const o = JSON.parse(s); if (o && o.v === 2) { stateJson = s; REV = o._rev || 0; } } catch (_) {} }
      if (c && typeof c === 'object') cfg = c;
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (_) {}
    } catch (e) { // z. B. privater Modus: App läuft, aber nur bis zum Schließen. Die Oberfläche sagt das ruhig dazu.
      db = null; info.speicher = 'keiner'; info.fehler = String(e && e.message || e);
    }
  })();
})();
