import{test,expect}from'@playwright/test';

async function mockApis(page){
  await page.route('**/api/media**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})}));
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('family tree keeps graph diagnostics out of the foreground and relationship finding on demand',async({page})=>{
  await page.goto('/#tree');
  await expect(page.locator('[data-platform-v13="tree-engine-2"]')).toHaveCount(0);
  await expect(page.locator('.v161-tree-toolbar')).toBeVisible();
  await expect(page.locator('.graph-shell')).toBeVisible();
  await page.getByRole('button',{name:'Relationship',exact:true}).click();
  let dialog=page.locator('#v161-relationship-dialog');
  await expect(dialog).toBeVisible();
  const form=dialog.locator('#relationship-finder');
  await expect(form).toBeVisible();
  const from=await form.locator('[name="relationship-from"]').inputValue();
  const to=await form.locator('[name="relationship-to"]').inputValue();
  await form.getByRole('button',{name:'Find relationship'}).click();
  await expect(page).toHaveURL(new RegExp(`from=${encodeURIComponent(from)}.*to=${encodeURIComponent(to)}.*#tree`));
  dialog=page.locator('#v161-relationship-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.relationship-path-result, .empty')).toBeVisible();
  await expect(page.locator('.graph-shell')).toBeVisible();
});

test('evidence workbench exposes canonical graph integrity provenance and diff',async({page})=>{
  await page.goto('/#evidence');
  const platform=page.locator('[data-platform-v13="canonical-graph-audit"]');
  await expect(platform).toBeVisible();
  await expect(platform.getByRole('heading',{name:'One typed graph for people, family units, claims, sources, events, places, households, and research tasks'})).toBeVisible();
  await expect(platform.getByRole('heading',{name:'Graph release gates'})).toBeVisible();
  await expect(platform.getByText('CLEAN',{exact:true})).toBeVisible();
  await expect(platform.getByRole('link',{name:'Canonical graph JSON'})).toBeVisible();
});

test('person profile includes canonical graph provenance and family context',async({page})=>{
  await page.goto('/#dashboard');
  await page.locator('#search').fill('Hazel Berg');
  const result=page.locator('#search-v13-2-results [data-person]').filter({hasText:'Hazel'}).first();
  await expect(result).toBeVisible();
  await result.click();
  const panel=page.locator('[data-platform-v13="person-graph-context"]');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading',{name:'Family, provenance, and traversal'})).toBeVisible();
  await expect(panel.getByText('Controlling state',{exact:true})).toBeVisible();
});

test('source dossier includes source to assertion matrix',async({page})=>{
  await page.goto('/#sources');
  const source=page.locator('[data-source]').first();
  await expect(source).toBeVisible();
  await source.click();
  const matrix=page.locator('[data-platform-v13="source-evidence-matrix"]');
  await expect(matrix).toBeVisible();
  await expect(matrix.getByRole('heading',{name:'What this source is actually being used for'})).toBeVisible();
});

test('Research Command Center 2.0 is visible and advisory',async({page})=>{
  await page.goto('/#research');
  const center=page.locator('[data-platform-v13="research-command-center"]');
  await expect(center).toBeVisible();
  await expect(center.getByRole('heading',{name:'Prioritize records by expected evidentiary payoff'})).toBeVisible();
  await expect(center.getByText(/advisory/i).first()).toBeVisible();
  await expect(center.locator('.command-task').first()).toBeVisible();
});

test('timeline and migration expose source-linked geography and row-bounded households',async({page})=>{
  await page.goto('/#migration');
  const geo=page.locator('[data-platform-v13="geography-households"]');
  await expect(geo).toBeVisible();
  await expect(geo.getByRole('heading',{name:'Source-linked places'})).toBeVisible();
  await expect(geo.getByRole('heading',{name:'Row-bounded family context'})).toBeVisible();
  await page.goto('/#timeline');
  await expect(page.locator('[data-platform-v13="timeline-geography-households"]')).toBeVisible();
});
