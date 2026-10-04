import React, { useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useApp } from '../store';
import { Section, Money, EmptyState, Segmented } from '../components/ui';
import MonthPicker from '../components/MonthPicker';
import { filterPeriod, sumTx, groupByDay, topCategories } from '../lib/analysis';
import { fmtDate, relativeDayLabel } from '../lib/dates';
import { formatRs } from '../lib/currency';

const PAYMENTS = ['Cash', 'Bank', 'eSewa', 'Khalti', 'Card', 'Other'];
const PAY_KEY = {
  Cash: 'payCash',
  Bank: 'payBank',
  eSewa: 'payEsewa',
  Khalti: 'payKhalti',
  Card: 'payCard',
  Other: 'payOther'
};

function TxnRow({ txn, catOf, onEdit, onDelete }) {
  const { t, lang } = useApp();
  const [dx, setDx] = useState(0);
  const gesture = useRef(null);
  const moved = useRef(false);

  const onStart = (e) => {
    gesture.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, axis: null };
    moved.current = false;
  };
  const onMove = (e) => {
    if (!gesture.current) return;
    const rawX = e.touches[0].clientX - gesture.current.x;
    const rawY = e.touches[0].clientY - gesture.current.y;
    if (!gesture.current.axis && (Math.abs(rawX) > 8 || Math.abs(rawY) > 8)) {
      gesture.current.axis = Math.abs(rawX) > Math.abs(rawY) ? 'x' : 'y';
    }
    if (gesture.current.axis === 'x') {
      moved.current = true;
      setDx(Math.max(-124, Math.min(0, rawX)));
    }
  };
  const onEnd = () => {
    setDx((v) => (v < -55 ? -124 : 0));
    gesture.current = null;
  };

  const c = catOf(txn.cat);
  const name = c ? (lang === 'ne' ? c.ne : c.en) : txn.cat;

  return (
    <li className="relative overflow-hidden border-b border-line/60 last:border-0">
      <div className="absolute inset-y-0 right-0 flex">
        <button
          type="button"
          className="w-[62px] bg-paper text-ink/70 text-[12px] font-semibold"
          onClick={() => onEdit(txn)}
        >
          {t('edit')}
        </button>
        <button
          type="button"
          className="w-[62px] bg-danger text-white text-[12px] font-semibold"
          onClick={() => onDelete(txn)}
        >
          {t('del')}
        </button>
      </div>

      <div
        className="relative bg-white flex items-center px-4 min-h-[60px]"
        style={{ transform: `translateX(${dx}px)` }}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
      >
        <button
          type="button"
          className="grow flex items-center gap-3 text-left min-w-0 py-2 active:opacity-70"
          onClick={() => {
            if (!moved.current) onEdit(txn);
          }}
        >
          <span className="w-9 h-9 rounded-full bg-paper grid place-items-center text-[17px] shrink-0">
            {c ? c.emoji : '⭕'}
          </span>
          <span className="grow min-w-0">
            <span className="block text-[14px] font-semibold truncate">{name}</span>
            <span className="block text-[11px] text-ink/50 truncate">
              {[txn.note, txn.pay, txn.scope === 'family' ? t('family') : '']
                .filter(Boolean)
                .join(' · ')}
            </span>
          </span>
          <span
            className={`text-[15px] font-bold tnum shrink-0 ${
              txn.type === 'income' ? 'text-money' : 'text-ink'
            }`}
          >
            <Money value={txn.amount} sign={txn.type === 'income'} />
          </span>
        </button>
      </div>
    </li>
  );
}

function ChartTooltip({ active, payload, label }) {
  const { deva } = useApp();
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-line rounded-lg px-3 py-1.5 shadow-soft text-[12px] font-semibold">
      {label}: {formatRs(payload[0].value, { deva })}
    </div>
  );
}

export default function Records({ period, setPeriod, onEdit, onAdd }) {
  const { state, actions, t, lang, deva, familyMode, notify } = useApp();
  const [tab, setTab] = useState('expense');
  const [q, setQ] = useState('');
  const [fCat, setFCat] = useState('all');
  const [fPay, setFPay] = useState('all');
  const [scope, setScope] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const catOf = (id) => state.cats.find((c) => c.id === id);

  const base = useMemo(
    () =>
      filterPeriod(
        state.txns,
        period,
        state.system,
        familyMode && scope !== 'all' ? scope : 'all'
      ),
    [state.txns, period, state.system, scope, familyMode]
  );
  const { income, expense, left } = sumTx(base);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return base.filter((tx) => {
      if (tx.type !== tab) return false;
      if (fCat !== 'all' && tx.cat !== fCat) return false;
      if (fPay !== 'all' && tx.pay !== fPay) return false;
      if (needle) {
        const c = catOf(tx.cat);
        const hay = [c ? c.ne : '', c ? c.en : '', tx.note || '', String(tx.amount)]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [base, tab, fCat, fPay, q, state.cats]);

  const days = groupByDay(list);
  const top3 = topCategories(base, 3);
  const usedCats = new Set(base.filter((x) => x.type === tab).map((x) => x.cat));
  const catOptions = state.cats.filter((c) => c.kind === tab && usedCats.has(c.id));

  const chartData = [
    { name: t('income'), value: income, color: '#1E7B41' },
    { name: t('expense'), value: expense, color: '#B3262E' }
  ];

  const handleDelete = (txn) => {
    const removed = actions.removeTxn(txn.id);
    if (!removed) return;
    notify(t('deletedToast'), {
      actionLabel: t('undo'),
      onAction: () => actions.restoreTxn(removed)
    });
  };

  return (
    <div className="px-4 pt-4 pb-36">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[20px] font-bold">
          {t('navRecords')}
          {lang === 'ne' ? <span className="ml-2 text-[12px] font-medium text-ink/45">{t.en('navRecords')}</span> : null}
        </h1>
        <div className="flex items-center gap-2">
          {tab === 'income' ? (
            <button
              type="button"
              className="btn-primary min-h-[38px] px-3 text-[13px] whitespace-nowrap"
              onClick={() => onAdd('income')}
            >
              + {t('addIncome')}
            </button>
          ) : null}
          <button
            type="button"
            className="btn-quiet min-h-[38px] px-3 text-[13px]"
            onClick={() => setShowFilters((v) => !v)}
          >
            ⚙ {t('filterCategory')}
          </button>
        </div>
      </div>

      <MonthPicker period={period} onChange={setPeriod} />

      {familyMode ? (
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
          {[
            { v: 'all', l: t('all') },
            { v: 'mine', l: t('mine') },
            { v: 'family', l: t('family') }
          ].map((opt) => (
            <button
              key={opt.v}
              type="button"
              className="chip"
              data-on={scope === opt.v}
              onClick={() => setScope(opt.v)}
            >
              {opt.l}
            </button>
          ))}
        </div>
      ) : null}

      {/* Monthly report card */}
      <section className="card p-4 mb-4">
        <Section title={t('report')} sub={t.en('report')} className="mb-1" />
        <div className="h-[170px] w-full mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#2A2320' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={[0, 'dataMax']} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="value" radius={[10, 10, 4, 4]} barSize={54}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between text-[13px] mt-1 pt-3 border-t border-line">
          <span className="text-ink/60">
            {t('left')}: <Money value={left} className="font-bold text-ink" />
          </span>
          <span className="text-ink/45 text-[12px]">
            {t('income')} / {t('expense')}
          </span>
        </div>

        <div className="mt-3">
          <p className="label-sm mb-2">{t('topCategories')}</p>
          {top3.length ? (
            <ol className="space-y-1.5">
              {top3.map((row, i) => {
                const c = catOf(row.id);
                return (
                  <li key={row.id} className="flex items-center gap-2 text-[13px]">
                    <span className="w-5 text-ink/40 tnum font-bold">{i + 1}.</span>
                    <span>
                      {c ? c.emoji : ''} {c ? (lang === 'ne' ? c.ne : c.en) : row.id}
                    </span>
                    <span className="grow border-b border-dotted border-line" />
                    <span className="font-semibold tnum">
                      <Money value={row.amount} />
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-[13px] text-ink/50">{t('emptyExpenses')}</p>
          )}
        </div>
      </section>

      <Segmented
        value={tab}
        onChange={(v) => setTab(v)}
        ariaLabel={t('tabExpenses')}
        options={[
          { value: 'expense', label: `${t('tabExpenses')} · ${expenseCount(base, 'expense')}` },
          { value: 'income', label: `${t('tabIncome')} · ${expenseCount(base, 'income')}` }
        ]}
      />

      <div className="flex gap-2 mt-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="field grow"
          aria-label={t('search')}
        />
      </div>

      {showFilters ? (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <select
            value={fCat}
            onChange={(e) => setFCat(e.target.value)}
            className="field"
            aria-label={t('filterCategory')}
          >
            <option value="all">{t('filterCategory')}: {t('all')}</option>
            {catOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {lang === 'ne' ? c.ne : c.en}
              </option>
            ))}
          </select>
          <select
            value={fPay}
            onChange={(e) => setFPay(e.target.value)}
            className="field"
            aria-label={t('filterPayment')}
          >
            <option value="all">{t('filterPayment')}: {t('all')}</option>
            {PAYMENTS.map((p) => (
              <option key={p} value={p}>
                {t(PAY_KEY[p])}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <p className="text-[11px] text-ink/45 mt-2">{t('swipeHint')}</p>

      {days.length ? (
        <div className="mt-3 space-y-4">
          {days.map((day) => (
            <section key={day.date}>
              <div className="flex items-baseline justify-between px-1 mb-1.5">
                <p className="text-[13px] font-bold">
                  {relativeDayLabel(day.date, lang) ||
                    fmtDate(day.date, {
                      system: state.system,
                      lang,
                      numerals: state.numerals,
                      style: 'full'
                    })}
                </p>
                <p className="text-[12px] text-ink/55 tnum">
                  {t('dayTotal')}:{' '}
                  <Money
                    value={day.income - day.expense}
                    sign
                    className={day.income - day.expense >= 0 ? 'text-money' : 'text-danger'}
                  />
                </p>
              </div>
              <ul className="card overflow-hidden">
                {day.items.map((tx) => (
                  <TxnRow
                    key={tx.id}
                    txn={tx}
                    catOf={catOf}
                    onEdit={onEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            emoji={q || fCat !== 'all' || fPay !== 'all' ? '🔍' : tab === 'expense' ? '🧾' : '💵'}
            title={
              q || fCat !== 'all' || fPay !== 'all'
                ? t('emptySearch')
                : tab === 'expense'
                  ? t('emptyExpenses')
                  : t('emptyIncome')
            }
            body={
              q || fCat !== 'all' || fPay !== 'all'
                ? t('emptySearchBody')
                : tab === 'expense'
                  ? t('emptyExpensesBody')
                  : t('emptyIncomeBody')
            }
            action={
              <button
                type="button"
                className="btn-primary"
                onClick={() => onAdd(tab === 'expense' ? 'expense' : 'income')}
              >
                + {tab === 'expense' ? t('addExpense') : t('addIncome')}
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}

function expenseCount(list, type) {
  return list.filter((x) => x.type === type).length;
}
