import { TIME_ZONE } from '../../config/site';
import { ALIASES, type Output, completionTargets, createCommands } from './commands';
import { dodgeLinkRows } from './dodge';
import { bright, cmd, dim, escapeHtml } from './format';

/**
 * A small fake shell about me. Opens with ` or ~, the corner button, any [data-open-terminal],
 * or a link to #terminal. It never runs anything real: `open` opens a link, `rm` only jokes.
 */

const PROMPT = 'jappreet@bengaluru:~$';

/** The three macOS window buttons: a glyph that only shows when the group is hovered. */
const LIGHT_GLYPHS: Record<string, string> = {
  close: '<path d="M4 4l4 4M8 4l-4 4" />',
  min: '<path d="M3.5 6h5" />',
  max: '<path d="M6 3.5v5M3.5 6h5" />',
};

const light = (action: string, label: string) =>
  `<button type="button" class="term__light term__light--${action}" data-light="${action}" aria-label="${label}">
      <svg viewBox="0 0 12 12" aria-hidden="true">${LIGHT_GLYPHS[action]}</svg>
    </button>`;

const PANEL_HTML = `
  <div class="term__bar">
    <span class="term__dots">
      ${light('close', 'Close terminal')}
      ${light('min', 'Minimise terminal')}
      ${light('max', 'Maximise terminal')}
    </span>
    <span class="term__title">jappreet@bengaluru: ~ — zsh</span>
    <button type="button" class="term__close" aria-label="Close terminal">esc</button>
  </div>
  <div class="term__out" aria-live="polite"></div>
  <form class="term__in" autocomplete="off">
    <label class="t-prompt" for="term-input">${PROMPT}</label>
    <input id="term-input" type="text" spellcheck="false" autocapitalize="off" autocorrect="off" enterkeyhint="send">
  </form>`;

export function mountTerminal(): void {
  const panel = document.createElement('section');
  panel.className = 'term';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Terminal');
  panel.innerHTML = PANEL_HTML;
  document.body.append(panel);

  const output = panel.querySelector<HTMLElement>('.term__out')!;
  const input = panel.querySelector<HTMLInputElement>('input')!;
  const toggle = createToggleButton();

  const history: string[] = [];
  let historyIndex = 0;
  let greeted = false;
  let returnFocusTo: Element | null = null;

  const isOpen = () => panel.classList.contains('is-open');

  const commands = createCommands({
    close,
    history,
    outputWidth: () => output.clientWidth,
  });

  // --- output -----------------------------------------------------------------------------------
  function print(out: Output): void {
    const lines = Array.isArray(out) ? out : [out];
    if (lines.length === 1 && lines[0] === '') return;
    const block = document.createElement('div');
    block.className = 't-block';
    block.innerHTML = lines.map((line) => `<div class="t-line">${line || '&nbsp;'}</div>`).join('');
    output.append(block);
    output.scrollTop = output.scrollHeight;
  }

  function run(raw: string): void {
    const line = raw.trim();
    print(`<span class="t-prompt">${PROMPT}</span> ${escapeHtml(line)}`);
    if (!line) return;

    history.push(line);
    historyIndex = history.length;

    const [first, ...args] = line.split(/\s+/);
    const name = ALIASES[first.toLowerCase()] ?? first.toLowerCase();
    if (name === 'clear') {
      output.replaceChildren();
      return;
    }
    const command = commands[name];
    print(command ? command(args) : `zsh: command not found: ${escapeHtml(first)}. type ${cmd('help')}`);
  }

  function complete(): void {
    const parts = input.value.split(/\s+/);
    const word = parts[parts.length - 1];
    const pool =
      parts.length > 1
        ? completionTargets(parts[0])
        : Object.keys(commands).filter((name) => /^[a-z]/.test(name));
    const matches = pool.filter((option) => option.startsWith(word));

    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0];
      input.value = parts.join(' ') + (parts.length === 1 ? ' ' : '');
    } else if (matches.length > 1) {
      print(dim(matches.join('   ')));
    }
  }

  // --- open and close ---------------------------------------------------------------------------
  function open(): void {
    if (isOpen()) {
      panel.classList.remove('term--min'); // already open: restore it rather than do nothing
      input.focus();
      return;
    }
    returnFocusTo = document.activeElement;
    panel.hidden = false;
    panel.classList.remove('term--min'); // never reopen collapsed
    requestAnimationFrame(() => panel.classList.add('is-open'));
    document.body.classList.add('term-on');

    if (!greeted) {
      greeted = true;
      const lastLogin = new Date().toLocaleString('en-GB', {
        timeZone: TIME_ZONE,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      print([
        dim(`last login: ${lastLogin} on ttys001`),
        `hi. this is a tiny shell about ${bright('jappreet')}. type ${cmd('help')} or try ${cmd('whoami')}, ${cmd('ls')}, ${cmd('neofetch')}.`,
      ]);
    }
    setTimeout(() => input.focus({ preventScroll: true }), 60);
  }

  function close(): void {
    panel.classList.remove('is-open');
    document.body.classList.remove('term-on');
    setTimeout(() => {
      if (!isOpen()) {
        panel.hidden = true;
        panel.classList.remove('term--min', 'term--max');
      }
    }, 450); // after the slide-down transition
    if (returnFocusTo instanceof HTMLElement) returnFocusTo.focus({ preventScroll: true });
  }

  // --- events -----------------------------------------------------------------------------------
  toggle.addEventListener('click', () => (isOpen() ? close() : open()));
  dodgeLinkRows(toggle, '.hero__foot .links, .contact__row, .case__end');

  panel.querySelector('form')!.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value;
    input.value = '';
    run(value);
  });
  panel.querySelector('.term__close')!.addEventListener('click', close);

  // the macOS window buttons: close, collapse to the title bar, fill the viewport
  panel.querySelector('.term__dots')!.addEventListener('click', (e) => {
    const action = (e.target as Element).closest<HTMLElement>('[data-light]')?.dataset.light;
    if (action === 'close') close();
    else if (action === 'min') panel.classList.add('term--min');
    else if (action === 'max') {
      panel.classList.toggle('term--max');
      panel.classList.remove('term--min');
      input.focus({ preventScroll: true });
    }
  });

  // while collapsed, the title bar is the way back
  panel.querySelector('.term__bar')!.addEventListener('click', (e) => {
    if (!panel.classList.contains('term--min')) return;
    if ((e.target as Element).closest('[data-light], .term__close')) return;
    panel.classList.remove('term--min');
    input.focus({ preventScroll: true });
  });

  // clickable commands in the output, and a click anywhere else focuses the prompt
  output.addEventListener('click', (e) => {
    const button = (e.target as Element).closest<HTMLElement>('[data-cmd]');
    if (!button) return;
    run(button.dataset.cmd!);
    input.focus({ preventScroll: true });
  });
  panel.addEventListener('click', (e) => {
    const onControl = (e.target as Element).closest('a, button');
    if (!onControl && !getSelection()?.toString()) input.focus({ preventScroll: true });
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex] ?? '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = history[historyIndex] ?? '';
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      output.replaceChildren();
    }
  });

  addEventListener('keydown', (e) => {
    const typing = e.target instanceof Element && e.target.closest('input, textarea, [contenteditable]');
    if (e.key === 'Escape' && isOpen()) {
      e.preventDefault();
      close();
    } else if ((e.key === '`' || e.key === '~') && !typing && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      open();
    }
  });

  document.querySelectorAll('[data-open-terminal]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault();
      open();
    }),
  );

  // a shared link to …/#terminal opens it straight away
  if (location.hash === '#terminal') {
    setTimeout(() => {
      open();
      run('neofetch');
    }, 900);
  }
}

function createToggleButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'term-toggle';
  button.setAttribute('aria-label', 'Open terminal');
  button.innerHTML = '<span aria-hidden="true">&gt;_</span><kbd>~</kbd>';
  document.body.append(button);
  return button;
}
