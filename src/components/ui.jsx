import React, { useEffect } from 'react';
import { useApp } from '../store';
import { formatRs } from '../lib/currency';

export function Money({ value, sign = false, className = '', deva }) {
  const ctx = useApp();
  const useDeva = deva === undefined ? ctx.deva : deva;
  return (
    <span className={`tnum ${className}`}>{formatRs(value, { deva: useDeva, sign })}</span>
  );
}

export function Section({ title, sub, action, className = '' }) {
  const { lang } = useApp();
  return (
    <div className={`flex items-end justify-between gap-3 mb-2 ${className}`}>
      <h2 className="text-[15px] font-bold leading-tight">
        {title}
        {sub && lang === 'ne' ? (
          <span className="ml-2 text-[11px] font-medium text-ink/45">{sub}</span>
        ) : null}
      </h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Sheet({ open, onClose, title, sub, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/45 anim-fade cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-app bg-white rounded-t-3xl shadow-sheet anim-sheet max-h-[93dvh] flex flex-col"
      >
        <div className="pt-2.5 pb-1 flex flex-col items-center">
          <span className="w-10 h-1.5 rounded-full bg-line" />
        </div>
        {title ? (
          <div className="px-4 pb-2 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-bold leading-tight">{title}</h2>
              {sub ? <p className="text-[12px] text-ink/50">{sub}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="tap grid place-items-center rounded-full text-ink/50 hover:bg-paper"
              aria-label="close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ) : null}
        <div className="overflow-y-auto px-4 pb-2 grow">{children}</div>
        {footer ? <div className="px-4 pt-2 pb-4 safe-b border-t border-line/70 bg-white">{footer}</div> : null}
      </div>
    </div>
  );
}

export function ConfirmSheet({ open, title, body, confirmLabel, onConfirm, onCancel, danger }) {
  const { t } = useApp();
  return (
    <Sheet open={open} onClose={onCancel} title={title}>
      <p className="text-[14px] text-ink/70 leading-relaxed pb-2">{body}</p>
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn-ghost grow" onClick={onCancel}>
          {t('keep')}
        </button>
        <button
          type="button"
          className={`grow rounded-xl min-h-[44px] font-semibold text-white ${
            danger ? 'bg-danger' : 'bg-brand'
          }`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}

export function EmptyState({ emoji = '🗒️', title, body, action }) {
  return (
    <div className="card px-5 py-7 text-center">
      <div className="text-4xl mb-2" aria-hidden="true">
        {emoji}
      </div>
      <p className="font-semibold text-[15px]">{title}</p>
      {body ? <p className="text-[13px] text-ink/55 mt-1 leading-relaxed">{body}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function barColor(pct) {
  if (pct > 100) return '#C0392B';
  if (pct >= 80) return '#B4761A';
  return '#1E7B41';
}

export function ProgressBar({ pct, color, height = 10 }) {
  const width = Math.max(0, Math.min(100, pct || 0));
  return (
    <div
      className="w-full rounded-full bg-line/80 overflow-hidden"
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(width)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${width}%`, background: color || barColor(width) }}
      />
    </div>
  );
}

export function Segmented({ value, options, onChange, ariaLabel }) {
  return (
    <div className="seg" role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          data-on={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="label-sm block mb-1.5">{label}</span>
      {children}
      {hint ? <span className="block text-[12px] text-ink/50 mt-1">{hint}</span> : null}
    </label>
  );
}

export function Row({ title, sub, value, onClick, right, danger }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 min-h-[56px] text-left border-b border-line/60 last:border-0 ${
        danger ? 'text-danger' : ''
      } ${onClick ? 'active:bg-paper' : ''}`}
    >
      <span className="grow">
        <span className="block text-[15px] font-medium">{title}</span>
        {sub ? <span className="block text-[12px] text-ink/55">{sub}</span> : null}
      </span>
      {value ? <span className="text-[14px] text-ink/60">{value}</span> : null}
      {right}
      {onClick ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink/30">
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </Tag>
  );
}
