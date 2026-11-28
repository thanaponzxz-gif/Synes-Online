// Test data only: a box skinned to the 22 crab bones with the DES-010 clip list, built in memory. Not an asset, never shown.
import { Bin, boxGeometry, flatPng, writeGlb, sha256Hex } from './seyrinFixture.ts';
import { BOSS_BONES, BOSS_SOCKETS, STAGE_CLIPS, type BossStage } from '../src/boss/spec.ts';

export interface BossFixtureOptions {
  stage?: BossStage;
  /** clip names left out of the GLB (the manifest still lists them) */
  dropClips?: readonly string[];
  /** bone renamed in the file: [from, to] */
  renameBone?: readonly [string, string];
  /** seconds added to one clip's last key */
  stretch?: readonly [string, number];
  externalImage?: boolean; requiredExtension?: string; rootMotion?: boolean; topM?: number; halfWidthM?: number; doubleSided?: boolean;
  /** bytes of padding appended to the binary chunk */
  padBytes?: number;
}

export function buildBossGlb(o: BossFixtureOptions = {}): Uint8Array {
  const name = (n: string) => (o.renameBone && n === o.renameBone[0] ? o.renameBone[1] : n);
  const defs: [string, string | null][] = [...BOSS_BONES.map(([n, p]) => [name(n), p && name(p)] as [string, string | null]), ...Object.entries(BOSS_SOCKETS).map(([s, p]) => [s, name(p)] as [string, string | null])];
  const index = new Map(defs.map((d, i) => [d[0], i]));
  const nodes: Record<string, unknown>[] = defs.map(([n]) => ({ name: n, translation: [0, n === name('body') ? 0.9 : 0, 0] }));
  defs.forEach(([, p], i) => { if (p) ((nodes[index.get(p)!].children ??= []) as number[]).push(i); });
  const bin = new Bin(), joints = BOSS_BONES.map(([n]) => name(n));
  const ibm: number[] = [];
  for (const j of joints) ibm.push(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, j === name('root') ? 0 : -0.9, 0, 1);
  const hw = o.halfWidthM ?? 1, body = boxGeometry(hw * 2, hw * 2, 0, o.topM ?? 2.84, 4, 1);
  const ji: number[] = [], jw: number[] = [];
  for (let v = 0; v < body.pos.length / 3; v++) { ji.push(joints.indexOf(name(body.pos[v * 3 + 1] < 1.4 ? 'body' : 'shell')), 0, 0, 0); jw.push(1, 0, 0, 0); }
  const prim = {
    attributes: {
      POSITION: bin.floats(body.pos, 'VEC3', 3, true, 34962), NORMAL: bin.floats(body.nrm, 'VEC3', 3, false, 34962), TEXCOORD_0: bin.floats(body.uv, 'VEC2', 2, false, 34962),
      JOINTS_0: bin.ushorts(ji, 'VEC4', 4, 34962), WEIGHTS_0: bin.floats(jw, 'VEC4', 4, false, 34962),
    },
    indices: bin.uints(body.idx), material: 0, mode: 4,
  };
  const meshNode = nodes.push({ name: 'boss_fixture_mesh', mesh: 0, skin: 0 }) - 1;
  const images: Record<string, unknown>[] = [{ bufferView: bin.view(flatPng(1024, [82, 106, 112])), mimeType: 'image/png' }, { bufferView: bin.view(flatPng(512, [255, 200, 0])), mimeType: 'image/png' }];
  if (o.externalImage) images[0] = { uri: 'tex_boss.png' };
  const animations = STAGE_CLIPS[o.stage ?? 'combat'].filter((c) => !o.dropClips?.includes(c.name)).map((c, ci) => {
    const times = Array.from({ length: c.ticks + 1 }, (_, i) => i / 30 + (o.stretch?.[0] === c.name && i === c.ticks ? o.stretch[1] : 0));
    const input = bin.floats(times, 'SCALAR', 1, true), samplers: Record<string, unknown>[] = [], channels: Record<string, unknown>[] = [];
    const track = (node: string, path: string, values: number[], type: string, width: number) => {
      samplers.push({ input, output: bin.floats(values, type, width), interpolation: 'LINEAR' });
      channels.push({ sampler: samplers.length - 1, target: { node: index.get(name(node)), path } });
    };
    track('root', 'translation', times.flatMap((_, i) => [0, 0, o.rootMotion && c.name === 'walk' ? i * 0.05 : 0]), 'VEC3', 3);
    // a clip-specific pose: the shell tips by an angle that depends on the clip
    track('shell', 'rotation', times.flatMap((_, i) => { const a = (0.05 + ci * 0.04) * Math.sin((Math.PI * i) / c.ticks); return [Math.sin(a / 2), 0, 0, Math.cos(a / 2)]; }), 'VEC4', 4);
    return { name: c.name, samplers, channels };
  });
  if (o.padBytes) bin.view(Buffer.alloc(o.padBytes));
  return writeGlb({
    asset: { version: '2.0', generator: 'synes tests/bossFixture.ts (test data)' },
    scene: 0, scenes: [{ nodes: [index.get(name('root'))!, meshNode] }], nodes, meshes: [{ name: 'boss_fixture', primitives: [prim] }],
    skins: [{ joints: joints.map((j) => index.get(j)!), inverseBindMatrices: bin.floats(ibm, 'MAT4', 16), skeleton: index.get(name('root')) }], animations,
    materials: [{ name: 'boss_fixture_mat', pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicRoughnessTexture: { index: 1 } }, occlusionTexture: { index: 1 }, ...(o.doubleSided ? { doubleSided: true } : {}) }],
    textures: [{ source: 0 }, { source: 1 }], images, accessors: bin.accessors, bufferViews: bin.views, buffers: [{ byteLength: bin.length }],
    ...(o.requiredExtension ? { extensionsRequired: [o.requiredExtension], extensionsUsed: [o.requiredExtension] } : {}),
  }, Buffer.concat(bin.parts));
}

/** a manifest that matches a GLB built with the same options */
export async function buildBossManifest(glb: Uint8Array, stage: BossStage = 'combat'): Promise<Record<string, any>> {
  return {
    schema: 'synes.boss-manifest/1', assetId: 'boss_crab', version: 'v01', profileId: 'prismback_crab_v01', simKind: 'prismback', rulesets: ['ninja-roam-1'],
    stage, units: 'meter', axes: { up: '+Y', forward: '+Z' }, rootMotion: 0, status: 'REVIEW',
    output: { file: 'boss_fixture.glb', bytes: glb.byteLength, sha256: await sha256Hex(glb) },
    clips: structuredClone(STAGE_CLIPS[stage]), bones: BOSS_BONES.map(([name, parent]) => ({ name, parent })), sockets: Object.entries(BOSS_SOCKETS).map(([name, parent]) => ({ name, parent })),
    measurements: { tris: 20, vertices: 40, primitives: 1, materials: 1, joints: 22, bytes: glb.byteLength }, source: { file: 'none', sha256: '', originStatus: 'test data' },
    tools: { production: 'tests/bossFixture.ts' }, motionProfile: { fps: 30, referenceSpeeds: { walk: 2, charge: 15 }, clock: 'telegraph-and-state', rootMotion: 0 },
  };
}
