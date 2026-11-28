// TEST DATA ONLY: a small code-built rig for the cloth solver (empty bones, no mesh): Seyrin's bone names (DES-007 §6) with the
// scarf hanging behind the back from the chest, the sash behind the hips and the tassels at the hip sides, all outside the body
// proxies of DES-007 §5.3. It is not Codex's rig and says nothing about the real rest shape or lengths.
import * as THREE from 'three';
import type { ClothSolver } from '../src/seyrin/cloth.ts';

export function clothRig() {
  const nodes = new Map<string, THREE.Object3D>();
  const add = (name: string, parent: string | null, p: [number, number, number], bone = true) => {
    const o = bone ? new THREE.Bone() : new THREE.Object3D(); o.name = name; o.position.set(...p);
    if (parent) nodes.get(parent)!.add(o); nodes.set(name, o); return o;
  };
  const root = add('root', null, [0, 0, 0]);
  add('pelvis', 'root', [0, 0.9, 0]); add('spine_01', 'pelvis', [0, 0.15, 0]); add('chest', 'spine_01', [0, 0.2, 0]);
  add('neck', 'chest', [0, 0.12, 0]); add('head', 'neck', [0, 0.1, 0]);
  for (const [s, k] of [['l', 1], ['r', -1]] as const) { add(`thigh_${s}`, 'pelvis', [0.1 * k, -0.05, 0]); add(`shin_${s}`, `thigh_${s}`, [0, -0.42, 0]); }
  const chain = (anchor: string, parent: string, at: [number, number, number], bones: string[], step: number) => {
    add(anchor, parent, at, false);
    bones.forEach((b, i) => add(b, i ? bones[i - 1] : anchor, i ? [0, -step, 0] : [0, -0.02, 0]));
  };
  const names = (n: string, s: string, c: number) => Array.from({ length: c }, (_, i) => `${n}_${s}_0${i + 1}`);
  chain('anchor_scarf_l', 'chest', [0.08, 0.1, -0.27], names('scarf', 'l', 4), 0.145);
  chain('anchor_scarf_r', 'chest', [-0.08, 0.1, -0.27], names('scarf', 'r', 4), 0.125);
  chain('anchor_sash_l', 'pelvis', [0.12, 0, -0.27], names('sash', 'l', 3), 0.09);
  chain('anchor_sash_r', 'pelvis', [-0.12, 0, -0.27], names('sash', 'r', 3), 0.07);
  chain('anchor_tassel_l', 'pelvis', [0.3, 0, 0], names('tassel', 'l', 2), 0.08);
  chain('anchor_tassel_r', 'pelvis', [-0.3, 0, 0], names('tassel', 'r', 2), 0.06);
  root.updateMatrixWorld(true);
  return { root, get: (n: string) => nodes.get(n)! };
}

export type Motion = (t: number) => { x?: number; y?: number; z?: number; yaw?: number };
/** move the rig by `m` for `seconds` at `fps` from time t0; calls `each` after every frame; returns the end time */
export function runCloth(s: ClothSolver, root: THREE.Object3D, m: Motion, seconds: number, fps = 60, t0 = 0, each?: (t: number) => void, opts?: { down?: boolean; groundY?: number }) {
  const dt = 1 / fps, n = Math.round(seconds * fps);
  for (let i = 1; i <= n; i++) {
    const t = t0 + i * dt, p = m(t);
    root.position.set(p.x ?? 0, p.y ?? 0, p.z ?? 0); root.rotation.set(0, p.yaw ?? 0, 0);
    s.update(dt, opts); each?.(t);
  }
  return t0 + n * dt;
}
export const maxBend = (s: ClothSolver) => Math.max(...s.angles('state'));
