import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import type { AddressInfo } from 'node:net';
import { server } from '../server/index.ts';
import { World } from '../shared/sim/world.ts';
import { InputLog, BTN, NO_INPUT, type TickInput } from '../shared/sim/input.ts';
import { replayRun } from '../shared/rules/validate.ts';
import { RULESETS, parseRuleset, rulesetFromQuery, tuningHash, comboFor, type Ruleset } from '../shared/sim/ruleset.ts';
import { packAuto, defaultAuto } from '../shared/sim/auto.ts';
import { PLAYER, COMBO_TICKS } from '../shared/data/tuning.ts';
import { Bot } from './bot.ts';
import { GOLDEN_CASES, digestRun, botInputs } from './golden.ts';

const golden = JSON.parse(fs.readFileSync(new URL('./fixtures/combat1-golden.json', import.meta.url), 'utf8'));
const r3 = JSON.parse(fs.readFileSync(new URL('./fixtures/r3-run.json', import.meta.url), 'utf8'));
const ATK: TickInput = { mx: 0, mz: 0, b: BTN.ATTACK };

describe('combat-1 is unchanged by the combo-ruleset work (golden digests made before the change)', () => {
  it.each(GOLDEN_CASES.map((c) => [c.id, c] as const))('%s: per-tick digest + summary identical', (id, c) => {
    expect(c.run()).toEqual(golden[id]);
  });
  it('explicit combat-1 equals the default constructor', () => {
    const a = new World(2), b = new World(2, { dodgeCdTicks: 17, start: 'normal' }, 'combat-1');
    expect(digestRun(b, botInputs(b, new Bot(1)))).toEqual(digestRun(a, botInputs(a, new Bot(1))));
  });
  it('old r3 log replays to the exact old summary under combat-1 (and when the ruleset is omitted)', () => {
    const want = '{"victory":true,"ticks":2199,"seconds":73.3,"damageTaken":98,"perfect":2,"deaths":0,"dodges":16,"potionsUsed":1,"hitsLanded":70,"bossHpLeft":0,"phase":2}';
    expect(JSON.stringify(replayRun(r3.seed, r3.inputLog).summary)).toBe(want);
    expect(JSON.stringify(replayRun(r3.seed, r3.inputLog, undefined, undefined, 'combat-1').summary)).toBe(want);
  });
});

describe('ruleset parsing + hashing', () => {
  it('whitelist: missing = combat-1, unknown = null', () => {
    expect(parseRuleset(undefined)).toBe('combat-1');
    expect(parseRuleset(null)).toBe('combat-1');
    for (const r of RULESETS) expect(parseRuleset(r)).toBe(r);
    for (const bad of ['combo-D', 'combo-a', 'combat-3', '', 1, {}, [], 'COMBAT-1']) expect(parseRuleset(bad), String(bad)).toBeNull();
  });
  it('?combo=A|B|C selects a ruleset; ?combo=1 is combat-1; anything else is combat-2 (owner pick A)', () => {
    expect(rulesetFromQuery(new URLSearchParams('combo=A'))).toBe('combo-A');
    expect(rulesetFromQuery(new URLSearchParams('combo=c'))).toBe('combo-C');
    expect(rulesetFromQuery(new URLSearchParams('combo=1'))).toBe('combat-1');
    for (const q of ['', 'combo=D', 'combo=', 'combo=combo-A']) expect(rulesetFromQuery(new URLSearchParams(q))).toBe('combat-2');
  });
  it('combat-2 uses exactly the combo-A numbers but has its own name and hash', () => {
    expect(comboFor('combat-2')).toEqual(comboFor('combo-A'));
    expect(tuningHash('combat-2')).not.toBe(tuningHash('combo-A'));
    const a = new World(3, undefined, 'combat-2'), b = new World(3, undefined, 'combo-A');
    for (let i = 0; i < 300; i++) { a.step(i % 2 === 0 ? ATK : NO_INPUT); b.step(i % 2 === 0 ? ATK : NO_INPUT); }
    expect(JSON.stringify(a.ps)).toBe(JSON.stringify(b.ps));
  });
  it('tuning hash is stable, 16 hex chars, and differs per ruleset', () => {
    const hs = RULESETS.map(tuningHash);
    for (const h of hs) expect(h).toMatch(/^[0-9a-f]{16}$/);
    expect(new Set(hs).size).toBe(5);
    expect(tuningHash('combo-B')).toBe(hs[2]);
  });
  it('the three variants match DES-006 §1 and total 42/46/52 ticks', () => {
    expect(COMBO_TICKS.sets.A).toEqual({ dur: [12, 12, 18], hit: [5, 5, 8] });
    expect(COMBO_TICKS.sets.B).toEqual({ dur: [13, 13, 20], hit: [6, 6, 9] });
    expect(COMBO_TICKS.sets.C).toEqual({ dur: [15, 15, 22], hit: [6, 6, 10] });
    expect((['A', 'B', 'C'] as const).map((k) => (COMBO_TICKS.sets[k].dur as readonly number[]).reduce((a, b) => a + b, 0))).toEqual([42, 46, 52]);
    expect(COMBO_TICKS.bufferTicks).toBe(8); expect(COMBO_TICKS.resetTicks).toBe(18);
    expect(PLAYER.combo.map((c) => c.dmg)).toEqual([12, 12, 22]); // damage not compensated
    expect(comboFor('combat-1')).toBeNull();
  });
});

/** Mash attack every other tick (fresh rising edge each time) with no enemy near; returns swing start ticks and hit ticks. */
function mash(r: Ruleset, ticks: number) {
  const w = new World(1, undefined, r), starts: number[] = [], steps: number[] = [], hits: number[] = [];
  let wasDone = true;
  for (let i = 0; i < ticks; i++) {
    for (const e of w.step(i % 2 === 0 ? ATK : NO_INPUT)) if (e.t === 'swing') { starts.push(i); steps.push(e.step); }
    if (w.ps.hitDone && !wasDone) hits.push(i);
    wasDone = w.ps.hitDone;
  }
  return { starts, steps, hits };
}

describe.each(['A', 'B', 'C'] as const)('combo-%s timing (integer ticks)', (k) => {
  const dur: readonly number[] = COMBO_TICKS.sets[k].dur, hit: readonly number[] = COMBO_TICKS.sets[k].hit, r = `combo-${k}` as Ruleset;
  it('swings chain back-to-back at the full duration; hit lands at the stated tick from each swing start', () => {
    const m = mash(r, 200);
    expect(m.steps.slice(0, 6)).toEqual([0, 1, 2, 0, 1, 2]);
    const s = m.starts;
    expect(s[1] - s[0]).toBe(dur[0]); expect(s[2] - s[1]).toBe(dur[1]); expect(s[3] - s[2]).toBe(dur[2]);
    expect(s[4] - s[3]).toBe(dur[0]);
    for (let n = 0; n < 6; n++) expect(m.hits[n] - s[n], `swing ${n}`).toBe(hit[n % 3]);
  });
  it('combo resets after exactly 18 idle ticks counted from the END of the swing', () => {
    for (const [gap, expectStep] of [[17, 1], [18, 0]] as const) {
      const w = new World(1, undefined, r), steps: number[] = [];
      let startTick = -1;
      for (let i = 0; i < 200 && steps.length < 2; i++) {
        // first press at tick 0, second press exactly when swing 1 ended + gap ticks (held off until then)
        const press = i === 0 || (startTick >= 0 && i === startTick + dur[0] + gap);
        for (const e of w.step(press ? ATK : NO_INPUT)) if (e.t === 'swing') { steps.push(e.step); if (startTick < 0) startTick = i; }
      }
      expect(steps, `gap ${gap}`).toEqual([0, expectStep]);
    }
  });
  it('attack input is buffered for 8 ticks (incl. the press tick), not 9', () => {
    for (const [lead, fires] of [[7, true], [8, false]] as const) {
      // press `lead` ticks before swing 1 ends; with a buffer of 8 the press is still alive at the end tick iff lead <= 7
      const w = new World(1, undefined, r);
      let second = -1;
      for (let i = 0; i < 100 && second < 0; i++) {
        const press = i === 0 || i === dur[0] - lead;
        for (const e of w.step(press ? ATK : NO_INPUT)) if (e.t === 'swing' && i > 0) second = i;
      }
      if (fires) expect(second).toBe(dur[0]); else expect(second).not.toBe(dur[0]);
    }
  });
  it('walking while swinging is still 35%', () => {
    const w = new World(1, undefined, r);
    w.step({ mx: 0, mz: -64, b: BTN.ATTACK });
    const z0 = w.player.z; w.step({ mx: 0, mz: -64, b: 0 });
    expect(Math.abs(w.player.z - z0)).toBeCloseTo(PLAYER.speed * PLAYER.attackMoveMul / 30, 5);
  });
});

describe('cross-version: rulesets intentionally differ', () => {
  const run = (r: Ruleset) => { const w = new World(3, undefined, r); return digestRun(w, botInputs(w, new Bot(1))); };
  it('same seed + same bot: combat-1/A/B/C give four different runs, and slower combos take longer to clear', () => {
    const res = RULESETS.map(run);
    expect(new Set(res.map((x) => x.digest)).size).toBe(4);
    expect(res.every((x) => (x.summary as { victory: boolean }).victory)).toBe(true);
    const ticks = res.map((x) => (x.summary as { ticks: number }).ticks);
    expect(ticks[0]).toBeLessThan(ticks[1]); // combat-1 (fastest) < A
  });
  it('an old log replayed under combo-A does NOT reproduce the combat-1 result', () => {
    const old = JSON.stringify(replayRun(r3.seed, r3.inputLog, undefined, undefined, 'combat-1').summary);
    for (const r of ['combo-A', 'combo-B', 'combo-C'] as const) expect(JSON.stringify(replayRun(r3.seed, r3.inputLog, undefined, undefined, r).summary), r).not.toBe(old);
  });
  it('a v2 (Auto) log is deterministic per ruleset and differs across rulesets', () => {
    const log = new InputLog();
    for (let i = 0; i < 900; i++) log.push(i === 0 ? { ...NO_INPUT, auto: packAuto({ ...defaultAuto(), enabled: true, hall: true, skills: [true, true, true] }) } : NO_INPUT);
    expect(log.data.slice(0, 4)).toEqual([0, 0, 2, 0]);
    const sums = RULESETS.map((r) => JSON.stringify(replayRun(1, log.data, undefined, undefined, r).summary));
    expect(RULESETS.map((r) => JSON.stringify(replayRun(1, log.data, undefined, undefined, r).summary))).toEqual(sums);
    expect(sums[0]).toBe(JSON.stringify(replayRun(1, log.data).summary));
    expect(new Set(sums).size).toBeGreaterThan(1);
  });
});

let base = '';
beforeAll(async () => { await new Promise<void>((r) => server.listen(0, r)); base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`; });
afterAll(() => { server.close(); });
const post = (p: string, b: unknown) => fetch(base + p, { method: 'POST', body: JSON.stringify(b) }).then(async (r) => ({ status: r.status, body: await r.json() }));

describe('server run envelope', () => {
  it('rejects unknown rulesets and a mismatching tuning hash; old clients (no field) get combat-1', async () => {
    for (const bad of ['combo-D', 'combat-3', 'combo-a', '', 7, {}]) expect((await post('/api/run/start', { rulesetVersion: bad })).status, String(bad)).toBe(422);
    expect((await post('/api/run/start', { rulesetVersion: 'combo-A' })).status).toBe(200); // hash is optional
    const bad = await post('/api/run/start', { rulesetVersion: 'combo-A', tuningHash: tuningHash('combo-B') });
    expect([bad.status, bad.body.error]).toEqual([422, 'tuning-mismatch']);
    const old = await post('/api/run/start', {});
    expect(old.status).toBe(200);
    expect([old.body.rulesetVersion, old.body.tuningHash]).toEqual(['combat-1', tuningHash('combat-1')]);
  });
  it('records ruleset + hash and replays under the recorded ruleset (finish cannot switch it)', async () => {
    const start = await post('/api/run/start', { rulesetVersion: 'combo-B', tuningHash: tuningHash('combo-B') });
    expect(start.body.rulesetVersion).toBe('combo-B');
    // finishing under a different ruleset claim is refused
    const wrong = await post('/api/run/finish', { runId: start.body.runId, log: [30, 0, 0, 0], rulesetVersion: 'combo-A' });
    expect([wrong.status, wrong.body.error]).toEqual([422, 'ruleset-mismatch']);
    const unknown = await post('/api/run/finish', { runId: start.body.runId, log: [30, 0, 0, 0], rulesetVersion: 'combo-Z' });
    expect(unknown.status).toBe(422);
    const ok = await post('/api/run/finish', { runId: start.body.runId, log: [30, 0, 0, 0], rulesetVersion: 'combo-B' });
    expect(ok.status).toBe(200);
    expect([ok.body.rulesetVersion, ok.body.tuningHash]).toEqual(['combo-B', tuningHash('combo-B')]);
  });
  it('v1 and v2 logs verify through the server path under old and new rulesets, each replayed with its recorded ruleset', async () => {
    const v1 = [30, 0, 0, 0, 10, 0, 0, 1, 10, 0, 0, 0, 10, 0, 0, 1, 30, 0, 0, 0];
    const lg = new InputLog();
    for (let i = 0; i < 90; i++) lg.push(i === 0 ? { ...NO_INPUT, auto: packAuto({ ...defaultAuto(), enabled: true, hall: true, skills: [true, true, true] }) } : NO_INPUT);
    for (const [name, log] of [['v1', v1], ['v2', lg.data]] as const) {
      // combo-A is skipped here only to stay under the server rate limit (30/IP): combat-2 has the same numbers (tested above)
      for (const r of RULESETS.filter((x) => x !== 'combo-A')) {
        const st = await post('/api/run/start', { rulesetVersion: r });
        const fin = await post('/api/run/finish', { runId: st.body.runId, log });
        expect([name, r, fin.status, fin.body.rulesetVersion]).toEqual([name, r, 200, r]);
        expect(fin.body.summary).toEqual(replayRun(st.body.seed, log, undefined, st.body.variant, r).summary);
      }
    }
  });
});
