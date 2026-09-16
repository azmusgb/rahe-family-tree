import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const replacements=new Map([
  ['v151-nav-menus','nav-menus'],
  ['v151-nav-popover','nav-popover'],
]);
const allowedExtensions=new Set(['.html','.js','.mjs','.cjs','.css']);
const excludedDirs=new Set(['.git','node_modules','dist','.netlify','playwright-report','test-results']);
const excludedFiles=new Set([
  'scripts/migrate-nav-wrapper-classes.mjs',
]);

function walk(dir,files=[]){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(excludedDirs.has(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())walk(full,files);
    else files.push(full);
  }
  return files;
}

const counts=Object.fromEntries([...replacements.keys()].map(key=>[key,0]));
let changed=0;
for(const full of walk(root)){
  const rel=path.relative(root,full).split(path.sep).join('/');
  if(excludedFiles.has(rel)||!allowedExtensions.has(path.extname(full)))continue;
  let text=fs.readFileSync(full,'utf8');
  const original=text;
  for(const[legacy,semantic]of replacements){
    const escaped=legacy.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const exact=new RegExp(`(?<![-_a-zA-Z0-9])${escaped}(?![-_a-zA-Z0-9])`,'g');
    const matches=text.match(exact)||[];
    counts[legacy]+=matches.length;
    text=text.replace(exact,semantic);
    const classDup=new RegExp(`\\b${semantic}\\s+${semantic}\\b`,'g');
    const selectorDup=new RegExp(`\\.${semantic}\\s*,\\s*\\.${semantic}(?![-_a-zA-Z0-9])`,'g');
    text=text.replace(classDup,semantic).replace(selectorDup,`.${semantic}`);
  }
  if(text!==original){fs.writeFileSync(full,text);changed++;console.log(rel);}
}
for(const legacy of replacements.keys()){
  if(!counts[legacy])throw new Error(`No exact ${legacy} references found.`);
}
console.log(`Changed ${changed} file(s).`);
for(const[legacy,count]of Object.entries(counts))console.log(`${legacy}: ${count} replacement(s)`);
