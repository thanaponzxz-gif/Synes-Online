// DES-009 §3.3: the skinned character has its own loading path (skin, UVs and PBR textures kept), instances are
// independent, nothing is fetched by path, and shared GPU resources are freed only after the last instance is gone.
// Node has no image decoder: createImageBitmap is stubbed here; real decoding is checked in the browser QA.
import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { loadHero, HeroRejected, type HeroInstance } from '../src/seyrin/loader.ts';
import { buildFixtureGlb, buildFixtureManifest, type FixtureOptions } from './seyrinFixture.ts';

beforeAll(() => {
  const g = globalThis as unknown as Record<string, unknown>;
  g.self ??= globalThis;
  g.createImageBitmap = async (blob: Blob) => {
    const b = new Uint8Array(await blob.arrayBuffer());
    if (b[0] !== 137 || b[1] !== 80) throw new Error('cannot decode');
    const dv = new DataView(b.buffer);
    return { width: dv.getUint32(16), height: dv.getUint32(20), close() {} };
  };
});
afterEach(() => vi.restoreAllMocks());

async function files(o: FixtureOptions = {}) {
  const glb = buildFixtureGlb(o);
  return [glb.buffer as ArrayBuffer, JSON.stringify(await buildFixtureManifest(glb, o.stage ?? 'preview'))] as const;
}
const load = async (o: FixtureOptions = {}) => loadHero(...(await files(o)));
const find = <T extends THREE.Object3D>(root: THREE.Object3D, test: (o: THREE.Object3D) => boolean) => { const out: T[] = []; root.traverse((o) => { if (test(o)) out.push(o as T); }); return out; };
const skinned = (i: HeroInstance) => find<THREE.SkinnedMesh>(i.root, (o) => (o as THREE.SkinnedMesh).isSkinnedMesh);
const bone = (i: HeroInstance, name: string) => i.root.getObjectByName(name)!;

describe('loading', () => {
  it('keeps the skin, the UVs and the PBR textures (nothing becomes a flat Lambert colour)', async () => {
    const asset = await load();
    const inst = asset.createInstance();
    const [mesh] = skinned(inst);
    expect(skinned(inst).length).toBe(1);
    expect(mesh.skeleton.bones.length).toBe(45);
    for (const a of ['position', 'normal', 'uv', 'skinIndex', 'skinWeight']) expect(mesh.geometry.getAttribute(a), a).toBeTruthy();
    const mat = mesh.material as THREE.MeshStandardMaterial;
    expect(mat.isMeshStandardMaterial).toBe(true);
    for (const k of ['map', 'roughnessMap', 'metalnessMap', 'aoMap'] as const) expect(mat[k], k).toBeTruthy();
    expect(mat.roughnessMap).toBe(mat.metalnessMap);
    expect(inst.root.getObjectByName('weapon_katana')).toBeTruthy();
    expect(inst.clips.slice().sort()).toEqual(['attack_01', 'attack_03', 'dodge_f', 'idle', 'run', 'skill_shadow_thread']);
    inst.dispose(); asset.dispose();
  });
  it('refuses a file with an external reference and never requests it', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    const err = await load({ externalImage: true }).catch((e) => e);
    expect(err).toBeInstanceOf(HeroRejected);
    expect((err as HeroRejected).report.items.find((i) => i.id === 'self-contained')?.ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
  it('refuses a file whose manifest does not match', async () => {
    const [glb] = await files();
    const [, other] = await files({ stage: 'full' });
    await expect(loadHero(glb, other)).rejects.toBeInstanceOf(HeroRejected);
  });
  it('refuses a file whose embedded texture cannot be decoded instead of showing it untextured', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const err = await load({ brokenImage: true }).catch((e) => e);
    expect(err).toBeInstanceOf(HeroRejected);
    expect((err as HeroRejected).report.items.find((i) => i.id === 'textures-decoded')?.ok).toBe(false);
  });
});

describe('instances', () => {
  it('have their own skeleton and pose, and share geometry and material', async () => {
    const asset = await load();
    const a = asset.createInstance(), b = asset.createInstance();
    expect(skinned(a)[0].skeleton.bones[1]).not.toBe(skinned(b)[0].skeleton.bones[1]);
    expect(skinned(a)[0].skeleton.bones.every((x) => a.root.getObjectById(x.id) === x)).toBe(true);
    expect(skinned(a)[0].geometry).toBe(skinned(b)[0].geometry);
    expect(skinned(a)[0].material).toBe(skinned(b)[0].material);
    a.pose('attack_03', 6 / 30);
    b.pose('idle', 0);
    expect(bone(a, 'pelvis').position.y).toBeCloseTo(0.92, 3);   // the lift baked into the clip, peak at tick 6
    expect(bone(b, 'pelvis').position.y).toBeCloseTo(0.8, 3);
    expect(bone(a, 'root').position.toArray()).toEqual([0, 0, 0]);
    a.dispose(); b.dispose(); asset.dispose();
  });
  it('seek exactly: looping clips wrap, one-shot clips hold the last key, only one action runs', async () => {
    const asset = await load();
    const i = asset.createInstance();
    const chest = () => bone(i, 'chest').quaternion.toArray().map((v) => +v.toFixed(5));
    i.pose('run', 3 / 30); const at3 = chest();
    i.pose('run', 13 / 30); expect(chest()).toEqual(at3);
    i.pose('attack_03', 18 / 30); const end = bone(i, 'pelvis').position.y;
    expect(end).toBeCloseTo(0.8, 3);
    i.pose('attack_03', 99); expect(bone(i, 'pelvis').position.y).toBeCloseTo(end, 6);
    i.pose('attack_03', 9 / 30); expect(bone(i, 'pelvis').position.y).toBeCloseTo(0.8, 3);   // landed on the hit tick
    expect(i.activeClips()).toEqual(['attack_03']);
    i.pose('idle', 0.2);
    expect(i.activeClips()).toEqual(['idle']);
    expect(() => i.pose('walk', 0)).toThrow(/walk/);
    i.dispose();
    expect(i.activeClips()).toEqual([]);
    asset.dispose();
  });
  it('shared resources are freed once, only after the last instance is disposed', async () => {
    const asset = await load();
    const a = asset.createInstance(), b = asset.createInstance();
    const mesh = skinned(a)[0], mat = mesh.material as THREE.MeshStandardMaterial;
    const freed: string[] = [];
    mesh.geometry.addEventListener('dispose', () => freed.push('geometry'));
    mat.addEventListener('dispose', () => freed.push('material'));
    mat.map!.addEventListener('dispose', () => freed.push('map'));
    mat.roughnessMap!.addEventListener('dispose', () => freed.push('orm'));
    asset.dispose();
    expect(() => asset.createInstance()).toThrow();
    a.dispose(); a.dispose();
    expect(freed).toEqual([]);
    expect(asset.liveInstances).toBe(1);
    b.dispose();
    asset.dispose();
    expect(freed.sort()).toEqual(['geometry', 'map', 'material', 'orm']);
    expect(asset.liveInstances).toBe(0);
  });
});
