// Model factory: uses nodes from synes_kit.glb when available (see docs/art/ASSET_CONTRACT.md),
// otherwise builds procedural stand-ins with the same part names so animation code is identical.
import {
  Group, Mesh, Object3D, MeshLambertMaterial, MeshBasicMaterial, SphereGeometry, CylinderGeometry, ConeGeometry, BoxGeometry,
  IcosahedronGeometry, OctahedronGeometry, TorusGeometry, CapsuleGeometry, DodecahedronGeometry, Color, type Material, BufferGeometry, BufferAttribute,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Matrix4 } from 'three';

export const PAL = {
  lumen: 0x5cf2e6, violet: 0xa78bfa, blossom: 0xff9ec7, gold: 0xffc857, leaf: 0x7ccb5e, leafDark: 0x3f8f4a,
  bark: 0x8a5a3b, path: 0xe8c99b, stone: 0xb9b4c7, teal: 0x2bb3a3, cream: 0xfff1dc, navy: 0x3b3f7a, skin: 0xffd9bf,
  hair: 0xa0522d, moss: 0x6fa35a, shellStone: 0x8d8aa3,
};

const matCache = new Map<string, MeshLambertMaterial>();
export function lam(color: number, emissive = 0, ei = 0.6): MeshLambertMaterial {
  const k = `${color}-${emissive}-${ei}`;
  let m = matCache.get(k);
  if (!m) { m = new MeshLambertMaterial({ color, emissive, emissiveIntensity: emissive ? ei : 0, flatShading: true }); matCache.set(k, m); }
  return m;
}
function mesh(g: BufferGeometry, m: Material, name = '', x = 0, y = 0, z = 0): Mesh {
  const o = new Mesh(g, m); o.name = name; o.position.set(x, y, z); o.castShadow = true; return o;
}

// ------------------------------------------------------------------ GLB kit
let kit: Group | null = null;
export async function loadKit(url: string, onProgress?: (f: number) => void): Promise<boolean> {
  try {
    const gltf = await new GLTFLoader().loadAsync(url, (e) => { if (e.total) onProgress?.(e.loaded / e.total); });
    kit = gltf.scene;
    // Swap PBR materials for cheaper Lambert (mobile), keep colors/emissive.
    const swap = new Map<Material, Material>();
    kit.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = true; m.receiveShadow = false;
      const src = m.material as any;
      if (!swap.has(src)) {
        const em = src.emissive && (src.emissive.r + src.emissive.g + src.emissive.b) > 0.01;
        swap.set(src, new MeshLambertMaterial({ color: src.color ?? new Color(1, 1, 1), emissive: em ? src.emissive : new Color(0, 0, 0), emissiveIntensity: em ? Math.min(1, src.emissiveIntensity ?? 1) * 0.8 : 0, flatShading: true }));
      }
      m.material = swap.get(src)!;
    });
    bakeKit(kit);
    return true;
  } catch (e) {
    console.warn('[synes] kit GLB unavailable, using procedural models', e);
    kit = null;
    return false;
  }
}
export const kitLoaded = () => !!kit;

// Draw-call batching of kit meshes (perf only, the image must not change).
// Sibling meshes under one node are merged into one mesh. Colour and emissive light are baked per vertex (`aCol`, `aEm`) and
// drawn by one shared Lambert material: diffuse * vColor and emissive = aEm, with aEm = emissive * emissiveIntensity, which are
// the same numbers the per-mesh materials fed the shader. Vertices are not moved: every kit mesh has an identity local
// transform, so the merged geometry sits in the same parent space as the originals.
/** Lambert with per-vertex emissive (`aEm`, already multiplied by the intensity). `emissive` is white so the uniform is 1. */
class BakedLambert extends MeshLambertMaterial {
  constructor() { super({ color: 0xffffff, flatShading: true, emissive: 0xffffff }); }
  onBeforeCompile(sh: any) {
    // `flat`: every vertex of a triangle carries the same value, so no interpolation rounding (the result equals the uniform path)
    sh.vertexShader = 'attribute vec3 aCol;\nattribute vec3 aEm;\nflat varying vec3 vCol;\nflat varying vec3 vEm;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvCol = aCol; vEm = aEm;');
    sh.fragmentShader = 'flat varying vec3 vCol;\nflat varying vec3 vEm;\n' + sh.fragmentShader
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse * vCol, opacity );')
      .replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * vEm;');
  }
  customProgramCacheKey() { return 'bakedLambert'; }
}
const BAKED_NAME = /_geo(_\d+)?$/;
let bakedMat: BakedLambert | null = null;
/** merged geometry -> the original parts (Object3D.clone copies userData through JSON, so this cannot live there) */
const bakedParts = new WeakMap<BufferGeometry, { geometry: BufferGeometry; mat: Material; order: number }[]>();
function bakeEligible(o: Object3D): o is Mesh {
  const m = o as Mesh;
  if (!m.isMesh || (m as any).isInstancedMesh || (m as any).isSkinnedMesh || o.children.length || !BAKED_NAME.test(o.name)) return false;
  const mat = m.material as MeshLambertMaterial;
  if (Array.isArray(mat) || !mat.isMeshLambertMaterial || mat.map || mat instanceof BakedLambert || mat.transparent || mat.opacity !== 1 || mat.side !== 0) return false;
  return o.position.lengthSq() === 0 && o.quaternion.w === 1 && o.scale.x === 1 && o.scale.y === 1 && o.scale.z === 1;
}
// The boss is faded and its crystals pulse through emissiveIntensity (View.animateActor): it keeps its separate meshes.
const KEEP_SEPARATE = new Set(['prismback']);
// Pillars and gates are faded by View.addOccluder with per-mesh transparency, which blends overlapping parts of one merged mesh
// differently: they keep their separate meshes and get a hidden merged twin that the view shows while they are opaque.
const TWIN = new Set(['crystal_pillar', 'crystal_gate']);
function bakeKit(root: Object3D) {
  let seq = 0; root.traverse((o) => { if ((o as Mesh).isMesh) o.userData.seq = seq++; }); // original mesh order, see flattenPropMerged
  bakedMat ??= new BakedLambert();
  root.traverse((parent) => {
    let twin = false;
    for (let p: Object3D | null = parent; p; p = p.parent) { if (KEEP_SEPARATE.has(p.name)) return; if (TWIN.has(p.name)) twin = true; }
    const list = parent.children.filter(bakeEligible);
    if (list.length < 2) return;
    // Triangles of one mesh are drawn in index order, separate meshes in material.id order: keep that order inside the merged
    // mesh so exactly coplanar faces of different parts (e.g. a rock and its moss cap) resolve the same way as before.
    // (Pillars and gates are drawn with one cloned material per mesh, made in traversal order: that is their order.)
    list.sort((a, b) => (twin ? 0 : (a.material as Material).id - (b.material as Material).id) || a.userData.seq - b.userData.seq);
    const geos = list.map((m) => {
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
      const mat = m.material as MeshLambertMaterial, col = mat.color, e = mat.emissive, k = mat.emissiveIntensity;
      const n = g.getAttribute('position').count, c = new Float32Array(n * 3), em = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b;
        em[i * 3] = e.r * k; em[i * 3 + 1] = e.g * k; em[i * 3 + 2] = e.b * k;
      }
      g.setAttribute('aCol', new BufferAttribute(c, 3)); g.setAttribute('aEm', new BufferAttribute(em, 3));
      return g;
    });
    const merged = mergeGeometries(geos, false);
    if (!merged) return;
    const out = new Mesh(merged, bakedMat!); out.name = list[0].name; out.castShadow = true; out.receiveShadow = false;
    bakedParts.set(merged, list.map((m, i) => ({ geometry: geos[i], mat: m.material as Material, order: m.userData.seq as number })));
    if (twin) { out.name += '_baked'; out.userData.twin = true; out.visible = false; }
    else for (const m of list) parent.remove(m);
    parent.add(out);
  });
}
function fromKit(name: string): Object3D | null {
  if (!kit) return null;
  const n = kit.getObjectByName(name);
  if (!n) return null;
  const c = n.clone(true);
  c.position.set(0, 0, 0); c.rotation.set(0, 0, 0);
  return c;
}
/** Returns kit node if it has all required parts, else null. */
function kitCharacter(name: string, parts: string[]): Group | null {
  const c = fromKit(name);
  if (!c) return null;
  for (const p of parts) if (!c.getObjectByName(p)) return null;
  const g = new Group(); g.add(c); g.name = name;
  return g;
}

// ------------------------------------------------------------------ characters
export function makeHero(): Group {
  const k = kitCharacter('hero', ['hero_body', 'hero_head', 'hero_sword']);
  if (k) return k;
  const g = new Group(); g.name = 'hero';
  const body = new Group(); body.name = 'hero_body'; g.add(body);
  body.add(mesh(new CapsuleGeometry(0.26, 0.28, 3, 8), lam(PAL.cream), '', 0, 0.48, 0));
  body.add(mesh(new CylinderGeometry(0.3, 0.34, 0.18, 8), lam(PAL.navy), '', 0, 0.36, 0));
  body.add(mesh(new TorusGeometry(0.22, 0.08, 6, 10), lam(PAL.teal), '', 0, 0.74, 0)).rotation.x = Math.PI / 2;
  const tail = mesh(new BoxGeometry(0.16, 0.05, 0.42), lam(PAL.teal), '', 0.08, 0.7, -0.32); tail.rotation.x = 0.5; body.add(tail);
  body.add(mesh(new CylinderGeometry(0.09, 0.1, 0.3, 6), lam(0x6b4a33), '', -0.13, 0.15, 0));
  body.add(mesh(new CylinderGeometry(0.09, 0.1, 0.3, 6), lam(0x6b4a33), '', 0.13, 0.15, 0));
  const head = new Group(); head.name = 'hero_head'; head.position.y = 0.8; g.add(head);
  head.add(mesh(new SphereGeometry(0.34, 12, 10), lam(PAL.skin), '', 0, 0.3, 0));
  const hair = mesh(new SphereGeometry(0.37, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), lam(PAL.hair), '', 0, 0.34, -0.03); head.add(hair);
  const tuft = mesh(new ConeGeometry(0.09, 0.28, 5), lam(PAL.hair), '', 0.02, 0.72, 0.02); tuft.rotation.z = -0.4; head.add(tuft);
  head.add(mesh(new SphereGeometry(0.05, 6, 5), lam(0x2a1d14), '', -0.12, 0.28, 0.3));
  head.add(mesh(new SphereGeometry(0.05, 6, 5), lam(0x2a1d14), '', 0.12, 0.28, 0.3));
  const sword = new Group(); sword.name = 'hero_sword'; sword.position.set(0.36, 0.5, 0.12); g.add(sword);
  sword.add(mesh(new BoxGeometry(0.06, 0.16, 0.06), lam(0x6b4a33), '', 0, 0, 0));
  sword.add(mesh(new BoxGeometry(0.22, 0.04, 0.06), lam(PAL.gold), '', 0, 0.09, 0));
  sword.add(mesh(new BoxGeometry(0.08, 0.7, 0.03), lam(PAL.lumen, PAL.lumen, 0.5), '', 0, 0.45, 0));
  return g;
}

export function makePuffcap(): Group {
  const k = kitCharacter('puffcap', ['puffcap_cap', 'puffcap_stem']);
  if (k) return k;
  const g = new Group(); g.name = 'puffcap';
  const stem = new Group(); stem.name = 'puffcap_stem'; g.add(stem);
  stem.add(mesh(new CylinderGeometry(0.3, 0.38, 0.5, 9), lam(PAL.cream), '', 0, 0.25, 0));
  stem.add(mesh(new SphereGeometry(0.05, 6, 5), lam(0x2a1d14), '', -0.11, 0.33, 0.32));
  stem.add(mesh(new SphereGeometry(0.05, 6, 5), lam(0x2a1d14), '', 0.11, 0.33, 0.32));
  const cap = new Group(); cap.name = 'puffcap_cap'; cap.position.y = 0.48; g.add(cap);
  cap.add(mesh(new SphereGeometry(0.55, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), lam(PAL.blossom), '', 0, 0, 0));
  for (const [x, z] of [[0.25, 0.2], [-0.28, 0.1], [0.05, -0.3], [-0.1, 0.35], [0.32, -0.15]]) cap.add(mesh(new SphereGeometry(0.08, 6, 4), lam(PAL.cream), '', x, 0.38 - (x * x + z * z) * 0.5, z));
  return g;
}

export function makeThornling(): Group {
  const k = kitCharacter('thornling', ['thornling_body']);
  if (k) return k;
  const g = new Group(); g.name = 'thornling';
  const body = new Group(); body.name = 'thornling_body'; g.add(body);
  body.add(mesh(new IcosahedronGeometry(0.42, 0), lam(PAL.leafDark), '', 0, 0.45, 0));
  const ico = new IcosahedronGeometry(0.42, 0).getAttribute('position');
  const seen = new Set<string>();
  for (let i = 0; i < ico.count; i++) {
    const x = ico.getX(i), y = ico.getY(i), z = ico.getZ(i), key = `${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`;
    if (seen.has(key) || y < -0.2 || z > 0.3) continue; seen.add(key);
    const s = mesh(new ConeGeometry(0.09, 0.32, 4), lam(PAL.violet), '', x * 1.15, 0.45 + y * 1.15, z * 1.15);
    s.lookAt(x * 3, 0.45 + y * 3, z * 3); s.rotateX(Math.PI / 2); body.add(s);
  }
  body.add(mesh(new SphereGeometry(0.06, 6, 5), lam(0xfff6a0, 0xfff6a0, 0.8), '', -0.14, 0.52, 0.36));
  body.add(mesh(new SphereGeometry(0.06, 6, 5), lam(0xfff6a0, 0xfff6a0, 0.8), '', 0.14, 0.52, 0.36));
  return g;
}

export function makePrismback(): Group {
  const k = kitCharacter('prismback', ['prismback_body', 'prismback_shell', 'prismback_horn', 'prismback_legs']);
  if (k) return k;
  const g = new Group(); g.name = 'prismback';
  const legs = new Group(); legs.name = 'prismback_legs'; g.add(legs);
  for (const [x, z] of [[-1.1, 1.1], [1.1, 1.1], [-1.25, -0.2], [1.25, -0.2], [-1.05, -1.4], [1.05, -1.4]]) legs.add(mesh(new CylinderGeometry(0.28, 0.36, 0.9, 6), lam(0x6d6880), '', x, 0.45, z));
  const body = new Group(); body.name = 'prismback_body'; g.add(body);
  const b = mesh(new SphereGeometry(1.6, 12, 9), lam(PAL.shellStone), '', 0, 1.25, 0); b.scale.set(1, 0.62, 1.35); body.add(b);
  const moss = mesh(new SphereGeometry(1.62, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.38), lam(PAL.moss), '', 0, 1.3, 0); moss.scale.set(1, 0.62, 1.35); body.add(moss);
  const head = mesh(new DodecahedronGeometry(0.62, 0), lam(0x77738c), '', 0, 1.05, 2.0); body.add(head);
  body.add(mesh(new SphereGeometry(0.11, 6, 5), lam(PAL.gold, PAL.gold, 1), '', -0.3, 1.2, 2.48));
  body.add(mesh(new SphereGeometry(0.11, 6, 5), lam(PAL.gold, PAL.gold, 1), '', 0.3, 1.2, 2.48));
  const shell = new Group(); shell.name = 'prismback_shell'; shell.position.y = 1.9; g.add(shell);
  const cr: [number, number, number, number, number][] = [[0, 0, 0, 1.3, PAL.lumen], [0.55, 0, 0.4, 0.95, PAL.violet], [-0.6, 0, 0.2, 1.0, PAL.lumen], [0.2, 0, -0.7, 1.05, PAL.violet], [-0.35, 0, -0.5, 0.8, PAL.blossom], [0.75, 0, -0.35, 0.7, PAL.lumen], [-0.8, 0, 0.75, 0.65, PAL.violet]];
  for (const [x, y, z, h, c] of cr) { const m = mesh(new OctahedronGeometry(0.32, 0), lam(c, c, 0.55), '', x, y + h * 0.4, z); m.scale.set(0.8, h * 1.5, 0.8); m.rotation.set(x * 0.4, x + z, z * 0.4); shell.add(m); }
  const horn = new Group(); horn.name = 'prismback_horn'; horn.position.set(0, 1.25, 2.45); g.add(horn);
  const h = mesh(new ConeGeometry(0.22, 1.1, 5), lam(PAL.lumen, PAL.lumen, 0.6), '', 0, 0.2, 0.35); h.rotation.x = 1.0; horn.add(h);
  return g;
}

// ------------------------------------------------------------------ props
type PropFn = () => Object3D;
const PROCEDURAL: Record<string, PropFn> = {
  tree_round: () => { const g = new Group(); g.add(mesh(new CylinderGeometry(0.22, 0.3, 1.4, 6), lam(PAL.bark), '', 0, 0.7, 0)); g.add(mesh(new IcosahedronGeometry(1.25, 0), lam(PAL.leaf), '', 0, 2.1, 0)); g.add(mesh(new IcosahedronGeometry(0.8, 0), lam(0x95d96f), '', 0.45, 2.7, 0.2)); return g; },
  tree_round_b: () => { const g = new Group(); g.add(mesh(new CylinderGeometry(0.2, 0.28, 1.2, 6), lam(PAL.bark), '', 0, 0.6, 0)); g.add(mesh(new IcosahedronGeometry(1.1, 0), lam(0xf6a8c8), '', 0, 1.9, 0)); g.add(mesh(new IcosahedronGeometry(0.7, 0), lam(0xffc3da), '', -0.4, 2.4, 0.1)); return g; },
  tree_pine: () => { const g = new Group(); g.add(mesh(new CylinderGeometry(0.18, 0.24, 1, 6), lam(PAL.bark), '', 0, 0.5, 0)); g.add(mesh(new ConeGeometry(1.1, 1.8, 7), lam(PAL.leafDark), '', 0, 1.6, 0)); g.add(mesh(new ConeGeometry(0.8, 1.4, 7), lam(0x4fa35a), '', 0, 2.5, 0)); return g; },
  bush: () => mesh(new IcosahedronGeometry(0.6, 0), lam(0x67b957), '', 0, 0.4, 0),
  rock_a: () => { const m = mesh(new DodecahedronGeometry(0.7, 0), lam(PAL.stone), '', 0, 0.35, 0); m.scale.set(1, 0.7, 0.9); return m; },
  rock_b: () => { const m = mesh(new IcosahedronGeometry(0.5, 0), lam(0xa7a1b8), '', 0, 0.25, 0); m.scale.set(1.3, 0.6, 1); return m; },
  crystal_cluster: () => { const g = new Group(); [[0, 0, 1, PAL.lumen], [0.3, 0.1, 0.7, PAL.violet], [-0.25, -0.1, 0.6, PAL.lumen], [0.05, -0.3, 0.5, PAL.blossom]].forEach(([x, z, h, c]) => { const m = mesh(new OctahedronGeometry(0.22, 0), lam(c, c, 0.7), '', x, h * 0.45, z); m.scale.set(1, h * 2.2, 1); m.rotation.z = x * 0.8; g.add(m); }); return g; },
  flower_patch: () => { const g = new Group(); [[0, 0, PAL.blossom], [0.3, 0.2, PAL.gold], [-0.25, 0.15, 0xffffff], [0.1, -0.3, PAL.violet]].forEach(([x, z, c]) => g.add(mesh(new IcosahedronGeometry(0.1, 0), lam(c), '', x, 0.18, z))); return g; },
  mushroom_glow: () => { const g = new Group(); g.add(mesh(new CylinderGeometry(0.06, 0.08, 0.3, 6), lam(PAL.cream), '', 0, 0.15, 0)); g.add(mesh(new SphereGeometry(0.2, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), lam(PAL.lumen, PAL.lumen, 0.8), '', 0, 0.28, 0)); return g; },
  tent: () => { const g = new Group(); const t = mesh(new ConeGeometry(1.6, 2.0, 4), lam(0xf3e2c3), '', 0, 1, 0); t.rotation.y = Math.PI / 4; g.add(t); g.add(mesh(new BoxGeometry(0.7, 1.1, 0.05), lam(PAL.teal), '', 0, 0.55, 1.12)); return g; },
  campfire: () => { const g = new Group(); for (let i = 0; i < 6; i++) { const r = mesh(new DodecahedronGeometry(0.16, 0), lam(PAL.stone), '', Math.cos(i) * 0.45, 0.08, Math.sin(i) * 0.45); g.add(r); } g.add(mesh(new ConeGeometry(0.25, 0.6, 5), new MeshBasicMaterial({ color: 0xffb347 }), 'flame', 0, 0.35, 0)); g.add(mesh(new ConeGeometry(0.14, 0.4, 5), new MeshBasicMaterial({ color: 0xfff0a0 }), 'flame2', 0, 0.3, 0)); return g; },
  signpost: () => { const g = new Group(); g.add(mesh(new CylinderGeometry(0.07, 0.08, 1.6, 5), lam(PAL.bark), '', 0, 0.8, 0)); const a = mesh(new BoxGeometry(0.9, 0.24, 0.06), lam(0xc89a6a), '', 0.25, 1.3, 0); a.rotation.y = -0.3; g.add(a); return g; },
  lantern_post: () => { const g = new Group(); g.add(mesh(new CylinderGeometry(0.05, 0.06, 1.8, 5), lam(0x5a4636), '', 0, 0.9, 0)); g.add(mesh(new OctahedronGeometry(0.16, 0), lam(PAL.gold, PAL.gold, 1), '', 0, 1.9, 0)); return g; },
  crystal_pillar: () => { const g = new Group(); g.add(mesh(new CylinderGeometry(0.9, 1.0, 0.4, 7), lam(PAL.stone), '', 0, 0.2, 0)); const c = mesh(new CylinderGeometry(0.45, 0.7, 3.4, 6), lam(PAL.violet, PAL.violet, 0.45), '', 0, 2.0, 0); g.add(c); g.add(mesh(new ConeGeometry(0.45, 0.8, 6), lam(PAL.lumen, PAL.lumen, 0.7), '', 0, 4.1, 0)); return g; },
  crystal_gate: () => { const g = new Group(); for (let i = -2; i <= 2; i++) { const h = 2.2 + (i % 2 === 0 ? 0.8 : 0); const m = mesh(new OctahedronGeometry(0.45, 0), lam(i % 2 ? PAL.violet : PAL.lumen, i % 2 ? PAL.violet : PAL.lumen, 0.7), '', i * 1.2, h / 2, 0); m.scale.set(1, h / 0.9, 0.7); g.add(m); } return g; },
  lumen_spring: () => { const g = new Group(); g.add(mesh(new CylinderGeometry(1.5, 1.7, 0.3, 10), lam(PAL.stone), '', 0, 0.15, 0)); g.add(mesh(new CylinderGeometry(1.25, 1.25, 0.05, 16), new MeshBasicMaterial({ color: 0x8ff7ff }), 'water', 0, 0.32, 0)); g.add(mesh(new OctahedronGeometry(0.3, 0), lam(PAL.lumen, PAL.lumen, 1), 'gem', 0, 1.3, 0)); return g; },
  fence: () => { const g = new Group(); for (const x of [-0.9, 0.9]) g.add(mesh(new BoxGeometry(0.12, 0.8, 0.12), lam(PAL.bark), '', x, 0.4, 0)); g.add(mesh(new BoxGeometry(2, 0.1, 0.08), lam(0xa5734d), '', 0, 0.55, 0)); return g; },
  house_a: () => { const g = new Group(); g.add(mesh(new BoxGeometry(3, 2.2, 2.8), lam(PAL.cream), '', 0, 1.1, 0)); const r = mesh(new ConeGeometry(2.5, 1.6, 4), lam(0xe0708f), '', 0, 3.0, 0); r.rotation.y = Math.PI / 4; g.add(r); g.add(mesh(new BoxGeometry(0.7, 1.2, 0.1), lam(PAL.bark), '', 0, 0.6, 1.42)); for (const x of [-0.9, 0.9]) g.add(mesh(new BoxGeometry(0.5, 0.5, 0.08), lam(PAL.gold, PAL.gold, 0.6), '', x, 1.4, 1.42)); return g; },
  house_b: () => { const g = new Group(); g.add(mesh(new BoxGeometry(2.4, 3.0, 2.4), lam(0xf4e6cf), '', 0, 1.5, 0)); const r = mesh(new ConeGeometry(2.0, 1.8, 4), lam(PAL.teal), '', 0, 3.9, 0); r.rotation.y = Math.PI / 4; g.add(r); g.add(mesh(new BoxGeometry(0.4, 1.0, 0.4), lam(PAL.stone), '', 0.6, 4.2, 0.3)); g.add(mesh(new BoxGeometry(0.6, 1.1, 0.1), lam(PAL.bark), '', -0.4, 0.55, 1.22)); g.add(mesh(new BoxGeometry(0.5, 0.6, 0.08), lam(PAL.gold, PAL.gold, 0.6), '', 0.5, 2.0, 1.22)); return g; },
  market_stall: () => { const g = new Group(); for (const [x, z] of [[-1, -0.6], [1, -0.6], [-1, 0.6], [1, 0.6]]) g.add(mesh(new CylinderGeometry(0.06, 0.06, 2, 5), lam(PAL.bark), '', x, 1, z)); g.add(mesh(new BoxGeometry(2.1, 0.8, 1.1), lam(0xc89a6a), '', 0, 0.4, 0)); const a = mesh(new BoxGeometry(2.4, 0.08, 1.6), lam(PAL.blossom), '', 0, 2.05, 0.1); a.rotation.x = 0.2; g.add(a); g.add(mesh(new OctahedronGeometry(0.18, 0), lam(PAL.lumen, PAL.lumen, 0.8), '', -0.5, 0.95, 0)); g.add(mesh(new IcosahedronGeometry(0.16, 0), lam(0xff8a5c), '', 0.3, 0.92, 0.1)); g.add(mesh(new IcosahedronGeometry(0.16, 0), lam(PAL.gold), '', 0.6, 0.92, -0.1)); return g; },
  fountain: () => { const g = new Group(); g.add(mesh(new CylinderGeometry(2.2, 2.4, 0.6, 12), lam(PAL.stone), '', 0, 0.3, 0)); g.add(mesh(new CylinderGeometry(1.9, 1.9, 0.08, 16), new MeshBasicMaterial({ color: 0x8ff7ff }), '', 0, 0.62, 0)); g.add(mesh(new CylinderGeometry(0.35, 0.5, 1.6, 8), lam(PAL.stone), '', 0, 1.2, 0)); const c = mesh(new OctahedronGeometry(0.55, 0), lam(PAL.lumen, PAL.lumen, 0.9), '', 0, 2.6, 0); c.scale.y = 1.8; g.add(c); return g; },
  ruin_arch: () => { const g = new Group(); for (const x of [-1.6, 1.6]) g.add(mesh(new BoxGeometry(0.8, 3.6, 0.8), lam(0x9e98ad), '', x, 1.8, 0)); const t = mesh(new BoxGeometry(4.2, 0.7, 0.9), lam(0xa9a3b8), '', 0, 3.9, 0); t.rotation.z = 0.06; g.add(t); g.add(mesh(new OctahedronGeometry(0.3, 0), lam(PAL.lumen, PAL.lumen, 1), '', 0, 3.1, 0)); return g; },
  ruin_column: () => { const g = new Group(); g.add(mesh(new CylinderGeometry(0.45, 0.55, 2.2, 7), lam(0x9e98ad), '', 0, 1.1, 0)); const b = mesh(new CylinderGeometry(0.45, 0.45, 0.6, 7), lam(0x9e98ad), '', 0.6, 0.3, 0.5); b.rotation.z = 1.4; g.add(b); return g; },
  shop_counter: () => { const g = new Group(); g.add(mesh(new BoxGeometry(4, 1.0, 1), lam(0xa5734d), '', 0, 0.5, 0)); g.add(mesh(new BoxGeometry(4.1, 0.08, 1.1), lam(0x8e2f4f), '', 0, 1.04, 0)); g.add(mesh(new OctahedronGeometry(0.22, 0), lam(PAL.gold, PAL.gold, 0.9), '', 1.2, 1.3, 0)); g.add(mesh(new BoxGeometry(0.5, 0.06, 0.35), lam(0xf3e2c3), '', -0.8, 1.11, 0)); return g; },
  weapon_rack: () => { const g = new Group(); g.add(mesh(new BoxGeometry(2.2, 0.15, 0.3), lam(PAL.bark), '', 0, 0.2, 0)); g.add(mesh(new BoxGeometry(2.2, 0.12, 0.2), lam(PAL.bark), '', 0, 1.6, 0)); for (const x of [-0.7, 0, 0.7]) g.add(mesh(new BoxGeometry(0.1, 1.6, 0.05), lam(0xdfe6f2), '', x, 1.0, 0.05)); g.add(mesh(new CylinderGeometry(0.45, 0.45, 0.1, 10), lam(PAL.navy), '', 1.3, 0.9, 0.2)).rotation.x = Math.PI / 2; return g; },
  banner: () => { const g = new Group(); g.add(mesh(new CylinderGeometry(0.05, 0.05, 3.2, 5), lam(0x5a4636), '', 0, 1.6, 0)); g.add(mesh(new BoxGeometry(0.9, 1.4, 0.04), lam(PAL.violet), '', 0.48, 2.4, 0)); g.add(mesh(new OctahedronGeometry(0.16, 0), lam(PAL.gold, PAL.gold, 0.8), '', 0.48, 2.5, 0.04)); return g; },
};

export function makeProp(name: string): Object3D {
  const k = fromKit(name);
  if (k) { k.traverse((o) => { o.castShadow = true; }); return k; }
  const f = PROCEDURAL[name];
  return f ? f() : new Group();
}

/** Collect (geometry, material, local matrix) for every mesh under a prop — used to build InstancedMesh batches. */
export interface OrigMat { mat: Material; order: number }
/** One entry per original (pre-batching) mesh of a prop: kit meshes that bakeKit merged are expanded back into their parts. */
export function flattenProp(name: string): { geometry: BufferGeometry; material: Material; matrix: Matrix4; orig: OrigMat }[] {
  const root = makeProp(name);
  root.updateMatrixWorld(true);
  const out: { geometry: BufferGeometry; material: Material; matrix: Matrix4; orig: OrigMat }[] = [];
  let i = 0;
  root.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    const members = bakedParts.get(m.geometry);
    if (members) for (const p of members) out.push({ geometry: p.geometry, material: m.material as Material, matrix: m.matrixWorld.clone(), orig: { mat: p.mat, order: p.order } });
    else out.push({ geometry: m.geometry, material: m.material as Material, matrix: m.matrixWorld.clone(), orig: { mat: m.material as Material, order: (m.userData.seq as number | undefined) ?? i } });
    i++;
  });
  return out;
}

/**
 * Same as flattenProp but merges all parts that share a material into one geometry → one draw call per material per prop type.
 * `rank` (shared across props, filled here) numbers the original materials in order of first use; the parts of a merged
 * geometry are laid out in that order, which is the order the separate per-material meshes used to be drawn in.
 */
export function flattenPropMerged(name: string, rank: Map<Material, number> = new Map()): { geometry: BufferGeometry; material: Material; matrix: Matrix4; rank: number }[] {
  const parts = flattenProp(name);
  for (const p of [...parts].sort((x, y) => x.orig.order - y.orig.order)) if (!rank.has(p.orig.mat)) rank.set(p.orig.mat, rank.size);
  parts.sort((x, y) => rank.get(x.orig.mat)! - rank.get(y.orig.mat)!);
  const byMat = new Map<Material, { gs: BufferGeometry[]; rank: number }>();
  for (const p of parts) {
    let g = p.geometry.clone(); g.applyMatrix4(p.matrix);
    if (g.index) g = g.toNonIndexed();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'aCol' && k !== 'aEm') g.deleteAttribute(k);
    g.morphAttributes = {};
    let e = byMat.get(p.material); if (!e) byMat.set(p.material, (e = { gs: [], rank: rank.get(p.orig.mat)! }));
    e.gs.push(g);
  }
  const out: { geometry: BufferGeometry; material: Material; matrix: Matrix4; rank: number }[] = [];
  for (const [material, { gs, rank: r }] of byMat) {
    const merged = gs.length === 1 ? gs[0] : mergeGeometries(gs, false);
    if (merged) out.push({ geometry: merged, material, matrix: new Matrix4(), rank: r });
    else for (const g of gs) out.push({ geometry: g, material, matrix: new Matrix4(), rank: r }); // attribute mismatch fallback
  }
  return out;
}
