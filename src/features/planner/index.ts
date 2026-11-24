import { type PlanName, PLANS, cheapest, costOf, explain } from './model';

/**
 * "Play the planner": two sliders and two switches over the cost model in ./model.
 * The chart is drawn in real pixels for the width it gets, so its labels stay readable on a
 * phone instead of shrinking with a fixed viewBox.
 */

const MAX_EXP = 6; // the slider runs from 1 row (10^0) to the whole table (10^6)
const COST_EXP = 5; // the cost axis runs from 1 to 100,000
const BAD = '#ff5f57';

const CLASS: Record<PlanName, string> = {
  'Seq Scan': 'pl-seq',
  'Index Scan': 'pl-index',
  'Bitmap Heap Scan': 'pl-bitmap',
};

const SHORT: Record<PlanName, string> = {
  'Seq Scan': 'seq',
  'Index Scan': 'index',
  'Bitmap Heap Scan': 'bitmap',
};

/** Slider position to rows, kept to two significant figures: 300,000 rather than 301,995. */
const rowsAt = (v: number): number => {
  const raw = 10 ** ((v / 100) * (MAX_EXP / 6));
  const step = raw < 100 ? 1 : 10 ** (Math.floor(Math.log10(raw)) - 1);
  return Math.round(raw / step) * step;
};
const sliderFor = (rows: number): number => Math.round(Math.log10(rows) * 100);
const fmt = (n: number): string => Math.round(n).toLocaleString('en-US');
const compact = (n: number): string => (n >= 1e6 ? `${n / 1e6}M` : n >= 1e3 ? `${n / 1e3}k` : `${n}`);

interface State {
  estimated: number; // slider position, 0..600
  actual: number;
  stale: boolean;
  sorted: boolean;
}

export function mountPlanner(root: HTMLElement): void {
  const chart = root.querySelector<HTMLElement>('.planner__chart')!;
  const estIn = root.querySelector<HTMLInputElement>('[data-in="estimated"]')!;
  const actIn = root.querySelector<HTMLInputElement>('[data-in="actual"]')!;
  const estOut = root.querySelector<HTMLOutputElement>('[data-out="estimated"]')!;
  const actOut = root.querySelector<HTMLOutputElement>('[data-out="actual"]')!;
  const plan = root.querySelector<HTMLElement>('[data-out="plan"]')!;
  const verdict = root.querySelector<HTMLElement>('[data-out="verdict"]')!;
  const actualRow = root.querySelector<HTMLElement>('[data-actual-row]')!;
  const legend = root.querySelectorAll<HTMLElement>('[data-plan]');

  const state: State = {
    estimated: Number(estIn.value),
    actual: Number(estIn.value),
    stale: false,
    sorted: false,
  };

  // --- chart geometry, recomputed on resize -----------------------------------------------------
  let W = 0;
  let H = 0;
  const M = { top: 34, right: 14, bottom: 30, left: 46 };
  const x = (rows: number) => M.left + (Math.log10(rows) / MAX_EXP) * (W - M.left - M.right);
  const y = (cost: number) =>
    H - M.bottom - (Math.log10(Math.max(1, cost)) / COST_EXP) * (H - M.top - M.bottom);
  const rowsAtX = (px: number) => 10 ** (((px - M.left) / (W - M.left - M.right)) * MAX_EXP);

  const correlation = () => (state.sorted ? 1 : 0);

  /** Where each plan is the cheapest, as [plan, fromRows, toRows] runs. */
  function regions(): [PlanName, number, number][] {
    const out: [PlanName, number, number][] = [];
    for (let i = 0; i <= 600; i++) {
      const k = rowsAt(i);
      const p = cheapest(k, correlation());
      const last = out[out.length - 1];
      if (last && last[0] === p) last[2] = k;
      else out.push([p, k, k]);
    }
    return out;
  }

  function path(p: PlanName): string {
    let d = '';
    for (let i = 0; i <= 120; i++) {
      const k = 10 ** ((i / 120) * MAX_EXP);
      const c = Math.min(10 ** COST_EXP, costOf(p, k, correlation()).total);
      d += `${i ? 'L' : 'M'}${x(k).toFixed(1)},${y(c).toFixed(1)}`;
    }
    return d;
  }

  function draw(): void {
    W = chart.clientWidth;
    H = W < 600 ? 280 : 360;
    const est = rowsAt(state.estimated);
    const act = state.stale ? rowsAt(state.actual) : est;
    const chosen = cheapest(est, correlation());
    const bestAtActual = cheapest(act, correlation());
    const small = W < 600;

    let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Estimated cost of each scan against rows matched">`;

    // which plan wins where: a strip across the top
    for (const [p, from, to] of regions()) {
      const x0 = from === 1 ? M.left : x(from);
      const x1 = x(to);
      svg += `<rect class="pl-band ${CLASS[p]}-band" x="${x0}" y="6" width="${Math.max(0, x1 - x0)}" height="18"/>`;
      if (x1 - x0 > (small ? 36 : 54))
        svg += `<text class="pl-band-label" x="${(x0 + x1) / 2}" y="19" text-anchor="middle">${SHORT[p]}</text>`;
    }

    // grid
    for (let e = 1; e <= COST_EXP; e++) {
      svg += `<line class="pl-grid" x1="${M.left}" x2="${W - M.right}" y1="${y(10 ** e)}" y2="${y(10 ** e)}"/>`;
      svg += `<text class="pl-tick" x="${M.left - 8}" y="${y(10 ** e) + 4}" text-anchor="end">${compact(10 ** e)}</text>`;
    }
    for (let e = 0; e <= MAX_EXP; e++) {
      if (small && e % 2) continue;
      svg += `<line class="pl-grid" x1="${x(10 ** e)}" x2="${x(10 ** e)}" y1="${M.top}" y2="${H - M.bottom}"/>`;
      svg += `<text class="pl-tick" x="${x(10 ** e)}" y="${H - M.bottom + 18}" text-anchor="middle">${compact(10 ** e)}</text>`;
    }
    svg += `<text class="pl-axis" x="${W - M.right}" y="${H - 2}" text-anchor="end">rows matched →</text>`;
    svg += `<text class="pl-axis" x="${M.left + 8}" y="${M.top + 16}">cost ↑</text>`;

    // the three cost curves, the chosen one in front
    for (const p of [...PLANS.filter((q) => q !== chosen), chosen]) {
      svg += `<path class="pl-line ${CLASS[p]}${p === chosen ? ' is-chosen' : ''}" d="${path(p)}"/>`;
    }

    // where the planner thinks it is
    svg += `<line class="pl-marker" x1="${x(est)}" x2="${x(est)}" y1="${M.top}" y2="${H - M.bottom}"/>`;
    svg += `<circle class="pl-dot" cx="${x(est)}" cy="${y(costOf(chosen, est, correlation()).total)}" r="5"/>`;

    // and where it really is
    if (state.stale) {
      svg += `<line class="pl-marker" style="stroke:${BAD}" x1="${x(act)}" x2="${x(act)}" y1="${M.top}" y2="${H - M.bottom}"/>`;
      if (bestAtActual !== chosen)
        svg += `<circle class="pl-ring" cx="${x(act)}" cy="${y(costOf(bestAtActual, act, correlation()).total)}" r="6"/>`;
      svg += `<circle class="pl-dot" style="fill:${BAD}" cx="${x(act)}" cy="${y(Math.min(10 ** COST_EXP, costOf(chosen, act, correlation()).total))}" r="5"/>`;
    }
    chart.innerHTML = svg + '</svg>';

    // legend, readouts, plan text, verdict
    legend.forEach((li) => li.classList.toggle('is-chosen', li.dataset.plan === chosen));
    estOut.value = `${fmt(est)} rows`;
    actOut.value = state.stale ? `${fmt(act)} rows` : 'same';
    plan.textContent = explain(chosen, est, act, correlation());
    verdict.innerHTML = describe(est, act, chosen, bestAtActual);
  }

  function describe(est: number, act: number, chosen: PlanName, best: PlanName): string {
    if (!state.stale) {
      const runs = regions()
        .map(([p, , to], i, all) =>
          i === all.length - 1 ? `${p} beyond` : `${p} up to ~${compact(roundish(to))} rows`,
        )
        .join(', ');
      return `At ${fmt(est)} rows the planner picks <strong>${chosen}</strong>. ${state.sorted ? 'With rows stored in date order' : 'With rows scattered across the table'}: ${runs}.`;
    }
    const paid = costOf(chosen, act, correlation()).total;
    const could = costOf(best, act, correlation()).total;
    if (best === chosen) {
      return `It expected ${fmt(est)} rows and got ${fmt(act)}, but <strong>${chosen}</strong> is still the cheapest at the real count. A wrong estimate only hurts when it crosses a line.`;
    }
    return `It expected ${fmt(est)} rows and picked <strong>${chosen}</strong>. ${fmt(act)} rows actually matched: that plan costs ${fmt(paid)}, where ${best} would have cost ${fmt(could)}. <strong class="pl-bad">${(paid / could).toFixed(1)}× the work</strong>, in the planner's own units.`;
  }

  // --- input ---------------------------------------------------------------------------------------
  estIn.addEventListener('input', () => {
    state.estimated = Number(estIn.value);
    if (!state.stale) state.actual = state.estimated;
    draw();
  });
  actIn.addEventListener('input', () => {
    state.actual = Number(actIn.value);
    draw();
  });

  root.querySelectorAll<HTMLButtonElement>('[data-toggle]').forEach((button) =>
    button.addEventListener('click', () => {
      const key = button.dataset.toggle as 'stale' | 'sorted';
      state[key] = !state[key];
      button.setAttribute('aria-pressed', String(state[key]));
      if (key === 'stale') {
        actIn.disabled = !state.stale;
        actualRow.classList.toggle('is-off', !state.stale);
        if (state.stale) {
          // the classic case: statistics say "a handful", a backlog says otherwise
          state.estimated = sliderFor(10);
          state.actual = sliderFor(300_000);
        } else {
          state.actual = state.estimated;
        }
        estIn.value = String(state.estimated);
        actIn.value = String(state.actual);
      }
      draw();
    }),
  );

  // drag on the chart moves whichever marker is nearer
  let dragging = false;
  const fromPointer = (e: PointerEvent) => {
    const box = chart.getBoundingClientRect();
    const px = e.clientX - box.left;
    const v = Math.min(600, Math.max(0, sliderFor(Math.max(1, rowsAtX(px)))));
    const toActual =
      state.stale && Math.abs(px - x(rowsAt(state.actual))) < Math.abs(px - x(rowsAt(state.estimated)));
    if (toActual) {
      state.actual = v;
      actIn.value = String(v);
    } else {
      state.estimated = v;
      estIn.value = String(v);
      if (!state.stale) state.actual = v;
    }
    draw();
  };
  chart.addEventListener('pointerdown', (e) => {
    dragging = true;
    chart.setPointerCapture(e.pointerId);
    fromPointer(e);
  });
  chart.addEventListener('pointermove', (e) => dragging && fromPointer(e));
  chart.addEventListener('pointerup', () => (dragging = false));
  chart.addEventListener('pointercancel', () => (dragging = false));

  new ResizeObserver(() => draw()).observe(chart);
  draw();
}

/** 380,123 -> 380k, 14 -> 14: a crossover is a region, not a number to the row. */
function roundish(n: number): number {
  if (n < 100) return n;
  const p = 10 ** (Math.floor(Math.log10(n)) - 1);
  return Math.round(n / p) * p;
}
