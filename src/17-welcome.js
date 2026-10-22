/* ---------- Welcome: a letter from the founder, then a short profile setup ---------- */
const LETTER = {
  en: {
    paras: [
      'You know that life you keep saying you’ll build “one day”? I wanted to give it somewhere to start.',
      'I created One Day because I have big dreams, and sometimes, thinking about everything it takes to reach them makes me want to take a nap.',
      'Maybe you know the feeling. You’re excited about what’s possible, but between work, responsibilities, and being a person, your dreams keep getting pushed to “when things settle down.”',
      'Or maybe you’re already going after what you want, making moves, keeping promises to yourself, and setting your sights higher. One Day gives you a place to focus that energy, see how far you’ve come, and actually celebrate before rushing toward the next goal. Even the most driven people deserve to enjoy what they’re building.',
      'For me, it started with a smaller question: What can I do today?',
      'One workout. A little money set aside. Twenty minutes on an idea I believe in. Something small enough to begin and meaningful enough to count.',
      'That’s the heart of One Day: giving your dreams a place in your actual day.',
      'And honestly? I wanted it to feel good, too. Watch your garden grow. Celebrate the task you almost talked yourself out of. Look back and see the little promises you’ve kept to yourself. There should be some joy in becoming the person you want to be.',
      'You’ll have busy days, messy days, and days when you surprise yourself. There’s room for all of them here.',
      'Your dreams deserve a beginning. Your effort deserves a little celebration.',
      'Come celebrate the small wins with One Day. I’ll be growing right alongside you.'
    ],
    closing: 'With love,', role: 'CEO of One Day', ready: 'Ready to begin?', go: 'Let’s begin', other: 'Leer en español', title: 'A letter from Mariana'
  },
  es: {
    paras: [
      '¿Sabes esa vida que siempre dices que vas a construir “algún día”? Quería darle un lugar donde comenzar.',
      'Creé One Day porque tengo grandes sueños y, a veces, pensar en todo lo que hace falta para alcanzarlos me da ganas de tomar una siesta.',
      'Quizás conoces esa sensación. Te emociona todo lo que podrías lograr, pero entre el trabajo, las responsabilidades y las cosas de la vida, tus sueños se van quedando para “cuando todo se calme un poco”.',
      'O quizás ya estás trabajando por lo que quieres, tomando acción, cumpliendo las promesas que te haces y aspirando a más. One Day te ofrece un espacio para enfocar esa energía, reconocer cuánto has avanzado y celebrar antes de correr hacia la próxima meta. Hasta las personas más decididas merecen disfrutar lo que están construyendo.',
      'Para mí, todo comenzó con una pregunta más sencilla: ¿Qué puedo hacer hoy?',
      'Una sesión de ejercicio. Un poco de dinero ahorrado. Veinte minutos dedicados a una idea en la que creo. Algo lo suficientemente pequeño como para empezar y lo suficientemente importante como para contar.',
      'Esa es la esencia de One Day: darles a tus sueños un espacio en tu día a día.',
      'Y, sinceramente, también quería que se sintiera bonito. Ver crecer tu jardín. Celebrar esa tarea que casi dejaste para después. Mirar atrás y reconocer las pequeñas promesas que te has cumplido. También debe haber alegría en convertirte en la persona que quieres ser.',
      'Tendrás días ocupados, días complicados y días en los que te sorprenderás. Aquí hay espacio para todos ellos.',
      'Tus sueños merecen un comienzo. Tu esfuerzo merece una pequeña celebración.',
      'Ven a celebrar tus pequeños logros con One Day. Yo también estaré creciendo contigo.'
    ],
    closing: 'Con cariño,', role: 'CEO de One Day', ready: '¿Comenzamos?', go: 'Vamos a comenzar', other: 'Read in English', title: 'Una carta de Mariana'
  }
};
/* Profile setup copy, in all four app languages */
const SETUP = {
  en: { title: 'Let’s make this yours.', name: 'What should we call you?', namePh: 'Your name', nameErr: 'Please tell us what to call you.', tz: 'Timezone', tzSearch: 'Search city or region', tzLater: 'You can change this later in Settings.', lang: 'App language', cont: 'Continue', demo: 'Look around with sample data first', local: 'Everything stays on this device.', noMatch: 'No timezone matches that search.', current: 'Selected' },
  es: { title: 'Hagamos este espacio tuyo.', name: '¿Cómo te llamamos?', namePh: 'Tu nombre', nameErr: 'Dinos cómo quieres que te llamemos.', tz: 'Zona horaria', tzSearch: 'Busca ciudad o región', tzLater: 'Puedes cambiarla luego en Ajustes.', lang: 'Idioma de la app', cont: 'Continuar', demo: 'Explorar primero con datos de ejemplo', local: 'Todo se queda en este dispositivo.', noMatch: 'Ninguna zona horaria coincide.', current: 'Seleccionada' },
  it: { title: 'Rendiamo questo spazio tuo.', name: 'Come vuoi che ti chiamiamo?', namePh: 'Il tuo nome', nameErr: 'Dicci come vuoi essere chiamata.', tz: 'Fuso orario', tzSearch: 'Cerca città o regione', tzLater: 'Puoi cambiarlo più tardi nelle Impostazioni.', lang: 'Lingua dell’app', cont: 'Continua', demo: 'Prima dai un’occhiata con dati di esempio', local: 'Tutto resta su questo dispositivo.', noMatch: 'Nessun fuso orario corrisponde.', current: 'Selezionato' },
  fr: { title: 'Faisons de cet espace le tien.', name: 'Comment veux-tu qu’on t’appelle ?', namePh: 'Ton prénom', nameErr: 'Dis-nous comment t’appeler.', tz: 'Fuseau horaire', tzSearch: 'Cherche une ville ou une région', tzLater: 'Tu pourras le changer plus tard dans Réglages.', lang: 'Langue de l’app', cont: 'Continuer', demo: 'D’abord explorer avec des données d’exemple', local: 'Tout reste sur cet appareil.', noMatch: 'Aucun fuseau ne correspond.', current: 'Sélectionné' }
};
const APP_LANGS = [['en', 'English'], ['es', 'Español'], ['it', 'Italiano'], ['fr', 'Français']];
let WEL = { stage: 'closed' };
let SETUP_DRAFT = null;

/* All IANA zones the browser supports, each with a readable place and its current offset */
let TZ_ALL = null;
function tzOffset(z) {
  try { const p = new Intl.DateTimeFormat('en-US', { timeZone: z, timeZoneName: 'shortOffset' }).formatToParts(nowMs()).find((x) => x.type === 'timeZoneName'); const v = p ? p.value.replace('GMT', '') : ''; return 'UTC' + (v ? v.replace('-', '−') : '±0'); } catch (e) { return ''; }
}
function tzLong(z) { try { const p = new Intl.DateTimeFormat(locale(), { timeZone: z, timeZoneName: 'long' }).formatToParts(nowMs()).find((x) => x.type === 'timeZoneName'); return p ? p.value : ''; } catch (e) { return ''; } }
function tzLabel(z) {
  if (z === 'America/Puerto_Rico') return 'Puerto Rico — Atlantic Standard Time';
  const parts = z.split('/'); const city = parts[parts.length - 1].replace(/_/g, ' '); const region = parts.slice(0, -1).join(' / ').replace(/_/g, ' ');
  return region ? `${city}, ${region}` : city;
}
function tzAll() {
  if (TZ_ALL) return TZ_ALL;
  let zones = [];
  try { zones = Intl.supportedValuesOf('timeZone'); } catch (e) { zones = TZ_LIST.slice(); }
  if (!zones.includes('America/Puerto_Rico')) zones.unshift('America/Puerto_Rico');
  if (!zones.includes('UTC')) zones.push('UTC');
  TZ_ALL = zones.map((z) => ({ z, label: tzLabel(z), off: tzOffset(z) }));
  return TZ_ALL;
}
function tzMatches(q) {
  const n = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[_/]/g, ' ');
  const qq = n(q || '').trim();
  const all = tzAll();
  const hits = qq ? all.filter((x) => n(x.z + ' ' + x.label + ' ' + x.off).includes(qq)) : all;
  return hits.slice(0, 80);
}
/* Searchable timezone picker: a search box over a listbox of buttons */
function tzPicker(id, selected, L) {
  return `<div class="tzpick" id="${id}">
    <div class="tz-current small"><span class="muted">${esc(L.current)}:</span> <b id="${id}Cur">${esc(tzLabel(selected))}</b> <span class="muted num">${esc(tzOffset(selected))}</span></div>
    <input class="inp" id="${id}Q" type="search" placeholder="${esc(L.tzSearch)}" aria-label="${esc(L.tzSearch)}" aria-controls="${id}List" autocomplete="off" spellcheck="false">
    <div class="tz-list" id="${id}List" role="listbox" aria-label="${esc(L.tz)}">${tzListHtml(id, '', selected, L)}</div></div>`;
}
function tzListHtml(id, q, selected, L) {
  let m = tzMatches(q);
  if (!(q || '').trim()) { const sel = m.find((x) => x.z === selected) || tzAll().find((x) => x.z === selected); m = (sel ? [sel] : []).concat(m.filter((x) => x.z !== selected)); }
  if (!m.length) return `<p class="small muted" style="padding:8px">${esc(L.noMatch)}</p>`;
  return m.map((x) => `<button type="button" role="option" class="tz-opt" data-act="tzPick" data-picker="${id}" data-z="${esc(x.z)}" aria-selected="${x.z === selected}"><span>${esc(x.label)}</span><span class="muted num">${esc(x.off)}</span></button>`).join('');
}
function bindTzPicker(id, getSel, L) {
  const q = document.getElementById(id + 'Q'); if (!q) return;
  q.addEventListener('input', () => { document.getElementById(id + 'List').innerHTML = tzListHtml(id, q.value, getSel(), L); });
}
A.tzPick = (el) => {
  const id = el.dataset.picker; const z = el.dataset.z;
  if (id === 'suTz') SETUP_DRAFT.tz = z; else SH.tzSel = z;
  $$(`#${id}List .tz-opt`).forEach((b) => b.setAttribute('aria-selected', b.dataset.z === z ? 'true' : 'false'));
  const c = document.getElementById(id + 'Cur'); if (c) { c.textContent = tzLabel(z); c.nextElementSibling.textContent = tzOffset(z); }
};

/* ----- Screen 1: the envelope ----- */
const SEAL = '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><radialGradient id="sealG" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#B0566E"/><stop offset="1" stop-color="#7A2E45"/></radialGradient></defs><path d="M32 3c5 2 8 0 12 3s4 7 8 9 3 7 5 11-1 8 0 12-4 6-5 10-6 4-9 7-8 2-11 4-8-1-12-2-6-4-10-6-3-7-6-10-1-8-2-12 3-7 3-11 5-6 8-9 7-3 11-5 6 0 8-1z" fill="url(#sealG)"/><circle cx="32" cy="32" r="18" fill="none" stroke="#E9B7C6" stroke-opacity=".55" stroke-width="1.5"/><path d="M32 45V24" stroke="#F4D6DF" stroke-width="1.8" stroke-linecap="round"/><path d="M32 30c-5-1-8-5-8-9 5 0 8 4 8 9zM32 34c5-1 8-5 8-9-5 0-8 4-8 9zM32 39c-4 0-7-3-7-6 4 0 7 3 7 6z" fill="#F4D6DF" fill-opacity=".9"/></svg>';
function renderEnvelope(opening) {
  return `<div class="env-wrap ${opening ? 'opening' : ''}">
    <button class="envelope" data-act="welOpen" aria-label="A little letter for you. Una cartita para ti. Tap to open, toca para abrir." ${opening || WEL.stage === 'lang' ? 'aria-expanded="true"' : 'aria-expanded="false"'}>
      <span class="env-letter" aria-hidden="true"></span>
      <span class="env-body" aria-hidden="true"></span>
      <span class="env-flap" aria-hidden="true"></span>
      <span class="env-text" aria-hidden="true"><span class="env-en">A little letter for you.</span><span class="env-es">Una cartita para ti.</span></span>
      <span class="env-seal" aria-hidden="true">${SEAL}</span>
    </button>
    ${opening ? '' : '<p class="env-hint">Tap to open · Toca para abrir</p>'}</div>`;
}
function renderWelcome() {
  if (WEL.stage === 'letter') return renderLetterPage(WEL.lang, false);
  let h = `<main class="wrap welcome" aria-label="Welcome">${renderEnvelope(WEL.stage === 'opening')}`;
  if (WEL.stage === 'lang') h += `<section class="wel-lang stack" role="dialog" aria-labelledby="welLangQ"><div id="welLangQ" class="wel-q"><span>How would you like to read your letter?</span><span lang="es">¿En qué idioma quieres leer tu carta?</span></div>
    <div class="btn-row wel-langs"><button class="btn primary" data-act="welLang" data-l="en" lang="en" autofocus>English</button><button class="btn primary" data-act="welLang" data-l="es" lang="es">Español</button></div></section>`;
  return h + '</main>';
}
A.welOpen = () => { if (WEL.stage !== 'closed') return; WEL.stage = 'lang'; render(); const b = $('[data-act="welLang"]'); if (b) b.focus(); };
A.welLang = (el) => {
  const l = el.dataset.l; WEL.lang = l; S.settings.letterLang = l; save();
  if (reducedMotion()) { WEL.stage = 'letter'; render(); window.scrollTo(0, 0); focusLetter(); return; }
  WEL.stage = 'opening'; render();
  setTimeout(() => { if (WEL.stage !== 'opening') return; WEL.stage = 'letter'; WEL.unfold = true; render(); window.scrollTo(0, 0); focusLetter(); }, 1500);
};
function focusLetter() { const p = $('.letter-page'); if (p) p.focus({ preventScroll: true }); }

/* ----- The letter itself (also reachable from Settings) ----- */
function letterHtml(lang, fromSettings) {
  const L = LETTER[lang] || LETTER.en;
  return `<article class="letter-page ${WEL.unfold && !fromSettings ? 'unfold' : ''}" tabindex="-1" lang="${lang}" aria-label="${esc(L.title)}">
    <div class="letter-top"><button class="letter-switch" data-act="letterLang" data-l="${lang === 'en' ? 'es' : 'en'}" data-from="${fromSettings ? 1 : ''}" lang="${lang === 'en' ? 'es' : 'en'}">${esc(L.other)}</button></div>
    ${L.paras.map((p) => `<p>${esc(p)}</p>`).join('')}
    <p class="letter-closing">${esc(L.closing)}</p>
    <p class="letter-sign" aria-label="Mariana">Mariana</p>
    <p class="letter-role">${esc(L.role)}</p>
    ${fromSettings ? '' : `<div class="letter-invite"><p>${esc(L.ready)}</p><button class="btn primary" data-act="welBegin">${esc(L.go)}</button></div>`}
  </article>`;
}
function renderLetterPage(lang) { const h = `<main class="wrap welcome letter-wrap">${letterHtml(lang, false)}</main>`; WEL.unfold = false; return h; }
A.letterLang = (el) => {
  const l = el.dataset.l;
  if (el.dataset.from) { SH.letterLang = l; refreshSheet(); return; }
  WEL.lang = l; S.settings.letterLang = l; save(); render(); focusLetter();
};
A.welBegin = () => {
  S.settings.welcomeDone = true;
  if (!S.settings.languageChosen) S.settings.language = WEL.lang || S.settings.letterLang || 'en';
  S.settings.onbStep = 1; ONB.step = 1; save(); render(); window.scrollTo(0, 0);
  const n = $('#suName'); if (n) n.focus();
};
A.openLetter = () => {
  SH.letterLang = S.settings.language === 'es' ? 'es' : (S.settings.letterLang || 'en');
  openSheet(() => `${sheetHead(esc(t('set.letter')))}<div class="letter-sheet">${letterHtml(SH.letterLang, true)}</div>`, { full: true });
};

/* ----- Screen 2: profile setup ----- */
function renderProfileSetup() {
  const s = S.settings;
  if (!SETUP_DRAFT) SETUP_DRAFT = { name: s.name || '', tz: s.timezone || 'America/Puerto_Rico', lang: s.language || s.letterLang || 'en', err: false };
  const D = SETUP_DRAFT; const L = SETUP[D.lang] || SETUP.en;
  return `<main class="wrap" lang="${D.lang}"><div class="onb stack setup">
    <div class="brand">${esc(L.title)}</div>
    <label class="f" for="suName">${esc(L.name)}
      <input class="inp ${D.err ? 'invalid' : ''}" id="suName" maxlength="60" autocomplete="given-name" placeholder="${esc(L.namePh)}" value="${esc(D.name)}" aria-required="true" aria-invalid="${D.err}" aria-describedby="suNameErr"></label>
    <div id="suNameErr" class="field-err" role="alert">${D.err ? esc(L.nameErr) : ''}</div>
    <div class="f"><span id="suTzLab">${esc(L.tz)}</span>${tzPicker('suTz', D.tz, L)}<span class="hint">${esc(L.tzLater)}</span></div>
    <div class="f"><span>${esc(L.lang)}</span>${seg('suLang', APP_LANGS, D.lang)}</div>
    <button class="btn primary" data-act="setupSave">${esc(L.cont)}</button>
    <button class="btn ghost sm" data-act="enterDemo">${esc(L.demo)}</button>
    <p class="tiny muted">${esc(L.local)}</p></div></main>`;
}
function setupCapture() { const n = $('#suName'); if (n) SETUP_DRAFT.name = n.value; }
function bindSetup() {
  if (!$('#suName')) return;
  $('#suName').addEventListener('input', (e) => { SETUP_DRAFT.name = e.target.value; if (SETUP_DRAFT.err && e.target.value.trim()) { SETUP_DRAFT.err = false; e.target.classList.remove('invalid'); e.target.setAttribute('aria-invalid', 'false'); $('#suNameErr').textContent = ''; } });
  bindTzPicker('suTz', () => SETUP_DRAFT.tz, SETUP[SETUP_DRAFT.lang] || SETUP.en);
  SH.onPick = (g, v) => { if (g === 'suLang' && v) { setupCapture(); const q = val('suTzQ'); SETUP_DRAFT.lang = v; render(); const qi = $('#suTzQ'); if (qi && q) { qi.value = q; qi.dispatchEvent(new Event('input')); } } };
}
A.setupSave = () => {
  setupCapture(); const D = SETUP_DRAFT;
  const name = D.name.replace(/\s+/g, ' ').trim();
  if (!name) { D.err = true; render(); const n = $('#suName'); if (n) n.focus(); return; }
  if (!validTz(D.tz)) D.tz = 'America/Puerto_Rico';
  const s = S.settings; s.name = name; s.timezone = D.tz; s.language = D.lang; s.languageChosen = true;
  SETUP_DRAFT = null; ONB.step = 2; s.onbStep = 2; save(); render(); window.scrollTo(0, 0);
};
