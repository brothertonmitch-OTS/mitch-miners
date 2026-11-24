// ============================================================================
// MULTI-MINE — GameEngine: render-world
// ============================================================================
(function () {
  // eslint-disable-next-line no-unused-vars
  const { ARENA_W, ARENA_H, clamp, dist2, rand, pick, wobblyCircle } = window.MM.EngineUtil;

  Object.assign(window.MM.GameEngine.prototype, {
    drawSprite(ctx, key, x, y, w, h, flashAlpha = 0) {
      const sp = window.MM.SVGs.getSprite(key);
      if (!sp || !sp.ready) return;
      ctx.drawImage(sp.canvas, x, y, w, h);
      if (flashAlpha > 0 && sp.flashCanvas) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.85, flashAlpha);
        ctx.drawImage(sp.flashCanvas, x, y, w, h);
        ctx.restore();
      }
    },

    // ------------------------------------------------------------------------
    // NEXT-LEVEL ARENA RENDERER
    // ------------------------------------------------------------------------
    renderArena() {
      const ctx = this.ctx;
      const biome = this.waveCfg ? this.waveCfg.biome : window.MM.BIOMES[0];

      ctx.save();
      ctx.scale(this.dpr, this.dpr);

      ctx.fillStyle = biome.outer || '#4A576E';
      ctx.fillRect(0, 0, this.viewW, this.viewH);

      const prefs = window.MM.Meta.getPrefs ? window.MM.Meta.getPrefs() : { screenShake: true };
      const shakeOn = prefs.screenShake !== false;
      const z = this.camZoom || 1;
      // screen shake is capped so it never makes enemies hard to read
      const shakeAmt = Math.min(this.cam.shake, 3.5);
      const shakeX = (shakeOn && shakeAmt > 0) ? Math.sin(this.cam.shakeTime) * shakeAmt : 0;
      const shakeY = (shakeOn && shakeAmt > 0) ? Math.cos(this.cam.shakeTime * 1.27) * shakeAmt * 0.8 : 0;

      ctx.translate(this.viewW / 2, this.viewH / 2);
      ctx.scale(z, z);
      ctx.translate(-this.cam.x + shakeX, -this.cam.y + shakeY);

      // 1. Pre-baked Rich Architectural Flat-Vector Floor + Live Animated Conduits, Floodlights & Props
      this.renderBiomeWorld(ctx, biome);

      // 2. Persistent Fading Battlefield Decals (Scorch marks, Craters, Frost patches!)
      this.renderDecals(ctx);

      // 3. Floor Hazards & Ground Flat-Vector FX (Cracks cleanly under feet!)
      this.renderHazards(ctx);
      this.renderFxLayer(ctx, true);

      // 4. Telegraphs & Live Mid-Wave Arena Events
      this.renderLiveEvents(ctx);
      this.renderTelegraphs(ctx);

      // 5. Interactive Arena Objects (Ore Veins, Explosive Barrels, Loot Pinatas!) & Pickups
      this.renderArenaObjects(ctx);
      this.renderPickups(ctx);

      // 6. Deployables
      this.renderDeployables(ctx);

      // 7. Jet-Dash Afterimages
      this.afterimages.forEach((a) => {
        ctx.save();
        ctx.globalAlpha = (a.life / a.maxLife) * 0.42;
        ctx.translate(a.x, a.y);
        ctx.rotate(a.tilt || 0);
        ctx.scale(a.facing, 1);
        this.drawSprite(ctx, 'char:' + this.run.charId, -30, -34, 60, 60, 0.35);
        ctx.restore();
      });

      // 8. Enemies & Bosses (with trailing drain bars!)
      this.renderEnemies(ctx);

      // 9. Player Alien Engineer + Loyal Companion Pets + Hovering Weapon Rig!
      this.renderPets(ctx);
      this.renderPlayer(ctx);

      // 10. Orbitals & Drones
      this.renderOrbitalsAndDrones(ctx);

      // 11. 3D-Bouncing Flat-Vector Debris (with ground shadows!)
      this.renderDebris(ctx);

      // 12. Projectiles & Enemy Shots
      this.renderProjectiles(ctx);

      // 13. Air-Layer FX, Beams, Rings, Particles & Damage Numbers
      this.renderFX(ctx);

      // 14. Enemy shots last, so threats are never hidden under effects
      this.renderEnemyShots(ctx);

      ctx.restore();

      // 14. Screen-space Low-HP Pulse Vignette & Dynamic Kill-Streak Badge!
      this.renderScreenSpacePolish(ctx);
    },

    renderDecals(ctx) {
      const INK = '#1E1A17';
      this.decals.forEach((dc) => {
        const alpha = clamp(dc.life / 1.5, 0, 1);
        ctx.save();
        ctx.translate(dc.x, dc.y);
        ctx.rotate(dc.rot);
        if (dc.kind === 'scorch') {
          // spiky soot splat with a faint ember core
          ctx.globalAlpha = alpha * 0.32;
          ctx.fillStyle = INK;
          ctx.beginPath();
          for (let k = 0; k < 16; k++) {
            const a = (Math.PI * 2 * k) / 16;
            const rr = dc.r * (k % 2 ? 0.72 : 1.05);
            if (k === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
          }
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = alpha * 0.22;
          ctx.fillStyle = '#FF6A1F';
          ctx.beginPath(); ctx.arc(0, 0, dc.r * 0.45, 0, Math.PI * 2); ctx.fill();
        } else if (dc.kind === 'frost') {
          // icy hex patch with ink rim and a lighter inner sheet
          const hex = (r) => {
            ctx.beginPath();
            for (let k = 0; k < 6; k++) {
              const a = (Math.PI / 3) * k;
              if (k === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath();
          };
          ctx.globalAlpha = alpha * 0.45;
          hex(dc.r);
          ctx.fillStyle = '#9CD3FF'; ctx.fill();
          ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
          ctx.globalAlpha = alpha * 0.4;
          hex(dc.r * 0.55);
          ctx.fillStyle = '#FFFFFF'; ctx.fill();
        } else {
          // seismic crater: sunken dish with radiating cracks
          ctx.globalAlpha = alpha * 0.26;
          ctx.fillStyle = INK;
          ctx.beginPath(); ctx.ellipse(0, 0, dc.r, dc.r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = alpha * 0.5;
          ctx.strokeStyle = INK;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          for (let k = 0; k < 5; k++) {
            const a = (Math.PI * 2 * k) / 5 + 0.4;
            ctx.moveTo(Math.cos(a) * dc.r * 0.6, Math.sin(a) * dc.r * 0.5);
            ctx.lineTo(Math.cos(a + 0.2) * dc.r * 1.25, Math.sin(a + 0.2) * dc.r * 1.05);
          }
          ctx.stroke();
        }
        ctx.restore();
      });
    },

    renderHazards(ctx) {
      const INK = '#1E1A17';
      const t = this.waveElapsed;
      // wobbly cartoon puddle outline (deterministic per hazard position)
      const puddle = (x, y, r, seed) => {
        ctx.beginPath();
        for (let k = 0; k <= 32; k++) {
          const a = (Math.PI * 2 * k) / 32;
          const rr = r * (1 + 0.06 * Math.sin(a * 3 + seed) + 0.04 * Math.sin(a * 5 + seed * 1.7));
          if (k === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.86);
          else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.86);
        }
        ctx.closePath();
      };
      this.hazards.forEach((h) => {
        if (h.kind === 'lava') {
          const alpha = Math.min(1, h.life / 0.8);
          const pop = h.spawnT < 1 ? (1 + Math.sin(h.spawnT * Math.PI) * 0.25) * h.spawnT : 1;
          ctx.save();
          ctx.globalAlpha = alpha * 0.75;
          puddle(h.x, h.y, h.radius, h.x * 0.01);
          ctx.fillStyle = '#E8483F'; ctx.fill();
          ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.stroke();
          ctx.globalAlpha = alpha * 0.85;
          puddle(h.x, h.y, h.radius * (0.58 + Math.sin(t * 7) * 0.08), h.y * 0.01);
          ctx.fillStyle = '#FFB347'; ctx.fill();
          ctx.globalAlpha = alpha;
          ctx.translate(h.x, h.y - 6);
          ctx.scale(pop, pop);
          this.drawSprite(ctx, 'prop:volcano', -27, -29, 54, 54);
          ctx.restore();
        } else if (h.kind === 'acid') {
          const alpha = Math.min(1, h.life / 0.8);
          ctx.save();
          ctx.globalAlpha = alpha * 0.7;
          puddle(h.x, h.y, h.radius, h.x * 0.01);
          ctx.fillStyle = '#5BC36A'; ctx.fill();
          ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.stroke();
          ctx.globalAlpha = alpha * 0.85;
          ctx.fillStyle = '#93E08E';
          const bx = h.x + Math.sin(t * 4) * 8;
          ctx.beginPath(); ctx.arc(bx, h.y - 6, h.radius * 0.22, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
          ctx.beginPath(); ctx.arc(h.x - h.radius * 0.4, h.y + 4, h.radius * 0.12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.restore();
        } else if (h.kind === 'tar') {
          const alpha = Math.min(1, h.life / 0.8);
          ctx.save();
          ctx.globalAlpha = alpha * 0.8;
          puddle(h.x, h.y, h.radius, h.y * 0.01);
          ctx.fillStyle = h.ignited ? '#E8483F' : '#23202E'; ctx.fill();
          ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.stroke();
          ctx.globalAlpha = alpha * 0.8;
          ctx.fillStyle = h.ignited ? '#FFE07A' : '#4A4560';
          ctx.beginPath(); ctx.arc(h.x + Math.cos(t * 5) * 7, h.y + 4, h.radius * 0.38, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        } else if (h.kind === 'gravity') {
          const pulse = 1 - h.life / h.maxLife;
          ctx.save();
          ctx.translate(h.x, h.y);
          ctx.fillStyle = 'rgba(155, 107, 224, 0.22)';
          ctx.beginPath(); ctx.arc(0, 0, h.radius, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
          ctx.rotate(t * 5.2);
          ctx.setLineDash([14, 8]);
          ctx.beginPath(); ctx.arc(0, 0, h.radius * (1 - pulse * 0.45), 0, Math.PI * 2);
          ctx.strokeStyle = INK; ctx.lineWidth = 6.5; ctx.stroke();
          ctx.strokeStyle = '#C6A6FF'; ctx.lineWidth = 3.5; ctx.stroke();
          ctx.setLineDash([]);
          this.drawSprite(ctx, 'tool:gravity_well', -22, -22, 44, 44);
          ctx.restore();
        } else if (h.kind === 'drill') {
          ctx.save();
          ctx.fillStyle = 'rgba(30, 26, 23, 0.5)';
          ctx.beginPath(); ctx.arc(h.x, h.y, 18, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
          ctx.fillStyle = '#FFE07A';
          ctx.beginPath(); ctx.arc(h.x, h.y, 9, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
          ctx.restore();
        }
      });
    },

    renderTelegraphs(ctx) {
      this.telegraphs.forEach((t) => {
        const progress = 1 - t.life / t.maxLife;
        ctx.save();
        if (t.kind === 'line') {
          ctx.strokeStyle = t.color;
          ctx.globalAlpha = 0.28 + progress * 0.54;
          ctx.lineWidth = 12 + progress * 8;
          ctx.lineCap = 'round';
          ctx.setLineDash([16, 12]);
          ctx.lineDashOffset = -this.globalTime * 165;
          ctx.beginPath(); ctx.moveTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2);
          const tw = ctx.lineWidth;
          ctx.strokeStyle = '#1E1A17';
          ctx.lineWidth = tw + 5;
          ctx.stroke();
          ctx.strokeStyle = t.color;
          ctx.lineWidth = tw;
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (t.kind === 'spawn_mark') {
          // Pulsing Red/Purple/Gold ✕ spawn marker so players can pre-dodge
          const pulse = 1 + Math.sin(this.globalTime * 16) * 0.14;
          const xSize = (t.isElite ? 16 : 11) * pulse;
          const outerR = t.r * (1.25 - progress * 0.65);

          ctx.fillStyle = t.color;
          ctx.globalAlpha = 0.16 + progress * 0.18;
          ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();

          // Shrinking countdown ring
          ctx.strokeStyle = t.color;
          ctx.globalAlpha = 0.65 + progress * 0.35;
          ctx.lineWidth = t.isElite ? 3.2 : 2.2;
          ctx.beginPath(); ctx.arc(t.x, t.y, Math.max(6, outerR), 0, Math.PI * 2); ctx.stroke();

          // Bold dark rim behind the ✕ for high contrast on every biome
          ctx.strokeStyle = '#1E1A17';
          ctx.globalAlpha = 0.92;
          ctx.lineWidth = t.isElite ? 8.5 : 6.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(t.x - xSize, t.y - xSize); ctx.lineTo(t.x + xSize, t.y + xSize);
          ctx.moveTo(t.x + xSize, t.y - xSize); ctx.lineTo(t.x - xSize, t.y + xSize);
          ctx.stroke();

          // Bright pulsing neon ✕
          ctx.strokeStyle = t.color;
          ctx.globalAlpha = 0.95;
          ctx.lineWidth = t.isElite ? 4.8 : 3.6;
          ctx.beginPath();
          ctx.moveTo(t.x - xSize, t.y - xSize); ctx.lineTo(t.x + xSize, t.y + xSize);
          ctx.moveTo(t.x + xSize, t.y - xSize); ctx.lineTo(t.x - xSize, t.y + xSize);
          ctx.stroke();
        } else if (t.kind === 'aim') {
          // spitter wind-up: a short dashed aim line (or fan) that fills in
          const len = 70 + progress * 60;
          const dirs = t.spread ? [-t.spread, 0, t.spread] : [0];
          ctx.lineCap = 'round';
          ctx.setLineDash([8, 7]);
          dirs.forEach((o) => {
            const a = t.ang + o;
            ctx.beginPath(); ctx.moveTo(t.x1, t.y1); ctx.lineTo(t.x1 + Math.cos(a) * len, t.y1 + Math.sin(a) * len);
            ctx.globalAlpha = 0.85;
            ctx.strokeStyle = '#1E1A17'; ctx.lineWidth = 6; ctx.stroke();
            ctx.strokeStyle = t.color; ctx.lineWidth = 3; ctx.stroke();
          });
          ctx.setLineDash([]);
          // charging dot on the shooter
          ctx.globalAlpha = 0.95;
          ctx.beginPath(); ctx.arc(t.x1, t.y1, 4 + progress * 7, 0, Math.PI * 2);
          ctx.fillStyle = t.color; ctx.fill();
          ctx.strokeStyle = '#1E1A17'; ctx.lineWidth = 2.5; ctx.stroke();
        } else if (t.kind === 'burst') {
          // ring-burst wind-up: a ring that tightens onto the enemy
          const rr = t.r * (1.35 - progress * 0.75);
          if (t.seed === undefined) t.seed = Math.random() * 100;
          ctx.globalAlpha = 0.3 + progress * 0.6;
          wobblyCircle(ctx, t.x, t.y, rr, t.seed, 0.04);
          ctx.strokeStyle = '#1E1A17'; ctx.lineWidth = 6.5; ctx.stroke();
          ctx.strokeStyle = t.color; ctx.lineWidth = 3; ctx.stroke();
        } else if (t.kind === 'circle') {
          ctx.fillStyle = t.color;
          ctx.globalAlpha = 0.16;
          ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.36;
          ctx.beginPath(); ctx.arc(t.x, t.y, t.r * progress, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.94;
          ctx.setLineDash([10, 6]);
          if (t.seed === undefined) t.seed = Math.random() * 100;
          wobblyCircle(ctx, t.x, t.y, t.r, t.seed, 0.025);
          ctx.strokeStyle = '#1E1A17';
          ctx.lineWidth = 6.5;
          ctx.stroke();
          ctx.strokeStyle = t.color;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.setLineDash([]);
          if (t.label) {
            this.drawSprite(ctx, 'fx:warn_badge', t.x - 14, t.y - 16, 28, 28);
          }
        }
        ctx.restore();
      });
    },

    renderArenaObjects(ctx) {
      if (!this.arenaObjects || this.arenaObjects.length === 0) return;
      this.arenaObjects.forEach((obj) => {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        const isBarrel = obj.kind === 'explosive_barrel';
        const isPinata = obj.kind === 'loot_pinata';
        const ringCol = isBarrel ? '#E8483F' : (isPinata ? '#FFE07A' : '#5BD6A0');

        ctx.fillStyle = 'rgba(12, 14, 24, 0.48)';
        ctx.beginPath(); ctx.ellipse(0, 20, 24, 8.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = ringCol;
        ctx.lineWidth = 2.4;
        ctx.setLineDash([7, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        const hop = isPinata ? Math.abs(Math.sin(obj.bob * 1.4)) * -9 : 0;
        ctx.translate(0, hop);
        const sz = isPinata ? 56 : 52;
        this.drawSprite(ctx, 'prop:' + obj.kind, -sz / 2, -sz / 2 - 4, sz, sz, obj.hitFlash > 0 ? 0.85 : 0);

        // Mini HP bar when damaged
        if (obj.hp < obj.maxHp) {
          const bw = 38;
          ctx.fillStyle = '#181A24';
          ctx.beginPath(); ctx.roundRect(-bw / 2 - 1, -34, bw + 2, 7, 3); ctx.fill();
          ctx.fillStyle = ringCol;
          ctx.beginPath(); ctx.roundRect(-bw / 2, -33, bw * clamp(obj.hp / obj.maxHp, 0, 1), 5, 2); ctx.fill();
        }
        ctx.restore();
      });
    },

    // Cartoon world-space label: yellow text with a thick ink outline
    drawEventLabel(ctx, text, x, y) {
      ctx.font = '600 15px "Fredoka", "Lexend", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#1E1A17';
      ctx.strokeText(text, x, y);
      ctx.fillStyle = '#FFE07A';
      ctx.fillText(text, x, y);
    },

    renderLiveEvents(ctx) {
      const ev = this.liveEvent;
      if (!ev) return;
      const pulse = 0.72 + Math.sin(this.globalTime * 7) * 0.25;
      ctx.save();
      if (ev.kind === 'beacon') {
        ctx.translate(ev.x, ev.y);
        // Translucent capture ring
        ctx.fillStyle = 'rgba(52, 245, 197, 0.12)';
        ctx.beginPath(); ctx.arc(0, 0, ev.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#5FE3B8';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 8]);
        ctx.beginPath(); ctx.arc(0, 0, ev.r, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        // Charge progress arc
        if (ev.progress > 0) {
          ctx.strokeStyle = '#FFE07A';
          ctx.lineWidth = 6.5;
          ctx.beginPath();
          ctx.arc(0, 0, ev.r - 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ev.progress);
          ctx.stroke();
        }
        // Center beacon antenna icon + label
        ctx.fillStyle = '#26434A';
        ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1E1A17'; ctx.lineWidth = 4; ctx.stroke();
        ctx.strokeStyle = '#5FE3B8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke();
        this.drawEventLabel(ctx, `📡 ${Math.round(ev.progress * 100)}% (${Math.ceil(ev.life)}s)`, 0, -ev.r - 12);
      } else if (ev.kind === 'reactor_surge') {
        (this.reactorHubs || []).forEach((h) => {
          ctx.save();
          ctx.translate(h.x, h.y);
          ctx.strokeStyle = '#FFE07A';
          ctx.globalAlpha = pulse;
          ctx.lineWidth = 5;
          ctx.beginPath(); ctx.arc(0, 0, h.r + 10 + Math.sin(this.globalTime * 8) * 5, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = 'rgba(255, 212, 102, 0.16)';
          ctx.beginPath(); ctx.arc(0, 0, h.r + 8, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
          this.drawEventLabel(ctx, `⚡ STEP TO OVERLOAD (${Math.ceil(ev.life)}s)`, 0, -h.r - 16);
          ctx.restore();
        });
      }
      ctx.restore();
    }
  });
})();
