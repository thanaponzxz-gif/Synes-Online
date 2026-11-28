// Synes Online — Seyrin's cloth: the scarf ends, the sash ends and the tassels as short spring-bone chains (DES-007 rev 4 §5;
// DES-009 §3.1 row C: team B writes the solver, Codex makes the rest shape, the bones, the weights and the numbers).
// Picture only: runs on the client after the AnimationMixer and after the actor is placed from the sim; no hitbox, never cancels
// damage, never touches the input log, never in shared/ or the server.
//
// Per joint, two bending axes about its rest (bind) pose: θ'' = -kθ - cθ' + τ/I with τ = r x a_eff, r = half the bone along its
// current direction, mass 1, I = L²/3, a_eff = gravityMul*g - inertiaMul*a_anchor (wind 0 in v01). When the parent turns, the
// bone keeps its world direction first (so turns trail), then the spring acts. Semi-implicit Euler at a fixed step, a cone limit
// on the total bend (the outward velocity is cut at the edge), no twist (swing only), bone lengths never change. After each step
// the mid and tip of every bone are pushed out of the body proxies (2 passes) and the cones are checked again.
import * as THREE from 'three';

export interface ClothChain {
  name: string; anchor: string; bones: readonly string[];
  /** design length anchor -> tip at a 1.5 m character; the last bone gets what the rig's other offsets leave */
  lengthM: number;
  /** per joint, root -> tip: angular stiffness (s⁻²), damping (s⁻¹), bend cone (degrees) */
  k: readonly number[]; c: readonly number[]; coneDeg: readonly number[];
  twistDeg: number; gravityMul: number; inertiaMul: number;
}
const bones = (n: string, count: number) => Array.from({ length: count }, (_, i) => `${n}_0${i + 1}`);
const scarf = { k: [90, 65, 45, 30], c: [14.23, 12.09, 10.06, 8.22], coneDeg: [20, 30, 40, 50], twistDeg: 5, gravityMul: 0.45, inertiaMul: 0.45 };
const sash = { k: [150, 105, 70], c: [20.82, 17.42, 14.22], coneDeg: [12, 20, 28], twistDeg: 3, gravityMul: 0.8, inertiaMul: 0.3 };
const tassel = { k: [180, 120], c: [24.15, 19.72], coneDeg: [18, 30], twistDeg: 5, gravityMul: 1, inertiaMul: 0.25 };
/** DES-007 §5.2 */
export const CLOTH_CHAINS: readonly ClothChain[] = [
  { name: 'scarf_l', anchor: 'anchor_scarf_l', bones: bones('scarf_l', 4), lengthM: 0.6, ...scarf },
  { name: 'scarf_r', anchor: 'anchor_scarf_r', bones: bones('scarf_r', 4), lengthM: 0.52, ...scarf },
  { name: 'sash_l', anchor: 'anchor_sash_l', bones: bones('sash_l', 3), lengthM: 0.28, ...sash },
  { name: 'sash_r', anchor: 'anchor_sash_r', bones: bones('sash_r', 3), lengthM: 0.22, ...sash },
  { name: 'tassel_l', anchor: 'anchor_tassel_l', bones: bones('tassel_l', 2), lengthM: 0.18, ...tassel },
  { name: 'tassel_r', anchor: 'anchor_tassel_r', bones: bones('tassel_r', 2), lengthM: 0.14, ...tassel },
];
/** DES-007 §5.3: body proxies (torso capsule pelvis -> chest, head sphere, thigh capsules thigh -> knee), padding, passes */
export const CLOTH_BODY = { torsoR: 0.23, headR: 0.28, thighR: 0.1, padM: 0.015, passes: 2, groundDownM: 0.02 } as const;
export const CLOTH_STEP = { medium: { h: 1 / 60, max: 4, interpolate: false }, low: { h: 1 / 30, max: 2, interpolate: true } } as const;
export const CLOTH_RESET = { maxDtS: 0.15, teleportM: 0.75, blendS: 0.15 } as const;
export const CLOTH_ANCHOR = { tauS: 0.05, maxAccel: 30, g: 9.81 } as const;
export type ClothQuality = keyof typeof CLOTH_STEP;

interface Joint {
  bone: THREE.Object3D; chain: number;
  rest: THREE.Quaternion; axis: THREE.Vector3; L: number; k: number; c: number; cone: number;
  /** swing vector (axis * angle, ⊥ axis) in the rest frame, its rate, and the state before the last step (Low interpolation) */
  theta: THREE.Vector3; omega: THREE.Vector3; prev: THREE.Vector3;
  /** world direction after the last step (kept when the parent turns) and as last shown (the snap readout) */
  dir: THREE.Vector3; shownDir: THREE.Vector3;
}
interface Chain {
  def: ClothChain; anchor: THREE.Object3D; joints: Joint[];
  /** the first joint's parent pose and the anchor position, last frame and this frame (steps interpolate between them) */
  prevPos: THREE.Vector3; prevRot: THREE.Quaternion; curPos: THREE.Vector3; curRot: THREE.Quaternion; prevAnchor: THREE.Vector3; curAnchor: THREE.Vector3;
  /** the anchor at the last step, its filtered velocity, and the clamped acceleration this step uses */
  lastP: THREE.Vector3 | null; vf: THREE.Vector3 | null; acc: THREE.Vector3;
}
interface Capsule { a: THREE.Vector3; b: THREE.Vector3; r: number; }

const V = () => new THREE.Vector3(), Q = () => new THREE.Quaternion();
const _sw = V(), _ab = V(), _ap = V();
/** swing quaternion for a swing vector */
function swing(out: THREE.Quaternion, theta: THREE.Vector3): THREE.Quaternion {
  const a = theta.length();
  return a < 1e-15 ? out.identity() : out.setFromAxisAngle(_sw.copy(theta).divideScalar(a), a);
}
/** the swing vector (⊥ axis) that turns `axis` onto the unit direction `d` (same frame); `out` must not be `axis` or `d` */
function swingTo(out: THREE.Vector3, axis: THREE.Vector3, d: THREE.Vector3): THREE.Vector3 {
  out.crossVectors(axis, d);
  const s = out.length(), c = axis.dot(d);
  return s < 1e-15 ? out.set(0, 0, 0) : out.multiplyScalar(Math.atan2(s, c) / s);
}
function closestOnSeg(out: THREE.Vector3, p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): THREE.Vector3 {
  _ab.subVectors(b, a);
  const l2 = _ab.lengthSq(), t = l2 > 0 ? Math.min(1, Math.max(0, _ap.subVectors(p, a).dot(_ab) / l2)) : 0;
  return out.copy(a).addScaledVector(_ab, t);
}

export class ClothSolver {
  readonly problems: string[] = [];
  private chains: Chain[] = [];
  private joints: Joint[] = [];
  private body: Capsule[] = [];
  private bodyBones: [THREE.Object3D, THREE.Object3D][] = [];
  private acc = 0;
  private sinceReset = 0;
  private needReset = true;
  private frame = { substeps: 0, resets: 0, maxSnapDeg: 0, blend: 1 };
  private step: (typeof CLOTH_STEP)[ClothQuality];
  private root: THREE.Object3D;
  // scratch, one per use (helpers never share one)
  private t = { aEff: V(), pr: Q(), jp: V(), frame: Q(), inv: Q(), d: V(), w: V(), tau: V(), qs: Q(), rot: Q(), ap: V(), v: V(), dv: V(),
    cq: Q(), cqs: Q(), cdir: V(), cpt: V(), cc: V(), cwant: V(), cb: V(), cn: V(), sp: V(), ss: V(), sq: Q(), st: V(), sd: V(), sqs: Q() };

  constructor(root: THREE.Object3D, quality: ClothQuality = 'medium') {
    this.root = root; this.step = CLOTH_STEP[quality];
    const find = (n: string) => { const o = root.getObjectByName(n); if (!o) this.problems.push(`missing node ${n}`); return o ?? null; };
    for (const [a, b, r] of [['pelvis', 'chest', CLOTH_BODY.torsoR], ['head', 'head', CLOTH_BODY.headR], ['thigh_l', 'shin_l', CLOTH_BODY.thighR], ['thigh_r', 'shin_r', CLOTH_BODY.thighR]] as const) {
      const A = find(a), B = find(b);
      if (A && B) { this.bodyBones.push([A, B]); this.body.push({ a: V(), b: V(), r }); }
    }
    CLOTH_CHAINS.forEach((def, ci) => {
      const anchor = find(def.anchor), found = def.bones.map(find);
      if (!anchor || found.some((b) => !b)) return;
      const bs = found as THREE.Object3D[];
      if (bs.some((b, i) => i > 0 && b.parent !== bs[i - 1])) { this.problems.push(`${def.name}: bones are not one parent -> child chain`); return; }
      let used = bs[0].position.length();
      const js: Joint[] = bs.map((bone, i) => {
        const child = bs[i + 1];
        const L = child ? child.position.length() : def.lengthM - used;
        if (child) used += L;
        return { bone, chain: ci, rest: bone.quaternion.clone(), axis: child ? child.position.clone().normalize() : V(), L, k: def.k[i], c: def.c[i],
          cone: (def.coneDeg[i] * Math.PI) / 180, theta: V(), omega: V(), prev: V(), dir: V(), shownDir: V() };
      });
      const last = js[js.length - 1];
      last.axis.copy(js.length > 1 ? js[js.length - 2].axis : new THREE.Vector3(0, -1, 0));
      if (!(last.L > 0.005)) { this.problems.push(`${def.name}: the rig is already ${used.toFixed(3)} m long before its last bone (design ${def.lengthM} m)`); return; }
      this.chains.push({ def, anchor, joints: js, prevPos: V(), prevRot: Q(), curPos: V(), curRot: Q(), prevAnchor: V(), curAnchor: V(), lastP: null, vf: null, acc: V() });
      this.joints.push(...js);
    });
  }

  /** all 18 bones found and usable; otherwise the cloth stays at rest (a fallback: DES-007 Q4 is not passed) */
  get ok(): boolean { return this.problems.length === 0; }
  setQuality(q: ClothQuality): void { this.step = CLOTH_STEP[q]; this.needReset = true; }
  /** spawn / respawn / back from a pause: rest pose, no velocity, blend back in over 0.15 s */
  reset(): void { this.needReset = true; if (this.ok) this.restore(); }
  /** this frame: fixed steps run, whether it reset, the largest bone direction change (degrees), the blend-in from rest */
  stats() { return { ...this.frame }; }

  /** once per rendered frame, after the mixer pose and the actor's placement; dt = real frame time (s) */
  update(dt: number, o: { down?: boolean; groundY?: number } = {}): void {
    this.frame = { substeps: 0, resets: 0, maxSnapDeg: 0, blend: 1 };
    if (!this.ok) return;
    this.root.updateMatrixWorld(true);
    this.readFrame();
    let reset = this.needReset || !(dt > 0) || dt > CLOTH_RESET.maxDtS;
    for (const ch of this.chains) if (ch.curAnchor.distanceTo(ch.prevAnchor) > CLOTH_RESET.teleportM) reset = true;
    const { h, max, interpolate } = this.step;
    if (!reset) {
      const total = this.acc + dt;
      if (total >= (max + 1) * h - 1e-12) reset = true; // would need more steps than allowed: drop the time, start again from rest
      else {
        const acc0 = this.acc;
        let n = 0;
        this.acc = total;
        while (this.acc >= h - 1e-12 && n < max) { n++; this.acc -= h; this.substep(h, Math.min(1, (n * h - acc0) / dt), o); }
        if (this.acc < 0) this.acc = 0;
        this.frame.substeps = n;
      }
    }
    if (reset) { this.restore(); this.frame.resets = 1; } else this.sinceReset += dt;
    const blend = Math.min(1, this.sinceReset / CLOTH_RESET.blendS);
    this.frame.blend = blend;
    this.show(interpolate ? this.acc / h : 1, blend, reset);
    for (const ch of this.chains) { ch.prevPos.copy(ch.curPos); ch.prevRot.copy(ch.curRot); ch.prevAnchor.copy(ch.curAnchor); }
  }

  // ---------------------------------------------------------------- QA readouts (shown values come from the bones themselves)
  /** bend angle of every bone (rad), chain by chain, root -> tip: the sim state, the state before the last step, or as shown */
  angles(which: 'state' | 'prev' | 'shown'): number[] {
    if (which === 'state') return this.joints.map((j) => j.theta.length());
    if (which === 'prev') return this.joints.map((j) => j.prev.length());
    return this.joints.map((j) => 2 * Math.acos(Math.min(1, Math.abs(Q().copy(j.rest).invert().multiply(j.bone.quaternion).w))));
  }
  /** twist of every bone about its own axis relative to rest (rad) */
  twists(): number[] {
    return this.joints.map((j) => { const q = Q().copy(j.rest).invert().multiply(j.bone.quaternion); return Math.abs(2 * Math.atan2(q.x * j.axis.x + q.y * j.axis.y + q.z * j.axis.z, q.w)); });
  }
  /** world position of each chain's tip as shown */
  tips(): THREE.Vector3[] { this.root.updateMatrixWorld(true); return this.chains.map((ch) => this.boneAt(ch.joints[ch.joints.length - 1], 1)); }
  /** mid and tip of every bone as shown */
  points(): { chain: number; y: number; p: THREE.Vector3 }[] {
    this.root.updateMatrixWorld(true);
    return this.joints.flatMap((j) => [0.5, 1].map((f) => { const p = this.boneAt(j, f); return { chain: j.chain, y: p.y, p }; }));
  }
  /** per bone mid / tip: how far outside the nearest body proxy's radius + padding (negative = inside) */
  proxyDistances(): number[] {
    const pts = this.points(); this.readBody();
    return pts.map(({ p }) => Math.min(...this.body.map((b) => p.distanceTo(closestOnSeg(V(), p, b.a, b.b)) - b.r - CLOTH_BODY.padM)));
  }

  // ---------------------------------------------------------------- internals
  private readFrame() {
    for (const ch of this.chains) {
      const j0 = ch.joints[0], parent = j0.bone.parent!;
      parent.matrixWorld.decompose(this.t.sp, ch.curRot, this.t.ss);
      ch.curPos.copy(j0.bone.position).applyMatrix4(parent.matrixWorld);
      ch.anchor.getWorldPosition(ch.curAnchor);
    }
    this.readBody();
  }
  private readBody() { this.bodyBones.forEach(([A, B], i) => { A.getWorldPosition(this.body[i].a); B.getWorldPosition(this.body[i].b); }); }
  private boneAt(j: Joint, f: number): THREE.Vector3 {
    const p = V(), q = Q(); j.bone.matrixWorld.decompose(p, q, V());
    return p.addScaledVector(V().copy(j.axis).applyQuaternion(q), j.L * f);
  }

  private restore() {
    for (const j of this.joints) { j.theta.set(0, 0, 0); j.omega.set(0, 0, 0); j.prev.set(0, 0, 0); j.bone.quaternion.copy(j.rest); }
    this.root.updateMatrixWorld(true);
    this.readFrame();
    for (const ch of this.chains) { ch.prevPos.copy(ch.curPos); ch.prevRot.copy(ch.curRot); ch.prevAnchor.copy(ch.curAnchor); ch.lastP = null; ch.vf = null; ch.acc.set(0, 0, 0); }
    for (const j of this.joints) { const q = Q(); j.bone.matrixWorld.decompose(V(), q, V()); j.dir.copy(j.axis).applyQuaternion(q); j.shownDir.copy(j.dir); }
    this.acc = 0; this.sinceReset = 0; this.needReset = false;
  }

  /** anchor acceleration for this step: velocity through a first-order filter (0.05 s), its rate of change, clamped at 30 m/s² */
  private anchorAccel(ch: Chain, h: number, f: number) {
    const p = this.t.ap.lerpVectors(ch.prevAnchor, ch.curAnchor, f);
    if (!ch.lastP) { ch.lastP = p.clone(); ch.acc.set(0, 0, 0); return; }
    const v = this.t.v.subVectors(p, ch.lastP).divideScalar(h);
    ch.lastP.copy(p);
    if (!ch.vf) { ch.vf = v.clone(); ch.acc.set(0, 0, 0); return; }
    const dv = this.t.dv.subVectors(v, ch.vf).multiplyScalar(1 - Math.exp(-h / CLOTH_ANCHOR.tauS));
    ch.vf.add(dv);
    ch.acc.copy(dv).divideScalar(h);
    const l = ch.acc.length();
    if (l > CLOTH_ANCHOR.maxAccel) ch.acc.multiplyScalar(CLOTH_ANCHOR.maxAccel / l);
  }

  /** one fixed step ending at fraction `f` of this frame (the first joint's parent pose and the anchor are interpolated) */
  private substep(h: number, f: number, o: { down?: boolean; groundY?: number }) {
    const T = this.t;
    const ground = o.down ? (o.groundY ?? this.root.getWorldPosition(T.sp).y) + CLOTH_BODY.groundDownM : -Infinity;
    for (const ch of this.chains) {
      const d = ch.def;
      this.anchorAccel(ch, h, f);
      const aEff = T.aEff.set(0, -CLOTH_ANCHOR.g * d.gravityMul, 0).addScaledVector(ch.acc, -d.inertiaMul);
      const parentRot = T.pr.slerpQuaternions(ch.prevRot, ch.curRot, f);
      const jointPos = T.jp.lerpVectors(ch.prevPos, ch.curPos, f);
      for (const j of ch.joints) {
        j.prev.copy(j.theta);
        const frame = T.frame.copy(parentRot).multiply(j.rest), inv = T.inv.copy(frame).invert();
        // 1. the bone keeps the world direction it had (the parent may have turned): re-express it as a swing in this frame
        swingTo(j.theta, j.axis, T.d.copy(j.dir).applyQuaternion(inv).normalize());
        // 2. spring + damping + the torque of a_eff about the joint, in the bending plane (⊥ the axis); semi-implicit Euler
        const dirW = T.w.copy(j.axis).applyQuaternion(swing(T.qs, j.theta)).applyQuaternion(frame);
        const tau = T.tau.crossVectors(dirW, aEff).multiplyScalar(3 / (2 * j.L)).applyQuaternion(inv); // (L/2 d x a) / (L²/3)
        tau.addScaledVector(j.axis, -tau.dot(j.axis));
        tau.addScaledVector(j.theta, -j.k).addScaledVector(j.omega, -j.c);
        j.omega.addScaledVector(tau, h);
        j.omega.addScaledVector(j.axis, -j.omega.dot(j.axis));
        j.theta.addScaledVector(j.omega, h);
        this.cone(j);
        // 3. body proxies (and the ground when down), 2 passes, then the cone again
        for (let pass = 0; pass < CLOTH_BODY.passes; pass++) this.collide(j, frame, inv, jointPos, ground);
        this.cone(j);
        const rot = T.rot.copy(frame).multiply(swing(T.qs, j.theta));
        j.dir.copy(j.axis).applyQuaternion(rot);
        jointPos.addScaledVector(j.dir, j.L);
        parentRot.copy(rot);
      }
    }
  }

  private cone(j: Joint) {
    const a = j.theta.length();
    if (a <= j.cone) return;
    j.theta.multiplyScalar(j.cone / a);
    const n = this.t.cn.copy(j.theta).divideScalar(j.cone), out = j.omega.dot(n);
    if (out > 0) j.omega.addScaledVector(n, -out);
  }

  /** push the mid and the tip of the bone out of every body proxy (and above the ground when down) by turning it about its joint */
  private collide(j: Joint, frame: THREE.Quaternion, inv: THREE.Quaternion, joint: THREE.Vector3, ground: number) {
    const T = this.t;
    for (const f of [0.5, 1]) {
      const reach = j.L * f;
      let dir = this.dirOf(j, frame), pt = T.cpt.copy(joint).addScaledVector(dir, reach), moved = false;
      for (const b of this.body) {
        const c = closestOnSeg(T.cc, pt, b.a, b.b), r = b.r + CLOTH_BODY.padM, dist = pt.distanceTo(c);
        if (dist >= r || dist < 1e-9) continue; // (on the axis there is no direction to push; a rest outside the body never gets there)
        pt.sub(c).multiplyScalar(r / dist).add(c); moved = true;
      }
      if (moved) { const want = T.cwant.subVectors(pt, joint); if (want.lengthSq() > 1e-18) this.turnTo(j, inv, want.normalize()); }
      if (ground === -Infinity) continue;
      // the ground: the least turn in the vertical plane of the bone that lifts this point to the plane (joint.y + d.y * reach >= ground)
      dir = this.dirOf(j, frame);
      const need = (ground - joint.y) / reach;
      if (joint.y + dir.y * reach >= ground || need >= 1) continue;
      let hx = dir.x, hz = dir.z, hl = Math.hypot(hx, hz);
      if (hl < 1e-6) { // hanging straight down: fall away from the torso axis
        const t = this.body[0]; closestOnSeg(T.cc, joint, t.a, t.b);
        hx = joint.x - T.cc.x; hz = joint.z - T.cc.z; hl = Math.hypot(hx, hz);
        if (hl < 1e-9) { hx = 0; hz = 1; hl = 1; }
      }
      const s = Math.sqrt(Math.max(0, 1 - need * need)) / hl;
      this.turnTo(j, inv, T.cwant.set(hx * s, need, hz * s));
    }
  }
  private dirOf(j: Joint, frame: THREE.Quaternion): THREE.Vector3 {
    return this.t.cdir.copy(j.axis).applyQuaternion(this.t.cq.copy(frame).multiply(swing(this.t.cqs, j.theta)));
  }
  /** set the bone's swing so it points along the world direction `want` (unit), and drop the velocity back into the obstacle */
  private turnTo(j: Joint, inv: THREE.Quaternion, want: THREE.Vector3) {
    const before = this.t.cb.copy(j.theta);
    swingTo(j.theta, j.axis, want.applyQuaternion(inv));
    const push = before.sub(j.theta).negate(), pl = push.length(); // the swing the push made
    if (pl > 0) { push.divideScalar(pl); const into = j.omega.dot(push); if (into < 0) j.omega.addScaledVector(push, -into); }
  }

  /** bones from the state: Low shows between the last two states, Medium the latest; after a reset it blends in from rest */
  private show(f: number, blend: number, reset: boolean) {
    const T = this.t;
    let worst = 0;
    for (const ch of this.chains) {
      ch.joints[0].bone.parent!.matrixWorld.decompose(T.sp, T.sq, T.ss);
      for (const j of ch.joints) {
        T.st.lerpVectors(j.prev, j.theta, f).multiplyScalar(blend);
        j.bone.quaternion.copy(j.rest).multiply(swing(T.sqs, T.st));
        T.sq.multiply(j.bone.quaternion);
        const d = T.sd.copy(j.axis).applyQuaternion(T.sq);
        if (!reset) worst = Math.max(worst, (Math.acos(Math.min(1, Math.max(-1, d.dot(j.shownDir)))) * 180) / Math.PI);
        j.shownDir.copy(d);
      }
    }
    this.frame.maxSnapDeg = worst;
  }
}
