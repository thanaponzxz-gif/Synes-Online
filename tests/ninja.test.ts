// `ninja-roam-1` (DES-007 rev 4 §3, §8.3-8.4): tick-exact rules. t0 = the tick that accepts a command; an action runs on
// local ticks [0, end); "hit at 5" means the step that simulates tick t0+5.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { lab, dummy, stunnedBoss, enemyHit, step, until, of, dealt, taken } from './ninjaLab.ts';
import { World } from '../shared/sim/world.ts';
import { createWorld } from '../shared/sim/createWorld.ts';
import { BTN } from '../shared/sim/input.ts';
import { DEFAULT_VARIANT } from '../shared/sim/variant.ts';
import { levelFor, enemiesFor, tuningHash, parseRuleset, rulesetFromQuery, NINJA_RULESET, RULESETS, ALL_RULESETS } from '../shared/sim/ruleset.ts';
import { segmentCrossesCircle } from '../shared/sim/ninjaGeom.ts';
import { TICK } from '../shared/data/tuning.ts';
import { fingerprint } from './rulesetDigest.ts';

const golden = JSON.parse(fs.readFileSync(new URL('./fixtures/ruleset-golden.json', import.meta.url), 'utf8'));
const x0 = -2, z0 = -76;
const A = BTN.ATTACK, D = BTN.DODGE, S1 = BTN.SKILL, S2 = BTN.SKILL2, S3 = BTN.SKILL3, ULT = BTN.ULT, P = BTN.POTION;

describe('the ruleset', () => {
  it('is a separate world: createWorld gives it, the plain World refuses it', () => {
    expect(NINJA_RULESET).toBe('ninja-roam-1');
    expect(ALL_RULESETS).toEqual([...RULESETS, 'ninja-roam-1']);
    expect(parseRuleset('ninja-roam-1')).toBe('ninja-roam-1');
    expect(() => new World(1, { ...DEFAULT_VARIANT }, NINJA_RULESET)).toThrow(/createWorld/);
    const w = createWorld(1, { ...DEFAULT_VARIANT }, NINJA_RULESET);
    expect([w.player.maxHp, w.player.r]).toEqual([120, 0.42]);
    expect(createWorld(1, { ...DEFAULT_VARIANT }, 'combat-2').constructor).toBe(World);
  });
  it('is never what the published client picks', () => {
    for (const s of ['', 'roam=0', 'combo=A', 'combo=1', 'ninja=1', 'combo=ninja-roam-1']) expect(rulesetFromQuery(new URLSearchParams(s))).not.toBe(NINJA_RULESET);
  });
  it('plays on its own copy of the roam-1 level and enemy numbers taken at the implementation base', () => {
    expect(fingerprint(levelFor(NINJA_RULESET))).toBe(golden.level['roam-1']);
    expect(fingerprint(enemiesFor(NINJA_RULESET))).toBe(golden.enemies);
    expect(levelFor(NINJA_RULESET)).not.toBe(levelFor('roam-1'));
    expect(enemiesFor(NINJA_RULESET)).not.toBe(enemiesFor('roam-1'));
  });
  it('has its own tuning hash', () => {
    expect(tuningHash(NINJA_RULESET)).toMatch(/^[0-9a-f]{16}$/);
    expect(new Set(ALL_RULESETS.map(tuningHash)).size).toBe(ALL_RULESETS.length);
    for (const r of RULESETS) expect(tuningHash(r), r).toBe(golden.tuningHash[r]);
  });
  it('shared/ never calls trig, random or the clock', () => {
    const files = fs.readdirSync(new URL('../shared/', import.meta.url), { recursive: true }).map(String).filter((f) => f.endsWith('.ts'));
    expect(files.length).toBeGreaterThan(8);
    for (const f of files) {
      const code = fs.readFileSync(new URL(`../shared/${f.replace(/\\/g, '/')}`, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      expect(code, f).not.toMatch(/Math\.(sin|cos|tan|atan2?|asin|acos|pow|random|exp|log|hypot)\b|Date\.|new Date|performance\.now/);
    }
  });
});

describe('combo 1-3', () => {
  it('hits on ticks 5 / 5 / 9, ends at 11 / 12 / 18, for 10 / 12 / 20', () => {
    const w = lab(), t = dummy(w, 'puffcap', 0, -2);
    const r = [...step(w, A)];
    r.push(...until(w, 4)); r.push(...step(w, A)); // buffered for the end of swing 1 (11 - 4 < 8)
    r.push(...until(w, 18)); r.push(...step(w, A)); // buffered for the end of swing 2 (23 - 18 < 8)
    r.push(...until(w, 50));
    expect(dealt(r)).toEqual([[5, t.id, 10], [16, t.id, 12], [32, t.id, 20]]);
    expect(of(r, 'action-start').map((x) => [x.tick, x.e.kind, x.e.step])).toEqual([[0, 'attack', 0], [11, 'attack', 1], [23, 'attack', 2]]);
    expect(w.ns.action).toBeNull();
    expect(of(r, 'swing')).toEqual([]); // the old Wayfarer swing event (and its VFX ranges) is never sent
  });
  it('buffers one press for 8 ticks only', () => {
    const early = lab(); dummy(early, 'puffcap', 0, -2);
    step(early, A); until(early, 3); step(early, A); // 11 - 3 = 8: too old
    expect(of(until(early, 30), 'action-start')).toEqual([]);
    const ok = lab(); dummy(ok, 'puffcap', 0, -2);
    step(ok, A); until(ok, 4); step(ok, A);
    expect(of(until(ok, 30), 'action-start').map((x) => [x.tick, x.e.step])).toEqual([[11, 1]]);
  });
  it('continues until end+18 and then starts over at swing 1', () => {
    for (const [at, want] of [[11 + 17, 1], [11 + 18, 0]]) {
      const w = lab(); dummy(w, 'puffcap', 0, -2);
      step(w, A); until(w, at);
      expect(of(step(w, A), 'action-start')[0].e.step, `press at ${at}`).toBe(want);
    }
  });
  it('after swing 3 the next press is swing 1 again', () => {
    const w = lab(); dummy(w, 'puffcap', 0, -2);
    step(w, A); until(w, 8); step(w, A); until(w, 19); step(w, A); until(w, 41);
    expect(of(step(w, A), 'action-start')[0].e.step).toBe(0);
  });
  it('range includes the target radius (1.9 + 0.55)', () => {
    for (const [d, hit] of [[2.445, true], [2.455, false]] as const) {
      const w = lab(); dummy(w, 'puffcap', 0, -d);
      step(w, A);
      expect(dealt(until(w, 12)).length, `d=${d}`).toBe(hit ? 1 : 0);
    }
  });
  it('a 60 degree half arc, ignored when the target touches (r + 0.6)', () => {
    for (const [deg, d, hit] of [[59.5, 2.0, true], [60.5, 2.0, false], [180, 1.14, true], [180, 1.17, false]] as const) {
      const w = lab(); dummy(w, 'puffcap', 0, -1.2); // the nearer, active one takes the aim: facing stays (0,-1)
      const rad = (deg * Math.PI) / 180;
      const side = dummy(w, 'puffcap', d * Math.sin(rad), -d * Math.cos(rad), { active: false });
      step(w, A);
      expect(dealt(until(w, 12)).some((h) => h[1] === side.id), `${deg}deg at ${d}`).toBe(hit);
    }
  });
  it('aims at the nearest enemy within 3.0 m, else the stick, else keeps facing, and never re-aims mid swing', () => {
    const w = lab(), near = dummy(w, 'puffcap', 3.4, 0); // 3.4 - 0.55 = 2.85 < 3.0
    step(w, A, 0, 1);
    expect([w.player.fx, w.player.fz]).toEqual([1, 0]);
    near.x = w.player.x; near.z = w.player.z + 2; step(w, 0, 0, 1);
    expect([w.player.fx, w.player.fz]).toEqual([1, 0]);
    const far = lab(); dummy(far, 'puffcap', 3.6, 0);
    step(far, A, 0, 1);
    expect([far.player.fx, far.player.fz]).toEqual([0, 1]);
    const none = lab();
    step(none, A);
    expect([none.player.fx, none.player.fz]).toEqual([0, -1]);
  });
  it('walks at 0.35 speed while swinging, with no lunge and no knockback', () => {
    const w = lab(), t = dummy(w, 'puffcap', 0, -2.2);
    step(w, A);
    expect([w.player.x, w.player.z]).toEqual([x0, z0]);
    step(w, 0, 1, 0);
    expect(w.player.x - x0).toBeCloseTo(5.2 * 0.35 * TICK, 9);
    const tz = t.z; until(w, 12);
    expect(t.z).toBe(tz);
  });
});

describe('dodge', () => {
  it('moves 0.4 m on ticks 0-8 (3.6 m), then is ready again at tick 24', () => {
    const w = lab();
    step(w, D);
    expect(w.player.z).toBeCloseTo(z0 - 0.4, 9);
    until(w, 30);
    expect(w.player.z).toBeCloseTo(z0 - 3.6, 9);
    const w2 = lab(); step(w2, D); until(w2, 23);
    expect(of(step(w2, D), 'dodge')).toEqual([]);
    step(w2);
    expect(of(step(w2, D), 'dodge').length).toBe(1);
  });
  it('keeps the old facing for ticks 0-8 (hold-start) while dashing where the stick points', () => {
    const w = lab();
    const [first] = of(step(w, D, 1, 0), 'dodge');
    expect(first.e).toMatchObject({ preFx: 0, preFz: -1, dashX: 1, dashZ: 0 });
    for (let i = 0; i < 8; i++) { step(w, 0, 0, 1); expect([w.player.fx, w.player.fz]).toEqual([0, -1]); }
    expect(w.player.x - x0).toBeCloseTo(3.6, 9);
    step(w, 0, 0, 1);
    expect([w.player.fx, w.player.fz]).toEqual([0, 1]);
  });
  it('is invulnerable on ticks 0-8 only', () => {
    for (const [k, hurt] of [[0, false], [8, false], [9, true]] as const) {
      const w = lab(); enemyHit(w, k, 7);
      const r = [...step(w, D), ...until(w, 12)];
      expect(taken(r).length, `k=${k}`).toBe(hurt ? 1 : 0);
    }
  });
  it('perfect only on ticks 0-2: one counter charge and +1 meter, once per dodge, no cooldown refund', () => {
    const w = lab(); enemyHit(w, 2, 7); enemyHit(w, 2, 7); enemyHit(w, 4, 7);
    const r = [...step(w, D), ...until(w, 10)];
    expect(of(r, 'perfect').map((x) => x.tick)).toEqual([2]);
    expect(w.stats.perfect).toBe(1);
    expect(w.ns.meter).toBe(1);
    expect(w.ns.counterUntil).toBe(2 + 90);
    until(w, 23);
    expect(of(step(w, D), 'dodge')).toEqual([]); // still on the full 24-tick cooldown
    const late = lab(); enemyHit(late, 3, 7);
    expect(of([...step(late, D), ...until(late, 10)], 'perfect')).toEqual([]);
    expect([late.ns.meter, late.ns.counterUntil, taken(until(late, 11)).length]).toEqual([0, 0, 0]);
  });
});

describe('counterEcho (x1.5 on the first pulse that hits)', () => {
  const withCounter = () => { const w = lab(); w.ns.counterUntil = 90; return w; };
  it('boosts every target of that one pulse, then is spent', () => {
    const w = withCounter(), a = dummy(w, 'puffcap', 0, -2), b = dummy(w, 'puffcap', 0.6, -2.1, { active: false });
    step(w, A); const r = until(w, 5 + 1);
    expect(dealt(r)).toEqual([[5, a.id, 15], [5, b.id, 15]]);
    expect(of(r, 'hit').every((x) => x.e.counterApplied)).toBe(true);
    expect(w.ns.counterUntil).toBe(0);
    step(w, A); until(w, 11); expect(dealt(until(w, 20)).map((h) => h[2])).toEqual([12, 12]);
  });
  it('is kept by a miss and expires 90 ticks after it was earned', () => {
    const w = withCounter();
    step(w, A); until(w, 40);
    expect(w.ns.counterUntil).toBe(90);
    const t = dummy(w, 'puffcap', 0, -2);
    until(w, 84); expect(dealt([...step(w, A), ...until(w, 100)])).toEqual([[89, t.id, 15]]);
    const late = withCounter(); dummy(late, 'puffcap', 0, -2);
    until(late, 85); expect(dealt([...step(late, A), ...until(late, 100)]).map((h) => h[2])).toEqual([10]); // hit tick 90: gone
  });
  it('does not stack: a new perfect only restarts the 90 ticks', () => {
    const w = withCounter(); enemyHit(w, 31, 5);
    until(w, 30); step(w, D); step(w);
    expect(w.ns.counterUntil).toBe(31 + 90);
  });
});

describe('potion', () => {
  it('spends a charge at the start, heals 45 on tick 18 and ends at 19', () => {
    const w = lab(); w.player.hp = 50;
    step(w, P);
    expect(w.ns.potions).toBe(1);
    const r = until(w, 19);
    expect(of(r, 'heal').map((x) => [x.tick, x.e.amount])).toEqual([[18, 45]]);
    expect(w.player.hp).toBe(95);
    expect(w.ns.action?.kind).toBe('potion');
    step(w); expect(w.ns.action).toBeNull();
  });
  it('a dodge on tick 18 cancels before the heal and the charge is not returned', () => {
    const w = lab(); w.player.hp = 50;
    step(w, P); until(w, 18);
    const r = [...step(w, D), ...until(w, 30)];
    expect(of(r, 'heal')).toEqual([]);
    expect([w.player.hp, w.ns.potions]).toEqual([50, 1]);
  });
  it('walks at 0.4 while drinking; refused at full HP or with no charges', () => {
    const w = lab(); w.player.hp = 50;
    step(w, P); step(w, 0, 1, 0);
    expect(w.player.x - x0).toBeCloseTo(5.2 * 0.4 * TICK, 9);
    const full = lab(); step(full, P);
    expect([full.ns.action, full.ns.potions]).toEqual([null, 2]);
    const none = lab(); none.player.hp = 10; none.ns.potions = 0; step(none, P);
    expect(none.ns.action).toBeNull();
  });
});

describe('skill 1, echo needle', () => {
  it('releases on tick 5 and flies 0.5 m per tick on ticks 6-17, hitting once for 16 and leaving a 90-tick mark', () => {
    const w = lab(), t = dummy(w, 'puffcap', 0, -5);
    const r = [...step(w, S1), ...until(w, 40)];
    expect(of(r, 'needle-spawn').map((x) => [x.tick, x.e.x, x.e.z])).toEqual([[5, x0, z0]]);
    expect(of(r, 'needle-move').map((x) => x.tick)).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14]);
    expect(dealt(r)).toEqual([[14, t.id, 16]]); // gap 5 - (0.55 + 0.12) = 4.33 m, covered on the 9th move
    expect(of(r, 'mark-set').map((x) => [x.tick, x.e.target])).toEqual([[14, t.id]]);
    expect(w.ns.mark).toEqual({ target: t.id, at: 14 });
  });
  it('has 6 m of range and no homing', () => {
    for (const [d, hit] of [[6.66, true], [6.68, false]] as const) {
      const w = lab(); dummy(w, 'puffcap', 0, -d);
      const r = [...step(w, S1), ...until(w, 30)];
      expect(dealt(r).length, `d=${d}`).toBe(hit ? 1 : 0);
      if (!hit) expect(of(r, 'needle-despawn').map((x) => [x.tick, x.e.reason])).toEqual([[17, 'range']]);
    }
    const side = lab(); dummy(side, 'puffcap', 0.7, -4, { active: false });
    expect(dealt([...step(side, S1), ...until(side, 30)])).toEqual([]);
  });
  it('does not interrupt a wind-up', () => {
    const w = lab(), t = dummy(w, 'puffcap', 0, -3);
    t.state = 'windup'; t.st = 1e9;
    step(w, S1); until(w, 30);
    expect(t.state).toBe('windup');
  });
  it('is stopped by scenery before the enemy behind it, and never breaks a pillar', () => {
    const w = lab();
    Object.assign(w.player, { x: -8.2, z: -74, fx: 0, fz: 1 });
    const t = dummy(w, 'puffcap', 0, 6); // behind the pillar at (-8.2, -70.5)
    const r = [...step(w, S1), ...until(w, 30)];
    expect(dealt(r).filter((h) => h[1] === t.id)).toEqual([]);
    expect(of(r, 'needle-despawn').map((x) => x.e.reason)).toEqual(['scene']);
    expect(w.pillars.every((p) => p.alive)).toBe(true);
  });
  it('a dodge on tick 5 stops the release; a dodge later does not stop a flying needle', () => {
    const a = lab(); dummy(a, 'puffcap', 0, -5);
    step(a, S1); until(a, 5);
    const r = [...step(a, D, 1, 0), ...until(a, 30)];
    expect([of(r, 'needle-spawn').length, dealt(r).length]).toEqual([0, 0]);
    const b = lab(); const t = dummy(b, 'puffcap', 0, -5);
    step(b, S1); until(b, 8);
    expect(dealt([...step(b, D, 1, 0), ...until(b, 30)])).toEqual([[14, t.id, 16]]);
  });
  it('cooldown 90 from the accepted press, spent even when cancelled', () => {
    const w = lab();
    step(w, S1); until(w, 3); step(w, D); until(w, 89);
    expect(of(step(w, S1), 'action-start')).toEqual([]);
    expect(of(step(w, S1 | 0), 'action-start')).toEqual([]); // held button is not a new press
    step(w);
    expect(of(step(w, S1), 'action-start').map((x) => x.e.kind)).toEqual(['echo_needle']);
  });
  it('a needle still flying when its owner falls does damage but leaves no mark and no meter', () => {
    const w = lab(), b = stunnedBoss(w, 0, -6);
    step(w, S1); until(w, 8); w.player.hp = 1; enemyHit(w, 8, 50);
    const r = [...step(w), ...until(w, 25)];
    expect(of(r, 'player-down').map((x) => x.tick)).toEqual([8]);
    expect(dealt(r)).toEqual([[13, b.id, 24]]);
    expect([w.ns.mark, w.ns.meter]).toEqual([null, 0]);
  });
});

describe('the sound mark', () => {
  const marked = (d = 2) => { const w = lab(), t = dummy(w, 'puffcap', 0, -d); w.ns.mark = { target: t.id, at: 0 }; return { w, t }; };
  it('is eaten by a combo hit for +8, once', () => {
    const { w, t } = marked();
    const r = [...step(w, A), ...until(w, 6)];
    expect(dealt(r)).toEqual([[5, t.id, 18]]);
    expect(of(r, 'mark-consume').map((x) => x.e.target)).toEqual([t.id]);
    expect(of(r, 'hit')[0].e.markConsumed).toBe(true);
    expect(w.ns.mark).toBeNull();
  });
  it('is kept by a miss and expires after 90 ticks', () => {
    const { w, t } = marked();
    t.x += 30; step(w, A); until(w, 89);
    expect(w.ns.mark).toEqual({ target: t.id, at: 0 });
    step(w); expect(w.ns.mark).toEqual({ target: t.id, at: 0 });
    expect(of(step(w), 'mark-expire').map((x) => [x.tick, x.e.reason])).toEqual([[90, 'time']]);
  });
  it('a needle does not eat it: the same target is refreshed, another target takes it over', () => {
    const same = marked(4);
    const r = [...step(same.w, S1), ...until(same.w, 30)];
    expect(dealt(r).map((h) => h[2])).toEqual([16]);
    expect(of(r, 'mark-set')[0].e.refresh).toBe(true);
    expect(same.w.ns.mark!.at).toBeGreaterThan(0);
    const w = lab(), first = dummy(w, 'puffcap', 8, 0), second = dummy(w, 'puffcap', 0, -4);
    w.ns.mark = { target: first.id, at: 0 };
    const r2 = [...step(w, S1), ...until(w, 30)];
    expect(of(r2, 'mark-expire').map((x) => [x.e.target, x.e.reason])).toEqual([[first.id, 'moved']]);
    expect(w.ns.mark!.target).toBe(second.id);
  });
  it('goes when its target dies', () => {
    const { w, t } = marked(); t.hp = 1;
    const r = [...step(w, A), ...until(w, 6)];
    expect(w.ns.mark).toBeNull();
    expect(of(r, 'death').map((x) => x.e.id)).toEqual([t.id]);
  });
});

describe('skill 2, shadow thread', () => {
  it('dashes 0.5 m per tick on ticks 3-8 (3 m) facing the dash, without walking, cd 150, end 18', () => {
    const w = lab();
    step(w, S2, 1, 0);
    expect([w.player.fx, w.player.fz]).toEqual([1, 0]);
    until(w, 3, 0, 1); expect([w.player.x, w.player.z]).toEqual([x0, z0]);
    for (let k = 3; k <= 8; k++) { step(w, 0, 0, 1); expect(w.player.x - x0).toBeCloseTo((k - 2) * 0.5, 9); }
    until(w, 18, 0, 1); expect(w.player.x - x0).toBeCloseTo(3, 9); expect(w.player.z).toBe(z0);
    expect([w.player.fx, w.player.fz]).toEqual([1, 0]);
    until(w, 149); expect(of(step(w, S2), 'action-start')).toEqual([]);
    step(w); expect(of(step(w, S2), 'action-start').length).toBe(1);
  });
  it('hits everything on the walked corridor once each for 18 (half width 0.45 + radius)', () => {
    const w = lab(), inLane = dummy(w, 'puffcap', 0.99, -1.5, { active: false }), outLane = dummy(w, 'puffcap', -1.01, -1.5, { active: false });
    const r = [...step(w, S2), ...until(w, 20)];
    expect(dealt(r).map((h) => [h[1], h[2]])).toEqual([[inLane.id, 18]]);
    expect(dealt(r).some((h) => h[1] === outLane.id)).toBe(false);
  });
  it('stops at an enemy in the way (which it does hit) and nothing beyond it is hit', () => {
    const w = lab(), blocker = dummy(w, 'puffcap', 0, -1.8), behind = dummy(w, 'puffcap', 0, -3.2, { active: false });
    const r = [...step(w, S2), ...until(w, 9)];
    expect(w.player.z).toBeCloseTo(z0 - (1.8 - 0.97), 6);
    expect(dealt(r).map((h) => h[1])).toEqual([blocker.id]);
    expect(blocker.hp).toBe(1000 - 18);
    expect(behind.hp).toBe(1000);
  });
  it('stops at a pillar and at the edge of the walkable area', () => {
    const w = lab(); Object.assign(w.player, { x: -8.2, z: -73, fx: 0, fz: 1 });
    step(w, S2); until(w, 18);
    expect(w.player.z).toBeCloseTo(-70.5 - (0.85 + 0.42), 6);
    const edge = lab(); edge.player.z = -86.9;
    step(edge, S2); until(edge, 18);
    expect(edge.player.z).toBeCloseTo(-76 - (11.5 - 0.42), 5);
    expect(edge.player.x).toBeCloseTo(x0, 9);
  });
  it('has no i-frames, and a dodge in the middle stops the rest of the dash', () => {
    const w = lab(); enemyHit(w, 5, 9);
    expect(taken([...step(w, S2), ...until(w, 8)])).toEqual([[5, 9]]);
    const c = lab(); step(c, S2); until(c, 5);
    step(c, D, 1, 0); until(c, 40);
    expect(c.player.z).toBeCloseTo(z0 - 1.0, 9);
    expect(c.player.x - x0).toBeCloseTo(3.6, 9);
  });
  it('does not reach a target hidden right behind the enemy that stopped it, even inside the corridor width', () => {
    const w = lab(), blocker = dummy(w, 'puffcap', 0, -1.8), hidden = dummy(w, 'puffcap', 0.1, -1.82, { active: false });
    const r = [...step(w, S2), ...until(w, 18)];
    expect(Math.hypot(hidden.x - w.player.x, hidden.z - w.player.z)).toBeLessThanOrEqual(0.45 + 0.55); // within reach of the path end
    expect(dealt(r).map((h) => h[1])).toEqual([blocker.id]);
  });
  it('line of sight: a target on the far side of a solid is not reached', () => {
    expect(segmentCrossesCircle(0, 0, 2, 0, { x: 1, z: 0.1, r: 0.3 })).toBe(true);
    expect(segmentCrossesCircle(0, 0, 2, 0, { x: 1, z: 0.4, r: 0.3 })).toBe(false);
    expect(segmentCrossesCircle(0, 0, 2, 0, { x: 3, z: 0, r: 0.5 })).toBe(false);
  });
});

describe('skill 3, resonant knot', () => {
  it('hits on tick 14 and ends at 24; +12 base on a stunned target, x1.5 on a stunned boss', () => {
    const w = lab(), t = dummy(w, 'puffcap', 0, -2.5);
    expect(dealt([...step(w, S3), ...until(w, 24)])).toEqual([[14, t.id, 32]]);
    const s = lab(), b = stunnedBoss(s, 0, -3.5);
    expect(dealt([...step(s, S3), ...until(s, 24)])).toEqual([[14, b.id, 66]]);
    const all = lab(), b2 = stunnedBoss(all, 0, -3.5); all.ns.counterUntil = 90; all.ns.mark = { target: b2.id, at: 0 };
    expect(dealt([...step(all, S3), ...until(all, 24)])).toEqual([[14, b2.id, 117]]); // floor((32+8+12) x 1.5 x 1.5)
    until(w, 209); expect(of(step(w, S3), 'action-start')).toEqual([]);
    step(w); expect(of(step(w, S3), 'action-start').length).toBe(1);
  });
  it('reaches 2.5 m + radius in a 45 degree half arc', () => {
    for (const [deg, d, hit] of [[0, 3.04, true], [0, 3.06, false], [44.5, 2.5, true], [45.5, 2.5, false]] as const) {
      const w = lab(), rad = (deg * Math.PI) / 180;
      dummy(w, 'puffcap', d * Math.sin(rad), -d * Math.cos(rad), { active: false });
      expect(dealt([...step(w, S3), ...until(w, 24)]).length, `${deg}/${d}`).toBe(hit ? 1 : 0);
    }
  });
  it('locks where it started and which way it faces; walking and stick changes do nothing', () => {
    const w = lab();
    step(w, S3, 1, 0); until(w, 14, 0, 1);
    expect([w.player.x, w.player.z]).toEqual([x0, z0]);
    const pulse = of(step(w, 0, 0, 1), 'attack-pulse')[0].e;
    expect([pulse.x, pulse.z, pulse.fx, pulse.fz]).toEqual([x0, z0, 1, 0]);
  });
});

describe('ult, lumen loom', () => {
  const full = () => { const w = lab(); w.ns.meter = 4; return w; };
  it('needs 4 on the meter, spends it at once, hits 18 / 18 / 36 on ticks 9 / 15 / 21 and ends at 33', () => {
    const w = full(), t = dummy(w, 'puffcap', 0, -2);
    const r = step(w, ULT);
    expect(w.ns.meter).toBe(0);
    expect(of(r, 'meter-change').map((x) => x.e.value)).toEqual([0]);
    expect(dealt(until(w, 33))).toEqual([[9, t.id, 18], [15, t.id, 18], [21, t.id, 36]]);
    expect(w.ns.action?.kind).toBe('lumen_loom');
    step(w); expect(w.ns.action).toBeNull();
    const no = lab(); no.ns.meter = 3; step(no, ULT);
    expect([no.ns.action, no.ns.meter]).toEqual([null, 3]);
  });
  it('counter boosts only the first pulse that hits, and its own hits add no meter', () => {
    const w = full(), b = stunnedBoss(w, 0, -3); w.ns.counterUntil = 90;
    expect(dealt([...step(w, ULT), ...until(w, 33)]).map((h) => h[2])).toEqual([40, 27, 54]); // 18x1.5x1.5, 18x1.5, 36x1.5
    expect([w.ns.meter, b.alive]).toEqual([0, true]);
  });
  it('a dodge cancels the later pulses only, with no refund; cancelled before pulse 1 nothing hits', () => {
    const w = full(); dummy(w, 'puffcap', 0, -2);
    const r = [...step(w, ULT), ...until(w, 15)];
    r.push(...step(w, D, 1, 0), ...until(w, 40));
    expect(dealt(r).map((h) => h[2])).toEqual([18]);
    expect(w.ns.meter).toBe(0);
    const v = full(); dummy(v, 'puffcap', 0, -2);
    step(v, ULT); until(v, 9);
    expect(dealt([...step(v, D, 1, 0), ...until(v, 40)])).toEqual([]);
  });
});

describe('the meter', () => {
  it('gains 1 once per action that damages a stunned target, even across ticks and targets', () => {
    const w = lab(); stunnedBoss(w, 0, -3);
    step(w, A); until(w, 12);
    expect(w.ns.meter).toBe(1);
    const s2 = lab(); stunnedBoss(s2, 0, -2.4);
    step(s2, S2); until(s2, 18);
    expect(s2.ns.meter).toBe(1);
    const plain = lab(); dummy(plain, 'puffcap', 0, -2);
    step(plain, A); until(plain, 12);
    expect(plain.ns.meter).toBe(0);
  });
  it('gains 2 when the boss charges into a pillar, capped at 4', () => {
    const w = lab(); w.ns.meter = 3;
    const b = dummy(w, 'prismback', 0, 0);
    Object.assign(b, { x: -8.2, z: -73.2, state: 'charge', st: 0, dx: 0, dz: 1, travel: 0, hitDone: true });
    const r = step(w);
    expect(of(r, 'pillar-break').length).toBe(1);
    expect(w.ns.meter).toBe(4);
    expect(of(r, 'meter-change').map((x) => x.e.value)).toEqual([4]);
  });
  it('is lost on death, with the mark and the counter', () => {
    const w = lab(); w.ns.meter = 4; w.ns.counterUntil = 90;
    const t = dummy(w, 'puffcap', 5, 0, { active: false }); w.ns.mark = { target: t.id, at: 0 };
    w.player.hp = 1; enemyHit(w, 0, 50);
    const r = step(w);
    expect(of(r, 'mark-expire').map((x) => x.e.reason)).toEqual(['player-death']);
    expect([w.ns.down, w.ns.meter, w.ns.counterUntil, w.ns.mark]).toEqual([true, 0, 0, null]);
  });
});

describe('the pillar windows', () => {
  const stunTicks = (setup: (w: ReturnType<typeof lab>) => void) => {
    const w = lab(); setup(w);
    let n = 0;
    for (let i = 0; i < 200; i++) { step(w); if (w.boss.state === 'stunned') n++; else if (n) break; }
    return n;
  };
  it('pillar stun lasts exactly 78 ticks and a missed charge exactly 27', () => {
    expect(stunTicks((w) => Object.assign(dummy(w, 'prismback', 0, 0), { x: -8.2, z: -73.2, state: 'charge', st: 0, dx: 0, dz: 1, travel: 0, hitDone: true }))).toBe(78);
    expect(stunTicks((w) => { Object.assign(w.player, { x: 6, z: -76 }); Object.assign(dummy(w, 'prismback', 0, 0), { x: -2, z: -76, state: 'charge', st: 0, dx: -1, dz: 0, travel: 17.9, hitDone: true }); })).toBe(27);
  });
});

describe('input priority and cancels', () => {
  it('accepts one action per tick: dodge > potion > ult > skill 3 > skill 2 > skill 1 > attack', () => {
    const order = [D, P, ULT, S3, S2, S1, A], kinds = ['dodge', 'potion', 'lumen_loom', 'resonant_knot', 'shadow_thread', 'echo_needle', 'attack'];
    for (let i = 0; i < order.length; i++) {
      const w = lab(); w.ns.meter = 4; w.player.hp = 60;
      const b = order.slice(i).reduce((x, y) => x | y, 0);
      expect(of(step(w, b), 'action-start').map((x) => x.e.kind), kinds[i]).toEqual([kinds[i]]);
    }
  });
  it('a command that is not ready spends nothing and lets the next one in', () => {
    const w = lab(); w.ns.meter = 2; // ult not ready, potion at full HP not allowed
    expect(of(step(w, P | ULT | S3 | A), 'action-start').map((x) => x.e.kind)).toEqual(['resonant_knot']);
    expect([w.ns.meter, w.ns.potions]).toEqual([2, 2]);
  });
  it('during an action only a ready dodge gets in (skills and potion do not interrupt)', () => {
    const w = lab(); w.player.hp = 60; w.ns.meter = 4;
    step(w, A); step(w); step(w, P | ULT | S1 | S2 | S3);
    expect(w.ns.action?.kind).toBe('attack');
    expect([w.ns.potions, w.ns.meter, w.skillCooldown(1).remaining]).toEqual([2, 4, expect.any(Number)]);
    expect(w.skillCooldown(1).remaining).toBeLessThanOrEqual(0);
    step(w);
    const r = step(w, D);
    expect(of(r, 'action-cancel').length).toBe(1);
    expect(w.ns.action?.kind).toBe('dodge');
  });
  it.each([['attack 1', A, 5], ['knot', S3, 14], ['loom pulse 1', ULT, 9]] as const)('dodging on the hit tick of %s removes that hit; one tick later it stays', (_n, b, hit) => {
    for (const [at, count] of [[hit, 0], [hit + 1, 1]] as const) {
      const w = lab(); w.ns.meter = 4; dummy(w, 'puffcap', 0, -2);
      const r = [...step(w, b), ...until(w, at), ...step(w, D, 1, 0), ...until(w, 45)];
      expect(dealt(r).length, `dodge at ${at}`).toBe(count);
    }
  });
  it('the cancelled action ends at once: the rest of the swing never happens', () => {
    const w = lab(); dummy(w, 'puffcap', 0, -2);
    step(w, A); until(w, 2);
    expect(dealt([...step(w, D, 1, 0), ...until(w, 30)])).toEqual([]);
  });
});

describe('tick order', () => {
  it('a player pulse that kills an enemy stops that enemy\'s damage on the same tick', () => {
    const w = lab(), t = dummy(w, 'puffcap', 0, -2, { hp: 5 });
    step(w, A); until(w, 5);
    enemyHit(w, 5, 30, t);
    const r = step(w);
    expect(dealt(r)).toEqual([[5, t.id, 10]]);
    expect(taken(r)).toEqual([]);
  });
  it('enemy damage from several sources applies by actor id, and stops when the player falls', () => {
    const w = lab(); w.player.hp = 10;
    const hi = dummy(w, 'thornling', 0, -9, { active: false }), lo = dummy(w, 'puffcap', 3, -9, { active: false });
    expect(lo.id).toBeLessThan(hi.id);
    enemyHit(w, 0, 7, hi); enemyHit(w, 0, 6, lo); enemyHit(w, 0, 99, hi);
    expect(taken(step(w))).toEqual([[0, 6], [0, 7]]);
    expect(w.stats.damageTaken).toBe(13);
  });
});

describe('falling and getting up', () => {
  it('retry works from 25 ticks after the fall and restores a fresh fighter', () => {
    const w = lab(); w.player.hp = 1; w.ns.potions = 0; enemyHit(w, 3, 10);
    until(w, 4);
    expect(w.ns.down).toBe(true);
    until(w, 3 + 24);
    step(w, BTN.RETRY);
    expect(w.ns.down).toBe(true);
    step(w);
    const r = step(w, BTN.RETRY); // tick 3 + 26
    expect(of(r, 'respawn').length).toBe(1);
    expect([w.ns.down, w.player.hp, w.ns.potions, w.ns.meter, w.ns.action, w.ns.needles.length]).toEqual([false, 120, 2, 0, null, 0]);
  });
  it('the exact edge is tick 25', () => {
    for (const [wait, up] of [[24, false], [25, true]] as const) {
      const w = lab(); w.player.hp = 1; enemyHit(w, 0, 10); step(w);
      until(w, wait); step(w, BTN.RETRY);
      expect(!w.ns.down, `after ${wait}`).toBe(up);
    }
  });
});

describe('what the renderer and HUD read stays consistent', () => {
  it('mirrors potions, dodge ring, counter, swing and fall into ps, and never starts a Wayfarer cast', () => {
    const w = lab(); w.player.hp = 60;
    step(w, A); expect([w.ps.combo, w.ps.swingT > 0, w.ps.cast]).toEqual([0, true, null]);
    until(w, 11); step(w, P); expect([w.ps.potions, w.ps.drinkT > 0]).toEqual([1, true]);
    step(w, D); expect(w.ps.dodgeT > 0).toBe(true);
    expect(w.ps.dodgeCd).toBeGreaterThan(0);
    until(w, 80); expect(w.ps.dodgeCd).toBeLessThanOrEqual(0);
    step(w, S1); expect([w.ps.cast, w.skillCooldown(1).total]).toEqual([null, 90 * TICK]);
    expect(w.skillCooldown(1).remaining).toBeCloseTo(89 * TICK, 9);
  });
});
