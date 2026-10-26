// First-time setup checks: the compact timezone dropdown, the ten questions and the plan review.
const { chromium, devices } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const DIST = path.join(__dirname, '..', 'dist');
const OUT = process.argv[2] || path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const types = { '.json': 'application/json', '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let p = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html'; fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); });
const results = []; const ok = (n, cond, info) => { results.push([n, !!cond]); console.log((cond ? 'PASS ' : 'FAIL ') + n + (info ? ' — ' + info : '')); };
const URL0 = 'http://localhost:8770/';

(async () => {
  await new Promise((r) => srv.listen(8770, r));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const errors = [];
  const fresh = async (opts) => {
    const ctx = await browser.newContext({ ...devices['iPhone SE'], timezoneId: 'America/New_York', ...(opts || {}) });
    await ctx.addInitScript(() => { localStorage.setItem('__now', String(Date.parse('2026-10-22T14:00:00Z'))); window.__oneDayNow = Date.parse('2026-10-22T14:00:00Z'); if (window.Notification) Notification.requestPermission = () => { window.__permAsked = true; return Promise.resolve('default'); }; });
    const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(URL0); await p.waitForTimeout(400);
    return p;
  };
  const H = (p) => ({
    st: (expr, arg) => p.evaluate(expr, arg),
    click: async (sel) => { await p.locator(sel).first().click(); await p.waitForTimeout(150); },
    pick: async (q, v) => { await p.locator(`[data-act="oqPick"][data-q="${q}"][data-v="${v}"]`).click(); await p.waitForTimeout(80); },
    next: async () => { await p.locator('[data-act="oqNext"]').click(); await p.waitForTimeout(120); },
    back: async () => { await p.locator('[data-act="oqBack"]').click(); await p.waitForTimeout(120); },
    count: (sel) => p.locator(sel).count(),
    unlock: async () => { if (await p.evaluate(() => LOCKED)) { await p.fill('#lkPin', '204816'); await p.locator('[data-act="lockTry"]').click(); await p.waitForFunction(() => !LOCKED, null, { timeout: 15000 }); await p.waitForTimeout(200); } },
    sel: (q) => p.locator(`[data-act="oqPick"][data-q="${q}"][aria-checked="true"]`).evaluateAll((els) => els.map((e) => e.dataset.v))
  });
  // A profile that has finished name, timezone and PIN, landing on question 1
  const atQuestions = async (p, lng) => {
    await p.evaluate(async (lng) => {
      S = defaultState(); Object.assign(S.settings, { welcomeDone: true, languageChosen: true, language: lng || 'en', name: 'Ana', onbStep: 2 });
      await flush(); await createPin('204816');
    }, lng);
    await p.reload(); await p.waitForTimeout(400); await H(p).unlock();
  };
  const answerAll = async (p, o) => {
    const h = H(p); o = Object.assign({ reason: 'putoff', obstacles: ['nextstep'], helps: ['small'], focus: 'money', result: 'bills', sec: null, time: '10', days: 'all', window: 'morning', checkin: '21:00' }, o || {});
    await h.pick('reason', o.reason); await h.next();
    for (const x of o.obstacles) await h.pick('obstacles', x); await h.next();
    for (const x of o.helps) await h.pick('helps', x); await h.next();
    await h.pick('focus', o.focus); await h.next();
    await h.pick('result', o.result); await h.next();
    if (o.sec) { await h.pick('secMode', 'add'); for (const x of o.sec) await h.pick('secondary', x); } else await h.pick('secMode', 'keep'); await h.next();
    await h.pick('time', o.time); await h.next();
    if (o.days === 'all') await h.click('[data-act="oqAllDays"]'); else for (const d of o.days) await h.pick('days', String(d)); await h.next();
    await h.pick('window', o.window); await h.next();
    await h.pick('checkin', o.checkin); await h.next();
  };

  /* ---------- Timezone dropdown and name ---------- */
  {
    const p = await fresh(); const h = H(p);
    await h.st(async () => { S = defaultState(); Object.assign(S.settings, { welcomeDone: true, languageChosen: true, language: 'en' }); await flush(); });
    await p.reload(); await p.waitForTimeout(400);
    ok('T1 Name starts empty for a new profile', (await p.inputValue('#suName')) === '');
    ok('T2 Closed dropdown shows only the selected zone, defaulting to Puerto Rico', (await p.locator('#suTzCur').innerText()).startsWith('Puerto Rico') && (await p.locator('#suTzOff').innerText()) === 'UTC−4' && !(await p.locator('#suTzPanel').isVisible()) && (await h.count('#suTz .tz-opt')) === 0 && (await p.getAttribute('#suTzBtn', 'aria-expanded')) === 'false');
    await p.screenshot({ path: path.join(OUT, 'o01-tz-closed.png') });
    await h.click('#suTzBtn');
    const box = await p.locator('#suTzList').boundingBox();
    ok('T3 Tapping opens a search box and a bounded, scrollable list', (await p.locator('#suTzPanel').isVisible()) && (await p.getAttribute('#suTzBtn', 'aria-expanded')) === 'true' && box.height <= 290 && (await h.st(() => { const l = document.getElementById('suTzList'); return l.scrollHeight > l.clientHeight && getComputedStyle(l).overflowY === 'auto'; })) && (await h.st(() => document.activeElement.id)) === 'suTzQ');
    await p.screenshot({ path: path.join(OUT, 'o02-tz-open.png') });
    await p.fill('#suTzQ', 'tokyo'); await p.waitForTimeout(120);
    const tk = await p.locator('#suTzList .tz-opt').allInnerTexts();
    ok('T4 Search by city shows place and current UTC offset', tk.length >= 1 && tk[0].includes('Tokyo') && tk[0].includes('UTC+9'), tk[0]);
    await p.fill('#suTzQ', 'Europe/Ber'); await p.waitForTimeout(120);
    ok('T5 Search by IANA id', (await p.locator('#suTzList .tz-opt').first().getAttribute('data-z')) === 'Europe/Berlin');
    await p.fill('#suTzQ', 'australia'); await p.waitForTimeout(120);
    ok('T6 Search by region', (await p.locator('#suTzList .tz-opt').count()) > 3);
    await p.fill('#suTzQ', 'new york'); await p.waitForTimeout(120);
    ok('T7 DST handled (New York in October is UTC−4)', (await p.locator('#suTzList .tz-opt').first().innerText()).includes('UTC−4'));
    await p.locator('#suTzList .tz-opt').first().click(); await p.waitForTimeout(150);
    ok('T8 Choosing a zone closes the dropdown and shows it', !(await p.locator('#suTzPanel').isVisible()) && (await p.locator('#suTzCur').innerText()).includes('New York') && (await h.st(() => SETUP_DRAFT.tz)) === 'America/New_York' && (await h.st(() => document.activeElement.id)) === 'suTzBtn');
    await h.click('#suTzBtn'); await p.locator('h1').click(); await p.waitForTimeout(120);
    ok('T9 Tapping outside closes it', !(await p.locator('#suTzPanel').isVisible()));
    await h.click('#suTzBtn'); await p.keyboard.press('Escape'); await p.waitForTimeout(120);
    ok('T10 Escape closes it and keeps the zone', !(await p.locator('#suTzPanel').isVisible()) && (await h.st(() => SETUP_DRAFT.tz)) === 'America/New_York');
    ok('T11 Every IANA zone is available', (await h.st(() => tzAll().length)) > 300);
    await h.click('#suTzBtn'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    ok('T12 Keyboard can pick a zone', !(await p.locator('#suTzPanel').isVisible()) && (await h.st(() => SETUP_DRAFT.tz)) !== 'America/New_York');
    await p.close();
  }

  /* ---------- The ten questions ---------- */
  {
    const p = await fresh(); const h = H(p);
    await atQuestions(p);
    ok('Q0 After the PIN and recovery code, question 1 of 10 opens', (await p.locator('.oq-count').textContent()) === 'Question 1 of 10' && (await h.count('[data-act="oqBack"]')) === 1 && (await h.count('[data-act="oqNext"]')) === 1);
    ok('Q0b Nothing preselected', (await h.count('[aria-checked="true"]')) === 0 && (await p.locator('.oq-kind').innerText()) === 'Select one');
    await p.screenshot({ path: path.join(OUT, 'o10-q1.png') });
    await h.next();
    ok('Q1a Continue needs an answer', (await p.locator('.oq-count').textContent()) === 'Question 1 of 10' && (await p.locator('#oqErr').innerText()).length > 0);
    await h.pick('reason', 'putoff'); await h.pick('reason', 'routine');
    ok('Q1b Single choice: picking another replaces it', (await h.sel('reason')).join() === 'routine' && (await h.st(() => S.settings.onb.reason)) === 'routine');
    await h.next();
    ok('Q2 Question 2 of 10, up to two', (await p.locator('.oq-count').textContent()) === 'Question 2 of 10' && (await p.locator('.oq-kind').innerText()) === 'Select up to two');
    await h.pick('obstacles', 'nextstep'); await h.pick('obstacles', 'toobig'); await h.pick('obstacles', 'forget');
    ok('Q2a A third obstacle is refused with a note', (await h.sel('obstacles')).join() === 'nextstep,toobig' && (await p.locator('#oqErr').innerText()).length > 0);
    await h.pick('obstacles', 'none');
    ok('Q2b “Nothing specific” clears the others', (await h.sel('obstacles')).join() === 'none');
    await h.pick('obstacles', 'energy');
    ok('Q2c Picking another clears “Nothing specific”', (await h.sel('obstacles')).join() === 'energy');
    await h.next();
    await h.pick('helps', 'small'); await h.pick('helps', 'unsure');
    ok('Q3 “Still figuring that out” is exclusive', (await h.sel('helps')).join() === 'unsure');
    await h.pick('helps', 'unsure'); await h.pick('helps', 'small'); await h.pick('helps', 'reminder');
    await h.next();
    const foc = await p.locator('[data-q="focus"]').allInnerTexts();
    ok('Q4 Fourteen focuses, none preselected, no “(suggested)”', foc.length === 14 && (await h.sel('focus')).length === 0 && !foc.join().includes('suggested') && (await p.locator('.oq-kind').innerText()) === 'Select exactly one');
    await p.screenshot({ path: path.join(OUT, 'o11-q4.png') });
    await h.pick('focus', 'fitness'); await h.next();
    const fr = await p.locator('[data-q="result"]').evaluateAll((e) => e.map((x) => x.dataset.v));
    ok('Q5 Results follow the main focus, plus “Help me choose”', fr.join() === 'routine,run,strength,mobility,help' && (await p.locator('text=For Fitness & movement').count()) === 1);
    await h.pick('result', 'run'); await h.back();
    await h.pick('focus', 'money'); await h.next();
    ok('Q5b Changing the main focus clears the old result', (await h.st(() => S.settings.onb.result)) == null && (await h.sel('result')).length === 0 && (await p.locator('[data-q="result"][data-v="spend"]').count()) === 1);
    await h.pick('result', 'help'); await h.next();
    ok('Q6 Secondary focus question has two choices and the note', (await p.locator('[data-q="secMode"]').count()) === 2 && (await p.locator('text=Your main focus gets priority. Secondary focuses can have smaller actions when there’s room.').count()) === 1 && (await h.count('[data-q="secondary"]')) === 0);
    await h.pick('secMode', 'add');
    ok('Q6a “Add” expands the list on the same screen, without the main focus', (await p.locator('.oq-count').textContent()) === 'Question 6 of 10' && (await h.count('[data-q="secondary"]')) === 13 && (await h.count('[data-q="secondary"][data-v="money"]')) === 0);
    await h.next();
    ok('Q6b Add with nothing chosen can’t continue', (await p.locator('.oq-count').textContent()) === 'Question 6 of 10');
    await h.pick('secondary', 'sleep'); await h.pick('secondary', 'home'); await h.pick('secondary', 'fun');
    ok('Q6c At most two secondary focuses', (await h.sel('secondary')).join() === 'sleep,home');
    await p.screenshot({ path: path.join(OUT, 'o12-q6.png') });
    // Making a secondary the main focus removes it from the secondaries
    for (let i = 0; i < 2; i++) await h.back();
    await h.pick('focus', 'sleep'); await h.next(); await h.pick('result', 'bedtime'); await h.next();
    ok('Q6d A secondary that becomes the main focus is dropped (no duplicates)', (await h.st(() => S.settings.onb.secondary.join())) === 'home' && (await h.count('[data-q="secondary"][data-v="sleep"]')) === 0);
    await h.pick('secondary', 'money'); await h.next();
    ok('Q7 Total time options and note', (await p.locator('[data-q="time"]').count()) === 8 && (await p.locator('text=This is your total time across goals, not the time for each goal.').count()) === 1);
    await h.pick('time', 'more');
    ok('Q7a “More than 60” says the amount is set in review', (await p.locator('text=You’ll set the exact amount when you review your plan.').count()) === 1);
    await h.pick('time', '15'); await h.next();
    await h.click('[data-act="oqAllDays"]');
    ok('Q8 “Select every day” picks all seven', (await h.sel('days')).length === 7);
    await h.pick('days', 'varies');
    ok('Q8a “My schedule changes” is exclusive', (await h.sel('days')).join() === 'varies');
    await h.pick('days', '1');
    ok('Q8b Picking a day clears it', (await h.sel('days')).join() === '1');
    await h.pick('days', '3'); await h.pick('days', '5'); await h.next();
    ok('Q9 Eight windows, labeled with the saved timezone', (await p.locator('[data-q="window"]').count()) === 8 && (await p.locator('text=Puerto Rico — Atlantic Standard Time').count()) === 1 && (await p.locator('text=not a notification').count()) === 1);
    await h.pick('window', 'evening'); await h.next();
    ok('Q10 Check-in times; reminder hidden until a time is chosen', (await p.locator('[data-q="checkin"]').count()) === 7 && (await h.count('#oqRemind')) === 0);
    await h.pick('checkin', 'custom');
    ok('Q10a “Choose another time” shows a time picker on the same screen, reminder unchecked', (await h.count('#oqCiTime')) === 1 && !(await p.isChecked('#oqRemind')) && (await p.locator('.oq-count').textContent()) === 'Question 10 of 10');
    await h.next();
    ok('Q10b A custom time is required', (await p.locator('.oq-count').textContent()) === 'Question 10 of 10');
    await p.fill('#oqCiTime', '19:30'); await p.dispatchEvent('#oqCiTime', 'change');
    await p.check('#oqRemind'); await p.waitForTimeout(100);
    ok('Q10c Opting in explains the delivery limits honestly; no permission prompt', (await p.locator('text=can show this reminder only while the app is open').count()) === 1 && (await h.st(() => !window.__permAsked && (typeof Notification === 'undefined' || Notification.permission !== 'granted'))));
    await p.screenshot({ path: path.join(OUT, 'o13-q10.png') });
    // Refresh keeps every answer
    await p.reload(); await p.waitForTimeout(400); await h.unlock();
    ok('Q11 Refresh keeps the step and the answers', (await p.locator('.oq-count').textContent()) === 'Question 10 of 10' && (await p.inputValue('#oqCiTime')) === '19:30' && (await p.isChecked('#oqRemind')));
    await p.selectOption('#onbLang', 'es'); await p.waitForTimeout(200);
    ok('Q12 Changing language keeps the answers', (await p.locator('.oq-count').textContent()) === 'Pregunta 10 de 10' && (await p.inputValue('#oqCiTime')) === '19:30' && (await h.sel('checkin')).join() === 'custom');
    await p.selectOption('#onbLang', 'en'); await p.waitForTimeout(200);
    for (let i = 0; i < 9; i++) await h.back();
    ok('Q13 Back walks all the way to question 1 with answers kept', (await p.locator('.oq-count').textContent()) === 'Question 1 of 10' && (await h.sel('reason')).join() === 'routine');
    await h.back();
    ok('Q13b Back from question 1 returns to name and timezone', (await h.count('#suName')) === 1 && (await p.inputValue('#suName')) === 'Ana');
    await h.click('[data-act="setupSave"]');
    ok('Q13c Continuing doesn’t ask for a PIN again', (await h.count('#psPin')) === 0 && (await p.locator('.oq-count').textContent()) === 'Question 1 of 10');
    for (let i = 0; i < 10; i++) await h.next();
    ok('Q14 Exactly ten numbered questions, then the review', (await h.count('#rvH')) === 1 && (await p.locator('#rvH').innerText()) === 'Your starting plan');
    await p.screenshot({ path: path.join(OUT, 'o20-review.png'), fullPage: true });

    /* ---------- Review ---------- */
    const rv = await p.locator('main').innerText();
    ok('R1 Review shows main focus, result, secondary, days, window, check-in and reminder', ['Sleep & rest', 'Establish a bedtime routine', 'Home & organization, Money & finances', '15 minutes', 'Evening, 5–8 PM', '7:30', 'Reminder on, while the app is open'].every((x) => rv.includes(x)), rv.replace(/\n/g, ' / ').slice(0, 400));
    const plan = await h.st(() => S.settings.onb.plan.actions.map((x) => [x.focus, x.minutes, x.days.join(''), x.accepted, !!x.secondary]));
    ok('R2 Main action fits the time, on the chosen days; secondaries optional and once a week', plan[0][0] === 'sleep' && plan[0][1] <= 15 && plan[0][2] === '135' && plan[0][3] && plan.slice(1).every((x) => !x[3] && x[4] && x[2].length === 1), JSON.stringify(plan));
    ok('R2b Nothing is scheduled yet', (await h.st(() => S.tasks.length)) === 0 && !(await h.st(() => S.settings.onboarded)));
    // Accept a secondary only when there's room
    const total0 = await p.locator('#rvTotal').innerText();
    await p.locator('.rv-act.off [data-act="rvToggle"]').first().click(); await p.waitForTimeout(120);
    const total1 = await p.locator('#rvTotal').innerText();
    ok('R3 Adding a secondary updates the planned total', total0 !== total1 && (await h.st(() => S.settings.onb.plan.actions.filter((x) => x.accepted).length)) === 2, total0 + ' → ' + total1);
    await p.locator('.rv-act').first().locator('[data-act="rvReplace"]').click(); await p.waitForTimeout(100);
    await p.locator('[data-act="rvSwap"]').first().click(); await p.waitForTimeout(120);
    ok('R4 Replace swaps the main action for another in the same focus', (await h.st(() => S.settings.onb.plan.actions[0].result)) !== 'bedtime' && (await h.st(() => S.settings.onb.result)) === (await h.st(() => S.settings.onb.plan.actions[0].result)));
    await p.locator('.rv-act').first().locator('[data-act="rvToggle"]').click(); await p.waitForTimeout(100);
    await p.locator('.rv-act:not(.off) [data-act="rvToggle"]').first().click(); await p.waitForTimeout(100);
    await h.click('[data-act="rvStart"]');
    ok('R5 A plan with every action removed can’t start', (await h.count('#rvH')) === 1 && (await p.locator('#oqErr').innerText()).length > 0);
    await p.locator('.rv-act').first().locator('[data-act="rvToggle"]').click(); await p.waitForTimeout(100);
    // Editing from the review comes back to it
    await p.locator('[data-act="rvEdit"][data-q="7"]').click(); await p.waitForTimeout(120);
    ok('R6 Edit opens that question', (await p.locator('.oq-count').textContent()) === 'Question 7 of 10');
    await h.pick('time', 'more'); await h.next();
    ok('R6b Continue returns to the review', (await h.count('#rvH')) === 1 && (await h.count('#rvMore')) === 1);
    await h.click('[data-act="rvStart"]');
    ok('R7 “More than 60” asks for the amount before starting', (await h.count('#rvH')) === 1 && (await p.locator('#oqErr').innerText()).includes('minutes'));
    await p.fill('#rvMore', '90'); await p.dispatchEvent('#rvMore', 'change'); await p.waitForTimeout(150);
    ok('R7b The amount is used for the plan', (await p.locator('#rvTotal').innerText()).includes('90 min'));
    ok('R8 Final button says “Start my first day”', (await p.locator('[data-act="rvStart"]').innerText()) === 'Start my first day');
    await h.click('[data-act="rvStart"]');
    const fin = await h.st(() => ({ on: S.settings.onboarded, v: S.settings.onbVersion, foci: S.settings.foci, fk: S.settings.focusKey, tasks: S.tasks.map((t) => [t.focus, t.area, t.versions[0].minutes, t.versions[0].days.join(''), t.versions[0].cue]), av: S.settings.availability, rem: S.settings.reminders, ci: S.settings.checkinTime, sp: S.settings.trackSpend, win: S.settings.preferredWindow }));
    ok('R9 Starting schedules only the accepted actions', fin.on && fin.v === 2 && fin.tasks.length === 1 && fin.tasks[0][0] === 'sleep' && fin.tasks[0][3] === '135' && fin.tasks[0][4] === 'Evening, 5–8 PM', JSON.stringify(fin));
    ok('R10 Settings follow the answers', fin.foci.join() === 'sleep,home,money' && fin.fk === 'sleep' && fin.av[1] === 90 && fin.av[2] == null && fin.ci === '19:30' && fin.rem === true && fin.sp === false && fin.win === 'evening', JSON.stringify(fin));
    const today = await p.locator('#main').textContent();
    ok('R11 Today shows the chosen focuses, and no spending record that wasn’t chosen', (await h.count('.tabbar')) === 1 && today.includes('Sleep & rest') && today.includes('Home & organization') && !(await h.st(() => itemsFor(today()).some((i) => i.kind === 'spend'))), today.replace(/\n/g, ' / ').slice(0, 1200));
    await p.screenshot({ path: path.join(OUT, 'o21-today.png'), fullPage: true });
    await p.close();
  }

  /* ---------- Plan logic ---------- */
  {
    const p = await fresh(); const h = H(p);
    await atQuestions(p);
    await answerAll(p, { obstacles: ['nextstep'], time: '10', focus: 'business', result: 'offer' });
    const a = await h.st(() => S.settings.onb.plan.actions[0]);
    ok('P1 Unclear next step + 10 minutes: a short, concrete action with a finish line', a.minutes <= 10 && a.title === 'Draft part of a simple offer' && a.finish.length > 10, JSON.stringify(a));
    ok('P1b The review explains why', (await p.locator('details.more').textContent()).length > 0);
    await p.locator('[data-act="rvEdit"][data-q="4"]').click(); await p.waitForTimeout(100);
    await h.pick('focus', 'fitness'); await h.next();
    ok('P2 Changing the main focus from the review asks for a new result', (await p.locator('.oq-count').textContent()) === 'Question 5 of 10');
    await h.pick('result', 'routine'); await h.next();
    await p.locator('[data-act="rvEdit"][data-q="8"]').click(); await p.waitForTimeout(100);
    await h.click('[data-act="oqAllDays"]'); await h.next();
    const f = await h.st(() => S.settings.onb.plan.actions[0].days);
    ok('P3 Movement days are spaced for recovery (never back to back)', f.length <= 4 && f.every((d) => !f.includes((d + 1) % 7)), f.join());
    ok('P3b No exercise program: the review says so', (await p.locator('details.more').textContent()).includes('doesn’t design exercise programs'));
    await p.locator('[data-act="rvEdit"][data-q="5"]').click(); await p.waitForTimeout(100);
    await h.pick('result', 'help'); await h.next();
    ok('P4 “Help me choose” gives a tentative suggestion', (await h.st(() => S.settings.onb.plan.actions[0].tentative)) === true && (await p.locator('text=Suggested starting action').count()) === 1);
    await p.locator('[data-act="rvEdit"][data-q="4"]').click(); await p.waitForTimeout(100);
    await h.pick('focus', 'money'); await h.next();
    ok('P4b “Help me choose” still fits a new focus, so Continue goes back to the review', (await h.count('#rvH')) === 1);
    await p.locator('[data-act="rvEdit"][data-q="5"]').click(); await p.waitForTimeout(100);
    await h.pick('result', 'spend'); await h.next();
    const s = await h.st(() => S.settings.onb.plan.actions[0]);
    ok('P5 Spending result: about 2 minutes a day, no money amounts', s.spend && s.minutes === 2 && s.days.length === 7 && !/\$|€|\d+\s*(dollars|USD)/.test(JSON.stringify(s)));
    await p.locator('[data-act="rvEdit"][data-q="10"]').click(); await p.waitForTimeout(100);
    await h.pick('checkin', 'ready');
    ok('P6 “When I’m ready” has no reminder option', (await h.count('#oqRemind')) === 0);
    await h.next(); await h.click('[data-act="rvStart"]');
    const fin = await h.st(() => [S.settings.onboarded, S.settings.trackSpend, S.settings.reminders, S.settings.checkinAnytime, S.tasks.length]);
    ok('P7 Spending-only plan: record enabled, no reminder, no automatic evening prompt', fin[0] && fin[1] === true && fin[2] === false && fin[3] === true && fin[4] === 0, fin.join());
    ok('P8 Today has the spending record and doesn’t push the check-in', (await h.st(() => itemsFor(today()).some((i) => i.kind === 'spend'))) && (await h.st(() => !featuredItem(itemsFor(today())) || !featuredItem(itemsFor(today())).checkin)));
    await p.close();
  }
  {
    const p = await fresh(); const h = H(p);
    await atQuestions(p);
    await answerAll(p, { obstacles: ['overcommit'], helps: ['flexible'], time: '5', focus: 'home', result: 'clutter', sec: ['learning'] });
    const pl = await h.st(() => S.settings.onb.plan.actions);
    ok('P9 Overcommitting + 5 minutes: plan stays within the time, no room for secondaries', pl.length === 1 && pl[0].minutes <= 5 && (await p.locator('text=No room left in your daily time').count()) === 1, JSON.stringify(pl.map((x) => x.minutes)));
    await p.close();
  }

  /* ---------- Every language covers every branch ---------- */
  {
    const p = await fresh(); const h = H(p);
    const gaps = await h.st(() => {
      const out = [];
      const walk = (en, other, pre, l) => { for (const k of Object.keys(en)) { if (!(k in other)) out.push(l + ':' + pre + k); else if (en[k] && typeof en[k] === 'object') walk(en[k], other[k], pre + k + '.', l); } };
      for (const l of ['es', 'it', 'fr']) walk(OQ.en, OQ[l], '', l);
      for (const f of FOCI) for (const r of FOCUS_RESULTS[f]) for (const l of ['en', 'es', 'it', 'fr']) if (!OQ[l].res[f] || !OQ[l].res[f][r] || OQ[l].res[f][r].length !== 3) out.push(l + ':res.' + f + '.' + r);
      for (const k of ['reason', 'obstacles', 'helps', 'window']) for (const v of OQ_OPTS[k]) for (const l of ['en', 'es', 'it', 'fr']) if (!OQ[l][k][v]) out.push(l + ':' + k + '.' + v);
      return out;
    });
    ok('L1 Every question, option, result and review string exists in all four languages', gaps.length === 0, gaps.slice(0, 6).join(', '));
    for (const lng of ['es', 'it', 'fr']) {
      await atQuestions(p, lng);
      const enTexts = await h.st((lng) => { const flat = (o) => (typeof o === 'string' ? [o] : Array.isArray(o) ? o.flatMap(flat) : o && typeof o === 'object' ? Object.values(o).flatMap(flat) : []); const tr = new Set(flat(OQ[lng])); return flat(OQ.en).filter((x) => x.length > 4 && !tr.has(x)); }, lng);
      const leaks = [];
      const look = async () => { const b = await p.evaluate(() => document.body.innerText); for (const x of enTexts) if (new RegExp('(^|[^\\p{L}])' + x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^\\p{L}])', 'u').test(b)) leaks.push(x); };
      const hh = H(p); const steps = [['reason', 'return'], ['obstacles', 'schedule'], ['helps', 'progress'], ['focus', 'learning'], ['result', 'help'], ['secMode', 'add'], ['time', 'more'], ['days', 'varies'], ['window', 'varies'], ['checkin', 'custom']];
      for (const [q, v] of steps) {
        await hh.pick(q, v); if (q === 'secMode') await hh.pick('secondary', 'fitness');
        if (q === 'checkin') { await p.fill('#oqCiTime', '20:15'); await p.dispatchEvent('#oqCiTime', 'change'); await p.check('#oqRemind'); await p.waitForTimeout(80); }
        await look(); await hh.next();
      }
      await look();
      await p.screenshot({ path: path.join(OUT, `o30-review-${lng}.png`), fullPage: true });
      const START = { es: 'Empezar mi primer día', it: 'Inizia il mio primo giorno', fr: 'Commencer ma première journée' }[lng];
      ok(`L2-${lng} Every screen and the review are in ${lng}`, leaks.length === 0 && (await p.locator('[data-act="rvStart"]').innerText()) === START, [...new Set(leaks)].slice(0, 4).join(' / '));
      await p.fill('#rvMore', '75'); await p.dispatchEvent('#rvMore', 'change'); await p.waitForTimeout(100);
      await hh.click('[data-act="rvStart"]');
      ok(`L3-${lng} The plan starts in ${lng}`, (await h.st(() => S.settings.onboarded && S.tasks.length === 1)), await h.st(() => JSON.stringify(S.tasks.map((t) => t.versions[0].title))));
    }
    await p.close();
  }

  ok('No script errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  const fails = results.filter((r) => !r[1]);
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
  await browser.close(); srv.close();
  process.exit(fails.length ? 1 : 0);
})();
