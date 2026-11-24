/**
 * Text for the "Customize guide" panel and the tool-choice callouts, in both locales.
 * The allowed values and recommended defaults live in src/lib/prefs.ts; this file only words them.
 *
 * Desktop-app facts were checked against code.claude.com/docs/en/desktop and desktop-quickstart
 * on 2026-11-24.
 */
import type { Axis, Tool } from '~/lib/prefs';
import type { Locale } from '~/lib/i18n';

export interface OptionText {
  label: string;
  summary: string;
  pros: string[];
  cons: string[];
}

export interface AxisText {
  label: string;
  question: string;
  options: Record<string, OptionText>;
}

export interface ToolText {
  name: string;
  role: string;
  /** Pros and cons of using the tool. */
  use: { pros: string[]; cons: string[] };
  /** Pros and cons of leaving it out. */
  skip: { pros: string[]; cons: string[] };
  /** What to do instead when it is left out. */
  instead: string;
}

type Texts = { axes: Record<Axis, AxisText>; tools: Record<Tool, ToolText> };

const en: Texts = {
  axes: {
    surface: {
      label: 'Where you run Claude Code',
      question: 'Do you work in a terminal or in the Claude desktop app?',
      options: {
        terminal: {
          label: 'Terminal',
          summary: 'The `claude` command in a terminal, ideally the one built into VS Code.',
          pros: ['Every command in this playbook works as written', 'Same setup on Windows, macOS and Linux', 'Scripting and automation (`claude -p`) when you need it'],
          cons: ['A text interface: diffs and previews are less visual', 'You install Node.js and the CLI yourself'],
        },
        desktop: {
          label: 'Desktop app',
          summary: 'The Code tab of the Claude desktop app, with a visual diff, a built-in terminal and an app preview.',
          pros: ['No Node.js or CLI install needed for Claude Code itself', 'Visual diffs you can comment on line by line', 'Built-in terminal and a Browser pane that previews your app'],
          cons: ['A few terminal-only commands reply "isn\'t available in this environment"', 'No scripting (`--print`); Linux support is a Debian/Ubuntu beta'],
        },
      },
    },
    level: {
      label: 'Level of detail',
      question: 'How much explanation do you want along the way?',
      options: {
        guided: {
          label: 'Guided',
          summary: 'First project with code: every "Under the hood" panel opens by itself, and extra tips appear.',
          pros: ['You understand each step before doing it', 'Fewer surprises when something goes wrong'],
          cons: ['Longer pages', 'Slower if you already know Git and the terminal'],
        },
        standard: {
          label: 'Standard',
          summary: 'The playbook as written: explanations are there, folded until you open them.',
          pros: ['Complete method without noise', 'Open the panels only where you need them'],
          cons: ['You choose when to dig deeper'],
        },
        expert: {
          label: 'Expert',
          summary: 'Hides "Why this step", "Under the hood" and the quizzes: only the steps and the commands.',
          pros: ['The shortest path through each phase', 'Good as a checklist once you know the method'],
          cons: ['The reasons behind the steps are hidden', 'Easy to skip a safeguard without noticing'],
        },
      },
    },
    security: {
      label: 'Security',
      question: 'How strict should the guide be about security?',
      options: {
        baseline: {
          label: 'Baseline',
          summary: 'The playbook\'s own safeguards: approval gates, secrets in .env, reviews before merging.',
          pros: ['Enough for prototypes and products without sensitive data', 'No extra steps beyond the method'],
          cons: ['No dedicated security pass on each build phase'],
        },
        hardened: {
          label: 'Hardened',
          summary: 'Adds deny rules for secrets, a security review every build phase, dependency audits and a pre-launch security checklist.',
          pros: ['Right for accounts, payments or personal data', 'Catches leaked keys and risky dependencies early'],
          cons: ['More steps and more time per phase', 'More prompts to approve'],
        },
      },
    },
    focus: {
      label: 'Design or function',
      question: 'Where should the effort go: how it looks, or what it does?',
      options: {
        function: {
          label: 'Function first',
          summary: 'Skip mockups, use a ready-made component library, polish later.',
          pros: ['Reach a working product sooner', 'Good for internal tools and early validation'],
          cons: ['First impressions suffer', 'Redesigning later costs more than designing once'],
        },
        balanced: {
          label: 'Balanced',
          summary: 'The playbook as written: mockups when the interface matters, then build.',
          pros: ['A clean, consistent interface without a design phase of its own'],
          cons: ['Not a distinctive visual identity'],
        },
        polish: {
          label: 'Polished',
          summary: 'Adds a design system, a visual design pass and an accessibility review.',
          pros: ['A product that feels finished', 'Accessibility checked, not assumed'],
          cons: ['More time before the first working version', 'More decisions to approve'],
        },
      },
    },
    deps: {
      label: 'Dependencies',
      question: 'How many libraries and services are you comfortable with?',
      options: {
        lean: {
          label: 'Lean',
          summary: 'Prefer what the framework and the platform already give you; every new package must be justified.',
          pros: ['Fewer updates, fewer vulnerabilities, smaller bills', 'Easier to understand the whole project'],
          cons: ['You write some things a library would give you', 'Slower for features like auth or payments'],
        },
        standard: {
          label: 'Standard',
          summary: 'The playbook\'s stack: well-known libraries and managed services where they save time.',
          pros: ['Fastest route to a complete product', 'Popular tools: Claude knows them well'],
          cons: ['More accounts, more updates to follow'],
        },
      },
    },
  },
  tools: {
    github: {
      name: 'GitHub',
      role: 'Stores the code online, with issues, pull requests and automatic checks.',
      use: { pros: ['Backup of every version', 'Pull requests: review before anything reaches main', 'Free for private repositories'], cons: ['One more account', 'You learn branches and pull requests'] },
      skip: { pros: ['Everything stays on your computer'], cons: ['No backup if the disk fails', 'No pull requests, CI or Vercel auto-deploys'] },
      instead: 'Keep using Git locally: ask Claude to work on a branch and merge it with `git merge` after your review, and back up the folder regularly. The issue-based steps become a Markdown file (`docs/backlog.md`).',
    },
    vercel: {
      name: 'Vercel',
      role: 'Hosts the web app and deploys every push automatically.',
      use: { pros: ['A preview link for every pull request', 'Free hobby plan', 'Zero server setup'], cons: ['Hobby plan is for non-commercial use', 'Costs grow with traffic'] },
      skip: { pros: ['No vendor lock-in', 'Choose a host that fits your stack or budget'], cons: ['You configure builds and previews yourself'] },
      instead: 'Pick another host (Netlify, Cloudflare Pages, Render, or your own server) in Phase 3 and record it in the architecture document. Ask Claude to adapt the deploy steps of Phase 7 to it.',
    },
    supabase: {
      name: 'Supabase',
      role: 'Database, sign-in and file storage as a managed service.',
      use: { pros: ['Postgres, auth and storage in one place', 'Free plan for development'], cons: ['Free projects pause after a week without activity', 'Row-level security is on you to get right'] },
      skip: { pros: ['No database if your product does not need one', 'Fewer moving parts'], cons: ['Accounts and saved data need another solution'] },
      instead: 'If you need data, choose another database in Phase 3 (a managed Postgres, SQLite, or your platform\'s storage). If you do not, skip the database steps: a landing page or a static site does not need one.',
    },
    sentry: {
      name: 'Sentry',
      role: 'Records errors that happen in production, with the stack trace.',
      use: { pros: ['You hear about bugs before users report them', 'Free developer plan'], cons: ['Another script in your app', 'Must be configured not to collect personal data'] },
      skip: { pros: ['No third-party error tracking'], cons: ['You discover production errors from users or logs'] },
      instead: 'Rely on your host\'s logs (Vercel has runtime logs) and a clear "report a problem" link. Add error tracking later if the product grows.',
    },
    docker: {
      name: 'Docker',
      role: 'Runs the app and its services in containers, identical on every computer.',
      use: { pros: ['Same environment everywhere', 'Run a local database without installing it'], cons: ['Heavy on Windows and macOS', 'Another layer to learn and debug'] },
      skip: { pros: ['Simpler setup: managed services do the work', 'Nothing extra running on your computer'], cons: ['Local and production can differ slightly'] },
      instead: 'This is the playbook\'s default: use managed services for the database and hosting. Turn Docker on if your product needs a self-hosted service or you deploy to your own server.',
    },
    ai: {
      name: 'AI features',
      role: 'Your product itself calls an AI model: a chatbot, summaries, extraction, an agent.',
      use: { pros: ['Features that were out of reach a few years ago', 'The guide adds evals, key safety and spend limits'], cons: ['Answers vary: you need an eval set, not just unit tests', 'Every call costs money and can be abused'] },
      skip: { pros: ['No model costs, no prompt injection, no evals to maintain', 'Behaviour is predictable and easy to test'], cons: ['Nothing, if your product does not need it'] },
      instead: 'Build without AI features: Claude still writes the code. If you add one later, turn this on and the extra steps appear in Phases 3, 5, 7 and 8.',
    },
  },
};

const it: Texts = {
  axes: {
    surface: {
      label: 'Dove usi Claude Code',
      question: 'Lavori in un terminale o nell\'app desktop di Claude?',
      options: {
        terminal: {
          label: 'Terminale',
          summary: 'Il comando `claude` in un terminale, meglio se quello integrato in VS Code.',
          pros: ['Ogni comando del playbook funziona così com\'è scritto', 'Stessa configurazione su Windows, macOS e Linux', 'Script e automazione (`claude -p`) quando servono'],
          cons: ['Interfaccia testuale: diff e anteprime meno visivi', 'Installi tu Node.js e la CLI'],
        },
        desktop: {
          label: 'App desktop',
          summary: 'La scheda Code dell\'app desktop di Claude, con diff visivo, terminale integrato e anteprima dell\'app.',
          pros: ['Per Claude Code non servono Node.js né la CLI', 'Diff visivi da commentare riga per riga', 'Terminale integrato e pannello Browser con l\'anteprima dell\'app'],
          cons: ['Alcuni comandi solo da terminale rispondono "isn\'t available in this environment"', 'Niente script (`--print`); su Linux è una beta per Debian/Ubuntu'],
        },
      },
    },
    level: {
      label: 'Livello di dettaglio',
      question: 'Quante spiegazioni vuoi lungo il percorso?',
      options: {
        guided: {
          label: 'Guidato',
          summary: 'Primo progetto con il codice: ogni pannello "Dietro le quinte" si apre da solo e compaiono consigli in più.',
          pros: ['Capisci ogni passo prima di farlo', 'Meno sorprese quando qualcosa va storto'],
          cons: ['Pagine più lunghe', 'Più lento se conosci già Git e il terminale'],
        },
        standard: {
          label: 'Standard',
          summary: 'Il playbook così com\'è: le spiegazioni ci sono, chiuse finché non le apri.',
          pros: ['Metodo completo senza rumore', 'Apri i pannelli solo dove ti servono'],
          cons: ['Decidi tu quando approfondire'],
        },
        expert: {
          label: 'Esperto',
          summary: 'Nasconde "Perché questo passo", "Dietro le quinte" e i quiz: solo passi e comandi.',
          pros: ['Il percorso più breve in ogni fase', 'Utile come checklist quando conosci il metodo'],
          cons: ['Le ragioni dei passi restano nascoste', 'Facile saltare una protezione senza accorgersene'],
        },
      },
    },
    security: {
      label: 'Sicurezza',
      question: 'Quanto deve essere rigorosa la guida sulla sicurezza?',
      options: {
        baseline: {
          label: 'Base',
          summary: 'Le protezioni del playbook: gate di approvazione, segreti in .env, review prima del merge.',
          pros: ['Sufficiente per prototipi e prodotti senza dati sensibili', 'Nessun passo in più oltre al metodo'],
          cons: ['Nessun controllo di sicurezza dedicato a ogni build phase'],
        },
        hardened: {
          label: 'Rinforzata',
          summary: 'Aggiunge regole deny per i segreti, una security review a ogni build phase, audit delle dipendenze e una checklist di sicurezza prima del lancio.',
          pros: ['Adatta ad account, pagamenti o dati personali', 'Intercetta presto chiavi esposte e dipendenze rischiose'],
          cons: ['Più passi e più tempo per fase', 'Più richieste da approvare'],
        },
      },
    },
    focus: {
      label: 'Design o funzionalità',
      question: 'Dove va l\'impegno: nell\'aspetto o in quello che fa?',
      options: {
        function: {
          label: 'Prima la funzione',
          summary: 'Niente mockup, una libreria di componenti pronta, la cura estetica dopo.',
          pros: ['Arrivi prima a un prodotto funzionante', 'Adatto a strumenti interni e prime validazioni'],
          cons: ['La prima impressione ne risente', 'Ridisegnare dopo costa più che disegnare una volta'],
        },
        balanced: {
          label: 'Bilanciato',
          summary: 'Il playbook così com\'è: mockup quando l\'interfaccia conta, poi si costruisce.',
          pros: ['Un\'interfaccia pulita e coerente senza una fase di design a parte'],
          cons: ['Non un\'identità visiva distintiva'],
        },
        polish: {
          label: 'Curato',
          summary: 'Aggiunge un design system, un passaggio di design visivo e una review di accessibilità.',
          pros: ['Un prodotto che sembra finito', 'Accessibilità verificata, non presunta'],
          cons: ['Più tempo prima della prima versione funzionante', 'Più decisioni da approvare'],
        },
      },
    },
    deps: {
      label: 'Dipendenze',
      question: 'Quante librerie e servizi sei disposto a gestire?',
      options: {
        lean: {
          label: 'Essenziali',
          summary: 'Preferisci ciò che framework e piattaforma già offrono; ogni nuovo pacchetto va giustificato.',
          pros: ['Meno aggiornamenti, meno vulnerabilità, costi più bassi', 'Più facile capire tutto il progetto'],
          cons: ['Scrivi alcune cose che una libreria ti darebbe', 'Più lento per funzioni come login o pagamenti'],
        },
        standard: {
          label: 'Standard',
          summary: 'Lo stack del playbook: librerie note e servizi gestiti dove fanno risparmiare tempo.',
          pros: ['La strada più rapida verso un prodotto completo', 'Strumenti diffusi: Claude li conosce bene'],
          cons: ['Più account, più aggiornamenti da seguire'],
        },
      },
    },
  },
  tools: {
    github: {
      name: 'GitHub',
      role: 'Conserva il codice online, con issue, pull request e controlli automatici.',
      use: { pros: ['Backup di ogni versione', 'Pull request: review prima che qualcosa arrivi su main', 'Gratis per i repository privati'], cons: ['Un account in più', 'Devi imparare branch e pull request'] },
      skip: { pros: ['Tutto resta sul tuo computer'], cons: ['Nessun backup se il disco si rompe', 'Niente pull request, CI o deploy automatici su Vercel'] },
      instead: 'Continua a usare Git in locale: chiedi a Claude di lavorare su un branch e fai il merge con `git merge` dopo la tua review, e fai backup regolari della cartella. I passi basati sulle issue diventano un file Markdown (`docs/backlog.md`).',
    },
    vercel: {
      name: 'Vercel',
      role: 'Ospita la web app e pubblica automaticamente ogni push.',
      use: { pros: ['Un link di anteprima per ogni pull request', 'Piano hobby gratuito', 'Nessun server da configurare'], cons: ['Il piano hobby è per uso non commerciale', 'I costi crescono con il traffico'] },
      skip: { pros: ['Nessun vendor lock-in', 'Scegli un hosting adatto al tuo stack o budget'], cons: ['Build e anteprime le configuri tu'] },
      instead: 'Scegli un altro hosting (Netlify, Cloudflare Pages, Render o un tuo server) nella Fase 3 e annotalo nel documento di architettura. Chiedi a Claude di adattare a quello i passi di deploy della Fase 7.',
    },
    supabase: {
      name: 'Supabase',
      role: 'Database, login e archiviazione file come servizio gestito.',
      use: { pros: ['Postgres, autenticazione e storage in un unico posto', 'Piano gratuito per lo sviluppo'], cons: ['I progetti gratuiti vanno in pausa dopo una settimana di inattività', 'La row-level security devi impostarla bene tu'] },
      skip: { pros: ['Nessun database se il prodotto non ne ha bisogno', 'Meno parti in movimento'], cons: ['Account e dati salvati richiedono un\'altra soluzione'] },
      instead: 'Se ti servono dati, scegli un altro database nella Fase 3 (un Postgres gestito, SQLite o lo storage della tua piattaforma). Se non ti servono, salta i passi sul database: una landing page o un sito statico non ne hanno bisogno.',
    },
    sentry: {
      name: 'Sentry',
      role: 'Registra gli errori che avvengono in produzione, con lo stack trace.',
      use: { pros: ['Scopri i bug prima che li segnalino gli utenti', 'Piano developer gratuito'], cons: ['Uno script in più nell\'app', 'Va configurato per non raccogliere dati personali'] },
      skip: { pros: ['Nessun tracciamento errori di terze parti'], cons: ['Scopri gli errori in produzione dagli utenti o dai log'] },
      instead: 'Affidati ai log del tuo hosting (Vercel ha i runtime log) e a un link chiaro "segnala un problema". Aggiungi il tracciamento errori più avanti, se il prodotto cresce.',
    },
    docker: {
      name: 'Docker',
      role: 'Esegue l\'app e i suoi servizi in container, identici su ogni computer.',
      use: { pros: ['Lo stesso ambiente ovunque', 'Un database locale senza installarlo'], cons: ['Pesante su Windows e macOS', 'Un livello in più da imparare e da correggere'] },
      skip: { pros: ['Configurazione più semplice: lavorano i servizi gestiti', 'Niente di extra in esecuzione sul tuo computer'], cons: ['Ambiente locale e produzione possono differire un po\''] },
      instead: 'È la scelta predefinita del playbook: usa servizi gestiti per database e hosting. Attiva Docker se il prodotto richiede un servizio self-hosted o se pubblichi su un tuo server.',
    },
    ai: {
      name: 'Funzioni di IA',
      role: 'Il prodotto stesso chiama un modello di IA: un chatbot, riassunti, estrazione di dati, un agente.',
      use: { pros: ['Funzioni impensabili fino a pochi anni fa', 'La guida aggiunge eval, protezione delle chiavi e limiti di spesa'], cons: ['Le risposte variano: serve un set di eval, non bastano i test unitari', 'Ogni chiamata costa e può essere abusata'] },
      skip: { pros: ['Nessun costo di modello, nessuna prompt injection, nessuna eval da mantenere', 'Comportamento prevedibile e facile da testare'], cons: ['Nessuno, se il prodotto non ne ha bisogno'] },
      instead: 'Costruisci senza funzioni di IA: il codice lo scrive comunque Claude. Se ne aggiungi una più avanti, attiva questa opzione e i passi in più compaiono nelle Fasi 3, 5, 7 e 8.',
    },
  },
};

export const prefsText: Record<Locale, Texts> = { en, it };
