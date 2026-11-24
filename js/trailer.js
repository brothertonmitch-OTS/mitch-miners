// ============================================================================
// MULTI-MINE — Official Live Gameplay Trailer Director & HD Video Recorder
// Drives the ACTUAL 60fps GameEngine with an AI Pilot across 7 curated scenes!
// ============================================================================
(function () {
  const W = 1280;
  const H = 720;
  const TOTAL_DUR = 44.0;

  const SCENES = [
    { id: 'intro',    start: 0.0,  end: 5.5,  label: '1. Welcome',       title: "MITCH'S MINERS",                      tag: 'ALIEN ENGINEER AUTO-ROGUELIKE',           accent: '#FFC233', sub: 'Pilot an Alien in an Engineer Costume. Survive the Swarm.' },
    { id: 'heroes',   start: 5.5,  end: 12.0, label: '2. 14 Engineers',  title: '14 PLAYABLE ALIEN ENGINEERS',     tag: 'LIVE GAMEPLAY • NEON ALIEN FOREST',       accent: '#5BD6A0', chips: ['Unique Passives', '[E] Ultimate Overdrives', '10 Unlockable Hats', '5 Selectable Biomes'] },
    { id: 'arsenal',  start: 12.0, end: 18.5, label: '3. 50 Weapons',    title: '50 GUNS & CONTRAPTIONS',          tag: 'LIVE GAMEPLAY • OCTO-RIG MK.IV★ ARSENAL', accent: '#FFE07A', chips: ['Auto-Aiming Chaos', 'Merge to Mk.IV★', '6 Engineering Synergies', 'Cursed +35% Variants'] },
    { id: 'pets',     start: 18.5, end: 25.5, label: '4. Pet Army',      title: '10 AUTONOMOUS COMBAT PETS',       tag: 'LIVE GAMEPLAY • MOCHI BEAST-TAMER',       accent: '#2DD4BF', chips: ['🔥❄ Frostfire Combos', '👑 Alpha Pack Auras', '[F] Pet Rally Focus', 'Pet-Only Hero: Mochi'] },
    { id: 'workshop', start: 25.5, end: 31.5, label: '5. Workshop',      title: 'BROTATO-STYLE WORKSHOP & RUNS',   tag: 'FEATURE OVERVIEW • 94 ITEMS & MODIFIERS', accent: '#C4A8FF', chips: ['🔒 Lock Shop Offers', '12-Wave Boss Timeline', '5 Run Modifiers', '18 Achievement Badges'] },
    { id: 'bosses',   start: 31.5, end: 38.5, label: '6. Twin Bosses',   title: '2-PHASE BOSSES & ENDLESS ∞',      tag: 'LIVE GAMEPLAY • QUANTUM SPIRE SHOWDOWN',  accent: '#E8483F', chips: ['Hazard Tiers 1–5', 'Endless Twin Bosses', 'Live DPS Meter', 'Auto Save & Resume'] },
    { id: 'outro',    start: 38.5, end: 44.0, label: '7. Play Now',      title: "PLAY MITCH'S MINERS",                 tag: 'ALL 14 ENGINEERS UNLOCKED FROM DAY ONE',  accent: '#FFC233', sub: 'Free in Your Browser • Guns • Pets • Bosses • Endless Mode' }
  ];

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function easeOutCubic(t) { const x = clamp(t, 0, 1); return 1 - Math.pow(1 - x, 3); }
  function easeOutBack(t) { const x = clamp(t, 0, 1); const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }

  class TrailerDirector {
    constructor() {
      this.outCanvas = document.getElementById('trailer-canvas');
      this.outCanvas.width = W;
      this.outCanvas.height = H;
      this.ctx = this.outCanvas.getContext('2d');

      // Dedicated internal 1280x720 canvas for the REAL GameEngine
      this.gameCanvas = document.createElement('canvas');
      this.gameCanvas.width = W;
      this.gameCanvas.height = H;

      window.MM.SVGs.preloadAll();

      this.origHat = (window.MM.Meta.get() && window.MM.Meta.get().selectedHat) || 'none';
      this.engine = new window.MM.GameEngine(this.gameCanvas, {});
      // Pin engine viewport to broadcast 1280x720 HD without touching window size
      this.engine.resize = () => {
        this.engine.viewW = W;
        this.engine.viewH = H;
        this.engine.dpr = 1;
        this.gameCanvas.width = W;
        this.gameCanvas.height = H;
      };
      this.engine.resize();
      // Keep trailer completely non-destructive to player's real save & achievements
      this.engine.notifyAch = () => {};
      this.engine.handleGameOver = () => {};
      this.engine.finishWaveTransition = () => {};

      this.time = 0;
      this.playing = true;
      this.muted = false;
      this.audioUnlocked = false;
      this.currentSceneIdx = -1;
      this.sceneTime = 0;
      this.sceneTriggers = {};
      this.flashAlpha = 0;
      this.recording = false;
      this.recorder = null;
      this.recordChunks = [];

      this.bindUI();
      this.buildChapters();
      this.enterScene(0);
      this.lastFrame = performance.now();
      requestAnimationFrame((now) => this.loop(now));

      window.addEventListener('beforeunload', () => this.restoreHat());
    }

    setPreviewHat(hatId) {
      const m = window.MM.Meta.get();
      if (m) m.selectedHat = hatId || 'none';
    }

    restoreHat() {
      const m = window.MM.Meta.get();
      if (m) m.selectedHat = this.origHat;
    }

    unlockAudio(forceMusic = true) {
      if (!this.audioUnlocked) {
        window.MM.Audio.unlock();
        this.audioUnlocked = true;
        const banner = document.getElementById('sound-prompt');
        if (banner) banner.classList.add('hidden');
      }
      if (forceMusic && !this.muted) {
        this.applySceneMusic(this.currentSceneIdx);
      }
    }

    applySceneMusic(idx) {
      if (!this.audioUnlocked || this.muted) return;
      const sc = SCENES[idx];
      if (!sc) return;
      if (sc.id === 'bosses') {
        window.MM.Audio.setTrackOverride('boss');
      } else if (sc.id === 'intro' || sc.id === 'heroes' || sc.id === 'arsenal' || sc.id === 'pets' || sc.id === 'outro') {
        window.MM.Audio.setTrackOverride('synthwave');
      } else {
        window.MM.Audio.setTrackOverride('menu');
      }
    }

    bindUI() {
      const $ = (id) => document.getElementById(id);

      $('btn-play-pause').onclick = () => {
        this.unlockAudio(true);
        if (this.time >= TOTAL_DUR - 0.05) {
          this.seekTo(0);
          this.playing = true;
        } else {
          this.playing = !this.playing;
        }
        this.updateControlsUI();
      };

      $('btn-restart').onclick = () => {
        this.unlockAudio(true);
        this.seekTo(0);
        this.playing = true;
        this.updateControlsUI();
      };

      $('btn-mute').onclick = () => {
        this.unlockAudio(false);
        this.muted = !this.muted;
        if (this.muted) {
          window.MM.Audio.setMusicVolume(0);
          window.MM.Audio.setSfxVolume(0);
        } else {
          window.MM.Audio.setMusicVolume(0.65);
          window.MM.Audio.setSfxVolume(0.8);
          this.applySceneMusic(this.currentSceneIdx);
        }
        this.updateControlsUI();
      };

      if ($('sound-prompt')) {
        $('sound-prompt').onclick = () => {
          this.unlockAudio(true);
          this.seekTo(0);
          this.playing = true;
          this.updateControlsUI();
        };
      }

      this.outCanvas.onclick = () => {
        this.unlockAudio(true);
      };

      $('progress-bar').onclick = (e) => {
        this.unlockAudio(true);
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        this.seekTo(pct * TOTAL_DUR);
      };

      $('btn-record').onclick = () => {
        if (this.recording) {
          this.stopRecording();
        } else {
          this.startRecording();
        }
      };

      this.updateControlsUI();
    }

    buildChapters() {
      const wrap = document.getElementById('chapter-bar');
      if (!wrap) return;
      wrap.innerHTML = '';
      SCENES.forEach((sc, idx) => {
        const btn = document.createElement('button');
        btn.className = 'chap-btn';
        btn.dataset.idx = idx;
        btn.textContent = sc.label;
        btn.onclick = () => {
          this.unlockAudio(true);
          this.seekTo(sc.start + 0.02);
          this.playing = true;
          this.updateControlsUI();
        };
        wrap.appendChild(btn);
      });
    }

    updateControlsUI() {
      const $ = (id) => document.getElementById(id);
      $('btn-play-pause').textContent = this.playing ? '⏸ Pause' : '▶ Play';
      $('btn-mute').textContent = this.muted ? '🔇 Muted' : '🔊 Sound: ON';
      const recBtn = $('btn-record');
      if (recBtn) {
        recBtn.textContent = this.recording ? '⏹ Stop & Save Video' : '⬇ Record & Download Video (.webm)';
        recBtn.classList.toggle('recording', this.recording);
      }
    }

    // ------------------------------------------------------------------------
    // 1-CLICK HD 60FPS VIDEO + AUDIO RECORDER (.webm)
    // ------------------------------------------------------------------------
    startRecording() {
      if (typeof MediaRecorder === 'undefined') {
        alert('MediaRecorder is not supported in this browser. Try Chrome or Edge!');
        return;
      }
      this.unlockAudio(true);
      this.muted = false;
      window.MM.Audio.setMusicVolume(0.65);
      window.MM.Audio.setSfxVolume(0.8);

      const videoStream = this.outCanvas.captureStream(60);
      const tracks = [...videoStream.getVideoTracks()];
      const audioStream = window.MM.Audio.getRecordAudioStream();
      if (audioStream) {
        audioStream.getAudioTracks().forEach((t) => tracks.push(t));
      }
      const combined = new MediaStream(tracks);
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];
      let chosenMime = '';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) { chosenMime = m; break; }
      }

      this.recordChunks = [];
      try {
        this.recorder = new MediaRecorder(combined, chosenMime ? { mimeType: chosenMime, videoBitsPerSecond: 7500000 } : { videoBitsPerSecond: 7500000 });
      } catch (e) {
        this.recorder = new MediaRecorder(combined);
      }

      this.recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) this.recordChunks.push(ev.data);
      };
      this.recorder.onstop = () => {
        const blob = new Blob(this.recordChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Mitchs-Miners-Official-Trailer.webm';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          URL.revokeObjectURL(url);
          a.remove();
        }, 1500);
        this.recording = false;
        this.updateControlsUI();
        const st = document.getElementById('rec-status');
        if (st) {
          st.textContent = '✓ Saved Mitchs-Miners-Official-Trailer.webm!';
          setTimeout(() => { if (!this.recording) st.textContent = ''; }, 4500);
        }
      };

      this.recording = true;
      this.seekTo(0);
      this.playing = true;
      this.recorder.start(250);
      this.updateControlsUI();
      const st = document.getElementById('rec-status');
      if (st) st.textContent = '● Recording full 44s HD trailer with audio...';
    }

    stopRecording() {
      if (this.recorder && this.recorder.state !== 'inactive') {
        this.recorder.stop();
      }
      this.recording = false;
      this.updateControlsUI();
    }

    seekTo(sec) {
      this.time = clamp(sec, 0, TOTAL_DUR);
      const idx = this.getSceneIndex(this.time);
      this.enterScene(idx);
      this.sceneTime = this.time - SCENES[idx].start;
    }

    getSceneIndex(t) {
      for (let i = 0; i < SCENES.length; i++) {
        if (t < SCENES[i].end) return i;
      }
      return SCENES.length - 1;
    }

    // ------------------------------------------------------------------------
    // CHOREOGRAPHED LIVE GAMEPLAY SCENE SETUP
    // ------------------------------------------------------------------------
    spawnRingPack(types, count, minR = 250, maxR = 440) {
      const e = this.engine;
      const px = e.player.x;
      const py = e.player.y;
      for (let i = 0; i < count; i++) {
        const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
        const r = minR + Math.random() * (maxR - minR);
        const x = clamp(px + Math.cos(ang) * r, 90, 1830);
        const y = clamp(py + Math.sin(ang) * r, 90, 1190);
        e.spawnEnemy(types[i % types.length], x, y);
      }
    }

    giveTools(list) {
      const e = this.engine;
      e.run.tools = list.map((item, i) => ({
        uid: e.nextUid(),
        id: item.id,
        tier: item.tier || 3,
        cursed: !!item.cursed,
        cdTimer: 0.08 + i * 0.07,
        firePulse: 0
      }));
    }

    giveModules(ids) {
      const e = this.engine;
      ids.forEach((id) => {
        const m = window.MM.getModule(id);
        if (m) e.applyModule(m, false);
      });
    }

    enterScene(idx) {
      this.currentSceneIdx = idx;
      this.sceneTime = 0;
      this.sceneTriggers = {};
      this.flashAlpha = idx > 0 ? 0.45 : 0;

      const sc = SCENES[idx];
      const e = this.engine;
      this.applySceneMusic(idx);

      document.querySelectorAll('.chap-btn').forEach((b) => {
        b.classList.toggle('active', Number(b.dataset.idx) === idx);
      });

      if (sc.id === 'intro' || sc.id === 'workshop' || sc.id === 'outro') {
        e.state = 'menu';
        this.setPreviewHat('neon_crown');
      } else if (sc.id === 'heroes') {
        // Zorp in Neon Alien Forest with Neon Holo-Crown + sleek guns & orbitals!
        this.setPreviewHat('neon_crown');
        e.resetRunState('nasa', 1, { biomeId: 'neon_forest', modifiers: [] });
        e.run.bonusStats.damagePct += 45;
        e.run.bonusStats.attackSpeedPct += 35;
        e.run.bonusStats.engineering += 18;
        e.run.bonusStats.maxHp += 120;
        this.giveTools([
          { id: 'rivet_smg', tier: 3 },
          { id: 'rail_sniper', tier: 3 },
          { id: 'tesla_carbine', tier: 3 },
          { id: 'gyro_saw', tier: 3 },
          { id: 'orbital_sat', tier: 3 }
        ]);
        e.startWave(3);
        e.player.ultCharge = 92;
        this.spawnRingPack(['scrap_mite', 'geode_brute', 'bore_charger', 'acid_pod', 'shield_drone'], 22, 230, 420);
      } else if (sc.id === 'arsenal') {
        // Octo-Rig in Volcano Caldera with 8 Mk.IV★ & Cursed Guns + Contraptions!
        this.setPreviewHat('gold_hardhat');
        e.resetRunState('octo', 2, { biomeId: 'magma', modifiers: [] });
        e.run.bonusStats.damagePct += 65;
        e.run.bonusStats.attackSpeedPct += 50;
        e.run.bonusStats.engineering += 28;
        e.run.bonusStats.areaPct += 30;
        e.run.bonusStats.critChance += 35;
        e.run.bonusStats.maxHp += 160;
        this.giveTools([
          { id: 'rotary_minigun', tier: 4, cursed: true },
          { id: 'grenade_launcher', tier: 4 },
          { id: 'nova_cannon', tier: 4, cursed: true },
          { id: 'slag_shotgun', tier: 4 },
          { id: 'cryo_blaster', tier: 4 },
          { id: 'tesla_pylon', tier: 4 },
          { id: 'seismic_thumper', tier: 4 },
          { id: 'gyro_saw', tier: 4 }
        ]);
        e.startWave(6); // Horde wave!
        e.player.ultCharge = 80;
        this.spawnRingPack(['scrap_mite', 'magma_slime', 'bore_charger', 'shield_golem', 'swarm_brooder'], 30, 220, 430);
      } else if (sc.id === 'pets') {
        // Mochi Beast-Tamer in Neon Alien Forest with 6 Pets + Alpha Pack + Frostfire + Elite Dreadnought!
        this.setPreviewHat('mushroom_cap');
        e.resetRunState('mochi', 1, { biomeId: 'neon_forest', modifiers: ['pet_frenzy'] });
        e.run.bonusStats.engineering += 36;
        e.run.bonusStats.damagePct += 45;
        e.run.bonusStats.attackSpeedPct += 35;
        e.run.bonusStats.maxHp += 180;
        this.giveModules(['pet_frost_pup', 'pet_volt_ferret', 'pet_mech_rex']);
        e.startWave(5);
        e.eliteSpawnTimer = -1; // Spawn Elite right away for dramatic Pet Rally!
        e.player.ultCharge = 90;
        e.spawnEnemy('elite_dreadnought', e.player.x + 290, e.player.y - 30);
        this.spawnRingPack(['scrap_mite', 'magma_slime', 'bore_charger', 'laser_sentinel'], 20, 210, 390);
      } else if (sc.id === 'bosses') {
        // Nova in Quantum Spire fighting TWIN ENDLESS BOSSES!
        this.setPreviewHat('star_crown');
        e.resetRunState('quantum', 3, { biomeId: 'quantum', modifiers: ['double_boss'] });
        e.run.endless = true;
        e.run.bonusStats.damagePct += 95;
        e.run.bonusStats.attackSpeedPct += 55;
        e.run.bonusStats.engineering += 40;
        e.run.bonusStats.critChance += 40;
        e.run.bonusStats.maxHp += 240;
        this.giveTools([
          { id: 'nova_cannon', tier: 4, cursed: true },
          { id: 'rail_sniper', tier: 4 },
          { id: 'ion_beacon', tier: 4 },
          { id: 'orbital_sat', tier: 4 },
          { id: 'tesla_carbine', tier: 4 },
          { id: 'cryo_blaster', tier: 4 }
        ]);
        this.giveModules(['pet_void_owl', 'pet_catling']);
        e.startWave(15); // Endless Twin Bosses!
        e.player.ultCharge = 88;
        this.spawnRingPack(['quantum_stalker', 'vortex_wisp', 'shield_drone'], 14, 280, 460);
      }
    }

    // ------------------------------------------------------------------------
    // AI GAMEPLAY PILOT (Dodges, Dashes, Triggers Ultimates & Pet Rally!)
    // ------------------------------------------------------------------------
    driveAIPilot(dt) {
      const e = this.engine;
      if (e.state !== 'playing' || !e.player) return;
      const p = e.player;
      const sc = SCENES[this.currentSceneIdx];

      // Keep hero alive & cinematic
      if (p.hp < e.stats.maxHp * 0.55) {
        p.hp = Math.min(e.stats.maxHp, p.hp + e.stats.maxHp * 0.45 * dt);
      }

      // Compute agile steering vector: gentle orbit around center + threat repulsion
      const cx = 960;
      const cy = 640;
      const orbitAng = this.sceneTime * 0.95 + this.currentSceneIdx * 1.4;
      const goalX = cx + Math.cos(orbitAng) * 230;
      const goalY = cy + Math.sin(orbitAng * 1.2) * 145;
      let vx = (goalX - p.x) * 0.012;
      let vy = (goalY - p.y) * 0.012;

      // Dodge nearby enemies
      for (let i = 0; i < e.enemies.length; i++) {
        const en = e.enemies[i];
        if (en.dead) continue;
        const dx = p.x - en.x;
        const dy = p.y - en.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 175) {
          const push = ((175 - d) / 175) * 2.6;
          vx += (dx / d) * push;
          vy += (dy / d) * push;
        }
      }
      // Dodge enemy projectiles
      for (let i = 0; i < e.enemyShots.length; i++) {
        const s = e.enemyShots[i];
        const dx = p.x - s.x;
        const dy = p.y - s.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 130) {
          const push = ((130 - d) / 130) * 3.4;
          vx += (dx / d) * push;
          vy += (dy / d) * push;
        }
      }

      e.keys['w'] = vy < -0.25;
      e.keys['s'] = vy > 0.25;
      e.keys['a'] = vx < -0.25;
      e.keys['d'] = vx > 0.25;

      // Choreographed signature moves right on cue!
      if (sc.id === 'heroes') {
        if (!this.sceneTriggers.dash1 && this.sceneTime > 1.6) {
          this.sceneTriggers.dash1 = true;
          e.triggerDash();
        }
        if (!this.sceneTriggers.ult1 && this.sceneTime > 3.1) {
          this.sceneTriggers.ult1 = true;
          p.ultCharge = 100;
          e.triggerUltimate();
        }
      } else if (sc.id === 'arsenal') {
        if (!this.sceneTriggers.wave2 && this.sceneTime > 2.5) {
          this.sceneTriggers.wave2 = true;
          this.spawnRingPack(['scrap_mite', 'magma_slime', 'bore_charger', 'acid_pod'], 18, 250, 420);
        }
        if (!this.sceneTriggers.ult && this.sceneTime > 3.4) {
          this.sceneTriggers.ult = true;
          p.ultCharge = 100;
          e.triggerUltimate();
        }
      } else if (sc.id === 'pets') {
        if (!this.sceneTriggers.rally && this.sceneTime > 1.3) {
          this.sceneTriggers.rally = true;
          e.triggerPetRally();
        }
        if (!this.sceneTriggers.ult && this.sceneTime > 3.6) {
          this.sceneTriggers.ult = true;
          p.ultCharge = 100;
          e.triggerUltimate();
        }
      } else if (sc.id === 'bosses') {
        if (!this.sceneTriggers.dash && this.sceneTime > 1.8) {
          this.sceneTriggers.dash = true;
          e.triggerDash();
        }
        if (!this.sceneTriggers.ult && this.sceneTime > 3.2) {
          this.sceneTriggers.ult = true;
          p.ultCharge = 100;
          e.triggerUltimate();
        }
      }
    }

    // ------------------------------------------------------------------------
    // BROADCAST FRAME RENDERER (1280x720)
    // ------------------------------------------------------------------------
    loop(now) {
      const rawDt = Math.min(0.05, Math.max(0.001, (now - this.lastFrame) / 1000));
      this.lastFrame = now;

      if (this.playing) {
        this.time += rawDt;
        this.sceneTime += rawDt;
        if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - rawDt * 2.2);

        if (this.time >= TOTAL_DUR) {
          if (this.recording) {
            this.time = TOTAL_DUR;
            this.playing = false;
            this.stopRecording();
          } else {
            this.seekTo(0);
          }
        } else {
          const nextIdx = this.getSceneIndex(this.time);
          if (nextIdx !== this.currentSceneIdx) {
            this.enterScene(nextIdx);
          }
        }

        // Advance REAL GameEngine!
        this.engine.globalTime += rawDt;
        const sc = SCENES[this.currentSceneIdx];
        if (sc.id === 'intro' || sc.id === 'workshop' || sc.id === 'outro') {
          this.engine.renderMenuBackdrop(rawDt);
        } else {
          this.driveAIPilot(rawDt);
          this.engine.update(rawDt);
          this.engine.renderArena();
        }
      }

      this.compositeFrame();
      this.updateProgressUI();
      requestAnimationFrame((t) => this.loop(t));
    }

    drawSprite(key, x, y, w, h) {
      const sp = window.MM.SVGs.getSprite(key);
      if (sp && sp.ready) this.ctx.drawImage(sp.canvas, x, y, w, h);
    }

    compositeFrame() {
      const ctx = this.ctx;
      const sc = SCENES[this.currentSceneIdx];
      const st = this.sceneTime;
      const dur = sc.end - sc.start;

      ctx.save();
      // 1. Blit live 60fps GameEngine canvas!
      ctx.drawImage(this.gameCanvas, 0, 0, W, H);

      // 2. Scene-specific bespoke overlays
      if (sc.id === 'intro') {
        this.renderIntroOverlay(ctx, st, dur);
      } else if (sc.id === 'workshop') {
        this.renderWorkshopShowcase(ctx, st, dur);
      } else if (sc.id === 'outro') {
        this.renderOutroOverlay(ctx, st, dur);
      } else {
        this.renderGameplayHUDAndCallout(ctx, sc, st, dur);
      }

      // 3. Subtle cinema vignette & top/bottom framing polish
      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.36, W / 2, H / 2, W * 0.72);
      vig.addColorStop(0, 'rgba(8, 12, 24, 0)');
      vig.addColorStop(1, 'rgba(6, 9, 18, 0.42)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      // 4. Crisp transition flash / fade
      if (this.flashAlpha > 0.01) {
        ctx.fillStyle = `rgba(126, 255, 234, ${this.flashAlpha * 0.28})`;
        ctx.fillRect(0, 0, W, H);
      }
      if (st < 0.28) {
        ctx.fillStyle = `rgba(8, 11, 20, ${1 - st / 0.28})`;
        ctx.fillRect(0, 0, W, H);
      }
      if (st > dur - 0.32 && this.currentSceneIdx < SCENES.length - 1) {
        ctx.fillStyle = `rgba(8, 11, 20, ${(st - (dur - 0.32)) / 0.32})`;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.restore();
    }

    renderIntroOverlay(ctx, st) {
      // Soft dark backing behind hero title
      ctx.fillStyle = 'rgba(10, 15, 28, 0.46)';
      ctx.beginPath(); ctx.roundRect(W / 2 - 430, 115, 860, 440, 28); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 194, 51, 0.55)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const pop = easeOutBack(st / 0.75);
      // Top badge
      ctx.save();
      ctx.globalAlpha = easeOutCubic(st / 0.45);
      ctx.fillStyle = 'rgba(255, 194, 51, 0.16)';
      ctx.beginPath(); ctx.roundRect(W / 2 - 220, 148, 440, 34, 17); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 194, 51, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#7EFFEA';
      ctx.font = '700 15px "Fredoka", "Lexend", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OFFICIAL GAMEPLAY TRAILER • 60 FPS', W / 2, 170);
      ctx.restore();

      // Big animated MULTI-MINE logo
      ctx.save();
      ctx.translate(W / 2, 272);
      ctx.scale(0.85 + 0.15 * pop, 0.85 + 0.15 * pop);
      ctx.font = '600 96px "Fredoka", "Lexend", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0D1322';
      ctx.fillText("MITCH'S MINERS", 4, 6);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('MULTI', -18, 0);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFE07A';
      ctx.fillText('-', 0, 0);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFC233';
      ctx.fillText('MINE', 18, 0);
      ctx.restore();

      // Tagline
      ctx.save();
      ctx.globalAlpha = easeOutCubic((st - 0.35) / 0.5);
      ctx.fillStyle = '#DCE8F5';
      ctx.font = '700 24px "Lexend", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Pilot an Alien in an Engineer Costume. Survive the Swarm.', W / 2, 332);
      ctx.restore();

      // Animated alien + hat + pet parade across the lower card!
      const lineup = [
        { k: 'char:nasa', hat: 'hat:neon_crown' },
        { k: 'char:volcano', hat: null },
        { k: 'char:octo', hat: 'hat:gold_hardhat' },
        { k: 'char:mochi', hat: 'hat:mushroom_cap' },
        { k: 'pet:catling', hat: null },
        { k: 'pet:mech_rex', hat: null },
        { k: 'char:quantum', hat: 'hat:star_crown' },
        { k: 'char:hexx', hat: 'hat:cursed_horns' }
      ];
      lineup.forEach((item, i) => {
        const enter = easeOutBack((st - 0.5 - i * 0.08) / 0.45);
        if (enter <= 0.01) return;
        const bx = W / 2 - 336 + i * 96;
        const bob = Math.sin(st * 5.2 + i * 0.8) * 6;
        const by = 438 + bob;
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(enter, enter);
        ctx.fillStyle = 'rgba(20, 30, 48, 0.72)';
        ctx.beginPath(); ctx.roundRect(-38, -38, 76, 76, 16); ctx.fill();
        ctx.strokeStyle = i === 3 || i === 4 || i === 5 ? '#FFC233' : 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 2;
        ctx.stroke();
        this.drawSprite(item.hat ? item.k.replace('char:', 'charbare:') : item.k, -32, -32, 64, 64);
        if (item.hat) this.drawSprite(item.hat, -32, -36, 64, 64);
        ctx.restore();
      });
    }

    renderGameplayHUDAndCallout(ctx, sc, st) {
      const e = this.engine;
      const slide = easeOutCubic(st / 0.42);

      // Top-left live gameplay badge (REAL GAMEPLAY indicator — auto-sized!)
      ctx.save();
      ctx.globalAlpha = 0.94;
      ctx.font = '700 13px "Fredoka", "Lexend", sans-serif';
      const tagW = Math.max(290, ctx.measureText(sc.tag).width + 60);
      ctx.fillStyle = 'rgba(13, 18, 30, 0.84)';
      ctx.beginPath(); ctx.roundRect(24, 22, tagW, 42, 12); ctx.fill();
      ctx.strokeStyle = sc.accent;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = '#E8483F';
      ctx.beginPath(); ctx.arc(44, 43, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#EEF4FF';
      ctx.textAlign = 'left';
      ctx.fillText(sc.tag, 58, 48);
      ctx.restore();

      // Top Boss Health Bar during Twin Bosses scene!
      const aliveBosses = e.enemies.filter((en) => en.isBoss && !en.dead);
      if (aliveBosses.length > 0) {
        const totHp = aliveBosses.reduce((s, b) => s + Math.max(0, b.hp), 0);
        const totMax = aliveBosses.reduce((s, b) => s + b.maxHp, 0) || 1;
        const pct = clamp(totHp / totMax, 0, 1);
        const bw = 480;
        const bx = W - bw - 24;
        ctx.save();
        ctx.fillStyle = 'rgba(13, 18, 30, 0.86)';
        ctx.beginPath(); ctx.roundRect(bx, 20, bw, 48, 12); ctx.fill();
        ctx.strokeStyle = '#E8483F';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#FF8585';
        ctx.font = '700 13px "Fredoka", "Lexend", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`☠ TWIN BOSSES (${aliveBosses.length}) — QUANTUM ARCHITECT`, bx + 14, 38);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath(); ctx.roundRect(bx + 14, 46, bw - 28, 12, 6); ctx.fill();
        ctx.fillStyle = '#E8483F';
        ctx.beginPath(); ctx.roundRect(bx + 14, 46, (bw - 28) * pct, 12, 6); ctx.fill();
        ctx.restore();
      }

      // Bottom-left Kinetic Feature Lower-Third Banner!
      const ox = -40 * (1 - slide);
      ctx.save();
      ctx.globalAlpha = slide;
      ctx.translate(ox, 0);

      const cardW = 790;
      const cardH = 114;
      const cx = 24;
      const cy = H - cardH - 22;

      ctx.fillStyle = 'rgba(12, 17, 29, 0.86)';
      ctx.beginPath(); ctx.roundRect(cx, cy, cardW, cardH, 18); ctx.fill();
      ctx.strokeStyle = sc.accent;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Left accent stripe
      ctx.fillStyle = sc.accent;
      ctx.beginPath(); ctx.roundRect(cx + 12, cy + 16, 6, cardH - 32, 3); ctx.fill();

      // Headline
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 32px "Fredoka", "Lexend", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(sc.title, cx + 32, cy + 50);

      // Feature chips
      if (sc.chips && sc.chips.length) {
        let chipX = cx + 32;
        const chipY = cy + 68;
        ctx.font = '700 13px "Fredoka", "Lexend", sans-serif';
        sc.chips.forEach((chip, ci) => {
          const tw = ctx.measureText(chip).width + 22;
          const chipPop = easeOutCubic((st - 0.25 - ci * 0.12) / 0.3);
          ctx.save();
          ctx.globalAlpha = slide * chipPop;
          ctx.fillStyle = ci === 0 ? sc.accent : 'rgba(255, 255, 255, 0.11)';
          ctx.beginPath(); ctx.roundRect(chipX, chipY, tw, 28, 8); ctx.fill();
          ctx.fillStyle = ci === 0 ? '#0D1322' : '#E6F0FF';
          ctx.fillText(chip, chipX + 11, chipY + 19);
          ctx.restore();
          chipX += tw + 10;
        });
      }

      ctx.restore();
    }

    renderWorkshopShowcase(ctx, st) {
      // Dark semi-translucent panel over live Neon Alien Forest backdrop
      ctx.fillStyle = 'rgba(11, 16, 28, 0.84)';
      ctx.beginPath(); ctx.roundRect(56, 36, W - 112, H - 72, 24); ctx.fill();
      ctx.strokeStyle = 'rgba(196, 168, 255, 0.55)';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Header
      ctx.fillStyle = '#C4A8FF';
      ctx.font = '700 14px "Fredoka", "Lexend", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('BETWEEN-WAVE STRATEGY • ENGINEERING WORKSHOP', 92, 78);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 34px "Fredoka", "Lexend", sans-serif';
      ctx.fillText('BUILD, MERGE, LOCK & CUSTOMIZE EVERY RUN', 92, 118);

      // 1. 12-Wave Expedition Timeline Bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath(); ctx.roundRect(92, 138, W - 184, 62, 14); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const nodes = [
        { w: 'W1', ico: '✓', col: '#5BD6A0' }, { w: 'W2', ico: '✓', col: '#5BD6A0' }, { w: 'W3', ico: '3', col: '#FFFFFF', cur: true },
        { w: 'W4', ico: '☠', col: '#E8483F' }, { w: 'W5', ico: '★', col: '#FFE07A' }, { w: 'W6', ico: '⚡', col: '#FF8E52' },
        { w: 'W7', ico: '★', col: '#FFE07A' }, { w: 'W8', ico: '☠', col: '#E8483F' }, { w: 'W9', ico: '★', col: '#FFE07A' },
        { w: 'W10', ico: '⚡', col: '#FF8E52' }, { w: 'W11', ico: '★', col: '#FFE07A' }, { w: 'W12', ico: '☠', col: '#E8483F' }
      ];
      const nw = (W - 220) / 12;
      nodes.forEach((n, i) => {
        const nx = 110 + i * nw;
        ctx.fillStyle = n.cur ? 'rgba(255, 194, 51, 0.22)' : 'rgba(255,255,255,0.06)';
        ctx.beginPath(); ctx.roundRect(nx, 148, nw - 8, 42, 8); ctx.fill();
        ctx.strokeStyle = n.cur ? '#FFFFFF' : n.col;
        ctx.lineWidth = n.cur ? 2.4 : 1.3;
        ctx.stroke();
        ctx.fillStyle = n.col;
        ctx.font = '700 15px "Fredoka", "Lexend", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.ico, nx + (nw - 8) / 2, 168);
        ctx.fillStyle = '#A8B5CC';
        ctx.font = '700 10px "Fredoka", "Lexend", sans-serif';
        ctx.fillText(n.w, nx + (nw - 8) / 2, 183);
      });

      // 2. 4 Real Blueprint Shop Cards (with animated 🔒 LOCK toggle on card 2!)
      const cards = [
        { name: 'Cursed Nova Cannon', tier: 'Mk.IV★ GUN', col: '#B98AE8', spr: 'tool:nova_cannon', badge: '☠ +35% CURSED', lock: false, price: '92 SCRAP' },
        { name: 'Mini Mecha-Rex',     tier: 'Mk.IV PET',  col: '#2DD4BF', spr: 'pet:mech_rex',     badge: st > 1.8 ? '🔒 LOCKED — NEXT SHOP' : '🔓 LOCK FOR NEXT SHOP', lock: st > 1.8, price: '74 SCRAP' },
        { name: 'Vulcan Minigun',     tier: 'Mk.III GUN', col: '#FFE07A', spr: 'tool:rotary_minigun', badge: '⚡ MERGE READY!', lock: false, price: '58 SCRAP' },
        { name: 'Cryo-Robo Pup',      tier: 'Mk.II PET',  col: '#60EFFF', spr: 'pet:frost_pup',    badge: '🔥❄ FROSTFIRE COMBO', lock: false, price: '32 SCRAP' }
      ];
      const cw = 256;
      const gap = 20;
      const startX = (W - (cw * 4 + gap * 3)) / 2;
      cards.forEach((c, i) => {
        const pop = easeOutBack((st - 0.08 - i * 0.08) / 0.34);
        if (pop <= 0.01) return;
        const cx = startX + i * (cw + gap);
        const cy = 222;
        ctx.save();
        ctx.translate(cx + cw / 2, cy + 145);
        ctx.scale(pop, pop);
        ctx.translate(-cw / 2, -145);

        ctx.fillStyle = c.lock ? 'rgba(255, 212, 102, 0.14)' : 'rgba(22, 29, 46, 0.95)';
        ctx.beginPath(); ctx.roundRect(0, 0, cw, 290, 16); ctx.fill();
        ctx.strokeStyle = c.lock ? '#FFE07A' : c.col;
        ctx.lineWidth = c.lock ? 3 : 2;
        ctx.stroke();

        // Top pill
        ctx.fillStyle = c.col;
        ctx.font = '700 12px "Fredoka", "Lexend", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(c.tier, 16, 28);

        // Real SVG Sprite!
        this.drawSprite(c.spr, cw / 2 - 48, 42, 96, 96);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 18px "Fredoka", "Lexend", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(c.name, cw / 2, 164);

        // Action / Lock pill
        ctx.fillStyle = c.lock ? '#FFE07A' : 'rgba(255,255,255,0.1)';
        ctx.beginPath(); ctx.roundRect(16, 182, cw - 32, 34, 9); ctx.fill();
        ctx.fillStyle = c.lock ? '#0D1322' : c.col;
        ctx.font = '700 12px "Fredoka", "Lexend", sans-serif';
        ctx.fillText(c.badge, cw / 2, 203);

        // Buy button
        ctx.fillStyle = '#FFC233';
        ctx.beginPath(); ctx.roundRect(16, 230, cw - 32, 42, 10); ctx.fill();
        ctx.fillStyle = '#0D1322';
        ctx.font = '700 14px "Fredoka", "Lexend", sans-serif';
        ctx.fillText(`BUY — ${c.price}`, cw / 2, 256);

        ctx.restore();
      });

      // 3. Bottom Strip: 5 Run Modifiers + Unlockable Hats!
      const mods = [
        { txt: '⚡ Turbo Speed', col: '#FFE07A' },
        { txt: '☠ Double Bosses', col: '#E8483F' },
        { txt: '🟣 All Cursed', col: '#B98AE8' },
        { txt: '🐾 Pet Frenzy', col: '#FFC233' },
        { txt: '💀 Glass Cannon', col: '#FF7D7D' }
      ];
      ctx.fillStyle = '#A8B5CC';
      ctx.font = '700 13px "Fredoka", "Lexend", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('STACKABLE RUN MODIFIERS (+160% SHARDS) & 10 UNLOCKABLE ALIEN HATS:', 92, 558);

      let mx = 92;
      mods.forEach((m, i) => {
        const lit = st > 1.2 + i * 0.35;
        ctx.font = '700 14px "Fredoka", "Lexend", sans-serif';
        const mw = ctx.measureText(m.txt).width + 26;
        ctx.fillStyle = lit ? m.col : 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.roundRect(mx, 574, mw, 36, 10); ctx.fill();
        ctx.fillStyle = lit ? '#0D1322' : '#DCE8F5';
        ctx.fillText(m.txt, mx + 13, 597);
        mx += mw + 12;
      });

      // Mini hat row on the right
      ['hat:neon_crown', 'hat:mushroom_cap', 'hat:top_hat', 'hat:cursed_horns', 'hat:star_crown'].forEach((hk, i) => {
        this.drawSprite(hk, W - 310 + i * 44, 566, 44, 44);
      });
    }

    renderOutroOverlay(ctx, st) {
      const pop = easeOutBack(st / 0.65);

      ctx.fillStyle = 'rgba(10, 15, 28, 0.56)';
      ctx.beginPath(); ctx.roundRect(W / 2 - 440, 108, 880, 494, 28); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 194, 51, 0.65)';
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Orbiting hero + pet showcase at top
      const heroes = [
        { k: 'char:nasa', hat: 'hat:neon_crown', x: -240 },
        { k: 'char:mochi', hat: 'hat:mushroom_cap', x: -120 },
        { k: 'pet:mech_rex', hat: null, x: 0 },
        { k: 'char:octo', hat: 'hat:gold_hardhat', x: 120 },
        { k: 'char:quantum', hat: 'hat:star_crown', x: 240 }
      ];
      heroes.forEach((h, i) => {
        const bob = Math.sin(st * 4.5 + i) * 6;
        this.drawSprite(h.hat ? h.k.replace('char:', 'charbare:') : h.k, W / 2 + h.x - 42, 146 + bob, 84, 84);
        if (h.hat) this.drawSprite(h.hat, W / 2 + h.x - 42, 141 + bob, 84, 84);
      });

      // Main Logo
      ctx.save();
      ctx.translate(W / 2, 330);
      ctx.scale(0.85 + 0.15 * pop, 0.85 + 0.15 * pop);
      ctx.font = '600 92px "Fredoka", "Lexend", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('MULTI', -18, 0);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFE07A';
      ctx.fillText('-', 0, 0);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFC233';
      ctx.fillText('MINE', 18, 0);
      ctx.restore();

      // Summary Pills
      const pills = ['14 ENGINEERS', '50 WEAPONS & GUNS', '10 COMBAT PETS', '94 ITEMS', '5 BIOMES', 'ENDLESS ∞'];
      ctx.font = '700 13px "Fredoka", "Lexend", sans-serif';
      let totalW = 0;
      const widths = pills.map((p) => { const w = ctx.measureText(p).width + 20; totalW += w + 8; return w; });
      let px = W / 2 - (totalW - 8) / 2;
      pills.forEach((p, i) => {
        ctx.fillStyle = 'rgba(255, 194, 51, 0.16)';
        ctx.beginPath(); ctx.roundRect(px, 366, widths[i], 30, 8); ctx.fill();
        ctx.strokeStyle = 'rgba(255, 194, 51, 0.5)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = '#D8FFF4';
        ctx.textAlign = 'center';
        ctx.fillText(p, px + widths[i] / 2, 386);
        px += widths[i] + 8;
      });

      // CTA Pill
      const pulse = 1 + Math.sin(st * 6) * 0.03;
      ctx.save();
      ctx.translate(W / 2, 476);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#FFC233';
      ctx.beginPath(); ctx.roundRect(-230, -32, 460, 64, 18); ctx.fill();
      ctx.fillStyle = '#0D1322';
      ctx.font = '600 26px "Fredoka", "Lexend", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PLAY FREE IN YOUR BROWSER', 0, 9);
      ctx.restore();

      ctx.fillStyle = '#A8B5CC';
      ctx.font = '600 16px "Fredoka", "Lexend", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ALL 14 ALIEN ENGINEERS & HAZARD TIERS UNLOCKED IMMEDIATELY', W / 2, 558);
    }

    updateProgressUI() {
      const fill = document.getElementById('progress-fill');
      const clock = document.getElementById('trailer-clock');
      if (fill) fill.style.width = `${clamp((this.time / TOTAL_DUR) * 100, 0, 100)}%`;
      if (clock) {
        const cur = Math.floor(this.time);
        const tot = Math.floor(TOTAL_DUR);
        const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        clock.textContent = `${fmt(cur)} / ${fmt(tot)}`;
      }
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.MM.trailer = new TrailerDirector();
  });
})();
