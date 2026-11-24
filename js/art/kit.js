// ============================================================================
// MULTI-MINE — Art Kit: chunky cartoon palette, SVG helpers, sprite registry
// and the offscreen canvas baker used by the engine.
//
// Style: "Ink & Grit", a hand-inked mining field guide.
//   • thick warm-black ink outlines, thicker on the outer silhouette (bake rim)
//   • flat earthy fills + one cel-shade tone on the lower-right, pen-hatched
//   • every sprite gets a slight hand-drawn wobble (see inkify below)
// ============================================================================
window.MM = window.MM || {};

(function () {
  // ---- Palette -------------------------------------------------------------
  // "Ink & Grit" palette: earthy, slightly dusty tones under warm black ink.
  const C = {
    ink: '#1E1A17', // outline colour
    inkSoft: '#3A322C',
    white: '#FFFFFF',

    steelL: '#C3C6BF', steel: '#9A9D96', steelD: '#6C6F6A', steelDD: '#4C4E4B',
    panel: '#3E4644', panelD: '#2C3331',
    teal: '#3E8A80', tealD: '#2A635C', tealL: '#6FB5A8', screen: '#8FE3D2',

    hatY: '#E8B52E', hatYD: '#B98614', hatYL: '#F5D676',
    orange: '#D9692B', orangeD: '#A4471B', orangeL: '#EE9457',
    red: '#C9433A', redD: '#8E2A25', redL: '#E57766',
    lava: '#F2662A', lavaL: '#FFB060',
    gold: '#E0AE35', goldD: '#A87A16',
    green: '#6FA84F', greenD: '#4A7A35', greenL: '#A3CC7A',
    mint: '#5CC09A', mintD: '#3B8D6F',
    blue: '#4C8FC4', blueD: '#2F638F', blueL: '#9CC6E6',
    ice: '#B4E0EE', iceD: '#79B7CC',
    purple: '#8C68C4', purpleD: '#5E438F', purpleL: '#BCA3E3',
    pink: '#E07D9C', pinkD: '#AE5470',
    crystal: '#4FC7C0', crystalD: '#2A8580',
    brown: '#8A5A35', brownD: '#5C3A21', brownL: '#B8875A',
    rock: '#6E6259', rockD: '#4A403A', rockL: '#8F8378'
  };

  // Dark "cel-shade" tones: unstroked shapes in these colours get pen hatching.
  const SHADE_KEYS = ['steelD', 'steelDD', 'panelD', 'tealD', 'hatYD', 'orangeD', 'redD', 'goldD', 'greenD', 'mintD',
    'blueD', 'iceD', 'purpleD', 'pinkD', 'crystalD', 'brownD', 'rockD'];

  // Common stroke attribute strings
  const SW = 3; // standard outline width on a 96x96 viewBox
  const ol = (w = SW) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

  function wrap(inner, vb = '0 0 96 96') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="96" height="96">${inner}</svg>`;
  }

  // Small reusable bits -------------------------------------------------------
  // highlight: a short pen-stroke of light instead of a glossy plastic blob
  const glint = (x, y, rx = 3, ry = 1.6, rot = -25) =>
    `<path d="M${x - rx} ${y + ry * 0.4} Q${x} ${y - ry * 1.2} ${x + rx} ${y - ry * 0.2}" transform="rotate(${rot} ${x} ${y})" fill="none" stroke="#FFF8E6" stroke-width="${Math.max(1.2, ry * 1.1).toFixed(2)}" stroke-linecap="round" opacity="0.8"/>`;
  const rivet = (x, y, r = 1.8) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.steelL}" stroke="${C.ink}" stroke-width="1.2"/>`;

  // ---- Shape shorthands (outlined unless sw === 0) ---------------------------
  const st = (sw) => (sw ? ` ${ol(sw)}` : '');
  // Outlined shapes are printed "off register": the colour sits a touch
  // down-right of the ink line, like a cheaply printed comic. The colour copy
  // is tagged data-f so the ink pass never mistakes it for a shade shape.
  const inked = (el, f, sw) => {
    if (!sw) return `${el} fill="${f}"/>`;
    if (f === 'none') return `${el} fill="none"${st(sw)}/>`;
    return `<g transform="translate(1.1 0.9)">${el} fill="${f}" data-f="1"/></g>${el} fill="none"${st(sw)}/>`;
  };
  const S = {
    R: (x, y, w, h, rx, f, sw = SW) => inked(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"`, f, sw),
    Ci: (cx, cy, r, f, sw = SW) => inked(`<circle cx="${cx}" cy="${cy}" r="${r}"`, f, sw),
    E: (cx, cy, rx, ry, f, sw = SW, rot = 0) =>
      inked(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}`, f, sw),
    Pa: (d, f, sw = SW) => inked(`<path d="${d}"`, f, sw),
    Po: (pts, f, sw = SW) => inked(`<polygon points="${pts}"`, f, sw),
    L: (d, col = C.ink, w = SW) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`,
    // add an opacity attribute to a single-element SVG string
    op: (svg, o) => `<g opacity="${o}">${svg}</g>`,
    G: (tr, inner) => `<g transform="${tr}">${inner}</g>`,
    // little lightning bolt / flame / snowflake / spark motifs
    bolt: (x, y, s = 1, f = C.hatYL) => `<path transform="translate(${x} ${y}) scale(${s})" d="M2 -7 L-4 1 H0 L-2 8 L4 -1 H0 Z" fill="${f}" ${ol(1.4)}/>`,
    flame: (x, y, s = 1, f = C.lava, core = C.lavaL) =>
      `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 9 C-8 8 -9 0 -5 -5 C-5 0 -2 0 -2 -3 C-2 -8 2 -11 3 -12 C3 -7 8 -4 8 2 C8 6 4 9 0 9 Z" fill="${f}" ${ol(1.6)}/><path d="M0 7 C-3 7 -4 3 -2 0 C-1 2 1 2 1 -1 C3 1 4 3 3 5 C2 7 1 7 0 7 Z" fill="${core}"/></g>`,
    flake: (x, y, r, col = C.white) =>
      `<g stroke="${col}" stroke-width="2.2" stroke-linecap="round"><path d="M${x} ${y - r} V${y + r} M${x - r * 0.87} ${y - r / 2} L${x + r * 0.87} ${y + r / 2} M${x - r * 0.87} ${y + r / 2} L${x + r * 0.87} ${y - r / 2}"/></g>`,
    hazard: (x, y, w, h) => {
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.hatY}"/>`;
      for (let i = -h; i < w; i += 8) s += `<path d="M${x + i} ${y + h} L${x + i + h} ${y} H${x + i + h + 4} L${x + i + 4} ${y + h} Z" fill="${C.ink}"/>`;
      return `<g><clipPath id="hz${x}_${y}_${w}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#hz${x}_${y}_${w})">${s}</g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" ${ol(2)}/></g>`;
    }
  };

  // ---- Ink & Grit building blocks ------------------------------------------
  // part(): one hand-inked shape. The colour is printed a touch off the line
  // (down-right), with an optional hatched shadow side (sh) and a light
  // highlight (hl). Pass w: 0 for no outline.
  const DARK = '#3A2414';
  const hx2 = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, t) => '#' + hx2(a).map((v, i) => Math.round(v + (hx2(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
  const dk = (c, t = 0.36) => mix(c, DARK, t);
  const circ = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
  S.mix = mix;
  S.dk = dk;
  S.circ = circ;
  S.part = (d, f, o = {}) => {
    const w = o.w === undefined ? 3 : o.w;
    let s = `<g transform="translate(1.3 1.1)"><path d="${d}" fill="${f}"/>`;
    if (o.sh) s += `<path class="sh" d="${o.sh}" fill="${o.shc || dk(f)}"/>`;
    if (o.hl) s += `<path d="${o.hl}" fill="#FFF8E6" opacity="${o.hlo || 0.55}"/>`;
    s += '</g>';
    if (w) s += `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
    return s;
  };
  // an inked limb: thick ink stroke with a coloured core
  S.limb = (d, col, w = 3.2) => S.L(d, C.ink, w + 3.4) + S.L(d, col, w);
  // almond eye with pupil + shine; col = white of the eye (or a glow colour)
  S.eye = (x, y, w = 5, h = 3.4, o = {}) => {
    const d = `M${x - w} ${y} Q${x} ${y - h * 2} ${x + w} ${y} Q${x} ${y + h * 1.7} ${x - w} ${y}Z`;
    let s = `<path d="${d}" fill="${o.col || '#F4EEDC'}" stroke="${C.ink}" stroke-width="${o.sw || 2}" stroke-linejoin="round"/>`;
    if (o.pupil !== false) {
      const r = o.r || Math.min(w, h) * 0.62;
      const px = x + (o.dx === undefined ? 0.8 : o.dx);
      s += o.slit
        ? `<path d="M${px} ${y - h * 0.9} Q${px + r * 0.6} ${y} ${px} ${y + h * 0.9} Q${px - r * 0.6} ${y} ${px} ${y - h * 0.9}Z" fill="${C.ink}"/>`
        : `<circle cx="${px}" cy="${y + 0.3}" r="${r}" fill="${o.pc || C.ink}"/>`;
      s += `<circle cx="${px - r * 0.35}" cy="${y - r * 0.3}" r="${Math.max(0.7, r * 0.32)}" fill="#FFFFFF"/>`;
    }
    return s;
  };

  // ---- Shared hand-drawn primitives (tools, icons) -------------------------
  (function () {
    const { part, L, G, circ } = S;
    const INK = C.ink;
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


    Object.assign(S, { bow, rr, shine, box, crescent, disc, oval, glass, scratch, tape, fuse, spark, barrel, DEEP, CREAM });
  })();

  // ---- Registry -----------------------------------------------------------
  // Bare-key lookups ("shield_drone") resolve with the original priority:
  // later groups win, exactly like the old single-file library.
  const GROUP_ORDER = ['charbare', 'char', 'tool', 'pet', 'enemy', 'icon', 'prop', 'hat', 'fx'];
  const GROUPS = {};
  GROUP_ORDER.forEach((g) => { GROUPS[g] = {}; });

  function register(prefix, map) {
    const grp = GROUPS[prefix] || (GROUPS[prefix] = {});
    Object.keys(map).forEach((k) => {
      grp[k] = map[k];
      delete SPRITE_CACHE[`${prefix}:${k}`];
      delete INK_CACHE[`${prefix}:${k}`];
    });
  }

  function resolveKey(key) {
    const i = key.indexOf(':');
    if (i > 0) {
      const g = GROUPS[key.slice(0, i)];
      return g && g[key.slice(i + 1)] ? key : 'icon:cube';
    }
    for (let k = GROUP_ORDER.length - 1; k >= 0; k--) {
      if (GROUPS[GROUP_ORDER[k]][key]) return `${GROUP_ORDER[k]}:${key}`;
    }
    return 'icon:cube';
  }

  function rawSvg(full) {
    const i = full.indexOf(':');
    const g = GROUPS[full.slice(0, i)];
    return (g && g[full.slice(i + 1)]) || '';
  }

  // Final art for a key: the raw drawing passed through the ink treatment.
  function getSvg(key) {
    const full = resolveKey(key);
    if (INK_CACHE[full] === undefined) INK_CACHE[full] = inkify(rawSvg(full), full);
    return INK_CACHE[full];
  }

  // ---- "Ink & Grit" treatment -------------------------------------------------
  // Applied to every sprite so the whole library shares one hand-inked look:
  //   - a gentle displacement wobble, so lines look drawn by hand
  //   - pen hatching laid over cel-shade shapes (the dark tone of each part)
  //   - a colour grade that pulls every fill toward dusty, earthy print colours
  const INK_CACHE = {};
  const SHADE_TONES = new Set();
  const GRADE_TO = [184, 152, 112];
  const GRADE_T = 0.16;
  const gradeMemo = {};
  function grade(col) {
    if (gradeMemo[col]) return gradeMemo[col];
    let h = col.slice(1);
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6 || col.toUpperCase() === C.ink) return (gradeMemo[col] = col);
    const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    const out = rgb.map((v, i) => Math.round(v + (GRADE_TO[i] - v) * GRADE_T));
    return (gradeMemo[col] = '#' + out.map((v) => v.toString(16).padStart(2, '0')).join(''));
  }
  function hashKey(k) {
    let h = 7;
    for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  const SVGNS = 'http://www.w3.org/2000/svg';
  function inkify(svg, key) {
    if (!svg || typeof DOMParser === 'undefined') return svg;
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const root = doc.documentElement;
    if (!root || root.nodeName !== 'svg' || doc.getElementsByTagName('parsererror').length) return svg;
    const vb = (root.getAttribute('viewBox') || '0 0 96 96').split(/[\s,]+/).map(Number);
    const k = (vb[2] || 96) / 96;
    const id = 'ink' + (hashKey(key) % 99991);

    // 1) hatch overlays on shade shapes (decided on the original colours)
    Array.from(root.querySelectorAll('path,rect,circle,ellipse,polygon')).forEach((el) => {
      if (el.closest('clipPath,defs,mask,pattern')) return;
      const fill = (el.getAttribute('fill') || '').toUpperCase();
      const stroke = el.getAttribute('stroke');
      const isShade = (el.getAttribute('class') || '').split(' ').includes('sh')
        || (SHADE_TONES.has(fill) && (!stroke || stroke === 'none') && !el.hasAttribute('data-f'));
      const op = parseFloat(el.getAttribute('opacity') || '1');
      if (!isShade || op < 0.5) return;
      const h = el.cloneNode(false);
      h.setAttribute('fill', `url(#${id}-h)`);
      ['stroke', 'stroke-width', 'class', 'filter'].forEach((a) => h.removeAttribute(a));
      h.setAttribute('opacity', '0.9');
      el.parentNode.insertBefore(h, el.nextSibling);
      // cross-hatch the same shadow the other way, lighter, like a pen going back over it
      const x = h.cloneNode(false);
      x.setAttribute('fill', `url(#${id}-x)`);
      x.setAttribute('opacity', '0.5');
      el.parentNode.insertBefore(x, h.nextSibling);
    });

    // 1b) thick-and-thin ink: every inked outline gets a second, thinner pen
    //     pass nudged down-right, so line weight swells like a dip pen.
    Array.from(root.querySelectorAll('path,rect,circle,ellipse,polygon,line,polyline')).forEach((el) => {
      if (el.closest('clipPath,defs,mask,pattern')) return;
      const st = (el.getAttribute('stroke') || '').toUpperCase();
      const w = parseFloat(el.getAttribute('stroke-width') || '0');
      if (st !== C.ink.toUpperCase() || w < 1.6) return;
      const op = parseFloat(el.getAttribute('opacity') || '1');
      if (op < 0.6) return;
      const d2 = el.cloneNode(false);
      d2.setAttribute('fill', 'none');
      d2.setAttribute('stroke-width', (w * 0.55).toFixed(2));
      d2.removeAttribute('class');
      d2.removeAttribute('data-f');
      const tr = el.getAttribute('transform');
      d2.setAttribute('transform', `translate(${(0.75 * k).toFixed(2)} ${(0.6 * k).toFixed(2)})${tr ? ' ' + tr : ''}`);
      d2.setAttribute('opacity', '0.9');
      el.parentNode.insertBefore(d2, el.nextSibling);
    });

    // 2) colour grade
    root.querySelectorAll('*').forEach((el) => {
      ['fill', 'stroke'].forEach((a) => {
        const v = el.getAttribute(a);
        if (v && v[0] === '#') el.setAttribute(a, grade(v));
      });
    });

    // 3) defs: hatch pattern + hand-drawn wobble filter
    const sp = (3.0 * k).toFixed(2);
    const sx = (4.2 * k).toFixed(2);
    const pad = 8 * k;
    const seed = hashKey(key) % 97;
    const defsSrc = `<svg xmlns="${SVGNS}"><defs>`
      + `<pattern id="${id}-h" width="${sp}" height="${sp}" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">`
      + `<line x1="0" y1="0" x2="0" y2="${sp}" stroke="${C.ink}" stroke-width="${(1.05 * k).toFixed(2)}"/></pattern>`
      + `<pattern id="${id}-x" width="${sx}" height="${sx}" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">`
      + `<line x1="0" y1="0" x2="0" y2="${sx}" stroke="${C.ink}" stroke-width="${(0.85 * k).toFixed(2)}"/></pattern>`
      + `<filter id="${id}-r" filterUnits="userSpaceOnUse" x="${vb[0] - pad}" y="${vb[1] - pad}" width="${vb[2] + pad * 2}" height="${vb[3] + pad * 2}">`
      // broad hand wobble
      + `<feTurbulence type="fractalNoise" baseFrequency="${(0.045 / k).toFixed(4)}" numOctaves="2" seed="${seed}" result="n"/>`
      + `<feDisplacementMap in="SourceGraphic" in2="n" scale="${(3.4 * k).toFixed(2)}" xChannelSelector="R" yChannelSelector="G" result="w1"/>`
      // fine ragged edge, like ink catching on paper fibre
      + `<feTurbulence type="turbulence" baseFrequency="${(0.42 / k).toFixed(4)}" numOctaves="1" seed="${seed + 7}" result="f"/>`
      + `<feDisplacementMap in="w1" in2="f" scale="${(1.25 * k).toFixed(2)}" xChannelSelector="R" yChannelSelector="G" result="w2"/>`
      // paper grain printed into the colour (only where the sprite is)
      + `<feTurbulence type="fractalNoise" baseFrequency="${(0.85 / k).toFixed(4)}" numOctaves="1" seed="${seed + 13}" result="g"/>`
      + `<feColorMatrix in="g" type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.1  0 0 0 0 0.09  0 0 0 -2.4 1.25" result="gm"/>`
      + `<feComposite in="gm" in2="w2" operator="in" result="gi"/>`
      + `<feMerge><feMergeNode in="w2"/><feMergeNode in="gi"/></feMerge></filter>`
      + '</defs></svg>';
    const defs = doc.importNode(new DOMParser().parseFromString(defsSrc, 'image/svg+xml').documentElement.firstChild, true);
    const g = doc.createElementNS(SVGNS, 'g');
    g.setAttribute('filter', `url(#${id}-r)`);
    while (root.firstChild) g.appendChild(root.firstChild);
    root.appendChild(defs);
    root.appendChild(g);
    return new XMLSerializer().serializeToString(root);
  }

  SHADE_KEYS.forEach((k) => SHADE_TONES.add(C[k].toUpperCase()));

  // ---- Offscreen baker -------------------------------------------------------
  const SPRITE_CACHE = {}; // key -> { ready, canvas, flashCanvas }
  const BAKE_SIZE = 160;
  const RIM_GROUPS = ['char', 'charbare', 'hat', 'enemy', 'pet', 'tool'];
  const RIM_KEYS = new Set(['icon:scrap', 'icon:fruit', 'icon:crate', 'prop:ore_vein', 'prop:explosive_barrel', 'prop:loot_pinata']);

  function needsRimOutline(key) {
    return RIM_KEYS.has(key) || RIM_GROUPS.includes(key.split(':')[0]);
  }

  function bakeSprite(key) {
    if (SPRITE_CACHE[key]) return SPRITE_CACHE[key];
    const entry = { ready: false, canvas: null, flashCanvas: null };
    SPRITE_CACHE[key] = entry;

    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = BAKE_SIZE;
      c.height = BAKE_SIZE;
      const g = c.getContext('2d');

      if (needsRimOutline(key)) {
        // Outer ink rim so sprites pop off any floor (the cartoon "sticker" edge).
        const pad = 7;
        const drawSz = BAKE_SIZE - pad * 2;
        const oc = document.createElement('canvas');
        oc.width = BAKE_SIZE;
        oc.height = BAKE_SIZE;
        const og = oc.getContext('2d');
        og.drawImage(img, pad, pad, drawSz, drawSz);
        og.globalCompositeOperation = 'source-in';
        og.fillStyle = C.ink;
        og.fillRect(0, 0, BAKE_SIZE, BAKE_SIZE);
        // brushy rim: stamped at 14 angles with an uneven radius (stable per
        // sprite), so the outer contour swells and thins like a loaded brush
        let hs = 7;
        for (let i = 0; i < key.length; i++) hs = (hs * 31 + key.charCodeAt(i)) | 0;
        const rimBase = 4.6;
        const N = 14;
        for (let a = 0; a < N; a++) {
          const ang = (Math.PI * 2 * a) / N;
          const wob = 0.72 + 0.5 * (0.5 + 0.5 * Math.sin(a * 1.9 + (hs % 1000) * 0.01));
          const rim = rimBase * wob;
          g.drawImage(oc, Math.cos(ang) * rim, Math.sin(ang) * rim);
        }
        g.drawImage(img, pad, pad, drawSz, drawSz);
      } else {
        g.drawImage(img, 0, 0, BAKE_SIZE, BAKE_SIZE);
      }

      // White silhouette for hit flashes.
      const fc = document.createElement('canvas');
      fc.width = BAKE_SIZE;
      fc.height = BAKE_SIZE;
      const fg = fc.getContext('2d');
      fg.drawImage(c, 0, 0);
      fg.globalCompositeOperation = 'source-in';
      fg.fillStyle = '#FFFFFF';
      fg.fillRect(0, 0, BAKE_SIZE, BAKE_SIZE);

      entry.canvas = c;
      entry.flashCanvas = fc;
      entry.ready = true;
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(getSvg(key));
    return entry;
  }

  function preloadAll() {
    Object.keys(GROUPS).forEach((g) => Object.keys(GROUPS[g]).forEach((k) => bakeSprite(`${g}:${k}`)));
  }

  window.MM.Art = { C, SW, ol, wrap, glint, rivet, S, register, GROUPS };

  window.MM.SVGs = {
    P: C,
    get CHARACTERS() { return GROUPS.char; },
    get CONTRAPTIONS() { return GROUPS.tool; },
    get PETS() { return GROUPS.pet; },
    get ENEMIES() { return GROUPS.enemy; },
    get ICONS() { return GROUPS.icon; },
    get PROPS() { return GROUPS.prop; },
    get HATS() { return GROUPS.hat; },
    get FX() { return GROUPS.fx; },
    getSvg,
    getSprite: bakeSprite,
    preloadAll
  };
})();
