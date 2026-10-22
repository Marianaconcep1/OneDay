/* ---------- Progress ---------- */
let PROG_WEEK = 0;
function renderProgress() { return PROG_RANGE === 'week' ? renderProgressWeek() : renderProgressRange(); }
function renderProgressWeek() {
  const td = today();
  const ws = dAdd(weekStart(td), PROG_WEEK * 7);
  const we = dAdd(ws, 6);
  const st = weekStats(ws);
  const a = st.all; const tr = st.train; const sp = st.spend; const bz = st.biz;
  const asOf = we < td ? we : td;
  const svNow = confirmedSavings(asOf), svBefore = confirmedSavings(dAdd(ws, -1));
  const paid = S.money.billPaid.filter((p) => p.paidOn >= ws && p.paidOn <= we);
  const results = S.business.results.filter((r) => r.date >= ws && r.date <= we);
  const rev = results.filter((r) => r.type === 'Revenue' && r.amount != null).reduce((s, r) => s + r.amount, 0);
  const unit = S.training.profile.unit || 'mi';
  const fmtD = (n) => (Math.round(n * 100) / 100).toString();
  let h = `<header class="topbar"><div><div class="eyebrow">${esc(dMD(ws))} – ${esc(dMD(we))}</div><h1 class="view-h">Progress</h1></div><div class="row"><button class="btn ghost sm" data-act="progWeek" data-d="-1" aria-label="Previous week">‹</button><button class="btn ghost sm" data-act="progWeek" data-d="1" aria-label="Next week" ${PROG_WEEK >= 0 ? 'disabled' : ''}>›</button></div></header><div class="stack-l">`;
  h += progRangeSeg();
  if (!st.days) return h + (st.pausedDays ? '<p class="empty">This week has been paused so far. Nothing is counted.</p></div>' : '<p class="empty">This week hasn’t started.</p></div>');
  h += `<section class="card stack-s"><div class="eyebrow">What moved forward</div>${movedForwardHtml(ws)}<p class="tiny muted">Only what you logged. No interpretation.</p></section>`;
  const gl = S.goals.filter((g) => g.status === 'active' || g.status === 'maintaining');
  if (gl.length) h += `<section class="card stack-s"><div class="eyebrow">Goals · outcomes</div>${gl.map((g) => `<button class="goal-row" data-act="goalOpen" data-id="${g.id}"><span class="dot ${g.area}"></span><span class="grow"><b>${esc(g.title)}</b><br><span class="small muted">${esc(goalSummaryLine(g))}</span>${goalBar(g)}</span><span aria-hidden="true">›</span></button>`).join('')}</section>`;
  h += `<section class="card"><div class="eyebrow">This week so far · scheduled items only</div>
    <p class="mt-s" style="font-size:19px"><b>Completed as planned: ${a.done} of ${a.scheduled} scheduled.</b></p>
    <p>Modified: ${a.modified}. Skipped: ${a.skipped}.${a.norecord ? ' No record: ' + a.norecord + '.' : ''}</p>
    <p class="tiny muted mt-s">Unscheduled days aren’t counted. A followed rest day counts as following the plan.${st.pausedDays ? ' ' + plural(st.pausedDays, 'paused day') + ' left out.' : ''}</p></section>`;

  h += `<section class="stack-s"><div class="h2">Actions</div><div class="card flat"><div class="kv">
    <span>Spending logs completed</span><span>${sp.complete + sp.none} of ${sp.days} days</span>
    ${sp.incomplete ? `<span>Marked incomplete</span><span>${sp.incomplete}</span>` : ''}
    ${sp.partial ? `<span>Entries, not confirmed complete</span><span>${sp.partial}</span>` : ''}
    ${sp.missing ? `<span>Not recorded</span><span>${sp.missing}</span>` : ''}
    <span>Business sessions as planned</span><span>${bz.done} of ${bz.scheduled}</span>
    ${bz.modified ? `<span>Five-minute versions</span><span>${bz.modified}</span>` : ''}
    <span>Business outputs noted</span><span>${bz.outputs}</span>
    ${(() => { const ps = planningStats(ws); return ps.sessions ? `<span>Planning sessions → scheduled action → done</span><span>${ps.sessions} → ${ps.led} → ${ps.executed}</span>` : ''; })()}
    <span>Training sessions followed</span><span>${tr.completed + tr.rest} of ${tr.scheduled}</span>
    ${tr.modified ? `<span>Modified sessions</span><span>${tr.modified}</span>` : ''}
    ${tr.skipped ? `<span>Skipped sessions</span><span>${tr.skipped}</span>` : ''}
    <span>Art</span><span>${st.art.participated} of ${st.art.scheduled} days${st.art.extra ? ' + ' + st.art.extra + ' extra' : ''}</span>
    <span>Check-ins submitted</span><span>${st.checkins} of ${st.days} days</span></div></div></section>`;

  h += `<section class="stack-s"><div class="h2">Outcomes</div><div class="card flat"><div class="kv">
    <span>Confirmed savings change</span><span>${svNow.value != null && svBefore.value != null ? (svNow.value - svBefore.value >= 0 ? '+' : '') + money(svNow.value - svBefore.value) : 'Not enough confirmed data'}</span>
    <span>Confirmed savings now</span><span>${svNow.value == null ? 'Not confirmed' : money(svNow.value)}</span>
    <span>Bills marked paid</span><span>${paid.length}</span>
    <span>Business results</span><span>${results.length ? results.filter((r) => r.type !== 'Revenue').map((r) => r.type).join(', ') || '—' : 'None entered'}</span>
    ${rev ? `<span>Revenue entered</span><span>${money(rev)}</span>` : ''}
    <span>Running distance</span><span>${fmtD(tr.distActual)} ${unit}${tr.distPlanned ? ' of ' + fmtD(tr.distPlanned) + ' planned' : ''}</span>
    <span>Rest days followed</span><span>${tr.rest} of ${tr.restPlanned}</span></div>
    ${tr.distMissing ? `<p class="tiny muted mt-s">${plural(tr.distMissing, 'run')} logged without a distance, so the total is incomplete.</p>` : ''}
    <p class="tiny muted mt-s">Logged effort doesn’t automatically produce these outcomes, and time spent isn’t revenue. Both are shown so you can see each honestly.</p></div></section>`;

  h += `<section class="stack-s"><div class="h2">Training by day</div><div class="card flat">${trainingChart(st, unit)}</div></section>`;
  h += `<section class="stack-s"><div class="h2">Mood and energy</div><div class="card flat stack-s">
    <div class="mood-row">${st.dates.map((d) => `<span class="tiny muted">${DOW_LETTER[dDow(d)]}</span>`).join('')}</div>
    <div class="mood-row" aria-label="Mood">${st.mood.map((m) => `<span class="mv ${m == null ? 'missing' : ''}">${m === undefined ? '' : m == null ? '—' : m}</span>`).join('')}</div>
    <div class="mood-row" aria-label="Energy">${st.energy.map((m) => `<span class="mv ${m == null ? 'missing' : ''}">${m === undefined ? '' : m == null ? '—' : m}</span>`).join('')}</div>
    <p class="tiny muted">Top row mood, bottom row energy, 1–5. “—” means no value was recorded, which is different from a low score. “P” is a paused day. ${t('descriptive')}</p></div></section>`;

  const reasons = Object.entries(st.reasons).sort((x, y) => y[1] - x[1]);
  h += `<details class="sect"><summary><b class="grow">Details</b></summary><div class="sect-body">
    ${reasons.length ? `<div><div class="h3">Reasons noted</div><p class="small">${reasons.map(([r, n]) => esc(reasonLabel(r)) + ' ×' + n).join(', ')}</p></div>` : ''}
    ${Object.keys(bz.cats).length ? `<div><div class="h3">Business time by category</div><p class="small">${Object.entries(bz.cats).map(([c, n]) => esc(c) + ': ' + n).join(', ')} · about ${minsLabel(bz.minutes)} total</p></div>` : ''}
    <div><div class="h3">Spending recorded</div><p class="small">${money(sp.totalCents)} in expenses across the days with entries. ${sp.missing ? plural(sp.missing, 'day') + ' not recorded, so this is not a full-week total.' : ''} Transfers between your accounts are excluded.</p></div>
    <div class="table-wrap"><table class="t"><thead><tr><th>Day</th><th>Planned</th><th>As planned</th><th>Smaller</th><th>Skipped</th><th>Spending</th><th>Check-in</th></tr></thead><tbody>
    ${st.dates.filter((d) => d <= td).map((d) => { const it = itemsFor(d).filter((i) => !i.unplanned); const c = (s) => it.filter((i) => (s === 'done' ? i.status === 'done' || i.status === 'rest' : i.status === s)).length; return `<tr><td>${esc(dFmt(d, { weekday: 'short', day: 'numeric' }))}</td><td>${it.length}</td><td>${c('done')}</td><td>${c('modified')}</td><td>${c('skipped')}</td><td>${esc(spendStatusText(d))}</td><td>${S.checkins[d] ? 'Yes' : '—'}</td></tr>`; }).join('')}
    </tbody></table></div></div></details>`;
  h += `<div class="btn-row"><button class="btn" data-act="openReport" data-ws="${ws}">Copy weekly report for ChatGPT</button><button class="btn accent" data-act="openReview">Weekly review</button></div>`;
  h += '</div>';
  return h;
}
A.progWeek = (el) => { PROG_WEEK = Math.min(0, PROG_WEEK + Number(el.dataset.d)); render(); };
function trainingChart(st, unit) {
  const W = 320, H = 130, pad = 24, bw = 28;
  const rows = st.dates.map((d) => { const s = sessionFor(d); const lg = S.training.logs['tr@' + d]; return { d, s, lg, plan: s && s.distance ? Number(s.distance) : 0, act: lg && lg.distance ? Number(lg.distance) : 0 }; });
  const max = Math.max(1, ...rows.map((r) => Math.max(r.plan, r.act)));
  const nice = max <= 5 ? Math.ceil(max) : Math.ceil(max / 5) * 5;
  const y = (v) => H - pad - (v / nice) * (H - pad - 12);
  const step = (W - 30) / 7;
  let g = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Planned versus logged distance by day">`;
  g += `<line class="grid" x1="26" x2="${W}" y1="${y(0)}" y2="${y(0)}"/><line class="grid" x1="26" x2="${W}" y1="${y(nice)}" y2="${y(nice)}"/>`;
  g += `<text x="0" y="${y(nice) + 4}">${nice}</text><text x="0" y="${y(0) + 4}">0</text>`;
  rows.forEach((r, i) => {
    const x = 30 + i * step + (step - bw) / 2;
    if (r.plan) g += `<rect class="plan" x="${x}" y="${y(r.plan)}" width="${bw}" height="${y(0) - y(r.plan)}" rx="3"/>`;
    if (r.act) g += `<rect class="act" x="${x + 5}" y="${y(r.act)}" width="${bw - 10}" height="${y(0) - y(r.act)}" rx="2"/>`;
    const label = r.s ? (r.s.type === 'rest' ? (r.lg && r.lg.status === 'rest' ? 'Rest ✓' : 'Rest') : (SESSION_TYPES[r.s.type] || '').split(' ')[0]) : '';
    g += `<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${DOW_LETTER[dDow(r.d)]}</text>`;
    if (label && !r.plan && !r.act) g += `<text x="${x + bw / 2}" y="${y(0) - 6}" text-anchor="middle">${esc(label)}</text>`;
  });
  g += '</svg>';
  return g + `<p class="tiny muted">Outlined: planned distance (${unit}). Filled: logged distance. Rest days are listed separately above, not as distance.</p>`;
}

/* ---------- Weekly report (plain text to paste into ChatGPT) ---------- */
function weeklyReport(ws, withMoney) {
  const st = weekStats(ws); const we = dAdd(ws, 6); const rv = S.reviews[ws];
  const unit = S.training.profile.unit || 'mi';
  const L = [];
  L.push(`One Day weekly report · ${ws} to ${we}`);
  L.push(`(Personal accountability log. Descriptive counts only; please don't infer causes from them.)`);
  L.push('');
  L.push(`Overall: completed as planned ${st.all.done} of ${st.all.scheduled} scheduled; modified ${st.all.modified}; skipped ${st.all.skipped}; no record ${st.all.norecord}.`);
  const mf = movedForward(ws); if (mf.length) { L.push('What moved forward (logged facts):'); mf.forEach((x) => L.push('- ' + x)); }
  const ex = S.experiments.find((x) => x.ws === ws); if (ex) L.push(`This week's experiment: because I noticed ${ex.noticed}, I changed ${ex.change}. Result: ${ex.result || 'not reviewed yet'}.`);
  L.push(`Money: spending log complete ${st.spend.complete + st.spend.none}/${st.spend.days} days (incomplete ${st.spend.incomplete}, not recorded ${st.spend.missing}).` + (withMoney ? ` Expenses recorded: ${money(st.spend.totalCents)} (partial if days are missing).` : ''));
  if (withMoney) { const sv = confirmedSavings(we < today() ? we : today()); L.push(`Confirmed savings: ${sv.value == null ? 'not confirmed' : money(sv.value)}. Buffer goal: ${S.money.buffer.amount == null ? 'not set' : money(S.money.buffer.amount)}.`); }
  L.push(`Business: ${st.biz.done} of ${st.biz.scheduled} sessions as planned, ${st.biz.modified} five-minute versions, ${st.biz.outputs} outputs noted. Stage: ${S.business.stage || 'not set'}. Four-week outcome: ${S.business.outcome4w || 'not set'}. This week's outcome: ${S.business.weekly[ws] || 'not set'}.`);
  const res = S.business.results.filter((r) => r.date >= ws && r.date <= we);
  if (res.length) L.push(`Business results: ${res.map((r) => r.type + (withMoney && r.amount != null ? ' ' + money(r.amount) : '') + (r.note ? ' (' + r.note + ')' : '')).join('; ')}.`);
  L.push(`Training: ${st.train.completed} completed as planned, ${st.train.modified} modified, ${st.train.skipped} skipped, ${st.train.rest}/${st.train.restPlanned} rest days followed, of ${st.train.scheduled} scheduled. Distance logged ${Math.round(st.train.distActual * 100) / 100} ${unit} vs ${Math.round(st.train.distPlanned * 100) / 100} planned.`);
  L.push(`Art: ${st.art.participated} of ${st.art.scheduled} scheduled days${st.art.extra ? ', plus ' + st.art.extra + ' unscheduled' : ''}.`);
  L.push(`Check-ins: ${st.checkins} of ${st.days} days. Mood (1-5, "-" = not recorded): ${st.mood.filter((m) => m !== undefined).map((m) => (m == null ? '-' : m)).join(' ')}. Energy: ${st.energy.filter((m) => m !== undefined).map((m) => (m == null ? '-' : m)).join(' ')}.`);
  const reasons = Object.entries(st.reasons);
  if (reasons.length) L.push(`Reasons noted for skipped/modified items: ${reasons.map(([r, n]) => reasonLabel(r) + ' x' + n).join(', ')}.`);
  if (rv) {
    L.push(''); L.push('Weekly review answers:');
    const q = [['moved', 'What moved forward'], ['blocked', 'What got in the way'], ['adjust', 'Smaller/clearer/better scheduled'], ['money', 'Coming financial obligations'], ['art', 'Time for art and enjoyment']];
    for (const [k, l] of q) if (rv[k]) L.push(`- ${l}: ${rv[k]}`);
    if (rv.adjustmentLabel) L.push(`- Chosen adjustment for next week: ${rv.adjustmentLabel}`);
  }
  L.push(''); L.push('Question for you: based only on this, what is one small, specific change to next week that keeps the plan realistic?');
  // The report is plain text, so each line is translated here rather than on the page
  return L.map((x) => (x.startsWith('- ') ? '- ' + trText(x.slice(2)) : trText(x))).join('\n');
}
A.openReport = (el) => {
  const ws = el.dataset.ws || weekStart(today());
  SH.reportWs = ws;
  SH.onPick = () => { $('#reportText').textContent = weeklyReport(ws, getPick('repMoney') === 'yes'); };
  openSheet(() => `${sheetHead('Weekly report', 'Plain text to paste into ChatGPT')}
    <div class="stack-s"><span class="small">Include money amounts?</span>${seg('repMoney', [['no', 'No'], ['yes', 'Yes']], 'no')}</div>
    <pre class="report" id="reportText">${esc(weeklyReport(ws, false))}</pre>
    <button class="btn primary" data-act="copyText" data-src="reportText">${t('btn.copy')}</button>
    <p class="tiny muted">Nothing is sent anywhere. You choose where to paste it.</p>`);
};
A.copyText = async (el) => {
  const src = document.getElementById(el.dataset.src); const text = src.value != null && src.tagName === 'TEXTAREA' ? src.value : src.textContent;
  try { await navigator.clipboard.writeText(text); toast('Copied.'); }
  catch (e) { const r = document.createRange(); r.selectNodeContents(src); const s = getSelection(); s.removeAllRanges(); s.addRange(r); if (src.select) src.select(); toast('Selected. Use Copy from the menu.'); }
};

/* ---------- Weekly review ---------- */
function reviewWeek() { const td = today(); return dDow(td) === S.settings.reviewDay ? weekStart(td) : dAdd(weekStart(td), -7); }
function reviewDue() {
  const td = today(); const c = S.settings.calibrationStart;
  if (!c || dDiff(c, td) < 5) return false;
  const ws = reviewWeek(); if (S.reviews[ws]) return false;
  const dow = dDow(td);
  return dow === S.settings.reviewDay || dow === (S.settings.reviewDay + 1) % 7;
}
function reviewSuggestions(ws, nextWs) {
  const out = [];
  const th = S.settings.skipThreshold || 3;
  const from = dAdd(ws, -21), to = dAdd(ws, 6);
  const skips = {};
  for (const k in S.occ) { const o = S.occ[k]; if (o.date >= from && o.date <= to && o.status === 'skipped') { const id = o.kind === 'biz' ? 'bizblock' : o.refId; skips[id] = (skips[id] || 0) + 1; } }
  for (const id in skips) {
    if (skips[id] < th) continue;
    if (id === 'bizblock') {
      const b = bizBlockAt(nextWs) || { days: [], minutes: 15 };
      const m = Math.max(5, Math.round(b.minutes * 2 / 3));
      if (m < b.minutes) out.push({ id: 'bizshort', label: `Shorten the business block from ${b.minutes} to ${m} minutes`, why: `Business sessions were skipped ${skips[id]} times on scheduled days in the last four weeks.`, apply: () => pushVersion(S.business.block, { days: b.days, minutes: m }, nextWs) });
    } else {
      const task = S.tasks.find((x) => x.id === id); if (!task || task.endedOn) continue;
      const p = taskPlan(task, nextWs);
      out.push({ id: 'small:' + id, label: `Make “${p.title}” smaller`, why: `Skipped ${skips[id]} times on scheduled days in the last four weeks.`, input: { title: p.minTitle || p.title, minutes: p.minMinutes || Math.max(1, Math.round(p.minutes / 2)) }, apply: (inp) => pushVersion(task, Object.assign({}, p, { title: inp.title || p.title, minutes: inp.minutes || p.minutes }), nextWs) });
    }
  }
  const st = weekStats(ws);
  if ((st.reasons.forgot || 0) >= 2) out.push({ id: 'cue', label: 'Attach a cue to the spending log', why: `“Forgot” came up ${st.reasons.forgot} times.`, cue: true, apply: (inp) => { S.money.cue = inp.cue || ''; } });
  else if (st.spend.missing >= 3) out.push({ id: 'cue', label: 'Attach the spending log to a daily cue', why: `${st.spend.missing} days had no spending record.`, cue: true, apply: (inp) => { S.money.cue = inp.cue || ''; } });
  const over = st.dates.filter((d) => d <= today() && dayMinutes(d).over);
  if (over.length >= 2) {
    const dow = dDow(over[0]); const b = bizBlockAt(nextWs);
    if (b && b.days.includes(dow)) out.push({ id: 'bizday', label: `Remove ${DOW_SHORT[dow]} from the business block`, why: `${plural(over.length, 'day')} had more planned than available time.`, apply: () => pushVersion(S.business.block, { days: b.days.filter((d) => d !== dow), minutes: b.minutes }, nextWs) });
  }
  return out.slice(0, 4);
}
A.openReview = () => {
  const ws = reviewWeek(); const nextWs = dAdd(ws, 7); const st = weekStats(ws); const rv = S.reviews[ws] || {};
  const sug = reviewSuggestions(ws, nextWs);
  const exp = S.experiments.find((x) => x.ws === ws);
  const groups = changeGroups(ws);
  const nw = weekPlan(nextWs) || {}; const nMain = nw.main || 'money';
  SH.rev = { ws, nextWs, sug, groups, exp };
  const pre = rv.adjustmentId || (sug[0] ? sug[0].id : 'none');
  const fill = (id) => { const s = sug.find((x) => x.id === id); return s ? { noticed: s.why, change: s.label } : null; };
  SH.onPick = (g, v) => {
    if (g === 'revAdj') {
      $$('[data-sugbox]').forEach((b) => { b.hidden = b.dataset.sugbox !== v; });
      const f = fill(v); const n = $('#rvNoticed'), c = $('#rvChange');
      if (n && (!n.value || n.dataset.auto)) { n.value = f ? f.noticed : ''; n.dataset.auto = '1'; }
      if (c && (!c.value || c.dataset.auto)) { c.value = f ? f.change : ''; c.dataset.auto = '1'; }
    }
  };
  const reasons = Object.entries(st.reasons).sort((x, y) => y[1] - x[1]);
  const bills = obligationsBetween(nextWs, dAdd(nextWs, 14)).filter((o) => !o.paid);
  const trainNext = weekDates(nextWs).map((d) => [d, sessionFor(d)]).filter(([, s]) => s);
  const f0 = rv.noticed != null ? { noticed: rv.noticed, change: rv.change } : (fill(pre) || { noticed: '', change: '' });
  openSheet(() => `${sheetHead('Weekly review', esc(dMD(ws)) + ' – ' + esc(dMD(dAdd(ws, 6))) + ' · 10–15 minutes')}
    <div class="card tint"><p><b>Completed as planned: ${st.all.done} of ${st.all.scheduled} scheduled.</b> Modified: ${st.all.modified}. Skipped: ${st.all.skipped}.</p><p class="small mt-s">Check-ins ${st.checkins}/${st.days} · Spending logs ${st.spend.complete + st.spend.none}/${st.spend.days} · Training followed ${st.train.completed + st.train.rest}/${st.train.scheduled}</p></div>
    <div class="stack-s"><div class="h3">What moved forward</div>${movedForwardHtml(ws)}<label class="f"><span class="hint">Anything else?</span><textarea class="inp" id="rvMoved" maxlength="600">${esc(rv.moved || '')}</textarea></label></div>
    ${exp ? `<div class="card flat stack-s"><div class="h3">Last week’s experiment</div><p class="small">Because I noticed ${esc(exp.noticed || '…')}, I changed ${esc(exp.change || '…')}.</p><span class="small">Did it help?</span>${seg('expRes', [['helped', 'Helped'], ['no', 'Didn’t help'], ['unsure', 'Not sure'], ['untried', 'Didn’t try it']], exp.result)}</div>` : ''}
    <label class="f">What repeatedly got in the way? ${reasons.length ? `<span class="hint">Noted: ${reasons.map(([r, n]) => esc(reasonLabel(r)) + ' ×' + n).join(', ')}</span>` : ''}<textarea class="inp" id="rvBlocked" maxlength="600">${esc(rv.blocked || '')}</textarea></label>
    ${groups.length ? `<div class="stack-s"><div class="h3">Changes to your commitments</div><p class="tiny muted">The original and the change are both kept. Which explanation fits? Your call; none is assumed.</p>
      ${groups.map((g, i) => `<div class="card flat stack-s"><b>${esc(g.title)}</b><div class="tiny muted">${g.items.map((c) => esc(CHANGE_KIND[c.kind] || c.kind) + (c.from || c.to ? ' (' + esc([c.from, c.to].filter(Boolean).join(' → ')) + ')' : '')).join(' · ')}${g.postponed4w >= 3 ? ` · moved or dropped ${g.postponed4w} times in four weeks` : ''}</div><div data-toggleable>${chips('chg' + i, EXPLAIN, g.explanation)}</div></div>`).join('')}</div>` : ''}
    <label class="f">What should become smaller, clearer, or better scheduled?<textarea class="inp" id="rvAdjust" maxlength="600">${esc(rv.adjust || '')}</textarea></label>
    <label class="f">What financial obligations are coming? <span class="hint">${bills.length ? 'Due in the next two weeks: ' + bills.map((o) => esc(o.bill.name) + ' ' + esc(dMD(o.due))).join(', ') : 'No bills entered for the next two weeks.'}</span><textarea class="inp" id="rvMoney" maxlength="600">${esc(rv.money || '')}</textarea></label>
    <div class="stack-s"><div class="h3">Next week’s one main outcome</div>${nw.confirmedAt ? '' : '<p class="tiny muted">Suggested: financial clarity. Confirm it or pick another.</p>'}${chips('rvMain', Object.entries(AREA_GOAL).map(([a, l]) => [a, l]), nMain)}<input class="inp" id="rvMainOut" maxlength="160" value="${esc(nw.mainOutcome || '')}" placeholder="What will exist by the end of next week?" aria-label="Main outcome"></div>
    <div class="stack-s"><div class="h3">Keep going at a maintenance level</div>${chips('rvKeep', AREAS.map((a) => [a, t('area.' + a)]), nw.maintain || AREAS.filter((a) => a !== nMain), true)}</div>
    <label class="f">Next week’s one business outcome<input class="inp" id="rvBiz" maxlength="160" value="${esc(S.business.weekly[nextWs] || rv.bizOutcome || '')}" placeholder="One visible result, e.g. Offer draft shared with one person"></label>
    <div class="stack-s"><div class="h3">Training scheduled next week</div>${trainNext.length ? `<p class="small">${trainNext.map(([d, s]) => DOW_SHORT[dDow(d)] + ': ' + esc(sessionLabel(s))).join(' · ')}</p>` : '<p class="small muted">No sessions entered.</p>'}<div><button class="btn ghost sm" data-act="goPlanClose">Edit training plan</button></div></div>
    <label class="f">Where is time for art, people and enjoyment?<textarea class="inp" id="rvArt" maxlength="600">${esc(rv.art || '')}</textarea></label>
    <label class="f">Postpone an idea to Later <span class="hint">Optional. It won’t be scheduled.</span><input class="inp" id="rvLater" maxlength="140"></label>
    <div class="stack-s"><div class="h3">One change for next week</div><p class="tiny muted">One manageable experiment, chosen by default. Suggestions follow simple rules (for example, ${S.settings.skipThreshold} skips on scheduled days). Targets never rise automatically.</p>
      ${chips('revAdj', [...sug.map((s) => [s.id, s.label]), ['custom', 'My own change'], ['none', 'No change this week']], rv.applied ? null : pre)}
      ${sug.map((s, i) => `<div class="card flat stack-s" data-sugbox="${esc(s.id)}" ${pre === s.id && !rv.applied ? '' : 'hidden'}><p class="small">${esc(s.why)}</p>${s.input ? `<label class="f">New version<input class="inp" id="sgTitle${i}" maxlength="120" value="${esc(s.input.title)}"></label><label class="f">Minutes<input class="inp num" id="sgMins${i}" type="number" min="1" max="240" value="${esc(s.input.minutes)}"></label>` : ''}${s.cue ? `<label class="f">After I…<input class="inp" id="sgCue${i}" maxlength="80" placeholder="finish dinner"></label>` : ''}<p class="tiny muted">Takes effect ${esc(dMD(nextWs))}. Earlier records keep the original.</p></div>`).join('')}
      ${rv.applied ? `<p class="small"><span class="pill done">Applied</span> ${esc(rv.adjustmentLabel)}</p>` : ''}
      <div class="card tint stack-s"><label class="f">Because I noticed<input class="inp" id="rvNoticed" maxlength="200" value="${esc(f0.noticed)}" ${rv.noticed == null ? 'data-auto="1"' : ''} placeholder="evenings were consistently crowded"></label><label class="f">next week I will change<input class="inp" id="rvChange" maxlength="200" value="${esc(f0.change)}" ${rv.change == null ? 'data-auto="1"' : ''} placeholder="move business work to mornings"></label><p class="tiny muted">An experiment. Next week’s review asks whether it helped.</p></div></div>
    <button class="btn primary" data-act="reviewSave">Save review</button>`, { full: true, noFocus: true });
  $$('#rvNoticed, #rvChange').forEach((e) => e.addEventListener('input', () => { delete e.dataset.auto; }));
};
A.reviewSave = () => {
  const { ws, nextWs, sug, groups, exp } = SH.rev; const prev = S.reviews[ws] || {};
  const rec = Object.assign({}, prev, { id: 'rv@' + ws, weekStart: ws, moved: val('rvMoved'), blocked: val('rvBlocked'), adjust: val('rvAdjust'), money: val('rvMoney'), bizOutcome: val('rvBiz'), art: val('rvArt'), noticed: val('rvNoticed'), change: val('rvChange'), movedForward: movedForward(ws), updatedAt: nowISO() });
  if (!prev.submittedAt) rec.submittedAt = nowISO();
  if (rec.bizOutcome) S.business.weekly[nextWs] = rec.bizOutcome;
  const main = getPick('rvMain') || 'money';
  S.weeks[nextWs] = Object.assign({}, S.weeks[nextWs] || {}, { main, mainOutcome: val('rvMainOut'), maintain: getPicks('rvKeep').filter((a) => a !== main), confirmedAt: nowISO() });
  const later = val('rvLater'); if (later) S.later.push({ id: uid('later'), kind: 'idea', text: later, createdAt: nowISO() });
  groups.forEach((g, i) => { const v = getPick('chg' + i); for (const c of S.changes) if ((c.refId || c.title) === g.id && c.date >= ws && c.date <= dAdd(ws, 6)) c.explanation = v; });
  if (exp) { exp.result = getPick('expRes'); exp.reviewedAt = nowISO(); }
  const pick = getPick('revAdj');
  if (pick && pick !== 'none' && pick !== 'custom' && !prev.applied) {
    const i = sug.findIndex((x) => x.id === pick); const s = sug[i];
    if (s) { s.apply({ title: val('sgTitle' + i), minutes: numOrNull(val('sgMins' + i)), cue: val('sgCue' + i) }); rec.adjustmentId = s.id; rec.adjustmentLabel = s.label; rec.applied = true; }
  }
  if (pick !== 'none' && (rec.noticed || rec.change)) {
    S.experiments = S.experiments.filter((x) => x.ws !== nextWs);
    S.experiments.push({ id: 'exp@' + nextWs, ws: nextWs, noticed: rec.noticed, change: rec.change, result: null, createdAt: nowISO() });
  }
  S.reviews[ws] = rec; save(); closeSheet(); render(); toast(rec.applied && !prev.applied ? 'Review saved. One change starts ' + dMD(nextWs) + '.' : 'Review saved.');
};
