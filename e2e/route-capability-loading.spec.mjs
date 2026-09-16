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
    expect(state.registered).toEqual(expect.arrayContaining(['stories-runtime','record-ingestion','person-experience-v17-3','mobile-home-polish','family-narrative']));
    expect(state.loaded).toEqual(expect.arrayContaining(['mobile-home-polish','family-narrative']));
    expect(state.loaded).not.toContain('stories-runtime');
    expect(state.loaded).not.toContain('record-ingestion');
    expect(state.loaded).not.toContain('person-experience-v17-3');
    expect(state.matched).toEqual(['mobile-home-polish','family-narrative']);
  });

  test('Stories loads its route capability without pulling in research or Person capabilities',async({page})=>{
    await open(page,'dashboard');
    await page.evaluate(()=>{location.hash='#stories';});
    await page.waitForSelector('.v16-stories');
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
    await expect(page.locator('.v16-stories')).toBeVisible();
    const state=await snapshot(page,'stories');
    expect(state.loaded).toContain('stories-runtime');
    expect(state.loaded).not.toContain('record-ingestion');
    expect(state.loaded).not.toContain('mobile-home-polish');
    expect(state.loaded).not.toContain('person-experience-v17-3');
    expect(state.loaded).not.toContain('family-narrative');
  });

  test('cold Person deep link route-loads biography and family narrative enhancements',async({page})=>{
    await open(page,`person/${HAZEL}`);
    await expect(page.locator(`[data-v17-native="person"][data-person-id="${HAZEL}"]`)).toBeVisible();
    await expect(page.locator('#v17-story')).toBeVisible();
    const state=await snapshot(page,'person');
    expect(state.loaded).toEqual(expect.arrayContaining(['person-experience-v17-3','family-narrative']));
    expect(state.loaded).not.toContain('stories-runtime');
    expect(state.loaded).not.toContain('record-ingestion');
    expect(state.loaded).not.toContain('mobile-home-polish');
    expect(state.matched).toEqual(['person-experience-v17-3','family-narrative']);
  });

  test('cold Media deep link route-loads family narrative quick filters',async({page})=>{
    await open(page,'media');
    await expect(page.locator('.v162-media-quick')).toBeVisible();
    const state=await snapshot(page,'media');
    expect(state.loaded).toContain('family-narrative');
    expect(state.loaded).not.toContain('stories-runtime');
    expect(state.loaded).not.toContain('record-ingestion');
    expect(state.loaded).not.toContain('person-experience-v17-3');
    expect(state.loaded).not.toContain('mobile-home-polish');
    expect(state.matched).toEqual(['family-narrative']);
  });

  test('mobile Dashboard route-loads Home polish and family narrative after native Home renders',async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await open(page,'dashboard');
    const state=await snapshot(page,'dashboard');
    expect(state.loaded).toEqual(expect.arrayContaining(['mobile-home-polish','family-narrative']));
    await expect(page.locator('.v21-launcher-heading p')).toHaveText('Choose a path into the archive and start exploring.');
  });
});
