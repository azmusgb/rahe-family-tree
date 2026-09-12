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
  const branch=page.locator('#branch');
  const values=await branch.locator('option').evaluateAll(options=>options.map(option=>option.value).filter(Boolean));
  expect(values.length).toBeGreaterThan(0);
  await branch.selectOption(values[0]);
  await expect(page.locator('.v162-branch-context')).toBeVisible();
  await expect(page.locator('.v162-branch-context').getByRole('link',{name:'Stories'})).toBeVisible();
});

test('person page exposes immediate family path without opening research tooling',async({page})=>{
  await page.goto('/#dashboard');
  await page.locator('#search').fill('Hazel Berg');
  const result=page.locator('#search-v13-2-results [data-person]').filter({hasText:'Hazel'}).first();
  await expect(result).toBeVisible();
  await result.click();
  const path=page.locator('.v162-family-path');
  await expect(path).toBeVisible();
  await expect(path.getByText('IMMEDIATE FAMILY',{exact:true})).toBeVisible();
  await expect(path.getByRole('link',{name:/View in tree/})).toBeVisible();
});

test('photos offers immediate family-facing quick filters',async({page})=>{
  await page.goto('/#media');
  const quick=page.locator('.v162-media-quick');
  await expect(quick).toBeVisible();
  await quick.getByRole('button',{name:'Photos',exact:true}).click();
  await expect(page.locator('#media-type')).toHaveValue('photo');
  await expect(quick.getByRole('button',{name:'Photos',exact:true})).toHaveClass(/active/);
});
