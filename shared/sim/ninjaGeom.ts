// Sweep geometry for `ninja-roam-1` (dash and needle paths). Only + - * / and Math.sqrt, like the rest of shared/sim.
export interface Circle { x: number; z: number; r: number; }

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
