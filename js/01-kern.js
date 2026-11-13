/* ---------- Hilfsfunktionen ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseISO=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const TODAY=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
const diffDays=(a,b)=>Math.round((b-a)/864e5);
const mondayOf=d=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
const toMin=s=>{const[h,m]=s.split(':').map(Number);return h*60+m};
const fromMin=n=>{n=Math.max(0,Math.min(23*60+59,n));return pad(Math.floor(n/60))+':'+pad(n%60)};
const addH=(s,h)=>fromMin(toMin(s)+h*60);
const uid=()=>Math.random().toString(36).slice(2,9);
const WD=['So','Mo','Di','Mi','Do','Fr','Sa'];
const WDL=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
const MON=['Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const MONS=['Jän','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const fmtD=d=>`${d.getDate()}.${d.getMonth()+1}.`;
const fmtShort=d=>`${WD[d.getDay()]}, ${fmtD(d)}`;
const fmtLong=d=>`${WDL[d.getDay()]}, ${fmtD(d)}`;
function isoWeek(d){const x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const day=x.getUTCDay()||7;x.setUTCDate(x.getUTCDate()+4-day);const y0=new Date(Date.UTC(x.getUTCFullYear(),0,1));return Math.ceil(((x-y0)/864e5+1)/7)}
function nextWd(t,wd){let o=(wd-t.getDay()+7)%7;if(o===0)o=7;return addDays(t,o)}
const inLabel=n=>n===0?'heute':n===1?'morgen':n===2?'übermorgen':`in ${n} Tagen`;

/* Österreichische Feiertage */
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return new Date(y,mo-1,da)}
const holCache={};
function holidays(y){if(holCache[y])return holCache[y];const o={};const f=(m,d,n)=>o[`${y}-${pad(m)}-${pad(d)}`]=n;
  f(1,1,'Neujahr');f(1,6,'Heilige Drei Könige');f(5,1,'Staatsfeiertag');f(8,15,'Mariä Himmelfahrt');f(10,26,'Nationalfeiertag');f(11,1,'Allerheiligen');f(12,8,'Mariä Empfängnis');f(12,25,'Christtag');f(12,26,'Stefanitag');
  const E=easter(y);[[1,'Ostermontag'],[39,'Christi Himmelfahrt'],[50,'Pfingstmontag'],[60,'Fronleichnam']].forEach(([n,nm])=>o[iso(addDays(E,n))]=nm);return holCache[y]=o}
const holidayName=d=>holidays(d.getFullYear())[iso(d)];

const IC={
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
 list:'<path d="M4 6.5l1.5 1.5L8 5.5M4 12.5l1.5 1.5L8 11.5M4 18.5l1.5 1.5L8 17.5M11.5 7h8.5M11.5 13h8.5M11.5 19h8.5"/>',
 flame:'<path d="M12 3c1 3.5 5 5.5 5 10.5a5 5 0 0 1-10 0c0-2.6 1.4-4.2 2.5-5.2.3 1.8 1.2 2.7 2 3.1.6-3.1-.6-5.6.5-8.4z"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
 gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
 widget:'<rect x="3" y="3" width="18" height="18" rx="2.5"/><rect x="12" y="6" width="6" height="7" rx="1.2"/>',
 bolt:'<path d="M13 2.5L4.5 14H11l-1 7.5L18.5 10H12z"/>',
 bell:'<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
 chevL:'<path d="M15 5l-7 7 7 7"/>', chevR:'<path d="M9 5l7 7-7 7"/>',
 star:'<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/>',
 x:'<path d="M6 6l12 12M18 6L6 18"/>', plus:'<path d="M12 5v14M5 12h14"/>',
 clip:'<path d="M20 11.5l-7.8 7.8a5 5 0 0 1-7-7L13 4.5a3.3 3.3 0 0 1 4.7 4.7l-7.8 7.8a1.7 1.7 0 0 1-2.4-2.4l7.2-7.2"/>',
 trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
 grip:'<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
 layout:'<rect x="3" y="3" width="7.5" height="10" rx="1.8"/><rect x="13.5" y="3" width="7.5" height="6" rx="1.8"/><rect x="3" y="16" width="7.5" height="5" rx="1.8"/><rect x="13.5" y="12" width="7.5" height="9" rx="1.8"/>',
 train:'<rect x="5" y="3" width="14" height="14" rx="3.5"/><path d="M5 10.5h14M9 21l1.5-4M15 21l-1.5-4"/><circle cx="9" cy="13.8" r=".8"/><circle cx="15" cy="13.8" r=".8"/>',
 book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 0 4 19.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
 users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.6a3 3 0 0 1 0 5.8M21 20c0-2.8-1.8-5.1-4.3-5.8"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
 msg:'<path d="M4 5h16v11H9l-5 4z"/>',
 phone:'<path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.8 6.8l1.4-2.2 4.5 1.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.1 1.5 1.5 0 0 1 5 3.5z"/>',
 wave:'<path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M7 11a1.5 1.5 0 0 0-3 0v1.5c0 4.4 3.1 8 7.5 8s7-3 7-7.5V8.5a1.5 1.5 0 0 0-3 0"/>',
 heart:'<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
 pin:'<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
 first:'<path d="M6 5h12M12 19V9M7.5 13.5L12 9l4.5 4.5"/>',
 down:'<path d="M12 5v14M6 13l6 6 6-6"/>',
 euro:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.6a4.6 4.6 0 1 0 0 6.8M7 10.8h6.5M7 13.2h6.5"/>',
 ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
};
const ic=(n,s=18)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

const CAL={privat:{name:'Privat'},uni:{name:'Uni'},training:{name:'Training'},fam:{name:'Familie'},bday:{name:'Geburtstage'},hol:{name:'Feiertage AT'},task:{name:'To-dos'}};
const WDORDER=[1,2,3,4,5,6,0];

