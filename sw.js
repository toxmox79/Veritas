/* Veritas 3.1 – network-first App-Shell; Browserspeicher bleibt erhalten.
 * Bei jeder Veröffentlichung von geänderten Dateien CACHE-Version erhöhen.
 */
'use strict';
const CACHE='veritas-shell-v36';
const STATIC=[
 './','./index.html','./styles.css','./updates.css','./app.js','./updates.js',
 './supplements.js','./ai-research.js','./ai-research.css','./food-equivalents.js','./bls-database.js','./supplements.css',
 './comparison.js','./precaution.js','./alternatives.js','./product-evidence.js',
 './authenticity.js','./additive-health.js','./health-profile.js','./manifest.webmanifest',
 './icons/icon-192.png','./icons/icon-512.png','./icons/logo.png'
];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)));
 // Aktivierung erst nach Klick; laufende Bearbeitung nicht unterbrechen.
});
self.addEventListener('message',event=>{
 if(event.data?.type==='VERITAS_SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>(key.startsWith('veritas-v')||key.startsWith('veritas-shell-'))&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 // Die große BLS-Datei verbleibt im IndexedDB der Anwendung, nicht doppelt im Cache.
 if(url.pathname.endsWith('/bls4-data.json.gz'))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   // Online immer aktuelle App-Dateien vom Server holen.
   const response=await fetch(req,{cache:'no-store'});
   if(response.ok && (req.mode==='navigate'||STATIC.some(f=>new URL(f,self.registration.scope).pathname===url.pathname))){
    try{await cache.put(req,response.clone())}catch(e){/* Cache unwichtig bei begrenztem Speicher */}
   }
   return response;
  }catch(error){
   // Offline: zuletzt gespeicherte Dateien benutzen.
   const existing=await cache.match(req,{ignoreSearch:true});
   if(existing)return existing;
   if(req.mode==='navigate'){
    const homepage=await cache.match('./index.html');
    if(homepage)return homepage;
   }
   throw error;
  }
 })());
});
