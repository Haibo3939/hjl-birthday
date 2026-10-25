// HJL pixel pet — procedural sprite rig on a 48x52 grid (x4 = one 192x208 Codex pet cell).
(function () {
  const W = 48, H = 52;

  const BASE = {
    ol: '#24181a', hair: '#1c181b', hairHi: '#4a4450',
    skin: '#f1c49c', skinSh: '#dba27a', blush: '#ee9886', beard: '#5e463f', beardLt: '#9a7563',
    mouth: '#5c2124', tongue: '#d8606a', teeth: '#fffaf2', eye: '#1c181b', eyeHi: '#ffffff',
    pants: '#e4d4b4', pantsSh: '#c7b08a', strap: '#3a2a22', strapHi: '#5a463b', strapA: '#d8483c', strapB: '#f2c14e',
    earring: '#0e0e10', earringHi: '#c9ced8', sweat: '#8fd3ff', sweatHi: '#ffffff',
    watch: '#141416', watchHi: '#6c7a8c',
    shoe: '#fbfbfd', shoeSh: '#cfd1d9', sole: '#81838f',
    gBody: '#df9443', gBodySh: '#b0682b', gTop: '#f4bf78', gHole: '#2b1a12',
    gNeck: '#6e4225', gHead: '#4b2c18', gStr: '#f6ecd2',
    shaft: '#c9ced8', grip: '#2a2a31', club: '#3b414e', clubHi: '#a3acbc', ball: '#ffffff', ballSh: '#d5d8de',
  };
  const OUTFITS = {
    polo: { shirt: '#f8f6f0', shirtSh: '#d8d2c5', collar: '#c9c2b3' },
    tee: { shirt: '#30313a', shirtSh: '#1f2026', collar: '#4a4b56' },
  };

  function Layer() { return new Array(W * H).fill(null); }
  function set(L, x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    L[y * W + x] = c;
  }
  function get(L, x, y) { return (x < 0 || y < 0 || x >= W || y >= H) ? null : L[y * W + x]; }
  function rect(L, x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(L, x + i, y + j, c); }
  function ellipse(L, cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) set(L, x, y, c);
      }
  }
  function line(L, x0, y0, x1, y1, c, t = 1) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2));
    const o = Math.floor((t - 1) / 2);
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
      rect(L, x - o, y - o, t, t, c);
    }
  }
  function outline(L, c) {
    const add = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (L[y * W + x]) continue;
      if (get(L, x - 1, y) || get(L, x + 1, y) || get(L, x, y - 1) || get(L, x, y + 1)) add.push(y * W + x);
    }
    for (const i of add) L[i] = c;
  }
  function comp(D, L) { for (let i = 0; i < L.length; i++) if (L[i]) D[i] = L[i]; }
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  // ---------- parts ----------
  function drawLegs(D, p, C) {
    const L = Layer();
    if (p.kneel) { // front view on both knees: hips drop with the body, knees rest on the ground (y 48)
      const top = 38 + (p.by || 0);
      rect(L, 16, top, 16, 47 - top, C.pants);
      rect(L, 15, 46, 8, 3, C.pants); rect(L, 25, 46, 8, 3, C.pants);
      rect(L, 15, 48, 8, 1, C.pantsSh); rect(L, 25, 48, 8, 1, C.pantsSh);
      rect(L, 28, top + 1, 3, 46 - top, C.pantsSh);
      rect(L, 12, 47, 3, 2, C.shoe); rect(L, 33, 47, 3, 2, C.shoe); // soles peeking out behind
      rect(L, 12, 48, 3, 1, C.sole); rect(L, 33, 48, 3, 1, C.sole);
      outline(L, C.ol);
      comp(D, L);
      return;
    }
    const lx = 17 + (p.legs?.l || 0), rx = 25 + (p.legs?.r || 0);
    const ly = p.legs?.ly || 0, ry = p.legs?.ry || 0;
    rect(L, 17, 38, 14, 3, C.pants);
    rect(L, Math.min(lx, 17), 38, 3, 3, C.pants);
    rect(L, Math.max(rx + 3, 28), 38, 3, 3, C.pants);
    rect(L, lx, 39, 6, 7 - ly, C.pants);
    rect(L, rx, 39, 6, 7 - ry, C.pants);
    rect(L, lx + 4, 41, 2, 5 - ly, C.pantsSh);
    rect(L, rx + 4, 41, 2, 5 - ry, C.pantsSh);
    // shoes
    const ls = p.turn === 1 ? lx : lx - 1;
    rect(L, ls, 46 - ly, 7, 3, C.shoe); rect(L, ls, 48 - ly, 7, 1, C.sole); rect(L, lx + 3, 46 - ly, 3, 1, C.shoeSh);
    rect(L, rx, 46 - ry, 7, 3, C.shoe); rect(L, rx, 48 - ry, 7, 1, C.sole); rect(L, rx, 46 - ry, 3, 1, C.shoeSh);
    outline(L, C.ol);
    comp(D, L);
  }

  function drawTorso(D, p, C) {
    const L = Layer(), by = p.by || 0;
    rect(L, 17, 28 + by, 14, 11, C.shirt);
    rect(L, 16, 29 + by, 16, 9, C.shirt);
    rect(L, 29, 29 + by, 3, 9, C.shirtSh);
    rect(L, 16, 37 + by, 16, 1, C.shirtSh);
    outline(L, C.ol);
    if (C.kind === 'polo') {
      line(L, 20, 28 + by, 23, 31 + by, C.collar); line(L, 27, 28 + by, 24, 31 + by, C.collar);
      line(L, 23, 31 + by, 23, 34 + by, C.collar); set(L, 24, 32 + by, C.collar);
    } else {
      rect(L, 21, 28 + by, 6, 1, C.collar);
    }
    // woven guitar strap across the chest: his left shoulder to his right hip
    const sx = p.flip ? 18 : 29, ex = p.flip ? 30 : 17, dir = p.flip ? 1 : -1;
    line(L, sx, 28 + by, ex, 38 + by, C.strap, 3);
    for (let i = 1; i < 12; i++) {
      const x = sx + dir * i, y = Math.round(28 + by + i * 10 / 12);
      set(L, x, y, i % 3 === 0 ? C.strapB : C.strapA);
    }
    comp(D, L);
  }

  function drawHead(D, p, C) {
    const L = Layer(), oy = (p.by || 0) + (p.hy || 0), ox = p.hx || 0, sway = p.sway || 0;
    const fx = ox + (p.fx || 0), fy = oy + (p.fy || 0), turn = p.turn || 0;
    // long hair tied half-up: the lower part falls neatly behind the shoulders
    for (let y = 8; y < H; y++) for (let x = 0; x < W; x++) {
      const yy = y - oy, d = Math.abs(x + 0.5 - 23.5 - ox);
      if (yy > 24 && d < 8) continue;
      const tip = yy > 27 ? sway * (x < 23.5 + ox ? -1 : 1) : 0;
      const dd = Math.abs(x - tip + 0.5 - 23.5 - ox);
      const half = yy < 17 ? 12.2 * Math.sqrt(Math.max(0, 1 - ((17 - yy) / 8.6) ** 2)) : 12.2;
      if (dd <= half && yy <= 30) set(L, x, y, C.hair);
    }
    // ears, tucked in front of the hair
    if (turn !== -1) ellipse(L, 12.6 + ox, 19.8 + oy, 1.7, 2.3, C.skin);
    if (turn !== 1) ellipse(L, 34.4 + ox, 19.8 + oy, 1.7, 2.3, C.skin);
    // face
    ellipse(L, 23.5 + ox, 18 + oy, 11, 9.5, C.skin);
    // front hair combed back: forehead open, temples covered
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (x + 0.5 - 23.5 - ox) / 11.6, dy = (y + 0.5 - 17.7 - oy) / 10;
      if (dx * dx + dy * dy > 1) continue;
      const d = Math.abs(x + 0.5 - 23.5 - ox);
      const hl = d < 5 ? 12 : d < 7.5 ? 13 : d < 9 ? 15 : 18;
      if (y < hl + oy) set(L, x, y, C.hair);
    }
    // small, low bun on the crown
    ellipse(L, 23.5 + ox, 7.2 + oy + sway * 0.5, 3.3, 2.6, C.hair);
    outline(L, C.ol);
    // hair-tie and shine
    rect(L, 22 + ox, 9 + oy, 4, 1, C.strapHi);
    set(L, 22 + ox, 6 + oy, C.hairHi); set(L, 23 + ox, 6 + oy, C.hairHi);
    line(L, 17 + ox, 11 + oy, 20 + ox, 10 + oy, C.hairHi);
    line(L, 27 + ox, 10 + oy, 30 + ox, 11 + oy, C.hairHi);
    set(L, 15 + ox, 13 + oy, C.hairHi);
    // face shading (light from upper-left)
    for (let y = 18; y <= 26; y++) for (let x = 31; x <= 34; x++) {
      const yy = y + oy, xx = x + ox;
      if (get(L, xx, yy) === C.skin && get(L, xx + 1, yy) !== C.skin) set(L, xx, yy, C.skinSh);
    }
    set(L, 34 + ox, 20 + oy, C.skinSh); set(L, 34 + ox, 21 + oy, C.skinSh);
    // full beard: sideburns down the jaw, wrapping the chin, light moustache
    const isSkin = (x, y) => { const c = get(L, x, y); return c === C.skin || c === C.skinSh; };
    const beard = [];
    for (let y = 20 + oy; y < H; y++) for (let x = 0; x < W; x++) {
      if (!isSkin(x, y)) continue;
      let edge = y >= 25 + fy;
      for (let j = -2; j <= 2 && !edge; j++) for (let i = -2; i <= 2; i++)
        if (Math.abs(i) + Math.abs(j) <= 2 && !isSkin(x + i, y + j)) { edge = true; break; }
      if (edge) beard.push([x, y]);
    }
    for (const [x, y] of beard) set(L, x, y, C.beard);
    rect(L, 21 + fx, 22 + fy, 6, 1, C.beardLt);
    for (const [x, y] of [[20, 24], [27, 24], [19, 23], [28, 23]]) set(L, x + fx, y + fy, C.beardLt);
    // blush
    rect(L, 16 + fx, 21 + fy, 2, 1, C.blush); rect(L, 30 + fx, 21 + fy, 2, 1, C.blush);
    // small black drop earring on his right ear (mirrored side when the row will be flipped)
    const earSide = p.flip ? 1 : -1;
    if (turn !== earSide) {
      const ex = (x) => p.flip ? 47 - x : x;
      set(L, ex(11) + ox, 21 + oy, C.earringHi);
      set(L, ex(10) + ox, 22 + oy, C.earringHi);
      rect(L, Math.min(ex(9), ex(10)) + ox, 23 + oy, 2, 3, C.earring);
      set(L, ex(9) + ox, 23 + oy, C.earringHi);
    }
    if (p.sweat) {
      set(L, 32 + fx, 12 + fy, C.sweat); rect(L, 31 + fx, 13 + fy, 2, 2, C.sweat); set(L, 31 + fx, 13 + fy, C.sweatHi);
    }
    drawEyes(L, p.eyes || 'open', fx, fy + (p.ey || 0), C, p.look);
    drawMouth(L, p.mouth || 'smile', fx, fy, C);
    comp(D, L);
  }

  function drawEyes(L, kind, fx, oy, C, look) {
    const y = 19 + oy, lx = 18 + fx, rx = 27 + fx;
    const brow = (dy) => { rect(L, lx, y - 3 + dy, 3, 1, C.hair); rect(L, rx, y - 3 + dy, 3, 1, C.hair); };
    if (kind === 'look') { // pupils aimed by look = [px, py], each -1..1
      const [px, py] = look || [0, 0];
      brow(py < 0 ? -1 : 0);
      rect(L, lx + 1 + px, y + py, 2, 2, C.eye); rect(L, rx + px, y + py, 2, 2, C.eye);
      set(L, lx + 1 + px + (px > 0 ? 1 : 0), y + py, C.eyeHi); set(L, rx + px + (px > 0 ? 1 : 0), y + py, C.eyeHi);
    } else if (kind === 'open') {
      brow(0);
      rect(L, lx + 1, y, 2, 2, C.eye); rect(L, rx, y, 2, 2, C.eye);
      set(L, lx + 1, y, C.eyeHi); set(L, rx, y, C.eyeHi);
    } else if (kind === 'right') { // looking toward screen-right
      brow(0);
      rect(L, lx + 2, y, 1, 2, C.eye); set(L, lx + 1, y, C.eye);
      rect(L, rx + 1, y, 2, 2, C.eye); set(L, rx + 1, y, C.eyeHi);
      set(L, lx + 1, y + 1, C.eye);
    } else if (kind === 'down') {
      rect(L, lx, y - 2, 3, 1, C.hair); rect(L, rx, y - 2, 3, 1, C.hair);
      rect(L, lx, y + 1, 3, 1, C.eye); rect(L, rx, y + 1, 3, 1, C.eye);
      set(L, lx + 1, y + 2, C.eye); set(L, rx + 1, y + 2, C.eye);
    } else if (kind === 'blink') {
      brow(0);
      rect(L, lx, y + 1, 3, 1, C.eye); rect(L, rx, y + 1, 3, 1, C.eye);
    } else if (kind === 'sad') {
      set(L, lx, y - 2, C.hair); set(L, lx + 1, y - 3, C.hair); set(L, lx + 2, y - 3, C.hair);
      set(L, rx + 2, y - 2, C.hair); set(L, rx + 1, y - 3, C.hair); set(L, rx, y - 3, C.hair);
      rect(L, lx + 1, y + 1, 2, 1, C.eye); rect(L, rx, y + 1, 2, 1, C.eye);
    } else if (kind === 'squeeze') { // eyes screwed shut, lost in the music
      set(L, lx, y - 3, C.hair); set(L, lx + 1, y - 3, C.hair); set(L, lx + 2, y - 2, C.hair);
      set(L, rx, y - 2, C.hair); set(L, rx + 1, y - 3, C.hair); set(L, rx + 2, y - 3, C.hair);
      set(L, lx, y - 1, C.eye); set(L, lx + 1, y, C.eye); set(L, lx + 2, y + 1, C.eye); set(L, lx + 1, y + 1, C.eye);
      set(L, rx + 2, y - 1, C.eye); set(L, rx + 1, y, C.eye); set(L, rx, y + 1, C.eye); set(L, rx + 1, y + 1, C.eye);
    } else { // happy ^ ^
      brow(-1);
      set(L, lx, y + 1, C.eye); set(L, lx + 1, y, C.eye); set(L, lx + 2, y + 1, C.eye);
      set(L, rx, y + 1, C.eye); set(L, rx + 1, y, C.eye); set(L, rx + 2, y + 1, C.eye);
    }
  }

  function drawMouth(L, kind, fx, oy, C) {
    const y = 23 + oy, x = 21 + fx;
    if (kind === 'grin') {
      set(L, x, y, C.mouth); rect(L, x + 1, y, 4, 1, C.teeth); set(L, x + 5, y, C.mouth);
      rect(L, x + 1, y + 1, 4, 1, C.mouth); rect(L, x + 2, y + 1, 2, 1, C.tongue);
      rect(L, x + 2, y + 2, 2, 1, C.mouth);
    } else if (kind === 'o') {
      rect(L, x + 2, y, 2, 1, C.mouth); rect(L, x + 1, y + 1, 4, 1, C.mouth);
      rect(L, x + 2, y + 2, 2, 1, C.tongue);
    } else if (kind === 'flat') {
      rect(L, x + 1, y + 1, 4, 1, C.mouth);
    } else if (kind === 'shout') {
      rect(L, x + 1, y, 4, 3, C.mouth); rect(L, x + 2, y + 1, 2, 2, C.tongue); rect(L, x + 1, y, 4, 1, C.teeth);
      set(L, x, y, C.mouth); set(L, x + 5, y, C.mouth);
    } else if (kind === 'frown') {
      rect(L, x + 2, y + 1, 2, 1, C.mouth); set(L, x + 1, y + 2, C.mouth); set(L, x + 4, y + 2, C.mouth);
    } else { // smile
      set(L, x, y, C.mouth); rect(L, x + 1, y + 1, 4, 1, C.mouth); set(L, x + 5, y, C.mouth);
    }
  }

  function drawArm(D, arm, by, C, watch) {
    const L = Layer();
    const [sh, el, ha] = arm.map(([x, y]) => [x, y + by]);
    line(L, sh[0], sh[1], el[0], el[1], C.skin, 3);
    line(L, el[0], el[1], ha[0], ha[1], C.skin, 3);
    ellipse(L, ha[0] + 0.5, ha[1] + 0.5, 1.9, 1.9, C.skin);
    const sl = lerp(sh, el, 0.55);
    line(L, sh[0], sh[1], sl[0], sl[1], C.shirt, 4);
    if (watch) {
      const a = lerp(el, ha, 0.62), b = lerp(el, ha, 0.72);
      line(L, a[0], a[1], b[0], b[1], C.watch, 3);
    }
    outline(L, C.ol);
    if (watch) { const m = lerp(el, ha, 0.67); set(L, m[0], m[1], C.watchHi); }
    const s2 = lerp(sh, el, 0.45);
    set(L, s2[0], s2[1], C.shirtSh);
    comp(D, L);
  }

  function drawGuitar(D, g, by, C) {
    const L = Layer();
    const B = [g.b[0], g.b[1] + by], Hd = [g.h[0], g.h[1] + by];
    const len = Math.hypot(Hd[0] - B[0], Hd[1] - B[1]);
    const u = [(Hd[0] - B[0]) / len, (Hd[1] - B[1]) / len];
    const at = (k) => [B[0] + u[0] * k, B[1] + u[1] * k];
    const n0 = at(9);
    line(L, n0[0], n0[1], Hd[0], Hd[1], C.gNeck, 2);
    const hs = at(len - 3);
    line(L, hs[0], hs[1], Hd[0], Hd[1], C.gHead, 3);
    const body = Layer();
    ellipse(body, B[0], B[1], 6.2, 5.7, C.gBody);
    const ub = at(5.6);
    ellipse(body, ub[0], ub[1], 4.7, 4.4, C.gBody);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!body[y * W + x]) continue;
      if (!get(body, x, y - 1)) L[y * W + x] = C.gTop;
      else if (!get(body, x - 1, y + 1) || !get(body, x, y + 1)) L[y * W + x] = C.gBodySh;
      else L[y * W + x] = C.gBody;
    }
    if (g.back) {
      outline(L, C.ol);
      for (let k = len - 2.5; k <= len; k += 1.5) { const t = at(k); set(L, t[0] + 1, t[1], C.gStr); set(L, t[0] - 1, t[1] - 1, C.gStr); }
      comp(D, L);
      return;
    }
    const sh = at(3.2);
    ellipse(L, sh[0], sh[1], 1.7, 1.7, C.gHole);
    const br = at(-2.2);
    rect(L, Math.round(br[0]) - 1, Math.round(br[1]), 3, 1, C.gHead);
    outline(L, C.ol);
    const s0 = at(-1.6), s1 = at(len - 3.5);
    line(L, s0[0], s0[1], s1[0], s1[1], C.gStr);
    for (let k = len - 2.5; k <= len; k += 1.5) { const t = at(k); set(L, t[0], t[1] - 1, C.gStr); }
    comp(D, L);
  }

  function drawClub(D, c, by, C) {
    const L = Layer();
    const G = [c.g[0], c.g[1] + by], E = [c.e[0], c.e[1] + by];
    line(L, G[0], G[1], E[0], E[1], C.shaft);
    const gr = lerp(G, E, 0.22);
    const g0 = lerp(G, E, -0.06);
    line(L, g0[0], g0[1], gr[0], gr[1], C.grip, 2);
    ellipse(L, E[0] + 0.5, E[1] + 0.5, 2.1, 1.4, C.club);
    outline(L, C.ol);
    set(L, E[0], E[1], C.clubHi);
    comp(D, L);
  }

  function drawBall(D, b, C) {
    const L = Layer();
    rect(L, b[0], b[1], 2, 2, C.ball); set(L, b[0] + 1, b[1] + 1, C.ballSh);
    outline(L, C.ol);
    comp(D, L);
  }

  // guitar slung on the back: body peeks out at his right hip, headstock over his left shoulder
  const BACK_GUITAR = { b: [12, 41], h: [42, 15], back: true };
  const BACK_GUITAR_FLIP = { b: [35, 41], h: [5, 15], back: true };

  // p.mirror renders a left-facing frame: identity props (watch, earring, strap, slung guitar)
  // are drawn on the opposite side first so that the horizontal mirror puts them back on the correct side.
  function render(p, outfitKey) {
    if (p.mirror) {
      const M = render(Object.assign({}, p, { mirror: false, flip: true }), outfitKey);
      const out = Layer();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out[y * W + x] = M[y * W + (W - 1 - x)];
      return out;
    }
    const C = Object.assign({ kind: outfitKey }, BASE, OUTFITS[outfitKey]);
    const D = Layer(), by = p.by || 0;
    const watchOn = p.flip ? 'L' : 'R';
    if (p.armsOnly) { // just the near arm, for layering it over a second character (the birthday-site hug)
      drawArm(D, p.arms.L, by, C, watchOn === 'L');
      return D;
    }
    if (!p.guitar) drawGuitar(D, p.flip ? BACK_GUITAR_FLIP : BACK_GUITAR, by, C);
    if (p.club && p.club.behind) drawClub(D, p.club, by, C);
    if (p.arms && p.farArm) drawArm(D, p.arms[p.farArm], by, C, watchOn === p.farArm);
    drawLegs(D, p, C);
    drawTorso(D, p, C);
    drawHead(D, p, C);
    if (p.guitar) drawGuitar(D, p.guitar, by, C);
    if (p.arms) {
      if (p.farArm !== 'L') drawArm(D, p.arms.L, by, C, watchOn === 'L');
      if (p.farArm !== 'R') drawArm(D, p.arms.R, by, C, watchOn === 'R');
    }
    if (p.club && !p.club.behind) drawClub(D, p.club, by, C);
    if (p.ball) drawBall(D, p.ball, C);
    if (p.gy) {
      const out = Layer();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const sy = y - p.gy;
        if (sy >= 0 && sy < H) out[y * W + x] = D[sy * W + x];
      }
      return out;
    }
    return D;
  }

  // ---------- poses ----------
  const ARMS_IDLE = { L: [[17, 30], [15, 34], [15, 38]], R: [[30, 30], [32, 34], [32, 38]] };

  const idle = [
    { by: 0, eyes: 'open', mouth: 'smile', arms: ARMS_IDLE },
    { by: 0, eyes: 'open', mouth: 'smile', arms: ARMS_IDLE, sway: 0 },
    { by: 1, eyes: 'open', mouth: 'smile', arms: ARMS_IDLE, hy: 0 },
    { by: 1, eyes: 'open', mouth: 'smile', arms: ARMS_IDLE, sway: 1 },
    { by: 1, eyes: 'blink', mouth: 'smile', arms: ARMS_IDLE, sway: 0 },
    { by: 0, eyes: 'open', mouth: 'smile', arms: ARMS_IDLE },
  ];
  const idleMs = [280, 110, 110, 140, 140, 320];

  // running (agent at work): frenzied strumming — head-banging, hair flying, stomping, neck swinging up
  const GUITAR = { b: [19, 39], h: [42, 26] };
  const GUITAR_UP = { b: [19, 39], h: [40, 21] };
  const fret = (dy = 0, dx = 0) => [[30, 30], [36, 34], [35 + dx, 30 + dy]];
  const strumHi = [[17, 30], [11, 32], [19, 31]];
  const strumLo = [[17, 30], [13, 37], [24, 42]];
  const STOMP = { l: -1, r: 1 };
  const shred = [
    { by: 0, hy: 0, eyes: 'squeeze', mouth: 'shout', guitar: GUITAR, arms: { L: strumHi, R: fret(0) }, legs: { ...STOMP, ry: 2 }, sway: -1 },
    { by: 1, hy: 2, eyes: 'squeeze', mouth: 'grin', guitar: GUITAR, arms: { L: strumLo, R: fret(0) }, legs: STOMP, sway: 1 },
    { by: 0, hy: 0, eyes: 'squeeze', mouth: 'shout', guitar: GUITAR_UP, arms: { L: strumHi, R: fret(-4, -1) }, legs: { ...STOMP, ly: 2 }, sway: -1 },
    { by: 1, hy: 2, eyes: 'squeeze', mouth: 'grin', guitar: GUITAR_UP, arms: { L: strumLo, R: fret(-4, -1) }, legs: STOMP, sway: 1 },
    { by: 0, hy: 0, fx: -1, eyes: 'happy', mouth: 'shout', guitar: GUITAR, arms: { L: strumHi, R: fret(1) }, legs: { ...STOMP, ry: 2 }, sway: -1 },
    { by: 1, hy: 2, eyes: 'squeeze', mouth: 'shout', guitar: GUITAR, arms: { L: strumLo, R: fret(1) }, legs: STOMP, sway: 1 },
  ];
  const shredMs = [120, 120, 120, 120, 120, 220];

  // review (finished turn waiting to be read): slides onto his knees and rips a solo, neck pointed at the sky
  const SOLO = { b: [21, 36], h: [38, 12] };
  const neckHand = (y) => [[30, 30], [36, 28], [Math.round(SOLO.b[0] + (SOLO.b[1] - y) * (SOLO.h[0] - SOLO.b[0]) / (SOLO.b[1] - SOLO.h[1])), y]]; // hand on the neck at height y
  const pick = (y) => [[17, 30], [12, 35], [22, y]];
  const solo = [
    { by: 3, kneel: true, hx: 1, eyes: 'open', mouth: 'grin', guitar: SOLO, arms: { L: pick(34), R: neckHand(24) }, sway: -1 },
    { by: 6, kneel: true, hx: -1, eyes: 'squeeze', mouth: 'shout', guitar: SOLO, arms: { L: pick(32), R: neckHand(22) }, sway: 1 },
    { by: 6, kneel: true, hx: -1, eyes: 'squeeze', mouth: 'o', guitar: SOLO, arms: { L: pick(37), R: neckHand(20) }, sway: -1 },
    { by: 6, kneel: true, hx: -1, eyes: 'squeeze', mouth: 'shout', guitar: SOLO, arms: { L: pick(32), R: neckHand(24) }, sway: 1 },
    { by: 6, kneel: true, hx: -1, eyes: 'happy', mouth: 'shout', guitar: SOLO, arms: { L: pick(37), R: neckHand(21) }, sway: -1 },
    { by: 6, kneel: true, hx: -1, eyes: 'happy', mouth: 'grin', guitar: SOLO, arms: { L: [[17, 30], [11, 25], [9, 15]], R: neckHand(21) }, sway: 1 },
  ];
  const soloMs = [150, 150, 150, 150, 150, 280];


  // running-right: 3/4 view facing screen-right, near arm = his right (L), far arm = his left (R, watch)
  const arm = (sh, ha, bend = 2) => [sh, [(sh[0] + ha[0]) / 2, (sh[1] + ha[1]) / 2 + bend], ha];
  const STRIDE = [ // near-leg offset, far-leg offset, lifts, body bob
    [3, -3, 0, 0, 0], [1, -1, 0, 2, 0], [0, 0, 0, 3, -1], [-2, 2, 0, 1, 0],
    [-3, 3, 0, 0, 0], [-1, 1, 2, 0, 0], [0, 0, 3, 0, -1], [2, -2, 1, 0, 0],
  ];
  const runRight = STRIDE.map(([l, r, ly, ry, by], k) => {
    const t = (3 - l) / 6; // near arm swings opposite the near leg
    return {
      turn: 1, fx: 2, eyes: 'look', look: [1, 0], mouth: k % 4 === 2 ? 'o' : 'smile', by, sway: -1,
      legs: { l, r, ly, ry }, farArm: 'R',
      arms: {
        L: arm([17, 30], [12 + 9 * t, 35 - t]),
        R: arm([30, 30], [36 - 8 * t, 33 + 2 * t]),
      },
    };
  });
  const runMs = [120, 120, 120, 120, 120, 120, 120, 220];
  const runLeft = runRight.map(f => Object.assign({}, f, { mirror: true }));

  // waving: his right hand (viewer-left) comes up, waves, settles
  const ARM_R_IDLE = ARMS_IDLE.R;
  const wave = [
    { eyes: 'happy', mouth: 'smile', arms: { L: [[17, 30], [12, 30], [11, 25]], R: ARM_R_IDLE } },
    { eyes: 'happy', mouth: 'grin', arms: { L: [[17, 30], [12, 27], [8, 20]], R: ARM_R_IDLE }, sway: 1 },
    { eyes: 'happy', mouth: 'grin', arms: { L: [[17, 30], [12, 27], [12, 19]], R: ARM_R_IDLE } },
    { eyes: 'happy', mouth: 'grin', arms: { L: [[17, 30], [12, 27], [8, 20]], R: ARM_R_IDLE }, sway: 1 },
  ];
  const waveMs = [140, 140, 140, 280];

  // jumping: crouch, lift, peak with both arms up, descend, land
  const ARMS_UP = (y) => ({ L: [[17, 30], [11, y + 7], [9, y]], R: [[30, 30], [36, y + 7], [38, y]] });
  const jump = [
    { by: 2, eyes: 'open', mouth: 'smile', arms: { L: [[17, 30], [14, 34], [13, 37]], R: [[30, 30], [33, 34], [34, 37]] } },
    { gy: -3, eyes: 'happy', mouth: 'grin', arms: ARMS_UP(17), legs: { ly: 1, ry: 1 } },
    { gy: -4, eyes: 'happy', mouth: 'grin', arms: ARMS_UP(12), legs: { ly: 2, ry: 2 }, sway: 1 },
    { gy: -2, eyes: 'happy', mouth: 'o', arms: ARMS_UP(20), legs: { ly: 1, ry: 1 } },
    { by: 1, eyes: 'happy', mouth: 'smile', arms: ARMS_IDLE },
  ];
  const jumpMs = [140, 140, 140, 140, 280];

  // failed: a sliced drive — watches it go wide, then droops onto the club
  const FINISH = {
    legs: { l: -1, r: 2, ly: 1 },
    arms: { L: [[17, 30], [28, 28], [34, 21]], R: [[30, 30], [37, 27], [35, 20]] },
    club: { g: [35, 20], e: [6, 12], behind: true },
  };
  // the club head stays on the ground (y 48) however far the body slumps
  const lean = (by) => ({
    by,
    arms: { L: [[17, 30], [20, 35], [25, 39]], R: [[30, 30], [30, 35], [26, 38]] },
    club: { g: [26, 38], e: [32, 48 - by] },
  });
  const failed = [
    Object.assign({ eyes: 'right', mouth: 'smile', fx: 1 }, FINISH),
    Object.assign({ eyes: 'look', look: [1, -1], mouth: 'o', fx: 1 }, FINISH),
    Object.assign({ eyes: 'sad', mouth: 'o' }, lean(1)),
    Object.assign({ eyes: 'sad', mouth: 'frown', hy: 1, sweat: true }, lean(1)),
    Object.assign({ eyes: 'sad', mouth: 'frown', hy: 1, sweat: true }, lean(2)),
    Object.assign({ eyes: 'blink', mouth: 'frown', hy: 1, sweat: true, sway: 1 }, lean(2)),
    Object.assign({ eyes: 'sad', mouth: 'o', hy: 1, sweat: true }, lean(2)),
    Object.assign({ eyes: 'sad', mouth: 'frown', hy: 1, sweat: true }, lean(2)),
  ];
  const failedMs = [140, 140, 140, 140, 140, 140, 140, 240];

  // waiting: leaning on the club, open palm raised, looking up at you, toe tapping
  const WAIT = (hy = 30) => ({
    arms: { L: [[17, 30], [12, 34], [11, hy]], R: [[30, 30], [34, 33], [34, 35]] },
    club: { g: [34, 35], e: [35, 48] },
  });
  const waiting = [
    Object.assign({ eyes: 'look', look: [0, -1], mouth: 'smile' }, WAIT(30)),
    Object.assign({ eyes: 'look', look: [0, -1], mouth: 'smile', legs: { ly: 1 } }, WAIT(29)),
    Object.assign({ eyes: 'look', look: [0, -1], mouth: 'smile' }, WAIT(30)),
    Object.assign({ eyes: 'blink', mouth: 'smile' }, WAIT(30)),
    Object.assign({ eyes: 'look', look: [0, -1], mouth: 'smile', legs: { ly: 1 } }, WAIT(29)),
    Object.assign({ eyes: 'look', look: [0, -1], mouth: 'o', fy: -1 }, WAIT(29)),
  ];
  const waitingMs = [150, 150, 150, 150, 150, 260];

  // 16 look directions, clockwise from up (000). Body stays anchored; the face turns and the eyes aim.
  const lookAt = (deg) => {
    const r = deg * Math.PI / 180, s = Math.sin(r), c = Math.cos(r);
    const q = (v) => (v > 0.3 ? 1 : v < -0.3 ? -1 : 0);
    return {
      eyes: 'look', look: [q(s), q(-c)], mouth: 'smile', arms: ARMS_IDLE,
      fx: Math.round(2 * s), fy: Math.round(-1.2 * c),
      turn: s > 0.7 ? 1 : s < -0.7 ? -1 : 0,
    };
  };
  // hug (birthday site only): 3/4 view facing screen-right, both arms reaching forward around a friend.
  // hugArm is the same pose's near arm alone, drawn on top of the friend so it wraps across their back.
  const HUG_ARMS = { L: [[17, 30], [30, 31], [43, 30]], R: [[30, 30], [38, 29], [46, 28]] };
  const hugBase = { turn: 1, fx: 2, eyes: 'happy', mouth: 'grin', sway: -1, farArm: 'R', arms: HUG_ARMS };
  const hug = [hugBase, { ...hugBase, by: 1 }, { ...hugBase, sway: 1 }, { ...hugBase, by: 1, mouth: 'smile' }];
  const hugArm = hug.map((f) => ({ ...f, armsOnly: true }));
  const hugMs = [180, 180, 180, 260];

  const LOOK_DEG = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5];
  const looks = LOOK_DEG.map(lookAt);

  window.HJL = {
    W, H, render, BASE, OUTFITS,
    anims: {
      idle: { frames: idle, ms: idleMs },
      shred: { frames: shred, ms: shredMs },
      solo: { frames: solo, ms: soloMs },
      hug: { frames: hug, ms: hugMs },
      hugArm: { frames: hugArm, ms: hugMs },
      runRight: { frames: runRight, ms: runMs },
      runLeft: { frames: runLeft, ms: runMs },
      wave: { frames: wave, ms: waveMs },
      jump: { frames: jump, ms: jumpMs },
      failed: { frames: failed, ms: failedMs },
      waiting: { frames: waiting, ms: waitingMs },
      lookA: { frames: looks.slice(0, 8), ms: Array(8).fill(400) },
      lookB: { frames: looks.slice(8), ms: Array(8).fill(400) },
    },
    LOOK_DEG,
    paint(canvas, layer) {
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const img = ctx.createImageData(W, H);
      for (let i = 0; i < layer.length; i++) {
        const c = layer[i]; if (!c) continue;
        const n = parseInt(c.slice(1), 16);
        img.data[i * 4] = n >> 16; img.data[i * 4 + 1] = (n >> 8) & 255; img.data[i * 4 + 2] = n & 255; img.data[i * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    },
  };
})();
