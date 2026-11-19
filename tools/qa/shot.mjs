// Screenshot helper: node tools/qa/shot.mjs <url> <outPrefix> [profile] [times(s) comma] [dpr]
import { chromium } from './pw.mjs';
import { PROFILES, contextOpts, LAUNCH_ARGS } from './profiles.mjs';
const [url, out, profName = 'android-mid', timesArg = '2', dprArg] = process.argv.slice(2);
const prof = { ...PROFILES[profName] }; if (dprArg) prof.dpr = +dprArg;
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const ctx = await browser.newContext(contextOpts(prof));
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: 'load' });
let t0 = Date.now();
for (const t of timesArg.split(',').map(Number)) {
  const wait = t * 1000 - (Date.now() - t0); if (wait > 0) await page.waitForTimeout(wait);
  await page.screenshot({ path: `${out}-${t}s.png` });
}
const info = await page.evaluate(() => { const s = window.__synes; return s ? { state: s.state, tick: s.world.tick, hp: s.world.player.hp, boss: s.world.boss.hp, perf: s.perf, fps: s.adaptive.fps, px: s.view.pixelRatio, calls: s.view.renderer.info.render.calls, tris: s.view.renderer.info.render.triangles } : null; });
console.log(JSON.stringify(info));
console.log(errors.slice(0, 15).join('\n'));
await browser.close();
