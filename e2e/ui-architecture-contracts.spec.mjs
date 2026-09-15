import{test,expect}from'@playwright/test';

async function mockApis(page){
  await page.route('**/api/media**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})}));
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('semantic shell owns surface state and hidden always wins',async({page})=>{
  await page.goto('/#dashboard');
  await expect(page.locator('body')).toHaveAttribute('data-surface','immersive');
  await expect(page.locator('link[rel="stylesheet"]')).toHaveAttribute('href',/styles\.css\?v=20\.0\.0$/);
  await expect(page.locator('#filters')).toBeHidden();
  const display=await page.locator('#filters').evaluate(el=>getComputedStyle(el).display);
  expect(display).toBe('none');
  await expect(page.locator('.primary-nav')).toBeAttached();
  await expect(page.locator('.nav-menus')).toBeAttached();
});

test('desktop popovers close on outside click and Escape and sync aria-expanded',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop popover contract');
  await page.goto('/#dashboard');
  await expect(page.locator('#nav .primary-nav')).toHaveAttribute('data-nav-context','family');
  const explore=page.locator('#nav details.nav-menu').filter({hasText:'Explore'}).first();
  const exploreSummary=explore.locator(':scope > summary');
  await expect(exploreSummary).toBeVisible();
  await exploreSummary.click();
  await expect(explore).toHaveAttribute('open','');
  await expect(exploreSummary).toHaveAttribute('aria-expanded','true');
  await page.locator('#main').click({position:{x:6,y:6}});
  await expect(explore).not.toHaveAttribute('open','');
  await expect(exploreSummary).toHaveAttribute('aria-expanded','false');

  await exploreSummary.click();
  await expect(explore).toHaveAttribute('open','');
  await expect(exploreSummary).toHaveAttribute('aria-expanded','true');
  await page.keyboard.press('Escape');
  await expect(explore).not.toHaveAttribute('open','');
  await expect(exploreSummary).toHaveAttribute('aria-expanded','false');
  await expect(exploreSummary).toBeFocused();
});

test('route navigation keeps current-page semantics synchronized',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop navigation contract');
  await page.goto('/#people');
  await expect(page.locator('#nav [data-nav-key="people"]')).toHaveAttribute('aria-current','page');
  await expect(page.locator('#crumb')).toHaveAttribute('aria-current','page');
  await expect(page.locator('#crumb')).toContainText('People');
});

test('mobile app reserves safe-area space and keeps touch targets usable',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-chromium','mobile shell contract');
  await page.goto('/#people');
  await expect(page.locator('body')).toHaveClass(/v21-actual-mobile-ui/);
  const paddingBottom=await page.locator('body').evaluate(el=>parseFloat(getComputedStyle(el).paddingBottom));
  expect(paddingBottom).toBeGreaterThanOrEqual(80);
  const dock=page.locator('#family-mobile-dock');
  await expect(dock).toBeVisible();
  const boxes=await dock.locator(':scope > a,:scope > details > summary').evaluateAll(nodes=>nodes.map(node=>{const rect=node.getBoundingClientRect();return{width:rect.width,height:rect.height};}));
  for(const box of boxes){expect(box.height).toBeGreaterThanOrEqual(44);expect(box.width).toBeGreaterThanOrEqual(44);}
});
