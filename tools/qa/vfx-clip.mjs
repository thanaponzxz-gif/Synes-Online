// exp/stage1-vfx QA clip: one scripted real-speed run per VFX option (the 3 skills, basic hits, a hit on the boss's crystal armour,
// Chime under a boss slam), 844x390, same seed and same inputs for every option, so the clips can be compared frame by frame.
//   node tools/qa/vfx-clip.mjs [outDir] [--variants cur,A,B] [--tier medium] [--crf 40] [--dist dist]
// Serves <dist> in-process. Frame-stepped like stage1-clip.mjs: the sim is frozen and advanced ONE tick per frame with
// __synesQA.stepTicks (1 tick = 1/30 s), so 30 fps playback = real time. Two parts, joined: field (seed 1, puffcap ahead) then
// boss arena (?start=boss). Output <outDir>/vfx-<variant>.webm (VP9). LIMITS: Chromium + SwiftShader frames, not a phone recording.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const valued = new Set(['--variants', '--tier', '--crf', '--dist']);
const outDir = args.find((a, i) => !a.startsWith('--') && !valued.has(args[i - 1])) || 'tools/qa/out/vfx-clip';
const VARIANTS = opt('variants', 'cur,A,B').split(','), tier = opt('tier', 'medium'), crf = opt('crf', '40');
const distDir = path.resolve(opt('dist', 'dist'));
fs.mkdirSync(outDir, { recursive: true });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(distDir, p);
  if (!f.startsWith(distDir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' }); res.end(fs.readFileSync(f));
});
const port = Number(process.env.SYNES_QA_PORT || 18755);
await new Promise((r) => srv.listen(port, '127.0.0.1', r));
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const summary = [];

for (const v of VARIANTS) {
  const tmp = path.resolve('tools/qa/out/frames-vfx-clip-' + v);
  fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
  const frames = [], errors = [], log = [];
  const qs = v === 'cur' ? '' : `&vfx=${v}`;
  const open = async (start) => {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${base}/?offline&seed=1&q=${tier}&autostart&qafreeze${start ? '&start=' + start : ''}${qs}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__synes?.world && window.__synes.state === 'playing', null, { timeout: 60000 });
    return { ctx, page };
  };
  const run = async (page, n) => { for (let i = 0; i < n; i++) { await page.evaluate(() => window.__synesQA.stepTicks(1)); const f = path.join(tmp, String(frames.length).padStart(5, '0') + '.jpg'); await page.screenshot({ path: f, type: 'jpeg', quality: 85 }); frames.push(f); } };
  const key = async (page, k, what) => { await page.keyboard.press(k); log.push(`${frames.length}:${what}`); };
  { // part 1: field, the first puffcap ahead
    const { ctx, page } = await open('');
    await page.evaluate(() => { const p = window.__synes.world.player; p.x = 1.4; p.z = -13.6; p.fx = 0; p.fz = -1; p.hp = p.maxHp = 9999; window.__synesQA.stepTicks(1); });
    await run(page, 6);
    await key(page, 'Digit1', 'chime'); await run(page, 26);
    await key(page, 'Digit2', 'crescent'); await run(page, 18);
    await key(page, 'Digit3', 'crystal'); await run(page, 28);
    for (let i = 0; i < 3; i++) { await key(page, 'KeyJ', 'attack'); await run(page, 12); }
    await run(page, 6);
    await ctx.close();
  }
  { // part 2: boss arena: Chime under a slam, then sword hits on the crystal armour
    const { ctx, page } = await open('boss');
    await page.evaluate(() => { const { world } = window.__synes, { player, boss } = world; player.hp = player.maxHp = 9999; player.x = boss.x; player.z = boss.z + 6.2; player.fx = 0; player.fz = -1;
      for (let n = 0; n < 60 && !world.bossStarted; n++) window.__synesQA.stepTicks(1, false);
      world.bossNext = 'slam'; for (let n = 0; n < 200 && !world.tele.some((t) => t.owner === world.boss.id && t.atk.id === 'slam'); n++) window.__synesQA.stepTicks(1, false); });
    await run(page, 8);
    await key(page, 'Digit1', 'chime under slam'); await run(page, 34);
    await page.evaluate(() => { const { world } = window.__synes, { player, boss } = world; player.x = boss.x + 0.6; player.z = boss.z + boss.r + 1.0; player.fx = 0; player.fz = -1; });
    for (let i = 0; i < 4; i++) { await key(page, 'KeyJ', 'attack boss'); await run(page, 12); }
    await key(page, 'Digit2', 'crescent on boss'); await run(page, 20);
    await ctx.close();
  }
  fs.writeFileSync(path.join(tmp, 'list.txt'), frames.map((f) => `file '${f}'\nduration ${(1 / 30).toFixed(6)}`).join('\n') + `\nfile '${frames[frames.length - 1]}'\n`);
  const out = path.join(outDir, `vfx-${v}.webm`);
  const r = spawnSync('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-vf', 'fps=30,format=yuv420p', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', crf, '-deadline', 'good', '-cpu-used', '4', out], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg failed');
  const bytes = fs.statSync(out).size;
  summary.push({ variant: v, out, frames: frames.length, seconds: +(frames.length / 30).toFixed(1), MB: +(bytes / 1048576).toFixed(2), events: log, errors });
  fs.rmSync(tmp, { recursive: true, force: true });
}
await browser.close(); srv.close();
fs.writeFileSync(path.join(outDir, 'clips.json'), JSON.stringify(summary, null, 1));
console.log(JSON.stringify(summary.map(({ events, ...s }) => s)));
