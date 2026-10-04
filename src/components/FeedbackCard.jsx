import React, { useState } from 'react';
import { useApp } from '../store';

const OPTIONS = ['fbAdding', 'fbCategories', 'fbCharts', 'fbBudgets', 'fbIncome', 'fbOther'];

export function feedbackDue(state) {
  return (
    Array.isArray(state.usage) &&
    state.usage.length >= 30 &&
    state.feedback &&
    !state.feedback.dismissed &&
    !state.feedback.done
  );
}

export default function FeedbackCard() {
  const { t, state, actions, notify } = useApp();
  const [picked, setPicked] = useState(null);
  const [sent, setSent] = useState(false);

  if (!feedbackDue(state)) return null;

  const submit = () => {
    actions.setFeedback({ done: true, answer: picked, at: new Date().toISOString() });
    setSent(true);
    setTimeout(() => actions.setFeedback({ dismissed: true }), 1800);
  };

  return (
    <div className="card p-4 mb-4 border border-brand-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand">
            {t('feedbackEyebrow')}
          </p>
          <p className="font-bold text-[15px] leading-snug mt-0.5">{t('feedbackTitle')}</p>
        </div>
        <button
          type="button"
          className="text-[12px] text-ink/50 min-h-[44px] px-1"
          onClick={() => actions.setFeedback({ dismissed: true })}
        >
          {t('feedbackLater')}
        </button>
      </div>

      {sent ? (
        <p className="text-[13px] text-money font-semibold mt-3">{t('fbThanks')}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mt-3">
            {OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className="chip"
                data-on={picked === opt}
                onClick={() => setPicked(opt)}
              >
                {t(opt)}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] text-ink/45">{t('feedbackBody')}</span>
            <button
              type="button"
              className="btn-primary min-h-[40px] px-5 disabled:opacity-40"
              disabled={!picked}
              onClick={submit}
            >
              {t('fbSubmit')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
