/*
  "jsc" drawn in 0s and 1s for the About section. The letters are sampled from a tiny canvas,
  so the art always fits its box. Inside the letters the digits are bright; around them they are
  faint and a few flip now and then. Under the pointer the digits light up like a torch.
*/

export function mountBinary(pre: HTMLElement): void {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cells: HTMLSpanElement[] = [];
  let inside: boolean[] = [];
  let cols = 0, rows = 0;

  const build = () => {
    const cs = getComputedStyle(pre);
    const probe = document.createElement('span');
    probe.textContent = '0';
    probe.style.position = 'absolute';
    pre.append(probe);
    const cw = probe.getBoundingClientRect().width + parseFloat(cs.letterSpacing || '0');
    const ch = parseFloat(cs.lineHeight) || probe.getBoundingClientRect().height;
    probe.remove();
    const width = pre.clientWidth;
    if (!width || !cw) return;
    const nextCols = Math.floor(width / cw);
    if (nextCols === cols) return; // only a new width needs new art
    cols = nextCols;
    rows = Math.round((cols * cw) / (ch * 1.7)); // the art box is about 1.7 times wider than tall

    // draw the letters on a canvas one pixel per character cell, squashed for the cell's shape
    const c = document.createElement('canvas');
    c.width = cols; c.height = rows;
    const ctx = c.getContext('2d')!;
    const font = (s: number) => `700 ${s}px Geist, system-ui, sans-serif`;
    let size = rows * 1.6;
    ctx.font = font(size);
    size *= (cols * 0.8) / ctx.measureText('jsc').width;
    ctx.setTransform(1, 0, 0, cw / ch, 0, 0);
    ctx.font = font(size);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = Math.max(0.6, cols / 70);
    ctx.fillText('jsc', cols / 2, (rows * 0.7) / (cw / ch));
    ctx.strokeText('jsc', cols / 2, (rows * 0.7) / (cw / ch));
    const data = ctx.getImageData(0, 0, cols, rows).data;
    inside = Array.from({ length: cols * rows }, (_, i) => data[i * 4 + 3] > 110);
    renderCells();
  };

  const renderCells = () => {
    pre.textContent = '';
    cells = [];
    const frag = document.createDocumentFragment();
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const i = r * cols + col;
        const s = document.createElement('span');
        s.textContent = Math.random() < 0.5 ? '0' : '1';
        if (inside[i]) s.className = 'b-on';
        cells.push(s);
        frag.append(s);
      }
      frag.append('\n');
    }
    pre.append(frag);
  };

  build();
  new ResizeObserver(() => build()).observe(pre);
  if (reduce) return;

  // a few digits flip every tick while the art is on screen
  let onScreen = false;
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(pre);
  setInterval(() => {
    if (!onScreen || !cells.length) return;
    for (let k = 0; k < 10; k++) {
      const s = cells[(Math.random() * cells.length) | 0];
      s.textContent = s.textContent === '0' ? '1' : '0';
    }
  }, 110);

  // the torch: digits near the pointer light up, then fade back
  let lit: HTMLSpanElement[] = [];
  pre.addEventListener('pointermove', (e) => {
    const r = pre.getBoundingClientRect();
    const col = Math.floor(((e.clientX - r.left) / r.width) * cols);
    const row = Math.floor(((e.clientY - r.top) / r.height) * rows);
    for (const s of lit) s.classList.remove('b-lit');
    lit = [];
    for (let dr = -3; dr <= 3; dr++) {
      for (let dc = -5; dc <= 5; dc++) {
        if ((dc * dc) / 25 + (dr * dr) / 9 > 1) continue;
        const rr = row + dr, cc = col + dc;
        if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
        const s = cells[rr * cols + cc];
        s.classList.add('b-lit');
        lit.push(s);
      }
    }
  });
  pre.addEventListener('pointerleave', () => { for (const s of lit) s.classList.remove('b-lit'); lit = []; });
}
