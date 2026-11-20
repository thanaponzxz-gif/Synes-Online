// Synes Online — deterministic gameplay simulation (runs identically on client and server).
// Rules: no engine/DOM imports, no Math.random/Date, no trig. Fixed tick = 1/30 s.
import { PLAYER, ENEMIES, TICK, CONE_INNER_R, type AttackDef, type EnemyKind } from '../data/tuning.ts';
import { LEVEL, type Shape } from '../data/level.ts';
import { Rng } from './rng.ts';
import { BTN, AXIS, type TickInput } from './input.ts';
import { len, norm, dist, dist2, turnToward, DIRS16 } from './math.ts';

export interface DefeatCause { enemyTh: string; attackTh: string; tipTh: string; attackId: string; }

export type SimEvent =
  | { t: 'hit'; target: number; amount: number; x: number; z: number; crit: boolean; byPlayer: boolean }
  | { t: 'perfect'; x: number; z: number }
  | { t: 'telegraph'; id: number }
  | { t: 'death'; id: number }
  | { t: 'hint'; id: string }
  | { t: 'gate'; id: string; open: boolean }
  | { t: 'boss-start' } | { t: 'boss-phase' } | { t: 'boss-roar' }
  | { t: 'stun'; id: number; long: boolean }
  | { t: 'pillar-break'; i: number } | { t: 'pillars-regrow' }
  | { t: 'swing'; step: number } | { t: 'dodge' } | { t: 'skill' } | { t: 'potion' }
  | { t: 'heal'; amount: number } | { t: 'interrupt'; id: number }
  | { t: 'player-down'; cause: DefeatCause } | { t: 'respawn'; at: string }
  | { t: 'checkpoint'; id: string } | { t: 'victory' };

export interface Telegraph {
  id: number; owner: number; atk: AttackDef; enemyTh: string;
  shape: 'circle' | 'cone' | 'line'; x: number; z: number; dx: number; dz: number;
  r: number; w: number; cos: number; t: number; total: number; area: boolean;
}

export interface Actor {
  id: number; kind: 'player' | EnemyKind; x: number; z: number; fx: number; fz: number; r: number;
  hp: number; maxHp: number; alive: boolean; active: boolean; state: string; st: number;
  group: string; sx: number; sz: number; // spawn
  tx: number; tz: number; ox: number; oz: number; dx: number; dz: number; travel: number;
  hitDone: boolean; atk: string; lastAtk: string; repeat: number; flinch: number; deadT: number;
}

export interface Stats { damageTaken: number; perfect: number; deaths: number; dodges: number; potionsUsed: number; hitsLanded: number; }

const P = PLAYER;

export class World {
  tick = 0;
  rng: Rng;
  actors: Actor[] = [];
  player: Actor;
  tele: Telegraph[] = [];
  events: SimEvent[] = [];
  gates: Record<string, boolean> = {};
  pillars = LEVEL.pillars.map((p) => ({ ...p, alive: true }));
  boss: Actor;
  bossStarted = false;
  phase = 1;
  /** forced next boss move (phase 2: charge after every shard rain) */
  bossNext: string | null = null;
  private p2Moves = 0;
  clearingTriggered = false;
  checkpoint = { id: 'camp', x: LEVEL.start.x, z: LEVEL.start.z };
  finished = false;
  victory = false;
  stats: Stats = { damageTaken: 0, perfect: 0, deaths: 0, dodges: 0, potionsUsed: 0, hitsLanded: 0 };
  ps = {
    combo: -1, swingT: 0, swingDur: 0, hitAt: 0, hitDone: true, comboTimer: 0,
    bufAttack: 0, bufDodge: 0, dodgeT: 0, dodgeCd: 0, iframes: 0, dashx: 0, dashz: 1,
    skillCd: 0, castT: 0, potions: P.potion.charges, drinkT: 0, empowered: false,
    down: false, downT: 0, cause: null as DefeatCause | null, moving: false,
  };
  private prevB = 0;
  private nextId = 1;
  private hints = new Set<string>();

  seed: number;
  constructor(seed: number) {
    this.seed = seed;
    this.rng = new Rng(seed);
    for (const g of LEVEL.gates) this.gates[g.id] = g.startsOpen;
    this.player = this.mkActor('player', LEVEL.start.x, LEVEL.start.z, P.radius, P.maxHp, 'player');
    this.player.fz = -1;
    for (const s of LEVEL.spawns) { const d = ENEMIES[s.kind]; this.mkActor(s.kind, s.x, s.z, d.radius, d.maxHp, s.group); }
    const b = ENEMIES.prismback;
    this.boss = this.mkActor('prismback', LEVEL.boss.x, LEVEL.boss.z, b.radius, b.maxHp, 'boss');
    this.boss.fz = 1;
    this.hint('move');
  }

  private mkActor(kind: Actor['kind'], x: number, z: number, r: number, hp: number, group: string): Actor {
    const a: Actor = { id: this.nextId++, kind, x, z, fx: 0, fz: 1, r, hp, maxHp: hp, alive: true, active: false, state: 'idle', st: 0,
      group, sx: x, sz: z, tx: x, tz: z, ox: x, oz: z, dx: 0, dz: 1, travel: 0, hitDone: false, atk: '', lastAtk: '', repeat: 0, flinch: 0, deadT: 0 };
    this.actors.push(a);
    return a;
  }

  private hint(id: string) { if (!this.hints.has(id)) { this.hints.add(id); this.events.push({ t: 'hint', id }); } }

  /** Advance one fixed tick. Returns events produced in this tick. */
  step(inp: TickInput): SimEvent[] {
    this.events = this.events.length && this.tick === 0 ? this.events : [];
    if (this.finished) return this.events;
    const edges = inp.b & ~this.prevB;
    this.prevB = inp.b;
    const ps = this.ps;
    if (ps.down) {
      ps.downT += TICK;
      if (edges & BTN.RETRY && ps.downT > 0.8) this.respawn();
      this.tick++;
      return this.events;
    }
    this.updatePlayer(inp, edges);
    for (const a of this.actors) {
      if (a.kind === 'player') continue;
      if (!a.alive) { a.deadT += TICK; continue; }
      if (a.flinch > 0) a.flinch -= TICK;
      if (a.kind === 'puffcap') this.puffcap(a);
      else if (a.kind === 'thornling') this.thornling(a);
      else this.prismback(a);
    }
    this.updateTelegraphs();
    this.resolveCollisions();
    this.triggers();
    this.tick++;
    return this.events;
  }

  // ---------------------------------------------------------------- player
  private updatePlayer(inp: TickInput, edges: number) {
    const ps = this.ps, p = this.player;
    let mx = inp.mx / AXIS, mz = inp.mz / AXIS;
    const ml = len(mx, mz);
    if (ml > 1) { mx /= ml; mz /= ml; }
    ps.moving = ml > 0.15;
    // timers
    ps.dodgeCd -= TICK; ps.skillCd -= TICK; ps.iframes -= TICK; ps.comboTimer -= TICK;
    ps.bufAttack -= TICK; ps.bufDodge -= TICK;
    if (edges & BTN.ATTACK) ps.bufAttack = P.inputBufferS;
    if (edges & BTN.DODGE) ps.bufDodge = 0.2;
    // dodge (highest priority, cancels swing/drink)
    if (ps.bufDodge > 0 && ps.dodgeCd <= 0 && ps.castT <= 0) {
      const [dx, dz] = ps.moving ? norm(mx, mz) : [p.fx, p.fz];
      ps.dashx = dx; ps.dashz = dz; ps.dodgeT = P.dodge.dur; ps.iframes = P.dodge.iframes; ps.dodgeCd = P.dodge.cooldown;
      ps.swingT = 0; ps.drinkT = 0; ps.bufDodge = 0; p.fx = dx; p.fz = dz;
      this.stats.dodges++; this.events.push({ t: 'dodge' });
    }
    // skill
    if (edges & BTN.SKILL && ps.skillCd <= 0 && ps.dodgeT <= 0 && ps.castT <= 0) {
      ps.castT = P.skill.cast; ps.skillCd = P.skill.cooldown; ps.swingT = 0; ps.drinkT = 0;
      this.events.push({ t: 'skill' });
    }
    // potion
    if (edges & BTN.POTION && ps.potions > 0 && p.hp < p.maxHp && ps.drinkT <= 0 && ps.castT <= 0) {
      ps.drinkT = P.potion.dur; ps.potions--; this.stats.potionsUsed++; this.events.push({ t: 'potion' });
    }
    // attack start
    const swingProgress = ps.swingT > 0 ? 1 - ps.swingT / ps.swingDur : 1;
    if (ps.bufAttack > 0 && ps.dodgeT <= 0 && ps.castT <= 0 && ps.drinkT <= 0 && swingProgress >= 0.62) {
      const step = ps.comboTimer > 0 && ps.combo < 2 ? ps.combo + 1 : 0;
      const c = P.combo[step];
      ps.combo = step; ps.swingT = c.dur; ps.swingDur = c.dur; ps.hitAt = c.hitAt; ps.hitDone = false;
      ps.comboTimer = c.dur + P.comboResetS; ps.bufAttack = 0;
      const tgt = this.nearestEnemy(p.x, p.z, P.autoAimRange);
      if (tgt) { const [fx, fz] = norm(tgt.x - p.x, tgt.z - p.z); p.fx = fx; p.fz = fz; }
      else if (ps.moving) { const [fx, fz] = norm(mx, mz); p.fx = fx; p.fz = fz; }
      this.events.push({ t: 'swing', step });
    }
    // movement
    let vx = 0, vz = 0;
    if (ps.dodgeT > 0) {
      ps.dodgeT -= TICK; vx = ps.dashx * P.dodge.speed; vz = ps.dashz * P.dodge.speed;
    } else if (ps.castT <= 0) {
      let sp = P.speed;
      if (ps.swingT > 0) sp *= P.attackMoveMul;
      if (ps.drinkT > 0) sp *= 0.4;
      vx = mx * sp; vz = mz * sp;
      if (ps.moving && ps.swingT <= 0) { const [fx, fz] = norm(mx, mz); p.fx = fx; p.fz = fz; }
    }
    p.x += vx * TICK; p.z += vz * TICK;
    // swing hit
    if (ps.swingT > 0) {
      ps.swingT -= TICK;
      if (!ps.hitDone && 1 - ps.swingT / ps.swingDur >= ps.hitAt) {
        ps.hitDone = true;
        const c = P.combo[ps.combo];
        let any = false;
        for (const e of this.actors) {
          if (e.kind === 'player' || !e.alive) continue;
          if (e.kind === 'prismback' && !this.bossStarted) continue;
          const dx = e.x - p.x, dz = e.z - p.z, d = len(dx, dz);
          if (d > c.range + e.r) continue;
          if (d > e.r + 0.6 && (dx * p.fx + dz * p.fz) / d < P.arcCos) continue;
          this.damageEnemy(e, c.dmg, ps.empowered);
          any = true;
          if (e.kind !== 'prismback' && d > 1e-6) this.knock(e, dx / d, dz / d, 0.35);
        }
        if (any && ps.empowered) ps.empowered = false;
      }
    }
    // skill cast resolution
    if (ps.castT > 0) {
      ps.castT -= TICK;
      if (ps.castT <= 0) {
        for (const e of this.actors) {
          if (e.kind === 'player' || !e.alive) continue;
          if (e.kind === 'prismback' && !this.bossStarted) continue;
          if (dist(e.x, e.z, p.x, p.z) > P.skill.radius + e.r) continue;
          this.damageEnemy(e, P.skill.dmg, ps.empowered);
          if (e.kind !== 'prismback' && e.alive && (e.state === 'windup')) this.interrupt(e);
        }
        ps.empowered = false;
      }
    }
    // potion resolution
    if (ps.drinkT > 0) {
      ps.drinkT -= TICK;
      if (ps.drinkT <= 0) { const h = Math.min(P.potion.heal, p.maxHp - p.hp); p.hp += h; this.events.push({ t: 'heal', amount: h }); }
    }
  }

  private nearestEnemy(x: number, z: number, range: number): Actor | null {
    let best: Actor | null = null, bd = 1e9;
    for (const e of this.actors) {
      if (e.kind === 'player' || !e.alive || !e.active) continue;
      const d = dist(e.x, e.z, x, z) - e.r;
      if (d < range && d < bd) { bd = d; best = e; }
    }
    return best;
  }

  private damageEnemy(e: Actor, base: number, empowered: boolean) {
    let mul = empowered ? P.perfect.critMul : 1;
    if (e.kind === 'prismback' && e.state === 'stunned') mul *= ENEMIES.prismback.stunDmgMul;
    const amount = Math.round(base * mul);
    e.hp -= amount; e.flinch = 0.15;
    this.stats.hitsLanded++;
    if (!e.active && e.kind !== 'prismback') { e.active = true; if (e.state === 'idle') { e.state = 'approach'; e.st = 0; } }
    this.events.push({ t: 'hit', target: e.id, amount, x: e.x, z: e.z, crit: mul > 1, byPlayer: true });
    if (e.hp <= 0) this.kill(e);
  }

  private kill(e: Actor) {
    e.hp = 0; e.alive = false; e.deadT = 0; e.state = 'dead';
    this.tele = this.tele.filter((t) => t.owner !== e.id);
    this.events.push({ t: 'death', id: e.id });
    if (e.kind === 'prismback') { this.victory = true; this.finished = true; this.events.push({ t: 'victory' }); }
  }

  private interrupt(e: Actor) {
    this.tele = this.tele.filter((t) => t.owner !== e.id);
    e.state = 'recover'; e.st = 0.8;
    this.events.push({ t: 'interrupt', id: e.id });
  }

  private knock(e: Actor, dx: number, dz: number, d: number) {
    if (e.state === 'rush' || e.state === 'hop') return;
    e.x += dx * d; e.z += dz * d;
  }

  private hurtPlayer(dmg: number, enemyTh: string, atk: AttackDef) {
    const ps = this.ps, p = this.player;
    if (ps.down) return;
    if (ps.iframes > 0) {
      this.stats.perfect++; ps.empowered = true; ps.skillCd -= P.perfect.skillCdRefund;
      this.events.push({ t: 'perfect', x: p.x, z: p.z });
      this.hint('perfect');
      return;
    }
    p.hp -= dmg; this.stats.damageTaken += dmg;
    ps.cause = { enemyTh, attackTh: atk.nameTh, tipTh: atk.tipTh, attackId: atk.id };
    this.events.push({ t: 'hit', target: p.id, amount: dmg, x: p.x, z: p.z, crit: false, byPlayer: false });
    if (p.hp <= 0) {
      p.hp = 0; ps.down = true; ps.downT = 0; this.stats.deaths++;
      this.tele = [];
      this.events.push({ t: 'player-down', cause: ps.cause });
    }
  }

  private respawn() {
    const ps = this.ps, p = this.player;
    ps.down = false; p.hp = p.maxHp; ps.potions = P.potion.charges;
    ps.swingT = 0; ps.dodgeT = 0; ps.castT = 0; ps.drinkT = 0; ps.skillCd = 0; ps.dodgeCd = 0; ps.empowered = false;
    p.x = this.checkpoint.x; p.z = this.checkpoint.z; p.fx = 0; p.fz = -1;
    this.tele = [];
    for (const e of this.actors) {
      if (e.kind === 'player' || !e.alive) continue;
      e.x = e.sx; e.z = e.sz; e.hp = e.maxHp; e.state = 'idle'; e.st = 0; e.active = false; e.fx = 0; e.fz = 1;
    }
    if (this.bossStarted) {
      this.bossStarted = false; this.phase = 1; this.bossNext = null; this.p2Moves = 0; this.gates.arenaEntry = true;
      for (const pl of this.pillars) pl.alive = true;
      this.events.push({ t: 'gate', id: 'arenaEntry', open: true });
    }
    if (this.clearingTriggered && this.actors.some((e) => e.group === 'clearing' && e.alive)) this.clearingTriggered = false;
    this.events.push({ t: 'respawn', at: this.checkpoint.id });
  }

  // ---------------------------------------------------------------- enemies
  private addTele(owner: Actor, enemyTh: string, atk: AttackDef, x: number, z: number, dx: number, dz: number, total: number, area: boolean): Telegraph {
    const t: Telegraph = { id: this.nextId++, owner: owner.id, atk, enemyTh, shape: atk.shape, x, z, dx, dz, r: atk.r, w: atk.w ?? 0,
      cos: atk.shape === 'cone' ? (atk.w ?? 0.5) : 0, t: total, total, area };
    this.tele.push(t);
    this.events.push({ t: 'telegraph', id: t.id });
    this.hint('dodge');
    return t;
  }

  private chase(a: Actor, speed: number, stopAt: number) {
    const p = this.player, dx = p.x - a.x, dz = p.z - a.z, d = len(dx, dz);
    if (d > 1e-6) { [a.fx, a.fz] = turnToward(a.fx, a.fz, dx / d, dz / d, 0.25); }
    if (d > stopAt) { a.x += (dx / d) * speed * TICK; a.z += (dz / d) * speed * TICK; }
    return d;
  }

  private aggroCheck(a: Actor, range: number) {
    if (a.active) return true;
    if (dist(a.x, a.z, this.player.x, this.player.z) < range && (a.group !== 'clearing' || this.clearingTriggered)) {
      a.active = true; a.state = 'approach'; a.st = 0; this.hint('attack');
    }
    return a.active;
  }

  private puffcap(a: Actor) {
    const D = ENEMIES.puffcap, atk = D.attacks.hop;
    if (a.state === 'idle') { this.aggroCheck(a, D.aggro); return; }
    a.st -= TICK;
    if (a.state === 'approach') {
      const d = this.chase(a, D.speed, D.attackRange * 0.8);
      if (d < D.attackRange && a.flinch <= 0) {
        const [tx, tz] = this.clampWalk(this.player.x, this.player.z, a.r);
        a.tx = tx; a.tz = tz; a.ox = a.x; a.oz = a.z; a.state = 'windup'; a.st = atk.windup - 0.3;
        this.addTele(a, D.nameTh, atk, tx, tz, 0, 1, atk.windup, true);
      }
    } else if (a.state === 'windup') {
      if (a.st <= 0) { a.state = 'hop'; a.st = 0.3; a.ox = a.x; a.oz = a.z; }
    } else if (a.state === 'hop') {
      const k = 1 - Math.max(0, a.st) / 0.3;
      a.x = a.ox + (a.tx - a.ox) * k; a.z = a.oz + (a.tz - a.oz) * k;
      if (a.st <= 0) { a.state = 'recover'; a.st = D.recover; this.hint('counter'); }
    } else if (a.state === 'recover') {
      if (a.st <= 0) a.state = 'approach';
    }
  }

  private thornling(a: Actor) {
    const D = ENEMIES.thornling, atk = D.attacks.rush;
    if (a.state === 'idle') { this.aggroCheck(a, D.aggro); return; }
    a.st -= TICK;
    if (a.state === 'approach') {
      const d = this.chase(a, D.speed, 4);
      if (d < D.attackRange && a.flinch <= 0) {
        const [dx, dz] = norm(this.player.x - a.x, this.player.z - a.z);
        a.dx = dx; a.dz = dz; a.fx = dx; a.fz = dz; a.state = 'windup'; a.st = atk.windup;
        this.addTele(a, D.nameTh, atk, a.x, a.z, dx, dz, atk.windup, false);
        this.hint('line');
      }
    } else if (a.state === 'windup') {
      if (a.st <= 0) { a.state = 'rush'; a.st = atk.r / D.rushSpeed; a.hitDone = false; }
    } else if (a.state === 'rush') {
      const nx = a.x + a.dx * D.rushSpeed * TICK, nz = a.z + a.dz * D.rushSpeed * TICK;
      const [cx, cz] = this.clampWalk(nx, nz, a.r);
      a.x = cx; a.z = cz;
      if (!a.hitDone && dist(a.x, a.z, this.player.x, this.player.z) < a.r + P.radius) { a.hitDone = true; this.hurtPlayer(atk.dmg, D.nameTh, atk); }
      if (a.st <= 0 || dist2(cx, cz, nx, nz) > 0.01) { a.state = 'recover'; a.st = D.recover; this.hint('counter'); }
    } else if (a.state === 'recover') {
      if (a.st <= 0) a.state = 'approach';
    }
  }

  private prismback(a: Actor) {
    const D = ENEMIES.prismback, A = D.attacks;
    if (!this.bossStarted) return;
    const mul = this.phase === 2 ? D.windupMulP2 : 1;
    a.st -= TICK;
    const p = this.player;
    switch (a.state) {
      case 'intro':
        if (a.st <= 0) { a.state = 'approach'; a.st = 0.6; }
        break;
      case 'roar':
        if (a.st <= 0) { a.state = 'approach'; a.st = 0.4; }
        break;
      case 'approach': {
        const d = this.chase(a, this.phase === 2 ? D.speedP2 : D.speed, 3.4);
        if (a.st <= 0) this.bossChoose(a, d, mul);
        break;
      }
      case 'windup':
        if (a.st <= 0) {
          if (a.atk === 'charge') { a.state = 'charge'; a.travel = 0; a.hitDone = false; }
          else { a.state = 'recover'; a.st = a.atk === 'slam' ? 1.0 : 0.7; }
        }
        break;
      case 'cast':
        if (a.st <= 0) {
          a.state = 'recover'; a.st = 0.6;
          if (this.phase === 2 && D.p2FollowCharge && this.pillars.some((pl) => pl.alive)) { this.bossNext = 'charge'; this.hint('pillarP2'); }
        }
        break;
      case 'charge': {
        const step = D.chargeSpeed * TICK;
        a.x += a.dx * step; a.z += a.dz * step; a.travel += step;
        if (!a.hitDone && dist(a.x, a.z, p.x, p.z) < a.r + P.radius) { a.hitDone = true; this.hurtPlayer(A.charge.dmg, D.nameTh, A.charge); }
        for (let i = 0; i < this.pillars.length; i++) {
          const pl = this.pillars[i];
          if (pl.alive && dist(a.x, a.z, pl.x, pl.z) < a.r + pl.r) {
            pl.alive = false; a.state = 'stunned'; a.st = D.stunPillar;
            this.events.push({ t: 'pillar-break', i }, { t: 'stun', id: a.id, long: true });
            return;
          }
        }
        const [cx, cz] = this.clampArena(a.x, a.z, a.r);
        const hitWall = dist2(cx, cz, a.x, a.z) > 1e-4;
        a.x = cx; a.z = cz;
        if (hitWall || a.travel >= A.charge.r) { a.state = 'stunned'; a.st = D.stunMiss; this.events.push({ t: 'stun', id: a.id, long: false }); }
        break;
      }
      case 'stunned':
        if (a.st <= 0) { a.state = 'recover'; a.st = 0.3; }
        break;
      case 'recover':
        if (a.st <= 0) {
          if (this.phase === 1 && a.hp <= a.maxHp * D.phase2At) {
            this.phase = 2; a.state = 'roar'; a.st = D.roar;
            // broken pillars regrow so the lure mechanic carries into phase 2
            if (this.pillars.some((pl) => !pl.alive)) { for (const pl of this.pillars) pl.alive = true; this.events.push({ t: 'pillars-regrow' }); }
            this.events.push({ t: 'boss-phase' }); this.hint('phase2');
          } else { a.state = 'approach'; a.st = this.rng.range(0.5, 1.2) * (this.phase === 2 ? 0.75 : 1); }
        }
        break;
    }
  }

  private bossChoose(a: Actor, d: number, mul: number) {
    const D = ENEMIES.prismback, A = D.attacks, p = this.player;
    const opts: [string, number][] = [];
    if (d < 5.2) { opts.push(['sweep', 3], ['slam', 2]); if (this.phase === 2) opts.push(['shard', 1]); }
    else { opts.push(['charge', d > 7 ? 3 : 1]); if (this.phase === 2) opts.push(['shard', 2]); if (d < 7.5) opts.push(['slam', 1]); }
    let pick = opts.filter(([id]) => !(id === a.lastAtk && a.repeat >= 1));
    if (!pick.length) pick = opts;
    let total = 0; for (const [, w] of pick) total += w;
    let r = this.rng.next() * total, id = pick[0][0];
    for (const [k, w] of pick) { if (r < w) { id = k; break; } r -= w; }
    const forced = this.bossNext !== null;
    if (forced) { id = this.bossNext!; this.bossNext = null; }
    else if (this.phase === 2 && ++this.p2Moves >= D.p2ShardEvery) id = 'shard';
    if (id === 'shard') this.p2Moves = 0;
    a.repeat = id === a.lastAtk ? a.repeat + 1 : 0; a.lastAtk = id; a.atk = id;
    const [dx, dz] = norm(p.x - a.x, p.z - a.z);
    if (id === 'sweep') {
      a.fx = dx; a.fz = dz; const w = A.sweep.windup * mul;
      this.addTele(a, D.nameTh, A.sweep, a.x, a.z, dx, dz, w, true); a.state = 'windup'; a.st = w;
    } else if (id === 'slam') {
      const w = A.slam.windup * mul;
      this.addTele(a, D.nameTh, A.slam, a.x, a.z, 0, 1, w, true); a.state = 'windup'; a.st = w;
    } else if (id === 'charge') {
      a.fx = dx; a.fz = dz; a.dx = dx; a.dz = dz; const w = forced ? D.followChargeWindup : A.charge.windup * mul;
      this.addTele(a, D.nameTh, A.charge, a.x, a.z, dx, dz, w, false); a.state = 'windup'; a.st = w;
    } else {
      const n = 5;
      for (let i = 0; i < n; i++) {
        let sx = p.x, sz = p.z;
        if (i > 0) { const v = DIRS16[this.rng.int(16)]; sx += v[0] * 2.4; sz += v[1] * 2.4; }
        const [cx, cz] = this.clampArena(sx, sz, 0.5);
        this.addTele(a, D.nameTh, A.shard, cx, cz, 0, 1, (A.shard.windup + i * D.shardStagger) * mul, true);
      }
      a.state = 'cast'; a.st = 0.9;
    }
  }

  // ---------------------------------------------------------------- telegraphs
  private updateTelegraphs() {
    const p = this.player, keep: Telegraph[] = [];
    for (const t of this.tele) {
      t.t -= TICK;
      if (t.t > 0) { keep.push(t); continue; }
      if (t.area && this.insideTele(t, p.x, p.z, P.radius * 0.5)) this.hurtPlayer(t.atk.dmg, t.enemyTh, t.atk);
      if (this.ps.down) return; // hurtPlayer cleared all telegraphs
    }
    this.tele = keep;
  }

  insideTele(t: Telegraph, x: number, z: number, pad: number): boolean {
    const dx = x - t.x, dz = z - t.z;
    if (t.shape === 'circle') return dx * dx + dz * dz <= (t.r + pad) * (t.r + pad);
    if (t.shape === 'cone') {
      const d = len(dx, dz);
      if (d > t.r + pad) return false;
      if (d < CONE_INNER_R) return true;
      return (dx * t.dx + dz * t.dz) / d >= t.cos;
    }
    const along = dx * t.dx + dz * t.dz;
    if (along < -pad || along > t.r + pad) return false;
    const perp = Math.abs(dx * -t.dz + dz * t.dx);
    return perp <= t.w / 2 + pad;
  }

  // ---------------------------------------------------------------- world geometry
  private shapeOpen(s: Shape) { return !s.gate || this.gates[s.gate]; }

  clampWalk(x: number, z: number, r: number): [number, number] {
    let bx = x, bz = z, bd = 1e18;
    for (const s of LEVEL.walkable) {
      if (!this.shapeOpen(s)) continue;
      let cx: number, cz: number;
      if (s.type === 'circle') { cx = s.x; cz = s.z; }
      else {
        const abx = s.bx - s.ax, abz = s.bz - s.az;
        let k = ((x - s.ax) * abx + (z - s.az) * abz) / (abx * abx + abz * abz);
        k = k < 0 ? 0 : k > 1 ? 1 : k;
        cx = s.ax + abx * k; cz = s.az + abz * k;
      }
      const R = s.r - r, dx = x - cx, dz = z - cz, d = len(dx, dz);
      if (d <= R) return [x, z];
      const px = cx + (dx / d) * R, pz = cz + (dz / d) * R, pd = dist2(px, pz, x, z);
      if (pd < bd) { bd = pd; bx = px; bz = pz; }
    }
    return [bx, bz];
  }

  private clampArena(x: number, z: number, r: number): [number, number] {
    const A = LEVEL.walkable.find((s) => s.id === 'arena')!;
    if (A.type !== 'circle') return [x, z];
    const dx = x - A.x, dz = z - A.z, d = len(dx, dz), R = A.r - r;
    return d <= R ? [x, z] : [A.x + (dx / d) * R, A.z + (dz / d) * R];
  }

  private resolveCollisions() {
    const p = this.player;
    for (const e of this.actors) {
      if (e.kind === 'player' || !e.alive || e.state === 'hop') continue;
      const dx = p.x - e.x, dz = p.z - e.z, d = len(dx, dz), m = p.r + e.r;
      if (d < m && d > 1e-6) {
        const push = m - d;
        if (e.kind === 'prismback') { p.x += (dx / d) * push; p.z += (dz / d) * push; }
        else { p.x += (dx / d) * push * 0.5; p.z += (dz / d) * push * 0.5; e.x -= (dx / d) * push * 0.5; e.z -= (dz / d) * push * 0.5; }
      }
      if (e.kind === 'prismback') { this.pushFromPillars(e); [e.x, e.z] = this.clampArena(e.x, e.z, e.r); }
      else [e.x, e.z] = this.clampWalk(e.x, e.z, e.r);
    }
    this.pushFromPillars(p);
    [p.x, p.z] = this.clampWalk(p.x, p.z, p.r);
  }

  private pushFromPillars(a: Actor) {
    if (a.kind === 'prismback' && a.state === 'charge') return;
    for (const pl of this.pillars) {
      if (!pl.alive) continue;
      const dx = a.x - pl.x, dz = a.z - pl.z, d = len(dx, dz), m = a.r + pl.r;
      if (d < m && d > 1e-6) { a.x = pl.x + (dx / d) * m; a.z = pl.z + (dz / d) * m; }
    }
  }

  private triggers() {
    const p = this.player, L = LEVEL;
    if (!this.clearingTriggered && dist(p.x, p.z, L.clearingTrigger.x, L.clearingTrigger.z) < L.clearingTrigger.r) {
      this.clearingTriggered = true;
      for (const e of this.actors) if (e.group === 'clearing' && e.alive) { e.active = true; e.state = 'approach'; e.st = 0; }
      this.hint('skill');
    }
    if (!this.gates.clearingExit && !this.actors.some((e) => e.group === 'clearing' && e.alive)) {
      this.gates.clearingExit = true; this.events.push({ t: 'gate', id: 'clearingExit', open: true });
    }
    if (dist(p.x, p.z, L.spring.x, L.spring.z) < L.spring.r) {
      if (this.checkpoint.id !== 'spring') { this.checkpoint = { id: 'spring', x: L.spring.x, z: L.spring.z + 1.2 }; this.events.push({ t: 'checkpoint', id: 'spring' }); this.hint('spring'); }
      if (p.hp < p.maxHp) { const h = Math.min(2, p.maxHp - p.hp); p.hp += h; }
      this.ps.potions = P.potion.charges;
    }
    const bt = L.boss.trigger;
    if (!this.bossStarted && this.boss.alive && dist(p.x, p.z, bt.x, bt.z) < bt.r) {
      this.bossStarted = true; this.gates.arenaEntry = false;
      const b = this.boss; b.active = true; b.state = 'intro'; b.st = 1.6; b.x = b.sx; b.z = b.sz; b.hp = b.maxHp;
      this.events.push({ t: 'gate', id: 'arenaEntry', open: false }, { t: 'boss-start' });
      this.hint('pillar');
    }
  }

  /** Summary used by server (authoritative) and client (display). */
  summary() {
    return { victory: this.victory, ticks: this.tick, seconds: this.tick * TICK, ...this.stats, bossHpLeft: this.boss.hp, phase: this.phase };
  }
}
