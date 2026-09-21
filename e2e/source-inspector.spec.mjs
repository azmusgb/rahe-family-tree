import{test,expect}from'@playwright/test';

async function openC001(page,width=1280,height=900){
  await page.setViewportSize({width,height});
  await page.goto('/#source/C001');
  await page.waitForFunction(()=>document.body.dataset.routeCapabilityState==='ready');
  await expect(page.locator('[data-source-inspector="C001"]')).toBeVisible();
}

test.describe('C001 source evidence inspector',()=>{
  test('renders canonical claim boundaries and real acquisition targets',async({page})=>{
    await openC001(page);
    const root=page.locator('[data-source-inspector="C001"]');
    await expect(root).toContainText('CL-DV-001');
    await expect(root).toContainText('CL-DV-002');
    await expect(root).toContainText('William J. Rahe SS-5 + Numident');
    await expect(root).toContainText('Cook County birth record');
    await expect(root).toContainText('Original St. Anne 1918 register entry');
    await expect(root).not.toContainText('CL-EXT-');
    await expect(root).not.toContainText('Folio 148');
    await expect(root).not.toContainText('SHA-256');
    await expect(root).toContainText('Scan asset not ingested');
  });

  test('field selection updates one linkage state engine',async({page})=>{
    await openC001(page);
    const parent=page.locator('[data-source-field="parents"]').first();
    await parent.click();
    await expect(parent).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('[data-active-field-value]').first()).toHaveText('Ellery DeVine + Sarah Ferry');
    await expect(page.locator('[data-active-field-notsupports]').first()).toContainText('CL-DV-002');
  });

  test('mobile inspector is closed by default and returns focus on Escape',async({page})=>{
    await openC001(page,390,844);
    const open=page.locator('[data-source-inspector-open]');
    const panel=page.locator('[data-source-inspector-panel]');
    await expect(open).toHaveAttribute('aria-expanded','false');
    await expect(panel).toHaveAttribute('aria-hidden','true');
    await open.focus();
    await open.click();
    await expect(open).toHaveAttribute('aria-expanded','true');
    await expect(panel).toHaveAttribute('role','dialog');
    await expect(panel).toHaveAttribute('aria-modal','true');
    await page.keyboard.press('Escape');
    await expect(open).toHaveAttribute('aria-expanded','false');
    await expect(open).toBeFocused();
  });

  test('tabs support arrow, Home, and End keyboard navigation',async({page})=>{
    await openC001(page);
    const summary=page.locator('#source-tab-summary');
    const claims=page.locator('#source-tab-claims');
    const fields=page.locator('#source-tab-fields');
    await summary.focus();
    await page.keyboard.press('ArrowRight');
    await expect(claims).toBeFocused();
    await expect(claims).toHaveAttribute('aria-selected','true');
    await page.keyboard.press('End');
    await expect(fields).toBeFocused();
    await page.keyboard.press('Home');
    await expect(summary).toBeFocused();
  });

  test('source route loads the source inspector capability',async({page})=>{
    await openC001(page);
    const state=await page.evaluate(()=>globalThis.__familyRouteCapabilityRuntime.snapshot('source'));
    expect(state.loaded).toContain('source-inspector');
    expect(state.matched).toContain('source-inspector');
  });
});
