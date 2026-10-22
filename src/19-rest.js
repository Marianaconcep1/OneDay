/* ---------- Rest Mode: what the app becomes while everything is paused ----------
   Only a pause of everything opens it; a pause of selected areas leaves the app as it is.
   It replaces the regular views (not an overlay) and stays until you choose to return,
   even after the planned end. Quotations come from src/rest-quotes.json; only approved,
   verified entries are built in, and none are ever generated. */
const REST_QUOTES = __REST_QUOTES__;
const RC = {
  en: { eyebrow: 'Rest mode', menu: 'Menu', ready: 'I’m ready to return', planned: 'Planned return: {0}', calm: 'There’s no need to hurry.',
    arrived: 'Your planned return date has arrived. There’s no rush; Rest Mode stays on until you choose to return.',
    source: 'View source', original: 'Original wording', published: 'Translation: {0}', byApp: 'translation by One Day',
    from: { la: 'Translated from Latin', en: 'Translated from English' },
    menuTitle: 'While you rest', menuSub: 'Your regular app is paused. These stay within reach.',
    lang: 'Language', look: 'Accessibility and appearance', lookSub: 'Text size, motion, theme and contrast',
    dates: 'Pause dates', datesSub: 'Extend the break or change when it ends. To come back early, use “I’m ready to return”.',
    note: 'One note when my planned return arrives',
    noteSub: 'Shown once, inside the app, the first time you open it on or after your planned return. It’s cancelled if you return earlier. Email, text and phone notifications aren’t available in this version.',
    privacy: 'Privacy and your data', privacySub: 'Backup, PIN lock and deleting your data',
    lock: 'Lock the app', account: 'There’s no online account, so there’s nothing to sign out of. A PIN lock keeps the app private on this device.',
    scene: 'Your {0} at its current stage, {1}, with a caretaker {2}. Decorative only; it adds no growth.',
    acts: { garden: 'watering the plants', farm: 'tending the crops', bonsai: 'sitting quietly beside it' },
    kinds: { garden: 'garden', farm: 'farm', bonsai: 'bonsai' },
    back: 'Welcome back. Let’s start with today.', adjust: 'Adjust today’s plan', dismiss: 'Dismiss' },
  es: { eyebrow: 'Modo descanso', menu: 'Menú', ready: 'Quiero volver', planned: 'Regreso previsto: {0}', calm: 'No hay prisa.',
    arrived: 'Ha llegado la fecha que planeaste para volver. No hay prisa: el modo descanso sigue activo hasta que decidas volver.',
    source: 'Ver fuente', original: 'Texto original', published: 'Traducción: {0}', byApp: 'traducción de One Day',
    from: { la: 'Traducido del latín', en: 'Traducido del inglés' },
    menuTitle: 'Mientras descansas', menuSub: 'Tu app está en pausa. Esto sigue a tu alcance.',
    lang: 'Idioma', look: 'Accesibilidad y apariencia', lookSub: 'Tamaño del texto, movimiento, tema y contraste',
    dates: 'Fechas de la pausa', datesSub: 'Alarga el descanso o cambia cuándo termina. Para volver antes, usa «Quiero volver».',
    note: 'Una nota cuando llegue mi regreso previsto',
    noteSub: 'Se muestra una sola vez, dentro de la app, la primera vez que la abras en la fecha prevista o después. Se cancela si vuelves antes. Los avisos por correo, SMS o del teléfono no están disponibles en esta versión.',
    privacy: 'Privacidad y tus datos', privacySub: 'Copia de seguridad, bloqueo con PIN y borrar tus datos',
    lock: 'Bloquear la app', account: 'No hay una cuenta en línea, así que no hay sesión que cerrar. Un PIN mantiene la app privada en este dispositivo.',
    scene: 'Tu {0} en su etapa actual, {1}, con una cuidadora {2}. Es solo decorativo; no suma crecimiento.',
    acts: { garden: 'regando las plantas', farm: 'cuidando los cultivos', bonsai: 'sentada en calma a su lado' },
    kinds: { garden: 'jardín', farm: 'granja', bonsai: 'bonsái' },
    back: 'Hola de nuevo. Empecemos por hoy.', adjust: 'Ajustar el plan de hoy', dismiss: 'Cerrar' },
  it: { eyebrow: 'Modalità riposo', menu: 'Menu', ready: 'Voglio tornare', planned: 'Rientro previsto: {0}', calm: 'Non c’è fretta.',
    arrived: 'È arrivata la data di rientro che avevi previsto. Non c’è fretta: la modalità riposo resta attiva finché non decidi di tornare.',
    source: 'Vedi la fonte', original: 'Testo originale', published: 'Traduzione: {0}', byApp: 'traduzione di One Day',
    from: { la: 'Tradotto dal latino', en: 'Tradotto dall’inglese' },
    menuTitle: 'Mentre riposi', menuSub: 'L’app è in pausa. Queste cose restano a portata di mano.',
    lang: 'Lingua', look: 'Accessibilità e aspetto', lookSub: 'Dimensione del testo, movimento, tema e contrasto',
    dates: 'Date della pausa', datesSub: 'Allunga la pausa o cambia quando finisce. Per tornare prima, usa «Voglio tornare».',
    note: 'Una nota quando arriva il rientro previsto',
    noteSub: 'Appare una sola volta, nell’app, la prima volta che la apri nella data prevista o dopo. Viene annullata se torni prima. Le notifiche via email, SMS o telefono non sono disponibili in questa versione.',
    privacy: 'Privacy e dati', privacySub: 'Backup, blocco con PIN ed eliminazione dei dati',
    lock: 'Blocca l’app', account: 'Non c’è un account online, quindi non c’è nulla da cui uscire. Un PIN tiene l’app privata su questo dispositivo.',
    scene: 'Il tuo {0} nella fase attuale, {1}, con una giardiniera {2}. È solo decorativo; non aggiunge crescita.',
    acts: { garden: 'che annaffia le piante', farm: 'che cura i raccolti', bonsai: 'seduta in silenzio accanto' },
    kinds: { garden: 'giardino', farm: 'podere', bonsai: 'bonsai' },
    back: 'Che bello rivederti. Cominciamo da oggi.', adjust: 'Modifica il piano di oggi', dismiss: 'Chiudi' },
  fr: { eyebrow: 'Mode repos', menu: 'Menu', ready: 'Je veux revenir', planned: 'Retour prévu : {0}', calm: 'Rien ne presse.',
    arrived: 'La date de retour que tu avais prévue est arrivée. Rien ne presse : le mode repos reste actif jusqu’à ce que tu décides de revenir.',
    source: 'Voir la source', original: 'Texte original', published: 'Traduction : {0}', byApp: 'traduction de One Day',
    from: { la: 'Traduit du latin', en: 'Traduit de l’anglais' },
    menuTitle: 'Pendant ton repos', menuSub: 'L’app est en pause. Ces réglages restent à portée de main.',
    lang: 'Langue', look: 'Accessibilité et apparence', lookSub: 'Taille du texte, mouvement, thème et contraste',
    dates: 'Dates de la pause', datesSub: 'Prolonge la pause ou change sa fin. Pour revenir plus tôt, utilise « Je veux revenir ».',
    note: 'Une note quand arrive mon retour prévu',
    noteSub: 'Affichée une seule fois, dans l’app, la première fois que tu l’ouvres à la date prévue ou après. Elle est annulée si tu reviens avant. Les notifications par e-mail, SMS ou téléphone ne sont pas disponibles dans cette version.',
    privacy: 'Confidentialité et données', privacySub: 'Sauvegarde, verrou par PIN et suppression des données',
    lock: 'Verrouiller l’app', account: 'Il n’y a pas de compte en ligne, donc rien à déconnecter. Un PIN garde l’app privée sur cet appareil.',
    scene: 'Ton {0} à son stade actuel, {1}, avec une jardinière {2}. Purement décoratif ; cela n’ajoute aucune croissance.',
    acts: { garden: 'qui arrose les plantes', farm: 'qui soigne les cultures', bonsai: 'assise tranquillement à côté' },
    kinds: { garden: 'jardin', farm: 'ferme', bonsai: 'bonsaï' },
    back: 'Bon retour. Commençons par aujourd’hui.', adjust: 'Ajuster le plan du jour', dismiss: 'Fermer' }
};
const RCL = () => RC[lang()] || RC.en;
const rcf = (s, ...a) => s.replace(/\{(\d)\}/g, (m, i) => a[i]);

/* The pause that puts the whole app to rest: everything paused, started, not yet resumed */
function restPause() { const p = currentPause(); return p && p.scope === 'all' ? p : null; }

/* One quotation per local calendar day (saved timezone). Approved entries cycle in a fixed
   order, so nothing repeats until all have been shown, and a language change keeps the same one. */
function restQuote(ds) {
  const list = REST_QUOTES.filter((q) => q.status === 'approved' && q.verification && q.verification.status === 'verified').sort((a, b) => (a.id < b.id ? -1 : 1));
  if (!list.length) return null;
  const day = Math.floor(dParse(ds || today()).getTime() / 86400000);
  return list[((day % list.length) + list.length) % list.length];
}
function renderRestQuote(q) {
  if (!q) return '';
  const L = lang(); const R = RCL();
  const text = q.text[L] || q.text.en; const shownLang = q.text[L] ? L : 'en';
  const tr = (q.translations || {})[shownLang];
  const author = (q.authorL && (q.authorL[L] || q.authorL.en)) || q.author;
  let label = '';
  if (tr && tr.type === 'published') label = `<span>${esc(rcf(R.published, tr.name))}</span>`;
  else if (shownLang !== q.lang) label = `<span>${esc((R.from[q.lang] || RC.en.from[q.lang] || '') + ' · ' + R.byApp)}</span>`;
  const orig = shownLang !== q.lang && (tr ? tr.type === 'app' : true)
    ? `<details class="rq-orig"><summary>${esc(R.original)}</summary><p lang="${esc(q.lang)}">${esc(q.original || q.text[q.lang] || '').replace(/\n/g, '<br>')}</p></details>` : '';
  const link = (tr && tr.type === 'published' && tr.url) || q.source.url;
  return `<figure class="rest-quote card" id="restQuote" data-q="${esc(q.id)}">
    <blockquote lang="${esc(shownLang)}"><p>${L === 'en' ? '“' : L === 'fr' ? '«\u202f' : '«'}${esc(text).replace(/\n/g, '<br>')}${L === 'en' ? '”' : L === 'fr' ? '\u202f»' : '»'}</p></blockquote>
    <figcaption><div class="rq-author">— <span lang="${esc(q.lang === 'he' ? L : 'en')}">${esc(author)}</span></div>
      <div class="rq-meta tiny muted">${q.cite ? `<span lang="${esc(q.lang === 'la' ? 'la' : 'en')}">${esc(q.cite)}</span> · ` : ''}<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">${esc(R.source)}</a></div>
      ${label ? `<div class="rq-label tiny muted">${label}</div>` : ''}${orig}</figcaption></figure>`;
}

/* The caretaker: a small figure drawn over the environment. Movement is SVG animation,
   left out entirely when motion is reduced or the companion's gentle movement is off. */
function drawCaretaker(kind, moving) {
  const anim = (vals, dur, extra) => moving ? `<animateTransform attributeName="transform" type="rotate" values="${vals}" dur="${dur}" repeatCount="indefinite" ${extra || ''}/>` : '';
  const person = (armTool) => `<rect x="-5" y="-12" width="4" height="12" rx="2" fill="var(--ct-pants)"/><rect x="1" y="-12" width="4" height="12" rx="2" fill="var(--ct-pants)"/>
    <path d="M-7 -10 Q -8 -24 0 -25 Q 8 -24 7 -10 Z" fill="var(--ct-cloth)"/><circle cx="0" cy="-29.5" r="4.8" fill="var(--ct-skin)"/>
    <ellipse cx="0" cy="-33" rx="8.5" ry="2" fill="var(--ct-hat)"/><path d="M-4.6 -33 Q 0 -40 4.6 -33 Z" fill="var(--ct-hat)"/>${armTool}`;
  let fig;
  if (kind === 'bonsai') {
    const steam = moving ? '<animate attributeName="opacity" values="0;.8;0" dur="5s" repeatCount="indefinite"/>' : '';
    fig = `<g transform="translate(13 101) scale(.62)">
      <rect x="-6" y="-5" width="16" height="5" rx="2.5" fill="var(--ct-pants)"/>
      <g>${moving ? '<animateTransform attributeName="transform" type="translate" values="0 0;0 -0.6;0 0" dur="6s" repeatCount="indefinite"/>' : ''}
        <path d="M-7 -4 Q -8 -19 0 -20 Q 8 -19 7 -4 Z" fill="var(--ct-cloth)"/><circle cx="0" cy="-24.5" r="4.8" fill="var(--ct-skin)"/>
        <ellipse cx="0" cy="-28" rx="8.5" ry="2" fill="var(--ct-hat)"/><path d="M-4.6 -28 Q 0 -35 4.6 -28 Z" fill="var(--ct-hat)"/>
        <path d="M4 -15 Q 9 -12 11 -9" stroke="var(--ct-skin)" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>
      <rect x="10" y="-11" width="5" height="5" rx="1" fill="var(--ct-tool)"/>
      <path d="M12.5 -13 q -1.5 -2.5 0 -5 q 1.5 -2.5 0 -5" stroke="var(--muted)" stroke-width=".8" fill="none" opacity="${moving ? 0 : .6}">${steam}</path></g>`;
  } else if (kind === 'farm') {
    fig = `<g transform="translate(18 113) scale(.6)">${person(`<g>${anim('-4 4 -22;7 4 -22;-4 4 -22', '7s')}
      <path d="M4 -22 L 9 -14" stroke="var(--ct-skin)" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M6 -24 L 17 0" stroke="var(--g-trunk)" stroke-width="1.8" stroke-linecap="round"/><path d="M14.5 0.5 h 6" stroke="var(--ct-tool)" stroke-width="2.4" stroke-linecap="round"/></g>`)}</g>`;
  } else {
    const drop = (x, y, b) => `<circle cx="${x}" cy="${y}" r="1.1" fill="var(--ct-water)" opacity="${moving ? 0 : .8}">${moving ? `<animate attributeName="opacity" values="0;.9;0" dur="2.6s" begin="${b}s" repeatCount="indefinite"/>` : ''}</circle>`;
    fig = `<g transform="translate(16 113) scale(.6)">${person(`<g>${anim('-3 4 -22;9 4 -22;9 4 -22;-3 4 -22', '8s')}
      <path d="M4 -22 L 11 -16" stroke="var(--ct-skin)" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="10" y="-20" width="9" height="7" rx="1.8" fill="var(--ct-tool)"/><path d="M19 -18 L 25 -22" stroke="var(--ct-tool)" stroke-width="1.6" stroke-linecap="round"/>
      ${drop(25.5, -19, 0)}${drop(26.2, -15, .6)}${drop(25.8, -11, 1.2)}</g>`)}</g>`;
  }
  return `<svg class="caretaker" viewBox="0 0 120 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${fig}</svg>`;
}

function renderRest() {
  const p = restPause(); const R = RCL(); const L = lang();
  const c = companionState(); const kind = c.ch.kind;
  const moving = S.growth.animations !== false && !reducedMotion();
  const ended = pauseState(p) === 'ended';
  let note = '';
  if (ended && p.returnNote && !p.returnNoteCancelled) {
    if (!p.returnNoteShownOn) { p.returnNoteShownOn = today(); save(); }
    if (p.returnNoteShownOn === today()) note = `<p class="rest-note small" role="status">${esc(R.arrived)}</p>`;
  }
  const endDate = dFmt(p.end.slice(0, 10), { weekday: 'long', month: 'long', day: 'numeric' });
  const stageName = trText(STAGE_NAMES[kind][c.stage]);
  return `<main class="wrap rest" id="main" data-raw lang="${L}">
    <header class="rest-top"><span class="eyebrow">${esc(R.eyebrow)}</span>
      <button class="btn ghost sm" data-act="restMenu" aria-haspopup="dialog">${esc(R.menu)}</button></header>
    ${renderRestQuote(restQuote(today()))}
    <figure class="rest-scene ${moving ? 'anim' : ''}" role="img" aria-label="${esc(rcf(R.scene, R.kinds[kind], stageName, R.acts[kind]))}">
      ${drawCompanion(kind, c.stage, c.ch.seed, false).replace('<svg ', '<svg preserveAspectRatio="xMidYMax slice" ')}${drawCaretaker(kind, moving)}</figure>
    ${note}
    <div class="rest-foot"><p class="tiny muted">${esc(rcf(R.planned, endDate))}. ${esc(R.calm)}</p>
      <button class="btn rest-return" data-act="restReturn">${esc(R.ready)}</button></div></main>`;
}

/* Essential controls, kept in one small menu while the rest of the app is paused */
A.restMenu = () => {
  SH.onPick = null;
  openSheet(() => {
    const R = RCL(); const p = restPause(); if (!p) return '';
    return `${sheetHead(esc(R.menuTitle), esc(R.menuSub))}<div class="stack" data-raw>
      <div class="row-between"><span>${esc(R.lang)}</span>${langSwitch('restLang', lang())}</div>
      <button class="btn rest-item" data-act="restLook"><b>${esc(R.look)}</b><span class="tiny muted">${esc(R.lookSub)}</span></button>
      <button class="btn rest-item" data-act="pauseForm" data-id="${p.id}"><b>${esc(R.dates)}</b><span class="tiny muted">${esc(R.datesSub)}</span></button>
      <label class="rest-check"><input type="checkbox" id="restNote" data-act="restNote" ${p.returnNote ? 'checked' : ''} ><span><b class="small">${esc(R.note)}</b><br><span class="tiny muted">${esc(R.noteSub)}</span></span></label>
      <button class="btn rest-item" data-act="restPrivacy"><b>${esc(R.privacy)}</b><span class="tiny muted">${esc(R.privacySub)}</span></button>
      ${AUTH && AUTH.hash ? `<button class="btn sm" data-act="lockNowBtn">${esc(R.lock)}</button>` : ''}
      <p class="tiny muted">${esc(R.account)}</p></div>`;
  });
};
A.restLook = () => { closeSheet(true); A.lookOpen(); };
A.restNote = (el) => { setTimeout(() => { const p = restPause(); if (!p) return; p.returnNote = el.checked; if (el.checked) delete p.returnNoteShownOn; save(); }, 0); };
A.restPrivacy = () => {
  closeSheet(true);
  openSheet(() => `${sheetHead(esc(RCL().privacy))}<div class="stack">
    <div class="small stack-s"><p>Your records stay on this device, in this browser. They don’t sync to other devices. There is no online account, no tracking, no analytics and no bank connection.</p>
      <p>The PIN lock keeps the app private from casual viewing. It doesn’t encrypt the stored records; anyone with full access to this phone’s browser data could still read them.</p></div>
    <div class="btn-row"><button class="btn primary sm" data-act="exportJson">Back up (JSON)</button></div>
    <div class="stack-s"><div class="h3">PIN lock</div>${renderSecurity()}</div>
    ${DEMO ? '' : `<div class="stack-s"><div class="h3">${t('set.delete')}</div><p class="small">Deletes every record, goal, pause, companion growth, your PIN and your background photo from this device. It can’t be undone. Export a backup first if you might want it.</p>
      <label class="f">Type DELETE to confirm<input class="inp" id="delConfirm" autocomplete="off" autocapitalize="characters"></label>
      <button class="btn ghost danger" data-act="eraseAll">Delete everything</button></div>`}</div>`);
};
document.addEventListener('change', (e) => {
  if (e.target.id !== 'restLang' || !SETUP[e.target.value]) return;
  S.settings.language = e.target.value; S.settings.languageChosen = true; applyLangAttr(); save(); refreshSheet(); render();
  const sw = $('#restLang'); if (sw) sw.focus();
});

/* Return: end the pause now, cancel the pending note, open Today. Nothing is owed. */
A.restReturn = () => {
  const p = restPause(); if (!p) { render(); return; }
  const now = localNow(p.tz);
  if (now < p.end) { p.end = now; p.endedEarly = true; if (p.returnNote && !p.returnNoteShownOn) p.returnNoteCancelled = true; }
  p.resumedOn = today(); p.resumedAt = nowISO();
  S.dismissed.restBack = today(); save();
  TAB = 'today'; render(); window.scrollTo(0, 0);
  const b = $('#restBack'); if (b) { b.setAttribute('tabindex', '-1'); b.focus({ preventScroll: true }); }
};
function renderRestBack(td) {
  if (S.dismissed.restBack !== td) return '';
  const R = RCL();
  return `<section class="banner pink stack-s" id="restBack" data-raw><div class="row-between"><div class="h3">${esc(R.back)}</div>
    <button class="btn ghost sm" data-act="restBackClose" aria-label="${esc(R.dismiss)}">✕</button></div>
    <div><button class="btn sm" data-act="restAdjust">${esc(R.adjust)}</button></div></section>`;
}
A.restBackClose = () => { S.dismissed.restBack = null; save(); render(); };
A.restAdjust = () => { S.dismissed.restBack = null; save(); render(); A.makeSmaller(); };

/* Bookmarkable views: #today, #plan, #progress, #mindset, #settings.
   While resting, every address shows Rest Mode and reads #rest. */
const VIEWS = ['today', 'plan', 'progress', 'mindset', 'settings'];
(function () { const h = location.hash.slice(1); if (VIEWS.includes(h)) TAB = h; })();
function syncHash(rest) {
  const want = '#' + (rest ? 'rest' : TAB);
  if (location.hash !== want) { try { history.replaceState(null, '', want); } catch (e) { } }
}
window.addEventListener('hashchange', () => {
  const h = location.hash.slice(1);
  if (VIEWS.includes(h) && !restPause()) { TAB = h; closeSheet(true); render(); }
  else render();
});
let restWas = null;
/* Pauses start and end at a set time: switch views when that moment passes */
function restCheck() { const r = !!(S && S.settings.onboarded && restPause()); if (restWas !== null && r !== restWas && !$('.sheet') && !LOCKED) render(); restWas = r; }
setInterval(restCheck, 30000);
