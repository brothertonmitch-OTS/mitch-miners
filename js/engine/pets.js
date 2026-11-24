// ============================================================================
// MULTI-MINE — GameEngine: pets
// ============================================================================
(function () {
  // eslint-disable-next-line no-unused-vars
  const { ARENA_W, ARENA_H, clamp, dist2, rand, pick } = window.MM.EngineUtil;

  Object.assign(window.MM.GameEngine.prototype, {
    updatePets(dt) {
      if (!this.pets || this.pets.length === 0) return;
      const p = this.player;
      const perks = this.run.charDef.perks || {};
      const ps = this.petSynergies || this.computePetSynergies();

      // Apex Predators periodic synchronized Overclock Barrage!
      if (ps.apexPredators) {
        if (this.apexActiveTimer > 0) {
          this.apexActiveTimer = Math.max(0, this.apexActiveTimer - dt);
        } else {
          this.apexTimer -= dt;
          if (this.apexTimer <= 0) {
            this.apexTimer = 7.0;
            this.apexActiveTimer = 3.0;
            this.addText(p.x, p.y - 64, '🦖🔫 APEX BARRAGE!', '#FFE07A', 15);
            window.MM.Audio.SFX.pet();
          }
        }
      }

      const alphaDmg = ps.alphaPack ? 1.45 : 1.0;
      const alphaAspd = ps.alphaPack ? 1.35 : (ps.swarmAura ? 1.22 : 1.0);
      const packMoveMult = (ps.alphaPack ? 1.25 : (ps.swarmAura ? 1.18 : 1.0)) * (this.hasModifier('pet_frenzy') ? 1.25 : 1.0);
      const rallyActive = p.petRallyTimer > 0;
      const rallyDmg = rallyActive ? 1.35 : 1.0;
      const rallySpd = rallyActive ? 1.35 : 1.0;
      const rallyTarget = (rallyActive && this.petRallyTarget && !this.petRallyTarget.dead) ? this.petRallyTarget : null;

      const petMult = (perks.petPowerMult || 1) * (p.petFrenzyTimer > 0 ? 1.35 : 1) * alphaDmg * rallyDmg;
      const eng = this.stats.engineering || 0;
      const dmgMult = Math.max(0.5, 1 + this.stats.damagePct / 100) * petMult * 0.78;
      const baseAspd = Math.max(0.6, 1 + this.stats.attackSpeedPct / 160)
        * (p.petFrenzyTimer > 0 ? 2.0 : 1)
        * (perks.petPowerMult && perks.petPowerMult > 1 ? 1.25 : 1)
        * alphaAspd
        * (this.hasModifier('pet_frenzy') ? 1.25 : 1.0);

      // Frostfire Synergy Check: any enemy simultaneously chilled & burning erupts!
      if (ps.frostfire) {
        for (let ei = 0; ei < this.enemies.length; ei++) {
          const en = this.enemies[ei];
          if (en.frostfireCd > 0) en.frostfireCd = Math.max(0, en.frostfireCd - dt);
          if (!en.dead && en.burnTimer > 0 && en.chillTimer > 0 && en.frostfireCd <= 0) {
            this.triggerFrostfire(en, dmgMult);
          }
        }
      }

      this.pets.forEach((pet, idx) => {
        this._dmgSource = `Pet: ${pet.name}`;
        const petProjStart = this.projectiles.length;
        const apexBoost = (ps.apexPredators && this.apexActiveTimer > 0 && (pet.petId === 'catling' || pet.petId === 'mech_rex')) ? 1.60 : 1.0;
        const aspd = baseAspd * apexBoost;
        pet.phase += dt * 7.5 * (apexBoost > 1 ? 1.35 : 1);
        pet.cd -= dt * aspd;
        pet.auxCd -= dt;

        // Default loyal follow spot around the player
        const followAng = this.waveElapsed * 0.9 + idx * 1.35;
        let goalX = p.x + Math.cos(followAng) * 74;
        let goalY = p.y + Math.sin(followAng) * 74;
        let moveSpd = Math.max(290, this.stats.speed * 1.25) * packMoveMult * rallySpd;

        const pickCombatTarget = (fromX, fromY, range) => {
          if (rallyTarget && dist2(fromX, fromY, rallyTarget.x, rallyTarget.y) <= (range + 260) ** 2) {
            return rallyTarget;
          }
          return this.findNearestEnemy(fromX, fromY, range);
        };

        if (pet.petId === 'loot_worm') {
          // LOOT WORM: Slithers across the entire arena gobbling up Scrap, Fruits & Crates!
          let bestPk = null;
          let bestD2 = 1e12;
          for (let k = 0; k < this.pickups.length; k++) {
            const pk = this.pickups[k];
            const d2 = dist2(pet.x, pet.y, pk.x, pk.y);
            if (d2 < bestD2) { bestD2 = d2; bestPk = pk; }
          }
          if (bestPk) {
            goalX = bestPk.x;
            goalY = bestPk.y;
            moveSpd = 430 * packMoveMult;
            if (bestD2 <= 38 * 38) {
              // Gobble pickup directly for the player!
              bestPk.x = p.x;
              bestPk.y = p.y;
              bestPk.superPull = true;
              this.rings.push({ x: pet.x, y: pet.y, r: 6, maxR: 28, color: '#FFE07A', life: 0.22, maxLife: 0.22 });
              if (ps.scavengerSyndicate && pet.auxCd <= 0 && Math.random() < 0.16) {
                pet.auxCd = 4.5;
                this.pickups.push({ kind: 'fruit', x: pet.x, y: pet.y, heal: 5, bob: rand(0, 6) });
                this.addText(pet.x, pet.y - 22, '+5 BERRY!', '#5FE3B8', 11);
              }
            }
          }
        } else if (pet.petId === 'catling') {
          // CATLING GUN: Follows player closely and sprays rapid rotary bullet bursts!
          const tgt = pickCombatTarget(pet.x, pet.y, 430);
          if (tgt && pet.cd <= 0) {
            pet.cd = 0.34;
            const ang = Math.atan2(tgt.y - pet.y, tgt.x - pet.x) + rand(-0.08, 0.08);
            const dmg = (10 + eng * 0.65) * dmgMult;
            this.projectiles.push({
              kind: 'bullet', x: pet.x, y: pet.y,
              vx: Math.cos(ang) * 620, vy: Math.sin(ang) * 620,
              dmg, radius: 6, pierce: 1, color: apexBoost > 1 ? '#5FE3B8' : '#FFE07A',
              hitIds: new Set(), life: 0.72, tags: ['ROBOTICS']
            });
            window.MM.Audio.SFX.shoot();
          }
        } else if (pet.petId === 'blazemander') {
          // BLAZEMANDER: Trots toward foes spitting fireballs & leaving mini lava trails!
          const tgt = pickCombatTarget(p.x, p.y, 400);
          if (tgt) { goalX = (p.x + tgt.x) * 0.5; goalY = (p.y + tgt.y) * 0.5; moveSpd = 340 * packMoveMult * rallySpd; }
          if (tgt && pet.cd <= 0) {
            pet.cd = 0.95;
            const ang = Math.atan2(tgt.y - pet.y, tgt.x - pet.x);
            const dmg = (18 + eng * 0.9) * dmgMult;
            this.projectiles.push({
              kind: 'ember', x: pet.x, y: pet.y,
              vx: Math.cos(ang) * 440, vy: Math.sin(ang) * 440,
              dmg, radius: 9.5, pierce: 2, hitIds: new Set(), life: 0.85, tags: ['THERMAL']
            });
            window.MM.Audio.SFX.hit();
          }
          if (pet.auxCd <= 0) {
            pet.auxCd = 3.2;
            this.hazards.push({
              kind: 'lava', x: pet.x, y: pet.y, radius: 44 * this.getAreaMult(),
              dmg: (10 + eng * 0.5) * dmgMult, tick: 0, smokeCd: 0.5, spawnT: 0,
              life: 3.0, maxLife: 3.0, tags: ['THERMAL']
            });
          }
        } else if (pet.petId === 'frost_pup') {
          // CRYO-ROBO PUP: Bounds straight at enemies and barks freezing cryo shockwaves!
          const tgt = pickCombatTarget(p.x, p.y, 410);
          if (tgt) { goalX = tgt.x; goalY = tgt.y; moveSpd = 390 * packMoveMult * rallySpd; }
          if (tgt && pet.cd <= 0 && dist2(pet.x, pet.y, tgt.x, tgt.y) <= 96 * 96) {
            pet.cd = 1.1;
            const r = 82 * this.getAreaMult();
            const dmg = (18 + eng * 0.95) * dmgMult;
            this.spawnFx('fx:cryo_burst', pet.x, pet.y, { size: r * 1.6, life: 0.3, rotSpd: 3 });
            this.rings.push({ x: pet.x, y: pet.y, r: 8, maxR: r, color: '#9CD3FF', life: 0.28, maxLife: 0.28 });
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, pet.x, pet.y) <= (r + e.radius) ** 2) {
                this.dealDamage(e, dmg, ['VOLTAIC'], false);
                e.chillTimer = Math.max(e.chillTimer, 2.8);
                if (ps.frostfire && e.burnTimer > 0) this.triggerFrostfire(e, dmgMult);
              }
            });
            window.MM.Audio.SFX.cryo();
          }
        } else if (pet.petId === 'volt_ferret') {
          // VOLT-FERRET: Zips rapidly between foes zapping chain lightning!
          const tgt = pickCombatTarget(pet.x, pet.y, 440);
          if (tgt) { goalX = tgt.x; goalY = tgt.y; moveSpd = 460 * packMoveMult * rallySpd; }
          if (tgt && pet.cd <= 0 && dist2(pet.x, pet.y, tgt.x, tgt.y) <= 145 * 145) {
            pet.cd = 0.85;
            const shockBonus = ps.shockAcid ? 1.4 : 1.0;
            const extraJumps = ps.shockAcid ? 2 : 0;
            const dmg = (16 + eng * 0.9) * dmgMult * shockBonus;
            this.fireChainLightning(pet.x, pet.y, tgt, dmg, 3 + extraJumps + (this.run.specials.extraChain || 0), ['VOLTAIC']);
          }
        } else if (pet.petId === 'medic_bee') {
          // NANO-BUMBLEBOT: Drops +6 HP Nano-Fruits & zaps close enemies!
          const tgt = pickCombatTarget(pet.x, pet.y, 310);
          if (tgt && pet.cd <= 0) {
            pet.cd = 0.9;
            const dmg = (14 + eng * 0.7) * dmgMult;
            this.dealDamage(tgt, dmg, ['ROBOTICS'], false);
            this.beams.push({ x1: pet.x, y1: pet.y, x2: tgt.x, y2: tgt.y, color: '#5BD6A0', width: 3.4, life: 0.16, maxLife: 0.16 });
          }
          if (pet.auxCd <= 0) {
            pet.auxCd = 6.5;
            this.pickups.push({ kind: 'fruit', x: pet.x, y: pet.y, heal: 6, bob: rand(0, 6) });
            this.rings.push({ x: pet.x, y: pet.y, r: 4, maxR: 28, color: '#5BD6A0', life: 0.28, maxLife: 0.28 });
            window.MM.Audio.SFX.pet();
          }
        } else if (pet.petId === 'mine_crab') {
          // SAP-CRAB: Scuttles toward enemy packs and drops live mini Proximity Mines!
          const tgt = pickCombatTarget(p.x, p.y, 380);
          if (tgt) { goalX = tgt.x; goalY = tgt.y; moveSpd = 320 * packMoveMult * rallySpd; }
          if (pet.cd <= 0 && this.deployables.length < 28) {
            pet.cd = 2.4;
            const mDef = window.MM.getContraption('prox_mine');
            this.deployables.push({
              slotUid: -66, slot: { tier: 1 }, def: mDef, kind: 'mine',
              x: clamp(pet.x, 64, ARENA_W - 64), y: clamp(pet.y, 64, ARENA_H - 64),
              dmg: (24 + eng * 1.1) * dmgMult, radius: 74 * this.getAreaMult(),
              armTimer: 0.3, spawnT: 0, recoil: 0, life: 12, pulse: 0, isMini: true
            });
            window.MM.Audio.SFX.deploy();
          }
        } else if (pet.petId === 'void_owl') {
          // QUANTUM OWL: Hovers near player sniping the highest-HP target with violet laser beams!
          if (pet.cd <= 0) {
            let best = rallyTarget && dist2(pet.x, pet.y, rallyTarget.x, rallyTarget.y) <= 680 * 680 ? rallyTarget : null;
            let bestHp = -1;
            if (!best) {
              this.enemies.forEach((e) => {
                if (!e.dead && dist2(pet.x, pet.y, e.x, e.y) <= 520 * 520 && e.hp > bestHp) {
                  bestHp = e.hp; best = e;
                }
              });
            }
            if (best) {
              pet.cd = 1.25;
              const dmg = (30 + eng * 1.2) * dmgMult;
              this.dealDamage(best, dmg, ['ORBITAL', 'VOLTAIC'], true);
              this.beams.push({ x1: pet.x, y1: pet.y, x2: best.x, y2: best.y, color: '#C6A6FF', width: 6, life: 0.22, maxLife: 0.22 });
              this.beams.push({ x1: pet.x, y1: pet.y, x2: best.x, y2: best.y, color: '#FFFFFF', width: 2.2, life: 0.22, maxLife: 0.22 });
              this.spawnFx('fx:volt_spark', best.x, best.y, { size: 38, life: 0.2 });
              window.MM.Audio.SFX.railgun();
            }
          }
        } else if (pet.petId === 'slime_cube') {
          // GELATINOUS SALVAGER: Hops onto enemies to squish them AND duplicates 25% of Scrap it hops over!
          const tgt = pickCombatTarget(p.x, p.y, 370);
          if (tgt) { goalX = tgt.x; goalY = tgt.y; moveSpd = 350 * packMoveMult * rallySpd; }
          if (tgt && pet.cd <= 0 && dist2(pet.x, pet.y, tgt.x, tgt.y) <= 48 * 48) {
            pet.cd = 0.65;
            const dmg = (15 + eng * 0.8 + this.stats.luck * 0.6) * dmgMult;
            this.dealDamage(tgt, dmg, ['SEISMIC'], false);
            this.rings.push({ x: pet.x, y: pet.y, r: 8, maxR: 38, color: '#5BD6A0', life: 0.22, maxLife: 0.22 });
            window.MM.Audio.SFX.hit();
          }
          // Duplicate untouched Scrap gems it bounces near!
          this.pickups.forEach((pk) => {
            if (pk.kind === 'scrap' && !pk.slimeDuped && dist2(pet.x, pet.y, pk.x, pk.y) <= 40 * 40) {
              pk.slimeDuped = true;
              if (Math.random() < 0.25) {
                pk.scrap += 1;
                pk.bagged = true;
                this.addText(pk.x, pk.y - 22, '+1 SLIME!', '#5BD6A0', 11);
              }
            }
          });
        } else if (pet.petId === 'mech_rex') {
          // LEGENDARY MINI MECHA-REX: Stomps forward with seismic shockwaves & breathes molten slag!
          const tgt = pickCombatTarget(p.x, p.y, 440);
          if (tgt) { goalX = tgt.x; goalY = tgt.y; moveSpd = 370 * packMoveMult * rallySpd; }
          if (tgt && pet.cd <= 0 && dist2(pet.x, pet.y, tgt.x, tgt.y) <= 135 * 135) {
            pet.cd = 1.15;
            const dmg = (36 + eng * 1.4) * dmgMult;
            this.triggerSeismicWave(pet.x, pet.y, 108 * this.getAreaMult(), dmg, true, ['SEISMIC', 'THERMAL']);
            const ang = Math.atan2(tgt.y - pet.y, tgt.x - pet.x);
            for (let f = -1; f <= 1; f++) {
              this.projectiles.push({
                kind: 'ember', x: pet.x, y: pet.y,
                vx: Math.cos(ang + f * 0.22) * 430, vy: Math.sin(ang + f * 0.22) * 430,
                dmg: dmg * 0.65, radius: 10, pierce: 2, hitIds: new Set(), life: 0.72, tags: ['THERMAL']
              });
            }
          }
        } else if (pet.petId === 'laser_mantis') {
          // LASER MANTIS: Blinks behind high-HP threats & unleashes twin guaranteed-crit neon plasma slashes!
          const tgt = pickCombatTarget(p.x, p.y, 480);
          if (tgt) { goalX = tgt.x + (tgt.x > p.x ? 28 : -28); goalY = tgt.y; moveSpd = 460 * packMoveMult * rallySpd; }
          if (tgt && pet.cd <= 0 && dist2(pet.x, pet.y, tgt.x, tgt.y) <= 185 * 185) {
            pet.cd = 0.95;
            // Blink straight to target!
            this.beams.push({ x1: pet.x, y1: pet.y, x2: tgt.x, y2: tgt.y, color: '#E84BFF', width: 4, life: 0.18, maxLife: 0.18 });
            pet.x = clamp(tgt.x + (pet.x < tgt.x ? 26 : -26), 54, ARENA_W - 54);
            pet.y = clamp(tgt.y, 54, ARENA_H - 54);
            const voidAmp = (ps.voidHunters && tgt.chillTimer > 0) ? 1.45 : 1.0;
            const dmg = (28 + eng * 1.25) * dmgMult * voidAmp;
            this.dealDamage(tgt, dmg, ['VOLTAIC', 'ORBITAL'], true);
            this.spawnFx('fx:volt_spark', tgt.x, tgt.y, { size: 48, life: 0.22, rotSpd: 5 });
            this.rings.push({ x: tgt.x, y: tgt.y, r: 8, maxR: 44, color: '#E84BFF', life: 0.22, maxLife: 0.22 });
            if (ps.voidHunters) this.addUltCharge(3);
            window.MM.Audio.SFX.zap();
          }
        } else if (pet.petId === 'grav_jelly') {
          // GRAVITY JELLY: Pulses neon violet gravity rings that slow & gently cluster nearby enemies!
          const tgt = pickCombatTarget(p.x, p.y, 380);
          if (tgt) { goalX = (p.x + tgt.x) * 0.52; goalY = (p.y + tgt.y) * 0.52; moveSpd = 310 * packMoveMult * rallySpd; }
          if (pet.cd <= 0) {
            pet.cd = 1.65;
            const gr = 128 * this.getAreaMult();
            const dmg = (14 + eng * 0.85) * dmgMult;
            this.rings.push({ x: pet.x, y: pet.y, r: gr, maxR: 12, color: '#9B6BE0', life: 0.38, maxLife: 0.38 });
            this.rings.push({ x: pet.x, y: pet.y, r: 10, maxR: gr * 0.82, color: '#60EFFF', life: 0.32, maxLife: 0.32 });
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, pet.x, pet.y) <= (gr + e.radius) ** 2) {
                this.dealDamage(e, dmg, ['ORBITAL', 'VOLTAIC'], false);
                e.chillTimer = Math.max(e.chillTimer, 2.5);
                if (!e.isBoss) {
                  const pdx = pet.x - e.x;
                  const pdy = pet.y - e.y;
                  const pd = Math.hypot(pdx, pdy) || 1;
                  e.vx += (pdx / pd) * 145;
                  e.vy += (pdy / pd) * 145;
                }
              }
            });
            window.MM.Audio.SFX.cryo();
          }
        } else if (pet.petId === 'chrono_fox') {
          // CHRONO-FOX: Dashes through packs leaving a golden time-slow bubble & slicing foes!
          const tgt = pickCombatTarget(p.x, p.y, 450);
          if (tgt) { goalX = tgt.x; goalY = tgt.y; moveSpd = 460 * packMoveMult * rallySpd; }
          if (tgt && pet.cd <= 0 && dist2(pet.x, pet.y, tgt.x, tgt.y) <= 130 * 130) {
            pet.cd = 1.15;
            const r = 96 * this.getAreaMult();
            const dmg = (22 + eng * 1.05) * dmgMult;
            this.rings.push({ x: tgt.x, y: tgt.y, r: 8, maxR: r, color: '#FFE07A', life: 0.36, maxLife: 0.36 });
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, tgt.x, tgt.y) <= (r + e.radius) ** 2) {
                this.dealDamage(e, dmg, ['VOLTAIC', 'ORBITAL'], false);
                e.chillTimer = Math.max(e.chillTimer, 3.0);
                if (!e.isBoss) e.stunTimer = Math.max(e.stunTimer, 0.55);
              }
            });
            window.MM.Audio.SFX.cryo();
          }
        } else if (pet.petId === 'magma_turtle') {
          // MAGMA TORTOISE: Patrols close to player, blocks enemy bullets & stomps molten rings!
          const tgt = pickCombatTarget(p.x, p.y, 290);
          if (tgt) { goalX = p.x + (tgt.x - p.x) * 0.48; goalY = p.y + (tgt.y - p.y) * 0.48; moveSpd = 310 * packMoveMult * rallySpd; }
          for (let si = this.enemyShots.length - 1; si >= 0; si--) {
            const s = this.enemyShots[si];
            if (dist2(pet.x, pet.y, s.x, s.y) <= (30 + s.r) ** 2) {
              this.rings.push({ x: s.x, y: s.y, r: 4, maxR: 26, color: '#FF7B54', life: 0.2, maxLife: 0.2 });
              this.enemyShots.splice(si, 1);
            }
          }
          if (tgt && pet.cd <= 0 && dist2(pet.x, pet.y, tgt.x, tgt.y) <= 140 * 140) {
            pet.cd = 1.4;
            const r = 92 * this.getAreaMult();
            const dmg = (20 + eng * 1.0) * dmgMult;
            this.rings.push({ x: pet.x, y: pet.y, r: 10, maxR: r, color: '#FF7B54', life: 0.32, maxLife: 0.32 });
            this.enemies.forEach((e) => {
              if (!e.dead && dist2(e.x, e.y, pet.x, pet.y) <= (r + e.radius) ** 2) {
                this.dealDamage(e, dmg, ['THERMAL', 'SEISMIC'], false);
                this.applyBurn(e, dmg * 0.35, 2.5);
              }
            });
            window.MM.Audio.SFX.seismic();
          }
        } else if (pet.petId === 'plasma_jelly') {
          // NEBULA JELLYFISH: Tethers continuous violet drain-beam & heals you +1 HP every 3s!
          const tgt = pickCombatTarget(pet.x, pet.y, 380);
          if (tgt && pet.cd <= 0) {
            pet.cd = 0.65;
            const dmg = (15 + eng * 0.85) * dmgMult;
            this.dealDamage(tgt, dmg, ['ORBITAL', 'VOLTAIC'], false);
            this.beams.push({ x1: pet.x, y1: pet.y, x2: tgt.x, y2: tgt.y, color: '#EC4899', width: 4.5, life: 0.2, maxLife: 0.2 });
            if (ps.cosmicFleet) {
              const tgt2 = this.findNearestEnemy(pet.x, pet.y, 380, tgt.uid);
              if (tgt2) {
                this.dealDamage(tgt2, dmg * 0.75, ['ORBITAL', 'VOLTAIC'], false);
                this.beams.push({ x1: pet.x, y1: pet.y, x2: tgt2.x, y2: tgt2.y, color: '#5FE3B8', width: 3.5, life: 0.2, maxLife: 0.2 });
              }
            }
          }
          if (pet.auxCd <= 0 && tgt) {
            pet.auxCd = 3.0;
            if (p.hp < this.stats.maxHp) {
              p.hp = Math.min(this.stats.maxHp, p.hp + 1);
              this.addText(p.x, p.y - 54, '+1 JELLY', '#EC4899', 11);
            }
          }
        } else if (pet.petId === 'mini_ufo') {
          // LEGENDARY SAUCER SCOUT: Fires sweeping orbital laser strikes & tractor-beams Scrap!
          const tgt = pickCombatTarget(p.x, p.y, 500);
          if (tgt) { goalX = tgt.x; goalY = clamp(tgt.y - 88, 64, ARENA_H - 64); moveSpd = 410 * packMoveMult * rallySpd; }
          if (tgt && pet.cd <= 0) {
            pet.cd = 1.05;
            const dmg = (32 + eng * 1.3) * dmgMult;
            const shots = ps.cosmicFleet ? 2 : 1;
            const tgts = this.findNearestEnemies(pet.x, pet.y, 440, shots);
            (tgts.length ? tgts : [tgt]).forEach((st) => {
              this.dealDamage(st, dmg, ['ORBITAL', 'VOLTAIC'], true);
              this.beams.push({ x1: pet.x, y1: pet.y + 8, x2: st.x, y2: st.y, color: '#5FE3B8', width: 7, life: 0.24, maxLife: 0.24 });
              this.beams.push({ x1: pet.x, y1: pet.y + 8, x2: st.x, y2: st.y, color: '#FFFFFF', width: 2.5, life: 0.24, maxLife: 0.24 });
              this.spawnFx('fx:volt_spark', st.x, st.y, { size: 42, life: 0.22 });
            });
            window.MM.Audio.SFX.railgun();
          }
          if (pet.auxCd <= 0) {
            pet.auxCd = 2.6;
            this.pickups.forEach((pk) => {
              if (pk.kind === 'scrap' && dist2(pet.x, pet.y, pk.x, pk.y) <= 280 * 280) pk.superPull = true;
            });
          }
        }

        // Smooth pet pursuit steering
        const dx = goalX - pet.x;
        const dy = goalY - pet.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > 14) {
          pet.vx += ((dx / d) * moveSpd - pet.vx) * Math.min(1, dt * 8);
          pet.vy += ((dy / d) * moveSpd - pet.vy) * Math.min(1, dt * 8);
          if (Math.abs(dx) > 6) pet.facing = dx >= 0 ? 1 : -1;
        } else {
          pet.vx *= Math.pow(0.04, dt);
          pet.vy *= Math.pow(0.04, dt);
        }
        pet.x = clamp(pet.x + pet.vx * dt, 54, ARENA_W - 54);
        pet.y = clamp(pet.y + pet.vy * dt, 54, ARENA_H - 54);
        pet.trail.push({ x: pet.x, y: pet.y });
        if (pet.trail.length > 7) pet.trail.shift();
        for (let pi = petProjStart; pi < this.projectiles.length; pi++) {
          if (!this.projectiles[pi].source) this.projectiles[pi].source = `Pet: ${pet.name}`;
        }
      });
      this._dmgSource = null;
    }
  });
})();
