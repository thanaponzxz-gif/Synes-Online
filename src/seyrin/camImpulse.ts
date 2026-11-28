// The camera impulse of `ninja-roam-1` (DES-007 §8.4.4), pure: no engine, no DOM, no random. It replaces the old random shake
// in this profile only. Horizontal only, one impulse for the whole screen, 90 ms long, shaped by fixed keys; several events
// inside one impulse keep the age of the first and use the largest amplitude; a new one may start no sooner than 6 ticks
// after the last start, and an event in the quiet time after an impulse is dropped (its effects and results still happen).
// Ages come from the picture's tick + alpha, so a run can be repeated. Nothing here goes into the sim.
import type { SimEvent } from '../../shared/sim/world.ts';

/** CSS px at 844x390 (multiplied by the screen factor S of DES-008 by the caller) */
export const IMPULSE = { hit: 1.0, perfect: 0.8, heavy: 1.5, cap: 1.5, ticks: 2.7 /* 90 ms */, gapTicks: 6 } as const;
/** offset / A at normalised time */
const KEYS: readonly (readonly [number, number])[] = [[0, 0], [0.2, 1], [0.45, -0.5], [0.7, 0.25], [1, 0]];

/** the amplitude an event asks for; 0 = none (combo 1 / 2 and the needle never move the camera) */
export function impulseOf(e: SimEvent, playerId: number, stepOf: (actionId: number) => number | undefined = () => undefined): number {
  if (e.t === 'perfect') return IMPULSE.perfect;
  if (e.t === 'pillar-break') return IMPULSE.heavy; // the boss ran into a pillar
  if (e.t !== 'hit') return 0;
  if (!e.byPlayer) return e.target === playerId ? IMPULSE.heavy : 0; // the player was hit
  const k = e.sourceActionKind;
  if (k === 'shadow_thread' || k === 'resonant_knot' || k === 'lumen_loom') return IMPULSE.hit;
  if (k === 'attack') return stepOf(e.sourceActionId ?? -1) === 2 ? IMPULSE.hit : 0; // only the third step of the combo
  return 0;
}

export class CamImpulse {
  private start = -Infinity;
  private amp = 0;
  /** an event on processed tick `tick` asking for amplitude `a` (px) */
  event(tick: number, a: number) {
    if (a <= 0) return;
    const A = Math.min(IMPULSE.cap, a);
    if (tick - this.start < IMPULSE.ticks) { if (A > this.amp) this.amp = A; return; } // inside the running impulse: same age, larger A
    if (tick - this.start < IMPULSE.gapTicks) return;                                    // the quiet time: dropped
    this.start = tick; this.amp = A;
  }
  reset() { this.start = -Infinity; this.amp = 0; }
  /** horizontal offset in px at render tick t; `on` false (Low / reduced motion) = always 0 */
  offset(t: number, on = true): number {
    if (!on) return 0;
    const q = (t - this.start) / IMPULSE.ticks;
    if (!(q > 0 && q < 1)) return 0;
    for (let i = 1; i < KEYS.length; i++) if (q <= KEYS[i][0]) {
      const [t0, v0] = KEYS[i - 1], [t1, v1] = KEYS[i];
      return this.amp * (v0 + ((v1 - v0) * (q - t0)) / (t1 - t0));
    }
    return 0;
  }
}
