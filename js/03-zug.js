/* ---------- Zug (Beispiel-Fahrplan; in der App kommt das live von der ÖBB) ---------- */
const STA={get w2p(){return [ortA(),ortBL()]},get p2w(){return [ortBL(),ortA()]}};
const autoDir=()=>{try{if(modeToday()==='bib'){const dp=dpState();if(dp.outArrived!=null)return 'p2w';if(dp.outDep!=null){const out=tripsOn('w2p').find(x=>x.m===dp.outDep);return nowMin()<(out?out.dep:dp.outDep)?'w2p':'p2w'}}}catch(e){}return new Date().getHours()<14?'w2p':'p2w'};
const trainDir=()=>{const s=S.settings;if(s.trainDir&&s.trainDirAt&&Date.now()-s.trainDirAt<3*36e5)return s.trainDir;return autoDir()};
function hash01(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0)/4294967296}
/* Live-Daten kommen vom Hauptprozess (trains.js). Gültig, wenn jünger als 15 min. Sonst Beispielfahrplan. */
let LIVE=null;
const liveOk=()=>!!(LIVE&&LIVE.at&&Date.now()-new Date(LIVE.at).getTime()<15*60e3&&(LIVE.dirs.w2p.length||LIVE.dirs.p2w.length));
const liveSrc=()=>LIVE&&LIVE.src==='vor'?'VOR':'ÖBB';
const cleanLine=l=>String(l||'Zug').replace(/\s*\(?Zug-?Nr\.?\s*\d+\)?/i,'').replace(/^S\s+(\d+)/,'S$1').trim()||'Zug';
function liveDeps(dir){const now=new Date(),walk=S.settings.walk[dir==='w2p'?'w':'p'];
  return (LIVE.dirs[dir]||[]).map(x=>{const plan=new Date(x.plan),act=new Date(x.act),arr=new Date(x.arrAct||x.arrPlan),inMin=Math.round((act-now)/6e4);
    return {line:cleanLine(x.line),pl:x.pl||'–',plan,act,delay:x.delay,cx:x.cx,inMin,arr,dur:Math.round((new Date(x.arrPlan)-plan)/6e4),reach:inMin>=walk,est:x.est}}).filter(x=>x.inMin>=-1)}
function departures(dir,count=5){if(liveOk())return liveDeps(dir).slice(0,count);
  const now=new Date(),out=[],walk=S.settings.walk[dir==='w2p'?'w':'p'];
  for(let o=0;o<2&&out.length<count;o++){const d=addDays(TODAY(),o),wk=d.getDay()%6!==0,slots=[];
    for(let h=5;h<24;h++){(dir==='w2p'?[8,38]:[12,42]).forEach(m=>slots.push({m:h*60+m,line:'S2',dur:24,pl:dir==='w2p'?'2':'3'}));
      if(wk&&(dir==='w2p'?(h>=6&&h<=8):(h>=16&&h<=18)))slots.push({m:h*60+(dir==='w2p'?23:27),line:'REX 2',dur:19,pl:dir==='w2p'?'1':'4'})}
    slots.sort((a,b)=>a.m-b.m).forEach(s=>{if(out.length>=count)return;const r=hash01(iso(d)+dir+s.m);
      const delay=WEB?0:r<.62?0:r<.88?1+Math.floor((r-.62)*11):r<.97?5+Math.floor((r-.88)*66):0,cx=!WEB&&r>=.97;
      const plan=new Date(d);plan.setHours(0,s.m,0,0);const act=new Date(plan.getTime()+delay*6e4);
      const inMin=Math.round((act-now)/6e4);if(inMin<-1)return;
      out.push({...s,plan,act,delay,cx,inMin,arr:new Date(act.getTime()+s.dur*6e4),reach:inMin>=walk})})}
  return out}
const hhmm=d=>pad(d.getHours())+':'+pad(d.getMinutes());
function trainRows(dir,deps,next){return deps.map(x=>`<li class="dep ${x.cx?'cx':''} ${!x.cx&&!x.reach?'miss':''} ${x===next?'next':''}"><span class="dep-t ${x.delay>=5?'late':''}">${hhmm(x.act)}${x.delay&&!x.cx?`<s>${hhmm(x.plan)}</s>`:''}</span>
   <span class="line ${x.line!=='S2'?'rex':''}">${x.line}</span><span class="dep-main"><b>an ${hhmm(x.arr)}</b><span>Bstg. ${x.pl}${x.delay&&!x.cx?` · +${x.delay} min`:x.cx?'':' · pünktlich'}</span></span>
   <span class="dep-in">${x.cx?'fällt aus':x.inMin<=0?'jetzt':!x.reach?'zu knapp':x.inMin<60?`in ${x.inMin} min`:`in ${Math.floor(x.inMin/60)} h ${pad(x.inMin%60)}`}</span></li>`).join('')}
function leaveBox(dir,next){const walk=S.settings.walk[dir==='w2p'?'w':'p'];if(!next)return '';const leave=next.inMin-walk;
  return `<div class="leave ${leave<=2?'now':''}"><b>${leave<=0?'Jetzt los':`Los in ${leave} min`}</b><span>für ${next.line} um ${hhmm(next.act)} · ${walk} min Fußweg zum Bahnhof ${dir==='w2p'?ortA():ortB()}</span></div>`}
function renderTrainCard(){const dir=trainDir(),deps=departures(dir,5),next=deps.find(x=>!x.cx&&x.reach),now=new Date();
  return `<section class="card train" id="train-card"><div class="card-head"><h2>Zug</h2><div class="seg sm" role="group" aria-label="Richtung">
    <button data-act="train-dir" data-dir="w2p" aria-pressed="${dir==='w2p'}">→ ${ortB()}</button><button data-act="train-dir" data-dir="p2w" aria-pressed="${dir==='p2w'}">→ ${ortA()}</button></div></div>
   ${leaveBox(dir,next)}<ul class="deps">${trainRows(dir,deps,next)}</ul>
   <p class="hint">${STA[dir][0]} → ${STA[dir][1]} · Stand ${hhmm(now)} · ${S.settings.trainDir&&trainDir()===S.settings.trainDir&&S.settings.trainDirAt&&Date.now()-S.settings.trainDirAt<3*36e5?`<button class="link" data-act="train-dir" data-dir="auto">Richtung wieder automatisch</button>`:'Richtung automatisch nach Tageszeit'} · <button class="link" data-act="nav" data-view="zug">Mehr Abfahrten</button><br>${trainSrcNote()}</p></section>`}
function trainSrcNote(){if(liveOk())return `<span style="color:var(--accent)">● Live · ${liveSrc()}</span> · Stand ${hhmm(new Date(LIVE.at))}`;
  if(!APP)return 'Beispiel-Fahrplan, frei erfunden.';
  return `<b style="color:var(--warn)">Beispiel-Fahrplan</b>, Live-Daten gerade nicht da${LIVE&&LIVE.error?`: ${esc(LIVE.error)}`:' (wird geladen …)'} · <button class="link" data-act="train-reload">Neu laden</button>`}
let trainMore=10;
function renderZug(){const now=new Date();
  const col=dir=>{const deps=departures(dir,trainMore),next=deps.find(x=>!x.cx&&x.reach),late=deps.filter(x=>x.delay>=5).length,cx=deps.filter(x=>x.cx).length;
    return `<section class="card train"><div class="card-head"><h2>${STA[dir][0]} → ${STA[dir][1].replace('Wien ','')}</h2><span class="meta">${cx?`${cx} Ausfall`:late?`${late}× verspätet`:'alles im Plan'}</span></div>
     ${leaveBox(dir,next)}<ul class="deps">${trainRows(dir,deps,next)}</ul></section>`};
  return `<div class="page-head"><div><p class="eyebrow">${liveOk()?`Live · ${liveSrc()} · Stand ${hhmm(new Date(LIVE.at))}`:'Beispiel-Fahrplan'}</p><h1>Zug</h1><p class="sub">${ortA()} und ${ortB()} in beide Richtungen. ${liveOk()?'Holt alle 3 Minuten neue Daten.':''}</p></div>
   <div class="head-actions"><button class="btn" data-act="train-more">Spätere Abfahrten</button></div></div>
  <div class="train-grid">${col('w2p')}${col('p2w')}</div>
  <div class="train-grid">
   <section class="card"><div class="card-head"><h2>Meldungen zur Strecke</h2><span class="meta">${ich('strecke','')}</span></div>
    ${liveOk()?(LIVE.warnings.length?`<ul class="news">${LIVE.warnings.map(w=>`<li><span>${ic('bell',14)}</span><span><b>${esc(w.title)}</b>${w.text&&w.text!==w.title?`<small>${esc(w.text)}</small>`:''}</span></li>`).join('')}</ul>`:`<p class="empty" style="padding:0">${ic('check',14).replace('class="ic"','class="ic" style="display:inline;vertical-align:-2px;color:var(--accent)"')} Keine Störungen gemeldet.</p>`)
      :'<p class="empty" style="padding:0">Meldungen gibt es nur mit Live-Daten.</p>'}
    <p class="hint">Meldungen kommen aus den Abfahrten deiner Strecke (Störungen, Ersatzverkehr, Baustellen).</p></section>
   <section class="card"><div class="card-head"><h2>Fußwege</h2><span class="meta">für „Los in … min“</span></div>
    <div class="lead-row"><label for="zw-w">Zum Bahnhof ${ortA()}</label><input id="zw-w" type="number" min="0" max="60" value="${S.settings.walk.w}" data-walk="w"><small>min</small></div>
    <div class="lead-row"><label for="zw-p">Zum ${ortB()}</label><input id="zw-p" type="number" min="0" max="60" value="${S.settings.walk.p}" data-walk="p"><small>min</small></div></section>
  </div><p class="hint">${trainSrcNote()}</p>`}
function widgetTrain(){const dir=trainDir(),walk=S.settings.walk[dir==='w2p'?'w':'p'],n=departures(dir,6).find(x=>!x.cx&&x.reach);if(!n)return '';const lv=n.inMin-walk;
  return `<div class="w-sec"><h4>Zug → ${dir==='w2p'?ortB():ortA()}</h4><div class="w-train"><span class="mono">${hhmm(n.act)}</span><span>${n.line}${n.delay?` · <b style="color:var(--danger)">+${n.delay}</b>`:''} · an ${hhmm(n.arr)}</span><small>${lv<=0?'jetzt losgehen':`in ${lv} min losgehen`}</small></div></div>`}

