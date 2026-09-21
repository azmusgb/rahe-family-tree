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
  await page.waitForFunction(expected=>document.body.dataset.route===expected,route.split('/')[0]);
  await page.waitForFunction(()=>document.body.dataset.routeCapabilityState==='ready');
}
const overflow=page=>page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);

test.beforeEach(async({page})=>{await mockApis(page);});

test.describe('v26.2 phone refinement',()=>{
  test.skip(({isMobile})=>!isMobile,'phone-only responsive contract');

  for(const width of[375,390,430]){
    test(`People is dense, touch-safe, and contained at ${width}px`,async({page})=>{
      await page.setViewportSize({width,height:844});
      await open(page,'people');
      await expect(page.locator('.mobile-search')).toHaveCSS('position','sticky');
      const rows=page.locator('.v17-person-card>button');
      await expect(rows.first()).toBeVisible();
      const heights=await rows.evaluateAll(nodes=>nodes.slice(0,6).map(node=>node.getBoundingClientRect().height));
      expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
      expect(Math.max(...heights)).toBeLessThanOrEqual(76);
      const chips=page.locator('.v17-branch-chip');
      if(await chips.count()){
        const chipHeights=await chips.evaluateAll(nodes=>nodes.slice(0,6).map(node=>node.getBoundingClientRect().height));
        expect(Math.min(...chipHeights)).toBeGreaterThanOrEqual(44);
      }
      expect(await overflow(page)).toBeLessThanOrEqual(1);
    });
  }

  test('Person sticky section navigation clears the mobile header stack',async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await open(page,`person/${PERSON}`);
    const tabs=page.locator('.v20-person-tabs');
    await expect(tabs).toBeVisible();
    await expect(tabs).toHaveCSS('position','sticky');
    const metrics=await page.evaluate(()=>{
      const tabs=document.querySelector('.v20-person-tabs');
      const context=document.querySelector('.v20-context-bar');
      const header=document.querySelector('#mobile-app-header');
      return{
        top:parseFloat(getComputedStyle(tabs).top),
        minimum:(header?.getBoundingClientRect().height||0)+(context?.getBoundingClientRect().height||0),
        doc:document.documentElement.scrollWidth,
        viewport:document.documentElement.clientWidth
      };
    });
    expect(metrics.top).toBeGreaterThanOrEqual(metrics.minimum-2);
    expect(metrics.doc).toBeLessThanOrEqual(metrics.viewport+1);
    const heights=await tabs.locator('button').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().height));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
    const contextTargets=page.locator('.v20-context-bar>a,.v20-context-bar>button');
    const contextHeights=await contextTargets.evaluateAll(nodes=>nodes.filter(node=>node.getClientRects().length).map(node=>node.getBoundingClientRect().height));
    expect(contextHeights.length).toBeGreaterThan(0);
    expect(Math.min(...contextHeights)).toBeGreaterThanOrEqual(44);
  });

  test('Tree prioritizes canvas and compact controls remain touch-safe',async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await open(page,'tree');
    const graph=page.locator('.graph-shell,.tree-graph-shell').first();
    await expect(graph).toBeVisible();
    expect((await graph.boundingBox())?.height||0).toBeGreaterThanOrEqual(500);
    const controls=page.locator('.v161-tree-tool-actions button,[data-v161-tree-controls] button,[data-v161-tree-controls] select,.graph-toolbar button');
    const sizes=await controls.evaluateAll(nodes=>nodes.filter(node=>node.getClientRects().length).map(node=>node.getBoundingClientRect().height));
    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(44);
    expect(await overflow(page)).toBeLessThanOrEqual(1);
  });

  test('More sheet makes background inert and restores state on close and route change',async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await open(page,'people');
    const more=page.locator('#family-mobile-dock details.mobile-more');
    await more.locator('summary').click();
    await expect.poll(()=>page.locator('#main').evaluate(node=>node.inert)).toBe(true);
    await expect.poll(()=>page.locator('#mobile-app-header').evaluate(node=>node.inert)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(more).not.toHaveAttribute('open','');
    await expect.poll(()=>page.locator('#main').evaluate(node=>node.inert)).toBe(false);
    await expect.poll(()=>page.locator('#mobile-app-header').evaluate(node=>node.inert)).toBe(false);
    await expect(more.locator('summary')).toBeFocused();
    await more.locator('summary').click();
    await more.getByRole('link',{name:'Photos'}).click();
    await expect(page).toHaveURL(/#media$/);
    await expect.poll(()=>page.locator('#main').evaluate(node=>node.inert)).toBe(false);
    await expect(page.locator('body')).not.toHaveAttribute('data-mobile-modal-open','more');
  });

  test('reduced motion removes transition while content stays visible',async({page})=>{
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.setViewportSize({width:390,height:844});
    await open(page,'people');
    const duration=await page.locator('.v17-person-card>button').first().evaluate(node=>{
      const values=getComputedStyle(node).transitionDuration.split(',').map(v=>v.trim());
      return Math.max(...values.map(v=>v.endsWith('ms')?parseFloat(v)/1000:parseFloat(v)||0));
    });
    expect(duration).toBeLessThanOrEqual(.001);
    await expect(page.locator('.v17-person-card').first()).toBeVisible();
  });

  test('safe-area reservation and focus ring remain intact',async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await open(page,'people');
    const padding=await page.locator('body').evaluate(node=>parseFloat(getComputedStyle(node).paddingBottom));
    expect(padding).toBeGreaterThanOrEqual(80);
    expect((await page.locator('#family-mobile-dock').boundingBox())?.height||0).toBeGreaterThanOrEqual(60);
    const tree=page.locator('#family-mobile-dock [data-dock-route="tree"]');
    await tree.focus();
    const focus=await tree.evaluate(node=>({style:getComputedStyle(node).outlineStyle,width:parseFloat(getComputedStyle(node).outlineWidth),offset:parseFloat(getComputedStyle(node).outlineOffset)}));
    expect(focus.style).not.toBe('none');
    expect(focus.width).toBeGreaterThanOrEqual(3);
    expect(focus.offset).toBeGreaterThanOrEqual(3);
  });
});

test.describe('v26.2 tablet and desktop refinement',()=>{
  test.skip(({isMobile})=>Boolean(isMobile),'desktop/tablet contract');

  for(const width of[768,1024]){
    test(`tablet shell and core routes remain usable at ${width}px`,async({page})=>{
      await page.setViewportSize({width,height:900});
      await open(page,'people');
      await expect(page.locator('.site-header.sidebar')).toBeVisible();
      await expect(page.locator('#mobile-app-header')).toBeHidden();
      const shell=await page.locator('.site-header.sidebar').evaluate(node=>({scroll:node.scrollWidth,client:node.clientWidth}));
      expect(shell.scroll).toBeLessThanOrEqual(shell.client+1);
      const heights=await page.locator('.primary-nav a,.nav-menu>summary,.v158-research-entry,.site-header-actions button').evaluateAll(nodes=>nodes.filter(node=>node.getClientRects().length).map(node=>node.getBoundingClientRect().height));
      expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
      expect(await overflow(page)).toBeLessThanOrEqual(1);

      await open(page,`person/${PERSON}`);
      const collision=await page.evaluate(()=>{
        const mast=document.querySelector('.site-header.sidebar')?.getBoundingClientRect();
        const nav=document.querySelector('.v17-person-nav');
        const research=document.querySelector('.v17-person-research');
        return{
          top:parseFloat(getComputedStyle(nav).top),
          mastHeight:mast?.height||0,
          researchScrollMargin:research?parseFloat(getComputedStyle(research).scrollMarginTop):0
        };
      });
      expect(collision.top).toBeGreaterThanOrEqual(collision.mastHeight-2);
      expect(collision.researchScrollMargin).toBeGreaterThanOrEqual(collision.mastHeight+40);
      const localNavHeights=await page.locator('.v17-person-nav a').evaluateAll(nodes=>nodes.filter(node=>node.getClientRects().length).map(node=>node.getBoundingClientRect().height));
      expect(localNavHeights.length).toBeGreaterThan(0);
      expect(Math.min(...localNavHeights)).toBeGreaterThanOrEqual(44);

      await open(page,'tree');
      expect((await page.locator('.graph-shell,.tree-graph-shell').first().boundingBox())?.height||0).toBeGreaterThan(540);
      const treeControlHeights=await page.locator('.tree-controls button,.tree-controls select,.v161-tree-tool-actions button,.graph-toolbar button,.tree-advanced-actions button,.tree-path-tools button,.tree-path-tools select').evaluateAll(nodes=>nodes.filter(node=>node.getClientRects().length).map(node=>node.getBoundingClientRect().height));
      expect(treeControlHeights.length).toBeGreaterThan(0);
      expect(Math.min(...treeControlHeights)).toBeGreaterThanOrEqual(44);
      expect(await overflow(page)).toBeLessThanOrEqual(1);
    });
  }

  for(const width of[1366,1440]){
    test(`wide desktop navigation remains separated at ${width}px`,async({page})=>{
      await page.setViewportSize({width,height:900});
      await open(page,'people');
      const metrics=await page.evaluate(()=>{
        const header=document.querySelector('.site-header.sidebar');
        const brand=document.querySelector('.brand')?.getBoundingClientRect();
        const primary=document.querySelector('.primary-nav')?.getBoundingClientRect();
        const menus=document.querySelector('.nav-menus')?.getBoundingClientRect();
        const actions=document.querySelector('.site-header-actions')?.getBoundingClientRect();
        const main=document.querySelector('#main')?.getBoundingClientRect();
        return{
          headerScroll:header?.scrollWidth||0,headerClient:header?.clientWidth||0,
          brandRight:brand?.right||0,primaryLeft:primary?.left||0,
          menusRight:menus?.right||0,actionsLeft:actions?.left||0,
          mainLeft:main?.left||0,mainRight:main?.right||0
        };
      });
      expect(metrics.headerScroll).toBeLessThanOrEqual(metrics.headerClient+1);
      expect(metrics.brandRight).toBeLessThanOrEqual(metrics.primaryLeft+1);
      expect(metrics.menusRight).toBeLessThanOrEqual(metrics.actionsLeft+1);
      expect(metrics.mainLeft).toBeGreaterThanOrEqual(0);
      expect(metrics.mainRight).toBeLessThanOrEqual(width+1);
      expect(await overflow(page)).toBeLessThanOrEqual(1);
    });
  }

  test('200 percent zoom-equivalent layout stays navigable and contained',async({page})=>{
    await page.setViewportSize({width:720,height:900});
    await page.addStyleTag({content:':root{font-size:200%!important}'});
    await open(page,'people');
    await expect(page.locator('#mobile-app-header')).toBeVisible();
    await expect(page.locator('.mobile-search')).toBeVisible();
    expect(await overflow(page)).toBeLessThanOrEqual(1);
    const rect=await page.locator('.v17-person-card>button').first().boundingBox();
    expect(rect?.width||0).toBeLessThanOrEqual(720);
  });

  test('skip link and desktop focus ring stay keyboard-visible',async({page})=>{
    await page.setViewportSize({width:1440,height:900});
    await open(page,'dashboard');
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip')).toBeFocused();
    expect(await page.locator('.skip').evaluate(node=>getComputedStyle(node).outlineStyle)).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });
});
