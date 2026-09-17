import {routeIdentity} from'./navigation-model.js';

const MOBILE_QUERY='(max-width: 720px)';
const LIMIT=12;
const trail=[];
let current='';
let suppress=false;

const isMobile=()=>window.matchMedia(MOBILE_QUERY).matches;
const fallback=identity=>{
  const route=String(identity||'').split('/')[0];
  if(route==='person')return'people';
  if(route==='branch')return'families';
  return'dashboard';
};

function reset(){trail.length=0;current='';suppress=false;}

function record(){
  if(!isMobile()){reset();return;}
  const next=routeIdentity();
  if(!current){current=next;return;}
  if(next===current)return;
  if(!suppress){
    trail.push(current);
    if(trail.length>LIMIT)trail.splice(0,trail.length-LIMIT);
  }
  suppress=false;
  current=next;
}

export function mobileBackDestination(){
  if(!isMobile())return null;
  const here=routeIdentity();
  let previous='';
  while(trail.length&&!previous){
    const candidate=trail.pop();
    if(candidate&&candidate!==here)previous=candidate;
  }
  suppress=true;
  return `#${previous||fallback(here)}`;
}

export function navigateMobileBack(){
  const destination=mobileBackDestination();
  if(!destination)return false;
  location.hash=destination;
  return true;
}

// Own the smart Back action before legacy shell listeners see it. This module is
// the migration boundary; once the old routeKey-only trail is removed from the
// shell, this capture hook remains the single durable Back controller.
document.addEventListener('click',event=>{
  const control=event.target.closest?.('[data-mobile-smart-back]');
  if(!control||!isMobile())return;
  event.preventDefault();
  event.stopImmediatePropagation();
  navigateMobileBack();
},true);

window.addEventListener('hashchange',record);
window.addEventListener('popstate',record);
window.addEventListener('family-route-committed',record);
window.addEventListener('resize',()=>{if(!isMobile())reset();},{passive:true});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',record,{once:true}):record();
