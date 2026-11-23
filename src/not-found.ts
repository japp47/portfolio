/**
 * Entry point for 404.html. Shares the header, cursor and terminal with every other page,
 * and writes the path that was actually asked for into the fake shell line.
 */
import './styles/not-found.css';

import { mountTerminal } from './features/terminal';
import { mountClock } from './features/ui/clock';
import { mountCursor } from './features/ui/cursor';
import { mountMagneticLinks } from './features/ui/magnetic';
import { mountStickyBar } from './features/ui/sticky-bar';
import { hasFinePointer, prefersReducedMotion } from './lib/media';

document.documentElement.classList.add('js', 'is-ready');

const path = document.getElementById('lost-path');
if (path) {
  // whatever they typed, shown as text — never as markup
  path.textContent = location.pathname + location.search;
}

mountTerminal();
mountClock();
mountStickyBar();

if (hasFinePointer() && !prefersReducedMotion()) {
  mountCursor();
  mountMagneticLinks();
}
