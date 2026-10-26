/* ---------- Schedules (versioned so edits only affect the future) ---------- */
function verAt(versions, ds) {
  let v = null;
  for (const x of versions || []) if (x.from <= ds && (!v || x.from >= v.from)) v = x;
  return v;
}
/* Add or replace a version effective from `from`; earlier versions stay untouched. */
function pushVersion(obj, data, from) {
  obj.versions = (obj.versions || []).filter((v) => v.from !== from);
  obj.versions.push(Object.assign({}, data, { from }));
  obj.versions.sort((a, b) => (a.from < b.from ? -1 : 1));
}
function exceptionsFor(refId, ds) { return S.exceptions.filter((e) => e.refId === refId && e.date === ds); }

function taskScheduled(task, ds) {
  if (task.endedOn && ds >= task.endedOn) return false;
  if (task.goalId) { const g = S.goals.find((x) => x.id === task.goalId); if (g && goalEndedOn(g, ds)) return false; }
  const ex = exceptionsFor(task.id, ds);
  if (ex.some((e) => e.kind === 'off')) return false;
  if (ex.some((e) => e.kind === 'on')) return true;
  const v = verAt(task.versions, ds);
  if (!v) return false;
  if (v.date) return v.date === ds;
  return (v.days || []).includes(dDow(ds));
}
function taskPlan(task, ds) { return verAt(task.versions, ds) || task.versions[0]; }

function bizBlockAt(ds) { return verAt(S.business.block.versions, ds); }
function bizBlockDay(ds) {
  const ex = exceptionsFor('bizblock', ds);
  if (ex.some((e) => e.kind === 'off')) return false;
  if (ex.some((e) => e.kind === 'on')) return true;
  const b = bizBlockAt(ds);
  return !!(b && (b.days || []).includes(dDow(ds)));
}
const openActions = () => S.business.actions.filter((a) => !a.doneOn && !a.archived).sort((a, b) => a.order - b.order);
function bizActionFor(ds) {
  const o = S.occ['biz@' + ds];
  if (o && o.actionId) return S.business.actions.find((a) => a.id === o.actionId) || null;
  const chosen = S.business.nextFor[ds];
  if (chosen) { const a = S.business.actions.find((x) => x.id === chosen && (!x.doneOn || x.doneOn === ds)); if (a) return a; }
  const dated = S.business.actions.find((a) => a.date === ds && (!a.doneOn || a.doneOn === ds) && !a.archived);
  if (dated) return dated;
  return openActions().find((a) => !a.date || a.date <= ds) || null;
}
function bizScheduled(ds) {
  if (S.occ['biz@' + ds]) return true;
  if (exceptionsFor('bizblock', ds).some((e) => e.kind === 'off')) return false;
  return bizBlockDay(ds) || !!S.business.nextFor[ds] || S.business.actions.some((a) => a.date === ds && !a.archived);
}

const SESSION_TYPES = {
  easy: 'Easy run', long: 'Long run', run: 'Other planned run', strength: 'Strength', cross: 'Cross-training', mobility: 'Mobility', rest: 'Rest'
};
const isRun = (type) => type === 'easy' || type === 'long' || type === 'run';
function trainTemplateAt(ds) {
  let v = null;
  for (const x of S.training.templates) if (x.from <= ds && (!v || x.from >= v.from)) v = x;
  return v;
}
/* The planned session for a date: a date-specific override, else the weekly template in effect. */
function sessionFor(ds) {
  if (Object.prototype.hasOwnProperty.call(S.training.overrides, ds)) return S.training.overrides[ds];
  const log = S.training.logs['tr@' + ds];
  if (log && log.planned !== undefined) return log.planned;
  const tpl = trainTemplateAt(ds);
  if (!tpl) return null;
  return tpl.days[dDow(ds)] || null;
}
function sessionLabel(s) {
  if (!s) return t('st.unscheduled');
  let l = SESSION_TYPES[s.type] || s.type;
  const bits = [];
  if (s.distance) bits.push(s.distance + ' ' + (S.training.profile.unit || 'mi'));
  if (s.minutes) bits.push(s.minutes + ' min');
  if (bits.length) l += ' · ' + bits.join(' · ');
  return l;
}

/* ---------- Today's items ---------- */
function spendStatus(ds) { const d = S.money.spendDays[ds]; return d ? d.status : null; }
function txOn(ds) { return S.money.tx.filter((x) => x.date === ds); }

function itemsFor(ds) {
  const items = [];
  const smaller = (S.dayPlans[ds] && S.dayPlans[ds].smaller) || {};
  // Money: the daily spending record, then any scheduled money tasks
  const ss = spendStatus(ds);
  const entries = txOn(ds).length;
  // The daily spending record starts on the setup day; earlier days were never scheduled
  const started = !S.settings.calibrationStart || ds >= S.settings.calibrationStart || ss || entries;
  // People who set up with the ten questions only get the spending record if they chose it
  if (started && (S.settings.trackSpend !== false || ss || entries)) items.push({
    key: 'spend', area: 'money', focus: S.settings.onbVersion === 2 ? 'money' : undefined, kind: 'spend', title: t('spend.title'), finish: 'Every purchase entered, or “No spending today”.',
    minutes: 2, status: ss === 'complete' || ss === 'none' ? 'done' : ss === 'incomplete' ? 'modified' : entries ? 'started' : 'scheduled'
  });
  for (const task of S.tasks) {
    const key = 't:' + task.id + '@' + ds;
    const o = S.occ[key];
    if (!taskScheduled(task, ds)) {
      if (o && o.extra) items.push({ key, area: task.area, focus: task.focus, kind: 'task', taskId: task.id, unplanned: true, title: o.planned.title, plannedTitle: o.planned.title, minutes: o.minutes || 0, status: o.status, occ: o });
      continue;
    }
    const p = (o && o.planned) || taskPlan(task, ds);
    const small = !!smaller[key];
    items.push({
      key, area: task.area, focus: task.focus, kind: 'task', taskId: task.id, title: small && p.minTitle ? p.minTitle : p.title, finish: p.finish, plannedTitle: p.title,
      minutes: small ? (p.minMinutes || 1) : p.minutes, fullMinutes: p.minutes, minTitle: p.minTitle, minMinutes: p.minMinutes, cue: p.cue,
      status: o ? o.status : 'scheduled', occ: o, smaller: small
    });
  }
  // Business: one next action on block days
  if (bizScheduled(ds)) {
    const key = 'biz@' + ds;
    const o = S.occ[key];
    const a = bizActionFor(ds);
    const block = bizBlockAt(ds);
    const p = (o && o.planned) || (a ? { title: a.title, finish: a.finish, minutes: a.minutes || (block && block.minutes) || 15, minTitle: a.minTitle || 'Five minutes on the same task', minMinutes: 5, category: a.category, connection: a.connection } : null);
    const small = !!smaller[key];
    items.push({
      key, area: 'business', kind: 'biz', actionId: a ? a.id : null, needsAction: !p,
      title: p ? (small ? p.minTitle : p.title) : 'Choose the next business action', plannedTitle: p && p.title, finish: p && p.finish,
      minutes: p ? (small ? 5 : p.minutes) : ((block && block.minutes) || 15), fullMinutes: p ? p.minutes : null, minTitle: p && p.minTitle, minMinutes: 5,
      category: p && p.category, connection: p && p.connection, status: o ? o.status : 'scheduled', occ: o, smaller: small
    });
  }
  // Training: the planned session (rest included); never auto-changed
  const sess = sessionFor(ds);
  const log = S.training.logs['tr@' + ds];
  if (sess) {
    items.push({
      key: 'train', area: 'training', kind: 'train', session: sess, title: sessionLabel(sess), finish: sess.detail || '',
      minutes: sess.type === 'rest' ? 0 : (sess.minutes || null), status: log ? trainStatusToItem(log.status) : 'scheduled', log
    });
  } else if (log) {
    items.push({ key: 'train', area: 'training', kind: 'train', session: null, unplanned: true, title: 'Unplanned activity', minutes: log.minutes || 0, status: 'done', log });
  }
  for (const it of items) it.date = ds;
  return pauseFilter(items, ds);
}
function trainStatusToItem(s) { return { completed: 'done', modified: 'modified', rest: 'rest', skipped: 'skipped', started: 'started' }[s] || 'scheduled'; }
const isClosed = (st) => st === 'done' || st === 'modified' || st === 'skipped' || st === 'rest';
function itemStatusLabel(it) {
  if (it.kind === 'spend') {
    const s = spendStatus(it.date || today());
    if (s === 'none') return 'No spending (confirmed)';
    if (s === 'complete') return 'Recorded';
    if (s === 'incomplete') return 'Log incomplete';
    if (it.status === 'started') return 'Entries recorded, not confirmed complete';
    return t('st.norecord');
  }
  if (it.kind === 'train' && it.status === 'modified') return t('st.trainmod');
  if (it.kind === 'train' && it.status === 'skipped' && it.log && it.log.reason === 'physical') return 'Rested for symptoms';
  return t('st.' + it.status);
}
function pillClass(st) { return { done: 'done', modified: 'modified', skipped: 'skipped', started: 'started', rest: 'rest' }[st] || ''; }

function dayMinutes(ds) {
  const items = itemsFor(ds);
  let total = 2; // evening check-in
  let unknown = false;
  for (const it of items) { if (it.minutes == null) unknown = true; else total += it.minutes; }
  for (const l of lifeOn(ds)) total += l.minutes || 0;
  const avail = S.settings.availability[dDow(ds)];
  return { total, unknown, avail: avail == null ? null : avail, over: avail != null && total > avail, items };
}

/* ---------- Occurrence writes (idempotent: one record per task per date) ---------- */
function upsertOcc(it, ds, patch) {
  const key = it.key;
  const prev = S.occ[key];
  const planned = (prev && prev.planned) || (it.kind === 'biz'
    ? { title: it.plannedTitle, finish: it.finish, minutes: it.fullMinutes, minTitle: it.minTitle, minMinutes: 5, category: it.category, connection: it.connection }
    : { title: it.plannedTitle, finish: it.finish, minutes: it.fullMinutes, minTitle: it.minTitle, minMinutes: it.minMinutes, cue: it.cue });
  const o = Object.assign({ id: key, kind: it.kind, refId: it.taskId || null, actionId: it.actionId || null, date: ds, planned, createdAt: nowISO() }, prev || {}, patch, { updatedAt: nowISO() });
  if (it.kind === 'biz' && it.actionId && !o.actionId) o.actionId = it.actionId;
  S.occ[key] = o;
  if (it.kind === 'biz' && o.actionId) {
    const a = S.business.actions.find((x) => x.id === o.actionId);
    if (a) {
      if (o.status === 'done') a.doneOn = ds;
      else if (a.doneOn === ds) a.doneOn = null;
    }
  }
  save();
  return o;
}
function clearOcc(key) {
  const o = S.occ[key];
  if (o && o.kind === 'biz' && o.actionId) { const a = S.business.actions.find((x) => x.id === o.actionId); if (a && a.doneOn === o.date) a.doneOn = null; }
  delete S.occ[key];
  save();
}
function setTrainLog(ds, patch) {
  const key = 'tr@' + ds;
  const prev = S.training.logs[key];
  const planned = prev ? prev.planned : (sessionFor(ds) || null);
  S.training.logs[key] = Object.assign({ id: key, date: ds, planned, createdAt: nowISO() }, prev || {}, patch, { updatedAt: nowISO() });
  save();
}
function setSpendDay(ds, status) {
  if (status == null) delete S.money.spendDays[ds];
  else S.money.spendDays[ds] = { status, updatedAt: nowISO() };
  save();
}

/* ---------- Money calculations ---------- */
const acct = (id) => S.money.accounts.find((a) => a.id === id);
const savingsAccounts = () => S.money.accounts.filter((a) => a.kind === 'savings' && !a.archived);
const spendAccounts = () => S.money.accounts.filter((a) => (a.kind === 'checking' || a.kind === 'cash') && !a.archived);
function latestBalance(accountId, onOrBefore) {
  let b = null;
  for (const x of S.money.balances) if (x.accountId === accountId && (!onOrBefore || x.date <= onOrBefore) && (!b || x.date > b.date || (x.date === b.date && x.createdAt > b.createdAt))) b = x;
  return b;
}
/* Confirmed balance of an account as of a date. A balance entry is a snapshot that already
   includes every transfer dated on or before it; only later transfers are added, so nothing counts twice. */
function accountPosition(accountId, asOf) {
  const b = latestBalance(accountId, asOf);
  let delta = 0, count = 0;
  for (const x of S.money.tx) {
    if (x.date > asOf) continue;
    if (b && x.date <= b.date) continue;
    let d = 0;
    if (x.type === 'transfer') { if (x.to === accountId) d += x.amount; if (x.from === accountId) d -= x.amount; }
    else if (x.account === accountId) d += x.type === 'income' ? x.amount : -x.amount;
    if (d) { delta += d; count++; }
  }
  return { balance: b, after: delta, afterCount: count, value: b ? b.amount + delta : null, transfersOnly: b ? null : delta };
}
function confirmedSavings(asOf) {
  const accts = savingsAccounts();
  if (!accts.length) return { value: null, parts: [], missing: ['No savings account added yet.'] };
  let value = 0; const parts = []; const missing = [];
  for (const a of accts) {
    const p = accountPosition(a.id, asOf);
    parts.push({ account: a, pos: p });
    if (p.value == null) missing.push('No confirmed balance for ' + a.name + '.');
    else value += p.value;
  }
  return { value: missing.length === accts.length ? null : value, parts, missing };
}
function nextIncome(fromDs) {
  return S.money.incomes.filter((i) => !i.received && i.date >= fromDs).sort((a, b) => (a.date < b.date ? -1 : 1))[0] || null;
}
/* Bill instances due in [from, to). Monthly bills repeat on their due day. */
function billDueDates(bill, from, to) {
  const out = [];
  if (!bill.due) return out;
  if (bill.repeat !== 'monthly') { if (bill.due >= from && bill.due < to) out.push(bill.due); return out; }
  const day = Number(bill.due.slice(8, 10));
  let [y, m] = from.split('-').map(Number);
  for (let i = 0; i < 14; i++) {
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const ds = `${y}-${String(m).padStart(2, '0')}-${String(Math.min(day, last)).padStart(2, '0')}`;
    if (ds >= to) break;
    if (ds >= from && ds >= bill.due) out.push(ds);
    m++; if (m > 12) { m = 1; y++; }
  }
  return out;
}
const billPaidOn = (billId, due) => S.money.billPaid.find((p) => p.billId === billId && p.due === due);
function obligationsBetween(from, to) {
  const list = [];
  for (const b of S.money.bills) {
    if (b.archived) continue;
    for (const due of billDueDates(b, from, to)) list.push({ bill: b, due, paid: billPaidOn(b.id, due) });
  }
  return list.sort((a, b) => (a.due < b.due ? -1 : 1));
}
/* Remaining-money estimate for the period until the next expected income. Every input is listed. */
function paydayEstimate(ds) {
  const ni = nextIncome(ds);
  const end = ni ? ni.date : null;
  const missing = [];
  const lines = [];
  let total = 0, ok = true;
  const sp = spendAccounts();
  if (!sp.length) { missing.push('Add the account you spend from and confirm its balance.'); ok = false; }
  for (const a of sp) {
    const p = accountPosition(a.id, ds);
    if (p.value == null) { missing.push('Confirm the current balance of ' + a.name + '.'); ok = false; }
    else { lines.push({ label: a.name + ' (confirmed ' + dMD(p.balance.date) + (p.afterCount ? ', plus ' + plural(p.afterCount, 'later entry', 'later entries') : '') + ')', amount: p.value }); total += p.value; }
  }
  if (!end) { missing.push('Enter your next expected income date.'); ok = false; }
  const obligations = end ? obligationsBetween(ds, end).filter((o) => !o.paid) : [];
  for (const o of obligations) {
    const amt = o.bill.kind === 'minimum' ? (o.bill.minimum != null ? o.bill.minimum : o.bill.amount) : o.bill.amount;
    if (amt == null) { missing.push('Amount for ' + o.bill.name + ' (due ' + dMD(o.due) + ') is unknown.'); ok = false; continue; }
    lines.push({ label: o.bill.name + ' due ' + dMD(o.due), amount: -amt }); total -= amt;
  }
  const essentials = S.money.bills.filter((b) => b.kind === 'essential' && !b.archived && !b.due);
  for (const e of essentials) {
    if (e.amount == null) { missing.push('Estimate for ' + e.name + ' is unknown.'); ok = false; continue; }
    lines.push({ label: e.name + ' (essential estimate)', amount: -e.amount }); total -= e.amount;
  }
  const plan = end ? S.money.plans[ds.slice(0, 7) + ':' + end] : null;
  return { from: ds, end, income: ni, lines, total, missing, complete: ok && missing.length === 0, obligations, plan };
}
const planKey = (est) => est.from.slice(0, 7) + ':' + est.end;

/* ---------- Week statistics (scheduled items only; unscheduled days never count) ---------- */
function weekStats(ws, datesOverride) {
  const dates = datesOverride || weekDates(ws);
  const td = today();
  const st = {
    dates, all: { scheduled: 0, done: 0, modified: 0, skipped: 0, started: 0, norecord: 0 },
    area: {}, spend: { complete: 0, none: 0, incomplete: 0, partial: 0, missing: 0, days: 0, totalCents: 0, txCount: 0 },
    train: { scheduled: 0, completed: 0, modified: 0, skipped: 0, rest: 0, restPlanned: 0, norecord: 0, distPlanned: 0, distActual: 0, distMissing: 0, unplanned: 0 },
    biz: { scheduled: 0, done: 0, modified: 0, skipped: 0, minutes: 0, outputs: 0, cats: {} },
    art: { scheduled: 0, participated: 0, extra: 0 },
    checkins: 0, days: 0, pausedDays: 0, mood: [], energy: [], reasons: {}
  };
  for (const a of AREAS) st.area[a] = { scheduled: 0, done: 0, modified: 0, skipped: 0, norecord: 0 };
  for (const ds of dates) {
    if (ds > td) { st.mood.push(undefined); st.energy.push(undefined); continue; }
    if (pausedAll(ds)) { st.pausedDays++; st.mood.push('P'); st.energy.push('P'); continue; }
    st.days++;
    const ci = S.checkins[ds];
    if (ci) st.checkins++;
    st.mood.push(ci ? ci.mood : null);
    st.energy.push(ci ? ci.energy : null);
    for (const it of itemsFor(ds)) {
      if (it.paused) continue; // recorded during a pause: kept, but not counted
      if (it.kind === 'train') {
        const s = it.session;
        if (it.unplanned) { st.train.unplanned++; if (it.log && it.log.distance) st.train.distActual += Number(it.log.distance) || 0; continue; }
        st.train.scheduled++;
        if (s.type === 'rest') st.train.restPlanned++;
        if (s.distance) st.train.distPlanned += Number(s.distance) || 0;
        const lg = it.log;
        if (!lg) st.train.norecord++;
        else {
          if (lg.status === 'completed') st.train.completed++;
          else if (lg.status === 'modified') st.train.modified++;
          else if (lg.status === 'skipped') st.train.skipped++;
          else if (lg.status === 'rest') st.train.rest++;
          else st.train.norecord++;
          if (lg.reason) st.reasons[lg.reason] = (st.reasons[lg.reason] || 0) + 1;
          if (isRun(lg.actualType || (s && s.type))) { if (lg.distance) st.train.distActual += Number(lg.distance) || 0; else if (lg.status === 'completed' || lg.status === 'modified') st.train.distMissing++; }
        }
      }
      if (it.kind === 'spend') {
        const s = spendStatus(ds);
        st.spend.days++;
        if (s === 'complete') st.spend.complete++; else if (s === 'none') st.spend.none++; else if (s === 'incomplete') st.spend.incomplete++;
        else if (txOn(ds).length) st.spend.partial++; else st.spend.missing++;
      }
      if (it.kind === 'biz' && !it.needsAction) {
        st.biz.scheduled++;
        const o = it.occ;
        if (o) {
          if (o.status === 'done') st.biz.done++; else if (o.status === 'modified') st.biz.modified++; else if (o.status === 'skipped') st.biz.skipped++;
          if (o.minutes) st.biz.minutes += Number(o.minutes) || 0;
          else if (o.status === 'done') st.biz.minutes += o.planned.minutes || 0;
          else if (o.status === 'modified') st.biz.minutes += 5;
          if (o.output) st.biz.outputs++;
          if (o.status === 'done' || o.status === 'modified') { const c = o.planned.category || 'Uncategorized'; st.biz.cats[c] = (st.biz.cats[c] || 0) + 1; }
        }
      } else if (it.kind === 'biz' && it.needsAction) { st.biz.scheduled++; }
      if (it.area === 'art' && it.kind === 'task') {
        if (it.unplanned) st.art.extra++;
        else { st.art.scheduled++; if (it.status === 'done' || it.status === 'modified') st.art.participated++; }
      }
      // Overall counts (rest-followed counts as following the plan)
      const a = st.area[it.area];
      if (it.unplanned) continue;
      st.all.scheduled++; a.scheduled++;
      const status = it.status === 'rest' ? 'done' : it.status;
      if (status === 'done') { st.all.done++; a.done++; }
      else if (status === 'modified') { st.all.modified++; a.modified++; }
      else if (status === 'skipped') { st.all.skipped++; a.skipped++; }
      else { st.all.norecord++; a.norecord++; }
      if (it.occ && it.occ.reason) st.reasons[it.occ.reason] = (st.reasons[it.occ.reason] || 0) + 1;
    }
    for (const x of txOn(ds)) { st.spend.txCount++; if (x.type === 'expense') st.spend.totalCents += x.amount; }
  }
  return st;
}
function today() { return todayStr(); }
