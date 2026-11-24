/** UI strings for components and islands. Every key must exist in both locales. */
export const ui = {
  en: {
    'role.claude': 'CLAUDE',
    'role.you': 'YOU',
    'role.gate': 'GATE',
    'role.builtin': 'BUILT-IN',
    'role.bundled': 'BUNDLED SKILL',
    'role.pocock': 'MATT POCOCK SKILL',
    'role.integration': 'INTEGRATION',
    'role.claude.title': 'Claude does this on its own, without asking you.',
    'role.you.title': 'You do this: a decision, credential, account, payment, manual action or final test.',
    'role.gate.title': 'Approval point: Claude stops and waits for your explicit yes.',
    'role.builtin.title': 'Native Claude Code command.',
    'role.bundled.title': 'Skill bundled with Claude Code, already available.',
    'role.pocock.title': 'Skill from the mattpocock/skills repository: install it in Phase 0.',
    'role.integration.title': 'External tool: command line, MCP connector or cloud service.',
    'gate.heading': 'Approval gate',
    'hood.summary': 'Under the hood: what is happening',
    'why.label': 'Why this step',
    'lastVerified': 'Facts last verified on',
    'quiz.heading': 'Check yourself',
    'quiz.intro': 'Three quick questions on this phase. Nothing is saved or sent anywhere.',
    'quiz.correct': 'Right.',
    'quiz.wrong': 'Not quite.',
    'quiz.score': '{n} of {total} correct.',
    'quiz.retry': 'Try again',
    'footer.community':
      'Community project, not affiliated with or endorsed by Anthropic. Claude Code changes fast: if something here looks outdated, please open an issue.',
  },
  it: {
    'role.claude': 'CLAUDE',
    'role.you': 'TU',
    'role.gate': 'GATE',
    'role.builtin': 'BUILT-IN',
    'role.bundled': 'BUNDLED SKILL',
    'role.pocock': 'SKILL MATT POCOCK',
    'role.integration': 'INTEGRAZIONE',
    'role.claude.title': 'Claude lo fa in autonomia, senza chiederti nulla.',
    'role.you.title': 'Lo fai tu: decisione, credenziale, account, pagamento, azione manuale o test finale.',
    'role.gate.title': 'Punto di approvazione: Claude si ferma e aspetta il tuo sì esplicito.',
    'role.builtin.title': 'Comando nativo di Claude Code.',
    'role.bundled.title': 'Skill inclusa in Claude Code, già disponibile.',
    'role.pocock.title': 'Skill del repository mattpocock/skills: va installata nella Fase 0.',
    'role.integration.title': 'Strumento esterno: riga di comando, connettore MCP, servizio cloud.',
    'gate.heading': 'Gate di approvazione',
    'hood.summary': 'Dietro le quinte: cosa sta succedendo',
    'why.label': 'Perché questo passo',
    'lastVerified': 'Fatti verificati il',
    'quiz.heading': 'Mettiti alla prova',
    'quiz.intro': 'Tre domande veloci su questa fase. Non viene salvato né inviato nulla.',
    'quiz.correct': 'Esatto.',
    'quiz.wrong': 'Non proprio.',
    'quiz.score': '{n} risposte giuste su {total}.',
    'quiz.retry': 'Riprova',
    'footer.community':
      'Progetto della community, non affiliato né approvato da Anthropic. Claude Code cambia in fretta: se qualcosa ti sembra superato, apri una issue.',
  },
} as const;

export type Locale = keyof typeof ui;
export type UiKey = keyof (typeof ui)['en'];

export function localeFrom(lang: string | undefined): Locale {
  return lang?.startsWith('it') ? 'it' : 'en';
}

export function t(locale: Locale, key: UiKey): string {
  return ui[locale][key] ?? ui.en[key];
}
