// DES-010 §3.3: the crab's clips follow the sim's own state and the telegraphs' real deadlines. Driven by the real
// `ninja-roam-1` sim (read-only: the test only keeps the player alive and lowers the boss's HP to reach phase 2).
import { describe, it, expect } from 'vitest';
import { createWorld } from '../shared/sim/createWorld.ts';
import type { NinjaWorld } from '../shared/sim/ninjaWorld.ts';
import { NO_INPUT } from '../shared/sim/input.ts';
import { TICK } from '../shared/data/tuning.ts';
import { BossClock, stepsLeft, BOSS_FADE, type BossSnap } from '../src/boss/bossClock.ts';
import { snapBoss } from '../src/boss/snap.ts';

interface Frame { tick: number; state: string; atk: string; teleBefore: { id: number; atk: string; t: number }[]; teleAfter: number[]; }
/** runs the boss fight with a standing player; phase 2 from `p2At` on */
function fight(seed: number, steps: number, p2At = 600) {
  const w = createWorld(seed, { dodgeCdTicks: 17, start: 'boss' }, 'ninja-roam-1') as NinjaWorld;
  const clock = new BossClock(), frames: Frame[] = [], snaps: BossSnap[] = [];
  for (let i = 0; i < steps; i++) {
    w.player.hp = w.player.maxHp;
    if (i === 5) { const t = w.level.boss.trigger; w.player.x = t.x; w.player.z = t.z; } // walk into the arena
    if (i === p2At && w.boss.alive) w.boss.hp = Math.floor(w.boss.maxHp * 0.4);
    const teleBefore = w.tele.map((t) => ({ id: t.id, atk: t.atk.id, t: t.t }));
    w.step(NO_INPUT);
    const s = snapBoss(w); clock.observe(s); snaps.push(s);
    frames.push({ tick: s.tick, state: s.alive ? (s.started ? s.state : 'idle') : 'dead', atk: s.atk, teleBefore, teleAfter: w.tele.map((t) => t.id) });
  }
  return { w, clock, frames, snaps };
}
const top = (poses: { clip: string; time: number; weight: number }[]) => poses.slice().sort((a, b) => b.weight - a.weight)[0];

describe('stepsLeft counts the sim way', () => {
  it('is the number of TICK subtractions until the timer is <= 0, not a rounding of seconds', () => {
    for (const s of [0.95, 1.25, 1.0, 1.35, 0.95 * 0.85, 1.25 * 0.85, (1.0 + 4 * 0.22) * 0.85, 0.7, 0.9, 2.6]) {
      let n = 0; for (let left = s; left > 0; n++) left -= TICK;
      expect(stepsLeft(s)).toBe(n);
    }
    expect(stepsLeft(0)).toBe(0); expect(stepsLeft(-1)).toBe(0);
  });
});

describe('boss clock on the real fight', () => {
  const run = fight(7, 2400);
  const impacts = run.frames.flatMap((f) => f.teleBefore.filter((t) => !f.teleAfter.includes(t.id) && t.t - TICK <= 0).map((t) => ({ ...t, tick: f.tick })));
  it('the fight shows every move (the test would prove nothing otherwise)', () => {
    const states = new Set(run.frames.map((f) => `${f.state}:${f.atk}`));
    for (const atk of ['sweep', 'slam', 'charge']) expect([...states].some((s) => s === `windup:${atk}`), atk).toBe(true);
    expect([...states].some((s) => s.startsWith('cast:'))).toBe(true);
    expect([...states].some((s) => s.startsWith('stunned:'))).toBe(true);
    expect([...states].some((s) => s.startsWith('roar:'))).toBe(true);
    expect(impacts.filter((i) => i.atk === 'shard').length).toBeGreaterThanOrEqual(5);
  });
  it('every frame: weights sum to 1 and every clip time is inside its clip', () => {
    for (const f of run.frames) for (const a of [0, 0.5]) {
      const p = run.clock.sample(f.tick - 1 + a);
      if (f.tick < run.frames[run.frames.length - 1].tick - 90) continue; // history is kept for the recent past only
      expect(p.reduce((s, c) => s + c.weight, 0)).toBeCloseTo(1, 9);
      for (const c of p) { expect(c.time).toBeGreaterThanOrEqual(0); expect(c.weight).toBeGreaterThan(0); }
    }
  });
});

describe('boss clock, move by move (a fresh clock sampled as the fight goes, like the renderer)', () => {
  // sample at render ticks T-1 .. T (what the screen shows while tick T is the newest processed one)
  const w = createWorld(7, { dodgeCdTicks: 17, start: 'boss' }, 'ninja-roam-1') as NinjaWorld, clock = new BossClock();
  const log: { tick: number; state: string; atk: string; shown: { clip: string; time: number; weight: number }[]; impact: string[]; trackImpact: number[] }[] = [];
  for (let i = 0; i < 2400; i++) {
    w.player.hp = w.player.maxHp;
    if (i === 5) { const t = w.level.boss.trigger; w.player.x = t.x; w.player.z = t.z; }
    if (i === 600 && w.boss.alive) w.boss.hp = Math.floor(w.boss.maxHp * 0.4);
    if (i === 2300 && w.boss.alive) { const b = w.boss; b.hp = 0; b.alive = false; b.deadT = 0; b.state = 'dead'; } // what the sim's own death does to the actor
    const before = w.tele.map((t) => ({ id: t.id, atk: t.atk.id, t: t.t, owner: t.owner }));
    w.step(NO_INPUT);
    const s = snapBoss(w); clock.observe(s);
    const after = new Set(w.tele.map((t) => t.id));
    log.push({ tick: s.tick, state: s.alive ? (s.started ? s.state : 'idle') : 'dead', atk: s.atk, shown: clock.sample(s.tick),
      impact: before.filter((t) => t.owner === s.id && !after.has(t.id) && t.t - TICK <= 0).map((t) => t.atk),
      trackImpact: [...clock.teleTracks()].filter((t) => t.impact === true && t.impactTick === s.tick).map((t) => t.id) });
  }
  const at = (tick: number) => log.find((l) => l.tick === tick)!;
  it('sweep / slam: the pose is on marker 30 (1.0 s) on the tick the warning really runs out, and never past it before', () => {
    let seen = 0;
    for (const l of log) for (const atk of l.impact) {
      if (atk !== 'sweep' && atk !== 'slam') continue;
      seen++;
      const p = top(l.shown);
      expect(p.clip, `tick ${l.tick}`).toBe(atk);
      expect(p.time, `tick ${l.tick}`).toBeCloseTo(1.0, 6);
      const prev = top(at(l.tick - 1).shown);
      if (prev.clip === atk) expect(prev.time).toBeLessThan(1.0);
    }
    expect(seen).toBeGreaterThanOrEqual(4);
  });
  it('sweep / slam: the windup pose only moves forward, and the recover ends at the clip end (51 / 60 ticks)', () => {
    let lastK = -1, lastAtk = '', ends = 0;
    for (const l of log) {
      const p = top(l.shown);
      if ((l.state === 'windup' || l.state === 'recover') && (l.atk === 'sweep' || l.atk === 'slam') && p.clip === l.atk) {
        if (lastAtk === l.atk) expect(p.time, `tick ${l.tick}`).toBeGreaterThanOrEqual(lastK - 1e-9);
        lastK = p.time; lastAtk = l.atk;
      } else {
        if (lastAtk && l.state !== 'stunned' && l.state !== 'dead') { expect(lastK).toBeGreaterThan((lastAtk === 'sweep' ? 51 : 60) / 30 - 0.06); ends++; }
        lastK = -1; lastAtk = '';
      }
    }
    expect(ends).toBeGreaterThanOrEqual(4);
  });
  it('the confirmed impacts of the clock are exactly the telegraphs whose timer ran out, on that tick', () => {
    for (const l of log) expect(l.trackImpact.length, `tick ${l.tick}`).toBe(l.impact.length);
    const mine = log.reduce((n, l) => n + l.trackImpact.length, 0);
    expect(mine).toBeGreaterThan(10);
  });
  it('charge: the windup releases (marker 30) on the real entry into the charge state, then the charge loop shows', () => {
    let seen = 0;
    for (let i = 1; i < log.length; i++) {
      if (!(log[i].state === 'charge' && log[i - 1].state === 'windup')) continue;
      seen++;
      // on the entry tick the fade has just begun: the windup pose is still what shows, and it is at its release marker
      const w0 = log[i].shown.find((c) => c.clip === 'charge_windup');
      expect(w0?.time, `tick ${log[i].tick}`).toBeCloseTo(1.0, 6);
      const later = log[i + 2];
      if (later?.state === 'charge') expect(top(later.shown).clip).toBe('charge');
      const before = top(log[i - 1].shown);
      expect(before.clip).toBe('charge_windup'); expect(before.time).toBeLessThan(1.0);
    }
    expect(seen).toBeGreaterThanOrEqual(2);
  });
  it('stunned starts and ends with the state: fully shown one tick in, gone after the stun (78 or 27 ticks)', () => {
    const runs: number[] = []; let n = 0;
    for (let i = 0; i < log.length; i++) {
      if (log[i].state === 'stunned') {
        n++;
        if (n > BOSS_FADE.stun) { const p = top(log[i].shown); expect(p.clip).toBe('stunned'); expect(p.weight).toBeCloseTo(1, 9); }
      } else {
        if (n) { runs.push(n); expect(log[Math.min(i + 3, log.length - 1)].shown.some((c) => c.clip === 'stunned')).toBe(false); }
        n = 0;
      }
    }
    expect(runs.length).toBeGreaterThan(0);
    for (const len of runs) expect([78, 27]).toContain(len);
  });
  it('shard cast: 0 -> 27 over the real cast state, then 27 -> 45 over the recover', () => {
    let casts = 0;
    for (let i = 1; i < log.length; i++) {
      if (log[i].state === 'recover' && log[i - 1].state === 'cast') {
        casts++;
        expect(top(log[i].shown).clip).toBe('shard_cast');
        expect(top(log[i].shown).time).toBeCloseTo(27 / 30, 6);
      }
      const c = log[i].shown.find((x) => x.clip === 'shard_cast'); // (the first tick of the cast still shows the pose before it, fading)
      if (log[i].state === 'cast' && c) expect(c.time).toBeLessThanOrEqual(27 / 30 + 1e-9);
    }
    expect(casts).toBeGreaterThan(0);
  });
  it('roar plays over the real roar state, and the walk plays only while the boss really moves', () => {
    const roar = log.filter((l) => l.state === 'roar');
    expect(roar.length).toBe(stepsLeft(1.1));
    expect(top(roar[roar.length - 1].shown).clip).toBe('roar');
    expect(top(roar[roar.length - 1].shown).time).toBeGreaterThan(1.0);
    const intro = log.filter((l) => l.state === 'intro');
    expect(top(intro[intro.length - 1].shown).clip).toBe('roar');
    const walking = log.filter((l) => l.state === 'approach' && l.shown.some((c) => c.clip === 'walk' && c.weight > 0.99));
    expect(walking.length).toBeGreaterThan(5); // the player stands still here, so the boss only walks a few steps between moves
    for (const l of log) if (l.state !== 'approach' && l.state !== 'recover' && l.state !== 'windup' && l.state !== 'cast' && l.state !== 'charge' && l.state !== 'stunned' && l.state !== 'roar' && l.state !== 'dead')
      expect(l.shown.some((c) => c.clip === 'walk' && c.weight > 0.99), `tick ${l.tick} ${l.state}`).toBe(false);
  });
  it('down starts on the real death: 12 ticks, then held', () => {
    const dead = log.filter((l) => l.state === 'dead');
    expect(dead.length).toBeGreaterThan(20);
    expect(top(dead[5].shown).clip).toBe('down');
    expect(top(dead[5].shown).time).toBeCloseTo(5 / 30, 6);
    expect(top(dead[20].shown).time).toBeCloseTo(12 / 30, 6);
  });
  it('a restart (the tick goes back) or a respawn clears the history: nothing pending lands afterwards', () => {
    const c = new BossClock();
    const s: BossSnap = { tick: 10, id: 1, alive: true, started: true, state: 'windup', st: 0.5, atk: 'slam', x: 0, z: 0, teles: [{ id: 3, owner: 1, atk: 'slam', shape: 'circle', t: TICK, total: 1.25, x: 0, z: 0, dx: 0, dz: 1, r: 4.6, w: 0, cos: 0 }] };
    c.observe(s);
    c.observe({ ...s, tick: 11, teles: [], state: 'idle', started: false }, true);
    expect([...c.teleTracks()].length).toBe(0);
    c.observe(s); c.observe({ ...s, tick: 3, teles: [] });
    expect([...c.teleTracks()].filter((t) => t.impact === true).length).toBe(0);
  });
  it('a telegraph that is removed before its timer runs out is a cancel, not an impact', () => {
    const c = new BossClock();
    const s: BossSnap = { tick: 10, id: 1, alive: true, started: true, state: 'windup', st: 0.5, atk: 'slam', x: 0, z: 0, teles: [{ id: 3, owner: 1, atk: 'slam', shape: 'circle', t: 0.5, total: 1.25, x: 0, z: 0, dx: 0, dz: 1, r: 4.6, w: 0, cos: 0 }] };
    c.observe(s); c.observe({ ...s, tick: 11, teles: [] });
    const t = [...c.teleTracks()][0];
    expect(t.impact).toBe(false);
  });
});
