// Auto for `ninja-roam-1` (DES-007 §3.3): the same controller as auto.ts (zones, targets, walking, manual input wins, off in the boss
// area) with the ninja's skill rule: knot (3) when a stunned target is inside its arc -> needle (1) when a target is on the needle's
// line and no mark is out -> shadow thread (2, only when the player switched it on) when its whole path is clear of scenery and
// telegraphs and a target is in its corridor -> combo. Dodge, potion and the ult stay manual.
import { NINJA } from '../data/tuning.ts';
import { BTN } from './input.ts';
import { len } from './math.ts';
import { segDist2 } from './ninjaGeom.ts';
import { AutoState } from './auto.ts';
import type { World, Actor } from './world.ts';
import type { NinjaWorld } from './ninjaWorld.ts';

const N = NINJA;

export class NinjaAuto extends AutoState {
  protected override attackReach: number = N.combo.steps[0].range;

  protected override skillChoice(w: World, fx: number, fz: number): number {
    const nw = w as NinjaWorld, p = w.player, sk = this.s.skills;
    const foes = w.actors.filter((e) => e.kind !== 'player' && e.alive && this.kindOk(e) && this.inArea(w, e));
    if (sk[2] && nw.ready(3) && foes.some((e) => e.state === 'stunned' && inArc(p, fx, fz, N.knot.range, N.knot.cosHalf, e))) return BTN.SKILL3;
    if (sk[0] && nw.ready(1) && !nw.ns.mark && foes.some((e) => onLine(p, fx, fz, N.needle.stepM * N.needle.moves, N.needle.radius, e))) return BTN.SKILL;
    if (sk[1] && nw.ready(2)) {
      const L = N.shadow.stepM * (N.shadow.lastDashTick - N.shadow.firstDashTick + 1);
      const inLane = (e: Actor) => { const R = N.shadow.halfWidth + e.r; return segDist2(p.x, p.z, p.x + fx * L, p.z + fz * L, e.x, e.z) <= R * R; };
      if (foes.some(inLane) && nw.shadowPathClear(fx, fz)) return BTN.SKILL2;
    }
    return 0;
  }
}

/** the melee area rule of DES-007 §3.2 item 7, from the player along (fx,fz) */
function inArc(p: Actor, fx: number, fz: number, range: number, cos: number, e: Actor): boolean {
  const dx = e.x - p.x, dz = e.z - p.z, d = len(dx, dz);
  if (d > range + e.r) return false;
  return d <= e.r + N.touchPad || (dx * fx + dz * fz) / d >= cos;
}
/** the target's circle (widened by the needle's radius) lies on the straight line ahead within `reach` */
function onLine(p: Actor, fx: number, fz: number, reach: number, r: number, e: Actor): boolean {
  const dx = e.x - p.x, dz = e.z - p.z, along = dx * fx + dz * fz, side = dx * -fz + dz * fx, R = e.r + r;
  return along >= 0 && along <= reach + R && side * side <= R * R;
}
