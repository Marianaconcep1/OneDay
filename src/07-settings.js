/* ---------- Settings ---------- */
const TZ_LIST = ['America/Puerto_Rico', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Santo_Domingo', 'America/Bogota', 'America/Mexico_City', 'Europe/Madrid', 'UTC'];
const inFrame = (() => { try { return window.top !== window; } catch (e) { return true; } })();
function setSect(id, title, sub, body, open) {
  return `<details class="sect" id="set-${id}" ${SET_OPEN.has(id) ? 'open' : ''}><summary><span class="grow"><b>${title}</b><br><span class="small muted">${sub}</span></span></summary><div class="sect-body">${body}</div></details>`;
}
const SET_OPEN = new Set(['profile']);
document.addEventListener('toggle', (e) => { const d = e.target; if (d.id && d.id.startsWith('set-')) { const k = d.id.slice(4); if (d.open) SET_OPEN.add(k); else SET_OPEN.delete(k); } }, true);
function renderSettings() {
  const s = S.settings;
  const modeText = { indexeddb: 'IndexedDB in this browser', localstorage: 'localStorage in this browser', memory: 'Memory only. Changes will be lost when this page closes.' }[Store.mode];
  let h = `<header class="topbar"><div><div class="eyebrow">${esc(s.name || 'One Day')}</div><h1 class="view-h">Settings</h1></div></header><div class="stack">`;
  const SL = SETUP[s.language] || SETUP.en;
  if (SH.tzSel == null) SH.tzSel = s.timezone;
  h += setSect('profile', t('set.profile'), AUTH && AUTH.hash ? 'PIN lock on' : 'Name, timezone, language, PIN', `
      <label class="f">${t('set.name')}<input class="inp" id="stName" maxlength="60" value="${esc(s.name)}" placeholder="${esc(SL.namePh)}"></label>
      <div id="stNameErr" class="field-err" role="alert"></div>
      <div class="f"><span>${t('set.tz')}</span>${tzPicker('stTz', SH.tzSel, SL)}<span class="hint">Days you’ve already recorded keep their dates if you change this.</span></div>
      <label class="f">${t('set.lang')}<select class="inp" id="stLang">${APP_LANGS.map(([k, n]) => `<option value="${k}" lang="${k}" ${s.language === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <button class="btn primary sm" data-act="settingsSave">${t('btn.save')}</button>
      <div class="stack-s"><div class="h3">PIN lock</div>${renderSecurity()}</div>`, true);
  h += setSect('schedule', t('set.schedule'), 'Check-in time, weekly review, available time', `
      <div class="grid2"><label class="f">Evening check-in<input class="inp" id="stCi" type="time" value="${esc(s.checkinTime)}"></label>
      <label class="f">Weekly review day<select class="inp" id="stRv">${[0, 1, 2, 3, 4, 5, 6].map((d) => `<option value="${d}" ${s.reviewDay === d ? 'selected' : ''}>${DOW_SHORT[d]}</option>`).join('')}</select></label></div>
      <label class="f">Suggest a smaller task after this many skips<input class="inp num" id="stSkip" type="number" min="2" max="8" value="${esc(s.skipThreshold)}"><span class="hint">A product rule of thumb, not a scientific threshold. Suggestions appear only in the weekly review and need your OK.</span></label>
      <button class="btn primary sm" data-act="scheduleSave">${t('btn.save')}</button>
      <div class="stack-s" id="sect-avail"><div class="h3">Available time per day</div><p class="small muted">Minutes you can realistically give these areas, including training. Leave blank if you don’t know yet.</p>
      ${DOW_ORDER.map((d) => `<label class="row-between"><span>${DOW_SHORT[d]}</span><input class="inp num" style="max-width:140px" id="av${d}" type="number" min="0" max="900" placeholder="Unknown" value="${esc(s.availability[d] == null ? '' : s.availability[d])}"></label>`).join('')}
      <label class="f">Typical workday notes<input class="inp" id="avNote" maxlength="200" value="${esc(s.workdayNote)}" placeholder="e.g. Work 8–5, free after 6"></label>
      <button class="btn sm" data-act="availSave">Save available time</button></div>
      <div class="row-between"><span class="small">${plural(activeGoals().length, 'active goal')}. Areas: ${AREAS.map((a) => t('area.' + a)).join(' · ')}</span><button class="btn sm" data-act="goPlan" data-open="goals">Goals</button></div>`);
  h += setSect('notify', t('set.notify'), s.reminders ? 'In-app check-in reminder on' : 'Off', `
      <label class="row" style="min-height:44px;gap:10px"><input type="checkbox" id="stRem" ${s.reminders ? 'checked' : ''} style="width:22px;height:22px" data-act="remToggle"> Show a check-in reminder inside the app</label>
      <p class="small">This reminder appears only while the app is open, and never during a pause. The app can’t notify you when it’s closed; for that, set a repeating iPhone alarm or Reminder for ${esc(fmtTime(s.checkinTime))}.</p>
      <p class="tiny muted">Email and text reminders aren’t available in this version. They need a server and a verified address, so none are set or simulated.</p>`);
  h += setSect('look', t('set.look'), esc(lookSummary()), `<p class="small">Background, font, text color, theme, dimming, blur, text size and motion. You see a preview before anything is saved.</p><button class="btn primary sm" data-act="lookOpen">Personalize</button>`);
  h += setSect('companion', t('set.companion'), S.growth.enabled ? esc(KINDS[chapter().kind]) + ' on Today' : 'Hidden', renderCompanionSettings());
  h += setSect('pause', t('set.pause'), currentPause() ? 'Paused now' : upcomingPause() ? 'Pause scheduled' : 'For trips, illness or a break', renderPauseSettings());
  h += setSect('data', t('set.data'), 'Backup, restore and exports', `
      <div class="small stack-s"><p><b>Where it lives:</b> ${esc(modeText)}${DEMO ? ' (demo data, kept separately)' : ''}.</p>
      ${inFrame ? '<p><b>Preview note:</b> this copy runs inside a preview frame. Use the hosted, installed version for daily use, and back up often.</p>' : ''}
      <p class="muted">${lastSaveOk ? 'Last saved ' + esc(new Date(S.updatedAt).toLocaleString(locale(), { timeZone: tz() })) + '.' : 'The last save failed. Export a backup now.'}${S.lastBackup ? ' Last backup ' + esc(dMD(S.lastBackup)) + '.' : ' No backup yet.'}</p></div>
      <div class="btn-row"><button class="btn primary" data-act="exportJson">Back up (JSON)</button><button class="btn" data-act="importOpen">Restore from backup</button></div>
      <p class="tiny muted">Backups include goals, pauses and companion growth. They don’t include your PIN or your own background photo.</p>
      <details class="more"><summary>Spreadsheet exports (CSV)</summary><div class="btn-row mt-s">
        <button class="btn sm" data-act="csv" data-k="tx">Money entries</button><button class="btn sm" data-act="csv" data-k="tasks">Task log</button><button class="btn sm" data-act="csv" data-k="train">Training log</button><button class="btn sm" data-act="csv" data-k="checkins">Check-ins</button></div></details>
      <button class="btn" data-act="openReport">Copy weekly report for ChatGPT</button>`);
  h += setSect('privacy', t('set.privacy'), 'What stays on this device', `<div class="small stack-s">
      <p>Your records stay on this device, in this browser. They don’t sync to other devices. There is no online account, no tracking, no analytics and no bank connection.</p>
      <p>Clearing this browser’s website data can erase them, and private browsing may not keep them. Back up regularly.</p>
      <p>The PIN lock keeps the app private from casual viewing. It doesn’t encrypt the stored records; anyone with full access to this phone’s browser data could still read them.</p>
      <p class="muted">This is a single-person app, so there are no other users and no administrator. A shared, multi-user version would need a server with sign-in and roles.</p></div>`);
  h += renderLaterImprovements();
  h += `<section class="card stack-s"><div class="h3">${t('set.demo')}</div><p class="small muted">Explore the app with clearly labeled sample data. Your real records are kept apart and untouched.</p>
      ${DEMO ? '<button class="btn sm" data-act="exitDemo">Exit demo</button>' : '<button class="btn sm" data-act="enterDemo">Open demo mode</button>'}</section>`;
  h += `<section class="card stack-s"><div class="h3">${t('set.about')}</div><p class="small">One Day keeps a daily loop: a specific next action, a quick log, a two-minute evening check-in and a short weekly review. Feedback is rule-based and shown openly. It isn’t therapy, financial advice or athletic coaching.</p><button class="btn sm" data-act="openLetter">${t('set.letter')}</button></section>`;
  h += DEMO ? `<button class="btn ghost danger" data-act="eraseAll">Reset demo data</button>` : setSect('delete', t('set.delete'), 'Erase everything on this device', `<p class="small">Deletes every record, goal, pause, companion growth, your PIN and your background photo from this device. It can’t be undone. Export a backup first if you might want it.</p>
      <label class="f">Type DELETE to confirm<input class="inp" id="delConfirm" autocomplete="off" autocapitalize="characters"></label>
      <button class="btn ghost danger" data-act="eraseAll">Delete everything</button>`);
  return h + '</div>';
}
A.settingsSave = () => {
  const s = S.settings; const z = SH.tzSel || s.timezone;
  if (!validTz(z)) { toast('That timezone isn’t recognized.'); return; }
  const name = val('stName').replace(/\s+/g, ' ').trim();
  if (!name) { const i = $('#stName'); i.classList.add('invalid'); i.setAttribute('aria-invalid', 'true'); $('#stNameErr').textContent = (SETUP[s.language] || SETUP.en).nameErr; i.focus(); return; }
  const oldTz = s.timezone;
  s.name = name; s.timezone = z; s.language = $('#stLang').value; s.languageChosen = true; SH.tzSel = null;
  if ($('#stCi')) A.scheduleSave(true);
  applyLook(); save(); render(); toast(oldTz !== z ? 'Saved. Recorded days keep their dates.' : 'Saved.');
};
A.scheduleSave = (quiet) => {
  const s = S.settings; s.checkinTime = val('stCi') || '21:00'; s.reviewDay = Number($('#stRv').value); s.skipThreshold = Math.min(8, Math.max(2, numOrNull(val('stSkip')) || 3));
  if (quiet !== true) { save(); render(); toast('Saved.'); }
};
A.availSave = () => { for (const d of DOW_ORDER) S.settings.availability[d] = numOrNull(val('av' + d)); S.settings.workdayNote = val('avNote'); save(); render(); toast('Available time saved.'); };
A.remToggle = (el) => { setTimeout(() => { S.settings.reminders = $('#stRem').checked; save(); }, 0); };

/* Files: download where allowed; always offer copy as a fallback */
function offerFile(name, mime, text, title) {
  let downloaded = false;
  try {
    const blob = new Blob([text], { type: mime }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000); downloaded = !inFrame;
  } catch (e) { }
  openSheet(() => `${sheetHead(title, esc(name))}
    <p class="small">${downloaded ? 'The file should be in your Downloads (on iPhone: Files › Downloads). If not, copy the text below and save it in Notes or Files.' : 'If no download started, copy the text below and save it somewhere safe, such as a note or a file in iCloud Drive.'}</p>
    <textarea class="inp" id="fileText" readonly style="min-height:180px;font-family:ui-monospace,Menlo,monospace;font-size:12px">${esc(text)}</textarea>
    <button class="btn primary" data-act="copyText" data-src="fileText">${t('btn.copy')}</button>`);
}
A.exportJson = () => {
  flush();
  const data = Object.assign({}, S, { exportedAt: nowISO() });
  offerFile(`one-day-backup-${today()}.json`, 'application/json', JSON.stringify(data, null, 1), 'Backup');
  S.lastBackup = today(); save();
};
const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\n');
A.csv = (el) => {
  const k = el.dataset.k; let rows;
  if (k === 'tx') rows = [['id', 'date', 'type', 'amount', 'category', 'account', 'from', 'to', 'note']].concat(S.money.tx.slice().sort((a, b) => (a.date < b.date ? -1 : 1)).map((x) => [x.id, x.date, x.type, (x.amount / 100).toFixed(2), x.category || '', (acct(x.account) || {}).name || '', (acct(x.from) || {}).name || '', (acct(x.to) || {}).name || '', x.note || '']));
  else if (k === 'tasks') rows = [['id', 'date', 'kind', 'planned_title', 'planned_finish', 'planned_minutes', 'status', 'actual_minutes', 'reason', 'output', 'note']].concat(Object.values(S.occ).sort((a, b) => (a.date < b.date ? -1 : 1)).map((o) => [o.id, o.date, o.kind, o.planned && o.planned.title, o.planned && o.planned.finish, o.planned && o.planned.minutes, o.status, o.minutes, o.reason ? reasonLabel(o.reason) : '', o.output, o.note]));
  else if (k === 'train') rows = [['date', 'planned_type', 'planned_minutes', 'planned_distance', 'status', 'actual_type', 'minutes', 'distance', 'effort_1_5', 'symptoms', 'reason', 'note']].concat(Object.values(S.training.logs).sort((a, b) => (a.date < b.date ? -1 : 1)).map((l) => [l.date, l.planned && l.planned.type, l.planned && l.planned.minutes, l.planned && l.planned.distance, l.status, l.actualType, l.minutes, l.distance, l.effort, l.symptoms ? 'yes' : '', l.reason ? reasonLabel(l.reason) : '', l.note]));
  else rows = [['date', 'mood_1_5', 'energy_1_5', 'emotions', 'contributed', 'response', 'credit', 'submitted', 'updated']].concat(Object.values(S.checkins).sort((a, b) => (a.date < b.date ? -1 : 1)).map((c) => [c.date, c.mood, c.energy, (c.emotions || []).join('; '), c.contributed, [c.responseChoice, c.response].filter(Boolean).join(' — '), c.credit, c.submittedAt, c.updatedAt]));
  offerFile(`one-day-${k}-${today()}.csv`, 'text/csv', csv(rows), 'CSV export');
};
A.importOpen = () => {
  SH.imp = null;
  openSheet(() => `${sheetHead('Restore from backup', 'Replaces the data on this device')}
    <label class="f">Choose a backup file<input class="inp" id="impFile" type="file" accept="application/json,.json"></label>
    <label class="f">Or paste the backup text<textarea class="inp" id="impText" style="min-height:120px;font-family:ui-monospace,Menlo,monospace;font-size:12px"></textarea></label>
    <button class="btn" data-act="importCheck">Check backup</button><div id="impOut"></div>`);
  $('#impFile').addEventListener('change', (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { $('#impText').value = r.result; A.importCheck(); }; r.readAsText(f); });
};
A.importCheck = () => {
  const out = $('#impOut'); let o;
  try { o = JSON.parse($('#impText').value); } catch (e) { out.innerHTML = '<div class="banner warn small">This isn’t valid JSON. Make sure the whole backup was copied.</div>'; return; }
  const errs = validateState(o);
  if (errs.length) { out.innerHTML = `<div class="banner warn small"><b>This backup can’t be restored</b><ul style="margin:0;padding-left:18px">${errs.map((e) => '<li>' + esc(e) + '</li>').join('')}</ul></div>`; return; }
  SH.imp = o;
  const n = (x) => Object.keys(x || {}).length;
  out.innerHTML = `<div class="card tint stack-s"><b>Backup looks good</b><p class="small">Exported ${esc(o.exportedAt ? new Date(o.exportedAt).toLocaleString(locale()) : 'at an unknown time')}. Contains ${o.money.tx.length} money entries, ${n(o.occ)} task records, ${n(o.training.logs)} training logs, ${n(o.checkins)} check-ins, ${n(o.reviews)} weekly reviews.</p>
    <p class="small"><b>Restoring replaces everything currently on this device.</b> Restoring the same backup twice won’t create duplicates.</p><button class="btn accent" data-act="importDo">Replace my data with this backup</button></div>`;
};
A.importDo = () => {
  const o = SH.imp; if (!o) return;
  confirmBox('Replace all data on this device with the backup? Consider backing up the current data first.', 'Replace data', async () => {
    delete o.exportedAt;
    S = normalize(o); await flush(); applyTheme(); TAB = 'today'; render(); toast('Backup restored.');
  }, true);
};
A.eraseAll = () => {
  if (!DEMO && val('delConfirm').toUpperCase() !== 'DELETE') { const i = $('#delConfirm'); if (i) i.classList.add('invalid'); toast('Type DELETE to confirm.'); return; }
  confirmBox(DEMO ? 'Reset the demo data?' : 'Delete every record, your PIN and your photo from this device? This can’t be undone.', DEMO ? 'Reset demo' : 'Delete everything', async () => {
    if (DEMO) { S = demoState(); await flush(); render(); return; }
    AUTH = null; await saveAuth(); await Store.del(BG_KEY); BG_DATA = null;
    S = defaultState(); await flush(); applyLook(); ONB = { step: 1 }; WEL = { stage: 'closed' }; SETUP_DRAFT = null; render();
  }, true);
};
A.enterDemo = async () => { await flush(); DEMO = true; const d = await Store.get(DEMO_KEY); S = d && !validateState(d).length ? normalize(d) : demoState(); await flush(); RETURN_GAP = 0; TAB = 'today'; render(); window.scrollTo(0, 0); toast('Demo mode. Sample data only.'); };
A.exitDemo = async () => { await flush(); DEMO = false; S = normalize((await Store.get(REAL_KEY)) || defaultState()); applyTheme(); TAB = 'today'; render(); window.scrollTo(0, 0); toast('Back to your data.'); };

/* ---------- Onboarding (short; deeper setup happens one area at a time) ---------- */
let ONB = { step: 1 };
function renderOnboarding() {
  const s = S.settings;
  if (!s.welcomeDone) return renderWelcome();
  if (ONB.step <= 1) return renderProfileSetup();
  const n = ONB.step; const C = OC();
  const h15 = (x) => new Intl.NumberFormat(locale()).format(x) + ' h';
  const mins = [['15', '15 min'], ['30', '30 min'], ['45', '45 min'], ['60', h15(1)], ['90', h15(1.5)], ['120', h15(2) + '+'], ['', C.notSure]];
  const wd = s.availability[1] == null ? '' : String(s.availability[1]); const we = s.availability[6] == null ? '' : String(s.availability[6]);
  const steps = {
    2: `<h1 class="h2">${esc(C.timeH)}</h1><p class="small muted">${esc(C.timeSub)}</p>
      <div class="stack-s"><div class="h3">${esc(C.wd)}</div>${chips('obWd', mins, wd)}</div>
      <div class="stack-s"><div class="h3">${esc(C.we)}</div>${chips('obWe', mins, we)}</div>
      <label class="f">${esc(C.note)} <span class="hint">${esc(C.opt)}</span><input class="inp" id="obNote" maxlength="200" value="${esc(s.workdayNote)}" placeholder="${esc(C.notePh)}"></label>`,
    3: `<h1 class="h2">${esc(C.ciH)}</h1><p class="small muted">${esc(C.ciSub)}</p><label class="f">${esc(C.ciLab)}<input class="inp" id="obCi" type="time" value="${esc(s.checkinTime)}"></label>`,
    4: `<h1 class="h2">${esc(C.focusH)}</h1><p class="small muted">${esc(C.focusSub)}</p>${chips('obFocus', AREAS.map((a) => [a, C.focus[a]]), s.focus)}`,
    5: `<h1 class="h2">${esc(C.areasH)}</h1><p class="small muted">${esc(C.areasSub)}</p>
      <div class="area-list">${AREAS.map((a) => `<div class="area"><span class="dot ${a}"></span><div class="area-body"><span class="area-name">${t('area.' + a)}</span><span class="small">${esc(C.areas[a])}</span></div></div>`).join('')}</div>
      <p class="small">${esc(C.calib)} ${t('calib')}</p>`
  };
  return `<main class="wrap" lang="${lang()}">${onbTop()}<div class="onb"><div class="steps" aria-hidden="true">${[1, 2, 3, 4, 5].map((i) => `<span class="${i <= n ? 'on' : ''}"></span>`).join('')}</div>
    <div class="stack">${steps[n]}</div>
    <div class="btn-row">${n > 1 ? `<button class="btn" data-act="obBack">${t('btn.back')}</button>` : ''}<button class="btn primary" data-act="obNext">${n === 5 ? esc(C.start) : t('btn.next')}</button></div>
    </div></main>`;
}
function obCapture() {
  const s = S.settings; const n = ONB.step;
  if (n === 2) { const wd = getPick('obWd'), we = getPick('obWe'); for (const d of [1, 2, 3, 4, 5]) s.availability[d] = wd ? Number(wd) : null; for (const d of [0, 6]) s.availability[d] = we ? Number(we) : null; s.workdayNote = val('obNote'); }
  if (n === 3) s.checkinTime = val('obCi') || '21:00';
  if (n === 4) s.focus = getPick('obFocus') || 'money';
  return true;
}
A.obBack = () => { obCapture(); ONB.step--; S.settings.onbStep = ONB.step; save(); render(); window.scrollTo(0, 0); };
A.obNext = () => {
  if (!obCapture()) return;
  if (ONB.step < 5) { ONB.step++; S.settings.onbStep = ONB.step; save(); render(); window.scrollTo(0, 0); return; }
  const td = today();
  S.settings.areasConfirmed = true; S.settings.onboarded = true; S.settings.calibrationStart = td; S.settings.lastOpened = td;
  S.weeks[weekStart(td)] = { main: S.settings.focus, mainOutcome: '', maintain: AREAS.filter((a) => a !== S.settings.focus), confirmedAt: nowISO() };
  if (!S.business.block.versions.length) pushVersion(S.business.block, { days: [1, 2, 3, 4, 5], minutes: 15 }, td);
  if (!S.tasks.some((x) => x.area === 'art')) { const a = { id: uid('task'), area: 'art', createdAt: nowISO(), versions: [] }; const AT = OC().art; pushVersion(a, { title: AT[0], finish: AT[1], minutes: 5, minTitle: AT[2], minMinutes: 1, medium: 'drawing', days: [0, 1, 2, 3, 4, 5, 6], date: null, cue: '' }, td); S.tasks.push(a); }
  save(); TAB = 'today'; render(); window.scrollTo(0, 0);
};

/* ---------- Demo data (only ever stored under the separate demo key) ---------- */
function demoState() {
  const real = S;
  const st = defaultState();
  S = st; // helpers below read S
  const td = today();
  const s = st.settings; s.onboarded = true; s.areasConfirmed = true; s.name = 'Demo'; s.calibrationStart = dAdd(td, -12); s.lastOpened = td;
  s.availability = { 0: 90, 1: 45, 2: 45, 3: 45, 4: 45, 5: 45, 6: 120 };
  st.demo = true;
  pushVersion(st.business.block, { days: [1, 2, 3, 4, 5], minutes: 15 }, dAdd(td, -20));
  const art = { id: 'task_demo_art', area: 'art', createdAt: nowISO(), versions: [] };
  pushVersion(art, { title: '5 minutes of drawing', finish: 'Any marks made. Unfinished is fine.', minutes: 5, minTitle: '1 minute of drawing', minMinutes: 1, medium: 'drawing', days: [0, 1, 2, 3, 4, 5, 6], date: null, cue: '' }, dAdd(td, -20));
  st.tasks.push(art);
  st.business.who = 'Sample: small local service businesses'; st.business.problem = 'Sample: they have data in spreadsheets but no clear weekly view';
  st.business.stage = 'validating'; st.business.outcome4w = 'Sample: three conversations with potential clients';
  st.business.weekly[weekStart(td)] = 'Sample: a one-paragraph offer I could send';
  BIZ_EXAMPLES.slice(0, 5).forEach((e, i) => st.business.actions.push({ id: 'act_demo_' + i, title: e[0], finish: e[1], minutes: e[2], category: e[3], connection: st.business.weekly[weekStart(td)], minTitle: 'Five minutes on the same task', order: i + 1, createdAt: nowISO(), doneOn: null }));
  const days = { 0: { type: 'long', minutes: 70, distance: 6, detail: 'Sample long run' }, 1: { type: 'rest', minutes: 0 }, 2: { type: 'easy', minutes: 30, distance: 3 }, 3: { type: 'strength', minutes: 30 }, 4: { type: 'easy', minutes: 30, distance: 3 }, 5: { type: 'rest', minutes: 0 }, 6: { type: 'mobility', minutes: 20 } };
  st.training.templates.push({ id: 'tpl_demo', from: dAdd(td, -20), days });
  st.money.accounts.push({ id: 'ac_demo_chk', name: 'Checking (sample)', kind: 'checking' }, { id: 'ac_demo_sav', name: 'Savings (sample)', kind: 'savings' });
  st.money.balances.push({ id: 'bal_d1', accountId: 'ac_demo_chk', amount: 84250, date: dAdd(td, -3), createdAt: nowISO() }, { id: 'bal_d2', accountId: 'ac_demo_sav', amount: 30000, date: dAdd(td, -10), createdAt: nowISO() });
  st.money.incomes.push({ id: 'inc_d1', name: 'Paycheck (sample)', amount: 150000, date: dAdd(td, 6), received: false });
  st.money.bills.push({ id: 'bill_d1', name: 'Phone (sample)', kind: 'bill', amount: 6500, due: dAdd(td, 3), repeat: 'monthly' }, { id: 'bill_d2', name: 'Card minimum (sample)', kind: 'minimum', minimum: null, amount: null, due: dAdd(td, 4), repeat: 'monthly' }, { id: 'bill_d3', name: 'Groceries (sample)', kind: 'essential', amount: 12000, due: null, repeat: 'once' });
  st.money.buffer.amount = 100000;
  st.money.tx.push({ id: 'tx_d_tr', date: dAdd(td, -5), type: 'transfer', amount: 5000, from: 'ac_demo_chk', to: 'ac_demo_sav', note: 'Sample transfer', createdAt: nowISO() });
  const pattern = ['done', 'done', 'modified', 'skipped', 'done', 'done', 'modified', 'done', 'skipped', 'done'];
  for (let i = 10; i >= 1; i--) {
    const ds = dAdd(td, -i); const p = pattern[i - 1];
    if (i === 6 || i === 7) continue; // a gap: nothing recorded, nothing owed
    for (const it of itemsFor(ds)) {
      if (it.kind === 'spend') { if (p !== 'skipped') { st.money.tx.push({ id: 'tx_d' + i, date: ds, type: 'expense', amount: 1200 + i * 137, category: EXP_CATS[i % 5], note: '', createdAt: nowISO() }); setSpendDay(ds, 'complete'); } continue; }
      if (it.kind === 'train') { const ty = it.session.type; setTrainLog(ds, ty === 'rest' ? { status: 'rest', actualType: 'rest' } : p === 'skipped' ? { status: 'skipped', reason: 'time' } : p === 'modified' ? { status: 'modified', actualType: ty, minutes: 15, distance: isRun(ty) ? 1.5 : null, effort: 2 } : { status: 'completed', actualType: ty, minutes: it.session.minutes, distance: it.session.distance || null, effort: 3 }); continue; }
      if (it.kind === 'biz' && it.needsAction) continue;
      upsertOcc(it, ds, { status: p, minutes: p === 'modified' ? 5 : null, reason: p === 'skipped' ? (i % 2 ? 'time' : 'lowmot') : p === 'modified' ? 'large' : null, output: it.kind === 'biz' && p === 'done' ? 'Sample note' : '' });
    }
    if (p !== 'skipped') st.checkins[ds] = { id: 'ci@' + ds, date: ds, mood: i % 3 ? 3 : null, energy: (i % 4) + 1, emotions: i % 2 ? ['Tired'] : ['Calm'], contributed: '', response: '', credit: '', submittedAt: nowISO(), updatedAt: nowISO() };
  }
  st.business.results.push({ id: 'res_d1', type: 'Inquiry', date: dAdd(td, -2), amount: null, note: 'Sample inquiry', createdAt: nowISO() });
  S = real || st;
  return st;
}

/* ---------- Boot ---------- */
function onClick(e) {
  const el = e.target.closest('[data-act]');
  if (!el || !el.dataset.act) return;
  const fn = A[el.dataset.act];
  if (!fn) return;
  if (el.tagName === 'BUTTON' || el.tagName === 'A') e.preventDefault();
  if (el.tagName === 'INPUT' && el.type === 'checkbox') { fn(el, e); return; }
  if (el.disabled) return;
  // Guard against accidental double taps creating duplicate records
  const now = Date.now();
  if (!NO_GUARD.has(el.dataset.act) && el._last && now - el._last < 400) return;
  el._last = now;
  fn(el, e);
}
const NO_GUARD = new Set(['pick', 'ciStep', 'tab', 'planWeek', 'progWeek', 'progRange', 'progMonth', 'chartTip', 'pinShow', 'obNext', 'obBack', 'closeSheet']);
let lastDay = null;
async function boot() {
  await Store.open();
  await loadAuth(); await loadBgImage();
  let st = null;
  try { st = await Store.get(REAL_KEY); } catch (e) { st = null; }
  if (st && validateState(st).length) { await Store.set('state-unreadable-' + Date.now(), st); st = null; }
  S = st ? normalize(st) : defaultState();
  const td = today();
  RETURN_GAP = S.settings.onboarded && S.settings.lastOpened ? dDiff(S.settings.lastOpened, td) : 0;
  if (S.settings.onboarded) S.settings.lastOpened = td;
  if (RETURN_GAP >= 3 && !S.returns.some((r) => r.date === td)) S.returns.push({ date: td, missed: RETURN_GAP - 1 });
  lastDay = td;
  ONB.step = S.settings.onbStep || 1;
  if (!S.settings.welcomeDone && S.settings.envOpened) WEL = { stage: 'letter' };
  applyLangAttr();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
  applyTheme(); render();
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('.sheet')) A.closeSheet(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { flush(); if (AUTH && AUTH.hash && AUTH.lockOnHide && !LOCKED) lockNow(); } else dayCheck(); });
  for (const ev of ['pointerdown', 'keydown', 'scroll']) document.addEventListener(ev, () => { lastActivity = Date.now(); }, { passive: true, capture: true });
  document.addEventListener('keydown', (e) => { if (LOCKED && e.key === 'Enter' && e.target && e.target.id === 'lkPin') A.lockTry(); });
  setInterval(autoLockTick, 15000);
  if (window.matchMedia) { try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyLook(LOOK_DRAFT || undefined)); } catch (e) { } }
  window.addEventListener('pagehide', () => flush());
  setInterval(dayCheck, 30000);
  save();
  if ('serviceWorker' in navigator && !inFrame && location.protocol === 'https:') { navigator.serviceWorker.register('sw.js').catch(() => { }); }
}
/* Re-render when the calendar day changes in the user's timezone (e.g. at midnight) */
function dayCheck() {
  const td = today();
  if (td !== lastDay) { lastDay = td; if (S.settings.onboarded) S.settings.lastOpened = td; save(); if (!$('.sheet') && !LOCKED) render(); }
}
