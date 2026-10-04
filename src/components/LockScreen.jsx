import React, { useState } from 'react';
import { useApp } from '../store';

export default function LockScreen() {
  const { t, unlock, state } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const press = (d) => {
    setError('');
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      unlock(next).then((ok) => {
        if (!ok) {
          setError(t('pinWrong'));
          setPin('');
        }
      });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[320px] text-center anim-pop">
        <div className="text-5xl mb-3">🔐</div>
        <h1 className="text-xl font-bold">{t('lockedTitle')}</h1>
        <p className="text-[13px] text-ink/55 mt-1">{t('lockedBody')}</p>

        <div className="flex justify-center gap-3 my-6" aria-label={t('pinTitle')}>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-3.5 h-3.5 rounded-full ${
                i < pin.length ? 'bg-brand' : 'bg-line'
              }`}
            />
          ))}
        </div>

        {error ? (
          <p role="alert" className="text-[13px] font-semibold text-danger mb-3">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'].map((key, i) =>
            key === '' ? (
              <span key={`empty-${i}`} />
            ) : (
              <button
                key={key}
                type="button"
                onClick={() => (key === '←' ? (setPin(''), setError('')) : press(key))}
                className="min-h-[58px] rounded-2xl bg-white border border-line text-[22px] font-semibold shadow-soft active:scale-95"
              >
                {key}
              </button>
            )
          )}
        </div>
        <p className="text-[11px] text-ink/40 mt-5">{state.lang === 'ne' ? 'मेरो हिसाब' : 'MeroHisab'}</p>
      </div>
    </div>
  );
}
