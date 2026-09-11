import{test,expect}from'@playwright/test';

async function mockApis(page){
  await page.route('**/api/media**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})}));
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('mobile dock is simplified to Home Tree People Photos and More',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-chromium','mobile navigation contract');
  await page.goto('/#dashboard');
  await expect(page.locator('.dashboard-hero')).toBeVisible();
  await expect(page.locator('.sidebar')).toBeHidden();
  const dock=page.locator('#family-mobile-dock');
  await expect(dock).toBeVisible();
  await dock.getByRole('link',{name:'Tree'}).click();
  await expect(page).toHaveURL(/#tree$/);
  await dock.getByRole('link',{name:'People'}).click();
  await expect(page).toHaveURL(/#people$/);
  await dock.getByRole('link',{name:'Photos'}).click();
  await expect(page).toHaveURL(/#media$/);
  await expect(page.locator('[data-media-page]')).toBeVisible();
  await dock.locator('.v158-mobile-more>summary').click();
  await dock.getByRole('button',{name:'Search'}).click();
  await expect(page.locator('#search')).toBeFocused();
});

test('typing search does not destroy the current page and a result opens',async({page})=>{
  await page.goto('/#dashboard');
  await expect(page.locator('.dashboard-hero')).toBeVisible();
  await expect(page.locator('#search')).toBeVisible();
  await page.locator('#search').fill('Hazel Berg');
  await expect(page.locator('.dashboard-hero')).toBeVisible();
  const result=page.locator('#search-v13-2-results [data-person]').filter({hasText:'Hazel'}).first();
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(/#person\//);
  await expect(page.locator('#title')).toHaveText('Person profile');
});

test('tree person visual is a one-click route to a profile',async({page})=>{
  await page.goto('/#tree');
  const node=page.locator('.graph-node[data-person]').first();
  await expect(node).toBeAttached();
  await node.locator('.node-avatar').click();
  await expect(page).toHaveURL(/#person\//);
});

test('desktop family navigation is Home Tree People Photos plus Explore and Research Center',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop navigation contract');
  await page.goto('/#dashboard');
  const nav=page.locator('#nav');
  for(const label of['Home','Tree','People','Photos'])await expect(nav.getByRole('link',{name:label,exact:true})).toBeVisible();
  await expect(nav.getByRole('link',{name:'Research Center',exact:true})).toBeVisible();
  const explore=nav.locator('.v158-explore');
  await explore.locator('summary').click();
  await expect(explore.getByRole('link',{name:/Timeline/})).toBeVisible();
  await expect(explore.getByRole('link',{name:/Places & Migration/})).toBeVisible();
  await expect(explore.getByRole('link',{name:/Stories/})).toBeVisible();
  await nav.getByRole('link',{name:'Photos',exact:true}).click();
  await expect(page).toHaveURL(/#media$/);
});

test('desktop family shell keeps content-first chrome and contextual search',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop page architecture contract');
  await page.goto('/#dashboard');
  const sidebar=page.locator('.sidebar');
  await expect(sidebar).toBeVisible();
  await expect(page.locator('.topbar')).toBeHidden();
  await expect(page.locator('.v155-desktop-actions>summary')).toBeVisible();
  await expect(page.locator('#filters .search')).toContainText('Find someone in the family');
  await expect(page.locator('#search')).toHaveAttribute('placeholder','Name, branch, or place…');
  await expect(page.locator('.v157-tree-preview')).toBeVisible();
});

test('Research Center switches to a distinct research navigation shell',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop research shell contract');
  await page.goto('/#research');
  await expect(page.locator('body')).toHaveAttribute('data-v158-context','research');
  await expect(page.locator('.brand')).toContainText('RESEARCH CENTER');
  const nav=page.locator('#nav');
  await expect(nav.getByRole('link',{name:'Evidence',exact:true})).toBeVisible();
  await expect(nav.getByRole('link',{name:'Sources',exact:true})).toBeVisible();
  await expect(nav.getByRole('link',{name:'Archive',exact:true})).toBeVisible();
  await expect(nav.getByRole('link',{name:/Back to Family/})).toBeVisible();
});

test('v15.7 home prioritizes family tree and people before the research center',async({page})=>{
  await page.goto('/#dashboard');
  await expect(page.locator('.v157-hero')).toBeVisible();
  await expect(page.locator('.v157-tree-preview')).toBeVisible();
  await expect(page.locator('#dashboard-featured-title')).toBeVisible();
  await expect(page.locator('.v157-research-center')).toBeVisible();
  await expect(page.locator('.dashboard-research-split')).toHaveCount(0);
});

test('v15.3 profile leads with immediate family and family-record context',async({page})=>{
  await page.goto('/#dashboard');
  await page.locator('#search').fill('Hazel Berg');
  const result=page.locator('#search-v13-2-results [data-person]').filter({hasText:'Hazel'}).first();
  await expect(result).toBeVisible();
  await result.click();
  await expect(page.locator('.v153-profile-overview')).toBeVisible();
  await expect(page.locator('.v153-profile-nav')).toBeVisible();
  await expect(page.locator('.v153-family-network')).toBeVisible();
  await expect(page.locator('.v153-life-story')).toBeVisible();
});

test('v15.4 tree gives the focal person persistent context and profile navigation',async({page})=>{
  await page.goto('/#tree');
  const focal=page.locator('.v154-tree-person');
  await expect(focal).toBeVisible();
  await expect(page.locator('.v154-tree-controls')).toBeVisible();
  await expect(page.locator('.v154-graph-shell')).toBeVisible();
  await focal.getByRole('link',{name:'Open profile'}).click();
  await expect(page).toHaveURL(/#person\//);
});

test('Media route still delegates filtering to its own page controls while family label is Photos',async({page})=>{
  await page.goto('/#media');
  await expect(page.locator('[data-media-page]')).toBeVisible();
  await expect(page.locator('.route-shell .page-heading')).toBeVisible();
  await expect(page.locator('.route-shell #filters')).toBeHidden();
  await expect(page.locator('#nav').getByRole('link',{name:'Photos',exact:true})).toBeVisible();
});
