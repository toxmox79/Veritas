/* Veritas 2.9 – lokale BLS-4.0-Datenbank.
 * Unterstützt den Import der ORIGINALEN BLS_4_0_2025_DE.zip bzw. XLSX,
 * 7140 Lebensmittel, sämtliche Nährstoffspalten, Datenherkunft und Referenzen.
 * Keine EAN-Zuordnung: BLS-Einträge sind generische Lebensmittel, keine Markenprodukte.
 * Copyright BLS-Inhalte: Max Rubner-Institut (2025), CC BY 4.0.
 */
'use strict';
(()=>{
 const DB_NAME='veritas-bls4-v1',STORE='foods',META='meta';
 const source='Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 – Deutsche Nährstoffdatenbank. DOI: 10.25826/Data20251217-134202-0 · CC BY 4.0';
 const $=id=>document.getElementById(id);
 const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const kindPatterns={
  vitaminc:/^vitc$|\bvitamin c\b|\bascorbins?au?re\b/,
  magnesium:/^mg$|\bmagnesium\b/,
  vitaminb6:/^vitb6$|\bvitamin b6\b|\bvitamin b 6\b/,
  calcium:/^ca$|\bcalcium\b|\bkalzium\b/,
  iron:/^fe$|\beisen\b/,
  zinc:/^zn$|\bzink\b/,
  potassium:/^k$|\bkalium\b/,
  vitamind:/^vitd$|\bvitamin d\b(?!\s*2|\s*3)/,
  vitaminb12:/^vitb12$|\bvitamin b12\b|\bvitamin b 12\b/,
  folate:/^fol$|\bfolat\b|\bfolsaure\b/,
  vitaminE:/^vite$|\bvitamin e\b(?!\s*alpha)|\btocopherol[a-z]* aquivalent\b/,
  selenium:/^se$|\bselen\b/,
  protein:/^prot$|\beiwei\b|\bprotein\b/,
  sugar:/^sugar$|\bzucker gesamt\b/,
  energy:/^enercc$|^enerck$|\benergie kilokalorien\b/
 };
 const synonym=(label,code)=>{let s=norm(code+' '+label);for(const [k,re] of Object.entries(kindPatterns))if(re.test(s))return k;return null};
 let dbPromise=null,meta=null,summary=[];
 function dbOpen(){if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{
   const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{const d=req.result;d.createObjectStore(STORE,{keyPath:'id'});d.createObjectStore(META,{keyPath:'key'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });return dbPromise;}
 function request(req){return new Promise((ok,no)=>{req.onsuccess=()=>ok(req.result);req.onerror=()=>no(req.error)})}
 async function loadExisting(){const db=await dbOpen();const m=await request(db.transaction(META,'readonly').objectStore(META).get('manifest'));
  if(!m){meta=null;summary=[];return false}
  const items=await request(db.transaction(STORE,'readonly').objectStore(STORE).getAll());meta=m;
  summary=items.map(x=>({id:x.id,name:x.name,en:x.en,core:x.core||{}}));refresh();return true;
 }
 async function getFood(id){const db=await dbOpen();return request(db.transaction(STORE,'readonly').objectStore(STORE).get(id))}
 function dataStatus(t){const el=$('blsStatus');if(el)el.textContent=t}
 function refresh(){const txt=meta?`${meta.count.toLocaleString('de-DE')} Lebensmittel · ${meta.components.length} Nährstoffe · lokal gespeichert`:'Noch keine BLS-Daten importiert';
  for(const id of ['blsState','blsSettingsState']){const el=$(id);if(el)el.textContent=txt}
  const select=$('blsNutrient');if(select&&meta){select.innerHTML='<option value="">Lebensmittelnamen suchen</option>'+meta.components.map(c=>`<option value="${esc(c.idx)}">${esc(c.name)} (${esc(c.unit)})</option>`).join('')}
  if(meta){$('blsList')?.removeAttribute('hidden');}
 }
 // Native ZIP reading: supports stored and standard DEFLATE entries; ZIP64 intentionally rejected.
 function zipEntries(bytes){const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let eocd=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65558);i--){if(dv.getUint32(i,true)===0x06054b50){eocd=i;break}}if(eocd<0)throw Error('Keine gültige ZIP-Datei erkannt.');
  let count=dv.getUint16(eocd+10,true),off=dv.getUint32(eocd+16,true);const arr=[];const decode=new TextDecoder('utf-8');for(let i=0;i<count;i++){
   if(dv.getUint32(off,true)!==0x02014b50)throw Error('ZIP-Verzeichnis unvollständig.');
   const size=dv.getUint32(off+20,true),method=dv.getUint16(off+10,true),fl=dv.getUint16(off+28,true),ex=dv.getUint16(off+30,true),cm=dv.getUint16(off+32,true),start=dv.getUint32(off+42,true),name=decode.decode(bytes.subarray(off+46,off+46+fl));
   arr.push({name,size,method,start});off+=46+fl+ex+cm;
  }return arr;
 }
 async function zipFile(bytes,entry){const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);const p=entry.start;if(dv.getUint32(p,true)!==0x04034b50)throw Error('ZIP-Eintrag beschädigt: '+entry.name);
  const start=p+30+dv.getUint16(p+26,true)+dv.getUint16(p+28,true),slice=bytes.subarray(start,start+entry.size);
  if(entry.method===0)return slice;
  if(entry.method!==8)throw Error('ZIP-Kompressionsverfahren nicht unterstützt.');
  if(typeof DecompressionStream==='undefined')throw Error('Dein Browser unterstützt diesen ZIP-Import nicht. Bitte in aktuellem Chrome, Firefox oder Edge öffnen.');
  const stream=new Blob([slice]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
 }
 const decodeXml=s=>s.replace(/&#(x[0-9a-fA-F]+|\d+);|&(?:amp|lt|gt|quot|apos);/g,all=>{
   if(all.startsWith('&#')){const n=all.slice(2,-1);const value=n.startsWith('x')?parseInt(n.slice(1),16):parseInt(n,10);try{return String.fromCodePoint(value)}catch{return '?'}}
   return {'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"}[all]||all});
 const unzipTxt=async(bytes,parts,pred)=>{const ent=parts.find(x=>pred(x.name));if(!ent)throw Error('Fehlende Excel-Datei: '+pred.toString());return new TextDecoder('utf-8').decode(await zipFile(bytes,ent));};
 function indexCol(s){let n=0;for(const c of s)n=n*26+c.charCodeAt(0)-64;return n-1}
 function parseCells(inner,strings){const cells=[];const rx=/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;for(const match of inner.matchAll(rx)){
   const attr=match[1],body=match[2]||'',column=/\br="([A-Z]+)\d+"/.exec(attr),idx=column?indexCol(column[1]):cells.length,type=/\bt="([^"]+)"/.exec(attr)?.[1]||'',v=/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(body)?.[1];
   let value=null;
   if(type==='s'&&v!=null)value=strings[Number(v)]??'';
   else if(type==='inlineStr')value=decodeXml([...body.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(x=>x[1]).join(''));
   else if(type==='str'||type==='e')value=decodeXml(v||'');
   else if(v!=null){const n=Number(v);value=Number.isFinite(n)?n:decodeXml(v)}
   if(value!==null)cells[idx]=value;
  }return cells;
 }
 function toNumber(v){if(v===null||v===undefined||v===''||v==='-')return null;if(typeof v==='number')return Number.isFinite(v)?v:null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null}
  function toComponent(head,idx){let x=String(head||'').trim();if(!x)return null;if(/^hinweis$/i.test(x))return null;const match=/^([^\s]+)\s+(.+?)\s*\[([^\]]+)\]$/.exec(x);
   if(!match)return null;
   const code=match[1];const name=match[2];const unit=match[3].replace(/\s*\/\s*100\s*g/i,'').trim();return {idx,code,name,unit,kind:synonym(name,code)};
  }
 async function parseXlsx(bytes,onProgress){let entries=zipEntries(bytes);const sEntry=entries.find(e=>e.name==='xl/sharedStrings.xml');let strings=[];
  if(sEntry){onProgress('Gemeinsame Textwerte werden gelesen …');let sx=new TextDecoder('utf-8').decode(await zipFile(bytes,sEntry));
    strings=[...sx.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map(m=>decodeXml([...m[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(x=>x[1]).join('')));sx=null;
  }
  const ws=entries.find(e=>/xl\/worksheets\/sheet1.xml$/.test(e.name))||entries.find(e=>/xl\/worksheets\/sheet\d+.xml$/.test(e.name));if(!ws)throw Error('Kein Arbeitsblatt in Excel gefunden.');
  onProgress('Vollständige Nährstofftabelle wird gelesen …');let sheet=new TextDecoder('utf-8').decode(await zipFile(bytes,ws));
  let headers=null,components=[],rawFoods=[],rows=0;const rx=/<row\b[^>]*>([\s\S]*?)<\/row>/g;
  for(const match of sheet.matchAll(rx)){
   const cols=parseCells(match[1],strings);rows++;
   if(!headers){if(String(cols[0]||'').match(/BLS[ -]?Code/i)&&String(cols[1]||'').match(/Lebensmittel/i)){
      headers=cols;for(let i=3;i<headers.length;i+=3){const comp=toComponent(headers[i],i);if(comp)components.push(comp)}
     }continue;
   }
   const id=String(cols[0]||'').trim(),name=String(cols[1]||'').trim();if(!id||!name)continue;
   const values=[],origins=[],refs=[],core={};for(const comp of components){let j=comp.idx;const v=toNumber(cols[j]);values.push(v);origins.push(cols[j+1]??null);refs.push(cols[j+2]??null);if(v!==null&&comp.kind&&core[comp.kind]===undefined)core[comp.kind]=v;}
   rawFoods.push({id,name,en:String(cols[2]||''),values,origins,refs,core});
   if(rawFoods.length%500===0){onProgress(`${rawFoods.length.toLocaleString('de-DE')} Lebensmittel eingelesen …`);await new Promise(ok=>setTimeout(ok,0));}
  }
  sheet=null;strings=null;entries=null;
  if(!headers||components.length!==138||rawFoods.length!==7140)throw Error(`BLS-Import unvollständig: ${rawFoods.length} Lebensmittel und ${components.length} Nährstoffe erkannt. Erwartet: 7.140 bzw. 138. Bitte offizielle BLS-4.0-Hauptdatei wählen.`);
  return {components,rawFoods};
 }
 async function persist(components,rawFoods,origin){
  if(components.length!==138||rawFoods.length!==7140)throw Error('Unvollständiger BLS-Datensatz. Erwartet werden 7.140 Lebensmittel mit 138 Nährstoffkomponenten.');
  const db=await dbOpen();await new Promise((res,rej)=>{const tx=db.transaction([STORE,META],'readwrite');tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error||Error('Speicher voll / Datenbankimport abgebrochen'));
   tx.objectStore(STORE).clear();const fs=tx.objectStore(STORE);for(const f of rawFoods)fs.put(f);
   const ms=tx.objectStore(META);ms.put({key:'manifest',source,components,count:rawFoods.length,version:'4.0',imported:new Date().toISOString(),file:origin});
  });
  meta={components,count:rawFoods.length,source,file:origin};summary=rawFoods.map(({id,name,en,core})=>({id,name,en,core}));refresh();
 }
 async function exportPublished(){if(!meta)throw Error('Bitte zuerst den BLS importieren.');
  dataStatus('Exportpaket wird erstellt …');const db=await dbOpen(),foods=await request(db.transaction(STORE,'readonly').objectStore(STORE).getAll());
  const bytes=new TextEncoder().encode(JSON.stringify({version:'4.0',source,components:meta.components,foods}));
  if(typeof CompressionStream==='undefined')throw Error('Export benötigt einen aktuellen Browser mit CompressionStream (gzip).');
  const compressed=await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).blob();
  const u=URL.createObjectURL(compressed);const link=document.createElement('a');link.href=u;link.download='bls4-data.json.gz';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);
  dataStatus('Export bereit: bls4-data.json.gz auf GitHub Pages neben index.html hochladen. Danach wird die vollständige BLS-Datenbank für neue Nutzer automatisch geladen.');
 }
 async function tryPublished(){
  // Same-origin file, no third-party service. Only called when this browser has not imported BLS.
  try{const resp=await fetch('./bls4-data.json.gz',{cache:'no-store'});if(!resp.ok)return false;
   dataStatus('Veritas lädt die vollständige BLS-Datenbank einmalig herunter …');
   const stream=resp.body.pipeThrough(new DecompressionStream('gzip'));
   const doc=JSON.parse(await new Response(stream).text());
   if(doc.version!=='4.0'||!Array.isArray(doc.components)||!Array.isArray(doc.foods))throw Error('Datenformat nicht unterstützt.');
   await persist(doc.components,doc.foods,'öffentliche Veritas-BLS-Datei');
   dataStatus('BLS 4.0 automatisch eingerichtet – ab jetzt offline verfügbar.');return true;
  }catch(e){dataStatus('Automatischer BLS-Import nicht möglich: '+e.message);return false}
 }
 async function importFile(file){const arr=new Uint8Array(await file.arrayBuffer());let xlsx=arr;
  if(file.name.toLowerCase().endsWith('.zip')){dataStatus('Offizielles Archiv wird geöffnet …');const entries=zipEntries(arr);const pick=entries.find(e=>/BLS_4_0_Daten_.*\.xlsx$/i.test(e.name));if(!pick)throw Error('Im ZIP wurde die BLS-4.0-Hauptdatei nicht gefunden.');xlsx=await zipFile(arr,pick)}
  if(!file.name.toLowerCase().endsWith('.zip')&&!file.name.toLowerCase().endsWith('.xlsx'))throw Error('Bitte die offizielle ZIP- oder XLSX-Datei auswählen.');
  const {components,rawFoods}=await parseXlsx(xlsx,dataStatus);dataStatus('Validiert: '+rawFoods.length+' Lebensmittel, '+components.length+' Nährstoffe. Lokales Speichern …');
  await persist(components,rawFoods,file.name);
  dataStatus(`Erfolgreich: ${rawFoods.length.toLocaleString('de-DE')} Lebensmittel und ${components.length} Nährstoffe dauerhaft lokal gespeichert.`);
  if(typeof state!=='undefined'&&state.product&&$('result')?.classList.contains('isSupplement'))try{render(state.product,state.productCode||'')}catch(e){console.warn(e)}
 }
 function estimatedAllergen(food){const t=norm(food.name);const found=[];
  if(/milch|quark|joghurt|kaese|kase|butter|sahne|molke/.test(t))found.push('milk');
  if(/weizen|roggen|gerste|hafer|dinkel|grunkern|gries|brot|nudel/.test(t))found.push('gluten');
  if(/erdnuss/.test(t))found.push('peanuts');
  if(/mandel|walnuss|haselnuss|cashew|pekannuss|pistazie|macadamia|paranuss/.test(t))found.push('nuts');
  if(/soja/.test(t))found.push('soy');if(/ei |huhnerei|spiegelei|eier/.test(' '+t))found.push('eggs');
  if(/lachs|fisch|hering|forelle|thunfisch|makrele|sardine/.test(t))found.push('fish');
  if(/sesam/.test(t))found.push('sesame');
  return found;
 }
 function suitable(food){const n=norm(food.name);if(/gericht|sauce|soße|pizza|burger|torte|kuchen|geb[aä]ck|suppe|dessert|pulver|konzentrat|pulverisiert|brause|salatdressing|angereichert|instant|fruehstueckscerealien|bonbons|marmelade|limonade/.test(n))return false;
  if(/gewurz|salz|pfeffer|zimt|kurkuma|kakao|hefe|extrakt|petersilie|getrocknet|trockengewicht/.test(n))return false;
  if(n.length>90)return false;
  return /\broh\b|\bgekocht\b|\bgegart\b|\bgedunstet\b|mandel|haselnuss|walnuss|kern|samen|haferflock|orange|kiwi|banane|apfel|milch|quark|joghurt|lachs|forelle|erbsen|linsen|kichererbsen|spinat/.test(n);
 }
 function recFoods(){if(!meta)return null;let picks=summary.filter(f=>suitable(f));const blocked=new Set((typeof profile!=='undefined'&&Array.isArray(profile.allergens))?profile.allergens:[]);
  picks=picks.filter(f=>!estimatedAllergen(f).some(a=>blocked.has(a)));
  // Kernnährstoffe sind für die Ergänzungs-Analyse separat indiziert; vollständige 138 Werte bleiben in IndexedDB.
  return picks.map(f=>({id:f.id,name:f.name,n:f.core,allergens:estimatedAllergen(f),max:/kern|samen|mandel|nuss|haferflock/.test(norm(f.name))?50:/milch|joghurt|quark/.test(norm(f.name))?400:300,default:100,bls:true}));
 }
 let searchRun=0;
 async function showResults(){const field=$('blsQuery');if(!field||!meta)return;
  const run=++searchRun,q=norm(field.value),type=$('blsNutrient').value,area=$('blsResults');
  if(!q&&!type){area.innerHTML='<p class="muted">Lebensmittel oder Nährstoff eingeben.</p>';return;}
  let items=summary.filter(f=>!q||norm(f.name).includes(q)||norm(f.en).includes(q));
  const c=type?meta.components.find(x=>x.idx===+type):null;
  if(c){
   area.innerHTML='<p class="muted">Nährstoffgehalte werden lokal ausgewertet …</p>';
   if(c.kind)items=items.map(f=>({...f,amount:f.core[c.kind]}));
   else{
    const db=await dbOpen();const all=await request(db.transaction(STORE,'readonly').objectStore(STORE).getAll());
    const rowMap=new Map(all.map(x=>[x.id,x.values]));const pos=meta.components.findIndex(x=>x.idx===c.idx);
    items=items.map(f=>({...f,amount:rowMap.get(f.id)?.[pos]}));
   }
   if(run!==searchRun)return;
   items=items.filter(x=>typeof x.amount==='number'&&Number.isFinite(x.amount)).sort((a,b)=>b.amount-a.amount);
  }else items.sort((a,b)=>{const na=norm(a.name),nb=norm(b.name);return Number(nb===q)-Number(na===q)||Number(nb.startsWith(q))-Number(na.startsWith(q))||(a.name.length-b.name.length)});
  const out=items.slice(0,35);
  area.innerHTML=`<p class="muted">${items.length.toLocaleString('de-DE')} passende Einträge · ${out.length} angezeigt</p>`+out.map(f=>`<button type="button" class="blsHit" data-code="${esc(f.id)}"><span><strong>${esc(f.name)}</strong><small>BLS ${esc(f.id)}${c?' · '+Number(f.amount).toLocaleString('de-DE',{maximumFractionDigits:5})+' '+esc(c.unit)+'/100 g':''}</small></span><span aria-hidden="true">›</span></button>`).join('');
 }
 async function showFood(id){const f=await getFood(id);if(!f||!meta)return;const count=Math.max(1,Math.min(3000,Number($('blsGrams')?.value)||100));
  const rows=meta.components.map((c,i)=>({c,v:f.values[i],orig:f.origins?.[i],ref:f.refs?.[i]})).filter(x=>x.v!==null&&x.v!==undefined);
  const top=rows.filter(x=>x.c.kind).slice(0,12);const more=rows.filter(x=>!top.includes(x));
  const line=x=>`<tr><td>${esc(x.c.name)} <small>${esc(x.c.code)}</small></td><td>${Number((x.v*count/100).toPrecision(5)).toLocaleString('de-DE',{maximumFractionDigits:5})} ${esc(x.c.unit)}</td><td>${Number(x.v).toLocaleString('de-DE',{maximumFractionDigits:5})}</td><td><details class="blsProvenance"><summary>Quelle</summary>${esc(x.orig??'Keine Angabe')}<p>${esc(x.ref??'Keine Angabe')}</p></details></td></tr>`;
  $('blsDetail').innerHTML=`<h3>${esc(f.name)}</h3><p class="muted">${esc(f.id)} · Durchschnittswerte pro 100 g essbaren Anteil, keine Laboranalyse eines Markenprodukts.</p><p><strong>Gewählte Menge: ${count} g</strong></p><div class="blsScroll"><table class="blsTable"><thead><tr><th>Nährstoff</th><th>${count} g</th><th>je 100 g</th><th>Herkunft</th></tr></thead><tbody>${top.map(line).join('')}${more.map(line).join('')}</tbody></table></div><p class="muted">${rows.length} von ${meta.components.length} Nährstoffen mit Zahlenwerten. Fehlende Werte sind nicht gleich null.</p>`;
  $('blsDetail').dataset.code=id;
 }
 function init(){const input=$('blsImport'),btn=$('blsImportButton');if(!input||!btn)return;btn.addEventListener('click',()=>input.click());
  input.addEventListener('change',async()=>{const file=input.files?.[0];if(!file)return;btn.disabled=true;try{await importFile(file)}catch(e){dataStatus('Import fehlgeschlagen: '+e.message);console.error(e)}finally{btn.disabled=false;input.value=''}});
  $('blsQuery').addEventListener('input',showResults);$('blsNutrient').addEventListener('change',showResults);
  $('blsResults').addEventListener('click',e=>{const b=e.target.closest('button[data-code]');if(b)showFood(b.dataset.code)});
  $('blsGrams').addEventListener('change',()=>{const code=$('blsDetail').dataset.code;if(code)showFood(code)});
  $('blsExportButton')?.addEventListener('click',()=>exportPublished().catch(e=>dataStatus('Export fehlgeschlagen: '+e.message)));
  loadExisting().then(async exists=>{refresh();if(!exists){dataStatus('BLS-Daten werden gesucht …');const loaded=await tryPublished();if(!loaded&& !meta)dataStatus('Bitte die offizielle BLS-4.0-ZIP einmal in Einstellungen importieren.');}else dataStatus('Lokale BLS-Daten bereit.');}).catch(e=>dataStatus('Lokaler Speicher nicht verfügbar: '+e.message));
 }
 window.VeritasBLS={recFoods,getFood,get meta(){return meta},get summary(){return summary},getSource:()=>source,importFile,parseXlsx,loadExisting,zipEntries,zipFile};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
