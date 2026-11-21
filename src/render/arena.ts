import {
  BoxGeometry, CanvasTexture, Color, CylinderGeometry, DodecahedronGeometry, Euler, Group, IcosahedronGeometry,
  InstancedMesh, Matrix4, Mesh, MeshLambertMaterial, PlaneGeometry, Quaternion, SRGBColorSpace,
  TorusGeometry, Vector3, type BufferGeometry,
} from 'three';
import { arenaLook, CLIFF_TINTS, COLUMN_TINTS, LOOKS, paintFlagstones, shrineLocal, SHRINE_SIDE } from './arenaDeco.ts';
import { flattenPropMerged, kitHas } from './models.ts';

/** DES-004 step 2 Blender landmarks (`crystal_spire`, `ruin_arch_shrine`, docs/qa/spire-shrine-v01): default A (in synes_kit.glb),
 *  `?spire=B` option B (side-car GLB loaded by main.ts), `?spire=0` the old icosahedron crystals + box shrine. */
export type SpireLook = 'A' | 'B' | null;
export function spireLook(): SpireLook {
  try {
    const v = (new URLSearchParams(location.search).get('spire') || '').toUpperCase();
    if (v === '0' || v === 'BASE' || v === 'CUR') return null;
    return v === 'B' ? 'B' : 'A';
  } catch { return 'A'; }
}
/** Spire height (m) per tall cluster index (k 0: h 5.8, k 1: h 7.6 in CRYSTAL_CLUSTERS); other clusters keep their icosahedra. */
const SPIRE_HEIGHT: Record<number, number> = { 0: 6.4, 1: 8.2 };
/** Spire yaw per cluster (radians, mirrored on the left side) so the snapped tip is seen from the low camera. */
const SPIRE_YAW: Record<number, number> = { 0: 2.2, 1: 2.9 };

interface Arena { x: number; z: number; r: number }
export type ArenaFloor = Mesh<PlaneGeometry, MeshLambertMaterial>;

/** Crystal clusters around the arena (offsets from its centre, mirrored on both sides). Shared with the DES-004 glow halos. */
const CRYSTAL_CLUSTERS = [
  { x: 8.8, z: -12.4, h: 5.8, vr: 0, vl: 2 },
  { x: 12.9, z: -6.2, h: 7.6, vr: 2, vl: 0 },
  { x: 13.4, z: 2.2, h: 4.1, vr: 3, vl: 0 },
  { x: 10.4, z: 7.7, h: 2.2, vr: 2, vl: 3 },
];
export const SHRINE_Z = -14.1;
export const SHRINE_CRYSTAL_Y = 3.65;

/** Big crystals that get a halo: world x/z, height (m) and tint index (0 lumen, 1 violet). Small clusters near the camera side are skipped. */
export function arenaGlowAnchors(arena: Arena) {
  const out: { x: number; y: number; z: number; h: number; tint: number }[] = [];
  for (const side of [-1, 1]) {
    for (const c of CRYSTAL_CLUSTERS) {
      if (c.h < 4) continue;
      out.push({ x: arena.x + side * c.x, y: c.h * 0.5, z: arena.z + c.z, h: c.h, tint: (side > 0 ? c.vr : c.vl) >= 2 ? 1 : 0 });
    }
  }
  const sc = arenaLook() === 'base' ? { x: 0, z: SHRINE_Z + 0.11 } : shrineLocal(0, 0.11);
  out.push({ x: arena.x + sc.x, y: SHRINE_CRYSTAL_Y, z: arena.z + sc.z, h: 3.2, tint: 0 });
  return out;
}

export function makeArenaFloor(arena: Arena, size: number, seed: number): ArenaFloor {
  const random = seededRandom(seed);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const px = size / 28;
  const mid = size / 2;
  const rim = (arena.r + 0.65) * px;
  ctx.save();
  ctx.beginPath();
  ctx.arc(mid, mid, rim, 0, Math.PI * 2);
  ctx.rect(mid - 3 * px, mid, 6 * px, size - mid);
  ctx.clip();
  const look = arenaLook();
  if (look !== 'base') paintFlagstones(ctx, { size, px, mid, arenaR: arena.r, seed, look }); // DES-004 step 2 prototype (?arena=A|B)
  else paintBricks(ctx, size, px, mid, rim, random); // the current floor (default look)

  const ring = (arena.r - 1.2) * px;
  ctx.lineWidth = px * 0.16;
  for (let i = 0; i < 12; i++) {
    const start = i * Math.PI / 6 + 0.06;
    for (const inset of [0, 0.28]) {
      ctx.beginPath();
      ctx.arc(mid, mid, ring - inset * px, start, start + 0.38);
      ctx.strokeStyle = inset ? '#65c6c195' : '#75e6d9bf';
      ctx.stroke();
    }
    const a = start + 0.44;
    ctx.save();
    ctx.translate(mid + Math.cos(a) * ring, mid + Math.sin(a) * ring);
    ctx.rotate(a + Math.PI / 4);
    ctx.fillStyle = '#8bedda';
    ctx.fillRect(-px * 0.1, -px * 0.1, px * 0.2, px * 0.2);
    ctx.restore();
  }
  ctx.restore();

  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 4;
  const mesh = new Mesh(new PlaneGeometry(28, 28), new MeshLambertMaterial({ map, alphaTest: 0.5 }));
  mesh.name = 'arena_floor';
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(arena.x, 0.008, arena.z);
  mesh.receiveShadow = true;
  return mesh;
}

/** The current floor: rows of slightly irregular bricks with dark joints (default look, unchanged). */
function paintBricks(ctx: CanvasRenderingContext2D, size: number, px: number, mid: number, rim: number, random: () => number) {
  ctx.fillStyle = '#39414a';
  ctx.fillRect(0, 0, size, size);

  const stone = ['#707681', '#7b7e8e', '#656f80', '#817d86', '#727b89', '#777888', '#67747c', '#797f85'];
  const moss = ['#576f57', '#4a6458', '#647866'];
  const rowHeight = 1.12 * px;
  for (let row = -1; row < Math.ceil(size / rowHeight); row++) {
    const z = row * rowHeight;
    let x = -(row % 2 === 0 ? 1.6 : 0.8) * px;
    while (x < size) {
      const w = (1.38 + random() * 1.14) * px;
      const jog = (random() - 0.5) * px * 0.24;
      const edge = Math.hypot(x + w * 0.5 - mid, z + rowHeight / 2 - mid);
      const palette = (edge > rim * 0.77 && random() < 0.3) || random() < 0.065 ? moss : stone;
      ctx.beginPath();
      ctx.moveTo(x + px * 0.12, z + px * 0.06);
      ctx.lineTo(x + w - px * 0.14, z + px * 0.08 - jog);
      ctx.lineTo(x + w - px * 0.035, z + px * 0.23);
      ctx.lineTo(x + w - px * 0.06, z + rowHeight - px * 0.19);
      ctx.lineTo(x + w - px * 0.18, z + rowHeight - px * 0.045);
      ctx.lineTo(x + px * 0.14, z + rowHeight - px * 0.065 - jog);
      ctx.lineTo(x + px * 0.035, z + rowHeight - px * 0.24);
      ctx.lineTo(x + px * 0.03, z + px * 0.2);
      ctx.closePath();
      ctx.fillStyle = palette[Math.floor(random() * palette.length)];
      ctx.fill();
      ctx.strokeStyle = '#272e3b';
      ctx.lineWidth = px * 0.047;
      ctx.stroke();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#b7c8d028';
      ctx.fillRect(x, z + px * 0.03, w, px * 0.11);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = random() < 0.5 ? '#c7d2d018' : '#2529341c';
        ctx.fillRect(x + random() * w, z + random() * rowHeight, (0.07 + random() * 0.27) * px, (0.03 + random() * 0.12) * px);
      }
      if (random() < 0.3) {
        ctx.beginPath();
        ctx.moveTo(x + w * 0.48, z + rowHeight);
        ctx.lineTo(x + w * 0.44, z + rowHeight * 0.62);
        ctx.lineTo(x + w * 0.56, z + rowHeight * 0.41);
        ctx.strokeStyle = '#32374588';
        ctx.lineWidth = px * 0.027;
        ctx.stroke();
      }
      ctx.restore();
      x += w;
    }
  }
}

/** Decorative backdrop kept outside the playable ring. Batches share geometry and materials across the scene. */
export function makeArenaRuins(arena: Arena, seed: number) {
  const random = seededRandom(seed);
  const group = new Group();
  group.name = 'prismatic_ruins';
  // DES-004 step 2 prototype (?arena=A|B): crystals self-lit in their own hue, shrine moved right of the camera axis (light stone),
  // the two back-right columns that stood there and the old box waterfall (replaced by arenaDeco.ts planes) left out.
  // The default look takes none of these branches (random() is consumed in the same order either way).
  const look = arenaLook(), proto = look !== 'base';
  // ?spire: GLB spires replace the tallest icosahedron of the two big clusters per side, the GLB shrine replaces the box shrine
  // (same random() order either way; falls back to the old look when the kit has no such nodes, e.g. ?nokit)
  const spire = kitHas('crystal_spire') && kitHas('ruin_arch_shrine') ? spireLook() : null;
  const spires: { x: number; z: number; k: number; side: number }[] = [];
  const stone = new MeshLambertMaterial();
  const crystal = new MeshLambertMaterial({ emissive: 0x136f9b, emissiveIntensity: 0.68 });
  if (look !== 'base') selfLitCrystal(crystal, LOOKS[look].crystalSelf);
  const gold = new MeshLambertMaterial({ color: 0xb3a27a });
  const water = new MeshLambertMaterial({ emissive: 0x215f8f, emissiveIntensity: 0.48 });
  const box = batch(new BoxGeometry(), stone);
  const column = batch(new CylinderGeometry(0.45, 0.5, 1, 8), stone);
  const cliff = batch(new DodecahedronGeometry(1), stone);
  const prism = batch(new IcosahedronGeometry(1), crystal);
  const ring = batch(new TorusGeometry(2.6, 0.15, 5, 28), gold);
  const fall = batch(new BoxGeometry(), water);
  const stoneColors = [0x5b6176, 0x6f7488, 0x7d7e8b, 0x656679];
  const colors = [0x32d8ef, 0x62e6e4, 0x62a5fa, 0x9882fd, 0xb39dfb];
  const rockColor = () => stoneColors[Math.floor(random() * stoneColors.length)];
  /** prototype looks: same random() draw, tint from a lighter set by the same index (cliffs: haze, columns: light stone) */
  const tinted = (set: number[]) => () => { const i = Math.floor(random() * stoneColors.length); return proto ? set[i % set.length] : stoneColors[i]; };
  const cliffColor = tinted(CLIFF_TINTS), columnColor = tinted(COLUMN_TINTS);
  /** QA label of the instances added next (tools/qa/arena-probe.mjs masks by it); `skip` drops adds but keeps the random() order */
  let part = 'cliff', skip = false;
  const add = (b: Batch, x: number, y: number, z: number, w: number, h: number, d: number, tint: number, yaw = 0, roll = 0) => {
    if (skip) return;
    b.parts.push(part);
    b.matrices.push(new Matrix4().compose(
      new Vector3(arena.x + x, y, arena.z + z),
      new Quaternion().setFromEuler(new Euler(0, yaw, roll)),
      new Vector3(w, h, d),
    ));
    b.colors.push(new Color(tint));
  };
  const cluster = (x: number, z: number, height: number, variant: number, k = -1, side = 1) => {
    const label = part;
    part = 'crystal_rock';
    add(cliff, x, 0.2, z, height * 0.4, 0.48, height * 0.27, rockColor());
    part = label;
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * height * 0.16;
      const h = height * (i === 1 ? 1 : 0.48 + random() * 0.17);
      const toSpire = !!spire && i === 1 && k in SPIRE_HEIGHT;
      if (toSpire) spires.push({ x: x + offset, z: z + (i % 2) * 0.3, k, side });
      skip = toSpire;
      add(prism, x + offset, h * 0.45, z + (i % 2) * 0.3, h * 0.165, h * 0.54, h * 0.19, colors[(variant + i) % colors.length], random() * Math.PI, offset * -0.4);
      skip = false;
    }
  };

  // Layer large cliffs behind the shrine and leave the playable arena center unobstructed.
  for (let i = 0; i < 15; i++) {
    const x = (i - 7) * 3.35, h = 3.3 + random() * 4;
    add(cliff, x, h * 0.55, -20 - random() * 2.8, 2.9 + random() * 2, h, 3.1, cliffColor(), random() * Math.PI, (random() - 0.5) * 0.3);
  }
  part = 'fall'; skip = proto;
  for (let i = 0; i < 9; i++) {
    const h = 5.0 + random() * 0.45;
    add(fall, -6.5 + i * 0.21, h * 0.5, -17.4 + random() * 0.14, 0.26, h, 0.08, i % 3 === 0 ? 0x80c6fd : 0x4e93c9);
  }
  skip = false;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      part = 'column'; skip = proto && side > 0 && i < 2; // the moved shrine stands there
      const x = side * (4.1 + i * 2.5);
      const z = -13.65 + i * 0.75;
      const h = i === 2 ? 3.4 : 5.8 - i * 0.3;
      add(box, x, 0.24, z, 1.6, 0.48, 1.55, columnColor());
      add(box, x, 0.64, z, 1.28, 0.32, 1.28, columnColor());
      const blocks = Math.round(h / 0.62);
      for (let j = 0; j < blocks; j++) add(column, x, 1.06 + j * 0.61, z, 1.16, 0.59, 1.16, columnColor(), (j % 3) * 0.07);
      if (i !== 2) {
        add(box, x, 0.98 + blocks * 0.61, z, 1.5, 0.32, 1.5, columnColor());
        if (i < 2) add(box, x + side * 0.73, 1.32 + blocks * 0.61, z, 2.8, 0.34, 1.18, columnColor(), 0, side * -0.09);
      }
    }
    skip = false;
    CRYSTAL_CLUSTERS.forEach((c, k) => { part = `crystal_${side < 0 ? 'L' : 'R'}${k}`; cluster(side * c.x, c.z, c.h, side > 0 ? c.vr : c.vl, k, side); });
  }

  part = 'shrine';
  skip = !!spire; // the GLB shrine below replaces these boxes, the ring and the icosahedron (random() still drawn)
  if (!proto) {
    const shrineZ = SHRINE_Z;
    for (let i = 0; i < 5; i++) {
      add(box, 0, 0.12 + i * 0.17, shrineZ + 1.8 - i * 0.38, 5.8 - i * 0.36, 0.24, 0.86, rockColor());
    }
    add(box, 0, 0.73, shrineZ - 0.5, 4.6, 0.36, 1.56, rockColor());
    for (const side of [-1, 1]) add(box, side * 1.95, 1.31, shrineZ, 1.05, 1, 1.35, rockColor());
    add(ring, 0, SHRINE_CRYSTAL_Y, shrineZ, 0.93, 1, 1, 0xffffff);
    add(prism, 0, SHRINE_CRYSTAL_Y, shrineZ + 0.11, 0.68, 1.18, 0.65, 0x76f3ff, 0.42);
  } else {
    // same parts in shrine-local coordinates, turned toward the arena; stone #B9B4C7 family so the shrine reads brighter than the floor
    const yaw = SHRINE_SIDE.yaw, at = (lx: number, lz: number) => shrineLocal(lx, lz);
    const tints = LOOKS[look as 'A' | 'B'].shrineStone, light = (i: number) => { rockColor(); return tints[i % tints.length]; };
    for (let i = 0; i < 5; i++) { const p = at(0, 1.8 - i * 0.38); add(box, p.x, 0.12 + i * 0.17, p.z, 5.8 - i * 0.36, 0.24, 0.86, light(i), yaw); }
    { const p = at(0, -0.5); add(box, p.x, 0.73, p.z, 4.6, 0.36, 1.56, light(5), yaw); }
    for (const side of [-1, 1]) { const p = at(side * 1.95, 0); add(box, p.x, 1.31, p.z, 1.05, 1, 1.35, light(side + 7), yaw); }
    { const p = at(0, 0); add(ring, p.x, SHRINE_CRYSTAL_Y, p.z, 0.93, 1, 1, 0xffffff, yaw); }
    { const p = at(0, 0.11); add(prism, p.x, SHRINE_CRYSTAL_Y, p.z, 0.68, 1.18, 0.65, 0x76f3ff, 0.42 + yaw); }
  }
  skip = false;
  if (spire) {
    // +1 draw call each: all spires in one InstancedMesh, the shrine as one Mesh (kit nodes are baked to one material).
    // Not sim colliders, no shadows (like the rest of the ruins). Shrine pose = where the current arena look puts the box shrine.
    const [s] = flattenPropMerged('crystal_spire');
    s.geometry.computeBoundingBox();
    const modelH = s.geometry.boundingBox!.max.y;
    const spireMesh = new InstancedMesh(s.geometry, s.material, spires.length);
    spireMesh.name = 'crystal_spire';
    spires.forEach((p, i) => {
      const k = SPIRE_HEIGHT[p.k] / modelH;
      spireMesh.setMatrixAt(i, new Matrix4().compose(new Vector3(arena.x + p.x, 0, arena.z + p.z),
        new Quaternion().setFromEuler(new Euler(0, p.side * SPIRE_YAW[p.k], 0)), new Vector3(k, k, k)));
    });
    spireMesh.computeBoundingSphere();
    const [sh] = flattenPropMerged('ruin_arch_shrine');
    const shrine = new Mesh(sh.geometry, sh.material);
    shrine.name = 'ruin_arch_shrine';
    if (proto) { const c = shrineLocal(0, 0); shrine.position.set(arena.x + c.x, 0, arena.z + c.z); shrine.rotation.y = SHRINE_SIDE.yaw; }
    else shrine.position.set(arena.x, 0, arena.z + SHRINE_Z);
    group.add(spireMesh, shrine);
  }
  for (const b of [box, column, cliff, prism, ring, fall]) {
    if (!b.matrices.length) continue; // prototype looks drop the box waterfall
    const mesh = new InstancedMesh(b.geometry, b.material, b.matrices.length);
    mesh.userData.parts = b.parts;
    b.matrices.forEach((matrix, i) => {
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, b.colors[i]);
    });
    mesh.computeBoundingSphere();
    group.add(mesh);
  }
  return group;
}

interface Batch {
  geometry: BufferGeometry; material: MeshLambertMaterial; matrices: Matrix4[]; colors: Color[]; parts: string[];
}
function batch(geometry: BufferGeometry, material: MeshLambertMaterial): Batch {
  return { geometry, material, matrices: [], colors: [], parts: [] };
}
/** DES-006 §3: crystals light themselves in their own hue (instance colour), brighter toward the tip, so the camera-facing
 *  side that the back-left sun never reaches is not darker than the floor. Prototype looks only; +0 draw calls, +0 textures. */
function selfLitCrystal(m: MeshLambertMaterial, k: number) {
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = 'varying float vCrystalY;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vCrystalY = position.y;');
    sh.fragmentShader = 'varying float vCrystalY;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += vColor.rgb * CRYSTAL_SELF * (0.55 + 0.75 * smoothstep(-0.8, 0.95, vCrystalY));`);
    sh.fragmentShader = `#define CRYSTAL_SELF ${k.toFixed(3)}\n` + sh.fragmentShader;
  };
  m.customProgramCacheKey = () => `arena-crystal-selflit-${k}`;
}
function seededRandom(seed: number) {
  let state = seed | 0;
  return () => ((state = Math.imul(state, 1664525) + 1013904223 | 0) >>> 0) / 0x100000000;
}
