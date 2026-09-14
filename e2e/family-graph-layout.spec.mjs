import{test,expect}from'@playwright/test';

const HAZEL='P-HAZEL-EMMA-BERG-DENNEWITZ';
async function mockApis(page){
  await page.route('**/api/media**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})}));
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}
test.beforeEach(async({page})=>{await mockApis(page);});

test('relative generation lanes and direct-line rail are present for a focused tree',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=family&depth=2#tree`);
  const rail=page.locator('[data-family-lineage-rail]');
  await expect(rail).toBeVisible();
  await expect(rail.getByText('Direct family line')).toBeVisible();
  await expect(page.locator('#family-graph .generation-lane[data-family-generation="0"]')).toHaveCount(1);
  await expect(page.locator('[data-family-lineage-generation="0"]')).toBeVisible();
  await expect(page.locator(`[data-family-lineage-person="${HAZEL}"]`).first()).toHaveAttribute('aria-current','true');
  expect(await page.locator('[data-family-lineage-generation]').count()).toBeGreaterThan(1);
});

test('lineage rail refocuses the tree without changing canonical graph state',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=family&depth=2#tree`);
  const other=page.locator('[data-family-lineage-person]').filter({hasNot:page.locator(`[data-family-lineage-person="${HAZEL}"]`)}).first();
  const target=await other.getAttribute('data-family-lineage-person');
  expect(target).toBeTruthy();
  await other.click();
  await expect(page).toHaveURL(new RegExp(`focus=${encodeURIComponent(target)}`));
  await expect(page.locator(`[data-family-lineage-person="${target}"]`).first()).toHaveAttribute('aria-current','true');
});

test('mobile lineage rail is horizontally contained and keeps touch targets usable',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(`/?focus=${HAZEL}&scope=family&depth=2#tree`);
  const rail=page.locator('[data-family-lineage-rail]');
  await expect(rail).toBeVisible();
  const metrics=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:innerWidth,button:[...document.querySelectorAll('[data-family-lineage-person]')].slice(0,4).map(el=>el.getBoundingClientRect().height)}));
  expect(metrics.doc).toBeLessThanOrEqual(metrics.viewport+1);
  expect(metrics.button.length).toBeGreaterThan(0);
  expect(Math.min(...metrics.button)).toBeGreaterThanOrEqual(44);
});
