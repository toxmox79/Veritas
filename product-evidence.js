 'use strict';
/* Ergänzungen aus konkret zugeordneten Produktseiten. Keine generelle Hersteller-Abfrage,
   keine automatische Rückrufüberwachung. Die Verpackung hat Vorrang. */
const VERIFIED_PRODUCTS = {
 '4311501125809': {
  product_name_de:'GUT&GÜNSTIG Speisequark Magerstufe 500 g', brands:'GUT&GÜNSTIG', quantity:'500 g',
  categories:'Speisequark, Magerquark, Frischkäse', allergens_tags:['en:milk'],
  nutriments:{'energy-kcal_100g':68,fat_100g:0.2,'saturated-fat_100g':0.1,carbohydrates_100g:4.1,sugars_100g:4.1,proteins_100g:12,salt_100g:0.1},
  _ingredientDeclaration:{kind:'legal-exemption', source:'Handelshof (Herstellerdaten, EAN-geprüft)',
   description:'Bei klassischem Speisequark kann ein Zutatenverzeichnis nach Artikel 19 der EU-Lebensmittelinformationsverordnung entbehrlich sein. Der Händler führt für diese EAN keine ausgeschriebene Zutatenliste auf. Das ist nicht gleichbedeutend mit unbekannter Produktart.',
   process:'Typische Herstellung: aus Milch, mit Milchsäurekulturen und ggf. Lab. Das ist eine Beschreibung der Produktart, keine bestätigte vollständige Zutatenliste dieses Artikels.'},
  _evidence:{name:'Handelshof – GUT&GÜNSTIG Speisequark mager (EAN 4311501125809)',url:'https://www.handelshof.de/eigenmarken/produkte/6627931002/gut-guenstig-speisequark-mager-500g-vlog',kind:'Herstellerdaten beim Händler',verified:'2026-10-15'}
 },
 '4337256368810': {
  product_name_de:'REWE Beste Wahl High Protein Quarkcreme Vanille 200 g',brands:'REWE Beste Wahl',quantity:'200 g',
  categories:'Quarkcreme, Speisequark, Milchdessert',allergens_tags:['en:milk'],
  ingredients_text_de:'Speisequark 50%, Joghurterzeugnis 40%, Wasser, Stärke, färbendes Karottenkonzentrat, Verdickungsmittel (Guarkernmehl), Süßungsmittel (Acesulfam K, Sucralose), natürliches Vanille-Aroma.',
  nova_group:4,nutriscore_grade:'a',
  nutriments:{'energy-kcal_100g':67,fat_100g:0.5,'saturated-fat_100g':0.4,carbohydrates_100g:3.2,sugars_100g:2.6,proteins_100g:12.4,salt_100g:0.14},
  _evidence:{name:'FoodDB – REWE Beste Wahl Quarkcreme (EAN geprüft)',url:'https://nutrifoodindex.com/product/high-protein-quarkcreme-4337256368810',kind:'Produktdatensatz (Sekundärquelle)',verified:'2026-10-15'}
 },
 '3017620422003': {
  product_name_de:'nutella',brands:'Ferrero',categories:'Nuss-Nougat-Creme, Haselnussaufstrich',
  ingredients_text_de:'Zucker, Palmöl, HASELNÜSSE (13 %), MAGERMILCHPULVER (8,7 %), fettarmer Kakao (7,4 %), Emulgator Lecithine (SOJA), Vanillin.',
  allergens_tags:['en:nuts','en:milk','en:soybeans'],
  nutriments:{'energy-kcal_100g':539,fat_100g:30.9,'saturated-fat_100g':10.6,carbohydrates_100g:57.5,sugars_100g:56.3,proteins_100g:6.3,salt_100g:0.107},
  _evidence:{name:'Nutella Deutschland – Herstellerangaben',url:'https://www.nutella.com/de/de/produkte/nutella',kind:'Hersteller',verified:'2026-10-15'}
 },
 '4018087009331': {
  product_name_de:'Nudossi Haselnuss-Nougat-Crème 36 % ohne Palmöl',brands:'Nudossi',quantity:'300 g',categories:'Nuss-Nougat-Creme, Haselnussaufstrich',
  ingredients_text_de:'Zucker, 36 % HASELNÜSSE, pflanzliches Öl (Sonnenblume), pflanzliches Fett (Sal), fettarmes Kakaopulver, MAGERMILCHPULVER, Emulgator: Sonnenblumenlecithine; Salz.',
  allergens_tags:['en:nuts','en:milk'],
  nutriments:{'energy-kcal_100g':579,fat_100g:39,'saturated-fat_100g':8.1,carbohydrates_100g:48,sugars_100g:47,proteins_100g:7.2,salt_100g:0.1},
  _evidence:{name:'Olial – Nudossi 300 g (EAN-bezogen)',url:'https://www.olial.de/produkt/nudossi-haselnuss-nougat-creme-300g/',kind:'Händlerangabe',verified:'2026-10-15'}
 }
};
/* Kein automatischer Preisfeed. Referenzpreise sind zuletzt gemeldete Werte,
   keine Liveangebote. Eigenpreise sind vorrangig und werden nur lokal gespeichert. */
const REFERENCE_PRICES = {
 '4311501125809': {price:1.39,amount:500,unit:'g',shop:'EDEKA',type:'Gemeldeter Vergleichspreis',seen:'15.10.2026',url:'https://www.supermarktcheck.de/product/435403-gutgUEnstig-speisequark-magerstufe-500g-500-g'},
 '4337256368810': {price:0.89,amount:200,unit:'g',shop:'REWE',type:'Gemeldeter Vergleichspreis',seen:'15.10.2026',url:'https://www.supermarktcheck.de/rewe/sortiment/high-protein-quarkcreme'}
};
const PRODUCT_RECALLS = {
 '4018087009331': {title:'Bestätigter Produktrückruf (Salmonellen)',detail:'Nudossi 300-g-Glas: Gläser mit MHD vom 01.08.2026 bis einschließlich 30.09.2026 wurden zurückgerufen. Betroffene Produkte NICHT verzehren. Bei einem anderen MHD trifft diese konkrete Rückrufmeldung nicht zu.',url:'https://www.vadossi.de/2026/06/15/produktrueckruf-fuer-nudossi-haselnuss-nougat-creme/',date:'2026-04-09'}
};
const USER_PRODUCT_PREFIX='veritas-user-product-v1:';
function getLocalProduct(code){try{const d=JSON.parse(localStorage.getItem(USER_PRODUCT_PREFIX+code)||'null');return d&&typeof d==='object'?d:null}catch{return null}}
function mergeProductEvidence(code,off){
 let out={...(off||{})},sources=[];
 if(off&&Object.keys(off).length)sources.push({name:'Open Food Facts',url:'https://world.openfoodfacts.org/product/'+encodeURIComponent(code),kind:'Community-Datenbank'});
 const verified=VERIFIED_PRODUCTS[code];
 if(verified){out={...out,...verified,nutriments:{...(out.nutriments||{}),...verified.nutriments},_evidence:verified._evidence};sources.unshift(verified._evidence)}
 const manual=getLocalProduct(code);
 if(manual){const n={};for(const [key,value] of Object.entries(manual.nutriments||{}))if(value!==null&&value!==''&&Number.isFinite(Number(value)))n[key]=Number(value);out={...out,...(manual.product_name_de?{product_name_de:manual.product_name_de}:{}),...(manual.ingredients_text_de?{ingredients_text_de:manual.ingredients_text_de}:{}),nutriments:{...(out.nutriments||{}),...n}};sources.unshift({name:'Eigene Etikett-Ergänzung (dieses Gerät)',kind:'Nutzereingabe',date:manual.savedAt||''})}
 out.code=code;out._veritasSources=sources;out._veritasManual=!!manual;
 return out;
}
function isSparseProduct(p){if(!p)return true;const n=p.nutriments||{};return !(p.ingredients_text_de||p.ingredients_text)||['sugars_100g','fat_100g','carbohydrates_100g'].filter(k=>n[k]!==undefined&&n[k]!==null).length<3}
async function fetchProductDetailed(code){
 const fields='code,product_name,product_name_de,brands,quantity,image_front_small_url,image_front_url,ingredients_text,ingredients_text_de,ingredients,additives_tags,allergens_tags,traces_tags,nutriments,nova_group,nutriscore_grade,categories,categories_tags';
 let p=null;
 try{const resp=await fetch('https://world.openfoodfacts.org/api/v3/product/'+encodeURIComponent(code)+'?fields='+encodeURIComponent(fields),{headers:{Accept:'application/json'}});if(resp.ok){const d=await resp.json();if(d.product&&d.status!=='failure'&&d.status!==0)p=d.product}}catch{}
 // Fallback für fehlende Community-Felder: v2 wird nur bei unvollständigem Datensatz abgefragt.
 if(isSparseProduct(p))try{const resp=await fetch('https://world.openfoodfacts.org/api/v2/product/'+encodeURIComponent(code)+'.json?fields='+encodeURIComponent(fields),{headers:{Accept:'application/json'}});if(resp.ok){const d=await resp.json();if(d.status===1&&d.product){const v=d.product;p={...(p||{}),...v,nutriments:{...(p?.nutriments||{}),...(v.nutriments||{})}}}}}catch{}
 const result=mergeProductEvidence(code,p);
 if(!p&&!VERIFIED_PRODUCTS[code]&&!getLocalProduct(code))throw Error('Für diese EAN fehlen Daten. Du kannst sie selbst anhand der Verpackung ergänzen.');
 return result;
}
function recallHTML(code){const r=PRODUCT_RECALLS[code];return !r?'':`<aside class="recallAlert" role="alert"><strong>⚠ ${escapeHtmlEvidence(r.title)}</strong><p>${escapeHtmlEvidence(r.detail)}</p><a href="${r.url}" target="_blank" rel="noopener">Rückruf beim Hersteller nachlesen ↗</a><small>EAN allein reicht nicht: Mindesthaltbarkeitsdatum auf dem Glas prüfen. Veritas besitzt keinen vollständigen Live-Rückrufdienst.</small></aside>`}
function escapeHtmlEvidence(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

/* Ein fehlendes Textfeld ist keine Aussage über die Zutaten: Lebensmittel ohne
   vorgeschriebenes Verzeichnis werden gesondert geführt. Nicht mit erfundenen
   Einzelzutaten befüllen; Sicherheitsprüfung bleibt bei Datenlücken vorsichtig. */
function ingredientStatus(p){
 const text=String(p.ingredients_text_de||p.ingredients_text||'').trim();
 if(text)return {kind:'listed',text,short:'Zutatenliste vorhanden',description:'Wortlaut aus der angegebenen Datenquelle. Verpackung bleibt maßgeblich.'};
 if(p._ingredientDeclaration?.kind==='legal-exemption')return {kind:'exempt',text:'',short:'Zutatenverzeichnis kann gesetzlich entfallen',description:p._ingredientDeclaration.description,process:p._ingredientDeclaration.process};
 const oil=typeof oilDeclaration==='function'?oilDeclaration(p):null;
 if(oil)return {kind:'possibly-exempt',text:'',short:'Einzutaten-Öl – Zutatenverzeichnis möglicherweise nicht erforderlich',description:'Die Verkehrsbezeichnung benennt '+oil.oil.label+'. Nach EU-Recht kann bei einem Lebensmittel aus nur einer eindeutigen Zutat das Zutatenverzeichnis entfallen. Ob genau diese Packung die Voraussetzungen erfüllt, lässt sich ohne Etikettansicht nicht abschließend bestätigen.',process:'Aus der Bezeichnung wird nur die Ölart abgeleitet. Beimischungen, Herkunft und Reinheit sind damit nicht geprüft.'};
 const n=String(p.product_name_de||p.product_name||'').toLowerCase().trim();
 const simple=/^(?:[\wÄÖÜäöüß&+.-]+\s+){0,3}(?:(?:bio[- ]?)?(?:speisequark|magerquark|naturquark)(?:\s+(?:magerstufe|natur|mager|500\s*g|250\s*g))?|(?:naturjoghurt)(?:\s+\d+(?:[,.]\d+)?\s*%?)?|(?:butter)(?:\s+(?:mildgesäuert|süßrahm))?)$/i.test(n.replace(/\d+\s?g$/,'').trim());
 if(simple && !(p.additives_tags||[]).length)return {kind:'possibly-exempt',text:'',short:'Zutatenverzeichnis möglicherweise nicht erforderlich',description:'Die Bezeichnung deutet auf ein einfaches Milcherzeugnis hin. Ob die gesetzlichen Voraussetzungen vorliegen, ist für diese EAN nicht unabhängig bestätigt.'};
 return {kind:'missing',text:'',short:'Keine Zutatenliste in den verfügbaren Daten',description:'Die Datenbank enthält kein Zutatenverzeichnis. Daraus lässt sich weder eine einfache noch eine komplexe Rezeptur beweisen.'};
}
