'use strict';
/* Veritas v2.5 – kategoriespezifische, evidenzgebundene Alternativsuche.
   Keine Gesundheits- oder Preisfreigabe. Kein Upload von Gesundheitsprofilen. */
const ALT_FIELDS='code,product_name,product_name_de,brands,quantity,image_front_small_url,ingredients_text,ingredients_text_de,additives_tags,allergens_tags,traces_tags,nutriments,nova_group,nutriscore_grade,categories,categories_tags';
const ALT_CATEGORY_FALLBACK={
 quark:'quarks',joghurt:'yogurts',käse:'cheeses',schokolade:'chocolates',
 'fleisch/wurst':'meats',milch:'milks',brot:'breads','müsli/flocken':'breakfast-cereals',
 wasser:'waters',fruchtsaft:'fruit-juices',limonade:'soft-drinks','öl/fett':'oils',speiseöl:'oils',
 aufstrich:'chocolate-spreads','kekse/gebäck':'biscuits-and-cakes',
 'salzige snacks':'salty-snacks',fertiggericht:'prepared-meals',soße:'sauces'
};
const altRequests=new Map(); // cached only in this tab; at most 2 searches per deliberate click
const altContexts={single:null,compare:null};
const altEscape=s=>html(s);
const altValue=(p,k)=>compareNum(p.nutriments,k);
const altText=p=>String(p.ingredients_text_de||p.ingredients_text||'').toLowerCase();
const altName=p=>compareName(p);
const altKnownIngredients=p=>Boolean(altText(p).trim())||ingredientStatus(p).kind==='exempt'||!!oilDeclaration(p);
const altAdditiveConcerning=p=>[...additiveIds(p)].filter(id=>profile.additives.includes(id));
function altRelevantCategory(p){
 const tags=(Array.isArray(p.categories_tags)?p.categories_tags:[]).filter(x=>typeof x==='string'&&/^en:[a-z\d-]+$/.test(x));
 const broad=/^(foods|food|beverages|dairies|dairy-products|plant-based-foods-and-beverages|plant-based-foods|sweet-spreads|spreads|desserts|snacks|sugary-snacks|fermented-foods|breakfasts|sweetened-beverages|meals|chocolate-products)$/;
 const narrower=tags.filter(x=>!broad.test(x.slice(3))&&x.length<60);
 const group=compareGroup(p);
 if(group==='speiseöl')return 'oils';
 if(group==='quark'&&narrower.some(x=>x.includes('quark')))return narrower.findLast(x=>x.includes('quark')).slice(3);
 if(group==='aufstrich'&&/haselnuss|hazelnut|nutella|nudossi/i.test(altName(p)))return 'chocolate-spreads';
 if(group==='joghurt'&&narrower.some(x=>/yogurt|yoghurt/.test(x)))return narrower.findLast(x=>/yogurt|yoghurt/.test(x)).slice(3);
 if(narrower.length&&group)return narrower.at(-1).slice(3);
 return ALT_CATEGORY_FALLBACK[group]||null;
}
function altNormalize(p){
 if(!p||typeof p!=='object')return null;
 const code=normalizeCode(p.code||'');
 if(!isValidGTIN(code))return null;
 return mergeProductEvidence(code,p);
}
function altSameGroup(base,p){
 const x=compareGroup(base),y=compareGroup(p);
 if(x==='speiseöl'||y==='speiseöl')return x==='speiseöl'&&y==='speiseöl';
 if(x&&y)return x===y;
 const bt=base.categories_tags||[],pt=p.categories_tags||[];
 const common=bt.filter(t=>pt.includes(t)&&String(t).length>16&&!/foods|beverages|snacks|desserts|spreads|dairies/.test(t));
 return common.length>0;
}
async function altFetchProducts(base){
 const group=compareGroup(base),category=altRelevantCategory(base);
 if(!group||!category)throw new Error('Für diese Lebensmittelgruppe lässt sich noch keine zuverlässige Suche eingrenzen.');
 const key=group+':'+category;
 const hit=altRequests.get(key);
 if(hit && Date.now()-hit.time<20*60*1000)return hit.items;
 const params=new URLSearchParams({categories_tags_en:category,countries_tags_en:'germany',page_size:'35',page:'1',sort_by:'popularity_key',fields:ALT_FIELDS});
 const url='https://world.openfoodfacts.org/api/v2/search?'+params.toString();
 const response=await fetch(url,{headers:{Accept:'application/json'}});
 if(!response.ok)throw new Error(response.status===429?'Zu viele Suchanfragen. Bitte später erneut versuchen.':'Produktsuche momentan nicht erreichbar ('+response.status+').');
 const data=await response.json();
 if(!Array.isArray(data.products))throw new Error('Produktsuche lieferte keine auswertbaren Datensätze.');
 const seen=new Set();
 const items=data.products.map(altNormalize).filter(p=>{
  if(!p||seen.has(p.code)||!altSameGroup(base,p)||altName(p)==='Unbekanntes Produkt')return false;
  seen.add(p.code);
  return true;
 });
 altRequests.set(key,{time:Date.now(),items});
 return items;
}
function altPrice(p){
 const code=normalizeCode(p.code||'');const manual=localPrice(code),ref=REFERENCE_PRICES[code]||null;
 const val=manual||ref,parsed=parseQuantity(p);
 const amount=Number(val?.amount||parsed?.amount),price=Number(val?.price);
 const unit=val?.unit||parsed?.unit||'g';
 return {price:Number.isFinite(price)&&price>0?price:null,amount:Number.isFinite(amount)&&amount>0?amount:null,unit,source:manual?'Eigenpreis':ref?'historischer Richtpreis':'kein Preis',per100:(price>0&&amount>0)?price/amount*100:null};
}
function altPersonal(p){
 const h=compareHealth(p);
 const noAllergens=!!profile.allergens.length&&(!Array.isArray(p.allergens_tags)||(!p.ingredients_text_de&&!p.ingredients_text&&ingredientStatus(p).kind!=='exempt'));
 const noAdditives=!!profile.additives.length&&!altText(p)&&!p.additives_tags?.length;
 return {alerts:h.alerts,issues:h.issues,missing:noAllergens||noAdditives,critical:h.alerts.length>0};
}
function altNature(base,candidate){
 if(compareGroup(base)==='speiseöl'&&compareGroup(candidate)==='speiseöl'){
  const oa=oilInfo(base),ob=oilInfo(candidate),reasons=[];let score=0;
  if(!oa?.known||!ob?.known)return {score:0,reasons:['Ölart unklar – keine voreilige Empfehlung']};
  if(oa.oil.id===ob.oil.id){
   if(precaution.preferNatural&&(ob.extra||ob.cold)&&oa.refined){score+=3;reasons.push('Gleiche Ölart, aber nativ bzw. kaltgepresst statt raffiniert deklariert (kein gesicherter Gesundheitsvorteil)');}
  } else if(precaution.oilUse==='warm'){
   if(['linseed','walnut'].includes(oa.oil.id)&&!['linseed','walnut'].includes(ob.oil.id)){score+=2;reasons.push('Besser für warmes Kochen geeignet (Herstellerangaben trotzdem prüfen)')}
   if(['linseed','walnut'].includes(ob.oil.id))score-=3;
  }
  return {score,reasons};
 }
 const b=assessAuthenticity(base),c=assessAuthenticity(candidate);
 const rank={red:0,yellow:1,green:2,unknown:null};let score=0;const reasons=[];
 if(rank[b.level]!==null&&rank[c.level]!==null){
  if(rank[c.level]>rank[b.level]){score+=3;reasons.push('Weniger Merkmale von Nachahmung oder Aromatisierung');}
  if(rank[c.level]<rank[b.level])score-=3;
 }
 const bn=Number(base.nova_group),cn=Number(candidate.nova_group);
 if([1,2,3,4].includes(bn)&&[1,2,3,4].includes(cn)){
  if(cn<bn){score+=3;reasons.push('Geringerer NOVA-Verarbeitungsgrad: '+cn+' statt '+bn);}
  else if(cn>bn)score-=2;
 }
 const bp=ingredientPercentages(base),cp=ingredientPercentages(candidate);
 for(const k of Object.keys(bp).filter(k=>cp[k]!==undefined)){
  if(cp[k]>bp[k]+5){score+=2;reasons.push(k+': '+cp[k]+' % statt '+bp[k]+' %');break;}
  if(bp[k]>cp[k]+5)score-=1;
 }
 const composition=/süßungsmittel|acesulfam|sucralose|aspartam|vanille.aroma|\baroma\b|verdickungsmittel|guarkernmehl|\bstärke\b/i;
 const knownBasic=ingredientStatus(candidate).kind==='exempt';
 if(knownBasic&&composition.test(altText(base))){score+=3;reasons.push('Klassisches Grundprodukt statt einer aromatisierten oder angedickten Zubereitung');}
 const flavor=/\baroma\b|\baromen\b|aromastoff|vanillin|raucharoma/i;
 if(altText(base)&&altText(candidate)&&flavor.test(altText(base))&&!flavor.test(altText(candidate))){score++;reasons.push('Kein zugesetztes Aroma in der erfassten Zutatenliste');}
 // An unavailable list is never rewarded for seeming short or additive-free.
 return {score,reasons};
}
function altNutrition(base,p){
 if(compareGroup(base)==='speiseöl'&&compareGroup(p)==='speiseöl'){
  const a=oilInfo(base),b=oilInfo(p);let score=0,pros=[],cons=[],tested=0;
  if(a?.saturated!==null&&a?.saturated!==undefined&&b?.saturated!==null&&b?.saturated!==undefined){
    tested++;
    if(a.saturated>b.saturated+8){score=3;pros.push('Weniger gesättigte Fettsäuren: '+compareFormat(b.saturated)+' statt '+compareFormat(a.saturated))}
    else if(b.saturated>a.saturated+8){score=-3;cons.push('Mehr gesättigte Fettsäuren')}
  }
  return {score,pros,cons,tested,good:score>=3};
 }
 const bGrade=String(base.nutriscore_grade||'').toUpperCase();const cGrade=String(p.nutriscore_grade||'').toUpperCase();
 let score=0;let pros=[],cons=[],tested=0;
 if(/^[A-E]$/.test(bGrade)&&/^[A-E]$/.test(cGrade)){
  tested++;
  if(cGrade<bGrade){score+=3;pros.push('Besserer Nutri-Score: '+cGrade+' statt '+bGrade)}
  else if(cGrade>bGrade){score-=3;cons.push('Ungünstigerer Nutri-Score')}
 }
 const conditions=new Set(healthConditions);
 const metrics=[
  ['sugars','Zucker',.15,2,conditions.has('diabetes')||conditions.has('prediabetes')?1.2:1],
  ['salt','Salz',.20,.2,conditions.has('hypertension')?2:1],
  ['saturated-fat','gesättigte Fettsäuren',.18,1,conditions.has('cardiovascular')?2:1],
  ['fiber','Ballaststoffe',.22,1,1],
  ['proteins','Eiweiß',.15,2,compareGroup(base)==='quark'?1.2:0.5],
  ['carbohydrates','Kohlenhydrate',.20,3,conditions.has('diabetes')||conditions.has('prediabetes')?1.5:0],
  ['fat','Gesamtfett',.18,4,.8],
  ['energy-kcal','Kalorien',.12,25,.8]
 ];
 for(const [key,label,ratio,abs,weight] of metrics){
  if(weight===0)continue;
  const av=altValue(base,key),cv=altValue(p,key);
  if(av===null||cv===null)continue;
  tested++;
  const threshold=Math.max(abs,Math.abs(av)*ratio);
  const better=key==='fiber'||key==='proteins'?cv-av:av-cv;
  if(better>=threshold){score+=weight;pros.push(key==='fiber'||key==='proteins'?'Mehr '+label+': '+compareFormat(cv):'Weniger '+label+': '+compareFormat(cv));}
  else if(better<=-threshold){score-=weight;cons.push('Nachteil bei '+label);}
 }
 const good=pros.length>=2&&score>=1.9&&cons.length<=1 || pros.some(x=>x.startsWith('Besserer Nutri-Score'))&&score>=2&&cons.length===0;
 return {score,pros,cons,tested,good};
}
function altEvaluate(base,p){
 const nature=altNature(base,p),nutrition=altNutrition(base,p),personal=altPersonal(p);
 const bp=altPrice(base),cp=altPrice(p),sameUnit=bp.unit===cp.unit;
 const cheaper=sameUnit&&bp.per100!==null&&cp.per100!==null&&cp.per100<bp.per100*.95;
 const saving=cheaper?Math.round((1-cp.per100/bp.per100)*100):0;
 // Dietary warnings are never turned into reassuring endorsements.
 const risk=personal.critical||!!PRODUCT_RECALLS[p.code];
 const natural=altKnownIngredients(p)&&nature.score>=2&&!risk;
 const nutritious=nutrition.good&&!risk;
 return {p,nature,nutrition,personal,bp,cp,natural,nutritious,cheaper:!!cheaper&&!risk,saving,risks:risk};
}
function altSafeURL(v){try{let u=new URL(v);return u.protocol==='https:'?u.href:null}catch{return null}}
function altCard(v,mode){
 const p=v.p,code=p.code,src=altSafeURL(p.image_front_small_url),name=altEscape(altName(p)),brand=altEscape(p.brands||'');
 const pr=v.cp,category=[];
 if(v.natural)category.push('Naturnähere Rezeptur');
 if(v.nutritious)category.push('Günstigeres Nährwertprofil');
 if(v.cheaper)category.push(v.saving+' % günstiger je '+(pr.unit==='ml'?'Liter':'kg'));
 const reasons=[...v.nature.reasons,...v.nutrition.pros].slice(0,3);
 if(v.cheaper)reasons.unshift('Preis: '+compareMoney(pr.per100*10)+' / '+(pr.unit==='ml'?'l':'kg')+' statt '+compareMoney(v.bp.per100*10));
 const w=v.personal;
 const warning=w.alerts.length?'⚠ '+w.alerts.join(' · '):w.missing?'⚠ Allergen-/Meidungsdaten unvollständig – keine Entwarnung':'Etikett und mögliche Spuren immer selbst prüfen';
 const quantity=parseQuantity(p);
 const pricePart=pr.per100!==null?compareMoney(pr.per100*10)+' / '+(pr.unit==='ml'?'l':'kg')+' ('+pr.source+')':'Noch kein überprüfbarer Ladenpreis';
 const notes=category.length?category.map(x=>`<span class="altBadge">${altEscape(x)}</span>`).join(''):'<span class="altNeutral">Keine belegte Verbesserung in den geprüften Kriterien</span>';
 return `<article class="alternativeCard" data-alt-code="${code}">
  <div class="alternativeCardHead">${src?`<img src="${altEscape(src)}" loading="lazy" alt="Produktfoto" referrerpolicy="no-referrer">`:'<div class="altPlaceholder">◈</div>'}<div><strong>${name}</strong><small>${brand} · EAN ${code}</small><div class="altBadges">${notes}</div></div></div>
  ${reasons.length?`<ul class="altReasons">${reasons.map(x=>`<li>${altEscape(x)}</li>`).join('')}</ul>`:'<p class="muted">Zu wenige vergleichbare Vorteile belegt.</p>'}
  <div class="altPrice">${altEscape(pricePart)}</div>
  <form class="altSetPrice" data-alt-code="${code}"><label>Packungspreis (€)<input name="price" type="number" min="0.01" step="0.01" placeholder="Preis" value="${pr.source==='Eigenpreis'&&pr.price!==null?pr.price:''}" required></label><label>Inhalt (g / ml)<input name="amount" type="number" min="1" step="any" placeholder="Größe" value="${pr.amount??quantity?.amount??''}" required></label><button type="submit" class="secondary">Preis speichern</button></form>
  <p class="altSafety ${w.alerts.length?'altCritical':''}">${altEscape(warning)}</p>
  <div class="alternativeCardActions"><button type="button" class="secondary" data-alt-action="inspect" data-alt-code="${code}">Produkt prüfen</button><button type="button" class="secondary" data-alt-action="compare" data-alt-code="${code}">Vergleichen</button></div>
 </article>`;
}
function altRenderContext(mode){
 const ctx=altContexts[mode],el=$(mode==='single'?'alternativeSingleResults':'alternativeCompareResults');
 if(!ctx){el.innerHTML='';return}
 const base=ctx.base,pick=ctx.pick;
 const results=ctx.items.filter(p=>p.code!==base.code&&(!ctx.other||p.code!==ctx.other.code)).map(p=>altEvaluate(base,p)).filter(x=>!x.risks);
 const natural=results.filter(x=>x.natural).sort((a,b)=>b.nature.score-a.nature.score).slice(0,4);
 const nutrition=results.filter(x=>x.nutritious).sort((a,b)=>b.nutrition.score-a.nutrition.score).slice(0,4);
 const cheaper=results.filter(x=>x.cheaper).sort((a,b)=>b.saving-a.saving).slice(0,4);
 const unexplored=results.filter(x=>!x.natural&&!x.nutritious&&!x.cheaper).filter(x=>altKnownIngredients(x.p)).slice(0,4);
 const views={natural,nutrition,price:cheaper,other:unexplored};const cards=views[pick]||natural;
 
 const prev=altPrice(base),baseKnown=prev.per100!==null;
 el.innerHTML=`<div class="altReference"><strong>Ausgangspunkt:</strong> ${altEscape(altName(base))}${baseKnown?' · '+altEscape(compareMoney(prev.per100*10)+' / '+(prev.unit==='ml'?'l':'kg')):' · noch kein Preis erfasst'}</div>
 <div class="altFilters" role="group" aria-label="Art der Alternativen">
 ${[['natural','Naturnäher'],['nutrition','Nährwertprofil'],['price','Günstiger'],['other','Weitere']].map(([id,name])=>`<button type="button" data-alt-filter="${id}" class="${pick===id?'active':''}" aria-pressed="${pick===id}">${name} (${views[id].length})</button>`).join('')}
 </div>
 <div class="alternativeList">${cards.length?cards.map(v=>altCard(v,mode)).join(''):`<div class="altEmpty"><strong>Derzeit keine belegte Empfehlung</strong><p>${pick==='price'?'Für Preisempfehlungen müssen für Ausgangsprodukt und Alternative vergleichbare Preise vorliegen. Trage bei den Vorschlägen unter „Weitere“ den Ladenpreis ein.':'Bei den gefundenen Produkten fehlen ausreichende Angaben oder deutliche Vorteile. Das ist keine Aussage über alle Produkte auf dem Markt.'}</p></div>`}</div>
 <p class="altMethod">${altEscape(ctx.items.length)} Kandidaten aus der Kategorie-Suche geprüft. Auswahl ist begrenzt und möglicherweise unvollständig; keine Vollmarktabdeckung. ${pick==='price'?'Nur erfasste Preise zählen.':'„Naturnäher“ und „ernährungsphysiologisch günstiger“ sind verschiedene Kriterien.'} Persönliche Allergien/Meidungen werden nicht als sicher ausgeschlossen bescheinigt.</p>
 <div class="altPriceReference"><strong>Preis des Ausgangsprodukts</strong><form class="altSetBasePrice"><label>Preis (€)<input type="number" name="price" min="0.01" step="0.01" required value="${prev.source==='Eigenpreis'&&prev.price!==null?prev.price:''}" placeholder="z. B. 1,39"></label><label>Packungsgröße (g / ml)<input type="number" name="amount" min="1" step="any" required value="${prev.amount??''}"></label><button type="submit" class="secondary">Preis speichern</button></form><small>Falls keine Preise vorliegen, trage die Preise vom Supermarkt ein. Alle Preisangaben bleiben lokal auf dem Gerät.</small></div>`;
}
function altSetMessage(mode,msg,bad=false){const el=$(mode==='single'?'alternativeSingleResults':'alternativeCompareResults');el.innerHTML=`<p class="altMessage ${bad?'error':''}" role="status">${altEscape(msg)}</p>`;}
async function findAlternatives(mode,slot=null){
 const data=mode==='single'?(state.product&&state.productCode?{code:state.productCode,p:state.product}:null):compareSlots[slot];
 if(!data){altSetMessage(mode,'Bitte zuerst ein Produkt scannen oder laden.',true);return}
 const base=data.p,other=mode==='compare'?compareSlots[slot==='A'?'B':'A']?.p:null;
 altContexts[mode]=null;
 altSetMessage(mode,'Suche vergleichbare Produkte aus derselben Lebensmittelgruppe …');
 try{
  const found=await altFetchProducts(base);
  const items=found.filter(p=>p.code!==data.code&&(!other||p.code!==other.code));
  altContexts[mode]={base,other,slot,items,pick:'natural'};
  if(!items.length){altSetMessage(mode,'Keine ausreichend vergleichbaren Produkte gefunden. Bitte Zutaten- oder Kategorieangaben prüfen.');return}
  altRenderContext(mode);
 }catch(err){altSetMessage(mode,'Keine Alternativen geladen: '+(err?.message||'Unbekannter Abruffehler'),true)}
}
$('findAlternativesSingle').addEventListener('click',()=>findAlternatives('single'));
$('findAlternativesA').addEventListener('click',()=>findAlternatives('compare','A'));
$('findAlternativesB').addEventListener('click',()=>findAlternatives('compare','B'));
for(const mode of ['single','compare']){
 const el=$(mode==='single'?'alternativeSingleResults':'alternativeCompareResults');
 el.addEventListener('click',ev=>{
  const tab=ev.target.closest('[data-alt-filter]');if(tab){if(altContexts[mode]){altContexts[mode].pick=tab.dataset.altFilter;altRenderContext(mode)}return}
  const action=ev.target.closest('[data-alt-action]');if(!action)return;
  const code=action.dataset.altCode,ctx=altContexts[mode],product=ctx?.items.find(x=>x.code===code);
  if(!product)return;
  if(action.dataset.altAction==='inspect'){
   state.product=product;state.productCode=code;$('ean').value=code;render(product,code);
   if(mode==='single'){altContexts.single=null;altRenderContext('single')}
   $('result').scrollIntoView({behavior:'smooth',block:'start'});
  } else if(action.dataset.altAction==='compare'){
   const reference=ctx.base;
   compareSlots.A={code:reference.code,p:reference};compareSlots.B={code:product.code,p:product};
   previewComparisonSlot('A');previewComparisonSlot('B');renderComparison();openComparison();
   compareStatus('Alternative in den Vergleich übernommen. Preise gegebenenfalls aktualisieren.');
  }
 });
 el.addEventListener('submit',ev=>{
  const form=ev.target.closest('.altSetPrice,.altSetBasePrice');if(!form)return;ev.preventDefault();
  const ctx=altContexts[mode];if(!ctx)return;
  const candidate=form.matches('.altSetBasePrice')?ctx.base:ctx.items.find(x=>x.code===form.dataset.altCode);
  if(!candidate)return;
  const price=Number(form.elements.price.value),amount=Number(form.elements.amount.value),unit=parseQuantity(candidate)?.unit||'g';
  if(!Number.isFinite(price)||price<=0||!Number.isFinite(amount)||amount<=0)return;
  try{localStorage.setItem(VERITAS_PRICE_PREFIX+candidate.code,JSON.stringify({price,amount,unit,updated:new Date().toISOString().slice(0,10)}));}
  catch{altSetMessage(mode,'Preis konnte nicht gespeichert werden.',true);return}
  // After recording a price the user should immediately see a cheaper candidate when present.
  if(!form.matches('.altSetBasePrice'))ctx.pick='price';
  altRenderContext(mode);
  if(mode==='compare'&&compareSlots.A&&compareSlots.B){for(const slot of ['A','B'])updatePriceInputs(slot);renderComparison()}
 });
}
