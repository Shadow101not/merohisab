/* Headless smoke test: drives the built app in Brave and reports console errors.
   Run: npm run build && node scripts/smoke.mjs  (preview server must be running) */
import puppeteer from 'puppeteer-core';

const URL = process.env.APP_URL || 'http://localhost:4173/';
const OUT = process.env.OUT_DIR || '/tmp/merohisab-shots';
const EXE = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';

const issues = [];
const log = (...a) => console.log(...a);

async function clickText(page, text, tag = 'button') {
  const ok = await page.evaluate(
    (needle, sel) => {
      // Prefer the open dialog so modal buttons win over the page behind them.
      const scope = document.querySelector('[role="dialog"]') || document;
      const els = [...scope.querySelectorAll(sel)];
      const el = els.find((e) => (e.textContent || '').replace(/\s+/g, ' ').includes(needle));
      if (el) {
        el.click();
        return true;
      }
      return false;
    },
    text,
    tag
  );
  if (!ok) issues.push(`click not found: "${text}"`);
  return ok;
}

async function closeSheet(page) {
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 300));
}

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  log(`  · shot ${name}`);
}

const state = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('merohisab.v1') || '{}'));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EXE,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  page.on('console', (m) => {
    if (m.type() === 'error') issues.push(`console.error: ${m.text()}`);
    if (m.type() === 'warning' && !/Download the React DevTools/i.test(m.text()))
      issues.push(`console.warn: ${m.text()}`);
  });
  page.on('pageerror', (e) => issues.push(`pageerror: ${e.message}`));
  let loads = 0;
  page.on('load', () => {
    loads += 1;
  });
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (!u.startsWith('data:')) issues.push(`requestfailed: ${u} ${r.failure()?.errorText || ''}`);
  });

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });

  // ---- Onboarding ----
  await new Promise((r) => setTimeout(r, 500));
  await shot(page, '01-onboarding-1');
  await clickText(page, 'अर्को');
  await new Promise((r) => setTimeout(r, 300));
  await shot(page, '02-onboarding-2');
  await clickText(page, 'परिवार');
  await clickText(page, 'अर्को');
  await new Promise((r) => setTimeout(r, 300));
  await shot(page, '03-onboarding-3');
  await clickText(page, 'सुरु गर्नुहोस्');
  await new Promise((r) => setTimeout(r, 700));
  await shot(page, '04-home');

  let s = await state(page);
  if (!s.onboarded) issues.push('onboarding did not finish');
  log(`  · txns after onboarding: ${(s.txns || []).length}, mode=${s.mode}`);

  // ---- FAB: add an expense ----
  await clickText(page, 'खर्च थप्नुहोस्');
  await new Promise((r) => setTimeout(r, 400));
  await shot(page, '05-add-sheet');
  await page.evaluate(() => {
    const input = document.querySelector('input[inputmode="decimal"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, '1234.5');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 200));
  await clickText(page, 'थप्नुहोस्', '[role="dialog"] button');
  await new Promise((r) => setTimeout(r, 600));
  s = await state(page);
  const added = (s.txns || []).find((t) => t.amount === 1234.5);
  if (!added) issues.push('expense was not added');
  else log(`  · added txn ${added.id} amount=${added.amount} cat=${added.cat}`);
  await closeSheet(page);
  await shot(page, '06-home-after-add');

  // ---- Tabs ----
  for (const [tab, name] of [
    ['हिसाब', '07-records'],
    ['बजेट', '08-budget'],
    ['बचत', '09-savings'],
    ['थप', '10-more']
  ]) {
    await clickText(page, tab, 'nav button');
    await new Promise((r) => setTimeout(r, 600));
    await shot(page, name);
  }

  // ---- Records: income tab + edit sheet ----
  await clickText(page, 'हिसाब', 'nav button');
  await new Promise((r) => setTimeout(r, 400));
  await clickText(page, 'आम्दानी');
  await new Promise((r) => setTimeout(r, 400));
  await shot(page, '11-records-income');
  const rowClicked = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('li button')];
    if (!rows.length) return false;
    rows[0].click();
    return true;
  });
  await new Promise((r) => setTimeout(r, 500));
  await shot(page, '12-edit-sheet');
  if (!rowClicked) issues.push('no record rows to open');
  await closeSheet(page);

  // ---- Budget: read status ----
  await clickText(page, 'बजेट', 'nav button');
  await new Promise((r) => setTimeout(r, 400));
  const budgetText = await page.evaluate(() => document.body.innerText.slice(0, 600));
  if (!/प्रयोग भयो|बढी खर्च भयो|बाँकी/.test(budgetText)) issues.push('budget status text missing');
  await shot(page, '13-budget-detail');

  // ---- Savings: add money ----
  await clickText(page, 'बचत', 'nav button');
  await new Promise((r) => setTimeout(r, 400));
  await clickText(page, 'रकम थप्नुहोस्');
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => {
    const input = document.querySelector('input[inputmode="decimal"][placeholder="1000"]');
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, '500');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await clickText(page, 'थप्नुहोस्');
  await new Promise((r) => setTimeout(r, 500));
  s = await state(page);
  const saved = (s.goals || []).reduce((n, g) => n + (g.parts || []).reduce((a, p) => a + p.amount, 0), 0);
  log(`  · goals total saved: ${saved}`);
  await shot(page, '14-savings-after');

  // ---- More: numerals toggle + categories + sikau ----
  await clickText(page, 'थप', 'nav button');
  await new Promise((r) => setTimeout(r, 400));
  await clickText(page, '०१२३');
  await new Promise((r) => setTimeout(r, 300));
  s = await state(page);
  if (s.numerals !== 'deva') issues.push('devanagari numeral toggle failed');
  await clickText(page, 'श्रेणी व्यवस्थापन');
  await new Promise((r) => setTimeout(r, 500));
  await shot(page, '15-categories');
  const hasBack1 = await page.evaluate(() => !!document.querySelector('button[aria-label="पछाडि"]'));
  if (!hasBack1) issues.push('categories back button missing');
  await clickText(page, '←');
  await new Promise((r) => setTimeout(r, 400));
  await clickText(page, 'सिक्ने');
  await new Promise((r) => setTimeout(r, 500));
  await shot(page, '16-sikau');
  const lessonCount = await page.evaluate(
    () => [...document.querySelectorAll('ol button')].length
  );
  if (lessonCount !== 7) issues.push(`expected 7 lessons, found ${lessonCount}`);
  await clickText(page, 'बजेट के हो');
  await new Promise((r) => setTimeout(r, 400));
  await shot(page, '17-lesson');
  await clickText(page, '←');
  await new Promise((r) => setTimeout(r, 300));
  await clickText(page, '←');
  await new Promise((r) => setTimeout(r, 400));

  // ---- PIN lock ----
  await clickText(page, 'थप', 'nav button');
  await new Promise((r) => setTimeout(r, 400));
  await clickText(page, 'पिन लक');
  await new Promise((r) => setTimeout(r, 400));
  await page.type('input[inputmode="numeric"]', '1234');
  await new Promise((r) => setTimeout(r, 400));
  await page.type('input[inputmode="numeric"]', '1234');
  await new Promise((r) => setTimeout(r, 700));
  s = await state(page);
  if (!s.pinHash) issues.push('pin was not saved');
  else log(`  · pinHash: ${s.pinHash.slice(0, 12)}...`);
  await shot(page, '18-more-after-pin');

  // ---- Reload → lock screen (keypad) ----
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 600));
  await shot(page, '19-locked');
  const hasKeypad = await page.evaluate(() =>
    [...document.querySelectorAll('button')].some((b) => b.textContent.trim() === '1')
  );
  if (!hasKeypad) issues.push('lock screen keypad missing after reload');
  for (const digit of ['1', '2', '3', '4']) {
    await clickText(page, digit, 'button');
    await new Promise((r) => setTimeout(r, 150));
  }
  await new Promise((r) => setTimeout(r, 900));
  await shot(page, '20-unlocked');
  const isLockedText = () =>
    page.evaluate(() => /लक भएको|is locked/i.test(document.body.innerText));
  if (await isLockedText()) issues.push('app did not unlock with the correct PIN');

  const navCount = () =>
    page.evaluate(() => performance.getEntriesByType('navigation').length);
  await page.evaluate(() => {
    window.__alive = 1;
  });
  log(`  · document loads so far: ${loads}`);
  await new Promise((r) => setTimeout(r, 2500));
  log(`  · still unlocked after 2.5s: ${!(await isLockedText())} (loads=${loads}, alive=${await page.evaluate(() => window.__alive === 1)})`);
  if (await isLockedText()) issues.push('app re-locked without user action');

  // ---- English + Gregorian ----
  await clickText(page, 'थप', 'nav button');
  await new Promise((r) => setTimeout(r, 400));
  await clickText(page, 'English');
  await new Promise((r) => setTimeout(r, 400));
  await clickText(page, 'Gregorian');
  await new Promise((r) => setTimeout(r, 400));
  await clickText(page, 'Home', 'nav button');
  await new Promise((r) => setTimeout(r, 600));
  await shot(page, '22-english-gregorian');
  s = await state(page);
  if (s.lang !== 'en' || s.system !== 'ad') issues.push('language/date-system switch failed');
  const homeText = await page.evaluate(() => document.body.innerText);
  if (!/October\s*[०-९0-9]{4}/.test(homeText)) issues.push('gregorian month title not shown');
  log('  · english + gregorian ok');

  // ---- Undo a deletion ----
  await clickText(page, 'Records', 'nav button');
  await new Promise((r) => setTimeout(r, 600));
  const beforeDelete = (await state(page)).txns.length;
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('li button')].find((b) =>
      ['Delete', 'मेटाउनुहोस्'].includes(b.textContent.trim())
    );
    if (btn) btn.click();
    return Boolean(btn);
  });
  await new Promise((r) => setTimeout(r, 600));
  const afterDelete = (await state(page)).txns.length;
  if (afterDelete !== beforeDelete - 1) issues.push(`delete did not remove a record (${beforeDelete}→${afterDelete})`);
  const undone = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) =>
      ['Undo', 'पूर्वावस्था'].includes(b.textContent.trim())
    );
    if (!btn) return false;
    btn.click();
    return true;
  });
  await new Promise((r) => setTimeout(r, 600));
  const afterUndo = (await state(page)).txns.length;
  if (!undone) issues.push('undo button missing');
  else if (afterUndo !== beforeDelete) issues.push(`undo did not restore (${beforeDelete}→${afterUndo})`);
  else log('  · delete + undo ok');
  await shot(page, '23-records-undo');

  // ---- Feedback card after 30 days ----
  await page.evaluate(() => {
    const key = 'merohisab.v1';
    const data = JSON.parse(localStorage.getItem(key));
    const days = [];
    for (let i = 0; i < 45; i += 1) {
      const d = new Date(Date.now() - i * 86400000);
      days.push(d.toISOString().slice(0, 10));
    }
    data.usage = days;
    data.feedback = { done: false, dismissed: false, answer: null };
    localStorage.setItem(key, JSON.stringify(data));
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));
  if (await isLockedText()) {
    for (const digit of ['1', '2', '3', '4']) {
      await clickText(page, digit, 'button');
      await new Promise((r) => setTimeout(r, 150));
    }
    await new Promise((r) => setTimeout(r, 700));
  }
  await new Promise((r) => setTimeout(r, 400));
  const feedbackShown = await page.evaluate(() =>
    document.body.innerText.includes('What was difficult about using MeroHisab?')
  );
  if (!feedbackShown) issues.push('feedback card did not appear after 30 days');
  await shot(page, '24-feedback');
  await clickText(page, 'Adding expenses');
  await clickText(page, 'Submit');
  await new Promise((r) => setTimeout(r, 500));
  const fb = (await state(page)).feedback;
  if (!fb.done || fb.answer !== 'fbAdding') issues.push('feedback not stored');
  else log('  · feedback card ok');

  // ---- Clear demo data ----
  await clickText(page, 'More', 'nav button');
  await new Promise((r) => setTimeout(r, 500));
  await clickText(page, 'Clear demo data');
  await new Promise((r) => setTimeout(r, 400));
  await shot(page, '25-clear-demo-confirm');
  await clickText(page, 'Clear demo data');
  await new Promise((r) => setTimeout(r, 700));
  s = await state(page);
  if ((s.txns || []).length !== 0 || s.demo !== false) issues.push('clear demo data failed');
  else log('  · clear demo ok');
  await clickText(page, 'Home', 'nav button');
  await new Promise((r) => setTimeout(r, 600));
  await shot(page, '26-empty-home');

  // ---- Desktop width ----
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 700));
  log(`  · desktop loads=${loads}`);
  // The viewport change restarts the renderer (fresh document) → app re-locks by design.
  if (await isLockedText()) {
    for (const digit of ['1', '2', '3', '4']) {
      await clickText(page, digit, 'button');
      await new Promise((r) => setTimeout(r, 150));
    }
    await new Promise((r) => setTimeout(r, 700));
    if (await isLockedText()) issues.push('desktop unlock failed');
  }
  await shot(page, '21-desktop');

  await browser.close();

  log('\n=== RESULT ===');
  if (issues.length) {
    log(`${issues.length} issue(s):`);
    issues.forEach((i) => log(' - ' + i));
    process.exitCode = 1;
  } else {
    log('no console errors or failed interactions 🎉');
  }
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
