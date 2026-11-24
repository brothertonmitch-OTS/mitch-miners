// ============================================================================
// MULTI-MINE — 20 Alien Engineers (chunky cartoon style)
//
// Ink & Grit: every engineer is a big-headed miner on a work-worn body, but
// each one mixes a head shape, a build and a pose so the silhouettes differ.
// Identity then comes from skin, suit, headgear & props.
//   char:<id>      — engineer wearing their signature headgear
//   charbare:<id>  — same engineer bare-headed (used when a wardrobe hat is on)
// ============================================================================
(function () {
  const { C, ol, wrap, glint, rivet, register } = window.MM.Art;
  const INK = C.ink;

  // ---- Body pieces -----------------------------------------------------------
  // Heads all sit in the same box (x 26–70, y 23–63) so headgear and wardrobe
  // hats still fit; the brim lands around y 40–45 and the eyes peek out below.
  const HEADS = {
    round: 'M48 23 C60.5 23 69.5 31 69.5 43 C69.5 55 60 63 48 63 C36 63 26.5 55 26.5 43 C26.5 31 35.5 23 48 23 Z',
    square: 'M27 33 C27 25 31 23 39 23 L57.5 23 C66 23 69.5 26 69.5 34 L69 53 C69 60.5 64 63 57 63 L39 63 C31.5 63 27.5 60 27.5 53 Z',
    bean: 'M31 41 C30 28 37 23 48 23 C59 23 66 28 65.5 40 C70.5 47 70 57 63.5 60.5 C58 63.5 52 64 48 64 C42 64 36 63.5 31.5 60.5 C25.5 56.5 25.5 47 31 41 Z',
    tall: 'M48 21.5 C61 21.5 67.5 31 68 44 C68.5 57 59.5 63 48 63 C36.5 63 27.5 57 28 44 C28.5 31 35 21.5 48 21.5 Z'
  };
  // cel-shade crescent on the head's lit-away (right) side
  const HEAD_SHADE = {
    round: 'M58 25.5 C65.5 29 69.5 35.5 69.5 43 C69.5 55 60 63 48 63 C57 59 61.5 51 61.5 42 C61.5 35 60.5 30 58 25.5 Z',
    square: 'M60 23.2 C66.5 24 69.5 27 69.5 34 L69 53 C69 60.5 64 63 57 63 L50 63 C58 60 62 55 62.5 47 L63 30 C63 27 62 24.5 60 23.2 Z',
    bean: 'M58 24.5 C63.5 27 66 32 65.5 40 C70.5 47 70 57 63.5 60.5 C58 63.5 52 64 48 64 C57 60 62 54 61 46 C60.5 40 61 31 58 24.5 Z',
    tall: 'M57 23.5 C64 27 67.5 34.5 68 44 C68.5 57 59.5 63 48 63 C56 59 60.5 52 60.5 43 C60.5 34 59.5 28 57 23.5 Z'
  };
  // torsos: shoulders at y 57, belt band at y 73–78, feet at y 92
  const BUILDS = {
    stocky: { d: 'M33 57 L63 57 C67.5 57.5 68.5 60 69 64 L71 80 C71.3 83 69.5 84.5 66 84.5 L30 84.5 C26.5 84.5 24.7 83 25 80 L27 64 C27.5 60 28.5 57.5 33 57 Z', sl: [31, 61], sr: [65, 61], feet: 0 },
    slim: { d: 'M37 57 L59 57 C62.5 57.3 63.5 59.5 63.7 63 L65 81.5 C65.2 83.8 63.8 84.5 61 84.5 L35 84.5 C32.2 84.5 30.8 83.8 31 81.5 L32.3 63 C32.5 59.5 33.5 57.3 37 57 Z', sl: [34, 61], sr: [62, 61], feet: -2 },
    round: { d: 'M35 57 L61 57 C69 59.5 73 65 73 72.5 C73 80.5 68 84.5 60 84.5 L36 84.5 C28 84.5 23 80.5 23 72.5 C23 65 27 59.5 35 57 Z', sl: [31, 61], sr: [65, 61], feet: 0 },
    big: { d: 'M28 57 L68 57 C73.5 57.3 75 59.5 74.5 63.5 L70 82 C69.5 84 68 84.5 65 84.5 L31 84.5 C28 84.5 26.5 84 26 82 L21.5 63.5 C21 59.5 22.5 57.3 28 57 Z', sl: [27, 61], sr: [69, 61], feet: 2 }
  };
  // arm curves per pose: [shoulder -> elbow -> hand] for left & right
  const POSES = {
    hip: (L, R) => [`M${L[0]} ${L[1]} Q${L[0] - 11} ${L[1] + 5} ${L[0] - 5} ${L[1] + 13}`, [L[0] - 4.5, L[1] + 13.5],
      `M${R[0]} ${R[1]} Q${R[0] + 7} ${R[1] + 8} ${R[0] + 6} ${R[1] + 17}`, [R[0] + 6, R[1] + 18]],
    wave: (L, R) => [`M${L[0]} ${L[1]} Q${L[0] - 7} ${L[1] + 8} ${L[0] - 6} ${L[1] + 17}`, [L[0] - 6, L[1] + 18],
      `M${R[0]} ${R[1]} Q${R[0] + 12} ${R[1] - 3} ${R[0] + 13} ${R[1] - 17}`, [R[0] + 13, R[1] - 19]],
    fists: (L, R) => [`M${L[0]} ${L[1]} Q${L[0] - 13} ${L[1] + 2} ${L[0] - 11} ${L[1] - 10}`, [L[0] - 11, L[1] - 12],
      `M${R[0]} ${R[1]} Q${R[0] + 13} ${R[1] + 2} ${R[0] + 11} ${R[1] - 10}`, [R[0] + 11, R[1] - 12]],
    point: (L, R) => [`M${L[0]} ${L[1]} Q${L[0] - 11} ${L[1] + 5} ${L[0] - 5} ${L[1] + 13}`, [L[0] - 4.5, L[1] + 13.5],
      `M${R[0]} ${R[1]} Q${R[0] + 10} ${R[1] + 1} ${R[0] + 20} ${R[1] - 4}`, [R[0] + 21, R[1] - 4.5]],
    carry: (L, R) => [`M${L[0]} ${L[1]} Q${L[0] - 7} ${L[1] + 8} ${L[0] - 5} ${L[1] + 17}`, [L[0] - 5, L[1] + 18],
      `M${R[0]} ${R[1]} Q${R[0] + 7} ${R[1] + 8} ${R[0] + 5} ${R[1] + 17}`, [R[0] + 5, R[1] + 18]]
  };

  // An arm is an ink stroke with the sleeve colour laid on top (reads as one outlined limb).
  const limb = (d, col, w = 8.5) =>
    `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 5.2}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  function eyes(kind, y = 48) {
    const L = 41;
    const R = 55;
    switch (kind) {
      case 'happy':
        return `<path d="M${L - 3.5} ${y + 1} Q${L} ${y - 4} ${L + 3.5} ${y + 1}" fill="none" ${ol(2.6)}/>
                <path d="M${R - 3.5} ${y + 1} Q${R} ${y - 4} ${R + 3.5} ${y + 1}" fill="none" ${ol(2.6)}/>`;
      case 'angry':
        return `<ellipse cx="${L}" cy="${y}" rx="3.4" ry="4.4" fill="${INK}"/><ellipse cx="${R}" cy="${y}" rx="3.4" ry="4.4" fill="${INK}"/>
                <circle cx="${L - 1}" cy="${y - 1.6}" r="1.3" fill="${C.white}"/><circle cx="${R - 1}" cy="${y - 1.6}" r="1.3" fill="${C.white}"/>
                <path d="M${L - 5} ${y - 7.5} L${L + 3.5} ${y - 4.5}" ${ol(2.8)}/><path d="M${R + 5} ${y - 7.5} L${R - 3.5} ${y - 4.5}" ${ol(2.8)}/>`;
      case 'sly':
        return `<path d="M${L - 4} ${y - 1} H${L + 4}" ${ol(2.6)}/><ellipse cx="${L}" cy="${y + 1.4}" rx="3" ry="2.4" fill="${INK}"/>
                <path d="M${R - 4} ${y - 1} H${R + 4}" ${ol(2.6)}/><ellipse cx="${R}" cy="${y + 1.4}" rx="3" ry="2.4" fill="${INK}"/>`;
      case 'glow':
        return `<ellipse cx="${L}" cy="${y}" rx="4" ry="2.8" fill="${C.screen}" ${ol(1.6)}/><ellipse cx="${R}" cy="${y}" rx="4" ry="2.8" fill="${C.screen}" ${ol(1.6)}/>`;
      default:
        return `<ellipse cx="${L + 0.8}" cy="${y}" rx="3.2" ry="4.4" fill="${INK}"/><ellipse cx="${R + 0.8}" cy="${y - 0.4}" rx="3.2" ry="4.4" fill="${INK}"/>
                <circle cx="${L}" cy="${y - 1.7}" r="1.3" fill="${C.white}"/><circle cx="${R}" cy="${y - 2.1}" r="1.3" fill="${C.white}"/>`;
    }
  }

  function mouth(kind, y = 55.5) {
    switch (kind) {
      case 'grin':
        return `<path d="M42.5 ${y - 1} Q48 ${y + 6.5} 53.5 ${y - 1} Z" fill="${INK}" ${ol(2)}/><path d="M45.5 ${y + 2.4} Q48 ${y + 4.4} 50.5 ${y + 2.4}" fill="${C.redL}"/>`;
      case 'flat':
        return `<path d="M44 ${y + 1} H52" ${ol(2.4)}/>`;
      case 'o':
        return `<ellipse cx="48" cy="${y + 1.4}" rx="2.6" ry="3" fill="${INK}"/>`;
      case 'smirk':
        return `<path d="M43.5 ${y + 1.6} Q49 ${y + 4} 53 ${y - 0.6}" fill="none" ${ol(2.4)}/>`;
      case 'frown':
        return `<path d="M43.5 ${y + 3} Q48 ${y - 1} 52.5 ${y + 3}" fill="none" ${ol(2.4)}/>`;
      default:
        return `<path d="M43.5 ${y} Q48 ${y + 4.6} 52.5 ${y}" fill="none" ${ol(2.4)}/>`;
    }
  }

  function boots(col = C.inkSoft, spread = 0, suit) {
    const l = -spread;
    const r = spread;
    return `
      <path d="M${36 + l} 80 V87 M${60 + r} 80 V87" stroke="${INK}" stroke-width="10.5" stroke-linecap="round"/>
      <path d="M${36 + l} 80 V87 M${60 + r} 80 V87" stroke="${suit}" stroke-width="6" stroke-linecap="round"/>
      <path d="M${41.5 + l} 84 L${41.5 + l} 91.5 L${27 + l} 91.5 C${26 + l} 87.5 ${28 + l} 84.5 ${33 + l} 84 Z" fill="${col}" ${ol(2.6)}/>
      <path d="M${54.5 + r} 84 L${54.5 + r} 91.5 L${69 + r} 91.5 C${70 + r} 87.5 ${68 + r} 84.5 ${63 + r} 84 Z" fill="${col}" ${ol(2.6)}/>
      <path d="M${28 + l} 89.3 H${41 + l} M${55 + r} 89.3 H${68 + r}" stroke="${C.ink}" stroke-width="1.4" opacity="0.6"/>`;
  }

  // ---- Headgear ----------------------------------------------------------------
  function hardhat(col, colD, colL, decal = '') {
    return `
      <path d="M25 39 C25 23 35 14 48 14 C61 14 71 23 71 39 Z" fill="${col}"/>
      <path d="M48 14 C61 14 71 23 71 39 H59 C59 27 55 18 48 14 Z" fill="${colD}"/>
      <path d="M25 39 C25 23 35 14 48 14 C61 14 71 23 71 39 Z" fill="none" ${ol()}/>
      <rect x="44.5" y="12.5" width="7" height="26" rx="3.5" fill="${colL}" ${ol(2.4)}/>
      ${decal}
      <path d="M18.5 40.5 Q48 32 77.5 40.5 Q79 44.5 74.5 44.5 Q48 38.5 21.5 44.5 Q17 44.5 18.5 40.5 Z" fill="${col}" ${ol(2.8)}/>
      ${glint(34, 24, 4, 1.8)}`;
  }

  const lamp = (lens = C.hatYL) => `
      <rect x="40.5" y="24" width="15" height="10" rx="3" fill="${C.steelD}" ${ol(2.2)}/>
      <circle cx="48" cy="29" r="3.4" fill="${lens}" ${ol(1.6)}/>`;

  function goggles(y = 37, lens = C.screen, band = C.inkSoft) {
    return `
      <path d="M25.5 ${y + 1} Q48 ${y - 5} 70.5 ${y + 1}" fill="none" stroke="${band}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="39.5" cy="${y}" r="7" fill="${C.steelD}" ${ol(2.4)}/><circle cx="39.5" cy="${y}" r="4.4" fill="${lens}" ${ol(1.6)}/>
      <circle cx="56.5" cy="${y}" r="7" fill="${C.steelD}" ${ol(2.4)}/><circle cx="56.5" cy="${y}" r="4.4" fill="${lens}" ${ol(1.6)}/>
      ${glint(38, y - 1.6, 1.6, 0.9)}${glint(55, y - 1.6, 1.6, 0.9)}`;
  }

  function antennae(stem, bulb, ring = false) {
    return `
      <path d="M38 27 Q33 16 29 11" fill="none" stroke="${stem}" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M58 27 Q63 16 67 11" fill="none" stroke="${stem}" stroke-width="3.4" stroke-linecap="round"/>
      <circle cx="29" cy="11" r="4.6" fill="${bulb}" ${ol(2.4)}/><circle cx="67" cy="11" r="4.6" fill="${bulb}" ${ol(2.4)}/>
      ${glint(27.6, 9.4, 1.5, 0.9)}${glint(65.6, 9.4, 1.5, 0.9)}
      ${ring ? `<ellipse cx="29" cy="11" rx="8" ry="2.6" fill="none" stroke="${C.screen}" stroke-width="1.8" transform="rotate(-20 29 11)"/>
                 <ellipse cx="67" cy="11" rx="8" ry="2.6" fill="none" stroke="${C.screen}" stroke-width="1.8" transform="rotate(20 67 11)"/>` : ''}`;
  }

  // ---- Builder -----------------------------------------------------------------
  /**
   * o: { head, build, pose, skin, skinD, suit, suitD, glove, boot, eyes, mouth,
   *      cheeks, back, belt, front, anatomy, gear, faceGear, suitTrim, wide }
   * `gear` / `faceGear` are only drawn on the helmeted (non-bare) variant.
   */
  function engineer(id, o, bare) {
    const clip = `bd-${id}${bare ? '-b' : ''}`;
    const glove = o.glove || C.steelDD;
    const head = HEADS[o.head || 'round'];
    const headSh = HEAD_SHADE[o.head || 'round'];
    const bd = BUILDS[o.build || 'stocky'];
    const [armL, handL, armR, handR] = POSES[o.pose || 'hip'](bd.sl, bd.sr);
    const inner = `
      ${o.back || ''}
      ${boots(o.boot, bd.feet, o.suitD)}
      ${limb(armL, o.suit)}
      <circle cx="${handL[0]}" cy="${handL[1]}" r="4.7" fill="${glove}" ${ol(2.6)}/>
      <clipPath id="${clip}"><path d="${bd.d}"/></clipPath>
      <path d="${bd.d}" fill="${o.suit}"/>
      <g clip-path="url(#${clip})">
        <path class="sh" d="M60 50 C70 56 76 66 74 90 L52 90 C60 80 62 66 60 50 Z" fill="${o.suitD}"/>
        ${o.suitTrim || ''}
        <path d="M37.5 57 L44 65 L46.5 57 Z M58.5 57 L52 65 L49.5 57 Z" fill="${o.suitD}" ${ol(2)}/>
        <path d="M48 63 V84" stroke="${INK}" stroke-width="1.8" opacity="0.55"/>
        <path d="M40 66 L40 72 L46 72" fill="none" stroke="${INK}" stroke-width="1.5" opacity="0.5"/>
        <rect x="0" y="73" width="96" height="5.2" fill="${C.inkSoft}"/>
        <rect x="43.5" y="71.8" width="9" height="7.6" rx="1.4" fill="${C.hatY}" ${ol(1.8)}/>
        ${o.belt || ''}
      </g>
      <path d="${bd.d}" fill="none" ${ol()}/>
      ${o.front || ''}
      <path d="${head}" fill="${o.skin}"/>
      <path class="sh" d="${headSh}" fill="${o.skinD}"/>
      <path d="${head}" fill="none" ${ol()}/>
      ${glint(36.5, 33, 3.6, 1.8)}
      ${o.anatomy || ''}
      ${eyes(o.eyes)}
      ${mouth(o.mouth)}
      ${o.cheeks === false ? '' : `<ellipse cx="34.5" cy="54.5" rx="3.2" ry="1.9" fill="${C.pink}" opacity="0.5"/><ellipse cx="61.5" cy="54.5" rx="3.2" ry="1.9" fill="${C.pink}" opacity="0.5"/>`}
      ${limb(armR, o.suit)}
      <circle cx="${handR[0]}" cy="${handR[1]}" r="4.7" fill="${glove}" ${ol(2.6)}/>
      ${bare ? '' : (o.faceGear || '')}
      ${bare ? '' : (o.gear || '')}`;
    const body = o.wide ? `<g transform="translate(48 88) scale(${o.wide} 1) translate(-48 -88)">${inner}</g>` : inner;
    return wrap(body);
  }

  // ---- Shared prop snippets ------------------------------------------------------
  const dynamite = `
      <g transform="rotate(-12 30 76)">
        <rect x="25" y="68" width="5" height="13" rx="1.5" fill="${C.red}" ${ol(1.8)}/>
        <rect x="30" y="68" width="5" height="13" rx="1.5" fill="${C.redD}" ${ol(1.8)}/>
        <path d="M30 68 Q31 63 34 62" fill="none" stroke="${INK}" stroke-width="1.6"/>
        <circle cx="34.5" cy="61.5" r="1.8" fill="${C.hatYL}"/>
      </g>`;
  const bolt = (x, y, s = 1, col = C.hatYL) =>
    `<path transform="translate(${x} ${y}) scale(${s})" d="M2 -7 L-4 1 H0 L-2 8 L4 -1 H0 Z" fill="${col}" ${ol(1.4)}/>`;
  const flame = (x, y, s = 1) =>
    `<path transform="translate(${x} ${y}) scale(${s})" d="M0 6 C-5 5 -6 0 -3 -3 C-3 0 -1 0 -1 -2 C-1 -5 1 -7 2 -8 C2 -5 5 -3 5 1 C5 4 3 6 0 6 Z" fill="${C.lava}" ${ol(1.4)}/>`;
  const gearIcon = (x, y, r, col = C.hatY) => {
    let teeth = '';
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i;
      teeth += `<rect x="${(x + Math.cos(a) * r - 1.8).toFixed(2)}" y="${(y + Math.sin(a) * r - 1.8).toFixed(2)}" width="3.6" height="3.6" fill="${col}" ${ol(1.2)} transform="rotate(${(a * 180) / Math.PI} ${(x + Math.cos(a) * r).toFixed(2)} ${(y + Math.sin(a) * r).toFixed(2)})"/>`;
    }
    return `${teeth}<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" ${ol(1.6)}/><circle cx="${x}" cy="${y}" r="${(r * 0.38).toFixed(2)}" fill="${C.inkSoft}"/>`;
  };
  const stripes = (col) => `<rect x="0" y="66" width="96" height="3.4" fill="${col}"/>`;

  // ---- The roster ----------------------------------------------------------------
  const SPECS = {
    // 1. ZORP — NASA Orbital Engineer: space suit + glass bubble helmet
    nasa: {
      head: 'round', build: 'slim', pose: 'wave',
      skin: '#79DDB0', skinD: '#4CB487', suit: '#EEF2F6', suitD: '#BFCAD6', glove: C.blue,
      suitTrim: `${stripes(C.blue)}<rect x="0" y="69.4" width="96" height="2.2" fill="${C.red}"/>`,
      back: `<rect x="19" y="52" width="58" height="26" rx="8" fill="${C.steelL}" ${ol()}/>${rivet(24, 57)}${rivet(72, 57)}
             <path d="M24 78 l-2 7 h7 l-2 -7 Z M72 78 l-2 7 h7 l-2 -7 Z" fill="${C.lavaL}" ${ol(1.6)}/>`,
      anatomy: antennae('#4CB487', C.hatY),
      front: `<rect x="53" y="61" width="11" height="8" rx="2" fill="${C.blue}" ${ol(1.8)}/><circle cx="58.5" cy="65" r="2" fill="${C.white}"/>`,
      gear: `<circle cx="48" cy="45" r="25" fill="${C.blueL}" opacity="0.22" ${ol(2.8)}/>
             <path d="M31 33 Q36 25 45 23" fill="none" stroke="${C.white}" stroke-width="3" stroke-linecap="round" opacity="0.85"/>
             <rect x="27" y="64" width="42" height="6" rx="3" fill="${C.steelL}" ${ol(2.4)}/>`
    },

    // 2. KRAK — Volcano Seismologist: heat suit + red hardhat with flame decal
    volcano: {
      head: 'square', build: 'stocky', pose: 'fists',
      skin: '#F29482', skinD: '#C9665A', suit: '#4C525E', suitD: '#363B45', glove: C.orange, eyes: 'angry', mouth: 'grin',
      suitTrim: `${stripes(C.orange)}<rect x="0" y="69.4" width="96" height="2" fill="${C.hatY}"/>`,
      belt: `<rect x="58" y="70" width="7" height="10" rx="2" fill="${C.lava}" ${ol(1.6)}/>`,
      gear: hardhat(C.red, C.redD, C.redL, `${flame(35, 30, 1.1)}${flame(61, 30, 1.1)}`)
    },

    // 3. BOLTZ — Turret Machinist: the classic orange coveralls + yellow hardhat with lamp
    turret: {
      head: 'round', build: 'stocky', pose: 'hip',
      skin: '#4DB8AE', skinD: '#338E87', suit: C.orange, suitD: C.orangeD,
      front: `<rect x="53" y="61" width="10" height="9" rx="2" fill="${C.orangeL}" ${ol(1.8)}/><path d="M56 63 v4 M60 63 v4" stroke="${INK}" stroke-width="1.6"/>`,
      belt: `<path d="M30 74 l-3 9 M34 74 l-1 9" stroke="${C.steel}" stroke-width="2.4"/>`,
      gear: hardhat(C.hatY, C.hatYD, C.hatYL, lamp())
    },

    // 4. VEX — Demolition Miner: hazard-striped hardhat + dynamite on the belt
    demo: {
      head: 'bean', build: 'slim', pose: 'point',
      skin: '#EE7397', skinD: '#C24E73', suit: C.orange, suitD: C.orangeD, mouth: 'grin', eyes: 'sly',
      belt: '',
      front: dynamite,
      gear: hardhat(C.hatY, C.hatYD, C.hatYL, `
        <path d="M29 36 L35 22 L40 22 L34 36 Z M41 36 L45 25 M53 25 L57 36 M62 36 L58 23 L62 24 L67 36 Z" fill="${INK}" opacity="0.85"/>`)
    },

    // 5. TESSA — Voltaic Grid Architect: purple hardhat with bolt, tesla coil on back
    tesla: {
      head: 'tall', build: 'slim', pose: 'wave',
      skin: '#AE90EE', skinD: '#8466C7', suit: '#3F5B8E', suitD: '#2C4268', glove: C.hatY,
      suitTrim: stripes(C.hatY),
      back: `<rect x="62" y="34" width="6" height="22" rx="2" fill="${C.steelD}" ${ol(2.2)}/>
             <circle cx="65" cy="31" r="5.5" fill="${C.purpleL}" ${ol(2.2)}/>${bolt(72, 24, 0.9)}`,
      front: bolt(58, 66, 0.8),
      gear: hardhat(C.purple, C.purpleD, C.purpleL, bolt(35, 29, 1.15))
    },

    // 6. RUMBLE — Seismic Excavator: big orange helmet + headlamp, scowling
    seismic: {
      head: 'square', build: 'big', pose: 'fists',
      skin: '#C9714F', skinD: '#9C5236', suit: '#D9A23A', suitD: '#B07F22', eyes: 'angry', mouth: 'frown', glove: C.inkSoft,
      suitTrim: `<rect x="0" y="62" width="96" height="3" fill="${INK}" opacity="0.35"/>`,
      front: `<rect x="53" y="61" width="11" height="9" rx="2" fill="${C.steelL}" ${ol(1.8)}/>${rivet(56, 63.5, 1.2)}${rivet(61, 63.5, 1.2)}`,
      gear: hardhat(C.orange, C.orangeD, C.orangeL, lamp(C.screen))
    },

    // 7. GLACIO — Cryo-Core Scientist: knit beanie + frost goggles, parka
    cryo: {
      head: 'round', build: 'round', pose: 'carry',
      skin: '#93CFF2', skinD: '#63A6D1', suit: '#E8F3FA', suitD: '#B7D3E6', glove: C.blue, mouth: 'o',
      suitTrim: `<rect x="0" y="59" width="96" height="4" fill="${C.white}" opacity="0.9"/>${stripes(C.ice)}`,
      gear: `
        <path d="M26 39 C26 22 36 15 48 15 C60 15 70 22 70 39 Z" fill="${C.blue}" ${ol()}/>
        <path d="M30 22 V39 M37 18 V39 M44 16 V39 M52 16 V39 M59 18 V39 M66 22 V39" stroke="${C.blueD}" stroke-width="2.4"/>
        <path d="M26 39 C26 22 36 15 48 15 C60 15 70 22 70 39 Z" fill="none" ${ol()}/>
        <rect x="23" y="34" width="50" height="8" rx="4" fill="${C.blueL}" ${ol(2.6)}/>
        <circle cx="48" cy="12" r="5.5" fill="${C.white}" ${ol(2.4)}/>
        ${goggles(30, C.ice)}`
    },

    // 8. FABRI — 3D-Print Roboticist: green hardhat + AR visor, teal suit
    fabricator: {
      head: 'square', build: 'slim', pose: 'point',
      skin: '#83CF6E', skinD: '#5CA54D', suit: '#2F8F8A', suitD: '#226B67', glove: C.hatY,
      suitTrim: stripes(C.hatY),
      front: `<rect x="52" y="61" width="12" height="9" rx="2" fill="${C.screen}" ${ol(1.8)}/><path d="M55 65.5 h6" stroke="${C.tealD}" stroke-width="1.6"/>`,
      faceGear: `<path d="M30 44 H66 V50 Q66 53 63 53 H33 Q30 53 30 50 Z" fill="${C.screen}" opacity="0.55" ${ol(2.4)}/>
                 <path d="M34 46.5 H44" stroke="${C.white}" stroke-width="1.8" stroke-linecap="round" opacity="0.9"/>`,
      gear: hardhat(C.green, C.greenD, C.greenL, gearIcon(48, 29, 4.2, C.hatY))
    },

    // 9. SAWYER — Industrial Salvager: backwards cap, scrap magnet, olive overalls
    salvager: {
      head: 'bean', build: 'stocky', pose: 'hip',
      skin: '#E0A65C', skinD: '#B27F3B', suit: '#6E7B3E', suitD: '#525C2C', glove: C.brown, mouth: 'smirk',
      back: `<path d="M64 40 v-10 a8 8 0 0 1 16 0 v10" fill="none" stroke="${C.red}" stroke-width="6"/>
             <path d="M64 40 v-10 a8 8 0 0 1 16 0 v10" fill="none" ${ol(1.4)}/>
             <rect x="61" y="38" width="6" height="5" fill="${C.steelL}" ${ol(1.4)}/><rect x="77" y="38" width="6" height="5" fill="${C.steelL}" ${ol(1.4)}/>`,
      front: `<rect x="31" y="62" width="10" height="8" rx="2" fill="${C.steel}" ${ol(1.6)}/>`,
      gear: `
        <path d="M27 37 C27 22 37 16 48 16 C59 16 69 22 69 37 Z" fill="${C.brown}" ${ol()}/>
        <path d="M48 16 C59 16 69 22 69 37 H58 C58 26 54 19 48 16 Z" fill="${C.brownD}"/>
        <path d="M27 37 C27 22 37 16 48 16 C59 16 69 22 69 37 Z" fill="none" ${ol()}/>
        <path d="M27 36 Q16 37 13 41 Q22 42 30 39 Z" fill="${C.brownL}" ${ol(2.4)}/>
        <circle cx="48" cy="16" r="2.6" fill="${C.brownL}" ${ol(1.6)}/>
        ${glint(37, 24, 3.4, 1.6)}`
    },

    // 10. NOVA — Quantum Gravity Engineer: orbit-ringed antennae + shades
    quantum: {
      head: 'tall', build: 'slim', pose: 'hip',
      skin: '#B793F2', skinD: '#8B68CC', suit: '#2F2B4D', suitD: '#211E38', glove: C.purpleL, mouth: 'smirk',
      suitTrim: `${stripes(C.screen)}`,
      anatomy: antennae('#8B68CC', C.screen, true),
      front: `<circle cx="58" cy="65.5" r="4.2" fill="${C.purpleL}" ${ol(1.8)}/><ellipse cx="58" cy="65.5" rx="7" ry="2" fill="none" stroke="${C.screen}" stroke-width="1.5"/>`,
      faceGear: `<path d="M32 44 H46 Q47 52 40 52 Q33 52 32 44 Z M50 44 H64 Q63 52 56 52 Q49 52 50 44 Z" fill="${INK}" ${ol(2)}/>
                 <path d="M46 45 H50" ${ol(2)}/>${glint(37, 46.5, 2.2, 1)}${glint(53, 46.5, 2.2, 1)}`
    },

    // 11. OCTO-RIG — 12-Arm Multi-Tasker: extra robotic arms holding tools
    octo: {
      head: 'round', build: 'round', pose: 'wave',
      skin: '#F2A440', skinD: '#C9822A', suit: C.steel, suitD: C.steelD, glove: C.hatY, mouth: 'grin',
      back: `
        <path d="M30 56 Q14 48 10 36" fill="none" stroke="${C.steelD}" stroke-width="5" stroke-linecap="round"/>
        <path d="M66 56 Q82 48 86 36" fill="none" stroke="${C.steelD}" stroke-width="5" stroke-linecap="round"/>
        <path d="M29 63 Q12 64 6 56" fill="none" stroke="${C.steelD}" stroke-width="5" stroke-linecap="round"/>
        <path d="M67 63 Q84 64 90 56" fill="none" stroke="${C.steelD}" stroke-width="5" stroke-linecap="round"/>
        <circle cx="10" cy="35" r="4.5" fill="${C.hatY}" ${ol(2.2)}/><circle cx="86" cy="35" r="4.5" fill="${C.hatY}" ${ol(2.2)}/>
        <circle cx="6" cy="55" r="4.5" fill="${C.red}" ${ol(2.2)}/><circle cx="90" cy="55" r="4.5" fill="${C.red}" ${ol(2.2)}/>`,
      front: `${rivet(56, 64)}${rivet(62, 64)}`,
      gear: hardhat(C.hatY, C.hatYD, C.hatYL, `<text x="48" y="33" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="10" fill="${INK}">12</text>`)
    },

    // 12. MOCHI — Alien Beast-Tamer: cat-ear beanie, paw-print badge
    mochi: {
      head: 'round', build: 'round', pose: 'wave',
      skin: '#F7B8CB', skinD: '#D58DA5', suit: '#56C2B4', suitD: '#3C9B8F', glove: C.white, eyes: 'happy',
      front: `<circle cx="58" cy="66" r="3" fill="${C.pinkD}"/><circle cx="54.5" cy="62" r="1.4" fill="${C.pinkD}"/><circle cx="58" cy="61" r="1.4" fill="${C.pinkD}"/><circle cx="61.5" cy="62" r="1.4" fill="${C.pinkD}"/>`,
      gear: `
        <path d="M28 26 L26 9 L40 19 Z" fill="${C.hatY}" ${ol(2.6)}/><path d="M29.5 22 L28.5 13 L36 18.5 Z" fill="${C.pink}"/>
        <path d="M68 26 L70 9 L56 19 Z" fill="${C.hatY}" ${ol(2.6)}/><path d="M66.5 22 L67.5 13 L60 18.5 Z" fill="${C.pink}"/>
        <path d="M26 40 C26 23 36 16 48 16 C60 16 70 23 70 40 Z" fill="${C.hatY}" ${ol()}/>
        <path d="M48 16 C60 16 70 23 70 40 H59 C59 27 55 19 48 16 Z" fill="${C.hatYD}"/>
        <path d="M26 40 C26 23 36 16 48 16 C60 16 70 23 70 40 Z" fill="none" ${ol()}/>
        <rect x="23.5" y="35" width="49" height="7" rx="3.5" fill="${C.hatYL}" ${ol(2.4)}/>
        ${glint(36, 24, 3.6, 1.6)}`
    },

    // 13. ZENON — Pacifist Shield-Tech: white hardhat with shield emblem
    zenon: {
      head: 'round', build: 'slim', pose: 'carry',
      skin: '#9CD8F5', skinD: '#6DB0D6', suit: '#F2F5F8', suitD: '#C7D1DB', glove: C.blue, eyes: 'happy',
      suitTrim: stripes(C.blue),
      front: `<path d="M58 60.5 L64 63 V67 Q64 71 58 73 Q52 71 52 67 V63 Z" fill="${C.blue}" ${ol(1.8)}/>`,
      gear: hardhat('#F4F7FA', '#C9D3DD', C.blueL, `<path d="M48 22.5 L55 25.5 V30 Q55 34.5 48 36.5 Q41 34.5 41 30 V25.5 Z" fill="${C.blue}" ${ol(1.8)}/>`)
    },

    // 14. HEXX — Cursed Relic Hunter: explorer pith helmet with cursed gem
    hexx: {
      head: 'tall', build: 'slim', pose: 'point',
      skin: '#9070CF', skinD: '#6A4FA6', suit: '#8A6A45', suitD: '#674E31', glove: C.brownD, eyes: 'sly', mouth: 'smirk',
      belt: `<circle cx="32" cy="76" r="3.6" fill="${C.purpleL}" ${ol(1.6)}/>`,
      front: `<path d="M57 60 L62 65 L57 71 L52 65 Z" fill="${C.purple}" ${ol(1.8)}/>`,
      gear: `
        <ellipse cx="48" cy="38.5" rx="30" ry="6" fill="#D9C08A" ${ol(2.8)}/>
        <path d="M27 38 C27 21 37 13 48 13 C59 13 69 21 69 38 Z" fill="#E8D29C" ${ol()}/>
        <path d="M48 13 C59 13 69 21 69 38 H58 C58 25 54 16 48 13 Z" fill="#C9AE73"/>
        <path d="M27 38 C27 21 37 13 48 13 C59 13 69 21 69 38 Z" fill="none" ${ol()}/>
        <rect x="27" y="31" width="42" height="5" fill="${C.brownD}"/>
        <path d="M48 26 L53 31 L48 37 L43 31 Z" fill="${C.purpleL}" ${ol(1.8)}/>
        ${glint(36, 21, 3.4, 1.6)}`
    },

    // 15. VEXIS — Void Assassin: dark hood, glowing eyes
    phantom: {
      head: 'tall', build: 'slim', pose: 'carry',
      skin: '#6E5E96', skinD: '#4E4170', suit: '#2B2738', suitD: '#1E1B28', glove: C.purple, eyes: 'glow', mouth: 'flat', cheeks: false,
      suitTrim: `<path d="M0 66 H96" stroke="${C.purpleL}" stroke-width="2"/>`,
      front: `<path d="M56 61 L62 61 L58 72 Z" fill="${C.purpleL}" ${ol(1.6)}/>`,
      gear: `
        <path d="M22 60 C20 40 26 22 38 15 L48 5 L58 15 C70 22 76 40 74 60 L66 58 C68 44 62 32 48 32 C34 32 28 44 30 58 Z" fill="#3A3350" ${ol()}/>
        <path d="M48 5 L58 15 C70 22 76 40 74 60 L66 58 C68 44 62 32 48 32 Z" fill="#2A2440"/>
        <path d="M22 60 C20 40 26 22 38 15 L48 5 L58 15 C70 22 76 40 74 60 L66 58 C68 44 62 32 48 32 C34 32 28 44 30 58 Z" fill="none" ${ol()}/>
        <path d="M30 56 Q48 64 66 56 L66 60 Q48 68 30 60 Z" fill="#3A3350" ${ol(2.2)}/>`
    },

    // 16. BRAKK — Colossus Juggernaut: heavy steel helm with visor slit, armored & wide
    titan: {
      head: 'square', build: 'big', pose: 'fists',
      skin: '#DC7A52', skinD: '#AE5A39', suit: C.steelD, suitD: C.steelDD, glove: C.orange, eyes: 'angry', mouth: 'grin', wide: 1.06,
      suitTrim: `${rivet(30, 63)}${rivet(66, 63)}<rect x="0" y="66" width="96" height="3" fill="${C.orange}"/>`,
      back: `<rect x="14" y="52" width="16" height="13" rx="5" fill="${C.steel}" ${ol()}/><rect x="66" y="52" width="16" height="13" rx="5" fill="${C.steel}" ${ol()}/>`,
      gear: `
        <path d="M24 42 C24 22 35 12 48 12 C61 12 72 22 72 42 L66 44 H30 Z" fill="${C.steel}" ${ol()}/>
        <path d="M48 12 C61 12 72 22 72 42 L66 44 H58 C59 30 55 18 48 12 Z" fill="${C.steelD}"/>
        <path d="M24 42 C24 22 35 12 48 12 C61 12 72 22 72 42 L66 44 H30 Z" fill="none" ${ol()}/>
        <rect x="33" y="33" width="30" height="5" rx="2.5" fill="${C.lava}" ${ol(2)}/>
        <path d="M45 12 L48 4 L51 12 Z" fill="${C.orange}" ${ol(2)}/>
        ${rivet(29, 38)}${rivet(67, 38)}${glint(35, 22, 3.6, 1.6)}`
    },

    // 17. BLIB — Bio-Slime Alchemist: lab coat, chem goggles, bubbling flask
    alchemist: {
      head: 'bean', build: 'round', pose: 'hip',
      skin: '#5FDDB4', skinD: '#3DB08B', suit: '#F2F4F6', suitD: '#C7CDD4', glove: C.green, mouth: 'grin',
      front: `<path d="M55 60 h6 v4 l4 8 q1 3 -2 3 h-10 q-3 0 -2 -3 l4 -8 Z" fill="${C.white}" ${ol(1.8)}/>
              <path d="M53.4 69 h11.2 l1 3 q1 3 -2 3 h-9.2 q-3 0 -2 -3 Z" fill="${C.greenL}"/>
              <circle cx="58" cy="66" r="1.3" fill="${C.greenL}"/>`,
      gear: goggles(34, C.greenL, C.green)
    },

    // 18. KESTREL — Orbital Marksman: headset + scope monocle, camo
    sniper: {
      head: 'square', build: 'slim', pose: 'point',
      skin: '#72C9DB', skinD: '#4C9FB2', suit: '#64703F', suitD: '#4A5430', glove: C.inkSoft, eyes: 'sly', mouth: 'flat',
      suitTrim: `<path d="M8 64 q8 -4 14 0 t14 0 M44 76 q8 -4 14 0 M60 64 q8 -4 14 0" fill="none" stroke="#4A5430" stroke-width="4"/>`,
      gear: `
        <path d="M27 42 C25 24 36 17 48 17 C60 17 71 24 69 42" fill="none" stroke="${C.inkSoft}" stroke-width="5"/>
        <rect x="21" y="38" width="9" height="13" rx="4" fill="${C.steelD}" ${ol(2.4)}/>
        <rect x="66" y="38" width="9" height="13" rx="4" fill="${C.steelD}" ${ol(2.4)}/>
        <path d="M27 49 Q30 57 40 57" fill="none" stroke="${C.inkSoft}" stroke-width="2.2"/><circle cx="41" cy="57" r="2" fill="${C.red}"/>
        <circle cx="55" cy="48" r="7.5" fill="${C.steelD}" ${ol(2.4)}/><circle cx="55" cy="48" r="4.8" fill="${C.red}" opacity="0.8" ${ol(1.6)}/>
        <path d="M55 44.5 V51.5 M51.5 48 H58.5" stroke="${C.white}" stroke-width="1.2"/>`
    },

    // 19. TICK — Chrono-Clockwork: brass top hat with gear, clock badge
    chrono: {
      head: 'round', build: 'stocky', pose: 'hip',
      skin: '#E8C66C', skinD: '#BE9D46', suit: '#7A5235', suitD: '#5A3B25', glove: C.goldD, eyes: 'happy',
      front: `<circle cx="58" cy="65.5" r="5" fill="${C.white}" ${ol(1.8)}/><path d="M58 62.5 V65.5 L60.5 67" fill="none" ${ol(1.4)}/>`,
      gear: `
        <ellipse cx="48" cy="37" rx="22" ry="4.5" fill="#4A3426" ${ol(2.6)}/>
        <rect x="33" y="10" width="30" height="27" rx="3" fill="#5A3E2C" ${ol()}/>
        <rect x="33" y="27" width="30" height="5" fill="${C.goldD}" ${ol(1.6)}/>
        ${gearIcon(56, 19, 4.6, C.gold)}
        ${glint(38, 16, 2.4, 1.2, -80)}`
    },

    // 20. ZYRX — Hive Overlord: royal crown + antennae, regal purple suit
    overlord: {
      head: 'tall', build: 'big', pose: 'wave',
      skin: '#D872E8', skinD: '#AC4ABD', suit: '#5A2F86', suitD: '#432165', glove: C.gold, eyes: 'sly', mouth: 'smirk',
      suitTrim: `<rect x="0" y="59" width="96" height="4" fill="${C.gold}"/>`,
      anatomy: antennae('#AC4ABD', C.screen),
      front: `<circle cx="58" cy="66" r="3.6" fill="${C.screen}" ${ol(1.8)}/>`,
      gear: `
        <path d="M30 35 L28 18 L37 26 L42 14 L48 24 L54 14 L59 26 L68 18 L66 35 Z" fill="${C.gold}" ${ol(2.6)}/>
        <path d="M48 24 L54 14 L59 26 L68 18 L66 35 H48 Z" fill="${C.goldD}"/>
        <path d="M30 35 L28 18 L37 26 L42 14 L48 24 L54 14 L59 26 L68 18 L66 35 Z" fill="none" ${ol(2.6)}/>
        <rect x="29" y="32" width="38" height="6" rx="2" fill="${C.goldD}" ${ol(2.2)}/>
        <circle cx="48" cy="29" r="3" fill="${C.screen}" ${ol(1.4)}/>`
    }
  };
  // Blib's slime drip on the crown of the head
  SPECS.alchemist.anatomy = `<path d="M33 24 Q29.5 31 33 33.5 Q36.5 31 33 24 Z" fill="#5FDDB4" ${ol(1.8)}/>`;

  const full = {};
  const bare = {};
  Object.keys(SPECS).forEach((id) => {
    full[id] = engineer(id, SPECS[id], false);
    bare[id] = engineer(id, SPECS[id], true);
  });
  register('char', full);
  register('charbare', bare);
})();
