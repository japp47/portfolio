/**
 * A Bloom filter small enough to see: 32 bits, 3 hash functions. Adding a key sets its bits;
 * checking a key looks at the same bits. Any bit still 0 means "definitely never added".
 * All 1s means "maybe", and with other keys' bits in the way, maybe can be wrong.
 */

const BITS = 32;
const HASHES = 3;

/** FNV-1a, then a murmur3 finaliser per hash function so the positions spread evenly. */
function positions(key: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return Array.from({ length: HASHES }, (_, i) => {
    let x = (h + Math.imul(i + 1, 0x9e3779b9)) >>> 0;
    x ^= x >>> 16;
    x = Math.imul(x, 0x85ebca6b);
    x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35);
    x ^= x >>> 16;
    return (x >>> 0) % BITS;
  });
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function mountBloom(root: HTMLElement): void {
  const row = root.querySelector<HTMLElement>('.bloom__bits')!;
  const input = root.querySelector<HTMLInputElement>('input')!;
  const form = root.querySelector<HTMLFormElement>('form')!;
  const result = root.querySelector<HTMLElement>('[data-out="result"]')!;
  const list = root.querySelector<HTMLElement>('[data-out="keys"]')!;

  const added = new Set<string>(['user:1001', 'user:1002', 'user:1003', 'user:1004', 'user:1005']);
  const bits = new Array<boolean>(BITS).fill(false);
  for (const key of added) for (const p of positions(key)) bits[p] = true;

  row.innerHTML = bits.map((_, i) => `<span class="bloom__bit" data-i="${i}"><i>${i}</i></span>`).join('');
  const cells = [...row.children] as HTMLElement[];

  function paint(probe: number[] = [], fresh: number[] = []): void {
    cells.forEach((cell, i) => {
      cell.classList.toggle('is-set', bits[i]);
      cell.classList.toggle('is-probe', probe.includes(i));
      cell.classList.toggle('is-miss', probe.includes(i) && !bits[i]);
      cell.classList.toggle('is-new', fresh.includes(i));
    });
    list.innerHTML = [...added].map((k) => `<code>${escape(k)}</code>`).join(' ');
    const filled = bits.filter(Boolean).length;
    const rate = (filled / BITS) ** HASHES;
    root.querySelector<HTMLElement>('[data-out="fill"]')!.textContent =
      `${filled} of ${BITS} bits set · a random key comes back "maybe" about ${(rate * 100).toFixed(0)}% of the time`;
  }

  function check(key: string): void {
    const ps = positions(key);
    const maybe = ps.every((p) => bits[p]);
    paint(ps);
    const where = `bits ${ps.join(', ')}`;
    if (!maybe) {
      result.innerHTML = `<strong>${escape(key)}</strong> → ${where}. At least one is 0, so it was <strong>definitely never added</strong>. Return 404 without touching the cache or the database.`;
      result.dataset.tone = 'no';
    } else if (added.has(key)) {
      result.innerHTML = `<strong>${escape(key)}</strong> → ${where}. All set: <strong>maybe</strong>, and it really is there. Go on to the cache.`;
      result.dataset.tone = 'yes';
    } else {
      result.innerHTML = `<strong>${escape(key)}</strong> → ${where}. All set, but by <em>other</em> keys: a <strong>false positive</strong>. This one goes through to the database and misses. Rare, and harmless.`;
      result.dataset.tone = 'fp';
    }
  }

  function add(key: string): void {
    const ps = positions(key);
    const fresh = ps.filter((p) => !bits[p]);
    ps.forEach((p) => (bits[p] = true));
    added.add(key);
    paint(ps, fresh);
    result.innerHTML = `Added <strong>${escape(key)}</strong>: set bits ${ps.join(', ')}. Bits only ever turn on, which is why a plain Bloom filter can't forget a key.`;
    result.dataset.tone = 'yes';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const key = input.value.trim();
    if (!key) return;
    const action = (e.submitter as HTMLButtonElement | null)?.value ?? 'check';
    if (action === 'add') add(key);
    else check(key);
  });

  root.querySelectorAll<HTMLButtonElement>('[data-try]').forEach((chip) =>
    chip.addEventListener('click', () => {
      input.value = chip.dataset.try!;
      check(input.value);
    }),
  );

  paint();
}
