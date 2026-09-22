import { test, expect } from '@playwright/test';

async function mockApis(page) {
  await page.route('**/api/media**', async route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, media: [], authenticated: false, canUpload: false, canEdit: false, user: null }) }));
  await page.route('**/api/auth**', async route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, authenticated: false, user: null }) }));
  await page.route('**/api/family-sync**', async route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, authenticated: false }) }));
}

async function expectHeroBeforeSearch(page) {
  const result = await page.evaluate(() => {
    const hero = document.querySelector('[data-v17-native="home"] .family-home-hero, #content .family-home-hero');
    const search = document.querySelector('.route-shell');
    if (!hero || !search) return { ok: false, hero: Boolean(hero), search: Boolean(search) };
    return {
      ok: Boolean(hero.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING),
      hero: true,
      search: true
    };
  });
  expect(result, 'dashboard hero must exist and precede the route search shell').toEqual({ ok: true, hero: true, search: true });
}

test.beforeEach(async ({ page }) => {
  await mockApis(page);
});

test('dashboard hero always precedes search after hydration', async ({ page }) => {
  await page.goto('/#dashboard');
  await expect(page.getByRole('heading', { name: 'Our family, connected.' })).toBeVisible();
  await expectHeroBeforeSearch(page);
});

test('dashboard hero still precedes search after navigating away and back', async ({ page }) => {
  await page.goto('/#people');
  await page.goto('/#dashboard');
  await expect(page.getByRole('heading', { name: 'Our family, connected.' })).toBeVisible();
  await expectHeroBeforeSearch(page);
});

test('mobile dashboard preserves hero-before-search DOM order', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#dashboard');
  await expect(page.getByRole('heading', { name: 'Our family, connected.' })).toBeVisible();
  await expectHeroBeforeSearch(page);
});
