// DES-008 damage numbers: the DOM layer. Pooled label elements (no element created per hit), glyph measuring with a 2D canvas
// (no layout reads per label), the protected screen areas gathered every frame (warnings, bodies, enemy bars, visible HUD), and
// painting with transform/opacity only. The rules live in floatCore.ts.
// A tick's events wait in a queue until the frame that paints them, so they are placed against that frame's camera, bodies, HP bars,
// HUD and warnings, with one gather per rendered frame. Each batch keeps its own time (§14.3): eventMs = eventTick × 1000/30, where
// eventTick = world.tick read right after the step that made the events, and a run (one World) starts at tick 0. The picture clock is
// (tick − 1 + alpha) × 1000/30 while playing — the time the scene is drawn at (§14.7) —, holds while paused or frozen, and runs with
// the UI frame time once the world is finished (the winning hit's number still fades out).
import type { World, SimEvent, Telegraph } from '../../shared/sim/world.ts';
import {
  FloatBook, STYLE, NUMERIC, CAPS, SPARK, scaleAt, opacityAt, pathPoints, bezier, sparkSpots, grow, overlapArea,
  type FKind, type FIn, type FQuality, type GlyphBox, type Geo, type Label, type Rect, type Attempt,
} from './floatCore.ts';

export interface FloatHost {
  /** body rect of an actor in CSS px; 0 = ok, 1 = no longer drawn, 2 = off screen */
  actorRect(id: number, out: Rect): 0 | 1 | 2;
  project(x: number, y: number, z: number, out: { x: number; y: number; vis: boolean }): unknown;
}

const FONT = 'system-ui, -apple-system, "Segoe UI", "Noto Sans Thai", "Thonburi", sans-serif';
/** metres around a warning shape (its bright edge sits on the boundary), as in buttonFade */
const EDGE = 0.3;
/** an ended warning still flashes / bursts for this long (view.ts: ring 0.25 s, particles 0.4 s) */
const AFTER_MS = 400;
/** one sim tick on the picture clock */
const TICK_MS = 1000 / 30;
/** the longest UI frame step the finished-world clock takes (s), as the game loop clamps its own dt */
const DT_MAX = 0.25;
/** events waiting for the frame that paints them: which run, which tick, and when that tick happened on the picture clock */
interface Batch { run: number; tick: number; eventMs: number; list: FIn[] }
/** HUD parts that numbers must never cover (§6.1 item 3); `on` = only while that class is set */
/** transitions that never move a HUD element's box */
const STILL = new Set(['opacity', 'filter', 'box-shadow', 'background', 'background-color', 'color', 'visibility']);
const HUD: { sel: string; on?: string }[] = [
  { sel: '.act' }, { sel: '#stick-base', on: 'on' }, { sel: '#top-left' }, { sel: '#top-right' }, { sel: '#boss', on: 'show' },
  { sel: '#hint', on: 'show' }, { sel: '#banner', on: 'show' }, { sel: '#auto-bar' }, { sel: '.overlay', on: 'show' },
];

/** QA fixture: an extra protected area, optionally moving one edge outwards by `px` over `ms` of the picture clock from `from` */
export interface QaBlocker extends Rect { move?: { edge: 't' | 'b'; px: number; ms: number; from: number } }
interface NumEl { root: HTMLElement; o: HTMLElement; i: HTMLElement; f: HTMLElement; badge: HTMLElement; uid: number; text: string }
interface StEl { root: HTMLElement; s: HTMLElement; uid: number; text: string }
interface SparkEl { a: HTMLElement; b: HTMLElement; uid: number }

/** per-frame flags of the CPU samples (QA): events placed this frame; HUD re-read because a part was moving / everything re-read
 *  (a change or the 2 s timer) / a newly shown part; a glyph measured for the first time */
export const FF = { events: 1, hudBusy: 2, hudAll: 4, hudShow: 8, measure: 16 } as const;
const RING = 7200, SPIKE_MS = 8;
const noParts = () => ({ intake: 0, screen: 0, warn: 0, body: 0, flush: 0, hud: 0, book: 0, paint: 0 });
type Parts = ReturnType<typeof noParts>;
/** QA: one frame worth keeping (over 8 ms, the first with events, or the worst) */
export interface Spike { frame: number; clock: number; tick: number; ms: number; parts: Parts; events: number; labels: number; flags: number; measures: number; hudReads: string[]; heapDeltaKB: number | null }

export class Floaters {
  readonly book = new FloatBook();
  private host: FloatHost | null = null;
  private nums: NumEl[] = []; private sts: StEl[] = []; private sparks: SparkEl[] = [];
  private byUid = new Map<number, NumEl | StEl>();
  private ctx = document.createElement('canvas').getContext('2d')!;
  private measures = new Map<string, GlyphBox | null>();
  /** HUD rects are cached: reading them every frame forces a layout (≈1 ms/frame on the test PC). Re-read on resize, show/hide,
   *  an element's own size change, a CSS transition that can move it / an animation on it (until it ends), joystick moves, and every 2 s. */
  private hudEls: { el: HTMLElement; on?: string; tag: string; r: Rect | null; shown: boolean; busy: number }[] = [];
  private hudDirty = true; private hudAt = -1e9;
  private probe: HTMLElement;
  private safe: Rect = { l: 0, t: 0, r: 0, b: 0 };
  private screenDirty = true;
  private S = 1;
  private prot: Rect[] = [];
  private teleSeen = new Map<number, { t: Telegraph; until: number }>();
  private world: World | null = null;
  private pt = { x: 0, y: 0, vis: false };
  private bz = { x: 0, y: 0 };
  private path = new Array<number>(8);
  private noClip = !CSS.supports('(-webkit-background-clip: text) or (background-clip: text)');
  private noStroke = !CSS.supports('-webkit-text-stroke', '1px black');
  private debug: HTMLCanvasElement | null = null;
  /** batches waiting for the frame that paints them */
  private queue: Batch[] = [];
  /** the run the labels belong to: a new world or a retry starts a new one, and batches of an older one are never placed */
  private run = 0;
  /** QA: how far QA has moved this run's clock beyond its ticks (added to sim event times too, so both stay on one clock) */
  private qaOffset = 0;
  /** the world has been seen finished: from then on the clock runs with the UI frame time */
  private finished = false;
  /** QA: overlay CPU per rendered frame = event intake since the last frame + screen + gather + placement + paint (ring + flags). The
   *  overlap / DOM checks and the debug drawing are tool costs: timed apart (toolMs), not in the sample. */
  qa = { ms: new Float32Array(RING), flags: new Uint8Array(RING), n: 0, over8: 0, spikes: [] as Spike[], worst: null as Spike | null, firstHit: null as Spike | null,
    maxDom: 0, paintedOverlap: 0, domOutsideR: 0, frames: 0, part: noParts(), toolMs: { check: 0, debug: 0 }, deep: false,
    hudRead: { dirty: 0, timer: 0, busy: {} as Record<string, number>, fresh: 0 }, attempts: [] as Attempt[],
    ends: [] as { uid: number; cause: string; why: string; age: number; readable: boolean; painted: boolean }[] };
  private recording = false;
  private blockers: QaBlocker[] = [];
  private cur = noParts(); private curFlags = 0; private curMeasures = 0; private curHudReads: string[] = []; private curEvents = 0;

  private layer: HTMLElement;

  constructor(layer: HTMLElement, opts: { debug?: boolean } = {}) {
    this.layer = layer;
    this.probe = document.createElement('div');
    this.probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
    document.body.appendChild(this.probe);
    this.hudEls = HUD.flatMap((h) => [...document.querySelectorAll<HTMLElement>(h.sel)].map((el) => ({ el, on: h.on, tag: 'hud' + (el.id ? '#' + el.id : h.sel), r: null, shown: false, busy: 0 })));
    const hudDirty = () => { this.hudDirty = true; };
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(hudDirty) : null;
    const mo = typeof MutationObserver === 'function' ? new MutationObserver(hudDirty) : null;
    for (const h of this.hudEls) {
      ro?.observe(h.el);
      if (h.on === 'on') mo?.observe(h.el, { attributes: true, attributeFilter: ['style'] }); // the floating stick moves by style.left/top
      // only changes that can move the element's own box count (opacity/filter fades and pseudo-element layers do not)
      const moves = (e: Event) => e.target === h.el && !(e as TransitionEvent).pseudoElement && (!(e instanceof TransitionEvent) || !STILL.has(e.propertyName));
      const start = (e: Event) => { if (moves(e)) h.busy++; };
      const end = (e: Event) => { if (moves(e)) { h.busy = Math.max(0, h.busy - 1); this.hudDirty = true; } };
      h.el.addEventListener('transitionrun', start); h.el.addEventListener('animationstart', start);
      for (const k of ['transitionend', 'transitioncancel', 'animationend', 'animationcancel']) h.el.addEventListener(k, end);
    }
    this.book.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => { this.book.reduced = e.matches; this.book.clear('motion'); }); } catch { /* old Safari */ }
    if (opts.debug) {
      this.debug = document.createElement('canvas'); this.debug.className = 'fl-debug';
      layer.appendChild(this.debug);
    }
    this.book.onRetire = (l, cause, why) => {
      this.free(l);
      if (this.recording) this.qa.ends.push({ uid: l.uid, cause, why, age: Math.round(this.book.age(l)), readable: l.readable, painted: l.painted });
    };
    const dirty = () => { this.screenDirty = true; this.hudDirty = true; };
    addEventListener('resize', dirty); addEventListener('orientationchange', dirty);
    this.buildPool('medium');
  }

  setHost(h: FloatHost) { this.host = h; }
  setQuality(q: FQuality) { if (q === this.book.q && this.nums.length) return; this.book.clear('quality'); this.book.q = q; this.buildPool(q); }
  /** retry (or a QA wipe): no label and no waiting batch from before survives into what comes next */
  clear(why = 'retry') { this.book.clear(why); this.teleSeen.clear(); this.queue.length = 0; this.curEvents = 0; this.run++; }
  /** the result screen of `w` appears: its labels and waiting batches are cleared before it paints (§14.7 G1) */
  resultScreen(w: World) { if (w === this.world) this.clear('result-screen'); }
  /** the labels follow one run at a time: a new world drops the old one's labels and batches and starts its clock at 0 */
  private attach(w: World) {
    if (w === this.world) return;
    this.clear('run');
    this.world = w; this.qaOffset = 0; this.finished = false;
    this.book.resync(0);
  }
  /** §14.3 / §14.7: the picture clock of a frame. alpha: 0..1 between ticks while playing, null = hold (paused / frozen);
   *  dtSec: UI seconds of this frame (0 while paused / frozen), used only once the world is finished */
  private tickClock(w: World, alpha: number | null, dtSec: number) {
    const book = this.book;
    if (w.finished) {
      if (!this.finished) { this.finished = true; book.setClock(Math.max(book.clock, w.tick * TICK_MS + this.qaOffset)); } // once: joins at alpha 1, no dt
      else book.setClock(book.clock + Math.min(DT_MAX, Math.max(0, dtSec)) * 1000);
    } else if (alpha !== null) book.setClock(Math.max(0, (w.tick - 1 + Math.min(1, Math.max(0, alpha))) * TICK_MS + this.qaOffset));
  }
  /** QA, with the sim frozen: move this run's picture clock on by `ms`; later sim events keep their distance from it */
  qaAdvance(ms: number) { this.qaOffset += ms; this.book.setClock(this.book.clock + ms); }
  /** QA: keep the geometry of every placement attempt, for a checker script that shares no code with floatCore */
  record(on: boolean) {
    const list = this.qa.attempts;
    this.recording = on;
    this.book.onAttempt = on ? (a) => { list.push(a); if (list.length > 6000) list.shift(); } : null;
    if (!on) { list.length = 0; this.qa.ends.length = 0; }
  }
  /** QA: protected areas for a fixture, added to the real ones every frame until replaced */
  qaBlockers(list: QaBlocker[]) { this.blockers = list.map((b) => ({ ...b })); }
  /** QA: what this frame set for painting — each label's element opacity (0 when it has none), its R and the area R shares with any
   *  protected rect of this frame */
  paintState() {
    const round = (v: number) => Math.round(v * 100) / 100;
    return {
      clock: this.book.clock, domOutsideR: this.qa.domOutsideR,
      labels: this.book.labels.map((l) => {
        const el = this.byUid.get(l.uid), shown = !!el && el.root.style.display !== 'none';
        return { uid: l.uid, kind: l.kind, text: l.text, op: shown ? Number(el.root.style.opacity) : 0, R: { l: round(l.screen.l), t: round(l.screen.t), r: round(l.screen.r), b: round(l.screen.b) },
          shared: this.prot.reduce((n, p) => n + overlapArea(l.screen, p), 0) };
      }),
    };
  }
  /** QA: take what record() collected since the last call */
  drain() { return { attempts: this.qa.attempts.splice(0), ends: this.qa.ends.splice(0) }; }
  /** QA: start a new CPU window (after a warm-up); the cold first-hit sample is kept. deep: also note the JS heap change of kept frames */
  perfReset(deep = false) {
    const q = this.qa; q.n = 0; q.over8 = 0; q.spikes.length = 0; q.worst = null; q.maxDom = 0; q.paintedOverlap = 0; q.domOutsideR = 0; q.frames = 0;
    q.part = noParts(); q.toolMs = { check: 0, debug: 0 }; q.hudRead = { dirty: 0, timer: 0, busy: {}, fresh: 0 }; q.deep = deep;
  }

  // ------------------------------------------------------------------ pool (§5.2 DOM budget: Medium 52, Low 34 elements)
  private buildPool(q: FQuality) {
    for (const n of this.nums) n.root.remove(); for (const s of this.sts) s.root.remove(); for (const k of this.sparks) { k.a.remove(); k.b.remove(); }
    this.nums = []; this.sts = []; this.sparks = []; this.byUid.clear();
    const c = CAPS[q];
    const mk = (cls: string, parent: HTMLElement, tag = 'span') => { const e = document.createElement(tag); e.className = cls; parent.appendChild(e); return e; };
    // sparks first so they sit behind the words
    for (let i = 0; i < (c.sparks ? SPARK.max : 0); i++) {
      const a = mk('fl-spark a', this.layer, 'i'), b = mk('fl-spark b', this.layer, 'i');
      a.setAttribute('aria-hidden', 'true'); b.setAttribute('aria-hidden', 'true'); this.sparks.push({ a, b, uid: 0 });
    }
    for (let i = 0; i < c.num; i++) {
      const root = mk('fl fl-num', this.layer, 'div'); root.setAttribute('aria-hidden', 'true');
      if (this.noStroke) root.classList.add('nostroke');
      if (this.noClip) root.classList.add('noclip');
      this.nums.push({ root, o: mk('fl-o', root), i: mk('fl-i', root), f: mk('fl-f', root), badge: mk('fl-badge', root), uid: 0, text: '' });
    }
    for (let i = 0; i < c.status; i++) {
      const root = mk('fl fl-st', this.layer, 'div'); root.setAttribute('aria-hidden', 'true');
      if (this.noStroke) root.classList.add('nostroke');
      this.sts.push({ root, s: mk('fl-s', root), uid: 0, text: '' });
    }
    if (this.debug) this.layer.appendChild(this.debug);
  }
  private free(l: Label) {
    const el = this.byUid.get(l.uid); if (el) { el.root.style.display = 'none'; el.uid = 0; this.byUid.delete(l.uid); }
    for (const k of this.sparks) if (k.uid === l.uid) { k.a.style.display = 'none'; k.b.style.display = 'none'; k.uid = 0; }
  }
  private bind(l: Label) {
    let el = this.byUid.get(l.uid);
    if (el) return el;
    if (NUMERIC[l.kind]) {
      const n = this.nums.find((x) => !x.uid); if (!n) return null;
      n.uid = l.uid; el = n;
      const st = STYLE[l.kind], [g0, g1, g2] = st.fill as readonly string[];
      const r = n.root.style;
      r.setProperty('--oc', st.outer[1]); r.setProperty('--ow', `${st.outer[0] * this.S}px`);
      r.setProperty('--ic', st.inner![1]); r.setProperty('--iw', `${st.inner![0] * this.S}px`);
      r.setProperty('--g0', g0); r.setProperty('--g1', g1); r.setProperty('--g2', g2); r.setProperty('--sh', `${3 * this.S}px`);
      if (this.noStroke) {
        n.o.style.textShadow = ring(4 * this.S, st.outer[1]) + `, 0 ${3 * this.S}px 0 #120D24`;
        n.i.style.textShadow = ring(1 * this.S, st.inner![1]);
      }
    } else {
      const s = this.sts.find((x) => !x.uid); if (!s) return null;
      s.uid = l.uid; el = s;
      const st = STYLE[l.kind], r = s.root.style;
      s.root.classList.toggle('early', l.kind === 'early');
      r.setProperty('--c', st.fill as string); r.setProperty('--oc', st.outer[1]); r.setProperty('--ow', `${st.outer[0] * this.S}px`);
      if (this.noStroke) s.s.style.textShadow = ring((l.kind === 'early' ? 1 : 1.5) * this.S, st.outer[1]) + `, 0 ${2 * this.S}px 0 rgba(18,13,36,0.65)`;
    }
    this.byUid.set(l.uid, el);
    el.root.style.display = 'block';
    el.text = '';
    return el;
  }

  // ------------------------------------------------------------------ measuring (§3.2: cached by font/size/text)
  private box = (kind: FKind, text: string, count: number): GlyphBox | null => {
    const key = `${kind}|${this.S.toFixed(3)}|${text}|${count > 1 ? count : 0}`;
    if (this.measures.has(key)) return this.measures.get(key)!;
    this.curMeasures++; this.curFlags |= FF.measure;
    const st = STYLE[kind], num = NUMERIC[kind], S = this.S;
    const maxW = (num ? 180 : 170) * S, minSize = num ? 24 : 18;
    let size = Math.max(minSize, st.size * S), out: GlyphBox | null = null;
    const badge = num && count > 1 ? this.text(`รวม ${count}`, 700, 14 * S) : null;
    const badgeW = badge ? badge.w + 2 * S : 0, badgeH = badge ? 14 * S * 1.3 + 2 * S : 0;
    for (; size >= minSize - 1e-6; size -= 1) {
      const m = this.text(text, st.weight, size);
      const stroke = st.outer[0] * S, shadow = (num ? 3 : 2) * S;
      let w = m.w + stroke, h = Math.max(size * st.lineH, m.h + stroke) + shadow;
      if (kind === 'early') { w += 2 * 8 * S + 2; h += 2 * 3 * S + 2; }
      if (w + (badge ? 5 * S + badgeW : 0) <= maxW) { out = { w, h, badgeW, badgeH, size }; break; }
    }
    this.measures.set(key, out);
    if (this.measures.size > 600) this.measures.clear();
    return out;
  };
  private text(t: string, weight: number, size: number) {
    this.ctx.font = `${weight} ${size}px ${FONT}`;
    const m = this.ctx.measureText(t);
    const w = Math.max(m.width, (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || 0));
    const h = (m.actualBoundingBoxAscent || size * 0.8) + (m.actualBoundingBoxDescent || size * 0.2);
    return { w, h };
  }

  // ------------------------------------------------------------------ events → batch (§2)
  /** one sim tick's events, read right after its step (its cost is added to the next frame's CPU sample) */
  take(w: World, evts: readonly SimEvent[], earlyOk: (e: SimEvent) => boolean) {
    const t0 = performance.now();
    const list = Floaters.fromEvents(w, evts, earlyOk);
    this.attach(w);
    this.enqueue(w.tick, w.tick * TICK_MS + this.qaOffset, list);
    this.cur.intake += performance.now() - t0;
  }
  /** QA: a batch with an explicit time on the picture clock (default: now, so injected groups follow the QA clock) */
  ingest(w: World, evts: readonly FIn[], atMs?: number) {
    this.attach(w);
    this.enqueue(w.tick, atMs ?? this.book.clock, evts);
  }
  /** keep a batch for the frame that paints it, with its run, tick and time (the event index within the tick is FIn.order) */
  private enqueue(tick: number, eventMs: number, evts: readonly FIn[]) {
    if (!this.host || !evts.length) return;
    this.queue.push({ run: this.run, tick, eventMs, list: evts.slice() }); this.curEvents += evts.length;
  }
  /** this run's waiting batches in source order; batches of one time (the same tick) form one, so priority order holds within it */
  private waiting() {
    const out: Batch[] = [];
    for (const b of this.queue.filter((x) => x.run === this.run).sort((a, b) => a.eventMs - b.eventMs)) {
      const last = out[out.length - 1];
      if (last && last.eventMs === b.eventMs) last.list.push(...b.list); else out.push({ ...b, list: b.list.slice() });
    }
    return out;
  }
  static fromEvents(w: World, evts: readonly SimEvent[], earlyOk: (e: SimEvent) => boolean): FIn[] {
    const out: FIn[] = [], p = w.player;
    const d = (id: number) => { const a = w.actors.find((x) => x.id === id); return a ? Math.hypot(a.x - p.x, a.z - p.z) : 1e9; };
    evts.forEach((e, order) => {
      if (e.t === 'hit') out.push({ kind: e.byPlayer ? (e.crit ? 'bonus' : 'damage') : 'hurt', actor: e.target, amount: e.amount, dist: d(e.target), order });
      else if (e.t === 'heal') out.push({ kind: 'heal', actor: p.id, amount: e.amount, dist: 0, order });
      else if (e.t === 'perfect') out.push({ kind: 'perfect', actor: p.id, amount: 0, dist: 0, order });
      else if (e.t === 'dodge-early' && earlyOk(e)) out.push({ kind: 'early', actor: p.id, amount: 0, dist: 0, order });
      else if (e.t === 'interrupt') out.push({ kind: 'interrupt', actor: e.id, amount: 0, dist: d(e.id), order });
      else if (e.t === 'stun') out.push({ kind: 'stagger', actor: e.id, amount: 0, dist: d(e.id), order });
    });
    return out;
  }

  // ------------------------------------------------------------------ protected areas (§6.1)
  private refreshScreen() {
    if (!this.screenDirty) return;
    this.screenDirty = false;
    const cs = getComputedStyle(this.probe), px = (v: string) => parseFloat(v) || 0;
    const W = innerWidth, H = innerHeight;
    this.safe = { l: px(cs.paddingLeft), t: px(cs.paddingTop), r: W - px(cs.paddingRight), b: H - px(cs.paddingBottom) };
    const S = Math.min(1.25, Math.max(0.85, Math.min((this.safe.r - this.safe.l) / 844, (this.safe.b - this.safe.t) / 390)));
    if (Math.abs(S - this.S) > 1e-3) { this.S = S; this.measures.clear(); }
  }
  private gather(w: World, bars: readonly Rect[]) {
    const S = this.S, prot = this.prot; prot.length = 0;
    const q0 = performance.now();
    // 1. every warning being drawn, plus the flash right after it ends
    const now = this.book.clock, live = new Set<number>();
    for (const t of w.tele) { live.add(t.id); this.teleSeen.set(t.id, { t, until: Infinity }); }
    for (const [id, v] of this.teleSeen) {
      if (!live.has(id) && v.until === Infinity) v.until = now + AFTER_MS;
      if (v.until <= now) { this.teleSeen.delete(id); continue; }
      const r = this.teleRect(v.t, v.until !== Infinity);
      if (!r) { prot.push(tag({ l: -1e6, t: -1e6, r: 1e6, b: 1e6 }, 'warn-near')); break; } // too close to project: the whole view is protected this frame
      prot.push(tag(grow(r, 8 * S), 'warn'));
    }
    // 2. bodies of everything still drawn (+6), and the enemy HP bars (+4)
    const q1 = performance.now();
    const a: Rect = { l: 0, t: 0, r: 0, b: 0 };
    for (const x of w.actors) if (this.host!.actorRect(x.id, a) === 0) prot.push(tag(grow(a, 6 * S), x.id === w.player.id ? 'player' : 'body'));
    for (const b of bars) prot.push(tag(grow(b, 4 * S), 'bar'));
    // 3. visible HUD (+8); touch zones without a picture are not reserved
    // QA deep mode only: flush any pending style/layout of the whole page first, so the HUD reads below are timed without it
    const f0 = performance.now(); if (this.qa.deep) { void document.body.offsetHeight; this.cur.flush += performance.now() - f0; }
    const q2 = performance.now();
    const all = this.hudDirty || q2 - this.hudAt > 2000;
    if (all) { if (this.hudDirty) this.qa.hudRead.dirty++; else this.qa.hudRead.timer++; this.hudDirty = false; this.hudAt = q2; this.curFlags |= FF.hudAll; }
    for (const h of this.hudEls) {
      const shown = !h.on || h.el.classList.contains(h.on);
      if (shown !== h.shown) { h.shown = shown; h.r = null; h.busy = 0; } // a show re-reads at once; its slide-in fires transitionrun
      if (!shown) continue;
      if (!all && h.busy > 0) { this.qa.hudRead.busy[h.tag] = (this.qa.hudRead.busy[h.tag] || 0) + 1; this.curFlags |= FF.hudBusy; }
      if (!all && !h.r) { this.qa.hudRead.fresh++; this.curFlags |= FF.hudShow; }
      if (all || h.busy > 0 || !h.r) {
        this.curHudReads.push(h.tag);
        const r = h.el.getBoundingClientRect();
        h.r = r.width > 0 && r.height > 0 ? { l: r.left, t: r.top, r: r.right, b: r.bottom } : { l: 0, t: 0, r: 0, b: 0 };
      }
      if (h.r.r > h.r.l) prot.push(tag(grow({ ...h.r }, 8 * S), h.tag));
    }
    for (const b of this.blockers) {
      const k = b.move ? Math.min(1, Math.max(0, (this.book.clock - b.move.from) / b.move.ms)) * b.move.px : 0;
      prot.push(tag({ l: b.l, r: b.r, t: b.move?.edge === 't' ? b.t - k : b.t, b: b.move?.edge === 'b' ? b.b + k : b.b }, 'qa'));
    }
    const p = this.cur; p.warn += q1 - q0; p.body += f0 - q1; p.hud += performance.now() - q2;
  }
  /** Conservative screen AABB of a warning: the shape's world outline (grown by EDGE) projected; null = a point could not be projected. */
  private teleRect(t: Telegraph, after: boolean): Rect | null {
    const out = { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity };
    const add = (x: number, z: number) => {
      this.host!.project(x, 0.08, z, this.pt);
      if (!this.pt.vis) return false;
      out.l = Math.min(out.l, this.pt.x); out.r = Math.max(out.r, this.pt.x); out.t = Math.min(out.t, this.pt.y); out.b = Math.max(out.b, this.pt.y);
      return true;
    };
    const k8 = 1 / Math.cos(Math.PI / 8); // octagon that contains the circle
    if (t.shape === 'circle') {
      const R = (t.r * (after ? 1.05 : 1) + EDGE) * k8;
      for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 + Math.PI / 8; if (!add(t.x + Math.cos(a) * R, t.z + Math.sin(a) * R)) return null; }
    } else if (t.shape === 'line') {
      const px = -t.dz, pz = t.dx, hw = t.w / 2 + EDGE;
      for (const a of [-EDGE, t.r + EDGE]) for (const s of [-1, 1]) if (!add(t.x + t.dx * a + px * hw * s, t.z + t.dz * a + pz * hw * s)) return null;
    } else {
      const half = Math.acos(Math.max(-1, Math.min(1, t.cos))) + 0.12, base = Math.atan2(t.dz, t.dx), R = t.r + EDGE;
      const steps = Math.max(2, Math.ceil((2 * half) / (Math.PI / 8))), step = (2 * half) / steps, Rk = R / Math.cos(step / 2);
      if (!add(t.x - t.dx * EDGE, t.z - t.dz * EDGE)) return null;
      for (let i = 0; i <= steps; i++) { const a = base - half + i * step; if (!add(t.x + Math.cos(a) * Rk, t.z + Math.sin(a) * Rk)) return null; }
    }
    return out;
  }
  private geo(): Geo { return { S: this.S, safe: this.safe, prot: this.prot, actor: (id, out) => this.host!.actorRect(id, out), box: this.box }; }

  // ------------------------------------------------------------------ per frame
  /** one rendered frame. alpha: 0..1 between ticks while playing, null while paused / frozen; dtSec: UI seconds of this frame (0 while
   *  paused / frozen; only a finished world's clock uses it). bars: enemy HP bar rects drawn in this layer. */
  frame(w: World, alpha: number | null, dtSec: number, bars: readonly Rect[]) {
    const qa = this.qa, heap0 = qa.deep ? heapKB() : null; // QA only, read outside the timed span
    const t0 = performance.now();
    this.attach(w);
    if (!this.host) return;
    const book = this.book;
    this.tickClock(w, alpha, dtSec);
    this.refreshScreen();
    const t1 = performance.now();
    this.gather(w, bars);
    const t2 = performance.now(), geo = this.geo();
    book.frame(geo); // live labels move to this frame's geometry first, so new ones are placed against where they really are
    const events = this.curEvents;
    if (this.queue.length) {
      for (const batch of this.waiting()) book.ingest(batch.list, geo, batch.eventMs);
      this.queue.length = 0; this.curEvents = 0; this.curFlags |= FF.events;
      book.frame(geo); // a merge made some R wider: checked again before it is painted
    }
    const t3 = performance.now();
    const q = book.q, R = book.reduced, S = this.S;
    for (const l of book.labels) {
      const el = this.bind(l); if (!el) continue;
      const age = book.age(l), u = Math.min(1, age / l.life);
      pathPoints(l.kind, l.s, S, q, R, this.path); bezier(this.path, u, this.bz);
      const sc = scaleAt(l.kind, age, q, R), op = opacityAt(l.kind, age, l.life, R);
      const x = l.ax + this.bz.x, y = l.ay + this.bz.y;
      if (el.text !== l.text) { el.text = l.text; this.fill(el, l); }
      el.root.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${sc.toFixed(3)})`;
      el.root.style.opacity = op.toFixed(3);
      book.notePaint(l, op); // §10.3 painted / readable counters follow what was really painted
      if (l.spark && age < SPARK.life) {
        let k = this.sparks.find((s) => s.uid === l.uid) ?? this.sparks.find((s) => !s.uid);
        if (k) {
          k.uid = l.uid;
          const p = sparkSpots(l.box, S), so = age < 30 ? (age / 30) * 0.85 : 0.85 * Math.max(0, 1 - (age - 30) / (SPARK.life - 30)), rise = -4 * S * (age / SPARK.life);
          k.a.style.display = k.b.style.display = 'block';
          k.a.style.transform = `translate3d(${(l.ax + p.ax).toFixed(1)}px,${(l.ay + p.ay + rise).toFixed(1)}px,0) rotate(-18deg) scale(${S.toFixed(3)})`;
          k.b.style.transform = `translate3d(${(l.ax + p.bx).toFixed(1)}px,${(l.ay + p.by + rise).toFixed(1)}px,0) rotate(20deg) scale(${S.toFixed(3)})`;
          k.a.style.opacity = k.b.style.opacity = so.toFixed(3);
        }
      } else for (const k of this.sparks) if (k.uid === l.uid) { k.a.style.display = k.b.style.display = 'none'; k.uid = 0; }
    }
    // the overlay's own cost for this rendered frame
    const t4 = performance.now(), c = this.cur;
    c.screen = t1 - t0; c.book = t3 - t2; c.paint = t4 - t3;
    const ms = t4 - t0 + c.intake;
    const i = qa.n % RING; qa.ms[i] = ms; qa.flags[i] = this.curFlags; qa.n++;
    const first = !qa.firstHit && events > 0, worst = !qa.worst || ms > qa.worst.ms;
    if (ms > SPIKE_MS || first || worst) {
      const heap1 = heap0 === null ? null : heapKB();
      const rec: Spike = { frame: qa.n, clock: Math.round(book.clock), tick: w.tick, ms: +ms.toFixed(2), parts: rounded(c), events, labels: book.labels.length, flags: this.curFlags,
        measures: this.curMeasures, hudReads: this.curHudReads.slice(), heapDeltaKB: heap0 === null || heap1 === null ? null : Math.round(heap1 - heap0) };
      if (ms > SPIKE_MS) { qa.over8++; if (qa.spikes.length < 100) qa.spikes.push(rec); }
      if (first) qa.firstHit = rec;
      if (worst) qa.worst = rec;
    }
    for (const k in c) { qa.part[k as keyof Parts] += c[k as keyof Parts]; c[k as keyof Parts] = 0; }
    this.curFlags = 0; this.curMeasures = 0; this.curHudReads.length = 0;
    // QA bookkeeping (tool cost, outside the sample): painted R against protected rects must be zero by construction
    const t5 = performance.now();
    qa.frames++;
    for (const l of book.labels) for (const p of this.prot) qa.paintedOverlap += overlapArea(l.screen, p);
    const dom = this.domLive(); if (dom > qa.maxDom) qa.maxDom = dom;
    const t6 = performance.now(); qa.toolMs.check += t6 - t5;
    if (this.debug) { this.drawDebug(); qa.toolMs.debug += performance.now() - t6; }
  }
  /** QA: counters (created ≠ painted ≠ readable), live labels, CPU of the current window and the kept frames (__synesQA.floaters) */
  report() {
    const q = this.qa, book = this.book, n = Math.min(q.n, RING);
    const stat = (keep: (flags: number) => boolean) => {
      const a: number[] = [];
      for (let i = 0; i < n; i++) if (keep(q.flags[i])) a.push(q.ms[i]);
      a.sort((x, y) => x - y);
      const pc = (p: number) => (a.length ? +a[Math.min(a.length - 1, Math.floor(p * a.length))].toFixed(3) : 0);
      return { n: a.length, p50: pc(0.5), p95: pc(0.95), max: a.length ? +a[a.length - 1].toFixed(3) : 0 };
    };
    const actor: Rect = { l: 0, t: 0, r: 0, b: 0 };
    return {
      ...structuredClone(book.stats),
      labels: book.labels.map((l) => ({ uid: l.uid, kind: l.kind, text: l.text, count: l.count, actor: l.actor, age: Math.round(book.age(l)), life: l.life, place: l.place,
        painted: l.painted, readable: l.readable, R: { ...l.screen }, body: this.host?.actorRect(l.actor, actor) === 0 ? { ...actor } : null })),
      clock: book.clock, run: this.run, live: book.labels.length, quality: book.q, reduced: book.reduced, S: this.S, pool: this.domPool(), maxDomLive: q.maxDom, frames: q.frames,
      paintedOverlap: q.paintedOverlap, domOutsideR: q.domOutsideR,
      cpuMs: { ...stat(() => true), over8: q.over8,
        eventFrames: stat((f) => (f & FF.events) !== 0), quietFrames: stat((f) => f === 0),
        hudMoving: stat((f) => (f & (FF.hudBusy | FF.hudShow)) !== 0), hudFullRead: stat((f) => (f & FF.hudAll) !== 0), newMeasure: stat((f) => (f & FF.measure) !== 0) },
      samplesOver8: q.over8, firstHit: q.firstHit, worst: q.worst, spikes: q.spikes.slice(),
      toolMsPerFrame: { check: +(q.toolMs.check / Math.max(1, q.frames)).toFixed(3), debug: +(q.toolMs.debug / Math.max(1, q.frames)).toFixed(3) },
      hudRead: structuredClone(q.hudRead), dropLog: book.dropLog.slice(), protected: this.prot.map((p) => ({ ...p })),
      partMsPerFrame: Object.fromEntries(Object.entries(q.part).map(([k, v]) => [k, +(v / Math.max(1, q.frames)).toFixed(3)])),
    };
  }
  private domLive() {
    let n = 0;
    for (const e of this.nums) if (e.uid) n += 4 + 1; // root + 3 layers + badge (badge hidden when count = 1 but still pooled)
    for (const e of this.sts) if (e.uid) n += 2;
    for (const k of this.sparks) if (k.uid) n += 2;
    return n;
  }
  /** elements in the pool (painted or not): the §5.2 budget counts these */
  domPool() { return this.nums.length * 5 + this.sts.length * 2 + this.sparks.length * 2; }

  private fill(el: NumEl | StEl, l: Label) {
    const S = this.S, st = STYLE[l.kind];
    if ('f' in el) {
      for (const s of [el.o, el.i, el.f]) { s.textContent = l.text; s.style.fontSize = `${l.box.size}px`; }
      if (l.count > 1) {
        el.badge.textContent = `รวม ${l.count}`; el.badge.style.display = 'block';
        el.badge.style.fontSize = `${14 * S}px`;
        el.badge.style.left = `${(l.box.w / 2 + 5 * S).toFixed(1)}px`; el.badge.style.top = `${(l.box.h / 2 - l.box.badgeH).toFixed(1)}px`;
      } else el.badge.style.display = 'none';
    } else { el.s.textContent = l.text; el.s.style.fontSize = `${l.box.size}px`; el.s.style.lineHeight = String(st.lineH); }
  }

  private drawDebug() {
    const c = this.debug!, W = innerWidth, H = innerHeight;
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const g = c.getContext('2d')!; g.clearRect(0, 0, W, H); g.lineWidth = 1;
    g.strokeStyle = 'rgba(255,80,80,0.9)'; for (const p of this.prot) g.strokeRect(p.l, p.t, p.r - p.l, p.b - p.t);
    g.strokeStyle = 'rgba(120,255,120,0.95)'; for (const l of this.book.labels) g.strokeRect(l.screen.l, l.screen.t, l.screen.r - l.screen.l, l.screen.b - l.screen.t);
    // DOM check: every painted layer must sit inside its R (catches a measuring error)
    for (const l of this.book.labels) {
      const el = this.byUid.get(l.uid); if (!el) continue;
      for (const s of el.root.children) {
        const b = (s as HTMLElement).getBoundingClientRect(); if (!b.width) continue;
        if (b.left < l.screen.l - 0.5 || b.right > l.screen.r + 0.5 || b.top < l.screen.t - 0.5 || b.bottom > l.screen.b + 0.5) this.qa.domOutsideR++;
      }
    }
  }
}

/** QA: name the kind of protected area (counted when it refuses a pattern or retires a label) */
function tag(r: Rect, k: string) { r.k = k; return r; }
const heapKB = () => { const m = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory; return m ? m.usedJSHeapSize / 1024 : null; };
const rounded = (p: Parts) => { const o = noParts(); for (const k in p) o[k as keyof Parts] = +p[k as keyof Parts].toFixed(2); return o; };

/** 8-direction text-shadow outline (fallback when -webkit-text-stroke is missing) */
function ring(r: number, c: string) {
  const d = r * Math.SQRT1_2;
  return [[r, 0], [-r, 0], [0, r], [0, -r], [d, d], [-d, d], [d, -d], [-d, -d]].map(([x, y]) => `${x.toFixed(2)}px ${y.toFixed(2)}px 0 ${c}`).join(', ');
}
