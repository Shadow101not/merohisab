import React, { useMemo, useState } from 'react';
import { useApp } from '../store';
import { Section, Money, ProgressBar, barColor, EmptyState, Sheet, Field } from '../components/ui';
import MonthPicker from '../components/MonthPicker';
import { filterPeriod, sumTx, categoryTotals } from '../lib/analysis';
import { shiftPeriod } from '../lib/dates';
import { parseAmount, formatRs, formatPercent } from '../lib/currency';
import { fill } from '../i18n';

export default function Budget({ period, setPeriod }) {
  const { state, actions, t, lang, deva, notify } = useApp();
  const [totalSheet, setTotalSheet] = useState(false);
  const [totalInput, setTotalInput] = useState('');
  const [limitSheet, setLimitSheet] = useState(null); // {catId, amount}
  const [limitError, setLimitError] = useState('');

  const budget = state.budgets[period] || { total: 0, cats: {} };
  const prevKey = shiftPeriod(period, -1);
  const prevBudget = state.budgets[prevKey];

  const txns = useMemo(
    () => filterPeriod(state.txns, period, state.system),
    [state.txns, period, state.system]
  );
  const spentByCat = useMemo(() => {
    const map = {};
    categoryTotals(txns).forEach((row) => {
      map[row.id] = row.amount;
    });
    return map;
  }, [txns]);
  const { expense } = sumTx(txns);

  const catOf = (id) => state.cats.find((c) => c.id === id);
  const nameOf = (id) => {
    const c = catOf(id);
    return c ? (lang === 'ne' ? c.ne : c.en) : id;
  };

  const status = (spent, limit) => {
    if (!limit) return null;
    const pct = limit ? (spent / limit) * 100 : 0;
    if (spent > limit) return fill(t('overBy'), { amt: formatRs(spent - limit, { deva }) });
    if (pct >= 80) return fill(t('used'), { pct: Math.round(pct) });
    return fill(t('underLeft'), { amt: formatRs(limit - spent, { deva }) });
  };

  const pctTotal = budget.total ? (expense / budget.total) * 100 : 0;

  const saveTotal = () => {
    const parsed = parseAmount(totalInput);
    if (!parsed.ok) {
      notify(t('validationPositive'));
      return;
    }
    actions.setBudget(period, { total: parsed.value });
    setTotalSheet(false);
    notify(t('savedToast'));
  };

  const saveLimit = () => {
    const parsed = parseAmount(limitSheet.amount);
    if (!parsed.ok) {
      setLimitError(t('validationPositive'));
      return;
    }
    actions.setBudgetLimit(period, limitSheet.catId, parsed.value);
    setLimitSheet(null);
    setLimitError('');
    notify(t('limitSaved'));
  };

  const copyLast = () => {
    actions.setBudget(period, {
      total: prevBudget.total || 0,
      cats: { ...(prevBudget.cats || {}) }
    });
    notify(t('copiedToast'));
  };

  const limitIds = Object.keys(budget.cats || {});
  const addableCats = state.cats.filter(
    (c) => c.kind === 'expense' && !c.hidden && !limitIds.includes(c.id)
  );

  return (
    <div className="px-4 pt-4 pb-28">
      <h1 className="text-[20px] font-bold">
        {t('navBudget')}
        {lang === 'ne' ? (
          <span className="ml-2 text-[12px] font-medium text-ink/45">{t.en('navBudget')}</span>
        ) : null}
      </h1>

      <div className="mt-3">
        <MonthPicker period={period} onChange={setPeriod} />
      </div>

      <section className="card p-4">
        <Section
          title={t('totalBudget')}
          sub={t.en('totalBudget')}
          action={
            budget.total ? (
              <button
                type="button"
                className="text-[13px] font-semibold text-brand min-h-[44px] px-1"
                onClick={() => {
                  setTotalInput(String(budget.total));
                  setTotalSheet(true);
                }}
              >
                ✎ {t('edit')}
              </button>
            ) : null
          }
        />

        {budget.total ? (
          <>
            <div className="flex items-end justify-between gap-3">
              <p className="text-[26px] font-bold leading-none tnum whitespace-nowrap">
                <Money value={budget.total} />
              </p>
              <p className="text-[12px] text-ink/60 whitespace-nowrap">
                {t('spentLabel')}: <Money value={expense} className="font-semibold text-ink" />
              </p>
            </div>
            <div className="mt-3">
              <ProgressBar pct={pctTotal} color={barColor(pctTotal)} height={12} />
            </div>
            <p
              className="mt-2 text-[13px] font-bold"
              style={{ color: barColor(pctTotal) }}
            >
              {status(expense, budget.total)}
            </p>
          </>
        ) : (
          <div>
            <p className="text-[14px] font-semibold">{t('noBudgetTitle')}</p>
            <p className="text-[12px] text-ink/55 mt-1">{t('noBudgetBody')}</p>
            <div className="flex gap-2 mt-3">
              <input
                inputMode="decimal"
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder="45000"
                className="field grow"
                aria-label={t('totalBudget')}
              />
              <button type="button" className="btn-primary" onClick={saveTotal}>
                {t('setBudget')}
              </button>
            </div>
          </div>
        )}

        {prevBudget ? (
          <button
            type="button"
            className="mt-3 w-full min-h-[44px] rounded-xl border border-dashed border-line bg-paper text-[13px] font-semibold text-ink/70"
            onClick={copyLast}
          >
            ⧉ {t('copyLast')}
            <span className="block text-[11px] font-normal text-ink/45">{t('copyLastHint')}</span>
          </button>
        ) : null}
      </section>

      <section className="mt-5">
        <Section
          title={t('categoryLimits')}
          sub={t.en('categoryLimits')}
          action={
            <button
              type="button"
              className="btn-quiet min-h-[38px] px-3 text-[13px] whitespace-nowrap"
              onClick={() => {
                const first = addableCats[0] || state.cats.find((c) => c.kind === 'expense');
                setLimitSheet({ catId: first ? first.id : '', amount: '' });
              }}
            >
              + {t('addLimit')}
            </button>
          }
        />

        {limitIds.length ? (
          <div className="card overflow-hidden">
            {limitIds.map((id) => {
              const limit = budget.cats[id];
              const spent = spentByCat[id] || 0;
              const pct = limit ? (spent / limit) * 100 : 0;
              const c = catOf(id);
              return (
                <button
                  key={id}
                  type="button"
                  className="w-full text-left px-4 py-3 border-b border-line/60 last:border-0 active:bg-paper"
                  onClick={() => setLimitSheet({ catId: id, amount: String(limit) })}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-semibold">
                      {c ? c.emoji : ''} {nameOf(id)}
                    </span>
                    <span className="text-[13px] tnum text-ink/60">
                      <Money value={spent} /> / <Money value={limit} />
                    </span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar pct={pct} color={barColor(pct)} height={8} />
                  </div>
                  <p className="mt-1.5 text-[12px] font-semibold" style={{ color: barColor(pct) }}>
                    {nameOf(id)}: {status(spent, limit) || formatPercent(pct, { deva })}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState
            emoji="🎯"
            title={t('limitsNone')}
            body={t('budgetNoneMsg')}
            action={
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const first = addableCats[0] || state.cats.find((c) => c.kind === 'expense');
                  setLimitSheet({ catId: first ? first.id : '', amount: '' });
                }}
              >
                + {t('addLimit')}
              </button>
            }
          />
        )}
      </section>

      {/* Edit total */}
      <Sheet
        open={totalSheet}
        onClose={() => setTotalSheet(false)}
        title={t('totalBudget')}
        footer={
          <button type="button" className="btn-primary w-full" onClick={saveTotal}>
            {t('save')}
          </button>
        }
      >
        <div className="pb-2">
          <Field label={t('totalBudget')}>
            <input
              inputMode="decimal"
              autoFocus
              value={totalInput}
              onChange={(e) => setTotalInput(e.target.value.replace(/[^\d.]/g, ''))}
              className="field text-[20px] font-bold tnum"
            />
          </Field>
          <button
            type="button"
            className="mt-3 w-full min-h-[44px] rounded-xl text-danger font-semibold text-[14px] border border-danger/30"
            onClick={() => {
              actions.removeBudget(period);
              setTotalSheet(false);
            }}
          >
            {t('del')}
          </button>
        </div>
      </Sheet>

      {/* Add / edit category limit */}
      <Sheet
        open={Boolean(limitSheet)}
        onClose={() => {
          setLimitSheet(null);
          setLimitError('');
        }}
        title={limitSheet && budget.cats[limitSheet.catId] ? t('edit') : t('addLimit')}
        footer={
          <div className="flex gap-2">
            {limitSheet && budget.cats[limitSheet.catId] ? (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  actions.setBudgetLimit(period, limitSheet.catId, 0);
                  setLimitSheet(null);
                }}
              >
                {t('del')}
              </button>
            ) : null}
            <button type="button" className="btn-primary grow" onClick={saveLimit}>
              {t('save')}
            </button>
          </div>
        }
      >
        {limitSheet ? (
          <div className="pb-2 space-y-3">
            <Field label={t('category')}>
              <select
                value={limitSheet.catId}
                onChange={(e) => setLimitSheet({ ...limitSheet, catId: e.target.value })}
                className="field"
              >
                {state.cats
                  .filter((c) => c.kind === 'expense' && !c.hidden)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {lang === 'ne' ? c.ne : c.en}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label={t('amount')}>
              <input
                inputMode="decimal"
                autoFocus
                value={limitSheet.amount}
                onChange={(e) => {
                  setLimitSheet({ ...limitSheet, amount: e.target.value.replace(/[^\d.]/g, '') });
                  setLimitError('');
                }}
                className="field text-[20px] font-bold tnum"
                placeholder="3000"
              />
            </Field>
            {limitError ? (
              <p role="alert" className="text-[13px] font-semibold text-danger">
                {limitError}
              </p>
            ) : null}
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
