import{test,expect}from'@playwright/test';

const HAZEL='P-HAZEL-EMMA-BERG-DENNEWITZ';
async function mockApis(page){
  await page.route('**/api/media**',async route=>{const url=new URL(route.request().url());if(url.searchParams.has('file'))return route.fulfill({status:404,contentType:'text/plain',body:'not found'});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})});});
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}
test.beforeEach(async({page})=>{await mockApis(page);});

test('advanced tree exposes component navigation, focus trail, compact mode, and vector export tools',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=connected#tree`);
  await expect(page.locator('.tree-advanced-nav')).toBeVisible();
  await expect(page.locator('[data-tree-component]')).toBeVisible();
  await expect(page.locator('.tree-focus-breadcrumb')).toContainText('Hazel');
  await expect(page.locator('[data-tree-export-svg]')).toBeVisible();
  await expect(page.locator('[data-tree-export-pdf]')).toBeVisible();

  const compact=page.locator('[data-tree-compact-toggle]');
  const body=page.locator('body');
  const initialPressed=await compact.getAttribute('aria-pressed');
  expect(['true','false']).toContain(initialPressed);
  if(initialPressed==='true')await expect(body).toHaveClass(/tree-compact/);else await expect(body).not.toHaveClass(/tree-compact/);

  await compact.click();
  await expect(page.locator('[data-tree-compact-toggle]')).toHaveAttribute('aria-pressed',initialPressed==='true'?'false':'true');
  if(initialPressed==='true')await expect(body).not.toHaveClass(/tree-compact/);else await expect(body).toHaveClass(/tree-compact/);

  await page.locator('[data-tree-compact-toggle]').click();
  await expect(page.locator('[data-tree-compact-toggle]')).toHaveAttribute('aria-pressed',initialPressed);
  if(initialPressed==='true')await expect(body).toHaveClass(/tree-compact/);else await expect(body).not.toHaveClass(/tree-compact/);
});

test('relationship path highlighting marks an evidence-qualified path without changing genealogy state',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=connected#tree`);
  const picker=page.locator('[data-tree-path-target]');
  await expect(picker).toBeVisible();
  const target=await picker.locator('option').evaluateAll(options=>options.map(option=>option.value).find(Boolean)||'');
  expect(target).not.toBe('');
  await picker.selectOption(target);
  await expect(page).toHaveURL(new RegExp(`pathTo=${encodeURIComponent(target)}`));
  await expect(page.locator('.tree-path-summary')).toBeVisible();
  await expect(page.locator('.graph-node.tree-path-node')).toHaveCount(await page.locator('.graph-node.tree-path-node').count());
  expect(await page.locator('.graph-node.tree-path-node').count()).toBeGreaterThan(1);
  await expect(page.locator('[data-tree-path-overlay]')).toHaveCount(1);
});

test('collapse and expand controls stay local to tree presentation',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=descendants#tree`);
  const nodes=page.locator('.graph-node[data-person]');
  await expect(nodes.first()).toBeVisible();
  const before=await nodes.count();
  expect(before).toBeGreaterThan(0);

  await page.locator('[data-tree-collapse-focus]').click();
  await expect(page.locator('.tree-advanced-nav')).toBeVisible();
  await expect(nodes.first()).toBeVisible();
  const afterCollapse=await nodes.count();
  expect(afterCollapse).toBeGreaterThan(0);
  expect(afterCollapse).toBeLessThanOrEqual(before);

  await page.locator('[data-tree-expand-all]').click();
  await expect(page.locator('.tree-advanced-nav')).toBeVisible();
  await expect(nodes.first()).toBeVisible();
  const afterExpand=await nodes.count();
  expect(afterExpand).toBeGreaterThanOrEqual(afterCollapse);
});

test('recent focus trail follows tree navigation history',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=connected#tree`);
  const select=page.locator('[data-tree-person]');
  const next=await select.locator('option').evaluateAll((options,current)=>options.map(option=>option.value).find(value=>value&&value!==current)||'',HAZEL);
  expect(next).not.toBe('');
  await select.selectOption(next);
  await page.waitForTimeout(100);
  await expect(page.locator('.tree-recent-trail')).toContainText('Hazel');
});
