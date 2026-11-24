// ============================================================================
// MULTI-MINE — GameEngine: arena floor & menu backdrop (cartoon style)
//
// Replaces the old sci-fi floor with a clean, flat Brotato-style arena.
// reactorHubs keep their exact original positions (the Reactor Surge event
// uses them); they are only drawn while that event is active.
// ============================================================================
(function () {
  const { ARENA_W, ARENA_H, bpCanvas, drawBlueprintGrid } = window.MM.EngineUtil;
  const INK = '#1E1A17';

  // Small deterministic PRNG so cosmetic floor detail never touches Math.random
  function prng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash = (str) => [...str].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

  function blobPath(g, cx, cy, r, rnd, lumps = 9, wobble = 0.22, sy = 1) {
    const pts = [];
    for (let i = 0; i < lumps; i++) {
      const a = (Math.PI * 2 * i) / lumps;
      const rr = r * (1 - wobble / 2 + rnd() * wobble);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * sy]);
    }
    smoothClosed(g, pts);
  }

  function smoothClosed(g, pts) {
    g.beginPath();
    const n = pts.length;
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const m0 = mid(pts[n - 1], pts[0]);
    g.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const m = mid(p, pts[(i + 1) % n]);
      g.quadraticCurveTo(p[0], p[1], m[0], m[1]);
    }
    g.closePath();
  }

  const RIM = {
    lava: { a: '#FF6A1F', b: '#FFB347' },
    ice: { a: '#5FB6E0', b: '#CFF1FF' },
    void: { a: '#2A1E48', b: '#8E5BE0' },
    chasm: { a: '#120E10', b: '#3A2E30' }
  };

  Object.assign(window.MM.GameEngine.prototype, {
    // ------------------------------------------------------------------------
    // Scenery anchors (positions identical to the original layout)
    // ------------------------------------------------------------------------
    generateArenaScenery() {
      this.reactorHubs = [
        { x: 480, y: 350, r: 58, phase: 0.0 },
        { x: ARENA_W - 480, y: 350, r: 58, phase: 1.5 },
        { x: 480, y: ARENA_H - 350, r: 58, phase: 3.0 },
        { x: ARENA_W - 480, y: ARENA_H - 350, r: 58, phase: 4.5 }
      ];
      // Menu backdrop: drifting embers & cave critters (cosmetic only)
      const rnd = prng(1337);
      this.menuEmbers = Array.from({ length: 46 }, () => ({
        x: rnd(), y: rnd(), r: 1.5 + rnd() * 3, speed: 0.01 + rnd() * 0.03, drift: 0.4 + rnd(), phase: rnd() * Math.PI * 2
      }));
      this.menuCrystals = [
        { x: 0.06, y: 0.80, s: 1.5, c: 0 }, { x: 0.14, y: 0.86, s: 0.9, c: 1 }, { x: 0.27, y: 0.9, s: 0.7, c: 0 },
        { x: 0.93, y: 0.78, s: 1.4, c: 1 }, { x: 0.84, y: 0.88, s: 1.0, c: 0 }, { x: 0.72, y: 0.92, s: 0.65, c: 1 },
        { x: 0.04, y: 0.30, s: 0.9, c: 0, ceil: true }, { x: 0.96, y: 0.26, s: 1.0, c: 1, ceil: true }
      ];
      this.menuCritters = [
        { x: 0.12, y: 0.62, s: 1.0, phase: 0.2 }, { x: 0.88, y: 0.56, s: 1.1, phase: 1.7 }, { x: 0.36, y: 0.86, s: 0.8, phase: 3.1 }
      ];
    },

    // ------------------------------------------------------------------------
    // Pre-baked arena floor (one bake per biome) — clean, Brotato-style:
    // one flat floor colour, faint low-contrast patches, a light grain,
    // a sprinkle of tiny pebbles & tufts, and a simple outlined border.
    // ------------------------------------------------------------------------
    ensureFloorCache(biome) {
      if (this.floorCache && this.floorCacheBiomeId === biome.id) return this.floorCache;
      const c = document.createElement('canvas');
      // drawn at 2x so the floor stays crisp under the zoomed-in follow camera
      const FS = 2;
      c.width = ARENA_W * FS;
      c.height = ARENA_H * FS;
      const g = bpCanvas(c.getContext('2d'));
      g.scale(FS, FS);
      const rnd = prng(hash(biome.id));
      const rim = RIM[biome.rim] || RIM.chasm;
      const inset = 22;
      const floorRect = () => { g.beginPath(); g.roundRect(inset, inset, ARENA_W - inset * 2, ARENA_H - inset * 2, 36); };

      // outside the arena
      g.fillStyle = biome.outer;
      g.fillRect(0, 0, ARENA_W, ARENA_H);

      // floor
      floorRect();
      g.fillStyle = biome.bg;
      g.fill();

      g.save();
      floorRect();
      g.clip();

      // Ink & Grit floor: a printed field-guide page. Hatched shade patches,
      // hand-drawn cracks, outlined pebbles and a wobbly inked border.
      const inkA = (al) => `rgba(30,26,23,${al})`;
      const hatchFill = (alpha, spacing, ang) => {
        g.save();
        g.clip();
        g.strokeStyle = inkA(alpha);
        g.lineWidth = 1.6;
        g.beginPath();
        const dx = Math.cos(ang) * 3000;
        const dy = Math.sin(ang) * 3000;
        for (let k = -ARENA_W - ARENA_H; k < ARENA_W + ARENA_H; k += spacing) {
          const ox = k * Math.sin(ang);
          const oy = -k * Math.cos(ang);
          g.moveTo(ARENA_W / 2 + ox - dx, ARENA_H / 2 + oy - dy);
          g.lineTo(ARENA_W / 2 + ox + dx, ARENA_H / 2 + oy + dy);
        }
        g.stroke();
        g.restore();
      };
      // tone patches (a touch of biome colour) with loose pen hatching
      for (let i = 0; i < 8; i++) {
        blobPath(g, rnd() * ARENA_W, rnd() * ARENA_H, 150 + rnd() * 190, rnd, 9, 0.3, 0.75);
        g.fillStyle = biome.tile;
        g.globalAlpha = 0.14;
        g.fill();
        g.globalAlpha = 1;
        hatchFill(0.13, 9, 0.7);
        hatchFill(0.07, 13, -0.8); // light cross-hatch over the darker patches
      }

      // paper / dirt grain
      for (let i = 0; i < 1800; i++) {
        g.fillStyle = rnd() < 0.6 ? inkA(0.06 + rnd() * 0.05) : 'rgba(255,248,230,0.06)';
        g.fillRect(rnd() * ARENA_W, rnd() * ARENA_H, 1.5 + rnd() * 2, 1.5 + rnd() * 2);
      }

      // hand-drawn cracks: short jittered polylines that branch once
      g.lineCap = 'round';
      g.lineJoin = 'round';
      for (let i = 0; i < 26; i++) {
        let x = 60 + rnd() * (ARENA_W - 120);
        let y = 60 + rnd() * (ARENA_H - 120);
        let ang = rnd() * Math.PI * 2;
        const segs = 3 + Math.floor(rnd() * 4);
        g.strokeStyle = inkA(0.62);
        g.lineWidth = 2.8;
        g.beginPath();
        g.moveTo(x, y);
        let bx = 0;
        let by = 0;
        for (let k = 0; k < segs; k++) {
          ang += (rnd() - 0.5) * 1.3;
          const len = 10 + rnd() * 18;
          x += Math.cos(ang) * len;
          y += Math.sin(ang) * len;
          g.lineTo(x, y);
          if (k === 1) { bx = x; by = y; }
        }
        g.stroke();
        if (bx) {
          g.lineWidth = 1.5;
          g.beginPath();
          g.moveTo(bx, by);
          const a2 = ang + (rnd() < 0.5 ? 1 : -1) * (0.7 + rnd() * 0.6);
          g.lineTo(bx + Math.cos(a2) * (9 + rnd() * 10), by + Math.sin(a2) * (9 + rnd() * 10));
          g.stroke();
        }
      }

      // pebbles (inked, with a hatched underside) and little ink tufts
      for (let i = 0; i < 46; i++) {
        const x = 70 + rnd() * (ARENA_W - 140);
        const y = 70 + rnd() * (ARENA_H - 140);
        if (rnd() < 0.65) {
          const r = 4 + rnd() * 6;
          const ps = i * 31 + 7;
          blobPath(g, x, y, r, prng(ps), 6, 0.25, 0.75);
          g.fillStyle = biome.tile;
          g.fill();
          g.save();
          g.beginPath();
          g.rect(x - r * 1.2, y, r * 2.4, r * 1.3);
          g.clip();
          blobPath(g, x, y, r, prng(ps), 6, 0.25, 0.75);
          hatchFill(0.4, 3.2, 0.75);
          g.restore();
          blobPath(g, x, y, r, prng(ps), 6, 0.25, 0.75);
          g.strokeStyle = inkA(0.85);
          g.lineWidth = 1.9;
          g.stroke();
        } else {
          g.strokeStyle = inkA(0.55);
          g.lineWidth = 1.8;
          g.beginPath();
          g.moveTo(x - 5, y); g.quadraticCurveTo(x - 6, y - 5, x - 8, y - 8);
          g.moveTo(x, y); g.quadraticCurveTo(x + 1, y - 6, x, y - 11);
          g.moveTo(x + 5, y); g.quadraticCurveTo(x + 6, y - 5, x + 8, y - 8);
          g.stroke();
        }
      }

      // ink spatter: a few blots with flicked droplets, like a pen shaken over the page
      const sr = prng(hash(biome.id) + 99);
      for (let i = 0; i < 9; i++) {
        const bx = 90 + sr() * (ARENA_W - 180);
        const by = 90 + sr() * (ARENA_H - 180);
        g.fillStyle = inkA(0.5 + sr() * 0.25);
        blobPath(g, bx, by, 3 + sr() * 4, sr, 7, 0.35, 1);
        g.fill();
        const n = 4 + Math.floor(sr() * 6);
        for (let k = 0; k < n; k++) {
          const a = sr() * Math.PI * 2;
          const dd = 8 + sr() * 26;
          g.beginPath(); g.arc(bx + Math.cos(a) * dd, by + Math.sin(a) * dd, 0.8 + sr() * 1.8, 0, Math.PI * 2); g.fill();
        }
      }
      // dry-brush strokes: broken, scratchy streaks
      for (let i = 0; i < 14; i++) {
        let x = 80 + sr() * (ARENA_W - 160);
        let y = 80 + sr() * (ARENA_H - 160);
        const a = sr() * Math.PI;
        const len = 40 + sr() * 70;
        for (let b = 0; b < 5; b++) {
          const off = (b - 2) * 2.2;
          g.strokeStyle = inkA(0.08 + sr() * 0.1);
          g.lineWidth = 1 + sr() * 1.4;
          g.beginPath();
          let px = x + Math.sin(a) * off;
          let py = y - Math.cos(a) * off;
          g.moveTo(px, py);
          const segs = 6;
          for (let k = 1; k <= segs; k++) {
            px += Math.cos(a) * (len / segs);
            py += Math.sin(a) * (len / segs);
            if (sr() < 0.25) g.moveTo(px, py); else g.lineTo(px + (sr() - 0.5) * 1.5, py + (sr() - 0.5) * 1.5);
          }
          g.stroke();
        }
      }

      // hatched shadow band inside the edge (instead of a soft gradient)
      g.save();
      floorRect();
      g.lineWidth = 70;
      g.strokeStyle = inkA(0.1);
      g.stroke();
      g.restore();
      g.restore();

      // border: biome trim inside a wobbly hand-inked line, drawn twice like a pen pass
      floorRect();
      g.lineWidth = 16;
      g.strokeStyle = rim.a;
      g.stroke();
      const wobbleRect = (seed, amp) => {
        const wr = prng(seed);
        const x0 = inset;
        const y0 = inset;
        const x1 = ARENA_W - inset;
        const y1 = ARENA_H - inset;
        const pts = [];
        const step = 40;
        const R = 36;
        const edge = (ax, ay, bx2, by2) => {
          const n = Math.max(1, Math.round(Math.hypot(bx2 - ax, by2 - ay) / step));
          for (let k = 0; k < n; k++) pts.push([ax + ((bx2 - ax) * k) / n + (wr() - 0.5) * amp, ay + ((by2 - ay) * k) / n + (wr() - 0.5) * amp]);
        };
        edge(x0 + R, y0, x1 - R, y0); edge(x1 - R, y0, x1, y0 + R);
        edge(x1, y0 + R, x1, y1 - R); edge(x1, y1 - R, x1 - R, y1);
        edge(x1 - R, y1, x0 + R, y1); edge(x0 + R, y1, x0, y1 - R);
        edge(x0, y1 - R, x0, y0 + R); edge(x0, y0 + R, x0 + R, y0);
        g.beginPath();
        pts.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py)));
        g.closePath();
      };
      g.strokeStyle = INK;
      wobbleRect(hash(biome.id) + 1, 4);
      g.lineWidth = 7;
      g.stroke();
      wobbleRect(hash(biome.id) + 2, 4);
      g.lineWidth = 1.8;
      g.stroke();

      // blueprint sheet: grid over the whole floor, a title block in the corner
      const raw = c.getContext('2d');
      raw.save();
      if (window.MM_ART_STYLE === 'ink') raw.globalAlpha = 0; // no sheet furniture in ink style
      raw.setTransform(FS, 0, 0, FS, 0, 0);
      drawBlueprintGrid(raw, ARENA_W, ARENA_H, 40);
      const tbW = 300;
      const tbH = 74;
      const tx = ARENA_W - inset - tbW - 26;
      const ty = ARENA_H - inset - tbH - 26;
      raw.strokeStyle = 'rgba(234,242,255,0.55)';
      raw.lineWidth = 2;
      raw.strokeRect(tx, ty, tbW, tbH);
      raw.beginPath(); raw.moveTo(tx, ty + 30); raw.lineTo(tx + tbW, ty + 30); raw.moveTo(tx + 190, ty + 30); raw.lineTo(tx + 190, ty + tbH); raw.stroke();
      raw.fillStyle = 'rgba(234,242,255,0.6)';
      raw.font = '600 17px "Fredoka", "Lexend", sans-serif';
      raw.fillText("MITCH'S MINERS — FIELD SHEET", tx + 12, ty + 21);
      raw.font = '500 13px "Lexend", sans-serif';
      raw.fillText(String(biome.name || biome.id).toUpperCase(), tx + 12, ty + 56);
      raw.fillText('SCALE 1:20', tx + 202, ty + 56);
      raw.restore();
      this.floorCache = c;
      this.floorCacheBiomeId = biome.id;
      return c;
    },

    // ------------------------------------------------------------------------
    // Live floor layer: just the cached floor. Reactor hubs only appear while
    // the Reactor Surge event is running (where players need to find them).
    // ------------------------------------------------------------------------
    renderBiomeWorld(ctx, biome) {
      ctx.drawImage(this.ensureFloorCache(biome), 0, 0, ARENA_W, ARENA_H);
      if (this.liveEvent && this.liveEvent.kind === 'reactor_surge') {
        (this.reactorHubs || []).forEach((h) => this.drawSubFloorBiomeCore(ctx, h.x, h.y, h.r, biome, h.phase));
      }
    },

    // Simple glowing reactor pad shown during the Reactor Surge event
    drawSubFloorBiomeCore(ctx, x, y, r, biome, phase) {
      const pulse = 0.72 + Math.sin(this.globalTime * 2.4 + phase) * 0.22;
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = biome.tile;
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.globalAlpha = 0.45 * pulse;
      ctx.fillStyle = biome.accent;
      ctx.beginPath(); ctx.arc(0, 0, r - 8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },

    // ------------------------------------------------------------------------
    // Title / menu backdrop: a mining cave with pipes, crystals & lava river
    // ------------------------------------------------------------------------
    renderMenuBackdrop(dt) {
      const ctx = this.ctx;
      const W = this.viewW;
      const H = this.viewH;
      const t = this.globalTime;

      // Static inked cave (rock strata, hatching, cracks, stalactites, pipes) is
      // drawn once per screen size and reused every frame.
      const key = `${W}x${H}x${this.dpr}`;
      if (!this.menuCache || this.menuCacheKey !== key) {
        this.menuCache = this.bakeMenuCave(W, H);
        this.menuCacheKey = key;
      }
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(this.menuCache, 0, 0);
      ctx.restore();

      ctx.save();
      ctx.scale(this.dpr, this.dpr);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // crystals: the same inked crystal props used in the arena
      this.menuCrystals.forEach((cr) => {
        const sz = 70 * cr.s;
        const x = cr.x * W;
        const y = cr.y * H;
        ctx.save();
        ctx.translate(x, y);
        if (cr.ceil) ctx.scale(1, -1);
        this.drawSprite(ctx, cr.c ? 'prop:crystal_mint' : 'prop:crystal_ice', -sz / 2, -sz * 0.92, sz, sz);
        ctx.restore();
      });

      // peeking scrap mites (the real enemy sprite), bobbing on the ledges
      this.menuCritters.forEach((m) => {
        const sz = 64 * m.s;
        const x = m.x * W;
        const y = m.y * H + Math.sin(t * 2 + m.phase) * 2;
        ctx.save();
        ctx.translate(x, y);
        if (Math.sin(t * 0.7 + m.phase) < 0) ctx.scale(-1, 1);
        this.drawSprite(ctx, 'enemy:scrap_mite', -sz / 2, -sz / 2, sz, sz);
        ctx.restore();
      });

      // lava river: wobbly inked surface with drifting crust lines
      const ly = H * 0.9;
      const lava = () => {
        ctx.beginPath();
        ctx.moveTo(0, H + 10);
        for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, ly + Math.sin(x * 0.02 + t * 1.6) * 5 + Math.sin(x * 0.07) * 1.5);
        ctx.lineTo(W, H + 10);
        ctx.closePath();
      };
      ctx.save(); ctx.translate(1.5, 1.2); lava(); ctx.fillStyle = '#E2622A'; ctx.fill(); ctx.restore();
      lava(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
      ctx.strokeStyle = '#F7B15A'; ctx.lineWidth = 3;
      for (let k = 0; k < 9; k++) {
        const x = ((k * 173 + t * 40) % (W + 120)) - 60;
        const yy = ly + 16 + (k % 3) * 9;
        ctx.beginPath(); ctx.moveTo(x, yy); ctx.quadraticCurveTo(x + 20, yy - 3, x + 40, yy); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(30,26,23,0.35)'; ctx.lineWidth = 2;
      for (let k = 0; k < 6; k++) {
        const x = ((k * 241 + t * 26) % (W + 120)) - 60;
        ctx.beginPath(); ctx.moveTo(x, ly + 30); ctx.lineTo(x + 18, ly + 28); ctx.lineTo(x + 30, ly + 32); ctx.stroke();
      }
      // the rock ledge sits on top of the lava
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.menuLedge, 0, 0); ctx.restore();

      // drifting embers: little inked sparks
      this.menuEmbers.forEach((e) => {
        const y = (((e.y - t * e.speed) % 1) + 1) % 1;
        const x = e.x + Math.sin(t * e.drift + e.phase) * 0.01;
        ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 3 + e.phase);
        ctx.fillStyle = e.r > 3.5 ? '#F7B15A' : '#E2622A';
        ctx.beginPath(); ctx.arc(x * W, y * H, e.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
      });
      ctx.globalAlpha = 1;
      ctx.restore();
    },

    // Paints the static parts of the title cave onto offscreen canvases.
    bakeMenuCave(W, H) {
      const dpr = this.dpr;
      const mk = () => {
        const c = document.createElement('canvas');
        c.width = Math.ceil(W * dpr);
        c.height = Math.ceil(H * dpr);
        const g = bpCanvas(c.getContext('2d'));
        g.scale(dpr, dpr);
        g.lineJoin = 'round';
        g.lineCap = 'round';
        return [c, g];
      };
      const [c, g] = mk();
      const hatch = (alpha, spacing, ang, lw = 1.4) => {
        g.save();
        g.clip();
        g.strokeStyle = `rgba(30,26,23,${alpha})`;
        g.lineWidth = lw;
        g.beginPath();
        const L = W + H;
        for (let k = -L; k < L; k += spacing) {
          g.moveTo(k, -10);
          g.lineTo(k + Math.cos(ang) * L * 2, -10 + Math.sin(ang) * L * 2);
        }
        g.stroke();
        g.restore();
      };
      const inkStroke = (w = 4) => { g.strokeStyle = INK; g.lineWidth = w; g.stroke(); };

      // back wall: flat warm umber with paper grain
      g.fillStyle = '#2E221B';
      g.fillRect(0, 0, W, H);
      const rg = prng(404);
      for (let i = 0; i < 900; i++) {
        g.fillStyle = rg() < 0.6 ? 'rgba(30,26,23,0.18)' : 'rgba(255,240,215,0.035)';
        g.fillRect(rg() * W, rg() * H, 1.5 + rg() * 2, 1.5 + rg() * 2);
      }

      // rock strata: each band hatched more heavily the further back it sits
      const band = (yBase, amp, col, seed, hatchA) => {
        const rnd = prng(seed);
        const pts = [];
        for (let x = -10; x <= W + 60; x += 46) pts.push([x, yBase + (rnd() - 0.5) * amp]);
        const path = () => {
          g.beginPath();
          g.moveTo(-10, H + 10);
          pts.forEach(([x, y]) => g.lineTo(x, y));
          g.lineTo(W + 10, H + 10);
          g.closePath();
        };
        path(); g.fillStyle = col; g.fill();
        path(); hatch(hatchA, 7, 0.7);
        path(); inkStroke(4);
        // a few hand-drawn cracks in the band
        g.strokeStyle = 'rgba(30,26,23,0.55)'; g.lineWidth = 1.8;
        for (let i = 0; i < 10; i++) {
          let x = rnd() * W; let y = yBase + 30 + rnd() * (H - yBase) * 0.4;
          g.beginPath(); g.moveTo(x, y);
          for (let k = 0; k < 3; k++) { x += 8 + rnd() * 16; y += (rnd() - 0.4) * 12; g.lineTo(x, y); }
          g.stroke();
        }
      };
      band(H * 0.5, 70, '#3E2E25', 11, 0.22);
      band(H * 0.66, 56, '#4A382D', 23, 0.16);
      band(H * 0.78, 40, '#5A4435', 31, 0.1);

      // ceiling stalactites, hatched
      const rndC = prng(99);
      const ceil = [];
      for (let x = -20; x <= W + 60; x += 54) ceil.push([x - 22, 16 + rndC() * 20], [x, 26 + rndC() * 80]);
      const ceilPath = () => {
        g.beginPath(); g.moveTo(-10, -10);
        ceil.forEach(([x, y]) => g.lineTo(x, y));
        g.lineTo(W + 10, -10); g.closePath();
      };
      ceilPath(); g.fillStyle = '#251A14'; g.fill();
      ceilPath(); hatch(0.3, 5, 2.2);
      ceilPath(); inkStroke(4);

      // riveted pipes along the top corners
      const pipe = (pts, w) => {
        g.beginPath();
        pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.strokeStyle = INK; g.lineWidth = w + 6; g.stroke();
        g.strokeStyle = '#7D7F78'; g.lineWidth = w; g.stroke();
        g.save(); g.translate(w * 0.18, w * 0.18); g.strokeStyle = '#5E605A'; g.lineWidth = w * 0.35; g.stroke(); g.restore();
        g.save(); g.translate(-w * 0.2, -w * 0.2); g.strokeStyle = 'rgba(255,248,230,0.35)'; g.lineWidth = w * 0.16; g.stroke(); g.restore();
      };
      pipe([[0, 40], [W * 0.12, 40], [W * 0.12, H * 0.42]], 16);
      pipe([[0, 70], [W * 0.07, 70], [W * 0.07, H * 0.5]], 10);
      pipe([[W, 46], [W * 0.88, 46], [W * 0.88, H * 0.38]], 16);
      pipe([[W, 78], [W * 0.93, 78], [W * 0.93, H * 0.46]], 10);
      [[W * 0.12, H * 0.2], [W * 0.88, H * 0.2], [W * 0.12, H * 0.34], [W * 0.88, H * 0.31]].forEach(([x, y]) => {
        g.beginPath(); g.roundRect(x - 14, y - 7, 28, 14, 3);
        g.fillStyle = '#9A9D96'; g.fill(); inkStroke(3);
        [-8, 8].forEach((dx) => { g.beginPath(); g.arc(x + dx, y, 2, 0, Math.PI * 2); g.fillStyle = INK; g.fill(); });
      });

      // blueprint grid over the whole sheet
      g.save();
      drawBlueprintGrid(c.getContext('2d'), W, H, 32);
      g.restore();

      // soft vignette so the menu card reads clearly
      const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(10,6,4,0.45)');
      g.fillStyle = vg;
      g.fillRect(0, 0, W, H);

      // rock ledge above the lava (drawn over the animated lava each frame)
      const [lc, lg] = mk();
      const ly = H * 0.9;
      const rndL = prng(5);
      const ledgePts = [];
      for (let x = -10; x <= W + 40; x += 40) ledgePts.push([x, ly - 10 - rndL() * 14]);
      const ledge = () => {
        lg.beginPath(); lg.moveTo(-10, ly - 6);
        ledgePts.forEach(([x, y]) => lg.lineTo(x, y));
        lg.lineTo(W + 10, ly + 4); lg.lineTo(-10, ly + 4); lg.closePath();
      };
      ledge(); lg.fillStyle = '#5A4A42'; lg.fill();
      ledge(); lg.save(); lg.clip(); lg.strokeStyle = 'rgba(30,26,23,0.3)'; lg.lineWidth = 1.4; lg.beginPath();
      for (let k = -H; k < W + H; k += 6) { lg.moveTo(k, ly - 30); lg.lineTo(k + 40, ly + 10); }
      lg.stroke(); lg.restore();
      ledge(); lg.strokeStyle = INK; lg.lineWidth = 4; lg.stroke();
      this.menuLedge = lc;
      return c;
    }
  });
})();
