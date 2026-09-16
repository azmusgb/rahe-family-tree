import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const stylesDir=path.join(root,'src','styles');
const reportPath=path.join(root,'docs','css-versioned-selector-report.json');
const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
const deadClasses=new Set(report.totals?.cssOnlyClassNames||[]);
if(!deadClasses.size)throw new Error('No CSS-only versioned classes found in the committed audit report.');

function normalize(value){return value.replace(/\s+/g,' ').trim();}

function splitSelectorList(header){
  const parts=[];
  let start=0,quote='',escaped=false,paren=0,bracket=0;
  for(let i=0;i<=header.length;i++){
    const c=header[i]??',';
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
    if(c===','&&paren===0&&bracket===0){
      const part=header.slice(start,i).trim();
      if(part)parts.push(part);
      start=i+1;
    }
  }
  return parts;
}

function selectorUsesDeadClass(selector){
  for(const className of deadClasses){
    const escaped=className.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    if(new RegExp(`\\.${escaped}(?![-_a-zA-Z0-9])`).test(selector))return true;
  }
  return false;
}

function findMatchingBrace(css,open){
  let depth=0,quote='',escaped=false,comment=false;
  for(let i=open;i<css.length;i++){
    const c=css[i],n=css[i+1];
    if(comment){if(c==='*'&&n==='/'){comment=false;i++;}continue;}
    if(quote){
      if(escaped){escaped=false;continue;}
      if(c==='\\'){escaped=true;continue;}
      if(c===quote)quote='';
      continue;
    }
    if(c==='/'&&n==='*'){comment=true;i++;continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='{')depth++;
    else if(c==='}'){
      depth--;
      if(depth===0)return i;
      if(depth<0)throw new Error('Unexpected closing brace');
    }
  }
  throw new Error('Unbalanced CSS block');
}

function findHeaderDelimiter(css,start,end){
  let quote='',escaped=false,comment=false,paren=0;
  for(let i=start;i<end;i++){
    const c=css[i],n=css[i+1];
    if(comment){if(c==='*'&&n==='/'){comment=false;i++;}continue;}
    if(quote){
      if(escaped){escaped=false;continue;}
      if(c==='\\'){escaped=true;continue;}
      if(c===quote)quote='';
      continue;
    }
    if(c==='/'&&n==='*'){comment=true;i++;continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='('){paren++;continue;}
    if(c===')'){paren=Math.max(0,paren-1);continue;}
    if(paren===0&&(c==='{'||c===';'))return {index:i,char:c};
  }
  return null;
}

function skipTrivia(css,start,end){
  let i=start;
  while(i<end){
    if(/\s/.test(css[i])){i++;continue;}
    if(css[i]==='/'&&css[i+1]==='*'){
      const close=css.indexOf('*/',i+2);
      if(close<0)throw new Error('Unclosed CSS comment');
      i=close+2;
      continue;
    }
    break;
  }
  return i;
}

function transform(css,start=0,end=css.length){
  let out='',cursor=start,removedArms=0,removedRules=0;
  while(cursor<end){
    const contentStart=skipTrivia(css,cursor,end);
    out+=css.slice(cursor,contentStart);
    if(contentStart>=end)break;
    const delimiter=findHeaderDelimiter(css,contentStart,end);
    if(!delimiter){out+=css.slice(contentStart,end);break;}
    if(delimiter.char===';'){
      out+=css.slice(contentStart,delimiter.index+1);
      cursor=delimiter.index+1;
      continue;
    }
    const close=findMatchingBrace(css,delimiter.index);
    const rawHeader=css.slice(contentStart,delimiter.index);
    const header=normalize(rawHeader.replace(/\/\*[\s\S]*?\*\//g,' '));
    const bodyStart=delimiter.index+1;
    const bodyEnd=close;

    if(header.startsWith('@')){
      const lower=header.toLowerCase();
      if(lower.startsWith('@keyframes')||lower.startsWith('@-webkit-keyframes')){
        out+=css.slice(contentStart,close+1);
      }else{
        const nested=transform(css,bodyStart,bodyEnd);
        out+=`${rawHeader}{${nested.css}}`;
        removedArms+=nested.removedArms;
        removedRules+=nested.removedRules;
      }
      cursor=close+1;
      continue;
    }

    const selectors=splitSelectorList(rawHeader);
    const retained=selectors.filter((selector)=>!selectorUsesDeadClass(selector));
    removedArms+=selectors.length-retained.length;
    if(retained.length){
      out+=`${retained.join(',')}{${css.slice(bodyStart,bodyEnd)}}`;
    }else{
      removedRules++;
    }
    cursor=close+1;
  }
  return {css:out,removedArms,removedRules};
}

let totalArms=0,totalRules=0,changedFiles=0;
for(const file of fs.readdirSync(stylesDir).filter((name)=>name.endsWith('.css'))){
  const full=path.join(stylesDir,file);
  const original=fs.readFileSync(full,'utf8');
  const result=transform(original);
  if(result.css!==original){
    fs.writeFileSync(full,result.css);
    changedFiles++;
    totalArms+=result.removedArms;
    totalRules+=result.removedRules;
    console.log(`${file}: removed ${result.removedArms} selector arm(s), ${result.removedRules} whole rule(s).`);
  }
}

console.log(`Removed ${deadClasses.size} CSS-only versioned classes from ${changedFiles} stylesheet(s): ${[...deadClasses].sort().join(', ')}`);
console.log(`Total selector arms removed: ${totalArms}; whole rules removed: ${totalRules}.`);
