// The QA checker (tools/qa/dmg-oracle.mjs, written from the design text, shares no code with src/) must itself be exact: DES-008 §14.4
// showed a 0.05 px grid can miss a spot that exists at one single y. Expected values here are worked out by hand.
import { describe, it, expect } from 'vitest';
// @ts-ignore plain-JS QA tool without types
import { spot, judge, intervals } from '../tools/qa/dmg-oracle.mjs';
import { FloatBook, type Geo, type FKind } from '../src/ui/floatCore.ts';

const safe = { l: 0, t: 0, r: 844, b: 390 };
/** team A §14.4: body 330..500 × 60..217.026, R 100×103, S 1, the right lane at x 560; HUD down to `hud`, a warning from `warn` over
 *  the whole width → centre y between hud + 52 and warn − 52; above and below the body are shut too */
const fix = (hud: number, warn: number) => ({
  S: 1, safe, a: { l: 330, r: 500, t: 60, b: 217.026 },
  blocks: [{ l: 0, r: 844, t: 0, b: hud, k: 'hud' }, { l: 0, r: 844, t: warn, b: 390, k: 'warn' }, { l: 324, r: 506, t: 54, b: 223.026, k: 'body' }],
});
const attempt = (g: ReturnType<typeof fix>, result: string, y?: number) => ({
  ...g, t: 0, kind: 'damage', actor: 7, n: 1, w: 100, h: 103, result, why: [],
  R: y === undefined ? null : { l: 510, r: 610, t: y - 51.5, b: y + 51.5 },
});

describe('QA checker: exact free intervals (no grid)', () => {
  it('team A §14.4: only the single point 122 is legal although the preferred y is 138.513', () => {
    expect(intervals('right', 100, 103, fix(70, 174))).toEqual([[122, 122]]);
    expect(spot('right', 100, 103, fix(70, 174))).toEqual({ x: 560, y: 122 });
    expect(judge(attempt(fix(70, 174), 'none')).v).toBe('drop-bad');
    expect(judge(attempt(fix(70, 174), 'right', 122)).v).toBe('placed-ok');
  });
  it('HUD to y 71 closes it → a drop is right', () => {
    expect(spot('right', 100, 103, fix(71, 174))).toBeNull();
    expect(judge(attempt(fix(71, 174), 'none')).v).toBe('drop-ok');
  });
  it('an interval narrower than any grid step: 122 .. 122.02 → its middle 122.01', () => {
    expect(spot('right', 100, 103, fix(70, 174.02))!.y).toBeCloseTo(122.01, 9);
  });
  it('the F1 band 119 .. 122: the v3 spot is its middle 120.5; v2\'s end 122 is wrong now (and right for inset 0)', () => {
    expect(spot('right', 100, 103, fix(67, 174))!.y).toBeCloseTo(120.5, 9);
    expect(judge(attempt(fix(67, 174), 'right', 122)).v).toBe('placed-bad');
    expect(judge(attempt(fix(67, 174), 'right', 122), { inset: 0 }).v).toBe('placed-ok');
    expect(judge(attempt(fix(67, 174), 'right', 120.5)).expected).toMatchObject({ place: 'right', y: 120.5 });
  });
  it('the production placement agrees on these singletons and narrow bands (each checked against the hand value)', () => {
    for (const [hud, warn, y] of [[70, 174, 122], [70, 174.02, 122.01], [67, 174, 120.5]] as const) {
      const g = fix(hud, warn);
      const geo: Geo = {
        S: 1, safe, prot: g.blocks,
        actor: (_id, out) => { Object.assign(out, g.a); return 0; },
        box: (_k: FKind) => ({ w: 52 / 1.14, h: 45 / 1.14, badgeW: 0, badgeH: 0, size: 32 }), // R = 100 × 103
      };
      const b = new FloatBook();
      b.ingest([{ kind: 'damage', actor: 7, amount: 28, dist: 0, order: 0 }], geo);
      expect(b.labels.length).toBe(1);
      expect((b.labels[0].screen.t + b.labels[0].screen.b) / 2).toBeCloseTo(y, 6);
    }
  });
});
