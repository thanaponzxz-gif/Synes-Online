// Checks a Seyrin GLB + manifest that already sit in memory (DES-009 §3.3). Pure: no DOM, no three.js, no network.
//   block  -> the file is not shown (not self-contained, unreadable, or it does not match its manifest / stage allowlist)
//   check  -> a delivery rule that is measured and reported pass/fail; the file can still be looked at
//   info   -> a measurement with no pass/fail of its own
import { ANCHORS, BONES, BUDGET, CLOTH_BONES, FPS, MANIFEST_SCHEMA, SOCKETS, STAGE_CLIPS, WEAPON_NODE, type ClipSpec, type Stage } from './spec.ts';

export type Level = 'block' | 'check' | 'info';
export interface CheckItem { id: string; level: Level; ok: boolean; detail: string }
export interface TextureStat { use: 'baseColor' | 'orm'; width: number; height: number }
export interface InspectStats {
  stage: Stage | null; bytes: number; tris: number; materials: number; primitives: number; bones: number; joints: number;
  textures: TextureStat[]; clips: { name: string; seconds: number; ticks: number }[]; sha256: string;
}
export interface InspectReport { accepted: boolean; items: CheckItem[]; stats: InspectStats; manifest: Record<string, any> | null }

type Json = Record<string, any>;
export interface Glb { json: Json; bin: Uint8Array }

const CHUNK_JSON = 0x4e4f534a, CHUNK_BIN = 0x004e4942;
export function parseGlb(bytes: Uint8Array): Glb {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength < 20 || dv.getUint32(0, true) !== 0x46546c67) throw new Error('not a GLB file');
  if (dv.getUint32(4, true) !== 2) throw new Error('not glTF 2.0');
  if (dv.getUint32(8, true) !== bytes.byteLength) throw new Error(`length in header (${dv.getUint32(8, true)}) differs from the file size (${bytes.byteLength})`);
  let json: Json | null = null, bin: Uint8Array = new Uint8Array(0), off = 12;
  while (off + 8 <= bytes.byteLength) {
    const len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true), start = off + 8;
    if (start + len > bytes.byteLength) throw new Error('a chunk runs past the end of the file');
    if (type === CHUNK_JSON) json = JSON.parse(new TextDecoder().decode(bytes.subarray(start, start + len)));
    else if (type === CHUNK_BIN) bin = bytes.subarray(start, start + len);
    off = start + len;
  }
  if (!json || typeof json !== 'object') throw new Error('no JSON chunk');
  return { json, bin };
}

const WIDTH: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
const COMP: Record<number, [number, (d: DataView, o: number) => number, number]> = {
  5120: [1, (d, o) => d.getInt8(o), 127], 5121: [1, (d, o) => d.getUint8(o), 255],
  5122: [2, (d, o) => d.getInt16(o, true), 32767], 5123: [2, (d, o) => d.getUint16(o, true), 65535],
  5125: [4, (d, o) => d.getUint32(o, true), 4294967295], 5126: [4, (d, o) => d.getFloat32(o, true), 1],
};
function readAccessor(g: Glb, i: number): { data: number[]; width: number } {
  const a = g.json.accessors?.[i];
  if (!a) throw new Error(`accessor ${i} missing`);
  if (a.sparse || a.bufferView === undefined) throw new Error('sparse / empty accessors are not supported by the checker');
  const v = g.json.bufferViews[a.bufferView], width = WIDTH[a.type], comp = COMP[a.componentType];
  if (!v || !width || !comp || (v.buffer ?? 0) !== 0) throw new Error(`accessor ${i} cannot be read`);
  const [size, get, norm] = comp, stride = v.byteStride || size * width;
  const base = (v.byteOffset || 0) + (a.byteOffset || 0);
  if (base + stride * (a.count - 1) + size * width > g.bin.byteLength) throw new Error(`accessor ${i} is outside the binary chunk`);
  const dv = new DataView(g.bin.buffer, g.bin.byteOffset, g.bin.byteLength);
  const data = new Array<number>(a.count * width);
  for (let k = 0; k < a.count; k++) for (let c = 0; c < width; c++) {
    const raw = get(dv, base + k * stride + c * size);
    data[k * width + c] = a.normalized && a.componentType !== 5126 ? Math.max(-1, raw / norm) : raw;
  }
  return { data, width };
}

function pngSize(b: Uint8Array): { width: number; height: number } | null {
  if (b.byteLength < 24 || b[0] !== 137 || b[1] !== 80 || b[2] !== 78 || b[3] !== 71) return null;
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return { width: dv.getUint32(16), height: dv.getUint32(20) };
}
function imageBytes(g: Glb, i: number): Uint8Array | null {
  const img = g.json.images?.[i];
  if (!img) return null;
  if (img.bufferView !== undefined) { const v = g.json.bufferViews[img.bufferView]; return g.bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength); }
  const m = /^data:[^;,]*;base64,(.*)$/s.exec(img.uri ?? '');
  return m ? Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0)) : null;
}

export async function sha256Of(bytes: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(d), (x) => x.toString(16).padStart(2, '0')).join('');
}

const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const near = (a: number, b: number, e = 1e-4) => Math.abs(a - b) <= e;

function manifestProblems(m: any): string[] {
  const p: string[] = [];
  if (!m || typeof m !== 'object') return ['not an object'];
  if (m.schema !== MANIFEST_SCHEMA) p.push(`schema must be "${MANIFEST_SCHEMA}"`);
  if (m.stage !== 'preview' && m.stage !== 'full') p.push('stage must be "preview" or "full"');
  if (m.units !== 'meter') p.push('units must be "meter"');
  if (m.axes?.up !== '+Y' || m.axes?.forward !== '+Z') p.push('axes must be up +Y, forward +Z');
  if (m.rootMotion !== 0) p.push('rootMotion must be 0');
  if (typeof m.assetId !== 'string' || !m.assetId || typeof m.version !== 'string' || !m.version) p.push('assetId and version are required');
  if (!/^[0-9a-f]{64}$/i.test(m.output?.sha256 ?? '')) p.push('output.sha256 must be 64 hex characters');
  if (!Number.isInteger(m.output?.bytes)) p.push('output.bytes must be an integer');
  if (!Array.isArray(m.clips) || m.clips.some((c: any) => !c || typeof c.name !== 'string' || !Number.isInteger(c.ticks) || typeof c.loop !== 'boolean')) p.push('clips[] needs name, ticks, loop');
  return p;
}

/** DES values a manifest clip must repeat exactly. Extra fields in the manifest are ignored. */
function contractProblems(spec: ClipSpec, c: any): string[] {
  const p: string[] = [];
  if (c.ticks !== spec.ticks) p.push(`${spec.name}: ticks ${c.ticks} != ${spec.ticks}`);
  if (c.loop !== spec.loop) p.push(`${spec.name}: loop ${c.loop} != ${spec.loop}`);
  for (const [k, v] of Object.entries(spec.markers ?? {})) if (!eq(c.markers?.[k], v)) p.push(`${spec.name}: markers.${k} ${JSON.stringify(c.markers?.[k])} != ${JSON.stringify(v)}`);
  if (spec.poseHold && !eq(c.poseHold, spec.poseHold)) p.push(`${spec.name}: poseHold ${JSON.stringify(c.poseHold)} != ${JSON.stringify(spec.poseHold)}`);
  if (spec.yLift) for (const [k, v] of Object.entries(spec.yLift)) if (!(typeof c.yLift?.[k] === 'number' && near(c.yLift[k], v, 1e-6))) p.push(`${spec.name}: yLift.${k} ${c.yLift?.[k]} != ${v}`);
  if (spec.additive && c.additive !== true) p.push(`${spec.name}: additive must be true`);
  if (spec.holdLast && c.holdLast !== true) p.push(`${spec.name}: holdLast must be true`);
  return p;
}

export async function inspectHeroFiles(bytes: Uint8Array, manifestText: string): Promise<InspectReport> {
  const items: CheckItem[] = [];
  const add = (id: string, level: Level, ok: boolean, detail: string) => { items.push({ id, level, ok, detail }); return ok; };
  const stats: InspectStats = { stage: null, bytes: bytes.byteLength, tris: 0, materials: 0, primitives: 0, bones: 0, joints: 0, textures: [], clips: [], sha256: await sha256Of(bytes) };
  const done = (manifest: Json | null): InspectReport => ({ accepted: items.every((i) => i.level !== 'block' || i.ok), items, stats, manifest });

  let manifest: Json | null = null;
  try {
    const m = JSON.parse(manifestText);
    const p = manifestProblems(m);
    add('manifest', 'block', p.length === 0, p.join('; ') || 'schema, stage, units, axes, rootMotion, output, clips');
    if (!p.length) { manifest = m; stats.stage = m.stage; }
  } catch (e) { add('manifest', 'block', false, `not JSON: ${(e as Error).message}`); }

  let g: Glb;
  try { g = parseGlb(bytes); add('glb', 'block', true, 'glTF 2.0 binary'); }
  catch (e) { add('glb', 'block', false, (e as Error).message); return done(manifest); }
  const j = g.json;

  const external = [...(j.buffers ?? []).map((b: Json, i: number) => [`buffers[${i}]`, b.uri, i] as const), ...(j.images ?? []).map((m: Json, i: number) => [`images[${i}]`, m.uri, -1] as const)]
    .filter(([, uri, i]) => (uri !== undefined && !String(uri).startsWith('data:')) || (uri === undefined && i > 0))
    .map(([w, uri]) => `${w} -> ${uri ?? '(no data)'}`);
  if (!add('self-contained', 'block', external.length === 0, external.join(', ') || 'all buffers and images are inside the file')) return done(manifest);
  const req: string[] = j.extensionsRequired ?? [];
  add('extensions-required', 'block', req.length === 0, req.join(', ') || 'none');

  if (manifest) {
    add('sha256', 'block', manifest.output.sha256.toLowerCase() === stats.sha256, `file ${stats.sha256} / manifest ${manifest.output.sha256}`);
    add('bytes', 'block', manifest.output.bytes === bytes.byteLength, `file ${bytes.byteLength} / manifest ${manifest.output.bytes}`);
  }

  const nodes: Json[] = j.nodes ?? [], parent = new Array<number>(nodes.length).fill(-1);
  nodes.forEach((n, i) => (n.children ?? []).forEach((c: number) => { parent[c] = i; }));
  const byName = new Map<string, number>();
  nodes.forEach((n, i) => { if (n.name && !byName.has(n.name)) byName.set(n.name, i); });
  const skinnedNodes = nodes.filter((n) => n.mesh !== undefined && n.skin !== undefined);
  add('skinned', 'block', skinnedNodes.length > 0 && (j.skins?.length ?? 0) > 0, `${skinnedNodes.length} skinned mesh node(s)`);

  // clips: names, real lengths
  const anims: Json[] = j.animations ?? [];
  const span = (a: Json) => {
    let lo = Infinity, hi = -Infinity;
    for (const s of a.samplers ?? []) {
      const acc = j.accessors?.[s.input];
      if (acc?.min && acc?.max) { lo = Math.min(lo, acc.min[0]); hi = Math.max(hi, acc.max[0]); }
      else { const d = readAccessor(g, s.input).data; lo = Math.min(lo, d[0]); hi = Math.max(hi, d[d.length - 1]); }
    }
    return { lo, hi };
  };
  const lengthProblems: string[] = [];
  const spec = manifest ? STAGE_CLIPS[manifest.stage as Stage] : null;
  for (const a of anims) {
    try {
      const { lo, hi } = span(a);
      stats.clips.push({ name: a.name ?? '(unnamed)', seconds: hi, ticks: hi * FPS });
      const s = spec?.find((c) => c.name === a.name);
      if (s && (!near(lo, 0, 0.002) || !near(hi, s.ticks / FPS, 0.002))) lengthProblems.push(`${a.name}: keys ${lo.toFixed(4)}..${hi.toFixed(4)} s, expected 0..${(s.ticks / FPS).toFixed(4)} s`);
    } catch (e) { lengthProblems.push(`${a.name}: ${(e as Error).message}`); }
  }
  if (spec && manifest) {
    const want = spec.map((c) => c.name).sort();
    const inGlb = anims.map((a) => String(a.name)).sort(), inManifest = (manifest.clips as Json[]).map((c) => c.name as string).sort();
    const diff = (have: string[]) => [...want.filter((n) => !have.includes(n)).map((n) => `missing ${n}`), ...have.filter((n, i) => !want.includes(n) || have.indexOf(n) !== i).map((n) => `unexpected ${n}`)].join(', ');
    add('clip-allowlist', 'block', eq(inGlb, want) && eq(inManifest, want), eq(inGlb, want) && eq(inManifest, want) ? `${manifest.stage}: ${want.length} clips` : `GLB [${diff(inGlb) || 'ok'}] manifest [${diff(inManifest) || 'ok'}]`);
    const contract = spec.flatMap((s) => { const c = (manifest!.clips as Json[]).find((x) => x.name === s.name); return c ? contractProblems(s, c) : []; });
    add('clip-contract', 'block', contract.length === 0, contract.join('; ') || 'ticks, loop, markers, pose hold, lift match DES-007');
    add('clip-length', 'block', lengthProblems.length === 0, lengthProblems.join('; ') || 'every clip is ticks/30 seconds');
  }

  // ---- measured delivery rules --------------------------------------------------------------------------------------
  const draws: Json[] = nodes.filter((n) => n.mesh !== undefined).flatMap((n) => (j.meshes?.[n.mesh]?.primitives ?? []).map((p: Json) => ({ ...p, skinned: n.skin !== undefined })));
  let tris = 0, nonTriangles = 0;
  for (const p of draws) {
    if ((p.mode ?? 4) !== 4) { nonTriangles++; continue; }
    tris += (j.accessors?.[p.indices ?? p.attributes.POSITION]?.count ?? 0) / 3;
  }
  stats.tris = tris; stats.primitives = draws.length; stats.materials = j.materials?.length ?? 0;
  add('tris', 'check', tris <= BUDGET.trisMax && !nonTriangles, `${tris} triangles (max ${BUDGET.trisMax}, target ${BUDGET.trisTarget})${nonTriangles ? `; ${nonTriangles} non-triangle primitive(s)` : ''}`);
  add('materials', 'check', stats.materials <= BUDGET.materialsMax, `${stats.materials} material(s) (max ${BUDGET.materialsMax})`);
  add('primitives', 'check', draws.length <= BUDGET.primitivesMax, `${draws.length} drawn primitive(s) (max ${BUDGET.primitivesMax})`);
  add('bytes-budget', 'check', bytes.byteLength <= BUDGET.bytesMax, `${bytes.byteLength} bytes (max ${BUDGET.bytesMax}, target ${BUDGET.bytesTarget})`);

  const mats: Json[] = j.materials ?? [];
  const texProblems: string[] = [];
  const texOf = (info: Json | undefined) => (info ? j.textures?.[info.index]?.source : undefined);
  const seen = new Set<string>();
  const measure = (use: TextureStat['use'], source: number | undefined, size: number, mat: string) => {
    if (source === undefined) { texProblems.push(`${mat}: no ${use} texture`); return; }
    const b = imageBytes(g, source), dim = b && pngSize(b);
    if (!dim) { texProblems.push(`${mat}: ${use} image is not an embedded PNG`); return; }
    if (!seen.has(`${use}:${source}`)) { seen.add(`${use}:${source}`); stats.textures.push({ use, ...dim }); }
    if (dim.width !== size || dim.height !== size) texProblems.push(`${use} is ${dim.width}x${dim.height}, expected ${size}x${size}`);
  };
  mats.forEach((m, i) => {
    const name = m.name ?? `material ${i}`, pbr = m.pbrMetallicRoughness ?? {};
    measure('baseColor', texOf(pbr.baseColorTexture), BUDGET.baseColor, name);
    measure('orm', texOf(pbr.metallicRoughnessTexture), BUDGET.orm, name);
    if (texOf(m.occlusionTexture) !== texOf(pbr.metallicRoughnessTexture)) texProblems.push(`${name}: occlusion must use the same packed ORM image`);
  });
  add('textures', 'check', texProblems.length === 0 && mats.length > 0, texProblems.join('; ') || stats.textures.map((t) => `${t.use} ${t.width}x${t.height}`).join(', '));
  const alpha = mats.filter((m) => (m.alphaMode ?? 'OPAQUE') !== 'OPAQUE' || m.doubleSided).map((m, i) => m.name ?? `material ${i}`);
  add('material-opaque', 'check', alpha.length === 0, alpha.length ? `not OPAQUE single-sided: ${alpha.join(', ')}` : 'OPAQUE, single sided');
  const maps = mats.filter((m) => m.normalTexture || m.emissiveTexture || (m.emissiveFactor ?? [0, 0, 0]).some((x: number) => x > 1e-6));
  add('no-extra-maps', 'check', maps.length === 0, maps.length ? 'normal / emissive data present' : 'no normal or emissive map');
  const used: string[] = j.extensionsUsed ?? [];
  add('extensions', 'check', used.length === 0, used.join(', ') || 'none');

  const jointSets: string[][] = (j.skins ?? []).map((s: Json) => s.joints.map((i: number) => nodes[i]?.name ?? `node ${i}`));
  stats.joints = Math.max(0, ...jointSets.map((s) => s.length));
  stats.bones = BONES.filter((b) => byName.has(b)).length;
  const missing = BONES.filter((b) => !byName.has(b)), extra = [...new Set(jointSets.flat().filter((n) => !BONES.includes(n)))];
  add('bones', 'check', !missing.length && !extra.length && stats.joints <= BUDGET.jointsMax,
    [`${stats.bones}/${BONES.length} bones, ${stats.joints} skin joints (max ${BUDGET.jointsMax})`, missing.length ? `missing: ${missing.join(' ')}` : '', extra.length ? `joints outside the list: ${extra.join(' ')}` : ''].filter(Boolean).join('; '));

  const nameOf = (i: number) => (i < 0 ? '(scene)' : nodes[i].name);
  const under = (i: number, ancestor: string) => { for (let p = parent[i]; p >= 0; p = parent[p]) if (nodes[p].name === ancestor) return true; return false; };
  const socketProblems = Object.entries(SOCKETS).flatMap(([s, want]) => {
    const i = byName.get(s);
    if (i === undefined) return [`${s} missing`];
    if (nameOf(parent[i]) !== want) return [`${s} is under ${nameOf(parent[i])}, expected ${want}`];
    return (nodes[i].scale ?? [1, 1, 1]).every((v: number) => near(v, 1)) ? [] : [`${s} scale is not 1`];
  });
  add('sockets', 'check', !socketProblems.length, socketProblems.join('; ') || `${Object.keys(SOCKETS).length} sockets under the right parents`);
  const anchorProblems = Object.entries(ANCHORS).flatMap(([a, want]) => { const i = byName.get(a); return i === undefined ? [`${a} missing`] : under(i, want) ? [] : [`${a} is not under ${want}`]; });
  add('anchors', 'check', !anchorProblems.length, anchorProblems.join('; ') || `${Object.keys(ANCHORS).length} cloth anchors`);
  const weapon = byName.get(WEAPON_NODE);
  const weaponMesh = weapon !== undefined && nodes.some((n, i) => n.mesh !== undefined && n.skin === undefined && (i === weapon || under(i, WEAPON_NODE)));
  add('weapon', 'check', weaponMesh && under(weapon!, 'socket_weapon_r') && skinnedNodes.length === 1,
    `${WEAPON_NODE}: ${weapon === undefined ? 'missing' : weaponMesh ? 'rigid mesh' : 'no rigid mesh'}; ${skinnedNodes.length} skinned mesh node(s) (expected 1)`);

  const root = byName.get('root'), rootProblems: string[] = [], clothTracks = new Set<string>();
  for (const a of anims) for (const ch of a.channels ?? []) {
    const target = ch.target?.node;
    if (CLOTH_BONES.includes(nodes[target]?.name)) clothTracks.add(a.name);
    if (target !== root || root === undefined) continue;
    try {
      const { data, width } = readAccessor(g, a.samplers[ch.sampler].output);
      const rest: number[] = ch.target.path === 'translation' ? [0, 0, 0] : ch.target.path === 'scale' ? [1, 1, 1] : nodes[root].rotation ?? [0, 0, 0, 1];
      if (data.some((v, k) => !near(v, rest[k % width]))) rootProblems.push(`${a.name}: root ${ch.target.path} changes`);
    } catch (e) { rootProblems.push(`${a.name}: ${(e as Error).message}`); }
  }
  add('root-motion', 'check', !rootProblems.length, rootProblems.join('; ') || 'root stays at its rest transform in every clip');
  const negative = nodes.filter((n) => (n.scale ?? []).some((v: number) => v < 0) || (n.matrix && det3(n.matrix) < 0)).map((n) => n.name);
  add('transforms', 'check', !negative.length, negative.length ? `negative scale: ${negative.join(', ')}` : 'no negative scale');

  const weightProblems: string[] = [];
  for (const p of draws.filter((d) => d.skinned)) {
    if (p.attributes.JOINTS_1 !== undefined) weightProblems.push('more than 4 influences (JOINTS_1 present)');
    if (p.attributes.WEIGHTS_0 === undefined) { weightProblems.push('skinned primitive without WEIGHTS_0'); continue; }
    try {
      const { data } = readAccessor(g, p.attributes.WEIGHTS_0);
      let bad = 0;
      for (let v = 0; v < data.length; v += 4) if (!near(data[v] + data[v + 1] + data[v + 2] + data[v + 3], 1, 0.02)) bad++;
      if (bad) weightProblems.push(`${bad} vertex(es) whose weights do not sum to 1`);
    } catch (e) { weightProblems.push((e as Error).message); }
  }
  add('weights', 'check', !weightProblems.length, weightProblems.join('; ') || 'every skinned vertex is weighted (max 4, normalised)');

  let minY = Infinity, maxY = -Infinity;
  for (const p of draws.filter((d) => d.skinned)) {
    const a = j.accessors?.[p.attributes.POSITION];
    if (a?.min && a?.max) { minY = Math.min(minY, a.min[1]); maxY = Math.max(maxY, a.max[1]); }
  }
  add('height', 'info', true, Number.isFinite(minY) ? `skinned mesh bind pose y ${minY.toFixed(3)}..${maxY.toFixed(3)} m (design: feet at 0, 1.5 m tall)` : 'not measurable');
  add('cloth-tracks', 'info', true, clothTracks.size ? `clips with keys on cloth bones: ${[...clothTracks].join(', ')}` : 'no clip keys the cloth bones');
  add('generator', 'info', true, String(j.asset?.generator ?? 'unknown'));
  return done(manifest);
}

/** Determinant of the upper-left 3x3 of a column-major 4x4 matrix. */
function det3(m: number[]): number {
  return m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2]);
}
