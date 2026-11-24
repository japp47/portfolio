import { mountTerminal } from './terminal';
import { mountClock } from './ui/clock';
import { mountCursor } from './ui/cursor';
import { mountMagneticLinks } from './ui/magnetic';
import { mountStickyBar } from './ui/sticky-bar';
import { hasFinePointer, prefersReducedMotion } from '../lib/media';

/**
 * The chrome every page shares: the header's clock and sticky background, the terminal,
 * and the pointer effects where a pointer exists. Each entry point calls this, then adds
 * whatever that page needs on top.
 */
export function mountChrome(): void {
  document.documentElement.classList.add('js', 'is-ready');

  mountTerminal();
  mountClock();
  mountStickyBar();

  if (hasFinePointer() && !prefersReducedMotion()) {
    mountCursor();
    mountMagneticLinks();
  }
}
