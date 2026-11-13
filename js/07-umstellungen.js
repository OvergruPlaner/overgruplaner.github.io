if(!S.exams){S.exams=seedExams();save()}
if(S.fixOv){const lim=iso(addDays(TODAY(),-3)),lim2=iso(addDays(TODAY(),-60));Object.keys(S.fixOv).forEach(k=>{const v=S.fixOv[k];if(k<lim2||(k<lim&&!Object.values(v||{}).some(x=>x&&x.mv)))delete S.fixOv[k]})}
if(!S.ironSatV1){S.ironSatV1=true;(S.chores||[]).forEach(c=>{if(/bügel/i.test(c.name)&&c.rhythm==='weekly'&&c.weekStart==null)c.weekStart=6});save()}
if(!S.calmV1){S.calmV1=true;S.settings.heuteMode='ruhig';S.rhythm.lunch=S.rhythm.lunch||'12:30';
  S.notif={briefing:true,zug:true,wind:true,bday:true,study:true,watcher:true,other:false,quiet:{start:'23:00',end:'07:30'},max:5};
  S.watch={on:true,sites:['YouTube','Instagram','Crunchyroll','Netflix','Spiele (Steam)'],after:20};S.lastSub={planen:'kalender',leben:'habits'};save()}
if(!S.flowV1){S.flowV1=true;Object.assign(S.rhythm,{bibWay:30,sportMin:75,lunchMin:60,morningMin:30});S.dayPlan={};S.speed={};
  const ph=S.exams.find(x=>/physiologie/i.test(x.subject)&&x.mode==='topics');if(ph){ph.mode='lectures';ph.items=ph.items.map((it,i)=>({name:`VL ${i+1} ${it.name}`,size:1,dur:[90,85,90,95][i%4]}))}
  save()}
if(S.rhythm&&S.rhythm.reward&&/anime|youtube/i.test(S.rhythm.reward.label)){S.rhythm.reward.label='Freizeit';save()}
