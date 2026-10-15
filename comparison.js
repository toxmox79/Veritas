'use strict';
/* Veritas: fairer 2-Produkt-Vergleich; absichtlich keine erfundene Universal-Gesundheitsnote. */
const compareSlots={A:null,B:null};
const COMPARE_FIELDS='code,product_name,product_name_de,brands,quantity,image_front_small_url,image_front_url,ingredients_text,ingredients_text_de,ingredients,additives_tags,allergens_tags,traces_tags,nutriments,nova_group,nutriscore_grade,categories,categories_tags';
const compareNum=(n,key)=>{const value=n?.[key+'_100g'];return value===undefined||value===null||value===''||!Number.isFinite(Number(value))?null:Number(value)};
const compareFormat=(n,unit='g')=>n===null?'Keine Angabe':new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(n)+' '+unit;
const compareName=p=>p.product_name_de||p.product_name||'Unbekanntes Produkt';
function compareGroup(p){
 const name=String(compareName(p)).toLowerCase();const category=String(p.categories||'').toLowerCase()+' '+(p.categories_tags||[]).join(' ').toLowerCase();
 const patterns=[
 ['käse',/käse|kaese|gouda|emmental|cheddar|mozzarella|cheese|pizzabelag|schmelzscheiben?/],
 ['joghurt',/joghurt|yogurt|yoghurt|skyr/],
 ['schokolade',/schokolade|schoko|chocolate|kakaohaltige fettglasur|praline/],
 ['fleisch/wurst',/fleisch|wurst|schinken|salami|schnitzel|frikadell|nugget|steak|burger|meat alternative/],
 ['milch',/\bmilch\b|milchdrink|milchersatz|pflanzendrink|haferdrink|sojadrink|almond milk/],
 ['brot',/brot|brötchen|toastbrot|knäckebrot|bread/],
 ['müsli/flocken',/müsli|muesli|haferflocken|granola|cornflakes|frühstücksflocken/],
 ['wasser',/mineralwasser|quellwasser|tafelwasser|water/],
 ['fruchtsaft',/fruchtsaft|direktsaft|fruchtnektar|fruchtsaftgetränk|orange juice|apple juice/],
 ['limonade',/limonade|cola|brause|softdrink|eistee|ice tea|energy drink/],
 ['öl/fett',/olivenöl|sonnenblumenöl|rapsöl|pflanzenöl|speiseöl|margarine|butter/],
 ['aufstrich',/brotaufstrich|nuss.nougat|erdnussbutter|marmelade|konfitüre/],
 ['kekse/gebäck',/keks|biskuit|cookie|waffel|rührkuchen|muffin/],
 ['salzige snacks',/chips|flips|salzstangen|knabber/],
 ['fertiggericht',/fertiggericht|lasagne|tiefkühlpizza|pizza|nudelgericht/],
 ['soße',/ketchup|mayonnaise|dressing|grillsauce|soße|sauce/]
 ];
 for(const [key,re] of patterns)if(re.test(name))return key;
 for(const [key,re] of patterns)if(re.test(category))return key;
 return null;
}
function compareValues(p){const n=p.nutriments||{};const a=assessAuthenticity(p);return {p,name:compareName(p),group:compareGroup(p),auth:a.level,authHeading:a.heading,nova:[1,2,3,4].includes(Number(p.nova_group))?Number(p.nova_group):null,nutri:/^[a-e]$/.test(String(p.nutriscore_grade||'').toLowerCase())?String(p.nutriscore_grade).toUpperCase():null,ingredients:String(p.ingredients_text_de||p.ingredients_text||'').trim(),additives:additiveIds(p),sugar:compareNum(n,'sugars'),salt:compareNum(n,'salt'),carbs:compareNum(n,'carbohydrates'),fatSat:compareNum(n,'saturated-fat'),fiber:compareNum(n,'fiber'),energy:compareNum(n,'energy-kcal')};}
function compareQuality(a,b){
 const data=[];const rank={green:0,yellow:1,red:2};
 if(rank[a.auth]!==undefined&&rank[b.auth]!==undefined){data.push({who:Math.sign(rank[b.auth]-rank[a.auth]),why:'Nachahmungsmerkmale: '+a.authHeading+' / '+b.authHeading})}
 if(a.nova!==null&&b.nova!==null)data.push({who:Math.sign(b.nova-a.nova),why:'Verarbeitung: NOVA '+a.nova+' / NOVA '+b.nova});
 const pos=data.filter(x=>x.who>0).length,neg=data.filter(x=>x.who<0).length;
 if(!data.length)return {winner:null,label:'Nicht beurteilbar',detail:'Angaben zu Rezeptur und Verarbeitungsgrad fehlen.'};
 if(pos&&neg)return {winner:null,label:'Unterschiedliche Stärken',detail:'Authentizitätsmerkmale und Verarbeitungsgrad sprechen für unterschiedliche Produkte. '+data.map(x=>x.why).join('; ')+'.'};
 if(!pos&&!neg)return {winner:null,label:'Keine erkennbare Differenz',detail:data.map(x=>x.why).join('; ')+'.'};
 const w=pos?'A':'B';return {winner:w,label:(data.length===1&&a.nova!==null&&b.nova!==null&& (rank[a.auth]===undefined||rank[b.auth]===undefined)?'Verarbeitung: Produkt ':'Bei der Rezeptur: Produkt ')+w,detail:(data.filter(x=>x.who!==0).map(x=>x.why).join('; '))+'. '+(data.length===1?'Nur ein vergleichbares Merkmal vorhanden.':'Die geprüften Merkmale widersprechen sich nicht.')};
}
function compareNutrients(a,b,sameGroup){
 if(!sameGroup)return {winner:null,label:'Nicht direkt vergleichbar',detail:'Unterschiedliche bzw. nicht sicher zugeordnete Lebensmittelgruppen. Nährwertzahlen stehen unten trotzdem nebeneinander.'};
 if(a.nutri&&b.nutri){const delta=a.nutri.charCodeAt(0)-b.nutri.charCodeAt(0);return {winner:delta<0?'A':delta>0?'B':null,label:delta===0?'Gleicher Nutri-Score':`Nährwertprofil: Produkt ${delta<0?'A':'B'}`,detail:`Nutri-Score ${a.nutri} gegenüber ${b.nutri}. Der Nutri-Score ist ein zusammengesetzter Nährwertindikator für den Vergleich ähnlicher Produkte; er bildet nicht alle gesundheitlichen Risiken ab.`}}
 const keys=[['sugar','Zucker',0.5,false],['salt','Salz',0.15,false],['fatSat','gesättigte Fettsäuren',0.5,false],['fiber','Ballaststoffe',1,true]];
 const matched=keys.flatMap(([k,name,threshold,higher])=>{if(a[k]===null||b[k]===null)return [];const diff=a[k]-b[k];if(Math.abs(diff)<threshold)return [{who:0,why:name}];return [{who:(diff<0?1:-1)*(higher?-1:1),why:name}]});
 // Verlässliches Urteil nur wenn zumindest zwei unabhängige Nährwertparameter vorliegen und keine widersprüchlichen Unterschiede.
 if(matched.length<2)return {winner:null,label:'Nährwertdaten unvollständig',detail:'Nutri-Score fehlt und weniger als zwei Nährwerte sind für beide Produkte vergleichbar.'};
 const pos=matched.filter(x=>x.who>0),neg=matched.filter(x=>x.who<0);
 if(pos.length&&neg.length)return {winner:null,label:'Gemischtes Nährwertprofil',detail:'Je nach Kriterium schneidet ein anderes Produkt besser ab: '+matched.filter(x=>x.who).map(x=>x.why).join(', ')+'.'};
 if(!pos.length&&!neg.length)return {winner:null,label:'Ähnliche verfügbare Nährwerte',detail:'Die verfügbaren Werte unterscheiden sich nicht deutlich.'};
 const w=pos.length?'A':'B';return {winner:w,label:'Nährwerttendenz: Produkt '+w,detail:'Ohne Nutri-Score nur ein begrenzter Vergleich von '+matched.map(x=>x.why).join(', ')+'. Weitere wichtige Nährwerte können fehlen.'};
}
function compareHealth(p){
 const alerts=[],issues=[];const id=additiveIds(p);const n=p.nutriments||{};const name=compareName(p);const txt=String(p.ingredients_text_de||p.ingredients_text||'').toLowerCase();const a=(p.allergens_tags||[]).map(x=>String(x).toLowerCase());
 for(const group of ALLERGENS.filter(x=>profile.allergens.includes(x[0]))){if(allergenMatches(p.allergens_tags,group).length)alerts.push('Allergen: '+group[1]);else if(allergenMatches(p.traces_tags,group).length)issues.push('Mögliche Spuren: '+group[1]);else if(!txt||!p.allergens_tags?.length)issues.push('Allergenstatus unklar: '+group[1])}
 for(const x of [...id].filter(x=>profile.additives.includes(x)))alerts.push('Persönlich gemieden: '+x.toUpperCase());
 const cond=new Set(healthConditions);
 if(cond.has('kidney')){
  const phos=[...id].filter(x=>/^e(?:338|339|340|341|343|450|451|452)$/.test(x));
  if(phos.length)alerts.push('Nierenerkrankung: Phosphatzusatz '+phos.map(x=>x.toUpperCase()).join(', '));
  issues.push('Nierenwerte (Phosphor/Kalium) häufig unbekannt; keine medizinische Freigabe');
 }
 if(cond.has('pku')&&(id.has('e951')||/phenylalaninquelle|aspartam/.test(txt)))alerts.push('PKU: Aspartam/Phenylalaninquelle');
 if(cond.has('celiac')&&a.some(x=>/gluten|wheat|rye|barley|spelt/.test(x)))alerts.push('Zöliakie: glutenhaltige Zutat erfasst');
 if(cond.has('celiac'))issues.push('Glutenfreiheit kann durch fehlende Treffer nicht bestätigt werden');
 if(cond.has('lactose')&&a.some(x=>/milk|milch/.test(x))&&!/laktosefrei|lactose.free/i.test(name+' '+txt))issues.push('Laktoseintoleranz: Milch als Allergen erfasst');
 if(cond.has('hypertension')&&compareNum(n,'salt')!==null&&compareNum(n,'salt')>1.5)alerts.push('Bluthochdruck: hoher Salzgehalt');
 if(cond.has('diabetes')||cond.has('prediabetes'))issues.push('Diabetes: Kohlenhydrate je Portion zählen; Zucker alleine reicht nicht');
 if(cond.has('gout'))issues.push('Gicht: Puringehalt aus diesen Etikettdaten nicht zuverlässig ableitbar');
 if(cond.has('reflux'))issues.push('Reflux: individuelle Auslöser sind nicht zuverlässig vorhersagbar');
 if(cond.has('cardiovascular')&&compareNum(n,'saturated-fat')!==null&&compareNum(n,'saturated-fat')>5)issues.push('Herz-Kreislauf: viele gesättigte Fettsäuren');
 return {alerts,issues};
}
function renderComparison(){const container=$('compareResults');if(!compareSlots.A||!compareSlots.B){container.hidden=true;return}
 container.hidden=false;const a=compareValues(compareSlots.A.p),b=compareValues(compareSlots.B.p),sameGroup=!!(a.group&&a.group===b.group);
 if(compareSlots.A.code===compareSlots.B.code){container.innerHTML='<div class="compareOverall neutral"><h3>Dasselbe Produkt</h3><p>Beide EANs sind identisch. Lade für Produkt B eine andere EAN.</p></div>';return}
 const q=compareQuality(a,b);const n=compareNutrients(a,b,sameGroup),personA=compareHealth(a.p),personB=compareHealth(b.p);
 let overallTitle='Kein eindeutiger Gesamtsieger',overallText='Die Ergebnisse sind unterschiedlich oder reichen nicht für eine zuverlässige allgemeine Empfehlung.';
 if(!sameGroup){overallText='Die Lebensmittel sind unterschiedlichen oder nicht sicher bestimmbaren Produktgruppen zugeordnet. Deshalb wird kein pauschal „gesünder“ vergeben.'}
 else if(q.winner&&n.winner&&q.winner===n.winner&&a.ingredients&&b.ingredients){overallTitle='Tendenz: Produkt '+q.winner;overallText='Für dieses Produkt sprechen sowohl die verfügbaren Rezeptur-/Verarbeitungsmerkmale als auch der Nährwertvergleich. Die persönliche gesundheitliche Eignung muss zusätzlich geprüft werden.'}
 else if(q.winner&&n.winner&&q.winner!==n.winner){overallText='Ein Produkt hat bei der Rezeptur Vorteile, das andere beim Nährwertprofil. Die Gewichtung hängt von deinen Zielen und gesundheitlichen Bedürfnissen ab.'}
 else if(q.winner||n.winner){overallTitle='Teilvorteil, kein pauschaler Sieger';overallText='In mindestens einem untersuchten Bereich ist '+(q.winner?'Produkt '+q.winner+' bei Rezeptur/Verarbeitung':'Produkt '+n.winner+' bei den Nährwerten')+' im Vorteil. Für ein Gesamturteil fehlt ausreichende Übereinstimmung.'}
 const htag=!!(profile.allergens.length||profile.additives.length||healthConditions.length);
 if(overallTitle.startsWith('Tendenz: Produkt ')){const target=overallTitle.endsWith('A')?personA:personB;if(target.alerts.length){overallTitle='Keine persönliche Produktempfehlung';overallText='Der rechnerische Favorit weist mindestens einen Treffer in deinem persönlichen Warnprofil auf. Prüfe die Warnungen vor dem Verzehr; es gibt deshalb keinen Gesamttipp.'}}
 const explainRisk=(res,label)=>`<p><strong>${label}:</strong> ${res.alerts.length?'<span class="compareRisk">'+html(res.alerts.join(' · '))+'</span>':'Keine Treffer in den erfassten Angaben – keine Entwarnung'}${res.issues.length?'<br><span>'+html(res.issues.join(' · '))+'</span>':''}</p>`;
 const row=(label,va,vb,opt={})=>`<tr><th scope="row">${html(label)}</th><td>${opt.aBest?'<span class="compareBest">':''}${html(String(va))}${opt.aBest?'</span>':''}</td><td>${opt.bBest?'<span class="compareBest">':''}${html(String(vb))}${opt.bBest?'</span>':''}</td></tr>`;
 const grade=s=>s||'Keine Angabe';
 const value=(v,u='g')=>compareFormat(v,u);
 const metrics=[['Energie',a.energy,b.energy,'kcal',null],['Fett',compareNum(a.p.nutriments,'fat'),compareNum(b.p.nutriments,'fat'),'g',null],['Eiweiß',compareNum(a.p.nutriments,'proteins'),compareNum(b.p.nutriments,'proteins'),'g',null],['Zucker',a.sugar,b.sugar,'g','low'],['Salz',a.salt,b.salt,'g','low'],['Gesättigte Fettsäuren',a.fatSat,b.fatSat,'g','low'],['Ballaststoffe',a.fiber,b.fiber,'g','high'],['Kohlenhydrate',a.carbs,b.carbs,'g',null]];
 const metricRows=metrics.map(([label,av,bv,unit,dir])=>{let aBest=false,bBest=false;if(sameGroup&&av!==null&&bv!==null&&dir){let thresh=label==='Salz'?.15:label==='Ballaststoffe'?1:.5;if(Math.abs(av-bv)>=thresh){aBest=dir==='low'?av<bv:av>bv;bBest=!aBest}}return row(label,value(av,unit),value(bv,unit),{aBest,bBest})}).join('');
 container.innerHTML=`<div class="compareOverall ${overallTitle==='Tendenz: Produkt A'||overallTitle==='Tendenz: Produkt B'?'':'neutral'}"><h3>${html(overallTitle)}</h3><p>${html(overallText)}</p></div>
 <div class="compareVerdicts"><article class="compareVerdict"><h4>🌿 Rezeptur & Verarbeitung</h4><div class="compareWinner">${html(q.label)}</div><p>${html(q.detail)}</p></article><article class="compareVerdict"><h4>♡ Nährwertprofil</h4><div class="compareWinner">${html(n.label)}</div><p>${html(n.detail)}</p></article></div>
 <div class="compareData"><h3>Direkter Vergleich je 100 g / 100 ml</h3><div class="compareScroll"><table class="compareTable"><thead><tr><th scope="col">Eigenschaft</th><th scope="col">A: ${html(a.name)}</th><th scope="col">B: ${html(b.name)}</th></tr></thead><tbody>
 ${row('Nutri-Score',grade(a.nutri),grade(b.nutri))}${row('Verarbeitungsgrad',a.nova===null?'Keine Angabe':'NOVA '+a.nova,b.nova===null?'Keine Angabe':'NOVA '+b.nova)}${row('Nachahmung',a.authHeading,b.authHeading)}${row('Deklarierte E-Nummern',a.ingredients||a.additives.size?a.additives.size:'Unvollständige Angaben',b.ingredients||b.additives.size?b.additives.size:'Unvollständige Angaben')}${metricRows}
 </tbody></table></div></div>
 ${htag?`<div class="compareSafety"><h3>⚠ Dein persönliches Prüfprofil</h3>${explainRisk(personA,'Produkt A')}${explainRisk(personB,'Produkt B')}<p><strong>Wichtig:</strong> Keine Treffer bedeuten nicht allergenfrei oder für deine Erkrankung geeignet. Warnungen sind keine ärztliche Freigabe. Prüfe immer die Originalverpackung.</p></div>`:''}
 <p class="compareNote">${sameGroup?'Produktgruppe: '+html(a.group)+'.':'Produkte nicht als gleiche Produktgruppe erkannt.'} Datenquelle: Open Food Facts. Fehlende Angaben werden nicht als Null gewertet. Der Nutri-Score ist ein vergleichender Nährwertindikator, kein Nachweis natürlicher Herstellung. Ein niedriger E-Nummern-Zähler ist kein Gesundheitsbeweis.</p>`;
}
function previewComparisonSlot(slot){const data=compareSlots[slot];if(!data)return;const p=data.p,el=$('comparePreview'+slot);el.replaceChildren();const pic=p.image_front_small_url||p.image_front_url;if(pic){try{const u=new URL(pic);if(u.protocol==='https:'){const img=new Image();img.src=u.href;img.alt='Produktbild';img.referrerPolicy='no-referrer';el.append(img)}}catch{}}
 const content=document.createElement('div');const title=document.createElement('strong');title.textContent=compareName(p);const caption=document.createElement('small');caption.textContent=[p.brands,'EAN '+data.code].filter(Boolean).join(' · ');content.append(title,caption);el.append(content);$('compareEan'+slot).value=data.code;}
function openComparison(){renderComparison();$('compareSection').hidden=false;$('compareSection').scrollIntoView({behavior:'smooth',block:'start'})}
function compareStatus(msg,bad=false){$('compareStatus').textContent=msg;$('compareStatus').classList.toggle('error',bad)}
async function loadComparisonSlot(slot,raw){const code=normalizeCode(raw);if(!['A','B'].includes(slot))return;if(!isValidGTIN(code)){compareStatus('Bitte eine gültige EAN für Produkt '+slot+' eingeben.',true);return}
 openComparison();compareStatus('Produkt '+slot+' wird geladen …');const btn=$('compareLoad'+slot);btn.disabled=true;
 try{
  let p=state.product&&state.productCode===code?state.product:null;
  if(!p){const url=`${OFF}/api/v3/product/${encodeURIComponent(code)}?fields=${encodeURIComponent(COMPARE_FIELDS)}`;const resp=await fetch(url,{headers:{Accept:'application/json'}});if(!resp.ok)throw Error('Produktabfrage fehlgeschlagen: HTTP '+resp.status);const data=await resp.json();if(!data.product||data.status===0||data.status==='failure')throw Error('Produkt nicht gefunden');p=data.product}
  compareSlots[slot]={code,p};previewComparisonSlot(slot);renderComparison();compareStatus(compareSlots.A&&compareSlots.B?'Vergleich für beide Produkte erstellt.':'Produkt '+slot+' geladen. Bitte das zweite Lebensmittel auswählen.');
  if(compareSlots.A&&compareSlots.B)$('compareResults').scrollIntoView({behavior:'smooth',block:'nearest'});
 }catch(err){compareStatus('Produkt '+slot+': '+err.message,true)}finally{btn.disabled=false}
}
$('compareNav').addEventListener('click',openComparison);
$('closeCompare').addEventListener('click',()=>{$('compareSection').hidden=true;if(state.scanTarget)stopScanner()});
$('addToCompare').addEventListener('click',()=>{if(!state.product||!state.productCode)return;const slot=compareSlots.A&&!compareSlots.B?'B':!compareSlots.A?'A':'B';compareSlots[slot]={code:state.productCode,p:state.product};previewComparisonSlot(slot);renderComparison();openComparison();compareStatus('Aktuelles Produkt als '+slot+' übernommen.'+(slot==='A'?' Bitte das zweite Produkt hinzufügen.':''))});
for(const slot of ['A','B']){
 $('compareForm'+slot).addEventListener('submit',e=>{e.preventDefault();loadComparisonSlot(slot,$('compareEan'+slot).value)});
 $('compareScan'+slot).addEventListener('click',()=>{openComparison();state.scanTarget=slot;startScanner()});
}
