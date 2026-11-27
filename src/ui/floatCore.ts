// DES-008 damage numbers: the DOM-free core. Timing curves (§4), merge / caps / priority (§5) and placement against protected
// screen areas (§6, v2: four patterns, the side lanes searched for free y intervals once, at spawn). The DOM layer (floaters.ts)
// measures glyphs, gathers the protected rects every frame and paints; everything here is plain arithmetic on CSS px and a UI clock
// in ms, so it can be unit-tested without a browser. No Math.random (§4.2).

export type FKind = 'damage' | 'bonus' | 'hurt' | 'heal' | 'perfect' | 'stagger' | 'interrupt' | 'early';
export type FQuality = 'medium' | 'low';
/** k: optional name of a protected area (QA: which kind of area refused or retired a label) */
export interface Rect { l: number; t: number; r: number; b: number; k?: string }

export const NUMERIC: Record<FKind, boolean> = { damage: true, bonus: true, hurt: true, heal: true, perfect: false, stagger: false, interrupt: false, early: false };
/** §5.2: most important first */
export const PRIORITY: readonly FKind[] = ['hurt', 'perfect', 'early', 'heal', 'stagger', 'interrupt', 'bonus', 'damage'];
export const RANK = Object.fromEntries(PRIORITY.map((k, i) => [k, i])) as Record<FKind, number>;

export interface FStyle {
  size: number; weight: number; lineH: number;
  /** gradient top/middle/bottom (numbers) or one solid colour (status words) */
  fill: readonly [string, string, string] | string;
  outer: readonly [number, string]; inner: readonly [number, string] | null;
  /** life in ms: Medium, Low, prefers-reduced-motion */
  life: number; lifeLow: number; lifeReduced: number;
  text?: string;
}
/** §3.1 at 844x390 (S = 1) */
export const STYLE: Record<FKind, FStyle> = {
  damage: { size: 32, weight: 900, lineH: 1, fill: ['#F8FCFF', '#DDD5FF', '#A78BFA'], outer: [8, '#231D42'], inner: [3, '#F7F5FF'], life: 650, lifeLow: 600, lifeReduced: 600 },
  bonus: { size: 40, weight: 900, lineH: 1, fill: ['#FFF3B0', '#FFC857', '#E4B2F4'], outer: [9, '#231D42'], inner: [3, '#FFF9E8'], life: 850, lifeLow: 750, lifeReduced: 750 },
  hurt: { size: 30, weight: 900, lineH: 1, fill: ['#FFE8F4', '#FFC7E2', '#FF9EC7'], outer: [8, '#30213F'], inner: [2, '#FFF5FB'], life: 800, lifeLow: 750, lifeReduced: 750 },
  heal: { size: 28, weight: 900, lineH: 1, fill: ['#E8FFF5', '#A5F3D2', '#2BB3A3'], outer: [7, '#18363B'], inner: [2, '#F3FFF9'], life: 750, lifeLow: 700, lifeReduced: 600 },
  perfect: { size: 24, weight: 800, lineH: 1.3, fill: '#5CF2E6', outer: [3, '#182B3C'], inner: null, life: 900, lifeLow: 900, lifeReduced: 900, text: 'PERFECT!' },
  stagger: { size: 22, weight: 800, lineH: 1.3, fill: '#D7C8FF', outer: [3, '#231D42'], inner: null, life: 900, lifeLow: 900, lifeReduced: 900, text: 'เสียหลัก' },
  interrupt: { size: 22, weight: 800, lineH: 1.3, fill: '#C6FAF6', outer: [3, '#182B3C'], inner: null, life: 800, lifeLow: 800, lifeReduced: 800, text: 'ขัดจังหวะ!' },
  early: { size: 22, weight: 800, lineH: 1.3, fill: '#FF9EC7', outer: [2, '#231D42'], inner: null, life: 1300, lifeLow: 1300, lifeReduced: 1300, text: 'หลบเร็วไป' },
};
/** U+2212 minus for damage taken, plain + for heals (§2) */
export function labelText(kind: FKind, total: number) {
  if (!NUMERIC[kind]) return STYLE[kind].text!;
  return kind === 'hurt' ? `−${total}` : kind === 'heal' ? `+${total}` : String(total);
}

export const CAPS = {
  medium: { total: 12, num: 8, status: 4, actorNum: 2, actorStatus: 1, merge: 120, sparks: true, peakMax: Infinity, path: 1 },
  low: { total: 8, num: 6, status: 2, actorNum: 1, actorStatus: 1, merge: 160, sparks: false, peakMax: 1.1, path: 0.75 },
} as const;
/** a label is safe from cap replacement for this long (§5.2) */
export const MIN_READ = 180;
/** §10.3 "seen": painted at this opacity or more, without a gap, for MIN_READ ms */
export const READ_OPACITY = 0.8;
export const STATUS_DEDUP = 180;
export const SPARK = { life: 160, gap: 180, max: 2 } as const;
export const FADE_IN = 40;

export function lifeMs(kind: FKind, q: FQuality, reduced: boolean) {
  const s = STYLE[kind]; return reduced ? s.lifeReduced : q === 'low' ? s.lifeLow : s.life;
}

// ---------------------------------------------------------------- §4.1 scale and opacity
/** [start scale, peak, ms at peak, ms back at 1] */
const POP: Record<FKind, readonly [number, number, number, number] | null> = {
  damage: [0.72, 1.14, 80, 150], heal: [0.72, 1.14, 80, 150], bonus: [0.68, 1.18, 90, 170], hurt: [0.8, 1.1, 70, 140],
  perfect: [0.94, 1.04, 80, 150], stagger: [0.94, 1.04, 80, 150], interrupt: [0.94, 1.04, 80, 150], early: null,
};
const eOut = (v: number) => 1 - (1 - v) ** 3;
const eInOut = (v: number) => 3 * v * v - 2 * v * v * v;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function peakScale(kind: FKind, q: FQuality, reduced: boolean) {
  const p = POP[kind]; if (reduced || !p) return 1;
  return Math.min(p[1], CAPS[q].peakMax);
}
export function scaleAt(kind: FKind, age: number, q: FQuality, reduced: boolean) {
  const p = POP[kind]; if (reduced || !p) return 1;
  const peak = Math.min(p[1], CAPS[q].peakMax);
  if (age <= 0) return p[0];
  if (age < p[2]) return p[0] + (peak - p[0]) * eOut(age / p[2]);
  if (age < p[3]) return peak + (1 - peak) * eInOut((age - p[2]) / (p[3] - p[2]));
  return 1;
}
export function opacityAt(kind: FKind, age: number, life: number, reduced: boolean) {
  if (age >= life) return 0;
  const hold = reduced ? 0.8 : kind === 'early' ? 0.85 : 0.7;
  const u = age / life;
  const inA = age < FADE_IN ? clamp01(age / FADE_IN) : 1;
  const outA = u <= hold ? 1 : clamp01((1 - u) / (1 - hold));
  return Math.min(inA, outA);
}

// ---------------------------------------------------------------- §4.2 path
const PATH: Record<FKind, readonly number[]> = { // P0..P3 as x,y pairs; x is multiplied by the side sign s
  damage: [0, 0, 18, -30, 28, -42, 32, -20], bonus: [0, 0, 24, -44, 34, -58, 38, -30], hurt: [0, 0, 0, -12, 12, -20, 16, -8],
  heal: [0, 0, 0, -14, 0, -28, 0, -36], perfect: [0, 0, 0, -6, 0, -12, 0, -14], stagger: [0, 0, 0, -6, 0, -12, 0, -14],
  interrupt: [0, 0, 0, -6, 0, -12, 0, -14], early: [0, 0, 0, -2, 0, -4, 0, -6],
};
/** the four control points in screen px (x right, y down), already scaled by S and the Low path factor */
export function pathPoints(kind: FKind, s: 1 | -1, S: number, q: FQuality, reduced: boolean, out = new Array<number>(8)) {
  const P = PATH[kind], k = reduced ? 0 : S * (NUMERIC[kind] ? CAPS[q].path : 1);
  for (let i = 0; i < 8; i += 2) { out[i] = P[i] * s * k; out[i + 1] = P[i + 1] * k; }
  return out;
}
export function bezier(p: readonly number[], u: number, out: { x: number; y: number }) {
  const a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, c = 3 * (1 - u) * u * u, d = u ** 3;
  out.x = a * p[0] + b * p[2] + c * p[4] + d * p[6]; out.y = a * p[1] + b * p[3] + c * p[5] + d * p[7];
  return out;
}

// ---------------------------------------------------------------- §6 geometry
export const hits = (a: Rect, b: Rect) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
export const grow = (a: Rect, d: number): Rect => ({ l: a.l - d, t: a.t - d, r: a.r + d, b: a.b + d });
export function overlapArea(a: Rect, b: Rect) { return Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t)); }

/** measured glyph box at scale 1 (already includes S, stroke and shadow); badge = the "รวม N" tag (0 when none) */
export interface GlyphBox { w: number; h: number; badgeW: number; badgeH: number; size: number }
/** spark bars relative to the glyph's top-right corner: centre x/y and half extents of the rotated 3x9 / 3x6 bars, rise 4 */
const SPARK_EXT = { l: 4 - 2.8, r: 10 + 2.44, t: -1 - 4.75 - 4, b: 3 + 3.33 };

/** Reserved rect R in wrapper-local px (origin = the path start P0, which is the glyph centre at spawn) for the whole life (§6.2):
 *  glyph at peak scale + badge + sparks, padded 8·S, then swept over the path's control-point hull (which contains the curve). */
export function localR(box: GlyphBox, peak: number, path: readonly number[], spark: boolean, S: number): Rect {
  const hw = (box.w * peak) / 2, hh = (box.h * peak) / 2;
  let l = -hw, r = hw, t = -hh, b = hh;
  if (box.badgeW > 0) { r = hw + (5 * S + box.badgeW) * peak; b = Math.max(b, hh); t = Math.min(t, hh - box.badgeH * peak); }
  if (spark) { const gx = box.w / 2, gy = -box.h / 2; l = Math.min(l, gx + SPARK_EXT.l * S); r = Math.max(r, gx + SPARK_EXT.r * S); t = Math.min(t, gy + SPARK_EXT.t * S); b = Math.max(b, gy + SPARK_EXT.b * S); }
  const pad = 8 * S;
  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  for (let i = 0; i < 8; i += 2) { minX = Math.min(minX, path[i]); maxX = Math.max(maxX, path[i]); minY = Math.min(minY, path[i + 1]); maxY = Math.max(maxY, path[i + 1]); }
  return { l: l - pad + minX, r: r + pad + maxX, t: t - pad + minY, b: b + pad + maxY };
}
/** spark bar centres relative to the glyph centre (for painting) */
export function sparkSpots(box: GlyphBox, S: number) {
  const gx = box.w / 2, gy = -box.h / 2;
  return { ax: gx + 4 * S, ay: gy - 1 * S, bx: gx + 10 * S, by: gy + 3 * S };
}

// ---------------------------------------------------------------- §6.2 (v2) the four patterns
export type Place = 'above' | 'right' | 'left' | 'below';
const ODD: readonly Place[] = ['above', 'right', 'left', 'below'], EVEN: readonly Place[] = ['above', 'left', 'right', 'below'];
/** try order for the actor's n-th label (1-based) */
export const placeOrder = (n: number) => (n % 2 === 1 ? ODD : EVEN);
/** px at S = 1: gap g to the body, safe-view inset, spawn rounding margin ε, farthest R centre from the nearest point of the body, and
 *  the y room a side spot keeps from both ends of its free interval when there is room (§6.2 step 5, v3) */
export const LAYOUT = { gap: 10, edge: 8, eps: 0.5, near: 128, inset: 7.5 } as const;
/** float tolerance: boxes that only touch do not overlap */
const TOL = 1e-6;

/** middle of the part of the body inside the safe view: the y a side lane prefers at spawn and follows afterwards */
export const bodyMidY = (a: Rect, safe: Rect) => (Math.max(a.t, safe.t) + Math.min(a.b, safe.b)) / 2;

/** centre of a w x h R in pattern `place` around body rect `a` (not grown); side lanes sit `dy` from the visible-body middle */
function placeCentre(place: Place, a: Rect, safe: Rect, w: number, h: number, dy: number, S: number, out: { x: number; y: number }) {
  const g = LAYOUT.gap * S;
  if (place === 'right' || place === 'left') {
    out.x = place === 'right' ? a.r + g + w / 2 : a.l - g - w / 2;
    out.y = bodyMidY(a, safe) + dy;
  } else {
    out.x = (a.l + a.r) / 2;
    out.y = place === 'above' ? a.t - g - h / 2 : a.b + g + h / 2;
  }
  return out;
}

/** Steps 1–3 of the side search: the lane's centre x and the centre-y range that keeps all of R in the safe view and its centre
 *  within 128·S of the body; or why this side has no lane. */
function sideLane(place: 'right' | 'left', a: Rect, w: number, h: number, safe: Rect, S: number): { x: number; lo: number; hi: number } | 'edge' | 'far' | 'noheight' {
  const e = LAYOUT.eps * S, m = LAYOUT.edge * S, near = LAYOUT.near * S;
  const x = placeCentre(place, a, safe, w, h, 0, S, { x: 0, y: 0 }).x;
  if (x - w / 2 - e < safe.l + m - TOL || x + w / 2 + e > safe.r - m + TOL) return 'edge'; // x is never clamped back over the body
  const dx = LAYOUT.gap * S + w / 2;
  if (dx > near + TOL) return 'far';
  const v = Math.sqrt(Math.max(0, near * near - dx * dx));
  const lo = Math.max(safe.t + m + h / 2 + e, a.t - v), hi = Math.min(safe.b - m - h / 2 - e, a.b + v);
  return lo > hi + TOL ? 'noheight' : { x, lo, hi: Math.max(lo, hi) };
}

/** Steps 4–5: every area sharing width with the lane's column forbids the open centre range (area.t − hh, area.b + hh); a range that only
 *  touches stays free. Every free interval [L, U] left in [lo, hi] (single points too) offers `want` clamped into [L + d, U − d] with
 *  d = min(inset, (U − L)/2) — the middle when it is narrow. The offer nearest `want` wins, a tie takes the smaller y. */
function nearestFree(colL: number, colR: number, hh: number, lo: number, hi: number, want: number, inset: number, lists: readonly (readonly Rect[])[], cutBy: Set<string>): number | null {
  const ranges: [number, number][] = [];
  for (const list of lists) for (const p of list) {
    if (!(p.l < colR - TOL && p.r > colL + TOL)) continue;
    const from = p.t - hh, to = p.b + hh;
    if (to <= lo + TOL || from >= hi - TOL) continue;
    ranges.push([from, to]); cutBy.add(p.k ?? '?');
  }
  ranges.sort((a, b) => a[0] - b[0]);
  let best: number | null = null, start = lo;
  const take = (L: number, end: number) => {
    if (L > end + TOL) return;
    const U = Math.max(L, end), d = Math.min(inset, (U - L) / 2);
    const y = Math.min(Math.max(want, L + d), U - d);
    if (best === null || Math.abs(y - want) < Math.abs(best - want) - TOL) best = y; // pieces come in rising y: a tie keeps the smaller
  };
  for (const [from, to] of ranges) { take(start, Math.min(from, hi)); if (to > start) start = to; }
  take(start, hi);
  return best;
}

/** side pattern at spawn: the chosen centre y, or why this side has no room */
function seekSide(place: 'right' | 'left', a: Rect, w: number, h: number, geo: Geo, others: readonly Rect[]): number | string {
  const lane = sideLane(place, a, w, h, geo.safe, geo.S);
  if (typeof lane === 'string') return lane;
  const e = LAYOUT.eps * geo.S, cut = new Set<string>();
  const y = nearestFree(lane.x - w / 2 - e, lane.x + w / 2 + e, h / 2 + e, lane.lo, lane.hi, bodyMidY(a, geo.safe), LAYOUT.inset * geo.S, [geo.prot, others], cut);
  return y ?? `full(${[...cut].sort().join('+')})`;
}

/** why R (placed with its centre at c) may not be here, or null. eps: the spawn-only rounding margin of §6.2 (0 for the per-frame check) */
function refusal(r: Rect, c: { x: number; y: number }, a: Rect, geo: Geo, others: readonly Rect[], eps: number): string | null {
  const S = geo.S, m = LAYOUT.edge * S, g = grow(r, eps - TOL);
  if (g.l < geo.safe.l + m - 2 * TOL || g.r > geo.safe.r - m + 2 * TOL || g.t < geo.safe.t + m - 2 * TOL || g.b > geo.safe.b - m + 2 * TOL) return 'edge';
  if (Math.hypot(Math.max(a.l - c.x, 0, c.x - a.r), Math.max(a.t - c.y, 0, c.y - a.b)) > LAYOUT.near * S + TOL) return 'far';
  for (const p of geo.prot) if (hits(g, p)) return 'prot:' + (p.k ?? '?');
  for (const o of others) if (hits(g, o)) return 'label';
  return null;
}

// ---------------------------------------------------------------- the book of live labels
export interface FIn { kind: FKind; actor: number; amount: number; /** world distance to the player (tie-break) */ dist: number; /** event index in the tick */ order: number }
export interface Label {
  uid: number; kind: FKind; actor: number; total: number; count: number; text: string;
  born: number; life: number; seq: number; s: 1 | -1; place: Place; spark: boolean;
  box: GlyphBox; local: Rect; screen: Rect; ax: number; ay: number; lastActor: Rect | null; alive: boolean;
  /** frame fixed at spawn: the R size the pattern centre is computed with, the wrapper start (P0) relative to that centre, and for the
   *  side patterns the offset from the visible-body middle. A merge (wider text) or the end of the sparks changes `local` but never
   *  moves the words: R is re-checked around the same start point. */
  fw: number; fh: number; ox: number; oy: number; dy: number;
  /** §10.3 counters: painted at all / painted at ≥ 0.8 for 180 ms; `since` = clock of the first frame of the current such run (−1 none) */
  painted: boolean; readable: boolean; since: number; paintedAt: number;
  /** clock of the first frame that painted it with opacity > 0 (−1 none): the 180 ms before it may be replaced count from here (§5.2) */
  shownAt: number;
}
/** what the DOM layer supplies for one placement / frame */
export interface Geo {
  S: number;
  /** safe viewport (CSS px) */
  safe: Rect;
  /** protected areas already grown by their own margins (warnings 8·S, bodies 6·S, bars 4·S, HUD 8·S) */
  prot: readonly Rect[];
  /** body rect of an actor: 0 = drawn and on screen (out filled), 1 = no longer drawn (dead/faded), 2 = off screen or behind the camera */
  actor(id: number, out: Rect): 0 | 1 | 2;
  /** glyph box for this text; null when it cannot fit the width limit even at the minimum size (§3.3) */
  box(kind: FKind, text: string, count: number): GlyphBox | null;
}

/** counters kept per kind and in total. A "group" asking for a new label ends as created, dropCap or dropPlace; a created label ends
 *  as retiredLife, retiredSafety, replaced or cleared. created ≠ shown: see painted / readable. */
export interface KindStats {
  created: number; painted: number; readable: number; merged: number; deduped: number; dropCap: number; dropPlace: number;
  replaced: number; retiredSafety: number; retiredLife: number; cleared: number;
  /** events whose life had already run out when the frame that could first show them came: never made into labels (§14.3) */
  expired: number;
  /** of the above: left without a single painted frame / retired for safety before it was readable */
  retiredUnpainted: number; safetyUnread: number;
}
const zeroKind = (): KindStats => ({ created: 0, painted: 0, readable: 0, merged: 0, deduped: 0, dropCap: 0, dropPlace: 0, replaced: 0, retiredSafety: 0, retiredLife: 0, cleared: 0, expired: 0, retiredUnpainted: 0, safetyUnread: 0 });
export interface FStats extends KindStats {
  invalid: number;
  /** drops: how often each pattern was refused for each reason */
  why: Record<string, number>;
  /** safety retirements of live labels by reason */
  retireWhy: Record<string, number>;
  /** cleared labels by reason: run (new world), retry, result-screen, quality, motion */
  clearWhy: Record<string, number>;
  byKind: Partial<Record<FKind, KindStats>>;
}
export const zeroStats = (): FStats => ({ ...zeroKind(), invalid: 0, why: {}, retireWhy: {}, clearWhy: {}, byKind: {} });

/** QA: the geometry of one placement attempt, so a checker that shares no code with this file can decide whether a legal spot existed */
export interface Attempt {
  t: number; kind: FKind; actor: number; n: number; S: number; safe: Rect; a: Rect | null;
  /** R size without the sparks (the smallest layout tried) */
  w: number; h: number;
  /** protected areas (grown by their margins) + live labels (grown by 6·S) */
  blocks: Rect[];
  result: Place | 'cap' | 'offscreen' | 'gone' | 'tooWide' | 'none' | 'expired';
  /** the R that was accepted, and the id of the label made from it */
  R: Rect | null;
  uid?: number;
  why: string[];
}

export type Cause = 'life' | 'safety' | 'replaced' | 'clear';

export class FloatBook {
  q: FQuality = 'medium';
  reduced = false;
  /** the picture clock in ms: set by the host from the run's tick + alpha (§14.3, §14.7); never runs backwards within a run */
  clock = 0;
  private prevClock = 0;
  labels: Label[] = [];
  stats: FStats = zeroStats();
  /** QA: the last 40 labels dropped for lack of room (actor rect on screen, R size, the refusal of each pattern) */
  dropLog: { t: number; kind: FKind; actor: number; a: Rect; R: { w: number; h: number }; why: string[] }[] = [];
  /** QA: called for every placement attempt when set (off in normal play) */
  onAttempt: ((a: Attempt) => void) | null = null;
  /** called when a label leaves (life over, safety, replaced, cleared) so the DOM layer can return its element to the pool */
  onRetire: (l: Label, cause: Cause, why: string) => void = () => {};
  private uid = 0;
  private seq = new Map<number, number>();
  private lastSpark = new Map<number, number>();
  private tmpA: Rect = { l: 0, t: 0, r: 0, b: 0 };
  private pt = { x: 0, y: 0 };

  /** move the clock forward to `ms` (an earlier or equal time leaves it where it is) */
  setClock(ms: number) { if (ms > this.clock) { this.prevClock = this.clock; this.clock = ms; } }
  advance(ms: number) { if (ms > 0) this.setClock(this.clock + ms); }
  /** a new run starts its own clock (call after clear) */
  resync(ms: number) { this.clock = this.prevClock = ms; }
  /** visual age of a label: 0 until the clock reaches its event time (§14.7) */
  age(l: Label) { return Math.max(0, this.clock - l.born); }
  clear(why = 'clear') {
    for (const l of this.labels) { if (l.alive) this.stats.clearWhy[why] = (this.stats.clearWhy[why] ?? 0) + 1; this.retire(l, 'clear', why); }
    this.labels = []; this.seq.clear(); this.lastSpark.clear();
  }
  sparksLive(at = this.clock) { let n = 0; for (const l of this.labels) if (l.alive && l.spark && at - l.born < SPARK.life) n++; return n; }

  private count(key: keyof KindStats, kind: FKind) { this.stats[key]++; (this.stats.byKind[kind] ??= zeroKind())[key]++; }
  private retire(l: Label, cause: Cause, why = '') {
    if (!l.alive) return;
    l.alive = false;
    if (cause === 'life') this.count('retiredLife', l.kind);
    else if (cause === 'replaced') this.count('replaced', l.kind);
    else if (cause === 'clear') this.count('cleared', l.kind);
    else {
      this.count('retiredSafety', l.kind);
      if (!l.readable) this.count('safetyUnread', l.kind);
      this.stats.retireWhy[why] = (this.stats.retireWhy[why] ?? 0) + 1;
    }
    if (!l.painted) this.count('retiredUnpainted', l.kind);
    this.onRetire(l, cause, why);
  }
  private compact() { this.labels = this.labels.filter((l) => l.alive); }
  private expire() {
    for (const l of this.labels) if (this.clock - l.born >= l.life) this.retire(l, 'life');
    this.compact();
  }

  /** The DOM layer calls this right after painting a label, with the opacity it set (§10.3 painted / readable ≥ 180 ms). */
  notePaint(l: Label, opacity: number) {
    if (!l.alive || !(opacity > 0)) { l.since = -1; return; }
    if (l.shownAt < 0) l.shownAt = this.clock;
    if (!l.painted) { l.painted = true; this.count('painted', l.kind); }
    // a gap = the clock stepped past a frame in which this label was not painted
    const gap = l.paintedAt !== this.clock && l.paintedAt !== this.prevClock;
    l.paintedAt = this.clock;
    if (opacity < READ_OPACITY - TOL) { l.since = -1; return; }
    if (l.since < 0 || gap) l.since = this.clock;
    if (!l.readable && this.clock - l.since >= MIN_READ - TOL) { l.readable = true; this.count('readable', l.kind); }
  }

  /** One sim tick's worth of events, handled as a batch in importance order (§5.2). `at`: the picture-clock time the events happened
   *  (their tick), when they are placed later with the geometry of the frame about to be painted; it is their birth time and drives
   *  merge / dedup / sparks. An event whose life already ran out is counted as expired, not made into a label (§14.3). */
  ingest(batch: readonly FIn[], geo: Geo, at = this.clock) {
    this.expire();
    const list = batch.slice().sort((a, b) => RANK[a.kind] - RANK[b.kind] || a.dist - b.dist || a.actor - b.actor || a.order - b.order);
    for (const e of list) {
      if (NUMERIC[e.kind]) {
        if (!Number.isFinite(e.amount) || e.amount < 0 || !Number.isInteger(e.amount)) { this.stats.invalid++; continue; }
        if (e.amount === 0) continue;
        const g = this.labels.find((l) => l.alive && l.actor === e.actor && l.kind === e.kind && at - l.born <= CAPS[this.q].merge);
        if (g) {
          g.total += e.amount; g.count++; g.text = labelText(g.kind, g.total); this.count('merged', g.kind);
          const nb = geo.box(g.kind, g.text, g.count);
          if (!nb) { this.retire(g, 'safety', 'tooWide'); this.compact(); continue; } // §3.3: no longer fits, never abbreviated
          g.box = nb; this.relocal(g, geo.S); continue;
        }
      } else if (this.labels.some((l) => l.alive && l.actor === e.actor && l.kind === e.kind && at - l.born < STATUS_DEDUP)) { this.count('deduped', e.kind); continue; }
      if (this.clock - at >= lifeMs(e.kind, this.q, this.reduced) - TOL) { // too late to be seen: not made, not queued for later
        this.count('expired', e.kind);
        this.onAttempt?.({ t: at, kind: e.kind, actor: e.actor, n: 0, S: geo.S, safe: { ...geo.safe }, a: null, w: 0, h: 0, blocks: [], result: 'expired', R: null, why: [] });
        continue;
      }
      this.spawn(e, geo, at);
    }
  }

  private relocal(l: Label, S: number) {
    l.local = localR(l.box, peakScale(l.kind, this.q, this.reduced), pathPoints(l.kind, l.s, S, this.q, this.reduced), l.spark && this.clock - l.born < SPARK.life, S);
  }

  private victimFor(e: FIn): { need: boolean; victim: Label | null } {
    const c = CAPS[this.q], num = NUMERIC[e.kind];
    const same = (l: Label) => NUMERIC[l.kind] === num;
    const live = this.labels.filter((l) => l.alive);
    const actorFull = live.filter((l) => l.actor === e.actor && same(l)).length >= (num ? c.actorNum : c.actorStatus);
    const subFull = live.filter(same).length >= (num ? c.num : c.status);
    const totalFull = live.length >= c.total;
    const pool = actorFull ? live.filter((l) => l.actor === e.actor && same(l)) : subFull ? live.filter(same) : totalFull ? live : null;
    if (!pool) return { need: false, victim: null };
    // only a label that has had 180 ms on screen since its first real paint: an old event time from the queue does not count
    const ok = pool.filter((l) => RANK[l.kind] > RANK[e.kind] && l.shownAt >= 0 && this.clock - l.shownAt >= MIN_READ - TOL).sort((a, b) => a.born - b.born || a.uid - b.uid);
    return { need: true, victim: ok[0] ?? null };
  }

  private spawn(e: FIn, geo: Geo, at: number) {
    const S = geo.S, { need, victim } = this.victimFor(e);
    const n = (this.seq.get(e.actor) ?? 0) + 1;
    const report = (result: Attempt['result'], extra: Partial<Attempt> = {}) => this.onAttempt?.({ t: at, kind: e.kind, actor: e.actor, n, S, safe: { ...geo.safe }, a: null, w: 0, h: 0, blocks: [], result, R: null, why: [], ...extra });
    if (need && !victim) { this.count('dropCap', e.kind); report('cap'); return; }
    const st = geo.actor(e.actor, this.tmpA);
    const refuse = (result: 'offscreen' | 'gone' | 'tooWide') => { this.count('dropPlace', e.kind); this.stats.why[result] = (this.stats.why[result] ?? 0) + 1; report(result); };
    if (st !== 0) return refuse(st === 2 ? 'offscreen' : 'gone'); // not on screen: no label, never clamped to the edge
    const text = labelText(e.kind, e.amount);
    const box = geo.box(e.kind, text, 1);
    if (!box) return refuse('tooWide');
    const a = this.tmpA;
    const s: 1 | -1 = n % 2 === 1 ? 1 : -1;
    const wantSpark = CAPS[this.q].sparks && !this.reduced && (e.kind === 'bonus' || e.kind === 'perfect')
      && this.sparksLive(at) < SPARK.max && at - (this.lastSpark.get(e.actor) ?? -1e9) >= SPARK.gap;
    const others = this.labels.filter((l) => l.alive && l !== victim).map((l) => { const o = grow(l.screen, 6 * S); o.k = 'label'; return o; });
    const path = pathPoints(e.kind, s, S, this.q, this.reduced), peak = peakScale(e.kind, this.q, this.reduced);
    const why: string[] = [];
    const bare = localR(box, peak, path, false, S);
    const snapshot = () => ({ a: { ...a }, w: bare.r - bare.l, h: bare.b - bare.t, blocks: [...geo.prot, ...others].map((p) => ({ ...p })), why: [...why] });
    for (const spark of wantSpark ? [true, false] : [false]) {
      why.length = 0;
      const local = spark ? localR(box, peak, path, true, S) : bare;
      const fw = local.r - local.l, fh = local.b - local.t, ox = -(local.l + local.r) / 2, oy = -(local.t + local.b) / 2;
      for (const place of placeOrder(n)) {
        let dy = 0;
        if (place === 'right' || place === 'left') { // search the lane once, now
          const y = seekSide(place, a, fw, fh, geo, others);
          if (typeof y === 'string') { why.push(`${place}:${y}`); continue; }
          dy = y - bodyMidY(a, geo.safe);
        }
        const c = placeCentre(place, a, geo.safe, fw, fh, dy, S, this.pt);
        const ax = c.x + ox, ay = c.y + oy;
        const screen: Rect = { l: ax + local.l, r: ax + local.r, t: ay + local.t, b: ay + local.b };
        const bad = refusal(screen, c, a, geo, others, LAYOUT.eps * S);
        if (bad) { why.push(`${place}:${bad}`); continue; }
        if (victim) { this.retire(victim, 'replaced'); this.compact(); }
        this.seq.set(e.actor, n);
        if (spark) this.lastSpark.set(e.actor, at);
        this.labels.push({ uid: ++this.uid, kind: e.kind, actor: e.actor, total: e.amount, count: 1, text, born: at, life: lifeMs(e.kind, this.q, this.reduced),
          seq: n, s, place, spark, box, local, screen, ax, ay, lastActor: { ...a }, alive: true, fw, fh, ox, oy, dy,
          painted: false, readable: false, since: -1, paintedAt: -1, shownAt: -1 });
        this.count('created', e.kind);
        if (this.onAttempt) report(place, { ...snapshot(), R: { ...screen }, uid: this.uid });
        return;
      }
    }
    this.count('dropPlace', e.kind); // §6.2 no pattern passes: drop it, no queue, no other spot
    for (const w of why) this.stats.why[w] = (this.stats.why[w] ?? 0) + 1;
    this.dropLog.push({ t: at, kind: e.kind, actor: e.actor, a: { l: a.l, t: a.t, r: a.r, b: a.b }, R: { w: bare.r - bare.l, h: bare.b - bare.t }, why: [...why] });
    if (this.dropLog.length > 40) this.dropLog.shift();
    if (this.onAttempt) report('none', snapshot());
  }

  /** Every frame before paint (§6.2): expire, then hold each label in its own pattern around the actor's current rect (side lanes keep
   *  their offset from the body middle, no new search). One whose R now meets a warning / body / HUD / a more important label, leaves
   *  the safe view or is no longer close to its actor is retired at once (no fade over the warning, no flicker back). */
  frame(geo: Geo) {
    this.expire();
    const order = this.labels.slice().sort((a, b) => RANK[a.kind] - RANK[b.kind] || a.born - b.born || a.uid - b.uid);
    const accepted: Rect[] = [];
    for (const l of order) {
      if (l.spark && this.clock - l.born >= SPARK.life) { l.spark = false; this.relocal(l, geo.S); } // sparks gone: R shrinks back
      const st = geo.actor(l.actor, this.tmpA);
      let a: Rect | null = null;
      if (st === 0) { a = this.tmpA; l.lastActor = { ...a }; }
      else if (st === 1) a = l.lastActor; // dead and removed: stay at the last spot until the life ends
      if (!a) { this.retire(l, 'safety', 'offscreen'); continue; }
      const c = placeCentre(l.place, a, geo.safe, l.fw, l.fh, l.dy, geo.S, this.pt);
      const ax = c.x + l.ox, ay = c.y + l.oy;
      const screen: Rect = { l: ax + l.local.l, r: ax + l.local.r, t: ay + l.local.t, b: ay + l.local.b };
      const bad = refusal(screen, c, a, geo, accepted, 0);
      if (bad) { this.retire(l, 'safety', bad); continue; }
      l.screen = screen; l.ax = ax; l.ay = ay;
      accepted.push(grow(screen, 6 * geo.S));
    }
    this.compact();
  }
}
