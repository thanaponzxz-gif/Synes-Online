// DES-009 §2.2 / §3.3, P1: "ตัวอย่างเซย์ริน · ยังไม่ใช่รอบเล่น" — a pose viewer for the owner's machine only.
// It shows a Seyrin file picked by hand, in the game's own scene, camera and light. It is not a run: the world is built
// to be looked at and is never stepped, nothing calls /run/start or /run/finish, there is no input log and no reward.
// The files are read into memory only (no path fetch, no upload, no storage). Loaded only by a dynamic import that
// production builds drop (see main.ts).
import { Group, type Object3D } from 'three';
import { World } from '../../shared/sim/world.ts';
import { DEFAULT_VARIANT } from '../../shared/sim/variant.ts';
import type { View } from '../render/view.ts';
import { TIERS } from '../render/quality.ts';
import { previewAllowed } from './gate.ts';
import { loadHero, HeroRejected, type HeroAsset, type HeroInstance } from './loader.ts';
import type { CheckItem, InspectReport } from './inspect.ts';
import { PreviewClock } from './previewClock.ts';
import { FPS, PREVIEW_CLIPS, STAGE_CLIPS, type ClipSpec, type Stage } from './spec.ts';

export const PREVIEW_LABEL = 'ตัวอย่างเซย์ริน · ยังไม่ใช่รอบเล่น';
const LEVEL_SEED = 7; // the same scenery seed as a normal run (main.ts)
/** the current hero is drawn at 1.22x (view.ts); the delivered file is 1.5 m tall. Team A (DES-009 §10.5 Q15): P1/P2 are judged at
 *  world scale 1.00 (1.5 m); 1.22 stays only as a side-by-side comparison with the old hero, not the acceptance size. */
const GAME_SCALE = 1.22;
const ACCEPT_SCALE = 1;

const CSS = `
#sp-root{position:fixed;inset:0;pointer-events:none;z-index:60;font:12px/1.35 system-ui,"Segoe UI","Noto Sans Thai",sans-serif;color:#fff}
#sp-root *{box-sizing:border-box}
#sp-banner{position:absolute;top:6px;left:50%;transform:translateX(-50%);background:rgba(24,28,58,.86);border:1px solid rgba(255,255,255,.3);border-radius:99px;padding:4px 14px;font-size:13px;font-weight:700;white-space:nowrap}
#sp-state{position:absolute;top:36px;left:50%;transform:translateX(-50%);background:rgba(24,28,58,.72);border-radius:6px;padding:2px 10px;max-width:60vw;text-align:center}
#sp-panel{position:absolute;top:6px;right:6px;bottom:6px;width:236px;overflow:auto;pointer-events:auto;background:rgba(24,28,58,.9);border:1px solid rgba(255,255,255,.28);border-radius:8px;padding:8px;-webkit-user-select:text;user-select:text;touch-action:pan-y}
#sp-panel h4{margin:8px 0 4px;font-size:11px;color:#a9b4e6;font-weight:600}
#sp-panel h4:first-child{margin-top:0}
#sp-panel button{background:#39427a;border:1px solid rgba(255,255,255,.25);border-radius:5px;padding:4px 7px;margin:0 3px 3px 0;font-size:11px;min-height:26px}
#sp-panel button[aria-pressed="true"]{background:#5cf2e6;color:#10142e;font-weight:700}
#sp-panel button:disabled{opacity:.45;cursor:default}
#sp-panel label{display:block;margin-bottom:3px}
#sp-panel input[type=file]{display:block;width:100%;font-size:11px;color:#fff}
#sp-time,#sp-perf{font-family:ui-monospace,Consolas,monospace;white-space:pre-wrap}
#sp-time.marker{color:#ffc857;font-weight:700}
#sp-report ul{margin:2px 0;padding:0;list-style:none}
#sp-report li{margin:0 0 3px;overflow-wrap:anywhere}
#sp-report .bad{color:#ffc857}
#sp-toggle{position:absolute;left:6px;bottom:6px;pointer-events:auto;background:#39427a;border:1px solid rgba(255,255,255,.25);border-radius:5px;padding:5px 10px;font-size:11px;color:#fff}
`;

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...children: (Node | string)[]) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  n.append(...children);
  return n;
};

export async function startSeyrinPreview(view: View, hostname: string, query: URLSearchParams): Promise<boolean> {
  if (!previewAllowed(import.meta.env.DEV, hostname, query)) return false;

  // ---- scene: the game's own level and camera at the start point; this World is never stepped --------------------------
  const world = new World(1, { ...DEFAULT_VARIANT }, 'roam-1');
  let quality: 'medium' | 'low' = query.get('q') === 'low' ? 'low' : 'medium';
  let asset: HeroAsset | null = null, hero: HeroInstance | null = null;
  let holder: Group | null = null, hidden: Object3D[] = [];
  let clock = new PreviewClock(PREVIEW_CLIPS);
  let specs: readonly ClipSpec[] = PREVIEW_CLIPS;
  let scale: number = ACCEPT_SCALE, yawDeg = 180; // 0 = facing the camera
  let report: InspectReport | null = null;
  let loadSeq = 0, loading = false, firstFrameMs: number | null = null, pendingFirstFrame = false;
  let callsPlaceholder = 0, trisPlaceholder = 0;

  /** put the loaded hero where the placeholder stands (and hide the placeholder); safe to call again after a rebuild */
  const attach = () => {
    if (!hero) return;
    const model = view.playerModel(world);
    if (!model) return;
    holder?.removeFromParent();
    holder = new Group(); holder.name = 'seyrin-preview';
    hidden = model.children.filter((c) => c.visible);
    for (const c of hidden) c.visible = false;
    holder.add(hero.root);
    model.add(holder);
    pendingFirstFrame = true;
  };
  const detach = () => {
    holder?.removeFromParent(); holder = null;
    for (const c of hidden) c.visible = true;
    hidden = [];
  };
  const build = () => { detach(); view.setQuality(TIERS[quality]); view.buildLevel(world, LEVEL_SEED); attach(); };
  const unload = () => {
    loadSeq++;
    detach();
    hero?.dispose(); asset?.dispose();
    hero = null; asset = null; report = null; firstFrameMs = null;
    specs = PREVIEW_CLIPS; clock = new PreviewClock(specs);
    drawClips(); drawReport(null, null); setState('ตัวสำรอง (Wayfarer) · ยังไม่ได้เลือกไฟล์เซย์ริน');
  };

  async function load(glbFile: File, manifestFile: File) {
    unload();
    const seq = loadSeq;
    loading = true; syncButtons(); setState('กำลังตรวจไฟล์…');
    try {
      const [bytes, text] = await Promise.all([glbFile.arrayBuffer(), manifestFile.text()]);
      const t0 = performance.now();
      const next = await loadHero(bytes, text);
      if (seq !== loadSeq) { next.dispose(); return; } // a newer load or unload happened meanwhile
      asset = next; hero = next.createInstance(); report = next.report;
      specs = STAGE_CLIPS[report.stats.stage as Stage]; clock = new PreviewClock(specs);
      hero.pose('idle', 0);
      attach();
      drawClips(); drawReport(report, performance.now() - t0);
      const bad = report.items.filter((i) => !i.ok).length;
      setState(`แสดงไฟล์เซย์ริน (${report.stats.stage}) · REVIEW ยังไม่อนุมัติ${bad ? ` · ไม่ผ่านเกณฑ์วัด ${bad} ข้อ` : ''}`);
    } catch (err) {
      if (seq !== loadSeq) return;
      // ADR-003 fallback: keep the registered placeholder and say that the asset has not passed
      report = err instanceof HeroRejected ? err.report : null;
      drawReport(report, null, err instanceof HeroRejected ? null : String((err as Error)?.message ?? err));
      setState('โหลดไม่ผ่าน · แสดงตัวสำรอง (Wayfarer) · ยังไม่ผ่าน asset');
    } finally {
      if (seq === loadSeq) { loading = false; syncButtons(); }
    }
  }

  // ---- panel (listeners are added once, here) --------------------------------------------------------------------------
  document.head.append(el('style', {}, CSS));
  const state = el('div', { id: 'sp-state', role: 'status' });
  const setState = (s: string) => { state.textContent = s; };
  const glbIn = el('input', { type: 'file', accept: '.glb', id: 'sp-glb' });
  const manIn = el('input', { type: 'file', accept: '.json', id: 'sp-manifest' });
  const button = (label: string, onClick: () => void, attrs: Record<string, string> = {}) => {
    const b = el('button', { type: 'button', ...attrs }, label);
    b.addEventListener('click', () => { onClick(); syncButtons(); });
    return b;
  };
  const loadBtn = button('โหลด', () => { const g = glbIn.files?.[0], m = manIn.files?.[0]; if (g && m) void load(g, m); else setState('เลือกทั้งไฟล์ GLB และ manifest'); }, { id: 'sp-load' });
  const unloadBtn = button('นำออก', unload, { id: 'sp-unload' });
  const clips = el('div', { id: 'sp-clips' });
  const pauseBtn = button('หยุด', () => { clock.paused = !clock.paused; }, { id: 'sp-pause' });
  const time = el('div', { id: 'sp-time' });
  const yawButtons = ([['หน้า', 0], ['ข้าง', 90], ['หลัง', 180], ['อีกข้าง', 270]] as const).map(([l, d]) => button(l, () => { yawDeg = d; }, { 'data-yaw': String(d) }));
  const turn = [button('↺ 15°', () => { yawDeg = (yawDeg + 345) % 360; }, { 'data-turn': '-15' }), button('↻ 15°', () => { yawDeg = (yawDeg + 15) % 360; }, { 'data-turn': '15' })];
  const qButtons = (['medium', 'low'] as const).map((v) => button(v === 'medium' ? 'กลาง' : 'ต่ำ', () => { if (quality !== v) { quality = v; build(); } }, { 'data-q': v }));
  const sButtons = ([[ACCEPT_SCALE, '1.00 (ตามไฟล์ · ขนาดตรวจรับ)'], [GAME_SCALE, '1.22 (เทียบตัวเดิม · ไม่ใช่ขนาดตรวจรับ)']] as const).map(([v, l]) => button(l, () => { scale = v; }, { 'data-scale': String(v) }));
  const perf = el('div', { id: 'sp-perf' });
  const reportBox = el('div', { id: 'sp-report' });
  const panel = el('aside', { id: 'sp-panel' },
    el('h4', {}, 'ไฟล์จากเครื่องนี้ (อ่านในหน่วยความจำเท่านั้น)'), el('label', {}, 'GLB', glbIn), el('label', {}, 'manifest', manIn), loadBtn, unloadBtn,
    el('h4', {}, 'ท่า'), clips,
    el('h4', {}, 'เวลา (tick เทียบ 30 Hz)'), pauseBtn, button('−1 tick', () => { clock.paused = true; clock.step(-1); }, { id: 'sp-prev' }), button('+1 tick', () => { clock.paused = true; clock.step(1); }, { id: 'sp-next' }), time,
    el('h4', {}, 'หันตัว'), ...yawButtons, ...turn,
    el('h4', {}, 'คุณภาพ / สเกลที่วาด'), ...qButtons, el('br'), ...sButtons,
    el('h4', {}, 'เครื่องนี้ (ไม่ใช่ผลมือถือ)'), perf,
    el('h4', {}, 'ผลตรวจไฟล์'), reportBox);
  const toggle = el('button', { id: 'sp-toggle', type: 'button' }, 'ซ่อน/แสดงแผง');
  toggle.addEventListener('click', () => panel.classList.toggle('hidden'));
  const ui = el('div', { id: 'sp-root' }, el('div', { id: 'sp-banner' }, PREVIEW_LABEL), state, panel, toggle);

  function drawClips() {
    clips.replaceChildren(...specs.map((s) => button(s.name, () => { clock.select(s.name); clock.paused = false; }, { 'data-clip': s.name })));
    syncButtons();
  }
  function syncButtons() {
    const cur = clock.sample().clip;
    for (const b of clips.querySelectorAll('button')) { b.setAttribute('aria-pressed', String(b.dataset.clip === cur)); b.disabled = !hero; }
    for (const b of yawButtons) b.setAttribute('aria-pressed', String(Number(b.dataset.yaw) === yawDeg));
    for (const b of qButtons) b.setAttribute('aria-pressed', String(b.dataset.q === quality));
    for (const b of sButtons) b.setAttribute('aria-pressed', String(Number(b.dataset.scale) === scale));
    pauseBtn.textContent = clock.paused ? 'เล่นต่อ' : 'หยุด';
    loadBtn.disabled = loading;
    unloadBtn.disabled = !hero && !loading;
  }
  function drawReport(r: InspectReport | null, loadMs: number | null, error: string | null = null) {
    reportBox.replaceChildren();
    if (error) reportBox.append(el('div', { class: 'bad' }, error));
    if (!r) return;
    const group = (title: string, items: CheckItem[]) => items.length && reportBox.append(el('div', {}, title),
      el('ul', {}, ...items.map((i) => el('li', { class: i.ok ? 'ok' : 'bad', 'data-check': i.id, 'data-ok': String(i.ok) }, `${i.level === 'info' ? '·' : i.ok ? '✔' : '✘'} ${i.id}: ${i.detail}`))));
    reportBox.append(el('div', {}, `${r.accepted ? 'รับเข้าแสดง' : 'ไม่รับ'} · ${r.stats.bytes} bytes · ${r.stats.tris} tris · ${r.stats.primitives} primitives`),
      el('div', {}, `sha256 ${r.stats.sha256.slice(0, 16)}…${loadMs === null ? '' : ` · โหลด ${loadMs.toFixed(0)} ms`}`));
    group('ต้องผ่านจึงแสดง', r.items.filter((i) => i.level === 'block'));
    group('เกณฑ์ส่งงาน (วัดแล้วรายงาน)', r.items.filter((i) => i.level === 'check'));
    group('ข้อมูล', r.items.filter((i) => i.level === 'info'));
  }

  // ---- loop -------------------------------------------------------------------------------------------------------------
  document.querySelector('#start')!.classList.add('hidden'); // the HUD stays hidden: no game button can act here
  document.body.append(ui);
  build();
  unload();
  const frames: number[] = [];
  let last = performance.now(), nextText = 0;
  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') clock.advance(0, false); });
  document.querySelector('#game')!.addEventListener('webglcontextrestored', () => build());
  const frame = (now: number) => {
    requestAnimationFrame(frame);
    const dt = Math.max(0, Math.min(0.25, (now - last) / 1000)); last = now;
    if (dt > 0) { frames.push(dt * 1000); if (frames.length > 180) frames.shift(); }
    const before = clock.sample().clip;
    clock.advance(dt, document.visibilityState === 'visible');
    const s = clock.sample();
    if (s.clip !== before) syncButtons(); // a one-shot clip returned to idle
    if (hero) {
      hero.pose(s.clip, s.seconds);
      if (holder?.parent) {
        const p = holder.parent, root = p.parent!;
        const toCamera = Math.atan2(view.camera.position.x - root.position.x, view.camera.position.z - root.position.z);
        holder.rotation.y = toCamera + (yawDeg * Math.PI) / 180 - p.rotation.y;
        holder.scale.setScalar(scale / GAME_SCALE); // the actor root is already drawn at GAME_SCALE
      }
    }
    const t0 = pendingFirstFrame ? performance.now() : 0;
    view.render(world, 1, dt);
    if (pendingFirstFrame) { pendingFirstFrame = false; firstFrameMs = performance.now() - t0; }
    if (!hero) { callsPlaceholder = view.renderer.info.render.calls; trisPlaceholder = view.renderer.info.render.triangles; }
    if (now < nextText) return;
    nextText = now + 100;
    const spec = specs.find((c) => c.name === s.clip)!;
    const marks = Object.entries(spec.markers ?? {}).map(([k, v]) => `${k} ${v.join('/')}`).concat((spec.poseHolds ?? []).map((h) => `hold ${h.join('→')}`), spec.yLift ? [`lift ${spec.yLift.fromTick}-${spec.yLift.toTick} peak ${spec.yLift.peakTick}`] : []);
    time.textContent = `${s.clip} · tick ${s.tick}/${spec.ticks}${spec.loop ? ' loop' : ''} (${(s.seconds).toFixed(3)} s @${FPS})\n${marks.join(' · ') || 'ไม่มี marker'}`;
    time.classList.toggle('marker', Object.values(spec.markers ?? {}).some((v) => v.includes(s.tick)));
    const sorted = [...frames].sort((a, b) => a - b), q = (f: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * f))] ?? 0;
    const info = view.renderer.info;
    perf.textContent = `frame med ${q(0.5).toFixed(1)} p95 ${q(0.95).toFixed(1)} ms\ncalls ${info.render.calls} (ตัวสำรอง ${callsPlaceholder}) tris ${info.render.triangles} (ตัวสำรอง ${trisPlaceholder})\ngeometries ${info.memory.geometries} textures ${info.memory.textures}${firstFrameMs === null ? '' : `\nfirst frame after load ${firstFrameMs.toFixed(0)} ms`}`;
  };
  requestAnimationFrame(frame);

  // read-only hooks for the QA script (tools/qa/seyrin-preview.mjs)
  (window as unknown as Record<string, unknown>).__seyrinPreview = {
    snapshot() {
      let holders = 0, skinned = 0;
      view.scene.traverse((o) => { if (o.name === 'seyrin-preview') holders++; if ((o as { isSkinnedMesh?: boolean }).isSkinnedMesh) skinned++; });
      const heroBone = hero?.root.getObjectByName('pelvis');
      return {
        loaded: !!hero, loading, holders, skinned, liveInstances: asset?.liveInstances ?? 0, actions: hero?.activeClips() ?? [],
        clip: clock.sample().clip, tick: clock.sample().tick, paused: clock.paused, worldTick: world.tick,
        pelvisY: heroBone ? heroBone.position.y : null, accepted: report?.accepted ?? null,
        failed: report?.items.filter((i) => !i.ok).map((i) => i.id) ?? [],
        geometries: view.renderer.info.memory.geometries, textures: view.renderer.info.memory.textures,
        calls: view.renderer.info.render.calls, callsPlaceholder, uiRoots: document.querySelectorAll('#sp-root').length,
      };
    },
  };
  return true;
}
