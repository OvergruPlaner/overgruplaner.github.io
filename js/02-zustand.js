const KEY='planer-proto-v2';
const APP=!!window.planer;
/* Web-App (iPad): dieselbe Oberfläche über web/bruecke.js. Was es dort nicht gibt (Zug live, Widget, Windows-Einstellungen), wird mit WEB ausgeblendet. */
const WEB=APP&&!!window.planer.web;
const MODE=APP?(['widget','quick'].includes(location.hash.slice(1))?location.hash.slice(1):'main'):'main';
const APPCFG=APP?window.planer.getConfig():{};
function freshState(){const s={v:2,events:[],tasks:[],mails:[],birthdays:[],lists:['Uni','Privat','Einkauf'],
  habits:[{id:uid(),name:'Kreatin',detail:'5 g',freq:{type:'daily'},log:{}},{id:uid(),name:'Training',detail:'Kraft, Upper/Lower',freq:{type:'days',days:[1,3,5]},log:{}},
    {id:uid(),name:'Lesen',detail:'am Abend, kein Fachbuch',freq:{type:'daily'},log:{}},{id:uid(),name:'Lernen',detail:'Tagespensum geschafft',freq:{type:'daily'},log:{}},
    {id:uid(),name:'Was mit Leuten',detail:'treffen, telefonieren, raus',freq:{type:'weekly',n:1},log:{}}],
  senders:[{label:'ÖBB',match:'oebb'}],
  settings:{lead:{bday:7,exam:14,important:2,normal:1},walk:{w:12,p:4},trainDir:null,heuteMode:'ruhig'},vis:{privat:true,uni:true,training:true,bday:true,hol:true,task:true},
  studyRest:[0],studyOff:[],exams:[],life:true,lifeV2:true,calmV1:true,flowV1:true,seedTrip:true,firstRun:true,
  rhythm:{wake:'07:30',sleep:8,wind:45,sport:'18:00',sportMin:75,lunch:'12:30',lunchMin:60,morningMin:30,bibWay:30,reward:{on:true,label:'Freizeit',start:'21:00',end:'22:00'}},
  routines:{morning:[{id:'m1',t:'Zähne putzen'},{id:'m2',t:'Frühstücken'},{id:'m3',t:'Kreatin nehmen',habit:'kreatin'},{id:'mode',t:'Bib oder daheim?',type:'mode'}],
    evening:[{id:'e1',t:'Handy weglegen, PC aus'},{id:'e2',t:'Zähne putzen'},{id:'e3',t:'Lesen bis {bed}',habit:'lesen',timer:true},{id:'e4',t:'Licht aus um {bed}'}]},
  routineLog:{},dayMode:{},focusLog:{},dayPlan:{},speed:{},offDismissed:[],notified:{},notifCount:{},
  chores:[{id:uid(),name:'Geschirrspüler ausräumen',mins:5,rhythm:'daily',last:null},{id:uid(),name:'Müll runtertragen',mins:3,rhythm:'needed',flagged:false,last:null},
    {id:uid(),name:'Wäsche bügeln',mins:25,rhythm:'weekly',last:null},{id:uid(),name:'Zimmer moppen',mins:20,rhythm:'weekend',last:null}],
  replies:[],people:[],contactLog:[],
  notif:{briefing:true,zug:true,wind:true,bday:true,study:true,watcher:true,other:false,quiet:{start:'23:00',end:'07:30'},max:5},
  watch:{on:true,sites:['YouTube','Instagram','Crunchyroll','Netflix','Spiele (Steam)'],after:20},lastSub:{planen:'kalender',leben:'habits'}};return typeof frischLokal==='function'?frischLokal(s):s}
let S;
function load(){if(APP){try{const r=window.planer.load();if(r){const s=JSON.parse(r);if(s&&s.v===2)return s}}catch(e){}return freshState()}
  try{const r=localStorage.getItem(KEY);if(r){const s=JSON.parse(r);if(s&&s.v===2)return s}}catch(e){}return typeof seed==='function'?seed():freshState()}
/* Sync-fest (13.11.2026): Listen von Einträgen OHNE id führt statemerge nur als Ganzes zusammen („wer zuletzt speichert, gewinnt“).
   Ändern zwei Geräte (oder zwei Fenster) so eine Liste gleichzeitig, wären die Einträge einer Seite weg. Deshalb bekommt hier jeder
   Eintrag beim Speichern eine id, wenn er noch keine hat. Die id wird aus dem Inhalt gebildet: Zwei Geräte geben demselben Eintrag
   dieselbe id, und automatische Buchungen (Sparen, Monatsabschluss: tag + Monat + Topf) werden so auf zwei Geräten nur EINMAL gezählt.
   Eine vergebene id bleibt. Neues Feld `id`, sonst ändert sich an den Einträgen nichts. Neue Liste ohne id im Zustand? Hier eintragen. */
function syncFest(){try{
  const h=s=>{let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)}return (x>>>0).toString(36)};
  const fill=(arr,key)=>{if(!Array.isArray(arr)||!arr.some(o=>o&&typeof o==='object'&&o.id==null))return;const used=new Set(arr.map(o=>o&&o.id).filter(v=>v!=null));
    arr.forEach(o=>{if(!o||typeof o!=='object'||o.id!=null)return;const k=key(o);let id=k,n=0;while(used.has(id))id=k+'~'+(++n);o.id=id;used.add(id)})};
  fill(S.studyOff,o=>'o:'+o.date);
  fill(S.senders,o=>'s:'+h((o.label||'')+'|'+(o.match||'')));
  fill(S.contactLog,o=>'c:'+o.date+':'+h((o.name||'')+'|'+(o.kind||'')));
  (S.exams||[]).forEach(x=>fill(x.revHist,o=>'r:'+o.i+':'+o.d));
  if(S.fin)fill(S.fin.potLog,l=>l.exp?'e:'+l.exp:l.inc?'i:'+l.inc+':'+l.pot:l.trip?'t:'+l.trip:l.mv?'m:'+l.mv+':'+(l.amount<0?'a':'b'):l.tag&&l.ym?l.tag+':'+l.ym+':'+l.pot:'x:'+l.date+':'+l.pot+':'+h(l.amount+'|'+(l.why||'')));
}catch(e){}}
let saveT=null;
function save(){syncFest();if(APP){clearTimeout(saveT);saveT=setTimeout(flushSave,120);return}try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function flushSave(){clearTimeout(saveT);saveT=null;if(APP)window.planer.save(JSON.stringify(S))}
window.addEventListener('beforeunload',()=>{if(saveT)flushSave()});
S=load();
if(!S.settings.walk)S.settings.walk={w:12,p:4};
if(!('trainDir' in S.settings))S.settings.trainDir=null;
if(!S.studyRest)S.studyRest=[0];
if(!S.studyOff)S.studyOff=[];
const isOff=ds=>S.studyOff.some(o=>o.date===ds);
/* Persönliches (Vorname, Orte der Zugstrecke) steht in den Daten (S.settings.ich), nicht im Code:
   Der Code der Web-App liegt öffentlich lesbar auf GitHub Pages. Am Laptop trägt app/lokal/ich.js die Werte einmalig ein,
   aufs iPad kommen sie mit dem Abgleich. Fehlen sie, steht etwas Neutrales da. */
const ich=(k,d)=>{const v=(S.settings.ich||{})[k];if(v!=null&&v!=='')return v;const l=typeof ICH_LOKAL==='object'?ICH_LOKAL[k]:null;return l==null?d:l}; /* ICH_LOKAL: nur am Laptop (app/lokal/ich.js), falls ein frisch geladener Stand die Werte noch nicht trägt */
const ortA=()=>ich('ortA','Start'),ortB=()=>ich('ortB','Ziel'),ortBL=()=>ich('ortBlang',ortB());
const anrede=()=>{const n=ich('name','');return n?', '+n:''};
/* Name und Geburtstag in den Eingabe-Beispielen (Legende, Platzhalter). */
const bspN=()=>ich('bspName','Anna'),bspG=()=>ich('bspGeb','3.5.'),bspJ=()=>ich('bspJahr','1998');
