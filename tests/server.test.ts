import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'node:net';
import { server } from '../server/index.ts';
import { World } from '../shared/sim/world.ts';
import { InputLog } from '../shared/sim/input.ts';
import { Bot } from './bot.ts';

let base = '';
beforeAll(async () => { await new Promise<void>((r) => server.listen(0, r)); base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`; });
afterAll(() => { server.close(); });
const post = (p: string, b: unknown) => fetch(base + p, { method: 'POST', body: JSON.stringify(b) }).then(async (r) => ({ status: r.status, body: await r.json() }));

describe('server API', () => {
  it('health', async () => { expect((await fetch(base + '/api/health').then((r) => r.json())).ok).toBe(true); });
  it('rejects instant (faster than real-time) submissions of a real winning log', async () => {
    const { body: start } = await post('/api/run/start', {});
    const w = new World(start.seed), bot = new Bot(1), log = new InputLog();
    while (!w.finished && w.tick < 30 * 60 * 8) { const i = bot.think(w); log.push(i); w.step(i); }
    expect(w.victory).toBe(true);
    const fin = await post('/api/run/finish', { runId: start.runId, log: log.data });
    expect(fin.status).toBe(422);
    expect(fin.body.error).toBe('faster-than-real-time');
  });
  it('ignores client-claimed results: only the replayed outcome counts', async () => {
    const { body: start } = await post('/api/run/start', {});
    const fin = await post('/api/run/finish', { runId: start.runId, log: [30, 0, 0, 0], victory: true, gold: 999999 });
    expect(fin.status).toBe(200);
    expect(fin.body.summary.victory).toBe(false);
    expect(fin.body.reward.gold).toBe(0);
    const again = await post('/api/run/finish', { runId: start.runId, log: [30, 0, 0, 0] });
    expect(again.status).toBe(409);
  });
});
