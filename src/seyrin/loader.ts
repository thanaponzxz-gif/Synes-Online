// DES-009 §3.3: the loading path for a skinned, textured character. Deliberately separate from the kit path
// (loadKit / lambertize / flatten / merge), which would drop the skin and the PBR textures.
// Input is bytes already in memory (file picker); nothing is fetched by path, stored, or uploaded.
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { inspectHeroFiles, type InspectReport } from './inspect.ts';
import { MixerDriver } from './mixerDriver.ts';
import type { AnimPlan } from './animPlan.ts';

export class HeroRejected extends Error {
  readonly report: InspectReport;
  constructor(report: InspectReport) {
    super('hero file rejected: ' + report.items.filter((i) => i.level === 'block' && !i.ok).map((i) => `${i.id}: ${i.detail}`).join(' | '));
    this.name = 'HeroRejected';
    this.report = report;
  }
}

export interface HeroInstance {
  /** add this to a scene; it owns its skeleton and mixer, geometry and materials are shared with the asset */
  readonly root: THREE.Object3D;
  readonly clips: readonly string[];
  /** put the skeleton at `seconds` into a clip: looping clips wrap, one-shot clips hold their last key */
  pose(clip: string, seconds: number): void;
  /** P2: pose the skeleton from an animation plan (upper/lower body, additive hit_add, pelvis lift); returns clips the file lacks */
  animate(plan: AnimPlan): string[];
  activeClips(): string[];
  dispose(): void;
}
export interface HeroAsset {
  readonly report: InspectReport;
  readonly liveInstances: number;
  createInstance(): HeroInstance;
  /** frees geometry, materials and textures, after the last live instance has been disposed */
  dispose(): void;
}

const TEXTURE_SLOTS = ['map', 'roughnessMap', 'metalnessMap', 'aoMap', 'normalMap', 'emissiveMap', 'alphaMap'] as const;

function resources(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>(), skeletons = new Set<THREE.Skeleton>();
  root.traverse((o) => {
    const m = o as THREE.SkinnedMesh;
    if (!m.isMesh) return;
    geometries.add(m.geometry);
    if (m.isSkinnedMesh) skeletons.add(m.skeleton);
    for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
      materials.add(mat);
      for (const k of TEXTURE_SLOTS) { const t = (mat as unknown as Record<string, THREE.Texture | null>)[k]; if (t) textures.add(t); }
    }
  });
  return { geometries, materials, textures, skeletons };
}

function free(root: THREE.Object3D) {
  const r = resources(root);
  for (const g of r.geometries) g.dispose();
  for (const m of r.materials) m.dispose();
  for (const t of r.textures) { t.dispose(); (t.image as { close?: () => void } | null)?.close?.(); }
  for (const s of r.skeletons) s.dispose();
}

/** GLTFLoader turns a texture it cannot decode into `null` and carries on; that would show a flat colour character. */
function missingTextures(gltf: GLTF): string[] {
  const defs = (gltf.parser.json.materials ?? []) as Record<string, any>[];
  const out = new Set<string>();
  gltf.scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    for (const mat of (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[]) {
      const def = defs[gltf.parser.associations.get(mat)?.materials ?? -1];
      if (!mat.isMeshStandardMaterial) { out.add(`${mat.name || 'material'} is not a PBR material`); continue; }
      const pbr = def?.pbrMetallicRoughness ?? {};
      const want: [unknown, keyof THREE.MeshStandardMaterial][] = [[pbr.baseColorTexture, 'map'], [pbr.metallicRoughnessTexture, 'roughnessMap'], [pbr.metallicRoughnessTexture, 'metalnessMap'], [def?.occlusionTexture, 'aoMap']];
      for (const [declared, slot] of want) if (declared && !mat[slot]) out.add(`${def?.name ?? 'material'}.${String(slot)} failed to decode`);
    }
  });
  return [...out];
}

export async function loadHero(glb: ArrayBuffer, manifestText: string): Promise<HeroAsset> {
  const report = await inspectHeroFiles(new Uint8Array(glb), manifestText);
  if (!report.accepted) throw new HeroRejected(report);
  const manager = new THREE.LoadingManager();
  // defence in depth: the inspector already refused external references
  manager.setURLModifier((url) => { if (!/^(blob:|data:)/.test(url)) throw new Error(`blocked request: ${url}`); return url; });
  let gltf: GLTF;
  try { gltf = await new GLTFLoader(manager).parseAsync(glb.slice(0), ''); }
  catch (e) {
    report.items.push({ id: 'parse', level: 'block', ok: false, detail: (e as Error).message ?? String(e) });
    report.accepted = false;
    throw new HeroRejected(report);
  }
  const missing = missingTextures(gltf);
  report.items.push({ id: 'textures-decoded', level: 'block', ok: !missing.length, detail: missing.join(', ') || 'every declared texture is on its material' });
  if (missing.length) { report.accepted = false; free(gltf.scene); throw new HeroRejected(report); }

  const source = gltf.scene;
  source.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.castShadow = true;
    if ((m as THREE.SkinnedMesh).isSkinnedMesh) m.frustumCulled = false; // bind-pose bounds do not follow the animation
  });
  const byName = new Map(gltf.animations.map((c) => [c.name, c]));
  const looping = new Set((report.manifest!.clips as { name: string; loop: boolean }[]).filter((c) => c.loop).map((c) => c.name));
  let live = 0, released = false, freed = false;
  const maybeFree = () => { if (released && !live && !freed) { freed = true; free(source); } };

  const createInstance = (): HeroInstance => {
    if (released) throw new Error('hero asset already disposed');
    const root = cloneSkinned(source);
    const mixer = new THREE.AnimationMixer(root);
    let current: THREE.AnimationAction | null = null, gone = false, driver: MixerDriver | null = null;
    live++;
    return {
      root,
      clips: [...byName.keys()],
      pose(name, seconds) {
        const clip = byName.get(name);
        if (!clip) throw new Error(`clip not in this file: ${name}`);
        if (gone) return;
        const action = mixer.clipAction(clip);
        if (current !== action) { current?.stop(); driver?.idle(); action.reset().play(); current = action; }
        const d = clip.duration;
        action.time = looping.has(name) ? ((seconds % d) + d) % d : Math.min(Math.max(seconds, 0), d);
        mixer.update(0);
      },
      animate(plan) {
        if (gone) return [];
        if (current) { current.stop(); current = null; }
        driver ??= new MixerDriver(mixer, root, [...byName.values()]);
        return driver.apply(plan);
      },
      activeClips: () => [...byName.values()].filter((c) => mixer.existingAction(c)?.isRunning()).map((c) => c.name),
      dispose() {
        if (gone) return;
        gone = true; current = null; driver?.dispose(); driver = null;
        mixer.stopAllAction(); mixer.uncacheRoot(root);
        root.removeFromParent();
        for (const s of resources(root).skeletons) s.dispose(); // per-instance bone textures only
        live--;
        maybeFree();
      },
    };
  };
  return {
    report,
    get liveInstances() { return live; },
    createInstance,
    dispose() { released = true; maybeFree(); },
  };
}
