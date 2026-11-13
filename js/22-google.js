/* ---------- Google: Status, Verbinden, Mail-Terminerkennung ---------- */
let GSTATUS=APP&&window.planer.google?window.planer.google.status():{configured:false,connected:false};
if(APP&&window.planer.google)window.planer.google.onStatus(st=>{const was=GSTATUS;GSTATUS=st;
  if(MODE!=='main'){return}const sb=$('#side');if(sb)sb.innerHTML=renderSide();
  if(view==='einstellungen'&&$('#overlay').hidden)render();else if(view==='heute'&&(was.needsReauth!==st.needsReauth||was.connected!==st.connected))render()});
const agoTxt=iso=>{if(!iso)return 'noch nie';const m=Math.round((Date.now()-new Date(iso).getTime())/6e4);return m<1?'gerade eben':m<60?`vor ${m} min`:m<1440?`vor ${Math.round(m/60)} h`:`vor ${Math.round(m/1440)} Tagen`};
function googleSideText(){const g=GSTATUS;if(!g.connected)return 'Google nicht verbunden';if(g.needsReauth)return 'Google: erneuern nötig';if(g.syncing)return 'Google · synchronisiert …';return `Google · ${agoTxt(g.lastSync)}`}
function googleCard(){const g=GSTATUS,sv=g.services||{};
  const row=(l,on,d)=>`<div class="conn"><span>${l}</span><span>${!g.connected?d:on?`<b style="color:var(--accent)">${ic('check',12).replace('class="ic"','class="ic" style="display:inline;vertical-align:-1px"')} verbunden</b>`:'<span style="color:var(--warn)">nicht freigegeben</span>'}</span></div>`;
  let head,actions;
  if(WEB){head='<p class="hint" style="margin-top:0">Die Anmeldung bei Google wird für dieses Gerät noch eingerichtet.</p>';actions=''}
  else if(!g.configured){head='<p class="hint" style="margin-top:0">Die Datei <code>google-client.json</code> fehlt im Planer-Ordner.</p>';actions=''}
  else if(!g.connected){head='<p class="hint" style="margin-top:0">Ein Login für Kalender, Tasks, Geburtstage und Gmail. Es öffnet sich dein Browser.</p>';actions=`<button class="btn primary" data-act="g-connect">Mit Google verbinden</button>`}
  else if(g.needsReauth){head=`<p class="hint" style="margin-top:0;color:var(--warn)">Google hat dich abgemeldet (passiert im Test-Status wöchentlich). Einmal erneuern, deine Daten bleiben.</p>`;actions=`<button class="btn primary" data-act="g-connect">Verbindung erneuern</button>`}
  else{head=`<p class="hint" style="margin-top:0">Verbunden als <b>${esc(g.email||'')}</b> · zuletzt synchronisiert ${agoTxt(g.lastSync)}${g.syncing?' · läuft gerade':''}</p>`;actions=`${Object.values(sv).some(x=>!x)?'<button class="btn primary" data-act="g-connect">Fehlende freigeben</button>':''}<button class="btn" data-act="g-sync">Jetzt synchronisieren</button><button class="btn ghost danger" data-act="g-disconnect">Trennen</button>`}
  return `<section class="card"><div class="card-head"><h2>Google</h2><span class="meta">ein Login</span></div>${head}
   ${row('Kalender',sv.calendar,'lesen + schreiben')}${row('Tasks (To-dos)',sv.tasks,'lesen + schreiben')}${row('Kontakte',sv.contacts,'Geburtstage lesen')}${row('Gmail',sv.gmail,'nur lesen')}
   ${g.error?`<p class="hint" style="color:var(--danger)">Letzter Fehler: ${esc(g.error)}</p>`:''}
   <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${actions}</div>
   ${g.connected&&Object.values(sv).some(x=>!x)?'<p class="hint">Bei „nicht freigegeben“ hast du beim Login ein Häkchen weggelassen. „Fehlende freigeben“ und beim Login alle Häkchen setzen.</p>':''}</section>`}
function calendarsCard(){const cals=(S.gcalendars||[]).slice().sort((a,b)=>b.primary-a.primary);
  return `<section class="card"><div class="card-head"><h2>Kalender</h2><span class="meta">wem gehört was</span></div>
   ${cals.map(c=>{const cf=calCfg(c.id);return `<div class="calrow"><span class="calsw ${c.primary?'c-'+'privat':'c-fam'}"></span>
     <div class="calrow-main">${c.primary?`<b>Dein Kalender</b><small>${esc(c.name)}</small>`:`<label class="sr" for="cl-${esc(c.id)}">Anzeigename</label><input id="cl-${esc(c.id)}" type="text" value="${esc(cf.label)}" data-calcfg="label" data-id="${esc(c.id)}" placeholder="z. B. Mama"><small>${esc(c.name)} · nur lesen</small>`}</div>
     ${c.primary?'':`<label class="check-l"><input type="checkbox" data-calcfg="inPlan" data-id="${esc(c.id)}" ${cf.inPlan?'checked':''}> in meinem Tag</label><label class="check-l"><input type="checkbox" data-calcfg="show" data-id="${esc(c.id)}" ${cf.show?'checked':''}> anzeigen</label>`}</div>`}).join('')}
   <p class="hint">Termine aus fremden Kalendern sind lila, mit Namen dran. „In meinem Tag“ heißt: Sie zählen als fixe Termine im Tagesplan und bekommen Erinnerungen. Sonst siehst du sie nur im Kalender.</p></section>`}
function gBanner(){const g=GSTATUS;if(!APP||!g.connected||!g.needsReauth)return '';
  return `<section class="card gbanner"><div><b>Google-Verbindung erneuern</b><p class="hint" style="margin:2px 0 0">Google meldet dich im Test-Status einmal pro Woche ab. Ein Klick, im Browser bestätigen, fertig. Deine Daten bleiben.</p></div><button class="btn primary" data-act="g-connect">Erneuern</button></section>`}
async function gConnect(){toast('Browser geöffnet','Melde dich dort bei Google an und bestätige den Zugriff.');const r=await window.planer.google.connect();GSTATUS=r.status||GSTATUS;
  if(r.ok)toast('Mit Google verbunden','Termine, Tasks und Mails werden jetzt geladen.');else toast('Verbinden hat nicht geklappt',r.error||'');render()}
/* Terminerkennung in Mails (Regeln, keine KI). Ergebnis ist immer nur ein Vorschlag. */
const MONTHS={jän:1,jan:1,januar:1,jänner:1,feb:2,februar:2,mär:3,märz:3,maerz:3,apr:4,april:4,mai:5,jun:6,juni:6,jul:7,juli:7,aug:8,august:8,sep:9,sept:9,september:9,okt:10,oktober:10,nov:11,november:11,dez:12,dezember:12};
function findDateIn(text){const t=TODAY(),cands=[];let m;
  const re1=/\b(\d{1,2})\.\s?(\d{1,2})\.(\s?\d{4}|\s?\d{2}(?!\d|:|\.))?/g;
  while((m=re1.exec(text))){const d=+m[1],mo=+m[2];if(d<1||d>31||mo<1||mo>12)continue;let y=m[3]?+m[3].trim():t.getFullYear();if(y<100)y+=2000;let dt=new Date(y,mo-1,d);if(dt.getMonth()!==mo-1)continue;if(!m[3]&&dt<addDays(t,-1))dt=new Date(y+1,mo-1,d);cands.push({date:dt,index:m.index,match:m[0]})}
  const re2=/\b(\d{1,2})\.\s?(jänner|januar|jän|jan|februar|feb|märz|mär|maerz|april|apr|mai|juni|jun|juli|jul|august|aug|september|sept|sep|oktober|okt|november|nov|dezember|dez)\.?(\s+\d{4})?/gi;
  while((m=re2.exec(text))){const mo=MONTHS[m[2].toLowerCase()],d=+m[1];let y=m[3]?+m[3]:t.getFullYear();let dt=new Date(y,mo-1,d);if(!m[3]&&dt<addDays(t,-1))dt=new Date(y+1,mo-1,d);cands.push({date:dt,index:m.index,match:m[0]})}
  const re3=/\b(am\s+)?(nächsten?\s+)?(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\b/gi;
  while((m=re3.exec(text))){const wd=WDMAP[m[3].toLowerCase()];let o=(wd-t.getDay()+7)%7;if(o===0)o=7;cands.push({date:addDays(t,o),index:m.index,match:m[0],weak:true})}
  const re4=/\b(übermorgen|morgen)\b/gi;while((m=re4.exec(text))){cands.push({date:addDays(t,m[1].toLowerCase()==='morgen'?1:2),index:m.index,match:m[0],weak:true})}
  const strong=cands.filter(c=>!c.weak&&c.date>=t).sort((a,b)=>a.index-b.index);if(strong.length)return strong[0];
  const weak=cands.filter(c=>c.weak).sort((a,b)=>a.index-b.index);return weak[0]||null}
function findTimeNear(text,idx){const seg=text.slice(Math.max(0,idx-40),idx+140);let m;
  if((m=seg.match(/(?:zwischen|von)\s+(\d{1,2})[:.](\d{2})\s*(?:uhr)?\s*(?:und|bis|-|–)\s*(\d{1,2})[:.](\d{2})/i)))return {start:hm(m[1],m[2]),end:hm(m[3],m[4]),match:m[0]};
  if((m=seg.match(/\b(\d{1,2})[:.](\d{2})\s*(?:uhr)?\s*(?:-|–|bis)\s*(\d{1,2})[:.](\d{2})/i)))return {start:hm(m[1],m[2]),end:hm(m[3],m[4]),match:m[0]};
  if((m=seg.match(/\b(?:um\s+)?(\d{1,2})[:.](\d{2})\s*uhr/i))||(m=seg.match(/\bum\s+(\d{1,2})[:.](\d{2})\b/i)))return {start:hm(m[1],m[2]),match:m[0]};
  if((m=seg.match(/\bum\s+(\d{1,2})\s*uhr/i)))return {start:hm(m[1]),match:m[0]};
  if((m=seg.match(/\b(\d{1,2}):(\d{2})\b/)))return {start:hm(m[1],m[2]),match:m[0]};return null}
const cleanSubj=s=>String(s||'').replace(/^((re|aw|fw|fwd|wg)\s*:\s*)+/i,'').trim()||'Termin';
function detectSug(m){if(m.kind==='newsletter')return null;const t=TODAY(),sr=S.senders.find(sd=>(m.addr||'').toLowerCase().includes(sd.match));
  const uni=sr&&/uni/i.test(sr.label);
  if(m.ics&&m.ics.date){if(m.ics.date<iso(t))return null;const st=m.ics.start||'09:00';return {type:'event',title:m.ics.summary||cleanSubj(m.subject),date:m.ics.date,start:st,end:m.ics.end||addH(st,1),cal:uni?'uni':'privat',rule:'Kalendereinladung (.ics)',match:'',status:'open'}}
  const text=`${m.subject||''}\n${m.body||''}`.slice(0,4000),d=findDateIn(text);if(!d||d.date<t||diffDays(t,d.date)>240)return null;
  if(d.weak&&!sr&&m.kind!=='person')return null;
  const before=text.slice(Math.max(0,d.index-30),d.index),deadline=/\bbis\b|spätestens|frist|deadline|ablauf/i.test(before)&&/frist|deadline|spätestens|anmeld|abgabe|einreich|bewerb|zahl|bis/i.test(text);
  const tm=deadline?null:findTimeNear(text,d.index);if(tm&&tm.start){const end=tm.end&&toMin(tm.end)>toMin(tm.start)?tm.end:addH(tm.start,1);
    return {type:'event',title:cleanSubj(m.subject),date:iso(d.date),start:tm.start,end,cal:uni?'uni':'privat',rule:sr?`Absender-Regel „${sr.label}“ + Datum`:d.weak?'Wochentag + Uhrzeit im Text':'Datum + Uhrzeit im Text',match:d.match,status:'open'}}
  if(deadline||/frist|deadline|spätestens|anmeld|abgabe|einreich|bis zum/i.test(text)&&(sr||m.kind==='person'||/frist|deadline|anmeld|abgabe/i.test(text)))
    return {type:'task',title:cleanSubj(m.subject),date:iso(d.date),start:'23:59',list:uni?'Uni':'Privat',rule:sr?`Absender-Regel „${sr.label}“ + Frist`:'Frist im Text',match:d.match,status:'open'};
  return null}
function ensureSugs(){let ch=false;(S.mails||[]).forEach(m=>{if(m.sug===undefined){try{m.sug=detectSug(m)}catch(e){m.sug=null}ch=true}});if(ch)save();return ch}

