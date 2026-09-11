const RECENT_KEY='rahe.family.recent-people.v1';
const remember=id=>{if(!id)return;let xs=[];try{xs=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]')}catch{};xs=[id,...xs.filter(x=>x!==id)].slice(0,8);localStorage.setItem(RECENT_KEY,JSON.stringify(xs));};
document.addEventListener('click',e=>{
  const depth=e.target.closest?.('[data-tree-depth]');
  if(depth){const u=new URL(location.href);u.searchParams.set('scope','family');u.searchParams.set('depth',depth.dataset.treeDepth);history.replaceState(null,'',u);window.dispatchEvent(new HashChangeEvent('hashchange'));return;}
  const person=e.target.closest?.('[data-person]');if(person)remember(person.dataset.person);
  const focus=e.target.closest?.('[data-focus-tree]');if(focus)remember(focus.dataset.focusTree);
});
document.addEventListener('change',e=>{const p=e.target.closest?.('[data-tree-person]');if(p)remember(p.value);});
