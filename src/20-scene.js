/* ---------- Illustrated scenes: layered SVG, parts animated separately ----------
   Movement is CSS on individual parts (leaves, stems, the caretaker's torso, arm and can),
   so the picture never bounces as a whole. Everything moves only under .scene.anim, which is
   left off when motion is reduced. Loops either alternate or start and end on the resting
   pose, so they join without a seam. Shapes are drawn in absolute scene coordinates and
   rotate around fixed points (transform-box: view-box) to keep the joints steady. */
let SCENE_N = 0;
const SCENE_W = 360, SCENE_H = 280;
function drawScene(kind, stage, seed, moving, caretaker) {
  return kind === 'bonsai' ? drawBonsaiScene(stage, seed, moving, caretaker) : kind === 'farm' ? drawFarmScene(stage, seed, moving, caretaker) : drawGardenScene(stage, seed, moving, caretaker);
}
function sceneOpen(id, moving) {
  return `<svg class="scene ${moving ? 'anim' : ''}" viewBox="0 50 ${SCENE_W} ${SCENE_H - 50}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--gs-sky1)"/><stop offset="1" stop-color="var(--gs-sky2)"/></linearGradient>
      <linearGradient id="${id}soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--gs-soil)"/><stop offset="1" stop-color="var(--gs-soil2)"/></linearGradient>
      <radialGradient id="${id}sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="var(--gs-sun)" stop-opacity=".9"/><stop offset="1" stop-color="var(--gs-sun)" stop-opacity="0"/></radialGradient></defs>`;
}
/* Shared sky, sun, drifting clouds, hills and lawn, so all three scenes feel like one place */
function sceneBackdrop(id, r, skipTuft) {
  const W = SCENE_W, H = SCENE_H;
  let g = `<rect width="${W}" height="${H}" fill="url(#${id}sky)"/>
    <circle cx="300" cy="92" r="40" fill="url(#${id}sun)"/><circle cx="300" cy="92" r="14" fill="var(--gs-sun)" opacity=".85"/>
    <g class="gs-cloud" style="--dur:38s"><path d="M42 98 q6 -14 22 -9 q8 -10 20 -2 q14 -2 14 10 q-1 7 -10 7 h-42 q-10 0 -4 -6z" fill="var(--gs-cloud)"/></g>
    <g class="gs-cloud" style="--dur:52s;--dx:-10px"><path d="M190 80 q5 -10 17 -7 q7 -8 16 -1 q11 -1 11 8 q-1 5 -8 5 h-33 q-8 0 -3 -5z" fill="var(--gs-cloud)" opacity=".8"/></g>
    <path d="M0 150 Q 70 112 150 138 T 360 126 V${H} H0Z" fill="var(--gs-hill2)"/>
    <path d="M0 176 Q 96 142 204 168 T 360 158 V${H} H0Z" fill="var(--gs-hill1)"/>
    <rect y="186" width="${W}" height="${H - 186}" fill="var(--gs-grass)"/>
    <path d="M0 186 H${W} V192 Q 180 198 0 192Z" fill="var(--gs-grass2)" opacity=".7"/>`;
  for (let i = 0; i < 16; i++) { const x = 8 + r() * 344, y = 200 + r() * 74; if (skipTuft(x, y)) continue; g += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} l2 -6 l1.5 6 l2 -5 l1 5" stroke="var(--gs-grass3)" stroke-width="1.2" fill="none" stroke-linecap="round"/>`; }
  return g;
}
function drawGardenScene(stage, seed, moving, caretaker) {
  const r = rng(seed || 7); const id = 'gs' + (++SCENE_N);
  const W = 360, H = 280, bedL = 104, bedR = 300, soilY = 214;
  let g = sceneOpen(id, moving) + sceneBackdrop(id, r, (x, y) => x > bedL - 10 && x < bedR + 10 && y < 252);
  if (stage >= 14) g += `<g><rect x="30" y="134" width="3" height="58" fill="var(--gs-wood2)"/><path d="M20 140 l11.5 -12 l11.5 12z" fill="var(--g-barn)"/><rect x="22" y="139" width="19" height="15" rx="2" fill="var(--gs-wood)"/><circle cx="31.5" cy="146" r="3" fill="var(--gs-wood2)"/></g>`;
  if (stage >= 8) { // a trellis with a climbing vine behind the right end of the bed
    g += `<g stroke="var(--gs-wood2)" stroke-width="2.2" fill="none"><path d="M284 200 V128 M312 200 V128 M280 136 H316 M280 156 H316 M280 176 H316"/></g>
      <path d="M288 200 C 280 180 300 168 292 150 S 306 128 300 120" stroke="var(--gs-stem)" stroke-width="2" fill="none"/>`;
    [[290, 182, -30], [296, 164, 25], [291, 146, -20], [301, 128, 30]].forEach(([x, y, a], i) => { g += `<g transform="translate(${x} ${y}) rotate(${a})"><path class="gs-leaf" style="--dur:${5 + i}s;--delay:-${i}s" d="M0 0 C 4 -5 11 -5 14 0 C 11 4 4 4 0 0Z" fill="var(--gs-leaf2)"/></g>`; });
    if (stage >= 9) g += `<circle cx="306" cy="140" r="3.2" fill="var(--gs-petal2)"/><circle cx="286" cy="170" r="3" fill="var(--gs-petal2)"/>`;
  }
  // the raised bed: wooden frame, soil with texture, and the patch that darkens when watered
  g += `<rect x="${bedL - 6}" y="194" width="${bedR - bedL + 12}" height="56" rx="10" fill="var(--gs-wood)"/>
    <rect x="${bedL - 6}" y="236" width="${bedR - bedL + 12}" height="14" rx="6" fill="var(--gs-wood2)" opacity=".55"/>
    <rect x="${bedL}" y="200" width="${bedR - bedL}" height="40" rx="7" fill="url(#${id}soil)"/>`;
  for (let i = 0; i < 26; i++) g += `<circle cx="${(bedL + 6 + r() * (bedR - bedL - 12)).toFixed(1)}" cy="${(205 + r() * 30).toFixed(1)}" r="${(0.8 + r() * 1.1).toFixed(1)}" fill="var(--gs-soil2)" opacity=".7"/>`;
  if (caretaker) g += `<ellipse class="gs-wet" cx="136" cy="216" rx="24" ry="6" fill="var(--gs-wet)"/>`;
  if (stage === 0) for (let i = 0; i < 3; i++) g += `<path d="M${bedL + 14} ${210 + i * 9} Q ${(bedL + bedR) / 2} ${206 + i * 9} ${bedR - 14} ${210 + i * 9}" stroke="var(--gs-soil2)" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  // plants: each sways on its own, and each leaf flutters on its own
  const n = stage === 0 ? 0 : Math.min(9, stage + 1);
  const flowers = stage < 5 ? 0 : stage === 5 ? 1 : stage < 9 ? Math.min(n, stage - 3) : n;
  for (let i = 0; i < n; i++) {
    const x = bedL + 18 + i * ((bedR - bedL - 36) / Math.max(1, 8)) + (r() - 0.5) * 6;
    const h = (stage <= 1 ? 8 : 14 + Math.min(66, stage * 5.2)) * (0.72 + r() * 0.28);
    const bend = (r() - 0.5) * 10; const top = [x + bend, soilY - h];
    let p = `<g class="gs-plant" style="--dur:${(6 + r() * 3).toFixed(1)}s;--delay:-${(r() * 6).toFixed(1)}s">
      <path d="M${x.toFixed(1)} ${soilY} Q ${(x + bend * 0.2).toFixed(1)} ${(soilY - h * 0.55).toFixed(1)} ${top[0].toFixed(1)} ${top[1].toFixed(1)}" stroke="var(--gs-stem)" stroke-width="${stage < 3 ? 1.6 : 2.2}" fill="none" stroke-linecap="round"/>`;
    const leaves = stage <= 1 ? [[0.9, -1]] : stage < 6 ? [[0.38, -1], [0.62, 1]] : [[0.3, -1], [0.52, 1], [0.74, -1]];
    leaves.forEach(([f, side], j) => {
      const lx = x + bend * f * f, ly = soilY - h * f; const sz = stage <= 1 ? 0.55 : Math.min(1.25, 0.6 + stage * 0.07);
      p += `<g transform="translate(${lx.toFixed(1)} ${ly.toFixed(1)}) rotate(${side < 0 ? 200 + r() * 20 : -20 - r() * 20}) scale(${sz.toFixed(2)})"><path class="gs-leaf" style="--dur:${(3.8 + r() * 2.4).toFixed(1)}s;--delay:-${(r() * 4).toFixed(1)}s" d="M0 0 C 5 -7 15 -7 20 0 C 15 6 5 6 0 0Z" fill="${(i + j) % 3 ? 'var(--gs-leaf)' : 'var(--gs-leaf2)'}"/><path d="M1 0 H17" stroke="var(--gs-vein)" stroke-width=".7" opacity=".6"/></g>`;
    });
    if (i < flowers || (stage === 4 && i === 2)) {
      const [cx, cy] = top; const col = i % 3 === 1 ? 'var(--gs-petal2)' : i % 3 === 2 ? 'var(--gs-petal3)' : 'var(--gs-petal1)';
      if (stage === 4) p += `<ellipse cx="${cx.toFixed(1)}" cy="${(cy - 3).toFixed(1)}" rx="3" ry="4.5" fill="${col}"/>`;
      else { const pr = Math.min(7, 4 + stage * 0.25); p += `<g>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${cx.toFixed(1)}" cy="${(cy - pr * 0.8).toFixed(1)}" rx="${(pr * 0.55).toFixed(1)}" ry="${pr.toFixed(1)}" transform="rotate(${a + i * 11} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="${col}"/>`).join('')}<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(pr * 0.45).toFixed(1)}" fill="var(--gs-center)"/></g>`; }
    }
    g += p + '</g>';
  }
  if (stage >= 7) for (let i = 0; i < 7; i++) { const x = bedL + 10 + i * 30 + r() * 6; g += `<g class="gs-plant" style="--dur:${(7 + r() * 3).toFixed(1)}s;--delay:-${(r() * 5).toFixed(1)}s"><circle cx="${x.toFixed(1)}" cy="236" r="7" fill="var(--gs-leaf2)"/><circle cx="${(x + 5).toFixed(1)}" cy="233" r="5" fill="var(--gs-leaf)"/>${stage >= 13 ? `<circle cx="${(x + 2).toFixed(1)}" cy="230" r="2.4" fill="var(--gs-petal${1 + (i % 3)})"/>` : ''}</g>`; }
  if (stage >= 10) [[76, 272, 13], [100, 262, 11], [124, 256, 9]].forEach(([x, y, w]) => { g += `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${(w * 0.42).toFixed(1)}" fill="var(--gs-stone)"/><ellipse cx="${x - 2}" cy="${y - 1.5}" rx="${(w * 0.6).toFixed(1)}" ry="${(w * 0.2).toFixed(1)}" fill="#fff" opacity=".18"/>`; });
  if (stage >= 12) g += `<g><rect x="306" y="236" width="44" height="5" rx="2" fill="var(--gs-wood)"/><rect x="306" y="226" width="44" height="4" rx="2" fill="var(--gs-wood)"/><rect x="309" y="241" width="3.5" height="14" fill="var(--gs-wood2)"/><rect x="343" y="241" width="3.5" height="14" fill="var(--gs-wood2)"/><rect x="309" y="226" width="3" height="12" fill="var(--gs-wood2)"/><rect x="343" y="226" width="3" height="12" fill="var(--gs-wood2)"/></g>`;
  if (stage >= 11 && moving) [[200, 150, 0], [250, 140, -3]].forEach(([x, y, b]) => { g += `<g><animateMotion dur="9s" begin="${b}s" repeatCount="indefinite" path="M${x} ${y} c 18 -12 36 8 18 18 c -18 10 -36 -8 -18 -18z"/><ellipse rx="3" ry="2.2" fill="var(--gs-bee)"/><path d="M-1 -2.2 v4.4 M1 -2.2 v4.4" stroke="var(--gs-ink)" stroke-width=".8"/><ellipse cx="0" cy="-3" rx="2.2" ry="1.4" fill="#fff" opacity=".7"/></g>`; });
  if (caretaker) g += drawGardener();
  return g + '</svg>';
}

/* The gardener: torso leans from the hips, the arm lifts the can from the shoulder,
   the can tips at the hand, water falls to the soil, then everything settles back. */
function drawGardener(tool) {
  const hoe = tool === 'hoe';
  return `<g class="gd ${hoe ? 'hoe' : ''}">
    <ellipse cx="72" cy="252" rx="20" ry="3.5" fill="var(--gs-ink)" opacity=".12"/>
    <rect x="62" y="226" width="6" height="24" rx="3" fill="var(--ct-pants)"/><rect x="75" y="226" width="6" height="24" rx="3" fill="var(--ct-pants)"/>
    <ellipse cx="64" cy="250.5" rx="6.5" ry="3" fill="var(--ct-shoe)"/><ellipse cx="79" cy="250.5" rx="6.5" ry="3" fill="var(--ct-shoe)"/>
    <g class="gd-torso">
      <path d="M62 196 Q 56 208 58 218" stroke="var(--ct-cloth2)" stroke-width="5.5" fill="none" stroke-linecap="round"/><circle cx="58.3" cy="219.5" r="2.6" fill="var(--ct-skin)"/>
      <path d="M58 229 Q 56 202 64 192 L 80 192 Q 88 202 86 229 Z" fill="var(--ct-cloth)"/>
      <path d="M64.5 204 L 80 204 Q 82.5 217 81 229 L 63 229 Q 61.5 217 64.5 204Z" fill="var(--ct-apron)"/>
      <path d="M66 214 h10 v6 q-5 2 -10 0z" fill="var(--ct-apron2)"/>
      <path d="M64.5 204 L 68 193 M80 204 L 76 193" stroke="var(--ct-apron)" stroke-width="1.6"/>
      <rect x="69.5" y="185" width="5" height="8" rx="2" fill="var(--ct-skin)"/>
      <path d="M62 171 q -8 6 -3 15 q 6 1 8 -6z" fill="var(--ct-hair)"/>
      <circle cx="72.5" cy="178" r="9" fill="var(--ct-skin)"/>
      <path d="M64 175 q 2 -8 10 -8 q -3 5 -10 8z" fill="var(--ct-hair)"/>
      <path d="M76 176.5 q 1.6 -1.4 3.2 0" stroke="var(--gs-ink)" stroke-width="1.1" fill="none" stroke-linecap="round"/>
      <circle cx="78.5" cy="181" r="1.8" fill="var(--ct-blush)" opacity=".55"/>
      <path d="M79 183.5 q 1.5 .8 3 -.4" stroke="var(--gs-ink)" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/>
      <ellipse cx="72" cy="170" rx="16" ry="3.6" fill="var(--ct-hat)"/>
      <path d="M63.5 170 Q 64.5 159.5 72 158.5 Q 79.5 159.5 80.5 170Z" fill="var(--ct-hat)"/>
      <path d="M64 167 Q 72 169.5 80 167 L 80.3 169.3 Q 72 171.5 63.8 169.3Z" fill="var(--ct-band)"/>
      <g class="gd-arm">
        <path d="M79 195 Q 84 203 87 210" stroke="var(--ct-cloth)" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M87 210 L 92 214" stroke="var(--ct-skin)" stroke-width="4" stroke-linecap="round"/>
        ${hoe ? `<g class="gd-hoe">
          <path d="M84 196 L 106 240" stroke="var(--gs-wood)" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M84 196 L 92 212" stroke="#fff" stroke-width=".8" opacity=".25"/>
          <path d="M101 242 L 113 237.5" stroke="var(--ct-tool)" stroke-width="4.5" stroke-linecap="round"/>
        </g>` : `<g class="gd-can">
          <path d="M89 216 q 5 -8 12 -1" stroke="var(--ct-tool2)" stroke-width="2" fill="none"/>
          <path d="M86 216 h 19 l -1.5 14 q -8 2.5 -16 0z" fill="var(--ct-tool)"/>
          <path d="M88 219 h 15" stroke="#fff" stroke-width="1.2" opacity=".35"/>
          <path d="M104 222 L 118 212" stroke="var(--ct-tool)" stroke-width="3" stroke-linecap="round"/>
          <ellipse cx="119.5" cy="211" rx="2.2" ry="3.4" transform="rotate(-35 119.5 211)" fill="var(--ct-tool2)"/>
        </g>`}
        <circle cx="92.5" cy="214.5" r="2.8" fill="var(--ct-skin)"/>
      </g>
    </g>
    ${hoe ? `<g class="gd-puff">${[[108, 242, 2.4], [113, 240, 1.8], [103, 240, 1.6]].map(([x, y, rr], i) => `<circle class="gd-crumb" style="--i:${i}" cx="${x}" cy="${y}" r="${rr}" fill="var(--gs-soil)"/>`).join('')}</g>` : `<g class="gd-water">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path class="gd-drop" style="--delay:-${(i * 0.1).toFixed(2)}s;--x:${(i % 4) * 1.8 - 2.7}px" d="M${(129.5 + (i % 4) * 1.5).toFixed(1)} 193 q 1.9 2.8 0 4.6 q -1.9 -1.8 0 -4.6z" fill="var(--ct-water)"/>`).join('')}</g>`}
  </g>`;
}

/* Bonsai: a pot on a low wooden stand, trunk and foliage pads that grow with each stage.
   Each pad sways on its own; the caretaker sits on a stool and waters with a long-spouted can. */
function drawBonsaiScene(stage, seed, moving, caretaker) {
  const r = rng((seed || 7) + 3); const id = 'gs' + (++SCENE_N);
  const bx = 218, by = 199;
  let g = sceneOpen(id, moving) + sceneBackdrop(id, r, (x, y) => x > 140 && x < 300 && y < 256);
  if (stage >= 14) g += `<g><rect x="318" y="226" width="16" height="24" rx="2" fill="var(--gs-stone)"/><path d="M312 228 h28 l-6 -8 h-16z" fill="var(--gs-stone)"/><rect x="322" y="232" width="8" height="7" fill="var(--gs-sun)" opacity=".7"/><path d="M314 250 h24" stroke="var(--gs-wood2)" stroke-width="3" stroke-linecap="round"/></g>`;
  // stand and pot
  g += `<ellipse cx="220" cy="252" rx="78" ry="5" fill="var(--gs-ink)" opacity=".1"/>
    <rect x="158" y="226" width="6" height="25" rx="2" fill="var(--gs-wood2)"/><rect x="276" y="226" width="6" height="25" rx="2" fill="var(--gs-wood2)"/>
    <rect x="150" y="219" width="140" height="8" rx="3" fill="var(--gs-wood)"/><path d="M152 221 h136" stroke="#fff" stroke-width=".8" opacity=".2"/>
    <path d="M174 205 H262 L254 220 H182Z" fill="var(--g-pot)"/><path d="M178 210 H258" stroke="#fff" stroke-width="1" opacity=".18"/>
    <rect x="170" y="198" width="96" height="8" rx="3" fill="var(--g-pot-rim)"/>
    <ellipse cx="${bx}" cy="${by}" rx="44" ry="2.6" fill="var(--gs-soil2)"/>`;
  if (caretaker) g += `<ellipse class="gs-wet" style="--dur:12s" cx="186" cy="199.5" rx="12" ry="2" fill="var(--gs-wet)"/>`;
  if (stage === 0) g += `<ellipse cx="${bx}" cy="${by - 2}" rx="4" ry="2.6" fill="var(--gs-wood2)"/>`;
  if (stage >= 1) {
    const h = Math.min(92, 10 + stage * 6.2); const w = Math.min(11, 1.6 + stage * 0.72); const lean = (r() - 0.5) * 14;
    const P = [[bx, by], [bx - 10 - lean, by - h * 0.35], [bx + 12 + lean, by - h * 0.7], [bx + lean * 0.4, by - h]];
    const at = (t) => { const u = 1 - t; return [0, 1].map((k) => u * u * u * P[0][k] + 3 * u * u * t * P[1][k] + 3 * u * t * t * P[2][k] + t * t * t * P[3][k]); };
    // tapered trunk: two offset curves
    const side = (d, f) => P.map(([x, y], i) => [x + d * (1 - i / 3 * f), y]);
    const L = side(-w / 2, 0.75), R = side(w / 2, 0.75);
    g += `<path d="M${L[0][0].toFixed(1)} ${L[0][1]} C ${L[1][0].toFixed(1)} ${L[1][1].toFixed(1)}, ${L[2][0].toFixed(1)} ${L[2][1].toFixed(1)}, ${L[3][0].toFixed(1)} ${L[3][1].toFixed(1)} L ${R[3][0].toFixed(1)} ${R[3][1].toFixed(1)} C ${R[2][0].toFixed(1)} ${R[2][1].toFixed(1)}, ${R[1][0].toFixed(1)} ${R[1][1].toFixed(1)}, ${R[0][0].toFixed(1)} ${R[0][1]} Z" fill="var(--g-trunk)"/>`;
    if (stage >= 6) g += `<path d="M${(bx - w * 0.2).toFixed(1)} ${by - 4} C ${(P[1][0] + 1).toFixed(1)} ${(P[1][1] + 6).toFixed(1)}, ${(P[2][0] - 2).toFixed(1)} ${(P[2][1] + 8).toFixed(1)}, ${(P[3][0] - 1).toFixed(1)} ${(P[3][1] + 10).toFixed(1)}" stroke="#fff" stroke-width="1" fill="none" opacity=".16"/>`;
    if (stage <= 2) {
      const [tx, ty] = P[3];
      [[-1, 0], [1, 1]].forEach(([d, j]) => { g += `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) rotate(${d < 0 ? 200 : -20}) scale(${(0.5 + stage * 0.15).toFixed(2)})"><path class="gs-leaf" style="--dur:${4 + j}s" d="M0 0 C 5 -7 15 -7 20 0 C 15 6 5 6 0 0Z" fill="var(--gs-leaf)"/></g>`; });
    } else {
      const nb = Math.min(6, Math.floor(stage / 2)); const pads = [];
      for (let i = 0; i < nb; i++) {
        const t = 0.42 + 0.5 * (i / Math.max(1, nb)); const [x0, y0] = at(t); const dir = i % 2 ? 1 : -1;
        const len = 14 + r() * 10 + stage * 1.6; const x2 = x0 + dir * len, y2 = y0 - 5 - r() * 8;
        g += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} Q ${(x0 + dir * len * 0.5).toFixed(1)} ${(y0 + 3).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="var(--g-trunk)" stroke-width="${Math.max(1.4, w * 0.42).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
        pads.push([x2, y2, 9 + stage * 0.9 + r() * 4]);
      }
      pads.push([P[3][0], P[3][1] - 2, 8 + stage * 1.1]);
      pads.forEach(([x, y, rr], i) => {
        let pad = `<g class="gs-pad" style="--dur:${(6.5 + r() * 3).toFixed(1)}s;--delay:-${(r() * 5).toFixed(1)}s">`;
        pad += `<ellipse cx="${x.toFixed(1)}" cy="${(y + 1.5).toFixed(1)}" rx="${(rr * 1.05).toFixed(1)}" ry="${(rr * 0.5).toFixed(1)}" fill="var(--gs-stem)"/>`;
        for (let k = 0; k < 4; k++) { const ox = (k - 1.5) * rr * 0.42, oy = -rr * 0.18 - (k % 2) * rr * 0.12; pad += `<ellipse cx="${(x + ox).toFixed(1)}" cy="${(y + oy).toFixed(1)}" rx="${(rr * 0.46).toFixed(1)}" ry="${(rr * 0.34).toFixed(1)}" fill="${k % 2 ? 'var(--gs-leaf2)' : 'var(--gs-leaf)'}"/>`; }
        if (stage >= 12) for (let k = 0; k < 3; k++) pad += `<circle cx="${(x + (k - 1) * rr * 0.5).toFixed(1)}" cy="${(y - rr * 0.25 - (k % 2) * 2).toFixed(1)}" r="1.8" fill="var(--gs-petal1)"/>`;
        g += pad + '</g>';
      });
    }
    if (stage >= 11) for (let i = 0; i < 6; i++) g += `<ellipse cx="${(bx - 30 + i * 12 + r() * 4).toFixed(1)}" cy="${by - 0.5}" rx="${(4 + r() * 3).toFixed(1)}" ry="2" fill="var(--g-moss)"/>`;
    if (stage >= 12 && moving) g += `<ellipse class="gs-petal" cx="${(bx + 20).toFixed(1)}" cy="${(by - h).toFixed(1)}" rx="1.8" ry="1.2" fill="var(--gs-petal1)"/>`;
  }
  if (caretaker) g += drawSitter();
  return g + '</svg>';
}
/* Seated caretaker: leans from the hips, lifts a small long-spouted can, a few drops fall into the pot */
function drawSitter() {
  return `<g class="sz">
    <ellipse cx="124" cy="252" rx="22" ry="3.5" fill="var(--gs-ink)" opacity=".12"/>
    <rect x="104" y="228" width="4" height="23" rx="1.5" fill="var(--gs-wood2)"/><rect x="126" y="228" width="4" height="23" rx="1.5" fill="var(--gs-wood2)"/>
    <rect x="100" y="224" width="34" height="6" rx="2.5" fill="var(--gs-wood)"/>
    <path d="M110 222 L 134 222 Q 140 223 139 230 L 139 248" stroke="var(--ct-pants)" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="142" cy="250" rx="6.5" ry="3" fill="var(--ct-shoe)"/>
    <g class="sz-torso">
      <path d="M108 200 Q 103 211 108 219" stroke="var(--ct-cloth2)" stroke-width="5.5" fill="none" stroke-linecap="round"/>
      <path d="M104 225 Q 102 200 110 192 L 126 192 Q 134 202 132 225 Z" fill="var(--ct-cloth)"/>
      <path d="M110.5 204 L 126 204 Q 128.5 215 127 225 L 109 225 Q 107.5 215 110.5 204Z" fill="var(--ct-apron)"/>
      <path d="M110.5 204 L 114 193 M126 204 L 122 193" stroke="var(--ct-apron)" stroke-width="1.6"/>
      <rect x="115.5" y="185" width="5" height="8" rx="2" fill="var(--ct-skin)"/>
      <path d="M108 171 q -8 6 -3 15 q 6 1 8 -6z" fill="var(--ct-hair)"/>
      <circle cx="118.5" cy="178" r="9" fill="var(--ct-skin)"/>
      <path d="M110 175 q 2 -8 10 -8 q -3 5 -10 8z" fill="var(--ct-hair)"/>
      <path d="M122 176.5 q 1.6 -1.4 3.2 0" stroke="var(--gs-ink)" stroke-width="1.1" fill="none" stroke-linecap="round"/>
      <circle cx="124.5" cy="181" r="1.8" fill="var(--ct-blush)" opacity=".55"/>
      <path d="M125 183.5 q 1.5 .8 3 -.4" stroke="var(--gs-ink)" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/>
      <ellipse cx="118" cy="170" rx="16" ry="3.6" fill="var(--ct-hat)"/>
      <path d="M109.5 170 Q 110.5 159.5 118 158.5 Q 125.5 159.5 126.5 170Z" fill="var(--ct-hat)"/>
      <path d="M110 167 Q 118 169.5 126 167 L 126.3 169.3 Q 118 171.5 109.8 169.3Z" fill="var(--ct-band)"/>
      <g class="sz-arm">
        <path d="M124 196 Q 129 206 131 213" stroke="var(--ct-cloth)" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M131 213 L 134 218" stroke="var(--ct-skin)" stroke-width="4" stroke-linecap="round"/>
        <g class="sz-can">
          <path d="M131 216 q 5 -6 11 -1" stroke="var(--ct-tool2)" stroke-width="1.8" fill="none"/>
          <path d="M129 216 h 15 l -1.2 9 q -6 2 -12.6 0z" fill="var(--ct-tool)"/>
          <path d="M131 218.5 h 11" stroke="#fff" stroke-width="1" opacity=".35"/>
          <path d="M143 219 L 166 205.5" stroke="var(--ct-tool)" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="167" cy="205" r="1.6" fill="var(--ct-tool2)"/>
        </g>
        <circle cx="134" cy="218" r="2.8" fill="var(--ct-skin)"/>
      </g>
    </g>
    <g class="sz-water">${[0, 1, 2, 3, 4].map((i) => `<path class="gd-drop sz-drop" style="--delay:-${(i * 0.14).toFixed(2)}s;--x:${(i % 3) * 1.2 - 1.2}px" d="M${(182.5 + (i % 3) * 1.1).toFixed(1)} 191 q 1.5 2.2 0 3.6 q -1.5 -1.4 0 -3.6z" fill="var(--ct-water)"/>`).join('')}</g>
  </g>`;
}

/* Farm: a field of furrows in rows, crops that sway plant by plant, and the buildings each stage adds.
   The caretaker tends the front row with a hoe; a little soil lifts where it lands. */
function drawFarmScene(stage, seed, moving, caretaker) {
  const r = rng((seed || 7) + 5); const id = 'gs' + (++SCENE_N);
  const fl = 98, fr = 350;
  let g = sceneOpen(id, moving) + sceneBackdrop(id, r, (x, y) => x > fl - 8 && y < 258);
  if (stage >= 11) g += `<path d="M146 160 Q 200 146 250 152 L 256 166 Q 200 160 142 172Z" fill="var(--gs-grain)" opacity=".5"/><path d="M152 163 Q 200 151 250 157 M148 167 Q 200 156 252 162" stroke="var(--gs-soil)" stroke-width=".8" opacity=".35" fill="none"/>`;
  if (stage >= 12) g += `<g><path d="M244 186 L 248 136 L 256 136 L 260 186Z" fill="var(--gs-wood)"/><path d="M243 138 l 9 -9 l 9 9z" fill="var(--g-barn)"/>
      <g class="gs-mill" style="--cx:252px;--cy:134px">${[0, 90, 180, 270].map((a) => `<path d="M252 134 L 252 108 L 258 110 L 254 134Z" transform="rotate(${a} 252 134)" fill="var(--gs-cloud)" stroke="var(--gs-wood2)" stroke-width=".8"/>`).join('')}<circle cx="252" cy="134" r="2.2" fill="var(--gs-wood2)"/></g></g>`;
  if (stage >= 8) g += `<g><path d="M288 192 V 156 L 312 140 L 336 156 V 192Z" fill="var(--g-barn)"/><path d="M284 158 L 312 138 L 340 158" stroke="var(--gs-wood2)" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="303" y="168" width="18" height="24" fill="var(--gs-wood2)"/><path d="M303 168 L 321 192 M321 168 L 303 192" stroke="var(--gs-wood)" stroke-width="1.4"/><rect x="308" y="150" width="8" height="7" fill="var(--gs-sun)" opacity=".6"/></g>`;
  if (stage >= 13) g += `<g><rect x="262" y="180" width="18" height="12" rx="3" fill="var(--gs-grain)"/><path d="M262 186 h18" stroke="var(--gs-wood)" stroke-width=".8"/><rect x="270" y="172" width="16" height="10" rx="3" fill="var(--gs-grain)" opacity=".9"/></g>`;
  if (stage >= 10) g += `<g><path d="M34 196 V 160" stroke="var(--g-trunk)" stroke-width="4" stroke-linecap="round"/><g class="gs-pad" style="--dur:8s"><circle cx="34" cy="152" r="15" fill="var(--gs-leaf)"/><circle cx="25" cy="158" r="9" fill="var(--gs-leaf2)"/><circle cx="43" cy="157" r="10" fill="var(--gs-leaf2)"/><circle cx="29" cy="149" r="2.4" fill="var(--g-barn)"/><circle cx="40" cy="154" r="2.4" fill="var(--g-barn)"/><circle cx="34" cy="160" r="2.4" fill="var(--g-barn)"/></g></g>`;
  if (stage >= 6) { g += `<path d="M${fl} 190 H ${fr}" stroke="var(--gs-wood2)" stroke-width="1.6"/><path d="M${fl} 185 H ${fr}" stroke="var(--gs-wood2)" stroke-width="1.6"/>`; for (let x = fl; x <= fr; x += 21) g += `<rect x="${x - 1.5}" y="181" width="3" height="13" rx="1" fill="var(--gs-wood)"/>`; }
  // the field: rows get wider toward the front
  g += `<path d="M${fl + 8} 196 H ${fr - 4} L ${fr} 256 H ${fl}Z" fill="url(#${id}soil)"/>`;
  const rowsY = [204, 216, 230, 246]; const rows = stage === 0 ? 0 : Math.min(4, Math.ceil(stage / 2));
  rowsY.forEach((y, i) => { g += `<path d="M${fl + 6 - i * 2} ${y + 2} H ${fr - 2 + i}" stroke="var(--gs-soil2)" stroke-width="${2 + i}" stroke-linecap="round"/>`; });
  if (caretaker) g += `<ellipse class="gs-wet" style="--dur:9s" cx="108" cy="243" rx="12" ry="3" fill="var(--gs-wet)"/>`;
  const grain = stage >= 9;
  for (let ri = 0; ri < rows; ri++) {
    const y = rowsY[3 - ri] + 1; const sc = 0.62 + (3 - ri) * 0.14; const step = 22 - ri * 2;
    for (let x = fl + 26 + (ri % 2) * 8; x < fr - 8; x += step) {
      if (stage < 3) { g += `<path d="M${x} ${y} v -${(2 + stage).toFixed(1)}" stroke="var(--gs-stem)" stroke-width="1.6" stroke-linecap="round"/>`; continue; }
      const h = Math.min(20, 5 + stage * 1.5) * sc;
      let p = `<g class="gs-plant" style="--dur:${(5.5 + r() * 3).toFixed(1)}s;--delay:-${(r() * 5).toFixed(1)}s">`;
      if (grain) {
        for (let k = -1; k <= 1; k++) p += `<path d="M${x + k * 2} ${y} q ${k} -${(h * 0.6).toFixed(1)} ${k * 2.4} -${h.toFixed(1)}" stroke="var(--gs-stem)" stroke-width="1.2" fill="none"/><ellipse cx="${(x + k * 4.4).toFixed(1)}" cy="${(y - h - 2.5 * sc).toFixed(1)}" rx="${(1.6 * sc + 0.4).toFixed(1)}" ry="${(4 * sc + 1).toFixed(1)}" transform="rotate(${k * 10} ${(x + k * 4.4).toFixed(1)} ${(y - h).toFixed(1)})" fill="var(--gs-grain)"/>`;
      } else {
        p += `<path d="M${x} ${y} V ${(y - h).toFixed(1)}" stroke="var(--gs-stem)" stroke-width="1.6"/>`;
        [[-1, 0.45], [1, 0.7], [-1, 0.95]].slice(0, stage >= 6 ? 3 : 2).forEach(([d, f]) => { p += `<path d="M${x} ${(y - h * f).toFixed(1)} q ${d * 5 * sc} -${(4 * sc).toFixed(1)} ${d * 9 * sc} -${(1 * sc).toFixed(1)} q ${-d * 5 * sc} ${(3 * sc).toFixed(1)} ${-d * 9 * sc} ${(1 * sc).toFixed(1)}z" fill="${d < 0 ? 'var(--gs-leaf)' : 'var(--gs-leaf2)'}"/>`; });
      }
      g += p + '</g>';
    }
  }
  if (stage >= 14) g += `<g><ellipse cx="322" cy="275" rx="26" ry="2.5" fill="var(--gs-ink)" opacity=".1"/><rect x="304" y="259" width="30" height="11" rx="2" fill="var(--gs-wood)"/><path d="M306 263 h26" stroke="var(--gs-wood2)" stroke-width=".8"/><rect x="306" y="254" width="12" height="6" rx="2" fill="var(--gs-grain)"/><circle cx="310" cy="272" r="4.5" fill="none" stroke="var(--gs-wood2)" stroke-width="2"/><circle cx="328" cy="272" r="4.5" fill="none" stroke="var(--gs-wood2)" stroke-width="2"/><path d="M334 262 l 14 -5" stroke="var(--gs-wood2)" stroke-width="2" stroke-linecap="round"/></g>`;
  if (caretaker) g += drawGardener('hoe');
  return g + '</svg>';
}
