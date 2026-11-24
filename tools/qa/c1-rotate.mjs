// C-1 / TD-2 acceptance (ก): camera pull-back must not leak into the portrait camera after a landscape -> portrait rotation.
//   node tools/qa/c1-rotate.mjs --dist <dir> | --base <url>  [--out file.json] [--tiers low,medium] [--spots off,opening] [--port 8111] [--label name]
// What it does (per tier x spot): open ?offline&seed=1&autostart&qafreeze&q=<tier> at 844x390, optionally QA-teleport the player (world.player.x/z, same as stage1-shots),
// settle the camera, FORCE the pull through the live View (view.camPull = 1.2, view.camPullHold = 0.7: the hold View.updateCamera sets when pull rises), draw one landscape frame,
// page.setViewportSize(390x844), then step 1 tick + 1 drawn frame at a time for ~3 s (90 frames) and record per frame: camPull, camPullHold, camera pos / fov / aspect and the ground z
// that the bottom screen edge reaches (centre-column ray of the LIVE three.js camera against y=0; yaw is 0 so the whole edge has this z). Then the reverse (portrait -> landscape), information only.
// Reference numbers are the formulas of src/render/cameraField.ts REIMPLEMENTED below (constants copied from that file; --src <repo root> additionally imports the real file via Node type stripping and checks they agree).
// Verdict: PASS iff in EVERY portrait frame reach <= limit + 0.05 m, limit = max(expected portrait reach(player z), viewLimitZ(-41)) for the 'off' spot (player pinned at z -41.02, pilot OFF zone, acceptance ก),
//   else expected portrait reach(player z). STRICT (extra, printed): reach <= expected portrait reach + 0.05 in every frame (should hold after a correct fix; at the OFF edge the PASS limit is much looser).
// LIMITS: headless Chromium + SwiftShader, setViewportSize is not a real device rotation (no orientationchange event); frames are tick-exact via __synesQA.stepTicks (frozen sim, no wall-clock).
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const TIERS = opt('tiers', 'low,medium').split(','), SPOTS = opt('spots', 'off,opening').split(',');
const label = opt('label', 'run'), outFile = opt('out', ''), FRAMES = Number(opt('frames', 90));
const WATCHDOG_MS = Number(opt('watchdog', 280)) * 1000;
const T0 = Date.now(), watchdog = setTimeout(() => { console.error('WATCHDOG timeout'); process.exit(3); }, WATCHDOG_MS); watchdog.unref();

// ---- cameraField.ts constants + formulas (copy; see header)
const C = { FOV_L: 48, FOV_P: 62, PULL_MAX: 1.2, FOLLOW: 6, EYE_Y: 4.5, EYE_DZ: 5.5, TGT_HIGH: 0.6, TGT_DROP: 0.45, TGT_BACK: 5, DIST: 0.86, P_MUL: 1.35, P_EYE_Y: 10.5, P_EYE_DZ: 9, P_TGT_BACK: 2.4, SPEED: 5.2, DODGE_SPEED: 12, SAFETY: 0.5, OFF_Z: -41 };
function fieldCamera(pz, pull, portrait) {
  const low = portrait ? 0 : 1, dist = C.DIST * (portrait ? C.P_MUL : 1);
  const ty = C.TGT_HIGH - C.TGT_DROP * low, tz = portrait ? pz - C.P_TGT_BACK : pz - C.TGT_BACK;
  const oy = C.P_EYE_Y * dist * (1 - low) + C.EYE_Y * low, cz = (tz + C.P_EYE_DZ * dist) * (1 - low) + (pz + C.EYE_DZ) * low;
  const k = 1 + (portrait ? 0 : pull);
  return { eyeY: ty + (oy - ty) * k, eyeZ: tz + (cz - tz) * k, tgtY: ty, tgtZ: tz, fov: portrait ? C.FOV_P : C.FOV_L };
}
function fieldReachZ(pz, pull, portrait, h = 0) { const c = fieldCamera(pz, pull, portrait), a = Math.atan2(c.eyeY - c.tgtY, c.eyeZ - c.tgtZ) + (c.fov * Math.PI) / 360; return c.eyeZ - (c.eyeY - h) / Math.tan(a); }
const fieldGroundZ = (pz, pull, portrait) => fieldReachZ(pz, pull, portrait, 0);
const viewLimitZ = (offZ, h = 0) => Math.max(fieldReachZ(offZ, C.PULL_MAX, false, h), fieldReachZ(offZ, 0, true, h)) + C.DODGE_SPEED / C.FOLLOW + C.SAFETY;
let srcCheck = null;
if (opt('src', '')) {
  try { const m = await import(path.resolve(opt('src'), 'src/render/cameraField.ts')); srcCheck = { viewLimitZ: [m.viewLimitZ(-41), viewLimitZ(-41)], ground: [m.fieldGroundZ(-41.02, 1.2, false), fieldGroundZ(-41.02, 1.2, false)] }; srcCheck.ok = Math.abs(srcCheck.viewLimitZ[0] - srcCheck.viewLimitZ[1]) < 1e-9 && Math.abs(srcCheck.ground[0] - srcCheck.ground[1]) < 1e-9; }
  catch (e) { srcCheck = { ok: false, error: String(e.message || e) }; }
}

// ---- static server (unless --base)
let srv = null, base = opt('base', '');
if (!base) {
  const dist = opt('dist', ''); if (!dist) { console.error('need --dist <dir> or --base <url>'); process.exit(2); }
  const root = path.resolve(dist);
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };
  srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' }); res.end(fs.readFileSync(f));
  });
  const port = Number(opt('port', process.env.SYNES_QA_PORT || 8111));
  await new Promise((r, j) => { srv.once('error', j); srv.listen(port, '127.0.0.1', r); });
  base = `http://127.0.0.1:${port}`;
}
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const errors = [];

/** in-page: live state of the view + camera. reach = ground z of the bottom-edge centre-column ray (unproject NDC (0,-1,+-1) with the camera's own matrices). */
const SNAP = () => {
  const s = window.__synes, v = s.view, cam = v.camera, p = s.world.player;
  const m = cam.matrixWorld.elements, pi = cam.projectionMatrixInverse.elements;
  const mul = (e, x, y, z) => { const w = e[3] * x + e[7] * y + e[11] * z + e[15]; return [(e[0] * x + e[4] * y + e[8] * z + e[12]) / w, (e[1] * x + e[5] * y + e[9] * z + e[13]) / w, (e[2] * x + e[6] * y + e[10] * z + e[14]) / w]; };
  const a = mul(m, ...mul(pi, 0, -1, -1)), b = mul(m, ...mul(pi, 0, -1, 1)), t = a[1] / (a[1] - b[1]);
  return { tick: s.world.tick, pz: p.z, px: p.x, camPull: v.camPull, camPullHold: v.camPullHold, camX: cam.position.x, camY: cam.position.y, camZ: cam.position.z, fov: cam.fov, aspect: cam.aspect, w: innerWidth, h: innerHeight, reach: a[2] + (b[2] - a[2]) * t };
};
const r3 = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? +v.toFixed(4) : v]));
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, j) => setTimeout(() => j(new Error('timeout: ' + what)), ms))]);

async function runCase(tier, spot) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); page.setDefaultTimeout(30000);
  page.on('pageerror', (e) => errors.push(`${tier}/${spot}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console ${tier}/${spot}: ${m.text()}`); });
  const res = { tier, spot, frames: [], reverse: [] };
  try {
    await page.goto(`${base}/?offline&seed=1&autostart&qafreeze&q=${tier}`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__synes?.state === 'playing' && window.__synes.world && window.__synes.view, null, { timeout: 60000 });
    res.autoWas = await page.evaluate(() => { const w = window.__synes.world, a = w.auto?.s?.enabled; if (w.auto?.s) w.auto.s.enabled = false; return a ?? null; }); // the sim must not walk the player (auto-battle)
    await page.evaluate(() => window.__synesQA.stepTicks(0));
    // the 'off' spot is re-pinned (x 0, z -41.02) before every step: enemies / collision would otherwise push the player a few tenths of a metre
    const PIN = spot === 'off' ? `{ const p = window.__synes.world.player; p.x = 0; p.z = -41.02; p.fx = 0; p.fz = -1; }` : '{}';
    const step = (n) => page.evaluate(`(() => { ${PIN}; window.__synesQA.stepTicks(${n}); })()`);
    for (let i = 0; i < 7; i++) await step(5); // 7 drawn frames of dt 5/30 s: camera lerp factor 0.63 each -> settled
    res.settled = r3(await page.evaluate(SNAP));
    // force the pull as updateCamera does when pull rises (camPullHold = 0.7), then draw one landscape frame
    await page.evaluate(() => { const v = window.__synes.view; v.camPull = 1.2; v.camPullHold = 0.7; });
    await step(1);
    res.landscape = r3(await page.evaluate(SNAP));
    const pz = res.landscape.pz;
    res.expect = { playerZ: pz, landscapeGroundZ_pull1_2: fieldGroundZ(pz, 1.2, false), landscapeGroundZ_pull0: fieldGroundZ(pz, 0, false), portraitGroundZ: fieldGroundZ(pz, 0, true), viewLimitZ_OFF: viewLimitZ(C.OFF_Z) };
    // rotate
    await withTimeout(page.setViewportSize({ width: 390, height: 844 }), 15000, 'setViewportSize portrait');
    await page.waitForFunction(() => innerWidth === 390 && window.__synes.view.camera.aspect < 1, null, { timeout: 10000 }).catch(async () => { await page.evaluate(() => window.dispatchEvent(new Event('resize'))); res.manualResize = true; });
    for (let i = 0; i < FRAMES; i++) {
      await step(1); const o = await page.evaluate(SNAP);
      const portrait = o.aspect < 1, ex = fieldGroundZ(o.pz, 0, true);
      res.frames.push({ i: i + 1, ...r3(o), expectedPortraitReach: +ex.toFixed(4), over: +(o.reach - ex).toFixed(4) });
      if (!portrait && i === 0) res.notPortrait = true;
    }
    // reverse: info only
    await withTimeout(page.setViewportSize({ width: 844, height: 390 }), 15000, 'setViewportSize landscape');
    await page.waitForFunction(() => innerWidth === 844 && window.__synes.view.camera.aspect > 1, null, { timeout: 10000 }).catch(async () => { await page.evaluate(() => window.dispatchEvent(new Event('resize'))); });
    for (let i = 0; i < 60; i++) {
      await step(1); const o = await page.evaluate(SNAP);
      if (i % 5 === 0 || i < 3) res.reverse.push({ i: i + 1, ...r3(o), expectedLandscapeReach_atPull: +fieldGroundZ(o.pz, o.camPull, false).toFixed(4) });
    }
  } catch (e) { res.error = String(e.message || e); }
  await ctx.close().catch(() => {});
  return res;
}

const cases = [];
try { for (const tier of TIERS) for (const spot of SPOTS) { cases.push(await runCase(tier, spot)); console.log('case done', tier, spot, ((Date.now() - T0) / 1000).toFixed(0) + 's'); } }
finally { await browser.close().catch(() => {}); srv?.close(); }

// ---- verdict
let worst = null, allPass = true, strictPass = true;
for (const c of cases) {
  if (c.error || c.notPortrait || !c.frames.length) { c.verdict = 'ERROR'; allPass = false; continue; }
  const lim0 = c.expect.viewLimitZ_OFF;
  let wc = null, ws = null;
  for (const f of c.frames) {
    const limit = (c.spot === 'off' ? Math.max(f.expectedPortraitReach, lim0) : f.expectedPortraitReach) + 0.05, ex = f.reach - limit;
    if (!wc || ex > wc.excess) wc = { frame: f.i, reach: f.reach, limit: +limit.toFixed(3), excess: +ex.toFixed(3), camPull: f.camPull, pz: f.pz };
    if (!ws || f.over > ws.over) ws = { frame: f.i, over: f.over, camPull: f.camPull };
  }
  c.worst = wc; c.strictWorst = ws; c.pass = wc.excess <= 0; c.strict = ws.over <= 0.05; c.verdict = c.pass ? 'PASS' : 'FAIL';
  c.pullFrames = c.frames.filter((f) => f.camPull > 0.002).length; c.lastPullFrame = c.frames.filter((f) => f.camPull > 0.002).pop()?.i ?? 0;
  if (!c.pass) allPass = false; if (!c.strict) strictPass = false;
}
const summary = { label, base: opt('base', '') || 'dist:' + opt('dist', ''), generatedAt: new Date().toISOString(), seconds: +((Date.now() - T0) / 1000).toFixed(0), note: 'Chromium headless + SwiftShader; setViewportSize != device rotation', reference: { C, srcCheck }, errors, verdict: allPass ? 'PASS' : 'FAIL', strictVerdict: strictPass ? 'PASS' : 'FAIL', cases };
if (outFile) { fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true }); fs.writeFileSync(outFile, JSON.stringify(summary, null, 1)); }
for (const c of cases) console.log(`[${c.tier}/${c.spot}] ${c.verdict}${c.error ? ' ' + c.error : ''}${c.worst ? ` worst frame ${c.worst.frame}: reach ${c.worst.reach.toFixed(2)} vs limit ${c.worst.limit} (excess ${c.worst.excess}) camPull ${c.worst.camPull}, pull>0 until frame ${c.lastPullFrame}; strict ${c.strict ? 'ok' : 'over by ' + c.strictWorst.over}` : ''}`);
console.log(`C1-ROTATE ${label}: ${summary.verdict} (strict ${summary.strictVerdict}) ${cases.filter((c) => c.verdict === 'PASS').length}/${cases.length} cases, page errors ${errors.length}, ${summary.seconds}s`);
process.exit(allPass ? 0 : 1);
