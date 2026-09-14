import{test,expect}from'@playwright/test';

const HAZEL='P-HAZEL-EMMA-BERG-DENNEWITZ';
async function mockApis(page){
  await page.route('**/api/media**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})}));
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}
test.beforeEach(async({page})=>{await mockApis(page);});

test('relative generation metadata and direct-line rail are present for a focused tree',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=family&depth=2#tree`);
  const rail=page.locator('[data-family-lineage-rail]');
  await expect(rail).toBeVisible();
  await expect(rail.getByText('Direct family line')).toBeVisible();
  const focusLane=page.locator('#family-graph .generation-lane.family-generation-focus-lane');
  await expect(focusLane).toHaveCount(1);
  await expect(focusLane).toHaveAttribute('data-family-generations',/(^|\s)0(\s|$)/);
  await expect(page.locator('[data-family-lineage-generation="0"]')).toBeVisible();
  await expect(page.locator(`[data-family-lineage-person="${HAZEL}"]`).first()).toHaveAttribute('aria-current','true');
  expect(await page.locator('[data-family-lineage-generation]').count()).toBeGreaterThan(1);
  const svgLabels=await page.locator('#family-graph .generation-lane text').allTextContents();
  expect(svgLabels.filter(value=>value==='FOCUS')).toHaveLength(1);
});

test('lineage rail refocuses the tree without changing canonical graph state',async({page})=>{
  // Family depth 2 can legitimately expose only the focal person in the direct-line
  // rail. Connected scope guarantees the test exercises a real second lineage target.
  await page.goto(`/?focus=${HAZEL}&scope=connected#tree`);
  const candidates=page.locator('[data-family-lineage-person]');
  await expect(candidates.first()).toBeVisible();
  const count=await candidates.count();
  let other=null;
  for(let i=0;i<count;i++){
    const candidate=candidates.nth(i);
    if((await candidate.getAttribute('data-family-lineage-person'))!==HAZEL){other=candidate;break;}
  }
  expect(other).toBeTruthy();
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
