import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('18.6 page actions use the shared UI command layer',async()=>{
  const runtime=await read('src/runtime/page-architecture.js');
  const commands=await read('src/runtime/ui-commands.js');
  assert.match(runtime,/data-ui-command/);
  assert.match(runtime,/page-actions--desktop/);
  assert.match(runtime,/page-actions--mobile/);
  assert.match(commands,/runUiCommand/);
  assert.match(commands,/toggle-experience/);
});

test('18.6 tree context avoids duplicate advanced navigation',async()=>{
  const runtime=await read('src/runtime/tree-polish.js');
  assert.match(runtime,/tree-advanced-nav/);
  assert.match(runtime,/tree-context-fallback/);
  assert.match(runtime,/tree-recent-history--fallback/);
  assert.match(runtime,/Recently viewed/);
});

test('18.6 has a centralized print contract',async()=>{
  const root=await read('src/styles/index.css');
  const print=await read('src/styles/print.css');
  assert.match(root,/@import '\.\/print\.css';/);
  assert.match(print,/@media print/);
  assert.match(print,/#family-graph/);
});

test('18.7 CSS architecture centralizes print and reduced-motion contracts',async()=>{
  const index=await read('src/styles/index.css');
  const print=await read('src/styles/print.css');
  const interactions=await read('src/styles/interaction-contracts.css');
  const modules=['shell.css','navigation.css','home.css','tree.css','media.css','mobile-family.css','responsive.css','base-composition.css','shell-composition.css','home-composition.css','person-composition.css','people-composition.css','tree-composition.css','responsive-composition.css'];
  const moduleCss=await Promise.all(modules.map(name=>read(`src/styles/${name}`)));
  for(const name of ['base-composition.css','shell-composition.css','home-composition.css','person-composition.css','people-composition.css','tree-composition.css','responsive-composition.css'])assert.ok(index.indexOf(`@import './${name}';`)>-1);
  assert.ok(index.indexOf("@import './responsive-composition.css';")<index.indexOf("@import './interaction-contracts.css';"));
  assert.ok(index.indexOf("@import './interaction-contracts.css';")<index.indexOf("@import './print.css';"));
  assert.match(print,/Consolidated print rules migrated from semantic modules/);
  assert.match(interactions,/Reduced-motion is a cross-route accessibility contract/);
  for(const css of moduleCss){
    assert.doesNotMatch(css,/@media\s*print/);
    assert.doesNotMatch(css,/@media[^\{]*prefers-reduced-motion\s*:\s*reduce/);
  }
});

test('18.7 responsive media-query debt stays within the normalized budget',async()=>{
  const budgets={
    'responsive.css':55,
    'shell.css':36,
    'tree.css':30,
    'mobile-family.css':18,
    'navigation.css':28
  };
  for(const [name,max] of Object.entries(budgets)){
    const css=await read(`src/styles/${name}`);
    const count=(css.match(/@media/g)||[]).length;
    assert.ok(count<=max,`${name} has ${count} media blocks; budget is ${max}`);
  }
});


test('18.8 retires the catch-all redesign layer into semantic composition owners',async()=>{
  const index=await read('src/styles/index.css');
  assert.doesNotMatch(index,/redesign\.css/);
  for(const name of ['base','shell','home','person','people','tree','responsive']){
    const file=`${name}-composition.css`;
    assert.match(index,new RegExp(`@import './${file.replace('.', '\\.')}';`));
    const css=await read(`src/styles/${file}`);
    assert.match(css,/Presentation-only|Evidence-state semantics/);
  }
});


test('18.9 archive shell uses semantic selectors without specificity escalation',async()=>{
  const shell=await read('src/styles/archive-shell.css');
  const runtime=await read('src/runtime/navigation-shell.js');
  assert.doesNotMatch(shell,/!important/);
  assert.doesNotMatch(shell,/data-v158-context|\.v151-(?:primary-nav|nav-menus|nav-menu|nav-popover)|\.v158-research-entry/);
  assert.match(shell,/data-nav-context/);
  for(const semantic of ['primary-nav','nav-menus','nav-menu','nav-popover','research-entry'])assert.match(shell,new RegExp(`\\.${semantic}`));
  assert.match(runtime,/dataset\.navContext/);
  assert.match(runtime,/classList\.add\('primary-nav'\)/);
  assert.match(runtime,/classList\.add\('nav-menus'\)/);
  assert.match(runtime,/nav-menu explore-menu v151-nav-menu/);
});


test('18.10 navigation CSS uses semantic ownership without specificity escalation',async()=>{
  const css=await read('src/styles/navigation.css');
  assert.doesNotMatch(css,/\.v151-(?:primary-nav|nav-menu|nav-menus|nav-popover)/);
  assert.doesNotMatch(css,/data-v158-context/);
  assert.doesNotMatch(css,/!important/);
  assert.match(css,/\.primary-nav/);
  assert.match(css,/\.nav-menu/);
  assert.match(css,/\.nav-popover/);
  assert.match(css,/body\[data-nav-context="family"\]/);
});
