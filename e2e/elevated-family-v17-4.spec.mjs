import{test,expect}from'@playwright/test';

const HAZEL='P-HAZEL-EMMA-BERG-DENNEWITZ';
const LIVING='P-WILLIAM-JOHN-RAHE-III';

async function mockApis(page){
  await page.route('**/api/media**',async route=>{const url=new URL(route.request().url());if(url.searchParams.has('file'))return route.fulfill({status:404,contentType:'text/plain',body:'not found'});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})});});
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

const versionAtLeast=(version,major,minor)=>{const[a,b]=String(version||'').split('.').map(Number);return Number.isFinite(a)&&Number.isFinite(b)&&(a>major||(a===major&&b>=minor));};

test.beforeEach(async({page})=>{await mockApis(page);});

test('Home adds a family continuation rail',async({page})=>{
  await page.goto('/#dashboard');
  const rail=page.locator('.v174-discovery');
  await expect(rail).toBeVisible();
  await expect(rail.getByRole('heading',{name:'Follow another path through the family'})).toBeVisible();
  await expect(rail.locator('[data-person]')).toHaveCount(4);
});

test('historical Person shows elevated summary and active navigation',async({page})=>{
  await page.goto(`/#person/${HAZEL}`);
  const snapshot=page.locator('.v174-profile-snapshot');
  await expect(snapshot).toBeVisible();
  await expect(snapshot.getByText(/close family connection/)).toBeVisible();
  await expect(snapshot.getByText(/linked life record/)).toBeVisible();
  await expect(page.locator('.v17-person-nav a.is-active')).toHaveCount(1);
});

test('living Person keeps chronology and place summary private',async({page})=>{
  await page.goto(`/#person/${LIVING}`);
  const snapshot=page.locator('.v174-profile-snapshot');
  await expect(snapshot).toBeVisible();
  await expect(snapshot.getByText('Protected')).toHaveCount(2);
  await expect(snapshot.getByText('private chronology')).toBeVisible();
  await expect(snapshot.getByText('private places')).toBeVisible();
});

test('Tree context switcher changes scope using the existing tree engine',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','elevated context is a desktop presentation layer; mobile uses the native tree controls');
  await page.goto(`/?focus=${HAZEL}&scope=family#tree`);
  const context=page.locator('.v174-tree-context');
  await expect(context).toBeVisible();
  await expect(context.getByRole('button',{name:'Family'})).toHaveAttribute('aria-pressed','true');
  // The tree scope action intentionally replaces the rendered tree immediately.
  // Invoke the native button activation directly so Playwright does not keep a
  // pointer-actionability transaction open while that same DOM is replaced.
  await context.getByRole('button',{name:'Ancestors'}).evaluate(button=>button.click());
  await expect(page).toHaveURL(/scope=ancestors/);
  await expect(page.locator('.v174-tree-scope button.active')).toHaveText('Ancestors');
});

test('v17.4+ shell contract remains visible in the current release',async({page})=>{
  await page.goto('/#dashboard');
  const release=await page.locator('html').getAttribute('data-ui-release');
  expect(versionAtLeast(release,17,4)).toBe(true);
  await expect(page.locator('.version')).toContainText(`v${release}`);
});
