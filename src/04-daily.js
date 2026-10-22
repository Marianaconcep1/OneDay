/* ---------- Spending log ---------- */
const EXP_CATS = ['Groceries', 'Dining out', 'Transport', 'Housing & utilities', 'Bills & debt', 'Health', 'Household', 'Personal care', 'Fun & hobbies', 'Gifts', 'Other'];
const INC_CATS = ['Paycheck', 'Business income', 'Refund', 'Other income'];
A.openSpend = (el) => openSpend(el.dataset.date || today());
function openSpend(ds, editId) {
  const ex = editId ? S.money.tx.find((x) => x.id === editId) : null;
  SH.spend = { ds: ex ? ex.date : ds, txId: ex ? ex.id : uid('tx'), type: ex ? ex.type : 'expense', draft: ex ? { amount: centsToInput(ex.amount), note: ex.note, category: ex.category, account: ex.account, from: ex.from, to: ex.to, date: ex.date } : {} };
  SH.onPick = (g, v) => {
    if (g === 'ttype') { captureSpend(); SH.spend.type = v; refreshSheet(); }
  };
  openSheet(spendSheet);
}
function captureSpend() {
  const d = SH.spend.draft;
  d.amount = val('txAmt'); d.note = val('txNote'); d.date = val('txDate') || SH.spend.ds;
  d.category = getPick('tcat'); d.account = val('txAcct'); d.from = val('txFrom'); d.to = val('txTo');
}
function acctOptions(id, sel, filter, blankLabel) {
  const list = S.money.accounts.filter((a) => !a.archived && (!filter || filter(a)));
  return `<select class="inp" id="${id}">${blankLabel ? `<option value="">${blankLabel}</option>` : ''}${list.map((a) => `<option value="${a.id}" ${sel === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>`;
}
function spendSheet() {
  const { ds, type, draft } = SH.spend;
  const editing = S.money.tx.some((x) => x.id === SH.spend.txId);
  const list = txOn(ds);
  const status = spendStatus(ds);
  const hasExp = list.some((x) => x.type === 'expense');
  const cats = type === 'income' ? INC_CATS : EXP_CATS;
  let form = `${seg('ttype', [['expense', 'Expense'], ['income', 'Income'], ['transfer', 'Transfer']], type)}
    <div class="grid2"><label class="f">Amount<input class="inp num" id="txAmt" inputmode="decimal" placeholder="0.00" value="${esc(draft.amount || '')}" autofocus></label>
    <label class="f">Date<input class="inp" id="txDate" type="date" value="${esc(draft.date || ds)}"></label></div>`;
  if (type === 'transfer') {
    if (S.money.accounts.filter((a) => !a.archived).length < 2) form += `<div class="card tint stack-s"><p class="small">A transfer moves money between two of your own accounts. It is never counted as spending or income. Add two accounts first.</p><button class="btn sm" data-act="quickAccounts">Add “Checking” and “Savings”</button></div>`;
    else form += `<div class="grid2"><label class="f">From${acctOptions('txFrom', draft.from || (spendAccounts()[0] || {}).id)}</label><label class="f">To${acctOptions('txTo', draft.to || (savingsAccounts()[0] || {}).id)}</label></div><p class="tiny muted">Transfers between your own accounts don’t count as spending or income.</p>`;
  } else {
    form += `<div class="stack-s"><div class="h3">Category</div>${chips('tcat', cats.map((c) => [c, c]), draft.category || null)}</div>`;
    if (S.money.accounts.length) form += `<label class="f">Account <span class="hint">Optional</span>${acctOptions('txAcct', draft.account, null, 'Not specified')}</label>`;
  }
  form += `<label class="f">Note <span class="hint">Optional</span><input class="inp" id="txNote" maxlength="140" value="${esc(draft.note || '')}"></label>
    <div class="btn-row"><button class="btn primary" data-act="txSave">${editing ? 'Save changes' : 'Add entry'}</button>${editing ? `<button class="btn ghost danger" data-act="txDelete" data-id="${SH.spend.txId}">${t('btn.delete')}</button>` : ''}</div>`;
  const rows = list.map((x) => `<div class="li"><div class="grow"><b class="num">${x.type === 'income' ? '+' : x.type === 'transfer' ? '⇄ ' : ''}${money(x.amount)}</b> <span class="muted small">${esc(x.type === 'transfer' ? (acct(x.from) || {}).name + ' → ' + (acct(x.to) || {}).name : x.category || 'Uncategorized')}${x.note ? ' · ' + esc(x.note) : ''}</span></div><button class="btn ghost sm" data-act="txEdit" data-id="${x.id}">${t('btn.edit')}</button></div>`).join('');
  return `${sheetHead('Money · ' + esc(dShort(ds)), 'Record it in about two minutes.')}
    ${form}
    <div class="card flat"><div class="row-between"><div class="h3">Entries for ${esc(dMD(ds))}</div><span class="pill ${status === 'complete' || status === 'none' ? 'done' : status === 'incomplete' ? 'modified' : ''}">${esc(spendStatusText(ds))}</span></div><div class="list">${rows || '<div class="empty">No entries yet.</div>'}</div></div>
    <div class="stack-s"><div class="h3">Is this day’s record complete?</div>
      <div class="btn-row"><button class="btn ${status === 'complete' ? 'primary' : ''}" data-act="spendMark" data-s="complete">That’s everything</button>${hasExp ? '' : `<button class="btn ${status === 'none' ? 'primary' : ''}" data-act="spendMark" data-s="none">${t('spend.none')}</button>`}<button class="btn ${status === 'incomplete' ? 'primary' : ''}" data-act="spendMark" data-s="incomplete">Mark incomplete</button></div>
      <p class="tiny muted">“No spending today” and “not recorded” are kept separate. A day without a record is never treated as $0.</p></div>`;
}
function spendStatusText(ds) {
  const s = spendStatus(ds);
  if (s === 'none') return 'No spending (confirmed)';
  if (s === 'complete') return 'Complete';
  if (s === 'incomplete') return 'Incomplete';
  return txOn(ds).length ? 'Not confirmed complete' : 'Not recorded';
}
A.txEdit = (el) => openSpend(null, el.dataset.id);
A.txSave = () => {
  captureSpend();
  const d = SH.spend.draft; const type = SH.spend.type;
  const amount = parseCents(d.amount);
  if (amount == null || Number.isNaN(amount) || amount <= 0) { $('#txAmt').classList.add('invalid'); toast('Enter an amount like 12.50'); return; }
  if (!isDate(d.date)) { toast('Choose a date.'); return; }
  const rec = { id: SH.spend.txId, date: d.date, type, amount, note: d.note || '', updatedAt: nowISO() };
  if (type === 'transfer') {
    if (!d.from || !d.to || d.from === d.to) { toast('Choose two different accounts.'); return; }
    rec.from = d.from; rec.to = d.to;
  } else { rec.category = d.category || 'Other'; if (d.account) rec.account = d.account; }
  const i = S.money.tx.findIndex((x) => x.id === rec.id);
  if (i >= 0) S.money.tx[i] = Object.assign({ createdAt: S.money.tx[i].createdAt }, rec);
  else S.money.tx.push(Object.assign({ createdAt: nowISO() }, rec));
  if (type === 'expense' && spendStatus(d.date) === 'none') setSpendDay(d.date, null);
  save();
  SH.spend = { ds: SH.spend.ds, txId: uid('tx'), type, draft: { date: SH.spend.ds } };
  refreshSheet(); render(); toast(i >= 0 ? 'Entry updated.' : 'Entry added.');
};
A.txDelete = (el) => {
  const id = el.dataset.id; const ds = SH.spend.ds;
  confirmBox('Delete this entry? This can’t be undone.', t('btn.delete'), () => { S.money.tx = S.money.tx.filter((x) => x.id !== id); save(); render(); openSpend(ds); toast('Entry deleted.'); }, true);
};
A.spendMark = (el) => { const ds = SH.spend.ds; const s = el.dataset.s; setSpendDay(ds, spendStatus(ds) === s ? null : s); refreshSheet(); render(); };
A.quickAccounts = () => {
  captureSpend();
  if (!S.money.accounts.some((a) => a.kind === 'checking')) S.money.accounts.push({ id: uid('ac'), name: 'Checking', kind: 'checking', createdAt: nowISO() });
  if (!S.money.accounts.some((a) => a.kind === 'savings')) S.money.accounts.push({ id: uid('ac'), name: 'Savings', kind: 'savings', createdAt: nowISO() });
  save(); refreshSheet();
};

/* ---------- Evening check-in ---------- */
const EMOTIONS = ['Calm', 'Content', 'Hopeful', 'Proud', 'Tired', 'Anxious', 'Overwhelmed', 'Frustrated', 'Sad', 'Lonely', 'Restless', 'Numb', 'Other'];
const RESPONSES = ['Make tomorrow’s task smaller', 'Prepare what I need tonight', 'Ask someone for practical support', 'Take a break', 'Return to the plan tomorrow'];
function checkinDefaultDate() {
  const td = today(); const y = dAdd(td, -1);
  if (nowHM() < '04:00' && !S.checkins[y] && !S.checkins[td]) return y;
  return td;
}
A.openCheckin = () => openCheckin(checkinDefaultDate());
function openCheckin(ds) {
  const ex = S.checkins[ds]; const dr = S.drafts[ds];
  const base = Object.assign({}, ex || {}, (!ex && dr) || {});
  SH.ci = { ds, step: 1, base, done: false };
  SH.onPick = ciPick;
  openSheet(checkinSheet, { full: true, noFocus: true });
  const sh = $('.sheet'); sh.addEventListener('input', ciDraft); sh.addEventListener('change', ciDraft);
}
function ciDraft() { if (!SH.ci || SH.ci.done) return; S.drafts[SH.ci.ds] = Object.assign(collectCi(), { draftAt: nowISO() }); save(); }
function ciPick(g, v, el) {
  const ds = SH.ci.ds;
  if (g.startsWith('cs|')) {
    const key = g.slice(3);
    if (key === 'train') {
      const map = { done: 'completed', modified: 'modified', skipped: 'skipped', rest: 'rest' };
      if (v) setTrainLog(ds, { status: map[v], actualType: v === 'rest' ? 'rest' : undefined });
    } else {
      const it = findItem(key, ds);
      if (it) { if (v) upsertOcc(it, ds, { status: v }); }
    }
    show('cr|' + key, v === 'modified' || v === 'skipped');
  } else if (g.startsWith('cr|')) {
    const key = g.slice(3);
    if (key === 'train') setTrainLog(ds, { reason: v });
    else { const it = findItem(key, ds); if (it && it.occ) upsertOcc(it, ds, { reason: v }); }
  } else if (g === 'cspend') {
    setSpendDay(ds, v);
  } else if (g === 'cidate') {
    closeSheet(true); openCheckin(v); return;
  } else if (g === 'cbiz') {
    show('ciNewAction', v === '__new');
  }
  ciDraft();
}
function ciRowOptions(it) {
  if (it.kind === 'train') {
    if (it.session && it.session.type === 'rest') return [['rest', 'Rest followed'], ['modified', 'Did something else']];
    return [['done', 'As planned'], ['modified', 'Modified'], ['skipped', 'Skipped']];
  }
  return [['done', 'As planned'], ['modified', 'Smaller'], ['skipped', 'Skipped']];
}
function ciRowValue(it) {
  if (it.kind === 'train') return it.log ? ({ completed: 'done', modified: 'modified', skipped: 'skipped', rest: 'rest' }[it.log.status] || null) : null;
  return isClosed(it.status) ? it.status : null;
}
function checkinSheet() {
  const c = SH.ci; const ds = c.ds; const b = c.base;
  if (c.done) return checkinSummary(ds);
  const items = itemsFor(ds).filter((i) => i.kind !== 'spend' && !i.unplanned && !(i.kind === 'biz' && i.needsAction));
  const td = today(); const y = dAdd(td, -1);
  const tm = dAdd(ds, 1);
  const list = txOn(ds); const expTotal = list.filter((x) => x.type === 'expense').reduce((s, x) => s + x.amount, 0);
  const hasExp = list.some((x) => x.type === 'expense');
  const tmItems = itemsFor(tm);
  const tmBiz = tmItems.find((i) => i.kind === 'biz');
  const tmTrain = sessionFor(tm);
  const acts = openActions().slice(0, 6);
  const curNext = S.business.nextFor[tm] || (tmBiz && tmBiz.actionId) || (acts[0] && acts[0].id) || '__new';
  const scale = (g, v, lo, hi) => `<div data-toggleable><div class="scale">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="chip" data-act="pick" data-group="${g}" data-val="${n}" aria-pressed="${v === n ? 'true' : 'false'}">${n}</button>`).join('')}</div><div class="scale-labels"><span>1 · ${lo}</span><span>5 · ${hi}</span></div></div>`;
  const step = (n, title, body) => `<section class="stack" data-step="${n}" ${c.step === n ? '' : 'hidden'}><div class="h2">${title}</div>${body}</section>`;
  return `${sheetHead(t('checkin'), esc(dLong(ds)) + (S.checkins[ds] ? ' · editing saved check-in' : ''))}
    <div class="steps" aria-hidden="true">${[1, 2, 3, 4, 5].map((n) => `<span class="${n <= c.step ? 'on' : ''}" data-bar="${n}"></span>`).join('')}</div>
    ${nowHM() < '04:00' && ds !== td ? `<div class="stack-s"><span class="small muted">Checking in for</span>${seg('cidate', [[y, 'Yesterday · ' + dMD(y)], [td, 'Today · ' + dMD(td)]], ds)}</div>` : ''}
    ${step(1, 'What happened today', items.length ? `<p class="small muted">Already-logged items are filled in. Change anything that’s off.</p><div class="stack">${items.map((it) => `<div class="card flat stack-s"><div class="row-between"><b class="grow">${esc(it.plannedTitle || it.title)}</b><span class="tiny muted">${t('area.' + it.area)}</span></div>${it.smaller ? `<div class="tiny muted">Planned smaller today: ${esc(it.title)}</div>` : ''}${seg('cs|' + it.key, ciRowOptions(it), ciRowValue(it))}<div id="cr|${esc(it.key)}" class="stack-s" ${['modified', 'skipped'].includes(ciRowValue(it)) ? '' : 'hidden'}><span class="tiny muted">Reason (optional)</span>${chips('cr|' + it.key, REASONS, (it.occ && it.occ.reason) || (it.log && it.log.reason) || null)}</div></div>`).join('')}</div>` : '<p class="muted">Nothing besides the spending log was scheduled. An unscheduled day is not a missed one.</p>')}
    ${step(2, 'Spending', `<p>${list.length ? `${plural(list.length, 'entry', 'entries')} recorded${hasExp ? ': ' + money(expTotal) + ' in expenses' : ''}.` : 'Nothing recorded yet for this day.'}</p>
      <div class="card flat stack-s"><div class="h3">Add an expense</div><div class="grid2"><input class="inp num" id="ciAmt" inputmode="decimal" placeholder="0.00" aria-label="Amount"><select class="inp" id="ciCat" aria-label="Category">${EXP_CATS.map((x) => `<option>${x}</option>`).join('')}</select></div><button class="btn sm" data-act="ciAddExp">Add</button><div id="ciExpList" class="tiny muted"></div></div>
      ${seg('cspend', [['complete', 'That’s everything'], ...(hasExp ? [] : [['none', 'No spending']]), ['incomplete', 'Incomplete']], spendStatus(ds) || null)}
      <p class="tiny muted">If you’re not sure, mark it incomplete. Missing days are shown as missing, not $0.</p>`)}
    ${step(3, 'Mood and energy', `<p class="small muted">Both optional. A low number is as useful as a high one.</p><div class="stack-s"><div class="h3">Mood</div>${scale('cmood', b.mood, 'very low', 'very good')}</div><div class="stack-s"><div class="h3">Energy</div>${scale('cenergy', b.energy, 'depleted', 'energized')}</div>`)}
    ${step(4, 'A brief reflection', `<div class="stack-s"><div class="h3">What am I feeling?</div>${chips('cemo', EMOTIONS.map((e) => [e, e]), b.emotions || [], true, 'pinkc')}</div>
      <label class="f">What contributed? <span class="hint">Optional, one sentence</span><input class="inp" id="ciContrib" maxlength="200" value="${esc(b.contributed || '')}"></label>
      <div class="stack-s"><div class="h3">What would be a kind and useful response?</div><div data-toggleable>${chips('cresp', RESPONSES.map((r) => [r, r]), b.responseChoice || null)}</div><input class="inp" id="ciResp" maxlength="200" placeholder="Or write your own" value="${esc(b.response || '')}" aria-label="Your own response"></div>
      <label class="f">One thing I give myself credit for today <span class="hint">Optional</span><input class="inp" id="ciCredit" maxlength="200" value="${esc(b.credit || '')}"></label>
      <button class="btn accent block" data-act="ciStep" data-to="5">${t('enough')}</button>`)}
    ${step(5, 'Tomorrow · ' + esc(dShort(tm)), `<div class="stack-s"><div class="h3">Next business action</div>${tmBiz || acts.length ? '' : ''}
      ${!bizBlockDay(tm) && !S.business.nextFor[tm] ? '<p class="small muted">Business isn’t scheduled tomorrow. Choosing an action here schedules it.</p>' : ''}
      <div class="stack-s">${chips('cbiz', [...acts.map((a) => [a.id, a.title]), ['__new', 'Write a new action'], ...(bizBlockDay(tm) ? [] : [['__none', 'Leave tomorrow unscheduled']])], bizBlockDay(tm) || S.business.nextFor[tm] ? curNext : '__none')}</div>
      <div id="ciNewAction" class="card flat stack-s" ${curNext === '__new' && (bizBlockDay(tm) || S.business.nextFor[tm]) ? '' : 'hidden'}><label class="f">Action (start with a verb)<input class="inp" id="ciActTitle" maxlength="120" placeholder="Draft one outreach message"></label><label class="f">Done when<input class="inp" id="ciActFinish" maxlength="160" placeholder="A message ready to send"></label><label class="f">Minutes<input class="inp num" id="ciActMins" type="number" min="1" max="240" value="15"></label></div></div>
      <div class="stack-s"><div class="h3">Scheduled training</div><p>${esc(sessionLabel(tmTrain))}${tmTrain && tmTrain.detail ? ' · ' + esc(tmTrain.detail) : ''}</p>
      <label class="f">Change tomorrow’s session <span class="hint">Only if your plan calls for it</span><select class="inp" id="ciTrain"><option value="">Keep as planned</option>${Object.entries(SESSION_TYPES).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label></div>`)}
    <div class="btn-row" style="position:sticky;bottom:0;background:var(--bg);padding-block:10px">
      <button class="btn" data-act="ciStep" data-dir="-1" id="ciBack" ${c.step === 1 ? 'hidden' : ''}>${t('btn.back')}</button>
      <button class="btn primary" data-act="ciStep" data-dir="1" id="ciNext" ${c.step === 5 ? 'hidden' : ''}>${t('btn.next')}</button>
      <button class="btn primary" data-act="ciSave" id="ciSave" ${c.step === 5 ? '' : 'hidden'}>Save check-in</button>
      ${c.step < 5 ? '' : ''}
    </div>
    <p class="tiny muted">Drafts save automatically. Optional fields can stay empty.</p>`;
}
A.ciStep = (el) => {
  const c = SH.ci;
  c.step = el.dataset.to ? Number(el.dataset.to) : Math.min(5, Math.max(1, c.step + Number(el.dataset.dir)));
  $$('[data-step]').forEach((s) => { s.hidden = Number(s.dataset.step) !== c.step; });
  $$('[data-bar]').forEach((s) => s.classList.toggle('on', Number(s.dataset.bar) <= c.step));
  show('ciBack', c.step > 1); show('ciNext', c.step < 5); show('ciSave', c.step === 5);
  $('.sheet').scrollTop = 0;
  ciDraft();
};
A.ciAddExp = () => {
  const amt = parseCents(val('ciAmt'));
  if (amt == null || Number.isNaN(amt) || amt <= 0) { toast('Enter an amount like 12.50'); return; }
  const ds = SH.ci.ds;
  S.money.tx.push({ id: uid('tx'), date: ds, type: 'expense', amount: amt, category: $('#ciCat').value, note: '', createdAt: nowISO(), updatedAt: nowISO() });
  if (spendStatus(ds) === 'none') setSpendDay(ds, null);
  save();
  $('#ciAmt').value = '';
  const l = txOn(ds).filter((x) => x.type === 'expense');
  $('#ciExpList').textContent = 'Added. ' + plural(l.length, 'expense') + ' today: ' + money(l.reduce((s, x) => s + x.amount, 0)) + '.';
  const noneBtn = $('[data-group="cspend"][data-val="none"]'); if (noneBtn) noneBtn.remove();
};
function collectCi() {
  const mood = getPick('cmood'), energy = getPick('cenergy');
  const rc = getPick('cresp');
  return {
    mood: mood ? Number(mood) : null, energy: energy ? Number(energy) : null,
    emotions: getPicks('cemo'), contributed: val('ciContrib'), responseChoice: rc || null, response: val('ciResp'), credit: val('ciCredit'), step: SH.ci ? SH.ci.step : 1
  };
}
A.ciSave = () => {
  const c = SH.ci; const ds = c.ds; const tm = dAdd(ds, 1);
  const data = collectCi(); delete data.step;
  // Tomorrow's business action
  const pick = getPick('cbiz');
  if (pick === '__new') {
    const title = val('ciActTitle'), finish = val('ciActFinish');
    if (title) {
      if (!finish) { toast('Add what “done” looks like for the new action.'); return; }
      const a = newAction({ title, finish, minutes: numOrNull(val('ciActMins')) || 15 });
      S.business.nextFor[tm] = a.id;
    }
  } else if (pick === '__none') delete S.business.nextFor[tm];
  else if (pick) S.business.nextFor[tm] = pick;
  // Tomorrow's training (explicit, date-specific change only)
  const tv = $('#ciTrain') && $('#ciTrain').value;
  if (tv) S.training.overrides[tm] = Object.assign({}, sessionFor(tm) || {}, { type: tv, changedIn: 'check-in', minutes: tv === 'rest' ? 0 : ((sessionFor(tm) || {}).minutes || null) });
  const prev = S.checkins[ds];
  S.checkins[ds] = Object.assign({ id: 'ci@' + ds, date: ds, submittedAt: prev ? prev.submittedAt : nowISO() }, data, { updatedAt: nowISO(), editCount: prev ? (prev.editCount || 0) + 1 : 0 });
  delete S.drafts[ds];
  save();
  c.done = true; refreshSheet(); $('.sheet').scrollTop = 0; render();
};
function factualSummary(ds) {
  const items = itemsFor(ds).filter((i) => !i.unplanned && !(i.kind === 'biz' && i.needsAction));
  let done = 0, mod = 0, skip = 0, none = 0; let train = '';
  for (const it of items) {
    if (it.kind === 'spend') continue;
    if (it.kind === 'train') {
      const s = it.log && it.log.status;
      train = s === 'rest' ? 'your recovery day followed' : s === 'completed' ? 'your planned session completed' : s === 'modified' ? 'your training session modified' : s === 'skipped' ? (it.log.reason === 'physical' ? 'training rested for symptoms' : 'training skipped') : it.session && it.session.type === 'rest' ? 'your rest day not yet recorded' : 'training not recorded';
      continue;
    }
    if (it.status === 'done') done++; else if (it.status === 'modified') mod++; else if (it.status === 'skipped') skip++; else none++;
  }
  const parts = [];
  parts.push(plural(done, 'action') + ' completed as planned');
  if (mod) parts.push(mod + ' modified');
  if (skip) parts.push(skip + ' skipped');
  if (none) parts.push(none + ' without a record');
  if (train) parts.push(train);
  const last = parts.pop();
  return (parts.length ? parts.join(', ') + (parts.length > 1 ? ', and ' : ' and ') + last : last) + '.';
}
function nextSessionNote(ds) {
  const items = itemsFor(ds);
  const m = items.find((i) => i.occ && i.occ.status === 'modified' && i.occ.minutes && i.occ.planned && i.occ.planned.minutes && i.occ.minutes < i.occ.planned.minutes);
  if (m) return `You planned ${m.occ.planned.minutes} minutes and completed ${m.occ.minutes}. What would make the next session easier to finish?`;
  const s = items.find((i) => i.status === 'skipped' && i.occ && i.occ.reason === 'large');
  if (s) return `“${s.plannedTitle}” felt too large. A smaller finish line is ready to set in Plan.`;
  return '';
}
function checkinSummary(ds) {
  const tm = dAdd(ds, 1);
  const tmItems = itemsFor(tm).filter((i) => i.kind !== 'spend');
  const note = nextSessionNote(ds);
  return `${sheetHead('Check-in saved', esc(dLong(ds)))}
    <div class="card tint"><p style="font-size:18px">${esc(factualSummary(ds))}</p><p class="small muted mt-s">Spending: ${esc(spendStatusText(ds).toLowerCase())}.</p></div>
    ${note ? `<p>${esc(note)}</p>` : ''}
    <div class="stack-s"><div class="eyebrow">Tomorrow</div>${tmItems.length ? tmItems.map((i) => `<div class="row"><span class="area-name" style="min-width:76px">${t('area.' + i.area)}</span><b class="grow">${esc(i.title)}</b></div>`).join('') : '<p class="muted">Only the spending log is scheduled.</p>'}</div>
    <button class="btn primary block" data-act="closeSheet">${t('btn.done')}</button>`;
}

/* ---------- Business actions ---------- */
function newAction(d) {
  const a = { id: uid('act'), title: d.title, finish: d.finish, minutes: d.minutes || 15, category: d.category || null, connection: d.connection || S.business.weekly[weekStart(today())] || '', minTitle: d.minTitle || 'Five minutes on the same task', date: d.date || null, order: (Math.max(0, ...S.business.actions.map((x) => x.order || 0)) + 1), createdAt: nowISO(), doneOn: null };
  S.business.actions.push(a); save(); return a;
}
A.newAction = (el) => openActionForm(null, el.dataset.date || null);
function openActionForm(id, forDate) {
  const a = id ? S.business.actions.find((x) => x.id === id) : null;
  const wk = S.business.weekly[weekStart(today())] || '';
  SH.act = { id, forDate };
  SH.onPick = (g, v, el) => { if (g === 'acOut' && v) { $('#acFinish').value = v; } if (g === 'actex') { const ex = BIZ_EXAMPLES[Number(v)]; $('#acTitle').value = ex[0]; $('#acFinish').value = ex[1]; $('#acMins').value = ex[2]; $$('[data-group="accat"]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.val === ex[3] ? 'true' : 'false')); } };
  openSheet(() => `${sheetHead(a ? 'Edit business action' : 'Next business action', t('tagline'))}
    ${a ? '' : `<details class="more"><summary>Pick a starting example</summary><div class="stack-s mt-s">${chips('actex', BIZ_EXAMPLES.map((e, i) => [String(i), e[0]]), null)}</div></details>`}
    <label class="f">Action <span class="hint">Start with a clear verb: draft, list, send, build</span><input class="inp" id="acTitle" maxlength="120" value="${esc(a ? a.title : '')}" autofocus></label>
    <div class="stack-s"><label class="f" for="acFinish">What will exist afterward <span class="hint">Something you could point to when it’s done</span></label><div data-toggleable>${chips('acOut', OUTPUTS.map((o) => [o, o]), null)}</div><input class="inp" id="acFinish" maxlength="160" value="${esc(a ? a.finish : '')}"></div>
    <div class="grid2"><label class="f">Minutes<input class="inp num" id="acMins" type="number" min="1" max="240" value="${esc(a ? a.minutes : 15)}"></label>
    <label class="f">Specific date <span class="hint">Optional</span><input class="inp" id="acDate" type="date" value="${esc(a ? a.date || '' : forDate || '')}"></label></div>
    <div class="stack-s"><div class="h3">Category <span class="hint">Optional. Helps you see where time goes.</span></div><div data-toggleable>${chips('accat', BIZ_CATS.map((c) => [c, c]), a ? a.category : null)}</div></div>
    <label class="f">Connects to this week’s outcome<input class="inp" id="acConn" maxlength="160" value="${esc(a ? a.connection : wk)}" placeholder="${wk ? '' : 'Set a weekly outcome in Plan'}"></label>
    <label class="f">Smaller version<input class="inp" id="acMin" maxlength="120" value="${esc(a ? a.minTitle : 'Five minutes on the same task')}"></label>
    <p class="tiny muted" id="acWarn"></p>
    <div class="btn-row"><button class="btn primary" data-act="actSave">${t('btn.save')}</button>${a ? `<button class="btn ghost danger" data-act="actDelete" data-id="${a.id}">${t('btn.delete')}</button>` : ''}</div>`);
}
A.actSave = () => {
  const title = val('acTitle'), finish = val('acFinish');
  if (!title || !finish) { toast('Add the action and what will exist afterward.'); return; }
  if (VAGUE.test(title) && title.split(/\s+/).length < 5) { $('#acWarn').textContent = '“' + title + '” is hard to finish. Try something like “Draft the three bullets explaining your dashboard service”.'; if (!SH.act.warned) { SH.act.warned = true; return; } }
  const d = { title, finish, minutes: numOrNull(val('acMins')) || 15, date: val('acDate') || null, category: getPick('accat'), connection: val('acConn'), minTitle: val('acMin') || 'Five minutes on the same task' };
  if (SH.act.id) Object.assign(S.business.actions.find((x) => x.id === SH.act.id), d, { updatedAt: nowISO() });
  else newAction(d);
  save(); closeSheet(); render(); toast('Action saved.');
};
A.actDelete = (el) => {
  const id = el.dataset.id;
  const used = Object.values(S.occ).some((o) => o.actionId === id);
  confirmBox(used ? 'This action has history. It will be archived so past records stay intact.' : 'Delete this action?', used ? 'Archive' : t('btn.delete'), () => {
    if (used) S.business.actions.find((x) => x.id === id).archived = true; else S.business.actions = S.business.actions.filter((x) => x.id !== id);
    for (const k in S.business.nextFor) if (S.business.nextFor[k] === id) delete S.business.nextFor[k];
    save(); render(); toast('Done.');
  }, true);
};
