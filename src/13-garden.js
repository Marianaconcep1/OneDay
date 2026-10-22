/* ---------- Living companion: a bonsai, garden or farm that grows from your records ----------
   Credit per day comes from records (done 2, smaller version or rest followed 1, check-in 1),
   capped at 5 a day and stored as the highest value seen, so growth is never taken back.
   Milestones (+8), business results (+4) and completed goals (+15) add bigger steps.
   Missed days only make it rest. It never dies, and paused days don't count. */
const DAY_CAP = 5;
const BONUS = { milestone: 8, result: 4, goal: 15 };
const STAGES = [0, 4, 10, 18, 28, 40, 55, 72, 92, 115, 140, 170, 205, 245, 290];
const KINDS = { bonsai: 'Bonsai', garden: 'Garden', farm: 'Farm' };
const STAGE_NAMES = {
  bonsai: ['A seed in its pot', 'First sprout', 'Two leaves', 'A small stem', 'First branch', 'Second branch', 'A young trunk', 'Fuller canopy', 'A third branch', 'Shaped crown', 'Thick trunk', 'Moss at the base', 'First blossoms', 'Mature bonsai', 'Old, steady bonsai'],
  garden: ['Turned soil', 'First shoots', 'Seedlings', 'Green rows', 'First bud', 'First flower', 'A few blooms', 'A border', 'Climbing vine', 'Full beds', 'A small path', 'Bees visiting', 'A bench', 'Overflowing garden', 'A garden that knows you'],
  farm: ['A cleared field', 'First furrow', 'Seeds planted', 'Sprouts', 'One green row', 'Two rows', 'A fence', 'Three rows', 'A small barn', 'Golden crop', 'An orchard tree', 'A second field', 'A windmill', 'A full harvest', 'A farm with history']
};
function growthInit() {
  const g = S.growth;
  if (!g.chapters.length) g.chapters.push({ id: uid('ch'), kind: g.kind || 'bonsai', name: 'First chapter', startedOn: S.settings.calibrationStart || today(), seed: Math.floor(Math.random() * 1e6) });
  return g;
}
const chapter = () => growthInit().chapters[growthInit().chapters.length - 1];
function dayCredit(ds) {
  let pts = 0;
  for (const it of itemsFor(ds)) {
    if (it.unplanned || it.paused) { if (it.status === 'done') pts += 1; continue; }
    if (it.status === 'done' && it.kind !== 'train') pts += 2;
    else if (it.kind === 'train' && it.status === 'done') pts += 2;
    else if (it.status === 'modified' || it.status === 'rest') pts += 1;
  }
  if (S.checkins[ds]) pts += 1;
  return Math.min(DAY_CAP, pts);
}
function growthAward(key, type, ds) {
  const g = growthInit();
  if (g.ledger[key]) return false;
  g.ledger[key] = { pts: BONUS[type] || 0, type, date: ds, ch: chapter().id };
  save(); return true;
}
/* Upgrade-only sync of the last two weeks of daily credit */
function growthSync() {
  const g = growthInit(); const td = today(); const ch = chapter();
  for (let i = 0; i <= 14; i++) {
    const ds = dAdd(td, -i); if (ds < ch.startedOn) break;
    const k = 'day:' + ds + ':' + ch.id;
    if (!g.ledger[k] && Object.keys(g.ledger).some((x) => x.startsWith('day:' + ds + ':'))) continue; // already credited to an earlier chapter
    const c = dayCredit(ds);
    if (c > ((g.ledger[k] && g.ledger[k].pts) || 0)) g.ledger[k] = { pts: c, type: 'day', date: ds, ch: ch.id };
  }
  for (const r of S.business.results) if (r.date >= ch.startedOn && ['Client', 'Revenue', 'Milestone'].includes(r.type)) growthAward('res:' + r.id, 'result', r.date);
}
function chapterPoints(chId) { let p = 0; for (const k in S.growth.ledger) { const e = S.growth.ledger[k]; if ((e.ch || S.growth.chapters[0].id) === chId) p += e.pts; } return p; }
function stageOf(pts) { let s = 0; STAGES.forEach((t2, i) => { if (pts >= t2) s = i; }); return s; }
/* Rest state: unpaused days since the last check-in (today doesn't count against you) */
function quietDays() {
  const td = today(); let n = 0;
  for (let i = 1; i <= 60; i++) {
    const ds = dAdd(td, -i);
    if (S.checkins[ds] || ds < (S.settings.calibrationStart || td)) break;
    if (!pausedAll(ds)) n++;
  }
  return S.checkins[td] ? 0 : n;
}
const MESSAGES = [
  'Every record is a leaf, even the small ones.', 'Smaller versions still feed the roots.', 'Rest days count. Roots grow in the quiet.',
  'One action today is enough to grow.', 'Nothing here needs to be perfect to grow.', 'A five-minute version is still water and light.',
  'What you logged this week is already part of the plant.', 'Steady beats big. The trunk thickens slowly.', 'Coming back is part of growing.',
  'The plan bends; the plant keeps every ring.', 'Growth from today stays, whatever tomorrow looks like.', 'You only need to begin the next small thing.'
];
function dailyMessage(td) { const h = [...td].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7); return MESSAGES[h % MESSAGES.length]; }

/* Deterministic drawings, scaled by stage */
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function drawCompanion(kind, stage, seed, resting) {
  const r = rng(seed + stage * 0);
  const leaf = resting ? 'var(--g-leaf-rest)' : 'var(--g-leaf)';
  let g = `<svg class="comp ${resting ? 'resting' : ''}" viewBox="0 0 120 120" role="img" aria-label="${esc(KINDS[kind] + ': ' + STAGE_NAMES[kind][stage])}">`;
  if (kind === 'bonsai') {
    g += `<path d="M30 98h60l-6 14H36z" fill="var(--g-pot)"/><rect x="26" y="94" width="68" height="6" rx="3" fill="var(--g-pot-rim)"/>`;
    if (stage === 0) g += `<ellipse cx="60" cy="93" rx="5" ry="3.5" fill="var(--g-trunk)"/>`;
    const h = Math.min(62, 8 + stage * 5); const w = 1.5 + stage * 0.45;
    if (stage >= 1) g += `<path d="M60 95 C ${60 - stage} ${95 - h * 0.4}, ${60 + stage * 1.2} ${95 - h * 0.7}, 60 ${95 - h}" stroke="var(--g-trunk)" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
    const nb = Math.min(6, Math.floor(stage / 2));
    const clusters = [];
    for (let i = 0; i < nb; i++) {
      const y = 95 - h * (0.45 + 0.5 * (i / Math.max(1, nb))); const dir = i % 2 ? 1 : -1; const len = 10 + r() * 14 + stage;
      const x2 = 60 + dir * len, y2 = y - 4 - r() * 6;
      g += `<path d="M60 ${y} Q ${60 + dir * len * 0.5} ${y + 2} ${x2} ${y2}" stroke="var(--g-trunk)" stroke-width="${Math.max(1.2, w * 0.45)}" fill="none" stroke-linecap="round"/>`;
      clusters.push([x2, y2, 7 + stage * 0.8 + r() * 4]);
    }
    if (stage >= 1) clusters.push([60, 95 - h, 5 + stage * 1.1]);
    clusters.forEach(([x, y, rr], i) => { g += `<ellipse class="sway" style="animation-delay:${(i * 0.4).toFixed(1)}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rr.toFixed(1)}" ry="${(rr * 0.62).toFixed(1)}" fill="${leaf}"/>`; });
    if (stage >= 11) g += `<ellipse cx="60" cy="95" rx="14" ry="2.6" fill="var(--g-moss)"/>`;
    if (stage >= 12 && !resting) clusters.slice(0, stage - 9).forEach(([x, y]) => { g += `<circle cx="${(x + 3).toFixed(1)}" cy="${(y - 2).toFixed(1)}" r="2.2" fill="var(--g-bloom)"/>`; });
  } else if (kind === 'garden') {
    g += `<rect x="6" y="92" width="108" height="22" rx="6" fill="var(--g-soil)"/>`;
    const n = Math.min(14, stage + 1);
    for (let i = 0; i < n; i++) {
      const x = 12 + (i * 97 / Math.max(1, n - 1 || 1)) % 98 + r() * 4; const ht = 6 + Math.min(46, stage * 3) * (0.5 + r() * 0.5);
      g += `<path d="M${x.toFixed(1)} 94 V ${(94 - ht).toFixed(1)}" stroke="${leaf}" stroke-width="2" stroke-linecap="round"/>`;
      g += `<ellipse class="sway" style="animation-delay:${(i * 0.3).toFixed(1)}s" cx="${(x + 4).toFixed(1)}" cy="${(94 - ht * 0.5).toFixed(1)}" rx="4" ry="2" fill="${leaf}"/>`;
      if (stage >= 5 && i % 2 === 0 && !resting) g += `<circle cx="${x.toFixed(1)}" cy="${(94 - ht).toFixed(1)}" r="${(3 + r() * 2).toFixed(1)}" fill="${i % 4 ? 'var(--g-bloom)' : 'var(--g-bloom2)'}"/>`;
    }
    if (stage >= 10) g += `<path d="M58 114 Q 62 104 70 100" stroke="var(--g-path)" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    if (stage >= 12) g += `<rect x="86" y="80" width="22" height="4" rx="2" fill="var(--g-trunk)"/><rect x="88" y="84" width="2" height="8" fill="var(--g-trunk)"/><rect x="104" y="84" width="2" height="8" fill="var(--g-trunk)"/>`;
  } else {
    g += `<rect x="4" y="88" width="112" height="26" rx="5" fill="var(--g-soil)"/>`;
    const rows = Math.min(4, Math.ceil(stage / 2));
    for (let rw = 0; rw < rows; rw++) {
      const y = 108 - rw * 6;
      g += `<line x1="10" x2="${stage >= 8 ? 70 : 110}" y1="${y}" y2="${y}" stroke="var(--g-furrow)" stroke-width="1.5"/>`;
      if (stage >= 3) for (let x = 14; x < (stage >= 8 ? 68 : 108); x += 8) g += `<path class="sway" style="animation-delay:${((x + rw) % 5 * 0.3).toFixed(1)}s" d="M${x} ${y} v -${Math.min(8, 2 + stage * 0.6).toFixed(1)}" stroke="${stage >= 9 && !resting ? 'var(--g-grain)' : leaf}" stroke-width="2" stroke-linecap="round"/>`;
    }
    if (stage >= 6) g += `<path d="M6 86 H114" stroke="var(--g-trunk)" stroke-width="1.5" stroke-dasharray="1 5"/>`;
    if (stage >= 8) g += `<path d="M78 88 V 66 L 92 56 L 106 66 V 88 Z" fill="var(--g-barn)"/><rect x="88" y="74" width="8" height="14" fill="var(--g-pot-rim)"/>`;
    if (stage >= 10) g += `<path d="M30 88 V 66" stroke="var(--g-trunk)" stroke-width="3"/><circle cx="30" cy="62" r="10" fill="${leaf}"/>${resting ? '' : '<circle cx="27" cy="60" r="2" fill="var(--g-bloom)"/><circle cx="34" cy="64" r="2" fill="var(--g-bloom)"/>'}`;
    if (stage >= 12) g += `<path d="M58 88 V 58" stroke="var(--g-trunk)" stroke-width="2"/><path class="spin" d="M58 58 l -9 -3 M58 58 l 9 3 M58 58 l 3 -9 M58 58 l -3 9" stroke="var(--g-trunk)" stroke-width="2"/>`;
  }
  if (resting) g += `<text x="96" y="22" class="zz">z</text><text x="104" y="14" class="zz" style="font-size:9px">z</text>`;
  return g + '</svg>';
}
function companionState() {
  growthSync();
  const ch = chapter(); const pts = chapterPoints(ch.id); const stage = stageOf(pts);
  const q = quietDays(); const paused = pausedAll(today());
  return { ch, pts, stage, next: STAGES[stage + 1], quiet: q, resting: !paused && q >= 3, paused, offer: !paused && q >= 7 && S.growth.offerDismissed !== lastCheckinDate() };
}
function lastCheckinDate() { const ks = Object.keys(S.checkins).sort(); return ks.length ? ks[ks.length - 1] : null; }

function renderCompanionToday() {
  const g = S.growth; if (!g.enabled) return '';
  const c = companionState();
  const anim = g.animations && !reducedMotion() ? 'anim' : '';
  let h = `<section class="companion card ${anim}"><button class="comp-btn" data-act="compOpen" aria-label="Open your ${esc(KINDS[c.ch.kind].toLowerCase())}">${drawCompanion(c.ch.kind, c.stage, c.ch.seed, c.resting || c.paused)}</button>
    <div class="grow stack-s"><div class="eyebrow">${esc(KINDS[c.ch.kind])} · ${esc(c.ch.name)}</div><div class="h3">${esc(STAGE_NAMES[c.ch.kind][c.stage])}</div>
    <div class="small muted">${c.paused ? 'Resting with you during the pause.' : c.resting ? 'Resting. It will be here when you are.' : g.messages ? esc(dailyMessage(today())) : ''}</div></div></section>`;
  if (c.offer) h += `<section class="banner pink stack-s" id="gardenOffer"><div class="h3">Your garden is ready when you are. Continue growing, or begin a new chapter?</div>
    <div class="btn-row"><button class="btn primary sm" data-act="compContinue">Continue growing</button><button class="btn sm" data-act="compChapterForm">Begin a new chapter</button></div></section>`;
  return h;
}
A.compContinue = () => { S.growth.offerDismissed = lastCheckinDate(); save(); render(); };
A.compChapterForm = () => {
  SH.onPick = null;
  openSheet(() => `${sheetHead('Begin a new chapter', 'Everything grown so far is kept')}
    ${chips('chWay', [['season', 'A new season for the same plant'], ['plot', 'A new plot beside it']], 'season')}
    <div class="stack-s"><div class="h3">Kind</div>${seg('chKind', Object.entries(KINDS), chapter().kind)}</div>
    <label class="f">Name <span class="hint">Optional</span><input class="inp" id="chName" maxlength="40" placeholder="e.g. Winter chapter"></label>
    <button class="btn primary" data-act="compChapter">Begin</button>`);
};
A.compChapter = () => {
  const g = S.growth; const prev = chapter(); const way = getPick('chWay') || 'season'; const kind = getPick('chKind') || prev.kind;
  prev.endedOn = today(); prev.points = chapterPoints(prev.id);
  const n = g.chapters.length + 1;
  const ch = { id: uid('ch'), kind, name: val('chName') || (way === 'season' ? 'Season ' + n : 'Plot ' + n), startedOn: today(), seed: way === 'season' ? prev.seed : Math.floor(Math.random() * 1e6), way };
  if (way === 'season') { // same plant: carry its growth forward
    g.ledger['carry:' + ch.id] = { pts: prev.points, type: 'carry', date: today(), ch: ch.id };
  }
  g.chapters.push(ch); g.kind = kind; g.offerDismissed = lastCheckinDate(); save(); closeSheet(); render();
  toast(way === 'season' ? 'A new season begins. Everything grown is still here.' : 'A new plot. The first one is kept in your history.');
};
A.compOpen = () => openSheet(() => {
  const c = companionState(); const g = S.growth;
  const recent = Object.values(g.ledger).filter((e) => e.ch === c.ch.id && e.type !== 'carry').sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
  const label = { day: 'Daily records', milestone: 'Milestone', result: 'Business result', goal: 'Goal completed' };
  return `${sheetHead(esc(KINDS[c.ch.kind] + ' · ' + c.ch.name), esc(STAGE_NAMES[c.ch.kind][c.stage]))}
    <div class="comp-big">${drawCompanion(c.ch.kind, c.stage, c.ch.seed, c.resting || c.paused)}</div>
    <p class="small">${c.next ? `${c.pts} growth so far. The next stage comes at ${c.next}.` : `${c.pts} growth. Fully grown, and it keeps every ring.`}</p>
    <p class="tiny muted">Completed actions give 2, smaller versions and rest days 1, a check-in 1, up to ${DAY_CAP} a day. Milestones, business results and finished goals add more. Growth is never taken away; quiet days only let it rest, and paused days don’t count.</p>
    ${recent.length ? `<div class="kv small">${recent.map((e) => `<span>${esc(label[e.type] || e.type)} · ${esc(dMD(e.date))}</span><span>+${e.pts}</span>`).join('')}</div>` : ''}
    ${g.chapters.length > 1 ? `<div class="stack-s"><div class="h3">Earlier chapters</div>${g.chapters.slice(0, -1).map((x) => `<p class="small">${esc(x.name)} · ${esc(KINDS[x.kind])} · ${esc(dMD(x.startedOn))}–${esc(dMD(x.endedOn))} · ${x.points} growth</p>`).join('')}</div>` : ''}
    <button class="btn" data-act="compChapterForm">Begin a new chapter</button>`;
});
function renderCompanionSettings() {
  const g = S.growth; const ch = chapter();
  const box = (id, on, label) => `<label class="row" style="min-height:44px;gap:10px"><input type="checkbox" id="${id}" data-act="compSave" ${on ? 'checked' : ''} style="width:22px;height:22px"> ${label}</label>`;
  return `<p class="small">A small living companion on Today that grows from what you record. It never dies or shames; quiet days only let it rest.</p>
    ${box('cpOn', g.enabled, 'Show the companion on Today')}
    <div class="stack-s"><div class="h3">Kind for this chapter</div>${seg('cpKind', Object.entries(KINDS), ch.kind)}</div>
    ${box('cpMsg', g.messages, 'Show a daily message')}${box('cpAnim', g.animations, 'Gentle movement')}
    <button class="btn sm" data-act="compSave">Save companion</button>`;
}
A.compSave = (el) => {
  setTimeout(() => {
    const g = S.growth; g.enabled = $('#cpOn').checked; g.messages = $('#cpMsg').checked; g.animations = $('#cpAnim').checked;
    const k = getPick('cpKind'); if (k) { chapter().kind = k; g.kind = k; }
    save(); if (el.tagName === 'BUTTON') toast('Saved.');
  }, 0);
};
