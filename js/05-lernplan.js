/* ---------- Lernplan ---------- */
const UNIT={pages:{one:'Seite',many:'Seiten',short:'S.'},topics:{one:'Thema',many:'Themen',short:'Themen'},lectures:{one:'Vorlesung',many:'Vorlesungen',short:'VL'}};
const examTotal=x=>x.items.reduce((a,i)=>a+i.size,0);
const fmtN=n=>(Math.round(n*10)/10).toLocaleString('de-AT');
function studyDays(from,to){const out=[];for(let d=new Date(from);d<to;d=addDays(d,1))if(!S.studyRest.includes(d.getDay())&&!isOff(iso(d)))out.push(new Date(d));return out}
function initExamMeta(x){const n=studyDays(parseISO(x.start),parseISO(x.date)).length;
  if(x.reviewAuto)x.reviewDays=Math.max(1,Math.round(n*.2));x.reviewDays=Math.max(0,Math.min(x.reviewDays,n-1));
  x.baseRate=examTotal(x)/Math.max(1,n-x.reviewDays)}
/* Bewusste Planänderung (z. B. lernfreie Tage): Stoff neu verteilen, Wiederholungstage behalten */
function rebaseExam(x){const t=TODAY(),ts=iso(t),ex=parseISO(x.date),st=parseISO(x.start),from=st>t?st:t,total=examTotal(x);
  let done=0;Object.entries(x.log||{}).forEach(([d,v])=>{if(d<ts)done+=v});
  const avail=ex>from?studyDays(from,ex).length:0;if(total-done>0)x.reviewDays=Math.max(0,Math.min(x.reviewDays,avail-1)); // Stoff durch → Wiederholungstage bleiben, wie sie sind
  x.baseRate=Math.max(0,total-done)/Math.max(1,avail-x.reviewDays);x.rebased=ts}
function changeOff(fn){const ex=activeExams(),before=ex.map(x=>studyPlan(x).rate);fn();S.studyOff.sort((a,b)=>a.date.localeCompare(b.date));ex.forEach(rebaseExam);save();render();
  if(ex.length)toast('Plan neu verteilt',ex.map((x,i)=>`${x.subject}: ${fmtN(before[i])} → ${fmtN(studyPlan(x).rate)} ${UNIT[x.mode].many}/Tag`).join(' · '))}
function offSuggestions(){const t=TODAY(),last=activeExams().reduce((m,x)=>x.date>m?x.date:m,'');if(!last)return [];
  const byDay={};S.events.forEach(e=>{if(e.date<iso(t)||e.date>=last)return;byDay[e.date]=(byDay[e.date]||0)+Math.max(0,toMin(e.end)-toMin(e.start))});
  return Object.entries(byDay).filter(([d,m])=>m>=360&&!isOff(d)&&!S.studyRest.includes(parseISO(d).getDay())&&!(S.offDismissed||[]).includes(d))
    .map(([d,m])=>({date:d,mins:m,titles:S.events.filter(e=>e.date===d).map(e=>e.title)})).sort((a,b)=>a.date.localeCompare(b.date))}
function segs(x,a,b){const out=[];let off=0;
  for(const it of x.items){const s=Math.max(a,off),e=Math.min(b,off+it.size);
    if(e>s){if(x.mode==='pages'){const ls=s-off,le=e-off,full=le-ls===it.size;out.push({name:it.name,range:it.from!=null?`S. ${it.from+ls}–${it.from+le-1}`:(full?'komplett':`S. ${ls+1}–${le} von ${it.size}`)})}
      else out.push({name:it.name,idx:off,dur:it.dur||90})}
    off+=it.size;if(off>=b)break}
  return out}
function reviewLabel(x,a,b){const sg=segs(x,a,b);if(!sg.length)return 'Wiederholung';return sg.length===1?sg[0].name:`${sg[0].name} bis ${sg[sg.length-1].name}`}
function studyPlan(x){const t=TODAY(),ts=iso(t),ex=parseISO(x.date),total=examTotal(x),log=x.log||{};
  let doneBefore=0;Object.entries(log).forEach(([d,v])=>{if(d<ts)doneBefore+=v});doneBefore=Math.min(doneBefore,total);
  const doneToday=Math.min(log[ts]||0,total-doneBefore);
  const st=parseISO(x.start),from=st>t?st:t,days=ex>from?studyDays(from,ex):[],avail=days.length,rem=total-doneBefore;
  const cap=x.cap||Math.max(1,Math.ceil(x.baseRate*1.3));
  /* Wiederholungstage am Ende. Repariert 10.11.2026: Vorher war R immer höchstens Resttage − 1, der heutige Tag also immer ein Lerntag
     (mit Pensum 0, wenn der Stoff durch war). Die Wiederholungstage kamen so nie in „Dein Tag“ an.
     Solange noch Stoff offen ist, bleibt mindestens ein Lerntag (wie bisher). Ist der Stoff durch (rem = 0), ist das Fenster fest:
     die letzten reviewDays Lerntage vor der Prüfung, frühestens ab dem Tag nach dem letzten Lernen. `passed` = Tage des Fensters, die
     schon vorbei sind; damit bekommt jeder Tag seinen eigenen Abschnitt, und der letzte bleibt die Gesamtwiederholung. */
  let R,passed=0;
  if(rem>0||!avail)R=Math.min(x.reviewDays,Math.max(0,avail-1));
  else{const lastLearn=Object.keys(log).filter(d=>d<ts&&log[d]>0).sort().pop(),w0=lastLearn?addDays(parseISO(lastLearn),1):st,
      before=w0<from?studyDays(w0,from).length:0,Rtot=Math.min(x.reviewDays,before+avail);R=Math.min(Rtot,avail);passed=Rtot-R}
  let L=avail-R;
  while(R>0&&L>0&&rem/L>cap){R--;L++}
  const Rt=R+passed;
  const rate=L?rem/L:0,over=rate>cap+1e-9;
  const plan=days.map((d,k)=>{if(k<L){const a=doneBefore+Math.round(rem*k/L),b=doneBefore+Math.round(rem*(k+1)/L);return {d,type:'learn',a,b,amt:b-a}}
    const j=k-L+passed,a=Math.round(total*j/Rt),b=Math.round(total*(j+1)/Rt);return {d,type:'review',a,b,last:j===Rt-1&&Rt>1}});
  const today=plan.find(p=>iso(p.d)===ts)||null;
  if(today&&today.type==='learn'){x.targets=x.targets||{};x.targets[ts]=today.amt}
  const doneAll=doneBefore+doneToday;
  let after=null;if(today&&today.type==='learn'&&doneToday<today.amt){const left=total-doneAll,nl=Math.max(1,L-1);after={rate:left/nl,shrink:left/nl>cap}}
  return {total,doneBefore,doneToday,doneAll,rem,avail,R,R0:x.reviewDays,L,rate,cap,over,plan,today,after,daysLeft:diffDays(t,ex),started:st<=t}}
/* Verteiltes Wiederholen mit Abrufübung (Spacing + Testing-Effekt): jede gelernte Einheit kommt 3× kurz wieder,
   mit wachsenden Abständen: 1 Tag nach dem Lernen, 3 Tage nach der 1. Runde, 7 Tage nach der 2. Runde.
   Gerechnet ab dem TATSÄCHLICHEN Erledigen (verpasst = rutscht, geht nicht verloren). Max. REV_CAP min pro Tag, Älteste zuerst.
   Was in die Wiederholungstage am Ende fallen würde, übernehmen die. Nur Vorlesungen/Themen (nicht Seiten). x.revHist=[{i,d}] */
const REV_GAP=[1,3,7],REV_MIN=[10,10,15],REV_CAP=75,REV_LAB=['von gestern','2. Runde','3. Runde'];
function learnedOn(x){const out=[];let c=0;Object.keys(x.log||{}).sort().forEach(d=>{const v=x.log[d]||0;for(let j=0;j<v;j++){out.push({i:c,d,off:v>4?Math.floor(j/2):0});c++}});return out.slice(0,examTotal(x))}
function revToday(x,p){p=p||studyPlan(x);const ts=iso(TODAY());if(x.mode==='pages'||!p.today||p.today.type!=='learn')return null;
  const endRev=(p.plan.find(z=>z.type==='review')||{}).d,hist=x.revHist||[],items=x.items||[];
  const by={};hist.forEach(h=>{(by[h.i]=by[h.i]||[]).push(h.d)});
  const done=[],due=[];
  learnedOn(x).forEach(l=>{const hs=(by[l.i]||[]).slice().sort(),n=hs.filter(d=>d<ts).length;
    if(hs.includes(ts)){done.push({i:l.i,n:n,stage:n});return}
    if(n>=REV_GAP.length||l.d>=ts)return;
    const base=n===0?addDays(parseISO(l.d),l.off):parseISO(hs[n-1]),dd=iso(addDays(base,REV_GAP[n]));
    if(dd>ts||(endRev&&dd>=iso(endRev)))return;due.push({i:l.i,stage:n,due:dd})});
  due.sort((a,b)=>a.due.localeCompare(b.due)||a.i-b.i);
  let mins=done.reduce((t,r)=>t+REV_MIN[r.stage],0);const list=[...done.map(r=>({...r,on:true}))];
  for(const r of due){if(mins+REV_MIN[r.stage]>REV_CAP&&list.length)break;mins+=REV_MIN[r.stage];list.push(r)}
  const name=i=>{let off=0;for(const it of items){if(i<off+it.size)return it.name;off+=it.size}return 'Einheit '+(i+1)};
  list.forEach(r=>{r.name=name(r.i);r.late=r.due&&r.due<ts});list.sort((a,b)=>a.i-b.i);
  const left=list.filter(r=>!r.on);return {list,left,mins,leftMin:left.reduce((t,r)=>t+REV_MIN[r.stage],0),more:due.length-(list.length-done.length)}}
function revBlock(x,rv){if(!rv||!rv.list.length)return '';
  return `<div class="st-rev"><span class="st-rev-h"><span class="tag review">Wiederholen</span> ca. ${fmtDur(rv.mins)}</span>
   <div class="topics">${rv.list.map(r=>`<button class="topic ${r.on?'on':''}" data-act="st-rev" data-id="${x.id}" data-i="${r.i}"><span class="chk ${r.on?'on':''}">${ic('check',11)}</span><span>${esc(r.name)} <small>${REV_LAB[r.stage]}${r.late?' · liegt schon':''}</small></span></button>`).join('')}</div>
   <p class="st-how">Pro Einheit ${REV_MIN[0]}–${REV_MIN[2]} min: Unterlagen zu, aufschreiben was du noch weißt, dann vergleichen und Lücken markieren. Gibt’s Altfragen dazu, 3–5 davon.</p></div>`}
function toggleRev(x,i){const ts=iso(TODAY());x.revHist=x.revHist||[];const k=x.revHist.findIndex(h=>h.i===i&&h.d===ts);
  if(k>=0)x.revHist.splice(k,1);else x.revHist.push({i,d:ts});save();
  const rv=revToday(x);if(rv&&!rv.left.length&&k<0)toast('Wiederholen geschafft','Das bleibt jetzt deutlich besser hängen.');refresh()}
function examStatus(x,p){if(p.daysLeft<0)return {cls:'st-done',txt:'vorbei'};if(p.daysLeft===0)return {cls:'st-bad',txt:'Prüfung heute'};
  if(!p.started)return {cls:'st-done',txt:`startet ${fmtShort(parseISO(x.start))}`};
  if(p.doneAll>=p.total)return {cls:'st-ok',txt:'Stoff durch, nur noch Wiederholen'};
  if(p.over)return {cls:'st-bad',txt:`Zu viel: ${fmtN(p.rate)} ${UNIT[x.mode].many}/Tag nötig`};
  if(p.R<p.R0)return {cls:'st-warn',txt:`Puffer angebrochen: ${p.R} von ${p.R0} Wiederholungstagen übrig`};
  return {cls:'st-ok',txt:'im Plan'}}
const activeExams=()=>S.exams.filter(x=>diffDays(TODAY(),parseISO(x.date))>=0).sort((a,b)=>a.date.localeCompare(b.date));
/* Offene Wiederholungstage heute (der Block am Ende vor der Prüfung). Zählen seit 13.11.2026 als offenes Lernen (vorher nur neues Pensum und 1/3/7-Runden). */
function reviewOpen(){const ts=iso(TODAY());return activeExams().filter(x=>{const p=studyPlan(x);return p.today&&p.today.type==='review'&&!(x.reviewLog||{})[ts]})}
function studyOpenCount(){return activeExams().filter(x=>{const p=studyPlan(x);return p.today&&p.today.type==='learn'&&p.doneToday<p.today.amt}).length+reviewOpen().length}
function syncLernenHabit(){const ts=iso(TODAY()),todo=activeExams().map(x=>({x,p:studyPlan(x)})).filter(o=>o.p.today&&(o.p.today.type==='review'||o.p.today.amt>0));
  if(!todo.length||!todo.every(o=>o.p.today.type==='review'?!!(o.x.reviewLog||{})[ts]:o.p.doneToday>=o.p.today.amt))return false;const h=S.habits.find(h=>/lernen/i.test(h.name));if(h&&!h.log[ts]){h.log[ts]=true;return true}return false}
function setStudy(x,v){const ts=iso(TODAY()),p=studyPlan(x),max=p.total-p.doneBefore;x.log=x.log||{};x.log[ts]=Math.max(0,Math.min(max,v));save();
  const p2=studyPlan(x);if(p2.today&&p2.today.type==='learn'&&p2.doneToday>=p2.today.amt&&p.doneToday<p.today.amt){const hb=syncLernenHabit();save();toast(`${x.subject}: Tagespensum geschafft`,hb?'Habit „Lernen“ automatisch abgehakt.':'')}refresh()}
function studyToday(x,compact){const p=studyPlan(x),t=p.today,u=UNIT[x.mode];
  const head=`<div class="st-head"><b>${esc(x.subject)}</b><span>Prüfung ${fmtShort(parseISO(x.date))} · ${inLabel(p.daysLeft)}</span></div>`;
  if(p.daysLeft===0)return `<div class="study c-${x.color}">${head}<span class="st-note warn">Heute ist die Prüfung. Viel Erfolg!</span></div>`;
  if(!p.started)return `<div class="study c-${x.color}">${head}<span class="st-note">Lernplan startet ${fmtLong(parseISO(x.start))}.</span></div>`;
  if(!t)return `<div class="study c-${x.color}">${head}<span class="st-note">Heute lernfrei. Morgen geht’s weiter.</span></div>`;
  if(t.type==='review'){const done=!!(x.reviewLog||{})[iso(TODAY())];
    return `<div class="study c-${x.color}">${head}<div class="st-segs"><span><span class="tag review">Wiederholung</span> ${esc(t.last?'Gesamtwiederholung und Altfragen':reviewLabel(x,t.a,t.b))}</span></div>
     <div class="logger"><button class="btn sm ${done?'primary':''}" data-act="st-review" data-id="${x.id}">${ic('check',14)} ${done?'Erledigt':'Als erledigt markieren'}</button></div></div>`}
  const sg=segs(x,t.a,t.b),done=p.doneToday,ok=done>=t.amt;
  let body;
  if(x.mode!=='pages'){const top=(g,i)=>{const on=i<done;return `<button class="topic ${on?'on':''}" data-act="st-topic" data-id="${x.id}" data-i="${i}"><span class="chk ${on?'on':''}">${ic('check',11)}</span><span>${esc(g.name)}</span></button>`};
    const upto=Math.min(Math.max(done,t.amt)+1,p.total-p.doneBefore),ex=upto>t.amt?segs(x,t.b,t.a+upto):[];
    body=`<div class="topics">${sg.map(top).join('')}</div>${ex.length?`<div class="st-more"><span>${done>=t.amt?'Mehr Lust? Vorarbeiten:':'Danach weiter mit:'}</span><div class="topics">${ex.map((g,k)=>top(g,t.amt+k)).join('')}</div></div>`:''}`}
  else{body=`<div class="st-segs">${sg.map(g=>`<span>${esc(g.name)} <span class="mono">${g.range}</span></span>`).join('')}</div>
    <div class="logger"><button class="step" data-act="st-step" data-id="${x.id}" data-d="-1" aria-label="Eine Seite weniger">−</button><label class="sr" for="st-${x.id}">Heute geschafft</label><input id="st-${x.id}" type="number" min="0" value="${done}" data-study="${x.id}"><span class="of">/ ${t.amt} ${u.short}</span><button class="step" data-act="st-step" data-id="${x.id}" data-d="1" aria-label="Eine Seite mehr">+</button>${ok?'':`<button class="btn sm" data-act="st-all" data-id="${x.id}">Alles geschafft</button>`}</div>`}
  const note=ok?`<span class="st-note ok">${ic('check',13).replace('class="ic"','class="ic" style="display:inline;vertical-align:-2px"')} Tagespensum geschafft${done>t.amt?`, ${done-t.amt} ${done-t.amt===1?u.one:u.many} Vorsprung`:''}</span>`
    :p.after?`<span class="st-note ${p.after.shrink?'warn':''}">${done===0?'Falls heute nichts geht':'Was heute offen bleibt'}, verteilt sich auf die nächsten Lerntage: dann ${fmtN(p.after.rate)} ${u.many}/Tag${p.after.shrink?', der Puffer wird kleiner':''}.</span>`:'';
  const rvb=compact==='norev'?'':revBlock(x,revToday(x,p));
  return `<div class="study c-${x.color}">${head}${rvb}${x.mode!=='pages'?`<span class="st-note">Heute ${t.amt} ${t.amt===1?u.one:u.many}, ${done} erledigt</span>`:''}${body}${note}</div>`}
function renderLernen(){const ex=activeExams(),old=S.exams.filter(x=>!ex.includes(x)),t=TODAY();
  const card=x=>{const p=studyPlan(x),stt=examStatus(x,p),u=UNIT[x.mode],ts=iso(t);
    const st=parseISO(x.start),exd=parseISO(x.date),planMap={};p.plan.forEach(q=>planMap[iso(q.d)]=q);
    let strip='';for(let d=new Date(st);d<=exd;d=addDays(d,1)){const ds=iso(d),q=planMap[ds];let cls='',lab='',tip=fmtShort(d);
      if(ds===x.date){cls='exam';lab='P';tip+=' · Prüfung'}
      else if(d<t){const tg=(x.targets||{})[ds],dn=(x.log||{})[ds]||0;if((S.studyRest.includes(d.getDay())||isOff(ds))&&!tg){cls=isOff(ds)?'off':'rest'}else if(!tg){cls=dn?'full':'rest'}else{const r=dn/tg;cls=r>=1?'full':r>0?'part':'miss';tip+=` · ${dn}/${tg}`}}
      else if(q&&ds===ts&&q.type==='learn'){const dn=(x.log||{})[ds]||0;cls=dn>=q.amt?'full':dn>0?'part':'learn';lab=q.amt;tip+=` · ${dn}/${q.amt} ${u.many} heute`;if(cls==='part')x.targets=x.targets||{}}
      else if(q&&ds===ts&&q.type==='review'&&(x.reviewLog||{})[ds]){cls='full';lab='W';tip+=' · Wiederholung erledigt'}
      else if(q){cls=q.type;lab=q.type==='learn'?q.amt:'W';tip+=q.type==='learn'?` · ${q.amt} ${u.many}`:' · Wiederholung'}
      else cls=isOff(ds)?'off':'rest';
      if(isOff(ds)&&d>=t){cls='off';lab='';tip+=' · freier Tag (klicken zum Zurücknehmen)'}else if(d>=t&&ds!==x.date&&!S.studyRest.includes(d.getDay()))tip+=' · klicken: freien Tag nehmen';
      const pct=cls==='part'?Math.round(((x.log||{})[ds]||0)/((x.targets||{})[ds]||(q&&q.amt)||1)*100):0;
      const click=d>=t&&ds!==x.date&&!S.studyRest.includes(d.getDay());
      strip+=`<${click?'button type="button"':'span'} class="sd ${cls} ${ds===ts?'today':''} ${click?'clk':''}" title="${tip}" ${click?`data-act="toggle-off" data-date="${ds}" aria-label="${tip}"`:''} ${cls==='part'?`style="--pct:${pct}%"`:''}><i>${x.mode==='pages'&&cls==='learn'?'':lab}</i>${WD[d.getDay()][0]}${d.getDate()===1||ds===x.start?`<br>${d.getDate()}.${d.getMonth()+1}.`:''}</${click?'button':'span'}>`}
    const rows=p.plan.slice(0,showFull[x.id]?999:8).map(q=>{const isT=iso(q.d)===ts;
      const c=q.type==='learn'?segs(x,q.a,q.b).map(g=>x.mode==='pages'?`${esc(g.name)} <span class="mono" style="color:var(--muted)">${g.range}</span>`:esc(g.name)).join(' · '):(q.last?'Gesamtwiederholung und Altfragen':`Wiederholung ${esc(reviewLabel(x,q.a,q.b))}`);
      return `<li class="pl ${isT?'today':''}"><span class="pl-d">${isT?'heute':fmtShort(q.d)}</span><span class="pl-t tag ${q.type}">${q.type==='learn'?'Neuer Stoff':'Wiederholung'}</span><span class="pl-c">${c||'<span style="color:var(--faint)">kein neuer Stoff</span>'}</span><span class="pl-a">${q.type==='learn'?`${q.amt} ${u.short}`:''}</span></li>`}).join('');
    const doneW=p.total?p.doneBefore/p.total*100:0,todayW=p.total?p.doneToday/p.total*100:0;
    return `<article class="card c-${x.color}"><div class="ex-head"><div><h2><i></i>${esc(x.subject)}</h2><p>Prüfung ${fmtLong(exd)} · ${inLabel(p.daysLeft)} · ${p.total} ${u.many} in ${x.items.length} Abschnitten</p></div>
      <div class="ex-right"><span class="status ${stt.cls}">${esc(stt.txt)}</span><button class="icon-btn" data-act="exam-edit" data-id="${x.id}" aria-label="Bearbeiten">${ic('gear',16)}</button></div></div>
     <div style="margin-top:14px" class="pbar"><i style="width:${doneW}%"></i><i class="today" style="width:${todayW}%"></i></div>
     <div class="pb-row"><span>${p.doneAll} von ${p.total} ${u.many} gelernt</span><span>${Math.round(p.doneAll/p.total*100)} %</span></div>
     <div class="ex-stats"><div class="stat"><b>${p.today&&p.today.type==='learn'?p.today.amt:'–'}</b><span>heute ${u.many}</span></div>
      <div class="stat"><b>${fmtN(p.rate)}</b><span>pro Lerntag <small>(Plan ${fmtN(x.baseRate)}${x.rebased?', angepasst':''})</small></span></div>
      <div class="stat"><b>${p.L}</b><span>Lerntage übrig${x.mode==='pages'?` <small>· ${fmtN(speedOf(x))} S./h${(S.speed[x.id]||[]).length?', gemessen':', geschätzt'}</small>`:''}</span></div>
      <div class="stat"><b>${p.R}<small style="font-size:14px;color:var(--faint)">/${p.R0}</small></b><span>Wiederholungstage</span></div></div>
     <div class="strip-wrap"><div class="strip">${strip}</div></div>
     <div class="strip-legend"><span><i style="background:var(--c)"></i>geschafft</span><span><i style="background:var(--danger-soft);box-shadow:inset 0 0 0 1px var(--danger)"></i>verpasst</span><span><i style="background:color-mix(in srgb,var(--c) 22%,var(--surface))"></i>neuer Stoff</span><span><i style="background:var(--warn-soft)"></i>Wiederholung</span><span><i style="box-shadow:inset 0 0 0 1px var(--line)"></i>lernfrei</span><span><i class="offsw"></i>freier Tag</span><span style="color:var(--faint)">Tipp: Klick auf einen Tag nimmt ihn frei</span></div>
     <ul class="plan">${rows}</ul>${p.plan.length>8?`<button class="link" style="margin-top:8px" data-act="exam-full" data-id="${x.id}">${showFull[x.id]?'Weniger anzeigen':`Ganzen Plan anzeigen (${p.plan.length} Tage)`}</button>`:''}</article>`};
  return `<div class="page-head"><div><p class="eyebrow">Lernen</p><h1>Lernplan</h1><p class="sub">Die App verteilt den Stoff bis zur Prüfung und rechnet jeden Tag neu, je nachdem, was du geschafft hast.</p></div>
   <div class="head-actions"><button class="btn primary" data-act="exam-new">${ic('plus',16)} Prüfung</button></div></div>
  ${ex.length?`<section class="card"><div class="card-head"><h2>Heute</h2>${S.studyRest.includes(t.getDay())?`<span class="meta">${fmtLong(t)}</span>`:`<button class="link" data-act="toggle-off" data-date="${iso(t)}">${isOff(iso(t))?'Freien Tag zurücknehmen':'Heute frei nehmen'}</button>`}</div><div class="studies">${ex.map(x=>studyToday(x)).join('')}</div></section>`:''}
  <div class="exam-list">${ex.map(card).join('')||'<section class="card"><p class="empty">Noch keine Prüfung angelegt. Leg eine an, dann rechnet die App dir den Plan aus.</p></section>'}</div>
  <div class="how"><section class="card"><div class="card-head"><h2>So rechnet der Plan</h2></div><ol>
    <li>Gezählt werden alle Tage vom Lernbeginn bis zum Tag vor der Prüfung, ohne deine lernfreien Tage.</li>
    <li>Rund ein Fünftel davon, am Ende vor der Prüfung, wird für Wiederholung reserviert. Der letzte Tag ist Gesamtwiederholung und Altfragen.</li>
    <li>Der restliche Stoff wird gleichmäßig auf die Lerntage verteilt, in der Reihenfolge deiner Abschnitte.</li>
    <li>Jeden Morgen wird neu gerechnet. Was gestern offen blieb, verteilt sich auf alle verbleibenden Lerntage. Bist du voraus, wird es weniger.</li>
    <li>Steigt das Pensum, weil du hinterherhängst, über dein Tageslimit (Standard: 30 % über dem Plan), opfert der Plan erst Wiederholungstage. Reicht das nicht, warnt er dich rot.</li><li>Änderst du den Plan bewusst, z. B. die lernfreien Tage, gilt das nicht als Rückstand: Der Stoff wird neu verteilt, Plan und Limit werden neu gesetzt, die Wiederholungstage bleiben.</li></ol></section>
   <section class="card"><div class="card-head"><h2>Lernfreie Tage</h2><span class="meta">gilt für alle Prüfungen</span></div>
    <div class="wdpick">${WDORDER.map(d=>`<label><input type="checkbox" data-rest="${d}" ${S.studyRest.includes(d)?'checked':''}><span>${WD[d]}</span></label>`).join('')}</div>
    <p class="hint">An diesen Wochentagen plant die App keinen Stoff ein. Änderst du sie, wird der restliche Stoff auf die neuen Lerntage verteilt, die Wiederholungstage bleiben. Hakst du an einem freien Tag trotzdem etwas ab, zählt es natürlich.</p></section>
   <section class="card"><div class="card-head"><h2>Einzelne freie Tage</h2><span class="meta">Ausflug, Ganztagstermin, krank</span></div>
    ${(()=>{const sg=offSuggestions();return sg.length?`<div class="off-sugs">${sg.map(o=>`<div class="off-sug"><span><b>${fmtShort(parseISO(o.date))}</b> ${esc(o.titles.join(', '))} <span class="mono" style="color:var(--muted)">${Math.round(o.mins/60)} h</span></span><span class="sug-act"><button class="btn sm primary" data-act="off-accept" data-date="${o.date}" data-note="${esc(o.titles[0])}">Lernfrei</button><button class="btn sm ghost" data-act="off-dismiss" data-date="${o.date}">Nein</button></span></div>`).join('')}<p class="hint" style="margin:0">Aus deinem Kalender: Tage mit mehr als 6 Stunden Terminen.</p></div>`:''})()}
    <form class="off-add" id="f-off"><label class="sr" for="off-date">Datum</label><input id="off-date" name="date" type="date" min="${iso(t)}" value="${iso(addDays(t,1))}" required><label class="sr" for="off-note">Grund</label><input id="off-note" name="note" type="text" placeholder="Grund, optional" autocomplete="off"><button class="btn">${ic('plus',16)} Frei nehmen</button></form>
    ${S.studyOff.filter(o=>o.date>=iso(t)).length?`<ul class="off-list">${S.studyOff.filter(o=>o.date>=iso(t)).map(o=>`<li><span><b>${fmtShort(parseISO(o.date))}</b>${o.note?` · ${esc(o.note)}`:''}</span><button class="link" data-act="toggle-off" data-date="${o.date}">Zurücknehmen</button></li>`).join('')}</ul>`:'<p class="empty">Noch keine freien Tage eingetragen.</p>'}
    <p class="hint">Der Stoff wird auf die übrigen Lerntage verteilt, die Wiederholungstage bleiben.</p></section></div>
  ${old.length?`<p class="hint">${old.length} vergangene Prüfung${old.length>1?'en':''} ausgeblendet.</p>`:''}`}
let showFull={};
const LINES_PH={pages:'Ein Abschnitt pro Zeile, mit Seitenbereich:\nKap. 12 Aminosäurestoffwechsel 301-338\nKap. 13 Harnstoffzyklus 339-356\n…',topics:'Ein Thema pro Zeile:\nMembranpotenzial\nSynapse\nHerzerregung und EKG\n…',lectures:'Eine Vorlesung pro Zeile, Länge in Minuten am Ende:\nVL 1 Membranpotenzial 90\nVL 2 Synapse 85\n…'};
function itemsToText(x){return x.items.map(i=>x.mode==='pages'?(i.from!=null?`${i.name} ${i.from}-${i.from+i.size-1}`:`${i.name} ${i.size}`):x.mode==='lectures'?`${i.name} ${i.dur||90}`:i.name).join('\n')}
function parseItems(txt,mode){const out=[],bad=[];txt.split('\n').map(l=>l.trim()).filter(Boolean).forEach(l=>{
  if(mode==='topics'){out.push({name:l,size:1});return}
  if(mode==='lectures'){const m=l.match(/^(.*?)[\s,:·]+(\d{2,3})\s*(?:min)?$/i);out.push(m?{name:m[1].trim(),size:1,dur:+m[2]}:{name:l,size:1,dur:90});return}
  let m=l.match(/^(.*?)[\s,:·]*(?:S\.?\s*)?(\d+)\s*[-–]\s*(\d+)\s*$/);if(m&&+m[3]>=+m[2]){out.push({name:m[1].trim()||`S. ${m[2]}–${m[3]}`,from:+m[2],size:+m[3]-+m[2]+1});return}
  m=l.match(/^(.*?)[\s,:·]+(\d+)\s*(?:s\.?|seiten)?$/i);if(m){out.push({name:m[1].trim(),from:null,size:+m[2]});return}bad.push(l)});return {items:out,bad}}
function openExamModal(id){const x=id?S.exams.find(e=>e.id===id):null,t=TODAY(),mode=x?x.mode:'pages';
  overlay(`<form class="modal" id="f-exam" data-id="${x?x.id:''}" style="width:min(560px,100%)"><h2>${x?'Prüfung bearbeiten':'Neue Prüfung'}</h2>
   <label class="fl" for="ex-subj">Fach<input id="ex-subj" name="subject" type="text" value="${esc(x?x.subject:'')}" placeholder="z. B. Biochemie II" required autocomplete="off"></label>
   <div class="frow" style="--n:3"><label class="fl" for="ex-date">Prüfung am<input id="ex-date" name="date" type="date" value="${x?x.date:iso(addDays(t,21))}" required></label>
    <label class="fl" for="ex-start">Lernbeginn<input id="ex-start" name="start" type="date" value="${x?x.start:iso(t)}" required></label>
    <label class="fl" for="ex-mode">Einheit<select id="ex-mode" name="mode" data-exmode><option value="pages" ${mode==='pages'?'selected':''}>Seiten</option><option value="topics" ${mode==='topics'?'selected':''}>Themen / Kapitel</option><option value="lectures" ${mode==='lectures'?'selected':''}>Vorlesungen</option></select></label></div>
   <label class="fl" for="ex-items">Stoff, in der Reihenfolge, in der du lernen willst<textarea id="ex-items" name="items" placeholder="${esc(LINES_PH[mode])}" required>${x?esc(itemsToText(x)):''}</textarea></label>
   <div class="frow" style="--n:2"><label class="fl" for="ex-rev">Wiederholungstage<input id="ex-rev" name="review" type="number" min="0" max="30" value="${x&&!x.reviewAuto?x.reviewDays:''}" placeholder="automatisch (~20 %)"></label>
    <label class="fl" for="ex-cap">Höchstens pro Tag<input id="ex-cap" name="cap" type="number" min="1" value="${x&&x.cap?x.cap:''}" placeholder="automatisch (+30 %)"></label></div>
   <label class="fl" for="ex-color">Farbe<select id="ex-color" name="color">${[['uni','Blau'],['training','Orange'],['bday','Pink'],['privat','Grün']].map(([k,l])=>`<option value="${k}" ${(x?x.color:'uni')===k?'selected':''}>${l}</option>`).join('')}</select></label>
   <div class="modal-actions">${x?`<button type="button" class="btn ghost danger" data-act="exam-del" data-id="${x.id}">${ic('trash',16)} Löschen</button>`:''}<span class="sp"></span><button type="button" class="btn ghost" data-act="close-overlay">Abbrechen</button><button class="btn primary">${x?'Speichern':'Plan berechnen'}</button></div>
   <p class="hint" style="margin:0">${x?'Dein Fortschritt bleibt erhalten, der Plan wird neu berechnet.':'Die Prüfung landet auch als wichtiger Termin im Kalender.'}</p></form>`);$('#ex-subj').focus()}
function seedExams(){const t=TODAY(),D=n=>iso(addDays(t,n));
  const bioEv=S.events.find(e=>/prüfung biochemie/i.test(e.title));const bioDate=bioEv?bioEv.date:D(16);
  const P=(name,a,b)=>({name,from:a,size:b-a+1});
  const bio={id:uid(),subject:'Biochemie II',date:bioDate,start:D(-7),mode:'pages',color:'uni',reviewAuto:true,reviewDays:0,cap:null,log:{},targets:{},reviewLog:{},
    items:[P('Kap. 12 Aminosäurestoffwechsel',301,338),P('Kap. 13 Harnstoffzyklus',339,356),P('Kap. 14 Nukleotidstoffwechsel',357,390),P('Kap. 15 Häm und Porphyrine',391,410),P('Kap. 16 Lipoproteine',411,440),
      P('Kap. 17 Steroidhormone',441,468),P('Kap. 18 Signaltransduktion',469,510),P('Kap. 19 Leber und Entgiftung',511,534),P('Kap. 20 Blut und Gerinnung',535,566),P('Kap. 21 Integration des Stoffwechsels',567,592)]};
  initExamMeta(bio);const r=Math.round(bio.baseRate),pat=[1,1.15,0,1,0.45,1];let k=0;
  for(let i=-7;i<0;i++){const d=addDays(t,i);if(S.studyRest.includes(d.getDay()))continue;const f=pat[k++%pat.length];bio.targets[iso(d)]=r;if(f)bio.log[iso(d)]=Math.round(r*f)}
  const phys={id:uid(),subject:'Physiologie Zwischenprüfung',date:D(33),start:D(0),mode:'topics',color:'training',reviewAuto:true,reviewDays:0,cap:null,log:{},targets:{},reviewLog:{},
    items:['Membranpotenzial','Synapse und Transmitter','Skelettmuskel','Herzerregung und EKG','Herzmechanik','Kreislauf und Blutdruck','Mikrozirkulation','Blut und Immunsystem','Atemmechanik','Gasaustausch und O₂-Transport','Atemregulation','Glomeruläre Filtration','Tubulärer Transport','Säure-Basen-Haushalt','Wasser- und Elektrolythaushalt','Magen-Darm-Motilität','Verdauung und Resorption','Energiehaushalt','Temperaturregulation','Hypothalamus und Hypophyse','Schilddrüse','Nebenniere','Sehen','Hören und Gleichgewicht'].map(n=>({name:n,size:1}))};
  initExamMeta(phys);
  if(!S.events.some(e=>e.title===phys.subject))S.events.push({id:uid(),title:phys.subject,date:phys.date,start:'09:00',end:'11:00',cal:'uni',important:true});
  return [bio,phys]}

