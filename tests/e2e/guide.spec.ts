import { expect, test, type Locator } from '@playwright/test';

const F0 = '/phases/f0-setup/';

/** The visible card (a label) around one radio option of the customize panel. */
const option = (panel: Locator, axis: string, value: string) =>
  panel.locator('label.bcc-option', { has: panel.page().locator(`input[data-axis="${axis}"][value="${value}"]`) });

test('the Terminal / Desktop switch swaps the steps and survives a reload', async ({ page }) => {
  await page.goto(F0);
  const terminal = page.locator('.bcc-only[data-only-surface="terminal"]').first();
  const desktop = page.locator('.bcc-only[data-only-surface="desktop"]').first();
  await expect(terminal).toBeVisible();
  await expect(desktop).toBeHidden();

  await page.locator('header [data-set-surface="desktop"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-surface', 'desktop');
  await expect(desktop).toBeVisible();
  await expect(terminal).toBeHidden();
  await expect(page.locator('header [data-set-surface="desktop"]')).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-surface', 'desktop');
  await expect(desktop).toBeVisible();
  // The choice is shared across languages.
  await page.goto('/it' + F0);
  await expect(page.locator('.bcc-only[data-only-surface="desktop"]').first()).toBeVisible();
});

test('the customize panel shows pros, cons and a recommended option, and its choices apply at once', async ({ page }) => {
  await page.goto(F0);
  const hardened = page.locator('.bcc-only[data-only-security="hardened"]').first();
  await expect(hardened).toBeHidden();

  await page.locator('header [data-open-guide]').click();
  const panel = page.locator('#bcc-guide-panel');
  await expect(panel).toBeVisible();
  await expect(panel.locator('.bcc-badge').first()).toHaveText('Recommended');
  await expect(panel.locator('.bcc-pc__list--pro li').first()).toBeVisible();
  await expect(panel.locator('.bcc-pc__list--con li').first()).toBeVisible();

  await option(panel, 'security', 'hardened').click();
  await expect(panel.locator('input[data-axis="security"][value="hardened"]')).toBeChecked();
  await panel.getByRole('button', { name: 'Close' }).last().click();
  await expect(panel).toBeHidden();
  await expect(hardened).toBeVisible();
  await expect(page.locator('header [data-custom-dot]')).toBeVisible();

  // Expert hides the teaching blocks.
  await page.locator('header [data-open-guide]').click();
  await option(panel, 'level', 'expert').click();
  await expect(panel.locator('input[data-axis="level"][value="expert"]')).toBeChecked();
  await page.keyboard.press('Escape');
  await expect(page.locator('.bcc-why').first()).toBeHidden();

  // Reset brings everything back to the recommended set.
  await page.locator('header [data-open-guide]').click();
  await panel.locator('[data-reset-guide]').click();
  await page.keyboard.press('Escape');
  await expect(hardened).toBeHidden();
  await expect(page.locator('.bcc-why').first()).toBeVisible();
  await expect(page.locator('header [data-custom-dot]')).toBeHidden();
});

test('a tool choice can be switched in the page and shows the alternative when skipped', async ({ page }) => {
  await page.goto(F0);
  const card = page.locator('[data-tool-choice="github"]');
  const instead = card.locator('.bcc-tc__instead');
  await expect(card).toBeVisible();
  await expect(instead).toBeHidden();
  await card.locator('[data-choose-tool="github"][data-on="false"]').click();
  await expect(instead).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-tool-github', 'off');
});

test('turning on AI features in the customize panel shows their steps', async ({ page }) => {
  await page.goto('/phases/f7-deploy/');
  const block = page.locator('.bcc-only[data-only-tool="ai"]');
  await expect(block).toBeHidden();
  await page.locator('header [data-open-guide]').click();
  const panel = page.locator('#bcc-guide-panel');
  await panel.locator('label.bcc-option', { has: page.locator('input[data-tool="ai"][value="on"]') }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('data-tool-ai', 'on');
  await expect(block).toBeVisible();
  await expect(block).toContainText('NEXT_PUBLIC_');
});

test('without JavaScript the recommended steps show', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(F0);
  await expect(page.locator('.bcc-only[data-only-surface="terminal"]').first()).toBeVisible();
  await expect(page.locator('.bcc-only[data-only-surface="desktop"]').first()).toBeHidden();
  await context.close();
});
