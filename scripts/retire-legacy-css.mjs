import fs from 'node:fs';
import path from 'node:path';

const legacyFiles=[
  'v11.css','v11-nav.css','v11-2.css','v11-3.css','v11-4.css','v11-6.css',
  'v12.css','v12-2.css','v12-3.css','v12-4.css','v12-5.css','v12-6.css','v12-6-1.css','v12-6-2.css','v12-7.css','v12-8.css','v12-9.css','v12-9-1.css',
  'v13-0.css','dashboard-v13-2.css','media-page-v13-4.css','experience-v13-5.css','v14.css',
  'v15.css','v15-1.css','v15-family-focus.css','platform-v13.css','v15-5.css','v15-6.css','v15-8.css',
  'src/styles/v16.css','src/styles/v16-1.css','src/styles/v16-2.css'
];

const semanticModules=[
  'tokens','base','shell','navigation','home','branding','people','person','stories','tree',
  'unified-family','media','explore','research','record-ingestion','mobile-family','responsive',
  'elevation','branches','archive-shell'
];

const moduleRules=Object.fromEntries(semanticModules.map(name=>[name,[]]));
const seen=Object.fromEntries(semanticModules.map(name=>[name,new Set()]));
let selectorArms=0;
let migratedSelectorArms=0;
let prunedSelectorArms=0;
let atRulesPreserved=0;

function walk(dir,files=[]){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules','dist','playwright-report','test-results'].includes(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())walk(full,files);
    else files.push(full);
  }
  return files;
}

const sourceHaystack=walk('.')
  .filter(file=>!file.endsWith('.css')&&!legacyFiles.includes(file.replaceAll('\\','/')))
  .filter(file=>/\.(?:html|js|mjs|mts|json|md|toml|yml|yaml)$/.test(file))
  .map(file=>{try{return fs.readFileSync(file,'utf8')}catch{return ''}})
  .join('\n');

function stripComments(css){
  return css.replace(/\/\*[\s\S]*?\*\//g,'');
}

function splitSelectorList(selector){
  const out=[];
  let buf='',round=0,square=0,quote='';
  for(let i=0;i<selector.length;i++){
    const ch=selector[i];
    if(quote){buf+=ch;if(ch===quote&&selector[i-1]!=='\\')quote='';continue;}
    if(ch==='"'||ch==="'"){quote=ch;buf+=ch;continue;}
    if(ch==='(')round++;
    if(ch===')')round=Math.max(0,round-1);
    if(ch==='[')square++;
    if(ch===']')square=Math.max(0,square-1);
    if(ch===','&&round===0&&square===0){if(buf.trim())out.push(buf.trim());buf='';continue;}
    buf+=ch;
  }
  if(buf.trim())out.push(buf.trim());
  return out;
}

const dynamicPrefixes=['state-','priority-','route-','view-','family-','person-','media-','graph-','branch-','claim-','source-','task-','audit-','gate-','timeline-','relationship-','tree-','is-','has-','mobile-','record-'];
function selectorIsLive(selector){
  if(/(^|[\s>+~,(])(?::root|html|body|\*)(?=$|[\s>+~.:#[,(])/.test(selector))return true;
  const tokens=[...selector.matchAll(/[.#]([_a-zA-Z][\w-]*)/g)].map(m=>m[1]);
  if(tokens.length===0)return true;
  return tokens.some(token=>sourceHaystack.includes(token)||dynamicPrefixes.some(prefix=>token.startsWith(prefix)));
}

function classify(selector,context=''){
  const s=`${selector} ${context}`.toLowerCase();
  if(selector.includes(':root'))return 'tokens';
  if(/(?:archive-|archive\b)/.test(s))return 'archive-shell';
  if(/(?:branch-|branch\b)/.test(s))return 'branches';
  if(/(?:elevat|glass|depth-|shadow-card)/.test(s))return 'elevation';
  if(/(?:family-mobile|mobile-family|mobile-dock|mobile-sheet|mobile-nav)/.test(s))return 'mobile-family';
  if(/(?:record-|ingest|import-|drop-zone|record\b)/.test(s))return 'record-ingestion';
  if(/(?:research|claim-|source-|task-|audit|gate-|conflict|negative-|provenance|evidence-|queue)/.test(s))return 'research';
  if(/(?:explore|map-|geograph|place-|migration-)/.test(s))return 'explore';
  if(/(?:media-|photo|gallery|portrait|document-viewer|viewer)/.test(s))return 'media';
  if(/(?:unified-|family-focus|family-mode|family-hub|family-landing)/.test(s))return 'unified-family';
  if(/(?:graph-|family-graph|tree-|pedigree|relationship-|edge\b|node-name|node-state)/.test(s))return 'tree';
  if(/(?:story|stories|narrative)/.test(s))return 'stories';
  if(/(?:timeline|person-hero|person-summary|person-detail|local-nav|facts\b|reference-list|detail-hero|life-)/.test(s))return 'person';
  if(/(?:people-|person-card|person-open|mini-person)/.test(s))return 'people';
  if(/(?:dashboard|metric|home-|landing-|welcome-|identity-panel|state-bars)/.test(s))return 'home';
  if(/(?:brand\b|branding|monogram|wordmark|logo)/.test(s))return 'branding';
  if(/(?:sidebar|topbar|nav\b|menu-|breadcrumb|skip\b)/.test(s))return 'navigation';
  if(/(?:shell\b|workspace|page-heading|section-title|panel\b|notice|filters|toolbar|legend|action\b|badge\b|button|input|select|dialog)/.test(s))return 'shell';
  if(context.includes('@media'))return 'responsive';
  return 'base';
}

function findMatchingBrace(text,open){
  let depth=0,quote='';
  for(let i=open;i<text.length;i++){
    const ch=text[i];
    if(quote){if(ch===quote&&text[i-1]!=='\\')quote='';continue;}
    if(ch==='"'||ch==="'"){quote=ch;continue;}
    if(ch==='{')depth++;
    else if(ch==='}'&&--depth===0)return i;
  }
  return -1;
}

function parseBlocks(css){
  const blocks=[];
  let i=0;
  while(i<css.length){
    while(i<css.length&&/\s/.test(css[i]))i++;
    if(i>=css.length)break;
    const brace=css.indexOf('{',i);
    const semi=css.indexOf(';',i);
    if(semi!==-1&&(brace===-1||semi<brace)){
      const stmt=css.slice(i,semi+1).trim();
      if(stmt)blocks.push({prelude:stmt,body:null});
      i=semi+1;
      continue;
    }
    if(brace===-1)break;
    const close=findMatchingBrace(css,brace);
    if(close===-1)throw new Error(`Unbalanced CSS near: ${css.slice(i,i+120)}`);
    blocks.push({prelude:css.slice(i,brace).trim(),body:css.slice(brace+1,close)});
    i=close+1;
  }
  return blocks;
}

function emit(module,text){
  const normalized=text.replace(/\s+/g,' ').trim();
  if(!normalized||seen[module].has(normalized))return;
  seen[module].add(normalized);
  moduleRules[module].push(text.trim());
}

function migrate(css,contexts=[]){
  for(const block of parseBlocks(stripComments(css))){
    const prelude=block.prelude.trim();
    if(block.body===null){
      const module=classify(prelude,contexts.join(' '));
      emit(module,wrapContexts(`${prelude}`,contexts));
      atRulesPreserved++;
      continue;
    }
    if(/^@(media|supports|container|layer|scope)\b/i.test(prelude)){
      migrate(block.body,[...contexts,prelude]);
      continue;
    }
    if(/^@/i.test(prelude)){
      const module=classify(prelude,contexts.join(' '));
      emit(module,wrapContexts(`${prelude}{${block.body.trim()}}`,contexts));
      atRulesPreserved++;
      continue;
    }
    const arms=splitSelectorList(prelude);
    selectorArms+=arms.length;
    const live=arms.filter(selectorIsLive);
    migratedSelectorArms+=live.length;
    prunedSelectorArms+=arms.length-live.length;
    if(live.length===0)continue;
    const selector=live.join(',');
    const module=classify(selector,contexts.join(' '));
    emit(module,wrapContexts(`${selector}{${block.body.trim()}}`,contexts));
  }
}

function wrapContexts(rule,contexts){
  return [...contexts].reverse().reduce((inner,ctx)=>`${ctx}{${inner}}`,rule);
}

const existingLegacy=legacyFiles.filter(fs.existsSync);
if(existingLegacy.length===0){
  console.log('Legacy CSS retirement already complete.');
  process.exit(0);
}

for(const file of existingLegacy)migrate(fs.readFileSync(file,'utf8'));

for(const module of semanticModules){
  const file=`src/styles/${module}.css`;
  if(!fs.existsSync(file))continue;
  const existing=fs.readFileSync(file,'utf8').trim();
  const migrated=moduleRules[module].join('\n\n');
  if(!migrated)continue;
  const banner=`/* Migrated live selectors from retired release CSS.\n * These rules remain below the semantic ownership boundary and are now\n * maintained by this module; obsolete selector arms were removed during migration. */`;
  fs.writeFileSync(file,`${banner}\n${migrated}\n\n${existing}\n`);
}

for(const file of existingLegacy)fs.rmSync(file);

const buildPath='scripts/build.mjs';
let build=fs.readFileSync(buildPath,'utf8');
build=build.replace(/const legacyStyleSources=\[[\s\S]*?await writeFile\(generatedLegacyStyle,[\s\S]*?\);\n\n/,"const legacyStyleSources=[];\nconst generatedLegacyStyle=null;\n\n");
build=build.replace(/compatibilityBoundary:generatedLegacyStyle,\n\s*legacySourceCount:legacyStyleSources\.length/,"compatibilityBoundary:null,\n    legacySourceCount:0");
fs.writeFileSync(buildPath,build);

const indexPath='src/styles/index.css';
let index=fs.readFileSync(indexPath,'utf8');
index=index.replace(/@import '\.\/legacy-compat\.generated\.css';\s*/,'');
if(!index.includes("@import './record-ingestion.css';"))index=index.replace("@import './research.css';", "@import './research.css';\n@import './record-ingestion.css';");
index=index.replace(/The production cascade has one explicit historical compatibility boundary\.[\s\S]*?do not add new version-numbered CSS\./,"Historical release CSS has been retired. Every live selector is owned by a semantic module; do not add version-numbered CSS or compatibility layers.");
fs.writeFileSync(indexPath,index);

const ignorePath='.gitignore';
let ignore=fs.readFileSync(ignorePath,'utf8');
ignore=ignore.replace(/^src\/styles\/legacy-compat\.generated\.css\s*$/m,'').replace(/\n{3,}/g,'\n\n');
fs.writeFileSync(ignorePath,ignore);

const report={
  retiredFiles:existingLegacy.length,
  originalSelectorArms:selectorArms,
  migratedSelectorArms,
  prunedSelectorArms,
  preservedAtRules:atRulesPreserved,
  semanticModules:Object.fromEntries(semanticModules.map(name=>[name,moduleRules[name].length])),
  generatedAt:new Date().toISOString()
};
fs.writeFileSync('public/css-retirement-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
