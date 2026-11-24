// ============================================================================
// MULTI-MINE — Procedural Web Audio Synthesizer, Catchy Music & Audio Mixer
// ============================================================================
window.MM = window.MM || {};

(function () {
  const MIXER_KEY = 'multimine_audio_v1';
  let ctx = null;
  let sfxEnabled = true;
  let musicEnabled = true;
  let sfxVolume = 0.8;   // 0..1
  let musicVolume = 0.65; // 0..1
  let trackOverride = 'auto'; // 'auto' | 'combat' | 'synthwave' | 'menu' | 'boss'
  let masterGain = null;
  let sfxGain = null;
  let musicGain = null;
  let recordDest = null;
  let musicTimer = null;
  let musicStep = 0;
  let dynamicMode = 'menu'; // 'menu' | 'combat' | 'boss'

  // Load saved mixer settings
  try {
    const saved = JSON.parse(localStorage.getItem(MIXER_KEY) || '{}');
    if (typeof saved.sfxVolume === 'number') sfxVolume = Math.max(0, Math.min(1, saved.sfxVolume));
    if (typeof saved.musicVolume === 'number') musicVolume = Math.max(0, Math.min(1, saved.musicVolume));
    if (typeof saved.sfxEnabled === 'boolean') sfxEnabled = saved.sfxEnabled;
    if (typeof saved.musicEnabled === 'boolean') musicEnabled = saved.musicEnabled;
    if (saved.trackOverride) trackOverride = saved.trackOverride;
  } catch (e) {}

  function saveMixer() {
    try {
      localStorage.setItem(MIXER_KEY, JSON.stringify({
        sfxVolume, musicVolume, sfxEnabled, musicEnabled, trackOverride
      }));
    } catch (e) {}
  }

  function applyVolumes() {
    if (sfxGain) sfxGain.gain.value = sfxEnabled ? sfxVolume * 0.34 : 0;
    if (musicGain) musicGain.gain.value = musicEnabled ? musicVolume * 0.16 : 0;
  }

  // A short, dark stereo impulse: the sound of a small rock chamber.
  function caveImpulse(c, secs) {
    const len = Math.floor(c.sampleRate * secs);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const a = 0.55 - t * 0.45; // darker as it decays
        lp += (Math.random() * 2 - 1 - lp) * a;
        d[i] = lp * Math.pow(1 - t, 3.2) * (i < c.sampleRate * 0.008 ? i / (c.sampleRate * 0.008) : 1);
      }
    }
    return buf;
  }

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 1.0;
      masterGain.connect(ctx.destination);

      // SFX bus: dry + a short cave reverb, then gentle tape saturation and a
      // soft top cut so every effect shares the same gritty, underground space.
      sfxGain = ctx.createGain();
      let sfxOut = masterGain;
      if (ctx.createDynamicsCompressor) {
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.knee.value = 10;
        comp.ratio.value = 4;
        comp.attack.value = 0.003;
        comp.release.value = 0.12;
        comp.connect(masterGain);
        sfxOut = comp;
      }
      const tone = ctx.createBiquadFilter();
      tone.type = 'lowpass';
      tone.frequency.value = 12000;
      tone.connect(sfxOut);
      let grit = tone;
      if (ctx.createWaveShaper) {
        const sh = ctx.createWaveShaper();
        const n = 1024;
        const curve = new Float32Array(n);
        const k = 1.4;
        for (let i = 0; i < n; i++) {
          const x = (i / (n - 1)) * 2 - 1;
          curve[i] = Math.tanh(k * x) / k; // unity for quiet sounds, rounds off peaks
        }
        sh.curve = curve;
        sh.connect(tone);
        grit = sh;
      }
      sfxGain.connect(grit);
      if (ctx.createConvolver) {
        const verb = ctx.createConvolver();
        verb.buffer = caveImpulse(ctx, 0.75);
        const wet = ctx.createGain();
        wet.gain.value = 0.06; // just a hint of room; arcade sounds stay dry and punchy
        sfxGain.connect(verb);
        verb.connect(wet);
        wet.connect(grit);
      }

      musicGain = ctx.createGain();
      musicGain.connect(masterGain);
      applyVolumes();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function noise(dur, vol = 0.2, freq = 600, q = 1.2, dest = null) {
    const c = ensureCtx();
    if (!c) return;
    const targetDest = dest || sfxGain;
    if (!dest && (!sfxEnabled || sfxVolume <= 0.001)) return;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = c.createGain();
    const now = c.currentTime;
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(targetDest);
    src.start(now);
  }

  let levelMul = 1; // per-sound balance, set while an SFX schedules its layers
  const lastPlayed = {};
  function canPlay(key, minMs = 45) {
    const t = performance.now();
    if (lastPlayed[key] && t - lastPlayed[key] < minMs) return false;
    lastPlayed[key] = t;
    return true;
  }

  // ---- Layered SFX voices -------------------------------------------------------
  // voice(): one oscillator with its own envelope, optional pitch slide,
  // low-pass and stereo pan.  burst(): filtered noise with an optional sweep.
  // bit-crush: quantise the wave to a few levels (cached per depth)
  const CRUSH = {};
  function crushCurve(levels) {
    if (!CRUSH[levels]) {
      const n = 512;
      const cv = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        cv[i] = Math.round(x * levels) / levels;
      }
      CRUSH[levels] = cv;
    }
    return CRUSH[levels];
  }

  function voice(o) {
    if (!sfxEnabled || sfxVolume <= 0.001) return;
    const c = ensureCtx();
    if (!c) return;
    const now = c.currentTime + (o.delay || 0);
    const dur = o.dur || 0.1;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.freq, now);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slideTo), now + (o.slideDur || dur));
    if (o.detune) osc.detune.setValueAtTime(o.detune, now);
    if (o.fm) {
      // FM bite: a modulator wobbles the pitch hard at the start, then settles
      const m = c.createOscillator();
      const mg = c.createGain();
      m.frequency.value = o.freq * (o.fmRatio || 2);
      mg.gain.setValueAtTime(o.freq * o.fm, now);
      mg.gain.exponentialRampToValueAtTime(1, now + dur);
      m.connect(mg);
      mg.connect(osc.frequency);
      m.start(now);
      m.stop(now + dur + 0.03);
    }
    const atk = o.attack || 0.003;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime((o.vol || 0.2) * levelMul, now + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    let node = osc;
    if (o.crush && c.createWaveShaper) {
      const sh = c.createWaveShaper();
      sh.curve = crushCurve(o.crush);
      node.connect(sh);
      node = sh;
    }
    if (o.lp) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lp;
      node.connect(f);
      node = f;
    }
    node.connect(g);
    let out = g;
    if (o.pan && c.createStereoPanner) {
      const pn = c.createStereoPanner();
      pn.pan.value = o.pan;
      g.connect(pn);
      out = pn;
    }
    out.connect(sfxGain);
    osc.start(now);
    osc.stop(now + dur + 0.03);
  }

  const NOISE_BUF = {};
  function noiseBuffer(c) {
    if (!NOISE_BUF.b) {
      const len = c.sampleRate * 1;
      const b = c.createBuffer(1, len, c.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      NOISE_BUF.b = b;
    }
    return NOISE_BUF.b;
  }
  function burst(o) {
    if (!sfxEnabled || sfxVolume <= 0.001) return;
    const c = ensureCtx();
    if (!c) return;
    const now = c.currentTime + (o.delay || 0);
    const dur = o.dur || 0.1;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    const f = c.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 1000, now);
    if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo, now + dur);
    f.Q.value = o.q || 1;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime((o.vol || 0.2) * levelMul, now + (o.attack || 0.002));
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(f);
    f.connect(g);
    g.connect(sfxGain);
    src.start(now, Math.random() * 0.5);
    src.stop(now + dur + 0.03);
  }

  const rnd = (lo, hi) => lo + Math.random() * (hi - lo);

  // ==========================================================================
  // "CRUNCHY ARCADE" SOUND SET
  // Punchy bass thumps, FM-bitten blips with a light bit-crush, and a bright
  // two-tone coin that climbs while you chain scrap pickups.
  // a(): one voice (see voice() for options: fm, crush, lp, slide, pan)
  // ==========================================================================
  const a = (freq, o = {}) => voice(Object.assign({ freq }, o));
  const sq = (freq, o = {}) => voice(Object.assign({ freq, type: 'square', crush: 6, lp: 6000 }, o));
  const punch = (freq, vol, dur = 0.1, delay = 0) => voice({ freq, type: 'sine', dur, vol, slideTo: freq * 0.4, slideDur: dur * 0.7, delay });
  const crunch = (dur, vol, freq = 2200, delay = 0) => burst({ dur, vol, freq, q: 1, delay });

  const PENTA = [0, 2, 4, 7, 9];
  const pickupChain = { n: 0, last: 0, side: 1 };
  function chainNote(step) {
    const oct = Math.floor(step / PENTA.length);
    return 880 * Math.pow(2, (PENTA[step % PENTA.length] + oct * 12) / 12);
  }

  const SFX = {
    hit() {
      if (!canPlay('hit', 40)) return;
      a(rnd(180, 220), { type: 'square', dur: 0.08, vol: 0.22, slideTo: 70, crush: 4, lp: 1800 });
      crunch(0.04, 0.12, 2500);
    },
    shoot() {
      if (!canPlay('shoot', 42)) return;
      a(rnd(700, 800), { type: 'square', dur: 0.06, vol: 0.08, slideTo: 200, fm: 1.5, crush: 5, lp: 4000, pan: rnd(-0.15, 0.15) });
    },
    shotgun() {
      if (!canPlay('shotgun', 70)) return;
      punch(140, 0.34, 0.16);
      burst({ dur: 0.16, vol: 0.26, freq: 2400, filter: 'lowpass', sweepTo: 300 });
      a(90, { type: 'square', dur: 0.12, vol: 0.12, slideTo: 45, crush: 3, lp: 900 });
    },
    railgun() {
      if (!canPlay('railgun', 80)) return;
      a(400, { type: 'sawtooth', dur: 0.08, vol: 0.06, slideTo: 2600, crush: 6, lp: 7000 });
      a(2200, { type: 'square', dur: 0.14, vol: 0.08, slideTo: 300, fm: 2, crush: 5, lp: 6000, delay: 0.07 });
      punch(110, 0.22, 0.12, 0.07);
    },
    pet() {
      if (!canPlay('pet', 120)) return;
      sq(988, { dur: 0.05, vol: 0.06 });
      sq(1318, { dur: 0.07, vol: 0.06, delay: 0.05 });
    },
    ultimate() {
      punch(80, 0.5, 0.55);
      [0, 4, 7, 12, 16].forEach((s, i) => sq(330 * Math.pow(2, s / 12), { dur: 0.16, vol: 0.07, delay: i * 0.045 }));
      a(1320, { dur: 0.6, vol: 0.08, fm: 0.6, delay: 0.24 });
      burst({ dur: 0.5, vol: 0.2, freq: 400, q: 0.8, sweepTo: 4000 });
    },
    barrel() {
      punch(90, 0.55, 0.5);
      burst({ dur: 0.5, vol: 0.42, freq: 2200, filter: 'lowpass', sweepTo: 140 });
      a(60, { type: 'square', dur: 0.35, vol: 0.2, slideTo: 38, crush: 3, lp: 400 });
    },
    crit() {
      if (!canPlay('crit', 50)) return;
      sq(1568, { dur: 0.05, vol: 0.07 });
      sq(2093, { dur: 0.08, vol: 0.07, delay: 0.035 });
      punch(170, 0.2, 0.07);
      crunch(0.03, 0.1, 3200);
    },
    explode() {
      if (!canPlay('explode', 65)) return;
      punch(95, 0.48, 0.42);
      burst({ dur: 0.42, vol: 0.36, freq: 2000, filter: 'lowpass', sweepTo: 150 });
      a(60, { type: 'square', dur: 0.28, vol: 0.16, slideTo: 40, crush: 3, lp: 400 });
    },
    seismic() {
      if (!canPlay('seismic', 80)) return;
      punch(65, 0.55, 0.45);
      a(45, { type: 'square', dur: 0.35, vol: 0.18, slideTo: 30, crush: 3, lp: 300 });
      burst({ dur: 0.3, vol: 0.22, freq: 500, filter: 'lowpass', sweepTo: 90 });
    },
    zap() {
      if (!canPlay('zap', 55)) return;
      a(rnd(1300, 1600), { type: 'sawtooth', dur: 0.07, vol: 0.06, slideTo: 300, fm: 3, crush: 4, lp: 5000 });
      crunch(0.03, 0.06, 5000);
    },
    cryo() {
      if (!canPlay('cryo', 75)) return;
      sq(2637, { dur: 0.05, vol: 0.05 });
      sq(3136, { dur: 0.08, vol: 0.05, delay: 0.04 });
      burst({ dur: 0.12, vol: 0.07, freq: 7000, q: 2, sweepTo: 3000 });
    },
    deploy() {
      if (!canPlay('deploy', 60)) return;
      sq(440, { dur: 0.04, vol: 0.07 });
      sq(660, { dur: 0.06, vol: 0.07, delay: 0.04 });
      punch(150, 0.26, 0.08, 0.08);
      crunch(0.03, 0.1, 1800, 0.08);
    },
    dash() {
      burst({ dur: 0.18, vol: 0.18, freq: 500, q: 1.5, sweepTo: 3500, attack: 0.05 });
      a(300, { type: 'square', dur: 0.1, vol: 0.05, slideTo: 700, crush: 5, lp: 3000 });
    },
    pickup(pitchBoost = 0) {
      if (!canPlay('pickup', 26)) return;
      const t = performance.now();
      if (t - pickupChain.last > 650) pickupChain.n = 0;
      pickupChain.last = t;
      if (pitchBoost >= 10 && pickupChain.n < 4) pickupChain.n = 4;
      const step = Math.min(pickupChain.n, 11);
      pickupChain.n++;
      pickupChain.side *= -1;
      const f = chainNote(step);
      const pan = 0.18 * pickupChain.side;
      // two-tone coin: note, then a fifth above, with a little body thump
      sq(f, { dur: 0.06, vol: 0.09, pan });
      sq(f * 1.5, { dur: 0.12, vol: 0.08, delay: 0.05, pan });
      punch(120, 0.12, 0.06);
      if (pickupChain.n % 8 === 0) {
        sq(f * 2, { dur: 0.1, vol: 0.06, delay: 0.1, pan: 0.3 });
        sq(f * 3, { dur: 0.14, vol: 0.05, delay: 0.15, pan: -0.3 });
      }
    },
    hurt() {
      a(300, { type: 'sawtooth', dur: 0.25, vol: 0.2, slideTo: 80, crush: 4, lp: 1400 });
      punch(70, 0.4, 0.2);
      crunch(0.08, 0.14, 900);
    },
    levelUp() {
      [0, 2, 4, 5, 7, 9].forEach((s, i) => sq(523.25 * Math.pow(2, s / 12), { dur: 0.12, vol: 0.08, delay: i * 0.055 }));
      a(1046.5, { dur: 0.45, vol: 0.09, fm: 0.5, delay: 0.33 });
    },
    ultReady() {
      if (!canPlay('ultReady', 800)) return;
      sq(880, { dur: 0.08, vol: 0.08 });
      sq(1318.5, { dur: 0.16, vol: 0.08, delay: 0.08 });
      a(1760, { dur: 0.3, vol: 0.05, fm: 0.4, delay: 0.16 });
    },
    merge() {
      punch(160, 0.3, 0.08);
      crunch(0.04, 0.14, 2600);
      punch(170, 0.3, 0.08, 0.14);
      crunch(0.04, 0.14, 2800, 0.14);
      [0, 4, 7, 12].forEach((s, i) => sq(659.25 * Math.pow(2, s / 12), { dur: 0.12, vol: 0.07, delay: 0.3 + i * 0.05 }));
    },
    buy() {
      [988, 1318.5, 1975.5].forEach((f, i) => sq(f, { dur: 0.12, vol: 0.08, delay: i * 0.06 }));
      punch(140, 0.24, 0.1);
    },
    click() {
      a(1200, { type: 'square', dur: 0.03, vol: 0.07, slideTo: 900, crush: 5, lp: 5000 });
    },
    waveClear() {
      [[523.25, 659.25, 783.99], [698.46, 880, 1046.5]].forEach((ch, i) =>
        ch.forEach((f) => a(f, { type: 'sawtooth', dur: 0.36, vol: 0.045, delay: i * 0.18, lp: 3000 })));
      punch(80, 0.3, 0.3, 0.18);
      sq(1568, { dur: 0.3, vol: 0.06, delay: 0.36 });
    },
    bossWarn() {
      [0, 0.32].forEach((d) => {
        a(150, { type: 'sawtooth', dur: 0.28, vol: 0.14, slideTo: 110, crush: 4, lp: 1200, delay: d });
        a(75, { type: 'square', dur: 0.28, vol: 0.1, crush: 3, lp: 500, delay: d });
      });
      punch(55, 0.5, 0.6, 0.64);
    },
    gameOver() {
      [784, 659.25, 523.25, 392].forEach((f, i) => sq(f, { dur: 0.22, vol: 0.08, delay: i * 0.16, slideTo: f * 0.97 }));
      punch(60, 0.4, 0.7, 0.64);
      a(65, { type: 'square', dur: 0.6, vol: 0.12, slideTo: 40, crush: 3, lp: 400, delay: 0.64 });
    }
  };

  // Balance between sounds (measured offline): quiet, frequent combat sounds
  // stay low; the scrap pickup and UI taps are lifted so they read clearly.
  const LEVEL = { shoot: 2.2, zap: 2.5, click: 3.6, pickup: 2.0, crit: 1.4, cryo: 1.4, dash: 2.2, pet: 1.3, deploy: 0.5, railgun: 0.55, merge: 0.6, waveClear: 0.7, bossWarn: 0.7, gameOver: 0.6, explode: 0.75, seismic: 0.75, barrel: 0.8 };
  Object.keys(SFX).forEach((k) => {
    const fn = SFX[k];
    SFX[k] = (...args) => {
      levelMul = LEVEL[k] || 1;
      try { fn(...args); } finally { levelMul = 1; }
    };
  });

  // ==========================================================================
  // 4 CATCHY ELECTRO-CHIPTUNE TRACKS (MENU / COMBAT / BOSS / NEON SYNTHWAVE)
  // ==========================================================================
  function mTone(freq, type, dur, vol, detune = 0, slideTo = null) {
    if (!ctx || !musicGain || !freq) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (detune) osc.detune.setValueAtTime(detune, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), now + dur);

    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = type === 'sawtooth' ? 1900 : 2800;

    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(vol, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(filt);
    filt.connect(g);
    g.connect(musicGain);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function mKick(vol = 0.55) {
    if (!ctx || !musicGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(148, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.11);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    osc.connect(g);
    g.connect(musicGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  function mSnare(vol = 0.24) {
    if (!ctx || !musicGain) return;
    noise(0.09, vol, 1800, 0.85, musicGain);
    mTone(210, 'triangle', 0.06, vol * 0.6, 0, 110);
  }

  function mHat(vol = 0.10) {
    if (!ctx || !musicGain) return;
    noise(0.035, vol, 6800, 2.2, musicGain);
  }

  const N = {
    _: 0,
    G2: 98.00, A2: 110.00, Bb2: 116.54, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00,
    A3: 220.00, Bb3: 233.08, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
    A4: 440.00, Bb4: 466.16, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00
  };

  const COMBAT_BASS = [
    N.D3, N._, N.D3, N.D4,  N._, N.D3, N.F3, N._,
    N.Bb2, N._, N.Bb2, N.Bb3, N._, N.Bb2, N.C3, N._,
    N.F3, N._, N.F3, N.F4,  N._, N.F3, N.E3, N._,
    N.C3, N._, N.C3, N.C4,  N.A2, N._, N.C3, N._
  ];
  const COMBAT_LEAD_A = [
    N.D5, N._, N.F5, N._,  N.A5, N._, N.G5, N.F5,
    N.D5, N._, N.Bb4, N._, N.D5, N._, N.F5, N._,
    N.C5, N._, N.F5, N._,  N.A5, N._, N.G5, N._,
    N.E5, N._, N.G5, N.F5, N.E5, N._, N.C5, N._
  ];
  const COMBAT_LEAD_B = [
    N.A5, N._, N.G5, N.F5, N.D5, N._, N.F5, N._,
    N.G5, N._, N.F5, N.D5, N.Bb4, N._, N.D5, N._,
    N.F5, N._, N.E5, N.F5, N.A5, N._, N.C5, N._,
    N.E5, N.F5, N.G5, N._, N.A5, N._, N._, N._
  ];
  const COMBAT_CHORDS = [
    [N.D4, N.F4, N.A4], [N.Bb3, N.D4, N.F4], [N.C4, N.F4, N.A4], [N.C4, N.E4, N.G4]
  ];

  // Track 4: NEON SYNTHWAVE (A minor / C major driving retro synthwave!)
  const SYNTH_BASS = [
    N.A2, N.A2, N.A3, N.A2,  N.A2, N.A2, N.G2, N.A2,
    N.F3, N.F3, N.F4, N.F3,  N.F3, N.F3, N.E3, N.F3,
    N.C3, N.C3, N.C4, N.C3,  N.C3, N.C3, N.B3, N.C3,
    N.G2, N.G2, N.G3, N.G2,  N.E3, N.E3, N.G3, N.E3
  ];
  const SYNTH_ARP = [
    N.A4, N.C5, N.E5, N.A5,  N.E5, N.C5, N.A4, N.E5,
    N.F4, N.A4, N.C5, N.F5,  N.C5, N.A4, N.F4, N.C5,
    N.C5, N.E5, N.G5, N.C5,  N.G5, N.E5, N.C5, N.G5,
    N.G4, N.B4, N.D5, N.G5,  N.D5, N.B4, N.G4, N.B4
  ];
  const SYNTH_LEAD = [
    N.E5, N._, N._, N.C5,  N.A4, N._, N.B4, N.C5,
    N.F5, N._, N._, N.E5,  N.C5, N._, N._, N._,
    N.G5, N._, N.E5, N._,  N.C5, N._, N.D5, N.E5,
    N.D5, N._, N.B4, N._,  N.G4, N._, N.B4, N._
  ];

  const MENU_BASS = [
    N.D3, N._, N._, N.D3,  N.F3, N._, N.G3, N._,
    N.Bb2, N._, N._, N.Bb2, N.C3, N._, N.A2, N._
  ];
  const MENU_ARP = [
    N.D5, N.A4, N.F4, N.A4,  N.F5, N.C5, N.A4, N.C5,
    N.D5, N.Bb4, N.F4, N.Bb4, N.E5, N.C5, N.G4, N.A4
  ];

  const BOSS_BASS = [
    N.D3, N.D3, N.F3, N.D3,  N.G3, N.D3, N.F3, N.E3,
    N.Bb2, N.Bb2, N.D3, N.Bb2, N.C3, N.C3, N.A2, N.C3
  ];
  const BOSS_LEAD = [
    N.D5, N._, N.D5, N.F5,  N.G5, N._, N.F5, N.E5,
    N.D5, N._, N.C5, N.D5,  N.A5, N._, N.G5, N.F5
  ];

  function getActiveTrack() {
    return trackOverride === 'auto' ? dynamicMode : trackOverride;
  }

  function scheduleMusicTick() {
    if (musicTimer) clearInterval(musicTimer);
    const mode = getActiveTrack();
    const stepMs = mode === 'boss' ? 102 : (mode === 'combat' ? 114 : (mode === 'synthwave' ? 122 : 148));
    musicTimer = setInterval(() => {
      if (!musicEnabled || musicVolume <= 0.001 || !ctx || ctx.state !== 'running') return;
      const cur = getActiveTrack();

      if (cur === 'menu') {
        const s = musicStep % 16;
        const b = MENU_BASS[s];
        const a = MENU_ARP[s];
        if (b) mTone(b, 'triangle', 0.22, 0.36);
        if (a && s % 2 === 0) mTone(a, 'triangle', 0.14, 0.20);
        else if (a) mTone(a, 'sine', 0.11, 0.14);
        if (s % 4 === 0) mKick(0.35);
        if (s % 4 === 2) mHat(0.08);
        if (s === 4 || s === 12) mSnare(0.14);
      } else if (cur === 'synthwave') {
        const s32 = musicStep % 32;
        if (s32 % 4 === 0) mKick(0.55);
        if (s32 % 8 === 4) mSnare(0.24);
        if (s32 % 2 === 1) mHat(0.09);
        const b = SYNTH_BASS[s32];
        const a = SYNTH_ARP[s32];
        const l = SYNTH_LEAD[s32];
        if (b) mTone(b, 'sawtooth', 0.12, 0.24);
        if (a) mTone(a, 'triangle', 0.11, 0.13);
        if (l) {
          mTone(l, 'sawtooth', 0.24, 0.16, 6);
          mTone(l, 'triangle', 0.24, 0.12, -6);
        }
      } else if (cur === 'combat') {
        const s32 = musicStep % 32;
        const phraseB = Math.floor(musicStep / 32) % 2 === 1;
        const b = COMBAT_BASS[s32];
        const lead = (phraseB ? COMBAT_LEAD_B : COMBAT_LEAD_A)[s32];
        if (s32 % 4 === 0) mKick(0.52);
        if (s32 % 8 === 4) mSnare(0.22);
        if (s32 % 2 === 1) mHat(0.09);
        if (b) mTone(b, 'sawtooth', 0.14, 0.24);
        if (s32 % 8 === 0) {
          const ch = COMBAT_CHORDS[Math.floor(s32 / 8) % 4];
          ch.forEach((f) => mTone(f, 'triangle', 0.34, 0.10));
        }
        if (lead) {
          mTone(lead, 'square', 0.17, 0.18);
          mTone(lead * 0.5, 'triangle', 0.16, 0.10, 4);
        }
      } else {
        const s = musicStep % 16;
        const b = BOSS_BASS[s];
        const l = BOSS_LEAD[s];
        if (s % 4 === 0 || s === 14) mKick(0.58);
        if (s % 8 === 4) mSnare(0.26);
        mHat(s % 2 === 0 ? 0.07 : 0.12);
        if (b) mTone(b, 'sawtooth', 0.11, 0.26);
        if (l) {
          mTone(l, 'square', 0.15, 0.20);
          mTone(l * 1.5, 'sawtooth', 0.12, 0.10, -5);
        }
      }

      musicStep++;
    }, stepMs);
  }

  function startMusic() {
    ensureCtx();
    if (!musicTimer) scheduleMusicTick();
  }

  function setMusicMode(mode) {
    dynamicMode = mode;
    if (musicEnabled && ctx) scheduleMusicTick();
  }

  window.MM.Audio = {
    SFX,
    isSfxEnabled: () => sfxEnabled,
    isMusicEnabled: () => musicEnabled,
    getSfxVolume: () => sfxVolume,
    getMusicVolume: () => musicVolume,
    getTrackOverride: () => trackOverride,
    setSfxVolume(v) {
      sfxVolume = Math.max(0, Math.min(1, Number(v) || 0));
      if (sfxVolume > 0) sfxEnabled = true;
      applyVolumes();
      saveMixer();
    },
    setMusicVolume(v) {
      musicVolume = Math.max(0, Math.min(1, Number(v) || 0));
      if (musicVolume > 0 && !musicEnabled) { musicEnabled = true; startMusic(); }
      applyVolumes();
      saveMixer();
    },
    setTrackOverride(mode) {
      trackOverride = mode || 'auto';
      saveMixer();
      if (musicEnabled && ctx) scheduleMusicTick();
    },
    toggleSfx() {
      sfxEnabled = !sfxEnabled;
      applyVolumes();
      saveMixer();
      if (sfxEnabled) SFX.click();
      return sfxEnabled;
    },
    toggleMusic() {
      musicEnabled = !musicEnabled;
      applyVolumes();
      saveMixer();
      if (musicEnabled) startMusic();
      return musicEnabled;
    },
    setMusicMode,
    getRecordAudioStream() {
      const c = ensureCtx();
      if (!c || !masterGain || typeof c.createMediaStreamDestination !== 'function') return null;
      if (!recordDest) {
        recordDest = c.createMediaStreamDestination();
        masterGain.connect(recordDest);
      }
      return recordDest.stream;
    },
    unlock() {
      ensureCtx();
      applyVolumes();
      if (musicEnabled && !musicTimer) startMusic();
    }
  };
})();
