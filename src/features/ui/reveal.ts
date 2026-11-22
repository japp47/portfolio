import { scramble } from '../../lib/scramble';

/**
 * Elements marked [data-reveal] rise in once as they scroll into view.
 * Without JavaScript they are simply visible (the hiding CSS needs the .js class).
 */
export function mountReveal(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 70}ms`; // neighbours arrive one after another
    observer.observe(el);
  });
}

/** The big "say hi" decodes through binary each time the mouse arrives. */
export function mountHoverScramble(): void {
  document.querySelectorAll<HTMLElement>('[data-scramble-hover]').forEach((el) => {
    const word = el.textContent ?? '';
    el.addEventListener('mouseenter', () => scramble(el, word, 600));
  });
}
