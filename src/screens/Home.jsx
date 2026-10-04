import React, { useState } from 'react';
import { useApp } from '../store';
import { Section, Money, ProgressBar, EmptyState } from '../components/ui';
import MonthPicker from '../components/MonthPicker';
import FeedbackCard from '../components/FeedbackCard';
import { filterPeriod, sumTx, categoryTotals, REPORT_COLORS } from '../lib/analysis';
import { fmtDate, todayISO, relativeDayLabel } from '../lib/dates';
import { fill as fillText } from '../i18n';
import { formatRs, formatPercent } from '../lib/currency';

export default function Home({ period, setPeriod, onAdd, onOpenTxn, goRecords }) {
  const { state, t, lang, deva, familyMode } = useApp();
  const [scope, setScope] = useState('all');

  const txns = filterPeriod(
    state.txns,
    period,
    state.system,
    familyMode && scope !== 'all' ? scope : 'all'
  );
  const { income, expense, left, rate } = sumTx(txns);
  const breakdown = categoryTotals(txns);
  const recent = txns.slice(0, 5);
  const catOf = (id) => state.cats.find((c) => c.id === id);
  const hasAny = state.txns.length > 0;

  const line =
    txns.length === 0
      ? t('homeHint')
      : left > 0
        ? fillText(t('lineMore'), { amt: formatRs(left, { deva }) })
        : left < 0
          ? t('lineLess')
          : t('lineEqual');

  return (
    <div className="px-4 pt-4 pb-36">
      <header className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[20px] font-bold leading-tight">{t('appName')}</p>
          <p className="text-[11px] text-ink/50">{t('tagline')}</p>
        </div>
        <span className="text-[12px] font-semibold text-ink/55 bg-white border border-line rounded-full px-3 py-1.5">
          {fmtDate(todayISO(), {
            system: state.system,
            lang,
            numerals: state.numerals,
            style: 'short'
          })}
        </span>
      </header>

      <FeedbackCard />

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

      <section className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label-sm">
              {lang === 'ne' ? `${t('left')} / ${t.en('left')}` : t('left')}
            </p>
            <p
              className={`text-[34px] font-bold leading-tight tnum ${
                left < 0 ? 'text-danger' : 'text-money'
              }`}
            >
              {formatRs(left, { deva, sign: left > 0 })}
            </p>
          </div>
          <div className="text-right">
            <p className="label-sm">{t('savingsRate')}</p>
            <p className="text-[22px] font-bold tnum">{formatPercent(rate, { deva })}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-line">
          <div>
            <p className="text-[12px] font-semibold text-money">
              ▲ {lang === 'ne' ? `${t('income')} / ${t.en('income')}` : t('income')}
            </p>
            <p className="text-[18px] font-bold mt-0.5">
              <Money value={income} />
            </p>
            <button
              type="button"
              onClick={() => onAdd('income')}
              className="mt-1 text-[12px] font-bold text-brand min-h-[32px] pr-1"
            >
              + {t('addIncome')}
            </button>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-semibold text-danger">
              ▼ {lang === 'ne' ? `${t('expense')} / ${t.en('expense')}` : t('expense')}
            </p>
            <p className="text-[18px] font-bold mt-0.5">
              <Money value={expense} />
            </p>
          </div>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-ink/70 bg-paper rounded-xl px-3 py-2">
          {line}
        </p>
      </section>

      {txns.length > 0 ? (
        <>
          <section className="mt-5">
            <Section
              title={t('breakdown')}
              sub={t.en('breakdown')}
              action={
                <button
                  type="button"
                  className="text-[12px] font-semibold text-brand min-h-[44px]"
                  onClick={goRecords}
                >
                  {t('seeAll')} →
                </button>
              }
            />
            <div className="card px-4 py-2">
              {breakdown.slice(0, 7).map((row, i) => {
                const c = catOf(row.id);
                return (
                  <div key={row.id} className="py-2.5 border-b border-line/60 last:border-0">
                    <div className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="font-semibold truncate">
                        <span className="mr-1.5">{c ? c.emoji : '⭕'}</span>
                        {c ? (lang === 'ne' ? c.ne : c.en) : row.id}
                      </span>
                      <span className="text-ink/60 tnum shrink-0">
                        <Money value={row.amount} /> ·{' '}
                        {formatPercent(row.share, { deva })}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar
                        pct={row.share}
                        color={REPORT_COLORS[i % REPORT_COLORS.length]}
                        height={8}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-5">
            <Section title={t('recent')} sub={t.en('recent')} />
            <div className="card overflow-hidden">
              {recent.map((tx) => {
                const c = catOf(tx.cat);
                const rel = relativeDayLabel(tx.date, lang);
                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => onOpenTxn(tx)}
                    className="w-full flex items-center gap-3 px-4 min-h-[60px] text-left border-b border-line/60 last:border-0 active:bg-paper"
                  >
                    <span className="w-9 h-9 rounded-full bg-paper grid place-items-center text-[17px]">
                      {c ? c.emoji : '⭕'}
                    </span>
                    <span className="grow min-w-0">
                      <span className="block text-[14px] font-semibold truncate">
                        {c ? (lang === 'ne' ? c.ne : c.en) : tx.cat}
                        {tx.note ? <span className="text-ink/45 font-normal"> · {tx.note}</span> : null}
                      </span>
                      <span className="block text-[11px] text-ink/50">
                        {rel ||
                          fmtDate(tx.date, {
                            system: state.system,
                            lang,
                            numerals: state.numerals,
                            style: 'short'
                          })}
                        {' · '}
                        {tx.pay}
                      </span>
                    </span>
                    <span
                      className={`text-[15px] font-bold tnum shrink-0 ${
                        tx.type === 'income' ? 'text-money' : 'text-ink'
                      }`}
                    >
                      <Money value={tx.amount} sign={tx.type === 'income'} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <div className="mt-5">
          <EmptyState
            emoji={hasAny ? '📅' : '📔'}
            title={hasAny ? t('emptySearch') : t('emptyExpenses')}
            body={hasAny ? t('emptySearchBody') : t('emptyExpensesBody')}
            action={
              <button type="button" className="btn-primary" onClick={() => onAdd('expense')}>
                + {t('addExpense')}
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}
