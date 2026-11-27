// DES-008 damage numbers: the DOM-free core (timing, merge / caps / priority, placement against protected areas).
import { describe, it, expect } from 'vitest';
import {
  FloatBook, labelText, scaleAt, opacityAt, peakScale, pathPoints, bezier, lifeMs, localR, slotCentre, slotOrder, hits, CAPS,
  type FIn, type FKind, type Geo, type GlyphBox, type Rect,
} from '../src/ui/floatCore.ts';

// ---------------------------------------------------------------- a fake screen: 844x390, S = 1, actors as fixed body rects
function screen() {
  const actors = new Map<number, Rect | 1 | 2>();
  const prot: Rect[] = [];
  const geo: Geo = {
    S: 1, safe: { l: 0, t: 0, r: 844, b: 390 }, prot,
    actor(id, out) { const a = actors.get(id); if (a === undefined) return 1; if (a === 1 || a === 2) return a; Object.assign(out, a); return 0; },
    box(kind: FKind, text: string, count: number): GlyphBox { return { w: 14 * text.length + 8, h: 30, badgeW: count > 1 ? 40 : 0, badgeH: count > 1 ? 20 : 0, size: 32 }; },
  };
  return { geo, actors, prot };
}
/** body rects spread out along the lower half of the screen */
const body = (i: number): Rect => ({ l: 40 + i * 78, r: 70 + i * 78, t: 250, b: 320 });
/** a 100 px wide body: room for a second label beside the first (R covers the whole drift path, so narrow bodies fit one) */
const wide = (x: number): Rect => ({ l: x, r: x + 100, t: 250, b: 330 });
const hit = (actor: number, amount: number, order = 0, kind: FKind = 'damage'): FIn => ({ kind, actor, amount, dist: actor, order });

describe('DES-008 §2 text', () => {
  it('uses U+2212 for damage taken and + for heals; plain number for hits', () => {
    expect(labelText('hurt', 18)).toBe('−18');
    expect(labelText('heal', 45)).toBe('+45');
    expect(labelText('damage', 12)).toBe('12');
    expect(labelText('bonus', 28)).toBe('28');
    expect(labelText('stagger', 0)).toBe('เสียหลัก');
    expect(labelText('early', 0)).toBe('หลบเร็วไป');
  });
});

describe('DES-008 §4 timing curves', () => {
  it('scale keys: damage 0.72 → 1.14 at 80 ms → 1.00 at 150 ms; bonus peaks 1.18 at 90; hurt 1.10 at 70', () => {
    expect(scaleAt('damage', 0, 'medium', false)).toBeCloseTo(0.72, 6);
    expect(scaleAt('damage', 80, 'medium', false)).toBeCloseTo(1.14, 6);
    expect(scaleAt('damage', 150, 'medium', false)).toBeCloseTo(1, 6);
    expect(scaleAt('damage', 400, 'medium', false)).toBe(1);
    expect(scaleAt('bonus', 90, 'medium', false)).toBeCloseTo(1.18, 6);
    expect(scaleAt('hurt', 70, 'medium', false)).toBeCloseTo(1.1, 6);
    expect(scaleAt('early', 50, 'medium', false)).toBe(1);
  });
  it('Low caps every peak at 1.10 (same key times); reduced motion = no scale', () => {
    expect(scaleAt('bonus', 90, 'low', false)).toBeCloseTo(1.1, 6);
    expect(peakScale('damage', 'low', false)).toBeCloseTo(1.1, 6);
    for (let t = 0; t <= 200; t += 10) expect(scaleAt('bonus', t, 'low', false)).toBeLessThanOrEqual(1.1 + 1e-9);
    expect(scaleAt('damage', 80, 'medium', true)).toBe(1);
  });
  it('opacity: in over 40 ms, full to 70 % of life (early 85 %), linear out to 0', () => {
    const L = 650;
    expect(opacityAt('damage', 0, L, false)).toBe(0);
    expect(opacityAt('damage', 20, L, false)).toBeCloseTo(0.5, 6);
    expect(opacityAt('damage', 40, L, false)).toBe(1);
    expect(opacityAt('damage', 0.7 * L, L, false)).toBe(1);
    expect(opacityAt('damage', 0.85 * L, L, false)).toBeCloseTo(0.5, 6);
    expect(opacityAt('damage', L, L, false)).toBe(0);
    expect(opacityAt('early', 0.8 * 1300, 1300, false)).toBe(1);
    expect(opacityAt('damage', 0.75 * L, L, true)).toBe(1); // reduced: fade only in the last 20 %
  });
  it('lives (ms): Medium / Low / reduced', () => {
    expect([lifeMs('damage', 'medium', false), lifeMs('bonus', 'medium', false), lifeMs('hurt', 'medium', false), lifeMs('heal', 'medium', false)]).toEqual([650, 850, 800, 750]);
    expect([lifeMs('damage', 'low', false), lifeMs('bonus', 'low', false), lifeMs('hurt', 'low', false), lifeMs('heal', 'low', false)]).toEqual([600, 750, 750, 700]);
    expect([lifeMs('damage', 'low', true), lifeMs('bonus', 'medium', true), lifeMs('heal', 'medium', true), lifeMs('early', 'low', true)]).toEqual([600, 750, 600, 1300]);
  });
  it('path: side sign flips x, Low shortens number paths to 0.75x, reduced motion has no path; Bezier starts at P0 and ends at P3', () => {
    expect(pathPoints('damage', 1, 1, 'medium', false)).toEqual([0, 0, 18, -30, 28, -42, 32, -20]);
    expect(pathPoints('damage', -1, 1, 'medium', false)).toEqual([-0, 0, -18, -30, -28, -42, -32, -20]);
    expect(pathPoints('damage', 1, 1, 'low', false)).toEqual([0, 0, 13.5, -22.5, 21, -31.5, 24, -15]);
    expect(pathPoints('perfect', 1, 1, 'low', false)).toEqual([0, 0, 0, -6, 0, -12, 0, -14]);
    expect(pathPoints('bonus', 1, 1, 'medium', true).every((v) => v === 0)).toBe(true);
    const p = pathPoints('bonus', 1, 1.2, 'medium', false), o = { x: 0, y: 0 };
    expect(bezier(p, 0, o)).toEqual({ x: 0, y: 0 });
    bezier(p, 1, o); expect(o.x).toBeCloseTo(38 * 1.2, 6); expect(o.y).toBeCloseTo(-30 * 1.2, 6);
  });
});

describe('DES-008 §6 geometry', () => {
  it('R holds the glyph at peak scale + badge + 8·S padding, swept over the path hull', () => {
    const box: GlyphBox = { w: 40, h: 30, badgeW: 0, badgeH: 0, size: 32 };
    const r = localR(box, 1.14, pathPoints('damage', 1, 1, 'medium', false), false, 1);
    expect(r.l).toBeCloseTo(-22.8 - 8, 6); expect(r.r).toBeCloseTo(22.8 + 8 + 32, 6);
    expect(r.t).toBeCloseTo(-17.1 - 8 - 42, 6); expect(r.b).toBeCloseTo(17.1 + 8, 6);
    const withBadge = localR({ ...box, badgeW: 40, badgeH: 20 }, 1, pathPoints('perfect', 1, 1, 'medium', false), false, 1);
    expect(withBadge.r).toBeCloseTo(20 + 5 + 40 + 8, 6);
    // every point on the curve stays inside R (the hull contains the Bezier)
    const p = pathPoints('bonus', -1, 1, 'medium', false), R = localR(box, 1.18, p, true, 1), o = { x: 0, y: 0 };
    for (let u = 0; u <= 1; u += 0.05) { bezier(p, u, o); expect(o.x - 20 >= R.l && o.x + 20 <= R.r && o.y - 15 >= R.t && o.y + 15 <= R.b).toBe(true); }
  });
  it('slots: above the head, then right / left, then the same one row higher; even labels swap right and left', () => {
    const a: Rect = { l: 100, r: 140, t: 200, b: 300 }, o = { x: 0, y: 0 };
    expect(slotCentre(0, a, 60, 40, 1, o)).toEqual({ x: 120, y: 200 - 10 - 20 });
    expect(slotCentre(1, a, 60, 40, 1, o)).toEqual({ x: 140 + 10 + 30, y: 190 });
    expect(slotCentre(2, a, 60, 40, 1, o)).toEqual({ x: 100 - 10 - 30, y: 190 });
    expect(slotCentre(3, a, 60, 40, 1, o)).toEqual({ x: 120, y: 170 - 46 });
    expect(slotOrder(1)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(slotOrder(2)).toEqual([0, 2, 1, 3, 5, 4]);
  });
});

describe('DES-008 §5 merge, caps and priority', () => {
  it('hits on one target within 120 ms merge into one label (sum + count); later ones start a new label', () => {
    const { geo, actors } = screen(); actors.set(1, wide(300));
    const b = new FloatBook();
    b.ingest([hit(1, 12)], geo);
    b.advance(100); b.ingest([hit(1, 9)], geo);
    expect(b.labels.length).toBe(1);
    expect(b.labels[0]).toMatchObject({ total: 21, count: 2, text: '21' });
    b.advance(30); b.ingest([hit(1, 5)], geo); // 130 ms after the group's first event
    expect(b.labels.length).toBe(2);
    expect(b.stats.merged).toBe(1);
  });
  it('Low merges within 160 ms; damage and bonus, or two targets, never merge', () => {
    const { geo, actors } = screen(); actors.set(1, wide(100)); actors.set(2, wide(600));
    const b = new FloatBook(); b.q = 'low';
    b.ingest([hit(1, 3)], geo); b.advance(150); b.ingest([hit(1, 4)], geo);
    expect(b.labels.length).toBe(1);
    const m = new FloatBook();
    m.ingest([hit(1, 3), hit(1, 7, 1, 'bonus'), hit(2, 4, 2)], geo);
    expect(m.labels.map((l) => `${l.actor}:${l.kind}:${l.total}`).sort()).toEqual(['1:bonus:7', '1:damage:3', '2:damage:4']);
  });
  it('status words: one per target and kind within 180 ms', () => {
    const { geo, actors } = screen(); actors.set(1, body(2));
    const b = new FloatBook();
    b.ingest([{ kind: 'stagger', actor: 1, amount: 0, dist: 0, order: 0 }], geo);
    b.advance(150); b.ingest([{ kind: 'stagger', actor: 1, amount: 0, dist: 0, order: 0 }], geo);
    expect(b.labels.length).toBe(1); expect(b.stats.deduped).toBe(1);
  });
  it('zero makes no label; negative / fractional / non-finite amounts are reported, never shown or "fixed"', () => {
    const { geo, actors } = screen(); actors.set(1, body(1));
    const b = new FloatBook();
    b.ingest([hit(1, 0), hit(1, -3, 1), hit(1, 1.5, 2), hit(1, NaN, 3), hit(1, Infinity, 4)], geo);
    expect(b.labels.length).toBe(0); expect(b.stats.invalid).toBe(4);
  });
  it('caps: Medium ≤ 8 numbers, Low ≤ 6; never more than the per-target cap', () => {
    for (const q of ['medium', 'low'] as const) {
      const { geo, actors } = screen(); for (let i = 0; i < 10; i++) actors.set(i, body(i));
      const b = new FloatBook(); b.q = q;
      b.ingest(Array.from({ length: 10 }, (_, i) => hit(i, 10 + i, i)), geo);
      expect(b.labels.length).toBeLessThanOrEqual(CAPS[q].num);
      expect(b.labels.length + b.stats.dropCap + b.stats.dropPlace).toBe(10);
    }
    const { geo, actors } = screen(); actors.set(1, wide(300));
    const b = new FloatBook();
    b.ingest([hit(1, 5)], geo); b.advance(200); b.ingest([hit(1, 6)], geo); b.advance(200); b.ingest([hit(1, 7)], geo);
    expect(b.labels.filter((l) => l.actor === 1).length).toBe(2); // 2 numbers per target (Medium); same importance never replaces
    expect(b.stats.dropCap).toBe(1);
  });
  it('a more important label replaces the oldest less important one only after it was readable for 180 ms', () => {
    const { geo, actors } = screen(); actors.set(1, body(5));
    const b = new FloatBook(); b.q = 'low'; // 1 number per target
    b.ingest([hit(1, 5)], geo);
    b.advance(100); b.ingest([hit(1, 30, 0, 'bonus')], geo);
    expect(b.labels.map((l) => l.kind)).toEqual(['damage']); expect(b.stats.dropCap).toBe(1); // too young to replace
    b.advance(100); b.ingest([hit(1, 30, 0, 'bonus')], geo);
    expect(b.labels.map((l) => l.kind)).toEqual(['bonus']); expect(b.stats.replaced).toBe(1);
  });
  it('one tick is handled in importance order: hurt before bonus before damage', () => {
    const { geo, actors } = screen(); actors.set(0, body(0)); actors.set(1, wide(400));
    const b = new FloatBook();
    b.ingest([hit(1, 5, 0), hit(1, 9, 1, 'bonus'), hit(0, 4, 2, 'hurt')], geo);
    expect(b.labels.map((l) => l.kind)).toEqual(['hurt', 'bonus', 'damage']);
  });
  it('labels of one target alternate their drift side (right first)', () => {
    const { geo, actors } = screen(); actors.set(1, wide(300));
    const b = new FloatBook();
    b.ingest([hit(1, 5)], geo); b.advance(200); b.ingest([hit(1, 6)], geo);
    expect(b.labels.map((l) => l.s)).toEqual([1, -1]);
    expect(b.labels.map((l) => l.slot)).toEqual([0, 2]); // the second one tries left before right
  });
  it('on a narrow body (30 px) a second label of the same target has no free slot and is dropped (reported to team A)', () => {
    const { geo, actors } = screen(); actors.set(1, body(5));
    const b = new FloatBook();
    b.ingest([hit(1, 5)], geo); b.advance(200); b.ingest([hit(1, 6)], geo);
    expect(b.labels.length).toBe(1); expect(b.stats.dropPlace).toBe(1);
  });
});

describe('DES-008 §6 never over a warning, a body or the HUD', () => {
  it('a protected area over the head pushes the label to a side slot; nowhere left = no label', () => {
    const { geo, actors, prot } = screen(); actors.set(1, body(5));
    prot.push({ l: 425, r: 465, t: 100, b: 245 }); // over the head (body 5 is x 430..460)
    const b = new FloatBook();
    b.ingest([hit(1, 12)], geo);
    expect(b.labels.length).toBe(1);
    expect(b.labels[0].slot).not.toBe(0);
    for (const p of prot) expect(hits(b.labels[0].screen, p)).toBe(false);
    prot.push({ l: 0, r: 844, t: 0, b: 390 });
    b.advance(200); b.ingest([hit(1, 3, 0, 'bonus')], geo);
    expect(b.labels.length).toBe(1); expect(b.stats.dropPlace).toBe(1);
  });
  it('a warning that appears under a live label retires it at once and it never comes back', () => {
    const { geo, actors, prot } = screen(); actors.set(1, body(5));
    const b = new FloatBook();
    b.ingest([hit(1, 12)], geo); b.frame(geo);
    expect(b.labels.length).toBe(1);
    const r = b.labels[0].screen;
    prot.push({ l: r.l + 5, r: r.l + 15, t: r.t + 5, b: r.t + 15 });
    b.advance(16); b.frame(geo);
    expect(b.labels.length).toBe(0); expect(b.stats.retiredSafety).toBe(1);
    prot.length = 0; b.advance(16); b.frame(geo);
    expect(b.labels.length).toBe(0);
  });
  it('labels never overlap each other (6·S gap) and stay ≥ 8·S inside the safe view', () => {
    const { geo, actors } = screen(); for (let i = 0; i < 4; i++) actors.set(i, body(3 + i * 0.6));
    const b = new FloatBook();
    b.ingest([0, 1, 2, 3].flatMap((i) => [hit(i, 10 + i, i), hit(i, 50, 10 + i, 'bonus')]), geo); b.frame(geo);
    const L = b.labels;
    expect(L.length).toBeGreaterThan(0);
    for (let i = 0; i < L.length; i++) {
      const r = L[i].screen;
      expect(r.l >= 8 && r.t >= 8 && r.r <= 836 && r.b <= 382).toBe(true);
      for (let j = i + 1; j < L.length; j++) expect(hits({ l: r.l - 6, t: r.t - 6, r: r.r + 6, b: r.b + 6 }, L[j].screen)).toBe(false);
    }
  });
  it('off-screen targets get no label; a target that is no longer drawn keeps its label at the last spot', () => {
    const { geo, actors } = screen(); actors.set(1, 2); actors.set(2, body(5));
    const b = new FloatBook();
    b.ingest([hit(1, 12)], geo); expect(b.labels.length).toBe(0);
    b.ingest([hit(2, 12)], geo); b.frame(geo);
    const before = { ...b.labels[0].screen };
    actors.set(2, 1); b.advance(16); b.frame(geo);
    expect(b.labels.length).toBe(1); expect(b.labels[0].screen).toEqual(before);
  });
  it('labels end after their life and the book is deterministic', () => {
    const run = () => {
      const { geo, actors } = screen(); for (let i = 0; i < 6; i++) actors.set(i, body(i));
      const b = new FloatBook(); const trace: string[] = [];
      for (let t = 0; t < 60; t++) { b.ingest([hit(t % 6, 3 + (t % 5), 0), ...(t % 7 === 0 ? [hit(0, 9, 1, 'hurt')] : [])], geo); b.advance(33); b.frame(geo); trace.push(b.labels.map((l) => `${l.uid}:${l.slot}:${l.total}`).join(',')); }
      b.advance(2000); b.frame(geo);
      return { trace, left: b.labels.length, stats: b.stats };
    };
    const a = run(), c = run();
    expect(a).toEqual(c);
    expect(a.left).toBe(0);
    expect(a.stats.retiredLife).toBeGreaterThan(0);
  });
});
