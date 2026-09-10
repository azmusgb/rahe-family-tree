import {mkdir,copyFile,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist');
for(const f of ['index.html','app.js','style.css']) await copyFile(f,`dist/${f}`);
for(const f of ['corpus.json','coverage.json','redactions.json']) await copyFile(`public/${f}`,`dist/${f}`);
console.log('Built Rahe public research edition.');
