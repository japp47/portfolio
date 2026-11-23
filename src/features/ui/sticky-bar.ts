const SHOW_AFTER_PX = 60;

/**
 * At the very top the header floats over the hero with nothing behind it. Once the page is
 * scrolled, text would slide straight through it, so it takes a background and a hairline.
 */
export function mountStickyBar(): void {
  const bar = document.querySelector<HTMLElement>('.bar');
  if (!bar) return;

  let scheduled = false;
  const update = () => {
    scheduled = false;
    bar.classList.toggle('is-stuck', scrollY > SHOW_AFTER_PX);
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  };

  addEventListener('scroll', schedule, { passive: true });
  update();
}
