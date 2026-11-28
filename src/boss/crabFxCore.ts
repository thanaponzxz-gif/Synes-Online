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

/** numbers the design gives (DES-010 §4.2). `low` = the Low column */
export const CRAB_FX = {
  sweep: { y: 0.12, width: 0.06, alpha: 0.45, ticks: 4, sparks: 4, low: { sparks: 2, ticks: 3 } },
  slam: { width: 0.10, alpha: 0.45, ticks: 5, debris: 8, maxH: 0.45, low: { debris: 4, ticks: 4 } },
  charge: { everyM: 0.75, maxH: 0.30, ticks: 8, max: 12, low: { everyM: 1.5, ticks: 6, max: 6 } },
  shard: { fromY: 5.5, toY: 0.10, ticks: 6, debris: 3, debrisTicks: 5, low: { ticks: 3, debris: 1, debrisTicks: 3 } },
  roar: { count: 4, ticks: 9 },
  cap: { medium: 32, low: 12 },
  gravity: -9.81,
} as const;
/** numbers the design does not give: team B, temporary, each one is a question to team A (DES-010 §9) */
export const CRAB_FX_TEMP = {
  ringY: 0.12,            // slam ring height (the design gives y only for the sweep arc)
  slamDebrisTicks: 5,     // Medium life of the slam debris (the design gives 4 ticks for Low only)
  sparkM: 0.10, sparkRise: 0.5, // sweep sparks: size, rise in m over their life
  debrisM: 0.16,          // stone debris size
  dustM: 0.20,            // charge dust size
  crystal: [0.34, 1.1, 0.34] as V3, // falling crystal size (the warning circle is r 2.2 or so; this is only the picture)
  shardDebrisM: 0.14, shardDebrisH: 0.35,
  pillar: { count: 6, ticks: 8, maxH: 0.45, spreadM: 1.2 }, // pillar-break debris (design: "half on Low")
  roarM: 0.12, roarRise: 0.7, roarSpread: 0.45,
} as const;

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
  draw(r: number, clock: BossClock, lines: CrabFxLines | null, put: CrabFxPut, shell: V3 | null) {
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
          this.add(0, tr.x, y + T.crystal[1] / 2, tr.z, T.crystal[0], T.crystal[1], T.crystal[2], hash01(tr.id, 1) * TAU, P.violet);
        }
        const n = low ? F.shard.low.debris : F.shard.debris, life = low ? F.shard.low.debrisTicks : F.shard.debrisTicks;
        if (tr.impact === true && age >= 0 && age < life) for (let i = 0; i < n; i++) {
          const ang = hash01(tr.id, 10 + i) * TAU, d = 0.25 + 0.5 * hash01(tr.id, 20 + i) * (age / life), k = 1 - age / life;
          this.add(2, tr.x + Math.sin(ang) * d, arcH(T.shardDebrisH, age / 30) + T.shardDebrisM * 0.5 * k, tr.z + Math.cos(ang) * d, T.shardDebrisM * k, T.shardDebrisM * k, T.shardDebrisM * k, ang, P.violet);
        }
        continue;
      }
      if (tr.impact !== true || age < 0) continue; // never before the tick the warning really ran out
      if (tr.atk === 'sweep') {
        const half = Math.acos(tr.cos > 1 ? 1 : tr.cos < -1 ? -1 : tr.cos), mid = Math.atan2(tr.dx, tr.dz);
        if (age < F.sweep.ticks) band(tr.x, tr.z, tr.r, mid - half, mid + half, F.sweep.width, F.sweep.y, F.sweep.alpha * (1 - age / F.sweep.ticks), 20);
        const n = low ? F.sweep.low.sparks : F.sweep.sparks, life = low ? F.sweep.low.ticks : F.sweep.ticks;
        if (age < life) for (let i = 0; i < n; i++) {
          const ang = mid - half + (2 * half * (i + 0.5)) / n, k = 1 - age / life;
          this.add(1, tr.x + Math.sin(ang) * tr.r, F.sweep.y + T.sparkRise * (age / life), tr.z + Math.cos(ang) * tr.r, T.sparkM * k, T.sparkM * k, T.sparkM * k, ang, P.lumen);
        }
      } else if (tr.atk === 'slam') {
        if (age < F.slam.ticks) band(tr.x, tr.z, tr.r, 0, TAU, F.slam.width, T.ringY, F.slam.alpha * (1 - age / F.slam.ticks), 48); // the whole ring at once, not a travelling wave
        const n = low ? F.slam.low.debris : F.slam.debris, life = low ? F.slam.low.ticks : T.slamDebrisTicks;
        if (age < life) for (let i = 0; i < n; i++) {
          const ang = ((i + hash01(tr.id, i)) / n) * TAU, d = tr.r * (0.55 + 0.4 * hash01(tr.id, 30 + i)), k = 1 - 0.5 * (age / life);
          this.add(2, tr.x + Math.sin(ang) * d, arcH(F.slam.maxH, age / 30) + T.debrisM * 0.5, tr.z + Math.cos(ang) * d, T.debrisM * k, T.debrisM * k, T.debrisM * k, ang * 3, P.stone);
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
        const a = (r - p.tick) / life, s = T.dustM * (0.6 + 0.8 * a) * (1 - a * a);
        this.add(3, p.x + (hash01(p.n, 3) - 0.5) * 0.5, s * 0.5 + (F.charge.maxH - T.dustM) * a, p.z + (hash01(p.n, 4) - 0.5) * 0.5, s, s, s, hash01(p.n, 5) * TAU, P.dust);
      }
    }
    // ---- pillar-break debris (only where a pillar really broke)
    for (const b of this.breaks) {
      const age = r - b.tick, life = T.pillar.ticks, n = low ? T.pillar.count / 2 : T.pillar.count;
      if (age < 0 || age >= life) continue;
      for (let i = 0; i < n; i++) {
        const ang = hash01(b.tick, i) * TAU, d = T.pillar.spreadM * (0.3 + 0.7 * (age / life)) * (0.5 + 0.5 * hash01(b.tick, 40 + i)), k = 1 - 0.5 * (age / life);
        this.add(2, b.x + Math.sin(ang) * d, arcH(T.pillar.maxH, age / 30) + T.debrisM * 0.5, b.z + Math.cos(ang) * d, T.debrisM * k, T.debrisM * k, T.debrisM * k, ang * 2, P.stone);
      }
    }
    // ---- phase 2 roar: four lumen motes at the shell socket (Medium only)
    if (!low && shell) for (const g of clock.segments()) {
      if (g.state !== 'roar') continue;
      const age = r - g.start;
      if (age < 0 || age >= F.roar.ticks) continue;
      for (let i = 0; i < F.roar.count; i++) {
        const ang = ((i + 0.5) / F.roar.count) * TAU, a = age / F.roar.ticks, s = T.roarM * (1 - a);
        this.add(1, shell[0] + Math.sin(ang) * T.roarSpread * (0.4 + a), shell[1] + T.roarRise * a, shell[2] + Math.cos(ang) * T.roarSpread * (0.4 + a), s, s, s, ang, P.lumen);
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
