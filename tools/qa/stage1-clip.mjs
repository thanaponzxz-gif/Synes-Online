// Stage-1 baseline clip: the scripted bot plays from the camp into the plaza (real in-game camera, 844x390), frame-stepped like clip.mjs.
//   node tools/qa/stage1-clip.mjs [out.webm] [--base http://localhost:8080] [--seed 1] [--tier medium] [--secs 26] [--crf 38]
// Needs a served build (npm run build && npm run server). The sim is frozen and stepped with __synesQA.stepTicks (2 ticks per frame, 1 tick = 1/30 s,
// every frame keeps its real duration), so playback is real time. Same seed + flags => same frames. ffmpeg: /usr/bin/ffmpeg (VP9/WebM, falls back to H.264).
import fs from 'node:fs'; import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = args.find((a, i) => !a.startsWith('--') && !['--base', '--seed', '--tier', '--secs', '--crf'].includes(args[i - 1])) || 'tools/qa/out/stage1-bot-clip.webm';
const base = opt('base', 'http://localhost:8080'), seed = opt('seed', '1'), tier = opt('tier', 'medium'), secs = +opt('secs', '26'), crf = opt('crf', '38');
const tmp = path.resolve('tools/qa/out/frames-stage1-clip');
fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true }); fs.mkdirSync(path.dirname(out), { recursive: true });

const browser = await chromium.launch({ args: LAUNCH_ARGS });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${base}/?offline&seed=${seed}&q=${tier}&autostart&qafreeze&bot=1&botskills=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__synes?.world && window.__synes.state === 'playing', null, { timeout: 60000 });

const frames = [], TPF = 2, total = Math.round(secs * 30);
let first = { tick: 0 }, plazaAt = null;
for (let n = 0; n < total; n += TPF) {
  const s = await page.evaluate((k) => { window.__synesQA.stepTicks(k); const w = window.__synes.world; return { tick: w.tick, z: w.player.z, hp: w.player.hp, trig: w.clearingTriggered, fin: w.finished, down: w.ps.down }; }, TPF);
  if (s.trig && plazaAt === null) plazaAt = s.tick;
  const f = path.join(tmp, String(frames.length).padStart(5, '0') + '.jpg');
  await page.screenshot({ path: f, type: 'jpeg', quality: 85 }); frames.push(f);
  first = s; if (s.fin) break;
}
const last = await page.evaluate(() => { const w = window.__synes.world; return { tick: w.tick, x: w.player.x, z: w.player.z, hp: w.player.hp, deaths: w.stats.deaths, enemiesAlive: w.actors.filter((a) => a.alive && a.kind !== 'player' && a.kind !== 'prismback').length }; });
await browser.close();

fs.writeFileSync(path.join(tmp, 'list.txt'), frames.map((f) => `file '${f}'\nduration ${(TPF / 30).toFixed(6)}`).join('\n') + `\nfile '${frames[frames.length - 1]}'\n`);
const enc = (codec) => spawnSync('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-vf', 'fps=30,format=yuv420p', ...codec, out], { stdio: 'inherit' });
let r = enc(['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', crf, '-deadline', 'good', '-cpu-used', '4']);
if (r.status !== 0) { out.replace(/\.webm$/, '.mp4'); r = enc(['-c:v', 'libx264', '-crf', '30', '-preset', 'slow', '-movflags', '+faststart']); }
if (r.status !== 0) throw new Error('ffmpeg failed');
const size = fs.statSync(out).size;
console.log(JSON.stringify({ out, frames: frames.length, seconds: +(frames.length * TPF / 30).toFixed(1), bytes: size, MB: +(size / 1048576).toFixed(2), plazaTriggeredAtTick: plazaAt, end: last, errors }));
fs.rmSync(tmp, { recursive: true, force: true });
