const RECENT_KEY='family.archive.recentPeople.v2';
const LEGACY_RECENT_KEYS=['rahe.family.recent-people.v1','rahe.family.recentPeople.v1'];
const readRecent=()=>{try{const current=localStorage.getItem(RECENT_KEY);if(current!=null)return JSON.parse(current)||[];const merged=[];for(const key of LEGACY_RECENT_KEYS){const raw=localStorage.getItem(key);if(!raw)continue;for(const id of JSON.parse(raw)||[])if(!merged.includes(id))merged.push(id);}if(merged.length)localStorage.setItem(RECENT_KEY,JSON.stringify(merged));return merged;}catch{return[];}};
const remember=id=>{if(!id)return;let xs=readRecent();xs=[id,...xs.filter(x=>x!==id)].slice(0,8);localStorage.setItem(RECENT_KEY,JSON.stringify(xs));};
document.addEventListener('click',e=>{
  const depth=e.target.closest?.('[data-tree-depth]');
  if(depth){const u=new URL(location.href);u.searchParams.set('scope','family');u.searchParams.set('depth',depth.dataset.treeDepth);history.replaceState(null,'',u);window.dispatchEvent(new HashChangeEvent('hashchange'));return;}
  const person=e.target.closest?.('[data-person]');if(person)remember(person.dataset.person);
  const focus=e.target.closest?.('[data-focus-tree]');if(focus)remember(focus.dataset.focusTree);
});
document.addEventListener('change',e=>{const p=e.target.closest?.('[data-tree-person]');if(p)remember(p.value);});
