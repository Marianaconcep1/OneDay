/* ---------- Goal-completion report: built only from what was recorded ---------- */
function changeArea(c) {
  if (c.area) return c.area;
  const k = c.key || '';
  if (k.startsWith('biz@')) return 'business';
  if (k === 'train') return 'training';
  if (k === 'spend') return 'money';
  if (k.startsWith('t:')) { const tk = taskForKey(k); return tk ? tk.area : null; }
  return null;
}
function goalRecord(g) {
  const from = g.startedOn; const to = g.completedOn || today();
  const r = { from, to, days: dDiff(from, to) + 1, paused: 0, done: 0, modified: 0, skipped: 0, reasons: {}, weeks: [], checkins: 0 };
  let wk = null;
  for (let ds = from; ds <= to; ds = dAdd(ds, 1)) {
    if (pauseOn(ds, g.area)) r.paused++;
    const ws = weekStart(ds);
    if (!wk || wk.ws !== ws) { wk = { ws, done: 0, modified: 0, skipped: 0, paused: 0 }; r.weeks.push(wk); }
    if (pauseOn(ds, g.area)) wk.paused++;
    if (S.checkins[ds]) r.checkins++;
    for (const it of itemsFor(ds)) {
      if (it.area !== g.area || it.paused) continue;
      const s = it.status === 'rest' ? 'done' : it.status;
      if (s === 'done' || s === 'modified' || s === 'skipped') { r[s]++; wk[s]++; }
      const rs = (it.occ && it.occ.reason) || (it.log && it.log.reason);
      if (rs && (s === 'skipped' || s === 'modified')) r.reasons[rs] = (r.reasons[rs] || 0) + 1;
    }
  }
  r.changes = S.changes.filter((c) => c.date >= from && c.date <= to && changeArea(c) === g.area);
  r.stuck = S.stuck.filter((x) => x.at && x.at.slice(0, 10) >= from && x.at.slice(0, 10) <= to).length;
  r.weeksN = Math.max(1, Math.round(r.days / 7));
  return r;
}
function reportMessage(g, r) {
  const parts = [];
  const shown = r.done + r.modified;
  parts.push(`You began “${g.title}” on ${dLong(r.from)}${g.from ? `, starting from: ${g.from}` : ''}.`);
  if (shown) parts.push(`Over ${plural(r.days, 'day')} you showed up ${plural(shown, 'time')} in ${t('area.' + g.area)}${r.modified ? `, and ${r.modified} of those were smaller versions you chose instead of skipping` : ''}.`);
  if (r.skipped) parts.push(`There were ${plural(r.skipped, 'skipped day')}, and you came back after them.`);
  if (r.changes.length) parts.push(`You adjusted the plan ${plural(r.changes.length, 'time')} rather than abandoning it.`);
  const ms = g.milestones.filter((m) => m.doneOn);
  if (ms.length) parts.push(`You reached ${plural(ms.length, 'milestone')}, the first on ${dMD(ms.sort((a, b) => (a.doneOn < b.doneOn ? -1 : 1))[0].doneOn)}.`);
  if (g.kind === 'target') { const p = goalProgress(g); if (p.cur != null && p.st != null) parts.push(`The number moved from ${goalFmt(g, p.st)} to ${goalFmt(g, p.cur)}.`); }
  parts.push(shown ? 'This happened because of those actions, one record at a time.' : 'This report only shows what was recorded, so some of your work may not appear here.');
  if (S.settings.manifest) parts.push(`You named this intention clearly, and then you acted on it ${plural(shown, 'time')}. Clarity pointed the way; the actions got you here.`);
  return parts.map((x) => trText(x)).join(' ');
}
function reportChart(r) {
  const W = 320, H = 110, padL = 22, padB = 18, gap = 2;
  const max = Math.max(1, ...r.weeks.map((w) => w.done + w.modified + w.skipped));
  const n = r.weeks.length; const bw = Math.max(4, Math.min(26, (W - padL) / n - 4));
  const step = (W - padL) / n; const y = (v) => (H - padB) * (1 - v / max) ;
  let g = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Completed, smaller and skipped actions by week during this goal">`;
  g += `<line class="grid" x1="${padL}" x2="${W}" y1="${H - padB}" y2="${H - padB}"/><text x="0" y="10">${max}</text><text x="0" y="${H - padB}">0</text>`;
  r.weeks.forEach((w, i) => {
    const x = padL + i * step + (step - bw) / 2; let top = H - padB;
    for (const [k, c] of [['done', 'var(--c-done)'], ['modified', 'var(--c-mod)'], ['skipped', 'var(--c-skip)']]) {
      if (!w[k]) continue; const hgt = (H - padB) - y(w[k]); top -= hgt;
      g += `<rect x="${x.toFixed(1)}" y="${(top + gap / 2).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, hgt - gap).toFixed(1)}" rx="2" fill="${c}"><title>Week of ${dMD(w.ws)}: ${w[k]} ${k === 'done' ? 'completed' : k === 'modified' ? 'smaller version' : 'skipped'}</title></rect>`;
    }
    if (w.paused >= 4) g += `<text x="${(x + bw / 2).toFixed(1)}" y="${H - padB - 4}" text-anchor="middle">P</text>`;
    if (n <= 8 || i % Math.ceil(n / 6) === 0) g += `<text x="${(x + bw / 2).toFixed(1)}" y="${H - 4}" text-anchor="middle">${esc(dMD(w.ws))}</text>`;
  });
  return g + '</svg>' + chartLegend([['var(--c-done)', 'Completed'], ['var(--c-mod)', 'Smaller version'], ['var(--c-skip)', 'Skipped']]) + (r.weeks.some((w) => w.paused >= 4) ? '<p class="tiny muted">P marks a week that was mostly paused.</p>' : '');
}
function chartLegend(items) { return `<div class="legend">${items.map(([c, l]) => `<span><i style="background:${c}"></i>${esc(l)}</span>`).join('')}</div>`; }

function reportText(g, r) {
  const L = [];
  L.push(`GOAL COMPLETED: ${g.title}`, `${t('area.' + g.area)} · ${dLong(r.from)} to ${dLong(r.to)} (${plural(r.days, 'day')}${r.paused ? ', ' + r.paused + ' paused' : ''})`, '');
  if (g.from) L.push('Starting point: ' + g.from);
  if (g.kind === 'target') { const p = goalProgress(g); L.push(`Measured: ${goalFmt(g, p.st)} → ${goalFmt(g, p.cur)} (target ${goalFmt(g, p.tv)})`); }
  const ms = g.milestones.filter((m) => m.doneOn);
  if (ms.length) { L.push('Milestones:'); ms.forEach((m) => L.push(`  - ${m.title} (${dMD(m.doneOn)})`)); }
  L.push(`Actions in ${t('area.' + g.area)}: ${r.done} completed, ${r.modified} smaller versions, ${r.skipped} skipped`);
  const rs = Object.entries(r.reasons).sort((a, b) => b[1] - a[1]);
  if (rs.length) L.push('Obstacles noted: ' + rs.map(([k, n]) => reasonLabel(k) + ' ×' + n).join(', '));
  if (r.changes.length) { L.push('Adjustments:'); r.changes.slice(0, 12).forEach((c) => L.push(`  - ${c.title}: ${CHANGE_KIND[c.kind] || c.kind}${c.to ? ' → ' + c.to : ''} (${dMD(c.date)})`)); }
  L.push('', reportMessage(g, r));
  if (g.next) L.push('', 'Next: ' + g.next);
  return L.map((x) => { const m = /^(\s*- )?([\s\S]*)$/.exec(x); return (m[1] || '') + trText(m[2]); }).join('\n');
}
A.reportOpen = (el) => openReport(el.dataset.id);
function openReport(id) {
  const g = goalById(id); if (!g) return;
  openSheet(() => {
    const r = goalRecord(g); const p = g.kind === 'target' ? goalProgress(g) : null;
    const ms = g.milestones.filter((m) => m.doneOn).sort((a, b) => (a.doneOn < b.doneOn ? -1 : 1));
    const rs = Object.entries(r.reasons).sort((a, b) => b[1] - a[1]);
    const fin = g.status === 'complete';
    return `${sheetHead(fin ? 'Completion report' : `<span data-raw>${esc(MDL().progressTitle)}</span>`, esc(g.title))}
      <div class="card tint stack-s"><div class="eyebrow">${esc(t('area.' + g.area))} · ${fin ? 'completed ' + esc(dLong(r.to)) : `<span data-raw>${esc(mf('asOf', dLong(r.to)))}</span>`}</div>
        <p class="small">${esc(reportMessage(g, r))}</p></div>
      <div class="kv small"><span>Started</span><span>${esc(dMD(r.from))}</span><span>Elapsed</span><span>${plural(r.days, 'day')}${r.paused ? ` (${r.paused} paused)` : ''}</span>
        ${g.from ? `<span>Starting point</span><span>${esc(g.from)}</span>` : ''}
        ${p ? `<span>Measured change</span><span>${goalFmt(g, p.st)} → ${goalFmt(g, p.cur)}</span>` : ''}
        <span>Completed actions</span><span>${r.done}</span><span>Smaller versions</span><span>${r.modified}</span><span>Skipped</span><span>${r.skipped}</span>
        <span>Check-ins in this period</span><span>${r.checkins}</span></div>
      <div class="stack-s"><div class="h3">Week by week</div>${reportChart(r)}</div>
      ${ms.length ? `<div class="stack-s"><div class="h3">Milestones</div>${ms.map((m) => `<p class="small">${esc(dMD(m.doneOn))} · ${esc(m.title)}</p>`).join('')}</div>` : ''}
      ${rs.length || r.changes.length ? `<div class="stack-s"><div class="h3">Obstacles and adjustments</div>${rs.length ? `<p class="small">${rs.map(([k, n]) => esc(reasonLabel(k)) + ' ×' + n).join(', ')}</p>` : ''}${r.changes.slice(0, 6).map((c) => `<p class="small">${esc(dMD(c.date))} · ${esc(c.title)}: ${esc(CHANGE_KIND[c.kind] || c.kind)}${c.to ? ' → ' + esc(c.to) : ''}</p>`).join('')}</div>` : ''}
      <label class="row" style="min-height:44px;gap:10px"><input type="checkbox" id="rpManifest" data-act="rpManifest" ${S.settings.manifest ? 'checked' : ''} style="width:22px;height:22px"> Include intention language</label>
      ${fin ? `<div class="stack-s"><div class="h3">What next?</div><p class="tiny muted">Nothing is created unless you choose it.</p>
        ${chips('rpNext', [['maintain', 'Maintain what you built'], ['milestone', 'Set a new milestone'], ['rest', 'Rest and celebrate']], g.nextChoice || null)}
        <button class="btn sm" data-act="rpNextGo">Continue</button></div>` : ''}
      <div class="btn-row"><button class="btn primary" data-act="rpExport">Export report</button></div>
      <p class="tiny muted">Emailing the report isn’t available in this version; it would need a sending service. Export it and share it however you like.</p>`;
  }, { full: true });
  SH.reportId = id;
}
A.rpManifest = (el) => { setTimeout(() => { S.settings.manifest = el.checked; save(); refreshSheet(); }, 0); };
A.rpExport = () => { const g = goalById(SH.reportId); offerFile(`one-day-goal-report-${g.completedOn || today()}.txt`, 'text/plain', reportText(g, goalRecord(g)), 'Completion report'); };
A.rpNextGo = () => {
  const g = goalById(SH.reportId); const v = getPick('rpNext');
  if (!v) { toast('Choose one, or close the report.'); return; }
  g.nextChoice = v; save();
  if (v === 'rest') { g.next = 'Rest and celebrate'; save(); closeSheet(); render(); toast('Enjoy it. Nothing new is scheduled.'); return; }
  closeSheet(true);
  A.goalForm();
  $('#gfTitle').value = v === 'maintain' ? 'Maintain: ' + g.title : '';
  $('#gfTitle').placeholder = 'Name the next milestone';
  const area = $(`[data-group="gfArea"][data-val="${g.area}"]`); if (area) A.pick(area);
  const k = $(`[data-group="gfKind"][data-val="${v === 'maintain' ? 'ongoing' : 'milestones'}"]`); if (k) A.pick(k);
  if (v === 'maintain') { const s = $('[data-group="gfStatus"][data-val="maintaining"]'); if (s) A.pick(s); }
  SH.goal.area = g.area;
};
