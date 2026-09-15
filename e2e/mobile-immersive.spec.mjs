import{test,expect}from'@playwright/test';

async function open(page,route='dashboard'){
  await page.goto(`/#${route}`);
  await page.waitForSelector('#family-mobile-dock:not([hidden])');
  await page.waitForFunction(()=>document.body.classList.contains('v20-mobile-app'));
}

test.describe('immersive mobile family archive',()=>{
  test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

  test('Home is an editorial cover rather than desktop chrome stacked on a phone',async({page})=>{
    await open(page,'dashboard');
    const hero=page.locator('[data-v17-native="home"] .v17-home-hero');
    await expect(hero).toBeVisible();
    const geometry=await hero.boundingBox();
    expect(geometry?.height||0).toBeGreaterThan(650);
    const style=await hero.evaluate(el=>({radius:getComputedStyle(el).borderBottomLeftRadius,bg:getComputedStyle(el).backgroundImage}));
    expect(parseFloat(style.radius)).toBeGreaterThanOrEqual(30);
    expect(style.bg).toContain('gradient');
    const headerPosition=await page.locator('.site-header.sidebar').evaluate(el=>getComputedStyle(el).position);
    expect(headerPosition).toBe('absolute');
    const primary=await page.locator('.v17-primary-actions .action.primary').boundingBox();
    const secondary=await page.locator('.v17-primary-actions .action').nth(1).boundingBox();
    expect(primary?.width||0).toBeGreaterThan((secondary?.width||0)*1.7);
  });

  test('bottom navigation is a dark app tab bar with a circular elevated Tree action',async({page})=>{
    await open(page,'dashboard');
    const dock=page.locator('#family-mobile-dock');
    const tree=dock.locator('[data-dock-route="tree"]');
    const dockStyle=await dock.evaluate(el=>({radius:getComputedStyle(el).borderTopLeftRadius,bg:getComputedStyle(el).backgroundColor}));
    expect(parseFloat(dockStyle.radius)).toBeGreaterThanOrEqual(20);
    expect(dockStyle.bg).not.toBe('rgba(0, 0, 0, 0)');
    const treeBox=await tree.boundingBox();
    expect(treeBox?.width||0).toBeGreaterThanOrEqual(60);
    expect(Math.abs((treeBox?.width||0)-(treeBox?.height||0))).toBeLessThan(8);
    const treeRadius=await tree.evaluate(el=>getComputedStyle(el).borderRadius);
    expect(parseFloat(treeRadius)).toBeGreaterThanOrEqual(30);
  });

  test('Families is a vertical catalogue instead of a horizontal desktop-card rail',async({page})=>{
    await open(page,'families');
    await page.waitForSelector('.v175-family-card');
    const cards=page.locator('.v175-family-card');
    expect(await cards.count()).toBeGreaterThan(1);
    const first=await cards.nth(0).boundingBox(),second=await cards.nth(1).boundingBox();
    expect(Math.abs((first?.x||0)-(second?.x||0))).toBeLessThan(8);
    expect((second?.y||0)).toBeGreaterThan((first?.y||0)+100);
    expect(first?.width||0).toBeGreaterThan(330);
  });

  test('Person opens with a full identity cover and app-style section controls',async({page})=>{
    await open(page,'person/P-WILLIAM-JOHN-RAHE-III');
    const header=page.locator('.v17-person-header');
    await expect(header).toBeVisible();
    const box=await header.boundingBox();
    expect(box?.height||0).toBeGreaterThan(340);
    const radius=await header.evaluate(el=>getComputedStyle(el).borderBottomLeftRadius);
    expect(parseFloat(radius)).toBeGreaterThanOrEqual(30);
    await expect(page.locator('.v20-person-tabs')).toBeVisible();
    await expect(page.locator('#v17-family')).toBeVisible();
    await expect(page.locator('#v17-life')).toBeVisible();
    await expect(page.locator('#v17-research')).toBeVisible();
  });

  test('Tree suppresses page chrome and gives the graph the viewport',async({page})=>{
    await open(page,'tree');
    await page.waitForSelector('.graph-shell,.tree-graph-shell');
    await expect(page.locator('.route-shell')).toBeHidden();
    await expect(page.locator('.site-footer')).toBeHidden();
    const graph=await page.locator('.graph-shell,.tree-graph-shell').first().boundingBox();
    expect(graph?.height||0).toBeGreaterThan(600);
  });

  test('core routes remain horizontally contained',async({page})=>{
    for(const route of['dashboard','people','families','person/P-WILLIAM-JOHN-RAHE-III','tree']){
      await open(page,route);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      expect(overflow,route).toBeLessThanOrEqual(1);
    }
  });
});
