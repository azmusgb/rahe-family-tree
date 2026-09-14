import{test,expect}from'@playwright/test';

const HAZEL='P-HAZEL-EMMA-BERG-DENNEWITZ';

async function mockApis(page){
  await page.route('**/api/media**',async route=>{const url=new URL(route.request().url());if(url.searchParams.has('file'))return route.fulfill({status:404,contentType:'text/plain',body:'not found'});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})});});
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('Home begins with the hero and has no inline search bar above it',async({page})=>{
  await page.goto('/#dashboard');
  await expect(page.locator('.v17-home-hero')).toBeVisible();
  await expect(page.locator('#filters')).toBeHidden();
  await expect(page.locator('.site-header')).toBeVisible();
  await expect(page.locator('.site-footer')).toBeVisible();
});

test('Families is a first-class navigation destination with branch pages',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop header contract');
  await page.goto('/#dashboard');
  const families=page.locator('#nav').getByRole('link',{name:'Families',exact:true});
  await expect(families).toBeVisible();
  // The navigation shell can be replaced during route hydration. Invoke the
  // link's native activation in the live DOM so this test exercises the real
  // route without racing Playwright's pointer-action stability checks.
  await families.evaluate(link=>link.click());
  await expect(page).toHaveURL(/#families$/);
  const grid=page.locator('.v175-family-grid');
  await expect(grid).toBeVisible();
  const first=grid.locator('.v175-family-card').first();
  const name=(await first.locator('h2').textContent())?.trim();
  await first.click();
  await expect(page).toHaveURL(/#branch\//);
  await expect(page.locator('.v175-branch-hero h1')).toContainText(name||'family');
  await expect(page.locator('.v175-branch-actions')).toBeVisible();
});

test('Home branch cards open real branch destinations',async({page})=>{
  await page.goto('/#dashboard');
  const card=page.locator('.v172-branch-card').first();
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('href',/#branch\//);
});

test('plain Tree entry reflects the engine effective connected scope',async({page})=>{
  await page.goto('/#tree');
  const context=page.locator('.v174-tree-context');
  await expect(context).toBeVisible();
  await expect(context).toHaveAttribute('data-scope','connected');
  await expect(context.getByRole('button',{name:'Connected'})).toHaveAttribute('aria-pressed','true');
});

test('tree scope and branch jumps keep elevated context synchronized',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=family#tree`);
  const context=page.locator('.v174-tree-context');
  await expect(context).toHaveAttribute('data-scope','family');
  // This case verifies state synchronization across the tree rerender. Pointer
  // actionability is covered by the focused v17.4 interaction test, so invoke
  // the same native click handler directly to avoid a transient overlay race.
  await context.getByRole('button',{name:'Ancestors'}).evaluate(button=>button.click());
  await expect(page).toHaveURL(/scope=ancestors/);
  await expect(page.locator('.v174-tree-context')).toHaveAttribute('data-scope','ancestors');
  const branch=page.locator('[data-v172-tree-branch]').first();
  await expect(branch).toBeVisible();
  await branch.click();
  await expect(page).toHaveURL(/scope=family/);
  await expect(page.locator('.v174-tree-context')).toHaveAttribute('data-scope','family');
});

test('mobile navigation promotes Families and global Search leaves Home clean',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-chromium','mobile navigation contract');
  await page.goto('/#dashboard');
  const dock=page.locator('#family-mobile-dock');
  await expect(dock.getByRole('link',{name:'Families'})).toBeVisible();
  await page.locator('.site-header [data-global-search]').click();
  await expect(page).toHaveURL(/#people$/);
  await expect(page.locator('#search')).toBeFocused();
});
