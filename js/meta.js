// ============================================================================
// MULTI-MINE — Meta-Progression, Core Lab, Hazard Tiers & Achievements
// ============================================================================
window.MM = window.MM || {};

(function () {
  const SAVE_KEY = 'multimine_save_v1';

  const LAB_UPGRADES = [
    { id: 'hp', name: 'Exo-Suit Plating', icon: 'icon:heart', maxRank: 5, baseCost: 25, desc: '+8 Max HP per rank', perRank: { maxHp: 8 } },
    { id: 'eng', name: 'Blueprint Foundry', icon: 'icon:wrench', maxRank: 5, baseCost: 30, desc: '+3 Engineering per rank', perRank: { engineering: 3 } },
    { id: 'dmg', name: 'Reactor Output', icon: 'icon:reactor', maxRank: 5, baseCost: 35, desc: '+4% Global Damage per rank', perRank: { damagePct: 4 } },
    { id: 'spd', name: 'Servo Calibration', icon: 'icon:boots', maxRank: 5, baseCost: 25, desc: '+4% Move Speed per rank', perRank: { speedPct: 4 } },
    { id: 'scrap', name: 'Ore Refinement', icon: 'icon:scrap', maxRank: 5, baseCost: 30, desc: '+6% Scrap Earned per rank', perRank: { scrapPct: 6 } },
    { id: 'startScrap', name: 'Expedition Grant', icon: 'icon:crate', maxRank: 5, baseCost: 25, desc: '+15 Starting Scrap per rank', perRank: { startScrap: 15 } },
    { id: 'magnet', name: 'Magnetic Field', icon: 'icon:magnet', maxRank: 5, baseCost: 20, desc: '+18 Pickup Magnet per rank', perRank: { magnet: 18 } },
    { id: 'luck', name: 'Quantum Scanner', icon: 'icon:clover', maxRank: 5, baseCost: 30, desc: '+5 Luck per rank', perRank: { luck: 5 } }
  ];

  const HATS = [
    { id: 'none', name: 'Standard Issue', cost: 0, free: true, desc: 'Classic unmodded alien engineer helmet.' },
    { id: 'neon_crown', name: 'Neon Holo-Crown', cost: 0, free: true, desc: 'Glowing bioluminescent crown forged in the Neon Forest.' },
    { id: 'mushroom_cap', name: 'Glow-Shroom Cap', cost: 0, free: true, desc: 'Spotted neon-magenta alien forest mushroom cap.' },
    { id: 'top_hat', name: 'Cyber Top Hat', cost: 25, achId: 'first_wave', desc: 'Dapper holographic engineer top hat. (Unlock: Clear Wave 1 or 25 ◈)' },
    { id: 'captain_visor', name: 'Synthwave Shades', cost: 30, achId: 'pack_leader', desc: 'Dual-tone neon synth shades. (Unlock: Hold 3+ Pets or 30 ◈)' },
    { id: 'cat_ears', name: 'Mecha Cat-Ears', cost: 35, achId: 'pet_synergy', desc: 'Animated cyber-kitty headband! (Unlock: Activate a Pet Synergy or 35 ◈)' },
    { id: 'halo', name: 'Orbital Halo', cost: 40, achId: 'boss_1', desc: 'Levitating golden telemetry halo. (Unlock: Beat Wave 4 Boss or 40 ◈)' },
    { id: 'cursed_horns', name: 'Cursed Void Horns', cost: 45, achId: 'mod_daredevil', desc: 'Crackling purple void horns. (Unlock: Clear W4 with a Modifier or 45 ◈)' },
    { id: 'gold_hardhat', name: 'Golden Foreman Hat', cost: 55, achId: 'mk4_tool', desc: 'Solid gold Mk.IV masterwork hardhat. (Unlock: Forge a Mk.IV tool or 55 ◈)' },
    { id: 'star_crown', name: 'Architect Star Crown', cost: 65, achId: 'win_run', desc: 'Radiant star emblem of the Quantum Architect. (Unlock: Beat Wave 12 or 65 ◈)' },
    { id: 'gold_visor', name: 'Gilded Cargo Visor', cost: 40, achId: 'loot_goblin_slayer', desc: 'Flashy gold-plated bounty hunter visor. (Unlock: Destroy a Golden Cargo-Bot or 40 ◈)' },
    { id: 'wizard', name: 'Void Wizard Hat', cost: 45, achId: 'reactor_surger', desc: 'Star-stitched neon alien sorcerer hat. (Unlock: Trigger a Sub-Floor Reactor Surge or 45 ◈)' },
    { id: 'samurai', name: 'Cyber Kabuto', cost: 60, achId: 'boss_slayer_3', desc: 'Horned neon mecha-samurai helm. (Unlock: Defeat 3 Bosses in one run or 60 ◈)' },
    { id: 'chef', name: 'Master Chef Toque', cost: 35, achId: 'beacon_master', desc: 'Tall crisp cosmic chef hat for cooking builds! (Unlock: Capture an Overclock Beacon or 35 ◈)' }
  ];

  const ACHIEVEMENTS = [
    { id: 'first_wave', name: 'First Shift', desc: 'Complete Wave 1 with any Alien Engineer.', reward: 20, hatId: 'top_hat' },
    { id: 'first_merge', name: 'Prototype Merged', desc: 'Merge two contraptions into a higher Mk tier.', reward: 25 },
    { id: 'mk4_tool', name: 'Masterwork Machine', desc: 'Forge a Mk.IV Legendary contraption.', reward: 60, hatId: 'gold_hardhat' },
    { id: 'synergy_4', name: 'Synergy Specialist', desc: 'Activate a 4-piece Engineering Synergy.', reward: 35 },
    { id: 'synergy_6', name: 'Peak Architecture', desc: 'Activate a 6-piece Engineering Synergy.', reward: 80 },
    { id: 'pack_leader', name: 'Pack Leader', desc: 'Command 3 or more Companion Pets in a single wave.', reward: 35, hatId: 'captain_visor' },
    { id: 'pet_synergy', name: 'Symbiotic Combo', desc: 'Activate any Pet Synergy Combo (Frostfire, Cosmic Fleet, etc.).', reward: 45, hatId: 'cat_ears' },
    { id: 'beacon_master', name: 'Signal Captured', desc: 'Charge an Overclock Beacon Arena Event to 100%!', reward: 40, hatId: 'chef' },
    { id: 'loot_goblin_slayer', name: 'Bounty Collector', desc: 'Destroy a Golden Cargo-Bot before it warps away!', reward: 50, hatId: 'gold_visor' },
    { id: 'reactor_surger', name: 'Grid Overloader', desc: 'Step onto an overloaded Sub-Floor Reactor Hub during a Power Surge!', reward: 40, hatId: 'wizard' },
    { id: 'event_hunter', name: 'Field Specialist', desc: 'Complete 3 Live Arena Events in a single run!', reward: 65 },
    { id: 'neon_forester', name: 'Neon Forester', desc: 'Clear Wave 4 inside the Neon Alien Forest biome.', reward: 40 },
    { id: 'mod_daredevil', name: 'Mutator Daredevil', desc: 'Clear Wave 4+ with at least 1 Run Modifier active.', reward: 55, hatId: 'cursed_horns' },
    { id: 'boss_1', name: 'Excavator Scrapped', desc: 'Defeat the MK-IX Core Excavator (Wave 4).', reward: 40, hatId: 'halo' },
    { id: 'boss_2', name: 'Magma Cooled', desc: 'Defeat the Pyroclast Matriarch (Wave 8).', reward: 65 },
    { id: 'boss_slayer_3', name: 'Titan Hunter', desc: 'Defeat 3 Bosses in a single expedition!', reward: 95, hatId: 'samurai' },
    { id: 'win_run', name: 'Core Architect', desc: 'Defeat The Quantum Architect & clear Wave 12!', reward: 120, hatId: 'star_crown' },
    { id: 'hazard_5_win', name: 'Meltdown Survivor', desc: 'Clear Wave 12 on Hazard 5 — Quantum Meltdown!', reward: 200 },
    { id: 'endless_15', name: 'Into The Abyss', desc: 'Reach Wave 15 in Endless Overdrive.', reward: 100 },
    { id: 'endless_20', name: 'Infinite Overdrive', desc: 'Reach Wave 20 in Endless Overdrive.', reward: 160 },
    { id: 'kills_500', name: 'Swarm Control', desc: 'Eliminate 500 total enemies across runs.', reward: 40 },
    { id: 'kills_2500', name: 'Cavern Cleaner', desc: 'Eliminate 2,500 total enemies across runs.', reward: 90 },
    { id: 'kills_10000', name: 'Galactic Exterminator', desc: 'Eliminate 10,000 total enemies across all runs.', reward: 150 },
    { id: 'three_engineers', name: 'Multi-Disciplinary', desc: 'Complete runs (Wave 4+) with 3 different Engineers.', reward: 60 }
  ];

  function defaultSave() {
    return {
      shards: 40,
      ranks: {},
      maxHazardUnlocked: 5,
      selectedHazard: 1,
      selectedChar: 'nasa',
      selectedBiome: 'auto',
      selectedModifiers: [],
      selectedHat: 'none',
      unlockedHats: { none: true, neon_crown: true, mushroom_cap: true },
      unlockedChars: {},
      dailyBestWave: {},
      dailyCleared: {},
      prefs: { screenShake: true, damageNumbers: true },
      totalKills: 0,
      totalRuns: 0,
      bestWave: 0,
      charBestWave: {},
      charBestHazard: {},
      charBestEndless: {},
      charBestDamage: {},
      charWins: {},
      achievements: {},
      mouseFollow: false
    };
  }

  let data = defaultSave();

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        data = Object.assign(defaultSave(), parsed);
        data.maxHazardUnlocked = 5;
        data.ranks = data.ranks || {};
        data.charBestWave = data.charBestWave || {};
        data.charBestHazard = data.charBestHazard || {};
        data.charBestEndless = data.charBestEndless || {};
        data.charBestDamage = data.charBestDamage || {};
        data.charWins = data.charWins || {};
        data.achievements = data.achievements || {};
        data.selectedModifiers = Array.isArray(data.selectedModifiers) ? data.selectedModifiers : [];
        data.selectedBiome = data.selectedBiome || 'auto';
        data.selectedHat = data.selectedHat || 'none';
        data.unlockedHats = Object.assign({ none: true, neon_crown: true, mushroom_cap: true }, data.unlockedHats || {});
        data.unlockedChars = data.unlockedChars || {};
        data.dailyBestWave = data.dailyBestWave || {};
        data.dailyCleared = data.dailyCleared || {};
        data.prefs = Object.assign({ screenShake: true, damageNumbers: true }, data.prefs || {});
        // Sync any hats already earned via achievements
        HATS.forEach((h) => {
          if (h.free || (h.achId && data.achievements[h.achId])) {
            data.unlockedHats[h.id] = true;
          }
        });
      }
    } catch (e) {
      data = defaultSave();
    }
    return data;
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function getRank(id) {
    return data.ranks[id] || 0;
  }

  function getUpgradeCost(upg) {
    const r = getRank(upg.id);
    return Math.round(upg.baseCost * Math.pow(1.65, r));
  }

  function buyLabUpgrade(id) {
    const upg = LAB_UPGRADES.find((u) => u.id === id);
    if (!upg) return false;
    const r = getRank(id);
    if (r >= upg.maxRank) return false;
    const cost = getUpgradeCost(upg);
    if (data.shards < cost) return false;
    data.shards -= cost;
    data.ranks[id] = r + 1;
    save();
    return true;
  }

  function getLabBonuses() {
    const b = {
      maxHp: 0,
      engineering: 0,
      damagePct: 0,
      speedPct: 0,
      scrapPct: 0,
      startScrap: 0,
      magnet: 0,
      luck: 0
    };
    LAB_UPGRADES.forEach((u) => {
      const r = getRank(u.id);
      if (r > 0) {
        Object.keys(u.perRank).forEach((k) => {
          b[k] = (b[k] || 0) + u.perRank[k] * r;
        });
      }
    });
    return b;
  }

  function isHatUnlocked(id) {
    const h = HATS.find((x) => x.id === id);
    if (!h) return false;
    return !!(h.free || data.unlockedHats[id] || (h.achId && data.achievements[h.achId]));
  }

  function equipHat(id) {
    if (!isHatUnlocked(id)) return false;
    data.selectedHat = id;
    save();
    return true;
  }

  function buyHat(id) {
    const h = HATS.find((x) => x.id === id);
    if (!h) return false;
    if (isHatUnlocked(id)) {
      data.selectedHat = id;
      save();
      return true;
    }
    if (data.shards < h.cost) return false;
    data.shards -= h.cost;
    data.unlockedHats[id] = true;
    data.selectedHat = id;
    save();
    return true;
  }

  function unlockAchievement(id) {
    if (data.achievements[id]) return null;
    const ach = ACHIEVEMENTS.find((a) => a.id === id);
    if (!ach) return null;
    data.achievements[id] = true;
    data.shards += ach.reward;
    if (ach.hatId) {
      data.unlockedHats[ach.hatId] = true;
    }
    save();
    return ach;
  }

  function recordRunProgress({ charId, wave, kills, won, hazard, totalDamage = 0, endless = false }) {
    data.totalRuns = (data.totalRuns || 0) + 1;
    data.totalKills += kills;
    if (wave > data.bestWave) data.bestWave = wave;
    if (wave > (data.charBestWave[charId] || 0)) {
      data.charBestWave[charId] = wave;
    }
    if (endless && wave > (data.charBestEndless[charId] || 0)) {
      data.charBestEndless[charId] = wave;
    }
    if (totalDamage > (data.charBestDamage[charId] || 0)) {
      data.charBestDamage[charId] = Math.round(totalDamage);
    }
    if (won) {
      data.charWins[charId] = (data.charWins[charId] || 0) + 1;
      if (hazard > (data.charBestHazard[charId] || 0)) {
        data.charBestHazard[charId] = hazard;
      }
      if (hazard >= data.maxHazardUnlocked && data.maxHazardUnlocked < 5) {
        data.maxHazardUnlocked = Math.min(5, hazard + 1);
      }
    }
    const unlocked = [];
    if (won && hazard >= 5) { const a = unlockAchievement('hazard_5_win'); if (a) unlocked.push(a); }
    if (data.totalKills >= 500) { const a = unlockAchievement('kills_500'); if (a) unlocked.push(a); }
    if (data.totalKills >= 2500) { const a = unlockAchievement('kills_2500'); if (a) unlocked.push(a); }
    if (data.totalKills >= 10000) { const a = unlockAchievement('kills_10000'); if (a) unlocked.push(a); }
    const charsReached4 = Object.values(data.charBestWave).filter((w) => w >= 4).length;
    if (charsReached4 >= 3) { const a = unlockAchievement('three_engineers'); if (a) unlocked.push(a); }
    save();
    return unlocked;
  }

  function getModifierShardMult(mods) {
    const list = Array.isArray(mods) ? mods : (data.selectedModifiers || []);
    let mult = 1;
    (window.MM.MODIFIERS || []).forEach((m) => {
      if (list.includes(m.id)) mult += m.shardBonus;
    });
    return mult;
  }

  const PRACTICE_COST = 150;

  function isCharUnlocked(id) {
    const c = window.MM.getCharacter ? window.MM.getCharacter(id) : null;
    if (!c) return false;
    if (!c.lockedByDefault) return true;
    return !!(data.unlockedChars && data.unlockedChars[id]);
  }

  function unlockChar(id) {
    const c = window.MM.getCharacter ? window.MM.getCharacter(id) : null;
    if (!c) return false;
    if (isCharUnlocked(id)) return true;
    const cost = c.unlockCost || 300;
    if (data.shards < cost) return false;
    data.shards -= cost;
    data.unlockedChars[id] = true;
    save();
    return true;
  }

  function canPracticeChar(id) {
    const c = window.MM.getCharacter ? window.MM.getCharacter(id) : null;
    if (!c) return false;
    // STRICT RULE: Once a character is unlocked, you CANNOT use them in the Practice menu!
    return !isCharUnlocked(id);
  }

  function payPracticeFee(id) {
    if (!canPracticeChar(id)) return false;
    if (data.shards < PRACTICE_COST) return false;
    data.shards -= PRACTICE_COST;
    save();
    return true;
  }

  function getLockedChars() {
    return (window.MM.CHARACTERS || []).filter((c) => !isCharUnlocked(c.id));
  }

  load();

  window.MM.Meta = {
    LAB_UPGRADES,
    HATS,
    ACHIEVEMENTS,
    PRACTICE_COST,
    get: () => data,
    save,
    getRank,
    getUpgradeCost,
    buyLabUpgrade,
    getLabBonuses,
    isHatUnlocked,
    equipHat,
    buyHat,
    isCharUnlocked,
    unlockChar,
    canPracticeChar,
    payPracticeFee,
    getLockedChars,
    unlockAchievement,
    recordRunProgress,
    getModifierShardMult,
    addShards(n) {
      data.shards += Math.max(0, Math.round(n));
      save();
    },
    setSelectedChar(id) {
      data.selectedChar = id;
      save();
    },
    setSelectedHazard(h) {
      data.selectedHazard = Math.max(1, Math.min(data.maxHazardUnlocked, h));
      save();
    },
    setSelectedBiome(id) {
      data.selectedBiome = id || 'auto';
      save();
    },
    getPrefs() {
      return data.prefs || { screenShake: true, damageNumbers: true };
    },
    togglePref(key) {
      data.prefs = Object.assign({ screenShake: true, damageNumbers: true }, data.prefs || {});
      data.prefs[key] = !data.prefs[key];
      save();
      return data.prefs[key];
    },
    recordDailyProgress(dateKey, wave, won) {
      if (!dateKey) return;
      data.dailyBestWave = data.dailyBestWave || {};
      data.dailyCleared = data.dailyCleared || {};
      if (wave > (data.dailyBestWave[dateKey] || 0)) data.dailyBestWave[dateKey] = wave;
      if (won) data.dailyCleared[dateKey] = true;
      save();
    },
    toggleModifier(id) {
      const idx = data.selectedModifiers.indexOf(id);
      if (idx >= 0) data.selectedModifiers.splice(idx, 1);
      else data.selectedModifiers.push(id);
      save();
    }
  };
})();
