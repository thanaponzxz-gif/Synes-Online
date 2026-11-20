import { describe, it, expect } from 'vitest';
import { World } from '../shared/sim/world.ts';
import { InputLog, quantize, BTN } from '../shared/sim/input.ts';
import { replayRun } from '../shared/rules/validate.ts';
import { rewardFor, rankFor } from '../shared/rules/reward.ts';
import { ENEMIES, PLAYER } from '../shared/data/tuning.ts';
import { Bot } from './bot.ts';

function play(seed: number, skill = 1, maxTicks = 30 * 60 * 8) {
  const w = new World(seed), bot = new Bot(skill), log = new InputLog();
  while (!w.finished && w.tick < maxTicks) { const i = bot.think(w); log.push(i); w.step(i); }
  return { w, log };
}

describe('simulation', () => {
  it('scripted player can finish the slice (several seeds, human-like reaction delays)', () => {
    for (const [seed, skill] of [[1, 1], [2, 0.6], [3, 0.35]] as const) {
      const { w } = play(seed, skill);
      expect(w.victory, `seed ${seed} skill ${skill}`).toBe(true);
      expect(w.summary().seconds).toBeLessThan(180);
    }
  });

  it('is deterministic: replaying the input log reproduces the exact outcome', () => {
    const { w, log } = play(42, 0.45);
    const v = replayRun(42, log.data);
    expect(v.ok).toBe(true);
    expect(v.summary).toEqual(w.summary());
  });

  it('a standing-still player loses to the boss and gets a cause + tip', () => {
    const w = new World(7);
    w.player.x = -2; w.player.z = -70; // teleport into arena (test only)
    let cause = null as any;
    for (let i = 0; i < 30 * 120 && !cause; i++) for (const e of w.step(quantize(0, 0, 0))) if (e.t === 'player-down') cause = e.cause;
    expect(cause).toBeTruthy();
    expect(cause.attackTh.length).toBeGreaterThan(0);
    expect(cause.tipTh.length).toBeGreaterThan(10);
  });

  it('dying in the boss fight respawns at the spring with the boss reset', () => {
    const w = new World(9);
    w.step(quantize(0, 0, 0));
    w.checkpoint = { id: 'spring', x: -0.4, z: -50.8 };
    w.player.x = -2; w.player.z = -70;
    let down = false;
    for (let i = 0; i < 30 * 120 && !down; i++) for (const e of w.step(quantize(0, 0, 0))) if (e.t === 'player-down') down = true;
    for (let i = 0; i < 40; i++) w.step(quantize(0, 0, i % 2 ? BTN.RETRY : 0));
    expect(w.ps.down).toBe(false);
    expect(w.player.z).toBeGreaterThan(-55);
    expect(w.boss.hp).toBe(w.boss.maxHp);
    expect(w.gates.arenaEntry).toBe(true);
  });
});

describe('phase 2 keeps the pillar lure (round 2-A)', () => {
  it('boss charges again after the phase change, and broken pillars regrow', () => {
    for (const seed of [1, 2, 3]) {
      const w = new World(seed), bot = new Bot(1);
      let inP2 = false, p2Charges = 0, sawShardThenCharge = false, lastAtkP2 = '';
      while (!w.finished && w.tick < 30 * 60 * 8) {
        const before = w.boss.state;
        for (const e of w.step(bot.think(w))) if (e.t === 'boss-phase') { inP2 = true; expect(w.pillars.every((p) => p.alive)).toBe(true); }
        if (inP2 && before !== 'windup' && w.boss.state === 'windup') {
          if (w.boss.atk === 'charge') { p2Charges++; if (lastAtkP2 === 'shard') sawShardThenCharge = true; }
          lastAtkP2 = w.boss.atk;
        }
        if (inP2 && before !== 'cast' && w.boss.state === 'cast') lastAtkP2 = 'shard';
      }
      expect(inP2, `seed ${seed}`).toBe(true);
      expect(p2Charges, `seed ${seed}`).toBeGreaterThan(0);
      expect(sawShardThenCharge, `seed ${seed}`).toBe(true);
    }
  });
});

describe('fairness constraints (mobile reaction budget)', () => {
  it('every telegraph gives at least 0.65 s warning, including phase 2', () => {
    const all = [ENEMIES.puffcap.attacks.hop, ENEMIES.thornling.attacks.rush, ...Object.values(ENEMIES.prismback.attacks)];
    for (const a of all) {
      const mul = Object.values(ENEMIES.prismback.attacks).includes(a as any) ? ENEMIES.prismback.windupMulP2 : 1;
      expect(a.windup * mul, a.id).toBeGreaterThanOrEqual(0.65);
    }
  });
  it('phase-2 follow-up charge warns longer than a normal charge', () => {
    expect(ENEMIES.prismback.followChargeWindup).toBeGreaterThan(ENEMIES.prismback.attacks.charge.windup);
  });
  it('boss charge: the drawn line is as wide as the body that actually hits (round-2 playtest, step 107–108)', () => {
    const P = ENEMIES.prismback;
    expect(P.attacks.charge.w! / 2).toBeGreaterThanOrEqual(P.radius + PLAYER.radius - 0.01);
  });
  it('dodge cooldown is shorter than the shortest windup (always possible to react)', () => {
    expect(PLAYER.dodge.cooldown).toBeLessThan(0.65);
  });
});

describe('server authority', () => {
  it('rejects malformed or out-of-range logs', () => {
    expect(replayRun(1, 'x').ok).toBe(false);
    expect(replayRun(1, [1, 999, 0, 0]).ok).toBe(false);
    expect(replayRun(1, [1.5, 0, 0, 0]).ok).toBe(false);
  });
  it('rejects runs submitted faster than real time', () => {
    const { log } = play(5);
    expect(replayRun(5, log.data, 2000).reason).toBe('faster-than-real-time');
  });
  it('outcome comes from replay, so a tampered log cannot claim victory', () => {
    const idle = new InputLog(); for (let i = 0; i < 30 * 60; i++) idle.push(quantize(0, 0, 0));
    const v = replayRun(5, idle.data);
    expect(v.ok).toBe(true);
    expect(v.summary!.victory).toBe(false);
  });
  it('rewards are a pure function of verified result + server roll', () => {
    const r = { victory: true, seconds: 120, damageTaken: 20, deaths: 0, perfect: 3 };
    expect(rankFor(r)).toBe('S');
    expect(rewardFor(r, 0.5)).toEqual(rewardFor(r, 0.5));
    expect(rewardFor({ ...r, victory: false }, 0.99).drop).toBeNull();
  });
});

describe('telegraph hit shapes match what is drawn', () => {
  const w = new World(1);
  const base = { id: 1, owner: 0, enemyTh: '', x: 0, z: 0, t: 1, total: 1, area: true } as const;
  const atk = ENEMIES.prismback.attacks;
  it('circle: inside/outside radius', () => {
    const t = { ...base, atk: atk.slam, shape: 'circle' as const, dx: 0, dz: 1, r: 4.6, w: 0, cos: 0 };
    expect(w.insideTele(t, 4.5, 0, 0)).toBe(true);
    expect(w.insideTele(t, 4.8, 0, 0)).toBe(false);
  });
  it('cone: front hits, behind is safe', () => {
    const t = { ...base, atk: atk.sweep, shape: 'cone' as const, dx: 0, dz: 1, r: 5.2, w: 0, cos: 0.5 };
    expect(w.insideTele(t, 0, 4, 0)).toBe(true);
    expect(w.insideTele(t, 0, -3, 0)).toBe(false);
    expect(w.insideTele(t, 4, 0.5, 0)).toBe(false); // ~83° off-axis: outside the 60° half-angle
  });
  it('line: side-step escapes, backing up along the line does not', () => {
    const t = { ...base, atk: atk.charge, shape: 'line' as const, dx: 0, dz: 1, r: 18, w: 3, cos: 0 };
    expect(w.insideTele(t, 0, 10, 0)).toBe(true);
    expect(w.insideTele(t, 2, 10, 0)).toBe(false);
  });
});
