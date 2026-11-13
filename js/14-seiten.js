/* ---------- To-dos ---------- */
function renderTodos(){const ds=iso(TODAY()),t=TODAY();
  let pool=S.tasks.filter(x=>todoList==='alle'||(todoList==='wichtig'?x.important:x.list===todoList));
  const open=pool.filter(x=>!x.done),done=pool.filter(x=>x.done);
  const g={over:[],today:[],tom:[],week:[],later:[],none:[]};
  open.forEach(x=>{if(!x.due)return g.none.push(x);const n=diffDays(t,parseISO(x.due));(n<0?g.over:n===0?g.today:n===1?g.tom:n<7?g.week:g.later).push(x)});
  Object.values(g).forEach(a=>a.sort((a,b)=>(a.due||'').localeCompare(b.due||'')||b.important-a.important));
  const grp=(k,l)=>g[k].length?`<div class="group ${k}"><h3>${l} <span class="n">${g[k].length}</span></h3><ul class="tasks">${g[k].map(x=>taskRow(x,{list:todoList==='alle'||todoList==='wichtig',del:true})).join('')}</ul></div>`:'';
  const cnt=f=>S.tasks.filter(x=>!x.done&&f(x)).length;
  const lists=[['alle','Alle',cnt(()=>true)],['wichtig','Wichtig',cnt(x=>x.important)],...S.lists.map(l=>[l,l,cnt(x=>x.list===l)])];
  const defList=S.lists.includes(todoList)?todoList:'Privat';
  return `<div class="page-head"><div><p class="eyebrow">To-dos</p><h1>${todoList==='alle'?'Alle Aufgaben':todoList==='wichtig'?'Wichtig':esc(todoList)}</h1></div>
   <span class="src-note">${ic('check',14)} Synchronisiert mit Google Tasks. „Wichtig“ speichert die App zusätzlich lokal.</span></div>
  <div class="todo-wrap"><div class="lists">${lists.map(([k,l,c])=>`<button class="nav-btn" data-act="todo-list" data-list="${esc(k)}" ${todoList===k?'aria-current="page"':''}>${k==='wichtig'?ic('star',16):ic('list',16)}${esc(l)}<span class="count">${c}</span></button>`).join('')}</div>
  <section class="card"><form class="add-task" id="f-task"><label class="sr" for="nt-title">Aufgabe</label><input id="nt-title" name="title" type="text" placeholder="Neue Aufgabe …" autocomplete="off" required>
   <label class="sr" for="nt-due">Fällig</label><input id="nt-due" name="due" type="date" value="${ds}">
   <label class="sr" for="nt-list">Liste</label><select id="nt-list" name="list">${S.lists.map(l=>`<option ${l===defList?'selected':''}>${esc(l)}</option>`).join('')}</select>
   <label class="star-toggle"><input id="nt-imp" name="important" type="checkbox" ${todoList==='wichtig'?'checked':''}> wichtig</label><button class="btn primary">${ic('plus',16)} Hinzufügen</button></form>
   ${g.over.length?`<div class="group over"><h3>Liegengeblieben <span class="n">${g.over.length}</span><button class="link" style="margin-left:auto;text-transform:none;letter-spacing:0" data-act="triage">Neu sortieren</button></h3><ul class="tasks">${g.over.map(x=>taskRow(x,{list:true,del:true})).join('')}</ul></div>`:''}${grp('today','Heute')}${grp('tom','Morgen')}${grp('week','Diese Woche')}${grp('later','Später')}${grp('none','Ohne Datum')}
   ${!open.length?'<p class="empty" style="margin-top:12px">Keine offenen Aufgaben in dieser Liste.</p>':''}
   ${done.length?`<details class="donebox group"><summary>Erledigt (${done.length})</summary><ul class="tasks">${done.map(x=>taskRow(x,{del:true})).join('')}</ul></details>`:''}</section></div>`}

/* ---------- Habits ---------- */
function heatmap(h){const t=TODAY(),start=mondayOf(addDays(t,-7*52)),f=freqOf(h),wk=f.type==='weekly';let cells='',labels='';
  for(let w=0;w<53;w++){const mo=addDays(start,7*w);if(w===0||mo.getMonth()!==addDays(mo,-7).getMonth())labels+=`<span style="grid-column:${w+1}">${MONS[mo.getMonth()]}</span>`;
    for(let r=0;r<7;r++){const d=addDays(mo,r);if(d>t){cells+='<span class="hx fut"></span>';continue}const on=!!h.log[iso(d)];cells+=`<span class="hx ${on?'on':''} ${!on&&!scheduled(h,d)?'off':''}" title="${fmtShort(d)}${on?' ✓':''}"></span>`}
    if(wk){const c=weekCount(h,mo);cells+=`<span class="hx goal ${c>=f.n?'on':''}" title="KW ${isoWeek(mo)}: ${c}/${f.n}"></span>`}}
  return `<div class="heat-wrap"><div class="heat-months">${labels}</div><div class="heat ${wk?'wkly':''}">${cells}</div></div>${wk?'<p class="hint" style="margin-top:6px">Orange Linie unter einer Woche: Wochenziel geschafft.</p>':f.type==='days'?'<p class="hint" style="margin-top:6px">Blasse Felder sind freie Tage, die zählen nicht gegen den Streak.</p>':''}`}
function freqFields(f,pre){f=f||{type:'daily'};
  return `<div class="freq-row" data-freq><label class="sr" for="${pre}-ft">Häufigkeit</label><select id="${pre}-ft" name="ftype" data-freq-type>${[['daily','Täglich'],['weekly','X-mal pro Woche'],['days','An festen Wochentagen']].map(([k,l])=>`<option value="${k}" ${f.type===k?'selected':''}>${l}</option>`).join('')}</select>
   <span class="fr-n" ${f.type==='weekly'?'':'hidden'}><label class="sr" for="${pre}-fn">Wie oft pro Woche</label><input id="${pre}-fn" name="fn" type="number" min="1" max="7" value="${f.n||3}" style="width:64px"> × pro Woche, Tage egal</span>
   <span class="wdpick fr-d" ${f.type==='days'?'':'hidden'}>${WDORDER.map(d=>`<label><input type="checkbox" name="fd" value="${d}" ${(f.days||[1,3,5]).includes(d)?'checked':''}><span>${WD[d]}</span></label>`).join('')}</span></div>`}
function readFreq(fd){const t=fd.get('ftype');if(t==='weekly')return {type:'weekly',n:Math.max(1,Math.min(7,parseInt(fd.get('fn'),10)||3))};
  if(t==='days'){const days=fd.getAll('fd').map(Number);return days.length?{type:'days',days}:{type:'daily'}}return {type:'daily'}}
function renderHabits(){const t=TODAY(),ts=iso(t);
  const cards=S.habits.map(h=>{const f=freqOf(h),st=habState(h),si=streakInfo(h),q=quote(h);
    const days=f.type==='daily'?[...Array(7)].map((_,i)=>addDays(t,i-6)):[...Array(7)].map((_,i)=>addDays(mondayOf(t),i));
    const strip=days.map(d=>{const ds=iso(d),on=!!h.log[ds],fut=d>t,off=!scheduled(h,d);
      return `<button class="w7 ${on?'on':''} ${off?'off':''} ${ds===ts?'today':''} ${fut?'fut':''}" ${fut?'disabled':''} data-act="toggle-habit" data-id="${h.id}" data-date="${ds}" aria-pressed="${on}" aria-label="${esc(h.name)} ${fmtShort(d)}${off?' (frei)':''}"><span class="box">${ic('check',16)}</span>${ds===ts?'heute':WD[d.getDay()]}</button>`}).join('');
    const goal=f.type==='weekly'?`<div class="goal ${st.left===0?'met':''}"><div class="goal-bar"><i style="width:${Math.min(100,st.count/st.n*100)}%"></i></div><span>${st.left===0?'Ziel erreicht · ':''}${st.count}/${st.n} diese Woche</span></div>`:'';
    return `<article class="card"><div class="hc-head"><div><h2>${esc(h.name)}</h2><p>${esc(h.detail)} · <span class="tag">${esc(freqLabel(h))}</span></p></div>
      <div class="hc-btns"><button class="icon-btn" data-act="edit-habit" data-id="${h.id}" aria-label="${esc(h.name)} bearbeiten">${ic('gear',16)}</button><button class="icon-btn" data-act="del-habit" data-id="${h.id}" aria-label="${esc(h.name)} entfernen">${ic('trash',16)}</button></div></div>
     <div class="stats"><div class="stat fire"><b>${si.n}</b><span>${si.label}</span></div><div class="stat"><b>${bestInfo(h)}</b><span>Bestwert</span></div><div class="stat"><b>${q.v}</b><span>${q.l}</span></div></div>
     ${goal}<div class="week7">${strip}</div>${heatmap(h)}</article>`}).join('');
  return `<div class="page-head"><div><p class="eyebrow">Habits</p><h1>Dranbleiben</h1><p class="sub">Ein ausgelassener Tag bricht keinen Streak, erst zwei hintereinander. Tippe auf einen Tag, um ihn nachträglich abzuhaken.</p></div></div>
  <div class="hab-grid">${cards}</div>
  <section class="card"><div class="card-head"><h2>Neues Habit</h2></div><form class="add-hab" id="f-habit"><div class="frow"><label class="sr" for="nh-name">Name</label><input id="nh-name" name="name" type="text" placeholder="Name, z. B. Japanisch" required autocomplete="off"><label class="sr" for="nh-detail">Detail</label><input id="nh-detail" name="detail" type="text" placeholder="Detail, z. B. 15 min Renshuu" autocomplete="off"></div>
   ${freqFields(null,'nh')}<div><button class="btn primary">${ic('plus',16)} Anlegen</button></div></form></section>`}
function openHabitModal(id){const h=S.habits.find(x=>x.id===id);if(!h)return;
  overlay(`<form class="modal" id="f-habit-edit" data-id="${h.id}"><h2>Habit bearbeiten</h2>
   <label class="fl" for="eh-name">Name<input id="eh-name" name="name" type="text" value="${esc(h.name)}" required autocomplete="off"></label>
   <label class="fl" for="eh-detail">Detail<input id="eh-detail" name="detail" type="text" value="${esc(h.detail)}" autocomplete="off"></label>
   <div class="fl">Häufigkeit${freqFields(h.freq,'eh')}</div>
   <div class="modal-actions"><span class="sp"></span><button type="button" class="btn ghost" data-act="close-overlay">Abbrechen</button><button class="btn primary">Speichern</button></div>
   <p class="hint" style="margin:0">Dein bisheriger Verlauf bleibt erhalten, nur Streak und Quote werden neu berechnet.</p></form>`);$('#eh-name').focus()}
function openTaskModal(id){const x=S.tasks.find(t=>t.id===id);if(!x)return;const t=TODAY();
  const q=[['Heute',t],['Morgen',addDays(t,1)],['Nächster Montag',nextWd(t,1)],['In einer Woche',addDays(t,7)]];
  overlay(`<form class="modal" id="f-task-edit" data-id="${x.id}"><h2>To-do bearbeiten</h2>
   <label class="fl" for="te-title">Titel<input id="te-title" name="title" type="text" value="${esc(x.title)}" required autocomplete="off"></label>
   <div class="frow" style="--n:3"><label class="fl" for="te-due">Frist (spätestens)<input id="te-due" name="due" type="date" value="${x.due||''}"></label>
    <label class="fl" for="te-do">Erledigen am<input id="te-do" name="doOn" type="date" value="${x.doOn||''}" ${x.due?`max="${x.due}"`:''}></label>
    <label class="fl" for="te-list">Liste<select id="te-list" name="list">${S.lists.map(l=>`<option ${l===x.list?'selected':''}>${esc(l)}</option>`).join('')}</select></label></div>
   <label class="fl" for="te-mins" style="max-width:220px">Dauer im Tagesplan (min)<input id="te-mins" name="mins" type="number" min="5" max="480" step="5" value="${x.mins||15}"></label>
   <p class="hint" style="margin:0">„Erledigen am“ leer lassen: Das To-do kommt automatisch ${x.important?'2 Tage':'1 Tag'} vor der Frist in deinen Tag${x.due?` (also ${fmtLong(parseISO(doDate({...x,doOn:null})))})`:''}. Bei „wichtig“ 2 Tage vorher.</p>
   <div class="q-dates">${q.map(([l,d])=>`<button type="button" class="chip ${x.due===iso(d)?'on':''}" data-act="set-due" data-date="${iso(d)}">${l} <span class="mono">${fmtShort(d)}</span></button>`).join('')}<button type="button" class="chip ${!x.due?'on':''}" data-act="set-due" data-date="">Ohne Datum</button></div>
   <label class="check-l"><input id="te-imp" name="important" type="checkbox" ${x.important?'checked':''}> wichtig</label>
   <div class="modal-actions"><button type="button" class="btn ghost danger" data-act="del-task" data-id="${x.id}">${ic('trash',16)} Löschen</button><span class="sp"></span><button type="button" class="btn ghost" data-act="close-overlay">Abbrechen</button><button class="btn primary">Speichern</button></div>
   <p class="hint" style="margin:0">Im Kalender kannst du To-dos auch direkt auf einen anderen Tag ziehen.</p></form>`);$('#te-title').focus()}

/* ---------- Posteingang ---------- */
function renderMail(){let list=S.mails;if(mailFilter==='ungelesen')list=list.filter(m=>m.unread);if(mailFilter==='vorschlag')list=list.filter(m=>m.sug&&m.sug.status==='open');
  const m=S.mails.find(x=>x.id===mailSel)||null;
  let read='<p class="empty">Wähle eine Mail aus.</p>';
  if(m){let body=esc(m.body);if(m.sug&&m.sug.match)body=body.replace(esc(m.sug.match),`<mark>${esc(m.sug.match)}</mark>`);body=body.replace(/\n/g,'<br>');
    const s=m.sug;let top='';
    if(m.kind==='newsletter')top='<div class="ignored">Als Newsletter erkannt. Daraus werden keine Termine vorgeschlagen.</div>';
    else if(s&&s.status==='open')top=`<ul class="read-sug">${sugCard(m)}</ul>`;
    else if(s&&s.status==='accepted')top=`<div class="ignored">${ic('check',14)} Übernommen: ${esc(s.title)}, ${sugWhen(s)}</div>`;
    else if(s&&s.status==='dismissed')top='<div class="ignored">Vorschlag verworfen.</div>';
    read=`${top}<div class="read-head"><h2>${esc(m.subject)}</h2><span class="read-from"><b>${esc(m.from)}</b> &lt;${esc(m.addr)}&gt; · ${recvLabel(m)}</span></div><div class="read-body">${body}</div>
     ${m.attach?`<span class="attach">${ic('clip',14)} ${esc(m.attach)}</span>`:''}
     <p class="hint"><a class="link" href="${m.threadId?`https://mail.google.com/mail/u/0/#inbox/${m.threadId}`:'https://mail.google.com/'}" target="_blank" rel="noopener">In Gmail öffnen ${ic('ext',12).replace('class="ic"','class="ic" style="display:inline;vertical-align:-1px"')}</a> · Antworten läuft weiter über Gmail.</p>`}
  const unread=S.mails.filter(x=>x.unread).length;
  return `<div class="page-head"><div><p class="eyebrow">Gmail · nur Lesezugriff</p><h1>Posteingang</h1><p class="sub">${APP&&!S.mails.length?'Gmail wird im nächsten Schritt verbunden.':`${unread} ungelesen, ${openSugs().length} Terminvorschläge`}</p></div></div>
  <div class="mail-wrap"><section class="card"><div class="filters">${[['alle','Alle'],['ungelesen','Ungelesen'],['vorschlag','Mit Vorschlag']].map(([k,l])=>`<button class="chip ${mailFilter===k?'on':''}" data-act="mail-filter" data-f="${k}" aria-pressed="${mailFilter===k}">${l}</button>`).join('')}</div>
   ${list.length?`<ul class="mails">${list.map(x=>mailRow(x,x.id===mailSel)).join('')}</ul>`:'<p class="empty">Keine Mails in diesem Filter.</p>'}</section>
  <section class="card">${read}<div class="rules-note">Aktive Regeln: Kalendereinladungen (.ics), Datum oder Wochentag mit Uhrzeit im Text, Absender-Regeln (${S.senders.map(s=>esc(s.label)).join(', ')}). Newsletter werden übersprungen.</div></section></div>`}

/* ---------- Einstellungen ---------- */
function renderSettings(){const L=S.settings.lead;
  const lr=(k,l,d)=>`<div class="lead-row"><label for="ld-${k}">${l}<br><small>${d}</small></label><input id="ld-${k}" type="number" min="0" max="60" value="${L[k]}" data-lead="${k}"><small>Tage vorher</small></div>`;
  return `<div class="page-head"><div><p class="eyebrow">Einstellungen</p><h1>Erinnerungen und Regeln</h1></div></div>
  <div class="set-grid">
   ${APP?googleCard():''}
   ${APP&&(S.gcalendars||[]).length>1?calendarsCard():''}
   <section class="card"><div class="card-head"><h2>Benachrichtigungen</h2><span class="meta">wenig, aber wichtig</span></div>
    ${[['briefing','Morgen-Briefing','ein Satz zum Tag, statt vieler Einzelmeldungen'],...(WEB?[]:[['zug','Zug','wenn du losmusst, und bei Störungen']]),['wind','Runterfahren','zur Runterfahr-Zeit'],['bday','Geburtstage und wichtige Termine','mit Vorlaufzeit'],['study','Lernplan','nur wenn der Puffer schrumpft'],['watcher','Wächter','bei Zeitfressern'],['other','Alles andere','Mails, To-dos, Habits einzeln']].map(([k,l,dsc])=>`<label class="sw-row" for="nt-${k}"><span>${l}<small>${dsc}</small></span><input type="checkbox" id="nt-${k}" data-notif="${k}" ${S.notif[k]?'checked':''}></label>`).join('')}
    <div class="lead-row"><label for="nt-qs">Ruhezeit</label><input id="nt-qs" type="time" value="${S.notif.quiet.start}" data-notif="quiet.start"><input id="nt-qe" type="time" value="${S.notif.quiet.end}" data-notif="quiet.end" aria-label="Ruhezeit Ende"></div>
    <div class="lead-row"><label for="nt-max">Höchstens pro Tag</label><input id="nt-max" type="number" min="1" max="20" value="${S.notif.max}" data-notif="max"><small>Meldungen</small></div>
    <p class="hint">Was übers Limit geht, landet gesammelt im nächsten Briefing statt als einzelne Meldung.</p></section>
   <section class="card"><div class="card-head"><h2>Wächter</h2><span class="meta">Reibung gegen Zeitfresser</span></div>
    <label class="sw-row" for="wa-on"><span>Wächter an<small>fragt nach, sperrt nichts</small></span><input type="checkbox" id="wa-on" data-watch="on" ${S.watch.on?'checked':''}></label>
    <div class="lead-row"><label for="wa-after">Nachfragen nach</label><input id="wa-after" type="number" min="5" max="120" step="5" value="${S.watch.after}" data-watch="after"><small>min am Stück</small></div>
    <div class="snips" style="margin:8px 0">${S.watch.sites.map((x,i)=>`<span class="chip on">${esc(x)} <button class="link" data-act="watch-site-del" data-i="${i}" aria-label="${esc(x)} entfernen">×</button></span>`).join('')}</div>
    <form id="f-watch" class="inline-add"><label class="sr" for="wa-site">Seite oder Programm</label><input id="wa-site" name="site" type="text" placeholder="Seite oder Programm, z. B. Reddit" autocomplete="off"><button class="btn">${ic('plus',16)}</button></form>
    <p class="hint">Im Freizeit-Slot bleibt er still. Nach „Noch 10/20 min“ fragt er wieder, beim zweiten Mal mit 5 Sekunden Bedenkzeit.</p>
    <button class="btn" data-act="watch-demo" style="margin-top:8px">${ic('bolt',16)} Wächter ausprobieren</button></section>
   <section class="card"><div class="card-head"><h2>Vorlaufzeiten</h2></div>${lr('bday','Geburtstage','aus Google Kontakte')}${lr('exam','Prüfungen','Termine mit „Prüfung“ im Titel')}${lr('important','Wichtige Termine und Fristen','mit Stern markiert')}${lr('normal','Normale Termine, Feiertage','Hinweis am Vortag')}
    <p class="hint">In der App kommt der Hinweis als Windows-Benachrichtigung. War der PC aus, wird er beim Hochfahren nachgeholt.</p><button class="btn" data-act="test-toast" style="margin-top:10px">${ic('bell',16)} Benachrichtigung testen</button></section>
   <section class="card"><div class="card-head"><h2>Tagesrhythmus</h2><span class="meta">für Jetzt-Karte und Abend</span></div>
    <div class="lead-row"><label for="ry-wake">Aufstehen</label><input id="ry-wake" type="time" value="${S.rhythm.wake}" data-rhy="wake"><small></small></div>
    <div class="lead-row"><label for="ry-sleep">Schlaf, den du brauchst</label><input id="ry-sleep" type="number" min="5" max="11" step="0.5" value="${S.rhythm.sleep}" data-rhy="sleep"><small>Stunden</small></div>
    <div class="lead-row"><label for="ry-wind">Runterfahren vorher</label><input id="ry-wind" type="number" min="0" max="120" step="5" value="${S.rhythm.wind}" data-rhy="wind"><small>min</small></div>
    <div class="lead-row"><label for="ry-sport">Training um</label><input id="ry-sport" type="time" value="${S.rhythm.sport}" data-rhy="sport"><input id="ry-smin" type="number" min="15" max="240" step="5" value="${S.rhythm.sportMin}" data-rhy="sportMin" aria-label="Dauer Training in Minuten" title="Dauer in Minuten"></div>
    <div class="lead-row"><label for="ry-lunch">Kochen und Essen<br><small>flexibel, ungefähr um</small></label><input id="ry-lunch" type="time" value="${S.rhythm.lunch}" data-rhy="lunch"><input id="ry-lmin" type="number" min="15" max="180" step="5" value="${S.rhythm.lunchMin}" data-rhy="lunchMin" aria-label="Dauer Essen in Minuten" title="Dauer in Minuten"></div>
    <div class="lead-row"><label for="ry-bib">Weg ${ortB()} → Bib</label><input id="ry-bib" type="number" min="0" max="90" step="5" value="${S.rhythm.bibWay}" data-rhy="bibWay"><small>min</small></div>
    <div class="lead-row"><label for="ry-rs"><input type="checkbox" id="ry-on" data-rhy="reward.on" ${S.rhythm.reward.on?'checked':''}> Freizeit-Slot<br><small>als Belohnung nach dem Lernen</small></label><input id="ry-rs" type="time" value="${S.rhythm.reward.start}" data-rhy="reward.start"><input id="ry-re" type="time" value="${S.rhythm.reward.end}" data-rhy="reward.end" aria-label="Ende"></div>
    <p class="hint">Daraus folgt: <b id="ry-sum">Runterfahren ${fromM(windMin())}, Licht aus ${fromM(bedMin())}</b>. Zum Runterfahren kommt eine Benachrichtigung.</p></section>
   ${WEB?'':`<section class="card"><div class="card-head"><h2>Zug</h2><span class="meta">${ortA()} ↔ ${ortB()}</span></div>
    <div class="lead-row"><label for="wk-w">Fußweg zum Bahnhof ${ortA()}</label><input id="wk-w" type="number" min="0" max="60" value="${S.settings.walk.w}" data-walk="w"><small>min</small></div>
    <div class="lead-row"><label for="wk-p">Fußweg zum ${ortB()}</label><input id="wk-p" type="number" min="0" max="60" value="${S.settings.walk.p}" data-walk="p"><small>min</small></div>
    <p class="hint">Daraus rechnet die Karte „Los in … min“ und graut Züge aus, die du nicht mehr erreichst. Vor 14 Uhr zeigt sie automatisch Richtung ${ortB()}, danach Richtung ${ortA()}.</p></section>`}
   <section class="card"><div class="card-head"><h2>Absender-Regeln</h2><span class="meta">Mails von hier werden genauer geprüft</span></div>
    <ul>${S.senders.map((s,i)=>`<li class="sender"><span>${esc(s.label)} · <code>${esc(s.match)}</code></span><button class="link" data-act="sender-del" data-i="${i}">Entfernen</button></li>`).join('')}</ul>
    <form class="inline-add" id="f-sender"><label class="sr" for="sd-label">Bezeichnung</label><input id="sd-label" name="label" type="text" placeholder="Name, z. B. Fitnessstudio" required autocomplete="off"><label class="sr" for="sd-match">Adresse enthält</label><input id="sd-match" name="match" type="text" placeholder="Adresse enthält …" required autocomplete="off"><button class="btn">${ic('plus',16)}</button></form></section>
   ${APP?'':`<section class="card"><div class="card-head"><h2>Verbindungen</h2><span class="meta">ein Google-Login</span></div>
    ${[['Google Kalender','lesen + schreiben'],['Google Tasks','lesen + schreiben'],['Google Kontakte','Geburtstage lesen'],['Gmail','nur lesen']].map(([a,b])=>`<div class="conn"><span>${a}</span><span>${b}</span></div>`).join('')}
    <p class="hint">In der Vorschau sind das Beispieldaten. Die echte Anmeldung passiert in der Windows-App.</p></section>`}
   <section class="card"><div class="card-head"><h2>Schnelleingabe</h2><span class="meta">${shortcutLabel()} · überall</span></div><p class="hint" style="margin-top:0">Ein Feld für alles: Termine, To-dos, Menschen, Geburtstage, Dump, Abhaken, Lernstand.</p><button class="btn" data-act="legend" style="margin-top:8px">Legende anzeigen</button></section>
   ${WEB?webSettingsCard():APP?appSettingsCard():`<section class="card"><div class="card-head"><h2>Vorschau</h2></div><p class="hint" style="margin-top:0">Deine Änderungen hier bleiben nur in diesem Browser gespeichert.</p><button class="btn danger" data-act="reset" style="margin-top:10px">Beispieldaten zurücksetzen</button></section>`}
  </div>`}

