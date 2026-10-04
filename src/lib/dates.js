import NepaliDate from 'nepali-date-converter';

export const BS_MONTHS_NE = [
  'बैशाख',
  'जेठ',
  'असार',
  'श्रावण',
  'भदौ',
  'असोज',
  'कार्तिक',
  'मंसिर',
  'पुष',
  'माघ',
  'फागुन',
  'चैत'
];
export const BS_MONTHS_EN = [
  'Baisakh',
  'Jestha',
  'Asar',
  'Shrawan',
  'Bhadra',
  'Aswin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra'
];
export const AD_MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];
export const AD_MONTHS_NE = [
  'जनवरी',
  'फेब्रुअरी',
  'मार्च',
  'अप्रिल',
  'मे',
  'जुन',
  'जुलाई',
  'अगस्ट',
  'सेप्टेम्बर',
  'अक्टोबर',
  'नोभेम्बर',
  'डिसेम्बर'
];
export const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_NE = [
  'आइतबार',
  'सोमबार',
  'मंगलबार',
  'बुधबार',
  'बिहीबार',
  'शुक्रबार',
  'शनिबार'
];

const pad2 = (n) => String(n).padStart(2, '0');

export function isoFromDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function dateFromISO(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function todayISO() {
  return isoFromDate(new Date());
}

/** BS fields (0-based month) for an ISO (AD) date. */
export function toBS(iso) {
  const bs = new NepaliDate(dateFromISO(iso)).getBS();
  return { y: bs.year, m: bs.month, d: bs.date, day: bs.day };
}

/** ISO date for a BS date (month 0-based). */
export function fromBS(y, m, d) {
  return isoFromDate(new NepaliDate(y, m, d).toJsDate());
}

export function weekdayIndex(iso) {
  return dateFromISO(iso).getDay();
}

/** Period = the grouping unit for Home/Records/Budget, e.g. "bs:2083-05" or "ad:2026-10". */
export function periodKey(iso, system) {
  if (system === 'bs') {
    const { y, m } = toBS(iso);
    return `bs:${y}-${pad2(m + 1)}`;
  }
  const d = dateFromISO(iso);
  return `ad:${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

export function makePeriod(system, y, m1) {
  return `${system}:${y}-${pad2(m1)}`;
}

export function parsePeriod(key) {
  const [system, rest] = String(key).split(':');
  const [y, m] = rest.split('-').map(Number);
  return { system, y, m };
}

export function shiftPeriod(key, delta) {
  const { system, y, m } = parsePeriod(key);
  const zero = m - 1 + delta;
  const ny = y + Math.floor(zero / 12);
  const nm = (((zero % 12) + 12) % 12) + 1;
  return makePeriod(system, ny, nm);
}

export function periodStartISO(key) {
  const { system, y, m } = parsePeriod(key);
  return system === 'bs' ? fromBS(y, m - 1, 1) : `${y}-${pad2(m)}-01`;
}

export function periodEndISO(key) {
  const { system, y, m } = parsePeriod(key);
  return system === 'bs' ? fromBS(y, m - 1, 31) : `${y}-${pad2(m)}-31`;
}

export function daysInPeriod(key) {
  const { system, y, m } = parsePeriod(key);
  if (system === 'bs') {
    const start = dateFromISO(fromBS(y, m - 1, 1));
    const next = m === 12 ? fromBS(y + 1, 0, 1) : fromBS(y, m, 1);
    const end = dateFromISO(next);
    return Math.round((end - start) / 86400000);
  }
  return new Date(y, m, 0).getDate();
}

export function isSamePeriod(iso, key) {
  return periodKey(iso, parsePeriod(key).system) === key;
}

export function periodTitle(key, { lang = 'ne', numerals = 'latin' } = {}) {
  const { system, y, m } = parsePeriod(key);
  const idx = m - 1;
  let name;
  if (system === 'bs') name = lang === 'ne' ? BS_MONTHS_NE[idx] : BS_MONTHS_EN[idx];
  else name = lang === 'ne' ? AD_MONTHS_NE[idx] : AD_MONTHS_EN[idx];
  const year = numerals === 'deva' ? toDevDigits(String(y)) : String(y);
  return lang === 'ne' ? `${name} ${year}` : `${name} ${year}`;
}

export function toDevDigits(text) {
  return String(text).replace(/[0-9]/g, (d) => '०१२३४५६७८९'[Number(d)]);
}

export function applyNumerals(text, numerals) {
  return numerals === 'deva' ? toDevDigits(text) : String(text);
}

/**
 * Format an ISO date for display.
 * style: 'full' (weekday + date), 'date' (date only), 'short' (day + month), 'weekday'
 */
export function fmtDate(iso, opts = {}) {
  const {
    system = 'bs',
    lang = 'ne',
    numerals = 'latin',
    style = 'date',
    showYear = true
  } = opts;
  if (!iso) return '';
  if (system === 'bs') {
    const { y, m, d, day } = toBS(iso);
    const dayNum = applyNumerals(String(d), numerals);
    const year = applyNumerals(String(y), numerals);
    const month = lang === 'ne' ? BS_MONTHS_NE[m] : BS_MONTHS_EN[m];
    const weekday = lang === 'ne' ? WEEKDAY_NE[day] : WEEKDAY_EN[day];
    if (style === 'weekday') return weekday;
    if (style === 'short') return `${dayNum} ${month}`;
    const body = showYear ? `${dayNum} ${month} ${year}` : `${dayNum} ${month}`;
    return style === 'full' ? `${weekday}, ${body}` : body;
  }
  const dt = dateFromISO(iso);
  const month = lang === 'ne' ? AD_MONTHS_NE[dt.getMonth()] : AD_MONTHS_EN[dt.getMonth()];
  const weekday = lang === 'ne' ? WEEKDAY_NE[dt.getDay()] : WEEKDAY_EN[dt.getDay()];
  const dayNum = applyNumerals(String(dt.getDate()), numerals);
  const year = applyNumerals(String(dt.getFullYear()), numerals);
  if (style === 'weekday') return weekday;
  if (style === 'short') return `${dayNum} ${month}`;
  const body = showYear ? `${dayNum} ${month} ${year}` : `${dayNum} ${month}`;
  return style === 'full' ? `${weekday}, ${body}` : body;
}

/** "आज" / "हिजो" for the current and previous day. */
export function relativeDayLabel(iso, lang = 'ne') {
  const diff = Math.round(
    (dateFromISO(todayISO()) - dateFromISO(iso)) / 86400000
  );
  if (diff === 0) return lang === 'ne' ? 'आज' : 'Today';
  if (diff === 1) return lang === 'ne' ? 'हिजो' : 'Yesterday';
  return null;
}

export function daysBetween(isoA, isoB) {
  return Math.round((dateFromISO(isoB) - dateFromISO(isoA)) / 86400000);
}
