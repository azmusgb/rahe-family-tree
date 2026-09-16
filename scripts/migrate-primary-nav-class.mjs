import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const oldName='v151-primary-nav';
const newName='primary-nav';
const targetFiles=[
  'index.html',
  'scripts/test-v15-1.mjs',
  'src/runtime/navigation-shell.js',
  'src/styles/core.css',
  'src/styles/interaction.css',
  'v15-1-runtime.js',
];
const exactPattern=/(?<![-_a-zA-Z0-9])v151-primary-nav(?![-_a-zA-Z0-9])/g;

let filesChanged=0,replacements=0;
for(const relative of targetFiles){
  const file=path.join(root,relative);
  const original=fs.readFileSync(file,'utf8');
  const matches=original.match(exactPattern)||[];
  if(!matches.length)continue;
  let next=original.replace(exactPattern,newName);
  next=next
    .replace(/\bprimary-nav\s+primary-nav\b/g,'primary-nav')
    .replace(/\.primary-nav\s*,\s*\.primary-nav/g,'.primary-nav');
  fs.writeFileSync(file,next);
  filesChanged++;
  replacements+=matches.length;
  console.log(`${relative}: ${matches.length} replacement(s)`);
}

if(!replacements)throw new Error(`No exact ${oldName} references found in the audited target set.`);
console.log(`Migrated ${replacements} ${oldName} reference(s) across ${filesChanged} file(s) to ${newName}.`);
