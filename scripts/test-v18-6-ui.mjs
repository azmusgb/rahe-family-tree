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


test('18.11 tree CSS uses semantic context without specificity escalation',async()=>{
  const css=await read('src/styles/tree.css');
  assert.doesNotMatch(css,/data-v158-context/);
  assert.doesNotMatch(css,/!important/);
  assert.match(css,/body\[data-route="tree"\]\[data-nav-context="family"\]/);
  assert.match(css,/\.graph-shell/);
  assert.match(css,/\.tree-focusbar/);
});


test('18.12 tree styling uses semantic classes while runtime retains compatibility aliases',async()=>{
  const css=await read('src/styles/tree.css');
  const engine=await read('src/runtime/tree-engine.js');
  const polish=await read('src/runtime/tree-polish.js');
  for(const legacy of [
    'v129-tree-memory','v129-memory-actions','v1291-breadcrumb',
    'v1291-couple-child','v1291-spouse','v1291-mobile-hint',
    'v154-tree-person','v154-tree-person-main','v154-tree-avatar',
    'v154-tree-relations','v154-tree-actions','v154-tree-controls',
    'v154-tree-help','v154-graph-shell'
  ])assert.doesNotMatch(css,new RegExp(`\\.${legacy}(?![\\w-])`));
  for(const semantic of [
    'tree-memory','tree-context-breadcrumb',
    'tree-edge-couple-child','tree-edge-spouse',
    'tree-person-summary','tree-person-avatar',
    'tree-person-relations','tree-person-actions','tree-controls',
    'tree-help','tree-graph-shell'
  ])assert.match(css,new RegExp(`\\.${semantic}(?![\\w-])`));

  // These are semantic runtime hooks, not standalone style owners.
  assert.match(engine,/tree-memory v129-tree-memory/);
  assert.match(engine,/tree-memory-actions v129-memory-actions/);
  assert.match(polish,/tree-context-breadcrumb v1291-breadcrumb/);
  assert.match(polish,/tree-mobile-hint v1291-mobile-hint/);
  assert.match(polish,/tree-edge-couple-child/);
  assert.match(polish,/tree-edge-spouse/);
});


test('18.13 tree CSS does not depend on release-number state markers',async()=>{
  const css=await read('src/styles/tree.css');
  const engine=await read('src/runtime/tree-engine.js');
  const polish=await read('src/runtime/tree-polish.js');
  assert.doesNotMatch(css,/data-tree-(?:release|polish-release)/);
  assert.match(engine,/dataset\.treeEngine='active'/);
  assert.match(polish,/dataset\.treePolish='active'/);
  // Historical markers remain runtime metadata only during compatibility transition.
  assert.match(engine,/dataset\.treeRelease='17\.2'/);
  assert.match(polish,/dataset\.treePolishRelease='18\.6'/);
});
