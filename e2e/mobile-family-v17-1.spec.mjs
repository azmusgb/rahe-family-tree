import{test,expect}from'@playwright/test';

async function mockApis(page){
  await page.route('**/api/media**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})}));
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

async function expectNoHorizontalOverflow(page){
  const overflow=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
  expect(overflow.scrollWidth,'document should not be wider than the mobile viewport').toBeLessThanOrEqual(overflow.clientWidth+1);
}

async function expectMinTarget(locator,min=44){
  const box=await locator.boundingBox();
  expect(box,'interactive target should have a bounding box').not.toBeNull();
  expect(Math.min(box.width,box.height),'interactive target should meet the mobile touch floor').toBeGreaterThanOrEqual(min);
}

test.beforeEach(async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-chromium','v17.1 mobile Family contract');
  await mockApis(page);
});

test('People is a compact mobile family directory with readable rows and no overflow',async({page})=>{
  await page.goto('/#people');
  const people=page.locator('[data-v17-native="people"]');
  await expect(people).toBeVisible();
  const cards=people.locator('.v17-person-card');
  expect(await cards.count()).toBeGreaterThan(12);

  const firstButton=cards.first().locator('button[data-person]');
  await expect(firstButton).toBeVisible();
  await expectMinTarget(firstButton);
  await expectMinTarget(people.locator('.v17-branch-chip').first());

  await cards.first().scrollIntoViewIfNeeded();
  const visibleRows=await cards.evaluateAll(nodes=>nodes.filter(node=>{
    const rect=node.getBoundingClientRect();
    return rect.bottom>0&&rect.top<window.innerHeight;
  }).length);
  expect(visibleRows,'ordinary phone viewport should expose at least four useful directory entries').toBeGreaterThanOrEqual(4);

  const minimumText=await cards.first().locator('.v17-person-card-copy > small,.v17-person-card-copy > b,.v17-person-card-copy > em,.v17-person-card-copy > p').evaluateAll(nodes=>Math.min(...nodes.map(node=>parseFloat(getComputedStyle(node).fontSize))));
  expect(minimumText,'ordinary Family directory text should not fall below 11px').toBeGreaterThanOrEqual(11);

  const cardsInsideViewport=await cards.evaluateAll(nodes=>nodes.slice(0,8).every(node=>{
    const rect=node.getBoundingClientRect();
    return rect.left>=-1&&rect.right<=window.innerWidth+1;
  }));
  expect(cardsInsideViewport,'directory cards should stay inside the viewport').toBeTruthy();
  await expect(people).not.toContainText(/identity inventory|inventory scope|graph node|visible items/i);
  await expectNoHorizontalOverflow(page);
});

test('Photos opens content-first with quick type choices and advanced filters disclosed on demand',async({page})=>{
  await page.goto('/#media');
  const media=page.locator('[data-media-page]');
  await expect(media).toBeVisible();
  await expect(page.locator('.media-page-hero')).toHaveCount(0);
  await expect(page.locator('.media-library-metrics')).toBeHidden();

  const quick=page.locator('.v162-media-quick');
  await expect(quick).toBeVisible();
  for(const label of['All','Photos','Documents']){
    const button=quick.getByRole('button',{name:label,exact:true});
    await expect(button).toBeVisible();
    await expectMinTarget(button);
  }

  const disclosure=page.locator('.v161-media-filters');
  await expect(disclosure).toBeVisible();
  await expect(disclosure).not.toHaveAttribute('open','');
  await expectMinTarget(disclosure.locator('summary'));
  await disclosure.locator('summary').click();
  await expect(page.locator('.media-library-controls')).toBeVisible();

  const gallery=page.locator('#media-library');
  await expect(gallery).toHaveAttribute('aria-busy','false');
  await expect(gallery).toContainText('No media matches these filters');
  const privacy=page.locator('#media-library-note');
  await expect(privacy).toContainText('Public-safe view');
  await expect(privacy).toContainText('excluded server-side');
  await expectNoHorizontalOverflow(page);
});

test('mobile dock, footer, and safe-area composition stay Family-facing',async({page})=>{
  await page.goto('/#dashboard');
  const dock=page.locator('#family-mobile-dock');
  await expect(dock).toBeVisible();

  const primaryControls=dock.locator(':scope > a, :scope > button, :scope > details > summary');
  expect(await primaryControls.count()).toBe(5);
  for(const control of await primaryControls.all()){
    await expect(control).toBeVisible();
    await expectMinTarget(control);
  }

  const more=dock.locator('.v158-mobile-more');
  await more.locator('summary').click();
  await expect(more).toHaveAttribute('open','');
  const secondaryControls=more.locator('div > a, div > button');
  expect(await secondaryControls.count()).toBeGreaterThan(3);
  for(const control of await secondaryControls.all()){
    await expect(control).toBeVisible();
    await expectMinTarget(control);
  }

  const footer=page.locator('.footer');
  await expect(footer).toContainText('Family history backed by source-controlled research');
  await expect(footer).not.toContainText(/commit|sha|build timestamp|graph nodes|graph edges|platform metrics/i);
  await expectNoHorizontalOverflow(page);
});
