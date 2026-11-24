// ============================================================================
// MULTI-MINE — GameEngine: abilities
// ============================================================================
(function () {
  // eslint-disable-next-line no-unused-vars
  const { ARENA_W, ARENA_H, clamp, dist2, rand, pick } = window.MM.EngineUtil;

  Object.assign(window.MM.GameEngine.prototype, {
    // ------------------------------------------------------------------------
    // PET COMMAND: [F] RALLY & FOCUS-FIRE TARGET!
    // ------------------------------------------------------------------------
    triggerPetRally() {
      if (this.state !== 'playing' || this.waveEnding) return;
      if (!this.pets || this.pets.length === 0) return;
      const p = this.player;
      if (p.petRallyCd > 0) return;

      // Pick highest-priority target: Boss > Elite > Highest-HP enemy within 760px
      let best = null;
      let bestScore = -1;
      this.enemies.forEach((e) => {
        if (e.dead) return;
        const d2 = dist2(p.x, p.y, e.x, e.y);
        if (d2 > 760 * 760) return;
        const prio = e.isBoss ? 1000000 : (e.def && e.def.isElite ? 500000 : 0);
        const score = prio + e.hp - Math.sqrt(d2) * 0.25;
        if (score > bestScore) { bestScore = score; best = e; }
      });

      p.petRallyCd = 10.0;
      p.petRallyTimer = 5.5;
      this.petRallyTarget = best;
      window.MM.Audio.SFX.pet();
      this.rings.push({ x: p.x, y: p.y, r: 10, maxR: 120, color: '#5FE3B8', life: 0.36, maxLife: 0.36 });
      if (best) {
        this.rings.push({ x: best.x, y: best.y, r: best.radius + 32, maxR: best.radius + 4, color: '#FFE07A', life: 0.35, maxLife: 0.35 });
        this.addText(best.x, best.y - best.radius - 28, '🎯 PET RALLY!', '#5FE3B8', 16);
        this.pets.forEach((pet) => {
          this.beams.push({ x1: pet.x, y1: pet.y, x2: best.x, y2: best.y, color: '#5FE3B8', width: 2.5, life: 0.22, maxLife: 0.22 });
        });
      } else {
        this.addText(p.x, p.y - 58, '🐾 PACK RALLY! (+35% DMG/SPD)', '#5FE3B8', 15);
      }
    },

    // ------------------------------------------------------------------------
    // PLAYER MOVEMENT & JET-DASH
    // ------------------------------------------------------------------------
    triggerDash() {
      const p = this.player;
      if (p.dashCd > 0 || p.dashTimer > 0 || this.waveEnding) return;
      let dx = 0;
      let dy = 0;
      if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
      if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
      if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
      if (this.keys['d'] || this.keys['arrowright']) dx += 1;
      if (dx === 0 && dy === 0 && this.touchMove && this.touchMove.active && Math.hypot(this.touchMove.dx, this.touchMove.dy) > 0.15) {
        dx = this.touchMove.dx;
        dy = this.touchMove.dy;
      }
      if (dx === 0 && dy === 0 && this.padMove && Math.hypot(this.padMove.dx, this.padMove.dy) > 0.15) {
        dx = this.padMove.dx;
        dy = this.padMove.dy;
      }
      if (dx === 0 && dy === 0) {
        dx = Math.abs(p.vx) > 5 ? p.vx : p.facing;
        dy = Math.abs(p.vy) > 5 ? p.vy : 0;
      }
      const len = Math.hypot(dx, dy) || 1;
      p.dashDx = dx / len;
      p.dashDy = dy / len;
      p.dashTimer = 0.20;
      p.invuln = Math.max(p.invuln, 0.24);
      p.dashCd = this.stats.dashCd;
      window.MM.Audio.SFX.dash();
      this.rumbleGamepad(70, 0.18, 0.12);

      this.spawnFx('fx:smoke_puff', p.x - p.dashDx * 14, p.y + 8, { size: 46, life: 0.4, vx: -p.dashDx * 65, vy: -p.dashDy * 65 - 14, scaleEnd: 1.5 });
      this.spawnDebris(p.x, p.y + 14, ['#5BD6A0', '#E8EEF2', '#FFE07A'], 6, 150);
      this.rings.push({ x: p.x, y: p.y + 8, r: 10, maxR: 52, color: '#5BD6A0', life: 0.28, maxLife: 0.28 });

      if (this.run.charDef.perks && this.run.charDef.perks.dashShockwave) {
        this.triggerSeismicWave(p.x, p.y, 134 * this.getAreaMult(), 24 + this.stats.engineering * 1.4, true);
      }
      if (this.run.charDef.perks && this.run.charDef.perks.dashAspdBuff) {
        p.ultOverdriveTimer = Math.max(p.ultOverdriveTimer, 2.5);
        p.ultOverdriveAmt = Math.max(p.ultOverdriveAmt || 0, 40);
        this.recomputeStats();
        this.addText(p.x, p.y - 58, '+40% PHANTOM SPD!', '#C084FC', 13);
      }
      if (this.run.charDef.perks && this.run.charDef.perks.dashFreeze) {
        const fr = 190 * this.getAreaMult();
        this.rings.push({ x: p.x, y: p.y, r: 12, maxR: fr, color: '#FFE07A', life: 0.36, maxLife: 0.36 });
        this.enemies.forEach((e) => {
          if (!e.dead && dist2(e.x, e.y, p.x, p.y) <= (fr + e.radius) ** 2) {
            e.stunTimer = Math.max(e.stunTimer, e.isBoss ? 0.6 : 1.8);
            e.chillTimer = Math.max(e.chillTimer, 2.6);
          }
        });
        window.MM.Audio.SFX.cryo();
      }
      if (this.run.specials.adrenaline > 0) {
        const heal = 3 * this.run.specials.adrenaline;
        p.hp = Math.min(this.stats.maxHp, p.hp + heal);
        p.hasteTimer = Math.max(p.hasteTimer, 2.0);
        this.addText(p.x, p.y - 62, `+${heal} ADRENALINE`, '#5BD6A0', 13);
      }
      if (this.run.specials.dashMine > 0) {
        const mDef = window.MM.getContraption('prox_mine');
        this.deployables.push({
          slotUid: -88, slot: { tier: 1 }, def: mDef, kind: 'mine',
          x: p.x, y: p.y, dmg: (24 + this.stats.engineering * 1.2) * this.run.specials.dashMine,
          radius: 78 * this.getAreaMult(), armTimer: 0.25, spawnT: 0, recoil: 0, life: 14, pulse: 0
        });
      }
      if (this.run.specials.dashMines > 0) {
        const mDef = window.MM.getContraption('prox_mine');
        for (let k = -1; k <= 1; k += 2) {
          this.deployables.push({
            slotUid: -89, slot: { tier: 1 }, def: mDef, kind: 'mine',
            x: clamp(p.x + k * 24, 60, ARENA_W - 60), y: clamp(p.y + rand(-14, 14), 60, ARENA_H - 60),
            dmg: (22 + this.stats.engineering * 1.15) * this.run.specials.dashMines,
            radius: 82 * this.getAreaMult(), armTimer: 0.22, spawnT: 0, recoil: 0, life: 13, pulse: 0
          });
        }
      }
      if (this.run.specials.dashLightning) {
        const targets = this.findNearestEnemies(p.x, p.y, 270, 5);
        targets.forEach((e) => {
          this.dealDamage(e, 28 + this.stats.engineering * 1.5, ['VOLTAIC'], true);
          this.beams.push({ x1: p.x, y1: p.y, x2: e.x, y2: e.y, color: '#4AA3E8', width: 4.5, life: 0.24, maxLife: 0.24, jagged: true });
          this.spawnFx('fx:volt_spark', e.x, e.y, { size: 44, life: 0.26, rotSpd: 4 });
        });
        if (targets.length) window.MM.Audio.SFX.zap();
      }
    },

    // ========================================================================
    // ULTIMATE CHARGE HELPER (Fires unmistakable SFX + visual alert at 100%!)
    // ========================================================================
    addUltCharge(amount) {
      const p = this.player;
      if (!p || amount <= 0 || p.ultCharge >= 100) return;
      const sp = (this.run && this.run.specials) || {};
      const psBoost = (this.petSynergies && this.petSynergies.cosmicFleet) ? 0.20 : 0;
      const boost = 1 + (sp.ultChargeBoost || 0) * 0.35 + (sp.ultReset || 0) * 0.25 + psBoost;
      const prev = p.ultCharge;
      p.ultCharge = Math.min(100, p.ultCharge + amount * boost);
      if (prev < 100 && p.ultCharge >= 100) {
        window.MM.Audio.SFX.ultReady();
        this.rings.push({ x: p.x, y: p.y, r: 12, maxR: 112, color: '#FFE07A', life: 0.48, maxLife: 0.48 });
        this.rings.push({ x: p.x, y: p.y, r: 8, maxR: 72, color: '#5FE3B8', life: 0.36, maxLife: 0.36 });
        this.addText(p.x, p.y - 68, '★ [E] ULTIMATE READY!', '#FFE07A', 17);
      }
    },

    // ========================================================================
    // UNIQUE [E] / [Q] OVERDRIVE ULTIMATE PER ALIEN ENGINEER!
    // ========================================================================
    triggerUltimate() {
      const p = this.player;
      if (this.state !== 'playing' || this.waveEnding || p.ultCharge < 100) return;
      const ult = this.run.charDef.ultimate;
      if (!ult) return;

      p.ultCharge = 0;
      if (this.run.specials && this.run.specials.ultReset > 0) {
        p.dashCd = 0;
        const healAmt = 15 * this.run.specials.ultReset;
        p.hp = Math.min(this.stats.maxHp, p.hp + healAmt);
        this.addText(p.x, p.y - 96, `+${healAmt} HP • DASH RESET!`, '#5FE3B8', 14);
      }
      this.rumbleGamepad(210, 0.45, 0.65);
      const prevSrc = this._dmgSource;
      this._dmgSource = `★ ${ult.name}`;
      const eng = this.stats.engineering || 0;
      const dmgMult = Math.max(0.5, 1 + this.stats.damagePct / 100);
      const area = this.getAreaMult();

      this.cam.shake = Math.max(this.cam.shake, 9);
      this.rings.push({ x: p.x, y: p.y, r: 16, maxR: 260, color: this.run.charDef.accent || '#FFE07A', life: 0.55, maxLife: 0.55 });
      this.addText(p.x, p.y - 72, `★ ${ult.name.toUpperCase()}!`, '#FFE07A', 18);
      window.MM.Audio.SFX.ultimate();

      switch (ult.id) {
        case 'orbital_barrage': {
          const targets = this.findNearestEnemies(p.x, p.y, 680, 7);
          for (let k = 0; k < 7; k++) {
            const t = targets[k];
            const tx = t ? t.x : clamp(p.x + rand(-260, 260), 90, ARENA_W - 90);
            const ty = t ? t.y : clamp(p.y + rand(-220, 220), 90, ARENA_H - 90);
            const r = 82 * area;
            this.beams.push({ x1: tx, y1: ty - 520, x2: tx, y2: ty, color: '#4AA3E8', width: 22, life: 0.4, maxLife: 0.4 });
            this.beams.push({ x1: tx, y1: ty - 520, x2: tx, y2: ty, color: '#FFFFFF', width: 8, life: 0.4, maxLife: 0.4 });
            this.spawnFx('fx:volt_spark', tx, ty, { size: r * 2, life: 0.36 });
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, tx, ty) <= (r + e.radius) ** 2) {
                this.dealDamage(e, (62 + eng * 2.2) * dmgMult, ['ORBITAL', 'VOLTAIC'], true);
              }
            });
          }
          break;
        }
        case 'caldera_eruption': {
          for (let k = 0; k < 5; k++) {
            const ang = (Math.PI * 2 * k) / 5;
            const vx = clamp(p.x + Math.cos(ang) * 155, 85, ARENA_W - 85);
            const vy = clamp(p.y + Math.sin(ang) * 155, 85, ARENA_H - 85);
            this.hazards.push({
              kind: 'lava', x: vx, y: vy, radius: 86 * area, dmg: (26 + eng * 1.3) * dmgMult,
              tick: 0, smokeCd: 0.2, spawnT: 0, life: 6.0, maxLife: 6.0, tags: ['THERMAL'], source: this._dmgSource
            });
            this.spawnFx('fx:blast_star', vx, vy, { size: 150, life: 0.42, rotSpd: 3 });
          }
          this.enemies.forEach((e) => {
            if (!e.dead && dist2(e.x, e.y, p.x, p.y) <= 420 * 420) {
              this.dealDamage(e, (45 + eng * 1.6) * dmgMult, ['THERMAL'], false);
              this.applyBurn(e, 24 + eng, 5.0);
            }
          });
          break;
        }
        case 'turret_overdrive': {
          const tDef = window.MM.getContraption('gear_turret');
          for (let k = 0; k < 4; k++) {
            const a = (Math.PI * 2 * k) / 4;
            this.deployables.push({
              slotUid: -501, slot: { tier: 3 }, def: tDef, kind: 'turret_gear',
              x: clamp(p.x + Math.cos(a) * 90, 72, ARENA_W - 72),
              y: clamp(p.y + Math.sin(a) * 90, 72, ARENA_H - 72),
              dmg: (28 + eng * 1.4) * dmgMult, range: 360, fireCd: 0.15, healCd: 9,
              spawnT: 0, recoil: 0, life: 14, angle: 0, source: this._dmgSource
            });
          }
          p.ultOverdriveTimer = 5.0;
          p.ultOverdriveAmt = 60;
          this.recomputeStats();
          break;
        }
        case 'carpet_mines': {
          const mDef = window.MM.getContraption('prox_mine');
          for (let k = 0; k < 10; k++) {
            const a = (Math.PI * 2 * k) / 10;
            this.deployables.push({
              slotUid: -502, slot: { tier: 3 }, def: mDef, kind: 'mine',
              x: clamp(p.x + Math.cos(a) * 125, 64, ARENA_W - 64),
              y: clamp(p.y + Math.sin(a) * 125, 64, ARENA_H - 64),
              dmg: (48 + eng * 1.8) * dmgMult, radius: 95 * area,
              armTimer: 0.2, spawnT: 0, recoil: 0, life: 14, pulse: 0, source: this._dmgSource
            });
          }
          this.triggerSeismicWave(p.x, p.y, 190 * area, (44 + eng * 1.4) * dmgMult, true, ['MINES']);
          break;
        }
        case 'tesla_storm': {
          const targets = this.findNearestEnemies(p.x, p.y, 620, 14);
          targets.forEach((e) => {
            this.dealDamage(e, (52 + eng * 1.9) * dmgMult, ['VOLTAIC'], true);
            this.beams.push({ x1: p.x, y1: p.y, x2: e.x, y2: e.y, color: '#9B6BE0', width: 5, life: 0.3, maxLife: 0.3, jagged: true });
            this.spawnFx('fx:volt_spark', e.x, e.y, { size: 52, life: 0.28, rotSpd: 4 });
          });
          break;
        }
        case 'mega_quake': {
          [160, 240, 320].forEach((rad) => {
            this.triggerSeismicWave(p.x, p.y, rad * area, (34 + eng * 1.2) * dmgMult, true, ['SEISMIC']);
          });
          this.enemies.forEach((e) => { if (!e.dead) e.shredTimer = Math.max(e.shredTimer, 6.0); });
          break;
        }
        case 'flash_freeze': {
          this.spawnFx('fx:cryo_burst', p.x, p.y, { size: 320, life: 0.5, rotSpd: 2 });
          this.enemies.forEach((e) => {
            if (!e.dead && dist2(e.x, e.y, p.x, p.y) <= 580 * 580) {
              this.dealDamage(e, (38 + eng * 1.5) * dmgMult, ['VOLTAIC'], false);
              e.chillTimer = Math.max(e.chillTimer, 4.5);
              if (!e.isBoss) e.stunTimer = Math.max(e.stunTimer, 2.2);
            }
          });
          for (let k = 0; k < 16; k++) {
            const a = (Math.PI * 2 * k) / 16;
            this.projectiles.push({
              kind: 'ice', x: p.x, y: p.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520,
              dmg: (28 + eng * 1.1) * dmgMult, radius: 9, pierce: 3, hitIds: new Set(), life: 1.0, tags: ['VOLTAIC'], source: this._dmgSource
            });
          }
          break;
        }
        case 'nano_printer': {
          for (let k = 0; k < 16; k++) {
            const a = (Math.PI * 2 * k) / 16;
            this.projectiles.push({
              kind: 'nanobot', x: p.x, y: p.y, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340,
              dmg: (32 + eng * 1.3) * dmgMult, radius: 9, life: 3.2, tags: ['ROBOTICS', 'VOLTAIC'], source: this._dmgSource
            });
          }
          this.pickups.push({ kind: 'fruit', x: p.x + 28, y: p.y, heal: 10, bob: 0 });
          break;
        }
        case 'scrap_cyclone': {
          for (let k = 0; k < 10; k++) {
            const a = (Math.PI * 2 * k) / 10;
            this.projectiles.push({
              kind: 'saw', x: p.x, y: p.y, vx: Math.cos(a) * 500, vy: Math.sin(a) * 500,
              dmg: (38 + eng * 1.3) * dmgMult, radius: 22, bounces: 4, life: 3.4, rot: 0,
              hitCooldowns: new Map(), tags: ['SEISMIC'], source: this._dmgSource
            });
          }
          this.pickups.forEach((pk) => { if (pk.kind === 'scrap' || pk.kind === 'fruit') pk.superPull = true; });
          break;
        }
        case 'singularity_collapse': {
          this.enemyShots = [];
          for (let k = 0; k < 2; k++) {
            const gx = clamp(p.x + (k === 0 ? -160 : 160), 100, ARENA_W - 100);
            this.hazards.push({
              kind: 'gravity', x: gx, y: p.y, radius: 155 * area, dmg: (55 + eng * 1.8) * dmgMult,
              tick: 0, life: 3.5, maxLife: 3.5, tags: ['ORBITAL'], source: this._dmgSource
            });
          }
          p.ultOverdriveTimer = 5.0;
          p.ultOverdriveAmt = 50;
          this.recomputeStats();
          break;
        }
        case 'all_hands_barrage': {
          this.run.tools.forEach((t) => { t.cdTimer = 0; });
          p.ultOverdriveTimer = 4.5;
          p.ultOverdriveAmt = 85;
          this.recomputeStats();
          break;
        }
        case 'pack_frenzy': {
          p.petFrenzyTimer = 6.0;
          p.hp = Math.min(this.stats.maxHp, p.hp + 18);
          this.addText(p.x, p.y - 52, '+18 HP PACK FRENZY!', '#2DD4BF', 15);
          break;
        }
        case 'aegis_repulsor': {
          p.shield = Math.min(80, p.shield + 45);
          this.enemyShots = [];
          this.enemies.forEach((e) => {
            if (!e.dead && !e.isBoss) {
              const a = Math.atan2(e.y - p.y, e.x - p.x);
              e.vx += Math.cos(a) * 680;
              e.vy += Math.sin(a) * 680;
              e.stunTimer = Math.max(e.stunTimer, 1.4);
            }
          });
          this.rings.push({ x: p.x, y: p.y, r: 16, maxR: 360, color: '#9CD3FF', life: 0.5, maxLife: 0.5 });
          break;
        }
        case 'abyssal_overload': {
          const cDmg = (58 + (this.stats.curseLevel || 1) * 24 + eng * 1.6) * dmgMult;
          const r = 270 * area;
          this.spawnFx('fx:volt_spark', p.x, p.y, { size: r * 1.7, life: 0.45, rotSpd: -4 });
          this.rings.push({ x: p.x, y: p.y, r: 16, maxR: r, color: '#C084FC', life: 0.45, maxLife: 0.45 });
          this.enemies.forEach((e) => {
            if (!e.dead && dist2(e.x, e.y, p.x, p.y) <= (r + e.radius) ** 2) {
              this.dealDamage(e, cDmg, ['VOLTAIC', 'MINES'], true);
            }
          });
          p.ultCritTimer = 5.0;
          this.recomputeStats();
          break;
        }
        case 'void_blink': {
          // Vexis: 12 piercing guaranteed-crit plasma bolts + 2.2s invulnerability + +40% Crit!
          p.invuln = Math.max(p.invuln, 2.2);
          p.ultCritTimer = 4.0;
          this.recomputeStats();
          const bDmg = (42 + eng * 1.6) * dmgMult;
          for (let k = 0; k < 12; k++) {
            const ang = (Math.PI * 2 * k) / 12 + this.waveElapsed;
            this.projectiles.push({
              kind: 'bullet', x: p.x, y: p.y,
              vx: Math.cos(ang) * 640, vy: Math.sin(ang) * 640,
              dmg: bDmg, radius: 9, pierce: 5, color: '#C084FC',
              hitIds: new Set(), life: 1.0, tags: ['VOLTAIC', 'ORBITAL'], forceCrit: true
            });
          }
          this.rings.push({ x: p.x, y: p.y, r: 10, maxR: 150, color: '#C084FC', life: 0.4, maxLife: 0.4 });
          window.MM.Audio.SFX.railgun();
          break;
        }
        case 'titan_slam': {
          // Brakk: 3 giant HP-scaling quakes + +60 Energy Shield!
          p.shield = Math.min(this.stats.maxHp, p.shield + 60);
          const qDmg = (40 + this.stats.maxHp * 0.55 + eng * 1.2) * dmgMult;
          for (let k = 0; k < 3; k++) {
            this.triggerSeismicWave(p.x, p.y, (165 + k * 65) * area, qDmg, true, ['SEISMIC', 'MINES']);
          }
          break;
        }
        case 'plague_brew': {
          // Blib: 6 corrosive/molten pools + 3 +10 HP Bio-Fruits!
          const poolDmg = (26 + eng * 1.4) * dmgMult;
          for (let k = 0; k < 6; k++) {
            const ang = (Math.PI * 2 * k) / 6;
            const px = clamp(p.x + Math.cos(ang) * 145, 75, ARENA_W - 75);
            const py = clamp(p.y + Math.sin(ang) * 145, 75, ARENA_H - 75);
            this.hazards.push({
              kind: 'lava', x: px, y: py, radius: 74 * area,
              dmg: poolDmg, tick: 0, smokeCd: 0.4, spawnT: 0, life: 5.5, maxLife: 5.5, tags: ['THERMAL', 'MINES']
            });
          }
          for (let f = 0; f < 3; f++) {
            const ang = (Math.PI * 2 * f) / 3 + 0.5;
            this.pickups.push({ kind: 'fruit', x: clamp(p.x + Math.cos(ang) * 75, 70, ARENA_W - 70), y: clamp(p.y + Math.sin(ang) * 75, 70, ARENA_H - 70), heal: 10, bob: f });
          }
          window.MM.Audio.SFX.explode();
          break;
        }
        case 'gauss_exec': {
          // Kestrel: 5 guaranteed-crit piercing rail-beams onto highest-HP threats!
          const sorted = this.enemies.filter((e) => !e.dead).sort((a, b) => b.hp - a.hp).slice(0, 5);
          const rDmg = (95 + eng * 3.0) * dmgMult;
          sorted.forEach((tgt) => {
            this.dealDamage(tgt, rDmg, ['VOLTAIC', 'ORBITAL'], true);
            this.beams.push({ x1: p.x, y1: p.y, x2: tgt.x, y2: tgt.y, color: '#60EFFF', width: 10, life: 0.3, maxLife: 0.3 });
            this.beams.push({ x1: p.x, y1: p.y, x2: tgt.x, y2: tgt.y, color: '#FFFFFF', width: 3.5, life: 0.3, maxLife: 0.3 });
            this.spawnFx('fx:volt_spark', tgt.x, tgt.y, { size: 68, life: 0.3 });
          });
          window.MM.Audio.SFX.railgun();
          break;
        }
        case 'chrono_stop': {
          // Tick: Freeze ALL enemies + erase bullets for 4.0s + +75% Atk Speed!
          this.enemyShots = [];
          this.enemies.forEach((e) => {
            if (!e.dead) {
              e.stunTimer = Math.max(e.stunTimer, e.isBoss ? 1.5 : 4.0);
              e.chillTimer = Math.max(e.chillTimer, 5.0);
            }
          });
          p.ultOverdriveTimer = 5.0;
          p.ultOverdriveAmt = 75;
          this.recomputeStats();
          this.rings.push({ x: p.x, y: p.y, r: 14, maxR: 380, color: '#FFE07A', life: 0.55, maxLife: 0.55 });
          window.MM.Audio.SFX.cryo();
          break;
        }
        case 'royal_swarm': {
          // Zyrx: Launch 14 homing plasma bots + supercharge Pets & Turrets +80% (5s)!
          const botDmg = (28 + eng * 1.4) * dmgMult;
          for (let k = 0; k < 14; k++) {
            const ang = (Math.PI * 2 * k) / 14;
            this.projectiles.push({
              kind: 'nanobot', x: p.x, y: p.y,
              vx: Math.cos(ang) * 340, vy: Math.sin(ang) * 340,
              dmg: botDmg, radius: 8.5, life: 2.8, tags: ['ROBOTICS', 'ORBITAL']
            });
          }
          p.petFrenzyTimer = Math.max(p.petFrenzyTimer, 5.0);
          p.ultOverdriveTimer = 5.0;
          p.ultOverdriveAmt = 80;
          this.recomputeStats();
          window.MM.Audio.SFX.pet();
          break;
        }
      }
      this._dmgSource = prevSrc;
    },

    getAreaMult() {
      return Math.max(0.6, 1 + this.stats.areaPct / 100);
    },

    getAspdMult(tags = []) {
      let mult = Math.max(0.45, 1 + this.stats.attackSpeedPct / 100);
      if (this.player.quantumOverclockTimer > 0) mult *= 1.25;
      const perks = this.run.charDef.perks || {};
      if (perks.nonThermalAspdPenalty && !tags.includes('THERMAL')) {
        mult *= perks.nonThermalAspdPenalty;
      }
      return mult;
    }
  });
})();
