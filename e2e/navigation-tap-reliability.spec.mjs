import { test, expect } from '@playwright/test';

const mobile = { width: 390, height: 844 };

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(100);
}

test.describe('Family Explorer navigation reliability', () => {
  test.use({ viewport: mobile });

  test('accepts consecutive dock navigation attempts', async ({ page }) => {
    await page.goto('/#dashboard');
    await settle(page);

    const routes = ['tree', 'families', 'people', 'dashboard', 'tree'];
    for (const route of routes) {
      await page.locator(`#family-mobile-dock [data-dock-route="${route}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${route}(?:$|/)`));
      await expect(page.locator(`#family-mobile-dock [data-dock-route="${route}"]`)).toHaveAttribute('aria-current', 'page');
    }
  });

  test('More cannot intercept the next dock tap after navigation', async ({ page }) => {
    await page.goto('/#dashboard');
    await settle(page);

    const more = page.locator('#family-mobile-dock .v158-mobile-more');
    await more.locator('summary').click();
    await expect(more).toHaveAttribute('open', '');
    await more.locator('a[href="#stories"]').click();
    await expect(page).toHaveURL(/#stories$/);
    await expect(more).not.toHaveAttribute('open', '');

    await page.locator('#family-mobile-dock [data-dock-route="tree"]').click();
    await expect(page).toHaveURL(/#tree$/);
  });

  test('rapid sequential taps leave the last requested route active', async ({ page }) => {
    await page.goto('/#dashboard');
    await settle(page);

    await page.locator('#family-mobile-dock [data-dock-route="families"]').click();
    await page.locator('#family-mobile-dock [data-dock-route="people"]').click();
    await expect(page).toHaveURL(/#people$/);
    await expect(page.locator('#family-mobile-dock [data-dock-route="people"]')).toHaveAttribute('aria-current', 'page');
  });
});
