// Synes Online client bootstrap: start screen → run loop → results. Lifecycle: app switch, offline, context loss.
import './style.css';
import { World, type SimEvent } from '../shared/sim/world.ts';
import { InputLog } from '../shared/sim/input.ts';
import { TICK } from '../shared/data/tuning.ts';
import { rankFor } from '../shared/rules/reward.ts';
import { View } from './render/view.ts';
import { loadKit, kitLoaded } from './render/models.ts';
import { TIERS, guessTier, loadPref, savePref, AdaptiveResolution, type QualityPref } from './render/quality.ts';
import { toneById } from './render/tones.ts';
import { Input } from './input.ts';
import { Hud } from './ui/hud.ts';
import { Sfx } from './audio.ts';
import { Net } from './net.ts';
import { Bot } from '../tests/bot.ts';

// flags: ?debug / ?bot etc. locally; artifact hosting only passes a plain #name, so mirror a few as hashes
const Q = new URLSearchParams(location.search);
for (const h of ['debug', 'offline']) if (location.hash === '#' + h) Q.set(h, '1');
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
const canvas = $<HTMLCanvasElement>('#game');
const perf = { bootMs: performance.now(), readyMs: 0, firstPlayFrameMs: 0, kit: false };
const sfx = new Sfx();
const net = new Net();
const view = new View(canvas);
const hud = new Hud();
const input = new Input($('#stick-zone'), $('#stick-base'), $('#stick-knob'));
input.bindButton($('#btn-attack'), 'attack', true);
input.bindButton($('#btn-dodge'), 'dodge');
input.bindButton($('#btn-skill'), 'skill');
input.bindButton($('#btn-potion'), 'potion');

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

// ------------------------------------------------------------------ boot
(async () => {
  const bar = $('#load-bar');
  $('#chip-q').textContent = `กราฟิก: ${tierLabel(tierName)}${pref === 'auto' ? ' (อัตโนมัติ)' : ''}`;
  const [mode] = await Promise.all([
    net.detect(),
    Q.has('nokit') ? Promise.resolve(false) : loadKit('./assets/models/synes_kit.glb', (f) => (bar.style.width = `${10 + f * 85}%`)).then((ok) => (perf.kit = ok)),
  ]);
  bar.style.width = '100%';
  $('#chip-net').textContent = mode === 'online' ? 'ออนไลน์: server ตรวจผล' : 'ออฟไลน์: ผลไม่ถูกบันทึก';
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
  ticket = await net.start();
  const seed = ticket?.seed ?? (Q.has('seed') ? +Q.get('seed')! : (Math.random() * 2 ** 32) >>> 0);
  world = new World(seed);
  log = new InputLog();
  view.buildLevel(world, 7);
  hud.netChip.textContent = ticket ? 'ออนไลน์' : 'ออฟไลน์';
  hud.netChip.title = ticket ? 'ผลจะถูกตรวจโดย server' : 'โหมดออฟไลน์: ผลไม่ถูกบันทึก';
  for (const s of ['#defeat', '#victory']) $(s).classList.remove('show');
  bot = Q.has('bot') ? new Bot(+(Q.get('bot') || 1) || 1) : null;
  input.bot = bot ? () => bot!.think(world!) : null;
  handleEvents(world.events.splice(0));
  state = 'playing'; acc = 0; last = performance.now();
  (window as any).__synes = { world, view, perf, log, get state() { return state; }, adaptive };
  checkOrientation();
}

// ------------------------------------------------------------------ loop
function frame(now: number) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.25, (now - last) / 1000); last = now;
  if (!world) return;
  if (state === 'playing') {
    acc += dt;
    let steps = 0;
    while (acc >= TICK && steps < 8) {
      view.beforeTick();
      const inp = input.sample();
      log.push(inp);
      handleEvents(world.step(inp));
      acc -= TICK; steps++;
      if (world.finished) break;
    }
    if (steps === 8) acc = 0; // spiral-of-death guard on very slow frames
  }
  view.render(world, state === 'playing' ? Math.min(1, acc / TICK) : 1, state === 'paused' ? 0 : dt);
  hud.update(world, dt, (id, h, out) => view.actorScreenPos(id, h, out));
  if (!perf.firstPlayFrameMs && state === 'playing') perf.firstPlayFrameMs = performance.now();
  if (pref === 'auto' && state === 'playing') { const r = adaptive.sample(dt); if (r) view.setPixelRatio(r); }
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
    switch (e.t) {
      case 'swing': sfx.swing(e.step); hud.dismissHintIf('attack'); break;
      case 'hit': if (e.byPlayer) sfx.hit(e.crit); else sfx.hurt(); break;
      case 'dodge': sfx.dodge(); hud.dismissHintIf('dodge'); break;
      case 'perfect': sfx.perfect(); break;
      case 'skill': sfx.skill(); break;
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
    setTimeout(() => hud.setReward(`<b>โหมดออฟไลน์:</b> ไม่มีการแจกหรือบันทึกรางวัล<br><small>อันดับ ${rank} คำนวณบนเครื่องคุณเพื่อแสดงผลเท่านั้น ส่วนรางวัลจริงต้องให้ server ตรวจซ้ำจาก input ก่อน</small>`), 1500);
    return;
  }
  const res = await net.finish(ticket.runId, log.data);
  const show = () => {
    if (res.verified) {
      const r = res.reward;
      hud.setReward(`✅ server ตรวจซ้ำแล้ว: อันดับ <b>${r.rank}</b><br>💰 ${r.gold} ทอง · ✨ ${r.exp} EXP${r.drop ? `<br>ได้รับ <span class="${r.drop.rarity}">${r.drop.nameTh}</span>` : ''}`);
    } else hud.setReward(`⚠ server ไม่รับผลนี้ (${res.error}) จึงไม่ได้บันทึกรางวัล`);
  };
  setTimeout(show, 1500);
}

// ------------------------------------------------------------------ menus & lifecycle
function pause(reason: 'menu' | 'hidden') {
  if (state !== 'playing') return;
  state = 'paused'; input.releaseAll(); sfx.suspend();
  $(reason === 'menu' ? '#paused' : '#resume-tap').classList.add('show');
}
function resume() {
  for (const s of ['#paused', '#resume-tap', '#howto', '#credits']) $(s).classList.remove('show');
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

function tierLabel(t: string) { return t === 'low' ? 'ต่ำ' : t === 'medium' ? 'กลาง' : 'สูง'; }
(window as any).__synesPerf = perf;
(window as any).__synesKit = kitLoaded;
