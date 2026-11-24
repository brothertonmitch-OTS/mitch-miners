// ============================================================================
// MULTI-MINE — GameEngine: events
// ============================================================================
(function () {
  // eslint-disable-next-line no-unused-vars
  const { ARENA_W, ARENA_H, clamp, dist2, rand, pick } = window.MM.EngineUtil;

  Object.assign(window.MM.GameEngine.prototype, {
    // ------------------------------------------------------------------------
    // LIVE MID-WAVE ARENA EVENTS (BEACON, GOLDEN CARGO-BOT, REACTOR SURGE, METEOR ORE!)
    // ------------------------------------------------------------------------
    initWaveEvents() {
      this.liveEvent = null;
      this.eventSchedule = [];
      const w = this.run.wave;
      if (w < 2) return;
      const dur = (this.waveCfg && this.waveCfg.duration) || 36;
      const pool = ['beacon', 'loot_goblin', 'reactor_surge', 'meteor_ore'];
      const count = this.hasModifier('event_frenzy') ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const triggerAt = count === 2
          ? (i === 0 ? dur * 0.28 : dur * 0.64)
          : dur * 0.44;
        const kind = pool[(w + i * 2 + Math.floor(Math.random() * pool.length)) % pool.length];
        this.eventSchedule.push({ kind, triggerAt, fired: false });
      }
    },

    recordEventComplete() {
      this.run.eventsCompleted = (this.run.eventsCompleted || 0) + 1;
      if (this.run.eventsCompleted >= 3) {
        this.notifyAch(window.MM.Meta.unlockAchievement('event_hunter'));
      }
    },

    triggerLiveEvent(kind) {
      const p = this.player;
      if (kind === 'beacon') {
        const bx = clamp(p.x + rand(-340, 340), 220, ARENA_W - 220);
        const by = clamp(p.y + rand(-240, 240), 200, ARENA_H - 200);
        this.liveEvent = {
          kind: 'beacon', x: bx, y: by, r: 96,
          progress: 0, life: 14, maxLife: 14
        };
        this.rings.push({ x: bx, y: by, r: 16, maxR: 120, color: '#5FE3B8', life: 0.45, maxLife: 0.45 });
        this.addText(p.x, p.y - 78, '📡 EVENT: CAPTURE OVERCLOCK BEACON!', '#5FE3B8', 16);
        window.MM.Audio.SFX.pickup(10);
      } else if (kind === 'loot_goblin') {
        const gx = p.x > ARENA_W / 2 ? 220 : ARENA_W - 220;
        const gy = p.y > ARENA_H / 2 ? 200 : ARENA_H - 200;
        const gob = this.spawnEnemy('loot_goblin', gx, gy);
        if (gob) gob.goblinLife = 13.0;
        this.addText(p.x, p.y - 78, '💰 EVENT: GOLDEN CARGO-BOT SPOTTED!', '#FFE07A', 16);
        window.MM.Audio.SFX.bossWarn();
      } else if (kind === 'reactor_surge') {
        this.liveEvent = {
          kind: 'reactor_surge', life: 10.5, maxLife: 10.5, triggered: false
        };
        this.addText(p.x, p.y - 78, '⚡ EVENT: STEP ON ANY GLOWING FLOOR HUB!', '#FFE07A', 16);
        window.MM.Audio.SFX.zap();
      } else if (kind === 'meteor_ore') {
        this.addText(p.x, p.y - 78, '☄️ EVENT: CRYSTAL ORE METEOR SHOWER!', '#FFE07A', 16);
        for (let k = 0; k < 3; k++) {
          const mx = clamp(p.x + rand(-320, 320), 180, ARENA_W - 180);
          const my = clamp(p.y + rand(-220, 220), 180, ARENA_H - 180);
          this.telegraphs.push({
            kind: 'circle', x: mx, y: my, r: 66, life: 1.35 + k * 0.25, maxLife: 1.35 + k * 0.25,
            color: '#FFE07A', label: 'ORE DROP',
            onDone: () => {
              this.spawnFx('fx:blast_star', mx, my, { size: 120, life: 0.34, rotSpd: 3 });
              this.rings.push({ x: mx, y: my, r: 10, maxR: 72, color: '#FFE07A', life: 0.32, maxLife: 0.32 });
              window.MM.Audio.SFX.seismic();
              this.enemies.forEach((e) => {
                if (!e.dead && dist2(e.x, e.y, mx, my) <= (74 + e.radius) ** 2) {
                  this.dealDamage(e, 55 + this.run.wave * 14, ['SEISMIC'], true);
                  if (!e.isBoss) e.stunTimer = Math.max(e.stunTimer, 1.5);
                }
              });
              this.arenaObjects.push({
                uid: this.nextUid(), kind: 'ore_vein', x: mx, y: my,
                hp: 45 + this.run.wave * 10, maxHp: 45 + this.run.wave * 10,
                radius: 26, hitFlash: 0, dead: false
              });
            }
          });
        }
        this.recordEventComplete();
      }
    },

    updateLiveEvents(dt) {
      if (this.waveEnding) return;
      (this.eventSchedule || []).forEach((ev) => {
        if (!ev.fired && this.waveElapsed >= ev.triggerAt) {
          ev.fired = true;
          this.triggerLiveEvent(ev.kind);
        }
      });

      const ev = this.liveEvent;
      if (!ev) return;
      ev.life -= dt;
      const p = this.player;

      if (ev.kind === 'beacon') {
        const inside = dist2(p.x, p.y, ev.x, ev.y) <= (ev.r + 18) ** 2;
        if (inside) {
          ev.progress = Math.min(1, ev.progress + dt * 0.36); // ~2.8s capture
          if (ev.progress >= 1) {
            const rewardScrap = 16 + this.run.wave * 3;
            this.run.scrap += rewardScrap;
            this.addUltCharge(100);
            p.ultOverdriveTimer = Math.max(p.ultOverdriveTimer, 4.5);
            p.ultOverdriveAmt = Math.max(p.ultOverdriveAmt || 0, 40);
            this.recomputeStats();
            this.rings.push({ x: ev.x, y: ev.y, r: 16, maxR: 220, color: '#5FE3B8', life: 0.48, maxLife: 0.48 });
            this.addText(ev.x, ev.y - 36, `📡 BEACON CAPTURED! +${rewardScrap} SCRAP & FULL ULT!`, '#5FE3B8', 17);
            window.MM.Audio.SFX.waveClear();
            this.notifyAch(window.MM.Meta.unlockAchievement('beacon_master'));
            this.recordEventComplete();
            this.liveEvent = null;
            return;
          }
        }
      } else if (ev.kind === 'reactor_surge') {
        const hubs = this.reactorHubs || [];
        for (let i = 0; i < hubs.length; i++) {
          const h = hubs[i];
          if (dist2(p.x, p.y, h.x, h.y) <= (h.r + 22) ** 2) {
            // Trigger massive Reactor Hub EMP Surge!
            this.rings.push({ x: h.x, y: h.y, r: 16, maxR: 380, color: '#FFE07A', life: 0.55, maxLife: 0.55 });
            this.rings.push({ x: h.x, y: h.y, r: 12, maxR: 260, color: '#5FE3B8', life: 0.45, maxLife: 0.45 });
            this.cam.shake = Math.max(this.cam.shake, 9);
            const empDmg = (85 + this.run.wave * 24) * Math.max(1, 1 + this.stats.damagePct / 100);
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, h.x, h.y) <= 390 * 390) {
                this.dealDamage(e, empDmg, ['VOLTAIC', 'ORBITAL'], true);
                if (!e.isBoss) e.stunTimer = Math.max(e.stunTimer, 1.4);
              }
            });
            p.ultOverdriveTimer = Math.max(p.ultOverdriveTimer, 4.5);
            p.ultOverdriveAmt = Math.max(p.ultOverdriveAmt || 0, 45);
            p.hasteTimer = Math.max(p.hasteTimer, 4.5);
            this.recomputeStats();
            this.addText(h.x, h.y - 44, '⚡ REACTOR EMP OVERLOAD! +45% ATK SPD!', '#FFE07A', 17);
            window.MM.Audio.SFX.ultimate();
            this.notifyAch(window.MM.Meta.unlockAchievement('reactor_surger'));
            this.recordEventComplete();
            this.liveEvent = null;
            return;
          }
        }
      }

      if (ev.life <= 0) {
        this.liveEvent = null;
      }
    },

    // ------------------------------------------------------------------------
    // INTERACTIVE ARENA OBJECTS (ORE VEINS, EXPLOSIVE BARRELS, LOOT PINATAS!)
    // ------------------------------------------------------------------------
    spawnInitialArenaObjects() {
      this.arenaObjects = [];
      for (let i = 0; i < 2; i++) this.spawnArenaObject('ore_vein');
      this.spawnArenaObject('explosive_barrel');
      if (this.waveCfg && this.waveCfg.isHorde) {
        this.spawnArenaObject('explosive_barrel');
        this.spawnArenaObject('loot_pinata');
      } else if (this.run.wave >= 3 && Math.random() < 0.6) {
        this.spawnArenaObject('loot_pinata');
      }
    },

    spawnArenaObject(kind) {
      if (this.arenaObjects.length >= 10) return;
      let x = ARENA_W / 2;
      let y = ARENA_H / 2;
      for (let tries = 0; tries < 12; tries++) {
        x = rand(140, ARENA_W - 140);
        y = rand(140, ARENA_H - 140);
        if (dist2(x, y, this.player.x, this.player.y) > 190 * 190) break;
      }
      const wScale = 1 + (this.run.wave - 1) * 0.22;
      const maxHp = kind === 'explosive_barrel' ? Math.round(28 * wScale) : (kind === 'loot_pinata' ? Math.round(95 * wScale) : Math.round(55 * wScale));
      this.arenaObjects.push({
        uid: this.nextUid(),
        kind, x, y,
        vx: kind === 'loot_pinata' ? rand(-70, 70) : 0,
        vy: kind === 'loot_pinata' ? rand(-70, 70) : 0,
        radius: kind === 'explosive_barrel' ? 22 : 26,
        hp: maxHp, maxHp,
        hitFlash: 0, bob: rand(0, 6), mineTick: 0, dead: false
      });
      this.rings.push({ x, y, r: 6, maxR: 48, color: kind === 'explosive_barrel' ? '#E8483F' : (kind === 'loot_pinata' ? '#FFE07A' : '#5BD6A0'), life: 0.34, maxLife: 0.34 });
    },

    updateArenaObjects(dt) {
      this.arenaObjTimer -= dt;
      if (this.arenaObjTimer <= 0) {
        this.arenaObjTimer = this.waveCfg && this.waveCfg.isHorde ? 9.5 : 13.5;
        const roll = Math.random();
        if (roll < 0.42) this.spawnArenaObject('ore_vein');
        else if (roll < 0.80) this.spawnArenaObject('explosive_barrel');
        else this.spawnArenaObject('loot_pinata');
      }

      const p = this.player;
      for (let i = this.arenaObjects.length - 1; i >= 0; i--) {
        const obj = this.arenaObjects[i];
        if (obj.dead) { this.arenaObjects.splice(i, 1); continue; }
        obj.bob += dt * 4.2;
        if (obj.hitFlash > 0) obj.hitFlash -= dt;

        // Loot Pinata hops playfully around the arena!
        if (obj.kind === 'loot_pinata') {
          obj.x += obj.vx * dt;
          obj.y += obj.vy * dt;
          if (obj.x < 100 || obj.x > ARENA_W - 100) obj.vx *= -1;
          if (obj.y < 100 || obj.y > ARENA_H - 100) obj.vy *= -1;
        }

        // Proximity Auto-Mining Laser when player stands near Ore Veins or Loot Pinatas!
        if ((obj.kind === 'ore_vein' || obj.kind === 'loot_pinata') && dist2(p.x, p.y, obj.x, obj.y) <= 135 * 135) {
          obj.mineTick -= dt;
          if (obj.mineTick <= 0) {
            obj.mineTick = 0.25;
            this.beams.push({ x1: p.x, y1: p.y, x2: obj.x, y2: obj.y, color: '#FFE07A', width: 4.5, life: 0.16, maxLife: 0.16 });
            this.damageArenaObject(obj, Math.max(12, Math.round(obj.maxHp * 0.26)));
          }
        }

        // Player projectiles also hit Interactive Arena Objects!
        if (!obj.dead) {
          for (let j = this.projectiles.length - 1; j >= 0; j--) {
            const pr = this.projectiles[j];
            if (dist2(pr.x, pr.y, obj.x, obj.y) <= (obj.radius + (pr.radius || 8)) ** 2) {
              this.damageArenaObject(obj, Math.max(10, Math.round((pr.dmg || 16) * 0.85)));
              if (pr.kind !== 'saw' && pr.kind !== 'boomerang' && pr.kind !== 'nova_ring') {
                this.projectiles.splice(j, 1);
              }
              if (obj.dead) break;
            }
          }
        }
      }
    },

    damageArenaObject(obj, amount) {
      if (obj.dead) return;
      obj.hp -= amount;
      obj.hitFlash = 0.12;
      this.spawnDebris(obj.x, obj.y, obj.kind === 'explosive_barrel' ? ['#E8483F', '#FFE07A'] : ['#5BD6A0', '#FFE07A'], 3, 130);
      window.MM.Audio.SFX.hit();
      if (obj.hp <= 0) {
        obj.dead = true;
        if (obj.kind === 'ore_vein') {
          // Tight Brotato economy: 2-3 scrap gems & 1 XP each!
          const count = 2 + (this.run.wave >= 6 ? 1 : 0);
          for (let k = 0; k < count; k++) {
            this.pickups.push({
              kind: 'scrap', x: obj.x + rand(-26, 26), y: obj.y + rand(-26, 26),
              scrap: 1, xp: 1, bagged: false, bob: rand(0, 6)
            });
          }
          this.spawnFx('fx:seismic_crack', obj.x, obj.y, { size: 84, life: 0.4, ground: true });
          this.spawnDebris(obj.x, obj.y, ['#5BD6A0', '#FFE07A', '#47515B'], 10, 210);
          this.addText(obj.x, obj.y - 34, 'ORE MINED!', '#5BD6A0', 15);
          window.MM.Audio.SFX.seismic();
        } else if (obj.kind === 'explosive_barrel') {
          const br = 165 * this.getAreaMult();
          const bDmg = Math.round((58 + this.run.wave * 18 + this.stats.engineering * 1.4) * Math.max(0.7, 1 + this.stats.damagePct / 160));
          const prevSrc = this._dmgSource;
          this._dmgSource = 'Explosive Barrel';
          this.spawnFx('fx:blast_star', obj.x, obj.y, { size: br * 1.9, life: 0.44, rotSpd: 3 });
          this.spawnFx('fx:smoke_puff', obj.x, obj.y - 18, { size: 76, life: 0.65, vy: -32, scaleEnd: 1.7 });
          this.spawnDecal('scorch', obj.x, obj.y, br * 0.72);
          this.spawnDebris(obj.x, obj.y, ['#E8483F', '#FFE07A', '#2B2F38'], 16, 270);
          this.rings.push({ x: obj.x, y: obj.y, r: 16, maxR: br, color: '#E8483F', life: 0.4, maxLife: 0.4 });
          this.cam.shake = Math.max(this.cam.shake, 8.5);
          this.addText(obj.x, obj.y - 40, 'BOOM!', '#FFE07A', 18);
          window.MM.Audio.SFX.barrel();
          this.enemies.forEach((e) => {
            if (!e.dead && dist2(e.x, e.y, obj.x, obj.y) <= (br + e.radius) ** 2) {
              this.dealDamage(e, bDmg, ['MINES', 'THERMAL'], true);
              this.applyBurn(e, bDmg * 0.25, 3.0);
            }
          });
          // Chain-detonate nearby barrels!
          this.arenaObjects.forEach((other) => {
            if (other !== obj && !other.dead && dist2(other.x, other.y, obj.x, obj.y) <= br * br) {
              this.damageArenaObject(other, other.maxHp);
            }
          });
          this._dmgSource = prevSrc;
        } else if (obj.kind === 'loot_pinata') {
          for (let k = 0; k < 4; k++) {
            this.pickups.push({
              kind: 'scrap', x: obj.x + rand(-34, 34), y: obj.y + rand(-34, 34),
              scrap: 1, xp: 2, bagged: true, bob: rand(0, 6)
            });
          }
          this.pickups.push({ kind: 'crate', x: obj.x, y: obj.y, bob: 0 });
          this.spawnFx('fx:blast_star', obj.x, obj.y, { size: 120, life: 0.4 });
          this.spawnDebris(obj.x, obj.y, ['#FFE07A', '#E8483F', '#5BD6A0'], 14, 240);
          this.addText(obj.x, obj.y - 40, '★ PINATA CRACKED!', '#FFE07A', 17);
          window.MM.Audio.SFX.levelUp();
        }
      }
    },

    updateArenaHazards(dt) {
      this.arenaHazardTimer -= dt;
      if (this.arenaHazardTimer > 0) return;

      const biome = this.waveCfg.biome;
      const baseCd = biome.id === 'magma' ? 6.2 : 7.8;
      this.arenaHazardTimer = Math.max(4.5, baseCd - this.run.hazard.level * 0.35);

      const count = biome.id === 'magma' ? 2 : (this.run.wave >= 6 ? 2 : 1);
      const dmg = Math.round((10 + this.run.wave * 1.8) * this.run.hazard.dmgMult);

      for (let k = 0; k < count; k++) {
        const tx = clamp(this.player.x + (k === 0 ? rand(-24, 24) : rand(-175, 175)), 90, ARENA_W - 90);
        const ty = clamp(this.player.y + (k === 0 ? rand(-24, 24) : rand(-175, 175)), 90, ARENA_H - 90);
        const col = biome.id === 'cryo' ? '#4AA3E8' : (biome.id === 'quantum' ? '#9B6BE0' : '#E8483F');
        const radius = biome.id === 'magma' ? 62 : 54;

        this.telegraphs.push({
          kind: 'circle', x: tx, y: ty, r: radius, life: 1.75, maxLife: 1.75,
          color: col, label: biome.id === 'magma' ? 'ERUPTION' : 'STRIKE',
          onDone: () => {
            if (biome.id === 'cryo') {
              this.spawnFx('fx:cryo_burst', tx, ty, { size: radius * 2.1, life: 0.42, rotSpd: 2 });
              this.spawnDecal('frost', tx, ty, radius * 0.85);
              this.spawnDebris(tx, ty, ['#9CD3FF', '#E8EEF2', '#4AA3E8'], 8, 175);
              window.MM.Audio.SFX.cryo();
            } else if (biome.id === 'quantum') {
              this.spawnFx('fx:volt_spark', tx, ty, { size: radius * 2.1, life: 0.4, rotSpd: 3 });
              this.spawnDecal('scorch', tx, ty, radius * 0.78);
              this.spawnDebris(tx, ty, ['#C6A6FF', '#5BD6A0'], 8, 180);
              window.MM.Audio.SFX.zap();
            } else {
              this.spawnFx('fx:blast_star', tx, ty, { size: radius * 2.2, life: 0.42, rotSpd: 2.5 });
              this.spawnFx('fx:smoke_puff', tx, ty - 16, { size: 54, life: 0.65, vy: -32, scaleEnd: 1.55 });
              this.spawnDecal('scorch', tx, ty, radius * 0.88);
              this.spawnDebris(tx, ty, ['#47515B', '#FFC233', '#E8483F'], 9, 195);
              window.MM.Audio.SFX.explode();
            }
            this.rings.push({ x: tx, y: ty, r: 10, maxR: radius, color: col, life: 0.34, maxLife: 0.34 });
            this.cam.shake = Math.max(this.cam.shake, 4.5);
            if (dist2(this.player.x, this.player.y, tx, ty) <= (radius + 10) ** 2) {
              this.damagePlayer(dmg);
            }
          }
        });
      }
    }
  });
})();
