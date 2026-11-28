// In-game pose and colour comparison of two crab files (DES-010 §10.5 items 1–2): the same scene, the same camera, the same
// clip ticks, one dev server per file. The boss is held in place facing the player (state set by hand every frame) and one
// clip is shown at one clip tick (window.__crabBoss.hold); nothing here is a rules test.
//   server A (old file):  SYNES_BOSS_STEM=mon_boss_crab_v01 SYNES_SEYRIN_DIR=<inbox> npx vite --port 5182 --strictPort
//   server B (new file):  SYNES_SEYRIN_DIR=<inbox> npx vite --port 5181 --strictPort
// Usage: node tools/qa/crab-pose.mjs [A=http://localhost:5182] [B=http://localhost:5181] [outDir] [low|medium]
// Measured per pose, in CSS px at 844x390: the crab's own pixels (frame with the crab minus the same frame without it) give
// the silhouette width / height and the mean colour; the claw sockets give the claw positions.
// The pictures show a private REVIEW model: keep them out of git (default tools/qa/out/crab-pose, which is ignored).
// Emulated Chromium + SwiftShader on a PC: not a phone result.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const A = process.argv[2] || 'http://localhost:5182', B = process.argv[3] || 'http://localhost:5181';
const out = process.argv[4] || 'tools/qa/out/crab-pose';
const tier = process.argv[5] || 'medium';
fs.mkdirSync(out, { recursive: true });
const POSES = [['idle', 0], ['walk', 6], ...[8, 12, 17, 24, 30].map((t) => ['sweep', t]), ...[8, 12, 17, 24, 30].map((t) => ['slam', t]), ['charge_windup', 17], ['roar', 15], ['shard_cast', 20], ['stunned', 10], ['down', 12]];
const edge = process.env.SYNES_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });

async function run(base, label) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript((t) => { try { localStorage.setItem('synes.quality', t); } catch { /* storage blocked */ } }, tier);
  await page.goto(`${base}/?ruleset=ninja-roam-1&offline&autostart&seed=7&start=boss`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__synes?.state === 'playing' && window.__crabBoss?.snapshot().loaded, null, { timeout: 120000 });
  const stats = await page.evaluate(() => { const s = window.__crabBoss.snapshot().stats; return { sha256: s.sha256, bytes: s.bytes }; });
  // walk in, let the intro end, then hold the scene still: player 4.5 m in front of the boss, the boss facing the player
  await page.evaluate(async () => {
    const S = window.__synes, w = S.world, frames = (n) => new Promise((r) => { const f = () => (--n <= 0 ? r() : requestAnimationFrame(f)); f(); });
    const t = w.level.boss.trigger; w.player.x = t.x; w.player.z = t.z;
    for (let i = 0; i < 300 && !w.bossStarted; i++) await frames(1);
    for (let i = 0; i < 600 && w.boss.state === 'intro'; i++) { w.player.hp = w.player.maxHp; await frames(1); }
    const pin = () => {
      requestAnimationFrame(pin);
      const b = w.boss; w.player.hp = w.player.maxHp; w.player.x = -2; w.player.z = -72; w.player.fx = 0; w.player.fz = -1;
      b.x = -2; b.z = -76.5; b.fx = 0; b.fz = 1; b.state = 'recover'; b.st = 5; b.atk = ''; b.hp = b.maxHp;
      w.tele = w.tele.filter((x) => x.owner !== b.id);
    };
    pin();
    await frames(150); // the camera and the boss's turn settle
  });
  const rows = [];
  for (const [clip, tick] of POSES) {
    const m = await page.evaluate(async ([clip, tick]) => {
      const S = window.__synes, frames = (n) => new Promise((r) => { const f = () => (--n <= 0 ? r() : requestAnimationFrame(f)); f(); });
      window.__crabBoss.hold(clip, tick);
      await frames(4);
      const r = S.view.renderer, cv = r.domElement, W = cv.width, H = cv.height, pr = W / cv.clientWidth;
      const grab = () => { r.render(S.view.scene, S.view.camera); const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(cv, 0, 0); return [c, g.getImageData(0, 0, W, H).data]; };
      const crab = S.view.scene.getObjectByName('crab-boss');
      const [withC, a] = grab(); crab.visible = false; const [, b] = grab(); crab.visible = true;
      let l = W, rr = -1, t = H, bt = -1, n = 0, R = 0, G = 0, Bl = 0;
      const mask = document.createElement('canvas'); mask.width = W; mask.height = H; const mg = mask.getContext('2d'), md = mg.createImageData(W, H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4, on = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24;
        md.data[i] = md.data[i + 1] = md.data[i + 2] = on ? 20 : 235; md.data[i + 3] = 255;
        if (!on) continue;
        n++; R += a[i]; G += a[i + 1]; Bl += a[i + 2];
        if (x < l) l = x; if (x > rr) rr = x; if (y < t) t = y; if (y > bt) bt = y;
      }
      mg.putImageData(md, 0, 0);
      const cx = (l + rr) / 2, cy = (t + bt) / 2, zw = 240 * pr, zh = 180 * pr;
      const crop = (src) => { const z = document.createElement('canvas'); z.width = 720; z.height = 540; const g = z.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, cx - zw / 2, cy - zh / 2, zw, zh, 0, 0, 720, 540); return z.toDataURL('image/png'); };
      const meas = window.__crabBoss.measure();
      return { png: withC.toDataURL('image/png'), zoom: crop(withC), sil: crop(mask), w: (rr - l + 1) / pr, h: (bt - t + 1) / pr, px: n / (pr * pr), rgb: n ? [R / n, G / n, Bl / n] : [0, 0, 0], clawL: meas.clawL, clawR: meas.clawR };
    }, [clip, tick]);
    const name = `${label}-${tier}-${clip}-${String(tick).padStart(2, '0')}`;
    fs.writeFileSync(path.join(out, `${name}.png`), Buffer.from(m.png.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(out, `${name}-zoom.png`), Buffer.from(m.zoom.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(out, `${name}-silhouette.png`), Buffer.from(m.sil.split(',')[1], 'base64'));
    rows.push({ clip, tick, w: m.w, h: m.h, px: m.px, rgb: m.rgb, clawL: m.clawL, clawR: m.clawR });
  }
  await page.evaluate(() => window.__crabBoss.hold(null));
  await ctx.close();
  return { stats, rows, errors };
}
const a = await run(A, 'a'), b = await run(B, 'b');
await browser.close();
const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const report = { tier, viewport: '844x390', a: a.stats, b: b.stats, poses: [] };
console.log(`A ${a.stats.sha256.slice(0, 12)} (${a.stats.bytes} bytes)   B ${b.stats.sha256.slice(0, 12)} (${b.stats.bytes} bytes)   ${tier}`);
console.log('clip            tick |  A width  B width | A claw_r move  B claw_r move | A claws up  B claws up | A lum  B lum');
for (let i = 0; i < POSES.length; i++) {
  const row = (R) => {
    const p = R.rows[i], idle = R.rows[0];
    const move = Math.hypot(p.clawR.x - idle.clawR.x, p.clawR.y - idle.clawR.y);       // how far the claw_r point is from where idle has it
    const up = Math.min(idle.clawL.y - p.clawL.y, idle.clawR.y - p.clawR.y);           // how much BOTH claws are raised (the smaller of the two)
    return { w: p.w, h: p.h, clawRMove: move, bothClawsUp: up, lum: lum(p.rgb), rgb: p.rgb.map((v) => +v.toFixed(1)) };
  };
  const ra = row(a), rb = row(b);
  report.poses.push({ clip: POSES[i][0], tick: POSES[i][1], a: ra, b: rb });
  const f = (v) => v.toFixed(1).padStart(7);
  console.log(`${String(POSES[i][0]).padEnd(15)} ${String(POSES[i][1]).padStart(4)} | ${f(ra.w)}  ${f(rb.w)} | ${f(ra.clawRMove)}       ${f(rb.clawRMove)}  | ${f(ra.bothClawsUp)}    ${f(rb.bothClawsUp)} | ${f(ra.lum)} ${f(rb.lum)}`);
}
fs.writeFileSync(path.join(out, `compare-${tier}.json`), JSON.stringify(report, null, 1));
const at = (clip, tick) => report.poses.find((p) => p.clip === clip && p.tick === tick);
const sw = at('sweep', 17), sl = at('slam', 17);
console.log(`\nguide lines of DES-010 §10.5 item 1 at clip tick 17 (B = the new file):`);
console.log(`${sw.b.clawRMove >= 12 ? 'PASS' : 'FAIL'}  sweep: the claw_r point is >= 12 CSS px from where idle has it  — B ${sw.b.clawRMove.toFixed(1)} px (A ${sw.a.clawRMove.toFixed(1)} px)`);
console.log(`${sl.b.bothClawsUp >= 15 ? 'PASS' : 'FAIL'}  slam: both claws are raised >= 15 CSS px  — B ${sl.b.bothClawsUp.toFixed(1)} px (A ${sl.a.bothClawsUp.toFixed(1)} px)`);
console.log(`NOTE  idle silhouette width in game: A ${at('idle', 0).a.w.toFixed(1)} px, B ${at('idle', 0).b.w.toFixed(1)} px (the Blender comparison was set to 110 px)`);
if (a.errors.length || b.errors.length) console.log('page errors:', [...a.errors, ...b.errors].slice(0, 3).join(' | '));
