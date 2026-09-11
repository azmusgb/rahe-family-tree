import{test,expect}from'@playwright/test';

async function mockApis(page){
  await page.route('**/api/media**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})}));
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('mobile dock is tappable and routes Home Tree People Media and Search',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-chromium','mobile navigation contract');
  await page.goto('/#dashboard');
  await expect(page.locator('.dashboard-hero')).toBeVisible();
  await expect(page.locator('.sidebar')).toBeHidden();
  const dock=page.locator('#family-mobile-dock');
  await expect(dock).toBeVisible();
  await dock.getByRole('link',{name:'Tree'}).click();
  await expect(page).toHaveURL(/#tree$/);
  await expect(page.locator('#title')).toHaveText('Tree');
  await dock.getByRole('link',{name:'People'}).click();
  await expect(page).toHaveURL(/#people$/);
  await expect(page.locator('#title')).toHaveText('People');
  await dock.getByRole('link',{name:'Media'}).click();
  await expect(page).toHaveURL(/#media$/);
  await expect(page.locator('[data-media-page]')).toBeVisible();
  await dock.getByRole('link',{name:'Home'}).click();
  await expect(page).toHaveURL(/#dashboard$/);
  await expect(page.locator('.dashboard-hero')).toBeVisible();
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
  await expect(page.locator('#title')).toHaveText('Person profile');
});

test('desktop primary navigation includes and opens Media as a core route',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop navigation contract');
  await page.goto('/#dashboard');
  const nav=page.locator('#nav');
  await expect(nav.getByRole('link',{name:'Media',exact:true})).toBeVisible();
  await nav.getByRole('link',{name:'Media',exact:true}).click();
  await expect(page).toHaveURL(/#media$/);
  await expect(page.locator('[data-media-page]')).toBeVisible();
});

test('desktop page architecture removes the utility bar and reduces Home chrome to search',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop page architecture contract');
  await page.goto('/#dashboard');
  const sidebar=page.locator('.sidebar');
  await expect(sidebar).toBeVisible();
  await expect(page.locator('.v151-primary-nav')).toBeVisible();
  await expect(page.locator('.topbar')).toBeHidden();
  await expect(page.locator('.v155-desktop-actions>summary')).toBeVisible();
  await expect(page.locator('.route-shell')).toBeVisible();
  await expect(page.locator('.route-shell .page-heading')).toBeHidden();
  await expect(page.locator('#search')).toBeVisible();
  await expect(page.locator('#branch')).toBeHidden();
  await expect(page.locator('#state')).toBeHidden();
  const shellBox=await sidebar.boundingBox();
  expect(shellBox.height).toBeLessThan(100);
  expect(shellBox.width).toBeGreaterThan(1000);
  await expect(page.locator('.dashboard-hero')).toBeVisible();
  await expect(page.locator('.v157-tree-preview')).toBeVisible();
});

test('desktop research menu exposes advanced routes without crowding primary family navigation',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','desktop relayout contract');
  await page.goto('/#dashboard');
  const menu=page.locator('.v151-nav-menu').filter({hasText:'Research'}).first();
  await menu.locator('summary').click();
  await expect(menu.getByRole('link',{name:/Evidence/}).first()).toBeVisible();
  await menu.getByRole('link',{name:/Sources/}).first().click();
  await expect(page).toHaveURL(/#sources$/);
  await expect(page.locator('#title')).toHaveText('Sources');
});

test('v15.7 home prioritizes family tree and people before the research center',async({page})=>{
  await page.goto('/#dashboard');
  const hero=page.locator('.v157-hero');
  await expect(hero).toBeVisible();
  await expect(hero.getByRole('heading',{name:'The Rahe family, connected.'})).toBeVisible();
  await expect(page.locator('.v157-tree-preview')).toBeVisible();
  await expect(page.locator('#dashboard-featured-title')).toBeVisible();
  await expect(page.locator('.v157-research-center')).toBeVisible();
  await expect(page.locator('.dashboard-research-split')).toHaveCount(0);
  await expect(page.locator('[aria-labelledby="dashboard-records-title"]')).toHaveCount(0);
  const order=await page.evaluate(()=>{
    const tree=document.querySelector('.v157-tree-preview');
    const people=document.querySelector('#dashboard-featured-title')?.closest('.dashboard-section');
    const research=document.querySelector('.v157-research-center');
    return Boolean(tree&&people&&research&&(tree.compareDocumentPosition(people)&Node.DOCUMENT_POSITION_FOLLOWING)&&(people.compareDocumentPosition(research)&Node.DOCUMENT_POSITION_FOLLOWING));
  });
  expect(order).toBeTruthy();
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
  await expect(page.locator('.v153-family-network').getByRole('heading',{name:'Family connections'})).toBeVisible();
});

test('v15.4 tree gives the focal person a persistent context panel and keeps profile navigation one tap away',async({page})=>{
  await page.goto('/#tree');
  const focal=page.locator('.v154-tree-person');
  await expect(focal).toBeVisible();
  await expect(page.locator('.v154-tree-controls')).toBeVisible();
  await expect(page.locator('.v154-graph-shell')).toBeVisible();
  await expect(page.locator('.v154-tree-help')).toBeVisible();
  await focal.getByRole('link',{name:'Open profile'}).click();
  await expect(page).toHaveURL(/#person\//);
  await expect(page.locator('.v153-profile-overview')).toBeVisible();
});

test('v15.5 Media delegates filtering to its own page controls',async({page})=>{
  await page.goto('/#media');
  await expect(page.locator('[data-media-page]')).toBeVisible();
  await expect(page.locator('.route-shell .page-heading')).toBeVisible();
  await expect(page.locator('.route-shell #filters')).toBeHidden();
});
