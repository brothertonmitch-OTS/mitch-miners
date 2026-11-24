// ============================================================================
// MULTI-MINE — GameEngine: core (state, loop, lifecycle)
// ============================================================================
window.MM = window.MM || {};

(function () {
  const ARENA_W = 1920;
  const ARENA_H = 1320;

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }

  function rand(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ---- "Ink & Grit" colour toning for everything the game draws in code ----
  // Effects, projectiles, rings and numbers pass their colours through here so
  // neon tones are pulled into the same dusty print palette as the sprites.
  const TONE_TO = [184, 152, 112];
  const toneMemo = new Map();
  function inkTone(col) {
    if (typeof col !== 'string') return col;
    const hit = toneMemo.get(col);
    if (hit) return hit;
    let r; let g; let b; let a = 1;
    const c = col.trim();
    if (c[0] === '#' && (c.length === 7 || c.length === 4)) {
      const h = c.length === 4 ? c.slice(1).split('').map((x) => x + x).join('') : c.slice(1);
      r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
    } else {
      const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(c);
      if (!m) { toneMemo.set(col, col); return col; }
      r = +m[1]; g = +m[2]; b = +m[3]; a = m[4] === undefined ? 1 : +m[4];
    }
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    let out;
    if (window.MM_ART_STYLE === 'ink') {
      if (lum < 40) out = [r, g, b]; // inks & deep shadows stay put
      else {
        // desaturate 20%, then pull 14% toward warm paper-brown
        out = [r, g, b].map((v, i) => {
          const d = v + (lum - v) * 0.2;
          return Math.round(d + (TONE_TO[i] - d) * 0.14);
        });
      }
    } else if (lum < 40) out = [11, 37, 71]; // blueprint: ink outlines become deep navy
    else {
      // blueprint: colours brightened a touch so effects pop on blue paper
      out = [r, g, b].map((v) => {
        const d = v + (lum - v) * 0.15;
        return Math.round(d + (255 - d) * 0.22);
      });
    }
    const res = a === 1 ? `rgb(${out[0]},${out[1]},${out[2]})` : `rgba(${out[0]},${out[1]},${out[2]},${a})`;
    if (toneMemo.size < 4000) toneMemo.set(col, res);
    return res;
  }
  // Wrap a 2D context so every string colour it is given is toned.
  function inkCanvas(ctx) {
    const proto = Object.getPrototypeOf(ctx);
    ['fillStyle', 'strokeStyle', 'shadowColor'].forEach((prop) => {
      const desc = Object.getOwnPropertyDescriptor(proto, prop);
      if (!desc) return;
      Object.defineProperty(ctx, prop, {
        configurable: true,
        get() { return desc.get.call(this); },
        set(v) { desc.set.call(this, inkTone(v)); }
      });
    });
    return ctx;
  }
  // Blueprint paper canvas (floor & title cave bakes): every fill becomes a
  // shade of blueprint blue by brightness, dark ink strokes become white lines.
  const bpMemo = new Map();
  function bpColour(col, isStroke) {
    if (typeof col !== 'string') return col;
    const key = (isStroke ? 's' : 'f') + col;
    const hit = bpMemo.get(key);
    if (hit) return hit;
    let r; let g; let b; let a = 1;
    const c = col.trim();
    if (c[0] === '#' && (c.length === 7 || c.length === 4)) {
      const h = c.length === 4 ? c.slice(1).split('').map((x) => x + x).join('') : c.slice(1);
      r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
    } else {
      const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(c);
      if (!m) { bpMemo.set(key, col); return col; }
      r = +m[1]; g = +m[2]; b = +m[3]; a = m[4] === undefined ? 1 : +m[4];
    }
    const lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
    let out;
    if (isStroke) {
      out = lum < 0.3 ? [234, 242, 255] : [r, g, b].map((v) => Math.round(v + (255 - v) * 0.55));
    } else if (lum > 0.85) {
      out = [r, g, b]; // near-white fills (labels, paper flecks) stay light
    } else {
      const lo = [20, 58, 108];
      const hi = [48, 104, 172];
      out = lo.map((v, i) => Math.round(v + (hi[i] - v) * Math.min(1, lum * 1.25)));
    }
    const res = a === 1 ? `rgb(${out[0]},${out[1]},${out[2]})` : `rgba(${out[0]},${out[1]},${out[2]},${a})`;
    if (bpMemo.size < 4000) bpMemo.set(key, res);
    return res;
  }
  function bpCanvas(ctx) {
    if (window.MM_ART_STYLE === 'ink') return ctx; // ink style draws the floor as-is
    const proto = Object.getPrototypeOf(ctx);
    [['fillStyle', false], ['strokeStyle', true]].forEach(([prop, isStroke]) => {
      const desc = Object.getOwnPropertyDescriptor(proto, prop);
      if (!desc) return;
      Object.defineProperty(ctx, prop, {
        configurable: true,
        get() { return desc.get.call(this); },
        set(v) { desc.set.call(this, bpColour(v, isStroke)); }
      });
    });
    return ctx;
  }
  // Blueprint grid: minor lines every `minor` px, major lines every 5th.
  function drawBlueprintGrid(raw, w, h, minor = 40) {
    if (window.MM_ART_STYLE === 'ink') return;
    raw.save();
    raw.lineWidth = 1;
    for (let x = 0, i = 0; x <= w; x += minor, i++) {
      raw.strokeStyle = i % 5 ? 'rgba(234,242,255,0.07)' : 'rgba(234,242,255,0.16)';
      raw.beginPath(); raw.moveTo(x + 0.5, 0); raw.lineTo(x + 0.5, h); raw.stroke();
    }
    for (let y = 0, i = 0; y <= h; y += minor, i++) {
      raw.strokeStyle = i % 5 ? 'rgba(234,242,255,0.07)' : 'rgba(234,242,255,0.16)';
      raw.beginPath(); raw.moveTo(0, y + 0.5); raw.lineTo(w, y + 0.5); raw.stroke();
    }
    raw.restore();
  }

  // A hand-drawn circle: radius wobbles a little along the way (stable per seed).
  function wobblyCircle(ctx, x, y, r, seed, amp = 0.05) {
    const n = Math.max(14, Math.min(40, Math.round(r / 4)));
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (Math.PI * 2 * i) / n;
      const k = i % n;
      const w = 1 + amp * (Math.sin(k * 2.3 + seed) * 0.6 + Math.sin(k * 5.1 + seed * 1.7) * 0.4);
      const px = x + Math.cos(a) * r * w;
      const py = y + Math.sin(a) * r * w;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  window.MM.EngineUtil = { ARENA_W, ARENA_H, clamp, dist2, rand, pick, inkTone, inkCanvas, wobblyCircle, bpCanvas, drawBlueprintGrid };

  class GameEngine {
    constructor(canvas, callbacks) {
      this.canvas = canvas;
      this.ctx = inkCanvas(canvas.getContext('2d', { alpha: false }));
      this.cb = callbacks || {};

      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.viewW = 1280;
      this.viewH = 720;
      this.camZoom = 1;

      this.state = 'menu';
      this.keys = {};
      this.mouse = { x: 0, y: 0 };
      this.mouseFollow = false;

      this.rafId = null;
      this.lastTime = 0;
      this.globalTime = 0;
      this.hudAccum = 0;
      this.hitStop = 0;

      this.floorCache = null;
      this.floorCacheBiomeId = null;

      this.generateArenaScenery();
      this.resetRunState('nasa', 1);
      this.bindInput();
      this.resize();
    }

    resize() {
      const vv = window.visualViewport;
      const w = Math.max(320, Math.floor(vv ? vv.width : window.innerWidth));
      const h = Math.max(240, Math.floor(vv ? vv.height : window.innerHeight));
      this.viewW = w;
      this.viewH = h;
      // Close follow camera: frame about 1100 x 680 world units around the player
      // (a bit over half the arena width), so the screen scrolls as you move.
      this.camZoom = clamp(Math.min(w / 1100, h / 680), 0.5, 2.6);
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.floor(w * this.dpr);
      this.canvas.height = Math.floor(h * this.dpr);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
    }

    nextUid() {
      this._uid = (this._uid || 1) + 1;
      return this._uid;
    }

    notifyAch(ach) {
      if (ach && this.cb.onAchievement) this.cb.onAchievement(ach);
    }

    startLoop() {
      if (this.rafId) return;
      this.lastTime = performance.now();
      const tick = (now) => {
        const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
        this.lastTime = now;
        this.globalTime += dt;
        this.pollCombatGamepad();

        if (this.state === 'playing' || this.state === 'wave_clear') {
          const simDt = (this.state === 'playing' && this.hasModifier('turbo')) ? dt * 1.28 : dt;
          if (this.hitStop > 0) {
            this.hitStop -= dt;
            this.updateCamera(dt);
          } else {
            this.update(simDt);
          }
          this.renderArena();
        } else if (this.state === 'paused') {
          this.renderArena();
        } else {
          this.renderMenuBackdrop(dt);
        }
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    }

    pause() {
      if (this.state !== 'playing') return;
      this.state = 'paused';
      if (this.cb.onPause) this.cb.onPause(true);
    }

    resume() {
      if (this.state !== 'paused') return;
      this.state = 'playing';
      this.lastTime = performance.now();
      if (this.cb.onPause) this.cb.onPause(false);
    }

    hasModifier(id) {
      return !!(this.run && Array.isArray(this.run.modifiers) && this.run.modifiers.includes(id));
    }

    // Stacked-risk easing: at Hazard 4+ with 3 or more penalty modifiers on,
    // each penalty is softened so the stack stays the hardest mode but is
    // still winnable (otherwise multipliers compound into one-bite deaths).
    // Plain hazards and single-modifier runs are unaffected.
    isRiskStacked() {
      if (!this.run || !this.run.hazard || this.run.hazard.level < 4) return false;
      const PENALTY = ['glass_cannon', 'all_cursed', 'fast_escalation', 'blood_harvest', 'double_boss', 'turbo'];
      return PENALTY.filter((id) => this.hasModifier(id)).length >= 3;
    }
  }

  window.MM.GameEngine = GameEngine;
})();
