import{test,expect}from'@playwright/test';

async function openMobile(page,route='dashboard'){
  await page.goto(`/#${route}`);
  await page.waitForSelector('#family-mobile-dock:not([hidden])');
}

const stateKey='family.mobile.v20.state';

test.describe('mobile v20 app experience',()=>{
  test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

  test('dock reads visually as Home, Families, Tree, People, More with Tree centered',async({page})=>{
    await openMobile(page,'dashboard');
    const selectors=['[data-dock-route="dashboard"]','[data-dock-route="families"]','[data-dock-route="tree"]','[data-dock-route="people"]','details.mobile-more'];
    const centers=[];
    for(const selector of selectors){const box=await page.locator(`#family-mobile-dock > ${selector}`).boundingBox();expect(box).not.toBeNull();centers.push(box.x+box.width/2);}
    expect(centers).toEqual([...centers].sort((a,b)=>a-b));
    const dock=await page.locator('#family-mobile-dock').boundingBox(),tree=await page.locator('#family-mobile-dock > [data-dock-route="tree"]').boundingBox();
    expect(Math.abs((tree.x+tree.width/2)-(dock.x+dock.width/2))).toBeLessThan(16);
  });

  test('Home restores a Continue Exploring card below the hero',async({page})=>{
    await openMobile(page,'dashboard');
    await page.evaluate(({key})=>localStorage.setItem(key,JSON.stringify({recentPeople:[{id:'P-WILLIAM-JOHN-RAHE-III',name:'William John Rahe III',branch:'Rahe',dates:'Family member'}],recentFamilies:[],lastTree:{focus:'P-WILLIAM-JOHN-RAHE-III',scope:'family',depth:'3',href:'/?focus=P-WILLIAM-JOHN-RAHE-III&scope=family&depth=3#tree'},lastRoute:'person'})),{key:stateKey});
    await page.reload();
    await expect(page.locator('.v20-continue-card')).toBeVisible();
    await expect(page.locator('.v20-continue-card')).toContainText('William John Rahe III');
    const order=await page.evaluate(()=>{const hero=document.querySelector('[data-v17-native="home"] .v17-home-hero'),card=document.querySelector('.v20-continue-card');return Boolean(hero&&card&&(hero.compareDocumentPosition(card)&Node.DOCUMENT_POSITION_FOLLOWING));});
    expect(order).toBe(true);
  });

  test('Person becomes a contextual profile with keyboard-operable app tabs',async({page})=>{
    await openMobile(page,'person/P-WILLIAM-JOHN-RAHE-III');
    await page.waitForSelector('[data-v17-native="person"]');
    await expect(page.locator('.v20-context-bar')).toBeVisible();
    await expect(page.locator('.v20-context-bar')).toContainText('William');
    const tabs=page.locator('.v20-person-tabs');await expect(tabs).toBeVisible();
    await expect(tabs.locator('[data-person-tab="story"]')).toHaveAttribute('aria-selected','true');
    await tabs.locator('[data-person-tab="family"]').click();
    await expect(tabs.locator('[data-person-tab="family"]')).toHaveAttribute('aria-selected','true');
    await expect(page.locator('#v17-family')).toBeVisible();
    await expect(page.locator('.v20-person-story')).toBeHidden();
    await tabs.locator('[data-person-tab="family"]').press('ArrowRight');
    await expect(tabs.locator('[data-person-tab="timeline"]')).toHaveAttribute('aria-selected','true');
    await expect(page.locator('#v17-life')).toBeVisible();
  });

  test('People and Families use app discovery surfaces without hiding canonical entries',async({page})=>{
    await openMobile(page,'people');
    await page.waitForSelector('.v17-person-card');
    await expect(page.locator('.v17-people-grid')).toBeVisible();
    await expect(page.locator('button[data-person="P-WILLIAM-JOHN-RAHE-III"]')).toHaveCount(1);
    await page.locator('#family-mobile-dock [data-dock-route="families"]').click();
    await expect(page).toHaveURL(/#families$/);
    await expect(page.locator('.v175-family-grid')).toBeVisible();
    expect(await page.locator('.v175-family-card').count()).toBeGreaterThan(1);
  });

  test('Tree behaves as a full-screen workspace',async({page})=>{
    await openMobile(page,'tree');
    await page.waitForSelector('.graph-shell,.tree-graph-shell');
    await expect(page.locator('body[data-route="tree"] .site-footer')).toBeHidden();
    const graph=await page.locator('.graph-shell,.tree-graph-shell').first().boundingBox();
    expect(graph?.height||0).toBeGreaterThan(500);
    await expect(page.locator('#content')).toHaveClass(/mobile-tree-surface/);
  });

  test('core redesigned routes remain horizontally contained at large-phone width',async({page})=>{
    await page.setViewportSize({width:430,height:932});
    for(const route of ['dashboard','people','families','person/P-WILLIAM-JOHN-RAHE-III','tree']){
      await openMobile(page,route);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      expect(overflow,`${route} horizontal overflow`).toBeLessThanOrEqual(1);
    }
  });
});
