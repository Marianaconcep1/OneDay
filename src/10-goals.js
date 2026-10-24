/* ---------- Goals: several at once, each either measurable, milestone-based or ongoing ----------
   status: active | later | maintaining | complete. Nothing is created or completed automatically. */
const GOAL_SOURCES = [['savings', 'Confirmed savings ($)'], ['revenue', 'Business revenue ($)'], ['distance', 'Running distance'], ['manual', 'A number I update']];
const GOAL_STATUS = { active: 'Active', later: 'Later', maintaining: 'Maintaining', complete: 'Complete', ended: 'Ended' };
const isMoneySrc = (s) => s === 'savings' || s === 'revenue';

/* Current value of a measurable goal, from records only. null means not known yet. */
function goalCurrent(g, asOf) {
  const tg = g.target; if (!tg) return null;
  const end = asOf || today();
  if (tg.source === 'savings') { const v = confirmedSavings(end).value; return v == null ? null : v; }
  if (tg.source === 'revenue') return S.business.results.filter((r) => r.type === 'Revenue' && r.amount != null && r.date >= g.startedOn && r.date <= end).reduce((s, r) => s + r.amount, 0);
  if (tg.source === 'distance') return Object.values(S.training.logs).filter((l) => l.date >= g.startedOn && l.date <= end && l.distance).reduce((s, l) => s + (Number(l.distance) || 0), 0);
  const m = (g.manual || []).filter((x) => x.date <= end).sort((a, b) => (a.date < b.date ? -1 : 1));
  return m.length ? m[m.length - 1].value : null;
}
/* Start point: savings and manual goals start from their recorded value; revenue and distance count from zero */
function goalStart(g) { const tg = g.target; if (!tg) return null; if (tg.source === 'revenue' || tg.source === 'distance') return 0; return tg.start; }
function goalProgress(g, asOf) {
  const cur = goalCurrent(g, asOf); const st = goalStart(g); const tv = g.target && g.target.value;
  if (cur == null || st == null || tv == null || tv === st) return { cur, st, tv, pct: null };
  return { cur, st, tv, pct: Math.max(0, Math.min(100, Math.round((cur - st) / (tv - st) * 100))) };
}
function goalFmt(g, v) {
  if (v == null) return 'Not recorded';
  const src = g.target && g.target.source;
  if (isMoneySrc(src)) return money(v);
  if (src === 'distance') return (Math.round(v * 100) / 100) + ' ' + (S.training.profile.unit || 'mi');
  return (Math.round(v * 100) / 100) + (g.target.unit ? ' ' + g.target.unit : '');
}
function goalReached(g) { if (g.kind === 'target') { const p = goalProgress(g); return p.pct === 100; } if (g.kind === 'milestones') return g.milestones.length > 0 && g.milestones.every((m) => m.doneOn); return false; }
function goalById(id) { return S.goals.find((g) => g.id === id); }
function activeGoals() { return S.goals.filter((g) => g.status === 'active' || g.status === 'maintaining'); }

/* Which goal today's action moves forward: the week's focus goal first, then the first active goal in that area */
function goalFor(area) {
  const w = weekPlan(weekStart(today()));
  const fg = w && w.goalId && goalById(w.goalId);
  if (fg && fg.area === area && ['active', 'maintaining'].includes(fg.status)) return fg;
  return S.goals.find((g) => g.area === area && g.status === 'active') || S.goals.find((g) => g.area === area && g.status === 'maintaining') || null;
}
function towardLine(it, light) {
  const g = it && it.area && goalFor(it.area);
  return g ? `<div class="${light ? 'ft-meta' : 'tiny muted'}">Toward: ${esc(g.title)}</div>` : '';
}

function goalSummaryLine(g) {
  if (g.kind === 'target') { const p = goalProgress(g); return p.cur == null ? 'Current value not recorded yet' : `${goalFmt(g, p.cur)} of ${goalFmt(g, p.tv)}${p.pct != null ? ' · ' + p.pct + '%' : ''}`; }
  if (g.kind === 'milestones') { const d = g.milestones.filter((m) => m.doneOn).length; return `${d} of ${g.milestones.length} milestones`; }
  const d = g.milestones.filter((m) => m.doneOn).length;
  return d ? `Ongoing · ${plural(d, 'milestone')} reached` : 'Ongoing · no finish line';
}
function goalBar(g) {
  if (g.kind !== 'target') return '';
  const p = goalProgress(g); if (p.pct == null) return '';
  return `<div class="meter goal" role="img" aria-label="${p.pct}% of the way from start to target"><span style="width:${p.pct}%"></span></div>`;
}
function renderGoals() {
  const ws = weekStart(today()); const w = weekPlan(ws) || {};
  const groups = [['active', 'Active'], ['maintaining', 'Maintaining'], ['later', 'Later'], ['complete', 'Complete'], ['ended', 'Archived projects']];
  const avail = weekDates(ws).reduce((s, d) => s + (S.settings.availability[dDow(d)] || 0), 0);
  const planned = weekDates(ws).reduce((s, d) => s + dayMinutes(d).total, 0);
  let h = `<p class="small muted">One goal can be this week’s focus. The others keep small, maintained routines, and anything waiting goes to Later.</p>`;
  if (avail) h += `<p class="tiny muted">This week: ${minsLabel(planned)} planned of ${minsLabel(avail)} available.${planned > avail ? ' That’s more than you have. Consider moving a goal to Later.' : ''}</p>`;
  for (const [st, label] of groups) {
    const list = S.goals.filter((g) => g.status === st); if (!list.length) continue;
    h += `<div class="stack-s"><div class="h3">${label}</div>${list.map((g) => `<button class="goal-row" data-act="goalOpen" data-id="${g.id}">
      <span class="dot ${g.area}"></span><span class="grow"><b>${esc(g.title)}</b>${w.goalId === g.id ? ' <span class="pill started">This week’s focus</span>' : ''}<br><span class="small muted">${esc(goalSummaryLine(g))}</span>${goalBar(g)}</span><span aria-hidden="true">›</span></button>`).join('')}</div>`;
  }
  if (!S.goals.length) h += `<p class="small">No goals yet. A goal can be a number (savings, revenue, distance), a few milestones, or something you keep doing.</p>`;
  h += `<button class="btn sm" data-act="goalForm">Add a goal</button>`;
  return h;
}

A.goalForm = (el) => {
  const g = el && el.dataset.id ? goalById(el.dataset.id) : null;
  SH.goal = g ? clone(g) : { area: S.settings.focus || 'money', kind: 'target', target: { source: 'savings' }, milestones: [], status: 'active' };
  SH.onPick = (grp, v) => { if (grp === 'gfKind') { show('gfTarget', v === 'target'); show('gfMs', v !== 'target'); ['gfTargetWrap', 'gfTargetHint', 'gfCritWrap'].forEach((id) => show(id, v !== 'ongoing')); } if (grp === 'gfSrc') { show('gfStartWrap', v === 'manual'); show('gfUnitWrap', v === 'manual'); } };
  const x = SH.goal; const tg = x.target || {};
  const tv = tg.value == null ? '' : isMoneySrc(tg.source) ? centsToInput(tg.value) : tg.value;
  openSheet(() => `${sheetHead(g ? 'Edit goal' : 'Add a goal')}
    <label class="f">Goal<input class="inp" id="gfTitle" maxlength="90" value="${esc(x.title || '')}" placeholder="e.g. Build a $1,000 savings buffer"></label>
    <div class="stack-s"><div class="h3">Area</div>${chips('gfArea', AREAS.map((a) => [a, t('area.' + a)]), x.area)}</div>
    <label class="f">Where you’re starting from <span class="hint">Optional. Kept for the completion report.</span><input class="inp" id="gfFrom" maxlength="200" value="${esc(x.from || '')}" placeholder="e.g. No savings buffer yet"></label>
    <div class="stack-s"><div class="h3">How you’ll know</div>${seg('gfKind', [['target', 'A number'], ['milestones', 'Milestones'], ['ongoing', 'Ongoing']], x.kind)}</div>
    ${goalDateFields(x)}
    <div id="gfTarget" class="stack-s" ${x.kind === 'target' ? '' : 'hidden'}>
      ${chips('gfSrc', GOAL_SOURCES, tg.source || 'savings')}
      <div class="grid2"><label class="f">Target<input class="inp num" id="gfVal" inputmode="decimal" value="${esc(tv)}"></label>
      <label class="f" id="gfStartWrap" ${tg.source === 'manual' ? '' : 'hidden'}>Starting value<input class="inp num" id="gfStart" inputmode="decimal" value="${esc(tg.source === 'manual' && tg.start != null ? tg.start : '')}"></label></div>
      <label class="f" id="gfUnitWrap" ${tg.source === 'manual' ? '' : 'hidden'}>Unit<input class="inp" id="gfUnit" maxlength="20" value="${esc(tg.unit || '')}" placeholder="e.g. pages, clients"></label>
      <p class="tiny muted">Savings use your confirmed balances. Revenue and distance count what you log from the start date.</p></div>
    <div id="gfMs" class="stack-s" ${x.kind === 'target' ? 'hidden' : ''}><label class="f">Milestones, one per line<textarea class="inp" id="gfMsText" placeholder="e.g. First paid client">${esc(x.milestones.map((m) => m.title).join('\n'))}</textarea></label>
      <p class="tiny muted">Ongoing goals have no finish line. Milestones along the way are still celebrated.</p></div>
    <div class="stack-s"><div class="h3">Status</div>${seg('gfStatus', [['active', 'Active'], ['maintaining', 'Maintaining'], ['later', 'Later']], x.status === 'complete' ? 'active' : x.status)}</div>
    <label class="row" style="min-height:44px;gap:10px"><input type="checkbox" id="gfFocus" style="width:22px;height:22px" ${(weekPlan(weekStart(today())) || {}).goalId === x.id && x.id ? 'checked' : ''}> Make this week’s focus</label>
    <div id="gfMsg"></div>
    <div class="btn-row"><button class="btn primary" data-act="goalSave">${t('btn.save')}</button>${g ? `<button class="btn ghost danger" data-act="goalDel" data-id="${g.id}">${t('btn.delete')}</button>` : ''}</div>`);
};
A.goalSave = () => {
  const x = SH.goal; const td = today();
  const title = val('gfTitle'); if (!title) { $('#gfTitle').classList.add('invalid'); toast('Name the goal.'); return; }
  x.title = title; x.area = getPick('gfArea') || x.area; x.kind = getPick('gfKind') || 'target'; x.from = val('gfFrom');
  x.status = getPick('gfStatus') || x.status;
  const dErr = goalDatesCheck(x.kind); if (dErr) { toast(dErr); return; }
  if (x.kind === 'target') {
    const src = getPick('gfSrc') || 'savings'; const raw = val('gfVal');
    const v = isMoneySrc(src) ? parseCents(raw) : (raw === '' ? null : Number(raw));
    if (v == null || Number.isNaN(v) || v <= 0) { $('#gfVal').classList.add('invalid'); toast('Enter a target above zero, or choose Milestones.'); return; }
    const prev = x.target || {};
    let start = prev.source === src ? prev.start : null;
    if (src === 'savings' && start == null) start = confirmedSavings(td).value;
    if (src === 'manual') { const sv = val('gfStart'); start = sv === '' ? null : Number(sv); }
    x.target = { source: src, value: v, start, unit: src === 'manual' ? val('gfUnit') : '' };
    if (src === 'manual' && start != null && !(x.manual || []).length) x.manual = [{ date: td, value: start }];
  } else x.target = null;
  const lines = ($('#gfMsText') ? $('#gfMsText').value : '').split('\n').map((s) => s.trim()).filter(Boolean);
  if (x.kind !== 'target') x.milestones = lines.map((l) => x.milestones.find((m) => m.title === l) || { id: uid('ms'), title: l, doneOn: null });
  if (x.kind === 'milestones' && !x.milestones.length) { toast('Add at least one milestone, or choose Ongoing.'); return; }
  goalDatesApply(x, x.kind);
  if (!x.id) { x.id = uid('goal'); x.createdAt = nowISO(); x.startedOn = x.startedOn || td; x.manual = x.manual || []; S.goals.push(x); }
  else S.goals[S.goals.findIndex((g) => g.id === x.id)] = x;
  const ws = weekStart(td);
  if ($('#gfFocus').checked) { S.weeks[ws] = Object.assign({ main: x.area, maintain: AREAS.filter((a) => a !== x.area), mainOutcome: '' }, S.weeks[ws] || {}, { goalId: x.id, main: x.area }); }
  else if (S.weeks[ws] && S.weeks[ws].goalId === x.id) S.weeks[ws].goalId = null;
  if (x.target && x.target.source === 'savings' && x.target.start == null) toast('Saved. Confirm a savings balance in Plan › Money so progress can be measured.');
  else toast('Goal saved.');
  save(); closeSheet(); render();
};
A.goalDel = (el) => confirmBox('Delete this goal? Your logged records stay; only the goal and its milestones are removed.', 'Delete goal', () => {
  S.goals = S.goals.filter((g) => g.id !== el.dataset.id); save(); render();
}, true);

A.goalOpen = (el) => openGoal(el.dataset.id);
function openGoal(id) {
  SH.goalId = id;
  openSheet(() => {
    const g = goalById(id); if (!g) return sheetHead('Goal');
    const p = g.kind === 'target' ? goalProgress(g) : null;
    let h = `${sheetHead(esc(g.title), esc(t('area.' + g.area) + ' · ' + GOAL_STATUS[g.status] + ' · since ' + dMD(g.startedOn)))}` + goalDatesCard(g);
    if (p) h += `<div class="card tint stack-s"><div class="kv"><span>Start</span><span>${goalFmt(g, p.st)}</span><span>Now</span><span>${goalFmt(g, p.cur)}</span><span>Target</span><span>${goalFmt(g, p.tv)}</span></div>${goalBar(g)}
      ${p.pct == null ? '<p class="tiny muted">No percentage until both the start and current values are recorded.</p>' : ''}</div>`;
    if (g.target && g.target.source === 'manual' && g.status !== 'complete' && g.status !== 'ended') h += `<div class="grid2"><label class="f">Update the number<input class="inp num" id="gmVal" inputmode="decimal"></label><button class="btn sm" data-act="goalManual">Record</button></div>`;
    if (g.milestones.length || g.kind !== 'target') {
      h += `<div class="stack-s"><div class="h3">Milestones</div>${g.milestones.map((m) => `<label class="row" style="min-height:44px;gap:10px"><input type="checkbox" data-act="msToggle" data-id="${m.id}" ${m.doneOn ? 'checked' : ''} style="width:22px;height:22px"><span class="grow">${esc(m.title)}${m.doneOn ? ` <span class="tiny muted">· ${esc(dMD(m.doneOn))}</span>` : m.targetDate ? ` <span class="tiny muted" data-raw>· ${esc(mf('msBy', dMD(m.targetDate)))}</span>` : ''}${medalByKey('ms:' + m.id) ? ' <span aria-hidden="true">🏅</span>' : ''}</span></label>`).join('') || '<p class="small muted">None yet.</p>'}
        ${g.status === 'ended' ? '' : g.kind === 'ongoing' ? msAddDatedRow() : `<div class="grid2"><input class="inp" id="gmMs" maxlength="90" placeholder="Add a milestone"><button class="btn sm" data-act="msAdd">${t('btn.add')}</button></div>`}</div>`;
    }
    if (g.status !== 'complete' && goalReached(g)) h += `<div class="banner pink"><div class="h3">You’ve reached what this goal set out to do.</div><p class="small">Mark it complete when it feels finished. Nothing changes until you do.</p><button class="btn primary sm" data-act="goalComplete" data-raw>${esc(MDL().complete)}</button></div>`;
    if (g.status === 'ended') {
      const r = goalRecord(g);
      h += `<div class="card tint stack-s"><div class="eyebrow">Ended ${esc(dMD(g.endedOn))}</div><p class="small">${esc(endSummary(g, r))}</p></div>
        <div class="btn-row"><button class="btn primary" data-act="goalReopen">Reopen with a fresh schedule</button></div>
        <p class="tiny muted">Reopening starts from today. Days while it was ended stay unscheduled, so nothing is owed.</p>`;
      return h;
    }
    h += `<div class="btn-row">${g.status === 'complete' ? `<button class="btn primary" data-act="reportOpen" data-id="${g.id}">Completion report</button>` : `<button class="btn" data-act="goalForm" data-id="${g.id}">${t('btn.edit')}</button>`}
      ${g.status !== 'complete' && !goalReached(g) && g.kind !== 'ongoing' ? `<button class="btn ghost sm" data-act="goalComplete" data-raw>${esc(MDL().complete)}</button>` : ''}
      ${g.status === 'later' ? `<button class="btn ghost sm" data-act="goalStatus" data-s="active">Make active</button>` : g.status !== 'complete' ? `<button class="btn ghost sm" data-act="goalStatus" data-s="later">Move to Later</button>` : ''}</div>
      ${g.status !== 'complete' ? `<details class="more"><summary>More options</summary><div class="mt-s"><button class="btn ghost sm" data-act="endOpen">End this project</button><p class="tiny muted">Ending keeps all history. Deleting is separate, under Edit.</p></div></details>` : ''}`;
    return h;
  });
}
A.goalManual = () => { const g = goalById(SH.goalId); const v = Number(val('gmVal')); if (val('gmVal') === '' || !Number.isFinite(v)) { toast('Enter a number.'); return; } g.manual = (g.manual || []).filter((x) => x.date !== today()).concat({ date: today(), value: v }); save(); refreshSheet(); toast('Recorded.'); };
A.msAdd = () => { const g = goalById(SH.goalId); const t2 = val('gmMs'); if (!t2) return; g.milestones.push({ id: uid('ms'), title: t2, doneOn: null }); save(); refreshSheet(); };
A.msToggle = (el) => {
  setTimeout(() => {
    const g = goalById(SH.goalId); const m = g.milestones.find((x) => x.id === el.dataset.id); if (!m) return;
    if (g.kind === 'ongoing' && el.checked && !m.doneOn) { el.checked = false; SH.msId = m.id; A.msConfirm(); return; } // confirmed like a project, with its own medal
    m.doneOn = el.checked ? today() : null;
    if (m.doneOn) { growthAward('ms:' + m.id, 'milestone', today()); toast(g.kind === 'ongoing' ? 'Milestone reached. The goal keeps going.' : 'Milestone reached.'); }
    save(); refreshSheet();
  }, 0);
};
A.goalStatus = (el) => { const g = goalById(SH.goalId); g.status = el.dataset.s; save(); refreshSheet(); render(); };
/* ---------- Ending a project: separate from deleting; history and growth stay ---------- */
const END_REASONS = [['priorities', 'My priorities changed.'], ['fit', 'This goal no longer fits.'], ['cost', 'The time or resources required are too much.'], ['approach', 'I want to pursue a different approach.'], ['other', 'Other.'], ['nosay', 'Prefer not to say.']];
function goalEndedOn(g, ds) { return (g.endedRanges || []).some((r) => ds >= r.from && (!r.to || ds <= r.to)); }
function endSummary(g, r) {
  const bits = [`Worked on from ${dMD(r.from)} to ${dMD(g.endedOn)}.`];
  bits.push(`${r.done} completed and ${r.modified} smaller actions in ${t('area.' + g.area)}.`);
  const ms = g.milestones.filter((m) => m.doneOn).length; if (ms) bits.push(`${plural(ms, 'milestone')} reached.`);
  if (g.kind === 'target') { const p = goalProgress(g); if (p.cur != null && p.st != null) bits.push(`Measured: ${goalFmt(g, p.st)} → ${goalFmt(g, p.cur)}.`); }
  const lt = S.tasks.filter((x) => x.goalId === g.id).length; if (lt) bits.push(`${plural(lt, 'linked task')} no longer scheduled.`);
  return bits.join(' ');
}
A.endOpen = () => {
  const id = SH.goalId;
  openSheet(() => `${sheetHead('Ready to end this project?')}
    <p>Your priorities can change. You can pause, adjust the goal, or end this project while keeping your progress.</p>
    <div class="stack-s"><button class="btn primary" data-act="closeSheet">Keep working</button><button class="btn" data-act="goalForm" data-id="${id}">Adjust the goal</button>
    <button class="btn" data-act="endPause">Pause</button><button class="btn ghost" data-act="endStep" data-step="2">End project</button></div>`);
  SH.goalId = id;
};
A.endPause = () => { const g = goalById(SH.goalId); closeSheet(true); TAB = 'settings'; SET_OPEN.add('pause'); render(); A.pauseForm(); if (g && PAUSE_AREAS.includes(g.area)) { A.pick($('[data-group="psScope"][data-val="areas"]')); A.pick($(`[data-group="psArea"][data-val="${g.area}"]`)); } };
A.endStep = (el) => {
  const step = el.dataset.step; const id = SH.goalId;
  if (step === '2') openSheet(() => `${sheetHead('What influenced your decision?', 'Optional')}
    <div data-toggleable>${chips('endWhy', END_REASONS, null)}</div>
    <div class="btn-row"><button class="btn primary" data-act="endStep" data-step="3">Continue</button><button class="btn ghost" data-act="endStep" data-step="3" data-skip="1">Skip</button></div>`);
  else {
    SH.endWhy = el.dataset.skip ? null : getPick('endWhy');
    openSheet(() => `${sheetHead('Are you sure you want to end this project?')}
      <p>This will stop its future tasks and reminders. Your history and progress will remain available, and you can reopen it later.</p>
      <div class="btn-row"><button class="btn" data-act="closeSheet">Keep project</button><button class="btn accent" data-act="endConfirm">Confirm and end</button></div>`);
  }
  SH.goalId = id;
};
A.endConfirm = () => {
  const g = goalById(SH.goalId); if (!g) return;
  const td = today();
  g.statusBefore = g.status; g.status = 'ended'; g.endedOn = td; g.endReason = SH.endWhy || null;
  const from = S.tasks.some((x) => x.goalId === g.id && S.occ['t:' + x.id + '@' + td]) ? dAdd(td, 1) : td;
  g.endedRanges = (g.endedRanges || []).concat({ from, to: null });
  const ws = weekStart(td); if (S.weeks[ws] && S.weeks[ws].goalId === g.id) S.weeks[ws].goalId = null;
  save(); render(); openGoal(g.id); toast('Project ended and archived. Its history is kept.');
};
A.goalReopen = () => {
  const g = goalById(SH.goalId); if (!g) return;
  const td = today(); const r = (g.endedRanges || []).find((x) => !x.to);
  if (r) r.to = dAdd(td, -1);
  if (r && r.to < r.from) g.endedRanges = g.endedRanges.filter((x) => x !== r);
  g.status = g.statusBefore && g.statusBefore !== 'ended' ? g.statusBefore : 'active'; g.reopenedOn = td; g.endedOn = null;
  save(); render(); refreshSheet(); toast('Reopened from today. Nothing from the ended days is owed.');
};
