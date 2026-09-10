import {mkdir,copyFile,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist');
for(const f of ['index.html','v11.js','core.js','graph.js','dossiers.js','archive-views.js','traceability.js','operations.js','research-state.js','v11.css','v11-nav.css','v11-2.css','v11-3.css','v11-4.css']) await copyFile(f,`dist/${f}`);
for(const f of ['corpus.json','coverage.json','redactions.json','research-model.json','semantic-audit.json']) await copyFile(`public/${f}`,`dist/${f}`);
console.log('Built Rahe Family Research Workbench v11.4.');
