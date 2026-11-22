/**
 * Phone sensors for the dot field. Tilting rolls the bump across the terrain like a marble;
 * shaking scatters the dots back into noise. This only reads sensors: touch input is untouched.
 */

export interface SensorHandlers {
  /** A point on the terrain (x across, z towards the viewer), or null when the phone is held level. */
  onTilt: (point: { x: number; z: number } | null) => void;
  /** strength 0..1, how hard the phone was shaken. */
  onShake: (strength: number) => void;
}

const TILT_RANGE_DEG = 25;
const SHAKE_THRESHOLD = 22; // change in m/s² between two readings
const SHAKE_COOLDOWN_MS = 1200;

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

export function createSensors(handlers: SensorHandlers): { start: () => void } {
  let listening = false;
  // the way the phone is held when the page opens counts as level
  let level: { beta: number; gamma: number } | null = null;
  let lastReading: { x: number; y: number; z: number } | null = null;
  let lastShakeAt = 0;

  const onOrientation = (e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null) return;
    level ??= { beta: e.beta, gamma: e.gamma };
    const x = clamp((e.gamma - level.gamma) / TILT_RANGE_DEG);
    const z = clamp((e.beta - level.beta) / TILT_RANGE_DEG);
    const heldStill = Math.abs(x) + Math.abs(z) < 0.06;
    handlers.onTilt(heldStill ? null : { x: x * 3.4, z: 0.6 + z * 2.2 });
  };

  const onMotion = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null || a.z == null) return;
    const now = performance.now();
    if (lastReading) {
      const jolt =
        Math.abs(a.x - lastReading.x) + Math.abs(a.y - lastReading.y) + Math.abs(a.z - lastReading.z);
      if (jolt > SHAKE_THRESHOLD && now - lastShakeAt > SHAKE_COOLDOWN_MS) {
        lastShakeAt = now;
        handlers.onShake(Math.min(1, (jolt - SHAKE_THRESHOLD) / 30));
        navigator.vibrate?.(18);
      }
    }
    lastReading = { x: a.x, y: a.y, z: a.z };
  };

  // coming back to the tab re-centres the marble
  document.addEventListener('visibilitychange', () => {
    level = null;
    lastReading = null;
  });

  return {
    start() {
      if (listening) return;
      listening = true;
      addEventListener('deviceorientation', onOrientation);
      addEventListener('devicemotion', onMotion);
    },
  };
}
