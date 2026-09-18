import{renderNativeHome}from'../family/view.js';

const setText=(root,selector,value)=>{const node=root.querySelector(selector);if(node)node.textContent=value;};
const keepFirst=(root,selector,count=1)=>{[...root.querySelectorAll(selector)].slice(count).forEach(node=>node.remove());};

function normalizeCompactHome(root){
  if(!root?.matches?.('.ui-home-view.home-editorial-layout'))return;
  root.querySelectorAll('.ui-home-branch-preview,.ui-discovery').forEach(node=>node.remove());
  const tree=root.querySelector('.ui-home-tree');
  if(tree){tree.classList.add('home-editorial-lead');setText(tree,'.eyebrow','EXPLORE THE FAMILY');setText(tree,'h2','See how the family connects.');tree.querySelector('.ui-section-head>div>p:not(.eyebrow)')?.remove();}
  const story=root.querySelector('.ui-home-story');
  if(story){story.classList.add('home-editorial-story');setText(story,'.eyebrow','FROM THE ARCHIVE');setText(story,'h2','One moment from the family story.');keepFirst(story,'.ui-family-story-moment',1);story.querySelector('.ui-place-strip')?.remove();story.querySelector('.ui-section-head>div>p:not(.eyebrow)')?.remove();}
  const people=root.querySelector('.ui-featured-people');
  if(people){people.classList.add('home-editorial-people');setText(people,'.eyebrow','PEOPLE TO DISCOVER');setText(people,'h2','Faces in the family archive.');keepFirst(people,'.ui-family-home-person',3);}
  root.querySelector('[data-ui-home-view-gallery]')?.remove();
  if(story&&people){let discovery=root.querySelector('.home-editorial-discovery');if(!discovery){discovery=document.createElement('section');discovery.className='home-editorial-discovery';discovery.setAttribute('aria-label','Discover the family archive');tree?.insertAdjacentElement('afterend',discovery);}if(story.parentElement!==discovery||people.parentElement!==discovery)discovery.append(story,people);}
}

let compactQueued=false;
function scheduleCompactHome(){
  if(compactQueued)return;compactQueued=true;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{compactQueued=false;normalizeCompactHome(document.querySelector('#content .ui-home-view.home-editorial-layout'));}));
}

export function renderEditorialHome(){
  const template=document.createElement('template');
  template.innerHTML=renderNativeHome();
  const root=template.content.querySelector('.ui-home-view');
  if(!root)return renderNativeHome();
  root.classList.add('home-editorial-layout');

  const hero=root.querySelector('.ui-family-home-hero');
  if(hero){
    hero.classList.add('home-editorial-cover');
    setText(hero,'.eyebrow','FAMILY HISTORY ARCHIVE');
    setText(hero,'h2','Our family, connected.');
    setText(hero,'p:not(.eyebrow)','Explore the people, relationships, photographs and stories that connect generations of our family.');
    hero.querySelector('.ui-primary-actions a[href="#media"]')?.remove();
  }

  normalizeCompactHome(root);

  const research=root.querySelector('.ui-research-door');
  if(research){
    research.className='home-editorial-research-link';
    research.innerHTML='<a href="#research">Sources &amp; evidence are available in the Research Center →</a>';
  }

  return template.innerHTML;
}

window.addEventListener('family-native-rendered',scheduleCompactHome);
window.addEventListener('family-view-rendered',scheduleCompactHome);
window.addEventListener('family-experience-changed',scheduleCompactHome);
window.addEventListener('hashchange',scheduleCompactHome);
