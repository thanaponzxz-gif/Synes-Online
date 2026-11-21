// Smoke test for the opening look options (?opening=A|B): rebuild paths (quality change, WebGL context loss/restore) and a live run
// from the camp into the plaza with the bot, no page errors, and the option objects exist exactly once after every rebuild.
//   node tools/qa/opening-smoke.mjs http://localhost:8080 [A,B]
// LIMITS: Chromium + SwiftShader, not a real phone.
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const base = process.argv[2] || 'http://localhost:8080';
const opts = (process.argv[3] || 'A,B').split(',');
const browser = await chromium.launch({ args: LAUNCH_ARGS });
let fail = 0;
const check = (ok, name, info = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); if (!ok) fail++; };
try {
  for (const o of opts) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); const errors = [];
    page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(`${base}/?offline&seed=1&q=medium&autostart&bot=1&opening=${o}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 60000 });
    const count = () => page.evaluate(() => { let g = 0, h = 0; window.__synes.view.env.traverse((n) => { if (n.name === 'opening_guide') g++; if (n.name === 'opening_halo') h++; }); return { g, h, opening: window.__synes.view.opening?.id ?? null }; });
    let c = await count(); check(c.g === 1 && c.h === 1 && c.opening === o, `${o}: guide crystal + halo built once`, JSON.stringify(c));
    await page.evaluate(() => { const s = document.getElementById('sel-quality'); s.value = 'low'; s.dispatchEvent(new Event('change')); }); await page.waitForTimeout(500); // settings panel is closed: set the value directly
    c = await count(); check(c.g === 1 && c.h === 1, `${o}: rebuilt once after quality change`, JSON.stringify(c));
    await page.evaluate(() => { const gl = window.__synes.view.renderer.getContext(); window.__lose = gl.getExtension('WEBGL_lose_context'); window.__lose.loseContext(); });
    await page.waitForTimeout(400);
    await page.evaluate(() => window.__lose.restoreContext()); await page.waitForTimeout(800);
    await page.evaluate(() => document.getElementById('btn-resume2')?.click()); await page.waitForTimeout(300);
    c = await count(); check(c.g === 1 && c.h === 1, `${o}: rebuilt once after context loss/restore`, JSON.stringify(c));
    const z0 = await page.evaluate(() => window.__synes.world.player.z);
    await page.waitForTimeout(9000); // live bot run (real time): camp -> trail -> first fights
    const st = await page.evaluate(() => ({ z: window.__synes.world.player.z, tick: window.__synes.world.tick, calls: window.__synes.view.renderer.info.render.calls, log: window.__synesQA.log.filter((l) => /render-error/.test(l.e)).length }));
    check(st.z < z0 - 5 && st.log === 0, `${o}: live run moves on, no render errors`, `z ${z0.toFixed(1)} -> ${st.z.toFixed(1)}, tick ${st.tick}, calls ${st.calls}`);
    check(errors.length === 0, `${o}: no page errors`, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} finally { await browser.close(); }
console.log(fail ? `${fail} failed` : 'all passed');
process.exit(fail ? 1 : 0);
