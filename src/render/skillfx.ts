// DES-001 §2-3 player skill VFX + move poses. Render-only: reads sim events/state, never writes the sim.
// Budget: exactly one dynamic mesh per skill (3 draw calls when all overlap, <= +5 Medium / +3 Low). Meshes and buffers are
// allocated once (level build); nothing is allocated per cast except tiny temporaries. All timing is in sim ticks, so a replay
// that emits the same events on the same ticks renders the same picture. Palette only (no #FF7A1A / #FF3355), no full-screen flash.
import { BufferGeometry, BufferAttribute, Mesh, MeshBasicMaterial, DoubleSide, Color, DynamicDrawUsage, type Scene } from 'three';
import { SKILLS } from '../../shared/data/tuning.ts';
import type { Tier } from './quality.ts';

const COL = { lumen: new Color(0x5cf2e6), violet: new Color(0xa78bfa), blossom: new Color(0xff9ec7), gold: new Color(0xffc857), teal: new Color(0x2bb3a3) };
type C4 = [number, number, number, number];
const col = (c: Color, a = 1): C4 => [c.r, c.g, c.b, a];
const mix = (a: Color, b: Color, k: number, al = 1): C4 => [a.r + (b.r - a.r) * k, a.g + (b.g - a.g) * k, a.b + (b.b - a.b) * k, al];
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOut = (k: number) => 1 - (1 - k) * (1 - k);
const easeIn = (k: number) => k * k;
const hash = (i: number, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

/** One reusable dynamic mesh: pre-sized vertex buffers with RGBA vertex colours, rewritten each frame, hidden when empty. */
class Buf {
  readonly mesh: Mesh; private pos: Float32Array; private cols: Float32Array; private geo = new BufferGeometry(); n = 0; private cap: number;
  constructor(scene: Scene, maxTris: number, order: number) {
    this.cap = maxTris;
    this.pos = new Float32Array(maxTris * 9); this.cols = new Float32Array(maxTris * 12);
    const pa = new BufferAttribute(this.pos, 3).setUsage(DynamicDrawUsage), ca = new BufferAttribute(this.cols, 4).setUsage(DynamicDrawUsage);
    this.geo.setAttribute('position', pa); this.geo.setAttribute('color', ca); this.geo.setDrawRange(0, 0);
    // depthTest on (boss/pillars occlude us); renderOrder below the telegraphs (10, depthTest off) so warnings always draw on top (ADR-005)
    this.mesh = new Mesh(this.geo, new MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: DoubleSide, fog: false, forceSinglePass: true })); // single pass: a transparent DoubleSide mesh would otherwise cost 2 draw calls
    this.mesh.frustumCulled = false; this.mesh.renderOrder = order; this.mesh.visible = false; scene.add(this.mesh);
  }
  begin() { this.n = 0; }
  tri(a: number[], b: number[], c: number[], ca: C4, cb: C4, cc: C4) {
    if (this.n >= this.cap) return;
    const o = this.n * 9, k = this.n * 12; this.n++;
    this.pos.set(a, o); this.pos.set(b, o + 3); this.pos.set(c, o + 6);
    this.cols.set(ca, k); this.cols.set(cb, k + 4); this.cols.set(cc, k + 8);
  }
  quad(a: number[], b: number[], c: number[], d: number[], ca: C4, cb: C4, cc: C4, cd: C4) { this.tri(a, b, c, ca, cb, cc); this.tri(a, c, d, ca, cc, cd); }
  end() {
    this.geo.setDrawRange(0, this.n * 3);
    (this.geo.attributes.position as BufferAttribute).needsUpdate = true; (this.geo.attributes.color as BufferAttribute).needsUpdate = true;
    this.mesh.visible = this.n > 0;
  }
  dispose() { this.geo.dispose(); (this.mesh.material as MeshBasicMaterial).dispose(); this.mesh.removeFromParent(); }
}

interface Hit { t0: number; x: number; z: number; dx: number; dz: number }
export interface CastLite { slot: 1 | 2 | 3; tick: number; x: number; z: number; dx: number; dz: number }

export class SkillFx {
  private chime: Buf; private cres: Buf; private crys: Buf;
  private hits: (Hit | null)[] = [null, null, null];
  enabled: boolean; private rich: boolean;
  constructor(scene: Scene, tier: Tier, enabled: boolean) {
    this.enabled = enabled; this.rich = tier !== 'low'; // High uses the Medium caps (DES gives Medium/Low only)
    this.chime = new Buf(scene, 150, 5); this.cres = new Buf(scene, 200, 5); this.crys = new Buf(scene, 330, 5);
  }
  reset() { this.hits = [null, null, null]; }
  dispose() { this.chime.dispose(); this.cres.dispose(); this.crys.dispose(); }

  /** Sim event -> state (tick = world.tick when the event was handled). */
  onSkillHit(slot: 1 | 2 | 3, tick: number, x: number, z: number, dx: number, dz: number) { this.hits[slot - 1] = { t0: tick, x, z, dx, dz }; }
  /** Age of the most recent hit of a slot in ticks (null when none / finished); used for the Chime follow-through pose. */
  hitAge(slot: 1 | 2 | 3, tick: number, alpha: number): number | null { const h = this.hits[slot - 1]; return h ? this.age(h.t0, tick, alpha) : null; }

  /** Visual age in ticks of an event handled at tick t0. Actors are drawn at (tick-1+alpha), so effects use the same clock. */
  private age(t0: number, tick: number, alpha: number) { return Math.max(0, tick - t0 - 1 + alpha); }

  update(tick: number, alpha: number, cast: CastLite | null) {
    this.chime.begin(); this.cres.begin(); this.crys.begin();
    if (this.enabled) {
      const h1 = this.hits[0], h2 = this.hits[1], h3 = this.hits[2];
      if (h1) { const a = this.age(h1.t0, tick, alpha); if (a <= 12) this.drawChime(h1, a); else this.hits[0] = null; }
      if (h2) { const a = this.age(h2.t0, tick, alpha); if (a <= 8) this.drawCrescent(h2, a); else this.hits[1] = null; }
      if (h3) {
        const a = this.age(h3.t0, tick, alpha);
        if (a <= 14) this.drawCrystal(h3, a, 1, true); else this.hits[2] = null;
      } else if (cast && cast.slot === 3 && cast.tick < SKILLS[2].hitTick) {
        // prep: the crack grows from the sim's own cast state, so a cancel (dodge / death) removes it on the same tick
        this.drawCrystal(cast, 0, Math.max(0.03, clamp01((cast.tick - 1 + alpha) / SKILLS[2].hitTick)), false);
      }
    }
    else if (this.hits[0] && this.age(this.hits[0].t0, tick, alpha) > 12) this.hits[0] = null; // keep the follow-through clock tidy when VFX are off
    this.chime.end(); this.cres.end(); this.crys.end();
  }

  // ---- Chime Burst: lumen ring from the feet at the hit tick; short light shards gone by 12 ticks
  private drawChime(h: Hit, a: number) {
    const R = SKILLS[0].radius, k = clamp01(a / 9), r = 0.5 + (R - 0.5) * easeOut(k), w = 0.7 * (1 - k * 0.65) + 0.1, al = clamp01(1 - k * k);
    const y = 0.1, N = 36, b = this.chime;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const ro = r, ri = Math.max(0.05, r - w);
      b.quad([h.x + c0 * ri, y, h.z + s0 * ri], [h.x + c0 * ro, y, h.z + s0 * ro], [h.x + c1 * ro, y, h.z + s1 * ro], [h.x + c1 * ri, y, h.z + s1 * ri],
        col(COL.lumen, al * 0.45), mix(COL.lumen, COL.gold, 0.3, al), mix(COL.lumen, COL.gold, 0.3, al), col(COL.lumen, al * 0.45));
    }
    if (!this.rich) return;
    const sk = clamp01(a / 12);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + hash(i, 1) * 0.5, sp = 1.4 + hash(i, 2) * 1.8, rr = 0.6 + sp * easeOut(sk) * 1.4;
      shard(b, h.x + Math.cos(ang) * rr, 0.15 + 0.9 * sk * (0.5 + hash(i, 3)), h.z + Math.sin(ang) * rr, 0.11 * (1 - sk * 0.6), i % 2 ? col(COL.lumen, 1 - sk) : col(COL.gold, 1 - sk), a * 3 + i);
    }
  }

  // ---- Crescent Cut: violet crescent, blossom edge, matches the sim area (r 3.0, half-angle 50 deg); appears at the hit tick, gone in 8
  private drawCrescent(h: Hit, a: number) {
    const D = SKILLS[1], R = D.radius, half = Math.acos(D.cosHalf ?? 0.642788), fade = clamp01(1 - (a / 8) * (a / 8));
    const reveal = clamp01((a + 0.4) / 2.5), Ro = R, thick = 1.35, edge = 0.2, y = 0.4, N = 16, b = this.cres;
    const px = -h.dz, pz = h.dx;
    const at = (ang: number, rad: number) => [h.x + (Math.cos(ang) * h.dx + Math.sin(ang) * px) * rad, y, h.z + (Math.cos(ang) * h.dz + Math.sin(ang) * pz) * rad];
    const inner = (t: number) => Ro - thick * Math.cos(t * Math.PI / 2); // t in [-1,1]: tips meet the outer arc, belly is thickest
    const last = Math.max(1, Math.ceil(N * reveal));
    for (let i = 0; i < last; i++) {
      // the sweep runs from one side of the cone to the other (the swing direction)
      const t0 = 1 - (i / N) * 2, t1 = 1 - ((i + 1) / N) * 2, a0 = t0 * half, a1 = t1 * half, f = i === last - 1 ? 0.35 + 0.65 * clamp01(reveal * N - i) : 1;
      const o0 = at(a0, Ro), o1 = at(a1, Ro), m0 = at(a0, Ro - edge), m1 = at(a1, Ro - edge), n0 = at(a0, inner(t0)), n1 = at(a1, inner(t1));
      const al = fade * clamp01(f);
      b.quad(m0, o0, o1, m1, col(COL.blossom, al), col(COL.blossom, al), col(COL.blossom, al), col(COL.blossom, al));
      b.quad(n0, m0, m1, n1, col(COL.violet, al * 0.25), col(COL.violet, al * 0.9), col(COL.violet, al * 0.9), col(COL.violet, al * 0.25));
    }
    if (!this.rich) return;
    const sk = clamp01(a / 8);
    for (let i = 0; i < 10; i++) {
      const ang = (0.5 - (i + 0.5) / 10) * 2 * half, rr = Ro + 0.2 + easeOut(sk) * (0.6 + hash(i, 4) * 0.9), p = at(ang, rr);
      shard(b, p[0], 0.35 + 0.5 * sk * hash(i, 5), p[2], 0.1 * (1 - sk * 0.5), i % 3 ? col(COL.blossom, 1 - sk) : col(COL.violet, 1 - sk), a * 3 + i);
    }
  }

  // ---- Crystal Break: ground crack grows during prep at the target circle (2.6 m ahead, r 1.5); teal crystals with gold tips burst at the hit and collapse in 14
  private drawCrystal(h: { x: number; z: number; dx: number; dz: number }, a: number, crackK: number, hit: boolean) {
    const D = SKILLS[2], R = D.radius, cx = h.x + h.dx * (D.ahead ?? 2.6), cz = h.z + h.dz * (D.ahead ?? 2.6), b = this.crys;
    const fade = hit ? clamp01(1 - easeIn(clamp01((a - 4) / 10))) : 1, crackA = hit ? fade : 0.35 + 0.65 * crackK, grow = hit ? 1 : easeOut(crackK);
    for (let s = 0; s < 8; s++) {
      const ang = (s / 8) * Math.PI * 2 + hash(s, 6) * 0.5, len = R * (0.65 + 0.35 * hash(s, 7)) * grow, kink = (hash(s, 8) - 0.5) * 0.7;
      let px = cx, pz = cz; const wd = 0.11;
      for (let j = 1; j <= 3; j++) {
        const f = j / 3, aa = ang + (j === 2 ? kink : j === 3 ? -kink * 0.6 : 0), nx = px + Math.cos(aa) * (len / 3), nz = pz + Math.sin(aa) * (len / 3);
        const ox = -Math.sin(aa) * wd * (1.15 - f * 0.6), oz = Math.cos(aa) * wd * (1.15 - f * 0.6);
        b.quad([px - ox, 0.09, pz - oz], [px + ox, 0.09, pz + oz], [nx + ox * 0.7, 0.09, nz + oz * 0.7], [nx - ox * 0.7, 0.09, nz - oz * 0.7],
          mix(COL.teal, COL.gold, hit ? 0.3 : 0, crackA), mix(COL.teal, COL.gold, hit ? 0.3 : 0, crackA), col(COL.teal, crackA * 0.8), col(COL.teal, crackA * 0.8));
        px = nx; pz = nz;
      }
    }
    if (!hit) return;
    const rise = easeOut(clamp01(a / 3)), fall = 1 - easeIn(clamp01((a - 8) / 6)), sc = rise * fall;
    if (this.rich) {
      const spec: [number, number, number, number][] = [[0, 0, 1.7, 0.3], [0.95, 0.2, 1.15, 0.24], [0, 0.95, 1.0, 0.22], [-0.95, 0.1, 1.25, 0.25], [0.1, -0.9, 0.9, 0.22]];
      for (let i = 0; i < spec.length; i++) pyramid(b, cx + spec[i][0], cz + spec[i][1], spec[i][3] * 1.5, spec[i][2] * 1.35 * sc, 3, i * 0.9, spec[i][0] * 0.12, spec[i][1] * 0.12);
      const sk = clamp01(a / 14);
      for (let i = 0; i < 7; i++) {
        const ang = (i / 7) * Math.PI * 2 + hash(i, 9), rr = 0.4 + (0.6 + hash(i, 10) * 0.9) * easeOut(sk), up = 0.3 + 4.2 * sk * (1 - sk);
        shard(b, cx + Math.cos(ang) * rr, 0.1 + up, cz + Math.sin(ang) * rr, 0.12 * (1 - sk * 0.7), i % 2 ? col(COL.gold, 1 - sk) : col(COL.teal, 1 - sk), a * 2 + i);
      }
    } else {
      pyramid(b, cx, cz, 0.7, 0.85 * sc, 6, 0.3, 0, 0); // low tier: one low merged crystal, no floating shards
    }
  }
}

/** Small stretched octahedron shard (8 tris). */
function shard(b: Buf, x: number, y: number, z: number, s: number, c: C4, spin: number) {
  const cs = Math.cos(spin), sn = Math.sin(spin), top = [x, y + s * 1.7, z], bot = [x, y - s * 1.7, z];
  const e = [[x + cs * s, y, z + sn * s], [x - sn * s, y, z + cs * s], [x - cs * s, y, z - sn * s], [x + sn * s, y, z - cs * s]];
  const c2: C4 = [c[0], c[1], c[2], c[3] * 0.8];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; b.tri(top, e[i], e[j], c, c2, c2); b.tri(bot, e[j], e[i], c2, c2, c2); }
}
/** n-sided pyramid standing on the ground: teal base, gold tip. */
function pyramid(b: Buf, x: number, z: number, r: number, h: number, n: number, yaw: number, lx: number, lz: number) {
  if (h <= 0.01) return;
  const tip = [x + lx * h, h, z + lz * h], base: number[][] = [];
  for (let i = 0; i < n; i++) { const a = yaw + (i / n) * Math.PI * 2; base.push([x + Math.cos(a) * r, 0.02, z + Math.sin(a) * r]); }
  const cb = col(COL.teal, 0.95), ct = col(COL.gold, 1), cm = mix(COL.teal, COL.lumen, 0.4, 0.95);
  for (let i = 0; i < n; i++) b.tri(base[i], base[(i + 1) % n], tip, i % 2 ? cb : cm, i % 2 ? cm : cb, ct);
}

// ------------------------------------------------------------------ hero move poses (DES-001 §2 "ท่า")
export interface Pose { dy: number; rx: number; ry: number; lean: number; hop: number }
const lerp = (a: number, b: number, k: number) => a + (b - a) * clamp01(k);
/** Weapon/body pose for the cast at sim time t (ticks, fractional). Chime keeps going past its hit tick as a short follow-through. */
export function castPose(slot: 1 | 2 | 3, t: number): Pose {
  const REST = -0.35;
  if (slot === 1) { // raise before the strike, slam at the hit tick (10), return
    const up = easeOut(clamp01(t / 8)), slam = easeIn(clamp01((t - 8) / 2)), back = clamp01((t - 11) / 5);
    const rx = t < 8 ? lerp(REST, -0.15, up) : t < 10 ? lerp(-0.15, 1.35, slam) : lerp(1.35, REST, back);
    return { dy: t < 8 ? 0.6 * up : t < 10 ? lerp(0.6, 0.05, slam) : 0.05 * (1 - back), rx, ry: 0, lean: t < 8 ? -0.08 * up : lerp(-0.08, 0.2, slam) * (1 - back), hop: 0.12 * up * (1 - back) };
  }
  if (slot === 2) { // pull back (0-4), sweep across through the hit tick (4-8), settle (8-12)
    const pull = easeOut(clamp01(t / 4)), sweep = clamp01((t - 4) / 4), settle = clamp01((t - 8) / 4);
    const ry = t < 4 ? lerp(1.4, 2.3, pull) : t < 8 ? lerp(2.3, -1.6, sweep) : lerp(-1.6, 0, settle);
    return { dy: 0.12 * (1 - settle), rx: lerp(-1.2, REST, settle), ry, lean: t < 4 ? -0.1 * pull : lerp(-0.1, 0.18, sweep) * (1 - settle), hop: 0 };
  }
  // slot 3: raise overhead (0-11), drive the tip down (11-15 = hit), hold, recover
  const up = easeOut(clamp01(t / 11)), drive = easeIn(clamp01((t - 11) / 4)), rec = clamp01((t - 18) / 6);
  const rx = t < 11 ? lerp(REST, -0.2, up) : lerp(-0.2, 3.0, drive);
  return { dy: t < 11 ? 0.65 * up : lerp(0.65, 0.0, drive), rx: t < 18 ? rx : lerp(3.0, REST, rec), ry: 0, lean: t < 11 ? -0.12 * up : lerp(-0.12, 0.4, drive) * (1 - rec), hop: 0.1 * up * (1 - drive) };
}
