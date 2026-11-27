// DES-008 v2 §6.2 checker, written from the design text only (it imports nothing from src/): for the geometry of one placement attempt
// (actor rect a, protected areas + live labels already grown by their margins, safe view, S, R size) it brute-forces every candidate
// on a 0.05 px grid and says whether a legal spot existed, and whether the accepted R is legal and is the one §6.2 picks.
const G = 10, EDGE = 8, EPS = 0.5, NEAR = 128, TOL = 1e-4, STEP = 0.05;
const ORDER = { odd: ['above', 'right', 'left', 'below'], even: ['above', 'left', 'right', 'below'] };

/** may R (w x h, centre cx cy) be placed at spawn? every rule of §6.2 including the 0.5·S margin */
export function legal(cx, cy, w, h, { S, safe, a, blocks }) {
  const l = cx - w / 2 - EPS * S, r = cx + w / 2 + EPS * S, t = cy - h / 2 - EPS * S, b = cy + h / 2 + EPS * S, m = EDGE * S;
  if (l < safe.l + m - TOL || r > safe.r - m + TOL || t < safe.t + m - TOL || b > safe.b - m + TOL) return false;
  const dx = Math.max(a.l - cx, 0, cx - a.r), dy = Math.max(a.t - cy, 0, cy - a.b);
  if (Math.hypot(dx, dy) > NEAR * S + TOL) return false;
  for (const p of blocks) if (Math.min(r, p.r) - Math.max(l, p.l) > TOL && Math.min(b, p.b) - Math.max(t, p.t) > TOL) return false;
  return true;
}
export const preferredY = ({ a, safe }) => (Math.max(a.t, safe.t) + Math.min(a.b, safe.b)) / 2;
const patternX = (place, w, { a, S }) => (place === 'right' ? a.r + G * S + w / 2 : place === 'left' ? a.l - G * S - w / 2 : (a.l + a.r) / 2);

/** the centre §6.2 gives a pattern for this geometry, or null */
export function spot(place, w, h, g) {
  const x = patternX(place, w, g);
  if (place === 'above' || place === 'below') {
    const y = place === 'above' ? g.a.t - G * g.S - h / 2 : g.a.b + G * g.S + h / 2;
    return legal(x, y, w, h, g) ? { x, y } : null;
  }
  const want = preferredY(g), span = g.safe.b - g.safe.t + 1;
  const near = g.blocks.filter((p) => Math.min(x + w / 2 + EPS * g.S, p.r) - Math.max(x - w / 2 - EPS * g.S, p.l) > TOL);
  const lane = { ...g, blocks: near };
  for (let d = 0; d <= span; d += STEP) { // outward from the preferred y, the smaller y first
    if (legal(x, want - d, w, h, lane)) return { x, y: want - d };
    if (d > 0 && legal(x, want + d, w, h, lane)) return { x, y: want + d };
  }
  return null;
}

/** verdict of one recorded attempt: { v, detail }. v: 'cap' | 'offscreen' | 'gone' | 'tooWide' (no geometry question),
 *  'placed-ok' | 'placed-bad' | 'drop-ok' (no pattern had room) | 'drop-bad' (a legal spot existed) */
export function judge(at) {
  if (at.result === 'cap' || at.result === 'offscreen' || at.result === 'gone' || at.result === 'tooWide') return { v: at.result };
  const g = { S: at.S, safe: at.safe, a: at.a, blocks: at.blocks };
  const order = at.n % 2 === 1 ? ORDER.odd : ORDER.even;
  if (at.result === 'none') {
    const found = order.filter((p) => spot(p, at.w, at.h, g));
    return found.length ? { v: 'drop-bad', detail: `legal: ${found.join(',')}` } : { v: 'drop-ok' };
  }
  const R = at.R, w = R.r - R.l, h = R.b - R.t, cx = (R.l + R.r) / 2, cy = (R.t + R.b) / 2;
  if (!legal(cx, cy, w, h, g)) return { v: 'placed-bad', detail: 'accepted R breaks a rule' };
  for (const p of order) {
    const s = spot(p, w, h, g);
    if (p === at.result) {
      if (!s) return { v: 'placed-bad', detail: `checker finds no spot in ${p}` };
      return Math.abs(s.x - cx) < 0.11 && Math.abs(s.y - cy) < 0.11 ? { v: 'placed-ok' } : { v: 'placed-bad', detail: `${p}: expected ${s.x.toFixed(2)},${s.y.toFixed(2)} got ${cx.toFixed(2)},${cy.toFixed(2)}` };
    }
    if (s) return { v: 'placed-bad', detail: `${p} comes first and had room, but ${at.result} was used` };
  }
  return { v: 'placed-bad', detail: 'pattern not in the order' };
}

/** counts of verdicts, in total and per kind; keeps the first few disagreements */
export function tally(attempts) {
  const total = {}, byKind = {}, bad = [];
  for (const at of attempts) {
    const { v, detail } = judge(at);
    total[v] = (total[v] || 0) + 1;
    (byKind[at.kind] ??= {})[v] = (byKind[at.kind][v] || 0) + 1;
    if (v.endsWith('-bad') && bad.length < 20) bad.push({ v, detail, attempt: at });
  }
  return { attempts: attempts.length, total, byKind, bad };
}
