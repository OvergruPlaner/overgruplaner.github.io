/* ---------- Windows-App: Fenster, Benachrichtigungen, Einstellungen ---------- */
const WIDGET_FORWARD=['trip-choose','focus-start','sprint','reply-round','todo-sprint','read-timer','reward-timer','triage','edit-event','open-mail','edit-task','focus-open','focus-pause','focus-stop','snip-t','tl-toggle'];
const SHORTCUTS=[['Control+Alt+N','Strg + Alt + N'],['Control+Alt+P','Strg + Alt + P'],['Alt+Shift+N','Alt + Umschalt + N'],['Control+Shift+Space','Strg + Umschalt + Leertaste']];
const shortcutLabel=()=>{const k=(APPCFG.shortcut||'Control+Alt+N');const f=SHORTCUTS.find(x=>x[0]===k);return (f?f[1]:k).split(' + ').map(x=>`<kbd>${x}</kbd>`).join('+')};
function nativeNote(title,body){try{new Notification(title,{body:body||''})}catch(e){}}
function notify(kind,title,body){if(!APP){toast(title,body,true);return}
  if(WEB){if(MODE!=='main'||kind==='zug'||(kind&&(S.notif||{})[kind]===false))return;toast(title,body,true);return}
  if(MODE!=='main')return;
  const N=S.notif||{};if(kind&&N[kind]===false)return;const nm=nowMin(),q=N.quiet||{},urgent=kind==='zug';
  if(!urgent&&q.start&&q.end&&inWin(nm,toMin(q.start),toMin(q.end)))return;
  const ds=iso(TODAY());S.notifCount=S.notifCount||{};const c=S.notifCount[ds]||0;
  if(!urgent&&c>=(N.max||5)){S.notifQueue=[...(S.notifQueue||[]),title].slice(-10);save();return}
  S.notifCount[ds]=c+1;Object.keys(S.notifCount).filter(k=>k<iso(addDays(TODAY(),-7))).forEach(k=>delete S.notifCount[k]);save();nativeNote(title,body)}
function once(key){S.notified=S.notified||{};const k=key+'|'+iso(TODAY());if(S.notified[k])return false;S.notified[k]=true;
  const old=iso(addDays(TODAY(),-7));Object.keys(S.notified).forEach(x=>{const d=x.split('|')[1];if(d&&d<old)delete S.notified[x]});save();return true}
function startupNotices(){if(S.notif&&S.notif.briefing&&once('brief')){const q=(S.notifQueue||[]);S.notifQueue=[];save();
    const nm=newImpMails(),ms=nm.length?`${nm.length===1?'Neue wichtige Mail':`${nm.length} neue wichtige Mails`}: ${andList(nm.slice(0,3).map(m=>m.from))}. `:'';
    notify('briefing',new Date().getHours()<11?'Guten Morgen'+anrede():'Dein Tag',ms+briefingText()+(q.length?` Gestern verpasst: ${q.slice(0,3).join(', ')}.`:'')+' Mehr im Planer.')}
  upcoming(30).filter(u=>u.notifyToday&&!u.habit&&!u.quiet).forEach(u=>{if(once('up:'+u.kind+u.title))notify(u.kind==='bday'?'bday':u.kind==='imp'?'bday':'other',u.title,`${inLabel(u.in)[0].toUpperCase()+inLabel(u.in).slice(1)}, ${fmtLong(u.d)}`)})}
function appTick(){const nm=nowMin();try{if(S.fin&&finTick()){save();refresh()}}catch(e){}
  if(modeToday()==='bib'){try{const b=bibTrips(),w=S.settings.walk.w;if(b.out){const lv=b.out.dep-w-nm;if(lv<=10&&lv>=0&&once('zugout'))notify('zug',`In ${lv} min los zum Zug`,`${b.out.line} ${fromM(b.out.dep)} nach ${ortB()}.`)}
    if(b.back){const lv=b.back.dep-S.rhythm.bibWay-nm;if(lv<=10&&lv>=0&&once('zugback'))notify('zug',`In ${lv} min einpacken`,`Heimfahrt: ${b.back.line} ${fromM(b.back.dep)} ab ${ortB()}.`)}}catch(e){}}
  if(S.rhythm.reward.on){const e=toMin(S.rhythm.reward.end);if(nm>=e&&nm<e+5&&once('rewardend'))notify('wind','Freizeit vorbei','Jetzt beginnt das Runterfahren.')}}
function appSettingsCard(){const c=APPCFG;
  return `<section class="card"><div class="card-head"><h2>App</h2><span class="meta">Windows</span></div>
   <label class="sw-row" for="ac-auto"><span>Mit Windows starten<small>startet unsichtbar, nur das Widget erscheint</small></span><input type="checkbox" id="ac-auto" data-appcfg="autostart" ${c.autostart?'checked':''}></label>
   <label class="sw-row" for="ac-wid"><span>Widget anzeigen</span><input type="checkbox" id="ac-wid" data-appcfg="widget" ${c.widget?'checked':''}></label>
   <label class="sw-row" for="ac-desk"><span>Widget am Desktop festmachen<small>bleibt bei Win+D und „Desktop anzeigen“ sichtbar${c.widgetDesk!==false&&c.deskState?(c.deskState.ok?' · <b style="color:var(--accent)">aktiv</b>':c.deskState.error?` · <b style="color:var(--warn)">${esc(c.deskState.error)}</b>`:''):''}</small></span><input type="checkbox" id="ac-desk" data-appcfg="widgetDesk" ${c.widgetDesk!==false?'checked':''}></label>
   <label class="sw-row" for="ac-lock"><span>Widget-Position sperren<small>nicht aus Versehen verschieben oder größer ziehen (auch über die Nadel im Widget)</small></span><input type="checkbox" id="ac-lock" data-appcfg="widgetLocked" ${c.widgetLocked!==false?'checked':''}></label>
   <label class="sw-row" for="ac-top"><span>Widget immer im Vordergrund<small>sonst liegt es hinter deinen Fenstern</small></span><input type="checkbox" id="ac-top" data-appcfg="widgetOnTop" ${c.widgetOnTop?'checked':''}></label>
   <div class="lead-row"><label for="ac-sc">Kürzel für die Schnelleingabe</label><select id="ac-sc" data-appcfg="shortcut">${SHORTCUTS.map(([k,l])=>`<option value="${k}" ${c.shortcut===k?'selected':''}>${l}</option>`).join('')}</select></div>
   <p class="hint">Deine Daten liegen getrennt vom Programm in <code>${esc(c.dataDir||'')}</code>. Jeden Tag wird automatisch eine Sicherung angelegt (14 Tage).</p>
   <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn" data-act="open-data">Datenordner öffnen</button><button class="btn" data-act="app-restart">Planer neu starten</button></div>
   <p class="hint">Änderungen an der Oberfläche übernimmt der Planer von selbst. Nur bei größeren Updates kommt ein Hinweis zum Neustarten.</p></section>`}
function bootMainFrame(){document.body.classList.add('frameless');const d=document.createElement('div');d.className='tb-drag';d.innerHTML='<span>Planer</span>';document.body.prepend(d);
  const send=()=>{const cs=getComputedStyle(document.documentElement);window.planer.setTheme({color:cs.getPropertyValue('--bg').trim()||'#F2F4F3',symbolColor:cs.getPropertyValue('--muted').trim()||'#5A6863'})};
  send();try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>setTimeout(send,50))}catch(e){}}
function bootWidget(){document.body.classList.add('mode-widget');document.body.classList.toggle('w-locked',APPCFG.widgetLocked!==false);const r=document.createElement('div');r.id='widget-root';r.innerHTML='<div class="widget" id="widget"></div>';document.body.prepend(r);
  const draw=()=>{const w=$('#widget');if(w&&!w.contains(document.activeElement))w.innerHTML=renderWidgetInner()};$('#widget').innerHTML=renderWidgetInner();setInterval(draw,30000)}
function bootQuick(){document.body.classList.add('mode-quick');const r=document.createElement('div');r.id='quick-root';document.body.prepend(r);
  const fit=()=>requestAnimationFrame(()=>{const m=r.querySelector('.quick');if(m&&window.planer.quickSize)window.planer.quickSize(Math.ceil(m.getBoundingClientRect().height)+18)});
  const show=()=>{r.innerHTML=quickBox('z. B. Zahnarzt Do 14:30 · '+bspN()+' Nachricht · dump …');const inp=$('#q-in');inp.focus();
    wireQuick(inp,{onResize:fit,onEsc:()=>window.planer.hideQuick(),onDone:l=>{flushSave();$('#q-prev').innerHTML=`<span class="q-done">${ic('check',16)} ${esc(l)}</span>`;inp.value='';setTimeout(()=>window.planer.hideQuick(),700)}});fit()};
  window.QFIT=fit;show();window.planer.onQuickShow(()=>{S=load();show()})}
function runAction(act,data){const b=document.createElement('button');b.hidden=true;Object.entries(data||{}).forEach(([k,v])=>b.dataset[k]=v);b.dataset.act=act;document.body.append(b);b.click();b.remove()}
let pendingRefresh=false;
document.addEventListener('focusout',()=>{if(pendingRefresh)setTimeout(()=>{const a=document.activeElement;if(pendingRefresh&&!(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))){pendingRefresh=false;refresh()}},50)});
if(APP&&window.planer.onConfig)window.planer.onConfig(c=>{Object.assign(APPCFG,c||{});if(MODE==='widget'){document.body.classList.toggle('w-locked',APPCFG.widgetLocked!==false);const w=$('#widget');if(w&&!w.contains(document.activeElement))w.innerHTML=renderWidgetInner()}else if(MODE==='main'&&view==='einstellungen')render()});
if(APP&&window.planer.weather){try{WX=window.planer.weather.get()}catch(_){}window.planer.weather.onData(d=>{WX=d;if(MODE==='main'&&view==='heute'&&briefVisible()){const a=document.activeElement;if(!(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)))render()}})}
let NET={ssid:null};
function netCheck(){if(MODE!=='main'||!NET.ssid||!S.settings.homeSsid||NET.ssid!==S.settings.homeSsid||modeToday()!=='bib')return;
  const dp=dpState();if(dp.homeArrived!=null)return;try{const b=bibTrips(),nm=nowMin();if(b.out&&nm>b.out.dep+60){dp.homeArrived=b.back&&b.back.arr+S.settings.walk.w<nm?b.back.arr+S.settings.walk.w:nm;save();refresh();toast('Willkommen daheim','Heimfahrt abgehakt (Daheim-WLAN erkannt).')}}catch(e){}}
if(APP&&window.planer.net){try{NET=window.planer.net.get()||NET}catch(_){}window.planer.net.onChange(n=>{NET=n||{ssid:null};netCheck()});setTimeout(netCheck,3000)}
if(APP&&window.planer.trains){try{LIVE=window.planer.trains.get()}catch(_){}
  window.planer.trains.onData(d=>{const was=liveOk();LIVE=d;if(MODE==='widget'){const w=$('#widget');if(w&&!w.contains(document.activeElement))w.innerHTML=renderWidgetInner()}
    else if(MODE==='main'&&(view==='zug'||view==='heute'||was!==liveOk())){const a=document.activeElement;if(!(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)))render()}})}
if(APP&&window.planer.onRev)window.planer.onRev(r=>{S._rev=r});
if(APP){window.planer.onState(json=>{try{if(saveT)return;const s=JSON.parse(json);if(!s||s.v!==2)return;S=s;
    if(MODE==='widget'){const w=$('#widget');if(w&&!w.contains(document.activeElement))w.innerHTML=renderWidgetInner()}
    else if(MODE==='main'){ensureSugs();const a=document.activeElement;if(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)&&$('#overlay').hidden){pendingRefresh=true}else refresh()}}catch(e){}});
  if(MODE==='main')window.planer.onOpen(o=>{if(o.view)go(o.view);if(o.act)setTimeout(()=>runAction(o.act,o.data),60)});}
document.addEventListener('change',e=>{const cw=e.target.dataset&&e.target.dataset.chws;if(cw){const c=S.chores.find(z=>z.id===cw);if(c){c.weekStart=+e.target.value;save();refresh();openChoresModal()}return}});
document.addEventListener('change',e=>{const ck=e.target.dataset&&e.target.dataset.calcfg;if(ck){const id=e.target.dataset.id;S.calSettings=S.calSettings||{};S.calSettings[id]=S.calSettings[id]||{};S.calSettings[id][ck]=e.target.type==='checkbox'?e.target.checked:e.target.value.trim();save();render();return}});
document.addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.appcfg;if(!k||!APP)return;const v=e.target.type==='checkbox'?e.target.checked:e.target.value;
  const res=window.planer.setConfig(k,v);Object.assign(APPCFG,res.config||{});if(res.error){toast('Ging nicht',res.error);render()}else if(k==='shortcut')toast('Kürzel geändert',SHORTCUTS.find(x=>x[0]===v)[1])});
/* ---------- Web-App (iPad) ---------- */
const webSideText=()=>window.planer.info&&window.planer.info.speicher==='keiner'?'Speichern geht gerade nicht':'Auf diesem Gerät gespeichert';
function webSettingsCard(){const k=window.planer.info&&window.planer.info.speicher==='keiner';
  return `<section class="card"><div class="card-head"><h2>Dieses Gerät</h2><span class="meta">Web-App</span></div>
   <p class="hint" style="margin-top:0">${k?'<b style="color:var(--warn)">Dieses Gerät lässt gerade kein Speichern zu</b> (zum Beispiel im privaten Modus). Was du jetzt einträgst, ist nach dem Schließen weg.':'Deine Einträge liegen auf diesem Gerät und bleiben auch ohne Internet da. Jeden Tag wird eine Sicherung angelegt (7 Tage).'}</p>
   <p class="hint">Der Abgleich mit dem Laptop wird noch eingerichtet.</p></section>`}
function webFirstCard(){return `<section class="card firstrun"><div class="card-head"><h2>Willkommen</h2><button class="link" data-act="firstrun-done">Ausblenden</button></div>
   <p class="hint" style="margin-top:0">Dieses Gerät ist noch leer. Deine Daten vom Laptop kommen mit dem Abgleich, der noch eingerichtet wird. Du kannst schon alles ausprobieren.</p></section>`}
