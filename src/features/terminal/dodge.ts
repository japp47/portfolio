const GAP_PX = 16;

/**
 * The terminal button floats in the bottom-right corner. When a row of links scrolls under it
 * (the hero's links at the top, the footer's at the bottom) it moves up just enough to clear them.
 */
export function dodgeLinkRows(button: HTMLElement, rowSelector: string): void {
  const rows = [...document.querySelectorAll<HTMLElement>(rowSelector)];
  let scheduled = false;

  const update = () => {
    scheduled = false;
    // offset* ignores transforms, so this is the button's resting spot, not mid-animation
    const btn = {
      left: button.offsetLeft,
      top: button.offsetTop,
      right: button.offsetLeft + button.offsetWidth,
      bottom: button.offsetTop + button.offsetHeight,
    };

    let lift = 0;
    for (const row of rows) {
      const r = row.getBoundingClientRect();
      const overlaps =
        r.left < btn.right && r.right > btn.left && r.top < btn.bottom + 12 && r.bottom > btn.top;
      if (overlaps) lift = Math.max(lift, btn.bottom - r.top + GAP_PX);
    }

    button.style.setProperty('--lift', `${lift}px`);
    button.classList.toggle('is-lifted', lift > 0);
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  };

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  document.fonts.ready.then(schedule);
}
