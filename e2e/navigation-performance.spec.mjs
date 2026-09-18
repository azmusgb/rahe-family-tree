import{test,expect}from'@playwright/test';

const mobile={width:390,height:844};

test.describe('v23 navigation and performance contracts',()=>{
  test.use({viewport:mobile});

  test('same-route person navigation preserves detail-aware Back identity',async({page})=>{
    await page.goto('/#people');
    await page.waitForLoadState('domcontentloaded');
    const people=page.locator('a[href^="#person/"]:visible');
    if(await people.count()<2)test.skip(true,'fixture does not expose two person links');
    await people.nth(0).click();
    const firstHash=await page.evaluate(()=>location.hash);
    await page.goto('/#people');
    const secondPeople=page.locator('a[href^="#person/"]:visible');
    await secondPeople.nth(1).click();
    const secondHash=await page.evaluate(()=>location.hash);
    expect(secondHash).not.toBe(firstHash);
    // Recreate the same-route transition without relying on browser history.
    await page.evaluate(hash=>{location.hash=hash;},firstHash);
    await page.evaluate(hash=>{location.hash=hash;},secondHash);
    await page.locator('[data-mobile-smart-back]:visible').click();
    await expect.poll(()=>page.evaluate(()=>location.hash)).toBe(firstHash);
  });

  test('tree emits measurable interactive telemetry without blocking canvas',async({page})=>{
    await page.addInitScript(()=>{
      window.__familyPerf=[];
      window.addEventListener('family-performance',event=>window.__familyPerf.push(event.detail));
    });
    await page.goto('/#tree');
    const graph=page.locator('.graph-shell,.tree-graph-shell').first();
    await expect(graph).toBeVisible();
    await expect.poll(async()=>page.evaluate(()=>window.__familyPerf.some(item=>item.name==='tree:interactive'))).toBe(true);
    const event=await page.evaluate(()=>window.__familyPerf.find(item=>item.name==='tree:interactive'));
    expect(event.svgNodes).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(event)).not.toContain('sourceId');
  });
});
