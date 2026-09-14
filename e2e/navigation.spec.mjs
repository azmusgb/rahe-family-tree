import{test,expect}from'@playwright/test';

async function mockApis(page){
  await page.route('**/api/media**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})}));
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('mobile dock is simplified to Home Tree Families People and More',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-chromium','mobile navigation contract');
  await page.goto('/#dashboard');
  await expect(page.locator('.v17-home-hero')).toBeVisible();
  await expect(page.locator('.site-header')).toBeVisible();
  await expect(page.locator('.site-header #nav')).toBeHidden();
  const dock=page.locator('#family-mobile-dock');
  await expect(dock).toBeVisible();
  await dock.getByRole('link',{name:'Tree'}).click();
  await expect(page).toHaveURL(/#tree$/);
  await expect(page.locator('[data-v17-native="tree"]')).toBeVisible();
  await dock.getByRole('link',{name:'Families'}).click();
  await expect(page).toHaveURL(/#families$/);
  await expect(page.locator('.v175-family-grid')).toBeVisible();
  await dock.getByRole('link',{name:'People'}).click();
  await expect(page).toHaveURL(/#people$/);
  await expect(page.locator('[data-v17-native="people"]')).toBeVisible();
  await dock.locator('.v158-mobile-more>summary').click();
  await dock.getByRole('link',{name:'Photos'}).click();
  await expect(page).toHaveURL(/#media$/);
  await expect(page.locator('[data-media-page]')).toBeVisible();
  await dock.locator('.v158-mobile-more>summary').click();
  await dock.getByRole('button',{name:'Search'}).click();
  await expect(page).toHaveURL(/#media$/);
  await expect(page.locator('#search')).toBeFocused();
});

test('global search routes Home to People and a result opens',async({page})=>{
  await page.goto('/#dashboard');
  const home=page.locator('[data-v17-native="home"]');
  await expect(home).toBeVisible();
  await expect(page.locator('#filters')).toBeHidden();
  await page.locator('.site-header [data-global-search]').click();
  await expect(page).toHaveURL(/#people$/);
  await expect(page.locator('#filters')).toBeVisible();
  await expect(page.locator('#search')).toBeFocused();
  await page.locator('#search').fill('Hazel Berg');
  const result=page.locator('#search-v13-2-results [data-person]').filter({hasText:'Hazel'}).first();
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(/#person\//);
  await expect(page.locator('[data-v17-native="person"]')).toBeVisible();
  await expect(page.locator('#title')).toHaveText('Person profile');
});

test('tree person visual opens mobile preview first and desktop biography directly',async({page},testInfo)=>{
  await page.goto('/#tree');
  const node=page.locator('[data-v17-native="tree"] .graph-node[data-person]').first();
  await expect(node).toBeAttached();
  await node.locator('.node-avatar').click();
  if(testInfo.project.name==='mobile-chromium'){
    const preview=page.locator('.family-person-preview');
    await expect(preview).toBeVisible();
    await expect(preview.locator('[data-family-preview-profile]')).toBeVisible();
    return;
  }
  await expect(page).toHaveURL(/#person\//);
  await expect(page.locator('[data-v17-native="person"]')).toBeVisible();
});

test('desktop family navigation is Home Tree People Families Photos plus Explore and Research',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop navigation contract');
  await page.goto('/#dashboard');
  const nav=page.locator('#nav');
  for(const label of['Home','Tree','People','Families','Photos'])await expect(nav.getByRole('link',{name:label,exact:true})).toBeVisible();
  await expect(nav.getByRole('link',{name:'Research',exact:true})).toBeVisible();
  const explore=nav.locator('.v158-explore');
  await explore.locator('summary').click();
  await expect(explore.getByRole('link',{name:/Timeline/})).toBeVisible();
  await expect(explore.getByRole('link',{name:/Places & Migration/})).toBeVisible();
  await expect(explore.getByRole('link',{name:/Stories/})).toBeVisible();
  await nav.getByRole('link',{name:'Photos',exact:true}).click();
  await expect(page).toHaveURL(/#media$/);
});

test('desktop family shell keeps content-first chrome and route-aware search',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop page architecture contract');
  await page.goto('/#dashboard');
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(page.locator('.topbar')).toBeHidden();
  await expect(page.locator('#filters')).toBeHidden();
  await expect(page.locator('.site-header [data-global-search]')).toBeVisible();
  await expect(page.locator('.v17-home-tree')).toBeVisible();
  await page.locator('#nav').getByRole('link',{name:'People',exact:true}).click();
  await expect(page.locator('#filters')).toBeVisible();
  await expect(page.locator('#filters .search')).toContainText('Search people and branches');
  await expect(page.locator('#search')).toHaveAttribute('placeholder','Name, branch, or place…');
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
  await expect(page.locator('.site-footer')).toBeVisible();
});

test('Home is a direct narrative flow without legacy collapsed dashboard sections',async({page})=>{
  await page.goto('/#dashboard');
  const home=page.locator('[data-v17-native="home"]');
  await expect(home.locator('.v17-home-hero')).toBeVisible();
  await expect(home.locator('.v17-home-tree')).toBeVisible();
  await expect(home.locator('.v17-home-story')).toBeVisible();
  await expect(home.locator('.v17-featured-people')).toBeVisible();
  await expect(home.locator('.v17-research-door')).toBeVisible();
  await expect(page.locator('.v1510-home-more')).toHaveCount(0);
});

test('People is a native family directory with direct branch browsing',async({page})=>{
  await page.goto('/#people');
  const people=page.locator('[data-v17-native="people"]');
  await expect(people.locator('.v17-page-intro')).toBeVisible();
  await expect(people.locator('.v17-branch-browser')).toBeVisible();
  const cards=people.locator('.v17-person-card');
  await expect(cards.first()).toBeVisible();
  await expect(cards.first().locator('.v17-person-card-copy')).toBeVisible();
  await expect(page.locator('[data-v1510-people-more]')).toHaveCount(0);
  expect(await cards.count()).toBeGreaterThan(12);
});

test('Person is a flowing native biography with Family Life Photos and Research sections',async({page})=>{
  await page.goto('/#people');
  const result=page.locator('.v17-person-card button[data-person]').filter({hasText:/Hazel.*Berg/i}).first();
  await expect(result).toBeVisible();
  await result.click();
  const profile=page.locator('[data-v17-native="person"]');
  await expect(profile.locator('.v17-person-header')).toBeVisible();
  const nav=profile.locator('.v17-person-nav');
  for(const label of['Family','Life','Photos','Research'])await expect(nav.getByRole('link',{name:label,exact:true})).toBeVisible();
  await expect(profile.locator('#v17-family')).toBeVisible();
  await expect(profile.locator('#v17-life')).toBeVisible();
  await expect(profile.locator('#v17-photos')).toBeVisible();
  await expect(profile.locator('#v17-research')).toBeVisible();
  await expect(page.locator('.v1510-profile-tabs')).toHaveCount(0);
});

test('native Tree keeps focused family context and compact relationship tools',async({page})=>{
  await page.goto('/#tree');
  const tree=page.locator('[data-v17-native="tree"]');
  await expect(tree).toBeVisible();
  await expect(tree.locator('.graph-shell')).toBeVisible();
  await expect(page.locator('.v161-tree-toolbar')).toBeVisible();
  await expect(page.locator('[data-v161-relationship]')).toBeVisible();
  await expect(tree.locator('[data-tree-person]')).toBeVisible();
});

test('Photos keeps contextual search and collapses dedicated media filters on demand',async({page},testInfo)=>{
  await page.goto('/#media');
  await expect(page.locator('[data-media-page]')).toBeVisible();
  await expect(page.locator('.route-shell .page-heading')).toBeVisible();
  await expect(page.locator('.route-shell #filters')).toBeVisible();
  await expect(page.locator('#search')).toBeVisible();
  const disclosure=page.locator('.v161-media-filters');
  await expect(disclosure).toBeVisible();
  await expect(disclosure).not.toHaveAttribute('open','');
  await disclosure.locator('summary').click();
  await expect(page.locator('.media-library-controls')).toBeVisible();
  if(testInfo.project.name==='desktop-chromium')await expect(page.locator('#nav').getByRole('link',{name:'Photos',exact:true})).toBeVisible();
  if(testInfo.project.name==='mobile-chromium'){
    const dock=page.locator('#family-mobile-dock');
    await dock.locator('.v158-mobile-more>summary').click();
    await expect(dock.getByRole('link',{name:'Photos',exact:true})).toBeVisible();
  }
});
