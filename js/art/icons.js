// ============================================================================
// MULTI-MINE — 30 Item & Module Icons (also: scrap / fruit / crate pickups)
// "Ink & Grit" style: hand-bowed shapes, off-register colour, hatched shadow
// sides and pen highlights, matching the tools and characters.
// ============================================================================
(function () {
  const { C, wrap, rivet, S, register } = window.MM.Art;
  const { L, G, bolt, flame, part, limb, circ, eye, box, disc, oval, glass, shine, scratch, spark, tape, DEEP, CREAM } = S;
  const INK = C.ink;

  const gearPath = (cx, cy, r, teeth = 8) => {
    let d = '';
    for (let i = 0; i < teeth * 4; i++) {
      const a = (Math.PI * 2 * i) / (teeth * 4) - Math.PI / (teeth * 4);
      const rr = (i % 4 === 0 || i % 4 === 1) ? r : r * 0.8;
      d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `;
    }
    return d + 'Z';
  };
  const gear = (cx, cy, r, f, fD, teeth = 8) =>
    part(gearPath(cx, cy, r, teeth), f, { sh: `M${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx} ${cy + r} L${cx} ${cy}Z`, shc: fD }) +
    disc(cx, cy, r * 0.55, fD, { w: 2.4 }) + disc(cx, cy, r * 0.25, C.inkSoft, { w: 2, sh: false });
  const HEART = 'M0 18 C-26 2 -24 -18 -10 -18 C-4 -18 0 -12 0 -10 C0 -12 4 -18 10 -18 C24 -18 26 2 0 18Z';
  const heart = (cx, cy, s, f, fD) =>
    G(`translate(${cx} ${cy}) scale(${s})`,
      part(HEART, f, { w: 3 / s, sh: 'M0 18 C12 10 22 0 20 -10 C18 0 8 10 0 14Z', shc: fD, hl: 'M-16 -6 Q-16 -14 -9 -15 Q-13 -11 -13 -5Z', hlo: 0.7 }));

  const I = {
    chip: wrap(
      [30, 42, 54, 66].map((v) => L(`M${v} 13 V24 M${v} 72 V83 M13 ${v} H24 M72 ${v} H83`, INK, 5.4) + L(`M${v} 13 V24 M${v} 72 V83 M13 ${v} H24 M72 ${v} H83`, C.steelL, 2.6)).join('') +
      box(22, 22, 52, 52, 8, C.teal, { shc: C.tealD }) + box(34, 34, 28, 28, 4, C.inkSoft, { w: 2.4, sh: false, hl: false }) +
      bolt(48, 48, 1.3, C.screen) + `<circle cx="29" cy="67" r="2.2" fill="${INK}"/>`
    ),
    battery: wrap(
      box(38, 12, 20, 10, 3, C.steelD, { hl: false }) +
      box(26, 20, 44, 64, 10, C.inkSoft, { sh: false }) +
      part(S.rr(32, 44, 32, 34, 5), C.green, { w: 0, sh: 'M52 44 L59 44 Q64 44 64 49 L64 73 Q64 78 59 78 L52 78 Q56 61 52 44Z', shc: C.greenD }) +
      part(S.rr(32, 27, 32, 15, 5), C.greenL, { w: 0 }) + L('M32 43 H64', INK, 1.6) +
      bolt(48, 58, 1.6, C.hatYL) + tape(28, 30, 16, 5, -12)
    ),
    wrench: wrap(G('rotate(45 48 48)',
      box(42, 26, 12, 56, 6, C.steelL, { shc: C.steel }) +
      part('M32 26 a16 16 0 1 1 32 0 l-6 6 v-12 h-20 v12Z', C.steelL, { sh: 'M58 13 a16 16 0 0 1 6 13 l-6 6 v-12Z', shc: C.steel }) +
      disc(48, 76, 4, C.inkSoft, { sh: false }) + L('M46 40 h4 M46 46 h4 M46 52 h4', INK, 1.2)
    )),
    robot_arm: wrap(
      box(14, 74, 40, 12, 4, C.steelD, { hl: false }) +
      L('M34 74 L30 44 L62 26', INK, 13) + L('M34 74 L30 44 L62 26', C.orange, 8) + L('M33 66 L31 50 M36 42 L56 30', C.orangeD, 2) +
      disc(30, 44, 7.4, C.steelL) + disc(34, 72, 6.4, C.steelL) +
      part('M60 22 L80 12 L84 18 L68 26 L84 34 L80 40 L60 30Z', C.steelL, { sh: 'M68 26 L84 34 L80 40 L60 30Z', shc: C.steel }) + disc(62, 26, 5.4, C.steelD, { sh: false })
    ),
    shield: wrap(
      part('M48 10 L80 22 L80 46 Q80 74 48 88 Q16 74 16 46 L16 22Z', C.blue, { sh: 'M48 10 L80 22 L80 46 Q80 74 48 88 Q62 56 48 10Z', shc: C.blueD }) +
      part('M48 24 L66 31 L66 47 Q66 64 48 74 Q30 64 30 47 L30 31Z', C.blueL, { w: 2.4 }) +
      rivet(26, 28) + rivet(70, 28) + shine(22, 30, 22, 48, 2.2) + scratch('M56 56 l4 4 M38 40 l3 -3')
    ),
    gear: wrap(gear(48, 48, 36, C.hatY, C.hatYD, 8) + shine(26, 38, 32, 26, 2.4)),
    bulb: wrap(
      part(circ(48, 40, 26), C.hatYL, { sh: 'M54 15 A26 26 0 0 1 64 60 Q60 50 60 40 Q60 24 54 15Z', shc: C.hatY }) +
      L('M42 42 L46 50 L50 42 L54 50', C.orange, 2.6) + L('M44 52 V62 M52 52 V62', INK, 1.4) +
      box(36, 62, 24, 20, 4, C.steelL, { shc: C.steel, hl: false }) + L('M36 68 H60 M36 74 H60', INK, 2) +
      L('M31 30 Q35 22 42 19', '#FFFFFF', 2.6) + L('M16 22 l-5 -4 M80 22 l5 -4 M48 7 V2', C.hatY, 2.4)
    ),
    magnet: wrap(
      part('M18 76 L18 44 A30 30 0 0 1 78 44 L78 76 L58 76 L58 44 A10 10 0 0 0 38 44 L38 76Z', C.red, {
        sh: 'M64 18 A30 30 0 0 1 78 44 L78 76 L66 76 L66 44 Q66 30 58 26Z', shc: C.redD, hl: 'M22 44 A26 26 0 0 1 32 22 L34 25 A22 22 0 0 0 26 44Z', hlo: 0.6
      }) +
      box(16, 66, 24, 16, 3, C.steelL, { hl: false }) + box(56, 66, 24, 16, 3, C.steelL, { hl: false }) +
      L('M10 20 l6 6 M86 20 l-6 6 M6 34 l7 2 M90 34 l-7 2', C.blue, 2.8)
    ),
    boots: wrap(
      flame(11, 62, 0.85) +
      part('M24 14 L50 14 L50 54 L80 60 Q88 62 88 72 L88 80 L20 80Z', C.brown, { sh: 'M50 54 L80 60 Q88 62 88 72 L88 80 L52 80Q58 66 50 54Z', shc: C.brownD }) +
      box(18, 76, 72, 10, 4, C.inkSoft, { hl: false }) + L('M24 30 H50 M24 42 H50', C.brownL, 2.6) +
      `<path d="M30 24 l4 4 l4 -4 l4 4 M30 36 l4 4 l4 -4 l4 4" fill="none" stroke="${INK}" stroke-width="1.4"/>` + shine(28, 50, 28, 66, 2)
    ),
    reactor: wrap(
      disc(48, 48, 36, C.steelD, { shc: C.steelDD }) + part(circ(48, 48, 26), C.inkSoft, { w: 2.4 }) +
      [0, 1, 2].map((i) => G(`rotate(${i * 120} 48 48)`, part('M48 48 L36 28 A24 24 0 0 1 60 28Z', C.hatY, { w: 2, sh: 'M48 48 L54 26 A24 24 0 0 1 60 28Z', shc: C.hatYD }))).join('') +
      disc(48, 48, 7.4, C.screen, { sh: false }) + rivet(48, 16) + rivet(80, 48) + rivet(48, 80) + rivet(16, 48)
    ),
    cube: wrap(
      part('M48 12 L80 30 L48 48 L16 30Z', C.purpleL, { w: 0 }) + part('M16 30 L48 48 L48 86 L16 68Z', C.purple, { w: 0 }) +
      part('M80 30 L48 48 L48 86 L80 68Z', C.purpleD, { w: 0, sh: 'M80 30 L48 48 L48 86 L80 68Z' }) +
      L('M48 12 L80 30 L80 68 L48 86 L16 68 L16 30Z M16 30 L48 48 L80 30 M48 48 V86', INK, 2.8) +
      L('M24 40 V60 M32 44 V66', '#FFF8E6', 1.6) + spark(48, 30, 4.4, C.screen)
    ),
    heart: wrap(heart(48, 50, 1.6, C.red, C.redD) + L('M40 58 l4 -4 l3 6 l4 -10 l3 8 l4 0', '#FFF8E6', 1.8)),
    crate: null,
    scrap: null,
    clover: wrap(
      limb('M50 50 Q60 74 54 88', C.greenD, 3.6) +
      [0, 90, 180, 270].map((r) => G(`rotate(${r} 48 46)`, part('M48 46 C34 40 30 20 42 16 C48 14 50 22 48 28 C46 22 48 14 54 16 C66 20 62 40 48 46Z', C.green, {
        sh: 'M48 46 C62 40 66 20 54 16 C58 22 56 36 48 46Z', shc: C.greenD
      }))).join('') +
      disc(48, 46, 5.4, C.greenL, { sh: false }) + L('M40 22 Q42 18 46 18', '#FFF8E6', 1.8)
    ),
    radar: wrap(
      disc(48, 48, 36, C.tealD, { shc: '#1F4A45', hl: false }) +
      `<circle cx="48" cy="48" r="24" fill="none" stroke="${INK}" stroke-width="2"/><circle cx="48" cy="48" r="12" fill="none" stroke="${INK}" stroke-width="2"/>` +
      L('M13 48 H83 M48 13 V83', C.tealL, 1.6) +
      `<path d="M48 48 L48 12 A36 36 0 0 1 78 30Z" fill="${C.screen}" opacity="0.5"/>` +
      L('M48 48 L78 30', C.screen, 3) + disc(64, 60, 3.6, C.red, { w: 1.6 }) + disc(34, 30, 3.2, C.hatY, { w: 1.6 })
    ),
    piggy: wrap(
      part('M26 34 L30 19 L41 30Z', C.pink, { w: 2.6 }) + part('M62 30 L70 19 L72 34Z', C.pink, { w: 2.6 }) +
      box(28, 76, 10, 10, 3, C.pinkD, { hl: false }) + box(56, 76, 10, 10, 3, C.pinkD, { hl: false }) +
      part(oval(48, 54, 32, 26), C.pink, { sh: 'M58 29 Q80 36 80 54 Q80 78 52 80 Q76 62 58 29Z', shc: C.pinkD, hl: 'M22 50 Q24 36 36 31 Q28 40 28 52Z' }) +
      box(40, 27, 16, 5, 2, INK, { w: 0, sh: false, hl: false }) +
      part(oval(76, 56, 8, 10), C.pinkD, { w: 2.6 }) + `<circle cx="74" cy="53" r="1.6" fill="${INK}"/><circle cx="74" cy="59" r="1.6" fill="${INK}"/>` +
      eye(62, 46, 3.6, 3.2, { r: 2.4, dx: 0.4 }) + disc(19, 18, 6.4, C.gold, { w: 2 }) + L('M17 15 v6', C.goldD, 1.6)
    ),
    fruit: null,
    skull_curse: wrap(
      part('M20 46 C20 22 32 12 48 12 C64 12 76 22 76 46 C76 56 70 62 66 64 L66 76 L30 76 L30 64 C26 62 20 56 20 46Z', '#EAE3F2', {
        sh: 'M48 12 C64 12 76 22 76 46 C76 56 70 62 66 64 L66 76 L54 76 C64 60 66 32 48 12Z', shc: '#C9BEDB', hl: 'M25 40 Q26 26 36 19 Q30 30 30 42Z'
      }) +
      disc(36, 44, 8.4, C.purple, { sh: false }) + disc(60, 44, 8.4, C.purple, { sh: false }) +
      `<circle cx="36" cy="44" r="3" fill="${C.screen}"/><circle cx="60" cy="44" r="3" fill="${C.screen}"/>` +
      part('M48 52 L44 60 L52 60Z', INK, { w: 0 }) + L('M38 68 V76 M48 68 V76 M58 68 V76', INK, 2.4) + scratch('M62 24 l4 5 l-2 4')
    ),
    tardigrade: wrap(
      [26, 40, 56, 70].map((x) => box(x - 4, 66, 9, 14, 4, '#B9A27E', { w: 2.4, sh: false, hl: false })).join('') +
      part('M12 52 C12 30 30 24 48 24 C66 24 84 30 84 52 C84 66 70 72 48 72 C26 72 12 66 12 52Z', '#D9C29C', {
        sh: 'M62 25 C76 28 84 36 84 52 C84 66 70 72 50 72 C70 62 70 38 62 25Z', shc: '#B9A27E', hl: 'M20 46 Q22 34 32 29 Q26 37 26 48Z'
      }) +
      L('M30 26 Q34 48 30 70 M48 24 Q52 48 48 72 M66 26 Q70 48 66 70', '#A08A66', 2) +
      eye(19, 45, 3.2, 3, { r: 2.2, dx: -0.3 }) + part(oval(10, 54, 4, 3), '#B9A27E', { w: 2 })
    ),
    vampire: wrap(
      part('M48 46 C36 30 20 30 8 40 C16 42 18 48 16 54 C24 50 30 52 34 58 C38 52 44 50 48 52Z', C.purpleD, { hl: 'M14 40 Q24 34 34 38 Q24 37 16 42Z', hlo: 0.3 }) +
      part('M48 46 C60 30 76 30 88 40 C80 42 78 48 80 54 C72 50 66 52 62 58 C58 52 52 50 48 52Z', C.purpleD) +
      part(oval(48, 50, 12, 14), C.purple, { sh: crescentPath(48, 50, 12, 14), shc: C.purpleD }) +
      `<circle cx="44" cy="46" r="2.4" fill="${C.red}"/><circle cx="52" cy="46" r="2.4" fill="${C.red}"/>` +
      `<path d="M44 56 L46 62 L48 56 M48 56 L50 62 L52 56" fill="${CREAM}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>` +
      part('M70 70 q6 10 0 14 q-6 -4 0 -14Z', C.red, { w: 2 })
    ),
    voucher: wrap(G('rotate(-10 48 48)',
      part('M12 30 L84 30 L84 42 A6 6 0 0 0 84 54 L84 66 L12 66 L12 54 A6 6 0 0 0 12 42Z', C.hatY, { sh: 'M60 30 L84 30 L84 42 A6 6 0 0 0 84 54 L84 66 L60 66Z', shc: C.hatYD }) +
      `<path d="M60 33 V63" stroke="${INK}" stroke-width="2" stroke-dasharray="3 3"/>` +
      `<circle cx="28" cy="42" r="3.6" fill="none" stroke="${INK}" stroke-width="2.4"/><circle cx="44" cy="54" r="3.6" fill="none" stroke="${INK}" stroke-width="2.4"/>` +
      L('M45 40 L27 56', INK, 2.6) + shine(18, 35, 40, 35, 2)
    )),
    factory: wrap(
      box(62, 14, 12, 34, 2, C.steelD, { hl: false }) +
      part('M68 12 Q60 12 61 7 Q62 2 69 3 Q74 -1 79 3 Q86 4 84 9 Q82 13 74 12Z', CREAM, { w: 2, sh: 'M80 4 Q86 4 84 9 Q82 13 74 12 Q82 9 80 4Z', shc: '#C9C2B6' }) +
      part('M10 84 L10 46 L30 34 L30 46 L50 34 L50 46 L70 34 L70 46 L86 46 L86 84Z', C.orange, { sh: 'M70 46 L86 46 L86 84 L70 84Z', shc: C.orangeD }) +
      [18, 38, 58].map((x) => glass(x, 56, 12, 12, C.screen)).join('') + box(70, 64, 12, 20, 2, C.inkSoft, { w: 2, sh: false, hl: false }) +
      L('M14 50 l10 -6 M34 50 l10 -6', '#FFF8E6', 1.6)
    ),
    beacon: wrap(
      L('M24 22 q-8 10 0 20 M72 22 q8 10 0 20 M14 16 q-12 16 0 32 M82 16 q12 16 0 32', C.red, 2.6) +
      part('M30 84 L38 40 L58 40 L66 84Z', C.steelD, { sh: 'M50 40 L58 40 L66 84 L54 84Z', shc: C.steelDD }) +
      L('M34 62 H62 M32 74 H64', INK, 1.4) +
      box(36, 22, 24, 20, 6, C.red, { shc: C.redD }) + part(S.rr(41, 27, 14, 10, 4), C.redL, { w: 0 }) +
      box(34, 18, 28, 6, 3, C.steelL, { w: 2.2, sh: false, hl: false })
    ),
    anvil: wrap(
      L('M54 24 L40 38', INK, 8) + L('M54 24 L40 38', C.brown, 4.4) +
      part('M62 8 L70 16 L58 28 L50 20Z', C.lava, { w: 2, sh: 'M66 12 L70 16 L58 28 L54 24Z', shc: C.orangeD }) + spark(76, 10, 3.4) +
      part('M12 32 L84 32 Q84 42 70 44 L70 56 L78 56 L78 70 L18 70 L18 56 L26 56 L26 44 Q12 42 12 32Z', C.steelD, {
        sh: 'M60 32 L84 32 Q84 42 70 44 L70 56 L78 56 L78 70 L60 70Z', shc: C.steelDD
      }) + shine(18, 35.4, 48, 35.4, 2.2) +
      box(16, 70, 64, 12, 3, C.inkSoft, { hl: false })
    ),
    hourglass: wrap(
      box(20, 10, 56, 10, 4, C.brown, { shc: C.brownD, hl: false }) + box(20, 76, 56, 10, 4, C.brown, { shc: C.brownD, hl: false }) +
      part('M28 20 L68 20 Q68 40 52 48 Q68 56 68 76 L28 76 Q28 56 44 48 Q28 40 28 20Z', C.blueL, { w: 0 }) +
      `<path d="M34 28 L62 28 Q58 40 48 44 Q38 40 34 28Z M32 76 Q34 62 48 58 Q62 62 64 76Z" fill="${C.hatY}"/>` + L('M48 46 V60', C.hatY, 2) +
      L('M28 20 L68 20 Q68 40 52 48 Q68 56 68 76 L28 76 Q28 56 44 48 Q28 40 28 20Z', INK, 3) +
      L('M33 24 Q34 36 41 43', '#FFFFFF', 2.2)
    ),
    prism: wrap(
      L('M4 44 L36 50', INK, 5.4) + L('M4 44 L36 50', CREAM, 2.6) +
      [[52, C.red], [56, C.hatY], [60, C.green], [64, C.blue]].map(([y, c], i) => L(`M60 ${y} L92 ${40 + i * 12}`, c, 3)).join('') +
      part('M48 10 L84 78 L12 78Z', CREAM, { sh: 'M48 10 L84 78 L52 78Q56 40 48 10Z', shc: '#C9DCE8', hl: 'M44 24 L46 22 L28 70 L24 70Z', hlo: 0.9 })
    ),
    coil: wrap(
      box(36, 76, 24, 10, 3, C.steelD, { hl: false }) + limb('M48 76 V16', C.steelL, 2.4) +
      [0, 1, 2, 3, 4].map((i) => part(oval(48, 68 - i * 11, 20, 5), C.orange, { w: 2.4, sh: `M48 ${69 - i * 11} L68 ${68 - i * 11} A20 5 0 0 1 48 ${73 - i * 11}Z`, shc: C.orangeD })).join('') +
      disc(48, 14, 7.4, C.purpleL) + bolt(70, 14, 0.9) + bolt(26, 18, 0.8)
    ),
    medkit: wrap(
      part(S.rr(36, 13, 24, 13, 4), 'none', { w: 3 }) +
      box(12, 22, 72, 60, 10, CREAM, { shc: '#D3DCE4' }) +
      part('M30 44 L40 44 L40 34 L56 34 L56 44 L66 44 L66 60 L56 60 L56 70 L40 70 L40 60 L30 60Z', C.red, { w: 2.4, sh: 'M56 34 L56 44 L66 44 L66 60 L56 60 L56 70 L50 70 L50 34Z', shc: C.redD }) +
      scratch('M20 72 l6 2 M70 28 l4 3')
    ),
    rocket: wrap(G('rotate(40 48 48)',
      flame(48, 82, 0.95) +
      part('M40 66 L28 80 L40 76Z', C.red, { w: 2.6 }) + part('M56 66 L68 80 L56 76Z', C.red, { w: 2.6 }) +
      part('M48 8 C62 20 62 48 58 72 L38 72 C34 48 34 20 48 8Z', CREAM, { sh: 'M48 8 C62 20 62 48 58 72 L50 72 C54 46 54 20 48 8Z', shc: '#D3DCE4' }) +
      disc(48, 38, 7.4, C.screen) + part('M40 18 L56 18 C54 14 51 10 48 8 C45 10 42 14 40 18Z', C.red, { w: 2 }) + rivet(48, 60)
    ))
  };

  function crescentPath(cx, cy, rx, ry) {
    return `M${cx + rx * 0.3} ${cy - ry * 0.95} A${rx} ${ry} 0 0 1 ${cx} ${cy + ry} A${rx * 0.62} ${ry} 0 0 0 ${cx + rx * 0.3} ${cy - ry * 0.95}Z`;
  }

  I.crate = wrap(
      S.part('M14 26 L80 20 L84 80 L16 84Z', C.brownL, { sh: 'M62 22 L80 20 L84 80 L66 82 Q70 50 62 22Z', shc: C.brown, hl: 'M20 32 L36 30 L22 44Z' }) +
      L('M15 44 L81 39 M16 64 L83 60', C.brownD, 3.2) + L('M18 30 L80 78 M78 26 L20 80', C.brownD, 3.2) +
      `<path d="M14 26 L80 20 L84 80 L16 84Z" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
      S.part('M40 46 L56 45 L56 58 L40 59Z', C.hatY, { w: 2.2 }) + L('M48 48 V53', INK, 2.2) + `<circle cx="48" cy="56" r="1.1" fill="${INK}"/>` +
      rivet(19, 30) + rivet(76, 25) + rivet(20, 79) + rivet(79, 76)
    );
  I.scrap = wrap(
      S.part('M14 34 L46 18 L60 30 L40 50Z', C.steelL, { sh: 'M46 18 L60 30 L40 50 L44 30Z', shc: C.steelD }) +
      L('M24 32 l4 3 M36 26 l3 4', INK, 1.6) +
      S.part('M48 24 L72 30 L82 52 L72 74 L48 80 L28 66 L26 42Z', C.gold, {
        sh: 'M72 30 L82 52 L72 74 L48 80 L52 70 L70 58Z', hl: 'M32 44 L46 30 L50 32 L36 48Z', hlo: 0.7
      }) +
      L('M48 24 L50 40 M82 52 L66 52 M48 80 L50 64 M26 42 L38 48', INK, 1.6) +
      S.part(S.circ(53, 52, 11), '#5C3A21', { w: 2.6 }) + `<path d="M46 48 A9 9 0 0 1 56 43" fill="none" stroke="${C.goldD}" stroke-width="2.2"/>` +
      `<circle cx="34" cy="38" r="2.6" fill="#FFFFFF"/>`
    );
  I.fruit = wrap(
      L('M48 26 Q49 15 58 10', INK, 6.4) + L('M48 26 Q49 15 58 10', C.brownD, 3.2) +
      S.part('M52 18 Q64 7 76 16 Q64 26 52 18Z', C.green, { sh: 'M64 20 Q70 20 76 16 Q66 24 56 20Z' }) + L('M54 18 Q64 15 72 16', INK, 1.4) +
      S.part('M48 26 Q30 22 20 36 Q12 52 20 68 Q30 86 48 84 Q66 86 76 68 Q84 52 76 36 Q66 22 48 26Z', C.mint, {
        sh: 'M62 26 Q72 30 77 40 Q84 56 76 68 Q66 85 50 84 Q74 64 62 26Z', hl: 'M26 44 Q30 32 40 28 Q32 36 31 48Z', hlo: 0.7
      }) +
      L('M48 28 Q44 54 48 82', C.mintD, 1.8) +
      `<circle cx="34" cy="58" r="2.2" fill="#FFF" opacity="0.8"/><circle cx="58" cy="44" r="1.8" fill="#FFF" opacity="0.8"/><circle cx="52" cy="68" r="1.6" fill="#FFF" opacity="0.8"/>`
    );

  Object.keys(I).forEach((k) => { if (I[k] === null) delete I[k]; });
  register('icon', I);
})();
