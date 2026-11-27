// DES-008 v3 §6.2 checker, written from the design text only (it imports nothing from src/). For the geometry of one placement attempt
// (actor rect a, protected areas + live labels already grown by their margins, safe view, S, R size) it says whether a legal spot
// existed, whether the accepted R is legal and is the one §6.2 picks, and what that spot is. Exact (§14.4): along a side lane,
// legality can only change at a few y values (safe view, closeness limit, each blocking area's edges), so the rules are tested at
// every such y, at the preferred y and midway between neighbours — no grid: single points and bands narrower than any step are seen.
// opts.inset: the y room kept from both ends of a free interval (v3: 7.5·S; 0 = the round-2 rule, to judge builds made with it).
const G = 10, EDGE = 8, EPS = 0.5, NEAR = 128, INSET = 7.5, TOL = 1e-6;
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

/** every y in this side lane where legality may change (plus the preferred y), ascending */
function breakpoints(x, w, h, g) {
  const { S, safe, a, blocks } = g, half = h / 2 + EPS * S, m = EDGE * S;
  const ys = [safe.t + m + half, safe.b - m - half, preferredY(g)];
  const dx = Math.max(a.l - x, 0, x - a.r);
  if (dx <= NEAR * S) { const v = Math.sqrt((NEAR * S) ** 2 - dx * dx); ys.push(a.t - v, a.b + v); }
  for (const p of blocks) if (Math.min(x + w / 2 + EPS * S, p.r) - Math.max(x - w / 2 - EPS * S, p.l) > TOL) ys.push(p.t - half, p.b + half);
  return [...new Set(ys)].sort((p, q) => p - q);
}

/** the free centre-y intervals [L, U] of a side lane (closed; L = U for a single point) */
export function intervals(place, w, h, g) {
  const x = patternX(place, w, g), ys = breakpoints(x, w, h, g), out = [];
  let open = null; // the interval being built
  const end = () => { if (open) out.push(open); open = null; };
  for (let i = 0; i < ys.length; i++) {
    const y = ys[i];
    if (legal(x, y, w, h, g)) { if (open) open[1] = y; else open = [y, y]; } else end();
    if (i + 1 < ys.length && !legal(x, (y + ys[i + 1]) / 2, w, h, g)) end(); // the stretch up to the next point is blocked
  }
  end();
  return out;
}

/** the centre §6.2 gives a pattern for this geometry, or null */
export function spot(place, w, h, g, { inset = INSET } = {}) {
  const x = patternX(place, w, g);
  if (place === 'above' || place === 'below') {
    const y = place === 'above' ? g.a.t - G * g.S - h / 2 : g.a.b + G * g.S + h / 2;
    return legal(x, y, w, h, g) ? { x, y } : null;
  }
  const want = preferredY(g);
  let best = null;
  for (const [L, U] of intervals(place, w, h, g)) { // ascending: an exact tie keeps the smaller y
    const d = Math.min(inset * g.S, (U - L) / 2), y = Math.min(Math.max(want, L + d), U - d);
    if (best === null || Math.abs(y - want) < Math.abs(best - want) - TOL) best = y;
  }
  return best === null ? null : { x, y: best };
}

/** for an accepted side placement: the free band it sits in and its y room to the nearer end (the band inset is measured from) */
export function bandOf(at) {
  if (!at.R || (at.result !== 'right' && at.result !== 'left')) return null;
  const g = { S: at.S, safe: at.safe, a: at.a, blocks: at.blocks }, w = at.R.r - at.R.l, h = at.R.b - at.R.t, cy = (at.R.t + at.R.b) / 2;
  const band = intervals(at.result, w, h, g).find(([L, U]) => cy >= L - 1e-3 && cy <= U + 1e-3);
  return band ? { width: band[1] - band[0], slack: Math.max(0, Math.min(cy - band[0], band[1] - cy)) } : null;
}

/** verdict of one recorded attempt: { v, detail, expected }. v: 'cap' | 'offscreen' | 'gone' | 'tooWide' | 'expired' (no geometry
 *  question), 'placed-ok' | 'placed-bad' | 'drop-ok' (no pattern had room) | 'drop-bad' (a legal spot existed) */
export function judge(at, opts = {}) {
  if (['cap', 'offscreen', 'gone', 'tooWide', 'expired'].includes(at.result)) return { v: at.result };
  const g = { S: at.S, safe: at.safe, a: at.a, blocks: at.blocks };
  const order = at.n % 2 === 1 ? ORDER.odd : ORDER.even;
  const first = (w, h) => { for (const p of order) { const s = spot(p, w, h, g, opts); if (s) return { place: p, x: s.x, y: s.y }; } return null; };
  if (at.result === 'none') {
    const e = first(at.w, at.h);
    return e ? { v: 'drop-bad', detail: `legal: ${e.place} ${e.x.toFixed(3)},${e.y.toFixed(3)}`, expected: e } : { v: 'drop-ok', expected: null };
  }
  const R = at.R, w = R.r - R.l, h = R.b - R.t, cx = (R.l + R.r) / 2, cy = (R.t + R.b) / 2, e = first(w, h);
  if (!legal(cx, cy, w, h, g)) return { v: 'placed-bad', detail: 'accepted R breaks a rule', expected: e };
  if (!e) return { v: 'placed-bad', detail: 'checker finds no spot at all', expected: null };
  if (e.place !== at.result) return { v: 'placed-bad', detail: `expected ${e.place}, got ${at.result}`, expected: e };
  return Math.abs(e.x - cx) < 1e-3 && Math.abs(e.y - cy) < 1e-3 ? { v: 'placed-ok', expected: e }
    : { v: 'placed-bad', detail: `${at.result}: expected ${e.x.toFixed(3)},${e.y.toFixed(3)} got ${cx.toFixed(3)},${cy.toFixed(3)}`, expected: e };
}

/** counts of verdicts, in total and per kind; keeps the first few disagreements */
export function tally(attempts, opts = {}) {
  const total = {}, byKind = {}, bad = [];
  for (const at of attempts) {
    const { v, detail } = judge(at, opts);
    total[v] = (total[v] || 0) + 1;
    (byKind[at.kind] ??= {})[v] = (byKind[at.kind][v] || 0) + 1;
    if (v.endsWith('-bad') && bad.length < 20) bad.push({ v, detail, attempt: at });
  }
  return { attempts: attempts.length, total, byKind, bad };
}

/** every attempt with what was recorded, the checker's verdict and the spot it expects: kept so the check can be redone by anyone */
export const audit = (attempts, opts = {}) => attempts.map((at) => ({ ...at, ...judge(at, opts) }));
