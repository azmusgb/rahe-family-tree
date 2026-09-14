import fs from'node:fs';

const replaceRequired=(text,from,to,label)=>{if(!text.includes(from))throw new Error(`Missing expected ${label}`);return text.replace(from,to);};

// Update v18 architecture regression expectations.
{
  const file='scripts/test-v18.mjs';let text=fs.readFileSync(file,'utf8');
  text=text.replace("const redesign=read('src/styles/redesign.css');\n",'');
  text=replaceRequired(text,
    "for(const semantic of['tokens.css','base.css','shell.css','navigation.css','home.css','home-editorial.css','people.css','person.css','tree.css','media.css','research.css','record-ingestion.css','mobile-family.css','responsive.css']){",
    "for(const semantic of['tokens.css','base.css','components.css','shell.css','navigation.css','home.css','home-editorial.css','people.css','person.css','tree.css','tree-advanced.css','media.css','research.css','record-ingestion.css','mobile-family.css']){",
    'semantic import list');
  text=replaceRequired(text,
    "  assert.equal(fs.existsSync('src/styles/redesign-fixes.css'),false,'post-cascade redesign fix layer must stay retired');\n",
    "  assert.equal(fs.existsSync('src/styles/redesign-fixes.css'),false,'post-cascade redesign fix layer must stay retired');\n  assert.equal(fs.existsSync('src/styles/redesign.css'),false,'final redesign override layer must stay retired');\n  assert.equal(fs.existsSync('src/styles/responsive.css'),false,'global responsive override layer must stay retired');\n  assert.ok(fs.existsSync('src/styles/ownership-exceptions.json'),'CSS ownership exception baseline must be versioned');\n  assert.ok(fs.existsSync('scripts/css-architecture-audit.mjs'),'CSS architecture audit must remain release-blocking');\n",
    'retired CSS assertions');
  text=replaceRequired(text,
    "  assert.doesNotMatch(redesign,/--[a-z0-9-]+\\s*:/i,'composition layer must consume tokens instead of declaring custom properties');\n  assert.doesNotMatch(redesign,/:root\\s*\\{/,'composition layer must not own root design tokens');\n",
    "  const base=read('src/styles/base.css');\n  assert.doesNotMatch(base,/data-route=|data-experience=|\\.profile|\\.graph|\\.media|\\.ri-|\\.dashboard|\\.family-/,'base.css must remain foundations-only');\n  assert.match(tokens,/--family-text-min-readable:/);\n",
    'redesign token assertions');
  fs.writeFileSync(file,text);
}

// Make the CSS architecture audit part of the default test contract without changing dependencies.
{
  const file='package.json';const pkg=JSON.parse(fs.readFileSync(file,'utf8'));
  if(!pkg.scripts.test.includes('scripts/css-architecture-audit.mjs'))pkg.scripts.test+=' && node scripts/css-architecture-audit.mjs';
  fs.writeFileSync(file,JSON.stringify(pkg,null,2)+'\n');
}

// Keep CSS architecture policy release-blocking in PR validation.
{
  const file='.github/workflows/validate-change.yml';let text=fs.readFileSync(file,'utf8');
  const anchor='          node --check research-intelligence.js\n';
  if(!text.includes('node scripts/css-architecture-audit.mjs'))text=replaceRequired(text,anchor,`${anchor}          node scripts/css-architecture-audit.mjs\n`,'validation audit anchor');
  fs.writeFileSync(file,text);
}

// One-shot migration machinery must not survive the reviewed PR.
for(const file of[
  '.github/workflows/css-architecture-migrate.yml','scripts/css-architecture-migrate.mjs',
  '.github/workflows/css-base-cleanup.yml','scripts/css-base-cleanup.mjs',
  '.github/workflows/css-policy-normalize.yml','scripts/css-policy-normalize.mjs',
  '.github/workflows/css-audit-baseline.yml'
])if(fs.existsSync(file))fs.rmSync(file);

console.log('CSS architecture consolidation finalized: persistent audit wired into tests/CI; one-shot migration machinery removed.');
