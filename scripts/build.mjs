import {mkdir,copyFile,rm,writeFile,readFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const run=promisify(execFile);
const ESBUILD_VERSION='0.25.10';
const NPX=process.platform==='win32'?'npx.cmd':'npx';

await rm('dist',{recursive:true,force:true});
await mkdir('dist');
await copyFile('index.html','dist/index.html');

async function esbuild(args){
  const {stdout,stderr}=await run(NPX,['--yes',`esbuild@${ESBUILD_VERSION}`,...args],{
    maxBuffer:16*1024*1024,
    windowsHide:true
  });
  if(stdout?.trim())console.log(stdout.trim());
  if(stderr?.trim())console.error(stderr.trim());
}

// Build one production JavaScript asset. Source modules remain in the repository
// for maintainability and tests, but are no longer shipped as browser requests.
await esbuild([
  'app-entry.js',
  '--bundle',
  '--format=esm',
  '--platform=browser',
  '--target=es2022',
  '--minify',
  '--legal-comments=none',
  '--outfile=dist/app.bundle.js'
]);

// Build one production stylesheet from the semantic style composition root.
// src/styles/index.css owns the historical cascade order; individual versioned
// stylesheets remain source inputs only and are not published as browser assets.
await esbuild([
  'src/styles/index.css',
  '--bundle',
  '--minify',
  '--legal-comments=none',
  '--outfile=dist/styles-v15.css'
]);

for(const f of ['corpus.json','coverage.json','redactions.json','research-model.json','semantic-audit.json','canonical-graph.json','provenance-index.json','canonical-diff.json'])await copyFile(`public/${f}`,`dist/${f}`);
const completeness=JSON.parse(await readFile('public/canonical-completeness.json','utf8'));
completeness.failed=Array.isArray(completeness.failed)
  ? completeness.failed
  : (completeness.checks||[]).filter(check=>check.pass!==true).map(check=>check.id);
await writeFile('dist/canonical-completeness.json',JSON.stringify(completeness,null,2));

const model=JSON.parse(await readFile('public/research-model.json','utf8'));
const appVersion='15.4.0';
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
  bundler:`esbuild@${ESBUILD_VERSION}`,
  browserAssets:['app.bundle.js','styles-v15.css']
};
await writeFile('dist/build-info.json',JSON.stringify(buildInfo,null,2));
console.log(`Built Rahe Family Experience v${appVersion} as one JS bundle + one CSS bundle on research model ${buildInfo.release} / platform ${buildInfo.platform||'n/a'} · ${buildInfo.gitSha}.`);
