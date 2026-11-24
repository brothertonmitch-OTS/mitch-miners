// ============================================================================
// MULTI-MINE — GameEngine: weapons
// ============================================================================
(function () {
  // eslint-disable-next-line no-unused-vars
  const { ARENA_W, ARENA_H, clamp, dist2, rand, pick } = window.MM.EngineUtil;

  Object.assign(window.MM.GameEngine.prototype, {
    // ------------------------------------------------------------------------
    // CONTRAPTIONS
    // ------------------------------------------------------------------------
    computeToolDamage(slot, def) {
      const tier = slot.tier || 1;
      const tierMult = window.MM.TIER_DMG_MULT[tier] || 1;
      // Scale BOTH base damage AND Engineering bonus with Tier so merging ALWAYS makes weapons dramatically stronger!
      const engTierScale = 1 + (tier - 1) * 0.55;
      const engBonus = this.stats.engineering * (def.engScale || 0.9) * 0.58 * engTierScale;
      let base = (def.baseDmg * 0.82 * tierMult + engBonus) * Math.max(0.25, 1 + this.stats.damagePct / 100);
      const syn = this.synergies.bonuses;
      const perks = this.run.charDef.perks || {};

      if (def.tags.includes('MINES')) base *= syn.mineDmgMult;
      if (def.tags.includes('THERMAL')) base *= syn.thermalDmgMult;

      // Balanced Character Weapon Affinity (prevents 300%+ multi-tag double-dip exploits
      // like Kestrel 1.75x Gun * 1.75x Orbital = 3.06x, and respects primary favored tags
      // like Blib's Thermal guns not being penalized by non-Thermal gun penalties!)
      const charMults = [];
      if (def.tags.includes('MINES') && perks.mineDmgMult) charMults.push(perks.mineDmgMult);
      if (def.tags.includes('THERMAL') && perks.thermalMult) charMults.push(perks.thermalMult);
      if (def.tags.includes('ORBITAL') && perks.orbitalDmgMult) charMults.push(perks.orbitalDmgMult);
      if (def.tags.includes('ROBOTICS') && perks.roboticsDmgMult) charMults.push(perks.roboticsDmgMult);
      if (def.tags.includes('VOLTAIC') && perks.voltaicDmgMult) charMults.push(perks.voltaicDmgMult);
      if (def.tags.includes('SEISMIC') && perks.seismicDmgMult) charMults.push(perks.seismicDmgMult);
      if (def.kind && def.kind.startsWith('gun_') && perks.gunDmgMult) {
        // If character specifically favors Thermal (e.g. Blib) and this is a Thermal gun, skip non-Thermal gun penalty
        if (!(perks.gunDmgMult < 1 && def.tags.includes('THERMAL') && (perks.thermalMult || 1) > 1)) {
          charMults.push(perks.gunDmgMult);
        }
      }
      if (charMults.length > 0) {
        const pos = charMults.filter((m) => m > 1).sort((a, b) => b - a);
        const neg = charMults.filter((m) => m < 1);
        let affMult = 1;
        if (pos.length > 0) {
          // Strongest bonus at 100%, secondary matching bonuses at 25% so dual-tag weapons feel great without breaking balance
          let bonus = pos[0] - 1;
          for (let i = 1; i < pos.length; i++) bonus += (pos[i] - 1) * 0.25;
          affMult *= (1 + bonus);
        }
        neg.forEach((m) => { affMult *= m; });
        base *= affMult;
      }
      if (slot.cursed) base *= 1.30;      // Cursed Variant: +30% Damage!
      if (tier >= 4) base *= 1.15;        // Mk.IV★ Overcharged Evolution: +15% power + shock-burst!
      return Math.max(2, base);
    },

    getDeployCap(slot, def) {
      let cap = (def.maxActive || 2) + Math.floor((slot.tier - 1) * 0.7);
      const syn = this.synergies.bonuses;
      const perks = this.run.charDef.perks || {};
      if (def.tags.includes('ROBOTICS')) {
        cap += (perks.extraDeployCap || 0) + (syn.extraDeployCap || 0);
      }
      cap += this.run.specials.extraDeployCap;
      return cap;
    },

    updateTools(dt) {
      const p = this.player;
      this.run.tools.forEach((slot) => {
        if (slot.firePulse > 0) slot.firePulse = Math.max(0, slot.firePulse - dt * 3.8);
        const def = window.MM.getContraption(slot.id);
        if (def.kind === 'orbital_sat' || def.kind === 'orbital_saw' || def.kind === 'orbital_mirror' || def.kind === 'orbital_ball' || def.kind === 'orbital_frost' || def.kind === 'drone' || def.kind === 'saw_drone' || def.kind === 'drill_drone' || def.kind === 'shield_drone') {
          return;
        }

        const cursedSpd = slot.cursed ? 1.15 : 1.0;
        slot.cdTimer -= dt * this.getAspdMult(def.tags) * cursedSpd;
        if (slot.cdTimer > 0) return;

        const baseCd = def.cd * (window.MM.TIER_CD_MULT[slot.tier] || 1);
        slot.cdTimer = baseCd;
        slot.firePulse = 1; // Triggers recoil pop on the hovering tool rig around player!
        const dmg = this.computeToolDamage(slot, def);
        const area = this.getAreaMult() * (1 + ((slot.tier || 1) - 1) * 0.08);
        this._dmgSource = def.name;
        const projStart = this.projectiles.length;

        // Mk.IV OVERCHARGED EVOLUTION BONUS: every 3rd activation releases a golden evolved shock-burst!
        if (slot.tier >= 4) {
          slot._evoCnt = (slot._evoCnt || 0) + 1;
          if (slot._evoCnt >= 3) {
            slot._evoCnt = 0;
            const evoTgt = this.findNearestEnemy(p.x, p.y, 440);
            if (evoTgt) {
              const er = 72 * area;
              this.spawnFx('fx:volt_spark', evoTgt.x, evoTgt.y, { size: er * 1.6, life: 0.28, rotSpd: 5 });
              this.rings.push({ x: evoTgt.x, y: evoTgt.y, r: 8, maxR: er, color: '#FFE07A', life: 0.28, maxLife: 0.28 });
              this.enemies.forEach((e) => {
                if (!e.dead && dist2(e.x, e.y, evoTgt.x, evoTgt.y) <= (er + e.radius) ** 2) {
                  this.dealDamage(e, dmg * 0.55, def.tags, true);
                }
              });
            }
          }
        }

        switch (def.kind) {
          case 'mine':
          case 'cryo_mine':
          case 'magnet_mine': {
            const cap = this.getDeployCap(slot, def);
            const active = this.deployables.filter((d) => d.slotUid === slot.uid);
            if (active.length >= cap && active[0]) active[0].life = 0;
            const ang = rand(0, Math.PI * 2);
            const dist = rand(26, 68);
            const mx = clamp(p.x + Math.cos(ang) * dist, 64, ARENA_W - 64);
            const my = clamp(p.y + Math.sin(ang) * dist, 64, ARENA_H - 64);
            this.deployables.push({
              slotUid: slot.uid, slot, def, kind: def.kind,
              x: mx, y: my, dmg, radius: def.radius * area,
              armTimer: 0.3, spawnT: 0, recoil: 0, life: 18, pulse: 0
            });
            this.rings.push({ x: mx, y: my, r: 4, maxR: 32, color: def.kind === 'cryo_mine' ? '#4AA3E8' : (def.kind === 'magnet_mine' ? '#9B6BE0' : '#FFC233'), life: 0.25, maxLife: 0.25 });
            window.MM.Audio.SFX.deploy();
            break;
          }

          case 'cluster': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.15);
            const tx = target ? target.x : clamp(p.x + rand(-190, 190), 80, ARENA_W - 80);
            const ty = target ? target.y : clamp(p.y + rand(-190, 190), 80, ARENA_H - 80);
            this.projectiles.push({
              kind: 'satchel', x: p.x, y: p.y, sx: p.x, sy: p.y, tx, ty,
              t: 0, dur: 0.46, dmg, radius: def.radius * area, subCount: 3 + slot.tier, tags: def.tags
            });
            window.MM.Audio.SFX.deploy();
            break;
          }

          case 'turret_gear':
          case 'turret_welder':
          case 'turret_heal':
          case 'turret_tesla':
          case 'turret_cryo':
          case 'turret_laser':
          case 'turret_steam':
          case 'turret_flame':
          case 'turret_prism':
          case 'garden': {
            const cap = this.getDeployCap(slot, def);
            const active = this.deployables.filter((d) => d.slotUid === slot.uid);
            if (active.length >= cap && active[0]) {
              const oldest = active[0];
              oldest.x = clamp(p.x + rand(-76, 76), 72, ARENA_W - 72);
              oldest.y = clamp(p.y + rand(-76, 76), 72, ARENA_H - 72);
              oldest.life = 17; oldest.dmg = dmg; oldest.spawnT = 0;
              this.spawnFx('fx:smoke_puff', oldest.x, oldest.y + 8, { size: 42, life: 0.35, vy: -14, scaleEnd: 1.4 });
              this.rings.push({ x: oldest.x, y: oldest.y, r: 8, maxR: 42, color: '#5BD6A0', life: 0.28, maxLife: 0.28 });
              window.MM.Audio.SFX.deploy();
              break;
            }
            const tx = clamp(p.x + rand(-76, 76), 72, ARENA_W - 72);
            const ty = clamp(p.y + rand(-76, 76), 72, ARENA_H - 72);
            this.deployables.push({
              slotUid: slot.uid, slot, def, kind: def.kind,
              x: tx, y: ty, dmg, range: def.range * (1 + this.stats.areaPct / 240),
              fireCd: 0.2, healCd: 2.8, spawnT: 0, recoil: 0, life: 19, angle: 0
            });
            this.spawnFx('fx:smoke_puff', tx, ty + 10, { size: 44, life: 0.38, vy: -16, scaleEnd: 1.45 });
            this.rings.push({ x: tx, y: ty, r: 6, maxR: 44, color: '#5BD6A0', life: 0.3, maxLife: 0.3 });
            window.MM.Audio.SFX.deploy();
            break;
          }

          case 'ricochet_saw': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.3);
            const ang = target ? Math.atan2(target.y - p.y, target.x - p.x) : rand(0, Math.PI * 2);
            const count = slot.tier >= 3 ? 2 : 1;
            for (let i = 0; i < count; i++) {
              const spread = count === 2 ? (i === 0 ? -0.16 : 0.16) : 0;
              const spd = 470;
              this.projectiles.push({
                kind: 'saw', x: p.x, y: p.y,
                vx: Math.cos(ang + spread) * spd, vy: Math.sin(ang + spread) * spd,
                dmg, radius: 18 * Math.min(1.5, area), bounces: 2 + slot.tier,
                life: 3.4, rot: 0, hitCooldowns: new Map(), tags: def.tags
              });
            }
            window.MM.Audio.SFX.deploy();
            break;
          }

          case 'thumper': {
            this.triggerSeismicWave(p.x, p.y, def.radius * area, dmg, true, def.tags);
            break;
          }

          case 'drill': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.25);
            if (!target) { slot.cdTimer = 0.35; break; }
            this.hazards.push({
              kind: 'drill', x: p.x, y: p.y, tx: target.x, ty: target.y,
              speed: 400, dmg, radius: def.radius * area, tags: def.tags, life: 2.2
            });
            window.MM.Audio.SFX.seismic();
            break;
          }

          case 'magma_vent': {
            const target = this.findNearestEnemy(p.x, p.y, 400);
            const vx = target ? target.x : clamp(p.x + rand(-150, 150), 80, ARENA_W - 80);
            const vy = target ? target.y : clamp(p.y + rand(-150, 150), 80, ARENA_H - 80);
            const r = def.radius * area;
            this.hazards.push({
              kind: 'lava', x: vx, y: vy, radius: r, dmg: dmg * 0.42,
              tick: 0, smokeCd: 0.25, spawnT: 0, life: 4.5 + slot.tier * 0.6, maxLife: 4.5 + slot.tier * 0.6, tags: def.tags
            });
            this.spawnFx('fx:blast_star', vx, vy - 10, { size: r * 1.85, life: 0.38, rotSpd: 3 });
            this.spawnFx('fx:smoke_puff', vx - 12, vy - 26, { size: 46, life: 0.65, vx: -18, vy: -38, scaleEnd: 1.55 });
            this.spawnFx('fx:smoke_puff', vx + 12, vy - 24, { size: 42, life: 0.62, vx: 18, vy: -34, scaleEnd: 1.5 });
            this.spawnDecal('scorch', vx, vy, r * 0.92);
            this.spawnDebris(vx, vy, ['#FFC233', '#E8483F', '#47515B'], 9, 185);
            this.rings.push({ x: vx, y: vy, r: 10, maxR: r, color: '#E8483F', life: 0.36, maxLife: 0.36 });
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, vx, vy) <= (r + e.radius) ** 2) {
                this.dealDamage(e, dmg * 0.85, def.tags, false);
                this.applyBurn(e, dmg * 0.32, 3.2);
              }
            });
            window.MM.Audio.SFX.explode();
            break;
          }

          case 'kiln': {
            const r = def.radius * area;
            this.spawnFx('fx:blast_star', p.x, p.y, { size: r * 1.45, life: 0.32, rotSpd: 4, ground: true, maxAlpha: 0.85 });
            this.spawnDebris(p.x, p.y, ['#FFC233', '#E8483F'], 8, 170);
            this.rings.push({ x: p.x, y: p.y, r: 14, maxR: r, color: '#E8483F', life: 0.38, maxLife: 0.38 });
            const bolts = 5 + slot.tier * 2;
            for (let i = 0; i < bolts; i++) {
              const ang = (Math.PI * 2 * i) / bolts + this.waveElapsed;
              this.projectiles.push({
                kind: 'ember', x: p.x, y: p.y,
                vx: Math.cos(ang) * 330, vy: Math.sin(ang) * 330,
                dmg: dmg * 0.72, radius: 8.5, life: 0.64 * area, tags: def.tags
              });
            }
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, p.x, p.y) <= (r + e.radius) ** 2) {
                this.dealDamage(e, dmg, def.tags, false);
                this.applyBurn(e, dmg * 0.35, 3.0);
              }
            });
            window.MM.Audio.SFX.explode();
            break;
          }

          case 'cryo_wave': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.2);
            const ang = target ? Math.atan2(target.y - p.y, target.x - p.x) : rand(0, Math.PI * 2);
            const shards = 3 + slot.tier;
            for (let i = 0; i < shards; i++) {
              const off = (i - (shards - 1) / 2) * 0.22;
              this.projectiles.push({
                kind: 'ice', x: p.x, y: p.y,
                vx: Math.cos(ang + off) * 430, vy: Math.sin(ang + off) * 430,
                dmg, radius: 9.5, pierce: 1 + Math.floor(slot.tier / 2),
                hitIds: new Set(), life: 0.85 * area, tags: def.tags
              });
            }
            this.spawnFx('fx:cryo_burst', p.x + Math.cos(ang) * 28, p.y + Math.sin(ang) * 28, { size: 70, life: 0.3, rotSpd: 3.5 });
            this.rings.push({ x: p.x, y: p.y, r: 10, maxR: 78 * area, color: '#9CD3FF', life: 0.28, maxLife: 0.28 });
            window.MM.Audio.SFX.cryo();
            break;
          }

          case 'gravity_well': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.15);
            const gx = target ? target.x : clamp(p.x + rand(-160, 160), 100, ARENA_W - 100);
            const gy = target ? target.y : clamp(p.y + rand(-160, 160), 100, ARENA_H - 100);
            this.hazards.push({
              kind: 'gravity', x: gx, y: gy, radius: def.radius * area, dmg,
              tick: 0, life: 2.3, maxLife: 2.3, tags: def.tags
            });
            window.MM.Audio.SFX.cryo();
            break;
          }

          // --- 8 ACTIVE NEW ZERO-GUN CONTRAPTIONS ---
          case 'grapple': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.2);
            if (!target) { slot.cdTimer = 0.25; break; }
            const pullR = def.radius * area;
            this.beams.push({ x1: p.x, y1: p.y, x2: target.x, y2: target.y, color: '#FFC233', width: 5, life: 0.24, maxLife: 0.24 });
            this.spawnFx('tool:grapple_claw', target.x, target.y, { size: 46, life: 0.28, rot: Math.atan2(target.y - p.y, target.x - p.x) + Math.PI / 2 });
            this.rings.push({ x: target.x, y: target.y, r: pullR, maxR: 10, color: '#FFC233', life: 0.28, maxLife: 0.28 });
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, target.x, target.y) <= (pullR + e.radius) ** 2) {
                this.dealDamage(e, dmg, def.tags, false);
                e.shredTimer = Math.max(e.shredTimer, 3.5);
                if (!e.isBoss && e !== target) {
                  e.x += (target.x - e.x) * 0.55;
                  e.y += (target.y - e.y) * 0.55;
                }
              }
            });
            window.MM.Audio.SFX.seismic();
            break;
          }

          case 'acid_sprayer': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.2);
            const tx = target ? target.x : clamp(p.x + rand(-170, 170), 80, ARENA_W - 80);
            const ty = target ? target.y : clamp(p.y + rand(-170, 170), 80, ARENA_H - 80);
            const r = def.radius * area;
            this.hazards.push({
              kind: 'acid', x: tx, y: ty, radius: r, dmg: dmg * 0.45,
              tick: 0, life: 4.4 + slot.tier * 0.5, maxLife: 4.4 + slot.tier * 0.5, tags: def.tags
            });
            this.rings.push({ x: tx, y: ty, r: 8, maxR: r, color: '#5BD6A0', life: 0.3, maxLife: 0.3 });
            this.spawnDebris(tx, ty, ['#5BD6A0', '#3FC484', '#9AF2C6'], 8, 150);
            window.MM.Audio.SFX.deploy();
            break;
          }

          case 'nano_hive': {
            const bots = 2 + slot.tier;
            for (let i = 0; i < bots; i++) {
              const ang = (Math.PI * 2 * i) / bots + rand(-0.3, 0.3);
              this.projectiles.push({
                kind: 'nanobot', x: p.x, y: p.y,
                vx: Math.cos(ang) * 260, vy: Math.sin(ang) * 260,
                dmg, radius: 8, life: 2.8, tags: def.tags
              });
            }
            window.MM.Audio.SFX.zap();
            break;
          }

          case 'boomerang': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.25);
            const ang = target ? Math.atan2(target.y - p.y, target.x - p.x) : rand(0, Math.PI * 2);
            const count = slot.tier >= 3 ? 2 : 1;
            for (let i = 0; i < count; i++) {
              const off = count === 2 ? (i === 0 ? -0.2 : 0.2) : 0;
              this.projectiles.push({
                kind: 'boomerang', x: p.x, y: p.y,
                vx: Math.cos(ang + off) * 520, vy: Math.sin(ang + off) * 520,
                dmg, radius: 18 * Math.min(1.4, area),
                rot: 0, age: 0, returning: false, hitCooldowns: new Map(), life: 2.6, tags: def.tags
              });
            }
            window.MM.Audio.SFX.deploy();
            break;
          }

          case 'emp_cone': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.3);
            const ang = target ? Math.atan2(target.y - p.y, target.x - p.x) : (p.facing > 0 ? 0 : Math.PI);
            const r = def.radius * area;
            const cx = p.x + Math.cos(ang) * (r * 0.72);
            const cy = p.y + Math.sin(ang) * (r * 0.72);
            this.spawnFx('fx:volt_spark', cx, cy, { size: r * 1.75, life: 0.3, rotSpd: 3.5 });
            this.rings.push({ x: cx, y: cy, r: 10, maxR: r, color: '#4AA3E8', life: 0.3, maxLife: 0.3 });
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, cx, cy) <= (r + e.radius) ** 2) {
                this.dealDamage(e, dmg, def.tags, false);
                if (!e.isBoss) e.stunTimer = Math.max(e.stunTimer, 0.55);
              }
            });
            window.MM.Audio.SFX.zap();
            break;
          }

          case 'jackhammer': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.3);
            const ang = target ? Math.atan2(target.y - p.y, target.x - p.x) : (p.facing > 0 ? 0 : Math.PI);
            const r = def.radius * area;
            const jx = p.x + Math.cos(ang) * 56;
            const jy = p.y + Math.sin(ang) * 56;
            this.spawnFx('fx:seismic_crack', jx, jy, { size: r * 1.65, life: 0.24, ground: true, maxAlpha: 0.75 });
            this.spawnDebris(jx, jy, ['#FFC233', '#47515B'], 5, 165);
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, jx, jy) <= (r + e.radius) ** 2) {
                this.dealDamage(e, dmg, def.tags, false);
                if (!e.isBoss) { e.vx += Math.cos(ang) * 260; e.vy += Math.sin(ang) * 260; }
              }
            });
            window.MM.Audio.SFX.seismic();
            break;
          }

          case 'meteor': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.25);
            const mx = target ? target.x : clamp(p.x + rand(-200, 200), 90, ARENA_W - 90);
            const my = target ? target.y : clamp(p.y + rand(-200, 200), 90, ARENA_H - 90);
            const r = def.radius * area;
            this.telegraphs.push({
              kind: 'circle', x: mx, y: my, r, life: 0.65, maxLife: 0.65, color: '#FFC233',
              onDone: () => {
                this.spawnFx('fx:seismic_crack', mx, my, { size: r * 1.85, life: 0.5, ground: true, maxAlpha: 0.85 });
                this.spawnFx('fx:blast_star', mx, my, { size: r * 2.1, life: 0.4, rotSpd: 2.5 });
                this.spawnFx('fx:smoke_puff', mx, my - 18, { size: 58, life: 0.65, vy: -36, scaleEnd: 1.6 });
                this.spawnDecal('crater', mx, my, r * 0.85);
                this.spawnDebris(mx, my, ['#FFC233', '#E8483F', '#2B2F38'], 13, 250);
                this.rings.push({ x: mx, y: my, r: 10, maxR: r, color: '#FFE07A', life: 0.4, maxLife: 0.4 });
                this.cam.shake = Math.max(this.cam.shake, 6.5);
                window.MM.Audio.SFX.explode();
                this.enemies.forEach((e) => {
                  if (!e.dead && dist2(e.x, e.y, mx, my) <= (r + e.radius) ** 2) {
                    this.dealDamage(e, dmg, def.tags, false);
                    if (!e.isBoss) e.stunTimer = Math.max(e.stunTimer, 0.55);
                  }
                });
              }
            });
            window.MM.Audio.SFX.deploy();
            break;
          }

          case 'hammer': {
            const r = def.radius * area;
            const target = this.findNearestEnemy(p.x, p.y, r * 1.5);
            const ang = target ? Math.atan2(target.y - p.y, target.x - p.x) : (p.facing > 0 ? 0 : Math.PI);
            const hx = p.x + Math.cos(ang) * 44;
            const hy = p.y + Math.sin(ang) * 44;
            this.spawnFx('tool:magnet_hammer', hx, hy, { size: 64, life: 0.24, rot: ang, rotSpd: 9 });
            this.rings.push({ x: p.x, y: p.y, r: 20, maxR: r, color: '#E8483F', life: 0.28, maxLife: 0.28 });
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, p.x, p.y) <= (r + e.radius) ** 2) {
                this.dealDamage(e, dmg, def.tags, false);
                if (!e.isBoss) {
                  const a = Math.atan2(e.y - p.y, e.x - p.x);
                  e.vx += Math.cos(a) * 290;
                  e.vy += Math.sin(a) * 290;
                }
              }
            });
            // Electromagnetic Scrap pull!
            this.pickups.forEach((pk) => {
              if (pk.kind === 'scrap' && dist2(pk.x, pk.y, p.x, p.y) <= (r * 2.4) ** 2) {
                pk.x += (p.x - pk.x) * 0.55;
                pk.y += (p.y - pk.y) * 0.55;
              }
            });
            window.MM.Audio.SFX.seismic();
            break;
          }

          case 'ion_laser': {
            // Locks onto highest-HP enemy in range and drops a sky-laser beam from orbit!
            let best = null;
            let bestHp = -1;
            const maxR2 = (def.range * 1.25) ** 2;
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(p.x, p.y, e.x, e.y) <= maxR2 && e.hp > bestHp) {
                bestHp = e.hp; best = e;
              }
            });
            const tx = best ? best.x : clamp(p.x + rand(-180, 180), 90, ARENA_W - 90);
            const ty = best ? best.y : clamp(p.y + rand(-180, 180), 90, ARENA_H - 90);
            const r = def.radius * area;
            this.telegraphs.push({
              kind: 'circle', x: tx, y: ty, r, life: 0.45, maxLife: 0.45, color: '#4AA3E8',
              onDone: () => {
                this.beams.push({ x1: tx, y1: ty - 520, x2: tx, y2: ty, color: '#4AA3E8', width: 22, life: 0.34, maxLife: 0.34 });
                this.beams.push({ x1: tx, y1: ty - 520, x2: tx, y2: ty, color: '#FFFFFF', width: 8, life: 0.34, maxLife: 0.34 });
                this.spawnFx('fx:volt_spark', tx, ty, { size: r * 2.1, life: 0.36, rotSpd: 4 });
                this.spawnDecal('scorch', tx, ty, r * 0.85);
                this.rings.push({ x: tx, y: ty, r: 8, maxR: r, color: '#9CD3FF', life: 0.34, maxLife: 0.34 });
                this.cam.shake = Math.max(this.cam.shake, 5.5);
                window.MM.Audio.SFX.zap();
                this.enemies.forEach((e) => {
                  if (!e.dead && dist2(e.x, e.y, tx, ty) <= (r + e.radius) ** 2) {
                    this.dealDamage(e, dmg, def.tags, false);
                    this.applyBurn(e, dmg * 0.3, 2.5);
                  }
                });
              }
            });
            break;
          }

          case 'drop_anvil': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.25);
            const ax = target ? target.x : clamp(p.x + rand(-160, 160), 90, ARENA_W - 90);
            const ay = target ? target.y : clamp(p.y + rand(-160, 160), 90, ARENA_H - 90);
            const r = def.radius * area;
            this.telegraphs.push({
              kind: 'circle', x: ax, y: ay, r, life: 0.48, maxLife: 0.48, color: '#FFE07A',
              onDone: () => {
                this.spawnFx('tool:shock_anvil', ax, ay - 8, { size: 68, life: 0.42, rot: 0, scaleEnd: 1.05 });
                this.spawnFx('fx:seismic_crack', ax, ay + 6, { size: r * 1.8, life: 0.48, ground: true, maxAlpha: 0.85 });
                this.spawnDecal('crater', ax, ay, r * 0.85);
                this.spawnDebris(ax, ay, ['#FFE07A', '#E8EEF2', '#2B2F38'], 12, 240);
                this.rings.push({ x: ax, y: ay, r: 10, maxR: r, color: '#FFE07A', life: 0.35, maxLife: 0.35 });
                this.cam.shake = Math.max(this.cam.shake, 6.5);
                window.MM.Audio.SFX.seismic();
                this.enemies.forEach((e) => {
                  if (!e.dead && dist2(e.x, e.y, ax, ay) <= (r + e.radius) ** 2) {
                    this.dealDamage(e, dmg, def.tags, false);
                    if (!e.isBoss) e.stunTimer = Math.max(e.stunTimer, 0.85);
                  }
                });
              }
            });
            break;
          }

          case 'tar_sprayer': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.2);
            const tx = target ? target.x : clamp(p.x + rand(-175, 175), 80, ARENA_W - 80);
            const ty = target ? target.y : clamp(p.y + rand(-175, 175), 80, ARENA_H - 80);
            const r = def.radius * area;
            this.hazards.push({
              kind: 'tar', x: tx, y: ty, radius: r, dmg: dmg * 0.45, ignited: false,
              tick: 0, life: 5.2 + slot.tier * 0.6, maxLife: 5.2 + slot.tier * 0.6, tags: def.tags
            });
            this.rings.push({ x: tx, y: ty, r: 8, maxR: r, color: '#FFC233', life: 0.3, maxLife: 0.3 });
            this.spawnDebris(tx, ty, ['#2A2935', '#FFC233'], 7, 140);
            window.MM.Audio.SFX.deploy();
            break;
          }

          // ================================================================
          // 10 SCI-FI & INDUSTRIAL ENGINEERING GUNS!
          // ================================================================
          case 'gun_smg':
          case 'gun_minigun': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.25);
            if (!target) { slot.cdTimer = 0.08; break; }
            const spread = def.kind === 'gun_minigun' ? rand(-0.18, 0.18) : rand(-0.09, 0.09);
            const ang = Math.atan2(target.y - p.y, target.x - p.x) + spread;
            const spd = def.kind === 'gun_minigun' ? 680 : 620;
            this.projectiles.push({
              kind: 'bullet', x: p.x + Math.cos(ang) * 18, y: p.y + Math.sin(ang) * 18,
              vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
              dmg, radius: def.kind === 'gun_minigun' ? 6.5 : 6, pierce: slot.tier >= 3 ? 2 : 1,
              color: def.kind === 'gun_minigun' ? '#FFE07A' : '#E8EEF2',
              hitIds: new Set(), life: 0.72, tags: def.tags
            });
            if (Math.random() < 0.45) {
              this.spawnDebris(p.x, p.y, ['#FFE07A', '#FFC233'], 1, 90);
            }
            window.MM.Audio.SFX.shoot();
            break;
          }

          case 'gun_shotgun': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.25);
            if (!target) { slot.cdTimer = 0.12; break; }
            const baseAng = Math.atan2(target.y - p.y, target.x - p.x);
            const pellets = 5 + Math.floor((slot.tier - 1) * 1.5);
            for (let k = 0; k < pellets; k++) {
              const off = ((k / (pellets - 1)) - 0.5) * 0.54 + rand(-0.04, 0.04);
              const spd = rand(520, 620);
              this.projectiles.push({
                kind: 'ember', x: p.x + Math.cos(baseAng) * 16, y: p.y + Math.sin(baseAng) * 16,
                vx: Math.cos(baseAng + off) * spd, vy: Math.sin(baseAng + off) * spd,
                dmg, radius: 7.5, pierce: slot.tier >= 3 ? 2 : 1,
                hitIds: new Set(), life: 0.56, tags: def.tags
              });
            }
            this.spawnFx('fx:blast_star', p.x + Math.cos(baseAng) * 26, p.y + Math.sin(baseAng) * 26, { size: 36, life: 0.14 });
            this.cam.shake = Math.max(this.cam.shake, 2.5);
            window.MM.Audio.SFX.shotgun();
            break;
          }

          case 'gun_rail': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.3);
            if (!target) { slot.cdTimer = 0.15; break; }
            const ang = Math.atan2(target.y - p.y, target.x - p.x);
            const len = 560 * Math.min(1.4, area);
            const ex = p.x + Math.cos(ang) * len;
            const ey = p.y + Math.sin(ang) * len;
            this.beams.push({ x1: p.x, y1: p.y, x2: ex, y2: ey, color: '#4AA3E8', width: 10, life: 0.24, maxLife: 0.24 });
            this.beams.push({ x1: p.x, y1: p.y, x2: ex, y2: ey, color: '#FFFFFF', width: 3.6, life: 0.24, maxLife: 0.24 });
            this.enemies.forEach((e) => {
              if (!e.dead && this.pointToSegmentDist(e.x, e.y, p.x, p.y, ex, ey) <= e.radius + 16) {
                this.dealDamage(e, dmg, def.tags, slot.tier >= 4);
                this.spawnFx('fx:volt_spark', e.x, e.y, { size: 40, life: 0.2 });
              }
            });
            this.cam.shake = Math.max(this.cam.shake, 3.5);
            window.MM.Audio.SFX.railgun();
            break;
          }

          case 'gun_plasma': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.25);
            if (!target) { slot.cdTimer = 0.1; break; }
            const ang = Math.atan2(target.y - p.y, target.x - p.x);
            this.projectiles.push({
              kind: 'plasma', x: p.x + Math.cos(ang) * 16, y: p.y + Math.sin(ang) * 16,
              vx: Math.cos(ang) * 560, vy: Math.sin(ang) * 560,
              dmg, radius: 9, bounces: 1 + slot.tier,
              hitIds: new Set(), life: 1.2, tags: def.tags
            });
            window.MM.Audio.SFX.shoot();
            break;
          }

          case 'gun_cryo': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.25);
            if (!target) { slot.cdTimer = 0.12; break; }
            const baseAng = Math.atan2(target.y - p.y, target.x - p.x);
            const count = 3 + Math.floor((slot.tier - 1) / 2);
            for (let k = 0; k < count; k++) {
              const off = ((k / (count - 1)) - 0.5) * 0.34;
              this.projectiles.push({
                kind: 'ice', x: p.x + Math.cos(baseAng) * 16, y: p.y + Math.sin(baseAng) * 16,
                vx: Math.cos(baseAng + off) * 560, vy: Math.sin(baseAng + off) * 560,
                dmg, radius: 8.5, pierce: 2,
                hitIds: new Set(), life: 0.78, tags: def.tags
              });
            }
            window.MM.Audio.SFX.cryo();
            break;
          }

          case 'gun_grenade': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.25);
            if (!target) { slot.cdTimer = 0.15; break; }
            const ang = Math.atan2(target.y - p.y, target.x - p.x);
            this.projectiles.push({
              kind: 'grenade', x: p.x + Math.cos(ang) * 18, y: p.y + Math.sin(ang) * 18,
              vx: Math.cos(ang) * 440, vy: Math.sin(ang) * 440,
              dmg, blastR: (def.radius || 78) * area, radius: 10,
              life: 0.9, rot: 0, tags: def.tags
            });
            window.MM.Audio.SFX.shotgun();
            break;
          }

          case 'gun_tesla': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.25);
            if (!target) { slot.cdTimer = 0.12; break; }
            const bounces = 3 + Math.floor(slot.tier / 2) + (this.synergies.bonuses.chainBonus || 0) + (this.run.specials.extraChain || 0);
            this.fireChainLightning(p.x, p.y, target, dmg, bounces, def.tags);
            break;
          }

          case 'gun_acid': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.25);
            if (!target) { slot.cdTimer = 0.1; break; }
            const ang = Math.atan2(target.y - p.y, target.x - p.x) + rand(-0.07, 0.07);
            this.projectiles.push({
              kind: 'acid_needle', x: p.x + Math.cos(ang) * 16, y: p.y + Math.sin(ang) * 16,
              vx: Math.cos(ang) * 600, vy: Math.sin(ang) * 600,
              dmg, radius: 7.5, pierce: slot.tier >= 3 ? 2 : 1,
              hitIds: new Set(), life: 0.72, tags: def.tags
            });
            window.MM.Audio.SFX.shoot();
            break;
          }

          case 'gun_nova': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.25);
            if (!target) { slot.cdTimer = 0.15; break; }
            const ang = Math.atan2(target.y - p.y, target.x - p.x);
            this.projectiles.push({
              kind: 'nova_ring', x: p.x + Math.cos(ang) * 20, y: p.y + Math.sin(ang) * 20,
              vx: Math.cos(ang) * 380, vy: Math.sin(ang) * 380,
              dmg, radius: 24 * Math.min(1.5, area), pierce: 99,
              hitIds: new Set(), life: 1.35, tags: def.tags
            });
            window.MM.Audio.SFX.railgun();
            break;
          }
          case 'gun_flamer': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.2);
            if (!target) { slot.cdTimer = 0.1; break; }
            const baseA = Math.atan2(target.y - p.y, target.x - p.x);
            const jets = slot.tier >= 3 ? 3 : 2;
            for (let j = 0; j < jets; j++) {
              const ang = baseA + rand(-0.28, 0.28);
              const spd = rand(330, 440);
              this.projectiles.push({
                kind: 'ember', x: p.x + Math.cos(ang) * 18, y: p.y + Math.sin(ang) * 18,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                dmg, radius: 9 * Math.min(1.4, area), pierce: 3,
                hitIds: new Set(), life: 0.56, tags: def.tags
              });
            }
            if (Math.random() < 0.35) window.MM.Audio.SFX.hit();
            break;
          }
          case 'gun_disc': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.25);
            if (!target) { slot.cdTimer = 0.14; break; }
            const ang = Math.atan2(target.y - p.y, target.x - p.x);
            const count = slot.tier >= 4 ? 2 : 1;
            for (let d = 0; d < count; d++) {
              const a = ang + (count === 2 ? (d === 0 ? -0.18 : 0.18) : 0);
              this.projectiles.push({
                kind: 'boomerang', x: p.x + Math.cos(a) * 18, y: p.y + Math.sin(a) * 18,
                vx: Math.cos(a) * 520, vy: Math.sin(a) * 520,
                dmg, radius: 15 * Math.min(1.4, area), pierce: 99,
                hitIds: new Set(), hitCooldowns: new Map(), life: 1.45, maxLife: 1.45, ret: false, tags: def.tags
              });
            }
            window.MM.Audio.SFX.zap();
            break;
          }

          // ================================================================
          // 8 MEGA-CORE EXPANSION WEAPONS & CONTRAPTIONS!
          // ================================================================
          case 'gun_blackhole': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.25);
            if (!target) { slot.cdTimer = 0.16; break; }
            const ang = Math.atan2(target.y - p.y, target.x - p.x);
            this.projectiles.push({
              kind: 'black_hole', x: p.x + Math.cos(ang) * 20, y: p.y + Math.sin(ang) * 20,
              vx: Math.cos(ang) * 185, vy: Math.sin(ang) * 185,
              dmg, radius: 22 * Math.min(1.45, area), pullRadius: (def.radius || 105) * area,
              pierce: 999, hitCooldowns: new Map(), life: 2.35, maxLife: 2.35, tags: def.tags
            });
            window.MM.Audio.SFX.cryo();
            break;
          }

          case 'gun_prism': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.25);
            if (!target) { slot.cdTimer = 0.12; break; }
            this.dealDamage(target, dmg, def.tags, false);
            this.beams.push({ x1: p.x, y1: p.y, x2: target.x, y2: target.y, color: '#60EFFF', width: 7, life: 0.22, maxLife: 0.22 });
            this.beams.push({ x1: p.x, y1: p.y, x2: target.x, y2: target.y, color: '#FFFFFF', width: 2.5, life: 0.22, maxLife: 0.22 });
            this.spawnFx('fx:volt_spark', target.x, target.y, { size: 38, life: 0.2 });
            const splits = 2 + Math.min(3, slot.tier);
            const splitTargets = this.findNearestEnemies(target.x, target.y, 260 * area, splits + 1).filter((e) => e.uid !== target.uid).slice(0, splits);
            splitTargets.forEach((st, idx) => {
              this.dealDamage(st, dmg * 0.65, def.tags, false);
              const col = idx % 2 === 0 ? '#5FE3B8' : '#E879F9';
              this.beams.push({ x1: target.x, y1: target.y, x2: st.x, y2: st.y, color: col, width: 4.2, life: 0.2, maxLife: 0.2 });
            });
            window.MM.Audio.SFX.railgun();
            break;
          }

          case 'meteor_beacon': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.3);
            if (!target) { slot.cdTimer = 0.2; break; }
            const tx = clamp(target.x, 76, ARENA_W - 76);
            const ty = clamp(target.y, 76, ARENA_H - 76);
            const mr = (def.radius || 96) * area;
            this.telegraphs.push({
              kind: 'circle', x: tx, y: ty, r: mr, life: 0.65, maxLife: 0.65, color: '#5FE3B8', label: 'METEOR',
              onDone: () => {
                this.beams.push({ x1: tx + 110, y1: ty - 420, x2: tx, y2: ty, color: '#FF7B54', width: 24, life: 0.28, maxLife: 0.28 });
                this.beams.push({ x1: tx + 110, y1: ty - 420, x2: tx, y2: ty, color: '#FFE07A', width: 10, life: 0.28, maxLife: 0.28 });
                this.spawnFx('fx:blast_star', tx, ty, { size: mr * 2.1, life: 0.36, rotSpd: 3 });
                this.spawnDecal('scorch', tx, ty, mr * 0.72);
                this.rings.push({ x: tx, y: ty, r: 10, maxR: mr, color: '#FF7B54', life: 0.34, maxLife: 0.34 });
                window.MM.Audio.SFX.explode();
                this.enemies.forEach((e) => {
                  if (!e.dead && dist2(e.x, e.y, tx, ty) <= (mr + e.radius) ** 2) {
                    this.dealDamage(e, dmg, def.tags, slot.tier >= 4);
                    this.applyBurn(e, dmg * 0.38, 3.0);
                  }
                });
              }
            });
            break;
          }

          case 'gun_lance': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.25);
            if (!target) { slot.cdTimer = 0.14; break; }
            const ang = Math.atan2(target.y - p.y, target.x - p.x);
            const len = (def.range || 360) * Math.min(1.45, area);
            const ex = p.x + Math.cos(ang) * len;
            const ey = p.y + Math.sin(ang) * len;
            this.beams.push({ x1: p.x, y1: p.y, x2: ex, y2: ey, color: '#FF7B54', width: 14, life: 0.22, maxLife: 0.22 });
            this.beams.push({ x1: p.x, y1: p.y, x2: ex, y2: ey, color: '#FFE07A', width: 5, life: 0.22, maxLife: 0.22 });
            this.enemies.forEach((e) => {
              if (!e.dead && this.pointToSegmentDist(e.x, e.y, p.x, p.y, ex, ey) <= e.radius + 20) {
                this.dealDamage(e, dmg, def.tags, false);
                this.applyBurn(e, dmg * 0.35, 2.8);
                if (!e.isBoss) { e.vx += Math.cos(ang) * 210; e.vy += Math.sin(ang) * 210; }
              }
            });
            window.MM.Audio.SFX.seismic();
            break;
          }

          case 'gun_cryo_mortar': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.25);
            if (!target) { slot.cdTimer = 0.16; break; }
            this.projectiles.push({
              kind: 'cryo_shell', x: p.x, y: p.y, sx: p.x, sy: p.y,
              tx: clamp(target.x + rand(-22, 22), 68, ARENA_W - 68),
              ty: clamp(target.y + rand(-22, 22), 68, ARENA_H - 68),
              t: 0, dur: 0.56, dmg, radius: (def.radius || 92) * area, tags: def.tags
            });
            window.MM.Audio.SFX.cryo();
            break;
          }

          case 'pilebunker': {
            const target = this.findNearestEnemy(p.x, p.y, def.range * 1.3);
            const ang = target ? Math.atan2(target.y - p.y, target.x - p.x) : (p.facing > 0 ? 0 : Math.PI);
            const r = (def.radius || 135) * area;
            const cx = p.x + Math.cos(ang) * (r * 0.65);
            const cy = p.y + Math.sin(ang) * (r * 0.65);
            this.rings.push({ x: cx, y: cy, r: 12, maxR: r * 0.85, color: '#FFE07A', life: 0.28, maxLife: 0.28 });
            this.spawnFx('fx:seismic_crack', cx, cy, { size: r * 1.35, life: 0.34, ground: true, maxAlpha: 0.8 });
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, cx, cy) <= (r * 0.85 + e.radius) ** 2) {
                this.dealDamage(e, dmg, def.tags, false);
                e.shredTimer = Math.max(e.shredTimer, 4.0);
                if (!e.isBoss) { e.vx += Math.cos(ang) * 280; e.vy += Math.sin(ang) * 280; }
              }
            });
            this.cam.shake = Math.max(this.cam.shake, 3.2);
            window.MM.Audio.SFX.seismic();
            break;
          }

          case 'arc_mine': {
            const cap = this.getDeployCap(slot, def);
            const own = this.deployables.filter((d) => d.slotUid === slot.uid);
            if (own.length >= cap) {
              const oldest = own[0];
              const idx = this.deployables.indexOf(oldest);
              if (idx >= 0) this.deployables.splice(idx, 1);
            }
            const mx = clamp(p.x + rand(-68, 68), 64, ARENA_W - 64);
            const my = clamp(p.y + rand(-68, 68), 64, ARENA_H - 64);
            this.deployables.push({
              slotUid: slot.uid, slot, def, kind: 'arc_mine',
              x: mx, y: my, dmg, radius: (def.radius || 82) * area,
              armTimer: 0.35, spawnT: 0, recoil: 0, life: 16, pulse: 0, arcCd: 0.6
            });
            window.MM.Audio.SFX.deploy();
            break;
          }
        }
        // Tag any newly spawned projectiles with their weapon source name for DPS meter!
        for (let pi = projStart; pi < this.projectiles.length; pi++) {
          if (!this.projectiles[pi].source) this.projectiles[pi].source = def.name;
        }
        this._dmgSource = null;
      });
    },

    triggerSeismicWave(x, y, radius, dmg, stun = false, tags = ['SEISMIC']) {
      const syn = this.synergies.bonuses;
      const perks = this.run.charDef.perks || {};
      this.spawnFx('fx:seismic_crack', x, y, { size: radius * 1.45, life: 0.44, rotSpd: 0.4, ground: true, maxAlpha: 0.8 });
      this.spawnDecal('crater', x, y, radius * 0.72);
      this.spawnDebris(x, y, ['#2B2F38', '#FFC233', '#C9D1D8'], 10, 215);
      this.rings.push({ x, y, r: 14, maxR: radius, color: '#FFE07A', life: 0.4, maxLife: 0.4 });
      this.rings.push({ x, y, r: 8, maxR: radius * 0.68, color: '#2B2F38', life: 0.3, maxLife: 0.3 });
      this.cam.shake = Math.max(this.cam.shake, 5);
      window.MM.Audio.SFX.seismic();

      const kbForce = 250 * (syn.knockback || 1) * (perks.knockbackMult || 1);
      this.enemies.forEach((e) => {
        if (e.dead) return;
        const d = Math.hypot(e.x - x, e.y - y);
        if (d <= radius + e.radius) {
          this.dealDamage(e, dmg, tags, false);
          if (stun && !e.isBoss) e.stunTimer = Math.max(e.stunTimer, 0.45);
          if (d > 1 && !e.isBoss) {
            e.vx += ((e.x - x) / d) * kbForce;
            e.vy += ((e.y - y) / d) * kbForce;
            e.knockRot = (Math.random() < 0.5 ? -1 : 1) * 0.45;
          }
        }
      });

      if (syn.faultline) {
        this.player.seismicCounter++;
        if (this.player.seismicCounter >= 4) {
          this.player.seismicCounter = 0;
          const bigR = radius * 1.45;
          this.spawnFx('fx:seismic_crack', x, y, { size: bigR * 1.5, life: 0.55, rotSpd: -0.8, ground: true, maxAlpha: 0.85 });
          this.rings.push({ x, y, r: 16, maxR: bigR, color: '#5BD6A0', life: 0.48, maxLife: 0.48 });
          this.addText(x, y - 54, 'FAULTLINE!', '#5BD6A0', 16);
          this.enemies.forEach((e) => {
            if (!e.dead && dist2(e.x, e.y, x, y) <= (bigR + e.radius) ** 2) {
              this.dealDamage(e, dmg * 0.85, tags, true);
            }
          });
        }
      }
    },

    detonateMine(mine, bonusMult = 1) {
      if (mine.detonated) return;
      mine.detonated = true;
      mine.life = 0;
      const r = mine.radius;
      const isCryo = mine.kind === 'cryo_mine';
      const isMagnet = mine.kind === 'magnet_mine';
      const dmg = mine.dmg * bonusMult;
      const syn = this.synergies.bonuses;
      const perks = this.run.charDef.perks || {};

      this.spawnFx(isCryo ? 'fx:cryo_burst' : (isMagnet ? 'fx:volt_spark' : 'fx:blast_star'), mine.x, mine.y, {
        size: r * 2.25, life: 0.38, rotSpd: isCryo ? 3.5 : 2.2, scaleEnd: 1.3
      });
      this.spawnFx('fx:smoke_puff', mine.x - 14, mine.y - 10, { size: 46, life: 0.55, vx: -25, vy: -35, scaleEnd: 1.5 });
      this.spawnFx('fx:smoke_puff', mine.x + 14, mine.y - 8, { size: 40, life: 0.52, vx: 25, vy: -28, scaleEnd: 1.45 });
      this.spawnDecal(isCryo ? 'frost' : 'scorch', mine.x, mine.y, r * 0.88);
      this.spawnDebris(mine.x, mine.y, isCryo ? ['#9CD3FF', '#E8EEF2', '#4AA3E8'] : (isMagnet ? ['#9B6BE0', '#4AA3E8', '#5BD6A0'] : ['#E8483F', '#FFC233', '#2B2F38']), 11, 230);
      this.rings.push({ x: mine.x, y: mine.y, r: 10, maxR: r, color: isCryo ? '#9CD3FF' : (isMagnet ? '#9B6BE0' : '#E8483F'), life: 0.36, maxLife: 0.36 });
      this.cam.shake = Math.max(this.cam.shake, 5.5);
      this.hitStop = Math.max(this.hitStop, 0.022);
      if (isCryo) window.MM.Audio.SFX.cryo();
      else if (isMagnet) window.MM.Audio.SFX.zap();
      else window.MM.Audio.SFX.explode();

      if (isMagnet) {
        this.pickups.forEach((pk) => {
          if (pk.kind === 'scrap' && dist2(pk.x, pk.y, mine.x, mine.y) <= (r * 3.0) ** 2) {
            pk.superPull = true;
          }
        });
      }

      this.enemies.forEach((e) => {
        if (e.dead) return;
        const d = Math.hypot(e.x - mine.x, e.y - mine.y);
        if (d <= r + e.radius) {
          this.dealDamage(e, dmg, mine.def.tags, false);
          if (isCryo) e.chillTimer = Math.max(e.chillTimer, 3.2);
          if (!e.isBoss && d > 1) {
            const pushDir = isMagnet ? -1 : 1;
            e.vx += ((e.x - mine.x) / d) * 195 * pushDir;
            e.vy += ((e.y - mine.y) / d) * 195 * pushDir;
            e.knockRot = (Math.random() < 0.5 ? -1 : 1) * 0.5;
          }
        }
      });

      // Fragmentation Matrix: explosions launch 4 piercing shrapnel shards!
      if (this.run.specials.blastShrapnel > 0) {
        const shards = 4 * this.run.specials.blastShrapnel;
        for (let s = 0; s < Math.min(12, shards); s++) {
          const ang = (Math.PI * 2 * s) / Math.min(12, shards) + rand(-0.15, 0.15);
          this.projectiles.push({
            kind: 'gear', x: mine.x, y: mine.y,
            vx: Math.cos(ang) * 460, vy: Math.sin(ang) * 460,
            dmg: dmg * 0.42, radius: 7.5, pierce: 2,
            hitIds: new Set(), life: 0.72, rot: 0, tags: mine.def.tags
          });
        }
      }

      if (perks.chainDetonate) {
        this.deployables.forEach((other) => {
          if (other !== mine && !other.detonated && (other.kind === 'mine' || other.kind === 'cryo_mine')) {
            if (dist2(other.x, other.y, mine.x, mine.y) <= (r * 1.35) ** 2) {
              this.detonateMine(other, bonusMult * 1.25);
            }
          }
        });
      }

      if (syn.scorch && !isCryo) {
        this.hazards.push({
          kind: 'lava', x: mine.x, y: mine.y, radius: r * 0.72, dmg: dmg * 0.22,
          tick: 0, smokeCd: 0.3, spawnT: 0, life: 2.6, maxLife: 2.6, tags: ['MINES', 'THERMAL']
        });
      }

      if (syn.miniMines && !mine.isMini) {
        for (let i = 0; i < 2; i++) {
          const ang = rand(0, Math.PI * 2);
          this.deployables.push({
            slotUid: mine.slotUid, slot: mine.slot, def: mine.def, kind: mine.kind,
            x: clamp(mine.x + Math.cos(ang) * 60, 64, ARENA_W - 64),
            y: clamp(mine.y + Math.sin(ang) * 60, 64, ARENA_H - 64),
            dmg: mine.dmg * 0.6, radius: r * 0.68, armTimer: 0.45,
            spawnT: 0, recoil: 0, life: 8, pulse: 0, isMini: true
          });
        }
      }
    },

    // ------------------------------------------------------------------------
    // DEPLOYABLES, ORBITALS & DRONES
    // ------------------------------------------------------------------------
    updateDeployables(dt) {
      const syn = this.synergies.bonuses;
      const perks = this.run.charDef.perks || {};
      const p = this.player;
      const teslaPylons = [];
      const laserPosts = [];

      for (let i = this.deployables.length - 1; i >= 0; i--) {
        const d = this.deployables[i];
        this._dmgSource = d.source || (d.def && d.def.name) || 'Deployable';
        d.life -= dt;
        d.spawnT = Math.min(1, d.spawnT + dt * 5.2);
        if (d.recoil > 0) d.recoil = Math.max(0, d.recoil - dt * 5);

        if (d.life <= 0) { this.deployables.splice(i, 1); continue; }

        if (d.kind === 'mine' || d.kind === 'cryo_mine' || d.kind === 'magnet_mine' || d.kind === 'arc_mine') {
          d.pulse += dt * 6.5;
          if (d.armTimer > 0) { d.armTimer -= dt; continue; }
          if (d.kind === 'arc_mine') {
            d.arcCd = (d.arcCd || 0.7) - dt;
            if (d.arcCd <= 0) {
              d.arcCd = 0.85;
              const zapTgt = this.findNearestEnemy(d.x, d.y, 175);
              if (zapTgt) {
                this.fireChainLightning(d.x, d.y, zapTgt, d.dmg * 0.45, 2 + (this.run.specials.extraChain || 0), d.def.tags);
              }
            }
          }
          if (d.kind === 'magnet_mine') {
            const pullR = d.radius * 1.35;
            this.enemies.forEach((e) => {
              if (e.dead || e.isBoss) return;
              const dx = d.x - e.x;
              const dy = d.y - e.y;
              const dist = Math.hypot(dx, dy);
              if (dist > 10 && dist <= pullR) {
                e.x += (dx / dist) * 115 * dt;
                e.y += (dy / dist) * 115 * dt;
              }
            });
          }
          const trigR = d.radius * 0.52;
          for (let j = 0; j < this.enemies.length; j++) {
            const e = this.enemies[j];
            if (!e.dead && dist2(e.x, e.y, d.x, d.y) <= (trigR + e.radius) ** 2) {
              this.detonateMine(d, 1);
              break;
            }
          }
          continue;
        }

        let spdMult = this.getAspdMult(d.def.tags) * (syn.deployAspd || 1);
        if (this.run.specials.improvedTools > 0) {
          spdMult *= (1 + 0.35 * this.run.specials.improvedTools);
        }
        if (perks.proximityOverclock && dist2(p.x, p.y, d.x, d.y) <= 165 * 165) {
          spdMult *= 1.25;
          d.boosted = true;
        } else {
          d.boosted = false;
        }
        if (syn.overclock && Math.sin(this.waveElapsed * 1.05) > 0.4) {
          spdMult *= 1.3;
          d.boosted = true;
        }

        d.fireCd -= dt * spdMult;
        if (d.kind === 'turret_tesla') teslaPylons.push(d);
        if (d.kind === 'turret_laser') laserPosts.push(d);

        // Bio-Reactor Garden: grows glowing Nano-Fruit heals on the floor!
        if (d.kind === 'garden') {
          if (d.fireCd <= 0) {
            d.fireCd = Math.max(2.2, (d.def.fireCd || 4.2) * (window.MM.TIER_CD_MULT[d.slot.tier] || 1));
            d.recoil = 1;
            const ang = rand(0, Math.PI * 2);
            const fx = clamp(d.x + Math.cos(ang) * rand(28, 56), 60, ARENA_W - 60);
            const fy = clamp(d.y + Math.sin(ang) * rand(28, 56), 60, ARENA_H - 60);
            this.pickups.push({ kind: 'fruit', x: fx, y: fy, heal: 5 + d.slot.tier * 2, bob: rand(0, 6) });
            this.rings.push({ x: fx, y: fy, r: 4, maxR: 26, color: '#5BD6A0', life: 0.28, maxLife: 0.28 });
          }
          continue;
        }

        if (d.kind === 'turret_heal') {
          d.healCd -= dt;
          if (d.healCd <= 0) {
            d.healCd = Math.max(1.8, 3.2 - d.slot.tier * 0.35);
            if (p.hp < this.stats.maxHp) {
              const heal = 3 + d.slot.tier * 2;
              p.hp = Math.min(this.stats.maxHp, p.hp + heal);
              this.addText(p.x, p.y - 54, `+${heal}`, '#5BD6A0', 14);
              this.beams.push({ x1: d.x, y1: d.y, x2: p.x, y2: p.y, color: '#5BD6A0', width: 3.4, life: 0.25, maxLife: 0.25 });
            }
          }
        }

        if (d.fireCd <= 0) {
          const target = this.findNearestEnemy(d.x, d.y, d.range);
          if (target) {
            d.angle = Math.atan2(target.y - d.y, target.x - d.x);
            d.fireCd = (d.def.fireCd || 0.8) * (window.MM.TIER_CD_MULT[d.slot.tier] || 1);
            d.recoil = 1;

            if (d.kind === 'turret_gear') {
              const spd = 490;
              this.projectiles.push({
                kind: 'gear', x: d.x, y: d.y,
                vx: Math.cos(d.angle) * spd, vy: Math.sin(d.angle) * spd,
                dmg: d.dmg, radius: 9.5, pierce: d.slot.tier >= 3 ? 2 : 1,
                hitIds: new Set(), life: 0.95, rot: 0, tags: d.def.tags
              });
              this.spawnFx('fx:smoke_puff', d.x + Math.cos(d.angle) * 16, d.y + Math.sin(d.angle) * 16, { size: 22, life: 0.2, scaleEnd: 1.3 });
              window.MM.Audio.SFX.hit();
            } else if (d.kind === 'turret_welder') {
              this.dealDamage(target, d.dmg, d.def.tags, false);
              this.applyBurn(target, d.dmg * 0.45, 2.5);
              this.beams.push({ x1: d.x, y1: d.y - 6, x2: target.x, y2: target.y, color: '#E8483F', width: 5.5, life: 0.16, maxLife: 0.16 });
              this.beams.push({ x1: d.x, y1: d.y - 6, x2: target.x, y2: target.y, color: '#FFE07A', width: 2.2, life: 0.16, maxLife: 0.16 });
              this.spawnFx('fx:blast_star', target.x, target.y, { size: 34, life: 0.16 });
            } else if (d.kind === 'turret_heal') {
              this.dealDamage(target, d.dmg, d.def.tags, false);
              this.beams.push({ x1: d.x, y1: d.y, x2: target.x, y2: target.y, color: '#5BD6A0', width: 3.4, life: 0.18, maxLife: 0.18, jagged: true });
              window.MM.Audio.SFX.zap();
            } else if (d.kind === 'turret_tesla') {
              const bounces = 2 + d.slot.tier + (syn.chainBonus || 0) + (perks.extraChainBounces || 0) + (this.run.specials.extraChain || 0);
              this.fireChainLightning(d.x, d.y - 8, target, d.dmg, bounces, d.def.tags);
            } else if (d.kind === 'turret_cryo') {
              const r = 98 * this.getAreaMult();
              this.spawnFx('fx:cryo_burst', d.x, d.y, { size: r * 1.65, life: 0.3, rotSpd: 2 });
              this.rings.push({ x: d.x, y: d.y, r: 10, maxR: r, color: '#9CD3FF', life: 0.3, maxLife: 0.3 });
              this.enemies.forEach((e) => {
                if (!e.dead && dist2(e.x, e.y, d.x, d.y) <= (r + e.radius) ** 2) {
                  this.dealDamage(e, d.dmg, d.def.tags, false);
                  e.chillTimer = Math.max(e.chillTimer, 2.8);
                }
              });
              window.MM.Audio.SFX.cryo();
            } else if (d.kind === 'turret_laser') {
              this.dealDamage(target, d.dmg * 0.75, d.def.tags, false);
              this.beams.push({ x1: d.x, y1: d.y - 10, x2: target.x, y2: target.y, color: '#E8483F', width: 4, life: 0.18, maxLife: 0.18 });
              window.MM.Audio.SFX.zap();
            } else if (d.kind === 'turret_steam') {
              const r = (d.def.radius || 118) * this.getAreaMult();
              this.spawnFx('fx:smoke_puff', d.x, d.y - 6, { size: r * 1.5, life: 0.42, scaleEnd: 1.45, maxAlpha: 0.85 });
              this.rings.push({ x: d.x, y: d.y, r: 12, maxR: r, color: '#E8EEF2', life: 0.32, maxLife: 0.32 });
              this.enemies.forEach((e) => {
                if (!e.dead && dist2(e.x, e.y, d.x, d.y) <= (r + e.radius) ** 2) {
                  this.dealDamage(e, d.dmg, d.def.tags, false);
                  this.applyBurn(e, d.dmg * 0.3, 2.4);
                  if (!e.isBoss) {
                    const a = Math.atan2(e.y - d.y, e.x - d.x);
                    e.vx += Math.cos(a) * 210;
                    e.vy += Math.sin(a) * 210;
                  }
                }
              });
              window.MM.Audio.SFX.seismic();
            } else if (d.kind === 'turret_flame') {
              const baseAng = d.angle;
              for (let k = -1; k <= 1; k++) {
                const a = baseAng + k * 0.22 + rand(-0.06, 0.06);
                this.projectiles.push({
                  kind: 'ember', x: d.x, y: d.y,
                  vx: Math.cos(a) * 340, vy: Math.sin(a) * 340,
                  dmg: d.dmg, radius: 9.5, pierce: 2,
                  hitIds: new Set(), life: 0.52, tags: d.def.tags
                });
              }
              window.MM.Audio.SFX.hit();
            } else if (d.kind === 'turret_prism') {
              const splits = 3 + Math.min(2, d.slot.tier - 1) + (this.run.specials.extraChain || 0);
              const cols = ['#E8483F', '#FFE07A', '#5BD6A0', '#4AA3E8', '#C6A6FF'];
              const targets = this.findNearestEnemies(d.x, d.y, d.range, splits);
              targets.forEach((t, ti) => {
                this.dealDamage(t, d.dmg * 0.85, d.def.tags, false);
                this.beams.push({ x1: d.x, y1: d.y - 12, x2: t.x, y2: t.y, color: cols[ti % cols.length], width: 4.2, life: 0.2, maxLife: 0.2 });
                this.spawnFx('fx:volt_spark', t.x, t.y, { size: 30, life: 0.16 });
              });
              window.MM.Audio.SFX.zap();
            }
          } else {
            d.fireCd = 0.14;
          }
        }
      }

      if (teslaPylons.length >= 2) {
        this._pylonArcTick = (this._pylonArcTick || 0) - dt;
        if (this._pylonArcTick <= 0) {
          this._pylonArcTick = 0.24;
          for (let a = 0; a < teslaPylons.length; a++) {
            for (let b = a + 1; b < teslaPylons.length; b++) {
              const pa = teslaPylons[a];
              const pb = teslaPylons[b];
              if (dist2(pa.x, pa.y, pb.x, pb.y) <= 285 * 285) {
                this.beams.push({ x1: pa.x, y1: pa.y - 10, x2: pb.x, y2: pb.y - 10, color: '#9B6BE0', width: 4.5, life: 0.25, maxLife: 0.25, jagged: true });
                this.beams.push({ x1: pa.x, y1: pa.y - 10, x2: pb.x, y2: pb.y - 10, color: '#FFE07A', width: 1.8, life: 0.25, maxLife: 0.25, jagged: true });
                this.enemies.forEach((e) => {
                  if (!e.dead && this.pointToSegmentDist(e.x, e.y, pa.x, pa.y, pb.x, pb.y) <= e.radius + 14) {
                    this.dealDamage(e, pa.dmg * 0.55, ['VOLTAIC', 'ROBOTICS'], false);
                  }
                });
              }
            }
          }
        }
      }

      // Live searing ruby laser fences between Laser Fence Posts!
      if (laserPosts.length >= 2) {
        this._laserFenceTick = (this._laserFenceTick || 0) - dt;
        if (this._laserFenceTick <= 0) {
          this._laserFenceTick = 0.22;
          for (let a = 0; a < laserPosts.length; a++) {
            for (let b = a + 1; b < laserPosts.length; b++) {
              const pa = laserPosts[a];
              const pb = laserPosts[b];
              if (dist2(pa.x, pa.y, pb.x, pb.y) <= 340 * 340) {
                this.beams.push({ x1: pa.x, y1: pa.y - 10, x2: pb.x, y2: pb.y - 10, color: '#E8483F', width: 6, life: 0.24, maxLife: 0.24 });
                this.beams.push({ x1: pa.x, y1: pa.y - 10, x2: pb.x, y2: pb.y - 10, color: '#FFFFFF', width: 2, life: 0.24, maxLife: 0.24 });
                this.enemies.forEach((e) => {
                  if (!e.dead && this.pointToSegmentDist(e.x, e.y, pa.x, pa.y, pb.x, pb.y) <= e.radius + 14) {
                    this.dealDamage(e, pa.dmg * 0.65, ['VOLTAIC', 'MINES'], false);
                  }
                });
              }
            }
          }
        }
      }
    },

    fireChainLightning(sx, sy, firstTarget, dmg, bounces, tags) {
      let currX = sx;
      let currY = sy;
      let currTarget = firstTarget;
      const hit = new Set();
      window.MM.Audio.SFX.zap();

      for (let i = 0; i < bounces && currTarget; i++) {
        hit.add(currTarget.uid);
        this.dealDamage(currTarget, dmg * Math.pow(0.88, i), tags, false);
        this.spawnFx('fx:volt_spark', currTarget.x, currTarget.y, { size: i === 0 ? 48 : 36, life: 0.22, rotSpd: 4 });
        this.beams.push({ x1: currX, y1: currY, x2: currTarget.x, y2: currTarget.y, color: i === 0 ? '#4AA3E8' : '#9B6BE0', width: i === 0 ? 5.2 : 3.6, life: 0.22, maxLife: 0.22, jagged: true });
        this.beams.push({ x1: currX, y1: currY, x2: currTarget.x, y2: currTarget.y, color: '#FFFFFF', width: 1.8, life: 0.22, maxLife: 0.22, jagged: true });
        currX = currTarget.x;
        currY = currTarget.y;
        let best = null;
        let bestD = 195 * 195;
        for (let j = 0; j < this.enemies.length; j++) {
          const e = this.enemies[j];
          if (e.dead || hit.has(e.uid)) continue;
          const d = dist2(currX, currY, e.x, e.y);
          if (d < bestD) { bestD = d; best = e; }
        }
        currTarget = best;
      }
    },

    updateOrbitals(dt) {
      const p = this.player;
      const syn = this.synergies.bonuses;
      const perks = this.run.charDef.perks || {};
      const speedMult = (syn.orbitalSpeed || 1) * (perks.orbitalSpeedMult || 1) * Math.max(0.75, 1 + this.stats.attackSpeedPct / 220);

      this.orbitals.forEach((orb) => {
        this._dmgSource = orb.def.name;
        const angVel = (orb.def.kind === 'orbital_saw' ? 4.1 : 2.45) * speedMult;
        orb.angle += angVel * dt;
        orb.x = p.x + Math.cos(orb.angle) * orb.radius;
        orb.y = p.y + Math.sin(orb.angle) * orb.radius;

        orb.trail.push({ x: orb.x, y: orb.y });
        if (orb.trail.length > 10) orb.trail.shift();

        orb.hitMap.forEach((t, uid) => {
          if (t - dt <= 0) orb.hitMap.delete(uid);
          else orb.hitMap.set(uid, t - dt);
        });

        const dmg = this.computeToolDamage(orb.slot, orb.def);
        const hitR = orb.def.kind === 'orbital_saw' ? 24 : (orb.def.kind === 'orbital_ball' ? 28 : 20);

        for (let i = 0; i < this.enemies.length; i++) {
          const e = this.enemies[i];
          if (e.dead || orb.hitMap.has(e.uid)) continue;
          if (dist2(orb.x, orb.y, e.x, e.y) <= (hitR + e.radius) ** 2) {
            orb.hitMap.set(e.uid, 0.34);
            this.dealDamage(e, dmg, orb.def.tags, false);
            if (orb.def.kind === 'orbital_frost') e.chillTimer = Math.max(e.chillTimer, 2.5);
            this.spawnFx(orb.def.kind === 'orbital_frost' ? 'fx:cryo_burst' : 'fx:volt_spark', e.x, e.y, { size: orb.def.kind === 'orbital_ball' ? 44 : 32, life: 0.16 });
            if (syn.shieldOnHit && p.shield < 28) p.shield = Math.min(28, p.shield + 1.2);
            if (!e.isBoss) {
              const ang = Math.atan2(e.y - p.y, e.x - p.x);
              const kb = orb.def.kind === 'orbital_ball' ? 290 : 145;
              e.vx += Math.cos(ang) * kb;
              e.vy += Math.sin(ang) * kb;
            }
          }
        }

        if (orb.def.kind === 'orbital_frost') {
          orb.fireCd -= dt * this.getAspdMult(orb.def.tags);
          if (orb.fireCd <= 0) {
            orb.fireCd = Math.max(0.45, (orb.def.cd || 0.9) * (window.MM.TIER_CD_MULT[orb.slot.tier] || 1));
            const fr = 62 * this.getAreaMult();
            this.rings.push({ x: orb.x, y: orb.y, r: 8, maxR: fr, color: '#9CD3FF', life: 0.28, maxLife: 0.28 });
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, orb.x, orb.y) <= (fr + e.radius) ** 2) {
                this.dealDamage(e, dmg * 0.65, orb.def.tags, false);
                e.chillTimer = Math.max(e.chillTimer, 2.8);
              }
            });
          }
        }

        if (orb.def.kind === 'orbital_sat' || orb.def.kind === 'orbital_mirror') {
          orb.fireCd -= dt * this.getAspdMult(orb.def.tags);
          if (orb.fireCd <= 0) {
            const range = orb.def.kind === 'orbital_mirror' ? 300 : 265;
            const target = this.findNearestEnemy(orb.x, orb.y, range);
            if (target) {
              orb.fireCd = (orb.def.cd || 1.3) * (window.MM.TIER_CD_MULT[orb.slot.tier] || 1);
              this.dealDamage(target, dmg * 0.95, orb.def.tags, false);
              if (orb.def.kind === 'orbital_mirror') {
                this.applyBurn(target, dmg * 0.4, 3.0);
                this.beams.push({ x1: orb.x, y1: orb.y, x2: target.x, y2: target.y, color: '#E8483F', width: 5.5, life: 0.22, maxLife: 0.22 });
                this.beams.push({ x1: orb.x, y1: orb.y, x2: target.x, y2: target.y, color: '#FFE07A', width: 2.2, life: 0.22, maxLife: 0.22 });
                this.spawnFx('fx:blast_star', target.x, target.y, { size: 36, life: 0.18 });
                window.MM.Audio.SFX.hit();
              } else {
                this.beams.push({ x1: orb.x, y1: orb.y, x2: target.x, y2: target.y, color: '#4AA3E8', width: 4.5, life: 0.18, maxLife: 0.18 });
                this.beams.push({ x1: orb.x, y1: orb.y, x2: target.x, y2: target.y, color: '#FFFFFF', width: 1.8, life: 0.18, maxLife: 0.18 });
                this.spawnFx('fx:volt_spark', target.x, target.y, { size: 34, life: 0.18 });
                window.MM.Audio.SFX.zap();
              }
            } else {
              orb.fireCd = 0.18;
            }
          }
        }
      });
    },

    updateDrones(dt) {
      const p = this.player;
      const syn = this.synergies.bonuses;
      this.drones.forEach((dr) => {
        this._dmgSource = dr.def.name;
        dr.angle += dt * 1.9;
        dr.attackCd -= dt * this.getAspdMult(dr.def.tags) * (syn.deployAspd || 1);

        // Aegis Guardian Shield Drone: orbits closely, intercepts enemy shots & restores Energy Shield!
        if (dr.isShield) {
          dr.shieldCd = (dr.shieldCd || 0) - dt;
          const orbX = p.x + Math.cos(dr.angle) * 76;
          const orbY = p.y + Math.sin(dr.angle) * 76;
          dr.x += (orbX - dr.x) * Math.min(1, dt * 10);
          dr.y += (orbY - dr.y) * Math.min(1, dt * 10);
          dr.trail.push({ x: dr.x, y: dr.y });
          if (dr.trail.length > 8) dr.trail.shift();
          // Intercept enemy bullets near the drone!
          for (let si = this.enemyShots.length - 1; si >= 0; si--) {
            const s = this.enemyShots[si];
            if (dist2(dr.x, dr.y, s.x, s.y) <= (32 + s.r) ** 2) {
              this.rings.push({ x: s.x, y: s.y, r: 4, maxR: 26, color: '#60EFFF', life: 0.22, maxLife: 0.22 });
              this.enemyShots.splice(si, 1);
            }
          }
          if (dr.shieldCd <= 0) {
            dr.shieldCd = Math.max(2.2, 4.2 - (dr.slot.tier - 1) * 0.5);
            const maxSh = 24 + dr.slot.tier * 10;
            if (p.shield < maxSh) {
              p.shield = Math.min(maxSh, p.shield + 4 + dr.slot.tier);
              this.rings.push({ x: p.x, y: p.y, r: 10, maxR: 48, color: '#60EFFF', life: 0.26, maxLife: 0.26 });
            }
          }
          const tgt = this.findNearestEnemy(dr.x, dr.y, dr.def.range || 340);
          if (tgt && dr.attackCd <= 0) {
            dr.attackCd = (dr.def.fireCd || 0.72) * (window.MM.TIER_CD_MULT[dr.slot.tier] || 1);
            const dmg = this.computeToolDamage(dr.slot, dr.def);
            this.dealDamage(tgt, dmg, dr.def.tags, false);
            this.beams.push({ x1: dr.x, y1: dr.y, x2: tgt.x, y2: tgt.y, color: '#60EFFF', width: 4, life: 0.16, maxLife: 0.16 });
            window.MM.Audio.SFX.zap();
          }
          return;
        }

        const target = this.findNearestEnemy(p.x, p.y, 400);
        const goalX = target ? target.x : p.x + Math.cos(dr.angle) * 80;
        const goalY = target ? target.y : p.y + Math.sin(dr.angle) * 80;

        const dx = goalX - dr.x;
        const dy = goalY - dr.y;
        const d = Math.hypot(dx, dy) || 1;
        const spd = target ? 380 : 275;
        if (d > 14) {
          dr.vx += ((dx / d) * spd - dr.vx) * Math.min(1, dt * 7);
          dr.vy += ((dy / d) * spd - dr.vy) * Math.min(1, dt * 7);
        }
        dr.x += dr.vx * dt;
        dr.y += dr.vy * dt;
        dr.trail.push({ x: dr.x, y: dr.y });
        if (dr.trail.length > 8) dr.trail.shift();

        if (target && dr.attackCd <= 0 && d <= target.radius + 36) {
          dr.attackCd = (dr.def.fireCd || 0.55) * (window.MM.TIER_CD_MULT[dr.slot.tier] || 1);
          const dmg = this.computeToolDamage(dr.slot, dr.def);
          if (dr.isDrill) {
            const gr = 74 * this.getAreaMult();
            this.spawnFx('fx:seismic_crack', dr.x, dr.y, { size: gr * 1.6, life: 0.35, ground: true, maxAlpha: 0.8 });
            this.rings.push({ x: dr.x, y: dr.y, r: 8, maxR: gr, color: '#FFE07A', life: 0.3, maxLife: 0.3 });
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, dr.x, dr.y) <= (gr + e.radius) ** 2) {
                this.dealDamage(e, dmg, dr.def.tags, false);
                if (!e.isBoss) e.stunTimer = Math.max(e.stunTimer, 0.4);
              }
            });
            window.MM.Audio.SFX.seismic();
          } else {
            this.dealDamage(target, dmg, dr.def.tags, false);
            this.spawnFx('fx:volt_spark', target.x, target.y, { size: 34, life: 0.18 });
            window.MM.Audio.SFX.hit();
          }
        }
      });
    },

    // ------------------------------------------------------------------------
    // AUTONOMOUS BROTATO-STYLE COMPANION PETS + SYNERGY COMBOS + [F] RALLY!
    // ------------------------------------------------------------------------
    triggerFrostfire(e, dmgMult) {
      if (!e || e.dead || (e.frostfireCd || 0) > 0) return;
      e.frostfireCd = 1.8;
      const prevSrc = this._dmgSource;
      this._dmgSource = '★ Frostfire Combo';
      const r = 128 * this.getAreaMult();
      const dmg = (115 + (this.stats.engineering || 0) * 4.0) * dmgMult;
      this.rings.push({ x: e.x, y: e.y, r: 10, maxR: r, color: '#60EFFF', life: 0.36, maxLife: 0.36 });
      this.rings.push({ x: e.x, y: e.y, r: 6, maxR: r * 0.78, color: '#FF7D4D', life: 0.32, maxLife: 0.32 });
      this.spawnFx('fx:cryo_burst', e.x, e.y, { size: r * 1.4, life: 0.34, rotSpd: 3.5 });
      this.spawnFx('fx:blast_star', e.x, e.y, { size: r * 1.1, life: 0.28, rotSpd: -2.5 });
      this.addText(e.x, e.y - e.radius - 22, '🔥❄ FROSTFIRE!', '#60EFFF', 15);
      this.cam.shake = Math.max(this.cam.shake, 4.5);
      window.MM.Audio.SFX.explode();
      this.enemies.forEach((other) => {
        if (!other.dead && dist2(other.x, other.y, e.x, e.y) <= (r + other.radius) ** 2) {
          this.dealDamage(other, dmg, ['THERMAL', 'VOLTAIC'], true);
        }
      });
      this._dmgSource = prevSrc;
    }
  });
})();
