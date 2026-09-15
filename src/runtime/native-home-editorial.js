import{renderNativeHome}from'./native-family-v17.js';

const setText=(root,selector,value)=>{const node=root.querySelector(selector);if(node)node.textContent=value;};
const keepFirst=(root,selector,count=1)=>{[...root.querySelectorAll(selector)].slice(count).forEach(node=>node.remove());};

export function renderEditorialHome(){
  const template=document.createElement('template');
  template.innerHTML=renderNativeHome();
  const root=template.content.querySelector('.v17-home');
  if(!root)return renderNativeHome();
  root.classList.add('home-editorial-layout');

  const hero=root.querySelector('.v17-home-hero');
  if(hero){
    hero.classList.add('home-editorial-cover');
    setText(hero,'.eyebrow','FAMILY HISTORY ARCHIVE');
    setText(hero,'h2','Our family, connected.');
    setText(hero,'p:not(.eyebrow)','Explore the people, relationships, photographs and stories that connect generations of our family.');
    hero.querySelector('.v17-primary-actions a[href="#media"]')?.remove();
  }

  const tree=root.querySelector('.v17-home-tree');
  if(tree){
    tree.classList.add('home-editorial-lead');
    setText(tree,'.eyebrow','EXPLORE THE FAMILY');
    setText(tree,'h2','See how the family connects.');
  }

  const story=root.querySelector('.v17-home-story');
  if(story){
    story.classList.add('home-editorial-story');
    setText(story,'.eyebrow','FROM THE ARCHIVE');
    setText(story,'h2','One moment from the family story.');
    keepFirst(story,'.v17-story-moment',1);
    story.querySelector('.v17-place-strip')?.remove();
    story.querySelector('.v17-section-head>div>p:not(.eyebrow)')?.remove();
  }

  const people=root.querySelector('.v17-featured-people');
  if(people){
    people.classList.add('home-editorial-people');
    setText(people,'.eyebrow','PEOPLE TO DISCOVER');
    setText(people,'h2','Faces in the family archive.');
    keepFirst(people,'.v17-home-person',3);
  }

  root.querySelector('[data-v17-home-gallery]')?.remove();

  if(story&&people){
    const discovery=document.createElement('section');
    discovery.className='home-editorial-discovery';
    discovery.setAttribute('aria-label','Discover the family archive');
    tree?.insertAdjacentElement('afterend',discovery);
    discovery.append(story,people);
  }

  const research=root.querySelector('.v17-research-door');
  if(research){
    research.className='home-editorial-research-link';
    research.innerHTML='<a href="#research">Sources &amp; evidence are available in the Research Center →</a>';
  }

  return template.innerHTML;
}
