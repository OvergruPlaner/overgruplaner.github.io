/* ---------- Heute ---------- */
let H={};
function heuteData(){const t=TODAY(),ds=iso(t),now=new Date();
  H={t,ds,nm:now.getHours()*60+now.getMinutes(),evs:eventsOn(ds,true),ad:allDayOn(ds,true),
   tasks:S.tasks.filter(x=>todoNow(x)||todoOver(x)).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')||b.important-a.important),
   doneT:S.tasks.filter(x=>x.done&&x.doneAt===ds),sugs:openSugs(),ups:upcoming(30).filter(u=>!u.habit&&(!['ev','fam','task'].includes(u.kind)||u.in<=7)).slice(0,8)}}
const CARDS={
 termine:{name:'Termine heute',render(){const {evs,ad,nm,t}=H,tm=addDays(t,1),tmEv=eventsOn(iso(tm),true),tmAd=allDayOn(iso(tm),true);
   const list=(ad.length||evs.length)?`<ul class="evlist">${ad.map(x=>`<li class="ev-row c-${x.cal}"><span class="ev-time">ganzt.</span><span class="ev-bar"></span><span class="ev-main"><span class="ev-t">${esc(x.title)}</span></span></li>`).join('')}
    ${evs.map(e=>{const past=toMin(e.end)<=nm,live=!past&&toMin(e.start)<=nm;return `<li><button class="ev-row c-${e.cal} ${past?'past':''}" data-act="edit-event" data-id="${e.id}"><span class="ev-time">${e.start}<small>${e.end}</small></span><span class="ev-bar"></span><span class="ev-main"><span class="ev-t">${esc(e.title)}</span><span class="ev-sub">${CAL[e.cal].name}${live?' · <b class="live">läuft gerade</b>':''}</span></span></button></li>`}).join('')}</ul>`:'<p class="empty">Heute keine Termine.</p>';
   return `<section class="card"><div class="card-head"><h2>Termine heute</h2><button class="link" data-act="nav" data-view="kalender">Kalender</button></div>${list}
    <div class="tomorrow"><span class="lbl">Morgen</span>${tmAd.map(x=>`<span class="adp c-${x.cal}">${esc(x.title)}</span>`).join('')}${tmEv.length?tmEv.map(e=>`<span><span class="mono">${e.start}</span> ${esc(e.title)}</span>`).join('<span>·</span>'):'<span>keine Termine</span>'}</div></section>`}},
 todos:{name:'To-dos',render(){const {tasks,doneT,ds}=H,td=tasks.filter(todoNow),ov=tasks.filter(todoOver);return `<section class="card"><div class="card-head"><h2>To-dos heute</h2><span class="meta">${doneT.length?`${doneT.length} erledigt`:''}</span></div>
   ${td.length?`<ul class="tasks">${td.map(x=>taskRow(x)).join('')}</ul>`:'<p class="empty">Für heute nichts mehr offen.</p>'}
   ${ov.length?`<button class="lieg" data-act="triage"><span>${ov.length} liegengeblieben</span><span class="link">Neu sortieren</span></button>`:''}
   <form class="inline-add" id="f-today-task"><label class="sr" for="tt-in">Neues To-do für heute</label><input id="tt-in" name="title" type="text" placeholder="To-do, z. B. Bericht Mi" autocomplete="off"><button class="btn" aria-label="Hinzufügen">${ic('plus',16)}</button></form></section>`}},
 tag:{name:'Tagesablauf',render(){const R=S.rhythm,m=modeToday();
   return `<section class="card"><div class="card-head"><h2>Tagesablauf</h2><button class="link" data-act="nav" data-view="einstellungen">Zeiten</button></div>
    <h3 class="sub-h">Morgen</h3><ul class="rts">${rtRows('morning')}</ul>
    <ol class="dayline"><li><span class="mono">${R.wake}</span>Aufstehen</li><li><span class="mono">tagsüber</span>${m==='bib'?'Bib':m==='home'?'Daheim lernen':'Lernen'}</li><li><span class="mono">${R.sport}</span>Sport</li>${R.reward.on?`<li><span class="mono">${R.reward.start}</span>${esc(R.reward.label)}</li>`:''}<li><span class="mono">${fromM(windMin())}</span>Runterfahren</li><li><span class="mono">${fromM(bedMin())}</span>Licht aus</li></ol>
    <h3 class="sub-h">Abend</h3><ul class="rts">${rtRows('evening')}</ul></section>`}},
 haushalt:{name:'Haushalt',render(){const d=dueChores(),soon=S.chores.filter(c=>{const s=choreState(c);return !s.due&&s.soon}),trash=S.chores.find(c=>c.rhythm==='needed'&&!c.flagged);
   return `<section class="card"><div class="card-head"><h2>Haushalt</h2><button class="link" data-act="chores-edit">Bearbeiten</button></div>
    ${d.length?`<ul class="rts">${d.map(c=>{const st=choreState(c);return `<li><button class="rt" data-act="chore-done" data-id="${c.id}"><span class="chk">${ic('check',11)}</span><span class="rt-t">${esc(c.name)}</span><span class="rt-m ${st.late?'late':''}">${st.label} · ${c.mins} min</span></button></li>`}).join('')}</ul>
     <button class="btn" style="margin-top:10px" data-act="sprint">${ic('bolt',16)} 10-Minuten-Sprint</button>`:'<p class="empty">Alles im Griff. Nichts fällig.</p>'}
    ${soon.length?`<p class="hint">${soon.map(c=>`${esc(c.name)} ${choreState(c).label}`).join(' · ')}</p>`:''}
    ${trash?`<p class="hint"><button class="link" data-act="chore-flag" data-id="${trash.id}">${esc(trash.name.replace(' runtertragen',''))} ist voll</button> · tippen, wenn’s ansteht</p>`:''}</section>`}},
 menschen:{name:'Menschen',render(){const od=overduePeople(),rs=S.replies.slice().sort((a,b)=>a.added.localeCompare(b.added));
   return `<section class="card"><div class="card-head"><h2>Menschen</h2><button class="link" data-act="nav" data-view="menschen">Alle</button></div>
    <h3 class="sub-h">Antwort schuldig ${rs.length?`<span class="mono">${rs.length}</span>`:''}</h3>
    ${rs.length?`<ul class="rps">${rs.slice(0,4).map(r=>replyRow(r,false)).join('')}</ul>${rs.length>4?`<p class="hint">+${rs.length-4} weitere</p>`:''}`:'<p class="empty">Alles beantwortet.</p>'}
    <form class="inline-add" id="f-reply"><label class="sr" for="rp-in">Wem schuldest du eine Antwort?</label><input id="rp-in" name="who" type="text" placeholder="z. B. Lisa Sprachnachricht" autocomplete="off"><button class="btn" aria-label="Hinzufügen">${ic('plus',16)}</button></form>
    ${od.length?`<h3 class="sub-h" style="margin-top:14px">Mal wieder melden</h3><ul class="rts">${od.map(p=>`<li><button class="rt" data-act="person-done" data-id="${p.id}"><span class="chk">${ic('check',11)}</span><span class="rt-t"><b>${esc(p.name)}</b></span><span class="rt-m">zuletzt vor ${diffDays(parseISO(p.last),TODAY())} Tagen</span></button></li>`).join('')}</ul>`:''}</section>`}},
 lernen:{name:'Lernen heute',render(){const ex=activeExams();return `<section class="card"><div class="card-head"><h2>Lernen heute</h2><button class="link" data-act="nav" data-view="lernen">Lernplan</button></div>
   ${ex.length?`<div class="studies">${ex.map(x=>studyToday(x)).join('')}</div>`:'<p class="empty">Keine Prüfung geplant.</p>'}</section>`}},
 zug:{name:'Zug',render:()=>modeToday()==='home'?`<section class="card" id="train-card"><div class="card-head"><h2>Zug</h2><button class="link" data-act="day-mode" data-m="bib">Doch in die Bib</button></div><p class="empty" style="padding:0">Heute daheim, Zug ausgeblendet.</p></section>`:renderTrainCard()},
 habits:{name:'Habits',render(){return `<section class="card"><div class="card-head"><h2>Habits</h2><button class="link" data-act="nav" data-view="habits">Verlauf</button></div><ul class="habs">${[...S.habits].sort((a,b)=>habOrder(a)-habOrder(b)).map(h=>habRow(h,H.ds)).join('')}</ul></section>`}},
 demnaechst:{name:'Demnächst',render(){const {ups}=H;return `<section class="card"><div class="card-head"><h2>Demnächst</h2><span class="meta">nächste 30 Tage</span></div>${ups.length?`<ul class="ups">${ups.map(upRow).join('')}</ul>`:'<p class="empty">Nichts Besonderes in Sicht.</p>'}</section>`}},
 mails:{name:'Aus deinen Mails',render(){const {sugs}=H;return `<section class="card"><div class="card-head"><h2>Aus deinen Mails</h2><span class="meta">${sugs.length} Vorschläge</span></div>${sugs.length?`<ul class="sugs">${sugs.map(sugCard).join('')}</ul>`:'<p class="empty">Keine offenen Vorschläge.</p>'}
   <p class="hint">Erkannt per Regel, eingetragen wird nur, was du bestätigst.</p></section>`}},
 inbox:{name:'Posteingang',render(){return `<section class="card"><div class="card-head"><h2>Posteingang</h2><button class="link" data-act="nav" data-view="mail">Alle Mails</button></div><ul class="mails">${S.mails.slice(0,5).map(m=>mailRow(m)).join('')}</ul></section>`}}
};
function cardWrap(id){if(WEB&&id==='zug')return '';return `<div class="dcard" data-card="${id}">${dashEdit?`<div class="dc-bar"><span class="drag-h" title="Ziehen zum Verschieben">${ic('grip',16)}</span><b>${CARDS[id].name}</b><button class="link" data-act="card-hide" data-card="${id}">Ausblenden</button></div>`:''}${CARDS[id].render()}</div>`}
function renderHeute(){heuteData();const {t,evs,tasks}=H,hr=new Date().getHours(),L=layout();
  const habOpen=S.habits.filter(h=>habState(h).open).length;
  const greet=hr<11?'Guten Morgen':hr<18?'Hallo':'Guten Abend';
  return `<div class="page-head"><div><p class="eyebrow">${WDL[t.getDay()]} · KW ${isoWeek(t)}</p><h1>${t.getDate()}. ${MON[t.getMonth()]}</h1>
   <p class="sub">${greet}${anrede()}. ${evs.length} ${evs.length===1?'Termin':'Termine'}, ${tasks.length} To-dos, ${habOpen} ${habOpen===1?'Habit':'Habits'} offen.</p></div>
   <div class="head-actions">${dashEdit?'':modeSeg()}
    <button class="btn ${dashEdit?'primary':''}" data-act="dash-edit">${ic(dashEdit?'check':'layout',16)} ${dashEdit?'Fertig':'Anpassen'}</button></div></div>
  ${dashEdit?`<div class="edit-bar"><span>Zieh die Karten am Griff ${ic('grip',14).replace('class="ic"','class="ic" style="display:inline;vertical-align:-2px"')} an einen neuen Platz, die anderen rücken automatisch nach. Leere Spalten nehmen auch Karten auf.</span>
    <div class="edit-actions">${L.hidden.length?`<span class="eb-l">Ausgeblendet:</span>${L.hidden.filter(id=>!(WEB&&id==='zug')).map(id=>`<button class="chip" data-act="card-show" data-card="${id}">${ic('plus',12).replace('class="ic"','class="ic" style="display:inline;vertical-align:-1px"')} ${CARDS[id].name}</button>`).join('')}`:''}<button class="link" data-act="dash-reset">Standard wiederherstellen</button></div></div>`:''}
  ${dashEdit?'':gBanner()+renderNow()}
  <div class="dash ${dashEdit?'editing':''}" id="dash">${L.cols.map((c,i)=>`<div class="col" data-col="${i}">${c.map(cardWrap).join('')}</div>`).join('')}</div>`}
/* Während gezogen wird, nichts neu zeichnen (Sync/Zug/Timer würden sonst die Liste unterm Finger austauschen → Klon bleibt hängen). */
let DRAG=false,dragPending=false;
function mkSort(el,o){return Sortable.create(el,{...o,onStart(e){DRAG=true;o.onStart&&o.onStart(e)},onEnd(e){DRAG=false;try{o.onEnd&&o.onEnd(e)}finally{if(dragPending){dragPending=false;refresh()}}}})}
window.addEventListener('pointerup',()=>{if(DRAG)setTimeout(()=>{if(DRAG&&!document.querySelector('.sortable-fallback')){DRAG=false;if(dragPending){dragPending=false;refresh()}}},400)});
function initSortable(){sortables.forEach(x=>x.destroy());sortables=[];document.querySelectorAll('body>.sortable-fallback').forEach(n=>n.remove());
  if(view==='heute'&&S.settings.heuteMode!=='ueberblick'){const pl=$('#plan-list'),po=$('#todo-pool');if(pl&&window.Sortable){
    sortables.push(mkSort(pl,{group:{name:'plan',put:['pool']},draggable:'.pl-flex,.pool-it',handle:'.drag-h',animation:160,forceFallback:true,fallbackOnBody:true,ghostClass:'dc-ghost',
      onEnd(e){const P=planDay(),dp=dpState(),keys=[...new Set([...pl.querySelectorAll('.pl-flex')].map(li=>li.dataset.k))];dp.order=keys;
        // hinter einen fixen Block gezogen (z. B. nach dem Zug) → frühestens ab dessen Ende (dp.nb), hinter etwas mit nb → dessen nb übernehmen
        const it=e.item,k=it&&it.dataset.k;let pv=it&&it.previousElementSibling;while(pv&&pv.classList.contains('tl-gap'))pv=pv.previousElementSibling;
        dp.manual=true;dp.pin=dp.pin||{};if(k)dp.pin[k]=true;dp.nb=dp.nb||{};const pf=pv&&pv.classList.contains('fixed')?P.fixed.find(f=>f.k===pv.dataset.k):null;
        // hinter einen Anker (Essen) gezogen → wie hinter einen Termin: frühestens ab dessen Ende
        const pa=!pf&&pv&&pv.dataset.k&&P.anchors.includes(pv.dataset.k)?P.placed.filter(z=>z.k===pv.dataset.k).pop():null,after=pf?pf.e:pa?pa.e:pv&&pv.dataset.k&&dp.nb[pv.dataset.k]||0;
        const me=P.placed.find(z=>z.k===k&&z.essential);if(me){const i=keys.indexOf(k),prev=i>0?P.placed.filter(z=>z.k===keys[i-1]).pop():null;dp.essAt=dp.essAt||{};dp.essAt[k]=Math.max(prev?prev.e:nowMin(),after)}
        else if(k){if(after>nowMin())dp.nb[k]=after;else delete dp.nb[k];anchorsBehind(k,P.anchors.filter(a=>keys.indexOf(a)>keys.indexOf(k)))} // über das Essen gezogen → Essen rückt dahinter
        save();render()},
      onAdd(e){const id=e.item.dataset.task,ord=[...new Set([...pl.children].map(li=>li===e.item?'t:'+id:li.classList.contains('pl-flex')?li.dataset.k:null).filter(Boolean))];e.item.remove();planTask(id,ord)}}));
    if(po)sortables.push(mkSort(po,{group:{name:'pool',pull:'clone',put:false},sort:false,draggable:'.pool-it',handle:'.drag-h',animation:160,forceFallback:true,fallbackOnBody:true,ghostClass:'dc-ghost'}))}return}
  if(!dashEdit||view!=='heute')return;
  if(!window.Sortable){toast('Ziehen nicht verfügbar','Die Bibliothek fürs Verschieben wurde nicht geladen. Lade die Seite neu.');return}
  document.querySelectorAll('#dash .col').forEach(col=>sortables.push(mkSort(col,{group:'dash',handle:'.drag-h',draggable:'.dcard',animation:180,easing:'cubic-bezier(.2,.7,.3,1)',
    ghostClass:'dc-ghost',chosenClass:'dc-chosen',dragClass:'dc-drag',forceFallback:true,fallbackOnBody:true,
    onEnd(){S.layout.cols=[...document.querySelectorAll('#dash .col')].map(c=>[...c.querySelectorAll(':scope > .dcard')].map(d=>d.dataset.card));save()}})))}

