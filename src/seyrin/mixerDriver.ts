// Synes Online — puts an AnimPlan (animPlan.ts) on Seyrin's skeleton through the instance's AnimationMixer (DES-007 §8.3).
// Each clip is split into an upper-body and a lower-body copy so the legs can walk under a combo; hit_add becomes an additive
// clip on chest/neck/head only. Tracks of `root` (root motion is 0 by contract), the cloth bones (the solver owns them),
// sockets and anchors are dropped. Every action is seeked (time set, never advanced by the mixer), so the pose is always the
// plan's sim-clock time. A clip the file does not have is reported and given to nothing else (DES-009 §3.2: no stand-ins).
import * as THREE from 'three';
import type { AnimPlan, ClipPose } from './animPlan.ts';
import { BODY_BONES } from './spec.ts';

export const LOWER_BONES: readonly string[] = ['pelvis', 'thigh_l', 'thigh_r', 'shin_l', 'shin_r', 'foot_l', 'foot_r', 'toe_l', 'toe_r'];
export const UPPER_BONES: readonly string[] = BODY_BONES.filter((b) => b !== 'root' && !LOWER_BONES.includes(b));
export const ADDITIVE_BONES: readonly string[] = ['chest', 'neck', 'head'];
type Group = 'upper' | 'lower' | 'add';
const GROUPS: [Group, ReadonlySet<string>][] = [['upper', new Set(UPPER_BONES)], ['lower', new Set(LOWER_BONES)], ['add', new Set(ADDITIVE_BONES)]];

export class MixerDriver {
  private actions = new Map<string, THREE.AnimationAction>();
  private clips: THREE.AnimationClip[] = [];
  private missing = new Set<string>();
  private pelvis: THREE.Object3D | null;
  private lift = 0;
  private mixer: THREE.AnimationMixer;

  constructor(mixer: THREE.AnimationMixer, root: THREE.Object3D, clips: readonly THREE.AnimationClip[]) {
    this.mixer = mixer;
    this.pelvis = root.getObjectByName('pelvis') ?? null;
    for (const clip of clips) for (const [g, bones] of GROUPS) {
      if ((g === 'add') !== (clip.name === 'hit_add')) continue;
      const tracks = clip.tracks.filter((t) => bones.has(THREE.PropertyBinding.parseTrackName(t.name).nodeName)).map((t) => t.clone());
      const sub = new THREE.AnimationClip(`${clip.name}#${g}`, clip.duration, tracks);
      if (g === 'add') THREE.AnimationUtils.makeClipAdditive(sub); // against its own first frame
      const a = mixer.clipAction(sub, root);
      a.setEffectiveTimeScale(0); a.setEffectiveWeight(0); a.play();
      this.actions.set(`${clip.name}|${g}`, a); this.clips.push(sub);
    }
  }

  /** set every action from the plan and pose the skeleton; returns the clips the plan asked for that the file does not have */
  apply(plan: AnimPlan): string[] {
    for (const a of this.actions.values()) a.setEffectiveWeight(0);
    this.set('upper', plan.upper); this.set('lower', plan.lower); this.set('add', plan.additive);
    if (this.pelvis) this.pelvis.position.y -= this.lift; // undo last frame's lift if no clip rewrites the pelvis
    this.mixer.update(0);
    if (this.pelvis) this.pelvis.position.y += plan.pelvisLift;
    this.lift = plan.pelvisLift;
    return [...this.missing];
  }

  /** all weights to zero (another viewer, e.g. the P1 single-clip pose, takes over) */
  idle(): void { for (const a of this.actions.values()) a.setEffectiveWeight(0); }

  dispose(): void {
    for (const a of this.actions.values()) a.stop();
    for (const c of this.clips) this.mixer.uncacheClip(c);
    this.actions.clear(); this.clips = [];
  }

  private set(g: Group, poses: readonly ClipPose[]) {
    const weight = new Map<THREE.AnimationAction, { w: number; time: number; best: number }>();
    for (const p of poses) {
      const a = this.actions.get(`${p.clip}|${g}`);
      if (!a) { this.missing.add(p.clip); continue; }
      const s = weight.get(a); // the same clip twice at two times: the heavier one's time, both weights
      if (!s) weight.set(a, { w: p.weight, time: p.time, best: p.weight });
      else { s.w += p.weight; if (p.weight > s.best) { s.best = p.weight; s.time = p.time; } }
    }
    for (const [a, s] of weight) { a.time = Math.min(Math.max(s.time, 0), a.getClip().duration); a.setEffectiveWeight(s.w); }
  }
}
