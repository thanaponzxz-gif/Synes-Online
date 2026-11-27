// The pose viewer's own clock (DES-009 §2.2). The world is never stepped in preview mode.
import { FPS, type ClipSpec } from './spec.ts';

/** One render frame can add at most this much, so a stall is not replayed as a jump through the clip. */
export const PREVIEW_MAX_STEP = 0.1;
const REST = 'idle';

export class PreviewClock {
  paused = false;
  private specs: Map<string, ClipSpec>;
  private clip = REST;
  private time = 0;
  private wasHidden = false;

  constructor(specs: readonly ClipSpec[]) { this.specs = new Map(specs.map((c) => [c.name, c])); }

  select(name: string): void {
    if (!this.specs.has(name)) throw new Error(`unknown clip: ${name}`);
    this.clip = name; this.time = 0;
  }

  /** Adds render time. Nothing is added while paused or hidden, nor by the first frame after being hidden. */
  advance(dt: number, visible: boolean): void {
    if (!visible) { this.wasHidden = true; return; }
    if (this.wasHidden) { this.wasHidden = false; return; }
    if (this.paused || !(dt > 0)) return;
    const spec = this.specs.get(this.clip)!, end = spec.ticks / FPS;
    let t = this.time + Math.min(dt, PREVIEW_MAX_STEP);
    if (spec.loop) { while (t >= end - 1e-9) t -= end; this.time = Math.max(0, t); return; }
    // a one-shot clip: first reach (and show) the end key, then go back to idle on the next frame
    if (this.time >= end - 1e-9) { this.clip = REST; this.time = 0; return; }
    this.time = Math.min(t, end);
  }

  /** Single-tick stepping for marker checks (snaps to the tick grid). */
  step(ticks: number): void {
    const spec = this.specs.get(this.clip)!;
    let n = this.tickAt(this.time) + ticks;
    n = spec.loop ? ((n % spec.ticks) + spec.ticks) % spec.ticks : Math.min(Math.max(n, 0), spec.ticks);
    this.time = n / FPS;
  }

  private tickAt(t: number): number { return Math.floor(t * FPS + 1e-6); }

  sample(): { clip: string; seconds: number; tick: number } {
    return { clip: this.clip, seconds: this.time, tick: this.tickAt(this.time) };
  }
}
