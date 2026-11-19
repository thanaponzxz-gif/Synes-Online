// Game benchmark across emulated device profiles. Usage: node tools/qa/bench.mjs <baseUrl> [profiles] [extraQuery]
// Measures: start-screen ready, first gameplay frame, transferred bytes, FPS during a bot run, heap, draw calls.
// LIMITS: Chromium emulation + SwiftShader software GPU — FPS is relative only; not a real-device result.
import { chromium } from './pw.mjs';
import { PROFILES, applyProfile, contextOpts, LAUNCH_ARGS } from './profiles.mjs';
const base = process.argv[2] || 'http://localhost:8080';
const only = process.argv[3] ? process.argv[3].split(',') : Object.keys(PROFILES);
const extra = process.argv[4] || '';
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const rows = [];
for (const name of only) {
  const prof = PROFILES[name];
  const ctx = await browser.newContext(contextOpts(prof));
  const page = await ctx.newPage();
  await applyProfile(ctx, page, prof);
  let bytes = 0, reqs = 0;
  page.on('requestfinished', async (rq) => { try { const s = await rq.sizes(); bytes += s.responseBodySize + s.responseHeadersSize; reqs++; } catch {} });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  const t0 = Date.now();
  await page.goto(`${base}/?bot=0.6&seed=11${extra}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__synes?.perf?.firstPlayFrameMs > 0, null, { timeout: 90000 });
  const perf = await page.evaluate(() => window.__synes.perf);
  const fps = [];
  for (let i = 0; i < 8; i++) { await page.waitForTimeout(1000); fps.push(await page.evaluate(() => window.__synes.adaptive.fps)); }
  const info = await page.evaluate(() => ({ heap: performance.memory?.usedJSHeapSize || 0, calls: window.__synes.view.renderer.info.render.calls, tris: window.__synes.view.renderer.info.render.triangles, px: window.__synes.view.pixelRatio, tier: window.__synes.view.q.tier }));
  rows.push({ profile: name, tier: info.tier, readyMs: Math.round(perf.readyMs), firstPlayMs: Math.round(perf.firstPlayFrameMs), transferKB: Math.round(bytes / 1024), requests: reqs, fpsAvg: +(fps.reduce((a, b) => a + b) / fps.length).toFixed(1), endPixelRatio: info.px, drawCalls: info.calls, tris: info.tris, heapMB: +(info.heap / 1048576).toFixed(1), kit: perf.kit, errors: errors.length });
  console.log(JSON.stringify(rows.at(-1)));
  await ctx.close();
}
await browser.close();
console.table(rows);
