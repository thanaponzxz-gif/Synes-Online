import fs from 'node:fs';
const out = {};
for (const f of process.argv.slice(2)) {
  const b = fs.readFileSync(f); const jl = b.readUInt32LE(12); const j = JSON.parse(b.slice(20, 20 + jl).toString());
  const acc = j.accessors || [], bv = j.bufferViews || [];
  let tris = 0, verts = 0, prims = 0; const attrBytes = {}; let idxBytes = 0, posBytes = 0;
  const compBytes = { 5120:1,5121:1,5122:2,5123:2,5125:4,5126:4 }, nc = { SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16 };
  for (const m of j.meshes || []) for (const p of m.primitives) { prims++; const pa = acc[p.attributes.POSITION]; verts += pa.count; tris += p.indices != null ? acc[p.indices].count / 3 : pa.count / 3;
    if (p.indices != null) idxBytes += acc[p.indices].count * compBytes[acc[p.indices].componentType];
    for (const [k, i] of Object.entries(p.attributes)) { const a = acc[i]; attrBytes[k] = (attrBytes[k] || 0) + a.count * compBytes[a.componentType] * nc[a.type]; } }
  const imgs = (j.images || []).map((im) => ({ mime: im.mimeType, bytes: im.bufferView != null ? bv[im.bufferView].byteLength : null, uri: im.uri ? 'uri' : undefined }));
  out[f.split('/').pop()] = { bytes: b.length, nodes: (j.nodes || []).length, meshes: (j.meshes || []).length, primitives: prims, tris: Math.round(tris), verts, materials: (j.materials || []).length, textures: (j.textures || []).length, images: imgs, skins: (j.skins||[]).length, anims: (j.animations||[]).length, extUsed: j.extensionsUsed || [], idxBytes, attrBytes, scenes: (j.scenes||[]).length };
}
console.log(JSON.stringify(out, null, 1));
