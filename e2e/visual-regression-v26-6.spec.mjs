import{test,expect}from'@playwright/test';

const PERSON='P-WILLIAM-JOHN-RAHE-III';

async function mockApis(page){
  await page.route('**/api/media**',async route=>{
    const url=new URL(route.request().url());
    if(url.searchParams.has('file'))return route.fulfill({status:404,contentType:'text/plain',body:'not found'});
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})});
  });
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}
async function open(page,route){
  await page.goto(`/#${route}`);
  const expected=route.split('/')[0];
  await page.waitForFunction(value=>document.body.dataset.route===value,expected);
  await page.waitForFunction(()=>document.body.dataset.routeCapabilityState==='ready');
}
async function noOverflow(page){
  return page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1);
}
async function visibleRects(locator){
  return locator.evaluateAll(nodes=>nodes.filter(node=>node.getClientRects().length).map(node=>{
    const r=node.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
  }));
}
test.beforeEach(async({page})=>{await mockApis(page);});

test.describe('v26.6 desktop visual composition',()=>{
  test.skip(({isMobile})=>Boolean(isMobile),'desktop/tablet visual contract');

  for(const width of[1366,1440]){
    test(`major routes stay aligned and contained at ${width}px`,async({page})=>{
      await page.setViewportSize({width,height:900});
      for(const route of['dashboard','people',`person/${PERSON}`,'families','tree','research','evidence','sources','source/C001']){
        await open(page,route);
        expect(await noOverflow(page),`${route} should not overflow horizontally`).toBe(true);
        const box=await page.locator('#main').boundingBox();
        expect(box).not.toBeNull();
        expect(box.left).toBeGreaterThanOrEqual(-1);
        expect(box.right).toBeLessThanOrEqual(width+1);
      }
    });
  }

  test('Families cards align and Branch composition remains compact',async({page})=>{
    await page.setViewportSize({width:1440,height:900});
    await open(page,'families');
    const cards=page.locator('.family-card');
    await expect(cards.first()).toBeVisible();
    const heights=(await visibleRects(cards)).slice(0,6).map(r=>r.height);
    expect(Math.max(...heights)-Math.min(...heights)).toBeLessThanOrEqual(48);
    await cards.first().click();
    await page.waitForFunction(()=>document.body.dataset.route==='branch');
    await expect(page.locator('.branch-hero')).toBeVisible();
    await expect(page.locator('.branch-actions')).toBeVisible();
    expect(await noOverflow(page)).toBe(true);
  });

  test('Tree uses the available viewport without toolbar obstruction',async({page})=>{
    await page.setViewportSize({width:1440,height:900});
    await open(page,'tree');
    const graph=page.locator('.graph-shell,.tree-graph-shell').first();
    const box=await graph.boundingBox();
    expect(box?.height||0).toBeGreaterThanOrEqual(620);
    const toolbar=page.locator('.graph-toolbar').first();
    if(await toolbar.isVisible()){
      const t=await toolbar.boundingBox();
      expect(t?.height||0).toBeLessThanOrEqual(120);
    }
    expect(await noOverflow(page)).toBe(true);
  });

  test('utility popover and Person sticky navigation stay inside the composition',async({page})=>{
    await page.setViewportSize({width:1366,height:900});
    await open(page,'people');
    const tools=page.locator('.site-tools');
    if(await tools.isVisible()){
      await tools.locator('summary').click();
      const menu=tools.locator(':scope>div');
      await expect(menu).toBeVisible();
      const rect=await menu.boundingBox();
      expect(rect.left).toBeGreaterThanOrEqual(-1);
      expect(rect.right).toBeLessThanOrEqual(1367);
    }
    await open(page,`person/${PERSON}`);
    const nav=page.locator('.person-nav');
    await expect(nav).toBeVisible();
    await expect(nav).toHaveCSS('position','sticky');
    const top=await nav.evaluate(node=>parseFloat(getComputedStyle(node).top));
    expect(top).toBeGreaterThanOrEqual(0);
  });
});

test.describe('v26.6 tablet visual composition',()=>{
  test.skip(({isMobile})=>Boolean(isMobile),'tablet contract runs in desktop Chromium');

  for(const width of[768,1024]){
    test(`core routes transition cleanly at ${width}px`,async({page})=>{
      await page.setViewportSize({width,height:900});
      for(const route of['people',`person/${PERSON}`,'families','tree','research']){
        await open(page,route);
        expect(await noOverflow(page),`${route} should stay contained`).toBe(true);
      }
      await open(page,'tree');
      const graph=page.locator('.graph-shell,.tree-graph-shell').first();
      expect((await graph.boundingBox())?.height||0).toBeGreaterThanOrEqual(540);
      const controls=await visibleRects(page.locator('.tree-controls button,.tree-controls select,.graph-toolbar button'));
      expect(controls.length).toBeGreaterThan(0);
      expect(Math.min(...controls.map(r=>r.height))).toBeGreaterThanOrEqual(44);
    });
  }
});

test.describe('v26.6 mobile visual composition',()=>{
  test.skip(({isMobile})=>!isMobile,'phone-only visual contract');

  for(const width of[375,390,430]){
    test(`Home, People, Families, Person and Tree remain dense at ${width}px`,async({page})=>{
      await page.setViewportSize({width,height:844});
      await open(page,'dashboard');
      expect(await noOverflow(page)).toBe(true);

      await open(page,'people');
      const rows=page.locator('.directory-person-card>button');
      await expect(rows.first()).toBeVisible();
      const rowHeights=(await visibleRects(rows)).slice(0,6).map(r=>r.height);
      expect(Math.min(...rowHeights)).toBeGreaterThanOrEqual(44);
      expect(Math.max(...rowHeights)).toBeLessThanOrEqual(82);

      await open(page,'families');
      const card=page.locator('.family-card').first();
      await expect(card).toBeVisible();
      expect((await card.boundingBox())?.width||0).toBeLessThan(width);

      await open(page,`person/${PERSON}`);
      const header=page.locator('.person-header');
      expect((await header.boundingBox())?.height||0).toBeLessThan(430);
      expect(await noOverflow(page)).toBe(true);

      await open(page,'tree');
      const graph=page.locator('.graph-shell,.tree-graph-shell').first();
      expect((await graph.boundingBox())?.height||0).toBeGreaterThanOrEqual(500);
      expect(await noOverflow(page)).toBe(true);
    });
  }

  test('More sheet and search state stay clear of the dock and viewport',async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await open(page,'people');
    const more=page.locator('#family-mobile-dock details.mobile-more');
    await more.locator('summary').click();
    const sheet=more.locator(':scope>div');
    await expect(sheet).toBeVisible();
    const sheetRect=await sheet.boundingBox();
    expect(sheetRect).not.toBeNull();
    expect(sheetRect.x).toBeGreaterThanOrEqual(0);
    expect(sheetRect.x+sheetRect.width).toBeLessThanOrEqual(390);
    expect(sheetRect.y+sheetRect.height).toBeLessThanOrEqual(844);
    await page.keyboard.press('Escape');
    await page.locator('#mobile-app-header [data-global-search]').click();
    await expect(page).toHaveURL(/#people$/);
    await expect(page.locator('.mobile-search input')).toBeFocused();
    expect(await noOverflow(page)).toBe(true);
  });

  test('Source inspector dialog remains contained, modal and touch-safe',async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await open(page,'source/C001');
    const openButton=page.locator('[data-source-inspector-open]');
    await openButton.click();
    const panel=page.locator('[data-source-inspector-panel]');
    await expect(panel).toHaveAttribute('aria-modal','true');
    const rect=await panel.boundingBox();
    expect(rect).not.toBeNull();
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.x+rect.width).toBeLessThanOrEqual(390);
    expect(rect.y+rect.height).toBeLessThanOrEqual(844);
    const targets=await visibleRects(panel.locator('button,[href],input,select'));
    expect(targets.length).toBeGreaterThan(0);
    expect(Math.min(...targets.map(r=>r.height))).toBeGreaterThanOrEqual(44);
    expect(await page.locator('#main').evaluate(node=>node.inert)).toBe(true);
  });
});
