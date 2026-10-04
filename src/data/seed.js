import { fromBS, periodKey, shiftPeriod, toBS, todayISO } from '../lib/dates';
import { uid } from '../lib/ids';

// r = relative position inside the month (0..1), so demo data always fits "one month".
const EXPENSES = [
  { r: 0.03, cat: 'rent', amt: 12000, pay: 'Bank', note: 'मासिक भाडा' },
  { r: 0.05, cat: 'groceries', amt: 4200, pay: 'Cash', note: 'महिनाको किराना' },
  { r: 0.06, cat: 'mobile', amt: 999, pay: 'eSewa', note: 'नेपाल टेलिकम' },
  { r: 0.1, cat: 'electricity', amt: 1850, pay: 'eSewa', note: 'बिजुली बिल' },
  { r: 0.14, cat: 'food', amt: 750, pay: 'Cash', note: '' },
  { r: 0.18, cat: 'transport', amt: 600, pay: 'Cash', note: 'बस भाडा' },
  { r: 0.22, cat: 'tea', amt: 250, pay: 'Cash', note: 'चिया र सेल रोटी' },
  { r: 0.27, cat: 'gas', amt: 1200, pay: 'eSewa', note: 'ग्यास सिलिन्डर' },
  { r: 0.3, cat: 'food', amt: 820, pay: 'Cash', note: '' },
  { r: 0.35, cat: 'eatingout', amt: 1450, pay: 'Khalti', note: 'परिवारसँग खाजा' },
  { r: 0.39, cat: 'health', amt: 650, pay: 'Cash', note: 'औषधि' },
  { r: 0.43, cat: 'groceries', amt: 3100, pay: 'Cash', note: 'तरकारी र दाल' },
  { r: 0.47, cat: 'transport', amt: 550, pay: 'eSewa', note: '' },
  { r: 0.52, cat: 'entertainment', amt: 900, pay: 'Khalti', note: 'सिनेमा' },
  { r: 0.56, cat: 'personalcare', amt: 780, pay: 'Card', note: 'साबुन, श्याम्पू' },
  { r: 0.6, cat: 'clothing', amt: 2200, pay: 'Card', note: 'कपडा' },
  { r: 0.63, cat: 'religious', amt: 500, pay: 'Cash', note: 'मन्दिर' },
  { r: 0.67, cat: 'tea', amt: 300, pay: 'Cash', note: '' },
  { r: 0.7, cat: 'food', amt: 900, pay: 'Cash', note: '' },
  { r: 0.74, cat: 'gifts', amt: 1100, pay: 'Cash', note: 'बिहेको उपहार' },
  { r: 0.78, cat: 'water', amt: 350, pay: 'eSewa', note: 'पानी बिल' },
  { r: 0.82, cat: 'household', amt: 1650, pay: 'Cash', note: 'घरका सामान' },
  { r: 0.86, cat: 'food', amt: 700, pay: 'Cash', note: '' },
  { r: 0.9, cat: 'transport', amt: 450, pay: 'Cash', note: '' },
  { r: 0.94, cat: 'education', amt: 2500, pay: 'eSewa', note: 'किताब र कपन' },
  { r: 0.97, cat: 'tea', amt: 200, pay: 'Cash', note: '' },
  { r: 0.99, cat: 'udhaaro', amt: 700, pay: 'Cash', note: 'साथीलाई दिएको' }
];

const INCOMES = [
  { r: 0.02, cat: 'salary', amt: 55000, pay: 'Bank', note: 'मासिक तलब', regular: 'regular' },
  { r: 0.62, cat: 'freelance', amt: 12000, pay: 'eSewa', note: 'सानो प्रोजेक्ट', regular: 'occasional' }
];

const DEMO_BUDGET = {
  total: 50000,
  cats: {
    food: 3800,
    groceries: 8000,
    eatingout: 1200,
    transport: 2400,
    electricity: 2500,
    entertainment: 1500,
    tea: 1500
  }
};

const LAST_BUDGET = {
  total: 48000,
  cats: {
    food: 3600,
    groceries: 7500,
    eatingout: 1500,
    transport: 2400,
    electricity: 2200,
    entertainment: 1200,
    tea: 1400
  }
};

const DEMO_GOALS = [
  { emoji: '🛟', ne: 'आपतकालीन कोष', en: 'Emergency fund', target: 100000, parts: [12000, 12000, 8000] },
  { emoji: '🛍️', ne: 'डसैनको खर्च', en: 'Dashain shopping', target: 25000, parts: [5000, 4000] },
  { emoji: '📱', ne: 'नयाँ फोन', en: 'New phone', target: 60000, parts: [8500, 10000] }
];

/** One lively month of sample records, plus budgets and goals. */
export function buildDemo(today = todayISO()) {
  const { d: dayOfMonth } = toBS(today);
  const period = periodKey(today, 'bs');
  const [, pRange] = period.split(':');
  const [pYear, pMonth] = pRange.split('-').map(Number); // BS year, 1-based month
  const dayFor = (r) => {
    const day = Math.max(1, Math.min(dayOfMonth, Math.ceil(r * dayOfMonth)));
    return fromBS(pYear, pMonth - 1, day);
  };

  const txns = [];
  EXPENSES.forEach((e, i) => {
    txns.push({
      id: uid('t'),
      type: 'expense',
      amount: e.amt,
      cat: e.cat,
      pay: e.pay,
      date: dayFor(e.r),
      note: e.note,
      scope: i % 3 === 0 ? 'family' : 'mine'
    });
  });
  INCOMES.forEach((inc, i) => {
    txns.push({
      id: uid('t'),
      type: 'income',
      amount: inc.amt,
      cat: inc.cat,
      pay: inc.pay,
      date: dayFor(inc.r),
      note: inc.note,
      src: inc.cat,
      regular: inc.regular,
      scope: i === 0 ? 'family' : 'mine'
    });
  });
  txns.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const budgets = {
    [period]: JSON.parse(JSON.stringify(DEMO_BUDGET)),
    [shiftPeriod(period, -1)]: JSON.parse(JSON.stringify(LAST_BUDGET))
  };

  const goals = DEMO_GOALS.map((g) => ({
    id: uid('g'),
    emoji: g.emoji,
    ne: g.ne,
    en: g.en,
    target: g.target,
    date: '',
    parts: g.parts.map((amt, i) => ({
      id: uid('c'),
      amount: amt,
      date: dayFor(0.2 + i * 0.3)
    }))
  }));

  return { txns, budgets, goals };
}
