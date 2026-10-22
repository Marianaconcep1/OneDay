// Collects translatable UI text from the app source (fixed text runs, with {0} placeholders for expressions)
const ts = require('/opt/node22/lib/node_modules/typescript');
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /^(0[2-9]|1[0-6])-.*\.js$/.test(f) || f === '03-ui.js');
const out = new Map(); // text -> Set(files)
const SKIP_CALLS = new Set(['t', '$', '$$', 'getPick', 'getPicks', 'val', 'show', 'querySelector', 'querySelectorAll', 'getElementById', 'addEventListener', 'setAttribute', 'getAttribute', 'removeAttribute', 'classList', 'add', 'remove', 'toggle', 'matchMedia', 'split', 'join', 'replace', 'includes', 'startsWith', 'endsWith', 'get', 'set', 'del', 'createElement', 'dispatchEvent', 'emulate']);
const looksText = (s0) => { const s = s0.replace(/\{\d+\}/g, 'X'); return /[A-Za-z]{2}/.test(s) && (/\s/.test(s.trim()) || /^[A-Z][a-z]/.test(s.trim())) && !/^[a-z][\w-]*(\s[a-z][\w-]*)*$/.test(s.trim()) && !/[{};=]\s*$/.test(s.trim()) && !/^(https?:|\.\/|#|data:)/.test(s.trim()) && !/^[\w-]+:\s*\S+;?$/.test(s.trim()) && !/\b(var\(--|px\b|rgba?\(|translate|solid|cubic-bezier)/.test(s); };
function add(s, f) {
  s = s.replace(/\s+/g, ' ').trim();
  if (!s || s.length < 2 || !looksText(s)) return;
  if (/^[\s{}\d·,.:;()+–-]*$/.test(s)) return;
  if (!out.has(s)) out.set(s, new Set()); out.get(s).add(f);
}
function fromMarkup(str, f) {
  // attributes people read
  str.replace(/\b(aria-label|placeholder|title|alt)="([^"]*)"/g, (_, a, v) => { add(v, f); return ''; });
  // text runs between tags
  str.replace(/<[^>]*>/g, '\u0000').split('\u0000').forEach((r) => add(r, f));
}
for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true);
  const visit = (n) => {
    if (ts.isCallExpression(n)) {
      const e = n.expression; const nm = ts.isIdentifier(e) ? e.text : ts.isPropertyAccessExpression(e) ? e.name.text : '';
      if (SKIP_CALLS.has(nm)) { visit(n.expression); n.arguments.forEach((a) => { if (!ts.isStringLiteral(a) && !ts.isNoSubstitutionTemplateLiteral(a)) visit(a); }); return; }
    }
    if (ts.isElementAccessExpression(n) || (ts.isPropertyAssignment(n) && false)) {}
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      const p = n.parent;
      if (p && ts.isPropertyAssignment(p) && p.name === n) return; // object keys
      if (p && (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(p.operatorToken.kind))) return;
      if (p && ts.isCaseClause(p)) return;
      if (p && ts.isElementAccessExpression(p)) return;
      fromMarkup(n.text, f); return;
    }
    const isPlus = (x) => ts.isBinaryExpression(x) && x.operatorToken.kind === ts.SyntaxKind.PlusToken;
    const isStr = (x) => ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x);
    if (isPlus(n) && !(n.parent && isPlus(n.parent))) {
      const parts = []; const flat = (x) => { if (isPlus(x)) { flat(x.left); flat(x.right); } else parts.push(x); };
      flat(n);
      if (parts.some(isStr)) {
        let s = ''; let i = 0;
        for (const x of parts) { if (isStr(x)) s += x.text; else { s += '{' + (i++) + '}'; visit(x); } }
        emitRuns(s, f); return;
      }
    }
    if (ts.isTemplateExpression(n)) {
      let s = n.head.text; n.templateSpans.forEach((sp, i) => { s += '{' + i + '}' + sp.literal.text; visit(sp.expression); });
      emitRuns(s, f); return;
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
function emitRuns(s, f) {
      const runs = []; s.replace(/\b(aria-label|placeholder|title|alt)="([^"]*)"/g, (_, a, v) => { runs.push(v); return ''; });
      s.replace(/<[^>]*>/g, '\u0000').split('\u0000').forEach((r) => runs.push(r));
      for (let r of runs) { let k = 0; const map = {}; r = r.replace(/\{(\d+)\}/g, (m, d) => { if (!(d in map)) map[d] = k++; return '{' + map[d] + '}'; }); add(r, f); }
}
const arr = [...out.entries()].map(([s, fs2]) => ({ s, f: [...fs2].join(',') }));
fs.writeFileSync(path.join(__dirname, 'strings.json'), JSON.stringify(arr, null, 1));
console.log(arr.length);
