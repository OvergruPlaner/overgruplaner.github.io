/* ---------- Widget ---------- */
let wOpen=null;
function renderWidgetInner(){const t=TODAY(),ds=iso(t),n=new Date(),nm=nowMin();
  const head=`<div class="w-head"><span class="w-time"><b>${pad(n.getHours())}:${pad(n.getMinutes())}</b>${WDL[t.getDay()]}, ${t.getDate()}. ${MON[t.getMonth()]}</span><span class="w-hbtns">${APP?`<button class="w-open w-lock ${APPCFG.widgetLocked!==false?'':'on'}" data-act="w-lock" title="${APPCFG.widgetLocked!==false?'Position gesperrt. Klicken zum Verschieben':'Verschieben aktiv. Klicken zum Festmachen'}" aria-label="Position sperren">${ic('pin',13)}${APPCFG.widgetLocked!==false?'':'<span>fertig</span>'}</button>`:''}<button class="w-open" data-act="w-nav" data-view="heute" title="App öffnen" aria-label="App öffnen">${ic('ext',14)}</button></span></div>`;
  // Zug nur an Bib-Tagen, wenn die nächste erreichbare Abfahrt bald ist
  let train='';if(modeToday()==='bib'&&dpState().homeArrived==null){const dir=trainDir(),walk=S.settings.walk[dir==='w2p'?'w':'p'];let d=null;
    try{const b=bibTrips(),tr=dir==='w2p'?b.out:b.back;if(tr){const dd=departures(dir,40).find(x=>Math.abs((x.act.getHours()*60+x.act.getMinutes())-tr.dep)<=2&&x.line===tr.line)||departures(dir,40).find(x=>Math.abs((x.plan.getHours()*60+x.plan.getMinutes())-tr.m)<=1);if(dd)d=dd}}catch(e){}
    if(!d)d=departures(dir,6).find(x=>!x.cx&&x.reach);
    if(d&&(d.inMin<=240)){const go=d.inMin-walk;train=`<button class="w-train2" data-act="w-nav" data-view="zug" title="${liveOk()?'Live · '+liveSrc():'Beispiel-Fahrplan'}">${ic('train',14)}<span><b class="mono">${hhmm(d.act)}</b> ${d.line} → ${dir==='w2p'?ortB():ortA()}${d.delay?` <em>+${d.delay}</em>`:''}${liveOk()?'':' <small class="w-bsp">Bsp.</small>'}</span><span class="w-in ${go<=5?'hot':''}">${(dir==='w2p'?dpState().outTaken:dpState().backTaken)?'im Zug':go<=0?'jetzt los':`los in ${fmtDur(go)}`}</span></button>
      <div class="w-tripbtns">${(dir==='w2p'?dpState().outTaken:dpState().backTaken)?`<button class="link" data-act="trip-choose" data-k="${dir==='w2p'?'out':'back'}">Anderer Zug</button>`:`${go<=0?`<button class="link" data-act="${dir==='w2p'?'missed-train':'missed-back'}" data-k="${dir==='w2p'?'out':'back'}">Schaff ich nicht</button>`:''}<button class="link" data-act="trip-in" data-k="${dir==='w2p'?'out':'back'}">Sitz im Zug</button>`}<button class="link" data-act="trip-there" data-k="${dir==='w2p'?'out':'back'}">${dir==='w2p'?'Schon in der Bib':'Schon daheim'}</button></div>`}}
  let main;
  if(focus){main=`<div class="w-focus ${'c-'+(focus.color||'privat')}"><span class="w-lab">${esc(focus.label)}</span><b class="w-title">${esc(focus.title)}</b><span class="w-clock mono" id="w-clock">${mmss(focusLeft())}</span>
    <div class="w-btns"><button class="btn sm" data-act="focus-pause">${focus.paused?'Weiter':'Pause'}</button><button class="btn sm primary" data-act="focus-stop">${focus.open?'Fertig':'Beenden'}</button></div></div>`}
  else{const c=nowCandidates(),wi=nowSkip%c.length,x=c[wi];
    const btn=x.btn?`<button class="btn sm primary" data-act="${x.btn.act}" ${x.btn.id?`data-id="${x.btn.id}"`:''} ${x.btn.kind?`data-kind="${x.btn.kind}"`:''} ${x.btn.date?`data-date="${x.btn.date}"`:''} ${x.btn.k?`data-k="${x.btn.k}"`:''}>${x.btn.txt}</button>`:'';
    const mode=x.mode?`<button class="btn sm primary" data-act="day-mode" data-m="bib">Bib</button><button class="btn sm" data-act="day-mode" data-m="home">Daheim</button>`:'';
    main=`<div class="w-now ${x.cls}"><span class="w-lab">Jetzt · ${esc(x.label)}</span><b class="w-title">${esc(x.title)}</b>${x.step?`<span class="w-step">${esc(x.step)}</span>`:''}
     <div class="w-btns">${mode}${btn}${c.length>1?`<button class="link" data-act="now-skip">Was anderes</button>`:''}${nowDots(c.length,wi)}</div></div>`}
  // Heute: die nächsten Blöcke
  let agenda='';try{const P=planDay(),all=P.rows.filter(r=>!r.done&&r.e>nm),rows=all;
    if(rows.length)agenda=`<section class="w-sec"><h4>Heute<span>${P.over.length||!P.left?'':fmtDur(P.left)+' frei'}</span></h4><ul class="w-ag">${rows.map(r=>{const isNow=r.s<=nm&&r.e>nm;
      return `<li class="${r.cls} ${r.fixed?'fx':''} ${r.over?'ov':''} ${isNow?'cur':''}"><span class="mono">${isNow?'jetzt':r.over||r.nogap?'–':(r.fixed?'':'~')+fromM(r.s)}</span><i></i><span class="w-ag-t">${esc(r.title)}</span>${r.fixed&&r.s>nm&&r.s-nm<=90?`<span class="w-in">in ${fmtDur(r.s-nm)}</span>`:''}</li>`}).join('')}</ul>
      </section>`}catch(e){}
  // Wichtig: nur was man nicht verpassen darf (Geburtstage, Prüfungen/Wichtiges, Fristen, Feiertage)
  const ups=upcoming(21).filter(u=>u.in>0&&!u.habit&&(u.kind==='bday'||u.kind==='imp'||(['task','hol','fam'].includes(u.kind)&&u.in<=7)||(u.kind==='ev'&&u.opted&&u.in<=7))).slice(0,6);
  const soon=ups.length?`<section class="w-sec"><h4>Nicht vergessen</h4><ul class="w-up">${ups.map(u=>`<li class="${({bday:'c-bday',imp:'c-imp',task:'c-task',hol:'c-hol',fam:'c-fam'}[u.kind]||'c-'+(u.cal||'privat'))}"><span class="w-up-d">${u.in===1?'morgen':`${WD[u.d.getDay()]} ${u.d.getDate()}.`}</span><i></i><span class="w-ag-t">${esc(u.title.replace(/^Frist: /,''))}${u.who?`<em class="w-who"> · ${esc(u.who)}</em>`:''}</span>${u.kind==='task'?'<span class="w-tag">Frist</span>':u.time?`<span class="w-in">${u.time}</span>`:''}</li>`).join('')}</ul></section>`:'';
  // Noch offen: nur was offen ist, eine Zeile
  const st=activeExams().map(x=>({x,p:studyPlan(x)})).filter(o=>o.p.today&&o.p.today.type==='learn'&&o.p.doneToday<o.p.today.amt);
  const rvs=activeExams().map(x=>({x,rv:revToday(x)})).filter(o=>o.rv&&o.rv.left.length);
  const rvd=reviewOpen(),nRv=rvs.reduce((t,o)=>t+o.rv.left.length,0)+rvd.length,lern=st.length?`${st[0].p.today.amt-st[0].p.doneToday} ${UNIT[st[0].x.mode].short}${st.length>1?'+'+(st.length-1):''}${nRv?` +${nRv} W`:''}`:nRv?`${nRv} Wdh.`:0;
  const open=[[lern,'Lernen','lernen'],[nowTasks().length,'To-dos','todos'],[dueChores().length,'Haushalt','haushalt'],[S.replies.length,'Menschen','menschen']];
  const chk=(act,id,txt,sub,extra='')=>`<li><button class="w-chk" data-act="${act}" data-id="${id}" ${extra} aria-label="Erledigt: ${esc(txt)}"><i></i></button><span class="w-ag-t">${esc(txt)}${sub?`<small>${esc(sub)}</small>`:''}</span></li>`;
  const panel=k=>{if(k==='lernen')return rvd.map(x=>chk('st-review',x.id,x.subject,'Wiederholung heute')).join('')+rvs.map(o=>o.rv.left.map(r=>chk('st-rev',o.x.id,r.name.replace(/^S\d\s*·\s*/,''),'wiederholen · '+REV_LAB[r.stage],`data-i="${r.i}"`)).join('')).join('')+st.map(o=>{const r=o.p.today.amt-o.p.doneToday;return chk('w-study-done',o.x.id,o.x.subject,`noch ${r} ${r===1?UNIT[o.x.mode].one:UNIT[o.x.mode].many} heute`)}).join('');
    if(k==='todos')return nowTasks().map(x=>chk('toggle-task',x.id,x.title,x.due?fristTxt(x):'')).join('');
    if(k==='haushalt')return dueChores().map(c=>chk('chore-done',c.id,c.name,`${c.mins} min`)).join('');
    if(k==='menschen')return S.replies.map(r=>chk('reply-done',r.id,r.name,kindOf(r).s+(r.note?' · '+r.note:''))).join('');return ''};
  if(wOpen&&!open.find(o=>o[2]===wOpen&&o[0]))wOpen=null;
  const offen=`<section class="w-sec"><h4>Noch offen</h4>${open.some(o=>o[0])?`<div class="w-open-row">${open.map(([v,l,view])=>`<button ${v?`data-act="w-open" data-k="${view}" aria-expanded="${wOpen===view}"`:`data-act="w-nav" data-view="${view}"`} class="${v?'':'ok'} ${wOpen===view?'on':''}"><b>${v||ic('check',12)}</b><span>${l}</span></button>`).join('')}</div>
    ${wOpen?`<div class="w-panel"><ul>${panel(wOpen)}</ul><div class="w-pfoot">${{todos:'<button class="btn sm" data-act="todo-sprint">15-min-Sprint</button>',haushalt:'<button class="btn sm" data-act="sprint">10-min-Sprint</button>',menschen:'<button class="btn sm" data-act="reply-round">Antwort-Runde</button>'}[wOpen]||''}<button class="link w-more" data-act="w-nav" data-view="${wOpen}">In der App öffnen</button></div></div>`:''}`:`<p class="w-allok">${ic('check',13)} Alles erledigt für heute.</p>`}</section>`;
  let finL='';try{if(S.fin&&+S.fin.income){const fm=finMonth(),st=finStatus(fm);finL=`<button class="w-finl" data-act="w-nav" data-view="finanzen">${ic('euro',13)}<span>${esc(st.kurz)}</span>${st.ton==='reise'||st.ton==='aus'||st.ton==='warten'?'':`<span class="w-in">~${eur0(st.proTag)}/Tag</span>`}</button>`}}catch(e){}
  const habs=S.habits.filter(h=>h.log[ds]||habState(h).open);
  const hab=habs.length?`<div class="w-habs">${habs.map(h=>`<button class="w-hab ${h.log[ds]?'on':''}" data-act="toggle-habit" data-id="${h.id}" data-date="${ds}" aria-pressed="${!!h.log[ds]}"><i>${h.log[ds]?ic('check',9):''}</i>${esc(h.name)}</button>`).join('')}</div>`:'';
  const gd=nm>=toMin('17:00')?doneToday():[];
  return `${head}${train}${main}<div class="w-body">${agenda}${soon}${hab}${offen}${finL}
   ${gd.length?`<div class="w-got">${ic('check',12)} Heute geschafft: ${gd.length} ${gd.length===1?'Sache':'Sachen'}</div>`:''}</div>
   <form class="w-quick" id="f-wquick"><label class="sr" for="wq-in">Schnell notieren</label>${ic('bolt',14)}<input id="wq-in" name="q" type="text" autocomplete="off" placeholder="Schnell notieren … Enter"></form>`}
function openWidget(){const n=new Date();
  overlay(`<div class="desk" role="dialog" aria-label="Widget-Vorschau"><button class="desk-x" data-act="close-overlay">${ic('x',14)} Vorschau schließen</button>
   <div class="widget" id="widget">${renderWidgetInner()}</div>
   <p class="desk-cap">Liegt hinter allen Fenstern. <b>Windows + D</b> zeigt den Desktop und damit das Widget sofort. Alles lässt sich direkt hier erledigen, ohne die App zu öffnen.</p>
   <div class="taskbar"><span class="tb-ico"></span><span class="tb-ico"></span><span class="tb-ico app"></span><span class="tb-ico"></span><span class="tb-clock">${pad(n.getHours())}:${pad(n.getMinutes())}<br>${pad(n.getDate())}.${pad(n.getMonth()+1)}.${n.getFullYear()}</span></div></div>`,'full')}

