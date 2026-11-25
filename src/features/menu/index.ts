import '../../styles/menu.css';

import { LINKS } from '../../config/site';

/**
 * The phone menu: a button in the top bar opens a panel from the right with every page, the
 * case studies, the terminal and the contact links. Desktop keeps the inline nav; this whole
 * thing is hidden above 860px.
 */

const MOBILE = '(max-width: 860px)';

const PAGES = [
  { key: 'work', label: 'work', href: '/#work' },
  { key: 'writing', label: 'writing', href: '/writing/' },
  { key: 'now', label: 'now', href: '/#now' },
  { key: 'about', label: 'about', href: '/#about' },
  { key: 'contact', label: 'contact', href: '/#contact' },
];

const CASES = [
  { key: '99ile', label: '99ile', note: 'live', href: '/work/99ile/' },
  { key: 'gateway', label: 'LLM gateway', note: 'case study', href: '/work/local-llm-gateway/' },
];

const away = (href: string, label: string) =>
  `<a href="${href}" target="_blank" rel="noopener">${label}<span aria-hidden="true"> ↗</span></a>`;

const PANEL_HTML = `
  <div class="menu__scrim" data-close></div>
  <aside class="menu__panel">
    <div class="menu__top">
      <a class="mark" href="/" aria-label="Home">jsc<span>.</span></a>
      <button type="button" class="menu__close mono" data-close>close<i aria-hidden="true"></i></button>
    </div>

    <nav class="menu__nav" aria-label="Main">
      ${PAGES.map(
        (p, i) =>
          `<a href="${p.href}" data-key="${p.key}" style="--i:${i}"><span class="mono">0${i + 1}</span>${p.label}</a>`,
      ).join('')}
    </nav>

    <div class="menu__group" style="--i:5">
      <p class="mono">case studies</p>
      ${CASES.map(
        (c) => `<a href="${c.href}" data-key="${c.key}">${c.label}<span class="mono">${c.note}</span></a>`,
      ).join('')}
    </div>

    <div class="menu__actions" style="--i:6">
      <button type="button" class="menu__btn mono" data-open-terminal><b aria-hidden="true">&gt;_</b>terminal</button>
      <a class="menu__btn mono" href="${LINKS.resume}" target="_blank" rel="noopener">resume<span aria-hidden="true">↗</span></a>
    </div>

    <div class="menu__foot mono" style="--i:7">
      <div class="menu__socials">
        ${away(LINKS.github, 'github')}
        ${away(LINKS.linkedin, 'linkedin')}
        ${away(LINKS.leetcode, 'leetcode')}
      </div>
      <p><span class="live-dot" aria-hidden="true"></span>bengaluru <time data-clock>--:--</time>
        <a href="${LINKS.email}">email</a></p>
    </div>
  </aside>`;

/** Which entry to mark as "you are here". */
function currentKey(): string | null {
  const path = location.pathname;
  if (path.startsWith('/writing')) return 'writing';
  if (path.startsWith('/work/99ile')) return '99ile';
  if (path.startsWith('/work/local-llm-gateway')) return 'gateway';
  if (path !== '/' && path !== '/index.html') return null;

  // on the home page, the section most of the way up the screen
  let key: string | null = null;
  for (const id of ['work', 'now', 'about', 'contact']) {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top < innerHeight * 0.45) key = id;
  }
  return key;
}

export function mountMenu(): void {
  const bar = document.querySelector<HTMLElement>('.bar');
  if (!bar) return;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'bar__menu mono';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'site-menu');
  toggle.innerHTML = '<span>menu</span><i aria-hidden="true"></i>';
  bar.append(toggle);

  const menu = document.createElement('div');
  menu.className = 'menu';
  menu.id = 'site-menu';
  menu.hidden = true;
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-modal', 'true');
  menu.setAttribute('aria-label', 'Site menu');
  menu.innerHTML = PANEL_HTML;
  document.body.append(menu);

  const panel = menu.querySelector<HTMLElement>('.menu__panel')!;
  const root = document.documentElement;
  let closeTimer = 0;

  const isOpen = () => menu.classList.contains('is-open');

  function open(): void {
    clearTimeout(closeTimer);
    const here = currentKey();
    menu.querySelectorAll<HTMLAnchorElement>('[data-key]').forEach((a) => {
      if (a.dataset.key === here) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    menu.classList.toggle('has-current', here !== null);

    menu.hidden = false;
    root.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => menu.classList.add('is-open'));
    setTimeout(() => panel.querySelector<HTMLElement>('.menu__nav a')?.focus({ preventScroll: true }), 80);
  }

  function close(returnFocus = true): void {
    if (!isOpen()) return;
    menu.classList.remove('is-open');
    root.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    closeTimer = window.setTimeout(() => (menu.hidden = true), 600); // after the slide-out
    if (returnFocus) toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener('click', () => (isOpen() ? close() : open()));
  menu.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', () => close()));

  // any link or the terminal button: close first, then let it do its thing
  menu.addEventListener('click', (e) => {
    const target = (e.target as Element).closest('a, [data-open-terminal]');
    if (target) close(false);
  });

  addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      // keep focus inside the panel while it is open
      const items = [...panel.querySelectorAll<HTMLElement>('a, button')];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // rotating a tablet past the breakpoint should never leave the page locked
  matchMedia(MOBILE).addEventListener('change', (q) => {
    if (!q.matches) close(false);
  });
}
