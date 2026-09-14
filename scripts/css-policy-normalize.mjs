import fs from'node:fs';
import path from'node:path';
const ROOT='src/styles';
const allowed=[420,600,768,1024,1200];
const nearest=n=>allowed.reduce((best,x)=>Math.abs(x-n)<Math.abs(best-n)?x:best,allowed[0]);
const colors=[['#fffdf8','var(--paper)'],['#f4f1e9','var(--bg)'],['#ddd9ce','var(--line)'],['#c9c7bc','var(--line-strong)'],['#123f34','var(--green)'],['#1d5747','var(--green-2)'],['#f8f5ee','var(--surface-soft)'],['#edf2ec','var(--surface-tint)'],['#192820','var(--ink)']];
for(const file of fs.readdirSync(ROOT).filter(f=>f.endsWith('.css')&&f!=='tokens.css')){
  const full=path.join(ROOT,file);let text=fs.readFileSync(full,'utf8');
  text=text.replace(/!important\b/g,'');
  text=text.replace(/font-size\s*:\s*(\d+(?:\.\d+)?)px/gi,(m,n)=>Number(n)>0&&Number(n)<12?`font-size:12px`:m);
  text=text.replace(/max-width\s*:\s*(\d+)px/gi,(m,n)=>`max-width:${nearest(Number(n))}px`);
  for(const[from,to]of colors)text=text.replace(new RegExp(from,'gi'),to);
  fs.writeFileSync(full,text.trimEnd()+'\n');
}
console.log('Normalized max-width breakpoints, readable font-size floor, palette token ownership, and nonessential !important usage.');
