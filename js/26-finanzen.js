/* ---------- Finanzen (alles lokal, nichts geht zu Google) ----------
   Monatlich: Einnahmen (am 1.) − Fixkosten − Sparen (auf Töpfe) − ETF-Sparpläne = frei verfügbar.
   Frei verfügbar wird nach Tagen auf die Wochen des Monats verteilt. Wer in einer Woche drüber/unter liegt,
   verschiebt automatisch das Budget der restlichen Wochen (Rest ÷ restliche Tage). Monatsende: Übrig → Töpfe nach %. */
const FCATS=[['lebensmittel','Lebensmittel','#5E8C61',/\b(spar|billa|hofer|lidl|penny|merkur|einkauf|lebensmittel|supermarkt|interspar|bipa?\s*essen|brot|milch|obst|gemüse)\b/i],
  ['essen','Essen & Trinken','#C27C3A',/\b(mittagessen|abendessen|frühstück|mensa|restaurant|kaffee|café|cafe|kebab|döner|pizza|burger|mcdonald|bäcker|snack|lieferando|wolt|essen|trinken|getränk|bier)\b/i],
  ['mobil','Mobilität','#3E7CB1',/\b(öbb|oebb|zug|ticket|wiener linien|bahn|bus|taxi|uber|bolt|tanken|benzin|flixbus|parken|klimaticket|maut|vignette)\b/i],
  ['ausgehen','Ausgehen & Freizeit','#8E5EA2',/\b(kino|bar|club|party|konzert|ausgehen|eintritt|ball|feier|museum|bowling|freizeit)\b/i],
  ['kleidung','Kleidung','#B5527A',/\b(kleidung|hose|jacke|schuhe|shirt|pullover|zara|h&m|zalando|kleid|socken)\b/i],
  ['kosmetik','Drogerie & Kosmetik','#D08AA9',/\b(dm|bipa|müller|drogerie|kosmetik|parfum|parfüm|duft|shampoo|deo|creme|rasier)\b/i],
  ['gesundheit','Gesundheit & Sport','#4A9A8A',/\b(apotheke|arzt|medikament|fitness|gym|protein|kreatin|supplement|sport)\b/i],
  ['uni','Uni & Bücher','#6B7FA8',/\b(buch|bücher|skript|uni|kopien|drucken|amboss|thieme|lernkarten|anki|kurs)\b/i],
  ['digital','Abos & Digital','#5C6F7A',/\b(netflix|spotify|crunchyroll|abo|app|icloud|google one|steam|playstation|game|spiel)\b/i],
  ['geschenke','Geschenke','#C9A227',/\b(geschenk|geburtstag|blumen|mitbringsel)\b/i],
  ['sonstiges','Sonstiges','#8A8F8C',null]];
const fcat=k=>FCATS.find(c=>c[0]===k)||FCATS[FCATS.length-1];
const eur=n=>(Math.round(n*100)/100).toLocaleString('de-AT',{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2})+' €';
const eur0=n=>Math.round(n).toLocaleString('de-AT')+' €';
const ymOf=ds=>ds.slice(0,7);
function F(){if(!S.fin)S.fin={since:iso(TODAY()).slice(0,7),income:0,saveMonthly:0,
    pots:[{id:'p_gesch',name:'Geschenke',pct:20,cat:'geschenke'},{id:'p_kleid',name:'Kleidung',pct:20,cat:'kleidung'},{id:'p_kosm',name:'Kosmetik',pct:15,cat:'kosmetik'},{id:'p_allg',name:'Sparen allgemein',pct:45,cat:null}],
    fixed:[],etf:[],paid:{},expenses:[],potLog:[],closed:{},catMap:{}};
  const f=S.fin;f.extra=f.extra||[];f.trips=f.trips||[];f.monthAdj=f.monthAdj||{};f.skipSave=f.skipSave||{};f.start=f.start||{};f.wait=f.wait||{};f.incomeOv=f.incomeOv||{};return f}
const fixSum=()=>F().fixed.reduce((a,x)=>a+(+x.amount||0)/(x.every||1),0);
const etfSum=()=>F().etf.reduce((a,x)=>a+(+x.amount||0),0);
const freeOf=()=>{const f=F();return (+f.income||0)-fixSum()-(+f.saveMonthly||0)-etfSum()};
const daysIn=ym=>{const [y,m]=ym.split('-').map(Number);return new Date(y,m,0).getDate()};
const dOf=(ym,d)=>`${ym}-${pad(d)}`;
const potBal=id=>F().potLog.filter(l=>l.pot===id).reduce((a,l)=>a+l.amount,0);
const genPot=()=>{const f=F();return f.pots.find(p=>!p.cat)||f.pots[0]};
function potSplit(amount,why,ym,tag,extra){const f=F(),sum=f.pots.reduce((a,p)=>a+(+p.pct||0),0)||100;
  f.pots.forEach(p=>{const v=Math.round(amount*(+p.pct||0)/sum*100)/100;if(v)f.potLog.push({date:iso(TODAY()),pot:p.id,amount:v,why,ym,tag,...(extra||{})})})}
/* Reisen/Sonderzeiten: eigenes Budget, die Tage zählen nicht fürs normale Tagesbudget.
   Was über das Reisebudget hinausgeht, zählt ab dann wie normale Ausgaben. */
const inTrip=ds=>F().trips.find(t=>ds>=t.from&&ds<=t.to)||null;
const tripLen=t=>diffDays(parseISO(t.from),parseISO(t.to))+1;
/* Kein Topf geht ins Minus: Ausgaben „aus Topf“ nehmen nur, was im Topf ist (e.potAmt); der Rest zählt fürs Budget. */
const bPart=e=>e.pot?Math.max(0,e.amount-(e.potAmt!=null?e.potAmt:e.amount)):e.amount;
const potFree=id=>Math.max(0,Math.round(potBal(id)*100)/100);
function normMap(){const f=F(),m={};f.trips.forEach(t=>{let left=+t.budget||0;f.expenses.filter(e=>bPart(e)>0&&e.date>=t.from&&e.date<=t.to).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)).forEach(e=>{const use=Math.min(left,bPart(e));left-=use;m[e.id]=bPart(e)-use})});return m}
function spentIn(from,to,nm=normMap()){return F().expenses.filter(e=>bPart(e)>0&&e.date>=from&&e.date<=to).reduce((a,e)=>a+(e.id in nm?nm[e.id]:bPart(e)),0)}
const tripSpent=t=>F().expenses.filter(e=>bPart(e)>0&&e.date>=t.from&&e.date<=t.to).reduce((a,e)=>a+bPart(e),0);
/* ---------- Budgetzeitraum (Paket 3, 11.11.2026): Das Geld für einen Monat kann früher oder später kommen ----------
   Der Zeitraum eines Monats ym läuft von pStart(ym) bis zum Tag vor pStart(nächster Monat). Standard: der 1., dann ist alles wie früher.
   f.start[ym]='JJJJ-MM-TT' = Geld für ym kam/kommt an dem Tag (frühestens 20 Tage vor dem 1., spätestens am Monatsletzten).
   f.wait[ym]=true = Geld für ym ist noch nicht da, Tag offen: der Vormonat läuft weiter (Start = morgen, rollt jeden Tag mit).
   f.incomeOv[ym] = anderer Betrag nur in diesem Monat. Nur zusätzliche Felder; der Ankunftstag gehört schon zum neuen Monat. */
const ymNext=ym=>+ym.slice(5,7)===12?`${+ym.slice(0,4)+1}-01`:`${ym.slice(0,4)}-${pad(+ym.slice(5,7)+1)}`;
const ymPrev=ym=>+ym.slice(5,7)===1?`${+ym.slice(0,4)-1}-12`:`${ym.slice(0,4)}-${pad(+ym.slice(5,7)-1)}`;
const pLo=ym=>iso(addDays(parseISO(dOf(ym,1)),-20));
function pStart(ym){const f=F(),d1=dOf(ym,1),dL=dOf(ym,daysIn(ym));
  if(f.wait[ym]){const tm=iso(addDays(TODAY(),1));return tm<d1?d1:tm>dL?dL:tm}
  const s=f.start[ym];if(!s)return d1;const lo=pLo(ym);return s<lo?lo:s>dL?dL:s}
const pEnd=ym=>iso(addDays(parseISO(pStart(ymNext(ym))),-1));
function ymAt(ds){const c=ymOf(ds),n=ymNext(c);return pStart(n)<=ds?n:pStart(c)<=ds?c:ymPrev(c)}
const calDays=(a,b)=>a>b?0:diffDays(parseISO(a),parseISO(b))+1;
const nDays=(a,b)=>{let n=0;if(a>b)return 0;for(let d=parseISO(a),e=parseISO(b);d<=e;d=addDays(d,1))if(!inTrip(iso(d)))n++;return n};
const dm=ds=>`${+ds.slice(8,10)}.${+ds.slice(5,7)}.`;
/* Monatsbasis: ab welchem Tag gerechnet wird (d0) bis wann (dE) und wie viel frei ist (inkl. Extra-Geld, minus Reiseanteile) */
function monthBase(ym){const f=F(),adj=f.monthAdj[ym],pS=pStart(ym),dE=pEnd(ym);let d0=pS,free;
  if(adj){d0=adj.date||dOf(ym,adj.day);if(d0<pS)d0=pS;free=+adj.amount}
  else{free=(f.incomeOv[ym]!=null?+f.incomeOv[ym]:(+f.income||0))-fixSum()-etfSum()-(f.skipSave[ym]?0:(+f.saveMonthly||0));
    if(f.since===ym&&(f.sinceDay||1)>1){const s0=dOf(ym,f.sinceDay);if(s0>pS&&s0<=dE){d0=s0;free=free*calDays(d0,dE)/calDays(pS,dE)}}}
  const extra=f.extra.filter(x=>x.to!=='save'&&x.date>=d0&&x.date<=dE).reduce((a,x)=>a+x.amount,0);
  let reserved=0;f.trips.forEach(t=>{const n=calDays(t.from>d0?t.from:d0,t.to<dE?t.to:dE);if(n)reserved+=Math.max(0,(+t.budget||0)-(+t.potAmt||0))*n/tripLen(t)});
  const carry=(f.carry&&f.carry[ym])||0;
  return {day0:+d0.slice(8,10),d0,dE,pS,free:free+extra+carry,extra,reserved,carry}}
const normalDays=(ym,a,b)=>{let n=0;for(let d=a;d<=b;d++)if(!inTrip(dOf(ym,d)))n++;return n};
function finMonth(ds=iso(TODAY())){const f=F(),ym=ymAt(ds),nm=normMap(),B=monthBase(ym),d0=B.d0,dE=B.dE,day=+ds.slice(8,10),D=+dE.slice(8,10);
  const freeAll=B.free,free=freeAll-B.reserved,spent=(a,b)=>a>b?0:spentIn(a,b,nm),prev=x=>iso(addDays(parseISO(x),-1));
  const spentAll=spent(d0,dE),spentBefore=ds>d0?spent(d0,prev(ds)):0,spentToday=spent(ds,ds);
  const leftMonth=free-spentAll,nd=Math.max(1,nDays(ds>d0?ds:d0,dE)),perDay=(free-spentBefore)/nd;
  const weeks=[];for(let s=parseISO(B.pS),E=parseISO(dE);s<=E;){let e=addDays(s,6-(s.getDay()+6)%7);if(e>E)e=E;weeks.push({a:s.getDate(),b:e.getDate(),da:iso(s),db:iso(e)});s=addDays(e,1)}
  weeks.forEach(w=>{const a=w.da>d0?w.da:d0;w.spent=a<=w.db?spent(a,w.db):0;w.past=w.db<ds;w.cur=w.da<=ds&&ds<=w.db;w.nd=a<=w.db?nDays(a,w.db):0;w.trip=w.nd<calDays(a,w.db)});
  const warten=f.wait[ymNext(ym)]&&ymOf(ds)>ym?ymNext(ym):null;
  const cur=weeks.find(w=>w.cur),ca=cur&&cur.da>d0?cur.da:d0,sbc=cur&&ca>d0?spent(d0,prev(ca)):0,rate=cur?(free-sbc)/Math.max(1,nDays(ca,dE)):0;
  /* Ehrliche Wochen (Paket 2): Ist die laufende Woche überzogen, zeigen die kommenden nur noch, was wirklich da ist.
     Grundregel: Rest der laufenden Woche + kommende Wochen = was im Monat noch frei ist (nie unter 0).
     Beim Warten aufs Geld (Ende offen) gibt es kein Wochenbudget, nur was ausgegeben wurde. */
  const aft=cur&&cur.db<dE?nDays(iso(addDays(parseISO(cur.db),1)),dE):0,rateAfter=cur&&aft?Math.max(0,free-sbc-Math.max(rate*cur.nd,cur.spent))/aft:0;
  weeks.forEach(w=>{w.budget=warten||w.past||w.db<d0?null:w.cur?rate*w.nd:rateAfter*w.nd});
  const savedPlan=f.skipSave[ym]||f.monthAdj[ym]?0:(+f.saveMonthly||0);
  const tripNow=inTrip(ds);
  return {ym,D,day,day0:B.day0,d0,dE,pS:B.pS,warten,free,freeAll,extra:B.extra,reserved:B.reserved,spentAll,spentToday,leftMonth,perDay,todayLeft:perDay-spentToday,weeks,cur,
    carry:B.carry,weekLeft:cur&&cur.budget!=null?cur.budget-cur.spent:0,deficit:Math.max(0,-leftMonth),savedPlan,tripNow,adj:f.monthAdj[ym]||null,
    fixOpen:f.fixed.filter(x=>!(f.paid[ym]||{})[x.id]&&isDueMonth(x,ym)),setup:!!(+f.income||f.monthAdj[ym])}}
/* Kontostand: alles, was gerade noch auf dem Konto liegt = Töpfe + Rest des Monatsbudgets + noch nicht abgebuchte Fixkosten/ETF
   + noch nicht verteiltes Sparen + Reisebudgets, die noch nicht ausgegeben sind. Fürs Wochenbudget sind Fixkosten usw. schon raus. */
function kontoStand(){const f=F(),m=finMonth(),ym=m.ym,paid=f.paid[ym]||{},adj=!!m.adj;
  const pots=f.pots.reduce((a,p)=>a+potBal(p.id),0);
  const fixOpen=adj?[]:m.fixOpen,fix=fixOpen.reduce((a,x)=>a+(+x.amount||0),0);
  const etfOpen=adj?[]:f.etf.filter(x=>!paid['etf:'+x.id]),etf=etfOpen.reduce((a,x)=>a+(+x.amount||0),0);
  const save=m.savedPlan&&!paid.save?m.savedPlan:0;
  const m0=m.pS,trip=f.trips.filter(t=>t.to>=m0).reduce((a,t)=>a+Math.max(0,(+t.budget||0)-tripSpent(t)),0);
  const left=m.leftMonth,total=pots+left+fix+etf+save+trip;
  return {total,pots,left,fix,fixOpen,etf,etfOpen,save,trip}}
const isDueMonth=(x,ym)=>!x.every||x.every===1||((+ym.slice(5,7)-(+x.month||1))%x.every+x.every)%x.every===0;
/* Wo stehe ich (Paket 2, 11.11.2026): EINE Aussage für Seite, Widget, Briefing, Seitenleiste und die Meldung nach dem Eintragen.
   Vergleicht mit „gleichmäßig verteilt“ (abw > 0 = schneller ausgegeben). Bewusst ohne Vorwurf: Ist nur die WOCHE aufgebraucht,
   nennt die Kurzfassung den Monat („noch 94 € bis 30.11.“) statt „171 € drüber“ – beim gesammelten Nachtragen stimmt die Woche oft nicht. */
function finStatus(m){m=m||finMonth();if(!m.setup)return null;const f=F(),ds=iso(TODAY()),MN=MON[+m.ym.slice(5,7)-1],bis=m.warten?'das Geld kommt':dm(m.dE);
  const tage=Math.max(1,nDays(ds>m.d0?ds:m.d0,m.dE)),left=m.leftMonth,proTag=Math.max(0,left)/tage;
  const per=m.free/Math.max(1,nDays(m.d0,m.dE)),abw=m.spentAll-per*nDays(m.d0,ds<m.dE?ds:m.dE),tol=Math.max(10,m.free*0.05);
  const ton=m.tripNow?'reise':left<0?'aus':m.warten?'warten':abw>tol?'schnell':abw<-tol?'ruhig':'plan',wocheAus=!m.tripNow&&!m.warten&&!!m.cur&&m.weekLeft<0;
  const lastD=f.expenses.reduce((a,e)=>e.date<=ds&&e.date>a?e.date:a,''),letzter=lastD&&diffDays(parseISO(lastD),TODAY())>2?lastD:null;
  const tl=m.tripNow?(+m.tripNow.budget||0)-tripSpent(m.tripNow):0,wt=m.warten?`Das Geld für ${MON[+m.warten.slice(5,7)-1]} ist noch nicht da, der ${MN} läuft so lange weiter. `:'';
  const satz=ton==='reise'?`${m.tripNow.name}: ${tripLeftTxt(m.tripNow)} beim Reisebudget.`
    :ton==='aus'?`${wt}Das Budget für ${MN} ist aufgebraucht, ${eur0(-left)} mehr als frei war. ${m.warten?'Beim Abschluss':'Am Monatsende'} gleicht sich das zuerst aus dem Gesparten aus.`
    :ton==='warten'?`${wt}Noch ${eur0(left)} übrig.`
    :ton==='schnell'?`Bisher ${eur0(abw)} mehr ausgegeben als gleichmäßig verteilt. Mit etwa ${eur0(proTag)} pro Tag reicht es bis zum ${bis}`
    :ton==='ruhig'?`Bisher ${eur0(-abw)} weniger ausgegeben als gleichmäßig verteilt. Was übrig bleibt, landet am Monatsende in den Töpfen.`
    :`Du liegst im Plan: etwa ${eur0(proTag)} pro Tag bis zum ${bis}`;
  const kurz=ton==='reise'?`${m.tripNow.name}: ${tripLeftTxt(m.tripNow)}`:ton==='aus'?`Budget für ${MN} aufgebraucht`:wocheAus||m.warten?`noch ${eur0(left)} bis ${bis}`:`noch ${eur0(m.weekLeft)} diese Woche`;
  const zahl=ton==='reise'?eur0(tl):ton==='aus'?`−${eur0(-left)}`:wocheAus||m.warten?eur0(left):eur0(m.weekLeft);
  /* woche = die Wochenzahl ist gerade die richtige Aussage (sonst gilt kurz) */
  return {ton,left,tage,proTag,abw,wocheAus,woche:!(wocheAus||ton==='aus'||ton==='warten'||ton==='reise'),satz,kurz,zahl,bis,letzter}}
/* Häufige Käufe der letzten 90 Tage (mind. 2×, höchstens 6) als Knöpfe unter dem Finanzfeld. Immer derselbe Betrag → der Betrag kommt mit. */
function finFreq(){const f=F(),from=iso(addDays(TODAY(),-90)),g={};
  f.expenses.filter(e=>e.date>=from&&!e.pot).forEach(e=>{const t=String(e.text||'').trim(),k=t.toLowerCase();if(!k)return;const x=g[k]||(g[k]={t,n:0,last:'',amts:new Set()});x.n++;x.amts.add(e.amount);if(e.date>=x.last){x.last=e.date;x.t=t}});
  return Object.values(g).filter(x=>x.n>=2).sort((a,b)=>b.n-a.n||b.last.localeCompare(a.last)).slice(0,6).map(x=>({t:x.t[0].toUpperCase()+x.t.slice(1),n:x.n,amt:x.amts.size===1?[...x.amts][0]:null}))}
function finFreqRow(){const fr=finFreq();return fr.length?`<div class="fin-freq" role="group" aria-label="Häufige Käufe"><span class="fin-freq-l">Häufig</span>${fr.map(x=>`<button type="button" class="chip" data-act="fin-freq" data-t="${esc(x.t)}"${x.amt!=null?` data-a="${x.amt}"`:''} title="${x.n}× in den letzten Wochen">${esc(x.t)}${x.amt!=null?` <span class="mono">${eur(x.amt)}</span>`:''}</button>`).join('')}</div>`:''}
/* Monatsabschluss: Rest auf die Töpfe. Minus geht zuerst vom Gesparten dieses Monats ab, der Rest vom allgemeinen Topf.
   Abgeschlossen wird, sobald der Zeitraum vorbei ist (= der nächste hat begonnen), nicht mehr stur am Kalender-Ersten. */
function finClose(){const f=F(),ts=iso(TODAY());if(!f.since)return;let ym=f.since,guard=0;
  while(pStart(ymNext(ym))<=ts&&guard++<24){if(!f.closed[ym]){const m=+ym.slice(5,7),B=monthBase(ym),spent=f.expenses.filter(e=>bPart(e)>0&&e.date>=B.d0&&e.date<=B.dE).reduce((a,e)=>a+bPart(e),0),rest=Math.round((B.free-spent)*100)/100;
      if(rest>0)potSplit(rest,`Rest ${MON[m-1]}`,ym,'rest');
      else if(rest<0){let need=-rest;const saved=f.potLog.filter(l=>l.ym===ym&&l.tag==='save').reduce((a,l)=>a+l.amount,0),fromSave=Math.min(need,Math.max(0,saved));
        if(fromSave>0){potSplit(-fromSave,`Minus ${MON[m-1]} (vom Sparen)`,ym,'deficit');need-=fromSave}
        if(need>0.004){const g=genPot(),take=g?Math.min(need,potFree(g.id)):0;if(take>0.004){f.potLog.push({date:iso(TODAY()),pot:g.id,amount:-Math.round(take*100)/100,why:`Minus ${MON[m-1]} (aus dem Topf)`,ym,tag:'deficit'});need-=take}
          if(need>0.004){const nx=ymNext(ym);f.carry=f.carry||{};f.carry[nx]=Math.round(((f.carry[nx]||0)-need)*100)/100}}}
      f.closed[ym]={rest}}
    ym=ymNext(ym)}}
/* Selbstläufer (Paket 4, 11.11.2026): Monatsabschluss, Stichtage, Sparen. Läuft NUR im Hauptfenster (beim Start, alle 30 s in appTick, beim
   Zeichnen der Finanzen-Seite), nie im Widget oder Schnellfenster: zwei Fenster gleichzeitig würden doppelt buchen. true = es hat sich etwas geändert.
   Stichtag: Fixkosten/ETF mit „am Tag“ gelten ab dem Tag als abgebucht (Haken wird echt gesetzt, `autoPaid` merkt nur „von selbst“ für die Anzeige).
   Ein Haken von Hand gilt immer, auch ein weggenommener (`false` wird nie wieder von selbst gesetzt).
   Sparen: am Monatsanfang nach Prozent auf die Töpfe; nicht im Einrichtungsmonat, nicht bei „ausgesetzt“/„neu angesetzt“, abschaltbar (`autoSave:false`). */
function finTick(){const f=F(),snap=()=>JSON.stringify([f.closed,f.paid,f.potLog.length,f.carry||0]),before=snap(),geheilt=finHeilen();finClose();
  if(+f.income){const ts=iso(TODAY()),ym=ymAt(ts),p=f.paid[ym]||{},ap={},due=x=>+x.day&&dOf(ym,Math.min(+x.day,daysIn(ym)))<=ts;
    f.fixed.forEach(x=>{if(p[x.id]==null&&isDueMonth(x,ym)&&due(x)){p[x.id]=true;ap[x.id]=true}});
    f.etf.forEach(x=>{const k='etf:'+x.id;if(p[k]==null&&due(x)){p[k]=true;ap[k]=true}});
    if(f.autoSave!==false&&p.save==null&&+f.saveMonthly&&!f.skipSave[ym]&&!f.monthAdj[ym]&&f.since<ym&&pStart(ym)<=ts){f.paid[ym]=p;potSplit(+f.saveMonthly,`Sparen ${MON[+ym.slice(5,7)-1]}`,ym,'save');p.save=true;ap.save=true}
    if(Object.keys(ap).length){f.paid[ym]=p;f.autoPaid=f.autoPaid||{};f.autoPaid[ym]={...(f.autoPaid[ym]||{}),...ap}}}
  return geheilt||before!==snap()}
/* Nach dem Abgleich zweier Geräte (13.11.2026): Haben beide denselben Monat abgeschlossen, aber eines kannte eine Ausgabe des anderen
   noch nicht, kann das eine „Rest in die Töpfe“ und das andere „Minus aus den Töpfen“ gebucht haben. Zusammengeführt stünde dann beides da.
   Das gibt es mit einem Gerät nie (finClose bucht entweder Rest ODER Minus), also ist es das sichere Erkennungszeichen: Abschluss zurücknehmen,
   Übertrag in den Folgemonat löschen (er stammt nur aus diesem Abschluss) und finClose mit allen Ausgaben neu rechnen lassen.
   Ein normaler Abschluss wird hier NIE angefasst, auch nicht, wenn sich später Einnahmen oder Töpfe ändern.
   Gilt nur für Monate ab `f.syncSeit` (der Monat, in dem der Abgleich eingerichtet wurde; setzt der Abgleich beim ersten Mal).
   Ohne `syncSeit` und für alles davor passiert hier nichts: alte Buchungen aus der Zeit mit einem Gerät bleiben, wie sie sind. */
function finHeilen(){const f=F();let ch=false;if(!f.syncSeit)return false;
  Object.keys(f.closed||{}).forEach(ym=>{if(ym<f.syncSeit)return;const lg=f.potLog.filter(l=>l.ym===ym);
    if(lg.some(l=>l.tag==='rest')&&lg.some(l=>l.tag==='deficit')){finReopen(ym);const nx=ymNext(ym);if(f.carry&&f.carry[nx]!=null)delete f.carry[nx];ch=true}});
  return ch}
/* Was beim letzten Abschluss passiert ist, in einem Satz (für die Karte „<Monat> abgeschlossen“). */
function finClosedInfo(ym){const f=F(),c=f.closed[ym];if(!c)return null;const MN=MON[+ym.slice(5,7)-1],nx=MON[+ymNext(ym).slice(5,7)-1],lg=f.potLog.filter(l=>l.ym===ym),nm=id=>(f.pots.find(p=>p.id===id)||{}).name||'Topf';
  const B=monthBase(ym),spent=f.expenses.filter(e=>bPart(e)>0&&e.date>=B.d0&&e.date<=B.dE).reduce((a,e)=>a+bPart(e),0);
  let t;if(c.rest>0.004){const parts=lg.filter(l=>l.tag==='rest'&&l.amount>0).map(l=>`${nm(l.pot)} ${eur(l.amount)}`);t=`${eur(c.rest)} übrig, verteilt auf deine Töpfe${parts.length?`: ${parts.join(', ')}`:''}.`}
  else if(c.rest<-0.004){const fs=-lg.filter(l=>l.tag==='deficit'&&/vom Sparen/.test(l.why||'')).reduce((a,l)=>a+l.amount,0),tp=lg.filter(l=>l.tag==='deficit'&&!/vom Sparen/.test(l.why||'')),ft=-tp.reduce((a,l)=>a+l.amount,0),car=Math.max(0,Math.round((-c.rest-fs-ft)*100)/100);
    t=`${eur(-c.rest)} mehr ausgegeben, als frei war. Davon gehen ${[fs>0.004?`${eur(fs)} vom Gesparten des Monats ab`:'',ft>0.004?`${eur(ft)} aus dem Topf ${nm(tp[0].pot)}`:'',car>0.004?`${eur(car)} sind vom ${nx} abgezogen`:''].filter(Boolean).join(', ')}.`.replace('Davon gehen '+eur(car)+' sind','Die '+eur(car)+' sind')}
  else t='Genau aufgegangen, nichts übrig und nichts im Minus.';
  return {ym,MN,text:t,spent}}
/* Nimmt einen Abschluss zurück (wenn sich die Grenze des Zeitraums nachträglich ändert): verteilter Rest, vom Topf genommenes Minus und der
   Übertrag in den Folgemonat. Der Übertrag wird aus dem Abschluss abgeleitet (Minus − was aus den Töpfen kam), es braucht kein Extra-Feld. */
function finReopen(ym){const f=F(),c=f.closed[ym];if(!c)return;const nx=ymNext(ym);
  const taken=-f.potLog.filter(l=>l.ym===ym&&l.tag==='deficit').reduce((a,l)=>a+l.amount,0),car=c.rest<0?Math.max(0,Math.round((-c.rest-taken)*100)/100):0;
  f.potLog=f.potLog.filter(l=>!(l.ym===ym&&(l.tag==='rest'||l.tag==='deficit')));
  if(car>0&&f.carry&&f.carry[nx]!=null){f.carry[nx]=Math.round((f.carry[nx]+car)*100)/100;if(Math.abs(f.carry[nx])<0.005)delete f.carry[nx]}
  delete f.closed[ym]}
/* „Geld für ym ist am Tag date gekommen“ (früher, später oder pünktlich = zurück auf den 1.), optional mit anderem Betrag nur für diesen Monat. */
function finMoneyOk(ym,date){return date>=pLo(ym)&&date<=dOf(ym,daysIn(ym))&&date>(F().start[ymPrev(ym)]||pLo(ymPrev(ym)))}
function finMoney(ym,date,amount){const f=F(),d1=dOf(ym,1);finReopen(ymPrev(ym));delete f.wait[ym];
  if(date&&date!==d1)f.start[ym]=date;else delete f.start[ym];
  if(amount!=null&&!isNaN(amount)&&amount>=0){if(Math.abs(amount-(+f.income||0))<0.005)delete f.incomeOv[ym];else f.incomeOv[ym]=Math.round(amount*100)/100}
  finClose();return pStart(ym)}
/* „Geld für ym ist noch nicht da“: der Vormonat läuft weiter, bis „Geld ist da“ kommt. */
function finWait(ym){const f=F();finReopen(ymPrev(ym));delete f.start[ym];f.wait[ym]=true}
/* Für welchen Monat „Geld ist da“ ohne weitere Angabe gemeint ist: der wartende bzw. noch nicht gestartete, sonst ab dem 15. der nächste. */
function finMoneyTarget(){const ts=iso(TODAY()),c=ymOf(ts);return F().wait[c]||pStart(c)>ts?c:+ts.slice(8,10)>=15?ymNext(c):c}
function finMoneyCmd(x){const s=' '+String(x||'').trim()+' ';let m;
  if(/^\s*geld\s+(?:ist\s+)?(?:noch\s+nicht|nicht)\s+(?:da|gekommen|angekommen)\s*$/i.test(s))return {type:'money',wait:true,ym:ymOf(iso(TODAY()))};
  if(!(m=s.match(/^\s*geld\s+(?:ist\s+)?(?:schon\s+)?(?:da|gekommen|angekommen)(?=\s)/i)))return null;
  let r=' '+s.slice(m[0].length).trim()+' ',date=iso(TODAY()),amount=null;const pd=takePastDate(r,true)||(()=>{const z=finDateOnly(r.trim());return z?{s:' ',date:z}:null})();if(pd){r=pd.s;date=pd.date}
  const am=r.match(new RegExp('\\s'+FIN_NUM+'\\s*(?:€|eur|euro)?(?=\\s)','i'));if(am){amount=finNum(am[1]);r=r.replace(am[0],' ')}
  if(r.trim())return null;return {type:'money',ym:finMoneyTarget(),date,amount}}
/* Schnelleingabe: Ausgaben „12,50 Mittagessen“, Einnahmen „+50 Oma“ / „50€ von Oma bekommen“ (+ „sparen“ = direkt auf die Töpfe) */
function parseMove(r0){const m=r0.match(/^\s*(?:€\s*)?(\d{1,5}(?:[.,]\d{1,2})?)\s*(?:€|eur|euro)?\s+(?:von|aus)\s+(?:dem\s+|topf\s+)?(.+?)\s+(?:nach|in|zu|auf)\s+(?:den\s+|topf\s+)?(.+?)\s*(?:umbuchen|verschieben)?\s*$/i);if(!m)return null;
  const a=findPot(m[2]),b=findPot(m[3]);if(!a||!b||a===b)return null;return {type:'move',title:`${a.name} → ${b.name}`,amount:parseFloat(m[1].replace(',','.')),from:a.id,to:b.id}}
/* Datum beim Nachtragen (11.11.2026): immer rückwärts gemeint. „8.11. 12,41 Billa“, „am 8.11.“, „gestern“, Wochentag am Anfang („Mo 3,05 Spar“ =
   der letzte Montag, heute zählt mit; „letzten Di“ = nie heute). Ein Datum ohne Jahr, das noch kommt, meint das letzte Jahr. */
const FIN_WD='(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|mo|di|mi|do|fr|sa|so)';
function pastDay(d,m,y){const t=TODAY();d=+d;m=+m;if(!(d>=1&&d<=31&&m>=1&&m<=12))return null;const Y=y?(+y<100?2000+ +y:+y):t.getFullYear();let x=new Date(Y,m-1,d);if(x.getMonth()!==m-1)return null;
  if(!y&&x>t)x=new Date(Y-1,m-1,d);return iso(x)}
function takePastDate(s,money){let m;
  if((m=s.match(/\s(heute|gestern|vorgestern)(?=\s)/i))){const w=m[1].toLowerCase();return {s:s.replace(m[0],' '),date:iso(addDays(TODAY(),w==='heute'?0:w==='gestern'?-1:-2))}}
  if((m=s.match(/\s(?:am\s+)?(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})?(?=\s)/i))){const d=pastDay(m[1],m[2],m[3]);if(d)return {s:s.replace(m[0],' '),date:d}}
  if((m=s.match(new RegExp('^\\s(?:am\\s+)?(letzten?\\s+)?'+FIN_WD+'\\.?(?=\\s)','i')))){const t=TODAY();let back=(t.getDay()-WDMAP[m[2].toLowerCase()]+7)%7;if(m[1]&&!back)back=7;return {s:s.replace(m[0],' '),date:iso(addDays(t,-back))}}
  /* nur im Finanzfeld: Datum ohne Schlusspunkt am Anfang („8.11 12,41 Billa“), wenn danach noch eine Zahl kommt (sonst ist „4.50 Kaffee“ der Betrag) */
  if(money&&(m=s.match(/^\s(?:am\s+)?(\d{1,2})\.(\d{1,2})(?=\s)/))&&/\d/.test(s.slice(m[0].length))){const d=pastDay(m[1],m[2]);if(d)return {s:s.replace(m[0],' '),date:d}}
  return null}
/* Eine Zeile, die NUR ein Tag ist („8.11.“, „gestern“, „Mo“): stellt im Finanzfeld den Tag für die nächsten Einträge ein. */
function finDateOnly(x){x=String(x||'').trim();if(!x)return null;let m;if((m=x.match(/^(\d{1,2})\.(\d{1,2})\.?$/)))return pastDay(m[1],m[2]);const r=takePastDate(' '+x+' ');return r&&!r.s.trim()?r.date:null}
/* Betrag als Zahl: Punkt + genau drei Ziffern = Tausenderpunkt („1.250“), sonst ist der Punkt ein Komma („4.50“). */
const finNum=x=>parseFloat(String(x).replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.'));
const FIN_NUM='(\\d{1,3}(?:\\.\\d{3})+(?:,\\d{1,2})?|\\d{1,5}(?:[.,]\\d{1,2})?)';
/* o.money (Finanzfeld): jede Zahl ist ein Betrag, auch ohne Komma/€ („14 Ballticket“, „Kaffee 4.50“). o.day: Tag, wenn in der Zeile keiner steht. */
function parseExpense(r0,o){o=o||{};let s=' '+r0+' ',amt=null;
  let date=o.day||iso(TODAY());const pd=takePastDate(s,o.money);if(pd){s=pd.s;date=pd.date}
  const plus=/^\s*\+/.test(s);if(plus)s=s.replace('+',' ');
  const take=re=>{const m=s.match(re);if(m){amt=finNum(m[1]);s=s.replace(m[0],' ');return true}return false};
  take(new RegExp('\\s(?:€|eur)\\s*'+FIN_NUM+'(?=\\s)','i'))||take(new RegExp('\\s'+FIN_NUM+'\\s*(?:€|eur|euro)(?=\\s|$)','i'))||take(/\s(\d{1,5},\d{2})(?=\s)/)||(plus&&take(/\s(\d{1,5})(?=\s)/))||(o.money&&take(new RegExp('\\s'+FIN_NUM+'(?=\\s)')));
  if(amt==null||!(amt>0))return null;
  const incW=/\b(bekommen|erhalten|einnahme|geschenkt\s+bekommen|gekriegt|kriege|krieg)\b/i;
  if(plus||incW.test(s)){const toSave=/\b(sparen|aufs?\s+sparen|in\s+die\s+töpfe|auf\s+die\s+töpfe)\b/i.test(s);
    const text=s.replace(incW,' ').replace(/\b(sparen|aufs?\s+sparen|in\s+die\s+töpfe|auf\s+die\s+töpfe|von|vom|geld)\b/gi,' ').replace(/\s+/g,' ').trim()||'Extra';
    return {type:'income',title:text[0].toUpperCase()+text.slice(1),amount:amt,date,to:toSave?'save':'budget'}}
  let pot=null;if(/\baus\s+(dem\s+)?(spar)?topf\b/i.test(s)){pot=true;s=s.replace(/\baus\s+(dem\s+)?(spar)?topf\b/i,' ')}
  const text=s.replace(/\s+/g,' ').trim().replace(/^(für|fuer)\s+/i,'')||'Ausgabe';
  const cat=guessCat(text);if(pot===true){const p=F().pots.find(p=>p.cat===cat)||null;pot=p?p.id:(genPot()||{}).id||null}
  return {type:'expense',title:text,amount:amt,cat,date,pot}}
function guessCat(text){const f=F(),w=text.toLowerCase().split(/\s+/);for(const x of w)if(f.catMap[x])return f.catMap[x];
  const c=FCATS.find(c=>c[3]&&c[3].test(text));return c?c[0]:'sonstiges'}
function addExpense(p,ops){const f=F(),e={id:uid(),date:p.date,amount:Math.round(p.amount*100)/100,text:p.title,cat:p.cat,pot:p.pot||null};f.expenses.push(e);
  if(e.pot){e.potAmt=Math.min(e.amount,potFree(e.pot));if(e.potAmt>0)f.potLog.push({date:e.date,pot:e.pot,amount:-e.potAmt,why:e.text,exp:e.id})}ops&&ops.push({c:'fin-exp',id:e.id});
  const m=finMonth(),pb=e.pot?potBal(e.pot):0,t=!e.pot&&inTrip(e.date);
  return `${eur(e.amount)} ${e.text}${e.date!==iso(TODAY())?` · ${fmtShort(parseISO(e.date))}`:''}${e.pot?(e.potAmt<=0?` · Topf ${(f.pots.find(x=>x.id===e.pot)||{}).name} ist leer, zählt aufs Wochenbudget`:e.potAmt<e.amount?` · ${eur(e.potAmt)} aus Topf ${(f.pots.find(x=>x.id===e.pot)||{}).name} (mehr war nicht drin), ${eur(e.amount-e.potAmt)} vom Wochenbudget`:` · aus Topf ${(f.pots.find(x=>x.id===e.pot)||{}).name}, noch ${eur(pb)} drin`):t?` · ${t.name}: noch ${eur0((+t.budget||0)-tripSpent(t))}`:m.setup?(st=>st.woche?` · diese Woche noch ${eur0(m.weekLeft)}`:` · ${st.kurz}`)(finStatus(m)):''}`}
function delExpense(id){const f=F();f.expenses=f.expenses.filter(e=>e.id!==id);f.potLog=f.potLog.filter(l=>l.exp!==id)}
function addIncome(p,ops){const f=F(),x={id:uid(),date:p.date,amount:Math.round(p.amount*100)/100,text:p.title,to:p.to};f.extra.push(x);
  if(x.to==='save')potSplit(x.amount,`Extra: ${x.text}`,ymOf(x.date),'extra',{inc:x.id});ops&&ops.push({c:'fin-inc',id:x.id});
  return `+${eur(x.amount)} ${x.text}${x.date!==iso(TODAY())?` · ${fmtShort(parseISO(x.date))}`:''} · ${x.to==='save'?'auf die Spartöpfe':'ins Budget, verteilt sich auf den Rest des Monats'}`}
function findPot(w){const f=F();w=String(w||'').toLowerCase().trim();if(!w)return null;return f.pots.find(p=>p.name.toLowerCase()===w)||f.pots.find(p=>p.name.toLowerCase().split(/\s+/).some(x=>x.startsWith(w)||w.startsWith(x)&&x.length>=4))||null}
function movePot(from,to,amt,ops){const f=F(),a=f.pots.find(p=>p.id===from),b=f.pots.find(p=>p.id===to),tag=uid();amt=Math.min(amt,potFree(from));if(!(amt>0))return `${a.name} ist leer, nichts umgebucht`;f.potLog.push({date:iso(TODAY()),pot:from,amount:-amt,why:`→ ${b.name}`,mv:tag},{date:iso(TODAY()),pot:to,amount:amt,why:`← ${a.name}`,mv:tag});
  ops&&ops.push({c:'fin-mv',id:tag});return `${eur(amt)} von ${a.name} nach ${b.name} · ${a.name} jetzt ${eur(potBal(from))}`}
function delIncome(id){const f=F();f.extra=f.extra.filter(x=>x.id!==id);f.potLog=f.potLog.filter(l=>l.inc!==id)}
/* ---------- Finanzfeld (11.11.2026): Tag einstellen, mehrere auf einmal, Vorschau ----------
   Der eingestellte Tag ist reiner Oberflächen-Zustand (nicht in den Daten) und verfällt nach 10 Minuten ohne Eintrag,
   damit morgen kein Kaffee am falschen Tag landet. */
let FIN_DAY=null,FIN_DAY_AT=0,FIN_CATOPEN=null,FIN_ALL=false;
function finDay(){const t=iso(TODAY());if(FIN_DAY&&(Date.now()-FIN_DAY_AT>10*60e3||FIN_DAY>=t))FIN_DAY=null;return FIN_DAY||t}
function finSetDay(d){FIN_DAY=d&&d<iso(TODAY())?d:null;FIN_DAY_AT=Date.now()}
function finDayRow(){const t=TODAY(),ts=iso(t),cur=finDay(),ch=[];
  for(let i=0;i<7;i++){const d=addDays(t,-i),ds=iso(d);ch.push([ds,i===0?'heute':i===1?'gestern':`${WD[d.getDay()]} ${d.getDate()}.`])}
  if(!ch.some(c=>c[0]===cur))ch.push([cur,fmtShort(parseISO(cur))]);
  return `<div id="fin-day" class="fin-day" role="group" aria-label="Tag für den Eintrag">${ch.map(([ds,l])=>`<button type="button" class="chip ${ds===cur?'on':''}" data-act="fin-day" data-d="${ds}" aria-pressed="${ds===cur}">${l}</button>`).join('')}
    <label class="fin-day-o" title="Anderer Tag"><span class="sr">Anderer Tag</span><input type="date" data-finday max="${ts}" value="${cur}"></label>
    ${cur!==ts?`<span class="fin-day-h">Nachtragen für <b>${fmtShort(parseISO(cur))}</b> · bleibt für die nächsten Einträge</span>`:''}</div>`}
/* Was aus der Eingabe wird, Zeile für Zeile. Liefert {todo:[…], day, bad} – dieselbe Rechnung für Vorschau und Eintragen. */
function finRead(raw){const parts=qSplit(raw),todo=[];let day=finDay(),setDay=null,bad=null;
  for(const x of parts){const g=finMoneyCmd(x);if(g){todo.push(g);continue}
    const d=finDateOnly(x);if(d){day=d;setDay=d;todo.push({type:'day',date:d});continue}
    const p=parseMove(x)||parseExpense(x,{money:true,day});if(!p){bad=bad||x;todo.push({type:'bad',raw:x});continue}todo.push(p)}
  return {todo,setDay,bad}}
function finPreview(raw){const r=finRead(raw),ts=iso(TODAY()),day=d=>d===ts?'heute':fmtShort(parseISO(d));
  if(!r.todo.length)return '';
  return r.todo.map(p=>p.type==='day'?`<li class="fp-day">ab hier: <b>${fmtShort(parseISO(p.date))}</b></li>`
    :p.type==='bad'?`<li class="fp-bad">„${esc(p.raw)}“: Betrag fehlt</li>`
    :p.type==='money'?`<li>${p.wait?`${MON[+p.ym.slice(5,7)-1]} wartet aufs Geld, der Vormonat läuft weiter`:`${MON[+p.ym.slice(5,7)-1]} läuft ab <b>${day(p.date)}</b>${p.amount!=null?` · mit ${eur(p.amount)}`:''}${finMoneyOk(p.ym,p.date)?'':' · dieser Tag passt nicht (höchstens 20 Tage vor dem 1.)'}`}</li>`
    :p.type==='move'?`<li><b>${eur(p.amount)}</b> umbuchen · ${esc(p.title)}</li>`
    :p.type==='income'?`<li><b>+${eur(p.amount)}</b> ${esc(p.title)} · Extra-Geld ${p.to==='save'?'auf die Töpfe':'ins Budget'} · ${day(p.date)}</li>`
    :`<li><i style="background:${fcat(p.cat)[2]}"></i><b>${eur(p.amount)}</b> ${esc(p.title)} · ${fcat(p.cat)[1]}${p.pot?` · aus Topf ${esc((F().pots.find(x=>x.id===p.pot)||{}).name||'')}`:''} · ${day(p.date)}</li>`).join('')}
/* Trägt alles ein oder nichts (fehlt irgendwo der Betrag, bleibt der Text zum Ausbessern stehen). Ein Rückgängig für alles zusammen. */
function finCommit(raw){const r=finRead(raw);if(!r.todo.length)return null;
  if(r.bad)return {bad:r.bad};
  if(r.setDay)finSetDay(r.setDay);
  const ops=[],labels=[];let geld=null;r.todo.forEach(p=>{if(p.type==='day')return;
    if(p.type==='money'){if(p.wait){finWait(p.ym);geld=`${MON[+p.ym.slice(5,7)-1]} wartet aufs Geld, der Vormonat läuft so lange weiter.`}else if(finMoneyOk(p.ym,p.date)){finMoney(p.ym,p.date,p.amount);geld=`${MON[+p.ym.slice(5,7)-1]} läuft ab ${fmtShort(parseISO(p.date))}.`}else geld='Der Tag passt nicht: höchstens 20 Tage vor dem 1.';return}
    labels.push(p.type==='income'?addIncome(p,ops):p.type==='move'?movePot(p.from,p.to,p.amount,ops):addExpense(p,ops))});
  if(!labels.length)return geld?{geld}:{day:r.setDay};
  FIN_DAY_AT=Date.now();const label=labels.length>1?`${labels.length} Einträge: ${labels.map(l=>l.split(/ · (?:diese Woche|noch \d|Budget für)/)[0]).join(' · ')}`:labels[0];
  S.lastQuick={at:Date.now(),label,ops};return {label,n:labels.length,geld}}
/* ---------- Paket 3: Dialog „Geld für den Monat“ und „Buchungen auf Tage verteilen“ ---------- */
function openFinMoney(ymSel){const f=F(),ts=iso(TODAY()),c=ymOf(ts),n=ymNext(c),ym=ymSel||c,d1=dOf(ym,1);
  const date=f.wait[ym]?ts:f.start[ym]||(ym===n?ts:d1),amt=f.incomeOv[ym]!=null?f.incomeOv[ym]:(+f.income||0);
  overlay(`<form class="modal" id="f-fin-money" style="width:min(520px,100%)"><h2>Geld für den Monat</h2>
   <p class="hint" style="margin-top:0">Normal kommt dein Geld am 1. Kommt es früher oder später, läuft der Monat ab diesem Tag und der vorige endet am Tag davor. Das Tagesbudget verteilt sich dann auf den echten Zeitraum.</p>
   <div class="frow" style="--n:3"><label class="fl">Geld für<select name="ym">${[c,n].map(y=>`<option value="${y}" ${y===ym?'selected':''}>${MON[+y.slice(5,7)-1]}</option>`).join('')}</select></label>
   <label class="fl">gekommen am<input name="date" type="date" value="${date}" required></label>
   <label class="fl">Betrag<input name="amount" type="number" min="0" step="0.01" value="${amt}"></label></div>
   <p class="hint" style="margin:0">Anderer Betrag gilt nur für diesen Monat. Für „wieder ganz normal“ den 1. eintragen.</p>
   <div class="modal-actions">${ym===c&&!f.wait[c]?`<button type="button" class="btn ghost" data-act="fin-wait" data-ym="${c}">Noch nicht da</button>`:''}<span class="sp"></span><button type="button" class="btn ghost" data-act="close-overlay">Abbrechen</button><button class="btn primary">Speichern</button></div></form>`)}
let FIN_SPLIT=null;
function openFinSplit(d){const f=F(),ts=iso(TODAY());if(!FIN_SPLIT||FIN_SPLIT.d!==d)FIN_SPLIT={d,sel:{}};
  const list=f.expenses.filter(e=>e.date===d);if(!list.length){FIN_SPLIT=null;closeOverlay();return}
  const days=[];for(let i=-10;i<=10;i++){const x=iso(addDays(parseISO(d),i));if(x!==d&&x<=ts)days.push(x)}
  const lbl=x=>x===ts?'heute':x===iso(addDays(TODAY(),-1))?'gestern':`${WD[parseISO(x).getDay()]} ${+x.slice(8,10)}.`;
  overlay(`<div class="modal" id="fin-split" style="width:min(520px,100%)"><h2>Buchungen vom ${fmtShort(parseISO(d))} auf den richtigen Tag legen</h2>
   <p class="hint" style="margin-top:0">Anhaken, was an einem anderen Tag war, dann den Tag anklicken. So oft du magst.</p>
   <div class="fs-top"><button type="button" class="link" data-act="fin-split-all">Alle</button><button type="button" class="link" data-act="fin-split-none">Keine</button></div>
   <ul class="fs-list">${list.map(e=>`<li><label class="fs-row"><input type="checkbox" data-fs="${e.id}" ${FIN_SPLIT.sel[e.id]?'checked':''}><i style="background:${fcat(e.cat)[2]}"></i><span>${esc(e.text)}</span><span class="mono">${eur(e.amount)}</span></label></li>`).join('')}</ul>
   <div class="fin-day fs-days" role="group" aria-label="Auf diesen Tag legen">${days.reverse().map(x=>`<button type="button" class="chip" data-act="fin-split-to" data-d="${x}">${lbl(x)}</button>`).join('')}
    <label class="fin-day-o" title="Anderer Tag"><span class="sr">Anderer Tag</span><input type="date" data-fsdate max="${ts}"></label></div>
   <div class="modal-actions"><span class="sp"></span><button type="button" class="btn primary" data-act="close-overlay">Fertig</button></div></div>`)}
function finSplitTo(nd){if(!FIN_SPLIT||!nd)return;const f=F(),ids=Object.keys(FIN_SPLIT.sel).filter(k=>FIN_SPLIT.sel[k]),ops=[];
  f.expenses.forEach(e=>{if(ids.includes(e.id)&&e.date===FIN_SPLIT.d){ops.push({c:'fin-date',id:e.id,d:e.date});e.date=nd;f.potLog.forEach(l=>{if(l.exp===e.id)l.date=nd})}});
  if(!ops.length){toast('Erst anhaken','Hak an, was an dem Tag war, dann den Tag anklicken.');return}
  FIN_SPLIT.sel={};S.lastQuick={at:Date.now(),label:`${ops.length} ${ops.length===1?'Buchung':'Buchungen'} auf ${fmtShort(parseISO(nd))}`,ops};save();refresh();
  toast('Verschoben',S.lastQuick.label,false,{act:'q-undo',txt:'Rückgängig'});openFinSplit(FIN_SPLIT.d)}
