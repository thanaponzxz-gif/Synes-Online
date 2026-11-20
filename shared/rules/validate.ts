// Server-side authoritative replay. The client submits only its input log; the server re-simulates.
import { World } from '../sim/world.ts';
import { InputLog, isV2Log, LOG_OP } from '../sim/input.ts';
import { unpackAuto } from '../sim/auto.ts';
import { type RunVariant, DEFAULT_VARIANT } from '../sim/variant.ts';
import { TICK } from '../data/tuning.ts';

export const MAX_RUN_TICKS = Math.round(20 * 60 / TICK); // 20 minutes
export interface ReplayVerdict { ok: boolean; reason?: string; summary?: ReturnType<World['summary']>; }

/** Strict structural check of an input log (v1 or v2, see shared/sim/input.ts). Returns the total tick count when well-formed. */
export function checkLog(log: unknown): { ok: true; version: 1 | 2; ticks: number } | { ok: false; reason: string } {
  if (!Array.isArray(log) || log.length % 4 !== 0 || log.length > 400_000) return { ok: false, reason: 'bad-log-shape' };
  const v2 = isV2Log(log as number[]);
  let total = 0;
  for (let i = v2 ? 4 : 0; i < log.length; i += 4) {
    const [c, mx, mz, b] = log.slice(i, i + 4);
    if (![c, mx, mz, b].every((v) => Number.isInteger(v))) return { ok: false, reason: 'non-integer' };
    if (v2 && c === 0) { // command tuple: only AUTO_SET, with settings that decode
      if (mx !== LOG_OP.AUTO_SET || !unpackAuto({ a: mz, b })) return { ok: false, reason: 'bad-auto-cmd' };
      continue;
    }
    if (c < 1 || c > 65535 || Math.abs(mx) > 64 || Math.abs(mz) > 64 || b < 0 || b > 255) return { ok: false, reason: 'out-of-range' };
    total += c;
  }
  return { ok: true, version: v2 ? 2 : 1, ticks: total };
}

export function replayRun(seed: number, log: unknown, realElapsedMs?: number, variant: RunVariant = DEFAULT_VARIANT): ReplayVerdict {
  const shape = checkLog(log);
  if (!shape.ok) return { ok: false, reason: shape.reason };
  const total = shape.ticks;
  if (total > MAX_RUN_TICKS) return { ok: false, reason: 'too-long' };
  if (realElapsedMs !== undefined && realElapsedMs + 3000 < total * TICK * 1000 * 0.95) return { ok: false, reason: 'faster-than-real-time' };
  const w = new World(seed, variant);
  for (const inp of InputLog.iterate(log as number[])) { w.step(inp); if (w.finished) break; }
  return { ok: true, summary: w.summary() };
}
