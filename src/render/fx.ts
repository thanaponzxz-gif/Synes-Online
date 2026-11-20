// Lightweight pooled effects (one InstancedMesh for particles; a few reusable rings/arcs). Render-only, never touches the sim.
import {
  InstancedMesh, OctahedronGeometry, MeshBasicMaterial, Object3D, Color, Scene, Mesh, RingGeometry, DoubleSide,
  AdditiveBlending, Group, ShaderMaterial, PlaneGeometry, Vector3, CircleGeometry, CanvasTexture,
} from 'three';

interface P { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; s: number; g: number; }
export class Particles {
  mesh: InstancedMesh; private ps: P[] = []; private dummy = new Object3D(); private n: number;
  constructor(scene: Scene, n = 220) {
    this.n = n;
    this.mesh = new InstancedMesh(new OctahedronGeometry(0.09, 0), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false }), n);
    this.mesh.frustumCulled = false; this.mesh.count = 0;
    this.mesh.setColorAt(0, new Color(1, 1, 1));
    scene.add(this.mesh);
  }
  burst(x: number, y: number, z: number, color: number, count: number, speed = 3, up = 2.5, life = 0.6, size = 1, gravity = 7) {
    const c = new Color(color);
    for (let i = 0; i < count; i++) {
      if (this.ps.length >= this.n) this.ps.shift();
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.6);
      this.ps.push({ x, y, z, vx: Math.cos(a) * s, vy: up * (0.5 + Math.random()), vz: Math.sin(a) * s, life: life * (0.6 + Math.random() * 0.4), max: life, s: size * (0.6 + Math.random() * 0.8), g: gravity });
      this.mesh.setColorAt(this.ps.length - 1, c);
      (this.ps[this.ps.length - 1] as any).c = c;
    }
  }
  update(dt: number) {
    this.ps = this.ps.filter((p) => (p.life -= dt) > 0);
    for (let i = 0; i < this.ps.length; i++) {
      const p = this.ps[i];
      p.vy -= p.g * dt; p.x += p.vx * dt; p.y = Math.max(0.05, p.y + p.vy * dt); p.z += p.vz * dt;
      const k = p.life / p.max;
      this.dummy.position.set(p.x, p.y, p.z); this.dummy.scale.setScalar(p.s * (0.3 + 0.7 * k)); this.dummy.rotation.set(p.life * 6, p.life * 4, 0);
      this.dummy.updateMatrix(); this.mesh.setMatrixAt(i, this.dummy.matrix);
      this.mesh.setColorAt(i, (p as any).c);
    }
    this.mesh.count = this.ps.length;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

/** Expanding ring / swing arc pool. */
export class Rings {
  private items: { m: Mesh; t: number; dur: number; from: number; to: number; op: number }[] = [];
  private scene: Scene;
  constructor(scene: Scene) { this.scene = scene; }
  ring(x: number, z: number, from: number, to: number, color: number, dur = 0.35, op = 0.85, y = 0.08) {
    const m = new Mesh(new RingGeometry(0.85, 1, 40), new MeshBasicMaterial({ color, transparent: true, opacity: op, side: DoubleSide, depthWrite: false, blending: AdditiveBlending }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.scale.setScalar(from); m.renderOrder = 5;
    this.scene.add(m); this.items.push({ m, t: 0, dur, from, to, op });
  }
  arc(x: number, z: number, yaw: number, radius: number, color: number, step: number) {
    const span = step === 2 ? Math.PI * 1.1 : Math.PI * 0.8;
    const g = new RingGeometry(radius * 0.45, radius, 20, 1, Math.PI / 2 - span / 2, span);
    const m = new Mesh(g, new MeshBasicMaterial({ color, transparent: true, opacity: 0.4, side: DoubleSide, depthWrite: false, blending: AdditiveBlending }));
    m.rotation.set(-Math.PI / 2, 0, 0);
    const holder = new Group(); holder.position.set(x, 0.55, z); holder.rotation.y = yaw; holder.add(m);
    // arc is centred on +Y in ring space → −Z after the X rotation; caller passes yaw = atan2(-fx, -fz)
    this.scene.add(holder);
    this.items.push({ m: holder as unknown as Mesh, t: 0, dur: 0.16, from: 1, to: 1.08, op: 0.4 });
  }
  update(dt: number) {
    this.items = this.items.filter((it) => {
      it.t += dt; const k = Math.min(1, it.t / it.dur);
      it.m.scale.setScalar(it.from + (it.to - it.from) * k);
      it.m.traverse((o) => { const mm = (o as Mesh).material as MeshBasicMaterial; if (mm) mm.opacity = it.op * (1 - k); });
      if (k >= 1) { this.scene.remove(it.m); it.m.traverse((o) => { const mm = o as Mesh; if (mm.isMesh) { mm.geometry.dispose(); (mm.material as MeshBasicMaterial).dispose(); } }); return false; }
      return true;
    });
  }
}

/** Telegraph material: fills with progress, bright pulsing edge. Shape: 0 circle, 1 cone, 2 line. */
export function telegraphMaterial(color: number, shape: number, cos = 0.5): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, side: DoubleSide,
    uniforms: { uColor: { value: new Color(color) }, uProg: { value: 0 }, uShape: { value: shape }, uCos: { value: cos }, uTime: { value: 0 }, uAlpha: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `
      uniform vec3 uColor; uniform float uProg; uniform float uShape; uniform float uCos; uniform float uTime; uniform float uAlpha; varying vec2 vUv;
      void main(){
        float pulse = 0.75 + 0.25 * sin(uTime * (8.0 + 22.0 * uProg));
        float a = 0.0; float edge = 0.0; float fill = 0.0;
        if (uShape < 0.5) {
          vec2 p = vUv * 2.0 - 1.0; float d = length(p); if (d > 1.0) discard;
          edge = smoothstep(0.86, 0.95, d); fill = step(d, uProg);
        } else if (uShape < 1.5) {
          vec2 p = vUv * 2.0 - 1.0; float d = length(p); if (d > 1.0) discard;
          float c = d > 0.001 ? p.y / d : 1.0; if (c < uCos && d > 0.12) discard;
          float ang = clamp((c - uCos) / max(0.0001, 1.0 - uCos), 0.0, 1.0);
          edge = max(smoothstep(0.88, 0.96, d), 1.0 - smoothstep(0.0, 0.07, ang)); fill = step(d, uProg);
        } else {
          float sx = abs(vUv.x - 0.5) * 2.0;
          edge = max(smoothstep(0.78, 0.92, sx), max(1.0 - smoothstep(0.0, 0.03, vUv.y), smoothstep(0.97, 1.0, vUv.y)));
          fill = step(vUv.y, uProg);
          float chev = step(0.5, fract(vUv.y * 10.0 - uTime * 2.0 + sx * 0.5)) * 0.12; fill = max(fill, chev);
        }
        vec3 col = mix(uColor, vec3(1.0, 0.98, 0.9), edge * 0.55);
        a = max(edge * 0.95 * pulse, fill * 0.5 + 0.14);
        gl_FragColor = vec4(col, a * uAlpha);
      }`,
  });
}

/** Soft round blob shadow texture (shared). */
let blobTex: CanvasTexture | null = null;
export function blobShadow(radius: number): Mesh {
  if (!blobTex) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d')!; const gr = g.createRadialGradient(32, 32, 4, 32, 32, 32);
    gr.addColorStop(0, 'rgba(20,30,40,0.55)'); gr.addColorStop(1, 'rgba(20,30,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    blobTex = new CanvasTexture(c);
  }
  const m = new Mesh(new CircleGeometry(radius * 1.3, 16), new MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.03; m.renderOrder = 1;
  return m;
}

export const tmpV = new Vector3();
export { PlaneGeometry };
