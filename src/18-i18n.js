/* ---------- Interface translation ----------
   Screens are written with English interface text. After each render this layer swaps
   every fixed text run (and aria-label, placeholder, title) for its translation in the
   app language. User-written text in form fields, the founder letter and external
   resources (marked with a lang attribute) are left as they are. */
const I18N = __I18N__;
const I18N_IX = { es: 0, it: 1, fr: 2 };
const I18N_ATTRS = ['aria-label', 'placeholder', 'title', 'alt'];
let I18N_PATS = null;
function i18nPatterns() {
  if (I18N_PATS) return I18N_PATS;
  const escRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  I18N_PATS = Object.keys(I18N).filter((k) => /\{\d+\}/.test(k)).map((k) => {
    const lits = k.split(/\{\d+\}/);
    return { k, pre: lits[0], suf: lits[lits.length - 1], weight: lits.join('').length, re: new RegExp('^' + k.split(/(\{\d+\})/).map((x) => (/^\{\d+\}$/.test(x) ? '([\\s\\S]*?)' : escRe(x))).join('') + '$') };
  }).filter((p) => p.weight >= 3 && !(p.k.match(/\{\d+\}/g).length >= 3 && p.weight < 12)).sort((a, b) => b.weight - a.weight);
  return I18N_PATS;
}
function trText(s, depth) {
  const ix = I18N_IX[lang()]; if (ix == null || !s) return s;
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s); const core = m[2]; if (!core || !/[A-Za-z]/.test(core)) return s;
  const hit = I18N[core]; if (hit && hit[ix]) return m[1] + hit[ix] + m[3];
  const d = depth || 0;
  if (d > 3) return s;
  // A lower-case use of a capitalized phrase ("a realistic business block")
  if (/^\p{Ll}/u.test(core)) {
    const up = core.charAt(0).toUpperCase() + core.slice(1); const h2 = I18N[up];
    if (h2 && h2[ix]) return m[1] + h2[ix].charAt(0).toLocaleLowerCase(locale()) + h2[ix].slice(1) + m[3];
  }
  // A phrase with or without its closing period
  if (/\.$/.test(core) && I18N[core.slice(0, -1)] && I18N[core.slice(0, -1)][ix]) return m[1] + I18N[core.slice(0, -1)][ix].replace(/\.?$/, '.') + m[3];
  for (const p of i18nPatterns()) {
    if (!core.startsWith(p.pre) || !core.endsWith(p.suf)) continue;
    const mm = p.re.exec(core); if (!mm) continue;
    const tr = I18N[p.k][ix]; if (!tr) continue;
    return m[1] + tr.replace(/\{(\d+)\}/g, (_, n) => trText(mm[Number(n) + 1] || '', d + 1)) + m[3];
  }
  // Leading punctuation from a joined fragment (": one business name…")
  const lead = /^([:,;]\s)([\s\S]+)$/.exec(core);
  if (lead) { const r = trText(lead[2], d + 1); if (r !== lead[2]) return m[1] + lead[1] + r + m[3]; }
  // "Label: value" where each side is known on its own
  const kv = /^([^:]{2,40}): ([\s\S]+)$/.exec(core);
  if (kv) { const a = trText(kv[1], d + 1), b = trText(kv[2], d + 1); if (a !== kv[1] || b !== kv[2]) return m[1] + a + (ix === 2 ? '\u202f: ' : ': ') + b + m[3]; }
  // Meta lines joined with a middle dot: translate each part on its own
  if (core.includes(' · ')) { const parts = core.split(' · '); const out = parts.map((x) => trText(x, d + 1)); if (out.some((x, i) => x !== parts[i])) return m[1] + out.join(' · ') + m[3]; }
  return s;
}
/* Plain-text translation for strings that never reach the page as markup */
const tr = (s) => trText(s);
function i18nSkip(el) { return !el || !!el.closest('textarea,script,style,[data-raw],[lang]:not(html)'); }
function i18nEl(el) {
  if (i18nSkip(el)) return;
  for (const a of I18N_ATTRS) { const v = el.getAttribute(a); if (v) { const n = trText(v); if (n !== v) el.setAttribute(a, n); } }
}
function i18nTree(root) {
  if (lang() === 'en' || !root) return;
  if (root.nodeType === 3) { if (!i18nSkip(root.parentElement)) { const n = trText(root.nodeValue); if (n !== root.nodeValue) root.nodeValue = n; } return; }
  if (root.nodeType !== 1) return;
  if (i18nSkip(root)) return;
  i18nEl(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, { acceptNode: (n) => (n.nodeType === 1 && i18nSkip(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  let n;
  while ((n = w.nextNode())) {
    if (n.nodeType === 1) { i18nEl(n); continue; }
    const v = trText(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v;
  }
}
const I18N_OBS = new MutationObserver((recs) => {
  if (lang() === 'en') return;
  I18N_OBS.disconnect();
  for (const r of recs) {
    if (r.type === 'characterData') i18nTree(r.target);
    else r.addedNodes.forEach((n) => i18nTree(n));
  }
  i18nWatch();
});
function i18nWatch() { I18N_OBS.observe(document.body, { childList: true, subtree: true, characterData: true }); }
i18nWatch();
