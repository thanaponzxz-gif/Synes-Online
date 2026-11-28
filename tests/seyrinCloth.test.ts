// DES-007 §5: Seyrin's scarf / sash / tassels as short spring-bone chains on the client (18 bones, 6 chains): 2-axis bending
// θ'' = -kθ - cθ' + τ/I about the rest pose, a_eff = gravityMul*g - inertiaMul*a_anchor, cone and twist limits, body proxies,
// fixed steps (Medium 1/60 x4, Low 1/30 x2 + interpolation), resets. Picture only: no hitbox, no sim, no input log.
// These tests check the solver against the design and team A's limits (DES-009 §10.9: no bone turns more than 10° in a frame at
// 60 FPS outside a reset blend, the scarf within 0.35 m of the midline sideways, the pose on screen outside the proxies and
// inside the cones, calm = within 2° from 1.0 s after a stop). They run on the code-built TEST rig: the real rig and rest shape
// are Codex's and still have to pass §5.3 themselves (tools/qa/seyrin-cloth.ts prints the numbers).
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ClothSolver, CLOTH_CHAINS, CLOTH_BODY, CLOTH_STEP, CLOTH_LIMITS } from '../src/seyrin/cloth.ts';
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
  it('Low: 1/30 s steps (at most 2), the pose shown is interpolated between the world directions of the last two states', () => {
    const { root } = rig(), s = new ClothSolver(root, 'low');
    run(s, root, (u) => ({ z: 0.5 * 10 * u * u }), 0.5, 30);
    root.position.z += 0.05; s.update(1 / 60); // half a step: no new state, the view is halfway
    expect(s.stats().substeps).toBe(0);
    const prev = s.directions('prev'), cur = s.directions('state'), shown = s.directions('shown');
    expect(Math.max(...prev.map((d, i) => d.angleTo(cur[i])))).toBeGreaterThan(1 * DEG); // the two states differ
    shown.forEach((d, i) => expect(d.angleTo(prev[i].clone().add(cur[i]).normalize())).toBeLessThan(1e-9));
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

describe('team A limits (DES-009 §10.9)', () => {
  const dodges: Motion = (u) => { const tick = u * 30, n = Math.floor(tick / 24), d = Math.min(tick - n * 24, 9) * 0.4; return { x: n % 2 ? 3.6 - d : d }; };
  const turn = (frames: number, deg: number): Motion => (u) => ({ yaw: Math.min(1, Math.max(0, (u - 0.2) / (frames / 60))) * deg * DEG });
  const shake: Motion = (u) => ({ z: 0.5 * Math.sin(2 * Math.PI * 10 * u), x: 0.3 * Math.sin(2 * Math.PI * 7 * u), yaw: 0.8 * Math.sin(2 * Math.PI * 3 * u) });
  /** sideways distance of every scarf point from the body's midline (the vertical plane through the pelvis along the facing) */
  const sideways = (s: ClothSolver, root: THREE.Object3D, get: (n: string) => THREE.Object3D) => {
    const c = get('pelvis').getWorldPosition(new THREE.Vector3()), n = new THREE.Vector3(1, 0, 0).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
    return s.points().filter((p) => p.chain < 2).map((p) => Math.abs(p.p.clone().sub(c).dot(n)));
  };
  const conflicts = (s: ClothSolver) => Object.values(s.stats().conflicts).reduce((a, b) => a + b, 0);

  it('the limits are the design numbers (DES-007 §5.3)', () => {
    expect(CLOTH_LIMITS).toMatchObject({ snapDegAt60: 10, sidewaysM: 0.35, scarfFromAnchorM: 0.65 });
  });
  it('every bone needs a usable length: a zero-length bone is a problem and the cloth stays at rest, never NaN', () => {
    for (const bad of [[0, 0, 0], [Number.NaN, -0.1, 0]] as [number, number, number][]) {
      const { root, get } = rig();
      get('scarf_l_02').position.set(...bad);
      const s = new ClothSolver(root);
      expect(s.ok).toBe(false); expect(s.problems.join(' ')).toContain('scarf_l_01');
      const q = get('scarf_l_01').quaternion.clone();
      run(s, root, (u) => ({ z: 0.5 * 10 * u * u }), 0.3);
      expect(get('scarf_l_01').quaternion.equals(q)).toBe(true);
      expect(s.angles('shown').every(Number.isFinite)).toBe(true);
    }
  });
  /** the turn the view gives a model today (src/render/view.ts: each frame turns min(1, dt*16) of what is left) */
  const eased = (deg: number): Motion => (u) => ({ yaw: deg * DEG * (1 - Math.pow(1 - 16 / 60, Math.max(0, Math.round((u - 0.2) * 60)))) });
  const snaps = (q: 'medium' | 'low', m: Motion, pre: number) => {
    const { root } = rig(), s = new ClothSolver(root, q);
    let worst = 0, blendBefore = 0, counted = 0;
    const t = pre ? run(s, root, () => ({}), pre) : 0;
    run(s, root, m, 3, 60, t, () => { const st = s.stats(); if (st.blend === 1 && blendBefore === 1) worst = Math.max(worst, st.maxSnapDeg); blendBefore = st.blend; counted += st.conflicts.snap; });
    return { worst, counted };
  };
  it('back-to-back side dodges and turns at 60 FPS: no bone turns more than 10° in a frame, Medium and Low (outside a reset blend)', () => {
    const cases = [['dodges', dodges, 0], ['90° at once', turn(1, 90), 0.2], ['180° at once', turn(1, 180), 0.2], ['90° as the view turns', eased(90), 0.2], ['180° as the view turns', eased(180), 0.2]] as const;
    for (const q of ['medium', 'low'] as const) for (const [name, m, pre] of cases) {
      const r = snaps(q, m, pre);
      expect(r.worst, `${q} ${name}`).toBeLessThanOrEqual(CLOTH_LIMITS.snapDegAt60 + 1e-9); expect(r.counted).toBe(0);
    }
  });
  it('a steady 900°/s turn (90° in 0.1 s), Medium and Low: still at most 10° a frame on screen, with no conflict (team A, DES-009 §10.10 ก)', () => {
    for (const q of ['medium', 'low'] as const) {
      const r = snaps(q, turn(6, 90), 0.2);
      expect(r.worst, q).toBeLessThanOrEqual(CLOTH_LIMITS.snapDegAt60 + 1e-9); expect(r.counted, q).toBe(0);
    }
  });
  it('on screen a bone turns at most 600°/s at any frame rate (144 FPS: 4.2° a frame)', () => {
    const { root } = rig(), s = new ClothSolver(root);
    let worst = 0, blendBefore = 0;
    run(s, root, () => ({}), 0.2, 144);
    run(s, root, dodges, 2, 144, 0.2, () => { const st = s.stats(); if (st.blend === 1 && blendBefore === 1) worst = Math.max(worst, st.maxSnapDeg); blendBefore = st.blend; });
    expect(worst).toBeLessThanOrEqual((CLOTH_LIMITS.snapDegAt60 * 60) / 144 + 1e-9);
  });
  it('the cap holds on the final pose together with the cones (team A, DES-009 §10.11: Medium, 144 FPS, 29 frames, then 900°/s)', () => {
    const { root } = rig(), s = new ClothSolver(root);
    const t0 = run(s, root, () => ({}), 29 / 144, 144);
    let worst = 0, counted = 0;
    run(s, root, (u) => ({ yaw: Math.min(1, Math.max(0, (u - t0) / 0.1)) * (Math.PI / 2) }), 0.5, 144, t0, () => {
      const st = s.stats(); worst = Math.max(worst, st.maxSnapDeg); counted += st.conflicts.snap;
      const a = s.angles('shown'); let i = 0;
      for (const c of CLOTH_CHAINS) for (const cone of c.coneDeg) expect(a[i++]).toBeLessThanOrEqual(cone * DEG + 1e-9);
    });
    expect(worst).toBeLessThanOrEqual((CLOTH_LIMITS.snapDegAt60 * 60) / 144 + 1e-9); expect(counted).toBe(0);
  });
  it('a pose that is not finite above the cloth (an anchor, an ancestor) is a problem when built and a rest-pose frame when it happens later; no NaN reaches the cloth', () => {
    for (const bad of ['anchor_scarf_l', 'chest', 'pelvis']) {
      const { root, get } = rig();
      get(bad).position.x = Number.NaN;
      const s = new ClothSolver(root);
      expect(s.ok, bad).toBe(false); expect(s.problems.join(' '), bad).toContain(bad);
    }
    const { root, get } = rig(), s = new ClothSolver(root);
    run(s, root, (u) => ({ z: 0.5 * 10 * u * u }), 0.3);
    expect(s.ok).toBe(true);
    const chest = get('chest'), y = chest.position.y;
    chest.position.y = Number.NaN; s.update(1 / 60);
    expect(s.stats().badPose).toBe(true);
    for (const c of CLOTH_CHAINS) for (const b of c.bones) {
      const q = get(b).quaternion;
      expect([q.x, q.y, q.z, q.w].every(Number.isFinite), b).toBe(true);
    }
    expect(s.angles('shown').every(Number.isFinite)).toBe(true);
    chest.position.y = y; s.update(1 / 60);
    expect(s.stats().badPose).toBe(false); expect(s.stats().resets).toBe(1); // back: from rest, blending in
    expect(s.directions('shown').every((d) => [d.x, d.y, d.z].every(Number.isFinite))).toBe(true);
  });
  it('the scarf stays within 0.35 m of the midline sideways (side dodges, shaking), Medium and Low', () => {
    for (const q of ['medium', 'low'] as const) for (const m of [dodges, shake]) {
      const { root, get } = rig(), s = new ClothSolver(root, q);
      let worst = 0;
      run(s, root, m, 3, 60, 0, () => { worst = Math.max(worst, ...sideways(s, root, get)); });
      expect(worst, q).toBeLessThanOrEqual(CLOTH_LIMITS.sidewaysM + 1e-3);
      expect(worst, q).toBeGreaterThan(0.2); // it was actually pushed out that far
    }
  });
  it('the pose on screen keeps the proxies (padding to 1 mm) and the cones: Low between its steps, and while a reset blends in', () => {
    for (const q of ['medium', 'low'] as const) {
      const { root } = rig(), s = new ClothSolver(root, q);
      let worst = Infinity;
      const check = () => {
        worst = Math.min(worst, ...s.proxyDistances());
        const a = s.angles('shown'); let i = 0;
        for (const c of CLOTH_CHAINS) for (const cone of c.coneDeg) expect(a[i++]).toBeLessThanOrEqual(cone * DEG + 1e-9);
      };
      let t = run(s, root, (u) => ({ z: -0.5 * 30 * u * u }), 0.6, 60, 0, check);
      t = run(s, root, shake, 2, 60, t, check);
      root.position.x += 1; s.update(1 / 60); check(); // a teleport: reset, then the blend from rest
      run(s, root, (u) => { const p = shake(u); return { ...p, x: (p.x ?? 0) + 1 }; }, 0.3, 60, t, check);
      expect(worst, q).toBeGreaterThanOrEqual(-1e-3);
    }
  });
  it('a limit the cloth cannot keep is counted in stats().conflicts, never hidden (the lowered upright test rig puts the sash at the ground)', () => {
    const { root } = rig(), s = new ClothSolver(root);
    run(s, root, () => ({ y: -0.78 }), 0.5, 60, 0, undefined, { down: true, groundY: 0 });
    expect(s.stats().conflicts.ground).toBeGreaterThan(0);
    const r = rig(), s2 = new ClothSolver(r.root);
    let total = 0;
    run(s2, r.root, dodges, 3, 60, 0, () => { total += conflicts(s2); });
    expect(total).toBe(0);
  });
  it('calm: after a stop from a run every bone is within 2° of its final pose from 1.0 s on and stays there (Q8, on the test rig)', () => {
    const { root } = rig(), s = new ClothSolver(root);
    const tStop = run(s, root, (u) => ({ z: 5.2 * u }), 1.0), z1 = root.position.z;
    let worst = 0;
    run(s, root, (u) => { const d = Math.min(u - tStop, 0.1); return { z: z1 + 5.2 * d - 0.5 * 52 * d * d }; }, 3.0, 60, tStop, (u) => { if (u >= tStop + 1.0 - 1e-9 && u <= tStop + 1.2 + 1e-9) worst = Math.max(worst, maxAngle(s)); });
    expect(maxAngle(s)).toBeLessThan(0.1 * DEG); // the final pose is the rest pose (no wind)
    expect(worst).toBeLessThanOrEqual(2 * DEG);
  });
});
