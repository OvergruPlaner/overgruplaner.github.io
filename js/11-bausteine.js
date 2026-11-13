/* ---------- Bausteine ---------- */
function dueChip(x){if(!x.due){if(!x.doOn||x.done)return '';return `<span class="due ${x.doOn<=iso(TODAY())?'today':''}">${x.doOn<=iso(TODAY())?'heute dran':'geplant '+fmtShort(parseISO(x.doOn))}</span>`}
  const n=diffDays(TODAY(),parseISO(x.due)),d=parseISO(x.due);
  if(x.done)return `<span class="due">Frist ${fmtShort(d)}</span>`;
  if(n<0)return `<span class="due over">Frist war ${fmtShort(d)}</span>`;
  return `<span class="due ${n<=1?'today':''}">${fristTxt(x)}</span>${todoNow(x)&&n>0?'<span class="tag nowtag">heute dran</span>':''}`}
function taskRow(x,{list=true,del=false}={}){
  return `<li class="task ${x.done?'done':''}"><button class="chk ${x.done?'on':''}" data-act="toggle-task" data-id="${x.id}" aria-label="${x.done?'Wieder öffnen':'Erledigt'}">${ic('check',13)}</button>
  <div class="t-main"><button type="button" class="t-title" data-act="edit-task" data-id="${x.id}" title="Bearbeiten oder verschieben">${esc(x.title)}</button><span class="t-meta">${dueChip(x)}${list&&x.list?`<span class="tag">${esc(x.list)}</span>`:''}</span></div>
  ${del?`<button class="del" data-act="del-task" data-id="${x.id}" aria-label="Löschen">${ic('trash',16)}</button>`:''}
  <button class="star ${x.important?'on':''}" data-act="star-task" data-id="${x.id}" aria-label="Wichtig" aria-pressed="${x.important}">${ic('star',16)}</button></li>`}
function sugWhen(s){const d=parseISO(s.date);return s.type==='event'?`${fmtShort(d)} · ${s.start}–${s.end}`:`Frist ${fmtShort(d)} · ${s.start}`}
function sugCard(m){const s=m.sug;return `<li class="sug"><div class="sug-main"><span class="sug-kind">${s.type==='event'?'Termin erkannt':'Frist erkannt → To-do'}</span><span class="sug-t">${esc(s.title)}</span><span class="sug-when">${sugWhen(s)}</span>
  <span class="sug-src">aus „${esc(m.subject)}“ · <span class="rule">${esc(s.rule)}</span></span></div>
  <div class="sug-act"><button class="btn sm primary" data-act="accept-sug" data-id="${m.id}">${s.type==='event'?'In Kalender':'Als To-do'}</button><button class="btn sm ghost" data-act="dismiss-sug" data-id="${m.id}">Verwerfen</button></div></li>`}
function mailRow(m,sel){const b=[];if(m.sug&&m.sug.status==='open')b.push(`<span class="pill badge-sug">${m.sug.type==='event'?'Termin erkannt':'Frist erkannt'}</span>`);
  if(m.kind==='newsletter')b.push('<span class="pill">Newsletter · ignoriert</span>');if(m.attach)b.push(`<span class="pill">${ic('clip',12)} ${esc(m.attach)}</span>`);
  return `<li><button class="mrow ${m.unread?'unread':''} ${sel?'sel':''}" data-act="open-mail" data-id="${m.id}"><span class="m-from">${esc(m.from)}</span><span class="m-time">${recvLabel(m)}</span><span class="m-subj">${esc(m.subject)}</span><span class="m-snip">${esc(snippet(m))}</span>${b.length?`<span class="m-badges">${b.join('')}</span>`:''}</button></li>`}
const upWho=u=>u.who?` · ${esc(u.who)}`:'';
const upSpan=u=>u.span>1?` · ${u.span} Tage`:'';
const upAct=u=>u.kind==='fam'?`<button class="link up-opt" data-act="ev-optin" data-id="${esc(u.evId)}">In meinen Tag</button>`:u.opted?`<button class="link up-opt" data-act="ev-info" data-id="${esc(u.evId)}">übernommen</button>`:'';
function upRow(it){const cls=it.kind==='ev'||it.kind==='fam'?'c-'+(it.cal||'privat'):{bday:'c-bday',hol:'c-hol',imp:'c-imp',task:'c-task',habit:'c-training'}[it.kind];
  return `<li class="up ${cls}"><span class="up-date"><b>${it.d.getDate()}</b>${MONS[it.d.getMonth()]}</span><div class="up-main"><span class="up-t">${esc(it.title)}${upWho(it)}</span>
  <span class="up-sub">${it.habit?'Habit · '+it.sub:it.kind==='fam'?`${inLabel(it.in)}${it.time?' · '+it.time:''}${upSpan(it)} · nur zur Info`:`${inLabel(it.in)}${it.time?' · '+it.time:''}${upSpan(it)}${it.sub?' · '+it.sub:''} · Hinweis ${it.lead} ${it.lead===1?'Tag':'Tage'} vorher`}</span>${upAct(it)}</div>
  ${it.notifyToday?`<span class="pill bell">${ic('bell',12)} heute gemeldet</span>`:it.active?'<span class="pill">läuft</span>':''}</li>`}
const habOrder=h=>{const s=habState(h);return s.open?0:s.done?1:2};
function habRow(h,ds){const on=!!h.log[ds],t=TODAY(),st=habState(h),si=streakInfo(h),f=freqOf(h);let vis='';
  if(f.type==='weekly')vis=`<div class="pips" title="${st.count} von ${st.n} diese Woche">${[...Array(st.n)].map((_,i)=>`<span class="pip ${i<st.count?'on':''}"></span>`).join('')}</div>`;
  else{for(let i=6;i>=0;i--){const d=addDays(t,-i);vis+=`<span class="dot ${h.log[iso(d)]?'on':''} ${scheduled(h,d)?'':'off'} ${i===0?'today':''}"></span>`}vis=`<div class="hab-week" aria-hidden="true">${vis}</div>`}
  return `<li class="hab ${!st.open&&!on?'rest':''}"><button class="hab-check ${on?'on':''}" data-act="toggle-habit" data-id="${h.id}" data-date="${ds}" aria-label="${esc(h.name)} heute ${on?'zurücksetzen':'abhaken'}" aria-pressed="${on}">${ic('check',16)}</button>
  <div class="hab-main"><span class="hab-name">${esc(h.name)}</span><span class="hab-detail">${si.lastMissed&&st.open&&si.n>0?`<b style="color:var(--warn);font-weight:500">${f.type==='weekly'?'Letzte Woche ausgelassen':'Gestern ausgelassen'}, heute zählt doppelt</b>`:esc(st.status||h.detail)}</span></div>${vis}
  <span class="streak ${si.n?'':'zero'}" title="Streak: ${si.n} ${si.unit}">${ic('flame',14)}${si.n}${f.type==='weekly'?'<small>W</small>':''}</span></li>`}

/* ---------- Seitenleiste ---------- */
function nextTrainLabel(){const dir=trainDir(),n=departures(dir,6).find(x=>!x.cx&&x.reach);return n?hhmm(n.act):''}
const importantMails=()=>S.mails.filter(m=>m.unread&&m.kind!=='newsletter'&&((m.sug&&m.sug.status==='open')||m.kind==='person'||S.senders.some(sd=>m.addr.includes(sd.match))));
function subCount(v){const ds=iso(TODAY());return {todos:nowTasks().length,lernen:studyOpenCount(),mail:importantMails().length,haushalt:dueChores().length,menschen:S.replies.length,finanzen:(S.fin&&+S.fin.income)?(finStatus()||{}).zahl||'':'',habits:S.habits.filter(h=>habState(h).open).length,zug:modeToday()==='bib'?nextTrainLabel():''}[v]||''}
function renderSide(){const g=GROUP[view]||view;
  const items=[['heute','sun','Heute',''],['planen','cal','Planen',importantMails().length?`<i class="dotb"></i>`:''],['leben','users','Leben',''],['einstellungen','gear','Einstellungen','']];
  return `<div class="brand"><span class="brand-mark">P</span><b>Planer</b></div>
  ${items.map(([v,i,l,c])=>`<button class="nav-btn" data-act="nav-group" data-g="${v}" ${g===v?'aria-current="page"':''}>${ic(i)}${l}${c?`<span class="count">${c}</span>`:''}</button>`).join('')}
  ${SUBS[g]?`<div class="side-subs">${SUBS[g].map(([v,i,l])=>{const c=subCount(v);return `<button class="nav-sub" data-act="nav" data-view="${v}" ${view===v?'aria-current="page"':''}>${l}${c!==''?`<span class="count">${c}</span>`:''}</button>`}).join('')}</div>`:''}
  <div class="side-foot"><button class="nav-btn" data-act="quick">${ic('bolt')}Schnelleingabe <span class="count"><kbd>${APP&&!WEB?(((SHORTCUTS.find(x=>x[0]===(APPCFG.shortcut||'Control+Alt+N'))||[])[1])||'Strg + Alt + N').replace(/ \+ /g,' '):WEB?'⌘ K':'Strg K'}</kbd></span></button>
  ${WEB?'':`<button class="nav-btn" data-act="widget">${ic('widget')}${APP?'Widget ein/aus':'Widget-Vorschau'}</button>`}
  <div class="sync"><i></i>${WEB?webSideText():APP?googleSideText():'Google · Beispieldaten'}</div></div>`}
function subTabs(g){return `<nav class="subtabs" aria-label="Bereich">${SUBS[g].map(([v,i,l])=>{const c=subCount(v);return `<button data-act="nav" data-view="${v}" ${view===v?'aria-current="page"':''}>${ic(i,15)} ${l}${c!==''?` <span class="count">${c}</span>`:''}</button>`}).join('')}</nav>`}
const banner=()=>APP?'':`<div class="demo-note"><b>Vorschau</b> mit Beispieldaten. Google-Sync, Windows-Benachrichtigungen und das echte Desktop-Widget kommen mit der Windows-App.</div>`;

