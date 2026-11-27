// DES-008 damage numbers: the DOM-free core. Timing curves (§4), merge / caps / priority (§5) and placement against protected
// screen areas (§6). The DOM layer (floaters.ts) measures glyphs, gathers the protected rects every frame and paints; everything
// here is plain arithmetic on CSS px and a UI clock in ms, so it can be unit-tested without a browser. No Math.random (§4.2).

export type FKind = 'damage' | 'bonus' | 'hurt' | 'heal' | 'perfect' | 'stagger' | 'interrupt' | 'early';
export type FQuality = 'medium' | 'low';
export interface Rect { l: number; t: number; r: number; b: number }

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

/** Centre of R for candidate slot i (§6.2), around the target's body rect `a` (not grown). */
export function slotCentre(i: number, a: Rect, w: number, h: number, S: number, out: { x: number; y: number }) {
  const cx = (a.l + a.r) / 2, g = 10 * S, up = i >= 3 ? h + 6 * S : 0;
  const k = i % 3;
  if (k === 0) { out.x = cx; out.y = a.t - g - h / 2; }
  else if (k === 1) { out.x = a.r + g + w / 2; out.y = a.t - h / 4; }
  else { out.x = a.l - g - w / 2; out.y = a.t - h / 4; }
  out.y -= up;
  return out;
}
/** try order for the actor's n-th label (1-based): odd = above, right, left, ...; even swaps right/left */
export const slotOrder = (n: number) => (n % 2 === 1 ? [0, 1, 2, 3, 4, 5] : [0, 2, 1, 3, 5, 4]);

// ---------------------------------------------------------------- the book of live labels
export interface FIn { kind: FKind; actor: number; amount: number; /** world distance to the player (tie-break) */ dist: number; /** event index in the tick */ order: number }
export interface Label {
  uid: number; kind: FKind; actor: number; total: number; count: number; text: string;
  born: number; life: number; seq: number; s: 1 | -1; slot: number; spark: boolean;
  box: GlyphBox; local: Rect; screen: Rect; ax: number; ay: number; lastActor: Rect | null; alive: boolean;
  /** slot frame fixed at spawn: R size used for the slot centre, and the wrapper start relative to that centre. A merge (wider text)
   *  or the end of the sparks changes `local` but never moves the words: R is re-checked around the same start point. */
  fw: number; fh: number; ox: number; oy: number;
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
export interface FStats { made: number; merged: number; deduped: number; invalid: number; dropCap: number; dropPlace: number; replaced: number; retiredSafety: number; retiredLife: number;
  /** QA: for dropped labels, how often each rule refused a slot (offscreen / tooWide / edge / far / prot / label) */
  why: Record<string, number> }

export class FloatBook {
  q: FQuality = 'medium';
  reduced = false;
  /** UI clock in ms (advances only while the game runs) */
  clock = 0;
  labels: Label[] = [];
  stats: FStats = { made: 0, merged: 0, deduped: 0, invalid: 0, dropCap: 0, dropPlace: 0, replaced: 0, retiredSafety: 0, retiredLife: 0, why: {} };
  private whyNow: string[] = [];
  /** QA: the last 40 labels dropped for lack of a slot (actor rect on screen, R size, refusals per slot) */
  dropLog: { kind: FKind; a: Rect; R: { w: number; h: number }; why: string[] }[] = [];
  private note(w: string) { this.stats.why[w] = (this.stats.why[w] ?? 0) + 1; }
  /** called when a label leaves (life over, safety, replaced, cleared) so the DOM layer can return its element to the pool */
  onRetire: (l: Label) => void = () => {};
  private uid = 0;
  private seq = new Map<number, number>();
  private lastSpark = new Map<number, number>();
  private tmpA: Rect = { l: 0, t: 0, r: 0, b: 0 };
  private pt = { x: 0, y: 0 };

  advance(ms: number) { if (ms > 0) this.clock += ms; }
  clear() { for (const l of this.labels) this.retire(l); this.labels = []; this.seq.clear(); this.lastSpark.clear(); }
  sparksLive() { let n = 0; for (const l of this.labels) if (l.spark && this.clock - l.born < SPARK.life) n++; return n; }

  private retire(l: Label) { if (!l.alive) return; l.alive = false; this.onRetire(l); }
  private expire() {
    let k = 0;
    for (const l of this.labels) {
      if (l.alive && this.clock - l.born >= l.life) { this.retire(l); this.stats.retiredLife++; }
      if (l.alive) this.labels[k++] = l;
    }
    this.labels.length = k;
  }

  /** One sim tick's worth of events, handled as a batch in importance order (§5.2). */
  ingest(batch: readonly FIn[], geo: Geo) {
    this.expire();
    const list = batch.slice().sort((a, b) => RANK[a.kind] - RANK[b.kind] || a.dist - b.dist || a.actor - b.actor || a.order - b.order);
    for (const e of list) {
      if (NUMERIC[e.kind]) {
        if (!Number.isFinite(e.amount) || e.amount < 0 || !Number.isInteger(e.amount)) { this.stats.invalid++; continue; }
        if (e.amount === 0) continue;
        const g = this.labels.find((l) => l.alive && l.actor === e.actor && l.kind === e.kind && this.clock - l.born <= CAPS[this.q].merge);
        if (g) {
          g.total += e.amount; g.count++; g.text = labelText(g.kind, g.total); this.stats.merged++;
          const nb = geo.box(g.kind, g.text, g.count);
          if (!nb) { this.retire(g); this.stats.retiredSafety++; this.labels = this.labels.filter((l) => l !== g); continue; } // §3.3: no longer fits, never abbreviated
          g.box = nb; this.relocal(g, geo.S); continue;
        }
      } else if (this.labels.some((l) => l.alive && l.actor === e.actor && l.kind === e.kind && this.clock - l.born < STATUS_DEDUP)) { this.stats.deduped++; continue; }
      this.spawn(e, geo);
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
    const ok = pool.filter((l) => RANK[l.kind] > RANK[e.kind] && this.clock - l.born >= MIN_READ).sort((a, b) => a.born - b.born || a.uid - b.uid);
    return { need: true, victim: ok[0] ?? null };
  }

  private spawn(e: FIn, geo: Geo) {
    const { need, victim } = this.victimFor(e);
    if (need && !victim) { this.stats.dropCap++; return; }
    if (geo.actor(e.actor, this.tmpA) !== 0) { this.stats.dropPlace++; this.note('offscreen'); return; } // not on screen: no label, never clamped to the edge
    const text = labelText(e.kind, e.amount);
    const box = geo.box(e.kind, text, 1);
    if (!box) { this.stats.dropPlace++; this.note('tooWide'); return; }
    const n = (this.seq.get(e.actor) ?? 0) + 1;
    const s: 1 | -1 = n % 2 === 1 ? 1 : -1;
    const wantSpark = CAPS[this.q].sparks && !this.reduced && (e.kind === 'bonus' || e.kind === 'perfect')
      && this.sparksLive() < SPARK.max && this.clock - (this.lastSpark.get(e.actor) ?? -1e9) >= SPARK.gap;
    const others = this.labels.filter((l) => l.alive && l !== victim).map((l) => grow(l.screen, 6 * geo.S));
    const path = pathPoints(e.kind, s, geo.S, this.q, this.reduced), peak = peakScale(e.kind, this.q, this.reduced);
    this.whyNow.length = 0;
    for (const spark of wantSpark ? [true, false] : [false]) {
      const local = localR(box, peak, path, spark, geo.S);
      for (const slot of slotOrder(n)) {
        const fw = local.r - local.l, fh = local.b - local.t, ox = -(local.l + local.r) / 2, oy = -(local.t + local.b) / 2;
        const scr = this.fit(local, fw, fh, ox, oy, slot, this.tmpA, geo, others);
        if (!scr) continue;
        if (victim) { this.retire(victim); this.stats.replaced++; this.labels = this.labels.filter((l) => l !== victim); }
        const l: Label = { uid: ++this.uid, kind: e.kind, actor: e.actor, total: e.amount, count: 1, text, born: this.clock, life: lifeMs(e.kind, this.q, this.reduced),
          seq: n, s, slot, spark, box, local, screen: scr.r, ax: scr.ax, ay: scr.ay, lastActor: { ...this.tmpA }, alive: true, fw, fh, ox, oy };
        this.seq.set(e.actor, n);
        if (spark) this.lastSpark.set(e.actor, this.clock);
        this.labels.push(l); this.stats.made++;
        return;
      }
    }
    this.stats.dropPlace++; // §6.2 no slot: drop it, no queue, no other spot
    for (const w of this.whyNow) this.note(w);
    const a = this.tmpA, L = localR(box, peak, path, false, geo.S);
    this.dropLog.push({ kind: e.kind, a: { l: Math.round(a.l), t: Math.round(a.t), r: Math.round(a.r), b: Math.round(a.b) }, R: { w: Math.round(L.r - L.l), h: Math.round(L.b - L.t) }, why: [...this.whyNow] });
    if (this.dropLog.length > 40) this.dropLog.shift();
  }

  /** R in screen space for slot `slot` around actor rect `a`, or null when it breaks a rule (safe edge, distance, protected, other labels).
   *  fw/fh: R size the slot centre is computed with; ox/oy: wrapper start (P0) relative to that centre. */
  private fit(local: Rect, fw: number, fh: number, ox: number, oy: number, slot: number, a: Rect, geo: Geo, others: readonly Rect[]) {
    const S = geo.S;
    const c = slotCentre(slot, a, fw, fh, S, this.pt);
    const ax = c.x + ox, ay = c.y + oy;
    const r: Rect = { l: ax + local.l, r: ax + local.r, t: ay + local.t, b: ay + local.b };
    const m = 8 * S;
    if (r.l < geo.safe.l + m || r.r > geo.safe.r - m || r.t < geo.safe.t + m || r.b > geo.safe.b - m) { this.whyNow.push('edge'); return null; }
    if (Math.hypot(c.x - (a.l + a.r) / 2, c.y - a.t) > 144 * S) { this.whyNow.push('far'); return null; }
    for (const p of geo.prot) if (hits(r, p)) { this.whyNow.push('prot:' + ((p as Rect & { k?: string }).k ?? '?')); return null; }
    for (const o of others) if (hits(r, o)) { this.whyNow.push('label'); return null; }
    return { r, ax, ay };
  }

  /** Every frame before paint (§6.2): expire, then re-place each label in its own slot around the actor's current rect; a label whose
   *  R now meets a warning / body / HUD / a more important label is retired at once (no fade over the warning, no flicker back). */
  frame(geo: Geo) {
    this.expire();
    const order = this.labels.filter((l) => l.alive).sort((a, b) => RANK[a.kind] - RANK[b.kind] || a.born - b.born || a.uid - b.uid);
    const accepted: Rect[] = [];
    for (const l of order) {
      if (l.spark && this.clock - l.born >= SPARK.life) { l.spark = false; this.relocal(l, geo.S); } // sparks gone: R shrinks back
      const st = geo.actor(l.actor, this.tmpA);
      let a: Rect | null = null;
      if (st === 0) { a = this.tmpA; l.lastActor = { ...a }; }
      else if (st === 1) a = l.lastActor; // dead and removed: stay at the last spot until the life ends
      const scr = a ? this.fit(l.local, l.fw, l.fh, l.ox, l.oy, l.slot, a, geo, accepted) : null;
      if (!scr) { this.retire(l); this.stats.retiredSafety++; continue; }
      l.screen = scr.r; l.ax = scr.ax; l.ay = scr.ay;
      accepted.push(grow(scr.r, 6 * geo.S));
    }
    this.labels = this.labels.filter((l) => l.alive);
  }
}
