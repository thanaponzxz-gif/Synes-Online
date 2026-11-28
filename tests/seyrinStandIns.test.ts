import { describe, it, expect } from 'vitest';
import { STAND_INS, standIn } from '../src/seyrin/standIns.ts';
import { FULL_CLIPS, PREVIEW_CLIPS, FPS } from '../src/seyrin/spec.ts';
import type { AnimPlan } from '../src/seyrin/animPlan.ts';

const have = new Set(PREVIEW_CLIPS.map((c) => c.name));
const plan = (p: Partial<AnimPlan>): AnimPlan => ({ upper: [], lower: [], additive: [], pelvisLift: 0, ...p });

describe('temporary stand-in clips for the six-clip P1 file (owner order 2026-11-28, outside DES-009 §3.2)', () => {
  it('every clip of the full list that the P1 file lacks has a stand-in the file has, or is dropped on purpose', () => {
    for (const c of FULL_CLIPS) {
      if (have.has(c.name)) { expect(STAND_INS[c.name], c.name).toBeUndefined(); continue; }
      const s = STAND_INS[c.name];
      expect(s === null || have.has(s as string), c.name).toBe(true);
    }
  });
  it('a clip the file has passes through untouched', () => {
    const p = plan({ upper: [{ clip: 'run', time: 0.1, weight: 1 }], lower: [{ clip: 'run', time: 0.1, weight: 1 }] });
    expect(standIn(p, have)).toEqual({ plan: p, used: [] });
  });
  it('a missing clip plays its stand-in at the same fraction of the clip, and is listed', () => {
    const r = standIn(plan({ upper: [{ clip: 'skill_resonant_knot', time: 12 / FPS, weight: 1 }] }), have);
    expect(r.plan.upper).toEqual([{ clip: 'attack_03', time: (12 / 24) * (18 / FPS), weight: 1 }]);
    expect(r.used).toEqual(['skill_resonant_knot']);
  });
  it('two poses that land on the same stand-in keep their weights (the group still sums to 1)', () => {
    const r = standIn(plan({ lower: [{ clip: 'idle', time: 0.5, weight: 0.4 }, { clip: 'ready', time: 0.5, weight: 0.6 }] }), have);
    expect(r.plan.lower.reduce((s, c) => s + c.weight, 0)).toBeCloseTo(1, 12);
    expect(r.plan.lower.every((c) => c.clip === 'idle')).toBe(true);
  });
  it('hit_add has no stand-in: it is dropped, not replaced', () => {
    const r = standIn(plan({ additive: [{ clip: 'hit_add', time: 0, weight: 1 }] }), have);
    expect(r.plan.additive).toEqual([]); expect(r.used).toEqual(['hit_add']);
  });
  it('with the full twenty clips nothing is replaced', () => {
    const all = new Set(FULL_CLIPS.map((c) => c.name));
    const p = plan({ upper: [{ clip: 'victory', time: 0.2, weight: 1 }], additive: [{ clip: 'hit_add', time: 0, weight: 1 }] });
    expect(standIn(p, all)).toEqual({ plan: p, used: [] });
  });
});
