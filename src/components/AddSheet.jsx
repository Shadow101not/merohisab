import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../store';
import { Sheet, Field, Segmented } from './ui';
import { parseAmount, formatRs } from '../lib/currency';
import { todayISO, dateFromISO, isoFromDate, fmtDate } from '../lib/dates';

const PAYMENTS = ['Cash', 'Bank', 'eSewa', 'Khalti', 'Card', 'Other'];
const PAY_KEY = {
  Cash: 'payCash',
  Bank: 'payBank',
  eSewa: 'payEsewa',
  Khalti: 'payKhalti',
  Card: 'payCard',
  Other: 'payOther'
};

export default function AddSheet({ type, txn, onClose }) {
  const { state, actions, t, lang, deva, familyMode, notify } = useApp();
  const isEdit = Boolean(txn);
  const amountRef = useRef(null);

  const [amount, setAmount] = useState(txn ? String(txn.amount) : '');
  const [cat, setCat] = useState(txn ? txn.cat : null);
  const [pay, setPay] = useState(txn ? txn.pay || state.lastPay : state.lastPay || 'Cash');
  const [date, setDate] = useState(txn ? txn.date : todayISO());
  const [note, setNote] = useState(txn ? txn.note || '' : '');
  const [regular, setRegular] = useState(txn && txn.regular ? txn.regular : 'regular');
  const [scope, setScope] = useState(txn && txn.scope ? txn.scope : 'mine');
  const [error, setError] = useState('');

  useEffect(() => {
    const id = setTimeout(() => amountRef.current && amountRef.current.focus(), 60);
    return () => clearTimeout(id);
  }, []);

  const visibleCats = useMemo(
    () => state.cats.filter((c) => c.kind === type && !c.hidden),
    [state.cats, type]
  );

  // Most-used categories come first so a typical expense takes three taps.
  const ordered = useMemo(() => {
    const cutoff = isoFromDate(new Date(Date.now() - 180 * 86400000));
    const counts = {};
    state.txns.forEach((tx) => {
      if (tx.type === type && tx.date >= cutoff) counts[tx.cat] = (counts[tx.cat] || 0) + 1;
    });
    return [...visibleCats].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
  }, [visibleCats, state.txns, type]);

  useEffect(() => {
    if (!cat && ordered.length) setCat(ordered[0].id);
  }, [ordered, cat]);

  const shiftDay = (delta) => {
    const d = dateFromISO(date);
    d.setDate(d.getDate() + delta);
    const next = isoFromDate(d);
    if (next > todayISO()) return;
    setDate(next);
  };

  const submit = () => {
    const parsed = parseAmount(amount);
    if (!parsed.ok) {
      const map = {
        empty: 'validationRequired',
        positive: 'validationPositive',
        decimals: 'validationDecimals',
        big: 'validationBig',
        invalid: 'validationDecimals'
      };
      setError(t(map[parsed.reason] || 'validationRequired'));
      return;
    }
    if (!cat) {
      setError(t('validationCategory'));
      return;
    }
    const payload = {
      type,
      amount: parsed.value,
      cat,
      pay,
      date,
      note: note.trim(),
      scope
    };
    if (type === 'income') {
      payload.src = cat;
      payload.regular = regular;
    }
    if (isEdit) actions.updateTxn({ ...txn, ...payload });
    else actions.addTxn(payload);
    notify(t('savedToast'));
    onClose();
  };

  const remove = () => {
    const gone = actions.removeTxn(txn.id);
    onClose();
    if (gone) {
      notify(t('deletedToast'), {
        actionLabel: t('undo'),
        onAction: () => actions.restoreTxn(gone)
      });
    }
  };

  const titleKey = isEdit
    ? type === 'expense'
      ? 'sheetEditExpense'
      : 'sheetEditIncome'
    : type === 'expense'
      ? 'sheetExpense'
      : 'sheetIncome';

  const chipName = (c) => (lang === 'ne' ? c.ne : c.en);

  return (
    <Sheet
      open
      onClose={onClose}
      title={t(titleKey)}
      sub={t('amountHint')}
      footer={
        <button type="button" onClick={submit} className="btn-primary w-full min-h-[52px] text-[16px]">
          {isEdit ? t('save') : t('add')}
        </button>
      }
    >
      <div className="pb-3">
        {/* Amount display — big, keypad-like, auto-focused */}
        <div className="relative rounded-2xl bg-paper border border-line px-4 py-3 flex items-center gap-2">
          <span className="text-[15px] font-semibold text-ink/50">Rs.</span>
          <input
            ref={amountRef}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^\d.]/g, ''));
              setError('');
            }}
            inputMode="decimal"
            placeholder="0"
            aria-label={t('amount')}
            className="grow w-full min-w-0 bg-transparent text-right text-[34px] font-bold tnum outline-none placeholder:text-ink/25"
          />
          {amount ? (
            <button
              type="button"
              aria-label={t('reset')}
              onClick={() => setAmount('')}
              className="tap grid place-items-center rounded-full text-ink/40 text-[18px] font-bold"
            >
              ×
            </button>
          ) : null}
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[12px] text-ink/50">
            {amount && parseAmount(amount).ok ? formatRs(parseAmount(amount).value, { deva }) : t('amountHint')}
          </span>
          <span className="text-[12px] text-ink/40">{fmtDate(date, { system: state.system, lang, numerals: state.numerals })}</span>
        </div>

        <div className="mt-4">
          <span className="label-sm block mb-2">
            {type === 'expense' ? t('category') : t('pickSource')}
          </span>
          <div className="flex flex-wrap gap-2">
            {ordered.map((c) => {
              const isRemit = c.id === 'remittance';
              return (
                <button
                  key={c.id}
                  type="button"
                  data-on={cat === c.id}
                  className="chip"
                  onClick={() => {
                    setCat(c.id);
                    setError('');
                  }}
                  style={
                    isRemit && cat !== c.id
                      ? { borderColor: '#B3262E', background: '#FBEDEE', color: '#971E25' }
                      : undefined
                  }
                >
                  <span aria-hidden="true">{c.emoji}</span>
                  {chipName(c)}
                  {isRemit ? (
                    <span className="text-[10px] font-bold uppercase bg-brand text-white rounded px-1 py-0.5">
                      {t('remittanceTag')}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {type === 'income' && cat === 'remittance' ? (
            <p className="text-[12px] text-brand mt-2">{t('remittanceHint')}</p>
          ) : null}
        </div>

        {type === 'income' ? (
          <div className="mt-4">
            <span className="label-sm block mb-2">{t('regular')}</span>
            <Segmented
              value={regular}
              onChange={setRegular}
              ariaLabel={t('regular')}
              options={[
                { value: 'regular', label: t('regular') },
                { value: 'occasional', label: t('occasional') }
              ]}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <Field label={t('payment')}>
            <div className="relative">
              <select
                value={pay}
                onChange={(e) => setPay(e.target.value)}
                className="field appearance-none pr-8"
                aria-label={t('payment')}
              >
                {PAYMENTS.map((p) => (
                  <option key={p} value={p}>
                    {t(PAY_KEY[p])}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/40">
                ▾
              </span>
            </div>
          </Field>

          <Field label={t('date')}>
            <div className="relative flex items-center gap-1">
              <button
                type="button"
                className="tap grid place-items-center rounded-xl border border-line bg-white text-ink/60"
                onClick={() => shiftDay(-1)}
                aria-label="previous day"
              >
                ‹
              </button>
              <div className="grow relative">
                {/* Shows the selected date in the app's date system; the invisible
                    native picker stays on top so tapping still opens the calendar. */}
                <div className="field text-center pointer-events-none font-semibold">
                  {fmtDate(date, {
                    system: state.system,
                    lang,
                    numerals: state.numerals,
                    style: 'short'
                  })}
                </div>
                <input
                  type="date"
                  value={date}
                  max={todayISO()}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                  aria-label={t('date')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
              <button
                type="button"
                className="tap grid place-items-center rounded-xl border border-line bg-white text-ink/60 disabled:opacity-40"
                onClick={() => shiftDay(1)}
                disabled={date >= todayISO()}
                aria-label="next day"
              >
                ›
              </button>
            </div>
          </Field>
        </div>

        <div className="mt-3">
          <Field label={`${t('note')} · ${t('optional')}`}>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={80}
              placeholder={t('notePlaceholder')}
              className="field"
            />
          </Field>
        </div>

        {familyMode ? (
          <div className="mt-3">
            <span className="label-sm block mb-2">{t('familyFilter')}</span>
            <Segmented
              value={scope}
              onChange={setScope}
              ariaLabel={t('familyFilter')}
              options={[
                { value: 'mine', label: t('mine') },
                { value: 'family', label: t('family') }
              ]}
            />
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-3 text-[13px] font-semibold text-danger">
            {error}
          </p>
        ) : null}

        {isEdit ? (
          <button
            type="button"
            onClick={remove}
            className="mt-4 w-full min-h-[44px] rounded-xl border border-danger/30 text-danger font-semibold text-[14px]"
          >
            {t('del')}
          </button>
        ) : null}
      </div>
    </Sheet>
  );
}
