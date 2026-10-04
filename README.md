# मेरो हिसाब — MeroHisab

**मेरो पैसा, मेरो हिसाब।** / *Know where your money goes.*

A mobile-first, installable single-page budget tracker built for Nepal: Nepali (BS) & Gregorian (AD) calendars, रु currency with lakh grouping (Devanagari numerals optional), Nepali/English UI, offline-first local storage, budgets, savings goals, and seven plain-language money lessons.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:5173  (fastest way to look at it)
```

Production build + local preview (this is what the smoke test drives):

```bash
npm run build
npm run preview    # http://localhost:4173  (serves the built, service-worker-enabled app)
```

**Live:** https://merohisab.vercel.app (Vercel, project `merohisab`)

Deploy: the build is fully static — publish the `dist/` folder to any static host (Netlify, Vercel, GitHub Pages, nginx…). The Vite `base` is `./`, so it works from a subdirectory too.

Re-deploy after a change:

```bash
npm run build && npm run deploy   # `vercel deploy --prod --yes dist`
```

### Optional: headless smoke test

```bash
npm run build
npm run preview &          # must be running on port 4173
npm test                   # drives the app in Brave, screenshots to /tmp/merohisab-shots
```

Requires `/Applications/Brave Browser.app` (used via `puppeteer-core`, a devDependency only).

---

## What's inside

| Area | Files |
| --- | --- |
| State & persistence (localStorage, undo toasts, PIN lock) | `src/store.jsx` |
| UI strings (nepali/english tuple pairs) | `src/i18n.js` |
| BS↔AD date math, period keys, month names | `src/lib/dates.js` |
| Currency: lakh grouping, Devanagari digits, parsing | `src/lib/currency.js` |
| Backup / restore (CSV & JSON export + import) | `src/lib/backup.js` |
| Demo month data | `src/data/seed.js` |
| Screens: Home, Records, Budget, Savings, More, Categories, Sikau | `src/screens/` |
| Sheets & primitives: AddSheet, LockScreen, Onboarding, UI kit | `src/components/` |
| PWA manifest, icons, offline precache | `vite.config.js`, `public/icons/` |

**Notes**

- All data lives in `localStorage` under one key (`merohisab.v1`) — nothing ever leaves the device. "Clear demo data" / "Delete all data" are in **More**.
- Periods are stored as `bs:2083-05` or `ad:2026-10`, so switching the date system keeps your records intact.
- Lock screen PIN is a salted SHA-256 hash (Web Crypto, with a deterministic fallback), stored locally only.
