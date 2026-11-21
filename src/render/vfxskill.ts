// exp/stage1-vfx: player skill VFX for the ?vfx=A|B options (vfxstyle.ts). Same contract as SkillFx (skillfx.ts, which stays the
// no-parameter "current" look, untouched): render-only, reads sim events/state, timing in sim ticks (a replay renders the same
// picture), exactly ONE pre-allocated dynamic mesh per skill (Chime prep cue + burst share one mesh, so Chime stays +1 call on
// Low, DES-006 Q26), renderOrder 5 + depthTest on, below the telegraphs (renderOrder 10, depthTest off: warnings stay on top).
// Field names chime / cres / crys match SkillFx so tools/qa/tele-roi.mjs hides them as the "VFX" layer.
// Differences from the current look (both options): no gold (warm) anywhere; Chime gets a blade light prep cue (Q26, no circle);
// the Crescent sheet is tilted up toward the low camera; Crystal Break is lumen/violet instead of teal (read against the grass);
// cracks stay thin cool lines with no outline or fill, so they do not read as an enemy telegraph (Q27).
import { BufferGeometry, BufferAttribute, Mesh, MeshBasicMaterial, DoubleSide, Color, DynamicDrawUsage, Vector3, type Scene, type Object3D, type Camera } from 'three';
import { SKILLS } from '../../shared/data/tuning.ts';
import type { Tier } from './quality.ts';
import { FXC, type VfxStyle } from './vfxstyle.ts';

const COL = { lumen: new Color(FXC.lumen), violet: new Color(FXC.violet), teal: new Color(FXC.teal), hi: new Color(FXC.lumenHi), orchid: new Color(FXC.orchid), white: new Color(FXC.white) };
type C4 = [number, number, number, number];
const col = (c: Color, a = 1): C4 => [c.r, c.g, c.b, a];
const mix = (a: Color, b: Color, k: number, al = 1): C4 => [a.r + (b.r - a.r) * k, a.g + (b.g - a.g) * k, a.b + (b.b - a.b) * k, al];
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOut = (k: number) => 1 - (1 - k) * (1 - k);
const easeIn = (k: number) => k * k;
const hash = (i: number, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
type V3 = [number, number, number];

/** One reusable dynamic mesh: pre-sized vertex buffers with RGBA vertex colours, rewritten each frame, hidden when empty. */
export class FxBuf {
  readonly mesh: Mesh; private pos: Float32Array; private cols: Float32Array; private geo = new BufferGeometry(); n = 0; private cap: number;
  constructor(scene: Scene, maxTris: number, order: number, depthTest = true) {
    this.cap = maxTris;
    this.pos = new Float32Array(maxTris * 9); this.cols = new Float32Array(maxTris * 12);
    const pa = new BufferAttribute(this.pos, 3).setUsage(DynamicDrawUsage), ca = new BufferAttribute(this.cols, 4).setUsage(DynamicDrawUsage);
    this.geo.setAttribute('position', pa); this.geo.setAttribute('color', ca); this.geo.setDrawRange(0, 0);
    // forceSinglePass: a transparent DoubleSide mesh would otherwise cost 2 draw calls
    this.mesh = new Mesh(this.geo, new MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, depthTest, side: DoubleSide, fog: false, forceSinglePass: true }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = order; this.mesh.visible = false; scene.add(this.mesh);
  }
  begin() { this.n = 0; }
  tri(a: ArrayLike<number>, b: ArrayLike<number>, c: ArrayLike<number>, ca: C4, cb: C4, cc: C4) {
    if (this.n >= this.cap) return;
    const o = this.n * 9, k = this.n * 12; this.n++;
    this.pos.set(a, o); this.pos.set(b, o + 3); this.pos.set(c, o + 6);
    this.cols.set(ca, k); this.cols.set(cb, k + 4); this.cols.set(cc, k + 8);
  }
  quad(a: ArrayLike<number>, b: ArrayLike<number>, c: ArrayLike<number>, d: ArrayLike<number>, ca: C4, cb: C4, cc: C4, cd: C4) { this.tri(a, b, c, ca, cb, cc); this.tri(a, c, d, ca, cc, cd); }
  end() {
    this.geo.setDrawRange(0, this.n * 3);
    // upload only the part written this frame (the buffers are sized for the worst case)
    const pa = this.geo.attributes.position as BufferAttribute, ca = this.geo.attributes.color as BufferAttribute;
    pa.clearUpdateRanges(); ca.clearUpdateRanges();
    if (this.n > 0) { pa.addUpdateRange(0, this.n * 9); ca.addUpdateRange(0, this.n * 12); pa.needsUpdate = true; ca.needsUpdate = true; }
    this.mesh.visible = this.n > 0;
  }
  dispose() { this.geo.dispose(); (this.mesh.material as MeshBasicMaterial).dispose(); this.mesh.removeFromParent(); }
}

/** Camera-facing helpers: right / up unit vectors of the camera (world), refreshed once per frame. */
export class Facing {
  r = new Vector3(1, 0, 0); u = new Vector3(0, 1, 0); f = new Vector3(0, 0, -1); pos = new Vector3();
  from(cam: Camera | null) {
    if (!cam) return this;
    const e = cam.matrixWorld.elements;
    this.r.set(e[0], e[1], e[2]).normalize(); this.u.set(e[4], e[5], e[6]).normalize(); this.f.set(-e[8], -e[9], -e[10]).normalize(); this.pos.set(e[12], e[13], e[14]);
    return this;
  }
}
/** 4..n-ray star facing the camera: thin diamonds from the centre (bright) to the tips (alpha 0) + a soft core. */
export function star(b: FxBuf, F: Facing, c: V3, R: number, rays: number, spin: number, core: C4, tip: C4, coreR = 0.22, width = 0.11) {
  if (R <= 0.005) return;
  const w = R * width, tip0: C4 = [tip[0], tip[1], tip[2], 0];
  for (let i = 0; i < rays; i++) {
    const a = spin + (i / rays) * Math.PI * 2, len = R * (i % 2 ? 0.62 : 1);
    const dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx;
    const P = (s: number, t: number): V3 => [c[0] + F.r.x * s + F.u.x * t, c[1] + F.r.y * s + F.u.y * t, c[2] + F.r.z * s + F.u.z * t];
    const end = P(dx * len, dy * len), l = P(px * w, py * w), rr = P(-px * w, -py * w);
    b.tri(l, end, rr, tip, tip0, tip);
    b.tri(l, rr, c, tip, tip, core);
  }
  // soft hexagonal core
  const cr = R * coreR, edge: C4 = [core[0], core[1], core[2], 0];
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2, a1 = ((i + 1) / 6) * Math.PI * 2;
    const p0: V3 = [c[0] + (F.r.x * Math.cos(a0) + F.u.x * Math.sin(a0)) * cr, c[1] + (F.r.y * Math.cos(a0) + F.u.y * Math.sin(a0)) * cr, c[2] + (F.r.z * Math.cos(a0) + F.u.z * Math.sin(a0)) * cr];
    const p1: V3 = [c[0] + (F.r.x * Math.cos(a1) + F.u.x * Math.sin(a1)) * cr, c[1] + (F.r.y * Math.cos(a1) + F.u.y * Math.sin(a1)) * cr, c[2] + (F.r.z * Math.cos(a1) + F.u.z * Math.sin(a1)) * cr];
    b.tri(c, p0, p1, core, edge, edge);
  }
}
/** Soft camera-facing disc (hexagon fan, alpha a at the centre -> 0 at radius R): backing glow that keeps a star readable on bright sand. */
export function glow(b: FxBuf, F: Facing, c: V3, R: number, cc: Color, a: number) {
  if (R <= 0.005 || a <= 0.01) return;
  const ce: C4 = [cc.r, cc.g, cc.b, a], ed: C4 = [cc.r, cc.g, cc.b, 0];
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2;
    const p0: V3 = [c[0] + (F.r.x * Math.cos(a0) + F.u.x * Math.sin(a0)) * R, c[1] + (F.r.y * Math.cos(a0) + F.u.y * Math.sin(a0)) * R, c[2] + (F.r.z * Math.cos(a0) + F.u.z * Math.sin(a0)) * R];
    const p1: V3 = [c[0] + (F.r.x * Math.cos(a1) + F.u.x * Math.sin(a1)) * R, c[1] + (F.r.y * Math.cos(a1) + F.u.y * Math.sin(a1)) * R, c[2] + (F.r.z * Math.cos(a1) + F.u.z * Math.sin(a1)) * R];
    b.tri(c, p0, p1, ce, ed, ed);
  }
}
/** Faceted gem shard facing the camera (4 triangles, light / mid / dark facets give the cut-crystal read without lighting). */
export function gem(b: FxBuf, F: Facing, c: V3, s: number, spin: number, light: Color, dark: Color, a: number) {
  if (s <= 0.004 || a <= 0.01) return;
  const cs = Math.cos(spin), sn = Math.sin(spin), h = s * 1.6;
  const P = (x: number, y: number): V3 => { const xx = x * cs - y * sn, yy = x * sn + y * cs; return [c[0] + F.r.x * xx + F.u.x * yy, c[1] + F.r.y * xx + F.u.y * yy, c[2] + F.r.z * xx + F.u.z * yy]; };
  const top = P(0, h), bot = P(0, -h), l = P(-s, 0), r = P(s, 0), m = P(s * 0.15, h * 0.1);
  b.tri(top, l, m, col(light, a), col(light, a), mix(light, dark, 0.3, a));
  b.tri(top, m, r, mix(light, dark, 0.45, a), mix(light, dark, 0.3, a), mix(light, dark, 0.6, a));
  b.tri(l, bot, m, mix(light, dark, 0.35, a), mix(light, dark, 0.7, a), mix(light, dark, 0.3, a));
  b.tri(m, bot, r, mix(light, dark, 0.6, a), col(dark, a), col(dark, a));
}

interface Hit { t0: number; x: number; z: number; dx: number; dz: number }
export interface CastLite { slot: 1 | 2 | 3; tick: number; x: number; z: number; dx: number; dz: number }

export class SkillFxV {
  chime: FxBuf; cres: FxBuf; crys: FxBuf;
  private hits: (Hit | null)[] = [null, null, null];
  enabled: boolean; private rich: boolean; private st: VfxStyle;
  private cam: Camera | null = null; private blade: Object3D | null = null;
  private tipL = new Vector3(-0.31, 0.77, 0.22); private baseL = new Vector3(-0.05, 0.16, 0.05);
  private F = new Facing(); private tipW = new Vector3(); private baseW = new Vector3();
  constructor(scene: Scene, tier: Tier, enabled: boolean, style: VfxStyle) {
    this.enabled = enabled; this.rich = tier !== 'low'; this.st = style;
    this.chime = new FxBuf(scene, 320, 5); this.cres = new FxBuf(scene, 420, 5); this.crys = new FxBuf(scene, 520, 5);
  }
  /** Camera (for camera-facing sprites) and the hero sword node (Q26 blade light). The tip is the sword vertex farthest from
   *  the grip (sword origin = grip, ASSET_CONTRACT), so the kit GLB and the procedural fallback both work. */
  attach(cam: Camera, blade: Object3D | null) {
    this.cam = cam; this.blade = blade;
    if (!blade) return;
    blade.updateWorldMatrix(true, true);
    const inv = blade.matrixWorld.clone().invert(), v = new Vector3(); let best = 0;
    blade.traverse((o) => {
      const m = o as Mesh; if (!m.isMesh) return; const p = m.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p as BufferAttribute, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv); const d = v.length(); if (d > best) { best = d; this.tipL.copy(v); } }
    });
    if (best > 0.2) this.baseL.copy(this.tipL).multiplyScalar(0.2);
  }
  reset() { this.hits = [null, null, null]; }
  dispose() { this.chime.dispose(); this.cres.dispose(); this.crys.dispose(); }
  onSkillHit(slot: 1 | 2 | 3, tick: number, x: number, z: number, dx: number, dz: number) { this.hits[slot - 1] = { t0: tick, x, z, dx, dz }; }
  hitAge(slot: 1 | 2 | 3, tick: number, alpha: number): number | null { const h = this.hits[slot - 1]; return h ? this.age(h.t0, tick, alpha) : null; }
  private age(t0: number, tick: number, alpha: number) { return Math.max(0, tick - t0 - 1 + alpha); }

  update(tick: number, alpha: number, cast: CastLite | null) {
    this.chime.begin(); this.cres.begin(); this.crys.begin();
    this.F.from(this.cam);
    const S = this.st;
    if (this.enabled) {
      const h1 = this.hits[0], h2 = this.hits[1], h3 = this.hits[2];
      if (cast && cast.slot === 1 && cast.tick < SKILLS[0].hitTick) this.drawChimePrep((cast.tick - 1 + alpha) / SKILLS[0].hitTick, tick + alpha);
      if (h1) { const a = this.age(h1.t0, tick, alpha); if (a <= 12) this.drawChime(h1, a); else this.hits[0] = null; }
      if (h2) { const a = this.age(h2.t0, tick, alpha); if (a <= S.crescent.life) this.drawCrescent(h2, a); else this.hits[1] = null; }
      if (h3) {
        const a = this.age(h3.t0, tick, alpha);
        if (a <= 14) this.drawCrystal(h3, a, 1, true); else this.hits[2] = null;
      } else if (cast && cast.slot === 3 && cast.tick < SKILLS[2].hitTick) {
        // prep: the crack grows from the sim's own cast state, so a cancel (dodge / death) removes it on the same tick
        this.drawCrystal(cast, 0, Math.max(0.03, clamp01((cast.tick - 1 + alpha) / SKILLS[2].hitTick)), false);
      }
    } else if (this.hits[0] && this.age(this.hits[0].t0, tick, alpha) > 12) this.hits[0] = null;
    this.chime.end(); this.cres.end(); this.crys.end();
  }

  // ---- Chime Burst prep cue (DES-006 Q26): light gathers on the blade while the sword is raised (castPose ticks 0-8), flares on
  //      the downswing (8-10). A camera-facing glow sheath along the blade + a star at the tip (+ motes drawn into the tip in B).
  //      No ground circle. Same mesh as the burst, so Chime is still one draw call on every tier.
  private drawChimePrep(k: number, clock: number) {
    if (!this.blade) return;
    const P = this.st.chimePrep, F = this.F, b = this.chime;
    k = clamp01(k);
    this.blade.updateWorldMatrix(true, false);
    const tip = this.tipW.copy(this.tipL).applyMatrix4(this.blade.matrixWorld), base = this.baseW.copy(this.baseL).applyMatrix4(this.blade.matrixWorld);
    const env = easeOut(clamp01(k / 0.8)), flare = 1 + 0.5 * clamp01((k - 0.8) / 0.2);
    // sheath: two soft halves either side of the blade axis, perpendicular to the view direction
    const ax = tip.x - base.x, ay = tip.y - base.y, az = tip.z - base.z;
    const vx = tip.x - F.pos.x, vy = tip.y - F.pos.y, vz = tip.z - F.pos.z;
    let sx = ay * vz - az * vy, sy = az * vx - ax * vz, sz = ax * vy - ay * vx; const sl = Math.hypot(sx, sy, sz) || 1;
    const w = P.sheathW * env * flare; sx = (sx / sl) * w; sy = (sy / sl) * w; sz = (sz / sl) * w;
    const A = P.sheathA * env, cMid = mix(COL.lumen, COL.hi, 0.3, A), cEdge = col(COL.lumen, 0), cBase = col(COL.lumen, A * 0.35);
    const B0: V3 = [base.x, base.y, base.z], T0: V3 = [tip.x, tip.y, tip.z];
    for (const s of [1, -1]) {
      const bo: V3 = [base.x + sx * s * 0.6, base.y + sy * s * 0.6, base.z + sz * s * 0.6], to: V3 = [tip.x + sx * s, tip.y + sy * s, tip.z + sz * s];
      b.quad(B0, bo, to, T0, cBase, cEdge, cEdge, cMid);
    }
    // tip star: grows with the raise, slow quarter-turn spin, extra flare on the downswing
    const R = P.tipR * (0.25 + 0.75 * env) * flare;
    glow(b, F, T0, R * 0.75, COL.violet, 0.42 * P.tipA * env); // violet backing: the white/lumen star stays readable on bright sand
    star(b, F, T0, R, 4, Math.PI / 4 + k * 0.8, col(COL.white, P.tipA * env), col(COL.lumen, P.tipA * env), 0.34, 0.17);
    // B: motes spiral in from ~0.9 m and reach the tip at the strike (a few dots, never a closed ring)
    for (let i = 0; i < P.motes; i++) {
      const ph = hash(i, 21), rr = 0.95 * (1 - easeOut(clamp01(k * 1.15 - ph * 0.15))), ang = (i / P.motes) * Math.PI * 2 + clock * 0.12 + ph;
      if (rr < 0.04) continue;
      const c: V3 = [tip.x + (F.r.x * Math.cos(ang) + F.u.x * Math.sin(ang)) * rr, tip.y + (F.r.y * Math.cos(ang) + F.u.y * Math.sin(ang)) * rr, tip.z + (F.r.z * Math.cos(ang) + F.u.z * Math.sin(ang)) * rr];
      gem(b, F, c, 0.035 + 0.02 * env, ang, COL.hi, i % 2 ? COL.violet : COL.lumen, clamp01(env * 1.2));
    }
  }

  // ---- Chime Burst: ring from the feet at the hit tick (lumen -> lumen-white, no gold); B adds a thin white echo ring inside
  private drawChime(h: Hit, a: number) {
    const C = this.st.chime, R = SKILLS[0].radius, k = clamp01(a / 9), r = 0.5 + (R - 0.5) * easeOut(k), w = C.band * (1 - k * 0.65) + 0.1, al = clamp01(1 - k * k);
    const y = 0.1, N = 36, b = this.chime;
    const ring = (rad: number, wd: number, cin: C4, cout: C4) => {
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const ro = rad, ri = Math.max(0.05, rad - wd);
        b.quad([h.x + c0 * ri, y, h.z + s0 * ri], [h.x + c0 * ro, y, h.z + s0 * ro], [h.x + c1 * ro, y, h.z + s1 * ro], [h.x + c1 * ri, y, h.z + s1 * ri], cin, cout, cout, cin);
      }
    };
    ring(r, w, col(COL.lumen, al * 0.45), mix(COL.lumen, COL.hi, 0.55, al));
    if (C.echo) { const re = Math.max(0.3, r * 0.72); ring(re, 0.12 + 0.1 * (1 - k), col(COL.white, 0), col(COL.white, al * 0.85 * C.echo)); }
    const n = this.rich ? C.shards : C.shardsLow;
    const sk = clamp01(a / 12);
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + hash(i, 1) * 0.5, sp = 1.4 + hash(i, 2) * 1.8, rr = 0.6 + sp * easeOut(sk) * 1.4;
      shard(b, h.x + Math.cos(ang) * rr, 0.15 + 0.9 * sk * (0.5 + hash(i, 3)), h.z + Math.sin(ang) * rr, C.shardSize * (1 - sk * 0.6), i % 2 ? col(COL.lumen, 1 - sk) : col(COL.violet, 1 - sk), a * 3 + i);
    }
  }

  // ---- Crescent Cut: violet sheet with an orchid edge over the sim area (r 3.0, half-angle 50 deg), tilted up toward the low camera
  //      (inner edge y0, outer edge y1); B adds a light curtain rising from the edge. Appears at the hit tick, gone after `life`.
  private drawCrescent(h: Hit, a: number) {
    const C = this.st.crescent, D = SKILLS[1], R = D.radius, half = Math.acos(D.cosHalf ?? 0.642788), L = C.life, fade = clamp01(1 - (a / L) * (a / L));
    const reveal = clamp01((a + 0.4) / 2.5), Ro = R, N = 16, b = this.cres;
    const px = -h.dz, pz = h.dx;
    const yAt = (rad: number) => C.y0 + (C.y1 - C.y0) * clamp01((rad - (Ro - C.thick)) / C.thick);
    const at = (ang: number, rad: number, y = yAt(rad)): V3 => [h.x + (Math.cos(ang) * h.dx + Math.sin(ang) * px) * rad, y, h.z + (Math.cos(ang) * h.dz + Math.sin(ang) * pz) * rad];
    const inner = (t: number) => Ro - C.thick * Math.cos(t * Math.PI / 2);
    const last = Math.max(1, Math.ceil(N * reveal));
    const H = C.curtain * (0.55 + 0.45 * (1 - clamp01(a / L)));
    for (let i = 0; i < last; i++) {
      const t0 = 1 - (i / N) * 2, t1 = 1 - ((i + 1) / N) * 2, a0 = t0 * half, a1 = t1 * half, f = i === last - 1 ? 0.35 + 0.65 * clamp01(reveal * N - i) : 1;
      const o0 = at(a0, Ro), o1 = at(a1, Ro), m0 = at(a0, Ro - C.edge), m1 = at(a1, Ro - C.edge), n0 = at(a0, inner(t0)), n1 = at(a1, inner(t1));
      const al = fade * clamp01(f);
      b.quad(m0, o0, o1, m1, col(COL.orchid, al), mix(COL.orchid, COL.white, 0.5, al), mix(COL.orchid, COL.white, 0.5, al), col(COL.orchid, al));
      b.quad(n0, m0, m1, n1, col(COL.violet, al * 0.3), col(COL.violet, al * 0.95), col(COL.violet, al * 0.95), col(COL.violet, al * 0.3));
      if (H > 0.01) { // curtain: bright at the edge, fading upward; tips taper (cos) so the arc ends stay sharp
        const h0 = H * Math.cos(t0 * Math.PI / 2), h1 = H * Math.cos(t1 * Math.PI / 2);
        b.quad(o0, o1, [o1[0], o1[1] + h1, o1[2]], [o0[0], o0[1] + h0, o0[2]], mix(COL.orchid, COL.white, 0.35, al * 0.75), mix(COL.orchid, COL.white, 0.35, al * 0.75), col(COL.violet, 0), col(COL.violet, 0));
      }
    }
    const n = this.rich ? C.shards : C.shardsLow;
    const sk = clamp01(a / L);
    for (let i = 0; i < n; i++) {
      const ang = (0.5 - (i + 0.5) / n) * 2 * half, rr = Ro + 0.2 + easeOut(sk) * (0.6 + hash(i, 4) * 0.9), p = at(ang, rr, 0);
      shard(b, p[0], C.y1 + 0.5 * sk * hash(i, 5), p[2], 0.1 * (1 - sk * 0.5) * (C.curtain ? 1.25 : 1), i % 3 ? col(COL.orchid, 1 - sk) : col(COL.violet, 1 - sk), a * 3 + i);
    }
  }

  // ---- Crystal Break: lumen cracks grow during prep at the target circle (2.6 m ahead, r 1.5) — thin radial lines only, no
  //      outline / fill (Q27); lumen/violet faceted crystals with lumen-white tips burst at the hit and collapse in 14
  private drawCrystal(h: { x: number; z: number; dx: number; dz: number }, a: number, crackK: number, hit: boolean) {
    const C = this.st.crystal, D = SKILLS[2], R = D.radius, cx = h.x + h.dx * (D.ahead ?? 2.6), cz = h.z + h.dz * (D.ahead ?? 2.6), b = this.crys;
    const fade = hit ? clamp01(1 - easeIn(clamp01((a - 4) / 10))) : 1, crackA = clamp01((hit ? fade : 0.35 + 0.65 * crackK) * C.crackA * 0.8), grow = hit ? 1 : easeOut(crackK);
    for (let s = 0; s < 8; s++) {
      const ang = (s / 8) * Math.PI * 2 + hash(s, 6) * 0.5, len = R * (0.65 + 0.35 * hash(s, 7)) * grow, kink = (hash(s, 8) - 0.5) * 0.7;
      let px = cx, pz = cz; const wd = 0.1;
      for (let j = 1; j <= 3; j++) {
        const f = j / 3, aa = ang + (j === 2 ? kink : j === 3 ? -kink * 0.6 : 0), nx = px + Math.cos(aa) * (len / 3), nz = pz + Math.sin(aa) * (len / 3);
        const ox = -Math.sin(aa) * wd * (1.15 - f * 0.6), oz = Math.cos(aa) * wd * (1.15 - f * 0.6);
        b.quad([px - ox, 0.09, pz - oz], [px + ox, 0.09, pz + oz], [nx + ox * 0.7, 0.09, nz + oz * 0.7], [nx - ox * 0.7, 0.09, nz - oz * 0.7],
          mix(COL.lumen, COL.hi, hit ? 0.5 : 0.2, crackA), mix(COL.lumen, COL.hi, hit ? 0.5 : 0.2, crackA), mix(COL.lumen, COL.violet, 0.35, crackA * 0.8), mix(COL.lumen, COL.violet, 0.35, crackA * 0.8));
        px = nx; pz = nz;
      }
      if (C.crackGlints && !hit && crackK > 0.25) { // B: a small glint where each crack is growing
        const g = clamp01((crackK - 0.25) / 0.5) * (0.6 + 0.4 * Math.sin(crackK * 18 + s * 2.1));
        gem(b, this.F, [px, 0.16, pz], 0.05, s, COL.hi, COL.lumen, g);
      }
    }
    if (!hit) return;
    const rise = easeOut(clamp01(a / 3)), fall = 1 - easeIn(clamp01((a - 8) / 6)), sc = rise * fall * C.scale;
    const spec: [number, number, number, number][] = [[0, 0, 1.7, 0.3], [0.95, 0.2, 1.15, 0.24], [0, 0.95, 1.0, 0.22], [-0.95, 0.1, 1.25, 0.25], [0.1, -0.9, 0.9, 0.22]];
    if (this.rich) {
      for (let i = 0; i < spec.length; i++) pyramid(b, cx + spec[i][0], cz + spec[i][1], spec[i][3] * 1.5, spec[i][2] * 1.35 * sc, 3, i * 0.9, spec[i][0] * 0.12, spec[i][1] * 0.12);
    } else if (C.lowCrystals <= 1) {
      pyramid(b, cx, cz, 0.7, 0.85 * sc, 6, 0.3, 0, 0); // low tier: one merged crystal
    } else {
      for (let i = 0; i < Math.min(C.lowCrystals, spec.length); i++) pyramid(b, cx + spec[i][0] * 0.8, cz + spec[i][1] * 0.8, spec[i][3] * 1.6, spec[i][2] * 1.2 * sc, 3, i * 0.9, spec[i][0] * 0.1, spec[i][1] * 0.1);
    }
    const n = this.rich ? C.shards : C.shardsLow;
    const sk = clamp01(a / 14);
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + hash(i, 9), rr = 0.4 + (0.6 + hash(i, 10) * 0.9) * easeOut(sk) * C.scale, up = 0.3 + 4.2 * sk * (1 - sk) * C.scale;
      shard(b, cx + Math.cos(ang) * rr, 0.1 + up, cz + Math.sin(ang) * rr, 0.12 * (1 - sk * 0.7) * C.scale, i % 2 ? col(COL.violet, 1 - sk) : col(COL.lumen, 1 - sk), a * 2 + i);
    }
  }
}

/** Small stretched octahedron shard (8 tris). */
function shard(b: FxBuf, x: number, y: number, z: number, s: number, c: C4, spin: number) {
  const cs = Math.cos(spin), sn = Math.sin(spin), top = [x, y + s * 1.7, z], bot = [x, y - s * 1.7, z];
  const e = [[x + cs * s, y, z + sn * s], [x - sn * s, y, z + cs * s], [x - cs * s, y, z - sn * s], [x + sn * s, y, z - cs * s]];
  const c2: C4 = [c[0], c[1], c[2], c[3] * 0.8];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; b.tri(top, e[i], e[j], c, c2, c2); b.tri(bot, e[j], e[i], c2, c2, c2); }
}
/** n-sided pyramid standing on the ground: violet base, lumen faces (alternating with a violet tint = facets), lumen-white tip. */
function pyramid(b: FxBuf, x: number, z: number, r: number, h: number, n: number, yaw: number, lx: number, lz: number) {
  if (h <= 0.01) return;
  const tip = [x + lx * h, h, z + lz * h], base: number[][] = [];
  for (let i = 0; i < n; i++) { const a = yaw + (i / n) * Math.PI * 2; base.push([x + Math.cos(a) * r, 0.02, z + Math.sin(a) * r]); }
  const cb = mix(COL.violet, COL.lumen, 0.12, 0.95), ct = col(COL.hi, 1), cm = col(COL.lumen, 0.95);
  for (let i = 0; i < n; i++) b.tri(base[i], base[(i + 1) % n], tip, i % 2 ? cb : cm, i % 2 ? cm : cb, ct);
}
