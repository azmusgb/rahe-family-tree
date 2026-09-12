import{test,expect}from'@playwright/test';

async function mockApis(page){
  await page.route('**/api/media**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})}));
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('mobile family search is a compact categorized command surface',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-chromium','mobile family-search contract');
  await page.goto('/#dashboard');
  const search=page.locator('#search');
  await expect(search).toBeVisible();
  await search.fill('Aimee');

  const layer=page.locator('#family-search-layer');
  const sheet=page.locator('#search-v13-2-results.family-search-command');
  await expect(layer).toBeVisible();
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('.family-search-summary h2')).toContainText('matches for “Aimee”');
  await expect(sheet).not.toContainText('Word-order independent search');
  await expect(sheet.getByRole('tab',{name:/All/})).toBeVisible();
  await expect(sheet.getByRole('tab',{name:/People/})).toBeVisible();
  await expect(sheet.getByRole('tab',{name:/Families/})).toBeVisible();
  await expect(sheet.locator('.family-search-marker.people').first()).toBeVisible();
  await expect(sheet.getByRole('link',{name:/Search Research Center/})).toBeVisible();

  await sheet.getByRole('tab',{name:/Families/}).click();
  await expect(sheet.getByRole('tab',{name:/Families/})).toHaveAttribute('aria-selected','true');
  const peopleGroup=sheet.locator('.search-group').filter({hasText:/People/i}).first();
  await expect(peopleGroup).toBeHidden();

  await sheet.getByRole('button',{name:'Close search results'}).click();
  await expect(sheet).toHaveCount(0);
  await expect(layer).toHaveCount(0);
  await expect(search).toHaveValue('Aimee');
  // Automatic focus restoration must not reopen the sheet; a deliberate user tap does.
  await search.click();
  await expect(page.locator('#family-search-layer')).toBeVisible();
  await expect(page.locator('#search-v13-2-results.family-search-command')).toBeVisible();
});
