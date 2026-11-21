// exp/stage1-vfx: DES-004 step 5 + DES-006 Q26/Q27 VFX options. Render-only, never touches the sim.
//   ?vfx=A | ?vfx=B  pick an option · no parameter = the current look (old code paths, unchanged) · ?vfx=0 = player skill VFX off (QA)
// ONE axis separates A and B: SIGNAL STRENGTH (size x brightness x duration x piece count). Shapes, palette, render order and
// draw calls are the same in both. A stays close to the current look (quiet; effects never compete with the warnings),
// B pushes readability at 844x390 (bigger, brighter, longer, more pieces).
// Palette only, cool side: lumen / violet / teal, lumen tinted toward white, and blossom shifted toward violet ("orchid",
// hue ~287 deg) so no effect pixel falls in the warm band (hue 320..50 deg, gold included). #FF7A1A / #FF3355 never.
import type { Tier } from './quality.ts';

export type VfxVariant = 'cur' | 'A' | 'B';
export function vfxVariant(search = typeof location === 'undefined' ? '' : location.search): VfxVariant {
  // Default = A (PM pick, stage1 round 4). `?vfx=B` = bold option, `?vfx=cur` = pre-stage1 look (before/after), `?vfx=0` = skill VFX off.
  const v = new URLSearchParams(search).get('vfx');
  return v === 'B' || v === 'b' ? 'B' : v === 'cur' ? 'cur' : 'A';
}

/** Cool effect palette (sRGB hex). LUMEN_HI = lumen 35% + white 65%; ORCHID = blossom/violet 50:50 (hue 287 deg). */
export const FXC = { lumen: 0x5cf2e6, violet: 0xa78bfa, teal: 0x2bb3a3, lumenHi: 0xc6faf6, orchid: 0xd395e2, white: 0xffffff } as const;

export interface VfxStyle {
  id: 'A' | 'B';
  /** Q26 Chime prep cue on the blade (ticks 0..hit): glow sheath half-width (m) / alpha, tip star radius (m) / alpha, motes gathering into the tip */
  chimePrep: { sheathW: number; sheathA: number; tipR: number; tipA: number; motes: number };
  /** Chime burst: ring band width factor, inner echo ring (0/1), shards per tier, shard size (m) */
  chime: { band: number; echo: number; shards: number; shardsLow: number; shardSize: number };
  /** Crescent: inner / outer edge height (m) (tilts the sheet toward the low camera), belly thickness, edge band, visual life
   *  in ticks after the hit, light curtain height above the edge (m, 0 = none), shards per tier */
  crescent: { y0: number; y1: number; thick: number; edge: number; life: number; curtain: number; shards: number; shardsLow: number };
  /** Crystal Break: crystal scale, crystals on Low, shards per tier, crack brightness, glints at the crack tips during prep */
  crystal: { scale: number; lowCrystals: number; shards: number; shardsLow: number; crackA: number; crackGlints: boolean };
  /** Player hit spark: flash height (m; lifted over the hero's head when the hero would hide it), radius (m), rays, life (ticks), burst particles (count, size, up speed), faceted crystal shards on a crystal target */
  hit: { y: number; r: number; rays: number; life: number; parts: number; partSize: number; partUp: number; shards: number; shardSize: number };
  /** Perfect dodge: violet echo ring + extra particles */
  perfect: { echo: boolean; parts: number };
  /** Hero foot ring (was 0.55..0.70 m solid): centre radius, core half-width, soft glow half-width (0 = none), alphas, core tint toward lumen-white */
  ring: { r: number; core: number; glow: number; alpha: number; glowA: number; hi: number };
  /** Ambient crystal sparkles (point sprites, 1 draw call): share of the tier's `particles`, intensity in the meadow per tier
   *  (arena = 1), sprite size and brightness factors */
  sparkles: { share: number; field: Record<Tier, number>; size: number; bright: number };
}

export const VFX_STYLES: Record<'A' | 'B', VfxStyle> = {
  A: {
    id: 'A',
    chimePrep: { sheathW: 0.1, sheathA: 0.55, tipR: 0.34, tipA: 0.95, motes: 0 },
    chime: { band: 0.7, echo: 0, shards: 8, shardsLow: 0, shardSize: 0.11 },
    crescent: { y0: 0.35, y1: 0.7, thick: 1.35, edge: 0.22, life: 9, curtain: 0, shards: 10, shardsLow: 0 },
    crystal: { scale: 1, lowCrystals: 1, shards: 7, shardsLow: 0, crackA: 1, crackGlints: false },
    hit: { y: 1.05, r: 0.36, rays: 4, life: 4, parts: 10, partSize: 1.15, partUp: 3.2, shards: 8, shardSize: 0.18 },
    perfect: { echo: false, parts: 16 },
    ring: { r: 0.62, core: 0.035, glow: 0, alpha: 0.92, glowA: 0, hi: 0 },
    sparkles: { share: 0.5, field: { low: 0, medium: 0.45, high: 0.45 }, size: 1, bright: 1 },
  },
  B: {
    id: 'B',
    chimePrep: { sheathW: 0.16, sheathA: 0.7, tipR: 0.46, tipA: 1, motes: 6 },
    chime: { band: 0.85, echo: 1, shards: 12, shardsLow: 4, shardSize: 0.14 },
    crescent: { y0: 0.3, y1: 0.85, thick: 1.6, edge: 0.26, life: 11, curtain: 0.9, shards: 14, shardsLow: 5 },
    crystal: { scale: 1.25, lowCrystals: 3, shards: 11, shardsLow: 4, crackA: 1.25, crackGlints: true },
    hit: { y: 1.05, r: 0.56, rays: 6, life: 5, parts: 14, partSize: 1.4, partUp: 4.2, shards: 14, shardSize: 0.25 },
    perfect: { echo: true, parts: 24 },
    ring: { r: 0.62, core: 0.03, glow: 0.08, alpha: 0.95, glowA: 0.3, hi: 0.4 },
    sparkles: { share: 1, field: { low: 0.6, medium: 0.8, high: 0.8 }, size: 1.35, bright: 1.35 },
  },
};
