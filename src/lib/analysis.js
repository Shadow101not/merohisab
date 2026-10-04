import { periodKey } from './dates';

export function filterPeriod(txns, period, system, scope = 'all') {
  return txns.filter((tx) => {
    if (period && periodKey(tx.date, system) !== period) return false;
    if (scope !== 'all' && (tx.scope || 'mine') !== scope) return false;
    return true;
  });
}

export function sumTx(txns) {
  let income = 0;
  let expense = 0;
  txns.forEach((tx) => {
    if (tx.type === 'income') income += tx.amount;
    else expense += tx.amount;
  });
  const left = income - expense;
  const rate = income > 0 ? (left / income) * 100 : 0;
  return { income, expense, left, rate: Math.max(0, rate) };
}

export function categoryTotals(txns) {
  const map = {};
  let total = 0;
  txns.forEach((tx) => {
    if (tx.type !== 'expense') return;
    map[tx.cat] = (map[tx.cat] || 0) + tx.amount;
    total += tx.amount;
  });
  return Object.keys(map)
    .map((id) => ({ id, amount: map[id], share: total ? (map[id] / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

export function topCategories(txns, n = 3) {
  return categoryTotals(txns).slice(0, n);
}

export function groupByDay(txns) {
  const days = [];
  const index = {};
  txns.forEach((tx) => {
    if (!index[tx.date]) {
      index[tx.date] = { date: tx.date, items: [], income: 0, expense: 0 };
      days.push(index[tx.date]);
    }
    const day = index[tx.date];
    day.items.push(tx);
    if (tx.type === 'income') day.income += tx.amount;
    else day.expense += tx.amount;
  });
  days.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  days.forEach((d) =>
    d.items.sort((a, b) => (a.type === b.type ? 0 : a.type === 'income' ? -1 : 1))
  );
  return days;
}

export const REPORT_COLORS = [
  '#B3262E',
  '#D9825F',
  '#1E7B41',
  '#B4761A',
  '#4E7A9A',
  '#8A5A9B',
  '#7A8B3F',
  '#A15C7A'
];
