// ============================================================================
// MULTI-MINE — 14 Playable Alien Engineers with Bold Brotato Pros & Cons
// ============================================================================
window.MM = window.MM || {};

window.MM.CHARACTERS = [
  {
    id: 'nasa',
    name: 'Zorp',
    title: 'NASA Orbital Engineer',
    accent: '#6EA5FF',
    startTool: 'orbital_sat',
    tags: ['ORBITAL', 'VOLTAIC'],
    bio: 'Zero-G orbital specialist — dominates with Satellites & Guns, fragile up close.',
    passiveName: 'Zero-G Telemetry',
    pros: [
      '+40% damage on 🛰 Orbital-tag weapons & Orbiters spin 40% faster',
      '+20% damage on 🔫 Guns & +15% Move Speed',
      '+35 Pickup Magnet'
    ],
    cons: [
      '-20 Max HP & -35% damage on 💣 Mines-tag and 🤖 Robotics-tag weapons',
      'Armor upgrades are 30% less effective'
    ],
    ultimate: { id: 'orbital_barrage', name: 'Orbital Ion Barrage', desc: 'Calls down 7 piercing orbital ion sky-lasers across the arena!' },
    stats: {
      maxHp: 80, hpRegen: 0.4, armor: 0, speed: 256, damagePct: 0, engineering: 5,
      attackSpeedPct: 8, critChance: 8, areaPct: 10, magnet: 155, luck: 5, scrapPct: 0, dashCd: 2.1
    },
    perks: { orbitalSpeedMult: 1.4, orbitalRadiusBonus: 22, orbitalDmgMult: 1.4, gunDmgMult: 1.2, mineDmgMult: 0.65, roboticsDmgMult: 0.65, armorGainMult: 0.7 }
  },
  {
    id: 'volcano',
    name: 'Krak',
    title: 'Volcano Seismologist',
    accent: '#F05656',
    startTool: 'magma_vent',
    tags: ['THERMAL', 'MINES'],
    bio: 'Molten pyromancer who melts swarms with Thermal weapons & chain eruptions.',
    passiveName: 'Pyroclastic Surge',
    pros: [
      '+45% damage on 🔥 Thermal-tag weapons (burns included)',
      'Burning enemies explode on death',
      '+20% Blast AoE & +10 Max HP'
    ],
    cons: [
      '-30% damage on ⚡ Voltaic-tag and 🛰 Orbital-tag weapons',
      '-10% Attack Speed on weapons without the 🔥 Thermal tag'
    ],
    ultimate: { id: 'caldera_eruption', name: 'Supervolcano Eruption', desc: 'Spawns 5 erupting mini-volcanoes & ignites every enemy nearby!' },
    stats: {
      maxHp: 110, hpRegen: 0.7, armor: 2, speed: 226, damagePct: 0, engineering: 6,
      attackSpeedPct: 0, critChance: 5, areaPct: 20, magnet: 115, luck: 0, scrapPct: 0, dashCd: 2.45
    },
    perks: { thermalMult: 1.45, burnExplode: true, voltaicDmgMult: 0.7, orbitalDmgMult: 0.7, nonThermalAspdPenalty: 0.90 }
  },
  {
    id: 'turret',
    name: 'Boltz',
    title: 'Turret Machinist',
    accent: '#F8BA3A',
    startTool: 'gear_turret',
    tags: ['ROBOTICS', 'SEISMIC'],
    bio: 'Master turret builder — unbeatable turret grids, weak with personal guns.',
    passiveName: 'Factory Floor',
    pros: [
      '+1 extra placed Turret for each 🤖 Robotics-tag Turret',
      '+35% damage on 🤖 Robotics-tag weapons, +12 Eng',
      '+25% Turret fire rate when standing near them'
    ],
    cons: [
      '-35% damage on 🔫 Guns and 🛰 Orbital-tag weapons',
      '-10% Move Speed'
    ],
    ultimate: { id: 'turret_overdrive', name: 'Turret Swarm Drop', desc: 'Air-drops 4 supercharged Gear Turrets & +60% Attack Speed for 5s!' },
    stats: {
      maxHp: 100, hpRegen: 0.5, armor: 3, speed: 214, damagePct: 0, engineering: 12,
      attackSpeedPct: 5, critChance: 4, areaPct: 5, magnet: 120, luck: 5, scrapPct: 0, dashCd: 2.45
    },
    perks: { extraDeployCap: 1, proximityOverclock: true, roboticsDmgMult: 1.35, gunDmgMult: 0.65, orbitalDmgMult: 0.65 }
  },
  {
    id: 'demo',
    name: 'Vex',
    title: 'Demolition Miner',
    accent: '#F05656',
    startTool: 'prox_mine',
    tags: ['MINES', 'SEISMIC'],
    bio: 'Chain-detonation bomber who clears screens with huge blasts at risky range.',
    passiveName: 'Chain Detonation',
    pros: [
      '+40% damage on 💣 Mines-tag weapons',
      '+35% Blast Radius & Mines chain-detonate',
      '+10% Global Damage'
    ],
    cons: [
      '-25% damage on 🔫 Guns and 🤖 Robotics-tag weapons',
      '+20% Jet-Dash Cooldown & -20% Dodge cap'
    ],
    ultimate: { id: 'carpet_mines', name: 'Carpet Mine Blitz', desc: 'Deploys a 10-mine detonation ring & triggers a massive shockwave!' },
    stats: {
      maxHp: 98, hpRegen: 0.4, armor: 2, speed: 228, damagePct: 10, engineering: 6,
      attackSpeedPct: 0, critChance: 6, areaPct: 35, magnet: 120, luck: 5, scrapPct: 0, dashCd: 2.85
    },
    perks: { mineDmgMult: 1.4, chainDetonate: true, gunDmgMult: 0.75, roboticsDmgMult: 0.75, maxDodgeCap: 40 }
  },
  {
    id: 'tesla',
    name: 'Tessa',
    title: 'Voltaic Grid Architect',
    accent: '#A47BFF',
    startTool: 'tesla_pylon',
    tags: ['VOLTAIC', 'ROBOTICS'],
    bio: 'High-voltage glass cannon — insane chain crits, zero armor plating.',
    passiveName: 'High Voltage',
    pros: [
      '+35% damage on ⚡ Voltaic-tag weapons & +2 Chain Bounces',
      '+18% Crit Chance & Crits grant +20% Speed',
      '+12% Attack Speed'
    ],
    cons: [
      '-35% damage on 🪨 Seismic-tag and 💣 Mines-tag weapons',
      'Starts with -2 Armor & -15 Max HP'
    ],
    ultimate: { id: 'tesla_storm', name: 'Mega-Volt Storm', desc: 'Strikes up to 14 enemies with guaranteed Crit Chain-Lightning bolts!' },
    stats: {
      maxHp: 85, hpRegen: 0.3, armor: -2, speed: 242, damagePct: 0, engineering: 8,
      attackSpeedPct: 12, critChance: 18, areaPct: 5, magnet: 125, luck: 8, scrapPct: 0, dashCd: 2.15
    },
    perks: { voltaicDmgMult: 1.35, extraChainBounces: 2, critHaste: true, seismicDmgMult: 0.65, mineDmgMult: 0.65 }
  },
  {
    id: 'seismic',
    name: 'Rumble',
    title: 'Seismic Excavator',
    accent: '#F8BA3A',
    startTool: 'seismic_thumper',
    tags: ['SEISMIC', 'MINES'],
    bio: 'Armored juggernaut — massive shockwaves & durability, slow and heavy.',
    passiveName: 'Tectonic Plating',
    pros: [
      '+40% damage on 🪨 Seismic-tag weapons & +40% Knockback',
      '+35 Max HP, +5 Armor & Dash Shockwave',
      '+30% Shockwave AoE'
    ],
    cons: [
      '-18% Move Speed & -35% damage on 🔫 Guns',
      'Dodge upgrades have 50% reduced effect'
    ],
    ultimate: { id: 'mega_quake', name: 'Tectonic Cataclysm', desc: 'Unleashes 3 giant earthquake shockwaves that stun & shred armor!' },
    stats: {
      maxHp: 135, hpRegen: 1.2, armor: 5, speed: 200, damagePct: 5, engineering: 4,
      attackSpeedPct: -5, critChance: 4, areaPct: 30, magnet: 115, luck: 0, scrapPct: 0, dashCd: 2.35
    },
    perks: { seismicDmgMult: 1.4, dashShockwave: true, knockbackMult: 1.45, gunDmgMult: 0.65, dodgeGainMult: 0.5 }
  },
  {
    id: 'cryo',
    name: 'Glacio',
    title: 'Cryo-Core Scientist',
    accent: '#6EA5FF',
    startTool: 'cryo_coil',
    tags: ['VOLTAIC', 'ORBITAL'],
    bio: 'Crowd-control tactician — chills & shatters swarms, relies on status combos.',
    passiveName: 'Absolute Zero',
    pros: [
      'Chilled foes move 35% slower & take +30% Damage',
      'Chilled foes shatter into frost shards on death',
      '+25% Voltaic & Cryo AoE'
    ],
    cons: [
      '-18% Raw Base Damage (must chill foes first!)',
      '-40% damage on 🔥 Thermal-tag weapons'
    ],
    ultimate: { id: 'flash_freeze', name: 'Absolute Zero Nova', desc: 'Flash-freezes every enemy on screen for 3.5s & fires a 16-shard ice storm!' },
    stats: {
      maxHp: 96, hpRegen: 0.6, armor: 2, speed: 234, damagePct: -18, engineering: 7,
      attackSpeedPct: 8, critChance: 10, areaPct: 22, magnet: 125, luck: 6, scrapPct: 0, dashCd: 2.25
    },
    perks: { cryoAmp: 1.3, cryoShatter: true, thermalMult: 0.6 }
  },
  {
    id: 'fabricator',
    name: 'Fabri',
    title: '3D-Print Roboticist',
    accent: '#6BE2A7',
    startTool: 'assembler_drone',
    tags: ['ROBOTICS', 'ORBITAL'],
    bio: 'Workshop economy master — cheap blueprints & merge scaling, weak early combat.',
    passiveName: 'Rapid Prototyping',
    pros: [
      '-18% Workshop Prices & 1 Free Reroll per wave',
      'Merging weapons grants +4 permanent Engineering',
      '+12 Luck & +25% damage on 🤖 Robotics-tag weapons'
    ],
    cons: [
      '-20% Starting Weapon Damage',
      'HP Regen & Life Steal are 40% less effective'
    ],
    ultimate: { id: 'nano_printer', name: '3D-Print Nano Swarm', desc: 'Prints 16 homing explosive micro-bots & drops a +10 HP Nano-Fruit!' },
    stats: {
      maxHp: 90, hpRegen: 0.1, armor: 1, speed: 236, damagePct: -20, engineering: 8,
      attackSpeedPct: 4, critChance: 5, areaPct: 8, magnet: 130, luck: 12, scrapPct: 0, dashCd: 2.3
    },
    perks: { shopDiscount: 0.18, freeRerolls: 1, mergeEngBonus: 4, roboticsDmgMult: 1.25, sustainGainMult: 0.6 }
  },
  {
    id: 'salvager',
    name: 'Sawyer',
    title: 'Industrial Salvager',
    accent: '#6BE2A7',
    startTool: 'buzzsaw_launcher',
    tags: ['SEISMIC', 'ROBOTICS'],
    bio: 'Greedy scrap-hoarder who gets stronger the more unspent Scrap he carries.',
    passiveName: 'Scrap Magnet',
    pros: [
      '+22% Scrap Drops & +18 Luck (better Shop tiers)',
      '+3% Global Damage per 40 unspent Scrap',
      '+30% damage on 🔫 Guns & +25% on 🪨 Seismic-tag weapons'
    ],
    cons: [
      '-15 Max HP & -30% damage on 🛰 Orbital-tag and 🔥 Thermal-tag weapons',
      'Workshop prices are +12% more expensive'
    ],
    ultimate: { id: 'scrap_cyclone', name: 'Scrapyard Saw-Cyclone', desc: 'Fires 10 ricocheting Buzzsaws & vacuums EVERY Scrap gem on the map!' },
    stats: {
      maxHp: 85, hpRegen: 0.5, armor: 1, speed: 242, damagePct: 0, engineering: 5,
      attackSpeedPct: 5, critChance: 8, areaPct: 10, magnet: 165, luck: 18, scrapPct: 22, dashCd: 2.2
    },
    perks: { scrapDamageScaling: true, gunDmgMult: 1.3, seismicDmgMult: 1.25, orbitalDmgMult: 0.7, thermalMult: 0.7, shopDiscount: -0.12 }
  },
  {
    id: 'quantum',
    name: 'Nova',
    title: 'Quantum Gravity Engineer',
    accent: '#A47BFF',
    startTool: 'gravity_well',
    tags: ['ORBITAL', 'MINES'],
    bio: 'Time-bending striker with blistering cooldowns and fragile zero-armor frame.',
    passiveName: 'Event Horizon',
    pros: [
      '+20% Attack Speed, +25% damage on 🛰 Orbital-tag weapons & +20% on 🔫 Guns',
      'Every 8s: Quantum Pulse slows enemy shots & overclocks +25%',
      '-15% Jet-Dash Cooldown'
    ],
    cons: [
      '-3 Armor & -15 Max HP (glass frame)',
      '-30% damage on 🤖 Robotics-tag weapons'
    ],
    ultimate: { id: 'singularity_collapse', name: 'Black Hole Collapse', desc: 'Deletes enemy bullets, spawns 2 Gravity Wells & +50% Attack Speed (5s)!' },
    stats: {
      maxHp: 85, hpRegen: 0.4, armor: -3, speed: 248, damagePct: 5, engineering: 8,
      attackSpeedPct: 20, critChance: 10, areaPct: 20, magnet: 140, luck: 10, scrapPct: 0, dashCd: 1.9
    },
    perks: { quantumPulse: true, orbitalDmgMult: 1.25, gunDmgMult: 1.2, roboticsDmgMult: 0.7 }
  },

  // ==========================================================================
  // 4 RULE-BREAKING BROTATO-STYLE ALIEN ENGINEERS!
  // ==========================================================================
  {
    id: 'octo',
    name: 'Octo-Rig',
    title: '12-Arm Multi-Tasker',
    accent: '#F8BA3A',
    startTool: 'rivet_smg',
    tags: ['ROBOTICS', 'SEISMIC'],
    bio: 'Brotato Multitasker legend — wields TWELVE weapons & guns simultaneously!',
    passiveName: '12-Weapon Harness',
    pros: [
      'Can equip up to 12 WEAPONS AT ONCE!',
      '+20% Gun Fire Rate & starts with Rivet SMG',
      '+10% Scrap Drops'
    ],
    cons: [
      '-30% Base Damage & -5% Damage per weapon held',
      '-15% Blast AoE & +10% Shop Costs'
    ],
    ultimate: { id: 'all_hands_barrage', name: '12-Arm Bullet Storm', desc: 'Resets every weapon cooldown & grants +85% Attack Speed for 4.5s!' },
    stats: {
      maxHp: 96, hpRegen: 0.4, armor: 0, speed: 230, damagePct: -30, engineering: 4,
      attackSpeedPct: 12, critChance: 4, areaPct: -15, magnet: 125, luck: 5, scrapPct: 10, dashCd: 2.4
    },
    perks: { maxSlots: 12, dmgPenaltyPerWeapon: 5, shopDiscount: -0.10 }
  },
  {
    id: 'mochi',
    name: 'Mochi',
    title: 'Alien Beast-Tamer',
    accent: '#2DD4BF',
    startTool: null,
    tags: ['ROBOTICS', 'ORBITAL'],
    bio: 'Refuses all weapons & guns — commands a lethal pack of autonomous Pets!',
    passiveName: 'Alpha Packmaster (Pets Only)',
    pros: [
      'Starts with 3 PETS (Catling, Loot Worm, Blazemander)',
      '1 Guaranteed Pet every 4–5 Shops',
      '+55% Pet Damage & +30% Pet Speed'
    ],
    cons: [
      '0 WEAPON SLOTS — Cannot equip any Guns or Tools!',
      '-15% Dodge Cap & Personal Damage mods only boost Pets'
    ],
    ultimate: { id: 'pack_frenzy', name: 'Alpha Pack Frenzy', desc: 'Supercharges all Pets +100% fire rate & +35% damage for 6s + heals 18 HP!' },
    stats: {
      maxHp: 96, hpRegen: 0.8, armor: 1, speed: 246, damagePct: 0, engineering: 10,
      attackSpeedPct: 8, critChance: 8, areaPct: 10, magnet: 145, luck: 12, scrapPct: 0, dashCd: 2.15
    },
    perks: { maxSlots: 0, petOnly: true, startingPets: ['pet_catling', 'pet_loot_worm', 'pet_blazemander'], petPowerMult: 1.55, maxDodgeCap: 45 }
  },
  {
    id: 'zenon',
    name: 'Zenon',
    title: 'Pacifist Shield-Tech',
    accent: '#6EA5FF',
    startTool: 'bio_garden',
    tags: ['ORBITAL', 'SEISMIC'],
    bio: 'Non-violent shield engineer who profits from surviving swarms instead of killing.',
    passiveName: 'Pacifist Protocol',
    pros: [
      '+35 Harvesting, +18% Dodge, +6 Armor & +30 Max HP',
      'Every surviving enemy at wave end pays +2 Scrap',
      '+35% Knockback & fastest Jet-Dash'
    ],
    cons: [
      '-75% Weapon & Gun Damage (Pacifist!)',
      'Pets deal 50% reduced damage'
    ],
    ultimate: { id: 'aegis_repulsor', name: 'Aegis Repulsor Dome', desc: 'Grants +45 Energy Shield, blasts enemies away & deletes all enemy shots!' },
    stats: {
      maxHp: 130, hpRegen: 2.0, armor: 6, speed: 252, damagePct: -75, engineering: 2,
      attackSpeedPct: 0, critChance: 0, areaPct: 25, magnet: 160, luck: 10, scrapPct: 0, dashCd: 1.85
    },
    perks: { startHarvesting: 35, startDodge: 18, pacifistSurvivorBonus: 2, petPowerMult: 0.5, knockbackMult: 1.35 }
  },
  {
    id: 'hexx',
    name: 'Hexx',
    title: 'Cursed Relic Hunter',
    accent: '#C084FC',
    startTool: 'rail_sniper',
    tags: ['VOLTAIC', 'MINES'],
    bio: 'Forbidden-relic gambler — rolls Cursed gear for massive power against Cursed swarms.',
    passiveName: 'Curse Conduit',
    pros: [
      '45% of Shop offers roll CURSED (+35% boosted stats!)',
      '+6% Global Damage per Curse point',
      '+25% damage on 🔫 Guns and ⚡ Voltaic-tag weapons'
    ],
    cons: [
      'Starts with +2 Curse (spawns faster, deadlier Cursed foes!)',
      '-20 Max HP & -30% HP Regen effectiveness'
    ],
    ultimate: { id: 'abyssal_overload', name: 'Abyssal Curse Nova', desc: 'Detonates a Cursed shockwave scaling with Curse & grants +40% Crit (5s)!' },
    stats: {
      maxHp: 80, hpRegen: 0.2, armor: 0, speed: 242, damagePct: 5, engineering: 7,
      attackSpeedPct: 8, critChance: 12, areaPct: 12, magnet: 130, luck: 16, scrapPct: 10, dashCd: 2.15
    },
    perks: { curseShopChance: 0.45, startCurse: 2, dmgPerCurse: 6, gunDmgMult: 1.25, voltaicDmgMult: 1.25, sustainGainMult: 0.7 }
  },

  // ==========================================================================
  // 6 LOCKED ELITE ALIEN ENGINEERS (Unlock with Shards OR Try in Practice Lab!)
  // ==========================================================================
  {
    id: 'phantom',
    name: 'Vexis',
    title: 'Void Assassin',
    accent: '#C084FC',
    startTool: 'plasma_pistol',
    tags: ['VOLTAIC', 'ORBITAL'],
    lockedByDefault: true,
    unlockCost: 260,
    bio: 'Shadow-cloaked void striker who weaves between bullets and deletes targets with lethal crits.',
    passiveName: 'Phantom Reflex',
    pros: [
      '+35% Crit Chance & +25% Dodge',
      '+30% damage on 🔫 Guns and ⚡ Voltaic-tag weapons',
      'Jet-Dash grants +40% Attack Speed for 2.5s'
    ],
    cons: [
      '-30 Max HP (Glass Assassin!)',
      '-35% damage on 🤖 Robotics-tag and 💣 Mines-tag weapons'
    ],
    ultimate: { id: 'void_blink', name: 'Void Blink Barrage', desc: 'Fires 12 piercing guaranteed-crit plasma bolts & grants 2.2s invulnerability!' },
    stats: {
      maxHp: 70, hpRegen: 0.2, armor: 0, speed: 264, damagePct: 10, engineering: 5,
      attackSpeedPct: 14, critChance: 35, areaPct: 0, magnet: 135, luck: 10, scrapPct: 0, dashCd: 1.8
    },
    perks: { startDodge: 25, gunDmgMult: 1.3, voltaicDmgMult: 1.3, roboticsDmgMult: 0.65, mineDmgMult: 0.65, dashAspdBuff: true }
  },
  {
    id: 'titan',
    name: 'Brakk',
    title: 'Colossus Juggernaut',
    accent: '#FF7B54',
    startTool: 'shock_anvil',
    tags: ['SEISMIC', 'MINES'],
    lockedByDefault: true,
    unlockCost: 280,
    bio: 'Walking dreadnought exo-suit whose sheer hull mass converts Max HP straight into raw damage.',
    passiveName: 'Colossus Hull',
    pros: [
      '+55 Max HP, +7 Armor & +2.4 HP Regen',
      'Gain +1% Global Damage per 4 Max HP',
      '+35% damage on 🪨 Seismic-tag and 💣 Mines-tag weapons'
    ],
    cons: [
      '-22% Move Speed & -20% Attack Speed',
      'Cannot Dodge (0% Dodge Cap)'
    ],
    ultimate: { id: 'titan_slam', name: 'Titan Meteor Slam', desc: 'Unleashes 3 giant HP-scaling quakes & grants +60 Energy Shield!' },
    stats: {
      maxHp: 155, hpRegen: 2.4, armor: 7, speed: 192, damagePct: 0, engineering: 6,
      attackSpeedPct: -20, critChance: 4, areaPct: 25, magnet: 115, luck: 0, scrapPct: 0, dashCd: 2.8
    },
    perks: { hpToDmgDiv: 4, seismicDmgMult: 1.35, mineDmgMult: 1.35, maxDodgeCap: 0, knockbackMult: 1.4 }
  },
  {
    id: 'alchemist',
    name: 'Blib',
    title: 'Bio-Slime Alchemist',
    accent: '#34F5C5',
    startTool: 'acid_needle',
    tags: ['THERMAL', 'MINES'],
    lockedByDefault: true,
    unlockCost: 300,
    bio: 'Volatile xenochemist who brews corrosive flasks and weaponizes every Healing Fruit on the floor.',
    passiveName: 'Volatile Bio-Brew',
    pros: [
      '+45% damage on 🔥 Thermal-tag & +25% on 💣 Mines-tag weapons',
      'Picking up Healing Fruits triggers a massive toxic blast!',
      'Auto-spawns bonus +8 HP Bio-Fruits every 7s'
    ],
    cons: [
      '-25% damage on 🔫 Guns (not Thermal ones) and 🛰 Orbital-tag weapons',
      '-2 Armor & +15% Jet-Dash Cooldown'
    ],
    ultimate: { id: 'plague_brew', name: 'Plague Brew Nova', desc: 'Floods the area with 6 corrosive/molten pools & drops 3 +10 HP Bio-Fruits!' },
    stats: {
      maxHp: 96, hpRegen: 0.8, armor: -2, speed: 236, damagePct: 0, engineering: 10,
      attackSpeedPct: 6, critChance: 6, areaPct: 22, magnet: 155, luck: 10, scrapPct: 0, dashCd: 2.65
    },
    perks: { thermalMult: 1.45, mineDmgMult: 1.25, gunDmgMult: 0.75, orbitalDmgMult: 0.75, fruitBlast: true, autoBioFruit: true }
  },
  {
    id: 'sniper',
    name: 'Kestrel',
    title: 'Orbital Marksman',
    accent: '#60EFFF',
    startTool: 'rail_sniper',
    tags: ['VOLTAIC', 'ORBITAL'],
    lockedByDefault: true,
    unlockCost: 340,
    bio: 'Deadeye recon specialist carrying only 3 hyper-tuned weapons with devastating boss-killing crits.',
    passiveName: 'Apex Marksman (3 Slots)',
    pros: [
      '+75% damage on 🔫 Guns and 🛰 Orbital-tag weapons & +30% Crit Chance',
      '+30% Bonus Damage vs Bosses & Elites',
      'All weapons gain +140 Aim Range'
    ],
    cons: [
      'MAX 3 WEAPON SLOTS ONLY!',
      '-18% Move Speed & -30% Blast AoE'
    ],
    ultimate: { id: 'gauss_exec', name: 'Hyper-Gauss Execution', desc: 'Fires 5 guaranteed-crit piercing rail-beams at the highest-HP threats!' },
    stats: {
      maxHp: 82, hpRegen: 0.4, armor: 0, speed: 205, damagePct: 15, engineering: 6,
      attackSpeedPct: 5, critChance: 30, areaPct: -30, magnet: 125, luck: 12, scrapPct: 0, dashCd: 2.3
    },
    perks: { maxSlots: 3, gunDmgMult: 1.75, orbitalDmgMult: 1.75, bossDmgMult: 1.3, rangeBonus: 140 }
  },
  {
    id: 'chrono',
    name: 'Tick',
    title: 'Chrono-Clockwork',
    accent: '#FFD466',
    startTool: 'tesla_carbine',
    tags: ['VOLTAIC', 'ROBOTICS'],
    lockedByDefault: true,
    unlockCost: 380,
    bio: 'Clockwork time-bender who fires in a relentless blur and freezes pursuers with every Jet-Dash.',
    passiveName: 'Chrono Acceleration',
    pros: [
      '+40% Global Attack Speed & -35% Jet-Dash Cooldown',
      'Jet-Dash time-freezes nearby enemies for 1.8s!',
      '+15% Move Speed'
    ],
    cons: [
      '-25% Base Damage per hit',
      '-20 Max HP & +15% Workshop Prices'
    ],
    ultimate: { id: 'chrono_stop', name: 'Chrono Time-Stop', desc: 'Freezes ALL enemies & erases bullets for 4.0s while boosting Atk Spd +75%!' },
    stats: {
      maxHp: 80, hpRegen: 0.5, armor: 0, speed: 258, damagePct: -25, engineering: 8,
      attackSpeedPct: 40, critChance: 10, areaPct: 5, magnet: 135, luck: 8, scrapPct: 0, dashCd: 1.45
    },
    perks: { dashFreeze: true, shopDiscount: -0.15 }
  },
  {
    id: 'overlord',
    name: 'Zyrx',
    title: 'Hive Overlord',
    accent: '#E84BFF',
    startTool: 'nano_hive',
    tags: ['ROBOTICS', 'ORBITAL'],
    lockedByDefault: true,
    unlockCost: 420,
    bio: 'Supreme alien hive-commander deploying relentless drone armadas alongside a royal Quantum Owl.',
    passiveName: 'Royal Swarm Command',
    pros: [
      '+2 extra placed Turrets for 🤖 Robotics-tag Turrets & starts with QUANTUM OWL Pet!',
      '+35% damage on 🤖 Robotics-tag weapons & Pets, +15 Engineering',
      '+20% Deployable Fire Rate'
    ],
    cons: [
      '-35% damage on 🔫 Guns & -20 Max HP',
      'HP Regen & Life Steal are 50% less effective'
    ],
    ultimate: { id: 'royal_swarm', name: 'Royal Swarm Ascension', desc: 'Launches 14 homing plasma bots & supercharges Pets + Turrets +80% (5s)!' },
    stats: {
      maxHp: 80, hpRegen: 0.2, armor: 1, speed: 238, damagePct: 0, engineering: 15,
      attackSpeedPct: 8, critChance: 8, areaPct: 12, magnet: 140, luck: 12, scrapPct: 5, dashCd: 2.2
    },
    perks: { extraDeployCap: 2, startingPets: ['pet_void_owl'], roboticsDmgMult: 1.35, petPowerMult: 1.35, gunDmgMult: 0.65, sustainGainMult: 0.5 }
  }
];

window.MM.getCharacter = function (id) {
  return window.MM.CHARACTERS.find((c) => c.id === id) || window.MM.CHARACTERS[0];
};
