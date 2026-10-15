 'use strict';
/* Ergänzungen aus konkret zugeordneten Produktseiten. Keine generelle Hersteller-Abfrage,
   keine automatische Rückrufüberwachung. Die Verpackung hat Vorrang. */
const VERIFIED_PRODUCTS = {
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
