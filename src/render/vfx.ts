// exp/stage1-vfx: DES-004 step 5 effects for the ?vfx=A|B options (vfxstyle.ts). Render-only, never writes the sim.
//  - hero foot ring: thin lumen line (soft edges) instead of the 0.15 m solid band; same render order (12, over warnings on
//    purpose: ADR-005 keeps the player findable), 1 draw call as before
//  - ambient crystal sparkles: ONE THREE.Points draw call, procedural star sprite in the shader (no texture), count from the
//    tier's `particles`; world-stable points tiled around the camera target, so arena and meadow share the same call
//  - hit impact: camera-facing flash rays + faceted gem shards when the sword hits crystal (Prismback), all in ONE pooled
//    dynamic mesh (timing in sim ticks); renderOrder 9 + depthTest off: over the struck enemy, under the warnings (10)
// Everything here draws BEFORE the telegraphs except the foot ring, and only uses lumen / violet / lumen-white.
import {
  BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial, AdditiveBlending, Color, Mesh, PlaneGeometry, Vector2, Vector3,
  type Scene, type Camera, type PerspectiveCamera, type WebGLRenderer,
} from 'three';
import type { QualitySettings } from './quality.ts';
import { FXC, type VfxStyle } from './vfxstyle.ts';
import { FxBuf, Facing, star, gem } from './vfxskill.ts';
import { arenaWeight } from './atmosphere.ts';

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOut = (k: number) => 1 - (1 - k) * (1 - k);
const hash = (i: number, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

/** Hero foot ring: flat quad, ring drawn in the fragment shader with derivative anti-aliasing (stays smooth at 2-4 px wide). */
export function makeHeroRing(s: VfxStyle): Mesh {
  const ext = s.ring.r + s.ring.core + s.ring.glow + 0.06;
  const geo = new PlaneGeometry(ext * 2, ext * 2);
  const mat = new ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, fog: false,
    uniforms: { uR: { value: s.ring.r }, uCore: { value: s.ring.core }, uGlow: { value: s.ring.glow }, uA: { value: s.ring.alpha }, uGA: { value: s.ring.glowA }, uExt: { value: ext },
      uCol: { value: new Color(FXC.lumen) }, uHi: { value: new Color(FXC.lumenHi) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `
      uniform float uR; uniform float uCore; uniform float uGlow; uniform float uA; uniform float uGA; uniform float uExt; uniform vec3 uCol; uniform vec3 uHi;
      varying vec2 vUv;
      void main(){
        float d = abs(length(vUv * 2.0 - 1.0) * uExt - uR);
        float aa = max(fwidth(d), 1e-4);
        float core = 1.0 - smoothstep(uCore - aa, uCore + aa, d);
        float glow = uGlow > 0.0 ? uGA * pow(1.0 - clamp(d / uGlow, 0.0, 1.0), 2.0) : 0.0;
        float a = max(core * uA, glow);
        if (a < 0.003) discard;
        gl_FragColor = vec4(mix(uCol, uHi, core * 0.45), a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const m = new Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2; m.renderOrder = 12; m.name = 'hero_ring';
  return m;
}

/** Ambient crystal sparkles. Each point has a fixed spot on a lattice that repeats every `box` metres; the vertex shader picks the
 *  copy inside the box around the camera target, so points stay put in the world (no sliding) and wrap at the box edges (faded). */
export class Sparkles {
  readonly points: Points; readonly mat: ShaderMaterial; readonly count: number;
  constructor(scene: Scene, count: number, s: VfxStyle) {
    this.count = count;
    const pos: number[] = [], seed: number[] = [];
    for (let i = 0; i < count; i++) {
      pos.push(hash(i, 1), hash(i, 2), hash(i, 3));
      seed.push(hash(i, 4), hash(i, 5), 0.5 + hash(i, 6), 0.7 + 0.6 * hash(i, 7));
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new Float32BufferAttribute(seed, 4));
    this.mat = new ShaderMaterial({
      transparent: true, depthWrite: false, blending: AdditiveBlending, fog: false,
      uniforms: {
        uCenter: { value: new Vector3() }, uBox: { value: new Vector3(30, 4.2, 30) }, uTime: { value: 0 }, uI: { value: 0 },
        uScale: { value: 400 }, uSize: { value: 0.16 * s.sparkles.size }, uFar: { value: 40 },
        uC0: { value: new Color(FXC.lumen) }, uC1: { value: new Color(FXC.violet) }, uC2: { value: new Color(FXC.lumenHi) },
      },
      vertexShader: `
        uniform vec3 uCenter; uniform vec3 uBox; uniform float uTime; uniform float uI; uniform float uScale; uniform float uSize; uniform float uFar;
        uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2;
        attribute vec4 aSeed; varying vec3 vCol; varying float vA;
        void main(){
          float t = uTime * aSeed.z;
          vec3 p = position * uBox + vec3(sin(t * 0.7 + aSeed.x * 6.283) * 0.5, t * 0.22, cos(t * 0.6 + aSeed.y * 6.283) * 0.5);
          vec3 lo = vec3(uCenter.x - uBox.x * 0.5, 0.25, uCenter.z - uBox.z * 0.5);
          vec3 w = lo + mod(p - lo, uBox);
          vec3 q = (w - lo) / uBox; // 0..1 inside the box: fade the wrap edges
          float edge = smoothstep(0.0, 0.08, q.x) * smoothstep(1.0, 0.92, q.x) * smoothstep(0.0, 0.08, q.z) * smoothstep(1.0, 0.92, q.z) * smoothstep(0.0, 0.15, q.y) * smoothstep(1.0, 0.75, q.y);
          vec4 mv = modelViewMatrix * vec4(w, 1.0);
          float dist = -mv.z;
          float tw = 0.5 + 0.5 * sin(uTime * (1.3 + aSeed.z * 1.7) + aSeed.x * 31.0); tw *= tw;
          vA = uI * edge * smoothstep(2.5, 5.0, dist) * (1.0 - smoothstep(uFar * 0.55, uFar, dist)) * (0.25 + 0.75 * tw);
          vCol = aSeed.y < 0.45 ? uC0 : aSeed.y < 0.75 ? uC1 : uC2;
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp(uSize * aSeed.w * uScale / max(dist, 0.5) * (0.7 + 0.5 * tw), 1.0, 28.0);
          if (vA < 0.004) gl_PointSize = 0.0;
        }`,
      fragmentShader: `
        uniform float uI; varying vec3 vCol; varying float vA;
        void main(){
          vec2 p = gl_PointCoord * 2.0 - 1.0;
          float core = exp(-dot(p, p) * 9.0);
          float rays = max(0.0, 1.0 - abs(p.x) * 7.0) * max(0.0, 1.0 - abs(p.y)) + max(0.0, 1.0 - abs(p.y) * 7.0) * max(0.0, 1.0 - abs(p.x));
          float f = core + 0.55 * rays;
          if (f * vA < 0.003) discard;
          gl_FragColor = vec4(vCol * f * vA, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    this.points = new Points(geo, this.mat);
    this.points.frustumCulled = false; // positions are computed in the shader
    this.points.renderOrder = 3; // with the arena halos: before the telegraphs (10), which paint over them
    this.points.name = 'vfx_sparkles';
    scene.add(this.points);
  }
  dispose() { this.points.geometry.dispose(); this.mat.dispose(); this.points.removeFromParent(); }
}

interface Impact { t0: number; x: number; y: number; z: number; kind: 0 | 1 | 2; seed: number; dx: number; dz: number }
/** hero silhouette seen from the game camera (m, render scale 1.22 included): head top incl. hair, half-width incl. cape */
const HERO_TOP = 1.95, HERO_HALF_W = 0.45;
const C_LUMEN = new Color(FXC.lumen), C_VIOLET = new Color(FXC.violet), C_HI = new Color(FXC.lumenHi), C_WHITE = new Color(FXC.white);

/** Pooled hit flashes (+ crystal shards). kind 0 normal, 1 crit (empowered), 2 crystal target. */
export class ImpactFx {
  readonly buf: FxBuf; private items: Impact[] = []; private F = new Facing(); private n = 0; private s: VfxStyle;
  constructor(scene: Scene, s: VfxStyle) { this.s = s; this.buf = new FxBuf(scene, 900, 9, false); this.buf.mesh.name = 'vfx_impact'; }
  add(tick: number, x: number, y: number, z: number, kind: 0 | 1 | 2, dx: number, dz: number) {
    if (this.items.length >= 8) this.items.shift();
    this.items.push({ t0: tick, x, y, z, kind, seed: this.n++, dx, dz });
  }
  update(tick: number, alpha: number, cam: Camera) {
    const b = this.buf, H = this.s.hit, F = this.F.from(cam);
    b.begin();
    this.items = this.items.filter((it) => {
      const a = Math.max(0, tick - it.t0 - 1 + alpha), life = H.life + (it.kind ? 1 : 0), shardLife = 12;
      if (a > Math.max(life, it.kind === 2 ? shardLife : 0)) return false;
      if (a <= life) {
        const k = clamp01(a / life), grow = easeOut(clamp01((a + 0.6) / 1.6)), al = 1 - k * k;
        const R = H.r * (it.kind === 1 ? 1.35 : it.kind === 2 ? 1.3 : 1) * (0.55 + 0.45 * grow);
        const rays = it.kind === 1 ? H.rays + 2 : H.rays;
        const tipC = it.kind === 1 ? C_VIOLET : C_LUMEN;
        star(b, F, [it.x, it.y, it.z], R, rays, it.seed * 0.7 + k * 0.4, [C_WHITE.r, C_WHITE.g, C_WHITE.b, al], [tipC.r, tipC.g, tipC.b, al * 0.95], 0.28);
      }
      if (it.kind === 2) { // faceted cyan-violet shards bouncing off the crystal armour (back toward the hero, up and sideways), ballistic in sim ticks
        const t = a / 30, sk = clamp01(a / shardLife), n = H.shards;
        for (let i = 0; i < n; i++) {
          const ang = Math.atan2(-it.dz, -it.dx) + (hash(it.seed * 13 + i, 11) - 0.5) * 2.8, sp = 1.4 + 2.4 * hash(it.seed * 13 + i, 12), up = 2.4 + 3.0 * hash(it.seed * 13 + i, 13);
          const px = it.x + Math.cos(ang) * sp * t, pz = it.z + Math.sin(ang) * sp * t, py = Math.max(0.1, it.y + up * t - 4.9 * t * t);
          gem(b, F, [px, py, pz], H.shardSize * (0.6 + 0.5 * hash(i, 14)) * (1 - sk * 0.5), a * 0.5 + i, i % 2 ? C_HI : C_LUMEN, C_VIOLET, 1 - sk * sk);
        }
      }
      return true;
    });
    b.end();
  }
  dispose() { this.buf.dispose(); }
}

/** Owner of the DES-004 step 5 stage effects for one level build. */
export class StageVfx {
  readonly sparkles: Sparkles; readonly impact: ImpactFx;
  private fieldI: number; private bright: number;
  private size = new Vector2();
  readonly style: VfxStyle;
  constructor(scene: Scene, q: QualitySettings, style: VfxStyle) {
    this.style = style;
    this.sparkles = new Sparkles(scene, Math.max(8, Math.round(q.particles * style.sparkles.share)), style);
    this.impact = new ImpactFx(scene, style);
    this.fieldI = style.sparkles.field[q.tier]; this.bright = style.sparkles.bright;
  }
  /** Where a player hit flashes; returns the flash height (the burst particles start just below it). Small foes: upper body; the
   *  boss: the near face of the crystal armour on the hero's sword-hand side, chest height. The camera sits behind the hero and
   *  the hero is drawn after every effect, so a spark straight beyond the hero at body height would land behind the hero's
   *  head (r0 baseline: "tiny and hidden by the hero"): in that case only, it is lifted just over the head silhouette. */
  onHit(tick: number, ex: number, ez: number, p: { x: number; z: number; fx: number; fz: number }, kind: 0 | 1 | 2, bossR: number, cam: Vector3) {
    let dx = ex - p.x, dz = ez - p.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const H = this.style.hit;
    if (kind === 2) {
      const fl = Math.hypot(p.fx, p.fz) || 1, rx = -p.fz / fl, rz = p.fx / fl;
      const x = ex - dx * bossR * 0.85 + rx * 0.55, z = ez - dz * bossR * 0.85 + rz * 0.55, y = this.lift(x, z, 1.25, H.r * 1.15, p, cam);
      this.impact.add(tick, x, y, z, 2, dx, dz);
      return y;
    }
    const y = this.lift(ex, ez, H.y, H.r * (kind === 1 ? 1.35 : 1), p, cam);
    this.impact.add(tick, ex, y, ez, kind, dx, dz);
    return y;
  }
  private lift(x: number, z: number, y: number, R: number, p: { x: number; z: number }, cam: Vector3) {
    const hx = p.x - cam.x, hz = p.z - cam.z, hd = Math.hypot(hx, hz) || 1, ux = hx / hd, uz = hz / hd;
    const sx = x - cam.x, sz = z - cam.z, along = sx * ux + sz * uz, lat = Math.abs(-sx * uz + sz * ux);
    if (along <= hd || lat > (HERO_HALF_W * along) / hd + R) return y; // not behind the hero on screen
    const yLine = cam.y - ((cam.y - HERO_TOP) / hd) * along; // the camera -> head-top sightline, continued past the hero
    return Math.max(y, yLine + R * 0.7);
  }
  update(tick: number, alpha: number, time: number, cam: PerspectiveCamera, target: Vector3, playerZ: number, renderer: WebGLRenderer) {
    this.impact.update(tick, alpha, cam);
    const u = this.sparkles.mat.uniforms, w = arenaWeight(playerZ);
    const I = (this.fieldI + (1 - this.fieldI) * w) * this.bright;
    this.sparkles.points.visible = I > 0.01;
    u.uI.value = I; u.uTime.value = time; u.uCenter.value.copy(target);
    renderer.getDrawingBufferSize(this.size);
    u.uScale.value = this.size.y / (2 * Math.tan((cam.fov * Math.PI) / 360));
    u.uFar.value = (cam.far || 60) * 0.85;
  }
  dispose() { this.sparkles.dispose(); this.impact.dispose(); }
}
