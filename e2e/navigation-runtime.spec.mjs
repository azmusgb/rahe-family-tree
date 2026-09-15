import{test,expect}from'@playwright/test';

async function mockApis(page){
  await page.route('**/api/media**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})}));
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('one route lifecycle commits once and keeps the Family nav DOM persistent',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop persistent-shell contract');
  await page.goto('/#dashboard');
  await expect(page.locator('.v17-home-hero')).toBeVisible();
  await page.evaluate(()=>{
    window.__routeCommits=[];
    window.addEventListener('family-route-committed',event=>window.__routeCommits.push(event.detail));
    const home=document.querySelector('#nav a[href="#dashboard"]');
    if(home)home.dataset.persistenceProbe='same-node';
  });

  await page.locator('#nav a[href="#families"]').click();
  await expect(page).toHaveURL(/#families$/);
  await expect(page.locator('.v175-family-grid')).toBeVisible();
  await expect(page.locator('#nav a[href="#dashboard"]')).toHaveAttribute('data-persistence-probe','same-node');
  await expect(page.locator('#nav a[href="#families"]')).toHaveAttribute('aria-current','page');
  await expect(page.locator('body')).toHaveAttribute('data-navigation-shell-route','families');

  const commits=await page.evaluate(()=>window.__routeCommits.map(item=>item.route));
  expect(commits).toEqual(['families']);
});

test('rapid Family navigation settles on the latest route without stale active state',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop route orchestration contract');
  await page.goto('/#dashboard');
  await page.evaluate(()=>{
    location.hash='families';
    location.hash='people';
  });
  await expect(page).toHaveURL(/#people$/);
  await expect(page.locator('[data-v17-native="people"]')).toBeVisible();
  await expect(page.locator('#nav a[href="#people"]')).toHaveAttribute('aria-current','page');
  await expect(page.locator('#nav a[href="#families"]')).not.toHaveAttribute('aria-current','page');
  await expect(page.locator('body')).toHaveAttribute('data-navigation-shell-route','people');
  await expect(page.locator('body')).toHaveAttribute('data-navigation-state','idle');
});

test('browser Back restores route and shell state together',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop history contract');
  await page.goto('/#dashboard');
  await page.locator('#nav a[href="#families"]').click();
  await expect(page).toHaveURL(/#families$/);
  await page.locator('#nav a[href="#people"]').click();
  await expect(page).toHaveURL(/#people$/);
  await page.goBack();
  await expect(page).toHaveURL(/#families$/);
  await expect(page.locator('.v175-family-grid')).toBeVisible();
  await expect(page.locator('#nav a[href="#families"]')).toHaveAttribute('aria-current','page');
  await expect(page.locator('body')).toHaveAttribute('data-navigation-shell-route','families');
});
