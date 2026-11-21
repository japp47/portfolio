import * as THREE from 'three';

/*
  The hero's "product": the Zora AI invoice approval engine as five parts spread along one axis,
  like an exploded drawing. Parts slide in once on load, lift on hover, and the drawing turns a little
  when dragged sideways. It renders only while something moves, and holds still under reduced motion.
*/

type Detail = 'rows' | 'slots' | 'ring' | 'lanes' | 'envelope';
interface PartSpec { id: string; w: number; h: number; d: number; detail: Detail }

// bottom-left to top-right: the request enters at the email link and lands in PostgreSQL
const PARTS: PartSpec[] = [
  { id: 'pg', w: 190, h: 30, d: 150, detail: 'rows' },
  { id: 'sap', w: 176, h: 16, d: 140, detail: 'slots' },
  { id: 'fga', w: 160, h: 14, d: 128, detail: 'ring' },
  { id: 'tmp', w: 176, h: 20, d: 140, detail: 'lanes' },
  { id: 'mail', w: 128, h: 8, d: 96, detail: 'envelope' },
];

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = 140; // ms, exponential ease-out

interface Anim { c: number; t: number }
const anim = (v: number): Anim => ({ c: v, t: v });

export function mountEngine(stage: HTMLElement): void {
  const frame = stage.querySelector<HTMLElement>('[data-gl]');
  const canvas = frame?.querySelector('canvas');
  if (!frame || !canvas) return;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    stage.classList.add('no-gl');
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const css = getComputedStyle(document.documentElement);
  const color = (name: string, fallback: string) => new THREE.Color(css.getPropertyValue(name).trim() || fallback);
  const bg = color('--p-bg', '#eeecea');
  const ink = color('--p-ink', '#333231');
  const accent = color('--p-accent', '#5c6b54');
  const top = bg.clone().lerp(new THREE.Color('#ffffff'), 0.55);
  const side1 = bg.clone().lerp(ink, 0.07);
  const side2 = bg.clone().lerp(ink, 0.14);
  const detailInk = bg.clone().lerp(ink, 0.45);

  const scene = new THREE.Scene();
  const rig = new THREE.Group();
  scene.add(rig);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 5000);
  const viewDir = new THREE.Vector3(0.62, 0.78, 1).normalize();

  const vars: Anim[] = [];
  const v = (x: number) => { const a = anim(x); vars.push(a); return a; };
  const yaw = v(0);

  const parts = PARTS.map((p) => {
    const geo = new THREE.BoxGeometry(p.w, p.h, p.d);
    const mat = (c: THREE.Color) => new THREE.MeshBasicMaterial({ color: c, transparent: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    const mats = [mat(side1), mat(side1), mat(top), mat(top), mat(side2), mat(side2)];
    const mesh = new THREE.Mesh(geo, mats);
    mesh.userData.id = p.id;
    const edgeMat = new THREE.LineBasicMaterial({ color: ink, transparent: true });
    const detMat = new THREE.LineBasicMaterial({ color: detailInk, transparent: true });
    const g = new THREE.Group();
    g.add(mesh, new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat), new THREE.LineSegments(detailGeometry(p), detMat));
    rig.add(g);
    return { p, g, mesh, mats, edgeMat, detMat, x: v(0), y: v(0), op: v(0), lift: v(0), heat: v(0) };
  });

  // the exploded layout depends on the stage's shape: wide stages spread along x, tall ones climb
  let W = 0, H = 0;
  const layout = (spread: number) => {
    const wide = W / Math.max(H, 1) > 1.25;
    const step = (wide ? 200 : 118) * spread;
    const rise = (wide ? 96 : 84) * spread;
    let y = 0;
    return parts.map((P, i) => {
      const k = i - (parts.length - 1) / 2;
      const pos = { x: k * step, y: y + P.p.h / 2 + k * rise };
      y += P.p.h;
      return pos;
    }).map((pos, _i, all) => {
      const mid = (all[0].y + all[all.length - 1].y) / 2;
      return { x: pos.x, y: pos.y - mid };
    });
  };

  // fit the exploded drawing into the canvas once per size, with room for the hotspot discs
  const fit = () => {
    const target = layout(1);
    const box = new THREE.Box2();
    const tmp = new THREE.Vector3();
    cam.position.copy(viewDir).multiplyScalar(2000);
    cam.lookAt(0, 0, 0);
    cam.left = -1; cam.right = 1; cam.top = 1; cam.bottom = -1; cam.zoom = 1;
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const view = cam.matrixWorldInverse;
    parts.forEach((P, i) => {
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
        tmp.set(target[i].x + sx * P.p.w / 2, target[i].y + sy * (P.p.h / 2 + 10), sz * P.p.d / 2).applyMatrix4(view);
        box.expandByPoint(new THREE.Vector2(tmp.x, tmp.y));
      }
    });
    const size = box.getSize(new THREE.Vector2());
    const center = box.getCenter(new THREE.Vector2());
    const pad = 1.04;
    const aspect = W / H;
    let hw = (size.x * pad) / 2, hh = (size.y * pad) / 2;
    if (hw / hh > aspect) hh = hw / aspect; else hw = hh * aspect;
    cam.left = center.x - hw; cam.right = center.x + hw;
    cam.top = center.y + hh; cam.bottom = center.y - hh;
    cam.updateProjectionMatrix();
  };

  const settle = (spread: number, stagger: number) => {
    const pos = layout(spread);
    parts.forEach((P, i) => {
      const go = () => { P.x.t = pos[i].x; P.y.t = pos[i].y; P.op.t = 1; kick(); };
      if (stagger && !reduce) setTimeout(go, i * stagger); else go();
    });
  };

  // hotspots follow the top face of their part
  const spots = [...stage.querySelectorAll<HTMLElement>('.ly-spot[data-part]')];
  const placeSpots = () => {
    const sr = stage.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();
    if (!sr.width || !sr.height) return;
    for (const el of spots) {
      const P = parts.find((q) => q.p.id === el.dataset.part);
      if (!P) continue;
      const pt = new THREE.Vector3(P.p.w * 0.18, P.p.h / 2, P.p.d * 0.18);
      P.g.localToWorld(pt);
      pt.project(cam);
      const px = cr.left - sr.left + (pt.x + 1) / 2 * cr.width;
      const py = cr.top - sr.top + (1 - pt.y) / 2 * cr.height;
      el.style.setProperty('--x', `${(px / sr.width * 100).toFixed(2)}%`);
      el.style.setProperty('--y', `${(py / sr.height * 100).toFixed(2)}%`);
      el.toggleAttribute('data-hidden', P.op.c < 0.9);
    }
  };

  let raf = 0, last = 0;
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  const tick = (t: number) => {
    raf = 0;
    const dt = Math.min(64, t - last); last = t;
    const k = reduce ? 1 : 1 - Math.exp(-dt / TAU);
    let moving = false;
    for (const a of vars) {
      const d = a.t - a.c;
      if (Math.abs(d) > 0.01) { a.c += d * k; moving = true; } else a.c = a.t;
    }
    rig.rotation.y = yaw.c;
    for (const P of parts) {
      P.g.position.set(P.x.c, P.y.c + P.lift.c, 0);
      P.g.visible = P.op.c > 0.01;
      for (const m of P.mats) m.opacity = P.op.c;
      P.edgeMat.opacity = P.op.c;
      P.detMat.opacity = P.op.c;
      P.edgeMat.color.copy(ink).lerp(accent, P.heat.c);
      P.detMat.color.copy(detailInk).lerp(accent, P.heat.c);
    }
    renderer.render(scene, cam);
    placeSpots();
    if (moving) raf = requestAnimationFrame(tick);
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const first = !W;
    W = r.width; H = r.height;
    renderer.setSize(W, H, false);
    fit();
    if (first) {
      // start far apart and invisible, then slide together into the exploded view, bottom part first
      const far = layout(2.2);
      parts.forEach((P, i) => { P.x.c = far[i].x; P.y.c = far[i].y + 60; });
      settle(1, 110);
    } else {
      settle(1, 0);
      for (const P of parts) { P.x.c = P.x.t; P.y.c = P.y.t; }
    }
    kick();
  };
  new ResizeObserver(resize).observe(canvas);

  // hover lifts a part and tints it; the matching hotspot opens its card
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let hot: string | null = null;
  const setHot = (id: string | null) => {
    if (id === hot) return;
    hot = id;
    for (const P of parts) { const on = P.p.id === id; P.lift.t = on ? 10 : 0; P.heat.t = on ? 1 : 0; }
    for (const el of spots) el.classList.toggle('is-open', el.dataset.part === id);
    kick();
  };
  for (const el of spots) {
    el.addEventListener('mouseenter', () => setHot(el.dataset.part ?? null));
    el.addEventListener('mouseleave', () => setHot(null));
  }

  let drag: { x: number; yaw: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, yaw: yaw.c }; });
  addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('pointermove', (e) => {
    if (drag) {
      yaw.t = yaw.c = Math.max(-0.45, Math.min(0.45, drag.yaw + (e.clientX - drag.x) * 0.006));
      kick();
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const r = canvas.getBoundingClientRect();
    ptr.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, cam);
    const hit = ray.intersectObjects(parts.map((P) => P.mesh))[0];
    setHot(hit ? (hit.object.userData.id as string) : null);
  });
  canvas.addEventListener('pointerleave', () => { if (!drag) setHot(null); });
}

function detailGeometry(p: PartSpec): THREE.BufferGeometry {
  const w = p.w / 2, d = p.d / 2;
  const s: number[][] = [];
  const rect = (x: number, z: number, a: number, b: number) =>
    s.push([x, z, x + a, z], [x + a, z, x + a, z + b], [x + a, z + b, x, z + b], [x, z + b, x, z]);
  switch (p.detail) {
    case 'rows':
      for (let i = 1; i < 6; i++) { const z = -d + i * p.d / 6; s.push([-w + 14, z, w - 14, z]); }
      break;
    case 'slots': {
      const cw = (p.w - 28) / 4;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) rect(-w + 14 + i * cw + 4, -d + 16 + j * (p.d - 32) / 2 + 4, cw - 8, (p.d - 32) / 2 - 8);
      break;
    }
    case 'ring': {
      const r = Math.min(w, d) * 0.5;
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2, b = ((i + 1) / 48) * Math.PI * 2;
        s.push([Math.cos(a) * r, Math.sin(a) * r, Math.cos(b) * r, Math.sin(b) * r]);
      }
      s.push([-r * 0.35, 0, r * 0.35, 0], [0, -r * 0.35, 0, r * 0.35]);
      break;
    }
    case 'lanes':
      for (let i = 0; i < 3; i++) { const z = -d + 22 + i * (p.d - 44) / 2; s.push([-w + 16, z, w - 16, z]); rect(-w + 30 + i * 36, z - 7, 30, 14); }
      break;
    case 'envelope':
      rect(-w + 12, -d + 12, p.w - 24, p.d - 24);
      s.push([-w + 12, -d + 12, 0, 6], [0, 6, w - 12, -d + 12]);
      break;
  }
  const y = p.h / 2 + 0.4;
  const pos: number[] = [];
  for (const [a, b, c, e] of s) pos.push(a, y, b, c, y, e);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}
