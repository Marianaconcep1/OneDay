/* ---------- App lock (on-device PIN) ----------
   Every profile on this device has a 6-digit PIN, created during setup and asked for
   whenever the app is opened, refreshed or brought back from the background. The PIN
   is never stored: only a salted PBKDF2-SHA256 hash is kept, under its own storage key,
   outside backups. The check runs in this browser, so it hides the app from casual
   viewing; it does not encrypt the stored records and is not an online account. */
const AUTH_KEY = 'auth';
const PIN_ITER = 210000;
const MAX_TRIES = 5;
let AUTH = null;        // {user, salt, hash, recSalt, recHash, fails, lockUntil, autoLockMin}
let LOCKED = false;
let lastActivity = Date.now();
let RC_PENDING = null;  // a recovery code not yet confirmed as saved, shown again after unlock

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const cryptoOk = () => !!(window.crypto && crypto.subtle && crypto.getRandomValues);
async function pinHash(secret, saltB64) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(saltB64), iterations: PIN_ITER }, key, 256);
  return b64(bits);
}
const newSalt = () => b64(crypto.getRandomValues(new Uint8Array(16)));
/* Constant-time comparison of two base64 strings */
function sameHash(a, b) { if (!a || !b || a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
function weakPin(p) {
  if (!/^\d{6}$/.test(p)) return 'Use exactly 6 digits.';
  if (/^(\d)\1{5}$/.test(p)) return 'Avoid one repeated digit.';
  if ('0123456789'.includes(p) || '9876543210'.includes(p)) return 'Avoid a straight run like 123456.';
  if (/^(\d\d)\1\1$/.test(p) || /^(\d{3})\1$/.test(p)) return 'Avoid a repeating pattern.';
  return null;
}
function newRecoveryCode() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const r = crypto.getRandomValues(new Uint8Array(12));
  const s = Array.from(r, (x) => abc[x % abc.length]).join('');
  return s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8, 12);
}
const normCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
async function saveAuth() { if (AUTH) await Store.set(AUTH_KEY, AUTH); else await Store.del(AUTH_KEY); }
async function loadAuth() { try { AUTH = await Store.get(AUTH_KEY); } catch (e) { AUTH = null; } LOCKED = !!(AUTH && AUTH.hash); }
/* Escalating lockout after repeated wrong attempts: 30 s, 1 min, 2 min … up to 15 min */
function lockoutLeft() { return AUTH && AUTH.lockUntil ? Math.max(0, AUTH.lockUntil - nowMs()) : 0; }
function registerFail() {
  AUTH.fails = (AUTH.fails || 0) + 1;
  if (AUTH.fails >= MAX_TRIES) { const n = AUTH.fails - MAX_TRIES; AUTH.lockUntil = nowMs() + Math.min(15 * 60000, 30000 * Math.pow(2, n)); }
  saveAuth();
}
function lockNow() {
  if (!AUTH || !AUTH.hash) return;
  LOCKED = true; LOCK_UI = { mode: 'pin' }; flush(); closeSheet(true);
  const tt = $('.toast'); if (tt) tt.remove();
  render();
}
/* Six digits only: strip anything else as it is typed, keeping leading zeros */
document.addEventListener('input', (e) => { const el = e.target; if (el && el.classList && el.classList.contains('pin')) { const d = el.value.replace(/\D/g, '').slice(0, 6); if (d !== el.value) el.value = d; } });
function pinField(id, label, auto, desc) {
  return `<label class="f">${label}<span class="pinrow"><input class="inp pin" id="${id}" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" ${auto ? 'autofocus' : ''} ${desc ? `aria-describedby="${desc}"` : ''}><button type="button" class="btn ghost sm" data-act="pinShow" data-for="${id}" aria-pressed="false">Show</button></span></label>`;
}

let LOCK_UI = { mode: 'pin' };
function renderLock() {
  const left = lockoutLeft();
  const tries = Math.max(0, MAX_TRIES - (AUTH.fails || 0));
  const wait = left ? `<div class="banner warn small" role="alert">Too many attempts. Try again in ${Math.ceil(left / 1000)} seconds.</div>` : '';
  let body;
  if (LOCK_UI.mode === 'recover') {
    body = `<div class="h2">Reset your PIN</div><p class="small">Enter the recovery code you saved when you set up the PIN, then choose a new PIN.</p>
      <label class="f">Recovery code<input class="inp" id="lkCode" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX"></label>
      ${pinField('lkNew', 'New 6-digit PIN', false, 'lockMsg')}${pinField('lkNew2', 'Repeat new PIN', false, 'lockMsg')}
      ${wait}<div id="lockMsg" class="small" aria-live="polite">${esc(LOCK_UI.msg || '')}</div>
      <button class="btn primary" data-act="lockRecover" ${left ? 'disabled' : ''}>Reset PIN and unlock</button>
      <button class="btn ghost sm" data-act="lockMode" data-mode="pin">Back to PIN</button>
      <details class="more"><summary>Lost the recovery code too?</summary><p class="small mt-s">Without the PIN or the code, the only option is to erase the data on this device and start over. A JSON backup can be restored afterward.</p><button class="btn ghost danger sm" data-act="lockMode" data-mode="erase">Erase this device’s data</button></details>`;
  } else if (LOCK_UI.mode === 'erase') {
    body = `<div class="h2">Erase and start over</div><p class="small">This deletes every record and the PIN on this device. It can’t be undone. If you have a backup file you can restore it afterward.</p>
      <label class="f">Type ERASE to confirm<input class="inp" id="lkErase" autocomplete="off" autocapitalize="characters"></label>
      <button class="btn accent" data-act="lockErase">Erase everything</button><button class="btn ghost sm" data-act="lockMode" data-mode="pin">Cancel</button>`;
  } else {
    body = `<div class="brand">One Day<br><em>Beta</em></div>
      ${pinField('lkPin', 'PIN', true, 'lockMsg')}
      ${wait}<div id="lockMsg" class="small" aria-live="polite">${esc(LOCK_UI.msg || (AUTH.fails && !left ? plural(tries, 'attempt') + ' left before a short wait.' : ''))}</div>
      <button class="btn primary" data-act="lockTry" ${left ? 'disabled' : ''}>Unlock</button>
      <button class="btn ghost sm" data-act="lockMode" data-mode="recover">Forgot your PIN?</button>
      <p class="tiny muted">${esc(DEVICE_LOCK_NOTE)}</p>`;
  }
  // Count the wait down once a second, keeping whatever has been typed so far
  if (left) setTimeout(() => {
    if (!LOCKED || $('.sheet')) return;
    const typed = [...document.querySelectorAll('#app input[id]')].map((i) => [i.id, i.value]);
    const focus = document.activeElement && document.activeElement.id;
    render();
    for (const [id, v] of typed) { const i = document.getElementById(id); if (i) i.value = v; }
    const f = focus && document.getElementById(focus); if (f) f.focus();
  }, Math.min(left, 1000) + 50);
  return `<main class="wrap"><div class="onb lock stack">${body}</div></main>`;
}
A.pinShow = (el) => { const i = document.getElementById(el.dataset.for); if (!i) return; const on = i.type === 'password'; i.type = on ? 'text' : 'password'; el.textContent = on ? 'Hide' : 'Show'; el.setAttribute('aria-pressed', on ? 'true' : 'false'); };
A.lockMode = (el) => { LOCK_UI = { mode: el.dataset.mode }; render(); };
A.lockTry = async () => {
  if (lockoutLeft()) return;
  const p = val('lkPin');
  if (!/^\d{6}$/.test(p)) { LOCK_UI.msg = 'Enter your 6 digits.'; render(); return; }
  const ok = sameHash(await pinHash(p, AUTH.salt), AUTH.hash);
  if (!ok) { registerFail(); LOCK_UI.msg = lockoutLeft() ? '' : 'That PIN didn’t match. ' + plural(Math.max(0, MAX_TRIES - AUTH.fails), 'attempt') + ' left before a short wait.'; render(); return; }
  AUTH.fails = 0; AUTH.lockUntil = null; await saveAuth(); unlocked();
};
A.lockRecover = async () => {
  if (lockoutLeft()) return;
  const code = normCode(val('lkCode')); const p = val('lkNew'), p2 = val('lkNew2');
  const weak = weakPin(p);
  if (weak) { LOCK_UI.msg = weak; render(); return; }
  if (p !== p2) { LOCK_UI.msg = 'The two new PINs don’t match.'; render(); return; }
  if (!AUTH.recHash || !sameHash(await pinHash(code, AUTH.recSalt), AUTH.recHash)) { registerFail(); LOCK_UI.msg = lockoutLeft() ? '' : 'That recovery code didn’t match.'; render(); return; }
  AUTH.salt = newSalt(); AUTH.hash = await pinHash(p, AUTH.salt); AUTH.fails = 0; AUTH.lockUntil = null;
  const rc = newRecoveryCode(); AUTH.recSalt = newSalt(); AUTH.recHash = await pinHash(normCode(rc), AUTH.recSalt);
  await saveAuth(); unlocked(); showRecoveryCode(rc, 'PIN reset. Your old recovery code no longer works; here is a new one.');
};
A.lockErase = async () => {
  if (val('lkErase').toUpperCase() !== 'ERASE') { toast('Type ERASE to confirm.'); return; }
  AUTH = null; await saveAuth(); await Store.del(REAL_KEY); await Store.del(DEMO_KEY); await Store.del(BG_KEY);
  DEMO = false; S = defaultState(); await flush(); LOCKED = false; LOCK_UI = { mode: 'pin' }; applyLook(); render();
};
function unlocked() {
  LOCKED = false; LOCK_UI = { mode: 'pin' }; lastActivity = Date.now(); render(); window.scrollTo(0, 0);
  if (RC_PENDING) showRecoveryCode(RC_PENDING.rc, RC_PENDING.lead);
}
const DEVICE_LOCK_NOTE = 'This PIN locks One Day on this device. It isn’t an online account: it hides the app from casual viewing but doesn’t encrypt your records or protect them from someone with full access to the phone.';

/* Setup: a PIN is required before any personal screen, for new and existing profiles alike */
const pinRequired = () => !DEMO && !(AUTH && AUTH.hash) && !!(S.settings.onboarded || (S.settings.welcomeDone && ONB.step >= 2));
let PS_MSG = '';
function renderPinSetup() {
  if (!cryptoOk()) return `<main class="wrap"><div class="onb lock stack"><h1 class="h2">Open One Day from its secure address</h1>
    <p class="small">This browser can’t create a secure PIN hash here (it needs a secure https page). One Day needs a PIN before it opens, so use its https address.</p></div></main>`;
  return `<main class="wrap"><div class="onb lock stack">
    <h1 class="h2">Create your PIN</h1>
    <p>You’ll use this code to unlock One Day whenever you return.</p>
    ${pinField('psPin', '6-digit PIN', true, 'psMsg')}${pinField('psPin2', 'Confirm PIN', false, 'psMsg')}
    <div id="psMsg" class="small" role="alert">${PS_MSG ? `<span class="pill skipped">${esc(PS_MSG)}</span>` : ''}</div>
    <button class="btn primary" data-act="pinCreate">Save PIN and continue</button>
    <p class="tiny muted">${esc(DEVICE_LOCK_NOTE)}</p></div></main>`;
}
let PS_BUSY = false;
A.pinCreate = async () => {
  if (PS_BUSY || !pinRequired() || !cryptoOk()) return;
  const p = val('psPin'), p2 = val('psPin2');
  PS_MSG = weakPin(p) || (p !== p2 ? 'The two PINs don’t match.' : '');
  if (PS_MSG) { render(); const i = $('#psPin'); if (i) i.focus(); return; }
  PS_BUSY = true;
  try { const rc = await createPin(p); render(); window.scrollTo(0, 0); showRecoveryCode(rc, 'PIN saved.'); } finally { PS_BUSY = false; }
};
async function createPin(p) {
  const base = { user: S.settings.name || '', autoLockMin: 5, createdAt: nowISO(), fails: 0, lockUntil: null };
  base.salt = newSalt(); base.hash = await pinHash(p, base.salt);
  const rc = newRecoveryCode(); base.recSalt = newSalt(); base.recHash = await pinHash(normCode(rc), base.recSalt);
  AUTH = base; PS_MSG = ''; await saveAuth();
  return rc;
}
function autoLockTick() {
  if (LOCKED || !AUTH || !AUTH.hash) return;
  const m = AUTH.autoLockMin;
  if (m && Date.now() - lastActivity > m * 60000) lockNow();
}

/* Settings: change the PIN, the recovery code and the inactivity lock (the PIN itself can't be turned off) */
function renderSecurity() {
  const on = AUTH && AUTH.hash;
  if (!cryptoOk()) return `<p class="small">This browser can’t create a secure PIN hash here (it needs a secure https page). The lock is unavailable in this copy.</p>`;
  if (!on) return `<p class="small">Add a 6-digit PIN to open the app on this device. It keeps the app private from casual viewing.</p>
    <p class="tiny muted">It is not an online account and doesn’t encrypt your records. Signing in from other devices would need a server, which this version doesn’t have.</p>
    <button class="btn primary sm" data-act="pinSetup">Set up a PIN</button>`;
  const opts = [[1, '1 minute'], [5, '5 minutes'], [15, '15 minutes'], [30, '30 minutes'], [0, 'Only when I leave or reopen the app']];
  return `<p class="small">PIN lock is on for <b>${esc(AUTH.user)}</b> on this device.</p>
    <p class="small">One Day asks for your PIN every time it’s opened, refreshed or brought back from the background.</p>
    <label class="f">Also lock after no activity for<select class="inp" id="alMin" data-act="alSave">${opts.map(([v, l]) => `<option value="${v}" ${Number(AUTH.autoLockMin) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <div class="btn-row"><button class="btn sm" data-act="lockNowBtn">Lock now</button><button class="btn sm" data-act="pinChange">Change PIN</button><button class="btn sm" data-act="pinNewCode">New recovery code</button></div>
    <p class="tiny muted">After ${MAX_TRIES} wrong attempts the lock waits 30 seconds, then longer each time. Only a salted hash of the PIN is stored, never the PIN, and it isn’t included in backups.</p>
    <p class="tiny muted">${esc(DEVICE_LOCK_NOTE)}</p>`;
}
A.lockNowBtn = () => lockNow();
A.alSave = () => { setTimeout(async () => { AUTH.autoLockMin = Number($('#alMin').value); await saveAuth(); toast('Lock settings saved.'); }, 0); };
function pinForm(title, needCurrent, needUser) {
  openSheet(() => `${sheetHead(title)}
    ${needUser ? `<label class="f">Username<input class="inp" id="pfUser" maxlength="40" autocomplete="username" value="${esc((AUTH && AUTH.user) || S.settings.name || '')}"><span class="hint">Shown on the lock screen. A local profile name, not an online account.</span></label>` : ''}
    ${needCurrent ? `<label class="f">Current PIN<span class="pinrow"><input class="inp pin" id="pfCur" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off"><button type="button" class="btn ghost sm" data-act="pinShow" data-for="pfCur">Show</button></span></label>` : ''}
    ${SH.pinMode === 'code' ? '' : `<label class="f">New 6-digit PIN<span class="pinrow"><input class="inp pin" id="pfNew" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off"><button type="button" class="btn ghost sm" data-act="pinShow" data-for="pfNew">Show</button></span></label>
    <label class="f">Repeat PIN<span class="pinrow"><input class="inp pin" id="pfNew2" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off"><button type="button" class="btn ghost sm" data-act="pinShow" data-for="pfNew2">Show</button></span></label>`}
    <div id="pfMsg" class="small" aria-live="polite"></div>
    <button class="btn primary" data-act="pinSave">${SH.pinMode === 'code' ? 'Make a new code' : 'Save PIN'}</button>`);
}
A.pinSetup = () => { SH.pinMode = 'setup'; pinForm('Set up a PIN', false, true); };
A.pinChange = () => { SH.pinMode = 'change'; pinForm('Change PIN', true, false); };
A.pinNewCode = () => { SH.pinMode = 'code'; pinForm('New recovery code', true, false); };
A.pinSave = async () => {
  const msg = (m) => { const e = $('#pfMsg'); if (e) e.innerHTML = `<span class="pill skipped">${esc(m)}</span>`; };
  const mode = SH.pinMode;
  if (mode !== 'setup') {
    if (lockoutLeft()) { msg('Too many attempts. Wait ' + Math.ceil(lockoutLeft() / 1000) + ' seconds.'); return; }
    if (!sameHash(await pinHash(val('pfCur'), AUTH.salt), AUTH.hash)) { registerFail(); msg('The current PIN didn’t match.'); return; }
    AUTH.fails = 0; AUTH.lockUntil = null;
  }
  if (mode === 'code') { const rc = newRecoveryCode(); AUTH.recSalt = newSalt(); AUTH.recHash = await pinHash(normCode(rc), AUTH.recSalt); await saveAuth(); showRecoveryCode(rc, 'Your old recovery code no longer works.'); return; }
  const user = $('#pfUser') ? val('pfUser') : (AUTH && AUTH.user) || S.settings.name || ''; const p = val('pfNew');
  if ($('#pfUser') && !user) { msg('Add a username.'); return; }
  const weak = weakPin(p); if (weak) { msg(weak); return; }
  if (p !== val('pfNew2')) { msg('The two PINs don’t match.'); return; }
  const base = AUTH || { autoLockMin: 5, createdAt: nowISO() };
  base.user = user; base.salt = newSalt(); base.hash = await pinHash(p, base.salt); base.fails = 0; base.lockUntil = null;
  let rc = null;
  if (mode === 'setup' || !base.recHash) { rc = newRecoveryCode(); base.recSalt = newSalt(); base.recHash = await pinHash(normCode(rc), base.recSalt); }
  AUTH = base; await saveAuth();
  if (rc) showRecoveryCode(rc, 'PIN saved.'); else { closeSheet(); render(); toast('PIN changed.'); }
};
function showRecoveryCode(rc, lead) {
  RC_PENDING = { rc, lead };
  openSheet(() => `${sheetHead('Save your recovery code')}
    <p class="small">${esc(lead)} If you forget your PIN, this code lets you set a new one. It’s shown only now.</p>
    <div class="card tint"><div class="num" id="rcText" style="font-size:24px;letter-spacing:.08em;text-align:center">${esc(rc)}</div></div>
    <button class="btn" data-act="copyText" data-src="rcText">${t('btn.copy')}</button>
    <p class="tiny muted">Keep it somewhere other than this app, such as a password manager or a note on another device.</p>
    <label class="row" style="min-height:44px;gap:10px"><input type="checkbox" id="rcOk" style="width:22px;height:22px"> I saved the code</label>
    <button class="btn primary" data-act="rcDone">Done</button>`, { lock: true });
}
A.rcDone = () => { if (!$('#rcOk').checked) { toast('Tick “I saved the code” first.'); return; } RC_PENDING = null; closeSheet(); render(); };
