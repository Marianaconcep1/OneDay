/* ---------- Quick unlock (on-device PIN) ----------
   A convenience lock for this device only. The PIN is never stored: only a salted
   PBKDF2-SHA256 hash is kept, under its own storage key, outside backups.
   It does not encrypt the stored records and is not an online account. */
const AUTH_KEY = 'auth';
const PIN_ITER = 210000;
const MAX_TRIES = 5;
let AUTH = null;        // {user, salt, hash, recSalt, recHash, fails, lockUntil, autoLockMin, lockOnHide}
let LOCKED = false;
let lastActivity = Date.now();

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
function lockNow() { if (!AUTH || !AUTH.hash) return; LOCKED = true; LOCK_UI = { mode: 'pin' }; flush(); closeSheet(true); render(); }

let LOCK_UI = { mode: 'pin' };
function renderLock() {
  const left = lockoutLeft();
  const tries = Math.max(0, MAX_TRIES - (AUTH.fails || 0));
  const wait = left ? `<div class="banner warn small" role="alert">Too many attempts. Try again in ${Math.ceil(left / 1000)} seconds.</div>` : '';
  const pinField = (id, label, auto) => `<label class="f">${label}<span class="pinrow"><input class="inp pin" id="${id}" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" ${auto ? 'autofocus' : ''} aria-describedby="lockMsg"><button type="button" class="btn ghost sm" data-act="pinShow" data-for="${id}" aria-pressed="false">Show</button></span></label>`;
  let body;
  if (LOCK_UI.mode === 'recover') {
    body = `<div class="h2">Reset your PIN</div><p class="small">Enter the recovery code you saved when you set up the PIN, then choose a new PIN.</p>
      <label class="f">Recovery code<input class="inp" id="lkCode" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX"></label>
      ${pinField('lkNew', 'New 6-digit PIN')}${pinField('lkNew2', 'Repeat new PIN')}
      ${wait}<div id="lockMsg" class="small" aria-live="polite">${esc(LOCK_UI.msg || '')}</div>
      <button class="btn primary" data-act="lockRecover" ${left ? 'disabled' : ''}>Reset PIN and unlock</button>
      <button class="btn ghost sm" data-act="lockMode" data-mode="pin">Back to PIN</button>
      <details class="more"><summary>Lost the recovery code too?</summary><p class="small mt-s">Without the PIN or the code, the only option is to erase the data on this device and start over. A JSON backup can be restored afterward.</p><button class="btn ghost danger sm" data-act="lockMode" data-mode="erase">Erase this device’s data</button></details>`;
  } else if (LOCK_UI.mode === 'erase') {
    body = `<div class="h2">Erase and start over</div><p class="small">This deletes every record and the PIN on this device. It can’t be undone. If you have a backup file you can restore it afterward.</p>
      <label class="f">Type ERASE to confirm<input class="inp" id="lkErase" autocomplete="off" autocapitalize="characters"></label>
      <button class="btn accent" data-act="lockErase">Erase everything</button><button class="btn ghost sm" data-act="lockMode" data-mode="pin">Cancel</button>`;
  } else {
    body = `<div class="brand">One Day<br><em>${esc(AUTH.user || S.settings.name || '')}</em></div>
      ${pinField('lkPin', 'PIN', true)}
      ${wait}<div id="lockMsg" class="small" aria-live="polite">${esc(LOCK_UI.msg || (AUTH.fails && !left ? plural(tries, 'attempt') + ' left before a short wait.' : ''))}</div>
      <button class="btn primary" data-act="lockTry" ${left ? 'disabled' : ''}>Unlock</button>
      <button class="btn ghost sm" data-act="lockMode" data-mode="recover">Forgot PIN?</button>
      <p class="tiny muted">This PIN is a convenience lock for this device. It hides the app from casual viewing but doesn’t encrypt your records or protect them from someone with full access to the phone.</p>`;
  }
  if (left) setTimeout(() => { if (LOCKED && !$('.sheet')) { const v = $('#lkCode') ? val('lkCode') : null; render(); if (v && $('#lkCode')) $('#lkCode').value = v; } }, Math.min(left, 1000) + 50);
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
function unlocked() { LOCKED = false; LOCK_UI = { mode: 'pin' }; lastActivity = Date.now(); render(); window.scrollTo(0, 0); }
function autoLockTick() {
  if (LOCKED || !AUTH || !AUTH.hash) return;
  const m = AUTH.autoLockMin;
  if (m && Date.now() - lastActivity > m * 60000) lockNow();
}

/* Settings: set up, change, turn off */
function renderSecurity() {
  const on = AUTH && AUTH.hash;
  if (!cryptoOk()) return `<p class="small">This browser can’t create a secure PIN hash here (it needs a secure https page). The lock is unavailable in this copy.</p>`;
  if (!on) return `<p class="small">Add a 6-digit PIN to open the app on this device. It keeps the app private from casual viewing.</p>
    <p class="tiny muted">It is not an online account and doesn’t encrypt your records. Signing in from other devices would need a server, which this version doesn’t have.</p>
    <button class="btn primary sm" data-act="pinSetup">Set up a PIN</button>`;
  const opts = [[1, '1 minute'], [5, '5 minutes'], [15, '15 minutes'], [30, '30 minutes'], [0, 'Only when I lock it']];
  return `<p class="small">PIN lock is on for <b>${esc(AUTH.user)}</b> on this device.</p>
    <label class="f">Lock after no activity for<select class="inp" id="alMin" data-act="alSave">${opts.map(([v, l]) => `<option value="${v}" ${Number(AUTH.autoLockMin) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="row" style="min-height:44px;gap:10px"><input type="checkbox" id="alHide" data-act="alSave" ${AUTH.lockOnHide ? 'checked' : ''} style="width:22px;height:22px"> Lock when I leave the app</label>
    <div class="btn-row"><button class="btn sm" data-act="lockNowBtn">Lock now</button><button class="btn sm" data-act="pinChange">Change PIN</button><button class="btn sm" data-act="pinNewCode">New recovery code</button><button class="btn ghost danger sm" data-act="pinOff">Turn off PIN</button></div>
    <p class="tiny muted">After ${MAX_TRIES} wrong attempts the lock waits 30 seconds, then longer each time. Only a salted hash of the PIN is stored, never the PIN, and it isn’t included in backups.</p>`;
}
A.lockNowBtn = () => lockNow();
A.alSave = () => { setTimeout(async () => { AUTH.autoLockMin = Number($('#alMin').value); AUTH.lockOnHide = $('#alHide').checked; await saveAuth(); toast('Lock settings saved.'); }, 0); };
function pinForm(title, needCurrent, needUser) {
  openSheet(() => `${sheetHead(title)}
    ${needUser ? `<label class="f">Username<input class="inp" id="pfUser" maxlength="40" autocomplete="username" value="${esc((AUTH && AUTH.user) || S.settings.name || '')}"><span class="hint">Shown on the lock screen. A local profile name, not an online account.</span></label>` : ''}
    ${needCurrent ? `<label class="f">Current PIN<span class="pinrow"><input class="inp pin" id="pfCur" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off"><button type="button" class="btn ghost sm" data-act="pinShow" data-for="pfCur">Show</button></span></label>` : ''}
    ${SH.pinMode === 'off' || SH.pinMode === 'code' ? '' : `<label class="f">New 6-digit PIN<span class="pinrow"><input class="inp pin" id="pfNew" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off"><button type="button" class="btn ghost sm" data-act="pinShow" data-for="pfNew">Show</button></span></label>
    <label class="f">Repeat PIN<span class="pinrow"><input class="inp pin" id="pfNew2" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off"><button type="button" class="btn ghost sm" data-act="pinShow" data-for="pfNew2">Show</button></span></label>`}
    <div id="pfMsg" class="small" aria-live="polite"></div>
    <button class="btn primary" data-act="pinSave">${SH.pinMode === 'off' ? 'Turn off PIN' : SH.pinMode === 'code' ? 'Make a new code' : 'Save PIN'}</button>`);
}
A.pinSetup = () => { SH.pinMode = 'setup'; pinForm('Set up a PIN', false, true); };
A.pinChange = () => { SH.pinMode = 'change'; pinForm('Change PIN', true, true); };
A.pinOff = () => { SH.pinMode = 'off'; pinForm('Turn off PIN', true, false); };
A.pinNewCode = () => { SH.pinMode = 'code'; pinForm('New recovery code', true, false); };
A.pinSave = async () => {
  const msg = (m) => { const e = $('#pfMsg'); if (e) e.innerHTML = `<span class="pill skipped">${esc(m)}</span>`; };
  const mode = SH.pinMode;
  if (mode !== 'setup') {
    if (lockoutLeft()) { msg('Too many attempts. Wait ' + Math.ceil(lockoutLeft() / 1000) + ' seconds.'); return; }
    if (!sameHash(await pinHash(val('pfCur'), AUTH.salt), AUTH.hash)) { registerFail(); msg('The current PIN didn’t match.'); return; }
    AUTH.fails = 0; AUTH.lockUntil = null;
  }
  if (mode === 'off') { AUTH = null; await saveAuth(); closeSheet(); render(); toast('PIN lock turned off.'); return; }
  if (mode === 'code') { const rc = newRecoveryCode(); AUTH.recSalt = newSalt(); AUTH.recHash = await pinHash(normCode(rc), AUTH.recSalt); await saveAuth(); showRecoveryCode(rc, 'Your old recovery code no longer works.'); return; }
  const user = val('pfUser'); const p = val('pfNew');
  if (!user) { msg('Add a username.'); return; }
  const weak = weakPin(p); if (weak) { msg(weak); return; }
  if (p !== val('pfNew2')) { msg('The two PINs don’t match.'); return; }
  const base = AUTH || { autoLockMin: 5, lockOnHide: true, createdAt: nowISO() };
  base.user = user; base.salt = newSalt(); base.hash = await pinHash(p, base.salt); base.fails = 0; base.lockUntil = null;
  let rc = null;
  if (mode === 'setup' || !base.recHash) { rc = newRecoveryCode(); base.recSalt = newSalt(); base.recHash = await pinHash(normCode(rc), base.recSalt); }
  AUTH = base; await saveAuth();
  if (rc) showRecoveryCode(rc, 'PIN saved.'); else { closeSheet(); render(); toast('PIN changed.'); }
};
function showRecoveryCode(rc, lead) {
  openSheet(() => `${sheetHead('Save your recovery code')}
    <p class="small">${esc(lead)} If you forget your PIN, this code lets you set a new one. It’s shown only now.</p>
    <div class="card tint"><div class="num" id="rcText" style="font-size:24px;letter-spacing:.08em;text-align:center">${esc(rc)}</div></div>
    <button class="btn" data-act="copyText" data-src="rcText">${t('btn.copy')}</button>
    <p class="tiny muted">Keep it somewhere other than this app, such as a password manager or a note on another device.</p>
    <label class="row" style="min-height:44px;gap:10px"><input type="checkbox" id="rcOk" style="width:22px;height:22px"> I saved the code</label>
    <button class="btn primary" data-act="rcDone">Done</button>`, { lock: true });
}
A.rcDone = () => { if (!$('#rcOk').checked) { toast('Tick “I saved the code” first.'); return; } closeSheet(); render(); };
