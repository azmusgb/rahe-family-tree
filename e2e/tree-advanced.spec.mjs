import{test,expect}from'@playwright/test';

const HAZEL='P-HAZEL-EMMA-BERG-DENNEWITZ';
async function mockApis(page){
  await page.route('**/api/media**',async route=>{const url=new URL(route.request().url());if(url.searchParams.has('file'))return route.fulfill({status:404,contentType:'text/plain',body:'not found'});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})});});
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}
test.beforeEach(async({page})=>{await mockApis(page);});

async function openTreeTools(page){
  const tools=page.locator('.family-graph-tools');
  await expect(tools).toBeVisible();
  if(!(await tools.getAttribute('open')))await tools.locator('summary').click();
  return tools;
}

async function openRelationshipFinder(page){
  const finder=page.locator('.family-graph-relationship');
  await expect(finder).toBeVisible();
  if(!(await finder.getAttribute('open')))await finder.locator('summary').click();
  return finder;
}

test('advanced tree owns one navigation/export toolset with compact mode and neutral SVG download',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=connected#tree`);
  await expect(page.locator('.tree-advanced-nav')).toBeVisible();
  await expect(page.locator('.tree-focus-breadcrumb')).toContainText('Hazel');
  await expect(page.locator('[data-tree-copy-link]')).toHaveCount(1);
  await expect(page.locator('[data-tree-export-svg]')).toHaveCount(1);
  await expect(page.locator('[data-tree-export-pdf]')).toHaveCount(1);
  await expect(page.locator('[data-v176-export-svg],[data-v176-print-tree],[data-v176-copy-link]')).toHaveCount(0);

  let tools=await openTreeTools(page);
  await expect(tools.locator('[data-tree-component]')).toBeVisible();
  await expect(tools.locator('[data-tree-export-svg]')).toBeVisible();

  const downloadPromise=page.waitForEvent('download');
  await tools.locator('[data-tree-export-svg]').click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe('family-history-tree.svg');

  let compact=tools.locator('[data-tree-compact-toggle]');
  const body=page.locator('body');
  const initialPressed=await compact.getAttribute('aria-pressed');
  expect(['true','false']).toContain(initialPressed);
  if(initialPressed==='true')await expect(body).toHaveClass(/tree-compact/);else await expect(body).not.toHaveClass(/tree-compact/);

  await compact.click();
  tools=await openTreeTools(page);
  compact=tools.locator('[data-tree-compact-toggle]');
  await expect(compact).toHaveAttribute('aria-pressed',initialPressed==='true'?'false':'true');
  if(initialPressed==='true')await expect(body).not.toHaveClass(/tree-compact/);else await expect(body).toHaveClass(/tree-compact/);

  await compact.click();
  tools=await openTreeTools(page);
  await expect(tools.locator('[data-tree-compact-toggle]')).toHaveAttribute('aria-pressed',initialPressed);
});

test('relationship path highlighting marks only a visible evidence-qualified path',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=connected#tree`);
  const finder=await openRelationshipFinder(page);
  const picker=finder.locator('[data-family-graph-path-target]');
  await expect(picker).toBeVisible();
  const target=await picker.locator('option').evaluateAll(options=>options.map(option=>option.value).find(Boolean)||'');
  expect(target).not.toBe('');
  await picker.selectOption(target);
  await expect(page).toHaveURL(new RegExp(`pathTo=${encodeURIComponent(target)}`));
  await expect(page.locator('.tree-path-summary')).toBeVisible();
  const highlighted=page.locator('.graph-node.tree-path-node');
  expect(await highlighted.count()).toBeGreaterThan(1);
  await expect(page.locator('[data-tree-path-overlay]')).toHaveCount(1);
  const renderedIds=new Set(await page.locator('#family-graph .graph-node[data-person]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-person'))));
  for(const id of await highlighted.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-person'))))expect(renderedIds.has(id)).toBeTruthy();
  await expect(page.locator('[data-tree-path-target]')).toBeHidden();
});

test('generation labels are focus-relative and appear once per rendered lane',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=connected#tree`);
  const labels=page.locator('.generation-lane text');
  await expect(labels.first()).toBeVisible();
  const text=await labels.allTextContents();
  expect(text.filter(value=>value==='FOCUS')).toHaveLength(1);
  expect(text.every(value=>value==='FOCUS'||/^\d+ GEN [↑↓]$/.test(value))).toBeTruthy();
});

test('collapse and expand controls stay local to tree presentation',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=descendants#tree`);
  const nodes=page.locator('.graph-node[data-person]');
  await expect(nodes.first()).toBeVisible();
  const before=await nodes.count();
  expect(before).toBeGreaterThan(0);

  let tools=await openTreeTools(page);
  await tools.locator('[data-tree-collapse-focus]').click();
  await expect(page.locator('.tree-advanced-nav')).toBeVisible();
  await expect(nodes.first()).toBeVisible();
  const afterCollapse=await nodes.count();
  expect(afterCollapse).toBeGreaterThan(0);
  expect(afterCollapse).toBeLessThanOrEqual(before);

  tools=await openTreeTools(page);
  await tools.locator('[data-tree-expand-all]').click();
  await expect(page.locator('.tree-advanced-nav')).toBeVisible();
  await expect(nodes.first()).toBeVisible();
  const afterExpand=await nodes.count();
  expect(afterExpand).toBeGreaterThanOrEqual(afterCollapse);
});

test('recent focus trail has one owner and follows tree navigation history',async({page})=>{
  await page.goto(`/?focus=${HAZEL}&scope=connected#tree`);
  const nodes=page.locator('.graph-node[data-person]');
  await expect(nodes.first()).toBeVisible();
  const next=await nodes.evaluateAll((items,current)=>items.map(node=>node.getAttribute('data-person')).find(id=>id&&id!==current)||'',HAZEL);
  expect(next).not.toBe('');
  await page.goto(`/?focus=${encodeURIComponent(next)}&scope=connected#tree`);
  await expect(page.locator('.tree-advanced-nav')).toBeVisible();
  await expect(page.locator('.tree-recent-trail')).toHaveCount(1);
  const tools=await openTreeTools(page);
  await expect(tools.locator('.tree-recent-trail')).toBeVisible();
  await expect(tools.locator('.tree-recent-trail')).toContainText('Hazel');
  await expect(page.locator('[data-ui-recent]')).toHaveCount(0);
});
