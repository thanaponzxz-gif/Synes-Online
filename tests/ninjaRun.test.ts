// `ninja-roam-1` end to end: whole runs, determinism, the server's replay, Auto, and the server's review gate (DES-009 §3).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'node:net';
import { createWorld } from '../shared/sim/createWorld.ts';
import type { NinjaWorld } from '../shared/sim/ninjaWorld.ts';
import type { SimEvent } from '../shared/sim/world.ts';
import { InputLog, quantize, type TickInput } from '../shared/sim/input.ts';
import { PLAYER, SKILLS, ULT, ENEMIES } from '../shared/data/tuning.ts';
import { packAuto, defaultAuto } from '../shared/sim/auto.ts';
import { replayRun } from '../shared/rules/validate.ts';
import { NINJA_RULESET, tuningHash } from '../shared/sim/ruleset.ts';
import { server } from '../server/index.ts';
import { Bot } from './bot.ts';

function botRun(seed: number, start: 'normal' | 'boss' = 'normal') {
  const w = createWorld(seed, { dodgeCdTicks: 17, start }, NINJA_RULESET) as NinjaWorld, bot = new Bot(1), log = new InputLog();
  const kinds: Record<string, number> = {}, trace: string[] = [];
  while (!w.finished && w.tick < 30 * 60 * 10) {
    const i = bot.think(w); log.push(i);
    for (const e of w.step(i)) { trace.push(JSON.stringify(e)); if (e.t === 'action-start') kinds[e.kind] = (kinds[e.kind] ?? 0) + 1; }
  }
  return { w, log, kinds, trace };
}

describe('whole ninja runs', () => {
  it('the scripted player can win, using the combo, dodges and the needle', () => {
    const { w, kinds } = botRun(1);
    expect(w.victory).toBe(true);
    expect(kinds.attack).toBeGreaterThan(20);
    expect(kinds.dodge).toBeGreaterThan(3);
    expect(kinds.echo_needle).toBeGreaterThan(0);
  });
  it('is deterministic, and the server replay of the log gives the same summary', () => {
    for (const seed of [1, 2]) {
      const a = botRun(seed), b = botRun(seed);
      expect(b.trace).toEqual(a.trace);
      const v = replayRun(seed, a.log.data, undefined, { dodgeCdTicks: 17, start: 'normal' }, NINJA_RULESET);
      expect(v.ok).toBe(true);
      expect(v.summary).toEqual(a.w.summary());
    }
  });
  it('a boss-start run replays the same as well', () => {
    const a = botRun(4, 'boss');
    expect(replayRun(4, a.log.data, undefined, { dodgeCdTicks: 17, start: 'boss' }, NINJA_RULESET).summary).toEqual(a.w.summary());
  });
  it('the same log under a Wayfarer ruleset is a different game', () => {
    const a = botRun(1);
    expect(replayRun(1, a.log.data, undefined, undefined, 'roam-1').summary).not.toEqual(a.w.summary());
  });
});

describe('Auto with the ninja', () => {
  it('fights with the combo and the needle; never dodges, drinks, uses the ult, or the shadow thread while it is off', () => {
    const w = createWorld(3, undefined, NINJA_RULESET) as NinjaWorld, kinds = new Set<string>();
    const ev: SimEvent[] = [];
    for (let i = 0; i < 30 * 40 && !w.finished; i++) {
      const inp = i === 0 ? { ...quantize(0, 0, 0), auto: packAuto({ ...defaultAuto(), enabled: true, hall: true, skills: [true, false, true] }) } : quantize(0, 0, 0);
      for (const e of w.step(inp)) { ev.push(e); if (e.t === 'action-start') kinds.add(e.kind); }
    }
    expect(kinds.has('attack')).toBe(true);
    expect(kinds.has('echo_needle')).toBe(true);
    for (const k of ['dodge', 'potion', 'lumen_loom', 'shadow_thread']) expect(kinds.has(k), k).toBe(false);
    expect(ev.some((e) => e.t === 'death')).toBe(true);
  });
});

/** Multiplies every number reachable from `roots` (each object once); returns the undo. */
function scaleNumbers(roots: object[], k: number): () => void {
  const undo: (() => void)[] = [], seen = new Set<object>();
  const walk = (o: Record<string, unknown>) => {
    if (seen.has(o)) return; seen.add(o);
    for (const key of Object.keys(o)) {
      const v = o[key];
      if (typeof v === 'number') { o[key] = v * k; undo.push(() => { o[key] = v; }); }
      else if (v && typeof v === 'object') walk(v as Record<string, unknown>);
    }
  };
  for (const r of roots) walk(r as Record<string, unknown>);
  return () => { for (const u of undo.reverse()) u(); };
}

describe('the ninja reads only its own tables (team A review, round 1)', () => {
  const trace = (w: NinjaWorld, inputs: Iterable<TickInput>) => {
    const t: string[] = [];
    for (const i of inputs) { t.push(JSON.stringify(w.step(i)), JSON.stringify([w.player.x, w.player.z, w.player.hp, w.ns.meter, w.ns.mark])); if (w.finished) break; }
    return t;
  };
  const autoInputs = function* () {
    yield { ...quantize(0, 0, 0), auto: packAuto({ ...defaultAuto(), enabled: true, hall: true, skills: [true, true, true] }) };
    for (let i = 1; i < 30 * 60; i++) yield quantize(0, 0, 0);
  };
  it('changing every Wayfarer number (and the shared enemy table) changes nothing in a ninja game, Auto included', () => {
    const recorded = botRun(2).log.data;
    const play = () => [
      ...trace(createWorld(3, undefined, NINJA_RULESET) as NinjaWorld, autoInputs()),
      ...trace(createWorld(2, { dodgeCdTicks: 17, start: 'normal' }, NINJA_RULESET) as NinjaWorld, InputLog.iterate(recorded)),
    ];
    const base = play();
    const undo = scaleNumbers([PLAYER, SKILLS, ULT, ENEMIES], 3);
    let changed: string[];
    try { changed = play(); } finally { undo(); }
    expect(changed.length).toBe(base.length);
    expect(changed.findIndex((s, i) => s !== base[i])).toBe(-1);
    expect(play()).toEqual(base);
  });
});

describe('server: ninja-roam-1 is in review', () => {
  let base = '';
  beforeAll(async () => { await new Promise<void>((r) => server.listen(0, r)); base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`; });
  afterAll(() => { server.close(); delete process.env.SYNES_REVIEW_RULESETS; });
  const post = (p: string, b: unknown) => fetch(base + p, { method: 'POST', body: JSON.stringify(b) }).then(async (r) => ({ status: r.status, body: await r.json() }));

  it('refuses to start it unless the server runs in review mode', async () => {
    delete process.env.SYNES_REVIEW_RULESETS;
    const r = await post('/api/run/start', { rulesetVersion: NINJA_RULESET });
    expect([r.status, r.body.error]).toEqual([422, 'ruleset-in-review']);
  });
  it('in review mode it replays the run and gives no reward', async () => {
    process.env.SYNES_REVIEW_RULESETS = '1';
    const { status, body: start } = await post('/api/run/start', { rulesetVersion: NINJA_RULESET, tuningHash: tuningHash(NINJA_RULESET) });
    expect(status).toBe(200);
    expect(start.rulesetVersion).toBe(NINJA_RULESET);
    const fin = await post('/api/run/finish', { runId: start.runId, rulesetVersion: NINJA_RULESET, log: [30, 0, 0, 0] });
    expect(fin.status).toBe(200);
    expect(fin.body).toMatchObject({ verified: true, review: true, reward: null, rulesetVersion: NINJA_RULESET });
    expect(fin.body.summary.ticks).toBe(30);
  });
  it('the Wayfarer dodge-cooldown variant and a stale tuning hash are refused', async () => {
    process.env.SYNES_REVIEW_RULESETS = '1';
    expect((await post('/api/run/start', { rulesetVersion: NINJA_RULESET, variant: { dodgeCdTicks: 26 } })).body.error).toBe('bad-variant');
    expect((await post('/api/run/start', { rulesetVersion: NINJA_RULESET, tuningHash: tuningHash('roam-1') })).body.error).toBe('tuning-mismatch');
  });
  it('the Wayfarer rulesets are unchanged: still rewarded', async () => {
    const { body: start } = await post('/api/run/start', { rulesetVersion: 'roam-1' });
    const fin = await post('/api/run/finish', { runId: start.runId, log: [30, 0, 0, 0] });
    expect(fin.status).toBe(200);
    expect(fin.body.review).toBeUndefined();
    expect(fin.body.reward).toMatchObject({ gold: 0 });
  });
});
