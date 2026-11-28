// Loads a boss GLB that passed the boss checker (DES-010 §3.4) into a skinned, PBR-textured instance. Input is bytes already
// in memory; nothing is fetched by path, stored or uploaded. Geometry and textures belong to the asset; every instance owns
// its skeleton, its mixer and its own copy of the material (so one instance can fade without touching another).
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { free, missingTextures, resources } from '../seyrin/loader.ts';
import { inspectBossFiles, type BossReport } from './inspectBoss.ts';
import { BOSS_SOCKETS, type BossStage } from './spec.ts';

export class BossRejected extends Error {
  readonly report: BossReport;
  constructor(report: BossReport) {
    super('boss file rejected: ' + report.items.filter((i) => i.level === 'block' && !i.ok).map((i) => `${i.id}: ${i.detail}`).join(' | '));
    this.name = 'BossRejected';
    this.report = report;
  }
}
/** one clip at a clip time (seconds) with a blend weight; the weights of a frame sum to 1 */
export interface BossPose { clip: string; time: number; weight: number; }
export interface BossInstance {
  readonly root: THREE.Object3D;
  readonly clips: readonly string[];
  /** the five effect sockets by name (socket_fx_*) */
  readonly sockets: Readonly<Record<string, THREE.Object3D>>;
  /** pose the skeleton: every clip is seeked to its time (never advanced by a clock of its own) */
  apply(poses: readonly BossPose[]): void;
  /** 1 = solid; below 1 the whole instance is drawn see-through (the view's fade when it hides the player, the death fade).
   *  `nearest` (DES-010 §10.4 G12): while see-through, one extra depth-only draw of the same pose comes first, so only the
   *  surface nearest the camera is coloured and the layers of the one mesh do not add up. Returns the extra draws in use (0 / 1). */
  setOpacity(f: number, nearest?: boolean): number;
  dispose(): void;
}
export interface BossAsset {
  readonly report: BossReport;
  readonly liveInstances: number;
  createInstance(): BossInstance;
  /** frees geometry and textures after the last live instance has been disposed */
  dispose(): void;
}

export async function loadBoss(glb: ArrayBuffer, manifestText: string, stage: BossStage = 'combat'): Promise<BossAsset> {
  const report = await inspectBossFiles(new Uint8Array(glb), manifestText, stage);
  if (!report.accepted) throw new BossRejected(report);
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => { if (!/^(blob:|data:)/.test(url)) throw new Error(`blocked request: ${url}`); return url; });
  const reject = (id: string, detail: string): never => { report.items.push({ id, level: 'block', ok: false, detail }); report.accepted = false; throw new BossRejected(report); };
  let gltf: GLTF;
  try { gltf = await new GLTFLoader(manager).parseAsync(glb.slice(0), ''); }
  catch (e) { return reject('parse', (e as Error).message ?? String(e)); }
  const missing = missingTextures(gltf);
  report.items.push({ id: 'textures-decoded', level: 'block', ok: !missing.length, detail: missing.join(', ') || 'every declared texture is on its material' });
  if (missing.length) { report.accepted = false; free(gltf.scene); throw new BossRejected(report); }

  const source = gltf.scene;
  source.traverse((o) => {
    const m = o as THREE.SkinnedMesh;
    if (!m.isMesh) return;
    m.castShadow = true;
    if (m.isSkinnedMesh) m.frustumCulled = false; // bind-pose bounds do not follow the animation
  });
  const clips = gltf.animations.map((c) => {
    // root motion is 0 by contract; dropping the root tracks keeps a clip from ever moving the actor
    const tracks = c.tracks.filter((t) => THREE.PropertyBinding.parseTrackName(t.name).nodeName !== 'root');
    return new THREE.AnimationClip(c.name, c.duration, tracks);
  });
  let live = 0, released = false, freed = false;
  const maybeFree = () => { if (released && !live && !freed) { freed = true; free(source); } };

  const createInstance = (): BossInstance => {
    if (released) throw new Error('boss asset already disposed');
    const root = cloneSkinned(source), mixer = new THREE.AnimationMixer(root);
    const own: THREE.Material[] = [];
    root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { const c = (m.material as THREE.Material).clone(); m.material = c; own.push(c); } });
    const actions = new Map(clips.map((c) => { const a = mixer.clipAction(c); a.setEffectiveTimeScale(0); a.setEffectiveWeight(0); a.play(); return [c.name, a] as const; }));
    const sockets: Record<string, THREE.Object3D> = {};
    for (const s of Object.keys(BOSS_SOCKETS)) { const n = root.getObjectByName(s); if (n) sockets[s] = n; }
    // G12: depth-only twins of the skinned meshes (same geometry, same skeleton, same pose), made on first use, shown only while fading
    const skinned: THREE.SkinnedMesh[] = [];
    root.traverse((o) => { const m = o as THREE.SkinnedMesh; if (m.isSkinnedMesh) { skinned.push(m); m.renderOrder = 1; } });
    let depthMat: THREE.MeshBasicMaterial | null = null, pre: THREE.SkinnedMesh[] = [];
    const preOn = (on: boolean) => {
      if (on && !depthMat) {
        // pushed a hair back so the colour pass of the very same surface always passes the depth test
        depthMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, transparent: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 });
        pre = skinned.map((m) => { const d = new THREE.SkinnedMesh(m.geometry, depthMat!); d.name = 'boss-depth'; d.bind(m.skeleton, m.bindMatrix); d.frustumCulled = false; d.castShadow = false; d.renderOrder = 0; d.visible = false; m.parent!.add(d); return d; });
      }
      for (const d of pre) d.visible = on;
      return on ? pre.length : 0;
    };
    let gone = false;
    live++;
    return {
      root, clips: clips.map((c) => c.name), sockets,
      apply(poses) {
        if (gone) return;
        for (const a of actions.values()) a.setEffectiveWeight(0);
        for (const p of poses) {
          const a = actions.get(p.clip);
          if (!a) continue;
          const d = a.getClip().duration;
          a.time = Math.min(Math.max(p.time, 0), d);
          a.setEffectiveWeight(a.getEffectiveWeight() + p.weight);
        }
        mixer.update(0);
      },
      setOpacity(f, nearest = false) {
        const see = f < 0.99;
        for (const m of own) {
          if (m.transparent !== see) { m.transparent = see; m.depthWrite = !see; m.needsUpdate = true; }
          m.opacity = see ? f : 1;
        }
        return preOn(see && nearest && f > 0);
      },
      dispose() {
        if (gone) return;
        gone = true;
        mixer.stopAllAction(); for (const c of clips) mixer.uncacheClip(c); mixer.uncacheRoot(root);
        root.removeFromParent();
        for (const m of own) m.dispose(); // the copies only; their textures belong to the asset
        for (const d of pre) d.removeFromParent(); pre = []; depthMat?.dispose(); depthMat = null;
        for (const s of resources(root).skeletons) s.dispose();
        live--;
        maybeFree();
      },
    };
  };
  return { report, get liveInstances() { return live; }, createInstance, dispose() { released = true; maybeFree(); } };
}
