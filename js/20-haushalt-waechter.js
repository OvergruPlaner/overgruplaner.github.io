/* ---------- Haushalt-Seite ---------- */
function renderHaushalt(){const t=TODAY(),ds=iso(t),dc=dueChores();
  return `<div class="page-head"><div><p class="eyebrow">Leben</p><h1>Haushalt</h1><p class="sub">${dc.length?`${dc.length} ${dc.length===1?'Sache steht':'Sachen stehen'} an, zusammen etwa ${dc.reduce((a,c)=>a+c.mins,0)} Minuten.`:'Alles im Griff.'}</p></div>
   <div class="head-actions">${dc.length?`<button class="btn primary" data-act="sprint">${ic('bolt',16)} 10-Minuten-Sprint</button>`:''}</div></div>
  <section class="card"><ul class="chores">${S.chores.map(c=>{const st=choreState(c),dn=c.last===ds;
    return `<li class="${st.due?'due':''}"><button class="chk ${dn&&!st.due?'on':''}" data-act="chore-done" data-id="${c.id}" aria-label="${esc(c.name)} erledigt">${ic('check',11)}</button>
     <span class="ch-main"><b>${esc(c.name)}</b><small>${RHY[c.rhythm]} · ${c.mins} min · ${c.last?`zuletzt ${c.last===ds?'heute':fmtShort(parseISO(c.last))}`:'noch nie'}</small></span>
     <span class="rt-m ${st.late?'late':''}">${st.due?st.label:c.rhythm==='needed'?`<button class="link" data-act="chore-flag" data-id="${c.id}">steht an</button>`:st.label||'erledigt'}</span>
     <button class="icon-btn" data-act="chore-del2" data-id="${c.id}" aria-label="${esc(c.name)} entfernen">${ic('trash',14)}</button></li>`}).join('')}</ul>
   <form id="f-chore2" class="ch-add"><label class="sr" for="c2-name">Aufgabe</label><input id="c2-name" name="name" type="text" required autocomplete="off" placeholder="Neue Aufgabe, z. B. Bad putzen">
    <label class="sr" for="c2-rhy">Rhythmus</label><select id="c2-rhy" name="rhythm">${Object.entries(RHY).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select>
    <label class="sr" for="c2-mins">Minuten</label><input id="c2-mins" name="mins" type="number" min="1" value="10" title="Minuten"><button class="btn">${ic('plus',16)}</button></form>
   <p class="hint">„1× pro Woche“ ist egal an welchem Tag. „1× am Wochenende“ taucht Samstag auf und bleibt bis Sonntag. „Bei Bedarf“ erscheint, wenn du „steht an“ tippst.</p></section>`}

/* ---------- Wächter (Simulation) ---------- */
let watchDemo=null;
function watchTarget(){const st=activeExams().map(x=>({x,p:studyPlan(x)})).find(o=>o.p.today&&o.p.today.type==='learn'&&o.p.doneToday<o.p.today.amt);
  if(st){const g=segs(st.x,st.p.doneBefore+st.p.doneToday,st.p.today.b)[0];return g?`${st.x.subject}, ${g.range||g.name}`:st.x.subject}
  const n=nowCandidates().find(c=>c.p>0&&c.label!=='Freizeit');return n?n.title:'deinem Tag'}
function watchPrompt(stage){const w=watchDemo,target=watchTarget();
  overlay(`<div class="modal watch" role="alertdialog" aria-label="Wächter"><span class="now-label">Kurz innehalten</span><h2>Seit ${w.mins} min ${esc(w.site)}</h2>
   <p class="hint" style="margin:0">${stage>1?'Du hast schon einmal verlängert. Kein Problem, nur bewusst entscheiden.':'Außerhalb deines Freizeit-Slots. Bewusst weiter, oder zurück?'}</p>
   ${stage>1?`<div class="wcount" id="wcount">Kurz durchatmen … <b>5</b></div>`:''}
   <div class="wbtns"><button class="btn primary" data-act="watch-back" ${stage>1?'disabled':''}>Zurück zu ${esc(target)}</button>
    <button class="btn" data-act="watch-snooze" data-m="10" ${stage>1?'disabled':''}>Noch 10 min</button><button class="btn" data-act="watch-snooze" data-m="20" ${stage>1?'disabled':''}>Noch 20 min</button>
    <button class="btn ghost" data-act="watch-ok" ${stage>1?'disabled':''}>Ist gerade Absicht</button></div>
   <p class="hint" style="margin:0">Simulation. In der App kommt das automatisch, wenn ${esc(w.site)} länger als ${S.watch.after} min vorne ist.</p></div>`,'top');
  if(stage>1){let n=5;const iv=setInterval(()=>{n--;const el=$('#wcount');if(!el){clearInterval(iv);return}if(n<=0){clearInterval(iv);el.innerHTML='Jetzt entscheiden.';document.querySelectorAll('.watch [disabled]').forEach(b=>b.disabled=false)}else el.querySelector('b').textContent=n},1000)}}


