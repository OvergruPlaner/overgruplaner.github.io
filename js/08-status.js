/* ---------- Status ---------- */
const VIEWS=['heute','kalender','todos','lernen','habits','haushalt','menschen','finanzen','zug','mail','einstellungen'];
const GROUP={kalender:'planen',todos:'planen',lernen:'planen',mail:'planen',habits:'leben',haushalt:'leben',menschen:'leben',finanzen:'leben',zug:'leben'};
const SUBS={planen:[['kalender','cal','Kalender'],['todos','list','To-dos'],['lernen','book','Lernplan'],['mail','mail','Posteingang']],leben:[['habits','flame','Habits'],['haushalt','check','Haushalt'],['menschen','users','Menschen'],['finanzen','euro','Finanzen'],['zug','train','Zug']]};
if(WEB)SUBS.leben=SUBS.leben.filter(x=>x[0]!=='zug');
let view=VIEWS.includes(location.hash.slice(1))&&!(WEB&&location.hash==='#zug')?location.hash.slice(1):'heute';
let cal={mode:'woche',anchor:iso(TODAY())},calScroll=true;
let mailSel=null,mailFilter='alle',todoList='alle';


