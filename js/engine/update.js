// ============================================================================
// MULTI-MINE — GameEngine: update
// ============================================================================
(function () {
  // eslint-disable-next-line no-unused-vars
  const { ARENA_W, ARENA_H, clamp, dist2, rand, pick } = window.MM.EngineUtil;

  Object.assign(window.MM.GameEngine.prototype, {
    // ------------------------------------------------------------------------
    // MAIN UPDATE TICK
    // ------------------------------------------------------------------------
    update(dt) {
      this.waveElapsed += dt;
      const p = this.player;
      const biome = this.waveCfg ? this.waveCfg.biome : window.MM.BIOMES[0];

      // Smooth HP trailing drain bar
      if (p.hpTrail > p.hp) {
        p.hpTrail = Math.max(p.hp, p.hpTrail - Math.max(18, (p.hpTrail - p.hp) * 4.5) * dt);
      } else {
        p.hpTrail = p.hp;
      }

      if (this.killStreakTimer > 0) {
        this.killStreakTimer -= dt;
        if (this.killStreakTimer <= 0) this.killStreak = 0;
      }

      // Clean Option C Sub-Floor Tech Grid: no drifting floor motes or mid-arena smoke clutter!

      if (this.waveEnding) {
        this.waveEndTimer -= dt;
        this.updatePickups(dt, true);
        this.updateVisualFX(dt);
        this.updateCamera(dt);
        if (this.waveEndTimer <= 0) this.finishWaveTransition();
        return;
      }

      const mustKillFinalBoss = this.run.wave === 12 && this.activeBoss && !this.activeBoss.dead;
      if (!mustKillFinalBoss) {
        this.waveTimer = Math.max(0, this.waveTimer - dt);
      } else {
        this.waveTimer = Math.max(1, this.waveTimer - dt);
      }

      if (this.waveTimer <= 0 && !mustKillFinalBoss) {
        this.beginWaveClear();
        return;
      }

      if (this.stats.hpRegen > 0 && p.hp < this.stats.maxHp) {
        p.hp = Math.min(this.stats.maxHp, p.hp + this.stats.hpRegen * dt);
      }
      if (p.invuln > 0) p.invuln -= dt;
      if (p.dashCd > 0) p.dashCd = Math.max(0, p.dashCd - dt);
      if (p.hasteTimer > 0) p.hasteTimer -= dt;
      if (p.hitFlash > 0) p.hitFlash -= dt;
      if (p.lifeStealCd > 0) p.lifeStealCd -= dt;
      if (p.painBuffTimer > 0) {
        p.painBuffTimer -= dt;
        if (p.painBuffTimer <= 0) this.recomputeStats();
      }
      if (p.ultOverdriveTimer > 0) {
        p.ultOverdriveTimer -= dt;
        if (p.ultOverdriveTimer <= 0) this.recomputeStats();
      }
      if (p.ultCritTimer > 0) {
        p.ultCritTimer -= dt;
        if (p.ultCritTimer <= 0) this.recomputeStats();
      }
      if (p.petFrenzyTimer > 0) p.petFrenzyTimer -= dt;
      if (p.petRallyCd > 0) p.petRallyCd = Math.max(0, p.petRallyCd - dt);
      if (p.petRallyTimer > 0) {
        p.petRallyTimer -= dt;
        if (this.petRallyTarget && this.petRallyTarget.dead) {
          // Auto-retarget next nearest threat while Rally is still active!
          this.petRallyTarget = this.findNearestEnemy(p.x, p.y, 680);
        }
        if (p.petRallyTimer <= 0) this.petRallyTarget = null;
      }
      this.addUltCharge(dt * 1.4);
      if (p.quantumOverclockTimer > 0) p.quantumOverclockTimer -= dt;

      // Elite Mini-Boss spawn timer on Elite Waves (5, 7, 9, 11...) with 1.5s Gold ★✕ Spawn Telegraph!
      if (this.eliteSpawnTimer > 0) {
        this.eliteSpawnTimer -= dt;
        if (this.eliteSpawnTimer <= 0 && this.waveCfg && this.waveCfg.elite) {
          const ex = p.x > ARENA_W / 2 ? 220 : ARENA_W - 220;
          const ey = clamp(p.y + rand(-180, 180), 120, ARENA_H - 120);
          window.MM.Audio.SFX.bossWarn();
          this.scheduleEnemySpawn(this.waveCfg.elite, ex, ey, 1.5, true);
          if (this.hasModifier('double_boss')) {
            const ex2 = ARENA_W - ex;
            const ey2 = clamp(ARENA_H - ey, 120, ARENA_H - 120);
            this.scheduleEnemySpawn(this.waveCfg.elite, ex2, ey2, 1.5, true);
          }
        }
      }

      // Blood-Scrap Siphon (Brotato Blood Donation: tick 1 self-dmg every 2.5s!)
      if (this.run.specials.bloodDonate > 0) {
        p.bloodTimer -= dt;
        if (p.bloodTimer <= 0) {
          p.bloodTimer = 2.5;
          if (p.hp > 1) {
            p.hp = Math.max(1, p.hp - this.run.specials.bloodDonate);
            this.addText(p.x, p.y - 52, `-${this.run.specials.bloodDonate}`, '#E8483F', 11);
          }
        }
      }

      // Auto-Mine Dispenser (Brotato Landmines!)
      if (this.run.specials.autoMine > 0) {
        p.autoMineTimer -= dt;
        if (p.autoMineTimer <= 0) {
          p.autoMineTimer = Math.max(2.2, 5.5 / this.run.specials.autoMine);
          const def = window.MM.getContraption('prox_mine');
          this.deployables.push({
            slotUid: -99, slot: { tier: 1 }, def, kind: 'mine',
            x: clamp(p.x + rand(-34, 34), 64, ARENA_W - 64),
            y: clamp(p.y + rand(-34, 34), 64, ARENA_H - 64),
            dmg: 22 + this.stats.engineering * 1.15,
            radius: 74 * this.getAreaMult(),
            armTimer: 0.35, spawnT: 0, recoil: 0, life: 16, pulse: 0
          });
        }
      }

      // Orbital Eye Emitter (Brotato Alien Eyes!): fires 6 Max-HP-scaling homing bolts every 3.2s!
      if (this.run.specials.opticRing > 0) {
        p.opticTimer -= dt;
        if (p.opticTimer <= 0) {
          p.opticTimer = Math.max(1.4, 3.2 / (1 + (this.run.specials.opticRing - 1) * 0.45));
          const bDmg = (8 + this.stats.maxHp * 0.20) * this.run.specials.opticRing;
          for (let k = 0; k < 6; k++) {
            const ang = (Math.PI * 2 * k) / 6 + this.waveElapsed;
            this.projectiles.push({
              kind: 'nanobot', x: p.x, y: p.y,
              vx: Math.cos(ang) * 320, vy: Math.sin(ang) * 320,
              dmg: bDmg, radius: 7.5, life: 2.2, tags: ['ORBITAL', 'VOLTAIC']
            });
          }
          this.rings.push({ x: p.x, y: p.y, r: 12, maxR: 54, color: '#C6A6FF', life: 0.26, maxLife: 0.26 });
          window.MM.Audio.SFX.zap();
        }
      }

      // Singularity Relic (Brotato Sifd's Relic!): pulls all Scrap across the arena every 4s!
      if (this.run.specials.relicPull > 0) {
        p.relicTimer -= dt;
        if (p.relicTimer <= 0) {
          p.relicTimer = 4.0;
          this.pickups.forEach((pk) => {
            if (pk.kind === 'scrap') pk.superPull = true;
          });
          this.rings.push({ x: p.x, y: p.y, r: 16, maxR: 120, color: '#5BD6A0', life: 0.34, maxLife: 0.34 });
        }
      }

      // Field Med-Dispenser & Bio-Slime Alchemist auto-fruit drops!
      const bioFruitStacks = (this.run.specials.autoMedFruit || 0) + (this.run.charDef.perks && this.run.charDef.perks.autoBioFruit ? 1 : 0);
      if (bioFruitStacks > 0) {
        p.medFruitTimer -= dt;
        if (p.medFruitTimer <= 0) {
          p.medFruitTimer = Math.max(3.5, 7.2 / bioFruitStacks);
          const ang = rand(0, Math.PI * 2);
          const fx = clamp(p.x + Math.cos(ang) * rand(45, 95), 64, ARENA_W - 64);
          const fy = clamp(p.y + Math.sin(ang) * rand(45, 95), 64, ARENA_H - 64);
          this.pickups.push({ kind: 'fruit', x: fx, y: fy, heal: 8, bob: rand(0, 6) });
          this.rings.push({ x: fx, y: fy, r: 4, maxR: 28, color: '#5BD6A0', life: 0.28, maxLife: 0.28 });
        }
      }

      // Bunker Anchor standing-still detection
      const nowStill = Math.hypot(p.vx, p.vy) < 12 && p.dashTimer <= 0;
      if (this.run.specials.statueBuff > 0 && nowStill !== p.standingStill) {
        p.standingStill = nowStill;
        this.recomputeStats();
      }

      if (this.run.specials.aegisShield) {
        p.aegisTimer += dt;
        if (p.aegisTimer >= 10) {
          p.aegisTimer = 0;
          p.shield = Math.min(35, p.shield + 18);
          this.rings.push({ x: p.x, y: p.y, r: 10, maxR: 58, color: '#5BD6A0', life: 0.36, maxLife: 0.36 });
        }
      }

      if (this.run.charDef.perks && this.run.charDef.perks.quantumPulse) {
        p.quantumPulseTimer -= dt;
        if (p.quantumPulseTimer <= 0) {
          p.quantumPulseTimer = 8.0;
          p.quantumOverclockTimer = 2.6;
          this.rings.push({ x: p.x, y: p.y, r: 14, maxR: 280, color: '#C6A6FF', life: 0.55, maxLife: 0.55 });
          this.spawnFx('fx:volt_spark', p.x, p.y, { size: 96, life: 0.38, rotSpd: 4 });
          this.enemyShots.forEach((s) => { s.vx *= 0.48; s.vy *= 0.48; });
          this.addText(p.x, p.y - 54, 'QUANTUM PULSE!', '#C6A6FF', 15);
          window.MM.Audio.SFX.cryo();
        }
      }

      this.updatePlayerMovement(dt);
      this.updateAutoUltimate(dt);
      this.updateSpawning(dt);
      this.updateArenaHazards(dt);
      this.updateArenaObjects(dt);
      this.updateLiveEvents(dt);
      this.updateTools(dt);
      this.updateDeployables(dt);
      this.updateOrbitals(dt);
      this.updateDrones(dt);
      this.updatePets(dt);
      this.updateHazards(dt);
      this.updateProjectiles(dt);
      this.updateEnemies(dt);
      this.updateEnemyShots(dt);
      this.updateTelegraphs(dt);
      this.updatePickups(dt, false);
      this.updateVisualFX(dt);
      this.updateCamera(dt);

      this.hudAccum += dt;
      if (this.hudAccum >= 0.055) {
        this.hudAccum = 0;
        if (this.cb.onHudUpdate) this.cb.onHudUpdate(this.getHudSnapshot());
      }
    },

    // The special fires itself once charged, at a moment where it will land:
    // 3+ enemies (or any boss) close by, or after a short wait if anything is alive.
    updateAutoUltimate(dt) {
      const p = this.player;
      if (!p || p.ultCharge < 100 || this.waveEnding) { if (p) p.ultWait = 0; return; }
      p.ultWait = (p.ultWait || 0) + dt;
      let near = 0;
      let alive = 0;
      let bossNear = false;
      const R2 = 430 * 430;
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.dead) continue;
        alive++;
        if (dist2(e.x, e.y, p.x, p.y) <= R2) {
          near++;
          if (e.isBoss) bossNear = true;
        }
      }
      if (near >= 3 || bossNear || (alive > 0 && p.ultWait >= 2.5)) {
        p.ultWait = 0;
        this.triggerUltimate();
      }
    }
  });
})();
