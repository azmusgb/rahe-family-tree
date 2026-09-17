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
    const panel=more.locator(':scope > div');
    await expect(panel).toHaveAttribute('role','dialog');
    await expect(panel).toHaveAttribute('aria-modal','true');
    await more.locator('summary').click();
    await expect(more).toHaveAttribute('open','');
    await expect(page.locator('body')).toHaveClass(/mobile-sheet-open/);
    await expect(page.locator('.mobile-more-backdrop')).toBeVisible();
    await more.locator('[data-mobile-more-close]').click();
    await expect(more).not.toHaveAttribute('open','');
    await expect(page.locator('body')).not.toHaveClass(/mobile-sheet-open/);
  });

  test('More navigation adapts to the active family context',async({page})=>{
    await family(page,'people');
    const section=page.locator('[data-v22-context-actions]');
    await expect(section).toBeAttached();
    await expect(section.getByRole('link',{name:'Families'})).toHaveAttribute('href','#families');
    await expect(section.getByRole('link',{name:'Tree'})).toHaveAttribute('href','#tree');
    await expect(section.getByRole('link',{name:'Photos'})).toHaveAttribute('href','#media');

    await page.goto('/#research');
    await expect(section.getByRole('link',{name:'Evidence'})).toHaveAttribute('href','#evidence');
    await expect(section.getByRole('link',{name:'Sources'})).toHaveAttribute('href','#sources');
    await expect(section.getByRole('link',{name:'Family home'})).toHaveAttribute('href','#dashboard');
  });

  test('People keeps every matching person reachable while search stays sticky',async({page})=>{
    await family(page,'people');
    await page.waitForSelector('.v17-person-card,.v159-person-card,.person-card');
    const william=page.locator('button[data-person="P-WILLIAM-JOHN-RAHE-III"]');
    await expect(william).toHaveCount(1);
    await expect(william).toBeVisible();
    await expect(page.locator('.route-shell')).toHaveCSS('position','sticky');
    await expect(page.locator('.mobile-progressive-hidden')).toHaveCount(0);
  });

  test('Person uses one primary section navigator on phones',async({page})=>{
    await family(page,'person/P-WILLIAM-JOHN-RAHE-III');
    const person=page.locator('[data-v17-native="person"]');
    await expect(person).toHaveAttribute('data-v22-person-flow','compact');
    const tabs=person.locator('.v20-person-tabs');
    await expect(tabs).toBeVisible();
    await expect(tabs).toHaveAttribute('data-v22-primary-person-nav','true');
    await expect(tabs).toHaveAttribute('aria-label','Person sections');
    await expect(person.locator('.v17-person-nav')).toBeHidden();
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

  test('Tree focus mode removes secondary chrome and restores it on exit',async({page})=>{
    await family(page,'tree');
    const focus=page.locator('[data-v22-tree-focus]');
    const content=page.locator('#content');
    const graph=page.locator('.graph-shell,.tree-graph-shell').first();
    await expect(focus).toBeVisible();
    await expect(focus).toHaveAttribute('aria-pressed','false');
    await focus.click();
    await expect(content).toHaveAttribute('data-v22-tree-focus','true');
    await expect(page.locator('body')).toHaveAttribute('data-v22-tree-focus','true');
    await expect(focus).toHaveAttribute('aria-pressed','true');
    await expect(graph).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(content).not.toHaveAttribute('data-v22-tree-focus','true');
    await expect(page.locator('body')).not.toHaveAttribute('data-v22-tree-focus','true');
    await expect(focus).toHaveAttribute('aria-pressed','false');
    await expect(focus).toBeFocused();
  });

  test('Changed mobile directory and tree surfaces do not create document overflow',async({page})=>{
    for(const route of ['people','tree']){
      await family(page,route);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      expect(overflow,`${route} overflow`).toBeLessThanOrEqual(1);
    }
  });
});
