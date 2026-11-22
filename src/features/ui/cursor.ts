/**
 * The custom cursor: a dot that follows the mouse exactly and a ring that trails it,
 * growing over links and buttons. Only called on devices with a fine pointer.
 */
export function mountCursor(): void {
  const cursor = document.querySelector<HTMLElement>('.cursor');
  const dot = cursor?.querySelector<HTMLElement>('.cursor__dot');
  const ring = cursor?.querySelector<HTMLElement>('.cursor__ring');
  if (!cursor || !dot || !ring) return;

  document.body.classList.add('has-cursor');

  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let ringX = x;
  let ringY = y;

  addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
    dot.style.transform = `translate(${x}px, ${y}px)`;
    cursor.classList.toggle('is-link', Boolean((e.target as Element).closest('a, button')));
    cursor.classList.remove('is-hidden');
  });
  document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));

  const follow = () => {
    ringX += (x - ringX) * 0.16;
    ringY += (y - ringY) * 0.16;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(follow);
  };
  follow();
}
