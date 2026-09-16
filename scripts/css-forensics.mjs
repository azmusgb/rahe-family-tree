import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const stylesDir=path.join(root,'src','styles');
const liveFiles=['tokens.css','core.css','composition.css','experience.css','home-responsive.css','interaction.css','mobile.css','print.css'];
const args=new Set(process.argv.slice(2));

function scanTopLevelRules(css){
  const rules=[];
  let depth=0, quote='', escaped=false, comment=false;
  let blockStart=-1, headerStart=0, header='';
  for(let i=0;i<css.length;i++){
    const c=css[i], n=css[i+1];
    if(comment){ if(c==='*'&&n==='/'){comment=false;i++;} continue; }
    if(quote){
      if(escaped){escaped=false;continue;}
      if(c==='\\'){escaped=true;continue;}
      if(c===quote)quote='';
      continue;
    }
    if(c==='/'&&n==='*'){comment=true;i++;continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='{'){
      if(depth===0){
        blockStart=i;
        header=css.slice(headerStart,i).replace(/\/\*[\s\S]*?\*\//g,' ').trim();
      }
      depth++;
      continue;
    }
    if(c==='}'){
      depth--;
      if(depth<0)throw new Error('Unbalanced closing brace');
      if(depth===0&&blockStart>=0){
        const end=i+1;
        if(header&&!header.startsWith('@')){
          const body=css.slice(blockStart+1,i);
          if(!body.includes('{'))rules.push({header,body,start:blockStart-header.length,end});
        }
        blockStart=-1;
        header='';
        headerStart=end;
      }
      continue;
    }
    if(depth===0&&c===';')headerStart=i+1;
  }
  if(depth!==0)throw new Error('Unbalanced opening brace');
  return rules;
}

function parseDeclarations(body){
  const out=new Map();
  const source=body.replace(/\/\*[\s\S]*?\*\//g,' ');
  let quote='', escaped=false, paren=0, start=0;
  const parts=[];
  for(let i=0;i<=source.length;i++){
    const c=source[i]??';';
    if(quote){
      if(escaped){escaped=false;continue;}
      if(c==='\\'){escaped=true;continue;}
      if(c===quote)quote='';
      continue;
    }
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='('){paren++;continue;}
    if(c===')'){paren=Math.max(0,paren-1);continue;}
    if(c===';'&&paren===0){parts.push(source.slice(start,i));start=i+1;}
  }
  for(const raw of parts){
    const decl=raw.trim();
    if(!decl)continue;
    const colon=decl.indexOf(':');
    if(colon<1)continue;
    const property=decl.slice(0,colon).trim().toLowerCase();
    const value=decl.slice(colon+1).trim();
    const important=/!important\s*$/i.test(value);
    const comparableValue=value.replace(/!important\s*$/i,'').replace(/\s+/g,' ').trim();
    out.set(property,{important,value,comparableValue});
  }
  return out;
}

function normalizeSelector(header){return header.replace(/\s+/g,' ').trim();}

function findSafelySuperseded(css){
  const rules=scanTopLevelRules(css).map(rule=>({...rule,selector:normalizeSelector(rule.header),decls:parseDeclarations(rule.body)}));
  const groups=new Map();
  for(const rule of rules){
    if(!rule.selector||rule.decls.size===0)continue;
    const list=groups.get(rule.selector)||[];list.push(rule);groups.set(rule.selector,list);
  }
  const removable=[];
  for(const list of groups.values()){
    for(let i=0;i<list.length-1;i++){
      const earlier=list[i];
      for(let j=i+1;j<list.length;j++){
        const later=list[j];
        let fullyCovered=true;
        for(const [prop,meta] of earlier.decls){
          const replacement=later.decls.get(prop);
          // Automatic deletion is deliberately conservative: later declarations
          // must preserve both priority and the effective value. Different modern
          // syntax may rely on the earlier declaration as a compatibility fallback.
          if(!replacement||
             (meta.important&&!replacement.important)||
             replacement.comparableValue!==meta.comparableValue){
            fullyCovered=false;
            break;
          }
        }
        if(fullyCovered){removable.push({...earlier,replacedBy:later});break;}
      }
    }
  }
  return removable.sort((a,b)=>b.start-a.start);
}

function cleanupFile(css){
  const removable=findSafelySuperseded(css);
  let next=css;
  for(const rule of removable){
    // Remove only the rule block itself. Source comments remain as traceability markers.
    const blockStart=next.lastIndexOf(rule.header,rule.start);
    const start=blockStart>=0?blockStart:rule.start;
    next=next.slice(0,start)+next.slice(rule.end);
  }
  return {css:next,removed:removable};
}

function countSourceMarkers(css){return [...css.matchAll(/Source:\s*([^*\n]+\.css)/g)].map(m=>m[1].trim());}
function countLegacySelectors(css){return (css.match(/\.v\d{2,}[a-z0-9_-]*/gi)||[]).length;}
function countImportant(css){return (css.match(/!important\b/g)||[]).length;}

function fixBundle(file){
  const full=path.join(stylesDir,file);
  const original=fs.readFileSync(full,'utf8');
  const {css,removed}=cleanupFile(original);
  if(css!==original){
    fs.writeFileSync(full,css);
    console.log(`Removed ${removed.length} provably superseded top-level ${file} rule blocks.`);
    for(const rule of removed)console.log(`  ${normalizeSelector(rule.header)}`);
  }else console.log(`No provably superseded top-level ${file} rule blocks found.`);
}

function assertBundleClean(file){
  const css=fs.readFileSync(path.join(stylesDir,file),'utf8');
  const remaining=findSafelySuperseded(css);
  if(remaining.length){
    console.error(`${file} still contains ${remaining.length} safely removable top-level rule blocks.`);
    for(const rule of remaining)console.error(`  ${normalizeSelector(rule.header)}`);
    process.exitCode=1;
  }
}

if(args.has('--fix-core'))fixBundle('core.css');
if(args.has('--fix-composition'))fixBundle('composition.css');
if(args.has('--assert-core-clean'))assertBundleClean('core.css');
if(args.has('--assert-composition-clean'))assertBundleClean('composition.css');

const report={generatedAt:new Date().toISOString(),files:{}};
for(const file of liveFiles){
  const full=path.join(stylesDir,file);
  const css=fs.readFileSync(full,'utf8');
  const safe=findSafelySuperseded(css);
  report.files[file]={bytes:Buffer.byteLength(css),sourceSections:countSourceMarkers(css).length,legacySelectorArms:countLegacySelectors(css),importantDeclarations:countImportant(css),safelySupersededTopLevelRules:safe.length};
}

console.log(JSON.stringify(report,null,2));
