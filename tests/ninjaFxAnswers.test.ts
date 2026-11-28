// Team A's answers F1–F8 (docs: DES-007-vfx-sizes-answers on lane/free-roam) and DES-007 §8.4.4 / §8.4.5: sizes, windows,
// the damage spark, the dodge groove, the perfect diamond, the counter-ready stroke and the camera impulse of `ninja-roam-1`.
import { describe, it, expect } from 'vitest';
import { NinjaFxCore, FX, type C4, type V3, type FxCam, type FxPal, type FxPlayer } from '../src/seyrin/ninjaFxCore.ts';
import { CamImpulse, IMPULSE, impulseOf } from '../src/seyrin/camImpulse.ts';
import type { SimEvent } from '../shared/sim/world.ts';

const PAL: FxPal = { lumen: [0.1, 0, 0], violet: [0.2, 0, 0], gold: [0.3, 0, 0], white: [0.4, 0, 0] };
const CAM: FxCam = { r: [1, 0, 0], u: [0, 1, 0], f: [0, 0, -1] };
class Sink {
  tris: { p: V3[]; c: C4[] }[] = [];
  tri(a: V3, b: V3, c: V3, ca: C4, cb: C4, cc: C4) { this.tris.push({ p: [[...a], [...b], [...c]] as V3[], c: [[...ca], [...cb], [...cc]] as C4[] }); }
  of(col: V3) { return this.tris.filter((t) => t.c.every((c) => c[0] === col[0])); }
  get n() { return this.tris.length; }
}
const ACT = (id: number) => (id === 1 ? { x: 0, z: 0, top: 1.5 } : id === 7 ? { x: 2, z: 0, top: 1.2 } : id === 8 ? { x: 0, z: 3, top: 2.8 } : null);
const ME: FxPlayer = { id: 1, fx: 0, fz: 1, counterReady: false, down: false };
const draw = (fx: NinjaFxCore, t: number, pl: FxPlayer = ME, ppm = 0) => { const s = new Sink(); fx.draw(s, t, CAM, ACT, pl, { S: 1, pxPerM: () => ppm }); return s; };
const start = (kind: string, tick: number, step = 0, id = 1): SimEvent => ({ t: 'action-start', id, kind: kind as never, step, startTick: tick, x: 0, z: 0, fx: 0, fz: 1 });
const hit = (kind: string, target: number, o: object = {}): SimEvent => ({ t: 'hit', target, amount: 10, x: ACT(target)!.x, z: ACT(target)!.z, crit: false, byPlayer: true,
  sourceActionId: 1, sourceActionKind: kind as never, pulseIndex: 0, counterApplied: false, targetStunnedAtHit: false, markConsumed: false, ...o });
const size = (tris: { p: V3[] }[]) => { const pts = tris.flatMap((t) => t.p); return [0, 1, 2].map((k) => Math.max(...pts.map((p) => p[k])) - Math.min(...pts.map((p) => p[k]))); };

describe('F1: the trail is collected over clip ticks 3..5 / 3..5 / 6..9 only', () => {
  it.each([[0, 3, 5], [1, 3, 5], [2, 6, 9]])('step %i: nothing before tick %i, nothing collected after tick %i', (step, from, to) => {
    const fx = new NinjaFxCore(PAL, false);
    fx.observe([start('attack', 100, step)]);
    for (let k = 0; k <= to + 3; k += 0.5) fx.blade(100 + k, [k, 1, 0], [k, 1, 1]);
    expect(draw(fx, 100 + from).n).toBe(0); // the wind-up leaves no light
    const at = draw(fx, 100 + to);
    expect(at.n).toBeGreaterThan(0);
    const xs = at.tris.flatMap((t) => t.p.map((p) => p[0]));
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(from); expect(Math.max(...xs)).toBeLessThanOrEqual(to);
    expect(draw(fx, 100 + to + 3).n).toBe(0);
  });
  it('peak alpha 0.70 on Medium, 0.55 on Low', () => {
    for (const [low, peak] of [[false, 0.7], [true, 0.55]] as const) {
      const fx = new NinjaFxCore(PAL, low);
      fx.observe([start('attack', 100, 0)]);
      for (let k = 3; k <= 5; k += 0.25) fx.blade(100 + k, [k, 1, 0], [k, 1, 1]);
      expect(Math.max(...draw(fx, 105).tris.flatMap((t) => t.c.map((c) => c[3])))).toBeCloseTo(peak, 6);
    }
  });
});

describe('F2: the needle that really did damage leaves a dot; nothing else does', () => {
  it('a lumen diamond 0.08 x 0.08 m at the target, 1.00 m up, 0.80 -> 0 over 3 ticks', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.tick(50); fx.observe([hit('echo_needle', 7)]);
    const s = draw(fx, 50);
    expect(s.n).toBe(2); expect(s.of(PAL.lumen).length).toBe(2);
    const [w, h] = size(s.tris); expect(w).toBeCloseTo(0.08, 6); expect(h).toBeCloseTo(0.08, 6);
    expect(s.tris[0].c[0][3]).toBeCloseTo(0.8, 6);
    expect(s.tris.flatMap((t) => t.p.map((p) => p[1])).reduce((a, b) => a + b, 0) / 6).toBeCloseTo(1.0, 6);
    expect(draw(fx, 51.5).tris[0].c[0][3]).toBeCloseTo(0.4, 6);
    expect(draw(fx, 53).n).toBe(0);
  });
  it('a needle hit makes no melee spark, and a needle that only went away makes nothing', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.tick(50); fx.observe([{ t: 'needle-spawn', id: 3, x: 0, z: 0, dx: 0, dz: 1, tick: 50 } as SimEvent, { t: 'needle-despawn', id: 3 } as SimEvent]);
    expect(draw(fx, 50.5).of(PAL.white).length).toBe(0);
    fx.observe([hit('echo_needle', 7)]);
    expect(draw(fx, 50.5).of(PAL.white).length).toBe(0);
  });
  it('the tail is never longer than 1.00 m', () => { expect(FX.needle.tailM).toBeLessThanOrEqual(1.0); });
});

describe('F3: the eaten mark', () => {
  const eaten = (low: boolean) => {
    const fx = new NinjaFxCore(PAL, low);
    fx.observe([{ t: 'mark-set', target: 7, tick: 10 } as SimEvent]); draw(fx, 11);
    fx.observe([{ t: 'mark-consume', target: 7, tick: 20 } as SimEvent]);
    return fx;
  };
  it('three lumen dots 0.08 m across; on Medium they move apart sideways only, up to 0.30 m', () => {
    const fx = eaten(false), a = draw(fx, 20).of(PAL.lumen), b = draw(fx, 23.9).of(PAL.lumen);
    expect(a.length).toBe(6);
    expect(size(a.slice(0, 2))[0]).toBeCloseTo(0.08, 6);
    const ys = (s: typeof a) => s.flatMap((t) => t.p.map((p) => p[1]));
    expect(Math.max(...ys(b)) - Math.max(...ys(a))).toBeCloseTo(0, 6); // no drift up
    expect(size(b)[0] - size(a)[0]).toBeGreaterThan(0.5); expect(size(b)[0] - size(a)[0]).toBeLessThanOrEqual(0.6 + 1e-9);
    expect(draw(fx, 24).n).toBe(0);
  });
  it('on Low they stay where the strokes were', () => {
    const fx = eaten(true);
    expect(size(draw(fx, 23.9).of(PAL.lumen))[0]).toBeCloseTo(size(draw(fx, 20).of(PAL.lumen))[0], 6);
  });
});

describe('§8.4.5 damage spark: a real melee hit only', () => {
  it('steps 1-2: lines 0.16 / 0.10 m, 0.025 m wide, 3 ticks, alpha 0.75 falling evenly; white-lumen and violet', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.player(49, 0, 0, false); fx.tick(50); fx.observe([start('attack', 45, 0), hit('attack', 7)]);
    const s = draw(fx, 50);
    expect(s.of(PAL.white).length).toBe(2); expect(s.of(PAL.violet).length).toBe(2);
    const len = (c: V3) => { const [w, h] = size(s.of(c)); return Math.hypot(w, h); };
    expect(len(PAL.white)).toBeGreaterThan(0.16); expect(len(PAL.white)).toBeLessThan(0.16 + 0.04);
    expect(len(PAL.violet)).toBeGreaterThan(0.10); expect(len(PAL.violet)).toBeLessThan(0.10 + 0.04);
    expect(s.of(PAL.white)[0].c[0][3]).toBeCloseTo(0.75, 6);
    expect(draw(fx, 51.5).of(PAL.white)[0].c[0][3]).toBeCloseTo(0.375, 6);
    expect(draw(fx, 53).n).toBe(0);
    expect(s.of(PAL.lumen).length).toBeLessThanOrEqual(3); // thin pieces
  });
  it('step 3, skills and the ult: 0.24 / 0.14 m for 4 ticks', () => {
    for (const [kind, step] of [['attack', 2], ['shadow_thread', 0], ['resonant_knot', 0], ['lumen_loom', 0]] as const) {
      const fx = new NinjaFxCore(PAL, false);
      fx.player(49, 0, 0, false); fx.tick(50); fx.observe([start(kind, 45, step), hit(kind, 7)]);
      const [w, h] = size(draw(fx, 50).of(PAL.white)); expect(Math.hypot(w, h), kind).toBeGreaterThan(0.24);
      expect(draw(fx, 53.5).of(PAL.white).length, kind).toBe(2); expect(draw(fx, 54).of(PAL.white).length, kind).toBe(0);
    }
  });
  it('sits on the side of the target that faces the player, 0.55 x its height within 0.35..1.0 m', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.player(49, 0, 0, false); fx.tick(50); fx.observe([start('attack', 45, 0), hit('attack', 7), hit('attack', 8)]);
    const pts = draw(fx, 50).of(PAL.white).map((t) => t.p);
    const c = (i: number) => [0, 1, 2].map((k) => (pts[i * 2].concat(pts[i * 2 + 1])).reduce((a, p) => a + p[k], 0) / 6);
    const all = [c(0), c(1)];
    const near7 = all.find((p) => p[0] > 1)!, near8 = all.find((p) => p[2] > 1)!;
    expect(near7[0]).toBeLessThan(2); expect(near7[1]).toBeCloseTo(0.55 * 1.2, 2);  // towards the player at x 0
    expect(near8[2]).toBeLessThan(3); expect(near8[1]).toBeCloseTo(1.0, 2);         // 0.55 x 2.8 is capped at 1.0
  });
  it('gold takes the place of the violet line only for a knot hit on a ✦ target', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.player(49, 0, 0, false); fx.tick(50); fx.observe([start('resonant_knot', 36, 0), hit('resonant_knot', 7, { targetStunnedAtHit: true })]);
    const s = draw(fx, 50);
    expect(s.of(PAL.gold).length).toBeGreaterThanOrEqual(2);
    const fx2 = new NinjaFxCore(PAL, false);
    fx2.player(49, 0, 0, false); fx2.tick(50); fx2.observe([start('attack', 45, 2), hit('attack', 7, { targetStunnedAtHit: true })]);
    expect(draw(fx2, 50).of(PAL.gold).length).toBe(0);
  });
  it('one point per real hit, at most 6 points on Medium and 3 on Low; Low has the long line only, no pieces', () => {
    for (const low of [false, true]) {
      const fx = new NinjaFxCore(PAL, low);
      fx.player(49, 0, 0, false); fx.tick(50); fx.observe([start('lumen_loom', 40, 0)]);
      const evs: SimEvent[] = []; for (let i = 0; i < 9; i++) evs.push(hit('lumen_loom', 7, { pulseIndex: i }));
      fx.observe([...evs, evs[0]]); // the same hit sent twice is one point
      const s = draw(fx, 50);
      expect(s.of(PAL.white).length).toBe(low ? 6 : 12);
      expect(s.of(PAL.violet).length).toBe(low ? 0 : 12);
      expect(s.of(PAL.lumen).length).toBe(low ? 0 : 18);
      expect(fx.last.sparks).toBe(low ? 3 : 6);
    }
  });
  it('never larger on screen than 18 / 24 CSS px: near the camera the world size shrinks', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.player(49, 0, 0, false); fx.tick(50); fx.observe([start('attack', 45, 0), hit('attack', 7)]);
    const far = size(draw(fx, 50, ME, 50).of(PAL.white)), near = size(draw(fx, 50, ME, 400).of(PAL.white)); // 0.16 m = 8 px / 64 px
    expect(Math.hypot(far[0], far[1])).toBeGreaterThan(0.16);
    expect(Math.hypot(near[0], near[1]) * 400).toBeLessThanOrEqual(18 * 1.2); // the long line is 18 px; its width adds a little
  });
  it('a swing that hit nothing, an enemy hitting the player, and a hit with no source make no spark', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.player(49, 0, 0, false); fx.tick(50);
    fx.observe([start('attack', 45, 0), { t: 'attack-pulse', actionId: 1, kind: 'attack', pulseIndex: 0, tick: 50, x: 0, z: 0, fx: 0, fz: 1 } as SimEvent,
      { t: 'hit', target: 1, amount: 5, x: 0, z: 0, crit: false, byPlayer: false }, { t: 'hit', target: 7, amount: 5, x: 2, z: 0, crit: false, byPlayer: true }]);
    expect(draw(fx, 50).n).toBe(0);
  });
});

describe('F8: dodge groove, perfect, counter ready', () => {
  it('groove: a lumen line 0.04 m wide, 0.06 m up, along the way really dodged, 0.65 -> 0 in 4 ticks per piece; none on Low', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.player(10, 0, 0, false); fx.player(11, 0.5, 0, true); fx.player(12, 1.0, 0, true); fx.player(13, 1.0, 0, true); fx.player(14, 1.4, 0, false);
    const s = draw(fx, 12);
    expect(fx.last.groove).toBe(2);
    const [w, h, d] = size(s.tris); expect(w).toBeCloseTo(1.0, 6); expect(h).toBeCloseTo(0, 6); expect(d).toBeCloseTo(0.04, 6);
    expect(s.tris[0].p[0][1]).toBeCloseTo(0.06, 6);
    expect(Math.max(...s.tris.flatMap((t) => t.c.map((c) => c[3])))).toBeCloseTo(0.65, 6);
    draw(fx, 15.5); expect(fx.last.groove).toBe(1); // the first piece is gone 4 ticks after its own tick
    draw(fx, 16); expect(fx.last.groove).toBe(0);
    const low = new NinjaFxCore(PAL, true);
    low.player(10, 0, 0, false); low.player(11, 0.5, 0, true);
    expect(draw(low, 11).n).toBe(0);
  });
  it('perfect: a lumen diamond 0.28 x 0.28 m, 1.60 m above the player, 0.90 -> 0 in 6 ticks, the same size all the way', () => {
    const fx = new NinjaFxCore(PAL, false);
    fx.tick(30); fx.observe([{ t: 'perfect', x: 0, z: 0 }]);
    const a = draw(fx, 30), b = draw(fx, 33);
    expect(size(a.tris).slice(0, 2).map((v) => +v.toFixed(6))).toEqual([0.28, 0.28]);
    expect(size(b.tris).slice(0, 2).map((v) => +v.toFixed(6))).toEqual([0.28, 0.28]);
    expect(a.tris.flatMap((t) => t.p.map((p) => p[1])).reduce((x, y) => x + y, 0) / 6).toBeCloseTo(1.6, 6);
    expect(a.tris[0].c[0][3]).toBeCloseTo(0.9, 6); expect(b.tris[0].c[0][3]).toBeCloseTo(0.45, 6);
    expect(draw(fx, 36).n).toBe(0);
  });
  it('counter ready: a lumen stroke 0.24 x 0.035 m, 1.10 m up, 0.12 m in front, only while the sim has it and the player stands', () => {
    const fx = new NinjaFxCore(PAL, false);
    expect(draw(fx, 5).n).toBe(0);
    const s = draw(fx, 5, { ...ME, counterReady: true });
    expect(s.n).toBe(2);
    const [w, h] = size(s.tris); expect(w).toBeCloseTo(0.24, 6); expect(h).toBeCloseTo(0.035, 6);
    const c = [0, 1, 2].map((k) => s.tris.flatMap((t) => t.p.map((p) => p[k])).reduce((a, b) => a + b, 0) / 6);
    expect(c[1]).toBeCloseTo(1.1, 6); expect(c[2]).toBeCloseTo(0.12, 6);
    expect(s.tris[0].c[0][3]).toBeCloseTo(0.8, 6);
    expect(draw(fx, 5, { ...ME, counterReady: true, down: true }).n).toBe(0);
  });
});

describe('§8.4.4 camera impulse', () => {
  it('the shape: 0 / 1 / -0.5 / 0.25 / 0 of A at 0 / 0.2 / 0.45 / 0.7 / 1 of 90 ms, straight lines between', () => {
    const c = new CamImpulse(); c.event(100, 1.0);
    const at = (q: number) => c.offset(100 + q * IMPULSE.ticks);
    expect(at(0.2)).toBeCloseTo(1, 6); expect(at(0.45)).toBeCloseTo(-0.5, 6); expect(at(0.7)).toBeCloseTo(0.25, 6);
    expect(at(0.1)).toBeCloseTo(0.5, 6); expect(at(0)).toBe(0); expect(at(1)).toBe(0); expect(at(1.5)).toBe(0);
    expect(IMPULSE.ticks).toBeCloseTo(90 / (1000 / 30), 6);
  });
  it('one impulse: a second event inside it keeps the age and takes the larger A, never above 1.5 px', () => {
    const c = new CamImpulse(); c.event(100, 0.8); c.event(101, 1.5); c.event(101, 9);
    expect(c.offset(100 + 0.2 * IMPULSE.ticks)).toBeCloseTo(1.5, 6);
    expect(c.offset(100 + IMPULSE.ticks)).toBe(0);
  });
  it('a new one starts no sooner than 6 ticks after the last start; one in the quiet time is dropped', () => {
    const c = new CamImpulse(); c.event(100, 1); c.event(104, 1);
    expect(c.offset(104 + 0.2 * IMPULSE.ticks)).toBe(0);
    c.event(106, 1);
    expect(c.offset(106 + 0.2 * IMPULSE.ticks)).toBeCloseTo(1, 6);
  });
  it('Low / reduced motion: always 0', () => { const c = new CamImpulse(); c.event(100, 1.5); expect(c.offset(100.5, false)).toBe(0); });
  it('amplitudes: combo 1 / 2 and the needle 0; combo 3, shadow step, knot, each ult pulse that hit 1.0; perfect 0.8; player hit and pillar 1.5', () => {
    const step = (s: number) => () => s;
    expect(impulseOf(hit('attack', 7), 1, step(0))).toBe(0);
    expect(impulseOf(hit('attack', 7), 1, step(1))).toBe(0);
    expect(impulseOf(hit('attack', 7), 1, step(2))).toBe(1.0);
    expect(impulseOf(hit('echo_needle', 7), 1)).toBe(0);
    for (const k of ['shadow_thread', 'resonant_knot', 'lumen_loom']) expect(impulseOf(hit(k, 7), 1)).toBe(1.0);
    expect(impulseOf({ t: 'perfect', x: 0, z: 0 }, 1)).toBe(0.8);
    expect(impulseOf({ t: 'hit', target: 1, amount: 5, x: 0, z: 0, crit: false, byPlayer: false }, 1)).toBe(1.5);
    expect(impulseOf({ t: 'pillar-break', i: 0 }, 1)).toBe(1.5);
    expect(impulseOf({ t: 'attack-pulse', actionId: 1, kind: 'lumen_loom', pulseIndex: 0, tick: 5, x: 0, z: 0, fx: 0, fz: 1 } as SimEvent, 1)).toBe(0); // a pulse that hit nothing
  });
});
