// DES-004 step 2, Three.js-only parts (prototype looks `?arena=A` / `?arena=B`; no param = the current arena, nothing here runs).
// Render-only: nothing here is read by the sim (shared/** untouched). Everything is procedural (canvas / shader), no external asset.
//   - irregular flagstone floor (Voronoi cells, thin moss-green grooves, brighter centre) painted into the existing floor canvas
//     (same size = QualitySettings.groundRes, so no texture memory is added)
//   - grass + violet flower cards along the arena rim, outside the play circle (1 instanced draw call, count x decoDensity)
//   - 2 waterfall planes with a scrolling 64x256 strip texture (1 draw call) + spray billboards at the base (1 draw call)
//   - the shrine moves right of the camera axis so the boss does not hide it (see arena.ts; the shrine is scenery, not a sim object)
// A and B differ on ONE axis: floor value. A keeps the play floor at the current mid-dark value (the telegraph edges keep their
// luminance contrast), B paints the centre at DES-004's #A9A6BC (brighter arena, the edges lose luminance contrast).
// No #FF7A1A / #FF3355 and no warm hue anywhere here (flowers are violet, water and spray lumen-white).
import {
  AdditiveBlending, BufferGeometry, CanvasTexture, Color, Euler, Float32BufferAttribute, Group, InstancedBufferAttribute,
  InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshLambertMaterial, Quaternion, RepeatWrapping, ShaderMaterial,
  SRGBColorSpace, Vector3,
} from 'three';
import type { QualitySettings } from './quality.ts';

export type ArenaLook = 'base' | 'A' | 'B';
/** `?arena=A|B` (case-insensitive). Anything else, or no param, is the current look. */
export function arenaLook(): ArenaLook {
  try {
    const v = new URLSearchParams(location.search).get('arena')?.toUpperCase();
    return v === 'A' || v === 'B' ? v : 'base';
  } catch { return 'base'; }
}

/** Shrine pose for the prototype looks, arena-relative (m, rad). Right of the camera axis, turned toward the arena centre.
 *  The two back-right ruin columns that stood there are left out (arena.ts). */
export const SHRINE_SIDE = { x: 5.2, z: -15.2, yaw: -0.3 };
/** Arena-relative x/z of a point given in shrine-local coordinates (local +z = the stairs / front). */
export function shrineLocal(lx: number, lz: number, s = SHRINE_SIDE) {
  const c = Math.cos(s.yaw), n = Math.sin(s.yaw);
  return { x: s.x + lx * c + lz * n, z: s.z - lx * n + lz * c };
}

// ------------------------------------------------------------------ shared by A and B (visual hierarchy at the low camera)
/** Low camera: the top band of the frame is back cliffs and ruin columns. In the current look they are the darkest things on
 *  screen (cliffs ~0.23, columns ~0.15 luma vs floor 0.30), so the "far" layer reads darker and harder than the floor.
 *  DES-004 §2 wants the far layer pale and low-contrast and the ruins in light stone: cliffs take haze-lavender tints (aerial
 *  perspective painted into the instance colour), columns a mid stone of the #B9B4C7 family. Instance colours only: +0 calls. */
export const CLIFF_TINTS = [0x8c8ca8, 0x8383a0, 0x9595b0, 0x7e7e9b];
export const COLUMN_TINTS = [0x8a879c, 0x7f7c93, 0x938fa5, 0x85829a];

// ------------------------------------------------------------------ look parameters (the one axis: arena value key)
/** floor: slab colour at the arena centre / at the rim and the moss-green joint colour (sRGB texture values; the arena light
 *  makes them read darker on screen). crystalSelf: self-light of the ruin crystals in their own hue (DES-006 §3).
 *  shrineStone: stone tints of the moved shrine. pillarGlow: multiplier on the emissive of the 4 sim pillars' crystals.
 *  A = low key: the play floor keeps the current on-screen value (telegraph edges keep their luminance contrast), the midground
 *      is lifted above it. B = high key: slab centre at DES-004's #A9A6BC, midground lifted further so it stays above the floor. */
export const LOOKS = {
  A: { floor: { centre: [0x66, 0x64, 0x72], edge: [0x4f, 0x52, 0x5f], groove: '#3e5444', grooveW: 0.055, jitter: 0.07 },
    crystalSelf: 0.42, shrineStone: [0xa9a4bb, 0x9d98b0, 0xb2adc3, 0xa39fb6], pillarGlow: 1 },
  B: { floor: { centre: [0xa9, 0xa6, 0xbc], edge: [0x7c, 0x7c, 0x90], groove: '#5a7556', grooveW: 0.055, jitter: 0.06 },
    crystalSelf: 0.62, shrineStone: [0xc9c5d8, 0xbdb9ce, 0xd2cee0, 0xc3bfd3], pillarGlow: 1.8 },
} as const;

/** DES-006 §3 for the pillars (the big crystals left/right of the boss in the opening shot): scale the emissive of their crystal
 *  parts. Their materials are per-pillar clones (View.addOccluder), so nothing else changes. No-op on the current look and on A. */
export function glowPillars(pillars: { traverse(f: (o: any) => void): void }[], look = arenaLook()) {
  if (look === 'base' || LOOKS[look].pillarGlow === 1) return;
  for (const p of pillars) p.traverse((o) => { const m = o.material; if (o.isMesh && m && 'emissiveIntensity' in m) m.emissiveIntensity *= LOOKS[look].pillarGlow; });
}

// ------------------------------------------------------------------ floor
const MOSS = [0x5d, 0x78, 0x5c];

export interface FloorPaint { size: number; px: number; mid: number; arenaR: number; seed: number; look: 'A' | 'B' }

/** Paints irregular flagstones into an already clipped 2D context (the caller keeps its clip and its boundary-ring markers).
 *  Cells are a jittered-grid Voronoi diagram; each slab is its cell shrunk by half the groove width (bisectors moved toward the
 *  site) with rounded corners, so the moss-green background shows through as thin joints. */
export function paintFlagstones(ctx: CanvasRenderingContext2D, o: FloorPaint) {
  const P = LOOKS[o.look].floor, rnd = seededRandom(o.seed * 7919 + 101);
  const half = o.size / o.px / 2, minPx = 2.1 / o.px; // joints never thinner than ~2 texels (low tier: 512 px)
  const gw = Math.max(P.grooveW, minPx);
  ctx.fillStyle = P.groove;
  ctx.fillRect(0, 0, o.size, o.size);
  const S = 1.38; // site spacing (m): slabs ~0.9-2.4 m across
  const n = Math.ceil((2 * half) / S) + 2;
  const sites: number[][] = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const skip = rnd() < 0.11; // missing sites merge into neighbours: a few larger slabs
    const x = -half - S + (i + 0.5 + (rnd() - 0.5) * 0.85) * S, z = -half - S + (j + 0.5 + (rnd() - 0.5) * 0.85) * S;
    if (!skip) sites.push([x, z]);
  }
  const X = (x: number) => o.mid + x * o.px, Y = (z: number) => o.mid + z * o.px;
  const tufts: number[][] = [];
  for (let s = 0; s < sites.length; s++) {
    const [sx, sz] = sites[s];
    let poly = [[sx - 3, sz - 3], [sx + 3, sz - 3], [sx + 3, sz + 3], [sx - 3, sz + 3]];
    for (let t = 0; t < sites.length && poly.length > 2; t++) {
      if (t === s) continue;
      const dx = sites[t][0] - sx, dz = sites[t][1] - sz, d = Math.hypot(dx, dz);
      if (d > 4.2) continue;
      const ux = dx / d, uz = dz / d, lim = d / 2 - gw / 2; // keep p with (p - site) . u <= d/2 - groove/2
      poly = clipHalf(poly, sx, sz, ux, uz, lim);
      if (t > s && d < 2.4 && rnd() < 0.5) tufts.push([sx + dx / 2, sz + dz / 2, rnd(), rnd(), rnd()]);
    }
    if (poly.length < 3) continue;
    let cx = 0, cz = 0; for (const p of poly) { cx += p[0]; cz += p[1]; } cx /= poly.length; cz /= poly.length;
    const r = Math.min(1.3, Math.hypot(cx, cz) / o.arenaR);
    const k = smooth(0.08, 1, r); // 0 at the centre, 1 at the rim
    const j = 1 + (rnd() - 0.5) * 2 * P.jitter, hueShift = (rnd() - 0.5) * 10;
    const mossy = r > 0.7 && rnd() < 0.28 * (r - 0.55) / 0.45;
    const col = [0, 1, 2].map((c) => (P.centre[c] + (P.edge[c] - P.centre[c]) * k) * j + (c === 2 ? hueShift : c === 0 ? -hueShift * 0.4 : 0));
    if (mossy) for (let c = 0; c < 3; c++) col[c] = col[c] * 0.55 + MOSS[c] * 0.45;
    const path = () => roundedPath(ctx, poly, X, Y, 0.16);
    path(); ctx.fillStyle = rgb(col); ctx.fill();
    // slab relief: lit centre, slightly darker rim (keeps the low camera from reading the floor as flat paint)
    ctx.save(); path(); ctx.clip();
    const rad = Math.max(0.6, Math.sqrt(polyArea(poly))) * o.px * 0.75;
    const gr = ctx.createRadialGradient(X(cx - 0.12), Y(cz - 0.15), rad * 0.15, X(cx), Y(cz), rad);
    gr.addColorStop(0, 'rgba(232,230,248,0.10)'); gr.addColorStop(0.7, 'rgba(232,230,248,0)'); gr.addColorStop(1, 'rgba(26,28,40,0.16)');
    ctx.fillStyle = gr; ctx.fillRect(X(cx) - rad * 1.5, Y(cz) - rad * 1.5, rad * 3, rad * 3);
    const area = polyArea(poly), specks = Math.round(area * 7);
    for (let i = 0; i < specks; i++) {
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(214,216,232,0.09)' : 'rgba(30,32,44,0.10)';
      ctx.fillRect(X(cx + (rnd() - 0.5) * 2), Y(cz + (rnd() - 0.5) * 2), (0.05 + rnd() * 0.16) * o.px, (0.03 + rnd() * 0.1) * o.px);
    }
    if (mossy || (r > 0.55 && rnd() < 0.2)) { // moss creeping in from a joint
      ctx.fillStyle = 'rgba(93,120,92,0.38)';
      const p = poly[Math.floor(rnd() * poly.length)];
      ctx.beginPath(); ctx.ellipse(X(p[0]), Y(p[1]), (0.25 + rnd() * 0.3) * o.px, (0.18 + rnd() * 0.2) * o.px, rnd() * 3, 0, Math.PI * 2); ctx.fill();
    }
    if (rnd() < 0.22) { // hairline crack
      const a = rnd() * Math.PI, l = 0.35 + rnd() * 0.5;
      ctx.beginPath(); ctx.moveTo(X(cx - Math.cos(a) * l), Y(cz - Math.sin(a) * l));
      ctx.lineTo(X(cx + (rnd() - 0.5) * 0.2), Y(cz + (rnd() - 0.5) * 0.2));
      ctx.lineTo(X(cx + Math.cos(a + 0.5) * l * 0.8), Y(cz + Math.sin(a + 0.5) * l * 0.8));
      ctx.strokeStyle = 'rgba(40,42,58,0.45)'; ctx.lineWidth = Math.max(1, 0.02 * o.px); ctx.stroke();
    }
    ctx.restore();
  }
  // grass blades and tiny violet flowers in the joints, more toward the rim (DES-004 §1: "grass and violet flowers between the slabs")
  for (const [x, z, a, b, c] of tufts) {
    const r = Math.hypot(x, z) / o.arenaR;
    if (a > 0.12 + 0.75 * smooth(0.25, 1.0, r)) continue;
    const blades = 3 + Math.floor(b * 4);
    for (let i = 0; i < blades; i++) {
      const ang = (i / blades) * Math.PI * 2 + c * 6, len = (0.07 + ((b * 7 + i * 0.37) % 1) * 0.08) * o.px;
      ctx.strokeStyle = i % 2 ? '#7fa86a' : '#5e8a55'; ctx.lineWidth = Math.max(1, 0.025 * o.px);
      ctx.beginPath(); ctx.moveTo(X(x), Y(z)); ctx.lineTo(X(x) + Math.cos(ang) * len, Y(z) + Math.sin(ang) * len); ctx.stroke();
    }
    if (c < 0.3 + 0.4 * r) {
      ctx.fillStyle = c < 0.15 ? '#d9ccff' : '#a78bfa';
      const fr = Math.max(1.2, 0.045 * o.px);
      for (let i = 0; i < 2 + Math.floor(c * 6); i++) { ctx.beginPath(); ctx.arc(X(x + (a - 0.06) * 0.5 + i * 0.05), Y(z + (b - 0.5) * 0.12 - i * 0.03), fr, 0, Math.PI * 2); ctx.fill(); }
    }
  }
}

function clipHalf(poly: number[][], sx: number, sz: number, ux: number, uz: number, lim: number) {
  const out: number[][] = [];
  const f = (p: number[]) => (p[0] - sx) * ux + (p[1] - sz) * uz - lim;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], fa = f(a), fb = f(b);
    if (fa <= 0) out.push(a);
    if ((fa <= 0) !== (fb <= 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
function polyArea(poly: number[][]) { let a = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; }
function roundedPath(ctx: CanvasRenderingContext2D, poly: number[][], X: (x: number) => number, Y: (z: number) => number, rad: number) {
  ctx.beginPath();
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const p = poly[(i + n - 1) % n], v = poly[i], q = poly[(i + 1) % n];
    const lp = Math.hypot(p[0] - v[0], p[1] - v[1]), lq = Math.hypot(q[0] - v[0], q[1] - v[1]);
    const tp = Math.min(0.45, rad / Math.max(1e-6, lp)), tq = Math.min(0.45, rad / Math.max(1e-6, lq));
    const ax = v[0] + (p[0] - v[0]) * tp, az = v[1] + (p[1] - v[1]) * tp, bx = v[0] + (q[0] - v[0]) * tq, bz = v[1] + (q[1] - v[1]) * tq;
    if (i === 0) ctx.moveTo(X(ax), Y(az)); else ctx.lineTo(X(ax), Y(az));
    ctx.quadraticCurveTo(X(v[0]), Y(v[1]), X(bx), Y(bz));
  }
  ctx.closePath();
}

// ------------------------------------------------------------------ rim cards, waterfalls, spray
export interface ArenaDeco { group: Group; update(time: number): void; dispose(): void }
interface Arena { x: number; z: number; r: number }

/** Waterfalls, arena-relative: [x, z, height, top width, bottom width, u offset]. Left one in the gap of the back-left ruin
 *  columns, right one behind the moved shrine (seen through its ring). z sits just in front of the back cliffs (their faces
 *  reach z -16.9), the top leans back into the cliff. */
const FALLS = [[-5.35, -16.75, 7.5, 1.25, 1.9, 0], [SHRINE_SIDE.x + 0.5, -17.0, 8.2, 1.5, 2.3, 0.37]];

/** Builds the step-2 decoration for `look` (null for the current look, so the default build is unchanged). */
export function makeArenaDeco(arena: Arena, q: QualitySettings, seed: number, look = arenaLook()): ArenaDeco | null {
  if (look === 'base') return null;
  const group = new Group(); group.name = 'arena_deco';
  const cards = makeRimCards(arena, q.decoDensity, seed);
  const falls = makeWaterfalls(arena);
  const spray = makeSpray(arena);
  group.add(cards.mesh, falls.mesh, spray.mesh);
  return {
    group,
    update(time: number) {
      cards.uTime.value = time;
      falls.map.offset.y = (time * 0.85) % 1;
      spray.uTime.value = time;
    },
    dispose() {
      for (const m of [cards.mesh, falls.mesh, spray.mesh]) { m.geometry.dispose(); (m.material as { dispose(): void }).dispose(); }
      cards.mesh.dispose(); cards.map.dispose(); falls.map.dispose();
    },
  };
}

/** 128x64 atlas: left tile = grass tuft, right tile = violet flowers on stems. Opaque cutout (alphaTest), sRGB. */
function cardAtlas() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64;
  const g = c.getContext('2d')!;
  const rnd = seededRandom(77);
  // grass tuft (tile 0): blades fanning up from the bottom centre
  for (let i = 0; i < 13; i++) {
    const bx = 32 + (rnd() - 0.5) * 18, tip = 6 + rnd() * 22, lean = (rnd() - 0.5) * 34, w = 2.2 + rnd() * 2.2;
    const gr = g.createLinearGradient(0, 64, 0, tip);
    gr.addColorStop(0, '#3e6a43'); gr.addColorStop(0.55, '#5f9156'); gr.addColorStop(1, i % 3 ? '#9cc77f' : '#b5d88e');
    g.fillStyle = gr; g.beginPath(); g.moveTo(bx - w, 64); g.quadraticCurveTo(bx + lean * 0.3, 40, bx + lean, tip); g.quadraticCurveTo(bx + lean * 0.3 + 1, 40, bx + w, 64); g.closePath(); g.fill();
  }
  // violet flowers (tile 1): stems + leaves, 5-petal heads in violet / pale lilac, cream-white centres (no pink: pink is a warm hue)
  for (let i = 0; i < 6; i++) {
    const bx = 64 + 12 + i * 8 + (rnd() - 0.5) * 4, top = 14 + rnd() * 26;
    g.strokeStyle = '#4f7d4c'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx, 64); g.quadraticCurveTo(bx + (rnd() - 0.5) * 8, (64 + top) / 2, bx + (rnd() - 0.5) * 6, top); g.stroke();
    g.fillStyle = '#5f9156'; g.beginPath(); g.ellipse(bx + 3, 54 - rnd() * 6, 5, 2, -0.6, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 6; i++) {
    const fx = 64 + 12 + i * 8 + (rnd() - 0.5) * 6, fy = 12 + rnd() * 26, pr = 3.2 + rnd() * 1.6, pc = i % 3 === 2 ? '#c8b6ff' : '#a78bfa';
    g.fillStyle = pc;
    for (let k = 0; k < 5; k++) { const a = k * 1.2566 + rnd() * 0.2; g.beginPath(); g.arc(fx + Math.cos(a) * pr, fy + Math.sin(a) * pr, pr * 0.72, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#f4f0ff'; g.beginPath(); g.arc(fx, fy, pr * 0.45, 0, Math.PI * 2); g.fill();
  }
  const map = new CanvasTexture(c); map.colorSpace = SRGBColorSpace; map.anisotropy = 2;
  return map;
}

/** Crossed cards (two planes, back faces duplicated) with up-facing normals so they light like the ground instead of
 *  going dark on their back side. Instanced along the rim band [r + 0.55, r + 2.6], outside the play circle; the entry
 *  and the camera-side arc are left free. 1 draw call. */
function makeRimCards(arena: Arena, density: number, seed: number) {
  const pos: number[] = [], uv: number[] = [], nor: number[] = [], idx: number[] = [];
  for (const yaw of [0, Math.PI / 2]) {
    const cx = Math.cos(yaw) * 0.5, cz = -Math.sin(yaw) * 0.5;
    for (const back of [false, true]) {
      const o = pos.length / 3;
      const quad = [[-cx, 0, -cz, 0, 0], [cx, 0, cz, 1, 0], [cx, 1, cz, 1, 1], [-cx, 1, -cz, 0, 1]];
      for (const [x, y, z, u, v] of quad) { pos.push(x, y, z); uv.push(u, v); nor.push(0, 1, 0); }
      if (back) idx.push(o, o + 2, o + 1, o, o + 3, o + 2); else idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geo.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  geo.setIndex(idx);
  const rnd = seededRandom(seed * 131 + 7);
  const items: { x: number; z: number; s: number; w: number; yaw: number; tile: number; tint: number }[] = [];
  const clumps = Math.round(64 * density);
  for (let i = 0; i < clumps * 4 && items.length < clumps * 5; i++) {
    const ang = rnd() * Math.PI * 2, rad = arena.r + 0.55 + rnd() ** 1.4 * 2.05;
    const x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
    if (z > 7 || (Math.abs(x) < 4 && z > 0)) continue; // entry + camera-side arc stay clear (the low camera sits there)
    const flowers = rnd() < 0.3, k = 3 + Math.floor(rnd() * 3);
    for (let j = 0; j < k; j++) {
      const jx = x + (rnd() - 0.5) * 0.9, jz = z + (rnd() - 0.5) * 0.9;
      if (Math.hypot(jx, jz) < arena.r + 0.45) continue; // never inside the playable circle
      const tile = flowers && rnd() < 0.7 ? 1 : 0;
      const s = tile ? 0.32 + rnd() * 0.16 : 0.34 + rnd() * 0.3;
      items.push({ x: jx, z: jz, s, w: s * (tile ? 1.2 : 1.5), yaw: rnd() * Math.PI, tile, tint: 0.82 + rnd() * 0.3 });
    }
  }
  const map = cardAtlas();
  const mat = new MeshLambertMaterial({ map, alphaTest: 0.5 });
  const uTime = { value: 0 };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = 'uniform float uTime;\nattribute float aTile;\n' + sh.vertexShader
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n  vMapUv.x = (vMapUv.x + aTile) * 0.5;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
  { float ph = instanceMatrix[3].x * 0.9 + instanceMatrix[3].z * 0.7;
    transformed.x += sin(uTime * 1.6 + ph) * 0.07 * position.y * position.y;
    transformed.z += cos(uTime * 1.3 + ph) * 0.05 * position.y * position.y; }`);
  };
  mat.customProgramCacheKey = () => 'arena-rim-cards';
  const mesh = new InstancedMesh(geo, mat, items.length);
  const tiles = new Float32Array(items.length), m = new Matrix4(), qt = new Quaternion(), e = new Euler(), c = new Color();
  items.forEach((it, i) => {
    m.compose(new Vector3(arena.x + it.x, 0, arena.z + it.z), qt.setFromEuler(e.set(0, it.yaw, 0)), new Vector3(it.w, it.s, it.w));
    mesh.setMatrixAt(i, m); tiles[i] = it.tile; mesh.setColorAt(i, c.setScalar(it.tint));
  });
  geo.setAttribute('aTile', new InstancedBufferAttribute(tiles, 1));
  mesh.computeBoundingSphere();
  mesh.name = 'arena_rim_cards';
  return { mesh, map, uTime };
}

/** 64x256 strip: soft-edged column of falling streaks, white to pale lumen. RepeatWrapping on v, scrolled in update(). */
function waterTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256;
  const g = c.getContext('2d')!;
  const rnd = seededRandom(9);
  const body = g.createLinearGradient(0, 0, 64, 0);
  body.addColorStop(0, 'rgba(150,214,240,0)'); body.addColorStop(0.18, 'rgba(150,214,240,0.55)'); body.addColorStop(0.5, 'rgba(170,226,246,0.72)');
  body.addColorStop(0.82, 'rgba(150,214,240,0.55)'); body.addColorStop(1, 'rgba(150,214,240,0)');
  g.fillStyle = body; g.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 70; i++) { // streaks; drawn twice (y and y-256) so the strip tiles seamlessly
    const x = 6 + rnd() * 52, y = rnd() * 256, h = 18 + rnd() * 60, w = 1 + rnd() * 2.5;
    const edge = Math.min(x - 4, 60 - x) / 26, a = (0.25 + rnd() * 0.55) * Math.min(1, Math.max(0, edge) + 0.2);
    g.fillStyle = rnd() < 0.6 ? `rgba(240,252,255,${a})` : `rgba(188,236,250,${a})`;
    for (const oy of [0, -256, 256]) g.fillRect(x, y + oy, w, h);
  }
  const map = new CanvasTexture(c); map.colorSpace = SRGBColorSpace; map.wrapS = RepeatWrapping; map.wrapT = RepeatWrapping;
  return map;
}

function makeWaterfalls(arena: Arena) {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  FALLS.forEach(([x, z, h, wt, wb, u0], i) => {
    const bx = arena.x + x, bz = arena.z + z, o = i * 6;
    // three rows: base (spray hides it), lip bend, top; top leans back 0.35 m so the edge reads as a fall over a cliff lip
    const rows = [[0, wb, 0], [h * 0.82, wt * 1.04, -0.08], [h, wt, -0.35]];
    for (const [y, w, dz] of rows) for (const s of [-0.5, 0.5]) { pos.push(bx + s * w, y, bz + dz); uv.push(s + 0.5 + u0, y / 2.4); }
    idx.push(o, o + 1, o + 3, o, o + 3, o + 2, o + 2, o + 3, o + 5, o + 2, o + 5, o + 4);
  });
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals(); geo.computeBoundingSphere();
  const map = waterTexture();
  const mesh = new Mesh(geo, new MeshBasicMaterial({ map, color: 0xe6f8ff, transparent: true, depthWrite: false }));
  mesh.name = 'arena_waterfalls';
  return { mesh, map };
}

/** Spray at each fall's base: camera-facing soft ellipses (falloff in the shader, no texture), slowly breathing. 1 draw call. */
function makeSpray(arena: Arena) {
  const pos: number[] = [], uv: number[] = [], center: number[] = [], size: number[] = [], idx: number[] = [];
  const rnd = seededRandom(31);
  let q = 0;
  for (const [x, z, , , wb] of FALLS) {
    for (let i = 0; i < 5; i++) {
      const cx = arena.x + x + (i - 2) * wb * 0.32 + (rnd() - 0.5) * 0.3, cy = 0.35 + rnd() * 0.55, cz = arena.z + z + 0.25 + rnd() * 0.3;
      const w = 1.0 + rnd() * 0.8, hh = 0.7 + rnd() * 0.5;
      for (const [qx, qy] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) { pos.push(qx, qy, 0); uv.push(qx + 0.5, qy + 0.5); center.push(cx, cy, cz); size.push(w, hh); }
      const o = q * 4; idx.push(o, o + 1, o + 2, o, o + 2, o + 3); q++;
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geo.setAttribute('aCenter', new Float32BufferAttribute(center, 3));
  geo.setAttribute('aSize', new Float32BufferAttribute(size, 2));
  geo.setIndex(idx);
  const uTime = { value: 0 };
  const mat = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, fog: false,
    uniforms: { uTime, uColor: { value: new Color(0xd8f6ff) } },
    vertexShader: `
      attribute vec3 aCenter; attribute vec2 aSize; uniform float uTime; varying vec2 vUv; varying float vA;
      void main(){
        vUv = uv; float ph = aCenter.x * 3.1 + aCenter.y * 7.3;
        float puff = 0.85 + 0.25 * sin(uTime * 2.3 + ph);
        vec4 mv = modelViewMatrix * vec4(aCenter + vec3(0.0, 0.12 * sin(uTime * 1.7 + ph), 0.0), 1.0);
        mv.xy += position.xy * aSize * puff;
        vA = 0.8 + 0.2 * sin(uTime * 3.1 + ph * 1.7);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; varying vec2 vUv; varying float vA;
      void main(){
        float d = length(vUv * 2.0 - 1.0); if (d > 1.0) discard;
        float f = 1.0 - d; f = f * f;
        gl_FragColor = vec4(uColor * f * 0.32 * vA, 1.0);
      }`,
  });
  const mesh = new Mesh(geo, mat);
  mesh.frustumCulled = false; // quads are expanded in the shader
  mesh.renderOrder = 2; // with the crystal halos, before telegraphs (10)
  mesh.name = 'arena_spray';
  return { mesh, uTime };
}

function smooth(a: number, b: number, x: number) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
function rgb(c: number[]) { return `rgb(${c.map((v) => Math.max(0, Math.min(255, Math.round(v)))).join(',')})`; }
function seededRandom(seed: number) {
  let state = seed | 0;
  return () => ((state = Math.imul(state, 1664525) + 1013904223 | 0) >>> 0) / 0x100000000;
}
