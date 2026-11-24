// ============================================================================
// MULTI-MINE — 30 Zero-Gun Contraptions, 6 Synergies, 62 Brotato-Style Modules
// Includes authentic Brotato wave price inflation, Harvesting, Dodge & Procs!
// ============================================================================
window.MM = window.MM || {};

(function () {
  const TIER_NAMES = ['', 'Mk.I', 'Mk.II', 'Mk.III', 'Mk.IV'];
  const TIER_COLORS = ['', '#94A3B8', '#60A5FA', '#C084FC', '#FACC15'];
  const TIER_DMG_MULT = [0, 1.0, 1.65, 2.55, 3.85];
  const TIER_CD_MULT = [0, 1.0, 0.88, 0.77, 0.66];
  const TIER_COST_MULT = [0, 1.0, 1.95, 3.55, 6.2];

  // Authentic Brotato wave inflation so you must pick 1-2 items & use LOCK — never sweep every shop!
  function getWavePriceMult(wave = 1) {
    const w = Math.max(0, wave - 1);
    return 1.18 + w * 0.24 + (wave > 4 ? (wave - 4) * 0.08 : 0);
  }

  const SYNERGIES = {
    MINES: {
      id: 'MINES',
      name: 'Mines',
      badge: '💣',
      color: '#F05656',
      icon: 'tool:prox_mine',
      desc: 'Bigger blasts & chain explosions.',
      tiers: [
        { count: 2, label: '+20% AoE • +15% Mine Dmg', areaPct: 20, mineDmgMult: 1.15 },
        { count: 4, label: '+35% AoE • +32% Dmg • Scorch', areaPct: 35, mineDmgMult: 1.32, scorch: true },
        { count: 6, label: '+55% AoE • +55% Dmg • Mini-Mines!', areaPct: 55, mineDmgMult: 1.55, scorch: true, miniMines: true }
      ]
    },
    ROBOTICS: {
      id: 'ROBOTICS',
      name: 'Robotics',
      badge: '🤖',
      color: '#F8BA3A',
      icon: 'icon:robot_arm',
      desc: 'Faster turrets & extra bots.',
      tiers: [
        { count: 2, label: '+18% Bot Spd • +8 Eng', deployAspd: 1.18, engineering: 8 },
        { count: 4, label: '+35% Bot Spd • +1 Bot Cap • +15 Eng', deployAspd: 1.35, extraDeployCap: 1, engineering: 15 },
        { count: 6, label: '+60% Bot Spd • +2 Cap • Overclock!', deployAspd: 1.60, extraDeployCap: 2, engineering: 25, overclock: true }
      ]
    },
    THERMAL: {
      id: 'THERMAL',
      name: 'Thermal',
      badge: '🔥',
      color: '#FF7B54',
      icon: 'tool:magma_vent',
      desc: 'Ignite & burn explosions.',
      tiers: [
        { count: 2, label: '+20% Fire Dmg • 3s Burn', thermalDmgMult: 1.20, burn: true },
        { count: 4, label: '+42% Fire Dmg • Burn Spreads', thermalDmgMult: 1.42, burn: true, spreadBurn: true },
        { count: 6, label: '+70% Fire Dmg • Burning Foes Explode!', thermalDmgMult: 1.70, burn: true, spreadBurn: true, meltdown: true }
      ]
    },
    ORBITAL: {
      id: 'ORBITAL',
      name: 'Orbital',
      badge: '🛰',
      color: '#6EA5FF',
      icon: 'tool:orbital_sat',
      desc: 'Faster orbits, speed & shield.',
      tiers: [
        { count: 2, label: '+25% Orbit Spd • +10% Move Spd', orbitalSpeed: 1.25, speedPct: 10 },
        { count: 4, label: '+50% Orbit Spd • +1 Orbit • +18% Spd', orbitalSpeed: 1.50, bonusOrbit: 1, speedPct: 18 },
        { count: 6, label: '+80% Orbit • +2 Orbits • Shield on Hit!', orbitalSpeed: 1.80, bonusOrbit: 2, speedPct: 24, shieldOnHit: true }
      ]
    },
    SEISMIC: {
      id: 'SEISMIC',
      name: 'Seismic',
      badge: '🪨',
      color: '#6BE2A7',
      icon: 'tool:seismic_thumper',
      desc: 'Armor, knockback & armor shred.',
      tiers: [
        { count: 2, label: '+20% AoE/KB • +3 Armor', areaPct: 20, knockback: 1.2, armor: 3 },
        { count: 4, label: '+40% AoE • Armor Shred • +6 Armor', areaPct: 40, knockback: 1.4, armor: 6, shred: true },
        { count: 6, label: '+65% AoE • Faultline Quake • +11 Armor', areaPct: 65, knockback: 1.7, armor: 11, shred: true, faultline: true }
      ]
    },
    VOLTAIC: {
      id: 'VOLTAIC',
      name: 'Voltaic',
      badge: '⚡',
      color: '#A47BFF',
      icon: 'tool:tesla_pylon',
      desc: 'Crit lightning & chain arcs.',
      tiers: [
        { count: 2, label: '+10% Crit • +1 Chain Bounce', critChance: 10, chainBonus: 1 },
        { count: 4, label: '+20% Crit • +2 Chains • Crit Arcs', critChance: 20, chainBonus: 2, critArc: true },
        { count: 6, label: '+35% Crit • +4 Chains • +22% Atk Spd!', critChance: 35, chainBonus: 4, critArc: true, attackSpeedPct: 22 }
      ]
    }
  };

  // 30 Distinct Zero-Gun Engineering Contraptions!
  const CONTRAPTIONS = [
    // --- ORIGINAL 18 ---
    { id: 'prox_mine', name: 'Proximity Mine', tags: ['MINES', 'SEISMIC'], kind: 'mine', baseCost: 18, baseDmg: 28, engScale: 1.15, cd: 1.9, radius: 76, maxActive: 6, desc: 'Deploys smart pressure mines that detonate in a heavy blast ring when enemies approach.' },
    { id: 'cluster_charge', name: 'Cluster Charge', tags: ['MINES', 'THERMAL'], kind: 'cluster', baseCost: 22, baseDmg: 22, engScale: 1.0, cd: 2.35, radius: 64, range: 340, desc: 'Lobs an engineering satchel into enemy clusters that bursts into 4 blazing sub-charges.' },
    { id: 'cryo_mine', name: 'Cryo Mine', tags: ['MINES', 'VOLTAIC'], kind: 'cryo_mine', baseCost: 20, baseDmg: 20, engScale: 1.05, cd: 2.1, radius: 86, maxActive: 5, desc: 'Plants frost-capacitor mines that freeze & chill enemies in a wide cryo shockwave.' },
    { id: 'gear_turret', name: 'Gear Turret', tags: ['ROBOTICS', 'SEISMIC'], kind: 'turret_gear', baseCost: 21, baseDmg: 15, engScale: 0.95, cd: 3.4, fireCd: 0.72, range: 330, maxActive: 2, desc: 'Deploys an autonomous mechanical turret that flings high-torque steel cogs at nearby foes.' },
    { id: 'welder_turret', name: 'Arc Welder Tower', tags: ['ROBOTICS', 'THERMAL'], kind: 'turret_welder', baseCost: 24, baseDmg: 9, engScale: 1.0, cd: 3.8, fireCd: 0.36, range: 290, maxActive: 2, desc: 'Builds an industrial plasma-welding tower that sears nearby targets with a continuous superheated arc.' },
    { id: 'assembler_drone', name: 'Assembler Drone', tags: ['ROBOTICS', 'ORBITAL'], kind: 'drone', baseCost: 22, baseDmg: 16, engScale: 0.85, cd: 1.0, fireCd: 0.55, range: 360, maxActive: 1, desc: 'Autonomous hovering builder-bot that zips between foes, slicing them with rotary plasma cutters.' },
    { id: 'repair_sentinel', name: 'Repair Sentinel', tags: ['ROBOTICS', 'VOLTAIC'], kind: 'turret_heal', baseCost: 23, baseDmg: 14, engScale: 0.85, cd: 4.0, fireCd: 1.1, range: 280, maxActive: 2, desc: 'Hovering shield-bot that zaps threats AND periodically restores your HP with nano-repair pulses.' },
    { id: 'orbital_sat', name: 'Orbital Satellite', tags: ['ORBITAL', 'VOLTAIC'], kind: 'orbital_sat', baseCost: 20, baseDmg: 17, engScale: 0.9, cd: 1.35, radius: 105, desc: 'NASA-grade orbiting satellite that slams foes and emits auto-aimed solar scanner arcs.' },
    { id: 'gyro_saw', name: 'Gyro Sawblades', tags: ['ORBITAL', 'SEISMIC'], kind: 'orbital_saw', baseCost: 19, baseDmg: 14, engScale: 0.78, cd: 0.35, radius: 86, desc: 'High-RPM serrated sawblades spinning tightly around your alien, shredding incoming swarms.' },
    { id: 'solar_mirror', name: 'Solar Mirror', tags: ['ORBITAL', 'THERMAL'], kind: 'orbital_mirror', baseCost: 23, baseDmg: 22, engScale: 1.0, cd: 1.45, radius: 122, range: 340, desc: 'Orbiting parabolic mirror that focuses a scorching beam onto dense enemy packs and ignites them.' },
    { id: 'buzzsaw_launcher', name: 'Buzzsaw Rig', tags: ['SEISMIC', 'ROBOTICS'], kind: 'ricochet_saw', baseCost: 20, baseDmg: 21, engScale: 0.85, cd: 1.25, range: 420, desc: 'Launches hydraulic steel sawblades that cleave through crowds and ricochet off cavern walls.' },
    { id: 'seismic_thumper', name: 'Seismic Thumper', tags: ['SEISMIC', 'MINES'], kind: 'thumper', baseCost: 19, baseDmg: 25, engScale: 1.0, cd: 1.85, radius: 128, desc: 'Slams pneumatic pistons around your alien, sending tectonic rings that knock back & stun foes.' },
    { id: 'core_drill', name: 'Core Drill', tags: ['SEISMIC', 'THERMAL'], kind: 'drill', baseCost: 23, baseDmg: 34, engScale: 1.15, cd: 2.2, radius: 78, range: 380, desc: 'Autonomous burrowing auger that tunnels under the floor to an enemy pack and erupts in molten rock!' },
    { id: 'magma_vent', name: 'Magma Vent', tags: ['THERMAL', 'MINES'], kind: 'magma_vent', baseCost: 20, baseDmg: 18, engScale: 1.1, cd: 2.6, radius: 74, maxActive: 4, desc: 'Spawns erupting flat-vector mini-volcanoes under swarms that leave searing lava craters.' },
    { id: 'thermal_kiln', name: 'Thermal Kiln', tags: ['THERMAL', 'ROBOTICS'], kind: 'kiln', baseCost: 21, baseDmg: 17, engScale: 0.95, cd: 1.6, radius: 118, desc: 'Mobile furnace emitter releasing blazing slag rings and burning embers around your engineer.' },
    { id: 'tesla_pylon', name: 'Tesla Pylon', tags: ['VOLTAIC', 'ROBOTICS'], kind: 'turret_tesla', baseCost: 22, baseDmg: 18, engScale: 1.1, cd: 3.3, fireCd: 1.05, range: 270, maxActive: 3, desc: 'Plants high-voltage pylons that zap enemies with chain lightning AND link live electric fences between pylons!' },
    { id: 'cryo_coil', name: 'Cryo Coil', tags: ['VOLTAIC', 'ORBITAL'], kind: 'cryo_wave', baseCost: 20, baseDmg: 18, engScale: 0.95, cd: 1.55, radius: 132, range: 300, desc: 'Emits sweeping frost-arcs toward nearby swarms, chilling enemies and fracturing them with ice bolts.' },
    { id: 'gravity_well', name: 'Gravity Well', tags: ['ORBITAL', 'MINES'], kind: 'gravity_well', baseCost: 24, baseDmg: 26, engScale: 1.2, cd: 3.1, radius: 122, range: 340, maxActive: 2, desc: 'Deploys a quantum singularity beacon that sucks enemies into a vortex before imploding!' },

    // --- 12 BRAND-NEW CONTRAPTIONS ---
    { id: 'grapple_claw', name: 'Hydraulic Grapple', tags: ['ROBOTICS', 'SEISMIC'], kind: 'grapple', baseCost: 21, baseDmg: 26, engScale: 1.0, cd: 1.75, range: 350, radius: 72, desc: 'Launches an articulated bionic claw that slams a target, shreds armor, and pulls nearby foes into a cluster!' },
    { id: 'acid_sprayer', name: 'Corrosive Vat', tags: ['THERMAL', 'MINES'], kind: 'acid_sprayer', baseCost: 21, baseDmg: 16, engScale: 1.05, cd: 2.0, range: 310, radius: 76, desc: 'Sprays pressurized green acid blobs that burst into armor-melting toxic puddles!' },
    { id: 'saw_drone', name: 'Shredder Copter', tags: ['ROBOTICS', 'SEISMIC'], kind: 'saw_drone', baseCost: 24, baseDmg: 20, engScale: 0.9, cd: 1.0, fireCd: 0.36, range: 420, maxActive: 1, desc: 'Heavy high-RPM buzzsaw drone that aggressively hunts the highest-HP threat in range!' },
    { id: 'nano_hive', name: 'Nano-Swarm Hive', tags: ['ROBOTICS', 'VOLTAIC'], kind: 'nano_hive', baseCost: 23, baseDmg: 12, engScale: 0.85, cd: 1.8, range: 410, desc: 'Releases homing swarms of electric micro-bots that chase down targets and shock on impact!' },
    { id: 'plasma_rang', name: 'Plasma Arc-Wrench', tags: ['ORBITAL', 'THERMAL'], kind: 'boomerang', baseCost: 20, baseDmg: 22, engScale: 0.9, cd: 1.4, range: 380, desc: 'Hurls a spinning superheated arc-wrench that slices through lines of foes going out AND returning!' },
    { id: 'pulse_cap', name: 'EMP Capacitor', tags: ['VOLTAIC', 'SEISMIC'], kind: 'emp_cone', baseCost: 22, baseDmg: 24, engScale: 1.05, cd: 1.9, range: 260, radius: 135, desc: 'Discharges a wide directional electromagnetic shock-cone that stuns packs and chains static sparks.' },
    { id: 'jackhammer', name: 'Sonic Jackhammer', tags: ['SEISMIC', 'THERMAL'], kind: 'jackhammer', baseCost: 19, baseDmg: 15, engScale: 0.8, cd: 0.72, range: 175, radius: 66, desc: 'Rapid pneumatic percussion bursts hammering straight into advancing packs with heavy knockback!' },
    { id: 'cryo_turret', name: 'Cryo Mister Tower', tags: ['ROBOTICS', 'VOLTAIC'], kind: 'turret_cryo', baseCost: 23, baseDmg: 13, engScale: 0.95, cd: 3.6, fireCd: 1.15, range: 260, maxActive: 2, desc: 'Deploys a liquid-nitrogen spritzer turret that blasts wide freezing frost bursts chilling whole packs!' },
    { id: 'laser_post', name: 'Laser Fence Post', tags: ['VOLTAIC', 'MINES'], kind: 'turret_laser', baseCost: 24, baseDmg: 20, engScale: 1.15, cd: 3.1, fireCd: 1.3, range: 310, maxActive: 3, desc: 'Plants glowing ruby emitter posts that project searing laser tripwires between every pair of posts!' },
    { id: 'meteor_mortar', name: 'Kinetic Rod Beacon', tags: ['MINES', 'ORBITAL'], kind: 'meteor', baseCost: 26, baseDmg: 46, engScale: 1.35, cd: 2.8, range: 430, radius: 96, desc: 'Calls down orbital tungsten rods from space onto dense enemy clusters for colossal crater impacts!' },
    { id: 'magnet_hammer', name: 'Mag-Sledge Arc', tags: ['SEISMIC', 'ORBITAL'], kind: 'hammer', baseCost: 20, baseDmg: 27, engScale: 0.95, cd: 1.45, radius: 122, desc: 'Sweeps a giant electromagnetic sledgehammer around your alien, smashing enemies away & pulling Scrap!' },
    { id: 'bio_garden', name: 'Bio-Reactor Garden', tags: ['ROBOTICS', 'THERMAL'], kind: 'garden', baseCost: 22, baseDmg: 14, engScale: 0.9, cd: 4.5, fireCd: 4.2, range: 240, maxActive: 2, desc: 'Hydroponic alien-tech pod that grows glowing Nano-Fruit heals on the floor (synergizes with Pickup builds)!' },

    // --- 10 MORE ZERO-GUN CONTRAPTIONS (Total: 40!) ---
    { id: 'steam_boiler', name: 'Pressure Steam Boiler', tags: ['THERMAL', 'SEISMIC'], kind: 'turret_steam', baseCost: 22, baseDmg: 21, engScale: 1.05, cd: 3.4, fireCd: 1.45, range: 170, radius: 118, maxActive: 2, desc: 'Deploys a pressurized brass boiler that vents 360° scalding steam shockwaves, burning & shoving crowds!' },
    { id: 'ion_beacon', name: 'Ion Sky-Laser', tags: ['ORBITAL', 'VOLTAIC'], kind: 'ion_laser', baseCost: 25, baseDmg: 42, engScale: 1.25, cd: 2.4, range: 430, radius: 74, desc: 'Locks an orbital satellite beam onto the toughest target, searing everything underneath with sky-fire!' },
    { id: 'chain_anchor', name: 'Tethered Wrecking Ball', tags: ['SEISMIC', 'ORBITAL'], kind: 'orbital_ball', baseCost: 22, baseDmg: 22, engScale: 0.88, cd: 0.4, radius: 138, desc: 'Swings a massive spiked tungsten demolition ball on an energy chain around your alien, crushing packs!' },
    { id: 'flame_turret', name: 'Foundry Flame-Jet', tags: ['ROBOTICS', 'THERMAL'], kind: 'turret_flame', baseCost: 23, baseDmg: 14, engScale: 1.0, cd: 3.6, fireCd: 0.42, range: 260, maxActive: 2, desc: 'Builds an automated smelter turret that sweeps wide cones of scorching furnace flames & ignites swarms!' },
    { id: 'magnet_mine', name: 'Vortex Scrap Mine', tags: ['MINES', 'VOLTAIC'], kind: 'magnet_mine', baseCost: 21, baseDmg: 24, engScale: 1.1, cd: 2.25, radius: 98, maxActive: 5, desc: 'Plants electromagnetic mines that yank enemies inward before blasting & magnetizing nearby Scrap!' },
    { id: 'drill_drone', name: 'Tunneler Mole-Bot', tags: ['ROBOTICS', 'SEISMIC'], kind: 'drill_drone', baseCost: 24, baseDmg: 28, engScale: 1.05, cd: 1.0, fireCd: 1.45, range: 410, maxActive: 1, desc: 'Autonomous subterranean robo-mole that burrows beneath packs and erupts in tectonic rock geysers!' },
    { id: 'prism_obelisk', name: 'Prism Refractor', tags: ['VOLTAIC', 'ORBITAL'], kind: 'turret_prism', baseCost: 25, baseDmg: 19, engScale: 1.15, cd: 3.7, fireCd: 1.1, range: 350, maxActive: 2, desc: 'Deploys a crystalline optical obelisk that fires refracting rainbow beams splitting across 4 targets!' },
    { id: 'shock_anvil', name: 'Pneumatic Drop-Anvil', tags: ['SEISMIC', 'MINES'], kind: 'drop_anvil', baseCost: 23, baseDmg: 40, engScale: 1.2, cd: 2.15, range: 360, radius: 88, desc: 'Hoists and drops a giant titanium forging anvil onto enemy clusters, flattening & stunning them!' },
    { id: 'frost_orbital', name: 'Cryo-Ring Satellite', tags: ['ORBITAL', 'VOLTAIC'], kind: 'orbital_frost', baseCost: 21, baseDmg: 15, engScale: 0.9, cd: 0.9, radius: 112, desc: 'Orbiting liquid-nitrogen dispenser that drops chilling frost mines behind it, freezing pursuers!' },
    { id: 'tar_sprayer', name: 'Slag-Tar Dispenser', tags: ['THERMAL', 'MINES'], kind: 'tar_sprayer', baseCost: 20, baseDmg: 15, engScale: 1.0, cd: 2.1, range: 330, radius: 84, desc: 'Launches molten industrial tar pools that heavily slow enemies AND ignite into roaring oil fires!' },

    // --- 10 SCI-FI & INDUSTRIAL ENGINEERING GUNS (Total: 50 Weapons & Contraptions!) ---
    { id: 'rivet_smg', name: 'Rivet SMG', tags: ['ROBOTICS', 'SEISMIC'], kind: 'gun_smg', baseCost: 19, baseDmg: 11, engScale: 0.65, cd: 0.24, range: 370, desc: 'Rapid-fire pneumatic rivet gun spraying a relentless stream of high-velocity steel rivets!' },
    { id: 'slag_shotgun', name: 'Slag Scattergun', tags: ['THERMAL', 'SEISMIC'], kind: 'gun_shotgun', baseCost: 22, baseDmg: 11, engScale: 0.72, cd: 1.12, range: 310, desc: 'Double-barrel molten-slag shotgun blasting a wide 5-pellet incendiary cone that ignites crowds!' },
    { id: 'rail_sniper', name: 'Gauss Rail-Rifle', tags: ['VOLTAIC', 'ORBITAL'], kind: 'gun_rail', baseCost: 25, baseDmg: 48, engScale: 1.25, cd: 1.85, range: 520, desc: 'Electromagnetic railgun firing a hyper-velocity piercing beam straight through entire enemy lines!' },
    { id: 'plasma_pistol', name: 'Plasma Sidearm', tags: ['VOLTAIC', 'THERMAL'], kind: 'gun_plasma', baseCost: 18, baseDmg: 17, engScale: 0.8, cd: 0.56, range: 390, desc: 'Sleek alien-tech pulse pistol firing rapid ricocheting plasma bolts that bounce between foes!' },
    { id: 'rotary_minigun', name: 'Vulcan Scrap-Cannon', tags: ['ROBOTICS', 'THERMAL'], kind: 'gun_minigun', baseCost: 26, baseDmg: 7, engScale: 0.58, cd: 0.17, range: 380, desc: 'Six-barrel rotary gatling cannon shredding swarms in an unstoppable storm of hot brass!' },
    { id: 'cryo_blaster', name: 'Frost-Shard Carbine', tags: ['VOLTAIC', 'ORBITAL'], kind: 'gun_cryo', baseCost: 21, baseDmg: 14, engScale: 0.85, cd: 0.82, range: 390, desc: 'Cryogenic burst rifle firing a 3-shard fan of piercing ice needles that freeze packs solid!' },
    { id: 'grenade_launcher', name: 'Thump Mortar-Gun', tags: ['MINES', 'SEISMIC'], kind: 'gun_grenade', baseCost: 24, baseDmg: 32, engScale: 1.1, cd: 1.48, range: 410, radius: 78, desc: 'Drum-fed demolition launcher firing explosive canisters that detonate in huge blast craters!' },
    { id: 'tesla_carbine', name: 'Arc-Lightning Rifle', tags: ['VOLTAIC', 'ROBOTICS'], kind: 'gun_tesla', baseCost: 23, baseDmg: 20, engScale: 1.0, cd: 0.88, range: 390, desc: 'Voltaic assault carbine firing crackling bolts that chain-zap 3 nearby enemies on impact!' },
    { id: 'acid_needle', name: 'Venom Nailgun', tags: ['THERMAL', 'MINES'], kind: 'gun_acid', baseCost: 20, baseDmg: 12, engScale: 0.75, cd: 0.36, range: 360, desc: 'Pressurized corrosive nailgun firing armor-shredding needles that burst into toxic acid splashes!' },
    { id: 'nova_cannon', name: 'Quantum Wave-Cannon', tags: ['ORBITAL', 'MINES'], kind: 'gun_nova', baseCost: 25, baseDmg: 34, engScale: 1.15, cd: 1.55, range: 420, desc: 'Fires massive piercing quantum shock-rings that cleave through swarms and yank Scrap inward!' },
    { id: 'plasma_flamethrower', name: 'Solar Plasma-Thrower', tags: ['THERMAL', 'ROBOTICS'], kind: 'gun_flamer', baseCost: 23, baseDmg: 6, engScale: 0.65, cd: 0.24, range: 295, desc: 'Sprays a scorching cone of neon solar plasma that melts swarms & stacks rapid Burn!' },
    { id: 'void_boomerang_gun', name: 'Singularity Disc-Gun', tags: ['ORBITAL', 'VOLTAIC'], kind: 'gun_disc', baseCost: 24, baseDmg: 28, engScale: 1.05, cd: 1.12, range: 440, desc: 'Launches piercing neon singularity discs that slice outward and boomerang straight back!' },

    // --- 8 MEGA-CORE EXPANSION WEAPONS & CONTRAPTIONS (60 Total!) ---
    { id: 'black_hole_cannon', name: 'Singularity Mortar', tags: ['ORBITAL', 'SEISMIC'], kind: 'gun_blackhole', baseCost: 26, baseDmg: 30, engScale: 1.15, cd: 2.05, range: 430, radius: 105, desc: 'Fires a slow-drifting miniature black hole that sucks nearby enemies inward & implodes!' },
    { id: 'prism_splitter', name: 'Refraction Prism-Gun', tags: ['VOLTAIC', 'ORBITAL'], kind: 'gun_prism', baseCost: 24, baseDmg: 22, engScale: 1.0, cd: 1.05, range: 440, desc: 'Fires a cyan focus-laser that refracts into 3 bonus beams on impact, slicing packs!' },
    { id: 'meteor_beacon', name: 'Orbital Drop-Beacon', tags: ['ORBITAL', 'THERMAL'], kind: 'meteor_beacon', baseCost: 25, baseDmg: 42, engScale: 1.25, cd: 2.25, range: 460, radius: 96, desc: 'Locks onto dense enemy clusters and calls down a scorching orbital slag meteor strike!' },
    { id: 'magma_lance', name: 'Magma Saw-Lance', tags: ['THERMAL', 'SEISMIC'], kind: 'gun_lance', baseCost: 23, baseDmg: 31, engScale: 1.05, cd: 1.28, range: 360, desc: 'Thrusts a piercing superheated plasma-lance straight through enemy rows, burning & shoving!' },
    { id: 'cryo_mortar', name: 'Glacier Shell-Cannon', tags: ['MINES', 'VOLTAIC'], kind: 'gun_cryo_mortar', baseCost: 23, baseDmg: 26, engScale: 1.05, cd: 1.55, range: 420, radius: 92, desc: 'Lobs shattering cryo-shells that erupt into freezing frost-zones, locking swarms in ice!' },
    { id: 'shield_drone', name: 'Aegis Guardian Drone', tags: ['ROBOTICS', 'ORBITAL'], kind: 'shield_drone', baseCost: 25, baseDmg: 15, engScale: 0.9, cd: 1.0, fireCd: 0.72, range: 360, maxActive: 1, desc: 'Autonomous shield-bot that orbits you, zaps threats, restores +4 Energy Shield & intercepts bullets!' },
    { id: 'seismic_pilebunker', name: 'Tectonic Pilebunker', tags: ['SEISMIC', 'ROBOTICS'], kind: 'pilebunker', baseCost: 22, baseDmg: 34, engScale: 1.1, cd: 1.5, range: 280, radius: 135, desc: 'Fires twin directional pneumatic shock-cones that shred enemy armor and launch packs backward!' },
    { id: 'arc_mine', name: 'Storm-Coil Mine', tags: ['MINES', 'VOLTAIC'], kind: 'arc_mine', baseCost: 22, baseDmg: 25, engScale: 1.1, cd: 2.1, radius: 82, maxActive: 5, desc: 'Plants voltaic mines that arc live chain-lightning between nearby mines & detonate in a storm!' }
  ];

  // ==========================================================================
  // 62 BROTATO-INSPIRED PASSIVE MODULES (Infinite Build Synergies & Trade-Offs)
  // ==========================================================================
  const MODULES = [
    // --- ON-PICKUP & LUCK-PROC ARCHETYPE (Baby Elephant, Cyberball, Spicy Sauce!) ---
    { id: 'luck_emitter', name: 'Luck-Core Emitter', tier: 1, cost: 22, icon: 'icon:clover', tag: 'Proc', desc: 'Picking up Scrap has a 30% chance to fire a homing bolt dealing 10 + 1.1× Luck dmg! (+5 Luck)', mods: { luck: 5 }, special: 'pickupBolt' },
    { id: 'shrapnel_cap', name: 'Shrapnel Capacitor', tier: 2, cost: 34, icon: 'icon:chip', tag: 'Proc', desc: '28% chance on enemy death to launch a bouncing orb dealing 12 + 1.2× Luck dmg! (+6 Luck)', mods: { luck: 6 }, special: 'killOrb' },
    { id: 'spicy_fruit', name: 'Volatile Nano-Fruit', tier: 2, cost: 30, icon: 'icon:fruit', tag: 'Proc', desc: 'Crates & Nano-Fruits explode on pickup for 20 + 40% Max HP AoE damage! (+8 Max HP)', mods: { maxHp: 8 }, special: 'spicyFruit' },
    { id: 'scrap_turbo', name: 'Kinetic Scrap Thruster', tier: 1, cost: 19, icon: 'icon:boots', tag: 'Proc', desc: '+45 Magnet, +6 Luck. Collecting Scrap grants brief +12% Move Speed.', mods: { magnet: 45, luck: 6 }, special: 'scrapSpeed' },
    { id: 'quantum_scav', name: 'Quantum Scavenger', tier: 1, cost: 20, icon: 'icon:clover', tag: 'Economy', desc: '+14 Luck, +8 Harvesting, -3% Damage.', mods: { luck: 14, harvesting: 8, damagePct: -3 } },

    // --- ECONOMY, HARVESTING & RISK/REWARD (Piggy Bank, Gentle Alien, Coupon, Crown!) ---
    { id: 'piggy_vault', name: 'Piggy Vault Module', tier: 2, cost: 32, icon: 'icon:piggy', tag: 'Economy', desc: 'Start every wave with +15% interest on your unspent Scrap! (+2 Armor)', mods: { armor: 2 }, special: 'piggyBank' },
    { id: 'swarm_beacon', name: 'Swarm Beacon', tier: 1, cost: 20, icon: 'icon:beacon', tag: 'Risk', desc: '+18% More Enemies spawn (more XP & Scrap!), +6 Max HP, +8% Damage.', mods: { maxHp: 6, damagePct: 8, enemyCountPct: 18 } },
    { id: 'voucher', name: 'Workshop Voucher', tier: 1, cost: 24, icon: 'icon:voucher', tag: 'Economy', desc: '-8% Shop item & contraption prices (stackable!).', mods: { shopDiscountPct: 8 } },
    { id: 'recycler', name: 'Scrap Recycler', tier: 1, cost: 21, icon: 'icon:scrap', tag: 'Economy', desc: '+25% extra Scrap from selling tools, +7 Harvesting.', mods: { harvesting: 7, sellBonusPct: 25 } },
    { id: 'hydro_ext', name: 'Hydroponic Extractor', tier: 1, cost: 18, icon: 'icon:fruit', tag: 'Economy', desc: '+12 Harvesting, -2% Damage.', mods: { harvesting: 12, damagePct: -2 } },
    { id: 'compound_core', name: 'Compound Core', tier: 3, cost: 52, icon: 'icon:piggy', tag: 'Economy', desc: 'Harvesting grows an extra +8% at the end of every wave! (+10 Harvesting)', mods: { harvesting: 10 }, special: 'crownHarvest' },
    { id: 'blood_siphon', name: 'Blood-Scrap Siphon', tier: 2, cost: 30, icon: 'icon:vampire', tag: 'Risk', desc: 'Lose 1 HP every 2.5s in combat, gain +28 Harvesting & +10% Move Speed!', mods: { harvesting: 28, speedPct: 10 }, special: 'bloodDonate' },
    { id: 'crate_scanner', name: 'Crate Scanner Array', tier: 2, cost: 28, icon: 'icon:crate', tag: 'Economy', desc: '+25% Loot Crate drop odds from enemies, +10 Luck.', mods: { luck: 10, crateLuckPct: 25 } },
    { id: 'tractor_beam', name: 'Tractor Magnet Coil', tier: 1, cost: 17, icon: 'icon:magnet', tag: 'Economy', desc: '+55 Pickup Magnet, +6 Harvesting.', mods: { magnet: 55, harvesting: 6 } },

    // --- STATUS, BURN & EXPLOSION CHAINS (Scared Sausage, Snake, Rip & Tear!) ---
    { id: 'pyro_injector', name: 'Pyro Injector', tier: 1, cost: 22, icon: 'icon:reactor', tag: 'Status', desc: 'ALL contraptions gain 25% chance to Burn foes (scales with Engineering)!', mods: { engineering: 3 }, special: 'allBurn' },
    { id: 'thermal_contagion', name: 'Thermal Contagion', tier: 2, cost: 29, icon: 'icon:reactor', tag: 'Status', desc: 'Burning spreads to +1 extra nearby enemy on death! (+12% Area, -2% Speed)', mods: { areaPct: 12, speedPct: -2 }, special: 'spreadBurn' },
    { id: 'volatile_casing', name: 'Volatile Casing', tier: 2, cost: 34, icon: 'icon:beacon', tag: 'Status', desc: '22% chance on enemy death to explode for 16 + 1.0× Engineering AoE damage!', mods: { areaPct: 10 }, special: 'deathExplode' },
    { id: 'shaped_charge', name: 'Shaped Charge Matrix', tier: 2, cost: 32, icon: 'icon:radar', tag: 'Status', desc: '+26% Blast & Effect Area, +8% Damage, -2% Move Speed.', mods: { areaPct: 26, damagePct: 8, speedPct: -2 } },
    { id: 'cryo_static', name: 'Cryo-Static Relay', tier: 2, cost: 33, icon: 'icon:chip', tag: 'Status', desc: 'Hitting Chilled enemies arcs lightning to 2 nearby foes! (+8% Crit Chance)', mods: { critChance: 8 }, special: 'cryoArc' },

    // --- PURE ENGINEERING & TURRET SPECIALISTS (Pocket Factory, Improved Tools, Landmines!) ---
    { id: 'pocket_foundry', name: 'Pocket Foundry', tier: 3, cost: 50, icon: 'icon:factory', tag: 'Engineering', desc: '+8 Engineering. Killing enemies has a 7% chance to spawn a mini Gear Turret!', mods: { engineering: 8 }, special: 'pocketFactory' },
    { id: 'improved_tools', name: 'Overclocked Toolbelt', tier: 2, cost: 35, icon: 'icon:wrench', tag: 'Engineering', desc: '+14% Attack Speed, +8 Engineering; Attack Speed boosts turrets even faster! (-4% Dmg)', mods: { attackSpeedPct: 14, engineering: 8, damagePct: -4 }, special: 'improvedTools' },
    { id: 'auto_miner', name: 'Auto-Mine Dispenser', tier: 2, cost: 30, icon: 'icon:gear', tag: 'Engineering', desc: 'Automatically drops a free Proximity Mine every 5.5s (scales with Engineering)!', mods: { engineering: 4 }, special: 'autoMine' },
    { id: 'factory_ai', name: 'Swarm Assembly AI', tier: 3, cost: 54, icon: 'icon:factory', tag: 'Engineering', desc: '+1 Max Deployable on all Turrets/Mines, +12% Attack Speed, -3% Speed.', mods: { attackSpeedPct: 12, engineering: 8, speedPct: -3 }, special: 'extraDeployCap' },
    { id: 'wrench_kit', name: 'Master Wrench Kit', tier: 1, cost: 19, icon: 'icon:wrench', tag: 'Engineering', desc: '+7 Engineering, +8% Area.', mods: { engineering: 7, areaPct: 8 } },
    { id: 'robot_arm', name: 'Hydraulic Servo Arm', tier: 2, cost: 32, icon: 'icon:robot_arm', tag: 'Engineering', desc: '+11 Engineering, +10% Attack Speed.', mods: { engineering: 11, attackSpeedPct: 10 } },
    { id: 'blueprint', name: 'Prototype Blueprint', tier: 2, cost: 34, icon: 'icon:bulb', tag: 'Engineering', desc: '+15 Engineering, +10 Luck, -1 Armor.', mods: { engineering: 15, luck: 10, armor: -1 } },

    // --- GLASS CANNONS, SPEED-SCALING & TRADE-OFFS (Coffee, Glass Cannon, Power Generator, Statue!) ---
    { id: 'espresso_coolant', name: 'Espresso Coolant', tier: 1, cost: 18, icon: 'icon:battery', tag: 'Trade-Off', desc: '+15% Attack Speed, -3% Damage.', mods: { attackSpeedPct: 15, damagePct: -3 } },
    { id: 'glass_resonator', name: 'Glass Resonator', tier: 2, cost: 32, icon: 'icon:reactor', tag: 'Trade-Off', desc: '+28% Global Damage, -4 Armor!', mods: { damagePct: 28, armor: -4 } },
    { id: 'power_gen', name: 'Kinetic Thruster Core', tier: 3, cost: 52, icon: 'icon:boots', tag: 'Build-Around', desc: 'Gain +1% Damage for every +1% Move Speed bonus! (+10% Speed, -5% Base Dmg)', mods: { speedPct: 10, damagePct: -5 }, special: 'speedToDmg' },
    { id: 'bunker_anchor', name: 'Bunker Anchor', tier: 2, cost: 34, icon: 'icon:shield', tag: 'Build-Around', desc: 'Standing still grants +40% Attack Speed & +6 Armor! (-8% Move Speed)', mods: { speedPct: -8 }, special: 'statueBuff' },
    { id: 'adrenaline_relay', name: 'Adrenaline Relay', tier: 3, cost: 48, icon: 'icon:heart', tag: 'Build-Around', desc: '+8% Dodge. Dodging a hit or Jet-Dashing heals +3 HP & boosts Speed!', mods: { dodge: 8 }, special: 'adrenaline' },
    { id: 'pain_feedback', name: 'Pain-Feedback Loop', tier: 2, cost: 31, icon: 'icon:reactor', tag: 'Trade-Off', desc: 'Taking damage unleashes a shockwave & grants +20% Damage for 4s! (+10 Max HP)', mods: { maxHp: 10 }, special: 'painShock' },
    { id: 'overclock_cell', name: 'Overclocked Reactor', tier: 2, cost: 35, icon: 'icon:reactor', tag: 'Trade-Off', desc: '+24% Attack Speed, +10% Damage, -10 Max HP.', mods: { attackSpeedPct: 24, damagePct: 10, maxHp: -10 } },
    { id: 'tungsten_hull', name: 'Tungsten Exo-Chassis', tier: 2, cost: 34, icon: 'icon:shield', tag: 'Trade-Off', desc: '+30 Max HP, +5 Armor, -6% Move Speed.', mods: { maxHp: 30, armor: 5, speedPct: -6 } },
    { id: 'vamp_leech', name: 'Vampiric Nano-Leech', tier: 2, cost: 30, icon: 'icon:vampire', tag: 'Sustain', desc: '+6% Life Steal (chance on hit to heal 1 HP), +6% Crit, -1.0 HP/s Regen.', mods: { lifeSteal: 6, critChance: 6, hpRegen: -1.0 } },
    { id: 'siphon_bat', name: 'Siphon Cell', tier: 3, cost: 46, icon: 'icon:vampire', tag: 'Sustain', desc: '+11% Life Steal, +8% Attack Speed, -12 Max HP.', mods: { lifeSteal: 11, attackSpeedPct: 8, maxHp: -12 } },
    { id: 'cursed_core', name: 'Cursed Overclock Core', tier: 3, cost: 48, icon: 'icon:skull_curse', tag: 'Cursed', desc: '+35% Damage, +18% Attack Speed, +15% Scrap — BUT enemies move 10% faster & deal +12% dmg!', mods: { damagePct: 35, attackSpeedPct: 18, scrapPct: 15, curseLevel: 1 } },
    { id: 'cursed_mirror', name: 'Cursed Prism Lens', tier: 4, cost: 72, icon: 'icon:skull_curse', tag: 'Cursed', desc: '+25% Crit Chance, +30% Area, +20 Engineering — BUT +15% enemy speed & damage!', mods: { critChance: 25, areaPct: 30, engineering: 20, curseLevel: 1 } },

    // --- DEFENSE, DODGE & SURVIVABILITY (Tardigrade, Phase Cloak, Thorns!) ---
    { id: 'tardigrade', name: 'Tardigrade Shell', tier: 2, cost: 34, icon: 'icon:tardigrade', tag: 'Defense', desc: 'Nullifies the FIRST hit you take every wave completely! (Stackable charges!)', mods: { maxHp: 6 }, special: 'tardigrade' },
    { id: 'phase_cloak', name: 'Phase-Shift Cloak', tier: 2, cost: 30, icon: 'icon:boots', tag: 'Defense', desc: '+12% Dodge Chance (max 60%), +6% Move Speed, -3% Damage.', mods: { dodge: 12, speedPct: 6, damagePct: -3 } },
    { id: 'evasive_gyro', name: 'Evasive Gyroscope', tier: 1, cost: 21, icon: 'icon:gear', tag: 'Defense', desc: '+8% Dodge Chance, -12% Dash Cooldown.', mods: { dodge: 8, dashCdPct: -12 } },
    { id: 'spiked_bumper', name: 'Spiked Bumper', tier: 2, cost: 28, icon: 'icon:shield', tag: 'Defense', desc: '+3 Armor, +10 Max HP. Contact attackers take 25 + 4× Armor shock damage!', mods: { armor: 3, maxHp: 10 }, special: 'thorns' },
    { id: 'nano_fairy', name: 'Nano-Fairy Swarm', tier: 2, cost: 33, icon: 'icon:fruit', tag: 'Sustain', desc: '+1.2 HP/s Regen for every Mk.I tool equipped (+1.5 base Regen), -2 Armor.', mods: { hpRegen: 1.5, armor: -2 }, special: 'fairyRegen' },
    { id: 'plating', name: 'Ceramic Hull Plating', tier: 1, cost: 19, icon: 'icon:shield', tag: 'Defense', desc: '+16 Max HP, +2 Armor.', mods: { maxHp: 16, armor: 2 } },
    { id: 'nano_gel', name: 'Nano-Repair Gel', tier: 1, cost: 20, icon: 'icon:heart', tag: 'Sustain', desc: '+12 Max HP, +1.5 HP/s Regen.', mods: { maxHp: 12, hpRegen: 1.5 } },
    { id: 'med_drone', name: 'Bio-Gel Injector', tier: 2, cost: 32, icon: 'icon:heart', tag: 'Sustain', desc: '+22 Max HP, +2.6 HP/s Regen, -2% Attack Speed.', mods: { maxHp: 22, hpRegen: 2.6, attackSpeedPct: -2 } },

    // --- CORE TECH & LEGENDARY BUILD-FINISHERS ---
    { id: 'microchip', name: 'Logic Microchip', tier: 1, cost: 18, icon: 'icon:chip', tag: 'Core', desc: '+5 Engineering, +6% Attack Speed.', mods: { engineering: 5, attackSpeedPct: 6 } },
    { id: 'power_cell', name: 'Mint Power Cell', tier: 1, cost: 18, icon: 'icon:battery', tag: 'Core', desc: '+9% Attack Speed, +8% Move Speed.', mods: { attackSpeedPct: 9, speedPct: 8 } },
    { id: 'servo_boots', name: 'Servo Thruster Boots', tier: 1, cost: 19, icon: 'icon:boots', tag: 'Core', desc: '+13% Move Speed, -10% Dash Cooldown.', mods: { speedPct: 13, dashCdPct: -10 } },
    { id: 'gear_oil', name: 'Synthetic Gear Oil', tier: 1, cost: 20, icon: 'icon:gear', tag: 'Core', desc: '+11% Damage, +5% Attack Speed.', mods: { damagePct: 11, attackSpeedPct: 5 } },
    { id: 'radar_dish', name: 'Target-Lock Radar', tier: 1, cost: 20, icon: 'icon:radar', tag: 'Core', desc: '+9% Crit Chance, +10% Area.', mods: { critChance: 9, areaPct: 10 } },
    { id: 'alloy_rivets', name: 'Alloy Rivet Pack', tier: 1, cost: 17, icon: 'icon:wrench', tag: 'Core', desc: '+8 Max HP, +4 Engineering, +1 Armor.', mods: { maxHp: 8, engineering: 4, armor: 1 } },
    { id: 'cryo_coolant', name: 'Liquid-N2 Coolant', tier: 2, cost: 32, icon: 'icon:battery', tag: 'Core', desc: '+15% Attack Speed, -15% Dash Cooldown.', mods: { attackSpeedPct: 15, dashCdPct: -15 } },
    { id: 'quantum_core', name: 'Quantum Cube Core', tier: 3, cost: 52, icon: 'icon:cube', tag: 'Core', desc: '+20 Engineering, +16% Damage, +14% Area.', mods: { engineering: 20, damagePct: 16, areaPct: 14 } },
    { id: 'kinetic_cap', name: 'Kinetic Dash Capacitor', tier: 3, cost: 50, icon: 'icon:battery', tag: 'Proc', desc: 'Jet-Dashing zaps 5 nearby enemies with heavy lightning! (-18% Dash Cooldown, +8% Crit)', mods: { dashCdPct: -18, critChance: 8 }, special: 'dashLightning' },
    { id: 'phase_boots', name: 'Phase-Shift Thrusters', tier: 3, cost: 48, icon: 'icon:boots', tag: 'Defense', desc: '+20% Move Speed, +10% Dodge, -20% Dash Cooldown.', mods: { speedPct: 20, dodge: 10, dashCdPct: -20 } },
    { id: 'thermal_core', name: 'Superheated Slag Core', tier: 3, cost: 52, icon: 'icon:reactor', tag: 'Trade-Off', desc: '+26% Damage, +20% Area, +12% Crit Chance, -12 Max HP.', mods: { damagePct: 26, areaPct: 20, critChance: 12, maxHp: -12 } },
    { id: 'omega_matrix', name: 'Omega Blueprint Matrix', tier: 4, cost: 82, icon: 'icon:cube', tag: 'Legendary', desc: '+28 Engineering, +22% Damage, +18% Attack Speed, +18% Area!', mods: { engineering: 28, damagePct: 22, attackSpeedPct: 18, areaPct: 18 } },
    { id: 'aegis_dome', name: 'Aegis Orbital Dome', tier: 4, cost: 78, icon: 'icon:shield', tag: 'Legendary', desc: '+42 Max HP, +7 Armor, +3.0 HP/s Regen, auto-generates an absorbing Energy Shield every 10s!', mods: { maxHp: 42, armor: 7, hpRegen: 3.0 }, special: 'aegisShield' },
    { id: 'singularity_lens', name: 'Singularity Overdrive', tier: 4, cost: 80, icon: 'icon:bulb', tag: 'Legendary', desc: '+24% Crit Chance, +28% Attack Speed, +18% Move Speed, +15 Luck.', mods: { critChance: 24, attackSpeedPct: 28, speedPct: 18, luck: 15 } },
    { id: 'golden_drill', name: 'Midas Core Extractor', tier: 4, cost: 74, icon: 'icon:piggy', tag: 'Legendary', desc: '+30 Harvesting, +25% Scrap Earned, +22 Luck, +16% Damage!', mods: { harvesting: 30, scrapPct: 25, luck: 22, damagePct: 16 } },
    { id: 'titan_frame', name: 'Titan Exoskeleton', tier: 4, cost: 76, icon: 'icon:robot_arm', tag: 'Legendary', desc: '+56 Max HP, +9 Armor, +18% Damage, +15% Area.', mods: { maxHp: 56, armor: 9, damagePct: 18, areaPct: 15 } },

    // --- 22 MORE BROTATO-INSPIRED BUILD-AROUND MODULES (Total: 84!) ---
    { id: 'optic_ring', name: 'Orbital Eye Emitter', tier: 2, cost: 34, icon: 'icon:prism', tag: 'Proc', desc: 'Every 3.2s fires 6 homing plasma bolts dealing 8 + 20% Max HP damage! (+6 Max HP)', mods: { maxHp: 6 }, special: 'opticRing' },
    { id: 'crit_bounty', name: 'Crit Salvage Trophy', tier: 3, cost: 48, icon: 'icon:piggy', tag: 'Economy', desc: '+8% Crit Chance. Killing an enemy with a Crit has a 35% chance to drop +2 bonus Scrap!', mods: { critChance: 8 }, special: 'critBounty' },
    { id: 'crit_siphon', name: 'Crit Nano-Tentacle', tier: 2, cost: 32, icon: 'icon:vampire', tag: 'Sustain', desc: '+7% Crit Chance. Critical hits have a 25% chance to heal +1 HP!', mods: { critChance: 7 }, special: 'critHeal' },
    { id: 'dodge_overclock', name: 'Evasive Overclock Rig', tier: 4, cost: 74, icon: 'icon:rocket', tag: 'Build-Around', desc: 'Gain +1.5% Attack Speed for every 1% Dodge you have! (+8% Dodge, -4 Armor)', mods: { dodge: 8, armor: -4 }, special: 'dodgeToAspd' },
    { id: 'scrap_armor', name: 'Scrap-Plated Padding', tier: 3, cost: 50, icon: 'icon:shield', tag: 'Defense', desc: 'Gain +1 Max HP for every 12 Scrap currently held! (+8 Max HP, +10 Harvesting)', mods: { maxHp: 8, harvesting: 10 }, special: 'scrapToHp' },
    { id: 'vigilante_core', name: 'Vigilante Escalator', tier: 3, cost: 52, icon: 'icon:hourglass', tag: 'Build-Around', desc: 'Permanently gain +4% Global Damage at the end of EVERY wave! (+6% Damage now)', mods: { damagePct: 6 }, special: 'vigilanteDmg' },
    { id: 'forge_anvil', name: 'Master Forge Anvil', tier: 4, cost: 78, icon: 'icon:anvil', tag: 'Engineering', desc: 'Upgrades 1 random equipped Contraption by +1 Mk Tier every wave (+2 Armor if all Mk.IV)!', mods: { engineering: 8 }, special: 'forgeAnvil' },
    { id: 'boss_breaker', name: 'Titan Core-Breaker', tier: 2, cost: 30, icon: 'icon:rocket', tag: 'Core', desc: 'Deal +28% bonus damage to Bosses & Heavy Brutes! (+6% Crit Chance)', mods: { critChance: 6 }, special: 'bossBreaker' },
    { id: 'heavy_couch', name: 'Heavy Dampener Rig', tier: 3, cost: 44, icon: 'icon:medkit', tag: 'Trade-Off', desc: '+28 Max HP, +4.0 HP/s Regen, +3 Armor — BUT -14% Move Speed!', mods: { maxHp: 28, hpRegen: 4.0, armor: 3, speedPct: -14 } },
    { id: 'relic_magnet', name: 'Singularity Relic', tier: 3, cost: 52, icon: 'icon:magnet', tag: 'Economy', desc: '+120 Pickup Magnet, +15 Luck. Every 4s pulls ALL Scrap on the arena straight to you!', mods: { magnet: 120, luck: 15 }, special: 'relicPull' },
    { id: 'wave_peacock', name: 'Overdrive Signal Dish', tier: 2, cost: 28, icon: 'icon:beacon', tag: 'Risk', desc: '+25% XP earned & +14 Harvesting — BUT enemies deal +12% more damage!', mods: { harvesting: 14, xpPct: 25, curseLevel: 1 } },
    { id: 'cursed_shackles', name: 'Cursed Lead Shackles', tier: 3, cost: 48, icon: 'icon:skull_curse', tag: 'Cursed', desc: '+18 Engineering, +22% Attack Speed, +8 Armor, +15% Area — BUT -16% Speed & +1 Curse!', mods: { engineering: 18, attackSpeedPct: 22, armor: 8, areaPct: 15, speedPct: -16, curseLevel: 1 } },
    { id: 'strange_manual', name: 'Forbidden Eng. Manual', tier: 3, cost: 54, icon: 'icon:prism', tag: 'Build-Around', desc: '+12 Engineering, +10% Area. Every 2 Engineering also grants +1% Global Damage!', mods: { engineering: 12, areaPct: 10 }, special: 'engToDmg' },
    { id: 'auto_med_tower', name: 'Field Med-Dispenser', tier: 2, cost: 34, icon: 'icon:medkit', tag: 'Sustain', desc: 'Automatically deploys a Field Med-Pod that drops a +6 HP Nano-Fruit every 8s! (+6 Max HP)', mods: { maxHp: 6 }, special: 'autoMedFruit' },
    { id: 'chain_coil', name: 'Superconductor Coil', tier: 2, cost: 32, icon: 'icon:coil', tag: 'Status', desc: '+10% Crit Chance, +1 Chain Lightning Bounce on all arc & prism weapons!', mods: { critChance: 10 }, special: 'extraChain' },
    { id: 'blast_shrapnel', name: 'Fragmentation Matrix', tier: 2, cost: 31, icon: 'icon:beacon', tag: 'Proc', desc: '+14% Area. Every explosion & mine detonation launches 4 piercing shrapnel bolts!', mods: { areaPct: 14 }, special: 'blastShrapnel' },
    { id: 'dash_bomb', name: 'Jet-Dash Mine Dropper', tier: 1, cost: 21, icon: 'icon:rocket', tag: 'Proc', desc: '-10% Dash Cooldown. Every Jet-Dash leaves behind a live explosive Proximity Mine!', mods: { dashCdPct: -10 }, special: 'dashMine' },
    { id: 'salvage_interest', name: 'Compound Salvage Bin', tier: 2, cost: 30, icon: 'icon:voucher', tag: 'Economy', desc: '+8 Harvesting. Uncollected Scrap in your Salvage Bag drops at 3× value next wave!', mods: { harvesting: 8 }, special: 'salvage3x' },
    { id: 'frost_shatter', name: 'Brittle-Cryo Catalyst', tier: 2, cost: 32, icon: 'icon:prism', tag: 'Status', desc: '+8 Engineering. Chilled enemies take +22% bonus damage from all contraptions!', mods: { engineering: 8 }, special: 'frostShatter' },
    { id: 'shield_battery', name: 'Capacitor Barrier', tier: 2, cost: 31, icon: 'icon:coil', tag: 'Defense', desc: '+2 Armor, +8 Max HP. Start every wave with a +25 HP absorbing Energy Shield!', mods: { armor: 2, maxHp: 8 }, special: 'waveShield' },
    { id: 'berserk_furnace', name: 'Low-HP Overdrive', tier: 2, cost: 33, icon: 'icon:reactor', tag: 'Risk', desc: '+12 Max HP. Gain up to +45% Attack Speed & +30% Damage as your HP drops!', mods: { maxHp: 12 }, special: 'berserkLowHp' },
    { id: 'cursed_grimoire', name: 'Cursed Blueprint Cube', tier: 4, cost: 72, icon: 'icon:skull_curse', tag: 'Cursed', desc: '+40% Damage, +25 Engineering, +25 Luck, +20% Scrap — BUT +2 Curse (faster, deadlier swarms)!', mods: { damagePct: 40, engineering: 25, luck: 25, scrapPct: 20, curseLevel: 2 } },

    // --- 10 LOYAL BROTATO-STYLE COMPANION PETS (Total: 94 Items & Pets!) ---
    { id: 'pet_loot_worm', name: 'Loot Worm', tier: 2, cost: 30, icon: 'pet:loot_worm', tag: 'Pet', petId: 'loot_worm', desc: 'PET: Adorable armored worm that slithers across the entire arena gobbling up Scrap, Fruits & Crates for you! (+10 Harvesting)', mods: { harvesting: 10 } },
    { id: 'pet_catling', name: 'Catling Gun', tier: 3, cost: 48, icon: 'pet:catling', tag: 'Pet', petId: 'catling', desc: 'PET: Visor-wearing space-cat with a mini rotary cannon on its back that sprays rapid bullet bursts! (+8% Attack Speed)', mods: { attackSpeedPct: 8 } },
    { id: 'pet_blazemander', name: 'Blazemander', tier: 2, cost: 34, icon: 'pet:blazemander', tag: 'Pet', petId: 'blazemander', desc: 'PET: Fiery magma salamander companion that spits molten fireballs and leaves scorching lava trails! (+10% Damage)', mods: { damagePct: 10 } },
    { id: 'pet_frost_pup', name: 'Cryo-Robo Pup', tier: 2, cost: 32, icon: 'pet:frost_pup', tag: 'Pet', petId: 'frost_pup', desc: 'PET: Loyal robotic puppy that leaps into swarms, barking freezing cryo shockwaves! (+6 Engineering, +5% Crit)', mods: { engineering: 6, critChance: 5 } },
    { id: 'pet_volt_ferret', name: 'Volt-Ferret', tier: 2, cost: 33, icon: 'pet:volt_ferret', tag: 'Pet', petId: 'volt_ferret', desc: 'PET: Hyperactive electric ferret zipping between enemies and zapping them with chain lightning! (+8% Move Speed)', mods: { speedPct: 8 } },
    { id: 'pet_medic_bee', name: 'Nano-Bumblebot', tier: 2, cost: 32, icon: 'pet:medic_bee', tag: 'Pet', petId: 'medic_bee', desc: 'PET: Chubby mechanical honeybee hovering nearby that grows +6 HP Nano-Fruits & stings threats! (+1.5 HP/s Regen)', mods: { hpRegen: 1.5 } },
    { id: 'pet_mine_crab', name: 'Sap-Crab', tier: 2, cost: 31, icon: 'pet:mine_crab', tag: 'Pet', petId: 'mine_crab', desc: 'PET: Hard-hatted mechanical crab that scuttles into packs and plants live mini Proximity Mines! (+10% Area)', mods: { areaPct: 10 } },
    { id: 'pet_void_owl', name: 'Quantum Owl', tier: 3, cost: 46, icon: 'pet:void_owl', tag: 'Pet', petId: 'void_owl', desc: 'PET: Sleek hovering owl-bot that snipes the highest-HP enemy or Boss with piercing violet lasers! (+10% Crit)', mods: { critChance: 10 } },
    { id: 'pet_slime_cube', name: 'Gelatinous Salvager', tier: 1, cost: 22, icon: 'pet:slime_cube', tag: 'Pet', petId: 'slime_cube', desc: 'PET: Bouncy mint alien slime buddy that hops onto enemies to squish them & duplicates 25% of Scrap it touches! (+8 Luck)', mods: { luck: 8 } },
    { id: 'pet_mech_rex', name: 'Mini Mecha-Rex', tier: 4, cost: 74, icon: 'pet:mech_rex', tag: 'Pet', petId: 'mech_rex', desc: 'LEGENDARY PET: Pint-sized steel T-Rex that stomps forward with seismic shockwaves & breathes molten slag! (+18 Max HP, +15% Dmg)', mods: { maxHp: 18, damagePct: 15 } },
    { id: 'pet_laser_mantis', name: 'Laser Mantis', tier: 3, cost: 48, icon: 'pet:laser_mantis', tag: 'Pet', petId: 'laser_mantis', desc: 'PET: Cyber-mantis assassin that blinks behind high-HP threats for guaranteed-crit neon plasma slashes! (+12% Crit)', mods: { critChance: 12 } },
    { id: 'pet_grav_jelly', name: 'Gravity Jelly', tier: 3, cost: 46, icon: 'pet:grav_jelly', tag: 'Pet', petId: 'grav_jelly', desc: 'PET: Bioluminescent void jellyfish pulsing gravity rings that slow & pull enemy packs together! (+12% Area)', mods: { areaPct: 12 } },

    // --- 4 BUILD-DEFINING LEGENDARY & SYNERGY MODULES (100 Items & Pets Total!) ---
    { id: 'overclock_heart', name: 'Overclock Core', tier: 3, cost: 44, icon: 'icon:reactor', tag: 'Build-Around', desc: '+16% Attack Speed & +35% faster [E] Ultimate Charge! (-10 Max HP)', mods: { attackSpeedPct: 16, maxHp: -10 }, special: 'ultChargeBoost' },
    { id: 'vampiric_fang', name: 'Nano-Leech Injector', tier: 3, cost: 42, icon: 'icon:vampire', tag: 'Sustain', desc: '+8% Life Steal & +12% Damage (-1.5 HP/s Regen)', mods: { lifeSteal: 8, damagePct: 12, hpRegen: -1.5 } },
    { id: 'lucky_dice', name: 'Quantum Loaded Dice', tier: 2, cost: 34, icon: 'icon:clover', tag: 'Risk', desc: '+22 Luck & +15% Crit Chance (-1 Armor)', mods: { luck: 22, critChance: 15, armor: -1 } },
    { id: 'titan_battery', name: 'Aegis Capacitor', tier: 4, cost: 70, icon: 'icon:shield', tag: 'Legendary', desc: '+4 Armor. Start every wave with +45 Energy Shield & deal +22% Damage while shielded!', mods: { armor: 4 }, special: 'shieldAmp' },

    // --- 4 NEW COMPANION PETS (16 Total Pets!) ---
    { id: 'pet_chrono_fox', name: 'Chrono-Fox', tier: 3, cost: 48, icon: 'pet:chrono_fox', tag: 'Pet', petId: 'chrono_fox', desc: 'PET: Sleek golden clockwork fox that dashes through packs leaving time-slow bubbles & swift slashes! (+10% Move Speed)', mods: { speedPct: 10 } },
    { id: 'pet_magma_turtle', name: 'Magma Tortoise', tier: 2, cost: 34, icon: 'pet:magma_turtle', tag: 'Pet', petId: 'magma_turtle', desc: 'PET: Armored volcanic tortoise that patrols beside you, intercepts enemy bullets & stomps magma rings! (+3 Armor)', mods: { armor: 3 } },
    { id: 'pet_plasma_jelly', name: 'Nebula Jellyfish', tier: 3, cost: 46, icon: 'pet:plasma_jelly', tag: 'Pet', petId: 'plasma_jelly', desc: 'PET: Bioluminescent alien jelly that tethers a continuous violet drain-beam to enemies & heals you +1 HP every 3s! (+8 Max HP)', mods: { maxHp: 8 } },
    { id: 'pet_mini_ufo', name: 'Saucer Scout', tier: 4, cost: 76, icon: 'pet:mini_ufo', tag: 'Pet', petId: 'mini_ufo', desc: 'LEGENDARY PET: Hovering alien UFO that fires sweeping orbital beam-strikes & tractor-beams Scrap straight to you! (+12% Crit, +15 Luck)', mods: { critChance: 12, luck: 15 } },

    // --- 8 NEW MEGA-CORE EXPANSION MODULES (112 Total Items & Pets!) ---
    { id: 'echo_capacitor', name: 'Echo Strike Coil', tier: 3, cost: 48, icon: 'icon:coil', tag: 'Proc', desc: '+10% Attack Speed. 18% chance on any hit to echo a bonus 50% neon shock-strike!', mods: { attackSpeedPct: 10 }, special: 'echoStrike' },
    { id: 'nova_core', name: 'Deca-Nova Reactor', tier: 3, cost: 46, icon: 'icon:reactor', tag: 'Proc', desc: '+12% Area, +8% Damage. Every 10th enemy eliminated detonates a massive neon chain-nova!', mods: { areaPct: 12, damagePct: 8 }, special: 'killNova' },
    { id: 'jet_mine_rack', name: 'Cluster Dash Rack', tier: 2, cost: 34, icon: 'icon:rocket', tag: 'Proc', desc: '-12% Dash Cooldown. Every Jet-Dash drops 2 live explosive cluster charges behind you!', mods: { dashCdPct: -12 }, special: 'dashMines' },
    { id: 'chrono_battery', name: 'Chrono-Ult Battery', tier: 4, cost: 74, icon: 'icon:hourglass', tag: 'Legendary', desc: '+12 Engineering, +10% Crit. Unleashing your Ultimate resets Jet-Dash, restores +15 HP & charges Ult 25% faster!', mods: { engineering: 12, critChance: 10 }, special: 'ultReset' },
    { id: 'overclock_prism', name: 'Overclock Prism', tier: 2, cost: 32, icon: 'icon:prism', tag: 'Trade-Off', desc: '+16% Crit Chance, +14% Blast Area — BUT -3 Armor!', mods: { critChance: 16, areaPct: 14, armor: -3 } },
    { id: 'salvage_magnet_mk2', name: 'Hyper-Tractor Rig', tier: 2, cost: 31, icon: 'icon:magnet', tag: 'Economy', desc: '+95 Pickup Magnet, +12 Harvesting, +10% Scrap Earned!', mods: { magnet: 95, harvesting: 12, scrapPct: 10 } },
    { id: 'cursed_chrono', name: 'Cursed Chrono-Dial', tier: 3, cost: 48, icon: 'icon:skull_curse', tag: 'Cursed', desc: '+26% Attack Speed, +14% Move Speed, -15% Dash CD — BUT +1 Curse!', mods: { attackSpeedPct: 26, speedPct: 14, dashCdPct: -15, curseLevel: 1 } },
    { id: 'nano_aegis_core', name: 'Nano-Aegis Core', tier: 4, cost: 76, icon: 'icon:medkit', tag: 'Legendary', desc: '+36 Max HP, +6 Armor, +2.4 HP/s Regen & +10% Life Steal — peak survivability!', mods: { maxHp: 36, armor: 6, hpRegen: 2.4, lifeSteal: 10 } }
  ];

  // Level-Up Stat Draft Pool (now includes Harvesting, Dodge & Life Steal!)
  const LEVEL_UPGRADES = [
    { id: 'lv_eng', name: 'Precision Schematics', icon: 'icon:wrench', stat: 'engineering', values: [4, 8, 13, 20], fmt: (v) => `+${v} Engineering` },
    { id: 'lv_dmg', name: 'Output Calibration', icon: 'icon:reactor', stat: 'damagePct', values: [7, 12, 18, 28], fmt: (v) => `+${v}% Global Damage` },
    { id: 'lv_aspd', name: 'Servo Overclock', icon: 'icon:battery', stat: 'attackSpeedPct', values: [7, 12, 18, 28], fmt: (v) => `+${v}% Attack Speed` },
    { id: 'lv_hp', name: 'Reinforced Bulkhead', icon: 'icon:heart', stat: 'maxHp', values: [10, 18, 28, 42], fmt: (v) => `+${v} Max HP` },
    { id: 'lv_armor', name: 'Composite Plating', icon: 'icon:shield', stat: 'armor', values: [2, 3, 5, 8], fmt: (v) => `+${v} Armor` },
    { id: 'lv_dodge', name: 'Phase Thrusters', icon: 'icon:tardigrade', stat: 'dodge', values: [5, 9, 13, 18], fmt: (v) => `+${v}% Dodge Chance` },
    { id: 'lv_harv', name: 'Ore Vein Harvester', icon: 'icon:piggy', stat: 'harvesting', values: [7, 12, 19, 28], fmt: (v) => `+${v} Harvesting (Compounds!)` },
    { id: 'lv_leech', name: 'Nano-Siphon Array', icon: 'icon:vampire', stat: 'lifeSteal', values: [3, 5, 8, 12], fmt: (v) => `+${v}% Life Steal` },
    { id: 'lv_area', name: 'Wide-Band Emitters', icon: 'icon:radar', stat: 'areaPct', values: [9, 15, 22, 32], fmt: (v) => `+${v}% Blast & Effect Area` },
    { id: 'lv_crit', name: 'Arc Targeting AI', icon: 'icon:chip', stat: 'critChance', values: [5, 9, 14, 20], fmt: (v) => `+${v}% Crit Chance` },
    { id: 'lv_spd', name: 'Thruster Tuning', icon: 'icon:boots', stat: 'speedPct', values: [6, 10, 15, 21], fmt: (v) => `+${v}% Move Speed` },
    { id: 'lv_regen', name: 'Nano-Welders', icon: 'icon:heart', stat: 'hpRegen', values: [1.0, 1.8, 2.8, 4.0], fmt: (v) => `+${v} HP/s Regen` },
    { id: 'lv_luck', name: 'Core Scanner Array', icon: 'icon:clover', stat: 'luck', values: [7, 13, 20, 30], fmt: (v) => `+${v} Luck` }
  ];

  function getContraption(id) {
    return CONTRAPTIONS.find((c) => c.id === id) || CONTRAPTIONS[0];
  }

  function getModule(id) {
    return MODULES.find((m) => m.id === id) || MODULES[0];
  }

  function getToolCost(toolDef, tier = 1, discount = 0, wave = 1) {
    const raw = toolDef.baseCost * TIER_COST_MULT[tier] * getWavePriceMult(wave);
    return Math.max(8, Math.round(raw * (1 - Math.min(0.55, discount))));
  }

  function getModuleCost(modDef, discount = 0, wave = 1) {
    const raw = modDef.cost * getWavePriceMult(wave);
    return Math.max(8, Math.round(raw * (1 - Math.min(0.55, discount))));
  }

  function getToolSellValue(toolDef, tier = 1, sellBonusPct = 0, wave = 1) {
    const base = toolDef.baseCost * TIER_COST_MULT[tier] * getWavePriceMult(wave);
    return Math.max(5, Math.round(base * (0.45 + sellBonusPct / 100)));
  }

  function computeSynergies(equippedTools) {
    const counts = { MINES: 0, ROBOTICS: 0, THERMAL: 0, ORBITAL: 0, SEISMIC: 0, VOLTAIC: 0 };
    equippedTools.forEach((slot) => {
      const def = getContraption(slot.id);
      def.tags.forEach((t) => {
        if (counts[t] !== undefined) counts[t]++;
      });
    });

    const active = {};
    const bonuses = {
      areaPct: 0, mineDmgMult: 1, scorch: false, miniMines: false,
      deployAspd: 1, engineering: 0, extraDeployCap: 0, overclock: false,
      thermalDmgMult: 1, burn: false, spreadBurn: false, meltdown: false,
      orbitalSpeed: 1, bonusOrbit: 0, speedPct: 0, shieldOnHit: false,
      knockback: 1, armor: 0, shred: false, faultline: false,
      critChance: 0, chainBonus: 0, critArc: false, attackSpeedPct: 0
    };

    Object.keys(SYNERGIES).forEach((key) => {
      const c = counts[key];
      let bestTier = null;
      SYNERGIES[key].tiers.forEach((t) => {
        if (c >= t.count) bestTier = t;
      });
      active[key] = { count: c, tier: bestTier };
      if (bestTier) {
        if (bestTier.areaPct) bonuses.areaPct += bestTier.areaPct;
        if (bestTier.mineDmgMult) bonuses.mineDmgMult = Math.max(bonuses.mineDmgMult, bestTier.mineDmgMult);
        if (bestTier.scorch) bonuses.scorch = true;
        if (bestTier.miniMines) bonuses.miniMines = true;
        if (bestTier.deployAspd) bonuses.deployAspd = Math.max(bonuses.deployAspd, bestTier.deployAspd);
        if (bestTier.engineering) bonuses.engineering += bestTier.engineering;
        if (bestTier.extraDeployCap) bonuses.extraDeployCap += bestTier.extraDeployCap;
        if (bestTier.overclock) bonuses.overclock = true;
        if (bestTier.thermalDmgMult) bonuses.thermalDmgMult = Math.max(bonuses.thermalDmgMult, bestTier.thermalDmgMult);
        if (bestTier.burn) bonuses.burn = true;
        if (bestTier.spreadBurn) bonuses.spreadBurn = true;
        if (bestTier.meltdown) bonuses.meltdown = true;
        if (bestTier.orbitalSpeed) bonuses.orbitalSpeed = Math.max(bonuses.orbitalSpeed, bestTier.orbitalSpeed);
        if (bestTier.bonusOrbit) bonuses.bonusOrbit += bestTier.bonusOrbit;
        if (bestTier.speedPct) bonuses.speedPct += bestTier.speedPct;
        if (bestTier.shieldOnHit) bonuses.shieldOnHit = true;
        if (bestTier.knockback) bonuses.knockback = Math.max(bonuses.knockback, bestTier.knockback);
        if (bestTier.armor) bonuses.armor += bestTier.armor;
        if (bestTier.shred) bonuses.shred = true;
        if (bestTier.faultline) bonuses.faultline = true;
        if (bestTier.critChance) bonuses.critChance += bestTier.critChance;
        if (bestTier.chainBonus) bonuses.chainBonus += bestTier.chainBonus;
        if (bestTier.critArc) bonuses.critArc = true;
        if (bestTier.attackSpeedPct) bonuses.attackSpeedPct += bestTier.attackSpeedPct;
      }
    });

    return { counts, active, bonuses };
  }

  window.MM.TIER_NAMES = TIER_NAMES;
  window.MM.TIER_COLORS = TIER_COLORS;
  window.MM.TIER_DMG_MULT = TIER_DMG_MULT;
  window.MM.TIER_CD_MULT = TIER_CD_MULT;
  window.MM.SYNERGIES = SYNERGIES;
  // Weapon families: what a weapon physically is / how it attacks. Shown in
  // the shop so engineer perks like "+Gun Damage" or "+1 Deployable" are easy
  // to match to items. (Synergy tags like ROBOTICS are a separate system.)
  const WEAPON_FAMILIES = {
    gun:     { id: 'gun', name: 'Gun', icon: '🔫', color: '#D9692B', blurb: 'Held in your hands, auto-fires at enemies' },
    turret:  { id: 'turret', name: 'Turret', icon: '🗼', color: '#4C8FC4', blurb: 'Deployable: set on the ground, shoots on its own' },
    mine:    { id: 'mine', name: 'Trap', icon: '🪤', color: '#C9433A', blurb: 'Deployable: dropped near you, blows up on contact' },
    orbital: { id: 'orbital', name: 'Orbiter', icon: '💫', color: '#8C68C4', blurb: 'Circles around you, hitting what it touches' },
    drone:   { id: 'drone', name: 'Drone', icon: '🛸', color: '#3E8A80', blurb: 'Flies with you and attacks by itself' },
    melee:   { id: 'melee', name: 'Melee', icon: '🔨', color: '#8A5A35', blurb: 'Smashes enemies right next to you' },
    thrown:  { id: 'thrown', name: 'Thrown', icon: '🪃', color: '#B98614', blurb: 'Hurled outward, then flies back' },
    area:    { id: 'area', name: 'Area', icon: '🌋', color: '#6FA84F', blurb: 'Makes a damaging zone or blast around you' }
  };
  const FAMILY_BY_KIND = {
    mine: 'mine', cryo_mine: 'mine', magnet_mine: 'mine', arc_mine: 'mine', cluster: 'mine',
    garden: 'turret',
    drone: 'drone', saw_drone: 'drone', drill_drone: 'drone', shield_drone: 'drone', nano_hive: 'drone',
    hammer: 'melee', jackhammer: 'melee', drill: 'melee', grapple: 'melee', pilebunker: 'melee', thumper: 'melee', drop_anvil: 'melee',
    boomerang: 'thrown', ricochet_saw: 'thrown',
    magma_vent: 'area', kiln: 'area', cryo_wave: 'area', gravity_well: 'area', acid_sprayer: 'area', tar_sprayer: 'area',
    emp_cone: 'area', ion_laser: 'area', meteor: 'area', meteor_beacon: 'area'
  };
  function weaponFamily(def) {
    const k = (def && def.kind) || '';
    if (k.startsWith('gun_')) return WEAPON_FAMILIES.gun;
    if (k.startsWith('turret_')) return WEAPON_FAMILIES.turret;
    if (k.startsWith('orbital_')) return WEAPON_FAMILIES.orbital;
    return WEAPON_FAMILIES[FAMILY_BY_KIND[k]] || WEAPON_FAMILIES.area;
  }
  window.MM.WEAPON_FAMILIES = WEAPON_FAMILIES;
  window.MM.weaponFamily = weaponFamily;

  window.MM.CONTRAPTIONS = CONTRAPTIONS;
  window.MM.MODULES = MODULES;
  window.MM.LEVEL_UPGRADES = LEVEL_UPGRADES;
  window.MM.getWavePriceMult = getWavePriceMult;
  window.MM.getContraption = getContraption;
  window.MM.getModule = getModule;
  window.MM.getToolCost = getToolCost;
  window.MM.getModuleCost = getModuleCost;
  window.MM.getToolSellValue = getToolSellValue;
  window.MM.computeSynergies = computeSynergies;
})();
