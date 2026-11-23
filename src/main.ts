/**
 * Entry point. Each feature lives in src/features and mounts itself on the markup in index.html;
 * this file only decides what runs and in which order.
 */
import './styles/index.css';

import { mountBinaryArt } from './features/binary-art';
import { playIntro } from './features/hero/intro';
import { mountTerminal } from './features/terminal';
import { mountClock } from './features/ui/clock';
import { mountCursor } from './features/ui/cursor';
import { mountMagneticLinks } from './features/ui/magnetic';
import { mountStickyBar } from './features/ui/sticky-bar';
import { mountHoverScramble, mountReveal } from './features/ui/reveal';
import { whenIdle } from './lib/idle';
import { hasFinePointer, prefersReducedMotion } from './lib/media';

// CSS hides the parts that animate in only when JavaScript is running
document.documentElement.classList.add('js');

// three.js is by far the heaviest thing here and it only paints the backdrop, so it is
// imported once the browser is idle. Until then the canvas is simply transparent and the
// hero reads exactly as it will afterwards.
const canvas = document.querySelector<HTMLCanvasElement>('.hero__field');
if (canvas) whenIdle(() => void startField(canvas));

async function startField(el: HTMLCanvasElement): Promise<void> {
  const [{ mountField }, { mountMotionHint }] = await Promise.all([
    import('./features/field'),
    import('./features/hero/motion-hint'),
  ]);
  const field = mountField(el);
  if (field) mountMotionHint(field);
}

mountTerminal();
mountClock();
mountStickyBar();
mountReveal();
mountHoverScramble();

if (hasFinePointer() && !prefersReducedMotion()) {
  mountCursor();
  mountMagneticLinks();
}

// wait for the fonts so the name rises in its real shape and the art samples the right letters
document.fonts.ready.then(() => {
  playIntro();
  const art = document.getElementById('binary');
  if (art) mountBinaryArt(art);
});
