import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Automated WCAG 2.1 AA checks (axe-core) on one page of each kind, in both languages,
 * plus colour contrast in both themes. Axe finds roughly a third of real accessibility
 * problems; the rest still needs a keyboard and a screen reader.
 */
const PAGES = [
  '/',
  '/it/',
  '/phases/f5-build-loop/',
  '/it/phases/f0-setup/',
  '/tools/tracker/',
  '/it/tools/start-wizard/',
  '/reference/glossary/',
  '/templates/t3/',
  '/it/tools/coach/',
  '/404/',
];

/**
 * The one finding we accept. Starlight's search button is named "Search" (aria-label) and
 * shows "Search" plus a "Ctrl K" hint, so axe's label-in-name rule (WCAG 2.5.3) flags it.
 * The visible label "Search" is the start of the name and the shortcut is exposed through
 * aria-keyshortcuts, so speech users can still say "click Search". The markup is Starlight's,
 * so the exception covers only this rule on only this element.
 */
type Violation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number];
const isKnownException = (v: Violation) =>
  v.id === 'label-content-name-mismatch' &&
  v.nodes.every((n) => n.target.join(' ') === 'button[data-open-modal=""]');

// Axe on a long page takes a while, more so with other tests running beside it.
test.describe.configure({ timeout: 60_000 });

for (const theme of ['light', 'dark'] as const) {
  for (const path of PAGES) {
    test(`${path} has no axe violations (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('starlight-theme', t), theme);
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      // Only colour depends on the theme, so the dark pass checks contrast alone.
      const axe = new AxeBuilder({ page });
      if (theme === 'light') axe.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
      else axe.withRules(['color-contrast']);
      const { violations } = await axe.analyze();
      const summary = violations.filter((v) => !isKnownException(v)).map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
      }));
      expect(summary).toEqual([]);
    });
  }
}
