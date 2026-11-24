/**
 * A small version of PostgreSQL's own cost model (costsize.c), with its default constants,
 * for one table and one range predicate. It is simplified, not invented: the shapes and
 * crossovers come from the same formulas the planner uses, which is the point of the demo.
 */

export const TABLE = {
  rows: 1_000_000,
  heapPages: 10_000, // about 100 rows to an 8 KB page
  indexPages: 2_750,
};

/** postgresql.conf defaults */
export const COST = {
  seqPage: 1.0, // seq_page_cost
  randomPage: 4.0, // random_page_cost
  tuple: 0.01, // cpu_tuple_cost
  indexTuple: 0.005, // cpu_index_tuple_cost
  operator: 0.0025, // cpu_operator_cost
};

export type PlanName = 'Seq Scan' | 'Index Scan' | 'Bitmap Heap Scan';
export const PLANS: PlanName[] = ['Seq Scan', 'Index Scan', 'Bitmap Heap Scan'];

export interface Cost {
  startup: number;
  total: number;
}

const { rows: N, heapPages: T, indexPages: I } = TABLE;

/** Heap pages touched to fetch k rows in random order, when the table fits in cache (Mackert–Lohman). */
const pagesFetched = (k: number): number => Math.min((2 * T * k) / (2 * T + k), T);

/** Walking the index to find k entries. */
const indexWalk = (k: number): number =>
  Math.max(1, Math.ceil((k / N) * I)) * COST.randomPage + k * (COST.indexTuple + COST.operator);

/** Every page in order, every row checked against the filter. */
export function seqScan(): Cost {
  return { startup: 0, total: T * COST.seqPage + N * (COST.tuple + COST.operator) };
}

/**
 * Index order to heap order, one row at a time. `correlation` is how closely the table's
 * physical order follows the index: 0 means every row is a random read, 1 means the rows
 * sit next to each other. The planner interpolates on correlation squared.
 */
export function indexScan(k: number, correlation: number): Cost {
  const worst = pagesFetched(k) * COST.randomPage;
  const best = COST.randomPage + (Math.max(1, Math.ceil((k / N) * T)) - 1) * COST.seqPage;
  const io = worst + correlation ** 2 * (best - worst);
  return { startup: 0.42, total: 0.42 + indexWalk(k) + io + k * COST.tuple };
}

/** Collect matching row addresses first, sort them by page, then read each page once, in order. */
export function bitmapScan(k: number): Cost {
  const pages = Math.max(1, pagesFetched(k));
  // reading a larger share of the table makes each page read look more sequential
  const perPage = COST.randomPage - (COST.randomPage - COST.seqPage) * Math.sqrt(pages / T);
  const startup = indexWalk(k) + COST.randomPage; // the bitmap is built before the first row comes out
  return { startup, total: startup + pages * perPage + k * (COST.tuple + COST.operator) };
}

export function costOf(plan: PlanName, k: number, correlation: number): Cost {
  if (plan === 'Seq Scan') return seqScan();
  if (plan === 'Index Scan') return indexScan(k, correlation);
  return bitmapScan(k);
}

/** What the planner does: price every plan at the row count it believes, keep the cheapest. */
export function cheapest(k: number, correlation: number): PlanName {
  return PLANS.reduce((best, plan) =>
    costOf(plan, k, correlation).total < costOf(best, k, correlation).total ? plan : best,
  );
}

const fmt = (n: number): string => n.toFixed(2);
const PREDICATE = "(created_at >= '2026-11-01'::date)";

/** The plan as EXPLAIN (ANALYZE, TIMING OFF) would print it, trimmed to the parts that matter here. */
export function explain(plan: PlanName, estimated: number, actual: number, correlation: number): string {
  const c = costOf(plan, estimated, correlation);
  const head = (name: string, cost: Cost, width: number) =>
    `${name}  (cost=${fmt(cost.startup)}..${fmt(cost.total)} rows=${estimated} width=${width}) (actual rows=${actual} loops=1)`;

  if (plan === 'Seq Scan') {
    return [
      head('Seq Scan on orders', c, 72),
      `  Filter: ${PREDICATE}`,
      `  Rows Removed by Filter: ${N - actual}`,
    ].join('\n');
  }
  if (plan === 'Index Scan') {
    return [
      head('Index Scan using orders_created_at_idx on orders', c, 72),
      `  Index Cond: ${PREDICATE}`,
    ].join('\n');
  }
  const inner: Cost = { startup: 0, total: indexWalk(estimated) };
  return [
    head('Bitmap Heap Scan on orders', c, 72),
    `  Recheck Cond: ${PREDICATE}`,
    `  ->  ${head('Bitmap Index Scan on orders_created_at_idx', inner, 0)}`,
    `        Index Cond: ${PREDICATE}`,
  ].join('\n');
}
