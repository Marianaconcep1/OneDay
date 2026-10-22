'use strict';
/* One Day — Mariana. Local-first personal accountability app.
   All data stays in this browser (IndexedDB, falling back to localStorage). */

const SCHEMA = 1;
const DB_NAME = 'oneday';
const REAL_KEY = 'state';
const DEMO_KEY = 'demo-state';
const AREAS = ['money', 'business', 'training', 'art', 'mind'];

/* ---------- Strings: keep all UI copy here so Spanish can be filled in ---------- */
const STRINGS = {
  en: {
    'tab.today': 'Today', 'tab.plan': 'Plan', 'tab.progress': 'Progress', 'tab.mindset': 'Mindset', 'tab.settings': 'Settings',
    'area.money': 'Money', 'area.business': 'Business', 'area.training': 'Training', 'area.art': 'Art', 'area.mind': 'Mind',
    'btn.start': 'Start', 'btn.log': 'Log', 'btn.smaller': 'Make today smaller', 'btn.save': 'Save', 'btn.cancel': 'Cancel',
    'btn.next': 'Next', 'btn.back': 'Back', 'btn.done': 'Done', 'btn.edit': 'Edit', 'btn.delete': 'Delete', 'btn.close': 'Close',
    'btn.add': 'Add', 'btn.copy': 'Copy', 'checkin': 'Evening check-in', 'checkin.edit': 'Edit tonight’s check-in',
    'st.scheduled': 'Scheduled', 'st.started': 'Started', 'st.done': 'Completed as planned', 'st.modified': 'Minimum version',
    'st.skipped': 'Skipped', 'st.unscheduled': 'Not scheduled', 'st.rest': 'Rest day followed', 'st.norecord': 'Not recorded',
    'st.trainmod': 'Modified session',
    'unknown': 'Unknown', 'notset': 'Not set yet',
    'today.available': 'Today is available.',
    'today.allset': 'Everything scheduled today has a record.',
    'today.next': 'Next action',
    'calib': 'We’re finding a routine that fits your actual life.',
    'welcome.back': 'Welcome back. Start with today.',
    'tagline': 'Small enough to start. Clear enough to finish.',
    'spend.title': 'Record today’s spending',
    'spend.none': 'No spending today',
    'mind.part': 'Part of your evening check-in.',
    'enough': 'Enough reflection—choose the next step',
    'estimate': 'Estimate',
    'not.advice': 'This is arithmetic on the numbers you entered, not financial advice.',
    'descriptive': 'These are descriptive counts. They don’t show what caused what.',
    'set.profile': 'Profile and security', 'set.schedule': 'Goals and schedules', 'set.notify': 'Notifications', 'set.look': 'Personalize', 'set.companion': 'Companion', 'set.pause': 'Pause', 'set.data': 'Your data', 'set.privacy': 'Privacy', 'set.delete': 'Delete my data', 'set.about': 'About', 'set.demo': 'Demo mode',
    'set.letter': 'A letter from Mariana', 'set.name': 'Name', 'set.tz': 'Timezone', 'set.lang': 'App language', 'set.partial': 'Some detailed screens are still in English while the translation is completed.',
    'ms.orig': 'Resources are shown in their original language; they haven’t been translated.', 'ci.reminder': 'It’s {time}. Check-in time.', 'ms.notice': 'A new Mindset edition is ready.'
  },
  es: {
    'tab.today': 'Hoy', 'tab.plan': 'Plan', 'tab.progress': 'Progreso', 'tab.mindset': 'Mentalidad', 'tab.settings': 'Ajustes',
    'area.money': 'Dinero', 'area.business': 'Negocio', 'area.training': 'Entrenamiento', 'area.art': 'Arte', 'area.mind': 'Mente',
    'btn.start': 'Empezar', 'btn.log': 'Registrar', 'btn.smaller': 'Hacer hoy más pequeño', 'btn.save': 'Guardar', 'btn.cancel': 'Cancelar',
    'btn.next': 'Siguiente', 'btn.back': 'Atrás', 'btn.done': 'Listo', 'btn.edit': 'Editar', 'btn.delete': 'Borrar', 'btn.close': 'Cerrar',
    'btn.add': 'Añadir', 'btn.copy': 'Copiar', 'checkin': 'Revisión de la noche', 'checkin.edit': 'Editar la revisión de hoy',
    'st.scheduled': 'Programado', 'st.started': 'Empezado', 'st.done': 'Completado según el plan', 'st.modified': 'Versión mínima',
    'st.skipped': 'Omitido', 'st.unscheduled': 'No programado', 'st.rest': 'Descanso cumplido', 'st.norecord': 'Sin registro',
    'st.trainmod': 'Sesión modificada',
    'unknown': 'Desconocido', 'notset': 'Sin definir',
    'today.available': 'Hoy está disponible.',
    'today.allset': 'Todo lo programado hoy tiene registro.',
    'today.next': 'Próxima acción',
    'calib': 'Estamos encontrando una rutina que encaje con tu vida real.',
    'welcome.back': 'Bienvenida de nuevo. Empieza por hoy.',
    'tagline': 'Lo bastante pequeño para empezar. Lo bastante claro para terminar.',
    'spend.title': 'Registrar los gastos de hoy',
    'spend.none': 'Hoy no gasté',
    'mind.part': 'Parte de tu revisión de la noche.',
    'enough': 'Basta de reflexión: elige el próximo paso',
    'estimate': 'Estimado',
    'not.advice': 'Esto es aritmética con los números que ingresaste, no asesoría financiera.',
    'descriptive': 'Son conteos descriptivos. No muestran qué causó qué.',
    'set.profile': 'Perfil y seguridad', 'set.schedule': 'Metas y horarios', 'set.notify': 'Avisos', 'set.look': 'Personalizar', 'set.companion': 'Compañero', 'set.pause': 'Pausa', 'set.data': 'Tus datos', 'set.privacy': 'Privacidad', 'set.delete': 'Borrar mis datos', 'set.about': 'Acerca de', 'set.demo': 'Modo demo',
    'set.letter': 'Una carta de Mariana', 'set.name': 'Nombre', 'set.tz': 'Zona horaria', 'set.lang': 'Idioma de la app', 'set.partial': 'Algunas pantallas detalladas siguen en inglés mientras se completa la traducción.',
    'ms.orig': 'Los recursos se muestran en su idioma original; no han sido traducidos.', 'ci.reminder': 'Son las {time}. Hora de la revisión.', 'ms.notice': 'Hay una nueva edición de Mindset.'
  },
  it: {
    'tab.today': 'Oggi', 'tab.plan': 'Piano', 'tab.progress': 'Progressi', 'tab.mindset': 'Mindset', 'tab.settings': 'Impostazioni',
    'area.money': 'Denaro', 'area.business': 'Attività', 'area.training': 'Allenamento', 'area.art': 'Arte', 'area.mind': 'Mente',
    'btn.start': 'Inizia', 'btn.log': 'Registra', 'btn.smaller': 'Rendi oggi più leggero', 'btn.save': 'Salva', 'btn.cancel': 'Annulla',
    'btn.next': 'Avanti', 'btn.back': 'Indietro', 'btn.done': 'Fatto', 'btn.edit': 'Modifica', 'btn.delete': 'Elimina', 'btn.close': 'Chiudi',
    'btn.add': 'Aggiungi', 'btn.copy': 'Copia', 'checkin': 'Check-in serale', 'checkin.edit': 'Modifica il check-in di stasera',
    'st.scheduled': 'In programma', 'st.started': 'Iniziato', 'st.done': 'Completato come previsto', 'st.modified': 'Versione minima',
    'st.skipped': 'Saltato', 'st.unscheduled': 'Non in programma', 'st.rest': 'Giorno di riposo rispettato', 'st.norecord': 'Non registrato',
    'st.trainmod': 'Sessione modificata', 'unknown': 'Sconosciuto', 'notset': 'Non ancora impostato',
    'today.available': 'Oggi è libero.', 'today.allset': 'Tutto ciò che era previsto oggi è registrato.', 'today.next': 'Prossima azione',
    'calib': 'Stiamo trovando una routine adatta alla tua vita reale.', 'welcome.back': 'Bentornata. Inizia da oggi.',
    'tagline': 'Abbastanza piccolo per iniziare. Abbastanza chiaro per finire.', 'spend.title': 'Registra le spese di oggi', 'spend.none': 'Oggi nessuna spesa',
    'mind.part': 'Fa parte del check-in serale.', 'enough': 'Basta riflettere: scegli il prossimo passo', 'estimate': 'Stima',
    'not.advice': 'Sono calcoli sui numeri che hai inserito, non consulenza finanziaria.', 'descriptive': 'Sono conteggi descrittivi. Non mostrano cause ed effetti.',
    'set.profile': 'Profilo e sicurezza', 'set.schedule': 'Obiettivi e orari', 'set.notify': 'Notifiche', 'set.look': 'Personalizza', 'set.companion': 'Compagno', 'set.pause': 'Pausa', 'set.data': 'I tuoi dati', 'set.privacy': 'Privacy', 'set.delete': 'Elimina i miei dati', 'set.about': 'Informazioni', 'set.demo': 'Modalità demo',
    'set.letter': 'Una lettera da Mariana', 'set.name': 'Nome', 'set.tz': 'Fuso orario', 'set.lang': 'Lingua dell’app', 'set.partial': 'Alcune schermate dettagliate sono ancora in inglese mentre completiamo la traduzione.',
    'ms.orig': 'Le risorse sono nella lingua originale; non sono state tradotte.', 'ci.reminder': 'Sono le {time}. È l’ora del check-in.', 'ms.notice': 'È pronta una nuova edizione di Mindset.'
  },
  fr: {
    'tab.today': 'Aujourd’hui', 'tab.plan': 'Plan', 'tab.progress': 'Progrès', 'tab.mindset': 'Mindset', 'tab.settings': 'Réglages',
    'area.money': 'Argent', 'area.business': 'Entreprise', 'area.training': 'Entraînement', 'area.art': 'Art', 'area.mind': 'Esprit',
    'btn.start': 'Commencer', 'btn.log': 'Noter', 'btn.smaller': 'Alléger la journée', 'btn.save': 'Enregistrer', 'btn.cancel': 'Annuler',
    'btn.next': 'Suivant', 'btn.back': 'Retour', 'btn.done': 'Terminé', 'btn.edit': 'Modifier', 'btn.delete': 'Supprimer', 'btn.close': 'Fermer',
    'btn.add': 'Ajouter', 'btn.copy': 'Copier', 'checkin': 'Bilan du soir', 'checkin.edit': 'Modifier le bilan de ce soir',
    'st.scheduled': 'Prévu', 'st.started': 'Commencé', 'st.done': 'Fait comme prévu', 'st.modified': 'Version minimale',
    'st.skipped': 'Sauté', 'st.unscheduled': 'Non prévu', 'st.rest': 'Jour de repos respecté', 'st.norecord': 'Non noté',
    'st.trainmod': 'Séance modifiée', 'unknown': 'Inconnu', 'notset': 'Pas encore défini',
    'today.available': 'La journée est libre.', 'today.allset': 'Tout ce qui était prévu aujourd’hui est noté.', 'today.next': 'Prochaine action',
    'calib': 'Nous cherchons une routine adaptée à ta vraie vie.', 'welcome.back': 'Bon retour. Commence par aujourd’hui.',
    'tagline': 'Assez petit pour commencer. Assez clair pour finir.', 'spend.title': 'Noter les dépenses du jour', 'spend.none': 'Aucune dépense aujourd’hui',
    'mind.part': 'Fait partie du bilan du soir.', 'enough': 'Assez réfléchi : choisis la prochaine étape', 'estimate': 'Estimation',
    'not.advice': 'Ce sont des calculs sur les chiffres que tu as saisis, pas des conseils financiers.', 'descriptive': 'Ce sont des comptes descriptifs. Ils ne montrent pas les causes.',
    'set.profile': 'Profil et sécurité', 'set.schedule': 'Objectifs et horaires', 'set.notify': 'Notifications', 'set.look': 'Personnaliser', 'set.companion': 'Compagnon', 'set.pause': 'Pause', 'set.data': 'Tes données', 'set.privacy': 'Confidentialité', 'set.delete': 'Supprimer mes données', 'set.about': 'À propos', 'set.demo': 'Mode démo',
    'set.letter': 'Une lettre de Mariana', 'set.name': 'Nom', 'set.tz': 'Fuseau horaire', 'set.lang': 'Langue de l’app', 'set.partial': 'Certains écrans détaillés sont encore en anglais pendant que la traduction se termine.',
    'ms.orig': 'Les ressources sont dans leur langue d’origine ; elles n’ont pas été traduites.', 'ci.reminder': 'Il est {time}. C’est l’heure du bilan.', 'ms.notice': 'Une nouvelle édition de Mindset est prête.'
  }
};
function t(key, vars) {
  const lang = (S && S.settings && S.settings.language) || 'en';
  let s = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}
const LOCALES = { en: 'en-US', es: 'es-PR', it: 'it-IT', fr: 'fr-FR' };
function locale() { return LOCALES[(S && S.settings && S.settings.language) || 'en'] || 'en-US'; }

/* ---------- Utilities ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const nowMs = () => (typeof window.__oneDayNow === 'number' ? window.__oneDayNow : Date.now());
const nowISO = () => new Date(nowMs()).toISOString();
const clone = (o) => JSON.parse(JSON.stringify(o));
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));

/* Money is stored as integer cents. */
function parseCents(str) {
  if (str == null) return null;
  const s = String(str).trim().replace(/[$,\s]/g, '');
  if (s === '') return null;
  if (!/^(\d+(\.\d{0,2})?|\.\d{1,2})$/.test(s)) return NaN;
  const [w, f = ''] = s.split('.');
  return parseInt(w || '0', 10) * 100 + parseInt((f + '00').slice(0, 2), 10);
}
function money(c) {
  if (c == null || Number.isNaN(c)) return t('unknown');
  const neg = c < 0; const a = Math.abs(c);
  const s = '$' + Math.floor(a / 100).toLocaleString('en-US') + '.' + String(a % 100).padStart(2, '0');
  return neg ? '−' + s : s;
}
const centsToInput = (c) => (c == null ? '' : (c / 100).toFixed(2));

/* ---------- Dates: every record is keyed by a calendar date string (YYYY-MM-DD)
   computed in the user's timezone at the moment of recording. Changing timezone
   later never rewrites stored dates. ---------- */
function tz() { return (S && S.settings && S.settings.timezone) || 'America/Puerto_Rico'; }
function validTz(z) { try { new Intl.DateTimeFormat('en-US', { timeZone: z }); return true; } catch (e) { return false; } }
function partsInTz(ms, zone) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const o = {}; for (const p of f.formatToParts(ms)) o[p.type] = p.value;
  if (o.hour === '24') o.hour = '00';
  return o;
}
function todayStr(ms) { const o = partsInTz(ms == null ? nowMs() : ms, tz()); return `${o.year}-${o.month}-${o.day}`; }
function nowHM(ms) { const o = partsInTz(ms == null ? nowMs() : ms, tz()); return `${o.hour}:${o.minute}`; }
function dParse(ds) { const [y, m, d] = ds.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d, 12)); }
function dStr(dt) { return dt.toISOString().slice(0, 10); }
function dAdd(ds, n) { const d = dParse(ds); d.setUTCDate(d.getUTCDate() + n); return dStr(d); }
function dDow(ds) { return dParse(ds).getUTCDay(); }
function dDiff(a, b) { return Math.round((dParse(b) - dParse(a)) / 86400000); }
function weekStart(ds) { return dAdd(ds, -((dDow(ds) + 6) % 7)); }
function weekDates(ws) { return [0, 1, 2, 3, 4, 5, 6].map((i) => dAdd(ws, i)); }
function dFmt(ds, opts) { return new Intl.DateTimeFormat(locale(), Object.assign({ timeZone: 'UTC' }, opts)).format(dParse(ds)); }
const dLong = (ds) => dFmt(ds, { weekday: 'long', month: 'long', day: 'numeric' });
const dShort = (ds) => dFmt(ds, { weekday: 'short', month: 'short', day: 'numeric' });
const dMD = (ds) => dFmt(ds, { month: 'short', day: 'numeric' });
const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];
const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
function minsLabel(m) { if (m == null) return '? min'; if (m < 60) return m + ' min'; const h = Math.floor(m / 60), r = m % 60; return h + ' h' + (r ? ' ' + r + ' min' : ''); }

/* ---------- Storage ---------- */
const Store = {
  db: null, mode: 'memory',
  open() {
    return new Promise((resolve) => {
      try {
        if (!window.indexedDB) return resolve(null);
        const r = indexedDB.open(DB_NAME, 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => { this.db = r.result; this.mode = 'indexeddb'; resolve(this.db); };
        r.onerror = () => resolve(null);
        r.onblocked = () => resolve(null);
      } catch (e) { resolve(null); }
    });
  },
  async get(key) {
    if (this.db) {
      try {
        return await new Promise((res, rej) => {
          const tx = this.db.transaction('kv', 'readonly');
          const q = tx.objectStore('kv').get(key);
          q.onsuccess = () => res(q.result == null ? null : q.result);
          q.onerror = () => rej(q.error);
        });
      } catch (e) { /* fall through */ }
    }
    try { const v = localStorage.getItem('oneday.' + key); if (v) { this.mode = this.db ? this.mode : 'localstorage'; return JSON.parse(v); } } catch (e) { }
    return null;
  },
  async set(key, val) {
    if (this.db) {
      try {
        await new Promise((res, rej) => {
          const tx = this.db.transaction('kv', 'readwrite');
          tx.objectStore('kv').put(val, key);
          tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error);
        });
        return true;
      } catch (e) { /* fall through */ }
    }
    try { localStorage.setItem('oneday.' + key, JSON.stringify(val)); this.mode = 'localstorage'; return true; } catch (e) { this.mode = 'memory'; return false; }
  },
  async del(key) {
    if (this.db) { try { await new Promise((res) => { const tx = this.db.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(key); tx.oncomplete = res; tx.onerror = res; }); } catch (e) { } }
    try { localStorage.removeItem('oneday.' + key); } catch (e) { }
  }
};

let S = null;           // current state (real or demo)
let DEMO = false;       // demo mode flag (kept in a separate store key)
let saveTimer = null;
let lastSaveOk = true;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 120);
}
async function flush() {
  clearTimeout(saveTimer);
  if (!S) return;
  S.updatedAt = nowISO();
  lastSaveOk = await Store.set(DEMO ? DEMO_KEY : REAL_KEY, S);
}

function defaultState() {
  return {
    schema: SCHEMA, app: 'one-day', createdAt: nowISO(), updatedAt: nowISO(),
    settings: {
      name: '', timezone: 'America/Puerto_Rico', language: 'en', welcomeDone: false, letterLang: null, languageChosen: false, onbStep: 1, workdayNote: '',
      availability: { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
      checkinTime: '21:00', focus: 'money', areasConfirmed: false, onboarded: false,
      calibrationStart: null, skipThreshold: 3, reviewDay: 0, reminders: false,
      lastOpened: null, theme: 'system',
      look: { bg: 'monet', font: 'atkinson', ink: 'default', dim: 0, blur: 0, size: 100, motion: 'device' },
      manifest: false
    },
    tasks: [],          // recurring or one-off tasks (money, art, other), versioned
    occ: {},            // task occurrences keyed `t:<taskId>@<date>` or `biz@<date>`
    exceptions: [],     // date-specific schedule exceptions {id, refId, date, kind:'off'|'on'}
    dayPlans: {},       // per-date accepted adjustments {smaller:{key:true}, accepted:[...]}
    business: {
      direction: 'Helping small businesses understand their data through dashboards, reporting, analysis, and accessible educational content.',
      who: '', problem: '', offer: '', stage: null, outcome4w: '', outcome4wSet: null,
      weekly: {},       // weekStart -> outcome text
      block: { versions: [] }, // {from, days, minutes}
      actions: [],      // queue of specific next actions
      nextFor: {},      // date -> actionId chosen in check-in
      results: []       // milestones, inquiries, clients, revenue
    },
    training: {
      profile: { raceDate: '', weeklyDistance: '', unit: 'mi', consistency: '', longestRun: '', runDays: '', strength: '', limitations: '', hasPlan: null, planSource: '' },
      templates: [],    // {id, from, days:{0..6: session|null}}
      overrides: {},    // date -> session (date-specific exception)
      logs: {}          // `tr@<date>` -> log
    },
    money: {
      accounts: [], balances: [], tx: [], spendDays: {}, bills: [], billPaid: [], incomes: [],
      buffer: { amount: null }, plans: {}, cue: ''
    },
    checkins: {},       // date -> check-in (one per date, edits replace)
    drafts: {},         // date -> unsaved check-in draft
    reviews: {},        // weekStart -> weekly review
    prep: {},           // date -> [clear-the-way steps]
    timer: null,
    dismissed: {},
    later: [],          // postponed ideas and app improvements; never scheduled, never overdue
    changes: [],        // every reduction or reschedule, next to the original commitment
    life: [],           // personal commitments, planned before optional work
    weeks: {},          // weekStart -> {main, mainOutcome, maintain}
    experiments: [],    // one weekly change, reviewed the following week
    stuck: [],          // brief “I'm stuck” and feeling notes
    returns: [],        // days you came back after missed days
    firstWeek: null,
    goals: [],          // several goals: measurable, milestones or ongoing
    pauses: [],         // planned breaks; paused days are never scheduled or counted
    mindset: { editions: [], lastSuccess: null, lastCheck: null, saved: {}, hidden: {}, interests: DEFAULT_TOPICS.slice(), notify: false, notifiedEdition: null, tryOne: {} },
    growth: { enabled: true, kind: 'bonsai', messages: true, animations: true, ledger: {}, chapters: [], offerDismissed: null }
  };
}

/* Validate an imported or loaded object enough to trust its shape. */
function validateState(o) {
  const errs = [];
  if (!o || typeof o !== 'object') return ['The file is not a JSON object.'];
  if (o.app !== 'one-day') errs.push('This file is not a One Day backup.');
  if (typeof o.schema !== 'number' || o.schema > SCHEMA) errs.push('Unknown backup version.');
  const need = { settings: 'object', tasks: 'array', occ: 'object', business: 'object', training: 'object', money: 'object', checkins: 'object' };
  for (const k in need) {
    const v = o[k];
    if (need[k] === 'array' ? !Array.isArray(v) : (!v || typeof v !== 'object' || Array.isArray(v))) errs.push('Missing or invalid section: ' + k + '.');
  }
  if (o.money && !Array.isArray(o.money.tx)) errs.push('Missing transactions list.');
  if (o.money && Array.isArray(o.money.tx)) {
    const ids = new Set();
    for (const x of o.money.tx) {
      if (!x || !x.id || !isDate(x.date) || !Number.isInteger(x.amount)) { errs.push('A transaction has an invalid id, date or amount.'); break; }
      if (ids.has(x.id)) { errs.push('Duplicate transaction id ' + x.id + '.'); break; }
      ids.add(x.id);
    }
  }
  if (o.checkins && typeof o.checkins === 'object') {
    for (const k in o.checkins) if (!isDate(k)) { errs.push('A check-in has an invalid date.'); break; }
  }
  return errs;
}
/* Fill in any keys a newer build expects, without touching existing data. */
function normalize(o) {
  const d = defaultState();
  const merge = (dst, src) => { for (const k in src) { if (dst[k] === undefined) dst[k] = clone(src[k]); else if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && dst[k] && typeof dst[k] === 'object' && !Array.isArray(dst[k])) merge(dst[k], src[k]); } };
  merge(o, d);
  return o;
}
