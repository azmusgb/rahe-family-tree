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

  test('keeps C001 source-to-assertion and relationship traceability visible',async({page})=>{
    await openC001(page);
    const matrix=page.locator('[data-platform-v13="source-evidence-matrix"]');
    await expect(matrix).toBeVisible();
    await expect(matrix.getByRole('heading',{name:'What this source is actually being used for'})).toBeVisible();
    await expect(matrix.locator('.section-title span')).toContainText('5 relationships');
    await expect(matrix.locator('.matrix-relations article')).toHaveCount(5);
    await expect(matrix).toContainText('identity-bridge');
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

  test('route changes clear mobile inert state even when the inspector is open',async({page})=>{
    await openC001(page,390,844);
    const open=page.locator('[data-source-inspector-open]');
    await open.click();
    await expect(open).toHaveAttribute('aria-expanded','true');
    expect(await page.locator('.site-header').evaluate(el=>el.inert)).toBe(true);
    expect(await page.locator('.topbar').evaluate(el=>el.inert)).toBe(true);

    await page.locator('#source-panel-summary').getByRole('link',{name:/Full queue/}).click();
    await expect(page).toHaveURL(/#research/);
    await page.waitForFunction(()=>document.body.dataset.routeCapabilityState==='ready');
    await expect.poll(()=>page.locator('.site-header').evaluate(el=>el.inert)).toBe(false);
    await expect.poll(()=>page.locator('.topbar').evaluate(el=>el.inert)).toBe(false);
    await expect.poll(()=>page.locator('#family-mobile-dock').evaluate(el=>el.inert)).toBe(false);
    await expect(page.locator('body')).not.toHaveClass(/source-inspector-modal-open/);
  });

  test('desktop breakpoint fully resets an open mobile inspector before returning to mobile',async({page})=>{
    await openC001(page,390,844);
    const open=page.locator('[data-source-inspector-open]');
    const panel=page.locator('[data-source-inspector-panel]');
    const backdrop=page.locator('[data-source-inspector-backdrop]');
    await open.click();
    await expect(panel).toHaveClass(/is-open/);

    await page.setViewportSize({width:1280,height:900});
    await expect(panel).not.toHaveClass(/is-open/);
    await expect(panel).toHaveAttribute('aria-hidden','false');
    await expect(open).toHaveAttribute('aria-expanded','false');
    await expect(backdrop).toBeHidden();

    await page.setViewportSize({width:390,height:844});
    await expect(panel).not.toHaveClass(/is-open/);
    await expect(panel).toHaveAttribute('aria-hidden','true');
    await expect(open).toHaveAttribute('aria-expanded','false');
    await expect(backdrop).toBeHidden();
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
