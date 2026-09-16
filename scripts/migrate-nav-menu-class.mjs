import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const ignored=new Set(['.git','node_modules','dist','.netlify','playwright-report','test-results']);
const extensions=new Set(['.css','.html','.js','.mjs','.cjs']);
const oldName='v151-nav-menu';
const newName='nav-menu';

function walk(dir,out=[]){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(ignored.has(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())walk(full,out);
    else if(extensions.has(path.extname(entry.name).toLowerCase()))out.push(full);
  }
  return out;
}

let filesChanged=0,replacements=0;
for(const file of walk(root)){
  const original=fs.readFileSync(file,'utf8');
  const matches=original.match(/(?<![-_a-zA-Z0-9])v151-nav-menu(?![-_a-zA-Z0-9])/g)||[];
  if(!matches.length)continue;
  let next=original.replace(/(?<![-_a-zA-Z0-9])v151-nav-menu(?![-_a-zA-Z0-9])/g,newName);
  // Where the semantic class already existed beside its compatibility alias,
  // remove only the now-adjacent duplicate class token in markup/runtime strings.
  next=next.replace(/\bnav-menu\s+nav-menu\b/g,'nav-menu');
  fs.writeFileSync(file,next);
  filesChanged++;
  replacements+=matches.length;
  console.log(`${path.relative(root,file)}: ${matches.length} replacement(s)`);
}

if(!replacements)throw new Error(`No ${oldName} references found to migrate.`);
console.log(`Migrated ${replacements} ${oldName} reference(s) across ${filesChanged} file(s) to ${newName}.`);
