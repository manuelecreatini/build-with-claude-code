// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import mermaid from 'astro-mermaid';
import starlightLinksValidator from 'starlight-links-validator';
import { satteri } from '@astrojs/markdown-satteri';
import { taskListLabels } from './src/lib/task-list-labels.mjs';

/**
 * Sidebar groups: same structure in both locales, labels translated.
 * @param {string} label English label
 * @param {string} it Italian label
 * @param {string} directory content directory to autogenerate from
 */
const group = (label, it, directory) => ({
  label,
  translations: { it },
  items: [{ autogenerate: { directory } }],
});

export default defineConfig({
  site: 'https://build-with-claude-code-playbook.vercel.app',
  // Label the checkboxes of Markdown task lists (`- [ ] item`) for screen readers.
  // MDX pages share this processor (Sätteri, Astro's default).
  markdown: { processor: satteri({ hastPlugins: [taskListLabels] }) },
  integrations: [
    // Must come before Starlight so ```mermaid fences are handled first.
    mermaid({ theme: 'default', autoTheme: true }),
    starlight({
      title: 'Build with Claude Code',
      description:
        'An open-source, interactive playbook: build any digital product with Claude Code, and understand what is happening at every step.',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        it: { label: 'Italiano', lang: 'it' },
      },
      customCss: [
        '@fontsource-variable/inter',
        '@fontsource-variable/space-grotesk',
        '@fontsource-variable/jetbrains-mono',
        './src/styles/theme.css',
        './src/styles/custom.css',
        './src/styles/guide.css',
        './src/styles/home.css',
      ],
      // Hand-written pages edit their own file. Generated pages override this with an
      // `editUrl` that points at their section of the playbook source (see split-playbook.mjs).
      editLink: { baseUrl: 'https://github.com/manuelecreatini/build-with-claude-code/edit/main/' },
      components: {
        Footer: './src/components/overrides/Footer.astro',
        Head: './src/components/overrides/Head.astro',
        PageTitle: './src/components/overrides/PageTitle.astro',
        LanguageSelect: './src/components/overrides/LanguageSelect.astro',
      },
      plugins: [starlightLinksValidator({ errorOnLocalLinks: false })],
      sidebar: [
        group('Start here', 'Inizia qui', 'start'),
        group('Tools', 'Strumenti', 'tools'),
        group('The method', 'Il metodo', 'method'),
        {
          label: 'The nine phases',
          translations: { it: 'Le nove fasi' },
          items: [
            'phases/f0-setup',
            'phases/f1-preliminary-spec',
            'phases/f2-discovery',
            'phases/f3-spec-architecture',
            'phases/f4-build-phases',
            {
              label: 'F5 · The build loop',
              translations: { it: 'F5 · Il build loop' },
              collapsed: true,
              items: [
                'phases/f5-build-loop',
                'phases/f5/preflight',
                ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `phases/f5/step-${n}`),
                'phases/f5/after-the-loop',
              ],
            },
            'phases/f6-integration',
            'phases/f7-deploy',
            'phases/f8-post-launch',
          ],
        },
        group('Concepts', 'Concetti', 'concepts'),
        group('Templates', 'Template', 'templates'),
        group('Toolkit', 'Toolkit', 'toolkit'),
        group('Reference', 'Riferimento', 'reference'),
      ],
      lastUpdated: false,
      pagination: true,
    }),
    react(),
  ],
});
