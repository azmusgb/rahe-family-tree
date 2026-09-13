import{test,expect}from'@playwright/test';

const HAZEL='P-HAZEL-EMMA-BERG-DENNEWITZ';
const LIVING='P-WILLIAM-JOHN-RAHE-III';

async function mockApis(page){
  await page.route('**/api/media**',async route=>{const url=new URL(route.request().url());if(url.searchParams.has('file'))return route.fulfill({status:404,contentType:'text/plain',body:'not found'});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})});});
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('Home adds a family continuation rail',async({page})=>{
  await page.goto('/#dashboard');
  const rail=page.locator('.v175-discovery');
  await expect(rail).toBeVisible();
  await expect(rail.getByRole('heading',{name:'Follow another path through the family'})).toBeVisible();
  expect(await rail.locator('[data-person]').count()).toBeGreaterThanOrEqual(1);
});

test('historical Person shows elevated summary and active navigation',async({page})=>{
  await page.goto(`/#person/${HAZEL}`);
  const snapshot=page.locator('.v175-profile-snapshot');
  await expect(snapshot).toBeVisible();
  await expect(snapshot.getByText(/close family connection/)).toBeVisible();
  await expect(snapshot.getByText(/linked life record/)).toBeVisible();
  await expect(page.locator('.v17-person-nav a.is-active')).toHaveCount(1);
});

test('living Person keeps chronology and place summary private',async({page})=>{
  await page.goto(`/#person/${LIVING}`);
  const snapshot=page.locator('.v175-profile-snapshot');
  await expect(snapshot).toBeVisible();
  await expect(snapshot.getByText('Protected')).toHaveCount(2);
  await expect(snapshot.getByText('private chronology')).toBeVisible();
  await expect(snapshot.getByText('private places')).toBeVisible();
});

test('Tree context switcher changes scope through the existing tree engine',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=family#tree`);
  const context=page.locator('.v175-tree-context');
  await expect(context).toBeVisible();
  await expect(context.getByRole('button',{name:'Family'})).toHaveAttribute('aria-pressed','true');
  await context.getByRole('button',{name:'Ancestors'}).click();
  await expect.poll(()=>new URL(page.url()).searchParams.get('scope')).toBe('ancestors');
  await expect(page.locator('.v175-tree-scope button.active')).toHaveText('Ancestors');
});

test('v17.5 shell fingerprint is visible after the production build transform',async({page})=>{
  await page.goto('/#dashboard');
  await expect(page.locator('html')).toHaveAttribute('data-ui-release','17.5.0');
  await expect(page.locator('.version')).toContainText('v17.5.0');
});
