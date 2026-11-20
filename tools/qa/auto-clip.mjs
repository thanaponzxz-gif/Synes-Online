// Frame-stepped clip of Auto attack clearing the clearing hall (same technique as clip.mjs: the sim is frozen and stepped through
// window.__synesQA.stepTicks, one screenshot per drawn frame, ffmpeg gives each frame its real duration: 1 tick = 1/30 s, real-speed playback).
//   node tools/qa/auto-clip.mjs [--base http://localhost:8191] [--seed 1] [--tier medium] [--scale 2] [--out docs/qa/auto-v01/auto-farm.mp4]
// Setup: the player is moved to the clearing entrance with a direct state write (QA only). Auto itself is configured and switched on through
// the real UI (gear -> panel -> toggles, then the AUTO toggle), so the settings travel the normal input path; recording starts at the toggle.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const rest = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf('--' + k); return i >= 0 ? rest[i + 1] : d; };
const base = opt('base', 'http://localhost:8191'), seed = opt('seed', '1'), tier = opt('tier', 'medium'), scale = +opt('scale', '2'), crf = opt('crf', '26');
const out = opt('out', 'docs/qa/auto-v01/auto-farm.mp4'), maxTicks = +opt('maxticks', '900');
const tmp = path.resolve('tools/qa/out/frames-auto-farm');
fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true }); fs.mkdirSync(path.dirname(out), { recursive: true });

const browser = await chromium.launch({ args: LAUNCH_ARGS });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: scale, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto(`${base}/?offline&seed=${seed}&q=${tier}&qafreeze`, { waitUntil: 'load' });
await page.waitForSelector('#btn-start:not([disabled])', { timeout: 60000 });
await page.click('#btn-start');
await page.waitForFunction(() => window.__synes?.world && window.__synes.state === 'playing');
await page.waitForTimeout(7000);
await page.evaluate(() => { const p = window.__synes.world.player; p.x = 3; p.z = -31; p.fx = 0; p.fz = -1; window.__synesQA.stepTicks(2); });
// settings through the UI: whole hall + all three skills
await page.click('#btn-auto-set'); await page.waitForTimeout(400);
await page.click('#ap-area button[data-hall="1"]');
for (const i of [0, 1, 2]) await page.click(`#ap-skills button[data-slot="${i}"]`);
await page.click('#btn-auto-close'); await page.waitForTimeout(300);
await page.click('#btn-auto');

const frames = []; // { f, ticks }
const snap = async (ticks) => { const f = path.join(tmp, String(frames.length).padStart(5, '0') + '.jpg'); await page.screenshot({ path: f, type: 'jpeg', quality: 86 }); frames.push({ f, ticks }); };
const state = () => page.evaluate(() => { const w = window.__synes.world; return { tick: w.tick, left: w.actors.filter((a) => a.group === 'clearing' && a.alive).length, cast: !!w.ps.cast || w.ps.castT > 0, swing: w.ps.swingT > 0, auto: w.auto.s.enabled }; });
await snap(0);
let doneAt = -1, casts = 0, last = { cast: false };
for (;;) {
  const s = await state();
  if (s.tick >= maxTicks) break;
  if (s.left === 0 && doneAt < 0) doneAt = s.tick;
  if (doneAt >= 0 && s.tick - doneAt > 120) break; // linger while Auto walks back to its centre
  const n = s.cast || s.swing ? 1 : 2;
  await page.evaluate((k) => window.__synesQA.stepTicks(k), n);
  await snap(n);
  const a = await page.evaluate(() => !!window.__synes.world.ps.cast); if (a && !last.cast) casts++; last = { cast: a };
}
const fin = await state();
await browser.close();

const list = frames.map((x) => `file '${x.f}'\nduration ${(Math.max(x.ticks, 1) / 30).toFixed(6)}`).join('\n') + `\nfile '${frames[frames.length - 1].f}'\n`;
fs.writeFileSync(path.join(tmp, 'list.txt'), list);
const W = 844 * scale, H = 390 * scale;
const r = spawnSync('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-vf', `scale=${W}:${H},fps=30,format=yuv420p`, '-c:v', 'libx264', '-crf', crf, '-preset', 'slow', '-movflags', '+faststart', out], { stdio: 'inherit' });
if (r.status !== 0) throw new Error('ffmpeg failed');
const ticks = frames.reduce((a, x) => a + x.ticks, 0), size = fs.statSync(out).size;
console.log(JSON.stringify({ out, frames: frames.length, ticks, seconds: +(ticks / 30).toFixed(2), MB: +(size / 1048576).toFixed(2), res: `${W}x${H}`, clearedAtTick: doneAt, finalState: fin, casts }));
if (!opt('keep')) fs.rmSync(tmp, { recursive: true, force: true });
