/* ---------- Morgen-Briefing als Fließtext (regelbasiert, ohne KI) ---------- */
let WX=null;
const WXT=c=>c===0?'sonnig':c===1?'überwiegend sonnig':c===2?'teils bewölkt':c===3?'bewölkt':c<=48?'neblig':c<=57?'nieselig':c<=65?'regnerisch':c<=67?'mit Eisregen':c<=77?'verschneit':c<=82?'mit Regenschauern':c<=86?'mit Schneeschauern':'gewittrig';
const andList=a=>a.length<2?(a[0]||''):a.slice(0,-1).join(', ')+' und '+a[a.length-1];
const hm0=x=>String(x||'').replace(/^0(\d)/,'$1');
const numW=n=>['kein','ein','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn'][n]||String(n);
function rainSpan(p){const hs=(p.hours||[]).filter(h=>h.h>=7&&h.h<=22&&h.p>=50);if(!hs.length)return null;return [hs[0].h,hs[hs.length-1].h+1]}
function newImpMails(){const since=S.lastBriefAt||new Date(Date.now()-24*36e5).toISOString();return importantMails().filter(m=>m.recvAt?m.recvAt>since:!S.lastBriefAt)}
function briefParas(){const t=TODAY(),ds=iso(t),hr=new Date().getHours(),P=[],L=(txt,act,id)=>`<button class="link" data-act="${act}" ${id?`data-id="${esc(id)}"`:''}>${txt}</button>`;
  const mode=modeToday(),we=t.getDay()===0||t.getDay()===6;
  // 1) Begrüßung, Wetter, Weg
  let a=`${hr<11?'Guten Morgen':hr<18?'Hallo':'Guten Abend'}${anrede()}.`;
  if(WX&&WX.date===ds&&WX.w&&!WX.error){const w=WX.w,v=WX.v,r=rainSpan(mode==='bib'?v:w);
    a+=` Draußen wird's heute ${WXT(w.code)}, ${w.min} bis ${w.max} Grad`;
    a+=r?`, zwischen ${r[0]} und ${r[1]} Uhr ist Regen wahrscheinlich${mode==='bib'?', also nimm einen Schirm mit in die Bib':''}.`:w.rain>=30?', vereinzelt kann es nieseln.':', und es bleibt trocken.'}
  if(mode==='bib'){try{const b=bibTrips(),wk=S.settings.walk.w;if(b.out&&b.out.dep>nowMin()-5)a+=` Für die Bib passt die ${b.out.line} um ${hm0(fromM(b.out.dep))}, dafür gehst du um ${hm0(fromM(b.out.dep-wk))} los${b.back?`, heim geht's um ${hm0(fromM(b.back.dep))} ab ${ortB()}`:''}.`;else if(b.back)a+=` Heim geht's um ${hm0(fromM(b.back.dep))} ab ${ortB()}.`}catch(e){}}
  else if(!mode&&!we&&hr<15)a+=` Bib oder daheim? ${L('Bib','day-mode').replace('data-act="day-mode"','data-act="day-mode" data-m="bib"')} oder ${L('daheim','day-mode').replace('data-act="day-mode"','data-act="day-mode" data-m="home"')}, dann plan ich den Tag passend.`;
  P.push(a);
  // 2) Neue wichtige Mails
  const imp=importantMails(),neu=newImpMails(),alt=imp.length-neu.length;
  if(neu.length){const sh=neu.slice(0,3),it=sh.map(m=>`${L(esc(m.from),'open-mail',m.id)} wegen „${esc(m.subject)}“${m.sug&&m.sug.status==='open'?(m.sug.type==='event'?' (Termin erkannt)':' (Frist erkannt)'):''}`),ns=sh.filter(m=>m.sug&&m.sug.status==='open').length;
    P.push(`${neu.length===1?'Es ist eine wichtige Mail gekommen':`Es sind ${numW(neu.length)} wichtige Mails gekommen`}: ${andList(it)}${neu.length>3?`, dazu ${neu.length-3} weitere`:''}.${ns?` ${ns===1?'Das Erkannte kannst du':'Die erkannten Termine und Fristen kannst du'} direkt aus der Mail mit einem Klick übernehmen.`:''}${alt>0?` Außerdem ${alt===1?'liegt noch eine ältere wichtige Mail':`liegen noch ${numW(alt)} ältere wichtige Mails`} ungelesen im Posteingang.`:''}`)}
  else if(alt>0)P.push(`Neue wichtige Mails sind keine gekommen, ${alt===1?'eine ältere ist aber noch ungelesen':`${numW(alt)} ältere sind aber noch ungelesen`}. ${L('Posteingang','nav').replace('data-act="nav"','data-act="nav" data-view="mail"')}`);
  // 3) Der Tag: Termine, Lernen, Training
  const ev=myEventsOn(ds).filter(e=>!e.allDay&&toMin(e.end)>nowMin()).sort((x,y)=>x.start.localeCompare(y.start)),ad=allDayOn(ds,true).filter(x=>x.cal!=='hol'&&x.cal!=='bday'&&x.cal!=='fam'&&x.id);
  const tr=S.habits.find(h=>/training/i.test(h.name)),trOpen=tr&&habState(tr).open;
  const fx=[...ev.map(e=>({t:e.start,x:esc(e.title)})),...(trOpen&&sportAt()!=null&&sportAt()>nowMin()?[{t:fromM(sportAt()),x:'Training'}]:[])].sort((p1,p2)=>p1.t.localeCompare(p2.t));
  let d=fx.length?`Fest ${fx.length===1?'steht':'stehen'} heute ${andList(fx.map(f=>`${f.x} um ${hm0(f.t)}`))}.`:'Fest steht heute nichts, der Tag gehört also dir.';
  if(ad.length)d+=` Ganztägig: ${andList(ad.map(x=>esc(x.title)))}.`;
  const st=activeExams().map(x=>({x,p:studyPlan(x)})).filter(o=>o.p.today);
  if(st.length){const parts=st.map(o=>{const x=o.x,p=o.p,n=p.daysLeft,state=p.over?'das wird knapp, der Puffer ist aufgebraucht':p.R<p.R0?'ein bisschen Rückstand, aber der Plan fängt das auf':'du liegst im Plan';
      if(p.today.type==='review')return `Wiederholung für ${esc(x.subject)}${p.today.last?' (Gesamtwiederholung und Altfragen)':''}`;
      const rem=p.today.amt-p.doneToday;if(rem<=0)return `für ${esc(x.subject)} ist das Pensum schon geschafft`;
      return `${rem===1?(x.mode==='topics'?'ein':'eine'):rem} ${rem===1?UNIT[x.mode].one:UNIT[x.mode].many} ${esc(x.subject)} (Prüfung in ${n} ${n===1?'Tag':'Tagen'}, ${state})`});
    const rvm=st.reduce((t,o)=>{const rv=revToday(o.x,o.p);return t+(rv?rv.leftMin:0)},0);
    d+=` Zum Lernen stehen an: ${andList(parts)}.${rvm?` Davor ca. ${fmtDur(r5(rvm))} Wiederholen: kurz abrufen, was du die letzten Tage gelernt hast.`:''}`}
  P.push(d);
  // 4) To-dos, Haushalt, Menschen
  const td=nowTasks(),ov=S.tasks.filter(todoOver),dc=dueChores(),rp=S.replies;let r='';
  if(td.length){const top=td.slice().sort((x,y)=>(x.due||'9999').localeCompare(y.due||'9999'))[0];r+=td.length===1?`Als To-do ist „${esc(top.title)}“ dran${top.due?` (${fristTxt(top).replace('Frist ','Frist ')})`:''}.`:`Dazu kommen ${numW(td.length)} To-dos, am dringendsten „${esc(top.title)}“${top.due?` mit ${fristTxt(top)}`:''}.`}
  if(ov.length)r+=` ${ov.length===1?'Eins ist':`${numW(ov.length)[0].toUpperCase()+numW(ov.length).slice(1)} sind`} liegengeblieben, das kannst du in Ruhe ${L('neu sortieren','triage')}.`;
  const more=(arr,one,many)=>{const n=arr.length-2;return n>0?[...arr.slice(0,2),n===1?one:`${numW(n)} ${many}`]:arr};
  const hs=dc.length?`im Haushalt ${dc.length===1?'steht':'stehen'} ${andList(more(dc.map(c=>esc(c.name)),'noch eine Sache','weitere Sachen'))} an`:'',
    ps=rp.length?`${andList(more(rp.map(x=>esc(x.name)),'eine weitere Person','weitere Leute'))} ${rp.length===1?'wartet':'warten'} auf eine Antwort`:'';
  if(hs||ps){const z=[hs,ps].filter(Boolean).join(', und ');r+=` ${z[0].toUpperCase()+z.slice(1)}.`}
  try{if(S.fin&&+S.fin.income){const fm=finMonth(),dd=+ds.slice(8,10),due=fm.fixOpen.filter(x=>x.day&&x.day>=dd&&x.day<=dd+2);
    const st=finStatus(fm);r+=` Geld: ${st.ton==='reise'||st.ton==='warten'?esc(st.satz).replace(/\.$/,''):st.ton==='aus'?`Das Budget für ${MON[+fm.ym.slice(5,7)-1]} ist aufgebraucht`:st.wocheAus?`Das Wochenbudget ist aufgebraucht, bis Monatsende hast du noch ${eur0(st.left)}, also etwa ${eur0(st.proTag)} am Tag`:`diese Woche hast du noch ${eur0(fm.weekLeft)}, also etwa ${eur0(Math.max(0,fm.perDay))} am Tag`}.${due.length?` Bald fällig: ${andList(due.map(x=>`${esc(x.name)} (${eur(+x.amount)}${x.day===dd?', heute':''})`))}.`:''}`}}catch(e){}
  if(r)P.push(r.trim());
  // 5) Ausblick: Familie heute, Geburtstage und Wichtiges in den nächsten Tagen
  const fam=S.events.filter(e=>e.date===ds&&!e.allDay).map(evView).filter(v=>v.fam&&v.show&&!v.inPlan),ups=upcoming(7).filter(u=>u.in>0&&(u.kind==='bday'||u.kind==='imp')).slice(0,3);let o=[];
  if(fam.length)o.push(`Zur Info: ${andList(fam.slice(0,3).map(v=>`${esc(v.who)} hat um ${hm0(v.start)} ${esc(v.title.replace(/ · .*$/,''))}`))}.`);
  if(ups.length)o.push(`Demnächst: ${andList(ups.map(u=>`${esc(u.title)} ${inLabel(u.in)}`))}.`);
  if(o.length)P.push(o.join(' '));
  return P}
const briefPlain=()=>briefParas().join(' ').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
const briefVisible=()=>S.briefSeen!==iso(TODAY())&&new Date().getHours()<14;
function briefCard(){if(!briefVisible())return '';
  return `<section class="card brief"><div class="card-head"><h2>Dein Tag kurz erzählt</h2><button class="link" data-act="brief-seen">Gelesen</button></div><div class="brief-body">${briefParas().map(x=>`<p>${x}</p>`).join('')}</div></section>`}

