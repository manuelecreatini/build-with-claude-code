// Teaching layer injected into the generated pages by split-playbook.mjs.
//
// The playbook pages are regenerated from the source on every run, so explanations that
// are not in the source live here instead of being edited into the .mdx files.
//
//  - `at: 'top'`   inserts after the phase summary table (or at the top of the page).
//  - `at: RegExp`  matches a heading line (after heading shift, e.g. /^## 0\.3 /) and
//                  inserts at the end of that section.
//  - `kind`        'why' -> <WhyThisStep> (one line), 'hood' -> <UnderTheHood> (a panel).
//  - In text, `@c/` expands to the locale's concepts URL (/concepts/ or /it/concepts/).
//
// Every entry must have both `en` and `it`. Facts about Claude Code were checked against
// code.claude.com on 2026-11-24 (context-window, permission-modes, memory, skills,
// commands, mcp, sub-agents, hooks).

/** @typedef {{ at: 'top' | RegExp, kind: 'why' | 'hood', title?: {en: string, it: string}, en: string, it: string }} Insert */

/** @type {Record<string, Insert[]>} */
export const INSERTS = {
  'phases/f0-setup': [
    {
      at: 'top',
      kind: 'why',
      en: 'Everything after this phase assumes Claude can read your project, run commands and talk to GitHub. Setting it up once, carefully, saves you from debugging your tools in the middle of building your product.',
      it: 'Tutto ciò che viene dopo dà per scontato che Claude possa leggere il progetto, eseguire comandi e parlare con GitHub. Prepararlo una volta, con cura, ti evita di dover sistemare gli strumenti mentre costruisci il prodotto.',
    },
    {
      at: /^## 0\.3 /,
      kind: 'hood',
      title: { en: 'Under the hood: what "installing a CLI" means', it: 'Dietro le quinte: cosa vuol dire "installare una CLI"' },
      en: 'Git, `gh`, Node.js and Claude Code are command-line programs: you start them by typing their name in a terminal. The installer copies the program to a folder and adds that folder to `PATH`, the list of places the terminal searches when you type a command. That is why you must open a **new** terminal after installing: the old one still has the old `PATH`, and answers "command not found".',
      it: 'Git, `gh`, Node.js e Claude Code sono programmi a riga di comando: li avvii scrivendo il loro nome in un terminale. L\'installer copia il programma in una cartella e aggiunge quella cartella al `PATH`, l\'elenco dei posti in cui il terminale cerca quando scrivi un comando. Per questo devi aprire un terminale **nuovo** dopo l\'installazione: quello vecchio ha ancora il `PATH` precedente e risponde "comando non trovato".',
    },
    {
      at: /^## 0\.5 /,
      kind: 'hood',
      title: { en: 'Under the hood: settings.json and permission modes', it: 'Dietro le quinte: settings.json e permission mode' },
      en: '`.claude/settings.json` is the project\'s shared configuration: it is committed, so everyone who opens the repository gets the same rules. `permissions.defaultMode` decides how a session starts; a `--permission-mode` flag on the command line wins over it. Recent versions of Claude Code start in `auto` mode when nothing is configured, which is why the playbook sets `default` explicitly: at the beginning you want to see and approve every action. More in [Plan mode and permissions](@c/plan-mode-and-permissions/).',
      it: '`.claude/settings.json` è la configurazione condivisa del progetto: viene committata, quindi chiunque apra il repository ha le stesse regole. `permissions.defaultMode` decide come parte una sessione; il flag `--permission-mode` da riga di comando ha la precedenza. Le versioni recenti di Claude Code partono in modalità `auto` se non è configurato nulla: per questo il playbook imposta `default` in modo esplicito, perché all\'inizio vuoi vedere e approvare ogni azione. Approfondisci in [Plan mode e permessi](@c/plan-mode-and-permissions/).',
    },
    {
      at: /^### (Step|Passo) 2 — /,
      kind: 'hood',
      title: { en: 'Under the hood: what Claude reads from CLAUDE.md', it: 'Dietro le quinte: cosa legge Claude da CLAUDE.md' },
      en: 'At the start of every session Claude Code loads `CLAUDE.md` from the project folder (and every folder above it, plus your personal `~/.claude/CLAUDE.md`) into its context. It is context, not enforced configuration: Claude follows it because it reads it, so short, concrete rules work better than long essays. The official guidance is to keep each file under about 200 lines. More in [CLAUDE.md and memory](@c/claude-md-and-memory/).',
      it: 'All\'inizio di ogni sessione Claude Code carica nel contesto il `CLAUDE.md` della cartella del progetto (e di tutte le cartelle superiori, più il tuo `~/.claude/CLAUDE.md` personale). È contesto, non configurazione vincolante: Claude lo segue perché lo legge, quindi regole brevi e concrete funzionano meglio di lunghi testi. La guida ufficiale consiglia di restare sotto le 200 righe circa per file. Approfondisci in [CLAUDE.md e memoria](@c/claude-md-and-memory/).',
    },
    {
      at: /^### (Step|Passo) 3 — /,
      kind: 'hood',
      title: { en: 'Under the hood: local repository vs GitHub', it: 'Dietro le quinte: repository locale e GitHub' },
      en: 'Git keeps the full history of the project in a hidden `.git` folder on your computer. GitHub is a copy of that history on a server, plus collaboration tools (issues, pull requests, Actions). `git push` sends your new commits to GitHub; `git pull` brings down the ones you do not have yet. More in [Git, branches and pull requests](@c/git-branches-and-pull-requests/).',
      it: 'Git conserva tutta la storia del progetto in una cartella nascosta `.git` sul tuo computer. GitHub è una copia di quella storia su un server, più gli strumenti di collaborazione (issue, pull request, Actions). `git push` invia a GitHub i nuovi commit; `git pull` scarica quelli che non hai ancora. Approfondisci in [Git, branch e pull request](@c/git-branches-and-pull-requests/).',
    },
  ],
  'phases/f1-preliminary-spec': [
    {
      at: 'top',
      kind: 'why',
      en: 'An agent builds exactly what it understands. Getting the whole idea out of your head first, before any technical choice, is the cheapest moment to discover what you actually want.',
      it: 'Un agente costruisce esattamente ciò che capisce. Tirare fuori tutta l\'idea dalla testa prima di qualsiasi scelta tecnica è il momento più economico per scoprire cosa vuoi davvero.',
    },
  ],
  'phases/f2-discovery': [
    {
      at: 'top',
      kind: 'why',
      en: 'Every decision left open now gets taken later by Claude, silently, in the code. Discovery turns those hidden choices into explicit tickets you answer once and can find again.',
      it: 'Ogni decisione lasciata aperta adesso verrà presa più avanti da Claude, in silenzio, nel codice. La discovery trasforma queste scelte nascoste in ticket espliciti a cui rispondi una volta e che puoi ritrovare.',
    },
    {
      at: /^## (What \/wayfinder is|Cos'è \/wayfinder)/,
      kind: 'hood',
      title: { en: 'Under the hood: what a skill is', it: 'Dietro le quinte: cos\'è una skill' },
      en: '`/wayfinder` is a *skill*: a folder with a `SKILL.md` file of instructions. Claude Code only keeps each skill\'s short description in context; the full instructions load when you type `/wayfinder` or when Claude decides the skill fits the task. That is how dozens of skills can be installed without filling the context window. More in [Skills, commands and MCP](@c/skills-commands-and-mcp/).',
      it: '`/wayfinder` è una *skill*: una cartella con un file `SKILL.md` di istruzioni. Claude Code tiene nel contesto solo la breve descrizione di ogni skill; le istruzioni complete si caricano quando scrivi `/wayfinder` o quando Claude decide che la skill è adatta al compito. Così puoi installare decine di skill senza riempire la finestra di contesto. Approfondisci in [Skill, comandi e MCP](@c/skills-commands-and-mcp/).',
    },
  ],
  'phases/f3-spec-architecture': [
    {
      at: 'top',
      kind: 'why',
      en: 'From here on, the spec is the contract: every build phase, test and review is checked against it. A single, versioned source of truth stops the product from drifting one prompt at a time.',
      it: 'Da qui in poi la spec è il contratto: ogni build phase, test e review viene verificato rispetto a essa. Un\'unica fonte di verità, con una versione, impedisce al prodotto di cambiare direzione un prompt alla volta.',
    },
  ],
  'phases/f4-build-phases': [
    {
      at: 'top',
      kind: 'why',
      en: 'Claude does its best work on a task that fits in one session. Small vertical slices, each with its own issue and pull request, keep every change reviewable and every mistake cheap to undo.',
      it: 'Claude lavora meglio su un compito che sta in una sessione. Fette verticali piccole, ognuna con la sua issue e la sua pull request, rendono ogni modifica revisionabile e ogni errore facile da annullare.',
    },
  ],
  'phases/f5-build-loop': [
    {
      at: 'top',
      kind: 'why',
      en: 'Repeating the same eight steps for every slice is what makes quality predictable: plan before code, tests before merge, documentation before the next phase, a clean context before the next session.',
      it: 'Ripetere gli stessi otto passi per ogni fetta è ciò che rende la qualità prevedibile: piano prima del codice, test prima del merge, documentazione prima della fase successiva, contesto pulito prima della sessione successiva.',
    },
  ],
  'phases/f5/preflight': [
    {
      at: 'top',
      kind: 'why',
      en: 'Starting from an up-to-date `main` and a near-empty context means Claude works on the real state of the project, not on a memory of it.',
      it: 'Partire da un `main` aggiornato e da un contesto quasi vuoto significa che Claude lavora sullo stato reale del progetto, non su un ricordo.',
    },
  ],
  'phases/f5/step-1': [
    {
      at: 'top',
      kind: 'why',
      en: 'In plan mode Claude can read and explore but cannot edit your source, so you can correct the approach while it costs one sentence instead of a rewrite.',
      it: 'In plan mode Claude può leggere ed esplorare ma non può modificare il codice: puoi correggere l\'approccio quando costa una frase invece di una riscrittura.',
    },
    {
      at: 'top',
      kind: 'hood',
      title: { en: 'Under the hood: what plan mode allows', it: 'Dietro le quinte: cosa permette il plan mode' },
      en: 'Plan mode is one of Claude Code\'s permission modes. Claude reads files, runs shell commands to explore and writes a plan, but source edits stay blocked until you approve. When you approve, Claude Code asks how to continue (for example with edits approved manually), and you can open the plan in your editor with `Ctrl+G` to change it first. More in [Plan mode and permissions](@c/plan-mode-and-permissions/).',
      it: 'Il plan mode è uno dei permission mode di Claude Code. Claude legge i file, esegue comandi di shell per esplorare e scrive un piano, ma le modifiche al codice restano bloccate finché non approvi. Quando approvi, Claude Code chiede come proseguire (per esempio approvando le modifiche manualmente), e puoi aprire il piano nell\'editor con `Ctrl+G` per cambiarlo prima. Approfondisci in [Plan mode e permessi](@c/plan-mode-and-permissions/).',
    },
  ],
  'phases/f5/step-2': [
    {
      at: 'top',
      kind: 'why',
      en: 'A failing test written first is a precise, checkable definition of "done". It lets Claude verify its own work instead of asking you to trust it.',
      it: 'Un test che fallisce, scritto per primo, è una definizione precisa e verificabile di "fatto". Permette a Claude di controllare il proprio lavoro invece di chiederti di fidarti.',
    },
    {
      at: 'top',
      kind: 'hood',
      title: { en: 'Under the hood: why a branch per phase', it: 'Dietro le quinte: perché un branch per fase' },
      en: 'A branch is a separate line of commits. Working on `bp-07-…` instead of `main` means `main` always holds a version that passed its checks: if the phase goes wrong you delete the branch and nothing else is touched. More in [Git, branches and pull requests](@c/git-branches-and-pull-requests/) and [Tests and CI](@c/tests-and-ci/).',
      it: 'Un branch è una linea separata di commit. Lavorare su `bp-07-…` invece che su `main` significa che `main` contiene sempre una versione che ha superato i controlli: se la fase va male cancelli il branch e nient\'altro viene toccato. Approfondisci in [Git, branch e pull request](@c/git-branches-and-pull-requests/) e [Test e CI](@c/tests-and-ci/).',
    },
  ],
  'phases/f5/step-3': [
    {
      at: 'top',
      kind: 'why',
      en: 'Some things only you can do: decide, pay, create an account, paste a secret. Making Claude stop explicitly keeps those moments visible instead of guessed.',
      it: 'Alcune cose puoi farle solo tu: decidere, pagare, creare un account, incollare un segreto. Far fermare Claude in modo esplicito rende visibili questi momenti invece di lasciarli indovinare.',
    },
  ],
  'phases/f5/step-4': [
    {
      at: 'top',
      kind: 'why',
      en: 'Tests and review catch what the plan missed while the change is still small and fresh. Green checks are what lets you merge without reading every line.',
      it: 'Test e review trovano ciò che il piano non aveva previsto, finché la modifica è ancora piccola e recente. I controlli verdi sono ciò che ti permette di fare merge senza leggere ogni riga.',
    },
  ],
  'phases/f5/step-5': [
    {
      at: 'top',
      kind: 'why',
      en: 'The next session starts with an empty context. Whatever is not written down in the repository (status, decisions, new terms) is lost for Claude.',
      it: 'La sessione successiva parte con un contesto vuoto. Tutto ciò che non è scritto nel repository (stato, decisioni, nuovi termini) per Claude è perso.',
    },
  ],
  'phases/f5/step-6': [
    {
      at: 'top',
      kind: 'why',
      en: 'The pull request is the one place where the change, its tests and its explanation meet. Approving it is your acceptance of the phase.',
      it: 'La pull request è l\'unico punto in cui la modifica, i suoi test e la sua spiegazione si incontrano. Approvarla significa accettare la fase.',
    },
    {
      at: 'top',
      kind: 'hood',
      title: { en: 'Under the hood: what happens on push and merge', it: 'Dietro le quinte: cosa succede con push e merge' },
      en: 'When the branch reaches GitHub, the CI workflow in `.github/workflows/` runs the same checks on a clean machine, so "works on my computer" is not enough. A squash merge turns all the phase\'s commits into one commit on `main`, which keeps the history readable: one phase, one commit. More in [Tests and CI](@c/tests-and-ci/).',
      it: 'Quando il branch arriva su GitHub, il workflow di CI in `.github/workflows/` esegue gli stessi controlli su una macchina pulita, quindi "sul mio computer funziona" non basta. Lo squash merge trasforma tutti i commit della fase in un solo commit su `main`, così la storia resta leggibile: una fase, un commit. Approfondisci in [Test e CI](@c/tests-and-ci/).',
    },
  ],
  'phases/f5/step-7': [
    {
      at: 'top',
      kind: 'why',
      en: 'A fresh session with a good handover beats a long session full of stale detail: Claude reasons better when its context holds only what matters now.',
      it: 'Una sessione nuova con un buon passaggio di consegne funziona meglio di una sessione lunga piena di dettagli superati: Claude ragiona meglio quando il contesto contiene solo ciò che serve adesso.',
    },
  ],
  'phases/f5/step-8': [
    {
      at: 'top',
      kind: 'why',
      en: 'The context window is Claude\'s working memory. Watching it, and clearing it between unrelated tasks, is the most effective way to keep answers sharp in long projects.',
      it: 'La finestra di contesto è la memoria di lavoro di Claude. Tenerla d\'occhio, e svuotarla tra compiti non collegati, è il modo più efficace per mantenere precise le risposte nei progetti lunghi.',
    },
    {
      at: /^## (What survives compaction|Cosa sopravvive alla compattazione)/,
      kind: 'hood',
      title: { en: 'Under the hood: what compaction keeps', it: 'Dietro le quinte: cosa conserva la compattazione' },
      en: 'Claude Code compacts automatically as you approach the limit, replacing the conversation with a summary. Afterwards it re-reads the project-root `CLAUDE.md` and unscoped rules from disk, and re-reads a few recently modified files. Details that existed only in the conversation can be lost, which is why the playbook writes status and decisions into files. More in [Context window and tokens](@c/context-window-and-tokens/).',
      it: 'Claude Code compatta automaticamente quando ti avvicini al limite, sostituendo la conversazione con un riassunto. Dopo rilegge dal disco il `CLAUDE.md` della radice del progetto e le regole senza ambito, e rilegge alcuni file modificati di recente. I dettagli che esistevano solo nella conversazione possono andare persi: per questo il playbook scrive stato e decisioni nei file. Approfondisci in [Finestra di contesto e token](@c/context-window-and-tokens/).',
    },
  ],
  'phases/f6-integration': [
    {
      at: 'top',
      kind: 'why',
      en: 'Each phase was tested on its own. Only now can you see whether the pieces form the product the spec describes, before real users find the gaps for you.',
      it: 'Ogni fase è stata testata da sola. Solo adesso puoi vedere se i pezzi formano il prodotto descritto dalla spec, prima che siano gli utenti veri a trovare le lacune.',
    },
  ],
  'phases/f7-deploy': [
    {
      at: 'top',
      kind: 'why',
      en: 'Going live is reversible only if you planned it that way. Separate environments, secrets outside the code and a tested rollback turn launch day into a routine.',
      it: 'Andare online è reversibile solo se l\'hai pianificato così. Ambienti separati, segreti fuori dal codice e un rollback provato trasformano il giorno del lancio in una routine.',
    },
    {
      at: /^## (Step|Passo) 2 — /,
      kind: 'hood',
      title: { en: 'Under the hood: where secrets live', it: 'Dietro le quinte: dove vivono i segreti' },
      en: 'Environment variables are values the hosting platform hands to your app when it starts. Because keys live there and not in the repository, the same code can run in preview with test keys and in production with real ones, and a leaked repository does not leak your keys. More in [Deploy and environments](@c/deploy-and-environments/).',
      it: 'Le variabili d\'ambiente sono valori che la piattaforma di hosting passa alla tua app quando parte. Dato che le chiavi stanno lì e non nel repository, lo stesso codice può girare in preview con chiavi di test e in produzione con quelle vere, e un repository esposto non espone le tue chiavi. Approfondisci in [Deploy e ambienti](@c/deploy-and-environments/).',
    },
  ],
  'phases/f8-post-launch': [
    {
      at: 'top',
      kind: 'why',
      en: 'After launch, speed tempts you to skip the method. Running every change through the same loop is what keeps a live product from slowly breaking.',
      it: 'Dopo il lancio la fretta spinge a saltare il metodo. Far passare ogni modifica dallo stesso ciclo è ciò che impedisce a un prodotto online di rompersi poco alla volta.',
    },
  ],
};

/** Phase pages that end with a short self-check quiz. */
export const QUIZ_PAGES = {
  'phases/f0-setup': 'F0',
  'phases/f1-preliminary-spec': 'F1',
  'phases/f2-discovery': 'F2',
  'phases/f3-spec-architecture': 'F3',
  'phases/f4-build-phases': 'F4',
  'phases/f5/after-the-loop': 'F5',
  'phases/f6-integration': 'F6',
  'phases/f7-deploy': 'F7',
  'phases/f8-post-launch': 'F8',
};

/**
 * Insert the teaching blocks for one page.
 * @param {string[]} lines page body after heading shift and text transform
 * @param {string} slug
 * @param {'en'|'it'} locale
 * @param {string} conceptsUrl e.g. "/concepts/" or "/it/concepts/"
 * @returns {{ lines: string[], components: Set<string> }}
 */
export function applyInserts(lines, slug, locale, conceptsUrl) {
  const list = INSERTS[slug] ?? [];
  const components = new Set();
  let out = [...lines];
  // Section inserts locate their heading afresh each time; top inserts go in last, in order.
  const top = list.filter((i) => i.at === 'top');
  const sections = list.filter((i) => i.at !== 'top');
  for (const ins of sections) {
    const h = findLine(out, ins.at);
    if (h === -1) throw new Error(`teaching insert for ${slug}: heading ${ins.at} not found`);
    const level = /^(#+)/.exec(out[h])[1].length;
    let end = out.length;
    let fence = false;
    for (let i = h + 1; i < out.length; i++) {
      if (/^```/.test(out[i])) fence = !fence;
      if (fence) continue;
      const m = /^(#+) /.exec(out[i]);
      if ((m && m[1].length <= level) || /^\[\^[^\]]+\]: /.test(out[i])) {
        end = i;
        break;
      }
    }
    while (end > h + 1 && !out[end - 1].trim()) end--;
    out.splice(end, 0, '', ...render(ins, locale, conceptsUrl, components));
  }
  if (top.length) {
    let at = 0;
    while (at < out.length && !out[at].trim()) at++;
    if (out[at]?.startsWith('|')) {
      while (at < out.length && out[at].startsWith('|')) at++;
    } else at = 0;
    const blocks = top.flatMap((ins) => [...render(ins, locale, conceptsUrl, components), '']);
    out.splice(at, 0, ...(at ? [''] : []), ...blocks);
  }
  return { lines: out, components };
}

function findLine(lines, re) {
  let fence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i])) fence = !fence;
    if (!fence && re.test(lines[i])) return i;
  }
  return -1;
}

function render(ins, locale, conceptsUrl, components) {
  const text = ins[locale].replaceAll('@c/', conceptsUrl);
  if (ins.kind === 'why') {
    components.add('WhyThisStep');
    return [`<WhyThisStep>${text}</WhyThisStep>`];
  }
  components.add('UnderTheHood');
  return [`<UnderTheHood title={${JSON.stringify(ins.title[locale])}}>`, '', text, '', '</UnderTheHood>'];
}
