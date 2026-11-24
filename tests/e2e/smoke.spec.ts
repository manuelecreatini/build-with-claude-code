import { expect, test } from '@playwright/test';

test('English homepage renders', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Build with Claude Code/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('Italian phase page renders with sidebar', async ({ page }) => {
  await page.goto('/it/phases/f0-setup/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // Starlight's <nav class="sidebar"> is display:contents, so assert on the current-page link instead.
  await expect(page.locator('#starlight__sidebar a[aria-current="page"]')).toBeVisible();
});

test('language switcher pairs pages', async ({ page }) => {
  await page.goto('/phases/f0-setup/');
  const select = page.locator('starlight-lang-select select').first();
  await expect(select.locator('option[value*="/it/phases/f0-setup"]')).toHaveCount(1);
});

test('F0 install section has OS tabs in both locales', async ({ page }) => {
  for (const url of ['/phases/f0-setup/', '/it/phases/f0-setup/']) {
    await page.goto(url);
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveText(['Windows', 'macOS', 'Linux']);
    await tabs.nth(1).click();
    await expect(page.getByText('brew install --cask visual-studio-code')).toBeVisible();
  }
});

test('splash homepages link to the start page in each locale', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero a[href="/start/how-to-use/"]')).toBeVisible();
  await page.goto('/it/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await expect(page.locator('.hero a[href="/it/start/how-to-use/"]')).toBeVisible();
});
