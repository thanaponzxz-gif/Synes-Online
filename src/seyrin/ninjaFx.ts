// Player VFX + sounds of `ninja-roam-1` in the scene (DES-007 §3.4). Loaded only with the ninja ruleset (main.ts imports it
// under NINJA_OK), so a normal published build carries none of it and the old rulesets draw exactly as before.
// One pre-allocated batch for the whole set = +1 draw call on Medium and Low (ceiling +5 / +3). renderOrder 5 with depth test,
// under the telegraphs (renderOrder 10, no depth test): a warning always draws over these (ADR-005).
// The batch is filled in scene.onBeforeRender: three.js calls it after the frame's world matrices are final, so the blade
// sockets, the camera and the actors are this frame's, not the last one's.
import { Box3, Color, Vector3, type Object3D } from 'three';
import type { World, SimEvent } from '../../shared/sim/world.ts';
import type { View } from '../render/view.ts';
import { FxBuf, Facing } from '../render/vfxskill.ts';
import type { Sfx } from '../audio.ts';
import type { SeyrinHero } from './ninjaHero.ts';
import { NinjaFxCore, type V3 } from './ninjaFxCore.ts';
import { ninjaTones, playTones } from './ninjaSfx.ts';

const rgb = (hex: number): V3 => { const c = new Color(hex); return [c.r, c.g, c.b]; };
/** Synes palette (PROJECT_SYNES §2); #FF7A1A / #FF3355 belong to the warnings and are not here */
const PAL = { lumen: rgb(0x5cf2e6), violet: rgb(0xa78bfa), gold: rgb(0xffc857) };
const MAX_TRIS = 640;

export function withNinjaFx(view: View, sfx: Sfx, hero: SeyrinHero | null): SeyrinHero {
  const core = new NinjaFxCore(PAL, view.q.tier === 'low');
  const buf = new FxBuf(view.scene, MAX_TRIS, 5, true);
  buf.mesh.name = 'ninja-fx';
  const F = new Facing(), tops = new WeakMap<Object3D, number>(), box = new Box3(), a = new Vector3(), b = new Vector3();
  const cam = { r: [1, 0, 0] as V3, u: [0, 1, 0] as V3, f: [0, 0, -1] as V3 }, at = { x: 0, z: 0, top: 0 };
  let world: World | null = null, t = 0, on = true;
  const actorAt = (id: number) => {
    const m = view.actorModel(id), root = m?.parent;
    if (!m || !root) return null;
    let top = tops.get(m);
    if (top === undefined) { top = box.setFromObject(m).max.y - m.position.y; tops.set(m, top); } // measured once, at the pose it has then
    at.x = root.position.x; at.z = root.position.z; at.top = top + m.position.y;
    return at;
  };
  const before = view.scene.onBeforeRender;
  view.scene.onBeforeRender = (...args) => {
    before.apply(view.scene, args);
    buf.begin();
    if (world && on) {
      const sockets = hero?.blade?.();
      if (sockets) { sockets[0].getWorldPosition(a); sockets[1].getWorldPosition(b); core.blade(t, [a.x, a.y, a.z], [b.x, b.y, b.z]); }
      F.from(view.camera);
      cam.r = [F.r.x, F.r.y, F.r.z]; cam.u = [F.u.x, F.u.y, F.u.z]; cam.f = [F.f.x, F.f.y, F.f.z];
      core.low = view.q.tier === 'low';
      core.draw(buf, t, cam, actorAt);
    }
    buf.end();
  };
  (window as unknown as Record<string, unknown>).__ninjaFx = {
    snapshot: () => ({ tris: buf.n, visible: buf.mesh.visible, low: core.low, blade: !!hero?.blade?.() }),
    /** QA: draw calls of this very frame with and without the batch */
    calls: () => {
      const r = view.renderer, was = on, n = () => { r.render(view.scene, view.camera); return r.info.render.calls; };
      on = true; const withFx = n(); on = false; const without = n(); on = was;
      return { withFx, without };
    },
  };
  return {
    blade: () => hero?.blade?.() ?? null,
    onRun(w) { world = w; core.reset(); hero?.onRun(w); },
    afterStep(w, events: readonly SimEvent[]) {
      hero?.afterStep(w, events);
      core.tick(w.tick - 1); core.observe(events);
      playTones(sfx, ninjaTones(events));
    },
    beforeRender(w, alpha, dt) { world = w; t = w.tick - 2 + alpha; hero?.beforeRender(w, alpha, dt); },
  };
}
