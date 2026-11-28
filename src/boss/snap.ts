// Reads what the boss clock needs from the world of the ruleset being played, after a sim step (DES-010 §3.3: from `world`,
// never from the shared ENEMIES table). Read-only.
import type { World } from '../../shared/sim/world.ts';
import type { BossSnap } from './bossClock.ts';

export function snapBoss(w: World): BossSnap {
  const b = w.boss;
  return {
    tick: w.tick - 1, id: b.id, alive: b.alive, started: w.bossStarted, state: b.state, st: b.st, atk: b.atk, x: b.x, z: b.z,
    teles: w.tele.map((t) => ({ id: t.id, owner: t.owner, atk: t.atk.id, shape: t.shape, t: t.t, total: t.total, x: t.x, z: t.z, dx: t.dx, dz: t.dz, r: t.r, w: t.w, cos: t.cos })),
  };
}
