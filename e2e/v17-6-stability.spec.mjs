import{test,expect}from'@playwright/test';

const HAZEL='P-HAZEL-EMMA-BERG-DENNEWITZ';
async function mockApis(page){
  await page.route('**/api/media**',async route=>{const url=new URL(route.request().url());if(url.searchParams.has('file'))return route.fulfill({status:404,contentType:'text/plain',body:'not found'});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})});});
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}
test.beforeEach(async({page})=>{await mockApis(page);});

test('v17.6 runtime mounts and tree tools survive repeated navigation',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=family&depth=2#tree`);
  await expect(page.locator('html')).toHaveAttribute('data-ui-release','17.6.0');
  await expect(page.locator('html')).toHaveAttribute('data-v176','ready');
  await expect(page.locator('[data-v176-tools]')).toBeVisible();
  await page.goto('/#people');
  await expect(page.locator('[data-v17-native="people"]')).toBeVisible();
  await page.goto(`/?focus=${HAZEL}&scope=ancestors#tree`);
  await expect(page.locator('[data-v176-tools]')).toHaveCount(1);
  await expect(page.locator('.graph-node[data-person]').first()).toBeVisible();
});

test('tree state survives leaving and returning through history',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=descendants&depth=3#tree`);
  await page.goto('/#people');
  await page.goBack();
  await expect(page).toHaveURL(/focus=P-HAZEL-EMMA-BERG-DENNEWITZ/);
  await expect(page).toHaveURL(/scope=descendants/);
  await expect(page.locator('[data-v17-native="tree"]')).toBeVisible();
});

test('leaving Photos closes an open media viewer shell if present',async({page})=>{
  await page.goto('/#media');
  await expect(page.locator('[data-media-page]')).toBeVisible();
  await page.evaluate(()=>{const dialog=document.querySelector('#media-viewer');dialog?.setAttribute('open','');});
  await page.goto('/#people');
  await expect(page.locator('#media-viewer')).toHaveCount(0);
});
