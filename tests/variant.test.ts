import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'node:net';
import { server } from '../server/index.ts';
import { World } from '../shared/sim/world.ts';
import { InputLog, quantize, BTN } from '../shared/sim/input.ts';
import { replayRun } from '../shared/rules/validate.ts';
import { parseVariant, variantFromQuery, DEFAULT_VARIANT } from '../shared/sim/variant.ts';
import { Bot } from './bot.ts';

describe('input bits', () => {
  it('new buttons exist and fit in 8 bits', () => {
    expect([BTN.SKILL2, BTN.SKILL3, BTN.ULT]).toEqual([32, 64, 128]);
    expect(quantize(0, 0, 255).b).toBe(255);
    expect(quantize(0, 0, 256).b).toBe(0);
  });
  it('validator accepts b<=255 and rejects 256; new bits do not change the sim', () => {
    expect(replayRun(1, [3, 0, 0, 255]).ok).toBe(true);
    expect(replayRun(1, [3, 0, 0, 256]).ok).toBe(false);
    expect(replayRun(1, [3, 0, 0, -1]).ok).toBe(false);
    const a = replayRun(1, [60, 10, 0, 0]).summary, b = replayRun(1, [60, 10, 0, BTN.SKILL2 | BTN.SKILL3 | BTN.ULT]).summary;
    expect(b).toEqual(a);
  });
});

describe('run variants', () => {
  it('whitelist rejects anything else; missing = default', () => {
    expect(parseVariant(undefined)).toEqual(DEFAULT_VARIANT);
    expect(parseVariant({ dodgeCd: 0.87, start: 'boss' })).toEqual({ dodgeCdTicks: 26, start: 'boss' });
    expect(parseVariant({ dodgeCd: 0.55 })).toEqual(DEFAULT_VARIANT);
    expect(parseVariant({ dodgeCdTicks: 26 })).toEqual({ dodgeCdTicks: 26, start: 'normal' });
    for (const bad of [{ dodgeCd: 0.5 }, { dodgeCd: '0.87' }, { dodgeCd: 0 }, { start: 'x' }, { foo: 1 }, 'a', 5, [], { dodgeCd: NaN }, { dodgeCdTicks: 25 }, { dodgeCdTicks: 0.87 }, { dodgeCdTicks: 17, dodgeCd: 0.55 }, { dodgeCd: 26.0001 }, { dodgeCd: 26 }, { dodgeCd: 17 }])
      expect(parseVariant(bad), JSON.stringify(bad)).toBeNull();
  });
  it('URL params: invalid falls back to default', () => {
    expect(variantFromQuery(new URLSearchParams('dodgecd=0.87&start=boss'))).toEqual({ dodgeCdTicks: 26, start: 'boss' });
    expect(variantFromQuery(new URLSearchParams('dodgecd=26'))).toEqual({ dodgeCdTicks: 26, start: 'normal' });
    expect(variantFromQuery(new URLSearchParams('dodgecd=17'))).toEqual(DEFAULT_VARIANT);
    expect(variantFromQuery(new URLSearchParams('dodgecd=0.55'))).toEqual(DEFAULT_VARIANT);
    expect(variantFromQuery(new URLSearchParams('dodgecd=3&start=zzz'))).toEqual(DEFAULT_VARIANT);
  });
  it('two dodges 0.6 s apart (input buffer is 0.2 s): both fire at 0.55, second is blocked at 0.87', () => {
    const log = new InputLog();
    for (let i = 0; i < 60; i++) log.push(quantize(0, -1, i === 0 || i === 18 ? BTN.DODGE : 0));
    const a = replayRun(3, log.data, undefined, { dodgeCdTicks: 17, start: 'normal' }).summary!;
    const b = replayRun(3, log.data, undefined, { dodgeCdTicks: 26, start: 'normal' }).summary!;
    expect(a.dodges).toBe(2);
    expect(b.dodges).toBe(1);
  });
  it.each([[17, 'default'], [26, 'comparison']] as const)('dodge is possible again exactly %i ticks after the previous one (%s)', (n, _label) => {
    // press on every other tick so a fresh rising edge (0.2 s buffer) is always pending; observe the earliest re-dodge
    const w = new World(3, { dodgeCdTicks: n, start: 'normal' }), at: number[] = [];
    for (let i = 0; i < 120; i++) { if (w.step({ mx: 0, mz: -1, b: i % 2 === 0 ? BTN.DODGE : 0 }).some((e) => e.t === 'dodge')) at.push(i); }
    expect(at.length).toBeGreaterThanOrEqual(3);
    for (let k = 1; k < at.length; k++) expect(at[k] - at[k - 1]).toBe(n);
  });
  it('default variant is identical to passing no variant', () => {
    const w1 = new World(9), w2 = new World(9, { dodgeCdTicks: 17, start: 'normal' }), bot = new Bot(1);
    for (let i = 0; i < 900; i++) { const inp = bot.think(w1); w1.step(inp); w2.step(inp); }
    expect(w2.summary()).toEqual(w1.summary());
  });
  it("'boss' start: spring checkpoint, trash cleared, gates open; bot can win", () => {
    const w = new World(4, { dodgeCdTicks: 17, start: 'boss' });
    expect(w.checkpoint.id).toBe('spring');
    expect(w.actors.filter((a) => a.kind !== 'player' && a.kind !== 'prismback').every((a) => !a.alive)).toBe(true);
    expect(w.gates.clearingExit).toBe(true);
    const bot = new Bot(1);
    while (!w.finished && w.tick < 30 * 180) w.step(bot.think(w));
    expect(w.victory).toBe(true);
  });
});

describe('server variants', () => {
  let base = '';
  beforeAll(async () => { await new Promise<void>((r) => server.listen(0, r)); base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`; });
  afterAll(() => { server.close(); });
  const post = (b: unknown) => fetch(base + '/api/run/start', { method: 'POST', body: JSON.stringify(b) }).then(async (r) => ({ status: r.status, body: await r.json() }));
  it('rejects a bad variant, accepts whitelisted, defaults when absent (old client)', async () => {
    expect((await post({ variant: { dodgeCd: 0.1 } })).status).toBe(422);
    expect((await post({ variant: { start: 'boss', dodgeCd: 5 } })).body.error).toBe('bad-variant');
    expect((await post({ variant: { dodgeCd: 0.87, start: 'boss' } })).body.variant).toEqual({ dodgeCdTicks: 26, start: 'boss' });
    expect((await post({ variant: { dodgeCdTicks: 26 } })).body.variant).toEqual({ dodgeCdTicks: 26, start: 'normal' });
    expect((await post({ variant: { dodgeCdTicks: 25 } })).status).toBe(422);
    expect((await post({})).body.variant).toEqual(DEFAULT_VARIANT);
  });
});
