// DES-002 real-press clip: real pointer events (page.mouse) on every HUD control at 844x390, sim frozen and stepped by __synesQA.stepTicks
// (same approach as clip.mjs: SwiftShader is too slow for real time, so each frame carries its real duration, 1 tick = 1/30 s).
//   node tools/qa/hud-press-clip.mjs [--base http://localhost:8191] [--out docs/qa/hud-skin-v01/press.mp4]
import fs from 'node:fs'; import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';
const rest = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf('--' + k); return i >= 0 ? rest[i + 1] : d; };
const base = opt('base', 'http://localhost:8191'), out = opt('out', 'docs/qa/hud-skin-v01/press.mp4');
const tmp = path.resolve('tools/qa/out/frames-press'); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
fs.mkdirSync(path.dirname(out), { recursive: true });
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto(`${base}/?offline&seed=1&start=boss&q=medium&autostart&qafreeze`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__synes?.world && window.__synes.state === 'playing');
const frames = [];
const snap = async (secs) => { const f = path.join(tmp, String(frames.length).padStart(5, '0') + '.jpg'); await page.screenshot({ path: f, type: 'jpeg', quality: 90 }); frames.push({ f, secs }); };
const step = async (ticks, per = 2) => { for (let t = 0; t < ticks; t += per) { await page.evaluate((n) => window.__synesQA.stepTicks(n), per); await snap(per / 30); } };
const center = async (sel) => { const b = await page.locator(sel).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
// start the boss fight, keep the player safe (this clip is about the HUD, not the fight)
await page.evaluate(() => { const w = window.__synes.world, p = w.player; p.x = -2; p.z = -74; });
for (let i = 0; i < 400; i++) {
  const r = await page.evaluate(() => { const w = window.__synes.world, boss = w.actors.find((a) => a.kind === 'prismback'), p = w.player;
    if (!w.bossStarted && boss) { p.x = boss.x; p.z = boss.z + 9; p.fx = 0; p.fz = -1; } window.__synesQA.stepTicks(3); return w.bossStarted; });
  if (r) break;
}
const safe = () => page.evaluate(() => { const w = window.__synes.world, p = w.player; p.maxHp = 99999; if (p.hp > 60000) p.hp = Math.min(p.hp, p.maxHp); });
await page.evaluate(() => { const w = window.__synes.world; w.player.maxHp = 99999; w.player.hp = 99999 * 0.8; });
await step(30);
const press = async (sel, hold, after) => { const c = await center(sel); await page.mouse.move(c.x, c.y); await page.mouse.down(); await step(hold); await page.mouse.up(); await step(after); };
await press('#btn-attack', 6, 10);
await press('#btn-attack', 4, 4); await press('#btn-attack', 4, 14);
await press('#btn-dodge', 4, 14);
await press('#btn-skill', 6, 36);
await press('#btn-skill2', 6, 36);
await press('#btn-skill3', 6, 36);
await page.evaluate(() => { window.__synes.world.player.hp = 99999 * 0.35; window.__synesQA.stepTicks(2); });
await press('#btn-potion', 6, 20);
await press('#btn-ult', 6, 14);
// joystick drag with real pointer events
await page.mouse.move(110, 300); await page.mouse.down(); await step(6);
for (const [x, y] of [[130, 296], [150, 288], [165, 275]]) { await page.mouse.move(x, y, { steps: 3 }); await step(4); }
await step(16); await page.mouse.move(110, 320, { steps: 5 }); await step(10); await page.mouse.up(); await step(10);
// pause -> toggle sound off/on -> resume (sim is paused, frames are 0.3 s each)
const slow = async (n) => { for (let i = 0; i < n; i++) { await page.waitForTimeout(80); await snap(0.3); } };
let c = await center('#btn-pause'); await page.mouse.move(c.x, c.y); await page.mouse.down(); await step(4); await page.mouse.up(); await page.waitForTimeout(250); await slow(5);
c = await center('#chk-sound'); await page.mouse.move(c.x, c.y); await page.mouse.down(); await slow(2); await page.mouse.up(); await slow(5);
await page.mouse.down(); await page.mouse.up(); await slow(3); // back on
c = await center('#btn-resume'); await page.mouse.move(c.x, c.y); await page.mouse.down(); await slow(2); await page.mouse.up(); await slow(2);
await step(20);
await browser.close();
const list = frames.map((x) => `file '${x.f}'\nduration ${x.secs.toFixed(6)}`).join('\n') + `\nfile '${frames[frames.length - 1].f}'\n`;
fs.writeFileSync(path.join(tmp, 'list.txt'), list);
const r = spawnSync('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-vf', 'scale=1688:780,fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-movflags', '+faststart', out], { stdio: 'inherit' });
if (r.status !== 0) throw new Error('ffmpeg failed');
const secs = frames.reduce((a, x) => a + x.secs, 0);
console.log(JSON.stringify({ out, frames: frames.length, seconds: +secs.toFixed(1), MB: +(fs.statSync(out).size / 1048576).toFixed(2) }));
fs.rmSync(tmp, { recursive: true, force: true });
