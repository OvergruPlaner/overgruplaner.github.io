/* ---------- Jetzt ---------- */
let nowSkip=0;
function nowCandidates(){const nm=nowMin(),ds=iso(TODAY()),R=S.rhythm,wake=toMin(R.wake),bed=bedMin(),wind=windMin(),c=[];
  if(inWin(nm,(wind-15+1440)%1440,(wake-60+1440)%1440)){const nx=rtNext('evening'),late=inWin(nm,bed,(wake-60+1440)%1440);
    c.push({p:100,cls:'c-hol',label:late?'Schlafenszeit':'Runterfahren',title:late?'Licht aus':`Ab ${fromM(wind)} runterfahren, ${fromM(bed)} Licht aus`,
      detail:late?`Es ist nach ${fromM(bed)}. Damit du um ${R.wake} gut rauskommst: Buch zu, Kapitelende reicht.`:'Ab jetzt keine neuen Folgen oder Videos mehr. Der Abend gehört dem Runterkommen.',
      step:nx?rtText(nx):null,btn:nx?(nx.timer?{act:'read-timer',txt:'Lese-Timer starten'}:{act:'rt-toggle',kind:'evening',id:nx.id,txt:'Erledigt'}):null})}
  if(inWin(nm,(wake-30+1440)%1440,(wake+240)%1440)){const nx=rtNext('morning');if(nx)c.push({p:90,cls:'c-privat',label:'Morgenroutine',title:nx.type==='mode'?'Bib oder daheim?':rtText(nx),detail:`${S.routines.morning.filter(i=>rtDone('morning',i)).length} von ${S.routines.morning.length} erledigt. Klein anfangen, dann läuft’s.`,
    mode:nx.type==='mode',btn:nx.type==='mode'?null:{act:'rt-toggle',kind:'morning',id:nx.id,txt:'Erledigt'}})}
  myEventsOn(ds).forEach(e=>{const a=toMin(e.start),b=toMin(e.end);if(nm>=a-20&&nm<b)c.push({p:95,cls:'c-'+e.cal,label:nm<a?`Termin in ${a-nm} min`:'Termin läuft',title:e.title,detail:`${e.start}–${e.end} · ${CAL[e.cal].name}`})});
  if(modeToday()==='bib'){const b=bibTrips(),w=S.settings.walk.w;
    if(b.out){const lv=b.out.dep-w-nm;if(lv<=15&&lv>-3)c.push({p:98,cls:'c-uni',label:'Zug',title:lv<=0?'Jetzt los zum Zug':`In ${lv} min los zum Zug`,detail:`${b.out.line} um ${fromM(b.out.dep)}, an ${ortB()} ${fromM(b.out.arr)}, dann ${S.rhythm.bibWay} min zur Bib. Schlüssel, Laptop, Wasser.`})}
    if(b.back){const lv=b.back.dep-S.rhythm.bibWay-nm;if(lv<=20&&lv>-3)c.push({p:97,cls:'c-uni',label:'Heimfahrt',title:lv<=0?'Jetzt einpacken, Heimfahrt':`In ${lv} min einpacken`,detail:`${b.back.line} ${fromM(b.back.dep)} ab ${ortB()}, ${S.rhythm.bibWay} min Weg. Zuhause ${fromM(b.back.arr+w)}.`})}}
  const tr=S.habits.find(h=>/training/i.test(h.name));if(tr&&habState(tr).open&&sportAt()!=null&&inWin(nm,sportAt()-60,sportAt()+150))c.push({p:80,cls:'c-training',label:'Sport',title:'Training steht an',detail:`Geplant um ${fromM(sportAt())}. ${tr.detail||''}`,step:'Sportsachen anziehen, mehr nicht. Der Rest kommt von selbst.',btn:{act:'toggle-habit',id:tr.id,date:ds,txt:'Training erledigt'}});
  if(nm>=toMin(R.wake)-30&&nm<dayEnd()){const P=planDay();P.placed.filter(i=>i.k!=='morning').slice(0,3).forEach((it,j)=>{
    c.push({p:75-j,cls:it.cls,label:j===0?(it.study?'Lernen':'Als Nächstes'):'Danach',title:it.title,detail:`${it.sub}. ${j===0&&it.s<=nm+5?'':`ca. ${fromM(it.s)}, `}etwa ${fmtDur(it.nogap?it.whole:it.dur)}.`,step:it.step,btn:it.act?{act:it.act.a,id:it.act.id,txt:it.act.txt,k:it.act.k}:null,snipR:it.snipR})})}
  const rw=R.reward;if(rw.on&&inWin(nm,toMin(rw.start),toMin(rw.end))){const left=studyOpenCount();c.push({p:left?45:65,cls:'c-privat',label:'Freizeit',title:left?'Freizeit, sobald das Lernen erledigt ist':'Freizeit, verdient',detail:`Dein Slot bis ${rw.end}. Danach ist Schluss, dann kommt das Runterfahren.`,btn:left?null:{act:'reward-timer',txt:`Timer bis ${rw.end}`}})}
  c.push({p:0,cls:'c-hol',label:'Gerade nichts',title:'Nichts Dringendes',detail:'Alles erledigt, was jetzt dran war. Kurz durchatmen oder was vom Rest aussuchen.'});
  return c.sort((a,b)=>b.p-a.p)}
function updateNow(){const nc=$('#now-card');if(nc)nc.outerHTML=renderNow();const w=$('#widget');if(w)w.innerHTML=renderWidgetInner()}
const nowDots=(n,i)=>n>1?`<div class="now-dots" role="group" aria-label="Vorschläge">${Array.from({length:n},(_,j)=>`<button class="nd ${j===i?'on':''}" data-act="now-go" data-i="${j}" aria-label="Vorschlag ${j+1} von ${n}" ${j===i?'aria-current="true"':''}></button>`).join('')}</div>`:'';
function renderNow(){const c=nowCandidates(),i=nowSkip%c.length,x=c[i];
  const b=x.btn?`<button class="btn primary" data-act="${x.btn.act}" ${x.btn.id?`data-id="${x.btn.id}"`:''} ${x.btn.kind?`data-kind="${x.btn.kind}"`:''} ${x.btn.date?`data-date="${x.btn.date}"`:''} ${x.btn.k?`data-k="${x.btn.k}"`:''}>${x.btn.act.startsWith('focus')||x.btn.act.includes('timer')||x.btn.act==='sprint'?ic('bolt',16):ic('check',16)} ${x.btn.txt}</button>`:'';
  const mode=x.mode?`<button class="btn primary" data-act="day-mode" data-m="bib">In die Bib</button><button class="btn" data-act="day-mode" data-m="home">Daheim lernen</button>`:'';
  return `<section class="now ${x.cls}" id="now-card"><div class="now-l"><span class="now-label">Jetzt · ${esc(x.label)}</span><h2>${esc(x.title)}</h2><p>${esc(x.detail)}</p>
    ${x.step?`<p class="now-step"><b>Erster Schritt:</b> ${esc(x.step)}</p>`:''}${x.snipR?`<div class="snips">${snipChips(x.snipR)}</div>`:''}</div>
   <div class="now-act">${mode}${b}${c.length>1?`<button class="link" data-act="now-skip">Was anderes</button>`:''}</div>${nowDots(c.length,i)}</section>`}

/* ---------- Fokus-Timer ---------- */
let focus=null,focusTick=null;
const FMODES={p25:{l:'25 + 5',m:25},p50:{l:'50 + 10',m:50},vl:{l:'Vorlesung',m:90},open:{l:'Offen',m:0}};
function startFocus(o){focus={...o,end:Date.now()+o.mins*6e4,left:o.mins*6e4,paused:false,startMins:o.mins,started:Date.now(),open:o.mode==='open'};openFocus();clearInterval(focusTick);focusTick=setInterval(tickFocus,1000)}
function focusElapsed(){return focus.paused?(focus.pausedElapsed||0):Date.now()-focus.started-(focus.pauseTotal||0)}
function focusLeft(){if(focus.open)return focusElapsed();return focus.paused?focus.left:Math.max(0,focus.end-Date.now())}
function tickFocus(){if(!focus)return;const l=focusLeft();const wc=$('#w-clock');if(wc)wc.textContent=mmss(l);const el=$('#focus-clock');if(el)el.textContent=mmss(l);const bar=$('#focus-bar');if(bar)bar.style.width=focus.open?'100%':(100-l/(focus.startMins*6e4)*100)+'%';
  if(focus.mode==='vl'&&!focus.half&&!focus.open&&l<=focus.startMins*3e4){focus.half=true;toast('Halbzeit','Kurz aufstehen, Wasser holen, 5 Minuten. Dann weiter.',true)}
  const pill=$('#focus-pill');if(pill){pill.hidden=!!el;pill.querySelector('b').textContent=mmss(l)}
  if(!focus.open&&l<=0&&!focus.doneShown){focus.doneShown=true;finishFocus()}}
const mmss=ms=>{const s=Math.ceil(ms/1000);return `${pad(Math.floor(s/60))}:${pad(s%60)}`};
function openFocus(){if(!focus)return;const f=focus,isSprint=f.kind==='sprint';
  overlay(`<div class="modal focus c-${f.color||'privat'}" role="dialog" aria-label="Fokus"><span class="now-label">${esc(f.label)}</span><h2>${esc(f.title)}</h2>
   ${f.kind==='study'?`<div class="fmodes" role="group" aria-label="Modus">${Object.entries(FMODES).map(([k,v])=>`<button class="chip ${f.mode===k?'on':''}" data-act="focus-mode" data-m="${k}">${k==='vl'&&f.vlMins?`Vorlesung ${f.vlMins} min`:v.l}</button>`).join('')}</div>`:''}
   <div class="clock" id="focus-clock">${mmss(focusLeft())}</div><div class="fbar"><i id="focus-bar"></i></div>${f.open?'<p class="hint" style="margin:0">Stoppuhr läuft. Hör auf, wann du willst.</p>':''}
   ${isSprint?`<ul class="sprint">${f.chores.map(id=>{const c=S.chores.find(z=>z.id===id);const on=c&&c.last===iso(TODAY())&&!choreState(c).due;return c?`<li><button class="rt ${on?'on':''}" data-act="chore-done" data-id="${c.id}" data-keep="1"><span class="chk ${on?'on':''}">${ic('check',11)}</span><span class="rt-t">${esc(c.name)} <span class="mono" style="color:var(--muted)">${c.mins} min</span></span></button></li>`:''}).join('')}</ul>`:''}
   ${f.kind==='todos'?`<ul class="sprint">${f.tasks.map(id=>S.tasks.find(z=>z.id===id)).filter(Boolean).map(x=>`<li><button class="rt ${x.done?'on':''}" data-act="focus-task-done" data-id="${x.id}"><span class="chk ${x.done?'on':''}">${ic('check',11)}</span><span class="rt-t">${esc(x.title)}${x.due&&!x.done?` <span class="mono" style="color:var(--muted)">${fristTxt(x)}</span>`:''}</span></button></li>`).join('')}</ul>`:''}
   ${f.kind==='replies'?`<ul class="rps" style="width:100%;text-align:left">${f.replies.map(id=>S.replies.find(r=>r.id===id)).filter(Boolean).map(r=>replyRow(r,true)).join('')||'<li class="empty">Alle erledigt. Stark!</li>'}</ul>`:''}
   ${f.step?`<p class="now-step"><b>Erster Schritt:</b> ${esc(f.step)}</p>`:''}
   <div class="modal-actions"><button class="btn" data-act="focus-pause">${f.paused?'Weiter':'Pause'}</button><button class="btn ghost" data-act="focus-min">Minimieren</button><span class="sp"></span><button class="btn ${f.open?'primary':'ghost danger'}" data-act="focus-stop">${f.open?'Fertig':'Beenden'}</button></div>
   <p class="hint" style="margin:0">${f.kind==='replies'?'Die älteste zuerst. Kurz schlägt perfekt.':f.kind==='todos'?'Wenn der Timer abläuft, darfst du aufhören. Angefangen ist das Schwerste.':isSprint?'Wenn der Timer abläuft, darfst du aufhören, auch mitten drin.':f.kind==='read'?'Wenn der Timer abläuft: Kapitelende suchen, Licht aus.':'Handy in ein anderes Zimmer. Ablenkungen kurz notieren statt nachgehen.'}</p></div>`,'focus');tickFocus()}
function finishFocus(){const f=focus,mins=Math.max(1,Math.round((f.open?focusElapsed():(f.startMins*6e4-focusLeft()))/6e4))||f.startMins,ds=iso(TODAY());S.focusLog[ds]=(S.focusLog[ds]||0)+mins;save();clearInterval(focusTick);
  if(f.kind==='study'){const x=S.exams.find(e=>e.id===f.examId),p=x&&studyPlan(x);
    overlay(`<form class="modal" id="f-focus-log" data-id="${f.examId}" data-mins="${mins}"><h2>${mins} Minuten geschafft</h2><p class="hint" style="margin:0">Stark. Wie viele ${UNIT[x.mode].many} hast du in der Einheit geschafft?</p>
     <label class="fl" for="fl-n">${UNIT[x.mode].many}<input id="fl-n" name="n" type="number" min="0" value="${x.mode==='pages'?Math.max(1,Math.round(speedOf(x)*mins/60)):1}"></label>
     <div class="modal-actions"><span class="sp"></span><button type="button" class="btn ghost" data-act="close-overlay">Überspringen</button><button class="btn primary">Eintragen</button></div>
     <p class="hint" style="margin:0">Heute insgesamt ${S.focusLog[ds]} min fokussiert.</p></form>`);$('#fl-n').select()}
  else{closeOverlay();toast(f.kind==='read'?'Lesezeit vorbei':f.kind==='reward'?'Freizeit vorbei':(f.kind==='replies'?'Antwort-Runde vorbei':f.kind==='todos'?'Timer vorbei':'Sprint geschafft'),f.kind==='read'?'Kapitelende suchen, Buch zu, Licht aus.':f.kind==='reward'?'Zeit fürs Runterfahren.':`${mins} min. Du darfst jetzt aufhören.`,true)}
  focus=null;const pill=$('#focus-pill');if(pill)pill.hidden=true;refresh()}

