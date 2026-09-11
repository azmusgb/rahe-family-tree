// Single browser entry point for the Rahe Family application.
// Import order preserves the previously deployed initialization sequence while
// making the runtime dependency graph explicit and maintainable.
import './v11.js';
import './v12-3-controls.js';
import './media.js';
import './deployment.js';
import './v12-6.js';
import './v12-6-1.js';
import './v12-6-2.js';
import './v12-7.js';
import './v12-8.js';
import './v12-9.js';
import './v12-9-1.js';
import './search-v13-2.js';
import './media-page-v13-5.js';
import './v15-runtime.js';
import './v15-1-runtime.js';
import './v15-family-focus.js';
import './platform-v13-runtime.js';

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
