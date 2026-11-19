// Deterministic math: only + - * / and Math.sqrt (IEEE-754 correctly rounded on every JS engine).
// Never use Math.sin/cos/atan2/pow/random in shared/ — results may differ between V8 and JavaScriptCore.
export const len = (x: number, z: number) => Math.sqrt(x * x + z * z);
export const dist2 = (ax: number, az: number, bx: number, bz: number) => (ax - bx) * (ax - bx) + (az - bz) * (az - bz);
export const dist = (ax: number, az: number, bx: number, bz: number) => Math.sqrt(dist2(ax, az, bx, bz));
export function norm(x: number, z: number): [number, number] { const l = len(x, z); return l > 1e-9 ? [x / l, z / l] : [0, 1]; }
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
/** Rotate unit vector f toward unit target t by at most `rate` (0..1 blend), renormalized. No trig. */
export function turnToward(fx: number, fz: number, tx: number, tz: number, rate: number): [number, number] {
  return norm(fx + (tx - fx) * rate, fz + (tz - fz) * rate);
}
/** 16 unit vectors (precomputed constants, i*22.5°) so the sim never calls trig. */
export const DIRS16: readonly [number, number][] = [
  [1, 0], [0.9238795325, 0.3826834324], [0.7071067812, 0.7071067812], [0.3826834324, 0.9238795325],
  [0, 1], [-0.3826834324, 0.9238795325], [-0.7071067812, 0.7071067812], [-0.9238795325, 0.3826834324],
  [-1, 0], [-0.9238795325, -0.3826834324], [-0.7071067812, -0.7071067812], [-0.3826834324, -0.9238795325],
  [0, -1], [0.3826834324, -0.9238795325], [0.7071067812, -0.7071067812], [0.9238795325, -0.3826834324],
];
