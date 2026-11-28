// Synes Online — Seyrin's animation plan (DES-007 rev 4 §8.2–§8.4; DES-009 §3.1 row C, team B Engineering).
// Presentation only: which of the 20 clips plays on the upper and the lower body, at what clip time and weight, chosen from sim
// state alone (the action and its start tick, down / respawn / victory, the distance the sim really moved). Nothing goes back
// to the sim: damage, timing, cancels and input never come from here (§8.1: the mixer is a picture of the sim clock).
//
// Time `t` is in sim ticks: t = T shows the state after sim step T, and between two steps the renderer interpolates (so this
// does too). An action accepted on tick s shows clip tick k at t = s + k, so a hit marker n is on screen on the sim's hit tick.
// Cloth bones and `root` are not part of either group: the cloth solver owns the cloth, and every clip has root motion 0.
import type { NinjaWorld } from '../../shared/sim/ninjaWorld.ts';
import type { NinjaActionKind, SimEvent } from '../../shared/sim/world.ts';
import { FULL_CLIPS, FPS } from './spec.ts';

/** clip length in ticks */
const TICKS: Record<string, number> = Object.fromEntries(FULL_CLIPS.map((c) => [c.name, c.ticks]));
const LIFT = FULL_CLIPS.find((c) => c.name === 'attack_03')!.yLift!;

/** fades in ticks (§8.3): locomotion 0.10 s, into an action 0.05 s, combo chain / dodge / down 1/30 s, back to the stance 0.08 s */
export const FADE = { loco: 3, enter: 1.5, chain: 1, dodge: 1, down: 1, back: 2.4 } as const;
/** §8.2/§8.3: clip reference speeds; walk below 2.0 m/s, run from 2.6, linear between; a step longer than 0.75 m is a teleport (§5.3) */
export const LOCO = { walkRef: 1.5, runRef: 5.2, walkMax: 2.0, runFull: 2.6, teleportM: 0.75, stillM: 1e-6 } as const;

/** the player after one sim step, as the plan needs it */
export interface HeroTick {
  /** the sim tick just stepped */
  tick: number;
  x: number; z: number;
  /** facing after the step (hold-start keeps the pre-dodge facing for the whole dodge) */
  fx: number; fz: number;
  /** the running action; fx/fz = the direction it is locked to (dodge: the dash direction) */
  action: { id: number; kind: NinjaActionKind; step: number; start: number; end: number; fx: number; fz: number } | null;
  down: boolean;
  /** the player took a hit on this tick */
  hurt: boolean;
  won: boolean;
}
export interface ClipPose { clip: string; time: number; weight: number; }
/** per body group the poses sum to weight 1; `additive` = hit_add on chest/neck/head; `pelvisLift` = metres to add to the pelvis */
export interface AnimPlan { upper: ClipPose[]; lower: ClipPose[]; additive: ClipPose[]; pelvisLift: number; }

export function heroTick(w: NinjaWorld, events: readonly SimEvent[]): HeroTick {
  const p = w.player, a = w.ns.action;
  return {
    tick: w.tick - 1, x: p.x, z: p.z, fx: p.fx, fz: p.fz,
    action: a && { id: a.id, kind: a.kind, step: a.step, start: a.start, end: a.end, fx: a.fx, fz: a.fz },
    down: w.ns.down, hurt: events.some((e) => e.t === 'hit' && !e.byPlayer && e.target === p.id), won: w.victory,
  };
}

/** §8.4.2, no trig: F = facing kept before the dodge, R = (Fz, -Fx), D = dash direction; ties go to front/back */
export function dodgeClip(F: readonly [number, number], D: readonly [number, number]): string {
  const f = D[0] * F[0] + D[1] * F[1], r = D[0] * F[1] - D[1] * F[0];
  if (Math.abs(f) >= Math.abs(r)) return f >= 0 ? 'dodge_f' : 'dodge_b';
  return r >= 0 ? 'dodge_r' : 'dodge_l';
}

/** §8.4.2: attack_03's pose-only lift at clip tick k: q = clamp((k-3)/6), 0.12 * 4q(1-q) m */
export function yLiftAt(k: number): number {
  const q = Math.min(1, Math.max(0, (k - LIFT.fromTick) / (LIFT.toTick - LIFT.fromTick)));
  return LIFT.peakM * 4 * q * (1 - q);
}
/** attack_03 ticks 3..9: the lifted lower-body pose wins over walk/run (a 1-tick ramp on each side) */
function liftOverride(k: number): number {
  const a = LIFT.fromTick, b = LIFT.toTick;
  return k <= a - 1 || k >= b + 1 ? 0 : k < a ? k - (a - 1) : k > b ? b + 1 - k : 1;
}

/** team A (DES-009 §10.9 Q4): hit_add is masked to 0 on H..H+1 of a hit / release marker (shadow_thread: its whole dash, 3..9)
 *  with a 1-tick linear fade on each side; the heal of the potion is not a strike */
const HIT_MASK: Record<string, [number, number][]> = Object.fromEntries(FULL_CLIPS.map((c) => {
  const m = c.markers ?? {}, w: [number, number][] = [...(m.hit ?? []), ...(m.emit ?? [])].map((h) => [h, h + 1]);
  if (m.dashStart && m.dashEnd) w.push([m.dashStart[0], m.dashEnd[m.dashEnd.length - 1] + 1]);
  return [c.name, w];
}));
function hitMask(clip: string, k: number): number {
  let m = 1;
  for (const [a, b] of HIT_MASK[clip] ?? []) m = Math.min(m, Math.min(1, Math.max(0, a - k, k - b)));
  return m;
}

const SKILL_CLIP: Record<string, string> = {
  echo_needle: 'skill_echo_needle', shadow_thread: 'skill_shadow_thread', resonant_knot: 'skill_resonant_knot', lumen_loom: 'ult_lumen_loom', potion: 'potion',
};
const STAND = ['idle', 'ready', 'walk', 'run'] as const;
type Weights = [number, number, number, number];

interface LocoRec { tick: number; w: Weights; target: Weights; phase: number; rate: number; }
type SegKind = 'loco' | 'action' | 'down' | 'respawn' | 'victory';
interface Seg {
  kind: SegKind; clip: string; start: number; fade: number;
  /** the clip stops advancing here (cancelled / cut) */
  freeze: number;
  /** upper-body clip over locomotion legs (combo, potion) */
  masked: boolean;
  /** presentation-only clips end by themselves on this tick */
  ends: number;
}

function toward(w: Weights, target: Weights, step: number): Weights {
  let m = 0;
  for (let i = 0; i < 4; i++) m = Math.max(m, Math.abs(target[i] - w[i]));
  if (m <= step + 1e-12) return [...target];
  const f = step / m;
  return w.map((x, i) => x + (target[i] - x) * f) as Weights;
}
const frac = (x: number) => x - Math.floor(x);
/** clip tick of an action / down / victory segment at t (held at its freeze and its last frame) */
const clipTick = (g: Seg, t: number) => Math.min(TICKS[g.clip], Math.max(0, Math.min(t, g.freeze) - g.start));

export class HeroAnimator {
  private recs: LocoRec[] = [];
  private segs: Seg[] = [];
  private last: HeroTick | null = null;
  private actId = -1;
  private actEnd = 0;
  /** stance after an action is `ready` until the player walks (team B reading, DES-009 §10.8) */
  private ready = false;
  private isDown = false;
  private won = false;
  private hurtAt = -Infinity;
  private liftCut: { at: number; y: number } | null = null;

  reset(): void {
    this.recs = []; this.segs = []; this.last = null; this.actId = -1; this.actEnd = 0;
    this.ready = false; this.isDown = false; this.won = false; this.hurtAt = -Infinity; this.liftCut = null;
  }

  observe(s: HeroTick): void {
    const T = s.tick, prev = this.last;
    // ---- the legs: speed from the distance the sim really walked this tick
    // (no walking from the victory tick on: the stance after the victory clip is ready and the cadence stops, team A Q1)
    const walks = !s.won && !this.won && !s.down && !this.isDown && (!s.action || s.action.kind === 'attack' || s.action.kind === 'potion');
    let v = 0;
    if (prev && walks) { const d = Math.hypot(s.x - prev.x, s.z - prev.z); if (d <= LOCO.teleportM) v = d * FPS; }
    const moving = v > LOCO.stillM * FPS;
    if (moving && !s.action) this.ready = false;

    // ---- segments (priority: down > dodge > skill / ult / combo > potion > locomotion; victory ends the run)
    if (!this.segs.length) this.segs.push(this.seg('loco', '', T, 0));
    if (s.won && !this.won) {
      this.won = true; this.cut(T); this.ready = true;
      this.push(this.seg('victory', 'victory', T, FADE.enter, { ends: T + TICKS.victory }));
    } else if (s.down) {
      if (!this.isDown) { this.isDown = true; this.cut(T); this.actId = -1; this.push(this.seg('down', 'down', T, FADE.down)); }
    } else {
      if (this.isDown) { // respawned at the checkpoint: snap (it is a teleport), then stand
        this.isDown = false; this.ready = false; this.liftCut = null;
        this.push(this.seg('respawn', 'respawn', T, 0, { ends: T + TICKS.respawn }));
      }
      const a = s.action;
      if (a && a.id !== this.actId) {
        if (this.actId >= 0 && T < this.actEnd) this.cut(T); // a dodge cancelled the running action
        const chain = a.kind === 'attack' && a.step > 0;
        const clip = a.kind === 'attack' ? `attack_0${a.step + 1}` : a.kind === 'dodge' ? dodgeClip([s.fx, s.fz], [a.fx, a.fz]) : SKILL_CLIP[a.kind];
        const fade = a.kind === 'dodge' ? FADE.dodge : chain ? FADE.chain : FADE.enter;
        this.push(this.seg('action', clip, a.start, fade, { masked: a.kind === 'attack' || a.kind === 'potion' }));
        this.actId = a.id; this.actEnd = a.start + a.end; this.ready = true;
      } else if (!a && this.actId >= 0) { // ended by itself: back to the stance / the legs
        this.push(this.seg('loco', '', this.actEnd, FADE.back));
        this.actId = -1;
      } else if (!a && moving) { // walking cuts a respawn at once
        const top = this.segs[this.segs.length - 1];
        if (top.kind === 'respawn' && T < top.ends) this.push(this.seg('loco', '', T, FADE.loco));
      }
    }
    if (s.hurt) this.hurtAt = T;

    // ---- locomotion weights (idle, ready, walk, run) and the shared cadence phase
    const target: Weights = [0, 0, 0, 0];
    let rate = 0;
    if (moving) {
      const r = v <= LOCO.walkMax ? 0 : v >= LOCO.runFull ? 1 : (v - LOCO.walkMax) / (LOCO.runFull - LOCO.walkMax);
      target[2] = 1 - r; target[3] = r;
      rate = (1 - r) * (v / LOCO.walkRef) / (TICKS.walk / FPS) + r * (v / LOCO.runRef) / (TICKS.run / FPS);
    } else target[this.ready ? 1 : 0] = 1;
    const pr = this.recs[this.recs.length - 1];
    const w = pr ? toward(pr.w, target, 1 / FADE.loco) : [...target] as Weights;
    this.recs.push({ tick: T, w, target, phase: (pr?.phase ?? 0) + rate / FPS, rate });
    if (this.recs.length > 120) this.recs.splice(0, this.recs.length - 120);
    if (this.segs.length > 12) this.segs.splice(0, this.segs.length - 12);
    this.last = s;
  }

  sample(t: number): AnimPlan {
    const out: AnimPlan = { upper: [], lower: [], additive: [], pelvisLift: 0 };
    if (!this.recs.length) return out;
    const rec = this.locoAt(t);
    const live = this.segs.filter((g) => g.start <= t);
    if (!live.length) live.push(this.segs[0]);
    const top = live[live.length - 1];
    if (top.ends <= t) live.push(this.seg('loco', '', top.ends, FADE.back)); // respawn / victory played out
    let remaining = 1, mask = 1;
    for (let i = live.length - 1; i >= 0 && remaining > 0; i--) {
      const g = live[i];
      const ramp = i === 0 || g.fade <= 0 ? 1 : Math.min(1, (t - g.start) / g.fade);
      const W = remaining * ramp;
      remaining -= W;
      if (W > 0) { this.expand(g, W, t, rec, out); if (g.kind === 'action') mask = Math.min(mask, hitMask(g.clip, clipTick(g, t))); }
    }
    if (live[live.length - 1].kind !== 'down' && t >= this.hurtAt && t <= this.hurtAt + TICKS.hit_add && mask > 0) {
      out.additive.push({ clip: 'hit_add', time: (t - this.hurtAt) / FPS, weight: mask }); // the clip clock runs on under the mask
    }
    // §8.4.2: an attack_03 cut mid-lift settles within 2 ticks as yCancel * (1-u)^2 (the fading clip already shows part of it)
    const lc = this.liftCut;
    if (lc && t >= lc.at && t < lc.at + 2) {
      const u = (t - lc.at) / 2, want = lc.y * (1 - u) * (1 - u);
      const shown = out.lower.reduce((s, c) => s + (c.clip === 'attack_03' ? c.weight * yLiftAt(c.time * FPS) : 0), 0);
      out.pelvisLift = Math.max(0, want - shown);
    }
    return out;
  }

  // ---------------------------------------------------------------- internals
  private seg(kind: SegKind, clip: string, start: number, fade: number, o: Partial<Seg> = {}): Seg {
    return { kind, clip, start, fade, freeze: Infinity, masked: false, ends: Infinity, ...o };
  }
  private push(g: Seg) {
    const top = this.segs[this.segs.length - 1];
    if (top && top.ends < g.start) this.segs.push(this.seg('loco', '', top.ends, FADE.back)); // a played-out respawn / victory
    this.segs.push(g);
  }
  /** stop the running clip where it is (a dodge cancel, a fall, the victory) */
  private cut(T: number) {
    const top = this.segs[this.segs.length - 1];
    if (!top || top.kind !== 'action' || top.freeze <= T) return;
    top.freeze = T;
    const k = T - top.start;
    if (top.clip === 'attack_03' && k > LIFT.fromTick && k < LIFT.toTick) this.liftCut = { at: T, y: yLiftAt(k) };
  }

  private locoAt(t: number): LocoRec {
    const R = this.recs, first = R[0], last = R[R.length - 1];
    if (t <= first.tick) return first;
    if (t >= last.tick) { // the world stopped (victory) or the frame runs ahead: keep easing toward the last target
      const dt = t - last.tick;
      return { ...last, w: toward(last.w, last.target, dt / FADE.loco), phase: last.phase + (last.rate * dt) / FPS };
    }
    let i = R.length - 1;
    while (i > 1 && R[i - 1].tick >= t) i--;
    const b = R[i], a = R[i - 1], f = (t - a.tick) / (b.tick - a.tick);
    return { ...b, w: a.w.map((x, j) => x + (b.w[j] - x) * f) as Weights, phase: a.phase + (b.phase - a.phase) * f };
  }

  private expand(g: Seg, W: number, t: number, rec: LocoRec, out: AnimPlan) {
    const add = (group: ClipPose[], clip: string, time: number, weight: number) => {
      if (weight <= 0) return;
      const same = group.find((c) => c.clip === clip && Math.abs(c.time - time) < 1e-12);
      if (same) same.weight += weight; else group.push({ clip, time, weight });
    };
    const locoTime = (i: number) => (i < 2 ? frac(t / TICKS[STAND[i]]) : frac(rec.phase)) * (TICKS[STAND[i]] / FPS);
    if (g.kind === 'loco') {
      for (let i = 0; i < 4; i++) if (rec.w[i] > 0) { const tm = locoTime(i); add(out.upper, STAND[i], tm, W * rec.w[i]); add(out.lower, STAND[i], tm, W * rec.w[i]); }
      return;
    }
    const k = clipTick(g, t), time = k / FPS;
    add(out.upper, g.clip, time, W);
    if (!g.masked) { add(out.lower, g.clip, time, W); return; }
    const keep = 1 - (g.clip === 'attack_03' ? liftOverride(k) : 0); // share of the legs that may walk
    const walk = rec.w[2] * keep, run = rec.w[3] * keep;
    add(out.lower, g.clip, time, W * (1 - walk - run));
    add(out.lower, 'walk', locoTime(2), W * walk);
    add(out.lower, 'run', locoTime(3), W * run);
  }
}
