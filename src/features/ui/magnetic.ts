const PULL_X = 0.25;
const PULL_Y = 0.35;

/** Links marked [data-magnetic] lean a little towards the pointer and spring back when it leaves. */
export function mountMagneticLinks(): void {
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate(${dx * PULL_X}px, ${dy * PULL_Y}px)`;
    });

    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
      el.style.transform = '';
      setTimeout(() => (el.style.transition = ''), 500);
    });
  });
}
