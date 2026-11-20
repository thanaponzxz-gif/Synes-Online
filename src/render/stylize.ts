// Visual pass (proof of concept): cheap, mobile-friendly stylization.
// - toon ramp shading (same cost class as Lambert)
// - rim light + inverted-hull outline on characters only (≈ +1 draw call per character part)
// - painted ground detail, ambient-occlusion blobs under scenery, instanced grass tufts, light motes
// Toggle with ?style=0 for before/after comparisons.
import {
  MeshToonMaterial, DataTexture, RedFormat, NearestFilter, Color, Mesh, BackSide, MeshBasicMaterial,
  Points, BufferGeometry, Float32BufferAttribute, PointsMaterial, AdditiveBlending, CanvasTexture,
  InstancedMesh, ConeGeometry, Matrix4, Vector3, Quaternion, Euler, type Material, type Object3D, type Scene,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const STYLE = { on: true };

let ramp: DataTexture | null = null;
export function toonRamp(): DataTexture {
  if (!ramp) {
    ramp = new DataTexture(new Uint8Array([120, 190, 255]), 3, 1, RedFormat);
    ramp.minFilter = ramp.magFilter = NearestFilter; ramp.generateMipmaps = false; ramp.needsUpdate = true;
  }
  return ramp;
}
export function toonMaterial(color: Color | number, emissive: Color | number = 0, emissiveIntensity = 0): MeshToonMaterial {
  return new MeshToonMaterial({ color, emissive, emissiveIntensity, gradientMap: toonRamp() });
}

const outlineMat = new MeshBasicMaterial({ color: 0x24183a, side: BackSide });
outlineMat.onBeforeCompile = (sh) => {
  sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normal * 0.028;');
};

/** Rim light + outline for one character model (materials cloned so scenery is unaffected). */
export function stylizeCharacter(model: Object3D, rim: number, outline: boolean) {
  const meshes: Mesh[] = [];
  model.traverse((o) => { const m = o as Mesh; if (m.isMesh && !(m.material as Material).transparent) meshes.push(m); });
  for (const m of meshes) {
    const mat = (m.material as Material).clone();
    const rimColor = new Color(rim);
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uRim = { value: rimColor };
      sh.fragmentShader = 'uniform vec3 uRim;\n' + sh.fragmentShader.replace('#include <opaque_fragment>',
        'float rimF = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);\noutgoingLight += uRim * pow(rimF, 2.6) * 0.55;\n#include <opaque_fragment>');
    };
    mat.customProgramCacheKey = () => 'rim';
    m.material = mat;
    if (outline) { const o = new Mesh(m.geometry, outlineMat); o.castShadow = false; m.add(o); }
  }
}

/** Painted ground detail drawn onto the ground canvas (before the path layer). */
export function paintGrass(g: CanvasRenderingContext2D, W: number, H: number, rnd: () => number, a: number, b: number) {
  const mix = (c: number, d: number) => `rgb(${Math.min(255, Math.max(0, ((c >> 16) & 255) + d))},${Math.min(255, Math.max(0, ((c >> 8) & 255) + d))},${Math.min(255, Math.max(0, (c & 255) + d))})`;
  for (let i = 0; i < 70; i++) { // large soft patches
    const x = rnd() * W, y = rnd() * H, r = (0.04 + rnd() * 0.12) * W;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, mix(rnd() < 0.5 ? a : b, rnd() < 0.5 ? 18 : -16)); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.35; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.globalAlpha = 1; g.lineCap = 'round';
  for (let i = 0; i < W * H / 40; i++) { // grass strokes
    const x = rnd() * W, y = rnd() * H, l = 2 + rnd() * 3;
    g.strokeStyle = rnd() < 0.55 ? 'rgba(255,255,220,0.10)' : 'rgba(10,50,20,0.12)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 2, y - l); g.stroke();
  }
}
/** Pebbles + inner edge on the path (call after the path layer). */
export function paintPath(g: CanvasRenderingContext2D, W: number, H: number, rnd: () => number, inside: (u: number, v: number) => boolean) {
  for (let i = 0; i < W * H / 120; i++) {
    const x = rnd() * W, y = rnd() * H;
    if (!inside(x, y)) continue;
    g.fillStyle = rnd() < 0.5 ? 'rgba(120,95,70,0.18)' : 'rgba(255,245,225,0.22)';
    g.beginPath(); g.ellipse(x, y, 1 + rnd() * 2.2, 0.8 + rnd() * 1.4, rnd() * 3, 0, 7); g.fill();
  }
}
/** Soft contact shadows under scenery (fake AO), drawn after props are placed. */
export function paintAO(g: CanvasRenderingContext2D, pts: { u: number; v: number; r: number }[]) {
  for (const p of pts) {
    const gr = g.createRadialGradient(p.u, p.v, 0, p.u, p.v, p.r);
    gr.addColorStop(0, 'rgba(20,40,30,0.38)'); gr.addColorStop(1, 'rgba(20,40,30,0)');
    g.fillStyle = gr; g.fillRect(p.u - p.r, p.v - p.r, p.r * 2, p.r * 2);
  }
}

/** One instanced draw call of small grass tufts. */
export function grassTufts(spots: { x: number; z: number; s: number; rot: number }[], color: number): InstancedMesh {
  const blades = [[0, 0, 0], [0.07, 0.03, 0.35], [-0.06, -0.04, -0.4]].map(([x, z, tilt]) => {
    const c = new ConeGeometry(0.035, 0.32, 3); c.translate(0, 0.16, 0); c.rotateZ(tilt); c.translate(x, 0, z); return c;
  });
  const geo = mergeGeometries(blades)!;
  const im = new InstancedMesh(geo, toonMaterial(color), spots.length);
  spots.forEach((p, i) => im.setMatrixAt(i, new Matrix4().compose(new Vector3(p.x, 0, p.z), new Quaternion().setFromEuler(new Euler(0, p.rot, 0)), new Vector3(p.s, p.s, p.s))));
  im.computeBoundingSphere();
  return im;
}

/** Drifting light motes around the camera target (one draw call). */
export class Motes {
  points: Points; private pos: Float32Array; private seed: Float32Array; private n: number;
  constructor(scene: Scene, n = 140, colors = [0x5cf2e6, 0xffe9a8, 0xff9ec7]) {
    this.n = n; this.pos = new Float32Array(n * 3); this.seed = new Float32Array(n);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      this.pos[i * 3] = (Math.random() - 0.5) * 26; this.pos[i * 3 + 1] = 0.4 + Math.random() * 3; this.pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      this.seed[i] = Math.random() * 100; const c = new Color(colors[i % colors.length]); col.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(this.pos, 3)); geo.setAttribute('color', new Float32BufferAttribute(col, 3));
    const cv = document.createElement('canvas'); cv.width = cv.height = 32; const g = cv.getContext('2d')!;
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    this.points = new Points(geo, new PointsMaterial({ size: 0.22, map: new CanvasTexture(cv), vertexColors: true, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0.85 }));
    this.points.frustumCulled = false; scene.add(this.points);
  }
  update(t: number, cx: number, cz: number) {
    const p = this.pos;
    for (let i = 0; i < this.n; i++) {
      const s = this.seed[i];
      let x = p[i * 3] + Math.sin(t * 0.5 + s) * 0.004, z = p[i * 3 + 2] + Math.cos(t * 0.4 + s) * 0.004;
      if (x - cx > 13) x -= 26; else if (x - cx < -13) x += 26;
      if (z - cz > 10) z -= 20; else if (z - cz < -10) z += 20;
      p[i * 3] = x; p[i * 3 + 2] = z; p[i * 3 + 1] = 0.6 + ((Math.sin(t * 0.7 + s) + 1) * 1.3);
    }
    (this.points.geometry.getAttribute('position') as Float32BufferAttribute).needsUpdate = true;
  }
}
