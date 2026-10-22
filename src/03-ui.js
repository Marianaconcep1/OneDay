/* ---------- UI shell ---------- */
let TAB = 'today';
let SH = {};            // transient sheet state
let sheetRender = null; // function returning sheet HTML
const A = {};           // click actions, keyed by data-act
let RETURN_GAP = 0;

const ICONS = {
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></svg>',
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
  progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 19V11M12 19V6M19 19v-5"/></svg>',
  mindset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V11"/><path d="M12 11c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6Z"/><path d="M12 14c0-3-2.2-5-5-5 0 3 2.2 5 5 5Z"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>'
};

function render() {
  const root = $('#app');
  if (LOCKED) { root.innerHTML = renderLock(); return; }
  if (!S.settings.onboarded) { root.innerHTML = renderOnboarding(); bindSetup(); return; }
  const views = { today: renderToday, plan: renderPlan, progress: renderProgress, mindset: renderMindset, settings: renderSettings };
  root.innerHTML =
    (DEMO ? '<div class="wrap" style="padding-bottom:0"><div class="demo-flag">Demo mode: sample data only. Your real data is untouched. <button class="btn ghost sm" data-act="exitDemo" style="min-height:32px;color:inherit;text-decoration:underline">Exit demo</button></div></div>' : '') +
    '<main class="wrap" id="main">' + views[TAB]() + '</main>' +
    '<nav class="tabbar" aria-label="Main">' + ['today', 'plan', 'progress', 'mindset', 'settings'].map((k) =>
      `<button class="tab" data-act="tab" data-tab="${k}" ${TAB === k ? 'aria-current="page"' : ''}>${ICONS[k]}<span>${t('tab.' + k)}</span></button>`).join('') + '</nav>' +
    renderTimerBar();
  if (TAB === 'settings') bindTzPicker('stTz', () => SH.tzSel, SETUP[S.settings.language] || SETUP.en);
}
A.tab = (el) => { TAB = el.dataset.tab; render(); window.scrollTo(0, 0); };

function toast(msg) {
  const old = $('.toast'); if (old) old.remove();
  const d = document.createElement('div'); d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = msg;
  document.body.appendChild(d); setTimeout(() => d.remove(), 2600);
}

/* Sheets: bottom panels for logging and forms */
function openSheet(fn, opts = {}) {
  closeSheet(true);
  sheetRender = fn;
  const scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.dataset.act = opts.lock ? '' : 'closeSheet';
  const sh = document.createElement('div'); sh.className = 'sheet' + (opts.full ? ' full' : ''); sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true');
  sh.innerHTML = '<div class="sheet-inner">' + fn() + '</div>';
  document.body.append(scrim, sh);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => { scrim.classList.add('on'); sh.classList.add('on'); const f = sh.querySelector('[autofocus]'); if (f && !opts.noFocus) f.focus({ preventScroll: true }); });
}
function refreshSheet() { const sh = $('.sheet'); if (sh && sheetRender) { const top = sh.scrollTop; sh.querySelector('.sheet-inner').innerHTML = sheetRender(); sh.scrollTop = top; } }
function closeSheet(instant) {
  const sh = $('.sheet'), sc = $('.scrim');
  if (!sh) return;
  sheetRender = null;
  if (SH.onClose) { const f = SH.onClose; SH.onClose = null; f(); }
  document.body.style.overflow = '';
  if (instant) { sh.remove(); sc && sc.remove(); return; }
  sh.classList.remove('on'); sc && sc.classList.remove('on');
  setTimeout(() => { sh.remove(); sc && sc.remove(); }, 230);
}
A.closeSheet = () => { closeSheet(); render(); };
function sheetHead(title, sub) {
  return `<div class="sheet-head"><div><div class="h2">${title}</div>${sub ? `<div class="muted small">${sub}</div>` : ''}</div><button class="x" data-act="closeSheet" aria-label="${t('btn.close')}">×</button></div>`;
}

/* In-page confirmation (the app avoids browser dialogs) */
function confirmBox(message, okLabel, onOk, danger) {
  SH.confirmFn = onOk;
  openSheet(() => `${sheetHead('Please confirm')}<p>${message}</p><div class="btn-row"><button class="btn" data-act="closeSheet">${t('btn.cancel')}</button><button class="btn ${danger ? 'accent' : 'primary'}" data-act="confirmOk">${okLabel}</button></div>`);
}
A.confirmOk = () => { const f = SH.confirmFn; SH.confirmFn = null; closeSheet(true); f && f(); };

/* Chip groups read from the DOM; no re-render needed when tapping */
function chips(group, options, selected, multi, cls) {
  const sel = multi ? (selected || []) : [selected];
  return `<div class="chips" role="group">${options.map(([v, l]) => `<button type="button" class="chip ${cls || ''}" data-act="pick" data-group="${group}" data-val="${esc(v)}" ${multi ? 'data-multi="1"' : ''} aria-pressed="${sel.includes(v) ? 'true' : 'false'}">${esc(l)}</button>`).join('')}</div>`;
}
function seg(group, options, selected) {
  return `<div class="seg" role="group">${options.map(([v, l]) => `<button type="button" class="chip" data-act="pick" data-group="${group}" data-val="${esc(v)}" aria-pressed="${selected === v ? 'true' : 'false'}">${esc(l)}</button>`).join('')}</div>`;
}
function dayPicker(group, days) {
  return `<div class="daypick">${DOW_ORDER.map((d) => `<button type="button" class="chip" data-act="pick" data-group="${group}" data-val="${d}" data-multi="1" aria-pressed="${(days || []).includes(d) ? 'true' : 'false'}" aria-label="${DOW_SHORT[d]}">${DOW_LETTER[d]}</button>`).join('')}</div>`;
}
const getPick = (g, root = document) => { const el = root.querySelector(`[data-group="${g}"][aria-pressed="true"]`); return el ? el.dataset.val : null; };
const getPicks = (g, root = document) => $$(`[data-group="${g}"][aria-pressed="true"]`, root).map((e) => e.dataset.val);
A.pick = (el) => {
  const g = el.dataset.group;
  if (el.dataset.multi) el.setAttribute('aria-pressed', el.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
  else {
    const was = el.getAttribute('aria-pressed') === 'true';
    $$(`[data-group="${g}"]`).forEach((b) => b.setAttribute('aria-pressed', 'false'));
    if (!(was && el.closest('[data-toggleable]'))) el.setAttribute('aria-pressed', 'true');
  }
  if (SH.onPick) SH.onPick(g, getPick(g), el);
};
const val = (id) => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
const numOrNull = (s) => { if (s === '' || s == null) return null; const n = Number(s); return Number.isFinite(n) && n >= 0 ? n : null; };
function show(id, on) { const e = document.getElementById(id); if (e) e.hidden = !on; }

/* ---------- Timer (always optional) ---------- */
let timerTick = null;
function renderTimerBar() {
  clearInterval(timerTick);
  if (!S.timer) return '';
  timerTick = setInterval(() => { const c = $('#timerClock'); if (c) c.textContent = clockText(); }, 1000);
  return `<div class="timerbar"><div class="in"><div class="grow">${esc(S.timer.label)}</div><span class="clock" id="timerClock">${clockText()}</span><button class="btn sm" data-act="timerStop">Stop & log</button><button class="btn sm" data-act="timerHide" aria-label="Discard timer">×</button></div></div>`;
}
function clockText() { if (!S.timer) return ''; const s = Math.max(0, Math.floor((nowMs() - S.timer.startedAt) / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
A.timerHide = () => { S.timer = null; save(); render(); toast('Timer discarded. The task is still marked started.'); };
A.timerStop = () => {
  const tm = S.timer; S.timer = null; save(); render();
  const mins = Math.max(1, Math.round((nowMs() - tm.startedAt) / 60000));
  if (tm.key === 'train') openTrainLog(tm.date, mins); else openLog(tm.key, tm.date, mins);
};

/* ---------- Status helpers ---------- */
function pill(it) { return `<span class="pill ${pillClass(it.status)}">${esc(itemStatusLabel(it))}</span>`; }
const REASONS = [['forgot', 'Forgot'], ['unclear', 'Task unclear'], ['large', 'Too large'], ['time', 'Time conflict'], ['lowmot', 'Low motivation'], ['emotional', 'Emotional strain'], ['physical', 'Fatigue/illness/pain'], ['priorities', 'Priorities changed'], ['other', 'Other'], ['prefer', 'Prefer not to say']];
const reasonLabel = (r) => trText((REASONS.find((x) => x[0] === r) || [, ''])[1]);
const BIZ_CATS = ['Customer learning', 'Offer', 'Outreach/sales', 'Delivery/portfolio', 'Content', 'Administration', 'Planning'];
const BIZ_EXAMPLES = [
  ['Write three sentences describing one customer problem', 'Three sentences in my notes', 15, 'Customer learning'],
  ['Draft the three bullets explaining your dashboard service', 'Three bullets saved in a draft', 15, 'Offer'],
  ['Identify one suitable potential customer', 'One business name and why it fits', 15, 'Outreach/sales'],
  ['Draft one outreach message', 'A message ready to send', 15, 'Outreach/sales'],
  ['Build one chart for a portfolio example using public data', 'One chart exported or screenshotted', 15, 'Delivery/portfolio'],
  ['Draft one educational post tied to a customer problem', 'A draft of 100–150 words', 15, 'Content'],
  ['Improve the pricing section of the proposal', 'The section rewritten and saved', 15, 'Offer']
];
const VAGUE = /^(work on|do|think about|start|business|stuff|things|plan)\b/i;

/* ---------- Today ---------- */
function calibrationDay() { const c = S.settings.calibrationStart; if (!c) return null; const n = dDiff(c, today()) + 1; return n >= 1 && n <= 7 ? n : null; }
function featuredItem(items) {
  if (nowHM() >= S.settings.checkinTime && !S.checkins[today()] && !pausedAll(today())) return { checkin: true };
  const open = items.filter((it) => !isClosed(it.status) && !it.unplanned && !it.paused && !(it.kind === 'train' && it.session && it.session.type === 'rest'));
  if (!open.length) return null;
  const focus = S.settings.focus;
  const order = { business: 1, training: 2, money: 3, art: 4 };
  open.sort((a, b) => {
    if ((a.status === 'started') !== (b.status === 'started')) return a.status === 'started' ? -1 : 1;
    if ((a.area === focus) !== (b.area === focus)) return a.area === focus ? -1 : 1;
    if (a.kind === 'spend' && b.area === 'money') return 1;
    if (b.kind === 'spend' && a.area === 'money') return -1;
    return (order[a.area] || 9) - (order[b.area] || 9);
  });
  return open[0];
}
function itemButtons(it, featured) {
  const b = [];
  const cls = featured ? '' : ' sm';
  if (it.kind === 'spend') {
    b.push(`<button class="btn primary${cls}" data-act="openSpend" data-date="${it.date}">${t('btn.log')}</button>`);
    if (!txOn(it.date).some((x) => x.type === 'expense') && spendStatus(it.date) !== 'none') b.push(`<button class="btn${cls}" data-act="noSpend" data-date="${it.date}">${t('spend.none')}</button>`);
    return b.join('');
  }
  if (it.kind === 'biz' && it.needsAction) return `<button class="btn primary${cls}" data-act="newAction" data-date="${it.date}">Choose an action</button>`;
  if (it.kind === 'train') {
    if (it.session && it.session.type === 'rest') {
      if (!isClosed(it.status)) b.push(`<button class="btn primary${cls}" data-act="restFollowed" data-date="${it.date}">Rest day followed</button>`);
      b.push(`<button class="btn${cls}" data-act="trainLog" data-date="${it.date}">${t('btn.log')}</button>`);
      return b.join('');
    }
    if (!isClosed(it.status) && it.status !== 'started') b.push(`<button class="btn primary${cls}" data-act="trainStart" data-date="${it.date}">${t('btn.start')}</button>`);
    b.push(`<button class="btn${it.status === 'started' ? ' primary' : ''}${cls}" data-act="trainLog" data-date="${it.date}">${t('btn.log')}</button>`);
    if (!isClosed(it.status)) b.push(`<button class="btn ghost${cls}" data-act="trainEasier" data-date="${it.date}">Make starting easier</button>`);
    return b.join('');
  }
  if (it.area === 'art' && !isClosed(it.status)) {
    b.push(`<button class="btn primary${cls}" data-act="quickDone" data-key="${it.key}" data-date="${it.date}">Did it</button>`);
    b.push(`<button class="btn${cls}" data-act="openLog" data-key="${it.key}" data-date="${it.date}">${t('btn.log')}</button>`);
    if (!it.smaller && it.minTitle) b.push(`<button class="btn ghost${cls}" data-act="smallerOne" data-key="${it.key}" data-date="${it.date}">1-minute version</button>`);
    return b.join('');
  }
  if (!isClosed(it.status) && it.status !== 'started') b.push(`<button class="btn primary${cls}" data-act="startItem" data-key="${it.key}" data-date="${it.date}">${t('btn.start')}</button>`);
  b.push(`<button class="btn${it.status === 'started' ? ' primary' : ''}${cls}" data-act="openLog" data-key="${it.key}" data-date="${it.date}">${t('btn.log')}</button>`);
  if (!isClosed(it.status) && !it.smaller && it.minTitle) b.push(`<button class="btn ghost${cls}" data-act="smallerOne" data-key="${it.key}" data-date="${it.date}">Smaller version</button>`);
  return b.join('');
}
function itemMeta(it) {
  const bits = [];
  if (it.minutes != null && it.kind !== 'spend') bits.push(minsLabel(it.minutes));
  if (it.category) bits.push(esc(it.category));
  if (it.smaller && it.plannedTitle) bits.push('Smaller version of: ' + esc(it.plannedTitle));
  return bits.join(' · ');
}

function renderToday() {
  const td = today();
  const items = itemsFor(td);
  const dm = dayMinutes(td);
  const f = featuredItem(items);
  let h = `<header class="topbar"><div><div class="eyebrow">${esc(dFmt(td, { weekday: 'long' }))}</div><h1 class="date-h">${esc(dFmt(td, { month: 'long', day: 'numeric', year: 'numeric' }))}</h1>${mainOutcomeLine(td)}</div></header><div class="stack-l">`;

  const fullPause = pausedAll(td);
  h += renderPauseToday(td);
  h += mindsetNotice();
  if (RETURN_GAP >= 3 && S.dismissed.returnOn !== td && !currentPause() && !S.pauses.some((p) => p.resumedOn === td)) {
    h += `<section class="banner pink"><div class="h3">${t('welcome.back')}</div><p class="small">Nothing from the days in between needs to be filled in. Your history and progress are still here.</p>
      <div class="btn-row"><button class="btn primary sm" data-act="returnContinue">Continue the current plan</button><button class="btn sm" data-act="makeSmaller">Make today smaller</button><button class="btn ghost sm" data-act="returnReview">Review what no longer fits</button></div></section>`;
  }
  const cd = calibrationDay();
  if (cd) h += `<section class="banner"><div class="row-between"><div class="h3">Calibration · day ${cd} of 7</div></div><p class="small">${t('calib')} Log what actually happens. Targets stay where they are this week.</p>${firstWeekQuestions()}</section>`;
  h += firstWeekBanner(td);
  if (S.settings.reminders && !currentPause() && nowHM() >= S.settings.checkinTime && !S.checkins[td]) h += `<section class="banner pink"><div class="h3">${esc(t('ci.reminder', { time: fmtTime(S.settings.checkinTime) }))}</div></section>`;
  if (reviewDue()) h += `<section class="banner"><div class="h3">Weekly review is ready</div><p class="small">10–15 minutes to adjust next week. One change at most.</p><div><button class="btn primary sm" data-act="openReview">Start review</button></div></section>`;

  // Featured next action
  if (f && f.checkin) {
    h += `<section class="featured" aria-label="${t('today.next')}"><div class="eyebrow">${t('today.next')}</div><div class="ft-title">Evening check-in</div><div class="ft-meta">About two minutes. Everything you logged today is already filled in.</div><div class="btn-row"><button class="btn primary" data-act="openCheckin">Start check-in</button></div></section>`;
  } else if (f) {
    h += `<section class="featured" aria-label="${t('today.next')}"><div class="eyebrow">${t('today.next')} · ${t('area.' + f.area)}</div><div class="ft-title">${esc(f.title)}</div>
      ${f.finish ? `<div class="ft-meta">Done when: ${esc(f.finish)}</div>` : ''}<div class="ft-meta">${itemMeta(f) || (f.kind === 'spend' ? 'About 2 min' : '')}${f.status === 'started' ? ' · Started' : ''}</div>
      ${f.cue ? `<div class="ft-meta">Cue: ${esc(f.cue)}</div>` : ''}${towardLine(f, true)}
      <div class="btn-row">${itemButtons(f, true)}</div>${f.kind === 'spend' || (f.session && f.session.type === 'rest') ? '' : `<div class="row"><button class="btn sm ghost-light" data-act="feelFirst" data-key="${esc(f.key)}" data-date="${f.date}">How am I feeling?</button><button class="btn sm ghost-light" data-act="stuck" data-key="${esc(f.key)}" data-date="${f.date}">I’m stuck</button></div>`}</section>`;
  } else if (!fullPause) {
    h += `<section class="featured"><div class="eyebrow">${t('today.next')}</div><div class="ft-title">${items.length > 1 ? t('today.allset') : t('today.available')}</div><div class="ft-meta">${S.checkins[td] ? 'Check-in saved. Tomorrow is previewed below.' : 'When you’re ready, close the day with the check-in.'}</div></section>`;
  }

  // Time budget
  if (!fullPause) {
  const pct = dm.avail ? Math.min(100, Math.round(dm.total / dm.avail * 100)) : 0;
  h += `<section class="budget"><div class="row-between small"><span><b class="num">${minsLabel(dm.total)}${dm.unknown ? '+' : ''}</b> planned today${dm.unknown ? ' (some times not set)' : ''}</span><span class="muted num">${dm.avail == null ? `<button class="btn ghost sm" data-act="setAvail" data-dow="${dDow(td)}">Set available time</button>` : minsLabel(dm.avail) + ' available'}</span></div>
    ${dm.avail != null ? `<div class="meter ${dm.over ? 'over' : ''}"><span style="width:${pct}%"></span></div>` : ''}
    ${dm.over ? `<div class="banner warn"><div class="h3">Your plan needs an adjustment.</div><p class="small">Planned time is ${minsLabel(dm.total - dm.avail)} over what you have today. Nothing changes until you choose.</p><div><button class="btn sm" data-act="openAdjust">See adjustments</button></div></div>` : ''}</section>`;
  }

  // Five area cards
  h += renderLifeToday(td);
  h += '<section class="area-list" aria-label="Areas">';
  for (const area of AREAS) {
    const list = items.filter((i) => i.area === area);
    h += `<article class="area"><span class="dot ${area}"></span><div class="area-body"><div class="row-between"><span class="area-name">${t('area.' + area)}</span>${area === 'mind' ? (S.checkins[td] ? '<span class="pill done">Check-in saved</span>' : '') : ''}</div>`;
    if (area === 'mind') {
      h += `<div class="muted small">${t('mind.part')}</div>`;
    } else if (!list.length && pauseOn(td, area)) {
      h += `<div class="muted small">Paused. Nothing is scheduled or owed.</div>`;
    } else if (!list.length) {
      h += areaEmpty(area, td);
    } else {
      h += list.map((it) => `<div class="stack-s"><div class="area-title">${esc(it.title)}</div><div>${pill(it)}</div>
        ${it.finish && it.kind !== 'spend' ? `<div class="small muted">Done when: ${esc(it.finish)}</div>` : ''}
        ${itemMeta(it) ? `<div class="tiny muted">${itemMeta(it)}</div>` : ''}${it.paused ? '<div class="tiny muted">Logged during a pause. Kept, not counted.</div>' : towardLine(it)}
        ${it.kind === 'spend' && txOn(td).length ? `<div class="tiny muted">${plural(txOn(td).length, 'entry', 'entries')} today</div>` : ''}
        ${it.unplanned ? '' : `<div class="area-actions">${itemButtons(it, false)}</div>`}</div>`).join('<hr style="border:0;border-top:1px solid var(--line);margin:4px 0">');
    }
    h += '</div></article>';
  }
  h += '</section>';

  h += renderCompanionToday();
  h += `<button class="checkin-btn" data-act="openCheckin"><span>${S.checkins[td] ? t('checkin.edit') : t('checkin')}<span class="sub">${S.checkins[td] ? 'Saved. Edits replace it, never duplicate it.' : 'About 2 minutes · usually around ' + esc(fmtTime(S.settings.checkinTime))}</span></span><span aria-hidden="true">→</span></button>`;

  if (!fullPause) h += `<div class="btn-row"><button class="btn ghost sm" data-act="clearWay">Clear the way (2–5 min)</button>${!(S.dayPlans[td] && S.dayPlans[td].smallerAll) ? `<button class="btn ghost sm" data-act="makeSmaller">${t('btn.smaller')}</button>` : ''}</div>`;
  if (S.prep[td] && S.prep[td].length) h += `<p class="tiny muted">Cleared today: ${S.prep[td].map(esc).join(', ')}.</p>`;

  if (S.checkins[td]) h += renderTomorrowPreview();
  h += renderSetupNudge();
  h += '</div>';
  return h;
}
function areaEmpty(area, td) {
  if (area === 'training') {
    if (!S.training.templates.length && !Object.keys(S.training.overrides).length) return `<div class="muted small">No training plan entered yet.</div><div class="area-actions"><button class="btn sm" data-act="goPlan" data-open="training">Add your plan</button><button class="btn ghost sm" data-act="trainLog" data-date="${td}">Log an activity</button></div>`;
    return `<div class="muted small">${t('st.unscheduled')}. An unscheduled day is not a missed one.</div><div class="area-actions"><button class="btn ghost sm" data-act="trainLog" data-date="${td}">Log an activity anyway</button></div>`;
  }
  if (area === 'art') {
    const art = S.tasks.find((x) => x.area === 'art' && !x.endedOn);
    return `<div class="muted small">${t('st.unscheduled')}.</div>${art ? `<div class="area-actions"><button class="btn ghost sm" data-act="artExtra" data-id="${art.id}" data-date="${td}">Made art anyway</button></div>` : ''}`;
  }
  if (area === 'business') return `<div class="muted small">${t('st.unscheduled')}.</div>`;
  return `<div class="muted small">${t('st.unscheduled')}.</div>`;
}
function fmtTime(hm) { const [h, m] = hm.split(':').map(Number); return new Intl.DateTimeFormat(locale(), { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(2020, 0, 1, h, m))); }

function renderTomorrowPreview() {
  const tm = dAdd(today(), 1);
  const items = itemsFor(tm);
  const dm = dayMinutes(tm);
  return `<section class="card flat"><div class="eyebrow">Tomorrow · ${esc(dShort(tm))}</div><div class="list mt-s">${items.filter((i) => i.kind !== 'spend').map((it) => `<div class="li"><span class="dot ${it.area}" style="width:8px;height:8px;border-radius:50%;flex:none" aria-hidden="true"></span><div class="grow"><b>${esc(it.title)}</b>${it.minutes ? ` <span class="muted small">· ${minsLabel(it.minutes)}</span>` : ''}</div></div>`).join('') || '<div class="muted small">Only the spending log is scheduled.</div>'}</div><p class="tiny muted mt-s">${minsLabel(dm.total)}${dm.unknown ? '+' : ''} planned${dm.avail != null ? ' of ' + minsLabel(dm.avail) + ' available' : ''}.</p></section>`;
}
function renderSetupNudge() {
  const steps = [];
  if (!S.money.accounts.length && !S.money.bills.length) steps.push(['money', 'Money: confirm what’s available and what’s due before payday']);
  if (!S.business.outcome4w) steps.push(['business', 'Business: who you help, and one outcome for the next four weeks']);
  if (!S.training.templates.length) steps.push(['training', 'Training: what you know so far, and the plan you’re following']);
  if (!steps.length) return '';
  const s = steps[0];
  return `<section class="card flat"><div class="eyebrow">Set up one area at a time</div><p class="mt-s">${esc(s[1])}</p><p class="tiny muted mt-s">Unknown values can stay unknown.</p><div class="mt-s"><button class="btn sm" data-act="goPlan" data-open="${s[0]}">Set up ${t('area.' + s[0]).toLowerCase()}</button></div></section>`;
}
A.goPlan = (el) => { closeSheet(true); TAB = 'plan'; const open = el.dataset.open || null; PLAN_OPEN = open; render(); const s = open && document.getElementById('sect-' + open); if (s) s.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0); };
A.returnContinue = () => { S.dismissed.returnOn = today(); save(); render(); };
A.returnReview = () => { S.dismissed.returnOn = today(); save(); TAB = 'plan'; render(); window.scrollTo(0, 0); };

function findItem(key, ds) { return itemsFor(ds).find((i) => i.key === key); }
A.startItem = (el) => {
  const ds = el.dataset.date; const it = findItem(el.dataset.key, ds); if (!it) return;
  upsertOcc(it, ds, { status: 'started', startedAt: nowISO() });
  S.timer = { key: it.key, date: ds, label: it.title, startedAt: nowMs() }; save(); render();
  toast('Started. The timer is optional.');
};
A.quickDone = (el) => { const ds = el.dataset.date; const it = findItem(el.dataset.key, ds); if (!it) return; upsertOcc(it, ds, { status: it.smaller ? 'modified' : 'done' }); render(); toast('Logged.'); };
A.smallerOne = (el) => {
  const ds = el.dataset.date; const p = S.dayPlans[ds] || (S.dayPlans[ds] = { smaller: {} });
  markSmaller(ds, el.dataset.key, 'button'); save(); render(); toast('Smaller version for today. The original stays on record.');
};
A.artExtra = (el) => {
  const ds = el.dataset.date; const task = S.tasks.find((x) => x.id === el.dataset.id); const p = taskPlan(task, ds);
  const key = 't:' + task.id + '@' + ds;
  S.occ[key] = { id: key, kind: 'task', refId: task.id, area: 'art', date: ds, extra: true, planned: { title: p.title, minutes: p.minutes }, status: 'done', createdAt: nowISO(), updatedAt: nowISO() };
  save(); render(); toast('Logged as unscheduled art.');
};
A.noSpend = (el) => { setSpendDay(el.dataset.date, 'none'); render(); toast('Recorded: no spending today.'); };
A.restFollowed = (el) => { setTrainLog(el.dataset.date, { status: 'rest', actualType: 'rest' }); render(); toast('Rest day followed.'); };
A.setAvail = () => { TAB = 'settings'; SET_OPEN.add('schedule'); render(); const s = document.getElementById('sect-avail'); if (s) s.scrollIntoView(); };

/* Make today smaller: use the smaller version of every non-training task. Training is never changed silently. */
A.makeSmaller = () => {
  const td = today();
  const items = itemsFor(td).filter((i) => (i.kind === 'task' || i.kind === 'biz') && !isClosed(i.status) && i.minTitle);
  const p = S.dayPlans[td] || (S.dayPlans[td] = { smaller: {} });
  p.smaller = p.smaller || {};
  items.forEach((i) => markSmaller(td, i.key, 'make today smaller'));
  p.smallerAll = true;
  S.dismissed.returnOn = td;
  save(); render();
  const tr = itemsFor(td).find((i) => i.kind === 'train' && i.session && i.session.type !== 'rest' && !isClosed(i.status));
  toast(items.length ? 'Today uses the smaller versions.' + (tr ? ' Training is unchanged.' : '') : 'Nothing open to shrink today.');
};

/* Time-budget adjustments: suggested, then accepted or rejected one by one */
function adjustOptions(ds) {
  const dm = dayMinutes(ds);
  const opts = [];
  const sess = sessionFor(ds);
  for (const it of dm.items) {
    if (isClosed(it.status) || it.unplanned) continue;
    if ((it.kind === 'task' || it.kind === 'biz') && !it.smaller && it.minTitle && it.fullMinutes) {
      const saves = it.fullMinutes - (it.kind === 'biz' ? 5 : (it.minMinutes || 1));
      if (saves > 0) opts.push({ id: 'small:' + it.key, label: `Use the smaller version of “${it.plannedTitle}”`, detail: `${it.minTitle} · saves ${minsLabel(saves)}`, apply: () => markSmaller(ds, it.key, 'time budget') });
    }
    if (it.kind === 'task' || it.kind === 'biz') {
      const target = findRoomyDay(ds, it.minutes || 0);
      if (target) opts.push({ id: 'move:' + it.key, label: `Move “${it.plannedTitle || it.title}” to ${dShort(target)}`, detail: `${dShort(target)} has room for it`, apply: () => moveItem(it, ds, target) });
    }
  }
  if (sess && sess.type === 'long') opts.unshift({ id: 'longday', label: 'Long-run day: use the 5-minute business version', detail: 'Keeps business visible without competing with the run', apply: () => markSmaller(ds, 'biz@' + ds, 'long-run day') });
  if (sess && sess.type !== 'rest') opts.push({ id: 'trainreview', label: 'Review today’s training session', detail: 'Opens your plan. The app does not change training for you.', review: true });
  return opts;
}
function findRoomyDay(ds, minutes) {
  for (let i = 1; i <= 6; i++) {
    const d = dAdd(ds, i); const dm = dayMinutes(d);
    if (dm.avail != null && dm.total + minutes <= dm.avail) return d;
  }
  return null;
}
function moveItem(it, from, to) {
  if (it.kind === 'biz') {
    S.exceptions.push({ id: uid('ex'), refId: 'bizblock', date: from, kind: 'off', createdAt: nowISO() });
    if (it.actionId) S.business.nextFor[to] = it.actionId;
  } else {
    S.exceptions.push({ id: uid('ex'), refId: it.taskId, date: from, kind: 'off', createdAt: nowISO() });
    S.exceptions.push({ id: uid('ex'), refId: it.taskId, date: to, kind: 'on', createdAt: nowISO() });
  }
  logChange({ date: from, key: it.key, refId: it.kind === 'biz' ? (it.actionId || 'bizblock') : it.taskId, title: it.plannedTitle || it.title, kind: 'rescheduled', from: dMD(from), to: dMD(to) });
}
A.openAdjust = () => {
  const ds = today();
  SH.adj = adjustOptions(ds);
  SH.adjDecided = {};
  openSheet(() => {
    const dm = dayMinutes(ds);
    return `${sheetHead('Your plan needs an adjustment.', `${minsLabel(dm.total)} planned · ${minsLabel(dm.avail)} available`)}
      <p class="small muted">Accept or reject each one. Nothing changes unless you accept it.</p>
      <div class="stack">${SH.adj.map((o, i) => `<div class="card flat"><div class="h3">${esc(o.label)}</div><div class="small muted">${esc(o.detail)}</div>
        <div class="btn-row mt-s">${SH.adjDecided[i] ? `<span class="pill ${SH.adjDecided[i] === 'yes' ? 'done' : 'skipped'}">${SH.adjDecided[i] === 'yes' ? 'Accepted' : 'Rejected'}</span>` : o.review
          ? `<button class="btn sm" data-act="goPlan" data-open="training">Open training plan</button>`
          : `<button class="btn primary sm" data-act="adjYes" data-i="${i}">Accept</button><button class="btn sm" data-act="adjNo" data-i="${i}">Reject</button>`}</div></div>`).join('') || '<p class="empty">No automatic adjustment fits. You could lower a task’s time in Plan, or update today’s available time.</p>'}</div>
      <button class="btn block" data-act="closeSheet">${t('btn.done')}</button>`;
  });
};
A.adjYes = (el) => { const i = +el.dataset.i; const o = SH.adj[i]; o.apply(); (S.dayPlans[today()] || (S.dayPlans[today()] = { smaller: {} })).accepted = ((S.dayPlans[today()].accepted) || []).concat(o.label); SH.adjDecided[i] = 'yes'; save(); refreshSheet(); };
A.adjNo = (el) => { SH.adjDecided[+el.dataset.i] = 'no'; refreshSheet(); };

/* Clear the way: an optional preparation step, not a sixth area */
A.clearWay = () => {
  const td = today(); const items = itemsFor(td);
  const opts = [];
  if (items.some((i) => i.area === 'business')) opts.push('Clear enough desk space to work');
  const s = sessionFor(td); if (s && s.type !== 'rest') opts.push('Put running clothes where I can see them');
  if (items.some((i) => i.area === 'art') || true) opts.push('Put art supplies within reach');
  opts.push('Clear my bed');
  openSheet(() => `${sheetHead('Clear the way', 'Two to five minutes of preparation. Optional.')}
    ${chips('prep', opts.map((o) => [o, o]), null, true)}
    <label class="f">Something else<input class="inp" id="prepOther" maxlength="80" placeholder="e.g. Charge headphones"></label>
    <button class="btn primary block" data-act="prepSave">Done</button>`);
};
A.prepSave = () => {
  const td = today(); const picks = getPicks('prep'); const o = val('prepOther'); if (o) picks.push(o);
  if (!picks.length) { toast('Pick one step, or close this.'); return; }
  S.prep[td] = (S.prep[td] || []).concat(picks.filter((p) => !(S.prep[td] || []).includes(p))); save(); closeSheet(); render(); toast('The way is clearer.');
};

/* ---------- Log a task or business action ---------- */
A.openLog = (el) => openLog(el.dataset.key, el.dataset.date);
function openLog(key, ds, mins) {
  const it = findItem(key, ds); if (!it) return;
  const o = it.occ || {};
  SH.log = { key, ds };
  SH.onPick = (g, v) => {
    if (g === 'lstatus') { show('lReasonBox', v === 'modified' || v === 'skipped'); }
    if (g === 'lreason') { const b = document.getElementById('lAdjust'); if (b) b.innerHTML = adjustmentFor(v, it); }
  };
  const smallLabel = it.kind === 'biz' ? 'Five minutes on it' : 'Smaller version';
  openSheet(() => `${sheetHead(esc(it.plannedTitle || it.title), it.finish ? 'Done when: ' + esc(it.finish) : '')}
    <p class="small muted">Planned: ${minsLabel(it.fullMinutes)}${it.minTitle ? ' · Smaller version: ' + esc(it.minTitle) : ''}${it.connection ? ' · Connects to: ' + esc(it.connection) : ''}</p>
    ${seg('lstatus', [['done', 'Done as planned'], ['modified', smallLabel], ['skipped', 'Skipped']], isClosed(o.status) ? o.status : (it.smaller ? 'modified' : null))}
    <div class="grid2"><label class="f">Minutes spent <span class="hint">Optional</span><input class="inp num" id="lMins" inputmode="numeric" type="number" min="0" max="600" value="${esc(mins != null ? mins : (o.minutes != null ? o.minutes : ''))}"></label>
    ${it.kind === 'biz' ? `<label class="f">Output note or link <span class="hint">Optional</span><input class="inp" id="lOut" maxlength="300" value="${esc(o.output || '')}" placeholder="e.g. Draft in Notes"></label>` : '<div></div>'}</div>
    <label class="f">Note <span class="hint">Optional</span><input class="inp" id="lNote" maxlength="300" value="${esc(o.note || '')}"></label>
    <div id="lReasonBox" class="stack-s" ${o.status === 'modified' || o.status === 'skipped' || it.smaller ? '' : 'hidden'}><div class="h3">What got in the way? <span class="hint">Optional, one tap</span></div>${chips('lreason', REASONS, o.reason || null)}<div id="lAdjust">${o.reason ? adjustmentFor(o.reason, it) : ''}</div></div>
    <div class="btn-row"><button class="btn primary" data-act="logSave">${t('btn.save')}</button>${S.occ[key] ? `<button class="btn ghost danger" data-act="logClear">Clear this record</button>` : ''}</div>`);
}
function adjustmentFor(reason, it) {
  if (!reason) return '';
  const k = esc(it.key), d = esc(it.date);
  const map = {
    forgot: `<div class="card tint stack-s"><b>Attach a cue</b><label class="f">After I…<input class="inp" id="adjCue" maxlength="80" placeholder="e.g. pour my morning coffee" value="${esc(it.cue || '')}"></label><button class="btn sm" data-act="adjCue" data-key="${k}" data-date="${d}">Save cue</button></div>`,
    unclear: `<div class="card tint stack-s"><b>Rewrite the first action</b><label class="f">Start with a verb<input class="inp" id="adjTitle" maxlength="120" value="${esc(it.plannedTitle || '')}"></label><label class="f">Done when<input class="inp" id="adjFinish" maxlength="160" value="${esc(it.finish || '')}"></label><button class="btn sm" data-act="adjRewrite" data-key="${k}" data-date="${d}">Save for next time</button></div>`,
    large: `<div class="card tint stack-s"><b>Shrink the finish line</b><label class="f">Done when<input class="inp" id="adjFinish" maxlength="160" value="${esc(it.finish || '')}"></label><label class="f">Minutes<input class="inp num" id="adjMins" type="number" min="1" max="240" value="${esc(it.fullMinutes ? Math.max(5, Math.round(it.fullMinutes / 2)) : '')}"></label><button class="btn sm" data-act="adjRewrite" data-key="${k}" data-date="${d}">Save for next time</button></div>`,
    time: `<div class="card tint stack-s"><b>Reschedule within available time</b>${(() => { const target = findRoomyDay(it.date, it.minutes || 0); return target ? `<p class="small">${esc(dShort(target))} has room.</p><button class="btn sm" data-act="adjMove" data-key="${k}" data-date="${d}" data-to="${target}">Move to ${esc(dShort(target))}</button>` : '<p class="small">No day this week has room by your available-time settings. You could lower the time in Plan.</p>'; })()}</div>`,
    lowmot: `<div class="card tint stack-s"><b>Offer a smaller start</b><p class="small">Next time, start with: ${esc(it.minTitle || 'five minutes on the same task')}.</p><button class="btn sm" data-act="adjTomorrowSmall" data-key="${k}" data-date="${d}">Use the smaller version tomorrow</button></div>`,
    emotional: `<div class="card tint stack-s"><b>Make tomorrow’s task smaller</b><button class="btn sm" data-act="adjTomorrowSmall" data-key="${k}" data-date="${d}">Use the smaller version tomorrow</button></div>`,
    physical: `<div class="card tint stack-s"><b>Rest or review the plan</b><p class="small">Rest is a legitimate choice. If symptoms continue, a qualified professional can help.</p></div>`,
    priorities: `<div class="card tint stack-s"><b>Review what no longer fits</b><button class="btn sm" data-act="goPlanClose">Open Plan</button></div>`
  };
  return map[reason] || '';
}
function taskForKey(key) { if (key.startsWith('t:')) return S.tasks.find((x) => x.id === key.slice(2).split('@')[0]); return null; }
A.adjCue = (el) => {
  const cue = val('adjCue'); const task = taskForKey(el.dataset.key);
  if (task) { const p = taskPlan(task, el.dataset.date); pushVersion(task, Object.assign({}, p, { cue }), today()); }
  else if (el.dataset.key.startsWith('biz')) { S.business.cue = cue; }
  else S.money.cue = cue;
  save(); toast('Cue saved.');
};
A.adjRewrite = (el) => {
  const key = el.dataset.key; const ds = el.dataset.date;
  const title = val('adjTitle'), finish = val('adjFinish'), mins = numOrNull(val('adjMins'));
  if (key.startsWith('biz@')) {
    const it = findItem(key, ds); const a = it && S.business.actions.find((x) => x.id === it.actionId);
    if (a) { if (title) a.title = title; if (finish) a.finish = finish; if (mins) a.minutes = mins; }
  } else {
    const task = taskForKey(key); if (!task) return;
    const p = taskPlan(task, ds);
    pushVersion(task, Object.assign({}, p, title ? { title } : {}, finish ? { finish } : {}, mins ? { minutes: mins } : {}), dAdd(today(), 1));
  }
  save(); toast('Saved. Past records keep the original.');
};
A.adjMove = (el) => { const it = findItem(el.dataset.key, el.dataset.date); if (!it) return; moveItem(it, el.dataset.date, el.dataset.to); save(); toast('Moved to ' + dShort(el.dataset.to) + '.'); };
A.adjTomorrowSmall = (el) => {
  const tm = dAdd(el.dataset.date, 1); const key = el.dataset.key.replace(el.dataset.date, tm);
  markSmaller(tm, key, 'after a skip'); save(); toast('Tomorrow uses the smaller version.');
};
A.goPlanClose = () => { closeSheet(true); TAB = 'plan'; render(); };
A.logSave = () => {
  const { key, ds } = SH.log; const it = findItem(key, ds); if (!it) return;
  const status = getPick('lstatus');
  if (!status) { toast('Choose done, smaller, or skipped.'); return; }
  const reason = status === 'done' ? null : getPick('lreason');
  upsertOcc(it, ds, { status, minutes: numOrNull(val('lMins')), note: val('lNote'), output: val('lOut') || '', reason });
  if (S.timer && S.timer.key === key) S.timer = null;
  closeSheet(); render(); toast(logFeedback(S.occ[key]));
  if (it.category === 'Planning' && (status === 'done' || status === 'modified')) openNextActionPrompt({ occKey: key, area: 'business' });
};
A.logClear = () => { clearOcc(SH.log.key); closeSheet(); render(); toast('Record cleared.'); };
function logFeedback(o) {
  if (o.status === 'done') return 'Logged as completed.';
  if (o.status === 'modified') return o.planned.minutes && o.minutes && o.minutes < o.planned.minutes ? `Planned ${o.planned.minutes} min, completed ${o.minutes}. That counts as participation.` : 'Logged as the smaller version.';
  return 'Logged as skipped. The plan is still here tomorrow.';
}

/* ---------- Training ---------- */
A.trainStart = (el) => { const ds = el.dataset.date; setTrainLog(ds, { status: 'started' }); S.timer = { key: 'train', date: ds, label: sessionLabel(sessionFor(ds)), startedAt: nowMs() }; save(); render(); toast('Started. Timer is optional.'); };
A.trainLog = (el) => openTrainLog(el.dataset.date);
function openTrainLog(ds, mins) {
  const sess = sessionFor(ds);
  const lg = S.training.logs['tr@' + ds] || {};
  const unit = S.training.profile.unit || 'mi';
  const opts = sess ? (sess.type === 'rest' ? [['rest', 'Rest day followed'], ['modified', 'Did something else'], ['completed', 'Completed as planned']].filter((x) => x[0] !== 'completed') : [['completed', 'Completed as planned'], ['modified', 'Modified'], ['skipped', 'Skipped']]) : [['unplanned', 'Unplanned activity']];
  const cur = lg.status && lg.status !== 'started' ? lg.status : (sess ? null : 'unplanned');
  SH.onPick = (g, v) => { if (g === 'tstatus') { show('tReasonBox', v === 'modified' || v === 'skipped'); show('tActual', v !== 'rest' && v !== 'skipped'); } if (g === 'tsym') show('tSymNote', true); };
  openSheet(() => `${sheetHead('Training · ' + esc(dShort(ds)), 'Planned: ' + esc(sessionLabel(sess)))}
    ${sess && sess.detail ? `<p class="small">${esc(sess.detail)}</p>` : ''}
    ${seg('tstatus', opts, cur)}
    <div id="tActual" class="stack" ${cur === 'rest' || cur === 'skipped' ? 'hidden' : ''}>
      <label class="f">What you actually did<select class="inp" id="tType">${Object.entries(SESSION_TYPES).filter(([k]) => k !== 'rest').map(([k, l]) => `<option value="${k}" ${(lg.actualType || (sess && sess.type)) === k ? 'selected' : ''}>${l}</option>`).join('')}<option value="walk" ${lg.actualType === 'walk' ? 'selected' : ''}>Walk</option></select></label>
      <div class="grid2"><label class="f">Duration (min)<input class="inp num" id="tMins" type="number" inputmode="numeric" min="0" max="600" value="${esc(mins != null ? mins : (lg.minutes != null ? lg.minutes : ''))}"></label>
      <label class="f">Distance (${unit}) <span class="hint">If it applies</span><input class="inp num" id="tDist" type="number" inputmode="decimal" step="0.01" min="0" max="200" value="${esc(lg.distance != null ? lg.distance : '')}"></label></div>
      <div class="stack-s"><div class="h3">Effort <span class="hint">Optional</span></div><div class="scale">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="chip" data-act="pick" data-group="teffort" data-val="${n}" aria-pressed="${lg.effort === n ? 'true' : 'false'}">${n}</button>`).join('')}</div><div class="scale-labels"><span>1 very easy</span><span>5 very hard</span></div></div>
    </div>
    <label class="row" style="min-height:44px;gap:10px"><input type="checkbox" id="tSym" ${lg.symptoms ? 'checked' : ''} style="width:22px;height:22px"> <span>Pain, illness or unusual exhaustion</span></label>
    <label class="f">Fatigue or pain note <span class="hint">Optional</span><input class="inp" id="tNote" maxlength="300" value="${esc(lg.note || '')}"></label>
    <div id="tReasonBox" class="stack-s" ${lg.status === 'modified' || lg.status === 'skipped' ? '' : 'hidden'}><div class="h3">What got in the way? <span class="hint">Optional</span></div>${chips('treason', REASONS, lg.reason || null)}</div>
    <p class="tiny muted">Missed distance is never added to a later workout. A shorter or different session is recorded as modified, next to the original plan.</p>
    <div class="btn-row"><button class="btn primary" data-act="trainSave" data-date="${ds}">${t('btn.save')}</button>${S.training.logs['tr@' + ds] ? `<button class="btn ghost danger" data-act="trainClear" data-date="${ds}">Clear this record</button>` : ''}</div>`);
}
A.trainSave = (el) => {
  const ds = el.dataset.date; const status = getPick('tstatus');
  if (!status) { toast('Choose how the session went.'); return; }
  const actual = status === 'rest' ? 'rest' : status === 'skipped' ? null : $('#tType').value;
  const sym = $('#tSym').checked;
  setTrainLog(ds, {
    status, actualType: actual, minutes: status === 'rest' || status === 'skipped' ? null : numOrNull(val('tMins')), distance: status === 'rest' || status === 'skipped' ? null : numOrNull(val('tDist')),
    effort: getPick('teffort') ? Number(getPick('teffort')) : null, symptoms: sym, note: val('tNote'), reason: status === 'modified' || status === 'skipped' ? getPick('treason') : null
  });
  if (S.timer && S.timer.key === 'train') S.timer = null;
  save(); closeSheet(); render();
  toast(sym ? 'Saved. With pain, illness or unusual exhaustion, rest or a plan review comes first.' : status === 'modified' ? 'Saved as modified. The original plan stays visible.' : 'Saved.');
};
A.trainClear = (el) => { delete S.training.logs['tr@' + el.dataset.date]; save(); closeSheet(); render(); toast('Record cleared.'); };
A.trainEasier = (el) => {
  const ds = el.dataset.date;
  openSheet(() => `${sheetHead('Make starting easier')}
    <p>First, a quick check: any pain, illness, or unusual exhaustion today?</p>
    <div class="btn-row"><button class="btn primary" data-act="easierGo" data-date="${ds}">No. I’ll start small</button><button class="btn" data-act="easierSym" data-date="${ds}">Yes</button></div>
    <div id="easierOut"></div>`);
};
A.easierGo = (el) => {
  const ds = el.dataset.date;
  $('#easierOut').innerHTML = `<div class="card tint stack-s"><b>Prepare your gear and begin the planned warm-up, then reassess.</b><p class="small">If you stop after the warm-up, log it as modified. That still counts as participation.</p><button class="btn primary" data-act="easierStart" data-date="${ds}">Start the warm-up</button></div>`;
};
A.easierStart = (el) => { closeSheet(true); A.trainStart(el); };
A.easierSym = (el) => {
  const ds = el.dataset.date;
  $('#easierOut').innerHTML = `<div class="card tint stack-s"><b>Rest, or review the plan.</b><p class="small">Pushing through isn’t the goal today. If it continues, a qualified professional can help.</p><div class="btn-row"><button class="btn sm" data-act="easierRest" data-date="${ds}">Log rest instead</button><button class="btn sm" data-act="goPlanClose">Review training plan</button></div></div>`;
};
A.easierRest = (el) => { setTrainLog(el.dataset.date, { status: 'skipped', reason: 'physical', symptoms: true }); closeSheet(); render(); toast('Logged. Resting for symptoms is part of training.'); };
