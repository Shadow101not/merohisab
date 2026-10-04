import React from 'react';
import { useApp } from '../store';

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
    <path d="M4 11.2 12 4l8 7.2" />
    <path d="M6.5 10v9h11v-9" />
    <path d="M10 19v-4.5h4V19" />
  </svg>
);
const BookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
    <path d="M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z" />
    <path d="M8 4.5V20" />
    <path d="M11 9h4M11 12.5h4" />
  </svg>
);
const BudgetIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
    <circle cx="12" cy="12" r="7.5" />
    <path d="M12 4.5v7.5l5 3" />
  </svg>
);
const SavingsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
    <path d="M5 9.5A5.5 5.5 0 0 1 10.5 4h3A5.5 5.5 0 0 1 19 9.5v5a5.5 5.5 0 0 1-5.5 5.5h-3A5.5 5.5 0 0 1 5 14.5z" />
    <path d="M15 9.5h.01M8 13h8" />
    <path d="M12 16v2" />
  </svg>
);
const MoreIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
    <circle cx="6" cy="12" r="1.4" />
    <circle cx="12" cy="12" r="1.4" />
    <circle cx="18" cy="12" r="1.4" />
  </svg>
);

const TABS = [
  { id: 'home', Icon: HomeIcon, key: 'navHome' },
  { id: 'records', Icon: BookIcon, key: 'navRecords' },
  { id: 'budget', Icon: BudgetIcon, key: 'navBudget' },
  { id: 'savings', Icon: SavingsIcon, key: 'navSavings' },
  { id: 'more', Icon: MoreIcon, key: 'navMore' }
];

export default function TabBar({ tab, onChange }) {
  const { t, lang } = useApp();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app pointer-events-none">
      <nav
        className="pointer-events-auto bg-white/95 backdrop-blur border-t border-line safe-b"
        aria-label="main"
      >
        <ul className="grid grid-cols-5">
          {TABS.map(({ id, Icon, key }) => {
            const on = tab === id;
            const label = t(key);
            const sub = lang === 'ne' && key !== 'navHome' ? t.en(key) : null;
            return (
              <li key={id}>
                <button
                  type="button"
                  aria-current={on ? 'page' : undefined}
                  onClick={() => onChange(id)}
                  className={`w-full min-h-[58px] flex flex-col items-center justify-center gap-0.5 px-1 ${
                    on ? 'text-brand' : 'text-ink/45'
                  }`}
                >
                  <span className={on ? 'drop-shadow-sm' : ''}>
                    <Icon />
                  </span>
                  <span className={`text-[11px] leading-none ${on ? 'font-bold' : 'font-semibold'}`}>
                    {label}
                  </span>
                  {sub ? <span className="text-[9px] leading-none text-ink/40">{sub}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
