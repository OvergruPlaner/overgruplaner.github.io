/* ---------- Start je nach Fenster ---------- */
if(MODE==='widget')bootWidget();
else if(MODE==='quick')bootQuick();
else{if(APP&&window.planer.setTheme)bootMainFrame();if(APP)ensureSugs();
  if(APP)fixDoOnV1();
  if(APP&&S.fin)try{finTick()}catch(e){}
  render();if(APP){save();setTimeout(startupNotices,1500);setInterval(appTick,30000)}
  else setTimeout(()=>{if(S.notif&&S.notif.briefing)toast(new Date().getHours()<11?'Guten Morgen'+anrede():'Dein Tag',briefingText(),true)},1200)}
