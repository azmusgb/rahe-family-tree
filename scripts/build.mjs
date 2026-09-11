import {mkdir,copyFile,rm,writeFile,readFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist');

const browserFiles=['index.html','v11.js','core.js','branch-index.js','graph.js','dossiers.js','archive-views.js','traceability.js','operations.js','research-intelligence.js','research-state.js','family-editor.js','family-editor-atomic.js','shared-sync.js','family-experience.js','search-v13-1.js','search-v13-2.js','dashboard-v13-3.js','media-page-v13-4.js','media-page-v13-5.js','v15-runtime.js','v12-3-controls.js','media.js','auth.js','deployment.js','v12-6.js','v12-6-1.js','v12-6-2.js','v12-7.js','v12-8.js','v12-9.js','v12-9-1.js'];
for(const f of browserFiles)await copyFile(f,`dist/${f}`);

// Preserve the proven historical cascade while v15 converges ownership of the live application shell.
const cssSources=['v11.css','v11-nav.css','v11-2.css','v11-3.css','v11-4.css','v11-6.css','v12.css','v12-2.css','v12-3.css','v12-4.css','v12-5.css','v12-6.css','v12-6-1.css','v12-6-2.css','v12-7.css','v12-8.css','v12-9.css','v12-9-1.css','v13-0.css','dashboard-v13-2.css','media-page-v13-4.css','experience-v13-5.css','v14.css','v15.css'];
const cssParts=[];
for(const f of cssSources){cssParts.push(`/* source: ${f} */\n${await readFile(f,'utf8')}`);}
await writeFile('dist/styles-v15.css',cssParts.join('\n\n'));

for(const f of ['corpus.json','coverage.json','redactions.json','research-model.json','semantic-audit.json'])await copyFile(`public/${f}`,`dist/${f}`);
const model=JSON.parse(await readFile('public/research-model.json','utf8'));
const buildInfo={release:model.meta.release||model.meta.version,gitSha:process.env.COMMIT_REF||process.env.GITHUB_SHA||process.env.HEAD||'local-build',sourceSha256:model.meta.sourceSha256,builtAt:new Date().toISOString(),experience:'15.0'};
await writeFile('dist/build-info.json',JSON.stringify(buildInfo,null,2));
console.log(`Built Rahe Family Experience v15.0 on research model ${buildInfo.release} · ${buildInfo.gitSha}.`);
