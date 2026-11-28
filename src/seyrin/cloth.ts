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
// Team A limits (DES-009 §10.9): a bone turns at most 10° per 1/60 s (its swing rate is capped at 600°/s), the scarf stays
// within 0.35 m of the body's midline sideways, and the pose put on screen (Low interpolation, the reset blend) gets the same
// proxies / sideways / ground pushes and cones. A limit that cannot be kept is counted in stats().conflicts, never hidden.
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
/** DES-007 §5.3 / team A (DES-009 §10.9): per-frame turn at 60 FPS, the scarf's sideways reach from the midline, the scarf tip's
 *  reach from its anchor (kept by the bone lengths), the shortest usable bone, and how far past a limit counts as a conflict */
export const CLOTH_LIMITS = { snapDegAt60: 10, sidewaysM: 0.35, sidewaysChains: ['scarf_l', 'scarf_r'], scarfFromAnchorM: 0.65, minBoneM: 0.005, conflictM: 1e-3 } as const;
const MAX_RATE = (CLOTH_LIMITS.snapDegAt60 * 60 * Math.PI) / 180; // rad/s
export type ClothQuality = keyof typeof CLOTH_STEP;

interface Joint {
  bone: THREE.Object3D; chain: number;
  rest: THREE.Quaternion; axis: THREE.Vector3; L: number; k: number; c: number; cone: number;
  /** swing vector (axis * angle, ⊥ axis) in the rest frame and its rate */
  theta: THREE.Vector3; omega: THREE.Vector3;
  /** world direction after the last step (kept when the parent turns), before it (Low shows between the two), as last shown */
  dir: THREE.Vector3; prevDir: THREE.Vector3; shownDir: THREE.Vector3;
}
interface Chain {
  def: ClothChain; anchor: THREE.Object3D; joints: Joint[]; sideways: boolean;
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
  private frame = ClothSolver.emptyFrame(1);
  private blendBefore = 0;
  /** the body's midline plane this frame: through the pelvis, normal = the actor's sideways axis */
  private mid = { c: V(), n: V() };
  private step: (typeof CLOTH_STEP)[ClothQuality];
  private root: THREE.Object3D;
  // scratch, one per use (helpers never share one)
  private t = { aEff: V(), pr: Q(), jp: V(), frame: Q(), inv: Q(), d: V(), w: V(), tau: V(), qs: Q(), rot: Q(), ap: V(), v: V(), dv: V(),
    cq: Q(), cqs: Q(), cdir: V(), cpt: V(), cc: V(), cwant: V(), cb: V(), cn: V(), sp: V(), ss: V(), sq: Q(), st: V(), sd: V(), sqs: Q(),
    hn: V(), hp: V(), hf: V(), sjp: V(), sfr: Q(), sinv: Q(), srot: Q(), rp: V(), kp: V(), kd: V(), down: new THREE.Vector3(0, -1, 0) };
  private static emptyFrame(blend: number) { return { substeps: 0, resets: 0, maxSnapDeg: 0, blend, conflicts: { proxy: 0, sideways: 0, ground: 0, snap: 0 } }; }

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
      const finite = (o: THREE.Object3D) => [o.position.x, o.position.y, o.position.z, o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w].every(Number.isFinite);
      const bad = bs.find((b, i) => !finite(b) || (i + 1 < bs.length && !(bs[i + 1].position.length() > CLOTH_LIMITS.minBoneM && finite(bs[i + 1]))));
      if (bad || !Number.isFinite(used)) { this.problems.push(`${def.name}: ${bad?.name ?? bs[0].name} has no usable length or pose (every bone must be longer than ${CLOTH_LIMITS.minBoneM} m)`); return; }
      const js: Joint[] = bs.map((bone, i) => {
        const child = bs[i + 1];
        const L = child ? child.position.length() : def.lengthM - used;
        if (child) used += L;
        return { bone, chain: ci, rest: bone.quaternion.clone(), axis: child ? child.position.clone().normalize() : V(), L, k: def.k[i], c: def.c[i],
          cone: (def.coneDeg[i] * Math.PI) / 180, theta: V(), omega: V(), dir: V(), prevDir: V(), shownDir: V() };
      });
      const last = js[js.length - 1];
      last.axis.copy(js.length > 1 ? js[js.length - 2].axis : new THREE.Vector3(0, -1, 0));
      if (!(last.L > 0.005)) { this.problems.push(`${def.name}: the rig is already ${used.toFixed(3)} m long before its last bone (design ${def.lengthM} m)`); return; }
      this.chains.push({ def, anchor, joints: js, sideways: (CLOTH_LIMITS.sidewaysChains as readonly string[]).includes(def.name), prevPos: V(), prevRot: Q(), curPos: V(), curRot: Q(), prevAnchor: V(), curAnchor: V(), lastP: null, vf: null, acc: V() });
      this.joints.push(...js);
    });
  }

  /** all 18 bones found and usable; otherwise the cloth stays at rest (a fallback: DES-007 Q4 is not passed) */
  get ok(): boolean { return this.problems.length === 0; }
  setQuality(q: ClothQuality): void { this.step = CLOTH_STEP[q]; this.needReset = true; }
  /** spawn / respawn / back from a pause: rest pose, no velocity, blend back in over 0.15 s */
  reset(): void { this.needReset = true; if (this.ok) this.restore(); }
  /** this frame: fixed steps run, whether it reset, the largest bone direction change (degrees), the blend-in from rest, and the
   *  limits the pose on screen could not keep (points past a proxy / the sideways limit / the ground by more than 1 mm, bones
   *  that turned more than 10° in a 60 FPS frame outside a reset blend) */
  stats() { return { ...this.frame, conflicts: { ...this.frame.conflicts } }; }

  /** once per rendered frame, after the mixer pose and the actor's placement; dt = real frame time (s) */
  update(dt: number, o: { down?: boolean; groundY?: number } = {}): void {
    this.frame = ClothSolver.emptyFrame(1);
    if (!this.ok) return;
    this.root.updateMatrixWorld(true);
    this.readFrame();
    const ground = o.down ? (o.groundY ?? this.root.getWorldPosition(this.t.sp).y) + CLOTH_BODY.groundDownM : -Infinity;
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
        while (this.acc >= h - 1e-12 && n < max) { n++; this.acc -= h; this.substep(h, Math.min(1, (n * h - acc0) / dt), ground); }
        if (this.acc < 0) this.acc = 0;
        this.frame.substeps = n;
      }
    }
    if (reset) { this.restore(); this.frame.resets = 1; } else this.sinceReset += dt;
    const blend = Math.min(1, this.sinceReset / CLOTH_RESET.blendS);
    this.frame.blend = blend;
    this.show(interpolate ? this.acc / h : 1, blend, reset, ground, dt);
    this.blendBefore = reset ? 0 : blend;
    for (const ch of this.chains) { ch.prevPos.copy(ch.curPos); ch.prevRot.copy(ch.curRot); ch.prevAnchor.copy(ch.curAnchor); }
  }

  // ---------------------------------------------------------------- QA readouts (shown values come from the bones themselves)
  /** bend angle of every bone (rad), chain by chain, root -> tip: the solver state, or as shown */
  angles(which: 'state' | 'shown'): number[] {
    if (which === 'state') return this.joints.map((j) => j.theta.length());
    return this.joints.map((j) => 2 * Math.acos(Math.min(1, Math.abs(Q().copy(j.rest).invert().multiply(j.bone.quaternion).w))));
  }
  /** world direction of every bone: before the last step, after it, as shown */
  directions(which: 'prev' | 'state' | 'shown'): THREE.Vector3[] {
    return this.joints.map((j) => (which === 'prev' ? j.prevDir : which === 'state' ? j.dir : j.shownDir).clone());
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
  private readBody() {
    this.bodyBones.forEach(([A, B], i) => { A.getWorldPosition(this.body[i].a); B.getWorldPosition(this.body[i].b); });
    if (this.body.length) { this.mid.c.copy(this.body[0].a); this.mid.n.set(1, 0, 0).applyQuaternion(this.root.getWorldQuaternion(this.t.cq)).normalize(); }
  }
  private boneAt(j: Joint, f: number): THREE.Vector3 {
    const p = V(), q = Q(); j.bone.matrixWorld.decompose(p, q, V());
    return p.addScaledVector(V().copy(j.axis).applyQuaternion(q), j.L * f);
  }

  private restore() {
    for (const j of this.joints) { j.theta.set(0, 0, 0); j.omega.set(0, 0, 0); j.bone.quaternion.copy(j.rest); }
    this.root.updateMatrixWorld(true);
    this.readFrame();
    for (const ch of this.chains) { ch.prevPos.copy(ch.curPos); ch.prevRot.copy(ch.curRot); ch.prevAnchor.copy(ch.curAnchor); ch.lastP = null; ch.vf = null; ch.acc.set(0, 0, 0); }
    for (const j of this.joints) { const q = Q(); j.bone.matrixWorld.decompose(V(), q, V()); j.dir.copy(j.axis).applyQuaternion(q); j.prevDir.copy(j.dir); j.shownDir.copy(j.dir); }
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
  private substep(h: number, f: number, ground: number) {
    const T = this.t;
    for (const ch of this.chains) {
      const d = ch.def;
      this.anchorAccel(ch, h, f);
      const aEff = T.aEff.set(0, -CLOTH_ANCHOR.g * d.gravityMul, 0).addScaledVector(ch.acc, -d.inertiaMul);
      const parentRot = T.pr.slerpQuaternions(ch.prevRot, ch.curRot, f);
      const jointPos = T.jp.lerpVectors(ch.prevPos, ch.curPos, f);
      for (let ji = 0; ji < ch.joints.length; ji++) { const j = ch.joints[ji];
        const frame = T.frame.copy(parentRot).multiply(j.rest), inv = T.inv.copy(frame).invert();
        // 1. the bone keeps the world direction it had (the parent may have turned): re-express it as a swing in this frame
        j.prevDir.copy(j.dir);
        swingTo(j.theta, j.axis, T.d.copy(j.dir).applyQuaternion(inv).normalize());
        // 2. spring + damping + the torque of a_eff about the joint, in the bending plane (⊥ the axis); semi-implicit Euler
        const dirW = T.w.copy(j.axis).applyQuaternion(swing(T.qs, j.theta)).applyQuaternion(frame);
        const tau = T.tau.crossVectors(dirW, aEff).multiplyScalar(3 / (2 * j.L)).applyQuaternion(inv); // (L/2 d x a) / (L²/3)
        tau.addScaledVector(j.axis, -tau.dot(j.axis));
        tau.addScaledVector(j.theta, -j.k).addScaledVector(j.omega, -j.c);
        j.omega.addScaledVector(tau, h);
        j.omega.addScaledVector(j.axis, -j.omega.dot(j.axis));
        const w = j.omega.length();
        if (w > MAX_RATE) j.omega.multiplyScalar(MAX_RATE / w); // team A: at most 10° per 1/60 s
        j.theta.addScaledVector(j.omega, h);
        this.cone(j, j.theta, j.omega);
        // 3. body proxies, the scarf's sideways limit and the ground when down, 2 passes, then the cone again
        for (let pass = 0; pass < CLOTH_BODY.passes; pass++) this.collide(ch, ji, j.theta, j.omega, frame, inv, jointPos, ground);
        this.cone(j, j.theta, j.omega);
        const rot = T.rot.copy(frame).multiply(swing(T.qs, j.theta));
        j.dir.copy(j.axis).applyQuaternion(rot);
        jointPos.addScaledVector(j.dir, j.L);
        parentRot.copy(rot);
      }
    }
  }

  /** the bend cone on a swing `th` (the state, or the pose shown); `om`, if given, loses its outward part at the edge */
  private cone(j: Joint, th: THREE.Vector3, om: THREE.Vector3 | null) {
    const a = th.length();
    if (a <= j.cone) return;
    th.multiplyScalar(j.cone / a);
    if (!om) return;
    const n = this.t.cn.copy(th).divideScalar(j.cone), out = om.dot(n);
    if (out > 0) om.addScaledVector(n, -out);
  }

  /** push the mid and the tip of the bone out of every body proxy, inside the sideways limit (scarf) and above the ground when
   *  down, each by the least turn about its joint; `th` is the swing to fix, `om` its rate (null for the pose shown) */
  private collide(ch: Chain, ji: number, th: THREE.Vector3, om: THREE.Vector3 | null, frame: THREE.Quaternion, inv: THREE.Quaternion, joint: THREE.Vector3, ground: number) {
    const T = this.t, j = ch.joints[ji];
    if (ch.sideways) this.keepSideways(ch, ji, th, om, frame, inv, joint);
    for (const f of [0.5, 1]) {
      const reach = j.L * f;
      const dir = this.dirOf(j, frame, th), pt = T.cpt.copy(joint).addScaledVector(dir, reach);
      let moved = false;
      for (const b of this.body) {
        const c = closestOnSeg(T.cc, pt, b.a, b.b), r = b.r + CLOTH_BODY.padM, dist = pt.distanceTo(c);
        if (dist >= r || dist < 1e-9) continue; // (on the axis there is no direction to push; a rest outside the body never gets there)
        pt.sub(c).multiplyScalar(r / dist).add(c); moved = true;
      }
      if (moved) { const want = T.cwant.subVectors(pt, joint); if (want.lengthSq() > 1e-18) this.turnTo(j, th, om, inv, want.normalize()); }
      if (ground !== -Infinity) {
        // hanging straight down, a bone falls away from the torso axis
        const t = this.body[0]; closestOnSeg(T.cc, joint, t.a, t.b);
        const away = T.hf.set(joint.x - T.cc.x, 0, joint.z - T.cc.z);
        if (away.lengthSq() < 1e-18) away.set(0, 0, 1);
        this.keepUnder(j, th, om, frame, inv, joint, reach, T.down, -ground, away);
      }
    }
  }
  /** the scarf within 0.35 m of the midline sideways. Every bone keeps its world direction when its parent turns, so turning
   *  bone ji moves the rest of the chain sideways with its tip: bone ji takes its share (its length over the path length) of how
   *  far each later point is out, and all of how far its own mid / tip is out. The bones above the tip so share the correction
   *  by length instead of the short last bone turning far in one step. Later bones are taken with the world directions they keep */
  private keepSideways(ch: Chain, ji: number, th: THREE.Vector3, om: THREE.Vector3 | null, frame: THREE.Quaternion, inv: THREE.Quaternion, joint: THREE.Vector3) {
    const T = this.t, js = ch.joints, j = js[ji], c = this.mid.c, lim = CLOTH_LIMITS.sidewaysM;
    for (const sgn of [1, -1]) {
      const n = T.hn.copy(this.mid.n).multiplyScalar(sgn);
      const tipS = T.kp.copy(joint).addScaledVector(this.dirOf(j, frame, th), j.L).sub(c).dot(n);
      let need = 0, path = 0;
      const p = T.kp.copy(joint);
      for (let i = ji; i < js.length; i++) {
        const b = js[i], d = T.kd.copy(i === ji ? this.dirOf(j, frame, th) : b.dir);
        for (const f of [0.5, 1]) {
          const out = T.rp.copy(p).addScaledVector(d, b.L * f).sub(c).dot(n) - lim;
          if (out > 0) need = Math.max(need, out * (i === ji ? 1 / f : j.L / (path + b.L * f)));
        }
        p.addScaledVector(d, b.L); path += b.L;
      }
      if (need > 0) this.keepUnder(j, th, om, frame, inv, joint, j.L, n, n.dot(c) + tipS - need, T.down);
    }
  }
  /** keep dot(joint + dir * reach, n) <= lim by the least turn of dir in the plane of n and dir (`fallback` picks the plane when dir
   *  is along n); nothing happens when the joint itself is too far out (a conflict, counted from the pose shown) */
  private keepUnder(j: Joint, th: THREE.Vector3, om: THREE.Vector3 | null, frame: THREE.Quaternion, inv: THREE.Quaternion, joint: THREE.Vector3, reach: number, n: THREE.Vector3, lim: number, fallback: THREE.Vector3) {
    const T = this.t, dir = this.dirOf(j, frame, th), jn = joint.dot(n);
    if (jn + reach * dir.dot(n) <= lim) return;
    const need = (lim - jn) / reach; // dir . n must come down to this
    if (need <= -1) return;
    const perp = T.hp.copy(dir).addScaledVector(n, -dir.dot(n));
    let pl = perp.length();
    if (pl < 1e-6) { perp.copy(fallback).addScaledVector(n, -fallback.dot(n)); pl = perp.length(); if (pl < 1e-9) return; }
    this.turnTo(j, th, om, inv, T.cwant.copy(n).multiplyScalar(need).addScaledVector(perp, Math.sqrt(Math.max(0, 1 - need * need)) / pl));
  }
  private dirOf(j: Joint, frame: THREE.Quaternion, th: THREE.Vector3): THREE.Vector3 {
    return this.t.cdir.copy(j.axis).applyQuaternion(this.t.cq.copy(frame).multiply(swing(this.t.cqs, th)));
  }
  /** set the swing so the bone points along the world direction `want` (unit), and drop the rate back into the obstacle */
  private turnTo(j: Joint, th: THREE.Vector3, om: THREE.Vector3 | null, inv: THREE.Quaternion, want: THREE.Vector3) {
    const before = this.t.cb.copy(th);
    swingTo(th, j.axis, want.applyQuaternion(inv));
    if (!om) return;
    const push = before.sub(th).negate(), pl = push.length(); // the swing the push made
    if (pl > 0) { push.divideScalar(pl); const into = om.dot(push); if (into < 0) om.addScaledVector(push, -into); }
  }

  /** bones from the state: Low shows between the last two states' world directions, Medium the latest; after a reset it blends
   *  in from rest. The
   *  pose shown gets the same pushes and cones as the state (a blend or an interpolation of two good poses can cut into the body),
   *  then whatever it still breaks is counted */
  private show(f: number, blend: number, reset: boolean, ground: number, dt: number) {
    const T = this.t, C = this.frame.conflicts, tol = CLOTH_LIMITS.conflictM;
    const judgeSnap = !reset && blend === 1 && this.blendBefore === 1 && dt <= 1 / 60 + 1e-9;
    let worst = 0;
    for (const ch of this.chains) {
      const parentRot = T.srot.copy(ch.curRot), jointPos = T.sjp.copy(ch.curPos);
      for (let ji = 0; ji < ch.joints.length; ji++) { const j = ch.joints[ji];
        const frame = T.sfr.copy(parentRot).multiply(j.rest), inv = T.sinv.copy(frame).invert();
        // Low: between the world directions before and after the last step (a turning parent does not jump the view), then the
        // swing that points there under the parent as shown
        const want = T.d.lerpVectors(j.prevDir, j.dir, f);
        if (want.lengthSq() < 1e-18) want.copy(j.dir);
        const th = swingTo(T.st, j.axis, want.normalize().applyQuaternion(inv)).multiplyScalar(blend);
        this.cone(j, th, null);
        for (let pass = 0; pass < CLOTH_BODY.passes; pass++) this.collide(ch, ji, th, null, frame, inv, jointPos, ground);
        this.cone(j, th, null);
        j.bone.quaternion.copy(j.rest).multiply(swing(T.sqs, th));
        parentRot.multiply(j.bone.quaternion);
        const d = T.sd.copy(j.axis).applyQuaternion(parentRot);
        // what the pose on screen still breaks
        for (const fr of [0.5, 1]) {
          const p = T.rp.copy(jointPos).addScaledVector(d, j.L * fr);
          if (this.body.some((b) => p.distanceTo(closestOnSeg(T.cc, p, b.a, b.b)) < b.r + CLOTH_BODY.padM - tol)) C.proxy++;
          if (ch.sideways && Math.abs(T.hn.subVectors(p, this.mid.c).dot(this.mid.n)) > CLOTH_LIMITS.sidewaysM + tol) C.sideways++;
          if (p.y < ground - tol) C.ground++;
        }
        const snap = (Math.acos(Math.min(1, Math.max(-1, d.dot(j.shownDir)))) * 180) / Math.PI;
        if (!reset) worst = Math.max(worst, snap);
        if (judgeSnap && snap > CLOTH_LIMITS.snapDegAt60 + 1e-9) C.snap++;
        j.shownDir.copy(d);
        jointPos.addScaledVector(d, j.L);
      }
    }
    this.frame.maxSnapDeg = worst;
  }
}
