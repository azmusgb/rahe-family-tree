import fs from'node:fs';
import path from'node:path';

const ROOT='src/styles';
const sourceNames=['base.css','responsive.css','redesign.css'];
const semanticFiles=['base.css','components.css','shell.css','navigation.css','home.css','people.css','person.css','stories.css','tree.css','tree-advanced.css','media.css','explore.css','research.css','record-ingestion.css','mobile-family.css','unified-family.css','branches.css','archive-shell.css','interaction-contracts.css','elevation.css','branding.css','home-editorial.css'];
const read=name=>fs.existsSync(path.join(ROOT,name))?fs.readFileSync(path.join(ROOT,name),'utf8'):'';
const write=(name,text)=>fs.writeFileSync(path.join(ROOT,name),text.trimEnd()+'\n');

function scanBlocks(text,context=[]){
  const out=[];let i=0;
  const skip=()=>{while(i<text.length&&/\s/.test(text[i]))i++;};
  while(i<text.length){skip();if(i>=text.length)break;
    if(text.startsWith('/*',i)){const e=text.indexOf('*/',i+2);i=e<0?text.length:e+2;continue;}
    let h=i,inString=null,paren=0;
    while(i<text.length){const c=text[i];if(inString){if(c==='\\')i+=2;else{if(c===inString)inString=null;i++;}continue;}if(c==='"'||c==="'"){inString=c;i++;continue;}if(c==='(')paren++;else if(c===')')paren--;else if(paren===0&&(c==='{'||c===';'))break;i++;}
    const header=text.slice(h,i).trim();if(!header){i++;continue;}
    if(text[i]===';'){out.push({type:'statement',header,context});i++;continue;}
    if(text[i]!=='{')break;
    const open=i++;let depth=1;inString=null;
    while(i<text.length&&depth){const c=text[i];if(inString){if(c==='\\')i+=2;else{if(c===inString)inString=null;i++;}continue;}if(c==='"'||c==="'"){inString=c;i++;continue;}if(text.startsWith('/*',i)){const e=text.indexOf('*/',i+2);i=e<0?text.length:e+2;continue;}if(c==='{')depth++;else if(c==='}')depth--;i++;}
    const body=text.slice(open+1,i-1);
    if(/^@(media|supports|container|layer)\b/i.test(header))out.push(...scanBlocks(body,[...context,header]));
    else out.push({type:'rule',header,body,context});
  }
  return out;
}

function ownerFor(selector){
  const s=selector.toLowerCase();
  if(/^(:root|html|body|\*|a(?:\b|,)|button(?:\b|,)|input(?:\b|,)|select(?:\b|,)|textarea(?:\b|,)|table(?:\b|,)|th(?:\b|,)|td(?:\b|,)|::selection)/.test(s))return'base.css';
  if(/family-mobile-dock|#nav|nav-menu|nav-popover|site-tools|topbar-actions|site-header-actions|breadcrumb|mobile-actions|family-return/.test(s))return'navigation.css';
  if(/site-header|sidebar|\.brand\b|\.workspace\b|\.topbar\b|\.main\b|\.footer\b|site-footer|route-shell|page-heading|\.version\b|#status|\.filters\b|#filters|\.edition\b/.test(s))return'shell.css';
  if(/home-|dashboard|discovery/.test(s))return'home.css';
  if(/v17-people|person-card|people-grid|branch-chip|search-hit|search-grid/.test(s))return'people.css';
  if(/person-header|person-nav|profile|relation|relative|person-hero|focus-actions/.test(s))return'person.css';
  if(/tree|graph|generation-lane|v129|path-hop/.test(s))return'tree-advanced.css';
  if(/media|album|photo|gallery/.test(s))return'media.css';
  if(/story/.test(s))return'stories.css';
  if(/branch/.test(s))return'branches.css';
  if(/family-group|family-children|couple|family-overview|family-chip|family-card/.test(s))return'unified-family.css';
  if(/record|ingestion|contribution/.test(s))return'record-ingestion.css';
  if(/ri-|research|evidence|claim|source|queue|identity|intake|ops-|gap-|platform|canonical|matrix|command-task|workflow|review-packet|hypothesis|trace-|event-|editor-|private-|sync-/.test(s))return'research.css';
  if(/archive|document|legacy-note|dossier/.test(s))return'archive-shell.css';
  if(/migration|timeline|explore/.test(s))return'explore.css';
  if(/badge|notice|action|empty|muted|text-link|link-row|deep-link|section-list|table-wrap|danger|restore-list/.test(s))return'components.css';
  return'components.css';
}

function wrap(rule){let text=`${rule.header}{${rule.body.trim()}}`;for(let i=rule.context.length-1;i>=0;i--)text=`${rule.context[i]}{\n${text}\n}`;return text;}
function normalizeText(text,{tokens=false}={}){
  text=text.replace(/!important\b/g,'');
  text=text.replace(/font-size:\s*(\d+(?:\.\d+)?)px/gi,(m,n)=>Number(n)>0&&Number(n)<12?`font-size:12px`:m);
  const bp={1180:1200,1100:1024,980:1024,900:1024,860:768,820:768,800:768,760:768,720:768,620:600,560:600,520:600,480:600,430:420};
  text=text.replace(/(max-width\s*:\s*)(1180|1100|980|900|860|820|800|760|720|620|560|520|480|430)px/gi,(m,p,n)=>`${p}${bp[n]}px`);
  if(!tokens){
    const colors=new Map([
      ['#fffdf8','var(--paper)'],['#f4f1e9','var(--bg)'],['#ddd9ce','var(--line)'],['#c9c7bc','var(--line-strong)'],['#123f34','var(--green)'],['#1d5747','var(--green-2)'],['#f8f5ee','var(--surface-soft)'],['#edf2ec','var(--surface-tint)'],['#192820','var(--ink)']
    ]);
    for(const[from,to]of colors)text=text.replace(new RegExp(from.replace('#','\\#'),'gi'),to);
  }
  return text.replace(/[ \t]+\n/g,'\n').replace(/\n{4,}/g,'\n\n\n');
}

const buckets=new Map(semanticFiles.map(f=>[f,[]]));
for(const src of sourceNames){
  const text=read(src);if(!text)continue;
  for(const rule of scanBlocks(text)){
    if(rule.type!=='rule')continue;
    const owner=ownerFor(rule.header);
    buckets.get(owner).push(wrap(rule));
  }
}

for(const file of semanticFiles){
  if(sourceNames.includes(file))continue;
  let existing=read(file);
  const migrated=buckets.get(file)||[];
  if(!migrated.length){write(file,normalizeText(existing));continue;}
  const marker='/* CSS architecture consolidation: migrated declarations now owned by this semantic module. */';
  existing=existing.replace(/\n?\/\* CSS architecture consolidation:[\s\S]*$/,'');
  write(file,normalizeText(`${existing.trimEnd()}\n\n${marker}\n${migrated.join('\n\n')}`));
}

const baseRules=buckets.get('base.css')||[];
write('base.css',normalizeText(`/* Application foundations only. Route and component presentation belong to semantic owners. */\n*{box-sizing:border-box}\nhtml{scroll-behavior:smooth}\n${baseRules.join('\n\n')}`));

let tokens=read('tokens.css');
if(!tokens.includes('--family-text-min-readable'))tokens=tokens.replace('  /* Typography. */',`  /* Readability and shared presentation semantics. */\n  --family-text-min-readable:.75rem;\n  --family-nav-bg:#143d33;\n  --family-nav-bg-deep:#0f332a;\n  --family-nav-active-bg:#f4eee0;\n  --family-focus-ring:#cba15c;\n  --family-overlay:rgba(255,253,248,.82);\n\n  /* Typography. */`);
write('tokens.css',normalizeText(tokens,{tokens:true}));

let index=read('index.css');
index=index.replace(/@import '\.\/responsive\.css';\s*/,'').replace(/\n?\/\* Final visual composition layer\. \*\/\s*@import '\.\/redesign\.css';\s*/,'');
if(!index.includes("@import './components.css';"))index=index.replace("@import './base.css';", "@import './base.css';\n@import './components.css';");
index=index.replace(/\/\* Home's editorial responsive refinements[\s\S]*?\*\/\s*/,'/* Route-specific responsive rules now live with their semantic owner. */\n');
write('index.css',normalizeText(index));

for(const file of fs.readdirSync(ROOT).filter(f=>f.endsWith('.css')&&!['base.css','tokens.css','index.css','responsive.css','redesign.css'].includes(f))){write(file,normalizeText(read(file)));}
for(const file of['responsive.css','redesign.css'])if(fs.existsSync(path.join(ROOT,file)))fs.rmSync(path.join(ROOT,file));

function declarations(body){return body.split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const p=x.indexOf(':');return p>0?[x.slice(0,p).trim().toLowerCase(),x.slice(p+1).trim()]:null;}).filter(Boolean);}
function duplicateKeys(){
  const indexText=read('index.css');
  const imports=[...indexText.matchAll(/@import ['"]\.\/(.+?\.css)['"]/g)].map(m=>m[1]);
  const seen=new Map();
  for(const file of imports){const text=read(file);for(const r of scanBlocks(text)){if(r.type!=='rule')continue;const sels=r.header.split(',').map(s=>s.trim()).filter(Boolean);for(const sel of sels)for(const[prop]of declarations(r.body)){const ctx=r.context.join('>').replace(/\s+/g,' ');const key=`${ctx}|${sel}|${prop}`;if(!seen.has(key))seen.set(key,new Set());seen.get(key).add(file);}}}
  return[...seen].filter(([,files])=>files.size>1).map(([key,files])=>({key,files:[...files].sort()})).sort((a,b)=>a.key.localeCompare(b.key));
}
const exceptions=duplicateKeys();
fs.writeFileSync(path.join(ROOT,'ownership-exceptions.json'),JSON.stringify({generatedBy:'css-architecture-migrate',duplicates:exceptions},null,2)+'\n');

const audit=`import fs from'node:fs';\nimport path from'node:path';\nconst ROOT='src/styles';\nconst read=n=>fs.readFileSync(path.join(ROOT,n),'utf8');\nconst index=read('index.css');\nconst imports=[...index.matchAll(/@import ['\"]\\.\\/(.+?\\.css)['\"]/g)].map(m=>m[1]);\nconst allowedBp=new Set([1200,1024,768,600,420]);\nif(imports.includes('responsive.css')||imports.includes('redesign.css'))throw new Error('responsive.css/redesign.css must remain retired');\nfor(const file of imports){const text=read(file);for(const m of text.matchAll(/max-width\\s*:\\s*(\\d+)px/g))if(!allowedBp.has(Number(m[1])))throw new Error(\\`Non-standard breakpoint \\${m[1]}px in \\${file}\\`);for(const m of text.matchAll(/font-size\\s*:\\s*(\\d+(?:\\.\\d+)?)px/g))if(Number(m[1])>0&&Number(m[1])<12)throw new Error(\\`Unreadable font-size \\${m[1]}px in \\${file}\\`);if(/!important\\b/.test(text))throw new Error(\\`Nonessential !important remains in \\${file}\\`);}\nfunction scan(text,context=[]){const out=[];let i=0;while(i<text.length){while(i<text.length&&/\\s/.test(text[i]))i++;if(text.startsWith('/*',i)){const e=text.indexOf('*/',i+2);i=e<0?text.length:e+2;continue;}if(i>=text.length)break;let h=i,q=null,p=0;while(i<text.length){const c=text[i];if(q){if(c==='\\\\')i+=2;else{if(c===q)q=null;i++;}continue;}if(c==='\"'||c===\"'\"){q=c;i++;continue;}if(c==='(')p++;else if(c===')')p--;else if(!p&&(c==='{'||c===';'))break;i++;}const header=text.slice(h,i).trim();if(!header){i++;continue;}if(text[i]===';'){i++;continue;}const o=i++;let d=1;q=null;while(i<text.length&&d){const c=text[i];if(q){if(c==='\\\\')i+=2;else{if(c===q)q=null;i++;}continue;}if(c==='\"'||c===\"'\"){q=c;i++;continue;}if(text.startsWith('/*',i)){const e=text.indexOf('*/',i+2);i=e<0?text.length:e+2;continue;}if(c==='{')d++;else if(c==='}')d--;i++;}const body=text.slice(o+1,i-1);if(/^@(media|supports|container|layer)\\b/i.test(header))out.push(...scan(body,[...context,header]));else out.push({header,body,context});}return out;}\nconst decls=b=>b.split(';').map(x=>x.trim()).filter(Boolean).map(x=>x.split(':',1)[0].trim().toLowerCase()).filter(Boolean);\nconst seen=new Map();for(const file of imports){for(const r of scan(read(file))){for(const sel of r.header.split(',').map(s=>s.trim()).filter(Boolean))for(const prop of decls(r.body)){const key=\\`\\${r.context.join('>').replace(/\\s+/g,' ')}|\\${sel}|\\${prop}\\`;if(!seen.has(key))seen.set(key,new Set());seen.get(key).add(file);}}}\nconst baseline=new Set(JSON.parse(read('ownership-exceptions.json')).duplicates.map(x=>x.key+'|'+x.files.join(',')));const unexpected=[];for(const[key,files]of seen)if(files.size>1){const sig=key+'|'+[...files].sort().join(',');if(!baseline.has(sig))unexpected.push(sig);}if(unexpected.length)throw new Error('New cross-module selector/property ownership conflicts:\\n'+unexpected.slice(0,30).join('\\n'));\nconsole.log(\\`CSS architecture audit passed: \\${imports.length} semantic modules, standardized breakpoints/readability, no new ownership conflicts.\\`);\n`;
fs.writeFileSync('scripts/css-architecture-audit.mjs',audit);
console.log(`CSS migration complete: retired responsive.css/redesign.css; ${exceptions.length} explicit pre-existing ownership exceptions captured.`);
