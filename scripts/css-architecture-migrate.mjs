import fs from'node:fs';
import path from'node:path';

const ROOT='src/styles';
const sources=['base.css','responsive.css','redesign.css'];
const owners=['base.css','components.css','shell.css','navigation.css','home.css','people.css','person.css','stories.css','tree-advanced.css','media.css','explore.css','research.css','record-ingestion.css','unified-family.css','branches.css','archive-shell.css'];
const read=name=>fs.existsSync(path.join(ROOT,name))?fs.readFileSync(path.join(ROOT,name),'utf8'):'';
const write=(name,text)=>fs.writeFileSync(path.join(ROOT,name),text.trimEnd()+'\n');

function scan(text,context=[]){
  const out=[];let i=0;
  while(i<text.length){
    while(i<text.length&&/\s/.test(text[i]))i++;
    if(i>=text.length)break;
    if(text.startsWith('/*',i)){const e=text.indexOf('*/',i+2);i=e<0?text.length:e+2;continue;}
    let start=i,q=null,p=0;
    while(i<text.length){const c=text[i];if(q){if(c==='\\')i+=2;else{if(c===q)q=null;i++;}continue;}if(c==='"'||c==="'"){q=c;i++;continue;}if(c==='(')p++;else if(c===')')p--;else if(!p&&(c==='{'||c===';'))break;i++;}
    const header=text.slice(start,i).trim();if(!header){i++;continue;}if(text[i]===';'){i++;continue;}if(text[i]!=='{')break;
    const open=i++;let depth=1;q=null;
    while(i<text.length&&depth){const c=text[i];if(q){if(c==='\\')i+=2;else{if(c===q)q=null;i++;}continue;}if(c==='"'||c==="'"){q=c;i++;continue;}if(text.startsWith('/*',i)){const e=text.indexOf('*/',i+2);i=e<0?text.length:e+2;continue;}if(c==='{')depth++;else if(c==='}')depth--;i++;}
    const body=text.slice(open+1,i-1);
    if(/^@(media|supports|container|layer)\b/i.test(header))out.push(...scan(body,[...context,header]));else out.push({header,body,context});
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
  return'components.css';
}

function wrap(rule){let text=`${rule.header}{${rule.body.trim()}}`;for(let i=rule.context.length-1;i>=0;i--)text=`${rule.context[i]}{\n${text}\n}`;return text;}
const breakpointMap={1180:1200,1100:1024,980:1024,900:1024,860:768,820:768,800:768,760:768,720:768,620:600,560:600,520:600,480:600,430:420};
function normalize(text,{tokens=false}={}){
  text=text.replace(/!important\b/g,'');
  text=text.replace(/font-size:\s*(\d+(?:\.\d+)?)px/gi,(m,n)=>Number(n)>0&&Number(n)<12?`font-size:12px`:m);
  text=text.replace(/(max-width\s*:\s*)(1180|1100|980|900|860|820|800|760|720|620|560|520|480|430)px/gi,(m,p,n)=>`${p}${breakpointMap[n]}px`);
  if(!tokens){for(const[from,to]of [['#fffdf8','var(--paper)'],['#f4f1e9','var(--bg)'],['#ddd9ce','var(--line)'],['#c9c7bc','var(--line-strong)'],['#123f34','var(--green)'],['#1d5747','var(--green-2)'],['#f8f5ee','var(--surface-soft)'],['#edf2ec','var(--surface-tint)'],['#192820','var(--ink)']])text=text.replace(new RegExp(from,'gi'),to);}
  return text.replace(/[ \t]+\n/g,'\n').replace(/\n{4,}/g,'\n\n\n');
}

const buckets=new Map(owners.map(name=>[name,[]]));
for(const source of sources){for(const rule of scan(read(source))){const owner=ownerFor(rule.header);buckets.get(owner).push(wrap(rule));}}

for(const file of owners.filter(file=>file!=='base.css')){
  const original=read(file).replace(/\n?\/\* CSS architecture consolidation:[\s\S]*$/,'').trimEnd();
  const moved=buckets.get(file)||[];
  write(file,normalize(`${original}${moved.length?`\n\n/* CSS architecture consolidation: declarations owned by this semantic module. */\n${moved.join('\n\n')}`:''}`));
}
write('base.css',normalize(`/* Application foundations only. Route and component presentation belong to semantic owners. */\n*{box-sizing:border-box}\nhtml{scroll-behavior:smooth}\n${(buckets.get('base.css')||[]).join('\n\n')}`));

let tokens=read('tokens.css');
if(!tokens.includes('--family-text-min-readable'))tokens=tokens.replace('  /* Typography. */',`  /* Readability and shared presentation semantics. */\n  --family-text-min-readable:.75rem;\n  --family-nav-bg:#143d33;\n  --family-nav-bg-deep:#0f332a;\n  --family-nav-active-bg:#f4eee0;\n  --family-focus-ring:#cba15c;\n  --family-overlay:rgba(255,253,248,.82);\n\n  /* Typography. */`);
write('tokens.css',normalize(tokens,{tokens:true}));

let index=read('index.css').replace(/@import '\.\/responsive\.css';\s*/,'').replace(/\n?\/\* Final visual composition layer\. \*\/\s*@import '\.\/redesign\.css';\s*/,'');
if(!index.includes("@import './components.css';"))index=index.replace("@import './base.css';", "@import './base.css';\n@import './components.css';");
index=index.replace(/\/\* Home's editorial responsive refinements[\s\S]*?\*\/\s*/,'/* Responsive behavior is colocated with semantic owners. */\n');
write('index.css',normalize(index));

for(const file of fs.readdirSync(ROOT).filter(f=>f.endsWith('.css')&&!['base.css','tokens.css','index.css','responsive.css','redesign.css'].includes(f)))write(file,normalize(read(file)));
for(const file of['responsive.css','redesign.css'])if(fs.existsSync(path.join(ROOT,file)))fs.rmSync(path.join(ROOT,file));

function declarations(body){return body.split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const p=x.indexOf(':');return p>0?x.slice(0,p).trim().toLowerCase():null;}).filter(Boolean);}
const imports=[...read('index.css').matchAll(/@import ['"]\.\/(.+?\.css)['"]/g)].map(m=>m[1]);
const seen=new Map();
for(const file of imports){for(const r of scan(read(file))){for(const sel of r.header.split(',').map(s=>s.trim()).filter(Boolean))for(const prop of declarations(r.body)){const key=`${r.context.join('>').replace(/\s+/g,' ')}|${sel}|${prop}`;if(!seen.has(key))seen.set(key,new Set());seen.get(key).add(file);}}}
const duplicates=[...seen].filter(([,files])=>files.size>1).map(([key,files])=>({key,files:[...files].sort()})).sort((a,b)=>a.key.localeCompare(b.key));
fs.writeFileSync(path.join(ROOT,'ownership-exceptions.json'),JSON.stringify({generatedBy:'css-architecture-migrate',duplicates},null,2)+'\n');
console.log(`CSS migration complete: retired responsive.css/redesign.css; ${duplicates.length} explicit cross-module ownership exceptions captured.`);
