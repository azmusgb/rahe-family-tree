import{test,expect}from'@playwright/test';

async function family(page,hash='dashboard'){
  await page.goto(`/#${hash}`);
  await page.waitForSelector('#family-mobile-dock:not([hidden])');
}

test.describe('mobile family experience',()=>{
  test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

  test('More navigation opens as an accessible bottom sheet and closes cleanly',async({page})=>{
    await family(page,'people');
    const more=page.locator('#family-mobile-dock .mobile-more');
    await more.locator('summary').click();
    await expect(more).toHaveAttribute('open','');
    await expect(more.locator(':scope > div')).toHaveAttribute('role','dialog');
    await expect(more.locator(':scope > div')).toHaveAttribute('aria-modal','true');
    await expect(page.locator('body')).toHaveClass(/mobile-sheet-open/);
    await expect(page.locator('.mobile-more-backdrop')).toBeVisible();
    await more.locator('[data-mobile-more-close]').click();
    await expect(more).not.toHaveAttribute('open','');
    await expect(page.locator('body')).not.toHaveClass(/mobile-sheet-open/);
  });

  test('People directory uses progressive disclosure on phones',async({page})=>{
    await family(page,'people');
    await page.waitForSelector('.v17-person-card,.v159-person-card,.person-card');
    const hidden=page.locator('.mobile-progressive-hidden');
    await expect(hidden.first()).toBeAttached();
    const more=page.locator('.mobile-people-more');
    await expect(more).toBeVisible();
    const before=await hidden.count();
    await more.click();
    const after=await page.locator('.mobile-progressive-hidden').count();
    expect(after).toBeLessThan(before);
  });

  test('Tree prioritizes the graph surface and keeps compact controls touchable',async({page})=>{
    await family(page,'tree');
    await expect(page.locator('#content')).toHaveClass(/mobile-tree-surface/);
    const graph=page.locator('.graph-shell,.tree-graph-shell').first();
    await expect(graph).toBeVisible();
    const box=await graph.boundingBox();
    expect(box?.height||0).toBeGreaterThan(400);
    const toolbar=page.locator('.v161-tree-toolbar');
    await expect(toolbar).toBeVisible();
    const buttons=toolbar.locator('button');
    for(let i=0;i<await buttons.count();i++){
      const b=await buttons.nth(i).boundingBox();
      expect(b?.height||0).toBeGreaterThanOrEqual(40);
    }
  });

  test('Mobile shell has no horizontal document overflow',async({page})=>{
    for(const route of ['dashboard','people','tree','research']){
      await family(page,route);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    }
  });
});
