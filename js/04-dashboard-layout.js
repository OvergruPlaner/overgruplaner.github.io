/* ---------- Dashboard-Layout ---------- */
const DEFAULT_LAYOUT={cols:[['termine','lernen','todos'],['tag','zug','habits','haushalt'],['menschen','demnaechst','mails','inbox']],hidden:[]};
function layout(){const ids=Object.keys(CARDS);let L=S.layout;
  if(!L||!Array.isArray(L.cols)||L.cols.length!==3)L=JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
  const seen=new Set();L.cols=L.cols.map(c=>c.filter(id=>ids.includes(id)&&!seen.has(id)&&seen.add(id)));L.hidden=(L.hidden||[]).filter(id=>ids.includes(id)&&!seen.has(id)&&seen.add(id));
  ids.forEach(id=>{if(!seen.has(id)){const ci=DEFAULT_LAYOUT.cols.findIndex(c=>c.includes(id));L.cols[ci<0?0:ci].push(id)}});S.layout=L;return L}
let dashEdit=false,sortables=[];


