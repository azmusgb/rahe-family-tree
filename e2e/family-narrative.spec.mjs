import{test,expect}from'@playwright/test';

async function mockApis(page){
  await page.route('**/api/media**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})}));
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('home surfaces supported family moments and places as narrative content',async({page})=>{
  await page.goto('/#dashboard');
  const journey=page.locator('.v162-family-journey');
  await expect(journey).toBeVisible();
  await expect(journey.getByRole('heading',{name:'Across generations and places'})).toBeVisible();
  await expect(journey.locator('.v162-moment').first()).toBeVisible();
  await expect(journey.getByRole('link',{name:/Explore all stories/})).toBeVisible();
});

test('people branch selection gets human branch context',async({page})=>{
  await page.goto('/#people');
  const browser=page.locator('.v159-branch-browser');
  await expect(browser).toBeVisible();
  const branchButton=browser.locator('[data-v159-branch]').filter({hasNotText:'All'}).first();
  await expect(branchButton).toBeVisible();
  const branchName=await branchButton.getAttribute('data-v159-branch');
  expect(branchName).toBeTruthy();
  await branchButton.click();
  await expect(page.locator('#branch')).toHaveValue(branchName);
  const context=page.locator('.v162-branch-context');
  await expect(context).toBeVisible();
  await expect(context.locator('.eyebrow')).toHaveText(`${branchName.toUpperCase()} FAMILY`);
  await expect(context.getByRole('link',{name:'Stories'})).toBeVisible();
});

test('person page exposes immediate family path and clean focused-tree navigation',async({page})=>{
  await page.goto('/#dashboard');
  await page.locator('#search').fill('Hazel Berg');
  const result=page.locator('#search-v13-2-results [data-person]').filter({hasText:'Hazel'}).first();
  await expect(result).toBeVisible();
  await result.click();
  const path=page.locator('.v162-family-path');
  await expect(path).toBeVisible();
  await expect(path.getByText('IMMEDIATE FAMILY',{exact:true})).toBeVisible();
  const treeLink=path.getByRole('link',{name:/View in tree/});
  await expect(treeLink).toBeVisible();
  const href=await treeLink.getAttribute('href');
  expect(href).toContain('focus=');
  expect(href).toContain('scope=family');
  expect(href).not.toContain('q=');
  expect(href).not.toContain('branch=');
  expect(href).not.toContain('state=');
});

test('photos quick filters stay synchronized with clear filters',async({page})=>{
  await page.goto('/#media');
  const quick=page.locator('.v162-media-quick');
  await expect(quick).toBeVisible();
  await quick.getByRole('button',{name:'Photos',exact:true}).click();
  await expect(page.locator('#media-type')).toHaveValue('photo');
  await expect(quick.getByRole('button',{name:'Photos',exact:true})).toHaveClass(/active/);
  const details=page.locator('.v161-media-filters');
  await details.locator('summary').click();
  await details.getByRole('button',{name:'Clear media filters'}).click();
  await expect(page.locator('#media-type')).toHaveValue('all');
  await expect(quick.getByRole('button',{name:'All',exact:true})).toHaveClass(/active/);
});
