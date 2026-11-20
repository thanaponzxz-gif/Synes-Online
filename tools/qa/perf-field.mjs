// Field draw-call breakdown + deterministic screenshots (lane/perf-field).
// Usage: node tools/qa/perf-field.mjs <baseUrl> <outDir> [tiers=low,medium] [scenes=camp,clearing,spring,boss,boss-flank,boss-behind]
// Scenes are set up through window.__synes with the sim frozen and stepped by hand (__synesQA.stepTicks), so two builds
// reach the same sim state and camera. Writes <outDir>/calls.json and <outDir>/<tier>-<scene>.png (844x390 @2x).
//   camp = start (0,1.5) · clearing = (3,-33.5) until 2 telegraphs · spring = ?start=boss checkpoint · boss = baseline boss scene
//   boss-flank / boss-behind = the boss scene, then the player is moved beside / in front of (boss behind the camera side) the boss.
// Draw-call categories are counted by walking the scene (visible + frustum-intersecting objects), `total` is renderer.info.render.calls.
// LIMITS: Chromium + SwiftShader in a container; call counts are renderer-side (device independent), timings are not.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const extraQ = process.env.PF_Q || '';
const [base = 'http://localhost:8080', out = 'tools/qa/out/perf', tiersArg = 'low,medium', scenesArg = 'camp,clearing,spring,boss,boss-flank,boss-behind'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: LAUNCH_ARGS });

const setup = (scene) => {
  // Determinism: no free-running frames (only the frames we draw through stepTicks) and a seeded Math.random
  // (particles / camera shake / boss dust use it), so two builds draw exactly the same frame sequence.
  let seed = 123456789; Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) | 0) >>> 0) / 4294967296;
  const s = window.__synes, w = s.world, Q = window.__synesQA;
  // campfire flicker uses Object3D.id as its phase (a session-wide counter that any code change shifts): pin it so builds compare
  for (const f of s.view.flames) { f.scale.set(1, 1, 1); f.rotation.set(0, 0, 0); }
  s.view.flames.length = 0;
  Q.freeze();
  w.player.hp = w.player.maxHp = 99999;
  const place = (x, z, fx = 0, fz = -1) => { w.player.x = x; w.player.z = z; w.player.fx = fx; w.player.fz = fz; };
  const step = (n, until) => { let i = 0; for (; i < n; i++) { Q.stepTicks(1, false); if (until && until()) break; } return i; };
  const prog = (t) => 1 - t.t / t.total;
  const settle = () => { for (let i = 0; i < 40; i++) Q.stepTicks(0); }; // draw frames (dt = 1 tick) so the camera converges identically
  if (scene === 'camp') { place(0, 1.5); step(30); }
  else if (scene === 'clearing') { place(3, -33.5); step(600, () => w.tele.length >= 2 && w.tele.every((t) => prog(t) > 0.35)); }
  else if (scene === 'spring') { step(30); }
  else if (scene === 'pillar-fade') { step(30); place(-8.2, -73.2); step(10); }   // hero right behind a crystal pillar: pillar fades (separate meshes)
  else if (scene === 'gate-fade') { step(30); place(2.6, -47.6, 0, -1); step(10); } // hero right behind the clearing gate: gate fades
  else {
    place(-2, -70);
    step(1800, () => w.bossStarted && w.tele.some((t) => t.atk.id !== 'charge' && prog(t) > 0.55));
    const b = w.boss;
    if (scene === 'boss-flank') place(b.x + 7, b.z + 0.5, -1, 0);
    else if (scene === 'boss-behind') place(b.x, b.z - 6, 0, -1);
    else place(b.x, b.z + 6.7, 0, -1);
    step(2);
  }
  if (new URLSearchParams(location.search).has('hide')) { const h = new URLSearchParams(location.search).get('hide'); for (const c of s.view.env.children) { if ((h === 'scatter' && c.isInstancedMesh && c.parent === s.view.env) || (h === 'landmarks' && c.isGroup && c.name !== 'prismatic_ruins') || c.name === h) c.visible = false; } }
  settle();
  return { tick: w.tick, bossStarted: w.bossStarted, tele: w.tele.map((t) => t.atk.id) };
};

const measure = () => {
  const v = window.__synes.view, r = v.renderer, cam = v.camera;
  window.__synesQA.stepTicks(0);
  cam.updateMatrixWorld(); const THREE_F = v.scene.constructor; // Scene
  const total = r.info.render.calls, tris = r.info.render.triangles;
  // frustum from camera (same maths as three)
  const m = cam.projectionMatrix.clone().multiply(cam.matrixWorldInverse);
  const e = m.elements, planes = [];
  const P = (a, b, c, d) => { const l = Math.hypot(a, b, c); planes.push([a / l, b / l, c / l, d / l]); };
  P(e[3] - e[0], e[7] - e[4], e[11] - e[8], e[15] - e[12]); P(e[3] + e[0], e[7] + e[4], e[11] + e[8], e[15] + e[12]);
  P(e[3] + e[1], e[7] + e[5], e[11] + e[9], e[15] + e[13]); P(e[3] - e[1], e[7] - e[5], e[11] - e[9], e[15] - e[13]);
  P(e[3] - e[2], e[7] - e[6], e[11] - e[10], e[15] - e[14]); P(e[3] + e[2], e[7] + e[6], e[11] + e[10], e[15] + e[14]);
  const inFrustum = (o) => {
    if (o.frustumCulled === false) return true;
    const g = o.geometry; let bs;
    if (o.isInstancedMesh) { if (!o.boundingSphere) o.computeBoundingSphere(); bs = o.boundingSphere.clone(); }
    else { if (!g.boundingSphere) g.computeBoundingSphere(); bs = g.boundingSphere.clone(); }
    bs.applyMatrix4(o.matrixWorld);
    for (const p of planes) if (p[0] * bs.center.x + p[1] * bs.center.y + p[2] * bs.center.z + p[3] < -bs.radius) return false;
    return true;
  };
  const visible = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const actorRoots = new Set([...v.actors.values()].map((a) => a.root));
  const shadowMeshes = new Set([...v.actors.values()].map((a) => a.shadow));
  const teleMeshes = new Set([...v.teles.values()].map((t) => t.m));
  const cats = {};
  const bump = (k, n = 1) => { cats[k] = (cats[k] || 0) + n; };
  const cat = (o) => {
    let envChild = null, ruins = false;
    for (let p = o; p; p = p.parent) {
      if (p === v.arenaRuins) ruins = true;
      if (p.parent === v.env) envChild = p;
      if (actorRoots.has(p)) return shadowMeshes.has(o) ? 'blob shadows' : 'characters';
    }
    if (teleMeshes.has(o)) return 'telegraphs';
    if (ruins) return 'arena ruins';
    if (envChild) {
      if (o.material && o.material.isShaderMaterial) return 'atmosphere (glow/rays)';
      if (o === envChild && o.isMesh && o.geometry.type === 'PlaneGeometry') return 'terrain';
      if (o === envChild && o.isInstancedMesh) return 'scatter';
      return 'landmarks';
    }
    return 'fx/other';
  };
  v.scene.traverse((o) => {
    if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite)) return;
    if (!visible(o) || !inFrustum(o)) return;
    if (o.isInstancedMesh && o.count === 0) return;
    const mats = Array.isArray(o.material) ? o.material.length : 1;
    const g = o.geometry;
    if (g && g.drawRange && g.drawRange.count === 0) return;
    bump(cat(o), Array.isArray(o.material) ? (g.groups.length || 1) : 1);
  });
  const counted = Object.values(cats).reduce((a, b) => a + b, 0);
  return { total, counted, tris, tier: v.q.tier, cats, shadowsOn: r.shadowMap.enabled, far: cam.far };
};

const results = { generatedAt: new Date().toISOString(), base, rows: [] };
for (const tier of tiersArg.split(',')) {
  for (const scene of scenesArg.split(',')) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(`${base}/?offline&seed=11&q=${tier}&autostart&qafreeze${extraQ}${scene.startsWith('boss') || scene === 'spring' || scene.endsWith('-fade') ? '&start=boss' : ''}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__synes?.world && window.__synes.state === 'playing');
    // hold the free-running frame loop while the scene is set up (only frames drawn through stepTicks exist), then release it
    await page.evaluate(() => { const orig = window.requestAnimationFrame.bind(window); window.__rafOrig = orig; window.__rafHeld = null; window.requestAnimationFrame = (cb) => { window.__rafHeld = cb; return 0; }; });
    await page.waitForTimeout(300); // let the already queued frame run before the setup starts
    const info = await page.evaluate(setup, scene);
    await page.evaluate(() => { Math.random = () => 0.5; /* no camera jitter / dust in the free frames */ window.__synesQA.stepTicks(0); for (const el of document.body.children) if (el.tagName !== 'CANVAS' && !el.contains(document.querySelector('canvas'))) el.style.visibility = 'hidden'; /* HUD is DOM with its own timers: shots compare the 3D canvas only */ window.requestAnimationFrame = window.__rafOrig; if (window.__rafHeld) window.__rafOrig(window.__rafHeld); });
    const m = await page.evaluate(measure);
    await page.screenshot({ path: path.join(out, `${tier}-${scene}.png`), type: 'png' });
    results.rows.push({ tier, scene, ...info, ...m, errors: errs });
    console.log(tier, scene, 'calls', m.total, 'counted', m.counted, JSON.stringify(m.cats));
    await ctx.close();
  }
}
fs.writeFileSync(path.join(out, 'calls.json'), JSON.stringify(results, null, 1));
await browser.close();
