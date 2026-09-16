import{test,expect}from'@playwright/test';

const HAZEL='P-HAZEL-EMMA-BERG-DENNEWITZ';
const versionAtLeast=(version,major,minor)=>{const[a,b]=String(version||'').split('.').map(Number);return Number.isFinite(a)&&Number.isFinite(b)&&(a>major||(a===major&&b>=minor));};
async function mockApis(page){
  await page.route('**/api/media**',async route=>{const url=new URL(route.request().url());if(url.searchParams.has('file'))return route.fulfill({status:404,contentType:'text/plain',body:'not found'});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})});});
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}
async function openTreeTools(page){
  const tools=page.locator('.family-graph-tools');
  await expect(tools).toBeVisible();
  if(!(await tools.getAttribute('open')))await tools.locator('summary').click();
  return tools;
}
test.beforeEach(async({page})=>{await mockApis(page);});

test('v17.6 state runtime mounts and consolidated tree tools survive repeated navigation',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=family&depth=2#tree`);
  const release=await page.locator('html').getAttribute('data-ui-release');
  expect(versionAtLeast(release,17,6)).toBe(true);
  await expect(page.locator('html')).toHaveAttribute('data-v176','ready');
  const tools=await openTreeTools(page);
  await expect(tools.locator('[data-tree-advanced-export]')).toBeVisible();
  await expect(page.locator('[data-tree-copy-link]')).toHaveCount(1);
  await expect(page.locator('[data-tree-export-svg]')).toHaveCount(1);
  await expect(page.locator('[data-tree-export-pdf]')).toHaveCount(1);
  await expect(page.locator('[data-v176-tools]')).toHaveCount(0);
  await page.goto('/#people');
  await expect(page.locator('[data-v17-native="people"]')).toBeVisible();
  await page.goto(`/?focus=${HAZEL}&scope=ancestors#tree`);
  await expect(page.locator('[data-tree-advanced-export]')).toHaveCount(1);
  await expect(page.locator('[data-tree-copy-link]')).toHaveCount(1);
  await expect(page.locator('[data-tree-export-svg]')).toHaveCount(1);
  await expect(page.locator('[data-tree-export-pdf]')).toHaveCount(1);
  await expect(page.locator('[data-v176-tools]')).toHaveCount(0);
  await expect(page.locator('.graph-node[data-person]').first()).toBeVisible();
});

test('tree state survives leaving, history, and a later bare tree entry',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=descendants&depth=3#tree`);
  await expect(page.locator('.tree-context')).toHaveAttribute('data-scope','descendants');
  await page.goto('/#people');
  await page.goBack();
  await expect(page).toHaveURL(/focus=P-HAZEL-EMMA-BERG-DENNEWITZ/);
  await expect(page).toHaveURL(/scope=descendants/);
  await expect(page.locator('[data-v17-native="tree"]')).toBeVisible();
  await page.goto('/#tree');
  await expect(page).toHaveURL(/focus=P-HAZEL-EMMA-BERG-DENNEWITZ/);
  await expect(page).toHaveURL(/scope=descendants/);
  await expect(page.locator('.tree-context')).toHaveAttribute('data-scope','descendants');
});

test('auth loss removes private cards and clears private viewer content from the DOM',async({page})=>{
  await page.goto('/#media');
  await expect(page.locator('[data-media-page]')).toBeVisible();
  await page.evaluate(()=>{
    const host=document.querySelector('[data-media-page]');
    const card=document.createElement('article');card.className='media-library-card is-private';card.textContent='private marker';host?.append(card);
    document.querySelector('#media-viewer-stage').innerHTML='<img src="/api/media?file=private-secret">';
    document.querySelector('#media-viewer-title').textContent='Private title';
    document.querySelector('#media-viewer-caption').textContent='Private caption';
    document.querySelector('#media-viewer-badges').textContent='Private family';
    document.querySelector('#media-viewer-facts').textContent='Private place';
    document.querySelector('#media-viewer-people').textContent='Private person';
    document.querySelector('#media-viewer-original').setAttribute('href','/api/media?file=private-secret');
    document.querySelector('#media-viewer')?.setAttribute('open','');
    window.dispatchEvent(new CustomEvent('family-auth-changed',{detail:{user:null}}));
  });
  await expect(page.locator('.media-library-card.is-private')).toHaveCount(0);
  await expect(page.locator('#media-viewer-stage')).toBeEmpty();
  await expect(page.locator('#media-viewer-title')).toBeEmpty();
  await expect(page.locator('#media-viewer-original')).not.toHaveAttribute('href',/.+/);
});

test('leaving Photos closes an open media viewer shell if present',async({page})=>{
  await page.goto('/#media');
  await expect(page.locator('[data-media-page]')).toBeVisible();
  await page.evaluate(()=>{const dialog=document.querySelector('#media-viewer');dialog?.setAttribute('open','');});
  await page.goto('/#people');
  await expect(page.locator('#media-viewer')).toHaveCount(0);
});
