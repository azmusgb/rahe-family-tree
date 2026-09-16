import{test,expect}from'@playwright/test';

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
