/* Veritas v2.7 — Nahrungsergänzungsmittel: Deklaration, Tagesdosis, Werbeversprechen.
 * Keine Medikamente, keine automatische medizinische Eignungsfreigabe.
 * Ohne bestätigte Hersteller-Tagesdosis keine Dosisbewertung.
 */
'use strict';
const SUPPLEMENT_STORAGE_PREFIX='veritas-supplement-label-v1:';
const NEM_REFS={
 eu:'https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/eu-register-health-claims_en',
 bfr:'https://www.bfr.bund.de/veroeffentlichung/tabelle-hoechstmengenempfehlungen-des-bfr/',
 mg:'https://www.bfr.bund.de/cm/343/hoechstmengenvorschlaege-fuer-magnesium-in-lebensmitteln-inklusive-nahrungsergaenzungsmitteln.pdf',
 b6:'https://www.bfr.bund.de/cm/343/aktualisierung-2024-hoechstmengenvorschlaege-fuer-vitamin-b6-in-lebensmitteln-inklusive-nahrungsergaenzungsmitteln.pdf',
 bvl:'https://www.bvl.bund.de/DE/Arbeitsbereiche/01_Lebensmittel/04_AntragstellerUnternehmen/13_FAQ/FAQ_OnlineShops/FAQ_OnlineShops_node.html'
};
// Bewusst nur verifizierte BfR-Höchstmengenvorschläge. KEINE gesetzlichen Grenzwerte / ULs.
const NEM_BFR_LEVELS={
 magnesium:{name:'Magnesium',mg:250,url:NEM_REFS.mg,note:'Hohe zusätzliche Magnesiumdosen können Durchfall auslösen. Bei eingeschränkter Nierenfunktion gesondert abklären.'},
 vitaminb6:{name:'Vitamin B6',mg:0.9,url:NEM_REFS.b6,note:'Langfristig hohe Vitamin-B6-Zufuhr kann die peripheren Nerven schädigen. Mehrere Präparate können sich addieren.'}
};
const NEM_NUTRIENTS=[
 ['magnesium',/\bmagnesium\b/i],
 ['vitaminb6',/\b(?:vitamin\s*b\s*6|pyridoxin|pyridoxal(?:-5-phosphat)?)\b/i],
 ['vitaminc',/\b(?:vitamin\s*c|ascorbinsäure)\b/i],
 ['vitamine',/\b(?:vitamin\s*e|tocopherol|tocopherolacetat)\b/i],
 ['vitamina',/\b(?:vitamin\s*a|retinol)\b/i],
 ['vitaminb1',/\b(?:vitamin\s*b\s*1|thiamin)\b/i],
 ['vitaminb2',/\b(?:vitamin\s*b\s*2|riboflavin)\b/i],
 ['vitaminb3',/\b(?:vitamin\s*b\s*3|niacin|nicotinamid)\b/i],
 ['vitamink',/\b(?:vitamin\s*k(?:\s*2)?|phyllochinon|menachinon)\b/i],
 ['vitamind',/\b(?:vitamin\s*d(?:\s*3)?|cholecalciferol|colecalciferol)\b/i],
 ['vitaminb12',/\b(?:vitamin\s*b\s*12|cobalamin|methylcobalamin)\b/i],
 ['iron',/\b(?:eisen|iron)\b/i],
 ['iodine',/\b(?:jod|iodine)\b/i],
 ['potassium',/\b(?:kalium|potassium)\b/i],
 ['selenium',/\b(?:selen|selenium)\b/i],
 ['copper',/\b(?:kupfer|copper)\b/i],
 ['manganese',/\b(?:mangan|manganese)\b/i],
 ['chromium',/\b(?:chrom|chromium)\b/i],
 ['zinc',/\b(?:zink|zinc)\b/i],
 ['omega3',/\b(?:omega\s*[- ]?3|epa|dha|alpha[- ]?linolensäure)\b/i],
 ['folate',/\b(?:folsäure|folat|folate)\b/i],
 ['calcium',/\b(?:calcium|kalzium)\b/i]
];
// Nur wenige dokumentierte Muster; Treffer = möglicher Bezug, niemals automatischer Zulässigkeitsbescheid.
const NEM_CLAIM_REFERENCES=[
 {kind:'magnesium',rx:/\b(?:muskelfunktion|muskeln|nervensystem)\b/i,example:'Magnesium trägt zu einer normalen Muskelfunktion bei.'},
 {kind:'vitaminc',rx:/\b(?:immunsystem|immunfunktion)\b/i,example:'Vitamin C trägt zu einer normalen Funktion des Immunsystems bei.'},
 {kind:'vitamind',rx:/\b(?:knochen|muskelfunktion|immunsystem)\b/i,example:'Vitamin D trägt zur Erhaltung normaler Knochen bei.'},
 {kind:'vitaminb6',rx:/\b(?:immunsystem|nervensystem|energiestoffwechsel)\b/i,example:'Vitamin B6 trägt zu einer normalen Funktion des Nervensystems bei.'},
 {kind:'calcium',rx:/\b(?:knochen|zähne)\b/i,example:'Calcium wird für die Erhaltung normaler Knochen benötigt.'}
];
const NEM_CURE_RX=/(?:\b(?:heilt|heilung|therapiert|behandelt|bekämpft|verhindert|verhütet)\b.{0,45}\b(?:diabetes|krebs|tumor|arthrose|demenz|infektion|bluthochdruck)\b|\b(?:gegen|bei)\s+(?:krebs|tumor|diabetes|demenz)\b|\b(?:krebs|diabetes|tumor|demenz)\b.{0,40}\b(?:heilen|behandeln|verhindern)\b)/i;
const NEM_UNVERIFIED_RX=/\b(?:detox|entgift|schlacken|wunder|anti[- ]?aging|stoffwechsel[- ]?booster|fettverbrennung|hormon[- ]?boost|testosteron\s*(?:steigern|erhöhen))\b/i;
const NEM_NATURAL_FOODS={
 magnesium:'Kürbiskerne, Vollkorn, Hülsenfrüchte und Nüsse liefern natürlich Magnesium.',
 vitaminc:'Paprika, Brokkoli, Zitrusfrüchte und Beeren sind natürliche Vitamin-C-Quellen.',
 vitaminb6:'Kartoffeln, Vollkornprodukte, Fisch und Hülsenfrüchte können Vitamin B6 liefern.',
 iron:'Hülsenfrüchte, Fleisch und Vollkornprodukte enthalten Eisen; die Aufnahme unterscheidet sich.',
 omega3:'Fetter Seefisch sowie Lein- und Walnussöl liefern unterschiedliche Omega-3-Fettsäuren. ALA ist nicht mit EPA/DHA gleichzusetzen.',
 calcium:'Milchprodukte und calciumreiche Mineralwässer können Calcium liefern.',
 zinc:'Kerne, Hülsenfrüchte, Fleisch und Käse liefern Zink.',
 iodine:'Jodiertes Speisesalz und manche Seefische liefern Jod. Bei Schilddrüsenerkrankungen individuell abklären.'
};
function nemClean(s,limit=3000){return String(s??'').slice(0,limit).trim()}
function nemRead(code){try{const d=JSON.parse(localStorage.getItem(SUPPLEMENT_STORAGE_PREFIX+code)||'null');return d && typeof d==='object' ? d : null}catch{return null}}
function nemSave(code,d){try{localStorage.setItem(SUPPLEMENT_STORAGE_PREFIX+code,JSON.stringify(d));return true}catch{return false}}
function nemIngredientName(name){const s=nemClean(name,100);return NEM_NUTRIENTS.find(x=>x[1].test(s))?.[0]||null}
function nemNumber(raw){const clean=nemClean(raw,40).replace(/\s/g,'').replace(',','.');if(!/^(?:\d{1,7}(?:\.\d{1,5})?|\.\d{1,5})$/.test(clean))return null;const number=Number(clean);return Number.isFinite(number)&&number>=0&&number<=1000000?number:null}
function nemParseLines(text){const entries=[],errors=[];for(const [i,line] of nemClean(text,6000).split(/\r?\n/).entries()){if(!line.trim())continue;const bits=line.split(';').map(x=>x.trim());if(bits.length!==3 || !bits[0]){errors.push(`Zeile ${i+1}: Name ; Menge ; Einheit erwartet.`);continue}const qty=nemNumber(bits[1]);const unit=bits[2].replace(/μ/g,'µ').toLowerCase();if(qty===null|| !['mg','µg','ug','g'].includes(unit)){errors.push(`Zeile ${i+1}: Menge oder Einheit ungültig. Nur mg, µg oder g; IE bitte separat umrechnen und auf dem Etikett prüfen.`);continue}entries.push({name:nemClean(bits[0],100),qty,unit:(unit==='ug'?'µg':unit),kind:nemIngredientName(bits[0])})}
return {entries,errors}}
function nemToMg(item){return item.unit==='g'?item.qty*1000:item.unit==='µg'?item.qty/1000:item.qty}
function nemFmt(value){return Number(value).toLocaleString('de-DE',{maximumFractionDigits:4})}
function nemIsSupplement(p){const terms=(String(p.product_name||'')+' '+String(p.product_name_de||'')+' '+String(p.categories||'')+' '+(p.categories_tags||[]).join(' ')+' '+String(p.generic_name_de||'')).toLowerCase();const group=/(?:food[-\s]?supplements?|dietary[-\s]?supplements?|nahrungsergänzung|vitaminpräparat|mineralstoffpräparat|supplement[s]?\b)/i.test(terms);const format=/(?:kapseln?|tabletten?|softgels?|brausetabletten?|multivitamin|omega[-\s]?3[-\s]?kapseln?)/i.test(terms);return group||format}
function nemCheckDoses(entries){
 const warnings=[],seen=[],totalByKind=new Map();
 for(const entry of entries){if(entry.kind)seen.push(entry.kind);if(NEM_BFR_LEVELS[entry.kind])totalByKind.set(entry.kind,(totalByKind.get(entry.kind)||0)+nemToMg(entry))}
 for(const [kind,mg] of totalByKind){const bfr=NEM_BFR_LEVELS[kind];if(mg>bfr.mg)warnings.push({kind:'danger',title:`${bfr.name}: über BfR-Höchstmengenvorschlag`,detail:`Insgesamt ${nemFmt(mg)} mg pro empfohlener Tagesportion laut deinen Angaben. BfR-Höchstmengenvorschlag für ein Nahrungsergänzungsmittel: ${nemFmt(bfr.mg)} mg. ${bfr.note} Dies ist keine gesetzliche Höchstgrenze. Mengen verschiedener Stoffverbindungen dürfen nur addiert werden, wenn jeweils der tatsächliche Nährstoffgehalt angegeben ist.`,url:bfr.url});
 else warnings.push({kind:'missing',title:`${bfr.name}: Wert innerhalb des geprüften BfR-Vorschlags`,detail:`Insgesamt ${nemFmt(mg)} mg pro Tagesportion gegenüber ${nemFmt(bfr.mg)} mg BfR-Höchstmengenvorschlag. Keine individuelle Sicherheitsfreigabe: Weitere Präparate können die gesamte Zufuhr erhöhen. Es zählt der deklarierte Nährstoffgehalt, nicht das Gewicht einer Trägerverbindung.`,url:bfr.url});
 }
 return {warnings,kinds:new Set(seen)}
}
function nemCheckClaims(claims,entries){const kinds=new Set(entries.map(x=>x.kind));return nemClean(claims,6500).split(/\r?\n/).filter(Boolean).slice(0,30).map(claim=>{const text=nemClean(claim,400);if(NEM_CURE_RX.test(text))return {kind:'danger',title:'Krankheitsbezogenes Heilungs- oder Behandlungsversprechen',detail:`„${text}“ – Gesundheitsbezogene Krankheitsversprechen sind für Lebensmittel besonders kritisch. Diese Aussage wird nicht als zulässig bestätigt.`,link:NEM_REFS.eu};
const possible=NEM_CLAIM_REFERENCES.find(ref=>kinds.has(ref.kind)&&ref.rx.test(text));if(possible)return {kind:'warn',title:'Möglicher Bezug zu einer zugelassenen Wirkstoffaussage',detail:`„${text}“ – Vergleichsbeispiel aus dem bekannten EU-Claim-Bereich: „${possible.example}“ Ob genau die verwendete Werbung zulässig ist, hängt unter anderem von Wortlaut, Nährstoffmenge und Verwendungsbedingungen ab und wurde nicht automatisiert bestätigt.`,link:NEM_REFS.eu};
if(NEM_UNVERIFIED_RX.test(text))return {kind:'warn',title:'Werbeversprechen nicht bestätigt',detail:`„${text}“ – Veritas findet dafür in seiner begrenzten lokalen Referenz keinen belastbar zugeordneten zulässigen Claim. Das ist keine Feststellung der Rechtswidrigkeit.`,link:NEM_REFS.eu};
return {kind:'missing',title:'Werbeaussage nicht automatisch zugeordnet',detail:`„${text}“ – Diese App enthält keinen vollständigen maschinenlesbaren Abgleich aller EU-Claims. Die Aussage muss anhand des amtlichen Registers und ihrer Bedingungen geprüft werden.`,link:NEM_REFS.eu};})}
function nemItem(title,detail,kind='missing',link=''){const klass=['danger','warn','missing','good'].includes(kind)?kind:'missing';return `<div class="suppNotice ${klass}"><strong>${html(title)}</strong><p>${html(detail)}</p>${link?`<small><a href="${html(link)}" target="_blank" rel="noopener noreferrer">Amtliche Grundlage ↗</a></small>`:''}</div>`}
const NEM_ALLERGEN_WORDS={
 milk:/\b(?:milch\w*|molke\w*|laktose|casein|kasein)\b/i,
 soybeans:/\b(?:soja\w*|soy\w*)\b/i,
 peanuts:/\b(?:erdnuss\w*|erdnüsse)\b/i,
 nuts:/\b(?:mandel\w*|haselnuss\w*|walnuss\w*|cashew\w*|pistazie\w*|schalenfrüchte)\b/i,
 gluten:/\b(?:gluten\w*|weizen\w*|dinkel\w*|roggen\w*|gersten?\w*|hafer\w*)\b/i,
 eggs:/\b(?:eier|eiprotein|eiklar|eigelb|egg)\b/i,
 'sesame-seeds':/\b(?:sesam\w*)\b/i,
 fish:/\b(?:fisch\w*|fish\w*)\b/i,
 crustaceans:/\b(?:krebstier\w*|garnelen?\w*)\b/i,
 mustard:/\b(?:senf\w*)\b/i,
 celery:/\b(?:sellerie\w*)\b/i,
 lupin:/\b(?:lupinen?\w*)\b/i
};
function nemAllergenEvidence(p,ingredients){const values=Array.isArray(profile?.allergens)?profile.allergens:[];const alerts=[];for(const type of values){const label=ALLERGENS.find(x=>x[0]===type)?.[1]||type;const fromTag=typeof allergenMatches==='function'&&ALLERGENS.some(x=>x[0]===type)&&allergenMatches(p.allergens_tags||[],ALLERGENS.find(x=>x[0]===type)).length;const fromText=ingredients&&NEM_ALLERGEN_WORDS[type]?.test(ingredients);if(fromTag||fromText)alerts.push({label,source:fromTag?'Datenbank-Allergenkennzeichnung':'Zutatenangabe'});}return alerts}
function nemIngredientNotes(text){
 const patterns=[
  [/\b(?:mikrokristalline?\s+cellulose|cellulose|e\s*460)\b/i,'Cellulose – Füll- oder Trägerstoff'],
  [/\b(?:magnesiumstearat|magnesiumsalze\s+der\s+speisefettsäuren|e\s*470b)\b/i,'Magnesiumstearat – Trenn- oder Gleitmittel'],
  [/\b(?:siliciumdioxid|siliziumdioxid|e\s*551)\b/i,'Siliciumdioxid – Rieselhilfe / Trennmittel'],
  [/\bmaltodextrin\b/i,'Maltodextrin – Füll- oder Trägerstoff'],
  [/\bgelatine\b/i,'Gelatine – oft Kapselhülle'],
  [/\b(?:aromen?|aromastoffe?)\b/i,'Aroma – Geschmacksgebung'],
  [/\b(?:süßungsmittel|sucralose|acesulfam|stevia|steviolglycoside)\b/i,'Süßungsmittel – Süßgeschmack'],
  [/\b(?:farbstoffe?|färbemittel)\b/i,'Farbstoff – Aussehen'],
  [/\b(?:füllstoffe?|trennmittel|überzugsmittel)\b/i,'Weitere deklarierte technologische Hilfsstoffe'],
 ];
 return patterns.filter(x=>x[0].test(text)).map(x=>x[1]);
}
function nemRenderReport(p,code,d){let body='';const parsed=nemParseLines(d?.nutrients||'');const entries=parsed.entries;const daily=nemClean(d?.dailyDose||'',120);const ingredients=nemClean(d?.ingredients||(p.ingredients_text_de||p.ingredients_text||''),3000);const claims=nemClean(d?.claims||'',6500);const selectedConditions=typeof healthConditions!=='undefined'?healthConditions:[];
 body+=`<div class="supplementLead"><span aria-hidden="true">🌱</span><div><strong>Analyse von Nahrungsergänzungsmitteln</strong><p>Getrennt vom Lebensmittel-Nutri-Score. Wir prüfen Tagesdosis, Werbeaussagen und den begründbaren Nutzen – nicht Arzneimittel.</p></div></div>`;
 const allergyWarnings=nemAllergenEvidence(p,ingredients);
 if(allergyWarnings.length)body+=nemItem('⚠ Persönlicher Allergen-Treffer',`In den verfügbaren Angaben erkannt: ${allergyWarnings.map(x=>x.label+' ('+x.source+')').join(', ')}. Originalverpackung und Spurenhinweise sorgfältig prüfen.`, 'danger');
 if(Array.isArray(profile?.allergens)&&profile.allergens.length&&!allergyWarnings.length)body+=nemItem('Allergieprofil: keine bestätigte Freigabe','Das Fehlen eines Treffers beweist nicht, dass das Nahrungsergänzungsmittel frei von ausgewählten Allergenen oder Spuren ist. Herstellerangaben prüfen.', 'missing');
 body+='<h4 class="suppMiniTitle">1. Dosierung & Zusatznutzen</h4>';
 if(!daily || entries.length===0)body+=nemItem('Tagesdosierung nicht ausreichend belegt','Für eine Dosisprüfung müssen die empfohlene Tagesportion und die Mengen der einzelnen Stoffe pro Tagesportion vom Etikett eingetragen werden. Werte je 100 g oder bloße Prozentangaben reichen nicht.','missing');
 else{
  body+=`<p class="muted">Empfohlene Hersteller-Tagesportion: <strong>${html(daily)}</strong>. Deklarierte Werte (manuell übertragen):</p><table class="suppDosageTable"><thead><tr><th>Stoff</th><th>Pro Tagesportion</th><th>Einordnung</th></tr></thead><tbody>${entries.map(x=>`<tr><td>${html(x.name)}</td><td>${nemFmt(x.qty)} ${html(x.unit)}</td><td>${x.kind?(NEM_BFR_LEVELS[x.kind]?'BfR-Abgleich möglich':'Kein geprüfter Richtwert integriert'):'Nicht zugeordnet'}</td></tr>`).join('')}</tbody></table>`;
  const dose=nemCheckDoses(entries);body+=dose.warnings.length?dose.warnings.map(w=>nemItem(w.title,w.detail,w.kind,w.url)).join(''):nemItem('Für diese Stoffe ist noch kein quantitativer Grenzwert integriert','Das bedeutet nicht, dass die Dosis unbedenklich ist. Veritas weist mangels geprüfter Vergleichswerte kein grünes Sicherheitsurteil aus.','missing');
  
  if(selectedConditions.includes('kidney')&&entries.some(x=>['magnesium','potassium','calcium','vitamind'].includes(x.kind)))body+=nemItem('Niereninsuffizienz: vor Einnahme fachlich abklären','Das Mittel enthält deklarierte Mineralstoffe oder Vitamin D, bei denen Menge und Nierenfunktion besonders berücksichtigt werden müssen. Eine individuelle Freigabe ist nicht möglich.','danger');
  if(selectedConditions.includes('hypertension')&&entries.some(x=>x.kind==='potassium'))body+=nemItem('Bluthochdruck: Kaliumpräparate gesondert prüfen','Besonders bei Einnahme bestimmter Blutdruckmedikamente kann zusätzliches Kalium problematisch sein. Veritas kennt keine Medikamente und kann Wechselwirkungen nicht ausschließen.','warn');
  if(entries.some(x=>x.kind==='iodine'))body+=nemItem('Jod: Schilddrüsenerkrankungen beachten','Jodpräparate können bei manchen Schilddrüsenerkrankungen ungeeignet sein. Ohne individuelle Angaben keine Freigabe.','warn');
  if(entries.some(x=>x.kind==='iron'))body+=nemItem('Eisen: zusätzlichen Bedarf nicht voraussetzen','Eisenpräparate sollten nicht allein wegen eines Werbeversprechens eingenommen werden. Ein nachgewiesener Bedarf und die Ursache sind entscheidend.','warn');
  const natural=entries.map(x=>x.kind).filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).slice(0,6).filter(x=>NEM_NATURAL_FOODS[x]);
  if(typeof nemFoodEquivalentHtml==='function')body+=nemFoodEquivalentHtml(entries);
 }
 body+='<h4 class="suppMiniTitle">2. Werbeversprechen prüfen</h4>';
 if(!claims)body+=nemItem('Keine Werbeaussagen hinterlegt','Bitte Werbeversprechen von der Packung oder Produktwerbung exakt in den Etikett-Editor übertragen. Aus dem Markennamen allein lässt sich deren Zulässigkeit nicht prüfen.','missing');
 else body+=nemCheckClaims(claims,entries).map(c=>nemItem(c.title,c.detail,c.kind,c.link)).join('');
 body+='<h4 class="suppMiniTitle">3. Rezeptur & offene Fragen</h4>';
 if(ingredients){body+=`<p><strong>Zutaten vom Etikett:</strong> ${html(ingredients)}</p>`;const ingredientNotes=nemIngredientNotes(ingredients);if(ingredientNotes.length)body+=nemItem('Deklarierte Hilfs- und Geschmacksstoffe',ingredientNotes.join(' · ')+'. Diese Stoffe erfüllen meist technische Funktionen; der Name allein belegt keine gesundheitliche Schädlichkeit.','warn');}
 else body+=nemItem('Zutatenverzeichnis nicht übermittelt','Hilfsstoffe, Allergene und die Herkunft einzelner Verbindungen bleiben offen. Keine Aussage zur vollständigen Natürlichkeit oder Allergenfreiheit.','missing');
 if(selectedConditions.includes('kidney')&&!entries.length)body+=nemItem('Nierenprofil: keine Freigabe möglich','Ohne die konkreten Mengen und Stoffe lässt sich eine Eignung bei eingeschränkter Nierenfunktion nicht beurteilen.','warn');
 body+='<h4 class="suppMiniTitle">Amtliche Nachschlagequellen</h4><div class="suppSourceLinks">'+[
  ['EU-Register für Health Claims',NEM_REFS.eu],['BfR-Höchstmengenvorschläge',NEM_REFS.bfr],['BVL: Anzeige ≠ Zulassung',NEM_REFS.bvl]
 ].map(([name,url])=>`<a href="${html(url)}" target="_blank" rel="noopener noreferrer">${html(name)} ↗</a>`).join('')+'</div>';
 body+='<p class="muted">Veritas kann weder Wirkungsversprechen vollständig rechtlich bewerten noch Produktreinheit, Qualität, Kontaminanten oder Langzeitverträglichkeit prüfen. Bei mehreren Präparaten können sich Tagesdosen addieren. Eine Meldung beim BVL ist keine Zulassung.</p>';
 $('supplementReport').innerHTML=body;
}
function renderSupplement(p,code){
 const mode=$('productMode').value;
 const supplement=mode==='supplement'||(mode==='auto'&&nemIsSupplement(p));
 const result=$('result');result.classList.toggle('isSupplement',supplement);$('supplementSection').hidden=!supplement;
 const sw=$('switchAnalysis');sw.hidden=false;sw.textContent=supplement?'Als Lebensmittel auswerten':'Als Nahrungsergänzungsmittel prüfen';
 if(!supplement){$('supplementEditor').hidden=true;return}
 const d=nemRead(code);
 if(d?.name)$('productName').textContent=d.name;
 $('summaryPills').innerHTML='<span class="pill">Nahrungsergänzungsmittel</span><span class="pill gray">Tagesdosis separat prüfen</span><span class="pill gray">Werbeversprechen-Check</span>';
 $('editSupplement').textContent=d?'✎ Etikettangaben bearbeiten':'✎ Angaben vom Etikett ergänzen';
 $('suppName').value=d?.name||((p.product_name_de||p.product_name||'').startsWith('Nahrungsergänzung –')?'':p.product_name_de||p.product_name||'');
 $('suppDailyDose').value=d?.dailyDose||'';
 $('suppNutrients').value=d?.nutrients||'';
 $('suppIngredients').value=d?.ingredients||p.ingredients_text_de||p.ingredients_text||'';
 $('suppClaims').value=d?.claims||'';
 $('supplementEditor').hidden=!!d;
 $('suppEditorStatus').textContent='';
 nemRenderReport(p,code,d);
}
$('editSupplement').addEventListener('click',()=>{const el=$('supplementEditor');el.hidden=!el.hidden;if(!el.hidden)el.scrollIntoView({behavior:'smooth',block:'nearest'})});
$('cancelSupplement').addEventListener('click',()=>$('supplementEditor').hidden=true);
$('switchAnalysis').addEventListener('click',()=>{if(!state.product)return;const is=$('result').classList.contains('isSupplement');$('productMode').value=is?'food':'supplement';render(state.product,state.productCode||$('ean').value)});
$('productMode').addEventListener('change',()=>{if(state.product)render(state.product,state.productCode||$('ean').value)});
$('supplementEditor').addEventListener('submit',event=>{event.preventDefault();if(!state.product||!state.productCode)return;const raw=$('suppNutrients').value;const parsed=nemParseLines(raw);if(parsed.errors.length){$('suppEditorStatus').textContent=parsed.errors.join(' ');return}const d={name:nemClean($('suppName').value,180),dailyDose:nemClean($('suppDailyDose').value,120),nutrients:nemClean(raw,6000),ingredients:nemClean($('suppIngredients').value,3000),claims:nemClean($('suppClaims').value,6500),savedAt:new Date().toISOString()};if(!nemSave(state.productCode,d)){$('suppEditorStatus').textContent='Speichern nicht möglich. Browser-Speicher überprüfen.';return}$('supplementEditor').hidden=true;render(state.product,state.productCode)});
