"use strict";
/* Veritas 2.6 – vorsorgeorientierte, nachvollziehbare Interpretation.
   Dies ist KEIN medizinischer Score, kein Laborbefund und keine Echtheitsgarantie. */
const PRECAUTION_KEY='veritas-precaution-v1';
const PRECAUTION_DEFAULT={preferNatural:true,oilUse:'general'};
function loadPrecaution(){
 try{const x=JSON.parse(localStorage.getItem(PRECAUTION_KEY)||'{}');return {preferNatural:x.preferNatural!==false,oilUse:['general','cold','warm'].includes(x.oilUse)?x.oilUse:'general'}}
 catch{return {...PRECAUTION_DEFAULT}}
}
let precaution=loadPrecaution();
function savePrecaution(){try{localStorage.setItem(PRECAUTION_KEY,JSON.stringify(precaution));return true}catch{return false}}
function applyPrecautionControls(){
 const box=document.getElementById('preferNatural');if(box)box.checked=precaution.preferNatural;
 const use=document.getElementById('oilUse');if(use)use.value=precaution.oilUse;
 const val=document.getElementById('precautionState');if(val)val.textContent=precaution.preferNatural?'Naturnähe hat bei vergleichbarem Nutzen Vorrang.':'Naturnähe wird angezeigt, aber nicht bevorzugt.';
}
const OIL_TYPES=[
 {id:'olive',label:'Olivenöl',rx:/\b(olivenöl|olive oil|aceite de oliva|olio di oliva)\b/i,unsaturated:'überwiegend einfach ungesättigte Fettsäuren',uses:['cold','warm'],note:'Natives Olivenöl extra ist eine eigene Qualitäts-/Verarbeitungskategorie. Polyphenolgehalt wird nicht aus dem Namen geschätzt.'},
 {id:'rapeseed',label:'Rapsöl',rx:/\b(rapsöl|canola oil|rapeseed oil)\b/i,unsaturated:'viel einfach ungesättigtes Fett und auch Omega-3-Fettsäuren (ALA)',uses:['cold','warm'],note:'Für starkes Erhitzen eignen sich ausdrücklich dafür bestimmte, geeignete raffinierte Öle oft besser als kaltgepresste Varianten.'},
 {id:'sunflower',label:'Sonnenblumenöl',rx:/\b(sonnenblumenöl|sunflower oil)\b/i,unsaturated:'typischerweise reich an mehrfach ungesättigten Fettsäuren; High-Oleic-Sorten haben ein anderes Fettprofil',uses:['cold'],note:'Für heißes Braten ist die High-Oleic-Variante oder ein dafür gekennzeichnetes Bratöl gesondert zu beurteilen.'},
 {id:'linseed',label:'Leinöl',rx:/\b(leinöl|leinsamenöl|flaxseed oil|linseed oil)\b/i,unsaturated:'reich an Omega-3-Fettsäure ALA',uses:['cold'],note:'Nicht zum heißen Braten. Kühl, lichtgeschützt und nach Öffnen zeitnah verwenden.'},
 {id:'walnut',label:'Walnussöl',rx:/\b(walnussöl|walnut oil)\b/i,unsaturated:'enthält mehrfach ungesättigte Fettsäuren',uses:['cold'],note:'Vor allem für kalte Speisen geeignet. Walnussallergie beachten.'},
 {id:'sesame',label:'Sesamöl',rx:/\b(sesamöl|sesame oil)\b/i,unsaturated:'enthält ungesättigte Fettsäuren',uses:['cold','warm'],note:'Je nach gerösteter, ungerösteter oder raffinierter Variante unterschiedlich. Sesamallergie beachten.'},
 {id:'coconut',label:'Kokosöl',rx:/\b(kokosöl|kokosfett|coconut oil)\b/i,unsaturated:'hoher Anteil gesättigter Fettsäuren',uses:['cold','warm'],note:'Natürlich gewonnen bedeutet hier nicht automatisch das günstigere Fettprofil.'},
 {id:'palm',label:'Palmöl',rx:/\b(palmöl|palmfett|palm oil)\b/i,unsaturated:'relativ hoher Anteil gesättigter Fettsäuren',uses:['cold','warm'],note:'Fettsäureprofil und Verarbeitung sind getrennt zu beurteilen.'},
 {id:'peanut',label:'Erdnussöl',rx:/\b(erdnussöl|peanut oil)\b/i,unsaturated:'vorwiegend ungesättigte Fettsäuren',uses:['cold','warm'],note:'Für hohe Brattemperaturen ist die raffinierte Variante je nach Produkt geeignet. Bei Erdnussallergie Vorsicht.'},
 {id:'soy',label:'Sojaöl',rx:/\b(sojaöl|soybean oil)\b/i,unsaturated:'enthält überwiegend ungesättigte Fettsäuren',uses:['cold','warm'],note:'Erhitzbarkeit hängt von Raffination und Produkt ab.'},
 {id:'corn',label:'Maiskeimöl',rx:/\b(maiskeimöl|corn oil)\b/i,unsaturated:'enthält überwiegend ungesättigte Fettsäuren',uses:['cold','warm'],note:'Verwendung hängt von Verarbeitung und Herstellerangaben ab.'}
];
function oilInfo(p){
 const name=String(p.product_name_de||p.product_name||'');
 const text=String(p.ingredients_text_de||p.ingredients_text||'');
 const namesFound=OIL_TYPES.filter(o=>o.rx.test(name));
 const ingFound=OIL_TYPES.filter(o=>o.rx.test(text));
 const sorted=[...new Set([...namesFound,...ingFound])];
 const oilSignal=/öl\b|oil\b|fett\b|pflanzenfett|huile\b|olio\b/i.test(name+' '+text);
 const excluded=/\b(margarine|butter|sauce|soße|dressing|mayonnaise|creme|käse|keks|salat mit|chips)\b/i.test(name);
 if(!oilSignal||excluded)return null;
 const ambiguous=/\b(mischöl|ölmischung|pflanzenöl|speiseöl|bratöl|frittieröl|fritieröl|gemischtes öl|würzöl)\b/i.test(name);
 const flavored=/aromatisiert|mit (knoblauch|chili|zitrone|trüffel|kräuter|aroma|gewürz)|flavou?red/i.test(name);
 const singleName=namesFound.length===1&&!ambiguous&&!flavored;
 const named=singleName?namesFound[0]:null;
 const oneSource=singleName&&ingFound.every(x=>x.id===named.id);
 const evidence=text?ingFound.length===1&&!ambiguous?'Etikett':'Datenlage gemischt':oneSource?'Bezeichnung (ohne Zutatenliste)':'Unvollständig';
 const extra=/\b(nativ(?:es|e|er)?\s+(?:olivenöl\s+)?extra|extra\s+virgin|virgin\s+extra)\b/i.test(name);
 const cold=/kaltgepresst|kaltextrahiert|cold[- ]pressed|cold extraction/i.test(name);
 const refined=/raffiniert|refined|raffin\w*/i.test(name);
 const ho=/high[- ]?oleic|hoch[- ]?oleisch|ölsäurereich/i.test(name);
 const extraction=extra?'nativ extra (Etikettbezeichnung)':cold?'kaltgepresst (Etikettbezeichnung)':refined?'raffiniert (Etikettbezeichnung)':ho?'High-Oleic (Etikettbezeichnung)':'Herstellung nicht angegeben';
 const n=p.nutriments||{};
 const sat=n['saturated-fat_100g'];
 return {known:!!named,oil:named,types:sorted,extraction,evidence,ambiguous:ambiguous||flavored||sorted.length>1,missingIngredients:!text.trim(),extra,cold,refined,ho,flavored, saturated:sat===null||sat===undefined||sat===''||!Number.isFinite(Number(sat))?null:Number(sat)};
}
function oilDeclaration(p){const o=oilInfo(p);return o&&o.known&&!o.ambiguous&&!p.additives_tags?.length&&!String(p.ingredients_text_de||p.ingredients_text||'').trim()?o:null;}
function assessPrecaution(p){
 const oil=oilInfo(p),ing=typeof ingredientStatus==='function'?ingredientStatus(p):null;
 const raw=String(p.ingredients_text_de||p.ingredients_text||'').trim(),name=String(p.product_name_de||p.product_name||'');
 const a=assessAuthenticity(p);
 const findings=[],uncertainties=[];
 const add=(title,body,type='fact')=>findings.push({title,body,type});
 if(oil){
  if(oil.known&&!oil.ambiguous){
   add('Ölart: '+oil.oil.label,oil.oil.unsaturated+'. '+oil.oil.note,'fact');
   add('Gewinnung / Bezeichnung',oil.extraction,'fact');
   if(oil.saturated!==null)add('Gesättigte Fettsäuren',new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(oil.saturated)+' g je 100 g laut Produktdatensatz. Für den Fettvergleich relevanter als die ähnlich hohen Kalorien aller Speiseöle.','fact');
   else uncertainties.push('Der genaue Gehalt gesättigter Fettsäuren ist für diese EAN nicht erfasst.');
   if(oil.missingIngredients)add('Keine Zutatenliste','Bei einem eindeutig benannten Öl aus nur einer Zutat kann ein Zutatenverzeichnis nach EU-Recht entfallen. Der Name erlaubt Hinweise auf die Ölart – keine Prüfung auf Beimischungen oder Reinheit.','context');
  }else{add('Ölrezeptur offen','Aus dem Namen oder der erfassten Zutatenliste ist kein sortenreines Öl zweifelsfrei belegbar. Zutaten, mögliche Beimischungen und Verarbeitung prüfen.','caution')}
  if(precaution.oilUse==='cold'&&oil.known)add('Nutzung: kalte Speisen',oil.oil.id==='linseed'?'Leinöl passt besonders für kalte Speisen; nicht erhitzen.':'Fettsäureprofil und Geschmack berücksichtigen; eine eindeutige gesundheitliche Rangfolge allein aus dem Öltyp wäre überzogen.','context');
  if(precaution.oilUse==='warm'){
   if(oil.known&&['linseed','walnut'].includes(oil.oil.id))add('Nicht zum heißen Braten empfohlen','Dieses empfindliche Öl wird vor allem kalt verwendet.','caution');
   else if(oil.known&&!oil.refined&&!oil.ho&&!oil.extra)uncertainties.push('Eignung für starkes Erhitzen ist ohne genaue Herstellungs-/Herstellerangaben nicht sicher bestimmbar.');
  }
  uncertainties.push('Aus einem Barcode folgen keine Aussagen zu Reinheit, Pestizidrückständen, Oxidationszustand oder tatsächlich gemessenen Fettsäuren.');
 }else{
  if(ing?.kind==='exempt'||ing?.kind==='possibly-exempt')add('Einfaches Grundprodukt möglich','Die fehlende Zutatenliste ist bei dieser Produktart nicht zwangsläufig ein Datenmangel. Naturnähe ist eine Rezepturtendenz, kein Nachweis der Herkunft oder Reinheit.','context');
  if(a.matches.some(m=>m.kind==='red'))add('Deklarierte Ersatzrezeptur','Zutat oder Produktart weicht von der klassischen Ausgangsware ab. Das ist nicht automatisch schädlich.','caution');
  else if(a.matches.some(m=>m.kind==='yellow'))add('Verarbeitungsmerkmale vorhanden','Der Eintrag nennt besondere Herstellung, Aromatisierung oder isolierte Rezepturbestandteile. Daraus ergibt sich nicht automatisch ein Gesundheitsrisiko.','context');
  else if(raw)add('Keine konkret erkannten Nachahmungsmerkmale','Die erfasste Zutatenliste enthält keine der definierten Ersatzmerkmale. Eine vollständig natürliche Herstellung ist dadurch nicht belegt.','fact');
  else if(ing?.kind==='missing')uncertainties.push('Ohne Zutatenverzeichnis und eindeutige Produktart lässt sich die Naturnähe nicht verlässlich beurteilen.');
 }
 const artificially=/präzisionsfermentation|precision fermentation|zellkultur|zellkultiviert|synthetisch|künstliches aroma|aromastoffe|hydrolysiertes pflanzenprotein|proteinisolat|modifizierte stärke/i.test(name+' '+raw);
 if(artificially)add('Herstellungs-/Rezepturhinweis','Ein technisches Verfahren oder ein isolierter Bestandteil ist ausdrücklich genannt. Herkunft, Reinheit und Langzeitwirkung einzelner Moleküle können daraus nicht bestimmt werden.','context');
 const n=p.nutriments||{};
 const nutrKeys=['proteins_100g','fiber_100g','saturated-fat_100g','sugars_100g','salt_100g'];
 if(nutrKeys.every(k=>n[k]==null))uncertainties.push('Keine ausreichenden Nährwertdaten zur ernährungsphysiologischen Einordnung.');
 uncertainties.push('Lange Verwendungsgeschichte bedeutet nicht automatisch Sicherheit. Fehlende Langzeitdaten beweisen keine Schädlichkeit.');
 return {oil,findings,uncertainties,principle:precaution.preferNatural?'Bei vergleichbarem Nutzen wird eine einfacher zusammengesetzte, weniger stark veränderte Rezeptur bevorzugt.':'Naturnähe wird getrennt gezeigt, ohne sie als Hauptkriterium zu bevorzugen.'};
}
function oilCompareAssessment(a,b){
 const oa=oilInfo(a),ob=oilInfo(b);
 if(!oa||!ob)return null;
 const lines=[];let preferred=null;let label='Öle nach Einsatz und Fettprofil auswählen';
 for(const [letter,o] of [['A',oa],['B',ob]]){
  if(o.known)lines.push('Produkt '+letter+': '+o.oil.label+'; '+o.extraction+'.');
  else lines.push('Produkt '+letter+': Ölart oder Mischung nicht ausreichend dokumentiert.');
 }
 if(oa.saturated!==null&&ob.saturated!==null){
  lines.push('Gesättigte Fettsäuren: '+oa.saturated.toLocaleString('de-DE')+' g (A) gegenüber '+ob.saturated.toLocaleString('de-DE')+' g (B) je 100 g.');
  const diff=Math.abs(oa.saturated-ob.saturated);
  if(diff>=8){preferred=oa.saturated<ob.saturated?'A':'B';label='Günstigeres Profil gesättigter Fette: '+preferred;}
 }else lines.push('Die genauen Fettprofile fehlen teilweise. Aus gleichen Kalorien folgt kein gleichwertiges Öl.');
 if(precaution.oilUse==='warm'){
  const unsuited=x=>x.known&&['linseed','walnut'].includes(x.oil.id);
  if(unsuited(oa)&&!unsuited(ob)&&ob.known){preferred='B';label='Für heißes Braten eher Produkt B prüfen';}
  else if(unsuited(ob)&&!unsuited(oa)&&oa.known){preferred='A';label='Für heißes Braten eher Produkt A prüfen';}
  lines.push('Erhitzbarkeit hängt von Raffination, Temperatur, Dauer und Herstellerangaben ab.');
 }else if(precaution.oilUse==='cold')lines.push('Für kalte Speisen sind Geschmack, Fettsäureprofil und Frische zentral.');
 if(precaution.preferNatural){
  const naturalRank=o=>o.known?(o.extra?3:o.cold?2:o.refined?1:0):null;
  const ra=naturalRank(oa),rb=naturalRank(ob);
  if(ra!==null&&rb!==null&&Math.abs(ra-rb)>=2)lines.push('Herstellung: '+(ra>rb?'A':'B')+' deklariert eine weniger stark aufbereitete Variante. Dies ist kein automatischer Gesundheitsvorteil.');
 }
 lines.push('Bei gleichem Öltyp kann ein Preisvergleich sinnvoll sein. Kalorien dienen nicht als Qualitätsrang.');
 if(!oa.known||!ob.known||oa.ambiguous||ob.ambiguous)preferred=null;
 return {preferred,label,lines,oa,ob};
}
function precautionHtml(p){
 const a=assessPrecaution(p),esc=s=>html(s);
 const rows=a.findings.map(f=>`<div class="precautionFinding ${f.type==='caution'?'precautionCaution':''}"><strong>${esc(f.title)}</strong><p>${esc(f.body)}</p></div>`).join('');
 return `${rows||'<p>Aus den vorhandenen Daten ist noch keine belastbare Einschätzung möglich.</p>'}<details class="precautionUnknown"><summary>Was bleibt unklar? (${a.uncertainties.length})</summary><ul>${a.uncertainties.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`;
}
function renderPrecaution(p){const el=document.getElementById('precautionResult');if(el)el.innerHTML=precautionHtml(p)}
function precautionCompareHtml(a,b){
 const oil=oilCompareAssessment(a,b),esc=s=>html(s);
 if(oil){return `<section class="comparePrecaution"><h3>🌿 Vorsorgebewertung für Speiseöle</h3><strong>${esc(oil.label)}</strong><ul>${oil.lines.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><small>Keine Freigabe zum Erhitzen oder Allergieverträglichkeit. Etikett- und Herstellerhinweise beachten.</small></section>`}
 const oa=assessPrecaution(a),ob=assessPrecaution(b);
 const fa=oa.findings.slice(0,2).map(x=>x.title).join('; ')||'Zu wenig Produktdaten',fb=ob.findings.slice(0,2).map(x=>x.title).join('; ')||'Zu wenig Produktdaten';
 return `<section class="comparePrecaution"><h3>🌿 Naturnähe und Körpernutzen im Vergleich</h3><div class="precautionPair"><div><strong>A</strong><p>${esc(fa)}</p></div><div><strong>B</strong><p>${esc(fb)}</p></div></div><small>Die Einzelbefunde ersetzen keine individuelle Gesundheitsprüfung und garantieren keine vollständige Zutatenkenntnis.</small></section>`;
}
