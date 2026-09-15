import{test,expect}from'@playwright/test';

async function mockApis(page){
  await page.route('**/api/media**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})}));
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

async function clickDockRoute(dock,name){
  await dock.getByRole('link',{name}).click({noWaitAfter:true});
}

test('mobile app navigation owns Home Families Tree People and More',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-chromium','mobile navigation contract');
  await page.goto('/#dashboard');
  await expect(page.locator('.v17-home-hero')).toBeVisible();
  await expect(page.locator('#mobile-app-header')).toBeVisible();
  await expect(page.locator('.site-header.sidebar')).toBeHidden();
  const dock=page.locator('#family-mobile-dock');
  await expect(dock).toBeVisible();
  const order=await dock.evaluate(node=>[...node.children].map(child=>child.matches('a')?child.querySelector('span')?.textContent?.trim():child.querySelector('summary')?.textContent?.trim()));
  expect(order).toEqual(['Home','Families','Tree','People','More']);

  await clickDockRoute(dock,'Tree');
  await expect(page).toHaveURL(/#tree$/);
  await expect(page.locator('[data-v17-native="tree"]')).toBeVisible();
  await clickDockRoute(dock,'Families');
  await expect(page).toHaveURL(/#families$/);
  await expect(page.locator('.v175-family-grid')).toBeVisible();
  await clickDockRoute(dock,'People');
  await expect(page).toHaveURL(/#people$/);
  await expect(page.locator('[data-v17-native="people"]')).toBeVisible();
  await dock.locator('.v158-mobile-more>summary').click();
  await clickDockRoute(dock,'Photos');
  await expect(page).toHaveURL(/#media$/);
  await expect(page.locator('[data-media-page]')).toBeVisible();
  await dock.locator('.v158-mobile-more>summary').click();
  await dock.getByRole('button',{name:'Search'}).click();
  await expect(page).toHaveURL(/#people$/);
  await expect(page.locator('[data-v17-native="people"] .v21-mobile-search input')).toBeFocused();
});
