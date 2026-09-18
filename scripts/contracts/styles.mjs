import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
test('core and mobile CSS sinks are retired',()=>{assert.equal(fs.existsSync('src/styles/core.css'),false);assert.equal(fs.existsSync('src/styles/mobile.css'),false);});
test('style composition preserves owned cascade and print remains last',()=>{
 const src=read('src/styles/index.css');
 const order=['./tokens.css','./foundation.css','../features/navigation/navigation.css','../features/person/person.css','../features/tree/tree.css','../features/research/research.css','../features/family/family-responsive.css','./composition.css','./experience.css','./home-responsive.css','./interaction.css','../features/navigation/mobile-foundation.css','../features/navigation/mobile-shell.css','../features/navigation/mobile-directory.css','./print.css'];
 let pos=-1;for(const spec of order){const next=src.indexOf(spec);assert.ok(next>pos,'expected cascade import '+spec);pos=next;}assert.equal(src.trim().endsWith("@import './print.css';"),true);
});
test('owned CSS files stay below the sink budget',()=>{
 const files=['src/styles/foundation.css','src/features/navigation/navigation.css','src/features/person/person.css','src/features/tree/tree.css','src/features/research/research.css','src/features/family/family-responsive.css','src/features/navigation/mobile-foundation.css','src/features/navigation/mobile-shell.css','src/features/navigation/mobile-directory.css'];
 for(const file of files){assert.ok(fs.existsSync(file),file);assert.ok(fs.statSync(file).size<=80000,file+' exceeds 80KB ownership budget');}
});
