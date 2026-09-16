import{test,expect}from'@playwright/test';

async function open(page,route='dashboard'){
  await page.goto(`/#${route}`);
  await page.waitForFunction(()=>Boolean(globalThis.__familyRouteCapabilityRuntime));
  await page.waitForFunction(()=>document.body.dataset.routeCapabilityState==='ready');
}

async function snapshot(page,route){
  return page.evaluate(key=>globalThis.__familyRouteCapabilityRuntime.snapshot(key),route);
}

test.describe('v20.2 route-level capability loading',()=>{
  test('dashboard registers Stories and ingestion without loading either capability',async({page})=>{
    await open(page,'dashboard');
    const state=await snapshot(page,'dashboard');
    expect(state.registered).toEqual(expect.arrayContaining(['stories-runtime','record-ingestion']));
    expect(state.loaded).not.toContain('stories-runtime');
    expect(state.loaded).not.toContain('record-ingestion');
    expect(state.matched).toEqual([]);
  });

  test('Stories loads on its route without pulling in research ingestion',async({page})=>{
    await open(page,'dashboard');
    await page.evaluate(()=>{location.hash='#stories';});
    await page.waitForSelector('.v16-stories');
    await page.waitForFunction(()=>document.body.dataset.routeCapabilityState==='ready');
    const state=await snapshot(page,'stories');
    expect(state.loaded).toContain('stories-runtime');
    expect(state.loaded).not.toContain('record-ingestion');
    expect(state.matched).toEqual(['stories-runtime']);
    await expect(page.locator('#stories-title')).toHaveText('Stories from the family record');
  });

  test('Research loads record ingestion without pulling in Stories',async({page})=>{
    await open(page,'dashboard');
    await page.evaluate(()=>{location.hash='#research';});
    await page.waitForSelector('[data-record-ingestion]');
    await page.waitForFunction(()=>document.body.dataset.routeCapabilityState==='ready');
    const state=await snapshot(page,'research');
    expect(state.loaded).toContain('record-ingestion');
    expect(state.loaded).not.toContain('stories-runtime');
    expect(state.matched).toEqual(['record-ingestion']);
    await expect(page.locator('[data-record-ingestion]')).toContainText('Evidence intake workbench');
  });

  test('cold deep link loads the Stories capability before the Stories surface is required',async({page})=>{
    await open(page,'stories');
    await expect(page.locator('.v16-stories')).toBeVisible();
    const state=await snapshot(page,'stories');
    expect(state.loaded).toContain('stories-runtime');
    expect(state.loaded).not.toContain('record-ingestion');
  });
});
