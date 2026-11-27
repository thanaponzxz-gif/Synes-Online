// DES-009 §3.4: adding `ninja-roam-1` must not change any ruleset that already exists, nor how a log without a ruleset is read.
// The fixture was generated from implementation base fc1ada5 before any change under shared/ (tools/qa/ruleset-golden.ts).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { replayRun } from '../shared/rules/validate.ts';
import { parseRuleset, tuningHash, type Ruleset } from '../shared/sim/ruleset.ts';
import { runCase, levelFingerprint, enemyFingerprint, type GoldenCase, type GoldenResult } from './rulesetDigest.ts';

const golden = JSON.parse(fs.readFileSync(new URL('./fixtures/ruleset-golden.json', import.meta.url), 'utf8')) as {
  implementationBase: string; sharedLastChanged: string; tuningHash: Record<string, string>; level: Record<string, string>; enemies: string;
  cases: (GoldenCase & { expect: GoldenResult })[];
};
const OLD = Object.keys(golden.tuningHash) as Ruleset[];

describe('rulesets shipped before ninja-roam-1 are unchanged', () => {
  it('the fixture covers all six of them', () => {
    expect(OLD).toEqual(['combat-1', 'combo-A', 'combo-B', 'combo-C', 'combat-2', 'roam-1']);
    for (const r of OLD) expect(golden.cases.filter((c) => c.ruleset === r).length, r).toBe(5);
  });
  it.each(OLD)('%s: tuning hash, level data and enemy numbers are the recorded ones', (r) => {
    expect(tuningHash(r)).toBe(golden.tuningHash[r]);
    expect(levelFingerprint(r)).toBe(golden.level[r]);
    expect(enemyFingerprint()).toBe(golden.enemies);
  });
  it.each(golden.cases.map((c) => [c.id, c] as const))('%s: whole-state digest and summary are identical', (_id, c) => {
    expect(runCase(c)).toEqual(c.expect);
  });
  it('a run record / log without a ruleset still means combat-1 (server replay path)', () => {
    expect(parseRuleset(undefined)).toBe('combat-1');
    expect(parseRuleset(null)).toBe('combat-1');
    for (const c of golden.cases.filter((x) => x.ruleset === 'combat-1')) {
      const v = replayRun(c.seed, c.log, undefined, c.variant);
      expect(v.ok, c.id).toBe(true);
      expect(v.summary, c.id).toEqual(c.expect.summary);
    }
  });
  it('every old case replays through the server path to the recorded summary under its own ruleset', () => {
    for (const c of golden.cases) {
      const v = replayRun(c.seed, c.log, undefined, c.variant, c.ruleset);
      expect(v.ok, c.id).toBe(true);
      expect(v.summary, c.id).toEqual(c.expect.summary);
    }
  });
});
