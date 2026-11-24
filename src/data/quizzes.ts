import type { Locale } from '~/lib/i18n';

export type Phase = 'F0' | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8';

export interface QuizQuestion {
  q: string;
  options: string[];
  /** Index into `options`. */
  answer: number;
  /** Shown after answering, right or wrong. */
  why: string;
}

/**
 * End-of-phase self-checks. Same questions, same option order, same answers in every
 * locale (tests/unit/quizzes.test.ts enforces the shape).
 */
export const quizzes: Record<Locale, Record<Phase, QuizQuestion[]>> = {
  en: {
    F0: [
      {
        q: 'When should you use Claude Code instead of the Claude chat?',
        options: ['When the question is short', 'When the output has to live in the repository', 'Only for writing code, never for documents', 'When you want voice mode'],
        answer: 1,
        why: 'The playbook\'s rule: if the output becomes a file, issue, commit or pull request, use Claude Code. Specs and plans count too.',
      },
      {
        q: 'You installed Git, but the terminal says "command not found". What is the most likely fix?',
        options: ['Reinstall Windows', 'Open a new terminal so it picks up the updated PATH', 'Run the command with sudo', 'Install Git a second time'],
        answer: 1,
        why: 'Installers add their folder to PATH, but terminals that were already open keep the old PATH.',
      },
      {
        q: 'What is CLAUDE.md?',
        options: ['A log of everything Claude did', 'A file of instructions Claude Code loads into context at every session', 'A settings file that enforces permissions', 'The project\'s README for humans'],
        answer: 1,
        why: 'CLAUDE.md is loaded as context at the start of each session. It guides Claude but is not enforced configuration: permissions live in settings.json.',
      },
    ],
    F1: [
      {
        q: 'Why does Phase 1 start with dictating, not with technical choices?',
        options: ['Typing is slower', 'To capture the whole idea before technical filters narrow it', 'Because Claude cannot read text', 'To skip the spec'],
        answer: 1,
        why: 'The brain dump captures everything without filters; structure and technical decisions come later.',
      },
      {
        q: 'What does Phase 1 produce?',
        options: ['Working code', 'A raw transcript and a preliminary spec with assumptions and open questions', 'The final architecture', 'A list of GitHub issues'],
        answer: 1,
        why: 'Outputs: docs/00-brain-dump.md and docs/01-preliminary-spec.md.',
      },
      {
        q: 'What has to happen before you move on to Phase 2?',
        options: ['Nothing: it is automatic', 'You approve the preliminary spec (gate G1)', 'Claude merges a pull request', 'You deploy a prototype'],
        answer: 1,
        why: 'Gate G1: Claude stops until you explicitly approve the preliminary spec.',
      },
    ],
    F2: [
      {
        q: 'What is the point of discovery with /wayfinder?',
        options: ['Writing code faster', 'Turning every open decision into a ticket you answer and record before building', 'Choosing a domain name', 'Running the tests'],
        answer: 1,
        why: 'Open decisions left for later get taken silently in the code. Discovery makes them explicit.',
      },
      {
        q: 'How does a skill like /wayfinder avoid filling the context window?',
        options: ['It runs on a different computer', 'Only its short description stays in context; the full instructions load when it is used', 'It deletes old messages', 'It cannot: skills always fill the context'],
        answer: 1,
        why: 'Per the Claude Code docs, a skill\'s body loads only when it is used.',
      },
      {
        q: 'Decision tickets and build phases are…',
        options: ['The same thing with two names', 'Different: one records a decision, the other is a slice of product to build', 'Both created in Phase 5', 'Both optional'],
        answer: 1,
        why: 'Decision tickets close questions; build phases (Phase 4) are vertical slices of implementation.',
      },
    ],
    F3: [
      {
        q: 'What is the role of the product spec after Phase 3?',
        options: ['A draft you can ignore', 'The single source of truth that builds, tests and reviews are checked against', 'A marketing document', 'A list of bugs'],
        answer: 1,
        why: 'Version 1.0 is frozen at gate G3 and becomes the contract for everything that follows.',
      },
      {
        q: 'Where do hard-to-reverse technical decisions get recorded?',
        options: ['In chat messages', 'In ADRs under docs/adr/', 'In commit messages only', 'Nowhere'],
        answer: 1,
        why: 'An ADR records an important decision and its reasoning, so a future session can find it.',
      },
      {
        q: 'Why run an independent critical review of the spec?',
        options: ['To make it longer', 'To find gaps and contradictions before they become code', 'Because GitHub requires it', 'To pick colours'],
        answer: 1,
        why: 'Problems are cheapest to fix on paper, before any build phase depends on them.',
      },
    ],
    F4: [
      {
        q: 'What is a build phase?',
        options: ['A horizontal layer, such as "the whole database"', 'A vertical slice: one issue, one branch, one pull request', 'A week of work', 'A deployment'],
        answer: 1,
        why: 'Each build phase delivers something a user can do, end to end, and is reviewed on its own.',
      },
      {
        q: 'Why keep build phases small?',
        options: ['GitHub limits issue size', 'So each fits in one session and every change stays reviewable and easy to undo', 'To have more issues', 'Claude cannot write long code'],
        answer: 1,
        why: 'Small slices keep the context focused and make each mistake cheap.',
      },
      {
        q: 'How are the dependencies between build phases expressed?',
        options: ['They are not', 'With native "blocked by" links between the issues', 'In a spreadsheet', 'By numbering only'],
        answer: 1,
        why: 'The plan uses GitHub\'s blocked-by links and a dependency graph in docs/04-build-plan.md.',
      },
    ],
    F5: [
      {
        q: 'What can Claude do in plan mode?',
        options: ['Edit any file', 'Read files and explore, then propose a plan, without editing your source', 'Only chat, without reading files', 'Merge pull requests'],
        answer: 1,
        why: 'Per the docs, plan mode allows reads and exploration; source edits wait for your approval.',
      },
      {
        q: 'Why does every phase work on its own branch?',
        options: ['Branches are faster', 'So main always holds a version that passed its checks', 'GitHub requires it', 'To hide the work'],
        answer: 1,
        why: 'If a phase goes wrong, you drop the branch; main stays green.',
      },
      {
        q: 'Your context is getting full and you are switching to an unrelated task. What do you do?',
        options: ['Keep going', 'Write the status into files, then /clear (or /handoff and a fresh session)', 'Restart the computer', 'Delete CLAUDE.md'],
        answer: 1,
        why: 'The docs recommend /clear when switching to unrelated work. The playbook first saves the state in the repository.',
      },
    ],
    F6: [
      {
        q: 'Why is a separate integration phase needed if every build phase was tested?',
        options: ['It is not', 'Phases were tested alone; only now can you check complete journeys against the spec', 'To write more documentation', 'To change the design'],
        answer: 1,
        why: 'Integration checks the product as a whole: journeys, integrations, security and quality.',
      },
      {
        q: 'What is the first step of Phase 6?',
        options: ['Deploy to production', 'Freeze the scope', 'Rewrite the tests', 'Add new features'],
        answer: 1,
        why: 'Freezing the scope stops the target from moving while you validate it.',
      },
      {
        q: 'What decision closes Phase 6?',
        options: ['Which framework to use', 'Go/No-Go for launch (gate G7)', 'The product name', 'The price'],
        answer: 1,
        why: 'Gate G7: you decide whether the product is ready to launch.',
      },
    ],
    F7: [
      {
        q: 'Where should API keys and other secrets live?',
        options: ['In the code, in a constants file', 'In environment variables on the hosting platform, never in the repository', 'In the README', 'In CLAUDE.md'],
        answer: 1,
        why: 'Environment variables keep secrets out of the code and let preview and production use different keys.',
      },
      {
        q: 'What makes a deploy "reversible"?',
        options: ['Deploying on Fridays', 'Backups, a rollback runbook and a tested way back to the previous version', 'Having many users', 'Not using CI/CD'],
        answer: 1,
        why: 'Phase 7 plans backups, rollback and incident response before launch day.',
      },
      {
        q: 'What does DNS do?',
        options: ['Stores your database', 'Links your domain name to the server that hosts the app', 'Runs your tests', 'Encrypts your code'],
        answer: 1,
        why: 'DNS records point the domain to the hosting provider.',
      },
    ],
    F8: [
      {
        q: 'How do changes enter the product after launch?',
        options: ['Directly on main, to be fast', 'Through the same loop: issue, plan, tests, review, merge', 'Only through hotfixes', 'By editing production'],
        answer: 1,
        why: 'Gates G5 and G6 apply to every change; G3–G4 in a reduced form for new features.',
      },
      {
        q: 'What is /triage used for?',
        options: ['Deploying', 'Sorting incoming bugs, feedback and requests', 'Writing tests', 'Configuring DNS'],
        answer: 1,
        why: 'Triage turns raw input into categorised, prioritised issues.',
      },
      {
        q: 'Why keep a CHANGELOG and versioned releases?',
        options: ['Search engines require it', 'So you and your users know what changed and can go back to a known version', 'To slow down releases', 'They are optional decoration'],
        answer: 1,
        why: 'Versions (SemVer) and a changelog make every release traceable.',
      },
    ],
  },
  it: {
    F0: [
      {
        q: 'Quando usare Claude Code invece della chat di Claude?',
        options: ['Quando la domanda è breve', 'Quando l\'output deve vivere nel repository', 'Solo per scrivere codice, mai per documenti', 'Quando vuoi la modalità vocale'],
        answer: 1,
        why: 'La regola del playbook: se l\'output diventa un file, una issue, un commit o una pull request, usa Claude Code. Valgono anche spec e piani.',
      },
      {
        q: 'Hai installato Git, ma il terminale dice "comando non trovato". Qual è la soluzione più probabile?',
        options: ['Reinstallare Windows', 'Aprire un terminale nuovo, che legga il PATH aggiornato', 'Eseguire il comando con sudo', 'Installare Git una seconda volta'],
        answer: 1,
        why: 'Gli installer aggiungono la loro cartella al PATH, ma i terminali già aperti mantengono il PATH vecchio.',
      },
      {
        q: 'Cos\'è CLAUDE.md?',
        options: ['Un registro di tutto ciò che Claude ha fatto', 'Un file di istruzioni che Claude Code carica nel contesto a ogni sessione', 'Un file di impostazioni che impone i permessi', 'Il README del progetto per le persone'],
        answer: 1,
        why: 'CLAUDE.md viene caricato come contesto all\'inizio di ogni sessione. Guida Claude ma non è configurazione vincolante: i permessi stanno in settings.json.',
      },
    ],
    F1: [
      {
        q: 'Perché la Fase 1 parte dalla dettatura e non dalle scelte tecniche?',
        options: ['Scrivere è più lento', 'Per catturare tutta l\'idea prima che i filtri tecnici la restringano', 'Perché Claude non sa leggere il testo', 'Per saltare la spec'],
        answer: 1,
        why: 'Il brain dump raccoglie tutto senza filtri; struttura e decisioni tecniche arrivano dopo.',
      },
      {
        q: 'Cosa produce la Fase 1?',
        options: ['Codice funzionante', 'Una trascrizione grezza e una spec preliminare con ipotesi e domande aperte', 'L\'architettura definitiva', 'Un elenco di issue GitHub'],
        answer: 1,
        why: 'Output: docs/00-brain-dump.md e docs/01-preliminary-spec.md.',
      },
      {
        q: 'Cosa deve succedere prima di passare alla Fase 2?',
        options: ['Niente: è automatico', 'Approvi la spec preliminare (gate G1)', 'Claude fa il merge di una pull request', 'Pubblichi un prototipo'],
        answer: 1,
        why: 'Gate G1: Claude si ferma finché non approvi esplicitamente la spec preliminare.',
      },
    ],
    F2: [
      {
        q: 'Qual è lo scopo della discovery con /wayfinder?',
        options: ['Scrivere codice più in fretta', 'Trasformare ogni decisione aperta in un ticket a cui rispondi e che registri prima di costruire', 'Scegliere il nome di dominio', 'Eseguire i test'],
        answer: 1,
        why: 'Le decisioni rimandate vengono prese in silenzio nel codice. La discovery le rende esplicite.',
      },
      {
        q: 'Come fa una skill come /wayfinder a non riempire la finestra di contesto?',
        options: ['Gira su un altro computer', 'Nel contesto resta solo la breve descrizione; le istruzioni complete si caricano quando viene usata', 'Cancella i messaggi vecchi', 'Non può: le skill riempiono sempre il contesto'],
        answer: 1,
        why: 'Secondo la documentazione di Claude Code, il corpo di una skill si carica solo quando viene usata.',
      },
      {
        q: 'Decision ticket e build phase sono…',
        options: ['La stessa cosa con due nomi', 'Diversi: uno registra una decisione, l\'altro è una fetta di prodotto da costruire', 'Entrambi creati nella Fase 5', 'Entrambi facoltativi'],
        answer: 1,
        why: 'I decision ticket chiudono domande; le build phase (Fase 4) sono fette verticali di implementazione.',
      },
    ],
    F3: [
      {
        q: 'Che ruolo ha la spec di prodotto dopo la Fase 3?',
        options: ['Una bozza che si può ignorare', 'L\'unica fonte di verità rispetto a cui si verificano build, test e review', 'Un documento di marketing', 'Un elenco di bug'],
        answer: 1,
        why: 'La versione 1.0 viene congelata al gate G3 e diventa il contratto per tutto ciò che segue.',
      },
      {
        q: 'Dove si registrano le decisioni tecniche difficili da annullare?',
        options: ['Nei messaggi in chat', 'Negli ADR in docs/adr/', 'Solo nei messaggi di commit', 'Da nessuna parte'],
        answer: 1,
        why: 'Un ADR registra una decisione importante e il suo perché, così una sessione futura può ritrovarla.',
      },
      {
        q: 'Perché fare una review critica indipendente della spec?',
        options: ['Per allungarla', 'Per trovare lacune e contraddizioni prima che diventino codice', 'Perché GitHub lo richiede', 'Per scegliere i colori'],
        answer: 1,
        why: 'I problemi costano meno se corretti sulla carta, prima che una build phase ne dipenda.',
      },
    ],
    F4: [
      {
        q: 'Cos\'è una build phase?',
        options: ['Uno strato orizzontale, come "tutto il database"', 'Una fetta verticale: una issue, un branch, una pull request', 'Una settimana di lavoro', 'Un deploy'],
        answer: 1,
        why: 'Ogni build phase consegna qualcosa che un utente può fare, dall\'inizio alla fine, e viene revisionata da sola.',
      },
      {
        q: 'Perché tenere piccole le build phase?',
        options: ['GitHub limita la dimensione delle issue', 'Perché ognuna stia in una sessione e ogni modifica resti revisionabile e facile da annullare', 'Per avere più issue', 'Claude non sa scrivere codice lungo'],
        answer: 1,
        why: 'Fette piccole mantengono il contesto focalizzato e rendono ogni errore economico.',
      },
      {
        q: 'Come si esprimono le dipendenze tra build phase?',
        options: ['Non si esprimono', 'Con i link nativi "blocked by" tra le issue', 'In un foglio di calcolo', 'Solo con la numerazione'],
        answer: 1,
        why: 'Il piano usa i link blocked-by di GitHub e un grafo delle dipendenze in docs/04-build-plan.md.',
      },
    ],
    F5: [
      {
        q: 'Cosa può fare Claude in plan mode?',
        options: ['Modificare qualsiasi file', 'Leggere i file ed esplorare, poi proporre un piano, senza modificare il codice', 'Solo chattare, senza leggere file', 'Fare il merge delle pull request'],
        answer: 1,
        why: 'Secondo la documentazione, il plan mode consente letture ed esplorazione; le modifiche aspettano la tua approvazione.',
      },
      {
        q: 'Perché ogni fase lavora su un branch proprio?',
        options: ['I branch sono più veloci', 'Perché main contenga sempre una versione che ha superato i controlli', 'GitHub lo richiede', 'Per nascondere il lavoro'],
        answer: 1,
        why: 'Se una fase va male, abbandoni il branch; main resta verde.',
      },
      {
        q: 'Il contesto si sta riempiendo e passi a un compito non collegato. Cosa fai?',
        options: ['Vai avanti', 'Scrivi lo stato nei file, poi /clear (oppure /handoff e una sessione nuova)', 'Riavvii il computer', 'Cancelli CLAUDE.md'],
        answer: 1,
        why: 'La documentazione consiglia /clear quando passi a un lavoro non collegato. Il playbook prima salva lo stato nel repository.',
      },
    ],
    F6: [
      {
        q: 'Perché serve una fase di integrazione se ogni build phase è stata testata?',
        options: ['Non serve', 'Le fasi sono state testate da sole; solo ora puoi verificare i percorsi completi rispetto alla spec', 'Per scrivere più documentazione', 'Per cambiare il design'],
        answer: 1,
        why: 'L\'integrazione verifica il prodotto nel suo insieme: percorsi, integrazioni, sicurezza e qualità.',
      },
      {
        q: 'Qual è il primo passo della Fase 6?',
        options: ['Deploy in produzione', 'Congelare lo scope', 'Riscrivere i test', 'Aggiungere funzionalità'],
        answer: 1,
        why: 'Congelare lo scope impedisce all\'obiettivo di spostarsi mentre lo validi.',
      },
      {
        q: 'Quale decisione chiude la Fase 6?',
        options: ['Quale framework usare', 'Go/No-Go per il lancio (gate G7)', 'Il nome del prodotto', 'Il prezzo'],
        answer: 1,
        why: 'Gate G7: decidi se il prodotto è pronto per il lancio.',
      },
    ],
    F7: [
      {
        q: 'Dove devono stare le chiavi API e gli altri segreti?',
        options: ['Nel codice, in un file di costanti', 'Nelle variabili d\'ambiente della piattaforma di hosting, mai nel repository', 'Nel README', 'In CLAUDE.md'],
        answer: 1,
        why: 'Le variabili d\'ambiente tengono i segreti fuori dal codice e permettono a preview e produzione di usare chiavi diverse.',
      },
      {
        q: 'Cosa rende un deploy "reversibile"?',
        options: ['Fare deploy il venerdì', 'Backup, un runbook di rollback e un modo provato per tornare alla versione precedente', 'Avere molti utenti', 'Non usare la CI/CD'],
        answer: 1,
        why: 'La Fase 7 pianifica backup, rollback e gestione degli incidenti prima del giorno del lancio.',
      },
      {
        q: 'Cosa fa il DNS?',
        options: ['Conserva il database', 'Collega il nome di dominio al server che ospita l\'app', 'Esegue i test', 'Cifra il codice'],
        answer: 1,
        why: 'I record DNS puntano il dominio verso il provider di hosting.',
      },
    ],
    F8: [
      {
        q: 'Come entrano le modifiche nel prodotto dopo il lancio?',
        options: ['Direttamente su main, per fare in fretta', 'Attraverso lo stesso ciclo: issue, piano, test, review, merge', 'Solo con hotfix', 'Modificando la produzione'],
        answer: 1,
        why: 'I gate G5 e G6 valgono per ogni modifica; G3–G4 in forma ridotta per le nuove funzionalità.',
      },
      {
        q: 'A cosa serve /triage?',
        options: ['A fare deploy', 'A smistare bug, feedback e richieste in arrivo', 'A scrivere test', 'A configurare il DNS'],
        answer: 1,
        why: 'Il triage trasforma l\'input grezzo in issue categorizzate e con priorità.',
      },
      {
        q: 'Perché tenere un CHANGELOG e release con versione?',
        options: ['Lo richiedono i motori di ricerca', 'Perché tu e i tuoi utenti sappiate cosa è cambiato e possiate tornare a una versione nota', 'Per rallentare i rilasci', 'Sono decorazione facoltativa'],
        answer: 1,
        why: 'Le versioni (SemVer) e un changelog rendono tracciabile ogni rilascio.',
      },
    ],
  },
};
