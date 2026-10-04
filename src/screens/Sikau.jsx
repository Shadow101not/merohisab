import React, { useState } from 'react';
import { useApp } from '../store';
import { Section } from '../components/ui';
import { LESSONS } from '../data/lessons';

export default function Sikau({ onBack }) {
  const { t, lang } = useApp();
  const [openId, setOpenId] = useState(null);
  const lesson = LESSONS.find((l) => l.id === openId);

  if (lesson) {
    const content = lang === 'ne' ? lesson.ne : lesson.en;
    return (
      <div className="px-4 pt-4 pb-28">
        <div className="flex items-center gap-2 mb-4">
          <button type="button" className="tap btn-quiet px-3" onClick={() => setOpenId(null)} aria-label={t('back')}>
            ←
          </button>
          <span className="text-[22px]" aria-hidden="true">
            {lesson.emoji}
          </span>
          <h1 className="text-[18px] font-bold leading-tight">{content.title}</h1>
        </div>
        <article className="card p-5">
          <p className="text-[15px] leading-[1.85] text-ink/85 first-letter:text-[26px] first-letter:font-bold">
            {content.body}
          </p>
        </article>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[12px] text-ink/45">📖 {t('sikauSub')}</span>
          <button type="button" className="btn-ghost" onClick={() => setOpenId(null)}>
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-28">
      <div className="flex items-center gap-2 mb-3">
        <button type="button" className="tap btn-quiet px-3" onClick={onBack} aria-label={t('back')}>
          ←
        </button>
        <div>
          <h1 className="text-[20px] font-bold">{t('sikauTitle')}</h1>
          <p className="text-[12px] text-ink/50">{t('sikauSub')}</p>
        </div>
      </div>

      <Section title={t('sikau')} sub="Sikau" />
      <ol className="space-y-3">
        {LESSONS.map((l, i) => {
          const content = lang === 'ne' ? l.ne : l.en;
          return (
            <li key={l.id}>
              <button
                type="button"
                className="card w-full px-4 py-4 flex items-center gap-3 text-left active:bg-paper"
                onClick={() => setOpenId(l.id)}
              >
                <span className="w-8 h-8 rounded-full bg-brand-50 text-brand grid place-items-center font-bold text-[13px] shrink-0">
                  {i + 1}
                </span>
                <span className="grow min-w-0">
                  <span className="block text-[15px] font-semibold truncate">{content.title}</span>
                  <span className="block text-[12px] text-ink/50">60s · {t('sikauSub')}</span>
                </span>
                <span className="text-[18px]" aria-hidden="true">
                  {l.emoji}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="text-[11px] text-ink/45 mt-4 leading-relaxed">
        {lang === 'ne'
          ? 'यी पाठहरू सिक्नका लागि मात्र हुन्। लगानी सल्लाह वा वित्तीय सल्लाह होइन।'
          : 'These lessons are for learning only. They are not investment or financial advice.'}
      </p>
    </div>
  );
}
