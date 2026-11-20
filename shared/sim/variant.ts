// Run variants for A/B comparison. Whitelisted so the server can verify any variant a client claims.
// No engine/DOM imports. Default must equal the shipped behaviour.
import { TICK } from '../data/tuning.ts';

/** Dodge cooldown as an integer tick count at 30 Hz: 17 = 0.55 s (shipped), 26 = 0.87 s (DES-001 comparison). */
export const DODGE_CD_TICKS_VALUES = [17, 26] as const;
export type DodgeCdTicks = (typeof DODGE_CD_TICKS_VALUES)[number];
export const START_VALUES = ['normal', 'boss'] as const;
export interface RunVariant { dodgeCdTicks: DodgeCdTicks; start: (typeof START_VALUES)[number]; }
export const DEFAULT_VARIANT: Readonly<RunVariant> = Object.freeze({ dodgeCdTicks: 17, start: 'normal' });

/** Timer value set on dodge (also the HUD ring's full-scale value). The timer drops by TICK each tick and a dodge is
 *  allowed at <= 0, so (n - 0.5) * TICK means exactly n decrements: 17 -> 0.55 s (as shipped), 26 -> 0.85 s. */
export const dodgeCdSeconds = (v: Pick<RunVariant, 'dodgeCdTicks'>): number => (v.dodgeCdTicks - 0.5) * TICK;

/** Accepts the tick form (17/26) and the legacy seconds form (0.55 -> 17, 0.87 -> 26). Anything else -> null. */
function cdToTicks(x: unknown): DodgeCdTicks | null {
  if (x === 0.55) return 17;
  if (x === 0.87) return 26;
  if (x === 17 || x === 26) return x;
  return null;
}

/** Strict parse: undefined/null -> default (old clients). Anything unknown or malformed -> null (reject).
 *  Accepts {dodgeCdTicks: 17|26} or the legacy {dodgeCd: 0.55|0.87}; giving both is rejected. Output is always the tick form. */
export function parseVariant(v: unknown): RunVariant | null {
  if (v === undefined || v === null) return { ...DEFAULT_VARIANT };
  if (typeof v !== 'object' || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  for (const k of Object.keys(o)) if (k !== 'dodgeCd' && k !== 'dodgeCdTicks' && k !== 'start') return null;
  if (o.dodgeCd !== undefined && o.dodgeCdTicks !== undefined) return null;
  let dodgeCdTicks: DodgeCdTicks | null = DEFAULT_VARIANT.dodgeCdTicks;
  if (o.dodgeCdTicks !== undefined) dodgeCdTicks = o.dodgeCdTicks === 17 || o.dodgeCdTicks === 26 ? o.dodgeCdTicks : null; // tick form: ticks only
  else if (o.dodgeCd !== undefined) dodgeCdTicks = o.dodgeCd === 0.55 ? 17 : o.dodgeCd === 0.87 ? 26 : null; // legacy form: seconds only
  const start = o.start === undefined ? DEFAULT_VARIANT.start : o.start;
  if (dodgeCdTicks === null) return null;
  if (!(START_VALUES as readonly unknown[]).includes(start)) return null;
  return { dodgeCdTicks, start: start as RunVariant['start'] };
}

/** Lenient parse for URL params (client): ?dodgecd=0.55|0.87|17|26; invalid -> default for that field. */
export function variantFromQuery(q: URLSearchParams): RunVariant {
  const raw = q.get('dodgecd'), st = q.get('start');
  return {
    dodgeCdTicks: (raw === null ? null : cdToTicks(Number(raw))) ?? DEFAULT_VARIANT.dodgeCdTicks,
    start: (START_VALUES as readonly string[]).includes(st ?? '') ? (st as RunVariant['start']) : DEFAULT_VARIANT.start,
  };
}
