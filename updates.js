/* Veritas 3.1 – aktualisierbare PWA, ohne Löschen von Browserdaten.
 * Bei neuen Programmdateien die CACHE-Version in sw.js ändern.
 */
'use strict';
(() => {
 const banner=document.getElementById('veritasUpdateBanner');
 const apply=document.getElementById('veritasApplyUpdate');
 const later=document.getElementById('veritasUpdateLater');
 const checkButton=document.getElementById('veritasCheckUpdates');
 const status=document.getElementById('veritasUpdateStatus');
 if(!('serviceWorker' in navigator)){
  if(status)status.textContent='Automatische Updates werden von diesem Browser nicht unterstützt.';
  if(checkButton)checkButton.disabled=true;
  return;
 }
 let registration=null;
 let applying=false;
 let readyToReload=false;
 const hadControllerAtLoad=!!navigator.serviceWorker.controller;
 let waiting=null;
 let suppressed=false;
 let isChecking=false;
 const say=message=>{if(status)status.textContent=message};
 const showUpdate=worker=>{
  if(!worker || !navigator.serviceWorker.controller)return;
  waiting=worker;
  say('Update verfügbar – bitte „Jetzt aktualisieren“ wählen.');
  if(!suppressed && banner)banner.hidden=false;
 };
 const watch=reg=>{
  if(reg.waiting)showUpdate(reg.waiting);
  reg.addEventListener('updatefound',()=>{
   const candidate=reg.installing;
   if(!candidate)return;
   candidate.addEventListener('statechange',()=>{
    if(candidate.state==='installed' && navigator.serviceWorker.controller)showUpdate(reg.waiting||candidate);
   });
  });
 };
 const check=async(manual=false)=>{
  if(isChecking)return;
  if(!navigator.onLine){if(manual)say('Offline: Prüfung beim nächsten Online-Start.');return;}
  isChecking=true;
  if(manual)say('Prüfe auf neue Version …');
  try{
   if(!registration)registration=await navigator.serviceWorker.getRegistration('./');
   if(!registration){say('Noch kein Service Worker registriert.');return;}
   await registration.update();
   if(registration.waiting)showUpdate(registration.waiting);
   else if(manual) say('Updateprüfung abgeschlossen. Aktuelle Version installiert, soweit vom Server verfügbar.');
  }catch(error){if(manual)say('Prüfung nicht möglich. Internetverbindung später erneut versuchen.');console.warn('Veritas: Updateprüfung fehlgeschlagen',error)}
  finally{isChecking=false}
 };
 if(apply)apply.addEventListener('click',()=>{
  if(readyToReload || !waiting){location.reload();return;}
  applying=true;
  apply.disabled=true;
  apply.textContent='Aktualisiere …';
  waiting.postMessage({type:'VERITAS_SKIP_WAITING'});
  // Das Neuladen erfolgt erst, wenn der neue Service Worker aktiv ist.
 });
 if(later)later.addEventListener('click',()=>{suppressed=true;if(banner)banner.hidden=true;say('Update bereit. Bei Bedarf auf „Updates prüfen“ klicken.')});
 if(checkButton)checkButton.addEventListener('click',()=>{suppressed=false;if(waiting){showUpdate(waiting);return;}check(true)});
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(applying){location.reload();return;}
  // Bei Updates aus anderen Tabs wird die offene Eingabe nicht unterbrochen.
  // Bei Erstinstallation ohne bisherigen Controller keine falsche Update-Warnung.
  if(hadControllerAtLoad && navigator.serviceWorker.controller){
   waiting=null;readyToReload=true;
   if(apply){apply.textContent='Jetzt neu laden';apply.disabled=false;}
   say('Neue Veritas-Version aktiv. Bitte Seite neu laden.');
   if(!suppressed && banner)banner.hidden=false;
  }
 });
 const init=async()=>{
  try{
   registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
   watch(registration);
   if(registration.waiting)showUpdate(registration.waiting);
   else say('Automatische Updateprüfung aktiviert.');
   await check(false);
  }catch(error){say('Updatefunktion momentan nicht verfügbar.');console.warn('Veritas: SW konnte nicht registriert werden',error)}
 };
 window.addEventListener('load',init,{once:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)check(false)});
 window.addEventListener('focus',()=>check(false));
 window.addEventListener('online',()=>check(false));
 window.setInterval(()=>{if(!document.hidden)check(false)},30*60*1000);
})();
