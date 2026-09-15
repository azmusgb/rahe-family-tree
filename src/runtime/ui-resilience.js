// UI resilience only. This module does not alter genealogy, evidence, privacy,
// relationship, source, or media data; it prevents a stale loading string from
// becoming the only feedback when a renderer takes unusually long.

const LOADING_TEXT='Loading family data…';
const SLOW_TEXT='Family data is taking longer than expected. You can keep waiting or reload this page.';
let timer=0;

function status(){return document.getElementById('status');}
function arm(){
  clearTimeout(timer);
  const node=status();
  if(!node||node.textContent.trim()!==LOADING_TEXT)return;
  timer=window.setTimeout(()=>{
    const current=status();
    if(current&&current.textContent.trim()===LOADING_TEXT)current.textContent=SLOW_TEXT;
  },12000);
}
function disarm(){
  clearTimeout(timer);
  const node=status();
  if(node?.textContent.trim()===SLOW_TEXT)node.textContent='';
}

window.addEventListener('family-view-rendered',disarm);
window.addEventListener('family-native-rendered',disarm);
window.addEventListener('hashchange',arm);
window.addEventListener('pageshow',arm);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',arm):arm();
