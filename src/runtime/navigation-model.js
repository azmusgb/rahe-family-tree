export const familyPrimary=[
  {key:'dashboard',label:'Home',href:'#dashboard'},
  {key:'tree',label:'Tree',href:'#tree'},
  {key:'people',label:'People',href:'#people'},
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
  dashboard:'Home',tree:'Tree',people:'People',person:'People',media:'Photos',stories:'Stories',timeline:'Timeline',migration:'Places'
};

export const researchRoutes=new Set(['evidence','sources','research','archive','claim','source','task','intake','identity','intelligence','conflicts']);

export const owningSection=route=>({person:'people',claim:'evidence',source:'sources',task:'research',intake:'research',identity:'research',conflicts:'research'}[route]||route);

export const linksHtml=links=>links.map(({key,label,href,description})=>description
  ?`<a href="${href}" data-nav-key="${key}"><b>${label}</b><small>${description}</small></a>`
  :`<a href="${href}" data-nav-key="${key}">${label}</a>`).join('');
