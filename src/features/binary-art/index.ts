import { prefersReducedMotion } from '../../lib/media';

/**
 * "jsc" drawn in 0s and 1s for the About section.
 * The letters are sampled from a tiny canvas, one pixel per character cell, so the art always
 * fits its box. Digits inside the letters are bright; the rest are faint and a few flip now
 * and then. Digits under the pointer light up like a torch.
 */

const TEXT = 'jsc';
const ASPECT = 1.7; // the art is about this many times wider than tall
const FLIPS_PER_TICK = 10;
const FLIP_INTERVAL_MS = 110;
const TORCH = { cols: 5, rows: 3 };

export function mountBinaryArt(pre: HTMLElement): void {
  let cells: HTMLSpanElement[] = [];
  let cols = 0;
  let rows = 0;

  const build = () => {
    const { charWidth, lineHeight } = measureCell(pre);
    const width = pre.clientWidth;
    if (!width || !charWidth) return;

    const nextCols = Math.floor(width / charWidth);
    if (nextCols === cols) return; // only a new width needs new art
    cols = nextCols;
    rows = Math.round((cols * charWidth) / (lineHeight * ASPECT));

    const inside = sampleLetters(cols, rows, charWidth / lineHeight);
    cells = renderCells(pre, cols, rows, inside);
  };

  build();
  new ResizeObserver(build).observe(pre);
  if (prefersReducedMotion()) return;

  // a few digits flip while the art is on screen
  let onScreen = false;
  new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting)).observe(pre);
  setInterval(() => {
    if (!onScreen || !cells.length) return;
    for (let k = 0; k < FLIPS_PER_TICK; k++) {
      const cell = cells[Math.floor(Math.random() * cells.length)];
      cell.textContent = cell.textContent === '0' ? '1' : '0';
    }
  }, FLIP_INTERVAL_MS);

  // the torch: an ellipse of digits around the pointer lights up
  let lit: HTMLSpanElement[] = [];
  const clearTorch = () => {
    for (const cell of lit) cell.classList.remove('b-lit');
    lit = [];
  };

  pre.addEventListener('pointermove', (e) => {
    const rect = pre.getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * cols);
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * rows);
    clearTorch();
    for (let dr = -TORCH.rows; dr <= TORCH.rows; dr++) {
      for (let dc = -TORCH.cols; dc <= TORCH.cols; dc++) {
        if ((dc * dc) / TORCH.cols ** 2 + (dr * dr) / TORCH.rows ** 2 > 1) continue;
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || c < 0 || r >= rows || c >= cols) continue;
        const cell = cells[r * cols + c];
        cell.classList.add('b-lit');
        lit.push(cell);
      }
    }
  });
  pre.addEventListener('pointerleave', clearTorch);
}

/** The width of one character (with letter spacing) and the line height, in pixels. */
function measureCell(pre: HTMLElement): { charWidth: number; lineHeight: number } {
  const style = getComputedStyle(pre);
  const probe = document.createElement('span');
  probe.textContent = '0';
  probe.style.position = 'absolute';
  pre.append(probe);
  const box = probe.getBoundingClientRect();
  probe.remove();
  return {
    charWidth: box.width + parseFloat(style.letterSpacing || '0'),
    lineHeight: parseFloat(style.lineHeight) || box.height,
  };
}

/** Draws the letters on a cols × rows canvas and returns which cells they cover. */
function sampleLetters(cols: number, rows: number, cellRatio: number): boolean[] {
  const canvas = document.createElement('canvas');
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d')!;
  const font = (size: number) => `700 ${size}px Geist, system-ui, sans-serif`;

  // size the text to 80% of the width, then squash it so the cells' shape doesn't stretch it
  let size = rows * 1.6;
  ctx.font = font(size);
  size *= (cols * 0.8) / ctx.measureText(TEXT).width;
  ctx.setTransform(1, 0, 0, cellRatio, 0, 0);
  ctx.font = font(size);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.max(0.6, cols / 70);

  const baseline = (rows * 0.7) / cellRatio;
  ctx.fillText(TEXT, cols / 2, baseline);
  ctx.strokeText(TEXT, cols / 2, baseline);

  const alpha = ctx.getImageData(0, 0, cols, rows).data;
  return Array.from({ length: cols * rows }, (_, i) => alpha[i * 4 + 3] > 110);
}

/** Fills the <pre> with one span per digit and returns them in reading order. */
function renderCells(pre: HTMLElement, cols: number, rows: number, inside: boolean[]): HTMLSpanElement[] {
  const cells: HTMLSpanElement[] = [];
  const fragment = document.createDocumentFragment();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('span');
      cell.textContent = Math.random() < 0.5 ? '0' : '1';
      if (inside[r * cols + c]) cell.className = 'b-on';
      cells.push(cell);
      fragment.append(cell);
    }
    fragment.append('\n');
  }

  pre.replaceChildren(fragment);
  return cells;
}
