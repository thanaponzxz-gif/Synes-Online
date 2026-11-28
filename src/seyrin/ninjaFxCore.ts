// Player VFX of `ninja-roam-1` (DES-007 §3.4), the part with no engine in it: sim events in, coloured triangles out.
// A picture of the sim only (ADR-002): it reads events and never answers. Every moment comes from an event's own tick and
// every range / angle / width from NINJA in tuning.ts, so the picture cannot drift from what the sim judged.
// Time t is in sim ticks as in animPlan.ts: t = T shows the state after sim step T (the renderer draws t = world.tick - 2 + alpha).
// Sizes the design does not give (FX below, marked "team B, temporary") are questions for team A in DES-009 §10.15.
// All of it goes into ONE batch (ninjaFx.ts): +1 draw call on Medium and on Low, inside the §3.4 ceiling of +5 / +3.
import { NINJA } from '../../shared/data/tuning.ts';
import type { SimEvent } from '../../shared/sim/world.ts';

export type V3 = [number, number, number];
export type C4 = [number, number, number, number];
export interface FxSink { tri(a: V3, b: V3, c: V3, ca: C4, cb: C4, cc: C4): void; }
/** the camera's right / up / forward unit vectors (world) */
export interface FxCam { r: V3; u: V3; f: V3; }
export interface FxPal { lumen: V3; violet: V3; gold: V3; }
/** where an actor is drawn now (interpolated) and the height of its top; null = not on screen */
export type ActorAt = (id: number) => { x: number; z: number; top: number } | null;

export const FX = {
  /** design: gone within 3 ticks. team B, temporary: peak alpha */
  trail: { fadeTicks: 3, alpha: 0.7, maxSamples: 48 },
  /** halfWidth = the sim's needle radius. team B, temporary: length, height above the ground, tail length (two moves), alpha */
  needle: { halfWidth: NINJA.needle.radius, halfLen: 0.3, y: 1.0, tailM: NINJA.needle.stepM * 2, alpha: 0.95 },
  /** design: three violet strokes, lumen dots for 4 ticks. team B, temporary: stroke size / gap / height over the target, dot size and spread */
  mark: { breakTicks: 4, strokeW: 0.07, strokeH: 0.3, gap: 0.15, lift: 0.3, alpha: 0.95, dot: 0.08, spread: 0.3 },
  /** design: two parallel violet lines (Low one), lumen edge at the pulse, fades in 6 ticks. The lines sit on the sim's corridor
   *  edges (halfWidth). team B, temporary: line widths, heights, alpha; each piece fades from its own pulse tick */
  shadow: { fadeTicks: 6, lineW: 0.05, y: 0.06, edgeW: 0.07, edgeY: 0.6, alpha: 0.8 },
  /** design: lumen threads gather into one diagonal edge, gold rim only on a ✦ hit, fades in 8 ticks. The edge is the sim's arc
   *  (range, cone). team B, temporary: thread count, how far apart they start, widths, the heights of the diagonal */
  knot: { fadeTicks: 8, threads: 4, spreadM: 0.9, threadW: 0.035, edgeW: 0.16, rimW: 0.05, rimGap: 0.14, y0: 0.45, y1: 1.35, threadAlpha: 0.55, alpha: 0.95, segs: 10 },
  /** design: thin violet ribbon + lumen edge per pulse (9/15/21), fades 8 ticks after the last. The edge is the sim's arc.
   *  team B, temporary: widths (the third is twice as wide, as its damage is), the diagonal of each pulse, alphas; no debris yet (0 <= 8) */
  loom: { fadeTicks: 8, edgeW: 0.1, ribbonW: 0.2, ribbonGap: 0.2, ribbonAlpha: 0.5, alpha: 0.95, y: [[0.5, 1.3], [1.3, 0.5], [0.9, 0.9]] as [number, number][], segs: 12 },
} as const;

const HIT = NINJA.combo.steps.map((s) => s.hit);
const SQ = Math.SQRT1_2;
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (v: V3): V3 | null => { const l = Math.hypot(v[0], v[1], v[2]); return l > 1e-6 ? [v[0] / l, v[1] / l, v[2] / l] : null; };
const fade = (age: number, ticks: number) => (age < 0 ? 0 : Math.max(0, 1 - age / ticks));

interface Arc { x: number; z: number; fx: number; fz: number; }

export class NinjaFxCore {
  /** the sim tick the events being observed belong to (for the events that do not carry one) */
  private now = 0;
  private combo: { start: number; last: number } | null = null;
  private samples: { t: number; b: V3; p: V3 }[] = [];
  private needles = new Map<number, { x0: number; z0: number; x1: number; z1: number; dx: number; dz: number; at: number; born: number; until: number }>();
  private marks: { target: number; from: number; until: number; broke: boolean; pos: V3 | null }[] = [];
  private segs: { x0: number; z0: number; x1: number; z1: number; at: number }[] = [];
  private knot: (Arc & { id: number; start: number; hit: number; gold: boolean; cancel: number }) | null = null;
  private loom: (Arc & { id: number; pulses: number[]; end: number }) | null = null;

  private pal: FxPal;
  /** Low tier: one shadow line, the mark's dots do not spread */
  low: boolean;
  constructor(pal: FxPal, low: boolean) { this.pal = pal; this.low = low; }

  reset() { this.combo = null; this.samples.length = 0; this.needles.clear(); this.marks.length = 0; this.segs.length = 0; this.knot = null; this.loom = null; }
  /** call with the tick just stepped before `observe` (needle moves and removals carry no tick of their own) */
  tick(t: number) { this.now = t; }

  observe(events: readonly SimEvent[]) {
    for (const e of events) {
      switch (e.t) {
        case 'action-start':
          this.now = Math.max(this.now, e.startTick);
          this.combo = e.kind === 'attack' ? { start: e.startTick, last: e.startTick + HIT[e.step] } : null;
          if (e.kind === 'resonant_knot') this.knot = { id: e.id, x: e.x, z: e.z, fx: e.fx, fz: e.fz, start: e.startTick, hit: Infinity, gold: false, cancel: Infinity };
          if (e.kind === 'lumen_loom') this.loom = { id: e.id, x: e.x, z: e.z, fx: e.fx, fz: e.fz, pulses: [], end: Infinity };
          break;
        case 'action-cancel':
          if (this.combo && e.kind === 'attack') this.combo.last = Math.min(this.combo.last, e.tick);
          if (this.knot && this.knot.id === e.id && this.knot.hit === Infinity) this.knot.cancel = e.tick;
          if (this.loom && this.loom.id === e.id) this.loom.end = Math.min(this.loom.end, e.tick);
          break;
        case 'attack-pulse':
          if (e.kind === 'shadow_thread' && e.ex !== undefined && e.ez !== undefined) {
            if (Math.hypot(e.ex - e.x, e.ez - e.z) > 1e-6) this.segs.push({ x0: e.x, z0: e.z, x1: e.ex, z1: e.ez, at: e.tick });
          } else if (e.kind === 'resonant_knot' && this.knot && this.knot.id === e.actionId) this.knot.hit = e.tick;
          else if (e.kind === 'lumen_loom' && this.loom && this.loom.id === e.actionId) {
            this.loom.pulses[e.pulseIndex] = e.tick;
            if (e.pulseIndex === NINJA.loom.hits.length - 1) this.loom.end = e.tick;
          }
          break;
        case 'hit':
          if (e.byPlayer && e.sourceActionKind === 'resonant_knot' && e.targetStunnedAtHit && this.knot && this.knot.id === e.sourceActionId) this.knot.gold = true;
          break;
        case 'needle-spawn':
          this.needles.set(e.id, { x0: e.x, z0: e.z, x1: e.x, z1: e.z, dx: e.dx, dz: e.dz, at: e.tick, born: e.tick, until: Infinity });
          break;
        case 'needle-move': { const n = this.needles.get(e.id); if (n) { n.x0 = n.x1; n.z0 = n.z1; n.x1 = e.x; n.z1 = e.z; n.at = this.now; } break; }
        case 'needle-despawn': { const n = this.needles.get(e.id); if (n) n.until = this.now; break; }
        case 'mark-set':
          for (const m of this.marks) if (m.until === Infinity) m.until = e.tick; // a refresh: the same strokes go on
          this.marks.push({ target: e.target, from: e.tick, until: Infinity, broke: false, pos: null });
          break;
        case 'mark-expire': case 'mark-consume':
          for (const m of this.marks) if (m.target === e.target && m.until === Infinity) { m.until = e.tick; m.broke = e.t === 'mark-consume'; }
          break;
        case 'player-down':
          if (this.loom && this.loom.end === Infinity) this.loom.end = this.now;
          if (this.knot && this.knot.hit === Infinity) this.knot.cancel = Math.min(this.knot.cancel, this.now);
          if (this.combo) this.combo.last = Math.min(this.combo.last, this.now);
          break;
        case 'respawn': this.reset(); break;
      }
    }
  }

  /** once per rendered frame: where the blade is at render time t (world positions of socket_blade_base / socket_blade_tip) */
  blade(t: number, base: V3, tip: V3) {
    const c = this.combo;
    if (!c || t < c.start || t > c.last) return;
    if (this.samples.length >= FX.trail.maxSamples) this.samples.shift();
    this.samples.push({ t, b: [...base], p: [...tip] });
  }

  draw(sink: FxSink, t: number, cam: FxCam, at: ActorAt) {
    const { lumen, violet, gold } = this.pal;
    const col = (c: V3, a: number): C4 => [c[0], c[1], c[2], a < 0 ? 0 : a > 1 ? 1 : a];
    const quad = (a: V3, b: V3, c: V3, d: V3, ca: C4, cb: C4, cc: C4, cd: C4) => { sink.tri(a, b, c, ca, cb, cc); sink.tri(a, c, d, ca, cc, cd); };
    /** a ribbon from A to B, `w` wide along the unit vector `side` */
    const ribbon = (A: V3, B: V3, side: V3, w: number, c: V3, aA: number, aB: number) =>
      quad(add(A, side, -w / 2), add(A, side, w / 2), add(B, side, w / 2), add(B, side, -w / 2), col(c, aA), col(c, aA), col(c, aB), col(c, aB));
    /** the sim's arc of an area attack: radius R across +-acos(cosHalf), rising from y0 (left) to y1 (right); width half outward, half up */
    const arc = (o: Arc, R: number, cosHalf: number, y0: number, y1: number, w: number, c: V3, a: number, segs: number) => {
      if (a <= 0) return;
      const sinHalf = Math.sqrt(1 - cosHalf * cosHalf), sx = o.fz, sz = -o.fx;
      // points of the chord's arc without trig calls per frame beyond one sqrt each: slerp by normalising the lerp of the two ends
      let prev: V3 | null = null, prevSide: V3 = [0, 1, 0], prevA = 0;
      for (let i = 0; i <= segs; i++) {
        const k = i / segs, s = (2 * k - 1) * sinHalf;
        let dx = o.fx * cosHalf + sx * s, dz = o.fz * cosHalf + sz * s;
        const l = Math.hypot(dx, dz); dx /= l; dz /= l;
        const p: V3 = [o.x + dx * R, y0 + (y1 - y0) * k, o.z + dz * R], side: V3 = [dx * SQ, SQ, dz * SQ];
        const ends = Math.min(1, 4 * k, 4 * (1 - k)) * a; // the ends taper off
        if (prev) quad(add(prev, prevSide, -w / 2), add(prev, prevSide, w / 2), add(p, side, w / 2), add(p, side, -w / 2), col(c, prevA), col(c, prevA), col(c, ends), col(c, ends));
        prev = p; prevSide = side; prevA = ends;
      }
    };

    // ---- combo trail
    const S = this.samples;
    while (S.length && t - S[0].t >= FX.trail.fadeTicks && (S.length < 2 || t - S[1].t >= FX.trail.fadeTicks)) S.shift();
    for (let i = 0; i + 1 < S.length; i++) {
      const a = S[i], b = S[i + 1];
      if (b.t > t) break;
      const fa = fade(t - a.t, FX.trail.fadeTicks) * FX.trail.alpha, fb = fade(t - b.t, FX.trail.fadeTicks) * FX.trail.alpha;
      if (fa <= 0 && fb <= 0) continue;
      // bright at the edge (tip), clear at the base
      quad(a.b, a.p, b.p, b.b, col(lumen, 0), col(lumen, fa), col(lumen, fb), col(lumen, 0));
    }

    // ---- needles
    for (const [id, n] of this.needles) {
      if (t >= n.until) { this.needles.delete(id); continue; }
      if (t < n.born) continue;
      const k = Math.min(1, Math.max(0, t - (n.at - 1))), N = FX.needle;
      const c: V3 = [n.x0 + (n.x1 - n.x0) * k, N.y, n.z0 + (n.z1 - n.z0) * k], d: V3 = [n.dx, 0, n.dz];
      const side = unit(cross(d, cam.f)) ?? cam.r, A = N.alpha;
      const head = add(c, d, N.halfLen), back = add(c, d, -N.halfLen), l = add(c, side, N.halfWidth), r = add(c, side, -N.halfWidth);
      sink.tri(head, l, r, col(lumen, A), col(lumen, A), col(lumen, A));
      sink.tri(back, r, l, col(lumen, A), col(lumen, A), col(lumen, A));
      const flown = Math.hypot(c[0] - n.x0, c[2] - n.z0) + (n.at - 1 - n.born) * NINJA.needle.stepM, tail = Math.min(N.tailM, Math.max(0, flown));
      if (tail > 0.01) sink.tri(add(back, side, N.halfWidth * 0.5), add(back, side, -N.halfWidth * 0.5), add(back, d, -tail), col(lumen, A * 0.5), col(lumen, A * 0.5), col(lumen, 0));
    }

    // ---- sound mark: three strokes, then the dots when it is eaten
    const M = FX.mark;
    for (let i = this.marks.length - 1; i >= 0; i--) {
      const m = this.marks[i];
      if (t < m.from) continue;
      if (t < m.until) {
        const p = at(m.target);
        if (!p) continue;
        m.pos = [p.x, p.top + M.lift, p.z];
        for (let j = -1; j <= 1; j++) {
          const c = add(m.pos, cam.r, j * M.gap);
          ribbon(c, add(c, cam.u, M.strokeH), cam.r, M.strokeW, violet, M.alpha, M.alpha);
        }
        continue;
      }
      const age = t - m.until;
      if (!m.broke || age >= M.breakTicks) { this.marks.splice(i, 1); continue; }
      const p = at(m.target), o: V3 | null = m.pos ?? (p && [p.x, p.top + M.lift, p.z]);
      if (!o) continue;
      const q = age / M.breakTicks, a = (1 - q) * M.alpha, out = this.low ? 0 : q * M.spread;
      for (let j = -1; j <= 1; j++) {
        const c = add(add(add(o, cam.r, j * (M.gap + out)), cam.u, M.strokeH / 2 + out * (j === 0 ? 1 : 0.4)), cam.u, 0);
        const C = col(lumen, a);
        quad(add(c, cam.u, M.dot), add(c, cam.r, M.dot), add(c, cam.u, -M.dot), add(c, cam.r, -M.dot), C, C, C, C);
      }
    }

    // ---- shadow-thread step: the walked pieces
    const SH = FX.shadow, hw = NINJA.shadow.halfWidth;
    while (this.segs.length && t - this.segs[0].at >= SH.fadeTicks) this.segs.shift();
    for (const s of this.segs) {
      const a = fade(t - s.at, SH.fadeTicks) * SH.alpha;
      if (a <= 0) continue;
      const d = unit([s.x1 - s.x0, 0, s.z1 - s.z0])!, side: V3 = [d[2], 0, -d[0]];
      const A: V3 = [s.x0, SH.y, s.z0], B: V3 = [s.x1, SH.y, s.z1];
      if (this.low) ribbon(A, B, side, SH.lineW, violet, a, a);
      else for (const k of [-hw, hw]) ribbon(add(A, side, k), add(B, side, k), side, SH.lineW, violet, a, a);
      ribbon([s.x0, SH.edgeY, s.z0], [s.x1, SH.edgeY, s.z1], side, SH.edgeW, lumen, a, a);
    }

    // ---- resonant knot: threads gather during the prep, one edge at the hit
    const K = FX.knot, kn = this.knot;
    if (kn && t >= kn.start) {
      const R = NINJA.knot.range, cosH = NINJA.knot.cosHalf;
      if (t >= kn.hit) {
        const a = fade(t - kn.hit, K.fadeTicks);
        if (a <= 0) this.knot = null;
        else {
          arc(kn, R - K.edgeW * SQ / 2, cosH, K.y0, K.y1, K.edgeW, lumen, a * K.alpha, K.segs);
          if (kn.gold) for (const g of [-K.rimGap, K.rimGap]) arc(kn, R - K.edgeW * SQ / 2 + g, cosH, K.y0 + g, K.y1 + g, K.rimW, gold, a * K.alpha, K.segs);
        }
      } else if (t >= kn.cancel || t > kn.start + NINJA.knot.end) this.knot = null; // cancelled, or the hit never came
      else {
        const q = Math.min(1, (t - kn.start) / NINJA.knot.hit);
        for (let i = 0; i < K.threads; i++) arc(kn, R - (1 - q) * K.spreadM * ((i + 1) / K.threads), cosH, K.y0, K.y1, K.threadW, lumen, q * K.threadAlpha, K.segs);
      }
    }

    // ---- the ult: one ribbon + edge per pulse the sim made, all fading together after the last
    const L = FX.loom, lm = this.loom;
    if (lm) {
      const a = t < lm.end ? 1 : fade(t - lm.end, L.fadeTicks);
      if (a <= 0) this.loom = null;
      else {
        const R = NINJA.loom.range, cosH = NINJA.loom.cosHalf;
        lm.pulses.forEach((pt, i) => {
          if (pt === undefined || t < pt || pt > lm.end) return;
          const heavy = NINJA.loom.dmg[i] / NINJA.loom.dmg[0], [y0, y1] = L.y[i] ?? L.y[0], w = L.edgeW * heavy;
          arc(lm, R - w * SQ / 2, cosH, y0, y1, w, lumen, a * L.alpha, L.segs);
          arc(lm, R - L.ribbonGap - w, cosH, y0, y1, L.ribbonW * heavy, violet, a * L.ribbonAlpha, L.segs);
        });
      }
    }
  }
}
