// DES-006 §1 camera pull-back QA (before = ?nopull, after = default). Deterministic: ?offline&seed=1&start=boss&q=<tier>&autostart&qafreeze, sim advanced only
// through window.__synesQA.stepTicks(1) (one DRAWN frame per tick = 30 fps camera smoothing, so pull-back timing is what a 30 fps device sees).
//   node tools/qa/camera-pullback.mjs [outDir] [--tiers low,medium] [--only caseId,caseId] [--shots medium] [--clips id,id] [--variants nopull,pull]
// Serves dist/ in-process (npm run build first). Output: <outDir>/report.json, montages <case>.jpg (medium: before|after x start|mid), clips *.webm.
// Per case: the boss/monster is placed relative to the player (QA teleport of world actors, sim untouched otherwise), the forced attack's telegraph is
// waited for, then at its start tick and at 50% progress we test, with the REAL camera, that every telegraph outline sample point (circle ring 16, cone apex+arc+edges,
// line rectangle corners, far end capped 4 m past the player), the player and the attacking/threatening enemy (footprint + height) are inside the viewport
// (NDC +-1, no margin). LIMITS: Chromium + SwiftShader, not a device; draw calls are renderer.info of the game's own frame.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const valued = new Set(['--tiers', '--only', '--shots', '--clips', '--variants', '--base']);
const outDir = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]))[0] || 'tools/qa/out/camera-pullback';
const TIERS = opt('tiers', 'low,medium').split(',');
const ONLY = opt('only', '') ? opt('only').split(',') : null;
const SHOT_TIER = opt('shots', 'medium');
const CLIPS = opt('clips', 'boss-behind-slam,boss-left-charge,mon-behind-rush').split(',').filter(Boolean);
const VARIANTS = opt('variants', 'nopull,pull').split(',');
const FF = '/usr/bin/ffmpeg';
fs.mkdirSync(outDir, { recursive: true });
const tmp = path.join(outDir, '_tmp'); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });

let base = opt('base', ''), srv = null;
if (!base) {
  const root = path.resolve('dist');
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };
  srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' }); res.end(fs.readFileSync(f));
  });
  const port = Number(process.env.SYNES_QA_PORT || 18754);
  await new Promise((r) => srv.listen(port, '127.0.0.1', r));
  base = `http://127.0.0.1:${port}`;
}
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const report = { generatedAt: new Date().toISOString(), seed: 1, note: 'Chromium headless + SwiftShader, not a real device', cases: [], errors: [] };

// arena centre (-2,-76), boss placed D m from the player. In 844x390 the camera looks toward -z, +x is screen right.
const D = 6;
const AC = { x: -2, z: -76 };
const BOSS = [];
for (const [pos, off] of [['front', [0, -D]], ['behind', [0, D]], ['left', [-D, 0]], ['right', [D, 0]]])
  for (const atk of ['slam', 'sweep', 'charge', 'shard'])
    BOSS.push({ id: `boss-${pos}-${atk}`, kind: 'boss', atk, player: [AC.x, AC.z], boss: [AC.x + off[0], AC.z + off[1]], phase: atk === 'shard' ? 2 : 1, pos });
// pillar cases: player just behind a pillar as seen from the boss (pillar (4.2,-70.5)), boss ahead of the pillar
for (const atk of ['slam', 'sweep', 'charge', 'shard'])
  BOSS.push({ id: `boss-pillar-${atk}`, kind: 'boss', atk, player: [4.2, -68.6], boss: [4.2, -75.5], phase: atk === 'shard' ? 2 : 1, pos: 'pillar' });
// thornling (rush line, 7.5 m) placed 6.5 m behind / to the side of the player in the clearing
const MON = [['behind', [0, 6.5]], ['left', [-6.5, 0]], ['right', [6.5, 0]]].map(([pos, off]) => ({ id: `mon-${pos}-rush`, kind: 'mon', atk: 'rush', player: [3, -37], mon: [3 + off[0], -37 + off[1]], pos }));
const CASES = [...BOSS, ...MON].filter((c) => !ONLY || ONLY.includes(c.id));

async function openPage(size, tier, variant, start) {
  const [width, height] = size;
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => report.errors.push(`${width} ${tier} ${variant}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') report.errors.push(`console ${width} ${tier} ${variant}: ${m.text()}`); });
  await page.goto(`${base}/?offline&seed=1&q=${tier}&autostart&qafreeze${start ? '&start=' + start : ''}${variant === 'nopull' ? '&nopull' : ''}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__synes?.state === 'playing' && window.__synes.world, null, { timeout: 60000 });
  await page.evaluate(() => window.__synesQA.stepTicks(0));
  await page.evaluate(() => {
    // in-page probes
    window.__pb = {
      points(world) {
        const p = world.player, tele = [], enemy = [];
        for (const t of world.tele) {
          if (t.shape === 'circle') for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; tele.push([t.x + Math.cos(a) * t.r, 0, t.z + Math.sin(a) * t.r]); }
          else if (t.shape === 'cone') { const b = Math.atan2(t.dz, t.dx), h = Math.acos(t.cos); tele.push([t.x, 0, t.z]); for (let i = 0; i <= 6; i++) { const a = b - h + 2 * h * i / 6; tele.push([t.x + Math.cos(a) * t.r, 0, t.z + Math.sin(a) * t.r]); } }
          else { const al = (p.x - t.x) * t.dx + (p.z - t.z) * t.dz, L = Math.min(t.r, Math.max(6, al + 4)), hw = t.w / 2; for (const l of [0, L]) for (const s of [-hw, hw]) tele.push([t.x + t.dx * l - t.dz * s, 0, t.z + t.dz * l + t.dx * s]); }
        }
        for (const a of world.actors) {
          if (a.kind === 'player' || !a.alive) continue;
          const boss = a.kind === 'prismback';
          const owner = world.tele.some((t) => t.owner === a.id);
          if (!owner) { if (boss) { if (!world.bossStarted) continue; } else { const d = Math.hypot(a.x - p.x, a.z - p.z); if (a.state === 'idle' || a.state === 'dead' || d > 10) continue; } }
          const h = boss ? 3.2 : 1.3, r = a.r;
          for (const [ox, oz] of [[-r, 0], [r, 0], [0, -r], [0, r]]) { enemy.push([a.x + ox, 0, a.z + oz]); enemy.push([a.x + ox, h, a.z + oz]); }
        }
        return { tele, enemy, player: [[p.x, 0, p.z], [p.x, 1.6, p.z]] };
      },
      check() {
        const { world, view } = window.__synes, cam = view.camera; cam.updateMatrixWorld(true);
        const P = cam.projectionMatrix.elements, m = cam.matrixWorldInverse.elements;
        const pts = this.points(world), res = { tele: 0, enemy: 0, player: 0, n: { tele: pts.tele.length, enemy: pts.enemy.length } };
        for (const k of ['tele', 'enemy', 'player']) for (const [x, y, z] of pts[k]) {
          const vz = m[2] * x + m[6] * y + m[10] * z + m[14];
          const nx = P[0] * (m[0] * x + m[4] * y + m[8] * z + m[12]) / -vz, ny = P[5] * (m[1] * x + m[5] * y + m[9] * z + m[13]) / -vz;
          if (vz > -cam.near || Math.abs(nx) > 1 || Math.abs(ny) > 1) res[k]++;
        }
        res.out = res.tele + res.enemy + res.player; res.pass = res.out === 0; return res;
      },
      info() { const { world, view } = window.__synes; return { calls: view.renderer.info.render.calls, pull: +view.camPull.toFixed(3), cy: +view.camera.position.y.toFixed(2), cz: +view.camera.position.z.toFixed(2), tick: world.tick }; },
    };
  });
  return { ctx, page };
}

/** Drive one case; returns { start, mid, tFirstPass, maxCalls, ... } and optionally calls snap(label) / frame() */
async function runCase(c, tier, variant, size, { shot, clip }) {
  const { ctx, page } = await openPage(size, tier, variant, c.kind === 'boss' ? 'boss' : '');
  const out = { id: c.id, tier, variant, size: size.join('x') };
  const frames = [];
  const snap = async (name) => { if (!shot) return; const f = path.join(tmp, `${c.id}-${tier}-${variant}-${name}.jpg`); await page.screenshot({ path: f, type: 'jpeg', quality: 88 }); out['shot_' + name] = f; };
  try {
    if (c.kind === 'boss') {
      await page.evaluate(() => { const { world } = window.__synes; world.player.x = -2; world.player.z = -70; world.player.fx = 0; world.player.fz = -1; for (let i = 0; i < 90 && !(world.bossStarted && world.boss.state === 'approach'); i++) window.__synesQA.stepTicks(1, false); });
      await page.evaluate((c) => {
        const { world, view } = window.__synes, p = world.player, b = world.boss;
        world.phase = c.phase; p.x = c.player[0]; p.z = c.player[1]; p.fx = 0; p.fz = -1; b.x = c.boss[0]; b.z = c.boss[1]; b.state = 'approach'; b.st = 0.05; b.atk = ''; b.lastAtk = ''; b.repeat = 0;
        world.bossNext = c.atk; world.tele.length = 0;
        for (let i = 0; i < 10; i++) view.render(world, 1, 0.5); // settle the camera on the new framing (frozen sim)
      }, c);
    } else {
      await page.evaluate((c) => {
        const { world, view } = window.__synes, p = world.player;
        for (const a of world.actors) if (a.kind !== 'player') { a.x = 200; a.z = 0; a.active = false; a.state = 'idle'; }
        const m = world.actors.find((a) => a.kind === 'thornling');
        p.x = c.player[0]; p.z = c.player[1]; p.fx = 0; p.fz = -1; m.x = c.mon[0]; m.z = c.mon[1]; m.active = true; m.state = 'approach'; m.st = 0; m.hp = 1e5; m.maxHp = 1e5;
        for (let i = 0; i < 10; i++) view.render(world, 1, 0.5);
      }, c);
    }
    // wait (drawn ticks) for the forced attack's telegraph
    let n = 0, got = false;
    for (; n < 240; n++) {
      await page.evaluate(() => window.__synesQA.stepTicks(1));
      got = await page.evaluate((c) => window.__synes.world.tele.some((t) => t.atk.id === c.atk), c);
      if (got) break;
    }
    out.waitTicks = n;
    if (!got) { out.error = 'telegraph never appeared'; return out; }
    const meta = await page.evaluate(() => { const { world } = window.__synes; const t = world.tele[0]; return { total: t.total, shapes: world.tele.map((x) => x.shape), nTele: world.tele.length, tele0: t.t, boss: { x: +world.boss.x.toFixed(2), z: +world.boss.z.toFixed(2) }, player: { x: +world.player.x.toFixed(2), z: +world.player.z.toFixed(2) } }; });
    Object.assign(out, meta);
    const clipFrame = async () => { if (!clip) return; const f = path.join(tmp, `${c.id}-${variant}-${String(frames.length).padStart(4, '0')}.jpg`); await page.screenshot({ path: f, type: 'jpeg', quality: 80 }); frames.push(f); };
    out.start = { ...(await page.evaluate(() => window.__pb.check())), ...(await page.evaluate(() => window.__pb.info())) };
    await snap('start'); await clipFrame();
    // step 1 drawn tick at a time through the whole windup (the longest telegraph = shard stagger) + 12 ticks
    const totalTicks = Math.ceil((meta.total + (c.atk === 'shard' ? 0.88 : 0)) * 30) + 12;
    let firstPass = out.start.pass ? 0 : null, maxCalls = out.start.calls, maxPull = out.start.pull, midDone = false, outAfterMid = 0, failTicks = 0;
    for (let k = 1; k <= totalTicks; k++) {
      await page.evaluate(() => window.__synesQA.stepTicks(1));
      const st = await page.evaluate(() => { const w = window.__synes.world, t = w.tele[0]; return { has: w.tele.length > 0, prog: t ? 1 - t.t / t.total : 1, ...window.__pb.info(), chk: window.__pb.check() }; });
      maxCalls = Math.max(maxCalls, st.calls); maxPull = Math.max(maxPull, st.pull);
      if (firstPass === null && st.chk.pass) firstPass = +(k / 30).toFixed(2);
      if (st.has && !midDone && st.prog >= 0.5) { midDone = true; out.mid = { ...st.chk, calls: st.calls, pull: st.pull, cy: st.cy, cz: st.cz, tick: st.tick, prog: +st.prog.toFixed(2) }; await snap('mid'); }
      if (st.has && midDone && !st.chk.pass) { outAfterMid++; }
      if (st.has && !st.chk.pass) failTicks++;
      await clipFrame();
      if (!st.has && k > 4 && midDone) { if (!out.end) out.end = { k, ...st.chk, calls: st.calls, pull: st.pull }; if (k > totalTicks - 6) break; }
    }
    out.maxCalls = maxCalls; out.maxPull = maxPull; out.tFirstPass = firstPass; out.failTicksWhileTele = failTicks; out.failTicksAfterMid = outAfterMid;
    out.hpLost = await page.evaluate(() => window.__synes.world.stats.damageTaken);
  } catch (e) { out.error = String(e.message || e); } finally { out.frames = frames; await ctx.close(); }
  return out;
}

const SIZE = [844, 390];
for (const c of CASES) {
  for (const tier of TIERS) {
    const rec = { id: c.id, kind: c.kind, atk: c.atk, pos: c.pos, tier };
    for (const variant of VARIANTS) {
      const r = await runCase(c, tier, variant, SIZE, { shot: tier === SHOT_TIER, clip: CLIPS.includes(c.id) && tier === SHOT_TIER });
      rec[variant] = r;
      console.log(c.id, tier, variant, r.error || `start ${r.start.pass ? 'PASS' : 'fail(' + r.start.out + ')'} mid ${r.mid?.pass ? 'PASS' : 'fail(' + r.mid?.out + ')'} firstPass ${r.tFirstPass} calls ${r.maxCalls} pull ${r.maxPull}`);
    }
    // montage: rows start / mid, columns before | after
    if (tier === SHOT_TIER && rec.nopull?.shot_mid && rec.pull?.shot_mid) {
      const ins = [rec.nopull.shot_start, rec.pull.shot_start, rec.nopull.shot_mid, rec.pull.shot_mid];
      const f = path.join(outDir, `${c.id}.jpg`);
      spawnSync(FF, ['-y', '-loglevel', 'error', ...ins.flatMap((i) => ['-i', i]), '-filter_complex', '[0][1]hstack[a];[2][3]hstack[b];[a][b]vstack', '-q:v', '3', f]);
      rec.montage = path.basename(f);
    }
    // clips: before | after side by side, real speed (1 tick = 1/30 s per frame)
    if (tier === SHOT_TIER && CLIPS.includes(c.id) && rec.nopull?.frames?.length && rec.pull?.frames?.length) {
      const dirOf = (v) => { const d = path.join(tmp, `clip-${c.id}-${v}`); fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d); rec[v].frames.forEach((f, i) => fs.copyFileSync(f, path.join(d, String(i).padStart(4, '0') + '.jpg'))); return d; };
      const a = dirOf('nopull'), b = dirOf('pull'), f = path.join(outDir, `${c.id}.webm`);
      spawnSync(FF, ['-y', '-loglevel', 'error', '-framerate', '30', '-i', path.join(a, '%04d.jpg'), '-framerate', '30', '-i', path.join(b, '%04d.jpg'),
        '-filter_complex', '[0]drawtext=text=before:x=8:y=8:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.5[x];[1]drawtext=text=after:x=8:y=8:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.5[y];[x][y]hstack',
        '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-pix_fmt', 'yuv420p', f]);
      rec.clip = path.basename(f);
    }
    for (const v of VARIANTS) if (rec[v]) delete rec[v].frames;
    report.cases.push(rec);
  }
}

// portrait 390x844 (unchanged): boss-front slam, before vs after; pull must stay 0 and the pixels identical
if (!ONLY || ONLY.includes('portrait')) {
  const c = BOSS.find((x) => x.id === 'boss-front-slam'), rec = { id: 'portrait-boss-front-slam', tier: 'medium' };
  for (const variant of VARIANTS) {
    const r = await runCase(c, 'medium', variant, [390, 844], { shot: true, clip: false }); rec[variant] = r;
    console.log('portrait', variant, r.error || `start ${r.start.pass} mid ${r.mid?.pass} pull ${r.maxPull} calls ${r.maxCalls}`);
  }
  if (rec.nopull?.shot_mid && rec.pull?.shot_mid) {
    const a = fs.readFileSync(rec.nopull.shot_mid), b = fs.readFileSync(rec.pull.shot_mid);
    rec.identicalMidJpeg = Buffer.compare(a, b) === 0;
    spawnSync(FF, ['-y', '-loglevel', 'error', '-i', rec.nopull.shot_mid, '-i', rec.pull.shot_mid, '-filter_complex', 'hstack', '-q:v', '3', path.join(outDir, 'portrait-boss-front-slam.jpg')]);
  }
  report.cases.push(rec);
}
await browser.close(); srv?.close();
fs.rmSync(tmp, { recursive: true, force: true });
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1));
console.log(`done: ${report.cases.length} case rows, errors ${report.errors.length}`);
