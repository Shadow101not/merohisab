import React, { useState } from 'react';
import { useApp } from '../store';
import { buildCats } from '../data/categories';
import { parseAmount, formatRs } from '../lib/currency';
import { periodKey, todayISO } from '../lib/dates';

const ROLES = [
  { id: 'personal', emoji: '🙋', key: 'modePersonal', desc: 'modePersonalD' },
  { id: 'family', emoji: '👨‍👩‍👧', key: 'modeFamily', desc: 'modeFamilyD' },
  { id: 'student', emoji: '🎓', key: 'modeStudent', desc: 'modeStudentD' },
  { id: 'business', emoji: '🏪', key: 'modeBusiness', desc: 'modeBusinessD' }
];

export default function Onboarding() {
  const { t, lang, state, actions, deva } = useApp();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState('personal');
  const [income, setIncome] = useState('');
  const [budget, setBudget] = useState('');

  const finish = () => {
    const parsedBudget = parseAmount(budget);
    const parsedIncome = parseAmount(income);
    actions.update((s) => ({
      ...s,
      mode,
      cats: buildCats(mode),
      onboarded: true,
      prefs: {
        ...s.prefs,
        income: parsedIncome.ok ? parsedIncome.value : null,
        budget: parsedBudget.ok ? parsedBudget.value : null
      }
    }));
    if (parsedBudget.ok) {
      actions.setBudget(periodKey(todayISO(), 'bs'), { total: parsedBudget.value });
    }
  };

  const titles = [t('obLangTitle'), t('obWhatTitle'), t('obPrefTitle')];
  const bodies = [t('obLangBody'), t('obWhatBody'), t('obPrefBody')];

  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col">
      <header className="px-5 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-brand text-white grid place-items-center font-bold">
              रू
            </span>
            <div className="leading-tight">
              <p className="font-bold text-[15px]">{t('appName')}</p>
              <p className="text-[11px] text-ink/50">{t('tagline')}</p>
            </div>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full ${i <= step ? 'bg-brand' : 'bg-line'}`}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="px-5 grow overflow-y-auto pb-4">
        <h1 className="text-[22px] font-bold leading-snug mt-3">{titles[step]}</h1>
        <p className="text-[13px] text-ink/55 mt-1">{bodies[step]}</p>

        {step === 0 ? (
          <div className="grid grid-cols-2 gap-3 mt-6">
            {[
              { id: 'ne', label: 'नेपाली', sub: 'Nepali' },
              { id: 'en', label: 'English', sub: '' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={state.lang === opt.id}
                onClick={() => actions.setLang(opt.id)}
                className={`card px-4 py-6 text-center border-2 ${
                  state.lang === opt.id ? 'border-brand bg-brand-50' : 'border-transparent'
                }`}
              >
                <span className="block text-[18px] font-bold">{opt.label}</span>
                {opt.sub ? <span className="block text-[12px] text-ink/50">{opt.sub}</span> : null}
              </button>
            ))}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid grid-cols-1 gap-3 mt-5">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setMode(r.id)}
                className={`card px-4 py-4 flex items-center gap-3 text-left border-2 ${
                  mode === r.id ? 'border-brand bg-brand-50' : 'border-transparent'
                }`}
              >
                <span className="text-2xl" aria-hidden="true">
                  {r.emoji}
                </span>
                <span className="grow">
                  <span className="block font-semibold text-[15px]">{t(r.key)}</span>
                  <span className="block text-[12px] text-ink/55">{t(r.desc)}</span>
                </span>
                <span
                  className={`w-5 h-5 rounded-full border-2 ${
                    mode === r.id ? 'border-brand bg-brand' : 'border-line'
                  }`}
                />
              </button>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="label-sm block mb-1.5">{t('income')}</span>
              <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3">
                <span className="text-ink/45 text-[14px]">Rs.</span>
                <input
                  inputMode="decimal"
                  value={income}
                  onChange={(e) => setIncome(e.target.value.replace(/[^\d.]/g, ''))}
                  placeholder="45000"
                  className="grow min-h-[46px] bg-transparent outline-none text-[16px] tnum"
                />
              </div>
            </label>
            <label className="block">
              <span className="label-sm block mb-1.5">{t('totalBudget')}</span>
              <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3">
                <span className="text-ink/45 text-[14px]">Rs.</span>
                <input
                  inputMode="decimal"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value.replace(/[^\d.]/g, ''))}
                  placeholder="35000"
                  className="grow min-h-[46px] bg-transparent outline-none text-[16px] tnum"
                />
              </div>
            </label>
            <div className="card px-4 py-3 flex gap-2 items-start bg-paper">
              <span aria-hidden="true">🔒</span>
              <p className="text-[12px] text-ink/60 leading-relaxed">{t('privacyBody')}</p>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="px-5 pt-2 pb-6 safe-b flex gap-2">
        {step > 0 ? (
          <button type="button" className="btn-ghost" onClick={() => setStep(step - 1)}>
            {t('back')}
          </button>
        ) : null}
        <button
          type="button"
          className="btn-primary grow"
          onClick={() => (step === 2 ? finish() : setStep(step + 1))}
        >
          {step === 2 ? t('obStart') : step === 1 ? t('obNext') : t('obNext')}
        </button>
        {step === 2 ? (
          <button
            type="button"
            className="btn-quiet"
            onClick={() => {
              setIncome('');
              setBudget('');
              finish();
            }}
          >
            {t('obSkip')}
          </button>
        ) : null}
      </footer>
    </div>
  );
}
