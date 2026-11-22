import { EMAIL, LINKS, type LinkName, RESUME_URL, TIME_ZONE } from '../../config/site';
import { bright, cmd, dim, escapeHtml, link } from './format';
import { PROJECTS } from './projects';

/** What a command prints: one line of HTML or several. An empty string prints nothing. */
export type Output = string | string[];
export type Command = (args: string[]) => Output;

/** The bits of the terminal a command may touch. */
export interface TerminalContext {
  close: () => void;
  history: readonly string[];
  /** Width of the output area in pixels, to drop wide art on a phone. */
  outputWidth: () => number;
}

/** Shown by `help`, in this order. Some commands are left out on purpose. */
const HELP: [usage: string, description: string][] = [
  ['whoami', 'the short version'],
  ['about', 'the longer version'],
  ['ls', 'list projects'],
  ['cat <project>', 'read about one'],
  ['open <project>', 'open its link'],
  ['work', 'where I work'],
  ['skills', 'what I use'],
  ['resume', 'open my resume'],
  ['contact', 'how to reach me'],
  ['neofetch', 'system info, sort of'],
  ['binary <text>', 'say it in 0s and 1s'],
  ['clear', 'clear the screen'],
  ['exit', 'close the terminal'],
];

export const ALIASES: Record<string, string> = {
  ll: 'ls',
  dir: 'ls',
  cd: 'ls',
  projects: 'ls',
  man: 'help',
  '?': 'help',
  email: 'contact',
  socials: 'contact',
  hire: 'contact',
  cv: 'resume',
  quit: 'exit',
  q: 'exit',
};

const NEOFETCH_LOGO = [
  String.raw`     _ ____   ____ `,
  String.raw`    | / ___| / ___|`,
  String.raw` _  | \___ \| |    `,
  String.raw`| |_| |___) | |___ `,
  String.raw` \___/|____/ \____|`,
  String.raw`                   `,
];

const openInNewTab = (href: string): void => {
  window.open(href, '_blank', 'noopener');
};

export function createCommands(ctx: TerminalContext): Record<string, Command> {
  const commands: Record<string, Command> = {
    help: () => [
      'commands:',
      ...HELP.map(
        ([usage, description]) => `  ${cmd(usage.split(' ')[0], usage.padEnd(15))} ${dim(description)}`,
      ),
      '',
      dim('tab completes, ↑ ↓ walk the history, esc closes. some commands are not listed.'),
    ],

    whoami: () =>
      `${bright('jappreet singh chhabra')} ${dim('·')} backend engineer, SDE II at HashedIn by Deloitte, Bengaluru.`,

    about: () => [
      'I studied computer science at JECRC University, Jaipur (CGPA 9.24), and spent the',
      'evenings on ICPC problems. Now I build backend systems that stay correct when two',
      'requests land at once: approval workflows, device sync, access control.',
      '',
      'Outside work I build things to understand them: a spreadsheet engine for dependency',
      'graphs, my own Git for how commits work, a sketchboard for web sockets.',
      '',
      `try ${cmd('ls')} or ${cmd('work')}`,
    ],

    ls: (args) => {
      const dir = args[0];
      if (dir && dir !== 'projects' && dir !== '~/projects') {
        return `ls: ${escapeHtml(dir)}: no such directory. try ${cmd('ls')}`;
      }
      return [
        dim('~/projects'),
        ...Object.values(PROJECTS).map(
          (p) => `  ${cmd(`cat ${p.name}`, p.name.padEnd(14))} ${p.title} ${dim(p.year)}`,
        ),
        '',
        dim('41 public repos in all: ') + link('github.com/japp47', `${LINKS.github}?tab=repositories`),
      ];
    },

    cat: (args) => {
      if (!args[0]) return `usage: cat <project>. see ${cmd('ls')}`;
      const project = PROJECTS[args[0].replace(/\.md$/, '').toLowerCase()];
      if (!project) return `cat: ${escapeHtml(args[0])}: no such file. see ${cmd('ls')}`;
      return [
        `${bright(`# ${project.title}`)} ${dim(project.year)}`,
        dim(project.stack),
        '',
        ...project.lines,
        '',
        project.links.map(([label, href]) => link(label, href)).join('  '),
      ];
    },

    open: (args) => {
      const name = (args[0] ?? '').toLowerCase();
      const href = PROJECTS[name]?.links[0][1] ?? LINKS[name as LinkName];
      if (!href) return `open: what should I open? try ${cmd('open 99ile')} or ${cmd('open github')}`;
      openInNewTab(href);
      return dim(`opening ${escapeHtml(href)} …`);
    },

    work: () => [
      `${bright('HashedIn by Deloitte')} ${dim('· Bengaluru')}`,
      '',
      `  SDE II ${dim('· Jun 2026 → now · Zora AI, accounts payable')}`,
      '    invoice approvals on Temporal: quorum rules, escalation, one-click email approval,',
      '    OpenFGA access checks, fail-closed SAP validations, first decision wins in Postgres.',
      '',
      `  SDE I  ${dim('· May 2025 → Jun 2026 · MPI New Zealand, trade certification')}`,
      '    cached 8,400+ field combinations: 80% fewer DB calls, p95 from 45 s to ~5 s.',
      '    two-level authorization on Cedar for 12+ roles.',
      '',
      dim('awards: Top Impactor, Spot Excellence (2025)'),
    ],

    skills: () => [
      '  languages   Python, Go, TypeScript, SQL, Java, JavaScript',
      '  backend     FastAPI, Fastify, Node.js, Spring Boot, GraphQL, REST',
      '  data        PostgreSQL, Redis, DynamoDB, MongoDB, SQLite, RabbitMQ',
      '  infra       AWS, Temporal, Docker, Cosmos DB, SST/CDK',
      '  access      OpenFGA, Cedar, OAuth 2.0, Keycloak',
      '  ai          Ollama, MCP, LangChain, LangGraph, RAG',
    ],

    resume: () => {
      openInNewTab(RESUME_URL);
      return `opening the resume … ${link('Jappreet-Chhabra-Resume.pdf', RESUME_URL)}`;
    },

    contact: () => [
      `email     ${link(EMAIL, LINKS.email)}`,
      `github    ${link('japp47', LINKS.github)}`,
      `linkedin  ${link('jappreetchhabra', LINKS.linkedin)}`,
      `leetcode  ${link('jappreets4747', LINKS.leetcode)} ${dim('· 900+ problems')}`,
      `resume    ${link('pdf', LINKS.resume)}`,
      '',
      dim('I reply within a day.'),
    ],

    neofetch: () => {
      const info = [
        bright('jappreet@bengaluru'),
        dim('------------------'),
        'role     backend engineer',
        'at       HashedIn by Deloitte',
        `since    2021 ${dim('(first line of C++)')}`,
        'kernel   math first, then code',
        `shell    ${cmd('help')}`,
      ];
      if (ctx.outputWidth() < 560) return info; // no room for the logo on a phone
      const logo = NEOFETCH_LOGO.map(escapeHtml);
      return [
        ...logo.map((line, i) => `${dim(line)}   ${info[i] ?? ''}`),
        ...info.slice(logo.length).map((line) => ' '.repeat(22) + line),
      ];
    },

    binary: (args) =>
      [...(args.join(' ') || 'hi')].map((c) => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' '),

    date: () =>
      new Date().toLocaleString('en-GB', { timeZone: TIME_ZONE, dateStyle: 'full', timeStyle: 'short' }) +
      dim(' · IST'),

    pwd: () => '/home/jappreet',

    echo: (args) => escapeHtml(args.join(' ')),

    history: () => ctx.history.map((line, i) => `${dim(String(i + 1).padStart(3))}  ${escapeHtml(line)}`),

    // --- not in help: small surprises ---------------------------------------------------------
    sudo: (args) =>
      args.join(' ').startsWith('hire')
        ? [
            bright('permission granted.'),
            `starting interview pipeline… just kidding, ${link('email me', `${LINKS.email}?subject=Let's talk`)}`,
          ]
        : 'jappreet is not in the sudoers file. this incident will be reported.',

    rm: (args) =>
      args.includes('-rf')
        ? 'nice try. this portfolio has backups, and I wrote the restore.'
        : 'rm: refusing to remove anything today.',

    matrix: () => {
      dispatchEvent(new Event('field:matrix'));
      return dim('wake up, neo… (look behind the terminal)');
    },

    vim: () => 'you are now stuck in vim. kidding. try :q, or just keep typing here.',
    ':q': () => 'see, not that hard.',

    exit: () => {
      ctx.close();
      return '';
    },
  };

  return commands;
}

/** Words that Tab can complete after `cat` or `open`. */
export const completionTargets = (command: string): string[] =>
  command === 'open'
    ? [...Object.keys(PROJECTS), ...Object.keys(LINKS)]
    : command === 'cat'
      ? Object.keys(PROJECTS)
      : [];
