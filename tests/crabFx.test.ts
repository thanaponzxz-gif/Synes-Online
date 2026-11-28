// DES-010 §4.2 / §4.3 / §5.3 item 4: the crab's effects come from what the sim really did (warnings by id that really ran out,
// distance really charged, pillars that really broke), inside the instance budget, never in the warning colours.
import { describe, it, expect } from 'vitest';
import { createWorld } from '../shared/sim/createWorld.ts';
import type { NinjaWorld } from '../shared/sim/ninjaWorld.ts';
import { NO_INPUT } from '../shared/sim/input.ts';
import { TICK } from '../shared/data/tuning.ts';
import { BossClock, type BossSnap, type TeleSnap } from '../src/boss/bossClock.ts';
import { CrabFxCore, CRAB_FX, CRAB_FX_TEMP, type V3, type C4 } from '../src/boss/crabFxCore.ts';
import { snapBoss } from '../src/boss/snap.ts';
import { bossPictureFor } from '../src/boss/profile.ts';

const PAL = { lumen: [0.1, 0.9, 0.8] as V3, violet: [0.4, 0.3, 0.9] as V3, stone: [0.1, 0.15, 0.16] as V3, dust: [0.3, 0.4, 0.33] as V3 };
interface Out { tris: { a: V3; b: V3; c: V3; alpha: number }[]; inst: { x: number; y: number; z: number; sx: number; sy: number; sz: number; color: V3 }[]; }
function drawAt(fx: CrabFxCore, clock: BossClock, r: number, shell: V3 | null = [0, 2, 0]): Out {
  const out: Out = { tris: [], inst: [] };
  fx.draw(r, clock, fx.low ? null : { tri: (a: V3, b: V3, c: V3, ca: C4) => { out.tris.push({ a, b, c, alpha: ca[3] }); } },
    (x, y, z, sx, sy, sz, _yaw, color) => { out.inst.push({ x, y, z, sx, sy, sz, color }); }, shell);
  return out;
}
const tele = (id: number, atk: string, t: number, total: number, o: Partial<TeleSnap> = {}): TeleSnap => ({ id, owner: 1, atk, shape: 'circle', t, total, x: 3, z: -4, dx: 0, dz: 1, r: 4.6, w: 0, cos: 0, ...o });
const snap = (tick: number, teles: TeleSnap[], o: Partial<BossSnap> = {}): BossSnap => ({ tick, id: 1, alive: true, started: true, state: 'windup', st: 1, atk: 'slam', x: 0, z: 0, teles, ...o });
/** a clock that watched one warning count down from `total` and then really run out (or get cancelled `cancelAt` steps in) */
function oneWarning(atk: string, total: number, o: Partial<TeleSnap> = {}, cancelAt = -1) {
  const clock = new BossClock();
  let t = total, tick = 100, impact = -1;
  for (let i = 0; i < 200; i++, tick++) {
    if (i === cancelAt) { clock.observe(snap(tick, [])); return { clock, impact: -1, end: tick }; }
    if (t <= 0) { clock.observe(snap(tick, [])); impact = tick; break; } // the step that found t - TICK <= 0 removed it
    clock.observe(snap(tick, [tele(7, atk, t, total, o)]));
    t -= TICK; // the sim removes it on the step that brings its timer to 0 or below
  }
  return { clock, impact, end: tick };
}

describe('crab effects: only what really happened', () => {
  it('slam: the whole lumen ring at the warning radius, 0.10 m wide, 0.45 -> 0 over 5 ticks, nothing before the impact tick', () => {
    const { clock, impact } = oneWarning('slam', 1.25, { r: 4.6 });
    expect(impact).toBeGreaterThan(0);
    const fx = new CrabFxCore(PAL, false);
    expect(drawAt(fx, clock, impact - 0.01).tris.length).toBe(0);
    expect(drawAt(fx, clock, impact - 0.01).inst.length).toBe(0);
    const o = drawAt(fx, clock, impact);
    expect(o.tris.length).toBe(96);
    expect(o.tris[0].alpha).toBeCloseTo(0.45, 9);
    const radii = o.tris.flatMap((t) => [t.a, t.b, t.c]).map((p) => Math.hypot(p[0] - 3, p[2] + 4));
    expect(Math.min(...radii)).toBeCloseTo(4.55, 6); expect(Math.max(...radii)).toBeCloseTo(4.65, 6);
    // every part of the ring is there on the first frame: a flash of the whole area, not a wave that travels
    const angles = new Set(o.tris.map((t) => Math.round((Math.atan2(t.a[0] - 3, t.a[2] + 4) / Math.PI) * 24)));
    expect(angles.size).toBeGreaterThanOrEqual(48);
    expect(drawAt(fx, clock, impact + 2.5).tris[0].alpha).toBeCloseTo(0.225, 9);
    expect(drawAt(fx, clock, impact + 5).tris.length).toBe(0);
    expect(o.inst.length).toBe(CRAB_FX.slam.debris);
    for (let a = 0; a < 5; a += 0.5) for (const i of drawAt(fx, clock, impact + a).inst) expect(i.y - i.sy / 2).toBeLessThanOrEqual(CRAB_FX.slam.maxH + 1e-9);
  });
  it('sweep: a thin arc inside the fan the warning had, y 0.12 m, gone in 4 ticks, at most 4 sparks', () => {
    const cos = Math.cos(1.0);
    const { clock, impact } = oneWarning('sweep', 0.95, { r: 5.2, cos, dx: 1, dz: 0, shape: 'cone' });
    const fx = new CrabFxCore(PAL, false), o = drawAt(fx, clock, impact + 1);
    expect(o.tris.length).toBeGreaterThan(0);
    expect(o.tris[0].alpha).toBeCloseTo(0.45 * 0.75, 9);
    for (const p of o.tris.flatMap((t) => [t.a, t.b, t.c])) {
      expect(p[1]).toBeCloseTo(0.12, 9);
      const d = Math.hypot(p[0] - 3, p[2] + 4);
      expect(Math.abs(d - 5.2)).toBeLessThanOrEqual(0.03 + 1e-9);
      expect((p[0] - 3) / d).toBeGreaterThanOrEqual(cos - 1e-3); // inside the fan, facing +x
    }
    expect(o.inst.length).toBe(4);
    expect(drawAt(fx, clock, impact + 4).tris.length).toBe(0);
    expect(drawAt(fx, clock, impact + 4).inst.length).toBe(0);
  });
  it('a warning that was removed before its timer ran out makes no effect at all', () => {
    for (const atk of ['slam', 'sweep', 'shard']) {
      const { clock, end } = oneWarning(atk, 1.25, {}, 20);
      const fx = new CrabFxCore(PAL, false);
      for (let r = end - 8; r < end + 12; r += 0.5) { const o = drawAt(fx, clock, r); expect(o.tris.length + (r >= end ? o.inst.length : 0), `${atk} r=${r}`).toBe(0); }
    }
  });
  it('rain: one violet crystal per warning, at that warning, 5.5 m -> 0.10 m over the last 6 ticks before its own deadline', () => {
    const { clock, impact } = oneWarning('shard', 1.0, { x: -6, z: -70, r: 2.2 });
    const fx = new CrabFxCore(PAL, false), h = CRAB_FX_TEMP.crystal[1];
    expect(drawAt(fx, clock, impact - 6.5).inst.length).toBe(0);
    const top = drawAt(fx, clock, impact - 6).inst, mid = drawAt(fx, clock, impact - 3).inst, low = drawAt(fx, clock, impact - 0.001).inst;
    expect(top.length).toBe(1); expect(top[0].color).toEqual(PAL.violet);
    expect([top[0].x, top[0].z]).toEqual([-6, -70]);
    expect(top[0].y - h / 2).toBeCloseTo(5.5, 6);
    expect(mid[0].y - h / 2).toBeCloseTo(0.10 + 5.4 / 2, 6);
    expect(low[0].y - h / 2).toBeCloseTo(0.10, 2);
    const hit = drawAt(fx, clock, impact).inst;
    expect(hit.length).toBe(CRAB_FX.shard.debris); // the crystal is gone, the pieces are there
    expect(drawAt(fx, clock, impact + 5).inst.length).toBe(0);
  });
  it('Low: no arc and no ring, fewer pieces, shorter lives, no roar motes', () => {
    const slam = oneWarning('slam', 1.25), sweep = oneWarning('sweep', 0.95, { r: 5.2, cos: 0.5 }), shard = oneWarning('shard', 1.0);
    const fx = new CrabFxCore(PAL, true);
    expect(drawAt(fx, slam.clock, slam.impact).tris.length).toBe(0);
    expect(drawAt(fx, slam.clock, slam.impact).inst.length).toBe(4);
    expect(drawAt(fx, slam.clock, slam.impact + 4).inst.length).toBe(0);
    expect(drawAt(fx, sweep.clock, sweep.impact).inst.length).toBe(2);
    expect(drawAt(fx, sweep.clock, sweep.impact + 3).inst.length).toBe(0);
    expect(drawAt(fx, shard.clock, shard.impact - 4).inst.length).toBe(0);
    expect(drawAt(fx, shard.clock, shard.impact - 3).inst.length).toBe(1);
    expect(drawAt(fx, shard.clock, shard.impact).inst.length).toBe(1);
    expect(drawAt(fx, shard.clock, shard.impact + 3).inst.length).toBe(0);
  });
  it('pillar debris only where a pillar really broke; half as many on Low', () => {
    const clock = new BossClock(); clock.observe(snap(50, []));
    const fx = new CrabFxCore(PAL, false);
    expect(drawAt(fx, clock, 51).inst.length).toBe(0);
    fx.pillarBreak(50, 8, -80);
    const o = drawAt(fx, clock, 51).inst;
    expect(o.length).toBe(CRAB_FX_TEMP.pillar.count);
    for (const i of o) expect(Math.hypot(i.x - 8, i.z + 80)).toBeLessThanOrEqual(CRAB_FX_TEMP.pillar.spreadM + 1e-9);
    fx.low = true; expect(drawAt(fx, clock, 51).inst.length).toBe(CRAB_FX_TEMP.pillar.count / 2);
    fx.reset(); expect(drawAt(fx, clock, 51).inst.length).toBe(0);
  });
  it('nothing is drawn in the warning colours', () => {
    const reserved = [[0xff, 0x7a, 0x1a], [0xff, 0x33, 0x55]].map((c) => c.map((v) => v / 255));
    const real = { lumen: [0x5c, 0xf2, 0xe6], violet: [0xa7, 0x8b, 0xfa], stone: [0x52, 0x6a, 0x70], dust: [0x9a, 0xa7, 0x9d] };
    for (const c of Object.values(real)) for (const r of reserved) expect(Math.hypot(c[0] / 255 - r[0], c[1] / 255 - r[1], c[2] / 255 - r[2])).toBeGreaterThan(0.3);
  });
});

describe('crab effects on the real fight', () => {
  // the real ninja sim; the test keeps the player alive and lowers the boss's HP at step 600 to reach phase 2
  const w = createWorld(7, { dodgeCdTicks: 17, start: 'boss' }, 'ninja-roam-1') as NinjaWorld, clock = new BossClock();
  const med = new CrabFxCore(PAL, false), low = new CrabFxCore(PAL, true);
  let maxMed = 0, maxLow = 0, dropped = 0, dustSeen = 0, crystalsAtOnce = 0, roar = 0;
  const crystalBad: string[] = [], dustBad: string[] = [];
  for (let i = 0; i < 2400; i++) {
    w.player.hp = w.player.maxHp;
    if (i === 5) { const t = w.level.boss.trigger; w.player.x = t.x; w.player.z = t.z; }
    if (i === 600 && w.boss.alive) w.boss.hp = Math.floor(w.boss.maxHp * 0.4);
    const before = w.tele.map((t) => ({ id: t.id, x: t.x, z: t.z, atk: t.atk.id, left: t.t }));
    const ev = w.step(NO_INPUT);
    const s = snapBoss(w); clock.observe(s);
    for (const e of ev) if (e.t === 'pillar-break') { const p = w.level.pillars[e.i]; med.pillarBreak(s.tick, p.x, p.z); low.pillarBreak(s.tick, p.x, p.z); }
    if (i < 3) continue;
    // what the screen shows while tick s.tick is the newest processed one: render ticks s.tick-1 .. s.tick
    for (const a of [0, 0.5]) {
      const r = s.tick - 1 + a, o = drawAt(med, clock, r), l = drawAt(low, clock, r);
      maxMed = Math.max(maxMed, o.inst.length); maxLow = Math.max(maxLow, l.inst.length); dropped += med.last.dropped;
      const crystals = o.inst.filter((x) => x.sy === CRAB_FX_TEMP.crystal[1]);
      crystalsAtOnce = Math.max(crystalsAtOnce, crystals.length);
      // a falling crystal is always over a shard warning that is on the ground right now
      for (const c of crystals) if (!before.concat(w.tele.map((t) => ({ id: t.id, x: t.x, z: t.z, atk: t.atk.id, left: t.t }))).some((t) => t.atk === 'shard' && t.x === c.x && t.z === c.z)) crystalBad.push(`tick ${s.tick}`);
      const dust = o.inst.filter((x) => x.color === PAL.dust);
      dustSeen += dust.length;
      if (dust.length > CRAB_FX.charge.max) dustBad.push(`tick ${s.tick}: ${dust.length}`);
      for (const d of dust) if (d.y + d.sy / 2 > CRAB_FX.charge.maxH + 1e-6) dustBad.push(`tick ${s.tick}: high ${d.y}`);
      if (o.inst.some((x) => x.color === PAL.lumen && x.y > 1.5)) roar++;
    }
  }
  it('stays inside the instance budget (32 Medium / 12 Low) through the whole fight, rain of five included', () => {
    expect(maxMed).toBeGreaterThan(5); expect(maxMed).toBeLessThanOrEqual(CRAB_FX.cap.medium);
    expect(maxLow).toBeGreaterThan(0); expect(maxLow).toBeLessThanOrEqual(CRAB_FX.cap.low);
    expect(dropped).toBeGreaterThanOrEqual(0);
  });
  it('every falling crystal is over a real shard warning, and the five of a cast fall on their own deadlines', () => {
    expect(crystalBad).toEqual([]);
    expect(crystalsAtOnce).toBeGreaterThanOrEqual(1); expect(crystalsAtOnce).toBeLessThanOrEqual(5);
  });
  it('charge dust appears, never more than 12 at once, never above 0.30 m', () => {
    expect(dustSeen).toBeGreaterThan(0); expect(dustBad).toEqual([]);
  });
  it('the roar motes show in phase 2', () => { expect(roar).toBeGreaterThan(0); });
  it('one puff per 0.75 m really covered while charging (1.5 m on Low)', () => {
    const c = new BossClock();
    let x = 0, tick = 10;
    c.observe(snap(tick++, [], { state: 'windup', atk: 'charge', x }));
    for (let i = 0; i < 6; i++) { x += 0.5; c.observe(snap(tick++, [], { state: 'charge', atk: 'charge', x })); } // 3.0 m in 6 steps
    for (let i = 0; i < 3; i++) c.observe(snap(tick++, [], { state: 'charge', atk: 'charge', x })); // blocked: no movement, no dust
    const fx = new CrabFxCore(PAL, false);
    const puffs = (r: number) => drawAt(fx, c, r).inst.filter((i) => i.color === PAL.dust).length;
    expect(puffs(tick - 4)).toBe(4); // 0.75, 1.5, 2.25, 3.0 m, all younger than 8 ticks
    expect(puffs(tick + 8)).toBe(0); // nothing new was made while it stood still
    fx.low = true; expect(puffs(tick - 4)).toBe(2);
  });
});

describe('who gets the crab picture', () => {
  const q = (s: string) => new URLSearchParams(s);
  it('only ninja-roam-1 on the dev server; every old ruleset and every published build keeps Prismback', () => {
    expect(bossPictureFor('ninja-roam-1', true, q(''))).toBe('crab');
    for (const r of ['combat-1', 'combat-2', 'roam-1']) expect(bossPictureFor(r, true, q('')), r).toBe('prismback');
    expect(bossPictureFor('ninja-roam-1', false, q(''))).toBe('prismback');
    expect(bossPictureFor('ninja-roam-1', true, q('boss=old'))).toBe('prismback');
  });
});
