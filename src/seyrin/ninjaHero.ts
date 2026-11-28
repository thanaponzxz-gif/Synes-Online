// Dev playtest only (?ruleset=ninja-roam-1 on the vite dev server, this machine): Seyrin's P1 file plays the ninja rules in
// place of the Wayfarer placeholder. Owner order 2026-11-28; this is past the P1 scope of DES-009 (a pose viewer) and team A
// reviews it afterwards. The pair comes from the dev server's private inbox route (tools/dev/seyrinInbox.ts): it is not in the
// bundle, not in dist/, and a published build never loads this module (main.ts imports it under import.meta.env.DEV only).
// Presentation only: the plan is read from sim state (animPlan.ts); nothing goes back to the sim.
// The cloth solver is off for now (the cloth bones keep their rest pose), as Codex advised for this file.
import { Group } from 'three';
import type { World, SimEvent } from '../../shared/sim/world.ts';
import type { NinjaWorld } from '../../shared/sim/ninjaWorld.ts';
import type { View } from '../render/view.ts';
import { HeroAnimator, heroTick } from './animPlan.ts';
import { loadHero, HeroRejected, type HeroAsset, type HeroInstance } from './loader.ts';
import { standIn } from './standIns.ts';

declare const __SEYRIN_PUBLIC__: boolean;
/** dev: the private inbox route of the dev server; the public test build (owner 2026-11-28) ships the pair next to the page */
const FILES = __SEYRIN_PUBLIC__ ? './seyrin-hero/' : '/__seyrin/';
/** the actor root is drawn at 1.22 (view.ts); Seyrin is judged at world scale 1.00 = 1.5 m (team A, DES-009 §10.5 Q15) */
const ACTOR_SCALE = 1.22;

export interface SeyrinHero {
  /** a new round: the old instance is freed and a fresh one made */
  onRun(world: World): void;
  afterStep(world: World, events: readonly SimEvent[]): void;
  beforeRender(world: World, alpha: number, dt: number): void;
}

export async function loadSeyrinHero(view: View, say: (text: string) => void): Promise<SeyrinHero | null> {
  let asset: HeroAsset;
  try {
    const [glb, manifest] = await Promise.all([fetch(FILES + 'hero.glb', { cache: 'no-store' }), fetch(FILES + 'hero.manifest.json', { cache: 'no-store' })]);
    if (!glb.ok || !manifest.ok) { say('ninja-roam-1 · ตัวสำรอง Wayfarer · ไม่พบไฟล์เซย์รินใน inbox'); return null; }
    asset = await loadHero(await glb.arrayBuffer(), await manifest.text());
  } catch (err) {
    console.warn(err);
    say(`ninja-roam-1 · ตัวสำรอง Wayfarer · ${err instanceof HeroRejected ? 'ไฟล์เซย์รินไม่ผ่านการตรวจ' : 'โหลดไฟล์เซย์รินไม่ได้'}`);
    return null;
  }
  const label = `ninja-roam-1 · เซย์ริน P1 (${asset.report.stats.clips.length} คลิป) · REVIEW ยังไม่อนุมัติ`;
  say(label);
  const animator = new HeroAnimator();
  let hero: HeroInstance | null = null, holder: Group | null = null, have = new Set<string>(), fall = 0;
  const used = new Set<string>();
  addEventListener('pagehide', () => { hero?.dispose(); hero = null; asset.dispose(); });

  const api: SeyrinHero = {
    onRun(world) {
      hero?.dispose(); holder?.removeFromParent();
      hero = asset.createInstance(); have = new Set(hero.clips);
      holder = new Group(); holder.name = 'seyrin-hero'; holder.add(hero.root);
      animator.reset(); fall = 0;
      animator.observe(heroTick(world as unknown as NinjaWorld, []));
    },
    afterStep(world, events) { animator.observe(heroTick(world as unknown as NinjaWorld, events)); },
    beforeRender(world, alpha, dt) {
      if (!hero || !holder) return;
      const model = view.playerModel(world), root = model?.parent;
      if (!model || !root) return;
      if (holder.parent !== root) root.add(holder); // a rebuilt level (new round, quality change, restored context)
      model.visible = false;
      const r = standIn(animator.sample(world.tick - 2 + alpha), have);
      for (const c of r.used) if (!used.has(c)) { used.add(c); say(`${label} · ท่าแทนชั่วคราว: ${[...used].join(', ')}`); }
      hero.animate(r.plan);
      // no `down` clip yet: lie back, as the placeholder does
      const down = (world as unknown as NinjaWorld).ns.down ? 1 : 0;
      fall += (down - fall) * Math.min(1, dt * 12);
      holder.rotation.set(-fall * Math.PI * 0.45, model.rotation.y, 0, 'YXZ');
      holder.position.y = fall * 0.12;
      holder.scale.setScalar(1 / ACTOR_SCALE);
    },
  };
  (window as unknown as Record<string, unknown>).__seyrinHero = {
    snapshot: () => ({ live: asset.liveInstances, attached: !!holder?.parent, standIns: [...used], clips: [...have], geometries: view.renderer.info.memory.geometries, textures: view.renderer.info.memory.textures }),
  };
  return api;
}
