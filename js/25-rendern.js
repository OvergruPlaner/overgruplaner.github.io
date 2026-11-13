/* ---------- Overlay, Toast ---------- */
function overlay(html,mode=''){const o=$('#overlay');o.className=mode;o.innerHTML=`<div class="scrim" data-act="close-overlay"></div><div class="ov-inner">${html}</div>`;o.hidden=false}
function closeOverlay(){const o=$('#overlay');o.hidden=true;o.innerHTML=''}
function toast(title,body,win,action){if(MODE==='quick')return;if(APP&&!WEB&&win&&MODE==='main'&&!document.hasFocus()){nativeNote(title,body);return}const el=document.createElement('div');el.className='toast';el.setAttribute('role','status');
  el.innerHTML=`<div class="t-app">${win?ic('cal',13)+(WEB?' Planer':' Planer · Windows-Benachrichtigung'):''}</div><strong>${esc(title)}</strong>${body?`<p>${esc(body)}</p>`:''}${action?`<button class="link t-act" data-act="${action.act}" ${action.k?`data-k="${action.k}"`:''}>${action.txt}</button>`:''}<button class="t-x" aria-label="Schließen">${ic('x',14)}</button>`;
  $('#toasts').append(el);el.querySelector('.t-x').onclick=()=>el.remove();if(action)el.querySelector('.t-act').addEventListener('click',()=>setTimeout(()=>el.remove()));setTimeout(()=>el.remove(),win?9000:action?7000:3800)}

/* ---------- Rendern ---------- */
function render(){if(DRAG){dragPending=true;return}const sc=$('#cal-scroll'),keep=sc?sc.scrollTop:null;
  $('#side').innerHTML=renderSide();
  $('#main').innerHTML=banner()+(GROUP[view]?subTabs(GROUP[view]):'')+({heute:()=>S.settings.heuteMode==='ueberblick'?renderHeute():renderRuhig(),kalender:renderKalender,todos:renderTodos,habits:renderHabits,mail:renderMail,einstellungen:renderSettings,zug:renderZug,lernen:renderLernen,menschen:renderMenschen,haushalt:renderHaushalt,finanzen:renderFinanzen}[view])();
  initSortable();
  const ns=$('#cal-scroll');if(ns){if(calScroll){ns.scrollTop=(7.5-H0)*HH;calScroll=false}else if(keep!=null)ns.scrollTop=keep}}
function refresh(){render();const w=$('#widget');if(w)w.innerHTML=renderWidgetInner()}
function go(v){if(WEB&&v==='zug')v='heute';view=v;if(GROUP[v]){S.lastSub=S.lastSub||{};S.lastSub[GROUP[v]]=v;save()}if(v==='kalender')calScroll=true;render();window.scrollTo(0,0)}

