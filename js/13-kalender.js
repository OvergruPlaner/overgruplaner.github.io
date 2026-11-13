/* ---------- Kalender ---------- */

/* Ganztägige Einträge als durchgehende Balken: Lanes für einen Zeitraum von n Tagen ab d0 */
function allDayItems(d0,n){const out=[],ds0=iso(d0),dsN=iso(addDays(d0,n));
  S.events.filter(e=>e.allDay).forEach(e0=>{const v=typeof evView==='function'?evView(e0):{...e0,show:true};if(!v.show||S.vis[v.cal]===false)return;
    const a=e0.date,b=e0.endDate&&e0.endDate>e0.date?e0.endDate:iso(addDays(parseISO(e0.date),1));if(b<=ds0||a>=dsN)return;
    out.push({title:v.title,cal:v.cal,id:e0.id,s:Math.max(0,diffDays(d0,parseISO(a))),e:Math.min(n-1,diffDays(d0,parseISO(b))-1),before:a<ds0,after:b>dsN})});
  for(let i=0;i<n;i++){const d=addDays(d0,i),ds=iso(d);
    if(S.vis.bday!==false)allBdays().filter(x=>x.md===ds.slice(5)).forEach(x=>out.push({title:`${x.name} – Geburtstag`,cal:'bday',s:i,e:i}));
    const h=holidayName(d);if(h&&S.vis.hol!==false)out.push({title:h,cal:'hol',s:i,e:i})}
  out.sort((a,b)=>a.s-b.s||(b.e-b.s)-(a.e-a.s));const lanes=[];
  out.forEach(it=>{let l=lanes.findIndex(x=>x<it.s);if(l<0){l=lanes.length;lanes.push(-1)}lanes[l]=it.e;it.lane=l});return {items:out,lanes:lanes.length}}
const adBarAttrs=it=>it.id?`data-act="ev-info" data-id="${esc(it.id)}" role="button" tabindex="0"`:'';
const H0=6,H1=24,HH=48;
function layoutDay(items){items.sort((a,b)=>a.s-b.s||b.en-a.en);const out=[];let cl=[],end=-1;
  const flush=()=>{const lanes=[];cl.forEach(it=>{let i=lanes.findIndex(e=>e<=it.s);if(i<0){i=lanes.length;lanes.push(0)}lanes[i]=it.en;it.lane=i});cl.forEach(it=>{it.lanes=lanes.length;out.push(it)});cl=[]};
  items.forEach(it=>{if(cl.length&&it.s>=end){flush();end=-1}cl.push(it);end=Math.max(end,it.en)});if(cl.length)flush();return out}
function weekGrid(days){const t=iso(TODAY()),now=new Date(),nm=now.getHours()*60+now.getMinutes();const H=(H1-H0)*HH;
  let hours='';for(let h=H0;h<H1;h++)hours+=`<div class="hl" style="top:${(h-H0)*HH}px">${pad(h)}:00</div>`;
  const cols=days.map(d=>{const ds=iso(d);const items=layoutDay(eventsOn(ds).map(e=>({e,s:toMin(e.start),en:Math.max(toMin(e.end),toMin(e.start)+20)})));
    const blocks=items.map(it=>{const top=Math.max(0,(it.s-H0*60)/60*HH),h=Math.max((it.en-Math.max(it.s,H0*60))/60*HH-2,20);const w=100/it.lanes;
      return `<button class="evb c-${it.e.cal} ${it.e.important?'imp':''}" data-act="edit-event" data-id="${it.e.id}" style="top:${top}px;height:${h}px;left:calc(${it.lane*w}% + 2px);width:calc(${w}% - 5px)"><b>${esc(it.e.title)}</b>${h>34?`<span>${it.e.start}–${it.e.end}</span>`:''}</button>`}).join('');
    const nl=ds===t&&nm>=H0*60?`<div class="nowline" style="top:${(nm-H0*60)/60*HH}px"></div>`:'';
    return `<div class="daycol ${ds===t?'today':''}" data-act="cal-slot" data-date="${ds}" data-drop="${ds}" style="height:${H}px">${blocks}${nl}</div>`}).join('');
  return `<div class="cal-scroll" id="cal-scroll"><div class="wk ${days.length===1?'one':''}" style="--days:${days.length}">
   <div class="wk-row wk-head"><div></div>${days.map(d=>`<button class="dh ${iso(d)===t?'today':''} ${holidayName(d)?'hol':''}" data-act="cal-day" data-date="${iso(d)}"><span class="wd">${WD[d.getDay()]}</span><span class="num">${d.getDate()}</span></button>`).join('')}</div>
   ${(()=>{const A=allDayItems(days[0],days.length),R=A.lanes+1;return `<div class="wk-row wk-ad wk-adgrid"><div class="ad-label" style="grid-row:1/span ${R}">ganztägig<br>To-dos</div>
    ${days.map((d,i)=>`<div class="adbg" style="grid-column:${i+2};grid-row:1/span ${R}" data-drop="${iso(d)}"></div>`).join('')}
    ${A.items.map(it=>`<span class="adbar c-${it.cal} ${it.before?'cont-l':''} ${it.after?'cont-r':''}" style="grid-column:${it.s+2}/${it.e+3};grid-row:${it.lane+1}" title="${esc(it.title)}" ${adBarAttrs(it)}>${it.before?'← ':''}${esc(it.title)}${it.after?' →':''}</span>`).join('')}
    ${days.map((d,i)=>`<div class="adtasks" style="grid-column:${i+2};grid-row:${R}" data-drop="${iso(d)}">${tasksOn(iso(d)).map(taskPill).join('')}</div>`).join('')}</div>`})()}
   <div class="wk-row"><div class="hours" style="height:${H}px">${hours}</div>${cols}</div></div></div>`}
function monthGrid(a){const y=a.getFullYear(),m=a.getMonth(),start=mondayOf(new Date(y,m,1)),t=iso(TODAY());let cells='',W=null;
  for(let i=0;i<42;i++){if(i%7===0)W=allDayItems(addDays(start,i),7);
    const wd=i%7,d=addDays(start,i),ds=iso(d),ev=eventsOn(ds);
    let used=-1;W.items.forEach(x=>{if(x.s<=wd&&x.e>=wd)used=Math.max(used,x.lane)});
    const bars=[];for(let l=0;l<=used;l++){const it=W.items.find(x=>x.lane===l&&x.s<=wd&&x.e>=wd);
      if(!it){bars.push('<span class="mbar-gap"></span>');continue}
      if(it.s===it.e&&!it.before&&!it.after){bars.push(`<span class="mp adp c-${it.cal}" ${adBarAttrs(it)}>${esc(it.title)}</span>`);continue}
      bars.push(`<span class="mbar c-${it.cal} ${wd===it.s&&!it.before?'st':''} ${wd===it.e&&!it.after?'en':''}" title="${esc(it.title)}" ${adBarAttrs(it)}>${wd===it.s||wd===0?esc(it.title):'&nbsp;'}</span>`)}
    const all=[...bars,...ev.map(e=>`<span class="mp c-${e.cal}"><i>${e.start}</i> ${esc(e.title)}</span>`),...tasksOn(ds).map(taskPill)];
    const max=Math.max(4,used+2);cells+=`<div class="mc ${d.getMonth()!==m?'out':''} ${ds===t?'today':''}" role="button" tabindex="0" data-act="cal-day" data-date="${ds}" data-drop="${ds}"><span class="mn">${d.getDate()}</span>${all.slice(0,max).join('')}${all.length>max?`<span class="more">+${all.length-max} weitere</span>`:''}</div>`}
  return `<div class="month">${['Mo','Di','Mi','Do','Fr','Sa','So'].map(w=>`<div class="mwd">${w}</div>`).join('')}${cells}</div>`}
function yearGrid(y){const t=TODAY(),ts=iso(t);let out='';
  for(let m=0;m<12;m++){const first=new Date(y,m,1),lead=(first.getDay()+6)%7,n=new Date(y,m+1,0).getDate();let g='';
    for(let i=0;i<lead;i++)g+='<span></span>';
    for(let d=1;d<=n;d++){const dt=new Date(y,m,d),ds=iso(dt),ev=eventsOn(ds),ad=allDayOn(ds),imp=ev.some(e=>e.important);
      let c='';if(imp)c='c-imp';else if(ad.some(x=>x.cal==='bday'))c='c-bday';else if(ev.length)c='c-'+ev[0].cal;
      const hol=ad.some(x=>x.cal==='hol');
      g+=`<button class="yd ${c?'has '+c:''} ${imp?'imp':''} ${hol?'holday':''} ${ds===ts?'today':''} ${dt<t?'past':''}" data-act="cal-day" data-date="${ds}" title="${fmtShort(dt)}${[...ad.map(x=>' · '+x.title),...ev.map(e=>' · '+e.title)].join('')}">${d}</button>`}
    out+=`<div class="ym ${y===t.getFullYear()&&m===t.getMonth()?'cur':''}"><button class="ym-h" data-act="cal-month" data-date="${iso(first)}">${MON[m]}</button><div class="ym-g">${['M','D','M','D','F','S','S'].map(x=>`<span class="ym-wd">${x}</span>`).join('')}${g}</div></div>`}
  return `<div class="year">${out}</div>`}
function renderKalender(){const a=parseISO(cal.anchor);let eyebrow,label,body;
  if(cal.mode==='tag'){eyebrow=`KW ${isoWeek(a)}${holidayName(a)?' · '+holidayName(a):''}`;label=`${WDL[a.getDay()]}, ${a.getDate()}. ${MON[a.getMonth()]}`;body=weekGrid([a])}
  else if(cal.mode==='woche'){const m=mondayOf(a),e=addDays(m,6),days=[...Array(7)].map((_,i)=>addDays(m,i));eyebrow=`Woche · KW ${isoWeek(m)}`;label=`${m.getDate()}. ${m.getMonth()!==e.getMonth()?MONS[m.getMonth()]+' ':''}– ${e.getDate()}. ${MON[e.getMonth()]}`;body=weekGrid(days)}
  else if(cal.mode==='monat'){eyebrow='Monat';label=`${MON[a.getMonth()]} ${a.getFullYear()}`;body=monthGrid(a)}
  else{eyebrow='Jahr';label=`${a.getFullYear()}`;body=yearGrid(a.getFullYear())}
  return `<div class="page-head"><div><p class="eyebrow">${eyebrow}</p><h1>${label}</h1></div><div class="head-actions"><button class="btn primary" data-act="new-event">${ic('plus',16)} Termin</button></div></div>
  <div class="cal-bar"><div class="seg" role="group" aria-label="Ansicht">${[['tag','Tag'],['woche','Woche'],['monat','Monat'],['jahr','Jahr']].map(([k,l])=>`<button data-act="cal-mode" data-mode="${k}" aria-pressed="${cal.mode===k}">${l}</button>`).join('')}</div>
   <div class="cal-nav"><button class="icon-btn" data-act="cal-step" data-dir="-1" aria-label="Zurück">${ic('chevL',16)}</button><button class="btn sm" data-act="cal-today">Heute</button><button class="icon-btn" data-act="cal-step" data-dir="1" aria-label="Weiter">${ic('chevR',16)}</button></div>
   <div class="legend">${Object.entries(CAL).map(([k,c])=>`<button class="lg c-${k} ${S.vis[k]?'on':''}" data-act="cal-filter" data-cal="${k}" aria-pressed="${!!S.vis[k]}"><span class="sw"></span>${c.name}</button>`).join('')}</div></div>
  ${body}${cal.mode==='tag'||cal.mode==='woche'?'<p class="hint">Klick in eine freie Zeit legt dort einen Termin an. To-dos (gestrichelt) ziehst du einfach auf einen anderen Tag.</p>':cal.mode==='monat'?'<p class="hint">To-dos (gestrichelt) lassen sich auf einen anderen Tag ziehen.</p>':''}`}
function calStep(dir){const a=parseISO(cal.anchor);let n;
  if(cal.mode==='tag')n=addDays(a,dir);else if(cal.mode==='woche')n=addDays(a,7*dir);else if(cal.mode==='monat')n=new Date(a.getFullYear(),a.getMonth()+dir,1);else n=new Date(a.getFullYear()+dir,0,1);cal.anchor=iso(n)}

