// Which picture the boss gets (DES-010 §1): the crab only with the ruleset it was approved for, only on the dev server (the
// file is REVIEW and lives in the private inbox), and never when the old boss is asked for. Everything else keeps Prismback.
import { BOSS_RULESET } from './spec.ts';

export type BossPicture = 'crab' | 'prismback';
export function bossPictureFor(ruleset: string, dev: boolean, query: URLSearchParams): BossPicture {
  return dev && ruleset === BOSS_RULESET && query.get('boss') !== 'old' ? 'crab' : 'prismback';
}
