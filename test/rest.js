// Rest Mode checks, run against dist/ at iPhone width.
const { chromium, devices } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const DIST = path.join(__dirname, '..', 'dist');
const OUT = process.argv[2] || path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const types = { '.json': 'application/json', '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let p = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html'; fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); });
const results = []; const ok = (n, cond, info) => { results.push([n, !!cond]); console.log((cond ? 'PASS ' : 'FAIL ') + n + (info ? ' — ' + info : '')); };
const QUOTES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'rest-quotes.json'), 'utf8')).quotes;

(async () => {
  await new Promise((r) => srv.listen(8768, r));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ ...devices['iPhone SE'], timezoneId: 'America/New_York' });
  await ctx.addInitScript(() => { const v = localStorage.getItem('__now'); if (v) window.__oneDayNow = Number(v); });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  const st = (expr) => page.evaluate(expr);
  const setNow = async (iso) => { await page.evaluate((n) => { localStorage.setItem('__now', String(n)); window.__oneDayNow = n; }, Date.parse(iso)); };
  const shot = (n) => page.screenshot({ path: path.join(OUT, n + '.png') });
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(250); };
  const reload = async (hash) => { await page.goto('http://localhost:8768/' + (hash || '')); await page.waitForTimeout(500); };

  await page.goto('http://localhost:8768/'); await setNow('2026-10-22T14:00:00Z');
  // A set-up user with some earned growth
  await st(async () => {
    S = defaultState(); Object.assign(S.settings, { onboarded: true, welcomeDone: true, languageChosen: true, language: 'en', name: 'Mari', timezone: 'America/Puerto_Rico', calibrationStart: '2026-09-01', reminders: true, checkinTime: '08:00' });
    growthInit(); S.growth.enabled = true; S.growth.animations = true; S.growth.kind = 'garden'; S.growth.chapters[0].kind = 'garden';
    for (let i = 1; i <= 25; i++) S.growth.ledger['day:2026-10-' + String(i).padStart(2, '0') + ':' + S.growth.chapters[0].id] = { pts: 5, type: 'day', date: '2026-10-' + String(i).padStart(2, '0'), ch: S.growth.chapters[0].id };
    await flush();
  });
  await reload('#plan');
  ok('R0 Bookmarked view opens normally without a pause', (await page.locator('.tabbar').count()) === 1 && (await st('TAB')) === 'plan');
  const pts0 = await st('chapterPoints(chapter().id)');

  // Area pause: the app stays as it is
  await st(() => { S.pauses.push({ id: 'pA', scope: 'areas', areas: ['money'], start: '2026-10-22T09:00', end: '2026-10-29T09:00', tz: 'America/Puerto_Rico' }); save(); render(); });
  ok('R1 Pausing one area does not open Rest Mode', (await page.locator('.rest').count()) === 0 && (await page.locator('.tabbar').count()) === 1);
  await st(() => { S.pauses = []; save(); });

  // Full pause through the regular form, with the one-time note
  await reload('#today'); await click('[data-act="tab"][data-tab="settings"]');
  await st(() => { SET_OPEN.add('pause'); render(); }); await click('[data-act="pauseForm"]');
  await page.fill('#psEd', '2026-10-25'); await page.fill('#psEt', '09:00'); await page.check('#psNote');
  await click('[data-act="pauseSave"]');
  ok('R2 Pausing everything opens Rest Mode, regular navigation hidden', (await page.locator('main.rest').count()) === 1 && (await page.locator('.tabbar').count()) === 0 && (await page.locator('[data-act="openCheckin"], .featured, .companion').count()) === 0);
  ok('R3 Address shows #rest', (await st('location.hash')) === '#rest');
  ok('R4 Planned return shown without a countdown', /Planned return: Sunday, October 25\. There’s no need to hurry\./.test(await page.locator('.rest-foot').innerText()) && !/\bdays? left\b|countdown/i.test(await page.locator('main').innerText()));
  await shot('r1-rest-en');
  const q1 = await st('document.querySelector("#restQuote").dataset.q');
  const approved = QUOTES.filter((q) => q.status === 'approved').map((q) => q.id);
  ok('R5 Only an approved, verified quotation appears', approved.includes(q1) && (await st('REST_QUOTES.every((q) => q.status === "approved")')) && (await st('REST_QUOTES.length')) === approved.length);
  ok('R6 Author and a source link are visible', (await page.locator('.rq-author').innerText()).startsWith('—') && (await page.locator('.rq-meta a[href^="https://"]').count()) === 1 && (await page.locator('.rq-meta a').innerText()) === 'View source');
  ok('R7 Environment keeps its earned stage, drawn healthy', (await st('stageOf(chapterPoints(chapter().id))')) > 3 && (await page.locator('.rest-scene svg.comp.resting').count()) === 0 && (await page.locator('.rest-scene .caretaker, .rest-scene .gd').count()) === 1);
  ok('R8 Caretaker moves gently when motion is allowed', (await page.locator('.rest-scene .scene.anim .gd-arm').count()) === 1 && (await st('getComputedStyle(document.querySelector(".gd-arm")).animationName')) === 'gdArm');
  ok('R8b Scene has a text description and says it adds no growth', /caretaker is watering the plants\. Decorative only; it adds no growth\. Scenery: /.test(await page.locator('.rest-scene').getAttribute('aria-label')));

  // Persistence and internal links
  await reload('#settings');
  ok('R9 Refresh with a bookmarked internal page still shows Rest Mode', (await page.locator('main.rest').count()) === 1 && (await page.locator('#set-profile').count()) === 0 && (await st('location.hash')) === '#rest');
  await st(() => { location.hash = '#progress'; }); await page.waitForTimeout(300);
  ok('R10 Changing the address while resting stays in Rest Mode', (await page.locator('main.rest').count()) === 1 && (await page.locator('.tabbar').count()) === 0);
  ok('R11 Same quotation after refresh', (await st('document.querySelector("#restQuote").dataset.q')) === q1);

  // Language change: same quotation, translated and labeled
  await click('[data-act="restMenu"]');
  ok('R12 Menu has language, accessibility, pause dates, privacy and account notes', (await page.locator('#restLang').count()) === 1 && (await page.locator('[data-act="restLook"]').count()) === 1 && (await page.locator('.sheet [data-act="pauseForm"]').count()) === 1 && (await page.locator('[data-act="restPrivacy"]').count()) === 1 && (await page.locator('text=nothing to sign out of').count()) === 1);
  await shot('r2-menu-en');
  for (const [l, lbl, ready] of [['es', 'Traducido del', 'Quiero volver'], ['it', 'Tradotto da', 'Voglio tornare'], ['fr', 'Traduit d', 'Je veux revenir']]) {
    await page.selectOption('#restLang', l); await page.waitForTimeout(300);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    const qid = await st('document.querySelector("#restQuote").dataset.q');
    const q = QUOTES.find((x) => x.id === qid);
    const label = await page.locator('#restQuote').innerText();
    const pub = q.translations[l] && q.translations[l].type === 'published';
    ok(`R13-${l} Same quotation in ${l}, translation labeled`, qid === q1 && label.includes(q.text[l].split('\n')[0]) && (pub ? label.includes(q.translations[l].name) : label.includes(lbl)) && (await page.locator('.rest-return').innerText()) === ready && (await st('document.documentElement.lang')) === l);
    if (!pub) ok(`R14-${l} Original wording is available`, (await page.locator('.rq-orig p[lang="' + q.lang + '"]').count()) === 1);
    await shot('r3-rest-' + l);
    await click('[data-act="restMenu"]');
  }
  await page.selectOption('#restLang', 'en'); await page.waitForTimeout(250); await page.keyboard.press('Escape'); await page.waitForTimeout(250);

  // Every approved entry renders, with its label, in every language
  const allOk = await st(() => ['en', 'es', 'it', 'fr'].every((l) => { S.settings.language = l; return REST_QUOTES.every((q) => { const h = renderRestQuote(q); const tr = (q.translations || {})[l]; return h.includes('View source'.replace('View source', RC[l].source)) && (l === q.lang || h.includes(tr && tr.type === 'published' ? tr.name : RC[l].byApp)); }); }));
  await st(() => { S.settings.language = 'en'; });
  ok('R15 All approved quotations render with attribution and an accurate translation label in all four languages', allOk);

  // Rotation follows the saved timezone and cycles without repeats
  const seq = await st(() => { const out = []; for (let i = 0; i < REST_QUOTES.length; i++) out.push(restQuote(dAdd('2026-10-22', i)).id); return out; });
  ok('R16 Rotation cycles through every approved quotation before repeating', new Set(seq).size === seq.length);
  await setNow('2026-10-23T03:30:00Z'); // 23:30 on the 22nd in Puerto Rico, already the 23rd in UTC
  ok('R17 Day boundary follows the saved timezone', (await st('today()')) === '2026-10-22' && (await st('restQuote(today()).id')) === q1);
  await setNow('2026-10-23T04:30:00Z');
  ok('R17b After local midnight the next quotation shows', (await st('restQuote(today()).id')) !== q1);
  await setNow('2026-10-22T14:00:00Z');

  // Reduced motion: still illustration
  await page.emulateMedia({ reducedMotion: 'reduce' }); await reload();
  ok('R18 Reduced motion shows a still scene', (await page.locator('.rest-scene.anim, .rest-scene .scene.anim').count()) === 0 && (await page.locator('.rest-scene animate, .rest-scene animateTransform, .rest-scene animateMotion').count()) === 0 && (await st('getComputedStyle(document.querySelector(".gd-arm")).animationName')) === 'none' && (await page.locator('.rest-scene .gd').count()) === 1);
  await shot('r4-still');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  // Ordinary reminders suspended, nothing added during the break
  await setNow('2026-10-24T14:00:00Z'); await reload();
  ok('R19 No check-in reminder while resting', (await page.locator('text=check-in').count()) === 0 && (await st('itemsFor(today()).length')) === 0 && (await st('pausedAll("2026-10-23") && pausedAll("2026-10-24")')));
  ok('R20 Growth unchanged by the break', (await st('chapterPoints(chapter().id)')) === pts0);

  // Planned end passes: one note, once; still resting
  await setNow('2026-10-25T15:00:00Z'); await reload();
  ok('R21 After the planned end Rest Mode stays on, with the one note', (await page.locator('main.rest').count()) === 1 && (await page.locator('.rest-note').count()) === 1);
  await shot('r5-note');
  await setNow('2026-10-26T15:00:00Z'); await reload();
  ok('R22 The note is not repeated', (await page.locator('main.rest').count()) === 1 && (await page.locator('.rest-note').count()) === 0 && (await st('pauseOn("2026-10-26","money")')) !== null);

  // PIN lock and unlock keep Rest Mode (stands in for sign-in)
  ok('R23 Rest Mode survives lock and unlock', await st(async () => { const a = AUTH; AUTH = { hash: 'x', user: 'Mari', fails: 0 }; LOCKED = true; render(); const locked = !document.querySelector('main.rest'); LOCKED = false; AUTH = a; render(); return locked && !!document.querySelector('main.rest'); }));

  // Return
  await click('[data-act="restReturn"]');
  ok('R24 Returning restores navigation and opens Today', (await page.locator('.tabbar').count()) === 1 && (await st('TAB')) === 'today' && (await st('location.hash')) === '#today');
  ok('R25 Welcome message with an optional adjust action', (await page.locator('#restBack').innerText()).includes('Welcome back. Let’s start with today.') && (await page.locator('[data-act="restAdjust"]').count()) === 1);
  await shot('r6-back');
  ok('R26 No backlog, no penalty: paused days stay excluded and nothing is owed', (await st('pausedAll("2026-10-24") && pausedAll("2026-10-25")')) && (await page.locator('text=overdue').count()) === 0 && (await page.locator('text=Weekly review is ready').count()) === 0 && (await st('chapterPoints(chapter().id)')) === pts0);
  await click('[data-act="restBackClose"]');
  ok('R27 Welcome message can be dismissed', (await page.locator('#restBack').count()) === 0);

  // Returning early cancels the pending note
  await setNow('2026-11-01T14:00:00Z'); await reload();
  await st(() => { S.pauses.push({ id: 'pB', scope: 'all', areas: [], start: '2026-11-01T09:00', end: '2026-11-08T09:00', tz: 'America/Puerto_Rico', returnNote: true }); save(); render(); });
  ok('R28 Second break opens Rest Mode', (await page.locator('main.rest').count()) === 1);
  await click('[data-act="restReturn"]');
  const pB = await st('S.pauses.find((p) => p.id === "pB")');
  ok('R29 Returning early cancels the pending note and ends the pause now', pB.returnNoteCancelled === true && pB.endedEarly === true && pB.end <= '2026-11-01T10:00');
  await setNow('2026-11-08T15:00:00Z'); await reload();
  ok('R30 No note after an early return', (await page.locator('.rest-note').count()) === 0 && (await page.locator('main.rest').count()) === 0);

  ok('R33 All three scenes draw at every stage; still versions carry no animation', await st(() => ['garden', 'bonsai', 'farm'].every((k) => { for (let i = 0; i <= 14; i++) { const a = drawScene(k, i, 42, true, true), b = drawScene(k, i, 42, false, true); if (!a.includes('class="scene anim"') || b.includes('class="scene anim"') || /<animate/.test(b) || !/class="(gd|sz)/.test(a)) return false; } return true; })));
  // No horizontal scroll at 320px
  await page.setViewportSize({ width: 320, height: 640 });
  await st(() => { S.pauses.push({ id: 'pC', scope: 'all', areas: [], start: '2026-11-08T09:00', end: '2026-11-15T09:00', tz: 'America/Puerto_Rico' }); S.settings.language = 'fr'; save(); render(); });
  const w = await st('[document.documentElement.scrollWidth, innerWidth]');
  ok('R31 No horizontal scroll at 320px', w[0] <= w[1], w.join('/'));
  ok('R32 No script errors', errors.length === 0, errors.join(' | '));

  await browser.close(); srv.close();
  const failed = results.filter((r) => !r[1]);
  console.log(failed.length ? failed.length + ' FAILED' : 'ALL PASSED');
  process.exit(failed.length ? 1 : 0);
})();
