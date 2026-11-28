// The crab boss's effects (DES-010 §4.2), pure: no engine, no DOM, no random, no state of its own. Everything is derived at
// draw time from the boss clock's history (telegraphs by id and what became of them, distance really moved, state starts) and
// the pillar-break events the sim really sent, so nothing can replay, land after a cancel, or survive a restart of the clock.
// Output: triangles for the one line/ring batch (Medium only) and instances for the one crystal/debris/dust batch.
// The warnings are not drawn here and are never covered: both batches draw under them (renderOrder 5 < 10).
import type { BossClock } from './bossClock.ts';

export type V3 = readonly [number, number, number];
export type C4 = readonly [number, number, number, number];
export interface CrabFxLines { tri(a: V3, b: V3, c: V3, ca: C4, cb: C4, cc: C4): void; }
/** one instance of the shared shard shape: centre, size on each axis (m), turn about Y, colour */
export type CrabFxPut = (x: number, y: number, z: number, sx: number, sy: number, sz: number, yaw: number, color: V3) => void;
export interface CrabFxPal { lumen: V3; violet: V3; stone: V3; dust: V3; }

/** numbers the design gives (DES-010 §4.2 and the round-2 answers §10.4 G1–G13). `low` = the Low column */
export const CRAB_FX = {
  /** G13: line 0.16 m wide, 0.75 -> 0 over 6 ticks, widened for the picture to 1.5 CSS px but never past 0.24 m. G3: sparks 0.10 x 0.035 m, up to 0.50 m, 4 ticks */
  sweep: { y: 0.12, width: 0.16, maxWidth: 0.24, minPx: 1.5, alpha: 0.75, ticks: 6, sparks: 4, sparkTicks: 4, sparkLen: 0.10, sparkWide: 0.035, sparkRise: 0.5, low: { sparks: 2, ticks: 3 } },
  /** G1: ring y 0.12 m. G2: stones 5 / 4 ticks. G3: stone edge 0.16 m, spread 0.55–0.95 of the warning radius */
  slam: { y: 0.12, width: 0.10, alpha: 0.45, ticks: 5, debris: 8, debrisTicks: 5, maxH: 0.45, stoneM: 0.16, spread: [0.55, 0.40] as readonly [number, number], low: { debris: 4, ticks: 4 } },
  charge: { everyM: 0.75, maxH: 0.30, ticks: 8, max: 12, dustM: 0.20, low: { everyM: 1.5, ticks: 6, max: 6 } },
  /** G3: crystal 0.34 x 1.10 x 0.34 m, 5.5 -> 0.10 m is its lower end; pieces 0.14 m, up to 0.35 m */
  shard: { fromY: 5.5, toY: 0.10, ticks: 6, debris: 3, debrisTicks: 5, crystal: [0.34, 1.1, 0.34] as V3, pieceM: 0.14, pieceH: 0.35, low: { ticks: 3, debris: 1, debrisTicks: 3 } },
  /** G4: 6 / 3 stones, 8 ticks, within 1.20 m of the pillar that really broke, up to 0.45 m, edge 0.16 m */
  pillar: { count: 6, lowCount: 3, ticks: 8, maxH: 0.45, spreadM: 1.2, stoneM: 0.16 },
  /** G5: phase-2 roar only: 4 motes, edge 0.12 m, within 0.45 m of the shell socket, rising up to 0.70 m, 9 ticks; none on Low, none on the intro */
  roar: { count: 4, ticks: 9, moteM: 0.12, spreadM: 0.45, riseM: 0.70 },
  cap: { medium: 32, low: 12 },
  gravity: -9.81,
} as const;
/** what the answers still leave to team B (questions in DES-010-teamB): how a piece fades (the instances have no opacity of
 *  their own: they shrink to this share of their size), and how far a piece drifts sideways */
export const CRAB_FX_TEMP = { shrinkTo: 0.5, shardDrift: [0.25, 0.5] as readonly [number, number], dustJitterM: 0.25 } as const;

interface PillarBreak { tick: number; x: number; z: number; }
interface Inst { pri: number; x: number; y: number; z: number; sx: number; sy: number; sz: number; yaw: number; color: V3; }
const KEEP = 40, TAU = Math.PI * 2;
/** a fixed pseudo-random in [0, 1) from two integers (which piece of which effect): the same picture on every run */
export function hash01(a: number, b: number): number {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
/** height of a piece thrown up to `maxH`, `age` seconds after it left the ground, under the picture's gravity */
const arcH = (maxH: number, age: number) => { const v = Math.sqrt(2 * -CRAB_FX.gravity * maxH); return Math.max(0, v * age + 0.5 * CRAB_FX.gravity * age * age); };

export class CrabFxCore {
  low: boolean;
  private pal: CrabFxPal;
  private breaks: PillarBreak[] = [];
  private insts: Inst[] = [];
  /** what the last draw made (QA) */
  last = { lines: 0, instances: 0, dropped: 0 };
  /** the width (m) the last sweep line was drawn at (QA) */
  lastSweepWidth = 0;
  constructor(pal: CrabFxPal, low: boolean) { this.pal = pal; this.low = low; }

  reset() { this.breaks = []; }
  /** a pillar really broke on processed tick `tick` (the sim's own event) */
  pillarBreak(tick: number, x: number, z: number) {
    this.breaks.push({ tick, x, z });
    while (this.breaks.length && tick - this.breaks[0].tick > KEEP) this.breaks.shift();
  }

  private add(pri: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, yaw: number, color: V3) {
    this.insts.push({ pri, x, y, z, sx, sy, sz, yaw, color });
  }

  /** r = render tick (world.tick - 2 + alpha). `lines` null = no line batch (Low). `shell` = the shell socket now (world), or null */
  draw(r: number, clock: BossClock, lines: CrabFxLines | null, put: CrabFxPut, shell: V3 | null, pxPerM?: (x: number, y: number, z: number, dx: number, dz: number) => number) {
    const F = CRAB_FX, T = CRAB_FX_TEMP, low = this.low, P = this.pal;
    this.insts.length = 0;
    let nLines = 0;
    const band = (cx: number, cz: number, rad: number, a0: number, a1: number, width: number, y: number, alpha: number, segs: number) => {
      if (!lines || low || alpha <= 0) return;
      const c: C4 = [P.lumen[0], P.lumen[1], P.lumen[2], alpha], ri = rad - width / 2, ro = rad + width / 2;
      for (let i = 0; i < segs; i++) {
        const b0 = a0 + ((a1 - a0) * i) / segs, b1 = a0 + ((a1 - a0) * (i + 1)) / segs;
        const s0 = Math.sin(b0), c0 = Math.cos(b0), s1 = Math.sin(b1), c1 = Math.cos(b1);
        const A: V3 = [cx + s0 * ri, y, cz + c0 * ri], B: V3 = [cx + s0 * ro, y, cz + c0 * ro], C: V3 = [cx + s1 * ro, y, cz + c1 * ro], D: V3 = [cx + s1 * ri, y, cz + c1 * ri];
        lines.tri(A, B, C, c, c, c); lines.tri(A, C, D, c, c, c); nLines += 2;
      }
    };
    // ---- telegraphs: what really ran out, by id
    for (const tr of clock.teleTracks()) {
      if (tr.impact === false) continue; // cancelled: nothing, at once
      const age = r - tr.impactTick;
      if (tr.atk === 'shard') {
        const fall = low ? F.shard.low.ticks : F.shard.ticks;
        if (age < 0 && age >= -fall) { // the last ticks before the real deadline of this very circle
          const y = F.shard.toY + (F.shard.fromY - F.shard.toY) * (-age / F.shard.ticks > 1 ? 1 : -age / F.shard.ticks);
          this.add(0, tr.x, y + F.shard.crystal[1] / 2, tr.z, F.shard.crystal[0], F.shard.crystal[1], F.shard.crystal[2], hash01(tr.id, 1) * TAU, P.violet);
        }
        const n = low ? F.shard.low.debris : F.shard.debris, life = low ? F.shard.low.debrisTicks : F.shard.debrisTicks;
        if (tr.impact === true && age >= 0 && age < life) for (let i = 0; i < n; i++) {
          const ang = ((i + hash01(tr.id, 10)) / n) * TAU, d = T.shardDrift[0] + T.shardDrift[1] * (age / life), k = 1 - (1 - T.shrinkTo) * (age / life), m = F.shard.pieceM * k;
          this.add(2, tr.x + Math.sin(ang) * d, Math.min(F.shard.pieceH - m, arcH(F.shard.pieceH - F.shard.pieceM, age / 30)) + m / 2, tr.z + Math.cos(ang) * d, m, m, m, ang, P.violet);
        }
        continue;
      }
      if (tr.impact !== true || age < 0) continue; // never before the tick the warning really ran out
      if (tr.atk === 'sweep') {
        const half = Math.acos(tr.cos > 1 ? 1 : tr.cos < -1 ? -1 : tr.cos), mid = Math.atan2(tr.dx, tr.dz);
        if (age < F.sweep.ticks && !low) {
          // G13: if the line would be thinner than 1.5 CSS px on screen, widen the picture of it (never the area that hits), up to 0.24 m
          const px = pxPerM ? pxPerM(tr.x + Math.sin(mid) * tr.r, F.sweep.y, tr.z + Math.cos(mid) * tr.r, Math.sin(mid), Math.cos(mid)) : 0;
          const wide = px > 0 ? Math.min(F.sweep.maxWidth, Math.max(F.sweep.width, F.sweep.minPx / px)) : F.sweep.width;
          this.lastSweepWidth = wide;
          band(tr.x, tr.z, tr.r, mid - half, mid + half, wide, F.sweep.y, F.sweep.alpha * (1 - age / F.sweep.ticks), 20);
        }
        const n = low ? F.sweep.low.sparks : F.sweep.sparks, life = low ? F.sweep.low.ticks : F.sweep.sparkTicks;
        if (age < life) for (let i = 0; i < n; i++) {
          const ang = mid - half + (2 * half * (i + 0.5)) / n, k = 1 - age / life;
          this.add(1, tr.x + Math.sin(ang) * tr.r, F.sweep.sparkLen / 2 + (F.sweep.sparkRise - F.sweep.sparkLen) * (age / life), tr.z + Math.cos(ang) * tr.r, F.sweep.sparkWide * (T.shrinkTo + (1 - T.shrinkTo) * k), F.sweep.sparkLen * (T.shrinkTo + (1 - T.shrinkTo) * k), F.sweep.sparkWide * (T.shrinkTo + (1 - T.shrinkTo) * k), ang, P.lumen);
        }
      } else if (tr.atk === 'slam') {
        if (age < F.slam.ticks) band(tr.x, tr.z, tr.r, 0, TAU, F.slam.width, F.slam.y, F.slam.alpha * (1 - age / F.slam.ticks), 48); // the whole ring at once, not a travelling wave
        const n = low ? F.slam.low.debris : F.slam.debris, life = low ? F.slam.low.ticks : F.slam.debrisTicks;
        if (age < life) for (let i = 0; i < n; i++) {
          // G3: q = (i + 0.5) / N, radius = r x (0.55 + 0.40 q), angles divided evenly round the ring; the same places on every frame
          const q = (i + 0.5) / n, ang = q * TAU, d = tr.r * (F.slam.spread[0] + F.slam.spread[1] * q), k = 1 - (1 - T.shrinkTo) * (age / life), m = F.slam.stoneM * k;
          this.add(2, tr.x + Math.sin(ang) * d, Math.min(F.slam.maxH - m, arcH(F.slam.maxH - F.slam.stoneM, age / 30)) + m / 2, tr.z + Math.cos(ang) * d, m, m, m, ang * 3, P.stone);
        }
      }
    }
    // ---- charge dust: one puff per distance really covered while charging (nothing when blocked or stopped)
    {
      const every = low ? F.charge.low.everyM : F.charge.everyM, life = low ? F.charge.low.ticks : F.charge.ticks, max = low ? F.charge.low.max : F.charge.max;
      const puffs: { tick: number; x: number; z: number; n: number }[] = [];
      let run = 0, n = 0, prev: { x: number; z: number } | null = null;
      for (const rec of clock.records()) {
        if (rec.state !== 'charge') { run = 0; n = 0; prev = rec; continue; }
        if (rec.dist > 1e-6 && prev) {
          const from = run; run += rec.dist;
          for (let k = Math.floor(from / every) + 1; k * every <= run; k++) {
            const f = (k * every - from) / rec.dist;
            puffs.push({ tick: rec.tick - 1 + f, x: prev.x + (rec.x - prev.x) * f, z: prev.z + (rec.z - prev.z) * f, n: n++ });
          }
        }
        prev = rec;
      }
      const live = puffs.filter((p) => r >= p.tick && r - p.tick < life).slice(-max);
      for (const p of live) {
        const a = (r - p.tick) / life, s = F.charge.dustM * (1 - a * a);
        this.add(3, p.x + (hash01(p.n, 3) - 0.5) * 2 * T.dustJitterM, s * 0.5 + (F.charge.maxH - F.charge.dustM) * a, p.z + (hash01(p.n, 4) - 0.5) * 2 * T.dustJitterM, s, s, s, hash01(p.n, 5) * TAU, P.dust);
      }
    }
    // ---- pillar-break debris (only where a pillar really broke)
    for (const b of this.breaks) {
      const age = r - b.tick, life = F.pillar.ticks, n = low ? F.pillar.lowCount : F.pillar.count;
      if (age < 0 || age >= life) continue;
      for (let i = 0; i < n; i++) {
        const ang = ((i + 0.5) / n) * TAU, d = F.pillar.spreadM * (0.3 + 0.7 * (age / life)), k = 1 - (1 - T.shrinkTo) * (age / life), m = F.pillar.stoneM * k;
        this.add(2, b.x + Math.sin(ang) * d, Math.min(F.pillar.maxH - m, arcH(F.pillar.maxH - F.pillar.stoneM, age / 30)) + m / 2, b.z + Math.cos(ang) * d, m, m, m, ang * 2, P.stone);
      }
    }
    // ---- phase 2 roar: four lumen motes at the shell socket (Medium only)
    if (!low && shell) for (const g of clock.segments()) {
      if (g.state !== 'roar') continue;
      const age = r - g.start;
      if (age < 0 || age >= F.roar.ticks) continue;
      for (let i = 0; i < F.roar.count; i++) {
        const ang = ((i + 0.5) / F.roar.count) * TAU, a = age / F.roar.ticks, s = F.roar.moteM * (1 - (1 - T.shrinkTo) * a), d = F.roar.spreadM * (0.4 + 0.6 * a);
        this.add(1, shell[0] + Math.sin(ang) * d, shell[1] + F.roar.riseM * a, shell[2] + Math.cos(ang) * d, s, s, s, ang, P.lumen);
      }
    }
    // ---- budget: when full, dust goes first, then debris, then the decorative sparks; the falling crystals stay
    const cap = low ? F.cap.low : F.cap.medium, all = this.insts;
    let kept = all;
    if (all.length > cap) kept = all.map((x, i) => [x, i] as const).sort((a, b) => a[0].pri - b[0].pri || a[1] - b[1]).slice(0, cap).map((p) => p[0]);
    for (const i of kept) put(i.x, i.y, i.z, i.sx, i.sy, i.sz, i.yaw, i.color);
    this.last = { lines: nLines, instances: kept.length, dropped: all.length - kept.length };
  }
}
