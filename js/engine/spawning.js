// ============================================================================
// MULTI-MINE — GameEngine: spawning
// ============================================================================
(function () {
  // eslint-disable-next-line no-unused-vars
  const { ARENA_W, ARENA_H, clamp, dist2, rand, pick } = window.MM.EngineUtil;

  Object.assign(window.MM.GameEngine.prototype, {
    // ------------------------------------------------------------------------
    // SPAWNING (Brotato-style 1.3s Red ✕ Spawn Markers + Calmer Pacing!)
    // ------------------------------------------------------------------------
    pickSpawnSpot(minDist = 270, maxDist = 490) {
      let x = ARENA_W / 2;
      let y = ARENA_H / 2;
      for (let tries = 0; tries < 12; tries++) {
        const ang = rand(0, Math.PI * 2);
        const dist = rand(minDist, maxDist);
        x = clamp(this.player.x + Math.cos(ang) * dist, 76, ARENA_W - 76);
        y = clamp(this.player.y + Math.sin(ang) * dist, 76, ARENA_H - 76);
        if (dist2(x, y, this.player.x, this.player.y) > (minDist - 30) ** 2) break;
      }
      return { x, y };
    },

    scheduleEnemySpawn(typeId, forcedX = null, forcedY = null, delay = 1.3, isEliteMark = false) {
      const def = window.MM.ENEMIES[typeId];
      if (!def) return;
      const spot = (forcedX !== null && forcedY !== null)
        ? { x: clamp(forcedX, 76, ARENA_W - 76), y: clamp(forcedY, 76, ARENA_H - 76) }
        : this.pickSpawnSpot(270, 490);
      const isElite = isEliteMark || !!def.isElite;
      const col = isElite ? '#FFE07A' : (this.hasModifier('all_cursed') ? '#C084FC' : '#E8483F');
      this.telegraphs.push({
        kind: 'spawn_mark',
        x: spot.x,
        y: spot.y,
        r: isElite ? 34 : Math.max(18, def.radius + 4),
        life: delay,
        maxLife: delay,
        color: col,
        isElite,
        onDone: () => {
          if (this.state !== 'playing' || this.waveEnding) return;
          const spawned = this.spawnEnemy(typeId, spot.x, spot.y);
          if (spawned && isElite) {
            this.addText(spot.x, spot.y - 50, '★ ELITE DREADNOUGHT!', '#FFE07A', 18);
          }
        }
      });
    },

    updateSpawning(dt) {
      this.spawnTimer -= dt;
      const hz = this.run.hazard;
      const w = this.run.wave;
      const swarmMult = 1 + (this.stats.enemyCountPct || 0) / 100;
      const waveDur = (this.waveCfg && this.waveCfg.duration) || 35;
      const waveProg = clamp(this.waveElapsed / waveDur, 0, 1);
      const lateWaveBoost = waveProg > 0.60 ? 1.28 : (waveProg > 0.35 ? 1.10 : 1.0);
      const pendingSpawns = this.telegraphs.filter((t) => t.kind === 'spawn_mark').length;
      // Keep max simultaneous enemies clean & readable (max 72) so you can ALWAYS see what is happening!
      const maxEnemies = Math.min(72, Math.round((24 + w * 4.5) * Math.min(1.32, hz.countMult) * swarmMult));

      if (this.spawnTimer <= 0 && (this.enemies.length + pendingSpawns) < maxEnemies) {
        // Calmer, readable spacing between enemy spawns
        const interval = (this.waveCfg.spawnInterval * 1.44) / (Math.min(1.32, hz.countMult) * swarmMult * lateWaveBoost);
        this.spawnTimer = Math.max(0.28, interval * rand(0.84, 1.18));
        const batch = w >= 9 ? (Math.random() < 0.45 ? 3 : 2)
          : (w >= 5 ? (Math.random() < 0.50 ? 2 : 1)
          : (w >= 2 && Math.random() < 0.25 ? 2 : 1));
        for (let i = 0; i < batch; i++) {
          this.scheduleEnemySpawn(pick(this.waveCfg.pool), null, null, 1.35);
        }
      }

      this.surgeTimer -= dt;
      if (this.surgeTimer <= 0 && (this.enemies.length + pendingSpawns) < maxEnemies - 4) {
        this.surgeTimer = Math.max(10.0, 15.5 - w * 0.3);
        const surgeCount = Math.min(6, 3 + Math.floor(w / 3));
        const baseAng = rand(0, Math.PI * 2);
        for (let k = 0; k < surgeCount; k++) {
          const ang = baseAng + (Math.PI * 2 * k) / surgeCount;
          const sx = clamp(this.player.x + Math.cos(ang) * 390, 80, ARENA_W - 80);
          const sy = clamp(this.player.y + Math.sin(ang) * 390, 80, ARENA_H - 80);
          this.scheduleEnemySpawn(pick(this.waveCfg.pool), sx, sy, 1.35);
        }
        this.addText(this.player.x, this.player.y - 62, '⚠ SWARM INBOUND!', '#FFE07A', 16);
      }
    },

    spawnEnemy(typeId, forcedX = null, forcedY = null) {
      const def = window.MM.ENEMIES[typeId];
      if (!def) return null;
      const hz = this.run.hazard;
      const w = this.run.wave;
      // Progressive Brotato-style wave scaling + intra-wave escalation (final 40% enemies are tougher!)
      const waveDur = (this.waveCfg && this.waveCfg.duration) || 35;
      const waveProg = clamp(this.waveElapsed / waveDur, 0, 1);
      const intraHp = waveProg > 0.60 ? 1.18 : 1.0;
      const intraSpd = waveProg > 0.60 ? 1.06 : 1.0;

      const lateRamp = w > 2 ? Math.pow(w - 2, 1.88) * 0.34 : 0;
      const endlessRamp = w > 12 ? Math.pow(w - 12, 2.0) * 1.95 : 0;
      const wScale = (1 + (w - 1) * 0.34 + lateRamp + endlessRamp) * intraHp;
      const curseLvl = this.stats.curseLevel || 0;
      // Authentic Brotato Cursed Enemies (capped speed bonus so All-Cursed never becomes an unreadable blur!)
      const isCursed = !def.isBoss && (this.hasModifier('all_cursed') || (curseLvl > 0 && Math.random() < Math.min(0.65, curseLvl * 0.14)));
      const curseSpd = (1 + Math.min(8, curseLvl) * 0.012) * (isCursed ? 1.07 : 1.0);
      const stacked = this.isRiskStacked();
      const curseDmg = (1 + Math.min(10, curseLvl) * 0.045) * (isCursed ? (stacked ? 1.0 : 1.22) : 1.0);
      const curseHp = isCursed ? (stacked ? 1.45 : 1.80) : 1.0;

      let x = forcedX;
      let y = forcedY;
      if (x === null || y === null) {
        for (let tries = 0; tries < 12; tries++) {
          const ang = rand(0, Math.PI * 2);
          const dist = rand(295, 490);
          x = clamp(this.player.x + Math.cos(ang) * dist, 76, ARENA_W - 76);
          y = clamp(this.player.y + Math.sin(ang) * dist, 76, ARENA_H - 76);
          if (dist2(x, y, this.player.x, this.player.y) > 250 * 250) break;
        }
      }

      const fastEscHp = this.hasModifier('fast_escalation') ? (stacked ? 1.15 : 1.30) : 1.0;
      const hp = Math.round(def.hp * wScale * curseHp * hz.hpMult * fastEscHp);
      const dmgWaveMult = 1 + (w - 1) * 0.17 + (w > 4 ? Math.pow(w - 4, 1.35) * 0.14 : 0);
      const lateArmor = w >= 4 ? ((def.isBoss || def.isElite || def.armor) ? Math.floor((w - 2) * 1.0) : Math.floor((w - 3) / 2)) : 0;
      const rawEnemySpd = def.speed * 0.66 * (1 + Math.min(0.24, (w - 1) * 0.02)) * intraSpd * curseSpd;
      const enemy = {
        uid: this.nextUid(),
        id: def.id,
        def,
        isBoss: !!def.isBoss,
        isCursed,
        x, y, vx: 0, vy: 0,
        hp, hpTrail: hp, maxHp: hp,
        // Hard-capped crisp readable enemy speed — never turns into an unreadable blur even at H5 + All Cursed!
        speed: def.isBoss ? Math.min(155, rawEnemySpd) : Math.min(185, rawEnemySpd),
        damage: Math.round(def.damage * dmgWaveMult * hz.dmgMult * curseDmg),
        radius: def.radius,
        armor: (def.armor || 0) + lateArmor,
        spawnT: 0, hitFlash: 0, knockRot: 0,
        burnTimer: 0, burnDps: 0, chillTimer: 0, stunTimer: 0, shredTimer: 0, frostfireCd: 0,
        aiTimer: rand(1.0, 2.2), aiState: 'move',
        chargeDx: 0, chargeDy: 0,
        dead: false, facing: 1
      };
      this.enemies.push(enemy);
      this.rings.push({ x, y, r: 4, maxR: enemy.radius * 2.1, color: enemy.isBoss ? '#E8483F' : '#C6A6FF', life: 0.38, maxLife: 0.38 });
      return enemy;
    },

    spawnBoss(bossId, slotIdx = 0) {
      const bx = slotIdx === 0
        ? (this.player.x > ARENA_W / 2 ? 280 : ARENA_W - 280)
        : (this.player.x > ARENA_W / 2 ? ARENA_W - 280 : 280);
      const by = slotIdx === 0 ? ARENA_H / 2 - 60 : ARENA_H / 2 + 60;
      const boss = this.spawnEnemy(bossId, bx, by);
      if (!this.activeBoss || this.activeBoss.dead) this.activeBoss = boss;
      this.bossSpawned = true;
      this.cam.shake = 10;
      this.spawnFx('fx:seismic_crack', bx, by, { size: 150, life: 0.65, ground: true, maxAlpha: 0.85 });
      this.spawnDebris(bx, by, ['#47515B', '#FFC233', '#E8483F'], 14, 240);
      this.addText(bx, by - 66, slotIdx > 0 ? `☠ TWIN: ${boss.def.name}` : boss.def.name, '#FFE07A', 18);
    }
  });
})();
