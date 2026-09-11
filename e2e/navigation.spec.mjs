import{test,expect}from'@playwright/test';

async function mockApis(page){
  await page.route('**/api/media**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})}));
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('mobile dock is tappable and routes Home Tree People Media and Search',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-chromium','mobile navigation contract');
  await page.goto('/#dashboard');
  await expect(page.locator('.dashboard-hero')).toBeVisible();
  await expect(page.locator('.sidebar')).toBeHidden();
  const dock=page.locator('#family-mobile-dock');
  await expect(dock).toBeVisible();

  await dock.getByRole('link',{name:'Tree'}).click();
  await expect(page).toHaveURL(/#tree$/);
  await expect(page.locator('#title')).toHaveText('Tree');

  await dock.getByRole('link',{name:'People'}).click();
  await expect(page).toHaveURL(/#people$/);
  await expect(page.locator('#title')).toHaveText('People');

  await dock.getByRole('link',{name:'Media'}).click();
  await expect(page).toHaveURL(/#media$/);
  await expect(page.locator('[data-media-page]')).toBeVisible();

  await dock.getByRole('link',{name:'Home'}).click();
  await expect(page).toHaveURL(/#dashboard$/);
  await expect(page.locator('.dashboard-hero')).toBeVisible();

  await dock.getByRole('button',{name:'Search'}).click();
  await expect(page.locator('#search')).toBeFocused();
});

test('typing search does not destroy the current page and a result opens',async({page})=>{
  await page.goto('/#dashboard');
  await expect(page.locator('.dashboard-hero')).toBeVisible();
  await page.locator('#search').fill('Hazel Berg');
  await expect(page.locator('.dashboard-hero')).toBeVisible();
  const result=page.locator('#search-v13-2-results [data-person]').filter({hasText:'Hazel'}).first();
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(/#person\//);
  await expect(page.locator('#title')).toHaveText('Person profile');
});

test('tree person visual is a one-click route to a profile',async({page})=>{
  await page.goto('/#tree');
  const node=page.locator('.graph-node[data-person]').first();
  await expect(node).toBeAttached();
  await node.locator('.node-avatar').click();
  await expect(page).toHaveURL(/#person\//);
  await expect(page.locator('#title')).toHaveText('Person profile');
});

test('desktop primary navigation includes and opens Media as a core route',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop navigation contract');
  await page.goto('/#dashboard');
  const nav=page.locator('#nav');
  await expect(nav.getByRole('link',{name:'Media',exact:true})).toBeVisible();
  await nav.getByRole('link',{name:'Media',exact:true}).click();
  await expect(page).toHaveURL(/#media$/);
  await expect(page.locator('[data-media-page]')).toBeVisible();
});

test('desktop relayout uses a horizontal masthead and side-by-side route tools',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop relayout contract');
  await page.goto('/#dashboard');
  const sidebar=page.locator('.sidebar'),heading=page.locator('.route-shell .page-heading'),filters=page.locator('.route-shell #filters');
  await expect(sidebar).toBeVisible();
  await expect(page.locator('.v151-primary-nav')).toBeVisible();
  const shellBox=await sidebar.boundingBox(),headingBox=await heading.boundingBox(),filterBox=await filters.boundingBox();
  expect(shellBox.height).toBeLessThan(100);
  expect(shellBox.width).toBeGreaterThan(1000);
  expect(Math.abs(headingBox.y-filterBox.y)).toBeLessThan(80);
  expect(filterBox.x).toBeGreaterThan(headingBox.x);
  await expect(page.locator('.dashboard-family-layout')).toBeVisible();
});

test('desktop research menu exposes advanced routes without crowding primary family navigation',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop relayout contract');
  await page.goto('/#dashboard');
  const menu=page.locator('.v151-nav-menu').filter({hasText:'Research'}).first();
  await menu.locator('summary').click();
  await expect(menu.getByRole('link',{name:/Evidence/}).first()).toBeVisible();
  await menu.getByRole('link',{name:/Sources/}).first().click();
  await expect(page).toHaveURL(/#sources$/);
  await expect(page.locator('#title')).toHaveText('Sources');
});
