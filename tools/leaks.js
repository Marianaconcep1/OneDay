// Walks every tab and every sheet in demo mode for one language, and lists English text left on screen
const { chromium, devices } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const DIST = path.join(__dirname, '..', 'dist');
const LNG = process.argv[2] || 'es';
const srv = http.createServer((q, r) => { let p = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html'; fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200); r.end(d); }); });
(async () => {
  await new Promise((r) => srv.listen(8766, r));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const ctx = await browser.newContext({ ...devices['iPhone SE'], reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { window.__oneDayNow = Date.parse('2026-10-22T23:30:00Z'); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8766/'); await p.waitForTimeout(400);
  const EN = require('./strings.json').map((x) => x.s).filter((x) => !/\{\d+\}/.test(x));
  await p.evaluate((en) => { window.__EN = new Set(en.filter((x) => !I18N[x] || I18N[x][0] !== x)); }, EN);
  await p.evaluate(async (l) => { S.settings.language = l; S.settings.languageChosen = true; S.settings.welcomeDone = true; S.settings.onboarded = true; S.settings.name = 'Ana'; S.settings.calibrationStart = today(); await flush(); await A.enterDemo(); S.settings.language = l; await flush(); render(); }, LNG);
  await p.waitForTimeout(400);
  const leaks = new Map();
  const scan = async (where) => {
    const found = await p.evaluate(() => {
      const STOP = /(?<![\p{L}’'])(the|and|your|you|is|are|this|that|with|for|of|to|in|on|not|it|be|can|will|or|an|from|by|at|as|what|when|how|day|days|today|week|planned|logged|recorded)(?![\p{L}’'])/giu;
      const out = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n; while ((n = w.nextNode())) {
        const el = n.parentElement; if (!el || el.closest('textarea,script,style,[lang]:not(html),[data-raw]')) continue;
        if (el.closest('[hidden]')) continue;
        const s = n.nodeValue.replace(/\s+/g, ' ').trim(); if (!s || !/[a-z]{2}/i.test(s)) continue;
        const hits = (s.match(STOP) || []).length;
        if (hits >= 2 || (I18N[s] && trText(s) === s && I18N[s][0] !== s) || (window.__EN && window.__EN.has(s))) out.push(s);
      }
      for (const el of document.querySelectorAll('[aria-label],[placeholder]')) { if (el.closest('[lang]:not(html)')) continue; for (const a of ['aria-label', 'placeholder']) { const v = el.getAttribute(a); if (v && ((v.match(/(?<![\p{L}])(the|and|your|you|this|with|for|of|to|or)(?![\p{L}])/giu) || []).length >= 2)) out.push('@' + a + ': ' + v); } }
      return out;
    });
    for (const s of found) { if (!leaks.has(s)) leaks.set(s, where); }
  };
  const SKIP = new Set(['tab', 'closeSheet', 'confirmOk', 'exitDemo', 'enterDemo', 'lockNow', 'pick', 'tzPick', 'chartTip', 'langPick', 'welOpen', 'welBegin', 'setupSave', 'obNext', 'obBack', 'csv', 'exportJson', 'msCheck', 'timerHide', 'timerStop']);
  for (const tab of ['today', 'plan', 'progress', 'mindset', 'settings']) {
    await p.evaluate((t) => { TAB = t; if (t === 'settings') ['profile', 'schedule', 'notify', 'look', 'companion', 'pause', 'data', 'privacy', 'delete'].forEach((k) => SET_OPEN.add(k)); render(); $$('details').forEach((d) => (d.open = true)); }, tab);
    await p.waitForTimeout(150); await scan(tab);
    const acts = await p.evaluate((skip) => [...new Set($$('#main [data-act]').map((e) => e.dataset.act + '|' + (e.dataset.key || e.dataset.id || e.dataset.k || e.dataset.open || '')))].filter((a) => !skip.includes(a.split('|')[0])), [...SKIP]);
    for (const a of acts.slice(0, 80)) {
      const [act, key] = a.split('|');
      await p.evaluate((t) => { TAB = t; render(); $$('details').forEach((d) => (d.open = true)); }, tab);
      const sel = `#main [data-act="${act}"]` + (key ? `[data-key="${key}"],#main [data-act="${act}"][data-id="${key}"],#main [data-act="${act}"][data-k="${key}"],#main [data-act="${act}"][data-open="${key}"]` : '');
      try { await p.locator(sel).first().click({ timeout: 800 }); } catch (e) { continue; }
      await p.waitForTimeout(150);
      await scan(tab + ' › ' + act);
      // one level deeper inside a sheet
      const inner = await p.evaluate((skip) => [...new Set($$('.sheet [data-act]').map((e) => e.dataset.act))].filter((x) => !skip.includes(x)).slice(0, 6), [...SKIP]);
      for (const ia of inner) { try { await p.locator(`.sheet [data-act="${ia}"]`).first().click({ timeout: 500 }); await p.waitForTimeout(120); await scan(tab + ' › ' + act + ' › ' + ia); } catch (e) { } }
      await p.evaluate(() => { if ($('.sheet')) closeSheet(true); if (LOCKED) { LOCKED = false; } });
    }
  }
  const arr = [...leaks.entries()];
  fs.writeFileSync(path.join(__dirname, `leaks-${LNG}.txt`), arr.map(([s, w]) => w + '\t' + s).join('\n'));
  console.log(LNG, arr.length, 'possible leaks; errors:', errs.length, errs.slice(0, 3).join(' | '));
  await browser.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
