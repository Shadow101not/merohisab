import React, { useEffect, useState } from 'react';
import { useApp } from './store';
import TabBar from './components/TabBar';
import AddSheet from './components/AddSheet';
import LockScreen from './components/LockScreen';
import Onboarding from './components/Onboarding';
import Home from './screens/Home';
import Records from './screens/Records';
import Budget from './screens/Budget';
import Savings from './screens/Savings';
import More from './screens/More';
import Categories from './screens/Categories';
import Sikau from './screens/Sikau';
import { periodKey, todayISO } from './lib/dates';

export default function App() {
  const { state, locked, toast, dismissToast, t, lang } = useApp();
  const [tab, setTab] = useState('home');
  const [view, setView] = useState(null);
  const [period, setPeriod] = useState(() => periodKey(todayISO(), state.system));
  const [add, setAdd] = useState(null);

  useEffect(() => {
    document.documentElement.lang = state.lang === 'ne' ? 'ne' : 'en';
  }, [state.lang]);

  useEffect(() => {
    setPeriod(periodKey(todayISO(), state.system));
  }, [state.system]);

  if (!state.onboarded) return <Onboarding />;
  if (locked) return <LockScreen />;

  const showFab = !view && (tab === 'home' || tab === 'records');
  const openAdd = (type) => setAdd({ type });
  const openEdit = (txn) => setAdd({ type: txn.type, txn });

  const screen = (() => {
    if (view === 'categories') return <Categories onBack={() => setView(null)} />;
    if (view === 'sikau') return <Sikau onBack={() => setView(null)} />;
    if (tab === 'records')
      return <Records period={period} setPeriod={setPeriod} onEdit={openEdit} onAdd={openAdd} />;
    if (tab === 'budget') return <Budget period={period} setPeriod={setPeriod} />;
    if (tab === 'savings') return <Savings />;
    if (tab === 'more')
      return <More onNavigate={(next) => { setAdd(null); setView(next); }} />;
    return (
      <Home
        period={period}
        setPeriod={setPeriod}
        onAdd={openAdd}
        onOpenTxn={openEdit}
        goRecords={() => setTab('records')}
      />
    );
  })();

  return (
    <div className="min-h-[100dvh] bg-[#EBE3D7]">
      <div className="app-shell shadow-soft">
        <main>{screen}</main>

        {showFab ? (
          <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app pointer-events-none h-[150px]">
            <button
              type="button"
              onClick={() => openAdd('expense')}
              className="pointer-events-auto absolute right-4 bottom-[70px] h-[52px] px-5 rounded-full bg-brand text-white shadow-lg font-semibold text-[15px] flex items-center gap-2 active:scale-95 transition"
            >
              <span className="text-[20px] leading-none">+</span>
              {t('addExpense')}
            </button>
          </div>
        ) : null}

        <TabBar
          tab={tab}
          onChange={(next) => {
            setAdd(null);
            setView(null);
            setTab(next);
          }}
        />

        {add ? (
          <AddSheet
            key={add.txn ? `edit-${add.txn.id}` : `new-${add.type}`}
            type={add.type}
            txn={add.txn}
            onClose={() => setAdd(null)}
          />
        ) : null}

        {toast ? (
          <div className="fixed inset-x-0 bottom-0 z-[60] mx-auto max-w-app px-4 pb-[92px] pointer-events-none">
            <div className="pointer-events-auto bg-ink text-white rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-lg anim-toast">
              <span className="text-[13px]">{toast.text}</span>
              {toast.actionLabel ? (
                <button
                  type="button"
                  className="text-[13px] font-bold text-white underline shrink-0"
                  onClick={() => {
                    if (toast.onAction) toast.onAction();
                    dismissToast();
                  }}
                >
                  {toast.actionLabel}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
