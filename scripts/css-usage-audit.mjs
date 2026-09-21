import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=new Set(process.argv.slice(2));
const reportDir=path.join(root,'artifacts');
const entryCss='src/styles/index.css';
const ignoredDirs=new Set(['.git','node_modules','dist','.netlify','artifacts']);
const usageExtensions=new Set(['.html','.htm','.js','.mjs']);

function rel(p){return path.relative(root,p).replaceAll('\\','/');}
function walk(dir=root){
  const out=[];
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(e.isDirectory()&&ignoredDirs.has(e.name))continue;
    const p=path.join(dir,e.name);
    if(e.isDirectory())out.push(...walk(p));else out.push(p);
  }
  return out;
}
function read(p){return fs.readFileSync(path.join(root,p),'utf8');}
function exists(p){return fs.existsSync(path.join(root,p));}

function importedCssClosure(entry){
  const seen=new Set();
  function visit(file){
    const normalized=path.posix.normalize(file);
    if(seen.has(normalized))return;
    if(!exists(normalized))throw new Error(`CSS import target missing: ${normalized}`);
    seen.add(normalized);
    const css=read(normalized);
    const re=/@import\s+(?:url\()?\s*['"]([^'"]+\.css)['"]\s*\)?[^;]*;/g;
    for(const m of css.matchAll(re)){
      const next=path.posix.normalize(path.posix.join(path.posix.dirname(normalized),m[1]));
      visit(next);
    }
  }
  visit(entry);
  return [...seen];
}

function stripComments(css){return css.replace(/\/\*[\s\S]*?\*\//g,' ');}
function extractRuleHeaders(css){
  const src=stripComments(css);
  const headers=[];
  let quote='',escaped=false,paren=0,bracket=0,start=0;
  const stack=[];
  for(let i=0;i<src.length;i++){
    const c=src[i];
    if(quote){
      if(escaped){escaped=false;continue;}
      if(c==='\\'){escaped=true;continue;}
      if(c===quote)quote='';
      continue;
    }
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='('){paren++;continue;}
    if(c===')'){paren=Math.max(0,paren-1);continue;}
    if(c==='['){bracket++;continue;}
    if(c===']'){bracket=Math.max(0,bracket-1);continue;}
    if(paren||bracket)continue;
    if(c==='{'){
      const header=src.slice(start,i).trim();
      const parent=stack.at(-1)||'';
      const isAt=header.startsWith('@');
      const isKeyframeStep=/^(?:from|to|\d+(?:\.\d+)?%)(?:\s*,\s*(?:from|to|\d+(?:\.\d+)?%))*$/.test(header);
      if(header&&!isAt&&!isKeyframeStep&&!/^[-\w]+\s*:/.test(header))headers.push(header);
      stack.push(isAt?header:parent);
      start=i+1;
    }else if(c==='}'){
      stack.pop();
      start=i+1;
    }else if(c===';'&&stack.length===0){
      start=i+1;
    }
  }
  return headers;
}
function extractBaseRuleHeaders(css){
  const src=stripComments(css);
  const headers=[];
  let quote='',escaped=false,paren=0,bracket=0,start=0;
  const stack=[];
  for(let i=0;i<src.length;i++){
    const c=src[i];
    if(quote){
      if(escaped){escaped=false;continue;}
      if(c==='\\'){escaped=true;continue;}
      if(c===quote)quote='';
      continue;
    }
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='('){paren++;continue;}
    if(c===')'){paren=Math.max(0,paren-1);continue;}
    if(c==='['){bracket++;continue;}
    if(c===']'){bracket=Math.max(0,bracket-1);continue;}
    if(paren||bracket)continue;
    if(c==='{'){
      const header=src.slice(start,i).trim();
      const parent=stack.at(-1)||'';
      const isAt=header.startsWith('@');
      const isKeyframeStep=/^(?:from|to|\d+(?:\.\d+)?%)(?:\s*,\s*(?:from|to|\d+(?:\.\d+)?%))*$/.test(header);
      if(header&&!parent&&!isAt&&!isKeyframeStep&&!/^[-\w]+\s*:/.test(header))headers.push(header);
      stack.push(isAt?header:parent);
      start=i+1;
    }else if(c==='}'){
      stack.pop();
      start=i+1;
    }else if(c===';'&&stack.length===0){
      start=i+1;
    }
  }
  return headers;
}
function splitSelectors(header){
  const out=[];let start=0,quote='',escaped=false,paren=0,bracket=0;
  for(let i=0;i<=header.length;i++){
    const c=header[i]??',';
    if(quote){if(escaped){escaped=false;continue;}if(c==='\\'){escaped=true;continue;}if(c===quote)quote='';continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='(')paren++; else if(c===')')paren=Math.max(0,paren-1);
    else if(c==='[')bracket++; else if(c===']')bracket=Math.max(0,bracket-1);
    else if(c===','&&paren===0&&bracket===0){const s=header.slice(start,i).trim();if(s)out.push(s);start=i+1;}
  }
  return out;
}
const classRe=/\.([_a-zA-Z][_a-zA-Z0-9-]*)/g;
const idRe=/#([_a-zA-Z][_a-zA-Z0-9-]*)/g;
const attrRe=/\[\s*([_a-zA-Z][\w:-]*)/g;
function tokensForSelector(s){
  return{
    classes:[...s.matchAll(classRe)].map(m=>m[1]),
    ids:[...s.matchAll(idRe)].map(m=>m[1]),
    attrs:[...s.matchAll(attrRe)].map(m=>m[1])
  };
}
function specificity(s){
  const a=[...s.matchAll(idRe)].length;
  const b=[...s.matchAll(classRe)].length+[...s.matchAll(attrRe)].length+(s.match(/:(?!:)[\w-]+(?:\([^)]*\))?/g)||[]).length;
  const cleaned=s.replace(/::?[\w-]+(?:\([^)]*\))?/g,' ').replace(idRe,' ').replace(classRe,' ').replace(/\[[^\]]+\]/g,' ').replace(/[>+~*]/g,' ');
  const c=(cleaned.match(/(?:^|\s)([a-zA-Z][\w-]*)/g)||[]).length+(s.match(/::[\w-]+/g)||[]).length;
  return[a,b,c];
}

function collectUsage(files){
  const classRefs=new Map(),idRefs=new Map(),attrRefs=new Map(),dynamicClassPrefixRefs=new Map();
  const add=(map,key,file)=>{if(!key)return;const set=map.get(key)||new Set();set.add(file);map.set(key,set);};
  const addClassValue=(raw,file)=>{
    for(const m of raw.matchAll(/([_a-zA-Z][_a-zA-Z0-9-]*-?)\$\{/g)) add(dynamicClassPrefixRefs,m[1],file);
    const staticOnly=raw.replace(/\$\{[\s\S]*?\}/g,' ');
    for(const token of staticOnly.match(/[_a-zA-Z][_a-zA-Z0-9-]*/g)||[]) add(classRefs,token,file);
  };
  for(const file of files){
    const src=fs.readFileSync(file,'utf8'),rp=rel(file);
    for(const m of src.matchAll(/\bclass(?:Name)?\s*=\s*["'`]([^"'`]+)["'`]/g)) addClassValue(m[1],rp);
    for(const m of src.matchAll(/\.class(?:Name)?\s*=\s*["'`]([^"'`]+)["'`]/g)) addClassValue(m[1],rp);
    for(const m of src.matchAll(/classList\.(?:add|remove|toggle|contains|replace)\s*\(([^)]*)\)/g)){
      for(const literal of m[1].matchAll(/["'`]([^"'`]+)["'`]/g)) addClassValue(literal[1],rp);
    }
    for(const m of src.matchAll(/getElementById\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g)) add(idRefs,m[1],rp);
    for(const m of src.matchAll(/\bid\s*=\s*["'`]([^"'`]+)["'`]/g)) add(idRefs,m[1],rp);
    for(const m of src.matchAll(/(?:querySelector(?:All)?|matches|closest)\s*\(\s*["'`]([^"'`]+)["'`]/g)){
      const q=m[1];
      for(const x of q.matchAll(classRe)) add(classRefs,x[1],rp);
      for(const x of q.matchAll(idRe)) add(idRefs,x[1],rp);
      for(const x of q.matchAll(attrRe)) add(attrRefs,x[1],rp);
    }
    for(const m of src.matchAll(/\b(data-[\w-]+|aria-[\w-]+)\b/g)) add(attrRefs,m[1],rp);
    for(const m of src.matchAll(/\.dataset\.([a-zA-Z][\w]*)/g)){const kebab=m[1].replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());add(attrRefs,'data-'+kebab,rp);}
    for(const m of src.matchAll(/setAttribute\s*\(\s*["'`]((?:data|aria)-[\w-]+)["'`]/g)) add(attrRefs,m[1],rp);
  }
  return{classRefs,idRefs,attrRefs,dynamicClassPrefixRefs};
}

const allFiles=walk();
const repoCss=allFiles.filter(f=>f.endsWith('.css')).map(rel).sort();
const usageFiles=allFiles.filter(f=>usageExtensions.has(path.extname(f))).sort();
const activeCss=importedCssClosure(entryCss);
const activeSet=new Set(activeCss);
const orphanCss=repoCss.filter(f=>!activeSet.has(f));

const usage=collectUsage(usageFiles);
const selectorRows=[];
const selectorFiles=new Map();
const baseSelectorFiles=new Map();
const cssStats={};
const cssClasses=new Set(),cssIds=new Set(),cssAttrs=new Set();
const customDefined=new Map(),customUsed=new Map();
const addVar=(map,key,file)=>{const set=map.get(key)||new Set();set.add(file);map.set(key,set);};

for(const file of activeCss){
  const css=read(file),headers=extractRuleHeaders(css),selectors=headers.flatMap(splitSelectors);
  for(const selector of extractBaseRuleHeaders(css).flatMap(splitSelectors)){
    const baseFiles=baseSelectorFiles.get(selector)||new Set();
    baseFiles.add(file);
    baseSelectorFiles.set(selector,baseFiles);
  }
  const stats={
    bytes:Buffer.byteLength(css),
    selectors:selectors.length,
    important:(css.match(/!important\b/g)||[]).length,
    legacyClasses:0,
    mediaQueries:(css.match(/@media\b/g)||[]).length,
    supportsQueries:(css.match(/@supports\b/g)||[]).length,
    customPropertyDefinitions:(css.match(/--[\w-]+\s*:/g)||[]).length,
    customPropertyUses:(css.match(/var\(\s*--[\w-]+/g)||[]).length
  };
  for(const m of css.matchAll(/(--[\w-]+)\s*:/g))addVar(customDefined,m[1],file);
  for(const m of css.matchAll(/var\(\s*(--[\w-]+)/g))addVar(customUsed,m[1],file);
  for(const selector of selectors){
    const t=tokensForSelector(selector),spec=specificity(selector);
    for(const x of t.classes){cssClasses.add(x);if(/^v\d{2,}/i.test(x))stats.legacyClasses++;}
    for(const x of t.ids)cssIds.add(x);
    for(const x of t.attrs)cssAttrs.add(x);
    const refs=new Set();
    for(const x of t.classes){for(const f of usage.classRefs.get(x)||[])refs.add(f);for(const [prefix,files] of usage.dynamicClassPrefixRefs){if(x.startsWith(prefix))for(const f of files)refs.add(f);}}
    for(const x of t.ids)for(const f of usage.idRefs.get(x)||[])refs.add(f);
    for(const x of t.attrs)for(const f of usage.attrRefs.get(x)||[])refs.add(f);
    const concrete=t.classes.length+t.ids.length+t.attrs.length;
    const unresolvedTokens=[
      ...t.classes.filter(x=>!usage.classRefs.has(x)&&![...usage.dynamicClassPrefixRefs.keys()].some(prefix=>x.startsWith(prefix))).map(x=>'.'+x),
      ...t.ids.filter(x=>!usage.idRefs.has(x)).map(x=>'#'+x),
      ...t.attrs.filter(x=>!usage.attrRefs.has(x)).map(x=>'['+x+']')
    ];
    const row={file,selector,specificity:spec.join(','),classes:t.classes,ids:t.ids,attrs:t.attrs,referenceFiles:[...refs].sort(),unresolvedTokens};
    selectorRows.push(row);
    const list=selectorFiles.get(selector)||new Set();list.add(file);selectorFiles.set(selector,list);
  }
  cssStats[file]=stats;
}

for(const [file,stats] of Object.entries(cssStats)){
  const rows=selectorRows.filter(row=>row.file===file);
  stats.referencedSelectors=rows.filter(row=>row.referenceFiles.length>0).length;
  stats.unreferencedSelectors=rows.filter(row=>row.referenceFiles.length===0).length;
  stats.markupReferencedSelectors=rows.filter(row=>row.referenceFiles.some(ref=>/\.html?$/.test(ref))).length;
  stats.runtimeReferencedSelectors=rows.filter(row=>row.referenceFiles.some(ref=>/\.m?js$/.test(ref))).length;
}

const releaseNumberedCss=repoCss.filter(file=>/(?:^|[-_.])v\d+(?:[-_.]\d+)*/i.test(path.basename(file)));
const duplicateSelectors=[...selectorFiles].filter(([,files])=>files.size>1).map(([selector,files])=>({selector,files:[...files].sort()})).sort((a,b)=>b.files.length-a.files.length||a.selector.localeCompare(b.selector));
const responsiveOwnershipFiles=new Set([
  'src/features/family/family-responsive.css',
  'src/styles/home-responsive.css'
]);
const canonicalOwnerFiles=new Set([
  'src/styles/tokens.css',
  'src/styles/foundation.css',
  'src/styles/composition.css',
  'src/styles/experience.css',
  'src/styles/interaction.css',
  'src/features/navigation/navigation.css',
  'src/features/navigation/mobile-foundation.css',
  'src/features/navigation/mobile-shell.css',
  'src/features/navigation/mobile-directory.css',
  'src/features/person/person.css',
  'src/features/tree/tree.css',
  'src/features/research/research.css'
]);
const ownershipDuplicateSelectors=duplicateSelectors
  .map(row=>({...row,files:row.files.filter(file=>!file.endsWith('/print.css')&&!file.endsWith('print.css')&&!responsiveOwnershipFiles.has(file))}))
  .filter(row=>row.files.length>1);

const ownershipPairCounts={};
for(const row of ownershipDuplicateSelectors){
  for(let i=0;i<row.files.length;i++)for(let j=i+1;j<row.files.length;j++){
    const pair=`${row.files[i]} <-> ${row.files[j]}`;
    ownershipPairCounts[pair]=(ownershipPairCounts[pair]||0)+1;
  }
}
const ownershipPairBaseline=Object.freeze({
  'src/styles/composition.css <-> src/styles/foundation.css':10,
  'src/features/navigation/navigation.css <-> src/styles/foundation.css':1,
  'src/features/navigation/navigation.css <-> src/styles/composition.css':8,
  'src/features/person/person.css <-> src/styles/composition.css':6,
  'src/features/person/person.css <-> src/styles/foundation.css':12,
  'src/features/research/research.css <-> src/styles/foundation.css':9,
  'src/features/tree/tree.css <-> src/styles/composition.css':9,
  'src/styles/foundation.css <-> src/styles/interaction.css':8,
  'src/features/tree/tree.css <-> src/styles/interaction.css':6,
  'src/features/navigation/mobile-foundation.css <-> src/styles/foundation.css':5,
  'src/features/navigation/navigation.css <-> src/features/research/research.css':4,
  'src/features/research/research.css <-> src/features/tree/tree.css':3,
  'src/features/research/research.css <-> src/styles/interaction.css':3,
  'src/features/person/person.css <-> src/features/research/research.css':3,
  'src/features/tree/tree.css <-> src/styles/foundation.css':2,
  'src/styles/composition.css <-> src/styles/interaction.css':2,
  'src/features/navigation/navigation.css <-> src/styles/interaction.css':2,
  'src/features/navigation/mobile-foundation.css <-> src/styles/tokens.css':1,
  'src/styles/composition.css <-> src/styles/experience.css':1,
  'src/styles/experience.css <-> src/styles/foundation.css':1,
  'src/features/research/research.css <-> src/styles/composition.css':1,
  'src/features/navigation/mobile-foundation.css <-> src/features/navigation/navigation.css':1,
  'src/features/navigation/navigation.css <-> src/features/tree/tree.css':1,
  'src/features/person/person.css <-> src/features/tree/tree.css':1,
});
const printSelectorOverlaps=duplicateSelectors
  .filter(row=>row.files.some(file=>file.endsWith('/print.css')||file.endsWith('print.css')));
const responsiveSelectorOverlaps=duplicateSelectors
  .filter(row=>row.files.some(file=>responsiveOwnershipFiles.has(file)));

const canonicalSelectorOwners=new Map(Object.entries({
  'body':'src/styles/foundation.css',
  'html':'src/styles/foundation.css',
  ':root':'src/styles/tokens.css',
  '.edition':'src/features/navigation/navigation.css',
  '.filters':'src/styles/composition.css',
  '.graph-shell':'src/features/tree/tree.css',
  '.main':'src/styles/composition.css',
  '.page-heading h1':'src/styles/composition.css',
  '.person-card':'src/features/person/person.css',
  '.v162-journey-head>a':'src/features/navigation/navigation.css',
  '.v162-places':'src/features/navigation/navigation.css',
  '.v17-home-hero':'src/styles/composition.css',
  '.v17-person-nav':'src/features/person/person.css',
  '.v17-primary-actions':'src/styles/composition.css',
  '.action':'src/styles/foundation.css'
}));
const topSelectorOwnerViolations=[...canonicalSelectorOwners].flatMap(([selector,owner])=>{
  const files=[...(baseSelectorFiles.get(selector)||[])].filter(file=>canonicalOwnerFiles.has(file));
  const foreign=files.filter(file=>file!==owner);
  return foreign.length?[{selector,owner,foreignOwners:foreign.sort()}]:[];
});
const deadCandidates=selectorRows.filter(r=>{
  const tokenCount=r.classes.length+r.ids.length+r.attrs.length;
  if(tokenCount===0)return false;
  if(r.referenceFiles.length)return false;
  if(r.selector.trim()==='[hidden]')return false; // semantic platform state toggled via the hidden IDL property
  if(/:(?:hover|focus|focus-visible|active|visited|checked|disabled|enabled|open|target|empty|first|last|nth|not|is|where|has)/.test(r.selector))return false;
  return true;
});
const highSpecificity=selectorRows.filter(r=>{const [a,b]=r.specificity.split(',').map(Number);return a>=2||b>=6;}).sort((x,y)=>{const a=x.specificity.split(',').map(Number),b=y.specificity.split(',').map(Number);return b[0]-a[0]||b[1]-a[1];});
const legacyVersionedClassMap=new Map();
for(const row of selectorRows){
  for(const className of row.classes.filter(x=>/^v\d{2,}(?:-|$)/i.test(x))){
    const item=legacyVersionedClassMap.get(className)||{className,cssFiles:new Set(),referenceFiles:new Set(),selectors:new Set()};
    item.cssFiles.add(row.file);
    for(const ref of row.referenceFiles)item.referenceFiles.add(ref);
    item.selectors.add(row.selector);
    legacyVersionedClassMap.set(className,item);
  }
}
const legacyVersionedClasses=[...legacyVersionedClassMap.values()]
  .map(item=>({
    className:item.className,
    cssFiles:[...item.cssFiles].sort(),
    referenceFiles:[...item.referenceFiles].sort(),
    selectors:[...item.selectors].sort()
  }))
  .sort((a,b)=>b.referenceFiles.length-a.referenceFiles.length||b.selectors.length-a.selectors.length||a.className.localeCompare(b.className));
const liveLegacyVersionedClasses=legacyVersionedClasses.filter(item=>item.referenceFiles.length>0);
const cssOnlyLegacyVersionedClasses=legacyVersionedClasses.filter(item=>item.referenceFiles.length===0);

const jsHtmlClassTokens=[...usage.classRefs.keys()].sort();
const dynamicClassPrefixes=[...usage.dynamicClassPrefixRefs.keys()].sort();
const jsHtmlIdTokens=[...usage.idRefs.keys()].sort();
const jsHtmlAttrTokens=[...usage.attrRefs.keys()].sort();
const unstyledClasses=jsHtmlClassTokens.filter(x=>!cssClasses.has(x));
const unstyledIds=jsHtmlIdTokens.filter(x=>!cssIds.has(x));
const usageCorpus=usageFiles.map(file=>fs.readFileSync(file,'utf8')).join('\n');
const dynamicCustomProperties=new Set([...usageCorpus.matchAll(/--[\w-]+/g)].map(m=>m[0]));
const undefinedCustomProperties=[...customUsed.keys()].filter(x=>!customDefined.has(x)).sort();
const fallbackOnlyCustomProperties=undefinedCustomProperties.filter(name=>activeCss.some(file=>new RegExp('var\\(\\s*'+name+'\\s*,').test(read(file))));
const dynamicDefinedCustomProperties=undefinedCustomProperties.filter(name=>dynamicCustomProperties.has(name));
const unsafeUndefinedCustomProperties=undefinedCustomProperties.filter(name=>!fallbackOnlyCustomProperties.includes(name)&&!dynamicDefinedCustomProperties.includes(name));
const unusedCustomProperties=[...customDefined.keys()].filter(x=>!customUsed.has(x)).sort();

let inlineStyleAttributes=0,stylePropertyWrites=0,styleBlocks=0;
for(const file of usageFiles){
  const src=fs.readFileSync(file,'utf8');
  inlineStyleAttributes+=(src.match(/\bstyle\s*=\s*["'\`]/g)||[]).length;
  stylePropertyWrites+=(src.match(/\.style(?:\.|\[|\.setProperty)/g)||[]).length;
  styleBlocks+=(src.match(/<style\b/gi)||[]).length;
}

const totals={
  activeCssFiles:activeCss.length,
  repositoryCssFiles:repoCss.length,
  orphanCssFiles:orphanCss.length,
  releaseNumberedCssFiles:releaseNumberedCss.length,
  cssBytes:Object.values(cssStats).reduce((n,x)=>n+x.bytes,0),
  selectors:selectorRows.length,
  duplicateSelectorsAcrossFiles:duplicateSelectors.length,
  ownershipDuplicateSelectorsAcrossFiles:ownershipDuplicateSelectors.length,
  printSelectorOverlaps:printSelectorOverlaps.length,
  responsiveSelectorOverlaps:responsiveSelectorOverlaps.length,
  topSelectorOwnerViolations:topSelectorOwnerViolations.length,
  deadSelectorCandidates:deadCandidates.length,
  highSpecificitySelectors:highSpecificity.length,
  importantDeclarations:Object.values(cssStats).reduce((n,x)=>n+x.important,0),
  legacyClassArms:Object.values(cssStats).reduce((n,x)=>n+x.legacyClasses,0),
  legacyVersionedClassTokens:legacyVersionedClasses.length,
  liveLegacyVersionedClassTokens:liveLegacyVersionedClasses.length,
  cssOnlyLegacyVersionedClassTokens:cssOnlyLegacyVersionedClasses.length,
  unstyledRuntimeOrMarkupClasses:unstyledClasses.length,
  undefinedCustomProperties:undefinedCustomProperties.length,
  unsafeUndefinedCustomProperties:unsafeUndefinedCustomProperties.length,
  fallbackOnlyCustomProperties:fallbackOnlyCustomProperties.length,
  dynamicDefinedCustomProperties:dynamicDefinedCustomProperties.length,
  unusedCustomProperties:unusedCustomProperties.length,
  inlineStyleAttributes,
  stylePropertyWrites,
  styleBlocks
};

const report={
  generatedAt:new Date().toISOString(),
  entryCss,
  activeCss,
  orphanCss,
  releaseNumberedCss,
  totals,
  files:cssStats,
  ownershipPairBaseline,
  ownershipPairCounts:Object.fromEntries(Object.entries(ownershipPairCounts).sort((a,b)=>b[1]-a[1])),
  duplicateSelectors:duplicateSelectors.slice(0,500),
  deadSelectorCandidates:deadCandidates.slice(0,1000),
  highSpecificitySelectors:highSpecificity.slice(0,500),
  legacyVersionedClasses,
  unstyledClasses:unstyledClasses.slice(0,1000),
  unstyledIds:unstyledIds.slice(0,500),
  dynamicClassPrefixes,
  undefinedCustomProperties,
  unsafeUndefinedCustomProperties,
  fallbackOnlyCustomProperties,
  dynamicDefinedCustomProperties,
  unusedCustomProperties,
  notes:[
    'Dead selector candidates are conservative static-analysis candidates, not automatic deletion instructions.',
    'A selector is not marked dead when any concrete class/id/data-attribute token is referenced by HTML or JavaScript.',
    'Pseudo-state selectors are excluded from dead-candidate classification.',
    'Class usage scanning includes HTML class attributes, template strings, className assignments, classList string literals, selector APIs, and dynamic class prefixes such as state-* or priority-*.'
  ]
};

function md(){
  const lines=[
    '# CSS usage audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    '| Metric | Count |',
    '| --- | ---: |',
    ...Object.entries(totals).map(([k,v])=>`| ${k} | ${v} |`),
    '',
    '## Active CSS import closure',
    '',
    ...activeCss.map(f=>`- \`${f}\` — ${cssStats[f]?.bytes??0} bytes, ${cssStats[f]?.selectors??0} selectors, ${cssStats[f]?.referencedSelectors??0} referenced, ${cssStats[f]?.unreferencedSelectors??0} unreferenced, ${cssStats[f]?.important??0} !important, ${cssStats[f]?.legacyClasses??0} legacy class arms`),
    '',
    '## Orphan CSS files',
    '',
    ...(orphanCss.length?orphanCss.map(f=>`- \`${f}\``):['None.']),
    '',
    '## Release-numbered CSS filenames',
    '',
    ...(releaseNumberedCss.length?releaseNumberedCss.map(f=>`- \`${f}\``):['None.']),
    '',
    '## Legacy release-numbered class inventory',
    '',
    `Unique release-numbered CSS class tokens: ${legacyVersionedClasses.length}; referenced by HTML/runtime: ${liveLegacyVersionedClasses.length}; CSS-only: ${cssOnlyLegacyVersionedClasses.length}.`,
    '',
    ...legacyVersionedClasses.slice(0,200).map(item=>`- \`.${item.className}\` — CSS: ${item.cssFiles.join(', ')}; refs: ${item.referenceFiles.length?item.referenceFiles.join(', '):'none'}; selector arms: ${item.selectors.length}`),
    '',
    '## Highest-specificity selectors',
    '',
    ...highSpecificity.slice(0,60).map(r=>`- \`${r.specificity}\` ${r.file}: \`${r.selector}\``),
    '',
    '## Duplicate selectors across owned files',
    '',
    ...duplicateSelectors.slice(0,80).map(r=>`- \`${r.selector}\` — ${r.files.join(', ')}`),
    '',
    '## Dead-selector candidates',
    '',
    ...deadCandidates.slice(0,120).map(r=>`- ${r.file}: \`${r.selector}\` (unresolved: ${r.unresolvedTokens.join(', ')})`),
    '',
    '## Runtime/markup classes with no matching CSS class selector',
    '',
    ...(unstyledClasses.length?unstyledClasses.slice(0,150).map(x=>`- \`.${x}\``):['None.']),
    '',
    '## Custom properties',
    '',
    `Undefined in CSS: ${undefinedCustomProperties.length}; unsafe undefined: ${unsafeUndefinedCustomProperties.length}; fallback-only: ${fallbackOnlyCustomProperties.length}; dynamically defined: ${dynamicDefinedCustomProperties.length}; unused definitions: ${unusedCustomProperties.length}.`,
    '',
    ...unsafeUndefinedCustomProperties.slice(0,100).map(x=>`- unsafe undefined: \`${x}\``),
    ...fallbackOnlyCustomProperties.slice(0,100).map(x=>`- fallback-only: \`${x}\``),
    ...dynamicDefinedCustomProperties.slice(0,100).map(x=>`- dynamically defined: \`${x}\``),
    ...unusedCustomProperties.slice(0,100).map(x=>`- unused definition: \`${x}\``),
    '',
    '## Inline-style pressure',
    '',
    `HTML/template style attributes: ${inlineStyleAttributes}; JavaScript style property writes: ${stylePropertyWrites}; <style> blocks: ${styleBlocks}.`,
    '',
    '## Interpretation',
    '',
    ...report.notes.map(x=>`- ${x}`)
  ];
  return lines.join('\n')+'\n';
}

if(args.has('--write')){
  fs.mkdirSync(reportDir,{recursive:true});
  fs.writeFileSync(path.join(reportDir,'css-usage-audit.json'),JSON.stringify(report,null,2));
  fs.writeFileSync(path.join(reportDir,'css-usage-audit.md'),md());
}
console.log(JSON.stringify({totals,orphanCss,unusedCustomProperties,topDead:deadCandidates.slice(0,25),topDuplicates:duplicateSelectors.slice(0,20),topOwnershipDuplicates:ownershipDuplicateSelectors.slice(0,25),topPrintOverlaps:printSelectorOverlaps.slice(0,20),topResponsiveOverlaps:responsiveSelectorOverlaps.slice(0,20),topSelectorOwnerViolations,topLegacyVersionedClasses:legacyVersionedClasses.slice(0,50)},null,2));

if(args.has('--strict')){
  let failed=false;
  const budgets={
    // v26.1 certified candidate ceilings. These are downward-only debt ratchets;
    // raising one requires an explicit reviewed baseline change.
    cssBytes:493616,
    duplicateSelectorsAcrossFiles:369,
    ownershipDuplicateSelectorsAcrossFiles:94,
    topSelectorOwnerViolations:0,
    deadSelectorCandidates:0,
    highSpecificitySelectors:107,
    importantDeclarations:1143,
    legacyClassArms:1775,
    liveLegacyVersionedClassTokens:201,
    unstyledRuntimeOrMarkupClasses:135,
    unusedCustomProperties:0,
    inlineStyleAttributes:5,
    stylePropertyWrites:9,
    styleBlocks:3
  };
  if(orphanCss.length){console.error(`CSS usage audit failed: ${orphanCss.length} orphan CSS file(s): ${orphanCss.join(', ')}`);failed=true;}
  if(releaseNumberedCss.length){console.error(`CSS usage audit failed: release-numbered CSS filenames are prohibited: ${releaseNumberedCss.join(', ')}`);failed=true;}
  if(unsafeUndefinedCustomProperties.length){console.error(`CSS usage audit failed: unsafe undefined custom properties: ${unsafeUndefinedCustomProperties.join(', ')}`);failed=true;}
  for(const [metric,limit] of Object.entries(budgets)){if((totals[metric]??0)>limit){console.error(`CSS usage audit failed: ${metric}=${totals[metric]} exceeds budget ${limit}`);failed=true;}}
  for(const [pair,count] of Object.entries(ownershipPairCounts)){
    const limit=ownershipPairBaseline[pair];
    if(limit===undefined){
      console.error(`CSS usage audit failed: new canonical ownership pair "${pair}" has ${count} duplicate selector(s)`);
      failed=true;
    }else if(count>limit){
      console.error(`CSS usage audit failed: canonical ownership pair "${pair}" has ${count} duplicate selector(s), exceeding budget ${limit}`);
      failed=true;
    }
  }
  if(failed)process.exit(1);
}
