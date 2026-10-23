/* Animation preview: the app's own envelope and garden scene code, with sample data kept in memory */
(async function () {
  await Store.open(); S = defaultState();
  Object.assign(S.settings, { languageChosen: true, language: 'en', letterLang: 'en' });
  growthInit(); S.growth.chapters[0].kind = 'garden';
  save = () => {}; flush = async () => {};
  const P = { stage: 9, motion: true, theme: 'system', kind: 'garden' };
  applyLook();
  const motionOn = () => P.motion && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  render = function () {
    const root = $('#app');
    root.innerHTML = `<main class="wrap stack-l pv">
      <header class="topbar"><div><div class="eyebrow">One Day</div><h1 class="view-h">Animation preview</h1>
        <p class="small muted">The new envelope and the garden, bonsai and farm scenes, drawn with the same code the app uses. Nothing here is saved.</p></div></header>
      <section class="card stack-s"><div class="row-between"><div class="h3">Envelope and letter</div><button class="btn sm" data-act="pvReplay">Play again</button></div>
        <p class="tiny muted">Tap the envelope.</p>
        <div class="pv-env">${WEL.stage === 'letter' ? letterHtml(lang(), false) : renderEnvelope(WEL.stage === 'opening')}</div></section>
      <section class="card stack-s"><div class="h3">Scenes with the caretaker</div>
        ${seg('pvKind', [['garden', 'Garden'], ['bonsai', 'Bonsai'], ['farm', 'Farm']], P.kind)}
        <figure class="rest-scene wide" role="img" aria-label="Garden scene">${drawScene(P.kind, P.stage, S.growth.chapters[0].seed, motionOn(), true)}</figure>
        <label class="f">Growth stage: <b>${P.stage}</b> · ${esc(STAGE_NAMES[P.kind][P.stage])}<input type="range" id="pvStage" min="0" max="14" value="${P.stage}"></label>
        <div class="btn-row"><button class="btn sm" data-act="pvMotion">${motionOn() ? 'Show still (reduced motion)' : 'Show movement'}</button>
          <button class="btn sm" data-act="pvTheme">Theme: ${P.theme === 'system' ? 'match device' : P.theme}</button></div>
        <p class="tiny muted">Each caretaker repeats a calm cycle: garden 10 s, bonsai 12 s, farm 9 s. Leaves, stems and foliage move on their own.</p></section></main>`;
    const r = $('#pvStage'); if (r) r.addEventListener('input', () => { P.stage = Number(r.value); render(); });
  };
  SH.onPick = (grp, v) => { if (grp === 'pvKind') { P.kind = v; render(); } };
  A.pvReplay = () => { WEL = { stage: 'closed' }; render(); };
  A.pvMotion = () => { P.motion = !P.motion; render(); };
  A.pvTheme = () => { P.theme = { system: 'light', light: 'dark', dark: 'system' }[P.theme]; if (P.theme === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', P.theme); render(); };
  const _letter = renderLetterPage; renderLetterPage = (l) => { const h = letterHtml(l, false); WEL.unfold = false; return h; };
  WEL = { stage: 'closed' };
  document.addEventListener('click', onClick);
  render();
})();
