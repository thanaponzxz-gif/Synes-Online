// Baseline measurement (team B, measure-only). Usage: node tools/qa/baseline.mjs [baseUrl] [outDir] [tiers] [scenes]
// For tiers low/medium/high x scenes camp/trail/clearing/spring/boss: screenshot (844x390 @2x, JPEG q80),
// renderer.info, texture inventory, mesh/material inventory, 5 s FPS; plus dist/ download sizes (raw + gzip).
// Writes <outDir>/baseline.json and <outDir>/tables.md (inlined into docs/qa/baseline-2b.md by hand).
// LIMITS: Chromium + SwiftShader (software GPU) in a container. FPS is RELATIVE ONLY, not a phone number.
// Game code is not touched: scenes are set up through window.__synes (world/view) with the sim frozen via __synesQA.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const [base = 'http://localhost:8097', out = 'docs/qa/baseline-2b', tiersArg = 'low,medium,high', scenesArg = 'camp,trail,clearing,spring,boss'] = process.argv.slice(2);
const TIERS = tiersArg.split(','), SCENES = scenesArg.split(',');
fs.mkdirSync(out, { recursive: true });

// ---- runs inside the page: set up a scene (sim frozen, stepped by hand), returns what was reached
const setupScene = (scene) => {
  const s = window.__synes, w = s.world, v = s.view;
  window.__synesQA.freeze();
  w.player.hp = w.player.maxHp = 99999;
  const step = (n, until) => {
    let i = 0;
    for (; i < n; i++) { v.beforeTick(); const ev = w.step({ mx: 0, mz: 0, b: 0 }); if (ev.length) v.onEvents(ev, w); if (until && until()) break; }
    return i;
  };
  const place = (x, z, fx = 0, fz = -1) => { w.player.x = x; w.player.z = z; w.player.fx = fx; w.player.fz = fz; };
  const prog = (t) => 1 - t.t / t.total;
  let note = '';
  if (scene === 'camp') { place(0, 1.5); step(30); note = 'player at start (0,1.5), sim idle'; }
  else if (scene === 'trail') { place(1.0, -9.5, 0.1, -1); step(30); note = 'player on trail (1,-9.5)'; }
  else if (scene === 'clearing') {
    place(3, -33.5);
    const n = step(30 * 20, () => w.tele.length >= 2 && w.tele.every((t) => prog(t) > 0.35));
    note = `player in clearing (3,-33.5), stepped ${n} ticks, ${w.tele.length} telegraph(s)`;
  } else if (scene === 'spring') { step(30); note = 'start=boss checkpoint (spring), sim idle'; }
  else if (scene === 'boss') {
    place(-2, -70);
    const n = step(30 * 60, () => w.bossStarted && w.tele.some((t) => t.atk.id !== 'charge' && prog(t) > 0.55));
    note = `arena, bossStarted=${w.bossStarted}, phase=${w.phase}, stepped ${n} ticks, ${w.tele.length} telegraph(s) [${w.tele.map((t) => t.atk.id).join(',')}]`;
  }
  return { note, tele: w.tele.length, telegraphs: w.tele.map((t) => t.atk.id), phase: w.phase, bossStarted: w.bossStarted, tick: w.tick };
};

// ---- runs inside the page: measurements
const measure = () => {
  const s = window.__synes, v = s.view, r = v.renderer, FMT = { 1023: 'RGBA', 1022: 'RGB', 1028: 'Red', 1030: 'RG', 1026: 'Depth' };
  const TYPE = { 1009: 'UnsignedByte', 1016: 'HalfFloat', 1015: 'Float' };
  const visible = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const label = (o) => { for (let p = o; p; p = p.parent) if (p.name) return p.name; return o.type + (o.geometry ? ':' + o.geometry.type : ''); };
  const tex = new Map(), mats = new Map(), byMatType = {}, c = { meshes: 0, instancedMeshes: 0, instances: 0, transparent: 0, opaque: 0, shadowCasters: 0, shadowReceivers: 0, points: 0, sprites: 0, lines: 0, hiddenMeshes: 0, skinned: 0 };
  const TEXKEYS = ['map', 'normalMap', 'emissiveMap', 'alphaMap', 'aoMap', 'roughnessMap', 'metalnessMap', 'bumpMap', 'lightMap', 'envMap', 'gradientMap', 'specularMap', 'displacementMap', 'matcap'];
  v.scene.traverse((o) => {
    if (!(o.isMesh || o.isPoints || o.isSprite || o.isLine)) return;
    if (!visible(o)) { if (o.isMesh) c.hiddenMeshes++; return; }
    if (o.isPoints) c.points++; else if (o.isSprite) c.sprites++; else if (o.isLine) c.lines++;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    if (o.isMesh) {
      c.meshes++; if (o.isInstancedMesh) { c.instancedMeshes++; c.instances += o.count; } if (o.isSkinnedMesh) c.skinned++;
      if (o.castShadow) c.shadowCasters++; if (o.receiveShadow) c.shadowReceivers++;
    }
    for (const m of ms) {
      if (!m) continue;
      const key = m.type + (m.transparent ? ' (transparent)' : ' (opaque)');
      const e = (byMatType[key] ??= { meshes: 0, instanced: 0 }); e.meshes++; if (o.isInstancedMesh) e.instanced++;
      if (o.isMesh) { if (m.transparent) c.transparent++; else c.opaque++; }
      const me = mats.get(m.uuid) ?? { type: m.type, name: m.name, transparent: m.transparent, hasMap: !!m.map, uses: 0 }; me.uses++; mats.set(m.uuid, me);
      for (const k of TEXKEYS) {
        const t = m[k]; if (!t || !t.isTexture) continue;
        const img = t.image ?? t.source?.data;
        const cn = img?.constructor?.name;
        const kind = t.isCanvasTexture ? 'canvas' : t.isDataTexture ? 'data' : t.isCompressedTexture ? 'compressed' : cn === 'HTMLCanvasElement' ? 'canvas' : cn === 'ImageBitmap' ? 'image(ImageBitmap)' : img?.tagName === 'IMG' ? 'image' : (cn ?? 'unknown');
        const wd = img?.width ?? 0, ht = img?.height ?? 0;
        const mip = (!!t.generateMipmaps && [1004, 1005, 1007, 1008].includes(t.minFilter)) || (t.mipmaps?.length > 0);
        const e2 = tex.get(t.uuid) ?? { name: t.name || '', slot: k, source: kind, width: wd, height: ht, format: FMT[t.format] ?? t.format, type: TYPE[t.type] ?? t.type, colorSpace: t.colorSpace, mipmaps: mip, anisotropy: t.anisotropy, bytes: Math.round(wd * ht * 4 * (mip ? 1.33 : 1)), meshes: new Set(), materials: new Set() };
        e2.meshes.add(label(o)); e2.materials.add(m.type + (m.name ? ':' + m.name : '')); tex.set(t.uuid, e2);
      }
    }
  });
  const textures = [...tex.values()].map((t) => ({ ...t, meshCount: t.meshes.size, meshes: [...t.meshes].slice(0, 8), materials: [...t.materials] })).sort((a, b) => b.bytes - a.bytes);
  const shadows = r.shadowMap.enabled ? { mapSize: v.sun.shadow.mapSize.x + 'x' + v.sun.shadow.mapSize.y, estBytes: v.sun.shadow.mapSize.x * v.sun.shadow.mapSize.y * 4 } : null;
  const info = r.info;
  return {
    tier: v.q.tier, pixelRatio: v.pixelRatio, canvas: { w: r.domElement.width, h: r.domElement.height, cssW: innerWidth, cssH: innerHeight, dpr: devicePixelRatio },
    renderer: { calls: info.render.calls, triangles: info.render.triangles, points: info.render.points, lines: info.render.lines, geometries: info.memory.geometries, textures: info.memory.textures, programs: info.programs?.length ?? 0, shadows: r.shadowMap.enabled },
    counts: c, byMatType, uniqueMaterials: mats.size, textures, sceneTextureBytes: textures.reduce((a, t) => a + t.bytes, 0), shadowMap: shadows,
    kit: s.perf.kit,
  };
};

const fpsProbe = () => new Promise((res) => {
  const t0 = performance.now(); let n = 0, worst = 0, prev = t0;
  const f = (t) => { n++; worst = Math.max(worst, t - prev); prev = t; if (t - t0 < 5000) requestAnimationFrame(f); else res({ frames: n, seconds: +((t - t0) / 1000).toFixed(2), fps: +(n / ((t - t0) / 1000)).toFixed(1), worstFrameMs: +worst.toFixed(0) }); };
  requestAnimationFrame(f);
});

const browser = await chromium.launch({ args: LAUNCH_ARGS });
const results = [];
for (const tier of TIERS) for (const scene of SCENES) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript((t) => { try { localStorage.setItem('synes.quality', t); } catch {} }, tier); // fixed tier => no adaptive resolution
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  const q = `?autostart=1&offline=1&seed=11&q=${tier}${scene === 'spring' || scene === 'boss' ? '&start=boss' : ''}`;
  await page.goto(base + '/' + q, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__synes?.perf?.firstPlayFrameMs > 0, null, { timeout: 120000 });
  const setup = await page.evaluate(setupScene, scene);
  await page.waitForTimeout(1500); // let several frames render (frozen sim, view still renders)
  const file = `${scene}-${tier}.jpg`;
  await page.screenshot({ path: path.join(out, file), type: 'jpeg', quality: 80 });
  const m = await page.evaluate(measure);
  await page.evaluate(() => window.__synesQA.unfreeze());
  const fps = await page.evaluate(fpsProbe);
  results.push({ scene, tier, file, setup, ...m, fps, errors: errs.slice(0, 5) });
  console.log(scene, tier, JSON.stringify({ calls: m.renderer.calls, tris: m.renderer.triangles, tex: m.renderer.textures, texMB: +(m.sceneTextureBytes / 1048576).toFixed(2), fps: fps.fps, note: setup.note, errs: errs.length }));
  await ctx.close();
}
await browser.close();

// ---- download sizes of dist/
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const dist = walk('dist').map((f) => { const b = fs.readFileSync(f); return { file: path.relative('dist', f), raw: b.length, gzip: zlib.gzipSync(b, { level: 9 }).length }; });
const json = { generatedAt: new Date().toISOString(), base, viewport: '844x390@2x', note: 'SwiftShader software GPU in a container; FPS relative only', dist, results };
fs.writeFileSync(path.join(out, 'baseline.json'), JSON.stringify(json, null, 1));

// ---- markdown tables
const kb = (n) => (n / 1024).toFixed(1), mb = (n) => (n / 1048576).toFixed(2);
let md = '';
md += '### Download sizes (dist/)\n\n| file | raw KB | gzip KB |\n|---|---:|---:|\n' + dist.map((d) => `| ${d.file} | ${kb(d.raw)} | ${kb(d.gzip)} |`).join('\n') + `\n| **total** | ${kb(dist.reduce((a, d) => a + d.raw, 0))} | ${kb(dist.reduce((a, d) => a + d.gzip, 0))} |\n\n`;
md += '### Renderer (renderer.info after the last frame)\n\n| scene | tier | canvas px | pixelRatio | draw calls | triangles | geometries | textures | programs | shadows | FPS (5 s, SwiftShader, relative) |\n|---|---|---|---:|---:|---:|---:|---:|---:|---|---:|\n';
for (const r of results) md += `| ${r.scene} | ${r.tier} | ${r.canvas.w}x${r.canvas.h} | ${r.pixelRatio} | ${r.renderer.calls} | ${r.renderer.triangles} | ${r.renderer.geometries} | ${r.renderer.textures} | ${r.renderer.programs} | ${r.renderer.shadows ? 'on' : 'off'} | ${r.fps.fps} |\n`;
md += '\n### Texture memory (scene-graph textures, est. w x h x 4 x (mipmaps ? 1.33 : 1))\n\n| scene | tier | unique scene textures | est. MB | shadow map est. MB | largest texture |\n|---|---|---:|---:|---|---|\n';
for (const r of results) { const t0 = r.textures[0]; md += `| ${r.scene} | ${r.tier} | ${r.textures.length} | ${mb(r.sceneTextureBytes)} | ${r.shadowMap ? mb(r.shadowMap.estBytes) + ' (' + r.shadowMap.mapSize + ')' : '-'} | ${t0 ? `${t0.source} ${t0.width}x${t0.height} (${t0.meshes.join(', ')})` : '-'} |\n`; }
md += '\n### Mesh / material inventory (visible meshes)\n\n| scene | tier | meshes | instanced meshes (instances) | transparent | opaque | shadow casters | hidden meshes | unique materials | by material type (meshes) |\n|---|---|---:|---|---:|---:|---:|---:|---:|---|\n';
for (const r of results) md += `| ${r.scene} | ${r.tier} | ${r.counts.meshes} | ${r.counts.instancedMeshes} (${r.counts.instances}) | ${r.counts.transparent} | ${r.counts.opaque} | ${r.counts.shadowCasters} | ${r.counts.hiddenMeshes} | ${r.uniqueMaterials} | ${Object.entries(r.byMatType).map(([k, v]) => `${k}: ${v.meshes}`).join('; ')} |\n`;
md += '\n### Texture inventory per scene x tier\n';
for (const r of results) {
  md += `\n**${r.scene} / ${r.tier}** (${r.setup.note})\n\n| texture | slot | source | size | format/type | mipmaps | est. KB | used by (meshes) | materials |\n|---|---|---|---|---|---|---:|---|---|\n`;
  for (const t of r.textures) md += `| ${t.name || '(unnamed)'} | ${t.slot} | ${t.source} | ${t.width}x${t.height} | ${t.format}/${t.type} | ${t.mipmaps ? 'yes' : 'no'} | ${kb(t.bytes)} | ${t.meshCount}: ${t.meshes.join(', ')} | ${t.materials.join(', ')} |\n`;
  if (!r.textures.length) md += '| (none) | | | | | | | | |\n';
}
fs.writeFileSync(path.join(out, 'tables.md'), md);
console.log('wrote', path.join(out, 'baseline.json'), path.join(out, 'tables.md'));
