// Synthesized SFX (no audio files to download or license). Pitch/colour pairing echoes the Synes "light-song" theme.
export class Sfx {
  ctx: AudioContext | null = null; master: GainNode | null = null; muted = false;
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext; this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.5; this.master.connect(this.ctx.destination);
    } catch { this.ctx = null; }
  }
  setMuted(m: boolean) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.5; }
  suspend() { this.ctx?.suspend().catch(() => {}); }
  resume() { if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {}); }
  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.3, slide = 0, delay = 0) {
    const c = this.ctx, m = this.master; if (!c || !m || this.muted) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(m); o.start(t); o.stop(t + dur + 0.02);
  }
  private noise(dur: number, vol = 0.2, freq = 1200, q = 1, delay = 0) {
    const c = this.ctx, m = this.master; if (!c || !m || this.muted) return;
    const t = c.currentTime + delay, len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = buf; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(m); s.start(t);
  }
  swing(step: number) { this.noise(0.12, 0.25, 2200 + step * 500, 0.8); this.tone(660 + step * 110, 0.08, 'triangle', 0.08); }
  hit(crit: boolean) { this.tone(crit ? 880 : 520, 0.12, 'square', 0.12, 0.5); if (crit) this.tone(1320, 0.25, 'sine', 0.12, 1, 0.03); }
  hurt() { this.tone(180, 0.25, 'sawtooth', 0.18, 0.5); this.noise(0.15, 0.2, 400, 1); }
  dodge() { this.noise(0.18, 0.18, 900, 0.6); }
  perfect() { this.tone(1046, 0.5, 'sine', 0.2); this.tone(1568, 0.6, 'sine', 0.14, 1, 0.05); this.tone(2093, 0.7, 'sine', 0.08, 1, 0.1); }
  warn(heavy: boolean) { this.tone(heavy ? 220 : 440, 0.35, heavy ? 'sawtooth' : 'triangle', 0.09, heavy ? 1.6 : 1.5); }
  skill() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.12, 1, i * 0.04)); }
  heal() { [784, 988, 1175].forEach((f, i) => this.tone(f, 0.35, 'sine', 0.1, 1, i * 0.08)); }
  roar() { this.tone(90, 0.9, 'sawtooth', 0.25, 0.6); this.noise(0.8, 0.25, 300, 0.7); }
  stun() { this.tone(1400, 0.15, 'square', 0.1, 0.4); this.noise(0.4, 0.3, 600, 0.5); }
  gate() { this.tone(392, 0.6, 'sine', 0.15, 1.5); }
  victory() { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.16, 1, i * 0.11)); }
  defeat() { [392, 349, 294, 262].forEach((f, i) => this.tone(f, 0.5, 'triangle', 0.14, 1, i * 0.18)); }
  tap() { this.tone(880, 0.05, 'sine', 0.06); }
}
