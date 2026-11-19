// Quality tiers + adaptive resolution. Player can force a tier in Settings; "auto" adapts to measured FPS.
export type Tier = 'low' | 'medium' | 'high';
export type QualityPref = 'auto' | Tier;

export interface QualitySettings { tier: Tier; maxPixelRatio: number; shadows: boolean; decoDensity: number; groundRes: number; particles: number; }

export const TIERS: Record<Tier, QualitySettings> = {
  low: { tier: 'low', maxPixelRatio: 1, shadows: false, decoDensity: 0.45, groundRes: 512, particles: 90 },
  medium: { tier: 'medium', maxPixelRatio: 1.5, shadows: false, decoDensity: 0.8, groundRes: 1024, particles: 160 },
  high: { tier: 'high', maxPixelRatio: 2, shadows: true, decoDensity: 1, groundRes: 1024, particles: 220 },
};

const KEY = 'synes.quality';
export function loadPref(): QualityPref {
  try { const v = localStorage.getItem(KEY) as QualityPref | null; if (v && ['auto', 'low', 'medium', 'high'].includes(v)) return v; } catch { /* storage blocked */ }
  return 'auto';
}
export function savePref(p: QualityPref) { try { localStorage.setItem(KEY, p); } catch { /* ignore */ } }

/** Initial guess from device hints; refined at runtime by AdaptiveResolution. */
export function guessTier(): Tier {
  const nav = navigator as any;
  const mem = nav.deviceMemory as number | undefined;
  const cores = navigator.hardwareConcurrency || 4;
  const mobile = matchMedia('(pointer: coarse)').matches;
  const q = new URLSearchParams(location.search).get('q');
  if (q === 'low' || q === 'medium' || q === 'high') return q;
  if (!mobile) return cores >= 8 ? 'high' : 'medium';
  if ((mem !== undefined && mem <= 3) || cores <= 4) return 'low';
  return 'medium';
}

/** Lowers/raises render scale to hold ~55+ FPS. Returns a new pixel ratio when it changes. */
export class AdaptiveResolution {
  private frames = 0; private acc = 0; private goodWindows = 0;
  ratio: number; fps = 60;
  max: number; min: number;
  constructor(max: number, min = 0.6) { this.max = max; this.min = min; this.ratio = Math.min(max, window.devicePixelRatio || 1); }
  sample(dt: number): number | null {
    this.frames++; this.acc += dt;
    if (this.acc < 1.5) return null;
    this.fps = this.frames / this.acc; this.frames = 0; this.acc = 0;
    if (this.fps < 45 && this.ratio > this.min) { this.ratio = Math.max(this.min, +(this.ratio - 0.15).toFixed(2)); this.goodWindows = 0; return this.ratio; }
    if (this.fps > 58) { if (++this.goodWindows >= 3 && this.ratio < Math.min(this.max, window.devicePixelRatio || 1)) { this.ratio = Math.min(this.max, window.devicePixelRatio || 1, +(this.ratio + 0.1).toFixed(2)); this.goodWindows = 0; return this.ratio; } }
    else this.goodWindows = 0;
    return null;
  }
}
