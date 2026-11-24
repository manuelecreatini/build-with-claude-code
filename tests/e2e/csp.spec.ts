import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/**
 * The Content-Security-Policy in vercel.json is only sent by Vercel, not by `astro preview`.
 * These tests add it to every page the local server returns, then exercise each feature that
 * loads something at runtime (islands, Mermaid, Pagefind search, the coach), and fail on any
 * violation. Its `connect-src` is what keeps the coach from sending the key anywhere but
 * api.anthropic.com, so a new feature that breaks the policy should fail here, not in production.
 */
const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
  headers: { source: string; headers: { key: string; value: string }[] }[];
};
const CSP = config.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy')!.value;

async function withCsp(page: Page) {
  const violations: string[] = [];
  await page.exposeFunction('reportCsp', (v: string) => violations.push(v));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) =>
      (window as unknown as { reportCsp: (v: string) => void }).reportCsp(
        `${e.effectiveDirective} blocked ${e.blockedURI || '(inline)'} in ${e.sourceFile}:${e.lineNumber}`,
      ),
    );
  });
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue();
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': CSP } });
  });
  return violations;
}

test('the policy keeps the coach on api.anthropic.com', () => {
  const connect = CSP.split(';').map((d) => d.trim()).find((d) => d.startsWith('connect-src'));
  expect(connect).toBe("connect-src 'self' https://api.anthropic.com");
  expect(CSP).toContain("frame-ancestors 'none'");
  expect(CSP).not.toMatch(/(^|\s)'unsafe-eval'/);
});

for (const path of ['/', '/it/phases/f0-setup/', '/concepts/tests-and-ci/', '/tools/tracker/', '/tools/start-wizard/', '/it/tools/coach/']) {
  test(`${path} runs without CSP violations`, async ({ page }) => {
    const violations = await withCsp(page);
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() =>
      [...document.querySelectorAll('pre.mermaid')].every((pre) => pre.hasAttribute('data-processed')),
    );
    await page.waitForLoadState('networkidle');
    expect(violations).toEqual([]);
  });
}

test('the coach page cannot reach any other host', async ({ page }) => {
  const violations = await withCsp(page);
  await page.goto('/tools/coach/');
  await page.evaluate(() => fetch('https://example.com/').catch(() => undefined));
  await expect.poll(() => violations.length).toBeGreaterThan(0);
  expect(violations[0]).toContain('connect-src blocked https://example.com/');
});

test('search works under the policy', async ({ page }) => {
  const violations = await withCsp(page);
  await page.goto('/');
  await page.locator('button[data-open-modal]').click();
  await page.locator('dialog[open] input').fill('gate');
  await expect(page.locator('dialog[open] .pagefind-ui__result').first()).toBeVisible({ timeout: 15_000 });
  expect(violations).toEqual([]);
});
