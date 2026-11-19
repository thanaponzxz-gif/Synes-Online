// Usage: node tools/qa/spike-bench.mjs http://localhost:4173
import { chromium } from './pw.mjs';
import { PROFILES, applyProfile, contextOpts, LAUNCH_ARGS } from './profiles.mjs';
const base = process.argv[2] || 'http://localhost:4173';
const engines = (process.argv[3] || 'playcanvas,three').split(',');
const only = process.argv[4] ? process.argv[4].split(',') : null;
const query = process.argv[5] || '';
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const rows = [];
for (const [pname, prof] of Object.entries(PROFILES).filter(([n]) => !only || only.includes(n))) for (const eng of engines) {
  const ctx = await browser.newContext(contextOpts(prof));
  const page = await ctx.newPage();
  await applyProfile(ctx, page, prof);
  let bytes = 0;
  page.on('requestfinished', async (rq) => { try { const sz = await rq.sizes(); bytes += sz.responseBodySize + sz.responseHeadersSize; } catch {} });
  await page.goto(`${base}/${eng}/index.html${query}`, { waitUntil: 'load' });
  await page.waitForFunction(() => (window).__bench?.firstFrame, null, { timeout: 60000 });
  const firstFrame = await page.evaluate(() => (window).__bench.firstFrame);
  // bot: walk circles, attack/dodge, for 6s
  await page.evaluate(() => { const w = window; w.__botInput = true; let t = 0; w.__bot = setInterval(() => { t += 0.05; w.__input.mx = Math.cos(t); w.__input.my = Math.sin(t); if (Math.random() < 0.1) w.__input.attack = true; }, 50); });
  const samples = [];
  await page.waitForTimeout(1500);
  for (let i = 0; i < 6; i++) { await page.waitForTimeout(1000); samples.push(await page.evaluate(() => (window).__bench.fps)); }
  const heap = await page.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize : 0);
  rows.push({ profile: pname, engine: eng + query, firstFrameMs: Math.round(firstFrame), transferKB: Math.round(bytes / 1024), fpsAvg: +(samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(1), fpsMin: +Math.min(...samples).toFixed(1), heapMB: +(heap / 1048576).toFixed(1) });
  console.log(JSON.stringify(rows.at(-1)));
  await ctx.close();
}
await browser.close();
console.table(rows);
