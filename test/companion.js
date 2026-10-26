// My Companion and scenery checks, run against dist/ at iPhone width.
// The device clock is set to Tokyo while the saved timezone is Puerto Rico, so any use of the
// device timezone shows up as a wrong period.
const { chromium, devices } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const DIST = path.join(__dirname, '..', 'dist');
const OUT = process.argv[2] || path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const types = { '.json': 'application/json', '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let p = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html'; fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); });
const results = []; const ok = (n, cond, info) => { results.push([n, !!cond]); console.log((cond ? 'PASS ' : 'FAIL ') + n + (info ? ' — ' + info : '')); };
const INFO_EN = [
  'A little care. A little growth.',
  'Your companion is a living illustration of the effort you’re putting into your own life. As you take small steps toward your goals, your world here grows alongside you.',
  'How does it grow?', 'Completing planned actions adds growth to your companion. Smaller versions of tasks receive a little recognition, too, and meaningful milestones bring bigger changes.',
  'You don’t need to fill your day with tasks to help it flourish. Choose a manageable plan and give it your attention.',
  'What if I miss a day?', 'Everything you’ve grown stays yours. After time away, your companion may settle into a quiet resting state. Whenever you return, you can continue from where you left off.',
  'What happens when I take a break?', 'Your companion rests with you. A little caretaker keeps your space tended while your tasks and reminders are paused. There’s nothing you need to catch up on when you return.',
  'Why a daily quote?', 'Sometimes a few thoughtful words can offer a fresh perspective. Each day brings a real, attributed quotation. Tap its source if you’d like to explore where it came from.',
  'Take what resonates with you. You don’t have to feel positive every day to belong here.',
  'Can I choose my companion?', 'Yes. Choose a bonsai, garden, or farm, whichever feels most like your own little corner of the world. Your earned progress stays with you when you switch.',
  'Why does the scenery change?', 'Your companion’s world can follow the time of day in your selected timezone and a seasonal calendar you choose. You can also select your favorite scenery manually. These changes are decorative and never reduce your progress.',
  'Let this be a place to notice your effort, enjoy your progress, and remember that small things are worth tending.'];

(async () => {
  await new Promise((r) => srv.listen(8769, r));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const mk = async (opts) => {
    const ctx = await browser.newContext({ ...devices['iPhone SE'], timezoneId: 'Asia/Tokyo', ...(opts || {}) });
    await ctx.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
    await ctx.addInitScript(() => { const v = localStorage.getItem('__now'); if (v) window.__oneDayNow = Number(v); });
    return ctx;
  };
  const ctx = await mk(); let page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  const st = (expr, arg) => page.evaluate(expr, arg);
  const setNow = async (iso) => { await page.evaluate((n) => { localStorage.setItem('__now', String(n)); window.__oneDayNow = n; }, Date.parse(iso)); };
  const shot = (n) => page.screenshot({ path: path.join(OUT, n + '.png') });
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(250); };
  // Every open asks for the PIN; these checks unlock with the test PIN unless asked not to
  const unlockP = async (pg) => { if (await pg.evaluate(() => typeof LOCKED !== 'undefined' && LOCKED)) { await pg.fill('#lkPin', '204816'); await pg.locator('[data-act="lockTry"]').click(); await pg.waitForFunction(() => !LOCKED, null, { timeout: 15000 }); await pg.waitForTimeout(250); } };
  const reload = async (hash, keepLocked) => { await page.goto('http://localhost:8769/' + (hash || '')); await page.waitForTimeout(500); if (!keepLocked) await unlockP(page); };
  const svgAttr = (sel, a) => page.locator(sel + ' svg.scene').last().getAttribute(a);
  const sync = () => st(() => { sceneSync(); return new Promise((r) => setTimeout(r, 2100)); });
  const growthSnap = () => st(() => JSON.stringify({ l: S.growth.ledger, c: S.growth.chapters.map((c) => [c.id, c.startedOn, c.seed, c.endedOn || null]), p: S.pauses, o: S.occ, k: S.checkins }));

  await page.goto('http://localhost:8769/'); await setNow('2026-10-24T10:30:00Z'); // 06:30 in Puerto Rico, 19:30 in Tokyo
  await st(async () => {
    S = defaultState(); Object.assign(S.settings, { onboarded: true, welcomeDone: true, languageChosen: true, language: 'en', name: 'Mari', timezone: 'America/Puerto_Rico', calibrationStart: '2026-09-01' });
    growthInit(); S.growth.kind = 'bonsai'; S.growth.chapters[0].kind = 'bonsai';
    for (let i = 1; i <= 14; i++) { const d = '2026-10-' + String(i).padStart(2, '0'); S.growth.ledger['day:' + d + ':' + S.growth.chapters[0].id] = { pts: 5, type: 'day', date: d, ch: S.growth.chapters[0].id }; S.checkins[d] = { mood: 3 }; }
    S.growth.ledger['ms:x'] = { pts: 8, type: 'milestone', date: '2026-10-10', ch: S.growth.chapters[0].id };
    await flush(); await createPin('204816');
  });
  await reload('#today');
  const snap0 = await growthSnap(); const pts0 = await st('chapterPoints(chapter().id)'); const stage0 = await st('stageOf(chapterPoints(chapter().id))');

  // 1. Navigation
  const tabs = await page.locator('.tabbar .tab').allTextContents();
  ok('C1 My Companion is in the main navigation', tabs.length === 6 && tabs[1].trim() === 'Companion', tabs.join(' | '));
  await click('[data-act="tab"][data-tab="companion"]');
  ok('C1b The tab opens My Companion with its scene, quote, info button and change option',
    (await page.locator('h1.view-h').textContent()) === 'My Companion' && (await st('location.hash')) === '#companion'
    && (await page.locator('.cp-scene svg.scene').count()) === 1 && (await page.locator('.cp #restQuote').count()) === 1
    && (await page.locator('[data-act="cpInfo"]').textContent()).includes('Meet your companion') && (await page.locator('[data-act="cpChange"]').count()) === 1);
  ok('C1c Quote shows its author and a discreet source link', (await page.locator('.cp .rq-author').textContent()).length > 3 && (await page.locator('.cp .rq-meta a').getAttribute('rel')).includes('noopener'));
  ok('C1d Info button is a labelled control that opens a dialog', (await page.locator('[data-act="cpInfo"]').getAttribute('aria-haspopup')) === 'dialog');
  await reload('#companion');
  ok('C1e A bookmark or reload keeps My Companion open', (await st('TAB')) === 'companion');
  await shot('cp-01-page');
  const noH = async () => st(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  ok('C1f No sideways scrolling on My Companion at phone width', await noH());

  // 2. Saved timezone, not device or server
  ok('C6 Scene uses the saved timezone (06:30 in Puerto Rico is dawn; the device in Tokyo says 19:30)', (await svgAttr('.cp-scene', 'data-tod')) === 'dawn');
  await st(() => { S.settings.timezone = 'Asia/Tokyo'; save(); });
  await sync();
  ok('C6b Changing the saved timezone recalculates the scene without a reload', (await svgAttr('.cp-scene', 'data-tod')) === 'sunset' && (await page.locator('.cp-scene svg.scene').count()) === 1);
  await st(() => { S.settings.timezone = 'America/Puerto_Rico'; save(); render(); });

  // 3. Environments and switching
  for (const k of ['bonsai', 'garden', 'farm']) {
    await st((k) => { chapter().kind = k; render(); }, k);
    const okk = (await page.locator(`.cp-scene[data-scene^="${k}|"] svg.scene`).count()) === 1;
    await page.locator('.cp-scene').screenshot({ path: path.join(OUT, `cp-02-${k}.png`) });
    ok('C2 ' + k + ' renders on My Companion', okk && errors.length === 0, errors.join('; '));
  }
  await st(() => { chapter().kind = 'bonsai'; save(); render(); });
  await click('[data-act="cpChange"]');
  ok('C3a Change companion shows all three at the same stage', (await page.locator('.cp-kind').count()) === 3 && (await page.locator('.sheet').textContent()).includes('stage ' + (stage0 + 1) + ' of 15'));
  await shot('cp-03-change');
  await click('.cp-kind[data-kind="farm"]');
  ok('C3 Switching kind keeps the same growth and an equivalent stage; nothing is reset',
    (await st('chapter().kind')) === 'farm' && (await st('chapterPoints(chapter().id)')) === pts0 && (await st('stageOf(chapterPoints(chapter().id))')) === stage0 && (await growthSnap()) === snap0);
  await click('[data-act="cpChange"]'); await click('.cp-kind[data-kind="garden"]');
  ok('C3b Switching again still keeps everything', (await st('chapter().kind')) === 'garden' && (await growthSnap()) === snap0);

  // 4. Info panel
  await click('[data-act="cpInfo"]');
  const infoTxt = (await page.locator('#cpInfoPanel').textContent()) + (await page.locator('.sheet .h2').textContent());
  ok('C4 Panel shows Mari’s exact copy', INFO_EN.every((p) => infoTxt.includes(p)), INFO_EN.filter((p) => !infoTxt.includes(p)).join(' / '));
  ok('C4b Panel scrolls on a phone', await st(() => { const s = document.querySelector('.sheet'); return s.scrollHeight > s.clientHeight && getComputedStyle(s).overflowY !== 'visible'; }));
  await shot('cp-04-info');
  const facts = await st(() => {
    const orig = itemsFor; const d = '2020-01-01';
    itemsFor = () => [{ status: 'done', kind: 'task' }]; const done = dayCredit(d);
    itemsFor = () => [{ status: 'modified', kind: 'task' }]; const smaller = dayCredit(d);
    itemsFor = orig;
    return { done, smaller, ms: BONUS.milestone, goal: BONUS.goal, restAfter: (() => { const c = companionState(); return typeof c.resting === 'boolean'; })() };
  });
  ok('C4c Panel matches the app: actions grow it, smaller versions a little, milestones more', facts.done === 2 && facts.smaller === 1 && facts.ms > facts.done && facts.goal > facts.ms, JSON.stringify(facts));
  await click('.sheet [data-act="closeSheet"]');

  // 5. Quote matches Rest Mode, and stays the same across languages
  const qCp = await page.locator('.cp #restQuote').getAttribute('data-q');
  await st(() => { S.pauses.push({ id: 'pR', scope: 'all', start: localNow(tz()).slice(0, 10) + 'T00:00', end: '2026-11-07T09:00', tz: tz(), returnNote: false }); save(); render(); });
  ok('C5 The same quote shows in My Companion and in Rest Mode', (await page.locator('main.rest #restQuote').getAttribute('data-q')) === qCp);
  ok('C8r Rest Mode uses the same companion, growth and scenery', (await page.locator('main.rest .rest-scene').getAttribute('data-scene')).startsWith('garden|' + stage0 + '|')
    && (await svgAttr('main.rest .rest-scene', 'data-key')) === (await st('lookKey(sceneLook())')) && (await page.locator('main.rest .gd').count()) === 1 && (await page.locator('[data-act="restReturn"]').count()) === 1);
  await click('[data-act="restMenu"]');
  ok('C8m Rest menu keeps the info panel and the scenery settings within reach', (await page.locator('.sheet [data-act="cpInfo"]').count()) === 1 && (await page.locator('.sheet [data-act="cpScenerySheet"]').count()) === 1);
  await click('.sheet [data-act="cpScenerySheet"]');
  await click('.sheet #scMatch'); await click('.sheet [data-group="scTod"][data-val="night"]');
  await page.waitForTimeout(2100);
  ok('C8s Changing scenery from Rest Mode updates the rest scene in place', (await svgAttr('main.rest .rest-scene', 'data-tod')) === 'night' && (await page.locator('main.rest .rest-scene svg.scene').count()) === 1);
  await shot('cp-05-rest-scenery');
  await click('.sheet [data-act="closeSheet"]');
  await page.locator('main.rest .rest-scene').screenshot({ path: path.join(OUT, 'cp-05b-rest-night.png') });
  ok('C14r Nothing in Rest Mode created growth', (await st('JSON.stringify(S.growth.ledger)')) === JSON.stringify(JSON.parse(snap0).l));
  for (const L of ['es', 'it', 'fr']) {
    await st((L) => { S.settings.language = L; applyLangAttr(); save(); render(); }, L);
    ok('C5' + L + ' Language change keeps the same quote (' + L + ')', (await page.locator('#restQuote').getAttribute('data-q')) === qCp && (await page.locator('#restQuote blockquote').getAttribute('lang')) === L);
  }
  await st(() => { S.settings.language = 'en'; applyLangAttr(); S.pauses = []; S.growth.scenery.matchTime = true; save(); TAB = 'companion'; render(); });

  // 7. Manual choices persist
  await click('#scMatch');
  await click('[data-group="scTod"][data-val="sunset"]');
  await click('[data-group="scSeasons"][data-val="manual"]');
  await click('[data-group="scSeason"][data-val="winter"]');
  await page.waitForTimeout(2100);
  await reload('#companion');
  ok('C7 Manual time and season choices persist after a reload', (await svgAttr('.cp-scene', 'data-tod')) === 'sunset' && (await svgAttr('.cp-scene', 'data-season')) === 'winter'
    && (await page.locator('[data-group="scTod"][data-val="sunset"]').getAttribute('aria-pressed')) === 'true' && !(await page.locator('#scMatch').isChecked()));
  await setNow('2026-10-25T02:30:00Z');
  await sync();
  ok('C7b A manual period stays put when the clock moves on', (await svgAttr('.cp-scene', 'data-tod')) === 'sunset');
  await setNow('2026-10-24T10:30:00Z');

  // 6. Seasons: neutral until set, both calendars
  await st(() => { S.growth.scenery.seasons = 'auto'; S.growth.scenery.calendar = null; S.growth.scenery.matchTime = true; save(); render(); });
  ok('C6n Automatic without a calendar asks for one and stays neutral', (await svgAttr('.cp-scene', 'data-season')) === 'none' && (await page.locator('#cpScenery [role="status"]').count()) === 1);
  await click('[data-group="scCal"][data-val="north"]'); await page.waitForTimeout(2100);
  const north = await svgAttr('.cp-scene', 'data-season');
  await click('[data-group="scCal"][data-val="south"]'); await page.waitForTimeout(2100);
  const south = await svgAttr('.cp-scene', 'data-season');
  ok('C8 Both calendars work: October is fall in the north, spring in the south', north === 'fall' && south === 'spring', north + ' / ' + south);
  const table = await st(() => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => seasonAt(m, 'north')[0] + seasonAt(m, 'south')[0]).join(' '));
  ok('C8b Month table matches the spec for both calendars', table === 'ws ws sf sf sf sw sw sw fs fs fs ws', table);
  ok('C8c Hemisphere is never guessed from the timezone', await st(() => { S.settings.timezone = 'Australia/Sydney'; S.growth.scenery.calendar = null; const a = sceneLook().season; S.settings.timezone = 'America/Puerto_Rico'; return a === null; }));
  ok('C8d Seasons explain they are calendar themes, not weather or astronomy', (await page.locator('#cpScenery').textContent()).includes('not weather or astronomy'));

  // 7. Tropical
  const trop = await st(() => {
    const bad = []; for (const kind of ['garden', 'bonsai', 'farm']) for (const tod of TODS) for (const season of [null, ...SEASONS]) for (const snow of [false, true]) {
      const h = drawScene(kind, 9, 7, true, true, { tod, season, trop: true, snow });
      if (/sc-flake|sc-snowbank|sc-frost|sc-pine|sc-leaves|data-snow/.test(h) || !/sc-palm-tree/.test(h) || !/sc-hibiscus/.test(h)) bad.push(kind + ' ' + tod + ' ' + season + ' ' + snow);
    }
    return bad;
  });
  ok('C9 Tropical never shows snow, frost or bare trees, and always has palms and hibiscus', trop.length === 0, trop.slice(0, 4).join('; '));
  await st(() => { Object.assign(S.growth.scenery, { seasons: 'manual', season: 'winter', tropical: false, snow: true }); save(); render(); });
  ok('C9b Snow is optional and only in non-tropical winter', (await page.locator('.cp-scene .sc-flake').count()) > 0);
  await click('#scTrop'); await page.waitForTimeout(2100);
  ok('C9c Turning tropical on removes snow and frost and hides the snow option', (await page.locator('.cp-scene .sc-flake, .cp-scene .sc-frost').count()) === 0 && (await page.locator('#scSnow').count()) === 0);
  await page.locator('.cp-scene').screenshot({ path: path.join(OUT, 'cp-06-tropical-winter.png') });

  // 8. All 16 combinations, in every environment
  const combos = await st(() => {
    const bad = []; const keys = new Set();
    for (const kind of ['garden', 'bonsai', 'farm']) for (const tod of TODS) for (const season of SEASONS) {
      const h = drawScene(kind, 10, 7, true, true, { tod, season });
      keys.add(lookKey({ tod, season }));
      const need = { night: /sc-moon/, dawn: /sc-sun/, day: /sc-sun/, sunset: /sc-sun/ }[tod];
      const sea = { spring: /sc-blossom/, summer: /sc-full/, fall: /sc-fall"/, winter: /sc-pine/ }[season];
      if (!need.test(h) || !sea.test(h) || !h.includes(`data-tod="${tod}"`) || !h.includes(`data-season="${season}"`) || (tod !== 'night' && /sc-moon/.test(h))) bad.push(kind + ' ' + tod + ' ' + season);
    }
    return { bad, n: keys.size };
  });
  ok('C10 All 16 time and season combinations draw, each with its own details', combos.bad.length === 0 && combos.n === 16, combos.bad.join('; '));
  const contrast = await st(() => {
    const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
    const bg = (el) => { while (el) { const b = getComputedStyle(el).backgroundColor; if (b && !/rgba\(0, 0, 0, 0\)|transparent/.test(b)) return b; el = el.parentElement; } return 'rgb(255,255,255)'; };
    const out = [];
    for (const sel of ['.cp h1.view-h', '.cp-stage .small', '#cpScenery .small b', '.cp #restQuote blockquote p']) { const el = document.querySelector(sel); const a = lum(getComputedStyle(el).color), b = lum(bg(el)); out.push(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(1)); }
    return out;
  });
  ok('C10b Text stays readable whatever the scene shows (contrast ≥ 4.5)', contrast.every((x) => Number(x) >= 4.5), contrast.join(', '));

  // 9. Midnight, period and season boundaries, DST, returning later
  await st(() => { Object.assign(S.growth.scenery, { matchTime: true, seasons: 'auto', calendar: 'north', tropical: false, snow: false }); S.settings.timezone = 'America/Puerto_Rico'; save(); render(); });
  await setNow('2026-10-24T20:59:00Z'); await sync(); const b1 = await svgAttr('.cp-scene', 'data-tod'); // 16:59
  await setNow('2026-10-24T21:00:00Z'); await sync(); const b2 = await svgAttr('.cp-scene', 'data-tod'); // 17:00
  ok('C11 Period boundary: 16:59 is daytime, 17:00 is sunset', b1 === 'day' && b2 === 'sunset', b1 + ' → ' + b2);
  await setNow('2027-03-01T03:59:00Z'); await sync(); const m1 = [await svgAttr('.cp-scene', 'data-tod'), await svgAttr('.cp-scene', 'data-season')]; // Feb 28 23:59
  await setNow('2027-03-01T04:00:30Z'); await sync(); const m2 = [await svgAttr('.cp-scene', 'data-tod'), await svgAttr('.cp-scene', 'data-season')]; // Mar 1 00:00
  ok('C11b Midnight into March: winter night becomes spring night', m1.join() === 'night,winter' && m2.join() === 'night,spring', m1 + ' → ' + m2);
  await st(() => { S.settings.timezone = 'America/New_York'; save(); });
  await setNow('2026-03-08T12:30:00Z'); await sync(); const d1 = await svgAttr('.cp-scene', 'data-tod'); // 08:30 EDT (07:30 if DST were ignored)
  await setNow('2026-11-01T12:30:00Z'); await sync(); const d2 = await svgAttr('.cp-scene', 'data-tod'); // 07:30 EST (08:30 if DST were ignored)
  ok('C11c DST is handled: 08:30 the morning clocks spring forward is daytime; 07:30 after they fall back is dawn', d1 === 'day' && d2 === 'dawn', d1 + ' / ' + d2);
  await st(() => { S.settings.timezone = 'America/Puerto_Rico'; save(); });
  await setNow('2026-10-24T13:00:00Z'); await sync();
  await setNow('2026-10-25T00:30:00Z'); // 20:30 next visit
  await st(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); return new Promise((r) => setTimeout(r, 2100)); });
  ok('C11d Coming back to the app recalculates the scene', (await svgAttr('.cp-scene', 'data-tod')) === 'night');
  await page.close();
  page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:8769/#companion'); await page.waitForTimeout(500); await unlockP(page);
  await page.evaluate((n) => { localStorage.setItem('__now', String(n)); }, Date.parse('2026-10-25T11:00:00Z')); // 07:00 next morning
  await page.reload(); await page.waitForTimeout(600); await unlockP(page);
  ok('C12 Reopening the app after it was closed shows the right scene straight away', (await page.locator('.cp-scene svg.scene').last().getAttribute('data-tod')) === 'dawn' && (await page.locator('.cp-scene svg.scene').count()) === 1, await page.evaluate(() => [TAB, location.hash, window.__oneDayNow, localNow(tz())].join()));

  // 14. Nothing visual changes growth
  ok('C14 Opening the page, switching, changing the scenery and reading the quote added no growth', (await page.evaluate(() => JSON.stringify({ l: S.growth.ledger, c: S.growth.chapters.map((c) => [c.id, c.startedOn, c.seed, c.endedOn || null]), p: S.pauses, o: S.occ, k: S.checkins }))) === snap0
    && (await page.evaluate(() => chapterPoints(chapter().id))) === pts0);
  ok('C14b Scenery code never touches growth, rewards or pauses', !/ledger|growthAward|pauses|checkins|occ\b/.test(await page.evaluate(() => [sceneLook, sceneSync, A.scBox, renderSceneryControls, sceneryChanged].map(String).join('\n'))));

  // Today links here
  await page.goto('http://localhost:8769/#today'); await page.waitForTimeout(400);
  await page.locator('.comp-btn').click(); await page.waitForTimeout(250);
  ok('C15 The companion on Today opens My Companion', await page.evaluate(() => TAB === 'companion'));

  // Translations
  for (const L of ['es', 'it', 'fr']) {
    await page.evaluate((L) => { S.settings.language = L; applyLangAttr(); S.growth.scenery.seasons = 'auto'; S.growth.scenery.calendar = 'north'; save(); render(); }, L);
    const txt = await page.locator('main').textContent();
    const tabsL = await page.locator('.tabbar .tab span').evaluateAll((els) => els.every((e) => e.scrollWidth <= e.clientWidth + 1 && e.getBoundingClientRect().height < 30));
    const enLeft = ['Match companion', 'Scenery', 'Seasons', 'Meet your companion', 'Change companion', 'growth so far', 'Northern calendar', 'Tropical scenery'].filter((w) => txt.includes(w));
    ok('C16' + L + ' My Companion is fully translated (' + L + ')', enLeft.length === 0 && (await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)) && tabsL, enLeft.join(', ') + ' tabsfit=' + tabsL);
    await page.screenshot({ path: path.join(OUT, `cp-07-${L}.png`), fullPage: true });
    await page.locator('[data-act="cpInfo"]').click(); await page.waitForTimeout(300);
    const heads = await page.locator('#cpInfoPanel h3').allTextContents();
    ok('C16' + L + 'i Info panel is translated (' + L + ')', heads.length === 6 && !heads.some((h) => /\b(How|What|Why|Can I)\b/.test(h)) && (await page.locator('#cpInfoPanel').getAttribute('lang')) === L, heads.join(' | '));
    if (L === 'es') await page.screenshot({ path: path.join(OUT, 'cp-08-info-es.png') });
    await page.locator('.sheet [data-act="closeSheet"]').click(); await page.waitForTimeout(300);
  }
  await page.evaluate(() => { S.settings.language = 'en'; applyLangAttr(); save(); render(); });
  await ctx.close();

  // Reduced motion: still pictures, changes apply at once
  const rctx = await mk({ reducedMotion: 'reduce' }); const rp = await rctx.newPage(); rp.on('pageerror', (e) => errors.push(e.message));
  await rp.goto('http://localhost:8769/'); await rp.evaluate((n) => { localStorage.setItem('__now', String(n)); window.__oneDayNow = n; }, Date.parse('2026-10-24T13:00:00Z'));
  await rp.evaluate(async () => {
    S = defaultState(); Object.assign(S.settings, { onboarded: true, welcomeDone: true, languageChosen: true, language: 'en', timezone: 'America/Puerto_Rico', calibrationStart: '2026-09-01' });
    growthInit(); Object.assign(S.growth.scenery, { seasons: 'manual', season: 'spring' }); await flush(); await createPin('204816');
  });
  await rp.goto('http://localhost:8769/#companion'); await rp.waitForTimeout(500); await unlockP(rp);
  const still = await rp.evaluate(() => { const s = document.querySelector('.cp-scene svg.scene'); return !s.classList.contains('anim') && !s.querySelector('.sc-fall') && document.getAnimations().length === 0; });
  await rp.locator('[data-group="scSeason"][data-val="fall"]').click(); await rp.waitForTimeout(60);
  const instant = await rp.evaluate(() => document.querySelectorAll('.cp-scene svg.scene').length === 1 && document.querySelector('.cp-scene svg.scene').dataset.season === 'fall');
  ok('C13 Reduced motion: static scenery and immediate changes', still && instant);
  await rctx.close();

  ok('C99 No page errors', errors.length === 0, errors.join('; '));
  await browser.close(); srv.close();
  const failed = results.filter((r) => !r[1]);
  console.log(failed.length ? failed.length + ' FAILED' : 'ALL PASSED');
  process.exit(failed.length ? 1 : 0);
})();
