// exp/stage1-vfx QA: same-tick shots of the VFX options (current / ?vfx=A / ?vfx=B) from the REAL in-game camera, + draw calls.
//   node tools/qa/vfx-shots.mjs [outDir] [--variants cur,A,B] [--tiers low,medium] [--only scene,scene] [--dist dist] [--compose docsDir] [--canvas]
// Serves <dist> in-process. URL: ?offline&seed=1&q=<tier>&autostart&qafreeze[&start=boss][&vfx=A|B]; the sim only advances through
// __synesQA.stepTicks; the player is moved by writing world.player (QA teleport, same as stage1-shots / vfx-calls). Field scenes use the
// stage1-shots "vfx" setup (player at (1.4,-14.3) next to the first puffcap, real key presses), so the tick counts match the r0 baseline.
// Per shot: renderer.info calls/tris of the game's own frame, and fxCalls = calls minus the calls of the same frame re-rendered with every
// effect layer hidden (burst particles, rings/arcs, skill meshes, impact mesh, sparkles; the hero foot ring is NOT counted: it exists in
// every variant), sparkleCalls (0/1); per effect group (skill, impact, sparkles, rings, particles) fxPx = pixels the group changes and
// warmPx = of those, warm (hue >= 320 or < 50, gold included) and vivid (S*V > 0.3) where the effect adds that warmth (the pixel without
// the group is less vivid or not warm: a faint cool sparkle over the warm beige path is not counted), measured with the telegraphs hidden.
// The sim is stepped ONE tick per drawn frame (dt = 1/30 s per frame), so dt-driven particles look as in play; the r0 baseline stepped
// several ticks per drawn frame, which aged particles (hit spark) by the whole gap.
// Raw PNGs + report.json go to outDir (default tools/qa/out/vfx-shots, gitignored).
// --compose <dir>: after shooting, write one "current | A | B" strip per scene and tier (crop around the effect, JPEG ~q85, labels) to <dir>.
// LIMITS: Chromium + SwiftShader (software GPU), not a real phone; burst particles use Math.random, so those pixels differ run to run.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const valued = new Set(['--variants', '--tiers', '--only', '--dist', '--compose']);
const CANVAS = args.includes('--canvas'); // also save the WebGL canvas alone (no DOM HUD / CSS fades): <name>-canvas.png, for exact before/after diffs
const pos = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
const outDir = pos[0] || 'tools/qa/out/vfx-shots';
const VARIANTS = opt('variants', 'cur,A,B').split(',');
const TIERS = opt('tiers', 'low,medium').split(',');
const only = opt('only', '') ? opt('only').split(',') : null;
const compose = opt('compose', '');
const distDir = path.resolve(opt('dist', 'dist'));
const SEED = 1, SIZE = [844, 390];
fs.mkdirSync(outDir, { recursive: true });

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(distDir, p);
  if (!f.startsWith(distDir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' }); res.end(fs.readFileSync(f));
});
const port = Number(process.env.SYNES_QA_PORT || 18754);
await new Promise((r) => srv.listen(port, '127.0.0.1', r));
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const report = { seed: SEED, size: SIZE.join('x'), generatedAt: new Date().toISOString(), note: 'Chromium headless + SwiftShader, not a real device', shots: [], notes: [], errors: [] };

async function open(variant, tier, start = '') {
  const [width, height] = SIZE;
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => report.errors.push(`${variant} ${tier} ${start}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') report.errors.push(`console ${variant} ${tier}: ${m.text()}`); });
  const qs = variant === 'cur' ? '' : `&vfx=${variant}`;
  await page.goto(`${base}/?offline&seed=${SEED}&q=${tier}&autostart&qafreeze${start ? '&start=' + start : ''}${qs}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__synes?.state === 'playing' && window.__synes.world, null, { timeout: 60000 });
  await page.evaluate(() => window.__synesQA.stepTicks(0));
  return { ctx, page };
}
const step = (page, n) => page.evaluate((k) => { for (let i = 0; i < k; i++) window.__synesQA.stepTicks(1); return window.__synes.world.tick; }, n);
const tp = (page, x, z, fx = 0, fz = -1) => page.evaluate(([x, z, fx, fz]) => { const p = window.__synes.world.player; p.x = x; p.z = z; p.fx = fx; p.fz = fz; }, [x, z, fx, fz]);

/** calls of the game's frame, then the same state re-rendered with every effect layer hidden */
const fxInfo = (page) => page.evaluate((CANVAS) => {
  const { view, world } = window.__synes, r = view.renderer, info = r.info.render, scene = view.scene, cam = view.camera;
  const calls = info.calls, tris = info.triangles;
  const vis = (arr) => arr.filter((o) => o && o.visible);
  // effect layers, grouped: new = the options' own meshes; legacy = shared pools also used by enemy effects (death poof, landing bursts)
  const groups = {
    skill: vis(['chime', 'cres', 'crys'].map((k) => view.skillFx?.[k]?.mesh)), impact: vis([view.stageVfx?.impact?.buf?.mesh]), sparkles: vis([view.stageVfx?.sparkles?.points]),
    rings: vis((view.rings?.items ?? []).map((it) => it.m)), particles: vis([view.particles?.mesh]),
  };
  const layers = Object.values(groups).flat();
  const sparkle = groups.sparkles.length;
  const gl = r.getContext(), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, read = () => { const b = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b); return b; };
  // calls without any effect layer (telegraphs on, same frame)
  for (const o of layers) o.visible = false;
  r.render(scene, cam); const calls0 = r.info.render.calls;
  for (const o of layers) o.visible = true;
  // colour check per group, telegraphs hidden (so a warning drawn over an effect is not counted as the effect's colour): pixels a group
  // changes (> 12 levels) and, of those, warm (hue >= 320 or < 50, gold included) AND vivid (HSV S*V > 0.3, not a faint tint over the path)
  const teles = [...view.teles.values()].map((t) => t.m).filter((m) => m.visible);
  for (const m of teles) m.visible = false;
  r.render(scene, cam); const E = read();
  const hue = (i, P) => { const R = P[i] / 255, G = P[i + 1] / 255, B = P[i + 2] / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn;
    let h = 0; if (d) { h = mx === R ? ((G - B) / d) % 6 : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, d]; };
  const px = {}, warm = {};
  for (const [k, arr] of Object.entries(groups)) {
    if (!arr.length) { px[k] = 0; warm[k] = 0; continue; }
    for (const o of arr) o.visible = false;
    r.render(scene, cam); const X = read();
    for (const o of arr) o.visible = true;
    let n = 0, w = 0;
    for (let i = 0; i < E.length; i += 4) {
      if (Math.abs(E[i] - X[i]) + Math.abs(E[i + 1] - X[i + 1]) + Math.abs(E[i + 2] - X[i + 2]) <= 12) continue;
      n++; const [h, d] = hue(i, E), [hx, dx] = hue(i, X); if ((h >= 320 || h < 50) && d > 0.3 && (d > dx + 0.03 || !(hx >= 320 || hx < 50))) w++; // the effect itself adds warm saturation (not the beige path showing through)
    }
    px[k] = n; warm[k] = w;
  }
  for (const m of teles) m.visible = true;
  r.render(scene, cam);
  let canvasPng = null;
  if (CANVAS) { const P = read(), c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), id = g.createImageData(W, H);
    for (let y = 0; y < H; y++) id.data.set(P.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
    g.putImageData(id, 0, 0); canvasPng = c.toDataURL('image/png').split(',')[1]; }
  return { canvasPng, calls, tris, calls0, fxCalls: calls - calls0, sparkleCalls: sparkle, fxPx: px, warmPx: warm, tick: world.tick, tele: world.tele.map((t) => `${t.atk.id}:${t.shape}:${(1 - t.t / t.total).toFixed(2)}`), cast: world.ps.cast ? `${world.ps.cast.slot}@${world.ps.cast.tick}` : null };
}, CANVAS);
async function shoot(page, scene, variant, tier, extra = {}) {
  await page.waitForTimeout(150);
  const info = await fxInfo(page);
  const name = `${scene}-${tier}-${variant}`;
  await page.screenshot({ path: path.join(outDir, name + '.png') });
  if (info.canvasPng) fs.writeFileSync(path.join(outDir, name + '-canvas.png'), Buffer.from(info.canvasPng, 'base64'));
  delete info.canvasPng;
  report.shots.push({ name, scene, variant, tier, ...info, ...extra });
  console.log(name, 'calls', info.calls, 'fx', info.fxCalls, 'sparkle', info.sparkleCalls, 'warm', JSON.stringify(info.warmPx), 'tick', info.tick, info.cast ?? '', info.tele.join(' '));
}
const want = (s) => !only || only.includes(s);

// ---------------------------------------------------------------- scenes
async function field(variant, tier) {
  const fresh = async () => { const r = await open(variant, tier); await tp(r.page, 1.4, -14.3); await step(r.page, 1); return r; };
  const casts = [['chime-prep', 1, 7], ['chime-burst', 1, 12], ['crescent', 2, 8], ['crescent-late', 2, 11], ['crystal-prep', 3, 10], ['crystal-hit', 3, 19]];
  for (const [scene, slot, ticks] of casts) {
    if (!want(scene)) continue;
    const { ctx, page } = await fresh();
    await page.keyboard.press('Digit' + slot); await step(page, ticks);
    await shoot(page, scene, variant, tier, { afterTicks: ticks }); await ctx.close();
  }
  if (want('hit-spark')) { // basic attack until the first landed hit, +1 tick (= stage1-shots vfx-hit-spark)
    const { ctx, page } = await fresh();
    await page.keyboard.press('KeyJ');
    const got = await page.evaluate(() => { const w = window.__synes.world; let n = 0; for (; n < 40 && w.stats.hitsLanded === 0; n++) window.__synesQA.stepTicks(1); window.__synesQA.stepTicks(1); return { n, hits: w.stats.hitsLanded }; });
    if (!got.hits) report.notes.push(`hit spark ${variant} ${tier}: no hit`);
    await shoot(page, 'hit-spark', variant, tier, got); await ctx.close();
  }
  if (want('perfect-dodge')) { // = stage1-shots vfx-perfect-dodge (real input)
    const { ctx, page } = await open(variant, tier); await tp(page, 1.4, -14.3); await step(page, 1);
    await page.evaluate(() => { const w = window.__synes.world; for (let n = 0; n < 240 && !(w.tele.length && w.tele[0].t <= 0.13); n++) window.__synesQA.stepTicks(1, false); });
    await page.keyboard.press('KeyK');
    const got = await page.evaluate(() => { const w = window.__synes.world; let n = 0; for (; n < 20 && w.stats.perfect === 0; n++) window.__synesQA.stepTicks(1); window.__synesQA.stepTicks(1); window.__synesQA.stepTicks(1); return { n, perfect: w.stats.perfect }; });
    if (!got.perfect) report.notes.push(`perfect ${variant} ${tier}: not triggered`);
    await shoot(page, 'perfect-dodge', variant, tier, got); await ctx.close();
  }
  if (want('field')) { // meadow sparkles + hero ring: = stage1-shots opening walk2s
    const { ctx, page } = await open(variant, tier);
    await page.keyboard.down('KeyW'); await step(page, 60); await page.keyboard.up('KeyW');
    await shoot(page, 'field', variant, tier); await ctx.close();
  }
}
async function arena(variant, tier) {
  const bossStart = (page) => page.evaluate(() => { const { world } = window.__synes; const { player, boss } = world; player.x = boss.x; player.z = boss.z + 6.7; player.fx = 0; player.fz = -1;
    let n = 0; for (; n < 60 && !world.bossStarted; n++) window.__synesQA.stepTicks(1, false); return n; });
  if (want('arena')) { // = stage1-shots boss-open
    const { ctx, page } = await open(variant, tier, 'boss'); await bossStart(page); await step(page, 15);
    await shoot(page, 'arena', variant, tier); await ctx.close();
  }
  if (want('boss-hit')) { // sword on the crystal armour: walk up to the boss, basic attack until the first landed hit, +1 and +4 ticks
    const { ctx, page } = await open(variant, tier, 'boss'); await bossStart(page);
    const got = await page.evaluate(() => { const { world } = window.__synes, { player, boss } = world; player.hp = player.maxHp = 99999;
      player.x = boss.x + 0.6; player.z = boss.z + boss.r + 1.0; player.fx = 0; player.fz = -1; window.__synesQA.stepTicks(1, false); return { bossR: boss.r }; });
    await page.keyboard.press('KeyJ');
    const hit = await page.evaluate(() => { const w = window.__synes.world; let n = 0; for (; n < 40 && w.stats.hitsLanded === 0; n++) window.__synesQA.stepTicks(1); window.__synesQA.stepTicks(1); return { n, hits: w.stats.hitsLanded }; });
    if (!hit.hits) report.notes.push(`boss hit ${variant} ${tier}: no hit`);
    await shoot(page, 'boss-hit1', variant, tier, { ...got, ...hit });
    await step(page, 3); await shoot(page, 'boss-hit4', variant, tier, { ...got, ...hit });
    await ctx.close();
  }
  for (const [scene, after] of [['slam-chime-prep', 6], ['slam-chime', 14]]) { // = tele-roi circle-vfx (slam +12, Chime pressed, +14)
    if (!want(scene)) continue;
    const { ctx, page } = await open(variant, tier, 'boss'); await bossStart(page);
    await page.evaluate(() => { const { world } = window.__synes; world.bossNext = 'slam'; for (let n = 0; n < 200 && !world.tele.some((t) => t.owner === world.boss.id && t.atk.id === 'slam'); n++) window.__synesQA.stepTicks(1, false); for (let i = 0; i < 12; i++) window.__synesQA.stepTicks(1); });
    await page.keyboard.press('Digit1'); await step(page, after);
    await shoot(page, scene, variant, tier, { afterTicks: after }); await ctx.close();
  }
}

try {
  for (const tier of TIERS) for (const v of VARIANTS) { await field(v, tier); await arena(v, tier); }
} finally { await browser.close(); srv.close(); }
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1));
console.log(`done: ${report.shots.length} shots, errors ${report.errors.length}, notes ${report.notes.length}`);

// ---------------------------------------------------------------- "current | A | B" strips
// crop (x, y, w, h) in 844x390 CSS px around the effect of each scene
const CROP = {
  'chime-prep': [252, 60, 340, 290], 'chime-burst': [252, 60, 340, 290], crescent: [222, 60, 400, 290], 'crescent-late': [222, 60, 400, 290], 'crystal-prep': [252, 40, 340, 300], 'crystal-hit': [252, 40, 340, 300],
  'hit-spark': [262, 50, 320, 260], 'perfect-dodge': [252, 60, 340, 290], field: [0, 0, 844, 390], arena: [0, 0, 844, 390],
  'boss-hit1': [222, 40, 400, 300], 'boss-hit4': [222, 40, 400, 300], 'slam-chime-prep': [162, 40, 520, 330], 'slam-chime': [162, 40, 520, 330],
};
if (compose) {
  fs.mkdirSync(compose, { recursive: true });
  const font = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
  const scenes = [...new Set(report.shots.map((s) => s.scene))];
  for (const scene of scenes) for (const tier of TIERS) {
    const vs = VARIANTS.filter((v) => fs.existsSync(path.join(outDir, `${scene}-${tier}-${v}.png`)));
    if (!vs.length) continue;
    const [x, y, w, h] = CROP[scene] ?? [0, 0, 844, 390];
    const full = w === 844; // full frames: scale to 2/3 so a strip of three stays readable and small
    const sc = full ? `,scale=${Math.round(w * 2 / 3)}:-2` : '';
    const label = (v) => { const r = report.shots.find((s) => s.name === `${scene}-${tier}-${v}`); return `${v === 'cur' ? 'current' : v} · ${tier} · ${r?.calls ?? '?'} calls (fx +${r?.fxCalls ?? '?'})`; };
    const inputs = vs.flatMap((v) => ['-i', path.join(outDir, `${scene}-${tier}-${v}.png`)]);
    const chains = vs.map((v, i) => `[${i}:v]crop=${w}:${h}:${x}:${y}${sc},drawtext=fontfile=${font}:text='${label(v)}':x=6:y=6:fontsize=13:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=4[v${i}]`).join(';');
    const filter = `${chains};${vs.map((_, i) => `[v${i}]`).join('')}hstack=inputs=${vs.length}[o]`;
    const dst = path.join(compose, `${scene}-${tier}.jpg`);
    const r = spawnSync('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filter, '-map', '[o]', '-q:v', '3', dst]);
    if (r.status !== 0) console.error('compose failed', scene, tier, r.stderr?.toString());
  }
  console.log('composed into', compose);
}
