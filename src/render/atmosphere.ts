// DES-004 step 1: arena light and atmosphere. Render-only (never touches the sim).
// The boss arena gets a lavender haze, a violet-blue sky light over a muted-green bounce, and a cream sun from the far-left
// so characters get a lit back edge. Halos behind the big crystals and a few warm light shafts are cheap additive meshes
// (one draw call each, falloff computed in the shader, no texture) instead of post-processing.
// Warning colours #FF7A1A / #FF3355 are never used here: the shafts are pale gold (<= #FFE0A0), the halos lumen/violet.
import {
  BufferGeometry, Float32BufferAttribute, Mesh, ShaderMaterial, AdditiveBlending, Color, DoubleSide, Vector3,
} from 'three';
import { arenaGlowAnchors, SHRINE_Z } from './arena.ts';

export const ARENA_ATMOS = {
  fog: 0x8e8fc8, fogNear: 14, fogFar: 52,
  hemiSky: 0xc2c0f2, hemiGround: 0x5e7562, hemiI: 1.8,
  sun: 0xfff1d6, sunI: 2.0,
  /** sun offset from the camera target: up, to the left and beyond the action (camera looks toward −z) */
  sunOffset: new Vector3(-9, 16, -12),
};
export const BASE_SUN_OFFSET = new Vector3(8, 18, 6);
const SHAFT_GOLD = 0xffe0a0;
const LUMEN = 0x5cf2e6, VIOLET = 0xa78bfa;

/** 0 in the meadow, 1 inside the arena: eased over the stretch between the spring and the arena gate. */
export function arenaWeight(z: number) {
  const k = Math.max(0, Math.min(1, (-52 - z) / 10));
  return k * k * (3 - 2 * k);
}

/** Camera-facing elliptical halos (billboarded in the vertex shader). */
export function makeGlowHalos(arena: { x: number; z: number; r: number }) {
  const anchors = arenaGlowAnchors(arena);
  const pos: number[] = [], uv: number[] = [], center: number[] = [], size: number[] = [], color: number[] = [], index: number[] = [];
  const c = new Color();
  anchors.forEach((a, i) => {
    c.set(a.tint ? VIOLET : LUMEN);
    const w = a.h * 0.62, h = a.h * 1.15;
    for (const [qx, qy] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) {
      pos.push(qx, qy, 0); uv.push(qx + 0.5, qy + 0.5); center.push(a.x, a.y, a.z); size.push(w, h); color.push(c.r, c.g, c.b);
    }
    const o = i * 4; index.push(o, o + 1, o + 2, o, o + 2, o + 3);
  });
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geo.setAttribute('aCenter', new Float32BufferAttribute(center, 3));
  geo.setAttribute('aSize', new Float32BufferAttribute(size, 2));
  geo.setAttribute('aColor', new Float32BufferAttribute(color, 3));
  geo.setIndex(index);
  const mat = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, fog: false,
    uniforms: { uI: { value: 0 }, uTime: { value: 0 } },
    vertexShader: `
      attribute vec3 aCenter; attribute vec2 aSize; attribute vec3 aColor; varying vec2 vUv; varying vec3 vColor; varying float vSeed;
      void main(){
        vUv = uv; vColor = aColor; vSeed = aCenter.x * 0.37 + aCenter.z * 0.21;
        vec4 mv = modelViewMatrix * vec4(aCenter, 1.0);
        mv.xy += position.xy * aSize;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uI; uniform float uTime; varying vec2 vUv; varying vec3 vColor; varying float vSeed;
      void main(){
        float d = length(vUv * 2.0 - 1.0); if (d > 1.0) discard;
        float f = (1.0 - d); f = f * f * (0.55 + 0.45 * f);
        float breathe = 0.88 + 0.12 * sin(uTime * 1.3 + vSeed);
        gl_FragColor = vec4(vColor * f * uI * breathe, 1.0);
      }`,
  });
  const mesh = new Mesh(geo, mat);
  mesh.frustumCulled = false; // vertices are moved in the shader; the CPU bounding sphere would be wrong
  mesh.renderOrder = 2; // before telegraphs (10) so a warning always paints on top
  mesh.name = 'arena_glow';
  return { mesh, mat };
}

/** A few slanted warm light shafts falling from the upper left toward the back of the arena (behind the boss line). */
export function makeLightShafts(arena: { x: number; z: number }) {
  // [x offset, z offset, width, length, lean (rad, top toward −x)]
  const shafts = [[-3.5, SHRINE_Z + 4.5, 2.6, 17, 0.42], [0.6, SHRINE_Z + 6.5, 1.6, 15, 0.38], [3.8, SHRINE_Z + 3.2, 2.1, 16, 0.45]];
  const pos: number[] = [], uv: number[] = [], index: number[] = [];
  shafts.forEach(([ox, oz, w, len, lean], i) => {
    // bottom end sits on the ground; the shaft leans so its top is up-left (toward the sun)
    const bx = arena.x + ox, bz = arena.z + oz;
    const dx = -Math.sin(lean) * len, dy = Math.cos(lean) * len;
    const hw = w / 2, nx = Math.cos(lean) * hw, ny = Math.sin(lean) * hw;
    const quad = [[bx - nx, -ny, bz, 0, 0], [bx + nx, ny, bz, 1, 0], [bx + nx + dx, ny + dy, bz, 1, 1], [bx - nx + dx, -ny + dy, bz, 0, 1]];
    for (const [x, y, z, u, v] of quad) { pos.push(x, y, z); uv.push(u, v); }
    const o = i * 4; index.push(o, o + 1, o + 2, o, o + 2, o + 3);
  });
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeBoundingSphere();
  const mat = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, fog: false, side: DoubleSide,
    uniforms: { uI: { value: 0 }, uColor: { value: new Color(SHAFT_GOLD) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `
      uniform float uI; uniform vec3 uColor; varying vec2 vUv;
      void main(){
        float across = 1.0 - abs(vUv.x * 2.0 - 1.0); across = across * across;
        float along = smoothstep(0.0, 0.35, vUv.y) * (1.0 - smoothstep(0.6, 1.0, vUv.y));
        gl_FragColor = vec4(uColor * across * along * uI, 1.0);
      }`,
  });
  const mesh = new Mesh(geo, mat);
  mesh.renderOrder = 2;
  mesh.name = 'arena_shafts';
  return { mesh, mat };
}
