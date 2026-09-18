import{test,expect}from'@playwright/test';

const HAZEL='P-HAZEL-EMMA-BERG-DENNEWITZ';

async function open(page,route='dashboard'){
  await page.goto(`/#${route}`);
  await page.waitForFunction(()=>Boolean(globalThis.__familyRouteCapabilityRuntime));
  await page.waitForFunction(()=>document.body.dataset.routeCapabilityState==='ready');
}

async function snapshot(page,route){
  return page.evaluate(key=>globalThis.__familyRouteCapabilityRuntime.snapshot(key),route);
}

test.describe('v20.2 route-level capability loading',()=>{
  test('dashboard loads its Home-scoped presentation capabilities',async({page})=>{
    await open(page,'dashboard');
    const state=await snapshot(page,'dashboard');
    expect(state.registered).toEqual(expect.arrayContaining(['stories-runtime','record-ingestion','person-experience-v17-3','mobile-home-polish','family-narrative','experience-elevation-v17-4','unified-family-experience']));
    expect(state.loaded).toEqual(expect.arrayContaining(['mobile-home-polish','family-narrative','experience-elevation-v17-4','unified-family-experience']));
    expect(state.loaded).not.toContain('stories-runtime');
    expect(state.loaded).not.toContain('record-ingestion');
    expect(state.loaded).not.toContain('person-experience-v17-3');
    expect(state.matched).toEqual(['mobile-home-polish','family-narrative','experience-elevation-v17-4','unified-family-experience']);
  });

  test('Stories loads its route capability without pulling in research or Person capabilities',async({page})=>{
    await open(page,'dashboard');
    await page.evaluate(()=>{location.hash='#stories';});
    await page.waitForSelector('.ui-stories');
    await page.waitForFunction(()=>document.body.dataset.routeCapabilityState==='ready');
    const state=await snapshot(page,'stories');
    expect(state.loaded).toContain('stories-runtime');
    expect(state.loaded).not.toContain('record-ingestion');
    expect(state.loaded).not.toContain('person-experience-v17-3');
    expect(state.matched).toEqual(['stories-runtime']);
    await expect(page.locator('#stories-title')).toHaveText('Stories from the family record');
  });

  test('Research loads record ingestion without pulling in Stories or Person',async({page})=>{
    await open(page,'dashboard');
    await page.evaluate(()=>{location.hash='#research';});
    await page.waitForSelector('[data-record-ingestion]');
    await page.waitForFunction(()=>document.body.dataset.routeCapabilityState==='ready');
    const state=await snapshot(page,'research');
    expect(state.loaded).toContain('record-ingestion');
    expect(state.loaded).not.toContain('stories-runtime');
    expect(state.loaded).not.toContain('person-experience-v17-3');
    expect(state.matched).toEqual(['record-ingestion']);
    await expect(page.locator('[data-record-ingestion]')).toContainText('Evidence intake workbench');
  });

  test('cold Stories deep link loads only the Stories route capability',async({page})=>{
    await open(page,'stories');
    await expect(page.locator('.ui-stories')).toBeVisible();
    const state=await snapshot(page,'stories');
    expect(state.loaded).toContain('stories-runtime');
    expect(state.loaded).not.toContain('record-ingestion');
    expect(state.loaded).not.toContain('mobile-home-polish');
    expect(state.loaded).not.toContain('person-experience-v17-3');
    expect(state.loaded).not.toContain('family-narrative');
    expect(state.loaded).not.toContain('experience-elevation-v17-4');
    expect(state.loaded).not.toContain('unified-family-experience');
  });

  test('cold Person deep link route-loads biography narrative and elevation enhancements without Home and Tree unification',async({page})=>{
    await open(page,`person/${HAZEL}`);
    await expect(page.locator(`[data-ui-native="person"][data-person-id="${HAZEL}"]`)).toBeVisible();
    await expect(page.locator('#v17-story')).toBeVisible();
    await expect(page.locator('.ui-profile-snapshot')).toBeVisible();
    const state=await snapshot(page,'person');
    expect(state.loaded).toEqual(expect.arrayContaining(['person-experience-v17-3','family-narrative','experience-elevation-v17-4']));
    expect(state.loaded).not.toContain('stories-runtime');
    expect(state.loaded).not.toContain('record-ingestion');
    expect(state.loaded).not.toContain('mobile-home-polish');
    expect(state.loaded).not.toContain('unified-family-experience');
    expect(state.matched).toEqual(['person-experience-v17-3','family-narrative','experience-elevation-v17-4']);
  });

  test('cold Media deep link route-loads family narrative quick filters without unrelated Family enhancers',async({page})=>{
    await open(page,'media');
    await expect(page.locator('.ui-media-quick')).toBeVisible();
    const state=await snapshot(page,'media');
    expect(state.loaded).toContain('family-narrative');
    expect(state.loaded).not.toContain('stories-runtime');
    expect(state.loaded).not.toContain('record-ingestion');
    expect(state.loaded).not.toContain('person-experience-v17-3');
    expect(state.loaded).not.toContain('mobile-home-polish');
    expect(state.loaded).not.toContain('experience-elevation-v17-4');
    expect(state.loaded).not.toContain('unified-family-experience');
    expect(state.matched).toEqual(['family-narrative']);
  });

  test('cold Tree deep link route-loads elevated and unified Tree presentation',async({page})=>{
    await open(page,'tree');
    await expect(page.locator('.tree-context')).toBeVisible();
    await expect(page.locator('.ui-tree-branches')).toBeVisible();
    const state=await snapshot(page,'tree');
    expect(state.loaded).toEqual(expect.arrayContaining(['experience-elevation-v17-4','unified-family-experience']));
    expect(state.loaded).not.toContain('stories-runtime');
    expect(state.loaded).not.toContain('record-ingestion');
    expect(state.loaded).not.toContain('person-experience-v17-3');
    expect(state.loaded).not.toContain('mobile-home-polish');
    expect(state.loaded).not.toContain('family-narrative');
    expect(state.matched).toEqual(['experience-elevation-v17-4','unified-family-experience']);
  });

  test('mobile Dashboard route-loads Home polish narrative elevation and unification after native Home renders',async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await open(page,'dashboard');
    const state=await snapshot(page,'dashboard');
    expect(state.loaded).toEqual(expect.arrayContaining(['mobile-home-polish','family-narrative','experience-elevation-v17-4','unified-family-experience']));
    await expect(page.locator('.ui-mobile-launcher:not(.v22-mobile-discover) .ui-launcher-heading p')).toHaveText('Choose a path into the archive and start exploring.');
  });
});
