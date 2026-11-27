// DES-008 damage numbers: the DOM-free core (timing, merge / caps / priority, placement against protected areas).
// Placement follows DES-008 v3 §6.2: four patterns (above, right, left, below), side lanes searched for free y intervals at spawn;
// inside a free interval [L, U] the spot keeps d = min(7.5·S, (U − L)/2) from both ends (step 5).
// Expected positions are worked out by hand from the §6.2 rules (numbers in the comments), never by asking the production code.
import { describe, it, expect } from 'vitest';
import {
  FloatBook, labelText, scaleAt, opacityAt, peakScale, pathPoints, bezier, lifeMs, localR, placeOrder, hits, CAPS,
  type FIn, type FKind, type Geo, type GlyphBox, type Rect, type Label, type FQuality, type Attempt,
} from '../src/ui/floatCore.ts';

// ---------------------------------------------------------------- a fake screen: 844x390, S = 1, actors as fixed body rects
function screen() {
  const actors = new Map<number, Rect | 1 | 2>();
  const prot: (Rect & { k?: string })[] = [];
  const geo: Geo = {
    S: 1, safe: { l: 0, t: 0, r: 844, b: 390 }, prot,
    actor(id, out) { const a = actors.get(id); if (a === undefined) return 1; if (a === 1 || a === 2) return a; Object.assign(out, a); return 0; },
    box(kind: FKind, text: string, count: number): GlyphBox | null { return { w: 14 * text.length + 8, h: 30, badgeW: count > 1 ? 40 : 0, badgeH: count > 1 ? 20 : 0, size: 32 }; },
  };
  return { geo, actors, prot };
}
/** a screen whose 'early' labels reserve exactly W x H: 'early' has peak 1 and a 6 px straight path, so R = (w+16) x (h+22) */
function exact(W: number, H: number) {
  const s = screen();
  s.geo.box = () => ({ w: W - 16, h: H - 22, badgeW: 0, badgeH: 0, size: 22 });
  return s;
}
/** a screen whose first 'damage' label (side sign +1, Medium) reserves exactly 100 x 103 (team A's boss fixture R):
 *  width = 1.14*w + 8+8 + 32 (path to the right), height = 1.14*h + 8+8 + 42 (path up) */
function bossScreen() {
  const s = screen();
  s.geo.box = () => ({ w: 52 / 1.14, h: 45 / 1.14, badgeW: 0, badgeH: 0, size: 32 });
  return s;
}
/** team A §13.3: boss body, HUD protected down to y 67 over its lanes, a warning from y 174 */
function bossFixture(hudBottom = 67) {
  const s = bossScreen();
  s.actors.set(7, { l: 330, r: 500, t: 60, b: 217 });
  s.prot.push(
    { l: 324, r: 506, t: 54, b: 223, k: 'body' },
    { l: 150, r: 700, t: 0, b: hudBottom, k: 'hud#boss' },
    { l: 150, r: 700, t: 174, b: 390, k: 'warn' },
  );
  return s;
}
/** body rects spread out along the lower half of the screen */
const body = (i: number): Rect => ({ l: 40 + i * 78, r: 70 + i * 78, t: 250, b: 320 });
/** a 100 px wide body: room for a second label beside the first (R covers the whole drift path, so narrow bodies fit one) */
const wide = (x: number): Rect => ({ l: x, r: x + 100, t: 250, b: 330 });
const hit = (actor: number, amount: number, order = 0, kind: FKind = 'damage'): FIn => ({ kind, actor, amount, dist: actor, order });
const word = (actor: number, kind: FKind = 'early'): FIn => ({ kind, actor, amount: 0, dist: 0, order: 0 });
const centre = (l: Label) => ({ x: (l.screen.l + l.screen.r) / 2, y: (l.screen.t + l.screen.b) / 2 });
const expectCentre = (l: Label, x: number, y: number) => { expect(centre(l).x).toBeCloseTo(x, 6); expect(centre(l).y).toBeCloseTo(y, 6); };
const overlap = (a: Rect, b: Rect) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
/** what the DOM layer does each frame: advance, re-check, paint every surviving label at its opacity */
function play(b: FloatBook, geo: Geo, ms: number, step = 16) {
  for (let t = 0; t < ms; t += step) {
    b.advance(step); b.frame(geo);
    for (const l of b.labels) b.notePaint(l, opacityAt(l.kind, b.clock - l.born, l.life, b.reduced));
  }
}

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
  it('try order: odd labels of a target above → right → left → below, even labels above → left → right → below', () => {
    expect(placeOrder(1)).toEqual(['above', 'right', 'left', 'below']);
    expect(placeOrder(2)).toEqual(['above', 'left', 'right', 'below']);
    expect(placeOrder(3)).toEqual(['above', 'right', 'left', 'below']);
  });
});

describe('DES-008 v2 §6.2 four patterns and the side free-interval search', () => {
  it('above the head: R centre at (body middle x, body top − 10·S − h/2), used as it is when clear', () => {
    const { geo, actors } = exact(100, 62); actors.set(1, { l: 400, r: 430, t: 200, b: 300 });
    const b = new FloatBook(); b.ingest([word(1)], geo);
    expect(b.labels[0].place).toBe('above');
    expectCentre(b.labels[0], 415, 200 - 10 - 31);
  });
  it('above blocked: the right lane at x = body right + 10 + w/2, at the middle of the body when that is free', () => {
    const { geo, actors, prot } = exact(100, 62); actors.set(1, { l: 400, r: 430, t: 200, b: 300 });
    prot.push({ l: 380, r: 435, t: 0, b: 199 }); // over the head only; the right lane starts at x 440
    const b = new FloatBook(); b.ingest([word(1)], geo);
    expect(b.labels[0].place).toBe('right');
    expectCentre(b.labels[0], 490, 250);
  });
  it('the above position is fixed: off the top edge it is skipped, never pushed down into the head', () => {
    const { geo, actors } = exact(100, 62); actors.set(1, { l: 400, r: 430, t: 60, b: 300 }); // above would put R top at −12
    const b = new FloatBook(); b.ingest([word(1)], geo);
    expect(b.labels[0].place).toBe('right');
    expectCentre(b.labels[0], 490, 180);
  });
  it('the 0.5·S margin applies at spawn: 0.3 px of clearance above is not enough, 0.5 px is', () => {
    for (const [clear, place] of [[0.3, 'right'], [0.5, 'above']] as const) {
      const { geo, actors, prot } = exact(100, 62); actors.set(1, { l: 400, r: 430, t: 200, b: 300 });
      prot.push({ l: 360, r: 439, t: 20, b: 128 - clear }); // R above is y 128..190
      const b = new FloatBook(); b.ingest([word(1)], geo);
      expect(b.labels[0].place).toBe(place);
    }
  });
  it('team A boss fixture: above fails, the free lane is 119..122 and v3 takes its middle 120.5 (not the 122 end), nothing covered', () => {
    const { geo, prot } = bossFixture();
    const b = new FloatBook(); b.ingest([hit(7, 28)], geo);
    expect(b.labels.length).toBe(1);
    const l = b.labels[0];
    expect(l.place).toBe('right');
    expect(l.screen.r - l.screen.l).toBeCloseTo(100, 6); expect(l.screen.b - l.screen.t).toBeCloseTo(103, 6);
    expect(centre(l).y).toBeGreaterThanOrEqual(119 - 1e-6); expect(centre(l).y).toBeLessThanOrEqual(122 + 1e-6);
    expectCentre(l, 560, 120.5);
    for (const p of prot) expect(overlap(l.screen, p)).toBeLessThan(1e-4);
    play(b, geo, 400);
    expect(b.labels.length).toBe(1); expectCentre(b.labels[0], 560, 120.5);
    expect(b.stats.readable).toBe(1);
  });
  it('the gap narrows to one point (HUD down to y 70) → still placed at 122; HUD to y 71 closes both lanes → dropped', () => {
    const one = bossFixture(70), b = new FloatBook();
    b.ingest([hit(7, 28)], one.geo);
    expect(b.labels.length).toBe(1); expectCentre(b.labels[0], 560, 122);
    const shut = bossFixture(71), c = new FloatBook();
    c.ingest([hit(7, 28)], shut.geo);
    expect(c.labels.length).toBe(0); expect(c.stats.dropPlace).toBe(1);
  });
  it('a lane cut into several free intervals: the inset candidate nearest the body middle wins', () => {
    const { geo, actors, prot } = exact(100, 62); actors.set(1, { l: 400, r: 430, t: 100, b: 300 }); // body middle 200
    // forbidden centre y for a strip [t, b] is (t − 31.5, b + 31.5): strips give (28.5, 101.5), (148.5, 221.5), (218.5, 291.5)
    prot.push({ l: 440, r: 540, t: 60, b: 70 }, { l: 440, r: 540, t: 180, b: 190 }, { l: 440, r: 540, t: 250, b: 260 });
    const b = new FloatBook(); b.ingest([word(1)], geo);
    expect(b.labels[0].place).toBe('right');
    expectCentre(b.labels[0], 490, 141); // 148.5 − 7.5
  });
  it('a narrow free interval close to the body middle beats a wide one farther away (no sampling at fixed fractions)', () => {
    const { geo, actors, prot } = exact(100, 62); actors.set(1, { l: 400, r: 430, t: 100, b: 300 });
    // above blocked by the first strip; forbidden (28.5, 101.5), (148.5, 219), (222, 300) → free 219..222 and 101.5..148.5
    prot.push({ l: 440, r: 540, t: 60, b: 70 }, { l: 440, r: 540, t: 180, b: 187.5 }, { l: 440, r: 540, t: 253.5, b: 268.5 });
    const b = new FloatBook(); b.ingest([word(1)], geo);
    expectCentre(b.labels[0], 490, 220.5); // narrower than 15: the middle
  });
  it('two free y at the same distance from the body middle: the smaller y wins', () => {
    const { geo, actors, prot } = exact(100, 62); actors.set(1, { l: 400, r: 430, t: 100, b: 300 });
    // forbidden (28.5, 101.5) and (148.5, 251.5): the inset candidates 141 and 259 are both 59 from 200
    prot.push({ l: 440, r: 540, t: 60, b: 70 }, { l: 440, r: 540, t: 180, b: 220 });
    const b = new FloatBook(); b.ingest([word(1)], geo);
    expectCentre(b.labels[0], 490, 141);
  });
  it('right lane full, left lane free → left, at x = body left − 10 − w/2', () => {
    const { geo, actors, prot } = exact(100, 62); actors.set(1, { l: 400, r: 430, t: 200, b: 300 });
    prot.push({ l: 360, r: 439, t: 0, b: 199 }, { l: 441, r: 560, t: 0, b: 390 });
    const b = new FloatBook(); b.ingest([word(1)], geo);
    expect(b.labels[0].place).toBe('left');
    expectCentre(b.labels[0], 400 - 60, 250);
  });
  it('near the right edge the right lane is skipped (x never clamped onto the body); off-screen targets get nothing', () => {
    const { geo, actors, prot } = exact(100, 62); actors.set(1, { l: 740, r: 780, t: 200, b: 300 }); actors.set(2, 2);
    prot.push({ l: 700, r: 844, t: 0, b: 199 }); // right lane would end at x 890 > 836
    const b = new FloatBook(); b.ingest([word(1)], geo); b.ingest([word(2)], geo);
    expect(b.labels.map((l) => l.actor)).toEqual([1]);
    expect(b.labels[0].place).toBe('left');
    expectCentre(b.labels[0], 680, 250);
    expect(b.stats.dropPlace).toBe(1);
  });
  it('below the body only when above and both lanes fail: centre (body middle x, body bottom + 10 + h/2)', () => {
    const { geo, actors, prot } = exact(100, 62); actors.set(1, { l: 400, r: 430, t: 200, b: 250 });
    prot.push({ l: 360, r: 470, t: 0, b: 199 }, { l: 250, r: 360, t: 0, b: 390 }, { l: 470, r: 600, t: 0, b: 390 });
    const b = new FloatBook(); b.ingest([word(1)], geo);
    expect(b.labels[0].place).toBe('below');
    expectCentre(b.labels[0], 415, 250 + 10 + 31);
  });
  it('closeness: a box so wide that a lane centre is > 128·S from the body skips both lanes', () => {
    const { geo, actors, prot } = exact(250, 62); actors.set(1, { l: 400, r: 430, t: 200, b: 250 }); // lane dx = 10 + 125 = 135
    prot.push({ l: 300, r: 540, t: 100, b: 199 }); // above
    const b = new FloatBook(); b.ingest([word(1)], geo);
    expect(b.labels[0].place).toBe('below');
  });
  it('closeness limits the lane height: free room farther than v = √(128² − dx²) from the body is not used', () => {
    const { geo, actors, prot } = exact(100, 62); actors.set(1, { l: 400, r: 430, t: 100, b: 150 });
    // dx 60 → v 113.07 → lane y ≤ 263.07; lanes forbidden down to y 290 − (free at 291.5+ is too far). Above and below blocked.
    prot.push({ l: 360, r: 439, t: 0, b: 99 }, { l: 441, r: 560, t: 0, b: 260 }, { l: 250, r: 389, t: 0, b: 260 }, { l: 390, r: 440, t: 160, b: 220 });
    const b = new FloatBook(); b.ingest([word(1)], geo);
    expect(b.labels.length).toBe(0); expect(b.stats.dropPlace).toBe(1);
  });
  it('every pattern blocked for a different reason → 10 of 10 dropped, nothing painted, nothing drawn over', () => {
    const { geo, actors, prot } = exact(100, 62); actors.set(1, { l: 760, r: 800, t: 40, b: 200 });
    // above: off the top (centre y −1) · right: off the right edge · left lane x 649.5..750.5: HUD column · below (780, 241): a warning
    prot.push({ l: 640, r: 725, t: 0, b: 390, k: 'hud' }, { l: 751, r: 844, t: 232, b: 250, k: 'warn' });
    const b = new FloatBook();
    for (let i = 0; i < 10; i++) { b.ingest([word(1)], geo); play(b, geo, 1400); }
    expect(b.stats.dropPlace).toBe(10); expect(b.stats.created).toBe(0); expect(b.stats.painted).toBe(0);
    expect(b.dropLog[0].why).toEqual(['above:edge', 'right:edge', 'left:full(hud)', 'below:prot:warn']);
  });
  it('drop reasons name each pattern and the kind of area that closed it', () => {
    const { geo, prot } = bossFixture(71);
    const b = new FloatBook(); b.ingest([hit(7, 28)], geo);
    expect(prot.length).toBe(3);
    const why = b.dropLog[0].why;
    expect(why[0]).toBe('above:edge');
    expect(why[1]).toMatch(/^right:full\(.*hud#boss.*warn.*\)$/);
    expect(why[2]).toMatch(/^left:full\(/);
    expect(why[3]).toMatch(/^below:/);
  });
});

describe('DES-008 v2 §6.2 after spawn: no re-search, no jumps, retired when unsafe', () => {
  const lane = () => {
    const s = exact(100, 62); s.actors.set(1, { l: 400, r: 430, t: 100, b: 300 });
    s.prot.push({ l: 440, r: 540, t: 60, b: 70 }, { l: 440, r: 540, t: 180, b: 220 }); // forbidden (28.5,101.5) (148.5,251.5)
    return s;
  };
  it('a side label keeps its side and its offset from the body middle: it does not move back when the lane opens', () => {
    const { geo, prot } = lane();
    const b = new FloatBook(); b.ingest([word(1)], geo); b.frame(geo);
    expectCentre(b.labels[0], 490, 141);
    prot.length = 0; b.advance(16); b.frame(geo);
    expectCentre(b.labels[0], 490, 141);
  });
  it('it follows the body: x stays beside the body edge, y = new body middle + the spawn offset', () => {
    const { geo, actors, prot } = lane();
    const b = new FloatBook(); b.ingest([word(1)], geo);
    prot.length = 0; actors.set(1, { l: 420, r: 450, t: 110, b: 310 });
    b.advance(16); b.frame(geo);
    expectCentre(b.labels[0], 510, 151); // offset −59 kept from the new middle 210
  });
  it('a warning that appears under a live side label retires it in that same frame, and it never comes back', () => {
    const { geo, prot } = lane();
    const b = new FloatBook(); b.ingest([word(1)], geo); play(b, geo, 48);
    const r = b.labels[0].screen;
    prot.push({ l: r.r - 3, r: r.r + 20, t: r.t + 4, b: r.t + 8, k: 'warn' });
    b.advance(16); b.frame(geo);
    expect(b.labels.length).toBe(0); expect(b.stats.retiredSafety).toBe(1); expect(b.stats.retireWhy['prot:warn']).toBe(1);
    prot.pop(); b.advance(16); b.frame(geo);
    expect(b.labels.length).toBe(0);
  });
  it('a merge widens R around the same start point (the words do not jump); if the wider R is unsafe it is retired', () => {
    const free = screen(); free.actors.set(1, wide(300));
    const b = new FloatBook(); b.ingest([hit(1, 12)], free.geo);
    const start = { x: b.labels[0].ax, y: b.labels[0].ay }, w0 = b.labels[0].screen.r - b.labels[0].screen.l;
    b.advance(50); b.ingest([hit(1, 9)], free.geo); b.frame(free.geo);
    expect(b.labels[0].count).toBe(2);
    expect({ x: b.labels[0].ax, y: b.labels[0].ay }).toEqual(start);
    expect(b.labels[0].screen.r - b.labels[0].screen.l).toBeGreaterThan(w0);
    const tight = screen(); tight.actors.set(1, wide(300));
    const c = new FloatBook(); c.ingest([hit(1, 12)], tight.geo);
    const R = c.labels[0].screen;
    tight.prot.push({ l: R.r + 1, r: R.r + 30, t: R.t, b: R.b, k: 'warn' }); // clear of R now, inside the badge's width later
    c.advance(50); c.ingest([hit(1, 9)], tight.geo); c.frame(tight.geo);
    expect(c.labels.length).toBe(0); expect(c.stats.retiredSafety).toBe(1);
  });
  it('when two live labels run into each other, the less important one gives way', () => {
    const { geo, actors } = exact(100, 62); actors.set(1, { l: 100, r: 130, t: 200, b: 300 }); actors.set(2, { l: 400, r: 430, t: 200, b: 300 });
    const b = new FloatBook(); b.ingest([word(1)], geo); b.advance(16); b.ingest([word(2, 'stagger')], geo); b.frame(geo);
    expect(b.labels.length).toBe(2);
    actors.set(2, { l: 110, r: 140, t: 200, b: 300 }); b.advance(16); b.frame(geo);
    expect(b.labels.map((l) => l.actor)).toEqual([1]);
  });
});

describe('DES-008 v3 §6.2 step 5: the spot inside a free interval keeps d = min(7.5·S, (U − L)/2) from both ends', () => {
  /** body x 400..430 with its middle at `mid`; R 100×62 (word): the right lane is x 490, a strip [t, b] forbids (t − 31.5, b + 31.5).
   *  `free` = the only free centre intervals left in the right lane: strips fill everything else from 0 to 390. */
  const lanes = (mid: number, free: [number, number][]) => {
    const s = exact(100, 62); s.actors.set(1, { l: 400, r: 430, t: mid - 40, b: mid + 40 });
    s.prot.push({ l: 250, r: 389, t: 0, b: 390 }); // left lane shut
    let from = -40;
    for (const [L, U] of free) { s.prot.push({ l: 441, r: 540, t: from + 31.5, b: L - 31.5 }); from = U; }
    s.prot.push({ l: 441, r: 540, t: from + 31.5, b: 460 });
    return s;
  };
  const place = (s: ReturnType<typeof lanes>) => { const b = new FloatBook(); b.ingest([word(1)], s.geo); expect(b.labels.length).toBe(1); expect(b.labels[0].place).toBe('right'); return b.labels[0]; };
  it('team A example: free 100..140, preferred y 90 → 107.5 (not the end 100)', () => { expectCentre(place(lanes(90, [[100, 140]])), 490, 107.5); });
  it('preferred y inside the interval but closer than 7.5 to an end is moved in to 7.5 from it', () => {
    expectCentre(place(lanes(138, [[100, 140]])), 490, 132.5);
    expectCentre(place(lanes(120, [[100, 140]])), 490, 120); // already ≥ 7.5 from both ends: unchanged
  });
  it('an interval narrower than 15: its middle', () => { expectCentre(place(lanes(100, [[120, 128]])), 490, 124); });
  it('intervals are compared by their inset candidates, not by their nearest raw point', () => {
    // middle 200: 180..199 ends 1 away but gives 191.5 (8.5 away); 202..204 gives 203 (3 away)
    expectCentre(place(lanes(200, [[180, 199], [202, 204]])), 490, 203);
  });
  it('the inset also applies where the interval ends at the safe view', () => {
    // body mostly above the screen: visible middle (0 + 80)/2 = 40; the lane starts at 8 + 31 + 0.5 = 39.5 → 47
    const s = exact(100, 62); s.actors.set(1, { l: 400, r: 430, t: -100, b: 80 });
    const b = new FloatBook(); b.ingest([word(1)], s.geo);
    expect(b.labels[0].place).toBe('right');
    expectCentre(b.labels[0], 490, 47);
  });
  it('the inset scales with S (S = 1.25 → 9.375)', () => {
    const s = exact(100, 62); s.geo.S = 1.25; s.actors.set(1, { l: 400, r: 430, t: 200, b: 300 });
    s.geo.box = () => ({ w: 80, h: 34.5, badgeW: 0, badgeH: 0, size: 22 }); // R = (80 + 20) × (34.5 + 20 + 7.5) = 100 × 62 at S 1.25
    // gap 12.5 → x 492.5; margin 0.625 → half height 31.625; above shut; a strip from y 251 forbids from 219.375 down
    s.prot.push({ l: 360, r: 439, t: 0, b: 199 }, { l: 441, r: 600, t: 251, b: 390 });
    const b = new FloatBook(); b.ingest([word(1)], s.geo);
    expect(b.labels[0].place).toBe('right');
    expectCentre(b.labels[0], 492.5, 210);
  });
});

describe('DES-008 v3 R3-1: with a wide free band, an area closing in by 3·S within 180 ms does not take the number away', () => {
  for (const q of ['medium', 'low'] as FQuality[]) {
    it(`${q}: 10 of 10 readable while the blocker moves 3 px toward the label, never any shared area`, () => {
      let readable = 0;
      for (let i = 0; i < 10; i++) {
        // right lane free from the safe edge down to a strip that starts at y 236 (even i), or from the strip's end y 264 down (odd i);
        // either way the body middle 250 is within the band's inset, so the spot sits on the side of the strip that then moves
        const s = exact(100, 62); s.actors.set(1, { l: 400, r: 430, t: 200, b: 300 });
        const above = { l: 360, r: 439, t: 0, b: 199 }, left = { l: 250, r: 389, t: 0, b: 390 };
        const strip: Rect = i % 2 === 0 ? { l: 441, r: 540, t: 240, b: 390 } : { l: 441, r: 540, t: 0, b: 260 };
        s.prot.push(above, left, strip);
        const b = new FloatBook(); b.q = q;
        b.ingest([word(1)], s.geo);
        expect(b.labels.length).toBe(1);
        const edge = { t: strip.t, b: strip.b };
        for (let t = 16; t <= 640; t += 16) {
          const move = 3 * Math.min(1, t / 180);
          if (i % 2 === 0) strip.t = edge.t - move; else strip.b = edge.b + move;
          b.advance(16); b.frame(s.geo);
          expect(b.labels.length).toBe(1);
          for (const p of s.prot) expect(overlap(b.labels[0].screen, p)).toBe(0);
          b.notePaint(b.labels[0], opacityAt('early', b.clock - b.labels[0].born, b.labels[0].life, false));
        }
        expect(b.stats.retiredSafety).toBe(0);
        readable += b.stats.readable;
      }
      expect(readable).toBe(10);
    });
  }
  it('a warning that jumps onto the label still retires it in that frame, readable or not', () => {
    const s = exact(100, 62); s.actors.set(1, { l: 400, r: 430, t: 200, b: 300 });
    s.prot.push({ l: 360, r: 439, t: 0, b: 199 }, { l: 441, r: 540, t: 240, b: 390 });
    const b = new FloatBook(); b.ingest([word(1)], s.geo);
    b.advance(16); b.frame(s.geo); b.notePaint(b.labels[0], 1);
    const r = b.labels[0].screen;
    s.prot.push({ l: r.l, r: r.r, t: r.b - 1, b: r.b + 40, k: 'warn' });
    b.advance(16); b.frame(s.geo);
    expect(b.labels.length).toBe(0); expect(b.stats).toMatchObject({ retiredSafety: 1, safetyUnread: 1 });
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
  it('an event time earlier than the clock (placement happens when the frame is drawn) counts for the merge window and the age', () => {
    const { geo, actors } = screen(); actors.set(1, wide(300));
    const b = new FloatBook();
    b.ingest([hit(1, 12)], geo);
    b.advance(140); b.ingest([hit(1, 9)], geo, 110); // the hit happened at 110 ms, drawn at 140 ms
    expect(b.labels.length).toBe(1); expect(b.labels[0].total).toBe(21);
    const c = new FloatBook(); c.advance(500); c.ingest([hit(1, 5)], geo, 484);
    expect(c.labels[0].born).toBe(484);
  });
  it('status words: one per target and kind within 180 ms', () => {
    const { geo, actors } = screen(); actors.set(1, body(2));
    const b = new FloatBook();
    b.ingest([word(1, 'stagger')], geo);
    b.advance(150); b.ingest([word(1, 'stagger')], geo);
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
  it('a more important label replaces the oldest less important one only 180 ms after its first real paint (§5.2 v3)', () => {
    const { geo, actors } = screen(); actors.set(1, body(5));
    const b = new FloatBook(); b.q = 'low'; // 1 number per target
    b.ingest([hit(1, 5)], geo);
    b.advance(200); b.ingest([hit(1, 30, 0, 'bonus')], geo);
    expect(b.labels.map((l) => l.kind)).toEqual(['damage']); expect(b.stats.dropCap).toBe(1); // never painted: its age does not count
    b.notePaint(b.labels[0], 0); // an invisible frame is not a paint
    b.notePaint(b.labels[0], 1); // first paint at 200 ms
    b.advance(100); b.ingest([hit(1, 30, 0, 'bonus')], geo);
    expect(b.stats.dropCap).toBe(2); // shown for 100 ms only
    b.advance(80); b.ingest([hit(1, 30, 0, 'bonus')], geo);
    expect(b.labels.map((l) => l.kind)).toEqual(['bonus']); expect(b.stats.replaced).toBe(1);
  });
  it('one tick is handled in importance order: hurt before bonus before damage', () => {
    const { geo, actors } = screen(); actors.set(0, body(0)); actors.set(1, wide(400));
    const b = new FloatBook();
    b.ingest([hit(1, 5, 0), hit(1, 9, 1, 'bonus'), hit(0, 4, 2, 'hurt')], geo);
    expect(b.labels.map((l) => l.kind)).toEqual(['hurt', 'bonus', 'damage']);
  });
  it('labels of one target alternate their drift side (right first); the even one tries the left lane before the right', () => {
    const { geo, actors } = screen(); actors.set(1, wide(300));
    const b = new FloatBook();
    b.ingest([hit(1, 5)], geo); b.advance(200); b.ingest([hit(1, 6)], geo);
    expect(b.labels.map((l) => l.s)).toEqual([1, -1]);
    expect(b.labels.map((l) => l.place)).toEqual(['above', 'left']);
  });
  it('a second number of a narrow target fits a lane when there really is room (just below the first one)', () => {
    const { geo, actors } = screen(); actors.set(1, body(5)); // x 430..460, y 250..320
    const b = new FloatBook();
    b.ingest([hit(1, 5)], geo); b.advance(200); b.ingest([hit(1, 6)], geo);
    expect(b.labels.map((l) => l.place)).toEqual(['above', 'left']);
    const [first, second] = b.labels;
    expect(second.screen.t).toBeCloseTo(first.screen.b + 6 + 0.5 + 7.5, 6); // 6·S gap + 0.5·S margin + 7.5·S inset (room allows it)
    expect(overlap({ l: first.screen.l - 6, t: first.screen.t - 6, r: first.screen.r + 6, b: first.screen.b + 6 }, second.screen)).toBeLessThan(1e-4);
  });
});

describe('DES-008 §6 never over a warning, a body or the HUD', () => {
  it('a protected area over the head pushes the label to a side lane; nowhere left = no label', () => {
    const { geo, actors, prot } = screen(); actors.set(1, body(5));
    prot.push({ l: 425, r: 465, t: 100, b: 245 }); // over the head (body 5 is x 430..460)
    const b = new FloatBook();
    b.ingest([hit(1, 12)], geo);
    expect(b.labels.length).toBe(1);
    expect(b.labels[0].place).toBe('right');
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
      expect(r.l >= 8 - 1e-6 && r.t >= 8 - 1e-6 && r.r <= 836 + 1e-6 && r.b <= 382 + 1e-6).toBe(true);
      for (let j = i + 1; j < L.length; j++) expect(overlap({ l: r.l - 6, t: r.t - 6, r: r.r + 6, b: r.b + 6 }, L[j].screen)).toBeLessThan(1e-4);
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
      for (let t = 0; t < 60; t++) { b.ingest([hit(t % 6, 3 + (t % 5), 0), ...(t % 7 === 0 ? [hit(0, 9, 1, 'hurt')] : [])], geo); b.advance(33); b.frame(geo); trace.push(b.labels.map((l) => `${l.uid}:${l.place}:${l.total}`).join(',')); }
      b.advance(2000); b.frame(geo);
      return { trace, left: b.labels.length, stats: b.stats };
    };
    const a = run(), c = run();
    expect(a).toEqual(c);
    expect(a.left).toBe(0);
    expect(a.stats.retiredLife).toBeGreaterThan(0);
  });
});

describe('DES-008 §10.3 counters: created, painted and readable (opacity ≥ 0.8 for ≥ 180 ms) are different things', () => {
  const one = () => { const s = screen(); s.actors.set(1, wide(300)); return s; };
  it('a label retired before it was ever painted counts as created, not painted', () => {
    const { geo, prot } = one();
    const b = new FloatBook(); b.ingest([hit(1, 12)], geo);
    prot.push({ l: 0, r: 844, t: 0, b: 390, k: 'warn' }); b.advance(16); b.frame(geo);
    expect(b.stats).toMatchObject({ created: 1, painted: 0, readable: 0, retiredSafety: 1, retiredUnpainted: 1 });
  });
  it('painted once but faint is not readable; readable needs 180 ms at opacity ≥ 0.8', () => {
    const { geo } = one();
    const b = new FloatBook(); b.ingest([hit(1, 12)], geo);
    b.advance(16); b.frame(geo); b.notePaint(b.labels[0], 0.4);
    expect(b.stats).toMatchObject({ painted: 1, readable: 0 });
    for (let i = 0; i < 11; i++) { b.advance(16); b.frame(geo); b.notePaint(b.labels[0], 1); }
    expect(b.stats.readable).toBe(0); // 10 steps × 16 ms = 160 ms since the first ≥ 0.8 frame
    b.advance(32); b.frame(geo); b.notePaint(b.labels[0], 1);
    expect(b.stats).toMatchObject({ painted: 1, readable: 1 });
  });
  it('a frame without paint, or a faint frame, restarts the 180 ms', () => {
    const { geo } = one();
    const b = new FloatBook(); b.ingest([hit(1, 12)], geo);
    for (let i = 0; i < 8; i++) { b.advance(20); b.frame(geo); b.notePaint(b.labels[0], 1); } // 140 ms
    b.advance(20); b.frame(geo); // not painted
    for (let i = 0; i < 8; i++) { b.advance(20); b.frame(geo); b.notePaint(b.labels[0], 1); }
    expect(b.stats.readable).toBe(0);
    b.advance(20); b.frame(geo); b.notePaint(b.labels[0], 0.7);
    for (let i = 0; i < 8; i++) { b.advance(20); b.frame(geo); b.notePaint(b.labels[0], 1); }
    expect(b.stats.readable).toBe(0);
  });
  it('every created label is accounted for exactly once, per kind as well', () => {
    const { geo, actors, prot } = screen(); for (let i = 0; i < 6; i++) actors.set(i, body(i));
    const b = new FloatBook();
    for (let t = 0; t < 80; t++) {
      b.ingest([hit(t % 6, 3 + (t % 5)), ...(t % 9 === 0 ? [hit((t + 3) % 6, 11, 1, 'bonus')] : [])], geo);
      if (t % 13 === 0) prot.push({ l: 0, r: 844, t: 150, b: 200, k: 'warn' });
      if (t % 13 === 3) prot.length = 0;
      play(b, geo, 48);
      if (t === 40) b.clear();
    }
    const s = b.stats;
    expect(s.created).toBe(b.labels.length + s.retiredLife + s.retiredSafety + s.replaced + s.cleared);
    expect(s.readable).toBeLessThanOrEqual(s.painted); expect(s.painted).toBeLessThanOrEqual(s.created);
    const sum = (k: 'created' | 'painted' | 'readable' | 'dropPlace' | 'dropCap' | 'retiredSafety') => Object.values(s.byKind).reduce((n, v) => n + (v?.[k] ?? 0), 0);
    for (const k of ['created', 'painted', 'readable', 'dropPlace', 'dropCap', 'retiredSafety'] as const) expect(sum(k)).toBe(s[k]);
  });
  it('each placement attempt can be recorded with its geometry, for a checker that does not use this code', () => {
    const { geo, prot } = bossFixture(); const log: Attempt[] = [];
    const b = new FloatBook(); b.onAttempt = (a) => log.push(a);
    b.ingest([hit(7, 28)], geo);
    expect(log.length).toBe(1);
    expect(log[0]).toMatchObject({ kind: 'damage', actor: 7, S: 1, result: 'right', a: { l: 330, r: 500, t: 60, b: 217 } });
    expect(log[0].w).toBeCloseTo(100, 6); expect(log[0].h).toBeCloseTo(103, 6);
    expect(log[0].blocks.length).toBe(prot.length);
  });
});

describe('DES-008 §10.3 controlled sets: areas that do not change, R at full size, Medium and Low', () => {
  for (const q of ['medium', 'low'] as FQuality[]) {
    it(`${q}: open scene, 10 groups one after another → 10 of 10 readable`, () => {
      const { geo, actors } = screen(); actors.set(1, { l: 400, r: 440, t: 220, b: 300 }); // clear sky above the head
      const b = new FloatBook(); b.q = q;
      for (let i = 0; i < 10; i++) { b.ingest([hit(1, 12 + i)], geo); play(b, geo, 900); }
      expect(b.stats.readable).toBe(10); expect(b.stats.retiredSafety).toBe(0);
    });
    it(`${q}: boss with side room (head at y 60, above fails) → 10 of 10 readable`, () => {
      const { geo } = bossFixture();
      const b = new FloatBook(); b.q = q;
      for (let i = 0; i < 10; i++) { b.ingest([hit(7, 28)], geo); play(b, geo, 900); }
      expect(b.stats.readable).toBe(10); expect(b.stats.retiredSafety).toBe(0);
    });
    it(`${q}: 3 enemies around the player, left lane of the leftmost one empty → ≥ 1 readable in each of 10 batches`, () => {
      const { geo, actors, prot } = screen();
      const bodies: Rect[] = [{ l: 400, r: 500, t: 200, b: 320 }, { l: 360, r: 390, t: 220, b: 280 }, { l: 510, r: 535, t: 210, b: 270 }, { l: 450, r: 475, t: 150, b: 195 }];
      bodies.forEach((a, i) => { actors.set(i, a); prot.push({ l: a.l - 6, r: a.r + 6, t: a.t - 6, b: a.b + 6, k: 'body' }); });
      prot.push({ l: 300, r: 460, t: 290, b: 390, k: 'warn' });
      const b = new FloatBook(); b.q = q;
      for (let i = 0; i < 10; i++) {
        const before = b.stats.readable;
        b.ingest([hit(1, 5, 0), hit(2, 6, 1), hit(3, 7, 2)], geo); play(b, geo, 900);
        expect(b.stats.readable - before).toBeGreaterThanOrEqual(1);
      }
      expect(b.stats.retiredSafety).toBe(0);
    });
  }
});
