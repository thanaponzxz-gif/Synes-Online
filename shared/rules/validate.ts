// Server-side authoritative replay. The client submits only its input log; the server re-simulates.
import { World } from '../sim/world.ts';
import { InputLog } from '../sim/input.ts';
import { TICK } from '../data/tuning.ts';

export const MAX_RUN_TICKS = Math.round(20 * 60 / TICK); // 20 minutes
export interface ReplayVerdict { ok: boolean; reason?: string; summary?: ReturnType<World['summary']>; }

export function replayRun(seed: number, log: unknown, realElapsedMs?: number): ReplayVerdict {
  if (!Array.isArray(log) || log.length % 4 !== 0 || log.length > 400_000) return { ok: false, reason: 'bad-log-shape' };
  let total = 0;
  for (let i = 0; i < log.length; i += 4) {
    const [c, mx, mz, b] = log.slice(i, i + 4);
    if (![c, mx, mz, b].every((v) => Number.isInteger(v))) return { ok: false, reason: 'non-integer' };
    if (c < 1 || c > 65535 || Math.abs(mx) > 64 || Math.abs(mz) > 64 || b < 0 || b > 31) return { ok: false, reason: 'out-of-range' };
    total += c;
  }
  if (total > MAX_RUN_TICKS) return { ok: false, reason: 'too-long' };
  if (realElapsedMs !== undefined && realElapsedMs + 3000 < total * TICK * 1000 * 0.95) return { ok: false, reason: 'faster-than-real-time' };
  const w = new World(seed);
  for (const inp of InputLog.iterate(log as number[])) { w.step(inp); if (w.finished) break; }
  return { ok: true, summary: w.summary() };
}
