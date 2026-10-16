/* Veritas 3.3 – optionale, quellenbasierte NEM-Recherche. Nur eigener Gemini-Schlüssel.
 * Keine API-Schlüssel im Repo; keine automatischen kostenpflichtigen Anfragen.
 * KI-Ergebnisse niemals ohne Vorschau und Bestätigung in die lokale Deklaration übernehmen.
 */
'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const KEY='veritas-gemini-user-key-v1',PREF='veritas-ai-prefs-v1';
  const MODELS=new Set(['gemini-2.5-flash','gemini-2.5-flash-lite']);
  let key='', model='gemini-2.5-flash',remember=false,busy=false,seenCode='',lastReport=null;
  const normalize=s=>String(s??'').trim();
  const clean=(s,max=500)=>normalize(s).slice(0,max);
  const say=(id,message)=>{const n=$(id);if(n)n.textContent=message};
  const el=(tag,text='',cls='')=>{const n=document.createElement(tag);if(text!==null)n.textContent=text;if(cls)n.className=cls;return n};
  const append=(where,...children)=>children.forEach(c=>where.append(c));
  const isUrl=x=>{try{const u=new URL(x);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}};
  const mask=x=>x ? '••••'+x.slice(-4):'';
  const idOk=x=>x===true;
  const getSaved=()=>{try{return localStorage.getItem(KEY)||sessionStorage.getItem(KEY)||''}catch{return ''}};
  function boot(){
    try{const p=JSON.parse(localStorage.getItem(PREF)||'{}');if(MODELS.has(p.model))model=p.model;remember=!!p.remember}catch{}
    key=getSaved();$('aiApiKey').value=key;$('aiModel').value=model;$('aiRememberKey').checked=remember;
    if(key)say('aiSettingsStatus',`Schlüssel ${mask(key)} geladen. Recherche nur nach Klick.`);
  }
  function save(){
    key=$('aiApiKey').value.trim();model=$('aiModel').value;remember=$('aiRememberKey').checked;
    if(!MODELS.has(model))model='gemini-2.5-flash';
    // Neue Gemini-Auth-Keys können mit "AQ." beginnen, ältere Standard-Keys mit "AIza".
    // Keine starre Präfixprüfung: Ob ein Schlüssel gültig ist, entscheidet der API-Verbindungstest.
    if(key && (key.length<12 || /\s/.test(key) || /[^\x21-\x7e]/.test(key))){
      say('aiSettingsStatus','Bitte den vollständigen API-Schlüssel ohne Leerzeichen, Zeilenumbrüche oder zusätzliche Zeichen einfügen.');return false;
    }
    try{sessionStorage.removeItem(KEY);localStorage.removeItem(KEY);
      if(key)(remember?localStorage:sessionStorage).setItem(KEY,key);
      localStorage.setItem(PREF,JSON.stringify({model,remember}));
    }catch{say('aiSettingsStatus','Speichern nicht möglich – Browser-Speicher deaktiviert.');return false}
    say('aiSettingsStatus',key?`Schlüssel ${mask(key)} gespeichert (${remember?'auf diesem Gerät':'für diese Sitzung'}). Bitte „Verbindung testen“ wählen – das Format allein bestätigt keine Gültigkeit.`:'Kein API-Schlüssel hinterlegt.');
    return true;
  }
  function clearKey(){
    key='';$('aiApiKey').value='';
    try{localStorage.removeItem(KEY);sessionStorage.removeItem(KEY)}catch{}
    say('aiSettingsStatus','API-Schlüssel auf diesem Gerät gelöscht.');
  }
  function apiError(status,msg){
    if(status===400)return 'Die Suchfunktion oder das gewählte Modell wird mit diesem API-Projekt nicht unterstützt. '+msg;
    if(status===401)return 'Authentifizierung fehlgeschlagen (401). Bitte Gemini-Schlüssel in Google AI Studio überprüfen. Ein OpenRouter-Schlüssel funktioniert an diesem Google-Endpunkt nicht.';
    if(status===403)return 'Zugriff nicht erlaubt (403). Bitte API-/Projektberechtigungen und Modellzugriff in Google AI Studio kontrollieren.';
    if(status===404)return 'Das ausgewählte Gemini-Modell wurde für dieses Projekt nicht gefunden (404). Das bedeutet nicht automatisch, dass der API-Schlüssel ungültig ist. '+msg;
    if(status===429)return 'Kostenloses Tageslimit / Rate-Limit erreicht. Später erneut versuchen oder das API-Projekt prüfen.';
    return `Gemini-Fehler ${status}: ${msg}`;
  }
  async function callGemini(prompt,search){
    const apiKey=key||getSaved();if(!apiKey)throw Error('Bitte zuerst unter Einstellungen → KI-Recherche den eigenen Gemini-API-Schlüssel hinterlegen.');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
    try{
      const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
        method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},signal:controller.signal,
        body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],
          ...(search?{tools:[{google_search:{}}]}:{}),generationConfig:{temperature:0.1,maxOutputTokens:3000}})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw Error(apiError(response.status,clean(data?.error?.message||response.statusText,220)));
      const cand=data?.candidates?.[0];
      const output=(cand?.content?.parts||[]).map(p=>p.text||'').join('\n').trim();
      if(!output)throw Error('Keine auswertbare Antwort erhalten. Eventuell hat der Anbieter die Anfrage blockiert.');
      return {output,metadata:cand?.groundingMetadata||null};
    }catch(error){if(error.name==='AbortError')throw Error('Zeitüberschreitung nach 60 Sekunden. Bitte später erneut versuchen.');
      if(error instanceof TypeError)throw Error('API nicht erreichbar (Netzwerk oder CORS). Falls der Anbieter Browseranfragen blockiert, wird ein geschützter Proxy benötigt.');throw error;
    }finally{clearTimeout(timer)}
  }
  function parseJson(text){
    const withoutFence=text.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
    let result;try{result=JSON.parse(withoutFence)}catch{const start=withoutFence.indexOf('{'),end=withoutFence.lastIndexOf('}');if(start<0||end<=start)throw Error('Die KI hat keine gültige strukturierte Produktantwort geliefert. Bitte erneut recherchieren.');try{result=JSON.parse(withoutFence.slice(start,end+1))}catch{throw Error('KI-Antwort ist kein gültiges JSON. Bitte erneut versuchen.')}}
    if(!result||typeof result!=='object'||Array.isArray(result))throw Error('Ungültiges Datenformat.');return result;
  }
  function groundingSources(metadata){
    const sources=[];
    for(const g of metadata?.groundingChunks||[]){const u=isUrl(g.web?.uri);if(!u||sources.some(s=>s.url===u))continue;
      sources.push({url:u,title:clean(g.web?.title||new URL(u).hostname,140)});
    }
    return sources.slice(0,12);
  }
  function sanitize(raw,requestCode,meta){
    const named=requestCode.startsWith('name:');
    const same=named ? !!clean(raw.name,140) : clean(raw.ean,32)===requestCode && idOk(raw.eanConfirmed);
    const doseConflict=raw.doseConflict===true || (Array.isArray(raw.doseNotes) && raw.doseNotes.some(x=>/widerspr|unklar|konflikt|abweich/i.test(String(x))));
    const nutrients=(Array.isArray(raw.nutrients)?raw.nutrients:[]).slice(0,25).map(n=>({
       name:clean(n.name,90),amount:Number(n.amount),unit:clean(n.unit,4).replace('μ','µ'),basis:clean(n.basis,28).toLowerCase()
    })).filter(n=>n.name&&Number.isFinite(n.amount)&&n.amount>0&&n.amount<=1000000&&['mg','µg','g'].includes(n.unit));
    const sources=groundingSources(meta);
    return {ean:requestCode,named,identityOk:same,name:clean(raw.name,140),brand:clean(raw.brand,110),
      dailyDose:clean(raw.dailyDose,130),doseConflict,
      notes:(Array.isArray(raw.doseNotes)?raw.doseNotes:[]).slice(0,9).map(x=>clean(x,220)).filter(Boolean),
      nutrients,ingredients:clean(raw.ingredients,2800),claims:(Array.isArray(raw.claims)?raw.claims:[]).slice(0,12).map(x=>clean(x,260)).filter(Boolean),
      sources,searchQueries:(meta?.webSearchQueries||[]).slice(0,6).map(x=>clean(x,100)),
      summary:clean(raw.summary,400)};
  }
  const PROMPT=`Du recherchierst ausschließlich Nahrungsergänzungsmittel in Deutschland. Finde das EXAKTE Produkt zur EAN (GTIN) und gleiche Hersteller-/Händlerangaben ab. Nutze die Google-Suche. Keine erfundenen Werte. Suche bevorzugt nach der EAN auf Hersteller- oder Händlerseiten sowie Packung/Etikett. Falls EAN nicht ausdrücklich bestätigt werden kann, setze eanConfirmed=false. Gib ALLE Produktmengen nur mit präziser Bezugsgröße an; niemals eine Menge pro Kapsel als Tagesdosis ausgeben. Bei widersprüchlichen Dosierungen setze doseConflict=true, erläutere den Konflikt unter doseNotes und gib basis='unknown' für widersprüchliche Stoffmengen an. Bei Kombipräparaten alle belegten Stoffe erfassen. DHA, EPA und ALA separat belassen. Wirkstoffe ohne dokumentierte Menge weglassen. Unbekannte Werte leer lassen. Behauptete Werbung wortgetreu, sofern gefunden.
Antworte AUSSCHLIESSLICH als ein JSON-Objekt ohne Markdown. Schema: {"ean":"EAN exakt oder leer","eanConfirmed":false,"name":"Produktname oder leer","brand":"Hersteller oder leer","dailyDose":"z.B. 2 Kapseln täglich, sonst leer","doseConflict":false,"doseNotes":["Hinweis"],"nutrients":[{"name":"Vitamin C","amount":120,"unit":"mg","basis":"daily"}],"ingredients":"vollständige Zutatenliste oder leer","claims":["Werbespruch"],"summary":"knappe Einschränkungen"}. "basis" nur "daily" wenn Menge eindeutig pro EMPFOHLENER Tagesportion und keine Konflikte bestehen, sonst "capsule", "serving" oder "unknown". Bei fehlender EAN-Übereinstimmung keine Produktdaten einer ähnlichen Packung übertragen.`;
  function row(label,value){const node=el('div','','aiResearchRow');append(node,el('strong',label),el('span',value||'Nicht belegbar'));return node}
  function renderReport(report){
    const box=$('aiResearchResults');box.replaceChildren();box.hidden=false;
    append(box,el('h4','Ergebnisse der Online-Recherche'));
    const badge=el('p',report.named?'Recherche nach Produktname – Hersteller/Variante selbst prüfen':report.identityOk?'EAN-Match von der KI angegeben':'EAN nicht sicher bestätigt – keine automatische Übernahme','aiResearchFlag '+(report.identityOk?'match':'warning'));
    append(box,badge,row('Produkt',report.name),row('Hersteller',report.brand),row('Tagesportion',report.dailyDose));
    if(report.summary)append(box,el('p',report.summary,'muted'));
    if(report.doseConflict)append(box,el('p','⚠ Widersprüchliche Tagesdosen: Nährstoffmengen werden nicht automatisch übernommen.','aiResearchWarning'));
    for(const note of report.notes)append(box,el('p',note,'aiResearchNote'));
    if(report.nutrients.length){const list=el('ul','','aiResearchList');
      report.nutrients.forEach(n=>append(list,el('li',`${n.name}: ${n.amount.toLocaleString('de-DE')} ${n.unit} – ${n.basis==='daily'?'pro Tagesportion':n.basis==='capsule'?'pro Kapsel (nicht Tagesportion)':n.basis==='serving'?'pro Portion (nicht Tagesportion)':'Bezugsmenge unklar'}`)));
      append(box,el('h5','Recherchierte Nährstoffe'),list);
    }
    if(report.ingredients)append(box,row('Zutaten / Hilfsstoffe',report.ingredients));
    if(report.claims.length)append(box,row('Werbeversprechen',report.claims.join(' · ')));
    const s=el('div','','aiSources');append(s,el('strong','Webquellen (Google-Suche):'));
    if(!report.sources.length)append(s,el('p','Keine überprüfbaren Webquellen zurückgegeben. Übernahme gesperrt.'));
    else {const ul=el('ul');for(const source of report.sources){const li=el('li'),a=el('a',source.title);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';append(li,a);append(ul,li)}append(s,ul)}append(box,s);
    const cleanDaily=report.nutrients.filter(n=>n.basis==='daily');
    const allow=report.identityOk&&report.sources.length>0;
    const apply=el('button','Geprüfte Angaben in Etikett-Editor übernehmen','primary');apply.type='button';apply.disabled=!allow;
    apply.addEventListener('click',()=>{
      if(!allow||report.ean!==normalize(state.productCode)){say('aiResearchStatus','EAN gewechselt – bitte erneut recherchieren.');return}
      if(!window.confirm('KI-Informationen sind nicht unabhängig verifiziert. Hast du EAN, Inhaltsstoffe und Tagesmenge auf den verlinkten Seiten gegenkontrolliert? Bestehende Felder im Etikett-Editor werden angezeigt, nicht ohne Bestätigung gespeichert.'))return;
      const d=typeof nemRead==='function'?nemRead(report.ean):null;
      if(!$('result').classList.contains('isSupplement')){say('aiResearchStatus','Bitte zuerst Produktart „Nahrungsergänzungsmittel“ wählen.');return}
      $('supplementEditor').hidden=false;
      if(report.name)$('suppName').value=report.name;
      if(report.dailyDose&&!report.doseConflict)$('suppDailyDose').value=report.dailyDose;
      if(report.ingredients)$('suppIngredients').value=report.ingredients;
      if(report.claims.length)$('suppClaims').value=report.claims.join('\n');
      if(cleanDaily.length&&!report.doseConflict&&report.dailyDose)$('suppNutrients').value=cleanDaily.map(n=>`${n.name}; ${n.amount}; ${n.unit}`).join('\n');
      // Nicht bestätigte Bezugsgrößen bewusst auslassen. Kein automatisches nemSave().
      const ignored=report.nutrients.length-cleanDaily.length;
      say('aiResearchStatus',`Die Angaben stehen jetzt im Etikett-Editor. ${report.doseConflict?'Dosierungskonflikt – manuell kontrollieren. ':''}${ignored?ignored+' Nährstoffangabe(n) ohne Tagesbezug nicht übernommen. ':''}Bitte prüfen und anschließend ausdrücklich speichern.`);
      $('supplementEditor').scrollIntoView({behavior:'smooth',block:'start'});
    });
    append(box,apply);
    if(!allow)append(box,el('p','Zur sicheren Übernahme sind sowohl eine bestätigte EAN-Übereinstimmung als auch mindestens eine Webquelle erforderlich.','muted'));
    if(report.doseConflict)append(box,el('p','Bei Dosierungskonflikten bleibt das Nährstofffeld unverändert. Bitte anhand des Originaletiketts ausfüllen.','muted'));
    if(!report.identityOk)append(box,el('p','Falls keine EAN-Übereinstimmung gefunden wurde, suche stattdessen nach Produktname und Hersteller und ergänze die Packungsangaben manuell.','muted'));
  }
  async function research(){
    if(busy)return;
    if(!save()){ $('groupAI').open=true;$('settings').hidden=false;$('groupAI').scrollIntoView({behavior:'smooth',block:'start'});return}
    if(!key){say('aiResearchStatus','Bitte erst einen Gemini-API-Schlüssel in Einstellungen → KI-Recherche hinterlegen.');$('settings').hidden=false;$('groupAI').open=true;$('groupAI').scrollIntoView({behavior:'smooth'});return}
    const code=normalize(state?.productCode||'');if(!/^\d{8,14}$/.test(code)&&!code.startsWith('name:')){say('aiResearchStatus','Bitte zuerst eine gültige EAN scannen oder nach Namen suchen.');return}
    const name=clean(state.product?.product_name_de||state.product?.product_name||'',150);
    const named=code.startsWith('name:');
    busy=true;$('aiResearchButton').disabled=true;$('aiResearchResults').hidden=true;
    say('aiResearchStatus',named?`Suche nach „${name}“ auf Hersteller- und Händlerseiten …`:`Suche nach EAN ${code} auf Hersteller- und Händlerseiten …`);
    try{
      const query=named?`\n\nKEINE EAN VORHANDEN. Suche nach genau dieser Produktbezeichnung: ${name}. Gib eanConfirmed=false zurück. Name, Produktvariante und Hersteller klar benennen.`:`\n\nZU RECHERCHIERENDE EAN: ${code}\nPRODUKTNAME AUS BISHERIGEN DATEN (kann unzuverlässig sein): ${name}`;
      const answer=await callGemini(PROMPT+query,true);
      const report=sanitize(parseJson(answer.output),code,answer.metadata);
      if(code!==normalize(state.productCode)){say('aiResearchStatus','Inzwischen wurde eine andere EAN geöffnet – Recherche verworfen.');return}
      seenCode=code;lastReport=report;renderReport(report);
      say('aiResearchStatus',`${report.sources.length} Quellen gefunden. ${report.named?'Suche nach Name – Hersteller und Produktvariante manuell abgleichen.':report.identityOk?'EAN-Identität laut KI bestätigt.':'EAN-Identität nicht gesichert.'} Bitte Quellen und Originaletikett vergleichen.`);
    }catch(e){say('aiResearchStatus',`KI-Recherche fehlgeschlagen: ${e.message}`)}
    finally{busy=false;$('aiResearchButton').disabled=false}
  }
  async function test(){
    if(!save())return;
    if(!key){say('aiSettingsStatus','Bitte zuerst einen API-Schlüssel eingeben.');return}
    $('aiTestConnection').disabled=true;say('aiSettingsStatus','Verbindung wird geprüft (ohne Websuche) …');
    try{const a=await callGemini('Antworte ausschließlich mit OK.',false);say('aiSettingsStatus',a.output?`✓ API erreichbar, Modell ${model} antwortet. Die Google-Websuche wurde dabei nicht geprüft.`:'Keine Antwort')}catch(e){say('aiSettingsStatus','Verbindung fehlgeschlagen: '+e.message)}
    finally{$('aiTestConnection').disabled=false}
  }
  function init(){
    if(!$('aiApiKey')||!$('aiResearchButton'))return;
    boot();$('aiSaveSettings').addEventListener('click',save);
    $('aiTestConnection').addEventListener('click',test);
    $('aiClearKey').addEventListener('click',clearKey);
    $('aiToggleKey').addEventListener('click',()=>{const field=$('aiApiKey');field.type=field.type==='password'?'text':'password';$('aiToggleKey').textContent=field.type==='password'?'Anzeigen':'Verbergen'});
    $('aiResearchButton').addEventListener('click',research);
    const toggleNameForm=()=>{$('aiNameForm').hidden=$('productMode').value!=='supplement'};
    toggleNameForm();$('productMode').addEventListener('change',toggleNameForm);
    $('aiNameForm').addEventListener('submit',event=>{event.preventDefault();const query=clean($('aiNameQuery').value,150);if(query.length<5){say('aiResearchStatus','Bitte Produktbezeichnung und Hersteller eingeben.');return}
      $('productMode').value='supplement';const pseudo='name:'+query.toLocaleLowerCase('de-DE').replace(/[^\p{L}\p{N}]+/gu,'-').slice(0,120);
      state.productCode=pseudo;state.product={product_name_de:query,_veritasKind:'supplement',ingredients_text:'',nutriments:{},_veritasSources:[],_veritasLookupMissing:true};
      render(state.product,pseudo);research();
    });
    $('ean').addEventListener('change',()=>{if(normalize($('ean').value)!==seenCode){$('aiResearchResults').hidden=true}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  // Nur Diagnose-Helfer ohne Zugang zum API-Schlüssel.
  window.VeritasAI={parseJson,sanitize,groundingSources};
})();
