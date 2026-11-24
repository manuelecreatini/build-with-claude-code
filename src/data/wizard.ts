/**
 * Start-your-build wizard: the playbook's heuristics per product type, in both locales.
 * Every row is copied from a table in the playbook so the wizard never says something the
 * playbook doesn't. Sources (same section in both locales):
 *  - build phases: Phase 4, "How many build phases, and how big"
 *  - stack:        Phase 3, "This playbook's default stack"
 *  - tests:        Phase 5 step 4, "Test level by project type"
 *  - discovery:    Phase 2, "When to use it (and when not to)"
 * tests/unit/wizard.test.ts checks that the linked anchors exist.
 */
import type { Locale } from '~/lib/i18n';
import type { ProjectType } from '~/lib/store';

export interface StackRow {
  need: string;
  pick: string;
  alt?: string;
}
export interface TestRow {
  label: string;
  minimum: string;
  recommended: string;
}
interface Content {
  types: Record<ProjectType, { label: string; phases: string; note: string }>;
  stack: Record<'web' | 'backend' | 'data' | 'hosting' | 'mobile' | 'payments' | 'email' | 'ai' | 'tests', StackRow>;
  tests: Record<'landing' | 'internal' | 'saas' | 'mobile' | 'ai', TestRow>;
  discovery: { small: string; maybeSmall: string; map: string };
  sources: { phases: [string, string]; stack: [string, string]; tests: [string, string]; discovery: [string, string] };
  os: Record<'windows' | 'macos' | 'linux', string>;
}

export const wizardContent: Record<Locale, Content> = {
  en: {
    types: {
      landing: { label: 'Landing page or showcase site with a form', phases: '8–12', note: 'Many content and SEO phases.' },
      internal: { label: 'Internal tool or dashboard', phases: '12–20', note: 'Data, permissions and exports weigh most.' },
      saas: { label: 'Web app or SaaS MVP', phases: '20–35', note: 'Authentication, roles, payments, email.' },
      marketplace: { label: 'Multi-role marketplace, app with mobile and payments', phases: '35–50', note: 'Consider splitting into several milestones.' },
    },
    stack: {
      web: { need: 'Web app or SaaS', pick: 'Next.js + TypeScript + Tailwind CSS + shadcn/ui', alt: 'Astro, for a content site or showcase with few interactive parts.' },
      backend: { need: 'Backend', pick: 'Next.js server functions + Supabase' },
      data: { need: 'Database, login, files', pick: 'Supabase (Postgres, Auth, Storage)' },
      hosting: { need: 'Hosting', pick: 'Vercel' },
      mobile: { need: 'Mobile app', pick: 'Expo (React Native) + Supabase' },
      payments: { need: 'Payments', pick: 'Stripe' },
      email: { need: 'Transactional email', pick: 'Resend' },
      ai: { need: 'AI features', pick: 'Anthropic SDK or Vercel AI SDK' },
      tests: { need: 'Tests', pick: 'Vitest + Playwright' },
    },
    tests: {
      landing: { label: 'Showcase site, landing page', minimum: 'Types, lint, build, basic E2E (home, contact form).', recommended: 'Lighthouse, link checking.' },
      internal: { label: 'Internal tool, dashboard', minimum: 'Plus: unit tests on calculations, integration tests on data access.', recommended: 'E2E on the main flows, tests with realistic data.' },
      saas: { label: 'SaaS with login and payments', minimum: 'TDD on authentication, permissions, payments and data integrity; integration on API and database; E2E from sign-up to payment to key action; `/security-review`.', recommended: '`/code-review ultra` before launch.' },
      mobile: { label: 'Mobile app (Expo)', minimum: 'Unit tests on the logic; E2E on the main flows with a mobile tool.', recommended: 'Tests on real iOS and Android devices.' },
      ai: { label: 'App with AI features', minimum: 'Tests with a mocked model; an evaluation set (*eval*) for the prompts.', recommended: '`/claude-api build-eval` to build the evaluation set.' },
    },
    discovery: {
      small: 'Small project: skip the map. One `/grill-with-docs` session followed by `/to-spec` is faster.',
      maybeSmall: 'With only a couple of screens, skip the map: one `/grill-with-docs` session followed by `/to-spec` is faster. Otherwise draw the map with `/wayfinder`.',
      map: 'New product with several planning sessions ahead: draw the map with `/wayfinder` (the playbook default), then close one decision ticket per session.',
    },
    sources: {
      phases: ['phases/f4-build-phases', 'how-many-build-phases-and-how-big'],
      stack: ['phases/f3-spec-architecture', 'this-playbooks-default-stack'],
      tests: ['phases/f5/step-4', 'test-level-by-project-type'],
      discovery: ['phases/f2-discovery', 'when-to-use-it-and-when-not-to'],
    },
    os: { windows: 'Windows', macos: 'macOS', linux: 'Linux' },
  },
  it: {
    types: {
      landing: { label: 'Landing page o sito vetrina con form', phases: '8–12', note: 'Molte fasi di contenuto e SEO.' },
      internal: { label: 'Strumento interno o dashboard', phases: '12–20', note: 'Pesano dati, permessi, export.' },
      saas: { label: 'Web app o SaaS MVP', phases: '20–35', note: 'Autenticazione, ruoli, pagamenti, email.' },
      marketplace: { label: 'Marketplace multi-ruolo, app con mobile e pagamenti', phases: '35–50', note: 'Valuta di dividere in più traguardi.' },
    },
    stack: {
      web: { need: 'Web app o SaaS', pick: 'Next.js + TypeScript + Tailwind CSS + shadcn/ui', alt: 'Astro, per un sito di contenuti o una vetrina con poche parti interattive.' },
      backend: { need: 'Backend', pick: 'Funzioni server di Next.js + Supabase' },
      data: { need: 'Database, login, file', pick: 'Supabase (Postgres, Auth, Storage)' },
      hosting: { need: 'Hosting', pick: 'Vercel' },
      mobile: { need: 'App mobile', pick: 'Expo (React Native) + Supabase' },
      payments: { need: 'Pagamenti', pick: 'Stripe' },
      email: { need: 'Email transazionali', pick: 'Resend' },
      ai: { need: 'Funzioni AI', pick: 'SDK di Anthropic o Vercel AI SDK' },
      tests: { need: 'Test', pick: 'Vitest + Playwright' },
    },
    tests: {
      landing: { label: 'Sito vetrina, landing', minimum: 'Tipi, lint, build, E2E di base (home, form di contatto).', recommended: 'Lighthouse, controllo dei link.' },
      internal: { label: 'Strumento interno, dashboard', minimum: 'Più: unit sui calcoli, integrazione sugli accessi ai dati.', recommended: 'E2E sui flussi principali, test con dati realistici.' },
      saas: { label: 'SaaS con login e pagamenti', minimum: 'TDD su autenticazione, permessi, pagamenti e integrità dei dati; integrazione su API e database; E2E da registrazione a pagamento ad azione chiave; `/security-review`.', recommended: '`/code-review ultra` prima del lancio.' },
      mobile: { label: 'App mobile (Expo)', minimum: 'Unit sulla logica; E2E sui flussi principali con uno strumento per mobile.', recommended: 'Test su dispositivi reali iOS e Android.' },
      ai: { label: 'App con funzioni AI', minimum: 'Test con il modello simulato; un set di valutazione (*eval*) per i prompt.', recommended: '`/claude-api build-eval` per costruire il set di valutazione.' },
    },
    discovery: {
      small: 'Progetto piccolo: salta la mappa. Una sessione di `/grill-with-docs` seguita da `/to-spec` è più rapida.',
      maybeSmall: 'Con un paio di schermate al massimo, salta la mappa: una sessione di `/grill-with-docs` seguita da `/to-spec` è più rapida. Altrimenti traccia la mappa con `/wayfinder`.',
      map: 'Prodotto nuovo con diverse sessioni di pianificazione davanti: traccia la mappa con `/wayfinder` (il default del playbook), poi chiudi un decision ticket per sessione.',
    },
    sources: {
      phases: ['phases/f4-build-phases', 'quante-build-phase-e-quanto-grandi'],
      stack: ['phases/f3-spec-architecture', 'lo-stack-di-default-di-questo-playbook'],
      tests: ['phases/f5/step-4', 'livello-di-test-per-tipo-di-progetto'],
      discovery: ['phases/f2-discovery', 'quando-usarla-e-quando-no'],
    },
    os: { windows: 'Windows', macos: 'macOS', linux: 'Linux' },
  },
};

/** Which stack rows and test rows apply to a project. */
export function planFor(type: ProjectType, mobile: boolean, ai: boolean) {
  const stack: (keyof Content['stack'])[] = ['web'];
  if (type !== 'landing') stack.push('backend', 'data');
  stack.push('hosting');
  if (mobile) stack.push('mobile');
  if (type === 'saas' || type === 'marketplace') stack.push('payments', 'email');
  if (ai) stack.push('ai');
  stack.push('tests');
  const tests: (keyof Content['tests'])[] = [type === 'marketplace' ? 'saas' : type];
  if (mobile) tests.push('mobile');
  if (ai) tests.push('ai');
  const discovery: keyof Content['discovery'] = type === 'landing' ? 'small' : type === 'internal' ? 'maybeSmall' : 'map';
  return { stack, tests, discovery };
}
