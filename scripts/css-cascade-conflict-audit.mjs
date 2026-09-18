import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=new Set(process.argv.slice(2));
const reportDir=path.join(root,'artifacts');
const entryCss='src/styles/index.css';

function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
function exists(rel){return fs.existsSync(path.join(root,rel));}

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
      visit(path.posix.normalize(path.posix.join(path.posix.dirname(normalized),m[1])));
    }
  }
  visit(entry);
  return [...seen];
}

function stripComments(s){return s.replace(/\/\*[\s\S]*?\*\//g,' ');}
function normalizeContext(h){return h.toLowerCase().replace(/\s+/g,'').replace(/0px/g,'0');}
function normalizeSelector(s){return s.replace(/\s+/g,' ').trim();}

function splitSelectors(header){
  const out=[];let start=0,quote='',escaped=false,paren=0,bracket=0;
  for(let i=0;i<=header.length;i++){
    const c=header[i]??',';
    if(quote){if(escaped){escaped=false;continue;}if(c==='\\'){escaped=true;continue;}if(c===quote)quote='';continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='(')paren++; else if(c===')')paren=Math.max(0,paren-1);
    else if(c==='[')bracket++; else if(c===']')bracket=Math.max(0,bracket-1);
    else if(c===','&&paren===0&&bracket===0){
      const s=normalizeSelector(header.slice(start,i));if(s)out.push(s);start=i+1;
    }
  }
  return out;
}

function parseDeclarations(body){
  const out=[];const src=stripComments(body);
  let quote='',escaped=false,paren=0,start=0;
  for(let i=0;i<=src.length;i++){
    const c=src[i]??';';
    if(quote){if(escaped){escaped=false;continue;}if(c==='\\'){escaped=true;continue;}if(c===quote)quote='';continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='('){paren++;continue;} if(c===')'){paren=Math.max(0,paren-1);continue;}
    if(c===';'&&paren===0){
      const decl=src.slice(start,i).trim();start=i+1;if(!decl)continue;
      const colon=decl.indexOf(':');if(colon<1)continue;
      const property=decl.slice(0,colon).trim().toLowerCase();
      let value=decl.slice(colon+1).trim();
      const important=/!important\s*$/i.test(value);
      value=value.replace(/!important\s*$/i,'').replace(/\s+/g,' ').trim();
      out.push({property,value,important});
    }
  }
  return out;
}

function walkRules(src,start=0,end=src.length,contexts=[]){
  const out=[];let i=start,headerStart=start,quote='',escaped=false;
  while(i<end){
    const c=src[i];
    if(quote){if(escaped){escaped=false;i++;continue;}if(c==='\\'){escaped=true;i++;continue;}if(c===quote)quote='';i++;continue;}
    if(c==='"'||c==="'"){quote=c;i++;continue;}
    if(c==='/'&&src[i+1]==='*'){const j=src.indexOf('*/',i+2);i=j<0?end:j+2;continue;}
    if(c===';'){headerStart=i+1;i++;continue;}
    if(c==='{'){
      const header=src.slice(headerStart,i).replace(/\/\*[\s\S]*?\*\//g,' ').trim();
      let depth=1,j=i+1,q='',esc=false,comment=false;
      for(;j<end&&depth;j++){
        const z=src[j],n=src[j+1];
        if(comment){if(z==='*'&&n==='/'){comment=false;j++;}continue;}
        if(q){if(esc){esc=false;continue;}if(z==='\\'){esc=true;continue;}if(z===q)q='';continue;}
        if(z==='/'&&n==='*'){comment=true;j++;continue;}
        if(z==='"'||z==="'"){q=z;continue;}
        if(z==='{')depth++; else if(z==='}')depth--;
      }
      const close=j-1;
      if(/^@(media|supports|container|layer)\b/i.test(header)){
        out.push(...walkRules(src,i+1,close,[...contexts,normalizeContext(header)]));
      }else if(header&&!header.startsWith('@')){
        const body=src.slice(i+1,close);
        if(!body.includes('{'))out.push({header,body,context:contexts.join('||')||'base'});
      }
      i=j;headerStart=j;continue;
    }
    i++;
  }
  return out;
}

const activeCss=importedCssClosure(entryCss).filter(f=>f!==entryCss);
const rows=[];
for(let fileIndex=0;fileIndex<activeCss.length;fileIndex++){
  const file=activeCss[fileIndex];
  const css=read(file);
  for(const rule of walkRules(css)){
    for(const selector of splitSelectors(rule.header)){
      for(const d of parseDeclarations(rule.body)){
        if(d.property.startsWith('--'))continue;
        rows.push({file,fileIndex,selector,context:rule.context,...d});
      }
    }
  }
}

const groups=new Map();
for(const row of rows){
  const key=`${row.selector}@@${row.property}@@${row.context}`;
  const list=groups.get(key)||[];list.push(row);groups.set(key,list);
}

const conflicts=[];
for(const list of groups.values()){
  const files=[...new Set(list.map(x=>x.file))];
  if(files.length<2)continue;
  const values=[...new Set(list.map(x=>(x.important?'!important ':'')+x.value))];
  if(values.length<2)continue;
  conflicts.push({
    selector:list[0].selector,
    property:list[0].property,
    context:list[0].context,
    files,
    values,
    declarations:list.map(x=>({file:x.file,value:x.value,important:x.important}))
  });
}

const pairCounts={};
for(const c of conflicts){
  const files=[...c.files].sort();
  for(let i=0;i<files.length;i++)for(let j=i+1;j<files.length;j++){
    const key=`${files[i]} ↔ ${files[j]}`;
    pairCounts[key]=(pairCounts[key]||0)+1;
  }
}

const totals={
  activeCssFiles:activeCss.length,
  declarations:rows.length,
  sameContextCrossFileConflicts:conflicts.length,
  baseContextConflicts:conflicts.filter(c=>c.context==='base').length
};

const report={
  generatedAt:new Date().toISOString(),
  entryCss,
  activeCss,
  totals,
  pairCounts:Object.fromEntries(Object.entries(pairCounts).sort((a,b)=>b[1]-a[1])),
  conflicts:conflicts.sort((a,b)=>a.selector.localeCompare(b.selector)||a.property.localeCompare(b.property))
};

function markdown(){
  const lines=[
    '# CSS cascade conflict audit','',
    `Generated: ${report.generatedAt}`,'',
    '## Summary','',
    '| Metric | Count |','| --- | ---: |',
    ...Object.entries(totals).map(([k,v])=>`| ${k} | ${v} |`),
    '','## Highest-conflict file pairs','',
    ...Object.entries(report.pairCounts).slice(0,30).map(([k,v])=>`- ${k}: **${v}**`),
    '','## Conflicts','',
    ...report.conflicts.slice(0,250).map(c=>`- \`${c.selector}\` / \`${c.property}\` / \`${c.context}\` — ${c.declarations.map(d=>`${d.file}: ${d.important?'!important ':''}${d.value}`).join(' | ')}`)
  ];
  return lines.join('\n')+'\n';
}

if(args.has('--write')){
  fs.mkdirSync(reportDir,{recursive:true});
  fs.writeFileSync(path.join(reportDir,'css-cascade-conflicts.json'),JSON.stringify(report,null,2));
  fs.writeFileSync(path.join(reportDir,'css-cascade-conflicts.md'),markdown());
}

console.log(JSON.stringify({totals,topPairs:Object.entries(report.pairCounts).slice(0,20)},null,2));

if(args.has('--strict')){
  const budget=333;
  if(totals.sameContextCrossFileConflicts>budget){
    console.error(`CSS cascade conflict audit failed: ${totals.sameContextCrossFileConflicts} conflicts exceed budget ${budget}`);
    process.exit(1);
  }
}
