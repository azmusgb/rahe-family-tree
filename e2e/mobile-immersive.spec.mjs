import{test,expect}from'@playwright/test';

async function open(page,route='dashboard'){
  await page.goto(`/#${route}`);
  await page.waitForSelector('#family-mobile-dock:not([hidden])');
  await page.waitForFunction(()=>document.body.classList.contains('ui-actual-mobile-ui'));
}

test.describe('actual mobile family application',()=>{
  test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

  test('Home uses a dedicated header, search component, and launcher in structural order',async({page})=>{
    await open(page,'dashboard');
    await expect(page.locator('#mobile-app-header')).toBeVisible();
    await expect(page.locator('.site-header.sidebar')).toBeHidden();
    const hero=page.locator('[data-ui-native="home"] .ui-family-home-hero');
    await expect(hero).toBeVisible();
    const geometry=await hero.boundingBox();
    expect(geometry?.height||0).toBeGreaterThan(300);
    expect(geometry?.height||0).toBeLessThan(560);
    const structure=await page.evaluate(()=>{
      const home=document.querySelector('[data-ui-native="home"]');
      const hero=home?.querySelector('.ui-family-home-hero');
      const search=home?.querySelector('.mobile-search[data-v21-mobile-search="home"]');
      const launcher=home?.querySelector('.ui-mobile-launcher');
      return{
        searchInsideHome:Boolean(search&&search.parentElement===home),
        heroBeforeSearch:Boolean(hero&&search&&(hero.compareDocumentPosition(search)&Node.DOCUMENT_POSITION_FOLLOWING)),
        searchBeforeLauncher:Boolean(search&&launcher&&(search.compareDocumentPosition(launcher)&Node.DOCUMENT_POSITION_FOLLOWING)),
        primaryInLauncher:Boolean(launcher?.querySelector('.ui-primary-actions .action.primary')),
        stableRouteShellOutsideContent:Boolean(document.querySelector('#main > .route-shell'))
      };
    });
    expect(structure).toEqual({searchInsideHome:true,heroBeforeSearch:true,searchBeforeLauncher:true,primaryInLauncher:true,stableRouteShellOutsideContent:true});
  });

  test('bottom navigation has actual Home Families Tree People More runtime order',async({page})=>{
    await open(page,'dashboard');
    const order=await page.locator('#family-mobile-dock').evaluate(dock=>[...dock.children].map(node=>node.matches('a')?node.querySelector('span')?.textContent?.trim():node.querySelector('summary')?.textContent?.trim()));
    expect(order).toEqual(['Home','Families','Tree','People','More']);
    const tree=page.locator('#family-mobile-dock [data-dock-route="tree"]');
    const treeBox=await tree.boundingBox();
    expect(treeBox?.width||0).toBeGreaterThanOrEqual(56);
    expect(treeBox?.height||0).toBeLessThanOrEqual(62);
  });

  test('Home search transitions into the real People directory search',async({page})=>{
    await open(page,'dashboard');
    const input=page.locator('.mobile-search[data-v21-mobile-search="home"] input');
    await input.fill('William');
    await input.press('Enter');
    await page.waitForURL(/#people/);
    await expect(page.locator('[data-ui-native="people"] .mobile-search input')).toHaveValue('William');
    await expect(page.locator('[data-ui-native="people"] .ui-people-grid button[data-person="P-WILLIAM-JOHN-RAHE-III"]')).toBeVisible();
  });

  test('People owns its search UI inside the actual directory',async({page})=>{
    await open(page,'people');
    const search=page.locator('[data-ui-native="people"] .mobile-search[data-v21-mobile-search="people"]');
    await expect(search).toBeVisible();
    await expect(search.locator('input[type="search"]')).toBeVisible();
    const rows=page.locator('.ui-family-person-card');
    expect(await rows.count()).toBeGreaterThan(3);
  });

  test('Families is a vertical catalogue instead of a horizontal desktop-card rail',async({page})=>{
    await open(page,'families');
    await page.waitForSelector('.ui-family-card');
    const cards=page.locator('.ui-family-card');
    expect(await cards.count()).toBeGreaterThan(1);
    const first=await cards.nth(0).boundingBox(),second=await cards.nth(1).boundingBox();
    expect(Math.abs((first?.x||0)-(second?.x||0))).toBeLessThan(8);
    expect((second?.y||0)).toBeGreaterThan((first?.y||0)+100);
  });

  test('Person quick actions are structurally separated from the identity cover',async({page})=>{
    await open(page,'person/P-WILLIAM-JOHN-RAHE-III');
    const header=page.locator('.person-header');
    await expect(header).toBeVisible();
    await expect(page.locator('.ui-person-quick-actions')).toBeVisible();
    expect(await header.locator('.ui-person-actions').count()).toBe(0);
    await expect(page.locator('.ui-person-quick-actions .ui-person-actions')).toBeVisible();
    await expect(page.locator('.ui-person-tabs')).toBeVisible();
    await expect(page.locator('#v17-family')).toBeVisible();
    await expect(page.locator('#v17-life')).toBeVisible();
    await expect(page.locator('#v17-research')).toBeVisible();
  });

  test('Tree has a dedicated mode bar and keeps the graph as the workspace',async({page})=>{
    await open(page,'tree');
    await page.waitForSelector('.graph-shell,.tree-graph-shell');
    await expect(page.locator('.route-shell')).toBeHidden();
    await expect(page.locator('.site-footer')).toBeHidden();
    await expect(page.locator('.ui-tree-mode-bar')).toBeVisible();
    const graph=await page.locator('.graph-shell,.tree-graph-shell').first().boundingBox();
    expect(graph?.height||0).toBeGreaterThan(560);
  });

  test('core routes remain horizontally contained',async({page})=>{
    for(const route of['dashboard','people','families','person/P-WILLIAM-JOHN-RAHE-III','tree']){
      await open(page,route);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      expect(overflow,route).toBeLessThanOrEqual(1);
    }
  });
});
