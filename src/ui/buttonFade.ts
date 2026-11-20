// Fades the touch controls (action buttons + floating stick) while something important is drawn underneath them:
// an active telegraph, the boss, or a living crystal pillar. Samples a few world points per object, projects them to
// screen space and tests them against each control's rect. Runs every few frames; allocation-free after construction.
import type { World, Telegraph } from '../../shared/sim/world.ts';

type Project = (x: number, y: number, z: number, out: { x: number; y: number; vis: boolean }) => unknown;
const IDS = ['#btn-attack', '#btn-dodge', '#btn-skill', '#btn-skill2', '#btn-skill3', '#btn-ult', '#btn-potion', '#stick-base'];
const PAD = 10, EVERY = 4;

export class ButtonFade {
  private els = IDS.map((s) => document.querySelector(s) as HTMLElement);
  private rects = IDS.map(() => ({ l: 0, t: 0, r: 0, b: 0, ok: false }));
  private hit = IDS.map(() => false);
  private out = { x: 0, y: 0, vis: false };
  private frame = 0;
  private project: Project;
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

  /** Call every frame; does the work every EVERY-th frame. */
  update(w: World, project?: Project) {
    if (project) this.project = project;
    if (++this.frame % EVERY !== 0) return;
    for (let i = 0; i < this.els.length; i++) {
      const el = this.els[i], q = this.rects[i];
      const on = i < IDS.length - 1 || el.classList.contains('on'); // stick base only counts while it is on screen
      const b = on ? el.getBoundingClientRect() : null;
      q.ok = !!b && b.width > 0;
      if (b) { q.l = b.left - PAD; q.r = b.right + PAD; q.t = b.top - PAD; q.b = b.bottom + PAD; }
      this.hit[i] = false;
    }
    for (const t of w.tele) this.tele(t);
    if (w.bossStarted && w.boss.alive) { const B = w.boss; this.test(B.x, 0.5, B.z); this.test(B.x, 1.6, B.z); this.test(B.x - 1.2, 0.8, B.z); this.test(B.x + 1.2, 0.8, B.z); this.test(B.x, 3, B.z); }
    for (const pl of w.pillars) if (pl.alive) { this.test(pl.x, 0.2, pl.z); this.test(pl.x, 1.5, pl.z); this.test(pl.x, 3, pl.z); this.test(pl.x - pl.r, 1, pl.z); this.test(pl.x + pl.r, 1, pl.z); }
    for (let i = 0; i < this.els.length; i++) if (this.els[i].classList.contains('seethru') !== this.hit[i]) this.els[i].classList.toggle('seethru', this.hit[i]);
  }
}
