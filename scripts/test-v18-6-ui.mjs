import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

// Release-candidate architecture regression suite.
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const cssSource=(bundle,source)=>{
  const marker=`Source: ${source}`;
  const start=bundle.indexOf(marker);
  assert.ok(start>-1,`missing consolidated CSS source ${source}`);
  const next=bundle.indexOf('Source: ',start+marker.length);
  return bundle.slice(start,next>-1?next:bundle.length);
};

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

test('18.7 CSS architecture uses consolidated ownership with print authoritative last',async()=>{
  const index=await read('src/styles/index.css');
  const print=await read('src/styles/print.css');
  const interactions=await read('src/styles/interaction.css');
  const expected=['tokens.css','core.css','composition.css','experience.css','home-responsive.css','interaction.css','mobile.css','print.css'];
  let previous=-1;
  for(const name of expected){
    const position=index.indexOf(`@import './${name}';`);
    assert.ok(position>previous,`${name} should follow the previous consolidated layer`);
    previous=position;
  }
  assert.equal((index.match(/@import/g)||[]).length,8);
  assert.match(print,/Consolidated print rules migrated from semantic modules/);
  assert.match(interactions,/Reduced-motion is a cross-route accessibility contract/);
});

test('18.7 responsive media-query debt stays within the normalized source budgets',async()=>{
  const core=await read('src/styles/core.css');
  const budgets={
    'responsive.css':55,
    'shell.css':36,
    'tree.css':30,
    'mobile-family.css':18,
    'navigation.css':28
  };
  for(const [name,max] of Object.entries(budgets)){
    const css=cssSource(core,name);
    const count=(css.match(/@media/g)||[]).length;
    assert.ok(count<=max,`${name} has ${count} media blocks; budget is ${max}`);
  }
});

test('18.8 retires catch-all and micro-layer CSS into consolidated owners',async()=>{
  const index=await read('src/styles/index.css');
  assert.doesNotMatch(index,/redesign\.css/);
  assert.equal((index.match(/@import/g)||[]).length,8);
  const composition=await read('src/styles/composition.css');
  for(const source of ['base-composition.css','shell-composition.css','home-composition.css','person-composition.css','people-composition.css','tree-composition.css','responsive-composition.css']){
    assert.match(composition,new RegExp(`Source: ${source.replace('.', '\\.')}`));
  }
  assert.match(composition,/Presentation-only|Evidence-state semantics/);
});

test('18.9 archive shell uses semantic selectors without specificity escalation',async()=>{
  const core=await read('src/styles/core.css');
  const shell=cssSource(core,'archive-shell.css');
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
  const core=await read('src/styles/core.css');
  const css=cssSource(core,'navigation.css');
  assert.doesNotMatch(css,/\.v151-(?:primary-nav|nav-menu|nav-menus|nav-popover)/);
  assert.doesNotMatch(css,/data-v158-context/);
  assert.doesNotMatch(css,/!important/);
  assert.match(css,/\.primary-nav/);
  assert.match(css,/\.nav-menu/);
  assert.match(css,/\.nav-popover/);
  assert.match(css,/body\[data-nav-context="family"\]/);
});

test('18.11 tree CSS uses semantic context without specificity escalation',async()=>{
  const core=await read('src/styles/core.css');
  const css=cssSource(core,'tree.css');
  assert.doesNotMatch(css,/data-v158-context/);
  assert.doesNotMatch(css,/!important/);
  assert.match(css,/body\[data-route="tree"\]\[data-nav-context="family"\]/);
  assert.match(css,/\.graph-shell/);
  assert.match(css,/\.tree-focusbar/);
});

test('18.12 tree styling uses semantic classes while runtime retains compatibility aliases',async()=>{
  const core=await read('src/styles/core.css');
  const css=cssSource(core,'tree.css');
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
  const core=await read('src/styles/core.css');
  const css=cssSource(core,'tree.css');
  const engine=await read('src/runtime/tree-engine.js');
  const polish=await read('src/runtime/tree-polish.js');
  assert.doesNotMatch(css,/data-tree-(?:release|polish-release)/);
  assert.match(engine,/dataset\.treeEngine='active'/);
  assert.match(polish,/dataset\.treePolish='active'/);
  // Historical markers remain runtime metadata only during compatibility transition.
  assert.match(engine,/dataset\.treeRelease='17\.2'/);
  assert.match(polish,/dataset\.treePolishRelease='18\.6'/);
});

test('18.14 hidden route filters remain hidden despite layout display rules',async()=>{
  const interactions=await read('src/styles/interaction.css');
  assert.match(interactions,/\.filters\[hidden\]\{display:none!important\}/);
  assert.match(interactions,/data-route="media"[^\{]*\.route-shell \.filters\{[\s\S]*display:block!important/);
});
