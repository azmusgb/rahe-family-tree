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

export const routePresentation=Object.freeze({
  dashboard:{label:'Home',heading:'Family History Home'},
  tree:{label:'Tree',heading:'Family Tree'},
  people:{label:'People',heading:'People'},
  person:{label:'People',heading:'Person'},
  families:{label:'Families',heading:'Families'},
  branch:{label:'Families',heading:'Family Branch'},
  media:{label:'Photos',heading:'Photos & Documents'},
  stories:{label:'Stories',heading:'Family Stories'},
  timeline:{label:'Timeline',heading:'Family Timeline'},
  migration:{label:'Places',heading:'Places & Migration'},
  intelligence:{label:'Overview',heading:'Research Overview'},
  evidence:{label:'Evidence',heading:'Evidence'},
  sources:{label:'Sources',heading:'Sources'},
  research:{label:'Queue',heading:'Research Queue'},
  archive:{label:'Archive',heading:'Archive'},
  claim:{label:'Evidence',heading:'Evidence Claim'},
  source:{label:'Sources',heading:'Source'},
  task:{label:'Queue',heading:'Research Task'},
  intake:{label:'Queue',heading:'Research Intake'},
  identity:{label:'Queue',heading:'Identity Research'},
  conflicts:{label:'Research',heading:'Conflicts'}
});

export const familyLabels=Object.freeze(Object.fromEntries(Object.entries(routePresentation).map(([key,value])=>[key,value.label])));
export const researchRoutes=new Set(['evidence','sources','research','archive','claim','source','task','intake','identity','intelligence','conflicts']);

export const owningSection=route=>({person:'people',branch:'families',claim:'evidence',source:'sources',task:'research',intake:'research',identity:'research',conflicts:'research'}[route]||route);
export const routeLabel=route=>routePresentation[route]?.label||'Family History';
export const routeHeading=route=>routePresentation[route]?.heading||routeLabel(route);
export const routeDocumentTitle=route=>route==='dashboard'?'Family History Archive':`${routeHeading(route)} · Family History Archive`;

export const linksHtml=links=>links.map(({key,label,href,description})=>description
  ?`<a href="${href}" data-nav-key="${key}"><b>${label}</b><small>${description}</small></a>`
  :`<a href="${href}" data-nav-key="${key}">${label}</a>`).join('');
