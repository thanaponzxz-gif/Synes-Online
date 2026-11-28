// Before / after of the crab picture (DES-010 §5.3 item 7) in the same scene, seed, camera and quality: the boss fight of
// `ninja-roam-1` in phase 2 (crystal rain) with the player standing in the arena. `?boss=old` is the before (Prismback).
// Warm-up 300 frames, then 600 frames measured, each side twice in the order old, crab, old, crab to show the noise.
// Usage: node tools/qa/crab-perf.mjs [http://localhost:5181] [low|medium]
// Emulated Chromium + SwiftShader on a PC: the frame times are software rendering, not a phone number; draw calls and
// triangles are exact.
import fs from 'node:fs';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const base = process.argv[2] || 'http://localhost:5181';
const tier = process.argv[3] || 'medium';
const edge = process.env.SYNES_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });

async function run(which) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript((t) => { try { localStorage.setItem('synes.quality', t); } catch { /* storage blocked */ } }, tier);
  await page.goto(`${base}/?ruleset=ninja-roam-1&offline&autostart&seed=7&start=boss${which === 'old' ? '&boss=old' : ''}`, { waitUntil: 'load' });
  await page.waitForFunction((crab) => window.__synes?.state === 'playing' && (!crab || window.__crabBoss?.snapshot().loaded), which === 'crab', { timeout: 120000 });
  const out = await page.evaluate(async () => {
    const S = window.__synes, w = S.world, spot = [w.level.boss.trigger.x, w.level.boss.trigger.z];
    const frames = [], calls = [], tris = [];
    let n = 0, last = performance.now(), p2 = false;
    await new Promise((done) => {
      const loop = (now) => {
        w.player.hp = w.player.maxHp; w.player.x = spot[0]; w.player.z = spot[1];
        if (w.bossStarted && !p2 && w.boss.state !== 'intro') { p2 = true; w.boss.hp = Math.floor(w.boss.maxHp * 0.4); }
        if (w.boss.alive && w.boss.hp < w.boss.maxHp * 0.2) w.boss.hp = Math.floor(w.boss.maxHp * 0.4); // keep the fight going for the whole measurement
        n++;
        if (n === 300) window.__crabBoss?.cpuReset?.();
        if (n > 300) { frames.push(now - last); calls.push(S.view.renderer.info.render.calls); tris.push(S.view.renderer.info.render.triangles); }
        last = now;
        if (n >= 900) return done();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
    const q = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor(a.length * p)];
    return { frames: frames.length, ms: { p50: q(frames, 0.5), p95: q(frames, 0.95) }, calls: { p50: q(calls, 0.5), max: Math.max(...calls) }, tris: { p50: q(tris, 0.5), max: Math.max(...tris) },
      phase: w.phase, bossAlive: w.boss.alive, cpu: window.__crabBoss?.cpu?.() ?? null, tier: S.view.q.tier };
  });
  await ctx.close();
  return out;
}
const rows = [];
for (const which of ['old', 'crab', 'old', 'crab']) {
  const r = await run(which); rows.push([which, r]);
  console.log(`${which.padEnd(5)} ${r.tier} · phase ${r.phase} · frame ms p50 ${r.ms.p50.toFixed(1)} p95 ${r.ms.p95.toFixed(1)} · draw calls p50 ${r.calls.p50} max ${r.calls.max} · tris p50 ${r.tris.p50} max ${r.tris.max}` +
    (r.cpu ? ` · boss controller+mixer+fx ms p50 ${r.cpu.p50.toFixed(3)} p95 ${r.cpu.p95.toFixed(3)} max ${r.cpu.max.toFixed(3)} (${r.cpu.frames} frames)` : ''));
}
await browser.close();
const pick = (w, f) => rows.filter((r) => r[0] === w).map((r) => f(r[1]));
console.log(`\ndraw calls max: old ${pick('old', (r) => r.calls.max).join(' / ')} · crab ${pick('crab', (r) => r.calls.max).join(' / ')}`);
console.log(`draw calls p50: old ${pick('old', (r) => r.calls.p50).join(' / ')} · crab ${pick('crab', (r) => r.calls.p50).join(' / ')}`);
console.log(`frame p95 ms:   old ${pick('old', (r) => r.ms.p95.toFixed(1)).join(' / ')} · crab ${pick('crab', (r) => r.ms.p95.toFixed(1)).join(' / ')}`);
