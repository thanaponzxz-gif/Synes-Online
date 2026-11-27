// Synes Online — the `ninja-roam-1` sim (DES-007 rev 4 §3, §8.3, §8.4.3; ADR-014): Seyrin, the ninja.
// Same rules as world.ts: deterministic, runs on client and server, no engine/DOM, no Math.random/Date/trig (+ - * / sqrt only).
// Enemies, telegraphs, gates, triggers and checkpoints are World's, run on this ruleset's own snapshot tables (ninjaStage.ts).
// New here: the player's actions, the order of a tick, the damage rules both ways, needles, the sound mark, counterEcho and the
// meter. Integer ticks: an action accepted on tick t0 runs on local ticks [0, end) and "hit 5" happens on tick t0+5.
//
// One tick (DES-007 §3.3):  end actions / expire marks -> accept one command or a dodge cancel -> move the player + scenery ->
// enemies think and move, telegraphs count down, bodies push -> player pulses and flying needles (older source first) ->
// enemy damage on the player (by source actor id; a source killed this tick does nothing) -> meter, triggers.
//
// The fields the renderer / HUD / Auto / test bot already read (`ps`) are mirrored from `ns` at the end of every tick.
import { NINJA, TICK, type AttackDef } from '../data/tuning.ts';
import { World, type Actor, type NinjaActionKind, type SimEvent, type Telegraph } from './world.ts';
import { BTN, AXIS, type TickInput } from './input.ts';
import { DEFAULT_VARIANT, dodgeCdSeconds, type RunVariant } from './variant.ts';
import { len, norm, dist, dist2 } from './math.ts';
import { NINJA_RULESET } from './ruleset.ts';
import { rayCircle, segClosest, segDist2, segmentCrossesCircle } from './ninjaGeom.ts';
import { NinjaAuto } from './ninjaAuto.ts';

const N = NINJA;
const SKILL_CD = [N.needle.cdTicks, N.shadow.cdTicks, N.knot.cdTicks] as const;
const DASH_TICKS = N.shadow.lastDashTick - N.shadow.firstDashTick + 1;

export interface NinjaAction {
  id: number; kind: NinjaActionKind; step: number; start: number; end: number;
  /** where it started, and the direction it is locked to (dodge / shadow_thread: the dash direction) */
  x: number; z: number; fx: number; fz: number;
  /** dodge: a perfect was already given for this dodge */
  perfect: boolean;
  /** shadow_thread: the path hit something and the dash is over; targets already hit; the segment walked this tick */
  blocked: boolean; hit: number[]; seg: { x0: number; z0: number; x1: number; z1: number; blocker: number } | null;
  /** the meter already gave its +1 for this action hitting a stunned target */
  stunGain: boolean;
}
export interface Needle { id: number; actionId: number; x: number; z: number; dx: number; dz: number; moves: number; stunGain: boolean; }
interface Hurt { src: number; dmg: number; enemyTh: string; atk: AttackDef; token: number | null; }

export class NinjaWorld extends World {
  override auto: NinjaAuto = new NinjaAuto();
  /** the ninja's own state (the `ps` fields are a mirror of it for the old readers) */
  ns = {
    action: null as NinjaAction | null,
    potions: N.potion.charges as number,
    /** เส้นเสียง 0..4 */
    meter: 0,
    /** counterEcho is ready while tick < counterUntil */
    counterUntil: 0,
    /** one sound mark per player */
    mark: null as { target: number; at: number } | null,
    needles: [] as Needle[],
    down: false, downTick: 0,
    dodgeReadyAt: 0,
    /** skill 1..3 are ready when tick >= readyAt[slot - 1] */
    readyAt: [0, 0, 0] as number[],
    /** last combo step started (-1 none) and the tick before which the next press continues the combo */
    lastStep: -1, chainUntil: 0,
    /** tick of the stored attack press (one press, valid for bufferTicks) */
    bufAttack: -1e9,
    /** id source for actions and needles */
    seq: 1,
  };
  /** actor whose AI is running (enemy hits are queued with it as the source) */
  protected src = 0;
  protected hurtQ: Hurt[] = [];
  protected meterGain = 0;
  protected died = false;

  constructor(seed: number, variant: RunVariant = DEFAULT_VARIANT) {
    super(seed, variant, NINJA_RULESET);
    const p = this.player;
    p.r = N.radius; p.maxHp = N.maxHp; p.hp = N.maxHp;
    this.mirror(-1);
  }

  override step(inp: TickInput): SimEvent[] {
    this.events = this.events.length && this.tick === 0 ? this.events : [];
    if (this.finished) return this.events;
    if (inp.auto) this.auto.apply(this, inp.auto);
    const ns = this.ns, now = this.tick;
    if (!ns.down) inp = this.auto.resolve(this, inp);
    const edges = inp.b & ~this.prevB;
    this.prevB = inp.b;
    this.hurtQ = []; this.meterGain = 0; this.died = false;
    if (ns.down) { // the world waits; needles already flying go on (damage only)
      if (edges & BTN.RETRY && now - ns.downTick >= N.retryTicks) this.respawn();
      else for (const n of ns.needles.slice()) this.moveNeedle(n, now);
      this.mirror(now); this.tick++;
      return this.events;
    }
    this.expire(now);
    this.accept(inp, edges, now);
    this.movePlayer(inp, now);
    for (const a of this.actors) {
      if (a.kind === 'player') continue;
      if (!a.alive) { a.deadT += TICK; continue; }
      if (a.flinch > 0) a.flinch -= TICK;
      this.src = a.id;
      if (a.kind === 'puffcap') this.puffcap(a);
      else if (a.kind === 'thornling') this.thornling(a);
      else this.prismback(a);
    }
    this.src = 0;
    this.updateTelegraphs();
    this.resolveCollisions();
    this.pulses(now);
    this.enemyDamage(now);
    if (!this.died && this.meterGain > 0) this.setMeter(Math.min(N.meter.max, ns.meter + this.meterGain));
    this.triggers();
    this.mirror(now);
    this.tick++;
    return this.events;
  }

  /** remaining/total cooldown of skill slot 1..3 in seconds; remaining <= 0 = a press on the next tick is accepted */
  override skillCooldown(slot: 1 | 2 | 3): { remaining: number; total: number } {
    return { remaining: (this.ns.readyAt[slot - 1] - this.tick) * TICK, total: SKILL_CD[slot - 1] * TICK };
  }
  /** a press of skill `slot` would be accepted on the next tick (when nothing else is running) */
  ready(slot: 1 | 2 | 3): boolean { return this.tick >= this.ns.readyAt[slot - 1]; }

  // ---------------------------------------------------------------- 1. ends
  protected expire(now: number) {
    const ns = this.ns, a = ns.action;
    if (a && now >= a.start + a.end) ns.action = null;
    if (ns.mark && now >= ns.mark.at + N.mark.ticks) this.dropMark('time', now);
  }

  // ---------------------------------------------------------------- 2. commands
  /** the stick as a unit direction, or null when it is exactly centred */
  protected stick(inp: TickInput): [number, number] | null { return inp.mx !== 0 || inp.mz !== 0 ? norm(inp.mx, inp.mz) : null; }

  protected accept(inp: TickInput, edges: number, now: number) {
    const ns = this.ns, p = this.player;
    if (edges & BTN.ATTACK) ns.bufAttack = now;
    // a ready dodge always gets in, cancelling whatever runs (before this tick's hits); priority over everything when idle
    if (edges & BTN.DODGE && now >= ns.dodgeReadyAt) { this.cancelAction(now); this.startDodge(inp, now); return; }
    if (ns.action) return; // only a dodge or a buffered attack press gets past a running action
    const aim = this.stick(inp) ?? [p.fx, p.fz];
    if (edges & BTN.POTION && ns.potions > 0 && p.hp < p.maxHp) {
      ns.potions--; this.stats.potionsUsed++; this.events.push({ t: 'potion' });
      this.begin('potion', 0, N.potion.end, p.fx, p.fz, now);
    } else if (edges & BTN.ULT && ns.meter >= N.loom.meterCost) {
      this.setMeter(ns.meter - N.loom.meterCost);
      this.face(aim); this.begin('lumen_loom', 0, N.loom.end, aim[0], aim[1], now);
    } else if (edges & BTN.SKILL3 && now >= ns.readyAt[2]) {
      ns.readyAt[2] = now + N.knot.cdTicks;
      this.face(aim); this.begin('resonant_knot', 0, N.knot.end, aim[0], aim[1], now);
    } else if (edges & BTN.SKILL2 && now >= ns.readyAt[1]) {
      ns.readyAt[1] = now + N.shadow.cdTicks;
      this.face(aim); this.begin('shadow_thread', 0, N.shadow.end, aim[0], aim[1], now);
    } else if (edges & BTN.SKILL && now >= ns.readyAt[0]) {
      ns.readyAt[0] = now + N.needle.cdTicks;
      this.face(aim); this.begin('echo_needle', 0, N.needle.end, aim[0], aim[1], now);
    } else if (now - ns.bufAttack < N.combo.bufferTicks) {
      const step = ns.lastStep >= 0 && ns.lastStep < 2 && now < ns.chainUntil ? ns.lastStep + 1 : 0, S = N.combo.steps[step];
      const tgt = this.comboTarget();
      const dir: [number, number] = tgt ? norm(tgt.x - p.x, tgt.z - p.z) : aim;
      ns.bufAttack = -1e9; ns.lastStep = step; ns.chainUntil = now + S.end + N.combo.resetTicks;
      this.face(dir); this.begin('attack', step, S.end, dir[0], dir[1], now);
    }
  }

  protected face(d: [number, number]) { this.player.fx = d[0]; this.player.fz = d[1]; }

  /** nearest active enemy whose edge is within the combo aim range; equal distance -> lowest actor id */
  protected comboTarget(): Actor | null {
    const p = this.player;
    let best: Actor | null = null, bd = Infinity;
    for (const e of this.actors) {
      if (e.kind === 'player' || !e.alive || !e.active) continue;
      const d = dist(e.x, e.z, p.x, p.z) - e.r;
      if (d <= N.combo.aimRange && d < bd) { bd = d; best = e; }
    }
    return best;
  }

  protected begin(kind: NinjaActionKind, step: number, end: number, fx: number, fz: number, now: number): NinjaAction {
    const p = this.player;
    const a: NinjaAction = { id: this.ns.seq++, kind, step, start: now, end, x: p.x, z: p.z, fx, fz, perfect: false, blocked: false, hit: [], seg: null, stunGain: false };
    this.ns.action = a;
    this.events.push({ t: 'action-start', id: a.id, kind, step, startTick: now, x: p.x, z: p.z, fx: p.fx, fz: p.fz });
    return a;
  }

  protected cancelAction(now: number) {
    const a = this.ns.action;
    if (!a) return;
    this.events.push({ t: 'action-cancel', id: a.id, kind: a.kind, tick: now });
    this.ns.action = null;
  }

  /** dodgeFacingMode hold-start: the facing stays what it was for the whole dodge; the dash goes where the stick points */
  protected startDodge(inp: TickInput, now: number) {
    const p = this.player, ns = this.ns;
    const dash = this.stick(inp) ?? [p.fx, p.fz];
    ns.dodgeReadyAt = now + N.dodge.cdTicks;
    const a = this.begin('dodge', 0, N.dodge.end, dash[0], dash[1], now);
    this.seenAtk.clear();
    for (const t of this.tele) this.seenAtk.add(t.id);
    for (const e of this.actors) if (e.alive && (e.state === 'rush' || e.state === 'charge')) { const k = this.atkToken.get(e.id); if (k !== undefined) this.seenAtk.add(k); }
    this.stats.dodges++;
    this.events.push({ t: 'dodge', id: a.id, preFx: p.fx, preFz: p.fz, dashX: dash[0], dashZ: dash[1] });
  }

  // ---------------------------------------------------------------- 3. the player moves
  protected movePlayer(inp: TickInput, now: number) {
    const p = this.player, ps = this.ps, a = this.ns.action;
    let mx = inp.mx / AXIS, mz = inp.mz / AXIS;
    const ml = len(mx, mz);
    if (ml > 1) { mx /= ml; mz /= ml; }
    ps.moving = ml > 0.15;
    if (a?.kind === 'dodge') {
      if (now - a.start <= N.dodge.lastMoveTick) { p.x += a.fx * N.dodge.stepM; p.z += a.fz * N.dodge.stepM; }
    } else if (a?.kind === 'shadow_thread') {
      a.seg = null;
      const k = now - a.start;
      if (!a.blocked && k >= N.shadow.firstDashTick && k <= N.shadow.lastDashTick) this.shadowStep(a);
    } else if (!a || a.kind === 'attack' || a.kind === 'potion') {
      const sp = N.speed * (!a ? 1 : a.kind === 'attack' ? N.combo.moveMul : N.potion.moveMul);
      p.x += mx * sp * TICK; p.z += mz * sp * TICK;
      if (!a && ps.moving) this.face(norm(mx, mz));
    } // skills 1 / 3 and the ult: no walking
    this.pushFromPillars(p); this.pushFromObstacles(p);
    [p.x, p.z] = this.clampWalk(p.x, p.z, p.r);
  }

  /** shadow_thread, one dash tick: sweep the player's circle along the locked direction; scenery, pillars, the edge of the walkable
   *  ground and living enemies stop it (ties: scenery first). Once stopped the dash is over. */
  protected shadowStep(a: NinjaAction) {
    const p = this.player, sx = p.x, sz = p.z, L: number = N.shadow.stepM;
    let t = L, blocker = 0;
    for (const o of this.level.obstacles) t = Math.min(t, rayCircle(sx, sz, a.fx, a.fz, o.x, o.z, o.r + p.r));
    for (const pl of this.pillars) if (pl.alive) t = Math.min(t, rayCircle(sx, sz, a.fx, a.fz, pl.x, pl.z, pl.r + p.r));
    t = this.walkLimit(sx, sz, a.fx, a.fz, t, p.r);
    for (const e of this.actors) {
      if (e.kind === 'player' || !e.alive || e.state === 'hop') continue; // a hopping puffcap is in the air (as in resolveCollisions)
      const te = rayCircle(sx, sz, a.fx, a.fz, e.x, e.z, e.r + p.r);
      if (te < t) { t = te; blocker = e.id; }
    }
    if (t < L) a.blocked = true;
    p.x = sx + a.fx * t; p.z = sz + a.fz * t;
    a.seg = { x0: sx, z0: sz, x1: p.x, z1: p.z, blocker };
  }

  /** how far (<= L) a circle of radius r can go from (sx,sz) along (dx,dz) and still stand on open walkable ground */
  protected walkLimit(sx: number, sz: number, dx: number, dz: number, L: number, r: number): number {
    if (this.walkableAt(sx + dx * L, sz + dz * L, r)) return L;
    let lo = 0, hi = L;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (this.walkableAt(sx + dx * m, sz + dz * m, r)) lo = m; else hi = m; }
    return lo;
  }
  protected walkableAt(x: number, z: number, r: number): boolean { const [cx, cz] = this.clampWalk(x, z, r); return dist2(cx, cz, x, z) <= 1e-18; }

  // ---------------------------------------------------------------- 4. enemies (World's AI; hits on the player are queued)
  protected override hurtPlayer(dmg: number, enemyTh: string, atk: AttackDef, token: number | null = null) {
    this.hurtQ.push({ src: this.src, dmg, enemyTh, atk, token });
  }

  protected override updateTelegraphs() {
    const p = this.player, keep: Telegraph[] = [];
    for (const t of this.tele) {
      t.t -= TICK;
      if (t.t > 0) { keep.push(t); continue; }
      if (t.area && this.insideTele(t, p.x, p.z, p.r * 0.5)) this.hurtQ.push({ src: t.owner, dmg: t.atk.dmg, enemyTh: t.enemyTh, atk: t.atk, token: t.id });
    }
    this.tele = keep;
  }

  /** exact stun windows (DES-007 §3.3): 78 ticks after a pillar, 27 after a miss; a pillar break fills the meter by 2 */
  protected override prismback(a: Actor) {
    const before = a.state;
    super.prismback(a);
    if (before === 'charge' && a.state === 'stunned') {
      const pillar = a.st === this.E.prismback.stunPillar;
      a.st = ((pillar ? N.bossStunTicks.pillar : N.bossStunTicks.miss) - 0.5) * TICK;
      if (pillar) this.meterGain += N.meter.pillar;
    }
  }

  protected override kill(e: Actor) {
    super.kill(e);
    if (this.ns.mark?.target === e.id) this.dropMark('target-death', this.tick);
  }

  // ---------------------------------------------------------------- 5. player pulses and needles
  protected pulses(now: number) {
    const a = this.ns.action, flying = this.ns.needles.slice(); // a needle released this tick first moves next tick
    let i = 0;
    while (i < flying.length && (!a || flying[i].id < a.id)) this.moveNeedle(flying[i++], now);
    if (a) this.actionPulse(a, now);
    while (i < flying.length) this.moveNeedle(flying[i++], now);
  }

  protected actionPulse(a: NinjaAction, now: number) {
    const k = now - a.start, p = this.player;
    switch (a.kind) {
      case 'attack': {
        const S = N.combo.steps[a.step];
        if (k === S.hit) this.areaPulse(a, 0, p.x, p.z, S.range, N.combo.cosHalf, S.dmg, now);
        break;
      }
      case 'echo_needle':
        if (k === N.needle.releaseTick) {
          const n: Needle = { id: this.ns.seq++, actionId: a.id, x: p.x, z: p.z, dx: a.fx, dz: a.fz, moves: 0, stunGain: false };
          this.ns.needles.push(n);
          this.events.push({ t: 'needle-spawn', id: n.id, actionId: a.id, tick: now, x: n.x, z: n.z, dx: n.dx, dz: n.dz });
        }
        break;
      case 'shadow_thread':
        if (a.seg) this.corridorPulse(a, k - N.shadow.firstDashTick, now);
        break;
      case 'resonant_knot':
        if (k === N.knot.hit) this.areaPulse(a, 0, a.x, a.z, N.knot.range, N.knot.cosHalf, N.knot.dmg, now);
        break;
      case 'lumen_loom': {
        const j = (N.loom.hits as readonly number[]).indexOf(k);
        if (j >= 0) this.areaPulse(a, j, a.x, a.z, N.loom.range, N.loom.cosHalf, N.loom.dmg[j], now);
        break;
      }
      case 'potion':
        if (k === N.potion.healTick) { const h = Math.min(N.potion.heal, p.maxHp - p.hp); p.hp += h; this.events.push({ t: 'heal', amount: h }); }
        break;
      case 'dodge': break;
    }
  }

  protected hittable(e: Actor): boolean { return e.kind !== 'player' && e.alive && (e.kind !== 'prismback' || this.bossStarted); }

  /** combo / knot / loom area: d <= range + target radius; inside target radius + touchPad no angle check, else dot/len >= cosHalf */
  protected areaPulse(a: NinjaAction, idx: number, ox: number, oz: number, range: number, cos: number, base: number, now: number) {
    this.events.push({ t: 'attack-pulse', actionId: a.id, kind: a.kind, pulseIndex: idx, tick: now, x: ox, z: oz, fx: a.fx, fz: a.fz });
    const targets: Actor[] = [];
    for (const e of this.actors) {
      if (!this.hittable(e)) continue;
      const dx = e.x - ox, dz = e.z - oz, d = len(dx, dz);
      if (d > range + e.r) continue;
      if (d > e.r + N.touchPad && (dx * a.fx + dz * a.fz) / d < cos) continue;
      targets.push(e);
    }
    this.deal(a.id, a.kind, idx, targets, base, true, a, now);
  }

  /** shadow_thread: the segment walked this tick, widened by halfWidth + the target's radius; each target once per action; nothing
   *  is reached through scenery, a pillar or the enemy that stopped the dash */
  protected corridorPulse(a: NinjaAction, idx: number, now: number) {
    const s = a.seg!;
    this.events.push({ t: 'attack-pulse', actionId: a.id, kind: a.kind, pulseIndex: idx, tick: now, x: s.x0, z: s.z0, fx: a.fx, fz: a.fz, ex: s.x1, ez: s.z1 });
    const targets: Actor[] = [];
    for (const e of this.actors) {
      if (!this.hittable(e) || a.hit.includes(e.id)) continue;
      const R = N.shadow.halfWidth + e.r;
      if (segDist2(s.x0, s.z0, s.x1, s.z1, e.x, e.z) > R * R) continue;
      const [qx, qz] = segClosest(s.x0, s.z0, s.x1, s.z1, e.x, e.z);
      if (this.lineBlocked(qx, qz, e.x, e.z, s.blocker !== e.id ? s.blocker : 0)) continue;
      targets.push(e);
    }
    for (const e of targets) a.hit.push(e.id);
    this.deal(a.id, a.kind, idx, targets, N.shadow.dmg, true, a, now);
  }

  /** a straight line crosses a solid: an obstacle, a standing pillar, or (when given) that actor */
  protected lineBlocked(x0: number, z0: number, x1: number, z1: number, actorId: number): boolean {
    for (const o of this.level.obstacles) if (segmentCrossesCircle(x0, z0, x1, z1, o)) return true;
    for (const pl of this.pillars) if (pl.alive && segmentCrossesCircle(x0, z0, x1, z1, pl)) return true;
    if (actorId) { const b = this.actors.find((x) => x.id === actorId); if (b?.alive && segmentCrossesCircle(x0, z0, x1, z1, b)) return true; }
    return false;
  }

  /** One damage pulse on `targets` (in actor id order). Bonuses come from the state before the pulse; then the mark and the counter
   *  are spent, then the damage lands: floor((base + mark 8 + knot-on-stunned 12) x counter 1.5 x stunned boss 1.5). */
  protected deal(actionId: number, kind: NinjaActionKind, idx: number, targets: Actor[], base: number, eatsMark: boolean, gain: { stunGain: boolean } | null, now: number) {
    if (!targets.length) return;
    const ns = this.ns, counter = now < ns.counterUntil, mark = ns.mark;
    const plan = targets.map((e) => {
      const stunned = e.state === 'stunned', markHit = eatsMark && mark !== null && mark.target === e.id;
      const knot = kind === 'resonant_knot' && stunned ? N.knot.stunnedBonus : 0;
      const boss = e.kind === 'prismback' && stunned ? N.bossStunMul : 1;
      const amount = Math.floor((base + (markHit ? N.mark.bonus : 0) + knot) * (counter ? N.counterEcho.mul : 1) * boss);
      return { e, stunned, markHit, amount, crit: counter || boss > 1 };
    });
    if (counter) ns.counterUntil = 0;
    const eaten = plan.find((h) => h.markHit);
    if (eaten) { ns.mark = null; this.events.push({ t: 'mark-consume', target: eaten.e.id, tick: now, actionId }); }
    for (const h of plan) {
      const e = h.e;
      e.hp -= h.amount; e.flinch = 0.15;
      this.stats.hitsLanded++;
      if (!e.active && e.kind !== 'prismback') { e.active = true; if (e.state === 'idle') { e.state = 'approach'; e.st = 0; } }
      this.events.push({ t: 'hit', target: e.id, amount: h.amount, x: e.x, z: e.z, crit: h.crit, byPlayer: true,
        sourceActionId: actionId, sourceActionKind: kind, pulseIndex: idx, counterApplied: counter, targetStunnedAtHit: h.stunned, markConsumed: h.markHit });
      if (e.hp <= 0) this.kill(e);
    }
    // +1 once per action for hurting a stunned target (combo, skills 1-3; never the ult; never after the owner fell)
    if (gain && !gain.stunGain && kind !== 'lumen_loom' && !ns.down && plan.some((h) => h.stunned)) { gain.stunGain = true; this.meterGain += N.meter.stunnedHit; }
  }

  /** one move of a needle: a swept circle 0.5 m along its line; it stops at the first thing on the way (scenery before an actor at
   *  the same distance, then the lowest id), never breaks a pillar, and is gone after 12 moves (6 m) */
  protected moveNeedle(n: Needle, now: number) {
    const R = N.needle.radius;
    n.moves++;
    let t: number = N.needle.stepM, scene = false;
    for (const o of this.level.obstacles) { const s = rayCircle(n.x, n.z, n.dx, n.dz, o.x, o.z, o.r + R); if (s < t) { t = s; scene = true; } }
    for (const pl of this.pillars) if (pl.alive) { const s = rayCircle(n.x, n.z, n.dx, n.dz, pl.x, pl.z, pl.r + R); if (s < t) { t = s; scene = true; } }
    const w = this.walkLimit(n.x, n.z, n.dx, n.dz, t, R);
    if (w < t) { t = w; scene = true; }
    let hit: Actor | null = null;
    for (const e of this.actors) {
      if (!this.hittable(e)) continue;
      const s = rayCircle(n.x, n.z, n.dx, n.dz, e.x, e.z, e.r + R);
      if (s < t) { t = s; hit = e; scene = false; }
    }
    n.x += n.dx * t; n.z += n.dz * t;
    this.events.push({ t: 'needle-move', id: n.id, x: n.x, z: n.z });
    if (hit) {
      this.events.push({ t: 'needle-hit', id: n.id, target: hit.id, x: n.x, z: n.z });
      this.removeNeedle(n, 'hit');
      const owner = !this.ns.down; // after the owner fell a needle still hurts, but leaves no mark and no meter
      this.deal(n.actionId, 'echo_needle', 0, [hit], N.needle.dmg, false, owner ? n : null, now);
      if (owner && hit.alive) this.setMark(hit.id, now);
    } else if (scene) this.removeNeedle(n, 'scene');
    else if (n.moves >= N.needle.moves) this.removeNeedle(n, 'range');
  }

  protected removeNeedle(n: Needle, reason: 'hit' | 'scene' | 'range' | 'respawn') {
    this.ns.needles = this.ns.needles.filter((x) => x !== n);
    this.events.push({ t: 'needle-despawn', id: n.id, reason });
  }

  // ---------------------------------------------------------------- the sound mark and the meter
  protected setMark(target: number, now: number) {
    const m = this.ns.mark, refresh = m !== null && m.target === target;
    if (m && !refresh) this.dropMark('moved', now);
    this.ns.mark = { target, at: now };
    this.events.push({ t: 'mark-set', target, tick: now, refresh });
  }
  protected dropMark(reason: 'time' | 'moved' | 'target-death' | 'player-death', now: number) {
    const m = this.ns.mark;
    if (!m) return;
    this.ns.mark = null;
    this.events.push({ t: 'mark-expire', target: m.target, tick: now, reason });
  }
  protected setMeter(v: number) {
    if (v === this.ns.meter) return;
    this.ns.meter = v;
    this.events.push({ t: 'meter-change', value: v });
  }

  // ---------------------------------------------------------------- 6. enemy damage
  protected enemyDamage(now: number) {
    const ns = this.ns, p = this.player, a = ns.action;
    const q = this.hurtQ.slice().sort((x, y) => x.src - y.src); // stable: one source keeps its own order
    for (const h of q) {
      if (ns.down) break;
      const owner = this.actors.find((x) => x.id === h.src);
      if (!owner || !owner.alive) continue; // killed by a player pulse this tick: its hit never lands
      if (a && a.kind === 'dodge' && now - a.start <= N.dodge.lastIframeTick) {
        if (now - a.start <= N.dodge.lastPerfectTick && !a.perfect) {
          a.perfect = true; this.stats.perfect++;
          ns.counterUntil = now + N.counterEcho.ticks; this.meterGain += N.meter.perfect;
          this.events.push({ t: 'perfect', x: p.x, z: p.z, dodgeId: a.id });
          this.hint('perfect');
        }
        continue;
      }
      p.hp -= h.dmg; this.stats.damageTaken += h.dmg;
      this.ps.cause = { enemyTh: h.enemyTh, attackTh: h.atk.nameTh, tipTh: h.atk.tipTh, attackId: h.atk.id };
      this.events.push({ t: 'hit', target: p.id, amount: h.dmg, x: p.x, z: p.z, crit: false, byPlayer: false });
      if (h.token !== null && this.seenAtk.has(h.token)) this.events.push({ t: 'dodge-early', x: p.x, z: p.z });
      if (p.hp <= 0) this.fall(now);
    }
  }

  protected fall(now: number) {
    const ns = this.ns, p = this.player;
    p.hp = 0; ns.down = true; ns.downTick = now; this.stats.deaths++; this.died = true;
    this.cancelAction(now);
    this.dropMark('player-death', now);
    ns.counterUntil = 0; this.setMeter(0);
    this.tele = [];
    this.auto.onDown(this);
    this.events.push({ t: 'player-down', cause: this.ps.cause! });
  }

  protected override respawn() {
    for (const n of this.ns.needles.slice()) this.removeNeedle(n, 'respawn');
    super.respawn();
    Object.assign(this.ns, { action: null, potions: N.potion.charges, down: false, mark: null, counterUntil: 0, dodgeReadyAt: 0, readyAt: [0, 0, 0], lastStep: -1, chainUntil: 0, bufAttack: -1e9 });
    this.setMeter(0);
  }

  protected override refillAtSpring() { this.ns.potions = N.potion.charges; }

  // ---------------------------------------------------------------- Auto helper
  /** Auto (DES-007 §3.3): would a shadow_thread from here along (fx,fz) run its whole length past scenery, pillars and the ground's
   *  edge, without its path touching a telegraph that is up? */
  shadowPathClear(fx: number, fz: number): boolean {
    const p = this.player, L = N.shadow.stepM * DASH_TICKS;
    for (const o of this.level.obstacles) if (rayCircle(p.x, p.z, fx, fz, o.x, o.z, o.r + p.r) < L) return false;
    for (const pl of this.pillars) if (pl.alive && rayCircle(p.x, p.z, fx, fz, pl.x, pl.z, pl.r + p.r) < L) return false;
    if (this.walkLimit(p.x, p.z, fx, fz, L, p.r) < L) return false;
    for (let i = 0; i <= 12; i++) {
      const x = p.x + (fx * L * i) / 12, z = p.z + (fz * L * i) / 12;
      for (const t of this.tele) if (this.insideTele(t, x, z, p.r * 0.5)) return false;
    }
    return true;
  }

  // ---------------------------------------------------------------- the mirror for old readers
  /** `ps` as the renderer, HUD, Auto and the test bot read it. `now` = the tick just simulated (-1 before the first). */
  protected mirror(now: number) {
    const ps = this.ps, ns = this.ns, a = ns.action, next = now + 1;
    const left = a ? Math.max(0, a.start + a.end - next) * TICK : 0;
    ps.down = ns.down; ps.downT = ns.down ? (next - ns.downTick) * TICK : 0;
    ps.potions = ns.potions;
    ps.empowered = next < ns.counterUntil;
    ps.combo = ns.lastStep;
    ps.swingT = a?.kind === 'attack' ? left : 0;
    if (a?.kind === 'attack') ps.swingDur = a.end * TICK;
    ps.dodgeT = a?.kind === 'dodge' ? left : 0; ps.iframes = ps.dodgeT;
    if (a?.kind === 'dodge') { ps.dashx = a.fx; ps.dashz = a.fz; }
    ps.drinkT = a?.kind === 'potion' ? left : 0;
    ps.castT = a && a.kind !== 'attack' && a.kind !== 'dodge' && a.kind !== 'potion' ? left : 0;
    ps.cast = null;
    ps.dodgeCd = (Math.max(0, ns.dodgeReadyAt - next) / N.dodge.cdTicks) * dodgeCdSeconds(this.variant);
    ps.skillCd = (ns.readyAt[0] - next) * TICK;
    ps.cdT = [0, Math.max(0, ns.readyAt[1] - next), Math.max(0, ns.readyAt[2] - next)];
    ps.bufAttack = next - ns.bufAttack < N.combo.bufferTicks ? 1 : 0; ps.bufDodge = 0;
  }
}
