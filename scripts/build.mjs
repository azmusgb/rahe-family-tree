import {mkdir,copyFile,rm,writeFile,readFile,readdir} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from'node:util';
import {APP_VERSION,RELEASE_TRAIN} from'../src/config/release.js';

const run=promisify(execFile);
const ESBUILD_VERSION='0.25.10';
const NPX=process.platform==='win32'?'npx.cmd':'npx';
const VERSION_TOKEN='__APP_VERSION__';

const legacyStyleSources=[];
const generatedLegacyStyle=null;

await rm('dist',{recursive:true,force:true});
await mkdir('dist');
await copyFile('index.html','dist/index.html');
const shell=await readFile('dist/index.html','utf8');
const stampedShell=shell.replaceAll(VERSION_TOKEN,APP_VERSION);
if(stampedShell.includes(VERSION_TOKEN))throw new Error(`Unresolved release token ${VERSION_TOKEN} in dist/index.html`);
await writeFile('dist/index.html',stampedShell);

async function esbuild(args){
  const {stdout,stderr}=await run(NPX,['--yes',`esbuild@${ESBUILD_VERSION}`,...args],{
    maxBuffer:16*1024*1024,
    windowsHide:true
  });
  if(stdout?.trim())console.log(stdout.trim());
  if(stderr?.trim())console.error(stderr.trim());
}

await esbuild([
  'app-entry.js','--bundle','--splitting','--format=esm','--platform=browser','--target=es2022','--minify','--legal-comments=none','--outdir=dist','--entry-names=app.bundle','--chunk-names=chunks/[name]-[hash]'
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
const emitted=await readdir('dist',{recursive:true});
const jsAssets=emitted.filter(file=>file.endsWith('.js')).map(file=>file.replaceAll('\\','/')).sort((a,b)=>a==='app.bundle.js'?-1:b==='app.bundle.js'?1:a.localeCompare(b));
const buildInfo={
  appVersion:APP_VERSION,
  genealogySchemaVersion,
  canonicalSourceVersion,
  release:model.meta.release||model.meta.version,
  platform:model.platform?.version||null,
  gitSha:process.env.COMMIT_REF||process.env.GITHUB_SHA||process.env.HEAD||'local-build',
  sourceSha256:model.meta.sourceSha256,
  builtAt:new Date().toISOString(),
  experience:APP_VERSION,
  releaseTrain:RELEASE_TRAIN,
  bundler:`esbuild@${ESBUILD_VERSION}`,
  browserAssets:[...jsAssets,'styles.css'],
  bundleStrategy:{
    entry:'app.bundle.js',
    splitting:true,
    chunkDirectory:'chunks',
    criticalRuntime:['tree-controller','mobile-experience','mobile-ui-shell']
  },
  styleSystem:{
    root:'src/styles/index.css',
    compatibilityBoundary:null,
    legacySourceCount:0
  }
};
await writeFile('dist/build-info.json',JSON.stringify(buildInfo,null,2));
console.log(`Built Family History Archive v${APP_VERSION} as one stable JS entry + ${Math.max(0,jsAssets.length-1)} split chunk(s) + one CSS bundle on research model ${buildInfo.release} / platform ${buildInfo.platform||'n/a'} · ${buildInfo.gitSha}.`);
