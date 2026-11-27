// Auto attack controller (DES-001 §4 "ตีอัตโนมัติ"). Lives in the sim: pure + deterministic (only + - * / sqrt, no random, no clock).
// Each tick, when Auto is on and the player gave no input, it synthesises an ordinary TickInput (move + attack + skill buttons) from the
// world state and hands it to the normal player update ("ใช้การเดินและโจมตีผ่านอินพุตปกติ"). The only thing that goes into the input
// log is the settings changes (see the log format in input.ts): the server's replay re-derives everything Auto does.
//
// Rules implemented (all from DES-001 §4 unless marked Q-n = a neutral choice listed for team A in DES-001-teamB.md):
//  - On enable, the player's position becomes the centre; the zones (level.autoZones) containing it bound the area.
//  - Targets: alive enemies matching the kind filter, inside the area, with a straight walkable path (no closed gate, no leaving the
//    zones); nearest to the player first (Q50), ties -> lowest id. The boss is never a target (Auto is off in the boss area anyway).
//  - Keep the target until it dies / leaves the area / becomes unreachable, then re-pick. No target -> walk back to the centre, wait.
//  - 30 ticks without progress (distance not shrinking, target hp not dropping; casts do not count, Q54) -> drop the target and skip it
//    for 90 ticks (Q53) so the re-pick does not choose it again at once.
//  - Skills (only slots switched on, only when ready): Chime Burst if it would interrupt a winding-up enemy, else Crystal Break if >= 2
//    filtered enemies are inside its area, else Crescent Cut if >= 1 is inside its cone, else a normal attack.
//  - Manual input wins; Auto pauses until the manual input is neutral and the player's own action (swing/dodge/cast/drink) has ended.
//  - Leaving every zone (boss approach / arena) or the boss starting turns Auto off; it is never turned back on by itself.
//  - Death clears target + pending input; with keep-after-respawn the respawn point becomes the new centre, otherwise Auto is off.
import { PLAYER, SKILLS, TICK, type EnemyKind } from '../data/tuning.ts';
import { type LevelDef, type Shape } from '../data/level.ts';
import { BTN, quantize, type TickInput } from './input.ts';
import { norm, dist, dist2 } from './math.ts';
import type { World, Actor } from './world.ts';

/** Packed settings snapshot as it travels in TickInput.auto and in the log (two ints, see packAuto). */
export interface AutoCmd { a: number; b: number; }

/** Enemy kinds Auto may target, in bit order of AutoSettings.kinds (bit i = AUTO_KINDS[i]). The boss is not selectable. */
export const AUTO_KINDS: readonly EnemyKind[] = ['puffcap', 'thornling'];
export const AUTO_RADIUS = { min: 4, max: 20, def: 8 } as const;
export const AUTO_STUCK_TICKS = 30;
/** Q53: how long a target dropped as "stuck" is skipped by the re-pick. */
export const AUTO_BAN_TICKS = 90;
const WAIT_ARRIVE = 0.3, STAND_EXTRA = 1.6, ATTACK_EXTRA = 2.0, FACE_MOVE = 0.2, PATH_STEP = 0.5;

export interface AutoSettings {
  enabled: boolean;
  /** bitmask over AUTO_KINDS; 0 = every kind ("ทุกชนิด") */
  kinds: number;
  /** false = around the saved centre within `radius`; true = the whole zone ("ทั้งโถง") */
  hall: boolean;
  radius: number;
  /** switches for skill slots 1..3 (all off on first enable) */
  skills: [boolean, boolean, boolean];
  /** keep running after respawn (default off) */
  keep: boolean;
}
export const defaultAuto = (): AutoSettings => ({ enabled: false, kinds: 0, hall: false, radius: AUTO_RADIUS.def, skills: [false, false, false], keep: false });

/** a = enabled | hall<<1 | skill1<<2 | skill2<<3 | skill3<<4 | keep<<5   b = kinds | radius<<8 */
export function packAuto(s: AutoSettings): AutoCmd {
  const a = (s.enabled ? 1 : 0) | (s.hall ? 2 : 0) | (s.skills[0] ? 4 : 0) | (s.skills[1] ? 8 : 0) | (s.skills[2] ? 16 : 0) | (s.keep ? 32 : 0);
  return { a, b: (s.kinds & 255) | (s.radius << 8) };
}
/** Strict decode: null when anything is out of range (the server rejects such a log; the sim ignores such a command). */
export function unpackAuto(c: AutoCmd): AutoSettings | null {
  if (!Number.isInteger(c.a) || !Number.isInteger(c.b) || c.a < 0 || c.a > 63 || c.b < 0) return null;
  const kinds = c.b & 255, radius = c.b >> 8;
  if (kinds >> AUTO_KINDS.length) return null;
  if (radius < AUTO_RADIUS.min || radius > AUTO_RADIUS.max) return null;
  return { enabled: !!(c.a & 1), hall: !!(c.a & 2), skills: [!!(c.a & 4), !!(c.a & 8), !!(c.a & 16)], keep: !!(c.a & 32), kinds, radius };
}

/** squared distance from point (px,pz) to segment (x0,z0)-(x1,z1) */
function segDist2(x0: number, z0: number, x1: number, z1: number, px: number, pz: number): number {
  const ax = x1 - x0, az = z1 - z0, l2 = ax * ax + az * az;
  let k = l2 > 1e-12 ? ((px - x0) * ax + (pz - z0) * az) / l2 : 0;
  k = k < 0 ? 0 : k > 1 ? 1 : k;
  return dist2(px, pz, x0 + ax * k, z0 + az * k);
}

// ---------------------------------------------------------------- zones / walkability (no pathfinding: straight lines only, Q55)
function inShape(s: Shape, x: number, z: number): boolean {
  if (s.type === 'circle') return dist2(x, z, s.x, s.z) <= s.r * s.r;
  const abx = s.bx - s.ax, abz = s.bz - s.az;
  let k = ((x - s.ax) * abx + (z - s.az) * abz) / (abx * abx + abz * abz);
  k = k < 0 ? 0 : k > 1 ? 1 : k;
  return dist2(x, z, s.ax + abx * k, s.az + abz * k) <= s.r * s.r;
}
const zoneCache = new Map<LevelDef, Shape[][]>();
function zoneShapes(L: LevelDef): Shape[][] {
  let z = zoneCache.get(L);
  if (!z) zoneCache.set(L, (z = L.autoZones.map((zn) => zn.shapes.map((id) => L.walkable.find((s) => s.id === id)!))));
  return z;
}
/** bitmask of the auto zones containing (x,z); shapes behind a closed gate do not count */
export function zonesAt(w: World, x: number, z: number): number {
  let m = 0;
  const ZONE_SHAPES = zoneShapes(w.level);
  for (let i = 0; i < ZONE_SHAPES.length; i++) for (const s of ZONE_SHAPES[i]) if ((!s.gate || w.gates[s.gate]) && inShape(s, x, z)) { m |= 1 << i; break; }
  return m;
}
/** Auto may run here: not in the boss approach/arena and the boss fight has not started */
export const autoAllowedHere = (w: World): boolean => !w.bossStarted && zonesAt(w, w.player.x, w.player.z) !== 0;
const kindBit = (k: string): number => { const i = (AUTO_KINDS as readonly string[]).indexOf(k); return i < 0 ? 0 : 1 << i; };
const idleAction = (ps: World['ps']) => ps.swingT <= 0 && ps.dodgeT <= 0 && !ps.cast && ps.castT <= 0 && ps.drinkT <= 0 && ps.bufAttack <= 0 && ps.bufDodge <= 0;

export class AutoState {
  s: AutoSettings = defaultAuto();
  cx = 0; cz = 0; zones = 0;
  target = 0; best = 1e9; hpSeen = 0; stuck = 0;
  /** actor id -> first tick it may be targeted again */
  banned = new Map<number, number>();
  /** manual input / a player-commanded action is in progress: Auto sends nothing */
  paused = false;
  /** buttons Auto sent last tick: a button is only sent when it was not sent the tick before, so the sim always sees a rising edge */
  lastB = 0;
  /** centre distance minus the target radius at which Auto presses attack (the ninja uses her combo-1 range) */
  protected attackReach: number = ATTACK_EXTRA;

  /** Apply a settings snapshot (from the input log). Turning it on saves the position as the centre. */
  apply(w: World, c: AutoCmd) {
    const n = unpackAuto(c);
    if (!n) return;
    const was = this.s.enabled;
    this.s = n;
    if (!was && n.enabled) this.start(w); else if (was && !n.enabled) this.reset();
  }
  private reset() { this.target = 0; this.stuck = 0; this.paused = false; this.lastB = 0; this.banned.clear(); }
  private start(w: World) {
    this.reset();
    this.cx = w.player.x; this.cz = w.player.z; this.zones = zonesAt(w, this.cx, this.cz);
    this.best = 1e9; this.hpSeen = 0;
  }
  private off(w: World, reason: 'boss' | 'down') { this.s.enabled = false; this.reset(); w.events.push({ t: 'auto-off', reason }); }

  /** Death: clear the target and pending input; Auto stays on only when keep-after-respawn is set. */
  onDown(w: World) { this.reset(); if (this.s.enabled && !this.s.keep) this.off(w, 'down'); }
  /** Respawn: the respawn point is the new centre (only reached when keep-after-respawn kept Auto on). */
  onRespawn(w: World) { if (this.s.enabled) this.start(w); }

  /** Called once per tick before the player update. Returns the input the sim should use this tick. */
  resolve(w: World, inp: TickInput): TickInput {
    if (!this.s.enabled) return inp;
    if (!autoAllowedHere(w)) { this.off(w, 'boss'); return inp; }
    if (inp.mx !== 0 || inp.mz !== 0 || inp.b !== 0) { this.paused = true; this.lastB = 0; return inp; } // manual wins this tick
    if (this.paused) { if (!idleAction(w.ps)) return inp; this.paused = false; this.lastB = 0; }
    return this.think(w);
  }

  // ---------------------------------------------------------------- target selection
  protected kindOk(e: Actor): boolean { const bit = kindBit(e.kind); return bit !== 0 && (this.s.kinds === 0 || (this.s.kinds & bit) !== 0); }
  protected inArea(w: World, e: Actor): boolean {
    if (!(zonesAt(w, e.x, e.z) & this.zones)) return false;
    return this.s.hall || dist(e.x, e.z, this.cx, this.cz) <= this.s.radius;
  }
  /** straight line from (x0,z0) to (x1,z1) stays inside the centre's zones on open ground */
  private pathOk(w: World, x0: number, z0: number, x1: number, z1: number): boolean {
    // free roam: a straight line through a solid obstacle is not a path (no obstacles in the path-only level: unchanged)
    for (const o of w.level.obstacles) if (segDist2(x0, z0, x1, z1, o.x, o.z) < (o.r + PLAYER.radius) * (o.r + PLAYER.radius)) return false;
    const d = dist(x0, z0, x1, z1), n = Math.max(1, Math.ceil(d / PATH_STEP));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      if (!(zonesAt(w, x0 + (x1 - x0) * t, z0 + (z1 - z0) * t) & this.zones)) return false;
    }
    return true;
  }
  private eligible(w: World, e: Actor): boolean {
    if (!e.alive || !this.kindOk(e) || (this.banned.get(e.id) ?? 0) > w.tick || !this.inArea(w, e)) return false;
    return this.pathOk(w, w.player.x, w.player.z, e.x, e.z);
  }
  /** nearest to the player first; exact distance ties go to the lowest id (actors are iterated in id order) */
  private pick(w: World): Actor | null {
    let best: Actor | null = null, bd = 1e18;
    const p = w.player;
    for (const e of w.actors) {
      if (e.kind === 'player' || !this.eligible(w, e)) continue;
      const d2 = dist2(e.x, e.z, p.x, p.z);
      if (d2 < bd || (d2 === bd && best !== null && e.id < best.id)) { bd = d2; best = e; }
    }
    return best;
  }

  // ---------------------------------------------------------------- one tick of behaviour
  private think(w: World): TickInput {
    const p = w.player, ps = w.ps;
    let e: Actor | null = this.target ? (w.actors.find((a) => a.id === this.target) ?? null) : null;
    if (e && !this.eligible(w, e)) { e = null; this.target = 0; }
    if (!e) {
      e = this.pick(w);
      if (e) { this.target = e.id; this.best = dist(e.x, e.z, p.x, p.z); this.hpSeen = e.hp; this.stuck = 0; }
    } else {
      const d = dist(e.x, e.z, p.x, p.z);
      if (d < this.best - 0.02 || e.hp < this.hpSeen) this.stuck = 0;
      else if (!ps.cast && ps.castT <= 0) this.stuck++;
      if (d < this.best) this.best = d;
      this.hpSeen = e.hp;
      if (this.stuck >= AUTO_STUCK_TICKS) { this.banned.set(e.id, w.tick + AUTO_BAN_TICKS); this.target = 0; this.stuck = 0; e = null; }
    }
    if (!e) { // nothing to do: go back to the centre and wait
      this.lastB = 0;
      if (dist(p.x, p.z, this.cx, this.cz) > WAIT_ARRIVE && this.pathOk(w, p.x, p.z, this.cx, this.cz)) {
        const [dx, dz] = norm(this.cx - p.x, this.cz - p.z);
        return quantize(dx, dz, 0);
      }
      return quantize(0, 0, 0);
    }
    const d = dist(e.x, e.z, p.x, p.z);
    const [dx, dz] = norm(e.x - p.x, e.z - p.z);
    const walk = d > e.r + STAND_EXTRA ? 1 : FACE_MOVE; // keep a tiny move so the sim faces the target (ps.moving needs > 0.15)
    const q = quantize(dx * walk, dz * walk, 0);
    const [fx, fz] = norm(q.mx, q.mz); // direction the sim will use when a skill starts
    let want = 0;
    const free = !ps.cast && ps.castT <= 0 && ps.dodgeT <= 0 && ps.drinkT <= 0;
    if (free && (this.s.skills[0] || this.s.skills[1] || this.s.skills[2])) want = this.skillChoice(w, fx, fz);
    if (!want && d <= e.r + this.attackReach) want = BTN.ATTACK;
    q.b = want & ~this.lastB;
    this.lastB = q.b;
    return q;
  }

  /** DES-001 §4 fixed rule order. Returns a BTN bit or 0. */
  protected skillChoice(w: World, fx: number, fz: number): number {
    const p = w.player, ps = w.ps, sk = this.s.skills;
    const foes = w.actors.filter((e) => e.kind !== 'player' && e.alive && this.kindOk(e) && this.inArea(w, e));
    if (sk[0] && ps.skillCd <= 0) {
      const C = SKILLS[0];
      // "would interrupt": the enemy is inside the burst and still winding up when it lands (the sim interrupts non-boss windups)
      if (foes.some((e) => e.state === 'windup' && e.st > PLAYER.skill.cast + 2 * TICK && dist(e.x, e.z, p.x, p.z) <= C.radius + e.r)) return BTN.SKILL;
    }
    if (sk[2] && ps.cdT[2] <= 0) {
      const K = SKILLS[2], ax = p.x + fx * K.ahead!, az = p.z + fz * K.ahead!;
      if (foes.filter((e) => dist(e.x, e.z, ax, az) <= K.radius + e.r).length >= 2) return BTN.SKILL3;
    }
    if (sk[1] && ps.cdT[1] <= 0) {
      const C = SKILLS[1];
      if (foes.some((e) => { const d = dist(e.x, e.z, p.x, p.z); return d <= C.radius + e.r && (d < 1e-6 || ((e.x - p.x) * fx + (e.z - p.z) * fz) / d >= C.cosHalf!); })) return BTN.SKILL2;
    }
    return 0;
  }
}
