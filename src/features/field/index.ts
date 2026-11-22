import * as THREE from 'three';

import {
  isSmallScreen,
  isTouchDevice,
  motionNeedsPermission,
  prefersReducedMotion,
  requestMotionPermission,
} from '../../lib/media';
import { createSensors } from './sensors';
import { fragmentShader, vertexShader } from './shaders';

/**
 * The hero background: a terrain of dots drawn with three.js.
 * The mouse (desktop) or the phone's tilt pushes a soft bump into it, a shake scatters it,
 * and the terminal's `matrix` command tints it green for a moment.
 * The loop only runs while the hero is on screen and the tab is visible.
 */

export interface FieldControls {
  /** Turns on tilt and shake. On iOS this must be called from a tap. */
  enableMotion: () => Promise<boolean>;
}

const INK = new THREE.Color(0.93, 0.93, 0.92);
const MATRIX_GREEN = new THREE.Color(0.35, 1, 0.55);
const INTRO_SECONDS = 2.4;

export function mountField(canvas: HTMLCanvasElement): FieldControls | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
    });
  } catch {
    canvas.remove(); // no WebGL: the hero still reads fine on the plain background
    return null;
  }

  const reduceMotion = prefersReducedMotion();
  const pixelRatio = Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 1.55, 4.6);
  camera.lookAt(0, -0.35, 0);

  const uniforms = {
    uTime: { value: 0 },
    uIntro: { value: reduceMotion ? 1 : 0 },
    uMouse: { value: new THREE.Vector2(99, 99) },
    uMouseOn: { value: 0 },
    uPixel: { value: pixelRatio },
    uColor: { value: INK.clone() },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
  });
  scene.add(new THREE.Points(createDotGrid(isSmallScreen()), material));

  // what the bump and the colour are easing towards
  const bumpTarget = new THREE.Vector2(99, 99);
  let bumpOn = 0;
  const colorTarget = INK.clone();

  // --- render loop -------------------------------------------------------------------------
  let running = false;
  let visible = true;
  let frameId = 0;
  let lastFrame = performance.now();
  let time = 0;

  const draw = () => renderer.render(scene, camera);

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    time += dt;

    uniforms.uTime.value = time;
    uniforms.uIntro.value = Math.min(1, uniforms.uIntro.value + dt / INTRO_SECONDS);
    uniforms.uMouse.value.lerp(bumpTarget, 1 - Math.exp(-dt * 6));
    uniforms.uMouseOn.value += (bumpOn - uniforms.uMouseOn.value) * (1 - Math.exp(-dt * 4));
    uniforms.uColor.value.lerp(colorTarget, 1 - Math.exp(-dt * 3));

    draw();
    frameId = requestAnimationFrame(frame);
  };

  const start = () => {
    if (running || reduceMotion || !visible || document.hidden) return;
    running = true;
    lastFrame = performance.now();
    frameId = requestAnimationFrame(frame);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(frameId);
  };

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (!running) draw();
  };

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else stop();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  // --- mouse: project the pointer onto the ground plane ---------------------------------------
  const raycaster = new THREE.Raycaster();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const rect = canvas.getBoundingClientRect();
    if (e.clientY > rect.bottom) {
      bumpOn = 0;
      return;
    }
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.ray.intersectPlane(ground, hit)) {
      bumpTarget.set(hit.x, hit.z);
      bumpOn = 1;
    }
  });
  document.addEventListener('pointerleave', () => (bumpOn = 0));

  // --- phone: tilt and shake --------------------------------------------------------------------
  const sensors = createSensors({
    onTilt: (point) => {
      if (point) bumpTarget.set(point.x, point.z);
      bumpOn = point ? 1 : 0;
    },
    onShake: (strength) => {
      if (running) uniforms.uIntro.value = 0.5 - strength * 0.45; // harder shake, more scatter
    },
  });
  // Android and most browsers need no prompt; iOS waits for enableMotion() from a tap
  if (isTouchDevice() && !motionNeedsPermission() && !reduceMotion) sensors.start();

  // --- terminal easter egg ------------------------------------------------------------------------
  addEventListener('field:matrix', () => {
    colorTarget.copy(MATRIX_GREEN);
    setTimeout(() => colorTarget.copy(INK), 3200);
    if (!running) {
      uniforms.uColor.value.copy(MATRIX_GREEN);
      draw();
    }
  });

  resize();
  if (reduceMotion) {
    uniforms.uTime.value = 2; // a settled, still frame
    draw();
  } else {
    start();
  }

  return {
    async enableMotion() {
      if (reduceMotion) return false;
      const granted = await requestMotionPermission();
      if (granted) sensors.start();
      return granted;
    },
  };
}

/** A flat grid of dots on the x/z plane; the vertex shader lifts each one onto the surface. */
function createDotGrid(small: boolean): THREE.BufferGeometry {
  const cols = small ? 110 : 200;
  const rows = small ? 70 : 110;
  const width = 10;
  const depth = 7;

  const positions = new Float32Array(cols * rows * 3);
  const seeds = new Float32Array(cols * rows);

  for (let r = 0, i = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++, i++) {
      positions[i * 3] = (c / (cols - 1) - 0.5) * width;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = (r / (rows - 1) - 0.5) * depth;
      seeds[i] = Math.random();
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  return geometry;
}
