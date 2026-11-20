// DES-002 before/after screenshots at 844x390 CSS px (dpr 2): boss start + HUD, skill cooling + potion, joystick held, pause menu.
//   node tools/qa/hud-shots.mjs <baseUrl> <before|after> [outDir]      (baseUrl = a served build, see tools/qa/serve.mjs)
import fs from 'node:fs'; import path from 'node:path';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';
const [base, tag, outDir = 'docs/qa/hud-skin-v01'] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('requestfailed', (r) => errs.push('reqfail ' + r.url()));
page.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
await page.goto(`${base}/?offline&seed=1&start=boss&q=medium&autostart&qafreeze`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__synes?.world && window.__synes.state === 'playing');
const shot = (n) => page.screenshot({ path: path.join(outDir, `${tag}-${n}.png`) });
// put the player in front of the boss and run until the fight starts (bar shown)
await page.evaluate(() => { const s = window.__synes, w = s.world, p = w.player; p.x = -2; p.z = -74; });
for (let i = 0; i < 400; i++) {
  const r = await page.evaluate(() => { const w = window.__synes.world; const boss = w.actors.find((a) => a.kind === 'prismback'); const p = w.player;
    if (!w.bossStarted && boss) { p.x = boss.x; p.z = boss.z + 9; p.fx = 0; p.fz = -1; } p.hp = Math.min(p.maxHp, p.hp); window.__synesQA.stepTicks(3); return w.bossStarted; });
  if (r) break;
}
await page.evaluate(() => { const w = window.__synes.world; w.player.hp = w.player.maxHp * 0.62; w.boss.hp = w.boss.maxHp * 0.7; window.__synesQA.stepTicks(20); });
await page.waitForTimeout(500); await shot('a-boss');
// (b) skill 1 cooling + potion used (count visible)
await page.keyboard.press('Digit1'); await page.keyboard.press('KeyQ');
await page.evaluate(() => window.__synesQA.stepTicks(24)); await page.waitForTimeout(400); await shot('b-cooldown');
// (c) joystick held (real pointer events on the stick zone)
await page.mouse.move(120, 290); await page.mouse.down(); await page.mouse.move(150, 275, { steps: 4 });
await page.evaluate(() => window.__synesQA.stepTicks(6)); await page.waitForTimeout(400); await shot('c-joystick');
await page.mouse.up();
// (d) pause menu
await page.click('#btn-pause'); await page.waitForTimeout(500); await shot('d-pause');
console.log(JSON.stringify({ tag, errs }));
await browser.close();
