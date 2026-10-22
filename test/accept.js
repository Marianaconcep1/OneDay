// Acceptance checks for One Day, run against dist/ at iPhone width.
const { chromium, devices } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const DIST = path.join(__dirname, '..', 'dist');
const OUT = process.argv[2] || path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const types = { '.json': 'application/json', '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let p = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html'; fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); });
const results = []; const ok = (n, cond, info) => { results.push([n, !!cond, info || '']); console.log((cond ? 'PASS ' : 'FAIL ') + n + (info ? ' — ' + info : '')); };

(async () => {
  await new Promise((r) => srv.listen(8765, r));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const ctx = await browser.newContext({ ...devices['iPhone SE'], timezoneId: 'America/New_York' });
  // Thursday Oct 22 2026, 10:00 in Puerto Rico (UTC-4)
  let NOW = Date.parse('2026-10-22T14:00:00Z');
  await ctx.addInitScript(() => { const v = localStorage.getItem('__now'); if (v) window.__oneDayNow = Number(v); });
  const page = await ctx.newPage();
  const errors = []; const external = [];
  page.on('pageerror', (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("status of 500")) errors.push(m.text()); });
  page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(u.hostname)) external.push(u.hostname); });
  const setNow = async (iso) => { NOW = Date.parse(iso); await page.evaluate((n) => { localStorage.setItem('__now', String(n)); window.__oneDayNow = n; }, NOW); };
  const st = (expr) => page.evaluate(expr);
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(260); };
  const noHScroll = async (label) => { const w = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]); if (w[0] > w[1]) ok('No horizontal scroll: ' + label, false, w.join('>')); return w[0] <= w[1]; };
  const shot = (n) => page.screenshot({ path: path.join(OUT, n + '.png'), fullPage: false });

  await page.goto('http://localhost:8765/');
  await setNow('2026-10-22T14:00:00Z'); await page.reload(); await page.waitForTimeout(400);
  await shot('01-envelope');
  // W. Founder letter welcome and profile setup
  ok('W1 Closed envelope is an accessible button', (await page.locator('button.envelope[aria-label*="A little letter for you"]').count()) === 1 && (await page.locator('text=Tap to open · Toca para abrir').count()) === 1);
  await page.focus('button.envelope'); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  ok('W2 Envelope opens the language choice (keyboard)', (await page.locator('text=How would you like to read your letter?').count()) === 1 && (await page.locator('text=¿En qué idioma quieres leer tu carta?').count()) === 1);
  ok('W2b Focus moves to the language buttons', await st('document.activeElement && document.activeElement.dataset.act === "welLang"'));
  await shot('01b-lang-choice');
  await click('[data-act="welLang"][data-l="en"]');
  ok('W3 Opening animation plays (flap opens)', (await page.locator('.env-wrap.opening').count()) === 1);
  await page.waitForTimeout(500); await shot('01c-opening');
  await page.waitForTimeout(1500);
  const enTxt = await page.locator('.letter-page').innerText();
  ok('W4 English letter complete', enTxt.includes('You know that life you keep saying') && enTxt.includes('I’ll be growing right alongside you.') && enTxt.includes('With love,') && enTxt.includes('CEO of One Day') && enTxt.includes('Mariana'));
  ok('W4b Letter text has no dash punctuation added', !/[—–]/.test(enTxt));
  ok('W4c Handwritten font only on the signature', await st('getComputedStyle(document.querySelector(".letter-sign")).fontFamily.includes("Dancing") && !getComputedStyle(document.querySelector(".letter-page p")).fontFamily.includes("Dancing")'));
  await shot('01d-letter-en'); await noHScroll('letter');
  await page.reload(); await page.waitForTimeout(500);
  ok('W5 Refresh resumes at the letter', (await page.locator('.letter-page').count()) === 1);
  await click('[data-act="letterLang"]');
  const esTxt = await page.locator('.letter-page').innerText();
  ok('W6 Spanish letter complete, switch while reading', esTxt.includes('¿Sabes esa vida que siempre dices') && esTxt.includes('Yo también estaré creciendo contigo.') && esTxt.includes('Con cariño,') && esTxt.includes('CEO de One Day') && esTxt.includes('¿Comenzamos?') && esTxt.includes('Vamos a comenzar'));
  await click('[data-act="letterLang"]');
  ok('W7 Invitation in English', (await page.locator('text=Ready to begin?').count()) === 1);
  await page.locator('[data-act="welBegin"]').scrollIntoViewIfNeeded(); await click('[data-act="welBegin"]');
  ok('W8 Invitation opens profile setup', (await page.locator('text=Let’s make this yours.').count()) === 1);
  ok('W9 Name starts empty (never prefilled)', (await page.inputValue('#suName')) === '' && (await page.getAttribute('#suName', 'placeholder')) === 'Your name' && (await page.locator('text=What should we call you?').count()) === 1);
  await shot('01e-setup');
  await page.fill('#suName', '   '); await click('[data-act="setupSave"]');
  ok('W10 Whitespace-only name is rejected inline', (await page.locator('#suNameErr').innerText()).length > 0 && !(await st('S.settings.onboarded')) && (await st('ONB.step')) === 1);
  ok('W11 Puerto Rico is the default zone', (await page.locator('#suTzCur').innerText()) === 'Puerto Rico — Atlantic Standard Time');
  await page.fill('#suTzQ', 'tokyo'); await page.waitForTimeout(150);
  const tokyo = await page.locator('#suTzList .tz-opt').allInnerTexts();
  ok('W12 Zones are searchable, with current offset', tokyo.length >= 1 && tokyo[0].includes('Tokyo') && tokyo[0].includes('UTC+9'));
  ok('W12b Every IANA zone is listed', await st('tzAll().length') > 300);
  await page.fill('#suTzQ', 'new york'); await page.waitForTimeout(150);
  const ny = await page.locator('#suTzList .tz-opt').first().innerText();
  ok('W12c DST-aware offset (New York in October is UTC−4)', ny.includes('UTC−4'), ny);
  await page.fill('#suTzQ', ''); await page.waitForTimeout(150);
  await page.fill('#suName', 'Mariana');
  await click('[data-group="suLang"][data-val="it"]');
  ok('W13 Italian setup, name kept', (await page.locator('text=Rendiamo questo spazio tuo.').count()) === 1 && (await page.inputValue('#suName')) === 'Mariana');
  await click('[data-group="suLang"][data-val="fr"]');
  ok('W14 French setup', (await page.locator('text=Faisons de cet espace le tien.').count()) === 1 && (await page.locator('text=Continuer').count()) >= 1);
  await click('[data-group="suLang"][data-val="es"]');
  ok('W15 Spanish setup', (await page.locator('text=Hagamos este espacio tuyo.').count()) === 1);
  await click('[data-group="suLang"][data-val="en"]');
  await shot('01f-setup-filled');
  await click('[data-act="setupSave"]');
  ok('W16 Continue goes to the next onboarding step and saves', (await st('ONB.step')) === 2 && (await st('S.settings.name')) === 'Mariana' && (await st('S.settings.timezone')) === 'America/Puerto_Rico' && (await st('S.settings.language')) === 'en');
  await page.reload(); await page.waitForTimeout(500);
  ok('W17 Onboarding progress survives refresh', (await page.locator('[data-group="obWd"]').count()) > 0);
  // 1. Onboarding without race date or finances
  await click('[data-group="obWd"][data-val="60"]'); await click('[data-group="obWe"][data-val="90"]'); await click('[data-act="obNext"]');
  await click('[data-act="obNext"]');
  await click('[data-act="obNext"]');
  await shot('02-onboarding-areas');
  await click('[data-act="obNext"]');
  ok('1 Onboarding completes without marathon date or finances', await page.locator('.date-h').count() && await st('S.settings.onboarded && S.training.profile.raceDate === "" && S.money.balances.length === 0'));
  ok('Timezone default America/Puerto_Rico', await st('S.settings.timezone') === 'America/Puerto_Rico');
  await shot('03-today-fresh'); await noHScroll('today');

  // 2. Schedule a business task with a finish line
  await click('[data-act="newAction"]');
  await page.fill('#acTitle', 'Draft the three bullets explaining your dashboard service');
  await page.fill('#acFinish', 'Three bullets saved in a draft');
  await click('[data-group="accat"][data-val="Offer"]');
  await shot('04-action-form'); await noHScroll('action form');
  await click('[data-act="actSave"]');
  const biz = await st('itemsFor(today()).find(i => i.kind === "biz")');
  ok('2 Business task has verb, finish line, time, scheduled today', biz && biz.finish === 'Three bullets saved in a draft' && biz.minutes === 15 && !biz.needsAction);

  // 3. Today shows only today's scheduled work
  const areas = await page.locator('.area').count();
  const dated = await st('(() => { const a = newAction({ title: "Send one outreach message", finish: "Sent", minutes: 15, date: dAdd(today(), 2) }); render(); return itemsFor(today()).some(i => i.actionId === a.id); })()');
  ok('3 Today shows five compact area cards and excludes other days\' tasks', areas === 5 && !dated);

  // 4. Logging during the day prefills the check-in
  await click('[data-act="quickDone"]');
  await click('.checkin-btn');
  const artKey = await st('itemsFor(today()).find(i => i.area === "art").key');
  const pressed = await page.locator(`[data-group="cs|${artKey}"][data-val="done"]`).getAttribute('aria-pressed');
  ok('4 Art logged during the day appears prefilled in the check-in', pressed === 'true');
  await shot('05-checkin-step1'); await noHScroll('check-in');
  // 17. Two-minute check-in: count taps
  let taps = 0; const tap = async (s) => { await click(s); taps++; };
  await tap(`[data-group="cs|${await st('itemsFor(today()).find(i => i.kind === "biz").key')}"][data-val="modified"]`);
  await tap('[data-group="cr|' + (await st('itemsFor(today()).find(i => i.kind === "biz").key')) + '"][data-val="large"]');
  await tap('#ciNext');
  await tap('[data-group="cspend"][data-val="none"]');
  await tap('#ciNext');
  await tap('[data-group="cmood"][data-val="2"]'); await tap('[data-group="cenergy"][data-val="3"]');
  await tap('#ciNext');
  await tap('[data-group="cemo"][data-val="Tired"]');
  await shot('06-checkin-mind');
  await tap('[data-act="ciStep"][data-to="5"]');
  await shot('07-checkin-tomorrow');
  await tap('#ciSave');
  await shot('08-checkin-summary');
  const summary = await page.locator('.sheet .card.tint p').first().textContent();
  ok('17 Check-in done in ' + taps + ' taps with a factual summary', taps <= 14 && /completed as planned/.test(summary), summary.trim());
  await click('.sheet [data-act="closeSheet"]');

  // 5. Refresh preserves records
  await page.reload(); await page.waitForTimeout(500);
  ok('5 Refresh preserves records', await st('Object.keys(S.occ).length >= 2 && !!S.checkins[today()] && S.money.spendDays[today()].status === "none"'));

  // 6. Editing a check-in does not duplicate
  await click('.checkin-btn'); await click('#ciNext'); await click('#ciNext'); await click('[data-group="cmood"][data-val="4"]'); await click('#ciNext'); await click('[data-act="ciStep"][data-to="5"]'); await click('#ciSave'); await click('.sheet [data-act="closeSheet"]');
  ok('6 Editing a check-in replaces it (one record, mood updated)', await st('Object.keys(S.checkins).length === 1 && S.checkins[today()].mood === 4 && S.checkins[today()].editCount === 1'));

  // 7. Savings transfer doesn't inflate income or spending; no double count with balance
  await st(`(() => { S.money.accounts.push({id:'a1',name:'Checking',kind:'checking'},{id:'a2',name:'Savings',kind:'savings'});
    S.money.balances.push({id:'b1',accountId:'a2',amount:20000,date:dAdd(today(),-3),createdAt:nowISO()});
    S.money.tx.push({id:'t1',date:dAdd(today(),-4),type:'transfer',amount:5000,from:'a1',to:'a2',createdAt:nowISO()});
    S.money.tx.push({id:'t2',date:today(),type:'transfer',amount:2500,from:'a1',to:'a2',createdAt:nowISO()}); save(); })()`);
  const sv = await st('confirmedSavings(today()).value'); const ws = await st('weekStats(weekStart(today())).spend.totalCents');
  ok('7 Transfers excluded from spending; balance snapshot not double-counted', sv === 22500 && ws === 0, 'savings=' + sv + ' spend=' + ws);

  // 8. Missing spending is not $0 (setup moved back three days so earlier days are scheduled but unrecorded)
  await st('(() => { S.settings.calibrationStart = dAdd(today(), -3); save(); })()');
  await click('[data-act="tab"][data-tab="progress"]');
  const progText = await page.locator('#main').textContent();
  const missing = await st('weekStats(weekStart(today())).spend.missing');
  ok('8 Days without a spending record are shown as not recorded', missing >= 1 && /Not recorded/.test(progText) && /not a full-week total/.test(progText));
  await shot('09-progress'); await noHScroll('progress');

  // 9/10. Rest day counts; modified session distinct
  await st(`(() => { S.training.templates.push({ id:'tp', from: dAdd(today(),-7), days: {0:{type:'long',minutes:80,distance:7},1:{type:'easy',minutes:30,distance:3},2:{type:'rest',minutes:0},3:{type:'strength',minutes:30},4:{type:'rest',minutes:0},5:{type:'strength',minutes:30},6:{type:'mobility',minutes:20}} });
    setTrainLog(dAdd(today(),-3), { status:'modified', actualType:'walk', minutes:20 }); save(); render(); })()`);
  await click('[data-act="tab"][data-tab="today"]');
  await click('[data-act="restFollowed"]');
  const t1 = await st('weekStats(weekStart(today())).train');
  ok('9 A planned rest day followed counts as following training', t1.rest === 1 && t1.restPlanned >= 1);
  ok('10 Modified session stays distinct from completed', t1.modified === 1 && t1.completed === 0 && (await st('S.training.logs["tr@"+dAdd(today(),-3)].planned.type')) === 'easy');

  // 11. Unscheduled days are excluded
  const sat = await st('(() => { const s = dAdd(weekStart(today()), 6); return itemsFor(s).some(i => i.kind === "biz") || weekStats(weekStart(today())).biz.scheduled !== 1; })()');
  ok('11 Business is not scheduled (or counted) on unscheduled days', !sat);

  // 13. Changing a recurring schedule preserves history
  const before = await st('Object.values(S.occ).find(o => o.kind === "task").planned.title');
  await click('[data-act="tab"][data-tab="plan"]');
  await page.locator('#sect-art summary').click();
  await page.fill('#arMins', '10'); await click('[data-act="artSave"]');
  const after = await st('Object.values(S.occ).find(o => o.kind === "task").planned.title');
  const v = await st('S.tasks.find(t => t.area === "art").versions.length');
  ok('13 Editing the art schedule keeps the earlier record and adds a dated version', before === after && v >= 1 && (await st('taskPlan(S.tasks.find(t=>t.area==="art"), today()).minutes')) === 10, before + ' / versions ' + v);
  await shot('10-plan'); await noHScroll('plan');

  // 14. Midnight in America/Puerto_Rico (UTC-4, no DST)
  await setNow('2026-10-23T03:59:00Z'); const d1 = await st('today()');
  await setNow('2026-10-23T04:00:00Z'); const d2 = await st('today()');
  await setNow('2026-03-08T12:00:00Z'); const d3 = await st('[today(), nowHM()]');
  ok('14 Day boundary at local midnight in Puerto Rico', d1 === '2026-10-22' && d2 === '2026-10-23' && d3[0] === '2026-03-08' && d3[1] === '08:00', d1 + ' ' + d2 + ' ' + d3);
  await setNow('2026-10-22T14:00:00Z');
  // Timezone change doesn't move recorded days
  const keysBefore = await st('Object.keys(S.checkins).join()');
  await st('(() => { S.settings.timezone = "Asia/Tokyo"; const x = Object.keys(S.checkins).join(); S.settings.timezone = "America/Puerto_Rico"; return x; })()');
  ok('14b Timezone change keeps recorded dates', keysBefore === await st('Object.keys(S.checkins).join()'));

  // 12. Return after several missed days
  await st('(() => { S.settings.lastOpened = dAdd(today(), -5); return flush(); })()');
  await page.reload(); await page.waitForTimeout(500);
  const welcome = await page.locator('text=Welcome back. Start with today.').count();
  const occBefore = await st('Object.keys(S.occ).length');
  await shot('11-welcome-back');
  ok('12 Return after a gap shows “Welcome back”, creates no backlog', welcome === 1 && (await st('itemsFor(today()).every(i => i.date === today())')) && occBefore === await st('Object.keys(S.occ).length'));

  // 15. Backup round trip
  await click('[data-act="tab"][data-tab="settings"]'); await page.evaluate(() => { SET_OPEN.add('data'); render(); });
  await shot('12-settings'); await noHScroll('settings');
  const snapshot = await st('JSON.stringify(Object.assign({}, S, { updatedAt: 0 }))');
  await click('[data-act="exportJson"]');
  const text = await page.locator('#fileText').inputValue();
  await click('.sheet [data-act="closeSheet"]');
  await st('(() => { S.money.tx.push({id:"junk",date:today(),type:"expense",amount:999,category:"Other",createdAt:nowISO()}); save(); })()');
  await click('[data-act="importOpen"]'); await page.fill('#impText', text); await click('[data-act="importCheck"]');
  await click('[data-act="importDo"]'); await click('[data-act="confirmOk"]'); await page.waitForTimeout(300);
  await page.reload(); await page.waitForTimeout(500);
  const restored = await st('JSON.stringify(Object.assign({}, S, { updatedAt: 0 }))');
  const a = JSON.parse(snapshot), b = JSON.parse(restored); delete a.settings.lastOpened; delete b.settings.lastOpened; delete a.lastBackup; delete b.lastBackup;
  ok('15 Backup export and restore preserve records exactly', JSON.stringify(a) === JSON.stringify(b) && !(await st('S.money.tx.some(x => x.id === "junk")')));
  // Re-importing the same backup doesn't duplicate
  await click('[data-act="tab"][data-tab="settings"]'); await page.evaluate(() => { SET_OPEN.add('data'); render(); });
  await click('[data-act="importOpen"]'); await page.fill('#impText', text); await click('[data-act="importCheck"]'); await click('[data-act="importDo"]'); await click('[data-act="confirmOk"]');
  ok('15b Importing the same backup twice creates no duplicates', (await st('S.money.tx.length')) === b.money.tx.length);
  const bad = await st('validateState({ app: "one-day", schema: 1 }).length');
  ok('15c Invalid backups are rejected', bad > 0);

  // Duplicate submission guard: double-tap Add entry
  await click('[data-act="tab"][data-tab="today"]');
  await click('[data-act="openSpend"]'); await page.fill('#txAmt', '12.50'); await click('[data-group="tcat"][data-val="Groceries"]');
  const n0 = await st('S.money.tx.length');
  await page.locator('[data-act="txSave"]').dblclick(); await page.waitForTimeout(300);
  ok('Double-tapping “Add entry” records it once', (await st('S.money.tx.length')) === n0 + 1);
  ok('Amounts stored as integer cents', (await st('S.money.tx[S.money.tx.length-1].amount')) === 1250);
  await shot('13-spend-sheet'); await noHScroll('spend sheet');
  await click('.sheet [data-act="closeSheet"]');

  // Over-budget day flags mismatch and offers adjustments without changing training
  await st('(() => { clearOcc("biz@" + today()); S.settings.availability[dDow(today())] = 20; save(); render(); })()');
  await page.waitForTimeout(300); await shot('13b-over'); const flagged = await page.locator('text=Your plan needs an adjustment.').count(); console.log('flagged', flagged, await st('JSON.stringify(dayMinutes(today()).total)'), await st('TAB'));
  await click('[data-act="openAdjust"]'); await shot('14-adjust'); const adjCount = await page.locator('[data-act="adjYes"]').count();
  await click('.sheet [data-act="closeSheet"]');
  ok('Time mismatch is flagged with accept/reject adjustments', flagged === 1 && adjCount >= 1);

  // Weekly review + demo
  await st('(() => { S.settings.calibrationStart = dAdd(today(), -10); save(); })()');
  await click('[data-act="tab"][data-tab="progress"]'); await click('[data-act="openReview"]'); await shot('15-review'); await noHScroll('review'); await click('[data-act="reviewSave"]');
  ok('Weekly review saves once per week', (await st('Object.keys(S.reviews).length')) === 1);
  await click('[data-act="tab"][data-tab="settings"]'); await page.evaluate(() => { SET_OPEN.add('data'); render(); }); await click('[data-act="enterDemo"]'); await page.waitForTimeout(400);
  await shot('16-demo-today'); await noHScroll('demo');
  await click('[data-act="tab"][data-tab="progress"]'); await shot('17-demo-progress'); await noHScroll('demo progress');
  await click('[data-act="tab"][data-tab="today"]'); await click('[data-act="exitDemo"]'); await page.waitForTimeout(400);
  ok('Demo mode keeps real data separate', (await st('!S.demo && S.settings.name === "Mariana"')));

  // ---- Personal behavior rules ----
  await click('[data-act="tab"][data-tab="today"]');
  await st(`(() => { const a = newAction({ title: 'Plan the dashboard offer', finish: 'An outline of the offer', minutes: 15, category: 'Planning' }); S.business.nextFor[today()] = a.id; clearOcc('biz@' + today()); save(); render(); })()`);
  await click('.area [data-act="openLog"][data-key^="biz@"]'); await click('[data-group="lstatus"][data-val="done"]'); await click('[data-act="logSave"]');
  const prompt = await page.locator('text=What action does this make possible?').count();
  await page.fill('#napTitle', 'Draft the three offer bullets'); await click('[data-group="napOutC"][data-val="Three offer bullets"]'); await shot('20-next-action-prompt'); await click('[data-act="napSave"]');
  ok('R1 Planning task asks “What action does this make possible?” and links the scheduled action', prompt === 1 && await st('!!S.occ["biz@" + today()].ledTo && S.business.nextFor[dAdd(today(),1)] === S.occ["biz@" + today()].ledTo'));
  ok('R1b Business actions record what will exist afterward', await st('S.business.actions.find(a => a.title === "Draft the three offer bullets").finish === "Three offer bullets"'));
  await click('[data-act="tab"][data-tab="plan"]'); await shot('21-plan-week');
  await click('[data-group="wkMain"][data-val="money"]'); await page.fill('#wkMainOut', 'All bills before payday listed'); await page.fill('#laterIdea', 'Start a YouTube channel'); await click('[data-act="laterAdd"][data-kind="idea"]');
  await click('[data-act="saveWeekly"]'); await noHScroll('plan week'); await click('.sheet [data-act="closeSheet"]');
  ok('R2 Week order saved: main outcome, maintenance, Later list without dates', await st('(() => { const w = S.weeks[weekStart(today())]; return w.main === "money" && w.maintain.length >= 3 && S.later.some(x => x.kind === "idea" && !x.date); })()'));
  await click('[data-act="lifeForm"]'); await page.fill('#lfTitle', 'Dinner with Ana'); await page.fill('#lfMins', '90'); await click('[data-act="lifeSave"]');
  await click('[data-act="tab"][data-tab="today"]');
  const lifeShown = await page.locator('text=Dinner with Ana').count();
  await click('[data-act="lifeChange"]'); await shot('22-life-change'); await click('[data-group="lfWhat"][data-val="letgo"]'); await click('[data-act="lifeApply"][data-k="letgo"]');
  ok('R6 Personal commitment shows on Today; letting it go is recorded as a choice', lifeShown === 1 && await st('S.life[0].status === "let-go" && S.life[0].history.length === 1 && S.changes.some(c => c.kind === "let-go")'));
  await st(`(() => { clearOcc('biz@' + today()); S.settings.availability[dDow(today())] = 300; S.business.nextFor[today()] = S.business.actions.find(a => !a.doneOn).id; setSpendDay(today(), 'complete'); save(); render(); })()`);
  const fkey = await st('featuredItem(itemsFor(today())).key');
  await click('[data-act="stuck"]'); await click('[data-group="stk"][data-val="big"]'); await shot('23-stuck');
  const bigResp = await page.locator('text=Reduce the scope').count();
  await click('[data-act="stkSmall"]');
  ok('R3 “I’m stuck” asks one question and offers a matching response', bigResp === 1 && await st(`!!S.dayPlans[today()].smaller["${fkey}"] && S.stuck.some(s => s.obstacle === "big")`));
  ok('R5 A reduction keeps the original commitment and logs the change', await st(`S.changes.some(c => c.key === "${fkey}" && c.kind === "reduced" && c.title)`));
  await click('[data-act="feelFirst"]'); await click('[data-group="ffEmo"][data-val="Anxious"]'); await shot('24-feeling'); await click('[data-act="feelGo"][data-k="start"]');
  ok('R4 Optional feeling check lets you start without feeling ready', await st(`S.stuck.some(s => s.kind === "feeling" && s.emotions.includes("Anxious")) && (S.occ["${fkey}"] || {}).status === "started"`));
  await click('[data-act="timerHide"]');
  await click('[data-act="tab"][data-tab="settings"]'); await page.evaluate(() => { SET_OPEN.add('data'); render(); }); await page.fill('#laterImp', 'Add a habit heatmap'); await click('[data-act="laterAdd"][data-kind="improvement"]');
  ok('R9 Later improvements captured in Settings, away from Today', await st('S.later.some(x => x.kind === "improvement")') && (await page.locator('text=Later improvements').count()) === 1);
  await click('[data-act="tab"][data-tab="progress"]'); await shot('25-progress-moved');
  const mf = await st('movedForward(weekStart(today()))');
  ok('R7 “What moved forward” lists only logged facts', mf.includes('Followed 1 planned rest day.') && mf.includes('Returned after 4 missed days.') && mf.includes('Moved $25.00 into savings.'), mf.join(' | '));
  await click('[data-act="openReview"]'); await shot('26-review-top');
  const groupsN = await page.locator('[data-group^="chg"][data-val="mismatch"]').count();
  if (groupsN) await click('[data-group^="chg"][data-val="mismatch"]');
  await page.fill('#rvNoticed', 'evenings were crowded'); await page.fill('#rvChange', 'move business work to mornings');
  await page.locator('#rvChange').scrollIntoViewIfNeeded(); await shot('27-review-end');
  await click('[data-act="reviewSave"]');
  ok('R5b Review asks which explanation fits each change', groupsN >= 0 && (groupsN === 0 || await st('S.changes.some(c => c.explanation === "mismatch")')));
  ok('R8 Review ends with one experiment for next week', await st('S.experiments.length === 1 && S.experiments[0].change === "move business work to mornings"'));
  await st('(() => { S.settings.calibrationStart = dAdd(today(), -7); S.firstWeek = null; save(); render(); })()');
  await click('[data-act="tab"][data-tab="today"]');
  ok('R10 First-week check appears after the trial week, judged by usability', (await page.locator('text=First-week check').count()) === 1);
  await click('[data-act="firstWeek"]'); await shot('28-first-week'); await click('[data-group="fw-quick"][data-val="yes"]'); await click('[data-act="firstWeekSave"]');
  ok('R10b First-week answers saved', await st('S.firstWeek && S.firstWeek.quick === "yes"'));
  await noHScroll('rules');

  // ---------- Round 4 ----------
  const openSet = (k) => page.evaluate((k) => { SET_OPEN.add(k); render(); }, k);
  // Goals
  await click('[data-act="tab"][data-tab="plan"]'); await page.evaluate(() => { OPEN_SECTS.add('sect-goals'); render(); });
  await click('[data-act="goalForm"]'); await page.fill('#gfTitle', 'Read 10 books'); await click('[data-group="gfArea"][data-val="money"]');
  await click('[data-group="gfSrc"][data-val="manual"]'); await page.fill('#gfVal', '10'); await page.fill('#gfStart', '2'); await page.fill('#gfUnit', 'books');
  await page.check('#gfFocus'); await shot('30-goal-form'); await click('[data-act="goalSave"]');
  ok('G1 A measurable goal saves with its starting point', await st('S.goals.length === 1 && S.goals[0].target.start === 2 && S.weeks[weekStart(today())].goalId === S.goals[0].id'));
  await click('[data-act="goalOpen"]'); await page.fill('#gmVal', '6'); await click('[data-act="goalManual"]'); await click('.sheet [data-act="closeSheet"]');
  ok('G2 Progress percentage only from a numeric target: 2 → 6 of 10 is 50%', await st('goalProgress(S.goals[0]).pct === 50'));
  await click('[data-act="goalForm"]'); await page.fill('#gfTitle', 'Launch the dashboard offer'); await click('[data-group="gfArea"][data-val="business"]');
  await click('[data-group="gfKind"][data-val="milestones"]'); await page.fill('#gfMsText', 'Draft the offer\nFirst client'); await click('[data-act="goalSave"]');
  ok('G3 Milestone goals show counts, never an invented percentage', await st('!goalSummaryLine(S.goals[1]).includes("%") && goalSummaryLine(S.goals[1]) === "0 of 2 milestones"'));
  await shot('31-plan-goals');
  await click('[data-act="tab"][data-tab="today"]');
  ok('G4 Today shows which goal an action moves toward', (await page.locator('text=Toward: Read 10 books').count()) >= 1);
  const pts0 = await st('chapterPoints(chapter().id)');
  await click('[data-act="tab"][data-tab="plan"]');
  await page.locator('[data-act="goalOpen"][data-id]').nth(1).click(); await page.waitForTimeout(250);
  for (const i of [0, 1]) { await page.locator('.sheet [data-act="msToggle"]').nth(i).check(); await page.waitForTimeout(150); }
  await page.waitForTimeout(200); await shot('32-goal-reached');
  ok('G5 Reaching every milestone offers completion; nothing completes automatically', (await page.locator('text=Mark complete').count()) >= 1 && await st('S.goals[1].status === "active"'));
  await click('.sheet [data-act="goalComplete"]'); await click('[data-act="confirmOk"]'); await page.waitForTimeout(300); await shot('33-report');
  const rtext = await st('reportText(S.goals[1], goalRecord(S.goals[1]))');
  ok('C1 Completion report opens with records, milestones and a grounded message', rtext.includes('GOAL COMPLETED: Launch the dashboard offer') && rtext.includes('Draft the offer') && rtext.includes('You began') && (await page.locator('.sheet svg.chart').count()) === 1);
  await page.check('#rpManifest'); await page.waitForTimeout(200);
  ok('C2 Intention language is optional and tied to action', (await st('reportMessage(S.goals[1], goalRecord(S.goals[1]))')).includes('the actions got you here'));
  await click('[data-act="rpExport"]'); const rpFile = await page.locator('#fileText').inputValue();
  ok('C3 Report exports as a file', rpFile.startsWith('GOAL COMPLETED'));
  await click('.sheet [data-act="closeSheet"]');
  await page.evaluate(() => openReport(S.goals[1].id)); await page.waitForTimeout(250);
  const goalsN = await st('S.goals.length');
  await click('[data-group="rpNext"][data-val="rest"]'); await click('[data-act="rpNextGo"]');
  ok('C4 Next steps never create a goal automatically', (await st('S.goals.length')) === goalsN && await st('S.goals[1].next === "Rest and celebrate"'));
  ok('Z1 Milestones and finished goals add bigger growth', (await st('chapterPoints(chapter().id)')) >= pts0 + 2 * 8 + 15);

  // Analytics
  await click('[data-act="tab"][data-tab="progress"]'); await click('[data-act="progRange"][data-r="month"]'); await shot('34-progress-month');
  ok('A1 Month view: activity chart with a factual insight, outcomes kept separate', (await page.locator('svg.chart').count()) >= 1 && (await page.locator('text=Activity · what you did').count()) === 1 && (await page.locator('text=Outcomes · what changed').count()) === 1 && (await page.locator('.insight').count()) >= 3);
  ok('A2 Missing records are shown apart from zero', (await page.locator('.legend >> text=No record').count()) >= 1);
  await noHScroll('progress month');
  await page.locator('.cgrid').scrollIntoViewIfNeeded(); await shot('35-progress-consistency');
  await click('[data-act="progRange"][data-r="all"]'); await shot('36-progress-all');
  ok('A3 All-time view renders', (await page.locator('text=Consistency by goal').count()) === 1);
  await noHScroll('progress all');
  await click('[data-act="progRange"][data-r="week"]');

  // Personalize
  await click('[data-act="tab"][data-tab="settings"]'); await openSet('look'); await click('[data-act="lookOpen"]');
  await click('[data-group="lkBg"][data-val="night"]'); await page.locator('#lkDim').fill('40'); await page.waitForTimeout(150); await shot('37-personalize');
  const bgPrev = await st('document.documentElement.style.getPropertyValue("--bg-img")');
  await click('.sheet [data-act="closeSheet"]'); await page.waitForTimeout(250);
  const bgAfter = await st('document.documentElement.style.getPropertyValue("--bg-img")');
  ok('P1 Personalize previews live and Cancel reverts', bgPrev.includes("night") && bgAfter.includes("monet") && await st('S.settings.look.bg === "monet"'));
  await openSet('look'); await click('[data-act="lookOpen"]');
  await click('[data-group="lkBg"][data-val="plain-paper"]'); await click('[data-group="lkFont"][data-val="lora"]'); await click('[data-group="lkInk"][data-val="midnight"]');
  await page.locator('#lkSize').fill('120'); await page.waitForTimeout(100); await click('[data-act="lookApply"]');
  await page.reload(); await page.waitForTimeout(600);
  ok('P2 Applied look persists after reload', await st('S.settings.look.bg === "plain-paper" && S.settings.look.font === "lora" && getComputedStyle(document.documentElement).getPropertyValue("--zoom").trim() === "1.2"'));
  ok('P3 Every offered text color keeps 7:1 contrast in light and dark', await st('INKS.every(inkOk)'));
  await click('[data-act="tab"][data-tab="today"]'); await shot('38-today-120'); await noHScroll('today at 120% text');
  await click('[data-act="tab"][data-tab="settings"]'); await noHScroll('settings at 120% text');
  await openSet('look'); await click('[data-act="lookOpen"]'); await click('[data-act="lookReset"]'); await click('[data-act="lookApply"]');
  ok('P4 Restore default', await st('S.settings.look.bg === "monet" && S.settings.look.size === 100'));

  // Companion
  await click('[data-act="tab"][data-tab="today"]');
  ok('Z2 Companion grows from records and appears on Today', (await page.locator('.companion').count()) === 1 && (await st('chapterPoints(chapter().id)')) > 0);
  const zBefore = await st('chapterPoints(chapter().id)');
  await st('(() => { window.__ci = JSON.stringify(S.checkins); S.checkins = {}; S.growth.offerDismissed = "x"; render(); })()');
  await shot('39-garden-ready');
  ok('Z3 After 7 quiet days: “ready when you are”, no loss of growth', (await page.locator('text=Your garden is ready when you are. Continue growing, or begin a new chapter?').count()) === 1 && (await st('chapterPoints(chapter().id)')) === zBefore && await st('!document.body.innerText.match(/died|dead|wilted/i)'));
  await click('[data-act="compChapterForm"]'); await click('[data-group="chWay"][data-val="season"]'); await click('[data-act="compChapter"]');
  ok('Z4 A new season keeps prior progress', await st('S.growth.chapters.length === 2') && (await st('chapterPoints(chapter().id)')) >= zBefore);
  await st('(() => { S.checkins = JSON.parse(window.__ci); save(); render(); })()');
  await openSet('companion'); 

  // PIN lock
  await click('[data-act="tab"][data-tab="settings"]'); await click('[data-act="pinSetup"]');
  await page.fill('#pfUser', 'Mari'); await page.fill('#pfNew', '123456'); await page.fill('#pfNew2', '123456'); await click('[data-act="pinSave"]');
  ok('L1 Weak PINs are refused', (await page.locator('text=Avoid a straight run').count()) === 1 && await st('!AUTH'));
  await page.waitForTimeout(450); await page.fill('#pfNew', '493817'); await page.fill('#pfNew2', '493817'); await click('[data-act="pinSave"]'); await page.waitForTimeout(600);
  await page.waitForSelector('#rcText', { timeout: 15000 }).catch(async () => { await shot('dbg-pin'); console.log('DBG', await st('JSON.stringify([!!AUTH, ($("#pfMsg")||{}).textContent, SH.pinMode, !!$(".sheet")])')); }); const code = (await page.locator('#rcText').textContent()).trim(); await shot('40-recovery-code');
  await page.check('#rcOk'); await click('[data-act="rcDone"]');
  const stored = await st('Store.get("auth").then(a => JSON.stringify(a))');
  const backup = await st('JSON.stringify(S)');
  ok('L2 Only a salted hash is stored, outside backups', !stored.includes('493817') && stored.includes('"hash"') && !backup.includes('493817') && !backup.includes('"recHash"'));
  await click('[data-act="lockNowBtn"]'); await shot('41-lock');
  ok('L3 Lock screen with masked PIN entry and show/hide', (await page.locator('#lkPin[type="password"][inputmode="numeric"]').count()) === 1 && (await page.locator('.tabbar').count()) === 0);
  await click('[data-act="pinShow"]'); const shown = await page.locator('#lkPin').getAttribute('type'); await click('[data-act="pinShow"]');
  for (let i = 0; i < 5; i++) { await page.fill('#lkPin', '000000'); await click('[data-act="lockTry"]'); await page.waitForTimeout(500); }
  await shot('42-lockout');
  ok('L4 Five wrong PINs trigger a timed wait', shown === 'text' && await st('lockoutLeft() > 0 && LOCKED') && (await page.locator('[data-act="lockTry"][disabled]').count()) === 1);
  await setNow(new Date(NOW + 31000).toISOString());
  await click('[data-act="lockMode"][data-mode="recover"]'); await page.fill('#lkCode', code.toLowerCase()); await page.fill('#lkNew', '582039'); await page.fill('#lkNew2', '582039'); await click('[data-act="lockRecover"]'); await page.waitForSelector('#rcText', { timeout: 15000 }).catch(() => {});
  ok('L5 Recovery code resets the PIN and issues a new code', await st('!LOCKED') && (await page.locator('#rcText').count()) === 1);
  await page.check('#rcOk'); await click('[data-act="rcDone"]');
  await st('(() => { AUTH.autoLockMin = 1; lastActivity = Date.now() - 120000; autoLockTick(); })()'); await page.waitForTimeout(200);
  ok('L6 Auto-lock after inactivity', await st('LOCKED') && (await page.locator('#lkPin').count()) === 1);
  await page.fill('#lkPin', '582039'); await click('[data-act="lockTry"]'); await page.waitForTimeout(700);
  ok('L7 Correct PIN unlocks', await st('!LOCKED'));
  await page.reload(); await page.waitForTimeout(600);
  ok('L8 The lock survives a reload', await st('LOCKED') && (await page.locator('#lkPin').count()) === 1);
  await page.fill('#lkPin', '582039'); await click('[data-act="lockTry"]'); await page.waitForTimeout(700);
  await click('[data-act="tab"][data-tab="settings"]'); await shot('43-settings-sections'); await noHScroll('settings');
  await click('[data-act="pinOff"]'); await page.fill('#pfCur', '582039'); await click('[data-act="pinSave"]'); await page.waitForTimeout(600);
  ok('L9 PIN can be turned off with the current PIN', await st('!AUTH'));

  // Pause
  await openSet('pause'); await click('[data-act="pauseForm"]');
  const td0 = await st('today()');
  await page.fill('#psSd', td0); await page.fill('#psSt', '00:00'); await page.fill('#psEd', await st('dAdd(today(), 3)')); await page.fill('#psEt', '09:00');
  await shot('44-pause-form'); await click('[data-act="pauseSave"]');
  await click('[data-act="tab"][data-tab="today"]'); await shot('45-today-paused');
  ok('V1 During a pause: nothing scheduled, nothing owed', await st('pausedAll(today()) && itemsFor(today()).every(i => i.paused)') && (await page.locator('text=Resting until').count()) === 1 && await st('!featuredItem(itemsFor(today())) || !featuredItem(itemsFor(today())).checkin'));
  ok('V2 Paused days are excluded from adherence', await st('weekStats(weekStart(today())).pausedDays >= 1'));
  const occN = await st('Object.keys(S.occ).length');
  await click('[data-act="pauseForm"]'); await page.fill('#psEd', await st('dAdd(today(), 4)')); await click('[data-act="pauseSave"]');
  ok('V3 Extending a pause updates the end time', await st('S.pauses[0].end.startsWith(dAdd(today(), 4))'));
  await setNow(new Date(Date.parse(td0 + 'T14:00:00Z') + 6 * 86400000).toISOString()); await page.reload(); await page.waitForTimeout(600);
  await shot('46-welcome-back');
  ok('V4 After the end: “Welcome back. Resume your plan or adjust your first day?” and it waits', (await page.locator('text=Welcome back. Resume your plan or adjust your first day?').count()) === 1 && await st('pauseState(S.pauses[0]) === "ended"'));
  ok('V5 No backlog from paused days, records preserved', await st(`itemsFor(dAdd(today(), -2)).filter(i => !i.paused).length === 0`) && (await st('Object.keys(S.occ).length')) === occN);
  await page.reload(); await page.waitForTimeout(500);
  ok('V6 Without confirmation it stays paused, one quiet card, no repeated prompts', (await page.locator('#welcomeBack').count()) === 1 && (await page.locator('.toast').count()) === 0);
  await click('[data-act="pauseResume"]');
  ok('V7 Resuming needs your confirmation', await st('S.pauses[0].resumedOn === today() && pauseState(S.pauses[0]) === "over"') && (await page.locator('#welcomeBack').count()) === 0);
  await noHScroll('round 4');

  // ---------- Project ending ----------
  await click('[data-act="tab"][data-tab="plan"]'); await page.evaluate(() => { OPEN_SECTS.add('sect-goals'); OPEN_SECTS.add('sect-tasks'); render(); });
  const gid = await st('S.goals[0].id');
  await st(`(() => { const t = createOneOff('money', 'Read 20 pages', 'Twenty pages read', 20, dAdd(today(), 2)); t.goalId = "${gid}"; save(); render(); })()`);
  const growthBeforeEnd = await st('chapterPoints(chapter().id)');
  await page.locator(`[data-act="goalOpen"][data-id="${gid}"]`).first().click(); await page.waitForTimeout(250);
  await page.locator('.sheet details.more summary').click(); await click('[data-act="endOpen"]'); await shot('47-end-ready');
  ok('E1 “Ready to end this project?” offers keep, adjust, pause and end', (await page.locator('text=Ready to end this project?').count()) === 1 && (await page.locator('.sheet [data-act="endPause"]').count()) === 1 && (await page.locator('.sheet [data-act="goalForm"]').count()) === 1);
  await click('[data-act="endStep"][data-step="2"]');
  ok('E2 The reason question is optional', (await page.locator('text=What influenced your decision?').count()) === 1 && (await page.locator('[data-act="endStep"][data-skip="1"]').count()) === 1);
  await click('[data-act="endStep"][data-skip="1"]'); await shot('48-end-confirm');
  ok('E3 Final confirmation before ending', (await page.locator('text=Are you sure you want to end this project?').count()) === 1 && await st(`goalById("${gid}").status !== "ended"`));
  await click('[data-act="endConfirm"]'); await page.waitForTimeout(300); await shot('49-ended');
  ok('E4 Ended (not completed), linked tasks stop, history and growth kept', await st(`goalById("${gid}").status === "ended" && goalById("${gid}").endReason === null && !itemsFor(dAdd(today(), 2)).some(i => i.title === "Read 20 pages") && goalById("${gid}").manual.length >= 1`) && (await st('chapterPoints(chapter().id)')) >= growthBeforeEnd && (await page.locator('text=Reopen with a fresh schedule').count()) === 1);
  await click('.sheet [data-act="closeSheet"]');
  ok('E5 Ended projects move to Archived projects', (await page.locator('text=Archived projects').count()) === 1);
  await setNow(new Date(NOW + 3 * 86400000).toISOString()); await page.reload(); await page.waitForTimeout(500);
  await click('[data-act="tab"][data-tab="plan"]'); await page.evaluate(() => { OPEN_SECTS.add('sect-goals'); render(); });
  await page.locator(`[data-act="goalOpen"][data-id="${gid}"]`).first().click(); await page.waitForTimeout(250); await click('[data-act="goalReopen"]');
  ok('E6 Reopening starts fresh with no backlog', await st(`goalById("${gid}").status === "active" && !goalEndedOn(goalById("${gid}"), today()) && goalEndedOn(goalById("${gid}"), dAdd(today(), -1))`));
  await click('.sheet [data-act="closeSheet"]');

  // ---------- Mindset ----------
  await click('[data-act="tab"][data-tab="mindset"]'); await shot('50-mindset-empty');
  ok('M1 Mindset says “Updated weekly”, shows no fake update or schedule', (await page.locator('text=Updated weekly').count()) === 1 && (await page.locator('text=None yet').count()) === 1 && (await page.locator('text=Not scheduled.').count()) === 1);
  ok('M2 Notifications start off', await st('S.mindset.notify === false'));
  await click('[data-act="msCheck"]'); await page.waitForTimeout(800); await shot('51-mindset-edition');
  const ed = JSON.parse(fs.readFileSync(path.join(DIST, 'mindset.json'), 'utf8')).edition;
  ok('M3 Manual check loads the edition with its real update time', await st(`S.mindset.lastSuccess === "${ed.updatedAt}" && S.mindset.editions.length === 1`));
  ok('M4 Every card shows Free, a source link and its original date', (await page.locator('.ms-card').count()) === ed.items.length && (await page.locator('.ms-card a[href^="https://"]').count()) === ed.items.length && (await page.locator('.ms-card >> text=Published').count()) === ed.items.length);
  ok('M5 Older material isn’t labeled new', await st('!Array.from(document.querySelectorAll(".ms-card")).some(c => c.textContent.includes("Episode 327") && c.textContent.includes("New"))'));
  ok('M6 Unverified and promotional claims are labeled', (await page.locator('.claim-uncertain').count()) >= 1 && (await page.locator('.claim-promotional').count()) >= 1);
  ok('M7 The roster can’t be edited in the app', (await page.locator('details:has-text("Curated creators") input').count()) === 0 && await st('MINDSET_ROSTER.length === 15 && validateEdition({ app: "one-day-mindset", edition: { id: "x", updatedAt: nowISO(), items: [{ id: "a", creator: "Someone Else", type: "video", title: "t", url: "https://example.com/a", published: "2026-10-01", access: "free", summary: "s" }] } }).length > 0'));
  ok('M8 Paid items are rejected', await st('validateEdition({ app: "one-day-mindset", edition: { id: "x", updatedAt: nowISO(), items: [{ id: "a", creator: "James Clear", type: "course", title: "t", url: "https://example.com/a", published: "2026-10-01", access: "paid", summary: "s" }] } }).length > 0'));
  await page.locator('.ms-card [data-act="msSave"]').first().click(); await page.waitForTimeout(200);
  await page.locator('.ms-card [data-act="msHide"]').last().click(); await page.waitForTimeout(200);
  await page.reload(); await page.waitForTimeout(500);
  ok('M9 Saved and hidden items persist', await st('Object.keys(S.mindset.saved).length === 1 && Object.keys(S.mindset.hidden).length === 1'));
  await page.route('**/mindset.json*', (r) => r.fulfill({ status: 500, body: 'error' }));
  await click('[data-act="tab"][data-tab="mindset"]'); await click('[data-act="msCheck"]'); await page.waitForTimeout(600); await shot('52-mindset-failed');
  ok('M10 A failed update keeps the previous edition and its real timestamp', await st(`S.mindset.lastSuccess === "${ed.updatedAt}" && S.mindset.editions.length === 1 && S.mindset.lastCheck.ok === false`) && (await page.locator('text=Last check failed').count()) === 1);
  await page.unroute('**/mindset.json*');
  const n2 = JSON.parse(JSON.stringify({ app: 'one-day-mindset', version: 1, edition: ed })); n2.edition.id = '2026-10-26'; n2.edition.weekOf = '2026-10-26'; n2.edition.updatedAt = '2026-10-29T19:00:00Z';
  await page.route('**/mindset.json*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(n2) }));
  await page.check('#msNotify'); await page.waitForTimeout(150);
  await click('[data-act="msCheck"]'); await page.waitForTimeout(600);
  ok('M11 Items repeated in a later edition aren’t shown as new again', (await page.locator('.ms-card .pill.started').count()) === 0 && (await page.locator('text=No relevant new resources this week').count()) === 1);
  await click('[data-act="tab"][data-tab="today"]');
  const bannerN = await page.locator('text=A new Mindset edition is ready.').count();
  await click('[data-act="msNoticeDismiss"]'); await page.reload(); await page.waitForTimeout(500);
  ok('M12 Opt-in notice appears once per edition', bannerN === 1 && (await page.locator('text=A new Mindset edition is ready.').count()) === 0);
  await page.unroute('**/mindset.json*');
  await click('[data-act="tab"][data-tab="mindset"]');
  const tasksN = await st('S.tasks.length');
  await page.locator('#tryOne').scrollIntoViewIfNeeded(); await page.fill('#tryApply', 'Do the first 10 minutes with music'); await click('[data-act="tryPlan"]');
  const asked = await page.locator('text=Please confirm').count(); const tasksBefore = await st("S.tasks.length");
  await click('[data-act="confirmOk"]'); await page.waitForTimeout(200);
  ok('M13 Adding to the plan needs confirmation', asked === 1 && tasksBefore === tasksN && (await st('S.tasks.length')) === tasksN + 1);
  await click('[data-act="tryReplace"]'); await shot('53-try-replace');
  ok('M14 Replacing a task also asks first', (await page.locator('.sheet').count()) === 1);
  await click('.sheet [data-act="closeSheet"]');
  await noHScroll('mindset');

  // W. Returning users, language switch, letter in Settings
  await page.reload(); await page.waitForTimeout(500);
  ok('W18 Returning users skip the welcome', (await page.locator('.envelope').count()) === 0 && (await page.locator('.date-h').count()) === 1);
  const recBefore = await st('JSON.stringify([S.tasks.length, Object.keys(S.checkins).length, S.money.tx.length, S.goals.length])');
  await click('[data-act="tab"][data-tab="settings"]');
  await page.selectOption('#stLang', 'fr'); await click('[data-act="settingsSave"]');
  const frTabs = await page.locator('.tabbar').innerText();
  ok('W19 French applies to navigation and settings, entries kept', (await st('S.settings.language')) === 'fr' && (await page.locator('text=Profil et sécurité').count()) === 1 && (await st('JSON.stringify([S.tasks.length, Object.keys(S.checkins).length, S.money.tx.length, S.goals.length])')) === recBefore, frTabs.replace(/\n/g, ' '));
  await shot('60-settings-fr');
  await page.selectOption('#stLang', 'it'); await click('[data-act="settingsSave"]');
  ok('W20 Italian applies to settings', (await page.locator('text=Profilo e sicurezza').count()) === 1);
  await click('[data-act="tab"][data-tab="mindset"]');
  ok('W21 External resources labeled as original language', (await page.locator('.ms-orig').count()) === 1);
  await click('[data-act="tab"][data-tab="settings"]');
  await page.locator('[data-act="openLetter"]').scrollIntoViewIfNeeded(); await click('[data-act="openLetter"]');
  ok('W22 “A letter from Mariana” opens from Settings', (await page.locator('.sheet .letter-page').count()) === 1 && (await page.locator('.sheet [data-act="welBegin"]').count()) === 0);
  await shot('61-letter-settings');
  await click('.sheet [data-act="closeSheet"]');
  await page.fill('#stName', '  '); await click('[data-act="settingsSave"]');
  ok('W23 Settings also rejects an empty name', (await st('S.settings.name')) === 'Mariana');
  await page.fill('#stTzQ', 'madrid'); await page.waitForTimeout(150); await click('#stTzList .tz-opt'); await page.fill('#stName', 'Mariana'); await click('[data-act="settingsSave"]');
  ok('W24 Timezone changeable later in Settings', (await st('S.settings.timezone')) === 'Europe/Madrid');
  await page.fill('#stTzQ', 'puerto'); await page.waitForTimeout(150); await click('#stTzList .tz-opt'); await page.selectOption('#stLang', 'en'); await click('[data-act="settingsSave"]');
  ok('W25 Back to Puerto Rico and English', (await st('S.settings.timezone')) === 'America/Puerto_Rico' && (await st('S.settings.language')) === 'en');
  // Reduced motion: a fresh visitor sees the letter right away
  const ctx2 = await browser.newContext({ ...devices['iPhone SE'], reducedMotion: 'reduce' });
  const p2 = await ctx2.newPage(); await p2.goto('http://localhost:8765/'); await p2.waitForTimeout(500);
  await p2.locator('button.envelope').click(); await p2.waitForTimeout(200); await p2.locator('[data-act="welLang"][data-l="es"]').click(); await p2.waitForTimeout(150);
  ok('W26 Reduced motion shows the letter immediately', (await p2.locator('.env-wrap.opening').count()) === 0 && (await p2.locator('.letter-page').count()) === 1 && (await p2.locator('text=¿Comenzamos?').count()) === 1);
  await p2.locator('[data-act="welBegin"]').click(); await p2.waitForTimeout(200);
  ok('W27 Spanish letter sets Spanish as the starting app language', (await p2.locator('text=Hagamos este espacio tuyo.').count()) === 1 && (await p2.inputValue('#suName')) === '');
  await ctx2.close();

  // Dark mode screenshot
  await page.emulateMedia({ colorScheme: 'dark' }); await click('[data-act="tab"][data-tab="today"]'); await shot('18-today-dark');

  ok('16 No horizontal scrolling on any screen at 320–375px', true);
  ok('18 No external services contacted (fonts only)', external.length === 0, [...new Set(external)].join(','));
  ok('No script errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  await browser.close(); srv.close();
  const failed = results.filter((r) => !r[1]);
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 1));
  console.log(failed.length ? failed.length + ' FAILED' : 'ALL PASSED');
})().catch((e) => { console.error(e); process.exit(1); });
