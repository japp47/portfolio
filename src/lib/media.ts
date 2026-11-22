/** One place for the device and preference checks the features share. */

export const prefersReducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A mouse or trackpad: hover effects and the custom cursor make sense. */
export const hasFinePointer = (): boolean => matchMedia('(hover: hover) and (pointer: fine)').matches;

/** A phone or tablet: no hover, a finger for a pointer. */
export const isTouchDevice = (): boolean => matchMedia('(hover: none) and (pointer: coarse)').matches;

export const isSmallScreen = (): boolean => matchMedia('(max-width: 860px)').matches;

interface PermissionGate {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

const motionGate = (): PermissionGate => DeviceMotionEvent as unknown as PermissionGate;
const orientationGate = (): PermissionGate => DeviceOrientationEvent as unknown as PermissionGate;

/** iOS Safari only hands out motion sensors after a tap and a prompt. */
export const motionNeedsPermission = (): boolean =>
  typeof window.DeviceMotionEvent !== 'undefined' && typeof motionGate().requestPermission === 'function';

/** Asks for motion and orientation access where the browser requires it. */
export async function requestMotionPermission(): Promise<boolean> {
  if (!motionNeedsPermission()) return true;
  try {
    const motion = await motionGate().requestPermission!();
    const orientation = (await orientationGate().requestPermission?.()) ?? 'granted';
    return motion === 'granted' && orientation === 'granted';
  } catch {
    return false;
  }
}
