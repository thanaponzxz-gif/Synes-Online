// Real-speed attack comparison clips for the combo rulesets (DES-006 §1/§5). Same technique as clip.mjs: the sim is frozen and stepped
// through window.__synesQA.stepTicks, one screenshot per drawn frame, ffmpeg gives each frame its real duration (1 tick = 1/30 s).
// Same seed, same scripted bot (?bot=1), boss start; only ?combo= differs. Headless SwiftShader capture is NOT a real-device check.
//   node tools/qa/serve.mjs dist 8193 &
//   node tools/qa/combo-clip.mjs [--base http://localhost:8193] [--seed 1] [--ticks 200] [--skip 130] [--scale 1] [--out docs/qa/combo-v01]
// Writes combo-<combat1|A|B|C>.mp4 and combo-grid.mp4 (2x2: combat-1 | A / B | C, labelled).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const rest = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf('--' + k); return i >= 0 ? rest[i + 1] : d; };
const base = opt('base', 'http://localhost:8193'), seed = opt('seed', '1'), maxTicks = +opt('ticks', '200'), skip = +opt('skip', '130'), scale = +opt('scale', '1'), crf = opt('crf', '30');
const outDir = opt('out', 'docs/qa/combo-v01');
fs.mkdirSync(outDir, { recursive: true });
const VARS = [['combat1', ''], ['A', 'A'], ['B', 'B'], ['C', 'C']];
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const report = [];
for (const [name, q] of VARS) {
  const tmp = path.resolve('tools/qa/out/frames-combo-' + name);
  fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: scale, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${base}/?offline&seed=${seed}&start=boss&q=medium&autostart&qafreeze&bot=1${q ? '&combo=' + q : ''}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__synes?.world && window.__synes.state === 'playing');
  const ruleset = await page.evaluate(() => window.__synes.world.ruleset);
  // pre-roll (not drawn): the bot walks to the boss and starts swinging around tick 140
  await page.evaluate((n) => window.__synesQA.stepTicks(n, false), skip);
  const frames = []; let swings = 0;
  for (let t = 0; t < maxTicks;) {
    const prev = await page.evaluate(() => { const w = window.__synes.world; return w.ps.swingT > 0 ? w.ps.swingDur - w.ps.swingT : -1; });
    await page.evaluate(() => window.__synesQA.stepTicks(1));
    const cur = await page.evaluate(() => { const w = window.__synes.world; return w.ps.swingT > 0 ? w.ps.swingDur - w.ps.swingT : -1; });
    if (cur >= 0 && (prev < 0 || cur < prev)) swings++;
    const f = path.join(tmp, String(frames.length).padStart(5, '0') + '.jpg');
    await page.screenshot({ path: f, type: 'jpeg', quality: 80 }); frames.push(f); t++;
  }
  const hits = await page.evaluate(() => window.__synes.world.stats.hitsLanded);
  await ctx.close();
  fs.writeFileSync(path.join(tmp, 'list.txt'), frames.map((f) => `file '${f}'\nduration ${(1 / 30).toFixed(6)}`).join('\n') + `\nfile '${frames[frames.length - 1]}'\n`);
  const out = path.join(outDir, `combo-${name}.mp4`), W = 844 * scale, H = 390 * scale;
  const label = ruleset;
  const vf = `scale=${W}:${H},fps=30,drawtext=text='${label}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.55,format=yuv420p`;
  let r = spawnSync('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-vf', vf, '-c:v', 'libx264', '-crf', crf, '-preset', 'slow', '-movflags', '+faststart', out], { stdio: 'inherit' });
  if (r.status !== 0) { // ffmpeg without drawtext/fonts: encode unlabelled
    r = spawnSync('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-vf', `scale=${W}:${H},fps=30,format=yuv420p`, '-c:v', 'libx264', '-crf', crf, '-preset', 'slow', '-movflags', '+faststart', out], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error('ffmpeg failed');
  }
  report.push({ ruleset, out, ticks: maxTicks, swingsStartedInWindow: swings, hitsLanded: hits, MB: +(fs.statSync(out).size / 1048576).toFixed(2) });
  fs.rmSync(tmp, { recursive: true, force: true });
}
await browser.close();
const grid = path.join(outDir, 'combo-grid.mp4'), ins = VARS.flatMap(([n]) => ['-i', path.join(outDir, `combo-${n}.mp4`)]);
const g = spawnSync('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', ...ins, '-filter_complex', '[0][1]hstack[a];[2][3]hstack[b];[a][b]vstack,format=yuv420p', '-c:v', 'libx264', '-crf', '32', '-preset', 'slow', '-movflags', '+faststart', grid], { stdio: 'inherit' });
if (g.status === 0) report.push({ out: grid, MB: +(fs.statSync(grid).size / 1048576).toFixed(2) });
console.log(JSON.stringify(report, null, 1));
