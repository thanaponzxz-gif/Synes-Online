// Stage-1 ("ทุ่งน้ำค้างแสง") deterministic baseline shots from the REAL in-game camera. Re-run after every art round and diff.
//   node tools/qa/stage1-shots.mjs [outDir] [--tag name] [--only scene,scene] [--base http://host:port] [--jpeg] [--qs 'arena=A']
// Serves dist/ in-process (run `npm run build` first). Same seed (1) + same tick counts every run: ?offline&seed=1&q=<tier>&autostart&qafreeze,
// the sim is only advanced through window.__synesQA.stepTicks, player is moved by writing world.player (QA teleport, same as atmos-shots/vfx-calls).
// Scenes: opening, pathA, plaza, pool, boss-open, boss-circle, boss-fan, boss-dash, chars, vfx. Tiers low+medium.
// Sizes: 844x390 for all, 1672x941 additionally for opening, boss-open, boss-circle/fan/dash.
// Output: <outDir>/<scene>[-part]-<w>-<tier>.png (+ -gray.png for opening and boss-open), report.json. If the PNGs exceed 15 MB (or --jpeg)
//   they are converted to JPEG with ffmpeg. LIMITS: Chromium + SwiftShader (software GPU), not a real device. CSS fades of the hint/banner use
//   real time, everything else is tick-exact.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes('--' + k);
const valued = new Set(['--tag', '--only', '--base', '--qs']);
const pos = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
const outDir = pos[0] || 'tools/qa/out/stage1-shots';
const tag = opt('tag', 'run');
const only = opt('only', '') ? opt('only').split(',') : null;
/** --qs 'k=v&k2=v2': extra URL params for every page (e.g. --qs arena=A for the DES-004 step-2 looks); default none */
const QS = opt('qs', '') ? '&' + opt('qs').replace(/^[?&]/, '') : '';
const SEED = 1;
fs.mkdirSync(outDir, { recursive: true });

// ---- static server for dist/ (unless --base given)
let srv = null, base = opt('base', '');
if (!base) {
  const root = path.resolve('dist');
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };
  srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' }); res.end(fs.readFileSync(f));
  });
  const port = Number(process.env.SYNES_QA_PORT || 18752);
  await new Promise((r) => srv.listen(port, '127.0.0.1', r));
  base = `http://127.0.0.1:${port}`;
}
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const report = { tag, seed: SEED, generatedAt: new Date().toISOString(), note: 'Chromium headless + SwiftShader, not a real device', shots: [], notes: [], errors: [] };
const TIERS = ['low', 'medium'];
const S844 = [844, 390], S1672 = [1672, 941];

async function open(size, tier, start, dpr = 1) {
  const [width, height] = size, mobile = width < 1000;
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => report.errors.push(`${width} ${tier} ${start}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') report.errors.push(`console ${width} ${tier}: ${m.text()}`); });
  await page.goto(`${base}/?offline&seed=${SEED}&q=${tier}&autostart&qafreeze${start ? '&start=' + start : ''}${QS}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__synes?.state === 'playing' && window.__synes.world, null, { timeout: 60000 });
  await page.evaluate(() => window.__synesQA.stepTicks(0)); // first drawn frame
  return { ctx, page };
}
const step = (page, n) => page.evaluate((k) => { window.__synesQA.stepTicks(k); return window.__synes.world.tick; }, n);
const tp = (page, x, z, fx = 0, fz = -1) => page.evaluate(([x, z, fx, fz]) => { const p = window.__synes.world.player; p.x = x; p.z = z; p.fx = fx; p.fz = fz; }, [x, z, fx, fz]);

async function grayStats(page, png) {
  return page.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), px = d.data, hist = new Uint32Array(256); let sum = 0;
    for (let i = 0; i < px.length; i += 4) { const l = Math.round(0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]); px[i] = px[i + 1] = px[i + 2] = l; hist[l]++; sum += l; }
    const n = px.length / 4, pct = (q) => { let a = 0; for (let v = 0; v < 256; v++) { a += hist[v]; if (a >= n * q) return v; } return 255; };
    g.putImageData(d, 0, 0);
    // luma means of 3 horizontal bands (top 30% / middle 40% / bottom 30%)
    const band = (y0, y1) => { const dd = g.getImageData(0, Math.floor(c.height * y0), c.width, Math.floor(c.height * (y1 - y0))).data; let s = 0; for (let i = 0; i < dd.length; i += 4) s += dd[i]; return +(s / (dd.length / 4) / 255).toFixed(3); };
    return { gray: c.toDataURL('image/png').split(',')[1], mean: +(sum / n / 255).toFixed(3), p5: pct(0.05), p95: pct(0.95), bands: { top: band(0, 0.3), mid: band(0.3, 0.7), bottom: band(0.7, 1) } };
  }, png.toString('base64'));
}

/** screenshot + renderer.info + optional grayscale + sim facts. clip = CSS-px rect (chars). */
async function shoot(page, scene, part, size, tier, { gray = false, clip = null, extra = {} } = {}) {
  await page.waitForTimeout(250);
  const info = await page.evaluate(() => { const i = window.__synes.view.renderer.info.render, w = window.__synes.world; return { calls: i.calls, tris: i.triangles, tick: w.tick, tele: w.tele.map((t) => `${t.atk.id}:${t.shape}:${(1 - t.t / t.total).toFixed(2)}`) }; });
  const name = `${scene}${part ? '-' + part : ''}-${size[0]}-${tier}`;
  const file = path.join(outDir, name + '.png');
  const png = await page.screenshot({ path: file, ...(clip ? { clip } : {}) });
  const rec = { name, scene, part, size: `${size[0]}x${size[1]}`, tier, calls: info.calls, tris: info.tris, tick: info.tick, tele: info.tele, ...extra };
  if (gray) { const g = await grayStats(page, png); fs.writeFileSync(path.join(outDir, name + '-gray.png'), Buffer.from(g.gray, 'base64')); rec.gray = { mean: g.mean, p5: g.p5, p95: g.p95, bands: g.bands }; }
  report.shots.push(rec); console.log(name, info.calls, info.tris);
  return rec;
}
const want = (s) => !only || only.includes(s);

// ---------------------------------------------------------------- scene runners
async function opening(size, tier) {
  const { ctx, page } = await open(size, tier, '');
  await shoot(page, 'opening', 'start', size, tier, { gray: true });
  await page.keyboard.down('KeyW'); await step(page, 60); await page.keyboard.up('KeyW'); // ~2 s walking forward (-Z)
  const p = await page.evaluate(() => [window.__synes.world.player.x, window.__synes.world.player.z]);
  await shoot(page, 'opening', 'walk2s', size, tier, { gray: true, extra: { player: p } });
  await ctx.close();
}
async function pathA(size, tier) {
  const { ctx, page } = await open(size, tier, '');
  await tp(page, 1.4, -10);
  const got = await page.evaluate(() => { const w = window.__synes.world; let n = 0; for (; n < 240 && !w.tele.length; n++) window.__synesQA.stepTicks(1, false); window.__synesQA.stepTicks(10); return { n, teleCount: w.tele.length }; });
  if (!got.teleCount) report.notes.push(`pathA ${tier}: no telegraph reached`);
  await shoot(page, 'pathA', '', size, tier, { extra: got });
  await ctx.close();
}
async function plaza(size, tier) {
  const { ctx, page } = await open(size, tier, '');
  await tp(page, 3, -31);
  // step until a thornling dash line AND a puffcap circle are both up; else stop shortly after the line vanishes
  const got = await page.evaluate(() => {
    const w = window.__synes.world; let n = 0, both = false, line = false;
    for (; n < 420; n++) {
      window.__synesQA.stepTicks(1, false);
      const l = w.tele.some((t) => t.shape === 'line'), c = w.tele.some((t) => t.shape === 'circle');
      if (l && c) { both = true; break; }
      if (l) line = true;
      if (line && !l) break;
    }
    window.__synesQA.stepTicks(4);
    return { n, both, teleShapes: w.tele.map((t) => t.shape), enemies: w.actors.filter((a) => a.alive && a.kind !== 'player' && a.kind !== 'prismback').length };
  });
  await shoot(page, 'plaza', '', size, tier, { extra: got });
  await ctx.close();
}
async function pool(size, tier) {
  const { ctx, page } = await open(size, tier, 'boss'); // player begins on the spring checkpoint, enemies already cleared
  await page.evaluate(() => { const w = window.__synes.world; w.player.hp = 60; w.ps.potions = 0; });
  await step(page, 20);
  const hp = await page.evaluate(() => window.__synes.world.player.hp);
  await shoot(page, 'pool', '', size, tier, { extra: { hp, note: 'hp preset to 60 and potions 0 before 20 ticks on the spring' } });
  await ctx.close();
}
async function bossOpen(size, tier) {
  const { ctx, page } = await open(size, tier, 'boss');
  const got = await page.evaluate(() => { const { world } = window.__synes; const { player, boss } = world; player.x = boss.x; player.z = boss.z + 6.7; player.fx = 0; player.fz = -1;
    let n = 0; for (; n < 60 && !world.bossStarted; n++) window.__synesQA.stepTicks(1, false); window.__synesQA.stepTicks(15); return { n, started: world.bossStarted }; });
  await shoot(page, 'boss-open', '', size, tier, { gray: true, extra: got });
  await ctx.close();
}
async function bossTele(size, tier, scene, atk) {
  const { ctx, page } = await open(size, tier, 'boss');
  const got = await page.evaluate((atk) => { const { world } = window.__synes; const { player, boss } = world; player.x = boss.x; player.z = boss.z + 6.7; player.fx = 0; player.fz = -1;
    for (let i = 0; i < 60 && !world.bossStarted; i++) window.__synesQA.stepTicks(1, false);
    world.bossNext = atk; let n = 0; for (; n < 200 && !world.tele.some((t) => t.owner === world.boss.id && t.atk.id === atk); n++) window.__synesQA.stepTicks(1, false);
    window.__synesQA.stepTicks(12); return { n, atk: world.tele.find((t) => t.owner === world.boss.id)?.atk.id ?? null }; }, atk);
  if (got.atk !== atk) report.notes.push(`${scene} ${tier}: wanted ${atk}, got ${got.atk}`);
  await shoot(page, scene, '', size, tier, { extra: got });
  await ctx.close();
}
/** Hero + enemies as framed by the gameplay camera: each placed in front of the hero on the camp (idle, facing the camera), then cropped. */
async function chars(tier) {
  const size = S844;
  for (const who of ['hero', 'puffcap', 'thornling', 'prismback']) {
    const { ctx, page } = await open(size, tier, '', 2);
    const clip = await page.evaluate((who) => {
      const { world, view } = window.__synes, p = world.player; p.x = 0; p.z = 1.5; p.fx = 0; p.fz = -1;
      let id = p.id;
      if (who !== 'hero') {
        const a = world.actors.find((e) => e.kind === who); id = a.id; a.x = 0; a.z = who === 'prismback' ? -7.5 : -4; a.fx = 0; a.fz = 1; a.state = 'idle'; a.active = false;
      }
      window.__synesQA.stepTicks(0);
      const o = { x: 0, y: 0, vis: false }; view.actorScreenPos(id, 1.0, o);
      const hw = who === 'prismback' ? 150 : 90, hh = who === 'prismback' ? 110 : 90;
      return { x: Math.max(0, Math.min(844 - 2 * hw, Math.round(o.x - hw))), y: Math.max(0, Math.min(390 - 2 * hh, Math.round(o.y - hh))), width: 2 * hw, height: 2 * hh, vis: o.vis };
    }, who);
    await shoot(page, 'chars', who, size, tier, { clip: { x: clip.x, y: clip.y, width: clip.width, height: clip.height }, extra: { dpr: 2, crop: clip, note: 'crop (CSS px) of the 844x390 gameplay frame, device scale 2' } });
    await ctx.close();
  }
}
/** VFX: real casts against the first puffcap (hit sparks are real), perfect dodge tried for real, ult only shows its locked banner. */
async function vfx(tier) {
  const size = S844;
  const fresh = async () => { const r = await open(size, tier, ''); await tp(r.page, 1.4, -14.3); await step(r.page, 1); return r; };
  const D = { 1: { name: 'skill1-chime', ticks: 12 }, 2: { name: 'skill2-crescent', ticks: 8 }, 3: { name: 'skill3-crystal', ticks: 19 } };
  for (const slot of [1, 2, 3]) {
    const { ctx, page } = await fresh();
    await page.keyboard.press('Digit' + slot); await step(page, D[slot].ticks);
    await shoot(page, 'vfx', D[slot].name, size, tier, { extra: { afterTicks: D[slot].ticks } });
    await ctx.close();
  }
  { // hit spark: basic attack until the first landed hit, +1 tick
    const { ctx, page } = await fresh();
    await page.keyboard.press('KeyJ');
    const got = await page.evaluate(() => { const w = window.__synes.world; let n = 0; for (; n < 40 && w.stats.hitsLanded === 0; n++) window.__synesQA.stepTicks(1, false); window.__synesQA.stepTicks(1); return { n, hits: w.stats.hitsLanded }; });
    if (!got.hits) report.notes.push(`hit spark ${tier}: no hit landed in 40 ticks`);
    await shoot(page, 'vfx', 'hit-spark', size, tier, { extra: got }); await ctx.close();
  }
  { // perfect dodge: wait for the puffcap hop circle, press dodge near its end, stop on the 'perfect' stat
    const { ctx, page } = await open(size, tier, ''); await tp(page, 1.4, -14.3); await step(page, 1);
    const prep = await page.evaluate(() => { const w = window.__synes.world; let n = 0; for (; n < 240 && !(w.tele.length && w.tele[0].t <= 0.13); n++) window.__synesQA.stepTicks(1, false); return { n, t: w.tele[0]?.t ?? null }; });
    await page.keyboard.press('KeyK');
    const got = await page.evaluate(() => { const w = window.__synes.world; let n = 0; for (; n < 20 && w.stats.perfect === 0; n++) window.__synesQA.stepTicks(1, false); window.__synesQA.stepTicks(2); return { n, perfect: w.stats.perfect, dmg: w.stats.damageTaken }; });
    let injected = false;
    if (!got.perfect) { injected = true; await page.evaluate(() => { const s = window.__synes, p = s.world.player; s.view.onEvents([{ t: 'perfect', x: p.x, z: p.z }], s.world); window.__synesQA.stepTicks(2); }); report.notes.push(`perfect dodge ${tier}: not triggered by real input, VFX event injected into the view`); }
    await shoot(page, 'vfx', 'perfect-dodge', size, tier, { extra: { ...prep, ...got, injected } }); await ctx.close();
  }
  { // ultimate: locked in this build (no sim effect); pressing it only shows a banner
    const { ctx, page } = await fresh();
    await page.evaluate(() => document.getElementById('btn-ult').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })));
    await step(page, 2);
    await shoot(page, 'vfx', 'ult-locked', size, tier, { extra: { note: 'ultimate is locked (ULT.locked): only a banner shows; no ultimate VFX exists to capture' } });
    await ctx.close();
  }
}

try {
  for (const tier of TIERS) {
    if (want('opening')) { await opening(S844, tier); await opening(S1672, tier); }
    if (want('pathA')) await pathA(S844, tier);
    if (want('plaza')) await plaza(S844, tier);
    if (want('pool')) await pool(S844, tier);
    if (want('boss-open')) { await bossOpen(S844, tier); await bossOpen(S1672, tier); }
    for (const [sc, atk] of [['boss-circle', 'slam'], ['boss-fan', 'sweep'], ['boss-dash', 'charge']]) if (want(sc)) { await bossTele(S844, tier, sc, atk); await bossTele(S1672, tier, sc, atk); }
    if (want('chars')) await chars(tier);
    if (want('vfx')) await vfx(tier);
  }
} finally { await browser.close(); srv?.close(); }

// size check -> JPEG when the PNG set is too big
const pngs = fs.readdirSync(outDir).filter((f) => f.endsWith('.png'));
const total = pngs.reduce((a, f) => a + fs.statSync(path.join(outDir, f)).size, 0);
report.pngBytes = total;
if ((flag('jpeg') || total > 15 * 1048576) && fs.existsSync('/usr/bin/ffmpeg')) {
  for (const f of pngs) {
    const src = path.join(outDir, f), dst = src.replace(/\.png$/, '.jpg');
    const r = spawnSync('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-q:v', '3', dst]);
    if (r.status === 0) fs.rmSync(src);
  }
  report.converted = 'jpeg (ffmpeg -q:v 3, about q85)';
}
report.finalBytes = fs.readdirSync(outDir).reduce((a, f) => a + fs.statSync(path.join(outDir, f)).size, 0);
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1));
console.log(`done: ${report.shots.length} shots, ${(report.finalBytes / 1048576).toFixed(1)} MB, errors ${report.errors.length}, notes ${report.notes.length}`);
