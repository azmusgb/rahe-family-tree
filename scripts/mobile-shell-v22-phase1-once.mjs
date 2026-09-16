import fs from 'node:fs';

const navPath='src/runtime/navigation-shell.js';
const mobilePath='src/runtime/mobile-ui-shell.js';
const testPath='scripts/test-mobile-shell-v22.mjs';

let nav=fs.readFileSync(navPath,'utf8');
const oldDock='<a href="#dashboard" data-dock-route="dashboard"><span>Home</span></a><a href="#tree" data-dock-route="tree"><span>Tree</span></a><a href="#families" data-dock-route="families"><span>Families</span></a><a href="#people" data-dock-route="people"><span>People</span></a>';
const newDock='<a href="#dashboard" data-dock-route="dashboard"><span>Home</span></a><a href="#families" data-dock-route="families"><span>Families</span></a><a href="#tree" data-dock-route="tree"><span>Tree</span></a><a href="#people" data-dock-route="people"><span>People</span></a>';
if(!nav.includes(oldDock))throw new Error('Expected family dock order not found');
nav=nav.replace(oldDock,newDock);
fs.writeFileSync(navPath,nav);

let mobile=fs.readFileSync(mobilePath,'utf8');
mobile=mobile.replace("const desiredDockOrder=['dashboard','families','tree','people','more'];\n",'');
mobile=mobile.replace(/function dockKey\(node\)\{[\s\S]*?\n\}\nfunction reorderDock\(\)\{[\s\S]*?\n\}\n\nfunction originalSearch/,'function originalSearch');
mobile=mobile.replace('  reorderDock();\n','');
if(mobile.includes('desiredDockOrder')||mobile.includes('reorderDock()')||mobile.includes('function dockKey'))throw new Error('Mobile dock reordering residue remains');
fs.writeFileSync(mobilePath,mobile);

fs.writeFileSync(testPath,`import test from'node:test';\nimport assert from'node:assert/strict';\nimport fs from'node:fs';\n\nconst nav=fs.readFileSync('src/runtime/navigation-shell.js','utf8');\nconst mobile=fs.readFileSync('src/runtime/mobile-ui-shell.js','utf8');\n\ntest('navigation shell owns final family mobile dock order',()=>{\n  const home=nav.indexOf('data-dock-route="dashboard"');\n  const families=nav.indexOf('data-dock-route="families"');\n  const tree=nav.indexOf('data-dock-route="tree"');\n  const people=nav.indexOf('data-dock-route="people"');\n  assert.ok(home>=0&&home<families&&families<tree&&tree<people);\n});\n\ntest('mobile UI shell does not reorder navigation-owned dock nodes',()=>{\n  assert.doesNotMatch(mobile,/desiredDockOrder|reorderDock\\(|function dockKey/);\n});\n`);

fs.rmSync('scripts/mobile-shell-v22-phase1-once.mjs');
fs.rmSync('.github/workflows/mobile-shell-v22-phase1-once.yml');
