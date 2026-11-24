import { expect, test } from '@playwright/test';

test('English homepage renders', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Build with Claude Code · An interactive playbook');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('title')).toHaveCount(1);
});

test('Italian homepage has its own title', async ({ page }) => {
  await page.goto('/it/');
  await expect(page).toHaveTitle('Build with Claude Code · Un playbook interattivo');
  await expect(page.locator('title')).toHaveCount(1);
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

test('glossary terms show their definition on focus and link to the entry', async ({ page }) => {
  await page.goto('/phases/f5/step-1/');
  const term = page.locator('.bcc-term').filter({ hasText: 'plan mode' }).first();
  const tip = term.locator('[role="tooltip"]');
  await expect(tip).toBeHidden();
  await term.locator('a').focus();
  await expect(tip).toBeVisible();
  await expect(tip).toContainText('Plan mode');
  await term.locator('a').click();
  await expect(page).toHaveURL(/\/reference\/glossary\/#plan-mode$/);
  await expect(page.locator('dfn#plan-mode')).toBeVisible();
});

test('end-of-phase quiz gives feedback and a score', async ({ page }) => {
  await page.goto('/it/phases/f1-preliminary-spec/');
  const quiz = page.locator('.bcc-quiz');
  await quiz.scrollIntoViewIfNeeded();
  // client:visible: wait until Astro has hydrated the island (it drops the `ssr` attribute).
  await expect(page.locator('astro-island:has(.bcc-quiz)')).not.toHaveAttribute('ssr', /.*/);
  await expect(quiz.getByRole('heading', { name: 'Mettiti alla prova' })).toBeVisible();
  const questions = quiz.locator('fieldset');
  await expect(questions).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await questions.nth(i).getByRole('radio').first().check();
    await expect(quiz.getByRole('status').nth(i)).toContainText(/Esatto\.|Non proprio\./);
  }
  await expect(quiz.getByText(/[0-3] risposte giuste su 3\./)).toBeVisible();
  await quiz.getByRole('button', { name: 'Riprova' }).click();
  await expect(quiz.getByRole('radio', { checked: true })).toHaveCount(0);
});

test('pages do not scroll sideways at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const url of ['/', '/start/how-to-use/', '/it/phases/f0-setup/', '/method/workflow/', '/reference/checklist/', '/tools/coach/']) {
    await page.goto(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, url).toBeLessThanOrEqual(0);
  }
  // An open glossary tip stays on screen too.
  await page.goto('/phases/f5/step-1/');
  const term = page.locator('.bcc-term').first();
  await term.locator('a').focus();
  const box = await term.locator('[role="tooltip"]').boundingBox();
  expect(box && box.x >= 0 && box.x + box.width <= 375).toBe(true);
});

test('concept pages exist in both locales', async ({ page }) => {
  await page.goto('/concepts/plan-mode-and-permissions/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Plan mode and permissions');
  await page.goto('/it/concepts/plan-mode-and-permissions/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Plan mode e permessi');
});

test('phase pages show the kicker, the phase rail and a social preview image', async ({ page, request }) => {
  await page.goto('/it/phases/f5-build-loop/');
  await expect(page.locator('.bcc-phasehead__kicker')).toHaveText('Fase 5 di 8');
  const rail = page.getByRole('navigation', { name: 'Le nove fasi' });
  await expect(rail.getByRole('link')).toHaveCount(9);
  await expect(rail.locator('a[aria-current="step"]')).toHaveAttribute('href', '/it/phases/f5-build-loop/');
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toMatch(/\/og\/it\/phases\/f5-build-loop\.png$/);
  const img = await request.get(new URL(og!).pathname);
  expect(img.headers()['content-type']).toContain('image/png');
});
