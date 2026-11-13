/* ---------- Tagesrhythmus & Routinen ---------- */
const nowMin=()=>{const n=new Date();return n.getHours()*60+n.getMinutes()};
const inWin=(m,a,b)=>a<=b?(m>=a&&m<b):(m>=a||m<b);
const bedMin=()=>{const o=fxOv(iso(TODAY())).evening;if(o&&o.s!=null)return (o.s+S.rhythm.wind)%1440;return ((toMin(S.rhythm.wake)-S.rhythm.sleep*60)%1440+1440)%1440};
const windMin=()=>((bedMin()-S.rhythm.wind)%1440+1440)%1440;
/* Tagesende für den Tagesplan = Beginn des Runterfahrens. Liegt es nach Mitternacht (spät aufstehen oder „Runterfahren 0:30“), gehört es noch zum laufenden Tag (> 1440). */
const dayEnd=()=>{const w=windMin();return w<toMin(S.rhythm.wake)?w+1440:w};
const fromM=m=>fromMin(((m%1440)+1440)%1440);
const rtDate=kind=>{const t=TODAY();return kind==='evening'&&nowMin()<toMin(S.rhythm.wake)?iso(addDays(t,-1)):iso(t)};
const rtLog=kind=>{const d=rtDate(kind);S.routineLog[d]=S.routineLog[d]||{};return S.routineLog[d]};
const rtText=it=>it.t.replace('{bed}',fromM(bedMin()));
const modeToday=()=>S.dayMode[iso(TODAY())]||null;
function rtDone(kind,it){if(it.type==='mode')return !!modeToday();if(it.habit){const h=S.habits.find(x=>new RegExp(it.habit,'i').test(x.name));if(h&&h.log[rtDate(kind)])return true}return !!rtLog(kind)[it.id]}
function rtToggle(kind,id){const it=S.routines[kind].find(x=>x.id===id),log=rtLog(kind),on=!rtDone(kind,it);log[id]=on;
  if(it.habit){const h=S.habits.find(x=>new RegExp(it.habit,'i').test(x.name)),d=rtDate(kind);if(h){if(on)h.log[d]=true;else delete h.log[d]}}save()}
const rtNext=kind=>S.routines[kind].find(it=>!rtDone(kind,it));
function rtRows(kind){return S.routines[kind].map(it=>{const on=rtDone(kind,it);
  if(it.type==='mode'){const m=modeToday();return `<li class="rt ${on?'on':''}"><span class="chk ${on?'on':''}" aria-hidden="true">${ic('check',11)}</span><span class="rt-t">Heute</span><span class="mode-pick"><button class="chip ${m==='bib'?'on':''}" data-act="day-mode" data-m="bib">Bib</button><button class="chip ${m==='home'?'on':''}" data-act="day-mode" data-m="home">Daheim</button></span></li>`}
  return `<li class="rt-li"><button class="rt ${on?'on':''}" data-act="rt-toggle" data-kind="${kind}" data-id="${it.id}"><span class="chk ${on?'on':''}">${ic('check',11)}</span><span class="rt-t">${esc(rtText(it))}</span></button>${it.timer&&!on?`<button class="link" data-act="read-timer">Timer</button>`:''}</li>`}).join('')}

/* ---------- Haushalt ---------- */
const RHY={daily:'täglich',weekend:'1× am Wochenende',weekly:'1× pro Woche',needed:'bei Bedarf'};
function satOf(t){const d=new Date(t);const wd=d.getDay();return wd===6?d:wd===0?addDays(d,-1):null}
function choreState(c){const t=TODAY(),ds=iso(t),wd=t.getDay();
  if(c.flagged&&c.rhythm!=='needed')return {due:true,label:'steht an (von dir gemeldet)'};
  if(c.rhythm==='daily')return c.last===ds?{due:false}:{due:true,label:'heute'};
  if(c.rhythm==='needed')return c.flagged?{due:true,label:'steht an'}:{due:false,idle:true};
  if(c.rhythm==='weekly'){const ws=c.weekStart??1,off=(wd-ws+7)%7,start=iso(addDays(t,-off));if(c.last&&c.last>=start)return {due:false};const left=7-off;
    return {due:true,label:left<=1?`letzter Tag, ab ${WDL[ws]} geht's neu los`:`noch ${left} Tage (bis ${WDL[(ws+6)%7]})`,late:left<=2}}
  if(c.rhythm==='weekend'){const sat=satOf(t);if(!sat){const n=(6-wd+7)%7;return {due:false,soon:n<=1,label:n===1?'morgen':`in ${n} Tagen`}}if(c.last&&c.last>=iso(sat))return {due:false};return {due:true,label:wd===0?'heute, sonst nächste Woche':'dieses Wochenende',late:wd===0}}
  return {due:false}}
const dueChores=()=>S.chores.filter(c=>choreState(c).due).sort((a,b)=>a.mins-b.mins);
function choreDone(c){c.last=iso(TODAY());c.flagged=false;save()}
function sprintPick(){const d=dueChores();let sum=0,out=[];d.forEach(c=>{if(sum+c.mins<=10){out.push(c);sum+=c.mins}});if(!out.length&&d.length)out=[d[0]];return out}

/* ---------- Menschen ---------- */
const SNIPS=['Hey, sorry für die späte Antwort! ','Kurz und ehrlich: war ein paar Tage abgetaucht, aber ','Hab grad an dich gedacht. Lust, diese Woche '];
const KINDS={voice:{l:'Sprachnachricht beantworten',s:'Sprachnachricht',ic:'mic',step:'Anhören, dann mit einer kurzen Sprachnachricht antworten. 30 Sekunden reichen.',snips:['Sorry, hab’s erst jetzt angehört! ']},
  reply:{l:'Nachricht beantworten',s:'Nachricht',ic:'msg',step:'Zwei Sätze reichen. Perfekt muss es nicht sein.',snips:['Hey, sorry für die späte Antwort! ','Kurz und ehrlich: war ein paar Tage abgetaucht, aber ']},
  plan:{l:'Treffen ausmachen',s:'Treffen',ic:'cal',step:'Zwei konkrete Termine vorschlagen, dann entscheidet die andere Person. Die App sucht dir freie Abende raus.',snips:null},
  call:{l:'Zurückrufen',s:'Anruf',ic:'phone',step:'Jetzt anrufen, dauert 5 Minuten. Geht keiner ran: kurze Nachricht, fertig.',snips:['Hab’s grad probiert, ruf gern zurück, wenn’s dir passt!']},
  checkin:{l:'Einfach melden',s:'Melden',ic:'wave',step:'Ein Satz genügt. Es geht nur darum, dass die Person weiß, dass du an sie denkst.',snips:['Hey, hab grad an dich gedacht. Wie geht’s dir?','Lang nichts gehört! Was gibt’s Neues bei dir?']},
  thanks:{l:'Danke sagen oder gratulieren',s:'Danke',ic:'heart',step:'Kurz und herzlich. Mehr braucht’s nicht.',snips:['Danke dir nochmal für ','Alles Gute dir! ']}};
const kindOf=r=>KINDS[r.kind]||KINDS.reply;
function freeSlots(n=2){const out=[],t=TODAY(),exams=S.exams.map(x=>x.date);
  for(let i=1;i<14&&out.length<n;i++){const d=addDays(t,i),ds=iso(d),we=d.getDay()===0||d.getDay()===6;if(exams.includes(ds))continue;
    const busy=myEventsOn(ds).some(e=>toMin(e.end)>(we?13*60:17*60)&&toMin(e.start)<22*60);if(busy)continue;
    out.push(we?`${WDL[d.getDay()]} (${fmtD(d)}) Nachmittag`:`${WDL[d.getDay()]} (${fmtD(d)}) ab 18 Uhr`)}return out}
const snipsFor=r=>{const k=kindOf(r);if(r.kind==='plan'){const f=freeSlots();return [f.length>=2?`Lust auf ein Treffen? Passt dir ${f[0]} oder ${f[1]}?`:'Lust auf ein Treffen nächste Woche? Wann passt’s dir?']}return k.snips||[]};
function logContact(name,kind){S.contactLog=S.contactLog||[];S.contactLog.unshift({name,kind,date:iso(TODAY())});S.contactLog=S.contactLog.slice(0,40);const pp=S.people.find(z=>z.name.toLowerCase()===name.toLowerCase());if(pp)pp.last=iso(TODAY())}
function snipChips(r){return snipsFor(r).map(t=>`<button class="chip snipc" data-act="snip-t" data-t="${esc(t)}">„${esc(t.trim().length>60?t.trim().slice(0,58)+'…':t.trim())}“</button>`).join('')}
function replyRow(r,full){const k=kindOf(r),late=diffDays(parseISO(r.added),TODAY())>=3;
  return `<li class="rp ${late?'late':''}"><button class="rp-done chk" data-act="reply-done" data-id="${r.id}" aria-label="${esc(r.name)}: erledigt">${ic('check',11)}</button>
   <span class="rp-ic" title="${k.l}">${ic(k.ic,15)}</span><span class="rp-main"><span><b>${esc(r.name)}</b> · ${k.s}${r.note?` · <span class="rp-note">${esc(r.note)}</span>`:''}</span>
   ${full?`<details class="rp-help"><summary>Hilfe zum Anfangen</summary><p>${esc(k.step)}</p><div class="snips">${snipChips(r)}</div></details>`:''}</span>
   <span class="rt-m ${late?'late':''}">${ago(r.added)}</span></li>`}
function kindPicker(sel){return `<div class="kinds" role="radiogroup" aria-label="Anlass">${Object.entries(KINDS).map(([k,v])=>`<label class="kind"><input type="radio" name="kind" value="${k}" ${k===sel?'checked':''}><span>${ic(v.ic,14)} ${v.s}</span></label>`).join('')}</div>`}
function renderMenschen(){const rs=S.replies.slice().sort((a,b)=>a.added.localeCompare(b.added)),t=TODAY();
  const ppl=S.people.slice().sort((a,b)=>(diffDays(parseISO(b.last),t)-b.every)-(diffDays(parseISO(a.last),t)-a.every));
  return `<div class="page-head"><div><p class="eyebrow">Menschen</p><h1>Dranbleiben an Leuten</h1><p class="sub">${rs.length?`${rs.length} offen, das älteste ${ago(rs[0].added)}.`:'Alles beantwortet.'} Kleine Schritte zählen genauso.</p></div>
   <div class="head-actions">${rs.length?`<button class="btn primary" data-act="reply-round">${ic('bolt',16)} Antwort-Runde · 10 min</button>`:''}</div></div>
  <div class="ppl-grid"><section class="card"><div class="card-head"><h2>Offen</h2><span class="meta">wem du was schuldest</span></div>
    ${rs.length?`<ul class="rps">${rs.map(r=>replyRow(r,true)).join('')}</ul>`:'<p class="empty">Nichts offen. Schön.</p>'}
    <form id="f-reply2" class="rp-add"><div class="frow" style="--n:2"><label class="fl" for="r2-name">Wer?<input id="r2-name" name="who" type="text" list="ppl-list" required autocomplete="off" placeholder="Name"></label>
      <label class="fl" for="r2-note">Worum geht’s? (optional)<input id="r2-note" name="note" type="text" autocomplete="off" placeholder="z. B. wegen Samstag"></label></div>
     <datalist id="ppl-list">${S.people.map(x=>`<option value="${esc(x.name)}">`).join('')}</datalist>
     ${kindPicker('reply')}<div><button class="btn primary">${ic('plus',16)} Eintragen</button></div></form></section>
   <div class="col"><section class="card"><div class="card-head"><h2>Kontakte</h2><span class="meta">regelmäßig melden</span></div>
     <ul class="ppl">${ppl.map(x=>{const dd=diffDays(parseISO(x.last),t),over=dd>=x.every,soon=!over&&dd>=x.every-2;
       return `<li><span class="pp-main"><b>${esc(x.name)}</b><small>zuletzt ${dd===0?'heute':`vor ${dd} ${dd===1?'Tag':'Tagen'}`} · alle <input type="number" min="1" max="365" value="${x.every}" data-every="${x.id}" aria-label="Rhythmus in Tagen für ${esc(x.name)}"> Tage</small></span>
        ${over?'<span class="status st-warn">dran</span>':soon?'<span class="status st-done">bald</span>':''}
        <span class="pp-act"><button class="btn sm" data-act="person-done" data-id="${x.id}">Gemeldet</button><button class="icon-btn" data-act="person-note" data-id="${x.id}" title="Auf die Liste: melden" aria-label="${esc(x.name)} auf die Liste">${ic('plus',14)}</button><button class="icon-btn" data-act="person-del" data-id="${x.id}" aria-label="${esc(x.name)} entfernen">${ic('trash',14)}</button></span></li>`}).join('')}</ul>
     <form id="f-person" class="pp-add"><label class="sr" for="pp-name">Name</label><input id="pp-name" name="name" type="text" required autocomplete="off" placeholder="Name"><label class="sr" for="pp-every">Alle … Tage</label><input id="pp-every" name="every" type="number" min="1" value="14" title="alle … Tage"><button class="btn">${ic('plus',16)} Kontakt</button></form></section>
    <section class="card"><div class="card-head"><h2>Zuletzt</h2><span class="meta">was du geschafft hast</span></div>
     ${(S.contactLog||[]).length?`<ul class="clog">${S.contactLog.slice(0,8).map(c=>`<li><span>${ic((KINDS[c.kind]||KINDS.checkin).ic,13)} <b>${esc(c.name)}</b> · ${(KINDS[c.kind]||KINDS.checkin).s}</span><span class="mono">${c.date===iso(t)?'heute':fmtShort(parseISO(c.date))}</span></li>`).join('')}</ul>`:'<p class="empty">Noch nichts eingetragen.</p>'}</section></div></div>`}
const overduePeople=()=>S.people.filter(p=>diffDays(parseISO(p.last),TODAY())>=p.every).sort((a,b)=>(diffDays(parseISO(b.last),TODAY())-b.every)-(diffDays(parseISO(a.last),TODAY())-a.every));
const ago=ds=>{const n=diffDays(parseISO(ds),TODAY());return n===0?'heute':n===1?'seit gestern':`seit ${n} Tagen`};

