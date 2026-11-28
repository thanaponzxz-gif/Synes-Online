// Checks a boss GLB + manifest against DES-010 §3.1 / §3.4 from the bytes themselves. Nothing the manifest says about the
// file (status, measurements) is believed without measuring. Separate from the hero checker (inspect.ts), whose strictness
// is untouched; only the byte readers are shared.
// `block` = the file is refused and the old boss stays (§5.3 item 8); `check` = a delivery rule of C1, reported; `info` = a note.
import { parseGlb, readAccessor, pngSize, imageBytes, sha256Of, det3, type Glb, type CheckItem, type Level } from '../seyrin/inspect.ts';
import { BOSS_SCHEMA, BOSS_PROFILE, BOSS_RULESET, BOSS_BONES, BOSS_SOCKETS, BOSS_BUDGET as B, STAGE_CLIPS, FPS, type BossStage, type BossClipSpec } from './spec.ts';

type Json = Record<string, any>;
export interface BossStats {
  stage: BossStage | null; bytes: number; sha256: string; tris: number; vertices: number; materials: number; primitives: number; joints: number;
  textures: { use: string; width: number; height: number }[]; clips: { name: string; ticks: number }[];
  /** bind pose, metres: horizontal radius of every vertex from the origin, lowest and highest point */
  bindRadiusM: number; minYM: number; maxYM: number;
}
export interface BossReport { accepted: boolean; items: CheckItem[]; stats: BossStats; manifest: Json | null }

const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const near = (a: number, b: number, e = 1e-4) => Math.abs(a - b) <= e;

function manifestProblems(m: any): string[] {
  const p: string[] = [];
  if (!m || typeof m !== 'object') return ['not an object'];
  const want: [string, unknown][] = [['schema', BOSS_SCHEMA], ['assetId', 'boss_crab'], ['profileId', BOSS_PROFILE], ['simKind', 'prismback'], ['units', 'meter'], ['rootMotion', 0]];
  for (const [k, v] of want) if (m[k] !== v) p.push(`${k} is ${JSON.stringify(m[k])}, expected ${JSON.stringify(v)}`);
  if (typeof m.version !== 'string' || !/^v\d\d$/.test(m.version)) p.push('version must be vNN');
  if (!Array.isArray(m.rulesets) || !eq(m.rulesets, [BOSS_RULESET])) p.push(`rulesets must be ["${BOSS_RULESET}"]`);
  if (m.stage !== 'preview' && m.stage !== 'combat') p.push(`stage is ${JSON.stringify(m.stage)}`);
  if (m.axes?.up !== '+Y' || m.axes?.forward !== '+Z') p.push('axes must be up +Y, forward +Z');
  if (typeof m.output?.file !== 'string' || !/^[0-9a-f]{64}$/i.test(m.output?.sha256 ?? '') || !Number.isInteger(m.output?.bytes)) p.push('output needs file, sha256, bytes');
  if (!Array.isArray(m.clips)) p.push('clips missing');
  for (const k of ['bones', 'sockets']) if (!Array.isArray(m[k])) p.push(`${k} missing`);
  for (const k of ['measurements', 'source', 'tools', 'motionProfile']) if (!m[k] || typeof m[k] !== 'object') p.push(`${k} missing`);
  if (m.motionProfile && (m.motionProfile.fps !== FPS || m.motionProfile.clock !== 'telegraph-and-state' || m.motionProfile.rootMotion !== 0)) p.push('motionProfile must be fps 30, clock telegraph-and-state, rootMotion 0');
  return p;
}
function contractProblems(s: BossClipSpec, c: any): string[] {
  const p: string[] = [];
  if (c.ticks !== s.ticks) p.push(`${s.name}: ticks ${c.ticks} != ${s.ticks}`);
  if (c.loop !== s.loop) p.push(`${s.name}: loop ${c.loop} != ${s.loop}`);
  if (!eq(c.markers ?? {}, s.markers)) p.push(`${s.name}: markers ${JSON.stringify(c.markers)} != ${JSON.stringify(s.markers)}`);
  if (!eq(c.phases, s.phases)) p.push(`${s.name}: phases ${JSON.stringify(c.phases)} != ${JSON.stringify(s.phases)}`);
  if (!eq(c.poseHolds ?? [], s.poseHolds ?? [])) p.push(`${s.name}: poseHolds ${JSON.stringify(c.poseHolds)} != ${JSON.stringify(s.poseHolds ?? [])}`);
  if (!!c.holdLast !== !!s.holdLast) p.push(`${s.name}: holdLast ${c.holdLast} != ${!!s.holdLast}`);
  return p;
}

export async function inspectBossFiles(bytes: Uint8Array, manifestText: string, wantStage: BossStage = 'combat'): Promise<BossReport> {
  const items: CheckItem[] = [];
  const add = (id: string, level: Level, ok: boolean, detail: string) => { items.push({ id, level, ok, detail }); return ok; };
  const stats: BossStats = { stage: null, bytes: bytes.byteLength, sha256: await sha256Of(bytes), tris: 0, vertices: 0, materials: 0, primitives: 0, joints: 0, textures: [], clips: [], bindRadiusM: NaN, minYM: NaN, maxYM: NaN };
  const done = (manifest: Json | null): BossReport => ({ accepted: items.every((i) => i.level !== 'block' || i.ok), items, stats, manifest });

  let manifest: Json | null = null;
  try {
    const m = JSON.parse(manifestText), p = manifestProblems(m);
    add('manifest', 'block', p.length === 0, p.join('; ') || 'schema, ids, profile, simKind, rulesets, stage, units, axes, rootMotion, output, clips');
    if (!p.length) { manifest = m; stats.stage = m.stage; }
  } catch (e) { add('manifest', 'block', false, `not JSON: ${(e as Error).message}`); }
  // a two-clip C0 file never stands in for the fight (§3.2)
  if (manifest) add('stage', 'block', manifest.stage === wantStage, `file stage ${manifest.stage}, wanted ${wantStage}`);

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
  add('bytes-budget', 'block', bytes.byteLength <= B.bytesMax, `${bytes.byteLength} bytes (max ${B.bytesMax}, target ${B.bytesTarget})`);
  if (manifest) {
    add('sha256', 'block', manifest.output.sha256.toLowerCase() === stats.sha256, `file ${stats.sha256} / manifest ${manifest.output.sha256}`);
    add('bytes', 'block', manifest.output.bytes === bytes.byteLength, `file ${bytes.byteLength} / manifest ${manifest.output.bytes}`);
  }

  const nodes: Json[] = j.nodes ?? [], parent = new Array<number>(nodes.length).fill(-1);
  nodes.forEach((n, i) => (n.children ?? []).forEach((c: number) => { parent[c] = i; }));
  const byName = new Map<string, number>();
  nodes.forEach((n, i) => { if (n.name && !byName.has(n.name)) byName.set(n.name, i); });
  const nameOf = (i: number) => (i < 0 ? '(scene)' : nodes[i].name);
  const skinnedNodes = nodes.filter((n) => n.mesh !== undefined && n.skin !== undefined);
  add('skinned', 'block', skinnedNodes.length === 1 && (j.skins?.length ?? 0) === 1, `${skinnedNodes.length} skinned mesh node(s), ${j.skins?.length ?? 0} skin(s) (expected 1 and 1)`);

  // ---- bones: the 22 names and parents, and the skin uses exactly them
  const joints: string[] = (j.skins?.[0]?.joints ?? []).map((i: number) => nodes[i]?.name ?? `node ${i}`);
  stats.joints = joints.length;
  const boneNames = BOSS_BONES.map((b) => b[0]);
  const boneProblems = [
    ...BOSS_BONES.flatMap(([b, par]) => { const i = byName.get(b); return i === undefined ? [`missing ${b}`] : par !== null && nameOf(parent[i]) !== par ? [`${b} is under ${nameOf(parent[i])}, expected ${par}`] : []; }),
    ...joints.filter((n) => !boneNames.includes(n)).map((n) => `joint outside the list: ${n}`),
    ...boneNames.filter((n) => !joints.includes(n)).map((n) => `not a skin joint: ${n}`),
  ];
  add('bones', 'block', !boneProblems.length && joints.length === B.jointsMax, boneProblems.join('; ') || `${joints.length} joints, names and parents as designed`);

  // ---- clips: the stage's list, real lengths
  const anims: Json[] = j.animations ?? [];
  const spec = STAGE_CLIPS[(manifest?.stage as BossStage) ?? wantStage] ?? STAGE_CLIPS[wantStage];
  const lengthProblems: string[] = [];
  for (const a of anims) {
    try {
      let lo = Infinity, hi = -Infinity;
      for (const s of a.samplers ?? []) {
        const acc = j.accessors?.[s.input];
        if (acc?.min && acc?.max) { lo = Math.min(lo, acc.min[0]); hi = Math.max(hi, acc.max[0]); }
        else { const d = readAccessor(g, s.input).data; lo = Math.min(lo, d[0]); hi = Math.max(hi, d[d.length - 1]); }
      }
      stats.clips.push({ name: a.name ?? '(unnamed)', ticks: hi * FPS });
      const s = spec.find((c) => c.name === a.name);
      if (s && (!near(lo, 0, 0.002) || !near(hi, s.ticks / FPS, 0.002))) lengthProblems.push(`${a.name}: keys ${lo.toFixed(4)}..${hi.toFixed(4)} s, expected 0..${(s.ticks / FPS).toFixed(4)} s`);
    } catch (e) { lengthProblems.push(`${a.name}: ${(e as Error).message}`); }
  }
  const want = spec.map((c) => c.name).sort(), inGlb = anims.map((a) => String(a.name)).sort();
  const inManifest = manifest ? (manifest.clips as Json[]).map((c) => c.name as string).sort() : want;
  const diff = (have: string[]) => [...want.filter((n) => !have.includes(n)).map((n) => `missing ${n}`), ...have.filter((n, i) => !want.includes(n) || have.indexOf(n) !== i).map((n) => `unexpected ${n}`)].join(', ');
  add('clip-allowlist', 'block', eq(inGlb, want) && eq(inManifest, want), eq(inGlb, want) && eq(inManifest, want) ? `${want.length} clips` : `GLB [${diff(inGlb) || 'ok'}] manifest [${diff(inManifest) || 'ok'}]`);
  add('clip-length', 'block', lengthProblems.length === 0, lengthProblems.join('; ') || 'every clip is ticks/30 seconds');
  if (manifest) {
    const contract = spec.flatMap((s) => { const c = (manifest!.clips as Json[]).find((x) => x.name === s.name); return c ? contractProblems(s, c) : []; });
    add('clip-contract', 'check', contract.length === 0, contract.join('; ') || 'ticks, loop, markers, phases, pose holds match DES-010 §3.2 / §3.4');
  }

  // ---- measured delivery rules (§3.1)
  const draws: Json[] = nodes.filter((n) => n.mesh !== undefined).flatMap((n) => (j.meshes?.[n.mesh]?.primitives ?? []).map((p: Json) => ({ ...p, skinned: n.skin !== undefined, skin: n.skin })));
  let tris = 0, nonTriangles = 0, vertices = 0;
  for (const p of draws) {
    vertices += j.accessors?.[p.attributes.POSITION]?.count ?? 0;
    if ((p.mode ?? 4) !== 4) { nonTriangles++; continue; }
    tris += (j.accessors?.[p.indices ?? p.attributes.POSITION]?.count ?? 0) / 3;
  }
  stats.tris = tris; stats.vertices = vertices; stats.primitives = draws.length; stats.materials = j.materials?.length ?? 0;
  add('tris', 'check', tris <= B.trisMax && !nonTriangles, `${tris} triangles (max ${B.trisMax}, target ${B.trisTarget})`);
  add('one-draw', 'check', draws.length <= B.primitivesMax && stats.materials <= B.materialsMax && draws.every((d) => d.skinned), `${draws.length} drawn primitive(s), ${stats.materials} material(s) (1 skinned mesh / 1 material / 1 primitive)`);

  const mats: Json[] = j.materials ?? [], texProblems: string[] = [];
  const texOf = (info: Json | undefined) => (info ? j.textures?.[info.index]?.source : undefined);
  const measure = (use: string, source: number | undefined, size: number) => {
    if (source === undefined) { texProblems.push(`no ${use} texture`); return; }
    const b = imageBytes(g, source), dim = b && pngSize(b);
    if (!dim) { texProblems.push(`${use} image is not an embedded PNG`); return; }
    stats.textures.push({ use, ...dim });
    if (dim.width !== size || dim.height !== size) texProblems.push(`${use} is ${dim.width}x${dim.height}, expected ${size}x${size}`);
  };
  mats.forEach((m) => {
    const pbr = m.pbrMetallicRoughness ?? {};
    measure('baseColor', texOf(pbr.baseColorTexture), B.baseColor);
    measure('orm', texOf(pbr.metallicRoughnessTexture), B.orm);
    if (texOf(m.occlusionTexture) !== texOf(pbr.metallicRoughnessTexture)) texProblems.push('occlusion must use the same packed ORM image');
  });
  add('textures', 'check', texProblems.length === 0 && mats.length > 0, texProblems.join('; ') || stats.textures.map((t) => `${t.use} ${t.width}x${t.height}`).join(', '));
  const notOpaque = mats.filter((m) => (m.alphaMode ?? 'OPAQUE') !== 'OPAQUE' || m.doubleSided).length;
  add('material-opaque', 'check', notOpaque === 0, notOpaque ? 'not OPAQUE single-sided' : 'OPAQUE, single sided');
  const maps = mats.filter((m) => m.normalTexture || m.emissiveTexture || (m.emissiveFactor ?? [0, 0, 0]).some((x: number) => x > 1e-6)).length;
  add('no-extra-maps', 'check', maps === 0, maps ? 'normal / emissive data present' : 'no normal or emissive map');
  const used: string[] = j.extensionsUsed ?? [];
  add('extensions', 'check', used.length === 0, used.join(', ') || 'none');

  const socketProblems = Object.entries(BOSS_SOCKETS).flatMap(([s, par]) => {
    const i = byName.get(s);
    if (i === undefined) return [`${s} missing`];
    if (nameOf(parent[i]) !== par) return [`${s} is under ${nameOf(parent[i])}, expected ${par}`];
    if (joints.includes(s)) return [`${s} is a skin joint`];
    return (nodes[i].scale ?? [1, 1, 1]).every((v: number) => near(v, 1)) ? [] : [`${s} scale is not 1`];
  });
  add('sockets', 'check', !socketProblems.length, socketProblems.join('; ') || `${Object.keys(BOSS_SOCKETS).length} sockets under the right parents`);

  const root = byName.get('root'), rootProblems: string[] = [];
  for (const a of anims) for (const ch of a.channels ?? []) {
    if (ch.target?.node !== root || root === undefined) continue;
    try {
      const { data, width } = readAccessor(g, a.samplers[ch.sampler].output);
      const rest: number[] = ch.target.path === 'translation' ? nodes[root].translation ?? [0, 0, 0] : ch.target.path === 'scale' ? [1, 1, 1] : nodes[root].rotation ?? [0, 0, 0, 1];
      if (data.some((v, k) => !near(v, rest[k % width]))) rootProblems.push(`${a.name}: root ${ch.target.path} changes`);
    } catch (e) { rootProblems.push(`${a.name}: ${(e as Error).message}`); }
  }
  add('root-motion', 'check', !rootProblems.length, rootProblems.join('; ') || 'root stays at its rest transform in every clip');
  const scaled = nodes.filter((n) => (n.scale ?? []).some((v: number) => v < 0) || (n.matrix && det3(n.matrix) < 0)).map((n) => n.name);
  add('transforms', 'check', !scaled.length, scaled.length ? `negative scale: ${scaled.join(', ')}` : 'no negative scale');

  const weightProblems: string[] = [];
  let minY = Infinity, maxY = -Infinity, radius = 0;
  for (const p of draws.filter((d) => d.skinned)) {
    try {
      const pos = readAccessor(g, p.attributes.POSITION).data;
      for (let v = 0; v < pos.length; v += 3) { minY = Math.min(minY, pos[v + 1]); maxY = Math.max(maxY, pos[v + 1]); radius = Math.max(radius, Math.hypot(pos[v], pos[v + 2])); }
      if (p.attributes.JOINTS_1 !== undefined) weightProblems.push('more than 4 influences (JOINTS_1 present)');
      if (p.attributes.WEIGHTS_0 === undefined || p.attributes.JOINTS_0 === undefined) { weightProblems.push('skinned primitive without JOINTS_0 / WEIGHTS_0'); continue; }
      const acc = j.accessors?.[p.attributes.WEIGHTS_0] ?? {}, ct = acc.componentType;
      if (!(ct === 5126 || ((ct === 5121 || ct === 5123) && acc.normalized))) { weightProblems.push(`WEIGHTS_0 must be FLOAT or a normalised UNSIGNED_BYTE/SHORT (componentType ${ct})`); continue; }
      const tol = ct === 5126 ? 1e-4 : 0.5 / (ct === 5121 ? 255 : 65535), w = readAccessor(g, p.attributes.WEIGHTS_0).data;
      let range = 0, sum = 0;
      for (let v = 0; v < w.length; v += 4) {
        const w4 = [w[v], w[v + 1], w[v + 2], w[v + 3]];
        if (w4.some((x) => !Number.isFinite(x) || x < 0 || x > 1)) range++;
        else if (!near(w4[0] + w4[1] + w4[2] + w4[3], 1, tol)) sum++;
      }
      if (range) weightProblems.push(`${range} vertex(es) with a weight outside [0, 1]`);
      if (sum) weightProblems.push(`${sum} vertex(es) whose weights do not sum to 1 (tolerance ${tol.toPrecision(3)})`);
      const bad = readAccessor(g, p.attributes.JOINTS_0).data.filter((k) => !Number.isInteger(k) || k < 0 || k >= joints.length).length;
      if (bad) weightProblems.push(`${bad} joint index(es) outside the skin`);
    } catch (e) { weightProblems.push((e as Error).message); }
  }
  add('weights', 'check', !weightProblems.length, weightProblems.join('; ') || 'max 4 influences, weights in [0, 1] summing to 1, joint indices inside the skin');

  // the mesh node and the bones above it must not move the bind pose, or the numbers below are not metres in the game
  const moved = skinnedNodes.filter((n) => n.matrix || (n.scale ?? [1, 1, 1]).some((v: number) => !near(v, 1)) || (n.translation ?? [0, 0, 0]).some((v: number) => !near(v, 0)) || (n.rotation ?? [0, 0, 0, 1]).some((v: number, k: number) => !near(v, k === 3 ? 1 : 0))).length;
  stats.bindRadiusM = radius; stats.minYM = minY; stats.maxYM = maxY;
  const sizeOk = Number.isFinite(minY) && !moved && radius <= B.bindRadiusMaxM + 1e-6 && Math.abs(minY) <= B.feetTolM && Math.abs(maxY - B.topM) <= B.topTolM;
  add('size', 'check', sizeOk, Number.isFinite(minY)
    ? `bind pose: horizontal radius ${radius.toFixed(3)} m (max ${B.bindRadiusMaxM}), feet y ${minY.toFixed(3)} m (0 ± ${B.feetTolM}), top ${maxY.toFixed(3)} m (${B.topM} ± ${B.topTolM})${moved ? '; the mesh node has its own transform' : ''}`
    : 'not measurable');
  if (manifest) {
    const m = manifest.measurements ?? {}, off = [['tris', tris], ['vertices', vertices], ['joints', joints.length], ['bytes', bytes.byteLength], ['primitives', draws.length], ['materials', stats.materials]]
      .filter(([k, v]) => m[k as string] !== v).map(([k, v]) => `${k}: file ${v} / manifest ${m[k as string]}`);
    if (typeof m.horizontalRadiusM === 'number' && !near(m.horizontalRadiusM, radius, 1e-3)) off.push(`horizontalRadiusM: file ${radius.toFixed(4)} / manifest ${m.horizontalRadiusM}`);
    add('measurements', 'check', !off.length, off.join('; ') || 'the manifest numbers equal what the file measures');
    add('status', 'info', true, `manifest status ${JSON.stringify(manifest.status)} (never an approval); source: ${manifest.source?.originStatus ?? 'unknown'}`);
  }
  add('generator', 'info', true, String(j.asset?.generator ?? 'unknown'));
  return done(manifest);
}
