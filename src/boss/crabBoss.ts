// The crab picture of the boss in `ninja-roam-1` (DES-010), dev server on this machine only: main.ts loads this module under
// import.meta.env.DEV and bossPictureFor() only, so a published build and every other ruleset keep Prismback untouched.
// Presentation only: the sim's boss is still kind `prismback` with its own numbers, hitbox and warnings; nothing goes back.
// The C1 pair (REVIEW) comes from the dev server's private inbox route; it is not in the bundle and not in dist/.
// A file that is missing or refused leaves the old boss on screen, and the label says so.
import { Color, DynamicDrawUsage, Group, InstancedMesh, Matrix4, MeshLambertMaterial, OctahedronGeometry, Quaternion, Vector3 } from 'three';
import type { World, SimEvent } from '../../shared/sim/world.ts';
import type { View } from '../render/view.ts';
import { FxBuf } from '../render/vfxskill.ts';
import type { SeyrinHero } from '../seyrin/ninjaHero.ts';
import { BossClock } from './bossClock.ts';
import { CrabFxCore, type V3 } from './crabFxCore.ts';
import { loadBoss, BossRejected, type BossAsset, type BossInstance, type BossPose } from './loader.ts';
import { snapBoss } from './snap.ts';

const FILES = '/__seyrin/';
/** the boss's actor root is drawn at 1.05 (view.ts); the crab is authored at world scale (DES-010 §3.1: top 2.84 m) */
const ROOT_SCALE = 1.05;
/** DES-010 §4.2: the three ✦ circle 0.18 m above the crystal's top, radius 0.55 m */
const STARS = { aboveM: 0.18, radiusM: 0.55 };
const MAX_LINE_TRIS = 320, MAX_INST = 32;
const rgb = (hex: number): V3 => { const c = new Color(hex); return [c.r, c.g, c.b]; };
/** DES-010 §4.2 palette; #FF7A1A / #FF3355 belong to the warnings and are not here */
const PAL = { lumen: rgb(0x5cf2e6), violet: rgb(0xa78bfa), stone: rgb(0x526a70), dust: rgb(0x9aa79d) };

function label(): (text: string) => void {
  const tag = document.createElement('div');
  tag.id = 'boss-qa';
  Object.assign(tag.style, { position: 'fixed', left: '50%', top: '24px', transform: 'translateX(-50%)', padding: '2px 10px', font: '600 12px system-ui, sans-serif',
    color: '#1b1430', background: '#ffc857', borderRadius: '10px', zIndex: '40', pointerEvents: 'none', whiteSpace: 'nowrap' });
  document.body.appendChild(tag);
  return (text) => { tag.textContent = text; };
}

/** wraps the ninja hero hooks (or none) with the crab boss; returns the same hooks when the crab cannot be shown */
export async function withCrabBoss(view: View, inner: SeyrinHero | null): Promise<SeyrinHero | null> {
  const say = label();
  let asset: BossAsset;
  try {
    const [glb, manifest] = await Promise.all([fetch(FILES + 'boss.glb', { cache: 'no-store' }), fetch(FILES + 'boss.manifest.json', { cache: 'no-store' })]);
    if (!glb.ok || !manifest.ok) { say('บอส: ปริซึมแบ็กเดิม (สำรอง) · ไม่พบไฟล์ปู C1 ใน inbox'); return inner; }
    asset = await loadBoss(await glb.arrayBuffer(), await manifest.text(), 'combat');
  } catch (err) {
    console.warn(err);
    const why = err instanceof BossRejected ? 'ไฟล์ปูไม่ผ่านการตรวจ: ' + err.report.items.filter((i) => i.level === 'block' && !i.ok).map((i) => i.id).join(', ') : 'โหลดไฟล์ปูไม่ได้';
    say(`บอส: ปริซึมแบ็กเดิม (สำรอง) · ${why}`);
    (window as unknown as Record<string, unknown>).__crabBoss = { snapshot: () => ({ loaded: false, why }) };
    return inner;
  }
  const S = asset.report.stats, failedChecks = asset.report.items.filter((i) => i.level === 'check' && !i.ok).map((i) => i.id);
  say(`บอส: ปูหิน C1 (${S.clips.length} คลิป · ${S.tris} tris) · REVIEW ยังไม่อนุมัติ${failedChecks.length ? ' · ข้อที่ไม่ผ่าน: ' + failedChecks.join(', ') : ''}`);

  const clock = new BossClock(), fx = new CrabFxCore(PAL, view.q.tier === 'low');
  const lines = new FxBuf(view.scene, MAX_LINE_TRIS, 5, true); lines.mesh.name = 'crab-fx-lines';
  const shardGeo = new OctahedronGeometry(0.5, 0), shardMat = new MeshLambertMaterial({ flatShading: true, fog: false });
  const shards = new InstancedMesh(shardGeo, shardMat, MAX_INST);
  shards.name = 'crab-fx-shards'; shards.instanceMatrix.setUsage(DynamicDrawUsage); shards.frustumCulled = false; shards.castShadow = false; shards.renderOrder = 5;
  shards.count = 0; shards.visible = false; shards.setColorAt(0, new Color(1, 1, 1)); view.scene.add(shards);
  const M = new Matrix4(), Q = new Quaternion(), P = new Vector3(), Sc = new Vector3(), UP = new Vector3(0, 1, 0), C = new Color(), W = new Vector3();
  let nInst = 0;
  const put = (x: number, y: number, z: number, sx: number, sy: number, sz: number, yaw: number, color: V3) => {
    if (nInst >= MAX_INST) return;
    M.compose(P.set(x, y, z), Q.setFromAxisAngle(UP, yaw), Sc.set(sx, sy, sz)); shards.setMatrixAt(nInst, M);
    shards.setColorAt(nInst, C.setRGB(color[0], color[1], color[2])); nInst++;
  };

  let boss: BossInstance | null = null, holder: Group | null = null, bossId = -1, started = false, t = 0, world: World | null = null, fxOn = true;
  let poses: BossPose[] = [], opacity = 1;
  const cpu: number[] = []; // ms per frame spent in the boss controller + mixer (DES-010 §5.3 item 7)
  const free = () => { boss?.dispose(); boss = null; holder?.removeFromParent(); holder = null; if (bossId >= 0) view.starsAt.delete(bossId); };
  addEventListener('pagehide', () => { free(); asset.dispose(); lines.dispose(); shards.removeFromParent(); shardGeo.dispose(); shardMat.dispose(); });

  const before = view.scene.onBeforeRender;
  view.scene.onBeforeRender = (...args) => {
    before.apply(view.scene, args);
    const t0 = performance.now();
    lines.begin(); nInst = 0;
    if (world && boss && holder?.parent && fxOn) {
      fx.low = view.q.tier === 'low';
      const sock = boss.sockets.socket_fx_shell;
      const shell: V3 | null = sock ? (sock.getWorldPosition(W), [W.x, W.y, W.z]) : null;
      fx.draw(t, clock, fx.low ? null : lines, put, shell);
    }
    lines.end();
    shards.count = nInst; shards.visible = nInst > 0;
    if (nInst) { shards.instanceMatrix.needsUpdate = true; if (shards.instanceColor) shards.instanceColor.needsUpdate = true; }
    if (cpu.length) cpu[cpu.length - 1] += performance.now() - t0;
  };

  const api: SeyrinHero = {
    blade: () => inner?.blade?.() ?? null,
    onRun(w) {
      inner?.onRun(w);
      free();
      world = w; bossId = w.boss.id; started = w.bossStarted;
      boss = asset.createInstance();
      holder = new Group(); holder.name = 'crab-boss'; holder.add(boss.root); holder.scale.setScalar(1 / ROOT_SCALE);
      view.starsAt.set(bossId, [(S.maxYM + STARS.aboveM) / ROOT_SCALE, STARS.radiusM / ROOT_SCALE]);
      clock.reset(); fx.reset();
      clock.observe(snapBoss(w));
    },
    afterStep(w, events: readonly SimEvent[]) {
      inner?.afterStep(w, events);
      // the fight was reset (the player came back at the spring): nothing that was pending may land afterwards
      const reset = started && !w.bossStarted && w.boss.alive;
      started = w.bossStarted;
      if (reset) fx.reset();
      clock.observe(snapBoss(w), reset);
      for (const e of events) if (e.t === 'pillar-break') { const p = w.level.pillars[e.i]; if (p) fx.pillarBreak(w.tick - 1, p.x, p.z); }
    },
    beforeRender(w, alpha, dt) {
      inner?.beforeRender(w, alpha, dt);
      if (!boss || !holder) api.onRun(w);
      if (!boss || !holder) return;
      const t0 = performance.now();
      world = w; t = w.tick - 2 + alpha;
      const model = view.actorNode(bossId), root = model?.parent;
      if (model && root) {
        if (holder.parent !== root) root.add(holder); // a rebuilt level (new round, quality change, restored context)
        model.visible = false;                         // the old boss is not drawn under the crab
        holder.rotation.y = model.rotation.y;          // the view's own smoothed facing
        poses = clock.sample(t);
        boss.apply(poses);
        opacity = view.occluderFade(bossId);           // 28% while it hides the player (the view's own rule)
        boss.setOpacity(opacity);
      }
      cpu.push(performance.now() - t0); if (cpu.length > 1200) cpu.shift();
    },
  };
  (window as unknown as Record<string, unknown>).__crabBoss = {
    snapshot: () => ({
      loaded: true, accepted: asset.report.accepted, failedChecks, stats: S, live: asset.liveInstances, attached: !!holder?.parent, visible: !!holder?.parent?.visible,
      tick: t, state: clock.stateAt(t), poses, opacity, fx: fx.last, low: fx.low, lineTris: lines.n, instances: nInst,
      stars: view.starsAt.get(bossId) ?? null, tracks: [...clock.teleTracks()].map((k) => ({ id: k.id, atk: k.atk, impact: k.impact, impactTick: k.impactTick, x: k.x, z: k.z })),
      geometries: view.renderer.info.memory.geometries, textures: view.renderer.info.memory.textures,
    }),
    /** QA: draw calls of this very frame with and without the crab's effect batches */
    calls: () => {
      const r = view.renderer, was = fxOn, n = () => { r.render(view.scene, view.camera); return r.info.render.calls; };
      fxOn = true; const withFx = n(); fxOn = false; const without = n(); fxOn = was;
      return { withFx, without };
    },
    /** QA: ms per frame of the boss controller + mixer + effect fill over the last frames */
    cpu: () => { const s = cpu.slice(0, -1).sort((a, b) => a - b); return { frames: s.length, p50: s[Math.floor(s.length * 0.5)] ?? 0, p95: s[Math.floor(s.length * 0.95)] ?? 0, max: s[s.length - 1] ?? 0 }; },
    cpuReset: () => { cpu.length = 0; },
  };
  return api;
}
