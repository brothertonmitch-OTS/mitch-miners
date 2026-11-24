// ============================================================================
// MULTI-MINE — GameEngine: fx
// ============================================================================
(function () {
  // eslint-disable-next-line no-unused-vars
  const { ARENA_W, ARENA_H, clamp, dist2, rand, pick } = window.MM.EngineUtil;

  Object.assign(window.MM.GameEngine.prototype, {
    spawnFx(key, x, y, opts = {}) {
      if (this.fxSprites.length > 95) this.fxSprites.shift();
      this.fxSprites.push({
        key, x, y,
        vx: opts.vx || 0, vy: opts.vy || 0,
        size: opts.size || 64,
        rot: opts.rot !== undefined ? opts.rot : rand(-0.4, 0.4),
        rotSpd: opts.rotSpd || 0,
        life: opts.life || 0.42, maxLife: opts.life || 0.42,
        delay: opts.delay || 0,
        pop: opts.pop !== false,
        fadeOut: opts.fadeOut !== false,
        scaleEnd: opts.scaleEnd || 1.25,
        ground: !!opts.ground,
        maxAlpha: opts.maxAlpha !== undefined ? opts.maxAlpha : 1
      });
    },

    // Leave persistent fading scorch/frost/crater decals on the battlefield!
    spawnDecal(kind, x, y, r) {
      if (this.decals.length > 42) this.decals.shift();
      this.decals.push({
        kind, x, y, r,
        rot: rand(0, Math.PI * 2),
        life: 6.5, maxLife: 6.5
      });
    },

    // Spawn 3D-arcing bouncing flat-vector debris chunks with real ground shadows!
    spawnDebris(x, y, colors, count = 7, power = 180) {
      count = Math.ceil(count * 0.5); // fewer chips over the action
      for (let i = 0; i < count; i++) {
        if (this.debris.length > 45) this.debris.shift();
        const ang = rand(0, Math.PI * 2);
        const spd = rand(power * 0.35, power);
        this.debris.push({
          x, y,
          z: rand(4, 14),
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          vz: rand(120, 240),
          size: rand(4, 8.5),
          rot: rand(0, Math.PI * 2),
          rotSpd: rand(-10, 10),
          color: Array.isArray(colors) ? pick(colors) : colors,
          life: rand(0.4, 0.7),
          maxLife: 0.7
        });
      }
    },

    // ------------------------------------------------------------------------
    // FX & 3D-BOUNCING DEBRIS PHYSICS
    // ------------------------------------------------------------------------
    updateVisualFX(dt) {
      for (let i = this.decals.length - 1; i >= 0; i--) {
        this.decals[i].life -= dt;
        if (this.decals[i].life <= 0) this.decals.splice(i, 1);
      }

      for (let i = this.debris.length - 1; i >= 0; i--) {
        const db = this.debris[i];
        db.life -= dt;
        db.x += db.vx * dt;
        db.y += db.vy * dt;
        db.vz -= 640 * dt; // Gravity!
        db.z += db.vz * dt;
        if (db.z <= 0) {
          db.z = 0;
          db.vz = -db.vz * 0.45; // Crisp bounce!
          db.vx *= 0.65;
          db.vy *= 0.65;
          db.rotSpd *= 0.6;
        }
        db.rot += db.rotSpd * dt;
        if (db.life <= 0) this.debris.splice(i, 1);
      }

      for (let i = this.fxSprites.length - 1; i >= 0; i--) {
        const f = this.fxSprites[i];
        if (f.delay > 0) { f.delay -= dt; continue; }
        f.life -= dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.rot += f.rotSpd * dt;
        if (f.life <= 0) this.fxSprites.splice(i, 1);
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.life -= dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vx *= Math.pow(0.08, dt);
        pt.vy *= Math.pow(0.08, dt);
        if (pt.life <= 0) this.particles.splice(i, 1);
      }

      for (let i = this.rings.length - 1; i >= 0; i--) {
        this.rings[i].life -= dt;
        if (this.rings[i].life <= 0) this.rings.splice(i, 1);
      }

      for (let i = this.beams.length - 1; i >= 0; i--) {
        this.beams[i].life -= dt;
        if (this.beams[i].life <= 0) this.beams.splice(i, 1);
      }

      for (let i = this.texts.length - 1; i >= 0; i--) {
        this.texts[i].life -= dt;
        this.texts[i].y -= 42 * dt;
        if (this.texts[i].life <= 0) this.texts.splice(i, 1);
      }

      for (let i = this.afterimages.length - 1; i >= 0; i--) {
        this.afterimages[i].life -= dt;
        if (this.afterimages[i].life <= 0) this.afterimages.splice(i, 1);
      }
    },

    spawnBurst(x, y, color, count = 8, speed = 140) {
      count = Math.ceil(count * 0.6); // lighter bursts keep enemies readable
      for (let i = 0; i < count; i++) {
        const ang = rand(0, Math.PI * 2);
        const spd = rand(speed * 0.35, speed);
        this.particles.push({
          x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
          r: rand(3, 6), color, shape: i % 2 === 0 ? 'rect' : 'circle',
          life: rand(0.22, 0.45), maxLife: 0.45
        });
      }
    },

    addText(x, y, text, color = '#FFFFFF', size = 13) {
      // keep at most 14 damage numbers alive (drop the oldest); other text stays
      let nums = 0;
      for (let i = 0; i < this.texts.length; i++) if (this.texts[i].dmgNum) nums++;
      if (nums >= 14) {
        const k = this.texts.findIndex((t) => t.dmgNum);
        if (k >= 0) this.texts.splice(k, 1);
      }
      if (this.texts.length > 40) this.texts.shift();
      this.texts.push({ x, y, text, color, size, life: 0.68, maxLife: 0.68 });
    },

    findNearestEnemy(x, y, maxRange = 9999, excludeUid = null) {
      const effRange = maxRange < 5000 ? maxRange + ((this.stats && this.stats.rangeBonus) || 0) : maxRange;
      let best = null;
      let bestD2 = effRange * effRange;
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.dead || e.uid === excludeUid) continue;
        const d = dist2(x, y, e.x, e.y);
        if (d < bestD2) { bestD2 = d; best = e; }
      }
      return best;
    },

    findNearestEnemies(x, y, maxRange, limit) {
      const r2 = maxRange * maxRange;
      return this.enemies
        .filter((e) => !e.dead && dist2(x, y, e.x, e.y) <= r2)
        .sort((a, b) => dist2(x, y, a.x, a.y) - dist2(x, y, b.x, b.y))
        .slice(0, limit);
    },

    pointToSegmentDist(px, py, x1, y1, x2, y2) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const l2 = dx * dx + dy * dy;
      if (l2 === 0) return Math.hypot(px - x1, py - y1);
      const t = clamp(((px - x1) * dx + (py - y1) * dy) / l2, 0, 1);
      return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    },

    getHudSnapshot() {
      const aliveBosses = this.enemies.filter((e) => e.isBoss && !e.dead);
      const leadBoss = aliveBosses[0] || null;
      const totalBossHp = aliveBosses.reduce((s, b) => s + Math.max(0, b.hp), 0);
      const totalBossMax = aliveBosses.reduce((s, b) => s + b.maxHp, 0);
      const aliveGoblin = this.enemies.find((e) => !e.dead && e.def && e.def.isLootGoblin);
      let activeEvent = null;
      if (this.liveEvent && this.liveEvent.kind === 'beacon') {
        activeEvent = {
          kind: 'beacon',
          text: `📡 CAPTURE OVERCLOCK BEACON — ${Math.round(this.liveEvent.progress * 100)}% (${Math.ceil(this.liveEvent.life)}s)`,
          pct: Math.round(this.liveEvent.progress * 100)
        };
      } else if (this.liveEvent && this.liveEvent.kind === 'reactor_surge') {
        activeEvent = {
          kind: 'reactor_surge',
          text: `⚡ REACTOR SURGE — STEP ON ANY GLOWING FLOOR HUB (${Math.ceil(this.liveEvent.life)}s)`,
          pct: Math.round((this.liveEvent.life / Math.max(1, this.liveEvent.maxLife)) * 100)
        };
      } else if (aliveGoblin) {
        activeEvent = {
          kind: 'loot_goblin',
          text: `💰 GOLDEN CARGO-BOT ACTIVE — DESTROY BEFORE WARP (${Math.ceil(aliveGoblin.goblinLife || 1)}s)`,
          pct: Math.round((aliveGoblin.hp / Math.max(1, aliveGoblin.maxHp)) * 100)
        };
      }
      return {
        hp: Math.ceil(this.player.hp),
        maxHp: this.stats.maxHp,
        shield: Math.round(this.player.shield),
        xp: this.run.xp,
        xpNext: this.run.xpNext,
        level: this.run.level,
        scrap: this.run.scrap,
        wave: this.run.wave,
        waveTimer: Math.ceil(this.waveTimer),
        waveElapsed: this.waveElapsed,
        waveDuration: (this.waveCfg && this.waveCfg.duration) || 35,
        waveIsHorde: !!(this.waveCfg && this.waveCfg.isHorde),
        waveHasElite: !!(this.waveCfg && this.waveCfg.elite),
        waveHasBoss: !!(this.waveCfg && this.waveCfg.boss),
        biome: this.waveCfg ? this.waveCfg.biome.name : '',
        dashCd: this.player.dashCd,
        dashMax: this.stats.dashCd,
        ultCharge: Math.floor(this.player.ultCharge || 0),
        ultReady: (this.player.ultCharge || 0) >= 100,
        ultName: (this.run.charDef.ultimate && this.run.charDef.ultimate.name) || 'Overdrive',
        petCount: this.pets ? this.pets.length : 0,
        petRallyCd: this.player.petRallyCd || 0,
        petRallyMax: 10,
        petRallyActive: (this.player.petRallyTimer || 0) > 0,
        isPractice: !!this.run.isPractice,
        kills: this.run.kills,
        activeEvent,
        boss: leadBoss ? {
          name: (aliveBosses.length > 1 ? `☠ TWIN BOSSES (${aliveBosses.length}) — ` : '') + leadBoss.def.name + (leadBoss.phase2 ? ' [PHASE 2]' : ''),
          hp: Math.max(0, Math.ceil(totalBossHp)),
          maxHp: Math.max(1, Math.round(totalBossMax))
        } : null
      };
    }
  });
})();
