// ============================================================================
// MULTI-MINE — GameEngine: render-actors
// ============================================================================
(function () {
  // eslint-disable-next-line no-unused-vars
  const { ARENA_W, ARENA_H, clamp, dist2, rand, pick, wobblyCircle } = window.MM.EngineUtil;
  // pen-stroke highlight on a round thing of radius r (instead of a glossy dot)
  const penShine = (ctx, x, y, r) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,248,230,0.85)';
    ctx.lineWidth = Math.max(1.2, r * 0.22);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r * 0.58, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();
    ctx.restore();
  };

  Object.assign(window.MM.GameEngine.prototype, {
    renderPickups(ctx) {
      const INK = '#1E1A17';
      this.pickups.forEach((pk) => {
        const bobY = Math.sin(pk.bob) * 4.5;
        ctx.save();
        ctx.translate(pk.x, pk.y);

        ctx.fillStyle = 'rgba(30, 26, 23, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 14, pk.kind === 'crate' ? 20 : 12, pk.kind === 'crate' ? 7 : 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (pk.kind === 'crate') {
          const beamG = ctx.createLinearGradient(0, -110, 0, 8);
          beamG.addColorStop(0, 'rgba(255, 194, 51, 0)');
          beamG.addColorStop(1, 'rgba(255, 194, 51, 0.38)');
          ctx.fillStyle = beamG;
          ctx.fillRect(-14, -110, 28, 118);
        }

        ctx.translate(0, bobY);
        const ring = (r, fill, col, w) => {
          ctx.fillStyle = fill;
          ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = INK; ctx.lineWidth = w + 3; ctx.stroke();
          ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
        };
        if (pk.kind === 'scrap') {
          ring(pk.bagged ? 18 : 15, pk.bagged ? 'rgba(255, 194, 51, 0.3)' : 'rgba(232, 181, 46, 0.2)', pk.bagged ? '#FFE07A' : '#E8B52E', pk.bagged ? 2.6 : 2);
          const sz = pk.bagged ? 34 : 28;
          this.drawSprite(ctx, 'icon:scrap', -sz / 2, -sz / 2, sz, sz);
        } else if (pk.kind === 'fruit') {
          ring(18, 'rgba(91, 214, 160, 0.3)', '#5BD6A0', 2.4);
          this.drawSprite(ctx, 'icon:fruit', -17, -17, 34, 34);
        } else {
          ring(28 + Math.sin(pk.bob * 1.4) * 4, 'rgba(255, 194, 51, 0.32)', '#FFE07A', 2.8);
          this.drawSprite(ctx, 'icon:crate', -23, -23, 46, 46);
        }
        ctx.restore();
      });
    },

    renderDeployables(ctx) {
      this.deployables.forEach((d) => {
        ctx.save();
        ctx.translate(d.x, d.y);

        const pop = d.spawnT < 1 ? (1 + Math.sin(d.spawnT * Math.PI) * 0.28) * d.spawnT : 1;
        const recoilScale = 1 + (d.recoil || 0) * 0.16;

        ctx.fillStyle = 'rgba(20, 22, 32, 0.34)';
        ctx.beginPath(); ctx.ellipse(0, 15, 20 * pop, 7.5 * pop, 0, 0, Math.PI * 2); ctx.fill();

        if (d.kind === 'mine' || d.kind === 'cryo_mine' || d.kind === 'magnet_mine') {
          const pulseR = 16 + Math.sin(d.pulse) * 5;
          // Sweeping flat-vector radar cone!
          ctx.save();
          ctx.rotate(this.waveElapsed * 3.2);
          ctx.fillStyle = d.kind === 'cryo_mine' ? 'rgba(154,195,255,0.22)' : (d.kind === 'magnet_mine' ? 'rgba(160,120,255,0.24)' : 'rgba(240,84,84,0.22)');
          ctx.beginPath(); ctx.moveTo(0, 2); ctx.arc(0, 2, pulseR + 6, 0, 0.85); ctx.closePath(); ctx.fill();
          ctx.restore();

          ctx.strokeStyle = d.kind === 'cryo_mine' ? 'rgba(154,195,255,0.65)' : (d.kind === 'magnet_mine' ? 'rgba(160,120,255,0.7)' : 'rgba(240,84,84,0.65)');
          ctx.lineWidth = 2.4;
          ctx.beginPath(); ctx.arc(0, 2, pulseR, 0, Math.PI * 2); ctx.stroke();
          ctx.scale(pop, pop);
          this.drawSprite(ctx, 'tool:' + d.def.id, -19, -19, 38, 38);
        } else {
          if (d.boosted) {
            ctx.strokeStyle = '#5BD6A0';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 2, 26, 0, Math.PI * 2); ctx.stroke();
          }
          // Subtle directional targeting laser dot ring
          ctx.save();
          ctx.rotate(d.angle || 0);
          ctx.fillStyle = '#FFE07A';
          ctx.beginPath(); ctx.arc(24, 0, 3, 0, Math.PI * 2); ctx.fill();
          ctx.restore();

          ctx.scale(pop * recoilScale, pop / recoilScale);
          this.drawSprite(ctx, 'tool:' + d.def.id, -23, -25, 46, 46);
        }
        ctx.restore();
      });
    },

    renderEnemies(ctx) {
      this.enemies.forEach((e) => {
        const size = e.radius * 2.55;
        const pop = e.spawnT < 1 ? Math.min(1, e.spawnT * 1.18) : 1;
        ctx.save();
        ctx.translate(e.x, e.y);

        // Pronounced shadow + crisp hostile foot-ring so enemies stand out sharply!
        ctx.fillStyle = 'rgba(14, 16, 26, 0.50)';
        ctx.beginPath();
        ctx.ellipse(0, e.radius * 0.84, e.radius * 0.96 * pop, e.radius * 0.38 * pop, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = e.isBoss ? 'rgba(255, 92, 92, 0.85)' : (e.isCursed ? 'rgba(192, 132, 252, 0.92)' : 'rgba(240, 84, 84, 0.45)');
        ctx.lineWidth = e.isBoss ? 3.2 : (e.isCursed ? 3.0 : 1.8);
        ctx.stroke();

        if (e.isCursed) {
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.65)';
          ctx.lineWidth = 2.6;
          ctx.beginPath(); ctx.arc(0, 0, e.radius + 7, 0, Math.PI * 2); ctx.stroke();
        }

        if (e.chillTimer > 0) {
          ctx.strokeStyle = '#9CD3FF';
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(0, 0, e.radius + 5, 0, Math.PI * 2); ctx.stroke();
        }
        if (e.burnTimer > 0) {
          ctx.strokeStyle = '#E8483F';
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(0, 0, e.radius + 8, 0, Math.PI * 2); ctx.stroke();
        }

        const phase = this.waveElapsed * 10.5 + e.uid;
        const bob = Math.sin(phase) * (e.isBoss ? 4 : 2.8);
        const sx = (1 + Math.sin(phase) * 0.065) * pop;
        const sy = (1 - Math.sin(phase) * 0.065) * pop;
        const shakeX = e.aiState === 'windup' ? Math.sin(this.waveElapsed * 55) * 4 : 0;

        ctx.translate(shakeX, bob);
        ctx.rotate(e.knockRot || 0);
        ctx.scale(e.facing * sx, sy);

        this.drawSprite(ctx, 'enemy:' + e.id, -size / 2, -size / 2, size, size, e.hitFlash > 0 ? 0.88 : 0);
        ctx.restore();

        if (e.aiState === 'windup') {
          const bounce = Math.sin(this.waveElapsed * 24) * 3;
          this.drawSprite(ctx, 'fx:warn_badge', e.x - 14, e.y - e.radius - 36 + bounce, 28, 28);
        }

        // Crisp Enemy HP Bar with Delayed White Drain Trail!
        if (!e.isBoss && e.hp < e.maxHp) {
          const bw = Math.max(30, e.radius * 1.65);
          const bx = e.x - bw / 2;
          const by = e.y - e.radius - 14;
          ctx.fillStyle = '#1E1A17';
          ctx.beginPath(); ctx.roundRect(bx - 2.5, by - 2.5, bw + 5, 10, 4); ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.roundRect(bx, by, bw * clamp(e.hpTrail / e.maxHp, 0, 1), 5, 2.5); ctx.fill();
          ctx.fillStyle = '#E8483F';
          ctx.beginPath(); ctx.roundRect(bx, by, bw * clamp(e.hp / e.maxHp, 0, 1), 5, 2.5); ctx.fill();
        }
      });
    },

    renderPets(ctx) {
      if (!this.pets || this.pets.length === 0) return;
      const ps = this.petSynergies || {};
      const rallyOn = (this.player && this.player.petRallyTimer > 0);
      const apexOn = ps.apexPredators && this.apexActiveTimer > 0;

      // Render crisp animated Focus Reticle on the Pet Rally target!
      if (rallyOn && this.petRallyTarget && !this.petRallyTarget.dead) {
        const tgt = this.petRallyTarget;
        const rot = this.globalTime * 2.8;
        const rr = tgt.radius + 14 + Math.sin(this.globalTime * 9) * 3;
        ctx.save();
        ctx.translate(tgt.x, tgt.y);
        ctx.rotate(rot);
        ctx.strokeStyle = '#5FE3B8';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 8]);
        ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        for (let k = 0; k < 4; k++) {
          const a = (Math.PI / 2) * k;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (rr - 6), Math.sin(a) * (rr - 6));
          ctx.lineTo(Math.cos(a) * (rr + 8), Math.sin(a) * (rr + 8));
          ctx.stroke();
        }
        ctx.restore();
      }

      this.pets.forEach((pet) => {
        const isApexPet = apexOn && (pet.petId === 'catling' || pet.petId === 'mech_rex');
        const trailCol = isApexPet ? '#FFE07A' : (rallyOn ? '#5FE3B8' : (ps.alphaPack ? '#E84BFF' : '#2DD4BF'));
        if (pet.trail.length > 1) {
          ctx.save();
          ctx.strokeStyle = trailCol;
          ctx.lineCap = 'round';
          for (let i = 1; i < pet.trail.length; i++) {
            ctx.globalAlpha = (i / pet.trail.length) * 0.45;
            ctx.lineWidth = (i / pet.trail.length) * 4.4;
            ctx.beginPath();
            ctx.moveTo(pet.trail[i - 1].x, pet.trail[i - 1].y);
            ctx.lineTo(pet.trail[i].x, pet.trail[i].y);
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.save();
        ctx.translate(pet.x, pet.y);
        // Friendly aqua-gold companion ground ring + Alpha Pack / Rally neon aura!
        if (ps.alphaPack || rallyOn || isApexPet) {
          ctx.strokeStyle = isApexPet ? 'rgba(255, 212, 102, 0.78)' : (rallyOn ? 'rgba(52, 245, 197, 0.78)' : 'rgba(232, 75, 255, 0.62)');
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.ellipse(0, 18, 23 + Math.sin(this.globalTime * 6) * 2, 9, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(14, 18, 28, 0.46)';
        ctx.beginPath(); ctx.ellipse(0, 18, 17, 6.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = isApexPet ? '#FFE07A' : 'rgba(45, 212, 191, 0.85)';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        const hop = Math.abs(Math.sin(pet.phase)) * -6.5;
        const sq = Math.sin(pet.phase * 2) * 0.08;
        ctx.translate(0, hop);
        ctx.scale(pet.facing * (1 - sq), 1 + sq);
        const sz = pet.petId === 'mech_rex' ? 54 : 46;
        this.drawSprite(ctx, 'pet:' + pet.petId, -sz / 2, -sz / 2 - 4, sz, sz);
        ctx.restore();
      });
    },

    renderPlayer(ctx) {
      const p = this.player;
      ctx.save();
      ctx.translate(p.x, p.y);

      if (this.run.charDef.perks && this.run.charDef.perks.proximityOverclock) {
        ctx.strokeStyle = 'rgba(248, 186, 58, 0.32)';
        ctx.lineWidth = 2.4;
        ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.arc(0, 0, 165, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }

      // Ground shadow
      ctx.fillStyle = 'rgba(12, 16, 26, 0.45)';
      ctx.beginPath(); ctx.ellipse(0, 27, 25, 10, 0, 0, Math.PI * 2); ctx.fill();

      // Jet-Dash thruster flare cone
      if (p.dashTimer > 0) {
        ctx.save();
        ctx.rotate(Math.atan2(p.dashDy, p.dashDx) + Math.PI);
        ctx.fillStyle = '#5BD6A0';
        ctx.beginPath(); ctx.moveTo(14, -11); ctx.lineTo(52, 0); ctx.lineTo(14, 11); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#FFE07A';
        ctx.beginPath(); ctx.moveTo(14, -5); ctx.lineTo(34, 0); ctx.lineTo(14, 5); ctx.closePath(); ctx.fill();
        ctx.restore();
      }

      // Energy Shield bubble
      if (p.shield > 0) {
        ctx.strokeStyle = '#9CD3FF';
        ctx.fillStyle = 'rgba(107, 163, 255, 0.18)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, -2, 36, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }

      // Equipped weapons float around the player and kick when they fire
      const rigTools = this.run.tools.filter((sl) => {
        const k = window.MM.getContraption(sl.id).kind;
        return k !== 'orbital_sat' && k !== 'orbital_saw' && k !== 'orbital_mirror' && k !== 'orbital_ball' && k !== 'orbital_frost' && k !== 'drone' && k !== 'saw_drone' && k !== 'drill_drone' && k !== 'shield_drone';
      });
      rigTools.forEach((slot, idx) => {
        const count = rigTools.length;
        const spread = Math.min(Math.PI * 1.4, count * 0.72);
        const baseA = count === 1 ? (p.facing > 0 ? -0.3 : Math.PI + 0.3) : (-Math.PI / 2 - spread / 2 + (spread * idx) / Math.max(1, count - 1));
        const bob = Math.sin(this.waveElapsed * 4.5 + idx * 1.4) * 3;
        const kick = (slot.firePulse || 0) * 9;
        const rx = Math.cos(baseA) * (42 + kick);
        const ry = Math.sin(baseA) * (36 + kick) + bob;
        const sc = 1 + (slot.firePulse || 0) * 0.32;
        ctx.save();
        ctx.translate(rx, ry);
        ctx.scale(sc, sc);
        this.drawSprite(ctx, 'tool:' + slot.id, -12, -12, 24, 24);
        ctx.restore();
      });

      // Player Alien Sprite with bouncy stride & squash-stretch
      const speed = Math.hypot(p.vx, p.vy);
      const isMoving = speed > 18;
      // calm, readable walk cycle (small hop, light squash)
      const bobY = isMoving ? Math.abs(Math.sin(p.walkPhase)) * -3 : Math.sin(this.waveElapsed * 3.4) * -1;
      const squash = isMoving ? Math.sin(p.walkPhase * 2) * 0.03 : Math.sin(this.waveElapsed * 3.4) * 0.012;

      ctx.save();
      ctx.translate(0, bobY);
      ctx.rotate(p.tilt);
      ctx.scale(p.facing * (1 - squash), 1 + squash);

      if (p.invuln > 0 && p.hitFlash <= 0 && Math.floor(this.waveElapsed * 16) % 2 === 0) {
        ctx.globalAlpha = 0.68;
      }
      const hatId = window.MM.Meta.get().selectedHat;
      const hasHat = hatId && hatId !== 'none';
      this.drawSprite(ctx, (hasHat ? 'charbare:' : 'char:') + this.run.charId, -36, -40, 72, 72, p.hitFlash > 0 ? 0.85 : 0);
      if (hasHat) {
        this.drawSprite(ctx, 'hat:' + hatId, -36, -44, 72, 72, p.hitFlash > 0 ? 0.85 : 0);
      }
      ctx.restore();

      this.renderPlayerHealthBar(ctx);
      ctx.restore();
    },

    // Health bar right under the engineer's feet, so you never have to look up.
    // Green > 60%, yellow > 30%, red below; a pale strip trails recent damage.
    renderPlayerHealthBar(ctx) {
      const p = this.player;
      const maxHp = Math.max(1, (this.stats && this.stats.maxHp) || 1);
      const pct = clamp(p.hp / maxHp, 0, 1);
      if (p.hpLag === undefined || p.hpLag < pct) p.hpLag = pct;
      p.hpLag += (pct - p.hpLag) * 0.06;
      const W = 58;
      const H = 9;
      const x = -W / 2;
      const y = 36;
      const low = pct <= 0.3;
      const pulse = low ? 1 + Math.sin(this.waveElapsed * 10) * 0.06 : 1;
      ctx.save();
      ctx.translate(0, y + H / 2);
      ctx.scale(pulse, pulse);
      ctx.translate(0, -H / 2);
      // inked track
      ctx.fillStyle = '#1E1A17';
      ctx.beginPath(); ctx.roundRect(x - 2.5, -2.5, W + 5, H + 5, 5); ctx.fill();
      ctx.fillStyle = '#4A3B33';
      ctx.beginPath(); ctx.roundRect(x, 0, W, H, 3); ctx.fill();
      // damage trail, then current health
      ctx.fillStyle = '#F4E3C1';
      if (p.hpLag > pct) { ctx.beginPath(); ctx.roundRect(x, 0, W * p.hpLag, H, 3); ctx.fill(); }
      ctx.fillStyle = pct > 0.6 ? '#6FA84F' : (pct > 0.3 ? '#E8B52E' : '#C9433A');
      if (pct > 0) { ctx.beginPath(); ctx.roundRect(x, 0, Math.max(3, W * pct), H, 3); ctx.fill(); }
      // pen highlight + quarter ticks
      ctx.strokeStyle = 'rgba(255,248,230,0.55)';
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      if (pct > 0.08) { ctx.beginPath(); ctx.moveTo(x + 3, 2.4); ctx.lineTo(x + Math.max(4, W * pct - 3), 2.4); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(30,26,23,0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      [0.25, 0.5, 0.75].forEach((k) => { ctx.moveTo(x + W * k, 1); ctx.lineTo(x + W * k, H - 1); });
      ctx.stroke();
      ctx.restore();
    },

    renderOrbitalsAndDrones(ctx) {
      const p = this.player;
      this.orbitals.forEach((orb) => {
        // Energy chain tether for Tethered Wrecking Ball!
        if (orb.def.kind === 'orbital_ball') {
          ctx.save();
          ctx.strokeStyle = '#4AA3E8';
          ctx.lineWidth = 4;
          ctx.setLineDash([8, 6]);
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(orb.x, orb.y); ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
        if (orb.trail.length > 1) {
          ctx.save();
          ctx.strokeStyle = orb.def.kind === 'orbital_mirror' ? '#FFE07A' : (orb.def.kind === 'orbital_saw' ? '#E8EEF2' : (orb.def.kind === 'orbital_ball' ? '#E8483F' : '#9CD3FF'));
          ctx.lineCap = 'round';
          for (let i = 1; i < orb.trail.length; i++) {
            ctx.globalAlpha = (i / orb.trail.length) * 0.5;
            ctx.lineWidth = (i / orb.trail.length) * 6;
            ctx.beginPath();
            ctx.moveTo(orb.trail[i - 1].x, orb.trail[i - 1].y);
            ctx.lineTo(orb.trail[i].x, orb.trail[i].y);
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.save();
        ctx.translate(orb.x, orb.y);
        if (orb.def.kind === 'orbital_saw' || orb.def.kind === 'orbital_ball') ctx.rotate(this.waveElapsed * 14);
        const sz = orb.def.kind === 'orbital_ball' ? 48 : 42;
        this.drawSprite(ctx, 'tool:' + orb.def.id, -sz / 2, -sz / 2, sz, sz);
        ctx.restore();
      });

      this.drones.forEach((dr) => {
        if (dr.trail.length > 1) {
          ctx.save();
          ctx.strokeStyle = dr.isDrill ? '#FFE07A' : '#5BD6A0';
          ctx.lineCap = 'round';
          for (let i = 1; i < dr.trail.length; i++) {
            ctx.globalAlpha = (i / dr.trail.length) * 0.45;
            ctx.lineWidth = (i / dr.trail.length) * 4.5;
            ctx.beginPath();
            ctx.moveTo(dr.trail[i - 1].x, dr.trail[i - 1].y);
            ctx.lineTo(dr.trail[i].x, dr.trail[i].y);
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.save();
        ctx.translate(dr.x, dr.y + Math.sin(this.waveElapsed * 8 + dr.angle) * 3.5);
        ctx.rotate(dr.isSaw ? this.waveElapsed * 15 : clamp(dr.vx * 0.0007, -0.25, 0.25));
        const key = dr.isDrill ? 'tool:drill_drone' : (dr.isSaw ? 'tool:saw_drone' : 'tool:assembler_drone');
        this.drawSprite(ctx, key, -20, -20, 40, 40);
        ctx.restore();
      });
    },

    renderDebris(ctx) {
      const INK = '#1E1A17';
      this.debris.forEach((db) => {
        const alpha = clamp(db.life / 0.35, 0, 1);
        const s = db.size;
        ctx.save();
        // ground shadow
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.ellipse(db.x, db.y + 4, s * 0.65, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
        // chunky outlined rock chip
        ctx.globalAlpha = alpha;
        ctx.translate(db.x, db.y - db.z);
        ctx.rotate(db.rot);
        ctx.beginPath();
        ctx.moveTo(-s * 0.55, -s * 0.2);
        ctx.lineTo(-s * 0.1, -s * 0.6);
        ctx.lineTo(s * 0.55, -s * 0.3);
        ctx.lineTo(s * 0.45, s * 0.45);
        ctx.lineTo(-s * 0.35, s * 0.5);
        ctx.closePath();
        ctx.fillStyle = db.color;
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,248,230,0.55)';
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.22); ctx.lineTo(0, -s * 0.42); ctx.stroke();
        ctx.restore();
      });
    },

    renderProjectiles(ctx) {
      this.projectiles.forEach((pr) => {
        ctx.save();
        ctx.translate(pr.x, pr.y);
        if (pr.kind === 'saw') {
          ctx.rotate(pr.rot);
          this.drawSprite(ctx, 'tool:gyro_saw', -20, -20, 40, 40);
        } else if (pr.kind === 'boomerang') {
          ctx.rotate(pr.rot * 1.15);
          this.drawSprite(ctx, 'tool:plasma_rang', -20, -20, 40, 40);
        } else if (pr.kind === 'nanobot') {
          ctx.fillStyle = '#1E1A17';
          ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#5BD6A0';
          ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
          penShine(ctx, 0, 0, 4.5);
        } else if (pr.kind === 'gear') {
          ctx.rotate(pr.rot);
          this.drawSprite(ctx, 'icon:gear', -13, -13, 26, 26);
        } else if (pr.kind === 'satchel') {
          ctx.rotate(pr.t * 9);
          this.drawSprite(ctx, 'tool:cluster_charge', -15, -15, 30, 30);
        } else if (pr.kind === 'ice') {
          ctx.rotate(Math.atan2(pr.vy, pr.vx));
          ctx.fillStyle = '#4AA3E8';
          ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-7, -6); ctx.lineTo(-4, 0); ctx.lineTo(-7, 6); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-2, -2.5); ctx.lineTo(-2, 2.5); ctx.closePath(); ctx.fill();
        } else if (pr.kind === 'ember') {
          ctx.fillStyle = '#1E1A17';
          ctx.beginPath(); ctx.arc(0, 0, pr.radius + 2.2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#E8483F';
          ctx.beginPath(); ctx.arc(0, 0, pr.radius, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#FFE07A';
          ctx.beginPath(); ctx.arc(0, 0, pr.radius * 0.55, 0, Math.PI * 2); ctx.fill();
        } else if (pr.kind === 'bullet') {
          ctx.rotate(Math.atan2(pr.vy, pr.vx));
          // brass slug: flat back, rounded nose, inked, colour printed a touch off the line
          const slug = () => { ctx.beginPath(); ctx.moveTo(-9, -3.6); ctx.lineTo(3, -3.6); ctx.quadraticCurveTo(10, -3.4, 10, 0); ctx.quadraticCurveTo(10, 3.4, 3, 3.6); ctx.lineTo(-9, 3.6); ctx.closePath(); };
          ctx.save(); ctx.translate(0.8, 0.7); slug(); ctx.fillStyle = pr.color || '#E0AE35'; ctx.fill(); ctx.restore();
          slug(); ctx.strokeStyle = '#1E1A17'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.stroke();
          ctx.strokeStyle = '#1E1A17'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(-4, -3.4); ctx.lineTo(-4, 3.4); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,248,230,0.8)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(-1, -1.6); ctx.lineTo(5, -1.6); ctx.stroke();
        } else if (pr.kind === 'plasma') {
          ctx.fillStyle = '#1E1A17';
          ctx.beginPath(); ctx.arc(0, 0, pr.radius + 2.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#C084FC';
          ctx.beginPath(); ctx.arc(0, 0, pr.radius, 0, Math.PI * 2); ctx.fill();
          penShine(ctx, 0, 0, pr.radius);
        } else if (pr.kind === 'grenade') {
          ctx.rotate(pr.rot || 0);
          ctx.fillStyle = '#1E1A17';
          ctx.beginPath(); ctx.arc(0, 0, 11.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#FFC233';
          ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#E8483F';
          ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
        } else if (pr.kind === 'acid_needle') {
          ctx.rotate(Math.atan2(pr.vy, pr.vx));
          ctx.fillStyle = '#1E1A17';
          ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-9, -5.5); ctx.lineTo(-9, 5.5); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#5BD6A0';
          ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-7, -3.5); ctx.lineTo(-7, 3.5); ctx.closePath(); ctx.fill();
        } else if (pr.kind === 'nova_ring') {
          ctx.strokeStyle = '#1E1A17';
          ctx.lineWidth = 9;
          ctx.beginPath(); ctx.arc(0, 0, pr.radius, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = '#C6A6FF';
          ctx.lineWidth = 5;
          ctx.beginPath(); ctx.arc(0, 0, pr.radius, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = '#5BD6A0';
          ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.arc(0, 0, pr.radius * 0.72, 0, Math.PI * 2); ctx.stroke();
        } else if (pr.kind === 'black_hole') {
          const pullR = pr.pullRadius || 105;
          ctx.strokeStyle = 'rgba(232, 121, 249, 0.25)';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 6]);
          ctx.beginPath(); ctx.arc(0, 0, pullR, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#0B0E18';
          ctx.beginPath(); ctx.arc(0, 0, pr.radius, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#E879F9';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.strokeStyle = '#5FE3B8';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, 0, pr.radius * 0.55, 0, Math.PI * 2); ctx.stroke();
        } else if (pr.kind === 'cryo_shell') {
          ctx.fillStyle = '#1E1A17';
          ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#7DD3FC';
          ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
          penShine(ctx, 0, 0, 9);
        }
        ctx.restore();
      });

    },

    // Enemy shots: drawn after all effects. Dark halo + white ring + colour
    // core, and a short tail behind so the direction of travel reads at a glance.
    renderEnemyShots(ctx) {
      this.enemyShots.forEach((s) => {
        ctx.save();
        ctx.translate(s.x, s.y);
        const sp = Math.hypot(s.vx, s.vy) || 1;
        const tl = Math.min(34, sp * 0.13);
        const ux = s.vx / sp;
        const uy = s.vy / sp;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = '#1E1A17';
        ctx.lineWidth = s.r * 1.5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-ux * tl, -uy * tl); ctx.stroke();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.r * 0.8;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#1E1A17';
        ctx.beginPath(); ctx.arc(0, 0, s.r + 3.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(0, 0, s.r + 1.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.arc(0, 0, s.r * 0.85, 0, Math.PI * 2); ctx.fill();
        penShine(ctx, 0, 0, s.r * 0.85);
        ctx.restore();
      });
    },

    renderFxLayer(ctx, isGround) {
      this.fxSprites.forEach((f) => {
        if (f.delay > 0 || !!f.ground !== isGround) return;
        const u = 1 - f.life / f.maxLife;
        let sc = 1;
        if (f.pop) {
          sc = u < 0.25 ? (u / 0.25) * 1.15 : (1.15 + (u - 0.25) * (f.scaleEnd - 1.15));
        } else {
          sc = 0.7 + u * (f.scaleEnd - 0.7);
        }
        const alpha = (f.fadeOut ? clamp(1 - Math.pow(u, 1.8), 0, 1) : 1) * (f.maxAlpha !== undefined ? f.maxAlpha : 1);
        const sz = f.size * sc;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        this.drawSprite(ctx, f.key, -sz / 2, -sz / 2, sz, sz);
        ctx.restore();
      });
    },

    renderFX(ctx) {
      const INK = '#1E1A17';
      const FX_DIM = 0.78; // own effects slightly faded; enemy shots draw on top at full strength

      // Shockwave rings: ink under-stroke + coloured ring + soft fill
      this.rings.forEach((rg) => {
        const u = 1 - rg.life / rg.maxLife;
        const currR = Math.max(2, rg.r + (rg.maxR - rg.r) * u);
        const w = Math.max(2, 6 * (1 - u));
        if (rg.seed === undefined) rg.seed = Math.random() * 100;
        ctx.globalAlpha = (1 - u) * 0.12;
        ctx.fillStyle = rg.color;
        wobblyCircle(ctx, rg.x, rg.y, currR, rg.seed, 0.06);
        ctx.fill();
        ctx.globalAlpha = (1 - u) * 0.9 * FX_DIM;
        ctx.strokeStyle = INK;
        ctx.lineWidth = w + 4;
        ctx.stroke();
        ctx.strokeStyle = rg.color;
        ctx.lineWidth = w;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      // Beams & lightning: ink outline, coloured body, white-hot core
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      this.beams.forEach((b) => {
        ctx.globalAlpha = clamp(b.life / b.maxLife, 0, 1) * FX_DIM;
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        if (b.jagged) {
          const segs = 4;
          for (let s = 1; s < segs; s++) {
            const t = s / segs;
            ctx.lineTo(b.x1 + (b.x2 - b.x1) * t + rand(-10, 10), b.y1 + (b.y2 - b.y1) * t + rand(-10, 10));
          }
        }
        ctx.lineTo(b.x2, b.y2);
        ctx.strokeStyle = INK;
        ctx.lineWidth = b.width + 5;
        ctx.stroke();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.width;
        ctx.stroke();
        if (b.width >= 4) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = Math.max(1.5, b.width * 0.3);
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;

      this.renderFxLayer(ctx, false);

      // Particles: chunky ink-backed sparks & chips
      this.particles.forEach((pt) => {
        ctx.globalAlpha = clamp(pt.life / pt.maxLife, 0, 1) * FX_DIM;
        const r = pt.r;
        if (pt.shape === 'circle') {
          ctx.fillStyle = INK;
          ctx.beginPath(); ctx.arc(pt.x, pt.y, r + 1.6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = pt.color;
          ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2); ctx.fill();
        } else {
          if (pt.rot === undefined) pt.rot = Math.random() * Math.PI * 2;
          const chip = (k) => {
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
              const a = pt.rot + i * 1.57 + (i % 2 ? 0.25 : -0.15);
              const rr = (r + k) * (i % 2 ? 0.8 : 1.15);
              const px = pt.x + Math.cos(a) * rr;
              const py = pt.y + Math.sin(a) * rr;
              if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
            }
            ctx.closePath();
          };
          ctx.fillStyle = INK; chip(2); ctx.fill();
          ctx.fillStyle = pt.color; chip(0); ctx.fill();
        }
      });
      ctx.globalAlpha = 1;

      // Floating text: cartoon numbers with thick ink outline, drop shadow and a pop on spawn
      const showNums = !window.MM.Meta.getPrefs || window.MM.Meta.getPrefs().damageNumbers !== false;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      this.texts.forEach((tx) => {
        if (!showNums && /^\d+!?$/.test(tx.text)) return;
        const lifeU = clamp(tx.life / tx.maxLife, 0, 1);
        const age = 1 - lifeU;
        const pop = age < 0.1 ? 1 + (1 - age / 0.1) * 0.25 : 1;
        const size = Math.round(tx.size * pop);
        ctx.globalAlpha = lifeU < 0.35 ? lifeU / 0.35 : 1;
        ctx.font = `600 ${size}px "Fredoka", "Lexend", sans-serif`;
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(4, size * 0.32);
        ctx.strokeStyle = INK;
        ctx.strokeText(tx.text, tx.x, tx.y + 3);
        ctx.fillStyle = INK;
        ctx.fillText(tx.text, tx.x, tx.y + 3);
        ctx.strokeText(tx.text, tx.x, tx.y);
        ctx.fillStyle = tx.color;
        ctx.fillText(tx.text, tx.x, tx.y);
      });
      ctx.globalAlpha = 1;
    },

    // Screen-space Low-HP warning vignette, Off-Screen Threat/Loot Radar & Kill-Streak badge
    renderScreenSpacePolish(ctx) {
      ctx.save();
      ctx.scale(this.dpr, this.dpr);

      const hpRatio = this.player.hp / Math.max(1, this.stats.maxHp);
      if (hpRatio < 0.32 && this.state === 'playing') {
        const pulse = (0.32 - hpRatio) * 1.4 * (0.65 + Math.sin(this.globalTime * 7) * 0.35);
        const vg = ctx.createRadialGradient(this.viewW / 2, this.viewH / 2, this.viewW * 0.25, this.viewW / 2, this.viewH / 2, this.viewW * 0.65);
        vg.addColorStop(0, 'rgba(240, 84, 84, 0)');
        vg.addColorStop(1, `rgba(240, 84, 84, ${clamp(pulse, 0, 0.38)})`);
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, this.viewW, this.viewH);
      }

      // OFF-SCREEN DIRECTIONAL RADAR (Bosses ☠, Elites ★, Supply Crates 📦, Healing Fruits 🍏)
      if (this.state === 'playing') {
        const halfW = this.viewW / 2;
        const halfH = this.viewH / 2;
        const pad = 42;
        const targets = [];
        for (let i = 0; i < this.enemies.length; i++) {
          const e = this.enemies[i];
          if (e.dead) continue;
          if (e.isBoss) targets.push({ x: e.x, y: e.y, col: '#E8483F', ico: '☠' });
          else if (e.def && e.def.isLootGoblin) targets.push({ x: e.x, y: e.y, col: '#FFE07A', ico: '💰' });
          else if (e.def && e.def.isElite) targets.push({ x: e.x, y: e.y, col: '#FFE07A', ico: '★' });
        }
        if (this.liveEvent && this.liveEvent.kind === 'beacon') {
          targets.push({ x: this.liveEvent.x, y: this.liveEvent.y, col: '#5FE3B8', ico: '📡' });
        } else if (this.liveEvent && this.liveEvent.kind === 'reactor_surge' && this.reactorHubs && this.reactorHubs.length) {
          let bestH = this.reactorHubs[0];
          let bestD2 = 1e12;
          this.reactorHubs.forEach((h) => {
            const d2 = dist2(this.player.x, this.player.y, h.x, h.y);
            if (d2 < bestD2) { bestD2 = d2; bestH = h; }
          });
          targets.push({ x: bestH.x, y: bestH.y, col: '#FFE07A', ico: '⚡' });
        }
        for (let i = 0; i < this.pickups.length; i++) {
          const pk = this.pickups[i];
          if (pk.kind === 'crate') targets.push({ x: pk.x, y: pk.y, col: '#FFE07A', ico: '📦' });
          else if (pk.kind === 'fruit' && hpRatio < 0.72) targets.push({ x: pk.x, y: pk.y, col: '#5FE3B8', ico: '+' });
        }
        const z = this.camZoom || 1;
        targets.slice(0, 8).forEach((tg) => {
          const sx = (tg.x - this.cam.x) * z + halfW;
          const sy = (tg.y - this.cam.y) * z + halfH;
          if (sx >= 24 && sx <= this.viewW - 24 && sy >= 24 && sy <= this.viewH - 24) return;
          const ang = Math.atan2(sy - halfH, sx - halfW);
          const ix = clamp(sx, pad, this.viewW - pad);
          const iy = clamp(sy, 96, this.viewH - 68);
          ctx.save();
          ctx.translate(ix, iy);
          // Crisp dark circular radar badge + directional arrow tip
          ctx.save();
          ctx.rotate(ang);
          ctx.fillStyle = tg.col;
          ctx.strokeStyle = '#1E1A17';
          ctx.lineWidth = 3;
          ctx.lineJoin = 'round';
          ctx.beginPath(); ctx.moveTo(25, 0); ctx.lineTo(13, -8); ctx.lineTo(13, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.restore();
          ctx.fillStyle = '#26434A';
          ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#1E1A17';
          ctx.lineWidth = 3.5;
          ctx.stroke();
          ctx.strokeStyle = tg.col;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, 0, 12.5, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = tg.col;
          ctx.font = '600 14px "Fredoka", "Lexend", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(tg.ico, 0, 5);
          ctx.restore();
        });
      }

      // Dynamic Kill-Streak counter badge (top-right under controls)
      if (this.killStreak >= 4 && this.killStreakTimer > 0) {
        const alpha = clamp(this.killStreakTimer / 0.5, 0, 1);
        const sx = this.viewW - 115;
        const sy = 96;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#1E1A17';
        ctx.beginPath(); ctx.roundRect(sx - 76, sy - 16, 152, 40, 12); ctx.fill();
        const plate = ctx.createLinearGradient(0, sy - 20, 0, sy + 20);
        plate.addColorStop(0, '#FFE07A');
        plate.addColorStop(1, '#F5A623');
        ctx.fillStyle = plate;
        ctx.beginPath(); ctx.roundRect(sx - 76, sy - 20, 152, 40, 12); ctx.fill();
        ctx.strokeStyle = '#1E1A17';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#1E1A17';
        ctx.font = '600 16px "Fredoka", "Lexend", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`×${this.killStreak} STREAK!`, sx, sy + 6);
      }

      // Floating Neon Virtual Thumbstick (Mobile / Touch Devices)
      if (this.touchMove && this.touchMove.active && this.state === 'playing') {
        const tm = this.touchMove;
        ctx.globalAlpha = 0.88;
        ctx.fillStyle = 'rgba(30, 26, 23, 0.45)';
        ctx.beginPath(); ctx.arc(tm.startX, tm.startY, 54, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255, 194, 51, 0.75)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // Direction line
        ctx.strokeStyle = 'rgba(255, 194, 51, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(tm.startX, tm.startY); ctx.lineTo(tm.curX, tm.curY); ctx.stroke();
        // Thumbstick knob
        ctx.fillStyle = '#FFC233';
        ctx.beginPath(); ctx.arc(tm.curX, tm.curY, 22, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.55;
        ctx.beginPath(); ctx.arc(tm.curX - 5, tm.curY - 5, 6, 0, Math.PI * 2); ctx.fill();
      }

      ctx.restore();
    }
  });
})();
