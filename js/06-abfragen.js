/* ---------- Abfragen ---------- */
/* Kalender anderer Personen (geteilte Google-Kalender): eigene Farbe, Name dazu, standardmäßig nicht im Tagesplan */
function calCfg(id){const c=(S.gcalendars||[]).find(x=>x.id===id),d=(S.calSettings||{})[id]||{},nm=c?c.name:String(id||''),def=nm.includes('@')?nm.split('@')[0]:nm;
  return {label:d.label||def,inPlan:d.inPlan!=null?d.inPlan:!!(c&&c.primary),show:d.show!==false,primary:!!(c&&c.primary),name:nm}}
const shortWho=w=>{w=String(w||'');return w.includes('@')?w.split('@')[0]:w.split(' ')[0]};
/* Tages-Abweichungen für Fixes (Schnelleingabe „Training 19:30“, „Training Do fällt aus“): S.fixOv[Datum][Schlüssel]={s}|{off} */
const fxOv=ds=>(S.fixOv&&S.fixOv[ds])||{};
const sportAt=(ds=iso(TODAY()))=>{const o=fxOv(ds).sport;if(o&&o.off)return null;return o&&o.s!=null?o.s:toMin(S.rhythm.sport)};
function evView(e){const v=evView0(e),o=fxOv(e.date)['ev:'+e.id];if(!o)return v;
  if(o.off)return {...v,off:true,title:v.title+' (fällt aus)'};
  if(o.s!=null&&!e.allDay){const d=toMin(e.end)-toMin(e.start);return {...v,start:fromM(o.s),end:fromM(o.s+d),moved:true}}return v}
function evView0(e){if(!e.gcal)return {...e,inPlan:true,show:true};const c=calCfg(e.gcal);
  if(c.primary)return {...e,inPlan:true,show:true,who:e.by?shortWho(e.by):null,title:e.by?`${e.title} · von ${shortWho(e.by)}`:e.title};
  const opt=!!(S.evOptIn||{})[e.gid||e.id];return {...e,cal:'fam',inPlan:c.inPlan||opt,optIn:opt,fam:true,show:c.show,who:c.label,title:`${e.title} · ${c.label}`}}
const eventsOn=(ds,all)=>S.events.filter(e=>e.date===ds&&!e.allDay).map(evView).filter(e=>e.show&&(all||S.vis[e.cal]!==false)).sort((a,b)=>a.start.localeCompare(b.start));
const myEventsOn=ds=>eventsOn(ds,true).filter(e=>e.inPlan&&!e.off);
const allBdays=()=>{const seen=new Set(),out=[];[...(S.myBdays||[]),...(S.birthdays||[])].forEach(b=>{const k=b.name.toLowerCase()+b.md;if(!seen.has(k)){seen.add(k);out.push(b)}});return out};
function allDayOn(ds,all){const out=[];const md=ds.slice(5);
  if(all||S.vis.bday)allBdays().filter(b=>b.md===md).forEach(b=>out.push({title:`${b.name} – Geburtstag${b.year?` (${+ds.slice(0,4)-b.year})`:''}`,cal:'bday'}));
  S.events.filter(e=>e.allDay&&e.date<=ds&&ds<(e.endDate&&e.endDate>e.date?e.endDate:iso(addDays(parseISO(e.date),1)))).map(evView).filter(e=>e.show&&(all||S.vis[e.cal]!==false)).forEach(e=>out.push({title:e.title,cal:e.cal,id:e.id,inPlan:e.inPlan}));
  const h=holidays(+ds.slice(0,4))[ds];if(h&&(all||S.vis.hol))out.push({title:h,cal:'hol'});return out}
/* Fristen: due = Frist (spätestens). Erledigen-Tag = doOn (selbst gewählt) oder automatisch 1 Tag vor der Frist, bei „wichtig“ 2 Tage.
   Ab dem Erledigen-Tag steht das To-do in „Dein Tag“, bis es erledigt ist oder die Frist vorbei ist. */
const taskLead=x=>x.important?2:1;
function doDate(x){if(!x.due)return x.doOn||null;if(x.doOn)return x.doOn<=x.due?x.doOn:x.due;return iso(addDays(parseISO(x.due),-taskLead(x)))}
function todoNow(x){if(x.done)return false;const t=iso(TODAY());if(x.inPlan&&x.inPlan<t&&(!x.due||x.due>=t))return true;if(x.due)return x.due>=t&&doDate(x)<=t;return !!(x.doOn&&x.doOn<=t)}
const todoOver=x=>!x.done&&!!x.due&&x.due<iso(TODAY());
const inPlanToday=x=>!x.done&&x.inPlan===iso(TODAY());
const nowTasks=()=>S.tasks.filter(x=>todoNow(x)&&!inPlanToday(x)).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')||b.important-a.important);
const fristTxt=x=>{if(!x.due)return '';const n=diffDays(TODAY(),parseISO(x.due)),d=parseISO(x.due);return n===0?'Frist heute':n===1?'Frist morgen':n<7?`Frist ${WDL[d.getDay()]}`:`Frist ${fmtShort(d)}`};
const tasksOn=ds=>S.vis.task===false?[]:S.tasks.filter(x=>x.due===ds).sort((a,b)=>a.done-b.done||b.important-a.important);
const taskPill=x=>`<span class="tp ${x.done?'done':''} ${!x.done&&x.due<iso(TODAY())?'over':''}" draggable="true" data-task="${x.id}" data-act="edit-task" data-id="${x.id}" title="${esc(x.title)} · ziehen zum Verschieben">${esc(x.title)}</span>`;

/* Habit-Häufigkeit */
const freqOf=h=>h.freq||{type:'daily'};
function freqLabel(h){const f=freqOf(h);if(f.type==='weekly')return `${f.n}× pro Woche`;if(f.type==='days')return WDORDER.filter(d=>f.days.includes(d)).map(d=>WD[d]).join(', ');return 'täglich'}
const scheduled=(h,d)=>{const f=freqOf(h);if(/training/i.test(h.name)){const o=fxOv(iso(d)).sport;if(o&&o.mv)return !o.off}return f.type!=='days'||f.days.includes(d.getDay())};
function weekCount(h,mon){let c=0;for(let i=0;i<7;i++)if(h.log[iso(addDays(mon,i))])c++;return c}
function habState(h){const t=TODAY(),f=freqOf(h),done=!!h.log[iso(t)];
  if(f.type==='weekly'){const c=weekCount(h,mondayOf(t)),left=Math.max(0,f.n-c),daysLeft=7-((t.getDay()+6)%7);
    return {done,count:c,n:f.n,left,daysLeft,open:left>0&&!done,status:left===0?`Wochenziel erreicht · ${c}/${f.n}`:`${c}/${f.n} diese Woche · noch ${left}× bis So`}}
  if(f.type==='days'){const due=scheduled(h,t);return {done,due,open:due&&!done,status:due?(done?'heute erledigt':'heute geplant'):`heute frei · ${freqLabel(h)}`}}
  return {done,open:!done,status:''}}
/* Streak-Regel: nie zweimal hintereinander auslassen. Ein Aussetzer bricht nichts, erst zwei in Folge. */
function streakInfo(h){const f=freqOf(h),t=TODAY();
  if(f.type==='weekly'){let m=mondayOf(t),n=0,miss=0,gap=false;if(weekCount(h,m)<f.n)m=addDays(m,-7);
    for(let w=0;w<60;w++){if(weekCount(h,m)>=f.n){n++;miss=0}else{miss++;if(miss>=2)break;gap=gap||n===0}m=addDays(m,-7)}
    return {n,unit:n===1?'Woche':'Wochen',label:'Wochen geschafft',lastMissed:weekCount(h,addDays(mondayOf(t),-7))<f.n}}
  let d=t,n=0,g=0,miss=0;if(!h.log[iso(d)])d=addDays(d,-1);
  while(g++<400){if(!scheduled(h,d)){d=addDays(d,-1);continue}if(h.log[iso(d)]){n++;miss=0}else{miss++;if(miss>=2)break}d=addDays(d,-1)}
  let y=addDays(t,-1),k=0;while(k++<7&&!scheduled(h,y))y=addDays(y,-1);
  return {n,unit:n===1?'Tag':'Tage',label:'Streak',lastMissed:!h.log[iso(y)]}}
function bestInfo(h){const f=freqOf(h),t=TODAY();let b=0,c=0,miss=0;
  if(f.type==='weekly'){const m0=mondayOf(t);for(let w=54;w>=0;w--){if(weekCount(h,addDays(m0,-7*w))>=f.n){c++;miss=0;b=Math.max(b,c)}else if(w>0){miss++;if(miss>=2)c=0}}return b}
  for(let i=380;i>=0;i--){const d=addDays(t,-i);if(!scheduled(h,d))continue;if(h.log[iso(d)]){c++;miss=0;b=Math.max(b,c)}else if(i>0){miss++;if(miss>=2)c=0}}return b}
function quote(h){const f=freqOf(h),t=TODAY();
  if(f.type==='weekly'){const m0=mondayOf(t);let r=0;for(let w=1;w<=8;w++)if(weekCount(h,addDays(m0,-7*w))>=f.n)r++;return {v:`${r}/8`,l:'Wochen geschafft'}}
  let s=0,c=0;for(let i=0;i<30;i++){const d=addDays(t,-i);if(!scheduled(h,d))continue;s++;if(h.log[iso(d)])c++}return {v:`${s?Math.round(c/s*100):0} %`,l:'letzte 30 Tage'}}
const IMP_RE=/vorstellung|bewerbung|interview|prüfung|klausur|rigoros|testat|abgabe|frist|deadline|arzt|zahnarzt|ordination|krankenhaus|behörde|amt\b|magistrat|flug|hochzeit|geburtstag/i;
function upcoming(days=30){const t=TODAY(),L=S.settings.lead,items=[];
  for(let i=0;i<=days;i++){const d=addDays(t,i),ds=iso(d);
    allBdays().forEach(b=>{if(b.md===ds.slice(5))items.push({d,kind:'bday',title:`${b.name} hat Geburtstag${b.year?` (wird ${+ds.slice(0,4)-b.year})`:''}`,lead:L.bday})});
    const h=holidayName(d);if(h)items.push({d,kind:'hol',title:h,sub:'Feiertag',lead:L.normal});
    if(i>0)S.events.filter(e=>e.date===ds).forEach(e0=>{const v=evView(e0);if(!v.show)return;const span=e0.allDay&&e0.endDate?diffDays(parseISO(e0.date),parseISO(e0.endDate)):1;
      if(v.fam&&!v.inPlan){items.push({d,kind:'fam',cal:'fam',title:e0.title,who:v.who,evId:e0.id,key:e0.gid||e0.id,span,time:e0.allDay?null:e0.start,lead:L.normal,quiet:true});return}
      const e=e0;const imp=!v.fam&&(e.important||IMP_RE.test(e.title));items.push({d,kind:imp?'imp':'ev',cal:v.cal,title:e.title,who:v.fam?v.who:null,evId:e0.id,key:e0.gid||e0.id,span,opted:v.optIn,time:e.allDay?null:e.start,lead:/prüfung|klausur|rigoros/i.test(e.title)?L.exam:imp?L.important:L.normal})});
    if(i>0)S.tasks.filter(x=>!x.done&&x.due===ds).forEach(x=>{const dd=doDate(x);items.push({d,kind:'task',title:'Frist: '+x.title,taskId:x.id,quiet:!x.important,sub:dd<=iso(t)?'steht schon in deinem Tag':`ab ${WDL[parseISO(dd).getDay()]} in deinem Tag`,lead:x.important?L.important:1})});}
  S.habits.filter(h=>freqOf(h).type==='weekly').forEach(h=>{const st=habState(h);if(st.left>0&&st.daysLeft<=st.left+1)
    items.unshift({d:t,kind:'habit',habit:true,title:`${h.name}: noch ${st.left}× bis Sonntag`,sub:st.daysLeft===1?'letzter Tag der Woche':`${st.daysLeft} Tage übrig`,lead:0})});
  items.forEach(it=>{it.in=diffDays(t,it.d);it.notifyToday=it.in===it.lead;it.active=it.in<=it.lead});
  return items}
const openSugs=()=>S.mails.filter(m=>m.sug&&m.sug.status==='open');
function recvLabel(m){if(m.recvAt){const d=new Date(m.recvAt),dd=new Date(d);dd.setHours(0,0,0,0);const o=diffDays(TODAY(),dd);if(o===0)return pad(d.getHours())+':'+pad(d.getMinutes());if(o===-1)return 'Gestern';if(o>-7)return WD[d.getDay()];return fmtD(d)}const[o,tm]=m.recv;if(o===0)return tm;if(o===-1)return 'Gestern';return WD[addDays(TODAY(),o).getDay()]}
const snippet=m=>m.body.replace(/\s+/g,' ').slice(0,90);

