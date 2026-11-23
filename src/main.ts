/**
 * Entry point. Each feature lives in src/features and mounts itself on the markup in index.html;
 * this file only decides what runs and in which order.
 */
import './styles/index.css';

import { mountBinaryArt } from './features/binary-art';
import { mountField } from './features/field';
import { playIntro } from './features/hero/intro';
import { mountMotionHint } from './features/hero/motion-hint';
import { mountTerminal } from './features/terminal';
import { mountClock } from './features/ui/clock';
import { mountCursor } from './features/ui/cursor';
import { mountMagneticLinks } from './features/ui/magnetic';
import { mountStickyBar } from './features/ui/sticky-bar';
import { mountHoverScramble, mountReveal } from './features/ui/reveal';
import { hasFinePointer, prefersReducedMotion } from './lib/media';

// CSS hides the parts that animate in only when JavaScript is running
document.documentElement.classList.add('js');

const canvas = document.querySelector<HTMLCanvasElement>('.hero__field');
const field = canvas ? mountField(canvas) : null;
if (field) mountMotionHint(field);

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
