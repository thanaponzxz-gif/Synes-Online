// Which picture the boss gets (DES-010 §1): the crab only with the ruleset it was approved for, only where its file can be
// had (the dev server's private inbox, or the public Seyrin test build that ships the pair: owner order 2026-11-28, REQ-010 §5),
// and never when the old boss is asked for. Everything else keeps Prismback.
import { BOSS_RULESET } from './spec.ts';

export type BossPicture = 'crab' | 'prismback';
export function bossPictureFor(ruleset: string, hasFile: boolean, query: URLSearchParams): BossPicture {
  return hasFile && ruleset === BOSS_RULESET && query.get('boss') !== 'old' ? 'crab' : 'prismback';
}
