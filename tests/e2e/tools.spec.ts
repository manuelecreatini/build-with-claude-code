import { expect, test, type Page } from '@playwright/test';

/** client:visible islands: scroll the tool into view and wait until Astro drops the `ssr` attribute. */
async function hydrated(page: Page, cls: string) {
  await page.locator(`.${cls}`).scrollIntoViewIfNeeded();
  await expect(page.locator(`astro-island:has(.${cls})`)).not.toHaveAttribute('ssr', /.*/);
  return page.locator(`.${cls}`);
}

test('tools overview links to every tool in both locales', async ({ page }) => {
  await page.goto('/tools/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Interactive tools');
  for (const slug of ['start-wizard', 'tracker', 'template-builder', 'build-loop', 'context-meter', 'coach']) {
    await expect(page.locator(`.sl-link-card a[href="/tools/${slug}/"]`)).toBeVisible();
  }
  await page.goto('/it/tools/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Strumenti interattivi');
  await expect(page.locator('.sl-link-card a[href="/it/tools/tracker/"]')).toBeVisible();
});

test('wizard builds a plan, remembers it and sets the OS tab', async ({ page }) => {
  await page.goto('/tools/start-wizard/');
  const wizard = await hydrated(page, 'bcc-wizard');
  await wizard.getByLabel('Product name').fill('Acme');
  await wizard.getByRole('button', { name: 'Next' }).click();
  // The type is required.
  await wizard.getByRole('button', { name: 'Next' }).click();
  await expect(wizard.getByRole('alert')).toHaveText('Choose one option to continue.');
  await wizard.getByRole('radio', { name: /Web app or SaaS MVP/ }).check();
  await wizard.getByRole('checkbox', { name: 'AI features' }).check();
  await wizard.getByRole('button', { name: 'Next' }).click();
  await wizard.getByRole('radio', { name: 'macOS' }).check();
  await wizard.getByRole('button', { name: 'Next' }).click();
  await expect(wizard.getByRole('heading', { name: 'Your starting plan' })).toBeVisible();
  await expect(wizard).toContainText('20–35');
  expect(await page.evaluate(() => localStorage.getItem('starlight-synced-tabs__os'))).toBe('macOS');

  await page.reload();
  const again = await hydrated(page, 'bcc-wizard');
  await expect(again.getByRole('heading', { name: 'Your starting plan' })).toBeVisible();
  await expect(again).toContainText('Acme');
});

test('tracker ticks persist across reloads and locales', async ({ page }) => {
  await page.goto('/tools/tracker/');
  const tracker = await hydrated(page, 'bcc-tracker');
  const first = tracker.locator('details.bcc-phase').first();
  await first.locator('summary').click();
  const box = first.getByRole('checkbox').first();
  await box.check();
  await page.reload();
  const reloaded = await hydrated(page, 'bcc-tracker');
  await reloaded.locator('details.bcc-phase').first().locator('summary').click();
  await expect(reloaded.locator('details.bcc-phase').first().getByRole('checkbox').first()).toBeChecked();

  // Item ids are shared, so the Italian tracker shows the same tick.
  await page.goto('/it/tools/tracker/');
  const it_ = await hydrated(page, 'bcc-tracker');
  await it_.locator('details.bcc-phase').first().locator('summary').click();
  await expect(it_.locator('details.bcc-phase').first().getByRole('checkbox').first()).toBeChecked();
});

test('template builder fills a placeholder in the result', async ({ page }) => {
  await page.goto('/tools/template-builder/?t=t0-1');
  const tpl = await hydrated(page, 'bcc-tpl');
  const out = tpl.locator('.bcc-tpl__out');
  await expect(out.locator('mark').first()).toBeVisible();
  const field = tpl.locator('.bcc-field-group > label').first();
  const placeholder = `<${await field.locator('span').textContent()}>`;
  await expect(out.locator('mark', { hasText: placeholder }).first()).toBeVisible();
  await field.locator('input, textarea').fill('Zebra Unicorn');
  await expect(out).toContainText('Zebra Unicorn');
  await expect(out.locator('mark', { hasText: placeholder })).toHaveCount(0);
});

test('build loop is blocked at gate G5 until it is ticked', async ({ page }) => {
  await page.goto('/tools/build-loop/');
  const loop = await hydrated(page, 'bcc-loop');
  const advance = loop.getByRole('button', { name: 'Mark done and continue' });
  await advance.click(); // step 0 (preflight) → step 1
  await expect(advance).toBeDisabled();
  await expect(loop).toContainText('Tick the gate to continue');
  await loop.getByRole('checkbox', { name: /gate G5/ }).check();
  await expect(advance).toBeEnabled();
  await advance.click();
  await expect(loop.locator('[aria-current="step"]')).toContainText('2');
});

test('context meter shows the zone for the tokens entered', async ({ page }) => {
  await page.goto('/tools/context-meter/');
  const ctx = await hydrated(page, 'bcc-ctx');
  await expect(ctx).toHaveAttribute('data-zone', '0');
  await ctx.locator('.bcc-ctx__number').fill('160000');
  await expect(ctx).toHaveAttribute('data-zone', '2');
  await expect(ctx).toContainText('80% of a 200,000-token budget');
  await expect(ctx.locator('.bcc-zone--2')).toHaveAttribute('aria-current', 'true');
});
