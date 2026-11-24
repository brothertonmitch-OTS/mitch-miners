// ============================================================================
// MULTI-MINE — Complete Interactive UI Controller (Screens, HUD & Workshop)
// ============================================================================
window.MM = window.MM || {};

(function () {
  const $ = (id) => document.getElementById(id);
  const RUN_SAVE_KEY = 'multimine_active_run_v1';

  const MODULE_TAG_COLORS = {
    Proc: '#7DCB5A',
    Economy: '#FFCB4B',
    Risk: '#FF7043',
    Status: '#FF8E52',
    Engineering: '#59C3FF',
    'Trade-Off': '#F472B6',
    'Build-Around': '#A78BFA',
    Sustain: '#4ADE80',
    Cursed: '#B98AE8',
    Defense: '#60A5FA',
    Core: '#94A3B8',
    Legendary: '#FACC15',
    Pet: '#2DD4BF'
  };

  class UIController {
    constructor(engine) {
      this.engine = engine;
      this.shopOffers = [];
      this.rerollCount = 0;
      this.selectedSlotIndex = -1;
      this.inspectedModuleId = null;
      this.levelDraftCards = [];
      this.toastQueue = [];
      this.activeToast = null;
      this.lastHarvestPay = 0;

      this.bindStaticButtons();
      this.initTouchAndGamepadUI();
      this.showScreen('title');
      this.renderTitleShowcase();
      this.updateAudioButtons();
      this.updateResumeButton();
    }

    // ------------------------------------------------------------------------
    // SAVE & RESUME MID-RUN (AUTO-SAVED AT EVERY WORKSHOP!)
    // ------------------------------------------------------------------------
    saveActiveRun() {
      try {
        if (this.engine.run && this.engine.run.isPractice) return;
        const payload = this.engine.exportSave();
        if (!payload) return;
        payload.shopOffers = (this.shopOffers || []).map((o) => o ? {
          type: o.type,
          id: o.def.id,
          tier: o.tier,
          cost: o.cost,
          locked: !!o.locked,
          bought: !!o.bought,
          cursed: !!o.cursed
        } : null);
        localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(payload));
        this.updateResumeButton();
      } catch (e) {}
    }

    clearSavedRun() {
      try {
        localStorage.removeItem(RUN_SAVE_KEY);
      } catch (e) {}
      this.updateResumeButton();
    }

    getSavedRun() {
      try {
        const raw = localStorage.getItem(RUN_SAVE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        return (data && data.charId && data.wave >= 1) ? data : null;
      } catch (e) {
        return null;
      }
    }

    updateResumeButton() {
      const btn = $('btn-title-resume');
      if (!btn) return;
      const save = this.getSavedRun();
      if (save) {
        const c = window.MM.getCharacter(save.charId);
        btn.classList.remove('hidden');
        btn.textContent = `▶ RESUME W${save.wave + 1} (${c.name})`;
      } else {
        btn.classList.add('hidden');
      }
    }

    resumeSavedRun() {
      const save = this.getSavedRun();
      if (!save) return;
      window.MM.Audio.unlock();
      window.MM.Audio.SFX.buy();
      window.MM.Audio.setMusicMode('menu');
      if (!this.engine.importSave(save)) return;
      $('hud-avatar').innerHTML = this.renderAvatarHtml(save.charId);
      $('hud-charname').textContent = this.engine.run.charDef.name;
      if ($('hud-practice-pill')) $('hud-practice-pill').classList.add('hidden');
      if ($('hud-hero-traits')) {
        $('hud-hero-traits').innerHTML = this.renderHeroTraitsList(this.engine.run.charDef, true);
        $('hud-hero-traits').title = [...(this.engine.run.charDef.pros || []), ...(this.engine.run.charDef.cons || [])].join('\n');
      }
      this.rerollCount = 0;
      this.selectedSlotIndex = -1;
      this.lastHarvestPay = save.lastWaveHarvest || 0;
      this.shopOffers = (save.shopOffers || []).map((o) => {
        if (!o) return null;
        const def = o.type === 'tool' ? window.MM.getContraption(o.id) : window.MM.getModule(o.id);
        return { type: o.type, def, tier: o.tier, cost: o.cost, locked: !!o.locked, bought: !!o.bought, cursed: !!o.cursed };
      });
      if (this.shopOffers.length < 4) {
        this.openWorkshop(this.lastHarvestPay);
      } else {
        this.showScreen('shop');
        $('shop-crate-banner').classList.add('hidden');
        this.renderWorkshop();
      }
    }

    openMixer() {
      window.MM.Audio.unlock();
      const mv = Math.round(window.MM.Audio.getMusicVolume() * 100);
      const sv = Math.round(window.MM.Audio.getSfxVolume() * 100);
      const tr = window.MM.Audio.getTrackOverride();
      $('slider-music-vol').value = mv;
      $('mixer-music-val').textContent = `${mv}%`;
      $('slider-sfx-vol').value = sv;
      $('mixer-sfx-val').textContent = `${sv}%`;
      document.querySelectorAll('#mixer-tracks .track-pill').forEach((b) => {
        b.classList.toggle('active', b.dataset.track === tr);
      });
      const prefs = window.MM.Meta.getPrefs();
      if ($('btn-pref-shake')) {
        $('btn-pref-shake').classList.toggle('active', prefs.screenShake !== false);
        $('btn-pref-shake').textContent = prefs.screenShake !== false ? 'Screen Shake: ON' : 'Screen Shake: OFF';
      }
      if ($('btn-pref-dmgnums')) {
        $('btn-pref-dmgnums').classList.toggle('active', prefs.damageNumbers !== false);
        $('btn-pref-dmgnums').textContent = prefs.damageNumbers !== false ? 'Damage Numbers: ON' : 'Damage Numbers: OFF';
      }
      this.syncTouchPrefUI();
      $('modal-mixer').classList.remove('hidden');
    }

    bindStaticButtons() {
      // Title screen
      $('btn-title-play').onclick = () => {
        window.MM.Audio.unlock();
        window.MM.Audio.SFX.click();
        this.showScreen('select');
        this.renderCharSelect();
      };
      if ($('btn-title-resume')) {
        $('btn-title-resume').onclick = () => this.resumeSavedRun();
      }
      if ($('btn-title-practice')) {
        $('btn-title-practice').onclick = () => {
          window.MM.Audio.unlock();
          window.MM.Audio.SFX.click();
          this.openPracticeModal();
        };
      }
      if ($('btn-title-daily')) {
        $('btn-title-daily').onclick = () => {
          window.MM.Audio.unlock();
          window.MM.Audio.SFX.click();
          this.openDailyModal();
        };
      }
      if ($('btn-daily-close')) {
        $('btn-daily-close').onclick = () => {
          window.MM.Audio.SFX.click();
          $('modal-daily').classList.add('hidden');
        };
      }
      if ($('btn-daily-launch')) {
        $('btn-daily-launch').onclick = () => this.launchDailyChallenge();
      }
      if ($('btn-pref-shake')) {
        $('btn-pref-shake').onclick = () => {
          window.MM.Audio.SFX.click();
          const on = window.MM.Meta.togglePref('screenShake');
          $('btn-pref-shake').classList.toggle('active', on);
          $('btn-pref-shake').textContent = on ? 'Screen Shake: ON' : 'Screen Shake: OFF';
        };
      }
      if ($('btn-pref-dmgnums')) {
        $('btn-pref-dmgnums').onclick = () => {
          window.MM.Audio.SFX.click();
          const on = window.MM.Meta.togglePref('damageNumbers');
          $('btn-pref-dmgnums').classList.toggle('active', on);
          $('btn-pref-dmgnums').textContent = on ? 'Damage Numbers: ON' : 'Damage Numbers: OFF';
        };
      }
      // Workshop Quality-of-Life Keyboard Shortcuts (R = Reroll, 1-4 = Buy, Enter = Next Wave)
      window.addEventListener('keydown', (e) => {
        if ($('screen-shop').classList.contains('hidden')) return;
        const anyModalOpen = ['modal-levelup', 'modal-crate', 'modal-lab', 'modal-codex', 'modal-mixer', 'modal-pause', 'modal-end', 'modal-practice', 'modal-daily', 'modal-guide', 'modal-runsetup', 'modal-settings']
          .some((id) => $(id) && !$(id).classList.contains('hidden'));
        if (anyModalOpen) return;
        const k = e.key.toLowerCase();
        if (k === 'r') {
          e.preventDefault();
          this.rerollShop();
        } else if (k === 'm') {
          e.preventDefault();
          this.mergeAllEquipped();
        } else if (k === 'enter') {
          e.preventDefault();
          $('btn-shop-nextwave').click();
        } else if (k >= '1' && k <= '4') {
          const idx = Number(k) - 1;
          if (this.shopOffers && this.shopOffers[idx] && !this.shopOffers[idx].bought) {
            this.buyOffer(idx);
          }
        }
      });
      if ($('btn-practice-close')) {
        $('btn-practice-close').onclick = () => {
          window.MM.Audio.SFX.click();
          $('modal-practice').classList.add('hidden');
        };
      }
      if ($('btn-practice-launch')) {
        $('btn-practice-launch').onclick = () => {
          if (this.practiceSelectedId) this.launchPracticeTrial(this.practiceSelectedId);
        };
      }
      // Interactive Visual Quick-Guide (? How to Play)
      document.querySelectorAll('.btn-guide-open').forEach((b) => {
        b.onclick = () => {
          window.MM.Audio.SFX.click();
          $('modal-guide').classList.remove('hidden');
        };
      });
      const closeGuide = () => {
        window.MM.Audio.SFX.click();
        $('modal-guide').classList.add('hidden');
        const meta = window.MM.Meta.get();
        meta.guideSeen = true;
        window.MM.Meta.save();
      };
      if ($('btn-guide-close')) $('btn-guide-close').onclick = closeGuide;
      if ($('btn-guide-gotit')) $('btn-guide-gotit').onclick = closeGuide;
      if ($('btn-shop-merge-all')) {
        $('btn-shop-merge-all').onclick = () => this.mergeAllEquipped();
      }

      // Audio Mixer controls
      document.querySelectorAll('.btn-mixer-open').forEach((b) => {
        b.onclick = () => {
          window.MM.Audio.SFX.click();
          this.openMixer();
        };
      });
      if ($('btn-mixer-close')) {
        $('btn-mixer-close').onclick = () => {
          window.MM.Audio.SFX.click();
          $('modal-mixer').classList.add('hidden');
        };
      }
      if ($('slider-music-vol')) {
        $('slider-music-vol').oninput = (e) => {
          const val = Number(e.target.value);
          $('mixer-music-val').textContent = `${val}%`;
          window.MM.Audio.setMusicVolume(val / 100);
          this.updateAudioButtons();
        };
      }
      if ($('slider-sfx-vol')) {
        $('slider-sfx-vol').oninput = (e) => {
          const val = Number(e.target.value);
          $('mixer-sfx-val').textContent = `${val}%`;
          window.MM.Audio.setSfxVolume(val / 100);
          this.updateAudioButtons();
        };
      }
      document.querySelectorAll('#mixer-tracks .track-pill').forEach((b) => {
        b.onclick = () => {
          window.MM.Audio.unlock();
          window.MM.Audio.SFX.click();
          window.MM.Audio.setTrackOverride(b.dataset.track);
          document.querySelectorAll('#mixer-tracks .track-pill').forEach((p) => p.classList.toggle('active', p === b));
        };
      });
      // Clickable HUD Ultimate & Pet Rally buttons
      if ($('hud-ult-box')) {
        $('hud-ult-box').onclick = () => this.engine.triggerUltimate();
      }
      if ($('hud-rally-box')) {
        $('hud-rally-box').onclick = () => this.engine.triggerPetRally();
      }
      // Workshop sidebar Telemetry / DPS Meter tabs
      if ($('btn-side-stats') && $('btn-side-dps')) {
        $('btn-side-stats').onclick = () => {
          window.MM.Audio.SFX.click();
          $('btn-side-stats').classList.add('active');
          $('btn-side-dps').classList.remove('active');
          $('shop-stats').classList.remove('hidden');
          $('shop-dps').classList.add('hidden');
        };
        $('btn-side-dps').onclick = () => {
          window.MM.Audio.SFX.click();
          $('btn-side-dps').classList.add('active');
          $('btn-side-stats').classList.remove('active');
          $('shop-dps').classList.remove('hidden');
          $('shop-stats').classList.add('hidden');
        };
      }
      $('btn-title-lab').onclick = () => {
        window.MM.Audio.unlock();
        window.MM.Audio.SFX.click();
        this.openLab();
      };
      $('btn-title-codex').onclick = () => {
        window.MM.Audio.unlock();
        window.MM.Audio.SFX.click();
        this.openCodex('tools');
      };

      // Char select
      $('btn-select-back').onclick = () => {
        window.MM.Audio.SFX.click();
        this.showScreen('title');
      };
      $('btn-select-lab').onclick = () => {
        window.MM.Audio.SFX.click();
        this.openLab();
      };
      $('btn-launch-run').onclick = () => {
        window.MM.Audio.unlock();
        const meta = window.MM.Meta.get();
        const charId = meta.selectedChar;
        if (!window.MM.Meta.isCharUnlocked(charId)) {
          if (window.MM.Meta.unlockChar(charId)) {
            window.MM.Audio.SFX.merge();
            $('title-shards').textContent = window.MM.Meta.get().shards;
            this.renderTitleShowcase();
            this.renderCharSelect();
          }
          return;
        }
        window.MM.Audio.SFX.buy();
        $('modal-runsetup').classList.add('hidden');
        this.startNewRun(charId, meta.selectedHazard, false);
      };
      // Select screen: NEXT opens Run Setup (or unlocks a locked engineer)
      $('btn-select-next').onclick = () => {
        window.MM.Audio.unlock();
        const charId = window.MM.Meta.get().selectedChar;
        if (!window.MM.Meta.isCharUnlocked(charId)) {
          $('btn-launch-run').onclick();
          return;
        }
        window.MM.Audio.SFX.click();
        $('modal-runsetup').classList.remove('hidden');
      };
      $('btn-runsetup-back').onclick = () => {
        window.MM.Audio.SFX.click();
        $('modal-runsetup').classList.add('hidden');
      };
      // Title: Settings window (audio, fullscreen, how to play, trailer, controls)
      $('btn-title-settings').onclick = () => {
        window.MM.Audio.SFX.click();
        $('modal-settings').classList.remove('hidden');
      };
      $('btn-settings-close').onclick = () => {
        window.MM.Audio.SFX.click();
        $('modal-settings').classList.add('hidden');
      };
      if ($('btn-dossier-practice')) {
        $('btn-dossier-practice').onclick = () => {
          window.MM.Audio.unlock();
          const charId = window.MM.Meta.get().selectedChar;
          this.launchPracticeTrial(charId);
        };
      }

      // Lab & Codex close
      $('btn-lab-close').onclick = () => {
        window.MM.Audio.SFX.click();
        $('modal-lab').classList.add('hidden');
        if (!$('screen-select').classList.contains('hidden')) this.renderCharSelect();
      };
      $('btn-codex-close').onclick = () => {
        window.MM.Audio.SFX.click();
        $('modal-codex').classList.add('hidden');
      };
      document.querySelectorAll('.codex-tab').forEach((btn) => {
        btn.onclick = () => {
          window.MM.Audio.SFX.click();
          this.openCodex(btn.dataset.tab);
        };
      });

      // Audio & HUD controls
      document.querySelectorAll('.btn-sfx-toggle').forEach((b) => {
        b.onclick = () => {
          window.MM.Audio.toggleSfx();
          this.updateAudioButtons();
        };
      });
      document.querySelectorAll('.btn-music-toggle').forEach((b) => {
        b.onclick = () => {
          window.MM.Audio.toggleMusic();
          this.updateAudioButtons();
        };
      });
      const updateFsButtons = () => {
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        document.querySelectorAll('.btn-fullscreen-toggle').forEach((b) => {
          if (b.classList.contains('btn-hud')) b.textContent = isFs ? '✕⛶' : '⛶';
          else b.textContent = isFs ? '⛶ Exit Fullscreen' : '⛶ Fullscreen';
        });
        if (this.engine && this.engine.resize) setTimeout(() => this.engine.resize(), 80);
      };
      const fsSupported = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
      document.querySelectorAll('.btn-fullscreen-toggle').forEach((b) => {
        if (!fsSupported) { b.classList.add('hidden'); return; }
        b.onclick = () => {
          window.MM.Audio.SFX.click();
          const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
          try {
            if (!isFs) {
              const req = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
              if (req) req.call(document.documentElement);
            } else {
              const ex = document.exitFullscreen || document.webkitExitFullscreen;
              if (ex) ex.call(document);
            }
          } catch (e) {}
        };
      });
      document.addEventListener('fullscreenchange', updateFsButtons);
      document.addEventListener('webkitfullscreenchange', updateFsButtons);
      $('btn-hud-pause').onclick = () => {
        window.MM.Audio.SFX.click();
        this.engine.pause();
      };
      $('btn-hud-mouse').onclick = () => {
        window.MM.Audio.SFX.click();
        this.engine.mouseFollow = !this.engine.mouseFollow;
        $('btn-hud-mouse').classList.toggle('active', this.engine.mouseFollow);
        $('btn-hud-mouse').textContent = this.engine.mouseFollow ? 'Move: Mouse+WASD' : 'Move: WASD';
      };

      // Pause modal
      $('btn-pause-resume').onclick = () => {
        window.MM.Audio.SFX.click();
        this.engine.resume();
      };
      $('btn-pause-restart').onclick = () => {
        window.MM.Audio.SFX.click();
        $('modal-pause').classList.add('hidden');
        if (this.engine.run && this.engine.run.isPractice) {
          window.MM.Audio.setMusicMode('menu');
          this.engine.state = 'menu';
          this.showScreen('title');
          this.openPracticeModal();
          return;
        }
        this.startNewRun(this.engine.run.charId, this.engine.run.hazard.level, false);
      };
      $('btn-pause-quit').onclick = () => {
        window.MM.Audio.SFX.click();
        window.MM.Audio.setMusicMode('menu');
        $('modal-pause').classList.add('hidden');
        this.engine.state = 'menu';
        this.showScreen('select');
        this.renderCharSelect();
      };

      // Workshop buttons
      $('btn-shop-reroll').onclick = () => this.rerollShop();
      $('btn-shop-nextwave').onclick = () => {
        window.MM.Audio.SFX.buy();
        $('screen-shop').classList.add('hidden');
        $('hud').classList.remove('hidden');
        this.engine.startWave(this.engine.run.wave + 1);
      };
      $('btn-level-reroll').onclick = () => this.rerollLevelDraft();

      // End screen buttons
      $('btn-end-endless').onclick = () => {
        window.MM.Audio.SFX.buy();
        this.engine.run.endless = true;
        $('modal-end').classList.add('hidden');
        this.openBetweenWaves(this.engine.run, 25);
      };
      $('btn-end-retry').onclick = () => {
        window.MM.Audio.SFX.click();
        $('modal-end').classList.add('hidden');
        if (this.engine.run && this.engine.run.isPractice) {
          this.showScreen('title');
          this.openPracticeModal();
          return;
        }
        this.startNewRun(this.engine.run.charId, this.engine.run.hazard.level, false);
      };
      $('btn-end-roster').onclick = () => {
        window.MM.Audio.SFX.click();
        $('modal-end').classList.add('hidden');
        this.showScreen('select');
        this.renderCharSelect();
      };
    }

    updateAudioButtons() {
      const sfx = window.MM.Audio.isSfxEnabled();
      const mus = window.MM.Audio.isMusicEnabled();
      document.querySelectorAll('.btn-sfx-toggle').forEach((b) => {
        b.textContent = sfx ? 'SFX: ON' : 'SFX: OFF';
        b.classList.toggle('active', sfx);
      });
      document.querySelectorAll('.btn-music-toggle').forEach((b) => {
        b.textContent = mus ? 'Music: ON' : 'Music: OFF';
        b.classList.toggle('active', mus);
      });
    }

    showScreen(name) {
      ['screen-title', 'screen-select', 'screen-shop', 'hud'].forEach((id) => {
        $(id).classList.add('hidden');
      });
      if (name === 'title') $('screen-title').classList.remove('hidden');
      if (name === 'select') $('screen-select').classList.remove('hidden');
      if (name === 'shop') $('screen-shop').classList.remove('hidden');
      if (name === 'hud') $('hud').classList.remove('hidden');
    }

    // ------------------------------------------------------------------------
    // TITLE SCREEN SHOWCASE
    // ------------------------------------------------------------------------
    renderTitleShowcase() {
      const wrap = $('title-parade');
      if (wrap) wrap.innerHTML = '';
      if (wrap) window.MM.CHARACTERS.forEach((c, idx) => {
        const unlocked = window.MM.Meta.isCharUnlocked(c.id);
        const div = document.createElement('div');
        div.className = 'parade-alien' + (unlocked ? '' : ' locked');
        div.style.animationDelay = `${idx * 0.1}s`;
        div.innerHTML = window.MM.SVGs.getSvg('char:' + c.id) + (unlocked ? '' : '<span class="parade-lock">🔒</span>');
        div.title = unlocked ? `${c.name} — ${c.title}` : `${c.name} — ${c.title} (LOCKED • ${c.unlockCost} ◈ or Practice 150 ◈)`;
        wrap.appendChild(div);
      });
      $('title-shards').textContent = window.MM.Meta.get().shards;
      const lockedCnt = window.MM.Meta.getLockedChars().length;
      if ($('btn-title-practice')) {
        $('btn-title-practice').textContent = lockedCnt > 0
          ? 'Practice'
          : 'Practice ✓';
      }
    }

    // ------------------------------------------------------------------------
    // DAILY CHALLENGE MODAL (Seeded Daily Run with 2x Core Shards!)
    // ------------------------------------------------------------------------
    openDailyModal() {
      const daily = window.MM.getDailyChallenge();
      const meta = window.MM.Meta.get();
      const charDef = window.MM.getCharacter(daily.charId);
      const bestW = (meta.dailyBestWave && meta.dailyBestWave[daily.dateKey]) || 0;
      const cleared = !!(meta.dailyCleared && meta.dailyCleared[daily.dateKey]);
      const body = $('daily-body');
      if (body) {
        body.innerHTML = `
          <div class="daily-date-pill">📅 ${daily.dateKey} • ${cleared ? '✓ CLEARED TODAY!' : '2× CORE SHARDS REWARD'}</div>
          <div class="daily-hero-row">
            <div class="daily-hero-ava">${this.renderAvatarHtml(charDef.id)}</div>
            <div style="text-align:left;">
              <div class="daily-hero-name">${charDef.name}</div>
              <div class="daily-hero-role" style="color:${charDef.accent}">${charDef.title}</div>
              <div class="daily-meta-pills">
                <span class="syn-tag" style="--tc:#FFD666">HAZARD ${daily.hazard}</span>
                <span class="syn-tag" style="--tc:#FFC233">${daily.biomeName}</span>
                ${daily.modLabels.map((m) => `<span class="syn-tag" style="--tc:#B98AE8">${m}</span>`).join('')}
              </div>
            </div>
          </div>
          ${this.renderHeroTraitsList(charDef, false)}
          <div class="daily-best-row">Today's Best Wave: <b>${bestW ? `Wave ${bestW}` : 'Not Attempted Yet'}</b></div>
        `;
      }
      $('modal-daily').classList.remove('hidden');
    }

    launchDailyChallenge() {
      const daily = window.MM.getDailyChallenge();
      window.MM.Audio.unlock();
      window.MM.Audio.SFX.buy();
      $('modal-daily').classList.add('hidden');
      this.clearSavedRun();
      this.shopOffers = [];
      this.selectedSlotIndex = -1;
      this.engine.resetRunState(daily.charId, daily.hazard, {
        biomeId: daily.biomeId,
        modifiers: [...daily.modifiers],
        dailyKey: daily.dateKey
      });
      this.showScreen('hud');
      $('hud-avatar').innerHTML = this.renderAvatarHtml(daily.charId);
      $('hud-charname').textContent = this.engine.run.charDef.name;
      if ($('hud-practice-pill')) {
        $('hud-practice-pill').textContent = '📅 DAILY 2×';
        $('hud-practice-pill').classList.remove('hidden');
      }
      if ($('hud-hero-traits')) {
        const c = this.engine.run.charDef;
        $('hud-hero-traits').innerHTML = this.renderHeroTraitsList(c, true);
      }
      this.renderHudSynergies();
      this.engine.startWave(1);
    }

    // ------------------------------------------------------------------------
    // PRACTICE LAB MODAL (150 ◈ — TEST 1 LOCKED ENGINEER ONLY!)
    // ------------------------------------------------------------------------
    openPracticeModal() {
      const locked = window.MM.Meta.getLockedChars();
      if (!this.practiceSelectedId || !window.MM.Meta.canPracticeChar(this.practiceSelectedId)) {
        this.practiceSelectedId = locked.length > 0 ? locked[0].id : null;
      }
      $('modal-practice').classList.remove('hidden');
      this.renderPracticeModal();
    }

    renderPracticeModal() {
      const meta = window.MM.Meta.get();
      const cost = window.MM.Meta.PRACTICE_COST || 150;
      const locked = window.MM.Meta.getLockedChars();
      $('practice-shards').textContent = meta.shards;

      const grid = $('practice-grid');
      const empty = $('practice-empty');
      const launchBtn = $('btn-practice-launch');
      const infoEl = $('practice-selected-info');

      if (locked.length === 0) {
        grid.innerHTML = '';
        grid.classList.add('hidden');
        empty.classList.remove('hidden');
        this.practiceSelectedId = null;
        infoEl.textContent = 'Every Alien Engineer is unlocked! Select them in Start Expedition.';
        launchBtn.disabled = true;
        launchBtn.textContent = '✓ ALL ENGINEERS UNLOCKED';
        return;
      }

      grid.classList.remove('hidden');
      empty.classList.add('hidden');

      if (!this.practiceSelectedId || !window.MM.Meta.canPracticeChar(this.practiceSelectedId)) {
        this.practiceSelectedId = locked[0].id;
      }

      grid.innerHTML = '';
      locked.forEach((c) => {
        const active = c.id === this.practiceSelectedId;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'practice-card' + (active ? ' selected' : '');
        card.style.setProperty('--accent', c.accent);
        card.innerHTML = `
          <div class="practice-card-head">
            <div class="practice-card-svg">${window.MM.SVGs.getSvg('char:' + c.id)}</div>
            <div class="practice-card-meta">
              <div class="practice-card-name">${c.name} <span class="practice-lock-tag">🔒 LOCKED</span></div>
              <div class="practice-card-role" style="color:${c.accent}">${c.title}</div>
              <div class="practice-card-ult">★ [E] ${c.ultimate ? c.ultimate.name : 'Overdrive'}</div>
            </div>
          </div>
          ${this.renderHeroTraitsList(c, false)}
          <div class="practice-card-foot">Permanent Unlock: <b>${c.unlockCost} ◈</b> (in Roster)</div>
        `;
        card.onclick = () => {
          window.MM.Audio.SFX.click();
          this.practiceSelectedId = c.id;
          this.renderPracticeModal();
        };
        grid.appendChild(card);
      });

      const sel = window.MM.getCharacter(this.practiceSelectedId);
      const canAfford = meta.shards >= cost && window.MM.Meta.canPracticeChar(sel.id);
      infoEl.innerHTML = `Selected for Practice: <b style="color:${sel.accent}">${sel.name}</b> (${sel.title}) — Costs <b>${cost} ◈</b> for a <b>3-wave max</b> practice trial.`;
      launchBtn.disabled = !canAfford;
      launchBtn.textContent = canAfford
        ? `🧪 START 3-WAVE PRACTICE — ${sel.name.toUpperCase()} (${cost} ◈)`
        : `🔒 NEED ${cost} ◈ SHARDS (HAVE ${meta.shards} ◈)`;
    }

    launchPracticeTrial(charId) {
      if (!window.MM.Meta.canPracticeChar(charId)) {
        this.renderPracticeModal();
        return;
      }
      if (!window.MM.Meta.payPracticeFee(charId)) {
        window.MM.Audio.SFX.click();
        return;
      }
      window.MM.Audio.SFX.buy();
      $('title-shards').textContent = window.MM.Meta.get().shards;
      $('modal-practice').classList.add('hidden');
      const meta = window.MM.Meta.get();
      this.startNewRun(charId, meta.selectedHazard || 1, true);
    }

    renderAvatarHtml(charId, forcedHatId = null) {
      const hatId = forcedHatId !== null ? forcedHatId : (window.MM.Meta.get().selectedHat || 'none');
      if (!hatId || hatId === 'none') return `<div class="avatar-stack">${window.MM.SVGs.getSvg('char:' + charId)}</div>`;
      const base = window.MM.SVGs.getSvg('charbare:' + charId);
      return `<div class="avatar-stack">${base}<span class="avatar-hat-layer">${window.MM.SVGs.getSvg('hat:' + hatId)}</span></div>`;
    }

    renderHeroTraitsList(c, compact = false) {
      if (!c) return '';
      const pros = Array.isArray(c.pros) ? c.pros : (c.passiveDesc ? [c.passiveDesc] : []);
      const cons = Array.isArray(c.cons) ? c.cons : [];
      if (compact) {
        const p1 = pros[0] ? `<span class="trait-chip pro">+ ${pros[0]}</span>` : '';
        const c1 = cons[0] ? `<span class="trait-chip con">− ${cons[0]}</span>` : '';
        return p1 + c1;
      }
      return `
        <div class="hero-traits-list">
          ${pros.map((t) => `<div class="trait-line pro"><b>+</b> ${t}</div>`).join('')}
          ${cons.map((t) => `<div class="trait-line con"><b>−</b> ${t}</div>`).join('')}
        </div>
      `;
    }

    getHeroWeaponAffinity(charDef, toolDef) {
      if (!charDef || !toolDef || !charDef.perks) return null;
      const p = charDef.perks;
      const charMults = [];
      if (toolDef.tags.includes('MINES') && p.mineDmgMult) charMults.push(p.mineDmgMult);
      if (toolDef.tags.includes('THERMAL') && p.thermalMult) charMults.push(p.thermalMult);
      if (toolDef.tags.includes('ORBITAL') && p.orbitalDmgMult) charMults.push(p.orbitalDmgMult);
      if (toolDef.tags.includes('ROBOTICS') && p.roboticsDmgMult) charMults.push(p.roboticsDmgMult);
      if (toolDef.tags.includes('VOLTAIC') && p.voltaicDmgMult) charMults.push(p.voltaicDmgMult);
      if (toolDef.tags.includes('SEISMIC') && p.seismicDmgMult) charMults.push(p.seismicDmgMult);
      if (toolDef.kind && toolDef.kind.startsWith('gun_') && p.gunDmgMult) {
        if (!(p.gunDmgMult < 1 && toolDef.tags.includes('THERMAL') && (p.thermalMult || 1) > 1)) {
          charMults.push(p.gunDmgMult);
        }
      }
      let mult = 1;
      if (charMults.length > 0) {
        const pos = charMults.filter((m) => m > 1).sort((a, b) => b - a);
        const neg = charMults.filter((m) => m < 1);
        if (pos.length > 0) {
          let bonus = pos[0] - 1;
          for (let i = 1; i < pos.length; i++) bonus += (pos[i] - 1) * 0.25;
          mult *= (1 + bonus);
        }
        neg.forEach((m) => { mult *= m; });
      }
      const pct = Math.round((mult - 1) * 100);
      if (Math.abs(pct) < 8) return null;
      return { pct, good: pct > 0, label: pct > 0 ? `✓ ${charDef.name.toUpperCase()} +${pct}%` : `⚠ ${charDef.name.toUpperCase()} ${pct}%` };
    }

    formatModuleStatChips(modDef, isCursed = false) {
      if (!modDef || !modDef.mods) return '';
      const labels = {
        maxHp: 'HP', hpRegen: 'Regen', armor: 'Armor', dodge: '% Dodge', lifeSteal: '% Lifesteal',
        harvesting: 'Harvest', speedPct: '% Spd', damagePct: '% Dmg', engineering: 'Eng',
        attackSpeedPct: '% AtkSpd', critChance: '% Crit', areaPct: '% AoE', magnet: 'Magnet',
        luck: 'Luck', scrapPct: '% Scrap', dashCdPct: '% DashCD', shopDiscountPct: '% Disc',
        curseLevel: 'Curse', enemyCountPct: '% Foes'
      };
      const boost = isCursed ? 1.35 : 1.0;
      return Object.keys(modDef.mods).map((k) => {
        const raw = modDef.mods[k];
        const v = (isCursed && raw > 0 && k !== 'curseLevel') ? (Math.abs(raw) < 5 ? Number((raw * boost).toFixed(1)) : Math.round(raw * boost)) : raw;
        if (!v) return '';
        const good = k === 'dashCdPct' ? v < 0 : (k === 'curseLevel' || k === 'enemyCountPct' ? false : v > 0);
        const sign = v > 0 ? '+' : '';
        const lbl = labels[k] || k;
        return `<span class="stat-chip ${good ? 'good' : 'bad'}">${sign}${v}${lbl.startsWith('%') ? lbl : ' ' + lbl}</span>`;
      }).join('');
    }

    // ------------------------------------------------------------------------
    // CHARACTER SELECT (ALL 14 ALIEN ENGINEERS + BIOMES + MODIFIERS + WARDROBE)
    // ------------------------------------------------------------------------
    renderCharSelect() {
      const meta = window.MM.Meta.get();
      $('select-shards').textContent = meta.shards;

      const grid = $('char-grid');
      grid.innerHTML = '';

      window.MM.CHARACTERS.forEach((c) => {
        const selected = c.id === meta.selectedChar;
        const unlocked = window.MM.Meta.isCharUnlocked(c.id);
        const bestW = meta.charBestWave[c.id] || 0;
        const bestH = meta.charBestHazard[c.id] || 0;
        const wins = meta.charWins[c.id] || 0;

        const card = document.createElement('button');
        card.className = 'char-card' + (selected ? ' selected' : '') + (unlocked ? '' : ' locked-char');
        card.style.setProperty('--accent', c.accent);
        const badgeHtml = !unlocked
          ? `<span class="char-badge lock-badge">🔒 ${c.unlockCost}◈</span>`
          : (wins > 0
            ? `<span class="char-badge win">★${wins}${bestH > 0 ? ` H${bestH}` : ''}</span>`
            : (bestW > 0 ? `<span class="char-badge">W${bestW}</span>` : ''));
        card.innerHTML = `
          <div class="char-card-svg">${window.MM.SVGs.getSvg('char:' + c.id)}</div>
          <div class="char-card-name">${c.name}</div>
          <div class="char-card-role">${c.title}</div>
          ${badgeHtml}
        `;
        card.onclick = () => {
          window.MM.Audio.SFX.click();
          window.MM.Meta.setSelectedChar(c.id);
          this.renderCharSelect();
        };
        grid.appendChild(card);
      });

      this.renderCharDossier(window.MM.getCharacter(meta.selectedChar));
      this.renderHazardPicker();
      this.renderBiomePicker();
      this.renderModifierPicker();
    }

    renderCharDossier(c) {
      const meta = window.MM.Meta.get();
      const lab = window.MM.Meta.getLabBonuses();
      $('dossier-avatar').innerHTML = this.renderAvatarHtml(c.id);
      $('dossier-avatar').style.borderColor = c.accent;
      $('dossier-name').textContent = c.name;
      $('dossier-title').textContent = c.title;
      $('dossier-title').style.color = c.accent;
      $('dossier-bio').textContent = c.bio;
      $('dossier-passive-name').textContent = c.passiveName;
      $('dossier-passive-desc').innerHTML = this.renderHeroTraitsList(c, false);
      if ($('dossier-ult-name') && c.ultimate) {
        $('dossier-ult-name').textContent = c.ultimate.name;
        $('dossier-ult-desc').textContent = c.ultimate.desc;
      }

      // Per-Character Run Records strip!
      const recEl = $('dossier-records');
      if (recEl) {
        const wins = meta.charWins[c.id] || 0;
        const bestW = meta.charBestWave[c.id] || 0;
        const bestH = meta.charBestHazard[c.id] || 0;
        const bestE = meta.charBestEndless[c.id] || 0;
        recEl.innerHTML = `
          <div class="rec-pill"><span>WINS</span><b>${wins}</b></div>
          <div class="rec-pill"><span>BEST WAVE</span><b>${bestW ? `W${bestW}` : '—'}</b></div>
          <div class="rec-pill"><span>MAX HAZ</span><b>${bestH ? `H${bestH}` : '—'}</b></div>
          <div class="rec-pill"><span>ENDLESS</span><b>${bestE ? `W${bestE}∞` : '—'}</b></div>
        `;
      }

      // Compact Alien Hat Quick-Picker!
      this.renderDossierHatPicker(c.id);

      // Update Launch / Unlock / Practice buttons based on lock state!
      const unlocked = window.MM.Meta.isCharUnlocked(c.id);
      const launchBtn = $('btn-select-next');
      const pracBtn = $('btn-dossier-practice');
      if (launchBtn) {
        if (unlocked) {
          launchBtn.disabled = false;
          launchBtn.classList.remove('btn-unlock-mode');
          launchBtn.textContent = 'NEXT';
        } else {
          const cost = c.unlockCost || 300;
          const canUnlock = meta.shards >= cost;
          launchBtn.disabled = !canUnlock;
          launchBtn.classList.add('btn-unlock-mode');
          launchBtn.textContent = canUnlock ? `UNLOCK (${cost} ◈)` : `LOCKED · ${cost} ◈`;
        }
      }
      if (pracBtn) {
        const pCost = window.MM.Meta.PRACTICE_COST || 150;
        pracBtn.classList.toggle('hidden', unlocked);
        if (!unlocked) {
          const canPrac = meta.shards >= pCost;
          pracBtn.disabled = !canPrac;
          pracBtn.textContent = canPrac ? `PRACTICE (${pCost} ◈)` : `PRACTICE · NEED ${pCost} ◈`;
        }
      }

      if (c.perks && c.perks.petOnly) {
        const petNames = (c.perks.startingPets || []).map((id) => window.MM.getModule(id).name).join(' + ');
        $('dossier-tool').innerHTML = `
          <div class="dossier-tool-icon">${window.MM.SVGs.getSvg('pet:catling')}</div>
          <div class="dossier-tool-info">
            <div class="dossier-tool-name">Pet-Only Pack <span class="tier-pill t4" style="background:rgba(45,212,191,0.22);color:#2DD4BF">0 WEAPONS</span></div>
            <div class="shop-card-tags"><span class="syn-tag" style="--tc:#2DD4BF">Pets Only</span><span class="syn-tag" style="--tc:#FFD666">1 Pet / 4–5 Shops</span></div>
            <div class="dossier-tool-desc">Starts with ${petNames}! Weapons never appear — recruit 1 new Pet every 4–5 shops & stack modules!</div>
          </div>
        `;
      } else {
        const tool = window.MM.getContraption(c.startTool);
        $('dossier-tool').innerHTML = `
          <div class="dossier-tool-icon">${window.MM.SVGs.getSvg('tool:' + tool.id)}</div>
          <div class="dossier-tool-info">
            <div class="dossier-tool-name">${tool.name} <span class="tier-pill t1">Mk.I</span></div>
            <div class="dossier-tool-tags">${tool.tags.map((t) => `<span class="syn-tag" style="--tc:${window.MM.SYNERGIES[t].color}">${window.MM.SYNERGIES[t].name}</span>`).join('')}</div>
            <div class="dossier-tool-desc">${tool.desc}</div>
          </div>
        `;
      }

      const st = c.stats;
      const rows = [
        ['Max HP', st.maxHp + (lab.maxHp || 0), 160, '#E8483F'],
        ['Speed', Math.round(st.speed * (1 + (lab.speedPct || 0) / 100)), 300, '#6EA5FF'],
        ['Engineering', st.engineering + (lab.engineering || 0), 28, '#FFC233'],
        ['Armor', st.armor, 10, '#7DCB5A'],
        ['Crit %', st.critChance + '%', 30, '#A47BFF']
      ];
      $('dossier-stats').innerHTML = rows.map(([label, val, max, col]) => {
        const num = parseFloat(val) || 0;
        const pct = Math.max(8, Math.min(100, (num / max) * 100));
        return `
          <div class="stat-bar-row">
            <span class="stat-bar-lbl">${label}</span>
            <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${pct}%;background:${col}"></div></div>
            <span class="stat-bar-val">${val}</span>
          </div>
        `;
      }).join('');
    }

    renderHazardPicker() {
      const meta = window.MM.Meta.get();
      const wrap = $('hazard-picker');
      wrap.innerHTML = '';
      window.MM.HAZARDS.forEach((h) => {
        const locked = h.level > meta.maxHazardUnlocked;
        const active = h.level === meta.selectedHazard;
        const btn = document.createElement('button');
        btn.className = `hazard-pill ${active ? 'active' : ''} ${locked ? 'locked' : ''}`;
        btn.textContent = locked ? `H${h.level} 🔒` : `H${h.level}`;
        btn.title = locked ? `Clear Hazard ${h.level - 1} to unlock` : `${h.name}: ${h.desc}`;
        btn.disabled = locked;
        btn.onclick = () => {
          window.MM.Audio.SFX.click();
          window.MM.Meta.setSelectedHazard(h.level);
          this.renderHazardPicker();
          this.renderModifierPicker();
        };
        wrap.appendChild(btn);
      });
      const sel = window.MM.HAZARDS[meta.selectedHazard - 1];
      $('hazard-desc').textContent = `${sel.name} — ${sel.desc}`;
    }

    renderDossierHatPicker(charId) {
      const wrap = $('dossier-hat-picker');
      if (!wrap) return;
      const meta = window.MM.Meta.get();
      wrap.innerHTML = '';
      window.MM.Meta.HATS.forEach((h) => {
        const unlocked = window.MM.Meta.isHatUnlocked(h.id);
        const active = (meta.selectedHat || 'none') === h.id;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `hat-mini-btn ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}`;
        btn.title = unlocked ? `${h.name} — Click to equip` : `${h.name} (Locked: ${h.desc})`;
        btn.innerHTML = h.id === 'none'
          ? `<span class="hat-none-ico">⊘</span>`
          : `${window.MM.SVGs.getSvg('hat:' + h.id)}${unlocked ? '' : '<span class="hat-lock-dot">🔒</span>'}`;
        btn.onclick = () => {
          if (unlocked) {
            window.MM.Audio.SFX.click();
            window.MM.Meta.equipHat(h.id);
            $('dossier-avatar').innerHTML = this.renderAvatarHtml(charId);
            this.renderDossierHatPicker(charId);
          } else if (meta.shards >= h.cost) {
            window.MM.Audio.SFX.merge();
            window.MM.Meta.buyHat(h.id);
            $('select-shards').textContent = window.MM.Meta.get().shards;
            $('dossier-avatar').innerHTML = this.renderAvatarHtml(charId);
            this.renderDossierHatPicker(charId);
          } else {
            window.MM.Audio.SFX.click();
            this.openLab();
          }
        };
        wrap.appendChild(btn);
      });
    }

    renderBiomePicker() {
      const wrap = $('biome-picker');
      if (!wrap) return;
      const meta = window.MM.Meta.get();
      const opts = [{ id: 'auto', icon: '🌀', shortName: 'Auto-Cycle', name: 'Auto-Cycle All 5 Sectors (Starts in Neon Forest)' }]
        .concat(window.MM.BIOMES);
      wrap.innerHTML = '';
      opts.forEach((b) => {
        const active = (meta.selectedBiome || 'auto') === b.id;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `setup-pill ${active ? 'active' : ''}`;
        if (b.accent) btn.style.setProperty('--pill-col', b.accent);
        btn.textContent = `${b.icon || '◈'} ${b.shortName || b.name}`;
        btn.title = b.name;
        btn.onclick = () => {
          window.MM.Audio.SFX.click();
          window.MM.Meta.setSelectedBiome(b.id);
          this.renderBiomePicker();
        };
        wrap.appendChild(btn);
      });
    }

    renderModifierPicker() {
      const wrap = $('modifier-picker');
      if (!wrap) return;
      const meta = window.MM.Meta.get();
      const activeList = meta.selectedModifiers || [];
      wrap.innerHTML = '';
      window.MM.MODIFIERS.forEach((m) => {
        const active = activeList.includes(m.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `setup-pill mod-pill ${active ? 'active' : ''}`;
        btn.style.setProperty('--pill-col', m.color);
        btn.textContent = `${m.icon} ${m.name}`;
        btn.title = m.desc;
        btn.onclick = () => {
          window.MM.Audio.SFX.click();
          window.MM.Meta.toggleModifier(m.id);
          this.renderModifierPicker();
        };
        wrap.appendChild(btn);
      });
      const multEl = $('modifier-mult');
      if (multEl) {
        const mult = window.MM.Meta.getModifierShardMult(activeList);
        const bonusPct = Math.round((mult - 1) * 100);
        multEl.classList.toggle('hidden', bonusPct <= 0);
        multEl.textContent = `+${bonusPct}% ◈ SHARDS`;
      }
      // explain the stacked-risk easing (same rule as GameEngine.isRiskStacked)
      const noteEl = $('modifier-stack-note');
      if (noteEl) {
        const PENALTY = ['glass_cannon', 'all_cursed', 'fast_escalation', 'blood_harvest', 'double_boss', 'turbo'];
        const stacked = (meta.selectedHazard || 1) >= 4 && PENALTY.filter((id) => activeList.includes(id)).length >= 3;
        noteEl.classList.toggle('hidden', !stacked);
      }
    }

    // ------------------------------------------------------------------------
    // START RUN & LIVE HUD
    // ------------------------------------------------------------------------
    startNewRun(charId, hazardLevel, isPractice = false) {
      if (!isPractice) this.clearSavedRun();
      this.shopOffers = [];
      this.selectedSlotIndex = -1;
      const meta = window.MM.Meta.get();
      this.engine.resetRunState(charId, hazardLevel, {
        biomeId: meta.selectedBiome || 'auto',
        modifiers: [...(meta.selectedModifiers || [])],
        isPractice: !!isPractice
      });
      this.showScreen('hud');
      $('hud-avatar').innerHTML = this.renderAvatarHtml(charId);
      $('hud-charname').textContent = this.engine.run.charDef.name;
      if ($('hud-practice-pill')) {
        $('hud-practice-pill').textContent = '🧪 PRACTICE (3 WAVES)';
        $('hud-practice-pill').classList.toggle('hidden', !isPractice);
      }
      if ($('hud-hero-traits')) {
        const c = this.engine.run.charDef;
        $('hud-hero-traits').innerHTML = this.renderHeroTraitsList(c, true);
        $('hud-hero-traits').title = [...(c.pros || []).map((x) => '+ ' + x), ...(c.cons || []).map((x) => '- ' + x)].join('\n');
      }
      this.renderHudSynergies();
      this.engine.startWave(1);
    }

    onWaveStart(waveCfg) {
      this.renderHudSynergies();
      this.renderExpeditionRoadmap($('hud-roadmap'), waveCfg.wave, false);
      this.renderWaveBarMarkers(waveCfg);
      const banner = $('wave-banner');
      $('wave-banner-title').textContent = `WAVE ${waveCfg.wave} — ${waveCfg.biome.name}`;
      $('wave-banner-sub').textContent = waveCfg.subtitle;
      banner.style.borderColor = waveCfg.boss ? '#E8483F' : waveCfg.biome.accent;
      banner.classList.remove('hidden');
      clearTimeout(this._bannerTimeout);
      this._bannerTimeout = setTimeout(() => banner.classList.add('hidden'), 3200);
    }

    renderHudSynergies() {
      const wrap = $('hud-synergies');
      const syn = this.engine.synergies;
      const items = Object.keys(window.MM.SYNERGIES)
        .filter((k) => syn.counts[k] > 0)
        .sort((a, b) => syn.counts[b] - syn.counts[a]);

      const toolHtml = items.map((k) => {
        const def = window.MM.SYNERGIES[k];
        const cnt = syn.counts[k];
        const lit = cnt >= 2;
        const nextGoal = cnt < 2 ? 2 : (cnt < 4 ? 4 : 6);
        const activeTier = syn.active[k] && syn.active[k].tier;
        const tip = activeTier ? `${def.name} (${cnt}): ${activeTier.label}` : `${def.name} (${cnt}/2): Need ${2 - cnt} more`;
        return `
          <div class="hud-syn-pill ${lit ? 'lit' : ''}" style="--tc:${def.color}" title="${tip}">
            <span class="hud-syn-ico">${def.badge || '◈'}</span>${def.name} <b>${cnt}/${nextGoal}</b>
          </div>
        `;
      }).join('');

      const ps = this.engine.petSynergies || this.engine.computePetSynergies();
      const petHtml = (ps && ps.active ? ps.active : []).map((s) => `
        <div class="hud-syn-pill lit pet-syn-pill" style="--tc:${s.color}" title="${s.desc}">
          <span>${s.icon}</span>${s.name}
        </div>
      `).join('');

      wrap.innerHTML = petHtml + toolHtml;
    }

    renderWaveBarMarkers(waveCfg) {
      const wrap = $('hud-wave-bar-markers');
      if (!wrap || !waveCfg) return;
      const dur = waveCfg.duration || 35;
      const pins = [];
      // Elite spawn marker at 7.5s
      if (waveCfg.elite) {
        const pct = Math.min(92, Math.round((7.5 / dur) * 100));
        pins.push(`<span class="wb-pin elite" style="left:${pct}%" title="Elite Dreadnought spawns!">★</span>`);
      }
      // Swarm surge markers on Wave 2+
      if (waveCfg.wave >= 2) {
        const step = Math.max(7.5, 12.5 - waveCfg.wave * 0.3);
        for (let t = 13.5; t < dur - 3; t += step) {
          const pct = Math.min(94, Math.round((t / dur) * 100));
          pins.push(`<span class="wb-pin surge" style="left:${pct}%" title="Swarm Surge!">⚡</span>`);
        }
      }
      // Final 40% Intensity Rush marker at 60%
      pins.push(`<span class="wb-pin rush" style="left:60%" title="Final 40% Intensity Rush (+38% spawns, tougher foes)">🔥</span>`);
      wrap.innerHTML = pins.join('');
    }

    renderExpeditionRoadmap(container, currentWave, isShop = false) {
      if (!container) return;
      const isPractice = !!(this.engine.run && this.engine.run.isPractice);
      const biomeId = (this.engine.run && this.engine.run.biomeId) || 'auto';
      const targetWave = isShop ? currentWave + 1 : currentWave;
      const totalNodes = isPractice ? 3 : 12;
      const blockStart = isPractice ? 1 : (Math.floor((Math.max(1, targetWave) - 1) / 12) * 12 + 1);
      let html = '';
      for (let w = blockStart; w < blockStart + totalNodes; w++) {
        const cfg = window.MM.getWaveConfig(w, biomeId);
        const done = isShop ? w <= currentWave : w < currentWave;
        const isCurrent = w === targetWave;
        let kind = 'normal';
        let icon = `${w}`;
        let label = `Wave ${w} — ${cfg.biome.name}`;
        if (cfg.boss) {
          kind = 'boss';
          icon = cfg.secondBoss ? '☠☠' : '☠';
          const bName = (window.MM.ENEMIES[cfg.boss] && window.MM.ENEMIES[cfg.boss].name) || 'BOSS';
          label = cfg.secondBoss
            ? `Wave ${w} TWIN BOSSES! (${cfg.biome.name})`
            : `Wave ${w} BOSS: ${bName} (${cfg.biome.name})`;
        } else if (cfg.isHorde) {
          kind = 'horde';
          icon = '⚡';
          label = `Wave ${w} HORDE SWARM + Loot Pinatas (${cfg.biome.name})`;
        } else if (cfg.elite) {
          kind = 'elite';
          icon = '★';
          label = `Wave ${w} ELITE MINI-BOSS + Guaranteed Crate (${cfg.biome.name})`;
        }
        const cls = `rm-node rm-${kind} ${done ? 'done' : ''} ${isCurrent ? 'current' : ''}`;
        html += `<div class="${cls}" title="${label}"><span class="rm-ico">${done ? '✓' : icon}</span><span class="rm-num">W${w}</span></div>`;
      }
      container.innerHTML = html;
    }

    updateHud(snap) {
      $('hud-hp-text').textContent = snap.shield > 0 ? `${snap.hp}/${snap.maxHp} (+${snap.shield})` : `${snap.hp}/${snap.maxHp}`;
      $('hud-hp-fill').style.width = `${Math.max(0, Math.min(100, (snap.hp / snap.maxHp) * 100))}%`;
      $('hud-shield-fill').style.width = `${Math.max(0, Math.min(100, (snap.shield / snap.maxHp) * 100))}%`;

      $('hud-xp-fill').style.width = `${Math.max(0, Math.min(100, (snap.xp / snap.xpNext) * 100))}%`;
      $('hud-level').textContent = `LV ${snap.level}`;
      $('hud-scrap').textContent = snap.scrap;
      $('hud-kills').textContent = snap.kills;
      const waveTag = snap.waveHasBoss ? ' • ☠ BOSS' : (snap.waveIsHorde ? ' • ⚡ HORDE' : (snap.waveHasElite ? ' • ★ ELITE' : ''));
      const waveCapLbl = this.engine.run.isPractice ? ' / 3' : (this.engine.run.endless ? ' ∞' : ' / 12');
      $('hud-wave-num').textContent = `WAVE ${snap.wave}${waveCapLbl}${waveTag}`;
      $('hud-wave-timer').textContent = `${snap.waveTimer}s`;
      $('hud-biome').textContent = snap.biome;

      // Live In-Wave Progress Bar + Final 40% Rush indicator
      if ($('hud-wave-bar-fill')) {
        const pct = Math.max(0, Math.min(100, ((snap.waveElapsed || 0) / Math.max(1, snap.waveDuration || 35)) * 100));
        $('hud-wave-bar-fill').style.width = `${pct}%`;
        $('hud-wave-bar').classList.toggle('in-rush', pct >= 60);
      }

      // Dash bar
      const dashPct = snap.dashCd <= 0 ? 100 : Math.max(0, (1 - snap.dashCd / snap.dashMax) * 100);
      $('hud-dash-fill').style.width = `${dashPct}%`;
      $('hud-dash-label').textContent = snap.dashCd <= 0 ? 'JET-DASH READY [SPACE]' : `RECHARGING ${snap.dashCd.toFixed(1)}s`;
      $('hud-dash-box').classList.toggle('ready', snap.dashCd <= 0);

      // Ultimate Overdrive bar
      if ($('hud-ult-box')) {
        $('hud-ult-fill').style.width = `${Math.min(100, snap.ultCharge || 0)}%`;
        $('hud-ult-label').textContent = snap.ultReady ? `★ [E] ${snap.ultName.toUpperCase()}!` : `[E] ${snap.ultName} ${snap.ultCharge || 0}%`;
        $('hud-ult-box').classList.toggle('ready', !!snap.ultReady);
      }

      // Pet Command [F] Rally bar (visible whenever you have >= 1 Pet!)
      if ($('hud-rally-box')) {
        const hasPets = (snap.petCount || 0) > 0;
        $('hud-rally-box').classList.toggle('hidden', !hasPets);
        if (hasPets) {
          const rCd = snap.petRallyCd || 0;
          const rMax = snap.petRallyMax || 10;
          const pct = rCd <= 0 ? 100 : Math.max(0, (1 - rCd / rMax) * 100);
          $('hud-rally-fill').style.width = `${pct}%`;
          $('hud-rally-label').textContent = snap.petRallyActive
            ? '🎯 PETS RALLYING!'
            : (rCd <= 0 ? '🐾 [F] PET RALLY READY!' : `🐾 RALLY ${rCd.toFixed(1)}s`);
          $('hud-rally-box').classList.toggle('ready', rCd <= 0 || !!snap.petRallyActive);
          $('hud-rally-box').classList.toggle('active-rally', !!snap.petRallyActive);
        }
      }

      // Sync Mobile Touch Action Buttons (Dash, Ult, Rally)!
      if ($('btn-touch-dash')) {
        const dReady = snap.dashCd <= 0;
        $('btn-touch-dash').classList.toggle('ready', dReady);
        if ($('touch-dash-lbl')) $('touch-dash-lbl').textContent = dReady ? 'DASH' : `${snap.dashCd.toFixed(1)}s`;
      }
      if ($('btn-touch-ult')) {
        $('btn-touch-ult').classList.toggle('ready', !!snap.ultReady);
        if ($('touch-ult-lbl')) $('touch-ult-lbl').textContent = snap.ultReady ? 'ULT!' : `${snap.ultCharge || 0}%`;
      }
      if ($('btn-touch-rally')) {
        const hasPets = (snap.petCount || 0) > 0;
        $('btn-touch-rally').classList.toggle('hidden', !hasPets);
        if (hasPets) {
          $('btn-touch-rally').classList.toggle('ready', (snap.petRallyCd || 0) <= 0 || !!snap.petRallyActive);
        }
      }

      // Live Mid-Wave Arena Event Tracker Pill (Beacon, Cargo-Bot, Reactor Surge!)
      const evPill = $('hud-event-pill');
      if (evPill) {
        if (snap.activeEvent) {
          evPill.classList.remove('hidden');
          evPill.dataset.kind = snap.activeEvent.kind || '';
          if ($('hud-event-text')) $('hud-event-text').textContent = snap.activeEvent.text;
          if ($('hud-event-fill')) $('hud-event-fill').style.width = `${Math.max(0, Math.min(100, snap.activeEvent.pct || 0))}%`;
        } else {
          evPill.classList.add('hidden');
        }
      }

      // Boss bar
      const bossBox = $('hud-boss-bar');
      if (snap.boss) {
        bossBox.classList.remove('hidden');
        $('hud-boss-name').textContent = snap.boss.name;
        $('hud-boss-hp').textContent = `${snap.boss.hp} / ${snap.boss.maxHp}`;
        $('hud-boss-fill').style.width = `${Math.max(0, (snap.boss.hp / snap.boss.maxHp) * 100)}%`;
      } else {
        bossBox.classList.add('hidden');
      }
    }

    onPause(paused) {
      $('modal-pause').classList.toggle('hidden', !paused);
      if (paused && this.engine.run && $('pause-hero-traits')) {
        const c = this.engine.run.charDef;
        $('pause-hero-traits').innerHTML = `
          <div class="pause-hero-head"><b>${c.name}</b> — <span>${c.passiveName}</span></div>
          ${this.renderHeroTraitsList(c, false)}
        `;
      }
    }

    // ------------------------------------------------------------------------
    // BETWEEN WAVES: INTERACTIVE SUPPLY CRATES -> LEVEL-UP DRAFTS -> WORKSHOP
    // ------------------------------------------------------------------------
    openBetweenWaves(run, dividend) {
      $('hud').classList.add('hidden');
      this.rerollCount = 0;
      this.selectedSlotIndex = -1;
      this.lastHarvestPay = dividend || 0;
      this.crateRewards = [];

      if (run.bonusCrates > 0) {
        this.openNextCrateModal();
      } else if (run.pendingLevelUps > 0) {
        this.openLevelUpDraft();
      } else {
        this.openWorkshop(this.lastHarvestPay);
      }
    }

    openNextCrateModal() {
      const run = this.engine.run;
      if (!run || run.bonusCrates <= 0) {
        $('modal-crate').classList.add('hidden');
        if (run && run.pendingLevelUps > 0) this.openLevelUpDraft();
        else this.openWorkshop(this.lastHarvestPay);
        return;
      }

      const mod = this.rollRandomModule(run.wave, this.engine.stats.luck + 18);
      const col = mod.tag === 'Cursed' ? '#B98AE8' : (mod.petId ? '#2DD4BF' : (window.MM.TIER_COLORS[mod.tier] || '#7DCB5A'));
      const recycleScrap = Math.max(10, Math.round(window.MM.getModuleCost(mod, 0, run.wave) * 0.55));
      $('crate-remaining').textContent = `Pending Supply Crates: ${run.bonusCrates}`;
      $('crate-card-body').innerHTML = `
        <div class="crate-item-showcase" style="--tier-col:${col}">
          <span class="tier-pill t${mod.tier}">${window.MM.TIER_NAMES[mod.tier]} ${mod.petId ? 'PET' : (mod.tag || 'MODULE')}</span>
          <div class="crate-item-svg">${window.MM.SVGs.getSvg(mod.icon)}</div>
          <div class="crate-item-name">${mod.name}</div>
          <div class="card-stat-chips">${this.formatModuleStatChips(mod, false)}</div>
          <div class="shop-card-desc">${mod.desc}</div>
        </div>
      `;
      $('btn-crate-take').textContent = `TAKE ${mod.petId ? 'PET' : 'ITEM'}`;
      $('btn-crate-recycle').textContent = `♻ RECYCLE (+${recycleScrap} SCRAP)`;
      $('btn-crate-take').onclick = () => {
        window.MM.Audio.SFX.buy();
        run.bonusCrates--;
        this.engine.applyModule(mod, false);
        this.crateRewards.push(mod);
        this.openNextCrateModal();
      };
      $('btn-crate-recycle').onclick = () => {
        window.MM.Audio.SFX.pickup(6);
        run.bonusCrates--;
        run.scrap += recycleScrap;
        this.openNextCrateModal();
      };
      $('modal-crate').classList.remove('hidden');
    }

    rollRarityTier(wave, luck) {
      const l = luck || 0;
      const r = Math.random() * 100;
      const t4 = Math.min(24, Math.max(0, (wave - 5) * 2.2 + l * 0.22));
      const t3 = Math.min(35, Math.max(0, (wave - 2) * 3.5 + l * 0.38));
      const t2 = Math.min(48, 12 + wave * 3.2 + l * 0.45);
      if (r < t4) return 4;
      if (r < t4 + t3) return 3;
      if (r < t4 + t3 + t2) return 2;
      return 1;
    }

    rollRandomModule(wave, luck, excludePets = false) {
      const targetTier = this.rollRarityTier(wave, luck);
      const pool = window.MM.MODULES.filter((m) => m.tier <= targetTier && (!excludePets || !m.petId));
      const exact = pool.filter((m) => m.tier === targetTier);
      const list = exact.length ? exact : pool;
      return list[Math.floor(Math.random() * list.length)];
    }

    openLevelUpDraft() {
      $('modal-levelup').classList.remove('hidden');
      $('levelup-remaining').textContent = `Pending Upgrades: ${this.engine.run.pendingLevelUps}`;
      this.generateLevelDraftCards();
      this.renderLevelDraftCards();
    }

    generateLevelDraftCards() {
      const pool = [...window.MM.LEVEL_UPGRADES];
      this.levelDraftCards = [];
      for (let i = 0; i < 4 && pool.length; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        const u = pool.splice(idx, 1)[0];
        const tier = this.rollRarityTier(this.engine.run.wave, this.engine.stats.luck);
        this.levelDraftCards.push({ upg: u, tier, val: u.values[tier - 1] });
      }
    }

    rerollLevelDraft() {
      const cost = 6 + this.engine.run.wave * 2;
      if (this.engine.run.scrap < cost) return;
      this.engine.run.scrap -= cost;
      window.MM.Audio.SFX.click();
      this.generateLevelDraftCards();
      this.renderLevelDraftCards();
    }

    renderLevelDraftCards() {
      const cost = 6 + this.engine.run.wave * 2;
      $('btn-level-reroll').textContent = `Reroll (${cost} Scrap)`;
      $('btn-level-reroll').disabled = this.engine.run.scrap < cost;
      $('levelup-scrap').textContent = this.engine.run.scrap;

      const grid = $('levelup-grid');
      grid.innerHTML = '';
      const curStats = this.engine.recomputeStats();
      const formatLevelPreview = (stat, delta) => {
        const cur = curStats[stat];
        if (stat === 'speedPct') {
          const baseSpd = curStats.speed;
          const nxtSpd = Math.round(baseSpd * (1 + delta / 100));
          return `Speed: ${baseSpd} → ${nxtSpd}`;
        }
        if (stat === 'hpRegen') return `Regen: ${cur.toFixed(1)} → ${(cur + delta).toFixed(1)}/s`;
        if (stat === 'damagePct' || stat === 'attackSpeedPct' || stat === 'areaPct') {
          const sign1 = cur >= 0 ? '+' : '';
          const nxt = cur + delta;
          const sign2 = nxt >= 0 ? '+' : '';
          return `${sign1}${cur}% → ${sign2}${nxt}%`;
        }
        if (stat === 'critChance' || stat === 'dodge' || stat === 'lifeSteal') {
          const cap = stat === 'critChance' ? 95 : 60;
          return `${cur}% → ${Math.min(cap, cur + delta)}%`;
        }
        if (typeof cur === 'number') return `${cur} → ${cur + delta}`;
        return '';
      };
      this.levelDraftCards.forEach((c) => {
        const col = window.MM.TIER_COLORS[c.tier];
        const preview = formatLevelPreview(c.upg.stat, c.val);
        const card = document.createElement('button');
        card.className = `draft-card tier-${c.tier}`;
        card.style.setProperty('--tier-col', col);
        card.innerHTML = `
          <div class="draft-tier">${window.MM.TIER_NAMES[c.tier]}</div>
          <div class="draft-icon">${window.MM.SVGs.getSvg(c.upg.icon)}</div>
          <div class="draft-name">${c.upg.name}</div>
          <div class="draft-val">${c.upg.fmt(c.val)}</div>
          ${preview ? `<div class="draft-preview">${preview}</div>` : ''}
        `;
        card.onclick = () => {
          window.MM.Audio.SFX.buy();
          this.engine.applyLevelUpgrade(c.upg.stat, c.val);
          this.engine.run.pendingLevelUps--;
          if (this.engine.run.pendingLevelUps > 0) {
            this.openLevelUpDraft();
          } else {
            $('modal-levelup').classList.add('hidden');
            this.openWorkshop(this.lastHarvestPay);
          }
        };
        grid.appendChild(card);
      });
    }

    // ------------------------------------------------------------------------
    // ENGINEERING WORKSHOP (BROTATO-STYLE SHOP + 6 SLOTS + MERGING)
    // ------------------------------------------------------------------------
    rollFreshShopSlots() {
      const run = this.engine.run;
      const perks = run.charDef.perks || {};
      const stats = this.engine.stats || this.engine.recomputeStats();
      const maxSlots = stats.maxSlots !== undefined ? stats.maxSlots : 6;
      const isPetOnly = !!perks.petOnly || maxSlots === 0;
      const petFrenzyMod = this.engine.hasModifier('pet_frenzy');

      // Keep locked offers in their EXACT slots from the previous shop (price stays frozen!),
      // and roll fresh deduplicated offers for all unlocked/bought slots!
      const prev = this.shopOffers || [];
      const next = [null, null, null, null];
      const openSlots = [];
      for (let i = 0; i < 4; i++) {
        if (prev[i] && prev[i].locked && !prev[i].bought) {
          next[i] = prev[i];
        } else {
          openSlots.push(i);
        }
      }

      // Beast-Tamer exact cadence: 1 guaranteed Pet every 4-5 shops (or every shop if Pet Frenzy modifier is on!)
      let forcedPetSlot = -1;
      if (isPetOnly && openSlots.length > 0) {
        if (petFrenzyMod) {
          forcedPetSlot = openSlots[0];
        } else {
          run.petShopCounter = (run.petShopCounter || 0) + 1;
          const target = run.nextPetShopTarget || 4;
          if (run.petShopCounter >= target) {
            forcedPetSlot = openSlots[0];
            run.petShopCounter = 0;
            run.nextPetShopTarget = Math.random() < 0.5 ? 4 : 5;
          }
        }
      }

      this.shopOffers = next;
      for (let i = 0; i < 4; i++) {
        if (!next[i]) {
          next[i] = this.generateShopOffer(i, i === forcedPetSlot);
        }
      }
    }

    openWorkshop(dividend) {
      this.showScreen('shop');
      this.rollFreshShopSlots();

      // Show crate reward banner if any
      const banner = $('shop-crate-banner');
      if (this.crateRewards && this.crateRewards.length > 0) {
        banner.classList.remove('hidden');
        banner.innerHTML = `<b>SUPPLY CRATE SALVAGED!</b> Free modules installed: ${this.crateRewards.map((m) => `<span class="crate-mod-pill">${m.name}</span>`).join(' ')}`;
        this.crateRewards = [];
      } else {
        banner.classList.add('hidden');
      }

      this.renderWorkshop();
    }

    generateShopOffer(slotIdx, forcePetNow = false) {
      const run = this.engine.run;
      const stats = this.engine.stats || this.engine.recomputeStats();
      const perks = run.charDef.perks || {};
      const maxSlots = stats.maxSlots !== undefined ? stats.maxSlots : 6;
      const isPetOnly = !!perks.petOnly || maxSlots === 0;
      const discount = stats.shopDiscount || 0;
      const allCursedMod = this.engine.hasModifier('all_cursed');
      const petFrenzyMod = this.engine.hasModifier('pet_frenzy');
      const curseChance = allCursedMod ? 1.0 : (perks.curseShopChance || Math.min(0.32, 0.09 + (stats.curseLevel || 0) * 0.03));

      // Brotato-authentic shop mix (Mochi Beast-Tamer gets 0 Weapons and 1 guaranteed Pet every 4-5 shops!)
      let wantTool = false;
      if (isPetOnly) {
        wantTool = false;
      } else if (slotIdx === 0) {
        wantTool = true;
      } else if (slotIdx === 1) {
        wantTool = run.tools.length < maxSlots ? true : Math.random() < 0.50;
      } else if (slotIdx === 2 && maxSlots >= 12 && run.tools.length < maxSlots) {
        wantTool = Math.random() < 0.5;
      } else {
        wantTool = false;
      }

      if (wantTool) {
        const tier = Math.min(4, this.rollRarityTier(run.wave, stats.luck));
        let toolDef = null;
        if (Math.random() < 0.56 && run.tools.length > 0) {
          const ownedTags = new Set();
          run.tools.forEach((t) => window.MM.getContraption(t.id).tags.forEach((tg) => ownedTags.add(tg)));
          const matching = window.MM.CONTRAPTIONS.filter((c) => c.tags.some((tg) => ownedTags.has(tg)));
          if (matching.length) toolDef = matching[Math.floor(Math.random() * matching.length)];
        }
        if (!toolDef) {
          toolDef = window.MM.CONTRAPTIONS[Math.floor(Math.random() * window.MM.CONTRAPTIONS.length)];
        }
        const isCursed = Math.random() < curseChance;
        const baseCost = window.MM.getToolCost(toolDef, tier, discount, run.wave);
        return {
          type: 'tool',
          def: toolDef,
          tier,
          cursed: isCursed,
          cost: isCursed ? Math.round(baseCost * 1.32) : baseCost,
          locked: false,
          bought: false
        };
      } else {
        // Avoid duplicating a module already in this shop roll
        const usedModIds = new Set(
          (this.shopOffers || []).filter((o) => o && o.type === 'module' && !o.bought).map((o) => o.def.id)
        );
        let mod = null;
        // Beast-Tamer gets 1 exact guaranteed Pet every 4-5 shops (controlled by forcePetNow);
        // other engineers keep normal Pet roll odds (or guaranteed in slot 3 with Pet Frenzy modifier).
        const forcePet = isPetOnly
          ? !!forcePetNow
          : (slotIdx === 3 && (petFrenzyMod || Math.random() < 0.24));
        if (forcePet) {
          const maxTier = Math.min(4, Math.max(2, this.rollRarityTier(run.wave, stats.luck) + (isPetOnly ? 1 : 0)));
          const petPool = window.MM.MODULES.filter((m) => m.petId && m.tier <= maxTier && !usedModIds.has(m.id));
          if (petPool.length) mod = petPool[Math.floor(Math.random() * petPool.length)];
        }
        if (!mod) {
          // For Beast-Tamer on non-pet shops, exclude random pets so cadence stays strictly 1 pet every 4-5 shops!
          const excludePets = isPetOnly && !petFrenzyMod;
          mod = this.rollRandomModule(run.wave, stats.luck, excludePets);
          for (let tries = 0; tries < 6 && usedModIds.has(mod.id); tries++) {
            mod = this.rollRandomModule(run.wave, stats.luck, excludePets);
          }
        }
        const isCursed = mod.tag !== 'Cursed' && Math.random() < curseChance;
        const baseCost = window.MM.getModuleCost(mod, discount, run.wave);
        return {
          type: 'module',
          def: mod,
          tier: mod.tier,
          cursed: isCursed,
          cost: isCursed ? Math.round(baseCost * 1.32) : baseCost,
          locked: false,
          bought: false
        };
      }
    }

    getRerollCost() {
      const perks = this.engine.run.charDef.perks || {};
      const free = (perks.freeRerolls || 0) + (this.engine.hasModifier('fast_escalation') ? 1 : 0);
      if (this.rerollCount < free) return 0;
      const w = this.engine.run.wave;
      return 4 + w * 2 + (this.rerollCount - free) * (3 + Math.floor(w / 2));
    }

    rerollShop() {
      const cost = this.getRerollCost();
      if (this.engine.run.scrap < cost) return;
      this.engine.run.scrap -= cost;
      this.rerollCount++;
      window.MM.Audio.SFX.click();
      this.rollFreshShopSlots();
      this.renderWorkshop();
    }

    canBuyOffer(offer) {
      if (!offer || offer.bought) return { ok: false, reason: 'SOLD' };
      if (this.engine.run.scrap < offer.cost) return { ok: false, reason: 'NEED SCRAP' };
      const maxSlots = (this.engine.stats && this.engine.stats.maxSlots !== undefined) ? this.engine.stats.maxSlots : 6;
      if (offer.type === 'tool' && this.engine.run.tools.length >= maxSlots) {
        // Check if it can directly merge into an existing identical tool of same tier < 4!
        const matchIdx = this.engine.run.tools.findIndex((t) => t.id === offer.def.id && t.tier === offer.tier && t.tier < 4);
        if (matchIdx >= 0) return { ok: true, mergeIdx: matchIdx };
        return { ok: false, reason: 'SLOTS FULL' };
      }
      return { ok: true, mergeIdx: -1 };
    }

    buyOffer(idx) {
      const offer = this.shopOffers[idx];
      const check = this.canBuyOffer(offer);
      if (!check.ok) return;

      this.engine.run.scrap -= offer.cost;
      offer.bought = true;
      offer.locked = false;

      if (offer.type === 'tool') {
        if (check.mergeIdx >= 0) {
          if (offer.cursed) this.engine.run.tools[check.mergeIdx].cursed = true;
          this.performUpgradeMerge(check.mergeIdx);
        } else {
          this.engine.run.tools.push({
            uid: this.engine.nextUid(),
            id: offer.def.id,
            tier: offer.tier,
            cursed: !!offer.cursed,
            cdTimer: 0.25
          });
          window.MM.Audio.SFX.buy();
        }
      } else {
        this.engine.applyModule(offer.def, !!offer.cursed);
        this.inspectedModuleId = offer.def.id;
        window.MM.Audio.SFX.buy();
      }

      this.engine.recomputeStats();
      this.renderWorkshop();
    }

    performUpgradeMerge(slotIdx) {
      const slot = this.engine.run.tools[slotIdx];
      slot.tier = Math.min(4, slot.tier + 1);
      this.engine.run.mergesDone++;
      if (this.engine.run.charDef.perks && this.engine.run.charDef.perks.mergeEngBonus) {
        this.engine.run.bonusStats.engineering += this.engine.run.charDef.perks.mergeEngBonus;
      }
      window.MM.Audio.SFX.merge();
      this.showAchievementToast(window.MM.Meta.unlockAchievement('first_merge'));
      if (slot.tier >= 4) {
        this.showAchievementToast(window.MM.Meta.unlockAchievement('mk4_tool'));
      }
    }

    mergeEquippedSlot(idx) {
      const tools = this.engine.run.tools;
      const target = tools[idx];
      if (!target || target.tier >= 4) return;
      const partnerIdx = tools.findIndex((t, i) => i !== idx && t.id === target.id && t.tier === target.tier);
      if (partnerIdx < 0) return;

      if (tools[partnerIdx].cursed) target.cursed = true;
      this.performUpgradeMerge(idx);
      tools.splice(partnerIdx, 1);
      this.selectedSlotIndex = -1;
      this.engine.recomputeStats();
      this.renderWorkshop();
    }

    countAvailableMerges() {
      const tools = (this.engine.run && this.engine.run.tools) || [];
      const sim = tools.map((t) => ({ id: t.id, tier: t.tier }));
      let count = 0;
      let merged = true;
      while (merged) {
        merged = false;
        for (let i = 0; i < sim.length; i++) {
          if (sim[i].tier >= 4) continue;
          const j = sim.findIndex((t, idx) => idx > i && t.id === sim[i].id && t.tier === sim[i].tier);
          if (j >= 0) {
            sim[i].tier++;
            sim.splice(j, 1);
            count++;
            merged = true;
            break;
          }
        }
      }
      return count;
    }

    mergeAllEquipped() {
      if (!this.engine.run || !this.engine.run.tools) return;
      const tools = this.engine.run.tools;
      let total = 0;
      let merged = true;
      while (merged) {
        merged = false;
        for (let i = 0; i < tools.length; i++) {
          if (tools[i].tier >= 4) continue;
          const j = tools.findIndex((t, idx) => idx > i && t.id === tools[i].id && t.tier === tools[i].tier);
          if (j >= 0) {
            if (tools[j].cursed) tools[i].cursed = true;
            this.performUpgradeMerge(i);
            tools.splice(j, 1);
            total++;
            merged = true;
            break;
          }
        }
      }
      if (total > 0) {
        this.selectedSlotIndex = -1;
        this.engine.recomputeStats();
        this.renderWorkshop();
      }
    }

    sellEquippedSlot(idx) {
      const tools = this.engine.run.tools;
      if (tools.length <= 1 || !tools[idx]) return; // Must keep at least 1 contraption
      const def = window.MM.getContraption(tools[idx].id);
      const val = window.MM.getToolSellValue(def, tools[idx].tier, this.engine.stats.sellBonusPct || 0, this.engine.run.wave);
      this.engine.run.scrap += val;
      tools.splice(idx, 1);
      this.selectedSlotIndex = -1;
      window.MM.Audio.SFX.buy();
      this.engine.recomputeStats();
      this.renderWorkshop();
    }

    renderWorkshop() {
      const run = this.engine.run;
      const stats = this.engine.recomputeStats();
      const nextCfg = window.MM.getWaveConfig(run.wave + 1, run.biomeId || 'auto');

      $('shop-wave-cleared').textContent = run.isPractice
        ? `WORKSHOP — PRACTICE ${run.wave} / 3`
        : `WORKSHOP — WAVE ${run.wave}`;
      $('shop-scrap').textContent = run.scrap;
      const econBits = [];
      if (this.lastHarvestPay > 0) econBits.push(`Harvesting +${this.lastHarvestPay}`);
      if (run.salvageBag > 0) econBits.push(`Salvage Bag: ${run.salvageBag} (2× next wave)`);
      const econSuffix = econBits.length ? ` • ${econBits.join(' • ')}` : '';
      const practiceNextWarn = run.isPractice && nextCfg.wave === 3 ? ' — 🧪 FINAL PRACTICE WAVE!' : '';
      $('shop-next-info').textContent = `Next: Wave ${nextCfg.wave}${run.isPractice ? ' / 3' : ''}${practiceNextWarn}${nextCfg.boss ? ' — ☠ Boss' : (nextCfg.isHorde ? ' — ⚡ Horde' : (nextCfg.elite ? ' — ★ Elite' : ''))}${econSuffix}`;
      $('shop-next-info').classList.toggle('boss-warn', !!nextCfg.boss || !!nextCfg.isHorde);
      $('btn-shop-nextwave').textContent = (run.isPractice && run.wave + 1 === 3)
        ? 'FINAL WAVE →'
        : `WAVE ${run.wave + 1} →`;
      this.renderExpeditionRoadmap($('shop-roadmap'), run.wave, true);

      const rrCost = this.getRerollCost();
      $('btn-shop-reroll').textContent = rrCost === 0 ? 'Reroll (FREE!)' : `Reroll (${rrCost} Scrap)`;
      $('btn-shop-reroll').disabled = run.scrap < rrCost;

      // 0. Render Persistent Active Hero Identity Bar (Green Pros & Red Cons!)
      const heroBar = $('shop-hero-bar');
      if (heroBar && run.charDef) {
        const c = run.charDef;
        heroBar.innerHTML = `
          <div class="shop-hero-id">
            <div class="shop-hero-ava">${this.renderAvatarHtml(c.id)}</div>
            <div>
              <div class="shop-hero-name">${c.name} <span style="color:${c.accent}">— ${c.passiveName}</span></div>
              <div class="shop-hero-chips">
                ${(c.pros || []).map((t) => `<span class="trait-chip pro">+ ${t}</span>`).join('')}
                ${(c.cons || []).map((t) => `<span class="trait-chip con">− ${t}</span>`).join('')}
              </div>
            </div>
          </div>
        `;
      }

      // 1. Render 4 Shop Cards (Icon-Driven, Glowing Synergy Match Badges & Hero Affinity!)
      const curSynCounts = (this.engine.synergies && this.engine.synergies.counts) || {};
      const grid = $('shop-cards');
      grid.innerHTML = '';
      this.shopOffers.forEach((offer, idx) => {
        const card = document.createElement('div');
        if (offer.bought) {
          card.className = 'shop-card sold';
          card.innerHTML = `<div class="sold-stamp">INSTALLED</div>`;
          grid.appendChild(card);
          return;
        }
        const check = this.canBuyOffer(offer);
        const tierCol = window.MM.TIER_COLORS[offer.tier];
        const svgKey = offer.type === 'tool' ? ('tool:' + offer.def.id) : offer.def.icon;
        const canMergeOwned = offer.type === 'tool' && run.tools.some((t) => t.id === offer.def.id && t.tier === offer.tier && t.tier < 4);
        const modTag = offer.def.tag || 'Module';
        const modTagCol = MODULE_TAG_COLORS[modTag] || '#7DCB5A';
        const isPet = !!offer.def.petId;
        const isCursedVariant = !!offer.cursed;
        const isCursed = isCursedVariant || modTag === 'Cursed';
        const family = offer.type === 'tool' ? window.MM.weaponFamily(offer.def) : null;
        const cardTypeLbl = family ? family.name.toUpperCase() : (isPet ? 'PET' : 'MODULE');

        // Synergy Match Highlight + Hero Affinity Badge for weapons!
        let synBannerHtml = '';
        let hasSynTrigger = false;
        let affinityHtml = '';
        if (offer.type === 'tool') {
          let bestSyn = null;
          offer.def.tags.forEach((tg) => {
            const cnt = curSynCounts[tg] || 0;
            const defS = window.MM.SYNERGIES[tg];
            if (!defS || cnt <= 0) return;
            const next = cnt + 1;
            const triggers = next === 2 || next === 4 || next === 6;
            if (!bestSyn || (triggers && !bestSyn.triggers) || next > bestSyn.next) {
              bestSyn = { defS, cnt, next, triggers };
            }
          });
          if (bestSyn) {
            hasSynTrigger = bestSyn.triggers;
            const goal = bestSyn.next <= 2 ? 2 : (bestSyn.next <= 4 ? 4 : 6);
            synBannerHtml = bestSyn.triggers
              ? `<div class="syn-match-banner trigger" style="--tc:${bestSyn.defS.color}">★ UNLOCKS ${bestSyn.defS.badge} ${bestSyn.defS.name.toUpperCase()} (${bestSyn.next}/${goal})!</div>`
              : `<div class="syn-match-banner" style="--tc:${bestSyn.defS.color}">+1 ${bestSyn.defS.badge} ${bestSyn.defS.name} (${bestSyn.cnt}→${bestSyn.next})</div>`;
          }
          const aff = this.getHeroWeaponAffinity(run.charDef, offer.def);
          if (aff) {
            affinityHtml = `<div class="affinity-banner ${aff.good ? 'good' : 'bad'}">${aff.good ? '★ Good for' : '⚠ Weak for'} ${run.charDef.name} <b>${aff.pct > 0 ? '+' : ''}${aff.pct}%</b></div>`;
          }
        }

        // Concise stat chips instead of long walls of text!
        const estOfferDmg = offer.type === 'tool'
          ? Math.round(this.engine.computeToolDamage({ id: offer.def.id, tier: offer.tier, cursed: isCursedVariant }, offer.def))
          : 0;
        const estNextMergeDmg = (offer.type === 'tool' && canMergeOwned)
          ? Math.round(this.engine.computeToolDamage({ id: offer.def.id, tier: Math.min(4, offer.tier + 1), cursed: isCursedVariant }, offer.def))
          : 0;
        const statChipsHtml = offer.type === 'tool'
          ? `<div class="card-stat-chips">
               <span class="stat-chip neutral">💥 ${estOfferDmg} DMG</span>
               <span class="stat-chip neutral">⏱ ${(offer.def.cd * (window.MM.TIER_CD_MULT[offer.tier] || 1)).toFixed(1)}s</span>
             </div>`
          : `<div class="card-stat-chips">${this.formatModuleStatChips(offer.def, isCursedVariant)}</div>`;

        // Full description on every card (no hover needed)
        const shortDesc = offer.def.desc ? `<div class="shop-card-desc">${offer.def.desc}</div>` : '';

        const hlSyn = this.highlightedSynergy;
        const matchesHlSyn = hlSyn && offer.type === 'tool' && offer.def.tags && offer.def.tags.includes(hlSyn);
        const dimBySyn = hlSyn && !matchesHlSyn;
        card.className = `shop-card tier-${offer.tier} ${offer.locked ? 'locked' : ''} ${isCursed ? 'cursed-offer' : ''} ${isPet ? 'pet-offer' : ''} ${hasSynTrigger ? 'syn-trigger-card' : ''} ${canMergeOwned ? 'merge-ready-card' : ''} ${matchesHlSyn ? 'syn-focus-match' : ''} ${dimBySyn ? 'syn-dim' : ''}`;
        card.style.setProperty('--tier-col', isCursed ? '#B98AE8' : (isPet ? '#2DD4BF' : tierCol));
        if (matchesHlSyn && window.MM.SYNERGIES[hlSyn]) {
          card.style.setProperty('--syn-hl-col', window.MM.SYNERGIES[hlSyn].color);
        }
        // Live Before -> After Stat Preview on hover/focus of Module shop cards!
        if (offer.type === 'module' && offer.def && offer.def.mods) {
          card.onmouseenter = () => this.renderShopStatsPanel(stats, offer.def.mods, isCursedVariant);
          card.onmouseleave = () => this.renderShopStatsPanel(stats, null, false);
        }
        card.innerHTML = `
          <div class="shop-card-top">
            <span class="tier-pill t${offer.tier}">${window.MM.TIER_NAMES[offer.tier]}${offer.tier >= 4 && offer.type === 'tool' ? '★' : ''} ${cardTypeLbl}</span>
            ${offer.locked ? `<span class="locked-pill">🔒 SAVED</span>` : (isCursedVariant ? `<span class="cursed-pill">☠ CURSED</span>` : '')}
          </div>
          <div class="shop-card-icon">${window.MM.SVGs.getSvg(svgKey)}</div>
          <div class="shop-card-name">${isCursedVariant ? 'Cursed ' : ''}${offer.def.name}</div>
          ${family ? `<div class="family-banner" style="--fc:${family.color}" title="${family.blurb}"><span class="family-name">${family.icon} ${family.name}</span><span class="family-blurb">${family.blurb}</span></div>` : ''}
          ${affinityHtml}
          ${offer.type === 'tool'
            ? `<div class="shop-card-tags">${offer.def.tags.map((t) => `<span class="syn-tag" style="--tc:${window.MM.SYNERGIES[t].color}">${window.MM.SYNERGIES[t].badge || ''} ${window.MM.SYNERGIES[t].name}</span>`).join('')}${isCursedVariant ? `<span class="syn-tag" style="--tc:#B98AE8">+35% • Curse</span>` : ''}</div>`
            : `<div class="shop-card-tags"><span class="syn-tag" style="--tc:${modTagCol}">${modTag}</span>${isCursedVariant ? `<span class="syn-tag" style="--tc:#B98AE8">+35% • Curse</span>` : ''}</div>`
          }
          ${synBannerHtml}
          ${statChipsHtml}
          ${shortDesc}
          ${canMergeOwned ? `<div class="merge-hint">⚡ MERGE → ${window.MM.TIER_NAMES[offer.tier + 1]} (${estOfferDmg}→${estNextMergeDmg} DMG • FASTER!)</div>` : ''}
          <div class="shop-card-actions">
            <button class="btn-buy ${check.ok ? '' : 'disabled'}" data-buy="${idx}" ${check.ok ? '' : 'disabled'}>
              ${check.ok
                ? (check.mergeIdx >= 0 ? `⚡ BUY & MERGE (${offer.cost})` : `BUY — ${offer.cost} SCRAP`)
                : `${check.reason} (${offer.cost})`}
            </button>
            <button class="btn-lock ${offer.locked ? 'active' : ''}" data-idx="${idx}" title="Lock this item so it stays available on rerolls and in the next shop">
              ${offer.locked ? '🔒 LOCKED — NEXT SHOP' : '🔓 LOCK'}
            </button>
          </div>
        `;
        grid.appendChild(card);
      });

      grid.querySelectorAll('[data-buy]').forEach((b) => {
        b.onclick = () => this.buyOffer(Number(b.dataset.buy));
      });
      grid.querySelectorAll('[data-idx]').forEach((b) => {
        b.onclick = (e) => {
          e.stopPropagation();
          const i = Number(b.dataset.idx);
          this.shopOffers[i].locked = !this.shopOffers[i].locked;
          window.MM.Audio.SFX.click();
          this.renderWorkshop();
        };
      });

      // 2. Render Dynamic Equipped Weapon Slots (0 for Mochi Pet-Only, 6 standard, 12 for Octo-Rig!)
      const maxSlots = stats.maxSlots !== undefined ? stats.maxSlots : 6;
      if ($('shop-slots-cap')) $('shop-slots-cap').textContent = maxSlots;
      const mergeAllBtn = $('btn-shop-merge-all');
      if (mergeAllBtn) {
        const availMerges = this.countAvailableMerges();
        mergeAllBtn.classList.toggle('hidden', availMerges <= 0);
        if (availMerges > 0) {
          mergeAllBtn.textContent = `⚡ MERGE ALL (${availMerges}) [M]`;
        }
      }
      const slotsEl = $('shop-slots');
      slotsEl.classList.toggle('slots-12', maxSlots > 6);
      slotsEl.classList.toggle('slots-3', maxSlots > 0 && maxSlots <= 3);
      slotsEl.classList.toggle('slots-0', maxSlots === 0);
      slotsEl.innerHTML = '';
      if (maxSlots === 0) {
        const activePets = (run.modules || []).filter((id) => window.MM.getModule(id).petId).length;
        slotsEl.innerHTML = `<div class="pet-only-banner">🐾 <b>PET-ONLY BEAST TAMER</b> — 0 Weapon Slots • <b>${activePets} Active Pets</b> fighting for you! <b>1 Guaranteed Pet every 4–5 Shops!</b></div>`;
      }
      for (let i = 0; i < maxSlots; i++) {
        const slot = run.tools[i];
        const el = document.createElement('div');
        if (!slot) {
          el.className = 'tool-slot empty';
          el.innerHTML = `<span class="slot-empty-lbl">SLOT ${i + 1}</span>`;
          slotsEl.appendChild(el);
          continue;
        }
        const def = window.MM.getContraption(slot.id);
        const col = slot.cursed ? '#B98AE8' : window.MM.TIER_COLORS[slot.tier];
        const hasPartner = slot.tier < 4 && run.tools.some((t, j) => j !== i && t.id === slot.id && t.tier === slot.tier);
        const matchesShop = slot.tier < 4 && (this.shopOffers || []).some((o) => o && !o.bought && o.type === 'tool' && o.def.id === slot.id && o.tier === slot.tier);
        const estDmg = Math.round(this.engine.computeToolDamage(slot, def));

        const hlSyn = this.highlightedSynergy;
        const slotMatchesSyn = hlSyn && def.tags && def.tags.includes(hlSyn);
        const slotDimSyn = hlSyn && !slotMatchesSyn;
        el.className = `tool-slot filled tier-${slot.tier} ${slot.cursed ? 'cursed-slot' : ''} ${slot.tier >= 4 ? 'evolved-slot' : ''} ${this.selectedSlotIndex === i ? 'selected' : ''} ${hasPartner ? 'mergeable' : ''} ${matchesShop && !hasPartner ? 'shop-match-slot' : ''} ${slotMatchesSyn ? 'syn-focus-match' : ''} ${slotDimSyn ? 'syn-dim' : ''}`;
        el.style.setProperty('--tier-col', col);
        if (slotMatchesSyn && window.MM.SYNERGIES[hlSyn]) {
          el.style.setProperty('--syn-hl-col', window.MM.SYNERGIES[hlSyn].color);
        }
        const slotBadge = hasPartner
          ? `<span class="slot-merge-badge">⚡ MERGE!</span>`
          : (matchesShop
            ? `<span class="slot-shop-badge">🛒 SHOP MATCH</span>`
            : (slot.tier >= 4 ? `<span class="slot-evo-badge">★ EVOLVED</span>` : ''));
        el.innerHTML = `
          ${slotBadge}
          <div class="slot-tier">${slot.cursed ? '☠ ' : ''}${window.MM.TIER_NAMES[slot.tier]}</div>
          <div class="slot-svg">${window.MM.SVGs.getSvg('tool:' + slot.id)}</div>
          <div class="slot-name">${def.name}</div>
          <div class="slot-family" style="--fc:${window.MM.weaponFamily(def).color}">${window.MM.weaponFamily(def).icon} ${window.MM.weaponFamily(def).name}</div>
          <div class="slot-dmg">~${estDmg} DMG</div>
        `;
        el.onclick = () => {
          window.MM.Audio.SFX.click();
          this.selectedSlotIndex = this.selectedSlotIndex === i ? -1 : i;
          this.renderWorkshop();
        };
        slotsEl.appendChild(el);
      }

      // Slot Inspector Actions (Merge / Sell with Exact Power Jump Preview!)
      const actionsEl = $('slot-actions');
      if (this.selectedSlotIndex >= 0 && run.tools[this.selectedSlotIndex]) {
        const slot = run.tools[this.selectedSlotIndex];
        const def = window.MM.getContraption(slot.id);
        const hasPartner = slot.tier < 4 && run.tools.some((t, j) => j !== this.selectedSlotIndex && t.id === slot.id && t.tier === slot.tier);
        const sellVal = window.MM.getToolSellValue(def, slot.tier, stats.sellBonusPct || 0, run.wave);
        const curDmg = Math.round(this.engine.computeToolDamage(slot, def));
        const nxtDmg = hasPartner ? Math.round(this.engine.computeToolDamage({ ...slot, tier: slot.tier + 1 }, def)) : curDmg;
        actionsEl.classList.remove('hidden');
        actionsEl.innerHTML = `
          <div class="slot-act-info">
            <b>${def.name} ${window.MM.TIER_NAMES[slot.tier]}</b> — ${def.tags.map((t) => window.MM.SYNERGIES[t].name).join(' / ')}
          </div>
          <div class="slot-act-btns">
            ${hasPartner ? `<button class="btn-primary btn-merge" id="btn-do-merge">⚡ MERGE → ${window.MM.TIER_NAMES[slot.tier + 1]} (${curDmg}→${nxtDmg} DMG!)</button>` : ''}
            <button class="btn-danger" id="btn-do-sell" ${run.tools.length <= 1 ? 'disabled' : ''}>Sell (+${sellVal} Scrap)</button>
          </div>
        `;
        if ($('btn-do-merge')) $('btn-do-merge').onclick = () => this.mergeEquippedSlot(this.selectedSlotIndex);
        if ($('btn-do-sell')) $('btn-do-sell').onclick = () => this.sellEquippedSlot(this.selectedSlotIndex);
      } else {
        actionsEl.classList.add('hidden');
      }

      // 2b. Render Owned Items & Modules Shelf right inside the Workshop (Brotato-style!)
      const itemsEl = $('shop-owned-items');
      const inspectEl = $('shop-item-inspect');
      const grouped = [];
      const groupMap = new Map();
      (run.modules || []).forEach((modId) => {
        if (groupMap.has(modId)) {
          groupMap.get(modId).count++;
        } else {
          const entry = { def: window.MM.getModule(modId), count: 1 };
          groupMap.set(modId, entry);
          grouped.push(entry);
        }
      });
      $('shop-items-count').textContent = (run.modules || []).length;
      itemsEl.innerHTML = '';

      const showInspect = (entry) => {
        if (!entry) {
          inspectEl.classList.add('hidden');
          return;
        }
        const m = entry.def;
        const tag = m.tag || 'Module';
        const tc = MODULE_TAG_COLORS[tag] || '#7DCB5A';
        inspectEl.classList.remove('hidden');
        inspectEl.innerHTML = `
          <span class="tier-pill t${m.tier}">${window.MM.TIER_NAMES[m.tier]}</span>
          <b class="inspect-name">${m.name}${entry.count > 1 ? ` ×${entry.count}` : ''}</b>
          <span class="syn-tag" style="--tc:${tc}">${tag}</span>
          <span class="inspect-desc">${m.desc}</span>
        `;
      };

      if (grouped.length === 0) {
        itemsEl.innerHTML = `<div class="owned-items-empty">No modules installed yet — buy Passive Modules above or salvage Supply Crates to stack your build!</div>`;
        inspectEl.classList.add('hidden');
      } else {
        grouped.forEach((entry) => {
          const m = entry.def;
          const isCursed = m.tag === 'Cursed';
          const isPet = !!m.petId;
          const tierCol = isCursed ? '#B98AE8' : (isPet ? '#2DD4BF' : (window.MM.TIER_COLORS[m.tier] || '#CBD2E0'));
          const tile = document.createElement('button');
          tile.type = 'button';
          tile.className = `owned-item-tile tier-${m.tier} ${isCursed ? 'cursed-tile' : ''} ${isPet ? 'pet-tile' : ''} ${this.inspectedModuleId === m.id ? 'active' : ''}`;
          tile.style.setProperty('--tier-col', tierCol);
          tile.title = `${m.name}${entry.count > 1 ? ` ×${entry.count}` : ''} — ${m.desc}`;
          tile.innerHTML = `
            <div class="owned-item-svg">${window.MM.SVGs.getSvg(m.icon)}</div>
            ${entry.count > 1 ? `<span class="item-stack-badge">×${entry.count}</span>` : ''}
          `;
          tile.onmouseenter = () => showInspect(entry);
          tile.onclick = () => {
            window.MM.Audio.SFX.click();
            this.inspectedModuleId = m.id;
            itemsEl.querySelectorAll('.owned-item-tile').forEach((el) => el.classList.remove('active'));
            tile.classList.add('active');
            showInspect(entry);
          };
          itemsEl.appendChild(tile);
        });
        const activeEntry = grouped.find((g) => g.def.id === this.inspectedModuleId) || grouped[grouped.length - 1];
        showInspect(activeEntry);
      }

      // 3. Render Synergies Panel (Active Pet Combos + Weapon Synergies!)
      const synEl = $('shop-synergies');
      const syn = this.engine.synergies;
      const ps = this.engine.petSynergies || this.engine.computePetSynergies();
      const petSynHtml = (ps && ps.active && ps.active.length > 0)
        ? ps.active.map((s) => `
            <div class="syn-row active pet-syn-row" style="--tc:${s.color}">
              <div class="syn-row-head">
                <span class="syn-name">${s.icon} ${s.name}</span>
                <span class="syn-pips"><span class="pip on">PET</span></span>
              </div>
              <div class="syn-row-desc">${s.desc}</div>
            </div>
          `).join('')
        : (ps && ps.count > 0 ? `
            <div class="syn-row" style="--tc:#FFC233">
              <div class="syn-row-head">
                <span class="syn-name">🐾 Pet Pack (${ps.count})</span>
                <span class="syn-pips"><span class="pip ${ps.count >= 3 ? 'on' : ''}">3</span><span class="pip ${ps.count >= 5 ? 'on' : ''}">5</span></span>
              </div>
              <div class="syn-row-desc">3 Pets → Swarm Aura (+22% Atk Spd) • Cryo Pup + Blazemander → Frostfire!</div>
            </div>
          ` : '');

      synEl.innerHTML = petSynHtml + Object.keys(window.MM.SYNERGIES)
        .sort((a, b) => syn.counts[b] - syn.counts[a])
        .map((k) => {
          const def = window.MM.SYNERGIES[k];
          const cnt = syn.counts[k];
          const activeTier = syn.active[k].tier;
          const nextTier = def.tiers.find((t) => cnt < t.count);
          const isHl = this.highlightedSynergy === k;
          return `
            <div class="syn-row clickable-syn ${activeTier ? 'active' : ''} ${isHl ? 'syn-selected' : ''}" data-syn-key="${k}" style="--tc:${def.color}" title="Click to highlight matching ${def.name} gear in the shop & loadout">
              <div class="syn-row-head">
                <span class="syn-name">${def.badge || '◈'} ${def.name}${isHl ? ' <small class="syn-hl-tag">★ FILTERED</small>' : ''}</span>
                <span class="syn-pips">${[2, 4, 6].map((n) => `<span class="pip ${cnt >= n ? 'on' : ''}">${n}</span>`).join('')} <b>(${cnt})</b></span>
              </div>
              <div class="syn-row-desc">${activeTier ? activeTier.label : (nextTier ? `(${nextTier.count}) ${nextTier.label}` : def.desc)}</div>
            </div>
          `;
        }).join('');

      synEl.querySelectorAll('[data-syn-key]').forEach((row) => {
        row.onclick = () => {
          const key = row.dataset.synKey;
          this.highlightedSynergy = this.highlightedSynergy === key ? null : key;
          window.MM.Audio.SFX.click();
          this.renderWorkshop();
        };
      });

      // 4. Render Live Stats Sheet (with instant hover Before -> After preview support!)
      this.renderShopStatsPanel(stats, null, false);

      // 5. Render Post-Wave DPS Breakdown Meter & Auto-Save Mid-Run!
      this.renderDpsMeter($('shop-dps'), run.waveDamageBySource, 'Last Wave');
      this.saveActiveRun();
    }

    renderShopStatsPanel(stats, previewMods = null, isCursed = false) {
      const boost = isCursed ? 1.35 : 1.0;
      const getDelta = (k) => {
        if (!previewMods || !previewMods[k]) return 0;
        const raw = previewMods[k];
        return (isCursed && raw > 0 && k !== 'curseLevel')
          ? (Math.abs(raw) < 5 ? Number((raw * boost).toFixed(1)) : Math.round(raw * boost))
          : raw;
      };
      const fmtRow = (label, key, curVal, suffix = '', signed = false, decimals = 0, cap = null) => {
        const d = getDelta(key);
        const fNum = (n) => {
          const s = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
          return `${signed && n >= 0 ? '+' : ''}${s}${suffix}`;
        };
        if (!d) return `<div class="mini-stat"><span>${label}</span><b>${fNum(curVal)}</b></div>`;
        let nxt = key === 'speedPct' ? Math.round(curVal * (1 + d / 100)) : (curVal + d);
        if (cap !== null) nxt = Math.min(cap, nxt);
        const good = key === 'dashCdPct' ? d < 0 : d > 0;
        return `<div class="mini-stat ${good ? 'delta-up' : 'delta-down'}"><span>${label}</span><b>${fNum(curVal)} <em class="stat-arrow">→ ${fNum(nxt)}</em></b></div>`;
      };

      const rows = [
        fmtRow('Max HP', 'maxHp', stats.maxHp),
        fmtRow('HP Regen', 'hpRegen', stats.hpRegen, '/s', false, 1),
        fmtRow('Armor', 'armor', stats.armor),
        fmtRow('Dodge', 'dodge', stats.dodge || 0, '%', false, 0, 60),
        fmtRow('Life Steal', 'lifeSteal', stats.lifeSteal || 0, '%', false, 0, 60),
        fmtRow('Engineering', 'engineering', stats.engineering),
        fmtRow('Damage %', 'damagePct', stats.damagePct, '%', true),
        fmtRow('Attack Speed', 'attackSpeedPct', stats.attackSpeedPct, '%', true),
        fmtRow('Crit Chance', 'critChance', stats.critChance, '%', false, 0, 95),
        fmtRow('Area / AoE', 'areaPct', stats.areaPct, '%', true),
        fmtRow('Move Speed', 'speedPct', stats.speed),
        fmtRow('Harvesting', 'harvesting', stats.harvesting || 0, '', true),
        fmtRow('Luck', 'luck', stats.luck),
        (stats.shopDiscount > 0
          ? `<div class="mini-stat"><span>Shop Disc.</span><b>-${Math.round(stats.shopDiscount * 100)}%</b></div>`
          : `<div class="mini-stat"><span>Dash CD</span><b>${stats.dashCd.toFixed(2)}s</b></div>`)
      ];
      $('shop-stats').innerHTML = rows.join('');
    }

    renderDpsMeter(container, dmgMap, label = 'Total') {
      if (!container) return;
      const entries = Object.entries(dmgMap || {})
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1]);
      if (entries.length === 0) {
        container.innerHTML = `<div class="owned-items-empty">No damage recorded yet — launch a wave to see weapon & pet DPS!</div>`;
        return;
      }
      const total = entries.reduce((acc, [, v]) => acc + v, 0) || 1;
      const maxVal = entries[0][1] || 1;
      const colors = ['#7DCB5A', '#6EA5FF', '#FFC233', '#E8483F', '#B98AE8', '#2DD4BF'];
      container.innerHTML = entries.slice(0, 8).map(([name, val], i) => {
        const pct = Math.round((val / total) * 100);
        const w = Math.max(6, Math.round((val / maxVal) * 100));
        const col = name.startsWith('Pet:') ? '#2DD4BF' : (name.startsWith('★') ? '#FFD666' : colors[i % colors.length]);
        return `
          <div class="dps-row">
            <div class="dps-row-head">
              <span class="dps-name">${name}</span>
              <span class="dps-val">${val.toLocaleString()} <em>(${pct}%)</em></span>
            </div>
            <div class="dps-bar-track"><div class="dps-bar-fill" style="width:${w}%;background:${col}"></div></div>
          </div>
        `;
      }).join('');
    }

    // ------------------------------------------------------------------------
    // CORE LAB (META-PROGRESSION & ACHIEVEMENTS)
    // ------------------------------------------------------------------------
    openLab() {
      $('modal-lab').classList.remove('hidden');
      this.renderLab();
    }

    renderLab() {
      const meta = window.MM.Meta.get();
      $('lab-shards').textContent = meta.shards;

      // Career Stats Telemetry Dashboard!
      const careerEl = $('lab-career-strip');
      if (careerEl) {
        const totalWins = Object.values(meta.charWins || {}).reduce((s, n) => s + (n || 0), 0);
        const unlockedEng = window.MM.CHARACTERS.filter((c) => window.MM.Meta.isCharUnlocked(c.id)).length;
        const unlockedHats = window.MM.Meta.HATS.filter((h) => window.MM.Meta.isHatUnlocked(h.id)).length;
        const doneAchs = window.MM.Meta.ACHIEVEMENTS.filter((a) => meta.achievements[a.id]).length;
        careerEl.innerHTML = `
          <div class="career-pill"><span>RUNS</span><b>${meta.totalRuns || 0}</b></div>
          <div class="career-pill"><span>VICTORIES</span><b>${totalWins}</b></div>
          <div class="career-pill"><span>TOTAL KILLS</span><b>${(meta.totalKills || 0).toLocaleString()}</b></div>
          <div class="career-pill"><span>BEST WAVE</span><b>W${meta.bestWave || 0}</b></div>
          <div class="career-pill"><span>ENGINEERS</span><b>${unlockedEng}/${window.MM.CHARACTERS.length}</b></div>
          <div class="career-pill"><span>HATS</span><b>${unlockedHats}/${window.MM.Meta.HATS.length}</b></div>
          <div class="career-pill"><span>BADGES</span><b>${doneAchs}/${window.MM.Meta.ACHIEVEMENTS.length}</b></div>
        `;
      }

      const grid = $('lab-upgrades-grid');
      grid.innerHTML = '';
      window.MM.Meta.LAB_UPGRADES.forEach((u) => {
        const rank = window.MM.Meta.getRank(u.id);
        const maxed = rank >= u.maxRank;
        const cost = window.MM.Meta.getUpgradeCost(u);
        const canAfford = !maxed && meta.shards >= cost;

        const card = document.createElement('div');
        card.className = 'lab-card' + (maxed ? ' maxed' : '');
        card.innerHTML = `
          <div class="lab-card-icon">${window.MM.SVGs.getSvg(u.icon)}</div>
          <div class="lab-card-body">
            <div class="lab-card-name">${u.name}</div>
            <div class="lab-card-desc">${u.desc}</div>
            <div class="lab-ranks">${Array.from({ length: u.maxRank }, (_, i) => `<span class="rank-pip ${i < rank ? 'on' : ''}"></span>`).join('')}</div>
          </div>
          <button class="btn-lab-buy" ${canAfford ? '' : 'disabled'}>${maxed ? 'MAX' : `${cost} ◈`}</button>
        `;
        card.querySelector('button').onclick = () => {
          if (window.MM.Meta.buyLabUpgrade(u.id)) {
            window.MM.Audio.SFX.merge();
            this.renderLab();
            $('title-shards').textContent = window.MM.Meta.get().shards;
          }
        };
        grid.appendChild(card);
      });

      // Render Alien Wardrobe — Unlockable Hats & Cosmetics!
      const hatsEl = $('lab-hats-grid');
      if (hatsEl) {
        hatsEl.innerHTML = '';
        window.MM.Meta.HATS.forEach((h) => {
          const unlocked = window.MM.Meta.isHatUnlocked(h.id);
          const equipped = (meta.selectedHat || 'none') === h.id;
          const canBuy = !unlocked && meta.shards >= h.cost;
          const card = document.createElement('div');
          card.className = `hat-card ${equipped ? 'equipped' : ''} ${unlocked ? '' : 'locked'}`;
          card.title = h.desc;
          card.innerHTML = `
            <div class="hat-card-preview">${this.renderAvatarHtml(meta.selectedChar || 'nasa', h.id)}</div>
            <div class="hat-card-name">${h.name}</div>
            <button class="btn-hat-act" ${unlocked || canBuy ? '' : 'disabled'}>
              ${equipped ? '✓ WORN' : (unlocked ? 'EQUIP' : `${h.cost} ◈`)}
            </button>
          `;
          card.querySelector('button').onclick = () => {
            if (unlocked) {
              window.MM.Audio.SFX.click();
              window.MM.Meta.equipHat(h.id);
              this.renderLab();
            } else if (window.MM.Meta.buyHat(h.id)) {
              window.MM.Audio.SFX.merge();
              this.renderLab();
              $('title-shards').textContent = window.MM.Meta.get().shards;
            }
          };
          hatsEl.appendChild(card);
        });
      }

      const achEl = $('lab-achievements');
      const doneCount = window.MM.Meta.ACHIEVEMENTS.filter((a) => meta.achievements[a.id]).length;
      if ($('lab-ach-progress')) {
        $('lab-ach-progress').textContent = `${doneCount} / ${window.MM.Meta.ACHIEVEMENTS.length} BADGES`;
      }
      achEl.innerHTML = window.MM.Meta.ACHIEVEMENTS.map((a) => {
        const done = !!meta.achievements[a.id];
        const hatObj = a.hatId ? window.MM.Meta.HATS.find((h) => h.id === a.hatId) : null;
        return `
          <div class="ach-row ${done ? 'done' : ''}">
            <span class="ach-status">${done ? '✓' : '○'}</span>
            <div class="ach-info">
              <b>${a.name}</b> — <span>${a.desc}</span>
              ${hatObj ? `<span class="ach-hat-pill">🎩 ${hatObj.name}</span>` : ''}
            </div>
            <span class="ach-reward">+${a.reward} ◈</span>
          </div>
        `;
      }).join('');
    }

    // ------------------------------------------------------------------------
    // ENGINEERING CODEX
    // ------------------------------------------------------------------------
    openCodex(tab = 'tools') {
      $('modal-codex').classList.remove('hidden');
      document.querySelectorAll('.codex-tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
      const body = $('codex-body');

      if (tab === 'tools') {
        body.innerHTML = `<div class="codex-grid">` + window.MM.CONTRAPTIONS.map((t) => `
          <div class="codex-card">
            <div class="codex-svg">${window.MM.SVGs.getSvg('tool:' + t.id)}</div>
            <div class="codex-name">${t.name}</div>
            <div class="shop-card-tags">${t.tags.map((tg) => `<span class="syn-tag" style="--tc:${window.MM.SYNERGIES[tg].color}">${window.MM.SYNERGIES[tg].name}</span>`).join('')}</div>
            <div class="codex-desc">${t.desc}</div>
          </div>
        `).join('') + `</div>`;
      } else if (tab === 'pets') {
        const synBanner = `<div class="codex-pet-syns">` + (window.MM.PET_SYNERGIES || []).map((ps) => `
          <div class="codex-pet-syn-pill" style="--tc:${ps.color}">
            <b>${ps.icon} ${ps.name}</b> — <span>${ps.desc}</span>
          </div>
        `).join('') + `</div>`;
        body.innerHTML = synBanner + `<div class="codex-grid">` + window.MM.MODULES.filter((m) => m.petId).map((m) => `
          <div class="codex-card pet-offer">
            <div class="codex-svg">${window.MM.SVGs.getSvg(m.icon)}</div>
            <div class="codex-name">${m.name} <span class="tier-pill t${m.tier}">${window.MM.TIER_NAMES[m.tier]}</span></div>
            <div class="shop-card-tags"><span class="syn-tag" style="--tc:#2DD4BF">Companion Pet</span></div>
            <div class="codex-desc">${m.desc}</div>
          </div>
        `).join('') + `</div>`;
      } else if (tab === 'modules') {
        body.innerHTML = `<div class="codex-grid">` + window.MM.MODULES.map((m) => {
          const tag = m.tag || 'Module';
          const tc = MODULE_TAG_COLORS[tag] || '#7DCB5A';
          return `
            <div class="codex-card">
              <div class="codex-svg">${window.MM.SVGs.getSvg(m.icon)}</div>
              <div class="codex-name">${m.name} <span class="tier-pill t${m.tier}">${window.MM.TIER_NAMES[m.tier]}</span></div>
              <div class="shop-card-tags"><span class="syn-tag" style="--tc:${tc}">${tag}</span></div>
              <div class="codex-desc">${m.desc}</div>
            </div>
          `;
        }).join('') + `</div>`;
      } else if (tab === 'synergies') {
        body.innerHTML = `<div class="codex-syn-list">` + Object.values(window.MM.SYNERGIES).map((s) => `
          <div class="codex-syn-card" style="--tc:${s.color}">
            <div class="codex-syn-head">
              <div class="codex-syn-icon">${window.MM.SVGs.getSvg(s.icon)}</div>
              <div>
                <div class="codex-name" style="color:${s.color}">${s.name}</div>
                <div class="codex-desc">${s.desc}</div>
              </div>
            </div>
            <div class="codex-syn-tiers">
              ${s.tiers.map((tr) => `<div><b>(${tr.count})</b> ${tr.label}</div>`).join('')}
            </div>
          </div>
        `).join('') + `</div>`;
      } else {
        body.innerHTML = `<div class="codex-grid">` + Object.values(window.MM.ENEMIES).map((e) => `
          <div class="codex-card ${e.isBoss ? 'boss-card' : ''}">
            <div class="codex-svg">${window.MM.SVGs.getSvg('enemy:' + e.id)}</div>
            <div class="codex-name">${e.name} ${e.isBoss ? '<span class="tier-pill t4">BOSS</span>' : ''}</div>
            <div class="codex-desc">Base HP: ${e.hp} • Speed: ${e.speed} • Scrap: ${e.scrap}</div>
          </div>
        `).join('') + `</div>`;
      }
    }

    // ------------------------------------------------------------------------
    // VICTORY / GAME OVER & TOASTS
    // ------------------------------------------------------------------------
    showEndScreen(run, isVictory) {
      window.MM.Audio.setMusicMode('menu');
      this.clearSavedRun();
      $('hud').classList.add('hidden');
      $('modal-end').classList.remove('hidden');
      const isPracticeDone = !!run.isPractice && isVictory;
      $('end-title').textContent = isPracticeDone
        ? '🧪 PRACTICE TRIAL COMPLETE! (3 / 3 WAVES)'
        : (isVictory ? 'SECTOR CLEARED — VICTORY!' : 'EXPEDITION TERMINATED');
      $('end-title').style.color = isPracticeDone ? '#2DD4BF' : (isVictory ? '#7DCB5A' : '#E8483F');
      const modLabels = (run.modifiers || []).map((id) => {
        const m = (window.MM.MODIFIERS || []).find((x) => x.id === id);
        return m ? `${m.icon} ${m.name}` : id;
      });
      const modStr = modLabels.length ? ` • Modifiers: ${modLabels.join(', ')}` : '';
      $('end-sub').textContent = isPracticeDone
        ? `${run.charDef.name} (${run.charDef.title}) finished all 3 Practice waves! Permanently unlock ${run.charDef.name} in the Roster (${run.charDef.unlockCost || 300} ◈) for full 12-wave runs & Endless Mode.`
        : (isVictory
          ? `${run.charDef.name} (${run.charDef.title}) conquered The Quantum Architect on ${run.hazard.name}!${modStr}`
          : `${run.charDef.name} fell on Wave ${run.wave}${run.isPractice ? ' / 3 (Practice)' : (run.endless ? ' ∞' : '')} (${run.hazard.name}).${modStr}`);

      $('end-avatar').innerHTML = this.renderAvatarHtml(run.charId);
      $('end-stats').innerHTML = `
        <div class="end-stat"><span>Wave Reached</span><b>${run.isPractice ? `${run.wave} / 3 (Practice)` : run.wave}</b></div>
        <div class="end-stat"><span>Enemies Eliminated</span><b>${run.kills}</b></div>
        <div class="end-stat"><span>Bosses Defeated</span><b>${run.bossKills}</b></div>
        <div class="end-stat"><span>Total Damage</span><b>${run.totalDamageDealt.toLocaleString()}</b></div>
        <div class="end-stat"><span>Contraption Merges</span><b>${run.mergesDone}</b></div>
        <div class="end-stat highlight"><span>Core Shards Earned</span><b>+${run.shardsEarned} ◈</b></div>
      `;
      $('end-loadout').innerHTML = run.tools.length === 0
        ? `<div class="owned-items-empty">🐾 PET-ONLY RUN — 0 Weapons Equipped (See Pet Army Below!)</div>`
        : run.tools.map((t) => {
        const def = window.MM.getContraption(t.id);
        return `
          <div class="end-tool" style="border-color:${window.MM.TIER_COLORS[t.tier]}">
            ${window.MM.SVGs.getSvg('tool:' + t.id)}
            <span>${def.name} ${window.MM.TIER_NAMES[t.tier]}</span>
          </div>
        `;
      }).join('');

      const endItemsWrap = $('end-items-wrap');
      const endItemsEl = $('end-items');
      const endModCounts = new Map();
      (run.modules || []).forEach((id) => endModCounts.set(id, (endModCounts.get(id) || 0) + 1));
      if (endModCounts.size > 0 && endItemsWrap && endItemsEl) {
        endItemsWrap.classList.remove('hidden');
        endItemsEl.innerHTML = Array.from(endModCounts.entries()).map(([id, cnt]) => {
          const m = window.MM.getModule(id);
          const col = m.tag === 'Cursed' ? '#B98AE8' : (window.MM.TIER_COLORS[m.tier] || '#CBD2E0');
          return `
            <div class="owned-item-tile tier-${m.tier}" style="--tier-col:${col}" title="${m.name}${cnt > 1 ? ` ×${cnt}` : ''} — ${m.desc}">
              <div class="owned-item-svg">${window.MM.SVGs.getSvg(m.icon)}</div>
              ${cnt > 1 ? `<span class="item-stack-badge">×${cnt}</span>` : ''}
            </div>
          `;
        }).join('');
      } else if (endItemsWrap) {
        endItemsWrap.classList.add('hidden');
      }

      const endDpsWrap = $('end-dps-wrap');
      const endDpsEl = $('end-dps');
      if (endDpsWrap && endDpsEl && Object.keys(run.damageBySource || {}).length > 0) {
        endDpsWrap.classList.remove('hidden');
        this.renderDpsMeter(endDpsEl, run.damageBySource, 'Run Total');
      } else if (endDpsWrap) {
        endDpsWrap.classList.add('hidden');
      }

      $('btn-end-endless').classList.toggle('hidden', !isVictory || !!run.isPractice);
    }

    showAchievementToast(ach) {
      if (!ach) return;
      const el = $('ach-toast');
      $('ach-toast-name').textContent = `${ach.name} (+${ach.reward} ◈)`;
      $('ach-toast-desc').textContent = ach.desc;
      el.classList.remove('hidden');
      clearTimeout(this._achTimer);
      this._achTimer = setTimeout(() => el.classList.add('hidden'), 3600);
    }

    // ------------------------------------------------------------------------
    // MOBILE TOUCH CONTROLS & FULL GAMEPAD / CONTROLLER MENU NAVIGATOR
    // ------------------------------------------------------------------------
    syncTouchPrefUI() {
      const prefs = window.MM.Meta.getPrefs();
      const mode = prefs.touchMode || 'auto'; // 'auto' | 'on' | 'off'
      const coarse = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
      const showTouch = mode === 'on' || (mode === 'auto' && (coarse || this._sawTouch));
      document.body.classList.toggle('is-touch', !!showTouch);
      document.body.classList.toggle('touch-off', mode === 'off');
      const btn = $('btn-pref-touch');
      if (btn) {
        btn.textContent = mode === 'on' ? '📱 Touch UI: ON' : (mode === 'off' ? '📱 Touch UI: OFF' : '📱 Touch UI: AUTO');
        btn.classList.toggle('active', mode !== 'off');
      }
    }

    initTouchAndGamepadUI() {
      this._sawTouch = false;
      this._gpFocusEl = null;
      this._gpPrevBtns = {};
      this._gpDirCd = 0;

      // Auto-enable touch controls on first real touch
      window.addEventListener('touchstart', () => {
        if (!this._sawTouch) {
          this._sawTouch = true;
          this.syncTouchPrefUI();
        }
      }, { passive: true });
      this.syncTouchPrefUI();

      // Mixer Touch UI toggle ('auto' -> 'on' -> 'off' -> 'auto')
      if ($('btn-pref-touch')) {
        $('btn-pref-touch').onclick = () => {
          window.MM.Audio.SFX.click();
          const meta = window.MM.Meta.get();
          meta.prefs = meta.prefs || { screenShake: true, damageNumbers: true };
          const cur = meta.prefs.touchMode || 'auto';
          meta.prefs.touchMode = cur === 'auto' ? 'on' : (cur === 'on' ? 'off' : 'auto');
          window.MM.Meta.save();
          this.syncTouchPrefUI();
        };
      }

      // Multi-touch safe Mobile Action Buttons (Dash, Ult, Rally)
      const bindTouchBtn = (id, fn) => {
        const el = $(id);
        if (!el) return;
        el.addEventListener('touchstart', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (window.MM.Audio && window.MM.Audio.unlock) window.MM.Audio.unlock();
          fn();
        }, { passive: false });
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          fn();
        });
      };
      bindTouchBtn('btn-touch-dash', () => this.engine.triggerDash());
      bindTouchBtn('btn-touch-ult', () => this.engine.triggerUltimate());
      bindTouchBtn('btn-touch-rally', () => this.engine.triggerPetRally());

      // Controller connect/disconnect status pill
      const updateGpBadge = () => {
        const gp = this.engine.getActiveGamepad ? this.engine.getActiveGamepad() : null;
        if ($('gp-status-pill')) {
          $('gp-status-pill').classList.toggle('hidden', !gp);
        }
      };
      window.addEventListener('gamepadconnected', () => {
        updateGpBadge();
        window.MM.Audio.SFX.pickup(8);
      });
      window.addEventListener('gamepaddisconnected', () => {
        updateGpBadge();
        this.clearGamepadFocus();
      });
      updateGpBadge();

      // Clear focus ring whenever mouse moves so desktop cursor feels clean
      window.addEventListener('mousemove', () => this.clearGamepadFocus(), { passive: true });

      // 60fps Gamepad Menu Navigation loop
      let lastT = performance.now();
      const poll = (now) => {
        const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
        lastT = now;
        this.pollGamepadMenus(dt);
        requestAnimationFrame(poll);
      };
      requestAnimationFrame(poll);
    }

    clearGamepadFocus() {
      if (this._gpFocusEl) {
        this._gpFocusEl.classList.remove('gp-focus');
        this._gpFocusEl = null;
      }
    }

    setGamepadFocus(el) {
      if (this._gpFocusEl && this._gpFocusEl !== el) {
        this._gpFocusEl.classList.remove('gp-focus');
      }
      this._gpFocusEl = el || null;
      if (el) {
        el.classList.add('gp-focus');
        try { el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); } catch (e) {}
      }
    }

    getTopGamepadContainer() {
      const order = [
        'modal-guide', 'modal-crate', 'modal-levelup', 'modal-pause', 'modal-end',
        'modal-daily', 'modal-practice', 'modal-lab', 'modal-codex', 'modal-mixer',
        'modal-settings', 'modal-runsetup',
        'screen-shop', 'screen-select', 'screen-title'
      ];
      for (let i = 0; i < order.length; i++) {
        const el = $(order[i]);
        if (el && !el.classList.contains('hidden')) return el;
      }
      return null;
    }

    getFocusableIn(container) {
      if (!container) return [];
      const nodes = container.querySelectorAll('button:not(:disabled), a.btn-secondary, a.btn-primary, .char-card, .draft-card, .tool-slot.filled, .practice-card');
      const res = [];
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.classList.contains('hidden')) continue;
        const r = n.getBoundingClientRect();
        if (r.width > 4 && r.height > 4) res.push(n);
      }
      return res;
    }

    moveGamepadFocus(dirX, dirY) {
      const container = this.getTopGamepadContainer();
      const list = this.getFocusableIn(container);
      if (list.length === 0) return;

      if (!this._gpFocusEl || !list.includes(this._gpFocusEl)) {
        this.setGamepadFocus(list[0]);
        window.MM.Audio.SFX.click();
        return;
      }

      const curRect = this._gpFocusEl.getBoundingClientRect();
      const cx = curRect.left + curRect.width / 2;
      const cy = curRect.top + curRect.height / 2;

      let best = null;
      let bestScore = 1e12;
      for (let i = 0; i < list.length; i++) {
        const cand = list[i];
        if (cand === this._gpFocusEl) continue;
        const r = cand.getBoundingClientRect();
        const tx = r.left + r.width / 2;
        const ty = r.top + r.height / 2;
        const dx = tx - cx;
        const dy = ty - cy;
        const primary = dirX !== 0 ? dx * dirX : dy * dirY;
        const cross = dirX !== 0 ? Math.abs(dy) : Math.abs(dx);
        if (primary <= 8) continue;
        const score = primary + cross * 2.4;
        if (score < bestScore) { bestScore = score; best = cand; }
      }

      if (!best) {
        // Fallback cycle linearly if at edge of grid
        const idx = list.indexOf(this._gpFocusEl);
        const step = (dirX > 0 || dirY > 0) ? 1 : -1;
        best = list[(idx + step + list.length) % list.length];
      }
      this.setGamepadFocus(best);
      window.MM.Audio.SFX.click();
    }

    pollGamepadMenus(dt) {
      const gp = this.engine && this.engine.getActiveGamepad ? this.engine.getActiveGamepad() : null;
      if (!gp) return;
      if ($('gp-status-pill') && $('gp-status-pill').classList.contains('hidden')) {
        $('gp-status-pill').classList.remove('hidden');
      }

      const btn = (idx) => !!(gp.buttons && gp.buttons[idx] && gp.buttons[idx].pressed);
      const justPressed = (idx) => {
        const now = btn(idx);
        const was = !!this._gpPrevBtns[idx];
        this._gpPrevBtns[idx] = now;
        return now && !was;
      };

      // Do not steal gamepad inputs while actively fighting!
      if (this.engine.state === 'playing') {
        this.clearGamepadFocus();
        [0, 1, 2, 3, 9, 12, 13, 14, 15].forEach((i) => { this._gpPrevBtns[i] = btn(i); });
        return;
      }

      const container = this.getTopGamepadContainer();
      if (!container) return;

      // Left stick / D-Pad directional navigation with repeat delay
      let dx = 0;
      let dy = 0;
      const ax = (gp.axes && gp.axes[0]) || 0;
      const ay = (gp.axes && gp.axes[1]) || 0;
      if (btn(14) || ax < -0.52) dx = -1;
      else if (btn(15) || ax > 0.52) dx = 1;
      if (btn(12) || ay < -0.52) dy = -1;
      else if (btn(13) || ay > 0.52) dy = 1;

      if (this._gpDirCd > 0) this._gpDirCd -= dt;
      if ((dx !== 0 || dy !== 0) && this._gpDirCd <= 0) {
        this._gpDirCd = 0.21;
        this.moveGamepadFocus(dx, Math.abs(dx) > 0 ? 0 : dy);
      } else if (dx === 0 && dy === 0) {
        this._gpDirCd = 0;
      }

      // A / Cross (0): Activate focused element
      if (justPressed(0)) {
        window.MM.Audio.unlock();
        if (!this._gpFocusEl || !container.contains(this._gpFocusEl)) {
          const list = this.getFocusableIn(container);
          if (list.length) this.setGamepadFocus(list[0]);
        }
        if (this._gpFocusEl && !this._gpFocusEl.disabled) {
          this._gpFocusEl.click();
        }
      }

      // B / Circle (1): Back / Close modal / Unpause
      if (justPressed(1)) {
        const closeMap = {
          'modal-guide': 'btn-guide-close',
          'modal-pause': 'btn-pause-resume',
          'modal-daily': 'btn-daily-close',
          'modal-practice': 'btn-practice-close',
          'modal-lab': 'btn-lab-close',
          'modal-codex': 'btn-codex-close',
          'modal-mixer': 'btn-mixer-close',
          'modal-settings': 'btn-settings-close',
          'modal-runsetup': 'btn-runsetup-back',
          'screen-select': 'btn-select-back'
        };
        const targetId = closeMap[container.id];
        if (targetId && $(targetId)) $(targetId).click();
      }

      // X / Square (2): Reroll in Workshop or Level-Up
      if (justPressed(2)) {
        if (container.id === 'screen-shop' && $('btn-shop-reroll') && !$('btn-shop-reroll').disabled) {
          $('btn-shop-reroll').click();
        } else if (container.id === 'modal-levelup' && $('btn-level-reroll') && !$('btn-level-reroll').disabled) {
          $('btn-level-reroll').click();
        }
      }

      // Y / Triangle (3): Lock card in Workshop (if inside a shop card) or Next Wave
      if (justPressed(3) && container.id === 'screen-shop') {
        const card = this._gpFocusEl && this._gpFocusEl.closest ? this._gpFocusEl.closest('.shop-card') : null;
        const lockBtn = card ? card.querySelector('.btn-lock') : null;
        if (lockBtn) lockBtn.click();
        else if ($('btn-shop-nextwave')) $('btn-shop-nextwave').click();
      }

      // Start (9): Resume Pause OR Launch Next Wave from Workshop
      if (justPressed(9)) {
        if (container.id === 'modal-pause' && $('btn-pause-resume')) $('btn-pause-resume').click();
        else if (container.id === 'screen-shop' && $('btn-shop-nextwave')) $('btn-shop-nextwave').click();
        else if (container.id === 'modal-runsetup' && $('btn-launch-run')) $('btn-launch-run').click();
        else if (container.id === 'screen-select' && $('btn-select-next') && !$('btn-select-next').disabled) $('btn-select-next').click();
      }
    }
  }

  window.MM.UIController = UIController;
})();
