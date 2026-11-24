// ============================================================================
// MULTI-MINE — GameEngine: player
// ============================================================================
(function () {
  // eslint-disable-next-line no-unused-vars
  const { ARENA_W, ARENA_H, clamp, dist2, rand, pick } = window.MM.EngineUtil;

  Object.assign(window.MM.GameEngine.prototype, {
    updateCamera(dt) {
      const p = this.player;
      const z = this.camZoom || 1;
      const halfW = (this.viewW / 2) / z;
      const halfH = (this.viewH / 2) / z;
      const margin = 56;
      const minX = halfW - margin;
      const maxX = ARENA_W - halfW + margin;
      const minY = halfH - margin;
      const maxY = ARENA_H - halfH + margin;

      const targetX = minX >= maxX ? ARENA_W / 2 : clamp(p.x, minX, maxX);
      const targetY = minY >= maxY ? ARENA_H / 2 : clamp(p.y, minY, maxY);

      const lerp = 1 - Math.exp(-20 * dt); // tight follow, very little lag
      this.cam.x += (targetX - this.cam.x) * lerp;
      this.cam.y += (targetY - this.cam.y) * lerp;

      if (this.cam.shake > 0) {
        this.cam.shakeTime += dt * 54;
        this.cam.shake = Math.max(0, this.cam.shake - dt * 40);
      }
    },

    updatePlayerMovement(dt) {
      const p = this.player;
      if (p.dashTimer > 0) {
        p.dashTimer -= dt;
        const dashSpeed = this.stats.speed * 3.15;
        p.x += p.dashDx * dashSpeed * dt;
        p.y += p.dashDy * dashSpeed * dt;
        p.tilt = p.dashDx * 0.25;
        this.afterimages.push({ x: p.x, y: p.y, facing: p.facing, tilt: p.tilt, life: 0.24, maxLife: 0.24 });
      } else {
        let mx = 0;
        let my = 0;
        if (this.keys['w'] || this.keys['arrowup']) my -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) my += 1;
        if (this.keys['a'] || this.keys['arrowleft']) mx -= 1;
        if (this.keys['d'] || this.keys['arrowright']) mx += 1;

        // Analog Mobile Touch Virtual Thumbstick & Gamepad Left Stick!
        let analogMag = 1;
        if (mx === 0 && my === 0 && this.touchMove && this.touchMove.active) {
          mx = this.touchMove.dx;
          my = this.touchMove.dy;
          analogMag = Math.min(1, Math.hypot(mx, my));
        }
        if (mx === 0 && my === 0 && this.padMove && (this.padMove.dx !== 0 || this.padMove.dy !== 0)) {
          mx = this.padMove.dx;
          my = this.padMove.dy;
          analogMag = Math.min(1, Math.hypot(mx, my));
        }

        if (mx === 0 && my === 0 && this.mouseFollow) {
          const z = this.camZoom || 1;
          const wx = this.cam.x + (this.mouse.x - this.viewW / 2) / z;
          const wy = this.cam.y + (this.mouse.y - this.viewH / 2) / z;
          const dx = wx - p.x;
          const dy = wy - p.y;
          const d = Math.hypot(dx, dy);
          if (d > 26) { mx = dx / d; my = dy / d; }
        }

        const len = Math.hypot(mx, my);
        if (len > 0.05) {
          mx /= len;
          my /= len;
          const spd = this.stats.speed * (p.hasteTimer > 0 ? 1.22 : 1) * analogMag;
          // snappy movement: full speed immediately, no ramp-up
          p.vx = mx * spd;
          p.vy = my * spd;
          if (Math.abs(mx) > 0.1) p.facing = mx > 0 ? 1 : -1;
          p.walkPhase += dt * 15;
          p.tilt += (mx * 0.05 - p.tilt) * Math.min(1, dt * 14);

          p.dustTimer -= dt;
          if (p.dustTimer <= 0) {
            p.dustTimer = 0.32;
            this.spawnFx('fx:smoke_puff', p.x - mx * 14, p.y + 20, {
              size: 16, life: 0.25, vx: -mx * 20, vy: -my * 14 - 6, scaleEnd: 1.25, maxAlpha: 0.45
            });
          }
        } else {
          // snappy stop: no sliding
          p.vx = 0;
          p.vy = 0;
          p.tilt *= Math.pow(0.005, dt);
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }

      p.x = clamp(p.x, 58, ARENA_W - 58);
      p.y = clamp(p.y, 58, ARENA_H - 58);
    },

    damagePlayer(raw, attacker = null) {
      const p = this.player;
      if (p.invuln > 0 || this.waveEnding) return;
      const sp = this.run.specials;

      // Tardigrade Shell: nullifies first N hits each wave!
      if (p.tardigradeCharges > 0) {
        p.tardigradeCharges--;
        p.invuln = 0.65;
        this.rings.push({ x: p.x, y: p.y, r: 10, maxR: 58, color: '#9CD3FF', life: 0.34, maxLife: 0.34 });
        this.addText(p.x, p.y - 62, 'BLOCKED!', '#9CD3FF', 16);
        window.MM.Audio.SFX.cryo();
        return;
      }

      // Brotato Dodge % (capped at 60%)!
      if (this.stats.dodge > 0 && Math.random() * 100 < this.stats.dodge) {
        p.invuln = 0.24;
        this.addText(p.x, p.y - 62, 'DODGE!', '#5BD6A0', 16);
        if (sp.adrenaline > 0) {
          const heal = 3 * sp.adrenaline;
          p.hp = Math.min(this.stats.maxHp, p.hp + heal);
          p.hasteTimer = Math.max(p.hasteTimer, 2.0);
          this.addText(p.x, p.y - 44, `+${heal}`, '#5BD6A0', 13);
        }
        window.MM.Audio.SFX.dash();
        return;
      }

      const armor = this.stats.armor;
      const mult = armor >= 0 ? 15 / (15 + armor) : 1 + Math.abs(armor) * 0.06;
      let dmg = Math.max(1, Math.round(raw * mult));

      p.invuln = this.isRiskStacked() ? 0.6 : 0.36;
      p.hitFlash = 0.24;
      this.cam.shake = Math.max(this.cam.shake, 7.5);
      this.hitStop = Math.max(this.hitStop, 0.025);
      window.MM.Audio.SFX.hurt();

      // Spiked Bumper (Thorns) recoil damage!
      if (sp.thorns > 0 && attacker && !attacker.dead) {
        this.dealDamage(attacker, (25 + Math.max(0, armor) * 4) * sp.thorns, ['SEISMIC'], false);
      }

      // Pain-Feedback Loop (Bloody Hand): radial shockwave + 4s +20% Damage!
      if (sp.painShock > 0) {
        p.painBuffTimer = 4.0;
        this.recomputeStats();
        this.triggerSeismicWave(p.x, p.y, 115 * this.getAreaMult(), 22 * sp.painShock, true, ['SEISMIC']);
      }

      // Iron Shell Pet Synergy: Magma Tortoise counter-quake on damage!
      if (this.petSynergies && this.petSynergies.ironShell) {
        this.triggerSeismicWave(p.x, p.y, 145 * this.getAreaMult(), 32 + (this.stats.engineering || 0) * 1.6, true, ['SEISMIC', 'THERMAL']);
      }

      if (p.shield > 0) {
        const absorbed = Math.min(p.shield, dmg);
        p.shield -= absorbed;
        dmg -= absorbed;
        this.addText(p.x, p.y - 62, `SHIELD -${Math.round(absorbed)}`, '#9CD3FF', 14);
      }

      if (dmg > 0) {
        p.hp -= dmg;
        this.addText(p.x, p.y - 58, `-${dmg}`, '#FF7D7D', 17);
      }

      if (p.hp <= 0) {
        p.hp = 0;
        this.handleGameOver();
      }
    },

    // ------------------------------------------------------------------------
    // PICKUPS & AUTHENTIC BROTATO WAVE ECONOMY (HARVESTING + SALVAGE BAG!)
    // ------------------------------------------------------------------------
    updatePickups(dt, waveEndPull) {
      const p = this.player;
      const sp = this.run.specials;
      // At wave end, pull nearby scrap (2.2x magnet); distant scrap gets safely bagged for next wave!
      const magR = waveEndPull ? this.stats.magnet * 2.2 : this.stats.magnet;

      for (let i = this.pickups.length - 1; i >= 0; i--) {
        const pk = this.pickups[i];
        pk.bob += dt * 4.5;
        const dx = p.x - pk.x;
        const dy = p.y - pk.y;
        const d = Math.hypot(dx, dy) || 1;

        if ((d < magR || pk.superPull) && (pk.kind === 'scrap' || pk.kind === 'fruit' || waveEndPull)) {
          const pullSpd = (waveEndPull || pk.superPull) ? 720 : (380 + (1 - d / magR) * 280);
          pk.x += (dx / d) * pullSpd * dt;
          pk.y += (dy / d) * pullSpd * dt;
        }

        if (d <= 32) {
          if (pk.kind === 'scrap') {
            this.run.scrap += pk.scrap;
            this.gainXp(pk.xp);
            this.pickupCombo = Math.min(18, this.pickupCombo + 1);
            window.MM.Audio.SFX.pickup(this.pickupCombo);

            // Kinetic Scrap Thruster speed burst!
            if (sp.scrapSpeed > 0) p.hasteTimer = Math.max(p.hasteTimer, 0.9);

            // Luck-Core Emitter (Baby Elephant!): 30% chance on scrap pickup to fire Luck-scaling bolt!
            if (sp.pickupBolt > 0 && !waveEndPull && Math.random() < Math.min(0.85, 0.30 * sp.pickupBolt)) {
              const target = this.findNearestEnemy(p.x, p.y, 440);
              if (target) {
                const boltDmg = (10 + this.stats.luck * 1.1) * sp.pickupBolt;
                this.dealDamage(target, boltDmg, ['VOLTAIC'], false);
                this.beams.push({ x1: p.x, y1: p.y, x2: target.x, y2: target.y, color: '#FFE07A', width: 3.2, life: 0.18, maxLife: 0.18 });
                this.spawnFx('fx:volt_spark', target.x, target.y, { size: 32, life: 0.18 });
              }
            }
          } else if (pk.kind === 'fruit') {
            const heal = pk.heal || 6;
            p.hp = Math.min(this.stats.maxHp, p.hp + heal);
            this.addText(p.x, p.y - 54, `+${heal} HP`, '#5BD6A0', 14);
            window.MM.Audio.SFX.pickup(10);
            this.triggerSpicyFruitExplosion(p.x, p.y);
          } else if (pk.kind === 'crate') {
            const heal = Math.round(this.stats.maxHp * 0.18);
            p.hp = Math.min(this.stats.maxHp, p.hp + heal);
            this.run.bonusCrates++;
            this.spawnFx('fx:blast_star', p.x, p.y, { size: 58, life: 0.28 });
            this.addText(p.x, p.y - 62, `SUPPLY CRATE!`, '#FFE07A', 15);
            window.MM.Audio.SFX.levelUp();
            this.triggerSpicyFruitExplosion(p.x, p.y);
          }
          this.pickups.splice(i, 1);
        }
      }
    },

    // Volatile Nano-Fruit (Brotato Spicy Sauce!) & Bio-Slime Alchemist Fruit Blast!
    triggerSpicyFruitExplosion(x, y) {
      const sp = this.run.specials;
      const alchBlast = this.run.charDef.perks && this.run.charDef.perks.fruitBlast ? 1 : 0;
      const totalStacks = (sp.spicyFruit || 0) + alchBlast;
      if (totalStacks <= 0) return;
      const r = 132 * this.getAreaMult();
      const dmg = (24 + this.stats.maxHp * 0.40 + this.stats.engineering * 1.2) * totalStacks;
      this.spawnFx('fx:blast_star', x, y, { size: r * 1.9, life: 0.36, rotSpd: 3 });
      this.rings.push({ x, y, r: 10, maxR: r, color: alchBlast ? '#5FE3B8' : '#E8483F', life: 0.34, maxLife: 0.34 });
      window.MM.Audio.SFX.explode();
      this.enemies.forEach((e) => {
        if (!e.dead && dist2(e.x, e.y, x, y) <= (r + e.radius) ** 2) {
          this.dealDamage(e, dmg, ['THERMAL', 'MINES'], false);
          if (alchBlast) this.applyBurn(e, dmg * 0.35, 3.0);
        }
      });
    }
  });
})();
