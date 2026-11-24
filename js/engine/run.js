// ============================================================================
// MULTI-MINE — GameEngine: run
// ============================================================================
(function () {
  // eslint-disable-next-line no-unused-vars
  const { ARENA_W, ARENA_H, clamp, dist2, rand, pick } = window.MM.EngineUtil;

  Object.assign(window.MM.GameEngine.prototype, {
    // ------------------------------------------------------------------------
    // RUN INITIALIZATION & STATS
    // ------------------------------------------------------------------------
    resetRunState(charId, hazardLevel = 1, opts = null) {
      const charDef = window.MM.getCharacter(charId);
      const lab = window.MM.Meta.getLabBonuses();
      const meta = window.MM.Meta.get();
      const hazard = window.MM.HAZARDS[hazardLevel - 1] || window.MM.HAZARDS[0];
      const biomeId = (opts && opts.biomeId) || meta.selectedBiome || 'auto';
      const modifiers = Array.isArray(opts && opts.modifiers)
        ? [...opts.modifiers]
        : [...(meta.selectedModifiers || [])];

      const perks = charDef.perks || {};
      this.run = {
        charId: charDef.id,
        charDef,
        hazard,
        biomeId,
        modifiers,
        isPractice: !!(opts && opts.isPractice),
        dailyKey: (opts && opts.dailyKey) || null,
        wave: 1,
        endless: false,
        won: false,
        scrap: 25 + (lab.startScrap || 0), // Starting scrap (raised from 12 at the user's request)
        salvageBag: 0,                    // Uncollected scrap bagged for next wave!
        cratesThisWave: 0,
        lastWaveHarvest: 0,
        petShopCounter: 0,
        nextPetShopTarget: Math.random() < 0.5 ? 4 : 5,
        level: 1,
        xp: 0,
        xpNext: 92,
        pendingLevelUps: 0,
        bonusCrates: 0,
        kills: 0,
        bossKills: 0,
        eventsCompleted: 0,
        killNovaCounter: 0,
        totalDamageDealt: 0,
        damageBySource: {},
        waveDamageBySource: {},
        mergesDone: 0,
        shardsEarned: 0,
        tools: (perks.petOnly || !charDef.startTool) ? [] : [
          { uid: this.nextUid(), id: charDef.startTool, tier: 1, cursed: false, cdTimer: 0.25, firePulse: 0 }
        ],
        modules: [],
        bonusStats: {
          maxHp: lab.maxHp || 0,
          hpRegen: 0,
          armor: 0,
          dodge: perks.startDodge || 0,
          lifeSteal: 0,
          harvesting: 2 + (perks.startHarvesting || 0),
          speedPct: lab.speedPct || 0,
          damagePct: lab.damagePct || 0,
          engineering: lab.engineering || 0,
          attackSpeedPct: 0,
          critChance: 0,
          areaPct: 0,
          magnet: lab.magnet || 0,
          luck: lab.luck || 0,
          scrapPct: lab.scrapPct || 0,
          dashCdPct: 0,
          shopDiscountPct: 0,
          sellBonusPct: 0,
          enemyCountPct: 0,
          crateLuckPct: 0,
          curseLevel: perks.startCurse || 0
        },
        specials: {
          dashLightning: false,
          extraDeployCap: 0,
          aegisShield: false,
          pickupBolt: 0,
          killOrb: 0,
          spicyFruit: 0,
          scrapSpeed: 0,
          piggyBank: 0,
          crownHarvest: 0,
          bloodDonate: 0,
          allBurn: 0,
          spreadBurn: 0,
          deathExplode: 0,
          cryoArc: 0,
          pocketFactory: 0,
          improvedTools: 0,
          autoMine: 0,
          speedToDmg: 0,
          statueBuff: 0,
          adrenaline: 0,
          painShock: 0,
          tardigrade: 0,
          thorns: 0,
          fairyRegen: 0,
          opticRing: 0,
          critBounty: 0,
          critHeal: 0,
          dodgeToAspd: 0,
          scrapToHp: 0,
          vigilanteDmg: 0,
          forgeAnvil: 0,
          bossBreaker: 0,
          relicPull: 0,
          engToDmg: 0,
          autoMedFruit: 0,
          extraChain: 0,
          blastShrapnel: 0,
          dashMine: 0,
          salvage3x: 0,
          frostShatter: 0,
          waveShield: 0,
          berserkLowHp: 0,
          ultChargeBoost: 0,
          shieldAmp: 0,
          echoStrike: 0,
          killNova: 0,
          dashMines: 0,
          ultReset: 0
        }
      };

      this.stats = this.recomputeStats();
      this.player = {
        x: ARENA_W / 2,
        y: ARENA_H / 2,
        vx: 0,
        vy: 0,
        facing: 1,
        tilt: 0,
        hp: this.stats.maxHp,
        hpTrail: this.stats.maxHp,
        shield: 0,
        tardigradeCharges: 0,
        invuln: 0,
        dashTimer: 0,
        dashCd: 0,
        dashDx: 1,
        dashDy: 0,
        hasteTimer: 0,
        painBuffTimer: 0,
        bloodTimer: 2.5,
        autoMineTimer: 5.5,
        opticTimer: 3.2,
        relicTimer: 4.0,
        medFruitTimer: 8.0,
        lifeStealCd: 0,
        standingStill: false,
        ultCharge: 40,
        ultOverdriveTimer: 0,
        ultOverdriveAmt: 0,
        ultCritTimer: 0,
        petFrenzyTimer: 0,
        petRallyCd: 0,
        petRallyTimer: 0,
        quantumPulseTimer: 4,
        quantumOverclockTimer: 0,
        aegisTimer: 0,
        walkPhase: 0,
        dustTimer: 0,
        hitFlash: 0,
        seismicCounter: 0
      };
      this.petRallyTarget = null;
      this.apexTimer = 4;
      this.apexActiveTimer = 0;

      // Grant starting Pets (e.g. Mochi Beast-Tamer starts with Catling Gun + Loot Worm!)
      if (perks.startingPets && perks.startingPets.length) {
        perks.startingPets.forEach((pid) => {
          const mDef = window.MM.getModule(pid);
          if (mDef) this.applyModule(mDef, false);
        });
      }

      this.cam = { x: this.player.x, y: this.player.y, shake: 0, shakeTime: 0 };
      this.clearWaveEntities();
    },

    computePetSynergies() {
      const petIds = [];
      const petSet = new Set();
      if (this.run && this.run.modules) {
        this.run.modules.forEach((modId) => {
          const m = window.MM.getModule(modId);
          if (m && m.petId) {
            petIds.push(m.petId);
            petSet.add(m.petId);
          }
        });
      }
      const count = petIds.length;
      const active = [];
      const flags = {
        count,
        frostfire: false,
        swarmAura: false,
        alphaPack: false,
        shockAcid: false,
        apexPredators: false,
        scavengerSyndicate: false
      };
      if (petSet.has('frost_pup') && petSet.has('blazemander')) {
        flags.frostfire = true;
        active.push({ id: 'frostfire', name: 'Frostfire', icon: '🔥❄', color: '#60EFFF', desc: 'Chilled + Burning foes explode in FROSTFIRE DETONATIONS!' });
      }
      if (count >= 5) {
        flags.swarmAura = true;
        flags.alphaPack = true;
        active.push({ id: 'swarm_aura', name: `Alpha Pack (${count})`, icon: '👑🐾', color: '#FFE07A', desc: '+45% Pet Damage, +35% Attack Speed, +25% Speed & neon pack auras!' });
      } else if (count >= 3) {
        flags.swarmAura = true;
        active.push({ id: 'swarm_aura', name: `Swarm Aura (${count})`, icon: '🐾', color: '#5FE3B8', desc: '+22% Pet Attack Speed & +18% Pet Move Speed!' });
      }
      if (petSet.has('volt_ferret') && (petSet.has('mine_crab') || petSet.has('slime_cube'))) {
        flags.shockAcid = true;
        active.push({ id: 'shock_acid', name: 'Shock-Acid', icon: '⚡🧪', color: '#A78BFA', desc: 'Volt-Ferret arcs +2 extra jumps & +40% shock damage!' });
      }
      if (petSet.has('catling') && petSet.has('mech_rex')) {
        flags.apexPredators = true;
        active.push({ id: 'apex_predators', name: 'Apex Predators', icon: '🦖🔫', color: '#FFE07A', desc: 'Catling + Mecha-Rex surge +60% speed every 7s!' });
      }
      if (petSet.has('loot_worm') && (petSet.has('medic_bee') || petSet.has('void_owl'))) {
        flags.scavengerSyndicate = true;
        active.push({ id: 'scavenger_syndicate', name: 'Scavenger Duo', icon: '💎🐝', color: '#5BD6A0', desc: '+20% Scrap drops & Loot Worm spits bonus +5 HP berries!' });
      }
      if (petSet.has('laser_mantis') && (petSet.has('grav_jelly') || petSet.has('void_owl'))) {
        flags.voidHunters = true;
        active.push({ id: 'void_hunters', name: 'Void Hunters', icon: '🌌🦗', color: '#E84BFF', desc: 'Laser Mantis deals +45% dmg to slowed foes & grants +3% Ult Charge on strikes!' });
      }
      if (petSet.has('mini_ufo') && (petSet.has('void_owl') || petSet.has('plasma_jelly'))) {
        flags.cosmicFleet = true;
        active.push({ id: 'cosmic_fleet', name: 'Cosmic Fleet', icon: '🛸🌌', color: '#60EFFF', desc: 'Orbital Pets fire twin lasers & grant +20% faster Ultimate Charge!' });
      }
      if (petSet.has('magma_turtle') && (petSet.has('mine_crab') || petSet.has('loot_worm'))) {
        flags.ironShell = true;
        active.push({ id: 'iron_shell', name: 'Iron Shell', icon: '🐢🦀', color: '#FF9E64', desc: '+5 Armor, +18 Max HP & Tortoise unleashes a counter-quake when you take damage!' });
      }
      flags.active = active;
      return flags;
    },

    exportSave() {
      if (!this.run) return null;
      return {
        v: 2,
        charId: this.run.charId,
        hazardLevel: this.run.hazard.level,
        biomeId: this.run.biomeId || 'auto',
        modifiers: [...(this.run.modifiers || [])],
        wave: this.run.wave,
        endless: !!this.run.endless,
        won: !!this.run.won,
        scrap: this.run.scrap,
        salvageBag: this.run.salvageBag || 0,
        lastWaveHarvest: this.run.lastWaveHarvest || 0,
        petShopCounter: this.run.petShopCounter || 0,
        nextPetShopTarget: this.run.nextPetShopTarget || 4,
        level: this.run.level,
        xp: this.run.xp,
        xpNext: this.run.xpNext,
        kills: this.run.kills,
        bossKills: this.run.bossKills,
        totalDamageDealt: this.run.totalDamageDealt,
        damageBySource: { ...(this.run.damageBySource || {}) },
        waveDamageBySource: { ...(this.run.waveDamageBySource || {}) },
        mergesDone: this.run.mergesDone,
        shardsEarned: this.run.shardsEarned,
        tools: this.run.tools.map((t) => ({ id: t.id, tier: t.tier, cursed: !!t.cursed })),
        modules: [...(this.run.modules || [])],
        bonusStats: { ...this.run.bonusStats },
        specials: { ...this.run.specials }
      };
    },

    importSave(save) {
      if (!save || !save.charId) return false;
      this.resetRunState(save.charId, save.hazardLevel || 1, {
        biomeId: save.biomeId || 'auto',
        modifiers: Array.isArray(save.modifiers) ? save.modifiers : []
      });
      this.run.wave = save.wave || 1;
      this.run.endless = !!save.endless;
      this.run.won = !!save.won;
      this.run.scrap = save.scrap || 0;
      this.run.salvageBag = save.salvageBag || 0;
      this.run.lastWaveHarvest = save.lastWaveHarvest || 0;
      this.run.petShopCounter = save.petShopCounter || 0;
      this.run.nextPetShopTarget = save.nextPetShopTarget || 4;
      this.run.level = save.level || 1;
      this.run.xp = save.xp || 0;
      this.run.xpNext = save.xpNext || 38;
      this.run.kills = save.kills || 0;
      this.run.bossKills = save.bossKills || 0;
      this.run.totalDamageDealt = save.totalDamageDealt || 0;
      this.run.damageBySource = { ...(save.damageBySource || {}) };
      this.run.waveDamageBySource = { ...(save.waveDamageBySource || {}) };
      this.run.mergesDone = save.mergesDone || 0;
      this.run.shardsEarned = save.shardsEarned || 0;
      this.run.tools = (save.tools || []).map((t) => ({
        uid: this.nextUid(), id: t.id, tier: t.tier || 1, cursed: !!t.cursed, cdTimer: 0.25, firePulse: 0
      }));
      this.run.modules = [...(save.modules || [])];
      Object.assign(this.run.bonusStats, save.bonusStats || {});
      Object.assign(this.run.specials, save.specials || {});
      this.recomputeStats();
      this.player.hp = this.stats.maxHp;
      this.player.hpTrail = this.stats.maxHp;
      return true;
    },

    recomputeStats() {
      const c = this.run.charDef.stats;
      const b = this.run.bonusStats;
      const sp = this.run.specials;
      const syn = window.MM.computeSynergies(this.run.tools);
      const sb = syn.bonuses;
      const perks = this.run.charDef.perks || {};

      let scrapDmgBonus = 0;
      if (perks.scrapDamageScaling) {
        scrapDmgBonus = Math.floor(this.run.scrap / 40) * 3;
      }

      const totalSpeedPct = b.speedPct + sb.speedPct;
      const speedToDmgBonus = sp.speedToDmg > 0 ? Math.max(0, totalSpeedPct) * sp.speedToDmg : 0;
      const mk1Count = this.run.tools.filter((t) => t.tier === 1).length;
      const fairyBonus = sp.fairyRegen > 0 ? mk1Count * 1.2 * sp.fairyRegen : 0;
      const statueActive = sp.statueBuff > 0 && this.player && this.player.standingStill;
      const painBonus = (this.player && this.player.painBuffTimer > 0) ? 20 * sp.painShock : 0;

      const dodgeCap = perks.maxDodgeCap !== undefined ? perks.maxDodgeCap : 60;
      const effBonusDodge = Math.round((b.dodge || 0) * (perks.dodgeGainMult || 1));
      const dodgeVal = clamp(effBonusDodge, 0, dodgeCap);
      const dodgeToAspdBonus = sp.dodgeToAspd > 0 ? Math.round(dodgeVal * 1.5 * sp.dodgeToAspd) : 0;
      const scrapToHpBonus = sp.scrapToHp > 0 ? Math.floor(this.run.scrap / 12) * sp.scrapToHp : 0;
      const baseEng = Math.max(0, c.engineering + b.engineering + sb.engineering);
      const engToDmgBonus = sp.engToDmg > 0 ? Math.floor(baseEng / 2) * sp.engToDmg : 0;

      const rawMaxHp = Math.max(30, Math.round(c.maxHp + b.maxHp + scrapToHpBonus + (this.petSynergies && this.petSynergies.ironShell ? 18 : 0)));
      const stacked = this.isRiskStacked();
      const maxHp = this.hasModifier('glass_cannon') ? Math.max(20, Math.round(rawMaxHp * (stacked ? 0.85 : 0.6))) : rawMaxHp;
      const hpToDmgBonus = perks.hpToDmgDiv ? Math.floor(maxHp / perks.hpToDmgDiv) : 0;
      const missingHpFrac = (this.player && maxHp > 0) ? clamp(1 - this.player.hp / maxHp, 0, 1) : 0;
      const berserkDmg = sp.berserkLowHp > 0 ? Math.round(missingHpFrac * 30 * sp.berserkLowHp) : 0;
      const berserkAspd = sp.berserkLowHp > 0 ? Math.round(missingHpFrac * 45 * sp.berserkLowHp) : 0;

      const cursedWeaponCount = this.run.tools.filter((t) => t.cursed).length;
      const totalCurse = (b.curseLevel || 0) + cursedWeaponCount;
      const curseDmgBonus = (perks.dmgPerCurse || 0) * totalCurse;
      const multiWeaponPenalty = (perks.dmgPenaltyPerWeapon || 0) * Math.max(0, this.run.tools.length - 1);
      const ultAspd = (this.player && this.player.ultOverdriveTimer > 0) ? (this.player.ultOverdriveAmt || 60) : 0;
      const ultCrit = (this.player && this.player.ultCritTimer > 0) ? 40 : 0;
      const glassDmgBonus = this.hasModifier('glass_cannon') ? 75 : 0;
      const bloodHarvestDmg = this.hasModifier('blood_harvest') ? 20 : 0;
      const bloodHarvestLeech = this.hasModifier('blood_harvest') ? 15 : 0;
      const fastEscLuck = this.hasModifier('fast_escalation') ? 20 : 0;
      const shieldAmpDmg = (sp.shieldAmp > 0 && this.player && this.player.shield > 0) ? 22 * sp.shieldAmp : 0;

      this.petSynergies = this.computePetSynergies();
      const petSynScrapBonus = this.petSynergies.scavengerSyndicate ? 20 : 0;
      const petSynArmorBonus = this.petSynergies.ironShell ? 5 : 0;

      const speedMult = Math.max(0.55, 1 + totalSpeedPct / 100);
      const dashCd = Math.max(0.95, (c.dashCd + 0.3) * Math.max(0.5, 1 + b.dashCdPct / 100));
      const effArmorBonus = Math.round((b.armor + sb.armor + petSynArmorBonus) * (perks.armorGainMult || 1));
      const sustainMult = perks.sustainGainMult || 1;

      this.synergies = syn;
      this.stats = {
        maxHp,
        maxSlots: perks.maxSlots !== undefined ? perks.maxSlots : 6,
        rangeBonus: perks.rangeBonus || 0,
        hpRegen: Math.max(0, (c.hpRegen + b.hpRegen + fairyBonus) * sustainMult) * (this.hasModifier('blood_harvest') ? (stacked ? 0.4 : 0) : 1),
        armor: Math.max(-5, c.armor + effArmorBonus + (statueActive ? 6 * sp.statueBuff : 0)),
        dodge: dodgeVal,
        lifeSteal: clamp(Math.round(((b.lifeSteal || 0) + bloodHarvestLeech) * sustainMult), 0, 60),
        harvesting: Math.max(0, Math.round(b.harvesting || 0)),
        // ~18% calmer global pace so movement & dodging feel deliberate and skill-based!
        speed: Math.round(c.speed * speedMult * 0.82),
        damagePct: c.damagePct + b.damagePct + scrapDmgBonus + speedToDmgBonus + painBonus + engToDmgBonus + hpToDmgBonus + berserkDmg + curseDmgBonus + glassDmgBonus + bloodHarvestDmg + shieldAmpDmg - multiWeaponPenalty,
        engineering: baseEng,
        attackSpeedPct: c.attackSpeedPct + b.attackSpeedPct + sb.attackSpeedPct + (statueActive ? 40 * sp.statueBuff : 0) + dodgeToAspdBonus + berserkAspd + ultAspd,
        critChance: clamp(c.critChance + b.critChance + sb.critChance + ultCrit, 0, 95),
        areaPct: Math.max(-25, c.areaPct + b.areaPct + sb.areaPct),
        magnet: Math.max(60, c.magnet + b.magnet),
        luck: Math.max(0, c.luck + b.luck + fastEscLuck),
        scrapPct: c.scrapPct + b.scrapPct + petSynScrapBonus,
        xpPct: b.xpPct || 0,
        shopDiscount: clamp(((perks.shopDiscount || 0) + (b.shopDiscountPct || 0) / 100), -0.25, 0.55),
        sellBonusPct: b.sellBonusPct || 0,
        enemyCountPct: b.enemyCountPct || 0,
        crateLuckPct: b.crateLuckPct || 0,
        curseLevel: totalCurse,
        dashCd
      };
      return this.stats;
    },

    applyModule(modDef, isCursed = false) {
      this.run.modules.push(modDef.id);
      const boost = isCursed ? 1.35 : 1.0;
      if (modDef.mods) {
        Object.keys(modDef.mods).forEach((k) => {
          const raw = modDef.mods[k];
          const val = (isCursed && raw > 0 && k !== 'curseLevel') ? (Math.abs(raw) < 5 ? Number((raw * boost).toFixed(1)) : Math.round(raw * boost)) : raw;
          this.run.bonusStats[k] = (this.run.bonusStats[k] || 0) + val;
        });
      }
      if (isCursed) {
        this.run.bonusStats.curseLevel = (this.run.bonusStats.curseLevel || 0) + 1;
      }
      if (modDef.special) {
        const s = modDef.special;
        if (s === 'dashLightning' || s === 'aegisShield') this.run.specials[s] = true;
        else this.run.specials[s] = (this.run.specials[s] || 0) + 1;
      }
      this.recomputeStats();
      this.player.hp = Math.min(this.stats.maxHp, this.player.hp + Math.max(0, (modDef.mods && modDef.mods.maxHp) || 0));
      this.player.hpTrail = Math.max(this.player.hpTrail, this.player.hp);
    },

    applyLevelUpgrade(stat, val) {
      this.run.bonusStats[stat] = (this.run.bonusStats[stat] || 0) + val;
      this.recomputeStats();
      if (stat === 'maxHp') {
        this.player.hp = Math.min(this.stats.maxHp, this.player.hp + val);
        this.player.hpTrail = Math.max(this.player.hpTrail, this.player.hp);
      }
    },

    clearWaveEntities() {
      this.enemies = [];
      this.projectiles = [];
      this.enemyShots = [];
      this.deployables = [];
      this.drones = [];
      this.orbitals = [];
      this.pets = [];
      this.arenaObjects = [];
      this.hazards = [];
      this.beams = [];
      this.rings = [];
      this.fxSprites = [];
      this.decals = [];   // Persistent fading ground scorch marks, craters & frost decals!
      this.debris = [];   // 3D-arcing bouncing flat-vector rocks/sparks with shadows!
      this.pickups = [];
      this.particles = [];
      this.texts = [];
      this.afterimages = [];
      this.telegraphs = [];
      this.pickupCombo = 0;
      this.killStreak = 0;
      this.killStreakTimer = 0;
    },

    // ------------------------------------------------------------------------
    // START WAVE
    // ------------------------------------------------------------------------
    startWave(waveNum) {
      if (this.run && this.run.isPractice && waveNum > 3) {
        this.run.practiceCompleted = true;
        this.state = 'victory';
        if (this.cb.onVictory) this.cb.onVictory(this.run);
        return;
      }
      this.run.wave = waveNum;
      this.waveCfg = window.MM.getWaveConfig(waveNum, this.run.biomeId || 'auto');
      this.run.cratesThisWave = 0;
      this.run.waveDamageBySource = {};

      // Piggy Vault interest at start of wave!
      if (waveNum > 1 && this.run.specials.piggyBank > 0 && this.run.scrap > 0) {
        const interest = Math.round(this.run.scrap * 0.15 * this.run.specials.piggyBank);
        if (interest > 0) {
          this.run.scrap += interest;
        }
      }

      // Master Forge Anvil (Brotato Anvil!): upgrade 1 random contraption tier every wave!
      if (waveNum > 1 && this.run.specials.forgeAnvil > 0) {
        for (let k = 0; k < this.run.specials.forgeAnvil; k++) {
          const upgradable = this.run.tools.filter((t) => t.tier < 4);
          if (upgradable.length > 0) {
            const pickTool = pick(upgradable);
            pickTool.tier = Math.min(4, pickTool.tier + 1);
          } else {
            this.run.bonusStats.armor += 2;
          }
        }
      }

      this.recomputeStats();
      this.ensureFloorCache(this.waveCfg.biome);

      const maxSyn = Math.max(...Object.values(this.synergies.counts));
      if (maxSyn >= 4) this.notifyAch(window.MM.Meta.unlockAchievement('synergy_4'));
      if (maxSyn >= 6) this.notifyAch(window.MM.Meta.unlockAchievement('synergy_6'));

      this.clearWaveEntities();
      this.player.x = ARENA_W / 2;
      this.player.y = ARENA_H / 2;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.tilt = 0;
      this.player.hp = this.stats.maxHp;
      this.player.hpTrail = this.stats.maxHp;
      this.player.shield = (this.run.specials.aegisShield ? 20 : 0) + (this.run.specials.waveShield || 0) * 25 + (this.run.specials.shieldAmp || 0) * 45;
      this.player.tardigradeCharges = this.run.specials.tardigrade || 0;
      this.player.invuln = 0.85;
      this.player.dashCd = 0;
      this.player.dashTimer = 0;
      this.player.painBuffTimer = 0;
      this.player.bloodTimer = 2.5;
      this.player.autoMineTimer = 4.0;
      this.player.opticTimer = 2.6;
      this.player.relicTimer = 4.0;
      this.player.medFruitTimer = 6.5;
      this.player.lifeStealCd = 0;
      this.player.standingStill = false;
      this.player.quantumPulseTimer = 4.5;

      this.cam.x = this.player.x;
      this.cam.y = this.player.y;
      this.cam.shake = 0;
      this.hitStop = 0;

      this.waveTimer = this.waveCfg.duration;
      this.waveElapsed = 0;
      this.spawnTimer = 0.55;
      this.surgeTimer = waveNum === 1 ? 999 : 13.5;
      this.arenaHazardTimer = waveNum === 1 ? 999 : 7.5;
      this.arenaObjTimer = 13.5;
      this.eliteSpawnTimer = this.waveCfg.elite ? 7.5 : -1;
      this.initWaveEvents();
      this.volcanoSmokeTimer = 0.5;
      this.player.ultCharge = Math.max(20, Math.min(100, this.player.ultCharge || 20));
      this.player.ultOverdriveTimer = 0;
      this.player.ultCritTimer = 0;
      this.player.petFrenzyTimer = 0;
      this.player.petRallyCd = 0;
      this.player.petRallyTimer = 0;
      this.petRallyTarget = null;
      this.apexTimer = 4.0;
      this.apexActiveTimer = 0;
      this.bossSpawned = false;
      this.activeBoss = null;
      this.waveEnding = false;
      this.waveEndTimer = 0;
      this.hudAccum = 1;

      this.run.tools.forEach((t, idx) => {
        t.cdTimer = 0.2 + idx * 0.12;
        t.firePulse = 0;
      });
      this.rebuildPersistentUnits();
      if (this.pets.length >= 3) this.notifyAch(window.MM.Meta.unlockAchievement('pack_leader'));
      if (this.petSynergies && this.petSynergies.active && this.petSynergies.active.length > 0) {
        this.notifyAch(window.MM.Meta.unlockAchievement('pet_synergy'));
      }
      this.spawnInitialArenaObjects();

      this.state = 'playing';
      if (this.cb.onWaveStart) this.cb.onWaveStart(this.waveCfg);
      if (this.cb.onHudUpdate) this.cb.onHudUpdate(this.getHudSnapshot());

      if (this.waveCfg.boss) {
        window.MM.Audio.SFX.bossWarn();
        window.MM.Audio.setMusicMode('boss');
        this.spawnBoss(this.waveCfg.boss, 0);
        if (this.waveCfg.secondBoss) {
          this.spawnBoss(this.waveCfg.secondBoss, 1);
        } else if (this.hasModifier('double_boss')) {
          this.spawnBoss(this.waveCfg.boss, 1);
        }
      } else {
        window.MM.Audio.setMusicMode('combat');
      }
    },

    rebuildPersistentUnits() {
      this.orbitals = [];
      this.drones = [];
      this.pets = [];
      const syn = this.synergies.bonuses;
      const perks = this.run.charDef.perks || {};

      this.run.tools.forEach((slot) => {
        const def = window.MM.getContraption(slot.id);
        if (def.kind === 'orbital_sat' || def.kind === 'orbital_saw' || def.kind === 'orbital_mirror' || def.kind === 'orbital_ball' || def.kind === 'orbital_frost') {
          const baseCount = def.kind === 'orbital_saw' ? 2 + (slot.tier - 1) : (def.kind === 'orbital_ball' ? 1 + Math.floor((slot.tier - 1) / 2) : 1 + Math.floor(slot.tier / 2));
          const count = baseCount + (syn.bonusOrbit || 0);
          for (let i = 0; i < count; i++) {
            this.orbitals.push({
              slot, def,
              angle: (Math.PI * 2 * i) / count + 0.2,
              radius: (def.radius + (perks.orbitalRadiusBonus || 0)) * (1 + this.stats.areaPct / 260),
              fireCd: rand(0.3, 0.9),
              trail: [], hitMap: new Map()
            });
          }
        } else if (def.kind === 'drone' || def.kind === 'saw_drone' || def.kind === 'drill_drone' || def.kind === 'shield_drone') {
          const count = 1 + Math.floor((slot.tier - 1) / 2) + (perks.extraDeployCap || 0) + (syn.extraDeployCap || 0) + this.run.specials.extraDeployCap;
          for (let i = 0; i < count; i++) {
            this.drones.push({
              slot, def,
              isSaw: def.kind === 'saw_drone',
              isDrill: def.kind === 'drill_drone',
              isShield: def.kind === 'shield_drone',
              shieldCd: rand(1.2, 2.5),
              x: this.player.x + rand(-55, 55),
              y: this.player.y + rand(-55, 55),
              vx: 0, vy: 0,
              attackCd: rand(0.2, 0.6),
              angle: (Math.PI * 2 * i) / count,
              trail: []
            });
          }
        }
      });

      // Spawn Autonomous Companion Pets for every owned Pet module!
      let petIdx = 0;
      (this.run.modules || []).forEach((modId) => {
        const mDef = window.MM.getModule(modId);
        if (mDef && mDef.petId) {
          const ang = (Math.PI * 2 * petIdx) / 5 + 0.5;
          this.pets.push({
            petId: mDef.petId,
            name: mDef.name,
            x: this.player.x + Math.cos(ang) * 68,
            y: this.player.y + Math.sin(ang) * 68,
            vx: 0, vy: 0,
            facing: 1,
            phase: petIdx * 1.4,
            cd: rand(0.35, 1.0),
            auxCd: rand(2.5, 4.5),
            trail: []
          });
          petIdx++;
        }
      });
    },

    gainXp(amount) {
      const bonus = Math.max(1, Math.round(amount * (1 + (this.stats.xpPct || 0) / 100)));
      this.run.xp += bonus;
      while (this.run.xp >= this.run.xpNext) {
        this.run.xp -= this.run.xpNext;
        this.run.level++;
        this.run.pendingLevelUps++;
        // Tight Brotato XP curve: ~1-2 level-ups across Waves 1-3 so every choice matters!
        this.run.xpNext = Math.round(92 + this.run.level * 58 + Math.pow(this.run.level, 1.65) * 20);
        this.rings.push({ x: this.player.x, y: this.player.y, r: 10, maxR: 108, color: '#5BD6A0', life: 0.45, maxLife: 0.45 });
        this.addText(this.player.x, this.player.y - 68, `LEVEL ${this.run.level}!`, '#5BD6A0', 17);
        window.MM.Audio.SFX.levelUp();
      }
    },

    beginWaveClear() {
      if (this.waveEnding) return;
      this.waveEnding = true;
      this.waveEndTimer = 1.05;
      this.state = 'wave_clear';
      // Zenon Pacifist Protocol: every surviving enemy at wave clear pays bonus Scrap!
      const perks = this.run.charDef.perks || {};
      if (perks.pacifistSurvivorBonus) {
        const alive = this.enemies.filter((e) => !e.dead).length;
        if (alive > 0) {
          const bonus = alive * perks.pacifistSurvivorBonus;
          this.run.scrap += bonus;
          this.addText(this.player.x, this.player.y - 68, `+${bonus} PACIFIST SCRAP!`, '#4AA3E8', 16);
        }
      }
      this.enemies.forEach((e) => {
        if (!e.dead) this.spawnFx('fx:smoke_puff', e.x, e.y, { size: 36, life: 0.35, vy: -20 });
      });
      this.enemies = [];
      this.enemyShots = [];
      this.telegraphs = [];
      window.MM.Audio.SFX.waveClear();

      if (this.run.wave >= 1) this.notifyAch(window.MM.Meta.unlockAchievement('first_wave'));
      if (this.run.wave >= 4 && this.waveCfg && this.waveCfg.biome && this.waveCfg.biome.id === 'neon_forest') {
        this.notifyAch(window.MM.Meta.unlockAchievement('neon_forester'));
      }
      if (this.run.wave >= 4 && this.run.modifiers && this.run.modifiers.length > 0) {
        this.notifyAch(window.MM.Meta.unlockAchievement('mod_daredevil'));
      }
      if (this.run.wave >= 15) this.notifyAch(window.MM.Meta.unlockAchievement('endless_15'));
      if (this.run.wave >= 20) this.notifyAch(window.MM.Meta.unlockAchievement('endless_20'));
    },

    finishWaveTransition() {
      window.MM.Audio.setMusicMode('menu');
      // Authentic Brotato Bagged Materials: uncollected scrap goes into Salvage Bag for next wave!
      let bagged = 0;
      this.pickups.forEach((pk) => {
        if (pk.kind === 'scrap') {
          bagged += pk.scrap;
        }
      });
      this.run.salvageBag = Math.min(45, this.run.salvageBag + bagged);
      this.pickups = [];

      // Vigilante Escalator: permanently gain +4% Damage per stack at the end of every wave!
      if (this.run.specials.vigilanteDmg > 0) {
        this.run.bonusStats.damagePct += 4 * this.run.specials.vigilanteDmg;
      }

      // Authentic Brotato Harvesting Payout + Compound Growth (+5% base +8% per Compound Core)!
      this.recomputeStats();
      const harvestPay = Math.max(0, this.stats.harvesting);
      this.run.lastWaveHarvest = harvestPay;
      if (harvestPay > 0) {
        this.run.scrap += harvestPay;
        this.gainXp(Math.round(harvestPay * 0.35));
      }
      // Compound harvesting for next wave (or decay in deep Endless wave > 15 like Brotato!)
      if (this.run.wave <= 15) {
        const growthRate = 0.05 + (this.run.specials.crownHarvest || 0) * 0.08;
        const grow = Math.max(this.run.bonusStats.harvesting > 0 ? 1 : 0, Math.round(this.run.bonusStats.harvesting * growthRate));
        this.run.bonusStats.harvesting += grow;
      } else {
        this.run.bonusStats.harvesting = Math.max(0, Math.floor(this.run.bonusStats.harvesting * 0.82));
      }

      const modMult = window.MM.Meta.getModifierShardMult(this.run.modifiers);
      const dailyMult = this.run.dailyKey ? 2.0 : 1.0;
      const waveShards = Math.round((5 + this.run.wave * 2) * this.run.hazard.shardMult * modMult * dailyMult);
      this.run.shardsEarned += waveShards;
      window.MM.Meta.addShards(waveShards);
      if (this.run.dailyKey) window.MM.Meta.recordDailyProgress(this.run.dailyKey, this.run.wave, false);

      if (this.run.isPractice && this.run.wave >= 3) {
        this.run.practiceCompleted = true;
        const newAchs = window.MM.Meta.recordRunProgress({
          charId: this.run.charId, wave: this.run.wave, kills: this.run.kills,
          won: false, hazard: this.run.hazard.level,
          totalDamage: this.run.totalDamageDealt, endless: false
        });
        (newAchs || []).forEach((a) => this.notifyAch(a));
        this.state = 'victory';
        if (this.cb.onVictory) this.cb.onVictory(this.run);
        return;
      }

      if (this.run.wave === 12 && this.run.won && !this.run.endless) {
        const winBonus = Math.round(65 * this.run.hazard.shardMult * modMult * dailyMult);
        this.run.shardsEarned += winBonus;
        window.MM.Meta.addShards(winBonus);
        if (this.run.dailyKey) window.MM.Meta.recordDailyProgress(this.run.dailyKey, this.run.wave, true);
        const newAchs = window.MM.Meta.recordRunProgress({
          charId: this.run.charId, wave: this.run.wave, kills: this.run.kills,
          won: true, hazard: this.run.hazard.level,
          totalDamage: this.run.totalDamageDealt, endless: false
        });
        (newAchs || []).forEach((a) => this.notifyAch(a));
        this.state = 'victory';
        if (this.cb.onVictory) this.cb.onVictory(this.run);
        return;
      }

      this.state = 'shop';
      if (this.cb.onWaveClear) this.cb.onWaveClear(this.run, harvestPay);
    },

    handleGameOver() {
      this.state = 'gameover';
      window.MM.Audio.SFX.gameOver();
      if (this.run.dailyKey) window.MM.Meta.recordDailyProgress(this.run.dailyKey, this.run.wave, !!this.run.won);
      const newAchs = window.MM.Meta.recordRunProgress({
        charId: this.run.charId, wave: this.run.wave, kills: this.run.kills,
        won: this.run.won, hazard: this.run.hazard.level,
        totalDamage: this.run.totalDamageDealt, endless: !!this.run.endless
      });
      (newAchs || []).forEach((a) => this.notifyAch(a));
      if (this.cb.onGameOver) this.cb.onGameOver(this.run);
    }
  });
})();
