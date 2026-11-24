// ============================================================================
// MULTI-MINE — Balanced Mid-Tone Flat-Vector Biomes, Enemies, Bosses & Waves
// ============================================================================
window.MM = window.MM || {};

(function () {
  // Sleek, cohesive flat-vector Sci-Fi Facility palettes (Option C: Sub-Floor Tech Grid)
  const BIOMES = [
    {
      id: 'neon_forest',
      shortName: 'Neon Forest',
      icon: '🌿',
      name: 'Sector 0 — Neon Alien Forest',
      outer: '#1C2A2A',
      bg: '#6F7F57',
      tile: '#56653F',
      tileBorder: 'rgba(95, 227, 184, 0.18)',
      grid: 'rgba(27, 30, 37, 0.10)',
      conduit: '#22383A',
      wall: '#33403F',
      wallInner: '#141C1D',
      wallAccent: '#5FE3B8',
      accent: '#5FE3B8',
      secondaryAccent: '#E879F9',
      speck: 'rgba(200, 255, 230, 0.22)',
      rim: 'chasm',
      props: ['prop:neon_shroom', 'prop:neon_fern', 'prop:crystal_mint']
    },
    {
      id: 'asteroid',
      shortName: 'Quarry',
      icon: '⛏',
      name: 'Sector I — Quarry Foundry',
      outer: '#2B2528',
      bg: '#C49A6C',
      tile: '#A57A4E',
      tileBorder: 'rgba(255, 194, 51, 0.18)',
      grid: 'rgba(27, 30, 37, 0.10)',
      conduit: '#6E4A2E',
      wall: '#5B5560',
      wallInner: '#1B1719',
      wallAccent: '#FFC233',
      accent: '#FFC233',
      secondaryAccent: '#5EC8F2',
      speck: 'rgba(255, 230, 190, 0.25)',
      rim: 'chasm',
      props: ['prop:crystal_mint', 'prop:conveyor', 'prop:drill_rig']
    },
    {
      id: 'magma',
      shortName: 'Magma Core',
      icon: '🌋',
      name: 'Sector II — Volcano Caldera',
      outer: '#231A1A',
      bg: '#6B4B3C',
      tile: '#54382C',
      tileBorder: 'rgba(255, 106, 31, 0.2)',
      grid: 'rgba(27, 30, 37, 0.12)',
      conduit: '#2E2020',
      wall: '#3F3236',
      wallInner: '#160F0F',
      wallAccent: '#FF6A1F',
      accent: '#FF6A1F',
      secondaryAccent: '#FFC233',
      speck: 'rgba(255, 190, 120, 0.2)',
      rim: 'lava',
      props: ['prop:volcano', 'prop:volcano', 'prop:drill_rig']
    },
    {
      id: 'cryo',
      shortName: 'Cryo Cavern',
      icon: '❄',
      name: 'Sector III — Cryo Glacier Lab',
      outer: '#1E2C3A',
      bg: '#A3B8BA',
      tile: '#869EA3',
      tileBorder: 'rgba(125, 211, 252, 0.25)',
      grid: 'rgba(27, 30, 37, 0.08)',
      conduit: '#4F6F8A',
      wall: '#5D7488',
      wallInner: '#121C26',
      wallAccent: '#7DD3FC',
      accent: '#7DD3FC',
      secondaryAccent: '#FFFFFF',
      speck: 'rgba(255, 255, 255, 0.35)',
      rim: 'ice',
      props: ['prop:crystal_ice', 'prop:crystal_ice', 'prop:conveyor']
    },
    {
      id: 'quantum',
      shortName: 'Quantum Spire',
      icon: '⚛',
      name: 'Sector IV — Quantum Spire',
      outer: '#1A1529',
      bg: '#5E5070',
      tile: '#493C5A',
      tileBorder: 'rgba(192, 132, 252, 0.2)',
      grid: 'rgba(27, 30, 37, 0.12)',
      conduit: '#2A2240',
      wall: '#3A3150',
      wallInner: '#0E0B1B',
      wallAccent: '#C084FC',
      accent: '#C084FC',
      secondaryAccent: '#4FD1A5',
      speck: 'rgba(216, 200, 255, 0.25)',
      rim: 'void',
      props: ['prop:quantum_cube', 'prop:quantum_cube', 'prop:crystal_mint']
    }
  ];

  // Toggleable Run Modifiers (Mutators) for Endless & Custom Challenge Runs!
  const MODIFIERS = [
    {
      id: 'turbo',
      name: 'Turbo Speed',
      icon: '⚡',
      color: '#FFD466',
      shardBonus: 0.25,
      desc: '+28% Game Speed — faster waves, faster action! (+25% Shards)'
    },
    {
      id: 'double_boss',
      name: 'Double Bosses',
      icon: '☠',
      color: '#F05656',
      shardBonus: 0.40,
      desc: '2× Bosses & 2× Elites spawn simultaneously! (+40% Shards)'
    },
    {
      id: 'all_cursed',
      name: 'All Cursed',
      icon: '🟣',
      color: '#C084FC',
      shardBonus: 0.50,
      desc: 'Every enemy & every shop offer is Cursed! High risk, huge power. (+50% Shards)'
    },
    {
      id: 'pet_frenzy',
      name: 'Pet Frenzy',
      icon: '🐾',
      color: '#34F5C5',
      shardBonus: 0.15,
      desc: '+1 Guaranteed Pet every shop & +25% Pet Speed! (+15% Shards)'
    },
    {
      id: 'glass_cannon',
      name: 'Glass Cannon',
      icon: '💀',
      color: '#FF7D7D',
      shardBonus: 0.30,
      desc: '+75% All Damage, -40% Max HP! Pure dodge intensity. (+30% Shards)'
    },
    {
      id: 'event_frenzy',
      name: 'Event Frenzy',
      icon: '📡',
      color: '#34F5C5',
      shardBonus: 0.20,
      desc: '2× Live Arena Events every wave (double Beacons, Loot Goblins & Reactor Surges)! (+20% Shards)'
    },
    {
      id: 'fast_escalation',
      name: 'High Stakes',
      icon: '🎲',
      color: '#6EA5FF',
      shardBonus: 0.30,
      desc: '+1 Free Reroll per shop & +20 Luck — BUT Enemies gain +30% Max HP! (+30% Shards)'
    },
    {
      id: 'blood_harvest',
      name: 'Blood Harvest',
      icon: '🩸',
      color: '#F43F5E',
      shardBonus: 0.35,
      desc: '+15% Life Steal & +20% Damage — BUT HP Regen is disabled (0/s)! (+35% Shards)'
    }
  ];

  // Pet Command & Synergy Combos (pets automatically combo off each other!)
  const PET_SYNERGIES = [
    {
      id: 'frostfire',
      name: 'Frostfire Reaction',
      icon: '🔥❄',
      color: '#60EFFF',
      reqPets: ['frost_pup', 'blazemander'],
      desc: 'Cryo-Robo Pup + Blazemander: Chilled + Burning foes erupt in a massive FROSTFIRE DETONATION!'
    },
    {
      id: 'swarm_aura',
      name: 'Swarm Aura',
      icon: '🐾',
      color: '#34F5C5',
      minPets: 3,
      alphaPets: 5,
      desc: '3+ Pets: +22% Pet Attack Speed & +18% Speed. 5+ Pets (Alpha Pack): +45% Pet Damage, +35% Speed & neon pack auras!'
    },
    {
      id: 'shock_acid',
      name: 'Shock-Acid Overload',
      icon: '⚡🧪',
      color: '#A78BFA',
      reqAny: [['volt_ferret'], ['mine_crab', 'slime_cube']],
      desc: 'Volt-Ferret + (Sap-Crab or Salvager): Chain lightning gains +2 extra jumps & +40% bonus shock damage!'
    },
    {
      id: 'apex_predators',
      name: 'Apex Predators',
      icon: '🦖🔫',
      color: '#FFD466',
      reqPets: ['catling', 'mech_rex'],
      desc: 'Catling Gun + Mini Mecha-Rex: Every 7s both surge into Overclock Barrage (+60% fire & stomp speed for 3s)!'
    },
    {
      id: 'scavenger_syndicate',
      name: 'Scavenger Syndicate',
      icon: '💎🐝',
      color: '#66E2A5',
      reqAny: [['loot_worm'], ['medic_bee', 'void_owl']],
      desc: 'Loot Worm + (Nano-Bumblebot or Quantum Owl): +20% Scrap drops & Loot Worm spits bonus +5 HP neon berries!'
    },
    {
      id: 'void_hunters',
      name: 'Void Hunters',
      icon: '🌌🦗',
      color: '#E84BFF',
      reqAny: [['laser_mantis'], ['grav_jelly', 'void_owl']],
      desc: 'Laser Mantis + (Gravity Jelly or Quantum Owl): Mantis deals +45% dmg to slowed foes & grants +3% Ult Charge on strikes!'
    },
    {
      id: 'cosmic_fleet',
      name: 'Cosmic Fleet',
      icon: '🛸🌌',
      color: '#60EFFF',
      reqAny: [['mini_ufo'], ['void_owl', 'plasma_jelly']],
      desc: 'Saucer Scout + (Quantum Owl or Nebula Jellyfish): Orbital Pets fire twin lasers & grant +20% faster Ultimate Charge!'
    },
    {
      id: 'iron_shell',
      name: 'Iron Shell Pack',
      icon: '🐢🦀',
      color: '#FF9E64',
      reqAny: [['magma_turtle'], ['mine_crab', 'loot_worm']],
      desc: 'Magma Tortoise + (Sap-Crab or Loot Worm): +5 Armor, +18 Max HP & Tortoise unleashes a huge counter-quake whenever you take damage!'
    }
  ];

  // Deterministic Daily Challenge Generator (same seed for everyone each calendar day!)
  function getDailyChallenge() {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    let h = 2166136261;
    for (let i = 0; i < key.length; i++) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const nextRand = () => {
      h += 0x6D2B79F5;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const poolChars = (window.MM.CHARACTERS || []).filter((c) => !c.lockedByDefault);
    const charObj = poolChars.length ? poolChars[Math.floor(nextRand() * poolChars.length)] : { id: 'nasa', name: 'Zorp' };
    const biomeObj = BIOMES[Math.floor(nextRand() * BIOMES.length)];
    const hazard = 2 + Math.floor(nextRand() * 3); // Hazard 2, 3, or 4
    const modPool = [...MODIFIERS];
    const m1 = modPool.splice(Math.floor(nextRand() * modPool.length), 1)[0];
    const m2 = modPool.splice(Math.floor(nextRand() * modPool.length), 1)[0];
    return {
      dateKey: key,
      charId: charObj.id,
      charName: charObj.name,
      biomeId: biomeObj.id,
      biomeName: biomeObj.shortName || biomeObj.name,
      hazard,
      modifiers: [m1.id, m2.id],
      modLabels: [`${m1.icon} ${m1.name}`, `${m2.icon} ${m2.name}`],
      shardBonusMult: 2.0
    };
  }

  function getBiomeById(id) {
    return BIOMES.find((b) => b.id === id) || null;
  }

  function getBiomeForWave(wave, biomeOverride = 'auto') {
    if (biomeOverride && biomeOverride !== 'auto') {
      const custom = getBiomeById(biomeOverride);
      if (custom) return custom;
    }
    const w = ((wave - 1) % 12) + 1;
    if (w <= 2) return BIOMES[0]; // Neon Alien Forest
    if (w <= 4) return BIOMES[1]; // Quarry Foundry
    if (w <= 6) return BIOMES[2]; // Volcano Caldera
    if (w <= 9) return BIOMES[3]; // Cryo Glacier Lab
    return BIOMES[4];             // Quantum Spire
  }

  const HAZARDS = [
    { level: 1, name: 'Hazard 1 — Active Excavation', hpMult: 1.0, dmgMult: 1.0, countMult: 1.05, shardMult: 1.0, desc: 'Brotato-tuned tension — stay mobile, build Armor/Sustain & dodge!' },
    { level: 2, name: 'Hazard 2 — Deep Seam', hpMult: 1.32, dmgMult: 1.22, countMult: 1.18, shardMult: 1.4, desc: '+32% Enemy HP, +22% Damage, denser swarms, +40% Core Shards.' },
    { level: 3, name: 'Hazard 3 — Seismic Alert', hpMult: 1.68, dmgMult: 1.46, countMult: 1.32, shardMult: 1.85, desc: '+68% Enemy HP, +46% Damage, relentless packs, +85% Core Shards.' },
    { level: 4, name: 'Hazard 4 — Core Breach', hpMult: 2.15, dmgMult: 1.72, countMult: 1.46, shardMult: 2.4, desc: '+115% Enemy HP, +72% Damage, +140% Core Shards.' },
    { level: 5, name: 'Hazard 5 — Quantum Meltdown', hpMult: 2.75, dmgMult: 2.05, countMult: 1.62, shardMult: 3.3, desc: 'True Brotato Danger 5 nightmare! +230% Core Shards.' }
  ];

  const ENEMIES = {
    scrap_mite: {
      id: 'scrap_mite',
      name: 'Scrap Mite',
      hp: 34,
      speed: 164,
      damage: 12,
      radius: 16,
      scrap: 1,
      xp: 4,
      behavior: 'chase'
    },
    geode_brute: {
      id: 'geode_brute',
      name: 'Geode Brute',
      hp: 118,
      speed: 102,
      damage: 19,
      radius: 23,
      scrap: 3,
      xp: 10,
      armor: 3,
      behavior: 'chase'
    },
    bore_charger: {
      id: 'bore_charger',
      name: 'Bore Charger',
      hp: 82,
      speed: 128,
      damage: 20,
      radius: 19,
      scrap: 2,
      xp: 8,
      behavior: 'charger'
    },
    acid_pod: {
      id: 'acid_pod',
      name: 'Acid Spitter Pod',
      hp: 58,
      speed: 108,
      damage: 15,
      radius: 18,
      scrap: 2,
      xp: 7,
      behavior: 'spitter'
    },
    shield_drone: {
      id: 'shield_drone',
      name: 'Shield Drone',
      hp: 108,
      speed: 142,
      damage: 16,
      radius: 20,
      scrap: 3,
      xp: 9,
      armor: 4,
      behavior: 'chase'
    },
    magma_slime: {
      id: 'magma_slime',
      name: 'Magma Slime',
      hp: 96,
      speed: 118,
      damage: 17,
      radius: 21,
      scrap: 2,
      xp: 8,
      behavior: 'splitter'
    },
    mini_cinder: {
      id: 'mini_cinder',
      name: 'Mini Cinder',
      hp: 28,
      speed: 195,
      damage: 12,
      radius: 13,
      scrap: 1,
      xp: 3,
      behavior: 'chase'
    },
    cryo_beetle: {
      id: 'cryo_beetle',
      name: 'Cryo Beetle',
      hp: 115,
      speed: 126,
      damage: 17,
      radius: 20,
      scrap: 3,
      xp: 10,
      behavior: 'cryo_spitter'
    },
    quantum_stalker: {
      id: 'quantum_stalker',
      name: 'Quantum Stalker',
      hp: 98,
      speed: 156,
      damage: 20,
      radius: 19,
      scrap: 3,
      xp: 11,
      behavior: 'blinker'
    },

    // 6 BRAND-NEW ENEMY TYPES & ELITE MINI-BOSS!
    laser_sentinel: {
      id: 'laser_sentinel',
      name: 'Prism Sniper',
      hp: 84,
      speed: 102,
      damage: 22,
      radius: 19,
      scrap: 3,
      xp: 10,
      behavior: 'sniper'
    },
    shield_golem: {
      id: 'shield_golem',
      name: 'Aegis Crusher',
      hp: 185,
      speed: 96,
      damage: 22,
      radius: 25,
      scrap: 4,
      xp: 13,
      armor: 6,
      behavior: 'golem'
    },
    swarm_brooder: {
      id: 'swarm_brooder',
      name: 'Hive Brooder',
      hp: 152,
      speed: 88,
      damage: 17,
      radius: 24,
      scrap: 4,
      xp: 12,
      behavior: 'brooder'
    },
    mortar_crab: {
      id: 'mortar_crab',
      name: 'Artillery Crawler',
      hp: 102,
      speed: 102,
      damage: 20,
      radius: 21,
      scrap: 3,
      xp: 11,
      behavior: 'mortar'
    },
    vortex_wisp: {
      id: 'vortex_wisp',
      name: 'Gravity Phantom',
      hp: 88,
      speed: 176,
      damage: 18,
      radius: 18,
      scrap: 3,
      xp: 10,
      behavior: 'wisp'
    },
    void_weaver: {
      id: 'void_weaver',
      name: 'Void Weaver',
      hp: 138,
      speed: 112,
      damage: 21,
      radius: 22,
      scrap: 4,
      xp: 14,
      behavior: 'weaver'
    },
    loot_goblin: {
      id: 'loot_goblin',
      name: 'GOLDEN CARGO-BOT',
      hp: 210,
      speed: 205,
      damage: 6,
      radius: 24,
      scrap: 22,
      xp: 30,
      isLootGoblin: true,
      behavior: 'loot_goblin'
    },
    elite_dreadnought: {
      id: 'elite_dreadnought',
      name: 'ELITE DREADNOUGHT',
      isElite: true,
      hp: 720,
      speed: 132,
      damage: 24,
      radius: 33,
      scrap: 14,
      xp: 38,
      armor: 5,
      behavior: 'elite_dreadnought'
    },

    // BOSSES
    boss_excavator: {
      id: 'boss_excavator',
      name: 'MK-IX CORE EXCAVATOR',
      isBoss: true,
      hp: 2100,
      speed: 122,
      damage: 26,
      radius: 44,
      scrap: 28,
      xp: 65,
      armor: 6,
      behavior: 'boss_excavator'
    },
    boss_pyroclast: {
      id: 'boss_pyroclast',
      name: 'PYROCLAST MATRIARCH',
      isBoss: true,
      hp: 3400,
      speed: 112,
      damage: 32,
      radius: 48,
      scrap: 42,
      xp: 105,
      armor: 8,
      behavior: 'boss_pyroclast'
    },
    boss_quantum: {
      id: 'boss_quantum',
      name: 'THE QUANTUM ARCHITECT',
      isBoss: true,
      hp: 5000,
      speed: 126,
      damage: 36,
      radius: 50,
      scrap: 65,
      xp: 165,
      armor: 10,
      behavior: 'boss_quantum'
    }
  };

  function getWaveConfig(wave, biomeOverride = 'auto') {
    const duration = wave <= 3 ? 28 + wave * 4 : Math.min(60, 36 + wave * 2);
    const baseSpawnRate = Math.max(0.16, 0.80 - wave * 0.052);
    let pool = ['scrap_mite'];
    let boss = null;
    let secondBoss = null;
    let elite = null;
    let isHorde = false;
    let subtitle = '';

    // Enemy roster ladder: one new enemy type per wave, introduced rare (a
    // single pool entry) and growing more common later, while the easiest
    // types fade out. Repeated ids in a pool act as spawn weights.
    const W = (spec) => Object.entries(spec).flatMap(([id, n]) => Array(n).fill(id));
    if (wave === 1) {
      pool = W({ scrap_mite: 5, geode_brute: 1 });
      subtitle = 'Scrap Mites & Geode Brutes — keep moving and collect Scrap!';
    } else if (wave === 2) {
      pool = W({ scrap_mite: 4, geode_brute: 2, acid_pod: 1 });
      subtitle = 'NEW: Acid Pods spit from range — sidestep the shots!';
    } else if (wave === 3) {
      pool = W({ scrap_mite: 3, geode_brute: 2, acid_pod: 2, bore_charger: 1 });
      subtitle = 'NEW: Bore Chargers — dodge sideways off the red line!';
    } else if (wave === 4) {
      pool = W({ scrap_mite: 3, geode_brute: 2, acid_pod: 1, bore_charger: 2 });
      boss = 'boss_excavator';
      subtitle = 'BOSS ALERT: MK-IX Core Excavator (2-Phase Fight)!';
    } else if (wave === 5) {
      pool = W({ scrap_mite: 2, geode_brute: 2, acid_pod: 2, bore_charger: 2, mortar_crab: 1, shield_drone: 1 });
      elite = 'elite_dreadnought';
      subtitle = 'NEW: Mortar Crabs & Shield Drones — plus an Elite Dreadnought!';
    } else if (wave === 6) {
      pool = W({ scrap_mite: 4, geode_brute: 2, bore_charger: 2, magma_slime: 2, swarm_brooder: 1 });
      isHorde = true;
      subtitle = 'HORDE WAVE! NEW: Magma Slimes & Swarm Brooders!';
    } else if (wave === 7) {
      pool = W({ geode_brute: 2, bore_charger: 2, magma_slime: 2, mortar_crab: 2, shield_drone: 2, cryo_beetle: 1, laser_sentinel: 1 });
      elite = 'elite_dreadnought';
      subtitle = 'NEW: Cryo Beetles & Laser Sentinels — plus an Elite Dreadnought!';
    } else if (wave === 8) {
      pool = W({ bore_charger: 2, magma_slime: 2, mortar_crab: 2, cryo_beetle: 2, laser_sentinel: 1, shield_golem: 1 });
      boss = 'boss_pyroclast';
      subtitle = 'BOSS ALERT: Pyroclast Matriarch! NEW: Shield Golems!';
    } else if (wave === 9) {
      pool = W({ magma_slime: 2, cryo_beetle: 2, laser_sentinel: 2, shield_golem: 2, swarm_brooder: 1, vortex_wisp: 1 });
      elite = 'elite_dreadnought';
      subtitle = 'NEW: Vortex Wisps pull you in — plus an Elite Dreadnought!';
    } else if (wave === 10) {
      pool = W({ scrap_mite: 3, cryo_beetle: 2, shield_golem: 1, swarm_brooder: 2, vortex_wisp: 2, void_weaver: 1, quantum_stalker: 1 });
      isHorde = true;
      subtitle = 'QUANTUM HORDE! NEW: Void Weavers & Quantum Stalkers!';
    } else if (wave === 11) {
      pool = W({ quantum_stalker: 2, laser_sentinel: 2, shield_golem: 2, mortar_crab: 2, vortex_wisp: 2, void_weaver: 2 });
      elite = 'elite_dreadnought';
      subtitle = 'ELITE PERIMETER BREACH — Final prep before the Architect!';
    } else if (wave === 12) {
      pool = W({ quantum_stalker: 2, shield_drone: 2, laser_sentinel: 2, vortex_wisp: 2, void_weaver: 2 });
      boss = 'boss_quantum';
      subtitle = 'FINAL BOSS: The Quantum Architect (2-Phase Showdown)!';
    } else {
      pool = ['scrap_mite', 'geode_brute', 'bore_charger', 'acid_pod', 'shield_drone', 'magma_slime', 'cryo_beetle', 'quantum_stalker', 'laser_sentinel', 'shield_golem', 'swarm_brooder', 'mortar_crab', 'vortex_wisp', 'void_weaver'];
      const bosses = ['boss_excavator', 'boss_pyroclast', 'boss_quantum'];
      if (wave % 5 === 0) {
        const idx1 = Math.floor((wave / 5) % bosses.length);
        const idx2 = (idx1 + 1) % bosses.length;
        boss = bosses[idx1];
        secondBoss = bosses[idx2];
        subtitle = `ENDLESS DOUBLE BOSS — Depth ${wave}! Survive twin titans!`;
      } else if (wave % 3 === 0) {
        elite = 'elite_dreadnought';
        subtitle = `ENDLESS ELITE SURGE — Depth ${wave}!`;
      } else if (wave % 2 === 0) {
        isHorde = true;
        subtitle = `ENDLESS HORDE OVERDRIVE — Depth ${wave}!`;
      } else {
        subtitle = `ENDLESS OVERDRIVE — Depth ${wave}`;
      }
    }

    return {
      wave,
      duration,
      spawnInterval: isHorde ? baseSpawnRate * 0.72 : baseSpawnRate,
      pool,
      boss,
      secondBoss,
      elite,
      isHorde,
      subtitle,
      biome: getBiomeForWave(wave, biomeOverride)
    };
  }

  window.MM.BIOMES = BIOMES;
  window.MM.MODIFIERS = MODIFIERS;
  window.MM.PET_SYNERGIES = PET_SYNERGIES;
  window.MM.HAZARDS = HAZARDS;
  window.MM.ENEMIES = ENEMIES;
  window.MM.getBiomeById = getBiomeById;
  window.MM.getBiomeForWave = getBiomeForWave;
  window.MM.getWaveConfig = getWaveConfig;
  window.MM.getDailyChallenge = getDailyChallenge;
})();
