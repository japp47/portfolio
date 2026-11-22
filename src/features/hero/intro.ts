import { prefersReducedMotion } from '../../lib/media';
import { scramble } from '../../lib/scramble';

const ROLES = [
  'backend engineer',
  'system designer',
  'maker of 99ile',
  'graph nerd',
  'builder of small games',
];

/**
 * The load sequence: once the fonts are in, the name rises (CSS, via .is-ready),
 * "01101000 01101001" decodes into "hi, I'm", and the role line starts typing.
 */
export function playIntro(): void {
  const reduceMotion = prefersReducedMotion();
  requestAnimationFrame(() => document.documentElement.classList.add('is-ready'));

  const greeting = document.querySelector<HTMLElement>('[data-scramble]');
  if (greeting) {
    setTimeout(() => scramble(greeting, greeting.dataset.scramble ?? '', 900), reduceMotion ? 0 : 500);
  }

  const typed = document.getElementById('typed');
  if (typed && !reduceMotion) setTimeout(() => typeRoles(typed), 2600);
}

/** Types and erases each role in turn, forever, slowly. */
function typeRoles(el: HTMLElement): void {
  let role = 0;
  let length = ROLES[0].length;
  let deleting = true;

  const tick = () => {
    length += deleting ? -1 : 1;
    el.textContent = ROLES[role].slice(0, length);

    let wait = deleting ? 38 : 70;
    if (deleting && length === 0) {
      deleting = false;
      role = (role + 1) % ROLES.length;
      wait = 300;
    } else if (!deleting && length === ROLES[role].length) {
      deleting = true;
      wait = 2400; // let the finished word sit
    }
    setTimeout(tick, wait);
  };

  setTimeout(tick, 400);
}
