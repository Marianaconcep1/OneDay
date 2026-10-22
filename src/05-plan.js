/* ---------- Plan ---------- */
let PLAN_OPEN = null;
let PLAN_WEEK = 0;
const OPEN_SECTS = new Set();
document.addEventListener('toggle', (e) => { const d = e.target; if (d.classList && d.classList.contains('sect') && d.id) { if (d.open) OPEN_SECTS.add(d.id); else OPEN_SECTS.delete(d.id); } }, true);
function sect(id, title, sub, body) {
  const open = OPEN_SECTS.has('sect-' + id) || PLAN_OPEN === id;
  if (PLAN_OPEN === id) OPEN_SECTS.add('sect-' + id);
  return `<details class="sect" id="sect-${id}" ${open ? 'open' : ''}><summary><span class="dot ${id}" style="width:10px;height:10px;border-radius:50%;flex:none"></span><span class="grow"><b>${title}</b><br><span class="small muted">${sub}</span></span></summary><div class="sect-body">${body}</div></details>`;
}

function renderPlan() {
  const td = today();
  const ws = dAdd(weekStart(td), PLAN_WEEK * 7);
  const wk = S.business.weekly[weekStart(td)] || '';
  let h = `<header class="topbar"><div><div class="eyebrow">${t('tagline')}</div><h1 class="view-h">Plan</h1></div></header><div class="stack-l">`;
  h += `<section class="stack-s"><div class="row-between"><button class="btn ghost sm" data-act="planWeek" data-d="-1" aria-label="Previous week">‹</button><b class="small">${PLAN_WEEK === 0 ? 'This week' : 'Week of ' + esc(dMD(ws))}</b><button class="btn ghost sm" data-act="planWeek" data-d="1" aria-label="Next week">›</button></div>
    <div class="weekstrip">${weekDates(ws).map((d) => { const dm = dayMinutes(d); return `<button class="wday ${d === td ? 'today' : ''}" data-act="openDay" data-date="${d}"><span class="wd">${DOW_SHORT[dDow(d)]}</span><span class="wn">${Number(d.slice(8))}</span><span class="wm num ${dm.over ? 'over' : ''}">${dm.total}m</span></button>`; }).join('')}</div>
    <p class="tiny muted">Minutes planned each day, in amber when it’s more than your available time. Tap a day to adjust just that day.</p></section>`;
  h += renderWeekCard(ws);
  h += sect('goals', 'Goals', S.goals.length ? plural(activeGoals().length, 'active or maintained goal') : 'Savings, revenue, distance, milestones', renderGoals());
  h += sect('business', t('area.business'), esc(S.business.stage ? 'Stage: ' + S.business.stage : 'Direction, schedule and next actions'), renderBizPlan());
  h += sect('training', t('area.training'), S.training.templates.length ? 'Weekly plan entered' : 'Not set up yet', renderTrainPlan());
  h += sect('money', t('area.money'), S.money.accounts.length ? 'Payday plan, bills and savings' : 'Not set up yet', renderMoneyPlan());
  h += sect('art', t('area.art'), 'Small, private, allowed to be unfinished', renderArtPlan());
  h += sect('tasks', 'Other scheduled tasks', 'Recurring or one-off', renderTaskList());
  h += '</div>';
  PLAN_OPEN = null;
  return h;
}
A.planWeek = (el) => { PLAN_WEEK += Number(el.dataset.d); render(); };

/* Day detail: date-specific exceptions */
A.openDay = (el) => openDay(el.dataset.date);
function openDay(ds) {
  openSheet(() => {
    const items = itemsFor(ds); const dm = dayMinutes(ds); const past = ds < today();
    const offTasks = S.exceptions.filter((e) => e.date === ds && e.kind === 'off');
    return `${sheetHead(esc(dLong(ds)), `${minsLabel(dm.total)}${dm.unknown ? '+' : ''} planned${dm.avail != null ? ' · ' + minsLabel(dm.avail) + ' available' : ''}`)}
      <div class="stack">${items.map((it) => `<div class="card flat stack-s"><div class="row-between"><b class="grow">${esc(it.title)}</b>${pill(it)}</div>
        ${it.kind === 'train' && it.session ? `<div class="small muted">${S.training.overrides[ds] ? 'Changed for this date only' : 'From your weekly plan'}</div>` : ''}
        <div class="btn-row">
        ${it.kind === 'spend' ? `<button class="btn sm" data-act="openSpendDay" data-date="${ds}">${past ? 'Open record' : 'Log'}</button>` : ''}
        ${it.kind === 'task' || (it.kind === 'biz' && !it.needsAction) ? `<button class="btn sm" data-act="openLogDay" data-key="${esc(it.key)}" data-date="${ds}">${t('btn.log')}</button>` : ''}
        ${(it.kind === 'task' || it.kind === 'biz') && !past && !it.unplanned && !it.occ ? `<button class="btn ghost sm" data-act="dayOff" data-key="${esc(it.key)}" data-date="${ds}">Not this day</button>` : ''}
        ${it.kind === 'train' ? `<button class="btn sm" data-act="trainLogDay" data-date="${ds}">${t('btn.log')}</button>${past ? '' : `<button class="btn ghost sm" data-act="dayTrain" data-date="${ds}">Change this date</button>`}` : ''}
        </div></div>`).join('')}
        ${!items.some((i) => i.kind === 'train') && !past ? `<button class="btn sm" data-act="dayTrain" data-date="${ds}">Add a training session on this date</button>` : ''}
        ${offTasks.length ? `<div class="card tint stack-s"><b>Not scheduled this day</b>${offTasks.map((e) => `<div class="row-between"><span class="small">${esc(e.refId === 'bizblock' ? 'Business block' : ((S.tasks.find((x) => x.id === e.refId) || {}).versions || [{ title: 'Task' }]).slice(-1)[0].title)}</span><button class="btn ghost sm" data-act="dayRestore" data-id="${e.id}" data-date="${ds}">Restore</button></div>`).join('')}</div>` : ''}
        ${S.training.overrides[ds] && !past ? `<button class="btn ghost sm" data-act="dayTrainReset" data-date="${ds}">Use the weekly plan for training on this date</button>` : ''}
      </div><div id="dayTrainForm"></div>`;
  });
}
A.openSpendDay = (el) => { closeSheet(true); openSpend(el.dataset.date); };
A.openLogDay = (el) => { closeSheet(true); openLog(el.dataset.key, el.dataset.date); };
A.trainLogDay = (el) => { closeSheet(true); openTrainLog(el.dataset.date); };
A.dayOff = (el) => {
  const key = el.dataset.key, ds = el.dataset.date;
  const refId = key.startsWith('biz@') ? 'bizblock' : key.slice(2).split('@')[0];
  if (refId === 'bizblock' && S.business.nextFor[ds]) delete S.business.nextFor[ds];
  S.exceptions = S.exceptions.filter((e) => !(e.refId === refId && e.date === ds));
  S.exceptions.push({ id: uid('ex'), refId, date: ds, kind: 'off', createdAt: nowISO() });
  const it0 = findItem(key, ds); logChange({ date: ds, key, refId: refId === 'bizblock' && it0 && it0.actionId ? it0.actionId : refId, title: it0 ? (it0.plannedTitle || it0.title) : key, kind: 'removed', from: dMD(ds), to: 'not scheduled that day' });
  save(); refreshSheet(); render(); toast('Not scheduled on ' + dMD(ds) + '. It won’t count as missed.');
};
A.dayRestore = (el) => { S.exceptions = S.exceptions.filter((e) => e.id !== el.dataset.id); save(); refreshSheet(); render(); };
A.dayTrain = (el) => {
  const ds = el.dataset.date; const s = sessionFor(ds) || {};
  $('#dayTrainForm').innerHTML = `<div class="card stack"><b>Session for ${esc(dMD(ds))} only</b>${sessionFields('dt', s)}<button class="btn primary sm" data-act="dayTrainSave" data-date="${ds}">Save for this date</button></div>`;
  $('#dayTrainForm').scrollIntoView({ block: 'nearest' });
};
A.dayTrainSave = (el) => {
  const ds = el.dataset.date; const s = readSession('dt');
  S.training.overrides[ds] = s; save(); refreshSheet(); render(); toast('Changed for ' + dMD(ds) + ' only.');
};
A.dayTrainReset = (el) => { delete S.training.overrides[el.dataset.date]; save(); refreshSheet(); render(); };
function sessionFields(p, s) {
  const unit = S.training.profile.unit || 'mi';
  return `<div class="grid2"><label class="f">Type<select class="inp" id="${p}Type"><option value="">Not scheduled</option>${Object.entries(SESSION_TYPES).map(([k, l]) => `<option value="${k}" ${s && s.type === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="f">Minutes<input class="inp num" id="${p}Mins" type="number" min="0" max="600" value="${esc(s && s.minutes != null ? s.minutes : '')}"></label></div>
    <div class="grid2"><label class="f">Distance (${unit})<input class="inp num" id="${p}Dist" type="number" step="0.01" min="0" max="200" value="${esc(s && s.distance != null ? s.distance : '')}"></label>
    <label class="f">Detail<input class="inp" id="${p}Det" maxlength="80" value="${esc(s && s.detail || '')}" placeholder="From your plan"></label></div>`;
}
function readSession(p) {
  const type = $('#' + p + 'Type').value;
  if (!type) return null;
  return { type, minutes: type === 'rest' ? 0 : numOrNull(val(p + 'Mins')), distance: type === 'rest' ? null : numOrNull(val(p + 'Dist')), detail: val(p + 'Det') };
}

/* Business */
function renderBizPlan() {
  const b = S.business; const block = bizBlockAt(today()) || { days: [], minutes: 15 };
  const acts = openActions();
  const stages = ['exploring', 'validating', 'building an offer', 'finding clients', 'delivering'];
  return `<label class="f">Direction<textarea class="inp" id="bzDir" maxlength="400">${esc(b.direction)}</textarea></label>
    <label class="f">Who I want to help<input class="inp" id="bzWho" maxlength="160" value="${esc(b.who)}" placeholder="e.g. Local service businesses with 2–20 staff"></label>
    <label class="f">What problem I solve<input class="inp" id="bzProb" maxlength="200" value="${esc(b.problem)}"></label>
    <label class="f">My offer or current hypothesis<input class="inp" id="bzOffer" maxlength="200" value="${esc(b.offer)}"></label>
    <div class="stack-s"><div class="h3">Stage</div><div data-toggleable>${chips('bzStage', stages.map((s) => [s, s[0].toUpperCase() + s.slice(1)]), b.stage)}</div></div>
    <label class="f">One outcome for the next four weeks<input class="inp" id="bzOut" maxlength="200" value="${esc(b.outcome4w)}" placeholder="e.g. Three conversations with potential clients"></label>
    <button class="btn sm" data-act="bizSave">Save direction</button>
    <details class="more"><summary>Business block schedule</summary><div class="stack mt-s"><p class="small muted">A short, regular block. One next action per block.</p>${dayPicker('bzDays', block.days)}<label class="f">Minutes per block<input class="inp num" id="bzMins" type="number" min="5" max="240" value="${esc(block.minutes)}"></label><button class="btn sm" data-act="bizBlockSave">Save schedule</button><p class="tiny muted">Schedule changes apply from today. Past days keep their schedule.</p></div></details>
    <div class="stack-s"><div class="row-between"><div class="h3">Next actions, in order</div><button class="btn sm primary" data-act="newAction">${t('btn.add')}</button></div>
    <div class="list">${acts.map((a, i) => `<div class="li"><div class="grow"><b>${esc(a.title)}</b><div class="tiny muted">Done when: ${esc(a.finish)} · ${minsLabel(a.minutes)}${a.category ? ' · ' + esc(a.category) : ''}${a.date ? ' · ' + esc(dMD(a.date)) : ''}</div></div><button class="btn ghost sm" data-act="actUp" data-id="${a.id}" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button><button class="btn ghost sm" data-act="actEdit" data-id="${a.id}">${t('btn.edit')}</button></div>`).join('') || '<div class="empty">No actions yet. Add one with a visible finish line.</div>'}</div>
    ${b.actions.filter((a) => a.doneOn).length ? `<details class="more"><summary>Finished actions (${b.actions.filter((a) => a.doneOn).length})</summary><div class="list">${b.actions.filter((a) => a.doneOn).sort((x, y) => (x.doneOn < y.doneOn ? 1 : -1)).slice(0, 30).map((a) => `<div class="li"><div class="grow small">${esc(a.title)} <span class="muted">· ${esc(dMD(a.doneOn))}</span></div></div>`).join('')}</div></details>` : ''}</div>
    <div class="stack-s"><div class="row-between"><div class="h3">Results</div><button class="btn sm" data-act="resultForm">${t('btn.add')}</button></div><p class="tiny muted">Milestones, inquiries, clients and revenue, recorded separately from effort.</p>
    <div class="list">${b.results.slice().sort((x, y) => (x.date < y.date ? 1 : -1)).slice(0, 20).map((r) => `<div class="li"><div class="grow"><b>${esc(r.type)}</b> <span class="small muted">${esc(dMD(r.date))}${r.amount != null ? ' · ' + money(r.amount) : ''}${r.note ? ' · ' + esc(r.note) : ''}</span></div><button class="btn ghost sm" data-act="resultDel" data-id="${r.id}">${t('btn.delete')}</button></div>`).join('') || '<div class="empty">Nothing recorded yet.</div>'}</div></div>`;
}
A.bizSave = () => {
  const b = S.business;
  b.direction = val('bzDir'); b.who = val('bzWho'); b.problem = val('bzProb'); b.offer = val('bzOffer'); b.stage = getPick('bzStage');
  const o = val('bzOut'); if (o !== b.outcome4w) { b.outcome4w = o; b.outcome4wSet = today(); }
  save(); render(); toast('Direction saved.');
};
A.bizBlockSave = () => {
  const days = getPicks('bzDays').map(Number); const minutes = numOrNull(val('bzMins')) || 15;
  pushVersion(S.business.block, { days, minutes }, today()); save(); render(); toast('Schedule saved from today on.');
};
A.actEdit = (el) => openActionForm(el.dataset.id);
A.actUp = (el) => {
  const acts = openActions(); const i = acts.findIndex((a) => a.id === el.dataset.id);
  if (i > 0) { const o = acts[i].order; acts[i].order = acts[i - 1].order; acts[i - 1].order = o; if (acts[i].order === acts[i - 1].order) acts[i].order -= 0.5; save(); render(); }
};
A.resultForm = () => {
  openSheet(() => `${sheetHead('Record a business result', 'Results, not effort')}
    ${seg('rsType', [['Milestone', 'Milestone'], ['Inquiry', 'Inquiry'], ['Client', 'Client'], ['Revenue', 'Revenue']], 'Milestone')}
    <div class="grid2"><label class="f">Date<input class="inp" id="rsDate" type="date" value="${today()}"></label><label class="f">Amount <span class="hint">Revenue only</span><input class="inp num" id="rsAmt" inputmode="decimal" placeholder="0.00"></label></div>
    <label class="f">Note<input class="inp" id="rsNote" maxlength="200"></label>
    <button class="btn primary" data-act="resultSave">${t('btn.save')}</button>`);
};
A.resultSave = () => {
  const type = getPick('rsType'); const amt = parseCents(val('rsAmt'));
  if (Number.isNaN(amt)) { toast('Enter an amount like 250.00'); return; }
  S.business.results.push({ id: uid('res'), type, date: val('rsDate') || today(), amount: type === 'Revenue' ? amt : null, note: val('rsNote'), createdAt: nowISO() });
  save(); closeSheet(); render(); toast('Result recorded.');
};
A.resultDel = (el) => confirmBox('Delete this result?', t('btn.delete'), () => { S.business.results = S.business.results.filter((r) => r.id !== el.dataset.id); save(); render(); }, true);

/* Training */
function renderTrainPlan() {
  const p = S.training.profile; const tpl = trainTemplateAt(dAdd(today(), 0)) || S.training.templates.slice(-1)[0];
  const days = (tpl && tpl.days) || {};
  const futureTpl = S.training.templates.filter((x) => x.from > today());
  const ov = Object.keys(S.training.overrides).filter((d) => d >= today()).sort();
  return `<p class="small muted">This app records the plan you choose and how training actually went. It doesn’t create a personalized marathon schedule, pace or mileage progression.</p>
    <details class="more" ${S.training.templates.length ? '' : 'open'}><summary>What you know so far</summary><div class="stack mt-s"><p class="tiny muted">Leave anything you don’t know blank. It stays unknown.</p>
      <div class="grid2"><label class="f">Race date<input class="inp" id="tpRace" type="date" value="${esc(p.raceDate)}"></label><label class="f">Units<select class="inp" id="tpUnit"><option value="mi" ${p.unit === 'mi' ? 'selected' : ''}>Miles</option><option value="km" ${p.unit === 'km' ? 'selected' : ''}>Kilometers</option></select></label></div>
      <div class="grid2"><label class="f">Current weekly distance<input class="inp num" id="tpWeekly" inputmode="decimal" value="${esc(p.weeklyDistance)}"></label><label class="f">Longest recent run<input class="inp num" id="tpLong" inputmode="decimal" value="${esc(p.longestRun)}"></label></div>
      <label class="f">Recent consistency<input class="inp" id="tpCons" maxlength="160" value="${esc(p.consistency)}" placeholder="e.g. 2 runs a week for the last month"></label>
      <label class="f">Running days available<input class="inp" id="tpDays" maxlength="120" value="${esc(p.runDays)}"></label>
      <label class="f">Strength-training schedule<input class="inp" id="tpStr" maxlength="120" value="${esc(p.strength)}"></label>
      <label class="f">Injury, pain or other limitations<input class="inp" id="tpLim" maxlength="200" value="${esc(p.limitations)}"></label>
      <div class="stack-s"><div class="h3">Do you already have a training plan?</div><div data-toggleable>${chips('tpHas', [['yes', 'Yes'], ['no', 'Not yet']], p.hasPlan)}</div></div>
      <label class="f">Plan source <span class="hint">e.g. coach, app or book</span><input class="inp" id="tpSrc" maxlength="120" value="${esc(p.planSource)}"></label>
      <button class="btn sm" data-act="tpSave">Save</button></div></details>
    <div class="stack-s"><div class="h3">Weekly plan</div><p class="tiny muted">Enter the sessions from the plan you’re following. Rest days count as following the plan.</p>
      ${DOW_ORDER.map((d) => { const s = days[d]; return `<div class="card flat stack-s"><b>${DOW_SHORT[d]}</b>${sessionFields('tw' + d, s)}</div>`; }).join('')}
      <label class="f">Applies from<input class="inp" id="twFrom" type="date" value="${today()}"></label>
      <button class="btn primary sm" data-act="twSave">Save weekly plan</button><p class="tiny muted">Earlier days keep the plan they had. Missed sessions are never added to later ones.</p>
      ${futureTpl.length ? `<p class="small">Scheduled change: a new weekly plan starts ${futureTpl.map((x) => esc(dMD(x.from))).join(', ')}.</p>` : ''}</div>
    ${ov.length ? `<div class="stack-s"><div class="h3">Date-specific changes</div>${ov.map((d) => `<div class="row-between small"><span>${esc(dShort(d))}: ${esc(sessionLabel(S.training.overrides[d]))}</span><button class="btn ghost sm" data-act="ovDel" data-date="${d}">Remove</button></div>`).join('')}</div>` : ''}`;
}
A.tpSave = () => {
  const p = S.training.profile;
  Object.assign(p, { raceDate: val('tpRace'), unit: $('#tpUnit').value, weeklyDistance: val('tpWeekly'), longestRun: val('tpLong'), consistency: val('tpCons'), runDays: val('tpDays'), strength: val('tpStr'), limitations: val('tpLim'), hasPlan: getPick('tpHas'), planSource: val('tpSrc') });
  save(); render(); toast('Saved.');
};
A.twSave = () => {
  const from = val('twFrom') || today();
  const days = {}; for (const d of DOW_ORDER) days[d] = readSession('tw' + d);
  if (!Object.values(days).some(Boolean)) { toast('Add at least one session or rest day.'); return; }
  S.training.templates = S.training.templates.filter((x) => x.from !== from);
  S.training.templates.push({ id: uid('tpl'), from, days, createdAt: nowISO() });
  S.training.templates.sort((a, b) => (a.from < b.from ? -1 : 1));
  save(); render(); toast('Weekly plan saved from ' + dMD(from) + '.');
};
A.ovDel = (el) => { delete S.training.overrides[el.dataset.date]; save(); render(); };

/* Money */
function renderMoneyPlan() {
  const td = today(); const m = S.money; const est = paydayEstimate(td);
  const sv = confirmedSavings(td);
  const plan = est.end ? m.plans[planKey(est)] : null;
  const remainingAfter = est.complete ? est.total - ((plan && plan.contribution) || 0) : null;
  const upcoming = obligationsBetween(td, est.end || dAdd(td, 35));
  return `<p class="small muted">${t('not.advice')}</p>
    <div class="card tint stack-s"><div class="h3">Savings</div>
      <div class="kv"><span>Confirmed savings</span><span>${sv.value == null ? 'Not confirmed yet' : money(sv.value)}</span><span>First buffer goal</span><span>${m.buffer.amount == null ? t('notset') : money(m.buffer.amount)}</span></div>
      ${sv.parts.map((x) => `<p class="tiny muted">${esc(x.account.name)}: ${x.pos.balance ? `confirmed ${money(x.pos.balance.amount)} on ${esc(dMD(x.pos.balance.date))}${x.pos.afterCount ? `, ${x.pos.after >= 0 ? '+' : ''}${money(x.pos.after)} from ${plural(x.pos.afterCount, 'transfer')} recorded after that` : ''}` : 'no confirmed balance yet'}.</p>`).join('')}
      <p class="tiny muted">A confirmed balance already includes transfers dated on or before it, so nothing is counted twice. Planned transfers don’t count until they’re marked done.</p>
      <div class="row"><input class="inp num grow" id="bufAmt" inputmode="decimal" placeholder="Buffer goal, e.g. 500.00" value="${esc(centsToInput(m.buffer.amount))}" aria-label="Buffer goal"><button class="btn sm" data-act="bufSave">Set goal</button></div></div>

    <div class="stack-s"><div class="h3">Payday plan</div><p class="tiny muted">Work through it on payday or once a week.</p>
      <div class="card flat stack-s"><b>1. Money available now</b>
        ${spendAccounts().map((a) => { const p = accountPosition(a.id, td); return `<div class="row-between small"><span>${esc(a.name)}</span><span class="num">${p.value == null ? 'Not confirmed' : money(p.value) + ' <span class="muted">(' + esc(dMD(p.balance.date)) + ')</span>'}</span></div>`; }).join('') || '<p class="small muted">No spending account yet.</p>'}
        <button class="btn sm" data-act="balForm">Confirm a balance</button></div>
      <div class="card flat stack-s"><b>2. Upcoming income</b>
        ${m.incomes.filter((i) => !i.received).sort((a, b) => (a.date < b.date ? -1 : 1)).map((i) => `<div class="row-between small"><span>${esc(i.name)} · ${esc(dMD(i.date))}</span><span class="row"><span class="num">${money(i.amount)}</span><button class="btn ghost sm" data-act="incReceived" data-id="${i.id}">Received</button><button class="btn ghost sm" data-act="incDel" data-id="${i.id}" aria-label="Delete">×</button></span></div>`).join('') || '<p class="small muted">None entered.</p>'}
        <button class="btn sm" data-act="incForm">Add expected income</button></div>
      <div class="card flat stack-s"><b>3. Bills, minimum payments and essentials</b>
        ${upcoming.map((o) => `<div class="row-between small"><span>${esc(o.bill.name)} · due ${esc(dMD(o.due))}</span><span class="row"><span class="num">${money(o.bill.kind === 'minimum' && o.bill.minimum != null ? o.bill.minimum : o.bill.amount)}</span>${o.paid ? '<span class="pill done">Paid</span>' : `<button class="btn ghost sm" data-act="billPaid" data-id="${o.bill.id}" data-due="${o.due}">Mark paid</button>`}</span></div>`).join('') || '<p class="small muted">Nothing due in this period.</p>'}
        ${m.bills.filter((b) => b.kind === 'essential' && !b.due && !b.archived).map((b) => `<div class="row-between small"><span>${esc(b.name)} (essential)</span><span class="num">${money(b.amount)}</span></div>`).join('')}
        <div class="btn-row"><button class="btn sm" data-act="billForm">Add bill or essential</button>${m.bills.length ? '<button class="btn ghost sm" data-act="billList">Edit list</button>' : ''}</div></div>
      <div class="card flat stack-s"><b>4. What must be covered before ${est.end ? esc(dMD(est.end)) : 'the next payday'}</b>
        <div class="calc">${est.lines.map((l) => `<span class="${l.amount < 0 ? 'neg' : ''}">${l.amount < 0 ? '− ' : ''}${esc(l.label)}</span><span>${money(Math.abs(l.amount))}</span>`).join('')}
        ${plan && plan.contribution ? `<span class="neg">− Planned savings contribution${plan.doneTxId ? ' (done)' : ''}</span><span>${money(plan.contribution)}</span>` : ''}
        <span class="total">${t('estimate')}: remaining ${est.end ? dMD(td) + '–' + dMD(est.end) : ''}</span><span class="total">${est.complete ? money(remainingAfter) : 'Incomplete'}</span></div>
        ${est.missing.length ? `<div class="banner warn"><b class="small">Missing inputs</b><ul class="small" style="margin:0;padding-left:18px">${est.missing.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
        <p class="tiny muted">An estimate from what you entered, for ${est.end ? 'today through the day before ' + esc(dMD(est.end)) : 'a period that starts once you add a payday'}. It is not a guaranteed “safe to spend” amount.</p></div>
      <div class="card flat stack-s"><b>5. Savings contribution for this period</b>
        ${est.end ? `<div class="row"><input class="inp num grow" id="contribAmt" inputmode="decimal" placeholder="0.00" value="${esc(plan ? centsToInput(plan.contribution) : '')}" aria-label="Contribution"><button class="btn sm" data-act="contribSave">Plan it</button></div>
        ${!est.complete ? '<p class="tiny muted">Some inputs are missing, so the app can’t check whether a transfer would leave obligations uncovered.</p>' : est.total <= 0 ? '<p class="small"><b>Known obligations aren’t covered yet, so a savings transfer isn’t suggested this period.</b></p>' : ''}
        ${plan && plan.contribution ? (plan.doneTxId ? `<p class="small"><span class="pill done">Transfer done</span> ${money(plan.contribution)} counted in savings.</p>` : `<p class="small">Planned, not done yet. It isn’t counted as savings.</p><button class="btn primary sm" data-act="contribDone">Mark transfer completed</button>`) : ''}` : '<p class="small muted">Add your next expected income first.</p>'}</div>
      ${est.complete && remainingAfter < 0 ? `<div class="card pinkt stack-s"><b>6. The plan doesn’t balance. Choose one concrete action.</b>${chips('fixAct', [['Call to ask about moving one due date', 'Ask to move a due date'], ['Confirm one unknown amount', 'Confirm an unknown amount'], ['Review one subscription', 'Review one subscription'], ['Lower one essential estimate', 'Lower one essential estimate'], ['Lower this period’s savings contribution', 'Lower the contribution']], null)}<button class="btn sm" data-act="fixSave">Add it to tomorrow</button></div>` : ''}
    </div>
    <div class="stack-s"><div class="h3">Accounts <span class="hint">Optional</span></div>
      ${m.accounts.filter((a) => !a.archived).map((a) => `<div class="row-between small"><span>${esc(a.name)} · ${esc(a.kind)}</span><button class="btn ghost sm" data-act="acctDel" data-id="${a.id}">Remove</button></div>`).join('') || '<p class="small muted">No accounts. You can log spending without them.</p>'}
      <div class="row"><input class="inp grow" id="acName" maxlength="40" placeholder="Account name" aria-label="Account name"><select class="inp" id="acKind" style="width:auto" aria-label="Type"><option value="checking">Checking</option><option value="savings">Savings</option><option value="cash">Cash</option><option value="credit">Credit card</option></select><button class="btn sm" data-act="acctAdd">${t('btn.add')}</button></div></div>
    <div class="stack-s"><div class="h3">Small money tasks</div><div class="btn-row">${[['List bills due before the next payday', 'A list with dates and amounts, unknowns marked'], ['Confirm one unknown minimum payment', 'One amount confirmed and entered'], ['Review one subscription', 'Keep, pause or cancel decided'], ['Complete a planned transfer', 'Transfer made and marked done']].map(([a, f]) => `<button class="btn sm" data-act="moneyTask" data-title="${esc(a)}" data-finish="${esc(f)}">${esc(a)}</button>`).join('')}</div><p class="tiny muted">Adds it to today as a one-off task.</p></div>
    <details class="more"><summary>Recent entries</summary><div class="list">${m.tx.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (a.createdAt < b.createdAt ? 1 : -1))).slice(0, 25).map((x) => `<div class="li"><div class="grow small"><b class="num">${x.type === 'income' ? '+' : x.type === 'transfer' ? '⇄ ' : ''}${money(x.amount)}</b> ${esc(dMD(x.date))} · ${esc(x.type === 'transfer' ? ((acct(x.from) || {}).name || '?') + ' → ' + ((acct(x.to) || {}).name || '?') : x.category)}</div><button class="btn ghost sm" data-act="txEdit" data-id="${x.id}">${t('btn.edit')}</button></div>`).join('') || '<div class="empty">No entries.</div>'}</div></details>`;
}
A.bufSave = () => { const c = parseCents(val('bufAmt')); if (Number.isNaN(c)) { toast('Enter an amount like 500.00'); return; } S.money.buffer.amount = c; save(); render(); toast(c == null ? 'Goal cleared.' : 'Buffer goal set.'); };
A.acctAdd = () => { const n = val('acName'); if (!n) { toast('Name the account.'); return; } S.money.accounts.push({ id: uid('ac'), name: n, kind: $('#acKind').value, createdAt: nowISO() }); save(); PLAN_OPEN = 'money'; render(); };
A.acctDel = (el) => confirmBox('Remove this account? Past entries stay in your history.', 'Remove', () => { const a = acct(el.dataset.id); a.archived = true; save(); PLAN_OPEN = 'money'; render(); }, true);
A.balForm = () => {
  if (!S.money.accounts.filter((a) => !a.archived).length) { toast('Add an account first.'); return; }
  openSheet(() => `${sheetHead('Confirm a balance', 'What the account shows right now')}
    <label class="f">Account${acctOptions('blAcct', (spendAccounts()[0] || {}).id)}</label>
    <div class="grid2"><label class="f">Balance<input class="inp num" id="blAmt" inputmode="decimal" placeholder="0.00" autofocus></label><label class="f">As of<input class="inp" id="blDate" type="date" value="${today()}"></label></div>
    <p class="tiny muted">This replaces earlier estimates for this account. Transfers dated on or before this date are treated as already included.</p>
    <button class="btn primary" data-act="balSave">${t('btn.save')}</button>`);
};
A.balSave = () => {
  const c = parseCents(val('blAmt')); if (c == null || Number.isNaN(c)) { toast('Enter the balance, e.g. 1250.00'); return; }
  S.money.balances.push({ id: uid('bal'), accountId: $('#blAcct').value, amount: c, date: val('blDate') || today(), createdAt: nowISO() });
  save(); closeSheet(); PLAN_OPEN = 'money'; render(); toast('Balance confirmed.');
};
A.incForm = () => openSheet(() => `${sheetHead('Expected income')}
  <label class="f">Name<input class="inp" id="inName" maxlength="60" placeholder="Paycheck" autofocus></label>
  <div class="grid2"><label class="f">Amount <span class="hint">Optional</span><input class="inp num" id="inAmt" inputmode="decimal" placeholder="Unknown"></label><label class="f">Expected date<input class="inp" id="inDate" type="date"></label></div>
  <button class="btn primary" data-act="incSave">${t('btn.save')}</button>`);
A.incSave = () => {
  const d = val('inDate'); const c = parseCents(val('inAmt'));
  if (!isDate(d)) { toast('Add the expected date.'); return; } if (Number.isNaN(c)) { toast('Enter an amount like 1200.00, or leave it blank.'); return; }
  S.money.incomes.push({ id: uid('inc'), name: val('inName') || 'Income', amount: c, date: d, received: false, createdAt: nowISO() });
  save(); closeSheet(); PLAN_OPEN = 'money'; render();
};
A.incReceived = (el) => { const i = S.money.incomes.find((x) => x.id === el.dataset.id); i.received = true; i.receivedOn = today(); save(); PLAN_OPEN = 'money'; render(); toast('Marked received. Record the deposit as income if you want it in your entries.'); };
A.incDel = (el) => { S.money.incomes = S.money.incomes.filter((x) => x.id !== el.dataset.id); save(); PLAN_OPEN = 'money'; render(); };
A.billForm = (el) => {
  const b = el && el.dataset.id ? S.money.bills.find((x) => x.id === el.dataset.id) : null;
  SH.bill = b ? b.id : null;
  openSheet(() => `${sheetHead(b ? 'Edit' : 'Add a bill or essential')}
    ${seg('blKind', [['bill', 'Bill'], ['minimum', 'Minimum payment'], ['essential', 'Essential']], b ? b.kind : 'bill')}
    <label class="f">Name<input class="inp" id="bName" maxlength="60" value="${esc(b ? b.name : '')}" placeholder="Rent, phone, card minimum, groceries…"></label>
    <div class="grid2"><label class="f">Amount <span class="hint">Leave blank if unknown</span><input class="inp num" id="bAmt" inputmode="decimal" value="${esc(b ? centsToInput(b.kind === 'minimum' ? b.minimum : b.amount) : '')}" placeholder="Unknown"></label>
    <label class="f">Due date <span class="hint">Blank for essentials per period</span><input class="inp" id="bDue" type="date" value="${esc(b ? b.due || '' : '')}"></label></div>
    <label class="row" style="min-height:44px;gap:10px"><input type="checkbox" id="bRep" ${!b || b.repeat === 'monthly' ? 'checked' : ''} style="width:22px;height:22px"> Repeats monthly</label>
    <div class="btn-row"><button class="btn primary" data-act="billSave">${t('btn.save')}</button>${b ? `<button class="btn ghost danger" data-act="billDel" data-id="${b.id}">${t('btn.delete')}</button>` : ''}</div>`);
};
A.billSave = () => {
  const kind = getPick('blKind'); const c = parseCents(val('bAmt'));
  if (!val('bName')) { toast('Name it.'); return; } if (Number.isNaN(c)) { toast('Enter an amount like 85.00, or leave it blank.'); return; }
  const rec = { name: val('bName'), kind, amount: kind === 'minimum' ? null : c, minimum: kind === 'minimum' ? c : null, due: val('bDue') || null, repeat: $('#bRep').checked ? 'monthly' : 'once' };
  if (SH.bill) Object.assign(S.money.bills.find((x) => x.id === SH.bill), rec, { updatedAt: nowISO() });
  else S.money.bills.push(Object.assign({ id: uid('bill'), createdAt: nowISO() }, rec));
  save(); closeSheet(); PLAN_OPEN = 'money'; render();
};
A.billDel = (el) => confirmBox('Delete this item? Paid records stay in history.', t('btn.delete'), () => { S.money.bills.find((x) => x.id === el.dataset.id).archived = true; save(); PLAN_OPEN = 'money'; render(); }, true);
A.billList = () => openSheet(() => `${sheetHead('Bills and essentials')}<div class="list">${S.money.bills.filter((b) => !b.archived).map((b) => `<div class="li"><div class="grow"><b>${esc(b.name)}</b> <span class="small muted">${esc(b.kind)}${b.due ? ' · ' + (b.repeat === 'monthly' ? 'monthly on day ' + Number(b.due.slice(8)) : esc(dMD(b.due))) : ''} · ${money(b.kind === 'minimum' ? b.minimum : b.amount)}</span></div><button class="btn ghost sm" data-act="billForm" data-id="${b.id}">${t('btn.edit')}</button></div>`).join('')}</div>`);
A.billPaid = (el) => { S.money.billPaid.push({ id: uid('paid'), billId: el.dataset.id, due: el.dataset.due, paidOn: today(), createdAt: nowISO() }); save(); PLAN_OPEN = 'money'; render(); toast('Marked paid.'); };
A.contribSave = () => {
  const td = today(); const est = paydayEstimate(td); const c = parseCents(val('contribAmt'));
  if (c == null || Number.isNaN(c)) { toast('Enter an amount, or 0.'); return; }
  const k = planKey(est); const prev = S.money.plans[k] || {};
  if (prev.doneTxId) { toast('This period’s transfer is already done.'); return; }
  S.money.plans[k] = Object.assign(prev, { contribution: c, setOn: td, end: est.end });
  save(); PLAN_OPEN = 'money'; render();
  if (est.complete && c > est.total) toast('This would leave known obligations uncovered. You can lower it anytime.');
  else toast('Planned. It counts as savings only once the transfer is done.');
};
A.contribDone = () => {
  const td = today(); const est = paydayEstimate(td); const k = planKey(est); const plan = S.money.plans[k];
  const from = spendAccounts()[0], to = savingsAccounts()[0];
  if (!from || !to) { toast('Add a checking and a savings account to record the transfer.'); return; }
  const id = uid('tx');
  S.money.tx.push({ id, date: td, type: 'transfer', amount: plan.contribution, from: from.id, to: to.id, note: 'Planned savings contribution', createdAt: nowISO(), updatedAt: nowISO() });
  plan.doneTxId = id; save(); PLAN_OPEN = 'money'; render(); toast('Transfer recorded. Savings updated.');
};
A.fixSave = () => {
  const a = getPick('fixAct'); if (!a) { toast('Choose one action.'); return; }
  createOneOff('money', a, 'Done and noted', 10, dAdd(today(), 1)); PLAN_OPEN = 'money'; render(); toast('Added to tomorrow.');
};
A.moneyTask = (el) => { createOneOff('money', el.dataset.title, el.dataset.finish, 10, today()); render(); toast('Added to today.'); };
function createOneOff(area, title, finish, minutes, date) {
  const task = { id: uid('task'), area, createdAt: nowISO(), versions: [] };
  pushVersion(task, { title, finish, minutes, minTitle: 'Do the first two minutes of it', minMinutes: 2, date, days: null, cue: '' }, date < today() ? date : today());
  S.tasks.push(task); save(); return task;
}

/* Art */
function artTask() { return S.tasks.find((x) => x.area === 'art' && !x.endedOn); }
function renderArtPlan() {
  const a = artTask(); const v = a ? taskPlan(a, today()) : null;
  return `<p class="small muted">Private, unfinished and unrelated to income is all allowed. Logging takes one tap.</p>
    <label class="f">Medium<input class="inp" id="arMed" maxlength="60" value="${esc(v ? v.medium || 'drawing' : 'drawing')}" placeholder="drawing, painting, crafts…"></label>
    <div class="stack-s"><div class="h3">Days</div>${dayPicker('arDays', v ? v.days : [0, 1, 2, 3, 4, 5, 6])}</div>
    <div class="grid2"><label class="f">Minutes<input class="inp num" id="arMins" type="number" min="1" max="240" value="${esc(v ? v.minutes : 5)}"></label><label class="f">Smallest version (min)<input class="inp num" id="arMin" type="number" min="1" max="60" value="${esc(v ? v.minMinutes : 1)}"></label></div>
    <button class="btn sm" data-act="artSave">Save from today</button>`;
}
A.artSave = () => {
  const med = val('arMed') || 'drawing'; const mins = numOrNull(val('arMins')) || 5; const mm = numOrNull(val('arMin')) || 1;
  let a = artTask(); if (!a) { a = { id: uid('task'), area: 'art', createdAt: nowISO(), versions: [] }; S.tasks.push(a); }
  pushVersion(a, { title: `${mins} minutes of ${med}`, finish: 'Any marks made. Unfinished is fine.', minutes: mins, minTitle: `${mm} minute${mm === 1 ? '' : 's'} of ${med}`, minMinutes: mm, medium: med, days: getPicks('arDays').map(Number), date: null, cue: '' }, today());
  save(); render(); toast('Art schedule saved from today.');
};

/* Other tasks (any area) */
function renderTaskList() {
  const td = today();
  const list = S.tasks.filter((x) => x.area !== 'art' && !x.endedOn).filter((x) => { const v = x.versions.slice(-1)[0]; return !v.date || v.date >= dAdd(td, -7); });
  return `<p class="small muted">Each task needs a verb, a finish line and a time estimate.</p>
    <div class="list">${list.map((x) => { const v = x.versions.slice(-1)[0]; return `<div class="li"><div class="grow"><b>${esc(v.title)}</b><div class="tiny muted">${t('area.' + x.area)} · ${minsLabel(v.minutes)} · ${v.date ? esc(dMD(v.date)) : (v.days || []).length === 7 ? 'Daily' : (v.days || []).map((d) => DOW_SHORT[d]).join(' ')}</div></div><button class="btn ghost sm" data-act="taskEdit" data-id="${x.id}">${t('btn.edit')}</button></div>`; }).join('') || '<div class="empty">No other tasks.</div>'}</div>
    <button class="btn sm" data-act="taskEdit">Add a task</button>`;
}
A.taskEdit = (el) => openTaskForm(el.dataset.id || null);
function openTaskForm(id) {
  const task = id ? S.tasks.find((x) => x.id === id) : null;
  const v = task ? task.versions.slice(-1)[0] : { title: '', finish: '', minutes: 10, minTitle: '', minMinutes: 2, days: [1, 2, 3, 4, 5], date: null, cue: '' };
  SH.task = { id }; SH.onPick = (g, val2) => { if (g === 'tkRec') { show('tkDaysBox', val2 === 'weekly'); show('tkDateBox', val2 === 'once'); } };
  openSheet(() => `${sheetHead(task ? 'Edit task' : 'New task', t('tagline'))}
    <label class="f">Area<select class="inp" id="tkArea">${['money', 'business', 'art'].map((a) => `<option value="${a}" ${task && task.area === a ? 'selected' : ''}>${t('area.' + a)}</option>`).join('')}</select></label>
    ${S.goals.some((g) => ['active', 'maintaining', 'later'].includes(g.status) || (task && task.goalId === g.id)) ? `<label class="f">Part of a goal <span class="hint">Optional. Ending the goal stops this task.</span><select class="inp" id="tkGoal"><option value="">None</option>${S.goals.filter((g) => g.status !== 'complete' && g.status !== 'ended' || (task && task.goalId === g.id)).map((g) => `<option value="${g.id}" ${task && task.goalId === g.id ? 'selected' : ''}>${esc(g.title)}</option>`).join('')}</select></label>` : ''}
    <label class="f">Task <span class="hint">Start with a verb</span><input class="inp" id="tkTitle" maxlength="120" value="${esc(v.title)}" autofocus></label>
    <label class="f">Done when<input class="inp" id="tkFinish" maxlength="160" value="${esc(v.finish)}"></label>
    <div class="grid2"><label class="f">Minutes<input class="inp num" id="tkMins" type="number" min="1" max="600" value="${esc(v.minutes)}"></label><label class="f">Cue <span class="hint">Optional</span><input class="inp" id="tkCue" maxlength="80" value="${esc(v.cue || '')}" placeholder="After lunch"></label></div>
    <div class="grid2"><label class="f">Smaller version<input class="inp" id="tkMinT" maxlength="120" value="${esc(v.minTitle || '')}" placeholder="First two minutes"></label><label class="f">Its minutes<input class="inp num" id="tkMinM" type="number" min="1" max="120" value="${esc(v.minMinutes || 2)}"></label></div>
    ${seg('tkRec', [['weekly', 'Repeats weekly'], ['once', 'One date']], v.date ? 'once' : 'weekly')}
    <div id="tkDaysBox" ${v.date ? 'hidden' : ''}>${dayPicker('tkDays', v.days || [])}</div>
    <label class="f" id="tkDateBox" ${v.date ? '' : 'hidden'}>Date<input class="inp" id="tkDate" type="date" value="${esc(v.date || today())}"></label>
    ${task ? `<label class="f">Changes apply from<input class="inp" id="tkFrom" type="date" value="${today()}"><span class="hint">Earlier days keep what was planned.</span></label>` : ''}
    <div class="btn-row"><button class="btn primary" data-act="taskSave">${t('btn.save')}</button>${task ? `<button class="btn ghost danger" data-act="taskDel" data-id="${task.id}">Stop this task</button>` : ''}</div>`);
}
A.taskSave = () => {
  const title = val('tkTitle'), finish = val('tkFinish');
  if (!title || !finish) { toast('Add the task and what “done” looks like.'); return; }
  const once = getPick('tkRec') === 'once';
  const data = { title, finish, minutes: numOrNull(val('tkMins')) || 10, cue: val('tkCue'), minTitle: val('tkMinT') || 'First two minutes', minMinutes: numOrNull(val('tkMinM')) || 2, days: once ? null : getPicks('tkDays').map(Number), date: once ? (val('tkDate') || today()) : null };
  if (!once && !data.days.length) { toast('Pick at least one day.'); return; }
  let task = SH.task.id ? S.tasks.find((x) => x.id === SH.task.id) : null;
  const area = $('#tkArea').value;
  if (!task) { task = { id: uid('task'), area, createdAt: nowISO(), versions: [] }; S.tasks.push(task); pushVersion(task, data, data.date && data.date < today() ? data.date : today()); }
  else { task.area = area; pushVersion(task, data, val('tkFrom') || today()); }
  if ($('#tkGoal')) task.goalId = $('#tkGoal').value || null;
  save(); closeSheet(); PLAN_OPEN = 'tasks'; render(); toast('Task saved.');
};
A.taskDel = (el) => {
  const id = el.dataset.id; const has = Object.values(S.occ).some((o) => o.refId === id);
  confirmBox(has ? 'Stop scheduling this task from today? Its history stays.' : 'Delete this task?', has ? 'Stop task' : t('btn.delete'), () => {
    if (has) S.tasks.find((x) => x.id === id).endedOn = S.occ['t:' + id + '@' + today()] ? dAdd(today(), 1) : today(); else S.tasks = S.tasks.filter((x) => x.id !== id);
    save(); PLAN_OPEN = 'tasks'; render();
  }, true);
};
