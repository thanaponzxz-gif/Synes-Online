// A controlled `ninja-roam-1` world for tick-exact tests: every enemy is removed, then only the ones a test needs are put
// back, frozen. Distances are measured from the player at the empty centre of the arena.
import { createWorld } from '../shared/sim/createWorld.ts';
import type { NinjaWorld } from '../shared/sim/ninjaWorld.ts';
import type { Actor, SimEvent, Telegraph } from '../shared/sim/world.ts';
import { quantize } from '../shared/sim/input.ts';
import { DEFAULT_VARIANT } from '../shared/sim/variant.ts';
import { TICK, type EnemyKind } from '../shared/data/tuning.ts';

export const CENTRE = { x: -2, z: -76 };

export function lab(): NinjaWorld {
  const w = createWorld(1, { ...DEFAULT_VARIANT }, 'ninja-roam-1') as NinjaWorld;
  for (const a of w.actors) if (a.kind !== 'player') { a.alive = false; a.hp = 0; }
  w.tele = [];
  Object.assign(w.player, { x: CENTRE.x, z: CENTRE.z, fx: 0, fz: -1 });
  w.events = [];
  return w;
}

/** Put one enemy of `kind` back at (player + dx, dz), standing still (a very long recovery), with plenty of HP. */
export function dummy(w: NinjaWorld, kind: EnemyKind, dx: number, dz: number, opts: { active?: boolean; hp?: number } = {}): Actor {
  const a = w.actors.find((x) => x.kind === kind && !x.alive)!;
  Object.assign(a, { alive: true, hp: opts.hp ?? 1000, maxHp: 1000, x: w.player.x + dx, z: w.player.z + dz, state: 'recover', st: 1e9, active: opts.active ?? true, flinch: 0 });
  if (kind === 'prismback') w.bossStarted = true;
  return a;
}
/** A boss that stays stunned (the ✦ window) at (player + dx, dz). */
export function stunnedBoss(w: NinjaWorld, dx: number, dz: number): Actor {
  const b = dummy(w, 'prismback', dx, dz);
  b.state = 'stunned'; b.st = 1e9;
  return b;
}

/** An enemy attack that lands on the player during the step that simulates tick `atTick`, owned by a far-away enemy. */
export function enemyHit(w: NinjaWorld, atTick: number, dmg = 10, owner?: Actor): Actor {
  const o = owner ?? w.actors.find((a) => a.kind === 'thornling' && a.alive && a.group === 'attacker') ?? (() => {
    const t = dummy(w, 'thornling', 0, -10, { active: false }); t.group = 'attacker'; return t;
  })();
  const tele: Telegraph = {
    id: 90000 + atTick * 10 + w.tele.length, owner: o.id, atk: { id: 'lab', nameTh: 'lab', shape: 'circle', windup: 1, dmg, r: 60, tipTh: '' },
    enemyTh: 'lab', shape: 'circle', x: w.player.x, z: w.player.z, dx: 0, dz: 1, r: 60, w: 0, cos: 0,
    t: (atTick - w.tick + 0.5) * TICK, total: 1, area: true,
  };
  w.tele.push(tele);
  return o;
}

export type Ev<T extends SimEvent['t']> = Extract<SimEvent, { t: T }>;
export interface Rec { tick: number; e: SimEvent }

/** Steps one tick with the given buttons/stick; returns this tick's events (copied). */
export function step(w: NinjaWorld, b = 0, mx = 0, mz = 0): Rec[] {
  const tick = w.tick;
  return w.step(quantize(mx, mz, b)).map((e) => ({ tick, e }));
}
/** Steps with no buttons until `tick` is the next tick to be simulated. */
export function until(w: NinjaWorld, tick: number, mx = 0, mz = 0): Rec[] {
  const out: Rec[] = [];
  while (w.tick < tick) out.push(...step(w, 0, mx, mz));
  return out;
}
export const of = <T extends SimEvent['t']>(recs: Rec[], t: T) => recs.filter((r) => r.e.t === t) as { tick: number; e: Ev<T> }[];
/** player damage dealt to enemies, as [tick, targetId, amount] */
export const dealt = (recs: Rec[]) => of(recs, 'hit').filter((r) => r.e.byPlayer).map((r) => [r.tick, r.e.target, r.e.amount]);
/** damage taken by the player, as [tick, amount] */
export const taken = (recs: Rec[]) => of(recs, 'hit').filter((r) => !r.e.byPlayer).map((r) => [r.tick, r.e.amount]);
