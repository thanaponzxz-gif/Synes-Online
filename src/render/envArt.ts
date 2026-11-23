// exp/env-sample-a: Environment Art sample area (camp -> first plaza), docs/qa/env-art-v01/r1-sample/README.md.
// Render-only, never touches the sim. Default ON; `?env=0` = the exact previous look (View skips every hook in this file, and nothing
// here runs at import time, so material ids / draw order / random streams of the old look stay the same).
//   1. ground canvas: grass value/hue patches, painted blade strokes, irregular path edge + damp rim, pebbles, grass creeping in,
//      clover / fallen-leaf specks, soft dappled contact shadows of trees/rocks/bushes baked in (tiers without real shadows): 0 draw calls
//   2. a tiling world-space detail texture on the ground (grass strokes on green, grain/pebbles on the path): 0 draw calls
//   3. grass tufts + small flowers as ONE merged static mesh (vertex colours, optional wind sway): +1 draw call
//   4. per-instance value/hue variation of trees and rocks (instanceColor), a few more rocks/bushes in the mid-ground: 0 draw calls
//   5. warm key / cool ambient tone, sun turned to the side so shapes get a lit and a shade side
// Every art choice is listed as E1..En in the README for team A review (Claude holds technical art while Codex quota is out).
import {
  BufferGeometry, CanvasTexture, Color, DoubleSide, Float32BufferAttribute, LinearMipmapNearestFilter, Mesh, MeshLambertMaterial,
  RepeatWrapping, Vector3, type Matrix4,
} from 'three';
import { envLibNode } from './models.ts';
import type { QualitySettings } from './quality.ts';
import type { Tone } from './tones.ts';
import type { Shape } from '../../shared/data/level.ts';

export interface EnvArt {
  /** sun offset from the camera target (View.sunOffset base). Side light: shadows fall left and a little away from the camera. */
  sun: Vector3;
  /** grass/flower wind sway (vertex shader); `?wind=0` turns it off, the low tier never has it */
  wind: boolean;
}

/** `?env=0` (or `off`) = previous look; anything else = the sample-area look. */
export function envArtFromQuery(q: URLSearchParams): EnvArt | null {
  const v = (q.get('env') || '').toLowerCase();
  if (v === '0' || v === 'off' || v === 'old') return null;
  return { sun: new Vector3(11, 17, 2), wind: q.get('wind') !== '0' };
}

/** E6: warm key (sun) + cool ambient (sky), a little more sun so the side light reads. Only the meadow tone; the arena blend is unchanged. */
export function envTone(t: Tone): Tone {
  if (t.id !== 'dewlight' && !t.id.startsWith('dewlight')) return t;
  return { ...t, id: t.id + '-env', hemiSky: 0xd3e6ff, hemiGround: 0x7eae66, hemiI: 1.5, sun: 0xffe7c2, sunI: 2.45 };
}

// ------------------------------------------------------------------ deterministic helpers (render-only: trig + own PRNG are fine here)
export function prng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** smooth 1D periodic-ish noise from a few sines with random phases, range about -1..1 */
function wave(rnd: () => number) {
  const f = [0.7 + rnd() * 0.4, 1.9 + rnd() * 0.8, 4.1 + rnd() * 1.5], p = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  return (s: number) => (Math.sin(s * f[0] + p[0]) * 0.55 + Math.sin(s * f[1] + p[1]) * 0.3 + Math.sin(s * f[2] + p[2]) * 0.15);
}
const rgba = (c: number, a: number) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
const mix = (a: number, b: number, k: number) => new Color(a).lerp(new Color(b), k).getHex();

export interface GroundCtx {
  g: CanvasRenderingContext2D; W: number; H: number; sx: number; sz: number;
  U: (x: number) => number; V: (z: number) => number;
  bounds: { x0: number; x1: number; z0: number; z1: number };
  tone: Tone; walkable: Shape[]; sdf: (x: number, z: number) => number;
  pathFill: string | CanvasGradient; arena: { x: number; z: number; r: number } | null; seed: number;
}

/** Outline of a walkable shape grown by `pad` m, with a smooth wobble of `amp` m (irregular, hand-painted edge). */
function wobblyPath(c: GroundCtx, s: Shape, pad: number, amp: number, n: (u: number) => number) {
  const { g, U, V } = c; g.beginPath();
  if (s.type === 'circle') {
    const steps = 72;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2, r = s.r + pad + amp * n(a * s.r * 0.5);
      const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
      i ? g.lineTo(U(x), V(z)) : g.moveTo(U(x), V(z));
    }
  } else {
    const dx = s.bx - s.ax, dz = s.bz - s.az, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
    const pts: [number, number][] = []; let arc = 0;
    const R = (u: number) => s.r + pad + amp * n(u);
    // side 1 (a -> b), cap at b, side 2 (b -> a), cap at a; `arc` runs along the outline so the wobble is continuous
    for (let t = 0; t <= L; t += 0.4, arc += 0.4) { const r = R(arc); pts.push([s.ax + ux * t + nx * r, s.az + uz * t + nz * r]); }
    for (let k = 1; k < 12; k++, arc += 0.35) { const a = (k / 12) * Math.PI, r = R(arc); const cx = Math.cos(a), sn = Math.sin(a); pts.push([s.bx + (nx * cx + ux * sn) * r, s.bz + (nz * cx + uz * sn) * r]); }
    for (let t = L; t >= 0; t -= 0.4, arc += 0.4) { const r = R(arc); pts.push([s.ax + ux * t - nx * r, s.az + uz * t - nz * r]); }
    for (let k = 1; k < 12; k++, arc += 0.35) { const a = (k / 12) * Math.PI, r = R(arc); const cx = Math.cos(a), sn = Math.sin(a); pts.push([s.ax - (nx * cx + ux * sn) * r, s.az - (nz * cx + uz * sn) * r]); }
    pts.forEach(([x, z], i) => (i ? g.lineTo(U(x), V(z)) : g.moveTo(U(x), V(z))));
  }
  g.closePath(); g.fill();
}

/** Soft round spot (radial gradient), world units. */
function spot(c: GroundCtx, x: number, z: number, r: number, col: number, a: number) {
  const { g, U, V, sx, sz } = c, px = U(x), pz = V(z), rr = r * (sx + sz) * 0.5; // round in canvas px (cells are ~7.5 x 8.8 px per m: close enough)
  if (rr < 0.6) { g.fillStyle = rgba(col, a); g.fillRect(px, pz, 1, 1); return; }
  const gr = g.createRadialGradient(px, pz, 0, px, pz, rr);
  gr.addColorStop(0, rgba(col, a)); gr.addColorStop(0.55, rgba(col, a * 0.6)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr;
  g.fillRect(px - rr, pz - rr, rr * 2, rr * 2);
}

/** E1/E2: the whole ground canvas for the sample look (replaces the flat gradient + specks + 3-band path of the old look). */
export function paintGround(c: GroundCtx) {
  const { g, W, H, U, V, sx, sz, tone: t, bounds: B, sdf } = c;
  const rnd = prng(c.seed * 7919 + 101);
  const rx = () => B.x0 + rnd() * (B.x1 - B.x0), rz = () => B.z0 + rnd() * (B.z1 - B.z0);
  // base: the tone's two greens, as before
  const grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, rgba(t.grassB, 1)); grad.addColorStop(1, rgba(t.grassA, 1));
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  // macro value/hue patches: sunlit yellow-green, lush blue-green, olive, cool dark (sizes in metres, independent of groundRes)
  const lightG = mix(t.grassA, 0xd8eb8a, 0.55), lushG = mix(t.grassB, 0x2f8a63, 0.5), olive = mix(t.grassA, 0x9c9a4e, 0.55), coolD = mix(t.grassB, 0x3d7468, 0.6);
  const macro = [lightG, lushG, olive, coolD, lightG];
  for (let i = 0; i < 420; i++) spot(c, rx(), rz(), 2.2 + rnd() * 5.5, macro[Math.floor(rnd() * macro.length)], 0.12 + rnd() * 0.14);
  for (let i = 0; i < 2600; i++) spot(c, rx(), rz(), 0.35 + rnd() * 1.1, rnd() < 0.5 ? lightG : lushG, 0.05 + rnd() * 0.07);
  // the boss grove keeps the old cool tint (same values as View)
  if (c.arena) {
    const x = U(c.arena.x), z = V(c.arena.z), grove = g.createRadialGradient(x, z, 6 * sx, x, z, 31 * sx);
    grove.addColorStop(0, '#526f65'); grove.addColorStop(0.44, '#526f65e6'); grove.addColorStop(1, '#526f6500');
    g.fillStyle = grove; g.fillRect(0, 0, W, H);
  }
  // painted blade strokes: short near-vertical (in world -z, i.e. "up" on screen) marks, light tips and dark gaps, batched per colour
  const strokes: [number, number][] = [[0xe9ffb0, 0.16], [0x245f34, 0.17], [0xbfe48a, 0.14], [0x1d4f3c, 0.12]];
  const nStroke = Math.round(W * H / 14);
  g.lineWidth = Math.max(1, sx * 0.09); g.lineCap = 'round';
  for (const [col, a] of strokes) {
    g.strokeStyle = rgba(col, a); g.beginPath();
    for (let i = 0; i < nStroke / strokes.length; i++) {
      const x = rnd() * W, y = rnd() * H, len = (0.12 + rnd() * 0.22) * sz, lean = (rnd() - 0.5) * 0.9;
      g.moveTo(x, y); g.lineTo(x + lean * len, y - len);
    }
    g.stroke();
  }
  // path: damp darker rim outside the edge (two soft passes) -> edge -> fill; every layer with its own wobble
  const rimCol = mix(t.grassB, 0x3e5a3a, 0.45), edgeCol = t.pathEdge;
  const nRim = c.walkable.map(() => wave(rnd)), nEdge = c.walkable.map(() => wave(rnd)), nFill = c.walkable.map(() => wave(rnd));
  g.fillStyle = rgba(rimCol, 0.16); c.walkable.forEach((s, i) => wobblyPath(c, s, 1.45, 0.45, nRim[i]));
  g.fillStyle = rgba(rimCol, 0.2); c.walkable.forEach((s, i) => wobblyPath(c, s, 0.75, 0.3, nRim[i]));
  g.fillStyle = rgba(edgeCol, 0.75); c.walkable.forEach((s, i) => wobblyPath(c, s, 0.2, 0.28, nEdge[i]));
  g.fillStyle = c.pathFill; c.walkable.forEach((s, i) => wobblyPath(c, s, -0.22, 0.26, nFill[i]));
  // inside the path: soft lighter/darker blotches (worn and packed earth) and faint ruts along the trails
  const pathLight = 0xfff3d6, pathDark = mix(t.path, 0x8a6a48, 0.5);
  for (let i = 0; i < 1400; i++) { const x = rx(), z = rz(); if (sdf(x, z) > -0.5) continue; spot(c, x, z, 0.4 + rnd() * 1.3, rnd() < 0.55 ? pathLight : pathDark, 0.07 + rnd() * 0.08); }
  for (const s of c.walkable) {
    if (s.type !== 'capsule') continue;
    const dx = s.bx - s.ax, dz = s.bz - s.az, L = Math.hypot(dx, dz), nx = -dz / L, nz = dx / L, w = wave(rnd);
    for (const side of [-0.75, 0.75]) {
      g.strokeStyle = rgba(pathDark, 0.12); g.lineWidth = Math.max(1, 0.28 * sx); g.beginPath();
      for (let k = 0; k <= 40; k++) { const u = k / 40, o = side + 0.12 * w(u * L + side * 7); const x = s.ax + dx * u + nx * o, z = s.az + dz * u + nz * o; k ? g.lineTo(U(x), V(z)) : g.moveTo(U(x), V(z)); }
      g.stroke();
    }
  }
  // pebbles: small dark stones with a light top, more toward the path edges
  const peb = mix(t.pathEdge, 0x6f6a72, 0.5), pebLit = 0xfff6e4, pr = Math.max(0.7, 0.09 * sx);
  for (let i = 0; i < 5200; i++) {
    const x = rx(), z = rz(), d = sdf(x, z); if (d > 0.1 || d < -3.5) continue;
    if (rnd() > 0.35 + 0.65 * Math.min(1, (d + 3.5) / 3)) continue;
    const px = U(x), py = V(z), r = pr * (0.6 + rnd() * 0.9);
    g.fillStyle = rgba(peb, 0.55); g.beginPath(); g.ellipse(px, py, r * 1.2, r, 0, 0, 6.283); g.fill();
    g.fillStyle = rgba(pebLit, 0.5); g.fillRect(px - r * 0.6, py - r * 0.7, Math.max(1, r * 0.7), Math.max(1, r * 0.5));
  }
  // grass creeping in over the path edge: small green tongues and blobs
  const creep = mix(t.grassA, t.grassB, 0.5), creepD = mix(t.grassB, 0x2f6b42, 0.35);
  for (let i = 0; i < 9000; i++) {
    const x = rx(), z = rz(), d = sdf(x, z); if (d < -0.6 || d > 0.2) continue;
    const r = 0.12 + rnd() * 0.3; spot(c, x, z, r, rnd() < 0.6 ? creep : creepD, 0.3 + rnd() * 0.3);
  }
  // clover and tiny white/violet specks far from the path (reads as small flowers at distance)
  for (let i = 0; i < 2600; i++) {
    const x = rx(), z = rz(), d = sdf(x, z); if (d < 1.2) continue;
    const col = rnd() < 0.55 ? 0xdff7c4 : rnd() < 0.6 ? 0xf6f1ff : 0xc9b6ff;
    g.fillStyle = rgba(col, 0.55); g.fillRect(U(x), V(z), Math.max(1, sx * 0.08), Math.max(1, sz * 0.08));
  }
}

/** Placed prop (centre, scale, horizontal radius and height of the model at scale 1). */
export interface Caster { x: number; z: number; s: number; r: number; h: number; kind: 'tree' | 'rock' | 'bush' | 'small' }

/** E3: soft, dappled contact shadows baked into the ground canvas, offset away from the sun (tiers without real shadow maps). */
export function bakeContactShadows(c: GroundCtx, casters: Caster[], sun: Vector3) {
  const rnd = prng(c.seed * 104729 + 7);
  const ox = -sun.x / sun.y, oz = -sun.z / sun.y;
  const shade = 0x1f3f48, core = 0x1b3326;
  for (const k of casters) {
    if (k.kind === 'tree') {
      const R = k.r * k.s * 0.8, hc = k.h * k.s * 0.55, cx = k.x + ox * hc, cz = k.z + oz * hc;
      spot(c, cx, cz, R * 1.15, shade, 0.26);
      for (let i = 0; i < 6; i++) { const a = rnd() * 6.283, d = rnd() * R * 0.55; spot(c, cx + Math.cos(a) * d, cz + Math.sin(a) * d, R * (0.35 + rnd() * 0.3), shade, 0.2 + rnd() * 0.12); }
      spot(c, k.x, k.z, 0.6 * k.s, core, 0.42);
    } else {
      const R = k.r * k.s * (k.kind === 'small' ? 0.9 : 1.05), off = k.h * k.s * 0.35;
      spot(c, k.x + ox * off, k.z + oz * off, R * 1.25, shade, k.kind === 'bush' ? 0.26 : 0.3);
      spot(c, k.x, k.z, R * 0.8, core, 0.3);
    }
  }
}

/** Fallen leaves (olive/ochre, never orange) and clover under trees. */
export function paintUnderTrees(c: GroundCtx, casters: Caster[]) {
  const rnd = prng(c.seed * 31337 + 3), { g, U, V, sx } = c;
  const leaf = [0xb4a253, 0x9c9a4a, 0xc9b870], clover = 0xd6f0b0;
  for (const k of casters) {
    if (k.kind !== 'tree') continue;
    for (let i = 0; i < 9; i++) {
      const a = rnd() * 6.283, d = (0.4 + rnd() * 1.6) * k.s, x = k.x + Math.cos(a) * d, z = k.z + Math.sin(a) * d;
      g.fillStyle = rgba(rnd() < 0.7 ? leaf[Math.floor(rnd() * 3)] : clover, 0.6);
      g.fillRect(U(x), V(z), Math.max(1, sx * 0.12), Math.max(1, sx * 0.08));
    }
  }
}

// ------------------------------------------------------------------ ground detail texture (tiled, world space)
let detailTex: CanvasTexture | null = null;
/** 256x256 seamless tile: R = grass blade strokes, G = path grain + pebbles; 0.5 = no change. Shared, built once. */
function detailTexture(): CanvasTexture {
  if (detailTex) return detailTex;
  const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d')!, rnd = prng(424242);
  g.fillStyle = 'rgb(128,128,0)'; g.fillRect(0, 0, N, N);
  const wrap = (f: (ox: number, oy: number) => void) => { for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) f(ox, oy); };
  // R: blade strokes (only the red channel is written: 'lighter'/'darker' would touch G too, so paint with pure-red colours)
  g.globalCompositeOperation = 'source-over';
  g.lineCap = 'round';
  for (let i = 0; i < 2200; i++) {
    const x = rnd() * N, y = rnd() * N, len = 6 + rnd() * 14, lean = (rnd() - 0.5) * 0.7, v = rnd() < 0.5 ? 60 : 205, w = 1 + rnd() * 1.6;
    g.strokeStyle = `rgba(${v},128,0,0.55)`; g.lineWidth = w;
    wrap((ox, oy) => { g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + lean * len, y + oy - len); g.stroke(); });
  }
  // G: grain + pebbles; read back and merge so R keeps the strokes
  const strokes = g.getImageData(0, 0, N, N);
  g.fillStyle = 'rgb(0,128,0)'; g.fillRect(0, 0, N, N);
  for (let i = 0; i < 9000; i++) { const v = rnd() < 0.5 ? 100 : 156; g.fillStyle = `rgb(0,${v},0)`; g.fillRect(Math.floor(rnd() * N), Math.floor(rnd() * N), 1 + Math.floor(rnd() * 2), 1); }
  for (let i = 0; i < 70; i++) {
    const x = rnd() * N, y = rnd() * N, r = 1.5 + rnd() * 3.5;
    wrap((ox, oy) => {
      g.fillStyle = 'rgb(0,70,0)'; g.beginPath(); g.ellipse(x + ox, y + oy + r * 0.3, r * 1.25, r, 0, 0, 6.283); g.fill();
      g.fillStyle = 'rgb(0,190,0)'; g.beginPath(); g.ellipse(x + ox - r * 0.25, y + oy - r * 0.25, r * 0.7, r * 0.5, 0, 0, 6.283); g.fill();
    });
  }
  const grain = g.getImageData(0, 0, N, N);
  for (let i = 0; i < grain.data.length; i += 4) { grain.data[i] = strokes.data[i]; grain.data[i + 2] = 0; grain.data[i + 3] = 255; }
  g.putImageData(grain, 0, 0);
  const t = new CanvasTexture(cv); t.wrapS = t.wrapT = RepeatWrapping; t.minFilter = LinearMipmapNearestFilter; t.anisotropy = 1; // cheaper on software/mobile GPUs; the detail fades out with distance anyway
  return (detailTex = t);
}

/** Ground material patch: multiply the painted ground by the tiled detail (grass strokes where the ground is green, grain on the path),
 *  fading out with distance so far ground does not shimmer. `size` = ground plane size (m), tile = 2 m. */
export function patchGroundDetail(m: MeshLambertMaterial, size: [number, number]) {
  const tex = detailTexture();
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uDetail = { value: tex }; sh.uniforms.uDetailRep = { value: [size[0] / 2, size[1] / 2] };
    sh.fragmentShader = 'uniform sampler2D uDetail; uniform vec2 uDetailRep;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      {
        vec4 dTx = texture2D( uDetail, vMapUv * uDetailRep );
        float dGrass = smoothstep( 0.01, 0.06, diffuseColor.g - max( diffuseColor.r, diffuseColor.b ) );
        float dFar = 1.0 - smoothstep( 14.0, 34.0, length( vViewPosition ) );
        float dV = mix( ( dTx.g - 0.5 ) * 0.42, ( dTx.r - 0.5 ) * 0.5, dGrass ) * dFar;
        diffuseColor.rgb *= 1.0 + dV;
      }`);
  };
  m.customProgramCacheKey = () => 'envGroundDetail';
}

// ------------------------------------------------------------------ grass tufts + flowers (one merged mesh)
interface Tmpl { pos: number[]; col: number[]; sway: number[] }
const FLOWER_COLS = [0xa78bfa, 0xff9ec7, 0xf7f3ff, 0x8fe9f0]; // violet, blossom, white, soft lumen (no gold/orange near telegraphs)

/** If env_library_v01.glb (?envlib=1) has a node with this name, use its first mesh as a template (vertex colour = its material colour). */
function libTemplate(name: string): Tmpl | null {
  const n = envLibNode(name); if (!n) return null;
  const out: Tmpl = { pos: [], col: [], sway: [] };
  n.updateMatrixWorld(true);
  n.traverse((o) => {
    const m = o as Mesh; if (!m.isMesh) return;
    let gm = m.geometry.clone().applyMatrix4(m.matrixWorld); if (gm.index) gm = gm.toNonIndexed();
    const p = gm.getAttribute('position'), col = ((m.material as MeshLambertMaterial).color ?? new Color(1, 1, 1));
    gm.computeBoundingBox(); const h = Math.max(0.01, gm.boundingBox!.max.y);
    for (let i = 0; i < p.count; i++) { out.pos.push(p.getX(i), p.getY(i), p.getZ(i)); out.col.push(col.r, col.g, col.b); out.sway.push(Math.max(0, p.getY(i) / h)); }
  });
  return out.pos.length ? out : null;
}

/** Add one tuft (4 blades) or one flower (stem + 5-petal head tipped toward the camera) to the buffers. */
function addTuft(b: Tmpl, rnd: () => number, x: number, z: number, h: number, base: Color, tip: Color, lib: Tmpl | null) {
  if (lib) { const s = h / 0.3, rot = rnd() * 6.283, c = Math.cos(rot), sn = Math.sin(rot); for (let i = 0; i < lib.pos.length; i += 3) { const px = lib.pos[i] * s, pz = lib.pos[i + 2] * s; b.pos.push(x + px * c - pz * sn, lib.pos[i + 1] * s, z + px * sn + pz * c); b.col.push(lib.col[i] * tip.r, lib.col[i + 1] * tip.g, lib.col[i + 2] * tip.b); b.sway.push(lib.sway[i / 3]); } return; }
  for (let k = 0; k < 3; k++) { // 3 blades per tuft
    const a = rnd() * 6.283, w = 0.045 + rnd() * 0.035, bh = h * (0.65 + rnd() * 0.45), lean = 0.15 + rnd() * 0.3;
    const ca = Math.cos(a), sa = Math.sin(a), ox = (rnd() - 0.5) * 0.08, oz = (rnd() - 0.5) * 0.08;
    const tx = x + ox + ca * bh * lean, tz = z + oz + sa * bh * lean;
    b.pos.push(x + ox - sa * w, 0, z + oz + ca * w, x + ox + sa * w, 0, z + oz - ca * w, tx, bh, tz);
    b.col.push(base.r, base.g, base.b, base.r, base.g, base.b, tip.r, tip.g, tip.b);
    b.sway.push(0, 0, bh / Math.max(h, 0.01));
  }
}
function addFlower(b: Tmpl, rnd: () => number, x: number, z: number, h: number, petal: Color, stem: Color, lib: Tmpl | null) {
  if (lib) { addTuft(b, rnd, x, z, h, petal, petal, lib); return; }
  const lean = (rnd() - 0.5) * 0.06, hx = x + lean, hz = z + 0.02, hy = h;
  b.pos.push(x - 0.012, 0, z, x + 0.012, 0, z, hx, hy, hz); b.col.push(stem.r, stem.g, stem.b, stem.r, stem.g, stem.b, stem.r, stem.g, stem.b); b.sway.push(0, 0, 1);
  // head: 5 petals in a disc tipped ~50 degrees toward +z (the camera side), petal radius 0.055..0.085
  const r = 0.07 + rnd() * 0.035, tilt = 0.85, ct = Math.cos(tilt), st = Math.sin(tilt), rot = rnd() * 6.283;
  const centre = new Color(1, 1, 0.92).lerp(petal, 0.35);
  for (let k = 0; k < 5; k++) {
    const a0 = rot + (k / 5) * 6.283 - 0.5, a1 = rot + (k / 5) * 6.283 + 0.5;
    const p = (a: number): [number, number, number] => { const u = Math.cos(a) * r, v = Math.sin(a) * r; return [hx + u, hy + v * st, hz + v * ct]; };
    const A = p(a0), Bp = p(a1);
    b.pos.push(hx, hy, hz, ...A, ...Bp); b.col.push(centre.r, centre.g, centre.b, petal.r, petal.g, petal.b, petal.r, petal.g, petal.b); b.sway.push(1, 1, 1);
  }
}

export interface GrassField { mesh: Mesh; update(time: number): void; dispose(): void; tufts: number; flowers: number }

/** E4/E5: grass tufts clustered along the path edges and around tree bases / rocks, sparse clumps in the field, flower clusters near the
 *  path; short inside/at the path edge so feet, the hero ring and telegraphs stay readable. One static merged mesh = one draw call. */
export function buildGrass(opts: {
  q: QualitySettings; art: EnvArt; tone: Tone; seed: number; bounds: { x0: number; x1: number; z0: number; z1: number };
  sdf: (x: number, z: number) => number; casters: Caster[]; avoid: { x: number; z: number; r: number }[];
}): GrassField {
  const { q, tone: t, bounds: B, sdf } = opts, rnd = prng(opts.seed * 65537 + 11), dens = q.decoDensity;
  const b: Tmpl = { pos: [], col: [], sway: [] };
  const libT = libTemplate('grass_tuft'), libF = libTemplate('flower_small');
  const blocked = (x: number, z: number) => opts.avoid.some((a) => Math.hypot(x - a.x, z - a.z) < a.r) || x < B.x0 + 0.5 || x > B.x1 - 0.5 || z < B.z0 + 0.5 || z > B.z1 - 0.5;
  const C = (h: number) => new Color(h);
  const baseD = C(mix(mix(t.grassA, t.grassB, 0.5), 0x4f8a4c, 0.25)), tipA = C(mix(t.grassA, 0xd9f08e, 0.4)), tipB = C(mix(t.grassB, 0xa8dc7e, 0.35)), tipC = C(mix(t.grassA, 0x8fcf96, 0.3));
  const tips = [tipA, tipB, tipC];
  const stem = C(mix(t.grassB, 0x3b7a3e, 0.4));
  let tufts = 0, flowers = 0;
  const tuft = (x: number, z: number, h: number) => { if (blocked(x, z)) return; addTuft(b, rnd, x, z, h, baseD, tips[Math.floor(rnd() * 3)], libT); tufts++; };
  const flower = (x: number, z: number, h: number, col: Color) => { if (blocked(x, z) || sdf(x, z) < 0.15) return; addFlower(b, rnd, x, z, h, col, stem, libF); flowers++; };
  const heightAt = (d: number) => d < 0 ? 0.08 + rnd() * 0.05 : d < 0.9 ? 0.12 + rnd() * 0.08 : 0.16 + rnd() * 0.1;
  const rx = () => B.x0 + rnd() * (B.x1 - B.x0), rz = () => B.z0 + rnd() * (B.z1 - B.z0);
  // path-edge clumps: 2-5 tufts around a point in the band -0.45 .. 1.8 m from the walkable edge
  for (let i = 0, n = Math.round(7200 * dens); i < n; i++) {
    const x = rx(), z = rz(), d = sdf(x, z); if (d < -0.45 || d > 1.8) continue;
    const k = 2 + Math.floor(rnd() * 4);
    for (let j = 0; j < k; j++) { const tx = x + (rnd() - 0.5) * 0.5, tz = z + (rnd() - 0.5) * 0.5, dd = sdf(tx, tz); if (dd < -0.45) continue; tuft(tx, tz, heightAt(dd)); }
  }
  // field clumps (sparser with distance from the path)
  for (let i = 0, n = Math.round(2100 * dens); i < n; i++) {
    const x = rx(), z = rz(), d = sdf(x, z); if (d < 1.8 || d > 15 || rnd() > 1.2 / (1 + d * 0.15)) continue;
    const k = 2 + Math.floor(rnd() * 5);
    for (let j = 0; j < k; j++) tuft(x + (rnd() - 0.5) * 0.9, z + (rnd() - 0.5) * 0.9, 0.16 + rnd() * 0.12);
  }
  // around tree bases, rocks and bushes
  for (const c of opts.casters) {
    if (c.kind === 'small') continue;
    const n = c.kind === 'tree' ? 5 : 3, r0 = c.kind === 'tree' ? 0.35 : c.r * c.s * 0.85;
    for (let j = 0; j < n * (0.6 + dens * 0.5); j++) { const a = rnd() * 6.283, r = r0 + rnd() * 0.7; const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r; if (sdf(x, z) < 0.2) continue; tuft(x, z, 0.16 + rnd() * 0.12); }
    if (c.kind !== 'tree' && rnd() < 0.45) { const a = rnd() * 6.283, r = r0 + 0.3; flower(c.x + Math.cos(a) * r, c.z + Math.sin(a) * r, 0.2 + rnd() * 0.1, C(FLOWER_COLS[Math.floor(rnd() * 4)])); }
  }
  // flower clusters: one colour per cluster, mostly near the path, some in the field
  const fc = FLOWER_COLS.map(C);
  for (let i = 0, n = Math.round(1700 * dens); i < n; i++) {
    const x = rx(), z = rz(), d = sdf(x, z); if (d < 0.3 || d > 9) continue;
    if (rnd() > (d < 2.6 ? 1 : 0.25)) continue;
    const col = fc[Math.floor(rnd() * fc.length)], k = 2 + Math.floor(rnd() * 4);
    for (let j = 0; j < k; j++) flower(x + (rnd() - 0.5) * 0.6, z + (rnd() - 0.5) * 0.6, 0.18 + rnd() * 0.12, col);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(b.pos, 3));
  geo.setAttribute('color', new Float32BufferAttribute(b.col, 3));
  geo.setAttribute('aSway', new Float32BufferAttribute(b.sway, 1));
  const nrm = new Float32Array(b.pos.length); for (let i = 1; i < nrm.length; i += 3) nrm[i] = 1; // lit like the ground it grows from
  geo.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
  geo.computeBoundingSphere();
  const mat = new MeshLambertMaterial({ vertexColors: true, side: DoubleSide });
  const uTime = { value: 0 }, wind = opts.art.wind && q.tier !== 'low';
  mat.onBeforeCompile = (sh) => {
    // both faces use the up normal (DoubleSide would flip it on back faces and light those blades from below = dark spikes)
    sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', 'float faceDirection = 1.0; vec3 normal = normalize( vNormal ); vec3 nonPerturbedNormal = normal;');
    if (!wind) return;
    sh.uniforms.uTime = uTime;
    sh.vertexShader = 'uniform float uTime;\nattribute float aSway;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      { float wPh = uTime * 1.7 + position.x * 0.55 + position.z * 0.35;
        transformed.x += ( sin( wPh ) * 0.6 + sin( wPh * 2.3 + 1.7 ) * 0.25 ) * aSway * 0.045;
        transformed.z += sin( wPh * 0.8 + 0.9 ) * aSway * 0.025; }`);
  };
  mat.customProgramCacheKey = () => wind ? 'envGrassWind' : 'envGrass';
  const mesh = new Mesh(geo, mat); mesh.name = 'env_grass'; mesh.frustumCulled = true;
  return { mesh, tufts, flowers, update(time: number) { uTime.value = time; }, dispose() { geo.dispose(); mat.dispose(); } };
}

/** E7: per-instance tint (multiplies the baked vertex colour): value 0.86..1.06, hue toward olive or blue-green. Deterministic per index. */
export function instanceTint(kind: 'tree' | 'rock' | 'bush', i: number, out: Color): Color {
  const r = prng(i * 2654435761 + (kind === 'tree' ? 1 : kind === 'rock' ? 2 : 3));
  const v = kind === 'tree' ? 0.86 + r() * 0.2 : 0.9 + r() * 0.16, h = r();
  if (kind === 'rock') return out.setRGB(v * (0.98 + h * 0.06), v * (0.98 + h * 0.03), v * (0.9 + (1 - h) * 0.06)); // a little warmer than the kit's lavender grey
  // trees/bushes: some warmer olive, some cooler blue-green, most in between
  return h < 0.33 ? out.setRGB(v * 1.06, v * 1.0, v * 0.84) : h < 0.66 ? out.setRGB(v * 0.9, v * 0.97, v * 1.05) : out.setRGB(v, v, v);
}

/** Horizontal radius and height of a prop at scale 1 (from its bounding box; cached). */
const dims = new Map<string, { r: number; h: number }>();
export function propDims(name: string, parts: { geometry: BufferGeometry; matrix: Matrix4 }[]) {
  let d = dims.get(name); if (d) return d;
  let r = 0, h = 0;
  for (const p of parts) { const g = p.geometry; g.computeBoundingBox(); const bb = g.boundingBox!.clone().applyMatrix4(p.matrix); r = Math.max(r, bb.max.x, -bb.min.x, bb.max.z, -bb.min.z); h = Math.max(h, bb.max.y); }
  d = { r: r || 0.5, h: h || 1 }; dims.set(name, d); return d;
}

