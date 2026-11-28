// DES-007 §3.4: the player's VFX and sounds in `ninja-roam-1` are a picture of sim events (ADR-002: nothing goes back).
// Time t is in sim ticks, as in animPlan.ts: t = T shows the state after sim step T.
import { describe, it, expect } from 'vitest';
import { NinjaFxCore, FX, type C4, type V3, type FxCam, type FxPal } from '../src/seyrin/ninjaFxCore.ts';
import { ninjaTones, TONE } from '../src/seyrin/ninjaSfx.ts';
import { NINJA } from '../shared/data/tuning.ts';
import type { SimEvent } from '../shared/sim/world.ts';

// tagged colours: the tests tell the palette entries apart by their red channel
const PAL: FxPal = { lumen: [0.1, 0, 0], violet: [0.2, 0, 0], gold: [0.3, 0, 0] };
const CAM: FxCam = { r: [1, 0, 0], u: [0, 1, 0], f: [0, 0, -1] };
class Sink {
  tris: { p: V3[]; c: C4[] }[] = [];
  tri(a: V3, b: V3, c: V3, ca: C4, cb: C4, cc: C4) { this.tris.push({ p: [[...a], [...b], [...c]] as V3[], c: [[...ca], [...cb], [...cc]] as C4[] }); }
  of(col: V3) { return this.tris.filter((t) => t.c.every((c) => c[0] === col[0])); }
  get n() { return this.tris.length; }
  maxAlpha() { return Math.max(0, ...this.tris.flatMap((t) => t.c.map((c) => c[3]))); }
}
const actors = (list: Record<number, { x: number; z: number; top: number }>) => (id: number) => list[id] ?? null;
const draw = (fx: NinjaFxCore, t: number, at = actors({})) => { const s = new Sink(); fx.draw(s, t, CAM, at); return s; };
const start = (kind: string, tick: number, step = 0, id = 1): SimEvent => ({ t: 'action-start', id, kind: kind as never, step, startTick: tick, x: 0, z: 0, fx: 0, fz: 1 });
const pulse = (kind: string, tick: number, pulseIndex = 0, extra: object = {}, actionId = 1): SimEvent => ({ t: 'attack-pulse', actionId, kind: kind as never, pulseIndex, tick, x: 0, z: 0, fx: 0, fz: 1, ...extra });

describe('combo trail between the blade sockets', () => {
  const hit = NINJA.combo.steps.map((s) => s.hit);
  it('the hit ticks it leads up to are the design ones, 5 / 5 / 9', () => { expect(hit).toEqual([5, 5, 9]); });
  it.each([0, 1, 2])('step %i: drawn up to the edge, gone 3 ticks after it', (step) => {
    const fx = new NinjaFxCore(PAL, false);
    fx.observe([start('attack', 100, step)]);
    for (let k = 0; k <= hit[step] + 4; k += 0.5) fx.blade(100 + k, [k * 0.1, 1, 0], [k * 0.1, 1, 1]);
    const at = draw(fx, 100 + hit[step]);
    expect(at.n).toBeGreaterThan(0);
    expect(at.of(PAL.lumen).length).toBe(at.n);
    expect(draw(fx, 100 + hit[step] + FX.trail.fadeTicks - 0.01).n).toBeGreaterThan(0);
    expect(draw(fx, 100 + hit[step] + FX.trail.fadeTicks).n).toBe(0);
    expect(FX.trail.fadeTicks).toBe(3);
  });
  it('nothing is recorded after the edge, when no combo is running, or after a cancel', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.blade(50, [0, 1, 0], [0, 1, 1]); fx.blade(50.5, [1, 1, 0], [1, 1, 1]);
    expect(draw(fx, 50.5).n).toBe(0);
    fx.observe([start('attack', 100, 0)]);
    fx.blade(101, [0, 1, 0], [0, 1, 1]); fx.blade(102, [1, 1, 0], [1, 1, 1]);
    fx.observe([{ t: 'action-cancel', id: 1, kind: 'attack', tick: 102 }]);
    fx.blade(102.5, [2, 1, 0], [2, 1, 1]); fx.blade(103, [3, 1, 0], [3, 1, 1]);
    const s = draw(fx, 103);
    expect(s.n).toBeGreaterThan(0);
    expect(Math.max(...s.tris.flatMap((t) => t.p.map((p) => p[0])))).toBe(1);
  });
  it('a skill does not leave the combo trail', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.observe([start('echo_needle', 100)]);
    fx.blade(101, [0, 1, 0], [0, 1, 1]); fx.blade(102, [1, 1, 0], [1, 1, 1]);
    expect(draw(fx, 102).n).toBe(0);
  });
});

describe('needle and sound mark', () => {
  const spawn: SimEvent = { t: 'needle-spawn', id: 7, actionId: 1, tick: 105, x: 0, z: 0, dx: 0, dz: 1 };
  it('the needle is a lumen shape at the sim position, between two sim positions in between', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.observe([spawn]);
    expect(draw(fx, 104.9).n).toBe(0); // not on screen before its tick
    fx.tick(106); fx.observe([{ t: 'needle-move', id: 7, x: 0, z: 0.5 }]);
    const s = draw(fx, 105.5);
    expect(s.n).toBeGreaterThan(0);
    expect(s.of(PAL.lumen).length).toBe(s.n);
    const head = Math.max(...s.tris.flatMap((t) => t.p.map((p) => p[2])));
    expect(head).toBeCloseTo(0.25 + FX.needle.halfLen, 6);
  });
  it('gone once the sim removes it', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.observe([spawn]);
    fx.tick(106); fx.observe([{ t: 'needle-move', id: 7, x: 0, z: 0.5 }, { t: 'needle-despawn', id: 7, reason: 'hit' }]);
    expect(draw(fx, 105.5).n).toBeGreaterThan(0);
    expect(draw(fx, 106).n).toBe(0);
  });
  it('the mark is three violet strokes above the target until the sim ends it', () => {
    const fx = new NinjaFxCore(PAL, false), at = actors({ 4: { x: 2, z: 3, top: 1.2 } });
    fx.observe([{ t: 'mark-set', target: 4, tick: 110, refresh: false }]);
    const s = draw(fx, 111, at);
    expect(s.n).toBe(3 * 2);
    expect(s.of(PAL.violet).length).toBe(6);
    expect(Math.min(...s.tris.flatMap((t) => t.p.map((p) => p[1])))).toBeGreaterThan(1.2);
    expect(draw(fx, 150, at).n).toBe(6);
    fx.observe([{ t: 'mark-expire', target: 4, tick: 200, reason: 'time' }]);
    expect(draw(fx, 199.5, at).n).toBe(6);
    expect(draw(fx, 200, at).n).toBe(0);
  });
  it('a consumed mark breaks into lumen dots for 4 ticks', () => {
    const fx = new NinjaFxCore(PAL, false), at = actors({ 4: { x: 2, z: 3, top: 1.2 } });
    fx.observe([{ t: 'mark-set', target: 4, tick: 110, refresh: false }]);
    draw(fx, 120, at);
    fx.observe([{ t: 'mark-consume', target: 4, tick: 121, actionId: 2 }]);
    const s = draw(fx, 122, at);
    expect(s.of(PAL.violet).length).toBe(0);
    expect(s.of(PAL.lumen).length).toBeGreaterThan(0);
    expect(draw(fx, 121 + FX.mark.breakTicks, at).n).toBe(0);
    expect(FX.mark.breakTicks).toBe(4);
  });
  it('the mark moves to a new target, and is not drawn on a target that is not on screen', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.observe([{ t: 'mark-set', target: 4, tick: 110, refresh: false }]);
    fx.observe([{ t: 'mark-expire', target: 4, tick: 115, reason: 'moved' }, { t: 'mark-set', target: 5, tick: 115, refresh: false }]);
    expect(draw(fx, 116, actors({ 4: { x: 0, z: 0, top: 1 } })).n).toBe(0);
    const s = draw(fx, 116, actors({ 4: { x: 0, z: 0, top: 1 }, 5: { x: 9, z: 0, top: 1 } }));
    expect(s.n).toBe(6);
    expect(Math.min(...s.tris.flatMap((t) => t.p.map((p) => p[0])))).toBeGreaterThan(8);
  });
});

describe('shadow-thread step', () => {
  const seg = (tick: number, z0: number): SimEvent => pulse('shadow_thread', tick, tick - 103, { x: 0, z: z0, ex: 0, ez: z0 + 0.5 });
  it('two parallel violet lines on the corridor edges of the walked path, a lumen edge, gone 6 ticks later', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.observe([seg(103, 0)]);
    const s = draw(fx, 103);
    const xs = new Set(s.of(PAL.violet).flatMap((t) => t.p.map((p) => Math.sign(Math.round(p[0] * 100)))));
    expect(s.of(PAL.violet).length).toBe(2 * 2);
    expect(xs.has(1) && xs.has(-1)).toBe(true);
    expect(s.of(PAL.lumen).length).toBeGreaterThan(0);
    for (const t of s.tris) for (const p of t.p) { expect(p[2]).toBeGreaterThanOrEqual(-1e-9); expect(p[2]).toBeLessThanOrEqual(0.5 + 1e-9); }
    expect(draw(fx, 103 + FX.shadow.fadeTicks - 0.01).n).toBeGreaterThan(0);
    expect(draw(fx, 103 + FX.shadow.fadeTicks).n).toBe(0);
    expect(FX.shadow.fadeTicks).toBe(6);
  });
  it('Low keeps one violet line', () => {
    const fx = new NinjaFxCore(PAL, true);
    fx.observe([seg(103, 0)]);
    expect(draw(fx, 103).of(PAL.violet).length).toBe(2);
  });
  it('a pulse that walked nowhere (blocked at once) draws nothing', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.observe([pulse('shadow_thread', 103, 0, { x: 1, z: 1, ex: 1, ez: 1 })]);
    expect(draw(fx, 103).n).toBe(0);
  });
});

describe('resonant knot', () => {
  const H = NINJA.knot.hit;
  it('lumen threads during the prep, one edge at the hit, gone 8 ticks after it; no gold without a ✦ hit', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.observe([start('resonant_knot', 100)]);
    expect(draw(fx, 99.9).n).toBe(0);
    const prep = draw(fx, 107);
    expect(prep.n).toBeGreaterThan(0);
    expect(prep.of(PAL.lumen).length).toBe(prep.n);
    fx.observe([pulse('resonant_knot', 100 + H)]);
    const edge = draw(fx, 100 + H);
    expect(edge.of(PAL.gold).length).toBe(0);
    expect(edge.maxAlpha()).toBeGreaterThan(prep.maxAlpha());
    expect(draw(fx, 100 + H + FX.knot.fadeTicks - 0.01).n).toBeGreaterThan(0);
    expect(draw(fx, 100 + H + FX.knot.fadeTicks).n).toBe(0);
    expect([H, FX.knot.fadeTicks]).toEqual([14, 8]);
  });
  it('a gold rim only when the hit landed on a stunned (✦) target', () => {
    const hitOn = (stunned: boolean): SimEvent => ({ t: 'hit', target: 4, amount: 32, x: 0, z: 2, crit: false, byPlayer: true, sourceActionId: 1, sourceActionKind: 'resonant_knot', pulseIndex: 0, counterApplied: false, targetStunnedAtHit: stunned, markConsumed: false });
    for (const stunned of [false, true]) {
      const fx = new NinjaFxCore(PAL, false);
      fx.observe([start('resonant_knot', 100)]);
      fx.observe([pulse('resonant_knot', 100 + H), hitOn(stunned)]);
      expect(draw(fx, 100 + H + 1).of(PAL.gold).length > 0).toBe(stunned);
    }
  });
  it('the edge stays inside the sim range and cone', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.observe([start('resonant_knot', 100)]); fx.observe([pulse('resonant_knot', 100 + H)]);
    for (const t of draw(fx, 100 + H).tris) for (const p of t.p) {
      const d = Math.hypot(p[0], p[2]);
      expect(d).toBeLessThanOrEqual(NINJA.knot.range + 0.2);
      expect(p[2] / d).toBeGreaterThanOrEqual(NINJA.knot.cosHalf - 0.06);
    }
  });
  it('a dodge-cancel during the prep removes the threads and there is no edge', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.observe([start('resonant_knot', 100)]);
    fx.observe([{ t: 'action-cancel', id: 1, kind: 'resonant_knot', tick: 106 }]);
    expect(draw(fx, 105.5).n).toBeGreaterThan(0);
    expect(draw(fx, 106).n).toBe(0);
    expect(draw(fx, 100 + H).n).toBe(0);
  });
});

describe('the ult', () => {
  const hits = NINJA.loom.hits;
  it('nothing before the first pulse; violet ribbon and lumen edge per pulse; gone 8 ticks after the last', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.observe([start('lumen_loom', 100)]);
    expect(draw(fx, 100 + hits[0] - 0.1).n).toBe(0);
    const counts: number[] = [];
    hits.forEach((h, i) => {
      fx.observe([pulse('lumen_loom', 100 + h, i)]);
      const s = draw(fx, 100 + h);
      expect(s.of(PAL.violet).length).toBeGreaterThan(0);
      expect(s.of(PAL.lumen).length).toBeGreaterThan(0);
      expect(s.of(PAL.gold).length).toBe(0);
      counts.push(s.n);
    });
    expect(counts[1]).toBeGreaterThan(counts[0]); expect(counts[2]).toBeGreaterThan(counts[1]);
    expect(draw(fx, 100 + hits[2] + FX.loom.fadeTicks - 0.01).n).toBeGreaterThan(0);
    expect(draw(fx, 100 + hits[2] + FX.loom.fadeTicks).n).toBe(0);
    expect([[...hits], FX.loom.fadeTicks]).toEqual([[9, 15, 21], 8]);
  });
  it('cancelled after the first pulse: the later pulses never show and the first fades from the cancel', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.observe([start('lumen_loom', 100)]); fx.observe([pulse('lumen_loom', 109, 0)]);
    fx.observe([{ t: 'action-cancel', id: 1, kind: 'lumen_loom', tick: 111 }]);
    expect(draw(fx, 111 + FX.loom.fadeTicks - 0.01).n).toBeGreaterThan(0);
    expect(draw(fx, 111 + FX.loom.fadeTicks).n).toBe(0);
  });
  it('the edge stays inside the sim range and cone', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.observe([start('lumen_loom', 100)]);
    hits.forEach((h, i) => fx.observe([pulse('lumen_loom', 100 + h, i)]));
    for (const t of draw(fx, 121).tris) for (const p of t.p) {
      const d = Math.hypot(p[0], p[2]);
      expect(d).toBeLessThanOrEqual(NINJA.loom.range + 0.2);
      expect(p[2] / d).toBeGreaterThanOrEqual(NINJA.loom.cosHalf - 0.06);
    }
  });
});

describe('whole set', () => {
  it('a new round or a respawn clears everything', () => {
    const fx = new NinjaFxCore(PAL, false), at = actors({ 4: { x: 0, z: 0, top: 1 } });
    fx.observe([start('lumen_loom', 100), { t: 'mark-set', target: 4, tick: 100, refresh: false }]);
    fx.observe([pulse('lumen_loom', 109, 0)]);
    expect(draw(fx, 110, at).n).toBeGreaterThan(0);
    fx.observe([{ t: 'respawn', at: 'spring' }]);
    expect(draw(fx, 110, at).n).toBe(0);
  });
  it('no colour of the set is a warning colour, and alpha stays in 0..1', () => {
    const fx = new NinjaFxCore({ lumen: [0x5c / 255, 0xf2 / 255, 0xe6 / 255], violet: [0xa7 / 255, 0x8b / 255, 0xfa / 255], gold: [1, 0xc8 / 255, 0x57 / 255] }, false);
    fx.observe([start('lumen_loom', 100), { t: 'mark-set', target: 4, tick: 100, refresh: false }]);
    NINJA.loom.hits.forEach((h, i) => fx.observe([pulse('lumen_loom', 100 + h, i)]));
    const s = draw(fx, 121.5, actors({ 4: { x: 0, z: 0, top: 1 } }));
    for (const t of s.tris) for (const c of t.c) {
      expect(c[3]).toBeGreaterThanOrEqual(0); expect(c[3]).toBeLessThanOrEqual(1);
      const warm = c[0] > 0.9 && c[2] < 0.45 && c[1] < 0.6; // #FF3355 / #FF7A1A: red full, green and blue low
      expect(warm).toBe(false);
    }
  });
});

describe('sounds (triangle, gain 0.12, attack 5 ms, release 30 ms), once per sim event', () => {
  it('the envelope is the brief', () => { expect(TONE).toEqual({ type: 'triangle', gain: 0.12, attackMs: 5, releaseMs: 30 }); });
  it('needle 880 Hz 60 ms at the release', () => {
    expect(ninjaTones([{ t: 'needle-spawn', id: 1, actionId: 1, tick: 5, x: 0, z: 0, dx: 0, dz: 1 }])).toEqual([{ hz: 880, ms: 60, delayMs: 0 }]);
  });
  it('mark eaten: 660 Hz 40 ms, 20 ms apart, 880 Hz 40 ms', () => {
    expect(ninjaTones([{ t: 'mark-consume', target: 4, tick: 9, actionId: 2 }])).toEqual([{ hz: 660, ms: 40, delayMs: 0 }, { hz: 880, ms: 40, delayMs: 60 }]);
  });
  it('perfect 1174.66 Hz 100 ms', () => { expect(ninjaTones([{ t: 'perfect', x: 0, z: 0, dodgeId: 3 }])).toEqual([{ hz: 1174.66, ms: 100, delayMs: 0 }]); });
  it('the ult: one 80 ms tone per pulse that the sim really made', () => {
    expect([0, 1, 2].map((i) => ninjaTones([pulse('lumen_loom', 100, i)]))).toEqual([[{ hz: 587.33, ms: 80, delayMs: 0 }], [{ hz: 783.99, ms: 80, delayMs: 0 }], [{ hz: 1174.66, ms: 80, delayMs: 0 }]]);
  });
  it('other events, and pulses of other actions, are silent here', () => {
    expect(ninjaTones([pulse('attack', 100), pulse('resonant_knot', 100), { t: 'needle-move', id: 1, x: 0, z: 0 }, { t: 'mark-set', target: 4, tick: 1, refresh: false }])).toEqual([]);
  });
});
