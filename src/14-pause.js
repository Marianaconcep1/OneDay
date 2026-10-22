/* ---------- Pause mode ----------
   A pause covers everything or selected areas, from a start to an end time in a chosen timezone.
   Paused days are not scheduled: no reminders, no backlog, not counted in adherence, records kept.
   When the end time passes, the plan stays paused until you confirm on the welcome-back card. */
const PAUSE_AREAS = ['money', 'business', 'training', 'art'];
function localNow(zone) { const o = partsInTz(nowMs(), zone || tz()); return `${o.year}-${o.month}-${o.day}T${o.hour}:${o.minute}`; }
function pauseState(p) {
  if (p.cancelled) return 'cancelled';
  const now = localNow(p.tz);
  if (now < p.start) return 'scheduled';
  if (p.resumedOn) return 'over';
  return now < p.end ? 'active' : 'ended';   // ended = waiting for your confirmation, still paused
}
/* First and last paused calendar dates. A pause that begins after noon leaves that day scheduled. */
function pauseDays(p) {
  if (p.cancelled) return null;
  const sd = p.start.slice(0, 10); const first = p.start.slice(11) < '12:00' ? sd : dAdd(sd, 1);
  let lastExcl;
  if (p.resumedOn) lastExcl = p.resumedOn;
  else if (pauseState(p) === 'ended') { const ed = p.end.slice(0, 10), td = today(); lastExcl = ed > td ? ed : td; }
  else lastExcl = p.end.slice(0, 10);
  return first < lastExcl ? { first, last: dAdd(lastExcl, -1) } : null;
}
function pauseOn(ds, area) {
  for (const p of S.pauses) {
    const r = pauseDays(p); if (!r || ds < r.first || ds > r.last) continue;
    if (p.scope === 'all' || area === 'mind' || (p.areas || []).includes(area)) {
      if (area === 'mind' && p.scope !== 'all') continue;
      return p;
    }
  }
  return null;
}
const pausedAll = (ds) => { const p = pauseOn(ds, 'mind'); return !!p && p.scope === 'all'; };
/* Called by itemsFor: paused items without a record disappear; recorded ones stay, marked paused */
function pauseFilter(items, ds) {
  if (!S.pauses || !S.pauses.length) return items;
  return items.filter((it) => {
    if (!pauseOn(ds, it.area)) return true;
    if (it.status && it.status !== 'scheduled') { it.paused = true; return true; }
    return false;
  });
}
function currentPause() { return S.pauses.find((p) => ['active', 'ended'].includes(pauseState(p))) || null; }
function upcomingPause() { return S.pauses.find((p) => pauseState(p) === 'scheduled') || null; }
function fmtLocal(dt, zone) {
  const [d, hm] = dt.split('T');
  return dShort(d) + ', ' + fmtTime(hm) + (zone && zone !== tz() ? ' (' + zone.replace(/_/g, ' ') + ')' : '');
}
function pauseScopeText(p) { return p.scope === 'all' ? 'Everything' : (p.areas || []).map((a) => t('area.' + a)).join(', '); }

/* Today: the pause card, or the welcome-back question once the end time has passed */
function renderPauseToday(td) {
  const p = currentPause();
  if (p && pauseState(p) === 'ended') {
    return `<section class="banner pink stack-s" id="welcomeBack"><div class="h3">Welcome back. Resume your plan or adjust your first day?</div>
      <p class="small">Your pause ended ${esc(fmtLocal(p.end, p.tz))}. Nothing from the paused days is owed, and everything you recorded is still here. The plan stays paused until you choose.</p>
      <div class="btn-row"><button class="btn primary sm" data-act="pauseResume" data-id="${p.id}">Resume my plan</button><button class="btn sm" data-act="pauseResume" data-id="${p.id}" data-adjust="1">Adjust my first day</button><button class="btn ghost sm" data-act="pauseForm" data-id="${p.id}">Extend the pause</button></div></section>`;
  }
  if (p) {
    return `<section class="card tint stack-s" id="pauseCard"><div class="eyebrow">Paused · ${esc(pauseScopeText(p))}</div>
      <div class="h2">Resting until ${esc(fmtLocal(p.end, p.tz))}</div>
      <p class="small">${p.scope === 'all' ? 'Nothing is scheduled and nothing is owed. Your companion rests too.' : 'Paused areas have nothing scheduled. Everything else continues.'} You can still log anything you feel like.</p>
      <div class="btn-row"><button class="btn sm" data-act="pauseForm" data-id="${p.id}">Extend or change</button><button class="btn ghost sm" data-act="pauseEnd" data-id="${p.id}">End now</button></div></section>`;
  }
  const up = upcomingPause();
  if (up) return `<p class="tiny muted">Pause scheduled: ${esc(pauseScopeText(up))}, ${esc(fmtLocal(up.start, up.tz))} to ${esc(fmtLocal(up.end, up.tz))}. <button class="btn ghost sm" data-act="pauseForm" data-id="${up.id}">Change</button></p>`;
  return '';
}

function renderPauseSettings() {
  const cur = currentPause() || upcomingPause();
  const past = S.pauses.filter((p) => pauseState(p) === 'over').slice(-3).reverse();
  return `<p class="small">Pause the whole routine or selected areas for a trip, illness or a break. Paused days have no reminders, build no backlog and aren’t counted in your progress. Records are kept.</p>
    ${cur ? `<div class="card tint small"><b>${pauseState(cur) === 'scheduled' ? 'Scheduled' : 'Paused now'}:</b> ${esc(pauseScopeText(cur))}, ${esc(fmtLocal(cur.start, cur.tz))} to ${esc(fmtLocal(cur.end, cur.tz))}</div>
      <div class="btn-row"><button class="btn sm" data-act="pauseForm" data-id="${cur.id}">Extend or change</button>${pauseState(cur) === 'scheduled' ? `<button class="btn ghost sm" data-act="pauseCancel" data-id="${cur.id}">Cancel pause</button>` : `<button class="btn ghost sm" data-act="pauseEnd" data-id="${cur.id}">End early</button>`}</div>`
      : '<button class="btn sm" data-act="pauseForm">Plan a pause</button>'}
    ${past.length ? `<p class="tiny muted">Earlier: ${past.map((p) => esc(dMD(p.start.slice(0, 10)) + '–' + dMD(p.resumedOn))).join(', ')}</p>` : ''}
    <div class="stack-s"><div class="h3">Reminder when a pause ends</div>
      <p class="small">An email or text at the end of a pause isn’t available in this version. Sending one needs a server and a verified email address or phone number, and this app has neither, so no reminder is set or pretended. When you open the app after the pause, it asks before anything resumes.</p></div>`;
}

A.pauseForm = (el) => {
  const p = el && el.dataset.id ? S.pauses.find((x) => x.id === el.dataset.id) : null;
  const now = localNow(tz());
  const x = p ? clone(p) : { scope: 'all', areas: [], start: now, end: dAdd(now.slice(0, 10), 7) + 'T' + now.slice(11), tz: tz() };
  SH.pause = x;
  SH.onPick = (g, v) => { if (g === 'psScope') show('psAreas', v === 'areas'); };
  const started = p && pauseState(p) !== 'scheduled';
  openSheet(() => `${sheetHead(p ? 'Change pause' : 'Plan a pause')}
    <div class="stack-s"><div class="h3">What to pause</div>${seg('psScope', [['all', 'Everything'], ['areas', 'Selected areas']], x.scope)}
      <div id="psAreas" ${x.scope === 'areas' ? '' : 'hidden'}>${chips('psArea', PAUSE_AREAS.map((a) => [a, t('area.' + a)]), x.areas, true)}<p class="tiny muted mt-s">The evening check-in continues unless you pause everything.</p></div></div>
    <div class="grid2"><label class="f">Starts<input class="inp" id="psSd" type="date" value="${x.start.slice(0, 10)}" ${started ? 'disabled' : ''}></label><label class="f">Time<input class="inp" id="psSt" type="time" value="${x.start.slice(11)}" ${started ? 'disabled' : ''}></label></div>
    <div class="grid2"><label class="f">Ends<input class="inp" id="psEd" type="date" value="${x.end.slice(0, 10)}"></label><label class="f">Time<input class="inp" id="psEt" type="time" value="${x.end.slice(11)}"></label></div>
    <label class="f">Timezone for these times<input class="inp" id="psTz" list="tzList2" value="${esc(x.tz)}" autocomplete="off"><datalist id="tzList2">${TZ_LIST.map((z) => `<option value="${z}">`).join('')}</datalist><span class="hint">Use the timezone you’ll be in when the pause ends.</span></label>
    <p class="tiny muted">If a pause starts after noon, that day stays scheduled. The day it ends is yours to start fresh.</p>
    <button class="btn primary" data-act="pauseSave">${p ? 'Save changes' : 'Start pause'}</button>`);
};
A.pauseSave = () => {
  const x = SH.pause; const zone = val('psTz') || tz();
  if (!validTz(zone)) { toast('That timezone isn’t recognized.'); return; }
  const scope = getPick('psScope') || 'all'; const areas = getPicks('psArea');
  if (scope === 'areas' && !areas.length) { toast('Pick at least one area, or pause everything.'); return; }
  const start = ($('#psSd').disabled ? x.start : (val('psSd') + 'T' + (val('psSt') || '00:00')));
  const end = val('psEd') + 'T' + (val('psEt') || '00:00');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(end)) { toast('Choose a start and end date.'); return; }
  if (end <= start) { toast('The end needs to be after the start.'); return; }
  if (end <= localNow(zone)) { toast('The end time has already passed. Choose a later time, or end the pause instead.'); return; }
  const overlap = S.pauses.some((p) => p.id !== x.id && !p.cancelled && pauseState(p) !== 'over' && !(end <= p.start || start >= p.end));
  if (overlap) { toast('This overlaps another pause. Change that one instead.'); return; }
  Object.assign(x, { scope, areas: scope === 'all' ? [] : areas, start, end, tz: zone, updatedAt: nowISO() });
  if (!x.id) { x.id = uid('pause'); x.createdAt = nowISO(); S.pauses.push(x); }
  else S.pauses[S.pauses.findIndex((p) => p.id === x.id)] = x;
  save(); closeSheet(); render(); toast(start <= localNow(zone) ? 'Paused. Nothing is owed while you’re away.' : 'Pause scheduled.');
};
A.pauseEnd = (el) => confirmBox('End the pause now and go back to your plan from today?', 'End pause', () => {
  const p = S.pauses.find((x) => x.id === el.dataset.id); if (!p) return;
  const now = localNow(p.tz); p.end = now < p.end ? now : p.end; p.resumedOn = today(); p.endedEarly = true; save(); TAB = 'today'; render();
});
A.pauseCancel = (el) => { const p = S.pauses.find((x) => x.id === el.dataset.id); if (!p) return; p.cancelled = true; save(); render(); toast('Pause cancelled.'); };
A.pauseResume = (el) => {
  const p = S.pauses.find((x) => x.id === el.dataset.id); if (!p) return;
  p.resumedOn = today(); p.resumedAt = nowISO(); save(); render();
  if (el.dataset.adjust) A.makeSmaller(); else toast('Welcome back. Today is ready.');
};
