import React, { useState } from 'react';
import { useApp } from '../store';
import { Sheet, Field, Section } from '../components/ui';
import { EXPENSE_GROUPS } from '../data/categories';

const CAT_EMOJIS = ['⭐', '🍚', '🚌', '📚', '💊', '🎁', '🧾', '⭕', '🛒', '🏠', '🎬', '🌱'];

export default function Categories({ onBack }) {
  const { state, actions, t, lang, notify } = useApp();
  const [editing, setEditing] = useState(null); // {id?, ne, en, emoji, kind, group}
  const [error, setError] = useState('');

  const visible = state.cats.filter((c) => !c.hidden);
  const hidden = state.cats.filter((c) => c.hidden);

  const openNew = (kind) => {
    setEditing({ kind, emoji: '⭐', ne: '', en: '', group: 'other', custom: true });
    setError('');
  };

  const save = () => {
    const name = (lang === 'ne' ? editing.ne : editing.en) || editing.en || editing.ne;
    if (!String(name).trim()) {
      setError(t('goalEmptyName'));
      return;
    }
    const payload = {
      emoji: editing.emoji,
      ne: editing.ne.trim() || editing.en.trim(),
      en: editing.en.trim() || editing.ne.trim(),
      kind: editing.kind,
      group: editing.kind === 'income' ? 'income' : editing.group || 'other'
    };
    if (editing.id) actions.updateCat(editing.id, payload);
    else actions.addCat(payload);
    setEditing(null);
    notify(t('savedToast'));
  };

  const catRow = (c) => (
    <li key={c.id} className="flex items-center gap-3 px-4 min-h-[56px] border-b border-line/60 last:border-0">
      <span className="text-[18px] w-7 text-center" aria-hidden="true">
        {c.emoji}
      </span>
      <span className="grow text-[14px] font-medium">{lang === 'ne' ? c.ne : c.en}</span>
      <button
        type="button"
        className="tap grid place-items-center text-ink/45"
        aria-label={`${c.ne} hidden`}
        onClick={() => actions.updateCat(c.id, { hidden: !c.hidden })}
      >
        {c.hidden ? '🙈' : '👁'}
      </button>
      <button
        type="button"
        className="tap grid place-items-center text-ink/45"
        aria-label="edit"
        onClick={() =>
          setEditing({
            id: c.id,
            ne: c.ne,
            en: c.en,
            emoji: c.emoji,
            kind: c.kind,
            group: c.group,
            custom: c.custom
          })
        }
      >
        ✎
      </button>
      {c.custom ? (
        <button
          type="button"
          className="tap grid place-items-center text-danger"
          aria-label="delete"
          onClick={() => actions.removeCat(c.id)}
        >
          🗑
        </button>
      ) : null}
    </li>
  );

  return (
    <div className="px-4 pt-4 pb-28">
      <div className="flex items-center gap-2 mb-3">
        <button type="button" className="tap btn-quiet px-3" onClick={onBack} aria-label={t('back')}>
          ←
        </button>
        <h1 className="text-[20px] font-bold">{t('manageCategories')}</h1>
      </div>

      <div className="flex gap-2 mb-4">
        <button type="button" className="btn-primary grow" onClick={() => openNew('expense')}>
          + {t('categories')} ({t('expense')})
        </button>
        <button type="button" className="btn-ghost grow" onClick={() => openNew('income')}>
          + {t('categories')} ({t('income')})
        </button>
      </div>

      <div className="space-y-4">
        {EXPENSE_GROUPS.map((group) => {
          const items = visible.filter((c) => c.kind === 'expense' && c.group === group.id);
          if (!items.length) return null;
          return (
            <section key={group.id}>
              <Section
                title={lang === 'ne' ? group.ne : group.en}
                sub={lang === 'ne' ? group.en : ''}
              />
              <ul className="card overflow-hidden">{items.map(catRow)}</ul>
            </section>
          );
        })}

        <section>
          <Section title={t('income')} sub={t.en('income')} />
          <ul className="card overflow-hidden">
            {visible.filter((c) => c.kind === 'income').map(catRow)}
          </ul>
        </section>

        {hidden.length ? (
          <section>
            <Section title="🙈" sub={t('reset')} />
            <ul className="card overflow-hidden">{hidden.map(catRow)}</ul>
          </section>
        ) : null}
      </div>

      <Sheet
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing && editing.id ? t('edit') : t('add')}
        footer={
          <button type="button" className="btn-primary w-full" onClick={save}>
            {t('save')}
          </button>
        }
      >
        {editing ? (
          <div className="pb-2 space-y-3">
            <Field label={t('emoji')}>
              <div className="flex flex-wrap gap-2">
                {CAT_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className="chip"
                    data-on={editing.emoji === e}
                    onClick={() => setEditing({ ...editing, emoji: e })}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={`${t('name')} (नेपाली)`}>
              <input
                autoFocus
                value={editing.ne}
                onChange={(e) => setEditing({ ...editing, ne: e.target.value })}
                className="field"
                maxLength={30}
              />
            </Field>
            <Field label={`${t('name')} (English)`}>
              <input
                value={editing.en}
                onChange={(e) => setEditing({ ...editing, en: e.target.value })}
                className="field"
                maxLength={30}
              />
            </Field>
            {!editing.id ? (
              <Field label={t('category')}>
                <div className="seg">
                  <button
                    type="button"
                    data-on={editing.kind === 'expense'}
                    onClick={() => setEditing({ ...editing, kind: 'expense' })}
                  >
                    {t('expense')}
                  </button>
                  <button
                    type="button"
                    data-on={editing.kind === 'income'}
                    onClick={() => setEditing({ ...editing, kind: 'income' })}
                  >
                    {t('income')}
                  </button>
                </div>
              </Field>
            ) : null}
            {error ? (
              <p role="alert" className="text-[13px] font-semibold text-danger">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
