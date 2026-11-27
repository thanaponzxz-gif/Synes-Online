// DES-008 v3 §14.3 + §14.7: the timing contract, checked through the real DOM-layer host (Floaters) on a stand-in DOM (tests/fakeDom.ts).
// A tick's events wait for the frame that paints them, but each keeps the time of its own sim tick: eventTick = world.tick read right
// after the step that made the events, eventMs = eventTick × K (K = 1000/30; a run starts at tick 0). While playing the picture clock is
// C = max(previous, 0, (T − 1 + alpha) × K), the same time the scene draws actors, and a label's age is max(0, C − eventMs).
// 4 ticks = 133.333 ms, 5 = 166.667, 6 = 200.
import { describe, it, expect, beforeAll } from 'vitest';
import { installFakeDom, FakeElement } from './fakeDom.ts';
import { Floaters } from '../src/ui/floaters.ts';
import type { World, SimEvent } from '../shared/sim/world.ts';
import type { FQuality, Rect } from '../src/ui/floatCore.ts';

beforeAll(() => installFakeDom(844, 390));

/** one wide target in the lower middle of an empty 844x390 screen: room above and on both sides */
function rig(q: FQuality = 'medium') {
  const bodies = new Map<number, Rect>([[1, { l: 370, r: 470, t: 240, b: 330 }]]);
  const f = new Floaters(new FakeElement() as unknown as HTMLElement);
  f.setHost({
    actorRect: (id, out) => { const a = bodies.get(id); if (!a) return 1; Object.assign(out, a); return 0; },
    project: (_x, _y, _z, out) => { out.x = 422; out.y = 200; out.vis = true; return out; },
  });
  f.setQuality(q);
  const make = () => ({ tick: 0, tele: [], actors: [{ id: 1, x: 3, z: 0 }], player: { id: 0, x: 0, z: 0 } }) as unknown as World;
  const r = {
    f, bodies, world: make(), newWorld: () => (r.world = make()),
    send(tick: number, evts: SimEvent[]) { r.world.tick = tick; f.take(r.world, evts, () => true); },
    hit(tick: number, amount = 5, crit = false) { r.send(tick, [{ t: 'hit', byPlayer: true, crit, target: 1, amount } as SimEvent]); },
    stun(tick: number) { r.send(tick, [{ t: 'stun', id: 1, long: false } as unknown as SimEvent]); },
    /** one rendered frame: the sim is at `tick`, `alpha` between ticks; null = paused / frozen. dt = UI seconds of this frame (0 while
     *  paused / frozen); only a finished world's clock uses it */
    draw(tick: number, alpha: number | null = 0, dt = alpha === null ? 0 : 1 / 60) { r.world.tick = tick; f.frame(r.world, alpha, dt, []); },
    totals: () => f.book.labels.map((l) => l.total),
    /** age = max(0, C − eventMs) (§14.7) */
    ages: () => f.book.labels.map((l) => Math.max(0, f.book.clock - l.born)),
  };
  r.draw(0);
  return r;
}

describe('DES-008 v3 §14.3 through the host: batches waiting for one frame keep their own tick times', () => {
  it('ticks 4 apart (133.3 ms): Medium (120) keeps two numbers, Low (160) merges them', () => {
    const m = rig('medium'); m.hit(1, 5); m.hit(5, 6); m.draw(5, 0.5);
    expect(m.totals()).toEqual([5, 6]); expect(m.f.book.stats.merged).toBe(0);
    const low = rig('low'); low.hit(1, 5); low.hit(5, 6); low.draw(5, 0.5);
    expect(low.totals()).toEqual([11]); expect(low.f.book.stats.merged).toBe(1);
  });
  it('ticks 6 apart (200 ms) never merge, in either quality', () => {
    for (const q of ['medium', 'low'] as const) {
      const r = rig(q); r.hit(1, 5); r.hit(7, 6); r.draw(7, 0.5);
      expect(r.f.book.stats.merged).toBe(0);
      expect(r.f.book.stats.created + r.f.book.stats.dropCap + r.f.book.stats.dropPlace).toBe(2);
    }
  });
  it('ultimate pulses 0 / 6 / 12 drawn in one frame are never one group: the cap drops the extra ones, nothing merges', () => {
    for (const [q, made, capped] of [['medium', 2, 1], ['low', 1, 2]] as const) {
      const r = rig(q); r.hit(1, 9); r.hit(7, 15); r.hit(13, 21); r.draw(13, 0.5);
      expect(r.f.book.stats).toMatchObject({ merged: 0, created: made, dropCap: capped, dropPlace: 0 });
    }
  });
  it('status words dedup by source ticks: 5 ticks apart (166.7 ms) deduped; 6 apart (200 ms) not (then the status cap drops it)', () => {
    const a = rig(); a.stun(1); a.stun(6); a.draw(6, 0.5);
    expect(a.f.book.stats).toMatchObject({ created: 1, deduped: 1, dropCap: 0 });
    const b = rig(); b.stun(1); b.stun(7); b.draw(7, 0.5);
    expect(b.f.book.stats).toMatchObject({ created: 1, deduped: 0, dropCap: 1 });
  });
  it('each label is as old as its own tick, not as old as the frame that flushed it', () => {
    const r = rig(); r.hit(1, 5); r.hit(7, 6); r.draw(8, 0);
    expect(r.ages()[0]).toBeCloseTo(200, 6); expect(r.ages()[1]).toBeCloseTo(0, 6);
  });
  it('an event whose life ran out before it could be drawn is not created: counted as expired, apart from "no room"', () => {
    const r = rig(); r.hit(1, 5); r.draw(31, 0); // 1000 ms later; a Medium damage number lives 650
    expect(r.f.book.labels.length).toBe(0);
    expect(r.f.book.stats).toMatchObject({ created: 0, expired: 1, dropPlace: 0, dropCap: 0 });
  });
  it('a label is replaceable only 180 ms after its first real paint; an old event time from the queue does not count', () => {
    const a = rig('low'); a.hit(1, 5); a.hit(8, 30, true); a.draw(8, 0.5); // damage never painted before the bonus arrives
    expect(a.f.book.labels.map((l) => l.kind)).toEqual(['damage']); expect(a.f.book.stats.dropCap).toBe(1);
    const b = rig('low'); b.hit(1, 5); b.draw(3, 0); // first paint with opacity > 0 at C = 2K = 66.7 ms (age 33.3)
    b.hit(7, 30, true); b.draw(8, 0); // C = 7K: 233.3 − 66.7 = 166.7 ms shown: not yet
    expect(b.f.book.labels.map((l) => l.kind)).toEqual(['damage']); expect(b.f.book.stats.replaced).toBe(0);
    b.hit(8, 30, true); b.draw(9, 0); // 200 ms shown
    expect(b.f.book.labels.map((l) => l.kind)).toEqual(['bonus']); expect(b.f.book.stats.replaced).toBe(1);
  });
});

describe('DES-008 §14.7 G2: the picture clock is tick − 1 + alpha, the same time the scene shows', () => {
  const K = 1000 / 30;
  it('team A examples: frame T = t0 (alpha 0 or 1) → age 0; T = t0 + 1, alpha 0.5 → 16.667 ms', () => {
    const r = rig(); r.draw(9, 0.5); r.hit(10, 5);
    r.draw(10, 0); expect(r.ages()[0]).toBe(0);
    r.draw(10, 1); expect(r.ages()[0]).toBeCloseTo(0, 9);
    r.draw(11, 0.5); expect(r.ages()[0]).toBeCloseTo(K / 2, 9);
  });
  it('until the clock reaches the event the label has opacity 0 and counts as neither painted nor readable', () => {
    const r = rig(); r.draw(9, 0.5); r.hit(10, 5); r.draw(10, 0.5);
    expect(r.f.book.stats).toMatchObject({ created: 1, painted: 0, readable: 0 });
    r.draw(11, 0.5);
    expect(r.f.book.stats).toMatchObject({ painted: 1, readable: 0 });
  });
});

describe('DES-008 v3 §14.3 through the host: one clock per run', () => {
  const K = 1000 / 30;
  it('pause (or a frozen sim) holds the clock, and it never runs backwards after resume', () => {
    const r = rig(); r.hit(1, 5); r.draw(1, 0.8);
    const held = r.f.book.clock;
    expect(held).toBeCloseTo(0.8 * K, 6);
    for (let i = 0; i < 5; i++) r.draw(1, null);
    expect(r.f.book.clock).toBe(held);
    r.draw(1, 0.1); expect(r.f.book.clock).toBe(held); // resume restarts the accumulator at 0
    r.draw(2, 0.5); expect(r.f.book.clock).toBeCloseTo(1.5 * K, 6);
  });
  it('retry (clear) drops the waiting batches; no number from before survives into the new attempt', () => {
    const r = rig(); r.hit(50, 5); r.f.clear(); r.draw(51, 0);
    expect(r.f.book.labels.length).toBe(0); expect(r.f.book.stats.created).toBe(0);
    r.hit(52, 7); r.draw(52, 0.5);
    expect(r.totals()).toEqual([7]);
  });
  it('a new run (new world) drops the old batches and restarts the clock from its own ticks', () => {
    const r = rig(); r.hit(200, 5); r.draw(200, 0.5); r.hit(201, 6);
    r.newWorld(); r.draw(0, 0);
    expect(r.f.book.labels.length).toBe(0); expect(r.f.book.clock).toBeCloseTo(0, 6);
    r.hit(1, 8); r.draw(2, 0.5);
    expect(r.totals()).toEqual([8]); expect(r.ages()[0]).toBeCloseTo(K / 2, 6);
  });
  it('QA with a frozen sim: injected groups get the QA clock, so they are not all at the same time', () => {
    const r = rig(); r.draw(10, null);
    const sample = (amount: number) => r.f.ingest(r.world, [{ kind: 'damage', actor: 1, amount, dist: 0, order: 0 }]);
    sample(5); r.f.qaAdvance(200); sample(6); r.draw(10, null);
    expect(r.totals()).toEqual([5, 6]); expect(r.f.book.stats.merged).toBe(0);
    expect(r.ages()[0]).toBeCloseTo(200, 6); expect(r.ages()[1]).toBeCloseTo(0, 6);
  });
});

describe('DES-008 §14.7 G1: after the winning hit the sim stops but the numbers finish', () => {
  const K = 1000 / 30;
  /** play up to the winning tick 20: events of that tick, then the world is finished (step() no longer advances the tick) */
  function won() {
    const r = rig(); r.draw(19, 0.5); r.hit(20, 40, true);
    (r.world as { finished: boolean }).finished = true;
    return r;
  }
  it('the first finished frame sets C = tick × K once and adds no render dt: the final number starts at age 0', () => {
    const r = won(); r.draw(20, 1, 0.2);
    expect(r.f.book.clock).toBeCloseTo(20 * K, 9); expect(r.ages()[0]).toBeCloseTo(0, 9);
  });
  it('then the clock runs with the render dt (clamped to 0.25 s) while the tick stands still: it fades and expires', () => {
    const r = won(); r.draw(20, 1);
    r.draw(20, 1, 0.1); expect(r.ages()[0]).toBeCloseTo(100, 9); expect(r.f.book.stats.painted).toBe(1);
    r.draw(20, 1, 0.5); expect(r.ages()[0]).toBeCloseTo(350, 9);
    r.draw(20, 1, 0.25); r.draw(20, 1, 0.25); // 850 ms: a Medium bonus lives 850
    expect(r.f.book.labels.length).toBe(0); expect(r.f.book.stats.retiredLife).toBe(1);
  });
  it('a pause, a hidden app or a QA freeze after the win (dt 0) adds no age', () => {
    const r = won(); r.draw(20, 1); r.draw(20, 1, 0.1);
    for (let i = 0; i < 5; i++) r.draw(20, null, 0);
    expect(r.ages()[0]).toBeCloseTo(100, 9);
  });
  it('the result screen clears every label of the run before it paints, counted as a clear (result-screen), not a safety retire', () => {
    const r = won(); r.draw(20, 1); r.draw(20, 1, 0.1);
    r.f.resultScreen(r.world);
    expect(r.f.book.labels.length).toBe(0);
    expect(r.f.book.stats).toMatchObject({ cleared: 1, retiredSafety: 0, clearWhy: { 'result-screen': 1 } });
    r.draw(20, 1, 0.1); expect(r.f.book.labels.length).toBe(0);
  });
  it('a result screen of an older run does not touch the new one; the new run restarts its own clock', () => {
    const r = won(); r.draw(20, 1); const old = r.world;
    r.newWorld(); r.draw(0, 0); r.hit(1, 8); r.draw(2, 0.5);
    r.f.resultScreen(old);
    expect(r.totals()).toEqual([8]); expect(r.f.book.clock).toBeCloseTo(1.5 * K, 9);
  });
});

describe('DES-008 §5.2 caps through the host pool', () => {
  it('a burst of 32 hits on 10 targets plus words stays within 12 labels / 8 numbers (Low 8 / 6) and the DOM pool 52 / 34', () => {
    for (const [q, total, num, pool] of [['medium', 12, 8, 52], ['low', 8, 6, 34]] as const) {
      const r = rig(q);
      for (let i = 2; i <= 11; i++) r.bodies.set(i, { l: 20 + (i - 2) * 82, r: 50 + (i - 2) * 82, t: i % 2 ? 130 : 260, b: i % 2 ? 160 : 330 });
      r.world.actors.length = 0; for (let i = 1; i <= 11; i++) r.world.actors.push({ id: i, x: i, z: 0 } as never);
      r.send(1, Array.from({ length: 32 }, (_, k) => ({ t: 'hit', byPlayer: true, crit: k % 7 === 0, target: 2 + (k % 10), amount: 3 + (k % 5) }) as SimEvent));
      r.send(1, [{ t: 'perfect' }, { t: 'interrupt', id: 2 }, { t: 'stun', id: 3 }] as unknown as SimEvent[]);
      r.draw(1, 0.9); r.draw(3, 0);
      const L = r.f.book.labels;
      expect(L.length).toBeLessThanOrEqual(total);
      expect(L.filter((l) => l.kind === 'damage' || l.kind === 'bonus').length).toBeLessThanOrEqual(num);
      expect(r.f.domPool()).toBe(pool);
      expect(r.f.report().paintedOverlap).toBe(0);
    }
  });
});
