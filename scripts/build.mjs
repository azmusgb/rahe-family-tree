import {mkdir,copyFile,rm,writeFile,readFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from'node:util';

const run=promisify(execFile);
const ESBUILD_VERSION='0.25.10';
const NPX=process.platform==='win32'?'npx.cmd':'npx';
const appVersion='18.0.0';

const legacyStyleSources=[
  'v11.css','v11-nav.css','v11-2.css','v11-3.css','v11-4.css','v11-6.css',
  'v12.css','v12-2.css','v12-3.css','v12-4.css','v12-5.css','v12-6.css','v12-6-1.css','v12-6-2.css','v12-7.css','v12-8.css','v12-9.css','v12-9-1.css',
  'v13-0.css','dashboard-v13-2.css','media-page-v13-4.css','experience-v13-5.css','v14.css',
  'v15.css','v15-1.css','v15-family-focus.css','platform-v13.css','v15-5.css','v15-6.css','v15-8.css',
  'src/styles/record-ingestion.css',
  'src/styles/v16.css','src/styles/v16-1.css','src/styles/v16-2.css'
];
const generatedLegacyStyle='src/styles/legacy-compat.generated.css';
const legacyStyleBlocks=await Promise.all(legacyStyleSources.map(async source=>{
  const css=await readFile(source,'utf8');
  return `/* compatibility source: ${source} */\n${css.trim()}`;
}));
await writeFile(generatedLegacyStyle,`/* GENERATED FILE — DO NOT EDIT.\n * Frozen historical presentation is collapsed here so the semantic Family\n * design-system composition root has one explicit compatibility boundary.\n * New presentation work belongs in the semantic modules imported after this file.\n */\n${legacyStyleBlocks.join('\n\n')}\n`);

await rm('dist',{recursive:true,force:true});
await mkdir('dist');
await copyFile('index.html','dist/index.html');
const shell=await readFile('dist/index.html','utf8');
await writeFile('dist/index.html',shell.replace(/\d+\.\d+\.\d+/g,match=>match==='18.0.0'?match:match.startsWith('17.')?appVersion:match));

async function esbuild(args){
  const {stdout,stderr}=await run(NPX,['--yes',`esbuild@${ESBUILD_VERSION}`,...args],{
    maxBuffer:16*1024*1024,
    windowsHide:true
  });
  if(stdout?.trim())console.log(stdout.trim());
  if(stderr?.trim())console.error(stderr.trim());
}

await esbuild([
  'app-entry.js','--bundle','--format=esm','--platform=browser','--target=es2022','--minify','--legal-comments=none','--outfile=dist/app.bundle.js'
]);

await esbuild([
  'src/styles/index.css','--bundle','--minify','--legal-comments=none','--outfile=dist/styles.css'
]);

for(const f of ['corpus.json','coverage.json','redactions.json','research-model.json','semantic-audit.json','canonical-graph.json','provenance-index.json','canonical-diff.json'])await copyFile(`public/${f}`,`dist/${f}`);
const completeness=JSON.parse(await readFile('public/canonical-completeness.json','utf8'));
completeness.failed=Array.isArray(completeness.failed)
  ? completeness.failed
  : (completeness.checks||[]).filter(check=>check.pass!==true).map(check=>check.id);
await writeFile('dist/canonical-completeness.json',JSON.stringify(completeness,null,2));

const model=JSON.parse(await readFile('public/research-model.json','utf8'));
const genealogySchemaVersion='13.0';
const canonicalSourceVersion='10.0';
const buildInfo={
  appVersion,
  genealogySchemaVersion,
  canonicalSourceVersion,
  release:model.meta.release||model.meta.version,
  platform:model.platform?.version||null,
  gitSha:process.env.COMMIT_REF||process.env.GITHUB_SHA||process.env.HEAD||'local-build',
  sourceSha256:model.meta.sourceSha256,
  builtAt:new Date().toISOString(),
  experience:appVersion,
  releaseTrain:'v18-canonical-platform',
  bundler:`esbuild@${ESBUILD_VERSION}`,
  browserAssets:['app.bundle.js','styles.css'],
  styleSystem:{
    root:'src/styles/index.css',
    compatibilityBoundary:generatedLegacyStyle,
    legacySourceCount:legacyStyleSources.length
  }
};
await writeFile('dist/build-info.json',JSON.stringify(buildInfo,null,2));
console.log(`Built Family History Archive v${appVersion} as one JS bundle + one CSS bundle on research model ${buildInfo.release} / platform ${buildInfo.platform||'n/a'} · ${buildInfo.gitSha}.`);