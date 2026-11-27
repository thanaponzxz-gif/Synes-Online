// Whole-state per-tick digest of a recorded run, used to prove that the rulesets shipped before `ninja-roam-1` (DES-009 §3.4)
// keep exactly the same results. The inputs are stored in the fixture as input logs, so the goldens do not depend on bot code.
import { World } from '../shared/sim/world.ts';
import { InputLog } from '../shared/sim/input.ts';
import { levelFor, type Ruleset } from '../shared/sim/ruleset.ts';
import { ENEMIES } from '../shared/data/tuning.ts';
import type { RunVariant } from '../shared/sim/variant.ts';

export function fnv(s: string, h = 0x811c9dc5): number { for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
export function canon(v: unknown): string {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon((v as Record<string, unknown>)[k])).join(',') + '}';
  return JSON.stringify(v);
}
export const fingerprint = (v: unknown): string => { const s = canon(v); return fnv(s).toString(16).padStart(8, '0') + fnv(s, 0x9e3779b1).toString(16).padStart(8, '0'); };

export interface GoldenCase { id: string; ruleset: Ruleset; seed: number; variant: RunVariant; log: number[]; }
export interface GoldenResult { digest: string; summary: unknown; ticks: number; }

/** Replays one case tick by tick; every gameplay field of the world goes into the digest. */
export function runCase(c: GoldenCase): GoldenResult {
  const w = new World(c.seed, c.variant, c.ruleset);
  let h = 0x811c9dc5, ticks = 0;
  const state = () => JSON.stringify([
    w.actors.map((a) => [a.id, a.kind, a.x, a.z, a.fx, a.fz, a.hp, a.alive, a.active, a.state, a.st, a.atk, a.travel, a.hitDone, a.flinch]),
    w.ps, w.tele.map((t) => [t.id, t.owner, t.atk.id, t.x, t.z, t.dx, t.dz, t.t, t.total]),
    w.pillars.map((p) => p.alive), w.gates, w.bossStarted, w.phase, w.bossNext, w.checkpoint, w.stats, w.finished, w.victory,
  ]);
  for (const inp of InputLog.iterate(c.log)) {
    const ev = w.step(inp);
    h = fnv(JSON.stringify(ev), h);
    h = fnv(state(), h);
    ticks++;
    if (w.finished) break;
  }
  return { digest: h.toString(16), summary: w.summary(), ticks };
}

/** Level and enemy numbers the ruleset plays with (the old rulesets share the global enemy table). */
export const levelFingerprint = (r: Ruleset) => fingerprint(levelFor(r));
export const enemyFingerprint = () => fingerprint(ENEMIES);
