import{test,expect}from'@playwright/test';

async function mockApis(page){
  await page.route('**/api/media**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})}));
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('home is a native archive with supported family story content',async({page})=>{
  await page.goto('/#dashboard');
  const home=page.locator('[data-v17-native="home"]');
  await expect(home).toBeVisible();
  await expect(home.getByRole('heading',{name:'Our family, connected.'})).toBeVisible();
  await expect(home.locator('.v17-home-tree')).toBeVisible();
  const story=home.locator('.v17-home-story');
  await expect(story).toBeVisible();
  await expect(story.getByRole('heading',{name:'Across generations and places'})).toBeVisible();
  await expect(story.locator('.v17-story-moment').first()).toBeVisible();
  await expect(page.locator('.v157-home')).toHaveCount(0);
});

test('people branch selection rerenders a native human branch summary',async({page})=>{
  await page.goto('/#people');
  const directory=page.locator('[data-v17-native="people"]');
  await expect(directory).toBeVisible();
  const browser=directory.locator('.v17-branch-browser');
  const branchButton=browser.locator('[data-branch]').filter({hasNotText:'All'}).first();
  await expect(branchButton).toBeVisible();
  const branchName=await branchButton.getAttribute('data-branch');
  expect(branchName).toBeTruthy();
  await branchButton.click();
  await expect(page.locator('#branch')).toHaveValue(branchName);
  const context=page.locator('.v17-branch-summary');
  await expect(context).toBeVisible();
  await expect(context.locator('.eyebrow')).toHaveText(`${branchName.toUpperCase()} FAMILY`);
  await expect(context.getByRole('link',{name:'Stories'})).toBeVisible();
});

test('historical person uses native biography and clean focused-tree navigation',async({page})=>{
  await page.goto('/#people');
  const result=page.locator('.v17-person-card button[data-person]').filter({hasText:/Hazel.*Berg/i}).first();
  await expect(result).toBeVisible();
  await result.click();
  const profile=page.locator('[data-v17-native="person"]');
  await expect(profile).toBeVisible();
  await expect(profile.locator('.v17-person-header')).toBeVisible();
  await expect(profile.getByRole('heading',{name:'Immediate family'})).toBeVisible();
  await expect(profile.locator('.family-overview-card')).toHaveCount(0);
  const treeLink=profile.getByRole('link',{name:'View in family tree'});
  const href=await treeLink.getAttribute('href');
  expect(href).toContain('focus=');
  expect(href).toContain('scope=family');
  expect(href).not.toContain('q=');
  expect(href).not.toContain('branch=');
  expect(href).not.toContain('state=');
});

test('living person biography suppresses public chronology location and media',async({page})=>{
  await page.goto('/#people');
  const result=page.locator('.v17-person-card button[data-person]').filter({hasText:/William John Rahe III/i}).first();
  await expect(result).toBeVisible();
  await result.click();
  const profile=page.locator('[data-v17-native="person"]');
  await expect(profile).toBeVisible();
  await expect(profile.getByText('Detailed chronology and location records are protected for living family members.')).toBeVisible();
  await expect(profile.getByText('Living-person media remains private in the public family archive.')).toBeVisible();
  await expect(profile.locator('.v17-person-places')).toHaveCount(0);
  await expect(profile.locator('[data-v17-person-gallery]')).toHaveCount(0);
});

test('tree is wrapped by the native v17 Family shell while preserving graph controls',async({page})=>{
  await page.goto('/#tree');
  const tree=page.locator('[data-v17-native="tree"]');
  await expect(tree).toBeVisible();
  await expect(tree.locator('.graph-shell')).toBeVisible();
  await expect(tree.locator('.graph-node[data-person]').first()).toBeVisible();
  await expect(page.locator('.v161-tree-toolbar')).toBeVisible();
});

test('photos quick filters stay synchronized with clear filters',async({page})=>{
  await page.goto('/#media');
  const quick=page.locator('.v162-media-quick');
  await expect(quick).toBeVisible();
  await quick.getByRole('button',{name:'Photos',exact:true}).click();
  await expect(page.locator('#media-type')).toHaveValue('photo');
  await expect(quick.getByRole('button',{name:'Photos',exact:true})).toHaveClass(/active/);
  const details=page.locator('.v161-media-filters');
  await details.locator('summary').click();
  await details.getByRole('button',{name:'Clear media filters'}).click();
  await expect(page.locator('#media-type')).toHaveValue('all');
  await expect(quick.getByRole('button',{name:'All',exact:true})).toHaveClass(/active/);
});
