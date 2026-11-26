// Free roam (ruleset roam-1, shared/data/roam.ts): open meadow, solid obstacles, gated boss arena, server replay.
import { describe, it, expect } from 'vitest';
import { World } from '../shared/sim/world.ts';
import { InputLog, quantize, type TickInput } from '../shared/sim/input.ts';
import { replayRun } from '../shared/rules/validate.ts';
import { levelFor, tuningHash } from '../shared/sim/ruleset.ts';
import { ROAM_LEVEL } from '../shared/data/roam.ts';
import { LEVEL, type Shape } from '../shared/data/level.ts';
import { PLAYER, ENEMIES } from '../shared/data/tuning.ts';
import { dist, norm } from '../shared/sim/math.ts';
import { Bot } from './bot.ts';
import { defaultAuto, packAuto, zonesAt } from '../shared/sim/auto.ts';

const R = PLAYER.radius;
function sdf(shapes: Shape[], x: number, z: number) {
  let best = 1e9;
  for (const s of shapes) {
    if (s.type === 'circle') { best = Math.min(best, Math.hypot(x - s.x, z - s.z) - s.r); continue; }
    const abx = s.bx - s.ax, abz = s.bz - s.az, k = Math.max(0, Math.min(1, ((x - s.ax) * abx + (z - s.az) * abz) / (abx * abx + abz * abz)));
    best = Math.min(best, Math.hypot(x - (s.ax + abx * k), z - (s.az + abz * k)) - s.r);
  }
  return best;
}
const FIELD = ROAM_LEVEL.walkable.filter((s) => !s.gate && s.id !== 'arena');
/** empty roam world (enemies removed) with the player at (x,z) */
function empty(x: number, z: number): World {
  const w = new World(1, undefined, 'roam-1');
  for (const e of w.actors) if (e.kind !== 'player') { e.alive = false; e.hp = 0; }
  w.player.x = x; w.player.z = z;
  return w;
}
/** walk toward (tx,tz) for n ticks (joystick full tilt) */
function walk(w: World, tx: number, tz: number, n: number) {
  for (let i = 0; i < n; i++) { const [dx, dz] = norm(tx - w.player.x, tz - w.player.z); w.step(quantize(dx, dz, 0)); }
}

describe('roam-1 level data (placeholder layout, REQ-006)', () => {
  it('roam-1 plays on the roam level; every other ruleset keeps the path-only level with no obstacles', () => {
    expect(levelFor('roam-1')).toBe(ROAM_LEVEL);
    for (const r of ['combat-1', 'combat-2', 'combo-A'] as const) { expect(levelFor(r)).toBe(LEVEL); expect(new World(1, undefined, r).level.obstacles).toEqual([]); }
    expect(ROAM_LEVEL.roam && !LEVEL.roam).toBe(true);
    expect(tuningHash('roam-1')).not.toBe(tuningHash('combat-2'));
  });
  it('obstacles sit inside the meadow, off the painted trail, and clear of the start, checkpoints, spawns and triggers', () => {
    const keep = [
      { x: ROAM_LEVEL.start.x, z: ROAM_LEVEL.start.z, r: R + 0.3 }, { x: ROAM_LEVEL.spring.x, z: ROAM_LEVEL.spring.z, r: ROAM_LEVEL.spring.r },
      { x: ROAM_LEVEL.spring.x, z: ROAM_LEVEL.spring.z + 1.2, r: R + 0.3 },
      ...ROAM_LEVEL.spawns.map((s) => ({ x: s.x, z: s.z, r: ENEMIES[s.kind].radius + 1 })),
      { ...ROAM_LEVEL.clearingTrigger },
    ];
    for (const o of ROAM_LEVEL.obstacles) {
      const tag = `${o.kind}@${o.x},${o.z}`;
      expect(sdf(FIELD, o.x, o.z), tag).toBeLessThan(-0.5);
      if (o.kind !== 'prop') expect(sdf(ROAM_LEVEL.paths, o.x, o.z), tag).toBeGreaterThanOrEqual(o.r + 1);
      for (const k of keep) expect(dist(o.x, o.z, k.x, k.z), `${tag} vs ${k.x},${k.z}`).toBeGreaterThanOrEqual(o.r + k.r);
    }
  });
  it('the old trail, all spawns, the spring and the gates stay inside the walkable area', () => {
    for (const s of ROAM_LEVEL.spawns) expect(sdf(FIELD, s.x, s.z)).toBeLessThan(-1);
    expect(sdf(FIELD, ROAM_LEVEL.spring.x, ROAM_LEVEL.spring.z)).toBeLessThan(-1);
    // every point of the old trail up to the clearing gate is walkable in the meadow
    for (let z = 1; z > -54; z -= 0.5) {
      const trail = LEVEL.walkable.filter((s) => s.id !== 'arena' && s.id !== 'arenaEntry');
      for (let x = -6; x <= 10; x += 0.5) if (sdf(trail, x, z) < -0.5 && z > -54) expect(sdf(FIELD, x, z), `${x},${z}`).toBeLessThan(0);
    }
  });
});

describe('roam-1 movement', () => {
  it('the player can walk off the old trail into the meadow (path-only level clamps the same walk)', () => {
    const w = empty(0, -10);
    walk(w, -15, -18, 120);
    expect(dist(w.player.x, w.player.z, -15, -18)).toBeLessThan(0.5);
    const old = new World(1, undefined, 'combat-2');
    for (const e of old.actors) if (e.kind !== 'player') { e.alive = false; e.hp = 0; }
    old.player.x = 0; old.player.z = -10;
    walk(old, -15, -18, 120);
    expect(dist(old.player.x, old.player.z, -15, -18)).toBeGreaterThan(10);
  });
  it('solid obstacles: walking (or dodging) straight into any of them never ends inside it', () => {
    for (const o of ROAM_LEVEL.obstacles) {
      for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const sx = o.x + ax * (o.r + 2.5), sz = o.z + az * (o.r + 2.5);
        if (sdf(FIELD, sx, sz) > -R) continue; // that side is outside the meadow
        const w = empty(sx, sz);
        for (let i = 0; i < 60; i++) {
          const [dx, dz] = norm(o.x - w.player.x, o.z - w.player.z);
          w.step(quantize(dx, dz, i === 20 ? 2 : 0)); // one dodge (BTN.DODGE) on the way in
          expect(dist(w.player.x, w.player.z, o.x, o.z), `${o.kind}@${o.x},${o.z}`).toBeGreaterThanOrEqual(o.r + R - 1e-3);
        }
      }
    }
  });
  it('the map edge holds: walking outward from the meadow stops at the edge', () => {
    for (const [tx, tz] of [[-40, -20], [40, -20], [0, 30], [30, -60], [-30, -60]]) {
      const w = empty(0, -25);
      walk(w, tx, tz, 300);
      expect(sdf(ROAM_LEVEL.walkable.filter((s) => !s.gate), w.player.x, w.player.z), `${tx},${tz}`).toBeLessThanOrEqual(-R + 1e-6);
    }
  });
  it('the boss arena is only reachable through its gate: locked while the clearing lives, open after (spring checkpoint start)', () => {
    const w = empty(-2, -50);
    // enemies are dead in empty(), so the gate opens on the first tick: keep it shut by reviving one clearing enemy far away
    const keeper = w.actors.find((e) => e.group === 'clearing')!; keeper.alive = true; keeper.hp = keeper.maxHp; keeper.x = 3; keeper.z = -37;
    walk(w, -2, -80, 240);
    expect(w.player.z).toBeGreaterThan(-55.7 + R - 0.01);
    expect(w.bossStarted).toBe(false);
    // around the side of the corridor: still blocked
    for (const tx of [-12, 8]) { const v = empty(tx, -46); const k = v.actors.find((e) => e.group === 'clearing')!; k.alive = true; k.hp = 9; k.x = 3; k.z = -37; walk(v, tx, -80, 240); expect(v.player.z).toBeGreaterThan(-58); }
    const b = new World(1, { dodgeCdTicks: 17, start: 'boss' }, 'roam-1');
    let started = false;
    for (let i = 0; i < 400 && !started; i++) { const [dx, dz] = norm(-2 - b.player.x, -76 - b.player.z); started = b.step(quantize(dx, dz, 0)).some((e) => e.t === 'boss-start'); }
    expect(started).toBe(true);
  });
});

describe('roam-1 Auto', () => {
  it('the whole meadow is one Auto zone; Auto clears the trail enemies from the camp without leaving the meadow', () => {
    const w = new World(1, undefined, 'roam-1');
    expect(zonesAt(w, -15, -20) & zonesAt(w, 0, 1.5)).not.toBe(0); // off-trail meadow and camp share a zone
    w.step({ mx: 0, mz: 0, b: 0, auto: packAuto({ ...defaultAuto(), enabled: true, hall: true, skills: [true, true, true] }) });
    for (let i = 0; i < 30 * 60 && w.actors.some((e) => e.group === 'trail' && e.alive); i++) w.step({ mx: 0, mz: 0, b: 0 });
    expect(w.actors.filter((e) => e.group === 'trail' && e.alive)).toEqual([]);
    expect(w.auto.s.enabled).toBe(true);
  });
});

describe('roam-1 runs', () => {
  it('the scripted bot wins on the roam level (seeds 1-4)', () => {
    for (const seed of [1, 2, 3, 4]) {
      const w = new World(seed, undefined, 'roam-1'), bot = new Bot(1);
      while (!w.finished && w.tick < 30 * 60 * 8) w.step(bot.think(w));
      expect(w.summary().victory, `seed ${seed}`).toBe(true);
    }
  });
  it('the server replay of a roam run matches the client tick for tick', () => {
    const w = new World(9, undefined, 'roam-1'), bot = new Bot(1), log = new InputLog();
    while (!w.finished && w.tick < 30 * 60 * 8) { const inp: TickInput = bot.think(w); log.push(inp); w.step(inp); }
    expect(replayRun(9, log.data, undefined, undefined, 'roam-1').summary).toEqual(w.summary());
    expect(w.summary().victory).toBe(true);
  });
});
