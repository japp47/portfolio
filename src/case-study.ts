/**
 * Entry point for a case-study page. Shares the header, cursor and terminal with the
 * landing page; adds the diagram interactions. No hero field and no binary art here.
 */
import './styles/case.css';

import { mountDiagramHighlight, mountSequenceReveal, mountSwaps } from './features/diagrams';
import { mountTerminal } from './features/terminal';
import { mountClock } from './features/ui/clock';
import { mountCursor } from './features/ui/cursor';
import { mountMagneticLinks } from './features/ui/magnetic';
import { mountStickyBar } from './features/ui/sticky-bar';
import { mountReveal } from './features/ui/reveal';
import { hasFinePointer, prefersReducedMotion } from './lib/media';

document.documentElement.classList.add('js', 'is-ready');

mountTerminal();
mountClock();
mountStickyBar();
mountReveal();
mountSwaps();
mountDiagramHighlight();
mountSequenceReveal();

if (hasFinePointer() && !prefersReducedMotion()) {
  mountCursor();
  mountMagneticLinks();
}
