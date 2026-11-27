// DES-009 §3.3 / §4: the pose viewer accepts only a self-contained GLB that matches its manifest (stage allowlist, clip
// lengths, loop flags, markers); budgets and rig rules are measured and reported so team A can judge a real file.
import { describe, it, expect } from 'vitest';
import { inspectHeroFiles, type InspectReport } from '../src/seyrin/inspect.ts';
import { buildFixtureGlb, buildFixtureManifest, writeGlb, PREVIEW_CLIPS, type FixtureOptions } from './seyrinFixture.ts';

async function run(o: FixtureOptions = {}, edit?: (m: Record<string, any>) => void, stage = o.stage ?? 'preview'): Promise<InspectReport> {
  const glb = buildFixtureGlb(o);
  const m = await buildFixtureManifest(glb, stage);
  edit?.(m);
  return inspectHeroFiles(glb, JSON.stringify(m));
}
const failed = (r: InspectReport, level?: 'block' | 'check') => r.items.filter((i) => !i.ok && (!level || i.level === level)).map((i) => i.id);

describe('a matching fixture', () => {
  it('preview stage: accepted with no failed item', async () => {
    const r = await run();
    expect(failed(r)).toEqual([]);
    expect(r.accepted).toBe(true);
    expect(r.stats).toMatchObject({ stage: 'preview', primitives: 2, materials: 1, bones: 45, joints: 45 });
    expect(r.stats.tris).toBeLessThan(200);
    expect(r.stats.clips.map((c) => c.name).sort()).toEqual(PREVIEW_CLIPS.map((c) => c.name).sort());
    expect(r.stats.textures).toEqual([{ use: 'baseColor', width: 1024, height: 1024 }, { use: 'orm', width: 512, height: 512 }]);
  });
  it('full stage: all 20 clips', async () => {
    const r = await run({ stage: 'full' });
    expect(failed(r)).toEqual([]);
    expect(r.stats.clips.length).toBe(20);
  });
});

describe('rejected files (blocking)', () => {
  it.each([
    ['external texture URI', { externalImage: true }, 'self-contained'],
    ['external buffer URI', { externalBuffer: true }, 'self-contained'],
    ['a required compression extension the game cannot decode', { requiredExtension: 'KHR_draco_mesh_compression' }, 'extensions-required'],
  ] as const)('%s', async (_n, o, id) => {
    const r = await run(o);
    expect(r.accepted).toBe(false);
    expect(failed(r, 'block')).toContain(id);
  });
  it('not a GLB, a truncated GLB, and a manifest that is not JSON', async () => {
    const glb = buildFixtureGlb();
    const m = JSON.stringify(await buildFixtureManifest(glb));
    for (const bad of [new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), glb.slice(0, glb.length - 100)]) {
      const r = await inspectHeroFiles(bad, m);
      expect(r.accepted).toBe(false);
      expect(failed(r, 'block')).toContain('glb');
    }
    const r = await inspectHeroFiles(glb, '{ not json');
    expect(r.accepted).toBe(false);
    expect(failed(r, 'block')).toContain('manifest');
  });
  it('a changed GLB byte no longer matches the manifest hash', async () => {
    const glb = buildFixtureGlb();
    const m = JSON.stringify(await buildFixtureManifest(glb));
    const other = glb.slice(); other[other.length - 3] ^= 1;
    const r = await inspectHeroFiles(other, m);
    expect(failed(r, 'block')).toEqual(['sha256']);
  });
  it.each([
    ['wrong schema id', (m: any) => { m.schema = 'something/2'; }, 'manifest'],
    ['unknown stage', (m: any) => { m.stage = 'final'; }, 'manifest'],
    ['declared byte size differs', (m: any) => { m.output.bytes += 4; }, 'bytes'],
    ['preview manifest lists an extra clip', (m: any) => { m.clips.push({ name: 'walk', ticks: 24, loop: true }); }, 'clip-allowlist'],
    ['a clip is missing from the manifest', (m: any) => { m.clips.pop(); }, 'clip-allowlist'],
    ['attack_03 hit marker moved', (m: any) => { m.clips.find((c: any) => c.name === 'attack_03').markers.hit = [8]; }, 'clip-contract'],
    ['attack_03 lift differs', (m: any) => { m.clips.find((c: any) => c.name === 'attack_03').yLift.peakM = 0.2; }, 'clip-contract'],
    ['attack_03 hold differs', (m: any) => { delete m.clips.find((c: any) => c.name === 'attack_03').poseHold; }, 'clip-contract'],
    ['run is not marked looping', (m: any) => { m.clips.find((c: any) => c.name === 'run').loop = false; }, 'clip-contract'],
    ['declared length is not the DES length', (m: any) => { m.clips.find((c: any) => c.name === 'dodge_f').ticks = 10; }, 'clip-contract'],
    ['root motion declared non-zero', (m: any) => { m.rootMotion = 1; }, 'manifest'],
    ['wrong axes', (m: any) => { m.axes.forward = '-Z'; }, 'manifest'],
  ])('%s', async (_n, edit, id) => {
    const r = await run({}, edit);
    expect(r.accepted).toBe(false);
    expect(failed(r, 'block')).toContain(id);
  });
  it('the GLB carries a clip outside the preview allowlist', async () => {
    const r = await run({ glbClips: [...PREVIEW_CLIPS, { name: 'walk', ticks: 24, loop: true }] });
    expect(failed(r, 'block')).toContain('clip-allowlist');
  });
  it('a GLB clip whose real length is not ticks/30', async () => {
    const r = await run({ glbClips: PREVIEW_CLIPS.map((c) => (c.name === 'attack_01' ? { ...c, ticks: 12 } : c)) });
    expect(failed(r, 'block')).toContain('clip-length');
  });
  it('a full file presented with a preview manifest', async () => {
    const r = await run({ stage: 'full' }, undefined, 'preview');
    expect(r.accepted).toBe(false);
    expect(failed(r, 'block')).toContain('clip-allowlist');
  });
  it('a GLB whose JSON chunk is valid but describes no skin at all', async () => {
    const glb = writeGlb({ asset: { version: '2.0' } }, Buffer.alloc(4));
    const m = await buildFixtureManifest(glb);
    const r = await inspectHeroFiles(glb, JSON.stringify(m));
    expect(r.accepted).toBe(false);
    expect(failed(r, 'block')).toContain('skinned');
  });
});

describe('measured rules are reported, not hidden', () => {
  it.each([
    ['more than 10,000 triangles', { subdivide: 30 }, 'tris'],
    ['a missing cloth bone', { omitNodes: ['scarf_l_04'] }, 'bones'],
    ['a missing weapon socket', { omitNodes: ['socket_blade_tip'] }, 'sockets'],
    ['root motion inside a clip', { rootMotion: true }, 'root-motion'],
    ['double sided material', { doubleSided: true }, 'material-opaque'],
    ['alpha blending', { alphaMode: 'BLEND' }, 'material-opaque'],
    ['texture sizes off budget', { textureSize: { base: 2048, orm: 512 } }, 'textures'],
    ['an extra optional extension', { usedExtension: 'KHR_materials_emissive_strength' }, 'extensions'],
    ['a vertex without weights', { zeroWeightVertex: true }, 'weights'],
  ] as const)('%s: still viewable, listed as a failed check', async (_n, o, id) => {
    const r = await run(o);
    expect(r.accepted).toBe(true);
    expect(failed(r, 'check')).toContain(id);
  });
});
