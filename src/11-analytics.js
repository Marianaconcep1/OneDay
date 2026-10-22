/* ---------- Progress analytics: week / month / all time ----------
   Counts only scheduled, unpaused items. "No record" is shown apart from zero, and a
   percentage appears only where a numeric target exists. */
let PROG_RANGE = 'week';
let PROG_MONTH = 0;
let CHART_N = 0;
function progRangeSeg() {
  return `<div class="seg range-seg" role="group" aria-label="Range">${[['week', 'Week'], ['month', 'Month'], ['all', 'All time']].map(([v, l]) => `<button type="button" class="chip" data-act="progRange" data-r="${v}" aria-pressed="${PROG_RANGE === v ? 'true' : 'false'}">${l}</button>`).join('')}</div>`;
}
A.progRange = (el) => { PROG_RANGE = el.dataset.r; render(); };
A.progMonth = (el) => { PROG_MONTH = Math.min(0, PROG_MONTH + Number(el.dataset.d)); render(); };
A.chartTip = (el) => { const box = el.closest('.chart-box'); const tip = box && box.querySelector('.chart-tip'); if (tip) tip.textContent = el.dataset.tip; };

function firstRecordDate() {
  const c = [S.settings.calibrationStart, ...Object.keys(S.checkins), ...Object.values(S.occ).map((o) => o.date), ...Object.values(S.training.logs).map((l) => l.date)].filter(isDate).sort();
  return c[0] || today();
}
function monthRange(off) {
  const td = today(); let y = Number(td.slice(0, 4)), m = Number(td.slice(5, 7)) + off;
  while (m < 1) { m += 12; y--; }
  const from = `${y}-${String(m).padStart(2, '0')}-01`;
  let ny = y, nm = m + 1; if (nm > 12) { nm = 1; ny++; }
  const last = dAdd(`${ny}-${String(nm).padStart(2, '0')}-01`, -1);
  return { from, to: last, label: dFmt(from, { month: 'long', year: 'numeric' }) };
}
/* Buckets of dates, each with its stats; future dates are dropped */
function buckets(from, to) {
  const td = today(); const end = to < td ? to : td; const out = [];
  if (from > end) return out;
  const monthly = dDiff(from, end) > 26 * 7;
  let cur = from;
  while (cur <= end) {
    let stop;
    if (monthly) { const y = Number(cur.slice(0, 4)), m = Number(cur.slice(5, 7)); let ny = y, nm = m + 1; if (nm > 12) { nm = 1; ny++; } stop = dAdd(`${ny}-${String(nm).padStart(2, '0')}-01`, -1); }
    else stop = dAdd(weekStart(cur), 6);
    if (stop > end) stop = end;
    const dates = []; for (let d = cur; d <= stop; d = dAdd(d, 1)) dates.push(d);
    out.push({ from: cur, to: stop, label: monthly ? dFmt(cur, { month: 'short' }) : dMD(cur), dates, st: weekStats(weekStart(cur), dates), effort: effortFor(dates) });
    cur = dAdd(stop, 1);
  }
  return out;
}
function effortFor(dates) {
  const e = { bizPlanned: 0, bizActual: 0, trainSessions: 0, trainFollowed: 0, distPlanned: 0, distActual: 0, artScheduled: 0, artDone: 0 };
  for (const ds of dates) for (const it of itemsFor(ds)) {
    if (it.paused || it.unplanned) continue;
    if (it.kind === 'biz' && !it.needsAction) {
      e.bizPlanned += it.fullMinutes || it.minutes || 0;
      const o = it.occ; if (o) e.bizActual += o.minutes ? Number(o.minutes) : o.status === 'done' ? (o.planned.minutes || 0) : o.status === 'modified' ? 5 : 0;
    }
    if (it.kind === 'train' && it.session && it.session.type !== 'rest') {
      e.trainSessions++; if (it.status === 'done' || it.status === 'modified') e.trainFollowed++;
      e.distPlanned += Number(it.session.distance) || 0; if (it.log && it.log.distance) e.distActual += Number(it.log.distance) || 0;
    }
    if (it.area === 'art' && it.kind === 'task') { e.artScheduled++; if (it.status === 'done' || it.status === 'modified') e.artDone++; }
  }
  return e;
}
const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
const fmtN = (n) => String(Math.round(n * 100) / 100);

function activityChart(bs) {
  const id = 'h' + (++CHART_N);
  const W = 320, H = 150, padL = 24, padB = 20, top = 8;
  const tot = (b) => b.st.all.done + b.st.all.modified + b.st.all.skipped + b.st.all.norecord;
  const max = Math.max(1, ...bs.map(tot)); const nice = max <= 5 ? max : Math.ceil(max / 5) * 5;
  const step = (W - padL) / bs.length; const bw = Math.max(5, Math.min(30, step - 6));
  const sc = (v) => (H - padB - top) * v / nice;
  let g = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Completed, smaller and skipped scheduled actions over time"><defs><pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="var(--muted)" stroke-width="1.2"/></pattern></defs>`;
  g += `<line class="grid" x1="${padL}" x2="${W}" y1="${H - padB}" y2="${H - padB}"/><line class="grid" x1="${padL}" x2="${W}" y1="${H - padB - sc(nice)}" y2="${H - padB - sc(nice)}"/><text x="0" y="${H - padB - sc(nice) + 4}">${nice}</text><text x="0" y="${H - padB + 4}">0</text>`;
  bs.forEach((b, i) => {
    const x = padL + i * step + (step - bw) / 2; let y = H - padB; const a = b.st.all;
    const segs = [['done', 'var(--c-done)', 'completed'], ['modified', 'var(--c-mod)', 'smaller version'], ['skipped', 'var(--c-skip)', 'skipped'], ['norecord', `url(#${id})`, 'no record']];
    for (const [k, fill, lab] of segs) {
      if (!a[k]) continue; const h = sc(a[k]); y -= h;
      g += `<rect x="${x.toFixed(1)}" y="${(y + 1).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, h - 2).toFixed(1)}" rx="2" fill="${fill}" ${k === 'norecord' ? 'stroke="var(--muted)" stroke-width="1"' : ''}/>`;
    }
    const tip = `${b.label}: ${a.done} completed, ${a.modified} smaller, ${a.skipped} skipped, ${a.norecord} no record${b.st.pausedDays ? ', ' + plural(b.st.pausedDays, 'paused day') : ''}`;
    g += `<rect class="hit" x="${(padL + i * step).toFixed(1)}" y="0" width="${step.toFixed(1)}" height="${H - padB}" fill="transparent" data-act="chartTip" data-tip="${esc(tip)}"><title>${esc(tip)}</title></rect>`;
    if (!a.scheduled) g += `<text x="${(x + bw / 2).toFixed(1)}" y="${H - padB - 4}" text-anchor="middle">${b.st.pausedDays && !b.st.days ? 'P' : '·'}</text>`;
    if (bs.length <= 8 || i % Math.ceil(bs.length / 6) === 0) g += `<text x="${(x + bw / 2).toFixed(1)}" y="${H - 5}" text-anchor="middle">${esc(b.label)}</text>`;
  });
  g += '</svg>';
  return `<div class="chart-box">${g}${chartLegend([['var(--c-done)', 'Completed'], ['var(--c-mod)', 'Smaller version'], ['var(--c-skip)', 'Skipped']])}<div class="legend"><span><i class="hatch"></i>No record</span><span>· nothing scheduled</span><span>P paused</span></div><p class="tiny muted chart-tip" aria-live="polite">Tap a bar for its numbers.</p></div>`;
}
function activityInsight(bs) {
  const a = { done: sum(bs, (b) => b.st.all.done), modified: sum(bs, (b) => b.st.all.modified), skipped: sum(bs, (b) => b.st.all.skipped), norecord: sum(bs, (b) => b.st.all.norecord), scheduled: sum(bs, (b) => b.st.all.scheduled) };
  const paused = sum(bs, (b) => b.st.pausedDays);
  if (!a.scheduled) return 'Nothing was scheduled in this range' + (paused ? `, and ${plural(paused, 'day was', 'days were')} paused.` : '.');
  const best = bs.filter((b) => b.st.all.scheduled).sort((x, y) => (y.st.all.done + y.st.all.modified) - (x.st.all.done + x.st.all.modified))[0];
  return `${a.done} of ${a.scheduled} scheduled items were completed as planned and ${a.modified} in a smaller version. ${a.skipped} were skipped and ${a.norecord} have no record.${bs.length > 1 && best ? ` The most followed period was ${best.label}.` : ''}${paused ? ` ${plural(paused, 'paused day')} left out.` : ''}`;
}
function consistencyGrid(bs) {
  const rows = ['money', 'business', 'training', 'art'];
  const cell = (b, area) => {
    const s = b.st.area[area];
    if (!s.scheduled) return `<td class="cg-none" title="Nothing scheduled">·</td>`;
    const f = (s.done + s.modified) / s.scheduled; const lvl = Math.min(4, Math.round(f * 4));
    return `<td class="cg l${lvl}" title="${esc(b.label)}: ${s.done + s.modified} of ${s.scheduled} followed${s.norecord ? ', ' + s.norecord + ' no record' : ''}">${s.done + s.modified}/${s.scheduled}</td>`;
  };
  const ci = (b) => `<td class="cg ${b.st.days ? 'l' + Math.min(4, Math.round(b.st.checkins / b.st.days * 4)) : 'cg-none'}">${b.st.days ? b.st.checkins + '/' + b.st.days : 'P'}</td>`;
  const show = bs.slice(-8);
  return `<div class="table-wrap"><table class="t cgrid"><thead><tr><th></th>${show.map((b) => `<th>${esc(b.label)}</th>`).join('')}</tr></thead><tbody>
    ${rows.map((a) => { const g = goalFor(a); return `<tr><th><span class="dot ${a}"></span> ${esc(t('area.' + a))}${g ? `<br><span class="tiny muted">${esc(g.title)}</span>` : ''}</th>${show.map((b) => cell(b, a)).join('')}</tr>`; }).join('')}
    <tr><th><span class="dot mind"></span> Check-ins</th>${show.map(ci).join('')}</tr></tbody></table></div>
    <p class="tiny muted">Followed (completed or smaller) of scheduled. “·” means nothing was scheduled, which isn’t a miss.${bs.length > 8 ? ' Showing the last 8 periods.' : ''}</p>`;
}
function consistencyInsight(bs) {
  const tot = {}; for (const a of ['money', 'business', 'training', 'art']) tot[a] = { f: sum(bs, (b) => b.st.area[a].done + b.st.area[a].modified), s: sum(bs, (b) => b.st.area[a].scheduled), n: sum(bs, (b) => b.st.area[a].norecord) };
  const has = Object.entries(tot).filter(([, v]) => v.s);
  if (!has.length) return 'No area had anything scheduled in this range.';
  const lines = has.map(([a, v]) => `${t('area.' + a)} ${v.f} of ${v.s}`);
  const nr = has.filter(([, v]) => v.n).map(([a, v]) => `${t('area.' + a)} ${v.n}`);
  return 'Followed: ' + lines.join(', ') + '.' + (nr.length ? ' Without a record: ' + nr.join(', ') + '.' : '');
}
function pairBars(label, planned, actual, fmt, unitNote) {
  const max = Math.max(planned, actual, 1);
  if (!planned && !actual) return `<div class="pair"><div class="small"><b>${esc(label)}</b></div><p class="tiny muted">Nothing planned or logged.</p></div>`;
  return `<div class="pair"><div class="row-between small"><b>${esc(label)}</b><span class="num">${fmt(actual)} logged · ${fmt(planned)} planned</span></div>
    <div class="pbar"><span class="pl" style="width:${(planned / max * 100).toFixed(1)}%"></span></div>
    <div class="pbar"><span class="ac" style="width:${(actual / max * 100).toFixed(1)}%"></span></div>
    ${unitNote ? `<p class="tiny muted">${esc(unitNote)}</p>` : ''}</div>`;
}
function effortSection(bs) {
  const e = {}; for (const k of Object.keys(bs[0].effort)) e[k] = sum(bs, (b) => b.effort[k]);
  const unit = S.training.profile.unit || 'mi';
  const distMissing = sum(bs, (b) => b.st.train.distMissing);
  const ins = [];
  if (e.bizPlanned) ins.push(`Business: about ${minsLabel(Math.round(e.bizActual))} logged against ${minsLabel(e.bizPlanned)} planned.`);
  if (e.trainSessions) ins.push(`Training: ${e.trainFollowed} of ${e.trainSessions} sessions done or modified.`);
  if (e.distPlanned || e.distActual) ins.push(`Running: ${fmtN(e.distActual)} of ${fmtN(e.distPlanned)} ${unit} planned${distMissing ? `; ${plural(distMissing, 'run')} had no distance entered` : ''}.`);
  if (e.artScheduled) ins.push(`Art: ${e.artDone} of ${e.artScheduled} invitations taken.`);
  return `<div class="legend"><span><i style="background:var(--slate-soft);border:1px dashed var(--slate)"></i>Planned</span><span><i style="background:var(--slate)"></i>Logged</span></div>
    ${pairBars('Business time', e.bizPlanned, e.bizActual, (n) => minsLabel(Math.round(n)))}
    ${pairBars('Training sessions', e.trainSessions, e.trainFollowed, (n) => String(n))}
    ${pairBars('Running distance', e.distPlanned, e.distActual, (n) => fmtN(n) + ' ' + unit)}
    ${pairBars('Art sessions', e.artScheduled, e.artDone, (n) => String(n))}
    <p class="small insight">${esc(ins.join(' ') || 'Nothing planned or logged in this range.')}</p>`;
}
function outcomesSection(from, to) {
  const td = today(); const end = to < td ? to : td;
  const sv0 = confirmedSavings(dAdd(from, -1)).value, sv1 = confirmedSavings(end).value;
  const res = S.business.results.filter((r) => r.date >= from && r.date <= end);
  const rev = res.filter((r) => r.type === 'Revenue' && r.amount != null).reduce((s, r) => s + r.amount, 0);
  const byType = {}; res.filter((r) => r.type !== 'Revenue').forEach((r) => { byType[r.type] = (byType[r.type] || 0) + 1; });
  const ms = []; S.goals.forEach((g) => g.milestones.forEach((m) => { if (m.doneOn && m.doneOn >= from && m.doneOn <= end) ms.push({ g, m }); }));
  const done = S.goals.filter((g) => g.completedOn && g.completedOn >= from && g.completedOn <= end);
  const goals = S.goals.filter((g) => g.status !== 'later' && (g.status !== 'complete' || (g.completedOn >= from && g.completedOn <= end)));
  let h = `<div class="stack-s">${goals.map((g) => `<button class="goal-row" data-act="${g.status === 'complete' ? 'reportOpen' : 'goalOpen'}" data-id="${g.id}"><span class="dot ${g.area}"></span><span class="grow"><b>${esc(g.title)}</b><br><span class="small muted">${esc(goalSummaryLine(g))}${g.status === 'complete' ? ' · completed ' + esc(dMD(g.completedOn)) : ''}</span>${goalBar(g)}</span><span aria-hidden="true">›</span></button>`).join('') || '<p class="small muted">No goals yet. Add one in Plan to see progress toward it here.</p>'}</div>`;
  h += `<div class="kv small mt-s"><span>Confirmed savings</span><span>${sv1 == null ? 'Not confirmed' : money(sv1)}${sv0 != null && sv1 != null ? ` (${sv1 - sv0 >= 0 ? '+' : ''}${money(sv1 - sv0)})` : ''}</span>
    <span>Business results</span><span>${Object.keys(byType).length ? Object.entries(byType).map(([k, n]) => esc(k) + ' ×' + n).join(', ') : 'None entered'}</span>
    <span>Revenue entered</span><span>${rev ? money(rev) : 'None'}</span>
    <span>Milestones reached</span><span>${ms.length}</span><span>Goals completed</span><span>${done.length}</span></div>`;
  const ins = [];
  if (sv0 != null && sv1 != null) ins.push(`Confirmed savings changed by ${money(sv1 - sv0)} in this range.`); else ins.push('Savings change can’t be measured without a confirmed balance before and after.');
  if (ms.length) ins.push(`Milestones: ${ms.slice(0, 3).map((x) => x.m.title).join(', ')}${ms.length > 3 ? '…' : ''}.`);
  h += `<p class="small insight">${esc(ins.join(' '))}</p>`;
  return h;
}
function savingsChart(bs) {
  const pts = bs.map((b) => ({ b, v: confirmedSavings(b.to).value }));
  const known = pts.filter((p) => p.v != null);
  if (known.length < 2) return '';
  const goal = S.goals.find((g) => g.kind === 'target' && g.target.source === 'savings' && g.status !== 'later');
  const W = 320, H = 120, padL = 46, padB = 18;
  const vals = known.map((p) => p.v).concat(goal ? [goal.target.value] : []);
  const lo = Math.min(...vals) * 0.95, hi = Math.max(...vals) * 1.02 || 1;
  const x = (i) => padL + (i + 0.5) * (W - padL) / pts.length; const y = (v) => 6 + (H - padB - 6) * (1 - (v - lo) / (hi - lo || 1));
  let path = ''; let pen = false;
  pts.forEach((p, i) => { if (p.v == null) { pen = false; return; } path += (pen ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1); pen = true; });
  let g = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Confirmed savings at the end of each period">`;
  g += `<text x="0" y="${y(hi) + 8}">${esc(money(Math.round(hi)).replace(/\.\d\d$/, ''))}</text><text x="0" y="${H - padB}">${esc(money(Math.round(lo)).replace(/\.\d\d$/, ''))}</text>`;
  if (goal) g += `<line x1="${padL}" x2="${W}" y1="${y(goal.target.value)}" y2="${y(goal.target.value)}" stroke="var(--pink)" stroke-dasharray="4 3"/><text x="${W - 2}" y="${y(goal.target.value) - 4}" text-anchor="end">Target</text>`;
  g += `<path d="${path}" fill="none" stroke="var(--slate)" stroke-width="2"/>`;
  pts.forEach((p, i) => { if (p.v != null) g += `<circle cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="4" fill="var(--slate)" stroke="var(--surface-solid)" stroke-width="2" data-act="chartTip" data-tip="${esc(p.b.label + ': ' + money(p.v))}"><title>${esc(p.b.label + ': ' + money(p.v))}</title></circle>`; if (bs.length <= 8 || i % Math.ceil(bs.length / 6) === 0) g += `<text x="${x(i).toFixed(1)}" y="${H - 3}" text-anchor="middle">${esc(p.b.label)}</text>`; });
  g += '</svg>';
  const first = known[0], last = known[known.length - 1];
  return `<div class="chart-box">${g}<p class="tiny muted chart-tip">Gaps mean no confirmed balance for that period.</p><p class="small insight">Confirmed savings went from ${money(first.v)} (${esc(first.b.label)}) to ${money(last.v)} (${esc(last.b.label)})${goal ? `, toward a target of ${money(goal.target.value)}` : ''}.</p></div>`;
}

function renderProgressRange() {
  CHART_N = 0;
  let from, to, label, nav = '';
  if (PROG_RANGE === 'month') {
    const m = monthRange(PROG_MONTH); const fr = firstRecordDate(); from = m.from > fr ? m.from : fr; to = m.to; label = m.label;
    nav = `<div class="row"><button class="btn ghost sm" data-act="progMonth" data-d="-1" aria-label="Previous month">‹</button><button class="btn ghost sm" data-act="progMonth" data-d="1" aria-label="Next month" ${PROG_MONTH === 0 ? 'disabled' : ''}>›</button></div>`;
  } else { from = firstRecordDate(); to = today(); label = 'Since ' + dMD(from); }
  let h = `<header class="topbar"><div><div class="eyebrow">${esc(label)}</div><h1 class="view-h">Progress</h1></div>${nav}</header><div class="stack-l">${progRangeSeg()}`;
  const bs = buckets(from, to);
  if (!bs.length) return h + '<p class="empty">This period hasn’t started.</p></div>';
  h += `<section class="card stack-s"><div class="eyebrow">Outcomes · what changed</div>${outcomesSection(from, to)}</section>`;
  const sc = savingsChart(bs); if (sc) h += `<section class="card stack-s"><div class="eyebrow">Savings toward your target</div>${sc}</section>`;
  h += `<section class="card stack-s"><div class="eyebrow">Activity · what you did</div><div class="h3">Scheduled actions over time</div>${activityChart(bs)}<p class="small insight">${esc(activityInsight(bs))}</p></section>`;
  h += `<section class="card stack-s"><div class="h3">Consistency by goal</div>${consistencyGrid(bs)}<p class="small insight">${esc(consistencyInsight(bs))}</p></section>`;
  h += `<section class="card stack-s"><div class="h3">Planned and logged effort</div>${effortSection(bs)}</section>`;
  h += `<p class="tiny muted">Activity and outcomes are shown separately: effort doesn’t automatically produce results, and results can lag behind effort. Paused days and unscheduled days are left out. ${t('descriptive')}</p></div>`;
  return h;
}
