import { prefersReducedMotion } from './media';

/**
 * Swaps each character through random 0s and 1s until it settles on the target text,
 * left to right. Spaces stay spaces so the word shapes read while it decodes.
 */
export function scramble(el: HTMLElement, to: string, durationMs: number): void {
  if (prefersReducedMotion()) {
    el.textContent = to;
    return;
  }

  const from = el.textContent ?? '';
  const length = Math.max(from.length, to.length);
  const start = performance.now();

  const step = (now: number) => {
    const progress = Math.min(1, (now - start) / durationMs);
    let text = '';
    for (let i = 0; i < length; i++) {
      const settlesAt = (i / length) * 0.7 + 0.3;
      if (progress > settlesAt) text += to[i] ?? '';
      else if (to[i] === ' ' || from[i] === ' ') text += ' ';
      else text += Math.random() < 0.5 ? '0' : '1';
    }
    el.textContent = text;
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}
