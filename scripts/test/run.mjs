import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { buildCanonicalModel } from '../build/pipeline.mjs';

const node=process.execPath;
function run(label,args){
  process.stdout.write(`\n[test:${label}] node ${args.join(' ')}\n`);
  const result=spawnSync(node,args,{cwd:process.cwd(),env:process.env,stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status??1);
}
const walk=(dir,ext)=>readdirSync(dir,{withFileTypes:true,recursive:true})
  .filter(e=>e.isFile()&&e.name.endsWith(ext))
  .map(e=>`${e.parentPath||e.path}/${e.name}`.replaceAll('\\','/'))
  .sort();

buildCanonicalModel({includeUpgrade:true,includeSiteBuild:false});

const stable=[
  'scripts/test.mjs',
  'scripts/test-branch-index.mjs',
  'scripts/test-canonical-integrity.mjs',
  'scripts/test-exports.mjs',
  'scripts/test-record-ingestion.mjs',
  'scripts/test-tree-advanced.mjs',
  'scripts/test-research-automation.mjs'
];
const capability=walk('scripts/contracts','.mjs');
run('contracts',['--test',...stable,...capability]);

const rootJs=readdirSync('.',{withFileTypes:true})
  .filter(e=>e.isFile()&&e.name.endsWith('.js'))
  .map(e=>e.name);
for(const file of [...rootJs,...walk('src','.js')])run('syntax',['--check',file]);
run('architecture',['scripts/architecture-audit.mjs']);
