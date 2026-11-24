// ============================================================================
// MULTI-MINE — Cavern Threats: 16 enemies, the Elite Dreadnought & 3 Bosses
// "Ink & Grit" style: hand-inked lumpy silhouettes, hatched shadow sides,
// colour printed slightly off the line, almond eyes with heavy brows.
// Light comes from the top-left; shadow shapes sit on the right / bottom.
// ============================================================================
(function () {
  const { C, rivet, S, register } = window.MM.Art;
  const { L, G, op, flame, flake, hazard, part, limb, eye, circ } = S;
  const INK = C.ink;
  const DEEP = '#2A2238'; // dark cavity colour (hoods, visors, mouths)
  const GUM = '#7A2420';
  const BONE = '#F4EEDC';

  const brows = (d, w = 2.8) => L(d, INK, w);
  const cracks = (d, w = 1.7) => L(d, INK, w);
  // mirror a path's x coordinates around 48 (for symmetric legs / claws)
  const mirror = (d) => d.replace(/([ML])\s*(-?[\d.]+)/g, (m, c, x) => `${c}${(96 - parseFloat(x)).toFixed(1)}`);
  const legPair = (d, col, w = 3) => limb(d, col, w) + limb(mirror(d), col, w);
  const tread = (x, y, w, h) =>
    part(`M${x + h / 2} ${y} L${x + w - h / 2} ${y} Q${x + w} ${y} ${x + w} ${y + h / 2} Q${x + w} ${y + h} ${x + w - h / 2} ${y + h} L${x + h / 2} ${y + h} Q${x} ${y + h} ${x} ${y + h / 2} Q${x} ${y} ${x + h / 2} ${y}Z`, C.inkSoft) +
    Array.from({ length: Math.max(2, Math.round(w / 15)) }, (_, i, n = Math.max(2, Math.round(w / 15))) => {
      const cx = x + h / 2 + ((w - h) * i) / (n - 1);
      return part(circ(cx, y + h / 2, h / 2 - 3), C.steelD, { w: 2 }) + `<circle cx="${cx}" cy="${y + h / 2}" r="1.4" fill="${INK}"/>`;
    }).join('');
  const sparkle = (x, y, r, col) =>
    `<path d="M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z" fill="${col}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`;
  const drill = (x, y, len, h, dir) => {
    const t = x + len * dir;
    return part(`M${x} ${y - h / 2} L${t} ${y} L${x} ${y + h / 2}Z`, C.steelL, { sh: `M${x} ${y + 1} L${t} ${y} L${x} ${y + h / 2}Z`, shc: C.steelD }) +
      [0.22, 0.46, 0.68].map((k) => L(`M${x + len * dir * k} ${y - (h / 2) * (1 - k)} L${x + len * dir * (k + 0.13)} ${y + (h / 2) * (1 - k - 0.13)}`, INK, 1.8)).join('');
  };

  const EN = {
    // ---- Scrap Mite: a rusty orange cave tick, three pointy back plates ----
    scrap_mite: wrap(
      legPair('M33 62 L20 53 L11 65', C.brownD) + legPair('M31 69 L17 70 L12 82', C.brownD) + legPair('M37 73 L29 81 L28 89', C.brownD) +
      part('M34 39 L37 25 L45 35Z', C.brownL, { sh: 'M40 30 L45 35 L37 37Z' }) +
      part('M45 34 L50 19 L56 33Z', C.brownL, { sh: 'M52 26 L56 33 L49 34Z' }) +
      part('M57 36 L64 24 L67 40Z', C.brownL, { sh: 'M65 31 L67 40 L62 38Z' }) +
      part('M22 60 Q20 43 34 37 Q48 31 62 35 Q77 41 76 58 Q74 70 60 73 Q46 76 33 72 Q22 68 22 60Z', C.orange, {
        sh: 'M62 35 Q77 41 76 58 Q74 70 60 73 Q50 75 40 74 Q68 64 62 35Z', hl: 'M29 50 Q33 41 44 37 Q36 45 34 54Z'
      }) +
      cracks('M41 37 Q44 50 39 72 M57 35 Q60 50 57 73', 1.6) +
      eye(41, 57, 5.2, 3.4) + eye(55, 57, 5.2, 3.4) + brows('M34 49 L46 53 M62 49 L50 53') +
      L('M43 68 Q39 74 45 78 M53 68 Q57 74 51 78', INK, 2.8)
    ),

    // ---- Geode Brute: hunched boulder with crystals sprouting from its back ----
    geode_brute: wrap(
      part('M14 58 Q4 70 10 83 Q20 90 28 81 Q26 68 22 58Z', C.rock, { sh: 'M22 62 Q26 70 28 81 Q23 86 17 86 Q24 74 22 62Z' }) +
      part('M82 58 Q92 70 86 83 Q76 90 68 81 Q70 68 74 58Z', C.rock, { sh: 'M86 64 Q92 74 86 83 Q81 88 74 88 Q86 76 86 64Z' }) +
      part('M30 42 L25 18 L39 33Z', C.crystal, { sh: 'M33 25 L39 33 L31 41Z', hl: 'M27 22 L29 21 L31 35Z' }) +
      part('M42 34 L48 6 L57 32Z', C.purpleL, { sh: 'M51 15 L57 32 L49 33Z', hl: 'M45 24 L47 14 L47 30Z' }) +
      part('M60 36 L73 15 L71 42Z', C.crystal, { sh: 'M71 24 L71 42 L65 39Z' }) +
      part('M16 72 Q12 52 24 41 Q38 29 54 30 Q72 32 80 46 Q88 60 82 76 Q66 88 46 86 Q24 86 16 72Z', C.rock, {
        sh: 'M66 34 Q80 42 82 56 Q86 70 82 76 Q70 86 54 86 Q80 70 66 34Z', hl: 'M24 53 Q28 43 38 38 Q30 47 29 57Z'
      }) +
      cracks('M57 40 l5 6 l-3 5 M25 72 l7 -3 M73 69 l-6 4') +
      part('M27 54 Q48 46 69 54 L67 60 Q48 55 29 60Z', C.rockD) +
      eye(39, 63, 5, 3, { col: C.hatYL }) + eye(57, 63, 5, 3, { col: C.hatYL }) +
      part('M35 73 Q48 67 61 73 Q48 81 35 73Z', GUM, { w: 2.4 }) + L('M41 72 l1 3.4 M48 70.6 v3.6 M55 72 l-1 3.4', BONE, 1.8)
    ),

    // ---- Bore Charger: dented yellow drill cart with one furious porthole eye ----
    bore_charger: wrap(
      tread(10, 70, 64, 16) +
      part('M43 34 L45 18 L55 18 L55 35Z', C.steelD, { sh: 'M51 18 L55 18 L55 35 L51 35Z' }) +
      op(`<circle cx="52" cy="11" r="5" fill="#C9C2B6" stroke="${INK}" stroke-width="1.8"/>`, 0.85) +
      part('M14 68 Q12 46 20 39 Q30 32 50 33 Q64 34 68 42 Q72 52 70 68Z', C.hatY, {
        sh: 'M58 34 Q66 36 68 42 Q72 52 70 68 L60 68 Q64 48 58 34Z', hl: 'M20 46 Q24 39 33 37 Q26 43 24 52Z'
      }) +
      hazard(16, 57, 53, 7) +
      part(circ(32, 47, 9), C.steelL, { w: 2.6 }) + eye(32, 47.5, 5.6, 3.4) + brows('M23 39 L39 43', 3) +
      rivet(50, 40) + rivet(62, 44) + cracks('M44 50 l4 3 l-1 4') +
      part('M63 38 L71 38 L71 68 L63 68Z', C.steelD) + drill(71, 53, 22, 28, 1)
    ),

    // ---- Acid Pod: a veiny green bulb with a slit eye, dripping on its roots ----
    acid_pod: wrap(
      L('M30 86 Q22 89 14 84 M66 86 Q74 89 82 84', INK, 2.6) +
      part('M24 86 Q26 74 34 70 L62 70 Q70 74 72 86 Q48 91 24 86Z', C.greenD) +
      part('M48 11 Q70 13 76 36 Q82 58 66 72 Q48 80 30 72 Q14 58 20 36 Q26 13 48 11Z', C.green, {
        sh: 'M58 13 Q74 20 77 38 Q80 58 66 72 Q56 77 48 77 Q72 56 58 13Z', hl: 'M27 35 Q31 22 42 16 Q34 26 33 39Z'
      }) +
      L('M47 13 Q42 28 46 34 M28 58 Q36 54 37 47 M67 58 Q60 53 60 47', C.greenD, 1.8) +
      part('M30 45 Q48 30 66 45 Q48 60 30 45Z', C.hatYL, { w: 2.6 }) +
      `<path d="M48 35 Q52.5 45 48 55 Q43.5 45 48 35Z" fill="${INK}"/><circle cx="45" cy="41" r="1.6" fill="#FFF"/>` +
      brows('M29 38 Q40 32 46 36 M67 38 Q56 32 50 36', 2.6) +
      part('M37 74 Q37 83 40 85 Q43 83 41 74Z', C.greenL, { w: 1.8 }) + part('M58 74 Q57 80 60 83 Q63 80 61 74Z', C.greenL, { w: 1.8 }) +
      part(circ(66, 22, 3.2), C.greenL, { w: 1.6 }) + part(circ(73, 30, 2.2), C.greenL, { w: 1.4 })
    ),

    // ---- Shield Drone: a hovering steel pod with two blue shield wings ----
    shield_drone: wrap(
      L('M28 13 Q48 9 68 13', INK, 3.4) + part('M46 13 L50 13 L50 25 L46 25Z', C.steelD, { w: 2.4 }) +
      part('M12 30 Q7 50 15 72 L30 65 L30 36Z', C.blue, { sh: 'M11 54 Q11 64 15 72 L30 65 L30 54Z', hl: 'M15 36 L22 34 L18 52 Z' }) +
      part('M84 30 Q89 50 81 72 L66 65 L66 36Z', C.blue, { sh: 'M85 44 Q87 60 81 72 L66 65 L66 44Z' }) +
      part('M28 35 Q29 24 48 24 Q67 24 68 35 L68 60 Q67 73 48 73 Q29 73 28 60Z', C.steel, {
        sh: 'M58 25 Q67 27 68 35 L68 60 Q66 72 50 73 Q62 60 58 25Z', hl: 'M33 37 Q35 29 43 27 Q37 33 36 43Z'
      }) +
      part(circ(48, 48, 11.5), C.steelDD, { w: 2.6 }) + part(circ(48, 48, 7), C.red, { w: 2, sh: 'M52 43 A7 7 0 0 1 48 55 A5 7 0 0 0 52 43Z' }) +
      `<circle cx="45.4" cy="45.4" r="2.2" fill="#FFF"/>` + brows('M35 37 L46 41 M61 37 L50 41', 2.6) +
      rivet(35, 64) + rivet(61, 64) + L('M30 56 H36 M60 56 H66', INK, 1.6)
    ),

    // ---- Magma Slime: a lava blob carrying crusted rock plates ----
    magma_slime: wrap(
      part('M11 80 Q8 60 20 46 Q30 30 46 30 Q64 28 74 44 Q88 58 84 80 Q66 88 48 86 Q28 88 11 80Z', C.lava, {
        sh: 'M64 32 Q78 42 82 56 Q88 72 84 80 Q74 85 62 86 Q80 64 64 32Z', shc: '#B8411A', hl: 'M19 58 Q23 43 33 37 Q26 47 25 60Z', hlo: 0.45
      }) +
      flame(48, 25, 0.85, C.lava, C.lavaL) +
      part('M25 49 L37 41 L45 46 L40 55 L28 56Z', C.rockD, { w: 2.4 }) +
      part('M56 38 L68 42 L66 52 L54 50Z', C.rockD, { w: 2.4 }) +
      part('M62 67 L75 63 L77 74 L64 77Z', C.rockD, { w: 2.4 }) +
      eye(38, 64, 5.2, 3.4, { col: C.hatYL }) + eye(56, 64, 5.2, 3.4, { col: C.hatYL }) + brows('M31 56 L43 59 M63 56 L51 59') +
      L('M40 75 Q48 80 56 75', INK, 2.8) +
      part('M24 84 Q24 90 27 91 Q30 90 28 84Z', C.lava, { w: 1.8 })
    ),

    // ---- Mini Cinder: a scrappy little flame with a grin ----
    mini_cinder: wrap(
      part('M48 88 Q24 86 22 66 Q20 50 32 40 Q32 50 38 50 Q34 34 46 17 Q48 30 56 34 Q60 24 58 13 Q77 30 76 56 Q76 86 48 88Z', C.lava, {
        sh: 'M63 29 Q76 40 76 56 Q76 84 52 88 Q71 74 63 29Z', shc: '#B8411A'
      }) +
      part('M48 84 Q34 82 34 71 Q34 61 42 56 Q42 64 48 64 Q48 56 54 50 Q62 60 62 71 Q62 82 48 84Z', C.lavaL, { w: 0 }) +
      eye(40, 66, 4.4, 3.2) + eye(55, 66, 4.4, 3.2) + brows('M34 59 L44 62 M61 59 L51 62', 2.6) +
      L('M41 76 Q48 81 55 76', INK, 2.6)
    ),

    // ---- Cryo Beetle: an ice-shelled beetle with frosted wing cases ----
    cryo_beetle: wrap(
      legPair('M31 60 L17 52 L10 62', C.blueD) + legPair('M31 70 L17 75 L13 87', C.blueD) +
      L('M41 23 Q34 12 26 11 M55 23 Q62 12 70 11', INK, 2.4) + part(circ(26, 11, 3), C.ice, { w: 1.6 }) + part(circ(70, 11, 3), C.ice, { w: 1.6 }) +
      part('M33 35 Q33 20 48 20 Q63 20 63 35 Q56 41 48 41 Q40 41 33 35Z', C.blueD, { hl: 'M37 30 Q38 24 44 22 Q40 26 40 31Z', hlo: 0.35 }) +
      eye(42, 31, 4, 2.8, { col: C.ice }) + eye(54, 31, 4, 2.8, { col: C.ice }) + brows('M37 25 L45 28 M59 25 L51 28', 2.4) +
      part('M48 39 Q24 39 21 60 Q21 81 47 85 L48 85Z', C.ice, { hl: 'M27 56 Q29 45 39 42 Q31 49 31 59Z' }) +
      part('M48 39 Q72 39 75 60 Q75 81 49 85 L48 85Z', C.ice, { sh: 'M62 42 Q75 49 75 60 Q75 81 49 85 Q71 71 62 42Z', shc: C.iceD }) +
      flake(35, 66, 5, '#FFFFFF') + flake(60, 63, 4, '#FFFFFF') + cracks('M30 76 l5 -3 M66 76 l-4 -4', 1.4)
    ),

    // ---- Quantum Stalker: a ragged purple cloak with teal eyes in the hood ----
    quantum_stalker: wrap(
      op(`<circle cx="50" cy="48" r="38" fill="${C.purpleL}"/>`, 0.22) +
      limb('M28 56 Q17 60 15 71', C.purpleD, 4) + limb('M68 56 Q79 60 81 71', C.purpleD, 4) +
      L('M15 71 l-5 4 M15 71 l-1 6 M15 71 l4 5 M81 71 l5 4 M81 71 l1 6 M81 71 l-4 5', INK, 2.2) +
      part('M48 10 Q68 14 72 40 Q74 62 80 84 L68 78 L60 88 L52 78 L44 88 L36 78 L26 86 Q22 62 24 40 Q28 14 48 10Z', C.purple, {
        sh: 'M58 12 Q70 18 72 40 Q74 62 80 84 L68 78 L62 85 Q66 50 58 12Z', hl: 'M30 40 Q32 24 42 16 Q36 28 35 44Z'
      }) +
      part('M34 39 Q36 26 48 26 Q60 26 62 39 Q60 55 48 57 Q36 55 34 39Z', DEEP, { w: 2.6 }) +
      op(`<ellipse cx="48" cy="41" rx="12" ry="6" fill="${C.screen}"/>`, 0.25) +
      `<path d="M37 41 Q41.5 36 46 40 Q41.5 43 37 41Z M59 41 Q54.5 36 50 40 Q54.5 43 59 41Z" fill="${C.screen}" stroke="${INK}" stroke-width="1.3"/>` +
      sparkle(18, 26, 3.4, C.screen) + sparkle(80, 32, 2.8, C.screen) + sparkle(84, 60, 2.2, C.screen)
    ),

    // ---- Laser Sentinel: a tripod turret staring through one big red lens ----
    laser_sentinel: wrap(
      limb('M34 66 L20 86', C.steelD, 4) + limb('M62 66 L76 86', C.steelD, 4) + limb('M48 70 L48 88', C.steelD, 4) +
      part('M42 26 L44 13 L52 13 L54 26Z', C.steelD, { w: 2.4 }) + part(circ(48, 10, 3.2), C.red, { w: 1.6 }) +
      part('M22 40 Q22 26 36 26 L60 26 Q74 26 74 40 L74 58 Q74 70 60 70 L36 70 Q22 70 22 58Z', C.steel, {
        sh: 'M62 27 Q74 28 74 40 L74 58 Q74 70 60 70 L56 70 Q66 52 62 27Z', hl: 'M27 41 Q28 31 36 29 Q31 35 31 45Z'
      }) +
      part(circ(48, 49, 14), C.steelDD, { w: 2.6 }) +
      part(circ(48, 49, 9), C.red, { w: 2, sh: 'M53 42 A9 9 0 0 1 48 58 A6.5 9 0 0 0 53 42Z' }) +
      `<circle cx="48" cy="49" r="3.2" fill="${INK}"/><circle cx="44.6" cy="45.6" r="2.2" fill="#FFF"/>` +
      part('M32 37 Q48 30 64 37 L63 41 Q48 36 33 41Z', C.steelDD, { w: 2 }) +
      L('M27 61 h6 M27 65 h6 M63 61 h6 M63 65 h6', INK, 1.7)
    ),

    // ---- Shield Golem: a riveted iron block hiding behind two blue slabs ----
    shield_golem: wrap(
      part('M28 72 L42 72 L42 89 L26 89Z', C.steelDD, { w: 2.6 }) + part('M54 72 L68 72 L70 89 L54 89Z', C.steelDD, { w: 2.6 }) +
      part('M20 34 Q20 22 34 22 L62 22 Q76 22 76 34 L76 64 Q76 77 62 77 L34 77 Q20 77 20 64Z', C.steelD, {
        sh: 'M64 23 Q76 24 76 34 L76 64 Q76 77 62 77 L58 77 Q68 54 64 23Z', hl: 'M24 36 Q25 27 33 25 Q28 30 28 40Z'
      }) +
      part('M29 31 L67 31 Q69 38 67 45 L29 45 Q27 38 29 31Z', DEEP, { w: 2.6 }) +
      L('M35 38 L44 40 M52 40 L61 38', C.lava, 3.2) +
      part(circ(48, 59, 6.5), C.lava, { w: 2.4 }) + `<circle cx="46" cy="57" r="1.8" fill="${C.lavaL}"/>` +
      part('M4 27 L18 23 Q22 50 18 81 L4 75 Q1 50 4 27Z', C.blue, { sh: 'M3 55 Q2 66 4 75 L18 81 Q20 68 19 55Z', hl: 'M7 31 L12 29 L9 50Z' }) +
      part('M92 27 L78 23 Q74 50 78 81 L92 75 Q95 50 92 27Z', C.blue, { sh: 'M93 44 Q94 62 92 75 L78 81 Q78 60 77 44Z' }) +
      rivet(10, 36) + rivet(10, 66) + rivet(86, 36) + rivet(86, 66) + rivet(26, 52) + rivet(70, 52)
    ),

    // ---- Swarm Brooder: a bloated egg-sac spider, eggs glowing through the skin ----
    swarm_brooder: wrap(
      legPair('M30 63 L13 53 L7 66', C.purpleD) + legPair('M30 72 L13 77 L9 89', C.purpleD) +
      part('M48 13 Q74 15 80 42 Q84 66 66 74 Q48 80 30 74 Q12 66 16 42 Q22 15 48 13Z', '#C9A15A', {
        sh: 'M60 15 Q78 24 80 42 Q84 66 66 74 Q58 77 50 78 Q76 56 60 15Z', hl: 'M22 38 Q26 25 37 19 Q30 29 29 42Z'
      }) +
      [[33, 40, 6.5], [51, 30, 6], [64, 47, 6.5], [42, 57, 6], [27, 59, 4.4], [57, 64, 4.6]].map(([x, y, r]) =>
        part(circ(x, y, r), C.hatY, { w: 2, sh: `M${x + r * 0.3} ${y - r * 0.9} A${r} ${r} 0 0 1 ${x} ${y + r} A${r * 0.6} ${r} 0 0 0 ${x + r * 0.3} ${y - r * 0.9}Z` }) +
        `<circle cx="${x - 1}" cy="${y - 1}" r="${r * 0.32}" fill="${C.orangeD}"/>`).join('') +
      part('M36 76 Q36 67 48 67 Q60 67 60 76 Q60 85 48 87 Q36 85 36 76Z', C.brownD, { hl: 'M40 73 Q42 69 47 69 Q43 71 42 75Z', hlo: 0.3 }) +
      [[43.5, 75, 2.5], [52.5, 75, 2.5], [46, 80.5, 1.6], [50, 80.5, 1.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.red}" stroke="${INK}" stroke-width="1.1"/>`).join('')
    ),

    // ---- Mortar Crab: a red rock crab with a mortar tube strapped to its back ----
    mortar_crab: wrap(
      legPair('M27 70 L15 78 L12 88', C.redD) + legPair('M33 74 L25 83 L25 90', C.redD) +
      G('rotate(24 62 42)', part('M55 14 L68 14 L68 46 L55 46Z', C.steelD, { sh: 'M63 14 L68 14 L68 46 L63 46Z' }) +
        part('M53 12 Q61.5 6 70 12 Q61.5 18 53 12Z', DEEP, { w: 2.4 })) +
      part('M20 58 Q6 54 6 42 Q14 46 18 44 Q12 38 16 31 Q26 37 26 52Z', C.red, { sh: 'M18 44 Q22 48 26 52 L20 58 Q14 54 18 44Z' }) +
      part('M76 58 Q90 54 90 42 Q82 46 78 44 Q84 38 80 31 Q70 37 70 52Z', C.red, { sh: 'M90 42 Q90 54 76 58 L72 54 Q86 50 90 42Z' }) +
      part('M16 66 Q16 48 34 44 Q48 40 62 44 Q80 48 80 66 Q72 79 48 79 Q24 79 16 66Z', C.red, {
        sh: 'M64 45 Q80 50 80 66 Q74 78 52 79 Q76 66 64 45Z', hl: 'M23 57 Q27 49 36 46 Q29 51 28 59Z'
      }) +
      L('M40 49 L37 37 M54 49 L56 37', INK, 2.6) +
      part(circ(37, 34, 4.6), BONE, { w: 2 }) + part(circ(56, 34, 4.6), BONE, { w: 2 }) +
      `<circle cx="38" cy="34.6" r="2.3" fill="${INK}"/><circle cx="57" cy="34.6" r="2.3" fill="${INK}"/>` +
      brows('M31 27 L41 30 M62 27 L52 30', 2.4) +
      L('M40 66 Q48 71 56 66', INK, 2.6) + cracks('M30 54 l4 3 M64 58 l-4 3', 1.5)
    ),

    // ---- Vortex Wisp: a swirling purple spirit trailing a smoky tail ----
    vortex_wisp: wrap(
      L('M48 88 Q28 80 40 70 Q54 60 38 54', INK, 9.5) + L('M48 88 Q28 80 40 70 Q54 60 38 54', C.purpleL, 6) +
      part(circ(48, 40, 24), C.purple, { sh: 'M56 18 A24 24 0 0 1 48 64 A18 24 0 0 0 56 18Z', hl: 'M30 34 Q33 24 42 19 Q35 27 35 37Z' }) +
      L('M48 30 Q60 29 61 40 Q61 53 48 54 Q35 53 35 41', DEEP, 2.2) +
      eye(40, 41, 4.8, 3.6) + eye(56, 41, 4.8, 3.6) + brows('M33 33 L44 36 M63 33 L52 36', 2.6) +
      sparkle(16, 20, 3.6, C.screen) + sparkle(82, 26, 3, C.screen) + sparkle(78, 64, 2.4, C.purpleL)
    ),

    // ---- Void Weaver: a long-legged shadow spider with a glowing diamond mark ----
    void_weaver: wrap(
      L('M4 4 L30 34 M92 4 L66 34 M4 92 L30 66 M92 92 L66 66 M48 2 V26', C.purpleL, 1.2) +
      legPair('M36 47 L20 27 L10 37', '#4A4166', 2.6) + legPair('M33 55 L13 49 L5 61', '#4A4166', 2.6) +
      legPair('M35 64 L15 72 L9 86', '#4A4166', 2.6) + legPair('M40 70 L28 84 L26 93', '#4A4166', 2.6) +
      part('M48 30 Q66 32 68 52 Q68 74 48 78 Q28 74 28 52 Q30 32 48 30Z', '#3A3350', {
        sh: 'M58 32 Q68 38 68 52 Q68 74 50 78 Q66 62 58 32Z', shc: '#231E33', hl: 'M33 48 Q35 38 42 34 Q37 41 37 50Z', hlo: 0.3
      }) +
      part('M48 46 L55 56 L48 67 L41 56Z', C.purpleL, { w: 2, sh: 'M48 56 L55 56 L48 67Z' }) +
      [[42, 38, 3], [54, 38, 3], [45, 32.5, 2], [51, 32.5, 2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.screen}" stroke="${INK}" stroke-width="1.3"/>`).join('')
    ),

    // ---- Loot Goblin: a greedy gold strongbox on treads, gems for a crown ----
    loot_goblin: wrap(
      tread(14, 72, 68, 15) +
      part('M18 40 Q18 31 28 31 L68 31 Q78 31 78 40 L78 70 Q78 76 72 76 L24 76 Q18 76 18 70Z', C.gold, {
        sh: 'M66 32 Q78 33 78 42 L78 70 Q78 76 72 76 L62 76 Q70 54 66 32Z', hl: 'M23 44 Q24 36 31 34 Q27 39 27 48Z'
      }) +
      part('M30 30 L34 15 L42 24 L48 8 L54 24 L62 15 L66 30Z', C.crystal, { sh: 'M54 24 L62 15 L66 30 L56 30Z' }) +
      part('M14 28 L82 28 L82 39 L14 39Z', C.goldD, { w: 2.8 }) +
      rivet(20, 33.5) + rivet(76, 33.5) +
      eye(38, 52, 5.2, 3.4, { col: C.hatYL }) + eye(58, 52, 5.2, 3.4, { col: C.hatYL }) + brows('M31 45 L43 48 M65 45 L53 48') +
      part('M34 62 Q48 74 62 62 Q48 67 34 62Z', INK, { w: 2.2 }) + L('M41 64.6 l1 3 M48 66 v3 M55 64.6 l-1 3', BONE, 1.6) +
      part(circ(10, 66, 4.4), C.gold, { w: 2 }) + part(circ(86, 60, 4), C.gold, { w: 2 }) +
      sparkle(10, 22, 3.6, C.hatYL) + sparkle(86, 18, 3, C.hatYL)
    ),

    // ---- Elite Dreadnought: a red armoured tank with a long cannon ----
    elite_dreadnought: wrap(
      tread(8, 70, 80, 18) +
      part('M12 70 L14 45 Q16 36 26 36 L70 36 Q80 36 82 45 L84 70Z', C.red, {
        sh: 'M70 37 Q80 38 82 45 L84 70 L72 70 Q76 52 70 37Z', hl: 'M18 49 Q19 41 26 39 Q22 44 22 54Z'
      }) +
      hazard(15, 60, 68, 7) +
      part('M62 23 L93 21 L93 30 L62 32Z', C.steelDD, { w: 2.6 }) +
      part('M28 37 Q28 17 48 17 Q66 17 66 37Z', C.steelD, { sh: 'M58 19 Q66 24 66 37 L58 37 Q60 26 58 19Z', hl: 'M33 32 Q34 23 41 20 Q37 25 37 33Z' }) +
      part('M35 25 L59 25 L57 32 L37 32Z', DEEP, { w: 2.2 }) + L('M39 28.6 L46 29.6 M50 29.6 L56 28.6', C.lava, 2.6) +
      part('M40 42 L48 39 L56 42 L54 52 L48 56 L42 52Z', C.hatY, { w: 2.4, sh: 'M48 39 L56 42 L54 52 L48 56Z' }) +
      rivet(21, 44) + rivet(75, 44) + rivet(21, 54) + rivet(75, 54)
    ),

    // ===== BOSSES ===================================================================
    // MK-IX Core Excavator: orange dig-tank with twin drills and smoking stacks
    boss_excavator: wrap(
      tread(14, 74, 68, 16) +
      part('M28 28 L37 28 L37 12 L28 12Z', C.steelD, { w: 2.6 }) + part('M59 28 L68 28 L68 12 L59 12Z', C.steelD, { w: 2.6 }) +
      flame(32.5, 7, 0.75) + flame(63.5, 7, 0.75) +
      part('M24 75 L24 35 Q24 26 33 26 L63 26 Q72 26 72 35 L72 75Z', C.orange, {
        sh: 'M62 27 Q72 28 72 36 L72 75 L62 75 Q66 50 62 27Z', hl: 'M28 40 Q29 31 35 29 Q32 34 32 44Z'
      }) +
      part('M31 34 L65 34 L62 55 L34 55Z', DEEP, { w: 2.6 }) +
      eye(41, 44, 5, 3.2, { col: C.hatYL }) + eye(56, 44, 5, 3.2, { col: C.hatYL }) + brows('M34 37 L46 41 M63 37 L51 41', 3) +
      part('M35 60 L61 60 L59 69 L37 69Z', C.steelDD, { w: 2.4 }) + L('M41 60 V69 M47 60 V69 M53 60 V69', INK, 1.6) +
      drill(24, 60, 22, 30, -1) + drill(72, 60, 22, 30, 1) +
      part(circ(24, 60, 6.5), C.steelL, { w: 2.4 }) + part(circ(72, 60, 6.5), C.steelL, { w: 2.4 }) + rivet(29, 71) + rivet(67, 71)
    ),
    // Pyroclast: a walking volcano, lava seams glowing through cracked rock
    boss_pyroclast: wrap(
      part('M6 88 Q4 60 18 44 Q30 22 48 20 Q66 22 78 44 Q92 60 90 88Z', C.rock, {
        sh: 'M60 22 Q74 30 80 46 Q92 62 90 88 L68 88 Q82 54 60 22Z', hl: 'M15 60 Q19 44 30 33 Q22 46 22 62Z'
      }) +
      L('M18 82 L28 62 L24 50 M78 82 L68 64 L73 52 M48 88 V76 M36 30 L40 38', INK, 5.6) +
      L('M18 82 L28 62 L24 50 M78 82 L68 64 L73 52 M48 88 V76 M36 30 L40 38', C.lava, 2.8) +
      flame(30, 25, 1.15) + flame(48, 14, 1.35) + flame(66, 25, 1.15) +
      part('M24 46 Q48 36 72 46 L70 53 Q48 46 26 53Z', C.rockD) +
      eye(36, 56, 7, 4, { col: C.hatYL, dx: 1.4 }) + eye(60, 56, 7, 4, { col: C.hatYL, dx: 1.4 }) +
      part('M29 68 Q48 84 67 68 Q48 76 29 68Z', C.lava, { w: 2.6 }) +
      `<path d="M36 70.5 L39 75 L42 72 M54 72 L57 75 L60 70.5" fill="${BONE}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`
    ),
    // Quantum Core: a faceted hex crystal with one slit eye and an orbit ring
    boss_quantum: wrap(
      `<ellipse cx="48" cy="48" rx="45" ry="14" fill="none" stroke="${INK}" stroke-width="5" transform="rotate(-20 48 48)"/>` +
      `<ellipse cx="48" cy="48" rx="45" ry="14" fill="none" stroke="${C.screen}" stroke-width="2.4" stroke-dasharray="8 5" transform="rotate(-20 48 48)"/>` +
      part('M48 6 L84 27 L84 69 L48 90 L12 69 L12 27Z', C.purpleD, { sh: 'M48 48 L84 27 L84 69 L48 90Z', shc: '#3E2670', hl: 'M48 6 L12 27 L48 48Z', hlo: 0.22 }) +
      L('M48 6 V48 M12 27 L48 48 L84 27 M48 48 V90', INK, 1.4) +
      part('M48 22 L70 35 L70 61 L48 74 L26 61 L26 35Z', C.purple, { w: 2.6, sh: 'M48 48 L70 35 L70 61 L48 74Z' }) +
      part(circ(48, 48, 14), DEEP, { w: 2.6 }) +
      eye(48, 48, 11, 6, { col: C.screen, slit: true, r: 4, dx: 0 }) +
      [[48, 11], [80, 30], [80, 66], [48, 85], [16, 66], [16, 30]].map(([x, y]) => part(circ(x, y, 3.4), C.screen, { w: 1.6 })).join('') +
      `<path d="M12 48 Q30 62 48 62 Q70 62 90 34" fill="none" stroke="${C.screen}" stroke-width="2.4" stroke-dasharray="8 5"/>`
    )
  };

  function wrap(inner) {
    return window.MM.Art.wrap(inner);
  }

  register('enemy', EN);
})();
