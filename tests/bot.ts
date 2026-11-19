// Scripted test player used by QA tests (and the in-browser ?bot=1 autoplay). Reads sim state, emits quantized input.
import { World } from '../shared/sim/world.ts';
import { BTN, quantize, type TickInput } from '../shared/sim/input.ts';
import { len, norm } from '../shared/sim/math.ts';

const WAYPOINTS: [number, number][] = [[0, -4], [1.5, -15], [3, -28], [3, -37], [3, -44], [-0.4, -52], [-2, -60], [-2, -70]];

export class Bot {
  wp = 0; t = 0; skill: number;
  constructor(skill = 1) { this.skill = skill; } // skill<1 = slower reactions
  think(w: World): TickInput {
    this.t++;
    const p = w.player, ps = w.ps;
    if (ps.down) { this.wp = -1; return quantize(0, 0, this.t % 2 ? BTN.RETRY : 0); }
    if (this.wp < 0) { let bi = 0, bd = 1e9; WAYPOINTS.forEach(([x, z], i) => { const d = len(x - p.x, z - p.z); if (d < bd) { bd = d; bi = i; } }); this.wp = bi; }
    let mx = 0, mz = 0, b = 0;
    // 1. threats
    let threat = false;
    const delay = 0.25 / this.skill; // perception + decision delay of a human
    for (const t of w.tele) {
      if (t.total - t.t < delay) continue;
      const inside = w.insideTele(t, p.x, p.z, 0.7);
      const charging = !t.area;
      if (!inside) continue;
      threat = true;
      let ax: number, az: number;
      if (t.shape === 'line') { const s = (p.x - t.x) * -t.dz + (p.z - t.z) * t.dx; [ax, az] = s >= 0 ? [-t.dz, t.dx] : [t.dz, -t.dx]; }
      else [ax, az] = norm(p.x - t.x, p.z - t.z);
      mx += ax; mz += az;
      const react = 0.45 / this.skill;
      if (t.t < react && t.t > 0.05 && ps.dodgeCd <= 0) b |= BTN.DODGE;
      if (charging && t.t < 0.3) b |= BTN.DODGE;
    }
    // boss charging right at us
    if (w.boss.state === 'charge' && len(w.boss.x - p.x, w.boss.z - p.z) < 4 && ps.dodgeCd <= 0) { b |= BTN.DODGE; [mx, mz] = [-w.boss.dz, w.boss.dx]; }
    if (!threat) {
      // 2. fight
      let target = null as null | (typeof w.actors)[number], bd = 1e9;
      for (const e of w.actors) {
        if (e.kind === 'player' || !e.alive) continue;
        if (e.kind === 'prismback' && !w.bossStarted) continue;
        if (!e.active && e.kind !== 'prismback') continue;
        const d = len(e.x - p.x, e.z - p.z);
        if (d < bd) { bd = d; target = e; }
      }
      if (target && bd < 12) {
        const reach = target.r + 1.6;
        if (bd > reach) { [mx, mz] = norm(target.x - p.x, target.z - p.z); }
        if (bd < reach + 0.6 && this.t % 3 === 0) b |= BTN.ATTACK;
        const near = w.actors.filter((e) => e.alive && e.kind !== 'player' && e.active && len(e.x - p.x, e.z - p.z) < 3.8).length;
        if ((near >= 2 || target.kind === 'prismback') && bd < 3.8 && ps.skillCd <= 0) b |= BTN.SKILL;
      } else {
        const [wx, wz] = WAYPOINTS[Math.min(this.wp, WAYPOINTS.length - 1)];
        if (len(wx - p.x, wz - p.z) < 1.5 && this.wp < WAYPOINTS.length - 1) this.wp++;
        [mx, mz] = norm(wx - p.x, wz - p.z);
      }
    }
    if (p.hp < 45 && ps.potions > 0 && !threat) b |= BTN.POTION;
    // waypoint progress also while fighting
    const [wx, wz] = WAYPOINTS[Math.min(this.wp, WAYPOINTS.length - 1)];
    if (len(wx - p.x, wz - p.z) < 2 && this.wp < WAYPOINTS.length - 1) this.wp++;
    const l = len(mx, mz); if (l > 1) { mx /= l; mz /= l; }
    // release buttons every other tick so the sim sees edges
    if (this.t % 2 === 0) b &= ~(BTN.DODGE | BTN.SKILL | BTN.POTION);
    return quantize(mx, mz, b);
  }
}
