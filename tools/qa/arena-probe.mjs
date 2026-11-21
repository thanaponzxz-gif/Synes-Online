// DES-004 §6 value check for the boss arena (DES-006 §3 "left crystal brighter than the floor"), per look (?arena=A|B or none).
//   node tools/qa/arena-probe.mjs [outDir] [--dist dir] [--looks base,A,B] [--only open,circle,fan,dash] [--tiers low,medium] [--sizes 844,1672]
// Same frames as tools/qa/stage1-shots.mjs (seed 1, start=boss, player 6.7 m in front of the boss, boss-open = fight start +15 ticks,
// circle/fan/dash = forced slam/sweep/charge +12 ticks). For every frame, two renders of the SAME state are read back (canvas only, no HUD):
//   N = the game's frame · L = label render: every opaque object drawn with a flat label id (ruin instances by their
//   `userData.parts` label from arena.ts, the floor split at 6 m from the arena centre), additive/overlay objects hidden,
//   background cleared to 0 (= sky/fog). Luma (Rec.709 of the sRGB pixel, the same formula as the *-gray images) is then
//   averaged per label over N, so "left crystal" means every visible pixel of that crystal cluster, not one probe point.
// Also reported: the DES-004 §8 legacy point probes (13x13 px at the projected crystal centre / floor point, as atmos-shots.mjs),
// draw calls / triangles of the game's frame, and the texture memory of the scene (unique textures x w x h x 4 x 4/3 if mipmapped).
// LIMITS: Chromium + SwiftShader (software GPU), not a phone. Label pass ignores the near-camera dither of field props.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const valued = new Set(['--dist', '--looks', '--only', '--tiers', '--sizes']);
const pos = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
const outDir = pos[0] || 'tools/qa/out/arena-probe';
const distDir = path.resolve(opt('dist', 'dist'));
const LOOKS = opt('looks', 'base,A,B').split(',');
const ONLY = opt('only', 'open,circle,fan,dash').split(',');
const TIERS = opt('tiers', 'low,medium').split(',');
const SIZES = opt('sizes', '844,1672').split(',').map((s) => (s === '844' ? [844, 390] : [1672, 941]));
const ATK = { circle: 'slam', fan: 'sweep', dash: 'charge' };
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
const report = { dist: path.relative(process.cwd(), distDir) || distDir, seed: 1, generatedAt: new Date().toISOString(), note: 'Chromium headless + SwiftShader, not a real device', shots: [], errors: [] };

async function open(size, tier, look) {
  const [width, height] = size, mobile = width < 1000;
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => report.errors.push(`${look} ${width} ${tier}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') report.errors.push(`console ${look} ${width} ${tier}: ${m.text()}`); });
  await page.goto(`${base}/?offline&seed=1&q=${tier}&autostart&qafreeze&start=boss${look === 'base' ? '' : '&arena=' + look}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__synes?.state === 'playing' && window.__synes.world, null, { timeout: 60000 });
  await page.evaluate(() => window.__synesQA.stepTicks(0));
  return { ctx, page };
}

/** In-page measurement of the current frame. */
function measure() {
  const { view, world } = window.__synes, r = view.renderer, gl = r.getContext(), scene = view.scene, cam = view.camera;
  const calls = r.info.render.calls, tris = r.info.render.triangles; // the game's own frame
  const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
  const read = () => { const b = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b); return b; };
  r.render(scene, cam); const N = read();

  // ---- texture memory of everything in the scene (unique textures)
  const texs = new Map();
  const addTex = (t, owner) => { if (t && t.isTexture && t.image && !texs.has(t)) { const w = t.image.width || 0, h = t.image.height || 0; texs.set(t, { owner, w, h, bytes: Math.round(w * h * 4 * (t.generateMipmaps && t.minFilter !== 1006 && t.minFilter !== 1003 ? 4 / 3 : 1)) }); } };
  scene.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) { for (const k of ['map', 'alphaMap', 'emissiveMap', 'normalMap', 'aoMap', 'lightMap']) addTex(m[k], o.name || o.type); if (m.uniforms) for (const u of Object.values(m.uniforms)) addTex(u.value, o.name || o.type); } });
  const texList = [...texs.values()].sort((a, b) => b.bytes - a.bytes);
  const texBytes = texList.reduce((a, t) => a + t.bytes, 0);

  // ---- label render
  const LABELS = ['sky', 'floor_c', 'floor_o', 'cliff', 'column', 'shrine', 'crystal_rock', 'fall', 'waterfall', 'rim_cards', 'boss', 'hero', 'field', 'shadow',
    'crystal_L0', 'crystal_L1', 'crystal_L2', 'crystal_L3', 'crystal_R0', 'crystal_R1', 'crystal_R2', 'crystal_R3', 'other',
    'pillar_BL', 'pillar_BR', 'pillar_FL', 'pillar_FR'];
  const id = (name) => { const i = LABELS.indexOf(name); return (i < 0 ? LABELS.indexOf('other') : i) / 255; };
  const arenaFloor = scene.getObjectByName('arena_floor');
  const fp = arenaFloor ? arenaFloor.position : { x: 0, z: 0 };
  const swaps = [], hidden = [], icol = [];
  const SM = view.glow?.mat?.constructor ?? scene.children.find((o) => o.material?.isShaderMaterial)?.material.constructor;
  const mkMat = (o, label, src) => {
    const map = src.alphaTest > 0 || src.transparent ? (src.map ?? null) : null;
    return new SM({
      side: src.side, depthTest: true, depthWrite: true, transparent: false,
      uniforms: { uId: { value: id(label) }, uMap: { value: map }, uUseMap: { value: map ? 1 : 0 }, uCut: { value: src.alphaTest > 0 ? src.alphaTest : 0.25 },
        uAtlas: { value: o.name === 'arena_rim_cards' ? 1 : 0 }, uSplit: { value: label === 'floor_c' ? 1 : 0 }, uC: { value: [fp.x, fp.z] }, uO: { value: id('floor_o') } },
      vertexShader: `attribute float aTile; uniform float uAtlas; varying vec2 vUv; varying float vIdI; varying vec2 vW; uniform float uId;
        void main(){ vUv = uv; if (uAtlas > 0.5) vUv.x = (uv.x + aTile) * 0.5; vec4 p = vec4(position, 1.0);
          #ifdef USE_INSTANCING
            p = instanceMatrix * p;
          #endif
          #ifdef USE_INSTANCING_COLOR
            vIdI = instanceColor.r;
          #else
            vIdI = uId;
          #endif
          vec4 wp = modelMatrix * p; vW = wp.xz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: `uniform sampler2D uMap; uniform float uUseMap; uniform float uCut; uniform float uSplit; uniform vec2 uC; uniform float uO; varying vec2 vUv; varying float vIdI; varying vec2 vW;
        void main(){ if (uUseMap > 0.5 && texture2D(uMap, vUv).a < uCut) discard;
          float v = vIdI; if (uSplit > 0.5 && distance(vW, uC) > 6.0) v = uO;
          gl_FragColor = vec4(v, 0.0, 0.0, 1.0); }`,
    });
  };
  const actorOf = new Map();
  for (const v of view.actors.values()) v.root.traverse((o) => actorOf.set(o, v.a.kind));
  // the four sim pillars (crystal_pillar props, LEVEL.pillars): B = boss side (z -81.5), F = entry side (z -70.5); BL is the big
  // "left crystal" of the opening shot at the low camera
  const pillarOf = new Map();
  for (const pl of view.pillars ?? []) { const lab = `pillar_${pl.position.z < fp.z ? 'B' : 'F'}${pl.position.x < fp.x ? 'L' : 'R'}`; pl.traverse((o) => pillarOf.set(o, lab)); }
  const ruins = scene.getObjectByName('prismatic_ruins');
  scene.traverse((o) => {
    if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite) || !o.visible) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    const kind = actorOf.get(o);
    // hidden: additive (halos, shafts, spray, particles), overlays drawn without depth (telegraphs, foot marker, stun stars),
    // other blended non-depth-writing meshes (VFX); kept: waterfall planes and the actors' blob shadows (labelled)
    const overlay = !m || m.blending === 2 || m.depthTest === false || o.isPoints || o.isLine || o.isSprite ||
      (m.transparent && m.depthWrite === false && o.name !== 'arena_waterfalls' && !kind);
    if (overlay) { hidden.push(o); o.visible = false; return; }
    let label = 'field';
    if (o === arenaFloor) label = 'floor_c';
    else if (o.parent === ruins) label = 'ruin';
    else if (o.name === 'arena_rim_cards') label = 'rim_cards';
    else if (o.name === 'arena_waterfalls') label = 'waterfall';
    else if (pillarOf.has(o)) label = pillarOf.get(o);
    else if (kind) label = m.transparent && m.depthWrite === false ? 'shadow' : kind === 'prismback' ? 'boss' : kind === 'player' ? 'hero' : 'other';
    if (o.isInstancedMesh && o.instanceColor) {
      const a = o.instanceColor.array; icol.push([o, a.slice()]);
      const parts = o.userData.parts;
      for (let i = 0; i < o.count; i++) { const v = id(label === 'ruin' ? (parts?.[i] ?? 'other') : label); a[i * 3] = v; a[i * 3 + 1] = 0; a[i * 3 + 2] = 0; }
      o.instanceColor.needsUpdate = true;
    }
    swaps.push([o, o.material]); o.material = mkMat(o, label === 'ruin' ? 'other' : label, m);
  });
  const bg = scene.background, fog = scene.fog, tm = r.toneMapping; scene.background = null; scene.fog = null;
  r.setClearColor(0x000000, 1); r.render(scene, cam); const L = read();
  for (const [o, mat] of swaps) { o.material.dispose(); o.material = mat; }
  for (const [o, a] of icol) { o.instanceColor.array.set(a); o.instanceColor.needsUpdate = true; }
  for (const o of hidden) o.visible = true;
  scene.background = bg; scene.fog = fog; r.toneMapping = tm;
  r.render(scene, cam); // canvas shows the normal frame again

  // ---- per-label luma (Rec.709 on sRGB 0..1)
  const st = {}; for (const n of LABELS) st[n] = { n: 0, s: 0, s2: 0, r: 0, g: 0, b: 0, lumas: [] };
  for (let p = 0, i = 0; p < W * H; p++, i += 4) {
    const k = LABELS[L[i]] ?? 'other', a = st[k];
    const l = (0.2126 * N[i] + 0.7152 * N[i + 1] + 0.0722 * N[i + 2]) / 255;
    a.n++; a.s += l; a.s2 += l * l; a.r += N[i]; a.g += N[i + 1]; a.b += N[i + 2]; if (a.lumas.length < 400000) a.lumas.push(l);
  }
  const fin = (a) => { if (!a.n) return null; const m = a.s / a.n; a.lumas.sort((x, y) => x - y); const q = (k) => +a.lumas[Math.min(a.lumas.length - 1, Math.floor(a.lumas.length * k))].toFixed(3);
    return { px: a.n, share: +(a.n / (W * H)).toFixed(4), luma: +m.toFixed(3), std: +Math.sqrt(Math.max(0, a.s2 / a.n - m * m)).toFixed(3), p10: q(0.1), p50: q(0.5), p90: q(0.9),
      rgb: '#' + [a.r, a.g, a.b].map((x) => Math.round(x / a.n).toString(16).padStart(2, '0')).join('').toUpperCase() }; };
  const labels = {}; for (const n of LABELS) labels[n] = fin(st[n]);
  const merge = (names) => { const a = { n: 0, s: 0, s2: 0, r: 0, g: 0, b: 0, lumas: [] }; for (const n of names) { const b = st[n]; a.n += b.n; a.s += b.s; a.s2 += b.s2; a.r += b.r; a.g += b.g; a.b += b.b; a.lumas.push(...b.lumas.slice(0, 100000)); } return fin(a); };
  const groups = {
    floor: merge(['floor_c', 'floor_o']),
    crystals: merge(LABELS.filter((n) => n.startsWith('crystal_') && n !== 'crystal_rock')),
    leftCrystals: merge(['crystal_L0', 'crystal_L1', 'crystal_L2', 'crystal_L3']),
    rightCrystals: merge(['crystal_R0', 'crystal_R1', 'crystal_R2', 'crystal_R3']),
    midground: merge(['shrine', 'column', 'crystal_rock', 'fall', 'waterfall', ...LABELS.filter((n) => n.startsWith('crystal_') && n !== 'crystal_rock')]),
    midgroundBright: merge(['shrine', 'waterfall', ...LABELS.filter((n) => n.startsWith('crystal_') && n !== 'crystal_rock')]),
    background: merge(['sky', 'cliff']),
    actors: merge(['boss', 'hero']),
    pillars: merge(['pillar_BL', 'pillar_BR', 'pillar_FL', 'pillar_FR']),
  };

  // ---- DES-004 §8 legacy point probes (13x13 px patch, same points as atmos-shots.mjs)
  const o = { x: 0, y: 0, vis: false }, A = { x: -2, z: -76 };
  const patch = (x, y, z) => { view.project(x, y, z, o); if (!o.vis) return null; const cx = Math.round(o.x), cy = Math.round(o.y); let s = 0, n = 0;
    for (let yy = cy - 6; yy <= cy + 6; yy++) for (let xx = cx - 6; xx <= cx + 6; xx++) { if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const i = ((H - 1 - yy) * W + xx) * 4; s += (0.2126 * N[i] + 0.7152 * N[i + 1] + 0.0722 * N[i + 2]) / 255; n++; }
    return n ? +(s / n).toFixed(3) : null; };
  const legacy = { crystalL: patch(A.x - 8.8, 2.9, A.z - 12.4), crystalR: patch(A.x + 8.8, 2.9, A.z - 12.4), floorMid: patch(A.x + 3, 0, A.z + 1), floorNearPlayer: patch(world.player.x + 1.4, 0, world.player.z - 1.2) };

  // ---- label image (false colour) and grayscale of N, for the README
  const mk = (fill) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), d = g.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = ((H - 1 - y) * W + x) * 4, j = (y * W + x) * 4; fill(d.data, j, i); d.data[j + 3] = 255; }
    g.putImageData(d, 0, 0); return c.toDataURL('image/png').split(',')[1]; };
  // false-colour legend (see README): sky dark grey, floor centre green / outer dark green, cliff grey, column brown, shrine yellow,
  // crystal rocks tan, waterfall(s) white, rim cards lime, boss magenta, hero cyan, field props olive, blob shadows dark red,
  // left crystals L0 red / L1 orange / L2-L3 pink, right crystals R0 blue / R1 violet / R2-R3 light blue, other black
  const PAL = { sky: [40, 40, 48], floor_c: [70, 200, 90], floor_o: [30, 110, 50], cliff: [140, 140, 150], column: [130, 90, 60], shrine: [250, 220, 40],
    crystal_rock: [200, 170, 120], fall: [255, 255, 255], waterfall: [255, 255, 255], rim_cards: [170, 250, 60], boss: [230, 40, 220], hero: [40, 230, 240],
    field: [110, 120, 40], shadow: [110, 20, 20], crystal_L0: [240, 30, 30], crystal_L1: [255, 140, 0], crystal_L2: [255, 150, 190], crystal_L3: [255, 150, 190],
    crystal_R0: [30, 80, 255], crystal_R1: [150, 70, 255], crystal_R2: [120, 190, 255], crystal_R3: [120, 190, 255], other: [0, 0, 0],
    pillar_BL: [255, 90, 90], pillar_BR: [90, 140, 255], pillar_FL: [255, 190, 120], pillar_FR: [150, 200, 255] };
  const pal = (k) => PAL[LABELS[k]] ?? [0, 0, 0];
  const labelPng = mk((d, j, i) => { const [a, b, c] = pal(L[i]); d[j] = a; d[j + 1] = b; d[j + 2] = c; });
  const grayPng = mk((d, j, i) => { const l = 0.2126 * N[i] + 0.7152 * N[i + 1] + 0.0722 * N[i + 2]; d[j] = d[j + 1] = d[j + 2] = l; });
  return { calls, tris, W, H, tick: world.tick, tele: world.tele.map((t) => `${t.atk.id}:${t.shape}`), labels, groups, legacy,
    texBytes, texCount: texList.length, textures: texList, memTextures: r.info.memory.textures, labelPng, grayPng };
}

try {
  for (const look of LOOKS) for (const tier of TIERS) for (const size of SIZES) for (const sc of ONLY) {
    const { ctx, page } = await open(size, tier, look);
    const got = await page.evaluate((atk) => { const { world } = window.__synes; const { player, boss } = world; player.x = boss.x; player.z = boss.z + 6.7; player.fx = 0; player.fz = -1;
      let n = 0; for (; n < 60 && !world.bossStarted; n++) window.__synesQA.stepTicks(1, false);
      if (!atk) { window.__synesQA.stepTicks(15); return { n, started: world.bossStarted }; }
      world.bossNext = atk; let k = 0; for (; k < 200 && !world.tele.some((t) => t.owner === world.boss.id && t.atk.id === atk); k++) window.__synesQA.stepTicks(1, false);
      window.__synesQA.stepTicks(12); return { n, atk: world.tele.find((t) => t.owner === world.boss.id)?.atk.id ?? null }; }, ATK[sc] ?? null);
    await page.waitForTimeout(150);
    const m = await page.evaluate(measure);
    const name = `${look}-${sc}-${size[0]}-${tier}`;
    // level build time (canvas floor + scatter + ruins + deco), median of 3 rebuilds; only on the opening frame (after measuring)
    if (sc === 'open') m.buildMs = await page.evaluate(() => { const { view, world } = window.__synes, t = [];
      for (let i = 0; i < 3; i++) { const t0 = performance.now(); view.buildLevel(world, 1); t.push(performance.now() - t0); }
      t.sort((a, b) => a - b); return +t[1].toFixed(1); });
    fs.writeFileSync(path.join(outDir, name + '-labels.png'), Buffer.from(m.labelPng, 'base64'));
    fs.writeFileSync(path.join(outDir, name + '-gray.png'), Buffer.from(m.grayPng, 'base64'));
    delete m.labelPng; delete m.grayPng;
    report.shots.push({ name, look, scene: sc, size: `${size[0]}x${size[1]}`, tier, setup: got, ...m });
    const g = m.groups, lb = m.labels;
    console.log(`${name} calls ${m.calls} tris ${m.tris}${m.buildMs != null ? ` build ${m.buildMs}ms` : ''} tex ${(m.texBytes / 1048576).toFixed(2)}MB | L0 ${lb.crystal_L0?.luma} pBL ${lb.pillar_BL?.luma} pBR ${lb.pillar_BR?.luma} floor ${g.floor?.luma} (c ${lb.floor_c?.luma}) shrine ${lb.shrine?.luma} bg ${g.background?.luma}/${g.background?.std} mid ${g.midgroundBright?.luma}/${g.midgroundBright?.std} | legacy L ${m.legacy.crystalL} floorMid ${m.legacy.floorMid}`);
    await ctx.close();
  }
} finally { await browser.close(); srv.close(); }
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1));
console.log(`done: ${report.shots.length} frames, errors ${report.errors.length}`);
