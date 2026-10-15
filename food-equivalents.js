/* Veritas 2.8: mengenbasierter Nährstoff-Lebensmittelvergleich für Nahrungsergänzungsmittel.
 * Durchschnittliche, gerundete Orientierungswerte je 100 g essbarer Anteil, angelehnt an
 * FoodData Central (USDA) / BLS 4.0. Kein Ersatz für ein lebensmittelspezifisches Laborprofil.
 * Die Berechnungen vergleichen ausschließlich Nährstoffmengen, nicht Bioverfügbarkeit.
 */
'use strict';
const NEM_FOOD_REF_URLS={
 bls:'https://blsdb.de/',
 usda:'https://fdc.nal.usda.gov/',
};
const NEM_FOOD_INFO={
 vitaminc:{label:'Vitamin C',unit:'mg'},
 magnesium:{label:'Magnesium',unit:'mg'},
 vitaminb6:{label:'Vitamin B6',unit:'mg'},
 calcium:{label:'Calcium',unit:'mg'},
 iron:{label:'Eisen',unit:'mg'},
 zinc:{label:'Zink',unit:'mg'},
 potassium:{label:'Kalium',unit:'mg'},
 vitamind:{label:'Vitamin D',unit:'µg'},
 vitaminb12:{label:'Vitamin B12',unit:'µg'},
 folate:{label:'Folat',unit:'µg'},
 vitaminE:{label:'Vitamin E',unit:'mg'},
 selenium:{label:'Selen',unit:'µg'},
};
/* Die Werte sind gerundete durchschnittliche Nährstoffmengen pro 100 g essbarem Anteil.
 * Teilweise starke Schwankungen durch Sorte, Saison, Lagerung, Zubereitung und Produkt.
 * Makronährstoffe, Allergene und alle Mineralstoffe eines Lebensmittels sind NICHT vollständig erfasst.
 */
const NEM_REFERENCE_FOODS=[
 {id:'orange',name:'Orange, frisch',max:450,default:150,allergens:[],n:{vitaminc:53,magnesium:10,vitaminb6:.06,folate:30,calcium:40,potassium:181}},
 {id:'pepper',name:'Paprika, rot, roh',max:300,default:100,allergens:[],n:{vitaminc:128,magnesium:12,vitaminb6:.291,folate:46,potassium:211}},
 {id:'kiwi',name:'Kiwi, frisch',max:300,default:100,allergens:[],n:{vitaminc:93,magnesium:17,vitaminb6:.063,folate:25,potassium:312}},
 {id:'broccoli',name:'Brokkoli, gegart',max:350,default:160,allergens:[],n:{vitaminc:65,magnesium:21,vitaminb6:.175,folate:108,calcium:40,potassium:293}},
 {id:'pumpkin',name:'Kürbiskerne',max:40,default:25,allergens:[],n:{magnesium:535,iron:8.8,zinc:7.8,vitaminb6:.143,potassium:809}},
 {id:'almonds',name:'Mandeln',max:40,default:30,allergens:['nuts'],n:{magnesium:270,calcium:269,iron:3.7,zinc:3.1,vitaminb6:.137,vitaminE:25.6,potassium:733}},
 {id:'oats',name:'Haferflocken',max:120,default:70,allergens:['gluten'],n:{magnesium:177,iron:4.7,zinc:3.9,vitaminb6:.119,folate:56,potassium:429}},
 {id:'chickpea',name:'Kichererbsen, gekocht',max:300,default:150,allergens:[],n:{magnesium:48,iron:2.9,zinc:1.5,vitaminb6:.139,folate:172,calcium:49,potassium:291}},
 {id:'lentils',name:'Linsen, gekocht',max:300,default:170,allergens:[],n:{magnesium:36,iron:3.3,zinc:1.3,vitaminb6:.178,folate:181,potassium:369}},
 {id:'banana',name:'Banane',max:310,default:120,allergens:[],n:{vitaminb6:.367,magnesium:27,vitaminc:8.7,folate:20,potassium:358}},
 {id:'salmon',name:'Lachs, gegart',max:220,default:120,allergens:['fish'],n:{vitamind:10,vitaminb12:3.2,magnesium:29,selenium:36,potassium:384}},
 {id:'milk',name:'Milch, 1,5 % Fett',max:500,default:250,allergens:['milk'],n:{calcium:120,vitaminb12:.45,magnesium:11,potassium:150}},
 {id:'kale',name:'Grünkohl, roh',max:125,default:100,allergens:[],n:{vitaminc:93,calcium:254,vitaminb6:.27,folate:62,magnesium:33,potassium:348}},
 {id:'egg',name:'Ei, gekocht',max:150,default:100,allergens:['eggs'],n:{vitamind:2,vitaminb12:.89,selenium:31,iron:1.8,zinc:1.1}},
 {id:'sunflower',name:'Sonnenblumenkerne',max:35,default:25,allergens:[],n:{vitaminE:35,magnesium:325,vitaminb6:1.34,zinc:5,iron:5.3,potassium:645}},
 {id:'beef',name:'Rindfleisch, mager, gegart',max:200,default:130,allergens:[],n:{vitaminb12:2.5,zinc:4.8,iron:2.6,selenium:25}},
];
function nemFoodTargets(entries){
 const targets={},notComparable=[];
 for(const e of entries){
  if(!e.kind){notComparable.push(`${e.name}: kein verlässlicher Lebensmittel-Mengenvergleich hinterlegt.`);continue;}
  const info=NEM_FOOD_INFO[e.kind];
  if(!info){if(e.kind==='omega3')notComparable.push('Omega-3: ALA, EPA und DHA dürfen nicht als gleichwertig zusammengefasst werden. Bitte die genaue Fettsäureform angeben.');
    else if(e.kind==='iodine')notComparable.push('Jod: Der Gehalt natürlicher Lebensmittel schwankt stark; daher noch keine belastbare Mengenalternative.');
    else notComparable.push(`${e.name}: noch keine geprüfte Lebensmittelauswahl hinterlegt.`);continue;
  }
  const amount=info.unit==='µg'?nemToMg(e)*1000:nemToMg(e);
  if(Number.isFinite(amount)&&amount>0)targets[e.kind]=(targets[e.kind]||0)+amount;
 }
 return {targets,notComparable:[...new Set(notComparable)]};
}
function nemFoodAvailable(foods=NEM_REFERENCE_FOODS){
 const blocked=new Set(Array.isArray(profile?.allergens)?profile.allergens:[]);
 return foods.filter(f=>!f.allergens.some(a=>blocked.has(a)));
}
function nemFoodEquiv(nutrient,target,available){
 const favorites={vitaminc:['orange','pepper','kiwi','broccoli'],magnesium:['pumpkin','almonds','oats'],vitaminb6:['banana','sunflower','pepper'],calcium:['milk','kale','almonds'],vitamind:['salmon','egg'],vitaminb12:['salmon','milk','egg']};
 return available.filter(f=>f.n[nutrient]>0).map(f=>({food:f,grams:100*target/f.n[nutrient]}))
   .filter(x=>Number.isFinite(x.grams)&&x.grams>0).sort((a,b)=>{
     const practical=x=>x.grams<=x.food.max?0:2;
     const preferred=favorites[nutrient]||[];
     const rank=x=>{const idx=preferred.indexOf(x.food.id);return idx<0?50:idx};
     return practical(a)-practical(b) || rank(a)-rank(b) || Math.abs(a.grams-a.food.default)-Math.abs(b.grams-b.food.default);
   }).slice(0,3);
}
function nemFoodNumber(n,precision=0){return Number(n).toLocaleString('de-DE',{minimumFractionDigits:0,maximumFractionDigits:precision});}
function nemFoodAmount(kind,val){const inf=NEM_FOOD_INFO[kind];return `${nemFoodNumber(val,inf.unit==='mg'&&val<10?2:1)} ${inf.unit}`;}
function nemFoodPractical(grams,food){return grams>food.max?'Hohe Menge – keine alltagstaugliche Portion':grams<=food.max?'Orientierungswert':'Nur rechnerisch'}
function nemFoodCombo(targets,available){
 const kinds=Object.keys(targets);
 if(kinds.length<2)return null;
 const portions=[25,40,60,80,100,120,150,180,200,250,300];
 const have={},chosen=[],used=new Set();
 for(const kind of kinds)have[kind]=0;
 for(let i=0;i<Math.min(5,available.length);i++){
  let best=null;
  for(const food of available){
   if(used.has(food.id))continue;
   for(const g of portions){if(g>food.max)continue;
    let gain=0,excess=0;
    for(const kind of kinds){
      const add=(food.n[kind]||0)*g/100, tgt=targets[kind];
      gain+=(Math.min(tgt,have[kind]+add)-Math.min(tgt,have[kind]))/tgt;
      excess+=Math.max(0,(have[kind]+add)/tgt-1)-Math.max(0,have[kind]/tgt-1);
    }
    // Priorisierung der zielgerechten Deckung, mit Abzug für große Portionen / starke Überschüsse.
    const score=gain-0.055*g/100-0.30*excess;
    if(score>0.045&&(!best||score>best.score))best={food,grams:g,score};
   }
  }
  if(!best)break;
  used.add(best.food.id);chosen.push(best);
  for(const kind of kinds)have[kind]+=(best.food.n[kind]||0)*best.grams/100;
  if(kinds.every(k=>have[k]>=targets[k]*.97))break;
 }
 return chosen.length?{chosen,have}:null;
}
function nemFoodEquivalentHtml(entries){
 const {targets,notComparable}=nemFoodTargets(entries);
 const kinds=Object.keys(targets);
 const blsFood=window.VeritasBLS?.recFoods();
 const available=nemFoodAvailable(Array.isArray(blsFood)&&blsFood.length>=30?blsFood:NEM_REFERENCE_FOODS);
 const blsActive=Array.isArray(blsFood)&&blsFood.length>=30;
 if(!kinds.length&&!notComparable.length)return '';
 let out='<section class="nemFoodPanel"><div class="nemFoodHeading"><h4 class="suppMiniTitle">🌿 Nährstoffe aus Lebensmitteln – Mengenvergleich</h4><span class="nemFoodTag">Rechnerische Orientierung</span></div>';
 out+=`<p class="muted">Welche essbaren Mengen liefern im Durchschnitt ungefähr so viel von den <strong>deklarierten Nährstoffen pro Tagesportion</strong>? Die Berechnung verwendet ${blsActive?'die lokal importierten BLS-4.0-Durchschnittswerte':'gerundete Orientierungswerte aus 16 Beispiellebensmitteln'}, keine Messwerte des konkreten Lebensmittels.</p>`;
 if(kinds.length){
  out+='<div class="nemFoodGrid">';
  for(const kind of kinds){
   const info=NEM_FOOD_INFO[kind],equivalents=nemFoodEquiv(kind,targets[kind],available);
   out+=`<div class="nemFoodNutrient"><div class="nemFoodNutrientHead"><strong>${html(info.label)}</strong><span>${html(nemFoodAmount(kind,targets[kind]))} pro Tagesportion</span></div>`;
   if(equivalents.length){
    out+='<ul class="nemFoodOptions">'+equivalents.map(({food,grams})=>{
     const amount=grams>40?Math.round(grams/5)*5:Math.round(grams);
     return `<li><strong>${html(food.name)}</strong><span>ca. ${nemFoodNumber(amount)} g</span>${grams>food.max?`<small class="nemFoodUnreal">${grams>food.max*3?'sehr große Menge – nur rechnerisch':'größer als typische Portion'}</small>`:''}</li>`;
    }).join('')+'</ul>';
   } else out+='<p>Keine passende Lebensmittelreferenz hinterlegt oder durch deine Allergieauswahl ausgeschlossen.</p>';
   out+='</div>';
  }
  out+='</div>';
  const combo=nemFoodCombo(targets,available);
  if(combo){
   out+='<div class="nemFoodCombo"><strong>🥗 Lebensmittel-Kombination für mehrere Nährstoffe</strong><p>Diese Mengen werden gemeinsam gezählt. Ein Lebensmittel kann dabei mehrere Nährstoffe gleichzeitig liefern:</p>';
   out+='<ul class="nemFoodComboFoods">'+combo.chosen.map(({food,grams})=>`<li>${html(food.name)} <strong>${nemFoodNumber(grams)} g</strong></li>`).join('')+'</ul>';
   out+='<div class="nemFoodCoverage">';
   for(const kind of kinds){const pct=Math.round(100*combo.have[kind]/targets[kind]);
    out+=`<div><div class="nemFoodCoverageLabel"><span>${html(NEM_FOOD_INFO[kind].label)}</span><strong>${Math.min(pct,999)} %</strong></div><div class="nemFoodMeter"><i style="width:${Math.min(100,pct)}%"></i></div><small>${html(nemFoodAmount(kind,combo.have[kind]))} von ${html(nemFoodAmount(kind,targets[kind]))}</small></div>`;
   }
   out+='</div>';
   if(kinds.some(k=>combo.have[k]<targets[k]*.9))out+='<p class="nemFoodCaution">Nicht alle Nährstoffe werden mit dieser Kombination erreicht. Fehlende Mengen werden nicht als gedeckt dargestellt.</p>';
   out+='</div>';
  }
 }
 if(notComparable.length)out+='<div class="nemFoodLimit"><strong>Noch nicht zuverlässig umrechenbar:</strong><ul>'+notComparable.map(t=>`<li>${html(t)}</li>`).join('')+'</ul></div>';
 if(Array.isArray(profile?.allergens)&&profile.allergens.length)out+='<p class="nemFoodNote">Wortbasierte Allergenhinweise wurden soweit möglich berücksichtigt; BLS führt keine vollständigen Allergenprofile. Das ist KEINE Allergenfreigabe. Verpackung und Kreuzkontakt prüfen.</p>';
 if(typeof healthConditions!=='undefined'&&healthConditions.includes('kidney'))out+='<p class="nemFoodCaution">Bei Niereninsuffizienz sind diese Lebensmittelmengen keine automatische Ernährungsempfehlung. Kalium-, Phosphat- und Eiweißgrenzen sind individuell und hier nicht vollständig berechnet.</p>';
 out+='<details class="nemFoodDetails"><summary>ⓘ Berechnung und Datenqualität</summary><p>Mengen = deklarierte Nährstoffmenge ÷ durchschnittlicher Gehalt je 100 g × 100. Das bedeutet nicht dieselbe Aufnahme im Körper. Natürliche Schwankungen, Lagerung, Zubereitung und Verdaulichkeit werden nicht individuell gemessen. Andere Nährstoffe, Salz, Kalorien, Kosten oder Nahrungsmengen einer gesamten Ernährung werden nicht vollständig bilanziert. Größere Mengen sind nur Rechenbeispiele und keine Verzehrempfehlung.</p><p>Referenzdaten: <a href="'+NEM_FOOD_REF_URLS.bls+'" target="_blank" rel="noopener noreferrer">Bundeslebensmittelschlüssel 4.0 (Max Rubner-Institut)</a> und <a href="'+NEM_FOOD_REF_URLS.usda+'" target="_blank" rel="noopener noreferrer">USDA FoodData Central</a>. Aktuelle Datenbasis wird oben ausgewiesen.</p></details>';
 return out+'</section>';
}
