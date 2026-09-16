import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const oldName='v151-nav-menu';
const newName='nav-menu';
const targetFiles=[
  'index.html',
  'scripts/test-v15-1.mjs',
  'scripts/test-v18-6-ui.mjs',
  'src/runtime/navigation-shell.js',
  'src/runtime/page-architecture.js',
  'src/styles/composition.css',
  'src/styles/core.css',
  'src/styles/interaction.css',
  'v15-1-runtime.js',
];
const exactPattern=/(?<![-_a-zA-Z0-9])v151-nav-menu(?![-_a-zA-Z0-9])/g;

let filesChanged=0,replacements=0;
for(const relative of targetFiles){
  const file=path.join(root,relative);
  const original=fs.readFileSync(file,'utf8');
  const matches=original.match(exactPattern)||[];
  if(!matches.length)continue;
  let next=original.replace(exactPattern,newName);
  // Where the semantic class already existed beside its compatibility alias,
  // remove only adjacent duplicate class tokens in markup/runtime strings.
  next=next.replace(/\bnav-menu\s+nav-menu\b/g,'nav-menu');
  fs.writeFileSync(file,next);
  filesChanged++;
  replacements+=matches.length;
  console.log(`${relative}: ${matches.length} replacement(s)`);
}

if(!replacements)throw new Error(`No exact ${oldName} references found in the migration target set.`);
console.log(`Migrated ${replacements} ${oldName} reference(s) across ${filesChanged} file(s) to ${newName}.`);
