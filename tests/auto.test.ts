// Auto attack (DES-001 §4, round 3 step 3): controller rules, input-log format v2, server replay.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { World, type SimEvent, type Actor } from '../shared/sim/world.ts';
import { InputLog, BTN, LOG_V2_HEADER, isV2Log, type TickInput } from '../shared/sim/input.ts';
import { AutoState, AUTO_BAN_TICKS, AUTO_KINDS, AUTO_RADIUS, AUTO_STUCK_TICKS, autoAllowedHere, defaultAuto, packAuto, unpackAuto, zonesAt, type AutoSettings } from '../shared/sim/auto.ts';
import { checkLog, replayRun } from '../shared/rules/validate.ts';
import { ENEMIES, PLAYER } from '../shared/data/tuning.ts';
import { LEVEL } from '../shared/data/level.ts';
import { dist } from '../shared/sim/math.ts';
import { Bot } from './bot.ts';

const NONE: TickInput = { mx: 0, mz: 0, b: 0 };
const HOP = ENEMIES.puffcap.attacks.hop;
const cfg = (o: Partial<AutoSettings> = {}): AutoSettings => ({ ...defaultAuto(), enabled: true, ...o });
const withAuto = (s: AutoSettings, inp: TickInput = NONE): TickInput => ({ ...inp, auto: packAuto(s) });

/** Empty world: only the player (camp, (0,1.5), facing -z). */
function arena(): World {
  const w = new World(1);
  for (const e of w.actors) if (e.kind !== 'player') { e.alive = false; e.hp = 0; }
  return w;
}
/** Frozen enemy of a real kind (no attacks, no movement). hp defaults to "tough". */
function dummy(w: World, x: number, z: number, kind: 'puffcap' | 'thornling' = 'puffcap', hp = 1000): Actor {
  const d = ENEMIES[kind];
  const e = (w as any).mkActor(kind, x, z, d.radius, hp, 'test') as Actor;
  e.active = true; e.state = 'recover'; e.st = 1e9;
  return e;
}
const run = (w: World, n: number, inp: TickInput = NONE) => { const ev: SimEvent[] = []; for (let i = 0; i < n; i++) ev.push(...w.step(inp)); return ev; };
const enable = (w: World, o: Partial<AutoSettings> = {}) => { w.step(withAuto(cfg(o))); };
/** decide without stepping: returns the input Auto would send now */
const decide = (w: World, o: Partial<AutoSettings> = {}): TickInput => { w.auto.apply(w, packAuto(cfg(o))); return w.auto.resolve(w, NONE); };

describe('settings pack / unpack', () => {
  it('defaults are the DES values: all kinds, radius 8, skills off, keep off, disabled', () => {
    expect(defaultAuto()).toEqual({ enabled: false, kinds: 0, hall: false, radius: 8, skills: [false, false, false], keep: false });
    expect(AUTO_RADIUS).toEqual({ min: 4, max: 20, def: 8 });
  });
  it('round-trips every combination of the switches and the radius range', () => {
    for (let a = 0; a < 64; a++) for (const kinds of [0, 1, 2, 3]) for (const radius of [4, 8, 13, 20]) {
      const s: AutoSettings = { enabled: !!(a & 1), hall: !!(a & 2), skills: [!!(a & 4), !!(a & 8), !!(a & 16)], keep: !!(a & 32), kinds, radius };
      expect(unpackAuto(packAuto(s))).toEqual(s);
    }
  });
  it('rejects out-of-range or non-integer fields', () => {
    const ok = packAuto(cfg());
    expect(unpackAuto({ a: 64, b: ok.b })).toBeNull();
    expect(unpackAuto({ a: -1, b: ok.b })).toBeNull();
    expect(unpackAuto({ a: 1, b: 3 | (3 << 8) })).toBeNull(); // radius 3 < 4
    expect(unpackAuto({ a: 1, b: 21 << 8 })).toBeNull(); // radius 21 > 20
    expect(unpackAuto({ a: 1, b: 4 | (8 << 8) })).toBeNull(); // unknown kind bit
    expect(unpackAuto({ a: 1.5, b: ok.b })).toBeNull();
    expect(unpackAuto({ a: 1, b: 0 })).toBeNull(); // radius 0
    expect(AUTO_KINDS).toEqual(['puffcap', 'thornling']);
  });
  it('an invalid command is ignored by the sim (settings keep their old value)', () => {
    const w = arena();
    w.step({ ...NONE, auto: { a: 99, b: 0 } });
    expect(w.auto.s).toEqual(defaultAuto());
  });
});

describe('target choice', () => {
  it('nearest enemy first, then it keeps that target until it dies even if a nearer one shows up', () => {
    const w = arena();
    const far = dummy(w, 0, -4, 'puffcap', 30), near = dummy(w, 4, 1.5, 'puffcap', 1000);
    enable(w);
    expect(w.auto.target).toBe(near.id); // distance 4 < 5.5
    const closer = dummy(w, -0.5, 1.5, 'puffcap', 1000); // appears right next to the player
    run(w, 5);
    expect(w.auto.target).toBe(near.id);
    void far; void closer;
  });
  it('re-picks after the target dies', () => {
    const w = arena();
    const a = dummy(w, 0, -1.5, 'puffcap', 20), b = dummy(w, 0, 6, 'puffcap', 1000);
    enable(w);
    expect(w.auto.target).toBe(a.id);
    let guard = 0;
    while (a.alive && guard++ < 300) w.step(NONE);
    expect(a.alive).toBe(false);
    run(w, 2);
    expect(w.auto.target).toBe(b.id);
  });
  it('exact distance tie goes to the LOWEST id, whichever side it stands on', () => {
    for (const lowIdRight of [true, false]) {
      const w = arena();
      const first = dummy(w, lowIdRight ? 2.5 : -2.5, -1.5), second = dummy(w, lowIdRight ? -2.5 : 2.5, -1.5);
      expect(first.id).toBeLessThan(second.id);
      enable(w);
      expect(w.auto.target, `lowIdRight=${lowIdRight}`).toBe(first.id);
    }
  });
  it('kind filter: "all" takes both kinds, a chosen set only those kinds', () => {
    const w = arena();
    const pc = dummy(w, 0, -1.5, 'puffcap'), th = dummy(w, 3, 1.5, 'thornling');
    enable(w, { kinds: 0 });
    expect(w.auto.target).toBe(pc.id);
    const w2 = arena();
    dummy(w2, 0, -1.5, 'puffcap'); const th2 = dummy(w2, 3, 1.5, 'thornling');
    enable(w2, { kinds: 2 }); // thornling only
    expect(w2.auto.target).toBe(th2.id);
    const w3 = arena(); dummy(w3, 0, -1.5, 'puffcap');
    enable(w3, { kinds: 2 });
    expect(w3.auto.target).toBe(0); // nothing of the chosen kind
    void th;
  });
  it('the boss is never a target, dead enemies are never picked', () => {
    const w = arena();
    const dead = dummy(w, 0, -1.5); dead.alive = false;
    w.boss.alive = true; w.boss.hp = 1000; w.boss.x = 0; w.boss.z = -2.5; // right next to the player (test only)
    enable(w, { hall: true });
    expect(w.auto.target).toBe(0);
  });
});

describe('area', () => {
  it('radius mode: inclusive edge of the radius around the SAVED centre, not the player', () => {
    const w = arena();
    const e = dummy(w, 0, 1.5 - 4);          // exactly radius 4 from the centre
    const e2 = dummy(w, 0, 1.5 - 4.0001);    // just outside
    enable(w, { radius: 4 });
    expect(w.auto.target).toBe(e.id);
    expect((w.auto as AutoState).cz).toBe(1.5);
    e.alive = false; e.hp = 0;
    run(w, 2);
    expect(w.auto.target).toBe(0); // e2 is outside the 4 m circle
    expect(e2.alive).toBe(true);
  });
  it('radius 8 reaches an enemy 8 m away on the trail, radius 4 does not', () => {
    const near = arena(); dummy(near, 0, -6.5); enable(near, { radius: 8 });
    expect(near.auto.target).toBeGreaterThan(0);
    const small = arena(); dummy(small, 0, -6.5); enable(small, { radius: 4 });
    expect(small.auto.target).toBe(0);
  });
  it('"whole hall" ignores the radius but stays inside the zone', () => {
    const w = arena();
    const trail = dummy(w, 2.6, -24); // far (25 m) but in the same zone (camp + trail)
    enable(w, { hall: true, radius: 4 });
    expect(w.auto.target).toBe(trail.id);
    const w2 = arena();
    dummy(w2, 3, -37); // clearing: a different zone from the camp
    enable(w2, { hall: true });
    expect(w2.auto.target).toBe(0);
    const w3 = arena();
    dummy(w3, 3, -37);
    enable(w3, { hall: false, radius: 20 }); // 38 m away anyway; and radius mode is confined to the centre's zones too
    expect(w3.auto.target).toBe(0);
  });
  it('the clearing is its own hall: standing there, whole-hall reaches every enemy in it', () => {
    const w = arena();
    w.player.x = 3; w.player.z = -37;
    const a = dummy(w, 9, -34), b = dummy(w, -3, -41);
    enable(w, { hall: true });
    expect(zonesAt(w, 3, -37)).toBe(1 << LEVEL.autoZones.findIndex((z) => z.id === 'clearing'));
    expect([a.id, b.id]).toContain(w.auto.target);
  });
  it('no target: walks back to the centre and waits there', () => {
    const w = arena();
    enable(w);
    w.player.x = 3; w.player.z = -3; // knocked away (test only)
    run(w, 120);
    expect(dist(w.player.x, w.player.z, 0, 1.5)).toBeLessThan(0.35);
    const x = w.player.x, z = w.player.z;
    run(w, 60);
    expect([w.player.x, w.player.z]).toEqual([x, z]);
  });
});

describe('zone boundaries and gates', () => {
  it('never targets or walks into the exit trail: another zone, whether the gate is closed or open', () => {
    const w = arena();
    w.player.x = 3; w.player.z = -37; // clearing
    w.gates.clearingExit = true; // gate open: the trail beyond is physically reachable
    const beyond = dummy(w, 1.5, -53);
    expect(zonesAt(w, beyond.x, beyond.z)).toBe(1 << LEVEL.autoZones.findIndex((z) => z.id === 'exit'));
    enable(w, { hall: true });
    run(w, 120);
    expect(w.auto.target).toBe(0);
    expect(w.player.z).toBeGreaterThan(-45.5);
    expect(beyond.hp).toBe(1000);
  });
  it('closed gate: an enemy that the sim keeps on this side is fought, and the player never crosses the gate line', () => {
    const w = arena();
    w.player.x = 3; w.player.z = -37;
    expect(w.gates.clearingExit).toBe(false);
    const e = dummy(w, 1.5, -48, 'puffcap', 100000); // placed behind the gate: the sim clamps it back into the clearing
    e.group = 'clearing'; // (a living clearing enemy keeps the exit gate shut)
    enable(w, { hall: true });
    let minZ = 0;
    for (let i = 0; i < 200; i++) { w.step(NONE); minZ = Math.min(minZ, w.player.z); }
    expect(minZ).toBeGreaterThan(-45.5);
    expect(w.gates.clearingExit).toBe(false);
    expect(w.stats.hitsLanded).toBeGreaterThan(0);
  });
  it('a path that leaves open walkable ground makes the enemy unreachable', () => {
    const w = arena();
    w.player.x = 6; w.player.z = -1; // camp, east side
    const e = dummy(w, 7.5, -8); // outside both the camp circle and the trail capsule
    enable(w, { radius: 20 });
    expect(w.auto.target).toBe(0);
    e.x = 1.5; e.z = -9; run(w, 2); // now on the trail
    expect(w.auto.target).toBe(e.id);
  });
});

describe('stuck rule (30 ticks without progress)', () => {
  it('drops the target after 30 ticks, skips it for the ban time, then tries again', () => {
    const w = arena();
    const e = dummy(w, 0, -1.5);
    enable(w);
    expect(w.auto.target).toBe(e.id);
    let dropAt = -1, prevStuck = 0;
    for (let i = 0; i < 300 && dropAt < 0; i++) {
      e.hp = 1000; // an enemy nothing can hurt: no progress
      prevStuck = w.auto.stuck;
      w.step(NONE);
      if (w.auto.target === 0) dropAt = w.tick;
    }
    expect(dropAt).toBeGreaterThan(0);
    expect(prevStuck).toBe(AUTO_STUCK_TICKS - 1); // 29 ticks counted, the 30th drops it
    expect(w.auto.banned.get(e.id)).toBe(dropAt - 1 + AUTO_BAN_TICKS); // set during the tick that counted the 30th idle tick
    for (let i = 0; i < AUTO_BAN_TICKS - 5; i++) { e.hp = 1000; w.step(NONE); expect(w.auto.target).toBe(0); }
    for (let i = 0; i < 12; i++) { e.hp = 1000; w.step(NONE); }
    expect(w.auto.target).toBe(e.id);
  });
  it('progress (target losing hp) keeps resetting the counter', () => {
    const w = arena();
    const e = dummy(w, 0, -1.5, 'puffcap', 400);
    enable(w, { hall: true }); // (each hit also knocks the frozen dummy back, so use the whole hall)
    run(w, 150);
    expect(w.auto.target).toBe(e.id);
    expect(e.hp).toBeLessThan(400);
  });
  it('picks a different enemy when the stuck one is banned', () => {
    const w = arena();
    const stuck = dummy(w, 0, -1.5), other = dummy(w, 5, 1.5, 'puffcap', 1000);
    enable(w);
    let guard = 0;
    while (w.auto.target === stuck.id && guard++ < 300) { stuck.hp = 1000; w.step(NONE); }
    run(w, 1);
    expect(w.auto.target).toBe(other.id);
  });
});

describe('manual input wins and pauses Auto', () => {
  it('manual input is passed through untouched and Auto resumes only after it is neutral AND the commanded action ended', () => {
    const w = arena();
    dummy(w, 0, -1.5);
    enable(w);
    const x0 = w.player.x;
    // manual walk east: the player really goes east although Auto would go to the enemy
    run(w, 10, { mx: 64, mz: 0, b: 0 });
    expect(w.player.x).toBeGreaterThan(x0 + 1);
    expect(w.auto.paused).toBe(true);
    // a manual attack tap
    w.step({ mx: 0, mz: 0, b: BTN.ATTACK });
    expect(w.ps.swingT).toBeGreaterThan(0);
    const swing = [];
    for (let i = 0; i < 4; i++) { w.step(NONE); swing.push(w.auto.paused); }
    expect(swing).toEqual([true, true, true, true]); // still mid-swing: stays paused, sends nothing
    run(w, 40);
    expect(w.auto.paused).toBe(false);
    run(w, 30);
    expect(w.auto.target).toBeGreaterThan(0);
  });
  it('a manual dodge command is not interrupted either', () => {
    const w = arena();
    dummy(w, 0, -1.5);
    enable(w);
    w.step({ mx: 64, mz: 0, b: BTN.DODGE });
    const t0 = w.ps.dodgeT;
    expect(t0).toBeGreaterThan(0);
    const xs: number[] = [];
    for (let i = 0; i < 4; i++) { w.step(NONE); xs.push(w.player.x); }
    expect(xs[3]).toBeGreaterThan(xs[0]); // the dash keeps going east
    expect(w.auto.paused).toBe(true);
  });
  it('the resolved input equals the manual one on a manual tick (b and movement)', () => {
    const w = arena();
    dummy(w, 0, -1.5);
    w.auto.apply(w, packAuto(cfg()));
    const m: TickInput = { mx: -20, mz: 10, b: BTN.POTION };
    expect(w.auto.resolve(w, m)).toBe(m);
  });
  it('Auto never presses dodge / potion / ult / retry', () => {
    const w = arena();
    dummy(w, 0, -1.5, 'puffcap', 100000);
    dummy(w, 1, -1.5, 'puffcap', 100000);
    w.player.hp = 10;
    let b = 0;
    w.auto.apply(w, packAuto(cfg({ skills: [true, true, true] })));
    for (let i = 0; i < 600; i++) { const r = w.auto.resolve(w, NONE); b |= r.b; w.step(NONE); w.player.hp = 10; }
    expect(b & (BTN.DODGE | BTN.POTION | BTN.ULT | BTN.RETRY)).toBe(0);
  });
});

describe('boss area', () => {
  it('walking into the boss approach turns Auto off with an event, and leaving does not turn it back on', () => {
    const w = arena();
    enable(w);
    expect(w.auto.s.enabled).toBe(true);
    w.player.x = -2; w.player.z = -63; // arenaEntry corridor: in no auto zone
    expect(autoAllowedHere(w)).toBe(false);
    const ev = run(w, 1);
    expect(ev.find((e) => e.t === 'auto-off')).toEqual({ t: 'auto-off', reason: 'boss' });
    expect(w.auto.s.enabled).toBe(false);
    w.player.x = 0; w.player.z = 1.5; // back at the camp
    dummy(w, 0, -1.5);
    run(w, 30);
    expect(w.auto.s.enabled).toBe(false);
    expect(w.auto.target).toBe(0);
  });
  it('enabling it inside the boss area is refused at once', () => {
    const w = arena();
    w.player.x = -2; w.player.z = -70;
    const ev = w.step(withAuto(cfg()));
    expect(ev.some((e) => e.t === 'auto-off')).toBe(true);
    expect(w.auto.s.enabled).toBe(false);
  });
  it('the boss fight starting also turns it off', () => {
    const w = new World(3, { dodgeCdTicks: 17, start: 'boss' });
    w.step(withAuto(cfg({ hall: true })));
    expect(w.auto.s.enabled).toBe(true); // the spring (exit zone) is a normal area
    w.bossStarted = true;
    const ev = run(w, 1);
    expect(ev.some((e) => e.t === 'auto-off')).toBe(true);
  });
});

describe('death and respawn', () => {
  const kill = (w: World) => { (w as any).hurtPlayer(9999, 'test', HOP); };
  const respawn = (w: World) => { for (let i = 0; i < 40; i++) w.step({ mx: 0, mz: 0, b: i % 2 ? BTN.RETRY : 0 }); };
  it('default (keep off): death clears the target and turns Auto off; it stays off after respawn', () => {
    const w = arena();
    dummy(w, 0, -1.5);
    enable(w);
    expect(w.auto.target).toBeGreaterThan(0);
    kill(w);
    expect(w.ps.down).toBe(true);
    const ev = run(w, 1);
    void ev;
    expect(w.auto.target).toBe(0);
    expect(w.auto.s.enabled).toBe(false);
    respawn(w);
    expect(w.ps.down).toBe(false);
    run(w, 30);
    expect(w.auto.s.enabled).toBe(false);
    expect(w.auto.target).toBe(0);
  });
  it('the off event for a death carries reason "down"', () => {
    const w = arena();
    dummy(w, 0, -1.5);
    enable(w);
    const ev: SimEvent[] = [];
    // hurtPlayer pushes into w.events during the step
    (w as any).hurtPlayer(9999, 'test', HOP);
    ev.push(...w.events);
    expect(ev).toContainEqual({ t: 'auto-off', reason: 'down' });
  });
  it('keep-after-respawn: stays on, centre moves to the respawn point, resumes in the allowed area', () => {
    const w = arena();
    dummy(w, 0, -1.5);
    w.checkpoint = { id: 'camp', x: 3, z: -10 }; // trail
    enable(w, { keep: true });
    kill(w);
    run(w, 3);
    expect(w.auto.s.enabled).toBe(true);
    expect(w.auto.target).toBe(0);
    const foe = dummy(w, 3, -12.5, 'puffcap', 20); // near the respawn point
    respawn(w);
    expect(w.ps.down).toBe(false);
    expect([w.auto.cx, w.auto.cz]).toEqual([3, -10]);
    let guard = 0;
    while (foe.alive && guard++ < 300) w.step(NONE);
    expect(foe.alive).toBe(false);
    expect(w.auto.s.enabled).toBe(true);
  });
  it('keep-after-respawn into a non-allowed area (boss approach) turns Auto off', () => {
    const w = arena();
    w.checkpoint = { id: 'x', x: -2, z: -63 };
    enable(w, { keep: true });
    kill(w);
    respawn(w);
    run(w, 2);
    expect(w.auto.s.enabled).toBe(false);
  });
});

describe('skills: fixed rule order, only enabled + ready slots', () => {
  const all = { skills: [true, true, true] as [boolean, boolean, boolean] };
  it('Chime Burst first: an enemy inside the burst is still winding up (would be interrupted)', () => {
    const w = arena();
    const a = dummy(w, 0, -1), b = dummy(w, 0.3, -1.3), c = dummy(w, 0, -2.3);
    a.state = 'windup'; a.st = 1; void b; void c; // two more in Crystal's area, one in the cone too
    expect(decide(w, all).b).toBe(BTN.SKILL);
  });
  it('a windup about to finish is not worth a Chime (it would land too late) -> falls through', () => {
    const w = arena();
    const a = dummy(w, 0, -1), b = dummy(w, 0.3, -2.4);
    a.state = 'windup'; a.st = 0.2; void b;
    expect(decide(w, all).b).toBe(BTN.SKILL3);
  });
  it('else Crystal Break when 2 or more enemies are inside its area', () => {
    const w = arena();
    dummy(w, 0, -1.2); dummy(w, 0.5, -1.4);
    expect(decide(w, all).b).toBe(BTN.SKILL3);
  });
  it('else Crescent Cut when at least 1 enemy is inside the cone', () => {
    const w = arena();
    dummy(w, 0, -1.5);
    expect(decide(w, all).b).toBe(BTN.SKILL2);
  });
  it('else a normal attack when no skill applies (all off, or cone not hit)', () => {
    const w = arena();
    dummy(w, 0, -0.5);
    expect(decide(w, { skills: [false, false, false] }).b).toBe(BTN.ATTACK);
  });
  it('switches are per slot: a slot that is off is never used even when it would be the best', () => {
    const w = arena();
    const a = dummy(w, 0, -1), b = dummy(w, 0.3, -1.3);
    a.state = 'windup'; a.st = 1; void b;
    expect(decide(w, { skills: [false, true, true] }).b).toBe(BTN.SKILL3); // chime off -> crystal
    const w2 = arena();
    dummy(w2, 0, -1.2); dummy(w2, 0.5, -1.4);
    expect(decide(w2, { skills: [true, true, false] }).b).toBe(BTN.SKILL2); // crystal off -> crescent
    const w3 = arena();
    dummy(w3, 0, -0.2); dummy(w3, 0.5, -0.4);
    expect(decide(w3, { skills: [true, false, false] }).b).toBe(BTN.ATTACK);
  });
  it('a skill on cooldown is skipped', () => {
    const w = arena();
    dummy(w, 0, -0.5);
    w.ps.cdT[1] = 50;
    expect(decide(w, all).b).toBe(BTN.ATTACK);
    const w2 = arena();
    const a = dummy(w2, 0, -1); a.state = 'windup'; a.st = 1;
    w2.ps.skillCd = 3;
    expect(decide(w2, all).b).toBe(BTN.SKILL2);
  });
  it('only a target inside the REAL hit area triggers a skill (out of range -> walk, no button)', () => {
    const w = arena();
    dummy(w, 0, -6); // 7.5 m away
    const r = decide(w, all);
    expect(r.b).toBe(0);
    expect(r.mz).toBeLessThan(0); // walking toward it
  });
  it('buttons are sent as rising edges only (never held two ticks in a row)', () => {
    const w = arena();
    dummy(w, 0, -1.5, 'puffcap', 100000);
    w.auto.apply(w, packAuto(cfg()));
    let prev = 0, held = 0;
    let sent = 0;
    for (let i = 0; i < 200; i++) { w.step(NONE); if (w.auto.lastB & prev) held++; if (w.auto.lastB) sent++; prev = w.auto.lastB; }
    expect(held).toBe(0);
    expect(sent).toBeGreaterThan(20);
  });
});

describe('Auto in the real level', () => {
  it('clears the two trail enemies by itself and returns to its centre (hall mode, all skills on)', () => {
    const w = new World(1);
    w.step(withAuto(cfg({ hall: true, skills: [true, true, true] })));
    const trail = w.actors.filter((e) => e.group === 'trail');
    expect(trail.length).toBe(2);
    for (let i = 0; i < 900; i++) w.step(NONE);
    expect(trail.every((e) => !e.alive)).toBe(true);
    expect(w.actors.filter((e) => e.group === 'clearing').every((e) => e.alive)).toBe(true); // another zone: untouched
    expect(dist(w.player.x, w.player.z, 0, 1.5)).toBeLessThan(0.5);
    expect(w.player.z).toBeGreaterThan(-33);
  });
  it('with Auto off nothing changes: a bot run is identical with the controller present (default settings)', () => {
    const run1 = (seed: number) => { const w = new World(seed), bot = new Bot(1); while (!w.finished && w.tick < 30 * 60 * 8) w.step(bot.think(w)); return JSON.stringify(w.summary()); };
    expect(run1(5)).toBe(run1(5));
    expect(JSON.parse(run1(5)).victory).toBe(true);
  });
});

describe('input log v2 format', () => {
  /** a scripted Auto run: settings commands at known ticks, manual taps in between */
  function script(seed = 1, n = 1500) {
    const w = new World(seed), log = new InputLog();
    const cmds: Record<number, AutoSettings> = {
      0: cfg({ hall: true, skills: [true, true, true] }),
      400: cfg({ hall: false, radius: 12, kinds: 1, skills: [false, true, false], keep: true }),
      900: { ...defaultAuto(), enabled: false },
      1000: cfg({ radius: 6 }),
    };
    const inputs: TickInput[] = [];
    for (let i = 0; i < n; i++) {
      const manual: TickInput = i >= 700 && i < 720 ? { mx: 30, mz: -20, b: i === 705 ? BTN.DODGE : 0 } : NONE;
      const inp: TickInput = cmds[i] ? { ...manual, auto: packAuto(cmds[i]) } : manual;
      inputs.push(inp); log.push(inp); w.step(inp);
    }
    return { w, log, inputs };
  }
  it('a log that never uses Auto is plain v1 (no header, every count >= 1) so old servers and fixtures keep working', () => {
    const log = new InputLog();
    for (let i = 0; i < 50; i++) log.push(NONE);
    expect(log.data).toEqual([50, 0, 0, 0]);
    expect(isV2Log(log.data)).toBe(false);
  });
  it('the old round-3 fixture is v1 and still replays to the exact old summary', () => {
    const r = JSON.parse(fs.readFileSync(new URL('./fixtures/r3-run.json', import.meta.url), 'utf8'));
    expect(isV2Log(r.inputLog)).toBe(false);
    expect(checkLog(r.inputLog)).toMatchObject({ ok: true, version: 1 });
    expect(JSON.stringify(replayRun(r.seed, r.inputLog).summary)).toBe(
      '{"victory":true,"ticks":2199,"seconds":73.3,"damageTaken":98,"perfect":2,"deaths":0,"dodges":16,"potionsUsed":1,"hitsLanded":70,"bossHpLeft":0,"phase":2}');
  });
  it('the first command adds the v2 header; commands are [0, op, a, b] tuples and never merge with tick runs', () => {
    const log = new InputLog();
    log.push(NONE); log.push(NONE);
    log.push({ ...NONE, auto: packAuto(cfg()) });
    log.push(NONE);
    const c = packAuto(cfg());
    expect(log.data).toEqual([...LOG_V2_HEADER, 2, 0, 0, 0, 0, 1, c.a, c.b, 2, 0, 0, 0]); // the command tick and the next identical tick form one run
    expect(isV2Log(log.data)).toBe(true);
    expect(checkLog(log.data)).toEqual({ ok: true, version: 2, ticks: 4 });
  });
  it('pack / unpack round trip: iterate() returns exactly the inputs that were pushed (commands on the right tick)', () => {
    const { log, inputs } = script();
    const back = [...InputLog.iterate(log.data)];
    expect(back.length).toBe(inputs.length);
    for (let i = 0; i < inputs.length; i++) {
      expect(back[i].mx, `tick ${i}`).toBe(inputs[i].mx);
      expect(back[i].mz).toBe(inputs[i].mz);
      expect(back[i].b).toBe(inputs[i].b);
      expect(back[i].auto ?? null).toEqual(inputs[i].auto ?? null);
    }
    // JSON round trip (what travels to the server) is lossless too
    expect(JSON.parse(JSON.stringify(log.data))).toEqual(log.data);
  });
  it('server replay of an Auto run reproduces the exact same world (summary and every actor), twice', () => {
    const { w, log } = script();
    expect(w.stats.hitsLanded).toBeGreaterThan(0); // Auto actually fought
    const v1 = replayRun(1, log.data), v2 = replayRun(1, log.data);
    expect(v1.ok).toBe(true);
    expect(v1.summary).toEqual(w.summary());
    expect(v2.summary).toEqual(v1.summary);
    // full-state comparison against a second world fed from the decoded log
    const w2 = new World(1);
    for (const inp of InputLog.iterate(log.data)) w2.step(inp);
    expect(w2.actors.map((a) => [a.id, a.x, a.z, a.hp, a.alive])).toEqual(w.actors.map((a) => [a.id, a.x, a.z, a.hp, a.alive]));
    expect(w2.auto.s).toEqual(w.auto.s);
  });
  it('without the Auto commands the same manual inputs give a different world (the commands matter)', () => {
    const { w, inputs } = script();
    const plain = new World(1);
    for (const i of inputs) plain.step({ mx: i.mx, mz: i.mz, b: i.b });
    expect(plain.stats.hitsLanded).not.toBe(w.stats.hitsLanded);
  });
  it('rejects malformed v2 logs and bad commands, accepts good ones', () => {
    const c = packAuto(cfg());
    const H = [...LOG_V2_HEADER];
    expect(checkLog([...H, 0, 1, c.a, c.b, 5, 0, 0, 0]).ok).toBe(true);
    expect(checkLog([...H]).ok).toBe(true);
    expect(checkLog([...H, 0, 2, c.a, c.b, 5, 0, 0, 0])).toEqual({ ok: false, reason: 'bad-auto-cmd' }); // unknown opcode
    expect(checkLog([...H, 0, 0, 2, 0, 5, 0, 0, 0])).toEqual({ ok: false, reason: 'bad-auto-cmd' }); // second header
    expect(checkLog([...H, 0, 1, 64, c.b, 5, 0, 0, 0])).toEqual({ ok: false, reason: 'bad-auto-cmd' });
    expect(checkLog([...H, 0, 1, 1, 3 << 8, 5, 0, 0, 0])).toEqual({ ok: false, reason: 'bad-auto-cmd' }); // radius 3
    expect(checkLog([...H, 0, 1, 1, 21 << 8, 5, 0, 0, 0])).toEqual({ ok: false, reason: 'bad-auto-cmd' });
    expect(checkLog([...H, 0, 1, 1.5, c.b, 5, 0, 0, 0])).toEqual({ ok: false, reason: 'non-integer' });
    expect(checkLog([...H, 0, 1, c.a, c.b, 5, 0, 0])).toEqual({ ok: false, reason: 'bad-log-shape' }); // partial tuple
    expect(checkLog([...H, 5, 99, 0, 0])).toEqual({ ok: false, reason: 'out-of-range' });
    expect(checkLog([...H, 70000, 0, 0, 0])).toEqual({ ok: false, reason: 'out-of-range' });
    expect(checkLog([...H, 1, 0, 0, 256])).toEqual({ ok: false, reason: 'out-of-range' });
  });
  it('a count-0 tuple without the header is still malformed (v1 is unchanged)', () => {
    expect(checkLog([0, 1, 1, 8 << 8])).toEqual({ ok: false, reason: 'out-of-range' });
    expect(checkLog([5, 0, 0, 0, 0, 1, 1, 8 << 8]).ok).toBe(false);
    expect(replayRun(1, [0, 0, 2, 0, 0, 0, 0, 0]).reason).toBe('bad-auto-cmd'); // header + a second version tuple
  });
  it('replayRun reports bad commands with a clear reason', () => {
    const v = replayRun(1, [...LOG_V2_HEADER, 0, 7, 0, 0, 3, 0, 0, 0]);
    expect(v).toEqual({ ok: false, reason: 'bad-auto-cmd' });
  });
});

describe('constants used by the UI', () => {
  it('exports the zone table the HUD uses and the allowed-area test', () => {
    expect(LEVEL.autoZones.map((z) => z.id)).toEqual(['path', 'clearing', 'exit']);
    const w = arena();
    expect(autoAllowedHere(w)).toBe(true);
    expect(PLAYER.radius).toBeGreaterThan(0);
  });
});
