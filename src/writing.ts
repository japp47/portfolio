/**
 * Entry point for the writing index. It shares the case-study styles, since a list of posts
 * and a case study want the same frame.
 */
import './styles/writing.css';

import { mountTerminal } from './features/terminal';
import { mountClock } from './features/ui/clock';
import { mountCursor } from './features/ui/cursor';
import { mountMagneticLinks } from './features/ui/magnetic';
import { mountReveal } from './features/ui/reveal';
import { mountStickyBar } from './features/ui/sticky-bar';
import { hasFinePointer, prefersReducedMotion } from './lib/media';

document.documentElement.classList.add('js', 'is-ready');

mountTerminal();
mountClock();
mountStickyBar();
mountReveal();

if (hasFinePointer() && !prefersReducedMotion()) {
  mountCursor();
  mountMagneticLinks();
}
