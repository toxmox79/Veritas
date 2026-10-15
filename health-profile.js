/* Veritas – lokale krankheitsspezifische Orientierung, keine Diagnose. */
'use strict';
const HEALTH_PROFILE_KEY='veritas-health-profile-v1';
const CONDITIONS=[
 ['diabetes','Diabetes (Typ 1 / Typ 2)'],
 ['prediabetes','Prädiabetes'],
 ['kidney','Chronische Niereninsuffizienz'],
 ['hypertension','Bluthochdruck'],
 ['cardiovascular','Erhöhte Blutfette / Herz-Kreislauf-Erkrankung'],
 ['celiac','Zöliakie'],
 ['lactose','Laktoseintoleranz'],
 ['pku','Phenylketonurie (PKU)'],
 ['gout','Gicht / Hyperurikämie'],
 ['reflux','Reflux / Sodbrennen']
];
function loadConditions(){try{const v=JSON.parse(localStorage.getItem(HEALTH_PROFILE_KEY)||'[]');return Array.isArray(v)?v.filter(x=>CONDITIONS.some(c=>c[0]===x)):[]}catch{return []}}
let healthConditions=loadConditions();
function renderConditionSettings(){const el=document.getElementById('conditionChoices');if(!el)return;el.innerHTML=CONDITIONS.map(([key,label])=>`<label class="checkchoice"><input type="checkbox" data-condition="${key}" ${healthConditions.includes(key)?'checked':''}><span>${label}</span></label>`).join('')}
function saveConditionSettings(){const arr=[...document.querySelectorAll('[data-condition]:checked')].map(x=>x.dataset.condition);healthConditions=arr;try{localStorage.setItem(HEALTH_PROFILE_KEY,JSON.stringify(arr))}catch{document.getElementById('settingsMessage').textContent+=' Gesundheitsprofil konnte nicht gespeichert werden.'}}
function clearConditionSettings(){healthConditions=[];try{localStorage.removeItem(HEALTH_PROFILE_KEY)}catch{}}
function renderConditionAlerts(p){const el=document.getElementById('conditionAlerts');if(!el)return;if(!healthConditions.length){el.hidden=true;return}el.hidden=false;
 const n=p.nutriments||{}, ingredients=String(p.ingredients_text_de||p.ingredients_text||'').toLowerCase();
 const name=String(p.product_name_de||p.product_name||'').toLowerCase();
 const ids=typeof additiveIds==='function'?additiveIds(p):new Set();
 const num=k=>{const v=n[k+'_100g'];return v===undefined||v===null||v===''||!Number.isFinite(Number(v))?null:Number(v)};
 const sodium=num('sodium'), salt=num('salt')??(sodium===null?null:sodium*2.5);
 const sugar=num('sugars'), carbs=num('carbohydrates'), saturated=num('saturated-fat'), potassium=num('potassium'), phosphorus=num('phosphorus');
 const tags=[...(p.allergens_tags||[])].map(x=>String(x).toLowerCase());
 const isDrink=/(getränk|drink|limonade|cola|saft|juice|wasser|water|tee|tea|milkshake|smoothie)/i.test(name+' '+(p.categories||''));
 const hasList=ingredients.trim().length>0;
 const notes=[];
 const add=(status,title,reason)=>notes.push({status,title,reason});
 const pAdd=[...ids].filter(id=>/^e(?:338|339|340|341|343|450|451|452)$/.test(id));
 const kAdd=[...ids].filter(id=>/^e(?:340|332|336|337|501|508)$/.test(id));
 const sugarHigh=isDrink?11.25:22.5;
 const saltHigh=1.5, saltLow=.3; // g Salz je 100 g / ml: allgemeine Kennzeichnung, keine Therapiegrenze
 for(const c of healthConditions){
  const label=CONDITIONS.find(x=>x[0]===c)?.[1]||c;
  if(c==='diabetes'||c==='prediabetes'){
   if(carbs!==null) add('info',label,`${carbs.toLocaleString('de-DE')} g Kohlenhydrate je 100 ${isDrink?'ml':'g'}; relevant für die Portionsberechnung${sugar===null?' (Zuckerwert fehlt)':`; davon ${sugar.toLocaleString('de-DE')} g Zucker`}. Auch stärkereiche Lebensmittel können den Blutzucker erhöhen.`);
   else add('unknown',label,'Kohlenhydratangaben fehlen. Die Eignung für die Blutzuckerkontrolle lässt sich nicht prüfen.');
   if(sugar!==null&&sugar>sugarHigh)add('warn',label,`Hoher Zuckergehalt (${sugar.toLocaleString('de-DE')} g/100 ${isDrink?'ml':'g'} nach einem allgemeinen Kennzeichnungsrichtwert). Portionsgröße beachten.`);
  }
  if(c==='hypertension'||c==='kidney'||c==='cardiovascular'){
   if(salt===null) add('unknown',label,'Salzangaben fehlen. Keine Entwarnung zur Natriumaufnahme möglich.');
   else if(salt>saltHigh)add('warn',label,`Viel Salz: ${salt.toLocaleString('de-DE')} g je 100 ${isDrink?'ml':'g'}. Bei Bluthochdruck und vielen Nierenerkrankungen ist eine salzarme Ernährung wichtig.`);
   else if(salt>saltLow)add('info',label,`Salz: ${salt.toLocaleString('de-DE')} g je 100 ${isDrink?'ml':'g'}; auch die verzehrte Portion berücksichtigen.`);
  }
  if(c==='kidney'){
   if(pAdd.length)add('warn',label,`Phosphatzusatzstoff(e) erkannt: ${pAdd.map(x=>x.toUpperCase()).join(', ')}. Bei Niereninsuffizienz kann eine Beschränkung nötig sein; die tatsächliche Phosphormenge ist unbekannt.`);
   if(kAdd.length)add('warn',label,`Kaliumhaltige Zusatzstoffe möglich: ${kAdd.map(x=>x.toUpperCase()).join(', ')}. Nur relevant, wenn Kalium medizinisch begrenzt werden soll.`);
   if(potassium!==null)add('info',label,`Datenbankangabe Kalium: ${(potassium*1000).toLocaleString('de-DE',{maximumFractionDigits:0})} mg je 100 ${isDrink?'ml':'g'} (aus dem standardisierten g-Wert umgerechnet). Ob eine Begrenzung nötig ist, ist individuell.`);
   else add('unknown',label,'Keine verlässliche Kaliumangabe. Ein normaler Salz- oder Nutri-Score-Wert belegt keine Niereneignung.');
   if(phosphorus===null)add('unknown',label,'Phosphorgehalt unbekannt; auch ohne deklarierte E-Nummern kann Phosphor enthalten sein.');
  }
  if(c==='cardiovascular'){
   if(saturated===null)add('unknown',label,'Angaben zu gesättigten Fettsäuren fehlen.');
   else if(saturated>(isDrink?2.5:5))add('warn',label,`Hoher Gehalt an gesättigten Fettsäuren (${saturated.toLocaleString('de-DE')} g je 100 ${isDrink?'ml':'g'}). Häufige hohe Aufnahme kann erhöhte LDL-Cholesterinwerte begünstigen.`);
  }
  if(c==='celiac'){
   if(tags.some(x=>/gluten|wheat|barley|rye|spelt|oats/.test(x)))add('danger',label,'Glutenhaltige Zutaten als Allergen erfasst. Bei Zöliakie meiden und Verpackung kontrollieren.');
   else add('unknown',label,'Kein sicherer Glutenfrei-Nachweis. „Keine Gluten-Zutat erkannt“ ist keine Freigabe bei Zöliakie; Kreuzkontamination möglich.');
  }
  if(c==='lactose'){
   const lactoseFree=/laktosefrei|lactose.free/.test(name+' '+ingredients);
   if(!lactoseFree&&(tags.some(x=>/milk/.test(x))||/milch|molke|laktose|lactose|sahne|rahm|milchpulver/.test(ingredients)))add('info',label,'Milchbestandteil erkennbar. Ob und wie viel Laktose enthalten ist, lässt sich ohne spezielle Deklaration nicht sicher sagen.');
   else if(!lactoseFree)add('unknown',label,'Laktosegehalt nicht verifiziert; bei unvollständiger Zutatenliste vorsichtig sein.');
  }
  if(c==='pku'){
   if(ids.has('e951')||/aspartam|phenylalaninquelle|phenylalanine/.test(ingredients))add('danger',label,'Aspartam / Phenylalaninquelle erkannt. Bei PKU nur gemäß individuellem Ernährungsplan verwenden.');
   else add('unknown',label,'Phenylalaninmenge unbekannt. Auch normales Eiweiß enthält Phenylalanin; keine PKU-Freigabe möglich.');
  }
  if(c==='gout')add('unknown',label,'Puringehalt wird in Verpackungsdaten normalerweise nicht angegeben. Die EAN-Daten reichen für eine zuverlässige Gichtbewertung nicht aus.');
  if(c==='reflux')add('info',label,'Reflux-Auslöser unterscheiden sich individuell. Säure, Fett, Schärfe, Kohlensäure und Portionsgröße können eine Rolle spielen; EAN-Daten erlauben keine sichere Vorhersage.');
 }
 if(!hasList)add('unknown','Datenqualität','Die Zutatenliste fehlt. Gesundheitsrelevante Inhaltsstoffe können unerkannt bleiben.');
 const order={danger:0,warn:1,unknown:2,info:3};notes.sort((a,b)=>order[a.status]-order[b.status]);
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 el.innerHTML='<div class="section-head"><h3>🩺 Hinweise zu deinem Gesundheitsprofil</h3>'+infoHelp('<strong>Zur Gesundheitsbewertung</strong><p>Die Hinweise beruhen auf öffentlichen Etikett- und Nährwertdaten, nicht auf Laborprüfungen. Sie sind keine individuelle Therapieempfehlung und keine automatische Freigabe oder Verbotsliste.</p><p>Portionsgröße, Medikamente, Laborwerte und individuelle Ernährungsvorgaben mit der behandelnden Fachperson abstimmen.</p>','Allgemeine Hinweise zur Gesundheitsbewertung')+'</div>'+notes.map(x=>`<div class="${x.status==='danger'?'alertDanger':x.status==='warn'?'alertWarn':x.status==='unknown'?'alertUnknown':'alertNeutral'}"><strong>${x.status==='danger'?'⚠':x.status==='warn'?'⚑':x.status==='unknown'?'ⓘ':'•'} ${escape(x.title)}</strong><p>${escape(x.reason)}</p></div>`).join('');
}
