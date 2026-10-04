import React, { useState } from 'react';
import { useApp } from '../store';
import { Section, Money, ProgressBar, EmptyState, Sheet, Field } from '../components/ui';
import { parseAmount, formatRs, formatPercent } from '../lib/currency';
import { fmtDate } from '../lib/dates';
import { fill } from '../i18n';

const PRESETS = [
  { emoji: '🛟', ne: 'आपतकालीन कोष', en: 'Emergency fund', target: 100000 },
  { emoji: '📱', ne: 'नयाँ फोन', en: 'New phone', target: 60000 },
  { emoji: '💻', ne: 'ल्यापटप', en: 'Laptop', target: 120000 },
  { emoji: '🎓', ne: 'कलेज फिस', en: 'College fees', target: 50000 },
  { emoji: '🛍️', ne: 'डसैनको खर्च', en: 'Dashain shopping', target: 25000 },
  { emoji: '✈️', ne: 'घुमफिर', en: 'Travel', target: 40000 }
];

const EMOJIS = ['🛟', '📱', '💻', '🎓', '🛍️', '✈️', '🏠', '🚗', '🎉', '⭐'];

export default function Savings() {
  const { state, actions, t, lang, deva, notify } = useApp();
  const [newSheet, setNewSheet] = useState(false);
  const [addFor, setAddFor] = useState(null);
  const [form, setForm] = useState({ emoji: '🛟', ne: '', en: '', target: '', date: '' });
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const savedOf = (g) => (g.parts || []).reduce((sum, p) => sum + p.amount, 0);
  const totalSaved = state.goals.reduce((s, g) => s + savedOf(g), 0);
  const totalTarget = state.goals.reduce((s, g) => s + g.target, 0);

  const openNew = (preset) => {
    setForm({
      emoji: preset ? preset.emoji : '⭐',
      ne: preset ? preset.ne : '',
      en: preset ? preset.en : '',
      target: preset ? String(preset.target) : '',
      date: ''
    });
    setError('');
    setNewSheet(true);
  };

  const createGoal = () => {
    const parsed = parseAmount(form.target);
    const name = form.ne.trim() || form.en.trim();
    if (!name) {
      setError(t('goalEmptyName'));
      return;
    }
    if (!parsed.ok) {
      setError(t('goalEmptyTarget'));
      return;
    }
    actions.addGoal({
      emoji: form.emoji,
      ne: name,
      en: form.en.trim() || name,
      target: parsed.value,
      date: form.date
    });
    setNewSheet(false);
    notify(t('savedToast'));
  };

  const addMoney = () => {
    const parsed = parseAmount(amount);
    if (!parsed.ok) {
      setError(t('validationPositive'));
      return;
    }
    actions.addSaving(addFor.id, parsed.value);
    setAmount('');
    setError('');
    setAddFor(null);
    notify(t('moneyAdded'));
  };

  return (
    <div className="px-4 pt-4 pb-28">
      <div className="flex items-end justify-between">
        <h1 className="text-[20px] font-bold">
          {t('navSavings')}
          {lang === 'ne' ? (
            <span className="ml-2 text-[12px] font-medium text-ink/45">{t.en('navSavings')}</span>
          ) : null}
        </h1>
        <button type="button" className="btn-primary min-h-[40px] px-4 text-[14px]" onClick={() => openNew(null)}>
          + {t('newGoal')}
        </button>
      </div>

      {state.goals.length ? (
        <>
          <div className="card p-4 mt-3 flex items-center justify-between">
            <div>
              <p className="label-sm">{t('total')}</p>
              <p className="text-[24px] font-bold text-money leading-tight">
                <Money value={totalSaved} />
              </p>
            </div>
            <div className="text-right">
              <p className="label-sm">{t('addTarget')}</p>
              <p className="text-[16px] font-semibold text-ink/60 tnum">
                <Money value={totalTarget} />
              </p>
            </div>
          </div>
          <p className="text-[12px] text-ink/55 mt-2 flex items-start gap-1.5">
            <span aria-hidden="true">💚</span> {t('savingsHint')}
          </p>
        </>
      ) : null}

      {state.goals.length ? (
        <div className="mt-4 space-y-4">
          {state.goals.map((g) => {
            const saved = savedOf(g);
            const pct = g.target ? (saved / g.target) * 100 : 0;
            const done = saved >= g.target;
            const color = done ? '#1E7B41' : pct >= 100 ? '#B4761A' : pct >= 80 ? '#B4761A' : '#1E7B41';
            const name = lang === 'ne' ? g.ne : g.en;
            const remaining = Math.max(0, g.target - saved);
            return (
              <section key={g.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <span className="text-[26px]" aria-hidden="true">
                    {g.emoji}
                  </span>
                  <div className="grow min-w-0">
                    <p className="font-bold text-[15px] truncate">{name}</p>
                    <p className="text-[12px] text-ink/55 tnum">
                      {fill(t('savedOf'), {
                        saved: formatRs(saved, { deva }),
                        target: formatRs(g.target, { deva })
                      })}
                      {g.date ? ` · ${t('goalDate')}: ${fmtDate(g.date, { system: state.system, lang, numerals: state.numerals, style: 'short' })}` : ''}
                    </p>
                  </div>
                  <span
                    className="text-[13px] font-bold tnum"
                    style={{ color }}
                  >
                    {formatPercent(pct, { deva })}
                  </span>
                </div>

                <div className="mt-3">
                  <ProgressBar pct={pct} color={color} height={10} />
                </div>

                <div className="flex items-center justify-between mt-2.5">
                  <p className="text-[12px] font-semibold" style={{ color }}>
                    {done ? t('goalDone') : fill(t('goalRemaining'), { amt: formatRs(remaining, { deva }) })}
                  </p>
                  <button
                    type="button"
                    className="btn-quiet min-h-[40px] px-4 text-[13px]"
                    onClick={() => {
                      setAmount('');
                      setError('');
                      setAddFor(g);
                    }}
                  >
                    + {t('addMoney')}
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState
            emoji="🎯"
            title={t('noGoals')}
            body={t('noGoalsBody')}
            action={
              <button type="button" className="btn-primary" onClick={() => openNew(null)}>
                + {t('newGoal')}
              </button>
            }
          />
          <div className="mt-4">
            <Section title={t('sikau')} sub={t.en('sikauSub')} />
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.en} type="button" className="chip" onClick={() => openNew(p)}>
                  <span aria-hidden="true">{p.emoji}</span>
                  {lang === 'ne' ? p.ne : p.en}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New goal */}
      <Sheet
        open={newSheet}
        onClose={() => setNewSheet(false)}
        title={t('newGoal')}
        footer={
          <button type="button" className="btn-primary w-full" onClick={createGoal}>
            {t('createGoal')}
          </button>
        }
      >
        <div className="pb-2 space-y-3">
          <div>
            <span className="label-sm block mb-2">{t('sikau')}</span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.en}
                  type="button"
                  className="chip"
                  data-on={form.ne === p.ne}
                  onClick={() =>
                    setForm({
                      emoji: p.emoji,
                      ne: p.ne,
                      en: p.en,
                      target: String(p.target),
                      date: form.date
                    })
                  }
                >
                  <span aria-hidden="true">{p.emoji}</span>
                  {lang === 'ne' ? p.ne : p.en}
                </button>
              ))}
            </div>
          </div>

          <Field label={t('emoji')}>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={`chip ${form.emoji === e ? 'font-bold' : ''}`}
                  data-on={form.emoji === e}
                  onClick={() => setForm({ ...form, emoji: e })}
                >
                  {e}
                </button>
              ))}
            </div>
          </Field>

          <Field label={t('goalName')}>
            <input
              value={lang === 'ne' ? form.ne : form.en}
              onChange={(e) =>
                setForm(
                  lang === 'ne'
                    ? { ...form, ne: e.target.value }
                    : { ...form, en: e.target.value }
                )
              }
              className="field"
              maxLength={40}
            />
          </Field>

          <Field label={t('addTarget')}>
            <input
              inputMode="decimal"
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value.replace(/[^\d.]/g, '') })}
              className="field tnum text-[17px] font-semibold"
              placeholder="50000"
            />
          </Field>

          <Field label={`${t('addTargetDate')} · ${t('optional')}`}>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="field"
            />
          </Field>

          {error ? (
            <p role="alert" className="text-[13px] font-semibold text-danger">
              {error}
            </p>
          ) : null}
        </div>
      </Sheet>

      {/* Add money to a goal */}
      <Sheet
        open={Boolean(addFor)}
        onClose={() => setAddFor(null)}
        title={t('addMoney')}
        sub={addFor ? `${addFor.emoji} ${lang === 'ne' ? addFor.ne : addFor.en}` : ''}
        footer={
          <button type="button" className="btn-primary w-full" onClick={addMoney}>
            {t('add')}
          </button>
        }
      >
        <div className="pb-2">
          <Field label={t('amount')} hint={t('savingsHint')}>
            <input
              inputMode="decimal"
              autoFocus
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value.replace(/[^\d.]/g, ''));
                setError('');
              }}
              className="field tnum text-[24px] font-bold text-right"
              placeholder="1000"
            />
          </Field>
          {error ? (
            <p role="alert" className="mt-2 text-[13px] font-semibold text-danger">
              {error}
            </p>
          ) : null}
        </div>
      </Sheet>
    </div>
  );
}
