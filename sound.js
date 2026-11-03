/**
 * Procedural Typewriter & Mechanical Keyboard Sound Synthesizer
 * Uses the Web Audio API — 100% self-contained, zero external audio files.
 */

class TypewriterAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.volume = 0.22;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.init();
    this.enabled = !this.enabled;
    return this.enabled;
  }

  /**
   * Procedural keystroke click sound
   * Blends noise burst (key mechanical strike) with resonant sine (body resonance)
   */
  playKeyClick(char = 'a') {
    if (!this.enabled || !this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const isSpace = char === ' ';
      const isPunctuation = ['.', ',', '!', '?', ';', ':'].includes(char);

      // 1. Noise burst (snap/impact transient)
      const bufferSize = this.ctx.sampleRate * 0.025; // 25ms
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      // Bandpass filter to sculpt mechanical plastic/metal feel
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      // Pitch variation per keystroke for human variation
      const pitchJitter = (Math.random() - 0.5) * 400;
      filter.frequency.setValueAtTime(isSpace ? 900 : (2400 + pitchJitter), now);
      filter.Q.setValueAtTime(isSpace ? 2.5 : 4.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(this.volume * (isSpace ? 1.2 : 0.85), now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + (isSpace ? 0.04 : 0.025));

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      whiteNoise.start(now);

      // 2. Body thud / key bottom-out resonance
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      const baseFreq = isSpace ? 160 : (isPunctuation ? 380 : (280 + (Math.random() - 0.5) * 60));
      osc.type = isSpace ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.035);

      oscGain.gain.setValueAtTime(this.volume * (isSpace ? 0.9 : 0.4), now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + (isSpace ? 0.05 : 0.035));

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      // Graceful fallback if audio context fails
    }
  }

  /**
   * Classic Typewriter Bell Chime (Ding!)
   * Triggered when a complete quote/paragraph is done typing.
   */
  playBell() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // Harmonic metallic bell
      const freqs = [1567.98, 2093.00, 3135.96]; // G6 harmonic spectrum
      const gains = [0.15, 0.08, 0.04];

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(this.volume * gains[idx], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8 + idx * 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.2);
      });
    } catch (e) {
      // Audio fallback
    }
  }
}

window.typewriterAudio = new TypewriterAudio();
