export const familyPrimary=[
  {key:'dashboard',label:'Home',href:'#dashboard'},
  {key:'tree',label:'Tree',href:'#tree'},
  {key:'people',label:'People',href:'#people'},
  {key:'families',label:'Families',href:'#families'},
  {key:'media',label:'Photos',href:'#media'}
];

export const familyExplore=[
  {key:'stories',label:'Stories',href:'#stories',description:'Read source-controlled family highlights'},
  {key:'timeline',label:'Timeline',href:'#timeline',description:'Browse family events through time'},
  {key:'migration',label:'Places & Migration',href:'#migration',description:'Follow the family across places and generations'}
];

export const researchPrimary=[
  {key:'intelligence',label:'Overview',href:'#intelligence'},
  {key:'evidence',label:'Evidence',href:'#evidence'},
  {key:'sources',label:'Sources',href:'#sources'},
  {key:'research',label:'Queue',href:'#research'},
  {key:'archive',label:'Archive',href:'#archive'}
];

export const familyLabels={
  dashboard:'Home',tree:'Tree',people:'People',person:'People',families:'Families',branch:'Families',media:'Photos',stories:'Stories',timeline:'Timeline',migration:'Places'
};

export const researchRoutes=new Set(['evidence','sources','research','archive','claim','source','task','intake','identity','intelligence','conflicts']);

export const owningSection=route=>({person:'people',branch:'families',claim:'evidence',source:'sources',task:'research',intake:'research',identity:'research',conflicts:'research'}[route]||route);

export const linksHtml=links=>links.map(({key,label,href,description})=>description
  ?`<a href="${href}" data-nav-key="${key}"><b>${label}</b><small>${description}</small></a>`
  :`<a href="${href}" data-nav-key="${key}">${label}</a>`).join('');

// Durable route metadata consumed by shell surfaces. Keep route relationships
// here rather than duplicating them in mobile/desktop controllers.
export const navigationPeers=Object.freeze({
  dashboard:['tree','people','families'],
  people:['families','tree','media'],
  person:['people','tree','media'],
  families:['tree','people','migration'],
  branch:['families','tree','timeline'],
  tree:['people','families','media'],
  media:['people','stories','timeline'],
  stories:['timeline','media','people'],
  timeline:['stories','migration','people'],
  migration:['timeline','families','people'],
  research:['evidence','sources','dashboard'],
  evidence:['sources','research','dashboard'],
  sources:['evidence','research','dashboard'],
  intelligence:['evidence','sources','dashboard']
});

const routeLabel=key=>{
  const item=[...familyPrimary,...familyExplore,...researchPrimary].find(entry=>entry.key===key);
  if(item)return item.label;
  return {dashboard:'Family home',person:'People',branch:'Families'}[key]||familyLabels[key]||key;
};

export const routeHref=key=>`#${key==='dashboard'?'dashboard':key}`;
export const contextualDestinations=route=>(navigationPeers[route]||navigationPeers.dashboard)
  .map(key=>[routeLabel(key),routeHref(key)]);

// Full normalized hash identity is intentionally distinct from owningSection.
// This preserves Person A -> Person B and Branch A -> Branch B in transient Back.
export const routeIdentity=()=>{
  const raw=(location.hash||'#dashboard').slice(1).replace(/^\/+|\/+$/g,'');
  return raw||'dashboard';
};
