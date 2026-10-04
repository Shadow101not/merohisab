import React from 'react';
import { useApp } from '../store';
import { periodTitle, shiftPeriod, periodKey, todayISO } from '../lib/dates';

export default function MonthPicker({ period, onChange, allowFuture = false }) {
  const { lang, state } = useApp();
  const atCurrent = period === periodKey(todayISO(), state.system);

  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <button
        type="button"
        onClick={() => onChange(shiftPeriod(period, -1))}
        className="tap grid place-items-center rounded-full bg-white border border-line text-ink/70 shadow-soft"
        aria-label="previous month"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="text-center">
        <p className="text-[17px] font-bold leading-tight">
          {periodTitle(period, { lang, numerals: state.numerals })}
        </p>
        <p className="text-[11px] text-ink/45">{state.system === 'bs' ? 'BS' : 'AD'}</p>
      </div>

      <button
        type="button"
        onClick={() => onChange(shiftPeriod(period, 1))}
        disabled={!allowFuture && atCurrent}
        className="tap grid place-items-center rounded-full bg-white border border-line text-ink/70 shadow-soft disabled:opacity-35"
        aria-label="next month"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
