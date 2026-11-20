// Deterministic frame-by-frame clip renderer (team B). SwiftShader is far too slow for real-time capture, so the sim is frozen and stepped
// through window.__synesQA.stepTicks(n) (same step as the live loop, bot input included), one screenshot per drawn frame, then ffmpeg
// encodes H.264/yuv420p at 30 fps with the real duration of every frame (1 tick = 1/30 s), so playback speed is real time.
//   node tools/qa/clip.mjs fight   [--seed 1] [--tier medium] [--dodgecd 17] [--scale 2] [--out docs/qa/clips/boss-3skills-seed1.mp4]
//   node tools/qa/clip.mjs overlap [--seed 11] [--tier medium] [--scale 2] [--out docs/qa/clips/vfx-overlap-telegraph.mp4]
// Needs a served build: node tools/qa/serve.mjs dist 8191   (--base to change).  ffmpeg: /usr/bin/ffmpeg
//  fight   = ?bot=1&botskills=1 scripted bot, boss start, from tick 0 to victory (or --maxticks). 1 tick per frame while a skill is in
//            progress / just landed, 2 ticks per frame otherwise (walking). Same seed + same flags => identical frames (the same flags with
//            &dodgecd=26 give the same pipeline for the dodge-cooldown comparison clip).
//  overlap = boss telegraph on screen; real casts of Crystal -> Crescent -> Chime, then all three VFX forced onto the same tick (view-only
//            events, sim untouched) to show the worst-case overlap against the warning.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const [mode = 'fight', ...rest] = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf('--' + k); return i >= 0 ? rest[i + 1] : d; };
const base = opt('base', 'http://localhost:8191'), seed = opt('seed', mode === 'fight' ? '1' : '11'), tier = opt('tier', 'medium'), scale = +opt('scale', '2');
const dodgecd = opt('dodgecd', ''), maxTicks = +opt('maxticks', '2400'), crf = opt('crf', '23');
const out = opt('out', mode === 'fight' ? `docs/qa/clips/boss-3skills-seed${seed}.mp4` : 'docs/qa/clips/vfx-overlap-telegraph.mp4');
const tmp = path.resolve('tools/qa/out/frames-' + path.basename(out, '.mp4'));
fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true }); fs.mkdirSync(path.dirname(out), { recursive: true });

const browser = await chromium.launch({ args: LAUNCH_ARGS });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: scale, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const flags = mode === 'fight' ? '&bot=1&botskills=1' : '';
await page.goto(`${base}/?offline&seed=${seed}&start=boss&q=${tier}&autostart&qafreeze${flags}${dodgecd ? '&dodgecd=' + dodgecd : ''}`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__synes?.world && window.__synes.state === 'playing');

const frames = []; // { file, ticks }
const snap = async (ticks) => { const f = path.join(tmp, String(frames.length).padStart(5, '0') + '.jpg'); await page.screenshot({ path: f, type: 'jpeg', quality: 88 }); frames.push({ f, ticks }); };
const state = () => page.evaluate(() => { const w = window.__synes.world; return { tick: w.tick, fin: w.finished, cast: !!w.ps.cast || w.ps.castT > 0, down: w.ps.down, tele: w.tele.length }; });

if (mode === 'fight') {
  let lastAction = -999;
  for (;;) {
    const s0 = await state();
    if (s0.fin || s0.tick >= maxTicks) break;
    const busy = s0.cast || s0.tick - lastAction < 16;
    const n = busy ? 1 : 2;
    const r = await page.evaluate((k) => { const w = window.__synes.world; const before = w.ps.cast; window.__synesQA.stepTicks(k); return { cast: !!w.ps.cast || w.ps.castT > 0, tick: w.tick, fin: w.finished }; }, n);
    if (r.cast) lastAction = r.tick;
    await snap(n);
    if (r.fin) { for (let i = 0; i < 20; i++) { await page.evaluate(() => window.__synesQA.stepTicks(2)); await snap(2); } break; } // linger on the end of the fight
  }
} else {
  // each segment starts on a FRESH boss telegraph (they only last ~1.2 s), with the player 5.8 m south of the boss facing it; cuts between segments
  const fresh = () => page.evaluate(() => { const w = window.__synes.world, Q = window.__synesQA, p = w.player;
    p.hp = p.maxHp = 99999;
    for (let n = 0; n < 2400; n++) {
      const boss = w.actors.find((a) => a.kind === 'prismback');
      if (w.bossStarted && w.tele.some((t) => t.t > 1.0 && 1 - t.t / t.total < 0.08 && t.atk.id !== 'charge')) break;
      if (!w.bossStarted || n % 6 === 0) { p.x = boss ? boss.x : -2; p.z = (boss ? boss.z : -80) + (w.bossStarted ? 7 : -74 - (boss ? boss.z : 0)); p.fx = 0; p.fz = -1; }
      Q.stepTicks(1, false);
    }
    const boss = w.actors.find((a) => a.kind === 'prismback'); p.x = boss.x; p.z = boss.z + 5.8; p.fx = 0; p.fz = -1; w.ps.cdT = [0, 0, 0]; w.ps.skillCd = 0; p.down = false; Q.stepTicks(0); });
  const step1 = async () => { await page.evaluate(() => window.__synesQA.stepTicks(1)); await snap(1); };
  const seg = async (slot, wait) => { await fresh(); for (let i = 0; i < 4; i++) await step1(); if (slot) await page.keyboard.press('Digit' + slot); for (let i = 0; i < wait; i++) await step1(); };
  await page.evaluate(() => { window.__synes.world.player.x = -2; window.__synes.world.player.z = -74; });
  await seg(3, 30);  // Crystal Break: crack during prep, crystals at the hit, collapse
  await seg(2, 16);  // Crescent Cut
  await seg(1, 22);  // Chime Burst
  // worst case: all three hit events forced onto the same tick (view only, sim untouched)
  await seg(0, 0);
  await page.evaluate(() => { const s = window.__synes, w = s.world, p = w.player; s.view.onEvents([1, 2, 3].map((slot) => ({ t: 'skill-hit', slot, x: p.x, z: p.z, dx: p.fx, dz: p.fz, hits: 0 })), w); });
  for (let i = 0; i < 24; i++) await step1();
}
await browser.close();

// ffmpeg concat list with per-frame duration (1 tick = 1/30 s), constant 30 fps output
const list = frames.map((x) => `file '${x.f}'\nduration ${(x.ticks / 30).toFixed(6)}`).join('\n') + `\nfile '${frames[frames.length - 1].f}'\n`;
fs.writeFileSync(path.join(tmp, 'list.txt'), list);
const W = 844 * scale, H = 390 * scale;
const r = spawnSync('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-vf', `scale=${W}:${H},fps=30,format=yuv420p`, '-c:v', 'libx264', '-crf', crf, '-preset', 'slow', '-movflags', '+faststart', out], { stdio: 'inherit' });
if (r.status !== 0) throw new Error('ffmpeg failed');
const ticks = frames.reduce((a, x) => a + x.ticks, 0), size = fs.statSync(out).size;
console.log(JSON.stringify({ out, frames: frames.length, ticks, seconds: +(ticks / 30).toFixed(2), bytes: size, MB: +(size / 1048576).toFixed(2), res: `${W}x${H}` }));
if (!opt('keep')) fs.rmSync(tmp, { recursive: true, force: true });
