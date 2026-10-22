/* ---------- Personalize: background, font, text color, theme, dimming, blur, size, motion ----------
   Changes preview live and are only kept when you tap Apply. */
const BG_KEY = 'bg-image';
const BACKGROUNDS = [
  { id: 'monet', name: 'Water lilies', credit: 'Original study in the style of Claude Monet, made for this app' },
  { id: 'seurat', name: 'Afternoon by the river', credit: 'Original pointillist study in the style of Georges Seurat, made for this app' },
  { id: 'night', name: 'Swirling night', credit: 'Original study in the style of Vincent van Gogh, made for this app' },
  { id: 'plain-lavender', name: 'Plain lavender', plain: 'linear-gradient(180deg,#EDE6F6,#E4DCF1)', plainDark: 'linear-gradient(180deg,#221C30,#1B1726)' },
  { id: 'plain-mist', name: 'Morning mist', plain: 'linear-gradient(160deg,#F3EEF8,#E3ECF2 60%,#F2E6EE)', plainDark: 'linear-gradient(160deg,#1F1B2B,#1B2230 60%,#261C27)' },
  { id: 'plain-paper', name: 'Paper', plain: 'linear-gradient(180deg,#F8F5F0,#F1ECE4)', plainDark: 'linear-gradient(180deg,#1E1C1A,#191715)' },
  { id: 'photo', name: 'My own photo', credit: 'Your image, stored only on this device' }
];
const FONTS = [
  { id: 'atkinson', name: 'Atkinson Hyperlegible', css: '"Atkinson Hyperlegible"', g: null },
  { id: 'system', name: 'iPhone system font', css: '-apple-system, "SF Pro Text", system-ui', g: null },
  { id: 'lexend', name: 'Lexend', css: '"Lexend"', g: 'Lexend:wght@400;700' },
  { id: 'inter', name: 'Inter', css: '"Inter"', g: 'Inter:wght@400;700' },
  { id: 'nunito', name: 'Nunito', css: '"Nunito"', g: 'Nunito:wght@400;700' },
  { id: 'plex', name: 'IBM Plex Sans', css: '"IBM Plex Sans"', g: 'IBM+Plex+Sans:wght@400;700' },
  { id: 'lora', name: 'Lora', css: '"Lora"', g: 'Lora:wght@400;700' },
  { id: 'literata', name: 'Literata', css: '"Literata"', g: 'Literata:opsz,wght@7..72,400;7..72,700' },
  { id: 'source-serif', name: 'Source Serif', css: '"Source Serif 4"', g: 'Source+Serif+4:opsz,wght@8..60,400;8..60,700' },
  { id: 'fraunces', name: 'Fraunces', css: '"Fraunces"', g: null }
];
/* Each preset has a light and dark ink; both checked against the card surface before use */
const INKS = [
  { id: 'default', name: 'Default plum-gray', light: '#2A2438', dark: '#EEE8F6' },
  { id: 'plum', name: 'Deep plum', light: '#3B1F4A', dark: '#F1E4F8' },
  { id: 'charcoal', name: 'Charcoal', light: '#1F1F24', dark: '#F4F4F6' },
  { id: 'midnight', name: 'Midnight blue', light: '#1C2747', dark: '#E3EAFB' },
  { id: 'forest', name: 'Forest', light: '#1D3A2E', dark: '#E2F2E8' }
];
const SURFACE = { light: '#FCFAFF', dark: '#251F33' };
const DEFAULT_LOOK = { bg: 'monet', font: 'atkinson', ink: 'default', theme: 'system', dim: 0, blur: 0, size: 100, motion: 'device' };
let LOOK_DRAFT = null;
let BG_DATA = null;  // own photo, loaded from its own storage key

function lum(hex) { const c = hex.match(/\w\w/g).map((x) => { const v = parseInt(x, 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
const inkOk = (ink) => contrast(ink.light, SURFACE.light) >= 7 && contrast(ink.dark, SURFACE.dark) >= 7;
function look() { return Object.assign({}, DEFAULT_LOOK, S.settings.look || {}, { theme: S.settings.theme || 'system' }); }
function isDark() { const th = (LOOK_DRAFT || look()).theme; return th === 'dark' || (th === 'system' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
function reducedMotion() { const m = (LOOK_DRAFT || look()).motion; return m === 'reduce' || (m === 'device' && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
const loadedFonts = new Set();
function loadFont(f) {
  if (!f.g || loadedFonts.has(f.id)) return; loadedFonts.add(f.id);
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + f.g + '&display=swap'; document.head.appendChild(l);
}
function applyLook(lk) {
  const L = lk || look(); const root = document.documentElement;
  const th = L.theme; if (th === 'light' || th === 'dark') root.setAttribute('data-theme', th); else root.removeAttribute('data-theme');
  const bg = BACKGROUNDS.find((b) => b.id === L.bg) || BACKGROUNDS[0];
  let img;
  if (bg.plain) img = isDark() ? bg.plainDark : bg.plain;
  else if (bg.id === 'photo') img = BG_DATA ? `url("${BG_DATA}")` : 'var(--img-monet)';
  else img = `var(--img-${bg.id})`;
  root.style.setProperty('--bg-img', img);
  root.style.setProperty('--dim', String((Number(L.dim) || 0) / 100));
  root.style.setProperty('--bg-blur', (Number(L.blur) || 0) + 'px');
  const f = FONTS.find((x) => x.id === L.font) || FONTS[0]; loadFont(f);
  root.style.setProperty('--f-body', `${f.css}, -apple-system, "Segoe UI", system-ui, sans-serif`);
  const ink = INKS.find((x) => x.id === L.ink && inkOk(x)) || INKS[0];
  if (ink.id === 'default') root.style.removeProperty('--ink'); else root.style.setProperty('--ink', isDark() ? ink.dark : ink.light);
  root.style.setProperty('--zoom', String((Number(L.size) || 100) / 100));
  root.classList.toggle('reduce-motion', reducedMotion());
}
function applyTheme() { applyLook(); }
async function loadBgImage() { try { BG_DATA = await Store.get(BG_KEY); } catch (e) { BG_DATA = null; } }

function lookSummary() {
  const L = look(); const bg = BACKGROUNDS.find((b) => b.id === L.bg) || BACKGROUNDS[0]; const f = FONTS.find((x) => x.id === L.font) || FONTS[0];
  return `${bg.name} · ${f.name} · ${{ system: 'Match device', light: 'Light', dark: 'Dark' }[L.theme]} · ${L.size}% text`;
}
A.lookOpen = () => {
  LOOK_DRAFT = look();
  SH.onPick = (g, v) => {
    if (!LOOK_DRAFT || !v) return;
    const k = { lkBg: 'bg', lkFont: 'font', lkInk: 'ink', lkTheme: 'theme', lkMotion: 'motion' }[g]; if (!k) return;
    LOOK_DRAFT[k] = v; if (k === 'bg' && v === 'photo' && !BG_DATA) { const f = $('#lkPhoto'); if (f) f.click(); }
    applyLook(LOOK_DRAFT); if (k === 'bg') { const c = $('#lkCredit'); if (c) c.textContent = bgCredit(v); }
  };
  openSheet(renderLookSheet, { noFocus: true });
  SH.onClose = () => { LOOK_DRAFT = null; applyLook(); };
  bindLookInputs();
};
function bgCredit(id) { const b = BACKGROUNDS.find((x) => x.id === id); return b && b.credit ? b.credit : 'A plain background, easiest to read.'; }
function renderLookSheet() {
  const L = LOOK_DRAFT;
  const thumb = (b) => `<button type="button" class="bg-thumb" data-act="pick" data-group="lkBg" data-val="${b.id}" aria-pressed="${L.bg === b.id ? 'true' : 'false'}" aria-label="${esc(b.name)}"><span class="sw sw-${b.id}" style="${b.plain ? 'background:' + b.plain : b.id === 'photo' && BG_DATA ? `background-image:url('${BG_DATA}')` : ''}">${b.id === 'photo' && !BG_DATA ? '+' : ''}</span><span class="tiny">${esc(b.name)}</span></button>`;
  const slider = (id, label, min, max, stepv, v, unit) => `<label class="f">${label} <span class="num muted" id="${id}V">${v}${unit}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${stepv}" value="${v}"></label>`;
  return `${sheetHead('Personalize', 'Preview live. Nothing is kept until you apply.')}
    <div class="look-sample" aria-label="Preview"><div class="card"><div class="eyebrow">Preview</div><div class="h2">Record today’s spending</div><p class="small">Done when: every purchase is entered. <span class="muted">About 2 min.</span></p></div></div>
    <div class="stack-s"><div class="h3">Background</div><div class="bg-grid">${BACKGROUNDS.map(thumb).join('')}</div>
      <p class="tiny muted" id="lkCredit">${esc(bgCredit(L.bg))}</p>
      <input type="file" id="lkPhoto" accept="image/*" hidden>${BG_DATA ? '<button class="btn ghost sm" data-act="lookPhotoPick">Choose a different photo</button>' : ''}</div>
    ${slider('lkDim', 'Soften the background', 0, 60, 5, L.dim, '%')}
    ${slider('lkBlur', 'Blur the background', 0, 12, 1, L.blur, ' px')}
    <div class="stack-s"><div class="h3">Theme</div>${seg('lkTheme', [['system', 'Match device'], ['light', 'Light'], ['dark', 'Dark']], L.theme)}</div>
    <div class="stack-s"><div class="h3">Font</div><div class="font-list">${FONTS.map((f) => `<button type="button" class="chip font-chip" data-act="pick" data-group="lkFont" data-val="${f.id}" aria-pressed="${L.font === f.id ? 'true' : 'false'}" style="font-family:${esc(f.css)},system-ui">${esc(f.name)}</button>`).join('')}</div>
      <p class="tiny muted">Fonts other than the first, second and last download from Google Fonts the first time you pick them.</p></div>
    <div class="stack-s"><div class="h3">Text color</div><div class="chips">${INKS.filter(inkOk).map((k) => `<button type="button" class="chip ink-chip" data-act="pick" data-group="lkInk" data-val="${k.id}" aria-pressed="${L.ink === k.id ? 'true' : 'false'}"><i style="background:${isDark() ? k.dark : k.light}"></i>${esc(k.name)}</button>`).join('')}</div>
      <p class="tiny muted">Only colors with strong contrast on the cards (7:1 or better, in light and dark) are offered.</p></div>
    ${slider('lkSize', 'Text size', 90, 130, 5, L.size, '%')}
    <div class="stack-s"><div class="h3">Motion</div>${seg('lkMotion', [['device', 'Match device'], ['reduce', 'Reduce motion']], L.motion)}</div>
    <div class="btn-row sticky-actions"><button class="btn primary" data-act="lookApply">Apply</button><button class="btn" data-act="closeSheet">Cancel</button><button class="btn ghost sm" data-act="lookReset">Restore default</button></div>`;
}
function bindLookInputs() {
  for (const [id, k, unit] of [['lkDim', 'dim', '%'], ['lkBlur', 'blur', ' px'], ['lkSize', 'size', '%']]) {
    const el = document.getElementById(id); if (!el) continue;
    el.addEventListener('input', () => { LOOK_DRAFT[k] = Number(el.value); $('#' + id + 'V').textContent = el.value + unit; applyLook(LOOK_DRAFT); });
  }
  const f = $('#lkPhoto');
  if (f) f.addEventListener('change', (e) => { const file = e.target.files[0]; if (file) readPhoto(file); });
}
A.lookPhotoPick = () => { const f = $('#lkPhoto'); if (f) f.click(); };
function readPhoto(file) {
  const img = new Image(); const url = URL.createObjectURL(file);
  img.onload = async () => {
    const max = 1400; const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    BG_DATA = c.toDataURL('image/jpeg', 0.8); LOOK_DRAFT.bg = 'photo'; LOOK_DRAFT.dim = Math.max(LOOK_DRAFT.dim, 20);
    await Store.set(BG_KEY, BG_DATA); refreshSheet(); bindLookInputs(); applyLook(LOOK_DRAFT);
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast('That image couldn’t be read. Try a JPEG or PNG.'); };
  img.src = url;
}
A.lookApply = () => {
  const L = LOOK_DRAFT; S.settings.theme = L.theme;
  S.settings.look = { bg: L.bg, font: L.font, ink: L.ink, dim: L.dim, blur: L.blur, size: L.size, motion: L.motion };
  LOOK_DRAFT = null; SH.onClose = null; save(); closeSheet(); applyLook(); render(); toast('Look saved.');
};
A.lookReset = () => { LOOK_DRAFT = Object.assign({}, DEFAULT_LOOK); refreshSheet(); bindLookInputs(); applyLook(LOOK_DRAFT); toast('Default restored in the preview. Tap Apply to keep it.'); };
