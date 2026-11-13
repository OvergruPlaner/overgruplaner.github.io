/* ---------- Ereignisse ---------- */
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el)return;const a=el.dataset.act,id=el.dataset.id;
  if(MODE==='widget'){if(a==='w-nav'){window.planer.openMain({view:el.dataset.view});return}if(WIDGET_FORWARD.includes(a)){window.planer.openMain({act:a,data:{...el.dataset}});return}}
  const task=()=>S.tasks.find(x=>x.id===id);
  switch(a){
    case 'nav':go(el.dataset.view);break;
    case 'nav-group':{const g=el.dataset.g;go(SUBS[g]?((S.lastSub||{})[g]||SUBS[g][0][0]):g);break}
    case 'quick':openQuick();break;
    case 'widget':if(APP)window.planer.toggleWidget();else openWidget();break;
    case 'close-overlay':closeOverlay();break;
    case 'brief-seen':{S.briefSeen=iso(TODAY());S.lastBriefAt=new Date().toISOString();save();render();break}
    case 'w-lock':{if(!APP)break;const res=window.planer.setConfig('widgetLocked',!(APPCFG.widgetLocked!==false));Object.assign(APPCFG,res.config||{});document.body.classList.toggle('w-locked',APPCFG.widgetLocked!==false);const w=$('#widget');if(w)w.innerHTML=renderWidgetInner();break}
    case 'w-open':{wOpen=wOpen===el.dataset.k?null:el.dataset.k;const w=$('#widget');if(w)w.innerHTML=renderWidgetInner();break}
    case 'w-study-done':{const x=S.exams.find(z=>z.id===id),p=x&&studyPlan(x);if(p&&p.today){setStudy(x,p.today.amt);toast('Pensum geschafft',x.subject)}refresh();break}
    case 'train-reload':{if(APP&&window.planer.trains)window.planer.trains.refresh();toast('Zug','Live-Daten werden neu geladen …');break}
    case 'fin-setup':openFinSetup();break;
    case 'fin-fixed':openFinFixed();break;
    case 'fin-konto':{const k=kontoStand();overlay(`<form class="modal" id="f-fin-konto" style="width:min(420px,100%)"><h2>Echter Kontostand</h2><p class="hint" style="margin-top:0">Schau in deiner Bank-App nach und trag ein, was dort steht. Der Planer rechnet gerade mit ${eur(k.total)}. Die Differenz wird als Korrektur in dein Budget für diesen Monat gebucht.</p>
      <label class="fld"><span>Kontostand laut Bank</span><input name="v" type="text" inputmode="decimal" placeholder="z. B. 412,37" required autofocus></label>
      <div class="modal-actions"><span class="sp"></span><button type="button" class="btn ghost" data-act="close-overlay">Abbrechen</button><button class="btn primary">Übernehmen</button></div></form>`);break}
    case 'fin-paid':{const f=F(),ym=ymAt(iso(TODAY()));f.paid[ym]=f.paid[ym]||{};const on=!f.paid[ym][id];f.paid[ym][id]=on;if(f.autoPaid&&f.autoPaid[ym])delete f.autoPaid[ym][id];
      if(id==='save'){f.potLog=f.potLog.filter(l=>!(l.ym===ym&&l.tag==='save'));if(on)potSplit(+f.saveMonthly||0,`Sparen ${MON[+ym.slice(5,7)-1]}`,ym,'save')}
      save();refresh();break}
    case 'fin-inc-del':{delIncome(id);save();refresh();break}
    case 'fin-trip-del':{const fi=F();fi.trips=fi.trips.filter(t=>t.id!==id);fi.potLog=fi.potLog.filter(l=>l.trip!==id);save();refresh();break}
    case 'fin-row':{const k=el.dataset.k,ul=$(k==='f'?'#ff-rows':'#fe-rows');if(ul){ul.insertAdjacentHTML('beforeend',finRow({},ul.children.length,k));ul.lastElementChild.querySelector('input').focus()}break}
    case 'fin-exp-del':{delExpense(id);save();closeOverlay();refresh();break}
    case 'fin-exp-edit':openExpEdit(id);break;
    case 'fin-day':{finSetDay(el.dataset.d);const q=$('#fin-in'),v=q?q.value:'';refresh();const n=$('#fin-in');if(n){n.value=v;n.focus();finPrevShow()}break}
    case 'fin-all':FIN_ALL=!FIN_ALL;refresh();break;
    case 'fin-seen':{F().seenClose=el.dataset.ym;save();refresh();break}
    case 'fin-money':openFinMoney(el.dataset.ym);break;
    case 'fin-wait':{const ym=el.dataset.ym;finWait(ym);save();closeOverlay();refresh();toast(`${MON[+ym.slice(5,7)-1]} wartet aufs Geld`,'Der Vormonat läuft so lange weiter. Wenn es da ist: „Geld ist da“.');break}
    case 'fin-here':{const ym=el.dataset.ym,ts=iso(TODAY());finMoney(ym,ts);save();refresh();toast('Geld ist da',`${MON[+ym.slice(5,7)-1]} läuft ab heute.`);break}
    case 'fin-split':FIN_SPLIT=null;openFinSplit(el.dataset.d);break;
    case 'fin-split-to':finSplitTo(el.dataset.d);break;
    case 'fin-split-all':case 'fin-split-none':{if(FIN_SPLIT){FIN_SPLIT.sel={};if(a==='fin-split-all')F().expenses.forEach(e=>{if(e.date===FIN_SPLIT.d)FIN_SPLIT.sel[e.id]=true});openFinSplit(FIN_SPLIT.d)}break}
    case 'fin-freq':{const q=$('#fin-in');if(!q)break;const a=el.dataset.a,ins=a?`${String(a).replace('.',',')} ${el.dataset.t}`:`${el.dataset.t} `,cur=q.value.trim();
      q.value=cur?`${cur.replace(/;\s*$/,'')}; ${ins}`:ins;q.focus();q.setSelectionRange(q.value.length,q.value.length);finPrevShow();break}
    case 'fin-cat':{FIN_CATOPEN=FIN_CATOPEN===id?null:id;refresh();break}
    case 'fin-cat-set':{const fi=F(),e=fi.expenses.find(x=>x.id===id),nc=el.dataset.cat;FIN_CATOPEN=null;if(e&&nc&&nc!==e.cat){const w=e.text.toLowerCase().split(/\s+/)[0];if(w)fi.catMap[w]=nc;e.cat=nc;save()}refresh();break}
    case 'trip-in':{const k=el.dataset.k,dir=k==='out'?'w2p':'p2w',nm=nowMin(),dp=dpState();
      const c=tripsOn(dir).filter(x=>x.dep>=nm-25&&x.dep<=nm+15).sort((a,b)=>Math.abs(a.dep-nm)-Math.abs(b.dep-nm))[0]||{m:nm,dep:nm,arr:nm+25,line:'Zug',delay:0};
      dp[k==='out'?'outTaken':'backTaken']={m:c.m,dep:c.dep,arr:c.arr,line:c.line,delay:c.delay||0};if(k==='out')dp.outDep=c.m;save();refresh();
      toast('Gute Fahrt',`${c.line} ${fromM(c.dep)}, an ${dir==='w2p'?ortB():ortA()} ${fromM(c.arr)}.`,false,{act:'trip-choose',k,txt:'Anderer Zug?'});break}
    case 'trip-choose':{const k=el.dataset.k,dir=k==='out'?'w2p':'p2w',nm=nowMin(),list=tripsOn(dir).filter(x=>x.dep>=nm-30&&x.dep<=nm+120&&!x.cx);
      overlay(`<div class="modal" style="width:min(420px,100%)"><h2>Welcher Zug?</h2><div class="trip-pick">${list.map(x=>`<button class="btn" data-act="trip-pick" data-k="${k}" data-m="${x.m}">${x.line} ${fromM(x.dep)} → ${fromM(x.arr)}</button>`).join('')||'<p class="empty">Keine Züge in der Nähe gefunden.</p>'}</div>
       <div class="modal-actions"><span class="sp"></span><button class="btn ghost" data-act="close-overlay">Abbrechen</button></div></div>`);break}
    case 'trip-pick':{const k=el.dataset.k,dir=k==='out'?'w2p':'p2w',c=tripsOn(dir).find(x=>x.m===+el.dataset.m);if(c){const dp=dpState();dp[k==='out'?'outTaken':'backTaken']={m:c.m,dep:c.dep,arr:c.arr,line:c.line,delay:c.delay||0};if(k==='out')dp.outDep=c.m;save()}closeOverlay();refresh();break}
    case 'trip-there':{const k=el.dataset.k,dp=dpState(),nm=nowMin();if(k==='out')dp.outArrived=nm;else{dp.homeArrived=nm;if(NET.ssid&&!S.settings.homeSsid){S.settings.homeSsid=NET.ssid;toast('WLAN gemerkt',`„${NET.ssid}“ ist ab jetzt dein Daheim-WLAN. Kommst du heim, hakt der Planer die Heimfahrt von selbst ab.`)}}save();nowSkip=0;refresh();break}
    case 'q-undo':{undoQuick();const i=$('#q-in');if(i)i.dispatchEvent(new Event('input'));break}
    case 'q-legend':{const l=$('#q-legend');if(l){l.hidden=!l.hidden;el.textContent=l.hidden?'Legende':'Legende ausblenden';if(window.QFIT)window.QFIT()}break}
    case 'inbox-sort':{const it=(S.inbox||[]).find(z=>z.id===id);if(it)openQuick(it.text,it.id);break}
    case 'inbox-task':{const it=(S.inbox||[]).find(z=>z.id===id);if(it){S.tasks.push({id:uid(),title:it.text,list:'Privat',due:null,important:false,done:false,doneAt:null});S.inbox=S.inbox.filter(z=>z.id!==id);save();refresh();toast('To-do angelegt',it.text)}break}
    case 'inbox-del':{S.inbox=(S.inbox||[]).filter(z=>z.id!==id);save();refresh();break}
    case 'legend':overlay(`<div class="modal" style="max-width:760px"><h2>Schnelleingabe · Legende</h2>${legendHTML()}<div class="modal-actions"><span class="sp"></span><button class="btn primary" data-act="close-overlay">Alles klar</button></div></div>`);break;
    case 'q-ex':{const i=$('#q-in');i.value=el.dataset.x;i.dispatchEvent(new Event('input'));i.focus();break}
    case 'toggle-task':{const x=task();x.done=!x.done;x.doneAt=x.done?iso(TODAY()):null;save();refresh();break}
    case 'star-task':{const x=task();x.important=!x.important;save();refresh();break}
    case 'del-task':S.tasks=S.tasks.filter(x=>x.id!==id);save();if(!$('#overlay').hidden)closeOverlay();refresh();break;
    case 'edit-task':openTaskModal(id);break;
    case 'set-due':{$('#te-due').value=el.dataset.date;document.querySelectorAll('.q-dates .chip').forEach(c=>c.classList.toggle('on',c===el));break}
    case 'edit-habit':openHabitModal(id);break;
    case 'dash-edit':dashEdit=!dashEdit;render();if(!dashEdit)toast('Dashboard gespeichert','Die neue Anordnung bleibt so.');break;
    case 'card-hide':{const L=layout(),c=el.dataset.card;L.cols=L.cols.map(x=>x.filter(i=>i!==c));L.hidden.push(c);save();render();break}
    case 'card-show':{const L=layout(),c=el.dataset.card;L.hidden=L.hidden.filter(i=>i!==c);const tgt=L.cols.reduce((a,b)=>a.length<=b.length?a:b);tgt.push(c);save();render();break}
    case 'dash-reset':S.layout=JSON.parse(JSON.stringify(DEFAULT_LAYOUT));save();render();break;
    case 'st-step':{const x=S.exams.find(e=>e.id===id);setStudy(x,studyPlan(x).doneToday+ +el.dataset.d);break}
    case 'st-all':{const x=S.exams.find(e=>e.id===id),p=studyPlan(x);setStudy(x,p.today.amt);break}
    case 'st-topic':{const x=S.exams.find(e=>e.id===id),p=studyPlan(x),i=+el.dataset.i;setStudy(x,p.doneToday>i?i:i+1);break}
    case 'st-rev':{const x=S.exams.find(e=>e.id===id);if(x)toggleRev(x,+el.dataset.i);break}
    case 'st-review':{const x=S.exams.find(e=>e.id===id),ts=iso(TODAY());x.reviewLog=x.reviewLog||{};x.reviewLog[ts]=!x.reviewLog[ts];if(x.reviewLog[ts]){const hb=syncLernenHabit()}save();refresh();break}
    case 'toggle-off':{const ds=el.dataset.date;changeOff(()=>{if(isOff(ds))S.studyOff=S.studyOff.filter(o=>o.date!==ds);else S.studyOff.push({date:ds,note:''})});break}
    case 'off-accept':changeOff(()=>S.studyOff.push({date:el.dataset.date,note:el.dataset.note||''}));break;
    case 'off-dismiss':S.offDismissed=[...(S.offDismissed||[]),el.dataset.date];save();render();break;
    case 'exam-new':openExamModal();break;
    case 'exam-edit':openExamModal(id);break;
    case 'exam-full':showFull[id]=!showFull[id];render();break;
    case 'exam-del':{const x=S.exams.find(e=>e.id===id);S.exams=S.exams.filter(e=>e.id!==id);S.events=S.events.filter(e=>!(e.title===x.subject&&e.date===x.date));save();closeOverlay();refresh();toast('Prüfung gelöscht',x.subject);break}
    case 'now-skip':{nowSkip++;updateNow();break}
    case 'now-go':{nowSkip=+el.dataset.i;updateNow();break}
    case 'day-mode':S.dayMode[iso(TODAY())]=el.dataset.m;dpState().outDep=null;if(el.dataset.m==='home'&&NET.ssid&&!S.settings.homeSsid)S.settings.homeSsid=NET.ssid;save();nowSkip=0;refresh();break;
    case 'rt-toggle':rtToggle(el.dataset.kind,id);nowSkip=0;refresh();break;
    case 'read-timer':{e.stopPropagation();const bed=bedMin(),nm=nowMin();let mins=((bed-nm)%1440+1440)%1440;if(mins<5||mins>240)mins=30;startFocus({kind:'read',mins,label:'Lesen',title:`Lesen bis ${fromM(bed)}`,color:'hol'});break}
    case 'reward-timer':{const end=toMin(S.rhythm.reward.end),mins=Math.max(5,end-nowMin());startFocus({kind:'reward',mins,label:'Freizeit',title:`${S.rhythm.reward.label} bis ${S.rhythm.reward.end}`,color:'privat'});break}
    case 'focus-start':{const x=S.exams.find(z=>z.id===id),p=studyPlan(x),sg=segs(x,p.doneBefore+p.doneToday,p.today?p.today.b:p.doneBefore+1)[0],lec=x.mode==='lectures',mode=lec?'vl':'p50',vl=lec&&sg?sg.dur:90;
      startFocus({kind:'study',examId:id,mode,mins:lec?vl:50,vlMins:vl,label:`Fokus · ${x.subject}`,title:sg?(x.mode==='pages'?`${sg.name}, ${sg.range}`:sg.name):x.subject,color:x.color,step:lec?'Vorlesung öffnen, Play drücken. Notizen nebenbei.':x.mode==='pages'?'Eine Seite lesen. Dann die nächste.':'Erste Stichworte notieren.'});break}
    case 'focus-mode':{if(!focus)break;const m=el.dataset.m,mins=m==='vl'?(focus.vlMins||90):FMODES[m].m;Object.assign(focus,{mode:m,open:m==='open',mins,startMins:mins||1,end:Date.now()+mins*6e4,left:mins*6e4,started:Date.now(),pauseTotal:0,paused:false,half:false});openFocus();break}
    case 'focus-pause':if(focus){if(focus.paused){focus.end=Date.now()+focus.left;focus.pauseTotal=(focus.pauseTotal||0)+(Date.now()-focus.pausedAt);focus.paused=false}else{focus.left=focus.open?0:Math.max(0,focus.end-Date.now());focus.pausedElapsed=focusElapsed();focus.pausedAt=Date.now();focus.paused=true}openFocus()}break;
    case 'focus-min':closeOverlay();$('#focus-pill').hidden=false;tickFocus();break;
    case 'focus-open':openFocus();break;
    case 'focus-stop':if(focus){const done=focus.open?focusElapsed():focus.startMins*6e4-focusLeft();if(done>60000&&focus.kind==='study'){finishFocus()}else{clearInterval(focusTick);focus=null;$('#focus-pill').hidden=true;closeOverlay()}}break;
    case 'sprint':{const pk=sprintPick();if(!pk.length){toast('Nichts fällig','Haushalt ist im Griff.');break}const big=pk.length===1&&pk[0].mins>10;
      startFocus({kind:'sprint',mins:10,label:'10-Minuten-Sprint',title:big?`10 Minuten ${pk[0].name}, aufhören erlaubt`:pk.map(c=>c.name).join(' + '),chores:pk.map(c=>c.id),color:'task'});break}
    case 'chore-done':{const c=S.chores.find(z=>z.id===id);choreDone(c);toast('Erledigt',c.name);if(el.dataset.keep&&focus)openFocus();refresh();break}
    case 'chore-flag':{const c=S.chores.find(z=>z.id===id);c.flagged=true;save();refresh();break}
    case 'chores-edit':openChoresModal();break;
    case 'chore-del':S.chores=S.chores.filter(c=>c.id!==id);save();openChoresModal();refresh();break;
    case 'todo-sprint':{const one=id&&S.tasks.find(z=>z.id===id),ts=one?[one]:nowTasks().slice().sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')).slice(0,3);if(!ts.length){toast('Nichts offen','Keine To-dos für heute.');break}
      const mins=one?(one.mins||15):15;startFocus({kind:'todos',mins,label:one?'To-do':'To-do-Sprint',title:one?one.title:`${ts.length} ${ts.length===1?'To-do':'To-dos'} in ${mins} Minuten`,tasks:ts.map(x=>x.id),color:'task',step:one?'Nur anfangen, die ersten 2 Minuten zählen.':'Das dringendste zuerst. Aufhören erlaubt, wenn der Timer abläuft.'});break}
    case 'focus-task-done':{const x=S.tasks.find(z=>z.id===id);if(x){x.done=!x.done;x.doneAt=x.done?iso(TODAY()):null;save();refresh();if(focus)openFocus();if(x.done)toast('Erledigt',x.title)}break}
    case 'reply-done':{const r=S.replies.find(z=>z.id===id);S.replies=S.replies.filter(z=>z.id!==id);logContact(r.name,r.kind);save();nowSkip=0;if(focus&&focus.kind==='replies')openFocus();refresh();toast('Erledigt',`${r.name}. Gut gemacht.`);break}
    case 'person-done':{const pp=S.people.find(z=>z.id===id);logContact(pp.name,'checkin');S.replies=S.replies.filter(z=>!(z.name.toLowerCase()===pp.name.toLowerCase()&&z.kind==='checkin'));save();refresh();toast('Gemeldet',pp.name);break}
    case 'person-note':{const pp=S.people.find(z=>z.id===id);if(!S.replies.some(z=>z.name===pp.name&&z.kind==='checkin'))S.replies.push({id:uid(),name:pp.name,kind:'checkin',note:'',added:iso(TODAY())});save();refresh();toast('Auf der Liste',`${pp.name} · einfach melden`);break}
    case 'snip-t':{const t=el.dataset.t;try{navigator.clipboard.writeText(t).then(()=>toast('Kopiert','Einfügen, anpassen, abschicken.'),()=>toast('Zum Kopieren',t))}catch(_){toast('Zum Kopieren',t)}break}
    case 'reply-round':{const pk=S.replies.slice().sort((a,b)=>a.added.localeCompare(b.added)).slice(0,3);if(!pk.length)break;const mins=pk.length>1?10:pk[0].kind==='call'?10:5;startFocus({kind:'replies',mins,label:pk.length>1?'Antwort-Runde':'Menschen',title:pk.length>1?`${pk.length} Nachrichten in ${mins} Minuten`:`${pk[0].name}: ${kindOf(pk[0]).l} in ${mins} Minuten`,replies:pk.map(r=>r.id),color:'bday'});break}
    case 'people-edit':openPeopleModal();break;
    case 'person-del':S.people=S.people.filter(z=>z.id!==id);save();if(!$('#overlay').hidden)openPeopleModal();refresh();break;
    case 'snip':{const t=SNIPS[+el.dataset.i];const done=()=>toast('Kopiert','Einfügen und weiterschreiben.');try{navigator.clipboard.writeText(t).then(done,()=>toast('Zum Kopieren',t))}catch(_){toast('Zum Kopieren',t)}break}
    case 'triage':openTriage();break;
    case 'tri':{const x=S.tasks.find(z=>z.id===id),k=el.dataset.k;if(k==='today')x.due=iso(TODAY());else if(k==='later')x.due=null;else S.tasks=S.tasks.filter(z=>z.id!==id);save();refresh();openTriage();break}
    case 'plan-auto':{const dp=dpState();dp.manual=false;dp.pin={};dp.nb={};if(dp.cap)dp.cap={};if(dp.essAt)delete dp.essAt.lunch;save();render();toast('Automatisch geordnet','Der Planer verteilt wieder selbst. Sobald du etwas ziehst, gilt wieder deine Reihenfolge.');break}
    case 'flex-first':{const P=planDay(),dp=dpState(),k=el.dataset.k;if(dp.nb)delete dp.nb[k];dp.manual=true;dp.pin=dp.pin||{};dp.pin[k]=true;dp.order=[k,...P.order.filter(z=>z!==k)];
      if(P.anchors.includes(k)){dp.essAt=dp.essAt||{};dp.essAt[k]=nowMin()}else anchorsBehind(k,P.anchors);save();nowSkip=0;render();break}
    // „Später“: Anker (Essen) haben eine Uhrzeit, keine Position. Darum überspringt der Tausch sie und nimmt den nächsten echten Block;
    // ist das ein Lückenfüller (To-dos/Haushalt), zählt der ab dann als selbst sortiert, sonst täte der Klick sichtbar nichts.
    case 'flex-later':{const P=planDay(),dp=dpState(),k=el.dataset.k,o=P.order.slice(),i=o.indexOf(k),anc=P.anchors;dp.manual=true;dp.pin=dp.pin||{};dp.pin[k]=true;
      if(anc.includes(k)){const me=P.placed.find(z=>z.k===k&&z.first);if(me){const nx=P.placed.filter(z=>z.s>=me.e&&z.k!==k)[0];dp.essAt=dp.essAt||{};dp.essAt[k]=nx?nx.e:me.e+30}}
      else{let j=i+1;while(j<o.length&&anc.includes(o[j]))j++;if(i>-1&&j<o.length){const b=o[j];o.splice(i,1);o.splice(j,0,k);if(FILLERS.includes(b))dp.pin[b]=true}}
      dp.order=o;save();render();break}
    case 'flex-skip':{const k=el.dataset.k,dp=dpState();
      if(+el.dataset.rest>0){dp.cap=dp.cap||{};dp.cap[k]=+el.dataset.rest;toast('Rest auf morgen','Was heute noch passt, bleibt stehen.')}
      else if(k==='todos'){const tm=iso(addDays(TODAY(),1));let moved=0,stuck=[];nowTasks().forEach(x=>{if(x.due&&x.due<tm){stuck.push(x.title);return}x.doOn=tm;x.inPlan=null;moved++});
        toast(moved?'To-dos auf morgen':'Geht nicht mehr',stuck.length?`${stuck.join(', ')}: Frist ist heute, das bleibt stehen.`:'Die Fristen bleiben, du erledigst sie morgen.')}
      else if(k.startsWith('t:')){const x=S.tasks.find(z=>'t:'+z.id===k);if(x)x.inPlan=null;dp.order=dp.order.filter(z=>z!==k);toast('Zurück in der Liste','Liegt wieder unter „Alle To-dos“.')}
      else{dp.skip[k]=true;const x=k.startsWith('st:')&&S.exams.find(z=>'st:'+z.id===k);toast(k==='lunch'||k==='morning'?'Heute weggelassen':'Auf morgen',x?`${x.subject}: Der Lernplan verteilt das Pensum ab morgen neu.`:'Taucht morgen wieder auf.')}
      save();nowSkip=0;render();break}
    case 'pool-toggle':S.settings.poolOpen=!S.settings.poolOpen;save();render();break;
    case 'pool-add':{const P=planDay(),k='t:'+id,cur=P.cur&&!P.cur.fixed&&!P.cur.essential?P.cur.k:null,o=P.order.filter(z=>z!==k),i=cur?o.indexOf(cur)+1:0;o.splice(i,0,k);planTask(id,o);toast('In deinem Tag','Steht jetzt als Nächstes drin.');break}
    case 'plan-task-done':{const x=S.tasks.find(z=>z.id===id);if(x){x.done=true;x.doneAt=iso(TODAY());save();nowSkip=0;refresh();toast('Erledigt',x.title)}break}
    case 'flex-done':{dpState().done[el.dataset.k]=true;save();nowSkip=0;refresh();toast('Erledigt','Weiter geht’s mit dem Nächsten.');break}
    case 'missed-train':{const dp=dpState(),nm=nowMin(),wk=S.settings.walk.w,nx=tripsOn('w2p').find(x=>!x.cx&&x.dep-wk>=nm)||tripsOn('w2p').find(x=>!x.cx&&x.dep>=nm);
      dp.outTaken=null;dp.outDep=nx?nx.m:null;save();refresh();toast('Neu geplant',nx?`${nx.line} ${fromM(nx.dep)}, los um ${fromM(Math.max(nm,nx.dep-wk))}.`:'Heute fährt keiner mehr.',false,nx?{act:'trip-choose',k:'out',txt:'Anderer Zug?'}:null);break}
    case 'missed-back':{const dp=dpState(),nm=nowMin(),nx=tripsOn('p2w').find(x=>!x.cx&&x.dep-S.rhythm.bibWay>=nm)||tripsOn('p2w').find(x=>!x.cx&&x.dep>=nm);
      dp.backTaken=null;if(nx)dp.homeBy=fromM(Math.max(0,nx.dep-S.rhythm.bibWay));save();refresh();toast('Neu geplant',nx?`Heim mit ${nx.line} ${fromM(nx.dep)}.`:'Heute fährt keiner mehr.',false,nx?{act:'trip-choose',k:'back',txt:'Anderer Zug?'}:null);break}
    case 'w-nav':closeOverlay();go(el.dataset.view);break;
    case 'firstrun-done':S.firstRun=false;save();render();break;
    case 'open-data':if(APP)window.planer.openDataDir();break;
    case 'ev-info':openEventInfo(id);break;
    case 'ev-optin':{const e0=S.events.find(e=>e.id===id);if(!e0)break;const k=e0.gid||e0.id;S.evOptIn=S.evOptIn||{};if(S.evOptIn[k])delete S.evOptIn[k];else S.evOptIn[k]=true;save();
      const on=!!S.evOptIn[k];toast(on?'In deinen Tag übernommen':'Wieder nur zur Info',on?`${e0.title}: zählt jetzt als dein Termin.${e0.allDay?' Falls du an den Tagen nicht lernst: „Als lernfreie Tage eintragen“.':''}`:e0.title);
      if(!$('#overlay').hidden&&$('#overlay .modal'))openEventInfo(id);refresh();break}
    case 'ev-off':{const e0=S.events.find(e=>e.id===id);if(!e0)break;const d=parseISO(e0.date),n=e0.endDate?Math.max(1,diffDays(d,parseISO(e0.endDate))):1;
      changeOff(()=>{for(let i=0;i<n;i++){const ds=iso(addDays(d,i));if(ds>=iso(TODAY())&&!isOff(ds))S.studyOff.push({date:ds,note:e0.title})}});closeOverlay();break}
    case 'g-connect':if(APP)gConnect();break;
    case 'g-sync':if(APP){toast('Synchronisiere …');window.planer.google.sync().then(st=>{GSTATUS=st;render();toast(st.error?'Teilweise fehlgeschlagen':'Synchronisiert',st.error||'')})}break;
    case 'g-disconnect':if(APP&&!el.dataset.sure){el.dataset.sure='1';el.textContent='Wirklich trennen?';break}if(APP)window.planer.google.disconnect().then(st=>{GSTATUS=st;render();toast('Google getrennt','Deine Einträge bleiben in der App.')});break;
    case 'app-restart':if(APP){flushSave();window.planer.restart()}break;
    case 'heute-mode':S.settings.heuteMode=el.dataset.m;dashEdit=false;save();render();break;
    case 'tl-toggle':{const k=el.dataset.k;tlOpen.has(k)?tlOpen.delete(k):tlOpen.add(k);render();break}
    case 'tl-done':showDone=!showDone;render();break;
    case 'chore-del2':S.chores=S.chores.filter(c=>c.id!==id);save();render();break;
    case 'watch-demo':watchDemo={site:S.watch.sites[0]||'YouTube',mins:S.watch.after+2,stage:1};watchPrompt(1);break;
    case 'watch-snooze':{const m=+el.dataset.m;closeOverlay();toast('Okay',`Ich frag in ${m} min nochmal. (In der Simulation gleich.)`);watchDemo.mins+=m;watchDemo.stage++;setTimeout(()=>{if(watchDemo)watchPrompt(watchDemo.stage)},3500);break}
    case 'watch-back':closeOverlay();toast('Zurück',`Weiter mit ${watchTarget()}. Gute Entscheidung.`);watchDemo=null;go('heute');break;
    case 'watch-ok':closeOverlay();toast('Alles klar',`Für ${watchDemo.site} frag ich heute nicht mehr.`);watchDemo=null;break;
    case 'watch-site-del':S.watch.sites.splice(+el.dataset.i,1);save();render();break;
    case 'train-more':trainMore+=10;render();break;
    case 'train-dir':S.settings.trainDir=el.dataset.dir==='auto'?null:el.dataset.dir;S.settings.trainDirAt=Date.now();save();refresh();break;
    case 'toggle-habit':{const h=S.habits.find(x=>x.id===id),d=el.dataset.date;if(h.log[d])delete h.log[d];else h.log[d]=true;save();refresh();break}
    case 'del-habit':S.habits=S.habits.filter(x=>x.id!==id);save();refresh();break;
    case 'accept-sug':{const m=S.mails.find(x=>x.id===id),s=m.sug;
      if(s.type==='event'){S.events.push({id:uid(),title:s.title,date:s.date,start:s.start,end:s.end,cal:s.cal||'privat',important:false});toast('In Kalender eingetragen',`${s.title} · ${sugWhen(s)}`)}
      else{S.tasks.push({id:uid(),title:s.title,list:s.list||'Uni',due:s.date,important:true,done:false,doneAt:null});toast('Als To-do übernommen',`${s.title} · fällig ${fmtShort(parseISO(s.date))}`)}
      s.status='accepted';save();refresh();break}
    case 'dismiss-sug':S.mails.find(x=>x.id===id).sug.status='dismissed';save();refresh();break;
    case 'open-mail':{mailSel=id;const m=S.mails.find(x=>x.id===id);m.unread=false;save();view='mail';render();break}
    case 'mail-filter':mailFilter=el.dataset.f;render();break;
    case 'todo-list':todoList=el.dataset.list;render();break;
    case 'cal-mode':cal.mode=el.dataset.mode;calScroll=true;render();break;
    case 'cal-step':calStep(+el.dataset.dir);calScroll=true;render();break;
    case 'cal-today':cal.anchor=iso(TODAY());calScroll=true;render();break;
    case 'cal-day':cal.anchor=el.dataset.date;cal.mode='tag';calScroll=true;view='kalender';render();break;
    case 'cal-month':cal.anchor=el.dataset.date;cal.mode='monat';render();break;
    case 'cal-filter':S.vis[el.dataset.cal]=!S.vis[el.dataset.cal];save();render();break;
    case 'cal-slot':{const r=el.getBoundingClientRect(),y=e.clientY-r.top,mins=H0*60+Math.floor(y/(HH/2))*30;openEventModal({date:el.dataset.date,start:fromMin(Math.min(mins,22*60+30))});break}
    case 'new-event':openEventModal({date:view==='kalender'?cal.anchor:iso(TODAY())});break;
    case 'edit-event':openEventModal({id});break;
    case 'del-event':S.events=S.events.filter(x=>x.id!==id);save();closeOverlay();refresh();toast('Termin gelöscht');break;
    case 'sender-del':S.senders.splice(+el.dataset.i,1);save();render();break;
    case 'test-toast':{const u=upcoming(30)[0];toast(u?u.title:'Testbenachrichtigung',u?`${inLabel(u.in)}, ${fmtLong(u.d)}`:'So sehen Erinnerungen aus.',true);break}
    case 'reset':S=seed();save();mailSel=null;todoList='alle';render();toast('Beispieldaten zurückgesetzt');break;
  }});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target,fd=new FormData(f),g=k=>(fd.get(k)||'').toString().trim();
  switch(f.id){
    case 'f-today-task':{if(!g('title'))return;const p=parseQuick(g('title'));S.tasks.push({id:uid(),title:p.title||g('title'),list:p.list||'Privat',due:iso(p.date||TODAY()),important:p.important,done:false,doneAt:null});save();refresh();setTimeout(()=>$('#tt-in')&&$('#tt-in').focus());break}
    case 'f-task':{if(!g('title'))return;S.tasks.push({id:uid(),title:g('title'),list:g('list')||'Privat',due:g('due')||null,important:!!fd.get('important'),done:false,doneAt:null});save();render();setTimeout(()=>$('#nt-title')&&$('#nt-title').focus());break}
    case 'f-habit':{if(!g('name'))return;const fr=readFreq(fd);S.habits.push({id:uid(),name:g('name'),detail:g('detail')||'',freq:fr,log:{}});save();render();toast('Habit angelegt',`${g('name')} · ${freqLabel({freq:fr})}`);break}
    case 'f-habit-edit':{const h=S.habits.find(x=>x.id===f.dataset.id);h.name=g('name')||h.name;h.detail=g('detail');h.freq=readFreq(fd);save();closeOverlay();refresh();toast('Habit gespeichert',`${h.name} · ${freqLabel(h)}`);break}
    case 'f-task-edit':{const x=S.tasks.find(t=>t.id===f.dataset.id),old=x.due;x.title=g('title')||x.title;x.due=g('due')||null;x.list=g('list')||x.list;x.important=!!fd.get('important');x.doOn=g('doOn')||null;if(x.doOn&&x.due&&x.doOn>x.due)x.doOn=x.due;{const m=parseInt(g('mins'),10);x.mins=m>0&&m!==15?Math.min(480,m):null}save();closeOverlay();refresh();
      toast(old!==x.due?'To-do verschoben':'To-do gespeichert',old!==x.due?`${x.title} → ${x.due?fmtLong(parseISO(x.due)):'ohne Datum'}`:x.title);break}
    case 'f-sender':S.senders.push({label:g('label'),match:g('match').toLowerCase()});save();render();break;
    case 'f-off':{const ds=g('date');if(!ds)return;if(isOff(ds)){toast('Schon eingetragen',fmtLong(parseISO(ds)));return}changeOff(()=>S.studyOff.push({date:ds,note:g('note')}));break}
    case 'f-reply':{const w=g('who');if(!w)return;const pr=parseReply(w)||{name:w,kind:'reply'};S.replies.push({id:uid(),name:pr.name,kind:pr.kind,note:'',added:iso(TODAY())});save();refresh();toast('Notiert',`${pr.name} · ${KINDS[pr.kind].l}`);setTimeout(()=>$('#rp-in')&&$('#rp-in').focus());break}
    case 'f-reply2':{const w=g('who');if(!w)return;S.replies.push({id:uid(),name:w,kind:g('kind')||'reply',note:g('note'),added:iso(TODAY())});save();render();toast('Notiert',`${w} · ${KINDS[g('kind')||'reply'].l}`);setTimeout(()=>$('#r2-name')&&$('#r2-name').focus());break}
    case 'f-focus-log':{const x=S.exams.find(z=>z.id===f.dataset.id),n=parseInt(g('n'),10)||0,m=+f.dataset.mins||0;if(m>=10&&n>0&&x.mode!=='lectures'){S.speed[x.id]=[...(S.speed[x.id]||[]),{m,n}].slice(-12)}closeOverlay();setStudy(x,studyPlan(x).doneToday+n);break}
    case 'f-chore':{if(!g('name'))return;S.chores.push({id:uid(),name:g('name'),mins:Math.max(1,parseInt(g('mins'),10)||5),rhythm:g('rhythm'),last:null,flagged:g('rhythm')==='needed'});save();openChoresModal();refresh();break}
    case 'f-person':{if(!g('name'))return;S.people.push({id:uid(),name:g('name'),every:Math.max(1,parseInt(g('every'),10)||14),last:iso(TODAY())});save();if(!$('#overlay').hidden)openPeopleModal();refresh();break}
    case 'f-chore2':{if(!g('name'))return;S.chores.push({id:uid(),name:g('name'),mins:Math.max(1,parseInt(g('mins'),10)||5),rhythm:g('rhythm'),last:null,flagged:g('rhythm')==='needed'});save();render();break}
    case 'f-watch':{if(!g('site'))return;S.watch.sites.push(g('site'));save();render();break}
    case 'f-wquick':{const v=g('q');if(!v)return;commitQuick(v,true);setTimeout(()=>$('#wq-in')&&$('#wq-in').focus());break}
    case 'f-exam':{const mode=g('mode'),pr=parseItems(fd.get('items')||'',mode);
      if(!pr.items.length){toast('Kein Stoff erkannt',mode==='pages'?'Schreib pro Zeile einen Abschnitt mit Seitenbereich, z. B. „Kap. 3 Enzyme 45-80“.':'Schreib pro Zeile ein Thema.');return}
      if(g('date')<=g('start')){toast('Datum prüfen','Der Lernbeginn muss vor der Prüfung liegen.');return}
      const ex=f.dataset.id?S.exams.find(e=>e.id===f.dataset.id):null,old=ex?{subject:ex.subject,date:ex.date}:null;
      const x=ex||{id:uid(),log:{},targets:{},reviewLog:{}};
      Object.assign(x,{subject:g('subject'),date:g('date'),start:g('start'),mode,items:pr.items,color:g('color'),reviewAuto:g('review')==='',reviewDays:g('review')===''?0:+g('review'),cap:g('cap')?+g('cap'):null});
      if(ex&&ex.mode!==mode){x.log={};x.targets={}}
      initExamMeta(x);if(!ex)S.exams.push(x);
      const evm=old&&S.events.find(e=>e.title===old.subject&&e.date===old.date);if(evm)Object.assign(evm,{title:x.subject,date:x.date});else if(!S.events.some(e=>e.title===x.subject&&e.date===x.date))S.events.push({id:uid(),title:x.subject,date:x.date,start:'09:00',end:'12:00',cal:'uni',important:true});
      save();closeOverlay();view='lernen';render();const p=studyPlan(x);
      toast(ex?'Plan neu berechnet':'Lernplan erstellt',`${fmtN(p.rate)} ${UNIT[mode].many} pro Lerntag, ${p.R} Wiederholungstage.${pr.bad.length?` ${pr.bad.length} Zeile(n) ohne Seitenangabe übersprungen.`:''}`);break}
    case 'f-fin':{const r=finCommit(g('q'));if(!r)return;
      if(r.bad){toast('Betrag fehlt',`Bei „${r.bad}“ finde ich keinen Betrag. Z. B. „12,50 Mittagessen“, „Kaffee 4“ oder „+50 Oma“. Noch nichts eingetragen.`);return}
      if(r.label){save();refresh();toast(r.n>1?`${r.n} Einträge eingetragen`:'Eingetragen',r.label,false,{act:'q-undo',txt:'Rückgängig'})}else{if(r.geld)save();refresh()}
      if(r.geld)toast('Geld',r.geld);
      setTimeout(()=>$('#fin-in')&&$('#fin-in').focus());break}
    case 'f-fin-konto':{const v=parseFloat(String(g('v')).replace(/\s|€/g,'').replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.'));if(isNaN(v)){toast('Betrag?','Zum Beispiel 412,37');break}
      const k=kontoStand(),diff=Math.round((v-k.total)*100)/100;closeOverlay();F().kontoAt=iso(TODAY());if(Math.abs(diff)<0.01){save();refresh();toast('Passt schon','Der Planer rechnet genau mit diesem Kontostand.');break}
      F().extra.push({id:uid(),date:iso(TODAY()),amount:diff,text:'Kontostand-Korrektur',to:'budget',korr:true});save();refresh();
      toast('Kontostand übernommen',`${diff>0?'+':'−'}${eur(Math.abs(diff))} im Budget für diesen Monat verrechnet.`);break}
    case 'f-fin-money':{const ym=g('ym'),date=g('date'),av=g('amount'),amt=av===''?null:+av;
      if(!date||!finMoneyOk(ym,date)){toast('Tag prüfen',`Für ${MON[+ym.slice(5,7)-1]} geht ein Tag vom ${dm(pLo(ym))} bis zum Monatsende.`);return}
      finMoney(ym,date,amt);save();closeOverlay();refresh();toast('Gespeichert',`${MON[+ym.slice(5,7)-1]} läuft ab ${fmtShort(parseISO(pStart(ym)))}${F().incomeOv[ym]!=null?` · mit ${eur(F().incomeOv[ym])}`:''}.`);break}
    case 'f-fin-move':{const amt=Math.round((+g('amt')||0)*100)/100;if(!(amt>0)||g('from')===g('to'))return;const l=movePot(g('from'),g('to'),amt);save();refresh();toast('Umgebucht',l);break}
    case 'f-fin-trip':{const fr=g('from'),to=g('to'),bud=Math.max(0,+g('budget')||0),pa=Math.min(bud,Math.max(0,+g('potAmt')||0)),pot=g('pot')||null;if(!fr||!to||to<fr){toast('Datum prüfen','„bis“ muss nach „von“ liegen.');return}
      const fi=F(),pa2=pot?Math.min(pa,potFree(pot)):0,t={id:uid(),name:g('name')||'Reise',from:fr,to,budget:bud,pot:pot&&pa2?pot:null,potAmt:pa2};fi.trips.push(t);
      if(t.pot&&t.potAmt)fi.potLog.push({date:iso(TODAY()),pot:t.pot,amount:-t.potAmt,why:`Reise: ${t.name}`,trip:t.id});
      save();refresh();toast('Angelegt',`${t.name}: ${eur0(bud)}${t.potAmt?`, davon ${eur0(t.potAmt)} aus ${(fi.pots.find(p=>p.id===t.pot)||{}).name}`:''}`);break}
    case 'f-fin-setup':{const fi=F(),ts=iso(TODAY()),ym=ymAt(ts),td=+ts.slice(8,10);if(!+fi.income&&+g('income')){fi.since=ymOf(ts);fi.sinceDay=td}fi.income=+g('income')||0;fi.saveMonthly=+g('save')||0;
      const adj=g('adj');if(adj!==''){const o0=fi.monthAdj[ym],am=Math.round((+adj)*100)/100;fi.monthAdj[ym]=o0&&o0.amount===am?o0:{day:td,date:ts,amount:am};if(!fi.since)fi.since=ym}else delete fi.monthAdj[ym];
      if(fd.get('autoSave'))delete fi.autoSave;else fi.autoSave=false;if(fd.get('skip')){fi.skipSave[ym]=true;fi.potLog=fi.potLog.filter(l=>!(l.ym===ym&&l.tag==='save'));if(fi.paid[ym])delete fi.paid[ym].save}else delete fi.skipSave[ym];
      const np=[];fi.pots.forEach((p,i)=>{const n=g('pn'+i);if(!n){fi.potLog=fi.potLog.filter(l=>l.pot!==p.id);return}p.name=n;p.pct=Math.max(0,+g('pp'+i)||0);p.cat=g('pc'+i)||null;const sb=g('ps'+i);if(sb!==''){const diff=Math.round(((+sb)-potBal(p.id))*100)/100;if(diff)fi.potLog.push({date:iso(TODAY()),pot:p.id,amount:diff,why:'Kontostand gesetzt'})}np.push(p)});
      if(g('pnN'))np.push({id:uid(),name:g('pnN'),pct:Math.max(0,+g('ppN')||0),cat:null});fi.pots=np;save();closeOverlay();refresh();toast('Gespeichert',`Frei zum Ausgeben diesen Monat: ${eur(finMonth().free)}`);break}
    case 'f-fin-fixed':{const fi=F(),old=fi.fixed,oe=fi.etf;fi.fixed=[];fi.etf=[];
      for(let i=0;i<200;i++){if(!fd.has('fn'+i))continue;const n=g('fn'+i);if(n)fi.fixed.push({id:(old[i]||{}).id||uid(),name:n,amount:+g('fa'+i)||0,day:+g('fd'+i)||null,every:Math.max(1,+g('fe'+i)||1),what:g('fw'+i)||'',month:(old[i]||{}).month||(+iso(TODAY()).slice(5,7))})}
      for(let i=0;i<200;i++){if(!fd.has('en'+i))continue;const n=g('en'+i);if(n)fi.etf.push({id:(oe[i]||{}).id||uid(),name:n,amount:+g('ea'+i)||0,day:+g('ed'+i)||null})}
      save();closeOverlay();refresh();toast('Gespeichert',`Fixkosten ${eur(fixSum())} · ETF ${eur(etfSum())} pro Monat`);break}
    case 'f-exp':{const fi=F(),e=fi.expenses.find(x=>x.id===f.dataset.id);if(!e)return;const nc=g('cat');if(nc!==e.cat){const w=(g('text')||e.text).toLowerCase().split(/\s+/)[0];if(w)fi.catMap[w]=nc}
      Object.assign(e,{amount:Math.max(0,+g('amount')||e.amount),date:g('date')||e.date,text:g('text')||e.text,cat:nc,pot:g('pot')||null});fi.potLog=fi.potLog.filter(l=>l.exp!==e.id);delete e.potAmt;if(e.pot){e.potAmt=Math.min(e.amount,potFree(e.pot));if(e.potAmt>0)fi.potLog.push({date:e.date,pot:e.pot,amount:-e.potAmt,why:e.text,exp:e.id})}
      save();closeOverlay();refresh();break}
    case 'f-event':{let s=g('start'),en=g('end');if(toMin(en)<=toMin(s))en=addH(s,1);const data={title:g('title'),date:g('date'),start:s,end:en,cal:g('cal'),important:!!fd.get('important'),loc:g('loc')||null};
      if(f.dataset.id)Object.assign(S.events.find(x=>x.id===f.dataset.id),data);else S.events.push({id:uid(),...data});
      save();closeOverlay();refresh();toast(f.dataset.id?'Termin gespeichert':'Termin eingetragen',`${data.title} · ${fmtShort(parseISO(data.date))}, ${data.start}`);break}
  }});
document.addEventListener('change',e=>{
  if(e.target.dataset.study){const x=S.exams.find(z=>z.id===e.target.dataset.study);setStudy(x,parseInt(e.target.value,10)||0);return}
  if(e.target.dataset.rest!=null){const d=+e.target.dataset.rest,ex=activeExams(),before=ex.map(x=>studyPlan(x).rate);
    S.studyRest=e.target.checked?[...new Set([...S.studyRest,d])]:S.studyRest.filter(x=>x!==d);if(S.studyRest.length>=7)S.studyRest=S.studyRest.slice(1);
    ex.forEach(rebaseExam);save();render();
    const msg=ex.map((x,i)=>{const p=studyPlan(x);return `${x.subject}: ${fmtN(before[i])} → ${fmtN(p.rate)} ${UNIT[x.mode].many}/Tag, ${p.R} Wiederholungstage`}).join(' · ');
    if(ex.length)toast('Plan neu verteilt',msg);return}
  if(e.target.matches('[data-exmode]')){const ta=$('#ex-items');if(ta)ta.placeholder=LINES_PH[e.target.value];return}if(e.target.matches('[data-freq-type]')){const r=e.target.closest('[data-freq]'),v=e.target.value;r.querySelector('.fr-n').hidden=v!=='weekly';r.querySelector('.fr-d').hidden=v!=='days'}});
let dragId=null;
document.addEventListener('dragstart',e=>{const p=e.target.closest&&e.target.closest('[data-task]');if(!p)return;dragId=p.dataset.task;e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',dragId)}catch(_){}p.classList.add('dragging')});
document.addEventListener('dragend',()=>{dragId=null;document.querySelectorAll('.drop-over,.dragging').forEach(x=>x.classList.remove('drop-over','dragging'))});
document.addEventListener('dragover',e=>{if(!dragId)return;const z=e.target.closest('[data-drop]');if(!z)return;e.preventDefault();e.dataTransfer.dropEffect='move';document.querySelectorAll('.drop-over').forEach(x=>{if(x!==z)x.classList.remove('drop-over')});z.classList.add('drop-over')});
document.addEventListener('drop',e=>{if(!dragId)return;const z=e.target.closest('[data-drop]');if(!z)return;e.preventDefault();const x=S.tasks.find(t=>t.id===dragId);dragId=null;
  if(x&&x.due!==z.dataset.drop){x.due=z.dataset.drop;save();toast('To-do verschoben',`${x.title} → ${fmtLong(parseISO(x.due))}`)}refresh()});
document.addEventListener('change',e=>{const d=e.target.dataset||{};
  if(d.homeby!=null){dpState().homeBy=e.target.value;save();render();return}
  if(d.notif){const k=d.notif;if(k==='max')S.notif.max=+e.target.value;else if(k.startsWith('quiet.'))S.notif.quiet[k.slice(6)]=e.target.value;else S.notif[k]=e.target.checked;save();return}
  if(d.watch){if(d.watch==='on')S.watch.on=e.target.checked;else S.watch.after=Math.max(5,+e.target.value||20);save();return}
  if(e.target.dataset&&e.target.dataset.every){const pp=S.people.find(z=>z.id===e.target.dataset.every);pp.every=Math.max(1,parseInt(e.target.value,10)||14);save();render();return}
  const k=e.target.dataset&&e.target.dataset.rhy;if(!k)return;const v=e.target.type==='checkbox'?e.target.checked:e.target.type==='number'?+e.target.value:e.target.value;
  if(k.startsWith('reward.'))S.rhythm.reward[k.slice(7)]=v;else S.rhythm[k]=v;save();const sm=$('#ry-sum');if(sm)sm.textContent=`Runterfahren ${fromM(windMin())}, Licht aus ${fromM(bedMin())}`});
document.addEventListener('input',e=>{const w=e.target.dataset&&e.target.dataset.walk;if(w){S.settings.walk[w]=Math.max(0,Math.min(60,parseInt(e.target.value,10)||0));save()}});
setInterval(()=>{if(view==='zug'&&$('#overlay').hidden)render();const nc=$('#now-card');if(nc&&$('#overlay').hidden)nc.outerHTML=renderNow();checkWind();$('#side').innerHTML=renderSide();const c=$('#train-card');if(c)c.outerHTML=renderTrainCard();const wg=$('#widget');if(wg)wg.innerHTML=renderWidgetInner()},30000);
/* Finanzfeld: Vorschau beim Tippen, Tag per Datumsfeld, mehrere Zeilen einfügen */
function finPrevShow(){const q=$('#fin-in'),v=$('#fin-prev');if(q&&v)v.innerHTML=finPreview(q.value)}
document.addEventListener('input',e=>{if(e.target.id==='fin-in')finPrevShow()});
document.addEventListener('change',e=>{const t=e.target.dataset||{};if(t.fs&&FIN_SPLIT){FIN_SPLIT.sel[t.fs]=e.target.checked;return}if(t.fsdate!=null&&e.target.value){finSplitTo(e.target.value);return}});
document.addEventListener('change',e=>{if(e.target.dataset&&e.target.dataset.finday!=null&&e.target.value){finSetDay(e.target.value);const q=$('#fin-in'),v=q?q.value:'';refresh();const n=$('#fin-in');if(n){n.value=v;n.focus();finPrevShow()}}});
document.addEventListener('paste',e=>{const q=e.target;if(!q||q.id!=='fin-in')return;const t=(e.clipboardData&&e.clipboardData.getData('text/plain'))||'';if(!/[\r\n]/.test(t))return;e.preventDefault();
  const ins=t.split(/[\r\n]+/).map(x=>x.trim()).filter(Boolean).join('; '),a=q.selectionStart??q.value.length,b=q.selectionEnd??a;q.value=q.value.slice(0,a)+ins+q.value.slice(b);q.setSelectionRange(a+ins.length,a+ins.length);finPrevShow()});
document.addEventListener('input',e=>{const k=e.target.dataset&&e.target.dataset.lead;if(k){const v=Math.max(0,Math.min(60,parseInt(e.target.value,10)||0));S.settings.lead[k]=v;save()}});
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if($('#overlay').hidden)openQuick();else closeOverlay()}
  else if(e.key==='Escape'&&!$('#overlay').hidden)closeOverlay()
  else if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role="button"][data-act]')){e.preventDefault();e.target.click()}});

