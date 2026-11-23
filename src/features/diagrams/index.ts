import { prefersReducedMotion } from '../../lib/media';

/**
 * The two interactions the case-study diagrams need.
 *
 * - `mountDiagramHighlight`: pointing at a node dims everything that is not connected to it,
 *   so a reader can follow one path through an architecture or ER diagram. Nodes carry
 *   `data-node`, edges carry `data-link="a b"` naming the two nodes they join.
 * - `mountSwaps`: a before / after toggle over two stacked panels.
 */

export function mountDiagramHighlight(): void {
  document.querySelectorAll<HTMLElement>('.fig--live').forEach((fig) => {
    const nodes = [...fig.querySelectorAll<SVGGElement>('[data-node]')];
    const edges = [...fig.querySelectorAll<SVGElement>('[data-link]')];
    if (!nodes.length) return;

    const clear = () => {
      fig.classList.remove('is-picking');
      for (const el of [...nodes, ...edges]) el.classList.remove('is-on');
    };

    const pick = (name: string) => {
      const touching = edges.filter((e) => (e.dataset.link ?? '').split(' ').includes(name));
      const neighbours = new Set([name, ...touching.flatMap((e) => (e.dataset.link ?? '').split(' '))]);

      fig.classList.add('is-picking');
      for (const n of nodes) n.classList.toggle('is-on', neighbours.has(n.dataset.node ?? ''));
      for (const e of edges) e.classList.toggle('is-on', touching.includes(e));
    };

    for (const node of nodes) {
      const name = node.dataset.node ?? '';
      node.addEventListener('pointerenter', () => pick(name));
      node.addEventListener('focus', () => pick(name));
      node.addEventListener('blur', clear);
    }
    fig.addEventListener('pointerleave', clear);
  });
}

export function mountSwaps(): void {
  document.querySelectorAll<HTMLElement>('[data-swap]').forEach((swap) => {
    const buttons = [...swap.querySelectorAll<HTMLButtonElement>('button[data-show]')];
    const panels = [...swap.querySelectorAll<HTMLElement>('.swap__panel')];

    const show = (name: string) => {
      for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.show === name));
      for (const p of panels) p.hidden = p.dataset.panel !== name;
    };

    for (const b of buttons) b.addEventListener('click', () => show(b.dataset.show ?? ''));
  });
}

/**
 * Draws the reader's eye down a sequence diagram once, the first time it is seen:
 * each step fades in a beat after the one above it. Still under reduced motion.
 */
export function mountSequenceReveal(): void {
  if (prefersReducedMotion()) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const steps = [...entry.target.querySelectorAll<SVGGElement>('[data-step]')];
        steps.forEach((step, i) => {
          step.style.opacity = '0';
          step.style.transition = `opacity 0.4s var(--ease) ${i * 110}ms`;
          requestAnimationFrame(() => (step.style.opacity = '1'));
        });
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.25 },
  );

  document.querySelectorAll('[data-sequence]').forEach((el) => observer.observe(el));
}
