/* ---------- Tagesfluss: Fixes mit Uhrzeit, Flexibles als Reihenfolge ---------- */
function speedOf(x){const sm=S.speed[x.id]||[],m=sm.reduce((a,b)=>a+b.m,0),n=sm.reduce((a,b)=>a+b.n,0);if(m>=40)return n/m*60;return x.mode==='pages'?(x.pph||12):1}
const r5=n=>Math.max(5,Math.round(n/5)*5);
const fmtDur=m=>m<60?`${m} min`:`${Math.floor(m/60)} h${m%60?' '+pad(m%60):''}`;
function dpState(){const ds=iso(TODAY());S.dayPlan=S.dayPlan||{};if(!S.dayPlan[ds]){S.dayPlan[ds]={order:[],done:{},skip:{},homeBy:null,outDep:null};const ks=Object.keys(S.dayPlan).sort();while(ks.length>7)delete S.dayPlan[ks.shift()]}return S.dayPlan[ds]}
function tripsOn(dir){if(liveOk()){const ds=iso(TODAY()),mm=d=>{const x=new Date(d);return diffDays(TODAY(),new Date(x.getFullYear(),x.getMonth(),x.getDate()))*1440+x.getHours()*60+x.getMinutes()};
    return (LIVE.dirs[dir]||[]).filter(x=>!x.cx&&iso(new Date(x.plan))===ds).map(x=>({m:mm(x.plan),line:cleanLine(x.line),dur:Math.max(5,Math.round((new Date(x.arrPlan)-new Date(x.plan))/6e4)),delay:x.delay,dep:mm(x.act),arr:mm(x.arrAct||x.arrPlan)}))}
  const d=TODAY(),out=[];for(let h=5;h<24;h++){(dir==='w2p'?[8,38]:[12,42]).forEach(m=>out.push({m:h*60+m,line:'S2',dur:24}));if(d.getDay()%6!==0&&(dir==='w2p'?(h>=6&&h<=8):(h>=16&&h<=18)))out.push({m:h*60+(dir==='w2p'?23:27),line:'REX 2',dur:19})}
  return out.sort((a,b)=>a.m-b.m).map(s=>{const r=hash01(iso(d)+dir+s.m),delay=r<.62?0:r<.88?1+Math.floor((r-.62)*11):r<.97?5+Math.floor((r-.88)*66):0;return {...s,delay,cx:r>=.97,dep:s.m+delay,arr:s.m+delay+s.dur}}).filter(x=>!x.cx)}
function bibTrips(){const dp=dpState(),R=S.rhythm,nm=nowMin(),walk=S.settings.walk.w;
  if(dp.outDep==null){const mDone=S.routines.morning.every(i=>rtDone('morning',i)),ready=Math.max(nm,toMin(R.wake))+(mDone?0:R.morningMin);const t=tripsOn('w2p').find(x=>x.dep-walk>=ready);dp.outDep=t?t.m:null;save()}
  const out=dp.outTaken||tripsOn('w2p').find(x=>x.m===dp.outDep);
  const tr=S.habits.find(h=>/training/i.test(h.name)),trDue=tr&&(habState(tr).open)&&sportAt()!=null;
  const hb=dp.homeBy||(trDue?'training':'17:00');let back;
  const minBack=out?Math.min(out.arr??((out.dep??out.m)+25),dp.outArrived!=null?dp.outArrived-R.bibWay:1e9)+R.bibWay*2+45:0; // erst hin, mindestens 45 min in der Bib, dann heim
  if(hb==='training'){const lim=(sportAt()??toMin(R.sport))-15;back=tripsOn('p2w').filter(x=>x.arr+walk<=lim&&x.dep>=minBack).pop()}
  else back=tripsOn('p2w').find(x=>x.dep>=Math.max(toMin(hb)+R.bibWay,minBack));
  if(!back&&out)back=tripsOn('p2w').find(x=>x.dep>=minBack);
  if(dp.backTaken)back=dp.backTaken;
  return {out,back,hb,trDue,outArr:dp.outArrived??null,homeArr:dp.homeArrived??null}}
/* An Bib-Tagen: ab wann bist du wieder daheim (für Haushalt) */
function homeAt(){if(modeToday()!=='bib')return 0;try{const b=bibTrips();if(b.homeArr!=null)return b.homeArr;return b.back?b.back.arr+S.settings.walk.w:0}catch(e){return 0}}
/* Ein Termin mit Essen um die Mittagszeit (Beginn 10–16 Uhr, z. B. „Essen Oma Opa“, „Mittagessen mit Lisa“) ersetzt „Kochen und Essen“. */
const MEAL_RE=/(^|[\s,;:(\-])(essen|mittagessen|abendessen|lunch|brunch|grillen|grillerei|restaurant|kochen)(?=$|[\s,;:)\-!.])/i;
function mealEvent(ds){return myEventsOn(ds).find(e=>!e.allDay&&MEAL_RE.test(e.title)&&toMin(e.start)>=600&&toMin(e.start)<=960)||null}
function flexItems(){const ds=iso(TODAY()),nm=nowMin(),R=S.rhythm,dp=dpState(),items=[];
  const mN=S.routines.morning.filter(i=>!rtDone('morning',i)).length;
  // Bib-Tag: Morgenroutine gehört VOR die Hinfahrt. Schon unterwegs/los → weg; zu knapp → gekürzt + „Späteren Zug“ (place, it.by)
  let mBy=null,mSkip=false;if(mN&&modeToday()==='bib'){if(dp.outTaken||dp.outArrived!=null)mSkip=true;else{try{const b=bibTrips();if(b.out)mBy=b.out.dep-S.settings.walk.w}catch(e){}if(mBy!=null&&nm>=mBy)mSkip=true}}
  if(mN&&!mSkip&&nm<toMin('12:00'))items.push({by:mBy,k:'morning',title:'Morgenroutine',sub:`noch ${mN} von ${S.routines.morning.length}`,dur:Math.max(5,Math.round(R.morningMin*mN/S.routines.morning.length)),cls:'c-privat',body:`<ul class="rts">${rtRows('morning')}</ul>`,step:'Erst Zähne, dann der Rest.',fixedDur:true,essential:true});
  activeExams().forEach(x=>{const p=studyPlan(x);if(!p.today)return;const k='st:'+x.id;
    const rv=revToday(x,p);if(rv&&rv.left.length)items.push({k:'rv:'+x.id,title:`${x.subject}: Wiederholen`,sub:`${rv.left.length} ${rv.left.length===1?UNIT[x.mode].one:UNIT[x.mode].many} kurz abrufen, je ${REV_MIN[0]}–${REV_MIN[2]} min`,dur:r5(Math.max(10,rv.leftMin)),cls:'c-'+x.color,
      body:revBlock(x,rv),act:{a:'tl-toggle',k:'rv:'+x.id,txt:'Abhaken'},study:true,tip:'Erst wiederholen, dann Neues: Abrufen ist das, was hängen bleibt.'});
    if(p.today.type==='review'){if((x.reviewLog||{})[ds])return;items.push({k,title:`${x.subject}: Wiederholung`,sub:p.today.last?'Gesamtwiederholung und Altfragen':reviewLabel(x,p.today.a,p.today.b),dur:120,cls:'c-'+x.color,body:studyToday(x),act:{a:'st-review',id:x.id,txt:'Erledigt'},study:true});return}
    if(p.doneToday>=p.today.amt)return;const rem=p.today.amt-p.doneToday,sg=segs(x,p.doneBefore+p.doneToday,p.today.b);
    const dur=x.mode==='lectures'?sg.reduce((a,g)=>a+(g.dur||90),0)+10*(sg.length-1):r5(rem/speedOf(x)*60);
    const sub=x.mode==='lectures'?sg.map(g=>g.name).join(', '):`${rem} ${rem===1?UNIT[x.mode].one:UNIT[x.mode].many}${x.mode==='pages'?` · ${sg.map(g=>g.range).join(', ')}`:''}`;
    items.push({k,title:x.subject,sub,dur,cls:'c-'+x.color,body:studyToday(x,'norev'),act:{a:'focus-start',id:x.id,txt:x.mode==='lectures'?'Vorlesung starten':'Fokus'},study:true,lect:x.mode==='lectures',
      est:x.mode==='pages'?`bei ${fmtN(speedOf(x))} S./h${(S.speed[x.id]||[]).length?' (dein Tempo)':''}`:x.mode==='lectures'?'Länge der Vorlesungen':'',
      step:x.mode==='lectures'?'Vorlesung öffnen, Play drücken. Notizen nebenbei.':x.mode==='pages'?'Buch aufschlagen, eine Seite lesen.':'Erste Stichworte notieren.'})});
  if(R.lunch&&!dp.done.lunch&&!mealEvent(ds)&&!(fxOv(ds).lunch&&fxOv(ds).lunch.off)&&nm<Math.max(toMin(R.lunch),(fxOv(ds).lunch||{}).s||0,(dp.essAt||{}).lunch||0)+300)items.push({k:'lunch',...(modeToday()==='bib'?{title:'Mittagspause',sub:'mitgebrachtes Essen, kurz raus',dur:Math.min(30,R.lunchMin),step:'Essen auspacken, kurz raus. Handy weg.'}:{title:'Kochen und Essen',sub:'Pause, ohne Bildschirm',dur:R.lunchMin,step:'Kochen, essen, kurz raus. Handy weg.'}),cls:'c-hol',act:{a:'flex-done',k:'lunch',txt:'Erledigt'},fixedDur:true,essential:true,at:(dp.essAt&&dp.essAt.lunch!=null)?dp.essAt.lunch:(fxOv(ds).lunch&&fxOv(ds).lunch.s!=null)?fxOv(ds).lunch.s:toMin(R.lunch)});
  const rs=S.replies.slice().sort((a,b)=>a.added.localeCompare(b.added));
  if(rs.length)items.push({k:'ppl',title:'Menschen',sub:rs.slice(0,2).map(r=>`${r.name} · ${kindOf(r).s}`).join(', ')+(rs.length>2?` +${rs.length-2}`:''),dur:Math.min(30,rs.reduce((a,r)=>a+(r.kind==='call'?10:5),0)),cls:'c-bday',body:`<ul class="rps">${rs.slice(0,4).map(r=>replyRow(r,true)).join('')}</ul>`,act:{a:'reply-round',txt:rs.length>1?'10-min-Runde':`${rs[0].kind==='call'?10:5}-min-Timer`},act2:rs.length===1?{a:'reply-done',id:rs[0].id,txt:'Erledigt'}:null,step:kindOf(rs[0]).step,snipR:rs[0],split:10});
  S.tasks.filter(inPlanToday).forEach(x=>items.push({k:'t:'+x.id,title:x.title,sub:x.due?fristTxt(x):'To-do',dur:x.mins||15,cls:'c-task',act:{a:'todo-sprint',id:x.id,txt:`${x.mins||15}-min-Timer`},act2:{a:'plan-task-done',id:x.id,txt:'Erledigt'},step:'Nur anfangen, die ersten 2 Minuten.',taskId:x.id}));
  const td=nowTasks(),ov=S.tasks.filter(todoOver);
  if(td.length)items.push({k:'todos',title:'To-dos',sub:td.slice(0,2).map(x=>x.title+(x.due?` (${fristTxt(x)})`:'')).join(', ')+(td.length>2?` +${td.length-2}`:''),dur:Math.min(60,td.length*15),cls:'c-task',body:`<ul class="tasks">${td.map(x=>taskRow(x,{list:false})).join('')}</ul>${ov.length?`<button class="lieg" data-act="triage"><span>${ov.length} liegengeblieben</span><span class="link">Neu sortieren</span></button>`:''}`,step:td[0].title+(td[0].due?`, ${fristTxt(td[0])}`:''),split:15,act:{a:'todo-sprint',txt:'15-min-Sprint'}});
  const dc=dueChores();if(dc.length)items.push({k:'chores',title:'Haushalt',sub:dc.map(c=>c.name).join(', '),dur:dc.reduce((a,c)=>a+c.mins,0),cls:'c-task',body:`<ul class="rts">${dc.map(c=>`<li><button class="rt" data-act="chore-done" data-id="${c.id}"><span class="chk">${ic('check',11)}</span><span class="rt-t">${esc(c.name)}</span><span class="rt-m">${c.mins} min</span></button></li>`).join('')}</ul>`,act:{a:'sprint',txt:'10-min-Sprint'},step:'Ein 10-Minuten-Sprint reicht.',split:10,notBefore:homeAt()});
  /* „Rest auf morgen“ (13.11.2026): dp.cap[k] = so viele Minuten bleiben heute, der Rest ist weg (der Lernplan verteilt ab morgen neu). */
  return items.filter(i=>!dp.skip[i.k]).map(i=>{const c=(dp.cap||{})[i.k];return c&&i.dur>c?{...i,dur:c,sub:`${i.sub} · Rest morgen`}:i})}
function fixedBlocks(){const ds=iso(TODAY()),R=S.rhythm,f=[],nm=nowMin(),walk=S.settings.walk.w;
  myEventsOn(ds).forEach(e=>f.push({k:'ev'+e.id,s:toMin(e.start),e:toMin(e.end),title:e.title,sub:CAL[e.cal].name,cls:'c-'+e.cal,act:{a:'edit-event',id:e.id,txt:'Details'}}));
  if(modeToday()==='bib'){const b=bibTrips();
    const dp=dpState(),tAct=(k,taken,there,late)=>taken?{act:{a:'trip-choose',k,txt:'Anderer Zug'},act2:{a:'trip-there',k,txt:there}}
      :late?{act:{a:'trip-in',k,txt:'Sitz im Zug'},act2:{a:k==='out'?'missed-train':'missed-back',k,txt:'Schaff ich nicht'}}:{act:{a:'trip-in',k,txt:'Sitz im Zug'},act2:{a:'trip-there',k,txt:there}};
    const tk=(t)=>t&&t.dep>nm+1?'Nimmst du: ':'Im Zug: ';
    if(b.out){const arr=b.outArr,o={k:'out',s:Math.min(b.out.dep-walk,arr??1e9),e:arr!=null?arr:b.out.arr+R.bibWay,title:'Fahrt in die Bib',sub:arr!=null?`angekommen um ${fromM(arr)}`:`${dp.outTaken?tk(dp.outTaken):`${walk} min zu Fuß · `}${b.out.line} ${fromM(b.out.dep)}${b.out.delay?` (+${b.out.delay})`:''} → ${ortB()} ${fromM(b.out.arr)} · ${R.bibWay} min zur Bib`,cls:'c-uni',travel:true,tip:arr!=null?null:'Im Zug: Anki-Karten oder eine Sprachnachricht.'};
      if(arr==null&&!(dp.backTaken||b.homeArr!=null||nm>b.out.arr+R.bibWay+20))Object.assign(o,tAct('out',!!dp.outTaken,'Schon in der Bib',nm>=b.out.dep-walk&&nm<b.out.dep+30));f.push(o)}
    if(b.back){const arr=b.homeArr,o={k:'back',s:Math.min(b.back.dep-R.bibWay,arr??1e9),e:arr!=null?arr:b.back.arr+walk,title:'Heimfahrt',sub:arr!=null?`daheim seit ${fromM(arr)}`:`${dp.backTaken?tk(dp.backTaken):`${R.bibWay} min zum ${ortB()} · `}${b.back.line} ${fromM(b.back.dep)}${b.back.delay?` (+${b.back.delay})`:''} → ${ortA()} ${fromM(b.back.arr)}`,cls:'c-uni',travel:true};
      if(arr==null)Object.assign(o,tAct('back',!!dp.backTaken,'Schon daheim',nm>=b.back.dep-R.bibWay&&nm<b.back.dep+30));f.push(o)}}
  const ov=fxOv(ds),trS=ov.sport&&ov.sport.s!=null?ov.sport.s:toMin(R.sport);
  const tr=S.habits.find(h=>/training/i.test(h.name));if(tr&&!(ov.sport&&ov.sport.off)){const st=habState(tr);if(st.open||st.done)f.push({k:'sport',s:trS,e:trS+R.sportMin,title:'Training',sub:st.done?'erledigt':ov.sport&&ov.sport.on?`verschoben vom ${fmtShort(parseISO(ov.sport.mv))}`:ov.sport&&ov.sport.s!=null?`heute verschoben, sonst ${R.sport}`:tr.detail,cls:'c-training',done:st.done,act:st.done?null:{a:'toggle-habit',id:tr.id,date:ds,txt:'Erledigt'}})}
  const rwS=ov.reward&&ov.reward.s!=null?ov.reward.s:toMin(R.reward.start),rwD=((toMin(R.reward.end)-toMin(R.reward.start))%1440+1440)%1440; // Slot darf über Mitternacht gehen
  if(R.reward.on&&!(ov.reward&&ov.reward.off))f.push({k:'reward',s:rwS,e:rwS+rwD,title:'Freizeit',sub:'machen, worauf du Lust hast',cls:'c-privat',soft:true});
  // Runterfahren = Tagesende. Liegt es nach Mitternacht (spät aufstehen), steht es am Ende des laufenden Tages (> 1440);
  // nach Mitternacht bis „Licht aus“ zeigt der Block das Runterfahren von HEUTE NACHT (die Abendroutine zählt dann noch zum Vortag, rtDate).
  const wn=windMin(),w=wn<toMin(R.wake)&&nm<wn+R.wind?wn:dayEnd();f.push({k:'evening',s:w,e:w+S.rhythm.wind,title:'Runterfahren',sub:`Licht aus um ${fromM(bedMin())}`,cls:'c-hol',done:S.routines.evening.every(i=>rtDone('evening',i)),body:`<ul class="rts">${rtRows('evening')}</ul>`,end:true});
  f.forEach(x=>{if(!x.done)x.done=x.e<=nm});return f.sort((a,b)=>a.s-b.s)}
/* ---------- Tagesplaner-Engine (11.11.2026 neu, ein Konzept statt zwei Verteilern) ----------
   EIN Tag, EINE Zeitachse: von jetzt (frühestens Aufstehen) bis zum Tagesende = Beginn des Runterfahrens (dayEnd, hart).
   Darauf liegt in fester Rangfolge:
   1) Fixes    – echte Uhrzeiten (Termine, Zug, Training). Freizeit ist das einzige weiche Fix: Sie weicht allem und wird am Schluss gekürzt.
   2) Anker    – Lebenswichtiges (essential: Morgenroutine, Essen). Wird ZUERST und nach UHRZEIT gesetzt (Wunschzeit it.at, sonst sofort),
                 in beiden Modi gleich. Nie „passt nicht mehr“, nie über das Tagesende. Reicht der Platz nicht: siehe anchorSlot.
   3) Fluss    – alles andere, in Reihenfolge. Der EINZIGE Unterschied der beiden Modi:
                 automatisch = jedes Stück in die früheste Lücke, in die es passt (Freizeit zählt als belegt);
                 wie gezogen = strikt nacheinander ab jetzt, nichts rutscht heimlich nach vorne; To-dos/Haushalt füllen Lücken
                               (außer selbst gezogen, dp.pin); Freizeit blockiert nicht; Anker stehen im Weg wie Termine.
                 In beiden: Lernen/Teilbares teilt sich um Blöcke (Mindeststück: split, Vorlesung 45, sonst 20, Fortsetzung ab 10 min).
   4) Überhang – was bis zum Tagesende keinen Platz hat: keine Uhrzeit, steht unter dem Runterfahren, „Auf morgen“.
   planDay() liefert für alle Ansichten dieselbe Form (rows, placed, over, gaps …). */
function planDay(){const nm=nowMin(),R=S.rhythm,dp=dpState(),fixed=fixedBlocks(),flex=flexItems(),end=dayEnd();
  const keys=flex.map(i=>i.k);let order=dp.order.filter(k=>keys.includes(k));keys.forEach(k=>{if(!order.includes(k)){const si=k.startsWith('rv:')?order.indexOf('st:'+k.slice(3)):-1;if(k==='morning')order.unshift(k);else if(si>=0)order.splice(si,0,k);else order.push(k)}});
  const nbm=dp.nb||{},its=order.map(k=>{const i=flex.find(i=>i.k===k);return i&&nbm[k]>nm?{...i,notBefore:Math.max(i.notBefore||0,nbm[k])}:i});
  const {placed,over}=place(its,fixed,nm,end,{manual:!!dp.manual,pin:dp.pin});
  // Freizeit wird kürzer, wenn etwas hineinragt (fixe Termine wie Training oder Eingeplantes); < 15 min → fällt heute aus
  const rwI=fixed.findIndex(f=>f.k==='reward');if(rwI>=0){const rw=fixed[rwI];
    const best=freeSpans(rw.s,rw.e,[...fixed.filter(f=>f!==rw&&!f.end&&!f.done),...placed]).sort((x,y)=>(y.e-y.s)-(x.e-x.s))[0];
    if(!best||best.e-best.s<15)fixed.splice(rwI,1);
    else if(best.s!==rw.s||best.e!==rw.e)fixed[rwI]={...rw,s:best.s,e:best.e,sub:`heute kürzer: ${fmtDur(best.e-best.s)}`}}
  const rows=[...fixed.filter(f=>!f.done||f.e>nm-1).map(f=>({...f,fixed:true})),...placed].sort((a,b)=>a.s-b.s||(a.fixed?-1:1));
  const start=Math.max(nm,toMin(R.wake));let busy=0,soft=0;fixed.filter(f=>!f.end&&!f.done).forEach(f=>{const a=Math.max(f.s,start),b=Math.min(f.e,end);if(b>a){busy+=b-a;if(f.soft)soft+=b-a}});
  const free=Math.max(0,end-start-busy),planned=placed.reduce((a,i)=>a+i.dur,0);
  placed.forEach(i=>{if(i.part)i.title=i.title+' · Fortsetzung'});over.forEach(i=>{if(i.part)i.title=i.title+' · Rest'});
  // echte Lücken bis zum Runterfahren: ohne fixe Blöcke (auch Training/Freizeit) und ohne schon eingeplante Sachen
  const gaps=freeSpans(start,end,[...fixed.filter(f=>!f.end&&!f.done),...placed]).filter(g=>g.e-g.s>=10).map(g=>[g.s,g.e]),left=gaps.reduce((t,[a,z])=>t+z-a,0);
  const cur=rows.find(r=>!r.done&&r.s<=nm&&r.e>nm&&!r.soft)||placed[0]||null;[...placed,...over].forEach(i=>{if(!i.first){i.body=null;i.act=null;i.act2=null;i.noTools=true}});
  rows.push(...over); // Überhang steht immer ganz unten, unter dem Runterfahren
  return {rows,placed,fixed,free,soft,planned,gaps,left,over,overMin:over.reduce((a,i)=>a+i.dur,0),cur,order,end,anchors:flex.filter(i=>i.essential).map(i=>i.k)}}
const FILLERS=['todos','chores'];
/* Freie Abschnitte [{s,e}] zwischen a und z, ohne die Blöcke (aufsteigend). */
function freeSpans(a,z,blocks){let fr=a<z?[[a,z]]:[];blocks.forEach(b=>{if(!(b.e>b.s))return;fr=fr.flatMap(([x,y])=>b.e<=x||b.s>=y?[[x,y]]:[[x,Math.max(x,b.s)],[Math.min(y,b.e),y]]).filter(([x,y])=>y-x>0)});
  return fr.sort((p,q)=>p[0]-q[0]).map(([s,e])=>({s,e}))}
/* Platz für einen Anker (Essen, Morgenroutine) in den freien Abschnitten sp, Wunschzeit tg. Reihenfolge der Versuche:
   a) volle Dauer ab der Wunschzeit (ist sie vorbei: ab jetzt), so früh wie möglich;
   b) volle Dauer VOR der Wunschzeit, so spät wie möglich;
   c) gekürzt, mindestens 20 min: möglichst lang und möglichst nah an der Wunschzeit (10 min Länge wiegen so viel wie 1 h Abstand);
   d) gar nichts frei → null, die Zeile bleibt ohne Uhrzeit stehen (nogap). */
function anchorSlot(it,sp,tg){let g=sp.find(g=>Math.max(g.s,tg)+it.dur<=g.e);if(g)return {s:Math.max(g.s,tg),len:it.dur};
  g=sp.filter(g=>g.s<tg&&g.e-g.s>=it.dur).pop();if(g)return {s:g.e-it.dur,len:it.dur};
  const min=Math.min(20,it.dur);let best=null;
  sp.filter(g=>g.e-g.s>=min).forEach(g=>{const len=Math.min(it.dur,g.e-g.s),s=Math.min(Math.max(g.s,tg),g.e-len),sc=len-Math.abs(s-tg)/6;if(!best||sc>best.sc)best={s,len,sc,short:true}});
  return best}
/* Verteilt items auf die Zeitachse. Ergebnis: placed (mit Uhrzeit) und over (Überhang, ohne Uhrzeit). */
function place(items,fixed,nm,end,opt){const manual=!!(opt&&opt.manual),pin=(opt&&opt.pin)||{},start=Math.max(nm,toMin(S.rhythm.wake)),out=[],over=[],list=items.filter(Boolean);
  const live=fixed.filter(f=>!f.end&&!f.done&&f.e>start),hard=live.filter(f=>!f.soft);
  const put=(it,s,len,part,extra)=>out.push({...it,...(extra||{}),s,e:s+len,dur:len,part,first:part===0,whole:it.dur});
  const rest=(it,left,part)=>over.push({...it,s:end,e:end,dur:left,part,first:part===0,whole:it.dur,over:true});
  const spans=(blocks,from)=>freeSpans(Math.max(start,from||0),end,blocks);
  const hint=(b,miss)=>b?`Passte nicht mehr vor „${b.title}“ (${fmtDur(miss)} zu wenig), darum danach.`:null;
  const minOf=it=>it.split||(it.lect?45:20);
  // 2) Anker: zuerst, nach Uhrzeit. Freizeit steht ihnen nie im Weg. Morgenroutine vor dem Essen.
  list.filter(i=>i.essential).sort((a,b)=>(b.k==='morning')-(a.k==='morning')).forEach(it=>{const bl=[...hard,...out],sp=spans(bl),tg=Math.max(start,it.at??start);
    if(it.by!=null&&!sp.some(g=>Math.max(g.s,tg)+it.dur<=Math.min(g.e,it.by))){ // muss vor der Losgehzeit fertig sein und passt nicht mehr ganz → kürzen, sonst weg
      const g0=sp.find(g=>g.e>tg&&g.s<it.by);if(!g0)return;const s0=Math.max(g0.s,tg),len=Math.min(it.dur,it.by-s0,g0.e-s0);if(len<5)return;
      put(it,s0,len,0,{sub:`nur noch ${len} min bis du los musst`,act2:{a:'missed-train',txt:'Späteren Zug'},short:true});return}
    const sl=anchorSlot(it,sp,tg);
    if(!sl){put(it,start,0,0,{sub:it.k==='lunch'?'heute keine Lücke, zwischendurch essen':'heute keine freie Lücke',nogap:true});return}
    if(sl.short){put(it,sl.s,sl.len,0,{sub:`heute nur ${fmtDur(sl.len)}`,short:true});return}
    // wie gezogen: erklären, wenn der Anker hinter einen Termin rutschen musste
    let tip=null;if(manual&&sl.s>tg){const p=sp.filter(g=>g.e<=sl.s&&g.e>tg).pop();if(p)tip=hint(bl.find(b=>b.s<=p.e&&b.e>p.e),it.dur-(p.e-Math.max(p.s,tg)))}
    put(it,sl.s,sl.len,0,tip?{tip}:null)});
  const flow=list.filter(i=>!i.essential);
  if(!manual){ // 3a) automatisch: früheste passende Lücke
    flow.forEach(it=>{const sp=spans([...live,...out],it.notBefore);
      if(it.study||it.split){let left=it.dur,part=0;const min=minOf(it);
        for(const g of sp){const room=g.e-g.s;if(room>=left){put(it,g.s,left,part);left=0;break}
          if(room>=min||(part>0&&room>=10)){put(it,g.s,room,part);left-=room;part++}}
        if(left>0)rest(it,left,part);return}
      const g=sp.find(g=>g.e-g.s>=it.dur);if(g)put(it,g.s,it.dur,0);else rest(it,it.dur,0)});
    return {placed:out.sort((a,b)=>a.s-b.s),over}}
  // 3b) wie gezogen: genau seine Reihenfolge, nacheinander ab jetzt
  const bl=[...hard,...out.filter(o=>o.e>o.s)].sort((a,b)=>a.s-b.s);
  const skip=t=>{let mv=true;while(mv){mv=false;for(const b of bl)if(t>=b.s&&t<b.e){t=b.e;mv=true}}return t};
  /* Reiht ein Stück ab t ein und gibt zurück, wo es danach weitergeht. Passt es nicht vor den nächsten Block: Teilbares wird geteilt,
     Unteilbares kommt danach (mit Hinweis). Was bis zum Tagesende nicht unterkommt, wird Überhang. */
  const run=(it,t,min,canSplit,part,left)=>{let note=null;
    while(left>0){t=skip(t);if(t>=end)break;const nf=bl.find(b=>b.s>=t)||null,room=(nf?Math.min(nf.s,end):end)-t;
      if(room>=left){put(it,t,left,part,part===0&&note?{tip:note}:null);t+=left;left=0;break}
      if(canSplit&&(room>=min||(part>0&&room>=10))){put(it,t,room,part);t+=room;left-=room;part++;continue}
      if(!nf)break;if(part===0&&!canSplit)note=hint(nf,left-room);t=nf.e}
    if(left>0)rest(it,left,part);return t};
  const isFill=i=>FILLERS.includes(i.k)&&!pin[i.k];let c=start;
  flow.filter(i=>!isFill(i)).forEach(it=>{c=run(it,Math.max(c,it.notBefore||0),minOf(it),!!(it.study||it.split),0,it.dur)});
  // Lückenfüller (To-dos, Haushalt, solange nicht selbst gezogen): in freie Lücken vor dem letzten Block, sonst ans Ende
  const lastEnd=out.reduce((m,o)=>Math.max(m,o.e),start);c=Math.max(c,lastEnd);
  const gaps=spans([...bl,...out]).filter(g=>g.e-g.s>=10&&g.s<lastEnd).map(g=>({s:g.s,e:Math.min(g.e,lastEnd)}));
  flow.filter(isFill).forEach(it=>{const nb=it.notBefore||0,min=it.split||15;let left=it.dur,part=0;
    for(const g of gaps){if(left<=0)break;const s0=Math.max(g.s,nb),room=g.e-s0;if(room<=0)continue;
      if(room>=left){put(it,s0,left,part);g.s=s0+left;left=0;break}
      if(room>=min){put(it,s0,room,part);g.s=g.e;left-=room;part++}}
    if(left>0)c=Math.max(c,run(it,Math.max(c,nb),min,true,part,left))});
  return {placed:out.sort((a,b)=>a.s-b.s),over}}
/* Er legt k ausdrücklich VOR einen Anker („Als Nächstes“, oder in der Liste über das Essen gezogen). Steht der Anker danach trotzdem
   davor (weil er auf „jetzt“ liegt oder k nicht mehr davor passt), rückt der Anker hinter das erste Stück von k, so als hätte er ihn
   selbst dorthin gelegt (dp.essAt). Die Morgenroutine bleibt immer zuerst. Ohne das wäre „Als Nächstes“ bei fälligem Essen wirkungslos. */
function anchorsBehind(k,keys){const dp=dpState();(keys||[]).filter(a=>a!=='morning'&&a!==k).forEach(a=>{
  let P=planDay();const A=P.placed.find(z=>z.k===a),X=P.placed.find(z=>z.k===k&&z.first);if(!A||A.nogap||(X&&X.s<A.s))return;
  dp.essAt=dp.essAt||{};const old=dp.essAt[a];dp.essAt[a]=P.end;P=planDay();const X2=P.placed.find(z=>z.k===k&&z.first);
  if(X2)dp.essAt[a]=X2.e;else if(old==null)delete dp.essAt[a];else dp.essAt[a]=old})}
/* Freie Zeit als eigene, leise Zeile im Ablauf: „Frei · 1 h 39 – bis Training“ (nur Lücken ab 15 min) */
function withGaps(P){const nm=nowMin(),g=P.gaps.filter(([a,z])=>z-a>=15).map(([a,z])=>({gap:true,k:'gap'+a,s:a,e:z}));
  const all=[...P.rows,...g].sort((a,b)=>a.s-b.s||(a.gap?1:-1));
  g.forEach(x=>{const nx=all.find(r=>!r.gap&&!r.done&&r.s>=x.e-1);x.next=nx?nx.title:'Runterfahren';x.now=x.s<=nm});return all}
function gapRow(x){return `<li class="tl tl-gap ${x.now?'gnow':''}" data-k="${x.k}"><span class="tl-time mono">${x.now?'jetzt':fromM(x.s)}</span><span class="tl-dot"></span>
  <div class="tl-card"><span class="gap-t"><b>Frei</b> ${fmtDur(x.e-x.s)}<span> · bis ${esc(x.next)}</span></span></div></li>`}
function planRow(r,cur){const open=tlOpen.has(r.k)&&r.body,isCur=cur&&cur.k===r.k;
  const act=(r.act?`<button class="btn sm ${isCur?'primary':''}" data-act="${r.act.a}" ${r.act.id?`data-id="${r.act.id}"`:''} ${r.act.k?`data-k="${r.act.k}"`:''} ${r.act.date?`data-date="${r.act.date}"`:''}>${r.act.txt}</button>`:'')+(r.act2?`<button class="btn sm ghost" data-act="${r.act2.a}" ${r.act2.id?`data-id="${r.act2.id}"`:''} ${r.act2.k?`data-k="${r.act2.k}"`:''}>${r.act2.txt}</button>`:'');
  const tools=r.fixed||r.noTools?'':`<span class="pl-tools"><button class="icon-btn" data-act="flex-first" data-k="${r.k}" title="Als Nächstes" aria-label="Als Nächstes">${ic('first',14)}</button><button class="icon-btn" data-act="flex-later" data-k="${r.k}" title="Später" aria-label="Später">${ic('down',14)}</button><button class="icon-btn" data-act="flex-skip" data-k="${r.k}" title="${r.k==='lunch'||r.k==='morning'?'Heute weglassen':r.k.startsWith('t:')?'Zurück in die Liste':'Auf morgen'}" aria-label="${r.k.startsWith('t:')?'Zurück in die Liste':'Auf morgen'}">${ic('chevR',14)}</button></span>`;
  const time=r.fixed?`<span class="tl-time mono">${fromM(r.s)}</span>`:r.over||r.nogap?`<span class="tl-time mono ca" title="ohne Uhrzeit">–</span>`:`<span class="tl-time mono ca">ca. ${fromM(r.s)}</span>`;
  return `<li class="tl ${r.fixed?'fixed':'pl-flex'} ${r.done?'done':isCur?'now':'later'} ${r.over?'over':''} ${r.cls}" data-k="${r.k}">${time}<span class="tl-dot">${r.fixed?ic('pin',9):''}</span>
   <div class="tl-card"><div class="tl-top">${r.fixed?'':`<span class="drag-h" title="Ziehen zum Umsortieren">${ic('grip',14)}</span>`}
     ${r.body?`<button class="tl-head" data-act="tl-toggle" data-k="${r.k}" aria-expanded="${!!open}">`:'<div class="tl-head">'}<span class="tl-main"><b>${esc(r.title)}</b><span>${esc(r.sub||'')}</span></span>${r.body?'</button>':'</div>'}
     <span class="pl-dur mono">${r.fixed?`bis ${fromM(r.e)}`:r.nogap?fmtDur(r.whole):fmtDur(r.dur)+(r.whole&&r.whole!==r.dur?` von ${fmtDur(r.whole)}`:'')}</span></div>
    ${r.over&&!r.essential?`<p class="over-note">Passt heute nicht mehr vor dem Runterfahren. <button class="link" data-act="flex-skip" data-k="${r.k}"${r.whole-r.dur>0?` data-rest="${r.whole-r.dur}"`:''}>${r.whole-r.dur>0?'Rest auf morgen':'Auf morgen'}</button></p>`:''}
    ${r.tip&&!r.done?`<p class="pl-tip">${esc(r.tip)}</p>`:''}${r.est&&isCur?`<p class="pl-tip">Dauer geschätzt ${esc(r.est)}</p>`:''}
    ${(act||tools)&&!r.done?`<div class="tl-act">${act}${tools}</div>`:''}${open?`<div class="tl-body">${r.body}</div>`:''}</div></li>`}
function bibControls(){const m=modeToday();
  if(!m)return `<div class="dayctl"><span>Heute:</span><button class="chip" data-act="day-mode" data-m="bib">${ic('train',13)} Bib</button><button class="chip" data-act="day-mode" data-m="home">Daheim</button></div>`;
  if(m==='home')return `<div class="dayctl"><span>Heute daheim.</span><button class="link" data-act="day-mode" data-m="bib">Doch in die Bib</button></div>`;
  const b=bibTrips(),opts=[['training','rechtzeitig vors Training'],['15:00','ab ca. 15:00'],['16:00','ab ca. 16:00'],['17:00','ab ca. 17:00'],['18:00','ab ca. 18:00'],['19:00','ab ca. 19:00']].filter(o=>o[0]!=='training'||b.trDue);
  return `<div class="dayctl"><span>Bib-Tag · Heimfahrt</span><label class="sr" for="home-by">Heimfahrt</label><select id="home-by" data-homeby>${opts.map(([k,l])=>`<option value="${k}" ${b.hb===k?'selected':''}>${l}</option>`).join('')}</select>
    <button class="link" data-act="missed-train">Zug verpasst?</button><button class="link" data-act="day-mode" data-m="home">Doch daheim</button></div>`}

