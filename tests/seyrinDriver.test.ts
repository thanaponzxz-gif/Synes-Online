// DES-007 §8.3: the plan reaches the skeleton through the instance's own AnimationMixer: the upper and the lower body can play
// different clips (the combo over walking legs), hit_add is additive on chest/neck/head only, root and cloth bones are never
// written by a clip (root motion 0; the cloth solver owns the cloth), and a missing clip is reported, never replaced (DES-009 §3.2).
// TEST DATA ONLY: the code-generated fixture GLB (tests/seyrinFixture.ts) - the fixture's chest leans and its pelvis lifts in attack_03.
import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';
import { loadHero } from '../src/seyrin/loader.ts';
import { UPPER_BONES, LOWER_BONES, ADDITIVE_BONES } from '../src/seyrin/mixerDriver.ts';
import { BODY_BONES, CLOTH_BONES } from '../src/seyrin/spec.ts';
import type { AnimPlan } from '../src/seyrin/animPlan.ts';
import { buildFixtureGlb, buildFixtureManifest } from './seyrinFixture.ts';

beforeAll(() => {
  const g = globalThis as unknown as Record<string, unknown>;
  g.self ??= globalThis;
  g.createImageBitmap = async (blob: Blob) => {
    const b = new Uint8Array(await blob.arrayBuffer());
    const dv = new DataView(b.buffer);
    return { width: dv.getUint32(16), height: dv.getUint32(20), close() {} };
  };
});

async function instance(stage: 'preview' | 'full' = 'full') {
  const glb = buildFixtureGlb({ stage });
  const asset = await loadHero(glb.buffer as ArrayBuffer, JSON.stringify(await buildFixtureManifest(glb, stage)));
  return asset.createInstance();
}
const plan = (upper: [string, number][], lower: [string, number][] = upper, o: Partial<AnimPlan> = {}): AnimPlan => ({
  upper: upper.map(([clip, tick]) => ({ clip, time: tick / 30, weight: 1 / upper.length })),
  lower: lower.map(([clip, tick]) => ({ clip, time: tick / 30, weight: 1 / lower.length })),
  additive: [], pelvisLift: 0, ...o,
});
const chestAngle = (root: THREE.Object3D) => 2 * Math.asin(root.getObjectByName('chest')!.quaternion.x);
const pelvisY = (root: THREE.Object3D) => root.getObjectByName('pelvis')!.position.y;
/** the fixture's chest lean for a clip at a tick, and its pelvis height */
const lean = (name: string, ticks: number, k: number) => (0.1 + (name.length % 5) * 0.05) * Math.sin((Math.PI * k) / ticks);
const lift = (k: number) => { const q = Math.min(1, Math.max(0, (k - 3) / 6)); return 0.8 + 0.12 * 4 * q * (1 - q); };

describe('bone groups', () => {
  it('upper + lower = the 26 body bones without root; cloth bones are in neither; hit_add touches chest/neck/head only', () => {
    expect([...UPPER_BONES, ...LOWER_BONES].sort()).toEqual(BODY_BONES.filter((b) => b !== 'root').sort());
    expect(UPPER_BONES.filter((b) => LOWER_BONES.includes(b))).toEqual([]);
    for (const c of CLOTH_BONES) { expect(UPPER_BONES).not.toContain(c); expect(LOWER_BONES).not.toContain(c); }
    expect([...ADDITIVE_BONES].sort()).toEqual(['chest', 'head', 'neck']);
  });
});

describe('the driver on a loaded instance', () => {
  it('plays a clip on the upper body and another on the legs at the plan times', async () => {
    const h = await instance();
    h.animate(plan([['walk', 4]], [['attack_03', 6]]));
    expect(chestAngle(h.root)).toBeCloseTo(lean('walk', 24, 4), 5);
    expect(pelvisY(h.root)).toBeCloseTo(lift(6), 5);
    h.animate(plan([['attack_03', 6]], [['walk', 4]]));
    expect(chestAngle(h.root)).toBeCloseTo(lean('attack_03', 18, 6), 5);
    expect(pelvisY(h.root)).toBeCloseTo(0.8, 5);
    h.dispose();
  });
  it('blends by weight (two clips at 0.5 each sit between them)', async () => {
    const h = await instance();
    h.animate(plan([['idle', 12], ['attack_01', 5]]));
    const a = lean('idle', 48, 12), b = lean('attack_01', 11, 5);
    expect(chestAngle(h.root)).toBeCloseTo((a + b) / 2, 3);
    h.dispose();
  });
  it('never writes root (root motion 0) and adds pelvisLift once, not frame after frame', async () => {
    const h = await instance();
    const root = h.root.getObjectByName('root')!, rp = root.position.clone(), rq = root.quaternion.clone();
    const p = plan([['idle', 0]], [['idle', 0]], { pelvisLift: 0.05 });
    h.animate(p); h.animate(p); h.animate(p);
    expect(pelvisY(h.root)).toBeCloseTo(0.85, 6);
    h.animate({ ...p, pelvisLift: 0 });
    expect(pelvisY(h.root)).toBeCloseTo(0.8, 6);
    expect(root.position.equals(rp)).toBe(true); expect(root.quaternion.equals(rq)).toBe(true);
    h.dispose();
  });
  it('hit_add adds on top of the base pose (chest) and leaves the legs alone', async () => {
    const h = await instance();
    const base = plan([['idle', 10]]);
    h.animate(base); const c0 = chestAngle(h.root), y0 = pelvisY(h.root);
    h.animate({ ...base, additive: [{ clip: 'hit_add', time: 3 / 30, weight: 1 }] });
    expect(chestAngle(h.root)).toBeCloseTo(c0 + lean('hit_add', 6, 3), 4); // additive against the clip's first frame (lean 0)
    expect(pelvisY(h.root)).toBeCloseTo(y0, 6);
    h.dispose();
  });
  it('a clip the file does not have is reported and not replaced by another one', async () => {
    const h = await instance('preview'); // P1: six clips only
    const missing = h.animate(plan([['walk', 3]], [['idle', 3]]));
    expect(missing).toEqual(['walk']);
    h.dispose();
  });
});
