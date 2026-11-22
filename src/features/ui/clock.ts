import { TIME_ZONE } from '../../config/site';

/** The live Bengaluru time in the top bar. */
export function mountClock(): void {
  const el = document.getElementById('clock');
  if (!el) return;

  const format = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const tick = () => (el.textContent = format.format(new Date()));

  tick();
  setInterval(tick, 1000);
}
