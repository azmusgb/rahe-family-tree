import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const legacy='v161-relationship-dialog';
const semantic='relationship-dialog';
const allowedExtensions=new Set(['.html','.js','.mjs','.cjs','.css']);
const excludedDirs=new Set(['.git','node_modules','dist','.netlify','playwright-report','test-results']);
const excludedFiles=new Set(['scripts/migrate-relationship-dialog-class.mjs']);

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
  const next=original.replace(exact,semantic)
    .replace(/\brelationship-dialog\s+relationship-dialog\b/g,'relationship-dialog')
    .replace(/\.relationship-dialog\s*,\s*\.relationship-dialog(?![-_a-zA-Z0-9])/g,'.relationship-dialog');
  fs.writeFileSync(full,next);
  changed++;
  console.log(`${rel}: ${matches.length} replacement(s)`);
}
if(!replacements)throw new Error(`No exact ${legacy} references found.`);
console.log(`Migrated ${replacements} ${legacy} reference(s) across ${changed} file(s) to ${semantic}.`);
