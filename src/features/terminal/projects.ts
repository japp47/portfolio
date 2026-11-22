/** The projects the terminal can `ls`, `cat` and `open`. The first link is what `open` opens. */

export interface Project {
  name: string;
  title: string;
  year: string;
  stack: string;
  lines: string[];
  links: [label: string, href: string][];
}

export const PROJECTS: Record<string, Project> = {
  '99ile': {
    name: '99ile',
    title: 'A free CAT coach that works offline',
    year: '2026',
    stack: 'Go · PostgreSQL 17 · React 19 · PWA · Chrome extension',
    lines: [
      'Plans your day around the time you have, explains why each wrong option tempted you,',
      'and brings back what you missed. No sign-up, works offline, live in production.',
      'The hard part: Postgres hands out sequence numbers before commit, so two pushes',
      'could commit out of order and a device would skip a record for good. Fix: one locked',
      'head row per account, so pushes go single file. 1,600+ automated tests guard it.',
    ],
    links: [
      ['site', 'https://99ile.in'],
      ['code', 'https://github.com/japp47/CAT-Prep'],
    ],
  },
  gateway: {
    name: 'gateway',
    title: 'Local LLM Gateway',
    year: '2026',
    stack: 'TypeScript · Fastify · Ollama · MCP · SQLite / Postgres + Redis',
    lines: [
      'A local-first assistant for Ollama with an API, a CLI and a browser chat. MIT, on npm.',
      'Your phone pairs by QR code over Tailscale HTTPS, while Ollama stays bound to localhost.',
      'Branchable conversations, privacy modes, MCP tools behind per-tool approval and an audit log.',
      '155 end-to-end checks run against a real Ollama.',
    ],
    links: [['code', 'https://github.com/japp47/local-llm-gateway']],
  },
  excel: {
    name: 'excel',
    title: 'Spreadsheet engine',
    year: '2024',
    stack: 'Vanilla JavaScript',
    lines: [
      'Formulas, two-way binding, a dependency graph that recalculates only what changed,',
      'cycle detection, multiple sheets, cut / copy / paste, upload and download. No framework.',
    ],
    links: [['code', 'https://github.com/japp47/Excel-Sheets']],
  },
  git: {
    name: 'git',
    title: 'My own version control',
    year: '2024',
    stack: 'Node.js',
    lines: [
      'Rebuilt a handful of Git commands from scratch to see how commits, logs and diffs work underneath.',
    ],
    links: [['code', 'https://github.com/japp47/Version-Control-System']],
  },
  sketchground: {
    name: 'sketchground',
    title: 'SketchGround',
    year: '2024',
    stack: 'JavaScript · WebSockets · Canvas',
    lines: ['Draw, erase, download and pin sticky notes, with live collaboration over web sockets.'],
    links: [['code', 'https://github.com/japp47/SketchGround']],
  },
  airline: {
    name: 'airline',
    title: 'Airline microservices',
    year: '2024',
    stack: 'Node.js · Docker · message queue',
    lines: [
      'Flight booking split into services: an auth API gateway, booking and notifications, in containers.',
    ],
    links: [
      ['booking', 'https://github.com/japp47/Airline-Service'],
      ['gateway', 'https://github.com/japp47/Airline_Auth-API_Gateway'],
      ['notify', 'https://github.com/japp47/Airline_Notification'],
    ],
  },
  splitwise: {
    name: 'splitwise',
    title: 'Splitwise, the graph way',
    year: '2023',
    stack: 'DSA · graphs',
    lines: ["Settles a group's debts in the fewest payments using a graph algorithm."],
    links: [['code', 'https://github.com/japp47/splitwise']],
  },
};
