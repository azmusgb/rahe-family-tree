import{test,expect}from'@playwright/test';

async function mockApis(page){
  await page.route('**/api/media**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})}));
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('Research Intelligence exposes transparent priorities and identity candidates without auto-merge language',async({page})=>{
  await page.goto('/#intelligence');
  await expect(page.getByRole('heading',{name:'Prioritized research gaps'})).toBeVisible();
  await expect(page.getByText('Transparent priority model')).toBeVisible();
  await expect(page.getByText(/genealogical importance × evidence weakness × expected record value × feasibility/i)).toBeVisible();
  await expect(page.getByRole('heading',{name:'Possible identity matches'})).toBeVisible();
  await expect(page.getByText('No automatic identity merge')).toBeVisible();
});

test('explicit unresolved identity bridge stays visibly unresolved in candidate review',async({page})=>{
  await page.goto('/#intelligence');
  const candidate=page.locator('.ri-candidates .ri-row').filter({hasText:/Existing identity bridge:/i}).first();
  await expect(candidate).toBeVisible();
  await expect(candidate).toContainText(/controlling state UNRESOLVED/i);
});

test('research automation remains advisory after route transitions',async({page})=>{
  await page.goto('/#intelligence');
  await expect(page.getByRole('heading',{name:'Prioritized research gaps'})).toBeVisible();
  await page.goto('/#people');
  await expect(page.locator('[data-ui-native="people"]')).toBeVisible();
  await page.goto('/#intelligence');
  await expect(page.getByRole('heading',{name:'Prioritized research gaps'})).toBeVisible();
  await expect(page.getByText(/never increases evidence strength or changes a claim/i)).toBeVisible();
});
