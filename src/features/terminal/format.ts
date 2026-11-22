/** Small HTML builders for terminal output. Anything typed by the visitor goes through escapeHtml. */

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

export const escapeHtml = (text: string): string => text.replace(/[&<>"]/g, (c) => ENTITIES[c]);

/** A command in the output that runs when clicked (handy on a phone). */
export const cmd = (command: string, label = command): string =>
  `<button type="button" class="t-cmd" data-cmd="${escapeHtml(command)}">${escapeHtml(label)}</button>`;

export const link = (label: string, href: string): string =>
  `<a class="t-link" href="${href}" target="_blank" rel="noopener">${escapeHtml(label)} ↗</a>`;

export const dim = (html: string): string => `<span class="t-dim">${html}</span>`;

export const bright = (html: string): string => `<span class="t-hi">${html}</span>`;
