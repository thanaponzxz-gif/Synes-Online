// Player-skill VFX draw-call measurement + screenshots (team B). DES-001 §3: +5 draw calls (Medium) / +3 (Low) when all overlap.
// Usage: node tools/qa/vfx-calls.mjs [baseUrl] [outDir] [seed]      (serve the build first: node tools/qa/serve.mjs dist 8191)
// Same scene, camera and sim state for both runs: ?offline&seed=N&start=boss&qafreeze, sim stepped only through __synesQA.stepTicks,
// stop when the boss telegraph is visible, then compare renderer.info.render.calls with ?vfx=0 against VFX on.
// "All overlap" = the three skill-hit events injected into the VIEW on the same tick (sim state untouched). The sim never lets
// two skills hit at once (one cast at a time), so this is the worst case the pool must stay under, not a reachable play state.
// LIMITS: Chromium + SwiftShader (software GPU) in a container; draw-call counts are renderer-side and device independent, timings are not.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const [base = 'http://localhost:8191', out = 'docs/qa/vfx-2b', seed = '11'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync('tools/qa/out', { recursive: true });
const browser = await chromium.launch({ args: LAUNCH_ARGS });

/** Open the boss scene frozen; step until a boss telegraph (>= 1 s left) exists; put the player on it, facing the boss. Returns the page. */
async function openScene(tier, vfx) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${base}/?offline&seed=${seed}&start=boss&q=${tier}&autostart&qafreeze${vfx ? '' : '&vfx=0'}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__synes?.world && window.__synes.state === 'playing');
  const info = await page.evaluate(() => {
    const s = window.__synes, w = s.world, Q = window.__synesQA;
    w.player.hp = w.player.maxHp = 99999;
    w.player.x = -2; w.player.z = -74; w.player.fx = 0; w.player.fz = -1;
    let n = 0, ok = false;
    for (; n < 30 * 90; n++) {
      Q.stepTicks(1, false);
      if (w.bossStarted && w.tele.some((t) => t.t > 1.0 && 1 - t.t / t.total > 0.05 && t.atk.id !== 'charge')) { ok = true; break; }
      w.player.x = -2; w.player.z = -74; // keep the player parked until the fight starts
    }
    const t = w.tele.find((x) => x.t > 1.0 && x.atk.id !== 'charge');
    const boss = w.actors.find((a) => a.kind === 'prismback');
    if (t) {
      // stand 5.8 m from the boss, in line with the warning's axis side, facing the boss: the skill areas land on the telegraph and are not hidden by the boss body
      w.player.x = boss.x; w.player.z = boss.z + 5.8;
      w.player.fx = 0; w.player.fz = -1;
      w.ps.cdT = [0, 0, 0]; w.ps.skillCd = 0;
    }
    Q.stepTicks(0);
    return { ok, ticks: n, tick: w.tick, tele: w.tele.map((x) => `${x.atk.id}:${x.shape}:${(1 - x.t / x.total).toFixed(2)}`), player: [w.player.x, w.player.z] };
  });
  return { page, ctx, info };
}
const shot = async (page, name) => page.screenshot({ path: path.join(out, name + '.jpg'), type: 'jpeg', quality: 80 });
const calls = (page) => page.evaluate(() => { window.__synesQA.stepTicks(0); const r = window.__synes.view.renderer.info.render; return { calls: r.calls, tris: r.triangles }; });

const results = { generatedAt: new Date().toISOString(), seed, viewport: '844x390@2x', note: 'Chromium + SwiftShader (software GPU), container', rows: [] };
const OVERLAP_AGE = 3; // ticks after the (synthetic) hit events: ring, crescent and crystals all visible

for (const tier of ['medium', 'low', 'high']) {
  const row = { tier };
  for (const vfx of [false, true]) {
    const { page, ctx, info } = await openScene(tier, vfx);
    if (!info.ok) throw new Error('no boss telegraph reached: ' + JSON.stringify(info));
    row.scene = info;
    // 1) worst-case overlap: all three hit events on one tick
    await page.evaluate((age) => {
      const s = window.__synes, w = s.world, p = w.player;
      s.view.onEvents([1, 2, 3].map((slot) => ({ t: 'skill-hit', slot, x: p.x, z: p.z, dx: p.fx, dz: p.fz, hits: 0 })), w);
      window.__synesQA.stepTicks(age);
    }, OVERLAP_AGE);
    const o = await calls(page);
    row[vfx ? 'overlapOn' : 'overlapOff'] = o;
    if (vfx && (tier === 'medium' || tier === 'low')) await shot(page, `overlap-telegraph-${tier}`);
    await ctx.close();
    // 2) per skill, real casts through the sim (key press -> stepTicks)
    if (vfx && tier !== 'high') {
      row.perSkill = {};
      for (const slot of [1, 2, 3]) {
        const off = await openScene(tier, false), on = await openScene(tier, true);
        const D = { 1: { hit: 10, name: 'chime' }, 2: { hit: 6, name: 'crescent' }, 3: { hit: 15, name: 'crystal' } }[slot];
        const run = async (pg, cap) => {
          await pg.keyboard.press('Digit' + slot);
          const at = async (n, label) => { await pg.evaluate((k) => window.__synesQA.stepTicks(k), n); const c = await calls(pg); if (cap && label) await shot(pg, `${D.name}-${tier}-${label}`); return c; };
          const res = {};
          // prep = mid-wind-up, hit = 2 ticks after the hit tick, end = after the VFX should be gone
          res.prep = await at(Math.max(1, Math.round(D.hit * 0.6)), 'prep');
          res.hit = await at(D.hit - Math.round(D.hit * 0.6) + (slot === 3 ? 4 : 2), 'hit'); // crystals peak ~4 ticks after the hit tick
          res.end = await at(slot === 1 ? 12 : slot === 2 ? 8 : 14, 'end');
          res.max = Math.max(res.prep.calls, res.hit.calls, res.end.calls);
          return res;
        };
        const a = await run(off.page, false), b = await run(on.page, true);
        row.perSkill[D.name] = { off: a, on: b, add: b.max - a.max };
        await off.ctx.close(); await on.ctx.close();
      }
    }
  }
  row.add = row.overlapOn.calls - row.overlapOff.calls;
  results.rows.push(row);
  console.log(tier, 'overlap calls off/on', row.overlapOff.calls, row.overlapOn.calls, '=> +' + row.add, JSON.stringify(Object.fromEntries(Object.entries(row.perSkill ?? {}).map(([k, v]) => [k, '+' + v.add]))));
}
fs.writeFileSync('tools/qa/out/vfx-calls.json', JSON.stringify(results, null, 1));
console.log(JSON.stringify(results.rows.map((r) => ({ tier: r.tier, off: r.overlapOff, on: r.overlapOn, add: r.add, scene: r.scene.tele })), null, 1));
await browser.close();
