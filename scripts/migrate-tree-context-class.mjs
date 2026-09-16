import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const legacy='v174-tree-context';
const semantic='tree-context';
const allowedExtensions=new Set(['.html','.js','.mjs','.cjs','.css']);
const excludedDirs=new Set(['.git','node_modules','dist','.netlify','playwright-report','test-results']);
const excludedFiles=new Set(['scripts/migrate-tree-context-class.mjs']);

function walk(dir,files=[]){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(excludedDirs.has(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())walk(full,files);else files.push(full);
  }
  return files;
}

const escaped=legacy.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const exact=new RegExp(`(?<![-_a-zA-Z0-9])${escaped}(?![-_a-zA-Z0-9])`,'g');
let replacements=0;
let changed=0;
for(const full of walk(root)){
  const rel=path.relative(root,full).split(path.sep).join('/');
  if(excludedFiles.has(rel)||!allowedExtensions.has(path.extname(full)))continue;
  const original=fs.readFileSync(full,'utf8');
  const matches=original.match(exact)||[];
  if(!matches.length)continue;
  replacements+=matches.length;
  let next=original.replace(exact,semantic)
    .replace(/\btree-context\s+tree-context\b/g,'tree-context')
    .replace(/\.tree-context\s*,\s*\.tree-context(?![-_a-zA-Z0-9])/g,'.tree-context');
  fs.writeFileSync(full,next);
  changed++;
  console.log(`${rel}: ${matches.length} replacement(s)`);
}
if(!replacements)throw new Error(`No exact ${legacy} references found.`);
console.log(`Migrated ${replacements} ${legacy} reference(s) across ${changed} file(s) to ${semantic}.`);
