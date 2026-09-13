import fs from 'node:fs';

const retired=[
  'v11.css','v11-nav.css','v11-2.css','v11-3.css','v11-4.css','v11-6.css',
  'v12.css','v12-2.css','v12-3.css','v12-4.css','v12-5.css','v12-6.css','v12-6-1.css','v12-6-2.css','v12-7.css','v12-8.css','v12-9.css','v12-9-1.css',
  'v13-0.css','dashboard-v13-2.css','media-page-v13-4.css','experience-v13-5.css','v14.css',
  'v15.css','v15-1.css','v15-family-focus.css','platform-v13.css','v15-5.css','v15-6.css','v15-8.css',
  'src/styles/v16.css','src/styles/v16-1.css','src/styles/v16-2.css'
];

const aggregate="fs.readdirSync('src/styles').filter(f=>f.endsWith('.css')&&f!=='index.css').sort().map(f=>fs.readFileSync('src/styles/'+f,'utf8')).join('\\n')";
let changed=0;
for(const name of fs.readdirSync('scripts').filter(name=>/^test.*\.mjs$/.test(name))){
  const file=`scripts/${name}`;
  let text=fs.readFileSync(file,'utf8');
  const before=text;
  for(const legacy of retired){
    const escaped=legacy.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    text=text.replace(new RegExp(`fs\\.readFileSync\\((['\"])${escaped}\\1,(['\"])utf8\\2\\)`,'g'),aggregate);
  }
  if(text!==before){fs.writeFileSync(file,text);changed++;}
}
console.log(`Modernized ${changed} style-dependent release test files to assert against the semantic CSS system.`);
