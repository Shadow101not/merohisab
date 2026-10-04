import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { loadJSON, saveJSON, removeKey } from './lib/storage';
import { DEFAULT_LANG, makeT } from './i18n';
import { buildCats, baseIncomeCats } from './data/categories';
import { buildDemo } from './data/seed';
import { todayISO } from './lib/dates';
import { uid } from './lib/ids';
import { sha256hex } from './lib/hash';

const KEY = 'merohisab.v1';

export const DEFAULTS = {
  v: 1,
  lang: DEFAULT_LANG,
  system: 'bs',
  numerals: 'latin',
  mode: 'personal',
  onboarded: false,
  pinHash: null,
  cats: [],
  txns: [],
  budgets: {},
  goals: [],
  lastPay: 'Cash',
  demo: true,
  usage: [],
  feedback: { done: false, dismissed: false, answer: null },
  prefs: {}
};

function freshState({ withDemo = true, onboarded = true, mode = 'personal' } = {}) {
  const base = {
    ...DEFAULTS,
    mode,
    cats: buildCats(mode),
    onboarded,
    usage: [todayISO()],
    txns: [],
    budgets: {},
    goals: [],
    demo: false
  };
  if (withDemo) {
    const demo = buildDemo(todayISO());
    return { ...base, ...demo, demo: true };
  }
  return base;
}

function loadState() {
  const saved = loadJSON(KEY, null);
  if (!saved || typeof saved !== 'object' || !Array.isArray(saved.cats)) {
    return freshState({ withDemo: true, onboarded: false });
  }
  const s = { ...DEFAULTS, ...saved };
  s.usage = Array.isArray(s.usage) ? s.usage : [];
  s.feedback = { ...DEFAULTS.feedback, ...(saved.feedback || {}) };
  s.prefs = saved.prefs && typeof saved.prefs === 'object' ? saved.prefs : {};
  if (!s.cats.length) s.cats = buildCats(s.mode);
  if (!s.cats.some((c) => c.kind === 'income')) {
    s.cats = [...s.cats, ...baseIncomeCats()];
  }
  return s;
}

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(loadState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [toast, setToast] = useState(null);
  const [locked, setLocked] = useState(() => {
    const saved = loadJSON(KEY, null);
    return Boolean(saved && saved.pinHash);
  });
  const toastTimer = useRef(null);

  useEffect(() => {
    saveJSON(KEY, state);
  }, [state]);

  // Mark the day as "used" so the feedback card can appear after 30 days.
  useEffect(() => {
    const today = todayISO();
    setState((s) =>
      s.usage && s.usage[s.usage.length - 1] === today
        ? s
        : { ...s, usage: [...(s.usage || []), today].slice(-400) }
    );
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const notify = useCallback((text, opts = {}) => {
    clearTimeout(toastTimer.current);
    setToast({ text, ...opts, id: Date.now() });
    if (!opts.actionLabel) {
      toastTimer.current = setTimeout(() => setToast(null), 3200);
    }
  }, []);

  const update = useCallback((fn) => setState((s) => fn(s)), []);

  const actions = useMemo(
    () => ({
      update,
      patch: (p) => update((s) => ({ ...s, ...p })),
      setLang: (lang) => update((s) => ({ ...s, lang })),
      setSystem: (system) => update((s) => ({ ...s, system })),
      setNumerals: (numerals) => update((s) => ({ ...s, numerals })),
      setMode: (mode) => update((s) => ({ ...s, mode })),
      finishOnboarding: (prefs = {}) =>
        update((s) => ({ ...s, onboarded: true, prefs: { ...s.prefs, ...prefs } })),

      addTxn: (txn) =>
        update((s) => ({
          ...s,
          lastPay: txn.pay || s.lastPay,
          txns: [{ id: uid('t'), ...txn }, ...s.txns]
        })),
      updateTxn: (txn) =>
        update((s) => ({
          ...s,
          lastPay: txn.pay || s.lastPay,
          txns: s.txns.map((t) => (t.id === txn.id ? { ...t, ...txn } : t))
        })),
      // Returns the removed record so the caller can offer "undo".
      removeTxn: (id) => {
        const gone = stateRef.current.txns.find((t) => t.id === id) || null;
        if (gone) update((s) => ({ ...s, txns: s.txns.filter((t) => t.id !== id) }));
        return gone;
      },
      restoreTxn: (txn) =>
        update((s) => ({
          ...s,
          txns: s.txns.some((t) => t.id === txn.id) ? s.txns : [txn, ...s.txns]
        })),

      setBudget: (period, value) =>
        update((s) => ({
          ...s,
          budgets: { ...s.budgets, [period]: { total: 0, cats: {}, ...(s.budgets[period] || {}), ...value } }
        })),
      setBudgetLimit: (period, catId, amount) =>
        update((s) => {
          const current = { total: 0, cats: {}, ...(s.budgets[period] || {}) };
          const cats = { ...current.cats };
          if (!amount) delete cats[catId];
          else cats[catId] = amount;
          return { ...s, budgets: { ...s.budgets, [period]: { ...current, cats } } };
        }),
      removeBudget: (period) =>
        update((s) => {
          const budgets = { ...s.budgets };
          delete budgets[period];
          return { ...s, budgets };
        }),

      addGoal: (goal) =>
        update((s) => ({ ...s, goals: [...s.goals, { id: uid('g'), parts: [], ...goal }] })),
      addSaving: (goalId, amount, date = todayISO()) =>
        update((s) => ({
          ...s,
          goals: s.goals.map((g) =>
            g.id === goalId
              ? { ...g, parts: [...(g.parts || []), { id: uid('c'), amount, date }] }
              : g
          )
        })),
      removeGoal: (goalId) =>
        update((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== goalId) })),

      addCat: (cat) =>
        update((s) => ({
          ...s,
          cats: [
            ...s.cats,
            { id: uid('c'), emoji: '⭐', group: 'other', kind: 'expense', hidden: false, custom: true, ...cat }
          ]
        })),
      updateCat: (id, patchCat) =>
        update((s) => ({ ...s, cats: s.cats.map((c) => (c.id === id ? { ...c, ...patchCat } : c)) })),
      removeCat: (id) => update((s) => ({ ...s, cats: s.cats.filter((c) => c.id !== id) })),

      setPinHash: (pinHash) => update((s) => ({ ...s, pinHash })),
      clearPin: () => update((s) => ({ ...s, pinHash: null })),

      setFeedback: (feedback) => update((s) => ({ ...s, feedback: { ...s.feedback, ...feedback } })),

      clearDemo: () =>
        update((s) => ({ ...s, txns: [], budgets: {}, goals: [], demo: false })),
      deleteAll: () => setState(() => freshState({ withDemo: false, onboarded: true, mode: 'personal' })),
      importState: (next) => setState(() => ({ ...DEFAULTS, ...next, usage: [todayISO()] })),
      resetAll: () => {
        removeKey(KEY);
        setState(() => freshState({ withDemo: true, onboarded: false }));
      }
    }),
    [update]
  );

  const t = useMemo(() => makeT(state.lang), [state.lang]);

  const unlock = useCallback(
    async (pin) => {
      const hash = await sha256hex(pin);
      if (state.pinHash && hash === state.pinHash) {
        setLocked(false);
        return true;
      }
      return false;
    },
    [state.pinHash]
  );

  const lock = useCallback(() => setLocked(Boolean(state.pinHash)), [state.pinHash]);

  const value = useMemo(
    () => ({
      state,
      setState,
      t,
      lang: state.lang,
      deva: state.numerals === 'deva',
      familyMode: state.mode === 'family',
      toast,
      notify,
      dismissToast: () => setToast(null),
      actions,
      locked,
      setLocked,
      unlock,
      lock
    }),
    [state, t, toast, notify, actions, locked, unlock, lock]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
