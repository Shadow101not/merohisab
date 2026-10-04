import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../store';
import { Sheet, Field, Section, Row, ConfirmSheet, Segmented } from '../components/ui';
import { exportCSV, exportJSON, parseImport, readFileAsText } from '../lib/backup';
import { sha256hex } from '../lib/hash';

const MODES = [
  { id: 'personal', key: 'modePersonal', emoji: '🙋' },
  { id: 'family', key: 'modeFamily', emoji: '👨‍👩‍👧' },
  { id: 'student', key: 'modeStudent', emoji: '🎓' },
  { id: 'business', key: 'modeBusiness', emoji: '🏪' }
];

export default function More({ onNavigate }) {
  const { state, actions, t, lang, deva, notify, lock } = useApp();
  const [pinSheet, setPinSheet] = useState(false);
  const [pinStep, setPinStep] = useState('new');
  const [pinVal, setPinVal] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [pinErr, setPinErr] = useState('');
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef(null);

  const openPin = () => {
    setPinErr('');
    setPinVal('');
    setFirstPin('');
    setPinStep(state.pinHash ? 'old' : 'new');
    setPinSheet(true);
  };

  useEffect(() => {
    if (pinVal.length !== 4 || !pinSheet) return undefined;
    let cancelled = false;
    const run = async () => {
      const value = pinVal;
      setPinVal('');
      if (pinStep === 'old') {
        const hash = await sha256hex(value);
        if (hash === state.pinHash) {
          setPinStep('new');
          setPinErr('');
        } else {
          setPinErr(t('pinWrong'));
        }
      } else if (pinStep === 'new') {
        setFirstPin(value);
        setPinStep('confirm');
      } else {
        if (value === firstPin) {
          const hash = await sha256hex(value);
          actions.setPinHash(hash);
          setPinSheet(false);
          notify(t('pinSaved'));
        } else {
          setPinErr(t('pinMismatch'));
          setPinStep('new');
          setFirstPin('');
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [pinVal, pinSheet, pinStep, firstPin, state.pinHash]);

  const doImport = async (file) => {
    if (!file) return;
    const text = await readFileAsText(file);
    const result = parseImport(text);
    if (result.ok) {
      actions.importState(result.state);
      notify(t('importOk'));
    } else {
      notify(t('importFail'));
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="px-4 pt-4 pb-28">
      <h1 className="text-[20px] font-bold">
        {t('moreTitle')}
        {lang === 'ne' ? (
          <span className="ml-2 text-[12px] font-medium text-ink/45">{t.en('moreTitle')}</span>
        ) : null}
      </h1>

      {/* Settings */}
      <section className="card p-4 mt-4 space-y-4">
        <Section title={t('settings')} sub={t.en('settings')} />

        <div>
          <span className="label-sm block mb-2">{t('language')}</span>
          <Segmented
            value={state.lang}
            onChange={(v) => actions.setLang(v)}
            ariaLabel={t('language')}
            options={[
              { value: 'ne', label: 'नेपाली' },
              { value: 'en', label: 'English' }
            ]}
          />
        </div>

        <div>
          <span className="label-sm block mb-2">{t('dateSystem')}</span>
          <Segmented
            value={state.system}
            onChange={(v) => actions.setSystem(v)}
            ariaLabel={t('dateSystem')}
            options={[
              { value: 'bs', label: t('bsLabel') },
              { value: 'ad', label: t('adLabel') }
            ]}
          />
        </div>

        <div>
          <span className="label-sm block mb-2">{t('numerals')}</span>
          <Segmented
            value={state.numerals}
            onChange={(v) => actions.setNumerals(v)}
            ariaLabel={t('numerals')}
            options={[
              { value: 'deva', label: t('devaLabel') },
              { value: 'latin', label: t('latinLabel') }
            ]}
          />
        </div>

        <div>
          <span className="label-sm block mb-2">{t('modeLabel')}</span>
          <div className="grid grid-cols-4 gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                data-on={state.mode === m.id}
                className="chip flex-col !min-h-[64px] justify-center gap-0.5 px-1"
                onClick={() => actions.setMode(m.id)}
              >
                <span className="text-[17px]" aria-hidden="true">
                  {m.emoji}
                </span>
                <span className="text-[11px]">{t(m.key)}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-ink/50 mt-1.5">
            {state.mode === 'family' ? t('modeFamilyD') : t('modePersonalD')}
          </p>
        </div>
      </section>

      {/* PIN */}
      <section className="card mt-4 overflow-hidden">
        <Row
          title={t('pinLock')}
          sub={t('pinBody')}
          value={state.pinHash ? t('pinOn') : t('pinOff')}
          onClick={openPin}
        />
        {state.mode === 'family' ? (
          <Row title={t('familyFilter')} sub={t('modeFamilyD')} value={t('modeFamily')} />
        ) : null}
        <Row title={t('manageCategories')} sub={t('categories')} onClick={() => onNavigate('categories')} />
        <Row title={t('sikau')} sub={t('sikauSub')} onClick={() => onNavigate('sikau')} />
      </section>

      {/* Data */}
      <section className="card mt-4 overflow-hidden">
        <div className="px-4 pt-3 pb-1">
          <Section title={t('data')} sub={t.en('data')} />
        </div>
        <Row
          title={t('exportCsv')}
          sub="merohisab.csv"
          onClick={() => notify(exportCSV(state, t) ? t('exportDone') : t('errGeneric'))}
        />
        <Row
          title={t('exportJson')}
          sub="merohisab-backup.json"
          onClick={() => notify(exportJSON(state) ? t('exportDone') : t('errGeneric'))}
        />
        <Row
          title={t('importJson')}
          sub={t('importBody')}
          onClick={() => fileRef.current && fileRef.current.click()}
        />
        {state.demo ? (
          <Row title={t('clearDemo')} sub={t('clearDemoBody')} onClick={() => setConfirmDemo(true)} />
        ) : null}
        <Row title={t('deleteAll')} sub={t('deleteAllBody')} danger onClick={() => setConfirmDelete(true)} />
      </section>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => doImport(e.target.files && e.target.files[0])}
      />

      {/* Privacy */}
      <section className="card p-4 mt-4 bg-brand-50 border-brand-100">
        <p className="text-[13px] font-bold text-brand-700">🔒 {t('privacyTitle')}</p>
        <p className="text-[13px] text-ink/70 mt-1 leading-relaxed">{t('privacyBody')}</p>
      </section>

      <footer className="mt-5 text-center">
        <p className="text-[15px] font-bold">{t('appName')}</p>
        <p className="text-[12px] text-ink/50">{t('tagline')}</p>
        <p className="text-[11px] text-ink/40 mt-1">v1.0 · offline · {t('about')}</p>
      </footer>

      {/* PIN sheet */}
      <Sheet
        open={pinSheet}
        onClose={() => setPinSheet(false)}
        title={t('pinTitle')}
        sub={pinStep === 'old' ? t('lockedBody') : pinStep === 'new' ? t('pinCreate') : t('pinConfirm')}
      >
        <div className="pb-4">
          <input
            inputMode="numeric"
            autoFocus
            value={pinVal}
            onChange={(e) => {
              setPinVal(e.target.value.replace(/\D/g, '').slice(0, 4));
              setPinErr('');
            }}
            placeholder="••••"
            aria-label={t('pinTitle')}
            className="field text-center text-[30px] font-bold tracking-[0.5em] tnum"
          />
          <div className="flex justify-center gap-2 mt-3" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${i < pinVal.length ? 'bg-brand' : 'bg-line'}`}
              />
            ))}
          </div>
          {pinErr ? (
            <p role="alert" className="text-center text-[13px] font-semibold text-danger mt-3">
              {pinErr}
            </p>
          ) : null}
          {state.pinHash ? (
            <button
              type="button"
              className="mt-4 w-full min-h-[44px] rounded-xl text-danger font-semibold text-[14px] border border-danger/30"
              onClick={() => {
                actions.clearPin();
                setPinSheet(false);
                notify(t('pinRemoved'));
              }}
            >
              {t('removePin')}
            </button>
          ) : null}
          <button
            type="button"
            className="mt-3 w-full min-h-[44px] text-[13px] text-ink/50"
            onClick={lock}
          >
            {t('pinOff')} · {t('close')}
          </button>
        </div>
      </Sheet>

      <ConfirmSheet
        open={confirmDemo}
        title={t('clearDemoTitle')}
        body={t('clearDemoBody')}
        confirmLabel={t('clearDemo')}
        danger
        onCancel={() => setConfirmDemo(false)}
        onConfirm={() => {
          actions.clearDemo();
          setConfirmDemo(false);
          notify(t('clearDemoDone'));
        }}
      />

      <ConfirmSheet
        open={confirmDelete}
        title={t('deleteAllTitle')}
        body={t('deleteAllBody')}
        confirmLabel={t('deleteAll')}
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          actions.deleteAll();
          setConfirmDelete(false);
          notify(t('dataDeleted'));
        }}
      />
    </div>
  );
}
