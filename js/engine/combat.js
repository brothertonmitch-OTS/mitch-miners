// ============================================================================
// MULTI-MINE — GameEngine: combat
// ============================================================================
(function () {
  // eslint-disable-next-line no-unused-vars
  const { ARENA_W, ARENA_H, clamp, dist2, rand, pick } = window.MM.EngineUtil;

  Object.assign(window.MM.GameEngine.prototype, {
    // ------------------------------------------------------------------------
    // HAZARDS & PROJECTILES
    // ------------------------------------------------------------------------
    updateHazards(dt) {
      for (let i = this.hazards.length - 1; i >= 0; i--) {
        const h = this.hazards[i];
        h.life -= dt;
        if (h.spawnT !== undefined) h.spawnT = Math.min(1, h.spawnT + dt * 6);

        if (h.kind === 'lava') {
          h.tick -= dt;
          h.smokeCd = (h.smokeCd || 0) - dt;
          if (h.smokeCd <= 0) {
            h.smokeCd = 0.45;
            this.spawnFx('fx:smoke_puff', h.x + rand(-14, 14), h.y - 16, { size: 28, life: 0.55, vy: -30, scaleEnd: 1.4 });
          }
          if (h.tick <= 0) {
            h.tick = 0.36;
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, h.x, h.y) <= (h.radius + e.radius) ** 2) {
                this.dealDamage(e, h.dmg, h.tags, false);
                this.applyBurn(e, h.dmg * 0.55, 2.5);
              }
            });
          }
          if (h.life <= 0) this.hazards.splice(i, 1);
        } else if (h.kind === 'acid') {
          h.tick -= dt;
          if (h.tick <= 0) {
            h.tick = 0.34;
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, h.x, h.y) <= (h.radius + e.radius) ** 2) {
                this.dealDamage(e, h.dmg, h.tags, false);
                e.shredTimer = Math.max(e.shredTimer, 3.0);
              }
            });
          }
          if (h.life <= 0) this.hazards.splice(i, 1);
        } else if (h.kind === 'tar') {
          h.tick -= dt;
          if (h.tick <= 0) {
            h.tick = 0.36;
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, h.x, h.y) <= (h.radius + e.radius) ** 2) {
                e.chillTimer = Math.max(e.chillTimer, 0.75); // Heavy slow!
                if (e.burnTimer > 0 && !h.ignited) {
                  h.ignited = true;
                  this.rings.push({ x: h.x, y: h.y, r: 10, maxR: h.radius * 1.1, color: '#E8483F', life: 0.32, maxLife: 0.32 });
                }
                if (h.ignited) {
                  this.dealDamage(e, h.dmg * 1.55, h.tags, false);
                  this.applyBurn(e, h.dmg * 0.5, 2.5);
                } else {
                  this.dealDamage(e, h.dmg * 0.65, h.tags, false);
                }
              }
            });
          }
          if (h.life <= 0) this.hazards.splice(i, 1);
        } else if (h.kind === 'gravity') {
          this.enemies.forEach((e) => {
            if (e.dead) return;
            const dx = h.x - e.x;
            const dy = h.y - e.y;
            const d = Math.hypot(dx, dy);
            if (d > 8 && d <= h.radius * 1.3) {
              const pull = (e.isBoss ? 60 : 235) * dt;
              e.x += (dx / d) * pull;
              e.y += (dy / d) * pull;
            }
          });
          h.tick -= dt;
          if (h.tick <= 0) {
            h.tick = 0.45;
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, h.x, h.y) <= (h.radius * 0.9) ** 2) {
                this.dealDamage(e, h.dmg * 0.28, h.tags, false);
              }
            });
          }
          if (h.life <= 0) {
            this.spawnFx('fx:volt_spark', h.x, h.y, { size: h.radius * 2.1, life: 0.38, rotSpd: -4 });
            this.spawnDebris(h.x, h.y, ['#C6A6FF', '#5BD6A0'], 10, 210);
            this.rings.push({ x: h.x, y: h.y, r: h.radius, maxR: 12, color: '#9B6BE0', life: 0.3, maxLife: 0.3 });
            this.rings.push({ x: h.x, y: h.y, r: 10, maxR: h.radius * 1.15, color: '#5BD6A0', life: 0.36, maxLife: 0.36 });
            this.cam.shake = Math.max(this.cam.shake, 5);
            window.MM.Audio.SFX.explode();
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, h.x, h.y) <= (h.radius * 1.1 + e.radius) ** 2) {
                this.dealDamage(e, h.dmg * 1.25, h.tags, false);
              }
            });
            this.hazards.splice(i, 1);
          }
        } else if (h.kind === 'drill') {
          const dx = h.tx - h.x;
          const dy = h.ty - h.y;
          const d = Math.hypot(dx, dy);
          if (d <= 18 || h.life <= 0) {
            this.spawnFx('fx:seismic_crack', h.x, h.y, { size: h.radius * 1.8, life: 0.45, ground: true, maxAlpha: 0.85 });
            this.spawnFx('tool:core_drill', h.x, h.y - 10, { size: 58, life: 0.45, vy: -70, rot: Math.PI, scaleEnd: 1.1 });
            this.spawnFx('fx:blast_star', h.x, h.y, { size: h.radius * 1.75, life: 0.34, rotSpd: 3 });
            this.spawnFx('fx:smoke_puff', h.x, h.y - 20, { size: 52, life: 0.55, vy: -36, scaleEnd: 1.5 });
            this.spawnDecal('crater', h.x, h.y, h.radius * 0.85);
            this.spawnDebris(h.x, h.y, ['#2B2F38', '#FFC233', '#C9D1D8'], 12, 230);
            this.rings.push({ x: h.x, y: h.y, r: 8, maxR: h.radius, color: '#FFE07A', life: 0.38, maxLife: 0.38 });
            this.cam.shake = Math.max(this.cam.shake, 5.5);
            window.MM.Audio.SFX.seismic();
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, h.x, h.y) <= (h.radius + e.radius) ** 2) {
                this.dealDamage(e, h.dmg, h.tags, false);
                this.applyBurn(e, h.dmg * 0.28, 2.5);
                if (!e.isBoss) e.stunTimer = Math.max(e.stunTimer, 0.5);
              }
            });
            this.hazards.splice(i, 1);
          } else {
            h.x += (dx / d) * h.speed * dt;
            h.y += (dy / d) * h.speed * dt;
            if (Math.random() < 0.65) {
              this.spawnFx('fx:smoke_puff', h.x + rand(-8, 8), h.y + rand(-8, 8), { size: 22, life: 0.28, vy: -18, scaleEnd: 1.35 });
            }
          }
        }
      }
    },

    updateProjectiles(dt) {
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const pr = this.projectiles[i];
        this._dmgSource = pr.source || null;

        if (pr.kind === 'cryo_shell') {
          pr.t += dt / pr.dur;
          const u = Math.min(1, pr.t);
          pr.x = pr.sx + (pr.tx - pr.sx) * u;
          pr.y = pr.sy + (pr.ty - pr.sy) * u - Math.sin(u * Math.PI) * 76;
          if (pr.t >= 1) {
            this.spawnFx('fx:cryo_burst', pr.tx, pr.ty, { size: pr.radius * 2.0, life: 0.36, rotSpd: 3 });
            this.spawnDecal('frost', pr.tx, pr.ty, pr.radius * 0.75);
            this.rings.push({ x: pr.tx, y: pr.ty, r: 8, maxR: pr.radius, color: '#7DD3FC', life: 0.34, maxLife: 0.34 });
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, pr.tx, pr.ty) <= (pr.radius + e.radius) ** 2) {
                this.dealDamage(e, pr.dmg, pr.tags, false);
                e.chillTimer = Math.max(e.chillTimer, 3.6);
              }
            });
            this.hazards.push({
              kind: 'frost', x: pr.tx, y: pr.ty, radius: pr.radius * 0.86, dmg: pr.dmg * 0.25,
              tick: 0, life: 3.4, maxLife: 3.4, tags: pr.tags
            });
            window.MM.Audio.SFX.cryo();
            this.projectiles.splice(i, 1);
          }
          continue;
        }

        if (pr.kind === 'black_hole') {
          pr.life -= dt;
          pr.x = clamp(pr.x + pr.vx * dt, 56, ARENA_W - 56);
          pr.y = clamp(pr.y + pr.vy * dt, 56, ARENA_H - 56);
          pr.vx *= Math.pow(0.45, dt);
          pr.vy *= Math.pow(0.45, dt);
          pr.hitCooldowns.forEach((t, uid) => {
            if (t - dt <= 0) pr.hitCooldowns.delete(uid);
            else pr.hitCooldowns.set(uid, t - dt);
          });
          const pullR = pr.pullRadius || 105;
          for (let j = 0; j < this.enemies.length; j++) {
            const e = this.enemies[j];
            if (e.dead) continue;
            const dx = pr.x - e.x;
            const dy = pr.y - e.y;
            const d = Math.hypot(dx, dy);
            if (d <= pullR + e.radius) {
              if (!e.isBoss && d > 8) {
                e.x += (dx / d) * 165 * dt;
                e.y += (dy / d) * 165 * dt;
              }
              if (d <= pr.radius + e.radius + 16 && !pr.hitCooldowns.has(e.uid)) {
                pr.hitCooldowns.set(e.uid, 0.34);
                this.dealDamage(e, pr.dmg * 0.48, pr.tags, false);
              }
            }
          }
          if (pr.life <= 0) {
            this.rings.push({ x: pr.x, y: pr.y, r: pullR, maxR: 10, color: '#E879F9', life: 0.34, maxLife: 0.34 });
            this.rings.push({ x: pr.x, y: pr.y, r: 10, maxR: pullR * 0.9, color: '#5FE3B8', life: 0.32, maxLife: 0.32 });
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, pr.x, pr.y) <= (pullR + e.radius) ** 2) {
                this.dealDamage(e, pr.dmg * 1.15, pr.tags, true);
              }
            });
            window.MM.Audio.SFX.explode();
            this.projectiles.splice(i, 1);
          }
          continue;
        }

        if (pr.kind === 'satchel') {
          pr.t += dt / pr.dur;
          const u = Math.min(1, pr.t);
          pr.x = pr.sx + (pr.tx - pr.sx) * u;
          pr.y = pr.sy + (pr.ty - pr.sy) * u - Math.sin(u * Math.PI) * 68;
          if (pr.t >= 1) {
            this.spawnFx('fx:blast_star', pr.tx, pr.ty, { size: pr.radius * 2.15, life: 0.34, rotSpd: 3 });
            this.spawnFx('fx:smoke_puff', pr.tx, pr.ty - 10, { size: 42, life: 0.48, vy: -26, scaleEnd: 1.45 });
            this.spawnDecal('scorch', pr.tx, pr.ty, pr.radius * 0.72);
            this.spawnDebris(pr.tx, pr.ty, ['#E8483F', '#FFC233', '#2B2F38'], 8, 180);
            this.rings.push({ x: pr.tx, y: pr.ty, r: 8, maxR: pr.radius, color: '#E8483F', life: 0.32, maxLife: 0.32 });
            window.MM.Audio.SFX.explode();
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, pr.tx, pr.ty) <= (pr.radius + e.radius) ** 2) {
                this.dealDamage(e, pr.dmg, pr.tags, false);
                this.applyBurn(e, pr.dmg * 0.3, 2.5);
              }
            });
            if (pr.subCount > 0) {
              for (let k = 0; k < pr.subCount; k++) {
                const ang = (Math.PI * 2 * k) / pr.subCount + rand(-0.2, 0.2);
                const dist = rand(56, 92);
                this.projectiles.push({
                  kind: 'satchel', x: pr.tx, y: pr.ty, sx: pr.tx, sy: pr.ty,
                  tx: clamp(pr.tx + Math.cos(ang) * dist, 60, ARENA_W - 60),
                  ty: clamp(pr.ty + Math.sin(ang) * dist, 60, ARENA_H - 60),
                  t: 0, dur: 0.32, dmg: pr.dmg * 0.65, radius: pr.radius * 0.72, subCount: 0, tags: pr.tags
                });
              }
            }
            this.projectiles.splice(i, 1);
          }
          continue;
        }

        pr.life -= dt;
        if (pr.kind === 'nanobot') {
          const tgt = this.findNearestEnemy(pr.x, pr.y, 440);
          if (tgt) {
            const dx = tgt.x - pr.x;
            const dy = tgt.y - pr.y;
            const d = Math.hypot(dx, dy) || 1;
            pr.vx += ((dx / d) * 430 - pr.vx) * Math.min(1, dt * 8);
            pr.vy += ((dy / d) * 430 - pr.vy) * Math.min(1, dt * 8);
          }
        } else if (pr.kind === 'boomerang') {
          pr.age = (pr.age || 0) + dt;
          if (pr.age > 0.55) {
            pr.returning = true;
            const dx = this.player.x - pr.x;
            const dy = this.player.y - pr.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < 28) { this.projectiles.splice(i, 1); continue; }
            pr.vx += ((dx / d) * 620 - pr.vx) * Math.min(1, dt * 6);
            pr.vy += ((dy / d) * 620 - pr.vy) * Math.min(1, dt * 6);
          } else {
            pr.vx *= Math.pow(0.4, dt);
            pr.vy *= Math.pow(0.4, dt);
          }
        }
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;
        if (pr.rot !== undefined) pr.rot += dt * 16;

        if (pr.kind === 'saw' || pr.kind === 'boomerang') {
          if (pr.kind === 'saw') {
            let bounced = false;
            if (pr.x < 48 || pr.x > ARENA_W - 48) { pr.vx *= -1; pr.x = clamp(pr.x, 48, ARENA_W - 48); bounced = true; }
            if (pr.y < 48 || pr.y > ARENA_H - 48) { pr.vy *= -1; pr.y = clamp(pr.y, 48, ARENA_H - 48); bounced = true; }
            if (bounced) {
              pr.bounces--;
              this.spawnFx('fx:volt_spark', pr.x, pr.y, { size: 32, life: 0.18 });
              this.spawnDebris(pr.x, pr.y, ['#FFE07A', '#E8EEF2'], 4, 140);
              window.MM.Audio.SFX.hit();
              if (pr.bounces < 0) { this.projectiles.splice(i, 1); continue; }
            }
          }
          pr.hitCooldowns.forEach((t, uid) => {
            if (t - dt <= 0) pr.hitCooldowns.delete(uid);
            else pr.hitCooldowns.set(uid, t - dt);
          });
          for (let j = 0; j < this.enemies.length; j++) {
            const e = this.enemies[j];
            if (e.dead || pr.hitCooldowns.has(e.uid)) continue;
            if (dist2(pr.x, pr.y, e.x, e.y) <= (pr.radius + e.radius) ** 2) {
              pr.hitCooldowns.set(e.uid, 0.28);
              this.dealDamage(e, pr.dmg, pr.tags, false);
              if (pr.kind === 'boomerang') this.applyBurn(e, pr.dmg * 0.25, 2.5);
              this.spawnBurst(e.x, e.y, '#FFE07A', 5, 110);
            }
          }
        } else {
          let removed = false;
          for (let j = 0; j < this.enemies.length; j++) {
            const e = this.enemies[j];
            if (e.dead) continue;
            if (pr.hitIds && pr.hitIds.has(e.uid)) continue;
            if (dist2(pr.x, pr.y, e.x, e.y) <= (pr.radius + e.radius) ** 2) {
              this.dealDamage(e, pr.dmg, pr.tags, false);
              if (pr.kind === 'ice') {
                e.chillTimer = Math.max(e.chillTimer, 2.6);
                this.spawnFx('fx:cryo_burst', e.x, e.y, { size: 34, life: 0.2 });
              }
              if (pr.kind === 'ember') this.applyBurn(e, pr.dmg * 0.3, 2.5);
              if (pr.kind === 'acid_needle') {
                e.shredTimer = Math.max(e.shredTimer, 3.5);
                this.rings.push({ x: e.x, y: e.y, r: 6, maxR: 34, color: '#5BD6A0', life: 0.2, maxLife: 0.2 });
              }
              if (pr.kind === 'grenade') {
                const br = pr.blastR || 78;
                this.spawnFx('fx:blast_star', pr.x, pr.y, { size: br * 2.0, life: 0.34, rotSpd: 3 });
                this.spawnDecal('scorch', pr.x, pr.y, br * 0.78);
                this.spawnDebris(pr.x, pr.y, ['#FFC233', '#E8483F', '#2B2F38'], 9, 200);
                this.rings.push({ x: pr.x, y: pr.y, r: 8, maxR: br, color: '#E8483F', life: 0.32, maxLife: 0.32 });
                this.cam.shake = Math.max(this.cam.shake, 4.5);
                window.MM.Audio.SFX.explode();
                this.enemies.forEach((o) => {
                  if (!o.dead && o.uid !== e.uid && dist2(o.x, o.y, pr.x, pr.y) <= (br + o.radius) ** 2) {
                    this.dealDamage(o, pr.dmg * 0.85, pr.tags, false);
                  }
                });
                this.projectiles.splice(i, 1);
                removed = true;
                break;
              }
              if (pr.kind === 'plasma' && pr.bounces > 0) {
                pr.bounces--;
                if (pr.hitIds) pr.hitIds.add(e.uid);
                const nextTgt = this.findNearestEnemy(e.x, e.y, 260, e.uid);
                if (nextTgt) {
                  const a = Math.atan2(nextTgt.y - pr.y, nextTgt.x - pr.x);
                  pr.vx = Math.cos(a) * 560;
                  pr.vy = Math.sin(a) * 560;
                  this.spawnFx('fx:volt_spark', e.x, e.y, { size: 30, life: 0.16 });
                  break;
                }
              }
              if (pr.kind === 'nova_ring') {
                this.pickups.forEach((pk) => {
                  if (pk.kind === 'scrap' && dist2(pk.x, pk.y, pr.x, pr.y) <= 135 * 135) {
                    pk.superPull = true;
                  }
                });
              }
              if (pr.hitIds) pr.hitIds.add(e.uid);
              if (pr.pierce && pr.pierce > 1) {
                pr.pierce--;
              } else {
                this.projectiles.splice(i, 1);
                removed = true;
                break;
              }
            }
          }
          if (removed) continue;
        }

        if (pr.life <= 0 || pr.x < 16 || pr.x > ARENA_W - 16 || pr.y < 16 || pr.y > ARENA_H - 16) {
          this.projectiles.splice(i, 1);
        }
      }
    },

    // ------------------------------------------------------------------------
    // DAMAGE & KILLS
    // ------------------------------------------------------------------------
    applyBurn(enemy, dps, dur) {
      enemy.burnTimer = Math.max(enemy.burnTimer, dur);
      enemy.burnDps = Math.max(enemy.burnDps, dps);
    },

    dealDamage(enemy, rawAmount, tags = [], forceCrit = false) {
      if (!enemy || enemy.dead) return;
      const syn = this.synergies.bonuses;
      const perks = this.run.charDef.perks || {};

      let dmg = rawAmount;
      const effArmor = enemy.shredTimer > 0 ? 0 : enemy.armor;
      dmg = Math.max(1, dmg - effArmor);

      const sp = this.run.specials;
      if (enemy.shredTimer > 0) dmg *= 1.2;
      if (enemy.chillTimer > 0 && perks.cryoAmp) dmg *= perks.cryoAmp;
      if (enemy.chillTimer > 0 && sp.frostShatter > 0) dmg *= (1 + 0.22 * sp.frostShatter);
      if (enemy.burnTimer > 0 && syn.meltdown) dmg *= 1.25;
      if (sp.bossBreaker > 0 && (enemy.isBoss || enemy.id === 'geode_brute')) dmg *= (1 + 0.28 * sp.bossBreaker);
      if (perks.bossDmgMult && (enemy.isBoss || (enemy.def && enemy.def.isElite))) dmg *= perks.bossDmgMult;

      const isCrit = forceCrit || Math.random() * 100 < this.stats.critChance;
      if (isCrit) {
        dmg *= 1.60;
        if (perks.critHaste) this.player.hasteTimer = Math.max(this.player.hasteTimer, 1.5);
        if (sp.critHeal > 0 && this.player.lifeStealCd <= 0 && this.player.hp < this.stats.maxHp && Math.random() < Math.min(0.75, 0.25 * sp.critHeal)) {
          this.player.lifeStealCd = 0.14;
          this.player.hp = Math.min(this.stats.maxHp, this.player.hp + 1);
          this.addText(this.player.x + rand(-8, 8), this.player.y - 54, '+1', '#5BD6A0', 11);
        }
        if (syn.critArc && !tags.includes('_arc')) {
          const other = this.findNearestEnemy(enemy.x, enemy.y, 175, enemy.uid);
          if (other) {
            this.dealDamage(other, dmg * 0.45, ['VOLTAIC', '_arc'], false);
            this.beams.push({ x1: enemy.x, y1: enemy.y, x2: other.x, y2: other.y, color: '#FFE07A', width: 3.2, life: 0.16, maxLife: 0.16, jagged: true });
          }
        }
      }

      if (tags.includes('SEISMIC') && syn.shred) enemy.shredTimer = 3.2;
      if (syn.burn && tags.includes('THERMAL')) this.applyBurn(enemy, dmg * 0.25, 3.0);

      // Pyro Injector (Scared Sausage): ALL contraptions have 25% chance per stack to burn!
      if (sp.allBurn > 0 && Math.random() < Math.min(0.85, 0.25 * sp.allBurn)) {
        this.applyBurn(enemy, 8 + this.stats.engineering * 0.75, 3.2);
      }

      // Echo Strike Coil: 18% chance per stack on any hit to echo a bonus 50% neon shock-strike!
      if (sp.echoStrike > 0 && !tags.includes('_echo') && !tags.includes('_arc') && Math.random() < Math.min(0.65, 0.18 * sp.echoStrike)) {
        const echoDmg = Math.max(2, dmg * 0.5);
        this.rings.push({ x: enemy.x, y: enemy.y, r: 6, maxR: enemy.radius + 22, color: '#5FE3B8', life: 0.18, maxLife: 0.18 });
        this.dealDamage(enemy, echoDmg, [...tags, '_echo'], false);
      }

      // Cryo-Static Relay: hitting Chilled enemies arcs lightning!
      if (sp.cryoArc > 0 && enemy.chillTimer > 0 && !tags.includes('_arc')) {
        const arcs = this.findNearestEnemies(enemy.x, enemy.y, 175, 2 + sp.cryoArc).filter((o) => o.uid !== enemy.uid);
        arcs.forEach((o) => {
          this.dealDamage(o, 12 + this.stats.engineering * 0.8, ['VOLTAIC', '_arc'], false);
          this.beams.push({ x1: enemy.x, y1: enemy.y, x2: o.x, y2: o.y, color: '#9CD3FF', width: 2.5, life: 0.16, maxLife: 0.16, jagged: true });
        });
      }

      // Brotato Life Steal (throttled cleanly to max 10/s)
      if (this.stats.lifeSteal > 0 && this.player.lifeStealCd <= 0 && this.player.hp < this.stats.maxHp) {
        if (Math.random() * 100 < this.stats.lifeSteal) {
          this.player.lifeStealCd = 0.12;
          this.player.hp = Math.min(this.stats.maxHp, this.player.hp + 1);
          this.addText(this.player.x + rand(-10, 10), this.player.y - 54, '+1', '#5BD6A0', 11);
        }
      }

      let finalDmg = Math.max(1, Math.round(dmg));
      // Anti-oneshot Boss & Elite resilience cap (guarantees epic multi-phase Boss fights!)
      if (enemy.isBoss) {
        finalDmg = Math.min(finalDmg, Math.max(40, Math.round(enemy.maxHp * 0.05)));
      } else if (enemy.def && enemy.def.isElite) {
        finalDmg = Math.min(finalDmg, Math.max(30, Math.round(enemy.maxHp * 0.14)));
      }
      enemy.hp -= finalDmg;
      enemy.hitFlash = 0.11;
      this.run.totalDamageDealt += finalDmg;
      const srcKey = this._dmgSource || 'Contraptions';
      this.run.damageBySource[srcKey] = (this.run.damageBySource[srcKey] || 0) + finalDmg;
      this.run.waveDamageBySource[srcKey] = (this.run.waveDamageBySource[srcKey] || 0) + finalDmg;
      if (this.player && !srcKey.startsWith('★')) {
        this.addUltCharge(Math.min(1.4, finalDmg / 95));
      }

      if (isCrit) window.MM.Audio.SFX.crit();
      else window.MM.Audio.SFX.hit();

      // One number per enemy that keeps counting up while it is being hit,
      // instead of a new number for every tick of damage.
      const live = enemy._dmgText;
      if (live && live.life > live.maxLife * 0.45 && this.texts.includes(live)) {
        live.val += finalDmg;
        live.crit = live.crit || isCrit;
        live.text = live.crit ? `${live.val}!` : `${live.val}`;
        live.color = live.crit ? '#FFE07A' : live.color;
        live.size = Math.min(20, (live.crit ? 15 : 12) + Math.log2(1 + live.val / 40));
        live.x = enemy.x; live.y = enemy.y - enemy.radius - 8;
        live.life = live.maxLife;
      } else {
        this.addText(
          enemy.x + rand(-10, 10),
          enemy.y - enemy.radius - 8,
          isCrit ? `${finalDmg}!` : `${finalDmg}`,
          isCrit ? '#FFE07A' : (enemy.chillTimer > 0 ? '#9CD3FF' : '#FFFFFF'),
          isCrit ? 15 : 12
        );
        const t = this.texts[this.texts.length - 1];
        t.val = finalDmg; t.crit = isCrit; t.dmgNum = true;
        enemy._dmgText = t;
      }

      if (enemy.hp <= 0) this.killEnemy(enemy, isCrit);
    },

    killEnemy(e, wasCrit = false) {
      if (e.dead) return;
      e.dead = true;
      this.run.kills++;
      this.killStreak++;
      this.killStreakTimer = 2.6;
      if (this.killStreak > 0 && this.killStreak % 10 === 0) {
        this.addUltCharge(3);
      }
      this.addUltCharge(e.def.isElite ? 16 : 2.2);
      if (e.def.isElite) {
        // Elite Mini-Boss GUARANTEED Supply Crate + celebratory burst!
        this.pickups.push({ kind: 'crate', x: e.x, y: e.y, bob: 0 });
        this.addText(e.x, e.y - 48, '★ ELITE CRATE!', '#FFE07A', 17);
        window.MM.Audio.SFX.levelUp();
      }

      const syn = this.synergies.bonuses;
      const perks = this.run.charDef.perks || {};
      const sp = this.run.specials;

      this.spawnDebris(e.x, e.y, e.isBoss ? ['#FFC233', '#E8483F', '#E8EEF2'] : ['#E8483F', '#47515B', '#FFC233'], e.isBoss ? 18 : 6, e.isBoss ? 270 : 165);
      this.spawnFx('fx:smoke_puff', e.x, e.y, { size: e.isBoss ? 78 : 34, life: 0.36, vy: -18, scaleEnd: 1.45 });
      this.rings.push({ x: e.x, y: e.y, r: e.radius * 0.4, maxR: e.radius * 1.9, color: e.isBoss ? '#FFE07A' : '#E8483F', life: 0.26, maxLife: 0.26 });

      if (e.burnTimer > 0 && (perks.burnExplode || syn.meltdown)) {
        const blastR = 82 * this.getAreaMult();
        this.spawnFx('fx:blast_star', e.x, e.y, { size: blastR * 2.0, life: 0.34, rotSpd: 3 });
        this.spawnDecal('scorch', e.x, e.y, blastR * 0.72);
        this.rings.push({ x: e.x, y: e.y, r: 8, maxR: blastR, color: '#E8483F', life: 0.3, maxLife: 0.3 });
        this.enemies.forEach((o) => {
          if (!o.dead && dist2(o.x, o.y, e.x, e.y) <= (blastR + o.radius) ** 2) {
            this.dealDamage(o, 18 + this.stats.engineering * 1.1, ['THERMAL'], false);
            this.applyBurn(o, 10, 2.5);
          }
        });
      } else if (e.burnTimer > 0 && (syn.spreadBurn || sp.spreadBurn > 0)) {
        const spreadCnt = (syn.spreadBurn ? 1 : 0) + sp.spreadBurn;
        const targets = this.findNearestEnemies(e.x, e.y, 155, spreadCnt + 1).filter((o) => o.uid !== e.uid);
        targets.forEach((o) => this.applyBurn(o, e.burnDps, 3.0));
      }

      // Volatile Casing (Rip & Tear): 22% chance on death to explode!
      if (sp.deathExplode > 0 && Math.random() < Math.min(0.8, 0.22 * sp.deathExplode)) {
        const r = 74 * this.getAreaMult();
        this.spawnFx('fx:blast_star', e.x, e.y, { size: r * 1.9, life: 0.32, rotSpd: 3 });
        this.spawnDecal('scorch', e.x, e.y, r * 0.65);
        this.enemies.forEach((o) => {
          if (!o.dead && dist2(o.x, o.y, e.x, e.y) <= (r + o.radius) ** 2) {
            this.dealDamage(o, (16 + this.stats.engineering) * sp.deathExplode, ['MINES'], false);
          }
        });
      }

      // Shrapnel Capacitor (Cyberball): 28% chance on death to launch a Luck-scaling homing orb!
      if (sp.killOrb > 0 && Math.random() < Math.min(0.85, 0.28 * sp.killOrb)) {
        const target = this.findNearestEnemy(e.x, e.y, 380, e.uid);
        if (target) {
          const orbDmg = (12 + this.stats.luck * 1.2) * sp.killOrb;
          this.dealDamage(target, orbDmg, ['VOLTAIC'], false);
          this.beams.push({ x1: e.x, y1: e.y, x2: target.x, y2: target.y, color: '#5BD6A0', width: 3.5, life: 0.2, maxLife: 0.2 });
          this.spawnFx('fx:volt_spark', target.x, target.y, { size: 36, life: 0.2 });
        }
      }

      // Pocket Foundry (Pocket Factory): 7% chance on death to spawn a temporary Mini Gear Turret!
      if (sp.pocketFactory > 0 && this.deployables.length < 24 && Math.random() < Math.min(0.35, 0.07 * sp.pocketFactory)) {
        const tDef = window.MM.getContraption('gear_turret');
        this.deployables.push({
          slotUid: -77, slot: { tier: 1 }, def: tDef, kind: 'turret_gear',
          x: e.x, y: e.y, dmg: 12 + this.stats.engineering * 0.9, range: 280,
          fireCd: 0.25, healCd: 9, spawnT: 0, recoil: 0, life: 12, angle: 0
        });
        this.rings.push({ x: e.x, y: e.y, r: 4, maxR: 36, color: '#FFC233', life: 0.28, maxLife: 0.28 });
      }

      if (e.chillTimer > 0 && perks.cryoShatter) {
        this.spawnFx('fx:cryo_burst', e.x, e.y, { size: 70, life: 0.34, rotSpd: 4 });
        this.spawnDecal('frost', e.x, e.y, 44);
        for (let k = 0; k < 4; k++) {
          const ang = (Math.PI * 2 * k) / 4 + rand(0, 0.4);
          this.projectiles.push({
            kind: 'ice', x: e.x, y: e.y,
            vx: Math.cos(ang) * 350, vy: Math.sin(ang) * 350,
            dmg: 14 + this.stats.engineering * 0.85, radius: 7.5, pierce: 1,
            hitIds: new Set(), life: 0.55, tags: ['VOLTAIC']
          });
        }
      }

      if (e.def.behavior === 'splitter') {
        for (let k = 0; k < 2; k++) {
          this.spawnEnemy('mini_cinder', e.x + rand(-20, 20), e.y + rand(-20, 20));
        }
      }

      // Authentic Brotato Tight Scrap Economy — normalized against Hazard density & All-Cursed modifier
      // so Hazard 5 + All Cursed NEVER floods the shop with free money!
      const allCursedMod = this.hasModifier('all_cursed');
      const hzDensityNorm = 1 / Math.pow(this.run.hazard.countMult || 1, 0.92);
      const naturalCurse = e.isCursed && !allCursedMod;
      const normalChance = (this.run.wave > 12 ? Math.max(0.32, 0.56 - (this.run.wave - 12) * 0.025) : 0.56) * hzDensityNorm;
      const baseDrop = (e.isBoss || e.def.isElite) ? 1.0 : (naturalCurse ? Math.min(0.85, normalChance * 1.35) : normalChance);
      if (Math.random() < baseDrop) {
        const rawScrap = e.isBoss ? Math.min(12, Math.round(e.def.scrap * 0.45)) : (e.def.isElite ? 5 : Math.min(2, Math.max(1, Math.round(e.def.scrap * 0.52))));
        const scrapVal = Math.max(1, Math.round((rawScrap + (naturalCurse ? 1 : 0)) * (1 + Math.min(80, this.stats.scrapPct) / 100)));
        const dropCount = e.isBoss ? 6 : 1;
        for (let i = 0; i < dropCount; i++) {
          let gemScrap = Math.max(1, Math.round(scrapVal / dropCount));
          let bagged = false;
          if (!e.isBoss && this.run.salvageBag > 0) {
            const mult = sp.salvage3x > 0 ? 2 : 1;
            const take = Math.min(this.run.salvageBag, gemScrap);
            gemScrap += take * mult;
            this.run.salvageBag -= take;
            bagged = true;
          }
          // Crit Salvage Trophy (Hunting Trophy): Crit kills have 35% chance to drop +2 bonus Scrap!
          if (wasCrit && sp.critBounty > 0 && Math.random() < Math.min(0.85, 0.35 * sp.critBounty)) {
            gemScrap += 2 * sp.critBounty;
            bagged = true;
          }
          this.pickups.push({
            kind: 'scrap',
            x: e.x + rand(-18, 18),
            y: e.y + rand(-18, 18),
            scrap: gemScrap,
            xp: Math.max(1, Math.round((e.def.xp * 0.60) / dropCount)),
            bagged,
            bob: rand(0, 6)
          });
        }
      }

      // Authentic Brotato Loot Crate Drop with 1 / (1 + n) Diminishing Returns!
      if (!e.isBoss) {
        const baseCrateChance = (0.012 + this.stats.luck * 0.0009) * (1 + (this.stats.crateLuckPct || 0) / 100);
        const effCrateChance = baseCrateChance / (1 + this.run.cratesThisWave * 1.4);
        if (Math.random() < effCrateChance) {
          this.run.cratesThisWave++;
          this.pickups.push({ kind: 'crate', x: e.x, y: e.y, bob: 0 });
        }
      }

      // Deca-Nova Reactor: every 10th enemy eliminated detonates a massive neon chain-nova!
      if (this.run.specials.killNova > 0) {
        this.run.killNovaCounter = (this.run.killNovaCounter || 0) + 1;
        if (this.run.killNovaCounter >= 10) {
          this.run.killNovaCounter = 0;
          const nr = 155 * this.getAreaMult();
          const ndmg = (48 + (this.stats.engineering || 0) * 2.1) * this.run.specials.killNova;
          this.rings.push({ x: e.x, y: e.y, r: 12, maxR: nr, color: '#5FE3B8', life: 0.4, maxLife: 0.4 });
          this.rings.push({ x: e.x, y: e.y, r: 8, maxR: nr * 0.72, color: '#E879F9', life: 0.34, maxLife: 0.34 });
          this.addText(e.x, e.y - 34, '★ DECA-NOVA!', '#5FE3B8', 15);
          this.enemies.forEach((other) => {
            if (!other.dead && other !== e && dist2(other.x, other.y, e.x, e.y) <= (nr + other.radius) ** 2) {
              this.dealDamage(other, ndmg, ['VOLTAIC', '_arc'], true);
            }
          });
          window.MM.Audio.SFX.explode();
        }
      }

      // Golden Cargo-Bot (Live Arena Event) huge jackpot payout!
      if (e.def && e.def.isLootGoblin) {
        this.pickups.push({ kind: 'crate', x: e.x, y: e.y, bob: 0 });
        for (let g = 0; g < 10; g++) {
          this.pickups.push({
            kind: 'scrap',
            x: clamp(e.x + rand(-56, 56), 54, ARENA_W - 54),
            y: clamp(e.y + rand(-56, 56), 54, ARENA_H - 54),
            scrap: 2 + Math.floor(this.run.wave / 4), xp: 3, bob: rand(0, 6), superPull: true
          });
        }
        this.addText(e.x, e.y - 42, '💰 CARGO-BOT JACKPOT!', '#FFE07A', 18);
        this.rings.push({ x: e.x, y: e.y, r: 12, maxR: 130, color: '#FFE07A', life: 0.45, maxLife: 0.45 });
        window.MM.Audio.SFX.waveClear();
        this.notifyAch(window.MM.Meta.unlockAchievement('loot_goblin_slayer'));
        this.recordEventComplete();
      }

      if (e.isBoss) {
        this.run.bossKills++;
        if (this.run.bossKills >= 3) this.notifyAch(window.MM.Meta.unlockAchievement('boss_slayer_3'));
        this.cam.shake = 12;
        this.hitStop = 0.06;
        for (let b = 0; b < 6; b++) {
          this.spawnFx('fx:blast_star', e.x + rand(-48, 48), e.y + rand(-48, 48), {
            size: rand(76, 120), life: 0.45, delay: b * 0.08, rotSpd: rand(-4, 4)
          });
          this.spawnFx('fx:smoke_puff', e.x + rand(-36, 36), e.y + rand(-36, 36), {
            size: rand(48, 68), life: 0.7, delay: b * 0.08, vy: -36, scaleEnd: 1.65
          });
        }
        window.MM.Audio.SFX.waveClear();
        this.pickups.push({ kind: 'crate', x: e.x, y: e.y, bob: 0 });
        if (e.id === 'boss_excavator') this.notifyAch(window.MM.Meta.unlockAchievement('boss_1'));
        if (e.id === 'boss_pyroclast') this.notifyAch(window.MM.Meta.unlockAchievement('boss_2'));
        if (e.id === 'boss_quantum' && this.run.wave === 12) {
          this.run.won = true;
          this.notifyAch(window.MM.Meta.unlockAchievement('win_run'));
          this.beginWaveClear();
        }
      }
    }
  });
})();
