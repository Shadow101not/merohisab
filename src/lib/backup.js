import { todayISO } from './dates';

function download(filename, text, mime) {
  try {
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (e) {
    return false;
  }
}

const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function transactionsToCSV(state, t) {
  const catName = (id) => {
    const c = (state.cats || []).find((x) => x.id === id);
    return c ? c.en || c.ne : id;
  };
  const head = [
    t('colDate'),
    t('colType'),
    t('colCategory'),
    t('colAmount'),
    t('colPayment'),
    t('colSource'),
    t('colNote'),
    t('colScope')
  ];
  const rows = (state.txns || []).map((tx) =>
    [
      tx.date,
      tx.type === 'income' ? t('colIncome') : t('colExpense'),
      catName(tx.cat),
      tx.amount,
      tx.pay || '',
      tx.src || '',
      tx.note || '',
      tx.scope || ''
    ]
      .map(csvCell)
      .join(',')
  );
  return [head.map(csvCell).join(','), ...rows].join('\n');
}

export function exportCSV(state, t) {
  return download(`merohisab-${todayISO()}.csv`, transactionsToCSV(state, t), 'text/csv');
}

export function exportJSON(state) {
  const payload = { app: 'merohisab', version: 1, exportedAt: new Date().toISOString(), state };
  return download(
    `merohisab-backup-${todayISO()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json'
  );
}

/** Returns { ok, state, reason } — never throws on malformed files. */
export function parseImport(text) {
  try {
    const parsed = JSON.parse(text);
    const state = parsed && parsed.state ? parsed.state : parsed;
    if (!state || typeof state !== 'object') return { ok: false, reason: 'shape' };
    if (!Array.isArray(state.txns)) return { ok: false, reason: 'shape' };
    return { ok: true, state };
  } catch (e) {
    return { ok: false, reason: 'json' };
  }
}

export function readFileAsText(file) {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    } catch (e) {
      resolve('');
    }
  });
}
