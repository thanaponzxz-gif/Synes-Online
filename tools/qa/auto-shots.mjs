// Auto attack screenshots at 844x390 CSS px (dpr 2): HUD with Auto off, HUD with Auto on while fighting in the clearing, settings panel open.
//   node tools/qa/auto-shots.mjs <baseUrl> [outDir]      (baseUrl = a served build, see tools/qa/serve.mjs; default outDir docs/qa/auto-v01)
// The player is moved into the clearing with a direct state write (QA only, like clip.mjs); every Auto setting is changed through the real UI
// (clicks on the HUD toggle / gear / panel), so the settings travel the normal input path.
import fs from 'node:fs'; import path from 'node:path';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';
const [base, outDir = 'docs/qa/auto-v01'] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('requestfailed', (r) => errs.push('reqfail ' + r.url()));
page.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
await page.goto(`${base}/?offline&seed=1&q=medium&qafreeze`, { waitUntil: 'load' });
await page.waitForSelector('#btn-start:not([disabled])', { timeout: 60000 });
await page.click('#btn-start');
await page.waitForFunction(() => window.__synes?.world && window.__synes.state === 'playing');
await page.waitForTimeout(7000); // SwiftShader: first frame
const shot = (n) => page.screenshot({ path: path.join(outDir, n) });
const step = (n) => page.evaluate((k) => window.__synesQA.stepTicks(k), n);
await step(20); await page.waitForTimeout(600);
await shot('hud-auto-off.png');
// into the clearing (3,-33): the enemies wake when the player is within 6.5 m of the clearing centre
await page.evaluate(() => { const p = window.__synes.world.player; p.x = 3; p.z = -33; p.fx = 0; p.fz = -1; });
await step(4);
await page.click('#btn-auto-set'); await page.waitForTimeout(500);
await page.click('#ap-area button[data-hall="1"]');
for (const i of [0, 1, 2]) await page.click(`#ap-skills button[data-slot="${i}"]`);
await page.waitForTimeout(400);
await shot('settings-panel.png');
await page.click('#btn-auto-close'); await page.waitForTimeout(300);
await page.click('#btn-auto'); // enable through the HUD toggle
// run until Auto is mid-skill (cast >= 3 ticks in) with at least one enemy still alive nearby: the "fighting" frame
const log = [];
for (let i = 0; i < 200; i++) {
  await step(1);
  const s = await page.evaluate(() => { const w = window.__synes.world; const near = w.actors.filter((a) => a.kind !== 'player' && a.kind !== 'prismback' && a.alive && a.group === 'clearing').length; return { tick: w.tick, auto: w.auto.s.enabled, target: w.auto.target, near, cast: w.ps.cast ? w.ps.cast.tick : -1, slot: w.ps.cast?.slot ?? 0 }; });
  log.push(s);
  if (s.cast >= 3 && s.near >= 2 && s.slot !== 1) break;
}
await page.waitForTimeout(500);
await shot('hud-auto-on-fighting.png');
console.log(JSON.stringify({ last: log[log.length - 1], ticks: log.length, errs }));
await browser.close();
