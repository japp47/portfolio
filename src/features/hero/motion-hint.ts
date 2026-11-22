import { isTouchDevice, motionNeedsPermission, prefersReducedMotion } from '../../lib/media';
import type { FieldControls } from '../field';

/**
 * On phones, a small pill under the intro invites a tilt or a shake.
 * On iOS the sensors stay off until it is tapped, so the label says so.
 */
export function mountMotionHint(field: FieldControls): void {
  const hint = document.querySelector<HTMLButtonElement>('[data-motion]');
  const label = hint?.querySelector('span');
  if (!hint || !label || !isTouchDevice() || prefersReducedMotion()) return;

  label.textContent = motionNeedsPermission()
    ? 'tap, then tilt or shake your phone'
    : 'tilt or shake your phone';
  hint.hidden = false;

  hint.addEventListener('click', async () => {
    const granted = await field.enableMotion();
    label.textContent = granted ? 'tilt or shake your phone' : 'motion is off in this browser';
  });
}
