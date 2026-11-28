// Sounds of the player's skills in `ninja-roam-1` (DES-007 §3.4): made in the client from the brief's numbers, no files.
// One sim event = one sound, played once when the event is observed (never from an animation). A sound changes nothing in the sim.
// The brief gives a length per tone and "attack 5 ms / release 30 ms"; here the length is the whole tone, both ramps inside it
// (so the 20 ms gap of the eaten mark is real silence). Team A can correct this reading (DES-009 §10.15).
import type { SimEvent } from '../../shared/sim/world.ts';

export const TONE = { type: 'triangle', gain: 0.12, attackMs: 5, releaseMs: 30 } as const;
export interface Tone { hz: number; ms: number; delayMs: number; }
const LOOM_HZ = [587.33, 783.99, 1174.66];

export function ninjaTones(events: readonly SimEvent[]): Tone[] {
  const out: Tone[] = [];
  for (const e of events) {
    if (e.t === 'needle-spawn') out.push({ hz: 880, ms: 60, delayMs: 0 });
    else if (e.t === 'mark-consume') out.push({ hz: 660, ms: 40, delayMs: 0 }, { hz: 880, ms: 40, delayMs: 60 });
    else if (e.t === 'perfect') out.push({ hz: 1174.66, ms: 100, delayMs: 0 });
    else if (e.t === 'attack-pulse' && e.kind === 'lumen_loom' && LOOM_HZ[e.pulseIndex]) out.push({ hz: LOOM_HZ[e.pulseIndex], ms: 80, delayMs: 0 });
  }
  return out;
}

/** plays the tones through the game's SFX bus (the master gain of audio.ts), so mute and pause act on them too */
export function playTones(bus: { ctx: AudioContext | null; master: GainNode | null; muted: boolean }, tones: readonly Tone[]) {
  const c = bus.ctx, m = bus.master;
  if (!c || !m || bus.muted) return;
  for (const n of tones) {
    const t0 = c.currentTime + n.delayMs / 1000, len = n.ms / 1000, up = Math.min(TONE.attackMs / 1000, len / 2), down = Math.min(TONE.releaseMs / 1000, len - up);
    const o = c.createOscillator(), g = c.createGain();
    o.type = TONE.type; o.frequency.setValueAtTime(n.hz, t0);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(TONE.gain, t0 + up);
    g.gain.setValueAtTime(TONE.gain, t0 + len - down); g.gain.linearRampToValueAtTime(0, t0 + len);
    o.connect(g); g.connect(m); o.start(t0); o.stop(t0 + len + 0.01);
  }
}
