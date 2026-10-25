// LILI pixel pet — procedural sprite rig on a 48x52 grid (x4 = one 192x208 Codex pet cell).
(function () {
  const W = 48, H = 52;

  const BASE = {
    ol: '#2a1a14', hair: '#17151a', hairHi: '#47434d',
    skin: '#dfa27a', skinSh: '#c0825a', wrinkle: '#a96c48', blush: '#d47a62', nose: '#a8643f', mole: '#2a1a14',
    mouth: '#4e1718', tongue: '#c94c55', teeth: '#fbf4e6', eye: '#17151a', eyeW: '#ffffff',
    pants: '#3f424b', pantsSh: '#2d2f37', shoe: '#2b2c32', shoeSh: '#4a4c55', sole: '#ebebee',
    print: '#f1ece2', printSh: '#c7c0b4', script: '#e3b34c',
    lid: '#aab0bb', lidHi: '#d5d9e0', lidSh: '#7d8491', base: '#5c6370', key: '#2d313a', spark: '#ffd54a', sparkHi: '#fff6c8',
    anger: '#ef3a2f', angerSh: '#a51d18', heart: '#ff6f91', heartHi: '#ffd0dc', steam: '#eef1f5',
    sweat: '#8fd3ff', sweatHi: '#ffffff',
    pack: '#c8242c', packSh: '#8f1820', packTop: '#f4e8d0', cig: '#fbfbf7', filter: '#e39a3c',
  };
  const OUTFITS = {
    red: { shirt: '#d33a3f', shirtSh: '#a5262e', collar: '#b32d34', sleeve: 'short', art: 'purpose' },
    orange: { shirt: '#e0662d', shirtSh: '#b14b1d', collar: '#c0541f', sleeve: 'short', art: 'logo' },
    plaid: { shirt: '#f3ca2e', shirtSh: '#d3a51b', collar: '#f3ca2e', sleeve: 'long', check: '#2c2519', checkLt: '#6e5a1f' },
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
  // stamp a pattern: rows of '.', '1' (c1), '2' (c2)
  function stamp(L, x, y, rows, c1, c2) {
    rows.forEach((r, j) => r.split('').forEach((b, i) => { if (b === '1') set(L, x + i, y + j, c1); else if (b === '2') set(L, x + i, y + j, c2); }));
  }
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  // ---------- parts ----------
  function drawLegs(D, p, C) {
    const L = Layer();
    const lx = 16 + (p.legs?.l || 0), rx = 26 + (p.legs?.r || 0);
    const ly = p.legs?.ly || 0, ry = p.legs?.ry || 0;
    rect(L, 16, 38, 16, 3, C.pants);
    rect(L, Math.min(lx, 16), 38, 3, 3, C.pants);
    rect(L, Math.max(rx + 3, 29), 38, 3, 3, C.pants);
    rect(L, lx, 39, 6, 7 - ly, C.pants);
    rect(L, rx, 39, 6, 7 - ry, C.pants);
    rect(L, lx + 4, 41, 2, 5 - ly, C.pantsSh);
    rect(L, rx + 4, 41, 2, 5 - ry, C.pantsSh);
    // dark sneakers with white soles
    const ls = p.profile ? lx : lx - 1; // only the walk cycle turns the feet; look cells keep idle's footing
    rect(L, ls, 46 - ly, 7, 3, C.shoe); rect(L, ls, 48 - ly, 7, 1, C.sole); rect(L, lx + 3, 46 - ly, 3, 1, C.shoeSh);
    rect(L, rx, 46 - ry, 7, 3, C.shoe); rect(L, rx, 48 - ry, 7, 1, C.sole); rect(L, rx, 46 - ry, 3, 1, C.shoeSh);
    outline(L, C.ol);
    comp(D, L);
  }

  function drawTorso(D, p, C) {
    const L = Layer(), by = p.by || 0;
    // stocky: shoulders wider than the hips
    rect(L, 15, 28 + by, 18, 11, C.shirt);
    rect(L, 14, 29 + by, 20, 8, C.shirt);
    rect(L, 30, 29 + by, 3, 10, C.shirtSh); set(L, 33, 30 + by, C.shirtSh); set(L, 33, 31 + by, C.shirtSh);
    rect(L, 15, 38 + by, 18, 1, C.shirtSh);
    outline(L, C.ol);
    // prints are drawn mirrored on rows that get flipped, so they read the right way round afterwards
    const X = (x) => p.flip ? 47 - x : x, y0 = 30 + by;
    const put = (rows, x, y, c1, c2) => rows.forEach((r, j) => r.split('').forEach((b, i) => {
      if (b === '1') set(L, X(x + i), y + j, c1); else if (b === '2') set(L, X(x + i), y + j, c2);
    }));
    if (C.art === 'purpose') {
      rect(L, 20, 28 + by, 8, 1, C.collar);
      // arched white varsity letters with a gold script line underneath
      put(['..1.11.1.11..', '.11.1..1.1.1.', '1.1.11.1.11.1', '1.1.1..1.1..1'], 18, y0 + 1, C.print, C.printSh);
      put(['.2.22.2.22.'], 19, y0 + 6, C.script);
    } else if (C.art === 'logo') {
      rect(L, 20, 28 + by, 8, 1, C.collar);
      put(['11', '21'], 26, y0 + 1, C.script, C.collar);
    } else {
      // pointed shirt collar and button placket
      line(L, 19, 28 + by, 23, 31 + by, C.ol); line(L, 28, 28 + by, 24, 31 + by, C.ol);
      line(L, 20, 28 + by, 22, 30 + by, C.collar); line(L, 27, 28 + by, 25, 30 + by, C.collar);
      rect(L, 23, 28 + by, 2, 2, C.skin);
      for (let y = 32; y <= 37; y += 2) set(L, 24, y + by, C.collar);
    }
    comp(D, L);
  }

  function drawHead(D, p, C) {
    const L = Layer(), oy = (p.by || 0) + (p.hy || 0), ox = p.hx || 0;
    const fx = ox + (p.fx || 0), fy = oy + (p.fy || 0), turn = p.turn || 0;
    // ears
    if (turn !== -1) ellipse(L, 12.4 + ox, 20 + oy, 1.8, 2.4, C.skin);
    if (turn !== 1) ellipse(L, 34.6 + ox, 20 + oy, 1.8, 2.4, C.skin);
    // big round face with heavy cheeks and jowls
    ellipse(L, 23.5 + ox, 18.5 + oy, 11.2, 10, C.skin);
    ellipse(L, 23.5 + ox, 22.8 + oy, 10.4, 6.2, C.skin);
    // short, slightly messy hair: uneven tufts on top, temples clipped, forehead open
    const hairAt = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (x + 0.5 - 23.5 - ox) / 11.9, dy = (y + 0.5 - 15.6 - oy) / 9.6;
      if (dx * dx + dy * dy > 1) continue;
      const d = Math.abs(x + 0.5 - 23.5 - ox);
      const hl = d < 6 ? 11 : d < 8.5 ? 12 : d < 10.2 ? 14 : 17;
      if (y < hl + oy) { set(L, x, y, C.hair); hairAt.push([x, y]); }
    }
    const TUFT = [0, 1, 0, 2, 1, 0, 1, 2, 0, 1, 1, 0, 2, 0, 1, 0, 1, 0];
    const sp = p.spike || 0;
    for (let x = 15 + ox; x <= 32 + ox; x++) {
      let top = 99; for (const [hx, hy] of hairAt) if (hx === x && hy < top) top = hy;
      const t = TUFT[(x - 15 - ox + sp) % TUFT.length];
      for (let k = 1; k <= t && top < 99; k++) set(L, x, top - k, C.hair);
    }
    outline(L, C.ol);
    for (const x of [18, 21, 22, 26, 28]) set(L, x + ox, 8 + oy, C.hairHi);
    set(L, 16 + ox, 10 + oy, C.hairHi); set(L, 31 + ox, 10 + oy, C.hairHi);
    // face shading (light from upper-left)
    for (let y = 16; y <= 28; y++) for (let x = 30; x <= 35; x++) {
      const yy = y + oy, xx = x + ox;
      if (get(L, xx, yy) === C.skin && get(L, xx + 1, yy) !== C.skin) set(L, xx, yy, C.skinSh);
    }
    for (let x = 18; x <= 29; x++) if (get(L, x + ox, 28 + oy) === C.skin) set(L, x + ox, 28 + oy, C.skinSh);
    // a weathered 40-something face: forehead lines, eye bags, deep nasolabial folds
    const cute = p.cute;
    if (!cute) { rect(L, 20 + fx, 12 + fy, 3, 1, C.wrinkle); rect(L, 25 + fx, 12 + fy, 3, 1, C.wrinkle); }
    rect(L, 16 + fx, 20 + fy, 4, 1, C.skinSh); rect(L, 27 + fx, 20 + fy, 4, 1, C.skinSh);
    set(L, 14 + fx, 18 + fy, C.wrinkle); set(L, 33 + fx, 18 + fy, C.wrinkle);
    set(L, 21 + fx, 21 + fy, C.wrinkle); set(L, 20 + fx, 22 + fy, C.wrinkle); set(L, 20 + fx, 23 + fy, C.wrinkle);
    set(L, 26 + fx, 21 + fy, C.wrinkle); set(L, 27 + fx, 22 + fy, C.wrinkle); set(L, 27 + fx, 23 + fy, C.wrinkle);
    // ruddy cheeks and a broad nose
    rect(L, 15 + fx, 21 + fy, 3, cute ? 2 : 1, C.blush); rect(L, 30 + fx, 21 + fy, 3, cute ? 2 : 1, C.blush);
    rect(L, 23 + fx, 18 + fy, 2, 3, C.skinSh);
    set(L, 22 + fx, 21 + fy, C.nose); rect(L, 23 + fx, 21 + fy, 2, 1, C.skinSh); set(L, 25 + fx, 21 + fy, C.nose);
    // the mole at the corner of his mouth (his right, viewer-left)
    set(L, 19 + fx, 24 + fy, C.mole);
    if (p.sweat) {
      set(L, 33 + fx, 12 + fy, C.sweat); rect(L, 32 + fx, 13 + fy, 2, 2, C.sweat); set(L, 32 + fx, 13 + fy, C.sweatHi);
    }
    drawEyes(L, p.eyes || 'open', fx, fy + (p.ey || 0), C, p);
    drawMouth(L, p.mouth || 'flat', fx, fy, C);
    comp(D, L);
  }

  function drawEyes(L, kind, fx, oy, C, p) {
    // each eye is a 4-wide box with whites and a 2-wide pupil: big enough to read a glare at 48px
    const y = 17 + oy, lx = 16 + fx, rx = 27 + fx;
    // brows: 'knit' (his resting scowl), 'v' (furious), 'soft' (cute, raised and relaxed)
    const style = p.brow || (kind === 'happy' ? 'soft' : 'knit');
    const ys = style === 'v' ? [-5, -4, -3, -2] : style === 'soft' ? [-4, -5, -5, -4] : [-4, -4, -3, -3]; // outer -> inner
    ys.forEach((dy, i) => { set(L, lx + i, y + dy, C.hair); set(L, rx + 3 - i, y + dy, C.hair); });
    if (style === 'v') ys.forEach((dy, i) => { if (i < 3) { set(L, lx + i, y + dy + 1, C.hair); set(L, rx + 3 - i, y + dy + 1, C.hair); } });
    if (style !== 'soft') { set(L, 23 + fx, y - 3, C.wrinkle); set(L, 24 + fx, y - 3, C.wrinkle); } // frown crease
    const eye = (x) => {
      if (kind === 'open' || kind === 'look' || kind === 'right') {
        const [px, py] = kind === 'look' ? (p.look || [0, 0]) : kind === 'right' ? [1, 0] : [0, 0];
        if (py > 0) { // looking down: the lid drops over the top row
          rect(L, x, y, 4, 1, C.eye); rect(L, x, y + 1, 4, 1, C.eyeW); rect(L, x + 1 + px, y + 1, 2, 1, C.eye);
          return;
        }
        const top = py < 0 ? y - 1 : y;
        rect(L, x, top - 1, 4, 1, C.eye);
        rect(L, x, top, 4, y + 2 - top, C.eyeW);
        rect(L, x + 1 + px, top, 2, 2, C.eye);
        set(L, x + 1 + px + (px > 0 ? 1 : 0), top, C.eyeW);
      } else if (kind === 'stare') { // 瞪眼: whites all round a small pupil
        rect(L, x, y - 1, 4, 1, C.eye);
        rect(L, x, y, 4, 3, C.eyeW);
        rect(L, x + 1, y + 1, 2, 1, C.eye);
      } else if (kind === 'glare') { // lids pressed down to a slit, menacing
        rect(L, x, y, 4, 1, C.eye);
        rect(L, x, y + 1, 4, 1, C.eyeW); rect(L, x + 1, y + 1, 2, 1, C.eye);
      } else if (kind === 'down') {
        rect(L, x, y + 1, 4, 1, C.eye); rect(L, x + 1, y + 2, 2, 1, C.eye);
      } else if (kind === 'blink') {
        rect(L, x, y + 1, 4, 1, C.eye);
      } else { // happy: squeezed shut
        set(L, x, y + 1, C.eye); rect(L, x + 1, y, 2, 1, C.eye); set(L, x + 3, y + 1, C.eye);
      }
    };
    eye(lx); eye(rx);
  }

  function drawMouth(L, kind, fx, oy, C) {
    const y = 23 + oy, x = 21 + fx;
    if (kind === 'shout') { // yelling: square jaw-drop, both rows of teeth
      rect(L, x, y - 1, 6, 1, C.mouth);
      set(L, x - 1, y, C.mouth); rect(L, x, y, 6, 1, C.teeth); set(L, x + 6, y, C.mouth);
      set(L, x - 1, y + 1, C.mouth); rect(L, x, y + 1, 6, 1, C.mouth); rect(L, x + 2, y + 1, 2, 1, C.tongue); set(L, x + 6, y + 1, C.mouth);
      set(L, x - 1, y + 2, C.mouth); rect(L, x, y + 2, 6, 1, C.teeth); set(L, x + 6, y + 2, C.mouth);
      rect(L, x, y + 3, 6, 1, C.mouth);
    } else if (kind === 'grit') { // gritted teeth
      rect(L, x, y, 6, 1, C.mouth);
      set(L, x - 1, y + 1, C.mouth); rect(L, x, y + 1, 6, 1, C.teeth); set(L, x + 6, y + 1, C.mouth);
      set(L, x + 2, y + 1, C.mouth); set(L, x + 4, y + 1, C.mouth);
      rect(L, x, y + 2, 6, 1, C.mouth);
    } else if (kind === 'grin') {
      set(L, x - 1, y - 1, C.mouth); set(L, x + 6, y - 1, C.mouth);
      rect(L, x, y, 6, 1, C.teeth); set(L, x - 1, y, C.mouth); set(L, x + 6, y, C.mouth);
      rect(L, x, y + 1, 6, 1, C.mouth); rect(L, x + 2, y + 1, 2, 1, C.tongue);
      rect(L, x + 1, y + 2, 4, 1, C.mouth);
    } else if (kind === 'cat') { // cute ω
      set(L, x, y, C.mouth); set(L, x + 1, y + 1, C.mouth); set(L, x + 2, y, C.mouth);
      set(L, x + 3, y, C.mouth); set(L, x + 4, y + 1, C.mouth); set(L, x + 5, y, C.mouth);
    } else if (kind === 'talk') {
      set(L, x, y, C.mouth); rect(L, x + 1, y, 4, 1, C.teeth); set(L, x + 5, y, C.mouth);
      rect(L, x + 1, y + 1, 4, 1, C.mouth);
    } else if (kind === 'o') {
      rect(L, x + 2, y, 2, 1, C.mouth); rect(L, x + 1, y + 1, 4, 1, C.mouth);
      rect(L, x + 2, y + 2, 2, 1, C.mouth);
    } else if (kind === 'frown') {
      rect(L, x + 1, y + 1, 4, 1, C.mouth); set(L, x, y + 2, C.mouth); set(L, x + 5, y + 2, C.mouth);
    } else if (kind === 'sneer') { // one corner hitched up
      rect(L, x, y + 1, 4, 1, C.mouth); set(L, x + 4, y, C.mouth); set(L, x + 5, y - 1, C.mouth); set(L, x + 2, y + 1, C.teeth); set(L, x + 3, y + 1, C.teeth);
    } else if (kind === 'smile') {
      set(L, x, y, C.mouth); rect(L, x + 1, y + 1, 4, 1, C.mouth); set(L, x + 5, y, C.mouth);
    } else { // flat: a hard straight line, corners pulled down
      rect(L, x, y + 1, 6, 1, C.mouth); set(L, x - 1, y + 2, C.mouth); set(L, x + 6, y + 2, C.mouth);
    }
  }

  // hand: 'fist' | 'open' (palm) | [dx, dy] (index finger pointing) | 'jab' (finger pointing straight at the viewer) | 'heart' (finger heart)
  function drawArm(D, arm, by, C, hand) {
    const L = Layer();
    const [sh, el, ha] = arm.map(([x, y]) => [x, y + by]);
    line(L, sh[0], sh[1], el[0], el[1], C.skin, 3);
    line(L, el[0], el[1], ha[0], ha[1], C.skin, 3);
    if (C.sleeve === 'long') {
      line(L, sh[0], sh[1], el[0], el[1], C.shirt, 4);
      const cuff = lerp(el, ha, 0.7);
      line(L, el[0], el[1], cuff[0], cuff[1], C.shirt, 3);
    } else {
      const sl = lerp(sh, el, 0.6);
      line(L, sh[0], sh[1], sl[0], sl[1], C.shirt, 4);
    }
    outline(L, C.ol);
    const Hd = Layer();
    ellipse(Hd, ha[0] + 0.5, ha[1] + 0.5, hand === 'jab' ? 2.6 : 1.9, hand === 'jab' ? 2.6 : 1.9, C.skin);
    if (hand === 'open') ellipse(Hd, ha[0] + 0.5, ha[1] - 0.5, 2.3, 2.6, C.skin);
    if (Array.isArray(hand)) line(Hd, ha[0], ha[1], ha[0] + hand[0] * 3, ha[1] + hand[1] * 3, C.skin, 2);
    if (hand === 'heart') { set(Hd, ha[0], ha[1] - 2, C.skin); set(Hd, ha[0] + 1, ha[1] - 3, C.skin); }
    outline(Hd, C.ol);
    if (hand === 'fist' || hand === undefined) set(Hd, ha[0] + 1, ha[1], C.skinSh);
    if (hand === 'open') { set(Hd, ha[0], ha[1] + 1, C.skinSh); set(Hd, ha[0] + 1, ha[1] + 1, C.skinSh); }
    if (hand === 'jab') { // index finger aimed straight at you: a ringed fingertip with a nail, knuckles curled under
      ellipse(Hd, ha[0] - 0.5, ha[1] - 0.5, 1.9, 1.9, C.ol);
      ellipse(Hd, ha[0] - 0.5, ha[1] - 0.5, 1.2, 1.2, C.skin);
      set(Hd, ha[0] - 1, ha[1] - 1, '#f6d2b4'); set(Hd, ha[0] - 2, ha[1] - 1, C.skin);
      rect(Hd, ha[0] + 1, ha[1] + 2, 2, 1, C.skinSh); set(Hd, ha[0] + 2, ha[1] + 1, C.skinSh);
    }
    comp(L, Hd);
    const s2 = lerp(sh, el, 0.4);
    set(L, s2[0], s2[1], C.shirtSh);
    comp(D, L);
  }

  // pointing out of the screen at the viewer: the arm comes straight toward the camera, so we see a sleeve
  // opening, an oversized fist with curled knuckles, and the index fingertip (nail toward us) nearest the lens.
  // grow > 0 thrusts the finger closer: everything scales up a touch.
  function drawPointAtYou(D, at, by, C, grow = 0) {
    const [cx, cy] = [at[0], at[1] + by], g = grow * 0.45;
    const L = Layer();
    ellipse(L, cx + 3, cy, 3.6 + g, 3.2 + g, C.shirt);            // sleeve coming at us
    ellipse(L, cx + 3.4, cy + 0.2, 2.1 + g, 1.8 + g, C.shirtSh);   // its dark opening
    outline(L, C.ol);
    const F = Layer();
    ellipse(F, cx + 0.5, cy + 1.5, 3.9 + g, 3.5 + g, C.skin);     // fist
    outline(F, C.ol);
    // curled fingers and the thumb wrapped across
    line(F, cx + 0, cy + 2, cx + 3, cy + 2, C.skinSh); line(F, cx + 0, cy + 4, cx + 3, cy + 4, C.skinSh);
    line(F, cx - 2, cy + 3, cx - 1, cy + 5, C.skinSh);
    set(F, cx + 3, cy + 1, C.skinSh); set(F, cx + 3, cy + 3, C.skinSh);
    // index finger aimed at the lens: ringed fingertip with the nail facing us
    const tx = cx - 2, ty = cy - 1.5, r = 2.3 + g;
    ellipse(F, tx + 0.5, ty + 0.5, r + 0.8, r + 0.8, C.ol);
    ellipse(F, tx + 0.5, ty + 0.5, r, r, C.skin);
    rect(F, tx, ty - 1, 2, 2, '#f3c9b0'); set(F, tx, ty - 1, '#fff1e6');
    set(F, tx + 1 + Math.round(g), ty + 1 + Math.round(g), C.skinSh);
    comp(L, F);
    comp(D, L);
  }

  // laptop: 'hold' = open lid facing him, its back toward us; 'up' = closed, hoisted overhead; 'broken' = smashed on the floor
  function drawLaptop(D, lp, by, C) {
    const L = Layer(), [x, y] = [lp.at[0], lp.at[1] + (lp.ground ? 0 : by)];
    if (lp.kind === 'hold') {
      rect(L, x, y, 14, 6, C.lid); rect(L, x, y, 14, 1, C.lidHi); rect(L, x + 12, y + 1, 2, 5, C.lidSh);
      rect(L, x - 1, y + 6, 16, 1, C.base);
      outline(L, C.ol);
      rect(L, x + 6, y + 2, 2, 2, C.lidHi);
    } else if (lp.kind === 'up') {
      rect(L, x, y, 16, 3, C.lid); rect(L, x, y, 16, 1, C.lidHi); rect(L, x, y + 2, 16, 1, C.base);
      outline(L, C.ol);
      rect(L, x + 7, y + 1, 2, 1, C.lidHi);
    } else {
      // the lid snapped off and flipped up, base cracked in two
      line(L, x, y + 4, x + 6, y, C.lid, 2); line(L, x + 1, y + 5, x + 7, y + 1, C.lidSh);
      rect(L, x + 6, y + 4, 5, 2, C.base); rect(L, x + 12, y + 5, 4, 1, C.base);
      set(L, x + 7, y + 4, C.key); set(L, x + 9, y + 4, C.key); set(L, x + 13, y + 5, C.key);
      outline(L, C.ol);
    }
    if (lp.sparks) {
      const S = lp.sparks === 2 ? [[-2, -3], [3, -5], [9, -4], [14, -2], [6, -7]] : [[1, -2], [11, -3]];
      for (const [dx, dy] of S) { set(L, x + dx, y + dy, C.spark); set(L, x + dx + 1, y + dy, C.sparkHi); set(L, x + dx, y + dy - 1, C.spark); }
    }
    comp(D, L);
  }

  // cigarette pack held in a fist; `out` = how far one cigarette pokes up out of the pack
  function drawSmokes(D, sm, by, C) {
    const L = Layer(), [x, y] = [sm.at[0], sm.at[1] + by], out = sm.out || 0;
    if (out) { rect(L, x + 3, y - out, 1, out, C.cig); set(L, x + 3, y - out, C.filter); }
    rect(L, x, y, 5, 6, C.pack); rect(L, x, y, 5, 2, C.packTop); rect(L, x + 4, y + 2, 1, 4, C.packSh);
    set(L, x + 2, y + 3, C.packTop);
    outline(L, C.ol);
    comp(D, L);
  }

  // 💢 anger mark, floating pink heart, steam puffs
  function drawFx(D, p, C) {
    const by = p.by || 0, oy = by + (p.hy || 0);
    if (p.steam) { // little huffs blowing out from both sides of his head
      const L = Layer(), k = p.steam === 2 ? 1 : 0.7;
      const puff = (cx, cy) => { ellipse(L, cx, cy, 1.9 * k, 1.5 * k, C.steam); ellipse(L, cx - 1.6 * k, cy + 0.6, 1.3 * k, 1.1 * k, C.steam); ellipse(L, cx + 1.6 * k, cy + 0.6, 1.3 * k, 1.1 * k, C.steam); };
      puff(7.5, 9 + oy - (p.steam === 2 ? 1 : 0)); puff(40.5, 9 + oy - (p.steam === 2 ? 1 : 0));
      outline(L, '#9aa3ad');
      comp(D, L);
    }
    if (p.heart) {
      const L = Layer(), [hx, hy, s] = p.heart;
      stamp(L, hx, hy + by, s === 2 ? ['.11.11.', '1211111', '1111111', '.11111.', '..111..', '...1...'] : ['11.11', '12111', '.111.', '..1..'], C.heart, C.heartHi);
      outline(L, C.ol);
      comp(D, L);
    }
    if (p.anger) { // four bulging corners, no outline so it reads as a cartoon symbol
      const L = Layer(), big = p.anger === 2, y = (big ? 1 : 2) + oy;
      stamp(L, 33, y, ['.12.21.', '112.211', '22...22', '.......', '22...22', '112.211', '.12.21.'], C.anger, big ? C.angerSh : C.anger);
      comp(D, L);
    }
  }

  function plaid(D, C, by) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = D[y * W + x];
      if (c !== C.shirt && c !== C.shirtSh) continue;
      const v = x % 4 === 1, h = (y - by) % 4 === 1;
      if (v && h) D[y * W + x] = C.check;
      else if (v || h) D[y * W + x] = c === C.shirtSh ? C.check : C.checkLt;
    }
  }

  // p.mirror renders a left-facing frame: shirt prints are drawn mirrored first so the flip puts them back the right way round.
  function render(p, outfitKey) {
    if (p.mirror) {
      const M = render(Object.assign({}, p, { mirror: false, flip: true }), outfitKey);
      const out = Layer();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out[y * W + x] = M[y * W + (W - 1 - x)];
      return out;
    }
    const C = Object.assign({ kind: outfitKey }, BASE, OUTFITS[outfitKey]);
    const D = Layer(), by = p.by || 0;
    const hands = p.hands || {};
    if (p.arms && p.farArm) drawArm(D, p.arms[p.farArm], by, C, hands[p.farArm]);
    drawLegs(D, p, C);
    drawTorso(D, p, C);
    drawHead(D, p, C);
    if (p.arms) {
      if (p.farArm !== 'L') drawArm(D, p.arms.L, by, C, hands.L);
      if (p.farArm !== 'R' && p.arms.R) drawArm(D, p.arms.R, by, C, hands.R);
    }
    if (p.aim) drawPointAtYou(D, p.aim.at, by, C, p.aim.grow || 0);
    if (C.check) plaid(D, C, by);
    if (p.laptop) drawLaptop(D, p.laptop, by, C);
    if (p.smokes) drawSmokes(D, p.smokes, by, C);
    drawFx(D, p, C);
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
  const ARMS_IDLE = { L: [[15, 30], [13, 34], [13, 38]], R: [[32, 30], [34, 34], [34, 38]] };

  // idle: resting scowl, fists at his sides, breathing, a blink
  const idle = [
    { eyes: 'open', mouth: 'flat', arms: ARMS_IDLE },
    { eyes: 'open', mouth: 'flat', arms: ARMS_IDLE },
    { by: 1, eyes: 'open', mouth: 'flat', arms: ARMS_IDLE, spike: 1 },
    { by: 1, eyes: 'open', mouth: 'flat', arms: ARMS_IDLE, spike: 1 },
    { by: 1, eyes: 'blink', mouth: 'flat', arms: ARMS_IDLE, spike: 1 },
    { eyes: 'open', mouth: 'flat', arms: ARMS_IDLE },
  ];
  const idleMs = [280, 110, 110, 140, 140, 320];

  // running = keyboard warrior: laptop braced against his chest, elbows pumping, ranting at the screen
  const TYPE = (k) => ({
    L: [[15, 30], [14, 35], [18, 36 - (k % 2)]],
    R: [[32, 30], [34, 35], [30, 35 - ((k + 1) % 2)]],
  });
  const HOLD_LAPTOP = (dx = 0, dy = 0) => ({ kind: 'hold', at: [17 + dx, 29 + dy] });
  const rant = [
    { eyes: 'down', mouth: 'grit', arms: TYPE(0), laptop: HOLD_LAPTOP(0, 0) },
    { eyes: 'down', mouth: 'talk', arms: TYPE(1), laptop: HOLD_LAPTOP(0, 1), anger: 1 },
    { eyes: 'stare', brow: 'v', mouth: 'shout', arms: TYPE(0), laptop: HOLD_LAPTOP(0, 0), anger: 2, spike: 1 },
    { eyes: 'down', mouth: 'grit', arms: TYPE(1), laptop: HOLD_LAPTOP(0, 1), anger: 1 },
    { eyes: 'down', mouth: 'talk', arms: TYPE(0), laptop: HOLD_LAPTOP(0, 0) },
    { eyes: 'glare', brow: 'v', mouth: 'sneer', arms: TYPE(1), laptop: HOLD_LAPTOP(0, 1), anger: 1 },
  ];
  const rantMs = [110, 110, 180, 110, 110, 200];

  // review = points straight out of the screen at you and holds it; only the face changes,
  // and on each shout the fingertip thrusts closer (grows) — the arm never swings
  const AIMED = (grow = 0) => ({ arms: { L: ARMS_IDLE.L }, aim: { at: [30, 33], grow } });
  const point = [
    Object.assign({ eyes: 'glare', brow: 'v', mouth: 'flat', hy: 1, anger: 1 }, AIMED(0)),
    Object.assign({ eyes: 'stare', brow: 'v', mouth: 'shout', hy: 1, anger: 2, spike: 1 }, AIMED(1)),
    Object.assign({ eyes: 'stare', brow: 'v', mouth: 'grit', hy: 1, anger: 2 }, AIMED(0)),
    Object.assign({ eyes: 'stare', brow: 'v', mouth: 'shout', hy: 1, anger: 2, spike: 1 }, AIMED(1)),
    Object.assign({ eyes: 'glare', brow: 'v', mouth: 'grit', hy: 1, anger: 1 }, AIMED(0)),
    Object.assign({ eyes: 'stare', brow: 'v', mouth: 'sneer', hy: 1, anger: 2 }, AIMED(0)),
  ];
  const pointMs = [240, 160, 160, 160, 200, 320];

  // running-right: 3/4 view facing screen-right, stomping; near arm = his right (L), far arm = his left (R)
  const arm = (sh, ha, bend = 2) => [sh, [(sh[0] + ha[0]) / 2, (sh[1] + ha[1]) / 2 + bend], ha];
  const STRIDE = [ // near-leg offset, far-leg offset, lifts, body bob
    [3, -3, 0, 0, 0], [1, -1, 0, 2, 0], [0, 0, 0, 3, -1], [-2, 2, 0, 1, 0],
    [-3, 3, 0, 0, 0], [-1, 1, 2, 0, 0], [0, 0, 3, 0, -1], [2, -2, 1, 0, 0],
  ];
  const runRight = STRIDE.map(([l, r, ly, ry, by], k) => {
    const t = (3 - l) / 6; // near arm swings opposite the near leg
    return {
      turn: 1, profile: true, fx: 2, eyes: 'look', look: [1, 0], brow: 'v', mouth: k % 4 === 2 ? 'grit' : 'flat', by, spike: k % 2,
      legs: { l, r, ly, ry }, farArm: 'R',
      arms: {
        L: arm([15, 30], [10 + 9 * t, 35 - t]),
        R: arm([32, 30], [38 - 8 * t, 33 + 2 * t]),
      },
    };
  });
  const runMs = [120, 120, 120, 120, 120, 120, 120, 220];
  const runLeft = runRight.map(f => Object.assign({}, f, { mirror: true }));

  // waving = the cute one: a shy finger-heart by his cheek, a pink heart floats up, scowl gone
  const HEART_ARM = (y = 25) => ({ L: ARMS_IDLE.L, R: [[32, 30], [37, 31], [35, y]] });
  const cute = { eyes: 'happy', brow: 'soft', mouth: 'cat', cute: true, hands: { R: 'heart' } };
  const wave = [
    Object.assign({ arms: HEART_ARM(26) }, cute),
    Object.assign({ arms: HEART_ARM(25), heart: [37, 19, 1], hx: -1 }, cute),
    Object.assign({ arms: HEART_ARM(25), heart: [37, 14, 2], hx: -1, spike: 1 }, cute),
    Object.assign({ arms: HEART_ARM(25), heart: [38, 9, 2], hx: -1, eyes: 'blink' }, cute),
  ];
  const waveMs = [160, 160, 160, 320];

  // jumping: crouch, then a two-fisted "YES!" in the air
  const ARMS_UP = (y) => ({ L: [[15, 30], [10, y + 7], [9, y]], R: [[32, 30], [37, y + 7], [38, y]] });
  const jump = [
    { by: 2, eyes: 'glare', mouth: 'grit', arms: { L: [[15, 30], [12, 34], [11, 37]], R: [[32, 30], [35, 34], [36, 37]] } },
    { gy: -3, eyes: 'stare', brow: 'v', mouth: 'shout', arms: ARMS_UP(18), legs: { ly: 1, ry: 1 } },
    { gy: -4, eyes: 'happy', brow: 'knit', mouth: 'grin', arms: ARMS_UP(13), legs: { ly: 2, ry: 2 }, spike: 1 },
    { gy: -2, eyes: 'happy', brow: 'knit', mouth: 'grin', arms: ARMS_UP(20), legs: { ly: 1, ry: 1 } },
    { by: 1, eyes: 'open', mouth: 'sneer', arms: ARMS_IDLE },
  ];
  const jumpMs = [140, 140, 140, 140, 280];

  // offer (Codex jumping row): "家人来一根" — fishes a pack out of his pocket, hops forward and holds it out
  // with one cigarette popped up for you; the hop keeps the row's required lift off the ground
  const offer = [
    { eyes: 'open', mouth: 'talk', arms: { L: ARMS_IDLE.L, R: [[32, 30], [35, 35], [32, 40]] } },
    { eyes: 'happy', mouth: 'grin', arms: { L: ARMS_IDLE.L, R: [[32, 30], [36, 34], [31, 32]] }, smokes: { at: [29, 28], out: 0 } },
    { gy: -2, eyes: 'happy', mouth: 'talk', arms: { L: ARMS_IDLE.L, R: [[32, 30], [38, 29], [40, 24]] }, smokes: { at: [38, 19], out: 2 }, legs: { ly: 1, ry: 1 }, spike: 1 },
    { gy: -1, eyes: 'happy', mouth: 'grin', arms: { L: ARMS_IDLE.L, R: [[32, 30], [38, 29], [40, 25]] }, smokes: { at: [38, 20], out: 3 } },
    { eyes: 'happy', mouth: 'grin', arms: { L: ARMS_IDLE.L, R: [[32, 30], [38, 30], [40, 26]] }, smokes: { at: [38, 21], out: 3 } },
  ];
  const offerMs = [140, 140, 140, 140, 280];

  // hug (birthday site only): side-on facing screen-left, both arms thrown forward, beaming
  const HUG_ARMS = { L: [[15, 30], [27, 31], [40, 30]], R: [[32, 30], [39, 30], [45, 29]] };
  const hugBase = { turn: 1, profile: true, fx: 2, eyes: 'happy', brow: 'soft', mouth: 'cat', cute: true, farArm: 'R', arms: HUG_ARMS, mirror: true };
  const hug = [
    Object.assign({}, hugBase),
    Object.assign({}, hugBase, { by: 1, heart: [36, 14, 1] }),
    Object.assign({}, hugBase, { heart: [37, 9, 2] }),
    Object.assign({}, hugBase, { by: 1, heart: [38, 5, 2], spike: 1 }),
  ];
  const hugMs = [180, 180, 180, 260];

  // failed: rage-smashes the laptop — glares at it, hoists it overhead, slams it, stands fuming over the wreck
  const OVERHEAD = (y) => ({ L: [[15, 30], [11, 21], [16, y]], R: [[32, 30], [36, 21], [31, y]] });
  const SLAM = { L: [[15, 30], [17, 35], [20, 39]], R: [[32, 30], [32, 35], [29, 39]] };
  const WRECK = { kind: 'broken', at: [32, 42], ground: true };
  const failed = [
    { eyes: 'down', mouth: 'grit', arms: TYPE(0), laptop: HOLD_LAPTOP(0, 0), anger: 1 },
    { eyes: 'stare', brow: 'v', mouth: 'grit', arms: TYPE(1), laptop: HOLD_LAPTOP(1, 0), anger: 2 },
    { eyes: 'stare', brow: 'v', mouth: 'shout', arms: OVERHEAD(8), laptop: { kind: 'up', at: [16, 4] }, anger: 2, spike: 1 },
    { by: 1, eyes: 'stare', brow: 'v', mouth: 'shout', arms: SLAM, laptop: Object.assign({ sparks: 2 }, WRECK), anger: 2 },
    { by: 1, eyes: 'glare', brow: 'v', mouth: 'grit', arms: ARMS_IDLE, laptop: Object.assign({ sparks: 1 }, WRECK), steam: 2 },
    { eyes: 'glare', brow: 'v', mouth: 'grit', arms: ARMS_IDLE, laptop: WRECK, steam: 2 },
    { by: 1, eyes: 'blink', brow: 'v', mouth: 'frown', arms: ARMS_IDLE, laptop: WRECK, steam: 1 },
    { by: 1, eyes: 'glare', brow: 'v', mouth: 'frown', arms: ARMS_IDLE, laptop: WRECK, steam: 1 },
  ];
  const failedMs = [160, 160, 200, 160, 160, 160, 160, 300];

  // waiting: arms folded, glaring up at you, foot tapping — "well?"
  const FOLD = { L: [[15, 30], [16, 35], [28, 34]], R: [[32, 30], [31, 35], [19, 33]] };
  const waiting = [
    { eyes: 'look', look: [0, -1], mouth: 'flat', arms: FOLD },
    { eyes: 'look', look: [0, -1], mouth: 'flat', arms: FOLD, legs: { ry: 1 } },
    { eyes: 'look', look: [0, -1], mouth: 'flat', arms: FOLD },
    { eyes: 'blink', mouth: 'flat', arms: FOLD, legs: { ry: 1 } },
    { eyes: 'look', look: [0, -1], mouth: 'flat', arms: FOLD },
    { eyes: 'glare', brow: 'v', mouth: 'sneer', arms: FOLD, legs: { ry: 1 }, anger: 1 },
  ];
  const waitingMs = [150, 150, 150, 150, 150, 260];

  // 16 look directions, clockwise from up (000). Body stays anchored; the face turns and the eyes aim.
  const lookAt = (deg) => {
    const r = deg * Math.PI / 180, s = Math.sin(r), c = Math.cos(r);
    const q = (v) => (v > 0.38 ? 1 : v < -0.38 ? -1 : 0);
    return {
      eyes: 'look', look: [q(s), q(-c)], mouth: 'flat', arms: ARMS_IDLE,
      fx: Math.round(2 * s), fy: Math.round(-1.6 * c), hy: c < -0.7 ? 1 : 0, // only tilt down: raising the head would make the cell taller than idle
      turn: s > 0.7 ? 1 : s < -0.7 ? -1 : 0,
    };
  };
  const LOOK_DEG = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5];
  const looks = LOOK_DEG.map(lookAt);

  window.LILI = {
    W, H, render, BASE, OUTFITS,
    anims: {
      idle: { frames: idle, ms: idleMs },
      rant: { frames: rant, ms: rantMs },
      point: { frames: point, ms: pointMs },
      runRight: { frames: runRight, ms: runMs },
      runLeft: { frames: runLeft, ms: runMs },
      wave: { frames: wave, ms: waveMs },
      jump: { frames: jump, ms: jumpMs },
      offer: { frames: offer, ms: offerMs },
      hug: { frames: hug, ms: hugMs },
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
