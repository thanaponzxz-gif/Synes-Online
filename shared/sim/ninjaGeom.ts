// Sweep geometry for `ninja-roam-1` (dash and needle paths). Only + - * / and Math.sqrt, like the rest of shared/sim.
import type { Shape } from '../data/level.ts';
export interface Circle { x: number; z: number; r: number; }

/** how close (m) counts as touching / standing on the edge, the same 1e-9 m that World.clampWalk callers accept */
const EPS = 1e-9;

/** How far a point starting at (sx,sz) can go along the unit direction (dx,dz) before it touches the circle (cx,cz,R) — R already
 *  includes the mover's own radius. 0 when it starts inside or touching and is moving inward; Infinity when it never touches
 *  (or starts inside and moves outward). */
export function rayCircle(sx: number, sz: number, dx: number, dz: number, cx: number, cz: number, R: number): number {
  const fx = sx - cx, fz = sz - cz, b = fx * dx + fz * dz, c = fx * fx + fz * fz - R * R;
  if (c <= 0) return b < 0 ? 0 : Infinity;
  if (b >= 0) return Infinity;
  const disc = b * b - c;
  return disc < 0 ? Infinity : -b - Math.sqrt(disc);
}

/** The point of segment (x0,z0)-(x1,z1) nearest to (px,pz). */
export function segClosest(x0: number, z0: number, x1: number, z1: number, px: number, pz: number): [number, number] {
  const ax = x1 - x0, az = z1 - z0, l2 = ax * ax + az * az;
  let k = l2 > 1e-12 ? ((px - x0) * ax + (pz - z0) * az) / l2 : 0;
  k = k < 0 ? 0 : k > 1 ? 1 : k;
  return [x0 + ax * k, z0 + az * k];
}

/** Squared distance from (px,pz) to segment (x0,z0)-(x1,z1). */
export function segDist2(x0: number, z0: number, x1: number, z1: number, px: number, pz: number): number {
  const [qx, qz] = segClosest(x0, z0, x1, z1, px, pz);
  return (px - qx) * (px - qx) + (pz - qz) * (pz - qz);
}

/** Does the segment pass strictly inside the circle? (Grazing the edge does not count.) */
export function segmentCrossesCircle(x0: number, z0: number, x1: number, z1: number, c: Circle): boolean {
  return segDist2(x0, z0, x1, z1, c.x, c.z) < c.r * c.r;
}

// ---------------------------------------------------------------- walkable ground along a line
type Span = [number, number] | null;
/** the part of the line s -> (sx,sz) + s(dx,dz) (unit direction) inside the disc (cx,cz,R) */
function discSpan(sx: number, sz: number, dx: number, dz: number, cx: number, cz: number, R: number): Span {
  const fx = sx - cx, fz = sz - cz, b = fx * dx + fz * dz, disc = b * b - (fx * fx + fz * fz - R * R);
  if (disc < 0) return null;
  const q = Math.sqrt(disc);
  return [-b - q, -b + q];
}
/** the s where lo <= p0 + s p1 <= hi; null when never, [-Inf, Inf] when always */
function linearSpan(p0: number, p1: number, lo: number, hi: number): Span {
  if (p1 === 0) return p0 >= lo && p0 <= hi ? [-Infinity, Infinity] : null;
  const a = (lo - p0) / p1, b = (hi - p0) / p1;
  return a < b ? [a, b] : [b, a];
}
const meet = (a: Span, b: Span): Span => { if (!a || !b) return null; const lo = a[0] > b[0] ? a[0] : b[0], hi = a[1] < b[1] ? a[1] : b[1]; return lo <= hi ? [lo, hi] : null; };
const hull = (a: Span, b: Span): Span => (!a ? b : !b ? a : [a[0] < b[0] ? a[0] : b[0], a[1] > b[1] ? a[1] : b[1]]);

/** the part of the line where a body of radius r stands inside one walkable shape (a disc, or a stadium for a capsule) */
function shapeSpan(s: Shape, sx: number, sz: number, dx: number, dz: number, r: number): Span {
  const R = s.r - r;
  if (R < 0) return null;
  if (s.type === 'circle') return discSpan(sx, sz, dx, dz, s.x, s.z, R);
  // a stadium is convex: its span is the hull of the spans of its two end discs and its middle band
  let span = hull(discSpan(sx, sz, dx, dz, s.ax, s.az, R), discSpan(sx, sz, dx, dz, s.bx, s.bz, R));
  const abx = s.bx - s.ax, abz = s.bz - s.az, l = Math.sqrt(abx * abx + abz * abz);
  if (l > 0) {
    const ux = abx / l, uz = abz / l, ox = sx - s.ax, oz = sz - s.az;
    const along = linearSpan(ox * ux + oz * uz, dx * ux + dz * uz, 0, l);
    const side = linearSpan(-ox * uz + oz * ux, -dx * uz + dz * ux, -R, R);
    span = hull(span, meet(along, side));
  }
  return span;
}

/** How far (<= L) a body of radius r can go from (sx,sz) along the unit direction (dx,dz) without ever leaving the union of the
 *  walkable shapes (DES-007 §3.2 item 8): the end of the run of overlapping spans that holds the start, not just a check of the
 *  end point, so a strip it could not stand on between two shapes stops it. 0 when the start is not on that ground. */
export function walkReach(shapes: readonly Shape[], sx: number, sz: number, dx: number, dz: number, L: number, r: number): number {
  const spans: [number, number][] = [];
  for (const s of shapes) { const sp = shapeSpan(s, sx, sz, dx, dz, r); if (sp && sp[1] >= -EPS) spans.push(sp); }
  let reach = -Infinity;
  for (const [a, b] of spans) if (a <= EPS && b > reach) reach = b;
  if (reach === -Infinity) return 0;
  for (let grew = true; grew && reach < L;) {
    grew = false;
    for (const [a, b] of spans) if (a <= reach + EPS && b > reach) { reach = b; grew = true; }
  }
  return reach < 0 ? 0 : reach > L ? L : reach;
}

// ---------------------------------------------------------------- a swept body against a telegraph (Auto's dash check)
/** squared distance between segments p (x0,z0)-(x1,z1) and q (x2,z2)-(x3,z3) */
export function segSegDist2(x0: number, z0: number, x1: number, z1: number, x2: number, z2: number, x3: number, z3: number): number {
  const cross = (ax: number, az: number, bx: number, bz: number, cx: number, cz: number) => (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
  const d1 = cross(x2, z2, x3, z3, x0, z0), d2 = cross(x2, z2, x3, z3, x1, z1), d3 = cross(x0, z0, x1, z1, x2, z2), d4 = cross(x0, z0, x1, z1, x3, z3);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return 0;
  const a = segDist2(x2, z2, x3, z3, x0, z0), b = segDist2(x2, z2, x3, z3, x1, z1), c = segDist2(x0, z0, x1, z1, x2, z2), d = segDist2(x0, z0, x1, z1, x3, z3);
  const m = a < b ? a : b, n = c < d ? c : d;
  return m < n ? m : n;
}

export interface TeleShape { shape: 'circle' | 'cone' | 'line'; x: number; z: number; dx: number; dz: number; r: number; w: number; cos: number; }
/** Does a body of radius `pad` moved along (x0,z0)-(x1,z1) touch the drawn shape of telegraph t at any point of the way?
 *  circle: a disc; line: a band from (x,z) along (dx,dz), length r, width w; cone: a sector of radius r and half-angle cos (convex
 *  for cos >= 0; a wider cone is taken as its whole disc) plus its inner disc of `innerR`, as World.insideTele draws them. */
export function sweepTouchesTele(x0: number, z0: number, x1: number, z1: number, pad: number, t: TeleShape, innerR: number): boolean {
  const p2 = pad * pad;
  if (t.shape === 'circle') return segDist2(x0, z0, x1, z1, t.x, t.z) <= (t.r + pad) * (t.r + pad);
  // local frame of the telegraph: a = along (dx,dz), b = across
  const ax0 = (x0 - t.x) * t.dx + (z0 - t.z) * t.dz, bx0 = -(x0 - t.x) * t.dz + (z0 - t.z) * t.dx;
  const ax1 = (x1 - t.x) * t.dx + (z1 - t.z) * t.dz, bx1 = -(x1 - t.x) * t.dz + (z1 - t.z) * t.dx;
  if (t.shape === 'line') {
    const h = t.w / 2, L = t.r;
    const s = meet(meet(linearSpan(ax0, ax1 - ax0, 0, L), linearSpan(bx0, bx1 - bx0, -h, h)), [0, 1]);
    if (s) return true; // the path crosses the band
    const ptRect = (a: number, b: number) => { const da = a < 0 ? -a : a > L ? a - L : 0, db = b < -h ? -h - b : b > h ? b - h : 0; return da * da + db * db; };
    let m = ptRect(ax0, bx0); const m1 = ptRect(ax1, bx1); if (m1 < m) m = m1;
    for (const [ca, cb] of [[0, -h], [0, h], [L, -h], [L, h]]) { const d = segDist2(ax0, bx0, ax1, bx1, ca, cb); if (d < m) m = d; }
    return m <= p2;
  }
  // cone: the inner disc first
  const core = innerR < t.r ? innerR : t.r;
  if (segDist2(ax0, bx0, ax1, bx1, 0, 0) <= (core + pad) * (core + pad)) return true;
  if (t.cos < 0) return segDist2(ax0, bx0, ax1, bx1, 0, 0) <= (t.r + pad) * (t.r + pad);
  const R = t.r, c = t.cos, sn = Math.sqrt(1 - c * c);
  const inWedge = (a: number, b: number) => a >= c * Math.sqrt(a * a + b * b);
  const inSector = (a: number, b: number) => a * a + b * b <= R * R && inWedge(a, b);
  if (inSector(ax0, bx0) || inSector(ax1, bx1)) return true;
  // the two straight edges of the sector
  let m = segSegDist2(ax0, bx0, ax1, bx1, 0, 0, R * c, R * sn);
  const e2 = segSegDist2(ax0, bx0, ax1, bx1, 0, 0, R * c, -R * sn); if (e2 < m) m = e2;
  if (m <= p2) return true;
  // the arc: the points of the path nearest the apex (its ends, and the foot of the apex on it) that lie inside the wedge
  const [fa, fb] = segClosest(ax0, bx0, ax1, bx1, 0, 0);
  for (const [a, b] of [[ax0, bx0], [ax1, bx1], [fa, fb]]) {
    if (!inWedge(a, b)) continue;
    const d = Math.sqrt(a * a + b * b) - R;
    if (d <= pad) return true;
  }
  return false;
}
