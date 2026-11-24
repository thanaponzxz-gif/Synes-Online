import { chromium } from '/home/user/Synes-Online/tools/qa/pw.mjs';
import fs from 'node:fs';
const base = process.env.BASE || 'http://localhost:8121', env = process.env.ENVLIB ? '&envlib=1' : '', spire = process.env.SPIRE ? '&spire=B' : '';
const LAUNCH = ['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl','--enable-precise-memory-info'];
const browser = await chromium.launch({ args: LAUNCH });
const res = {};
for (const tier of ['low','medium','high']) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => { window.__t = {}; const mo = new MutationObserver(() => { const b = document.querySelector('#btn-start'); if (b && !b.disabled && !window.__t.btn) window.__t.btn = performance.now(); }); document.addEventListener('DOMContentLoaded', () => { const b = document.querySelector('#btn-start'); if (b) mo.observe(b, { attributes: true, childList: true, characterData: true, subtree: true }); }); });
  const reqs = []; page.on('response', async (r) => { try { const h = r.headers(); reqs.push({ url: r.url().replace(base, ''), status: r.status(), enc: h['content-encoding'] || '', len: +h['content-length'] || 0 }); } catch {} });
  const cdp = await ctx.newCDPSession(page); await cdp.send('Performance.enable');
  await page.goto(`${base}/?offline&seed=1&q=${tier}${env}${spire}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__t.btn, null, { timeout: 90000 });
  const pre = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const res = performance.getEntriesByType('resource').map(r => ({ n: r.name.split('/').slice(-1)[0], start: Math.round(r.startTime), end: Math.round(r.responseEnd), tr: r.transferSize, dec: r.decodedBodySize, type: r.initiatorType })); const paint = performance.getEntriesByType('paint').map(p => [p.name, Math.round(p.startTime)]); return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), btn: Math.round(window.__t.btn), paint, res, heap: performance.memory && performance.memory.usedJSHeapSize }; });
  const m0 = await cdp.send('Performance.getMetrics');
  const t0 = Date.now();
  await page.evaluate(() => document.querySelector('#btn-start').click());
  await page.waitForFunction(() => window.__synes?.world && window.__synes.state === 'playing', null, { timeout: 90000 });
  const startMs = Date.now() - t0;
  await page.evaluate(() => window.__synesQA?.stepTicks?.(0)); await page.waitForTimeout(1500);
  const post = await page.evaluate(() => {
    const v = window.__synes.view, R = v.renderer, scene = v.scene;
    const texs = new Map(); const add = (t, o) => { if (t && t.isTexture && !texs.has(t)) { const im = t.image; const w = (im && (im.width || im.videoWidth)) || 0, h = (im && im.height) || 0; texs.set(t, { owner: o, w, h, mip: t.generateMipmaps && t.minFilter !== 1006 && t.minFilter !== 1003, bytes: Math.round(w * h * 4 * (t.generateMipmaps && t.minFilter !== 1006 && t.minFilter !== 1003 ? 4 / 3 : 1)) }); } };
    scene.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) { for (const k of Object.keys(m)) add(m[k], o.name || o.type); if (m.uniforms) for (const u of Object.values(m.uniforms)) add(u.value, o.name || o.type); } });
    const tl = [...texs.values()].sort((a, b) => b.bytes - a.bytes);
    const gl = R.getContext();
    return { info: { geo: R.info.memory.geometries, tex: R.info.memory.textures, programs: R.info.programs.length, progNames: R.info.programs.map(p => p.name + ':' + p.usedTimes), calls: R.info.render.calls, tris: R.info.render.triangles }, pr: R.getPixelRatio(), buf: [gl.drawingBufferWidth, gl.drawingBufferHeight], texList: tl.slice(0, 12), texCount: tl.length, texBytes: tl.reduce((a, t) => a + t.bytes, 0), heap: performance.memory && performance.memory.usedJSHeapSize, heapTotal: performance.memory && performance.memory.totalJSHeapSize, sceneObjs: (() => { let n = 0; scene.traverse(() => n++); return n; })() };
  });
  const m1 = await cdp.send('Performance.getMetrics'); const g = (m, k) => m.metrics.find(x => x.name === k)?.value;
  res[tier] = { pre, startMs, post, cdp: { heap0: g(m0, 'JSHeapUsedSize'), heap1: g(m1, 'JSHeapUsedSize'), nodes: g(m1, 'Nodes'), listeners: g(m1, 'JSEventListeners') }, reqs };
  console.log(tier, 'btn', pre.btn, 'start->playing ms', startMs, 'programs', post.info.programs, 'geo', post.info.geo, 'tex', post.info.tex, 'heapMB', (post.heap / 1048576).toFixed(1), 'reqs', reqs.length, 'buf', post.buf, 'texMB', (post.texBytes / 1048576).toFixed(2));
  await ctx.close();
}
fs.writeFileSync(process.argv[2], JSON.stringify(res, null, 1));
await browser.close();
