// TEST DATA ONLY: a code-generated skinned GLB (a segmented box, a thin rigid "blade" box, named empty joints, flat grey
// textures and trivial keyframes) that exercises the Seyrin loading path. It is not character art and must never be used
// as one (ADR-013: rig, animation and texture are Codex's). Nothing here is written under public/.
import { deflateSync, crc32 } from 'node:zlib';

const FPS = 30;
export interface FixtureClip { name: string; ticks: number; loop: boolean; extra?: Record<string, unknown>; }
export const PREVIEW_CLIPS: FixtureClip[] = [
  { name: 'idle', ticks: 48, loop: true },
  { name: 'run', ticks: 10, loop: true, extra: { markers: { step: [0, 5] } } },
  { name: 'attack_01', ticks: 11, loop: false, extra: { markers: { hit: [5] }, poseHolds: [[5, 6]] } },
  { name: 'attack_03', ticks: 18, loop: false, extra: { markers: { hit: [9] }, poseHolds: [[9, 10]], yLift: { fromTick: 3, peakTick: 6, toTick: 9, peakM: 0.12 } } },
  { name: 'skill_shadow_thread', ticks: 18, loop: false, extra: { markers: { dashStart: [3], dashEnd: [8] } } },
  { name: 'dodge_f', ticks: 9, loop: false },
];
export const FULL_CLIPS: FixtureClip[] = [
  ...PREVIEW_CLIPS,
  { name: 'ready', ticks: 36, loop: true },
  { name: 'walk', ticks: 24, loop: true, extra: { markers: { step: [0, 12] } } },
  { name: 'attack_02', ticks: 12, loop: false, extra: { markers: { hit: [5] }, poseHolds: [[5, 6]] } },
  { name: 'dodge_b', ticks: 9, loop: false }, { name: 'dodge_l', ticks: 9, loop: false }, { name: 'dodge_r', ticks: 9, loop: false },
  { name: 'skill_echo_needle', ticks: 18, loop: false, extra: { markers: { emit: [5] } } },
  { name: 'skill_resonant_knot', ticks: 24, loop: false, extra: { markers: { hit: [14] }, poseHolds: [[14, 15]] } },
  { name: 'ult_lumen_loom', ticks: 33, loop: false, extra: { markers: { hit: [9, 15, 21] }, poseHolds: [[9, 10], [15, 16], [21, 22]] } },
  { name: 'potion', ticks: 19, loop: false, extra: { markers: { heal: [18] } } },
  { name: 'hit_add', ticks: 6, loop: false, extra: { additive: true } },
  { name: 'down', ticks: 18, loop: false, extra: { holdLast: true } },
  { name: 'respawn', ticks: 9, loop: false },
  { name: 'victory', ticks: 36, loop: false },
];

export interface FixtureOptions {
  stage?: 'preview' | 'full';
  externalImage?: boolean;
  externalBuffer?: boolean;
  /** replace the clip list inside the GLB only (the manifest still lists the stage clips) */
  glbClips?: FixtureClip[];
  rootMotion?: boolean;
  omitNodes?: readonly string[];
  requiredExtension?: string;
  usedExtension?: string;
  textureSize?: { base: number; orm: number };
  /** subdivisions per box segment side; raises the triangle count past the budget */
  subdivide?: number;
  doubleSided?: boolean;
  alphaMode?: 'BLEND' | 'MASK';
  zeroWeightVertex?: boolean;
  /** the four FLOAT weights / joint indices of vertex 0 */
  vertex0Weights?: readonly number[];
  vertex0Joints?: readonly number[];
  /** store the weights as normalised UNSIGNED_BYTE: these raw values for vertex 0, [255, 0, 0, 0] for the rest */
  ubyteWeights?: readonly number[];
  /** the embedded base colour image is not a decodable PNG */
  brokenImage?: boolean;
}

// ---- tiny PNG ---------------------------------------------------------------------------------------------------------
function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}
export function flatPng(size: number, rgb: [number, number, number]): Buffer {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.alloc(1 + size * 3); for (let x = 0; x < size; x++) row.set(rgb, 1 + x * 3);
  const raw = Buffer.concat(Array.from({ length: size }, () => row));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// ---- skeleton ---------------------------------------------------------------------------------------------------------
type NodeDef = [name: string, parent: string | null, t: [number, number, number]];
const chain = (names: string[], parent: string, first: [number, number, number], step: [number, number, number]): NodeDef[] =>
  names.map((n, i) => [n, i === 0 ? parent : names[i - 1], i === 0 ? first : step]);
const side = (s: 'l' | 'r'): NodeDef[] => {
  const k = s === 'l' ? 1 : -1;
  return [
    ...chain([`clavicle_${s}`, `upperarm_${s}`, `forearm_${s}`, `hand_${s}`], 'chest', [0.05 * k, 0.08, 0], [0.12 * k, -0.04, 0]),
    [`thumb_${s}`, `hand_${s}`, [0.02 * k, -0.02, 0.02]], [`grip_${s}`, `hand_${s}`, [0.03 * k, -0.03, 0]],
    ...chain([`thigh_${s}`, `shin_${s}`, `foot_${s}`, `toe_${s}`], 'pelvis', [0.09 * k, -0.05, 0], [0, -0.34, 0.01]),
  ];
};
const SKELETON: NodeDef[] = [
  ['root', null, [0, 0, 0]], ['pelvis', 'root', [0, 0.8, 0]],
  ...chain(['spine_01', 'spine_02', 'chest', 'neck', 'head'], 'pelvis', [0, 0.07, 0], [0, 0.1, 0]),
  ...side('l'), ...side('r'),
  ['anchor_scarf_l', 'chest', [0.06, 0.14, -0.08]], ['anchor_scarf_r', 'chest', [-0.06, 0.14, -0.08]],
  ['anchor_sash_l', 'pelvis', [0.08, 0, -0.1]], ['anchor_sash_r', 'pelvis', [-0.08, 0, -0.1]],
  ['anchor_tassel_l', 'pelvis', [0.12, 0, 0.05]], ['anchor_tassel_r', 'pelvis', [-0.12, 0, 0.05]],
  ...chain(['scarf_l_01', 'scarf_l_02', 'scarf_l_03', 'scarf_l_04'], 'anchor_scarf_l', [0, -0.05, 0], [0, -0.15, -0.01]),
  ...chain(['scarf_r_01', 'scarf_r_02', 'scarf_r_03', 'scarf_r_04'], 'anchor_scarf_r', [0, -0.05, 0], [0, -0.13, -0.01]),
  ...chain(['sash_l_01', 'sash_l_02', 'sash_l_03'], 'anchor_sash_l', [0, -0.05, 0], [0, -0.09, 0]),
  ...chain(['sash_r_01', 'sash_r_02', 'sash_r_03'], 'anchor_sash_r', [0, -0.05, 0], [0, -0.07, 0]),
  ...chain(['tassel_l_01', 'tassel_l_02'], 'anchor_tassel_l', [0, -0.03, 0], [0, -0.09, 0]),
  ...chain(['tassel_r_01', 'tassel_r_02'], 'anchor_tassel_r', [0, -0.03, 0], [0, -0.07, 0]),
  ['socket_weapon_r', 'hand_r', [0, -0.04, 0.02]], ['weapon_katana', 'socket_weapon_r', [0, 0, 0]],
  ['socket_blade_base', 'weapon_katana', [0, 0, 0.12]], ['socket_blade_tip', 'weapon_katana', [0, 0, 0.8]],
  ['socket_sheath', 'chest', [0, 0, -0.14]], ['socket_throw_l', 'hand_l', [0, -0.03, 0.03]],
  ['socket_fx_chest', 'chest', [0, 0.02, 0.15]], ['socket_fx_ground', 'root', [0, 0, 0]],
];
export const BONE_NAMES = SKELETON.map((n) => n[0]).filter((n) => !n.startsWith('socket_') && !n.startsWith('anchor_') && n !== 'weapon_katana');

// ---- geometry -----------------------------------------------------------------------------------------------------------
/** A box between y0 and y1 split into `div` bands per face (each face a (1 x div) grid, subdivided again by `sub`). */
export function boxGeometry(w: number, d: number, y0: number, y1: number, div: number, sub: number) {
  const pos: number[] = [], nrm: number[] = [], uv: number[] = [], idx: number[] = [];
  const face = (o: number[], u: number[], v: number[], n: number[], nu: number, nv: number) => {
    const base = pos.length / 3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const a = i / nu, b = j / nv;
      pos.push(o[0] + u[0] * a + v[0] * b, o[1] + u[1] * a + v[1] * b, o[2] + u[2] * a + v[2] * b);
      nrm.push(n[0], n[1], n[2]); uv.push(a, b);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, e = c + 1;
      idx.push(a, b, c, b, e, c);
    }
  };
  const h = y1 - y0, hw = w / 2, hd = d / 2, nu = sub, nv = div * sub;
  face([-hw, y0, hd], [w, 0, 0], [0, h, 0], [0, 0, 1], nu, nv);
  face([hw, y0, -hd], [-w, 0, 0], [0, h, 0], [0, 0, -1], nu, nv);
  face([hw, y0, hd], [0, 0, -d], [0, h, 0], [1, 0, 0], nu, nv);
  face([-hw, y0, -hd], [0, 0, d], [0, h, 0], [-1, 0, 0], nu, nv);
  face([-hw, y1, hd], [w, 0, 0], [0, 0, -d], [0, 1, 0], nu, nu);
  face([-hw, y0, -hd], [w, 0, 0], [0, 0, d], [0, -1, 0], nu, nu);
  return { pos, nrm, uv, idx };
}

// ---- GLB writer -------------------------------------------------------------------------------------------------------
export class Bin {
  parts: Buffer[] = []; length = 0; views: Record<string, unknown>[] = []; accessors: Record<string, unknown>[] = [];
  view(data: Buffer, target?: number): number {
    const pad = (4 - (this.length % 4)) % 4; if (pad) { this.parts.push(Buffer.alloc(pad)); this.length += pad; }
    this.views.push({ buffer: 0, byteOffset: this.length, byteLength: data.length, ...(target ? { target } : {}) });
    this.parts.push(data); this.length += data.length; return this.views.length - 1;
  }
  floats(values: number[], type: string, width: number, minmax = false, target?: number): number {
    const b = Buffer.alloc(values.length * 4); values.forEach((v, i) => b.writeFloatLE(v, i * 4));
    const a: Record<string, unknown> = { bufferView: this.view(b, target), componentType: 5126, count: values.length / width, type };
    if (minmax) {
      const min = Array.from({ length: width }, () => Infinity), max = Array.from({ length: width }, () => -Infinity);
      values.forEach((v, i) => { const k = i % width, f = Math.fround(v); min[k] = Math.min(min[k], f); max[k] = Math.max(max[k], f); });
      a.min = min; a.max = max;
    }
    this.accessors.push(a); return this.accessors.length - 1;
  }
  ushorts(values: number[], type: string, width: number, target?: number): number {
    const b = Buffer.alloc(values.length * 2); values.forEach((v, i) => b.writeUInt16LE(v, i * 2));
    this.accessors.push({ bufferView: this.view(b, target), componentType: 5123, count: values.length / width, type });
    return this.accessors.length - 1;
  }
  ubytesNormalised(values: number[], type: string, width: number, target?: number): number {
    const b = Buffer.alloc(values.length); values.forEach((v, i) => b.writeUInt8(v, i));
    this.accessors.push({ bufferView: this.view(b, target), componentType: 5121, normalized: true, count: values.length / width, type });
    return this.accessors.length - 1;
  }
  uints(values: number[]): number {
    const b = Buffer.alloc(values.length * 4); values.forEach((v, i) => b.writeUInt32LE(v, i * 4));
    this.accessors.push({ bufferView: this.view(b, 34963), componentType: 5125, count: values.length, type: 'SCALAR' });
    return this.accessors.length - 1;
  }
}

export function buildFixtureGlb(o: FixtureOptions = {}): Uint8Array {
  const stage = o.stage ?? 'preview';
  const clips = o.glbClips ?? (stage === 'full' ? FULL_CLIPS : PREVIEW_CLIPS);
  const defs = SKELETON.filter((n) => !o.omitNodes?.includes(n[0]));
  const index = new Map(defs.map((d, i) => [d[0], i]));
  const nodes: Record<string, unknown>[] = defs.map(([name, , t]) => ({ name, translation: t }));
  defs.forEach(([name, parent], i) => {
    if (!parent) return;
    const p = index.get(parent) ?? index.get('root')!;
    ((nodes[p].children ??= []) as number[]).push(i);
    void name;
  });
  const world = new Map<string, [number, number, number]>();
  for (const [name, parent, t] of defs) {
    const pw = (parent && world.get(parent)) || [0, 0, 0];
    world.set(name, [pw[0] + t[0], pw[1] + t[1], pw[2] + t[2]]);
  }
  const bin = new Bin();
  // skin: every named bone present is a joint; vertices bind to pelvis (low), chest (middle), head (top)
  const joints = defs.map((d) => d[0]).filter((n) => BONE_NAMES.includes(n));
  const ibm: number[] = [];
  for (const j of joints) { const w = world.get(j)!; ibm.push(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -w[0], -w[1], -w[2], 1); }
  const body = boxGeometry(0.36, 0.24, 0, 1.5, 6, o.subdivide ?? 1);
  const ji: number[] = [], jw: number[] = [];
  const pick = (n: string) => Math.max(0, joints.indexOf(n));
  for (let v = 0; v < body.pos.length / 3; v++) {
    const y = body.pos[v * 3 + 1];
    if (v === 0 && o.vertex0Joints) ji.push(...o.vertex0Joints); else ji.push(pick(y < 0.6 ? 'pelvis' : y < 1.2 ? 'chest' : 'head'), 0, 0, 0);
    if (o.ubyteWeights) jw.push(...(v === 0 ? o.ubyteWeights : [255, 0, 0, 0]));
    else if (v === 0 && o.vertex0Weights) jw.push(...o.vertex0Weights);
    else jw.push(o.zeroWeightVertex && v === 0 ? 0 : 1, 0, 0, 0);
  }
  const blade = boxGeometry(0.03, 0.02, -0.01, 0.01, 1, 1);
  for (let i = 2; i < blade.pos.length; i += 3) blade.pos[i] = blade.pos[i] > 0 ? 0.8 : 0.0;
  const prim = (g: ReturnType<typeof boxGeometry>, extra: Record<string, number>) => ({
    attributes: {
      POSITION: bin.floats(g.pos, 'VEC3', 3, true, 34962), NORMAL: bin.floats(g.nrm, 'VEC3', 3, false, 34962),
      TEXCOORD_0: bin.floats(g.uv, 'VEC2', 2, false, 34962), ...extra,
    },
    indices: bin.uints(g.idx), material: 0, mode: 4,
  });
  const weights = o.ubyteWeights ? bin.ubytesNormalised(jw, 'VEC4', 4, 34962) : bin.floats(jw, 'VEC4', 4, false, 34962);
  const bodyPrim = prim(body, { JOINTS_0: bin.ushorts(ji, 'VEC4', 4, 34962), WEIGHTS_0: weights });
  const bladePrim = prim(blade, {});
  const meshes = [{ name: 'seyrin_fixture_body', primitives: [bodyPrim] }, { name: 'seyrin_fixture_blade', primitives: [bladePrim] }];
  const bodyNode = nodes.push({ name: 'fixture_body', mesh: 0, skin: 0 }) - 1;
  if (index.has('weapon_katana')) (nodes[index.get('weapon_katana')!] as Record<string, unknown>).mesh = 1;
  const skins = [{ joints: joints.map((j) => index.get(j)!), inverseBindMatrices: bin.floats(ibm, 'MAT4', 16), skeleton: index.get('root') }];

  const base = o.brokenImage ? Buffer.from('not an image at all') : flatPng(o.textureSize?.base ?? 1024, [150, 150, 150]);
  const orm = flatPng(o.textureSize?.orm ?? 512, [255, 200, 0]);
  const images: Record<string, unknown>[] = [{ bufferView: bin.view(base), mimeType: 'image/png' }, { bufferView: bin.view(orm), mimeType: 'image/png' }];
  if (o.externalImage) images[0] = { uri: 'tex_basecolor.png' };

  const animations = clips.map((c) => {
    const times = Array.from({ length: c.ticks + 1 }, (_, i) => i / FPS);
    const input = bin.floats(times, 'SCALAR', 1, true);
    const samplers: Record<string, unknown>[] = [], channels: Record<string, unknown>[] = [];
    const track = (node: string, path: string, values: number[], type: string, width: number) => {
      if (!index.has(node)) return;
      samplers.push({ input, output: bin.floats(values, type, width), interpolation: 'LINEAR' });
      channels.push({ sampler: samplers.length - 1, target: { node: index.get(node), path } });
    };
    track('root', 'translation', times.flatMap((_, i) => [0, 0, o.rootMotion && c.name === 'run' ? i * 0.05 : 0]), 'VEC3', 3);
    track('root', 'rotation', times.flatMap(() => [0, 0, 0, 1]), 'VEC4', 4);
    // a visible, clip-specific motion: the chest leans (quaternion about X), attack_03 also lifts the pelvis (ticks 3-9)
    const lean = 0.1 + (c.name.length % 5) * 0.05;
    track('chest', 'rotation', times.flatMap((_, i) => { const a = lean * Math.sin((Math.PI * i) / c.ticks); return [Math.sin(a / 2), 0, 0, Math.cos(a / 2)]; }), 'VEC4', 4);
    track('pelvis', 'translation', times.flatMap((_, i) => {
      const q = Math.min(1, Math.max(0, (i - 3) / 6));
      return [0, 0.8 + (c.name === 'attack_03' ? 0.12 * 4 * q * (1 - q) : 0), 0];
    }), 'VEC3', 3);
    return { name: c.name, samplers, channels };
  });

  const json: Record<string, unknown> = {
    asset: { version: '2.0', generator: 'synes tests/seyrinFixture.ts (test data)' },
    scene: 0, scenes: [{ nodes: [index.get('root')!, bodyNode] }], nodes, meshes, skins, animations,
    materials: [{
      name: 'fixture_mat',
      pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicRoughnessTexture: { index: 1 }, metallicFactor: 1, roughnessFactor: 1 },
      occlusionTexture: { index: 1 }, ...(o.doubleSided ? { doubleSided: true } : {}), ...(o.alphaMode ? { alphaMode: o.alphaMode } : {}),
    }],
    textures: [{ source: 0 }, { source: 1 }], images,
    accessors: bin.accessors, bufferViews: bin.views,
    buffers: [{ byteLength: bin.length, ...(o.externalBuffer ? { uri: 'geometry.bin' } : {}) }],
    ...(o.requiredExtension ? { extensionsRequired: [o.requiredExtension], extensionsUsed: [o.requiredExtension] } : {}),
    ...(o.usedExtension ? { extensionsUsed: [o.usedExtension] } : {}),
  };
  return writeGlb(json, Buffer.concat(bin.parts));
}

export function writeGlb(json: unknown, bin: Buffer): Uint8Array {
  const pad = (b: Buffer, fill: number) => { const n = (4 - (b.length % 4)) % 4; return n ? Buffer.concat([b, Buffer.alloc(n, fill)]) : b; };
  const j = pad(Buffer.from(JSON.stringify(json), 'utf8'), 0x20), b = pad(bin, 0);
  const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + j.length + 8 + b.length, 8);
  const ch = (len: number, type: number) => { const h = Buffer.alloc(8); h.writeUInt32LE(len, 0); h.writeUInt32LE(type, 4); return h; };
  const out = Buffer.concat([head, ch(j.length, 0x4e4f534a), j, ch(b.length, 0x004e4942), b]);
  return new Uint8Array(out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength));
}

export async function sha256Hex(data: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', data as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(d), (x) => x.toString(16).padStart(2, '0')).join('');
}

/** A manifest that matches the GLB produced with the same options (team B's proposed field names). */
export async function buildFixtureManifest(glb: Uint8Array, stage: 'preview' | 'full' = 'preview'): Promise<Record<string, any>> {
  return {
    schema: 'synes.hero-manifest/1', assetId: 'fixture_hero_box', version: 'v01', stage,
    units: 'meter', axes: { up: '+Y', forward: '+Z' }, rootMotion: 0,
    output: { file: 'fixture_hero_box_v01.glb', sha256: await sha256Hex(glb), bytes: glb.byteLength },
    // deep copy: tests edit the manifest, and the clip tables above must stay untouched
    clips: structuredClone((stage === 'full' ? FULL_CLIPS : PREVIEW_CLIPS).map((c) => ({ name: c.name, ticks: c.ticks, loop: c.loop, ...(c.extra ?? {}) }))),
  };
}
