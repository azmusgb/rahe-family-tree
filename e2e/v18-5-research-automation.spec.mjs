import{test,expect}from'@playwright/test';

async function mockApis(page){
  await page.route('**/api/media**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})}));
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('v18.5 Research Intelligence renders automated research priorities and identity candidates',async({page})=>{
  await page.goto('/#intelligence');
  await expect(page.locator('html')).toHaveAttribute('data-ui-release','18.5.0');
  await expect(page.getByRole('heading',{name:'Prioritized research gaps'})).toBeVisible();
  await expect(page.getByText('Transparent priority model')).toBeVisible();
  await expect(page.getByText(/genealogical importance × evidence weakness × expected value × feasibility/i)).toBeVisible();
  await expect(page.getByRole('heading',{name:'Possible identity matches'})).toBeVisible();
  await expect(page.getByText('No automatic identity merge')).toBeVisible();
});

test('v18.5 identity candidate UI preserves unresolved bridge language',async({page})=>{
  await page.goto('/#intelligence');
  const candidate=page.locator('.ri-row').filter({hasText:/identity bridge:/i}).first();
  await expect(candidate).toBeVisible();
  await expect(candidate).toContainText(/controlling state UNRESOLVED/i);
});

test('v18.5 research automation stays available after route transitions',async({page})=>{
  await page.goto('/#intelligence');
  await expect(page.getByRole('heading',{name:'Prioritized research gaps'})).toBeVisible();
  await page.goto('/#people');
  await expect(page.locator('[data-v17-native="people"]')).toBeVisible();
  await page.goto('/#intelligence');
  await expect(page.getByRole('heading',{name:'Prioritized research gaps'})).toBeVisible();
});
