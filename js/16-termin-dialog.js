/* ---------- Termin-Dialog ---------- */
function openEventInfo(id){const e0=S.events.find(e=>e.id===id);if(!e0)return;const v=evView(e0),d=parseISO(e0.date),span=e0.allDay&&e0.endDate?diffDays(d,parseISO(e0.endDate)):1;
  const when=e0.allDay?(span>1?`${fmtLong(d)} bis ${fmtLong(addDays(d,span-1))} · ${span} Tage`:`${fmtLong(d)} · ganztägig`):`${fmtLong(d)} · ${e0.start}–${e0.end}`;
  overlay(`<div class="modal"><span class="now-label" style="color:var(--${v.fam?'fam':'accent'})">${v.fam?esc(v.who):'Dein Kalender'}</span><h2>${esc(e0.title)}</h2><p class="hint" style="margin:0">${when}${e0.loc?` · ${esc(e0.loc)}`:''}</p>
   ${v.fam?`<p class="hint" style="margin:0">${v.inPlan?'Zählt als dein Termin: steht in deinem Tagesplan und bekommt Erinnerungen.':'Nur zur Info. Steht nicht in deinem Tagesplan.'}</p>`:''}
   <div class="modal-actions" style="flex-wrap:wrap">${v.fam?`<button class="btn ${v.optIn?'':'primary'}" data-act="ev-optin" data-id="${esc(id)}">${v.optIn?'Nicht mehr in meinem Tag':'In meinen Tag übernehmen'}</button>`:''}
    ${e0.allDay?`<button class="btn" data-act="ev-off" data-id="${esc(id)}">${span>1?'Als lernfreie Tage eintragen':'Als lernfreien Tag eintragen'}</button>`:''}
    ${e0.link?`<a class="btn ghost" href="${esc(e0.link)}" target="_blank" rel="noopener">In Google öffnen</a>`:''}<span class="sp"></span><button class="btn ghost" data-act="close-overlay">Schließen</button></div></div>`)}
function openEventModal(o={}){const ex0=o.id?S.events.find(e=>e.id===o.id):null;if(ex0&&(ex0.allDay||evView(ex0).fam)){openEventInfo(o.id);return}const ex=ex0;
  const e=ex||{title:'',date:o.date||iso(TODAY()),start:o.start||'10:00',end:addH(o.start||'10:00',1),cal:'privat',important:false};
  overlay(`<form class="modal" id="f-event" data-id="${ex?ex.id:''}"><h2>${ex?'Termin bearbeiten':'Neuer Termin'}</h2>
   <label class="fl" for="ev-title">Titel<input id="ev-title" name="title" type="text" value="${esc(e.title)}" required autocomplete="off"></label>
   <div class="frow" style="--n:3"><label class="fl" for="ev-date">Datum<input id="ev-date" name="date" type="date" value="${e.date}" required></label><label class="fl" for="ev-start">Von<input id="ev-start" name="start" type="time" value="${e.start}" required></label><label class="fl" for="ev-end">Bis<input id="ev-end" name="end" type="time" value="${e.end}" required></label></div>
   <label class="fl" for="ev-loc">Ort<input id="ev-loc" name="loc" type="text" value="${esc(e.loc||'')}" autocomplete="off" placeholder="optional"></label>${e.rrule?`<p class="hint" style="margin:0">Serie: ${rrLabel(e.rrule)}. Änderungen gelten nur für diesen Termin.</p>`:''}
   <div class="frow" style="--n:2"><label class="fl" for="ev-cal">Kalender<select id="ev-cal" name="cal">${['privat','uni','training'].map(k=>`<option value="${k}" ${e.cal===k?'selected':''}>${CAL[k].name}</option>`).join('')}</select></label>
   <label class="check-l" style="align-self:end;padding-bottom:8px"><input id="ev-imp" name="important" type="checkbox" ${e.important?'checked':''}> wichtig (früher erinnern)</label></div>
   <div class="modal-actions">${ex?`<button type="button" class="btn ghost danger" data-act="del-event" data-id="${ex.id}">${ic('trash',16)} Löschen</button>`:''}<span class="sp"></span><button type="button" class="btn ghost" data-act="close-overlay">Abbrechen</button><button class="btn primary">Speichern</button></div>
   <p class="hint" style="margin:0">${ex&&ex.readonly?'Dieser Termin kommt aus einem geteilten Kalender und lässt sich hier nur ansehen.':APP&&GSTATUS.connected?'Landet auch in deinem Google Kalender.':'Wird gespeichert, sobald Google verbunden ist, auch in Google Kalender.'}</p></form>`);
  if(ex&&ex.readonly)document.querySelectorAll('#f-event input,#f-event select,#f-event .btn.primary,#f-event [data-act=del-event]').forEach(x=>x.disabled=true);
  $('#ev-title').focus()}



