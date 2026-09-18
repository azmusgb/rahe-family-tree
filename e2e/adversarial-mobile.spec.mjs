import{test,expect}from'@playwright/test';

test.describe('v23 adversarial mobile shell',()=>{
  test.use({viewport:{width:390,height:844}});

  test('More survives repeated open close without leaked modal state',async({page})=>{
    await page.goto('/#dashboard');
    const summary=page.locator('#family-mobile-dock details.mobile-more > summary');
    await expect(summary).toBeVisible();
    for(let i=0;i<4;i++){
      await summary.click();
      await expect(page.locator('body')).toHaveAttribute('data-mobile-modal-open','more');
      await page.keyboard.press('Escape');
      await expect(page.locator('body')).not.toHaveAttribute('data-mobile-modal-open','more');
      await expect(summary).toBeFocused();
    }
  });

  test('rapid primary navigation settles on the last requested route',async({page})=>{
    await page.goto('/#dashboard');
    await page.evaluate(()=>{
      location.hash='#people';
      location.hash='#families';
      location.hash='#tree';
    });
    await expect.poll(()=>page.evaluate(()=>location.hash)).toBe('#tree');
    await expect(page.locator('.graph-shell,.tree-graph-shell').first()).toBeVisible();
  });

  test('desktop transition clears mobile modal ownership',async({page})=>{
    await page.goto('/#dashboard');
    const summary=page.locator('#family-mobile-dock details.mobile-more > summary');
    await summary.click();
    await expect(page.locator('body')).toHaveAttribute('data-mobile-modal-open','more');
    await page.setViewportSize({width:1100,height:800});
    await expect(page.locator('body')).not.toHaveAttribute('data-mobile-modal-open','more');
  });
});
