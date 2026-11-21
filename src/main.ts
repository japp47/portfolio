import { mountField } from './field';
import { mountTerminal } from './terminal';
import { mountBinary } from './binary';

const root = document.documentElement;
root.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

// hero background
const canvas = document.querySelector<HTMLCanvasElement>('.hero__field');
const field = canvas ? mountField(canvas) : null;

// on phones a small hint offers the tilt and shake; on iOS tapping it asks for sensor access
const motionHint = document.querySelector<HTMLButtonElement>('[data-motion]');
if (field && motionHint && matchMedia('(hover: none) and (pointer: coarse)').matches && !reduce) {
  type Gate = { requestPermission?: () => unknown };
  const needsTap = typeof (DeviceMotionEvent as unknown as Gate).requestPermission === 'function';
  const label = motionHint.querySelector('span')!;
  label.textContent = needsTap ? 'tap, then tilt or shake your phone' : 'tilt or shake your phone';
  motionHint.hidden = false;
  motionHint.addEventListener('click', async () => {
    const ok = await field.requestMotion();
    label.textContent = ok ? 'tilt or shake your phone' : 'motion is off in this browser';
  });
}

mountTerminal();

// load sequence: the name rises once the fonts are in, then the binary greeting decodes
document.fonts.ready.then(() => {
  requestAnimationFrame(() => root.classList.add('is-ready'));
  const hi = document.querySelector<HTMLElement>('[data-scramble]');
  if (hi) setTimeout(() => scramble(hi, hi.dataset.scramble ?? '', 900), reduce ? 0 : 500);
  const art = document.getElementById('binary');
  if (art) mountBinary(art);
  const typed = document.getElementById('typed');
  if (typed && !reduce) setTimeout(() => typeLoop(typed), 2600);
});

/** Swap each character through random 0s and 1s until it settles on the target text. */
function scramble(el: HTMLElement, to: string, ms: number): void {
  if (reduce) { el.textContent = to; return; }
  const from = el.textContent ?? '';
  const len = Math.max(from.length, to.length);
  const start = performance.now();
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / ms);
    let out = '';
    for (let i = 0; i < len; i++) {
      const settle = i / len;
      if (p > settle * 0.7 + 0.3) out += to[i] ?? '';
      else if (to[i] === ' ' || from[i] === ' ') out += ' ';
      else out += Math.random() < 0.5 ? '0' : '1';
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Types and erases a short list of roles, forever, slowly. */
function typeLoop(el: HTMLElement): void {
  const roles = ['backend engineer', 'system designer', 'maker of 99ile', 'graph nerd', 'builder of small games'];
  let r = 0, n = roles[0].length, deleting = true;
  const tick = () => {
    const word = roles[r];
    n += deleting ? -1 : 1;
    el.textContent = word.slice(0, n);
    let wait = deleting ? 38 : 70;
    if (deleting && n === 0) { deleting = false; r = (r + 1) % roles.length; wait = 300; }
    else if (!deleting && n === roles[r].length) { deleting = true; wait = 2400; }
    setTimeout(tick, wait);
  };
  setTimeout(tick, 400);
}

// live clock in Bengaluru
const clock = document.getElementById('clock');
if (clock) {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const tick = () => { clock.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 1000);
}

// reveal sections once as they come into view
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('[data-reveal]').forEach((el, i) => {
  (el as HTMLElement).style.transitionDelay = `${(i % 4) * 70}ms`;
  io.observe(el);
});

// the big "say hi" decodes through binary on hover
const big = document.querySelector<HTMLElement>('[data-scramble-hover]');
if (big) {
  const word = big.textContent ?? '';
  big.addEventListener('mouseenter', () => scramble(big, word, 600));
}

if (finePointer && !reduce) {
  // custom cursor: the dot follows exactly, the ring trails
  const cursor = document.querySelector<HTMLElement>('.cursor');
  const dot = cursor?.querySelector<HTMLElement>('.cursor__dot');
  const ring = cursor?.querySelector<HTMLElement>('.cursor__ring');
  if (cursor && dot && ring) {
    document.body.classList.add('has-cursor');
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      dot.style.transform = `translate(${x}px, ${y}px)`;
      cursor.classList.toggle('is-link', !!(e.target as Element).closest('a, button'));
      cursor.classList.remove('is-hidden');
    });
    document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
    const follow = () => {
      rx += (x - rx) * 0.16; ry += (y - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(follow);
    };
    follow();
  }

  // magnetic links: they lean a little toward the pointer
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.25}px, ${dy * 0.35}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)';
      el.style.transform = '';
      setTimeout(() => (el.style.transition = ''), 500);
    });
  });
}
