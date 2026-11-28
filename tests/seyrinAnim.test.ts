// DES-007 §8.3/§8.4 (DES-009 §3.1 row C): which of Seyrin's 20 clips plays, on which body group, at what time and weight.
// The plan is driven only by sim state (actions, ticks, the distance the sim really moved), never by the mixer or fps.
// Time `t` is in ticks: t = T shows the state after sim step T (between steps the renderer interpolates).
import { describe, it, expect } from 'vitest';
import { HeroAnimator, heroTick, dodgeClip, yLiftAt, type HeroTick, type AnimPlan } from '../src/seyrin/animPlan.ts';
import { FULL_CLIPS } from '../src/seyrin/spec.ts';
import { createWorld } from '../shared/sim/createWorld.ts';
import type { NinjaWorld } from '../shared/sim/ninjaWorld.ts';
import { NINJA_RULESET } from '../shared/sim/ruleset.ts';
import { Bot } from './bot.ts';

type Act = NonNullable<HeroTick['action']>;
const T = (tick: number, o: Partial<HeroTick> = {}): HeroTick => ({ tick, x: 0, z: 0, fx: 0, fz: 1, action: null, down: false, hurt: false, won: false, ...o });
const act = (kind: Act['kind'], start: number, end: number, o: Partial<Act> = {}): Act => ({ id: start, kind, step: 0, start, end, fx: 0, fz: 1, ...o });
const W = (p: AnimPlan, g: 'upper' | 'lower', clip: string) => p[g].filter((c) => c.clip === clip).reduce((s, c) => s + c.weight, 0);
const time = (p: AnimPlan, g: 'upper' | 'lower', clip: string) => p[g].find((c) => c.clip === clip)?.time;
const DUR = Object.fromEntries(FULL_CLIPS.map((c) => [c.name, c.ticks / 30]));

/** feed ticks from..to; `f` gives each tick's overrides; x advances by `speed` m/s along +x while `moving(k)` */
function feed(an: HeroAnimator, from: number, to: number, f: (k: number) => Partial<HeroTick> = () => ({}), speed = 0, moving: (k: number) => boolean = () => false, x0 = 0) {
  let x = x0;
  for (let k = from; k <= to; k++) { if (moving(k)) x += speed / 30; an.observe(T(k, { x, ...f(k) })); }
  return x;
}

describe('locomotion (§8.3)', () => {
  it('standing still plays idle on the whole body, on the global clock', () => {
    const an = new HeroAnimator(); feed(an, 0, 10);
    const p = an.sample(10);
    expect(W(p, 'upper', 'idle')).toBe(1); expect(W(p, 'lower', 'idle')).toBe(1);
    expect(time(p, 'lower', 'idle')).toBeCloseTo((10 / 30) % DUR.idle, 12);
  });
  it('walks below 2.0 m/s, runs above 2.6 m/s, blends linearly between; the cadence follows the real speed', () => {
    for (const [v, walk, run] of [[1.5, 1, 0], [1.82, 1, 0], [2.3, 0.5, 0.5], [2.6, 0, 1], [5.2, 0, 1]] as const) {
      const an = new HeroAnimator(); feed(an, 0, 40, () => ({}), v, () => true);
      const p = an.sample(40);
      expect(W(p, 'lower', 'walk'), `walk at ${v}`).toBeCloseTo(walk, 9); expect(W(p, 'lower', 'run'), `run at ${v}`).toBeCloseTo(run, 9);
    }
    // at the clip's reference speed one tick of game time is one tick of clip time (walk 1.5 m/s, run 5.2 m/s)
    for (const [v, clip] of [[1.5, 'walk'], [5.2, 'run']] as const) {
      const an = new HeroAnimator(); feed(an, 0, 40, () => ({}), v, () => true);
      const a = time(an.sample(39), 'lower', clip)!, b = time(an.sample(40), 'lower', clip)!;
      expect((b - a + DUR[clip]) % DUR[clip]).toBeCloseTo(1 / 30, 9);
    }
  });
  it('locomotion blends over 0.10 s = 3 ticks, linearly, between ticks too', () => {
    const an = new HeroAnimator(); feed(an, 0, 10); feed(an, 11, 14, () => ({}), 1.5, () => true);
    expect(W(an.sample(11), 'lower', 'walk')).toBeCloseTo(1 / 3, 12);
    expect(W(an.sample(10.5), 'lower', 'walk')).toBeCloseTo(1 / 6, 12);
    expect(W(an.sample(12), 'lower', 'walk')).toBeCloseTo(2 / 3, 12);
    expect(W(an.sample(13), 'lower', 'walk')).toBeCloseTo(1, 12);
    expect(W(an.sample(12), 'lower', 'idle')).toBeCloseTo(1 / 3, 12);
  });
  it('walking does not count a teleport (respawn) or the dodge / dash movement of an action', () => {
    const an = new HeroAnimator(); feed(an, 0, 10);
    an.observe(T(11, { x: 30 })); // > 0.75 m in one tick
    expect(W(an.sample(11), 'lower', 'walk') + W(an.sample(11), 'lower', 'run')).toBe(0);
    const b = new HeroAnimator(); feed(b, 0, 10);
    feed(b, 11, 19, () => ({ action: act('dodge', 11, 9, { fx: 1, fz: 0 }) }), 12, () => true);
    const p = b.sample(19);
    expect(W(p, 'lower', 'run')).toBe(0); expect(W(p, 'lower', 'walk')).toBe(0);
  });
});

describe('actions follow the sim clock (§8.1, §8.3)', () => {
  it('an attack shows clip tick k at t = start + k, so the hit marker is on the sim hit tick', () => {
    const an = new HeroAnimator(); feed(an, 0, 19); feed(an, 20, 30, () => ({ action: act('attack', 20, 11) }));
    expect(time(an.sample(25), 'upper', 'attack_01')).toBeCloseTo(5 / 30, 12);
    expect(time(an.sample(25), 'lower', 'attack_01')).toBeCloseTo(5 / 30, 12);
    expect(time(an.sample(22.5), 'upper', 'attack_01')).toBeCloseTo(2.5 / 30, 12);
    expect(W(an.sample(25), 'upper', 'attack_01')).toBe(1);
  });
  it('fades: into an action 0.05 s; a combo chain 1/30 s; a dodge 1/30 s; back to ready 0.08 s', () => {
    const an = new HeroAnimator(); feed(an, 0, 19);
    feed(an, 20, 30, () => ({ action: act('attack', 20, 11) }));
    expect(W(an.sample(20.75), 'upper', 'attack_01')).toBeCloseTo(0.5, 12); // 1.5-tick fade
    feed(an, 31, 42, () => ({ action: act('attack', 31, 12, { step: 1 }) }));
    expect(W(an.sample(31.5), 'upper', 'attack_02')).toBeCloseTo(0.5, 12); // 1-tick chain
    feed(an, 43, 50); // ended at 43: back to the ready stance
    expect(W(an.sample(44.2), 'upper', 'ready')).toBeCloseTo(0.5, 12); // 2.4-tick return
    expect(W(an.sample(50), 'upper', 'ready')).toBe(1);
    feed(an, 51, 59, () => ({ action: act('dodge', 51, 9) }));
    expect(W(an.sample(51.5), 'upper', 'dodge_f')).toBeCloseTo(0.5, 12);
  });
  it('a combo while walking: the attack on the upper body, walk/run on the legs; standing still: the attack on both', () => {
    const an = new HeroAnimator(); const x = feed(an, 0, 19, () => ({}), 5.2, () => true);
    feed(an, 20, 30, () => ({ action: act('attack', 20, 11) }), 1.82, () => true, x);
    const p = an.sample(25);
    expect(W(p, 'upper', 'attack_01')).toBe(1);
    expect(W(p, 'lower', 'walk')).toBeCloseTo(1, 12); expect(W(p, 'lower', 'attack_01')).toBeCloseTo(0, 12);
    const s = new HeroAnimator(); feed(s, 0, 19); feed(s, 20, 30, () => ({ action: act('attack', 20, 11) }));
    expect(W(s.sample(25), 'lower', 'attack_01')).toBe(1);
  });
  it('attack_03: the legs take the lifted attack pose on ticks 3..9 even while walking (a 1-tick ramp on each side)', () => {
    const an = new HeroAnimator(); const x = feed(an, 0, 19, () => ({}), 1.82, () => true);
    feed(an, 20, 38, () => ({ action: act('attack', 20, 18, { step: 2 }) }), 1.82, () => true, x);
    expect(W(an.sample(21), 'lower', 'walk')).toBeCloseTo(1, 12);
    expect(W(an.sample(22.5), 'lower', 'attack_03')).toBeCloseTo(0.5, 12);
    for (const k of [3, 6, 9]) expect(W(an.sample(20 + k), 'lower', 'attack_03'), `tick ${k}`).toBeCloseTo(1, 12);
    expect(W(an.sample(29.5), 'lower', 'attack_03')).toBeCloseTo(0.5, 12);
    expect(W(an.sample(31), 'lower', 'walk')).toBeCloseTo(1, 12);
  });
  it('skills, the ult and the dodge are whole-body clips; the potion is upper-body like the combo (the sim lets you walk)', () => {
    for (const [kind, clip, end] of [['echo_needle', 'skill_echo_needle', 18], ['shadow_thread', 'skill_shadow_thread', 18], ['resonant_knot', 'skill_resonant_knot', 24], ['lumen_loom', 'ult_lumen_loom', 33]] as const) {
      const an = new HeroAnimator(); feed(an, 0, 19); feed(an, 20, 20 + end - 1, () => ({ action: act(kind, 20, end) }));
      expect(W(an.sample(25), 'upper', clip), clip).toBe(1); expect(W(an.sample(25), 'lower', clip), clip).toBe(1);
    }
    const an = new HeroAnimator(); const x = feed(an, 0, 19, () => ({}), 1.5, () => true);
    feed(an, 20, 38, () => ({ action: act('potion', 20, 19) }), 1.5, () => true, x);
    expect(W(an.sample(25), 'upper', 'potion')).toBe(1); expect(W(an.sample(25), 'lower', 'walk')).toBeCloseTo(1, 12);
  });
});

describe('dodge (§8.4.2) and cancels (§8.4.3)', () => {
  it('picks dodge_f/b/l/r from the facing kept before the dodge and the dash direction, ties going to front/back', () => {
    const F: [number, number] = [0, 1]; // R = (Fz, -Fx) = (1, 0)
    expect(dodgeClip(F, [0, 1])).toBe('dodge_f'); expect(dodgeClip(F, [0, -1])).toBe('dodge_b');
    expect(dodgeClip(F, [1, 0])).toBe('dodge_r'); expect(dodgeClip(F, [-1, 0])).toBe('dodge_l');
    expect(dodgeClip(F, [0.6, 0.8])).toBe('dodge_f'); expect(dodgeClip(F, [0.8, -0.6])).toBe('dodge_r');
    const h = Math.SQRT1_2;
    expect(dodgeClip(F, [h, h])).toBe('dodge_f'); expect(dodgeClip(F, [-h, -h])).toBe('dodge_b');
    const an = new HeroAnimator(); feed(an, 0, 9); feed(an, 10, 18, () => ({ fx: 1, fz: 0, action: act('dodge', 10, 9, { fx: 0, fz: -1 }) }));
    expect(W(an.sample(14), 'upper', 'dodge_r')).toBe(1); // facing +x, dash -z = to its right
  });
  it('a dodge cancel stops the old action where it was, and the dodge fades in over 1/30 s', () => {
    const an = new HeroAnimator(); feed(an, 0, 19);
    feed(an, 20, 22, () => ({ action: act('attack', 20, 11) }));
    feed(an, 23, 31, () => ({ action: act('dodge', 23, 9) }));
    const p = an.sample(23.5);
    expect(time(p, 'upper', 'attack_01')).toBeCloseTo(3 / 30, 12); expect(W(p, 'upper', 'attack_01')).toBeCloseTo(0.5, 12);
    expect(time(p, 'upper', 'dodge_f')).toBeCloseTo(0.5 / 30, 12); expect(W(p, 'upper', 'dodge_f')).toBeCloseTo(0.5, 12);
    expect(W(an.sample(24), 'upper', 'attack_01')).toBe(0);
  });
  it('cancelling attack_03 mid-lift lets the remaining lift settle within 2 ticks as yCancel*(1-u)^2', () => {
    expect(yLiftAt(3)).toBe(0); expect(yLiftAt(6)).toBeCloseTo(0.12, 12); expect(yLiftAt(9)).toBe(0); expect(yLiftAt(12)).toBe(0);
    const an = new HeroAnimator(); feed(an, 0, 19);
    feed(an, 20, 25, () => ({ action: act('attack', 20, 18, { step: 2 }) }));
    feed(an, 26, 34, () => ({ action: act('dodge', 26, 9) }));
    const lift = (t: number) => { const p = an.sample(t); return p.pelvisLift + p.lower.filter((c) => c.clip === 'attack_03').reduce((s, c) => s + c.weight * yLiftAt(c.time * 30), 0); };
    expect(lift(26)).toBeCloseTo(0.12, 12);
    expect(lift(26.5)).toBeCloseTo(0.12 * 0.75 * 0.75, 12);
    expect(lift(27)).toBeCloseTo(0.12 * 0.25, 12);
    expect(lift(28)).toBe(0); expect(an.sample(28).pelvisLift).toBe(0);
    expect(an.sample(25).pelvisLift).toBe(0); // no extra lift while the clip itself plays
  });
});

describe('down, respawn, victory, hit_add', () => {
  it('down wins over a running action, fades in 1/30 s and holds its last frame until the respawn', () => {
    const an = new HeroAnimator(); feed(an, 0, 39, (k) => (k >= 30 ? { action: act('lumen_loom', 30, 33) } : {}));
    feed(an, 40, 99, () => ({ down: true }));
    expect(W(an.sample(40.5), 'upper', 'down')).toBeCloseTo(0.5, 12);
    expect(time(an.sample(41), 'upper', 'ult_lumen_loom')).toBeUndefined();
    expect(time(an.sample(80), 'lower', 'down')).toBeCloseTo(DUR.down, 12);
  });
  it('respawn snaps in, plays 9 ticks and then stands idle; walking cuts it at once', () => {
    const an = new HeroAnimator(); feed(an, 0, 9); feed(an, 10, 99, () => ({ down: true }));
    feed(an, 100, 120, () => ({ x: 40 }));
    expect(W(an.sample(100), 'upper', 'respawn')).toBe(1); expect(time(an.sample(105), 'upper', 'respawn')).toBeCloseTo(5 / 30, 12);
    expect(W(an.sample(120), 'upper', 'idle')).toBe(1);
    const b = new HeroAnimator(); feed(b, 0, 9); feed(b, 10, 99, () => ({ down: true }));
    feed(b, 100, 101, () => ({ x: 40 })); feed(b, 102, 110, () => ({}), 1.5, () => true, 40);
    expect(W(b.sample(102), 'upper', 'respawn')).toBe(1);
    expect(W(b.sample(110), 'upper', 'respawn')).toBe(0);
  });
  it('victory plays once, then the ready stance', () => {
    const an = new HeroAnimator(); feed(an, 0, 9); an.observe(T(10, { won: true }));
    expect(W(an.sample(11.5), 'upper', 'victory')).toBeCloseTo(1, 12);
    expect(time(an.sample(30), 'upper', 'victory')).toBeCloseTo(20 / 30, 12);
    expect(W(an.sample(60), 'upper', 'ready')).toBe(1); // t past the last sim tick: the world stopped, the pose goes on
  });
  it('hit_add is an additive head/chest layer for 6 ticks from the hit, never a stun', () => {
    const an = new HeroAnimator(); feed(an, 0, 9); an.observe(T(10, { hurt: true })); feed(an, 11, 20);
    expect(an.sample(12).additive).toEqual([{ clip: 'hit_add', time: 2 / 30, weight: 1 }]);
    expect(an.sample(17).additive).toEqual([]);
    expect(W(an.sample(12), 'upper', 'idle')).toBe(1);
  });
  it('the stance after an action is ready until the player walks; after walking it is idle', () => {
    const an = new HeroAnimator(); feed(an, 0, 9); feed(an, 10, 20, () => ({ action: act('attack', 10, 11) })); feed(an, 21, 40);
    expect(W(an.sample(40), 'upper', 'ready')).toBe(1);
    const x = feed(an, 41, 50, () => ({}), 1.5, () => true); feed(an, 51, 70, () => ({}), 0, () => false, x);
    expect(W(an.sample(70), 'upper', 'idle')).toBe(1);
  });
});

describe('a real ninja run (sim -> plan)', () => {
  it('every frame: each body group sums to 1, every clip exists and every time is inside its clip; pulses land on markers', () => {
    const w = createWorld(1, { dodgeCdTicks: 17, start: 'normal' }, NINJA_RULESET) as NinjaWorld, bot = new Bot(1), an = new HeroAnimator();
    const markers: Record<string, number[]> = {};
    for (const c of FULL_CLIPS) markers[c.name] = Object.values(c.markers ?? {}).flat();
    let checked = 0;
    while (!w.finished && w.tick < 30 * 120) {
      const ev = w.step(bot.think(w));
      an.observe(heroTick(w, ev));
      for (const a of [0, 0.25, 0.5, 0.75]) {
        const p = an.sample(w.tick - 2 + a);
        for (const g of ['upper', 'lower'] as const) {
          expect(Math.abs(p[g].reduce((s, c) => s + c.weight, 0) - 1)).toBeLessThan(1e-9);
          for (const c of p[g]) { expect(DUR[c.clip], c.clip).toBeDefined(); expect(c.time).toBeGreaterThanOrEqual(0); expect(c.time).toBeLessThanOrEqual(DUR[c.clip] + 1e-9); expect(c.weight).toBeGreaterThanOrEqual(0); }
        }
        expect(Number.isFinite(p.pelvisLift)).toBe(true);
      }
      // the pose shown on a pulse's tick is the clip's marker (combo hits, the knot, the ult's three hits, the needle's emission)
      for (const e of ev) if ((e.t === 'attack-pulse' && e.kind !== 'shadow_thread') || e.t === 'needle-spawn') {
        const p = an.sample(e.tick);
        const top = p.upper.reduce((b, c) => (c.weight > b.weight ? c : b));
        expect(markers[top.clip]?.some((m) => Math.abs(m / 30 - top.time) < 1e-9), `${e.t} at ${top.clip} ${top.time * 30}`).toBe(true);
        checked++;
      }
    }
    expect(w.victory).toBe(true);
    expect(checked).toBeGreaterThan(40);
  });
});
