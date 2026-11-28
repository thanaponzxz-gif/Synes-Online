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
import type { NinjaWorld } from '../../shared/sim/ninjaWorld.ts';
import { CamImpulse, impulseOf } from './camImpulse.ts';
import { ninjaTones, playTones } from './ninjaSfx.ts';

const rgb = (hex: number): V3 => { const c = new Color(hex); return [c.r, c.g, c.b]; };
/** Synes palette (PROJECT_SYNES §2); #FF7A1A / #FF3355 belong to the warnings and are not here */
const PAL = { lumen: rgb(0x5cf2e6), violet: rgb(0xa78bfa), gold: rgb(0xffc857), white: rgb(0xc6faf6) };
const MAX_TRIS = 640;

export function withNinjaFx(view: View, sfx: Sfx, hero: SeyrinHero | null): SeyrinHero {
  const core = new NinjaFxCore(PAL, view.q.tier === 'low');
  const buf = new FxBuf(view.scene, MAX_TRIS, 5, true);
  buf.mesh.name = 'ninja-fx';
  const F = new Facing(), tops = new WeakMap<Object3D, number>(), box = new Box3(), a = new Vector3(), b = new Vector3();
  const cam = { r: [1, 0, 0] as V3, u: [0, 1, 0] as V3, f: [0, 0, -1] as V3 }, at = { x: 0, z: 0, top: 0 };
  let world: World | null = null, t = 0, on = true;
  view.fxOwner = 'ninja'; // DES-007 §8.4.4 / answers F8: this module owns the hit / perfect / dodge feedback and the camera impulse
  const imp = new CamImpulse(), steps = new Map<number, number>(), reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pt = { x: 0, y: 0, vis: false }, pt2 = { x: 0, y: 0, vis: false };
  /** the screen factor S of DES-008 (the numbers use the safe area; this uses the window: the same on a screen without notches) */
  const S = () => Math.min(1.25, Math.max(0.85, Math.min(innerWidth / 844, innerHeight / 390)));
  const screen = {
    S: 1,
    pxPerM(x: number, y: number, z: number) { view.project(x, y, z, pt); view.project(x + cam.r[0], y + cam.r[1], z + cam.r[2], pt2); return pt.vis && pt2.vis ? Math.hypot(pt2.x - pt.x, pt2.y - pt.y) : 0; },
  };
  const actorAt = (id: number) => {
    const m = view.actorModel(id), root = m?.parent;
    if (!m || !root) return null;
    const shown = view.actorTopM.get(id); // an actor drawn by another module (the crab): the top of what is shown
    if (shown !== undefined) { at.x = root.position.x; at.z = root.position.z; at.top = shown; return at; }
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
      const nw = world as unknown as NinjaWorld;
      screen.S = S();
      core.draw(buf, t, cam, actorAt, { id: world.player.id, fx: world.player.fx, fz: world.player.fz, counterReady: world.tick - 1 < nw.ns.counterUntil, down: !!nw.ns.down }, screen);
    }
    buf.end();
  };
  (window as unknown as Record<string, unknown>).__ninjaFx = {
    snapshot: () => ({ tris: buf.n, visible: buf.mesh.visible, low: core.low, blade: !!hero?.blade?.(), last: core.last, impulsePx: view.impulsePx, reduced: reduced.matches }),
    /** QA: draw calls of this very frame with and without the batch */
    calls: () => {
      const r = view.renderer, was = on, n = () => { r.render(view.scene, view.camera); return r.info.render.calls; };
      on = true; const withFx = n(); on = false; const without = n(); on = was;
      return { withFx, without };
    },
  };
  return {
    blade: () => hero?.blade?.() ?? null,
    onRun(w) { world = w; core.reset(); imp.reset(); steps.clear(); view.impulsePx = 0; hero?.onRun(w); },
    afterStep(w, events: readonly SimEvent[]) {
      hero?.afterStep(w, events);
      const tick = w.tick - 1, nw = w as unknown as NinjaWorld;
      core.tick(tick); core.player(tick, w.player.x, w.player.z, nw.ns.action?.kind === 'dodge'); core.observe(events);
      for (const e of events) {
        if (e.t === 'action-start' && e.kind === 'attack') { steps.set(e.id, e.step); if (steps.size > 8) steps.delete(steps.keys().next().value!); }
        if (e.t === 'respawn') imp.reset();
        imp.event(tick, impulseOf(e, w.player.id, (id) => steps.get(id)));
      }
      playTones(sfx, ninjaTones(events));
    },
    beforeRender(w, alpha, dt) {
      world = w; t = w.tick - 2 + alpha;
      // Medium only; Low and reduced motion get no camera impulse at all (§8.4.4)
      view.impulsePx = imp.offset(t, view.q.tier !== 'low' && !reduced.matches) * S();
      hero?.beforeRender(w, alpha, dt);
    },
  };
}
