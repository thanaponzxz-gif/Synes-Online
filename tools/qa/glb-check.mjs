#!/usr/bin/env node
// glb-check: read a .glb directly (no dependencies) and report what the game's loader would see + budget checks.
//   node tools/qa/glb-check.mjs <file.glb ...> [--expect a,b,c] [--max-tris N] [--max-tex 1024] [--max-bytes N]
//                               [--max-parts N] [--json out.json] [--quiet] [--no-name-check]
// Exit code 1 when any check fails. Checks are technical only (no design judgement).
// Facts it relies on (see docs/art/ART_INTEGRATION_READINESS.md): the game ships GLTFLoader without Draco / meshopt / KTX2 decoders.
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';

const args = process.argv.slice(2);
const files = [];
const opt = { expect: [], maxTris: null, maxTex: null, maxBytes: null, maxParts: null, json: null, quiet: false, nameCheck: true };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--expect') opt.expect = String(args[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
  else if (a === '--max-tris') opt.maxTris = Number(args[++i]);
  else if (a === '--max-tex') opt.maxTex = Number(args[++i]);
  else if (a === '--max-bytes') opt.maxBytes = Number(args[++i]);
  else if (a === '--max-parts') opt.maxParts = Number(args[++i]);
  else if (a === '--json') opt.json = args[++i];
  else if (a === '--quiet') opt.quiet = true;
  else if (a === '--no-name-check') opt.nameCheck = false;
  else if (a === '-h' || a === '--help') { console.log('usage: glb-check.mjs file.glb... [--expect a,b] [--max-tris N] [--max-tex N] [--max-bytes N] [--max-parts N] [--json out.json] [--quiet] [--no-name-check]'); process.exit(0); }
  else if (a.startsWith('--')) { console.error('unknown option ' + a); process.exit(2); }
  else files.push(a);
}
if (!files.length) { console.error('no input file (see --help)'); process.exit(2); }

// decoders the game does NOT ship (GLTFLoader only; no DRACOLoader / MeshoptDecoder / KTX2Loader are set up in src/)
const NO_DECODER = {
  KHR_draco_mesh_compression: 'needs DRACOLoader (not shipped)',
  EXT_meshopt_compression: 'needs MeshoptDecoder (not shipped)',
  KHR_texture_basisu: 'needs KTX2Loader (not shipped)',
  EXT_texture_webp: 'WebP texture: supported by browsers but not by every viewer; not in the project contract',
  EXT_texture_avif: 'AVIF texture: not in the project contract',
};
// extensions three.js GLTFLoader reads without extra setup
const LOADER_OK = new Set(['KHR_materials_emissive_strength', 'KHR_materials_unlit', 'KHR_texture_transform', 'KHR_materials_pbrSpecularGlossiness', 'KHR_materials_ior', 'KHR_materials_specular', 'KHR_lights_punctual', 'KHR_mesh_quantization', 'KHR_materials_clearcoat', 'KHR_materials_transmission', 'KHR_materials_sheen', 'KHR_materials_volume', 'KHR_materials_iridescence', 'KHR_materials_anisotropy', 'KHR_materials_dispersion', 'EXT_texture_webp', 'EXT_texture_avif', 'KHR_materials_variants', 'EXT_mesh_gpu_instancing']);
const RESERVED = [[0xff, 0x7a, 0x1a, 'orange #FF7A1A'], [0xff, 0x33, 0x55, 'red #FF3355']];
const NAME_RE = /^([a-z][a-z0-9]*)_([a-z0-9][a-z0-9_]*)_v(\d{2,})\.glb$/;
const COMP = { 5120: [1, Int8Array], 5121: [1, Uint8Array], 5122: [2, Int16Array], 5123: [2, Uint16Array], 5125: [4, Uint32Array], 5126: [4, Float32Array] };
const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

function parseGlb(buf) {
  if (buf.length < 20) throw new Error('file shorter than a GLB header');
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('bad magic (not a glTF binary)');
  const version = buf.readUInt32LE(4), total = buf.readUInt32LE(8);
  const issues = [];
  if (version !== 2) issues.push(`glTF container version ${version} (expected 2)`);
  if (total !== buf.length) issues.push(`header length ${total} != file size ${buf.length}`);
  let off = 12, json = null, bin = null;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4); off += 8;
    const data = buf.subarray(off, off + len);
    if (type === 0x4e4f534a && !json) json = JSON.parse(data.toString('utf8'));
    else if (type === 0x004e4942 && !bin) bin = data;
    off += len + ((4 - (len % 4)) % 4);
  }
  if (!json) throw new Error('no JSON chunk');
  return { json, bin, version, issues };
}

function imageSize(bytes, mime) {
  try {
    if (bytes.length > 24 && bytes.readUInt32BE(0) === 0x89504e47) return { w: bytes.readUInt32BE(16), h: bytes.readUInt32BE(20), fmt: 'png', bitDepth: bytes[24], colorType: bytes[25] };
    if (bytes[0] === 0xff && bytes[1] === 0xd8) {
      let o = 2;
      while (o + 9 < bytes.length) {
        if (bytes[o] !== 0xff) { o++; continue; }
        const m = bytes[o + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: bytes.readUInt16BE(o + 7), h: bytes.readUInt16BE(o + 5), fmt: 'jpeg' };
        o += 2 + bytes.readUInt16BE(o + 2);
      }
    }
    if (bytes.length > 30 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
      const t = bytes.toString('ascii', 12, 16);
      if (t === 'VP8X') return { w: 1 + bytes.readUIntLE(24, 3), h: 1 + bytes.readUIntLE(27, 3), fmt: 'webp' };
      if (t === 'VP8 ') return { w: bytes.readUInt16LE(26) & 0x3fff, h: bytes.readUInt16LE(28) & 0x3fff, fmt: 'webp' };
      if (t === 'VP8L') { const b = bytes.readUInt32LE(21); return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1, fmt: 'webp' }; }
    }
  } catch { /* fallthrough */ }
  return { w: null, h: null, fmt: mime || '?' };
}

// 4x4 column-major helpers for node transforms
const I4 = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function mul(a, b) { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return o; }
function trs(t = [0, 0, 0], q = [0, 0, 0, 1], s = [1, 1, 1]) {
  const [x, y, z, w] = q, xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
  return [(1 - 2 * (yy + zz)) * s[0], (2 * (xy + wz)) * s[0], (2 * (xz - wy)) * s[0], 0, (2 * (xy - wz)) * s[1], (1 - 2 * (xx + zz)) * s[1], (2 * (yz + wx)) * s[1], 0, (2 * (xz + wy)) * s[2], (2 * (yz - wx)) * s[2], (1 - 2 * (xx + yy)) * s[2], 0, t[0], t[1], t[2], 1];
}
const nodeMat = (n) => (n.matrix ? n.matrix.slice() : trs(n.translation, n.rotation, n.scale));
const xf = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
const isIdentity = (n) => { const m = nodeMat(n), id = I4(); return m.every((v, i) => Math.abs(v - id[i]) < 1e-6); };

function readAccessor(g, bin, idx) {
  const a = g.accessors[idx], bv = g.bufferViews[a.bufferView];
  const [csz, Arr] = COMP[a.componentType], n = NCOMP[a.type], stride = bv.byteStride || csz * n;
  const base = (bv.byteOffset || 0) + (a.byteOffset || 0), out = new Arr(a.count * n);
  const dv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const get = { 5120: 'getInt8', 5121: 'getUint8', 5122: 'getInt16', 5123: 'getUint16', 5125: 'getUint32', 5126: 'getFloat32' }[a.componentType];
  for (let i = 0; i < a.count; i++) for (let k = 0; k < n; k++) out[i * n + k] = csz === 1 ? dv[get](base + i * stride + k) : dv[get](base + i * stride + k * csz, true);
  return out;
}

function checkFile(path) {
  const R = { file: path, name: basename(path), bytes: statSync(path).size, errors: [], warnings: [], checks: [] };
  const fail = (id, msg) => { R.checks.push({ id, ok: false, msg }); R.errors.push(`${id}: ${msg}`); };
  const pass = (id, msg) => R.checks.push({ id, ok: true, msg });
  const warn = (msg) => R.warnings.push(msg);
  let P;
  try { P = parseGlb(readFileSync(path)); } catch (e) { fail('parse', e.message); return R; }
  const g = P.json, bin = P.bin;
  for (const s of P.issues) warn(s);
  R.generator = g.asset?.generator || '(none)'; R.assetVersion = g.asset?.version; R.copyright = g.asset?.copyright || null;
  R.extrasAsset = g.asset?.extras || null;
  R.extensionsUsed = g.extensionsUsed || []; R.extensionsRequired = g.extensionsRequired || [];
  // ---- extensions
  const bad = [];
  for (const e of R.extensionsUsed) {
    const req = R.extensionsRequired.includes(e);
    if (NO_DECODER[e]) bad.push(`${e}${req ? ' (REQUIRED)' : ' (used)'}: ${NO_DECODER[e]}`);
    else if (!LOADER_OK.has(e)) bad.push(`${e}${req ? ' (REQUIRED)' : ' (used)'}: unknown to the checker, not in the project contract`);
  }
  if (bad.length) fail('extensions', bad.join('; ')); else pass('extensions', R.extensionsUsed.length ? R.extensionsUsed.join(', ') : 'none');
  if (!bin && (g.buffers || []).some((b) => !b.uri === false)) warn('external buffer uri (not self-contained)');
  // ---- nodes
  const nodes = g.nodes || [], names = new Set(nodes.map((n) => n.name).filter(Boolean));
  const parentOf = new Map(); nodes.forEach((n, i) => (n.children || []).forEach((c) => parentOf.set(c, i)));
  const sceneIdx = g.scene ?? 0, roots = (g.scenes?.[sceneIdx]?.nodes) || [];
  R.sceneName = g.scenes?.[sceneIdx]?.name || null; R.nodeCount = nodes.length;
  const dup = {}; for (const n of nodes) if (n.name) dup[n.name] = (dup[n.name] || 0) + 1;
  R.duplicateNames = Object.keys(dup).filter((k) => dup[k] > 1);
  if (R.duplicateNames.length) warn(`duplicate node names (getObjectByName returns the first): ${R.duplicateNames.slice(0, 8).join(', ')}`);
  const unnamed = nodes.filter((n) => !n.name).length; if (unnamed) warn(`${unnamed} node(s) without a name`);
  R.tree = [];
  const walk = (i, depth, world) => {
    const n = nodes[i], w = mul(world, nodeMat(n)); R.tree.push({ i, depth, name: n.name || `(node ${i})`, mesh: n.mesh ?? null, skin: n.skin != null, identity: isIdentity(n), scale: n.scale || null, translation: n.translation || null, rotation: n.rotation || null });
    for (const c of n.children || []) walk(c, depth + 1, w);
  };
  for (const r of roots) walk(r, 0, I4());
  // ---- meshes / bounding box
  const bbAll = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  const extend = (bb, m, a) => { // transform the 8 corners of the accessor box
    for (let c = 0; c < 8; c++) { const p = xf(m, [c & 1 ? a.max[0] : a.min[0], c & 2 ? a.max[1] : a.min[1], c & 4 ? a.max[2] : a.min[2]]); for (let k = 0; k < 3; k++) { bb.min[k] = Math.min(bb.min[k], p[k]); bb.max[k] = Math.max(bb.max[k], p[k]); } }
  };
  R.meshes = (g.meshes || []).map((m, mi) => ({ index: mi, name: m.name || `(mesh ${mi})`, primitives: [] }));
  const usedColor = new Map(); // material index -> bool
  let totalTris = 0, totalParts = 0; const attrSets = new Set(); const matsUsed = new Set();
  for (const mm of R.meshes) {
    for (const p of g.meshes[mm.index].primitives) {
      const mode = p.mode ?? 4, attrs = Object.keys(p.attributes);
      const pos = g.accessors[p.attributes.POSITION], count = p.indices != null ? g.accessors[p.indices].count : pos.count;
      const tris = mode === 4 ? Math.floor(count / 3) : mode === 5 || mode === 6 ? Math.max(0, count - 2) : 0;
      const info = { mode, tris, verts: pos.count, indexed: p.indices != null, attrs, material: p.material ?? null, morphTargets: (p.targets || []).length, compressed: !!p.extensions?.KHR_draco_mesh_compression || !!p.extensions?.EXT_meshopt_compression };
      const col = p.attributes.COLOR_0 != null ? g.accessors[p.attributes.COLOR_0] : null;
      if (col) info.colorType = col.type;
      if (col && bin && !info.compressed && col.type === 'VEC4') { // library convention check: alpha channel of COLOR_0 (the game reads it as an emissive share)
        try { const d = readAccessor(g, bin, p.attributes.COLOR_0), norm = col.normalized ? { 5121: 255, 5123: 65535 }[col.componentType] || 1 : 1; let mn = 1, mx = 0; for (let i = 3; i < d.length; i += 4) { const v = d[i] / norm; mn = Math.min(mn, v); mx = Math.max(mx, v); } info.colorAlphaRange = [+mn.toFixed(3), +mx.toFixed(3)]; } catch { /* ignore */ }
      }
      if (mode !== 4) warn(`mesh ${mm.name}: primitive mode ${mode} (only TRIANGLES is expected)`);
      mm.primitives.push(info); totalTris += tris; totalParts++; attrSets.add(attrs.slice().sort().join('+'));
      if (p.material != null) matsUsed.add(p.material);
    }
  }
  R.totalTris = totalTris; R.totalParts = totalParts; R.attributeSets = [...attrSets];
  // bbox per node name (instances of meshes) and overall
  const perNode = [];
  const visit = (i, world) => {
    const n = nodes[i], w = mul(world, nodeMat(n));
    if (n.mesh != null) {
      const nb = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }, tris = R.meshes[n.mesh].primitives.reduce((s, p) => s + p.tris, 0);
      for (const p of g.meshes[n.mesh].primitives) { const a = g.accessors[p.attributes.POSITION]; if (a.min && a.max) { extend(nb, w, a); extend(bbAll, w, a); } }
      if (isFinite(nb.min[0])) perNode.push({ node: n.name || `(node ${i})`, tris, bbox: { min: nb.min.map((v) => +v.toFixed(3)), max: nb.max.map((v) => +v.toFixed(3)) } });
    }
    for (const c of n.children || []) visit(c, w);
  };
  for (const r of roots) visit(r, I4());
  R.bbox = isFinite(bbAll.min[0]) ? { min: bbAll.min.map((v) => +v.toFixed(3)), max: bbAll.max.map((v) => +v.toFixed(3)), size: bbAll.max.map((v, k) => +(v - bbAll.min[k]).toFixed(3)) } : null;
  R.meshNodes = perNode;
  // per top-level named group (the game clones by node name): triangles + bbox of every subtree
  R.groups = [];
  const subtree = (i, world) => {
    const n = nodes[i], w = mul(world, nodeMat(n)), acc = { tris: 0, parts: 0, min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
    if (n.mesh != null) { for (const p of g.meshes[n.mesh].primitives) { const a = g.accessors[p.attributes.POSITION]; acc.parts++; acc.tris += R.meshes[n.mesh].primitives.find((q) => q.material === (p.material ?? null) && q.verts === a.count)?.tris ?? 0; if (a.min && a.max) extend(acc, w, a); } }
    for (const c of n.children || []) { const s = subtree(c, w); acc.tris += s.tris; acc.parts += s.parts; for (let k = 0; k < 3; k++) { acc.min[k] = Math.min(acc.min[k], s.min[k]); acc.max[k] = Math.max(acc.max[k], s.max[k]); } }
    return acc;
  };
  for (const r of roots) {
    const s = subtree(r, I4());
    R.groups.push({ node: nodes[r].name || `(node ${r})`, tris: s.tris, parts: s.parts, size: isFinite(s.min[0]) ? s.max.map((v, k) => +(v - s.min[k]).toFixed(3)) : null, minY: isFinite(s.min[1]) ? +s.min[1].toFixed(3) : null, children: (nodes[r].children || []).length });
  }
  // ---- materials
  R.materials = (g.materials || []).map((m, i) => {
    const pbr = m.pbrMetallicRoughness || {}, bc = pbr.baseColorFactor || [1, 1, 1, 1], em = m.emissiveFactor || [0, 0, 0];
    const hex = '#' + bc.slice(0, 3).map((v) => Math.round(Math.pow(Math.max(0, Math.min(1, v)), 1 / 2.2) * 255).toString(16).padStart(2, '0')).join(''); // linear -> approx sRGB
    return {
      index: i, name: m.name || `(material ${i})`, used: matsUsed.has(i), baseColorLinear: bc.map((v) => +v.toFixed(3)), baseColorSrgbApprox: hex, metallic: pbr.metallicFactor ?? 1, roughness: pbr.roughnessFactor ?? 1,
      emissive: em.map((v) => +v.toFixed(3)), emissiveStrength: m.extensions?.KHR_materials_emissive_strength?.emissiveStrength ?? null,
      alphaMode: m.alphaMode || 'OPAQUE', alphaCutoff: m.alphaCutoff ?? null, doubleSided: !!m.doubleSided, unlit: !!m.extensions?.KHR_materials_unlit,
      textures: { baseColor: pbr.baseColorTexture?.index ?? null, metallicRoughness: pbr.metallicRoughnessTexture?.index ?? null, normal: m.normalTexture?.index ?? null, occlusion: m.occlusionTexture?.index ?? null, emissive: m.emissiveTexture?.index ?? null },
      extensions: Object.keys(m.extensions || {}),
    };
  });
  // ---- images
  R.images = (g.images || []).map((im, i) => {
    let bytes = null, size = { w: null, h: null, fmt: im.mimeType };
    if (im.bufferView != null && bin) { const bv = g.bufferViews[im.bufferView]; bytes = bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength); size = imageSize(bytes, im.mimeType); }
    return { index: i, name: im.name || null, mime: im.mimeType || (im.uri ? 'uri:' + im.uri.slice(0, 40) : '?'), bytes: bytes ? bytes.length : null, ...size };
  });
  R.textureCount = (g.textures || []).length;
  R.uvSets = [...attrSets].some((s) => /TEXCOORD_\d/.test(s));
  R.skins = (g.skins || []).length; R.animations = (g.animations || []).length; R.cameras = (g.cameras || []).length;
  R.extrasNodeNames = nodes.filter((n) => n.extras && Object.keys(n.extras).length).map((n) => n.name);
  // ---- checks
  // 1. file name
  if (opt.nameCheck) { if (NAME_RE.test(R.name)) pass('filename', R.name); else fail('filename', `"${R.name}" does not match <type>_<name>_vNN.glb (project rule; legacy files synes_kit.glb / env_library_v01.glb style may be grandfathered by the PM)`); }
  // 2. expected nodes
  if (opt.expect.length) { const miss = opt.expect.filter((n) => !names.has(n)); if (miss.length) fail('expect', `missing node(s): ${miss.join(', ')}`); else pass('expect', `${opt.expect.length} node(s) present`); }
  // 3. budgets
  if (opt.maxTris != null) (totalTris > opt.maxTris ? fail : pass)('max-tris', `${totalTris} triangles (limit ${opt.maxTris})`);
  if (opt.maxBytes != null) (R.bytes > opt.maxBytes ? fail : pass)('max-bytes', `${R.bytes} bytes (limit ${opt.maxBytes})`);
  if (opt.maxParts != null) (totalParts > opt.maxParts ? fail : pass)('max-parts', `${totalParts} primitives (limit ${opt.maxParts})`);
  if (opt.maxTex != null) {
    const over = R.images.filter((im) => im.w == null || im.w > opt.maxTex || im.h > opt.maxTex);
    if (over.length) fail('max-tex', over.map((im) => `image ${im.index} ${im.w}x${im.h}`).join(', ') + ` (limit ${opt.maxTex}px)`); else pass('max-tex', R.images.length ? `${R.images.length} image(s) <= ${opt.maxTex}px` : 'no textures');
  }
  // 4. reserved colours (technical check: orange/red are the attack-warning colours). Material base colour, emissive, and COLOR_0 if present.
  const near = (c, r) => Math.abs(c[0] - r[0]) + Math.abs(c[1] - r[1]) + Math.abs(c[2] - r[2]) < 60;
  const hits = [];
  for (const m of R.materials) {
    if (!m.used) continue;
    const s = m.baseColorSrgbApprox, c = [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
    for (const r of RESERVED) if (near(c, r)) hits.push(`material "${m.name}" base ${s} ~ ${r[3]}`);
    const e = m.emissive.map((v) => Math.round(Math.pow(v, 1 / 2.2) * 255)); if (m.emissive.some((v) => v > 0.01)) for (const r of RESERVED) if (near(e, r)) hits.push(`material "${m.name}" emissive ~ ${r[3]}`);
  }
  if (bin) for (const mm of R.meshes) for (const p of g.meshes[mm.index].primitives) {
    if (p.attributes.COLOR_0 == null || R.extensionsUsed.some((e) => NO_DECODER[e])) continue;
    try {
      const a = g.accessors[p.attributes.COLOR_0], d = readAccessor(g, bin, p.attributes.COLOR_0), n = NCOMP[a.type], norm = a.normalized ? { 5121: 255, 5123: 65535 }[a.componentType] || 1 : 1, seen = new Set();
      for (let i = 0; i < d.length; i += n) { const c = [0, 1, 2].map((k) => Math.round(Math.pow(Math.min(1, Math.max(0, d[i + k] / norm)), 1 / 2.2) * 255)); for (const r of RESERVED) if (near(c, r)) seen.add(r[3]); }
      for (const s of seen) hits.push(`mesh "${mm.name}" vertex colour ~ ${s}`);
    } catch { /* ignore */ }
  }
  const uniq = [...new Set(hits)];
  if (uniq.length) fail('reserved-colours', uniq.slice(0, 6).join('; ') + (uniq.length > 6 ? ` (+${uniq.length - 6})` : '') + ' (tolerance: sum of |dR|+|dG|+|dB| < 60 in approx sRGB; verify by eye if flagged)'); else pass('reserved-colours', 'no material/vertex colour near #FF7A1A / #FF3355');
  // 5. advisory warnings (do not fail)
  if (R.images.length) warn(`has ${R.images.length} image(s): the game's lambertize() keeps only colour/emissive; textures and UV are dropped (see readiness doc)`);
  if (R.skins) warn('skins present (kit meshes are static; skinned meshes are not batched)');
  if (R.animations) warn(`${R.animations} animation(s): the game animates by node name in code, glTF animations are not played`);
  const trans = R.materials.filter((m) => m.used && m.alphaMode !== 'OPAQUE'); if (trans.length) warn(`alphaMode != OPAQUE on: ${trans.map((m) => m.name + '=' + m.alphaMode).join(', ')} (not eligible for kit batching)`);
  const ds = R.materials.filter((m) => m.used && m.doubleSided); if (ds.length) warn(`doubleSided on ${ds.length} used material(s): ignored by the game (lambertize builds a new Front-side material, so back faces are culled; Blender exports doubleSided=true by default)`);
  const metal = R.materials.filter((m) => m.used && (m.metallic > 0.5)); if (metal.length) warn(`${metal.length} material(s) metallic > 0.5 (ignored: game is Lambert)`);
  const noMat = R.meshes.flatMap((m) => m.primitives).filter((p) => p.material == null).length; if (noMat) warn(`${noMat} primitive(s) without material (three.js default white)`);
  const nonIdent = R.tree.filter((t) => t.mesh != null && !t.identity); if (nonIdent.length) warn(`${nonIdent.length} mesh node(s) with non-identity local transform (bakeKit merges only identity-local-transform *_geo meshes; those parts stay separate draw calls): ${nonIdent.slice(0, 4).map((t) => t.name).join(', ')}`);
  const noNormal = R.meshes.flatMap((m) => m.primitives).filter((p) => !p.attrs.includes('NORMAL')).length; if (noNormal) warn(`${noNormal} primitive(s) without NORMAL (flat shading recomputes in game; ok)`);
  // three.js GLTFLoader: a node with ONE primitive becomes a Mesh named after the NODE; with several primitives it becomes a Group (node name)
  // whose child Meshes are named after the MESH (+ _1, _2 ...). bakeKit (src/render/models.ts) merges sibling child meshes named /_geo(_\d+)?$/.
  const multi = R.tree.filter((t) => t.mesh != null && R.meshes[t.mesh].primitives.length > 1 && !/_geo$/.test(R.meshes[t.mesh].name));
  if (multi.length) warn(`${multi.length} multi-primitive mesh(es) whose mesh name does not end in _geo (bakeKit will not merge their parts; one draw call per part): ${multi.slice(0, 4).map((t) => R.meshes[t.mesh].name).join(', ')}`);
  R.ok = R.errors.length === 0;
  return R;
}

function print(R) {
  const L = (s = '') => console.log(s);
  L(`=== ${R.file}`);
  if (R.parseError || (!R.generator && R.errors.length)) { for (const e of R.errors) L('  FAIL ' + e); return; }
  L(`size ${R.bytes} B (${(R.bytes / 1024).toFixed(1)} KB) · generator: ${R.generator} · glTF ${R.assetVersion}${R.copyright ? ' · copyright: ' + R.copyright : ''}`);
  L(`extensionsUsed: ${R.extensionsUsed.join(', ') || '-'} · required: ${R.extensionsRequired.join(', ') || '-'}`);
  L(`nodes ${R.nodeCount} · meshes ${R.meshes.length} · primitives ${R.totalParts} · triangles ${R.totalTris} · materials ${R.materials.length} (used ${R.materials.filter((m) => m.used).length}) · images ${R.images.length} · textures ${R.textureCount} · skins ${R.skins} · animations ${R.animations}`);
  L(`attribute sets: ${R.attributeSets.join(' | ')}`);
  if (R.bbox) L(`bbox (world, scene nodes applied) min ${R.bbox.min.join(',')} max ${R.bbox.max.join(',')} size ${R.bbox.size.join(' x ')} (m if exporter units are m)`);
  if (!opt.quiet) {
    L('\nscene tree (name [mesh] ):');
    const max = 80; R.tree.slice(0, max).forEach((t) => L('  ' + '  '.repeat(t.depth) + t.name + (t.mesh != null ? ` [mesh ${t.mesh} "${R.meshes[t.mesh].name}"]` : '') + (t.identity ? '' : ' (xform)')));
    if (R.tree.length > max) L(`  ... ${R.tree.length - max} more node(s)`);
    L('\nroot groups (the game looks these up by name): tris / primitives / size / minY');
    for (const gr of R.groups.slice(0, 60)) L(`  ${gr.node.padEnd(28)} ${String(gr.tris).padStart(6)} tris ${String(gr.parts).padStart(3)} prim  ${gr.size ? gr.size.join(' x ') : '-'}  minY ${gr.minY}`);
    if (R.groups.length > 60) L(`  ... ${R.groups.length - 60} more`);
    L('\nmaterials: name | base(sRGB approx) | emissive | alpha | dbl | metal/rough | textures');
    for (const m of R.materials.slice(0, 40)) L(`  ${m.used ? ' ' : '*'}${m.name.padEnd(24)} ${m.baseColorSrgbApprox} em[${m.emissive.join(',')}]${m.emissiveStrength != null ? ' str ' + m.emissiveStrength : ''} ${m.alphaMode}${m.doubleSided ? ' dbl' : ''} m${m.metallic} r${m.roughness}${Object.values(m.textures).some((v) => v != null) ? ' tex ' + JSON.stringify(m.textures) : ''}`);
    if (R.materials.length > 40) L(`  ... ${R.materials.length - 40} more   (* = unused)`);
    if (R.images.length) { L('\nimages:'); for (const im of R.images) L(`  #${im.index} ${im.mime} ${im.w}x${im.h} ${im.bytes} B`); }
  }
  L('\nchecks:');
  for (const c of R.checks) L(`  ${c.ok ? 'PASS' : 'FAIL'} ${c.id}: ${c.msg}`);
  if (R.warnings.length) { L('warnings:'); for (const w of R.warnings) L('  - ' + w); }
  L(`RESULT: ${R.ok ? 'OK' : 'FAIL'}\n`);
}

const results = files.map((f) => { try { return checkFile(f); } catch (e) { return { file: f, name: basename(f), errors: ['crash: ' + e.message], warnings: [], checks: [], ok: false, parseError: true }; } });
for (const R of results) print(R);
if (opt.json) writeFileSync(opt.json, JSON.stringify(results.length === 1 ? results[0] : results, null, 1));
process.exit(results.every((r) => r.ok) ? 0 : 1);
