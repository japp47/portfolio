import * as THREE from 'three';

/*
  The hero background: a terrain of dots whose height is a sum of sine waves ("dream in equations").
  On load every dot starts at a random height, like binary noise, and eases onto the surface.
  The pointer pushes a soft bump into the terrain. Everything runs in the vertex shader, so the
  CPU only updates a few uniforms a frame. The loop stops while the hero is off screen or the tab
  is hidden, and under reduced motion the field is drawn once, settled.
*/

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uIntro;
  uniform vec2 uMouse;
  uniform float uMouseOn;
  uniform float uPixel;
  attribute float aSeed;
  varying float vAlpha;

  float surface(vec2 p, float t) {
    return 0.22 * sin(p.x * 1.15 + t * 0.35) * cos(p.y * 0.9 - t * 0.25)
         + 0.09 * sin(p.x * 2.6 - p.y * 1.9 + t * 0.6)
         + 0.05 * cos(length(p) * 3.0 - t * 0.8);
  }

  void main() {
    vec3 pos = position;
    float h = surface(pos.xz, uTime);
    float d = distance(pos.xz, uMouse);
    float bump = uMouseOn * 0.42 * exp(-d * d * 2.2) * smoothstep(-3.0, -0.6, pos.z);
    float noise = (aSeed - 0.5) * 2.4;
    float k = smoothstep(0.0, 1.0, clamp(uIntro * 1.4 - aSeed * 0.4, 0.0, 1.0));
    pos.y = mix(noise, h + bump, k);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = uPixel * (2.2 + bump * 4.0) * (6.0 / depth);

    float edge = smoothstep(4.6, 2.6, abs(pos.x)) * smoothstep(7.6, 4.6, depth) * smoothstep(-3.5, -1.6, position.z);
    vAlpha = edge * (0.28 + 0.55 * smoothstep(-0.25, 0.3, h + bump)) * mix(0.5, 1.0, k);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    gl_FragColor = vec4(uColor, vAlpha * smoothstep(0.5, 0.2, r));
  }
`;

/** Returned so the page can ask for motion access from a tap (iOS only allows it from a user gesture). */
export interface FieldControls { requestMotion: () => Promise<boolean> }

export function mountField(canvas: HTMLCanvasElement): FieldControls | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
  } catch {
    canvas.remove();
    return null;
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 860px)').matches;
  const dpr = Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 1.55, 4.6);
  camera.lookAt(0, -0.35, 0);

  // a grid of dots on the x/z plane; the shader lifts each one onto the surface
  const cols = small ? 110 : 200;
  const rows = small ? 70 : 110;
  const width = 10, depth = 7;
  const pos = new Float32Array(cols * rows * 3);
  const seed = new Float32Array(cols * rows);
  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      pos[i * 3] = (c / (cols - 1) - 0.5) * width;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = (r / (rows - 1) - 0.5) * depth;
      seed[i] = Math.random();
      i++;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

  const uniforms = {
    uTime: { value: 0 },
    uIntro: { value: reduce ? 1 : 0 },
    uMouse: { value: new THREE.Vector2(99, 99) },
    uMouseOn: { value: 0 },
    uPixel: { value: dpr },
    uColor: { value: new THREE.Color(0.93, 0.93, 0.92) },
  };
  const mat = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, transparent: true, depthWrite: false });
  scene.add(new THREE.Points(geo, mat));

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (!running) renderer.render(scene, camera);
  };
  new ResizeObserver(resize).observe(canvas);

  // the pointer, projected onto the ground plane, eased so the bump trails it
  const ray = new THREE.Raycaster();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  const target = new THREE.Vector2(99, 99);
  let mouseOn = 0;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = canvas.getBoundingClientRect();
    if (e.clientY > r.bottom) { mouseOn = 0; return; }
    ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    if (ray.ray.intersectPlane(ground, hit)) { target.set(hit.x, hit.z); mouseOn = 1; }
  });
  document.addEventListener('pointerleave', () => { mouseOn = 0; });

  // phones: tilting rolls the bump across the terrain, like a marble; shaking scatters the dots back
  // into binary noise and lets them settle again. Touch input is untouched: this only reads sensors.
  let tiltBase: { beta: number; gamma: number } | null = null;
  const onTilt = (e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null) return;
    tiltBase ??= { beta: e.beta, gamma: e.gamma };
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const x = clamp((e.gamma - tiltBase.gamma) / 25);
    const z = clamp((e.beta - tiltBase.beta) / 25);
    if (Math.abs(x) + Math.abs(z) < 0.06) { mouseOn = 0; return; } // held still: no bump
    target.set(x * 3.4, 0.6 + z * 2.2);
    mouseOn = 1;
  };
  let lastAcc: { x: number; y: number; z: number } | null = null;
  let lastShake = 0;
  const onMotion = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null || a.z == null) return;
    const now = performance.now();
    if (lastAcc) {
      const jolt = Math.abs(a.x - lastAcc.x) + Math.abs(a.y - lastAcc.y) + Math.abs(a.z - lastAcc.z);
      if (jolt > 22 && now - lastShake > 1200 && running) {
        lastShake = now;
        uniforms.uIntro.value = Math.max(0.05, 0.5 - (jolt - 22) / 60); // harder shake, more scatter
        navigator.vibrate?.(18);
      }
    }
    lastAcc = { x: a.x, y: a.y, z: a.z };
  };
  let listening = false;
  const listen = () => {
    if (listening || reduce) return;
    listening = true;
    addEventListener('deviceorientation', onTilt);
    addEventListener('devicemotion', onMotion);
  };
  const touchOnly = matchMedia('(hover: none) and (pointer: coarse)').matches;
  type Gate = { requestPermission?: () => Promise<'granted' | 'denied'> };
  const gated = typeof (DeviceMotionEvent as unknown as Gate).requestPermission === 'function';
  if (touchOnly && !gated) listen(); // Android and most browsers: sensors need no prompt
  // a phone turned back upright re-centres the marble
  document.addEventListener('visibilitychange', () => { tiltBase = null; lastAcc = null; });

  // the terminal's `matrix` command tints the field green for a moment
  const base = new THREE.Color(0.93, 0.93, 0.92);
  const tint = base.clone();
  addEventListener('field:matrix', () => {
    tint.setRGB(0.35, 1, 0.55);
    setTimeout(() => tint.copy(base), 3200);
    if (!running) { uniforms.uColor.value.copy(tint); renderer.render(scene, camera); }
  });

  let running = false, visible = true, raf = 0, last = performance.now(), t = 0;
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    uniforms.uTime.value = t;
    uniforms.uIntro.value = Math.min(1, uniforms.uIntro.value + dt / 2.4);
    uniforms.uMouse.value.lerp(target, 1 - Math.exp(-dt * 6));
    uniforms.uMouseOn.value += (mouseOn - uniforms.uMouseOn.value) * (1 - Math.exp(-dt * 4));
    uniforms.uColor.value.lerp(tint, 1 - Math.exp(-dt * 3));
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (running || reduce || !visible || document.hidden) return;
    running = true; last = performance.now(); raf = requestAnimationFrame(frame);
  };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); else stop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  resize();
  if (reduce) { uniforms.uTime.value = 2; renderer.render(scene, camera); } else start();

  return {
    // iOS asks once; elsewhere this just resolves true
    requestMotion: async () => {
      if (reduce) return false;
      try {
        if (gated) {
          const m = await (DeviceMotionEvent as unknown as Gate).requestPermission!();
          const o = await ((DeviceOrientationEvent as unknown as Gate).requestPermission?.() ?? Promise.resolve('granted'));
          if (m !== 'granted' || o !== 'granted') return false;
        }
        listen();
        return true;
      } catch {
        return false;
      }
    },
  };
}
