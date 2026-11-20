// Fades the touch controls (action buttons + floating stick) while something important is drawn underneath them:
// an active telegraph, the boss, or a living crystal pillar. Two tests, either one fades a control:
//  1. world → screen: a few points per object are projected and tested against each control's rect (boss, pillars, telegraphs);
//  2. screen → ground (DES-006 Q72): a few points of each action button are mapped back onto the ground plane and tested against every
//     telegraph's exact shape, so a warning whose sampled points all fall beside a button (the middle of a fan, a wide line) still fades it.
// Runs every few frames; allocation-free after construction.
import type { World, Telegraph } from '../../shared/sim/world.ts';

type Project = (x: number, y: number, z: number, out: { x: number; y: number; vis: boolean }) => unknown;
const IDS = ['#btn-attack', '#btn-dodge', '#btn-skill', '#btn-skill2', '#btn-skill3', '#btn-ult', '#btn-potion', '#stick-base'];
const ACT = IDS.length - 1; // the first ACT entries are the round action buttons
const PAD = 10, EVERY = 4;
/** metres added around a telegraph shape for the screen → ground test (its bright edge line is drawn on the boundary) */
const EDGE = 0.3;
/** button sample points (unit circle): centre, 8 at 0.9 r, 4 at 0.5 r */
const SAMPLES: number[] = [0, 0];
for (let k = 0; k < 8; k++) SAMPLES.push(0.9 * Math.cos((k * Math.PI) / 4), 0.9 * Math.sin((k * Math.PI) / 4));
for (let k = 0; k < 4; k++) SAMPLES.push(0.5 * Math.cos(Math.PI / 4 + (k * Math.PI) / 2), 0.5 * Math.sin(Math.PI / 4 + (k * Math.PI) / 2));

export class ButtonFade {
  private els = IDS.map((s) => document.querySelector(s) as HTMLElement);
  private rects = IDS.map(() => ({ l: 0, t: 0, r: 0, b: 0, ok: false }));
  private hit = IDS.map(() => false);
  private out = { x: 0, y: 0, vis: false };
  private frame = 0;
  private project: Project;
  /** screen (CSS px) → ground (x, z) homography, rebuilt every update from 4 projected ground points around the player */
  private G = new Float64Array(9); private gOk = false; private gSign = 1;
  private A = new Float64Array(8 * 9); private src = new Float64Array(8); private dst = new Float64Array(8);
  constructor(project: Project) { this.project = project; }

  private test(x: number, y: number, z: number) {
    this.project(x, y, z, this.out);
    const o = this.out; if (!o.vis) return;
    for (let i = 0; i < this.rects.length; i++) {
      const q = this.rects[i];
      if (q.ok && o.x >= q.l && o.x <= q.r && o.y >= q.t && o.y <= q.b) this.hit[i] = true;
    }
  }

  private tele(t: Telegraph) {
    const px = -t.dz, pz = t.dx; // perpendicular
    if (t.shape === 'circle') {
      this.test(t.x, 0.1, t.z);
      for (let k = 0; k < 4; k++) { const sx = k & 1 ? 1 : -1, sz = k & 2 ? 1 : -1; this.test(t.x + sx * t.r * 0.7, 0.1, t.z + sz * t.r * 0.7); this.test(t.x + sx * t.r * 0.35, 0.1, t.z + sz * t.r * 0.35); }
    } else if (t.shape === 'line') {
      const hw = t.w / 2;
      for (let k = 0; k <= 6; k++) {
        const a = (t.r * k) / 6, cx = t.x + t.dx * a, cz = t.z + t.dz * a;
        this.test(cx, 0.1, cz); this.test(cx + px * hw, 0.1, cz + pz * hw); this.test(cx - px * hw, 0.1, cz - pz * hw);
      }
    } else { // cone: origin, then three rays (centre + both edges) sampled along their length
      const half = Math.acos(Math.max(-1, Math.min(1, t.cos))), s = Math.sin(half), c = t.cos;
      this.test(t.x, 0.1, t.z);
      for (let k = 1; k <= 4; k++) {
        const a = (t.r * k) / 4;
        this.test(t.x + t.dx * a, 0.1, t.z + t.dz * a);
        for (const sg of [-1, 1]) this.test(t.x + (t.dx * c + px * s * sg) * a, 0.1, t.z + (t.dz * c + pz * s * sg) * a);
      }
    }
  }

  /** Ground point inside a telegraph's shape (grown by EDGE). Same shapes as the sim: circle, cone (radius + half-angle cos), line (length r, width w). */
  private static inside(t: Telegraph, x: number, z: number) {
    const ox = x - t.x, oz = z - t.z;
    if (t.shape === 'circle') return ox * ox + oz * oz <= (t.r + EDGE) ** 2;
    if (t.shape === 'line') { const a = ox * t.dx + oz * t.dz, c = Math.abs(ox * -t.dz + oz * t.dx); return a >= -EDGE && a <= t.r + EDGE && c <= t.w / 2 + EDGE; }
    const d = Math.hypot(ox, oz); if (d > t.r + EDGE) return false; if (d < EDGE + 0.01) return true;
    const half = Math.acos(Math.max(-1, Math.min(1, t.cos))), dot = (ox * t.dx + oz * t.dz) / d;
    return dot >= Math.cos(Math.min(Math.PI, half + EDGE / d)); // the edge margin as an angle at this distance
  }

  /** Fit the ground→screen homography on 4 ground points near the player and invert it into G (screen → ground). */
  private fitGround(cx: number, cz: number) {
    const gx = [cx - 2, cx + 2, cx + 2, cx - 2], gz = [cz, cz, cz - 4, cz - 4]; // the camera looks toward -Z: all four lie in front of it
    for (let k = 0; k < 4; k++) {
      this.project(gx[k], 0, gz[k], this.out); if (!this.out.vis) { this.gOk = false; return; }
      this.src[2 * k] = this.out.x; this.src[2 * k + 1] = this.out.y; this.dst[2 * k] = gx[k]; this.dst[2 * k + 1] = gz[k];
    }
    // DLT, h8 = 1: X = (h0 u + h1 v + h2) / (h6 u + h7 v + 1), Z = (h3 u + h4 v + h5) / (h6 u + h7 v + 1)
    const A = this.A; A.fill(0);
    for (let k = 0; k < 4; k++) {
      const u = this.src[2 * k], v = this.src[2 * k + 1], X = this.dst[2 * k], Z = this.dst[2 * k + 1], r0 = 2 * k * 9, r1 = r0 + 9;
      A[r0] = u; A[r0 + 1] = v; A[r0 + 2] = 1; A[r0 + 6] = -u * X; A[r0 + 7] = -v * X; A[r0 + 8] = X;
      A[r1 + 3] = u; A[r1 + 4] = v; A[r1 + 5] = 1; A[r1 + 6] = -u * Z; A[r1 + 7] = -v * Z; A[r1 + 8] = Z;
    }
    for (let c = 0; c < 8; c++) { // Gauss-Jordan with partial pivoting on the 8x9 augmented matrix
      let piv = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r * 9 + c]) > Math.abs(A[piv * 9 + c])) piv = r;
      if (Math.abs(A[piv * 9 + c]) < 1e-12) { this.gOk = false; return; }
      if (piv !== c) for (let j = 0; j < 9; j++) { const tmp = A[c * 9 + j]; A[c * 9 + j] = A[piv * 9 + j]; A[piv * 9 + j] = tmp; }
      const d = A[c * 9 + c]; for (let j = c; j < 9; j++) A[c * 9 + j] /= d;
      for (let r = 0; r < 8; r++) { if (r === c) continue; const f = A[r * 9 + c]; if (f) for (let j = c; j < 9; j++) A[r * 9 + j] -= f * A[c * 9 + j]; }
    }
    for (let j = 0; j < 8; j++) this.G[j] = A[j * 9 + 8];
    this.G[8] = 1; this.gOk = true;
    // sign of the denominator on the ground side of the horizon (h8 = 1 can flip it): taken at a fit point, which is on the ground
    this.gSign = Math.sign(this.G[6] * this.src[0] + this.G[7] * this.src[1] + 1) || 1;
  }

  /** Call every frame; does the work every EVERY-th frame. */
  update(w: World, project?: Project) {
    if (project) this.project = project;
    if (++this.frame % EVERY !== 0) return;
    for (let i = 0; i < this.els.length; i++) {
      const el = this.els[i], q = this.rects[i];
      const on = i < ACT || el.classList.contains('on'); // stick base only counts while it is on screen
      const b = on ? el.getBoundingClientRect() : null;
      q.ok = !!b && b.width > 0;
      if (b) { q.l = b.left - PAD; q.r = b.right + PAD; q.t = b.top - PAD; q.b = b.bottom + PAD; }
      this.hit[i] = false;
    }
    for (const t of w.tele) this.tele(t);
    if (w.tele.length) {
      this.fitGround(w.player.x, w.player.z);
      const G = this.G;
      if (this.gOk) for (let i = 0; i < ACT; i++) {
        const q = this.rects[i]; if (!q.ok || this.hit[i]) continue;
        const cx = (q.l + q.r) / 2, cy = (q.t + q.b) / 2, rad = (q.r - q.l) / 2 - PAD;
        for (let s = 0; s < SAMPLES.length && !this.hit[i]; s += 2) {
          const u = cx + SAMPLES[s] * rad, v = cy + SAMPLES[s + 1] * rad, den = G[6] * u + G[7] * v + 1;
          if (den * this.gSign <= 1e-12) continue; // at/above the horizon: no ground there
          const gx = (G[0] * u + G[1] * v + G[2]) / den, gz = (G[3] * u + G[4] * v + G[5]) / den;
          for (const t of w.tele) if (ButtonFade.inside(t, gx, gz)) { this.hit[i] = true; break; }
        }
      }
    }
    if (w.bossStarted && w.boss.alive) { const B = w.boss; this.test(B.x, 0.5, B.z); this.test(B.x, 1.6, B.z); this.test(B.x - 1.2, 0.8, B.z); this.test(B.x + 1.2, 0.8, B.z); this.test(B.x, 3, B.z); }
    for (const pl of w.pillars) if (pl.alive) { this.test(pl.x, 0.2, pl.z); this.test(pl.x, 1.5, pl.z); this.test(pl.x, 3, pl.z); this.test(pl.x - pl.r, 1, pl.z); this.test(pl.x + pl.r, 1, pl.z); }
    for (let i = 0; i < this.els.length; i++) if (this.els[i].classList.contains('seethru') !== this.hit[i]) this.els[i].classList.toggle('seethru', this.hit[i]);
  }
}
