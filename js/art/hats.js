// ============================================================================
// MULTI-MINE — Alien Wardrobe: 13 unlockable hats ("Ink & Grit" style)
// Drawn to sit on the bare-headed engineer (charbare:*). The engine/UI draws
// hats ~6% higher than the body, so the head crown is at y≈29 and the brim
// line should land around y≈42–45 in this box. Keep these footprints.
// ============================================================================
(function () {
  const { C, wrap, S, register } = window.MM.Art;
  const { L, G, part, circ } = S;
  const INK = C.ink;

  // A dome cap filling the crown of the head (x 25–71), lit from the top-left
  const dome = (f, top = 18, bottom = 44, o = {}) =>
    part(`M25 ${bottom} C25 ${top + 8} 35 ${top} 48 ${top} C61 ${top} 71 ${top + 8} 71 ${bottom}Z`, f, {
      sh: `M50 ${top} C62 ${top + 1} 71 ${top + 8} 71 ${bottom} L59 ${bottom} C59 ${top + 12} 56 ${top + 4} 50 ${top}Z`,
      hl: `M30 ${bottom - 6} C30 ${top + 12} 34 ${top + 6} 40 ${top + 3} C35 ${top + 9} 34 ${top + 16} 35 ${bottom - 6}Z`,
      ...o
    });
  const starPts = (cx, cy, r) => {
    let p = 'M';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (Math.PI * i) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      p += `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} ${i < 9 ? 'L' : 'Z'}`;
    }
    return p;
  };
  const star = (cx, cy, r, f, o = {}) => part(starPts(cx, cy, r), f, { w: 2.2, ...o });
  const gem = (x, y, r, f) => part(circ(x, y, r), f, { w: 1.4 }) + `<circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.3}" fill="#FFF"/>`;

  const H = {
    neon_crown: wrap(
      part('M26 44 L24 20 L36 32 L42 14 L48 28 L54 14 L60 32 L72 20 L70 44Z', C.screen, {
        sh: 'M54 14 L60 32 L72 20 L70 44 L56 44 L58 34Z', shc: C.tealL, hl: 'M28 38 L27 26 L32 32 L31 39Z', hlo: 0.7
      }) +
      part('M24 38 L72 38 L72 46 L24 46Z', C.teal, { w: 2.4, sh: 'M56 38 L72 38 L72 46 L56 46Z' }) +
      gem(36, 42, 2.6, C.pink) + gem(48, 42, 3, C.hatY) + gem(60, 42, 2.6, C.pink)
    ),
    mushroom_cap: wrap(
      part('M14 44 C12 18 32 8 48 8 C64 8 84 18 82 44 Q48 38 14 44Z', C.pink, {
        sh: 'M50 8 C64 8 84 18 82 44 Q72 42 64 41 C66 26 60 14 50 8Z', hl: 'M20 34 Q20 20 32 13 Q25 22 26 34Z'
      }) +
      part(circ(30, 26, 5), '#F4F1EA', { w: 2 }) + part(circ(50, 16, 4.4), '#F4F1EA', { w: 2 }) +
      part(circ(67, 28, 4), '#F4F1EA', { w: 2 }) + part(circ(44, 34, 3), '#F4F1EA', { w: 1.6 })
    ),
    top_hat: wrap(
      part('M20 43 Q20 38 48 38 Q76 38 76 43 Q76 48 48 48 Q20 48 20 43Z', C.inkSoft, { w: 2.6 }) +
      part('M32 8 Q48 4 64 8 L63 43 L33 43Z', '#3A3530', { sh: 'M53 6 Q60 6 64 8 L63 43 L54 43Z', shc: '#26221F', hl: 'M36 12 L40 11 L39 30 L36 30Z', hlo: 0.3 }) +
      part('M33 31 L63 31 L63 37 L33 37Z', C.red, { w: 2, sh: 'M55 31 L63 31 L63 37 L55 37Z' })
    ),
    halo: wrap(
      `<ellipse cx="48" cy="18" rx="22" ry="6" fill="none" stroke="${INK}" stroke-width="8"/>` +
      `<ellipse cx="49" cy="19" rx="22" ry="6" fill="none" stroke="${C.hatY}" stroke-width="4.2"/>` +
      L('M30 16 q6 -3 12 -3', C.hatYL, 2) + L('M18 8 l-4 -3 M78 8 l4 -3 M48 4 v-3', INK, 2.2)
    ),
    cursed_horns: wrap(
      part('M30 40 C20 34 14 22 18 8 C24 20 30 26 38 30Z', '#F2E6D0', { sh: 'M18 8 C24 20 30 26 38 30 L34 36 C26 30 20 20 18 8Z', shc: '#C8B79A' }) +
      part('M66 40 C76 34 82 22 78 8 C72 20 66 26 58 30Z', '#F2E6D0', { sh: 'M78 8 C82 22 76 34 66 40 L64 34 C72 28 78 18 78 8Z', shc: '#C8B79A' }) +
      L('M22 22 l6 -2 M26 30 l6 -2 M74 22 l-6 -2 M70 30 l-6 -2', INK, 1.6) +
      part('M28 34 L68 34 L68 42 L28 42Z', C.purpleD, { w: 2.4 }) + gem(48, 38, 3.4, C.purpleL)
    ),
    captain_visor: wrap(
      dome('#F4F1EA', 20, 40, { shc: '#C9D3DD' }) +
      part('M32 22 L64 22 L64 30 L32 30Z', C.blueD, { w: 2 }) + star(48, 26, 3.4, C.hatY, { w: 1.2 }) +
      part('M24 40 L72 40 Q74 46 66 48 L30 48 Q22 46 24 40Z', '#2A2F3A', { hl: 'M30 42 L46 42 L44 44 L30 44Z', hlo: 0.3 })
    ),
    gold_hardhat: wrap(
      dome(C.gold, 18, 42) +
      part('M44.5 17 L51.5 17 L51.5 42 L44.5 42Z', C.hatYL, { w: 2.4 }) +
      part('M18 43 Q48 35 78 43 Q79.5 47 75 47 Q48 41 21 47 Q16.5 47 18 43Z', C.gold, { w: 2.8, sh: 'M60 41 Q70 42 78 43 Q79.5 47 75 47 Q68 45 60 44Z' }) +
      star(35, 30, 4.4, '#FFF8E6', { w: 1.6 })
    ),
    cat_ears: wrap(
      part('M24 34 L72 34 L72 43 L24 43Z', C.purple, { w: 2.6, sh: 'M56 34 L72 34 L72 43 L56 43Z' }) +
      part('M26 38 L24 12 L44 32Z', C.purple, { w: 2.8, sh: 'M24 12 L44 32 L38 36Z' }) + `<path d="M29 32 L28 19 L38 30Z" fill="${C.pink}"/>` +
      part('M70 38 L72 12 L52 32Z', C.purple, { w: 2.8, sh: 'M72 12 L70 38 L62 34Z' }) + `<path d="M67 32 L68 19 L58 30Z" fill="${C.pink}"/>`
    ),
    star_crown: wrap(
      part('M26 34 L70 34 L70 44 L26 44Z', C.gold, { w: 2.6, sh: 'M56 34 L70 34 L70 44 L56 44Z' }) +
      star(48, 20, 13, C.hatY, { w: 2.4, sh: 'M48 20 L60.4 16 L52.3 24.1 L55.6 30.5 L48 26Z' }) +
      star(30, 28, 6, C.hatYL) + star(66, 28, 6, C.hatYL) +
      gem(38, 39, 2.4, C.blue) + gem(48, 39, 2.4, C.red) + gem(58, 39, 2.4, C.blue)
    ),
    gold_visor: wrap(
      L('M25 42 Q48 30 71 42', INK, 5.4) + L('M25 42 Q48 30 71 42', C.inkSoft, 2.4) +
      part('M28 40 Q48 32 68 40 L70 52 Q48 46 26 52Z', C.gold, { sh: 'M56 37 Q63 38 68 40 L70 52 Q64 50 58 49Z' }) +
      `<path d="M32 42 Q48 36 64 42 L65 46 Q48 42 31 46Z" fill="${C.hatYL}" opacity="0.9"/>`
    ),
    wizard: wrap(
      part('M48 0 Q52 20 70 40 L26 40 Q42 22 48 0Z', C.purple, { sh: 'M48 0 Q52 20 70 40 L54 40 Q52 20 48 0Z', hl: 'M34 34 Q40 24 44 14 Q42 26 38 35Z' }) +
      part('M18 42 Q18 36 48 36 Q78 36 78 42 Q78 48 48 48 Q18 48 18 42Z', C.purple, { w: 2.6, sh: 'M48 48 Q78 48 78 42 Q72 44 48 45Z' }) +
      star(43, 24, 4, C.hatY, { w: 1.6 }) + part(circ(53, 13, 2), C.hatYL, { w: 1 }) + part(circ(39, 33, 1.8), C.hatYL, { w: 1 })
    ),
    samurai: wrap(
      part('M48 22 C40 10 30 6 22 8 C32 12 38 18 44 28Z', C.gold, { sh: 'M22 8 C32 12 38 18 44 28 L46 24 C40 16 32 10 22 8Z' }) +
      part('M48 22 C56 10 66 6 74 8 C64 12 58 18 52 28Z', C.gold, { sh: 'M74 8 C64 12 58 18 52 28 L50 24 C56 16 64 10 74 8Z' }) +
      dome(C.red, 18, 40) +
      part('M18 38 L78 38 L84 48 L12 48Z', '#3A3530', { sh: 'M60 38 L78 38 L84 48 L64 48Z', shc: '#26221F' }) + L('M17 43 H79', C.gold, 2) +
      part(circ(48, 28, 4), C.gold, { w: 2 })
    ),
    chef: wrap(
      `<g transform="translate(1.3 1.1)"><path d="M30 44 L30 30 A10 10 0 0 1 34 12 A12 12 0 0 1 62 12 A10 10 0 0 1 66 30 L66 44Z" fill="#F4F1EA"/>` +
      `<path class="sh" d="M60 6 A12 12 0 0 1 62 12 A10 10 0 0 1 66 30 L66 44 L58 44 L58 26 A10 10 0 0 0 60 6Z" fill="#C9D3DD"/></g>` +
      `<path d="M30 44 L30 30 A10 10 0 0 1 34 12 A12 12 0 0 1 62 12 A10 10 0 0 1 66 30 L66 44Z" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
      L('M30 32 H66', INK, 2.2) + L('M38 34 V42 M48 34 V42 M58 34 V42', '#B9C2CB', 2)
    )
  };

  register('hat', H);
})();
