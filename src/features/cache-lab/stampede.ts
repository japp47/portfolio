import { prefersReducedMotion } from '../../lib/media';

/**
 * A toy cache stampede: one hot key, 5,000 requests a second, and the key expires at 200 ms.
 * Each database query takes 100 ms when the database is idle and gets slower the more queries
 * are already running (a pool of 50 is "comfortable"). Deliberately simple; the shape of the
 * failure is the point, not the exact numbers.
 */

const RATE = 5; // requests per ms
const EXPIRE = 200; // ms
const BASE = 100; // ms for one query on an idle database
const POOL = 50;
const END = 1500;

export type Mode = 'none' | 'lock' | 'stale';

interface Run {
  inflight: number[];
  queries: number[]; // cumulative queries sent, per ms
  worstWait: number;
  busyUntil: number;
  refilled: number;
}

function simulate(mode: Mode): Run {
  const ends: number[] = [];
  const inflight: number[] = [];
  const queries: number[] = [];
  let refilled = Infinity;
  let refreshing = false;
  let worstWait = 0;

  const running = (t: number) => {
    let n = 0;
    for (const end of ends) if (end > t) n++;
    return n;
  };

  for (let t = 0; t < END; t++) {
    for (let r = 0; r < RATE; r++) {
      if (t < EXPIRE || t >= refilled) continue; // a hit

      if (mode === 'none') {
        // every miss goes to the database, and each one slows the next
        const took = Math.round(BASE * (1 + running(t) / POOL));
        ends.push(t + took);
        refilled = Math.min(refilled, t + took);
        worstWait = Math.max(worstWait, took);
      } else if (!refreshing) {
        // one request rebuilds; the rest wait for it (lock) or get the old value (stale)
        refreshing = true;
        ends.push(t + BASE);
        refilled = t + BASE;
        if (mode === 'lock') worstWait = BASE;
      }
    }
    inflight.push(running(t));
    queries.push(ends.length);
  }
  return { inflight, queries, worstWait, busyUntil: Math.max(...ends), refilled };
}

const RUNS: Record<Mode, Run> = { none: simulate('none'), lock: simulate('lock'), stale: simulate('stale') };
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

export function mountStampede(root: HTMLElement): void {
  const chart = root.querySelector<HTMLElement>('.stampede__chart')!;
  const stats = {
    queries: root.querySelector<HTMLElement>('[data-stat="queries"]')!,
    peak: root.querySelector<HTMLElement>('[data-stat="peak"]')!,
    wait: root.querySelector<HTMLElement>('[data-stat="wait"]')!,
    busy: root.querySelector<HTMLElement>('[data-stat="busy"]')!,
  };
  const buttons = root.querySelectorAll<HTMLButtonElement>('[data-mode]');
  const replay = root.querySelector<HTMLButtonElement>('[data-replay]');

  let mode: Mode = 'none';
  let head = END; // how far the animation has drawn, in ms
  let frame = 0;

  const YMAX = 550;
  const M = { top: 40, right: 14, bottom: 30, left: 44 };

  function draw(): void {
    const W = chart.clientWidth;
    const H = W < 600 ? 240 : 300;
    const x = (t: number) => M.left + (t / END) * (W - M.left - M.right);
    const y = (v: number) => H - M.bottom - (Math.min(v, YMAX) / YMAX) * (H - M.top - M.bottom);
    const run = RUNS[mode];
    const upto = Math.min(END - 1, Math.floor(head));

    let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Database queries in flight over time">`;
    for (const v of [100, 200, 300, 400, 500]) {
      svg += `<line class="pl-grid" x1="${M.left}" x2="${W - M.right}" y1="${y(v)}" y2="${y(v)}"/>`;
      svg += `<text class="pl-tick" x="${M.left - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
    }
    for (let t = 0; t <= END; t += 250) {
      if (W < 600 && t % 500) continue;
      svg += `<text class="pl-tick" x="${x(t)}" y="${H - M.bottom + 18}" text-anchor="middle">${t / 1000}s</text>`;
    }
    // the pool the database is comfortable with
    svg += `<line class="st-pool" x1="${M.left}" x2="${W - M.right}" y1="${y(POOL)}" y2="${y(POOL)}"/>`;
    svg += `<text class="pl-axis" x="${W - M.right}" y="${y(POOL) - 6}" text-anchor="end">pool: ${POOL} connections</text>`;
    // the moment the key expires, and the moment the cache has it again
    svg += `<line class="pl-marker" x1="${x(EXPIRE)}" x2="${x(EXPIRE)}" y1="${M.top}" y2="${H - M.bottom}"/>`;
    svg += `<text class="pl-axis" x="${x(EXPIRE) + 6}" y="${M.top + 12}">key expires</text>`;
    if (head >= run.refilled) {
      svg += `<line class="pl-marker st-refill" x1="${x(run.refilled)}" x2="${x(run.refilled)}" y1="${M.top}" y2="${H - M.bottom}"/>`;
      svg += `<text class="pl-axis st-refill-label" x="${x(run.refilled) + 6}" y="${(M.top + H - M.bottom) / 2 + 20}">cache refilled</text>`;
    }

    let d = `M${x(0)},${y(0)}`;
    let area = d;
    for (let t = 0; t <= upto; t += 2) {
      const p = `L${x(t).toFixed(1)},${y(run.inflight[t]).toFixed(1)}`;
      d += p;
      area += p;
    }
    area += `L${x(upto)},${y(0)}Z`;
    const over = Math.max(...run.inflight.slice(0, upto + 1)) > POOL;
    svg += `<path class="st-area${over ? ' is-over' : ''}" d="${area}"/>`;
    svg += `<path class="st-line" d="${d}"/>`;
    svg += `<text class="pl-axis" x="${M.left - 8}" y="14">queries running in the database ↑</text>`;
    chart.innerHTML = svg + '</svg>';

    // the counters tick along with the playhead, then settle on the totals
    const done = head >= END;
    stats.queries.textContent = fmt(run.queries[upto]);
    stats.peak.textContent = fmt(Math.max(...run.inflight.slice(0, upto + 1)));
    stats.wait.textContent = done ? (run.worstWait ? `${fmt(run.worstWait)} ms` : '0 ms · stale') : '…';
    stats.busy.textContent = done ? `${(run.busyUntil / 1000).toFixed(2)} s` : '…';
    root.classList.toggle('is-bad', mode === 'none' && done);
  }

  function play(): void {
    cancelAnimationFrame(frame);
    if (prefersReducedMotion()) {
      head = END;
      draw();
      return;
    }
    head = 0;
    const start = performance.now();
    const tick = (now: number) => {
      head = ((now - start) / 1800) * END; // 1.5 s of simulation over 1.8 s of screen time
      draw();
      if (head < END) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }

  buttons.forEach((button) =>
    button.addEventListener('click', () => {
      mode = button.dataset.mode as Mode;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      play();
    }),
  );
  replay?.addEventListener('click', play);

  new ResizeObserver(() => draw()).observe(chart);

  // play once when it first scrolls into view
  new IntersectionObserver(
    (entries, observer) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        play();
      }
    },
    { threshold: 0.4 },
  ).observe(root);
}
