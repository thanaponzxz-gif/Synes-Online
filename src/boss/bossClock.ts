// The crab boss's picture clock (DES-010 §3.3). Pure: no engine, no DOM, nothing written back to the sim.
// It is fed one snapshot of the boss actor and of the telegraphs after EVERY sim step, keeps a short history, and answers
// "which clips, at what clip time and weight, at render tick r" (r = world.tick - 2 + alpha, the same moment the view draws
// positions at). No event or field was added to shared/ or the server for it.
// - telegraph deadlines are counted the way the sim counts them: how many times TICK is subtracted until the timer is <= 0
//   (never round / ceil of seconds); an impact is confirmed only when a telegraph was there before a step, gone after it, and
//   its timer really ran out on that step. A telegraph that vanished any other way is a cancel and makes no impact.
// - sweep / slam: template ticks 0 -> 30 from the telegraph's start to its real impact tick, held at 30 until the actor
//   recovers, then 30 -> end over the real recover state. charge_windup releases exactly on the real entry into `charge`.
// - priority is the sim's own single state (dead > stunned > roar/intro > charge > windup/cast/recover > walk/idle).
import { TICK } from '../../shared/data/tuning.ts';
import { FPS } from './spec.ts';
import type { BossPose } from './loader.ts';

/** how many sim steps until a timer that is counted down by TICK per step is <= 0 (DES-010 §3.3 item 3: counted, not rounded) */
export function stepsLeft(left: number): number { let n = 0; for (; left > 0; n++) left -= TICK; return n; }

export interface TeleSnap { id: number; owner: number; atk: string; shape: string; t: number; total: number; x: number; z: number; dx: number; dz: number; r: number; w: number; cos: number; }
export interface BossSnap {
  /** the sim tick just processed (world.tick - 1 after the step) */
  tick: number;
  id: number; alive: boolean; started: boolean; state: string; st: number; atk: string; x: number; z: number;
  teles: readonly TeleSnap[];
}
export interface TeleTrack extends Omit<TeleSnap, 't'> {
  startTick: number;
  /** predicted while pending; the real tick once `impact` is true */
  impactTick: number;
  /** null = still counting down, true = ran out (the attack landed on impactTick), false = cancelled on endTick */
  impact: boolean | null;
  endTick: number;
  left: number;
}
interface Seg { start: number; end: number; predEnd: number; state: string; atk: string; tele: number; kind: 'loco' | 'action' | 'stun' | 'down'; prev: Seg | null; }
interface Rec { tick: number; walk: number; charge: number; moving: boolean; dist: number; state: string; x: number; z: number; }

/** fades in ticks (§3.3 item 10) */
export const BOSS_FADE = { loco: 3, enter: 1.5, stun: 1, down: 1, back: 2.4 } as const;
/** §3.2: metres walked per walk cycle (2.0 m/s x 24 ticks) and per charge cycle (15 m/s x 12 ticks) */
const WALK_CYCLE_M = 2.0 * (24 / FPS), CHARGE_CYCLE_M = 15 * (12 / FPS);
const KEEP_TICKS = 96, TELEPORT_M = 2.5;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const prog = (r: number, a: number, b: number) => (b - a <= 0 ? 1 : clamp01((r - a) / (b - a)));

export class BossClock {
  private segs: Seg[] = [];
  private recs: Rec[] = [];
  private tracks = new Map<number, TeleTrack>();
  private last: BossSnap | null = null;

  reset() { this.segs = []; this.recs = []; this.tracks.clear(); this.last = null; }

  /** once after every sim step. `hardReset`: a respawn / new round happened on this step: nothing pending may land afterwards */
  observe(s: BossSnap, hardReset = false) {
    if (hardReset || (this.last && s.tick <= this.last.tick)) this.reset();
    const prev = this.last;
    // ---- telegraphs
    const seen = new Set<number>();
    for (const t of s.teles) {
      seen.add(t.id);
      const n = stepsLeft(t.t), tr = this.tracks.get(t.id);
      if (tr) { tr.left = t.t; tr.impactTick = s.tick + n; continue; }
      const impactTick = s.tick + n;
      this.tracks.set(t.id, { id: t.id, owner: t.owner, atk: t.atk, shape: t.shape, total: t.total, x: t.x, z: t.z, dx: t.dx, dz: t.dz, r: t.r, w: t.w, cos: t.cos,
        startTick: impactTick - stepsLeft(t.total) + 1, impactTick, impact: null, endTick: Infinity, left: t.t });
    }
    for (const tr of this.tracks.values()) {
      if (tr.impact === null && !seen.has(tr.id)) {
        tr.impact = tr.left - TICK <= 0; tr.endTick = s.tick;
        if (tr.impact) tr.impactTick = s.tick;
      }
      if (tr.impact !== null && s.tick - tr.endTick > KEEP_TICKS) this.tracks.delete(tr.id);
    }
    // ---- state history
    const state = !s.alive ? 'dead' : !s.started ? 'idle' : s.state, top = this.segs[this.segs.length - 1];
    if (!top || top.state !== state || top.atk !== s.atk) {
      if (top) top.end = s.tick;
      let tele = -1;
      if (state === 'windup') for (const t of s.teles) if (t.owner === s.id && t.atk === s.atk && t.id > tele) tele = t.id;
      const kind = state === 'dead' ? 'down' : state === 'stunned' ? 'stun' : state === 'idle' || state === 'approach' ? 'loco'
        : state === 'recover' && !(top && (top.state === 'windup' || top.state === 'cast') && top.atk === s.atk && top.atk !== 'charge') ? 'loco' : 'action';
      this.segs.push({ start: s.tick, end: Infinity, predEnd: s.tick + stepsLeft(s.st), state, atk: s.atk, tele, kind, prev: top ?? null });
    }
    // ---- distance really moved (the clips have no root motion: cadence comes from here)
    const d0 = prev ? Math.hypot(s.x - prev.x, s.z - prev.z) : 0, dist = d0 > TELEPORT_M ? 0 : d0, lr = this.recs[this.recs.length - 1];
    this.recs.push({ tick: s.tick, dist, state, x: s.x, z: s.z, moving: state === 'approach' && dist > 1e-6,
      walk: (lr?.walk ?? 0) + (state === 'approach' ? dist / WALK_CYCLE_M : 0), charge: (lr?.charge ?? 0) + (state === 'charge' ? dist / CHARGE_CYCLE_M : 0) });
    while (this.recs.length > KEEP_TICKS) this.recs.shift();
    while (this.segs.length > 2 && this.segs[1].start < s.tick - KEEP_TICKS) { this.segs.shift(); this.segs[0].prev = null; }
    this.last = s;
  }

  /** telegraphs seen so far and what became of them (kept for a while after they end), for the effects */
  teleTracks(): IterableIterator<TeleTrack> { return this.tracks.values(); }
  /** per-step records (oldest first): distance moved and the state on each processed tick */
  records(): readonly Readonly<Rec>[] { return this.recs; }
  /** the state history kept (oldest first): each state and the processed tick it began on */
  segments(): readonly { readonly start: number; readonly state: string; readonly atk: string }[] { return this.segs; }
  /** the sim state shown at render tick r, and the tick it began on */
  stateAt(r: number): { state: string; atk: string; start: number } | null {
    for (let i = this.segs.length - 1; i >= 0; i--) if (this.segs[i].start <= r || i === 0) return { state: this.segs[i].state, atk: this.segs[i].atk, start: this.segs[i].start };
    return null;
  }

  private cum(r: number, key: 'walk' | 'charge'): number {
    const R = this.recs; if (!R.length) return 0;
    const i = Math.floor(r) - R[0].tick;
    if (i < 0) return R[0][key];
    if (i >= R.length - 1) return R[R.length - 1][key];
    return R[i][key] + (R[i + 1][key] - R[i][key]) * (r - Math.floor(r));
  }
  /** share of the last BOSS_FADE.loco ticks before r in which the boss really walked (0 = standing, 1 = walking) */
  private walkWeight(r: number): number {
    const R = this.recs; if (!R.length) return 0;
    let sum = 0;
    for (const rec of R) {
      if (!rec.moving) continue;
      // the step from tick-1 to tick covers render time (tick-1, tick]
      const a = Math.max(rec.tick - 1, r - BOSS_FADE.loco), b = Math.min(rec.tick, r);
      if (b > a) sum += b - a;
    }
    return clamp01(sum / BOSS_FADE.loco);
  }

  /** the pose of one segment at render tick r, as clip ticks (weights sum to 1) */
  private pose(g: Seg, r: number): { clip: string; k: number; w: number }[] {
    const E = Number.isFinite(g.end) ? g.end : g.predEnd;
    const loco = () => { const w = this.walkWeight(r); return [{ clip: 'idle', k: ((r % 48) + 48) % 48, w: 1 - w }, { clip: 'walk', k: (((this.cum(r, 'walk') % 1) + 1) % 1) * 24, w }]; };
    const windupK = (seg: Seg) => {
      const tr = this.tracks.get(seg.tele);
      return 30 * (tr ? prog(r, tr.startTick, tr.impactTick) : prog(r, seg.start, Number.isFinite(seg.end) ? seg.end : seg.predEnd));
    };
    switch (g.kind) {
      case 'down': return [{ clip: 'down', k: Math.min(12, Math.max(0, r - g.start)), w: 1 }];
      case 'stun': return [{ clip: 'stunned', k: (((r - g.start) % 30) + 30) % 30, w: 1 }];
      case 'loco': return loco();
    }
    if (g.state === 'intro' || g.state === 'roar') return [{ clip: 'roar', k: 33 * prog(r, g.start, E), w: 1 }];
    if (g.state === 'charge') return [{ clip: 'charge', k: (((this.cum(r, 'charge') % 1) + 1) % 1) * 12, w: 1 }];
    if (g.state === 'cast') return [{ clip: 'shard_cast', k: 27 * prog(r, g.start, E), w: 1 }];
    if (g.state === 'windup') {
      if (g.atk === 'charge') return [{ clip: 'charge_windup', k: 30 * prog(r, g.start, E), w: 1 }];
      if (g.atk === 'sweep' || g.atk === 'slam') return [{ clip: g.atk, k: windupK(g), w: 1 }];
    }
    if (g.state === 'recover' && g.prev) {
      if (g.prev.state === 'cast') return [{ clip: 'shard_cast', k: 27 + 18 * prog(r, g.start, E), w: 1 }];
      if (g.atk === 'sweep' || g.atk === 'slam') {
        const len = g.atk === 'sweep' ? 51 : 60, tr = this.tracks.get(g.prev.tele);
        // never past the impact pose before the telegraph's real impact tick, whatever the actor's own timer says
        const from = Math.max(g.start, tr && tr.impact !== false ? tr.impactTick : g.start);
        return [{ clip: g.atk, k: r < from ? windupK(g.prev) : 30 + (len - 30) * prog(r, from, Math.max(E, from)), w: 1 }];
      }
    }
    return loco(); // a state the design gives no clip (e.g. an old-ruleset state): stand / walk
  }

  /** clips, clip times (seconds) and weights at render tick r; [] before the first snapshot */
  sample(r: number): BossPose[] {
    if (!this.segs.length) return [];
    const live = this.segs.filter((g, i) => g.start <= r || i === 0);
    const out = new Map<string, { time: number; weight: number; best: number }>();
    let remaining = 1;
    for (let i = live.length - 1; i >= 0 && remaining > 1e-6; i--) {
      const g = live[i], below = live[i - 1];
      const fade = !below ? 0 : g.kind === 'down' ? BOSS_FADE.down : g.kind === 'stun' ? BOSS_FADE.stun : g.kind === 'loco' ? (below.kind === 'loco' ? 0 : BOSS_FADE.back) : BOSS_FADE.enter;
      const W = remaining * (fade <= 0 ? 1 : clamp01((r - g.start) / fade));
      remaining -= W;
      if (W <= 0) continue;
      for (const p of this.pose(g, r)) {
        const w = p.w * W; if (w <= 0) continue;
        const o = out.get(p.clip); // the same clip from two segments: both weights, the heavier one's time
        if (!o) out.set(p.clip, { time: p.k / FPS, weight: w, best: w });
        else { o.weight += w; if (w > o.best) { o.best = w; o.time = p.k / FPS; } }
      }
    }
    return [...out].map(([clip, o]) => ({ clip, time: o.time, weight: o.weight }));
  }
}
