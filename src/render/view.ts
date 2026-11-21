// Three.js render layer. Reads sim state (never writes it). Interpolates between fixed ticks.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, HemisphereLight, DirectionalLight, Mesh, PlaneGeometry, CanvasTexture,
  Group, Object3D, Vector3, Fog, InstancedMesh, Matrix4, Quaternion, Euler, SRGBColorSpace, MeshLambertMaterial,
  MeshBasicMaterial, LinearMipmapLinearFilter, type Material, PCFShadowMap, NeutralToneMapping, Shape as TShape, ShapeGeometry, RingGeometry, ShaderMaterial,
} from 'three';
import type { World, Actor, Telegraph, SimEvent } from '../../shared/sim/world.ts';
import { LEVEL, type Shape } from '../../shared/data/level.ts';
import { PLAYER, CONE_INNER_R } from '../../shared/data/tuning.ts';
import { makeHero, makePuffcap, makeThornling, makePrismback, makeProp, flattenPropMerged, PAL } from './models.ts';
import { Particles, Rings, telegraphMaterial, blobShadow } from './fx.ts';
import { TIERS, type QualitySettings } from './quality.ts';
import { SkillFx, castPose } from './skillfx.ts';
import { DEFAULT_TONE, type Tone } from './tones.ts';
import { makeArenaFloor, makeArenaRuins, type ArenaFloor } from './arena.ts';
import { ARENA_ATMOS, BASE_SUN_OFFSET, arenaWeight, makeGlowHalos, makeLightShafts } from './atmosphere.ts';
import { openingFromQuery, openingTone, openingPathFill, nearGuide, patchGate, patchHeroRim, addOpeningProps } from './opening.ts';

const TELE_NORMAL = 0xff7a1a, TELE_HEAVY = 0xff3355;
const HEAVY = new Set(['slam', 'charge']);
const BOUNDS = { x0: -34, x1: 34, z0: -100, z1: 16 };

/** Signed distance (negative inside) from a point to the union of walkable shapes (all gates treated open). */
export function walkSDF(x: number, z: number): number {
  let best = 1e9;
  for (const s of LEVEL.walkable) best = Math.min(best, shapeSDF(s, x, z));
  return best;
}
function shapeSDF(s: Shape, x: number, z: number) {
  if (s.type === 'circle') return Math.hypot(x - s.x, z - s.z) - s.r;
  const abx = s.bx - s.ax, abz = s.bz - s.az;
  const k = Math.max(0, Math.min(1, ((x - s.ax) * abx + (z - s.az) * abz) / (abx * abx + abz * abz)));
  return Math.hypot(x - (s.ax + abx * k), z - (s.az + abz * k)) - s.r;
}

/** Big props that may stand between the camera and the player: faded so they never hide the player or a telegraph. */
interface Occluder { obj: Object3D; r: number; h: number; mats: Material[]; f: number; actor?: Actor; twins: Mesh[]; parts: Mesh[]; }
let STAR_GEO: ShapeGeometry | null = null;
function starGeo() {
  if (STAR_GEO) return STAR_GEO;
  const s = new TShape();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.07 : 0.17; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  return (STAR_GEO = new ShapeGeometry(s));
}
interface ActorView { a: Actor; root: Group; model: Group; parts: Record<string, Object3D>; px: number; pz: number; cx: number; cz: number; shadow: Mesh; stars: Group; flash: number; deathT: number; hopH: number; }

export class View {
  renderer: WebGLRenderer; scene = new Scene(); camera: PerspectiveCamera;
  hemi: HemisphereLight; sun: DirectionalLight;
  q: QualitySettings = TIERS.medium; tone: Tone = DEFAULT_TONE;
  particles!: Particles; rings!: Rings;
  /** DES-001 player skill VFX; `?vfx=0` turns them off (A/B draw-call measurement only) */
  skillFx: SkillFx | null = null;
  readonly vfx = new URLSearchParams(location.search).get('vfx') !== '0';
  private actors = new Map<number, ActorView>();
  private teles = new Map<number, { t: Telegraph; m: Mesh; mat: any }>();
  private gates = new Map<string, { g: Object3D; open: boolean; y: number }>();
  private pillars: Object3D[] = [];
  private occluders: Occluder[] = [];
  private playerMark: Mesh | null = null;
  private springGem: Object3D | null = null;
  private flames: Object3D[] = [];
  private arenaFloor: ArenaFloor | null = null;
  private arenaRuins: Group | null = null;
  /** DES-004 step 1 (arena light + atmosphere); `?atmos=0`, `?glow=0`, `?rays=0` switch parts off for A/B shots */
  private readonly flags = new URLSearchParams(location.search);
  atmosOn = this.flags.get('atmos') !== '0';
  /** ?opening=A|B: opening-scene look prototypes (opening.ts, docs/qa/opening-v01). null = the current look; every hook below is skipped */
  readonly opening = openingFromQuery(this.flags);
  private openingFx: ReturnType<typeof addOpeningProps> | null = null;
  private glow: { mesh: Mesh; mat: ShaderMaterial } | null = null;
  private shafts: { mesh: Mesh; mat: ShaderMaterial } | null = null;
  /** 0 meadow … 1 arena; exposed for QA */
  atmosW = 0;
  private sunOffset = new Vector3().copy(BASE_SUN_OFFSET);
  env = new Group();
  private camTarget = new Vector3(); private camPos = new Vector3(); private shake = 0;
  /** DES-006 §1 pull-back: smoothed base pose (camBase), current pull amount (0 = low angle), hold timer, scratch camera for the visibility test */
  private camBase = new Vector3(); private camPull = 0; private camPullHold = 0; private noPull = /[?&]nopull\b/.test(location.search); /* QA only: ?nopull = the pre-pull-back camera, for before/after */ private pullCam = new PerspectiveCamera(48, 16 / 9, 0.5, 90); private pullPts: number[] = [];
  time = 0;
  pixelRatio = 1;
  /** shared uniform: decoration closer than this (m) to the camera dithers out so it never hides the action */
  nearFadeU = { value: 9 };

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = NeutralToneMapping; this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.type = PCFShadowMap;
    this.camera = new PerspectiveCamera(48, 16 / 9, 0.5, 90);
    this.hemi = new HemisphereLight(0xcfeaff, 0x7fae6a, 1.6);
    this.sun = new DirectionalLight(0xfff1d6, 2.2);
    this.sun.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50 });
    this.sun.shadow.bias = -0.0015;
    this.scene.add(this.hemi, this.sun, this.sun.target, this.env);
    this.resize();
  }

  setQuality(q: QualitySettings, ratio?: number) {
    this.q = q;
    this.pixelRatio = Math.min(ratio ?? q.maxPixelRatio, q.maxPixelRatio, window.devicePixelRatio || 1);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.shadowMap.enabled = q.shadows;
    this.sun.castShadow = q.shadows;
    this.resize();
  }
  setPixelRatio(r: number) { this.pixelRatio = Math.min(r, this.q.maxPixelRatio); this.renderer.setPixelRatio(this.pixelRatio); this.resize(); }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 1 ? 62 : 48; // portrait fallback: widen
    this.camera.updateProjectionMatrix();
  }

  applyTone(t: Tone) {
    if (this.opening) t = openingTone(t, this.opening);
    this.tone = t;
    this.scene.background = new Color(t.fog);
    this.scene.fog = new Fog(t.fog, t.fogNear, t.fogFar);
    this.hemi.color.set(t.hemiSky); this.hemi.groundColor.set(t.hemiGround); this.hemi.intensity = t.hemiI;
    this.sun.color.set(t.sun); this.sun.intensity = t.sunI;
    this.renderer.toneMappingExposure = (t.exposure ?? 1.05) * 0.95;
    this.atmosW = -1; // force the next applyAtmosphere() to rewrite every value
  }

  /** Blend the tone (meadow) toward the arena atmosphere by w (0..1). Only writes when w moves. */
  private applyAtmosphere(w: number) {
    if (!this.atmosOn) w = 0;
    if (Math.abs(w - this.atmosW) < 0.002) return;
    this.atmosW = w;
    const t = this.tone, A = ARENA_ATMOS, fog = this.scene.fog as Fog;
    fog.color.set(t.fog).lerp(TMP_C.set(A.fog), w);
    (this.scene.background as Color).copy(fog.color);
    fog.near = t.fogNear + (A.fogNear - t.fogNear) * w; fog.far = t.fogFar + (A.fogFar - t.fogFar) * w;
    // Perf only, no visible change: anything deeper than fog.far is drawn in pure fog colour (= background), so cull it.
    // +2 m keeps fog-free halos of crystals that sit right at the fog edge.
    if (this.camera.far !== fog.far + 2) { this.camera.far = fog.far + 2; this.camera.updateProjectionMatrix(); }
    this.hemi.color.set(t.hemiSky).lerp(TMP_C.set(A.hemiSky), w);
    this.hemi.groundColor.set(t.hemiGround).lerp(TMP_C.set(A.hemiGround), w);
    this.hemi.intensity = t.hemiI + (A.hemiI - t.hemiI) * w;
    this.sun.color.set(t.sun).lerp(TMP_C.set(A.sun), w);
    this.sun.intensity = t.sunI + (A.sunI - t.sunI) * w;
    this.sunOffset.copy(BASE_SUN_OFFSET).lerp(A.sunOffset, w);
  }

  // ------------------------------------------------------------------ environment
  buildLevel(world: World, seed = 1) {
    this.arenaFloor?.material.map?.dispose();
    this.arenaFloor?.material.dispose();
    this.arenaFloor?.geometry.dispose();
    this.arenaRuins?.traverse((object) => {
      if (object instanceof InstancedMesh) {
        object.dispose();
        object.geometry.dispose();
        (object.material as Material).dispose();
      }
    });
    for (const fx of [this.glow, this.shafts]) { fx?.mesh.geometry.dispose(); fx?.mat.dispose(); }
    this.glow = this.shafts = null;
    this.openingFx?.dispose(); this.openingFx = null;
    this.env.clear();
    this.flames = []; this.pillars = []; this.gates.clear(); this.occluders = [];
    // ground canvas texture (paths drawn from the same LEVEL data the sim uses)
    const W = this.q.groundRes / 2, H = this.q.groundRes;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d')!;
    const sx = W / (BOUNDS.x1 - BOUNDS.x0), sz = H / (BOUNDS.z1 - BOUNDS.z0);
    const U = (x: number) => (x - BOUNDS.x0) * sx, V = (z: number) => (z - BOUNDS.z0) * sz;
    const t = this.tone;
    const grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, hex(t.grassB)); grad.addColorStop(1, hex(t.grassA));
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    const arena = LEVEL.walkable.find((shape) => shape.id === 'arena' && shape.type === 'circle');
    if (arena?.type === 'circle') {
      const x = U(arena.x), z = V(arena.z);
      const grove = g.createRadialGradient(x, z, 6 * sx, x, z, 31 * sx);
      grove.addColorStop(0, '#526f65');
      grove.addColorStop(0.44, '#526f65e6');
      grove.addColorStop(1, '#526f6500');
      g.fillStyle = grove;
      g.fillRect(0, 0, W, H);
    }
    let rs = seed * 9301 + 49297; const rnd = () => ((rs = (rs * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < W * H / 60; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,40,0,0.06)'; g.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 3, 2 + rnd() * 3); }
    const drawShapes = (pad: number, style: string | CanvasGradient) => {
      g.fillStyle = style;
      for (const s of LEVEL.walkable) {
        g.beginPath();
        if (s.type === 'circle') { g.arc(U(s.x), V(s.z), (s.r + pad) * sx, 0, Math.PI * 2); g.fill(); }
        else { g.lineCap = 'round'; g.strokeStyle = style; g.lineWidth = (s.r + pad) * 2 * sx; g.moveTo(U(s.ax), V(s.az)); g.lineTo(U(s.bx), V(s.bz)); g.stroke(); }
      }
    };
    drawShapes(0.9, hex(t.pathEdge, 0.55));
    drawShapes(0.15, hex(t.pathEdge));
    drawShapes(-0.25, this.opening ? openingPathFill(g, this.opening, V) : hex(t.path));
    for (let i = 0; i < W * H / 90; i++) { const x = rnd() * W, y = rnd() * H; g.fillStyle = 'rgba(120,90,60,0.07)'; g.fillRect(x, y, 3, 2); }
    const tex = new CanvasTexture(c); tex.colorSpace = SRGBColorSpace; tex.anisotropy = 4; tex.minFilter = LinearMipmapLinearFilter;
    const ground = new Mesh(new PlaneGeometry(BOUNDS.x1 - BOUNDS.x0, BOUNDS.z1 - BOUNDS.z0), new MeshLambertMaterial({ map: tex }));
    ground.rotation.x = -Math.PI / 2; ground.position.set((BOUNDS.x0 + BOUNDS.x1) / 2, 0, (BOUNDS.z0 + BOUNDS.z1) / 2);
    ground.receiveShadow = true; this.env.add(ground);
    if (arena?.type === 'circle') {
      this.arenaFloor = makeArenaFloor(arena, this.q.groundRes, seed);
      this.arenaRuins = makeArenaRuins(arena, seed);
      this.env.add(this.arenaFloor, this.arenaRuins);
      if (this.atmosOn && this.q.glow && this.flags.get('glow') !== '0') { this.glow = makeGlowHalos(arena); this.env.add(this.glow.mesh); }
      if (this.atmosOn && this.q.rays && this.flags.get('rays') !== '0') { this.shafts = makeLightShafts(arena); this.env.add(this.shafts.mesh); }
    }
    const outer = new Mesh(new PlaneGeometry(400, 400), new MeshLambertMaterial({ color: t.grassA }));
    outer.rotation.x = -Math.PI / 2; outer.position.y = -0.02; this.env.add(outer);

    // decoration scatter (client-only)
    const place: Record<string, Matrix4[]> = {};
    const add = (name: string, x: number, z: number, s: number, rot: number) => {
      if (this.opening && name === 'crystal_cluster' && nearGuide(this.opening, x, z)) return; // the opening guide crystal takes this spot
      (place[name] ??= []).push(new Matrix4().compose(new Vector3(x, 0, z), new Quaternion().setFromEuler(new Euler(0, rot, 0)), new Vector3(s, s, s)));
    };
    const dens = this.q.decoDensity;
    const tries = Math.round(2600 * dens);
    for (let i = 0; i < tries; i++) {
      const x = BOUNDS.x0 + rnd() * (BOUNDS.x1 - BOUNDS.x0), z = BOUNDS.z0 + rnd() * (BOUNDS.z1 - BOUNDS.z0);
      const d = walkSDF(x, z), r = rnd(), rot = rnd() * 6.28;
      if (d > 2.2 && d < 16) { if (r < 0.06 + 0.25 / (1 + d * 0.3)) add(t.treeMix[Math.floor(rnd() * t.treeMix.length)], x, z, 0.8 + rnd() * 0.6, rot); }
      else if (d > 0.4 && d <= 2.2) {
        if (r < 0.05) add('rock_a', x, z, 0.6 + rnd() * 0.7, rot);
        else if (r < 0.09) add('bush', x, z, 0.7 + rnd() * 0.6, rot);
        else if (r < 0.2) add('flower_patch', x, z, 0.8 + rnd() * 0.6, rot);
        else if (r < 0.225) add('crystal_cluster', x, z, 0.6 + rnd() * 0.8, rot);
        else if (r < 0.245) add('mushroom_glow', x, z, 0.8 + rnd() * 0.6, rot);
      } else if (d >= 16 && r < 0.05) add('tree_pine', x, z, 1 + rnd() * 0.5, rot);
    }
    // Keep the entry open and let small rocks and flowers mark the arena rim.
    if (arena?.type === 'circle') {
      for (let i = 0; i < 26; i++) {
        const angle = i * Math.PI / 13, radius = arena.r + 0.7 + rnd() * 0.7;
        const x = arena.x + Math.cos(angle) * radius, z = arena.z + Math.sin(angle) * radius;
        if (Math.abs(x - arena.x) < 3.6 && z > arena.z) continue;
        add(i % 3 === 0 ? 'rock_a' : 'flower_patch', x, z, 0.85 + rnd() * 0.4, rnd() * Math.PI * 2);
      }
    }
    // Opaque batches are drawn in material.id order, which decides the winner where two surfaces tie in depth. Before batching,
    // each source material had one near-fade clone, created in order of first use; keep that order: one clone per batch, created
    // in the order of the first source material the batch contains.
    const rank = new Map<Material, number>();
    const batches: { name: string; mats: Matrix4[]; part: ReturnType<typeof flattenPropMerged>[number] }[] = [];
    for (const [name, mats] of Object.entries(place)) for (const part of flattenPropMerged(name, rank)) batches.push({ name, mats, part });
    batches.sort((x, y) => x.part.rank - y.part.rank);
    for (const { name, mats, part } of batches) {
      const mat = nearFade(part.material, this.nearFadeU);
      const im = new InstancedMesh(part.geometry, mat, mats.length);
      mats.forEach((m, i) => im.setMatrixAt(i, new Matrix4().multiplyMatrices(m, part.matrix)));
      im.castShadow = name.startsWith('tree'); im.computeBoundingSphere();
      this.env.add(im);
    }
    // landmarks
    const put = (name: string, x: number, z: number, rot = 0, s = 1) => { const o = makeProp(name); o.position.set(x, 0, z); o.rotation.y = rot; o.scale.setScalar(s); this.env.add(o); return o; };
    put('tent', -3.6, -1.2, 0.4); const fire = put('campfire', 1.6, 1.2);
    this.flames = ['flame', 'flame2', 'campfire_flame'].map((n) => fire.getObjectByName(n)).filter(Boolean) as Object3D[];
    put('signpost', 2.6, -4.2, -0.5); put('lantern_post', -2.4, -6); put('lantern_post', 2.8, -10);
    put('fence', -4.5, 3.5, 0.3); put('fence', 4.8, 3.2, -0.4);
    put('lantern_post', 6.5, -44); put('lantern_post', -0.4, -46);
    const spring = put('lumen_spring', LEVEL.spring.x, LEVEL.spring.z);
    this.springGem = spring.getObjectByName('gem') ?? null;
    for (const pl of LEVEL.pillars) { const o = put('crystal_pillar', pl.x, pl.z, pl.x * 0.3); this.pillars.push(o); this.addOccluder(o, pl.r + 0.2, 4.5); }
    for (const gd of LEVEL.gates) {
      const gate = put('crystal_gate', gd.x, gd.z, Math.atan2(-gd.dirz, gd.dirx));
      const open = world.gates[gd.id];
      gate.position.y = open ? -4 : 0; gate.visible = !open;
      this.gates.set(gd.id, { g: gate, open, y: gate.position.y });
      this.addOccluder(gate, 3.2, 3.0);
      if (this.opening) patchGate(this.occluders[this.occluders.length - 1].mats, this.opening);
    }
    put('lantern_post', -6, -63.5); put('lantern_post', 2, -63.5);
    if (this.opening) this.openingFx = addOpeningProps(this.env, this.opening);
    // actors
    for (const v of this.actors.values()) this.scene.remove(v.root);
    this.actors.clear();
    for (const a of world.actors) this.addActor(a);
    // always-visible player marker (drawn over everything, so the player is findable behind any prop)
    if (!this.playerMark) {
      this.playerMark = new Mesh(new RingGeometry(0.55, 0.7, 32), new MeshBasicMaterial({ color: PAL.lumen, transparent: true, opacity: 0.85, depthTest: false, depthWrite: false }));
      this.playerMark.rotation.x = -Math.PI / 2; this.playerMark.renderOrder = 12; this.scene.add(this.playerMark);
    }
    if (!this.particles) { this.particles = new Particles(this.scene, this.q.particles); this.rings = new Rings(this.scene); }
    // pooled skill VFX: allocated here (level build), never per cast
    this.skillFx?.dispose(); this.skillFx = new SkillFx(this.scene, this.q.tier, this.vfx);
  }

  private addActor(a: Actor) {
    const model = a.kind === 'player' ? makeHero() : a.kind === 'puffcap' ? makePuffcap() : a.kind === 'thornling' ? makeThornling() : makePrismback();
    const root = new Group(); root.add(model);
    root.scale.setScalar(a.kind === 'prismback' ? 1.05 : 1.22); // render-only: chibi read on small screens (hitbox unchanged)
    const parts: Record<string, Object3D> = {};
    model.traverse((o) => { if (o.name) parts[o.name] = o; });
    if (a.kind === 'prismback') { // private materials so stun glow doesn't leak to scenery
      parts.prismback_shell?.traverse((o) => { const m = o as Mesh; if (m.isMesh) m.material = (m.material as Material).clone(); });
    }
    if (a.kind === 'prismback') this.addOccluder(root, a.r, 3.6, a);
    if (a.kind === 'player') { // transparent pass after telegraphs (opacity 1): the player is never tinted/hidden by a warning area
      model.traverse((o) => { const m = o as Mesh; if (!m.isMesh) return; const own = (m.material as Material).clone(); own.transparent = true; own.depthWrite = true; m.material = own; m.renderOrder = 13; });
      if (this.opening) patchHeroRim(parts.hero_head, this.opening);
    }
    const shadow = blobShadow(a.r); root.add(shadow);
    const stars = new Group();
    for (let i = 0; i < 3; i++) { const s = new Mesh(starGeo(), new MeshBasicMaterial({ color: PAL.gold, transparent: true, depthWrite: false, depthTest: false })); s.renderOrder = 11; stars.add(s); }
    stars.visible = false; root.add(stars);
    this.scene.add(root);
    this.actors.set(a.id, { a, root, model, parts, px: a.x, pz: a.z, cx: a.x, cz: a.z, shadow, stars, flash: 0, deathT: 0, hopH: a.kind === 'prismback' ? 4.2 : a.kind === 'puffcap' ? 1.2 : 1.2 });
  }

  /** Call right before each sim step to keep previous positions for interpolation. */
  beforeTick() { for (const v of this.actors.values()) { v.px = v.a.x; v.pz = v.a.z; } }

  onEvents(evts: SimEvent[], world: World) {
    for (const e of evts) {
      switch (e.t) {
        case 'hit': {
          const v = [...this.actors.values()].find((x) => x.a.id === e.target);
          if (v) v.flash = 0.18;
          this.particles.burst(e.x, 0.9, e.z, e.byPlayer ? (e.crit ? PAL.gold : 0xffffff) : 0xff5a6a, e.crit ? 14 : 8, 3.2, 2.5, 0.45, e.crit ? 1.4 : 1);
          if (!e.byPlayer) this.shake = Math.max(this.shake, 0.35);
          else if (e.crit) this.shake = Math.max(this.shake, 0.15);
          break;
        }
        case 'swing': {
          const p = world.player;
          this.rings.arc(p.x, p.z, Math.atan2(-p.fx, -p.fz), PLAYER.combo[e.step].range + 0.3, e.step === 2 ? PAL.gold : PAL.lumen, e.step);
          break;
        }
        case 'skill': break; // legacy Chime event: its visuals are now the skill-hit ring (DES-001 §2)
        case 'skill-hit': this.skillFx?.onSkillHit(e.slot, world.tick, e.x, e.z, e.dx, e.dz); break;
        case 'perfect': this.rings.ring(e.x, e.z, 0.4, 2.6, 0xffffff, 0.35, 1); this.particles.burst(e.x, 1, e.z, PAL.lumen, 16, 4, 3, 0.6); break;
        case 'dodge': { const p = world.player; this.particles.burst(p.x, 0.15, p.z, 0xe9dcc4, 6, 1.5, 0.6, 0.4, 1.2, 2); break; }
        case 'death': { const v = this.actors.get(e.id); if (v) { this.particles.burst(v.a.x, 0.8, v.a.z, v.a.kind === 'prismback' ? PAL.lumen : PAL.blossom, v.a.kind === 'prismback' ? 60 : 18, 4, 4, 0.9); } break; }
        case 'pillar-break': { const pl = LEVEL.pillars[e.i]; this.pillars[e.i].visible = false; this.particles.burst(pl.x, 2, pl.z, PAL.violet, 36, 5, 5, 1.0, 1.6); this.shake = 0.6; break; }
        case 'stun': this.shake = Math.max(this.shake, e.long ? 0.5 : 0.25); break;
        case 'gate': { const gv = this.gates.get(e.id); if (gv) { gv.open = e.open; gv.g.visible = true; } break; }
        case 'heal': { const p = world.player; this.particles.burst(p.x, 1, p.z, 0x8dffb0, 12, 1.2, 2, 0.8, 1, -1); break; }
        case 'boss-phase': case 'boss-roar': { const b = world.boss; this.rings.ring(b.x, b.z, 1, 9, TELE_HEAVY, 0.6, 0.6); this.shake = 0.5; break; }
        case 'respawn': case 'pillars-regrow': for (let i = 0; i < this.pillars.length; i++) this.pillars[i].visible = world.pillars[i].alive; break;
      }
    }
  }

  // ------------------------------------------------------------------ per-frame
  render(world: World, alpha: number, dt: number) {
    this.time += dt;
    // telegraphs
    const alive = new Set<number>();
    const boss = world.tele.length ? this.actors.get(this.findBossId()) : undefined; // DES-006 §2: telegraph edge fades under the boss body
    for (const t of world.tele) {
      alive.add(t.id);
      let tv = this.teles.get(t.id);
      if (!tv) tv = this.makeTele(t);
      tv.mat.uniforms.uProg.value = 1 - Math.max(0, t.t) / t.total;
      tv.mat.uniforms.uTime.value = this.time;
      if (boss?.a.alive) tv.mat.uniforms.uBoss.value.set(boss.root.position.x, boss.root.position.z, boss.a.r); else tv.mat.uniforms.uBoss.value.set(0, 0, 0);
    }
    for (const [id, tv] of this.teles) {
      if (alive.has(id)) continue;
      if (tv.t.area && !world.ps.down) {
        const col = HEAVY.has(tv.t.atk.id) ? TELE_HEAVY : TELE_NORMAL;
        if (tv.t.shape === 'circle') this.rings.ring(tv.t.x, tv.t.z, tv.t.r * 0.5, tv.t.r * 1.05, col, 0.25, 0.9);
        this.particles.burst(tv.t.x, 0.3, tv.t.z, col, tv.t.r > 3 ? 18 : 8, tv.t.r * 1.5, 2, 0.4);
      }
      this.scene.remove(tv.m); tv.m.geometry.dispose(); tv.mat.dispose(); this.teles.delete(id);
    }
    // actors
    for (const v of this.actors.values()) this.animateActor(v, world, alpha, dt);
    // gates
    for (const gv of this.gates.values()) {
      const target = gv.open ? -4 : 0;
      gv.y += (target - gv.y) * Math.min(1, dt * 3);
      gv.g.position.y = gv.y; if (gv.open && gv.y < -3.9) gv.g.visible = false;
    }
    for (const f of this.flames) { f.scale.y = 0.85 + Math.sin(this.time * 17 + f.id) * 0.15; f.rotation.y += dt * 2; }
    this.openingFx?.update(this.time);
    if (this.springGem) { this.springGem.position.y = 1.3 + Math.sin(this.time * 2) * 0.12; this.springGem.rotation.y += dt; }
    this.particles.update(dt); this.rings.update(dt);
    this.skillFx?.update(world.tick, alpha, world.ps.cast);
    const pv = this.actors.get(world.player.id);
    this.applyAtmosphere(pv ? arenaWeight(pv.root.position.z) : 0);
    const w = this.atmosW;
    if (this.glow) { this.glow.mesh.visible = w > 0.01; this.glow.mat.uniforms.uI.value = 0.55 * w; this.glow.mat.uniforms.uTime.value = this.time; }
    if (this.shafts) { this.shafts.mesh.visible = w > 0.01; this.shafts.mat.uniforms.uI.value = 0.16 * w; }
    this.updateCamera(world, dt);
    this.updateOccluders(world, dt);
    this.renderer.render(this.scene, this.camera);
  }

  private makeTele(t: Telegraph) {
    const color = HEAVY.has(t.atk.id) ? TELE_HEAVY : TELE_NORMAL;
    let geo: PlaneGeometry, shape = 0;
    if (t.shape === 'line') { geo = new PlaneGeometry(t.w, t.r); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -t.r / 2); shape = 2; }
    else { geo = new PlaneGeometry(t.r * 2, t.r * 2); geo.rotateX(-Math.PI / 2); shape = t.shape === 'cone' ? 1 : 0; }
    const mat = telegraphMaterial(color, shape, t.cos, CONE_INNER_R / t.r);
    const m = new Mesh(geo, mat);
    m.position.set(t.x, 0.06 + this.teles.size * 0.004, t.z);
    if (t.shape !== 'circle') m.rotation.y = Math.atan2(-t.dx, -t.dz);
    m.renderOrder = 10; // drawn after (and on top of) every opaque object: a warning is never hidden by the boss or a pillar
    if (t.shape === 'line' && t.owner === this.findBossId()) {
      // charge line follows the boss start position (already set); clip visually to arena handled by fog/edge
    }
    this.scene.add(m);
    const tv = { t, m, mat }; this.teles.set(t.id, tv);
    return tv;
  }
  private findBossId() { for (const v of this.actors.values()) if (v.a.kind === 'prismback') return v.a.id; return -1; }

  private animateActor(v: ActorView, world: World, alpha: number, dt: number) {
    const a = v.a, T = this.time;
    const x = v.px + (a.x - v.px) * alpha, z = v.pz + (a.z - v.pz) * alpha;
    v.root.position.set(x, 0, z);
    const yaw = Math.atan2(a.fx, a.fz);
    let dy = yaw - v.model.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    v.model.rotation.y += dy * Math.min(1, dt * (a.kind === 'prismback' ? 6 : 16));
    v.flash = Math.max(0, v.flash - dt);
    const hit = v.flash > 0 ? 1 + v.flash * 0.9 : 1;
    v.model.position.set(0, 0, 0); v.model.rotation.x = 0; v.model.rotation.z = 0; v.model.scale.set(hit, hit, hit);
    v.stars.visible = false;
    if (!a.alive) {
      v.deathT += dt; const k = Math.max(0, 1 - v.deathT / 0.45);
      v.model.scale.setScalar(k * 1.1); v.shadow.visible = k > 0; v.root.visible = k > 0;
      return;
    }
    v.root.visible = a.kind !== 'prismback' || world.bossStarted || dist2(world.player, a) < 900;
    const P = v.parts;
    if (a.kind === 'player') {
      const ps = world.ps;
      const sword = P.hero_sword, head = P.hero_head;
      if (ps.down) { v.model.rotation.z = Math.PI / 2 * 0.9; v.model.position.y = 0.2; return; }
      const moving = ps.moving && ps.dodgeT <= 0;
      if (moving) { v.model.position.y = Math.abs(Math.sin(T * 13)) * 0.07; v.model.rotation.x = 0.12; }
      if (head) head.rotation.z = moving ? Math.sin(T * 13) * 0.06 : Math.sin(T * 2) * 0.03;
      if (sword) {
        const cast = ps.cast, fa = this.skillFx ? this.skillFx.hitAge(1, world.tick, alpha) : null;
        let pose = null as ReturnType<typeof castPose> | null;
        if (cast) pose = castPose(cast.slot, Math.max(0, cast.tick - 1 + alpha));
        else if (fa !== null && fa < 6 && ps.dodgeT <= 0) pose = castPose(1, 10 + fa); // Chime follow-through after the hit tick
        if (pose) {
          sword.position.set(0.36, 0.5 + pose.dy, 0.12); sword.rotation.set(pose.rx, pose.ry, 0);
          v.model.rotation.x = pose.lean; v.model.position.y = pose.hop;
        } else if (ps.swingT > 0) {
          const k = 1 - ps.swingT / ps.swingDur, e = 1 - (1 - k) * (1 - k);
          const dir = ps.combo === 1 ? -1 : 1;
          sword.rotation.set(-1.2 + (ps.combo === 2 ? e * 2.6 : 0), dir * (1.4 - e * 2.8), 0);
        } else if (ps.castT > 0) { sword.rotation.set(-2.6, 0, 0); v.model.position.y = 0.15; }
        else sword.rotation.set(-0.35, 0, 0.2);
        if (!pose) sword.position.set(0.36, 0.5, 0.12);
      }
      if (ps.dodgeT > 0) { v.model.scale.set(0.9, 0.82, 1.25); v.model.rotation.x = 0.4; }
      if (ps.drinkT > 0 && head) head.rotation.x = -0.5;
      if (ps.empowered) { v.stars.visible = true; this.spinStars(v, 1.9, 0.5); }
    } else if (a.kind === 'puffcap') {
      const cap = P.puffcap_cap;
      if (a.state === 'windup') { v.model.position.x = Math.sin(T * 50) * 0.05; v.model.scale.y = 0.82 + Math.sin(T * 10) * 0.05; }
      else if (a.state === 'hop') { const k = 1 - Math.max(0, a.st) / 0.3; v.model.position.y = 4 * v.hopH * k * (1 - k); v.model.scale.y = 1.15; }
      else if (a.state === 'recover') { v.model.rotation.z = Math.sin(T * 6) * 0.25; v.stars.visible = true; this.spinStars(v, 1.25, 0.45); }
      else { v.model.position.y = Math.abs(Math.sin(T * 7 + a.id)) * 0.08; }
      if (cap) cap.rotation.y += dt * (a.state === 'windup' ? 8 : 0.5);
    } else if (a.kind === 'thornling') {
      const b = P.thornling_body;
      if (b) {
        if (a.state === 'windup') { b.rotation.y += dt * 25; v.model.rotation.x = -0.25; }
        else if (a.state === 'rush') { b.rotation.x += dt * 30; }
        else if (a.state === 'recover') { v.model.rotation.z = Math.sin(T * 6) * 0.3; v.stars.visible = true; this.spinStars(v, 1.15, 0.4); }
        else { b.rotation.x += dt * 4; v.model.position.y = Math.abs(Math.sin(T * 9)) * 0.06; }
      }
    } else {
      const body = P.prismback_body, shell = P.prismback_shell, horn = P.prismback_horn, legs = P.prismback_legs;
      const tele = world.tele.find((t) => t.owner === a.id);
      const prog = tele ? 1 - Math.max(0, tele.t) / tele.total : 0;
      if (legs) legs.position.y = a.state === 'approach' ? Math.abs(Math.sin(T * 8)) * 0.08 : 0;
      if (a.state === 'windup' && a.atk === 'slam') { v.model.position.y = prog * 0.9; v.model.rotation.x = -prog * 0.15; }
      if (a.state === 'windup' && a.atk === 'charge') { v.model.position.z = -prog * 0.4; v.model.rotation.x = 0.12; }
      if (a.state === 'windup' && a.atk === 'sweep' && horn) horn.rotation.y = -prog * 0.8;
      else if (horn) horn.rotation.y *= 0.8;
      if (a.state === 'charge') { v.model.rotation.x = 0.18; if (Math.random() < 0.5) this.particles.burst(a.x, 0.2, a.z, 0xd9c7a5, 2, 1.5, 1, 0.4, 1.4, 3); }
      if (a.state === 'recover' && a.atk === 'slam') v.model.position.y = Math.max(0, 0.15 - a.st * 0.1);
      const stunned = a.state === 'stunned';
      if (stunned) { v.model.rotation.z = Math.sin(T * 4) * 0.08; v.stars.visible = true; this.spinStars(v, 4.2, 1.2); }
      if (a.state === 'roar' || a.state === 'intro') { const s = 1 + Math.sin(T * 30) * 0.02; v.model.scale.set(s, s, s); if (body) body.rotation.x = -0.1; }
      if (shell) shell.traverse((o) => { const m = o as Mesh; if (m.isMesh) (m.material as MeshLambertMaterial).emissiveIntensity = stunned ? 1.4 + Math.sin(T * 10) * 0.4 : world.phase === 2 ? 0.9 : 0.55; });
    }
  }

  private spinStars(v: ActorView, h: number, r: number) {
    v.stars.children.forEach((s, i) => {
      const ang = this.time * 4 + (i * Math.PI * 2) / 3;
      s.position.set(Math.cos(ang) * r, h + Math.sin(this.time * 6 + i) * 0.05, Math.sin(ang) * r);
      s.quaternion.copy(this.camera.quaternion);
    });
  }

  private updateCamera(world: World, dt: number) {
    const pv = this.actors.get(world.player.id)!;
    const px = pv.root.position.x, pz = pv.root.position.z;
    const boss = world.bossStarted && world.boss.alive;
    const bdx = boss ? world.boss.x - px : 0, bdz = boss ? world.boss.z - pz : 0;
    const bd = Math.hypot(bdx, bdz);
    const portrait = this.camera.aspect < 1;
    // Owner 2026-11-21: keep the low over-the-shoulder framing of the DES-003 reference at all times in landscape
    // (field and boss fight). Portrait keeps the older high framing unchanged.
    // When the boss is behind or level with the player, the camera backs off along the same angle so the boss
    // and its ground warnings stay in frame instead of lifting to a top-down view.
    const low = portrait ? 0 : 1;
    const dist = (boss ? 1.18 + Math.min(0.22, Math.max(0, bd - 5) * 0.03) : 0.86) * (portrait ? 1.35 : 1);
    const wide = boss ? Math.min(2, Math.max(0, -bdz - 10) * 0.2) : 0;
    const back = boss && !portrait ? Math.min(7, Math.max(0, bdz + 2.5) + Math.max(0, Math.abs(bdx) - 4) * 0.5) : 0;
    const tx = px + bdx * (0.18 + 0.16 * low);
    const ty = 0.6 - 0.45 * low;
    const tz = portrait
      ? pz - (boss ? 2.6 + 2.4 * low : 2.4) + Math.max(0, bdz) * 0.6
      : pz - 5 + back * 0.55;
    const oy = 10.5 * dist * (1 - low) + (4.5 + wide + back * 0.42) * low;
    const cz = (tz + 9 * dist) * (1 - low) + (pz + 5.5 + wide + back) * low;
    const k = 1 - Math.exp(-dt * 6);
    if (this.camBase.lengthSq() === 0) { this.camTarget.set(tx, ty, tz); this.camBase.set(tx, oy, cz); }
    this.camTarget.lerp(TMP.set(tx, ty, tz), k);
    this.camBase.lerp(TMP.set(tx, oy, cz), k);
    // DES-006 §1: when a warning edge / threatening enemy would be off-screen, back off + rise along the SAME view angle
    // (no rotation, controls unchanged); fast attack, slow release. Portrait is untouched.
    const need = portrait || this.noPull ? 0 : this.pullNeeded(world, px, pz);
    if (need > this.camPull) { this.camPull += (need - this.camPull) * (1 - Math.exp(-dt * 10)); this.camPullHold = 0.7; }
    else if (need > 0.01) this.camPullHold = Math.max(this.camPullHold, 0.35);
    else if ((this.camPullHold -= dt) <= 0) this.camPull = Math.max(0, this.camPull - dt * 0.9);
    if (this.camPull < 0.002) this.camPull = 0;
    this.camPos.copy(this.camBase).sub(this.camTarget).multiplyScalar(1 + this.camPull).add(this.camTarget);
    this.shake = Math.max(0, this.shake - dt * 2.2);
    const s = this.shake * this.shake * 0.6;
    this.camera.position.set(this.camPos.x + (Math.random() - 0.5) * s, this.camPos.y + (Math.random() - 0.5) * s, this.camPos.z);
    this.camera.lookAt(this.camTarget);
    this.nearFadeU.value = Math.hypot(this.camPos.y, this.camPos.z - this.camTarget.z) * 0.72;
    const so = this.sunOffset;
    if (this.q.shadows) { this.sun.position.set(this.camTarget.x + so.x, so.y, this.camTarget.z + so.z); this.sun.target.position.set(this.camTarget.x, 0, this.camTarget.z); }
    else { this.sun.position.copy(so); this.sun.target.position.set(0, 0, 0); }
  }

  /** Smallest extra pull-back (0..PULL_MAX, scale of the camera offset from its target) that keeps the player, nearby/attacking
   *  enemies and every active telegraph outline (circle ring, cone arc+edges, line rectangle) inside the viewport safe area. */
  private pullNeeded(world: World, px: number, pz: number): number {
    const pts = this.pullPts; pts.length = 0;
    const push = (x: number, y: number, z: number) => { pts.push(x, y, z); };
    push(px, 0, pz); push(px, 1.6, pz);
    for (const t of world.tele) {
      if (t.shape === 'circle') { for (let i = 0; i < 16; i++) { const a = i * (Math.PI / 8); push(t.x + Math.cos(a) * t.r, 0, t.z + Math.sin(a) * t.r); } }
      else if (t.shape === 'cone') {
        const base = Math.atan2(t.dz, t.dx), half = Math.acos(Math.min(1, Math.max(-1, t.cos)));
        push(t.x, 0, t.z);
        for (let i = 0; i <= 6; i++) { const a = base - half + (2 * half * i) / 6; push(t.x + Math.cos(a) * t.r, 0, t.z + Math.sin(a) * t.r); }
      } else {
        // charge/rush line: far end capped a few metres past the player (the rest of an 18 m line only matters to whoever stands in it)
        const along = (px - t.x) * t.dx + (pz - t.z) * t.dz, L = Math.min(t.r, Math.max(6, along + 4)), hw = t.w / 2, nx = -t.dz, nz = t.dx;
        for (const l of [0, L]) for (const s of [-hw, hw]) push(t.x + t.dx * l + nx * s, 0, t.z + t.dz * l + nz * s);
      }
    }
    for (const a of world.actors) {
      if (a.kind === 'player' || !a.alive) continue;
      const boss = a.kind === 'prismback';
      if (!boss) { const d = Math.hypot(a.x - px, a.z - pz); if (a.state === 'idle' || a.state === 'dead' || d > 10) continue; }
      else if (!world.bossStarted) continue;
      const h = boss ? 3.2 : 1.3, r = a.r;
      for (const [ox, oz] of [[-r, 0], [r, 0], [0, -r], [0, r]]) { push(a.x + ox, 0, a.z + oz); push(a.x + ox, h, a.z + oz); }
    }
    const cam = this.pullCam, P = this.camera.projectionMatrix.elements, off = TMP_C2.copy(this.camBase).sub(this.camTarget);
    cam.near = this.camera.near;
    for (let p = 0; p <= PULL_MAX + 1e-6; p += 0.1) {
      cam.position.copy(this.camTarget).addScaledVector(off, 1 + p);
      cam.lookAt(this.camTarget); cam.updateMatrixWorld(true);
      const m = cam.matrixWorldInverse.elements;
      let ok = true;
      for (let i = 0; i < pts.length && ok; i += 3) {
        const x = pts[i], y = pts[i + 1], z = pts[i + 2];
        const vz = m[2] * x + m[6] * y + m[10] * z + m[14];
        if (vz > -cam.near) { ok = false; break; }
        const nx = (P[0] * (m[0] * x + m[4] * y + m[8] * z + m[12])) / -vz, ny = (P[5] * (m[1] * x + m[5] * y + m[9] * z + m[13])) / -vz;
        if (nx < -PULL_SAFE_X || nx > PULL_SAFE_X || ny < PULL_SAFE_BOTTOM || ny > PULL_SAFE_TOP) ok = false;
      }
      if (ok) return p;
    }
    return PULL_MAX;
  }

  private addOccluder(obj: Object3D, r: number, h: number, actor?: Actor) {
    const mats: Material[] = [], twins: Mesh[] = [], parts: Mesh[] = [];
    obj.traverse((o) => {
      const m = o as Mesh; if (!m.isMesh || o === this.playerMark) return;
      const own = (m.material as Material).clone(); m.material = own; mats.push(own);
      if (m.userData.twin) twins.push(m); else parts.push(m);
    });
    // Perf: while opaque, draw the merged twin (1 draw call); while faded, draw the separate meshes (see models.ts TWIN)
    if (twins.length) { for (const m of twins) m.visible = true; for (const m of parts) m.visible = false; } else parts.length = 0;
    this.occluders.push({ obj, r, h, mats, f: 1, actor, twins, parts });
  }

  /** Fade boss / pillars / gates that sit between the camera and the player. Camera looks along −z from +z, so "in front" = larger z. */
  private updateOccluders(world: World, dt: number) {
    const pv = this.actors.get(world.player.id); if (!pv) return;
    const px = pv.root.position.x, pz = pv.root.position.z;
    // On a shallower sightline, tall props can hide the player from farther away.
    const slope = Math.max(0.86, Math.min(1.8, (this.camPos.z - pz) / Math.max(1, this.camPos.y - 1)));
    if (this.playerMark) { this.playerMark.position.set(px, 0.05, pz); this.playerMark.visible = !world.ps.down; }
    for (const o of this.occluders) {
      const ox = o.obj.position.x, oz = o.obj.position.z, dz = oz - pz;
      const reach = o.h * slope + o.r + 0.6;
      const hides = o.obj.visible && dz > -0.6 && dz < reach && Math.abs(ox - px) < o.r + 0.8;
      const target = hides ? 0.28 : 1;
      o.f += (target - o.f) * Math.min(1, dt * 10);
      if (Math.abs(o.f - target) < 0.01) o.f = target;
      const transparent = o.f < 0.99;
      if (o.twins.length && o.twins[0].visible === transparent) { for (const m of o.twins) m.visible = !transparent; for (const m of o.parts) m.visible = transparent; }
      for (const m of o.mats) {
        if (m.transparent !== transparent) { m.transparent = transparent; m.depthWrite = !transparent; m.needsUpdate = true; }
        m.opacity = o.f;
      }
    }
  }

  /** World → CSS pixel coordinates (for DOM overlays). */
  project(x: number, y: number, z: number, out: { x: number; y: number; vis: boolean }) {
    const v = TMP.set(x, y, z).project(this.camera);
    out.x = (v.x * 0.5 + 0.5) * window.innerWidth; out.y = (-v.y * 0.5 + 0.5) * window.innerHeight; out.vis = v.z >= -1 && v.z < 1;
    return out;
  }
  actorScreenPos(id: number, h: number, out: { x: number; y: number; vis: boolean }) {
    const v = this.actors.get(id); if (!v) { out.vis = false; return out; }
    return this.project(v.root.position.x, h + v.model.position.y, v.root.position.z, out);
  }
}
const TMP = new Vector3();
const TMP_C = new Color();
const TMP_C2 = new Vector3();
/** DES-006 §1 camera pull-back: max extra scale of the camera offset, and the viewport safe area in NDC (bottom margin leaves room for the HUD buttons / joystick) */
const PULL_MAX = 1.2, PULL_SAFE_X = 0.94, PULL_SAFE_TOP = 0.94, PULL_SAFE_BOTTOM = -0.86;
function dist2(a: Actor, b: Actor) { return (a.x - b.x) ** 2 + (a.z - b.z) ** 2; }
/** Patch a Lambert material so fragments near the camera dither away (keeps foreground trees from hiding the player). */
function nearFade(src: Material, u: { value: number }): Material {
  const m = src.clone(), prevCompile = m.onBeforeCompile.bind(m), prevKey = m.customProgramCacheKey.bind(m); // keep the source's own shader patch (baked emissive)
  m.onBeforeCompile = (sh, rd) => {
    prevCompile(sh, rd);
    sh.uniforms.uNearFade = u;
    sh.fragmentShader = 'uniform float uNearFade;\n' + sh.fragmentShader.replace('void main() {', `void main() {
      float nfT = smoothstep(uNearFade, uNearFade + 3.0, length(vViewPosition));
      float nfB = mod(floor(gl_FragCoord.x), 2.0) * 0.5 + mod(floor(gl_FragCoord.y), 2.0) * 0.25 + 0.125;
      if (nfT < nfB) discard;`);
  };
  m.customProgramCacheKey = () => prevKey() + 'nearfade';
  return m;
}
function hex(c: number, a = 1) { const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255; return a === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`; }
export { Color, Group };
