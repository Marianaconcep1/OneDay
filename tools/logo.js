// Draws the One Day logo (an amethyst crystal with the sun rising behind it)
// and renders the app icons. Run: node tools/logo.js
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');

// The mark itself on a 512 grid, centred on x=256. `id` keeps gradient ids unique when inlined.
function mark(id) {
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2, long = i % 2 === 0;
    const r1 = 150, r2 = long ? 205 : 182, cx = 256, cy = 212;
    const p = (r) => `${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
    return `<path d="M${p(r1)}L${p(r2)}"/>`;
  }).join('');
  // One hexagonal crystal point: tip, shoulders, base, split into three lit faces
  const crystal = (tx, ty, w, sh, h, rot, ox, oy) => {
    const l = tx - w / 2, r = tx + w / 2, ml = tx - w / 6, mr = tx + w / 6, s = ty + sh, b = ty + h;
    return `<g transform="rotate(${rot} ${ox} ${oy})">
      <path fill="url(#${id}l)" d="M${l} ${s}L${ml} ${s + 10}V${b + 6}L${l} ${b}Z"/>
      <path fill="url(#${id}c)" d="M${ml} ${s + 10}H${mr}V${b + 6}H${ml}Z"/>
      <path fill="url(#${id}r)" d="M${mr} ${s + 10}L${r} ${s}V${b}L${mr} ${b + 6}Z"/>
      <path fill="#E9DCFF" d="M${l} ${s}L${tx} ${ty}L${ml} ${s + 10}Z"/>
      <path fill="#C7AEF5" d="M${ml} ${s + 10}L${tx} ${ty}L${mr} ${s + 10}Z"/>
      <path fill="#8E68D2" d="M${mr} ${s + 10}L${tx} ${ty}L${r} ${s}Z"/>
      <path fill="#fff" opacity=".5" d="M${ml + 4} ${s + 24}h4V${s + 24 + (h - sh) * .45}h-4Z"/>
    </g>`;
  };
  return `<defs>
    <radialGradient id="${id}g" cx="256" cy="212" r="230" gradientUnits="userSpaceOnUse"><stop offset=".45" stop-color="#FFD98A" stop-opacity=".55"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}s" cx="236" cy="190" r="150" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFF1C4"/><stop offset=".6" stop-color="#FFCB6B"/><stop offset="1" stop-color="#F6A35E"/></radialGradient>
    <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B593F0"/><stop offset="1" stop-color="#7A52C4"/></linearGradient>
    <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A72DE"/><stop offset="1" stop-color="#5E3AA6"/></linearGradient>
    <linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6B44B5"/><stop offset="1" stop-color="#3F2580"/></linearGradient>
  </defs>
  <circle cx="256" cy="212" r="230" fill="url(#${id}g)"/>
  <g stroke="#FFD27A" stroke-width="12" stroke-linecap="round">${rays}</g>
  <circle cx="256" cy="212" r="132" fill="url(#${id}s)"/>
  ${crystal(178, 238, 62, 52, 172, -20, 190, 420)}
  ${crystal(336, 222, 66, 56, 186, 18, 320, 420)}
  ${crystal(256, 104, 92, 78, 310, 0, 256, 420)}
  <path fill="#3A2466" d="M112 438L138 404L192 392L256 398L322 390L372 402L402 436L372 456H140Z"/>
  <path fill="#563A8E" d="M138 404L192 392L256 398L322 390L372 402L330 414L256 410L186 416Z"/>
  <path fill="#2C1A52" d="M256 410L330 414L372 402L402 436L372 456H262Z"/>`;
}

// Full app icon: dusk-to-dawn sky behind the mark; `scale` keeps maskable art in the safe zone
function icon(scale = 0.9) {
  const t = 256 - 256 * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4B3E7E"/><stop offset=".6" stop-color="#7A62A8"/><stop offset="1" stop-color="#D79BB8"/></linearGradient></defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(${t} ${t + 14 * scale}) scale(${scale})">${mark('i')}</g></svg>`;
}

// Bare mark for use inside the app (no background square)
const inline = `<svg viewBox="40 -4 432 466" aria-hidden="true" focusable="false">${mark('odm')}</svg>`.replace(/\s*\n\s*/g, ' ');

if (require.main === module) {
  (async () => {
    fs.writeFileSync(path.join(ROOT, 'icons', 'logo.svg'), icon(0.9));
    fs.writeFileSync(path.join(ROOT, 'src', 'logo.svg'), inline);
    const { chromium } = require('playwright');
    const b = await chromium.launch(), pg = await b.newPage();
    for (const [file, size, scale] of [['icon-512.png', 512, 0.9], ['icon-192.png', 192, 0.9], ['apple-touch-icon.png', 180, 0.86], ['icon-maskable-512.png', 512, 0.72]]) {
      await pg.setViewportSize({ width: size, height: size });
      await pg.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${icon(scale)}`);
      await pg.screenshot({ path: path.join(ROOT, 'icons', file) });
    }
    await b.close(); console.log('icons written');
  })();
}
module.exports = { icon, inline };
