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
 ['aufstrich',/brotaufstrich|nuss.nougat|erdnussbutter|marmelade|konfitüre|haselnussaufstrich|nutella|nudossi/],
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

/* Zutatenanteile werden aus ZUTATEN-Texten gelesen, nicht geschätzt. */
function ingredientLabel(raw){
 const t=String(raw||'').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g,'').replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u').replace(/ß/g,'ss');
 const known=[['Haselnüsse',/haselnuss|hazelnut/],['Erdbeeren',/erdbeer|strawberr/],['Himbeeren',/himbeer|raspberr/],['Kakao',/kakao|cocoa/],['Mandeln',/mandel|almond/],['Milch',/vollmilch|milch|milk/],['Tomaten',/tomat/],['Äpfel',/apfel|apfeln|apfelmus|apple/],['Orangen',/orange/],['Fleisch',/fleisch|meat/],['Kirschen',/kirsch|cherr/],['Erdnüsse',/erdnuss|peanut/],['Hafer',/hafer|oat/],['Aprikosen',/aprikos|apricot/],['Honig',/honig|honey/],['Kokos',/kokos|coconut/]];
 for(const [label,rx] of known)if(rx.test(t))return label;
 return null;
}
function ingredientPercentages(p){
 const txt=String(p.ingredients_text_de||p.ingredients_text||'');const result={};
 // Mengen vor der Zutatenbezeichnung: "36 % HASELNÜSSE"
 for(const m of txt.matchAll(/(?:^|[,;])\s*(\d{1,3}(?:[.,]\d+)?)\s*%\s*([a-zA-ZÄÖÜäöüß][a-zA-ZÄÖÜäöüß\s-]{2,35})/g)){
  const name=ingredientLabel(m[2]);const pct=Number(m[1].replace(',','.'));if(name&&pct<=100)result[name]=pct;
 }
 // "HASELNÜSSE (13 %)" und "Haselnüsse 13 %"
 for(const part of txt.split(/[,;]/)){
  const m=part.match(/([a-zA-ZÄÖÜäöüß][a-zA-ZÄÖÜäöüß\s-]{2,35}?)\s*(?:\(|\s)(\d{1,3}(?:[.,]\d+)?)\s*%\s*\)?/);
  if(m){const name=ingredientLabel(m[1]);const pct=Number(m[2].replace(',','.'));if(name&&pct<=100)result[name]=pct;}
 }
 return result;
}
function headIngredient(p){const text=String(p.ingredients_text_de||p.ingredients_text||'');return text?text.split(',')[0].trim():null}
function compareRecipe(a,b){
 const pa=ingredientPercentages(a.p),pb=ingredientPercentages(b.p);const common=Object.keys(pa).filter(k=>pb[k]!==undefined);
 const ranked=common.filter(k=>Math.abs(pa[k]-pb[k])>=1).sort((x,y)=>Math.abs(pb[y]-pa[y])-Math.abs(pb[x]-pa[x]));
 const same=common.filter(k=>Math.abs(pa[k]-pb[k])<1);
 let details=[];let winner=null,label='Kein klarer Rezepturvorteil';
 if(ranked.length){const key=ranked[0];winner=pa[key]>pb[key]?'A':'B';label='Mehr '+key+': Produkt '+winner;details.push(key+': '+compareFormat(pa[key],'%')+' (A) gegenüber '+compareFormat(pb[key],'%')+' (B).');}
 if(!common.length)details.push('Keine identische, bezifferte Hauptzutat bei beiden Produkten gefunden; Mengen dürfen nicht geschätzt werden.');
 if(same.length)details.push('Weitere gleich bezifferte Zutaten: '+same.join(', ')+'.');
 const ingA=headIngredient(a.p),ingB=headIngredient(b.p);
 if(ingA&&ingB)details.push('Erste Zutat: A – '+ingA+'; B – '+ingB+'. Zutaten sind nach Gewichtsanteil geordnet.');
 if(!a.ingredients||!b.ingredients)details.push('Mindestens eine vollständige Zutatenliste fehlt.');
 // Weiterverarbeitung kann man zusätzlich beurteilen, die Menge der Kernzutat bleibt separat.
 return {winner,label,detail:details.join(' '),quantA:pa,quantB:pb,firstA:ingA,firstB:ingB,common};
}
function compareQuickFacts(a,b,recipe){
 const facts=[];
 const k=recipe.common.find(x=>Math.abs(recipe.quantA[x]-recipe.quantB[x])>0.5);
 if(k){const w=recipe.quantA[k]>recipe.quantB[k]?'A':'B';facts.push('Produkt '+w+' enthält '+compareFormat(Math.abs(recipe.quantA[k]-recipe.quantB[k]),'Prozentpunkte')+' mehr '+k+'.')}
 for(const [name,key,unit,min] of [['Zucker','sugar','g',1],['gesättigte Fettsäuren','fatSat','g',0.5],['Energie','energy','kcal',15],['Gesamtfett','fat','g',2]]){
  const x=key==='fat'?compareNum(a.p.nutriments,'fat'):a[key],y=key==='fat'?compareNum(b.p.nutriments,'fat'):b[key];if(x===null||y===null||Math.abs(x-y)<min)continue;
  const winner=x<y?'A':'B';facts.push('Produkt '+winner+' enthält '+compareFormat(Math.abs(x-y),unit)+' weniger '+name+'.');
 }
 return facts;
}
function fatSources(p){const raw=String(p.ingredients_text_de||p.ingredients_text||'').toLowerCase();const map=[['Palmöl',/palmöl/],['Sonnenblumenöl',/sonnenblumenöl|öl \(sonnenblume\)/],['Salfett',/salfett|fett \(sal\)/],['Kokosfett',/kokosfett|kokosöl/],['Rapsöl',/rapsöl/],['Olivenöl',/olivenöl/],['Butter',/\bbutter\b/],['Kakaobutter',/kakaobutter/]];const found=map.filter(([label,rx])=>rx.test(raw)).map(([label])=>label);return found.length?found.join(', '):'Keine Fettart eindeutig erkannt';}
function compareNutrients(a,b,sameGroup){
 if(!sameGroup)return {winner:null,label:'Nur eingeschränkt vergleichbar',detail:'Keine sicher gemeinsame Produktgruppe ermittelt. Werte nebeneinander lesen, aber keinen Gesamtsieger ableiten.'};
 const pairs=[['Zucker','sugar',0.5,'low'],['gesättigte Fettsäuren','fatSat',0.5,'low'],['Salz','salt',0.15,'low'],['Ballaststoffe','fiber',1,'high'],['Energie','energy',20,'low'],['Gesamtfett','fat',2,'low'],['Kohlenhydrate','carbs',2,'low']];
 const prosA=[],prosB=[],equal=[],missing=[];
 for(const [label,key,threshold,dir] of pairs){const av=key==='fat'?compareNum(a.p.nutriments,'fat'):a[key],bv=key==='fat'?compareNum(b.p.nutriments,'fat'):b[key];if(av===null||bv===null){missing.push(label);continue}if(Math.abs(av-bv)<threshold){equal.push(label);continue}const winsA=dir==='low'?av<bv:av>bv;(winsA?prosA:prosB).push(label)}
 if(prosA.length&&prosB.length)return {winner:null,label:'Gemischtes Nährwertprofil',detail:'A hat Vorteile bei '+prosA.join(', ')+'. B hat Vorteile bei '+prosB.join(', ')+'. '+(missing.length?'Für '+missing.join(', ')+' fehlen vergleichbare Angaben.':'')};
 if(!prosA.length&&!prosB.length)return {winner:null,label:'Keine deutlichen Nährwertunterschiede',detail:'Die verfügbaren Werte sind ähnlich oder unvollständig.'};
 const winner=prosA.length?'A':'B';const n=prosA.length||prosB.length;
 return {winner:n>=3?winner:null,label:(n>=3?'Nährwerttendenz: Produkt '+winner:'Einzelne Nährwertvorteile: Produkt '+winner),detail:'Gemessene Unterschiede: '+(prosA.length?'A – '+prosA.join(', ')+'. ':'')+(prosB.length?'B – '+prosB.join(', ')+'. ':'')+(missing.length?'Fehlende Angaben: '+missing.join(', ')+'.':'')};
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

function renderComparison(){
 const container=$('compareResults');if(!compareSlots.A||!compareSlots.B){container.hidden=true;return}
 container.hidden=false;
 const a=compareValues(compareSlots.A.p),b=compareValues(compareSlots.B.p);
 if(compareSlots.A.code===compareSlots.B.code){container.innerHTML='<div class="compareOverall neutral"><h3>Dasselbe Produkt</h3><p>Bitte eine andere EAN für Produkt B verwenden.</p></div>';return}
 const sameGroup=!!(a.group&&b.group&&a.group===b.group);
 const recipe=compareRecipe(a,b),nutrients=compareNutrients(a,b,sameGroup),personalA=compareHealth(a.p),personalB=compareHealth(b.p);
 const recallA=PRODUCT_RECALLS[compareSlots.A.code],recallB=PRODUCT_RECALLS[compareSlots.B.code];
 let head='Vergleich mit Vor- und Nachteilen',body='Die Rezeptur kann bei einem Produkt besser zu deinem Wunsch nach naturnahen Zutaten passen, während Nährwerte für das andere sprechen.';
 if(!sameGroup){head='Produkte nur begrenzt vergleichbar';body='Die Produktgruppen sind nicht identisch oder nicht eindeutig erkannt. Daher gibt es keine pauschale Bewertung.'}
 else if(recipe.winner){head='Rezepturvorteil: Produkt '+recipe.winner;body='Die verglichene namensgebende Zutat ist in Produkt '+recipe.winner+' in höherem deklariertem Anteil enthalten. Das bedeutet nicht automatisch, dass dieses Produkt insgesamt gesünder ist.'}
 else if(nutrients.winner){head='Nährwerttendenz: Produkt '+nutrients.winner;body='Der Vorteil bezieht sich auf die verfügbaren Nährwertdaten – nicht auf Echtheit oder Herstellungsweise.'}
 if(recallA||recallB){body+=' ACHTUNG: Für mindestens eines der Produkte ist ein chargenabhängiger Produktrückruf bekannt. Ohne MHD-Abgleich keine Verzehrempfehlung!'}
 const fmt=(v,u='g')=>compareFormat(v,u),e=html;
 const highlight=(val,better)=>better?'<span class="compareBest">'+e(val)+'</span>':e(val);
 const row=(label,va,vb,preferred=null)=>`<tr><th scope="row">${e(label)}</th><td>${highlight(String(va),preferred==='A')}</td><td>${highlight(String(vb),preferred==='B')}</td></tr>`;
 const ingredientsRow=(label,av,bv,unit='g',direction=null,threshold=0)=>{let pref=null;if(sameGroup&&av!==null&&bv!==null&&direction&&Math.abs(av-bv)>threshold)pref=direction==='low'?(av<bv?'A':'B'):(av>bv?'A':'B');return row(label,fmt(av,unit),fmt(bv,unit),pref)};
 const quantityRows=Array.from(new Set([...Object.keys(recipe.quantA),...Object.keys(recipe.quantB)])).map(k=>ingredientsRow('Anteil '+k,recipe.quantA[k]??null,recipe.quantB[k]??null,'%',recipe.quantA[k]!==undefined&&recipe.quantB[k]!==undefined?'high':null,0.5)).join('');
 const first=(r)=>r||'Keine Zutatenliste';
 const sA=compareSlots.A.p._veritasSources||[],sB=compareSlots.B.p._veritasSources||[];
 const sourceLinks=(items)=>items.length?items.map(x=>x.url?`<a href="${e(x.url)}" rel="noopener" target="_blank">${e(x.name)} (${e(x.kind||'Quelle')}) ↗</a>`:e(x.name+' ('+(x.kind||'Quelle')+')')).join(' · '):'Keine Quelle belegt';
 const coverage=(p)=>{const n=p.nutriments||{};const fields=['energy-kcal_100g','fat_100g','saturated-fat_100g','carbohydrates_100g','sugars_100g','proteins_100g','salt_100g'];return fields.filter(key=>compareNum(n,key.replace('_100g',''))!==null).length};
 const htmlRisks=(res,label)=>`<p><strong>${label}:</strong> ${res.alerts.length?'<span class="compareRisk">'+e(res.alerts.join(' · '))+'</span>':'Keine bestätigten Treffer in den erfassten Daten – keine Entwarnung'}${res.issues.length?'<br>'+e(res.issues.join(' · ')):''}</p>`;
 const personal=!!(profile.allergens.length||profile.additives.length||healthConditions.length);
 const quick=compareQuickFacts(a,b,recipe);
 container.innerHTML=`
 ${recallA?recallHTML(compareSlots.A.code):''}${recallB?recallHTML(compareSlots.B.code):''}
 <div class="compareOverall ${recipe.winner?'':'neutral'}"><h3>${e(head)}</h3><p>${e(body)}</p></div>
 <div class="compareHighlights"><h3>Unterschiede auf einen Blick</h3>${quick.length?`<ul>${quick.map(x=>`<li>${e(x)}</li>`).join('')}</ul>`:'<p>Für einen Zahlenvergleich fehlen ausreichende Angaben.</p>'}</div>
 <div class="compareVerdicts"><article class="compareVerdict"><h4>🌰 Hauptzutaten und Rezeptur</h4><div class="compareWinner">${e(recipe.label)}</div><p>${e(recipe.detail)}</p></article><article class="compareVerdict"><h4>♡ Nährwertprofil</h4><div class="compareWinner">${e(nutrients.label)}</div><p>${e(nutrients.detail)}</p></article></div>
 <div class="compareData"><h3>Produktvergleich je 100 g</h3><div class="compareScroll"><table class="compareTable"><thead><tr><th>Eigenschaft</th><th>A: ${e(a.name)}</th><th>B: ${e(b.name)}</th></tr></thead><tbody>
 ${row('Erste Zutat',first(recipe.firstA),first(recipe.firstB))}${quantityRows}${row('Fettarten laut Zutatenliste',fatSources(a.p),fatSources(b.p))}
 ${ingredientsRow('Zucker',a.sugar,b.sugar,'g','low',0.5)}
 ${ingredientsRow('Kohlenhydrate',a.carbs,b.carbs,'g',null)}
 ${ingredientsRow('Gesamtfett',compareNum(a.p.nutriments,'fat'),compareNum(b.p.nutriments,'fat'),'g',null)}
 ${ingredientsRow('davon gesättigt',a.fatSat,b.fatSat,'g','low',0.5)}
 ${ingredientsRow('Energie',a.energy,b.energy,'kcal',null)}
 ${ingredientsRow('Eiweiß',compareNum(a.p.nutriments,'proteins'),compareNum(b.p.nutriments,'proteins'),'g',null)}
 ${ingredientsRow('Ballaststoffe',a.fiber,b.fiber,'g',null)}
 ${ingredientsRow('Salz',a.salt,b.salt,'g','low',0.15)}
 ${row('Nutri-Score',a.nutri||'Nicht bekannt',b.nutri||'Nicht bekannt')}
 ${row('NOVA',a.nova===null?'Nicht bekannt':a.nova,b.nova===null?'Nicht bekannt':b.nova)}
 ${row('Nachahmungsmerkmale',a.authHeading,b.authHeading)}
 ${row('Ausgeschriebene E-Nummern',a.ingredients?a.additives.size+' explizit erfasst':'Keine ausreichenden Daten',b.ingredients?b.additives.size+' explizit erfasst':'Keine ausreichenden Daten')}
 </tbody></table></div></div>
 <div class="compareIngredientLists"><article><h3>Zutaten A</h3><p>${e(a.ingredients||'Zutatenliste fehlt')}</p></article><article><h3>Zutaten B</h3><p>${e(b.ingredients||'Zutatenliste fehlt')}</p></article></div>
 <div class="compareProvenance"><h3>Quellen und Datenlücken</h3><p><strong>Produkt A:</strong> ${sourceLinks(sA)}. ${coverage(a.p)}/7 übliche Nährwertangaben erfasst.${!a.ingredients?' Zutaten fehlen.':''}</p><p><strong>Produkt B:</strong> ${sourceLinks(sB)}. ${coverage(b.p)}/7 übliche Nährwertangaben erfasst.${!b.ingredients?' Zutaten fehlen.':''}</p><p>Bei einzelnen EANs ergänzte Hersteller- oder Händlerdaten wurden zuletzt am 15.10.2026 geprüft. Sie sind nicht automatisch aktuell und können von neueren Rezepturen abweichen. Es gibt keinen vollständigen Live-Rückrufcheck.</p></div>
 ${personal?`<div class="compareSafety"><h3>⚠ Dein persönliches Prüfprofil</h3>${htmlRisks(personalA,'Produkt A')}${htmlRisks(personalB,'Produkt B')}<p>Keine medizinische Freigabe. Verpackung und individuelle Ernährungsvorgaben prüfen.</p></div>`:''}
 <p class="compareNote">${sameGroup?'Beide Produkte: '+e(a.group)+'.':'Produktgruppen nicht eindeutig gleich.'} Fehlende Werte werden nicht als null Gramm behandelt. Ein höherer Haselnussanteil ist ein Rezepturvorteil, kein Beleg für gesundheitliche Unbedenklichkeit. Die Ampel ist keine amtliche Qualitätsprüfung.</p>`;
}
function previewComparisonSlot(slot){const data=compareSlots[slot];if(!data)return;const p=data.p,el=$('comparePreview'+slot);el.replaceChildren();const pic=p.image_front_small_url||p.image_front_url;if(pic){try{const u=new URL(pic);if(u.protocol==='https:'){const img=new Image();img.src=u.href;img.alt='Produktbild';img.referrerPolicy='no-referrer';el.append(img)}}catch{}}
 const content=document.createElement('div');const title=document.createElement('strong');title.textContent=compareName(p);const caption=document.createElement('small');caption.textContent=[p.brands,'EAN '+data.code].filter(Boolean).join(' · ');content.append(title,caption);el.append(content);$('compareEan'+slot).value=data.code;}
function openComparison(){renderComparison();$('compareSection').hidden=false;$('compareSection').scrollIntoView({behavior:'smooth',block:'start'})}
function compareStatus(msg,bad=false){$('compareStatus').textContent=msg;$('compareStatus').classList.toggle('error',bad)}

async function loadComparisonSlot(slot,raw){
 const code=normalizeCode(raw);if(!['A','B'].includes(slot))return;
 if(!isValidGTIN(code)){compareStatus('Bitte eine gültige EAN für Produkt '+slot+' eingeben.',true);return}
 openComparison();compareStatus('Produkt '+slot+' wird geladen …');const btn=$('compareLoad'+slot);btn.disabled=true;
 try{
  const p=state.product&&state.productCode===code?mergeProductEvidence(code,state.product):await fetchProductDetailed(code);
  compareSlots[slot]={code,p};previewComparisonSlot(slot);renderComparison();compareStatus(compareSlots.A&&compareSlots.B?'Vergleich mit Quellen und Zutatenanteilen erstellt.':'Produkt '+slot+' geladen. Bitte zweites Produkt auswählen.');
  if(compareSlots.A&&compareSlots.B)$('compareResults').scrollIntoView({behavior:'smooth',block:'nearest'});
 }catch(err){
  // Leere Datensätze können über eine transkribierte Zutaten-/Nährwerttabelle ergänzt werden.
  compareSlots[slot]={code,p:mergeProductEvidence(code,{product_name_de:'Unbekanntes Produkt',code})};previewComparisonSlot(slot);renderComparison();compareStatus('Produkt '+slot+': '+err.message+' Über „Etikett ergänzen“ kannst du Daten manuell eintragen.',true);
 }finally{btn.disabled=false}
}
function showCompareEditor(slot){
 const data=compareSlots[slot];if(!data)return;const p=data.p,local=getLocalProduct(data.code)||{},n={...(p.nutriments||{}),...(local.nutriments||{})};const v=(key)=>n[key]??'';
 const editor=$('compareEdit');editor.hidden=false;
 editor.innerHTML=`<div class="section-head"><h3>Etikett für Produkt ${slot} ergänzen</h3><button type="button" class="iconBtn" id="closeCompareEdit" aria-label="Bearbeiten schließen">✕</button></div>
 <p>EAN ${html(data.code)} · Diese Ergänzung wird nur in diesem Browser gespeichert. Werte immer vom konkreten Etikett übernehmen; nicht schätzen.</p>
 <form id="compareEditForm" class="compareEditForm"><label>Produktname<input name="product_name_de" value="${html(local.product_name_de||p.product_name_de||p.product_name||'')}" maxlength="130"></label>
 <label class="editWide">Vollständige Zutatenliste<textarea name="ingredients_text_de" rows="3">${html(local.ingredients_text_de||p.ingredients_text_de||p.ingredients_text||'')}</textarea></label>
 ${[['sugars_100g','Zucker (g / 100 g)'],['fat_100g','Fett (g / 100 g)'],['saturated-fat_100g','Gesättigte Fettsäuren (g / 100 g)'],['carbohydrates_100g','Kohlenhydrate (g / 100 g)'],['proteins_100g','Eiweiß (g / 100 g)'],['salt_100g','Salz (g / 100 g)'],['energy-kcal_100g','Energie (kcal / 100 g)'],['fiber_100g','Ballaststoffe (g / 100 g)']].map(([k,label])=>`<label>${label}<input inputmode="decimal" type="number" name="${k}" min="0" step="any" value="${html(v(k))}"></label>`).join('')}
 <div class="editWide"><button type="submit" class="primary">Eigene Angaben speichern</button><button type="button" class="secondary" id="clearCompareEdit">Eigene Angaben löschen</button></div></form><p class="compareNote">Allergene werden durch manuelle Textangaben nicht automatisch als sicher ausgeschlossen eingestuft. Originalverpackung prüfen.</p>`;
 editor.scrollIntoView({behavior:'smooth',block:'start'});
 $('closeCompareEdit').onclick=()=>{editor.hidden=true};
 $('clearCompareEdit').onclick=async()=>{localStorage.removeItem(USER_PRODUCT_PREFIX+data.code);editor.hidden=true;await loadComparisonSlot(slot,data.code)};
 $('compareEditForm').onsubmit=(ev)=>{
  ev.preventDefault();const form=new FormData(ev.currentTarget),nutriments={};for(const k of ['sugars_100g','fat_100g','saturated-fat_100g','carbohydrates_100g','proteins_100g','salt_100g','energy-kcal_100g','fiber_100g']){const v=String(form.get(k)||'').replace(',','.');if(v.trim()&&Number.isFinite(Number(v))&&Number(v)>=0)nutriments[k]=Number(v)}
  const patch={product_name_de:String(form.get('product_name_de')||'').trim(),ingredients_text_de:String(form.get('ingredients_text_de')||'').trim(),nutriments,savedAt:new Date().toISOString().slice(0,10)};
  try{localStorage.setItem(USER_PRODUCT_PREFIX+data.code,JSON.stringify(patch));data.p=mergeProductEvidence(data.code,data.p);previewComparisonSlot(slot);renderComparison();editor.hidden=true;compareStatus('Etikett-Ergänzung für '+slot+' lokal gespeichert. Bitte auf Aktualität prüfen.')}catch{compareStatus('Lokale Speicherung nicht möglich.',true)}
 };
}
$('compareNav').addEventListener('click',openComparison);
$('closeCompare').addEventListener('click',()=>{$('compareSection').hidden=true;if(state.scanTarget)stopScanner()});
$('addToCompare').addEventListener('click',()=>{if(!state.product||!state.productCode)return;const slot=compareSlots.A&&!compareSlots.B?'B':!compareSlots.A?'A':'B';compareSlots[slot]={code:state.productCode,p:state.product};previewComparisonSlot(slot);renderComparison();openComparison();compareStatus('Aktuelles Produkt als '+slot+' übernommen.'+(slot==='A'?' Bitte das zweite Produkt hinzufügen.':''))});
for(const slot of ['A','B']){
 $('compareForm'+slot).addEventListener('submit',e=>{e.preventDefault();loadComparisonSlot(slot,$('compareEan'+slot).value)});
 $('compareScan'+slot).addEventListener('click',()=>{openComparison();state.scanTarget=slot;startScanner()});
 $('compareEdit'+slot).addEventListener('click',()=>showCompareEditor(slot));
}
