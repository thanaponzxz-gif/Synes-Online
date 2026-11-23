// Synes Online client bootstrap: start screen → run loop → results. Lifecycle: app switch, offline, context loss.
import './style.css';
import { World, type SimEvent } from '../shared/sim/world.ts';
import { InputLog } from '../shared/sim/input.ts';
import { TICK } from '../shared/data/tuning.ts';
import { rankFor } from '../shared/rules/reward.ts';
import { View } from './render/view.ts';
import { loadKit, kitLoaded, loadKitExtra, loadEnvLib } from './render/models.ts';
import { spireLook } from './render/arena.ts';
import { TIERS, guessTier, loadPref, savePref, AdaptiveResolution, type QualityPref } from './render/quality.ts';
import { toneById } from './render/tones.ts';
import { Input } from './input.ts';
import { Hud } from './ui/hud.ts';
import { ButtonFade } from './ui/buttonFade.ts';
import { Sfx } from './audio.ts';
import { Net } from './net.ts';
import { variantFromQuery } from '../shared/sim/variant.ts';
import { rulesetFromQuery } from '../shared/sim/ruleset.ts';
import { Bot } from '../tests/bot.ts';
import { AutoBar, AutoPanel } from './ui/autoPanel.ts';
import { AUTO_KINDS, autoAllowedHere, defaultAuto, packAuto, type AutoSettings } from '../shared/sim/auto.ts';
import { dist } from '../shared/sim/math.ts';

// flags: ?debug / ?bot etc. locally; artifact hosting only passes a plain #name, so mirror a few as hashes
declare const __BUILD__: string;
const Q = new URLSearchParams(location.search);
const ruleset = rulesetFromQuery(Q); // ?combo=A|B|C, ?combo=1 = old combat-1 (default combat-2 = owner pick A)
const variant = variantFromQuery(Q); // ?dodgecd=0.87 &start=boss ; invalid -> default
for (const h of ['debug', 'offline']) if (location.hash === '#' + h) Q.set(h, '1');
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
const canvas = $<HTMLCanvasElement>('#game');
const perf = { bootMs: performance.now(), readyMs: 0, firstPlayFrameMs: 0, kit: false };
const sfx = new Sfx();
const net = new Net();
const view = new View(canvas);
const hud = new Hud();
const btnFade = new ButtonFade((x, y, z, out) => view.project(x, y, z, out));
const input = new Input($('#stick-zone'), $('#stick-base'), $('#stick-knob'));
input.bindButton($('#btn-attack'), 'attack', true);
input.bindButton($('#btn-dodge'), 'dodge');
input.bindButton($('#btn-skill'), 'skill');
input.bindButton($('#btn-skill2'), 'skill2');
input.bindButton($('#btn-skill3'), 'skill3');
// ult is locked in this step: UI-only message, no sim input (DES-001 §3, Q6)
$('#btn-ult').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); hud.showBanner('อัลติจะปลดล็อกในอัปเดตถัดไป', 1.8); });
input.bindButton($('#btn-potion'), 'potion');

// ---- Auto attack (DES-001 §4). autoSet = the UI's copy of the settings; every change goes through Input.queueAuto so it rides on the next
// TickInput and ends up in the input log (the server replays the same Auto). Only `enabled` is mirrored back from the sim (boss area / death turn it off).
let autoSet: AutoSettings = defaultAuto();
const sendAuto = (next: AutoSettings) => { autoSet = next; input.queueAuto(packAuto(next)); };
const autoBar = new AutoBar($('#auto-bar'), $('#btn-auto'));
const nearKinds = () => { let m = 0; if (world) for (const e of world.actors) { const i = (AUTO_KINDS as readonly string[]).indexOf(e.kind); if (i >= 0 && e.alive && dist(e.x, e.z, world.player.x, world.player.z) < 30) m |= 1 << i; } return m; };
const autoPanel = new AutoPanel($('#auto-panel'), () => autoSet, sendAuto, nearKinds);
$('#btn-auto').addEventListener('click', () => { if (state !== 'playing' || !world) return; sfx.tap(); sendAuto({ ...autoSet, enabled: !autoSet.enabled }); });
$('#btn-auto-set').addEventListener('click', () => { if (state !== 'playing' || !world) return; sfx.tap(); autoPanel.render(); pause('auto'); });
$('#btn-auto-close').addEventListener('click', () => { sfx.tap(); resume(); });

let pref: QualityPref = loadPref();
let tierName = pref === 'auto' ? guessTier() : pref;
let adaptive = new AdaptiveResolution(TIERS[tierName].maxPixelRatio);
view.setQuality(TIERS[tierName]);
view.applyTone(toneById(Q.get('tone')));

let world: World | null = null;
let log = new InputLog();
let ticket: { runId: string; seed: number } | null = null;
let state: 'menu' | 'playing' | 'paused' | 'done' = 'menu';
let acc = 0, last = performance.now();
let bot: Bot | null = null;
let portraitOk = false;
let qaPend = 0; // QA: ticks stepped since the last drawn frame (effect/camera smoothing gets exactly that much time, so stepping is deterministic)
let qaFrozen = Q.has('qafreeze'); // ?qafreeze: start with the sim frozen (QA only; deterministic stepping via __synesQA.stepTicks)
const qaLog: { t: number; e: string }[] = [];
(window as any).__synesQA = {
  freeze() { qaFrozen = true; },
  unfreeze() { qaFrozen = false; last = performance.now(); acc = 0; },
  log: qaLog,
  /** QA only: run exactly n sim ticks (same step as the live loop, bot/input included), then draw one frame at the end state. */
  stepTicks(n = 1, draw = true) { if (!world || state !== 'playing') return 0; let i = 0; for (; i < n; i++) { simStep(); if (world.finished) { i++; break; } } qaPend += i; if (draw) { renderFrame(1, Math.max(TICK, qaPend * TICK)); qaPend = 0; } return i; },
};

// ------------------------------------------------------------------ boot
(async () => {
  const bar = $('#load-bar');
  $('#chip-q').textContent = `กราฟิก: ${tierLabel(tierName)}${pref === 'auto' ? ' (อัตโนมัติ)' : ''}`;
  const [mode] = await Promise.all([
    net.detect(),
    Q.has('nokit') ? Promise.resolve(false) : loadKit((window as any).__SYNES_KIT_URL || './assets/models/synes_kit.glb', (f) => (bar.style.width = `${10 + f * 85}%`))
      // ?spire=B: DES-004 step-2 option B landmarks from a small side-car GLB (same node names, overrides the kit's A models)
      .then(async (ok) => { if (ok && spireLook() === 'B') await loadKitExtra('./assets/models/spire_shrine_B.glb'); return (perf.kit = ok); })
      // ?envlib=1: optional environment library (exp/env-sample-a hook; no-op when the GLB is missing)
      .then(async (ok) => { if (ok && Q.get('envlib') === '1' && Q.get('env') !== '0') await loadEnvLib('./assets/models/env_library_v01.glb'); return ok; }),
  ]);
  bar.style.width = '100%';
  $('#chip-net').textContent = mode === 'online' ? 'ออนไลน์: บันทึกผลได้' : 'ออฟไลน์: ผลไม่ถูกบันทึก';
  const btn = $<HTMLButtonElement>('#btn-start');
  btn.disabled = false; btn.textContent = 'แตะเพื่อเริ่มผจญภัย';
  perf.readyMs = performance.now();
  if (Q.has('study')) {
    $('#start').classList.add('hidden'); $('#hud').classList.remove('hidden');
    const { runStudy } = await import('./study.ts');
    await runStudy(view, hud, Q.get('study')!, toneById(Q.get('tone')));
    return;
  }
  if (Q.has('bot') || Q.has('autostart')) startGame();
})();

$('#btn-start').addEventListener('click', () => startGame());

async function startGame() {
  sfx.unlock(); sfx.tap();
  const el = document.documentElement as any;
  if (matchMedia('(pointer: coarse)').matches && !Q.has('bot')) {
    try { await (el.requestFullscreen?.({ navigationUI: 'hide' }) ?? Promise.resolve()); } catch { /* iOS Safari / in-app browsers */ }
    try { await (screen.orientation as any)?.lock?.('landscape'); } catch { /* unsupported */ }
  }
  $('#start').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  if (Q.has('debug')) $('#debug').style.display = 'block';
  await newRun();
}

async function newRun() {
  ticket = await net.start(variant, ruleset);
  const seed = ticket?.seed ?? (Q.has('seed') ? +Q.get('seed')! : (Math.random() * 2 ** 32) >>> 0);
  world = new World(seed, variant, ruleset);
  log = new InputLog();
  input.autoPending = null; autoSet.enabled = false;
  view.buildLevel(world, 7);
  hud.netChip.textContent = ticket ? 'ออนไลน์' : 'ออฟไลน์';
  hud.netChip.title = ticket ? 'ผลและรางวัลจะถูกบันทึก' : 'โหมดออฟไลน์: ผลไม่ถูกบันทึก';
  for (const s of ['#defeat', '#victory']) $(s).classList.remove('show');
  bot = Q.has('bot') ? new Bot(+(Q.get('bot') || 1) || 1, { useSkills: Q.has('botskills') }) : null; // ?botskills=1: bot also fires slots 2-3 (demo clips)
  input.bot = bot ? () => bot!.think(world!) : null;
  handleEvents(world.events.splice(0));
  state = 'playing'; acc = 0; last = performance.now();
  (window as any).__synes = { world, view, perf, log, get state() { return state; }, adaptive };
  checkOrientation();
}

// ------------------------------------------------------------------ loop
function simStep() {
  view.beforeTick();
  const inp = input.sample();
  log.push(inp);
  handleEvents(world!.step(inp));
}
function renderFrame(alpha: number, dt: number) {
  const w = world!;
  try { view.render(w, alpha, dt); }
  catch (err) { if (qaLog.length < 400) qaLog.push({ t: +(w.tick / 30).toFixed(1), e: 'render-error ' + String((err as Error)?.message || err) }); console.error(err); }
}
function frame(now: number) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.25, (now - last) / 1000); last = now;
  if (!world) return;
  if (state === 'playing' && !qaFrozen) {
    acc += dt;
    let steps = 0;
    while (acc >= TICK && steps < 8) {
      simStep();
      acc -= TICK; steps++;
      if (world.finished) break;
    }
    if (steps === 8) acc = 0; // spiral-of-death guard on very slow frames
  }
  // frozen (QA): draw the exact end state of the last tick and let no wall-clock time pass in the effects
  renderFrame(state === 'playing' && !qaFrozen ? Math.min(1, acc / TICK) : 1, state === 'paused' || qaFrozen ? 0 : dt);
  if (!input.autoPending) autoSet.enabled = world.auto.s.enabled; // the sim may have switched it off (boss area, defeat)
  autoBar.update(autoSet.enabled, autoAllowedHere(world));
  hud.update(world, dt, (id, h, out) => view.actorScreenPos(id, h, out));
  if (state === 'playing') btnFade.update(world);
  if (!perf.firstPlayFrameMs && state === 'playing') perf.firstPlayFrameMs = performance.now();
  if (pref === 'auto' && state === 'playing' && !qaFrozen) { const r = adaptive.sample(dt); if (r) view.setPixelRatio(r); }
  if (Q.has('debug')) {
    const info = view.renderer.info, mem = (performance as any).memory;
    $('#debug').textContent = `fps ${adaptive.fps.toFixed(0)}  tier ${tierName}  px ${view.pixelRatio.toFixed(2)}\ncalls ${info.render.calls}  tris ${info.render.triangles}\nkit ${perf.kit ? 'glb' : 'procedural'}  heap ${mem ? (mem.usedJSHeapSize / 1048576).toFixed(0) + 'MB' : 'n/a'}`;
  }
}
requestAnimationFrame(frame);

function handleEvents(evts: SimEvent[]) {
  if (!world || !evts.length) return;
  view.onEvents(evts, world);
  hud.onEvents(evts, world, (id, h, out) => view.actorScreenPos(id, h, out));
  for (const e of evts) {
    const tt = +(world.tick / 30).toFixed(1);
    if (e.t === 'hit' && !e.byPlayer) { const c = world.ps.cause; qaLog.push({ t: tt, e: `hurt ${e.amount} by ${c?.enemyTh}/${c?.attackTh}` }); }
    else if (['player-down', 'perfect', 'boss-start', 'boss-phase', 'victory', 'checkpoint', 'respawn', 'gate', 'stun', 'hint', 'interrupt', 'potion', 'skill', 'skill-hit', 'skill-cancel', 'dodge-early'].includes(e.t)) qaLog.push({ t: tt, e: e.t + ('id' in e ? ' ' + e.id : '') + ('cause' in e ? ' ' + e.cause.attackTh : '') + ('long' in e ? (e.long ? ' long' : ' short') : '') });
    switch (e.t) {
      case 'swing': sfx.swing(e.step); hud.dismissHintIf('attack'); break;
      case 'hit': if (e.byPlayer) sfx.hit(e.crit); else sfx.hurt(); break;
      case 'dodge': sfx.dodge(); hud.dismissHintIf('dodge'); break;
      case 'perfect': sfx.perfect(); break;
      case 'skill': sfx.skill(); break;
      // slots 2-3 reuse existing sounds (no new audio assets): Crescent = the heavy swing, Crystal = the skill chime (DES gives no sound spec)
      case 'skill-hit': if (e.slot === 2) sfx.swing(2); else if (e.slot === 3) sfx.skill(); break;
      case 'heal': sfx.heal(); break;
      case 'telegraph': { const t = world.tele.find((x) => x.id === e.id); if (t) sfx.warn(t.atk.id === 'slam' || t.atk.id === 'charge'); break; }
      case 'boss-start': case 'boss-phase': sfx.roar(); break;
      case 'stun': sfx.stun(); break;
      case 'gate': sfx.gate(); break;
      case 'player-down':
        sfx.defeat();
        setTimeout(() => hud.showDefeat(e.cause, world!.checkpoint.id === 'spring', () => { input.press('retry'); sfx.tap(); }), 700);
        if (bot) setTimeout(() => $('#defeat').classList.remove('show'), 1200);
        break;
      case 'victory': onVictory(); break;
    }
  }
}

async function onVictory() {
  state = 'done';
  sfx.victory();
  const w = world!;
  setTimeout(() => hud.showVictory(w, () => newRun()), 1400);
  if (!ticket) {
    const s = w.summary();
    const rank = rankFor({ victory: true, seconds: s.seconds, damageTaken: s.damageTaken, deaths: s.deaths, perfect: s.perfect });
    setTimeout(() => hud.setReward(`<b>โหมดออฟไลน์:</b> รอบนี้ไม่ถูกบันทึกและไม่ได้รับรางวัล<br><small>อันดับ ${rank} แสดงให้ดูเท่านั้น</small>`), 1500);
    return;
  }
  const res = await net.finish(ticket.runId, log.data);
  const show = () => {
    if (res.verified) {
      const r = res.reward;
      hud.setReward(`✅ บันทึกผลแล้ว: อันดับ <b>${r.rank}</b><br>💰 ${r.gold} ทอง · ✨ ${r.exp} EXP${r.drop ? `<br>ได้รับ <span class="${r.drop.rarity}">${r.drop.nameTh}</span>` : ''}`);
    } else hud.setReward(`⚠ บันทึกผลไม่สำเร็จ จึงยังไม่ได้รับรางวัล <small>(${res.error})</small>`);
  };
  setTimeout(show, 1500);
}

// ------------------------------------------------------------------ menus & lifecycle
function pause(reason: 'menu' | 'hidden' | 'auto') {
  if (state !== 'playing') return;
  state = 'paused'; input.releaseAll(); sfx.suspend();
  $(reason === 'menu' ? '#paused' : reason === 'auto' ? '#auto-panel' : '#resume-tap').classList.add('show');
}
function resume() {
  for (const s of ['#paused', '#resume-tap', '#howto', '#credits', '#auto-panel']) $(s).classList.remove('show');
  if (state === 'paused') { state = 'playing'; last = performance.now(); acc = 0; sfx.resume(); }
}
$('#btn-pause').addEventListener('click', () => { sfx.tap(); pause('menu'); });
$('#btn-resume').addEventListener('click', resume);
$('#btn-resume2').addEventListener('click', () => { sfx.unlock(); resume(); });
$('#btn-restart').addEventListener('click', () => { resume(); newRun(); });
$('#btn-howto').addEventListener('click', () => $('#howto').classList.add('show'));
$('#btn-credits').addEventListener('click', () => $('#credits').classList.add('show'));
document.querySelectorAll('.overlay .close').forEach((b) => b.addEventListener('click', () => (b.closest('.overlay') as HTMLElement).classList.remove('show')));
const sel = $<HTMLSelectElement>('#sel-quality'); sel.value = pref;
sel.addEventListener('change', () => {
  pref = sel.value as QualityPref; savePref(pref);
  tierName = pref === 'auto' ? guessTier() : pref;
  adaptive = new AdaptiveResolution(TIERS[tierName].maxPixelRatio);
  view.setQuality(TIERS[tierName]);
  if (world) view.buildLevel(world, 7);
});
$<HTMLInputElement>('#chk-sound').addEventListener('change', (e) => sfx.setMuted(!(e.target as HTMLInputElement).checked));

document.addEventListener('visibilitychange', () => { if (document.hidden) pause('hidden'); });
addEventListener('pagehide', () => pause('hidden'));
addEventListener('blur', () => { if (matchMedia('(pointer: coarse)').matches) return; });
addEventListener('offline', () => { hud.netChip.textContent = ticket ? 'ออนไลน์ (สัญญาณหลุด รอส่งผล)' : 'ออฟไลน์'; });
addEventListener('online', () => { hud.netChip.textContent = ticket ? 'ออนไลน์' : 'ออฟไลน์'; });
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); pause('hidden'); $('#resume-tap').classList.remove('show'); $('#ctx-lost').classList.add('show'); });
canvas.addEventListener('webglcontextrestored', () => { $('#ctx-lost').classList.remove('show'); if (world) view.buildLevel(world, 7); $('#resume-tap').classList.add('show'); });

function checkOrientation() {
  const portrait = innerHeight > innerWidth && matchMedia('(pointer: coarse)').matches;
  $('#rotate').classList.toggle('show', portrait && !portraitOk && state !== 'menu');
}
$('#btn-portrait').addEventListener('click', () => { portraitOk = true; checkOrientation(); });
addEventListener('resize', () => { view.resize(); checkOrientation(); });

document.querySelectorAll('.build-id').forEach((el) => (el.textContent = __BUILD__));
function tierLabel(t: string) { return t === 'low' ? 'ต่ำ' : t === 'medium' ? 'กลาง' : 'สูง'; }
(window as any).__synesPerf = perf;
(window as any).__synesKit = kitLoaded;
