const DEV_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export const MAX_AMOUNT = 99999999;

export function toDevanagari(str) {
  return String(str).replace(/[0-9]/g, (d) => DEV_DIGITS[Number(d)]);
}

// Nepali/lakh grouping: last 3 digits, then groups of two (1,25,000).
export function groupLakh(value) {
  const negative = value < 0;
  const abs = Math.abs(Number(value) || 0);
  const fixed = Math.round(abs * 100) / 100;
  let [intPart, decPart] = String(fixed).split('.');
  intPart = intPart.replace(/^0+(?=\d)/, '');
  let grouped;
  if (intPart.length <= 3) {
    grouped = intPart;
  } else {
    const tail = intPart.slice(-3);
    const head = intPart.slice(0, -3);
    const pairs = [];
    let rest = head;
    while (rest.length > 2) {
      pairs.unshift(rest.slice(-2));
      rest = rest.slice(0, -2);
    }
    if (rest) pairs.unshift(rest);
    grouped = `${pairs.join(',')},${tail}`;
  }
  const dec = decPart ? `.${decPart}` : '';
  return (negative ? '-' : '') + grouped + dec;
}

/** Rs. 1,25,000 — Devanagari digits optional. */
export function formatRs(value, { deva = false, sign = false } = {}) {
  const n = Number(value) || 0;
  const body = groupLakh(Math.abs(n));
  const prefix = n < 0 ? '-' : sign && n > 0 ? '+' : '';
  const text = `Rs. ${body}`;
  return prefix + (deva ? toDevanagari(text) : text);
}

export function formatNumber(value, { deva = false } = {}) {
  const text = groupLakh(Number(value) || 0);
  return deva ? toDevanagari(text) : text;
}

export function formatPercent(value, { deva = false } = {}) {
  const text = `${Math.round(Number(value) || 0)}%`;
  return deva ? toDevanagari(text) : text;
}

/** Accepts typed text; returns { ok, value, reason }. */
export function parseAmount(raw) {
  const cleaned = String(raw ?? '')
    .replace(/[,;\s]/g, '')
    .replace(/०/g, '0')
    .replace(/१/g, '1')
    .replace(/२/g, '2')
    .replace(/३/g, '3')
    .replace(/४/g, '4')
    .replace(/५/g, '5')
    .replace(/६/g, '6')
    .replace(/७/g, '7')
    .replace(/८/g, '8')
    .replace(/९/g, '9');
  if (!cleaned) return { ok: false, value: 0, reason: 'empty' };
  if (!/^\d*\.?\d*$/.test(cleaned) || cleaned === '.' || cleaned === '') {
    return { ok: false, value: 0, reason: 'invalid' };
  }
  const decimals = cleaned.includes('.') ? cleaned.split('.')[1].length : 0;
  if (decimals > 2) return { ok: false, value: 0, reason: 'decimals' };
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return { ok: false, value: 0, reason: 'invalid' };
  if (value <= 0) return { ok: false, value: 0, reason: 'positive' };
  if (value > MAX_AMOUNT) return { ok: false, value: 0, reason: 'big' };
  return { ok: true, value: Math.round(value * 100) / 100, reason: null };
}
