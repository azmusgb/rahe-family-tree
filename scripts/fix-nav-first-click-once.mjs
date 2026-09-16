import fs from'node:fs';

const file='src/runtime/navigation-shell.js';
let source=fs.readFileSync(file,'utf8');

function replaceOnce(from,to,label){
  const first=source.indexOf(from);
  if(first<0)throw new Error(`Missing expected ${label} pattern`);
  if(source.indexOf(from,first+1)>=0)throw new Error(`Expected one ${label} pattern`);
  source=source.replace(from,to);
}

replaceOnce(
  "const transientSelector='.mobile-more[open],.mobile-more[open],.nav-menu[open],.nav-menu[open],.site-tools[open],.tools-menu[open]';",
  "const transientSelector='.mobile-more[open],.nav-menu[open],.site-tools[open],.tools-menu[open]';",
  'transient selector'
);

replaceOnce(
  "primary.classList.add('primary-nav','primary-nav');menus.classList.add('nav-menus','nav-menus');",
  "primary.classList.add('primary-nav');menus.classList.add('nav-menus');",
  'canonical nav class sync'
);

replaceOnce(
`document.addEventListener('click',event=>{\n  const openOwner=event.target.closest?.('.mobile-more,.nav-menu,.nav-menu,.site-tools,.tools-menu');\n  if(openOwner)closeTransientNavigation(openOwner);else closeTransientNavigation();\n  const navLink=event.target.closest?.('#family-mobile-dock a[href^=\"#\"],#nav a[href^=\"#\"],.site-header .brand[href^=\"#\"]');\n  if(navLink)closeTransientNavigation();`,
`document.addEventListener('click',event=>{\n  const navLink=event.target.closest?.('#family-mobile-dock a[href^=\"#\"],#nav a[href^=\"#\"],.site-header .brand[href^=\"#\"]');\n  const openOwner=event.target.closest?.('.mobile-more,.nav-menu,.site-tools,.tools-menu');\n  // Do not collapse a disclosure around an anchor during capture. Safari can\n  // defer the anchor's default hash navigation until after dispatch; removing\n  // the open state here makes a first click intermittently feel ignored.\n  // The committed-route handler closes transient navigation immediately after\n  // the location actually changes.\n  if(!navLink){if(openOwner)closeTransientNavigation(openOwner);else closeTransientNavigation();}`,
  'capture click navigation handling'
);

replaceOnce(
  "window.addEventListener('family-route-intent',event=>{closeTransientNavigation();previewRoute(event.detail?.route);});",
  "window.addEventListener('family-route-intent',event=>{previewRoute(event.detail?.route);});",
  'route intent handler'
);

replaceOnce(
  "window.addEventListener('hashchange',()=>{closeTransientNavigation();apply(routeKey());});\n",
  '',
  'duplicate hashchange shell sync'
);

fs.writeFileSync(file,source);

const testFile='scripts/test-navigation-first-click.mjs';
fs.writeFileSync(testFile,`import test from'node:test';\nimport assert from'node:assert/strict';\nimport fs from'node:fs';\n\nconst shell=fs.readFileSync('src/runtime/navigation-shell.js','utf8');\n\ntest('navigation capture does not collapse a hash-link disclosure before default activation',()=>{\n  assert.match(shell,/const navLink=event\\.target\\.closest/);\n  assert.match(shell,/if\\(!navLink\\)\\{if\\(openOwner\\)closeTransientNavigation\\(openOwner\\);else closeTransientNavigation\\(\\);\\}/);\n  assert.doesNotMatch(shell,/if\\(navLink\\)closeTransientNavigation\\(\\)/);\n  assert.match(shell,/family-route-intent',event=>\\{previewRoute\\(event\\.detail\\?\\.route\\);\\}/);\n});\n\ntest('navigation shell applies each hash route through the committed-route lifecycle only',()=>{\n  assert.match(shell,/family-route-committed',event=>\\{closeTransientNavigation\\(\\);apply\\(event\\.detail\\?\\.route\\|\\|routeKey\\(\\)\\);\\}/);\n  assert.doesNotMatch(shell,/addEventListener\\('hashchange',[^\\n]*apply\\(/);\n});\n\ntest('transient selector and canonical class synchronization contain no duplicate compatibility arms',()=>{\n  assert.match(shell,/const transientSelector='\\.mobile-more\\[open\\],\\.nav-menu\\[open\\],\\.site-tools\\[open\\],\\.tools-menu\\[open\\]';/);\n  assert.doesNotMatch(shell,/mobile-more\\[open\\],\\.mobile-more\\[open\\]/);\n  assert.doesNotMatch(shell,/nav-menu\\[open\\],\\.nav-menu\\[open\\]/);\n  assert.match(shell,/primary\\.classList\\.add\\('primary-nav'\\);menus\\.classList\\.add\\('nav-menus'\\);/);\n});\n`);

const e2eFile='e2e/navigation-first-click.spec.mjs';
fs.writeFileSync(e2eFile,`import{test,expect}from'@playwright/test';\n\nasync function mockApis(page){\n  await page.route('**/api/media**',async route=>{const url=new URL(route.request().url());if(url.searchParams.has('file'))return route.fulfill({status:404,contentType:'text/plain',body:'not found'});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})});});\n  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));\n  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));\n}\n\ntest.beforeEach(async({page})=>{await mockApis(page);});\n\ntest('desktop primary navigation accepts every first physical click',async({page},testInfo)=>{\n  test.skip(testInfo.project.name!=='desktop-chromium','desktop navigation contract');\n  await page.goto('/#dashboard');\n  for(const route of['families','people','tree','dashboard','people']){\n    const link=page.locator('#nav').locator(\`a[href=\"#\${route}\"]\`).first();\n    await expect(link).toBeVisible();\n    await link.click();\n    await expect(page).toHaveURL(new RegExp(\`#\${route}$\`));\n  }\n});\n\ntest('desktop Explore disclosure link navigates on the first click before the menu closes',async({page},testInfo)=>{\n  test.skip(testInfo.project.name!=='desktop-chromium','desktop disclosure contract');\n  await page.goto('/#dashboard');\n  const menu=page.locator('#nav .nav-menu').first();\n  await menu.locator(':scope > summary').click();\n  await expect(menu).toHaveAttribute('open','');\n  const link=menu.locator('.nav-popover a[href^=\"#\"]').first();\n  const href=await link.getAttribute('href');\n  expect(href).toMatch(/^#/);\n  await link.click();\n  await expect(page).toHaveURL(new RegExp(\`\${href.replace(/[.*+?^\\${}()|[\\]\\\\]/g,'\\\\$&')}$\`));\n  await expect(page.locator('#nav .nav-menu').first()).not.toHaveAttribute('open','');\n});\n\ntest('mobile More disclosure link navigates on its first tap',async({page},testInfo)=>{\n  test.skip(testInfo.project.name!=='mobile-chromium','mobile navigation contract');\n  await page.goto('/#dashboard');\n  const more=page.locator('#family-mobile-dock .mobile-more');\n  await more.locator(':scope > summary').click();\n  await expect(more).toHaveAttribute('open','');\n  const link=more.locator('[role=\"dialog\"] a[href^=\"#\"]').first();\n  const href=await link.getAttribute('href');\n  expect(href).toMatch(/^#/);\n  await link.click();\n  await expect(page).toHaveURL(new RegExp(\`\${href.replace(/[.*+?^\\${}()|[\\]\\\\]/g,'\\\\$&')}$\`));\n  await expect(page.locator('#family-mobile-dock .mobile-more')).not.toHaveAttribute('open','');\n});\n`);

for(const temp of['scripts/fix-nav-first-click-once.mjs','.github/workflows/nav-first-click-fix-once.yml']){
  try{fs.unlinkSync(temp);}catch(error){if(error.code!=='ENOENT')throw error;}
}
