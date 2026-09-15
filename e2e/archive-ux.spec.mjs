import {test,expect} from '@playwright/test';

async function mockApis(page){
  await page.route('**/api/media**',route=>route.fulfill({json:{ok:true,media:[],authenticated:false,canUpload:false,canEdit:false}}));
  await page.route('**/api/auth**',route=>route.fulfill({json:{ok:true,authenticated:false,user:null}}));
  await page.route('**/api/family-sync**',route=>route.fulfill({json:{ok:true,authenticated:false}}));
}
test.beforeEach(async({page})=>{await mockApis(page);});

test('Home offers a short branch preview without losing destinations',async({page})=>{
  await page.goto('/#dashboard');
  const branches=page.locator('.v172-home-branches');
  await expect(branches).toBeVisible();
  await expect(branches.locator(':scope > .v172-branch-grid > a')).toHaveCount(6);
  const more=branches.locator('.home-branch-disclosure');
  const all=await branches.locator('.v172-branch-card').count();
  expect(all).toBeGreaterThan(6);
  await expect(more.locator('.v172-branch-grid')).toBeHidden();
  await more.locator('summary').click();
  await expect(more.locator('.v172-branch-grid')).toBeVisible();
  await expect(more.locator('a').last()).toHaveAttribute('href',/#branch\//);
  await more.locator('summary').click();
  await expect(more.locator('.v172-branch-grid')).toBeHidden();
});

test('Home uses legible inverse text and a distinct primary action',async({page},info)=>{
  await page.goto('/#dashboard');
  const hero=page.locator('.v17-home-hero');
  await expect(hero).toBeVisible();
  await expect(hero.locator('p:not(.eyebrow)')).toHaveCSS('color','rgb(237, 244, 239)');
  await expect(hero.locator('.eyebrow')).toHaveCSS('color','rgb(220, 194, 142)');
  await expect(hero.locator('.action.primary')).toHaveCSS('background-color','rgb(255, 248, 233)');
  await page.screenshot({path:info.outputPath('home.png'),fullPage:true});
});

test('slash opens visible search from Home and maintains neutral branding after navigation',async({page})=>{
  await page.goto('/#dashboard');
  await expect(page.locator('.v17-home-hero')).toBeVisible();
  await page.keyboard.press('/');
  await expect(page).toHaveURL(/#people$/);
  await expect(page.locator('#search')).toBeFocused();
  await page.locator('#search').fill('Hazel Berg');
  const hit=page.locator('#search-v13-2-results [data-person]').filter({hasText:'Hazel'}).first();
  await expect(hit).toBeVisible();
  await hit.click();
  await expect(page).toHaveURL(/#person\//);
  await expect(page.locator('.brand')).toContainText('FAMILY HISTORY');
  await expect(page.locator('.brand .monogram')).toHaveText('F');
  await expect(page.locator('#v17-photos .person-media-section')).toHaveCount(1);
  await expect(page.locator('.person-media-section')).toHaveCount(1);
  await expect(page.locator('[data-v17-person-gallery]')).toHaveCount(0);
});

test('mobile More disables the background and restores focus and interaction',async({page},info)=>{
  test.skip(info.project.name!=='mobile-chromium');
  await page.goto('/#people');
  const more=page.locator('#family-mobile-dock .mobile-more');
  const summary=more.locator('summary');
  await summary.click();
  const close=more.getByRole('button',{name:'Close menu',exact:true});
  await expect(close).toBeFocused();
  await expect(page.locator('#family-mobile-dock > a').first()).toHaveJSProperty('inert',true);
  await expect.poll(()=>page.locator('main').evaluate(el=>Boolean(el.closest('[inert]')))).toBe(true);
  await close.press('Shift+Tab');
  await expect(more.getByRole('link',{name:'Research',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(summary).toBeFocused();
  await expect(page.locator('#family-mobile-dock > a').first()).toHaveJSProperty('inert',false);
  await summary.click();
  await more.getByRole('button',{name:'Search',exact:true}).click();
  await expect(page.locator('#search')).toBeFocused();
  await expect(page.locator('body')).not.toHaveClass(/mobile-sheet-open/);
});

for(const route of ['people','families','branch/Berg','person/P-HAZEL-EMMA-BERG-DENNEWITZ','tree','media','stories','timeline','migration','research','evidence','sources','archive']){
  test(`archive route remains usable: ${route}`,async({page},info)=>{
    await page.goto(`/#${route}`);
    await expect(page.locator('#content')).not.toBeEmpty();
    await expect(page.locator('#status')).not.toContainText('Loading family data');
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({path:info.outputPath(`${route.replaceAll('/','-')}.png`),fullPage:false});
  });
}
