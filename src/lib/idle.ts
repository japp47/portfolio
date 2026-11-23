type IdleWindow = typeof globalThis & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

/**
 * Runs work once the browser is not busy, so a heavy import never competes with first paint.
 * Falls back to a short timeout where requestIdleCallback is missing (Safari before 18).
 */
export function whenIdle(run: () => void, timeout = 1500): void {
  const idle = (globalThis as IdleWindow).requestIdleCallback;
  if (idle) idle(run, { timeout });
  else setTimeout(run, 200);
}
