/* ---------- Personal behavior rules, woven into existing screens ---------- */
const OUTPUTS = ['Three offer bullets', 'A draft', 'A chart', 'An outreach message', 'A finished portfolio section'];
const MAINTAIN = { money: 'Daily spending log', business: 'A realistic business block', training: 'Planned sessions and rest', art: 'Small art invitations', mind: 'Evening check-in' };
const AREA_GOAL = { money: 'Financial clarity', business: 'Business', training: 'Training consistency', art: 'Art', mind: 'Mind' };

/* Honest record of changed commitments: the original plan stays, the change sits beside it */
function logChange(e) { S.changes.push(Object.assign({ id: uid('chg'), at: nowISO(), explanation: null }, e)); }
function markSmaller(ds, key, via) {
  const p = S.dayPlans[ds] || (S.dayPlans[ds] = { smaller: {} });
  p.smaller = p.smaller || {};
  if (p.smaller[key]) return;
  p.smaller[key] = true;
  const it = findItem(key, ds);
  logChange({ date: ds, key, refId: it ? (it.kind === 'biz' ? (it.actionId || 'bizblock') : it.taskId) : key, title: it ? (it.plannedTitle || it.title) : key, kind: 'reduced', from: it && it.fullMinutes ? minsLabel(it.fullMinutes) : '', to: it ? (it.minTitle || 'smaller version') : 'smaller version', via });
}
const CHANGE_KIND = { reduced: 'Made smaller', rescheduled: 'Rescheduled', removed: 'Taken off that day', replaced: 'Swapped for an alternative', 'let-go': 'Consciously let go', clarified: 'First step rewritten' };
const EXPLAIN = [['realistic', 'A realistic adjustment'], ['mismatch', 'A recurring scheduling mismatch'], ['unclear', 'The task needs clarifying'], ['reconsider', 'I keep postponing it; worth reconsidering']];
function changeGroups(ws) {
  const we = dAdd(ws, 6); const groups = {};
  for (const c of S.changes) {
    if (c.date < ws || c.date > we) continue;
    const g = c.refId || c.title;
    (groups[g] = groups[g] || { id: g, title: c.title, items: [] }).items.push(c);
  }
  return Object.values(groups).map((g) => {
    const since = dAdd(ws, -21);
    g.postponed4w = S.changes.filter((c) => (c.refId || c.title) === g.id && c.date >= since && c.date <= we && c.kind !== 'reduced').length;
    g.explanation = (g.items.find((c) => c.explanation) || {}).explanation || null;
    return g;
  });
}

/* ---------- Week order: personal commitments, one main outcome, maintenance, Later ---------- */
function weekPlan(ws) { return S.weeks[ws] || null; }
function mainOutcomeLine(td) {
  const w = weekPlan(weekStart(td));
  if (!w || !w.confirmedAt) return '';
  const g = w.goalId && goalById(w.goalId);
  return `<div class="small muted mt-s">This week: <b>${esc(g ? g.title : w.focus ? focusLabel(w.focus) : AREA_GOAL[w.main] || w.main)}</b>${w.mainOutcome ? ' · ' + esc(w.mainOutcome) : ''}</div>`;
}
function renderWeekCard(ws) {
  const w = weekPlan(ws) || {};
  const main = w.main || 'money';
  const maintain = w.maintain || AREAS.filter((a) => a !== main);
  const lives = S.life.filter((l) => l.date >= ws && l.date <= dAdd(ws, 6) && l.status !== 'let-go').sort((a, b) => (a.date + (a.time || '') < b.date + (b.time || '') ? -1 : 1));
  const later = S.later.filter((x) => x.kind === 'idea');
  return `<section class="card stack"><div class="eyebrow">${PLAN_WEEK === 0 ? 'This week' : 'Week of ' + esc(dMD(ws))} · in this order</div>
    <div class="stack-s"><div class="h3">1 · Your own life first</div><p class="tiny muted">Personal plans go in before optional work, so the week’s tradeoffs are visible.</p>
      ${lives.map((l) => `<div class="row-between small"><span class="grow">${esc(l.title)} <span class="muted">· ${esc(dShort(l.date))}${l.time ? ' ' + esc(fmtTime(l.time)) : ''}</span></span><button class="btn ghost sm" data-act="lifeChange" data-id="${l.id}">Change</button></div>`).join('')}
      <div><button class="btn sm" data-act="lifeForm" data-ws="${ws}">Add a personal commitment</button></div></div>
    <div class="stack-s"><div class="h3">2 · One main outcome to move forward</div>
      ${w.confirmedAt ? '' : '<p class="small">Suggested: <b>financial clarity</b>. Confirm it or pick another.</p>'}
      ${chips('wkMain', Object.entries(AREA_GOAL).map(([a, l]) => [a, l + (a === 'money' && !w.confirmedAt ? ' (suggested)' : '')]), main)}
      <input class="inp" id="wkMainOut" maxlength="160" value="${esc(w.mainOutcome || '')}" placeholder="What will exist by the end of the week?" aria-label="Main outcome"></div>
    <div class="stack-s"><div class="h3">3 · Keep going at a maintenance level</div>${chips('wkKeep', AREAS.map((a) => [a, t('area.' + a)]), maintain, true)}<p class="tiny muted">${AREAS.filter((a) => a !== main).map((a) => esc(t('area.' + a)) + ': ' + esc(MAINTAIN[a].toLowerCase())).join(' · ')}</p></div>
    <label class="f">This week’s one business outcome<input class="inp" id="wkOutcome" maxlength="160" value="${esc(S.business.weekly[ws] || '')}" placeholder="e.g. Three offer bullets I could send"></label>
    <div class="stack-s"><div class="h3">4 · Later</div><p class="tiny muted">Ideas you’re deliberately postponing. They’re never scheduled and never overdue.</p>
      ${later.map((x) => `<div class="row-between small"><span class="grow">${esc(x.text)}</span><button class="btn ghost sm" data-act="laterDel" data-id="${x.id}" aria-label="Remove">×</button></div>`).join('')}
      <div class="row"><input class="inp grow" id="laterIdea" maxlength="140" placeholder="Postpone an idea" aria-label="Postpone an idea"><button class="btn sm" data-act="laterAdd" data-kind="idea" data-src="laterIdea">Add</button></div></div>
    <div class="btn-row"><button class="btn primary sm" data-act="saveWeekly" data-ws="${ws}">Save the week</button><button class="btn sm accent" data-act="openReview">Weekly review</button></div></section>`;
}
A.saveWeekly = (el) => {
  const ws = el.dataset.ws || weekStart(today());
  const main = getPick('wkMain') || 'money';
  S.weeks[ws] = Object.assign({}, S.weeks[ws] || {}, { main, mainOutcome: val('wkMainOut'), maintain: getPicks('wkKeep').filter((a) => a !== main), confirmedAt: nowISO() });
  if (ws === weekStart(today())) S.settings.focus = main;
  const v = val('wkOutcome'); if (v) S.business.weekly[ws] = v; else delete S.business.weekly[ws];
  save(); render(); toast('Week saved.');
  openNextActionPrompt({ area: main === 'mind' ? 'business' : main, from: 'weekly plan' });
};
A.laterAdd = (el) => {
  const text = val(el.dataset.src); if (!text) return;
  S.later.push({ id: uid('later'), kind: el.dataset.kind, text, createdAt: nowISO() }); save(); render(); toast(el.dataset.kind === 'idea' ? 'Saved to Later.' : 'Saved for after the trial week.');
};
A.laterDel = (el) => { S.later = S.later.filter((x) => x.id !== el.dataset.id); save(); render(); };

/* ---------- Planning → observable action ---------- */
function openNextActionPrompt(src) {
  const area = src.area || 'business';
  SH.nap = src;
  openSheet(() => `${sheetHead('What action does this make possible?', 'Planning counts when it leads somewhere visible.')}
    <label class="f">Action <span class="hint">Start with a verb</span><input class="inp" id="napTitle" maxlength="120" autofocus placeholder="${area === 'business' ? 'Draft the three bullets for my dashboard service' : area === 'money' ? 'List bills due before payday' : 'Prepare what I need'}"></label>
    <div class="stack-s"><label class="f" for="napOut">What will exist afterward</label>${area === 'business' ? `<div data-toggleable>${chips('napOutC', OUTPUTS.map((o) => [o, o]), null)}</div>` : ''}<input class="inp" id="napOut" maxlength="160"></div>
    <div class="grid2"><label class="f">Minutes<input class="inp num" id="napMins" type="number" min="1" max="240" value="15"></label><label class="f">When<select class="inp" id="napWhen"><option value="${today()}">Today</option><option value="${dAdd(today(), 1)}" selected>Tomorrow</option>${area === 'business' ? '<option value="">Next business block</option>' : ''}</select></label></div>
    <div class="btn-row"><button class="btn primary" data-act="napSave">Schedule it</button><button class="btn" data-act="closeSheet">Not yet</button></div>
    <p class="tiny muted">Progress will show whether planning sessions led to finished actions.</p>`);
  SH.onPick = (g, v) => { if (g === 'napOutC' && v) $('#napOut').value = v; };
}
A.napSave = () => {
  const title = val('napTitle'), out = val('napOut'), when = $('#napWhen').value, mins = numOrNull(val('napMins')) || 15;
  if (!title || !out) { toast('Add the action and what will exist afterward.'); return; }
  const src = SH.nap || {}; const area = src.area || 'business';
  let id;
  if (area === 'business') {
    const a = newAction({ title, finish: out, minutes: mins, date: null });
    a.fromPlanning = src.occKey || src.from || 'planning';
    if (when) S.business.nextFor[when] = a.id;
    id = a.id;
  } else id = createOneOff(area, title, out, mins, when || today()).id;
  if (src.occKey && S.occ[src.occKey]) S.occ[src.occKey].ledTo = id;
  save(); closeSheet(); render(); toast('Scheduled' + (when ? ' for ' + dShort(when) : '') + '.');
};
function planningStats(ws) {
  const we = dAdd(ws, 6);
  const sessions = Object.values(S.occ).filter((o) => o.date >= ws && o.date <= we && o.planned && o.planned.category === 'Planning' && (o.status === 'done' || o.status === 'modified'));
  const led = sessions.filter((o) => o.ledTo);
  const executed = led.filter((o) => { const a = S.business.actions.find((x) => x.id === o.ledTo); if (a) return !!a.doneOn; const tk = S.tasks.find((x) => x.id === o.ledTo); return tk && Object.values(S.occ).some((x) => x.refId === tk.id && x.status === 'done'); });
  return { sessions: sessions.length, led: led.length, executed: executed.length };
}

/* ---------- Personal commitments ---------- */
const lifeOn = (ds) => (S && S.life ? S.life.filter((l) => l.date === ds && l.status !== 'let-go') : []);
function renderLifeToday(td) {
  const l = lifeOn(td); if (!l.length) return '';
  return `<section class="card flat stack-s"><div class="eyebrow">Your own life today</div>${l.map((x) => `<div class="row-between"><span class="grow"><b>${esc(x.title)}</b>${x.time ? ` <span class="muted small">· ${esc(fmtTime(x.time))}</span>` : ''}${x.reducedTo ? `<span class="tiny muted"> · now: ${esc(x.reducedTo)}</span>` : ''}</span>${x.status === 'done' ? '<span class="pill done">Kept</span>' : `<span class="row"><button class="btn sm" data-act="lifeDone" data-id="${x.id}">Kept it</button><button class="btn ghost sm" data-act="lifeChange" data-id="${x.id}">Change</button></span>`}</div>`).join('')}</section>`;
}
A.lifeForm = (el) => {
  const ws = el.dataset.ws || weekStart(today());
  const d0 = ws > today() ? ws : today();
  openSheet(() => `${sheetHead('Personal commitment', 'Friends, dates, family, rest, anything that matters to you')}
    <label class="f">What<input class="inp" id="lfTitle" maxlength="100" autofocus placeholder="Dinner with a friend"></label>
    <div class="grid2"><label class="f">Date<input class="inp" id="lfDate" type="date" value="${d0}"></label><label class="f">Time <span class="hint">Optional</span><input class="inp" id="lfTime" type="time"></label></div>
    <label class="f">Minutes it takes <span class="hint">Counts toward that day’s time</span><input class="inp num" id="lfMins" type="number" min="0" max="900" placeholder="Optional"></label>
    <button class="btn primary" data-act="lifeSave">${t('btn.save')}</button>`);
};
A.lifeSave = () => {
  const title = val('lfTitle'), date = val('lfDate');
  if (!title || !isDate(date)) { toast('Add what and when.'); return; }
  S.life.push({ id: uid('life'), title, date, time: val('lfTime') || null, minutes: numOrNull(val('lfMins')), status: 'planned', original: { date, time: val('lfTime') || null, minutes: numOrNull(val('lfMins')) }, history: [], createdAt: nowISO() });
  save(); closeSheet(); render(); toast('Added. Optional plans fit around it.');
};
A.lifeDone = (el) => { const l = S.life.find((x) => x.id === el.dataset.id); l.status = 'done'; l.doneAt = nowISO(); save(); render(); };
A.lifeChange = (el) => {
  const l = S.life.find((x) => x.id === el.dataset.id); SH.life = l.id;
  SH.onPick = (g, v) => { if (g === 'lfWhat') ['resched', 'reduce', 'letgo'].forEach((k) => show('lf-' + k, k === v)); };
  openSheet(() => `${sheetHead(esc(l.title), esc(dShort(l.date)) + (l.time ? ' · ' + esc(fmtTime(l.time)) : ''))}
    <p>Reschedule this, reduce it, or consciously let it go?</p>
    ${seg('lfWhat', [['resched', 'Reschedule'], ['reduce', 'Reduce'], ['letgo', 'Let it go']], null)}
    <div id="lf-resched" class="stack-s" hidden><div class="grid2"><label class="f">New date<input class="inp" id="lfNewDate" type="date" value="${l.date}"></label><label class="f">Time<input class="inp" id="lfNewTime" type="time" value="${esc(l.time || '')}"></label></div><button class="btn primary sm" data-act="lifeApply" data-k="resched">Reschedule</button></div>
    <div id="lf-reduce" class="stack-s" hidden><label class="f">Smaller version<input class="inp" id="lfLess" maxlength="100" placeholder="e.g. A call instead of dinner"></label><label class="f">Minutes<input class="inp num" id="lfLessMins" type="number" min="0" max="900" value="${esc(l.minutes == null ? '' : l.minutes)}"></label><button class="btn primary sm" data-act="lifeApply" data-k="reduce">Save</button></div>
    <div id="lf-letgo" class="stack-s" hidden><p class="small">It stays in your history as a choice you made, not a miss.</p><button class="btn primary sm" data-act="lifeApply" data-k="letgo">Let it go</button></div>`);
};
A.lifeApply = (el) => {
  const l = S.life.find((x) => x.id === SH.life); const k = el.dataset.k; const from = l.date;
  if (k === 'resched') { const d = val('lfNewDate'); if (!isDate(d)) return; l.history.push({ at: nowISO(), kind: 'rescheduled', from: l.date + (l.time ? ' ' + l.time : ''), to: d + (val('lfNewTime') ? ' ' + val('lfNewTime') : '') }); l.date = d; l.time = val('lfNewTime') || null; logChange({ date: from, refId: l.id, title: l.title, kind: 'rescheduled', from: dMD(from), to: dMD(d), area: 'life' }); }
  if (k === 'reduce') { const less = val('lfLess'); l.history.push({ at: nowISO(), kind: 'reduced', to: less }); l.reducedTo = less; l.minutes = numOrNull(val('lfLessMins')); logChange({ date: from, refId: l.id, title: l.title, kind: 'reduced', to: less, area: 'life' }); }
  if (k === 'letgo') { l.history.push({ at: nowISO(), kind: 'let-go' }); l.status = 'let-go'; logChange({ date: from, refId: l.id, title: l.title, kind: 'let-go', area: 'life' }); }
  save(); closeSheet(); render(); toast('Saved, with the original kept.');
};

/* ---------- Optional feeling check and “I’m stuck” ---------- */
function itemFrom(el) { const ds = el.dataset.date; return { ds, it: findItem(el.dataset.key, ds) }; }
function startFor(it, ds) { const b = { dataset: { key: it.key, date: ds } }; if (it.kind === 'train') A.trainStart(b); else A.startItem(b); }
A.feelFirst = (el) => {
  const { ds, it } = itemFrom(el); if (!it) return; SH.feel = { ds, key: it.key }; SH.onPick = null;
  openSheet(() => `${sheetHead('Before you start', esc(it.plannedTitle || it.title))}
    <div class="stack-s"><div class="h3">What am I feeling? <span class="hint">Optional</span></div>${chips('ffEmo', EMOTIONS.map((e) => [e, e]), [], true, 'pinkc')}</div>
    <div class="stack-s"><div class="h3">What action feels possible alongside that feeling?</div>
      <div class="btn-row"><button class="btn primary sm" data-act="feelGo" data-k="start">Start as planned</button>${it.minTitle || it.kind === 'train' ? `<button class="btn sm" data-act="feelGo" data-k="small">${it.kind === 'train' ? 'Start with the warm-up' : 'Start the smaller version'}</button>` : ''}<button class="btn sm" data-act="feelGo" data-k="support">Get support</button><button class="btn sm" data-act="feelGo" data-k="rest">Rest instead</button></div></div>
    <div id="feelOut"></div><p class="tiny muted">You don’t need to feel calm or confident to begin. Resting is also a real choice.</p>`);
};
function noteStuck(e) { S.stuck.push(Object.assign({ id: uid('stk'), at: nowISO() }, e)); }
A.feelGo = (el) => {
  const { ds, key } = SH.feel; const it = findItem(key, ds); const k = el.dataset.k; const emotions = getPicks('ffEmo');
  noteStuck({ date: ds, key, kind: 'feeling', emotions, choice: k });
  if (k === 'start' || k === 'small') { if (k === 'small' && it.kind !== 'train') markSmaller(ds, key, 'feeling check'); closeSheet(true); startFor(it, ds); return; }
  if (k === 'support') { $('#feelOut').innerHTML = supportBox(); return; }
  if (k === 'rest') { $('#feelOut').innerHTML = restBox(it, ds); }
  save();
};
function supportBox() { return `<div class="card tint stack-s"><label class="f">What support would help, and from whom?<input class="inp" id="supText" maxlength="160" placeholder="Ask a friend to check in after my run"></label><button class="btn sm" data-act="supSave">Save note</button></div>`; }
A.supSave = () => { const s = SH.feel || SH.stk; noteStuck({ date: s.ds, key: s.key, kind: 'support', text: val('supText') }); save(); closeSheet(); render(); toast('Noted.'); };
function restBox(it, ds) { return `<div class="card tint stack-s"><p class="small">Record today honestly as rest. The plan is still here tomorrow.</p><div class="btn-row"><button class="btn sm" data-act="restLog" data-key="${esc(it.key)}" data-date="${ds}" data-r="emotional">Rest: emotional strain</button><button class="btn sm" data-act="restLog" data-key="${esc(it.key)}" data-date="${ds}" data-r="physical">Rest: fatigue, illness or pain</button></div></div>`; }
A.restLog = (el) => {
  const ds = el.dataset.date; const it = findItem(el.dataset.key, ds); const r = el.dataset.r;
  if (it.kind === 'train') setTrainLog(ds, { status: 'skipped', reason: r, symptoms: r === 'physical' });
  else upsertOcc(it, ds, { status: 'skipped', reason: r });
  closeSheet(); render(); toast('Logged as rest.');
};
const STUCK = [['start', 'I don’t know where to start.'], ['big', 'This feels too big.'], ['quality', 'I’m afraid I won’t do it well.'], ['attention', 'My attention is caught somewhere else.'], ['resources', 'I don’t have the time or resources.'], ['depleted', 'I’m physically or emotionally depleted.']];
A.stuck = (el) => {
  const { ds, it } = itemFrom(el); if (!it) return; SH.stk = { ds, key: it.key };
  SH.onPick = (g, v) => { if (g === 'stk') { $('#stkOut').innerHTML = stuckResponse(v, findItem(it.key, ds), ds); noteStuck({ date: ds, key: it.key, kind: 'stuck', obstacle: v }); save(); } };
  openSheet(() => `${sheetHead('What is making this hard right now?', esc(it.plannedTitle || it.title))}
    <div class="stack-s">${STUCK.map(([v, l]) => `<button type="button" class="chip" style="text-align:left;border-radius:12px" data-act="pick" data-group="stk" data-val="${v}" aria-pressed="false">${esc(l)}</button>`).join('')}</div><div id="stkOut"></div>`);
};
function stuckResponse(v, it, ds) {
  const k = esc(it.key), d = esc(ds);
  const isTrain = it.kind === 'train';
  if (v === 'start') return isTrain ? `<div class="card tint stack-s"><b>First visible action</b><p class="small">Put on your running clothes and begin the planned warm-up. Then decide.</p><button class="btn primary sm" data-act="stkStart" data-key="${k}" data-date="${d}">Start the warm-up</button></div>`
    : `<div class="card tint stack-s"><b>Define the first visible action</b><label class="f">First action (a verb)<input class="inp" id="stkTitle" maxlength="120" placeholder="Open a blank doc titled ‘Offer’"></label><label class="f">What will exist afterward<input class="inp" id="stkOut2" maxlength="160" placeholder="A doc with one sentence in it"></label><button class="btn primary sm" data-act="stkFirst" data-key="${k}" data-date="${d}">Use as today’s first step</button></div>`;
  if (v === 'big') return `<div class="card tint stack-s"><b>Reduce the scope</b><p class="small">${it.minTitle ? 'Smaller version: ' + esc(it.minTitle) + '.' : isTrain ? 'Do the warm-up only, then reassess.' : ''}</p><button class="btn primary sm" data-act="${isTrain ? 'stkStart' : 'stkSmall'}" data-key="${k}" data-date="${d}">${isTrain ? 'Start the warm-up' : 'Use the smaller version today'}</button></div>`;
  if (v === 'quality') return `<div class="card tint stack-s"><b>Create a private rough version</b><p class="small">No one sees it. Done when something messy exists.</p><button class="btn primary sm" data-act="stkRough" data-key="${k}" data-date="${d}">Start a rough version</button></div>`;
  if (v === 'attention') return `<div class="card tint stack-s"><label class="f">What’s occupying me? <span class="hint">Optional, one sentence</span><input class="inp" id="stkMind" maxlength="200"></label><div class="btn-row"><button class="btn primary sm" data-act="stkBegin" data-key="${k}" data-date="${d}">Begin now</button><button class="btn sm" data-act="stkNotNow">Not now</button></div></div>`;
  if (v === 'resources') {
    const target = isTrain ? null : findRoomyDay(ds, it.minutes || 0);
    return `<div class="card tint stack-s"><b>A feasible alternative, or a new time</b>${isTrain ? '' : `<label class="f">Alternative for today<input class="inp" id="stkAlt" maxlength="120" placeholder="Sketch the chart on paper instead"></label><button class="btn sm" data-act="stkAlt" data-key="${k}" data-date="${d}">Do this instead today</button>`}${target ? `<button class="btn sm" data-act="adjMove" data-key="${k}" data-date="${d}" data-to="${target}">Move to ${esc(dShort(target))}</button>` : isTrain ? '<button class="btn sm" data-act="goPlanClose">Review training plan</button>' : '<p class="tiny muted">No day this week has room by your available-time settings.</p>'}</div>`;
  }
  return `<div class="card tint stack-s"><b>Choose what you need</b><div class="btn-row">${isTrain ? '' : `<button class="btn sm" data-act="stkSmall" data-key="${k}" data-date="${d}">A smaller commitment</button>`}<button class="btn sm" data-act="stkSupport">Support</button></div>${restBox(it, ds)}<div id="feelOut"></div></div>`;
}
A.stkStart = (el) => { const { ds, it } = itemFrom(el); closeSheet(true); startFor(it, ds); };
A.stkSmall = (el) => { markSmaller(el.dataset.date, el.dataset.key, 'I’m stuck'); save(); closeSheet(); render(); toast('Smaller version for today. The original stays on record.'); };
A.stkRough = (el) => { const { ds, it } = itemFrom(el); closeSheet(true); startFor(it, ds); if (it.kind !== 'train') upsertOcc(it, ds, { note: 'Private rough version' }); };
A.stkBegin = (el) => { const { ds, it } = itemFrom(el); const m = val('stkMind'); if (m) noteStuck({ date: ds, key: it.key, kind: 'occupied', text: m }); closeSheet(true); startFor(it, ds); };
A.stkNotNow = () => { const m = val('stkMind'); if (m) noteStuck({ date: SH.stk.ds, key: SH.stk.key, kind: 'occupied', text: m }); save(); closeSheet(); render(); };
A.stkSupport = () => { SH.feel = null; $('#feelOut').innerHTML = supportBox(); };
A.stkFirst = (el) => {
  const { ds, it } = itemFrom(el); const title = val('stkTitle'), out = val('stkOut2');
  if (!title || !out) { toast('Add the first action and what will exist afterward.'); return; }
  if (it.kind === 'biz') { const a = newAction({ title, finish: out, minutes: 10, category: it.category }); a.order = Math.min(0, ...S.business.actions.map((x) => x.order || 0)) - 1; S.business.nextFor[ds] = a.id; }
  else createOneOff(it.area, title, out, 10, ds);
  logChange({ date: ds, key: it.key, refId: it.kind === 'biz' ? it.actionId : it.taskId, title: it.plannedTitle || it.title, kind: 'clarified', to: title });
  save(); closeSheet(); render(); toast('First step added to today.');
};
A.stkAlt = (el) => {
  const { ds, it } = itemFrom(el); const alt = val('stkAlt'); if (!alt) return;
  createOneOff(it.area, alt, 'Done as an alternative', Math.max(5, Math.round((it.minutes || 10) / 2)), ds);
  logChange({ date: ds, key: it.key, refId: it.kind === 'biz' ? it.actionId : it.taskId, title: it.plannedTitle || it.title, kind: 'replaced', to: alt });
  save(); closeSheet(); render(); toast('Alternative added. The original stays on record.');
};

/* ---------- What moved forward: only logged facts ---------- */
function movedForward(ws) {
  const we = dAdd(ws, 6); const out = []; const inW = (d) => d >= ws && d <= we;
  for (const o of Object.values(S.occ)) if (inW(o.date) && o.kind === 'biz' && o.status === 'done' && o.planned) out.push(`Finished “${o.planned.title}”${o.planned.finish ? ': ' + o.planned.finish.charAt(0).toLowerCase() + o.planned.finish.slice(1) : ''}.`);
  const ps = planningStats(ws); if (ps.led) out.push(`${plural(ps.led, 'planning session')} led to a scheduled action${ps.executed ? `, ${ps.executed} already done` : ''}.`);
  const paid = S.money.billPaid.filter((p) => inW(p.paidOn)).length; if (paid) out.push(`Marked ${plural(paid, 'bill')} paid.`);
  const bal = S.money.balances.filter((b) => inW(b.date)).length; if (bal) out.push(`Confirmed ${plural(bal, 'account balance')}.`);
  const sav = new Set(savingsAccounts().map((a) => a.id));
  const moved = S.money.tx.filter((x) => inW(x.date) && x.type === 'transfer' && sav.has(x.to)).reduce((s, x) => s + x.amount, 0); if (moved) out.push(`Moved ${money(moved)} into savings.`);
  const st = weekStats(ws);
  if (st.spend.complete + st.spend.none) out.push(`Recorded spending on ${plural(st.spend.complete + st.spend.none, 'day')}.`);
  if (st.train.completed) out.push(`Completed ${plural(st.train.completed, 'planned training session')}.`);
  if (st.train.rest) out.push(`Followed ${plural(st.train.rest, 'planned rest day')}.`);
  if (st.train.modified) out.push(`Showed up for ${plural(st.train.modified, 'modified session')}.`);
  if (st.art.participated + st.art.extra) out.push(`Made time for art on ${plural(st.art.participated + st.art.extra, 'day')}.`);
  for (const r of S.returns) if (inW(r.date)) out.push(`Returned after ${plural(r.missed, 'missed day')}.`);
  const kept = S.life.filter((l) => inW(l.date) && l.status === 'done').length; if (kept) out.push(`Kept ${plural(kept, 'personal commitment')}.`);
  for (const r of S.business.results) if (inW(r.date)) out.push(`Recorded a business result: ${r.type.toLowerCase()}${r.note ? ' (' + r.note + ')' : ''}.`);
  if (st.checkins) out.push(`Checked in on ${plural(st.checkins, 'evening')}.`);
  return out;
}
function movedForwardHtml(ws) {
  const m = movedForward(ws);
  return m.length ? `<ul class="small" style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px">${m.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="small muted">Nothing logged yet this week.</p>';
}

/* ---------- First week: judged by usability, not outcomes ---------- */
const FIRST_Q = [['quick', 'Can I understand today’s plan quickly?'], ['fits', 'Does it fit my available time?'], ['honest', 'Can I log honestly without much effort?'], ['return', 'Can I return after a missed day?']];
function firstWeekQuestions() {
  return `<details class="more"><summary>What this first week answers</summary><ul class="small" style="margin:6px 0 0;padding-left:18px">${FIRST_Q.map((q) => `<li>${q[1]}</li>`).join('')}<li>Which actions need to become clearer or smaller?</li></ul><p class="tiny muted mt-s">Not savings, revenue, fitness or mood. Those take longer than a week.</p></details>`;
}
function firstWeekBanner(td) {
  const c = S.settings.calibrationStart;
  if (!c || S.firstWeek || dDiff(c, td) < 6) return '';
  return `<section class="banner"><div class="h3">First-week check · 2 minutes</div><p class="small">Five questions about whether the app fits your life.</p><div><button class="btn primary sm" data-act="firstWeek">Answer</button></div></section>`;
}
A.firstWeek = () => openSheet(() => `${sheetHead('First-week check', 'About the app, not about you')}
  ${FIRST_Q.map(([k, q]) => `<div class="stack-s"><div class="h3">${q}</div>${seg('fw-' + k, [['yes', 'Yes'], ['partly', 'Partly'], ['no', 'Not yet']], null)}</div>`).join('')}
  <label class="f">Which actions need to become clearer or smaller?<textarea class="inp" id="fwClear" maxlength="400"></textarea></label>
  <p class="tiny muted">Savings, revenue, fitness and mood aren’t part of this check.</p>
  <button class="btn primary" data-act="firstWeekSave">${t('btn.save')}</button>`);
A.firstWeekSave = () => {
  S.firstWeek = { at: nowISO(), clearer: val('fwClear') }; for (const [k] of FIRST_Q) S.firstWeek[k] = getPick('fw-' + k);
  save(); closeSheet(); render(); toast('Saved. Any “not yet” is a design fix, not a personal one.');
};

/* ---------- Later improvements (kept out of the daily workflow) ---------- */
function renderLaterImprovements() {
  const c = S.settings.calibrationStart; const n = c ? dDiff(c, today()) + 1 : null;
  const list = S.later.filter((x) => x.kind === 'improvement');
  return `<section class="card stack-s"><div class="h3">Later improvements</div>
    <p class="small muted">${n && n <= 7 ? `Trial week, day ${n} of 7. Capture ideas for the app here and keep using the current workflow. Bugs and accessibility problems can be fixed anytime.` : 'Capture app ideas here instead of redesigning in the moment. Bugs and accessibility problems can be fixed anytime.'}</p>
    ${list.map((x) => `<div class="row-between small"><span class="grow">${esc(x.text)}</span><button class="btn ghost sm" data-act="laterDel" data-id="${x.id}" aria-label="Remove">×</button></div>`).join('')}
    <div class="row"><input class="inp grow" id="laterImp" maxlength="160" placeholder="An idea for the app" aria-label="An idea for the app"><button class="btn sm" data-act="laterAdd" data-kind="improvement" data-src="laterImp">Add</button></div></section>`;
}
