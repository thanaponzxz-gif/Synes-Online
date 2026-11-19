// Engine-agnostic spike logic: player, one enemy, telegraphed slam, follow target.
import type { InputState } from './input';
export interface V { x: number; z: number; }
export const TREES: { x: number; z: number; s: number }[] = [];
{ let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 300; i++) { const a = r() * Math.PI * 2, d = 8 + r() * 26; TREES.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, s: 0.7 + r() * 0.8 }); } }

export class SpikeLogic {
  player = { x: 0, z: 0, face: 0, hp: 100, dodgeT: 0, atkT: 0 };
  enemy = { x: 0, z: -8, hp: 60, state: 'chase' as 'chase' | 'windup' | 'slam' | 'dead', t: 0, tx: 0, tz: 0 };
  update(dt: number, inp: InputState) {
    const p = this.player, e = this.enemy;
    const l = Math.hypot(inp.mx, inp.my);
    const sp = p.dodgeT > 0 ? 11 : 5;
    if (l > 0.1) { p.x += (inp.mx / Math.max(1, l)) * sp * dt; p.z += (inp.my / Math.max(1, l)) * sp * dt; p.face = Math.atan2(inp.mx, inp.my); }
    p.dodgeT = Math.max(0, p.dodgeT - dt); p.atkT = Math.max(0, p.atkT - dt);
    if (inp.dodge) { inp.dodge = false; if (p.dodgeT <= 0) p.dodgeT = 0.3; }
    if (inp.attack) { inp.attack = false; if (p.atkT <= 0) { p.atkT = 0.35; if (e.state !== 'dead' && Math.hypot(e.x - p.x, e.z - p.z) < 2.4) { e.hp -= 10; if (e.hp <= 0) e.state = 'dead'; } } }
    if (e.state === 'dead') return;
    e.t -= dt;
    const dx = p.x - e.x, dz = p.z - e.z, d = Math.hypot(dx, dz);
    if (e.state === 'chase') { if (d > 1.8) { e.x += (dx / d) * 2.6 * dt; e.z += (dz / d) * 2.6 * dt; } else { e.state = 'windup'; e.t = 1.0; e.tx = p.x; e.tz = p.z; } }
    else if (e.state === 'windup' && e.t <= 0) { e.state = 'slam'; e.t = 0.4; if (Math.hypot(p.x - e.tx, p.z - e.tz) < 2 && p.dodgeT <= 0) p.hp -= 15; }
    else if (e.state === 'slam' && e.t <= 0) e.state = 'chase';
  }
}
