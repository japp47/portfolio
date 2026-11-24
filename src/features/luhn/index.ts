/**
 * Luhn, digit by digit: every second digit from the right is doubled (and 9 taken off if that
 * gives two digits), the results are summed, and the number is valid if the sum ends in 0.
 * The typo buttons damage the current number the way people do, and show whether Luhn notices.
 */

export interface Digit {
  value: number;
  doubled: boolean;
  counts: number; // what this digit adds to the sum
}

export function luhnDigits(number: string): Digit[] {
  return [...number].map((c, i) => {
    const value = Number(c);
    const doubled = (number.length - 1 - i) % 2 === 1;
    const twice = value * 2;
    return { value, doubled, counts: doubled ? (twice > 9 ? twice - 9 : twice) : value };
  });
}

const sumOf = (number: string) => luhnDigits(number).reduce((s, d) => s + d.counts, 0);
export const isValid = (number: string) => number.length > 1 && sumOf(number) % 10 === 0;

/** The digit that makes `body` + digit pass. */
const checkDigit = (body: string) => (10 - (sumOf(body + '0') % 10)) % 10;

type Typo = 'change' | 'swap' | 'jump' | 'zero-nine';

const pick = <T>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

function damage(number: string, typo: Typo): { result: string; at: number[] } | null {
  const s = [...number];
  if (typo === 'change') {
    const i = pick(range(s.length));
    s[i] = String(pick(range(10).filter((d) => d !== Number(s[i]))));
    return { result: s.join(''), at: [i] };
  }
  if (typo === 'swap' || typo === 'zero-nine') {
    const spots = range(s.length - 1).filter((i) =>
      typo === 'swap'
        ? s[i] !== s[i + 1]
        : (s[i] === '0' && s[i + 1] === '9') || (s[i] === '9' && s[i + 1] === '0'),
    );
    if (!spots.length) return null;
    const i = pick(spots);
    [s[i], s[i + 1]] = [s[i + 1], s[i]];
    return { result: s.join(''), at: [i, i + 1] };
  }
  const spots = range(s.length - 2).filter((i) => s[i] !== s[i + 2]);
  if (!spots.length) return null;
  const i = pick(spots);
  [s[i], s[i + 2]] = [s[i + 2], s[i]];
  return { result: s.join(''), at: [i, i + 2] };
}

const WHY: Record<Typo, { caught: string; missed: string }> = {
  change: {
    caught:
      'One digit changed, so the sum moved by somewhere between 1 and 9. That can never be a multiple of 10, so Luhn always catches this.',
    missed: '',
  },
  swap: {
    caught:
      'The two digits traded weights (×1 and ×2), which changed the sum. Luhn catches every neighbour swap except one.',
    missed: '',
  },
  'zero-nine': {
    caught: '',
    missed:
      'The one neighbour swap Luhn misses. 0 doubled is 0 and 9 doubled is 18 → 9, so the pair adds 9 whichever way round it is.',
  },
  jump: {
    caught: '',
    missed:
      'Digits two apart always get the same weight, so swapping them can never change the sum. Luhn misses every one of these.',
  },
};

const group = (n: string) => n.replace(/(.{4})/g, '$1 ').trim();

export function mountLuhn(root: HTMLElement): void {
  const input = root.querySelector<HTMLInputElement>('input')!;
  const row = root.querySelector<HTMLElement>('.luhn__digits')!;
  const sumOut = root.querySelector<HTMLElement>('[data-out="sum"]')!;
  const verdict = root.querySelector<HTMLElement>('[data-out="verdict"]')!;
  let original = input.value.replace(/\D/g, '');

  function render(number: string, changed: number[] = []): void {
    const digits = luhnDigits(number);
    row.innerHTML = digits
      .map(
        (
          d,
          i,
        ) => `<span class="luhn__d${d.doubled ? ' is-doubled' : ''}${changed.includes(i) ? ' is-changed' : ''}${
          i && (number.length - i) % 4 === 0 ? ' is-gap' : ''
        }">
          <b>${d.value}</b>
          <i>${d.doubled ? '×2' : '×1'}</i>
          <em>${d.counts}</em>
        </span>`,
      )
      .join('');
    const sum = digits.reduce((s, d) => s + d.counts, 0);
    const ok = number.length > 1 && sum % 10 === 0;
    sumOut.innerHTML = number.length
      ? `sum ${sum} → ends in ${sum % 10} → <strong class="${ok ? 'is-ok' : 'is-bad'}">${ok ? 'passes' : 'fails'}</strong>`
      : 'type a number';
    root.classList.toggle('is-valid', ok);
  }

  function setNumber(number: string): void {
    original = number;
    input.value = group(number);
    verdict.textContent = '';
    verdict.removeAttribute('data-tone');
    render(number);
  }

  input.addEventListener('input', () => {
    const digits = input.value.replace(/\D/g, '').slice(0, 19);
    original = digits;
    verdict.textContent = '';
    verdict.removeAttribute('data-tone');
    render(digits);
  });

  root
    .querySelectorAll<HTMLButtonElement>('[data-number]')
    .forEach((b) => b.addEventListener('click', () => setNumber(b.dataset.number!)));

  root.querySelectorAll<HTMLButtonElement>('[data-typo]').forEach((b) =>
    b.addEventListener('click', () => {
      const typo = b.dataset.typo as Typo;
      let start = isValid(original) ? original : '4111111111111111';
      if (typo === 'zero-nine' && !/09|90/.test(start)) {
        // put a 0 and a 9 next to each other, then fix the check digit so it still passes
        const body = start.slice(0, -1).replace(/^(\d)\d\d/, '$109');
        start = body + checkDigit(body);
      }
      const hit = damage(start, typo);
      if (!hit) return;
      input.value = group(hit.result);
      render(hit.result, hit.at);
      const caught = !isValid(hit.result);
      verdict.dataset.tone = caught ? 'caught' : 'missed';
      verdict.innerHTML = `${group(start)} → ${group(hit.result)}. <strong>${caught ? 'Caught' : 'Slipped through'}.</strong> ${
        caught ? WHY[typo].caught : WHY[typo].missed
      }`;
      original = start;
    }),
  );

  root.querySelector<HTMLButtonElement>('[data-reset]')?.addEventListener('click', () => setNumber(original));

  setNumber(original);
}
