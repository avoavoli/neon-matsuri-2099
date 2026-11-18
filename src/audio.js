/* ============================================================
   Generative festival audio — no audio files, just weather,
   a distant taiko and a koto with too much reverb.
   ============================================================ */

export class FestivalAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.started = false;
    this.muted = false;
    this.timers = [];
    this.pluckTimer = null;
    this.taikoTimer = null;
    this.lastCar = 0;
  }

  async start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.7;
    this.master.connect(ctx.destination);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.8;
    this.musicBus.connect(this.master);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.85;
    this.sfxBus.connect(this.master);

    this.rain = this.makeRain();
    this.crowd = this.makeCrowd();
    this.drone = this.makeDrone();
    this.delay = this.makeDelay();

    this.started = true;
    this.scheduleTaiko();
    this.schedulePluck();
  }

  async resume() {
    if (this.ctx?.state === 'suspended') {
      try { await this.ctx.resume(); } catch (e) { /* ignore */ }
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(muted ? 0 : 0.7, now, 0.18);
  }

  noiseBuffer(type = 'white', seconds = 2) {
    const ctx = this.ctx;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    if (type === 'brown') {
      let last = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.2;
      }
    } else {
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  loopNoise(buffer, filterType, freq, q, gain) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g);
    src.start();
    return { src, filter, gain: g };
  }

  makeRain() {
    const ctx = this.ctx;
    const white = this.noiseBuffer('white', 3);
    const brown = this.noiseBuffer('brown', 4);
    const hiss = this.loopNoise(white, 'highpass', 900, 0.4, 0.016);
    const body = this.loopNoise(brown, 'lowpass', 1400, 0.5, 0.05);
    // slow movement in the rain
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.055;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.008;
    lfo.connect(lfoGain).connect(hiss.gain.gain);
    lfo.start();
    hiss.gain.connect(this.musicBus);
    body.gain.connect(this.musicBus);
    return { hiss, body };
  }

  makeCrowd() {
    const white = this.noiseBuffer('white', 4);
    const murmur = this.loopNoise(white, 'bandpass', 420, 0.7, 0.014);
    this.loopNoise(white, 'bandpass', 900, 1.1, 0.006);
    // second layer shares source, quietly
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const g = this.ctx.createGain();
    g.gain.value = 0.006;
    lfo.connect(g).connect(murmur.gain.gain);
    lfo.start();
    murmur.gain.connect(this.master);
    return murmur;
  }

  makeDrone() {
    const ctx = this.ctx;
    const bus = ctx.createGain();
    bus.gain.value = 0.028;
    bus.connect(this.musicBus);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;
    filter.Q.value = 1.2;
    filter.connect(bus);
    [55, 82.5, 110.3].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 2 ? 'triangle' : 'sine';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.25 : 0.5;
      osc.connect(g).connect(filter);
      osc.start();
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.03 + i * 0.014;
      const lg = ctx.createGain();
      lg.gain.value = 0.12;
      lfo.connect(lg).connect(g.gain);
      lfo.start();
    });
    // airy shimmer
    const air = ctx.createOscillator();
    air.type = 'sine';
    air.frequency.value = 880;
    const airGain = ctx.createGain();
    airGain.gain.value = 0.0025;
    const airLfo = ctx.createOscillator();
    airLfo.frequency.value = 0.07;
    const airLfoGain = ctx.createGain();
    airLfoGain.gain.value = 0.002;
    airLfo.connect(airLfoGain).connect(airGain.gain);
    air.connect(airGain).connect(this.master);
    air.start();
    airLfo.start();
    return bus;
  }

  makeDelay() {
    const ctx = this.ctx;
    const delay = ctx.createDelay(1.2);
    delay.delayTime.value = 0.42;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.38;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2200;
    delay.connect(filter).connect(feedback).connect(delay);
    delay.connect(wet).connect(this.musicBus);
    return { input: delay, wet };
  }

  pluck(freq, when = 0, gain = 0.05, duration = 2.2) {
    if (!this.started) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2.01;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(3500, t);
    f.frequency.exponentialRampToValueAtTime(900, t + duration);
    osc.connect(g);
    osc2.connect(g);
    g.connect(f);
    f.connect(this.musicBus);
    f.connect(this.delay.input);
    osc.start(t);
    osc.stop(t + duration + 0.1);
    osc2.start(t);
    osc2.stop(t + duration + 0.1);
  }

  taiko(when = 0, gain = 0.11) {
    if (!this.started) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(105, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.28);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc.connect(g).connect(this.musicBus);
    osc.start(t);
    osc.stop(t + 0.7);
    // skin noise
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer('white', 0.3);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 650;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(gain * 0.9, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    noise.connect(filter).connect(ng).connect(this.musicBus);
    noise.start(t);
    noise.stop(t + 0.25);
  }

  scheduleTaiko() {
    if (!this.started) return;
    const beat = () => {
      if (!this.started) return;
      const r = Math.random();
      if (r > 0.35) this.taiko(0, 0.055 + Math.random() * 0.03);
      if (r > 0.8) this.taiko(0.18, 0.025);
      const next = 3400 + Math.random() * 5200;
      this.taikoTimer = window.setTimeout(beat, next);
    };
    this.taikoTimer = window.setTimeout(beat, 2200);
  }

  schedulePluck() {
    if (!this.started) return;
    const scale = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46];
    const loop = () => {
      if (!this.started) return;
      const count = Math.random() > 0.72 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const note = scale[(Math.random() * scale.length) | 0];
        this.pluck(note, i * 0.18, 0.018 + Math.random() * 0.02);
      }
      this.pluckTimer = window.setTimeout(loop, 5000 + Math.random() * 8000);
    };
    this.pluckTimer = window.setTimeout(loop, 4200);
  }

  /* ---------- UI sounds ---------- */

  blip(freq = 720, duration = 0.06, gain = 0.028, type = 'sine') {
    if (!this.started || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.06, t + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g).connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  click() { this.blip(660, 0.045, 0.02, 'triangle'); }

  hover() { this.blip(1180, 0.035, 0.008, 'sine'); }

  stamp() {
    if (!this.started || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    // low thunk
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    osc.connect(g).connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + 0.3);
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer('white', 0.2);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1400;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.035, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    noise.connect(f).connect(ng).connect(this.sfxBus);
    noise.start(t);
    noise.stop(t + 0.16);
    this.success();
  }

  success() {
    if (!this.started || this.muted) return;
    [440, 554.37, 659.25, 880].forEach((f, i) => this.pluck(f, 0.03 + i * 0.09, 0.03, 1.6));
  }

  error() {
    if (!this.started || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.15);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.02, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(g).connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  plop() {
    if (!this.started || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(1300, t + 0.07);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.22);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    osc.connect(g).connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  sizzle() {
    if (!this.started || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer('white', 0.5);
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 3200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.035, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    noise.connect(f).connect(g).connect(this.sfxBus);
    noise.start(t);
    noise.stop(t + 0.4);
  }

  footstep(strength = 1) {
    if (!this.started || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer('white', 0.2);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 780 + Math.random() * 320;
    const g = ctx.createGain();
    const vol = 0.017 * strength;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    noise.connect(f).connect(g).connect(this.sfxBus);
    noise.start(t);
    noise.stop(t + 0.18);
    const splash = ctx.createBufferSource();
    splash.buffer = this.noiseBuffer('white', 0.14);
    const hf = ctx.createBiquadFilter();
    hf.type = 'highpass';
    hf.frequency.value = 2300;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.006 * strength, t + 0.03);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    splash.connect(hf).connect(sg).connect(this.sfxBus);
    splash.start(t);
    splash.stop(t + 0.14);
  }

  whoosh(dir = 1) {
    if (!this.started || this.muted) return;
    const now = performance.now();
    if (now - this.lastCar < 2500) return;
    this.lastCar = now;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer('white', 2.2);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(240, t);
    filter.frequency.exponentialRampToValueAtTime(1600, t + 0.5);
    filter.frequency.exponentialRampToValueAtTime(220, t + 1.7);
    const pan = ctx.createStereoPanner();
    pan.pan.value = dir > 0 ? 0.5 : -0.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
    noise.connect(filter).connect(g).connect(pan).connect(this.master);
    noise.start(t);
    noise.stop(t + 1.8);

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(68, t);
    sub.frequency.exponentialRampToValueAtTime(38, t + 1.2);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(0.04, t + 0.3);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    sub.connect(sg).connect(pan);
    sub.start(t);
    sub.stop(t + 1.5);
  }

  paper() {
    if (!this.started || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer('white', 0.6);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 2400;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    noise.connect(f).connect(g).connect(this.sfxBus);
    noise.start(t);
    noise.stop(t + 0.35);
  }
}
