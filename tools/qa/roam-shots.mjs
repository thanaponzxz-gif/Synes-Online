// Free-roam (lane/free-roam) before/after shots: one overhead map view + in-game camera views at fixed spots.
//   node tools/qa/roam-shots.mjs <outDir> [--tag before|after] [--qs 'roam=0'] [--port 4191]
// Serves dist/ in-process. Same seed (1), ?offline&autostart&qafreeze, sim advanced only through __synesQA.stepTicks; the player is
// QA-teleported by writing world.player (same as stage1-shots). Overhead view: fog off, camera straight down over the map centre.
// LIMITS: Chromium + SwiftShader (software GPU), not a real device.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const outDir = args.find((a, i) => !a.startsWith('--') && !['--tag', '--qs', '--port'].includes(args[i - 1])) || 'tools/qa/out/roam';
const tag = opt('tag', 'run'), QS = opt('qs', '') ? '&' + opt('qs').replace(/^[?&]/, '') : '', port = +opt('port', '4191');
fs.mkdirSync(outDir, { recursive: true });

const root = path.resolve('dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
}).listen(port);

// spots: [name, x, z, face x, face z]. 'camp'/'trail'/'clearing'/'spring' exist in both layouts; 'field-*' are off the old path.
const SPOTS = [
  ['camp', 0, 1.5, 0, -1], ['trail', 1.6, -18, 0, -1], ['clearing', 3, -34, 0, -1], ['spring', -0.4, -50.5, 0, -1],
  ['field-west', -14, -22, 0, -1], ['field-east', 16, -30, -0.6, -0.8], ['field-pond', -9, -40, 0.5, -0.8], ['boss-gate', -2, -58, 0, -1],
  ['edge-south', 0, 9, 0, 1], ['edge-east', 22, -12, 1, 0], ['edge-north', 8, -52, 0, -1],
];
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const report = { tag, qs: QS, shots: [], perf: {} };
for (const [w, h] of [[844, 390]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(`http://localhost:${port}/?offline&seed=1&q=medium&autostart&qafreeze${QS}`);
  await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 60000 });
  await page.evaluate(() => window.__synesQA.stepTicks(2));
  // overhead map
  const ov = await page.evaluate(() => {
    const { view, world } = window.__synes, cam = view.camera, sc = view.scene, fog = sc.fog;
    const b = world.level?.bounds ?? { x0: -34, x1: 34, z0: -100, z1: 16 };
    const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    const old = { pos: cam.position.clone(), far: cam.far, fov: cam.fov, aspect: cam.aspect };
    sc.fog = null; cam.far = 1000; cam.fov = 40; cam.aspect = innerWidth / innerHeight;
    const span = Math.max((b.z1 - b.z0) / 2, (b.x1 - b.x0) / 2 / cam.aspect) * 1.08;
    cam.position.set(cx, span / Math.tan((cam.fov / 2) * Math.PI / 180), cz + 0.01); cam.lookAt(cx, 0, cz); cam.updateProjectionMatrix();
    view.renderer.render(sc, cam);
    const png = view.renderer.domElement.toDataURL('image/png'); // read back now: the next rAF redraws with the game camera
    sc.fog = fog; cam.far = old.far; cam.fov = old.fov; cam.aspect = old.aspect; cam.updateProjectionMatrix();
    return { cx, cz, bounds: b, png };
  });
  fs.writeFileSync(path.join(outDir, `${tag}-overview-${w}.png`), Buffer.from(ov.png.split(',')[1], 'base64')); delete ov.png;
  report.shots.push({ name: 'overview', ...ov });
  for (const [name, x, z, fx, fz] of SPOTS) {
    const r = await page.evaluate(([x, z, fx, fz]) => {
      const { world, view } = window.__synes, p = world.player;
      p.x = x; p.z = z; p.fx = fx; p.fz = fz;
      for (let i = 0; i < 3; i++) window.__synesQA.stepTicks(20);
      const info = view.renderer.info.render;
      return { px: +p.x.toFixed(2), pz: +p.z.toFixed(2), calls: info.calls, tris: info.triangles };
    }, [x, z, fx, fz]);
    await page.screenshot({ path: path.join(outDir, `${tag}-${name}-${w}.png`) });
    report.shots.push({ name, want: [x, z], ...r });
  }
  report.errors = errs;
  await page.close();
}
fs.writeFileSync(path.join(outDir, `${tag}-report.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.shots.map((s) => [s.name, s.px, s.pz, s.calls, s.tris])), 'errors', report.errors.length);
await browser.close(); srv.close();
