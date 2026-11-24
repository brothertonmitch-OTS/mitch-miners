// ============================================================================
// MULTI-MINE — 60 Weapons & Contraptions ("Ink & Grit" style)
// Guns: side view, muzzle pointing right. Deployables: standing on the ground.
// Orbitals & drones: top-ish view, centred so they spin nicely.
// ============================================================================
(function () {
  const { C, wrap, glint, rivet, S, register } = window.MM.Art;
  const { R, Ci, E, Pa, Po, L, G, bolt, flame, flake, hazard } = S;
  const INK = C.ink;

  // ---- Shared parts ("Ink & Grit": hand-inked, hatched shadow side) ---------
  const { part, limb, circ } = S;
  const grip = (x, y, f = C.inkSoft, h = 22) =>
    part(`M${x} ${y} L${x + 11} ${y} L${x + 8} ${y + h} Q${x + 7} ${y + h + 3} ${x + 4} ${y + h + 3} L${x - 1} ${y + h + 3} Q${x - 4} ${y + h + 3} ${x - 3} ${y + h}Z`, f, {
      sh: `M${x + 6} ${y} L${x + 11} ${y} L${x + 8} ${y + h} Q${x + 7} ${y + h + 3} ${x + 4} ${y + h + 3}Z`
    }) + L(`M${x + 1} ${y + 6} h6 M${x} ${y + 11} h6 M${x - 1} ${y + 16} h6`, INK, 1.2);
  const trigger = (x, y) => L(`M${x} ${y} q1 7 6 7`, INK, 2.4);
  const muzzleFlash = (x, y, s = 1) =>
    part(`M${x} ${y} L${x + 7 * s} ${y - 6 * s} L${x + 6 * s} ${y - 1 * s} L${x + 13 * s} ${y} L${x + 6 * s} ${y + 1 * s} L${x + 7 * s} ${y + 6 * s}Z`, C.hatYL, { w: 1.6 });
  const tripod = (cx, y, col = C.steelDD) =>
    limb(`M${cx} ${y} L${cx - 18} ${y + 22}`, col, 3.6) + limb(`M${cx} ${y} L${cx + 18} ${y + 22}`, col, 3.6) + limb(`M${cx} ${y} V${y + 24}`, col, 3.6) +
    part(`M${cx - 22} ${y + 21} L${cx - 13} ${y + 21} L${cx - 13} ${y + 25} L${cx - 22} ${y + 25}Z`, C.steelD, { w: 2 }) +
    part(`M${cx + 13} ${y + 21} L${cx + 22} ${y + 21} L${cx + 22} ${y + 25} L${cx + 13} ${y + 25}Z`, C.steelD, { w: 2 });
  const base = (cx, y, w, f = C.steelD) =>
    part(`M${cx - w / 2 + 4} ${y} L${cx + w / 2 - 4} ${y} Q${cx + w / 2} ${y} ${cx + w / 2} ${y + 5} Q${cx + w / 2} ${y + 10} ${cx + w / 2 - 4} ${y + 10} L${cx - w / 2 + 4} ${y + 10} Q${cx - w / 2} ${y + 10} ${cx - w / 2} ${y + 5} Q${cx - w / 2} ${y} ${cx - w / 2 + 4} ${y}Z`, f, {
      sh: `M${cx - w / 2} ${y + 6} L${cx + w / 2} ${y + 6} Q${cx + w / 2} ${y + 10} ${cx + w / 2 - 4} ${y + 10} L${cx - w / 2 + 4} ${y + 10} Q${cx - w / 2} ${y + 10} ${cx - w / 2} ${y + 6}Z`,
      hl: `M${cx - w / 2 + 4} ${y + 2} L${cx + w / 2 - 6} ${y + 2} L${cx + w / 2 - 6} ${y + 4} L${cx - w / 2 + 4} ${y + 4}Z`
    });
  const mineDome = (f, fD, light = C.red) =>
    part('M16 66 Q16 58 48 58 Q80 58 80 66 Q80 74 48 74 Q16 74 16 66Z', C.inkSoft) +
    part('M18 64 C18 44 32 36 48 36 C64 36 78 44 78 64Z', f, { sh: 'M50 36 C64 36 78 44 78 64 L62 64 C62 50 57 40 50 36Z', shc: fD, hl: 'M24 58 Q25 46 34 41 Q29 49 30 58Z' }) +
    part(circ(48, 39, 6), light, { w: 2.4 }) + `<circle cx="46.2" cy="37.2" r="1.8" fill="#FFF"/>` +
    L('M30 52 l5 3 M66 50 l-4 4', INK, 1.4);
  const prop = (cx, cy, w = 26) =>
    part(`M${cx - w / 2} ${cy} Q${cx - w / 2} ${cy - 3.6} ${cx} ${cy - 3.6} Q${cx + w / 2} ${cy - 3.6} ${cx + w / 2} ${cy} Q${cx + w / 2} ${cy + 3.6} ${cx} ${cy + 3.6} Q${cx - w / 2} ${cy + 3.6} ${cx - w / 2} ${cy}Z`, C.steelL, { w: 2.2 }) +
    part(circ(cx, cy, 2.6), C.steelDD, { w: 1.6 });
  const saw = (cx, cy, r, f = C.steelL, teeth = 12) => {
    let d = '';
    for (let i = 0; i < teeth * 2; i++) {
      const a = (Math.PI * i) / teeth;
      const rr = i % 2 ? r : r * 0.76;
      // hooked teeth: the outer point leans forward a little
      const aa = i % 2 ? a + 0.12 : a;
      d += `${i ? 'L' : 'M'}${(cx + Math.cos(aa) * rr).toFixed(1)} ${(cy + Math.sin(aa) * rr).toFixed(1)} `;
    }
    return part(d + 'Z', f, { sh: `M${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx} ${cy + r} L${cx} ${cy}Z`, shc: C.steel }) +
      part(circ(cx, cy, r * 0.45), C.steel, { w: 2.4 }) + part(circ(cx, cy, r * 0.16), C.inkSoft, { w: 1.6 }) +
      L(`M${cx - r * 0.55} ${cy - r * 0.2} A${r * 0.6} ${r * 0.6} 0 0 1 ${cx - r * 0.2} ${cy - r * 0.55}`, '#FFF', 1.6);
  };
  const crystal = (x, y, s, f = C.crystal, fD = C.crystalD) =>
    G(`translate(${x} ${y}) scale(${s})`,
      part('M0 -14 L8 -4 L6 12 L-6 12 L-8 -4Z', f, { w: 2.4, sh: 'M0 -14 L8 -4 L6 12 L1 12 L2 -4Z', shc: fD, hl: 'M-5 -4 L-2 -8 L-2 6 L-5 6Z', hlo: 0.75 }) +
      L('M0 -14 L2 -4 L1 12', INK, 1.2));
  const tank = (x, y, w, h, f, fD) =>
    part(`M${x + w / 2} ${y} Q${x + w} ${y} ${x + w} ${y + w / 2} L${x + w} ${y + h - w / 2} Q${x + w} ${y + h} ${x + w / 2} ${y + h} Q${x} ${y + h} ${x} ${y + h - w / 2} L${x} ${y + w / 2} Q${x} ${y} ${x + w / 2} ${y}Z`, f, {
      sh: `M${x + w * 0.6} ${y + 1} Q${x + w} ${y + 2} ${x + w} ${y + w / 2} L${x + w} ${y + h - w / 2} Q${x + w} ${y + h} ${x + w * 0.6} ${y + h - 1}Z`, shc: fD,
      hl: `M${x + w * 0.2} ${y + w * 0.45} L${x + w * 0.38} ${y + w * 0.3} L${x + w * 0.38} ${y + h * 0.55} L${x + w * 0.2} ${y + h * 0.55}Z`, hlo: 0.6
    });

  // ---- Hand-drawn primitives for the tool redraw ------------------------------
  const DEEP = '#2A2238';
  const CREAM = '#F4F1EA';
  // a straight edge drawn with a slight hand bow (deterministic per shape)
  const bow = (x1, y1, x2, y2, k) => {
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const b = ((((k * 7919) % 5) + 5) % 5 - 2) * 0.24 * Math.min(1, len / 20);
    const nx = -(y2 - y1) / len;
    const ny = (x2 - x1) / len;
    return `Q${((x1 + x2) / 2 + nx * b).toFixed(1)} ${((y1 + y2) / 2 + ny * b).toFixed(1)} ${x2} ${y2}`;
  };
  const rr = (x, y, w, h, r) => {
    r = Math.min(r, w / 2, h / 2);
    const k = Math.round(x * 3 + y * 7 + w + h);
    return `M${x + r} ${y} ${bow(x + r, y, x + w - r, y, k)} Q${x + w} ${y} ${x + w} ${y + r} ${bow(x + w, y + r, x + w, y + h - r, k + 1)} ` +
      `Q${x + w} ${y + h} ${x + w - r} ${y + h} ${bow(x + w - r, y + h, x + r, y + h, k + 2)} Q${x} ${y + h} ${x} ${y + h - r} ${bow(x, y + h - r, x, y + r, k + 3)} Q${x} ${y} ${x + r} ${y}Z`;
  };
  const shine = (x1, y1, x2, y2, w = 1.8) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#FFF8E6" stroke-width="${w}" stroke-linecap="round" opacity="0.75"/>`;
  // box: hand-drawn rounded rectangle with a hatched shadow side and a pen highlight.
  // o.sh: 'r' (right), 'b' (bottom), false; default picks by shape.
  const box = (x, y, w, h, r, f, o = {}) => {
    r = Math.min(r, w / 2, h / 2);
    const side = o.sh === undefined ? (w > h * 1.6 ? 'b' : 'r') : o.sh;
    let sh;
    if (side === 'r') {
      const sx = x + w * 0.64;
      sh = `M${sx} ${y} L${x + w - r} ${y} Q${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} L${sx} ${y + h} Q${sx + w * 0.07} ${y + h / 2} ${sx} ${y}Z`;
    } else if (side === 'b') {
      const sy = y + h * 0.62;
      sh = `M${x} ${sy} Q${x + w / 2} ${sy - h * 0.06} ${x + w} ${sy} L${x + w} ${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} Q${x} ${y + h} ${x} ${y + h - r}Z`;
    }
    let s = part(rr(x, y, w, h, r), f, { w: o.w, sh, shc: o.shc });
    if (o.hl !== false && w >= 14 && h >= 10) {
      s += w > h ? shine(x + r + 2, y + 3.4, x + Math.max(r + 6, w * 0.42), y + 3.4) : shine(x + 3.6, y + r + 2, x + 3.6, y + Math.max(r + 6, h * 0.42));
    }
    return s;
  };
  const crescent = (cx, cy, r) => `M${cx + r * 0.3} ${cy - r * 0.95} A${r} ${r} 0 0 1 ${cx} ${cy + r} A${r * 0.62} ${r} 0 0 0 ${cx + r * 0.3} ${cy - r * 0.95}Z`;
  const disc = (cx, cy, r, f, o = {}) =>
    part(circ(cx, cy, r), f, { w: o.w === undefined ? (r < 6 ? 2 : 2.6) : o.w, sh: o.sh === false ? undefined : crescent(cx, cy, r), shc: o.shc }) +
    (o.hl === false || r < 5 ? '' : `<path d="M${cx - r * 0.62} ${cy - r * 0.05} A${r * 0.62} ${r * 0.62} 0 0 1 ${cx - r * 0.1} ${cy - r * 0.6}" fill="none" stroke="#FFF8E6" stroke-width="${Math.min(2.2, r * 0.22).toFixed(2)}" stroke-linecap="round" opacity="0.75"/>`);
  const oval = (cx, cy, rx, ry) => `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
  const glass = (x, y, w, h, col) =>
    part(rr(x, y, w, h, Math.min(4, h / 2)), DEEP, { w: 2.2 }) +
    `<path d="M${x + 2.5} ${y + h - 2.5} L${x + w * 0.45} ${y + 2.5} M${x + w * 0.4} ${y + h - 2.5} L${x + w * 0.72} ${y + 2.5}" stroke="${col}" stroke-width="${Math.max(1.4, h * 0.22).toFixed(2)}" stroke-linecap="round" opacity="0.9"/>`;
  const scratch = (d) => L(d, INK, 1.3);
  const tape = (x, y, w, h, rot = -8) => G(`rotate(${rot} ${x + w / 2} ${y + h / 2})`, part(rr(x, y, w, h, 1), '#D9CBA8', { w: 1.6 }) + L(`M${x + 2} ${y + h / 2} h${w - 4}`, '#B9A983', 1));
  const fuse = (x, y) => L(`M${x} ${y} q2 -5 6 -5`, INK, 2) + part(circ(x + 6.4, y - 5.2, 2), C.hatYL, { w: 1.2 });
  const spark = (x, y, r, col = C.hatYL) =>
    `<path d="M${x} ${y - r} L${x + r * 0.25} ${y - r * 0.25} L${x + r} ${y} L${x + r * 0.25} ${y + r * 0.25} L${x} ${y + r} L${x - r * 0.25} ${y + r * 0.25} L${x - r} ${y} L${x - r * 0.25} ${y - r * 0.25}Z" fill="${col}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
  const barrel = (x, y, len, h, f = C.steelL) =>
    box(x, y, len, h, Math.min(3, h / 2), f, { w: 2.4, hl: false }) + L(`M${x + len - 3} ${y + 1.5} V${y + h - 1.5}`, INK, 1.4);

  const T = {
    // ===== MINES =================================================================
    prox_mine: wrap(
      mineDome(C.steel, C.steelD) + hazard(22, 56, 52, 7) +
      scratch('M40 46 l6 2 M58 44 l3 4') + L('M48 33 V27 M42 30 l-3 -4 M54 30 l3 -4', C.red, 1.8)
    ),
    cluster_charge: wrap(
      L('M34 40 Q48 22 62 40', INK, 6) + L('M34 40 Q48 22 62 40', C.brownL, 2.6) +
      box(24, 38, 48, 36, 9, C.brown, { shc: C.brownD }) + box(30, 50, 36, 9, 3, C.inkSoft, { sh: false, hl: false, w: 2.4 }) +
      tape(30, 64, 18, 6, 6) + scratch('M58 66 l6 3') +
      disc(16, 66, 7, C.red) + fuse(16, 59) + disc(80, 66, 7, C.red) + fuse(80, 59) +
      disc(36, 81, 6, C.red) + disc(60, 81, 6, C.red)
    ),
    cryo_mine: wrap(
      mineDome(C.ice, C.iceD, C.blue) + box(22, 56, 52, 7, 3, C.blueD, { w: 2, sh: false, hl: false }) +
      flake(48, 50, 6, CREAM) + `<path d="M26 58 l2 6 l2 -6 M62 58 l2 5 l2 -5" fill="${C.ice}" stroke="${INK}" stroke-width="1.2"/>`
    ),
    magnet_mine: wrap(
      part(oval(48, 72, 30, 9), C.inkSoft) +
      part('M24 70 L24 46 A24 24 0 0 1 72 46 L72 70 L58 70 L58 46 A10 10 0 0 0 38 46 L38 70Z', C.red, {
        sh: 'M62 26 A24 24 0 0 1 72 46 L72 70 L64 70 L64 46 Q64 34 58 30Z', hl: 'M27 46 A21 21 0 0 1 36 29 L38 31 A18 18 0 0 0 31 46Z', hlo: 0.6
      }) +
      box(22, 60, 16, 12, 2, C.steelL, { hl: false }) + box(58, 60, 16, 12, 2, C.steelL, { hl: false }) +
      disc(48, 30, 4.4, C.hatY) + L('M14 42 q-4 6 0 12 M82 42 q4 6 0 12 M8 38 q-6 10 0 20 M88 38 q6 10 0 20', C.blue, 2.4)
    ),
    arc_mine: wrap(
      mineDome(C.purple, C.purpleD, C.screen) + box(22, 56, 52, 7, 3, C.hatY, { w: 2, sh: false, hl: false }) +
      limb('M28 44 L20 32', C.steelL, 2.4) + limb('M68 44 L76 32', C.steelL, 2.4) + limb('M48 36 V22', C.steelL, 2.4) +
      disc(20, 31, 4.2, C.screen) + disc(76, 31, 4.2, C.screen) + disc(48, 20, 4.2, C.screen) +
      L('M24 28 L30 22 L28 26 L36 20 M72 28 L66 22 L68 26 L60 20', C.screen, 1.8)
    ),

    // ===== TURRETS & TOWERS =======================================================
    gear_turret: wrap(
      tripod(48, 56) +
      barrel(62, 35, 26, 7, C.steelDD) + barrel(62, 45, 26, 7, C.steelDD) +
      box(30, 30, 36, 28, 12, C.steelL, { shc: C.steel }) +
      disc(42, 44, 8.4, C.inkSoft, { sh: false, hl: false }) + disc(42, 44, 4.6, C.screen, { w: 1.6 }) + `<circle cx="40.6" cy="42.6" r="1.4" fill="#FFF"/>` +
      rivet(34, 34) + rivet(58, 52) + scratch('M54 36 l5 3')
    ),
    welder_turret: wrap(
      base(48, 76, 44) + box(38, 38, 20, 40, 5, C.orange, { shc: C.orangeD }) + hazard(38, 62, 20, 6) +
      barrel(62, 27, 18, 8, C.steelDD) + part('M80 25 L91 31 L80 37Z', C.blueL, { w: 2 }) + spark(92, 24, 3.4) +
      box(30, 22, 36, 20, 8, C.steel, { shc: C.steelD }) + glass(36, 27, 18, 9, C.screen) + rivet(60, 36)
    ),
    repair_sentinel: wrap(
      `<ellipse cx="48" cy="84" rx="18" ry="4" fill="${INK}" opacity="0.25"/>` +
      L('M48 22 V13', INK, 3) + disc(48, 11, 4.4, C.greenL) +
      part('M22 46 L11 39 L11 53Z', C.green, { w: 2.2 }) + part('M74 46 L85 39 L85 53Z', C.green, { w: 2.2 }) +
      disc(48, 46, 24, C.steelL, { shc: C.steel }) +
      box(36, 38, 24, 16, 6, CREAM, { w: 2.6, hl: false, shc: '#C9D3DD' }) +
      part('M45 40 L51 40 L51 43.5 L54.5 43.5 L54.5 49.5 L51 49.5 L51 53 L45 53 L45 49.5 L41.5 49.5 L41.5 43.5 L45 43.5Z', C.green, { w: 1.4 }) +
      scratch('M30 60 l5 2 M64 32 l4 3')
    ),
    tesla_pylon: wrap(
      base(48, 78, 40) +
      part('M40 78 L44 34 L52 34 L56 78Z', C.steelD, { sh: 'M49 34 L52 34 L56 78 L50 78Z', shc: C.steelDD }) +
      [44, 54, 64].map((y) => box(39, y, 18, 5, 2.5, C.hatY, { w: 2.2, sh: false, hl: false })).join('') +
      disc(48, 26, 13, C.purpleL) + disc(48, 26, 8, C.screen, { w: 2.2, sh: false }) +
      bolt(25, 20, 1) + bolt(71, 20, 1) + spark(48, 9, 3.4, C.screen)
    ),
    cryo_turret: wrap(
      base(48, 76, 44) + tank(30, 30, 18, 46, C.ice, C.iceD) +
      box(48, 44, 18, 32, 5, C.steelL, { shc: C.steel }) + barrel(60, 40, 22, 9, C.steelD) +
      part('M82 38 L92 32 L92 56 L82 50Z', C.blueL, { w: 2.2, sh: 'M87 35 L92 32 L92 56 L87 53Z', shc: C.blue }) +
      flake(39, 50, 5, CREAM) + `<path d="M84 58 l1.5 5 l1.5 -5 M88 60 l1.5 4 l1.5 -4" fill="${C.ice}" stroke="${INK}" stroke-width="1.1"/>`
    ),
    laser_post: wrap(
      base(48, 78, 34) + box(41, 34, 14, 46, 4, C.steelD, { shc: C.steelDD }) + hazard(41, 60, 14, 6) +
      L('M60 22 H86', INK, 5) + L('M60 22 H86', C.redL, 2.4) + L('M36 22 H10', INK, 5) + L('M36 22 H10', C.redL, 2.4) +
      crystal(48, 26, 1.15, C.red, C.redD)
    ),
    steam_boiler: wrap(
      base(48, 78, 52) +
      box(58, 18, 8, 16, 2, C.steelD, { w: 2.4, hl: false }) +
      part('M62 12 Q54 12 55 7 Q56 2 63 3 Q68 -1 73 3 Q80 3 79 8 Q78 13 70 12Z', CREAM, { w: 2, sh: 'M74 4 Q80 3 79 8 Q78 13 70 12 Q76 9 74 4Z', shc: '#C9C2B6' }) +
      box(24, 32, 48, 46, 20, '#D8A64A', { shc: '#B5832C' }) + box(22, 48, 52, 6, 2, '#8E6420', { w: 2.4, sh: false, hl: false }) +
      disc(40, 63, 8.4, CREAM, { w: 2.4, shc: '#C9C2B6' }) + L('M40 63 L44.5 58.5', C.red, 2) + `<circle cx="40" cy="63" r="1.3" fill="${INK}"/>` +
      rivet(30, 40) + rivet(66, 40) + rivet(60, 68) + scratch('M58 38 l5 3')
    ),
    flame_turret: wrap(
      tripod(44, 58) + flame(86, 45, 0.95) +
      part('M72 36 L80 40 L80 50 L72 54Z', C.inkSoft, { w: 2.2 }) + box(54, 38, 18, 14, 4, C.steelD, { shc: C.steelDD }) +
      box(22, 32, 36, 28, 10, C.orange, { shc: C.orangeD }) + glass(28, 38, 12, 9, C.lavaL) + rivet(52, 54) + scratch('M44 36 l4 3')
    ),
    prism_obelisk: wrap(
      base(48, 78, 40) +
      L('M16 40 l8 2 M80 40 l-8 2 M18 58 l7 -1 M78 58 l-7 -1', C.screen, 2.6) +
      part('M48 8 L64 30 L58 78 L38 78 L32 30Z', C.purpleL, { sh: 'M48 8 L64 30 L58 78 L49 78 L50 30Z', shc: C.purple, hl: 'M36 32 L39 30 L41 72 L39 72Z', hlo: 0.7 }) +
      L('M32 30 H64 M48 8 L50 30 L49 78', INK, 1.6) + disc(48, 46, 5.4, CREAM, { sh: false })
    ),
    cryo_coil: wrap(
      base(48, 78, 44) + box(36, 52, 24, 26, 5, C.steelD, { shc: C.steelDD }) +
      limb('M48 52 V14', C.steelL, 2.2) +
      [0, 1, 2, 3].map((i) => part(oval(48, 48 - i * 9, 20 - i * 2, 5), C.blueL, { w: 2.6, sh: `M${48} ${48 - i * 9 + 1} L${68 - i * 2} ${48 - i * 9} A${20 - i * 2} 5 0 0 1 48 ${48 - i * 9 + 5}Z`, shc: C.blue })).join('') +
      disc(48, 12, 7.4, C.ice, { shc: C.iceD }) + flake(48, 12, 4, CREAM) +
      L('M16 28 q-6 10 0 20 M80 28 q6 10 0 20', C.ice, 2.8)
    ),
    gravity_well: wrap(
      part(oval(48, 72, 30, 10), C.inkSoft) + part(oval(48, 70, 22, 6), C.purpleD, { w: 2.2 }) +
      disc(48, 46, 22, C.purple, { shc: C.purpleD }) +
      L('M34 46 a14 14 0 0 1 24 -8 M58 52 a12 12 0 0 1 -22 2', C.purpleL, 3) + part(circ(48, 46, 6), INK, { w: 0 }) +
      spark(18, 22, 3, C.screen) + spark(80, 26, 2.6, C.screen) + spark(72, 11, 2, C.purpleL)
    ),
    bio_garden: wrap(
      part('M34 55 C30 40 36 30 40 26 C42 36 40 46 38 55Z', C.green, { sh: 'M40 26 C42 36 40 46 38 55 L36 55 C38 44 40 34 40 26Z' }) +
      part('M50 55 C48 36 58 24 64 22 C62 36 58 46 54 55Z', C.greenD) +
      part('M44 55 C44 40 48 32 50 28 C52 38 50 46 48 55Z', C.greenL) +
      disc(40, 29, 6.4, C.pink) + `<circle cx="40" cy="29" r="2" fill="${C.hatY}"/>` + disc(63, 23, 6.4, C.hatY) + `<circle cx="63" cy="23" r="2" fill="${C.orangeD}"/>` +
      box(20, 58, 56, 24, 8, C.brown, { shc: C.brownD }) + box(16, 54, 64, 9, 4, C.steelL, { sh: false, w: 2.6 }) +
      L('M28 70 h10 M54 74 h12', C.brownD, 1.6)
    ),
    magma_vent: wrap(
      part('M10 80 L34 34 L62 34 L86 80Z', C.rock, { sh: 'M52 34 L62 34 L86 80 L62 80 Q62 56 52 34Z', hl: 'M20 72 L34 42 L36 44 L24 72Z' }) +
      part(oval(48, 34, 15, 5), C.lava, { w: 2.6 }) +
      part('M40 36 q-2 12 -6 18 q8 -4 10 -16Z M56 36 q2 10 8 16 q-8 -2 -10 -14Z', C.lava, { w: 2 }) +
      flame(48, 22, 1.2) + disc(30, 12, 3, C.lavaL, { w: 1.6 }) + disc(68, 16, 2.6, C.lava, { w: 1.6 }) +
      scratch('M22 66 l6 -3 M70 70 l-5 -4')
    ),
    thermal_kiln: wrap(
      base(48, 78, 52) + box(38, 12, 20, 16, 3, C.steelD, { hl: false }) + part(oval(48, 8, 8, 4), C.steelL, { w: 2 }) +
      box(24, 26, 48, 54, 8, '#A04A3A', { shc: '#7E3529' }) +
      L('M24 40 H72 M24 54 H72 M24 68 H72 M40 26 V40 M56 40 V54 M40 54 V68 M56 68 V80', '#6A2A20', 1.8) +
      part(rr(34, 46, 28, 22, 10), INK, { w: 2.6 }) + part(rr(37, 50, 22, 16, 7), C.lava, { w: 0 }) + part(rr(41, 55, 14, 9, 4), C.lavaL, { w: 0 }) +
      flame(20, 70, 0.6)
    ),

    // ===== HANDHELD HEAVY TOOLS ==================================================
    seismic_thumper: wrap(
      base(48, 78, 56) + box(30, 50, 36, 28, 6, C.steelD, { shc: C.steelDD }) +
      box(38, 14, 20, 40, 4, C.orange, { shc: C.orangeD }) + hazard(38, 40, 20, 6) +
      box(34, 10, 28, 8, 3, C.steelL, { sh: false, hl: false }) + rivet(36, 56) + rivet(60, 56) +
      L('M12 70 q-4 -8 0 -16 M84 70 q4 -8 0 -16 M6 74 q-6 -12 0 -24 M90 74 q6 -12 0 -24', C.hatY, 2.4)
    ),
    core_drill: wrap(
      part('M58 30 L92 48 L58 66Z', C.steelL, { sh: 'M58 49 L92 48 L58 66Z', shc: C.steel }) +
      L('M64 33 l4 23 M72 37 l3 16 M80 41 l2 9', INK, 1.8) +
      box(8, 38, 12, 20, 4, C.inkSoft, { hl: false }) +
      box(16, 32, 44, 32, 10, C.orange, { shc: C.orangeD }) + glass(24, 38, 22, 10, C.screen) +
      rivet(52, 38) + rivet(52, 58) + tape(22, 54, 14, 5, -4)
    ),
    jackhammer: wrap(
      box(18, 18, 60, 10, 5, C.inkSoft, { sh: false }) +
      box(36, 22, 24, 40, 6, C.hatY, { shc: C.hatYD }) + box(40, 34, 16, 6, 2, C.inkSoft, { sh: false, hl: false, w: 2 }) +
      box(40, 60, 16, 10, 3, C.steelD, { hl: false }) +
      part('M44 70 L52 70 L50 90 L46 90Z', C.steelL, { w: 2.4, sh: 'M48 70 L52 70 L50 90 L48 90Z', shc: C.steel }) +
      L('M24 86 l6 -4 M72 86 l-6 -4 M20 78 l6 0 M76 78 l-6 0', C.steelD, 2.4) + scratch('M52 48 l4 3')
    ),
    shock_anvil: wrap(
      limb('M30 8 V22', C.steelL, 2.2) + limb('M66 8 V22', C.steelL, 2.2) + spark(30, 6, 3.4) + spark(66, 6, 3.4) +
      part('M14 30 L82 30 Q82 40 70 42 L70 54 L78 54 L78 66 L18 66 L18 54 L26 54 L26 42 Q14 40 14 30Z', C.steelD, {
        sh: 'M60 30 L82 30 Q82 40 70 42 L70 54 L78 54 L78 66 L60 66Z', shc: C.steelDD
      }) + shine(20, 33.4, 50, 33.4, 2.2) +
      box(18, 66, 60, 12, 3, C.inkSoft, { hl: false }) + L('M8 84 l6 -4 M88 84 l-6 -4 M48 88 v-6', C.hatY, 2.6)
    ),
    grapple_claw: wrap(
      limb('M8 70 Q30 76 44 54', C.steelL, 2.6) +
      part('M56 38 Q74 22 88 30 Q76 32 66 44Z', C.steelD, { sh: 'M66 44 Q76 32 88 30 L86 33 Q76 36 68 46Z', shc: C.steelDD }) +
      part('M56 56 Q74 72 88 64 Q76 62 66 50Z', C.steelD, { sh: 'M56 56 Q74 72 88 64 L84 62 Q72 66 60 54Z', shc: C.steelDD }) +
      box(36, 36, 22, 22, 6, C.orange, { shc: C.orangeD }) + disc(47, 47, 5, C.steelL)
    ),
    plasma_rang: wrap(
      L('M14 22 q10 -8 20 -4 M62 80 q10 4 20 -4', C.lavaL, 3) +
      G('rotate(-30 48 48)',
        box(20, 42, 56, 12, 6, C.steelL, { shc: C.steel }) +
        part('M8 48 a12 12 0 1 1 18 10 l-6 -6 l4 -4 l-6 -6 l-4 4Z', C.orange, { sh: 'M20 37 a12 12 0 0 1 6 21 l-6 -6 l4 -4Z', shc: C.orangeD }) +
        part('M88 48 a12 12 0 1 0 -18 10 l6 -6 l-4 -4 l6 -6 l4 4Z', C.orange, { sh: 'M88 48 a12 12 0 0 1 -18 10 l6 -6 l12 -4Z', shc: C.orangeD }) +
        rivet(36, 48) + rivet(60, 48))
    ),
    magnet_hammer: wrap(
      box(44, 40, 9, 50, 4, C.brown, { shc: C.brownD }) + L('M44 74 h9 M44 80 h9', INK, 1.4) +
      box(14, 14, 68, 30, 8, C.steelD, { shc: C.steelDD }) +
      box(8, 18, 10, 22, 3, C.red, { hl: false }) + box(78, 18, 10, 22, 3, C.blue, { hl: false }) +
      bolt(48, 29, 1.2, C.screen) + scratch('M26 34 l5 3 M64 20 l4 3')
    ),
    buzzsaw_launcher: wrap(
      saw(64, 40, 24) + grip(18, 62) + trigger(30, 62) +
      box(10, 46, 44, 18, 6, C.orange, { shc: C.orangeD }) + box(14, 40, 24, 8, 3, C.inkSoft, { sh: false, hl: false, w: 2.2 }) + rivet(46, 55)
    ),
    pulse_cap: wrap(
      L('M86 36 q6 17 0 34 M92 30 q8 23 0 46', C.screen, 2.6) +
      part('M50 44 L82 30 L82 76 L50 62Z', C.steelL, { sh: 'M66 37 L82 30 L82 76 L66 69Z', shc: C.steel }) +
      tank(14, 36, 36, 34, C.blue, C.blueD) + box(20, 30, 24, 8, 3, C.steelD, { sh: false, hl: false, w: 2.4 }) + bolt(32, 53, 1.1)
    ),
    acid_sprayer: wrap(
      box(48, 54, 26, 9, 4, C.steelDD, { w: 2.4, hl: false }) + box(70, 50, 10, 17, 3, C.steel, { w: 2.4, hl: false }) +
      disc(86, 58, 4, C.greenL) + disc(91, 48, 2.6, C.greenL, { w: 1.6 }) +
      tank(16, 22, 34, 56, C.green, C.greenD) + box(14, 18, 38, 8, 3, C.steelD, { sh: false, hl: false, w: 2.4 }) +
      box(26, 38, 14, 16, 3, C.greenL, { w: 2, sh: false, hl: false }) +
      part('M30 45 l4 -4 l4 4 q0 6 -4 6 q-4 0 -4 -6Z', C.green, { w: 1.4 })
    ),
    tar_sprayer: wrap(
      box(52, 50, 26, 9, 4, C.steelDD, { w: 2.4, hl: false }) + part(oval(84, 58, 7, 9), INK, { w: 2 }) + flame(84, 42, 0.6) +
      box(14, 26, 40, 52, 8, C.inkSoft, { shc: '#16181D' }) +
      box(12, 36, 44, 5, 2, C.steelD, { w: 2, sh: false, hl: false }) + box(12, 62, 44, 5, 2, C.steelD, { w: 2, sh: false, hl: false }) +
      part('M18 27 q2 8 6 4 q2 9 6 0 q4 7 6 0 q4 5 6 -1Z', '#16181D', { w: 2 })
    ),
    ion_beacon: wrap(
      base(48, 78, 40) + box(44, 52, 8, 28, 2, C.steelD, { hl: false }) +
      part('M20 34 Q48 70 76 34Z', C.steelL, { sh: 'M50 52 Q64 46 76 34 L54 34 Q56 44 50 52Z', shc: C.steel, hl: 'M26 37 Q34 48 42 51 Q32 45 29 37Z', hlo: 0.7 }) +
      L('M48 46 V22', INK, 3) + disc(48, 20, 5.4, C.screen) + L('M48 12 V3 M40 14 l-5 -6 M56 14 l5 -6', C.screen, 2.6)
    ),
    meteor_mortar: wrap(
      base(48, 78, 48) + box(30, 50, 36, 28, 6, C.steelD, { shc: C.steelDD }) +
      part('M42 27 L48 4 L54 27Z', C.red, { sh: 'M48 4 L54 27 L49 27Z', shc: C.redD }) +
      box(36, 26, 24, 30, 5, C.steelL, { shc: C.steel }) + hazard(36, 36, 24, 6) + disc(48, 64, 5.4, C.red) + rivet(36, 72) + rivet(60, 72)
    ),
    meteor_beacon: wrap(
      base(48, 78, 40) + part('M42 78 L46 40 L50 40 L54 78Z', C.steelD, { sh: 'M48 40 L50 40 L54 78 L49 78Z', shc: C.steelDD }) +
      L('M28 22 q20 -18 40 0 M20 14 q28 -24 56 0', C.redL, 2.8) +
      disc(48, 34, 12, C.red, { shc: C.redD }) + disc(48, 34, 6, C.redL, { sh: false }) +
      flame(84, 56, 0.6) + G('rotate(30 78 76)', part('M70 70 q8 -18 16 0 q0 12 -8 12 q-8 0 -8 -12Z', C.rock, { w: 2.4, sh: 'M78 60 q8 4 8 10 q0 12 -8 12 q6 -10 0 -22Z', shc: C.rockD }))
    ),

    // ===== ORBITALS ===============================================================
    orbital_sat: wrap(
      box(4, 36, 28, 24, 3, C.blue, { shc: C.blueD, hl: false }) + box(64, 36, 28, 24, 3, C.blue, { shc: C.blueD, hl: false }) +
      L('M18 37 V59 M78 37 V59 M5 48 H31 M65 48 H91', C.blueD, 1.8) + L('M32 48 H34 M62 48 H64', INK, 3) +
      L('M40 22 Q48 12 56 22', INK, 6) + L('M40 22 Q48 12 56 22', C.hatY, 3) + L('M48 22 V28', INK, 3) +
      box(34, 28, 28, 40, 9, C.steelL, { shc: C.steel }) +
      disc(48, 48, 8.4, C.inkSoft, { sh: false, hl: false }) + `<circle cx="48" cy="48" r="4" fill="${C.hatY}"/><circle cx="46.6" cy="46.6" r="1.2" fill="#FFF"/>`
    ),
    gyro_saw: wrap(saw(48, 48, 40, C.steelL, 14) + L('M30 30 a26 26 0 0 1 14 -8', '#FFF8E6', 2.2)),
    solar_mirror: wrap(
      L('M48 3 V10 M48 86 V93 M3 48 H10 M86 48 H93 M16 16 l5 5 M80 16 l-5 5 M16 80 l5 -5 M80 80 l-5 -5', C.hatY, 3) +
      disc(48, 48, 36, C.hatY, { shc: C.hatYD }) +
      part(circ(48, 48, 28), '#FFF1B8', { w: 2.4, sh: 'M48 20 A28 28 0 0 1 76 48 L48 48Z', shc: C.hatYL }) +
      disc(48, 48, 7.4, C.orange) + L('M28 36 q6 -9 15 -12', '#FFFFFF', 3)
    ),
    chain_anchor: wrap(
      limb('M6 10 L26 30', C.screen, 2.6) +
      [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (Math.PI / 4) * i;
        const p = (ang, r) => `${(54 + Math.cos(ang) * r).toFixed(1)} ${(56 + Math.sin(ang) * r).toFixed(1)}`;
        return part(`M${p(a - 0.22, 26)} L${p(a, 38)} L${p(a + 0.22, 26)}Z`, C.steelL, { w: 2.2, sh: `M${p(a, 26)} L${p(a, 38)} L${p(a + 0.22, 26)}Z`, shc: C.steel });
      }).join('') +
      disc(54, 56, 28, C.steelD, { shc: C.steelDD }) + scratch('M60 70 l6 -2 M40 64 l4 4') + disc(30, 32, 5.4, C.steelL, { sh: false })
    ),
    frost_orbital: wrap(
      `<g transform="translate(1.3 1.1)"><path d="M48 14 a34 34 0 1 1 0 68 a34 34 0 1 1 0 -68Z M48 26 a22 22 0 1 0 0 44 a22 22 0 1 0 0 -44Z" fill="${C.ice}" fill-rule="evenodd"/>` +
      `<path class="sh" d="M48 14 a34 34 0 0 1 0 68 v-12 a22 22 0 0 0 0 -44Z" fill="${C.iceD}"/></g>` +
      `<path d="M48 14 a34 34 0 1 1 0 68 a34 34 0 1 1 0 -68Z M48 26 a22 22 0 1 0 0 44 a22 22 0 1 0 0 -44Z" fill="none" stroke="${INK}" stroke-width="3"/>` +
      [0, 1, 2, 3].map((i) => disc(48 + Math.cos(i * 1.571) * 28, 48 + Math.sin(i * 1.571) * 28, 5.4, C.blue)).join('') +
      flake(48, 48, 10, C.blueL) + L('M24 30 q6 -9 15 -12', '#FFFFFF', 2.6)
    ),

    // ===== DRONES =================================================================
    assembler_drone: wrap(
      limb('M26 28 L36 40', C.steelD, 2.2) + limb('M70 28 L60 40', C.steelD, 2.2) + prop(22, 24) + prop(74, 24) +
      limb('M40 64 L34 76', C.steelD, 2.4) + limb('M56 64 L62 76', C.steelD, 2.4) +
      part('M30 76 l4 6 l4 -6Z M58 76 l4 6 l4 -6Z', C.steelL, { w: 2 }) +
      box(28, 36, 40, 28, 12, C.hatY, { shc: C.hatYD }) + part(rr(36, 42, 24, 12, 5), DEEP, { w: 2.2 }) +
      `<circle cx="42" cy="48" r="3" fill="${C.screen}"/><circle cx="54" cy="48" r="3" fill="${C.screen}"/>` + rivet(32, 58) + rivet(64, 58)
    ),
    saw_drone: wrap(
      saw(48, 64, 22, C.steelL, 10) + limb('M48 42 V50', C.steelD, 2.4) + prop(48, 14, 44) + limb('M48 18 V26', C.steelD, 2.4) +
      box(28, 24, 40, 22, 9, C.red, { shc: C.redD }) + glass(36, 29, 16, 9, C.screen) + rivet(60, 34)
    ),
    drill_drone: wrap(
      part(oval(48, 82, 32, 7), C.brownD, { w: 2.4 }) + L('M24 82 l-4 3 M70 82 l5 2', INK, 1.4) +
      part('M40 30 L48 8 L56 30Z', C.steelL, { sh: 'M48 8 L56 30 L49 30Z', shc: C.steel }) + L('M44 22 l8 -2 M42 27 l12 -2', INK, 1.8) +
      part('M20 72 C20 42 32 30 48 30 C64 30 76 42 76 72Z', '#9C7A9A', { sh: 'M50 30 C64 30 76 42 76 72 L60 72 C60 50 56 36 50 30Z', shc: '#7A5A78', hl: 'M25 62 Q26 46 36 37 Q30 48 30 62Z' }) +
      part(rr(32, 44, 32, 12, 6), DEEP, { w: 2.4 }) + `<circle cx="40" cy="50" r="3.4" fill="${C.screen}"/><circle cx="56" cy="50" r="3.4" fill="${C.screen}"/>` +
      part(oval(48, 62, 5, 3.4), C.pink, { w: 2 }) + part('M22 72 l-6 8 h10Z M74 72 l6 8 h-10Z', C.pink, { w: 2 })
    ),
    nano_hive: wrap(
      part('M48 10 L80 28 L80 64 L48 82 L16 64 L16 28Z', C.hatY, { sh: 'M48 10 L80 28 L80 64 L48 82 L52 46Z', shc: C.hatYD, hl: 'M20 31 L44 17 L44 20 L23 33Z', hlo: 0.7 }) +
      L('M16 46 L30 46 M66 46 L80 46 M48 82 V70', INK, 1.4) +
      part('M48 30 L60 37 L60 51 L48 58 L36 51 L36 37Z', C.inkSoft, { w: 2.4 }) + disc(48, 44, 5, C.screen, { sh: false, w: 0 }) +
      [[22, 18], [80, 13], [86, 72], [11, 77]].map(([x, y]) => disc(x, y, 4.6, C.steelL, { sh: false }) + `<circle cx="${x}" cy="${y}" r="1.7" fill="${C.blue}"/>`).join('') + bolt(70, 46, 0.7)
    ),
    shield_drone: wrap(
      prop(48, 12, 40) + limb('M48 16 V24', C.steelD, 2.4) +
      part('M48 24 L74 32 L74 52 Q74 72 48 82 Q22 72 22 52 L22 32Z', C.blue, { sh: 'M48 24 L74 32 L74 52 Q74 72 48 82 Q62 60 48 24Z', shc: C.blueD }) +
      part('M48 34 L64 39 L64 52 Q64 64 48 70 Q32 64 32 52 L32 39Z', C.blueL, { w: 2.4 }) + disc(48, 50, 5.4, CREAM) +
      L('M27 36 L27 50', '#FFF8E6', 2) + scratch('M62 62 l-4 4')
    ),

    // ===== GUNS (muzzle right) ===================================================
    rivet_smg: wrap(
      grip(22, 52, C.orange) + box(44, 52, 10, 22, 3, C.inkSoft, { hl: false }) + trigger(36, 52) +
      barrel(66, 38, 18, 10, C.steel) + box(82, 40, 8, 6, 2, C.inkSoft, { w: 2, sh: false, hl: false }) +
      box(14, 34, 54, 20, 6, C.steelD, { shc: C.steelDD }) + box(22, 26, 30, 9, 4, C.orange, { w: 2.6, sh: false }) +
      rivet(56, 43) + rivet(62, 43) + scratch('M24 46 l6 2')
    ),
    slag_shotgun: wrap(
      grip(30, 56, C.brown, 18) + trigger(42, 56) +
      box(46, 34, 40, 10, 4, C.inkSoft, { sh: false }) + box(46, 46, 40, 10, 4, C.inkSoft, { sh: false }) +
      disc(86, 39, 3, C.lava, { w: 1.6 }) + disc(86, 51, 3, C.lava, { w: 1.6 }) + muzzleFlash(89, 45, 0.6) +
      box(6, 40, 26, 16, 6, C.brown, { shc: C.brownD }) + box(28, 36, 22, 22, 5, C.steelD, { shc: C.steelDD }) + tape(8, 44, 12, 5, 0)
    ),
    rail_sniper: wrap(
      grip(30, 56, C.inkSoft, 16) + trigger(42, 56) +
      barrel(48, 42, 44, 10, C.steelL) + [56, 66, 76].map((x) => box(x, 38, 5, 18, 2, C.blue, { w: 2, sh: false, hl: false })).join('') +
      L('M88 47 H95', C.screen, 3) +
      box(4, 42, 22, 14, 5, C.inkSoft, { hl: false }) + box(22, 38, 30, 20, 5, C.steelD, { shc: C.steelDD }) +
      box(28, 26, 26, 9, 4, C.inkSoft, { w: 2.4, sh: false }) + disc(54, 30, 4.2, C.red, { w: 1.8 })
    ),
    plasma_pistol: wrap(
      grip(28, 52, C.inkSoft, 24) + trigger(40, 52) +
      box(62, 38, 18, 12, 5, C.steelL, { hl: false }) + disc(80, 44, 7.4, C.screen) + `<circle cx="80" cy="44" r="3" fill="#FFF"/>` +
      box(18, 34, 50, 20, 9, C.purple, { shc: C.purpleD }) + disc(34, 44, 5.2, C.screen, { w: 2 })
    ),
    rotary_minigun: wrap(
      box(16, 62, 12, 18, 3, C.hatY, { hl: false }) +
      barrel(44, 32, 44, 9, C.steelL) + barrel(44, 42, 44, 9, C.steel) + barrel(44, 52, 44, 9, C.steelD) +
      box(54, 28, 8, 37, 2, C.inkSoft, { w: 2.2, sh: false, hl: false }) + box(78, 28, 8, 37, 2, C.inkSoft, { w: 2.2, sh: false, hl: false }) +
      box(8, 30, 38, 34, 9, C.orange, { shc: C.orangeD }) + box(14, 22, 26, 9, 4, C.inkSoft, { w: 2.4, sh: false }) + rivet(38, 56) + tape(12, 50, 14, 5, -10)
    ),
    cryo_blaster: wrap(
      grip(22, 56, C.blue) + trigger(34, 56) +
      box(60, 40, 26, 12, 5, C.blueL, { shc: C.blue }) + part('M86 38 L94 34 L94 58 L86 54Z', C.blue, { w: 2.2 }) +
      tank(24, 18, 30, 16, C.ice, C.iceD) +
      box(14, 36, 50, 22, 9, CREAM, { shc: '#C9DCE8' }) + flake(38, 26, 4, CREAM) +
      `<path d="M18 58 l2 6 l2 -6 M64 58 l2 5 l2 -5" fill="${C.ice}" stroke="${INK}" stroke-width="1.2"/>`
    ),
    grenade_launcher: wrap(
      box(4, 42, 20, 14, 5, C.inkSoft, { hl: false }) +
      part(oval(88, 45, 4, 11), INK, { w: 2.2 }) +
      box(48, 34, 40, 22, 8, '#6E7B3E', { shc: '#525C2C' }) + box(20, 36, 30, 24, 6, '#6E7B3E', { shc: '#525C2C' }) +
      disc(38, 62, 14, C.steelD, { shc: C.steelDD }) + disc(38, 62, 6, C.steelL, { sh: false }) +
      [0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${(38 + Math.cos(i * 1.047) * 10).toFixed(1)}" cy="${(62 + Math.sin(i * 1.047) * 10).toFixed(1)}" r="1.6" fill="${INK}"/>`).join('') +
      disc(56, 30, 4.2, C.red, { w: 2 }) + scratch('M64 40 l6 2')
    ),
    tesla_carbine: wrap(
      grip(32, 56, C.inkSoft, 20) + trigger(44, 56) +
      box(64, 40, 18, 12, 3, C.steelL, { hl: false }) + [68, 74].map((x) => box(x, 36, 4, 20, 2, C.hatY, { w: 2, sh: false, hl: false })).join('') +
      disc(86, 46, 6.4, C.purpleL) + bolt(90, 30, 0.9) +
      box(6, 40, 22, 14, 5, C.inkSoft, { hl: false }) + box(24, 34, 44, 24, 7, '#3F5B8E', { shc: '#2C4268' }) + disc(40, 46, 4.4, C.screen, { w: 1.8 })
    ),
    acid_needle: wrap(
      grip(24, 54, C.green) + trigger(36, 54) + box(48, 56, 12, 16, 3, C.inkSoft, { hl: false }) +
      barrel(64, 42, 24, 8, C.steelL) + part('M88 42 L96 46 L88 50Z', C.greenL, { w: 1.8 }) +
      box(18, 36, 50, 20, 6, C.steelD, { shc: C.steelDD }) +
      tank(26, 16, 28, 22, C.green, C.greenD) + `<circle cx="40" cy="27" r="4" fill="${C.greenL}"/>` +
      part('M19 80 q1 -4 2 -6 q1 2 2 6 q0 3 -2 3 q-2 0 -2 -3Z', C.green, { w: 1.4 })
    ),
    nova_cannon: wrap(
      grip(20, 62, C.inkSoft, 16) +
      L('M90 32 q6 16 0 32', C.purpleL, 3) +
      box(46, 36, 30, 24, 6, C.steelD, { shc: C.steelDD }) +
      part(oval(80, 48, 8, 20), C.purple, { w: 2.6, sh: 'M80 28 A8 20 0 0 1 80 68 A4 20 0 0 0 80 28Z', shc: C.purpleD }) + part(oval(80, 48, 4, 12), C.screen, { w: 2 }) +
      box(6, 32, 44, 32, 10, C.purpleD, { shc: '#4A2D80' }) + glass(14, 38, 20, 10, C.screen)
    ),
    plasma_flamethrower: wrap(
      L('M18 30 Q22 20 34 38', INK, 5.4) + L('M18 30 Q22 20 34 38', C.steelD, 2.4) +
      grip(34, 56, C.inkSoft, 18) + trigger(46, 56) + flame(92, 48, 0.85) +
      part('M78 40 L86 36 L86 60 L78 56Z', C.inkSoft, { w: 2.2 }) + barrel(62, 42, 18, 12, C.steelL) +
      box(24, 38, 40, 20, 6, C.steelD, { shc: C.steelDD }) + tank(8, 30, 20, 40, C.red, C.redD) + bolt(18, 50, 0.7)
    ),
    void_boomerang_gun: wrap(
      grip(18, 58, C.purple) +
      box(8, 42, 46, 18, 6, C.inkSoft, { shc: '#16181D' }) +
      disc(68, 46, 22, C.purple, { shc: C.purpleD }) + part(circ(68, 46, 14), C.purpleL, { w: 2.4 }) + part(circ(68, 46, 5), INK, { w: 0 }) +
      L('M74 24 l6 -2 M88 40 l4 -4', C.screen, 2.4)
    ),
    black_hole_cannon: wrap(
      grip(16, 62, C.inkSoft, 16) +
      box(64, 24, 14, 50, 5, C.steel, { shc: C.steelD }) + box(42, 30, 26, 38, 6, C.steelD, { shc: C.steelDD }) +
      box(6, 34, 40, 30, 8, C.steelDD, { shc: '#33352F' }) + box(12, 40, 22, 9, 3, C.purple, { w: 2, sh: false }) +
      L('M86 35 a14 14 0 0 1 10 24', C.purpleL, 2.4) + part(circ(86, 49, 10), INK, { w: 2.4 }) + `<circle cx="86" cy="49" r="4" fill="${C.purpleD}"/>`
    ),
    prism_splitter: wrap(
      grip(18, 56, C.teal) + trigger(30, 56) +
      L('M88 40 l7 -6 M90 48 h6 M88 56 l7 6', C.screen, 2.4) + crystal(80, 48, 1, C.screen, C.tealL) +
      box(56, 42, 14, 12, 3, C.steelD, { hl: false }) +
      box(8, 38, 52, 20, 7, CREAM, { shc: '#C9DCE8' }) + box(16, 30, 26, 9, 4, C.teal, { w: 2.4, sh: false })
    ),
    magma_lance: wrap(
      grip(14, 56, C.inkSoft, 20) +
      part('M56 40 L94 49 L56 58Z', C.lava, { sh: 'M56 49 L94 49 L56 58Z', shc: '#D64A12' }) + L('M62 49 H84', C.lavaL, 3) +
      box(4, 40, 40, 18, 6, C.inkSoft, { hl: false }) + box(40, 36, 18, 26, 5, C.steelD, { shc: C.steelDD }) +
      box(10, 34, 22, 8, 3, C.orange, { w: 2.2, sh: false }) + rivet(49, 44) + rivet(49, 54)
    ),
    cryo_mortar: wrap(
      base(42, 76, 52) +
      G('rotate(-30 46 56)', box(28, 42, 56, 26, 9, C.blue, { shc: C.blueD }) + part(oval(84, 55, 5, 13), C.ice, { w: 2.4 }) + L('M42 42 V68 M56 42 V68', C.blueD, 1.6)) +
      box(26, 56, 24, 20, 4, C.steelD, { shc: C.steelDD }) + flake(70, 24, 6, CREAM)
    ),
    seismic_pilebunker: wrap(
      L('M74 30 l6 -6 M74 66 l6 6', C.hatY, 2.6) +
      part('M86 40 L96 48 L86 56Z', C.steelL, { w: 2.4 }) + barrel(70, 42, 16, 12, C.steelL) + box(54, 38, 18, 20, 4, C.steelD, { shc: C.steelDD }) +
      box(8, 32, 50, 32, 8, C.orange, { shc: C.orangeD }) + hazard(12, 56, 40, 6) + rivet(16, 40) + rivet(48, 40) + scratch('M24 44 l6 2')
    )
  };
  register('tool', T);
})();
