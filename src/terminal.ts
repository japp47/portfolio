/*
  A small fake shell about me. Opens with ` or ~, the corner button, or any [data-open-terminal].
  Commands print HTML lines; clickable commands in the output run when clicked (handy on a phone).
  It never runs anything real: `open` only opens a link, `rm` only jokes.
*/

interface Project { name: string; title: string; year: string; stack: string; lines: string[]; links: [string, string][] }

const PROJECTS: Record<string, Project> = {
  '99ile': {
    name: '99ile', title: 'A free CAT coach that works offline', year: '2026', stack: 'Go · PostgreSQL 17 · React 19 · PWA · Chrome extension',
    lines: [
      'Plans your day around the time you have, explains why each wrong option tempted you,',
      'and brings back what you missed. No sign-up, works offline, live in production.',
      'The hard part: Postgres hands out sequence numbers before commit, so two pushes',
      'could commit out of order and a device would skip a record for good. Fix: one locked',
      'head row per account, so pushes go single file. 1,600+ automated tests guard it.',
    ],
    links: [['site', 'https://99ile.in'], ['code', 'https://github.com/japp47/CAT-Prep']],
  },
  gateway: {
    name: 'gateway', title: 'Local LLM Gateway', year: '2026', stack: 'TypeScript · Fastify · Ollama · MCP · SQLite / Postgres + Redis',
    lines: [
      'A local-first assistant for Ollama with an API, a CLI and a browser chat. MIT, on npm.',
      'Your phone pairs by QR code over Tailscale HTTPS, while Ollama stays bound to localhost.',
      'Branchable conversations, privacy modes, MCP tools behind per-tool approval and an audit log.',
      '155 end-to-end checks run against a real Ollama.',
    ],
    links: [['code', 'https://github.com/japp47/local-llm-gateway']],
  },
  excel: {
    name: 'excel', title: 'Spreadsheet engine', year: '2024', stack: 'Vanilla JavaScript',
    lines: [
      'Formulas, two-way binding, a dependency graph that recalculates only what changed,',
      'cycle detection, multiple sheets, cut / copy / paste, upload and download. No framework.',
    ],
    links: [['code', 'https://github.com/japp47/Excel-Sheets']],
  },
  git: {
    name: 'git', title: 'My own version control', year: '2024', stack: 'Node.js',
    lines: ['Rebuilt a handful of Git commands from scratch to see how commits, logs and diffs work underneath.'],
    links: [['code', 'https://github.com/japp47/Version-Control-System']],
  },
  sketchground: {
    name: 'sketchground', title: 'SketchGround', year: '2024', stack: 'JavaScript · WebSockets · Canvas',
    lines: ['Draw, erase, download and pin sticky notes, with live collaboration over web sockets.'],
    links: [['code', 'https://github.com/japp47/SketchGround']],
  },
  airline: {
    name: 'airline', title: 'Airline microservices', year: '2024', stack: 'Node.js · Docker · message queue',
    lines: ['Flight booking split into services: an auth API gateway, booking and notifications, in containers.'],
    links: [['booking', 'https://github.com/japp47/Airline-Service'], ['gateway', 'https://github.com/japp47/Airline_Auth-API_Gateway'], ['notify', 'https://github.com/japp47/Airline_Notification']],
  },
  splitwise: {
    name: 'splitwise', title: 'Splitwise, the graph way', year: '2023', stack: 'DSA · graphs',
    lines: ['Settles a group\'s debts in the fewest payments using a graph algorithm.'],
    links: [['code', 'https://github.com/japp47/splitwise']],
  },
};

const EMAIL = 'jappreets4747@gmail.com';
const LINKS: [string, string][] = [
  ['github', 'https://github.com/japp47'],
  ['linkedin', 'https://www.linkedin.com/in/jappreetchhabra/'],
  ['leetcode', 'https://leetcode.com/u/jappreets4747/'],
  ['email', `mailto:${EMAIL}`],
];

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const cmd = (c: string, label = c) => `<button type="button" class="t-cmd" data-cmd="${esc(c)}">${esc(label)}</button>`;
const link = (label: string, href: string) => `<a class="t-link" href="${href}" target="_blank" rel="noopener">${esc(label)} ↗</a>`;
const dim = (s: string) => `<span class="t-dim">${s}</span>`;
const hi = (s: string) => `<span class="t-hi">${s}</span>`;

const HELP: [string, string][] = [
  ['whoami', 'the short version'],
  ['about', 'the longer version'],
  ['ls', 'list projects'],
  ['cat <project>', 'read about one'],
  ['open <project>', 'open its link'],
  ['work', 'where I work'],
  ['skills', 'what I use'],
  ['contact', 'how to reach me'],
  ['neofetch', 'system info, sort of'],
  ['binary <text>', 'say it in 0s and 1s'],
  ['clear', 'clear the screen'],
  ['exit', 'close the terminal'],
];

type Out = string | string[];
const COMMANDS: Record<string, (args: string[]) => Out> = {
  help: () => [
    'commands:',
    ...HELP.map(([c, d]) => `  ${cmd(c.split(' ')[0], c.padEnd(15))} ${dim(d)}`),
    '',
    dim('tab completes, ↑ ↓ walk the history, esc closes. some commands are not listed.'),
  ],
  whoami: () => `${hi('jappreet singh chhabra')} ${dim('·')} backend engineer, SDE II at HashedIn by Deloitte, Bengaluru.`,
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
    if (args[0] && args[0] !== 'projects' && args[0] !== '~/projects') return `ls: ${esc(args[0])}: no such directory. try ${cmd('ls')}`;
    return [
      dim('~/projects'),
      ...Object.values(PROJECTS).map((p) => `  ${cmd(`cat ${p.name}`, p.name.padEnd(14))} ${p.title} ${dim(p.year)}`),
      '',
      dim(`41 public repos in all: `) + link('github.com/japp47', 'https://github.com/japp47?tab=repositories'),
    ];
  },
  cat: (args) => {
    const p = PROJECTS[(args[0] ?? '').replace(/\.md$/, '').toLowerCase()];
    if (!args[0]) return `usage: cat <project>. see ${cmd('ls')}`;
    if (!p) return `cat: ${esc(args[0])}: no such file. see ${cmd('ls')}`;
    return [hi(`# ${p.title}`) + ' ' + dim(p.year), dim(p.stack), '', ...p.lines, '', p.links.map(([l, h]) => link(l, h)).join('  ')];
  },
  open: (args) => {
    const key = (args[0] ?? '').toLowerCase();
    const p = PROJECTS[key];
    const social = LINKS.find(([l]) => l === key);
    const href = p ? p.links[0][1] : social?.[1];
    if (!href) return `open: what should I open? try ${cmd('open 99ile')} or ${cmd('open github')}`;
    window.open(href, '_blank', 'noopener');
    return dim(`opening ${href} …`);
  },
  work: () => [
    `${hi('HashedIn by Deloitte')} ${dim('· Bengaluru')}`,
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
    `  languages   Python, Go, TypeScript, SQL, Java, JavaScript`,
    `  backend     FastAPI, Fastify, Node.js, Spring Boot, GraphQL, REST`,
    `  data        PostgreSQL, Redis, DynamoDB, MongoDB, SQLite, RabbitMQ`,
    `  infra       AWS, Temporal, Docker, Cosmos DB, SST/CDK`,
    `  access      OpenFGA, Cedar, OAuth 2.0, Keycloak`,
    `  ai          Ollama, MCP, LangChain, LangGraph, RAG`,
  ],
  contact: () => [
    `email     ${link(EMAIL, `mailto:${EMAIL}`)}`,
    `github    ${link('japp47', LINKS[0][1])}`,
    `linkedin  ${link('jappreetchhabra', LINKS[1][1])}`,
    `leetcode  ${link('jappreets4747', LINKS[2][1])} ${dim('· 900+ problems')}`,
    '',
    dim('I reply within a day.'),
  ],
  resume: () => `the resume is one email away: ${link(EMAIL, `mailto:${EMAIL}?subject=Resume`)}`,
  neofetch: () => {
    const art = [
      String.raw`     _ ____   ____ `,
      String.raw`    | / ___| / ___|`,
      String.raw` _  | \___ \| |    `,
      String.raw`| |_| |___) | |___ `,
      String.raw` \___/|____/ \____|`,
      String.raw`                   `,
    ].map(esc);
    const info = [
      hi('jappreet@bengaluru'),
      dim('------------------'),
      `role     backend engineer`,
      `at       HashedIn by Deloitte`,
      `since    2021 ${dim('(first line of C++)')}`,
      `kernel   math first, then code`,
      `shell    ${cmd('help')}`,
    ];
    if (out.clientWidth < 560) return info; // no room for the logo on a phone
    return art.map((a, i) => `${dim(a)}   ${info[i] ?? ''}`).concat(info.slice(art.length).map((l) => ' '.repeat(22) + l));
  },
  binary: (args) => {
    const text = args.join(' ') || 'hi';
    return [...text].map((c) => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
  },
  date: () => new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' }) + dim(' · IST'),
  pwd: () => '/home/jappreet',
  echo: (args) => esc(args.join(' ')),
  history: () => history.map((h, i) => `${dim(String(i + 1).padStart(3))}  ${esc(h)}`),
  hire: () => COMMANDS.contact([]),
  sudo: (args) => (args.join(' ').startsWith('hire')
    ? [hi('permission granted.'), `starting interview pipeline… just kidding, ${link('email me', `mailto:${EMAIL}?subject=Let's talk`)}`]
    : 'jappreet is not in the sudoers file. this incident will be reported.'),
  rm: (args) => (args.includes('-rf') ? 'nice try. this portfolio has backups, and I wrote the restore.' : 'rm: refusing to remove anything today.'),
  matrix: () => { dispatchEvent(new Event('field:matrix')); return dim('wake up, neo… (look behind the terminal)'); },
  vim: () => 'you are now stuck in vim. kidding. try :q, or just keep typing here.',
  ':q': () => 'see, not that hard.',
  exit: () => { close(); return ''; },
};
const ALIASES: Record<string, string> = { ll: 'ls', dir: 'ls', 'cd': 'ls', man: 'help', '?': 'help', projects: 'ls', email: 'contact', socials: 'contact', cv: 'resume', quit: 'exit', 'q': 'exit' };

let panel: HTMLElement, out: HTMLElement, input: HTMLInputElement, opener: Element | null = null;
const history: string[] = [];
let hIndex = 0;
let greeted = false;

function print(o: Out): void {
  const lines = Array.isArray(o) ? o : [o];
  if (lines.length === 1 && lines[0] === '') return;
  const block = document.createElement('div');
  block.className = 't-block';
  block.innerHTML = lines.map((l) => `<div class="t-line">${l || '&nbsp;'}</div>`).join('');
  out.append(block);
  out.scrollTop = out.scrollHeight;
}

function run(raw: string): void {
  const line = raw.trim();
  print(`<span class="t-prompt">jappreet@bengaluru:~$</span> ${esc(line)}`);
  if (!line) return;
  history.push(line);
  hIndex = history.length;
  const [first, ...args] = line.split(/\s+/);
  const name = ALIASES[first.toLowerCase()] ?? first.toLowerCase();
  if (name === 'clear') { out.innerHTML = ''; return; }
  const fn = COMMANDS[name];
  print(fn ? fn(args) : `zsh: command not found: ${esc(first)}. type ${cmd('help')}`);
}

function complete(): void {
  const v = input.value;
  const parts = v.split(/\s+/);
  const pool = parts.length > 1 && ['cat', 'open'].includes(parts[0])
    ? [...Object.keys(PROJECTS), ...(parts[0] === 'open' ? LINKS.map(([l]) => l) : [])]
    : Object.keys(COMMANDS).filter((c) => /^[a-z]/.test(c));
  const word = parts[parts.length - 1];
  const hits = pool.filter((c) => c.startsWith(word));
  if (hits.length === 1) { parts[parts.length - 1] = hits[0]; input.value = parts.join(' ') + (parts.length === 1 ? ' ' : ''); }
  else if (hits.length > 1) print(dim(hits.join('   ')));
}

function open(): void {
  if (panel.classList.contains('is-open')) { input.focus(); return; }
  opener = document.activeElement;
  panel.hidden = false;
  requestAnimationFrame(() => panel.classList.add('is-open'));
  document.body.classList.add('term-on');
  if (!greeted) {
    greeted = true;
    print([
      dim(`last login: ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit' })} on ttys001`),
      `hi. this is a tiny shell about ${hi('jappreet')}. type ${cmd('help')} or try ${cmd('whoami')}, ${cmd('ls')}, ${cmd('neofetch')}.`,
    ]);
  }
  setTimeout(() => input.focus({ preventScroll: true }), 60);
}

function close(): void {
  panel.classList.remove('is-open');
  document.body.classList.remove('term-on');
  setTimeout(() => { if (!panel.classList.contains('is-open')) panel.hidden = true; }, 450);
  if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
}

export function mountTerminal(): void {
  panel = document.createElement('section');
  panel.className = 'term';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Terminal');
  panel.innerHTML = `
    <div class="term__bar">
      <span class="term__dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="term__title">jappreet@bengaluru: ~ — zsh</span>
      <button type="button" class="term__close" aria-label="Close terminal">esc</button>
    </div>
    <div class="term__out" aria-live="polite"></div>
    <form class="term__in" autocomplete="off">
      <label class="t-prompt" for="term-input">jappreet@bengaluru:~$</label>
      <input id="term-input" type="text" spellcheck="false" autocapitalize="off" autocorrect="off" enterkeyhint="send">
    </form>`;
  document.body.append(panel);
  out = panel.querySelector('.term__out')!;
  input = panel.querySelector('input')!;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'term-toggle';
  toggle.setAttribute('aria-label', 'Open terminal');
  toggle.innerHTML = '<span aria-hidden="true">&gt;_</span><kbd>~</kbd>';
  toggle.addEventListener('click', () => (panel.classList.contains('is-open') ? close() : open()));
  document.body.append(toggle);

  // the button floats in the corner; when a row of links passes under it (the hero's links at the top,
  // the footer's at the bottom) it moves up just enough to sit above them
  const rows = [...document.querySelectorAll<HTMLElement>('.hero__foot .links, .contact__row')];
  let pending = false;
  const dodge = () => {
    pending = false;
    // offset* ignores transforms, so this is the button's resting spot, not where its lift animation is
    const t = { left: toggle.offsetLeft, top: toggle.offsetTop, right: toggle.offsetLeft + toggle.offsetWidth, bottom: toggle.offsetTop + toggle.offsetHeight };
    let lift = 0;
    for (const el of rows) {
      const r = el.getBoundingClientRect();
      const overlaps = r.left < t.right && r.right > t.left && r.top < t.bottom + 12 && r.bottom > t.top;
      if (overlaps) lift = Math.max(lift, t.bottom - r.top + 16);
    }
    toggle.style.setProperty('--lift', `${lift}px`);
    toggle.classList.toggle('is-lifted', lift > 0);
  };
  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(dodge); } };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  document.fonts.ready.then(schedule);

  panel.querySelector('form')!.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; run(v); });
  panel.querySelector('.term__close')!.addEventListener('click', close);
  out.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-cmd]');
    if (b) { run(b.dataset.cmd!); input.focus({ preventScroll: true }); }
  });
  panel.addEventListener('click', (e) => { if (!(e.target as Element).closest('a, button') && !getSelection()?.toString()) input.focus({ preventScroll: true }); });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); complete(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); hIndex = Math.max(0, hIndex - 1); input.value = history[hIndex] ?? ''; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hIndex = Math.min(history.length, hIndex + 1); input.value = history[hIndex] ?? ''; }
    else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); out.innerHTML = ''; }
  });

  addEventListener('keydown', (e) => {
    const typing = (e.target as Element).closest('input, textarea, [contenteditable]');
    if (e.key === 'Escape' && panel.classList.contains('is-open')) { e.preventDefault(); close(); }
    else if ((e.key === '`' || e.key === '~') && !typing && !e.metaKey && !e.ctrlKey) { e.preventDefault(); open(); }
  });
  document.querySelectorAll('[data-open-terminal]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); open(); }));
  // a shared link to …/#terminal opens it straight away
  if (location.hash === '#terminal') setTimeout(() => { open(); run('neofetch'); }, 900);
}
