import fs from'node:fs';
import path from'node:path';

const ROOT='src/styles';
const read=name=>fs.readFileSync(path.join(ROOT,name),'utf8');
const styleRoot=read('index.css');
const imports=[...styleRoot.matchAll(/@import ['"]\.\/(.+?\.css)['"]/g)].map(m=>m[1]);
const allowedBreakpoints=new Set([1200,1024,768,600,420]);
const bannedPalette=['#fffdf8','#f4f1e9','#ddd9ce','#c9c7bc','#123f34','#1d5747','#f8f5ee','#edf2ec','#192820'];

if(fs.existsSync(path.join(ROOT,'responsive.css'))||imports.includes('responsive.css'))throw new Error('responsive.css must remain retired; responsive rules belong to semantic owners.');
if(fs.existsSync(path.join(ROOT,'redesign.css'))||imports.includes('redesign.css'))throw new Error('redesign.css must remain retired; no final visual override layer is allowed.');
if(!imports.includes('components.css'))throw new Error('components.css must remain part of the semantic composition root.');

for(const file of imports){
  const text=read(file);
  for(const match of text.matchAll(/max-width\s*:\s*(\d+)px/g))if(!allowedBreakpoints.has(Number(match[1])))throw new Error(`Non-standard breakpoint ${match[1]}px in ${file}. Allowed: ${[...allowedBreakpoints].join(', ')}.`);
  for(const match of text.matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)px/g))if(Number(match[1])>0&&Number(match[1])<12)throw new Error(`Unreadable font-size ${match[1]}px in ${file}; 12px is the absolute CSS floor.`);
  if(/!important\b/.test(text))throw new Error(`Nonessential !important remains in ${file}.`);
  if(file!=='tokens.css')for(const color of bannedPalette)if(text.toLowerCase().includes(color))throw new Error(`Palette literal ${color} is owned by tokens.css, not ${file}.`);
}

const base=read('base.css');
for(const forbidden of[/data-route=/,/data-experience=/,/\.profile/,/\.graph/,/\.media/,/\.ri-/,/\.dashboard/,/\.family-/])if(forbidden.test(base))throw new Error(`base.css contains route/component selector ${forbidden}; base must remain foundations-only.`);

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
function properties(body){return body.split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const p=x.indexOf(':');return p>0?x.slice(0,p).trim().toLowerCase():null;}).filter(Boolean);}
function duplicates(){
  const seen=new Map();
  for(const file of imports){for(const rule of scan(read(file))){for(const selector of rule.header.split(',').map(s=>s.trim()).filter(Boolean)){for(const property of properties(rule.body)){const key=`${rule.context.join('>').replace(/\s+/g,' ')}|${selector}|${property}`;if(!seen.has(key))seen.set(key,new Set());seen.get(key).add(file);}}}}
  return[...seen].filter(([,files])=>files.size>1).map(([key,files])=>({key,files:[...files].sort()})).sort((a,b)=>a.key.localeCompare(b.key));
}

const current=duplicates();
const baselinePath=path.join(ROOT,'ownership-exceptions.json');
if(process.argv.includes('--write-baseline')){
  fs.writeFileSync(baselinePath,JSON.stringify({generatedBy:'css-architecture-audit',note:'Explicit cross-module ownership exceptions after the consolidation. New conflicts are release-blocking.',duplicates:current},null,2)+'\n');
  console.log(`Wrote ${current.length} explicit duplicate-ownership exceptions.`);
  process.exit(0);
}
const baseline=fs.existsSync(baselinePath)?JSON.parse(fs.readFileSync(baselinePath,'utf8')).duplicates||[]:[];
const allowed=new Set(baseline.map(item=>`${item.key}|${item.files.join(',')}`));
const unexpected=current.filter(item=>!allowed.has(`${item.key}|${item.files.join(',')}`));
if(unexpected.length)throw new Error(`New cross-module selector/property ownership conflicts:\n${unexpected.slice(0,40).map(x=>`${x.key} :: ${x.files.join(', ')}`).join('\n')}`);

console.log(`CSS architecture audit passed: ${imports.length} semantic modules; responsive/redesign layers retired; foundations, breakpoints, readable text, token ownership, specificity, and duplicate ownership are guarded.`);
