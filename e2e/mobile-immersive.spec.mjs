import{test,expect}from'@playwright/test';

async function open(page,route='dashboard'){
  await page.goto(`/#${route}`);
  await page.waitForSelector('#family-mobile-dock:not([hidden])');
  await page.waitForFunction(()=>document.body.classList.contains('v21-actual-mobile-ui'));
}

test.describe('actual mobile family application',()=>{
  test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

  test('Home uses a dedicated mobile header and physically integrates search below the hero',async({page})=>{
    await open(page,'dashboard');
    await expect(page.locator('#mobile-app-header')).toBeVisible();
    await expect(page.locator('.site-header.sidebar')).toBeHidden();
    const hero=page.locator('[data-v17-native="home"] .v17-home-hero');
    await expect(hero).toBeVisible();
    const geometry=await hero.boundingBox();
    expect(geometry?.height||0).toBeGreaterThan(480);
    const structure=await page.evaluate(()=>{
      const home=document.querySelector('[data-v17-native="home"]');
      const hero=home?.querySelector('.v17-home-hero');
      const shell=home?.querySelector('.route-shell[data-mobile-integrated-search="home"]');
      const launcher=home?.querySelector('.v21-mobile-launcher');
      return{
        shellInsideHome:Boolean(shell&&shell.parentElement===home),
        heroBeforeSearch:Boolean(hero&&shell&&(hero.compareDocumentPosition(shell)&Node.DOCUMENT_POSITION_FOLLOWING)),
        searchBeforeLauncher:Boolean(shell&&launcher&&(shell.compareDocumentPosition(launcher)&Node.DOCUMENT_POSITION_FOLLOWING)),
        primaryInLauncher:Boolean(launcher?.querySelector('.v17-primary-actions .action.primary'))
      };
    });
    expect(structure).toEqual({shellInsideHome:true,heroBeforeSearch:true,searchBeforeLauncher:true,primaryInLauncher:true});
  });

  test('bottom navigation has actual Home Families Tree People More DOM order',async({page})=>{
    await open(page,'dashboard');
    const order=await page.locator('#family-mobile-dock').evaluate(dock=>[...dock.children].map(node=>node.matches('a')?node.querySelector('span')?.textContent?.trim():node.querySelector('summary')?.textContent?.trim()));
    expect(order).toEqual(['Home','Families','Tree','People','More']);
    const tree=page.locator('#family-mobile-dock [data-dock-route="tree"]');
    const treeBox=await tree.boundingBox();
    expect(treeBox?.width||0).toBeGreaterThanOrEqual(60);
    expect(Math.abs((treeBox?.width||0)-(treeBox?.height||0))).toBeLessThan(8);
  });

  test('People owns its search UI inside the actual directory',async({page})=>{
    await open(page,'people');
    const shell=page.locator('[data-v17-native="people"] .route-shell[data-mobile-integrated-search="people"]');
    await expect(shell).toBeVisible();
    await expect(shell.locator('input[type="search"]')).toBeVisible();
    const rows=page.locator('.v17-person-card');
    expect(await rows.count()).toBeGreaterThan(3);
  });

  test('Families is a vertical catalogue instead of a horizontal desktop-card rail',async({page})=>{
    await open(page,'families');
    await page.waitForSelector('.v175-family-card');
    const cards=page.locator('.v175-family-card');
    expect(await cards.count()).toBeGreaterThan(1);
    const first=await cards.nth(0).boundingBox(),second=await cards.nth(1).boundingBox();
    expect(Math.abs((first?.x||0)-(second?.x||0))).toBeLessThan(8);
    expect((second?.y||0)).toBeGreaterThan((first?.y||0)+100);
  });

  test('Person quick actions are structurally separated from the identity cover',async({page})=>{
    await open(page,'person/P-WILLIAM-JOHN-RAHE-III');
    const header=page.locator('.v17-person-header');
    await expect(header).toBeVisible();
    await expect(page.locator('.v21-person-quick-actions')).toBeVisible();
    expect(await header.locator('.v17-person-actions').count()).toBe(0);
    await expect(page.locator('.v21-person-quick-actions .v17-person-actions')).toBeVisible();
    await expect(page.locator('.v20-person-tabs')).toBeVisible();
    await expect(page.locator('#v17-family')).toBeVisible();
    await expect(page.locator('#v17-life')).toBeVisible();
    await expect(page.locator('#v17-research')).toBeVisible();
  });

  test('Tree has a dedicated mode bar and keeps the graph as the workspace',async({page})=>{
    await open(page,'tree');
    await page.waitForSelector('.graph-shell,.tree-graph-shell');
    await expect(page.locator('.route-shell')).toBeHidden();
    await expect(page.locator('.site-footer')).toBeHidden();
    await expect(page.locator('.v21-tree-mode-bar')).toBeVisible();
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
