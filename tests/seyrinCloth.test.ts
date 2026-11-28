// DES-007 §5: Seyrin's scarf / sash / tassels as short spring-bone chains on the client (18 bones, 6 chains): 2-axis bending
// θ'' = -kθ - cθ' + τ/I about the rest pose, a_eff = gravityMul*g - inertiaMul*a_anchor, cone and twist limits, body proxies,
// fixed steps (Medium 1/60 x4, Low 1/30 x2 + interpolation), resets. Picture only: no hitbox, no sim, no input log.
// These tests check the solver against the design. The "looks natural" checks of §5.3 (calm within 1.0 s, no snap over 10°) are
// for the real rig and rest shape; on the test rig they are measured by tools/qa/seyrin-cloth.ts and reported, not passed here.
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ClothSolver, CLOTH_CHAINS, CLOTH_BODY, CLOTH_STEP } from '../src/seyrin/cloth.ts';
import { CLOTH_BONES } from '../src/seyrin/spec.ts';
import { buildFixtureGlb, buildFixtureManifest } from './seyrinFixture.ts';
import { loadHero } from '../src/seyrin/loader.ts';
import { clothRig as rig, runCloth as run, maxBend as maxAngle, type Motion } from './clothRig.ts';

const DEG = Math.PI / 180;
const local = (root: THREE.Object3D, w: THREE.Vector3) => root.worldToLocal(w.clone());

describe('the design numbers (DES-007 §5.2)', () => {
  it('6 chains, 18 bones, c = 2ζ√k, cones and twist limits, gravity / inertia multipliers', () => {
    expect(CLOTH_CHAINS.flatMap((c) => c.bones).sort()).toEqual([...CLOTH_BONES].sort());
    const zeta: Record<string, number> = { scarf: 0.75, sash: 0.85, tassel: 0.9 };
    for (const c of CLOTH_CHAINS) {
      const g = c.name.split('_')[0];
      c.k.forEach((k, i) => expect(c.c[i], `${c.name} c${i}`).toBeCloseTo(2 * zeta[g] * Math.sqrt(k), 1));
      expect(c.k.length).toBe(c.bones.length); expect(c.coneDeg.length).toBe(c.bones.length);
    }
    const by = Object.fromEntries(CLOTH_CHAINS.map((c) => [c.name, c]));
    expect(by.scarf_l.lengthM).toBe(0.6); expect(by.scarf_r.lengthM).toBe(0.52); expect(by.sash_l.lengthM).toBe(0.28);
    expect(by.sash_r.lengthM).toBe(0.22); expect(by.tassel_l.lengthM).toBe(0.18); expect(by.tassel_r.lengthM).toBe(0.14);
    expect(by.scarf_l.coneDeg).toEqual([20, 30, 40, 50]); expect(by.sash_l.coneDeg).toEqual([12, 20, 28]); expect(by.tassel_l.coneDeg).toEqual([18, 30]);
    expect([by.scarf_l.twistDeg, by.sash_l.twistDeg, by.tassel_l.twistDeg]).toEqual([5, 3, 5]);
    expect([by.scarf_l.gravityMul, by.scarf_l.inertiaMul, by.sash_l.gravityMul, by.sash_l.inertiaMul, by.tassel_l.gravityMul, by.tassel_l.inertiaMul]).toEqual([0.45, 0.45, 0.8, 0.3, 1, 0.25]);
    expect(CLOTH_BODY).toMatchObject({ torsoR: 0.23, headR: 0.28, thighR: 0.1, padM: 0.015, passes: 2, groundDownM: 0.02 });
    expect(CLOTH_STEP).toEqual({ medium: { h: 1 / 60, max: 4, interpolate: false }, low: { h: 1 / 30, max: 2, interpolate: true } });
  });
});

describe('motion (§5.2/§5.3)', () => {
  it('a chain hanging at rest stays at rest (gravity along the bone gives no torque)', () => {
    const { root } = rig(), s = new ClothSolver(root);
    expect(s.ok).toBe(true);
    run(s, root, () => ({}), 2);
    expect(maxAngle(s)).toBeLessThan(1e-9);
  });
  it('accelerating forward swings the cloth back; at a steady speed it hangs again (no air drag in v01: wind = 0)', () => {
    const { root } = rig(), s = new ClothSolver(root);
    const tip = () => local(root, s.tips()[0]).z, rest = tip();
    let t = run(s, root, () => ({}), 0.2);
    t = run(s, root, (u) => ({ z: 0.5 * 10 * (u - 0.2) ** 2 }), 0.3, 60, t); // 10 m/s² for 0.3 s
    expect(tip()).toBeLessThan(rest - 0.02);
    const v = 3, z0 = root.position.z;
    run(s, root, (u) => ({ z: z0 + v * (u - t) }), 1.5, 60, t);
    expect(maxAngle(s)).toBeLessThan(1 * DEG);
  });
  it('after a stop from a run the cloth swings on, then dies down (no lasting oscillation)', () => {
    const { root } = rig(), s = new ClothSolver(root);
    const tStop = run(s, root, (u) => ({ z: 5.2 * u }), 1.0), z1 = root.position.z;
    let lastOver = tStop;
    run(s, root, (u) => { const d = Math.min(u - tStop, 0.1); return { z: z1 + 5.2 * d - 0.5 * 52 * d * d }; }, 3.0, 60, tStop, (u) => { if (maxAngle(s) >= 1 * DEG) lastOver = u; });
    expect(lastOver - tStop).toBeGreaterThan(0.1);
    expect(lastOver - tStop).toBeLessThan(2.0);
  });
  it('turning 90° in 0.1 s: the tips stay behind the back (no flip) and trail the turn', () => {
    const { root } = rig(), s = new ClothSolver(root);
    run(s, root, () => ({}), 0.2);
    run(s, root, (u) => ({ yaw: Math.min(1, Math.max(0, (u - 0.2) / 0.1)) * (Math.PI / 2) }), 1.5, 60, 0.2, () => {
      for (const tp of s.tips().slice(0, 4)) expect(local(root, tp).z).toBeLessThan(0);
    });
    const r2 = rig(), s2 = new ClothSolver(r2.root);
    run(s2, r2.root, () => ({}), 0.2);
    run(s2, r2.root, (u) => ({ yaw: Math.min(1, Math.max(0, (u - 0.2) / 0.2)) * (Math.PI / 2) }), 0.15, 60, 0.2);
    // mid-turn the simulated scarf tip sits at a smaller yaw than the rigid rest pose (it lags the turn)
    const tipL = local(r2.root, s2.tips()[0]);
    expect(Math.atan2(tipL.x, tipL.z)).toBeLessThan(Math.atan2(0.08, -0.27) - 0.5 * DEG);
  });
});

describe('limits and the body (§5.2/§5.3)', () => {
  const shake: Motion = (u) => ({ z: 0.5 * Math.sin(2 * Math.PI * 10 * u), x: 0.3 * Math.sin(2 * Math.PI * 7 * u), yaw: 0.8 * Math.sin(2 * Math.PI * 3 * u) });
  it('violent shaking never bends a joint past its cone, never twists, never stretches a bone', () => {
    const { root, get } = rig(), s = new ClothSolver(root);
    const len0 = CLOTH_CHAINS.map((c) => c.bones.slice(1).map((b) => get(b).position.length()));
    run(s, root, shake, 2, 60, 0, () => {
      const a = s.angles('shown');
      let i = 0;
      for (const c of CLOTH_CHAINS) for (const cone of c.coneDeg) expect(a[i++]).toBeLessThanOrEqual(cone * DEG + 1e-9);
      expect(Math.max(...s.twists())).toBeLessThan(1e-6);
    });
    expect(CLOTH_CHAINS.map((c) => c.bones.slice(1).map((b) => get(b).position.length()))).toEqual(len0);
    const scarf = CLOTH_CHAINS[0], anchor = new THREE.Vector3(); get(scarf.anchor).getWorldPosition(anchor);
    expect(s.tips()[0].distanceTo(anchor)).toBeLessThanOrEqual(scarf.lengthM + 1e-9);
  });
  it('the torso / head / thigh proxies keep the cloth out (every bone mid / tip stays outside the radius, padding kept to 1 mm)', () => {
    const { root } = rig(), s = new ClothSolver(root);
    let worst = Infinity;
    const check = () => { for (const d of s.proxyDistances()) worst = Math.min(worst, d); };
    run(s, root, (u) => ({ z: -0.5 * 30 * u * u }), 0.6, 60, 0, check); // hard backward acceleration: the back cloth swings into the torso
    run(s, root, shake, 2, 60, 0.6, check);
    expect(worst).toBeGreaterThanOrEqual(-1e-3);
    expect(worst).toBeLessThan(0.05); // the proxies were actually reached
  });
  it('when down, a ground plane 0.02 m up keeps the scarf above it; standing, there is none', () => {
    // (the sash could not clear it here within its 12° root cone: reported to team A, DES-009 §10.8)
    const { root } = rig(), s = new ClothSolver(root);
    const low = (x: ClothSolver) => Math.min(...x.points().filter((p) => p.chain < 2).map((p) => p.y));
    run(s, root, () => ({ y: -0.78 }), 0.5, 60, 0, undefined, { down: true, groundY: 0 });
    expect(low(s)).toBeGreaterThanOrEqual(0.02 - 1e-9);
    const b = rig(), s2 = new ClothSolver(b.root);
    run(s2, b.root, () => ({ y: -0.78 }), 0.5);
    expect(low(s2)).toBeLessThan(0);
  });
});

describe('time steps and resets (§5.3)', () => {
  const m: Motion = (u) => ({ z: 0.4 * Math.sin(2 * Math.PI * 1.3 * u), yaw: 0.5 * Math.sin(2 * Math.PI * 0.7 * u) });
  /** reset on a 1/60 s frame, then run at `fps`: the fixed steps of every rate land on the same times */
  const at = (fps: number) => { const r = rig(), s = new ClothSolver(r.root); const p = m(1 / 60); r.root.position.z = p.z!; r.root.rotation.y = p.yaw!; s.update(1 / 60); run(s, r.root, m, 59 / 60, fps, 1 / 60); return s; };
  it('Medium: fixed 1/60 s steps (at most 4 a frame); stiffness is never scaled by the frame rate', () => {
    const a = at(60), b = at(120), c = at(144);
    expect(a.stats().substeps).toBe(1);
    const da = a.angles('state'), db = b.angles('state'), dc = c.angles('state');
    da.forEach((x, i) => expect(Math.abs(x - db[i]), `120 FPS bone ${i}`).toBeLessThan(1e-9)); // same step times: the same state
    da.forEach((x, i) => expect(Math.abs(x - dc[i]), `144 FPS bone ${i}`).toBeLessThan(2 * DEG)); // frames between the steps: only the sampled input differs (1.2° measured)
    a.update(1 / 30); expect(a.stats().substeps).toBe(2);
  });
  it('Low: 1/30 s steps (at most 2), the pose shown is interpolated between the last two states', () => {
    const { root } = rig(), s = new ClothSolver(root, 'low');
    run(s, root, (u) => ({ z: 0.5 * 10 * u * u }), 0.5, 30);
    root.position.z += 0.05; s.update(1 / 60); // half a step: no new state, the view is halfway
    expect(s.stats().substeps).toBe(0);
    const prev = s.angles('prev'), cur = s.angles('state'), shown = s.angles('shown');
    shown.forEach((x, i) => expect(x).toBeCloseTo((prev[i] + cur[i]) / 2, 9));
  });
  it('a long frame (> 0.15 s), a teleport (> 0.75 m) or a frame that would need more steps than allowed resets to rest and blends in over 0.15 s', () => {
    const { root, get } = rig(), s = new ClothSolver(root);
    const rest = CLOTH_CHAINS.flatMap((c) => c.bones.map((b) => get(b).quaternion.clone()));
    const atRest = () => CLOTH_CHAINS.flatMap((c) => c.bones).every((b, i) => get(b).quaternion.angleTo(rest[i]) < 1e-12);
    run(s, root, (u) => ({ z: 0.5 * 10 * u * u }), 0.3);
    expect(atRest()).toBe(false);
    s.update(0.2); expect(s.stats().resets).toBe(1); expect(atRest()).toBe(true);
    const z0 = root.position.z;
    run(s, root, (u) => ({ z: z0 + 0.5 * 10 * u * u }), 0.3);
    expect(s.stats().resets).toBe(0); expect(atRest()).toBe(false);
    root.position.z += 1; s.update(1 / 60); expect(s.stats().resets).toBe(1); expect(atRest()).toBe(true);
    s.update(0.1); expect(s.stats().resets).toBe(1); // Medium: 0.1 s needs 6 steps > 4
    expect(s.stats().blend).toBe(0);
    for (let i = 0; i < 4; i++) s.update(1 / 60);
    expect(s.stats().blend).toBeCloseTo(4 / 60 / 0.15, 9);
    s.reset(); expect(atRest()).toBe(true); // spawn / respawn / back from the background
  });
  it('missing cloth data: the bones stay at rest and the solver says why (still not a pass of Q4)', () => {
    const { root, get } = rig();
    get('sash_r_03').removeFromParent();
    const s = new ClothSolver(root);
    expect(s.ok).toBe(false); expect(s.problems.join(' ')).toContain('sash_r_03');
    const q = get('scarf_l_02').quaternion.clone();
    run(s, root, (u) => ({ z: 0.5 * 10 * u * u }), 0.3);
    expect(get('scarf_l_02').quaternion.equals(q)).toBe(true);
  });
  it('finds every chain on the loaded fixture GLB (45 bones, 6 anchors)', async () => {
    const g = globalThis as unknown as Record<string, unknown>;
    g.self ??= globalThis;
    g.createImageBitmap ??= async (blob: Blob) => { const dv = new DataView(await blob.arrayBuffer()); return { width: dv.getUint32(16), height: dv.getUint32(20), close() {} }; };
    const glb = buildFixtureGlb({ stage: 'full' });
    const h = (await loadHero(glb.buffer as ArrayBuffer, JSON.stringify(await buildFixtureManifest(glb, 'full')))).createInstance();
    const s = new ClothSolver(h.root);
    expect(s.problems).toEqual([]); expect(s.ok).toBe(true);
    h.dispose();
  });
  it('CPU: one character, Medium, 4 steps a frame: p95 under 0.5 ms on this PC (not a phone number)', () => {
    const { root } = rig(), s = new ClothSolver(root);
    const ms: number[] = [];
    for (let i = 1; i <= 600; i++) {
      root.position.z = 0.5 * Math.sin(i / 20); root.rotation.y = 0.5 * Math.sin(i / 33);
      const a = performance.now(); s.update(4 / 60 - 1e-9); ms.push(performance.now() - a);
    }
    ms.sort((x, y) => x - y);
    expect(ms[Math.floor(ms.length * 0.95)]).toBeLessThan(0.5);
  });
});
