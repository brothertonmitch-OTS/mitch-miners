// ============================================================================
// MULTI-MINE — 16 Combat Pets
// "Ink & Grit" style, like the enemies, but friendly: round shining eyes,
// soft smiles, rosy cheeks. Light from the top-left, hatched shadow sides.
// ============================================================================
(function () {
  const { C, wrap, rivet, S, register } = window.MM.Art;
  const { L, G, op, bolt, flame, flake, part, limb, eye, circ } = S;
  const INK = C.ink;
  const DEEP = '#2A2238';

  // friendly eyes: tall, big pupils looking slightly up
  const peepers = (cx, cy, gap = 8, w = 4.4, h = 4) =>
    eye(cx - gap, cy, w, h, { r: w * 0.72, dx: 0.5 }) + eye(cx + gap, cy, w, h, { r: w * 0.72, dx: 0.5 });
  const smile = (cx, cy, w = 4) => L(`M${cx - w} ${cy} Q${cx} ${cy + w} ${cx + w} ${cy}`, INK, 2.4);
  const blush = (cx, cy, gap = 15) => [-1, 1].map((s) => `<ellipse cx="${cx + s * gap}" cy="${cy}" rx="3.4" ry="2" fill="${C.pink}" opacity="0.65"/>`).join('');
  const foot = (x, y, col) => part(`M${x - 7} ${y + 3} Q${x - 7} ${y - 4} ${x} ${y - 4} Q${x + 7} ${y - 4} ${x + 7} ${y + 3}Z`, col, { w: 2.4 });
  const sparkle = (x, y, r, col) =>
    `<path d="M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z" fill="${col}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`;
  const visor = (x, y, w, h, col) =>
    part(`M${x + 4} ${y} L${x + w - 4} ${y} Q${x + w} ${y} ${x + w} ${y + h / 2} Q${x + w} ${y + h} ${x + w - 4} ${y + h} L${x + 4} ${y + h} Q${x} ${y + h} ${x} ${y + h / 2} Q${x} ${y} ${x + 4} ${y}Z`, DEEP, { w: 2.4 }) +
    `<path d="M${x + w * 0.22} ${y + h * 0.3} h${w * 0.14} v${h * 0.42} h-${w * 0.14}Z M${x + w * 0.64} ${y + h * 0.3} h${w * 0.14} v${h * 0.42} h-${w * 0.14}Z" fill="${col}"/>`;

  const P = {
    // Loot Worm: a segmented gold grub in a little miner's helmet
    loot_worm: wrap(
      [[20, 72, 11], [34, 64, 12.5], [50, 60, 13.5]].map(([x, y, r]) =>
        part(circ(x, y, r), C.hatY, { sh: `M${x + r * 0.3} ${y - r * 0.95} A${r} ${r} 0 0 1 ${x} ${y + r} A${r * 0.6} ${r} 0 0 0 ${x + r * 0.3} ${y - r * 0.95}Z` }) +
        L(`M${x - r * 0.6} ${y - r * 0.4} Q${x} ${y - r * 0.95} ${x + r * 0.6} ${y - r * 0.4}`, C.hatYD, 2)).join('') +
      part('M50 46 Q50 28 68 28 Q86 28 86 46 Q86 64 68 64 Q50 64 50 46Z', C.pink, { sh: 'M76 30 Q86 34 86 46 Q86 64 68 64 Q82 52 76 30Z', hl: 'M55 42 Q57 33 64 31 Q59 36 59 44Z' }) +
      part('M52 30 Q52 15 68 15 Q84 15 84 30Z', C.hatY, { sh: 'M74 16 Q84 20 84 30 L76 30 Q77 22 74 16Z' }) +
      part('M48 29 L88 29 L88 35 L48 35Z', C.hatYD, { w: 2.4 }) + part(circ(68, 21, 4), C.hatYL, { w: 1.8 }) +
      peepers(68, 46, 6.6, 3.6, 3.4) + smile(68, 55, 3.6) + blush(68, 53, 12) +
      part(circ(30, 84, 3.4), C.gold, { w: 1.6 }) + part(circ(44, 83, 3), C.gold, { w: 1.6 })
    ),
    // Catling: a steel robo-kitten with screen eyes and a hat-lamp
    catling: wrap(
      part('M24 42 L27 15 L45 32Z', C.steel, { sh: 'M36 23 L45 32 L33 37Z' }) + part('M72 42 L69 15 L51 32Z', C.steel, { sh: 'M69 15 L72 42 L62 37Z' }) +
      `<path d="M29 34 L30 22 L38 31Z M67 34 L66 22 L58 31Z" fill="${C.pink}"/>` +
      part('M22 52 Q22 30 48 30 Q74 30 74 52 Q74 74 48 74 Q22 74 22 52Z', C.steelL, { sh: 'M62 32 Q74 38 74 52 Q74 74 50 74 Q70 60 62 32Z', shc: C.steel, hl: 'M28 48 Q30 38 39 34 Q32 41 32 50Z' }) +
      visor(28, 41, 40, 15, C.screen) + `<path d="M48 61 L44.6 64.6 H51.4Z" fill="${C.pink}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>` +
      L('M27 61 l-11 -2 M27 65 l-11 2 M69 61 l11 -2 M69 65 l11 2', INK, 1.8) +
      foot(36, 80, C.hatY) + foot(60, 80, C.hatY)
    ),
    // Blazemander: a chubby orange salamander with a flame-tipped tail
    blazemander: wrap(
      part('M68 68 Q88 72 90 56 Q92 48 86 45 Q84 58 70 59Z', C.orange, { sh: 'M90 54 Q88 70 68 68 L70 63 Q84 64 90 54Z' }) + flame(87, 40, 0.75) +
      part('M24 62 Q24 44 48 44 Q72 44 72 62 Q72 78 48 78 Q24 78 24 62Z', C.orange, { sh: 'M60 46 Q72 50 72 62 Q72 78 50 78 Q68 66 60 46Z' }) +
      part('M36 66 Q36 58 48 58 Q60 58 60 66 Q60 74 48 74 Q36 74 36 66Z', C.hatYL, { w: 2 }) +
      part('M20 37 Q20 19 42 19 Q64 19 64 37 Q64 54 42 54 Q20 54 20 37Z', C.orange, { sh: 'M54 21 Q64 26 64 37 Q64 54 44 54 Q60 44 54 21Z', hl: 'M26 33 Q28 24 36 21 Q30 27 30 35Z' }) +
      part(circ(28, 21, 6.4), C.lava, { w: 2.2 }) + part(circ(41, 16, 6), C.lava, { w: 2.2 }) + part(circ(54, 20, 5.4), C.lava, { w: 2.2 }) +
      peepers(42, 36, 8.4, 4.2, 3.8) + smile(42, 46, 4.4) + blush(42, 43, 14) +
      foot(31, 82, C.orangeD) + foot(63, 82, C.orangeD)
    ),
    // Frost Pup: a snowy robo-puppy with floppy blue ears and a frost pack
    frost_pup: wrap(
      L('M48 22 V12', INK, 3) + part(circ(48, 10, 4), C.ice, { w: 2.2 }) +
      part('M25 30 Q11 34 16 54 Q23 52 29 41Z', C.blue, { sh: 'M16 46 Q16 52 16 54 Q23 52 27 44Z' }) +
      part('M71 30 Q85 34 80 54 Q73 52 67 41Z', C.blue, { sh: 'M84 40 Q84 48 80 54 Q73 52 70 46Z' }) +
      part('M24 42 Q24 22 48 22 Q72 22 72 42 Q72 62 48 62 Q24 62 24 42Z', '#F4F1EA', { sh: 'M60 24 Q72 30 72 42 Q72 62 50 62 Q68 50 60 24Z', shc: '#C9D3DD', hl: 'M29 38 Q31 29 39 26 Q33 32 33 40Z' }) +
      visor(32, 34, 32, 14, C.ice) + part('M44 52 Q48 49 52 52 Q48 56 44 52Z', INK, { w: 0 }) + smile(48, 57, 3) +
      part('M30 66 Q30 60 38 60 L58 60 Q66 60 66 66 L66 72 Q66 78 58 78 L38 78 Q30 78 30 72Z', C.steelL, { sh: 'M58 60 Q66 60 66 66 L66 72 Q66 78 58 78 L54 78 Q60 70 58 60Z', shc: C.steel }) +
      part('M37 64 L59 64 L59 73 L37 73Z', C.blue, { w: 2 }) + flake(48, 68.5, 3, '#FFFFFF') +
      foot(36, 83, C.steelD) + foot(60, 83, C.steelD)
    ),
    // Volt Ferret: a zippy yellow ferret with a lightning tail
    volt_ferret: wrap(
      part('M66 60 Q86 64 88 44 Q90 32 82 30 L84 40 L76 38 L80 50 Q74 56 66 54Z', C.hatY, { sh: 'M88 44 Q86 64 66 60 L66 57 Q82 58 88 44Z' }) +
      part('M22 62 Q22 46 44 46 Q66 46 66 62 Q66 78 44 78 Q22 78 22 62Z', C.hatY, { sh: 'M56 48 Q66 52 66 62 Q66 78 46 78 Q62 68 56 48Z' }) +
      part(circ(26, 27, 7.4), C.hatY, { w: 2.6 }) + part(circ(62, 27, 7.4), C.hatY, { w: 2.6 }) +
      `<circle cx="26" cy="27" r="3.4" fill="${C.brownD}"/><circle cx="62" cy="27" r="3.4" fill="${C.brownD}"/>` +
      part('M22 42 Q22 24 44 24 Q66 24 66 42 Q66 60 44 60 Q22 60 22 42Z', C.hatY, { sh: 'M56 26 Q66 31 66 42 Q66 60 46 60 Q62 48 56 26Z', hl: 'M28 38 Q30 29 38 26 Q32 32 32 40Z' }) +
      `<path d="M30 44 Q44 34 58 44 Q44 54 30 44Z" fill="${C.brownD}"/>` +
      peepers(44, 42, 7.6, 4, 3.6) + part('M41.6 50 Q44 48 46.4 50 Q44 53 41.6 50Z', INK, { w: 0 }) + smile(44, 53, 3) +
      bolt(13, 50, 0.95) + bolt(78, 17, 0.85) + foot(32, 82, C.hatYD) + foot(56, 82, C.hatYD)
    ),
    // Medic Bee: a round striped bee carrying a first-aid kit
    medic_bee: wrap(
      part('M30 34 Q14 30 16 18 Q28 12 38 26Z', '#F4F1EA', { w: 2.4, hl: 'M20 20 Q24 16 28 20 Q23 21 21 24Z', hlo: 0.8 }) +
      part('M66 34 Q82 30 80 18 Q68 12 58 26Z', '#F4F1EA', { w: 2.4 }) +
      part('M22 56 Q22 32 48 32 Q74 32 74 56 Q74 80 48 80 Q22 80 22 56Z', C.hatY, { sh: 'M62 34 Q74 42 74 56 Q74 80 50 80 Q70 64 62 34Z' }) +
      `<path d="M22.5 52 Q48 48 73.5 52 L73.6 59 Q48 55 22.4 59Z M24.5 66 Q48 62 71.5 66 L70 72 Q48 68 26 72Z" fill="${INK}"/>` +
      part('M34 33 Q34 20 48 20 Q62 20 62 33 Q62 46 48 46 Q34 46 34 33Z', C.hatY, { sh: 'M55 21 Q62 25 62 33 Q62 46 49 46 Q59 38 55 21Z', hl: 'M38 30 Q39 24 44 22 Q41 26 41 31Z' }) +
      peepers(48, 33, 5.6, 3.4, 3.2) + smile(48, 40, 3) +
      L('M42 21 Q38 12 32 10 M54 21 Q58 12 64 10', INK, 2.4) + part(circ(32, 10, 3), C.red, { w: 1.6 }) + part(circ(64, 10, 3), C.red, { w: 1.6 }) +
      part('M61 64 L80 63 L80 80 L62 81Z', '#F4F1EA', { w: 2.4 }) + `<path d="M69 66 h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 v-4 h4Z" fill="${C.red}"/>` +
      `<path d="M48 79 L44 87 L52 87Z" fill="${INK}"/>`
    ),
    // Mine Crab: a little red crab wearing a hard hat
    mine_crab: wrap(
      part('M18 46 Q4 40 8 26 Q14 30 16 24 Q24 34 24 44Z', C.red, { sh: 'M16 32 Q22 38 24 44 L18 46 Q18 38 16 32Z' }) +
      part('M78 46 Q92 40 88 26 Q82 30 80 24 Q72 34 72 44Z', C.red, { sh: 'M88 26 Q92 40 78 46 L76 42 Q86 38 88 26Z' }) +
      limb('M26 70 L15 79', C.redD, 2.6) + limb('M31 74 L24 85', C.redD, 2.6) + limb('M70 70 L81 79', C.redD, 2.6) + limb('M65 74 L72 85', C.redD, 2.6) +
      part('M18 60 Q18 42 48 42 Q78 42 78 60 Q78 78 48 78 Q18 78 18 60Z', C.red, { sh: 'M64 44 Q78 50 78 60 Q78 78 50 78 Q72 66 64 44Z', hl: 'M24 56 Q26 48 34 45 Q28 51 28 58Z' }) +
      L('M38 44 V35 M58 44 V35', INK, 2.6) +
      part(circ(38, 31, 5.4), '#F4EEDC', { w: 2.2 }) + part(circ(58, 31, 5.4), '#F4EEDC', { w: 2.2 }) +
      `<circle cx="39" cy="32" r="2.8" fill="${INK}"/><circle cx="59" cy="32" r="2.8" fill="${INK}"/><circle cx="38" cy="30.6" r="1" fill="#FFF"/><circle cx="58" cy="30.6" r="1" fill="#FFF"/>` +
      part('M31 47 Q31 37 48 37 Q65 37 65 47Z', C.hatY, { sh: 'M56 38 Q65 41 65 47 L58 47 Q59 42 56 38Z' }) + part('M26 46 L70 46 L70 51 L26 51Z', C.hatYD, { w: 2.2 }) +
      smile(48, 63, 5) + rivet(34, 60) + rivet(62, 60)
    ),
    // Void Owl: a round purple owl with brass goggle eyes
    void_owl: wrap(
      part('M22 27 L29 9 L39 25Z', C.purpleD) + part('M74 27 L67 9 L57 25Z', C.purpleD) +
      part('M17 52 Q12 76 34 85 Q24 64 27 48Z', C.purpleD) + part('M79 52 Q84 76 62 85 Q72 64 69 48Z', C.purpleD) +
      part('M20 52 Q20 20 48 20 Q76 20 76 52 Q76 84 48 84 Q20 84 20 52Z', C.purple, { sh: 'M62 22 Q76 32 76 52 Q76 84 50 84 Q72 64 62 22Z', hl: 'M26 46 Q28 32 38 26 Q32 36 32 48Z' }) +
      part('M36 66 Q36 56 48 56 Q60 56 60 66 Q60 78 48 78 Q36 78 36 66Z', C.purpleL, { w: 0 }) + L('M40 66 l4 4 l4 -4 l4 4 l4 -4', C.purple, 2) +
      part(circ(37, 41, 11), C.gold, { w: 2.6, sh: 'M41 31 A11 11 0 0 1 37 52 A8 11 0 0 0 41 31Z' }) + part(circ(59, 41, 11), C.gold, { w: 2.6, sh: 'M63 31 A11 11 0 0 1 59 52 A8 11 0 0 0 63 31Z' }) +
      part(circ(37, 41, 6.6), C.screen, { w: 1.8 }) + part(circ(59, 41, 6.6), C.screen, { w: 1.8 }) +
      `<circle cx="37.6" cy="41.6" r="3" fill="${INK}"/><circle cx="59.6" cy="41.6" r="3" fill="${INK}"/><circle cx="36" cy="40" r="1.2" fill="#FFF"/><circle cx="58" cy="40" r="1.2" fill="#FFF"/>` +
      part('M48 49 L43 55 L53 55Z', C.hatY, { w: 2 }) + foot(41, 88, C.hatY) + foot(56, 88, C.hatY)
    ),
    // Slime Cube: a wobbly mint gel cube with a swallowed bolt inside
    slime_cube: wrap(
      `<ellipse cx="48" cy="83" rx="32" ry="6" fill="${C.greenD}" opacity="0.45"/>` +
      part('M18 34 Q17 20 32 21 L64 19 Q79 20 78 34 L79 70 Q78 83 66 82 L30 83 Q18 82 18 70Z', C.mint, {
        sh: 'M62 20 Q79 20 78 34 L79 70 Q78 83 66 82 L58 82 Q68 70 62 20Z', hl: 'M24 34 Q25 26 33 25 Q28 30 28 40Z', hlo: 0.65
      }) +
      G('rotate(18 61 64)', part('M56 59 L66 59 L66 69 L56 69Z', C.steel, { w: 2 }) + `<circle cx="61" cy="64" r="2" fill="${INK}"/>`) +
      `<circle cx="31" cy="68" r="3" fill="#FFF" opacity="0.6"/><circle cx="40" cy="74" r="1.8" fill="#FFF" opacity="0.6"/>` +
      peepers(48, 44, 10, 5, 4.6) + L('M40 55 Q48 62 56 55', INK, 2.6) + blush(48, 52, 17)
    ),
    // Mech Rex: a pocket robo-dino with a yellow head-plate
    mech_rex: wrap(
      part('M20 66 Q6 70 4 58 Q14 60 22 56Z', C.green, { sh: 'M4 58 Q6 70 20 66 L21 62 Q10 64 4 58Z' }) +
      part('M30 72 L42 72 L42 86 L30 86Z', C.greenD) + part('M46 72 L58 72 L58 86 L46 86Z', C.greenD) +
      part('M18 62 Q18 46 40 46 Q62 46 62 62 Q62 78 40 78 Q18 78 18 62Z', C.green, { sh: 'M52 48 Q62 52 62 62 Q62 78 42 78 Q58 68 52 48Z', hl: 'M24 58 Q26 50 33 48 Q28 53 28 60Z' }) +
      part('M30 47 L34 38 L38 46 L42 38 L46 46Z', C.steelL, { w: 2 }) +
      part('M48 52 L48 31 Q48 18 62 18 L80 18 Q90 18 90 28 L90 40 Q90 48 82 48 L68 48 L68 54Z', C.green, {
        sh: 'M68 40 L90 40 Q90 48 82 48 L68 48Z', hl: 'M52 32 Q53 23 60 21 Q56 26 56 34Z'
      }) +
      L('M70 40 H88', INK, 2) + `<path d="M72 40 L75 44 L78 40 L81 44 L84 40Z" fill="#F4EEDC" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>` +
      eye(66, 29, 4.4, 4, { r: 3, dx: 0.6 }) +
      part('M52 13 L72 13 L72 20 L52 20Z', C.hatY, { w: 2.2 }) + limb('M58 56 L66 60', C.greenD, 2.6) + rivet(30, 62) + rivet(46, 64)
    ),
    // Laser Mantis: a lanky green mantis with red ruby eyes
    laser_mantis: wrap(
      limb('M38 66 L24 86', C.greenD, 2.4) + limb('M58 66 L72 86', C.greenD, 2.4) + limb('M44 70 L38 88', C.greenD, 2.4) + limb('M52 70 L58 88', C.greenD, 2.4) +
      part('M34 60 Q34 42 48 42 Q62 42 62 60 Q62 78 48 78 Q34 78 34 60Z', C.green, { sh: 'M54 44 Q62 50 62 60 Q62 78 50 78 Q60 64 54 44Z' }) +
      part('M37 50 L18 36 L14 18 L23 31Z', C.greenL, { sh: 'M18 30 L23 31 L37 50 L30 48Z', shc: C.green }) +
      part('M59 50 L78 36 L82 18 L73 31Z', C.greenL, { sh: 'M82 18 L78 36 L59 50 L66 40Z', shc: C.green }) +
      L('M14 18 l-4 -6 M82 18 l4 -6', C.red, 3) +
      part('M48 46 L30 30 L34 15 L48 24 L62 15 L66 30Z', C.green, { sh: 'M48 24 L62 15 L66 30 L48 46Z' }) +
      part(circ(37, 26, 6.4), C.red, { w: 2.2 }) + part(circ(59, 26, 6.4), C.red, { w: 2.2 }) +
      `<circle cx="35" cy="24" r="2" fill="#FFF"/><circle cx="57" cy="24" r="2" fill="#FFF"/>` +
      L('M41 16 Q36 6 28 4 M55 16 Q60 6 68 4', INK, 2) + L('M44 37 Q48 40 52 37', INK, 2)
    ),
    // Grav Jelly: a floaty purple jellyfish inside a little orbit ring
    grav_jelly: wrap(
      [26, 38, 48, 58, 70].map((x, i) => L(`M${x} 52 q${i % 2 ? 6 : -6} 12 0 24 q${i % 2 ? -5 : 5} 8 0 14`, INK, 5.6) + L(`M${x} 52 q${i % 2 ? 6 : -6} 12 0 24 q${i % 2 ? -5 : 5} 8 0 14`, C.purpleL, 2.8)).join('') +
      part('M16 54 C16 26 32 14 48 14 C64 14 80 26 80 54 Q72 59 64 54 Q56 61 48 54 Q40 61 32 54 Q24 59 16 54Z', C.purple, {
        sh: 'M48 14 C64 14 80 26 80 54 Q72 59 64 54 C66 36 60 22 48 14Z', hl: 'M24 40 Q26 26 36 20 Q30 30 30 42Z'
      }) +
      peepers(48, 38, 8.6, 4.4, 4) + smile(48, 47, 4) + blush(48, 44, 15) +
      `<ellipse cx="48" cy="36" rx="42" ry="9" fill="none" stroke="${C.screen}" stroke-width="2" stroke-dasharray="6 5"/>`
    ),
    // Chrono Fox: an orange fox wearing a pocket watch
    chrono_fox: wrap(
      part('M66 66 Q90 66 90 46 Q86 54 78 54 Q86 40 76 32 Q78 50 64 56Z', C.orange, { sh: 'M90 46 Q90 66 66 66 L66 62 Q84 62 90 46Z' }) +
      `<path d="M86 48 Q90 44 90 46 Q90 56 82 60Z" fill="#F4F1EA"/>` +
      part('M22 64 Q22 48 44 48 Q66 48 66 64 Q66 80 44 80 Q22 80 22 64Z', C.orange, { sh: 'M56 50 Q66 54 66 64 Q66 80 46 80 Q62 70 56 50Z' }) +
      `<path d="M32 68 Q44 58 56 68 Q56 78 44 78 Q32 78 32 68Z" fill="#F4F1EA"/>` +
      part('M20 33 L24 8 L39 24Z', C.orange) + part('M68 33 L64 8 L49 24Z', C.orange) +
      `<path d="M24 26 L26 15 L33 23Z M64 26 L62 15 L55 23Z" fill="${INK}"/>` +
      part('M18 30 Q22 22 44 22 Q66 22 70 30 Q72 48 44 58 Q16 48 18 30Z', C.orange, { sh: 'M58 23 Q68 25 70 30 Q72 46 48 57 Q66 44 58 23Z', hl: 'M23 32 Q26 26 33 25 Q28 29 28 36Z' }) +
      `<path d="M30 42 Q44 60 58 42 Q56 52 44 58 Q32 52 30 42Z" fill="#F4F1EA"/>` +
      peepers(44, 36, 8.6, 3.8, 3.6) + part('M41 47 Q44 45 47 47 Q44 50 41 47Z', INK, { w: 0 }) +
      part(circ(44, 72, 6.6), C.gold, { w: 2.2 }) + L('M44 68.6 V72 L46.4 73.4', INK, 1.4) + L('M44 65.4 V62', INK, 1.6) +
      foot(32, 84, C.orangeD) + foot(56, 84, C.orangeD)
    ),
    // Magma Turtle: a mossy turtle carrying a smouldering rock shell
    magma_turtle: wrap(
      part('M58 56 Q58 44 70 44 Q82 44 82 56 Q82 68 70 68 Q58 68 58 56Z', '#8BAF5C', { sh: 'M76 46 Q82 50 82 56 Q82 68 72 68 Q80 60 76 46Z' }) +
      eye(73, 54, 3.8, 3.4, { r: 2.6, dx: 0.6 }) + smile(76, 61, 3) +
      part('M22 66 L34 66 L34 80 L22 80Z', '#7C9C4F') + part('M52 66 L64 66 L64 80 L52 80Z', '#7C9C4F') +
      part('M12 66 C12 36 28 26 44 26 C60 26 72 36 72 66Z', C.rock, { sh: 'M44 26 C60 26 72 36 72 66 L58 66 C58 46 54 32 44 26Z', hl: 'M18 54 Q20 40 30 32 Q24 44 24 56Z' }) +
      L('M24 46 L34 38 L48 40 L56 50 L46 58 L30 58Z M34 38 L32 28 M48 40 L58 32 M56 50 L70 52 M30 58 L14 58', INK, 4.8) +
      L('M24 46 L34 38 L48 40 L56 50 L46 58 L30 58Z M34 38 L32 28 M48 40 L58 32 M56 50 L70 52 M30 58 L14 58', C.lava, 2.4) +
      part('M10 62 L74 62 L74 69 L10 69Z', C.rockD, { w: 2.4 }) + flame(44, 18, 0.75)
    ),
    // Plasma Jelly: a teal jelly that crackles with sparks
    plasma_jelly: wrap(
      [30, 42, 54, 66].map((x, i) => L(`M${x} 54 q${i % 2 ? 5 : -5} 10 0 20 q${i % 2 ? -4 : 4} 6 0 12`, INK, 5.6) + L(`M${x} 54 q${i % 2 ? 5 : -5} 10 0 20 q${i % 2 ? -4 : 4} 6 0 12`, C.screen, 2.8)).join('') +
      part('M18 54 C18 28 32 16 48 16 C64 16 78 28 78 54Z', C.tealL, { sh: 'M48 16 C64 16 78 28 78 54 L66 54 C66 38 60 24 48 16Z', shc: C.teal, hl: 'M25 42 Q27 28 37 22 Q31 32 31 44Z' }) +
      part('M14 50 Q14 46 18 46 L78 46 Q82 46 82 50 L82 54 Q82 58 78 58 L18 58 Q14 58 14 54Z', C.screen, { w: 2.4 }) +
      peepers(48, 34, 8.6, 4.4, 4) + smile(48, 42, 3.6) + sparkle(84, 32, 4, C.screen) + sparkle(12, 26, 3, C.screen)
    ),
    // Mini UFO: a tiny saucer piloted by a little green alien
    mini_ufo: wrap(
      `<path d="M30 70 L20 92 H76 L66 70Z" fill="${C.screen}" opacity="0.35"/>` +
      `<path d="M30 42 C30 22 66 22 66 42Z" fill="${C.blueL}" opacity="0.8"/>` +
      part(circ(48, 35, 8.4), C.green, { w: 2.2, sh: 'M52 28 A8.4 8.4 0 0 1 48 43.4 A6 8.4 0 0 0 52 28Z' }) +
      eye(45, 34, 2.6, 2.4, { r: 1.8, dx: 0.3, sw: 1.4 }) + eye(51.4, 34, 2.6, 2.4, { r: 1.8, dx: 0.3, sw: 1.4 }) +
      `<path d="M30 42 C30 22 66 22 66 42" fill="none" stroke="${INK}" stroke-width="3"/><path d="M36 32 Q38 27 43 26" fill="none" stroke="#FFF" stroke-width="2" stroke-linecap="round" opacity="0.8"/>` +
      part('M8 50 Q8 38 48 38 Q88 38 88 50 Q88 62 48 62 Q8 62 8 50Z', C.steelL, { sh: 'M8 50 Q8 62 48 62 Q88 62 88 50Z', shc: C.steel }) +
      part('M20 44 L76 44 L76 50 L20 50Z', C.steelD, { w: 2.2 }) +
      [[20, C.red], [36, C.hatY], [60, C.hatY], [76, C.red]].map(([x, c]) => part(circ(x, 55, 3.4), c, { w: 1.8 })).join('') +
      part('M34 64 Q34 59 48 59 Q62 59 62 64 Q62 69 48 69 Q34 69 34 64Z', C.steelD, { w: 2.4 })
    )
  };

  register('pet', P);
})();
