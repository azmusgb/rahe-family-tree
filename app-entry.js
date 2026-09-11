// Single browser entry point for the Rahe Family application.
// Runtime implementation details live behind stable domain boundaries so
// historical version-layer files can be retired incrementally without changing
// the public browser entry or production bundle contract.
// Transitional implementation inventory (owned by src/runtime/*):
// v11.js, media.js, deployment.js,
// media-page-v13-5.js, v15-1-runtime.js, v15-family-focus.js,
// platform-v13-runtime.js.
import './src/runtime/index.js';

const APP_VERSION='15.4.0';
const syncAppVersion=()=>{
  document.documentElement.dataset.uiRelease=APP_VERSION;
  const version=document.querySelector('.version');
  if(version){
    const mode=document.body.dataset.experience==='research'?'RESEARCH MODE':'FAMILY VIEW';
    version.textContent=`${mode} · v${APP_VERSION}`;
  }
};
const scheduleVersionSync=()=>requestAnimationFrame(()=>requestAnimationFrame(syncAppVersion));

window.addEventListener('family-view-rendered',scheduleVersionSync);
window.addEventListener('hashchange',scheduleVersionSync);
window.addEventListener('family-auth-ui-refresh',scheduleVersionSync);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',scheduleVersionSync):scheduleVersionSync();
