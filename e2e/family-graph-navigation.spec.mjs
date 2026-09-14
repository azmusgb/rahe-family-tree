import{test,expect}from'@playwright/test';

const HAZEL='P-HAZEL-EMMA-BERG-DENNEWITZ';
const COLLAPSE_KEY='family.archive.treeCollapsed.v2';
async function mockApis(page){
  await page.route('**/api/media**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})}));
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}
test.beforeEach(async({page})=>{await mockApis(page);});

test('Family Graph commandbar owns focal person and scope navigation',async({page})=>{
  await page.goto('/#tree');
  const bar=page.locator('.family-graph-commandbar');
  await expect(bar).toBeVisible();
  await expect(page.locator('.tree-focusbar')).toBeHidden();
  await expect(bar.locator('[data-family-graph-person]')).toBeVisible();
  for(const label of['Family','Ancestors','Descendants','Direct line','Connected'])await expect(bar.getByRole('button',{name:label,exact:true})).toBeVisible();
  await bar.getByRole('button',{name:'Ancestors',exact:true}).click();
  await expect(page).toHaveURL(/scope=ancestors/);
  await expect(page.locator('.family-graph-commandbar').getByRole('button',{name:'Ancestors',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('choosing a focal person from Full tree returns to focus-compatible Connected scope',async({page})=>{
  await page.goto('/?scope=all#tree');
  await expect(page.locator('.family-graph-scope-label')).toHaveText('Full tree');
  const picker=page.locator('[data-family-graph-person]');
  await expect(picker).toBeVisible();
  const current=await picker.inputValue();
  const target=await picker.locator('option').evaluateAll((options,selected)=>options.map(option=>option.value).find(value=>value&&value!==selected)||'',current);
  expect(target).not.toBe('');
  await picker.selectOption(target);
  await expect(page).toHaveURL(new RegExp(`focus=${encodeURIComponent(target)}`));
  await expect(page).toHaveURL(/scope=connected/);
  await expect(page.locator('.family-graph-commandbar').getByRole('button',{name:'Connected',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('relationship finder highlights and narrates a visible evidence-qualified path and can clear it',async({page})=>{
  await page.goto('/#tree');
  const details=page.locator('.family-graph-relationship');
  await details.locator('summary').click();
  const select=details.locator('[data-family-graph-path-target]');
  await expect(select).toBeVisible();
  const options=select.locator('option');
  expect(await options.count()).toBeGreaterThan(1);
  const target=await options.nth(1).getAttribute('value');
  await select.selectOption(target);
  await expect(page).toHaveURL(/pathTo=/);
  await expect(page.locator('.tree-path-summary')).toBeVisible();
  const card=page.locator('.relationship-path-card');
  await expect(card).toBeVisible();
  await expect(card.locator('.relationship-path-step')).toHaveCount(await page.locator('#family-graph .tree-path-segment').count());
  await expect(card.locator('.relationship-path-badges')).toContainText(/SUPPORTED|PROVISIONAL|UNRESOLVED/);
  await expect(page.locator('#family-graph .tree-path-start')).toHaveCount(1);
  await expect(page.locator('#family-graph .tree-path-end')).toHaveCount(1);
  await page.locator('[data-family-graph-clear-path]').click();
  await expect(page).not.toHaveURL(/pathTo=/);
  await expect(page.locator('.relationship-path-card')).toHaveCount(0);
});

test('relationship finder reveals connected relatives hidden by scope filters or collapsed branches',async({page})=>{
  await page.addInitScript(([key,id])=>localStorage.setItem(key,JSON.stringify([id])),[COLLAPSE_KEY,HAZEL]);
  await page.goto(`/?focus=${HAZEL}&scope=family&depth=1&q=Hazel#tree`);
  const details=page.locator('.family-graph-relationship');
  await details.locator('summary').click();
  const select=details.locator('[data-family-graph-path-target]');
  await expect(select).toBeVisible();
  await expect(page.locator('#family-graph-relationship-help')).toContainText('Connected');
  const rendered=await page.locator('#family-graph .graph-node[data-person]').evaluateAll(nodes=>nodes.map(node=>node.dataset.person));
  const target=await select.locator('option').evaluateAll((options,visible)=>options.map(option=>option.value).find(value=>value&&!visible.includes(value))||'',rendered);
  expect(target).not.toBe('');
  await select.selectOption(target);
  await expect(page).toHaveURL(/scope=connected/);
  await expect(page).toHaveURL(new RegExp(`pathTo=${encodeURIComponent(target)}`));
  await expect(page).not.toHaveURL(/[?&]q=/);
  expect(await page.evaluate(key=>localStorage.getItem(key),COLLAPSE_KEY)).toBe('[]');
  await expect(page.locator('.tree-path-summary')).toBeVisible();
  await expect(page.locator('.relationship-path-card')).toBeVisible();
});

test('advanced component and recent controls are progressively disclosed under Tree tools',async({page})=>{
  await page.goto('/#tree');
  const tools=page.locator('.family-graph-tools');
  await tools.locator('summary').click();
  await expect(tools.locator('[data-tree-component]')).toBeVisible();
  await expect(page.locator('.tree-advanced-nav .tree-advanced-primary')).toHaveCount(0);
});

test('mobile commandbar remains touch-first without horizontal page overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#tree');
  const bar=page.locator('.family-graph-commandbar');
  await expect(bar).toBeVisible();
  await expect(bar.locator('[data-family-graph-person]')).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  const direct=bar.getByRole('button',{name:'Direct line',exact:true});
  await expect(direct).toBeVisible();
  expect((await direct.boundingBox())?.height||0).toBeGreaterThanOrEqual(40);
});
