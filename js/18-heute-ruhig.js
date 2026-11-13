/* ---------- Heute: ruhige Ansicht ---------- */
const modeSeg=()=>`<div class="seg" role="group" aria-label="Ansicht"><button data-act="heute-mode" data-m="ruhig" aria-pressed="${S.settings.heuteMode!=='ueberblick'}">Tag</button><button data-act="heute-mode" data-m="ueberblick" aria-pressed="${S.settings.heuteMode==='ueberblick'}">Überblick</button></div>`;
let tlOpen=new Set(),tlInit=false,showDone=false;
function dayItems(){const nm=nowMin(),ds=iso(TODAY()),R=S.rhythm,wake=toMin(R.wake),it=[];
  const add=o=>it.push(o);
  const mDone=S.routines.morning.every(i=>rtDone('morning',i)),mCnt=S.routines.morning.filter(i=>rtDone('morning',i)).length;
  add({k:'morning',t:wake,title:'Morgenroutine',sub:mDone?'erledigt':`${mCnt} von ${S.routines.morning.length}`,cls:'c-privat',done:mDone,body:`<ul class="rts">${rtRows('morning')}</ul>`});
  if(modeToday()==='bib'&&nm<toMin('14:00')){const n=departures('w2p',6).find(x=>!x.cx&&x.reach);if(n){const lv=toMin(hhmm(n.act))-S.settings.walk.w;
    add({k:'zug',t:lv,title:`Losgehen zum Zug`,sub:`${n.line} ${hhmm(n.act)}${n.delay?` (+${n.delay})`:''} → ${ortB()} an ${hhmm(n.arr)}`,cls:'c-uni',done:false,act:WEB?null:{a:'nav',view:'zug',txt:'Abfahrten'}})}}
  activeExams().forEach((x,i)=>{const p=studyPlan(x);if(!p.today)return;const tt=wake+90+i*150;
    if(p.today.type==='review'){const dn=!!(x.reviewLog||{})[ds];add({k:'st'+x.id,t:tt,title:`${x.subject}: Wiederholung`,sub:dn?'erledigt':(p.today.last?'Gesamtwiederholung und Altfragen':reviewLabel(x,p.today.a,p.today.b)),cls:'c-'+x.color,done:dn,body:studyToday(x)});return}
    const dn=p.doneToday>=p.today.amt;add({k:'st'+x.id,t:tt,title:`${x.subject}`,sub:dn?`Pensum geschafft · ${p.doneToday} ${p.doneToday===1?UNIT[x.mode].one:UNIT[x.mode].many}`:`${p.today.amt} ${p.today.amt===1?UNIT[x.mode].one:UNIT[x.mode].many}${p.doneToday?` · ${p.doneToday} geschafft`:''}`,cls:'c-'+x.color,done:dn,body:studyToday(x),act:dn?null:{a:'focus-start',id:x.id,txt:'Fokus'}})});
  eventsOn(ds,true).forEach(e=>add({k:'ev'+e.id,t:toMin(e.start),time:`${e.start}–${e.end}`,title:e.title,sub:CAL[e.cal].name,cls:'c-'+e.cal,done:toMin(e.end)<=nm,act:{a:'edit-event',id:e.id,txt:'Details'}}));
  if(R.lunch&&!mealEvent(iso(TODAY())))add({k:'lunch',t:toMin(R.lunch),title:'Kochen und Essen',sub:'Pause, ohne Bildschirm',cls:'c-hol',done:nm>toMin(R.lunch)+75,anchor:true});
  const td=S.tasks.filter(x=>x.due===ds),tOpen=td.filter(x=>!x.done),ov=S.tasks.filter(x=>!x.done&&x.due&&x.due<ds);
  if(td.length||ov.length)add({k:'todos',t:toMin(R.lunch||'12:30')+60,title:'To-dos',sub:tOpen.length?tOpen.slice(0,2).map(x=>x.title).join(', ')+(tOpen.length>2?` +${tOpen.length-2}`:''):'alle erledigt',cls:'c-task',done:!tOpen.length,
    body:`${tOpen.length?`<ul class="tasks">${tOpen.map(x=>taskRow(x,{list:false})).join('')}</ul>`:''}${ov.length?`<button class="lieg" data-act="triage"><span>${ov.length} liegengeblieben</span><span class="link">Neu sortieren</span></button>`:''}`});
  const dc=dueChores(),doneCh=S.chores.filter(c=>c.last===ds);
  if(dc.length||doneCh.length)add({k:'chores',t:toMin(R.lunch||'12:30')+120,title:'Haushalt',sub:dc.length?dc.map(c=>c.name).join(', '):'alles erledigt',cls:'c-task',done:!dc.length,
    body:dc.length?`<ul class="rts">${dc.map(c=>`<li><button class="rt" data-act="chore-done" data-id="${c.id}"><span class="chk">${ic('check',11)}</span><span class="rt-t">${esc(c.name)}</span><span class="rt-m">${c.mins} min</span></button></li>`).join('')}</ul>`:'',act:dc.length?{a:'sprint',txt:'10-min-Sprint'}:null});
  if(S.replies.length||(S.contactLog||[]).some(c=>c.date===ds)){const rs=S.replies.slice().sort((a,b)=>a.added.localeCompare(b.added));
    add({k:'ppl',t:toMin('16:30'),title:'Menschen',sub:rs.length?rs.slice(0,2).map(r=>`${r.name} · ${kindOf(r).s}`).join(', ')+(rs.length>2?` +${rs.length-2}`:''):'alle erledigt',cls:'c-bday',done:!rs.length,
      body:rs.length?`<ul class="rps">${rs.slice(0,3).map(r=>replyRow(r,true)).join('')}</ul>`:'',act:rs.length>1?{a:'reply-round',txt:'Antwort-Runde'}:null})}
  const tr=S.habits.find(h=>/training/i.test(h.name));if(tr){const st=habState(tr);if(st.open||st.done)add({k:'sport',t:toMin(R.sport),title:'Training',sub:st.done?'erledigt':tr.detail,cls:'c-training',done:st.done,act:st.done?null:{a:'toggle-habit',id:tr.id,date:ds,txt:'Erledigt'}})}
  if(R.reward.on)add({k:'reward',t:toMin(R.reward.start),time:`${R.reward.start}–${R.reward.end}`,title:R.reward.label,sub:studyOpenCount()?'nach dem Lernpensum':'verdient',cls:'c-privat',done:nm>=toMin(R.reward.end),anchor:true});
  const w=windMin(),b=bedMin(),eDone=S.routines.evening.every(i=>rtDone('evening',i));
  add({k:'evening',t:w<wake?w+1440:w,time:fromM(w),title:'Runterfahren',sub:`Licht aus um ${fromM(b)}`,cls:'c-hol',done:eDone,body:`<ul class="rts">${rtRows('evening')}</ul>`});
  it.sort((a,b)=>a.t-b.t);
  let nowI=-1;it.forEach((x,i)=>{if(!x.done&&!x.anchor&&x.t<=nm)nowI=i});if(nowI<0)nowI=it.findIndex(x=>!x.done&&!x.anchor&&x.t>nm);
  it.forEach((x,i)=>{x.state=x.done?'done':i===nowI?'now':x.t<nm&&!x.anchor?'open':x.t<nm?'past':'later'});
  if(!tlInit){tlInit=true;const n=it[nowI];if(n&&n.body)tlOpen.add(n.k)}
  return it}
function tlRow(x){const open=tlOpen.has(x.k)&&x.body;const tm=x.time||fromM(x.t);
  const act=x.act?`<button class="btn sm ${x.state==='now'?'primary':''}" data-act="${x.act.a}" ${x.act.id?`data-id="${x.act.id}"`:''} ${x.act.view?`data-view="${x.act.view}"`:''} ${x.act.date?`data-date="${x.act.date}"`:''}>${x.act.txt}</button>`:'';
  return `<li class="tl ${x.state} ${x.cls}"><span class="tl-time mono">${tm.split('–')[0]}</span><span class="tl-dot">${x.state==='done'?ic('check',10):''}</span>
   <div class="tl-card">${x.body?`<button class="tl-head" data-act="tl-toggle" data-k="${x.k}" aria-expanded="${!!open}">`:'<div class="tl-head">'}<span class="tl-main"><b>${esc(x.title)}</b><span>${esc(x.sub||'')}</span></span>${x.state==='now'?'<span class="status st-ok">jetzt</span>':x.state==='open'?'<span class="status st-done">offen</span>':''}${x.body?`<span class="tl-chev">${ic(open?'chevL':'chevR',14)}</span></button>`:'</div>'}
   ${act?`<div class="tl-act">${act}</div>`:''}${open?`<div class="tl-body">${x.body}</div>`:''}</div></li>`}
function doneToday(){const ds=iso(TODAY()),out=[];
  activeExams().forEach(x=>{const n=(x.log||{})[ds]||0;if(n)out.push([x.color,`${n} ${n===1?UNIT[x.mode].one:UNIT[x.mode].many} ${x.subject}`])});
  if(S.focusLog[ds])out.push(['privat',`${S.focusLog[ds]} min fokussiert`]);
  const t=S.tasks.filter(x=>x.done&&x.doneAt===ds);if(t.length)out.push(['task',`${t.length} ${t.length===1?'To-do':'To-dos'} erledigt`]);
  const c=S.chores.filter(x=>x.last===ds);if(c.length)out.push(['task',c.map(x=>x.name).join(', ')]);
  const p=(S.contactLog||[]).filter(x=>x.date===ds);if(p.length)out.push(['bday',`Gemeldet bei ${p.map(x=>x.name).join(', ')}`]);
  const h=S.habits.filter(x=>x.log[ds]);if(h.length)out.push(['training',`Habits: ${h.map(x=>x.name).join(', ')}`]);
  return out}
function renderRuhig(){const t=TODAY(),ds=iso(t),nm=nowMin(),P=planDay(),hr=new Date().getHours();
  const greet=hr<11?'Guten Morgen':hr<18?'Hallo':'Guten Abend';
  const stOpen=activeExams().map(x=>({x,p:studyPlan(x)})).filter(o=>o.p.today&&o.p.today.type==='learn'&&o.p.doneToday<o.p.today.amt);
  const tOpen=nowTasks().length,cOpen=dueChores().length,rOpen=S.replies.length,hOpen=S.habits.filter(h=>habState(h).open);
  const row=(lab,val,ok,view)=>`<li><button class="need ${ok?'ok':''}" data-act="nav" data-view="${view}"><span>${lab}</span><b>${ok?ic('check',13):val}</b></button></li>`;
  const imp=importantMails(),ups=upcoming(30).filter(u=>u.in>0&&!u.habit&&(u.in<=7||u.active)&&(u.kind!=='hol'||u.in<=3)).slice(0,9),gd=doneToday(),evening=nm>=toMin('17:00');
  const need=`<section class="card"><div class="card-head"><h2>Noch offen heute</h2></div><ul class="needs">
     ${stOpen.length||reviewOpen().length?reviewOpen().map(x=>row(`Lernen · ${esc(x.subject)}`,'Wdh.',false,'lernen')).join('')+stOpen.map(o=>row(`Lernen · ${esc(o.x.subject)}`,`${o.p.today.amt-o.p.doneToday} ${o.x.mode==='pages'?'S.':o.x.mode==='lectures'?'VL':(o.p.today.amt-o.p.doneToday===1?'Thema':'Themen')}`,false,'lernen')).join(''):row('Lernen','',true,'lernen')}
     ${row('To-dos',tOpen,!tOpen,'todos')}${row('Haushalt',cOpen,!cOpen,'haushalt')}${row('Menschen',rOpen,!rOpen,'menschen')}</ul>
    <h3 class="sub-h" style="margin-top:12px">Habits</h3><div class="w-habs habpills">${S.habits.filter(h=>h.log[ds]||habState(h).open).map(h=>{const st=habState(h);return `<button class="w-hab ${h.log[ds]?'on':''}" data-act="toggle-habit" data-id="${h.id}" data-date="${ds}" aria-pressed="${!!h.log[ds]}"><i>${h.log[ds]?ic('check',10):''}</i>${esc(h.name)}${freqOf(h).type==='weekly'?` <span class="mono" style="font-size:11px;opacity:.7">${st.count}/${st.n}</span>`:''}</button>`}).join('')}</div></section>`;
  const neu=`<section class="card"><div class="card-head"><h2>Neu und wichtig</h2></div>
    ${imp.length?`<ul class="news">${imp.map(m=>`<li><button data-act="open-mail" data-id="${m.id}">${ic('mail',14)}<span><b>${esc(m.from)}</b><small>${esc(m.subject)}${m.sug&&m.sug.status==='open'?' · Termin erkannt':''}</small></span></button></li>`).join('')}</ul>`:'<p class="empty" style="padding:0">Keine wichtigen neuen Mails.</p>'}
    ${ups.length?`<ul class="news">${ups.map(u=>`<li class="${u.kind==='fam'||u.who?'c-fam':''}"><span class="news-d">${u.d.getDate()}.${u.d.getMonth()+1}.</span><span><b>${esc(u.title)}${upWho(u)}</b><small>${inLabel(u.in)}${u.time?' · '+u.time:''}${upSpan(u)}${upAct(u)?' · '+upAct(u):''}</small></span></li>`).join('')}</ul>`:''}
    ${S.mails.filter(m=>m.unread).length>imp.length?`<p class="hint" style="margin-top:6px">${S.mails.filter(m=>m.unread).length-imp.length} weitere ungelesene, nicht wichtig. <button class="link" data-act="nav" data-view="mail">Posteingang</button></p>`:''}</section>`;
  const ib=S.inbox||[];const dumpCard=ib.length?`<section class="card"><div class="card-head"><h2>Geparkt</h2><span class="meta">${ib.length} · in Ruhe einordnen</span></div><ul class="inbox">${ib.map(x=>`<li><span class="ib-t">${esc(x.text)}</span><span class="ib-a"><button class="link" data-act="inbox-sort" data-id="${x.id}">Einordnen</button><button class="icon-btn" data-act="inbox-task" data-id="${x.id}" title="Als To-do" aria-label="Als To-do">${ic('list',14)}</button><button class="icon-btn" data-act="inbox-del" data-id="${x.id}" title="Weg damit" aria-label="Weg damit">${ic('x',14)}</button></span></li>`).join('')}</ul></section>`:'';
  const geschafft=`<section class="card ${evening?'':'quiet'}"><div class="card-head"><h2>Heute geschafft</h2></div>${gd.length?`<ul class="got">${gd.map(([c,tx])=>`<li class="c-${c}"><i></i>${esc(tx)}</li>`).join('')}</ul>`:'<p class="empty" style="padding:0">Noch nichts, der Tag ist jung.</p>'}${evening&&gd.length?'<p class="hint">Das zählt alles. Gut gemacht.</p>':''}</section>`;
  return `<div class="page-head"><div><p class="eyebrow">${WDL[t.getDay()]}, ${t.getDate()}. ${MON[t.getMonth()]} · KW ${isoWeek(t)}</p><h1>${greet}${anrede()}</h1>
     ${briefVisible()?'':`<p class="sub">${briefingText()}</p>`}</div><div class="head-actions">${modeSeg()}</div></div>
   ${gBanner()}${S.firstRun?firstRunCard():''}${briefCard()}${renderNow()}
   <div class="calm"><section class="card tl-wrap"><div class="card-head"><h2>Dein Tag</h2><span class="meta">${P.over.length?`<b class="cap bad">${fmtDur(P.overMin)} passt heute nicht mehr</b>`:`<b class="cap ok">passt</b>`} · ${P.planned?fmtDur(P.planned)+' geplant':'nichts mehr geplant'}${(()=>{const nm=nowMin(),g=P.gaps.find(([x,z])=>x<=nm&&z>nm&&z-nm>=15);if(!g)return '';const nx=P.rows.find(r=>!r.done&&r.s>=g[1]-1);return ` · jetzt frei bis ${fromM(g[1])}${nx?` (${esc(nx.title)})`:''}`})()}${dpState().manual?` · <button class="link" data-act="plan-auto" title="Deine Reihenfolge verwerfen, der Planer verteilt wieder selbst">automatisch ordnen</button>`:''}</span></div>
     ${bibControls()}
     ${(()=>{const ad=allDayOn(ds,true).filter(x=>x.cal!=='hol'&&x.cal!=='bday'&&(x.inPlan||!x.id));return ad.length?`<div class="adtoday"><span>Heute ganztägig</span>${ad.map(x=>`<span class="adp c-${x.cal}" ${x.id?`data-act="ev-info" data-id="${esc(x.id)}" role="button" tabindex="0"`:''}>${esc(x.title)}</span>`).join('')}</div>`:''})()}
     <ol class="tline" id="plan-list">${P.rows.map(r=>planRow(r,P.cur)).join('')}</ol>
     ${todoPool()}
     <p class="hint">Fixes (${ic('pin',10).replace('class="ic"','class="ic" style="display:inline;vertical-align:-1px"')}) hat eine Uhrzeit. Den Rest ordnest du per Griff oder mit den Pfeilen, die Zeiten rechnen sich ab jetzt neu. Dauert was länger, rutscht der Rest einfach nach hinten.</p></section>
    <div class="col">${evening?geschafft+need:need}${dumpCard}${neu}${evening?'':geschafft}</div></div>`}
function todoPool(){const ds=iso(TODAY()),open=!!S.settings.poolOpen;
  const xs=S.tasks.filter(x=>!x.done&&x.inPlan!==ds).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')||b.important-a.important||a.title.localeCompare(b.title));
  return `<div class="pool ${open?'open':''}"><button class="pool-head" data-act="pool-toggle" aria-expanded="${open}"><span class="pool-chev">${ic('chevR',13)}</span><b>Alle To-dos</b><span class="mono pool-n">${xs.length}</span>${open?'<span class="pool-hint">in den Tag ziehen oder +</span>':''}</button>
    ${open?(xs.length?`<ul class="pool-list" id="todo-pool">${xs.map(x=>`<li class="pool-it" data-task="${x.id}"><span class="drag-h" title="In deinen Tag ziehen">${ic('grip',14)}</span><span class="pool-main"><button class="t-title" data-act="edit-task" data-id="${x.id}">${x.important?ic('star',11)+' ':''}${esc(x.title)}</button><span class="t-meta">${dueChip(x)}${x.list?`<span class="tag">${esc(x.list)}</span>`:''}</span></span><button class="icon-btn" data-act="pool-add" data-id="${x.id}" title="Als Nächstes in meinen Tag" aria-label="In meinen Tag">${ic('plus',14)}</button></li>`).join('')}</ul>`:'<p class="empty" style="padding:6px 0">Keine offenen To-dos.</p>'):''}</div>`}
function fixDoOnV1(){if(S.doOnFixV1)return;const ds=iso(TODAY());S.tasks.forEach(x=>{if(x.doOn===ds&&x.inPlan!==ds)x.doOn=null});S.doOnFixV1=true;save()}
function planTask(id,order){const x=S.tasks.find(z=>z.id===id);if(!x)return;const ds=iso(TODAY());x.inPlan=ds;const dp=dpState();dp.order=order;dp.manual=true;save();nowSkip=0;render()}
function firstRunCard(){if(WEB)return webFirstCard();return `<section class="card firstrun"><div class="card-head"><h2>Willkommen in deinem Planer</h2><button class="link" data-act="firstrun-done">Ausblenden</button></div>
   <ol><li><button class="link" data-act="nav" data-view="einstellungen">Tagesrhythmus prüfen</button>: Aufstehen, Training, Essen, Weg zur Bib.</li>
    <li><button class="link" data-act="nav" data-view="lernen">Prüfungen anlegen</button>: Stoff als Seiten, Themen oder Vorlesungen, der Plan rechnet sich selbst.</li>
    <li><button class="link" data-act="nav" data-view="habits">Habits</button>, <button class="link" data-act="nav" data-view="haushalt">Haushalt</button> und <button class="link" data-act="nav" data-view="menschen">Kontakte</button> anpassen.</li>
    ${APP&&!GSTATUS.connected?'<li><button class="link" data-act="g-connect">Mit Google verbinden</button>: Kalender, Tasks, Geburtstage und Gmail.</li>':''}
    <li>Schnelleingabe von überall: ${shortcutLabel()}</li></ol>
   ${GSTATUS.connected?'':`<p class="hint"><button class="link" data-act="g-connect">Mit Google verbinden</button>: Kalender, Tasks, Geburtstage und Gmail.</p>`}</section>`}
function briefingText(){const ds=iso(TODAY()),ev=myEventsOn(ds),st=activeExams().map(x=>({x,p:studyPlan(x)})).filter(o=>o.p.today&&o.p.today.type==='learn'),tr=S.habits.find(h=>/training/i.test(h.name)),parts=[];
  st.forEach(o=>parts.push(`${o.p.today.amt} ${o.p.today.amt===1?UNIT[o.x.mode].one:UNIT[o.x.mode].many} ${o.x.subject}`));
  if(ev.length)parts.push(`${ev.length} ${ev.length===1?'Termin':'Termine'}`);
  if(tr&&habState(tr).open&&sportAt()!=null)parts.push(`Training um ${fromM(sportAt())}`);
  const fr=S.tasks.filter(x=>!x.done&&x.due&&diffDays(TODAY(),parseISO(x.due))<=1&&x.due>=ds);if(fr.length)parts.push(fr.map(x=>`${x.title} (${fristTxt(x)})`).join(', '));
  const u=upcoming(30).find(x=>x.active&&x.in>0&&(x.kind==='bday'||x.kind==='imp'));
  return (parts.length?`Heute: ${parts.join(', ')}.`:'Heute ist nichts Festes geplant.')+(u?` ${u.title} ${inLabel(u.in)}.`:'')}


