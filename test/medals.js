// Project dates, completion gifts and medals, run against dist/ at iPhone width.
// Device clock in Tokyo, saved timezone Puerto Rico, so a device-timezone date shows up as wrong.
const { chromium, devices } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const DIST = path.join(__dirname, '..', 'dist');
const OUT = process.argv[2] || path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const types = { '.json': 'application/json', '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let p = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html'; fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); });
const results = []; const ok = (n, cond, info) => { results.push([n, !!cond]); console.log((cond ? 'PASS ' : 'FAIL ') + n + (info ? ' — ' + info : '')); };

(async () => {
  await new Promise((r) => srv.listen(8770, r));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const mk = async (opts) => {
    const ctx = await browser.newContext({ ...devices['iPhone SE'], timezoneId: 'Asia/Tokyo', ...(opts || {}) });
    await ctx.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
    await ctx.addInitScript(() => { const v = localStorage.getItem('__now'); if (v) window.__oneDayNow = Number(v); });
    return ctx;
  };
  const ctx = await mk(); const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  const st = (expr, arg) => page.evaluate(expr, arg);
  const setNow = async (iso) => { await page.evaluate((n) => { localStorage.setItem('__now', String(n)); window.__oneDayNow = n; }, Date.parse(iso)); };
  const shot = (n) => page.screenshot({ path: path.join(OUT, n + '.png') });
  const click = async (sel) => { await page.evaluate(() => { const a = document.activeElement; if (a && a.matches('input, textarea')) a.blur(); }); await page.waitForTimeout(60); await page.locator(sel).first().click(); await page.waitForTimeout(420); };
  const reload = async (hash) => { await page.goto('http://localhost:8770/' + (hash || '')); await page.waitForTimeout(500); };
  const noH = () => st(() => document.documentElement.scrollWidth <= window.innerWidth + 1 && (!document.querySelector('.sheet') || document.querySelector('.sheet').scrollWidth <= document.querySelector('.sheet').clientWidth + 1));
  const fillDate = (sel, v) => page.evaluate(([sel, v]) => { const e = document.querySelector(sel); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [sel, v]);
  const medals = () => st('(S.medals || []).length');

  await page.goto('http://localhost:8770/'); await setNow('2026-10-24T02:00:00Z'); // Oct 23, 22:00 in Puerto Rico; Oct 24 in Tokyo
  await st(async () => {
    S = defaultState(); Object.assign(S.settings, { onboarded: true, welcomeDone: true, languageChosen: true, language: 'en', name: 'Mari', timezone: 'America/Puerto_Rico', calibrationStart: '2026-09-01' });
    growthInit(); await flush();
  });
  await reload('#plan');
  const openGoals = async () => { await st(() => { TAB = 'plan'; OPEN_SECTS.add('sect-goals'); closeSheet(true); render(); }); await page.waitForTimeout(150); };
  await openGoals();

  // Dates on the form
  await click('[data-act="goalForm"]');
  ok('M1 Start date defaults to today in the saved timezone (Oct 23 in Puerto Rico, not Oct 24 in Tokyo)', (await page.inputValue('#gfStartOn')) === '2026-10-23');
  ok('M1b The form asks for a target completion date and completion criteria', (await page.locator('#gfTargetOn').isVisible()) && (await page.locator('#gfCriteria').isVisible()));
  await page.fill('#gfTitle', 'Finish the garden mural');
  await click('[data-group="gfArea"][data-val="art"]'); await click('[data-group="gfKind"][data-val="milestones"]');
  await page.fill('#gfMsText', 'Sketch\nBase colors\nDetails');
  await fillDate('#gfTargetOn', '2026-10-20'); await page.fill('#gfCriteria', 'The mural is painted and signed');
  await click('[data-act="goalSave"]');
  ok('M2 A target date before the start date is refused', (await st('S.goals.length')) === 0 && (await page.locator('.toast').textContent()).includes('on or after the start date'));
  await fillDate('#gfTargetOn', ''); await click('[data-act="goalSave"]');
  ok('M2b A project with a finish needs a target date', (await st('S.goals.length')) === 0);
  await fillDate('#gfTargetOn', '2026-11-15'); await page.fill('#gfCriteria', ''); await click('[data-act="goalSave"]');
  ok('M2c It needs completion criteria too', (await st('S.goals.length')) === 0);
  await page.fill('#gfCriteria', 'The mural is painted and signed'); await fillDate('#gfStartOn', '2026-10-01'); await click('[data-act="goalSave"]');
  const g1 = await st(() => S.goals[0]);
  ok('M2d A valid project saves its editable start date, target and criteria', g1 && g1.startedOn === '2026-10-01' && g1.targetDate === '2026-11-15' && g1.criteria === 'The mural is painted and signed' && g1.targetDateOriginal === '2026-11-15');
  await click('[data-act="goalForm"]');
  await click('[data-group="gfKind"][data-val="ongoing"]');
  ok('M3 Ongoing goals don’t ask for a target date', !(await page.locator('#gfTargetOn').isVisible()));
  await page.fill('#gfTitle', 'Keep training'); await click('[data-group="gfArea"][data-val="training"]'); await click('[data-act="goalSave"]');
  ok('M3b An ongoing goal saves without one', (await st('S.goals.length')) === 2 && !(await st('S.goals[1].targetDate')));

  // Adjusting the date keeps progress and history
  const gid = g1.id;
  await st((id) => { const g = goalById(id); g.milestones[0].doneOn = '2026-10-05'; save(); }, gid);
  await st((id) => openGoal(id), gid); await page.waitForTimeout(200);
  await shot('md-01-goal-dates');
  await click('[data-act="goalDateForm"]');
  await fillDate('#gdTarget', '2026-09-01'); await click('[data-act="goalDateSave"]');
  ok('M4 Adjusting refuses a date before the start', (await st((id) => goalById(id).targetDate, gid)) === '2026-11-15');
  await fillDate('#gdTarget', '2026-11-30'); await click('[data-act="goalDateSave"]');
  const g1b = await st((id) => goalById(id), gid);
  ok('M4b Adjusting keeps progress and records original and revised dates', g1b.targetDate === '2026-11-30' && g1b.targetDateOriginal === '2026-11-15' && g1b.milestones[0].doneOn === '2026-10-05'
    && g1b.dateHistory.some((h) => h.field === 'target' && h.from === '2026-11-15' && h.to === '2026-11-30'));
  ok('M4c The goal shows its dates and history', (await page.locator('.gd-dates').textContent()).includes('originally') && (await page.locator('.gd-dates details').count()) === 1);

  // The date passing completes nothing
  await setNow('2026-12-03T15:00:00Z');
  await st(() => { dayCheck(); sceneSync(); closeSheet(true); TAB = 'today'; render(); });
  ok('M5 Dates alone never complete a project', (await st((id) => goalById(id).status, gid)) === 'active' && (await medals()) === 0);
  ok('M5b Today offers a neutral note when the target date has passed', (await page.locator(`[data-due="${gid}"]`).count()) === 1);
  await shot('md-02-today-due');
  await click(`[data-due="${gid}"] [data-act="goalOpen"]`);
  ok('M5c The project offers review, adjust or end', (await page.locator('#goalDue [data-act="reportOpen"]').count()) === 1 && (await page.locator('#goalDue [data-act="goalDateForm"]').count()) === 1 && (await page.locator('#goalDue [data-act="endOpen"]').count()) === 1);
  await click('#goalDue [data-act="reportOpen"]');
  ok('M5d Review shows progress so far, not a completion', (await page.locator('.sheet .h2').textContent()).includes('Progress so far') && (await st((id) => goalById(id).status, gid)) === 'active');
  await st(() => { closeSheet(true); TAB = 'today'; render(); });
  await click(`[data-due="${gid}"] [data-act="dueLater"]`);
  ok('M5e "Not now" hides the note until the date changes', (await page.locator(`[data-due="${gid}"]`).count()) === 0);

  // Completing
  await st((id) => openGoal(id), gid); await page.waitForTimeout(200);
  await click('.sheet [data-act="goalComplete"]');
  const csheet = await page.locator('.sheet').textContent();
  ok('M6 Complete project shows the criteria and asks the question', csheet.includes('The mural is painted and signed') && csheet.includes('Have you accomplished what you set out to do?'));
  await shot('md-03-complete');
  await click('[data-act="goalBack"]');
  ok('M6b Returning to the project changes nothing', (await st((id) => goalById(id).status, gid)) === 'active' && (await medals()) === 0);
  await click('.sheet [data-act="goalComplete"]');
  await page.locator('[data-act="goalCompleteYes"]').dblclick(); await page.waitForTimeout(300);
  const after = await st((id) => ({ g: goalById(id), m: S.medals }), gid);
  ok('M6c Confirming completes it with the actual date (saved timezone), separate from the target', after.g.status === 'complete' && after.g.completedOn === '2026-12-03' && after.g.targetDate === '2026-11-30');
  ok('M6d Exactly one medal is saved at confirmation, even with a double tap', after.m.length === 1 && after.m[0].key === 'goal:' + gid && after.m[0].completedOn === '2026-12-03' && after.m[0].opened === false);
  ok('M6e Finishing late doesn’t change the celebration', (await page.locator('.gift-head').textContent()).includes('You did it.'));

  // The gift waits
  await page.waitForTimeout(3000);
  ok('M7 The gift box stays closed until it’s opened', (await page.locator('.gift-btn').count()) === 1 && (await st('S.medals[0].opened')) === false && (await page.locator('.gift-btn').getAttribute('aria-label')).includes('Tap to open'));
  await shot('md-04-gift');
  ok('M7b Gift sheet fits a phone', await noH());
  await click('[data-act="giftLater"]');
  ok('M8 "Open later" keeps it unopened', (await st('S.medals[0].opened')) === false && (await page.locator('.sheet').count()) === 0);
  await reload('#companion');
  ok('M8b After a reload the gift waits in My Companion', (await page.locator('#myMilestones .medal-tile.gift').count()) === 1 && (await st('S.medals[0].opened')) === false);
  await page.locator('#myMilestones').screenshot({ path: path.join(OUT, 'md-05-gallery-gift.png') });
  await st(() => { TAB = 'today'; render(); });
  ok('M8c Today mentions the waiting gift', (await page.locator('.gift-note').count()) === 1);
  await st(() => { TAB = 'companion'; render(); });

  // Opening with the keyboard
  await click('#myMilestones .medal-tile.gift');
  await page.waitForTimeout(600); await page.locator('.gift-btn').focus(); await page.keyboard.press('Enter');
  await page.waitForTimeout(500); await shot('md-06-opening');
  await page.waitForTimeout(1600);
  const mv = await page.locator('#medalView').textContent();
  ok('M9 Opening (keyboard) reveals the medal with name, date and message', (await st('S.medals[0].opened')) === true && mv.includes('Finish the garden mural') && mv.includes('December 3, 2026') && mv.includes('This medal marks the work you brought to completion'));
  ok('M9b Under the medal: progress report and add to collection', (await page.locator('[data-act="medalReport"]').count()) === 1 && (await page.locator('[data-act="medalKeep"]').count()) === 1);
  await shot('md-07-medal');
  ok('M9c Medal view fits a phone', await noH());
  await click('[data-act="medalReport"]');
  ok('M9d The report button opens the completion report', (await page.locator('.sheet .h2').textContent()).includes('Completion report'));
  await st(() => { closeSheet(true); openGift(S.medals[0].id); }); await page.waitForTimeout(300);
  await click('[data-act="medalKeep"]');
  ok('M9e "Add to my collection" acknowledges it; the medal was already saved', (await st('S.medals[0].acknowledged')) === true && (await medals()) === 1);
  ok('M9f The medal shows in My milestones', (await page.locator('#myMilestones .medal-tile:not(.gift)').count()) === 1);
  await click('#myMilestones .medal-tile');
  ok('M9g Tapping a medal opens its project details and report', (await page.locator('#medalView').textContent()).includes('The mural is painted and signed') && (await page.locator('[data-act="medalReport"]').count()) === 1);
  await st(() => closeSheet(true));

  // No duplicates
  await st((id) => { SH.goalId = id; A.goalCompleteYes(); A.goalCompleteYes(); }, gid);
  await st((id) => { const g = goalById(id); g.status = 'active'; save(); SH.goalId = id; A.goalCompleteYes(); closeSheet(true); }, gid);
  await reload('#companion');
  ok('M10 Repeated taps, reloads and re-completing never add a second medal', (await medals()) === 1);

  // Ending unfinished earns nothing
  await st(() => { S.goals.push({ id: 'gEnd', title: 'Learn the cello', area: 'art', kind: 'milestones', milestones: [{ id: 'm1', title: 'A', doneOn: null }], status: 'active', startedOn: '2026-10-01', targetDate: '2026-12-31', criteria: 'Play a piece', manual: [] }); save(); });
  await st(() => { SH.goalId = 'gEnd'; A.endConfirm(); closeSheet(true); });
  ok('M11 Ending or archiving an unfinished project earns no medal', (await st('goalById("gEnd").status')) === 'ended' && (await medals()) === 1);

  // Dated milestones inside an ongoing goal
  const og = await st(() => S.goals.find((g) => g.kind === 'ongoing').id);
  await st((id) => openGoal(id), og); await page.waitForTimeout(200);
  await page.fill('#gmMsD', 'Complete my first four weeks of planned training'); await fillDate('#gmMsDate', '2026-12-31'); await click('[data-act="msAddDated"]');
  ok('M12 Ongoing goals take dated milestones', (await st((id) => goalById(id).milestones[0].targetDate, og)) === '2026-12-31');
  await click('.sheet [data-act="msToggle"]');
  ok('M12b Ticking it asks for confirmation instead of completing at once', (await page.locator('[data-act="msConfirmYes"]').count()) === 1 && !(await st((id) => goalById(id).milestones[0].doneOn, og)));
  await click('[data-act="msConfirmYes"]');
  ok('M12c Confirming earns the milestone its own medal and gift', (await medals()) === 2 && (await st('S.medals[1].type')) === 'milestone' && (await page.locator('.gift-btn').count()) === 1);
  await click('[data-act="giftLater"]');
  await st((id) => { const g = goalById(id); const m = g.milestones[0]; SH.goalId = id; m.doneOn = null; SH.msId = m.id; A.msConfirmYes(); closeSheet(true); }, og);
  ok('M12d Un-ticking and confirming again doesn’t add another', (await medals()) === 2);
  await st((id) => { const g = goalById(id); g.milestones.push({ id: 'ms2', title: 'Run 10 km', doneOn: null, targetDate: '2027-01-31' }); SH.goalId = id; SH.msId = 'ms2'; A.msConfirmYes(); closeSheet(true); }, og);
  ok('M12e A new, separately defined milestone earns its own medal', (await medals()) === 3);

  // Medals stay
  await st(() => { chapter().kind = 'farm'; save(); render(); });
  await st((id) => { S.goals = S.goals.filter((g) => g.id !== id); save(); TAB = 'companion'; render(); }, gid);
  ok('M13 Medals stay after changing companion and even after deleting the project', (await medals()) === 3 && (await page.locator('#myMilestones .medal-tile').count()) === 3);
  await click('#myMilestones .medal-tile:not(.gift)');
  ok('M13b A medal whose project is gone still opens, without a broken report link', (await page.locator('#medalView').textContent()).includes('deleted') && (await page.locator('[data-act="medalReport"]').count()) === 0);
  await st(() => closeSheet(true));

  // Rest Mode: no popup, gifts wait for the return
  await st(() => { S.pauses.push({ id: 'pR', scope: 'all', start: localNow(tz()).slice(0, 10) + 'T00:00', end: '2027-01-07T09:00', tz: tz(), returnNote: false }); save(); render(); });
  await st(() => { S.goals.push({ id: 'gR', title: 'Write the zine', area: 'art', kind: 'milestones', milestones: [], status: 'active', startedOn: '2026-10-01', targetDate: '2026-12-01', criteria: 'Printed', manual: [] }); SH.goalId = 'gR'; A.goalCompleteYes(); });
  await page.waitForTimeout(300);
  ok('M14 No gift pops up over Rest Mode', (await page.locator('main.rest').count()) === 1 && (await page.locator('.gift-btn').count()) === 0 && (await medals()) === 4);
  await click('[data-act="restReturn"]');
  await st(() => { TAB = 'companion'; render(); });
  ok('M14b After returning, the gift is waiting in My Companion', (await page.locator('#myMilestones .medal-tile.gift').count()) >= 1);

  // Spanish
  await st(() => { S.settings.language = 'es'; applyLangAttr(); save(); render(); });
  const gal = await page.locator('#myMilestones').textContent();
  await click('#myMilestones .medal-tile.gift');
  const gs = await page.locator('.gift-stage').textContent();
  ok('M16 Gift and gallery are translated (es)', gal.includes('Mis hitos') && gs.includes('Lo lograste') && gs.includes('Toca para abrir tu regalo'));
  await page.waitForTimeout(600); await page.locator('.gift-btn').click(); await page.waitForTimeout(1900);
  const es = await page.locator('#medalView').textContent();
  ok('M16b Medal text and date are in Spanish', es.includes('Enhorabuena') && /de diciembre de 2026/.test(es) && es.includes('Ver mi informe de progreso'), es.slice(0, 160));
  await shot('md-08-medal-es');
  await st(() => { closeSheet(true); S.settings.language = 'en'; applyLangAttr(); save(); render(); });
  ok('M17 My Companion with medals fits a phone', await noH());
  await page.screenshot({ path: path.join(OUT, 'md-09-companion.png'), fullPage: true });
  await ctx.close();

  // Reduced motion
  const rctx = await mk({ reducedMotion: 'reduce' }); const rp = await rctx.newPage(); rp.on('pageerror', (e) => errors.push(e.message));
  await rp.goto('http://localhost:8770/'); await rp.evaluate((n) => { localStorage.setItem('__now', String(n)); window.__oneDayNow = n; }, Date.parse('2026-12-03T15:00:00Z'));
  await rp.evaluate(async () => {
    S = defaultState(); Object.assign(S.settings, { onboarded: true, welcomeDone: true, languageChosen: true, language: 'en', timezone: 'America/Puerto_Rico', calibrationStart: '2026-09-01' });
    growthInit(); S.goals.push({ id: 'g9', title: 'Read twelve books', area: 'mind', kind: 'milestones', milestones: [], status: 'active', startedOn: '2026-01-01', targetDate: '2026-12-31', criteria: 'Twelve finished', manual: [] }); await flush();
  });
  await rp.goto('http://localhost:8770/#plan'); await rp.waitForTimeout(400);
  await rp.evaluate(() => { SH.goalId = 'g9'; A.goalCompleteYes(); }); await rp.waitForTimeout(200);
  const still = await rp.evaluate(() => getComputedStyle(document.querySelector('.giftbox')).animationName === 'none');
  await rp.waitForTimeout(600); await rp.locator('.gift-btn').click(); await rp.waitForTimeout(80);
  ok('M15 Reduced motion: a still box and an immediate, simple reveal', still && (await rp.locator('#medalView').count()) === 1 && (await rp.evaluate(() => document.getAnimations().length)) === 0);
  await rp.screenshot({ path: path.join(OUT, 'md-10-reduced.png') });
  await rctx.close();

  ok('M99 No page errors', errors.length === 0, errors.join('; '));
  await browser.close(); srv.close();
  const failed = results.filter((r) => !r[1]);
  console.log(failed.length ? failed.length + ' FAILED' : 'ALL PASSED');
  process.exit(failed.length ? 1 : 0);
})();
