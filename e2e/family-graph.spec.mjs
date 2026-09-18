import{test,expect}from'@playwright/test';

const HAZEL='P-HAZEL-EMMA-BERG-DENNEWITZ';
async function mockApis(page){
  await page.route('**/api/media**',async route=>{const url=new URL(route.request().url());if(url.searchParams.has('file'))return route.fulfill({status:404,contentType:'text/plain',body:'not found'});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})});});
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}
test.beforeEach(async({page})=>{await mockApis(page);});

test('v19 Family Graph adds direct-line hierarchy without changing tree navigation',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=connected#tree`);
  await expect(page.locator('body')).toHaveAttribute('data-family-graph','v19');
  const summary=page.locator('.family-graph-summary');
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('FAMILY GRAPH');
  await expect(page.locator(`#family-graph .graph-node[data-person="${HAZEL}"]`)).toHaveClass(/family-graph-focus/);
  expect(await page.locator('#family-graph .graph-node.family-graph-direct').count()).toBeGreaterThan(0);
  await expect(page.locator('.tree-advanced-nav')).toBeVisible();
});

test('v19 family-unit framing is presentation-only and sits behind rendered people',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=connected#tree`);
  await expect(page.locator('#family-graph')).toBeVisible();
  const unitLayer=page.locator('#family-graph [data-family-units-v19]');
  await expect(unitLayer).toHaveCount(1);
  expect(await page.locator('#family-graph .graph-node[data-person]').count()).toBeGreaterThan(0);
  await expect(page.locator('.family-graph-summary')).toContainText(/family unit/i);
});

test('mobile person tap opens a privacy-aware preview before profile navigation',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(`/?focus=${HAZEL}&scope=family&depth=2#tree`);
  const node=page.locator(`#family-graph .graph-node[data-person="${HAZEL}"]`);
  await expect(node).toBeVisible();
  await node.click();
  const preview=page.locator('.family-person-preview');
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute('role','dialog');
  await expect(preview).toContainText(/Hazel/i);
  await expect(preview.locator('[data-family-preview-focus]')).toBeVisible();
  await expect(preview.locator('[data-family-preview-profile]')).toBeVisible();
  await preview.locator('[data-family-preview-close]').click();
  await expect(preview).toHaveCount(0);
});
