// Inserts that make the generated pages adapt to the guide preferences (src/lib/prefs.ts):
// desktop-app versions of terminal steps, tool choices with pros and cons, and extra steps for
// the hardened security, polished design and lean dependency options.
// Same format as teaching-inserts.mjs; both locales required.
//
// Desktop-app facts were checked against code.claude.com/docs/en/desktop and
// /docs/en/desktop-quickstart on 2026-11-24. Where the docs say nothing about a command in the
// desktop app (for example /doctor or /statusline), the text says so instead of guessing.

const DESKTOP_DOCS = 'https://code.claude.com/docs/en/desktop-quickstart';

/** @type {Record<string, import('./teaching-inserts.mjs').Insert[]>} */
export const GUIDE_INSERTS = {
  'phases/f0-setup': [
    {
      at: 'top',
      kind: 'only',
      when: { level: 'guided' },
      en: '**Take this phase slowly.** Every command below prints something: read it. If a line ends in an error, stop and paste it into Claude (chat is fine at this point) before moving on. Nothing here can harm your computer, and every step can be repeated.',
      it: '**Affronta questa fase con calma.** Ogni comando qui sotto stampa qualcosa: leggilo. Se una riga finisce con un errore, fermati e incollala in Claude (va bene anche la chat, a questo punto) prima di andare avanti. Niente di quello che fai qui può danneggiare il computer, e ogni passo si può ripetere.',
    },
    {
      at: /^## 0\.1 /,
      kind: 'only',
      when: { surface: 'desktop' },
      en: `**You chose the desktop app.** Use the **Code** tab of the Claude desktop app: it includes Claude Code, so you do not need to install Node.js or the CLI to run it. It needs a Pro, Max, Team or Enterprise plan. Sessions, the permission mode and the model are chosen in the row under the prompt box; diffs, a terminal and a preview of your app open as panes next to the chat. The steps on these pages show the desktop version wherever it differs. You can switch to the terminal at any time with the switch at the top of the page: \`/desktop\` moves a terminal session into the app.`,
      it: `**Hai scelto l'app desktop.** Usa la scheda **Code** dell'app desktop di Claude: include Claude Code, quindi per usarlo non devi installare Node.js né la CLI. Richiede un piano Pro, Max, Team o Enterprise. Sessione, modalità dei permessi e modello si scelgono nella riga sotto la casella del prompt; diff, terminale e anteprima dell'app si aprono come pannelli accanto alla chat. I passi di queste pagine mostrano la versione desktop dove è diversa. Puoi passare al terminale quando vuoi con il selettore in alto nella pagina: \`/desktop\` sposta una sessione dal terminale all'app.`,
    },
    {
      at: /^## 0\.3 /,
      kind: 'only',
      pos: 'start',
      when: { surface: 'desktop' },
      en: `**With the desktop app:** download and install it from the [desktop quickstart](${DESKTOP_DOCS}) (macOS, Windows x64 and ARM64; Linux is a beta for Ubuntu 22.04+ and Debian 12+). Then install the other tools below anyway, skipping only the Claude Code line (\`install.ps1\` / \`install.sh\`) and \`claude --version\`:\n\n- **Git** is needed for worktree sessions (on Windows, Git for Windows);\n- **GitHub CLI** (\`gh\`) is what the **Create PR** button uses;\n- **Node.js** is needed by your project's stack (Next.js), not by the app.`,
      it: `**Con l'app desktop:** scaricala e installala dalla [guida rapida desktop](${DESKTOP_DOCS}) (macOS, Windows x64 e ARM64; su Linux è una beta per Ubuntu 22.04+ e Debian 12+). Poi installa comunque gli altri strumenti qui sotto, saltando solo la riga di Claude Code (\`install.ps1\` / \`install.sh\`) e \`claude --version\`:\n\n- **Git** serve per le sessioni in worktree (su Windows, Git for Windows);\n- la **GitHub CLI** (\`gh\`) è quella che usa il pulsante **Create PR**;\n- **Node.js** serve allo stack del progetto (Next.js), non all'app.`,
    },
    { at: /^## 0\.4 /, kind: 'choice', pos: 'start', tool: 'github' },
    {
      at: /^## 0\.5 /,
      kind: 'swap',
      en: `Open the Claude desktop app, sign in with your Claude account and select the **Code** tab. Start a session with **+ New** in the sidebar (or \`Ctrl+N\` / \`Cmd+N\`). Before you send the first message, choose in the row under the prompt box:\n\n- **Environment**: *Local*, so Claude works on your computer;\n- **Project folder**: **Open folder…** and pick the project folder (from section 0.7 on);\n- **Permission mode**: *Manual* to start: Claude shows each change as a diff with approve and decline buttons;\n- **Model**.\n\nThe terminal commands \`/doctor\`, \`/statusline\` and \`/autocompact\` are not documented for the desktop app. Use these instead:\n\n- \`/status\` shows the version, the model and the account;\n- \`/context\` shows how much of the context window is in use: check it often, it is the basis of context management (Phase 5, step 8);\n- \`/config\` opens Settings.\n\nCommands that need the terminal's own dialogs reply *isn't available in this environment*: for those, open the built-in terminal with \`\` Ctrl+\` \`\` or use the CLI.`,
      it: `Apri l'app desktop di Claude, accedi con il tuo account Claude e seleziona la scheda **Code**. Avvia una sessione con **+ New** nella barra laterale (o \`Ctrl+N\` / \`Cmd+N\`). Prima di inviare il primo messaggio scegli, nella riga sotto la casella del prompt:\n\n- **Ambiente**: *Local*, così Claude lavora sul tuo computer;\n- **Cartella del progetto**: **Open folder…** e scegli la cartella del progetto (dalla sezione 0.7 in poi);\n- **Modalità dei permessi**: *Manual* per iniziare: Claude mostra ogni modifica come diff con i pulsanti per approvare o rifiutare;\n- **Modello**.\n\nI comandi da terminale \`/doctor\`, \`/statusline\` e \`/autocompact\` non sono documentati per l'app desktop. Usa invece:\n\n- \`/status\` mostra versione, modello e account;\n- \`/context\` mostra quanta parte della finestra di contesto è in uso: controllalo spesso, è la base della gestione del contesto (Fase 5, passo 8);\n- \`/config\` apre le Impostazioni.\n\nI comandi che usano finestre di dialogo del terminale rispondono *isn't available in this environment*: per quelli apri il terminale integrato con \`\` Ctrl+\` \`\` o usa la CLI.`,
    },
    {
      at: /^## 0\.6 /,
      kind: 'only',
      pos: 'start',
      when: { surface: 'desktop' },
      en: 'In the desktop app, plugins are managed from the **+** button next to the prompt box: **Plugins → Add plugins** opens the plugin browser, where you can search for `mattpocock-skills`. Then type `/` in the prompt box: the plugin\'s skills appear in the list. The notes below on skill names and the `code-review` clash apply to the desktop app too.',
      it: 'Nell\'app desktop i plugin si gestiscono dal pulsante **+** accanto alla casella del prompt: **Plugins → Add plugins** apre il catalogo dei plugin, dove puoi cercare `mattpocock-skills`. Poi scrivi `/` nella casella del prompt: le skill del plugin compaiono nell\'elenco. Le note qui sotto sui nomi delle skill e sul conflitto di `code-review` valgono anche per l\'app desktop.',
    },
    {
      at: /^### (Step|Passo) 2 — /,
      kind: 'only',
      when: { security: 'hardened' },
      en: 'Hardened security: extend the `deny` list in `.claude/settings.json` so Claude cannot read any environment file, key or credential folder, nor download from the network on its own:\n\n```json\n"deny": [\n  "Read(./.env)",\n  "Read(./.env.*)",\n  "Read(./secrets/**)",\n  "Read(~/.ssh/**)",\n  "Read(~/.aws/**)",\n  "Bash(curl:*)",\n  "Bash(wget:*)"\n]\n```\n\nOn GitHub, turn on **secret scanning**, **push protection** and **Dependabot alerts** in the repository\'s *Settings → Advanced Security*, and two-factor authentication on every account the project uses.',
      it: 'Sicurezza rinforzata: estendi la lista `deny` in `.claude/settings.json` così che Claude non possa leggere file di ambiente, chiavi o cartelle di credenziali, né scaricare dalla rete di sua iniziativa:\n\n```json\n"deny": [\n  "Read(./.env)",\n  "Read(./.env.*)",\n  "Read(./secrets/**)",\n  "Read(~/.ssh/**)",\n  "Read(~/.aws/**)",\n  "Bash(curl:*)",\n  "Bash(wget:*)"\n]\n```\n\nSu GitHub attiva **secret scanning**, **push protection** e **Dependabot alerts** in *Settings → Advanced Security* del repository, e l\'autenticazione a due fattori su ogni account usato dal progetto.',
    },
  ],
  'phases/f3-spec-architecture': [
    {
      at: /^### (This playbook's default stack|Lo stack di default di questo playbook)/,
      kind: 'only',
      when: { deps: 'lean' },
      en: '**Lean dependencies.** Add one line to the prompt from template T5: *"Prefer what the framework and the platform already provide. For every library or external service you propose, write in the ADR what it saves us, what it costs to keep updated, and the version without it."* Expect fewer services (for example: no separate analytics or error tracker at the start) and more code you own.',
      it: '**Dipendenze essenziali.** Aggiungi una riga al prompt del template T5: *"Preferisci ciò che il framework e la piattaforma già offrono. Per ogni libreria o servizio esterno che proponi, scrivi nell\'ADR cosa ci fa risparmiare, quanto costa tenerlo aggiornato e come sarebbe la versione senza."* Aspettati meno servizi (per esempio: niente analytics o tracciamento errori separati all\'inizio) e più codice tuo.',
    },
    { at: /^### (This playbook's default stack|Lo stack di default di questo playbook)/, kind: 'choice', tool: 'supabase' },
    { at: /^### (This playbook's default stack|Lo stack di default di questo playbook)/, kind: 'choice', tool: 'docker' },
    {
      at: /^### (This playbook's default stack|Lo stack di default di questo playbook)/,
      kind: 'only',
      when: { tool: 'docker' },
      en: 'With Docker: ask Claude to add a `docker-compose.yml` with the app and a local Postgres, and to document `docker compose up` in the README. Record the choice in an ADR; Phase 7 deploys the same image.',
      it: 'Con Docker: chiedi a Claude di aggiungere un `docker-compose.yml` con l\'app e un Postgres locale, e di documentare `docker compose up` nel README. Registra la scelta in un ADR; la Fase 7 pubblica la stessa immagine.',
    },
    {
      at: /^## (Step|Passo) 4 — /,
      kind: 'only',
      when: { focus: 'function' },
      en: '**Function first.** Skip the mockups unless a flow is genuinely unclear. Ask for a ready-made component library in the architecture (for example shadcn/ui with its default theme) and leave visual polish to a build phase after launch.',
      it: '**Prima la funzione.** Salta i mockup a meno che un flusso non sia davvero poco chiaro. Chiedi nell\'architettura una libreria di componenti pronta (per esempio shadcn/ui con il tema di default) e rimanda la cura visiva a una build phase dopo il lancio.',
    },
    {
      at: /^## (Step|Passo) 4 — /,
      kind: 'only',
      when: { focus: 'polish' },
      en: '**Polished.** Do the mockups for every main screen, not only the uncertain ones. Ask Claude to write `docs/design-system.md` (colours, type scale, spacing, components, states, dark mode) from the approved mockups, and add to the spec an accessibility target: WCAG 2.2 AA, keyboard navigation, visible focus, contrast checked.',
      it: '**Curato.** Fai i mockup di ogni schermata principale, non solo di quelle incerte. Chiedi a Claude di scrivere `docs/design-system.md` (colori, scala tipografica, spaziature, componenti, stati, tema scuro) a partire dai mockup approvati, e aggiungi alla spec un obiettivo di accessibilità: WCAG 2.2 AA, navigazione da tastiera, focus visibile, contrasto verificato.',
    },
  ],
  'phases/f5/step-1': [
    {
      at: 'top',
      kind: 'only',
      when: { surface: 'desktop' },
      en: '**In the desktop app:** choose **Plan** in the mode selector next to the prompt box, or press `Ctrl+Shift+M` / `Cmd+Shift+M`. `Shift+Tab` does not change mode in the desktop app. The rest of the step is the same.',
      it: '**Nell\'app desktop:** scegli **Plan** nel selettore della modalità accanto alla casella del prompt, oppure premi `Ctrl+Shift+M` / `Cmd+Shift+M`. Nell\'app desktop `Shift+Tab` non cambia modalità. Il resto del passo è uguale.',
    },
  ],
  'phases/f5/step-2': [
    {
      at: 'top',
      kind: 'only',
      when: { surface: 'desktop' },
      en: '**In the desktop app:** in *Manual* mode every edit appears as a diff with approve and decline buttons. The **Changes** card shows all the edits of the session in a diff view where you can leave a comment on a line for Claude. To try the app while it is being built, open the **Browser** pane (`Ctrl+Shift+B` / `Cmd+Shift+B`); Claude configures how to start it in `.claude/launch.json`.',
      it: '**Nell\'app desktop:** in modalità *Manual* ogni modifica compare come diff con i pulsanti per approvare o rifiutare. La scheda **Changes** mostra tutte le modifiche della sessione in una vista diff dove puoi lasciare a Claude un commento su una riga. Per provare l\'app mentre la costruisci, apri il pannello **Browser** (`Ctrl+Shift+B` / `Cmd+Shift+B`); Claude configura come avviarla in `.claude/launch.json`.',
    },
  ],
  'phases/f5/step-4': [
    {
      at: 'top',
      kind: 'only',
      when: { security: 'hardened' },
      en: '**Hardened security:** run `/security-review` on every build phase, not only those that touch login, permissions, payments or personal data, and `npm audit --audit-level=high` before opening the pull request. Ask Claude to fix or explain every finding in the pull request description.',
      it: '**Sicurezza rinforzata:** esegui `/security-review` a ogni build phase, non solo in quelle che toccano login, permessi, pagamenti o dati personali, e `npm audit --audit-level=high` prima di aprire la pull request. Chiedi a Claude di correggere o spiegare ogni rilievo nella descrizione della pull request.',
    },
    {
      at: 'top',
      kind: 'only',
      when: { focus: 'polish' },
      en: '**Polished:** add to the review an accessibility pass on the screens the phase touches: keyboard only, a screen reader on the main flow, contrast, and a check that the screens follow `docs/design-system.md`.',
      it: '**Curato:** aggiungi alla review un controllo di accessibilità sulle schermate toccate dalla fase: solo tastiera, uno screen reader sul flusso principale, contrasto, e una verifica che le schermate seguano `docs/design-system.md`.',
    },
    {
      at: 'top',
      kind: 'only',
      when: { surface: 'desktop' },
      en: '**In the desktop app:** `/code-review` and `/security-review` work as in the terminal. **Create PR** opens the pull request (it needs `gh`); *Auto-fix* and *Merge when ready* are in the pull request\'s ⋮ menu.',
      it: '**Nell\'app desktop:** `/code-review` e `/security-review` funzionano come nel terminale. **Create PR** apre la pull request (richiede `gh`); *Auto-fix* e *Merge when ready* sono nel menu ⋮ della pull request.',
    },
  ],
  'phases/f7-deploy': [
    { at: /^## (Choosing hosting|Scegliere l'hosting)/, kind: 'choice', tool: 'vercel' },
    {
      at: /^## (Step|Passo) 6 — /,
      kind: 'only',
      when: { security: 'hardened' },
      en: 'Hardened security, before launch:\n\n- [ ] Two-factor authentication on every production account (GitHub, hosting, database, domain registrar, email).\n- [ ] Secret scanning and push protection on; no open Dependabot alert of high severity.\n- [ ] Row-level security checked on every table, with the database\'s own advisor if it has one.\n- [ ] A `/security-review` of the whole `main` branch, findings fixed or accepted in writing.\n- [ ] Keys rotated if they were ever pasted into a chat, a log or an issue.',
      it: 'Sicurezza rinforzata, prima del lancio:\n\n- [ ] Autenticazione a due fattori su ogni account di produzione (GitHub, hosting, database, registrar del dominio, email).\n- [ ] Secret scanning e push protection attivi; nessun alert Dependabot aperto di gravità alta.\n- [ ] Row-level security verificata su ogni tabella, con l\'advisor del database se ne ha uno.\n- [ ] Una `/security-review` dell\'intero branch `main`, con i rilievi corretti o accettati per iscritto.\n- [ ] Chiavi ruotate se sono mai state incollate in una chat, un log o una issue.',
    },
    { at: /^## (Step|Passo) 7 — /, kind: 'choice', pos: 'start', tool: 'sentry' },
  ],
};
