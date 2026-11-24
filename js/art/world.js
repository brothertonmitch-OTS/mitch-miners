// ============================================================================
// MULTI-MINE — Arena props (breakables & scenery) and FX stamps
// "Ink & Grit" style: hand-inked shapes, off-register colour, hatched shadow.
// ============================================================================
(function () {
  const { C, wrap, rivet, S, register } = window.MM.Art;
  const { L, G, flame, flake, hazard, part, circ, eye } = S;
  const INK = C.ink;

  const shard = (x, y, rot, s, f, fD) =>
    G(`translate(${x} ${y}) rotate(${rot}) scale(${s})`,
      part('M0 -54 L12 -38 L10 0 L-10 0 L-12 -38Z', f, { sh: 'M0 -54 L12 -38 L10 0 L2 0 L4 -40Z', shc: fD, hl: 'M-7 -36 L-3 -46 L-3 -8 L-7 -8Z', hlo: 0.7 }) +
      L('M0 -54 L4 -40 L2 0', INK, 1.4));
  const shardCluster = (f, fD) =>
    part('M14 84 Q16 76 30 76 L66 76 Q82 76 82 84 Q82 90 48 90 Q14 90 14 84Z', C.rockD, { w: 2.6 }) +
    shard(30, 80, -18, 0.8, f, fD) + shard(66, 80, 16, 0.85, f, fD) + shard(48, 82, 0, 1.15, f, fD);

  const PROPS = {
    volcano: wrap(
      part('M8 84 L32 38 Q48 32 64 38 L88 84Z', C.rock, { sh: 'M52 36 Q60 36 64 38 L88 84 L62 84 Q62 56 52 36Z', hl: 'M18 76 L32 46 L34 48 L22 76Z' }) +
      part('M32 38 Q48 30 64 38 Q48 44 32 38Z', C.lava, { w: 2.6 }) +
      part('M38 40 Q34 56 28 64 Q38 60 42 42Z M58 40 Q62 54 68 62 Q58 60 54 42Z', C.lava, { w: 2 }) +
      L('M22 70 l6 -4 M70 72 l-5 -5', INK, 1.6) + flame(48, 26, 1.15)
    ),
    crystal_mint: wrap(shardCluster(C.mint, C.mintD)),
    crystal_ice: wrap(shardCluster(C.crystal, C.crystalD)),
    quantum_cube: wrap(
      `<ellipse cx="48" cy="84" rx="26" ry="6" fill="${INK}" opacity="0.3"/>` +
      part('M48 14 L78 30 L48 46 L18 30Z', C.purpleL, { w: 0 }) + part('M18 30 L48 46 L48 80 L18 64Z', C.purple, { w: 0 }) +
      part('M78 30 L48 46 L48 80 L78 64Z', C.purpleD, { w: 0, sh: 'M78 30 L48 46 L48 80 L78 64Z' }) +
      L('M48 14 L78 30 L78 64 L48 80 L18 64 L18 30Z M18 30 L48 46 L78 30 M48 46 V80', INK, 2.8) +
      part(circ(48, 30, 5), C.screen, { w: 2 }) + L('M26 38 L26 56 M34 42 L34 62', '#FFF8E6', 1.6)
    ),
    conveyor: wrap(
      part('M21 36 L75 36 Q90 36 90 51 Q90 66 75 66 L21 66 Q6 66 6 51 Q6 36 21 36Z', C.inkSoft) +
      [20, 34, 48, 62, 76].map((x) => L(`M${x} 40 l6 11 l-6 11`, C.steelD, 3)).join('') +
      part(circ(21, 51, 11), C.steelD, { w: 2.6, sh: 'M25 41 A11 11 0 0 1 21 62 A8 11 0 0 0 25 41Z' }) +
      part(circ(75, 51, 11), C.steelD, { w: 2.6, sh: 'M79 41 A11 11 0 0 1 75 62 A8 11 0 0 0 79 41Z' }) +
      part(circ(21, 51, 3), C.steelL, { w: 1.6 }) + part(circ(75, 51, 3), C.steelL, { w: 1.6 }) +
      part('M36 20 L60 19 L61 38 L36 38Z', C.brownL, { w: 2.4, sh: 'M52 19 L60 19 L61 38 L54 38Z', shc: C.brown }) + L('M36 29 H61 M48 19.5 V38', C.brownD, 2)
    ),
    drill_rig: wrap(
      L('M26 84 L42 18 M70 84 L54 18 M32 60 H64 M36 40 H60', INK, 7.4) + L('M26 84 L42 18 M70 84 L54 18 M32 60 H64 M36 40 H60', C.hatY, 3.4) +
      part('M38 10 L58 10 L58 22 L38 22Z', C.red, { w: 2.6, sh: 'M51 10 L58 10 L58 22 L51 22Z' }) +
      part('M44 22 L52 22 L52 62 L44 62Z', C.steelD, { w: 2.2 }) +
      part('M42 62 L54 62 L48 82Z', C.steelL, { w: 2.4, sh: 'M48 62 L54 62 L48 82Z', shc: C.steelD }) +
      part('M16 80 L80 80 L80 88 L16 88Z', C.steelD, { w: 2.4 }) + rivet(22, 84) + rivet(74, 84)
    ),
    ore_vein: wrap(
      part('M10 76 C6 50 22 28 46 26 C70 24 90 44 86 72 Q48 88 10 76Z', C.rock, {
        sh: 'M48 26 C70 24 90 44 86 72 Q72 78 60 80 C74 60 70 36 48 26Z', hl: 'M17 62 Q18 44 30 34 Q24 48 24 62Z'
      }) +
      [[30, 46, 7.4], [54, 40, 8.4], [64, 60, 6.4], [38, 64, 5.4]].map(([x, y, r]) =>
        part(`M${x} ${y - r} L${x + r} ${y} L${x} ${y + r} L${x - r} ${y}Z`, C.hatY, { w: 2.2, sh: `M${x} ${y - r} L${x + r} ${y} L${x} ${y + r}Z` }) +
        `<circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.22}" fill="#FFF"/>`).join('') +
      L('M20 70 l7 -2 M76 52 l-5 4', INK, 1.6)
    ),
    explosive_barrel: wrap(
      part('M26 80 Q26 88 48 88 Q70 88 70 80Z', C.redD, { w: 2.6 }) +
      part('M26 20 L70 20 L71 81 L25 81Z', C.red, { sh: 'M56 20 L70 20 L71 81 L58 81 Q61 50 56 20Z', hl: 'M30 26 L35 26 L34 74 L30 74Z' }) +
      part('M26 20 Q26 14 48 14 Q70 14 70 20 Q70 26 48 26 Q26 26 26 20Z', C.redL, { w: 2.6 }) +
      part('M24 34 L72 34 L72 39 L24 39Z', C.steelD, { w: 2 }) + part('M24 62 L72 62 L72 67 L24 67Z', C.steelD, { w: 2 }) +
      part('M48 42 L58 58 L38 58Z', C.hatY, { w: 2.2 }) + L('M48 47 V52', INK, 2.4) + `<circle cx="48" cy="55" r="1.2" fill="${INK}"/>`
    ),
    loot_pinata: wrap(
      L('M48 4 V14', INK, 2.4) +
      `<clipPath id="pnClip"><path d="M18 24 Q18 14 28 14 L68 14 Q78 14 78 24 L78 70 Q78 80 68 80 L28 80 Q18 80 18 70Z"/></clipPath>` +
      `<g clip-path="url(#pnClip)" transform="translate(1.3 1.1)">` +
      [C.pink, C.blue, C.green, C.orange, C.purple].map((c, i) => `<path d="M0 ${14 + i * 13.2} L96 ${12 + i * 13.2} L96 ${26 + i * 13.2} L0 ${28 + i * 13.2}Z" fill="${c}"/>`).join('') +
      `<path class="sh" d="M64 0 H96 V96 H66 Q72 50 64 0Z" fill="${S.dk('#B98A3A')}" opacity="0.5"/></g>` +
      `<path d="M18 24 Q18 14 28 14 L68 14 Q78 14 78 24 L78 70 Q78 80 68 80 L28 80 Q18 80 18 70Z" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
      eye(36, 40, 4.6, 4.2, { r: 3.4, dx: 0.5 }) + eye(60, 40, 4.6, 4.2, { r: 3.4, dx: 0.5 }) +
      L('M38 55 Q48 63 58 55', INK, 2.6) +
      part('M26 80 L36 80 L36 90 L26 90Z', C.hatYD, { w: 2.4 }) + part('M60 80 L70 80 L70 90 L60 90Z', C.hatYD, { w: 2.4 })
    ),
    neon_shroom: wrap(
      part('M40 46 L56 46 L57 84 L39 84Z', '#F2E6D0', { sh: 'M50 46 L56 46 L57 84 L51 84Z', shc: '#D6C6A8' }) +
      part('M10 50 C10 22 30 10 48 10 C66 10 86 22 86 50 Q48 42 10 50Z', C.purple, {
        sh: 'M50 10 C66 10 86 22 86 50 Q74 47 64 46 C68 30 60 16 50 10Z', hl: 'M16 40 Q17 24 30 16 Q22 28 22 40Z'
      }) +
      part(circ(30, 30, 5), C.screen, { w: 2 }) + part(circ(52, 20, 4), C.screen, { w: 2 }) + part(circ(68, 34, 4.4), C.screen, { w: 2 })
    ),
    neon_fern: wrap(
      [[-34, C.green], [-12, C.greenL], [12, C.green], [34, C.greenD]].map(([rot, f]) =>
        G(`rotate(${rot} 48 84)`, part('M48 84 C40 60 40 34 48 12 C56 34 56 60 48 84Z', f, { sh: 'M48 12 C56 34 56 60 48 84Z', shc: S.dk(f) }) +
          L('M48 80 V20 M48 40 l-5 -6 M48 56 l5 -6 M48 66 l-5 -5', S.dk(f), 1.6))).join('') +
      part('M30 84 Q30 79 48 79 Q66 79 66 84 Q66 89 48 89 Q30 89 30 84Z', C.rockD, { w: 2.4 })
    )
  };

  // ---- FX stamps (drawn scaled/rotated by the engine) -------------------------
  // Hand-cut bursts: every point jittered a little so they read as inked.
  const burstPath = (n, rOut, rIn, seed, cx = 48, cy = 48) => {
    let s = seed;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a = (Math.PI * i) / n - Math.PI / 2 + (rnd() - 0.5) * 0.18;
      const r = (i % 2 ? rIn : rOut) * (0.88 + rnd() * 0.22);
      d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)} `;
    }
    return d + 'Z';
  };
  const FX = {
    blast_star: wrap(
      part(burstPath(9, 46, 26, 3), C.lava, { w: 3 }) + part(burstPath(9, 32, 18, 7), C.hatY, { w: 0 }) +
      part(circ(48, 48, 11), '#FFF8E6', { w: 0 })
    ),
    cryo_burst: wrap(
      part(burstPath(6, 46, 20, 5), C.ice, { w: 3 }) + part(burstPath(6, 30, 14, 9), '#F4F9FF', { w: 0 }) +
      flake(48, 48, 12, C.blue)
    ),
    volt_spark: wrap(
      part(burstPath(7, 44, 14, 11), C.purpleL, { w: 3 }) + part(burstPath(7, 28, 10, 13), C.hatYL, { w: 0 }) +
      part(circ(48, 48, 7), '#FFF8E6', { w: 0 })
    ),
    seismic_crack: wrap(
      part(burstPath(8, 46, 16, 17), C.rockD, { w: 3 }) +
      L('M48 48 L20 30 M48 48 L80 26 M48 48 L84 64 M48 48 L26 78 M48 48 L52 8', INK, 5.6) +
      L('M48 48 L20 30 M48 48 L80 26 M48 48 L84 64 M48 48 L26 78 M48 48 L52 8', C.hatY, 2.8) +
      part(circ(48, 48, 10), C.hatYL, { w: 2.4 })
    ),
    smoke_puff: wrap(
      part(circ(32, 56, 18), '#C9C2B6', { w: 2.6, sh: 'M36 39 A18 18 0 0 1 32 74 A14 18 0 0 0 36 39Z' }) +
      part(circ(64, 56, 18), '#AFA79B', { w: 2.6, sh: 'M68 39 A18 18 0 0 1 64 74 A14 18 0 0 0 68 39Z' }) +
      part(circ(48, 40, 22), '#E4DED3', { w: 2.6, hl: 'M34 36 Q36 26 46 22 Q40 30 40 38Z', hlo: 0.8 })
    ),
    warn_badge: wrap(
      part('M48 8 L90 82 L6 82Z', C.hatY, { w: 3.4, sh: 'M48 8 L90 82 L56 82 Q58 40 48 8Z' }) +
      part('M43 32 Q43 28 48 28 Q53 28 53 32 L51 58 L45 58Z', INK, { w: 0 }) + part(circ(48, 69, 5.5), INK, { w: 0 })
    )
  };

  register('prop', PROPS);
  register('fx', FX);
})();
