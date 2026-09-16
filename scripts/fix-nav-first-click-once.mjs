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
`document.addEventListener('click',event=>{\n  const navLink=event.target.closest?.('#family-mobile-dock a[href^=\"#\"],#nav a[href^=\"#\"],.site-header .brand[href^=\"#\"]');\n  const openOwner=event.target.closest?.('.mobile-more,.nav-menu,.site-tools,.tools-menu');\n  // Keep the disclosure alive through the anchor's default activation. Safari\n  // can defer same-document hash navigation until after event dispatch; closing\n  // the ancestor during capture can make the first tap appear ignored.\n  if(!navLink){if(openOwner)closeTransientNavigation(openOwner);else closeTransientNavigation();}`,
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

fs.writeFileSync('scripts/test-navigation-first-click.mjs',String.raw`import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const shell=fs.readFileSync('src/runtime/navigation-shell.js','utf8');

test('navigation capture preserves disclosure hash links until default activation',()=>{
  assert.match(shell,/const navLink=event\.target\.closest/);
  assert.match(shell,/if\(!navLink\)\{if\(openOwner\)closeTransientNavigation\(openOwner\);else closeTransientNavigation\(\);\}/);
  assert.doesNotMatch(shell,/if\(navLink\)closeTransientNavigation\(\)/);
  assert.match(shell,/family-route-intent',event=>\{previewRoute\(event\.detail\?\.route\);\}/);
});

test('navigation shell applies hash routes through committed-route lifecycle only',()=>{
  assert.match(shell,/family-route-committed',event=>\{closeTransientNavigation\(\);apply\(event\.detail\?\.route\|\|routeKey\(\)\);\}/);
  assert.doesNotMatch(shell,/addEventListener\('hashchange',[^\n]*apply\(/);
});

test('navigation compatibility selectors contain no duplicate arms',()=>{
  assert.match(shell,/const transientSelector='\.mobile-more\[open\],\.nav-menu\[open\],\.site-tools\[open\],\.tools-menu\[open\]';/);
  assert.doesNotMatch(shell,/mobile-more\[open\],\.mobile-more\[open\]/);
  assert.doesNotMatch(shell,/nav-menu\[open\],\.nav-menu\[open\]/);
  assert.match(shell,/primary\.classList\.add\('primary-nav'\);menus\.classList\.add\('nav-menus'\);/);
});
`);

fs.writeFileSync('e2e/navigation-first-click.spec.mjs',String.raw`import{test,expect}from'@playwright/test';

async function mockApis(page){
  await page.route('**/api/media**',async route=>{const url=new URL(route.request().url());if(url.searchParams.has('file'))return route.fulfill({status:404,contentType:'text/plain',body:'not found'});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})});});
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('desktop primary navigation accepts every first physical click',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop navigation contract');
  await page.goto('/#dashboard');
  for(const route of['families','people','tree','dashboard','people']){
    const link=page.locator('#nav').locator('a[href="#'+route+'"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(url=>url.hash==='#'+route);
  }
});

test('desktop Explore disclosure link navigates on the first click before closing',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop disclosure contract');
  await page.goto('/#dashboard');
  const menu=page.locator('#nav .nav-menu').first();
  await menu.locator(':scope > summary').click();
  await expect(menu).toHaveAttribute('open','');
  const link=menu.locator('.nav-popover a[href^="#"]').first();
  const href=await link.getAttribute('href');
  expect(href).toMatch(/^#/);
  await link.click();
  await expect(page).toHaveURL(url=>url.hash===href);
  await expect(page.locator('#nav .nav-menu').first()).not.toHaveAttribute('open','');
});

test('mobile More disclosure link navigates on its first tap',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-chromium','mobile navigation contract');
  await page.goto('/#dashboard');
  const more=page.locator('#family-mobile-dock .mobile-more');
  await more.locator(':scope > summary').click();
  await expect(more).toHaveAttribute('open','');
  const link=more.locator('[role="dialog"] a[href^="#"]').first();
  const href=await link.getAttribute('href');
  expect(href).toMatch(/^#/);
  await link.click();
  await expect(page).toHaveURL(url=>url.hash===href);
  await expect(page.locator('#family-mobile-dock .mobile-more')).not.toHaveAttribute('open','');
});
`);

for(const temp of['scripts/fix-nav-first-click-once.mjs','.github/workflows/nav-first-click-fix-once.yml']){
  try{fs.unlinkSync(temp);}catch(error){if(error.code!=='ENOENT')throw error;}
}
