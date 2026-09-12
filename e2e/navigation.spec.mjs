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
  await expect(page.locator('#search')).toBeVisible();
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

test('mobile search results open as a bounded sheet instead of extending the home page',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-chromium','mobile search-sheet contract');
  await page.goto('/#dashboard');
  await page.locator('#search').fill('Aimee');
  const sheet=page.locator('#search-v13-2-results.v1511-search-sheet');
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveCSS('position','fixed');
  const box=await sheet.boundingBox();
  expect(box?.height||0).toBeLessThan(page.viewportSize().height-80);
  await expect(page.locator('.v1511-home-lead')).toBeAttached();
});

test('tree person visual is a one-click route to a profile',async({page})=>{
  await page.goto('/#tree');
  const node=page.locator('.graph-node[data-person]').first();
  await expect(node).toBeAttached();
  await node.locator('.node-avatar').click();
  await expect(page).toHaveURL(/#person\//);
});

test('mobile tree is canvas-first instead of stacked desktop controls',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-chromium','mobile tree contract');
  await page.goto('/#tree');
  const content=page.locator('#content');
  await expect(content).toHaveClass(/v1511-mobile-tree/);
  await expect(page.locator('.v154-tree-person')).toBeHidden();
  await expect(page.locator('.v129-tree-memory')).toBeHidden();
  await expect(page.locator('.v154-tree-help')).toBeHidden();
  await expect(page.locator('.legend')).toBeHidden();
  await expect(page.locator('.mobile-family-list')).toBeHidden();
  await expect(page.locator('.relationship-index')).toBeHidden();
  await expect(page.locator('[data-center-person]')).toHaveText('Center');
  await expect(page.locator('[data-show-all-people]')).toHaveText('Full tree');
  const graph=page.locator('.graph-scroll');
  await expect(graph).toBeVisible();
  const graphBox=await graph.boundingBox();
  expect(graphBox?.y||9999).toBeLessThan(page.viewportSize().height*.58);
  expect(graphBox?.height||0).toBeGreaterThan(350);
  const dock=page.locator('#family-mobile-dock');
  await dock.getByRole('link',{name:'Home'}).click();
  await expect(page).toHaveURL(/#dashboard$/);
  await dock.getByRole('link',{name:'Tree'}).click();
  await expect(page).toHaveURL(/#tree$/);
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

test('Home is composed as one family lead instead of stacked hero snapshot and tree cards',async({page})=>{
  await page.goto('/#dashboard');
  const lead=page.locator('.v1511-home-lead');
  await expect(lead).toBeVisible();
  await expect(lead.locator('.v157-hero')).toBeVisible();
  await expect(lead.locator('.v1511-tree-preview')).toBeVisible();
  await expect(lead.locator('.dashboard-hero-card')).toBeHidden();
  await expect(page.locator('.v1511-featured')).toBeVisible();
  await expect(page.locator('.v1511-research-center')).toBeVisible();
});

test('Home keeps secondary branches and stories collapsed by default',async({page})=>{
  await page.goto('/#dashboard');
  await expect(page.locator('.v157-hero')).toBeVisible();
  await expect(page.locator('.v157-tree-preview')).toBeVisible();
  await expect(page.locator('#dashboard-featured-title')).toBeVisible();
  const more=page.locator('.v1510-home-more');
  await expect(more).toBeVisible();
  await expect(more).not.toHaveAttribute('open','');
  await expect(page.locator('.v157-research-center')).toBeVisible();
});

test('People is family-first but initially limits the card wall',async({page},testInfo)=>{
  await page.goto('/#people');
  await expect(page.locator('.v159-people-header')).toBeVisible();
  await expect(page.locator('.v159-branch-browser')).toBeVisible();
  const cards=page.locator('.v159-person-card');
  await expect(cards.first()).toBeVisible();
  await expect(cards.first().locator('.v159-card-context')).toBeVisible();
  const expected=testInfo.project.name==='mobile-chromium'?6:12;
  await expect.poll(()=>page.locator('.v159-person-card:visible').count()).toBe(expected);
  const more=page.locator('[data-v1510-people-more]');
  await expect(more).toBeVisible();
  await more.click();
  await expect.poll(()=>page.locator('.v159-person-card:visible').count()).toBeGreaterThan(expected);
});

test('Person profile defaults to one compact Overview and exposes tabs for deeper sections',async({page})=>{
  await page.goto('/#dashboard');
  await page.locator('#search').fill('Hazel Berg');
  const result=page.locator('#search-v13-2-results [data-person]').filter({hasText:'Hazel'}).first();
  await result.click();
  await expect(page.locator('.v159-person-overview')).toBeVisible();
  await expect(page.locator('.v1510-profile-tabs')).toBeVisible();
  await expect(page.locator('.v159-life-summary')).toBeVisible();
  await expect(page.locator('.profile-family-grid')).toBeHidden();
  await expect(page.locator('.profile-media')).toBeHidden();
  await expect(page.locator('.v153-family-network')).toBeHidden();
  await page.getByRole('button',{name:'Family',exact:true}).click();
  await expect(page.locator('.profile-family-grid')).toBeVisible();
  await expect(page.locator('.v159-life-summary')).toBeHidden();
  await page.getByRole('button',{name:'Photos',exact:true}).click();
  await expect(page.locator('.profile-media')).toBeVisible();
});

test('desktop tree keeps the persistent focal-person context and profile navigation',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop tree context contract');
  await page.goto('/#tree');
  const focal=page.locator('.v154-tree-person');
  await expect(focal).toBeVisible();
  await expect(page.locator('.v154-tree-controls')).toBeVisible();
  await expect(page.locator('.v154-graph-shell')).toBeVisible();
  await focal.getByRole('link',{name:'Open profile'}).click();
  await expect(page).toHaveURL(/#person\//);
});

test('Photos keeps contextual search plus its dedicated media filters',async({page},testInfo)=>{
  await page.goto('/#media');
  await expect(page.locator('[data-media-page]')).toBeVisible();
  await expect(page.locator('.route-shell .page-heading')).toBeVisible();
  await expect(page.locator('.route-shell #filters')).toBeVisible();
  await expect(page.locator('#search')).toBeVisible();
  await expect(page.locator('.media-library-controls')).toBeVisible();
  if(testInfo.project.name==='desktop-chromium')await expect(page.locator('#nav').getByRole('link',{name:'Photos',exact:true})).toBeVisible();
  if(testInfo.project.name==='mobile-chromium')await expect(page.locator('#family-mobile-dock').getByRole('link',{name:'Photos',exact:true})).toBeVisible();
});
