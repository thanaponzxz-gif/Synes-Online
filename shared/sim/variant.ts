// Run variants for A/B comparison. Whitelisted so the server can verify any variant a client claims.
// No engine/DOM imports. Default must equal the shipped behaviour.
export const DODGE_CD_VALUES = [0.55, 0.87] as const;
export const START_VALUES = ['normal', 'boss'] as const;
export interface RunVariant { dodgeCd: (typeof DODGE_CD_VALUES)[number]; start: (typeof START_VALUES)[number]; }
export const DEFAULT_VARIANT: Readonly<RunVariant> = Object.freeze({ dodgeCd: 0.55, start: 'normal' });

/** Strict parse: undefined/null -> default (old clients). Anything unknown or malformed -> null (reject). */
export function parseVariant(v: unknown): RunVariant | null {
  if (v === undefined || v === null) return { ...DEFAULT_VARIANT };
  if (typeof v !== 'object' || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  for (const k of Object.keys(o)) if (k !== 'dodgeCd' && k !== 'start') return null;
  const dodgeCd = o.dodgeCd === undefined ? DEFAULT_VARIANT.dodgeCd : o.dodgeCd;
  const start = o.start === undefined ? DEFAULT_VARIANT.start : o.start;
  if (!(DODGE_CD_VALUES as readonly unknown[]).includes(dodgeCd)) return null;
  if (!(START_VALUES as readonly unknown[]).includes(start)) return null;
  return { dodgeCd: dodgeCd as RunVariant['dodgeCd'], start: start as RunVariant['start'] };
}

/** Lenient parse for URL params (client): invalid -> default for that field. */
export function variantFromQuery(q: URLSearchParams): RunVariant {
  const cd = Number(q.get('dodgecd')), st = q.get('start');
  return {
    dodgeCd: (DODGE_CD_VALUES as readonly number[]).includes(cd) ? (cd as RunVariant['dodgeCd']) : DEFAULT_VARIANT.dodgeCd,
    start: (START_VALUES as readonly string[]).includes(st ?? '') ? (st as RunVariant['start']) : DEFAULT_VARIANT.start,
  };
}
