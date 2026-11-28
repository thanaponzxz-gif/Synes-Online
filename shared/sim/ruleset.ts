// Ruleset versions (DES-006 §1). Separate from the input-log format version (v1/v2, shared/sim/input.ts): the log says HOW inputs
// are encoded, the ruleset says WHICH combat numbers the sim uses. It travels in the run envelope (start request / run record), never
// in the 8-bit input tuple. No engine/DOM imports.
import { PLAYER, COMBO_TICKS, ENEMIES, SKILLS, ULT, CONE_INNER_R, TICK, NINJA, type EnemyTable } from '../data/tuning.ts';
import { LEVEL, type LevelDef } from '../data/level.ts';
import { ROAM_LEVEL } from '../data/roam.ts';
import { NINJA_LEVEL, NINJA_ENEMIES } from '../data/ninjaStage.ts';

/** The Wayfarer rulesets. `roam-1` (owner 2026-11-27): free roam in the open meadow (shared/data/roam.ts) with the combat-2
 *  (= combo A) numbers. */
export const RULESETS = ['combat-1', 'combo-A', 'combo-B', 'combo-C', 'combat-2', 'roam-1'] as const;
/** `ninja-roam-1` (DES-007 rev 4, ADR-014): Seyrin on a snapshot of the roam-1 meadow, with her own sim (shared/sim/ninjaWorld.ts,
 *  made by createWorld). In review: no client default picks it and the server only takes it in review mode. */
export const NINJA_RULESET = 'ninja-roam-1' as const;
export const ALL_RULESETS = [...RULESETS, NINJA_RULESET] as const;
export type Ruleset = (typeof ALL_RULESETS)[number];
export const isNinja = (r: Ruleset): r is typeof NINJA_RULESET => r === NINJA_RULESET;
export const DEFAULT_RULESET: Ruleset = 'combat-1';
/** Logs / run records without the field are `combat-1` with all old combo values. */
/** Owner picked combo A (2026-11-21): its permanent name is `combat-2` (same numbers as combo-A, DES-006 §1). New clients use it
 *  when no ?combo= is given; the server still reads a missing field as `combat-1` so old logs replay under the old rules. */
export const CLIENT_DEFAULT_RULESET: Ruleset = 'combat-2';
export const isRuleset = (x: unknown): x is Ruleset => typeof x === 'string' && (ALL_RULESETS as readonly string[]).includes(x);
/** undefined/null -> combat-1 (old clients); unknown -> null (server rejects). */
export function parseRuleset(x: unknown): Ruleset | null { return x === undefined || x === null ? DEFAULT_RULESET : isRuleset(x) ? x : null; }
/** lane/free-roam playtest build: free roam is what the owner asked to try, so it is the client default on this branch;
 *  ?roam=0 = the path-only level (combat-2, the `main` default). Merging this default into `main` needs the owner's OK. */
export const CLIENT_DEFAULT_ROAM: Ruleset = 'roam-1';
/** Lenient URL parse for the client: ?combo=A|B|C (case-insensitive) or ?combo=1 (= old `combat-1`) pick a path-only ruleset;
 *  ?roam=0 = combat-2 (path-only); otherwise free roam (roam-1). Never `ninja-roam-1`. */
export function rulesetFromQuery(q: URLSearchParams): Ruleset {
  const v = (q.get('combo') ?? '').toUpperCase();
  if (v === '1') return 'combat-1';
  if (v === 'A' || v === 'B' || v === 'C') return `combo-${v}` as Ruleset;
  return q.get('roam') === '0' ? CLIENT_DEFAULT_RULESET : CLIENT_DEFAULT_ROAM;
}
/** The level a ruleset plays on. */
export const levelFor = (r: Ruleset): LevelDef => (r === 'roam-1' ? ROAM_LEVEL : isNinja(r) ? NINJA_LEVEL : LEVEL);
/** The enemy numbers a ruleset plays with. */
export const enemiesFor = (r: Ruleset): EnemyTable => (isNinja(r) ? NINJA_ENEMIES : ENEMIES);

export interface TickCombo { bufferTicks: number; resetTicks: number; dur: readonly number[]; hit: readonly number[]; }
/** Integer-tick combo for a Wayfarer ruleset, or null for `combat-1` (legacy seconds-based combo in PLAYER) and for `ninja-roam-1`
 *  (its own combo in NINJA, run by NinjaWorld). */
export function comboFor(r: Ruleset): TickCombo | null {
  if (r === 'combat-1' || isNinja(r)) return null;
  const s = COMBO_TICKS.sets[r === 'combat-2' || r === 'roam-1' ? 'A' : (r.slice(-1) as 'A' | 'B' | 'C')];
  return { bufferTicks: COMBO_TICKS.bufferTicks, resetTicks: COMBO_TICKS.resetTicks, dur: s.dur, hit: s.hit };
}

function canon(v: unknown): string {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon((v as Record<string, unknown>)[k])).join(',') + '}';
  return JSON.stringify(v);
}
function fnv(s: string, h: number): number { for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
/** 16-hex-char fingerprint (two FNV-1a passes; NOT cryptographic: it detects client/server tuning drift, it is not a signature) of
 *  every number the sim reads from tuning.ts plus the ruleset's own combo values. */
export function tuningHash(r: Ruleset): string {
  // ninja-roam-1 reads none of the Wayfarer tables: its hash covers its own numbers (incl. the dodge facing policy), stage and enemies
  const o: Record<string, unknown> = isNinja(r)
    ? { r, TICK, CONE_INNER_R, NINJA, level: NINJA_LEVEL, enemies: NINJA_ENEMIES }
    : { r, TICK, PLAYER, ENEMIES, SKILLS, ULT, CONE_INNER_R, combo: comboFor(r) };
  if (r === 'roam-1') o.level = ROAM_LEVEL; // the field layout decides outcomes too; older rulesets keep their old hash
  const s = canon(o);
  return fnv(s, 0x811c9dc5).toString(16).padStart(8, '0') + fnv(s, 0x9e3779b1).toString(16).padStart(8, '0');
}
