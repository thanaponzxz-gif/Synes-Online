import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { World, type SimEvent, type Actor } from '../shared/sim/world.ts';
import { InputLog, BTN, type TickInput } from '../shared/sim/input.ts';
import { replayRun } from '../shared/rules/validate.ts';
import { SKILLS, ULT, ENEMIES, PLAYER, TICK } from '../shared/data/tuning.ts';
import { len } from '../shared/sim/math.ts';
import { Bot } from './bot.ts';

const NONE: TickInput = { mx: 0, mz: 0, b: 0 };
const BIT = { 1: BTN.SKILL, 2: BTN.SKILL2, 3: BTN.SKILL3 } as const;
const press = (b: number, mx = 0, mz = 0): TickInput => ({ mx, mz, b });
const HOP = ENEMIES.puffcap.attacks.hop;

/** Empty arena: only the player (at the camp, facing -z); everything else dead. */
function arena(): World {
  const w = new World(1);
  for (const e of w.actors) if (e.kind !== 'player') { e.alive = false; e.hp = 0; }
  return w;
}
/** Frozen, tough dummy (no attacks, no movement) of a real enemy kind. */
function dummy(w: World, x: number, z: number, kind: 'puffcap' | 'thornling' = 'puffcap'): Actor {
  const d = ENEMIES[kind];
  const e = (w as any).mkActor(kind, x, z, d.radius, 1000, 'test') as Actor;
  e.active = true; e.state = 'recover'; e.st = 1e9;
  return e;
}
const run = (w: World, n: number, inp: TickInput = NONE) => { const ev: SimEvent[] = []; for (let i = 0; i < n; i++) ev.push(...w.step(inp)); return ev; };
/** Start a cast now (tick 0 of the cast), then run quietly to the tick before the hit and return. */
function castToBeforeHit(w: World, slot: 1 | 2 | 3, mx = 0, mz = 0) {
  w.step(press(BIT[slot], mx, mz));
  while (w.ps.cast!.tick < w.ps.cast!.hitTick - 1) w.step(NONE);
}
const hitEv = (ev: SimEvent[]) => ev.filter((e): e is Extract<SimEvent, { t: 'skill-hit' }> => e.t === 'skill-hit');
/** Largest boundary pair on a monotone predicate: pred(inside) true, pred(outside) false, adjacent doubles. */
function boundary(pred: (v: number) => boolean, inside: number, outside: number): [number, number] {
  let a = inside, b = outside;
  for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (m === a || m === b) break; if (pred(m)) a = m; else b = m; }
  return [a, b];
}

describe('skill data (UI contract)', () => {
  it('SKILLS table and locked ult', () => {
    expect(SKILLS.map((s) => [s.slot, s.id, s.cdTicks, s.prepTicks, s.hitTick, s.endTick])).toEqual([
      [1, 'chime', 241, 10, 10, 10], [2, 'crescent', 135, 6, 6, 12], [3, 'crystal', 360, 15, 15, 24]]);
    expect(SKILLS[1].radius).toBe(3.0); expect(SKILLS[1].cosHalf).toBe(0.642788); expect(SKILLS[1].dmg).toBe(22);
    expect(SKILLS[2].radius).toBe(1.5); expect(SKILLS[2].ahead).toBe(2.6); expect(SKILLS[2].dmg).toBe(48);
    expect(ULT.locked).toBe(true);
  });
  it('chime ticks match the real sim (resolves on the 11th tick, cooldown gap 241)', () => {
    const w = arena(), e = dummy(w, 0, -1.5);
    const ev: SimEvent[] = [];
    let hitAt = -1, starts: number[] = [];
    for (let i = 0; i < 600; i++) {
      const out = w.step(press(i === 0 || i === 239 || i === 241 ? BTN.SKILL : 0));
      for (const x of out) { if (x.t === 'skill') starts.push(i); if (x.t === 'skill-hit' && hitAt < 0) hitAt = i; }
      ev.push(...out);
    }
    expect(hitAt).toBe(SKILLS[0].hitTick);
    expect(starts).toEqual([0, 241]);
    expect(e.hp).toBe(1000 - 2 * PLAYER.skill.dmg);
  });
  it('World.skillCooldown reports ready / remaining / total in seconds', () => {
    const w = arena();
    expect(w.skillCooldown(2)).toEqual({ remaining: 0, total: 135 * TICK });
    w.step(press(BTN.SKILL2));
    expect(w.skillCooldown(2).remaining).toBeCloseTo(135 * TICK, 9);
    run(w, 10);
    expect(w.skillCooldown(2).remaining).toBeCloseTo(125 * TICK, 9);
    expect(w.skillCooldown(3).remaining).toBe(0);
    expect(w.skillCooldown(1).total).toBe(PLAYER.skill.cooldown);
  });
  it('ps.cast carries slot / tick / locked position and direction', () => {
    const w = arena();
    w.step(press(BTN.SKILL3));
    expect(w.ps.cast).toMatchObject({ slot: 3, tick: 0, hitTick: 15, endTick: 24, x: 0, z: 1.5, dx: 0, dz: -1 });
    run(w, 5);
    expect(w.ps.cast!.tick).toBe(5);
    w.step(press(0)); // chime: cast set too, endTick = hitTick
    const w2 = arena();
    w2.step(press(BTN.SKILL));
    expect(w2.ps.cast).toMatchObject({ slot: 1, tick: 0, hitTick: 10, endTick: 10 });
  });
});

describe('Crescent Cut geometry (slot 2)', () => {
  // player at (0, 1.5) facing -z; target at (x, z)
  const cast = (x: number, z: number) => {
    const w = arena(), e = dummy(w, x, z);
    castToBeforeHit(w, 2);
    e.x = x; e.z = z; // exact placement for the hit tick
    const ev = w.step(NONE);
    return { e, hits: hitEv(ev)[0].hits, w };
  };
  it('range edge: exactly R + target radius hits, one ulp outside misses', () => {
    const R = 3.0 + ENEMIES.puffcap.radius;
    const [inZ, outZ] = boundary((z) => len(0, z - 1.5) <= R, 1.5 - 1, 1.5 - 10);
    expect(cast(0, inZ).hits).toBe(1);
    expect(cast(0, outZ).hits).toBe(0);
    expect(cast(0, outZ).e.hp).toBe(1000);
  });
  it('angle edge: dot == 0.642788 hits, just outside misses', () => {
    const c = SKILLS[1].cosHalf!;
    const [inX, outX] = boundary((x) => (x * 0 + -2 * -1) / len(x, -2) >= c, 0, 5);
    expect(cast(inX, -0.5).hits).toBe(1);
    expect(cast(outX, -0.5).hits).toBe(0);
    expect(cast(0, -0.5).e.hp).toBe(1000 - 22);
  });
  it('targets behind the player are missed; targets are picked at the hit tick, not at the start', () => {
    expect(cast(0, 3.5).hits).toBe(0);
    const w = arena(), e = dummy(w, 0, 10);
    castToBeforeHit(w, 2);
    e.x = 0; e.z = -0.5; // walks in during prep
    expect(hitEv(w.step(NONE))[0].hits).toBe(1);
    const w2 = arena(), e2 = dummy(w2, 0, -0.5);
    castToBeforeHit(w2, 2);
    e2.alive = false; // died during prep
    expect(hitEv(w2.step(NONE))[0].hits).toBe(0);
  });
  it('direction is locked at start: movement input direction if moving, else last facing', () => {
    const w = arena(), e = dummy(w, 3.4, 1.5); // to the +x side
    castToBeforeHit(w, 2, 64, 0); // moving +x
    e.x = 3.4; e.z = 1.5;
    const ev = w.step(press(0, -64, 0)); // pushing the other way during prep changes nothing
    expect(hitEv(ev)[0]).toMatchObject({ dx: 1, dz: 0, hits: 1 });
    expect(w.player.x).toBe(0);
  });
  it('boss is only hit once the fight has started', () => {
    const w = arena();
    const b = w.boss; b.alive = true; b.hp = b.maxHp; b.x = 0; b.z = 1.5 - 2.5;
    castToBeforeHit(w, 2);
    b.x = 0; b.z = 1.5 - 2.5;
    expect(hitEv(w.step(NONE))[0].hits).toBe(0);
    const w2 = arena(); w2.bossStarted = true;
    const b2 = w2.boss; b2.alive = true; b2.hp = b2.maxHp; b2.active = true; b2.state = 'recover'; b2.st = 1e9; b2.x = 0; b2.z = 1.5 - 2.5;
    castToBeforeHit(w2, 2);
    b2.x = 0; b2.z = 1.5 - 2.5;
    expect(hitEv(w2.step(NONE))[0].hits).toBe(1);
    expect(b2.hp).toBe(b2.maxHp - 22);
  });
});

describe('Crystal Break geometry (slot 3)', () => {
  const cast = (x: number, z: number) => {
    const w = arena(), e = dummy(w, x, z);
    castToBeforeHit(w, 3);
    e.x = x; e.z = z;
    return { hits: hitEv(w.step(NONE))[0].hits, e };
  };
  // circle centre = (0, 1.5 - 2.6) = (0, -1.1), radius 1.5 + target radius
  it('radius edge along x and z: boundary hits, one ulp outside misses', () => {
    const R = 1.5 + ENEMIES.puffcap.radius, cz = 1.5 + -1 * 2.6;
    const [inX, outX] = boundary((x) => len(x, 0) <= R, 0, 5);
    expect(cast(inX, cz).hits).toBe(1);
    expect(cast(outX, cz).hits).toBe(0);
    const [inZ, outZ] = boundary((z) => len(0, z - cz) <= R, cz, cz - 5);
    expect(cast(0, inZ).hits).toBe(1);
    expect(cast(0, outZ).hits).toBe(0);
    expect(cast(0, cz).e.hp).toBe(1000 - 48);
  });
  it('is centred 2.6 m ahead of the start position (player spot and far side miss)', () => {
    expect(cast(0, 1.5).hits).toBe(0); // on the player: 2.6 away from the centre
    expect(cast(0, 1.5 - 5.2).hits).toBe(0); // far side
    expect(cast(0, 1.5 - 2.6).hits).toBe(1);
  });
});

describe('cooldowns and acceptance', () => {
  const accepts = (slot: 2 | 3, presses: number[], total: number) => {
    const w = arena(), at: number[] = [];
    for (let i = 0; i < total; i++) for (const e of w.step(press(presses.includes(i) ? BIT[slot] : 0))) if (e.t === 'skill-start') at.push(i);
    return at;
  };
  it('slot 2: press 1 tick early ignored, exactly on time accepted', () => {
    expect(accepts(2, [0, 134], 160)).toEqual([0]);
    expect(accepts(2, [0, 135], 160)).toEqual([0, 135]);
  });
  it('slot 3: press 1 tick early ignored, exactly on time accepted', () => {
    expect(accepts(3, [0, 359], 400)).toEqual([0]);
    expect(accepts(3, [0, 360], 400)).toEqual([0, 360]);
  });
  it('slot 1 (chime): cooldown gap is 241 ticks as in the old code', () => {
    const w = arena(), at: number[] = [];
    for (let i = 0; i < 300; i++) for (const e of w.step(press(i === 0 || i === 239 || i === 241 ? BTN.SKILL : 0))) if (e.t === 'skill') at.push(i);
    expect(at).toEqual([0, 241]);
  });
  it('cooldown starts when the cast is accepted (cancel keeps it)', () => {
    const w = arena();
    w.step(press(BTN.SKILL2));
    expect(w.ps.cdT[1]).toBe(135);
  });
  it('cannot start a skill while another is active; BTN.ULT does nothing', () => {
    const w = arena();
    w.step(press(BTN.SKILL2));
    run(w, 1);
    const ev = w.step(press(BTN.SKILL3 | BTN.SKILL | BTN.ULT));
    expect(ev.some((e) => e.t === 'skill-start' || e.t === 'skill')).toBe(false);
    expect(w.ps.cast!.slot).toBe(2);
    const w2 = arena(); const x0 = JSON.stringify([w2.player.x, w2.player.z, w2.ps]);
    w2.step(press(BTN.ULT));
    expect(w2.events.filter((e) => e.t.startsWith('skill') || e.t === 'swing' || e.t === 'dodge')).toEqual([]);
    expect(w2.ps.cast).toBeNull(); void x0;
  });
});

describe('cancel, death, recovery', () => {
  it('dodge during prep cancels: no damage, cooldown stays, no i-frame loss of control', () => {
    const w = arena(), e = dummy(w, 0, -0.5);
    w.step(press(BTN.SKILL2));
    run(w, 2);
    const ev = w.step(press(BTN.DODGE));
    expect(ev.some((x) => x.t === 'skill-cancel' && x.slot === 2)).toBe(true);
    expect(w.ps.cast).toBeNull();
    expect(w.ps.dodgeT).toBeGreaterThan(0);
    const rest = run(w, 40);
    expect(hitEv(rest).length).toBe(0);
    expect(e.hp).toBe(1000);
    expect(w.skillCooldown(2).remaining).toBeGreaterThan(0);
    expect(w.skillCooldown(2).remaining).toBeCloseTo((135 - 3 - 40) * TICK, 9);
  });
  it('skills grant no i-frames', () => {
    const w = arena();
    w.step(press(BTN.SKILL3));
    expect(w.ps.iframes).toBeLessThanOrEqual(0);
  });
  it('death before the hit tick: no damage, cast gone, cooldown kept', () => {
    const w = arena(), e = dummy(w, 0, -0.5);
    w.step(press(BTN.SKILL3)); e.x = 0; e.z = -1.1;
    run(w, 4);
    w.player.hp = 1;
    const evs: SimEvent[] = [];
    (w as any).hurtPlayer(10, 'test', HOP);
    evs.push(...w.events);
    expect(w.ps.down).toBe(true);
    expect(w.ps.cast).toBeNull();
    expect(evs.some((x) => x.t === 'skill-cancel' && x.slot === 3)).toBe(true);
    e.x = 0; e.z = -1.1;
    const rest = run(w, 40);
    expect(hitEv(rest).length).toBe(0);
    expect(e.hp).toBe(1000);
    expect(w.skillCooldown(3).remaining).toBe(356 * TICK); // kept (not reset by death; down: ticks do not run)
  });
  it('after the hit tick a dodge cancels the recovery immediately (and before it, no movement/attack/potion)', () => {
    const w = arena(), e = dummy(w, 0, -1.1);
    castToBeforeHit(w, 3);
    e.x = 0; e.z = -1.1;
    expect(hitEv(w.step(NONE))[0].hits).toBe(1); // tick 15
    // recovery: moving, attacking and drinking do nothing
    const x0 = w.player.x, z0 = w.player.z;
    run(w, 3, press(BTN.ATTACK | BTN.POTION, 64, 64));
    expect([w.player.x, w.player.z]).toEqual([x0, z0]);
    expect(w.ps.swingT).toBeLessThanOrEqual(0);
    expect(w.ps.cast).not.toBeNull();
    const ev = w.step(press(BTN.DODGE, 64, 0));
    expect(w.ps.cast).toBeNull();
    expect(w.ps.dodgeT).toBeGreaterThan(0);
    expect(ev.some((x) => x.t === 'skill-cancel')).toBe(false); // damage already done
    expect(w.player.x).toBeGreaterThan(x0);
    expect(e.hp).toBe(1000 - 48);
  });
  it('movement returns at the end tick without a dodge', () => {
    const w = arena();
    w.step(press(BTN.SKILL2));
    run(w, 11, press(0, 64, 0));
    expect(w.player.x).toBe(0); // ticks 1..11 still locked
    run(w, 1, press(0, 64, 0)); // tick 12 = end tick
    expect(w.ps.cast).toBeNull();
    expect(w.player.x).toBeGreaterThan(0);
  });
  it('one hit per target per use, several targets each hit once', () => {
    const w = arena(), a = dummy(w, 0, -0.5), b = dummy(w, 0.8, -0.2, 'thornling');
    w.step(press(BTN.SKILL2)); a.x = 0; a.z = -0.5; b.x = 0.8; b.z = -0.2;
    const ev = run(w, 30);
    expect(hitEv(ev).map((h) => h.hits)).toEqual([2]);
    expect(a.hp).toBe(978); expect(b.hp).toBe(978);
    expect(ev.filter((e) => e.t === 'hit' && e.byPlayer).length).toBe(2);
  });
  it('no stun, interrupt or knockback from slots 2-3', () => {
    const w = arena(), e = dummy(w, 0, -0.5);
    e.state = 'windup'; e.st = 1e9;
    w.step(press(BTN.SKILL2)); e.x = 0; e.z = -0.5;
    const ev = run(w, 14);
    expect(e.state).toBe('windup');
    expect(e.z).toBe(-0.5);
    expect(ev.some((x) => x.t === 'interrupt' || x.t === 'stun')).toBe(false);
  });
  it('chime still interrupts a winding-up enemy (slot 1 rule kept)', () => {
    const w = arena(), e = dummy(w, 0, -0.5);
    e.state = 'windup'; e.st = 1e9;
    const ev = run(w, 12, press(0));
    w.step(NONE);
    void ev;
    const w2 = arena(), e2 = dummy(w2, 0, -0.5);
    e2.state = 'windup'; e2.st = 1e9;
    w2.step(press(BTN.SKILL));
    const ev2 = run(w2, 12);
    expect(ev2.some((x) => x.t === 'interrupt')).toBe(true);
  });
  it('chime cannot be dodge-cancelled (old rule, Q2)', () => {
    const w = arena();
    w.step(press(BTN.SKILL));
    w.step(press(BTN.DODGE));
    expect(w.ps.cast).not.toBeNull();
    expect(w.ps.dodgeT).toBeLessThanOrEqual(0);
  });
});

describe('perfect dodge and empowered bonus', () => {
  it('refund applies to slot 1 only; empowered bonus is spent by slot 2/3 hits', () => {
    const w = arena(), e = dummy(w, 0, -0.5);
    w.step(press(BTN.SKILL | 0)); run(w, 20); // chime on cooldown
    const left = w.ps.skillCd;
    w.step(press(BTN.SKILL2));
    const cd2 = w.ps.cdT[1];
    w.ps.iframes = 0.3;
    (w as any).hurtPlayer(10, 'test', HOP); // absorbed = perfect dodge
    expect(w.ps.empowered).toBe(true);
    expect(w.ps.skillCd).toBeCloseTo(left - TICK - PLAYER.perfect.skillCdRefund, 9);
    expect(w.ps.cdT[1]).toBe(cd2); // slot 2 untouched
    expect(w.ps.cdT[2]).toBe(0);
    e.x = 0; e.z = -0.5;
    run(w, 14);
    expect(e.hp).toBe(1000 - 34 - Math.round(22 * PLAYER.perfect.critMul)); // chime 34 earlier (no crit), crescent crit
    expect(w.ps.empowered).toBe(false);
  });
});

describe('"dodge-early" event', () => {
  const stand = (w: World) => { w.player.x = 0; w.player.z = 0; };
  it('area telegraph: dodge, i-frames end, same attack hits -> event once', () => {
    const w = arena(); stand(w);
    (w as any).addTele(w.boss, 'test', HOP, 0, 0, 0, 1, 1.2, true);
    const ev: SimEvent[] = [];
    ev.push(...w.step(press(BTN.DODGE, 64, 0)));
    for (let i = 0; i < 9; i++) ev.push(...w.step(NONE)); // dash over
    for (let i = 0; i < 30; i++) ev.push(...w.step(press(0, -64, 0))); // walk back into the circle before it lands
    expect(ev.filter((e) => e.t === 'hit' && !e.byPlayer).length).toBe(1);
    expect(ev.filter((e) => e.t === 'dodge-early').length).toBe(1);
  });
  it('no event when the dodge absorbed the hit (perfect) or the player stayed out', () => {
    const w = arena(); stand(w);
    (w as any).addTele(w.boss, 'test', HOP, 0, 0, 0, 1, 0.2, true);
    const ev = [...w.step(press(BTN.DODGE, 64, 0)), ...run(w, 12)];
    expect(ev.some((e) => e.t === 'perfect' || e.t === 'hit')).toBe(false);
    expect(ev.some((e) => e.t === 'dodge-early')).toBe(false);
  });
  it('no event for an attack that was telegraphed after the dodge started', () => {
    const w = arena(); stand(w);
    w.step(press(BTN.DODGE, 64, 0));
    run(w, 12);
    (w as any).addTele(w.boss, 'test', HOP, w.player.x, w.player.z, 0, 1, 0.1, true);
    const ev = run(w, 6);
    expect(ev.some((e) => e.t === 'hit' && !e.byPlayer)).toBe(true);
    expect(ev.some((e) => e.t === 'dodge-early')).toBe(false);
  });
  it('non-area rush (thornling): dodge during windup, hit by the same rush -> event', () => {
    const w = arena(); stand(w);
    const t = (w as any).mkActor('thornling', 0, -5.5, ENEMIES.thornling.radius, 55, 'test') as Actor;
    t.active = true; t.state = 'approach';
    const ev: SimEvent[] = [];
    let dodged = false;
    for (let i = 0; i < 90; i++) {
      const windup = w.tele.some((x) => x.owner === t.id);
      ev.push(...w.step(windup && !dodged ? press(BTN.DODGE, 0, -64) : NONE)); // dash toward it (-z) so the line still reaches
      if (windup) dodged = true;
    }
    expect(dodged).toBe(true);
    expect(ev.filter((e) => e.t === 'hit' && !e.byPlayer).length).toBeGreaterThanOrEqual(1);
    expect(ev.filter((e) => e.t === 'dodge-early').length).toBe(1);
  });
});

describe('replay determinism with skills', () => {
  it('old r3 log still replays to the exact old summary (default variant)', () => {
    const r = JSON.parse(fs.readFileSync(new URL('./fixtures/r3-run.json', import.meta.url), 'utf8'));
    expect(JSON.stringify(replayRun(r.seed, r.inputLog).summary)).toBe(
      '{"victory":true,"ticks":2199,"seconds":73.3,"damageTaken":98,"perfect":2,"deaths":0,"dodges":16,"potionsUsed":1,"hitsLanded":70,"bossHpLeft":0,"phase":2}');
  });
  it('a log using all 3 skills replays to the same summary every time; server replayRun accepts it', () => {
    const seen = new Set<number>();
    let result: { log: number[]; sum: ReturnType<World['summary']> } | null = null;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const w = new World(seed), bot = new Bot(1, { useSkills: true }), log = new InputLog();
      seen.clear();
      while (!w.finished && w.tick < 30 * 60 * 8) {
        const i = bot.think(w); log.push(i);
        for (const e of w.step(i)) if (e.t === 'skill-start') seen.add(e.slot);
      }
      if (seen.size === 3) { result = { log: log.data, sum: w.summary() }; break; }
    }
    expect(result, 'bot used all three slots').not.toBeNull();
    const a = replayRun(1, result!.log), b = replayRun(1, result!.log);
    void a; void b;
    // replay with the same seed that produced it
    const seed = [1, 2, 3, 4, 5, 6].find((s) => { const v = replayRun(s, result!.log); return v.ok && JSON.stringify(v.summary) === JSON.stringify(result!.sum); });
    expect(seed).toBeDefined();
    const v1 = replayRun(seed!, result!.log), v2 = replayRun(seed!, result!.log);
    expect(v1.ok).toBe(true);
    expect(v1.summary).toEqual(v2.summary);
    expect(v1.summary).toEqual(result!.sum);
  });
  it('server replayRun accepts logs with SKILL2 / SKILL3 / ULT bits', () => {
    const log = [10, 0, 0, 0, 1, 0, 0, BTN.SKILL2, 1, 0, 0, 0, 1, 0, 0, BTN.SKILL3, 20, 0, 0, 0, 1, 0, 0, BTN.SKILL2 | BTN.SKILL3 | BTN.ULT, 5, 0, 0, 0];
    const v = replayRun(1, log);
    expect(v.ok).toBe(true);
    expect(v.summary!.ticks).toBe(39);
    expect(replayRun(1, [1, 0, 0, 256]).ok).toBe(false);
  });
});
