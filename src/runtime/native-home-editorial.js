import{renderNativeHome}from'./native-family-v17.js';

const setText=(root,selector,value)=>{const node=root.querySelector(selector);if(node)node.textContent=value;};

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
    hero.insertAdjacentHTML('afterend',`<nav class="home-editorial-index" aria-label="Explore the family archive">
      <a href="#families"><span>01</span><b>Family branches</b><small>Follow each family line</small></a>
      <a href="#people"><span>02</span><b>People</b><small>Meet relatives across generations</small></a>
      <a href="#stories"><span>03</span><b>Stories</b><small>Moments from the family record</small></a>
      <a href="#media"><span>04</span><b>Archive</b><small>Photos & documents</small></a>
    </nav>`);
  }

  const tree=root.querySelector('.v17-home-tree');
  if(tree){
    tree.classList.add('home-editorial-lead');
    setText(tree,'.eyebrow','FAMILY CONNECTIONS');
    setText(tree,'h2','See where you fit in the story.');
  }
  const story=root.querySelector('.v17-home-story');
  if(story){
    story.classList.add('home-editorial-story');
    setText(story,'.eyebrow','FROM THE FAMILY STORY');
    setText(story,'h2','Lives remembered across generations.');
  }
  const people=root.querySelector('.v17-featured-people');
  if(people){
    people.classList.add('home-editorial-people');
    setText(people,'.eyebrow','PEOPLE');
    setText(people,'h2','Faces in the family archive.');
  }
  const research=root.querySelector('.v17-research-door');
  if(research){
    research.classList.add('home-editorial-research');
    setText(research,'.eyebrow','RESEARCH & SOURCES');
    setText(research,'h2','The record behind the story.');
  }
  return template.innerHTML;
}
