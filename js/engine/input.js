// ============================================================================
// MULTI-MINE — GameEngine: input
// ============================================================================
(function () {
  // eslint-disable-next-line no-unused-vars
  const { ARENA_W, ARENA_H, clamp, dist2, rand, pick } = window.MM.EngineUtil;

  Object.assign(window.MM.GameEngine.prototype, {
    bindInput() {
      this.touchMove = { active: false, id: null, startX: 0, startY: 0, curX: 0, curY: 0, dx: 0, dy: 0 };
      this.padMove = { dx: 0, dy: 0 };
      this._padPrev = {};
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 120));
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => this.resize());
      }
      window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        this.keys[k] = true;
        if (this.state === 'playing') {
          if (k === ' ' || k === 'shift') {
            e.preventDefault();
            this.triggerDash();
          } else if (k === 'e' || k === 'q') {
            e.preventDefault();
            this.triggerUltimate();
          } else if (k === 'f') {
            e.preventDefault();
            this.triggerPetRally();
          } else if (k === 'escape' || k === 'p') {
            this.pause();
          }
        } else if (this.state === 'paused' && (k === 'escape' || k === 'p')) {
          this.resume();
        }
      });
      window.addEventListener('keyup', (e) => {
        this.keys[e.key.toLowerCase()] = false;
      });
      window.addEventListener('blur', () => {
        this.keys = {};
        this.touchMove.active = false;
        this.touchMove.id = null;
        this.touchMove.dx = 0;
        this.touchMove.dy = 0;
        this.padMove.dx = 0;
        this.padMove.dy = 0;
      });
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      });
      this.canvas.addEventListener('contextmenu', (e) => {
        if (this.state === 'playing') {
          e.preventDefault();
          this.triggerDash();
        }
      });
      this.canvas.addEventListener('mousedown', (e) => {
        if (this.state === 'playing' && e.button === 2) {
          this.triggerDash();
        }
      });

      // Multi-Touch Floating Virtual Thumbstick on Canvas (Left / Center Arena)
      const MAX_STICK_R = 54;
      this.canvas.addEventListener('touchstart', (e) => {
        if (this.state !== 'playing') return;
        if (window.MM.Audio && window.MM.Audio.unlock) window.MM.Audio.unlock();
        if (document.body) document.body.classList.add('is-touch');
        const rect = this.canvas.getBoundingClientRect();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          const tx = t.clientX - rect.left;
          const ty = t.clientY - rect.top;
          // Assign first free touch on left 72% of screen to Virtual Thumbstick
          if (!this.touchMove.active && tx <= rect.width * 0.72) {
            e.preventDefault();
            this.touchMove.active = true;
            this.touchMove.id = t.identifier;
            this.touchMove.startX = tx;
            this.touchMove.startY = ty;
            this.touchMove.curX = tx;
            this.touchMove.curY = ty;
            this.touchMove.dx = 0;
            this.touchMove.dy = 0;
            break;
          }
        }
      }, { passive: false });

      this.canvas.addEventListener('touchmove', (e) => {
        if (!this.touchMove.active) return;
        const rect = this.canvas.getBoundingClientRect();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === this.touchMove.id) {
            e.preventDefault();
            const tx = t.clientX - rect.left;
            const ty = t.clientY - rect.top;
            const ddx = tx - this.touchMove.startX;
            const ddy = ty - this.touchMove.startY;
            const dist = Math.hypot(ddx, ddy) || 0;
            if (dist > MAX_STICK_R) {
              const sc = MAX_STICK_R / dist;
              this.touchMove.curX = this.touchMove.startX + ddx * sc;
              this.touchMove.curY = this.touchMove.startY + ddy * sc;
              this.touchMove.dx = ddx / dist;
              this.touchMove.dy = ddy / dist;
            } else {
              this.touchMove.curX = tx;
              this.touchMove.curY = ty;
              this.touchMove.dx = dist > 6 ? ddx / MAX_STICK_R : 0;
              this.touchMove.dy = dist > 6 ? ddy / MAX_STICK_R : 0;
            }
            break;
          }
        }
      }, { passive: false });

      const endTouch = (e) => {
        if (!this.touchMove.active) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.touchMove.id) {
            this.touchMove.active = false;
            this.touchMove.id = null;
            this.touchMove.dx = 0;
            this.touchMove.dy = 0;
            break;
          }
        }
      };
      this.canvas.addEventListener('touchend', endTouch, { passive: true });
      this.canvas.addEventListener('touchcancel', endTouch, { passive: true });
    },

    getActiveGamepad() {
      try {
        if (!navigator.getGamepads) return null;
        const pads = navigator.getGamepads();
        if (!pads) return null;
        for (let i = 0; i < pads.length; i++) {
          if (pads[i] && pads[i].connected) return pads[i];
        }
      } catch (e) {}
      return null;
    },

    rumbleGamepad(duration = 120, weak = 0.25, strong = 0.35) {
      try {
        const gp = this.getActiveGamepad();
        if (gp && gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === 'function') {
          gp.vibrationActuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration,
            weakMagnitude: weak,
            strongMagnitude: strong
          }).catch(() => {});
        }
      } catch (e) {}
    },

    pollCombatGamepad() {
      const gp = this.getActiveGamepad();
      if (!gp) {
        this.padMove.dx = 0;
        this.padMove.dy = 0;
        return;
      }
      const btn = (idx) => !!(gp.buttons && gp.buttons[idx] && gp.buttons[idx].pressed);
      const justPressed = (idx) => {
        const now = btn(idx);
        const was = !!this._padPrev[idx];
        this._padPrev[idx] = now;
        return now && !was;
      };

      // Left stick + D-Pad analog movement
      let ax = (gp.axes && gp.axes[0]) || 0;
      let ay = (gp.axes && gp.axes[1]) || 0;
      const mag = Math.hypot(ax, ay);
      if (mag < 0.16) { ax = 0; ay = 0; }
      else if (mag > 1) { ax /= mag; ay /= mag; }

      if (btn(12)) ay = -1;
      if (btn(13)) ay = 1;
      if (btn(14)) ax = -1;
      if (btn(15)) ax = 1;
      this.padMove.dx = ax;
      this.padMove.dy = ay;

      if (this.state === 'playing') {
        if (justPressed(0) || justPressed(5) || justPressed(7)) this.triggerDash();
        if (justPressed(2) || justPressed(3) || justPressed(4)) this.triggerUltimate();
        if (justPressed(1) || justPressed(6)) this.triggerPetRally();
        if (justPressed(9)) this.pause();
      } else {
        // Keep edge state synced so buttons don't double-fire when resuming!
        [0, 1, 2, 3, 4, 5, 6, 7, 9].forEach((i) => { this._padPrev[i] = btn(i); });
      }
    }
  });
})();
