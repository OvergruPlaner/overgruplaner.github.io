/* ---------- Schnelleingabe ---------- */
const WDMAP={so:0,sonntag:0,mo:1,montag:1,di:2,dienstag:2,mi:3,mittwoch:3,do:4,donnerstag:4,fr:5,freitag:5,sa:6,samstag:6};
/* ---------- Schnelleingabe ----------
   Ein Parser für alles: Termin, To-do, Menschen, Geburtstag, Dump, Habit/Haushalt abhaken, Lernstand.
   Tab schaltet den Typ um, ";" trennt mehrere Einträge, der letzte Eintrag lässt sich rückgängig machen. */
const RKW=[['voice',/sprachnachricht(en)?|sprachi/i],['call',/(zur(ü|ue)ck)?rufen|anrufen|anruf|r(ü|ue)ckruf|telefonieren/i],['plan',/treffen(\s+ausmachen)?/i],['checkin',/melden/i],['thanks',/danke(n|\s+sagen)?|gratulieren/i],
  ['reply',/nachricht(en)?|whatsapp|sms|zur(ü|ue)ckschreiben|beantworten|antworten/i],['write',/\b(schreiben|mailen|mail|e-mail|texten)\b/i]];
function parseReply(t,force){let kind=null,rest=t,note='';
  const nm=rest.match(/\s(wegen|weil|für|fuer|zum|zur|bzgl\.?|:)\s?(.*)$/i);if(nm){note=(nm[1]===':'?'':nm[1]+' ')+nm[2];rest=rest.slice(0,nm.index)}
  for(const [k,re] of RKW){if(re.test(rest)){kind=kind||k;rest=rest.replace(re,' ')}}
  if(!kind&&!force)return null;
  rest=rest.replace(/\b(auf|mit|bei|beim|an|die|der|den|dem|von|ausmachen|ein|eine|einen|mal|wieder|sagen|schicken|senden|schreiben)\b/gi,' ').replace(/\s+/g,' ').trim();
  if(!rest||rest.split(' ').length>3)return force&&rest?{kind:kind==='write'?'reply':kind||'reply',name:rest.split(' ')[0][0].toUpperCase()+rest.split(' ')[0].slice(1),note:rest.split(' ').slice(1).join(' ')+(note?' '+note:'')}:null;
  let name=rest[0].toUpperCase()+rest.slice(1);
  const known=n=>S.people.some(x=>x.name.toLowerCase()===n.toLowerCase())||S.replies.some(x=>x.name.toLowerCase()===n.toLowerCase());
  if(!known(name)&&/s$/i.test(name)&&known(name.slice(0,-1)))name=name.slice(0,-1);
  if(kind==='write'&&!force&&!known(name))return null; // „Bericht schreiben“ bleibt ein To-do
  return {kind:kind==='write'?'reply':kind,name,note:note.trim()}}
function hm(h,m){h=+h;m=+(m||0);if(h>23||m>59)return null;return pad(h)+':'+pad(m)}
const MONMAP={jan:0,jän:0,feb:1,mär:2,mar:2,apr:3,mai:4,jun:5,jul:6,aug:7,sep:8,okt:9,oct:9,nov:10,dez:11,dec:11};
const DP='(heute|übermorgen|morgen|in\\s+\\d{1,3}\\s+tag(?:en)?|\\d{1,2}\\.\\d{1,2}\\.(?:\\d{4}|\\d{2})?|\\d{1,2}\\.\\s*(?:jän|jan|feb|mär|mar|apr|mai|jun|jul|aug|sep|okt|nov|dez)[a-zäöü]*\\.?(?:\\s+\\d{4})?|(?:nächsten?\\s+)?(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|mo|di|mi|do|fr|sa|so)\\.?)';
function dateOf(x,keepYear){const t=TODAY();x=x.toLowerCase().trim();let m;
  if(x==='heute')return t;if(x==='morgen')return addDays(t,1);if(x==='übermorgen')return addDays(t,2);
  if((m=x.match(/^in\s+(\d+)\s+tag/)))return addDays(t,+m[1]);
  const mk=(dd,mm,yy)=>{let y=yy?+yy:t.getFullYear();if(y<100)y+=2000;const d=new Date(y,mm,dd);if(isNaN(d)||d.getMonth()!==mm)return null;if(!yy&&d<t&&!keepYear)d.setFullYear(y+1);return d};
  if((m=x.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})?$/)))return mk(+m[1],+m[2]-1,m[3]);
  if((m=x.match(/^(\d{1,2})\.\s*([a-zäöü]{3})[a-zäöü]*\.?(?:\s+(\d{4}))?$/))&&MONMAP[m[2]]!=null)return mk(+m[1],MONMAP[m[2]],m[3]);
  if((m=x.match(/^(nächsten?\s+)?([a-z]+)\.?$/))&&WDMAP[m[2]]!=null){let o=(WDMAP[m[2]]-t.getDay()+7)%7;if(m[1]&&o===0)o=7;return addDays(t,o)}
  return null}
const WDRR=['SU','MO','TU','WE','TH','FR','SA'];
const findHabit=w=>{w=w.toLowerCase().trim();if(!w)return null;const n=h=>h.name.toLowerCase();return S.habits.find(h=>n(h)===w)||S.habits.find(h=>w.length>=3&&n(h).startsWith(w))||S.habits.find(h=>n(h).split(' ')[0].length>=4&&w===n(h).split(' ')[0])||null};
const findChore=w=>{w=w.toLowerCase().trim();const f=w.split(' ')[0];if(!f||f.length<3)return null;const ws=w.split(' ').filter(x=>x.length>=3);
  const wordHit=c=>c.name.toLowerCase().split(/[\s-]+/).some(cw=>cw.length>=3&&ws.some(x=>cw.startsWith(x)||(x.length>=5&&x.startsWith(cw))));
  return S.chores.find(c=>c.name.toLowerCase()===w)||S.chores.find(c=>c.name.toLowerCase().startsWith(w))||S.chores.find(wordHit)||null};
const findExam=w=>{w=w.toLowerCase().trim();const f=w.split(' ')[0];return f&&f.length>2?activeExams().find(x=>x.subject.toLowerCase().startsWith(w)||x.subject.toLowerCase().split(/[\s:]/)[0].startsWith(f)):null};
const QTYPES=['event','task','reply','bday','dump'],QNAME={event:'Termin',task:'To-do',reply:'Menschen',bday:'Geburtstag',dump:'Dump',habit:'Habit',chore:'Haushalt',study:'Lernen',fix:'Verschieben',expense:'Ausgabe',income:'Einnahme',move:'Umbuchen'};
/* Fixes für einen Tag verschieben oder streichen: „Training 19:30“, „Training Do 19:00“, „Training fällt aus“, „Seminar 29.10. 15:00“ */
const FIXNAMES=[['sport',/^(training|sport|gym|workout|trainieren|krafttraining)$/i],['reward',/^(freizeit|freizeitslot)$/i],['evening',/^(runterfahren|abendroutine|schlafenszeit)$/i],
  ['lunch',/^(essen|mittagessen|kochen|kochen und essen|mittag)$/i],['out',/^(hinfahrt|fahrt in die bib|zug hin)$/i],['back',/^(heimfahrt|zug heim|heimweg)$/i]];
const FIXLAB={sport:'Training',reward:'Freizeit',evening:'Runterfahren',lunch:'Kochen und Essen',out:'Fahrt in die Bib',back:'Heimfahrt'};
/* Auf einen anderen TAG verschieben: „Training von 29.10. auf 28.10.“, „Training Do auf Mi verschieben“, „Training auf morgen verschieben“,
   „Seminar vom 3.11. auf 5.11. um 14:00“. Training über S.fixOv (mv), eigene Kalendertermine echt (geht zu Google). */
function parseDayMove(r0){if(/\b(jeden|jede|alle|täglich|wöchentlich|monatlich)\b/i.test(r0))return null;
  let s=' '+r0.replace(/(\b(?:von|vom|auf|nach)\s+)(\d{1,2}\.\d{1,2})(?![.\d:])/gi,'$1$2.')+' ';
  const mvw=/(^|\s)(verschieben|verschoben|verlegen|verlegt|tauschen)(?=\s)/i.test(s),re=new RegExp('\\s(von\\s+|vom\\s+|auf\\s+|nach\\s+|am\\s+)?'+DP+'(?=[\\s,])','gi');
  const ds=[];let m;while((m=re.exec(s))){const d=dateOf(m[2]);if(d)ds.push({d,pre:(m[1]||'').trim().toLowerCase(),raw:m[0]})}
  if(!ds.length||ds.length>2)return null;let from=null,to=null;
  if(ds.length===2){if(ds[0].pre==='auf'||ds[0].pre==='nach'){to=ds[0].d;from=ds[1].d}else{from=ds[0].d;to=ds[1].d}if(!/(^|\s)(auf|nach)\s/i.test(s)&&!mvw)return null}
  else{if(!(ds[0].pre==='auf'||ds[0].pre==='nach')||!mvw)return null;to=ds[0].d}
  ds.forEach(x=>{s=s.replace(x.raw,' ')});let time=null;
  if((m=s.match(/\s(?:um\s+|ab\s+)?(\d{1,2})[:.](\d{2})\s*(?:uhr)?(?=\s)/i))&&hm(m[1],m[2])){time=toMin(hm(m[1],m[2]));s=s.replace(m[0],' ')}
  else if((m=s.match(/\s(?:um\s+|ab\s+)?(\d{1,2})\s*uhr(?=\s)/i))&&hm(m[1])){time=toMin(hm(m[1]));s=s.replace(m[0],' ')}
  const name=s.replace(/(^|\s)(von|vom|auf|nach|am|um|ab|verschieben|verschoben|verlegen|verlegt|tauschen|bitte|das|den|die|mein|meinen|meine)(?=\s)/gi,' ').replace(/\s+/g,' ').trim();if(!name)return null;
  const f=FIXNAMES.find(([,re])=>re.test(name)),R=S.rhythm,t=TODAY();
  if(f){if(f[0]!=='sport')return null;const tr=S.habits.find(h=>/training/i.test(h.name));
    if(!from){for(let i=0;i<14;i++){const d=addDays(t,i);if(iso(d)===iso(to))continue;const o=fxOv(iso(d)).sport;if(o&&o.off)continue;if(!tr||scheduled(tr,d)){from=d;break}}}
    if(!from)return null;const fo=fxOv(iso(from)).sport;
    return {type:'fix',mv:true,key:'sport',title:'Training',from,fromDs:iso(from),date:to,ds:iso(to),time,orig:fromM(fo&&fo.s!=null?fo.s:toMin(R.sport))}}
  if(name.length<3)return null;const n=name.toLowerCase(),hit=e=>!e.allDay&&(e.title.toLowerCase().includes(n)||(e.title.length>=4&&n.includes(e.title.toLowerCase())));
  const ev=from?S.events.filter(e=>e.date===iso(from)&&hit(e)).sort((a,b)=>a.start.localeCompare(b.start))[0]:S.events.filter(e=>e.date>=iso(t)&&e.date!==iso(to)&&hit(e)).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start))[0];
  if(!ev)return null;return {type:'fix',mv:true,ev:ev.id,title:ev.title,from:parseISO(ev.date),fromDs:ev.date,date:to,ds:iso(to),time,readonly:!!ev.readonly,orig:ev.start}}
function parseFix(r0){if(/\b(jeden|jede|alle|täglich|wöchentlich|monatlich)\b/i.test(r0))return null;let s=' '+r0+' ',date=null,time=null;
  const off=/(^|\s)(fällt|faellt|ausfall|ausfallen|entfällt|entfaellt|absagen|abgesagt|streichen)(?=\s)/i.test(s);
  if(off)s=s.replace(/(^|\s)(fällt|faellt|ausfallen|ausfall|entfällt|entfaellt|absagen|abgesagt|streichen|aus|weg)(?=\s)/gi,' ');
  const dm=s.match(new RegExp('\\s(?:am\\s+)?'+DP+'(?=[\\s,])','i'));if(dm){const d=dateOf(dm[1]);if(d){date=d;s=s.replace(dm[0],' ')}}
  if(!off){let m;
    if((m=s.match(/\s(?:auf\s+|um\s+|ab\s+)?(\d{1,2})[:.](\d{2})\s*(?:uhr)?(?=\s)/i))&&hm(m[1],m[2])){time=toMin(hm(m[1],m[2]));s=s.replace(m[0],' ')}
    else if((m=s.match(/\s(?:auf\s+|um\s+|ab\s+)?(\d{1,2})\s*uhr(?=\s)/i)||s.match(/\s(?:auf|um|ab)\s+(\d{1,2})(?=\s)/i)||s.match(/\s(\d{1,2})\s*$/))&&hm(m[1])){time=toMin(hm(m[1]));s=s.replace(m[0],' ')}
    if(time==null)return null}
  const name=s.replace(/(^|\s)(auf|um|ab|am|verschieben|verschoben|nach hinten|später|heute)(?=\s)/gi,' ').replace(/\s+/g,' ').trim();if(!name)return null;
  const d=date||TODAY(),ds=iso(d);const f=FIXNAMES.find(([,re])=>re.test(name));
  if(f){const R=S.rhythm,o=fxOv(ds)[f[0]],orig=o&&o.s!=null?fromM(o.s):{sport:R.sport,reward:R.reward.start,lunch:R.lunch,evening:fromM(((toMin(R.wake)-R.sleep*60-R.wind)%1440+1440)%1440)}[f[0]]||null;
    return {type:'fix',key:f[0],title:FIXLAB[f[0]],date:d,ds,time,off,orig}}
  if(name.length<3)return null;const n=name.toLowerCase();
  const ev=S.events.filter(e=>e.date===ds&&!e.allDay&&(e.title.toLowerCase().includes(n)||(e.title.length>=4&&n.includes(e.title.toLowerCase())))).sort((a,b)=>a.start.localeCompare(b.start))[0];
  if(ev)return {type:'fix',ev:ev.id,title:ev.title,date:d,ds,time,off,readonly:!!ev.readonly,orig:ev.start};
  return null}
const NO_DOT_TIME_BEFORE=/(?:^|\s)(?:am|bis|vom|von|seit|kapitel|kap\.?|abschnitt|seite|s\.|version|v|nr\.?|punkt|§|abb\.?|tab\.?|folie|übung|aufgabe|frage|teil)$/i,
  NO_DOT_TIME_AFTER=/^\s+(?:h|std\.?|stunden?|min|minuten|km|kg|g|ml|l|eur|euro|€|seiten?|vl)(?=\s)/i;
function parseQuick(raw,force){const r0=String(raw||'').trim(),t=TODAY();
  if(!force){const mv=S.fin&&parseMove(r0);if(mv)return mv}
  if(!force||force==='expense'){const ex=parseExpense(r0);if(ex)return ex}
  if(force==='dump'||/^dump\b/i.test(r0)){const text=r0.replace(/^dump\b[:\s-]*/i,'').trim();return {type:'dump',title:text,text}}
  if(!force){
    const fx=parseDayMove(r0)||parseFix(r0);if(fx)return fx;
    // abhaken: „+kreatin“, „Kreatin ✓“, „Geschirrspüler erledigt“, „Anatomie fertig“
    let m=r0.match(/^\+\s*(.+)$/)||r0.match(/^(.+?)\s*(?:✓|✔|erledigt|fertig|gemacht|geschafft|done)$/i);
    if(m){const w=m[1].trim(),h=findHabit(w);if(h)return {type:'habit',title:h.name,ref:h.id};const c=findChore(w);if(c)return {type:'chore',title:c.name,ref:c.id,mode:'done'};
      const x=w.split(' ').length<=2&&findExam(w);if(x)return {type:'study',title:x.subject,ref:x.id,mode:'all'}}
    // Lernstand: „Anatomie 20 Seiten“, „Physio 2 VL“
    m=r0.match(/^(.+?)\s+(\d{1,4})\s*(seiten|seite|s\.|themen|thema|vl|vorlesungen?)\s*(gelernt|geschafft|gemacht|fertig)?$/i);
    if(m){const x=findExam(m[1]);if(x)return {type:'study',title:x.subject,ref:x.id,amt:+m[2],mode:'add'}}
    // Haushalt melden: „Müll“, „Müll voll“
    m=r0.match(/^(.+?)(?:\s+(?:ist\s+)?(?:voll|muss\s+raus|fällig|steht\s+an|ansteht|nötig|notwendig))?$/i);
    if(m&&m[1].split(' ').length<=2){const c=findChore(m[1].replace(/\b(heute|jetzt|wieder|machen)\b/gi,'').trim()||m[1]);if(c)return {type:'chore',title:c.name,ref:c.id,mode:'flag'}}
  }
  let s=' '+r0+' ';let date=null,time=null,end=null,list=null,important=false,due=null,endDate=null,allDay=false,dur=null,loc=null,rrule=null,now=false,doOn=null;
  const take=(re,fn)=>{const m=s.match(re);if(m&&fn(m)!==false){s=s.replace(m[0],' ');return true}return false};
  take(/\s#([\wäöüÄÖÜß]+)/,m=>{list=m[1]});
  take(/\s!(?=\s)/,()=>{important=true});
  take(/\s(jetzt|heute\s+rein|in\s+meinen\s+tag)(?=\s)/i,()=>{now=true});
  take(/\s(ganztägig|ganztags|den\s+ganzen\s+tag)(?=[\s,])/i,()=>{allDay=true});
  // Serie
  take(/\s(jeden|jede|alle)\s+(2\.?\s+|zweiten\s+|2\s+wochen\s+am\s+)?(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|mo|di|mi|do|fr|sa|so)\.?(?=[\s,])/i,m=>{const wd=WDMAP[m[3].toLowerCase()];rrule=`RRULE:FREQ=WEEKLY;${m[2]?'INTERVAL=2;':''}BYDAY=${WDRR[wd]}`;date=addDays(t,(wd-t.getDay()+7)%7)});
  if(!rrule)take(/\s(täglich|jeden\s+tag|wöchentlich|jede\s+woche|monatlich|jeden\s+monat|jährlich|jedes\s+jahr)(?=[\s,])/i,m=>{const w=m[1].toLowerCase();rrule='RRULE:FREQ='+(/tägl|tag/.test(w)?'DAILY':/woch/.test(w)?'WEEKLY':/monat/.test(w)?'MONTHLY':'YEARLY')});
  // Zeitraum: „3.–10.11.“, „3.11. bis 10.11.“
  take(/\s(?:vom\s+|von\s+)?(\d{1,2})\.(?:(\d{1,2})\.)?\s*(?:-|–|bis)\s*(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})?(?=[\s,])/i,m=>{if(/\bam$/i.test(s.slice(0,m.index).trim()))return false;const b=dateOf(`${m[3]}.${m[4]}.${m[5]||''}`);if(!b)return false;
    let a=new Date(b.getFullYear(),m[2]?+m[2]-1:b.getMonth(),+m[1]);if(a>b)a=new Date(a.getFullYear()-1,a.getMonth(),a.getDate());if(isNaN(a))return false;date=a;endDate=addDays(b,1);allDay=true});
  if(!endDate){
    take(new RegExp('\\sbis\\s+'+DP+'(?=[\\s,])','i'),m=>{const d=dateOf(m[1]);if(!d)return false;due=d});
    take(new RegExp('\\s(?:am\\s+)?'+DP+'(?=[\\s,])','i'),m=>{const d=dateOf(m[1]);if(!d)return false;if(!rrule||!date)date=d});
  }
  take(/\s(?:um\s+|von\s+)?(\d{1,2})[:.](\d{2})\s*(?:uhr)?\s*(?:-|–|bis)\s*(\d{1,2})[:.](\d{2})\s*(?:uhr)?(?=\s)/i,m=>{const a=hm(m[1],m[2]),b=hm(m[3],m[4]);if(!a||!b)return false;time=a;end=b});
  if(!time)take(/\s(?:um\s+)?(\d{1,2}):(\d{2})\s*(?:uhr)?(?=\s)/i,m=>{const a=hm(m[1],m[2]);if(!a)return false;time=a});
  /* Uhrzeit mit Punkt: „Zahnarzt 14.30“ (repariert 10.11.2026, wurde vorher ein To-do „Zahnarzt 14.30“; Zeitraum und Fixes konnten den Punkt schon).
     Ein Datum hat immer den Punkt am Ende („12.11.“) und ist an dieser Stelle schon erkannt. Eine Punkt-Zahl ist KEINE Uhrzeit:
     nach am/bis/vom/von/seit (gemeint ist ein Datum), nach Kapitel/Seite/Nr. …, vor einer Einheit (h, min, km …). „um 14.30“ und „14.30 Uhr“ gelten immer.
     Geld ist davon unberührt: Beträge brauchen Komma oder € und sind weiter oben (parseExpense) schon weg. */
  if(!time)for(const m of s.matchAll(/\s(um\s+)?(\d{1,2})\.(\d{2})\s*(uhr)?(?=\s)/gi)){const a=hm(m[2],m[3]);if(!a)continue;
    if(!m[1]&&!m[4]&&(NO_DOT_TIME_BEFORE.test(s.slice(0,m.index))||NO_DOT_TIME_AFTER.test(s.slice(m.index+m[0].length))))continue;
    time=a;s=s.slice(0,m.index)+' '+s.slice(m.index+m[0].length);break}
  if(!time)take(/\sum\s+(\d{1,2})(?:\s*uhr)?(?=\s)/i,m=>{const a=hm(m[1]);if(!a)return false;time=a});
  if(!time)take(/\s(\d{1,2})\s*uhr(?=\s)/i,m=>{const a=hm(m[1]);if(!a)return false;time=a});
  take(/\s(\d+)\s*h\s*(\d{1,2})(?:\s*min)?(?=\s)/i,m=>{dur=+m[1]*60+ +m[2]})||take(/\s(\d+(?:[.,]\d+)?)\s*(?:h|std\.?|stunden?)(?=\s)/i,m=>{dur=Math.round(parseFloat(m[1].replace(',','.'))*60)})||take(/\s(\d{1,3})\s*(?:min|minuten)(?=\s)/i,m=>{dur=+m[1]});
  take(/\s@\s*(.+?)\s*$/,m=>{loc=m[1].trim()});
  let title=s.replace(/\s+/g,' ').trim().replace(/^(am|um|bis|vom)\s+/i,'').replace(/\s+(am|um|bis|,)$/i,'').replace(/[,\s]+$/,'').trim();
  if(list){const f=S.lists.find(l=>l.toLowerCase()===list.toLowerCase());list=f||list[0].toUpperCase()+list.slice(1)}
  // Geburtstag (ohne Uhrzeit): „Geburtstag Anna 3.5.“, „Anna hat am 3.5.1998 Geburtstag“
  const isBday=/geburtstag|\bgeb\.|\bbday\b/i.test(title);
  let type=force||(time||allDay||endDate||(rrule&&date)?'event':isBday&&(date||due)?'bday':'task'),who=null,kind=null,note='';
  if(isBday&&type==='bday'||force==='bday'){
    const ym=r0.match(/\d{1,2}\.\d{1,2}\.(\d{4})/)||r0.match(/\d{1,2}\.\s*[a-zäöü]+\.?\s+(\d{4})/i);
    const bd=date||due;const name=title.replace(/geburtstag(s)?|\bgeb\.|\bbday\b|\bhat\b|\bvon\b|\bam\b|\bist\b/gi,' ').replace(/['’]s\b/g,'').replace(/\s+/g,' ').trim();
    return {type:'bday',title:name?name[0].toUpperCase()+name.slice(1):'',name,date:bd,md:bd?iso(bd).slice(5):null,year:ym?+ym[1]:null}}
  const rawNote=(r0.match(/\s(wegen|weil|für|fuer|zum|zur|bzgl\.?)\s+(.*)$/i)||[]).slice(1).join(' ').trim();
  if(!force&&type==='task'){const r=parseReply(title);if(r){type='reply';who=r.name;kind=r.kind;note=rawNote||r.note}}
  if(force==='reply'){const r=parseReply(title,true);if(!r)return {type:'reply',title:'',who:null};who=r.name;kind=r.kind;note=rawNote||r.note}
  if(type==='event'){if(!date)date=due||t;if(time&&!end)end=fromMin(Math.min(toMin(time)+(dur||60),23*60+59));if(!time)allDay=true;if(allDay&&!endDate)endDate=addDays(date,1)}
  if(type==='task'){if(due&&date&&date<=due){doOn=date}else if(!due&&date){due=date}
    if(!list&&/\b(kaufen|besorgen|einkaufen|holen)\b/i.test(title)){const e=S.lists.find(l=>/einkauf/i.test(l));if(e)list=e}}
  return {type,title:type==='reply'?(who||''):title,date,time,end,list,important,who,kind,note,due,doOn,allDay,endDate,dur,loc,rrule,now}}
const rrLabel=r=>{if(!r)return '';const m=r.match(/FREQ=(\w+)/)[1],by=(r.match(/BYDAY=(\w\w)/)||[])[1],iv=/INTERVAL=2/.test(r);
  return m==='WEEKLY'&&by?`${iv?'alle 2 Wochen':'jeden'} ${WDL[WDRR.indexOf(by)]}`:{DAILY:'täglich',WEEKLY:'wöchentlich',MONTHLY:'monatlich',YEARLY:'jährlich'}[m]};
function qLine(p){if(p.type==='move')return `<span class="q-type c-uni">Umbuchen</span><div class="q-main"><b>${eur(p.amount)} · ${esc(p.title)}</b><span>zwischen deinen Spartöpfen</span></div>`;
  if(p.type==='income')return `<span class="q-type c-uni">Einnahme</span><div class="q-main"><b>+${eur(p.amount)} · ${esc(p.title)}</b><span>${p.to==='save'?'direkt auf die Spartöpfe':'ins Budget dieses Monats'}${p.date!==iso(TODAY())?' · '+fmtShort(parseISO(p.date)):''}</span></div>`;
  if(p.type==='expense'){const c=fcat(p.cat),pt=p.pot&&F().pots.find(x=>x.id===p.pot);return `<span class="q-type c-task">Ausgabe</span><div class="q-main"><b>${eur(p.amount)} · ${esc(p.title)}</b><span>${c[1]}${p.date!==iso(TODAY())?' · '+fmtShort(parseISO(p.date)):''}${pt?` · aus Topf ${esc(pt.name)}`:' · Wochenbudget'}</span></div>`}
  const lab=p.type==='fix'&&p.off?'Fällt aus':QNAME[p.type],c={fix:'c-training',event:'c-uni',task:'c-task',reply:'c-bday',bday:'c-bday',dump:'c-hol',habit:'c-training',chore:'c-task',study:'c-uni'}[p.type];
  let main=esc(p.title||''),sub='';
  if(p.type==='event'){const d=p.date;sub=p.allDay?(p.endDate&&diffDays(d,p.endDate)>1?`${fmtShort(d)} bis ${fmtShort(addDays(p.endDate,-1))} · ganztägig`:`${fmtShort(d)} · ganztägig`):`${fmtShort(d)} · ${p.time}–${p.end}`;
    if(p.rrule)sub+=` · ${rrLabel(p.rrule)}`;if(p.loc)sub+=` · @ ${esc(p.loc)}`}
  else if(p.type==='task'){sub=p.due?`${fristTxt({due:iso(p.due)})} (${fmtShort(p.due)})`:'ohne Frist';if(p.doOn)sub+=` · erledigen ${fmtShort(p.doOn)}`;sub+=` · ${esc(p.list||'Privat')}`;if(p.dur)sub+=` · ${fmtDur(p.dur)}`;if(p.now)sub+=' · kommt jetzt in deinen Tag';if(p.important)main+=' ★'}
  else if(p.type==='reply'){if(!p.who)return `<span class="q-type ${c}">${lab}</span><div class="q-main"><b>Name fehlt</b><span>z. B. „${bspN()} Nachricht“</span></div>`;main=esc(p.who);sub=KINDS[p.kind].l+(p.note?` · ${esc(p.note)}`:'')}
  else if(p.type==='bday'){if(!p.md||!p.name)return `<span class="q-type ${c}">${lab}</span><div class="q-main"><b>${p.name?esc(p.title):'Name fehlt'}</b><span>${p.md?'':'Datum fehlt, z. B. „Geburtstag '+bspN()+' '+bspG()+'“'}</span></div>`;
    const d=p.date;sub=`${d.getDate()}. ${MON[d.getMonth()]}${p.year?` · wird ${nextAge(p.md,p.year)}`:''} · jährlich in Google`}
  else if(p.type==='dump'){sub='geparkt, sortierst du später';if(!p.title)main='…'}
  else if(p.type==='fix'&&p.mv){sub=p.ev&&p.readonly?'fremder Termin, kann ich nicht verschieben':iso(p.from)===iso(p.date)?'gleicher Tag':`${fmtShort(p.from)} → ${fmtShort(p.date)}, ${p.time!=null?fromM(p.time):p.key==='sport'?fromM(toMin(S.rhythm.sport)):p.orig}${p.ev?' · auch in Google':''}`}
  else if(p.type==='fix'){const dl=diffDays(TODAY(),p.date),day=dl===0?'heute':dl===1?'morgen':fmtShort(p.date);
    sub=p.off?`fällt ${day} aus`:`${day} ab ${fromM(p.time)}${p.orig?` statt ${p.orig}`:''}${p.ev&&p.readonly?' · nur in deinem Plan':p.ev?' · auch in Google':''}`;
    if((p.key==='out'||p.key==='back')&&dl!==0)sub='geht nur für heute';if(p.off&&['out','back','evening'].includes(p.key))sub='kann nicht ausfallen, gib eine Uhrzeit an'}
  else if(p.type==='habit')sub='heute abhaken';
  else if(p.type==='chore')sub=p.mode==='flag'?'steht jetzt an':'erledigt';
  else if(p.type==='study')sub=p.mode==='add'?`+${p.amt} heute eintragen`:'heutiges Pensum geschafft';
  return `<span class="q-type ${c}">${lab}</span><div class="q-main"><b>${main}</b><span>${sub}</span></div>`}
function nextAge(md,y){const t=TODAY();let n=t.getFullYear()-y;if(iso(t).slice(5)>md)n++;return n}
const qSplit=raw=>String(raw||'').split(';').map(x=>x.trim()).filter(Boolean);
const qValid=p=>p.type==='fix'&&p.mv?!(p.ev&&p.readonly)&&iso(p.from)!==iso(p.date):p.type==='expense'||p.type==='income'||p.type==='move'?p.amount>0:p.type==='fix'?(p.off?!['out','back','evening'].includes(p.key):p.time!=null)&&(!['out','back'].includes(p.key)||p.ds===iso(TODAY())):p.type==='reply'?!!p.who:p.type==='bday'?!!(p.md&&p.name):p.type==='dump'?!!p.text:!!p.title;
function quickPreview(raw,force){const parts=qSplit(raw);
  if(!parts.length){const lq=S.lastQuick&&Date.now()-S.lastQuick.at<10*60e3?S.lastQuick:null;
    return lq?`<span class="empty">Zuletzt: ${esc(lq.label)}</span><button type="button" class="link q-undo" data-act="q-undo">Rückgängig</button>`:'<span class="empty">Tipp einfach los, die Vorschau zeigt, was daraus wird.</span>'}
  if(parts.length>1)return `<div class="q-multi">${parts.map(x=>`<div class="q-row">${qLine(parseQuick(x))}</div>`).join('')}</div><span class="q-enter"><kbd>Enter</kbd> alle ${parts.length} anlegen</span>`;
  const p=parseQuick(parts[0],force);
  return `${qLine(p)}<span class="q-enter">${qValid(p)?'<kbd>Enter</kbd> anlegen':''}${QTYPES.includes(p.type)||force?`<br><kbd>Tab</kbd> ${force?'Typ: '+QNAME[force]:'Typ ändern'}`:''}</span>`}
function qNextType(raw,force){const p=parseQuick(qSplit(raw)[0]||'',force),cur=force||p.type,i=QTYPES.indexOf(cur);return QTYPES[(i+1)%QTYPES.length]}
function planNext(id){const P=planDay(),k='t:'+id,cur=P.cur&&!P.cur.fixed?P.cur.k:null,o=P.order.filter(z=>z!==k),i=cur?o.indexOf(cur)+1:0;o.splice(i,0,k);const x=S.tasks.find(z=>z.id===id);if(x)x.inPlan=iso(TODAY());dpState().order=o}
function commitOne(p,ops){const ds=iso(TODAY());if(!qValid(p))return null;
  if(p.type==='expense')return addExpense(p,ops);
  if(p.type==='income')return addIncome(p,ops);
  if(p.type==='move')return movePot(p.from,p.to,p.amount,ops);
  if(p.type==='dump'){const it={id:uid(),text:p.text,added:ds};(S.inbox=S.inbox||[]).push(it);ops.push({c:'inbox',del:it.id});return 'Geparkt: '+p.text}
  if(p.type==='reply'){const it={id:uid(),name:p.who,kind:p.kind,note:p.note||'',added:ds};S.replies.push(it);ops.push({c:'replies',del:it.id});return `${p.who} · ${KINDS[p.kind].s}`}
  if(p.type==='bday'){const it={id:uid(),name:p.title,md:p.md,year:p.year||null};(S.myBdays=S.myBdays||[]).push(it);ops.push({c:'myBdays',del:it.id});return `Geburtstag ${p.title}`}
  if(p.type==='fix'){const dl=diffDays(TODAY(),p.date),day=dl===0?'heute':dl===1?'morgen':fmtShort(p.date),pd=p.ds;S.fixOv=S.fixOv||{};const dayOv=S.fixOv[pd]=S.fixOv[pd]||{};
    const setOv=(k,v)=>{ops.push({c:'fixOv',ds:pd,k,prev:dayOv[k]||null});dayOv[k]=v};
    if(p.mv){const fd=fmtShort(p.from),td=fmtShort(p.date);
      if(p.ev){const e=S.events.find(z=>z.id===p.ev);if(!e||e.readonly)return null;ops.push({c:'evtime',id:e.id,prev:{date:e.date,start:e.start,end:e.end}});e.date=p.ds;
        if(p.time!=null){const d=toMin(e.end)-toMin(e.start);e.start=fromM(p.time);e.end=fromM(Math.min(p.time+d,1439))}return `${e.title}: ${fd} → ${td}, ${e.start}`}
      const fo=S.fixOv[p.fromDs]=S.fixOv[p.fromDs]||{};ops.push({c:'fixOv',ds:p.fromDs,k:'sport',prev:fo.sport||null});fo.sport={off:true,mv:p.ds};
      const st=p.time!=null?p.time:(dayOv.sport&&dayOv.sport.s!=null?dayOv.sport.s:toMin(S.rhythm.sport));setOv('sport',{s:st,on:true,mv:p.fromDs});
      return `Training: ${fd} → ${td}, ${fromM(st)}`}
    if(p.ev){const e=S.events.find(z=>z.id===p.ev);if(!e)return null;
      if(!p.off&&!e.readonly){ops.push({c:'evtime',id:e.id,prev:{start:e.start,end:e.end}});const d=toMin(e.end)-toMin(e.start);e.start=fromM(p.time);e.end=fromM(Math.min(p.time+d,1439));return `${e.title}: ${day} ${e.start}`}
      setOv('ev:'+e.id,p.off?{off:true}:{s:p.time});return p.off?`${e.title} fällt ${day} aus`:`${e.title}: ${day} ${fromM(p.time)} (nur im Plan)`}
    if(p.key==='out'||p.key==='back'){const dp=dpState();ops.push({c:'dp',prev:{outDep:dp.outDep,homeBy:dp.homeBy}});
      if(p.key==='back')dp.homeBy=fromM(Math.max(0,p.time-S.rhythm.bibWay));else{const tr=tripsOn('w2p').find(x=>x.dep>=p.time);dp.outDep=tr?tr.m:null}return `${p.title}: ab ${fromM(p.time)}`}
    if(p.key==='lunch'&&pd===iso(TODAY())){const dp=dpState();ops.push({c:'dp',prev:{essAt:dp.essAt?{...dp.essAt}:null}});if(dp.essAt)delete dp.essAt.lunch}
    const keepMv=dayOv[p.key]&&dayOv[p.key].on?{on:true,mv:dayOv[p.key].mv}:{};setOv(p.key,p.off?{off:true}:{...keepMv,s:p.time});return p.off?`${p.title} fällt ${day} aus`:`${p.title}: ${day} ab ${fromM(p.time)}`}
  if(p.type==='habit'){const h=S.habits.find(z=>z.id===p.ref);ops.push({c:'habits',id:h.id,ds,prev:h.log[ds]||null});h.log[ds]=true;return `${h.name} abgehakt`}
  if(p.type==='chore'){const c=S.chores.find(z=>z.id===p.ref);ops.push({c:'chores',id:c.id,prev:{last:c.last,flagged:!!c.flagged}});if(p.mode==='flag')c.flagged=true;else{c.last=ds;c.flagged=false}return `${c.name} ${p.mode==='flag'?'steht an':'erledigt'}`}
  if(p.type==='study'){const x=S.exams.find(z=>z.id===p.ref),pl=studyPlan(x);x.log=x.log||{};ops.push({c:'exams',id:x.id,ds,prev:x.log[ds]||0});
    const v=p.mode==='add'?(x.log[ds]||0)+p.amt:Math.max(x.log[ds]||0,pl.today?pl.today.amt:0);x.log[ds]=Math.max(0,Math.min(pl.total-pl.doneBefore,v));return `${x.subject}: ${x.log[ds]} ${x.log[ds]===1?UNIT[x.mode].one:UNIT[x.mode].many} heute`}
  if(p.type==='event'){const e={id:uid(),title:p.title,date:iso(p.date),start:p.allDay?'00:00':p.time,end:p.allDay?'23:59':p.end,cal:(p.list&&/uni/i.test(p.list))?'uni':'privat',important:p.important};
    if(p.allDay){e.allDay=true;e.endDate=iso(p.endDate)}if(p.loc)e.loc=p.loc;if(p.rrule)e.rrule=p.rrule;S.events.push(e);ops.push({c:'events',del:e.id});return `${p.title} · ${fmtShort(p.date)}${p.allDay?'':', '+p.time}`}
  if(p.list&&!S.lists.includes(p.list))S.lists.push(p.list);
  const x={id:uid(),title:p.title,list:p.list||'Privat',due:p.due?iso(p.due):null,doOn:p.doOn?iso(p.doOn):null,mins:p.dur||null,important:p.important,done:false,doneAt:null};
  S.tasks.push(x);ops.push({c:'tasks',del:x.id});if(p.now)planNext(x.id);return p.title}
function commitQuick(raw,keep,force,inboxId){const parts=qSplit(raw);if(!parts.length)return null;const ops=[],labels=[];
  parts.forEach(x=>{const l=commitOne(parseQuick(x,parts.length===1?force:null),ops);if(l)labels.push(l)});if(!labels.length)return null;
  if(inboxId){const it=(S.inbox||[]).find(z=>z.id===inboxId);if(it){S.inbox=S.inbox.filter(z=>z.id!==inboxId);ops.push({c:'inbox',add:it})}}
  const label=labels.length>1?`${labels.length} Einträge: ${labels.join(' · ')}`:labels[0];S.lastQuick={at:Date.now(),label,ops};
  save();if(!keep)closeOverlay();if(MODE!=='quick')refresh();toast(labels.length>1?`${labels.length} Einträge angelegt`:'Angelegt',label,false,{act:'q-undo',txt:'Rückgängig'});return label}
function undoQuick(){const lq=S.lastQuick;if(!lq)return;
  lq.ops.slice().reverse().forEach(o=>{
    if(o.c==='fin-exp'){delExpense(o.id);return}
    if(o.c==='fin-inc'){delIncome(o.id);return}
    if(o.c==='fin-date'){const e=F().expenses.find(x=>x.id===o.id);if(e){e.date=o.d;F().potLog.forEach(l=>{if(l.exp===e.id)l.date=o.d})}return}
    if(o.c==='fin-mv'){F().potLog=F().potLog.filter(l=>l.mv!==o.id);return}
    if(o.c==='fixOv'){const d=(S.fixOv||{})[o.ds];if(d){if(o.prev)d[o.k]=o.prev;else delete d[o.k]}return}
    if(o.c==='evtime'){const e=S.events.find(z=>z.id===o.id);if(e)Object.assign(e,o.prev);return}
    if(o.c==='dp'){const dp=dpState();Object.entries(o.prev).forEach(([k,v])=>{if(v==null&&k!=='outDep')delete dp[k];else dp[k]=v});return}
    const arr=S[o.c]||(S[o.c]=[]);
    if(o.del){S[o.c]=arr.filter(z=>z.id!==o.del);if(o.c==='tasks')Object.values(S.dayPlan||{}).forEach(d=>d.order=d.order.filter(k=>k!=='t:'+o.del))}
    else if(o.add)arr.push(o.add);
    else{const z=arr.find(q=>q.id===o.id);if(!z)return;if(o.c==='habits'){if(o.prev)z.log[o.ds]=o.prev;else delete z.log[o.ds]}else if(o.c==='chores')Object.assign(z,o.prev);else if(o.c==='exams'){z.log=z.log||{};z.log[o.ds]=o.prev}}});
  S.lastQuick=null;save();if(MODE!=='quick')refresh();toast('Rückgängig gemacht',lq.label)}
const EX=['Zahnarzt Do 14:30 45min @ Floridsdorf','Formular am Mi bis Fr',bspN()+' Nachricht wegen Samstag','Geburtstag '+bspN()+' '+bspG(),'dump Idee für Referat','Milch kaufen; Oma anrufen'];
const LEGEND=[['Termin','Zahnarzt Do 14:30','Uhrzeit macht einen Termin'],['','… 14:30–15:15 · … 45min · … 2h','Endzeit oder Dauer (sonst 1 h)'],['','… @ Floridsdorf','Ort, immer am Ende'],
  ['','Urlaub 3.–10.11. · Exkursion Fr ganztägig','ganztägig oder mehrtägig'],['','Physio jeden Mo 10:00 · jeden 2. Mi · täglich','Serie in Google'],
  ['To-do','Bericht bis Fr','ohne Uhrzeit: To-do mit Frist'],['','Formular am Mi bis Fr','erledigen Mi, Frist Fr'],['','Fahrrad reparieren 30min','Dauer im Tagesplan'],['','… jetzt','sofort als Nächstes in deinen Tag'],
  ['','#uni · !','Liste · wichtig'],['','Milch kaufen','landet automatisch bei Einkauf'],
  ['Menschen',bspN()+' Nachricht · Anruf · Sprachnachricht · Treffen · melden · danke','Anlass erkennen'],['','… wegen Samstag','Notiz dazu'],
  ['Geburtstag','Geburtstag '+bspN()+' '+bspG()+' · '+bspN()+' hat am '+bspG()+bspJ()+' Geburtstag','jährlich in Google, mit Jahr auch Alter'],
  ['Dump','dump Gedanke …','parken, später einordnen'],['Abhaken','+kreatin · Kreatin ✓ · Geschirrspüler erledigt','Habit oder Haushalt'],['','Müll · moppen · bügeln · Müll voll','Haushaltsaufgabe steht jetzt an'],
  ['Lernen','Anatomie 20 Seiten · Physio 2 VL · Anatomie fertig','Fortschritt eintragen'],
  ['Fixes','Training 19:30 · Training Do 19:00','Fixtermin für diesen Tag verschieben'],['','Training fällt aus · Training Do ausfall','an dem Tag streichen'],['','Training von Do auf Mi · Training von 29.10. auf 28.10. um 17:00','auf einen anderen Tag (auch eigene Termine)'],
  ['','Essen 14:00 · Freizeit 22:00 · Heimfahrt 17:30 · Seminar 15:00','geht für alle Fixes und Kalendertermine'],
  ['Geld','12,50 Mittagessen · Kaffee 4€ · 39,90 Hose aus Topf','Ausgabe eintragen (Kategorie automatisch)'],['','gestern 8,40 Spar · 8.11. 12,41 Billa · Mo 3,05 Spar','nachtragen: Tag davor, immer rückwärts gemeint'],['','+50 Oma · 50€ von Oma bekommen · +50 Oma sparen','Extra-Geld: ins Budget oder direkt auf die Töpfe'],['','20 von Kleidung nach allgemein','zwischen Spartöpfen umbuchen'],
  ['Mehrere','Milch kaufen; Oma anrufen; Zahnarzt Do 14:30','mit ; trennen'],['Tasten','Tab · Enter · Esc','Typ ändern · anlegen · schließen']];
const legendHTML=()=>`<table class="legend"><tbody>${LEGEND.map(([a,b,c])=>`<tr class="${a?'lg-first':''}"><th>${a}</th><td><code>${esc(b)}</code></td><td>${c}</td></tr>`).join('')}</tbody></table>`;
function wireQuick(inp,opts){let force=null;const prev=()=>$('#q-prev');
  const upd=()=>{prev().innerHTML=quickPreview(inp.value,force);opts.onResize&&opts.onResize()};
  inp.addEventListener('input',()=>{if(!inp.value.trim())force=null;upd()});
  inp.addEventListener('keydown',e=>{
    if(e.key==='Tab'&&qSplit(inp.value).length===1){e.preventDefault();force=qNextType(inp.value,force);upd()}
    else if(e.key==='Escape'&&opts.onEsc){opts.onEsc()}
    else if(e.key==='Enter'){e.preventDefault();const l=commitQuick(inp.value,true,force,opts.inboxId);if(!l)return;force=null;opts.onDone(l)}
    else if(e.key==='z'&&(e.ctrlKey||e.metaKey)&&!inp.value&&S.lastQuick){e.preventDefault();undoQuick();upd()}});
  upd()}
function quickBox(ph){return `<div class="modal quick" role="dialog" aria-label="Schnelleingabe"><div class="q-field">${ic('bolt',20)}<label class="sr" for="q-in">Schnelleingabe</label><input id="q-in" type="text" autocomplete="off" placeholder="${ph}"></div>
  <div class="q-prev" id="q-prev"></div>
  <div class="q-foot"><span class="hint">Tab ändert den Typ · ; trennt mehrere · Strg+Z macht den letzten rückgängig</span><button type="button" class="link" data-act="q-legend">Legende</button></div>
  <div class="q-legend" id="q-legend" hidden>${legendHTML()}</div></div>`}
function openQuick(prefill,inboxId){overlay(quickBox('z. B. Zahnarzt Do 14:30')+'','top');
  $('.modal.quick').insertAdjacentHTML('beforeend',`<div class="q-ex"><span>Probier:</span>${EX.map(x=>`<button type="button" class="chip" data-act="q-ex" data-x="${esc(x)}">${esc(x)}</button>`).join('')}</div>`);
  const inp=$('#q-in');if(prefill)inp.value=prefill;inp.focus();
  wireQuick(inp,{inboxId,onDone:()=>closeOverlay()})}

