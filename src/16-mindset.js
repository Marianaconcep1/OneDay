/* ---------- Mindset: a small weekly edition of free resources from a curated roster ----------
   The roster is fixed in the app's code and editions are files published with the app, so only
   whoever controls the hosting (the app owner) can change either. There is no server here, so
   updates are checked manually and never presented as automatic. */
const MINDSET_ROSTER = ['Tony Robbins', 'Mel Robbins', 'Jay Shetty', 'Alex Hormozi', 'Joe Dispenza', 'Dr. Nicole LePera', 'James Clear', 'Rob Dial', 'Steven Bartlett', 'Lewis Howes', 'Simon Sinek', 'Gary Vaynerchuk', 'Tim Ferriss', 'Brendon Burchard', 'Robin Sharma'];
const MINDSET_URL = 'mindset.json';
const MINDSET_TYPES = { podcast: 'Podcast', interview: 'Interview', video: 'Video', article: 'Article', exercise: 'Exercise', newsletter: 'Newsletter', webinar: 'Free webinar', event: 'Free event', course: 'Free course', book: 'Free book or excerpt' };
const MINDSET_TOPICS = [
  ['follow-through', 'Following through when motivation drops'], ['analytics-business', 'Building a data analytics business'], ['money', 'Financial habits'],
  ['competing-goals', 'Managing competing goals'], ['discipline', 'Sustainable discipline'], ['creativity', 'Creativity and enjoyment'],
  ['emotions', 'Emotional well-being'], ['habits', 'Habits'], ['business', 'Business in general']
];
const CLAIM_KIND = { opinion: 'Creator’s opinion or framework', promotional: 'Promotional claim', research: 'Supported by cited research', uncertain: 'Evidence uncertain' };
const DEFAULT_TOPICS = ['follow-through', 'analytics-business', 'money', 'competing-goals', 'discipline', 'creativity'];
let MS_CHECKING = false;

function msState() { return S.mindset; }
function topicLabel(k) { return (MINDSET_TOPICS.find((x) => x[0] === k) || [k, k])[1]; }
/* Strict check of an edition file: real https links, roster creators only, free access only, real dates */
function validateEdition(o) {
  const errs = [];
  const e = o && o.edition;
  if (!o || o.app !== 'one-day-mindset' || !e) return ['Not a Mindset edition file.'];
  if (!e.id || typeof e.id !== 'string') errs.push('Edition id missing.');
  if (!e.updatedAt || Number.isNaN(Date.parse(e.updatedAt))) errs.push('Edition update time missing.');
  if (!Array.isArray(e.items)) errs.push('Items missing.');
  const ids = new Set();
  for (const it of e.items || []) {
    const where = '“' + (it.title || it.id || '?') + '”';
    if (!it.id || ids.has(it.id)) errs.push('Duplicate or missing id: ' + where); ids.add(it.id);
    if (!MINDSET_ROSTER.includes(it.creator)) errs.push(where + ' is from a creator not on the roster.');
    if (!/^https:\/\/[^\s]+\.[^\s]+/.test(it.url || '')) errs.push(where + ' needs a direct https source link.');
    if (!isDate(it.published)) errs.push(where + ' needs its original publication date.');
    if (!['free', 'free-signup'].includes(it.access)) errs.push(where + ' isn’t marked as free.');
    if (it.access === 'free-signup' && !it.signup) errs.push(where + ' needs its signup requirement described.');
    if (!MINDSET_TYPES[it.type]) errs.push(where + ' has an unknown type.');
    if (!it.summary) errs.push(where + ' needs a short factual summary.');
    for (const c of it.claims || []) if (!CLAIM_KIND[c.kind] || (c.kind === 'research' && !c.source)) errs.push(where + ' has a claim without a valid label or research source.');
  }
  if (e.tryOne && (!e.tryOne.text || !['app', 'creator'].includes(e.tryOne.by))) errs.push('“Try one thing” needs text and who wrote it.');
  return errs;
}
/* Manual check: fetch the published edition file. A failure never replaces the stored edition. */
async function msCheck(manual) {
  const m = msState(); if (MS_CHECKING) return; MS_CHECKING = true;
  m.lastCheck = { at: nowISO(), ok: false, msg: '' };
  try {
    const r = await fetch(MINDSET_URL + '?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('The edition file couldn’t be reached (' + r.status + ').');
    const o = await r.json();
    const errs = validateEdition(o);
    if (errs.length) throw new Error('The edition file didn’t pass checks: ' + errs.slice(0, 3).join(' '));
    const e = o.edition;
    const known = m.editions.find((x) => x.id === e.id);
    if (known && known.updatedAt === e.updatedAt) { m.lastCheck = { at: nowISO(), ok: true, msg: 'No new edition. You have the latest one.' }; }
    else {
      m.editions = m.editions.filter((x) => x.id !== e.id).concat(Object.assign({}, e, { receivedAt: nowISO() }));
      m.lastSuccess = e.updatedAt; m.lastCheck = { at: nowISO(), ok: true, msg: known ? 'This week’s edition was corrected by the curator.' : 'New edition loaded.' };
    }
  } catch (err) {
    m.lastCheck = { at: nowISO(), ok: false, msg: (err && err.message) || 'The check failed.' };
  }
  MS_CHECKING = false; save(); if (TAB === 'mindset') render();
  if (manual) toast(m.lastCheck.ok ? m.lastCheck.msg : 'Update failed. The previous edition is kept.');
}
function latestEdition() { const m = msState(); return m.editions.length ? m.editions.slice().sort((a, b) => (a.updatedAt < b.updatedAt ? -1 : 1))[m.editions.length - 1] : null; }
/* An item is new only the first time any edition carried it */
function firstSeen(id) { let f = null; for (const e of msState().editions) if (e.items.some((x) => x.id === id) && (!f || e.updatedAt < f.updatedAt)) f = e; return f; }
function fmtStamp(iso) { return new Date(iso).toLocaleString(locale(), { timeZone: tz(), month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }
function itemRelevance(it) { const mine = msState().interests; return (it.topics || []).filter((x) => mine.includes(x)); }

function msCard(it, isNew) {
  const m = msState(); const rel = itemRelevance(it); const saved = !!m.saved[it.id];
  return `<article class="card stack-s ms-card"><div class="row-between"><span class="eyebrow">${esc(MINDSET_TYPES[it.type])} · ${esc(it.creator)}</span>${isNew ? '<span class="pill started">New</span>' : ''}</div>
    <div class="h3" lang="${esc(it.lang || 'en')}">${esc(it.title)}</div>
    <div class="tiny muted">Published ${esc(dFmt(it.published, { month: 'short', day: 'numeric', year: 'numeric' }))}${it.duration ? ' · ' + esc(it.duration) : ''}</div>
    <p class="small" lang="${esc(it.lang || 'en')}">${esc(it.summary)}</p>
    ${rel.length ? `<p class="small"><b>Why it may help:</b> ${it.why ? `<span lang="${esc(it.lang || 'en')}">${esc(it.why)}</span>` : esc('Relates to ' + rel.map((x) => tr(topicLabel(x))).join(', ').toLowerCase() + '.')}</p>` : '<p class="tiny muted">Outside the interests you chose.</p>'}
    ${(it.claims || []).map((c) => `<p class="small claim claim-${c.kind}"><span class="pill">${esc(CLAIM_KIND[c.kind])}</span> <span lang="${esc(it.lang || 'en')}">${esc(c.text)}</span>${c.source ? ` <a href="${esc(c.source)}" target="_blank" rel="noopener noreferrer">Source</a>` : ''}</p>`).join('')}
    ${it.disclosure ? `<p class="tiny muted">Disclosure: <span lang="${esc(it.lang || 'en')}">${esc(it.disclosure)}</span></p>` : ''}
    <div class="row" style="flex-wrap:wrap;gap:6px"><span class="pill done">Free</span>${it.access === 'free-signup' ? `<span class="pill modified" lang="${esc(it.lang || 'en')}">${esc(it.signup)}</span>` : ''}${lang() !== (it.lang || 'en') ? `<span class="pill">${esc(tr('Original language: {0}').replace('{0}', langName(it.lang || 'en')))}</span>` : ''}</div>
    <div class="btn-row"><a class="btn primary sm" href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a>
      <button class="btn sm" data-act="msSave" data-id="${esc(it.id)}" aria-pressed="${saved}">${saved ? 'Saved' : 'Save'}</button>
      <button class="btn ghost sm" data-act="msHide" data-id="${esc(it.id)}">Hide</button></div></article>`;
}
function langName(code) { try { const n = new Intl.DisplayNames([locale()], { type: 'language' }).of(code); return n.charAt(0).toLocaleUpperCase(locale()) + n.slice(1); } catch (e) { return code; } }
function renderMindset() {
  const m = msState(); const e = latestEdition();
  let h = `<header class="topbar"><div><div class="eyebrow">Updated weekly</div><h1 class="view-h">Mindset</h1></div></header><div class="stack-l">`;
  if (S.settings.language !== 'en') h += `<p class="small muted ms-orig">${esc(t('ms.orig'))}</p>`;
  h += `<section class="card stack-s small"><div><b>Last successful update:</b> ${m.lastSuccess ? esc(fmtStamp(m.lastSuccess)) : 'None yet'}</div>
    <div><b>Next scheduled update:</b> Not scheduled. Automatic weekly updates need a server, which this app doesn’t have yet.</div>
    ${m.lastCheck ? `<div class="${m.lastCheck.ok ? 'muted' : ''}">${m.lastCheck.ok ? '' : '<b>Last check failed:</b> '}${esc(m.lastCheck.msg)} <span class="muted">(${esc(fmtStamp(m.lastCheck.at))})</span>${m.lastCheck.ok ? '' : ' The previous edition is kept.'}</div>` : ''}
    <div><button class="btn sm" data-act="msCheck" ${MS_CHECKING ? 'disabled' : ''}>Check for a new edition (manual)</button></div></section>`;
  if (!e) {
    h += `<p class="empty">No edition has been loaded yet. Each edition is curated by the app owner from the creators below, with free resources only, real dates and direct links.</p>`;
  } else {
    const visible = (x) => !m.hidden[x.id];
    const rank = (a, b) => itemRelevance(b).length - itemRelevance(a).length;
    const isNew = (x) => firstSeen(x.id) === e && (!e.weekOf || x.published >= dAdd(e.weekOf, -7));
    const fresh = e.items.filter((x) => visible(x) && isNew(x)).sort(rank);
    const seen = new Set(); const older = [];
    for (const ed of m.editions.slice().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))) for (const x of ed.items) if (!seen.has(x.id)) { seen.add(x.id); if (!isNew(x) && visible(x) && (m.saved[x.id] || ed === e || older.length < 6)) older.push(x); }
    h += `<section class="stack-s"><div class="h2">New this week</div><p class="tiny muted">Edition ${esc(e.title || e.id)} · ${plural(fresh.length, 'item')}</p>
      ${fresh.length ? fresh.map((x) => msCard(x, true)).join('') : '<p class="small">No relevant new resources this week. Nothing older is relabeled as new.</p>'}</section>`;
    if (e.tryOne) h += renderTryOne(e);
    if (older.length) h += `<section class="stack-s"><div class="h2">Worth revisiting</div>${older.sort(rank).map((x) => msCard(x, false)).join('')}</section>`;
    h += `<p class="tiny muted ms-end">That’s the whole edition. ${e.note ? esc(e.note) : ''}</p>`;
  }
  const saved = Object.keys(m.saved).length; const hidden = Object.keys(m.hidden).length;
  h += `<details class="sect"><summary><span class="grow"><b>Your interests</b><br><span class="small muted">${m.interests.length} chosen</span></span></summary><div class="sect-body">
    ${chips('msTopics', MINDSET_TOPICS, m.interests, true)}<button class="btn sm" data-act="msTopicsSave">Save interests</button>
    <p class="tiny muted">Interests change the order and the “why it may help” notes. They don’t change who is curated.</p></div></details>`;
  h += `<details class="sect"><summary><span class="grow"><b>Saved and hidden</b><br><span class="small muted">${saved} saved · ${hidden} hidden</span></span></summary><div class="sect-body">
    ${Object.values(m.saved).map((x) => `<div class="row-between small"><a class="grow" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title)}</a><button class="btn ghost sm" data-act="msSave" data-id="${esc(x.id)}">Unsave</button></div>`).join('') || '<p class="small muted">Nothing saved yet.</p>'}
    ${hidden ? `<button class="btn ghost sm" data-act="msUnhide">Show ${plural(hidden, 'hidden item')} again</button>` : ''}</div></details>`;
  h += `<details class="sect"><summary><span class="grow"><b>Curated creators</b><br><span class="small muted">${MINDSET_ROSTER.length} chosen by the app owner</span></span></summary><div class="sect-body">
    <p class="small">${MINDSET_ROSTER.map(esc).join(' · ')}</p>
    <p class="tiny muted">This list is set by the app owner and can’t be changed in the app. Research cited to check a claim is linked as a source, never added as a creator. Popularity isn’t evidence: claims are labeled as opinion, promotion or research-supported.</p></div></details>`;
  h += `<section class="card stack-s"><label class="row" style="min-height:44px;gap:10px"><input type="checkbox" id="msNotify" data-act="msNotify" ${m.notify ? 'checked' : ''} style="width:22px;height:22px"> Tell me on Today when a new edition is loaded</label>
    <p class="tiny muted">Off unless you turn it on, and shown once per edition. It appears inside the app only; a phone notification while the app is closed would need a push server.</p></section>`;
  return h + '</div>';
}
function renderTryOne(e) {
  const m = msState(); const tr = e.tryOne; const res = e.items.find((x) => x.id === tr.resourceId);
  const done = m.tryOne[e.id] || {};
  return `<section class="card tint stack-s" id="tryOne"><div class="eyebrow">Try one thing this week · optional</div>
    <div class="h3" lang="en">${esc(tr.title || tr.text)}</div>${tr.title ? `<p class="small" lang="en">${esc(tr.text)}</p>` : ''}
    <p class="tiny muted">${tr.by === 'creator' ? 'Instructions from the creator' : 'An exercise written for this app, not by the creator'}${res ? `, connected to “${esc(res.title)}” (${esc(res.creator)})` : ''}. ${esc(tr.connection || '')} It may or may not help; try it and see.</p>
    <label class="f">What is one thing you want to apply before consuming more?<input class="inp" id="tryApply" maxlength="160" value="${esc(done.apply || '')}"></label>
    ${done.status ? `<p class="small"><b>${esc({ later: 'Saved for later', planned: 'Added to your plan', replaced: 'Replaced an optional task' }[done.status])}</b>${done.date ? ' · ' + esc(dShort(done.date)) : ''}</p>` : ''}
    <div class="btn-row"><button class="btn sm" data-act="tryLater">Save for later</button><button class="btn sm" data-act="tryPlan">Add to my weekly plan</button><button class="btn ghost sm" data-act="tryReplace">Replace an optional task</button></div></section>`;
}
A.msCheck = () => { msCheck(true); render(); };
A.msSave = (el) => {
  const m = msState(); const id = el.dataset.id;
  if (m.saved[id]) delete m.saved[id];
  else { let it = null; for (const e of m.editions) it = it || e.items.find((x) => x.id === id); if (it) m.saved[id] = { id, title: it.title, url: it.url, creator: it.creator, published: it.published, savedAt: nowISO() }; }
  save(); render();
};
A.msHide = (el) => { msState().hidden[el.dataset.id] = nowISO(); save(); render(); toast('Hidden. You can show it again below.'); };
A.msUnhide = () => { msState().hidden = {}; save(); render(); };
A.msTopicsSave = () => { const p = getPicks('msTopics'); msState().interests = p; save(); render(); toast('Interests saved.'); };
A.msNotify = (el) => { setTimeout(() => { const m = msState(); m.notify = el.checked; const e = latestEdition(); if (m.notify && e) m.notifiedEdition = e.id; save(); }, 0); };
function mindsetNotice() {
  const m = msState(); const e = latestEdition();
  if (!m.notify || !e || m.notifiedEdition === e.id) return '';
  return `<section class="banner"><div class="h3">${esc(t('ms.notice'))}</div><div class="btn-row"><button class="btn sm" data-act="msNoticeOpen">Open Mindset</button><button class="btn ghost sm" data-act="msNoticeDismiss">Dismiss</button></div></section>`;
}
A.msNoticeOpen = () => { const m = msState(); m.notifiedEdition = latestEdition().id; save(); TAB = 'mindset'; render(); window.scrollTo(0, 0); };
A.msNoticeDismiss = () => { const m = msState(); m.notifiedEdition = latestEdition().id; save(); render(); };
function tryRecord(patch) { const e = latestEdition(); const m = msState(); m.tryOne[e.id] = Object.assign({}, m.tryOne[e.id] || {}, { apply: val('tryApply') }, patch, { at: nowISO() }); save(); }
function tryTitle() { const tr = latestEdition().tryOne; return (tr.title || tr.text).slice(0, 110); }
A.tryLater = () => { const e = latestEdition(); tryRecord({ status: 'later' }); S.later.push({ id: uid('later'), kind: 'idea', text: 'Mindset: ' + tryTitle(), createdAt: nowISO(), from: 'mindset:' + e.id }); save(); render(); toast('Saved to Later. Nothing was scheduled.'); };
function tryDay() { const td = today(); for (let i = 1; i <= 6; i++) { const d = dAdd(td, i); const dm = dayMinutes(d); if (dm.avail == null || dm.total + 10 <= dm.avail) return d; } return dAdd(td, 1); }
A.tryPlan = () => {
  const d = tryDay(); const tr = latestEdition().tryOne;
  confirmBox(`Add “${esc(tryTitle())}” to your plan on ${esc(dLong(d))}, about ${tr.minutes || 10} minutes? Nothing else changes.`, 'Add to my plan', () => {
    createOneOff(tr.area || 'business', tryTitle(), tr.finish || 'Tried once, any amount.', tr.minutes || 10, d);
    tryRecord({ status: 'planned', date: d }); save(); render(); toast('Added to ' + dShort(d) + '.');
  });
};
A.tryReplace = () => {
  const td = today(); const opts = [];
  for (let i = 0; i <= 6; i++) { const d = dAdd(td, i); for (const it of itemsFor(d)) if (it.kind === 'task' && !it.unplanned && !isClosed(it.status) && it.status !== 'started' && it.area !== 'money' && it.plannedTitle !== tryTitle()) opts.push({ it, d }); }
  SH.tryOpts = opts;
  openSheet(() => `${sheetHead('Replace an optional task', 'Choose one this week')}
    ${opts.length ? chips('tryRep', opts.map((o, i) => [String(i), o.it.title + ' · ' + dShort(o.d)]), null) : '<p class="small">There are no optional tasks left this week to replace. You can add it to your plan instead.</p>'}
    ${opts.length ? '<p class="tiny muted">The original stays in your history as replaced, and the exercise takes its place that day.</p><button class="btn primary" data-act="tryReplaceGo">Continue</button>' : ''}`);
};
A.tryReplaceGo = () => {
  const i = getPick('tryRep'); if (i == null) { toast('Choose a task first.'); return; }
  const o = SH.tryOpts[Number(i)]; const tr = latestEdition().tryOne;
  confirmBox(`Replace “${esc(o.it.title)}” on ${esc(dLong(o.d))} with “${esc(tryTitle())}”?`, 'Replace task', () => {
    S.exceptions.push({ id: uid('ex'), refId: o.it.taskId, date: o.d, kind: 'off' });
    logChange({ date: o.d, key: o.it.key, refId: o.it.taskId, title: o.it.plannedTitle || o.it.title, kind: 'replaced', to: tryTitle() });
    createOneOff(o.it.area, tryTitle(), tr.finish || 'Tried once, any amount.', tr.minutes || o.it.minutes || 10, o.d);
    tryRecord({ status: 'replaced', date: o.d }); save(); render(); toast('Replaced for ' + dShort(o.d) + '.');
  });
};
