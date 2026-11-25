import { TIME_ZONE } from '../../config/site';

/** The live Bengaluru time: in the top bar, and in the phone menu. */
export function mountClock(): void {
  const els = document.querySelectorAll<HTMLElement>('#clock, [data-clock]');
  if (!els.length) return;

  const format = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const tick = () => {
    const now = format.format(new Date());
    els.forEach((el) => (el.textContent = now));
  };

  tick();
  setInterval(tick, 1000);
}
