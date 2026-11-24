// ============================================================================
// MULTI-MINE — GameEngine: enemies
// ============================================================================
(function () {
  // eslint-disable-next-line no-unused-vars
  const { ARENA_W, ARENA_H, clamp, dist2, rand, pick } = window.MM.EngineUtil;

  Object.assign(window.MM.GameEngine.prototype, {
    // ------------------------------------------------------------------------
    // ENEMY & BOSS AI
    // ------------------------------------------------------------------------
    // ---- Choreographed enemy fire ----------------------------------------
    // Every enemy shot goes through here: 30% slower (same reach), and at most
    // SHOT_CAP regular shots alive at once so late waves stay readable.
    // Bosses are exempt from the cap so their patterns stay intact.
    fireEnemyShot(s) {
      const SHOT_SPEED = 0.7;
      const SHOT_CAP = 18;
      if (!s.boss) {
        let regular = 0;
        for (let i = 0; i < this.enemyShots.length; i++) if (!this.enemyShots[i].boss) regular++;
        if (regular >= SHOT_CAP) return false;
      }
      s.vx *= SHOT_SPEED;
      s.vy *= SHOT_SPEED;
      s.life /= SHOT_SPEED;
      this.enemyShots.push(s);
      return true;
    },

    updateEnemies(dt) {
      const p = this.player;
      const syn = this.synergies.bonuses;
      // ranged enemies only start an attack on a shared beat (every 0.8s),
      // so shots arrive in readable volleys instead of a constant spray
      const beat = Math.floor(this.waveElapsed / 0.8);
      const onBeat = beat !== this._lastShotBeat;
      this._lastShotBeat = beat;

      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (e.dead) { this.enemies.splice(i, 1); continue; }

        if (e.hpTrail > e.hp) {
          e.hpTrail = Math.max(e.hp, e.hpTrail - Math.max(25, (e.hpTrail - e.hp) * 5) * dt);
        }

        e.spawnT = Math.min(1, e.spawnT + dt * 4.2);
        if (e.hitFlash > 0) e.hitFlash -= dt;
        if (e.shredTimer > 0) e.shredTimer -= dt;
        if (e.chillTimer > 0) e.chillTimer -= dt;
        e.knockRot *= Math.pow(0.02, dt);

        if (e.stunTimer > 0) {
          e.stunTimer -= dt;
          e.vx *= 0.85;
          e.vy *= 0.85;
          e.x = clamp(e.x + e.vx * dt, 52, ARENA_W - 52);
          e.y = clamp(e.y + e.vy * dt, 52, ARENA_H - 52);
          continue;
        }

        if (e.burnTimer > 0) {
          e.burnTimer -= dt;
          e._burnTick = (e._burnTick || 0) - dt * (syn.spreadBurn ? 1.8 : 1.0);
          if (e._burnTick <= 0) {
            e._burnTick = 0.45;
            const bDmg = Math.max(1, Math.round(e.burnDps * 0.45));
            e.hp -= bDmg;
            this.addText(e.x + rand(-6, 6), e.y - e.radius, `${bDmg}`, '#FF8A65', 12);
            if (e.hp <= 0) { this.killEnemy(e); continue; }
          }
        }

        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        e.facing = dx >= 0 ? 1 : -1;
        const moveMult = e.chillTimer > 0 ? 0.62 : 1.0;

        const beh = e.def.behavior;
        if (beh === 'charger') {
          e.aiTimer -= dt;
          if (e.aiState === 'move') {
            e.x += (dx / d) * e.speed * moveMult * dt;
            e.y += (dy / d) * e.speed * moveMult * dt;
            if (e.aiTimer <= 0 && d < 390) {
              e.aiState = 'windup';
              e.aiTimer = 0.92;
              e.chargeDx = dx / d;
              e.chargeDy = dy / d;
              this.telegraphs.push({
                kind: 'line', x1: e.x, y1: e.y,
                x2: e.x + e.chargeDx * 350, y2: e.y + e.chargeDy * 350,
                life: 0.92, maxLife: 0.92, color: '#E8483F'
              });
            }
          } else if (e.aiState === 'windup') {
            if (e.aiTimer <= 0) { e.aiState = 'charge'; e.aiTimer = 0.65; }
          } else if (e.aiState === 'charge') {
            e.x += e.chargeDx * e.speed * 2.85 * moveMult * dt;
            e.y += e.chargeDy * e.speed * 2.85 * moveMult * dt;
            if (Math.random() < 0.45) {
              this.spawnFx('fx:smoke_puff', e.x - e.chargeDx * 16, e.y - e.chargeDy * 16, { size: 22, life: 0.25, scaleEnd: 1.35 });
            }
            if (e.aiTimer <= 0) { e.aiState = 'move'; e.aiTimer = rand(2.3, 3.2); }
          }
        } else if (beh === 'spitter' || beh === 'cryo_spitter') {
          if (e.holdT > 0) e.holdT -= dt; // planted while aiming
          else if (d > 230) {
            e.x += (dx / d) * e.speed * moveMult * dt;
            e.y += (dy / d) * e.speed * moveMult * dt;
          }
          e.aiTimer -= dt;
          if (e.aiTimer <= 0 && d < 500 && onBeat) {
            e.aiTimer = beh === 'cryo_spitter' ? 2.45 : 2.25;
            const shots = beh === 'cryo_spitter' ? 3 : 1;
            const col = beh === 'cryo_spitter' ? '#4AA3E8' : '#E8483F';
            const baseAng = Math.atan2(dy, dx); // locked now: step aside to dodge
            e.holdT = 0.5;
            this.telegraphs.push({
              kind: 'aim', x1: e.x, y1: e.y, ang: baseAng, spread: shots === 3 ? 0.26 : 0,
              life: 0.5, maxLife: 0.5, color: col,
              onDone: () => {
                if (e.dead) return;
                for (let s = 0; s < shots; s++) {
                  const off = shots === 3 ? (s - 1) * 0.26 : 0;
                  this.fireEnemyShot({
                    x: e.x, y: e.y,
                    vx: Math.cos(baseAng + off) * 238,
                    vy: Math.sin(baseAng + off) * 238,
                    r: 8, dmg: e.damage, color: col, life: 3.1
                  });
                }
              }
            });
          }
        } else if (beh === 'blinker') {
          e.x += (dx / d) * e.speed * moveMult * dt;
          e.y += (dy / d) * e.speed * moveMult * dt;
          e.aiTimer -= dt;
          if (e.aiTimer <= 0 && d > 130 && d < 460) {
            e.aiTimer = 3.4;
            const ang = rand(0, Math.PI * 2);
            const tx = clamp(p.x + Math.cos(ang) * 155, 70, ARENA_W - 70);
            const ty = clamp(p.y + Math.sin(ang) * 155, 70, ARENA_H - 70);
            this.telegraphs.push({
              kind: 'circle', x: tx, y: ty, r: 28, life: 0.90, maxLife: 0.90, color: '#C6A6FF',
              onDone: () => {
                if (!e.dead) { e.x = tx; e.y = ty; this.spawnFx('fx:volt_spark', tx, ty, { size: 46, life: 0.24 }); }
              }
            });
          }
        } else if (beh === 'sniper') {
          if (d > 300) { e.x += (dx / d) * e.speed * moveMult * dt; e.y += (dy / d) * e.speed * moveMult * dt; }
          e.aiTimer -= dt;
          if (e.aiTimer <= 0 && d < 560) {
            e.aiTimer = 3.5;
            const a = Math.atan2(dy, dx);
            const x2 = e.x + Math.cos(a) * 580;
            const y2 = e.y + Math.sin(a) * 580;
            this.telegraphs.push({
              kind: 'line', x1: e.x, y1: e.y, x2, y2, life: 1.28, maxLife: 1.28, color: '#E8483F',
              onDone: () => {
                if (e.dead) return;
                this.beams.push({ x1: e.x, y1: e.y, x2, y2, color: '#E8483F', width: 10, life: 0.22, maxLife: 0.22 });
                this.beams.push({ x1: e.x, y1: e.y, x2, y2, color: '#FFFFFF', width: 3.5, life: 0.22, maxLife: 0.22 });
                window.MM.Audio.SFX.zap();
                if (this.pointToSegmentDist(p.x, p.y, e.x, e.y, x2, y2) <= 20) this.damagePlayer(e.damage, e);
              }
            });
          }
        } else if (beh === 'golem') {
          e.x += (dx / d) * e.speed * moveMult * dt;
          e.y += (dy / d) * e.speed * moveMult * dt;
          e.aiTimer -= dt;
          if (e.aiTimer <= 0 && d < 280 && onBeat) {
            e.aiTimer = 3.6;
            this.telegraphs.push({
              kind: 'burst', x: e.x, y: e.y, follow: e, r: 46, life: 0.55, maxLife: 0.55, color: '#4AA3E8',
              onDone: () => {
                if (e.dead) return;
                for (let k = 0; k < 6; k++) {
                  const a = (Math.PI * 2 * k) / 6 + this.waveElapsed;
                  this.fireEnemyShot({ x: e.x, y: e.y, vx: Math.cos(a) * 152, vy: Math.sin(a) * 152, r: 8, dmg: e.damage, color: '#4AA3E8', life: 2.6 });
                }
              }
            });
          }
        } else if (beh === 'brooder') {
          e.x += (dx / d) * e.speed * moveMult * dt;
          e.y += (dy / d) * e.speed * moveMult * dt;
          e.aiTimer -= dt;
          if (e.aiTimer <= 0 && this.enemies.length < 110) {
            e.aiTimer = 4.6;
            for (let k = 0; k < 2; k++) {
              this.scheduleEnemySpawn('scrap_mite', clamp(e.x + rand(-48, 48), 70, ARENA_W - 70), clamp(e.y + rand(-48, 48), 70, ARENA_H - 70), 1.1);
            }
            this.rings.push({ x: e.x, y: e.y, r: 10, maxR: 48, color: '#C6A6FF', life: 0.3, maxLife: 0.3 });
          }
        } else if (beh === 'mortar') {
          if (d > 270) { e.x += (dx / d) * e.speed * moveMult * dt; e.y += (dy / d) * e.speed * moveMult * dt; }
          e.aiTimer -= dt;
          if (e.aiTimer <= 0 && d < 520) {
            e.aiTimer = 3.3;
            const tx = clamp(p.x + rand(-55, 55), 80, ARENA_W - 80);
            const ty = clamp(p.y + rand(-55, 55), 80, ARENA_H - 80);
            this.telegraphs.push({
              kind: 'circle', x: tx, y: ty, r: 52, life: 1.52, maxLife: 1.52, color: '#FFC233', label: 'MORTAR',
              onDone: () => {
                this.spawnFx('fx:blast_star', tx, ty, { size: 112, life: 0.35, rotSpd: 3 });
                this.rings.push({ x: tx, y: ty, r: 8, maxR: 52, color: '#E8483F', life: 0.3, maxLife: 0.3 });
                window.MM.Audio.SFX.explode();
                if (dist2(p.x, p.y, tx, ty) <= 56 * 56) this.damagePlayer(e.damage, e);
              }
            });
          }
        } else if (beh === 'wisp') {
          const zig = Math.sin(this.waveElapsed * 6 + e.uid) * 0.55;
          const a = Math.atan2(dy, dx) + zig;
          e.x += Math.cos(a) * e.speed * moveMult * dt;
          e.y += Math.sin(a) * e.speed * moveMult * dt;
          if (d < 130 && d > 24 && p.dashTimer <= 0) {
            p.x -= (dx / d) * 32 * dt;
            p.y -= (dy / d) * 32 * dt;
          }
        } else if (beh === 'weaver') {
          // VOID WEAVER: Keeps comfortable range & fires slow readable 4-way arcane pulses!
          const desired = 270;
          if (d > desired + 30) { e.x += (dx / d) * e.speed * moveMult * dt; e.y += (dy / d) * e.speed * moveMult * dt; }
          else if (d < desired - 40) { e.x -= (dx / d) * e.speed * 0.75 * moveMult * dt; e.y -= (dy / d) * e.speed * 0.75 * moveMult * dt; }
          e.aiTimer -= dt;
          if (e.aiTimer <= 0 && onBeat) {
            e.aiTimer = 2.7;
            const baseA = Math.atan2(dy, dx);
            this.telegraphs.push({
              kind: 'burst', x: e.x, y: e.y, follow: e, r: 44, life: 0.5, maxLife: 0.5, color: '#E879F9',
              onDone: () => {
                if (e.dead) return;
                for (let k = 0; k < 4; k++) {
                  const a = baseA + (Math.PI / 2) * k;
                  this.fireEnemyShot({ x: e.x, y: e.y, vx: Math.cos(a) * 165, vy: Math.sin(a) * 165, r: 8.5, dmg: e.damage, color: '#E879F9', life: 3.4 });
                }
              }
            });
          }
        } else if (beh === 'loot_goblin') {
          // GOLDEN CARGO-BOT: Sprints around the arena fleeing the player for 12s before warping out!
          e.goblinLife = (e.goblinLife !== undefined ? e.goblinLife : 12.5) - dt;
          if (e.goblinLife <= 0) {
            this.rings.push({ x: e.x, y: e.y, r: 6, maxR: 60, color: '#FFE07A', life: 0.32, maxLife: 0.32 });
            this.addText(e.x, e.y - 30, 'CARGO-BOT WARPED!', '#FFE07A', 14);
            e.dead = true;
            continue;
          }
          // Flee player while steering away from arena edges
          let fx = -dx / d;
          let fy = -dy / d;
          if (e.x < 220) fx += 1.4;
          if (e.x > ARENA_W - 220) fx -= 1.4;
          if (e.y < 220) fy += 1.4;
          if (e.y > ARENA_H - 220) fy -= 1.4;
          const fl = Math.hypot(fx, fy) || 1;
          e.x += (fx / fl) * e.speed * moveMult * dt;
          e.y += (fy / fl) * e.speed * moveMult * dt;
          e.aiTimer -= dt;
          if (e.aiTimer <= 0) {
            e.aiTimer = 0.65;
            this.pickups.push({ kind: 'scrap', x: e.x, y: e.y, scrap: 1, xp: 1, bob: rand(0, 6) });
          }
        } else if (beh === 'elite_dreadnought') {
          e.x += (dx / d) * e.speed * moveMult * dt;
          e.y += (dy / d) * e.speed * moveMult * dt;
          e.aiTimer -= dt;
          if (e.aiTimer <= 0 && onBeat) {
            e.aiTimer = 2.6;
            this.telegraphs.push({
              kind: 'burst', x: e.x, y: e.y, follow: e, r: 64, life: 0.6, maxLife: 0.6, color: '#FFE07A',
              onDone: () => {
                if (e.dead) return;
                const shots = 10;
                for (let k = 0; k < shots; k++) {
                  const a = (Math.PI * 2 * k) / shots + this.waveElapsed;
                  this.fireEnemyShot({ x: e.x, y: e.y, vx: Math.cos(a) * 188, vy: Math.sin(a) * 188, r: 9, dmg: e.damage, color: '#FFE07A', life: 3.3 });
                }
              }
            });
          }
        } else if (e.isBoss) {
          this.updateBossAI(e, dx, dy, d, moveMult, dt);
        } else {
          e.x += (dx / d) * e.speed * moveMult * dt;
          e.y += (dy / d) * e.speed * moveMult * dt;
        }

        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.vx *= Math.pow(0.08, dt);
        e.vy *= Math.pow(0.08, dt);

        for (let j = i - 1; j >= Math.max(0, i - 12); j--) {
          const o = this.enemies[j];
          if (o.dead) continue;
          const sdx = e.x - o.x;
          const sdy = e.y - o.y;
          const minD = e.radius + o.radius;
          const sd2 = sdx * sdx + sdy * sdy;
          if (sd2 > 0.1 && sd2 < minD * minD) {
            const sd = Math.sqrt(sd2);
            const push = (minD - sd) * 0.35;
            const nx = sdx / sd;
            const ny = sdy / sd;
            if (!e.isBoss) { e.x += nx * push; e.y += ny * push; }
            if (!o.isBoss) { o.x -= nx * push; o.y -= ny * push; }
          }
        }

        e.x = clamp(e.x, 52, ARENA_W - 52);
        e.y = clamp(e.y, 52, ARENA_H - 52);

        if (e.spawnT > 0.6 && dist2(e.x, e.y, p.x, p.y) <= (e.radius + 17) ** 2) {
          this.damagePlayer(e.damage, e);
        }
      }
    },

    updateBossAI(b, dx, dy, d, moveMult, dt) {
      const p = this.player;
      // PHASE 2 BOSS ENRAGE AT 50% HP!
      if (!b.phase2 && b.hp <= b.maxHp * 0.5) {
        b.phase2 = true;
        b.speed *= 1.24;
        this.cam.shake = Math.max(this.cam.shake, 11);
        this.rings.push({ x: b.x, y: b.y, r: 24, maxR: 280, color: '#E8483F', life: 0.6, maxLife: 0.6 });
        this.addText(b.x, b.y - 72, '★ PHASE 2 — ENRAGED!', '#E8483F', 19);
        window.MM.Audio.SFX.bossWarn();
        for (let k = 0; k < 14; k++) {
          const a = (Math.PI * 2 * k) / 14;
          this.fireEnemyShot({ x: b.x, y: b.y, vx: Math.cos(a) * 205, vy: Math.sin(a) * 205, r: 9.5, dmg: b.damage, boss: true, color: '#FFE07A', life: 3.5 });
        }
      }
      b.aiTimer -= dt * (b.phase2 ? 1.25 : 1.0);

      if (b.def.behavior === 'boss_excavator') {
        if (b.aiState === 'move') {
          b.x += (dx / d) * b.speed * moveMult * dt;
          b.y += (dy / d) * b.speed * moveMult * dt;
          if (b.aiTimer <= 0) {
            if (Math.random() < 0.55) {
              b.aiState = 'windup';
              b.aiTimer = 1.30;
              b.chargeDx = dx / d;
              b.chargeDy = dy / d;
              this.telegraphs.push({
                kind: 'line', x1: b.x, y1: b.y,
                x2: b.x + b.chargeDx * 480, y2: b.y + b.chargeDy * 480,
                life: 1.30, maxLife: 1.30, color: '#E8483F'
              });
            } else {
              b.aiTimer = 2.6;
              this.spawnFx('fx:seismic_crack', b.x, b.y, { size: 140, life: 0.42, ground: true, maxAlpha: 0.8 });
              for (let k = 0; k < 12; k++) {
                const ang = (Math.PI * 2 * k) / 12 + this.waveElapsed;
                this.fireEnemyShot({ x: b.x, y: b.y, vx: Math.cos(ang) * 195, vy: Math.sin(ang) * 195, r: 9, dmg: b.damage, boss: true, color: '#E8483F', life: 3.4 });
              }
              this.rings.push({ x: b.x, y: b.y, r: 20, maxR: 140, color: '#FFC233', life: 0.4, maxLife: 0.4 });
            }
          }
        } else if (b.aiState === 'windup') {
          if (b.aiTimer <= 0) { b.aiState = 'charge'; b.aiTimer = 0.88; window.MM.Audio.SFX.seismic(); }
        } else if (b.aiState === 'charge') {
          b.x += b.chargeDx * 350 * dt;
          b.y += b.chargeDy * 350 * dt;
          if (Math.random() < 0.6) this.spawnFx('fx:smoke_puff', b.x, b.y + 18, { size: 36, life: 0.35, scaleEnd: 1.5 });
          if (b.aiTimer <= 0) { b.aiState = 'move'; b.aiTimer = 2.5; }
        }
      } else if (b.def.behavior === 'boss_pyroclast') {
        b.x += (dx / d) * b.speed * moveMult * dt;
        b.y += (dy / d) * b.speed * moveMult * dt;
        if (b.aiTimer <= 0) {
          b.aiTimer = 2.6;
          if (Math.random() < 0.5) {
            for (let k = 0; k < 4; k++) {
              const tx = clamp(p.x + rand(-160, 160), 85, ARENA_W - 85);
              const ty = clamp(p.y + rand(-160, 160), 85, ARENA_H - 85);
              this.telegraphs.push({
                kind: 'circle', x: tx, y: ty, r: 64, life: 1.42, maxLife: 1.42, color: '#E8483F', label: 'MAGMA',
                onDone: () => {
                  this.spawnFx('fx:blast_star', tx, ty, { size: 138, life: 0.38, rotSpd: 3 });
                  this.spawnFx('fx:smoke_puff', tx, ty - 16, { size: 50, life: 0.55, vy: -30, scaleEnd: 1.5 });
                  this.spawnDecal('scorch', tx, ty, 54);
                  this.rings.push({ x: tx, y: ty, r: 10, maxR: 64, color: '#FFC233', life: 0.35, maxLife: 0.35 });
                  window.MM.Audio.SFX.explode();
                  if (dist2(p.x, p.y, tx, ty) <= 66 * 66) this.damagePlayer(b.damage);
                }
              });
            }
          } else {
            for (let k = 0; k < 14; k++) {
              const ang = (Math.PI * 2 * k) / 14 + this.waveElapsed;
              this.fireEnemyShot({ x: b.x, y: b.y, vx: Math.cos(ang) * 200, vy: Math.sin(ang) * 200, r: 9, dmg: b.damage, boss: true, color: '#E8483F', life: 3.5 });
            }
          }
        }
      } else if (b.def.behavior === 'boss_quantum') {
        const desiredD = 245;
        const dir = d > desiredD ? 1 : -0.4;
        b.x += (dx / d) * b.speed * dir * moveMult * dt;
        b.y += (dy / d) * b.speed * dir * moveMult * dt;
        if (b.aiTimer <= 0) {
          b.aiTimer = 2.55;
          const roll = Math.random();
          if (roll < 0.38) {
            const baseA = Math.atan2(dy, dx);
            for (let k = 0; k < 4; k++) {
              const a = baseA + (Math.PI / 2) * k;
              const x2 = b.x + Math.cos(a) * 720;
              const y2 = b.y + Math.sin(a) * 720;
              this.telegraphs.push({
                kind: 'line', x1: b.x, y1: b.y, x2, y2, life: 1.35, maxLife: 1.35, color: '#9B6BE0',
                onDone: () => {
                  this.beams.push({ x1: b.x, y1: b.y, x2, y2, color: '#9B6BE0', width: 14, life: 0.28, maxLife: 0.28 });
                  this.beams.push({ x1: b.x, y1: b.y, x2, y2, color: '#FFFFFF', width: 5, life: 0.28, maxLife: 0.28 });
                  window.MM.Audio.SFX.zap();
                  if (this.pointToSegmentDist(p.x, p.y, b.x, b.y, x2, y2) <= 25) this.damagePlayer(b.damage);
                }
              });
            }
          } else if (roll < 0.72) {
            for (let k = 0; k < 16; k++) {
              const ang = (Math.PI * 2 * k) / 16 + this.waveElapsed;
              this.fireEnemyShot({ x: b.x, y: b.y, vx: Math.cos(ang) * 210, vy: Math.sin(ang) * 210, r: 9, dmg: b.damage, boss: true, color: '#9B6BE0', life: 3.7 });
            }
          } else {
            const tx = clamp(p.x + rand(-240, 240), 120, ARENA_W - 120);
            const ty = clamp(p.y + rand(-200, 200), 120, ARENA_H - 120);
            this.telegraphs.push({
              kind: 'circle', x: tx, y: ty, r: 72, life: 1.25, maxLife: 1.25, color: '#5BD6A0', label: 'WARP',
              onDone: () => {
                if (!b.dead) {
                  b.x = tx; b.y = ty;
                  this.spawnFx('fx:volt_spark', tx, ty, { size: 150, life: 0.4 });
                  this.rings.push({ x: tx, y: ty, r: 12, maxR: 96, color: '#9B6BE0', life: 0.4, maxLife: 0.4 });
                  if (dist2(p.x, p.y, tx, ty) <= 78 * 78) this.damagePlayer(b.damage);
                }
              }
            });
          }
        }
      }
    },

    updateEnemyShots(dt) {
      const p = this.player;
      for (let i = this.enemyShots.length - 1; i >= 0; i--) {
        const s = this.enemyShots[i];
        s.life -= dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (dist2(s.x, s.y, p.x, p.y) <= (s.r + 14) ** 2) {
          this.damagePlayer(s.dmg);
          this.enemyShots.splice(i, 1);
          continue;
        }
        if (s.life <= 0 || s.x < 24 || s.x > ARENA_W - 24 || s.y < 24 || s.y > ARENA_H - 24) {
          this.enemyShots.splice(i, 1);
        }
      }
    },

    updateTelegraphs(dt) {
      for (let i = this.telegraphs.length - 1; i >= 0; i--) {
        const t = this.telegraphs[i];
        if (t.follow && !t.follow.dead) { t.x = t.follow.x; t.y = t.follow.y; }
        t.life -= dt;
        if (t.life <= 0) {
          if (t.onDone) t.onDone();
          this.telegraphs.splice(i, 1);
        }
      }
    }
  });
})();
