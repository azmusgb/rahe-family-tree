from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STYLES = ROOT / 'src' / 'styles'
SCRIPTS = ROOT / 'scripts'

GROUPS = {
    'tokens.css': ['tokens.css'],
    'core.css': [
        'base.css','shell.css','navigation.css','home.css','branding.css','people.css','person.css','stories.css',
        'tree.css','unified-family.css','tree-advanced.css','media.css','explore.css','research.css','record-ingestion.css',
        'mobile-family.css','responsive.css','home-editorial.css','elevation.css','branches.css','archive-shell.css'
    ],
    'composition.css': [
        'base-composition.css','shell-composition.css','home-composition.css','person-composition.css',
        'people-composition.css','tree-composition.css','responsive-composition.css'
    ],
    'experience.css': [
        'mobile-experience.css','family-graph-v19.css','family-graph-navigation.css','family-graph-layout.css',
        'relationship-path-comprehension.css'
    ],
    'home-responsive.css': ['home-editorial-layout.css','home-mobile-polish.css'],
    'interaction.css': ['interaction-contracts.css','family-explorer-navigation.css'],
    'mobile.css': [
        'mobile-v20.css','mobile-app.css','mobile-contract-bridge.css','mobile-immersive.css','mobile-actual-ui.css',
        'mobile-home-stability.css','mobile-directory.css'
    ],
    'print.css': ['print.css'],
}

PATH_MAP = {
    **{n:'core.css' for n in GROUPS['core.css']},
    **{n:'composition.css' for n in GROUPS['composition.css']},
    **{n:'experience.css' for n in GROUPS['experience.css']},
    **{n:'home-responsive.css' for n in GROUPS['home-responsive.css']},
    **{n:'interaction.css' for n in GROUPS['interaction.css']},
    **{n:'mobile.css' for n in GROUPS['mobile.css']},
}

def replace_required(path: Path, old: str, new: str, label: str):
    text = path.read_text(encoding='utf-8')
    if old not in text:
        raise RuntimeError(f'{path}: required migration pattern missing: {label}')
    path.write_text(text.replace(old, new), encoding='utf-8')

expected = {name for names in GROUPS.values() for name in names}
missing = sorted(name for name in expected if not (STYLES / name).exists())
if missing:
    raise RuntimeError(f'Missing expected CSS source files: {missing}')

original = {p.name: p.read_text(encoding='utf-8') for p in STYLES.glob('*.css') if p.name != 'index.css'}

for output, sources in GROUPS.items():
    if len(sources) == 1 and output == sources[0]:
        continue
    chunks = [
        '/* Consolidated stylesheet.\n'
        ' * Source sections are kept in the previous cascade order so this refactor changes\n'
        ' * ownership and file count without intentionally changing visual precedence.\n'
        ' */\n'
    ]
    for source in sources:
        chunks.append(
            '\n/* ==========================================================================\n'
            f'   Source: {source}\n'
            '   ========================================================================== */\n'
            + original[source].rstrip() + '\n'
        )
    (STYLES / output).write_text(''.join(chunks), encoding='utf-8')

(STYLES / 'index.css').write_text(
    """/* Family design-system composition root.\n *\n * Eight live stylesheets. The bundle order preserves the previous cascade while\n * eliminating release-era, compatibility, and micro-layer stylesheet sprawl.\n * New CSS belongs in the owning consolidated file; do not add version-numbered\n * stylesheets or one-off override files.\n */\n@import './tokens.css';\n@import './core.css';\n@import './composition.css';\n@import './experience.css';\n@import './home-responsive.css';\n@import './interaction.css';\n@import './mobile.css';\n@import './print.css';\n""",
    encoding='utf-8'
)

keep = set(GROUPS) | {'index.css'}
for css in STYLES.glob('*.css'):
    if css.name not in keep:
        css.unlink()

for test in SCRIPTS.glob('test-*.mjs'):
    text = test.read_text(encoding='utf-8')
    changed = text
    for old, new in PATH_MAP.items():
        changed = changed.replace(f'src/styles/{old}', f'src/styles/{new}')
    if changed != text:
        test.write_text(changed, encoding='utf-8')

p = SCRIPTS / 'test-v14.mjs'
replace_required(p,
    "for(const semantic of['tokens.css','base.css','home.css','people.css','person.css','tree.css','unified-family.css','record-ingestion.css','mobile-family.css','responsive.css'])",
    "for(const semantic of['tokens.css','core.css','composition.css','experience.css','home-responsive.css','interaction.css','mobile.css','print.css'])",
    'v14 semantic import list')

p = SCRIPTS / 'test-v15.mjs'
replace_required(p,
    "for(const file of['home.css','people.css','person.css'])assert.match(styleRoot,new RegExp(`@import './${file.replace('.','\\\\.')}'`));",
    "assert.match(styleRoot,/@import '\\.\\/core\\.css';/);for(const file of['home.css','people.css','person.css'])assert.match(css,new RegExp(`Source: ${file.replace('.','\\\\.')}`));",
    'v15 route CSS ownership')
text = p.read_text(encoding='utf-8')
old_a = r"assert.match(styleRoot,/@import '\.\/record-ingestion\.css';/);"
old_b = r"assert.match(styleRoot,/@import '\.\/mobile-family\.css';\s*@import '\.\/responsive\.css';/);"
if old_a not in text or old_b not in text:
    raise RuntimeError('test-v15.mjs: historical CSS ownership assertions missing')
text = text.replace(old_a, r"assert.match(styleRoot,/@import '\.\/core\.css';/);" + "for(const file of['record-ingestion.css','mobile-family.css','responsive.css'])assert.match(css,new RegExp(`Source: ${file.replace('.','\\.')}`));")
text = text.replace(old_b, '')
p.write_text(text, encoding='utf-8')

p = SCRIPTS / 'test-v16-2.mjs'
replace_required(p,
    "const semantic=['tokens.css','base.css','shell.css','navigation.css','home.css','people.css','person.css','stories.css','tree.css','media.css','explore.css','research.css','record-ingestion.css','mobile-family.css','responsive.css'];",
    "const semantic=['tokens.css','core.css','composition.css','experience.css','home-responsive.css','interaction.css','mobile.css','print.css'];",
    'v16.2 semantic import list')

p = SCRIPTS / 'test-v18.mjs'
replace_required(p,
    "const compositions=['base-composition.css','shell-composition.css','home-composition.css','person-composition.css','people-composition.css','tree-composition.css','responsive-composition.css'].map(name=>read(`src/styles/${name}`)).join('\\n');",
    "const compositions=read('src/styles/composition.css');",
    'v18 composition aggregate')
replace_required(p,
    "for(const semantic of['tokens.css','base.css','shell.css','navigation.css','home.css','home-editorial.css','people.css','person.css','tree.css','media.css','research.css','record-ingestion.css','mobile-family.css','responsive.css'])",
    "for(const semantic of['tokens.css','core.css','composition.css','experience.css','home-responsive.css','interaction.css','mobile.css','print.css'])",
    'v18 semantic import list')

p = SCRIPTS / 'test-v18-6-ui.mjs'
text = p.read_text(encoding='utf-8')
needle = "const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');\n"
if 'const cssSource=' not in text:
    if needle not in text:
        raise RuntimeError('test-v18-6-ui.mjs: read helper missing')
    text = text.replace(needle, needle + """const cssSource=(bundle,source)=>{\n  const marker=`Source: ${source}`;\n  const start=bundle.indexOf(marker);\n  assert.ok(start>-1,`missing consolidated CSS source ${source}`);\n  const next=bundle.indexOf('Source: ',start+marker.length);\n  return bundle.slice(start,next>-1?next:bundle.length);\n};\n""")

def replace_test_block(source: str, title_start: str, next_title_start: str, replacement: str) -> str:
    start = source.index(title_start)
    end = source.index(next_title_start, start)
    return source[:start] + replacement + source[end:]

text = replace_test_block(text,
    "test('18.7 CSS architecture centralizes print and reduced-motion contracts'",
    "\ntest('18.7 responsive media-query debt",
    """test('18.7 CSS architecture uses consolidated ownership with print authoritative last',async()=>{\n  const index=await read('src/styles/index.css');\n  const print=await read('src/styles/print.css');\n  const interactions=await read('src/styles/interaction.css');\n  const expected=['tokens.css','core.css','composition.css','experience.css','home-responsive.css','interaction.css','mobile.css','print.css'];\n  let previous=-1;\n  for(const name of expected){\n    const position=index.indexOf(`@import './${name}';`);\n    assert.ok(position>previous,`${name} should follow the previous consolidated layer`);\n    previous=position;\n  }\n  assert.equal((index.match(/@import/g)||[]).length,8);\n  assert.match(print,/Consolidated print rules migrated from semantic modules/);\n  assert.match(interactions,/Reduced-motion is a cross-route accessibility contract/);\n});\n""")
text = replace_test_block(text,
    "\ntest('18.7 responsive media-query debt",
    "\ntest('18.8 retires",
    """\ntest('18.7 responsive media-query debt stays within the normalized source budgets',async()=>{\n  const core=await read('src/styles/core.css');\n  const budgets={\n    'responsive.css':55,\n    'shell.css':36,\n    'tree.css':30,\n    'mobile-family.css':18,\n    'navigation.css':28\n  };\n  for(const [name,max] of Object.entries(budgets)){\n    const css=cssSource(core,name);\n    const count=(css.match(/@media/g)||[]).length;\n    assert.ok(count<=max,`${name} has ${count} media blocks; budget is ${max}`);\n  }\n});\n""")
text = replace_test_block(text,
    "\ntest('18.8 retires",
    "\ntest('18.9 archive shell",
    """\ntest('18.8 retires catch-all and micro-layer CSS into consolidated owners',async()=>{\n  const index=await read('src/styles/index.css');\n  assert.doesNotMatch(index,/redesign\\.css/);\n  assert.equal((index.match(/@import/g)||[]).length,8);\n  const composition=await read('src/styles/composition.css');\n  for(const source of ['base-composition.css','shell-composition.css','home-composition.css','person-composition.css','people-composition.css','tree-composition.css','responsive-composition.css']){\n    assert.match(composition,new RegExp(`Source: ${source.replace('.', '\\\\.')}`));\n  }\n  assert.match(composition,/Presentation-only|Evidence-state semantics/);\n});\n""")
text = text.replace(
    "const shell=await read('src/styles/core.css');\n  const runtime=await read('src/runtime/navigation-shell.js');",
    "const core=await read('src/styles/core.css');\n  const shell=cssSource(core,'archive-shell.css');\n  const runtime=await read('src/runtime/navigation-shell.js');")
text = text.replace(
    "const css=await read('src/styles/core.css');\n  assert.doesNotMatch(css,/\\.v151-(?:primary-nav|nav-menu|nav-menus|nav-popover)/);",
    "const core=await read('src/styles/core.css');\n  const css=cssSource(core,'navigation.css');\n  assert.doesNotMatch(css,/\\.v151-(?:primary-nav|nav-menu|nav-menus|nav-popover)/);")
text = text.replace(
    "const css=await read('src/styles/core.css');\n  assert.doesNotMatch(css,/data-v158-context/);",
    "const core=await read('src/styles/core.css');\n  const css=cssSource(core,'tree.css');\n  assert.doesNotMatch(css,/data-v158-context/);")
text = text.replace(
    "const css=await read('src/styles/core.css');\n  const engine=await read('src/runtime/tree-engine.js');",
    "const core=await read('src/styles/core.css');\n  const css=cssSource(core,'tree.css');\n  const engine=await read('src/runtime/tree-engine.js');")
p.write_text(text, encoding='utf-8')

p = SCRIPTS / 'test-v19-2-family-layout.mjs'
replace_required(p,
    """  const nav=index.indexOf("@import './family-graph-navigation.css';");\n  const layout=index.indexOf("@import './family-graph-layout.css';");\n  const interactions=index.indexOf("@import './interaction-contracts.css';");\n  assert.ok(nav>-1&&layout>nav&&interactions>layout);""",
    """  const experienceImport=index.indexOf("@import './experience.css';");\n  const interactions=index.indexOf("@import './interaction.css';");\n  const experience=await read('src/styles/experience.css');\n  const nav=experience.indexOf('Source: family-graph-navigation.css');\n  const layout=experience.indexOf('Source: family-graph-layout.css');\n  assert.ok(experienceImport>-1&&interactions>experienceImport);\n  assert.ok(nav>-1&&layout>nav);""",
    'v19.2 consolidated layer order')

p = SCRIPTS / 'test-v19-family-graph.mjs'
replace_required(p,
    """  const mobile=index.indexOf("@import './mobile-experience.css';");\n  const graph=index.indexOf("@import './family-graph-v19.css';");\n  const interactions=index.indexOf("@import './interaction-contracts.css';");\n  assert.ok(mobile>-1&&graph>mobile&&interactions>graph);""",
    """  const experienceImport=index.indexOf("@import './experience.css';");\n  const interactions=index.indexOf("@import './interaction.css';");\n  const experience=await read('src/styles/experience.css');\n  const mobile=experience.indexOf('Source: mobile-experience.css');\n  const graph=experience.indexOf('Source: family-graph-v19.css');\n  assert.ok(experienceImport>-1&&interactions>experienceImport);\n  assert.ok(mobile>-1&&graph>mobile);""",
    'v19 graph consolidated layer order')

p = SCRIPTS / 'test-home-mobile-polish.mjs'
replace_required(p,
    """  assert.match(index,/@import '\\.\\/home-editorial-layout\\.css';/);\n  assert.match(index,/@import '\\.\\/home-mobile-polish\\.css';/);""",
    """  assert.match(index,/@import '\\.\\/home-responsive\\.css';/);\n  assert.ok(layout.indexOf('Source: home-editorial-layout.css')<layout.indexOf('Source: home-mobile-polish.css'));""",
    'home responsive consolidated import')

p = SCRIPTS / 'test-tree-advanced.mjs'
replace_required(p,
    "assert.match(styleRoot,/@import '\\.\\/tree\\.css';\\s*@import '\\.\\/unified-family\\.css';[\\s\\S]*@import '\\.\\/tree-advanced\\.css';/);",
    "assert.match(styleRoot,/@import '\\.\\/core\\.css';/);assert.ok(styles.indexOf('Source: tree.css')<styles.indexOf('Source: unified-family.css')&&styles.indexOf('Source: unified-family.css')<styles.indexOf('Source: tree-advanced.css'));",
    'tree consolidated import order')

remaining = sorted(p.name for p in STYLES.glob('*.css'))
if remaining != sorted(keep):
    raise RuntimeError(f'Unexpected final CSS set: {remaining}')
print(f'CSS consolidation complete: {len(original)+1} -> {len(remaining)} files')
print('\n'.join(remaining))
