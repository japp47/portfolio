/*
 * Renders each page's own link-preview image into public/.
 *
 *   npm run build && npm run preview     # in one terminal
 *   node scripts/make-og.mjs             # in another
 *
 * It drives headless Chrome over the DevTools protocol and captures the first screen at the
 * 1200x627 Open Graph ratio, so a shared link shows that page rather than the home page.
 * Needs Chrome installed; set CHROME_PATH if it is somewhere unusual.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const OUT = path.resolve(import.meta.dirname, '..', 'public');
const PORT = 9412;

// Render at 1440x756 on a 2x screen, then scale the capture down to exactly 1200x630.
// Downsampling from 2x is what keeps the small text in the figures crisp.
const SHOT = { width: 1440, height: 756 };
const DPR = 2;
const SCALE = 1200 / (SHOT.width * DPR);

const PAGES = [
  { file: 'og.jpg', url: '/' },
  { file: 'og-99ile.jpg', url: '/work/99ile/' },
  { file: 'og-local-llm-gateway.jpg', url: '/work/local-llm-gateway/' },
];

const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${fs.mkdtempSync('/tmp/og-')}`,
    `--window-size=${SHOT.width},${SHOT.height}`,
    '--hide-scrollbars',
    '--no-first-run',
    '--disable-gpu',
    '--use-gl=swiftshader',
    '--enable-unsafe-swiftshader',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

async function debuggerUrl() {
  for (let i = 0; i < 80; i++) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = tabs.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* chrome is not listening yet */
    }
    await sleep(250);
  }
  throw new Error('Chrome did not start. Set CHROME_PATH if it is installed elsewhere.');
}

const ws = new WebSocket(await debuggerUrl());
await new Promise((resolve) => (ws.onopen = resolve));

let nextId = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result ?? {});
    pending.delete(msg.id);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { ...SHOT, deviceScaleFactor: DPR, mobile: false });

for (const { file, url } of PAGES) {
  await send('Page.navigate', { url: BASE + url });
  // the dot field is loaded on idle and the name animates in, so give both time to settle
  await sleep(5000);
  // the custom cursor and the floating terminal button are for visitors, not for a preview
  await send('Runtime.evaluate', {
    expression: `(() => {
      const hide = document.createElement('style');
      hide.textContent = '.cursor, .term-toggle { display: none !important }';
      document.head.append(hide);
    })()`,
  });
  await sleep(150);
  const { data } = await send('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 86,
    clip: { x: 0, y: 0, ...SHOT, scale: SCALE },
  });
  const out = path.join(OUT, file);
  fs.writeFileSync(out, Buffer.from(data, 'base64'));
  console.log(`${file.padEnd(28)} ${(fs.statSync(out).size / 1024).toFixed(0)} kB  ← ${url}`);
}

ws.close();
chrome.kill();
