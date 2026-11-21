// Opening scene (camp -> path A) value-map probes of docs/stage1/ART_TARGET_OPENING.md §2 (O1-O9, exact rectangles) + warning-edge ROI on
// pathA / plaza (tele-roi.mjs method) for one build and one URL option.
//   node tools/qa/opening-probe.mjs <outDir> [--dist dist] [--qs "opening=A"] [--tag A] [--tiers low,medium]
// Frames = the stage1-shots.mjs frames (seed 1, 844x390 dpr 1, ?offline&seed=1&q=<tier>&autostart&qafreeze, same tick steps):
//   opening-start (tick 0) · opening-walk2s (W held 60 ticks) · pathA (player at (1.4,-10), first telegraph + 10 ticks) · plaza (3,-31).
// For each frame: the page screenshot (DOM HUD included; the target doc measured on these) and the canvas alone (gl.readPixels of the same
// state, no HUD) for O9. pathA / plaza add H (telegraphs hidden), N0 (renderOrder > 10 hidden) and an edge mask M (QA shader on the
// telegraph meshes, as tele-roi.mjs) so the edge ROI, the floor beneath it and "most saturated warm pixel" can be read.
// Luma = Rec.709 on sRGB 0-1 (as the -gray images). LIMITS: Chromium + SwiftShader, not a real phone; 8-bit sRGB framebuffer.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const valued = new Set(['--tag', '--dist', '--qs', '--tiers']);
const pos = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
const outDir = pos[0] || 'tools/qa/out/opening-probe';
const qs = opt('qs', ''), tag = opt('tag', qs || 'current');
const distDir = path.resolve(opt('dist', 'dist'));
const TIERS = opt('tiers', 'low,medium').split(',');
const SEED = 1, W = 844, H = 390;
fs.mkdirSync(outDir, { recursive: true });

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(distDir, p);
  if (!f.startsWith(distDir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' }); res.end(fs.readFileSync(f));
});
await new Promise((r) => srv.listen(Number(process.env.SYNES_QA_PORT || 0), '127.0.0.1', r)); // 0 = any free port (other QA runs may hold the fixed ones)
const base = `http://127.0.0.1:${srv.address().port}`;
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const report = { tag, qs, dist: distDir, seed: SEED, generatedAt: new Date().toISOString(), note: 'Chromium headless + SwiftShader, not a real device', tiers: {}, errors: [] };

async function open(tier) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => report.errors.push(`${tier}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') report.errors.push(`console ${tier}: ${m.text()}`); });
  await page.goto(`${base}/?offline&seed=${SEED}&q=${tier}&autostart&qafreeze${qs ? '&' + qs : ''}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__synes?.state === 'playing' && window.__synes.world, null, { timeout: 60000 });
  await page.evaluate(() => window.__synesQA.stepTicks(0));
  return { ctx, page };
}
const tp = (page, x, z) => page.evaluate(([x, z]) => { const p = window.__synes.world.player; p.x = x; p.z = z; p.fx = 0; p.fz = -1; }, [x, z]);

/** In page: canvas-only renders of the current state. withTele: also H (telegraphs hidden), N0 (renderOrder > 10 hidden), M (edge mask).
 *  Returns base64 RGBA buffers flipped to top-down rows + draw calls of the game's own frame + projected landmark boxes. */
async function grab({ withTele, withHero }) {
  const { view, world } = window.__synes, r = view.renderer, gl = r.getContext(), scene = view.scene, cam = view.camera;
  const calls = r.info.render.calls, tris = r.info.render.triangles;
  const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
  const read = () => { const b = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, b); const o = new Uint8Array(w * h * 4); for (let y = 0; y < h; y++) o.set(b.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4); return o; };
  const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  r.render(scene, cam); const N = read();
  const out = { calls, tris, w, h, N: b64(N), tick: world.tick };
  // projected boxes of landmarks (CSS px = device px at dpr 1)
  const o = { x: 0, y: 0, vis: false }, box = (x, y0, y1, z, hw) => { view.project(x, y1, z, o); const top = o.y, cx = o.x; view.project(x, y0, z, o); return [Math.round(cx - hw), Math.round(top), Math.round(cx + hw), Math.round(o.y)]; };
  out.lanterns = [[-2.4, -6], [2.8, -10]].map(([x, z]) => box(x, 2.17, 2.81, z, 6)); // kit lantern head (gold cage + glow) spans y 2.17-2.81 m
  if (withHero) { // hero-only silhouette mask (white on black), for the "top edge of the hair" pixels of O5
    const heroMeshes = new Set(); view.actors.get(world.player.id).model.traverse((ob) => { if (ob.isMesh) heroMeshes.add(ob); });
    const hidden = []; scene.traverse((ob) => { if ((ob.isMesh || ob.isPoints || ob.isLine || ob.isSprite) && ob.visible && !heroMeshes.has(ob)) { hidden.push(ob); ob.visible = false; } });
    const bg = scene.background, fog = scene.fog; scene.background = new bg.constructor(0x000000); scene.fog = null;
    const om = new view.playerMark.material.constructor({ color: 0xffffff }); scene.overrideMaterial = om;
    r.render(scene, cam); out.HM = b64(read());
    scene.overrideMaterial = null; om.dispose(); for (const ob of hidden) ob.visible = true; scene.background = bg; scene.fog = fog;
    r.render(scene, cam);
  }
  if (withTele) {
    const teles = [...view.teles.values()];
    const later = []; scene.traverse((ob) => { if ((ob.isMesh || ob.isPoints) && ob.visible && ob.renderOrder > 10) { later.push(ob); ob.visible = false; } });
    r.render(scene, cam); const N0 = read();
    for (const ob of later) ob.visible = true;
    for (const t of teles) t.m.visible = false;
    r.render(scene, cam); const Hd = read();
    const hidden = []; scene.traverse((ob) => { if ((ob.isMesh || ob.isPoints || ob.isLine || ob.isSprite) && ob.visible && !teles.some((t) => t.m === ob)) { hidden.push(ob); ob.visible = false; } });
    const bg = scene.background, fog = scene.fog; scene.background = new bg.constructor(0x000000); scene.fog = null;
    const masks = [];
    for (const t of teles) {
      const u = t.mat.uniforms, SM = t.mat.constructor;
      const mm = new SM({ depthTest: false, depthWrite: false, transparent: false, side: t.mat.side,
        uniforms: { uShape: { value: u.uShape.value }, uCos: { value: u.uCos.value }, uInner: { value: u.uInner.value } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `uniform float uShape; uniform float uCos; uniform float uInner; varying vec2 vUv;
          void main(){
            float arc = 0.0, side = 0.0, endc = 0.0;
            if (uShape < 0.5) { vec2 p = vUv * 2.0 - 1.0; float d = length(p); if (d > 1.0) discard; arc = step(0.97, d); }
            else if (uShape < 1.5) { vec2 p = vUv * 2.0 - 1.0; float d = length(p); if (d > 1.0) discard; float c = d > 0.001 ? p.y / d : 1.0;
              if (c < uCos) discard; float ang = (c - uCos) / max(0.0001, 1.0 - uCos); arc = step(0.97, d); side = (1.0 - step(0.01, ang)) * step(uInner, d) * (1.0 - arc); }
            else { float sx = abs(vUv.x - 0.5) * 2.0; side = step(0.96, sx); endc = max(1.0 - step(0.004, vUv.y), step(0.996, vUv.y)) * (1.0 - side); }
            if (arc + side + endc < 0.5) discard;
            gl_FragColor = vec4(arc, side, endc, 1.0);
          }` });
      masks.push([t, t.mat, mm]); t.m.material = mm; t.m.visible = true;
    }
    r.render(scene, cam); const M = read();
    for (const [t, orig, mm] of masks) { t.m.material = orig; mm.dispose(); }
    for (const ob of hidden) ob.visible = true; scene.background = bg; scene.fog = fog;
    r.render(scene, cam);
    Object.assign(out, { N0: b64(N0), H: b64(Hd), M: b64(M), tele: world.tele.map((t) => `${t.atk.id}:${t.shape}:${(1 - t.t / t.total).toFixed(2)}`), targets: world.tele.map((t) => (t.atk.id === 'slam' || t.atk.id === 'charge' ? [255, 51, 85] : [255, 122, 26])) });
  }
  return out;
}

// ---------------------------------------------------------------- pixel helpers (node side)
const decodePng = (buf) => { const r = spawnSync('/usr/bin/ffmpeg', ['-loglevel', 'error', '-i', 'pipe:0', '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1'], { input: buf, maxBuffer: 1 << 28 }); if (r.status !== 0) throw new Error('ffmpeg decode failed'); return r.stdout; };
const luma = (R, G, B) => (0.2126 * R + 0.7152 * G + 0.0722 * B) / 255;
const hsv = (R, G, B) => { const r_ = R / 255, g_ = G / 255, b_ = B / 255, mx = Math.max(r_, g_, b_), mn = Math.min(r_, g_, b_), d = mx - mn;
  let h = 0; if (d) { h = mx === r_ ? ((g_ - b_) / d) % 6 : mx === g_ ? (b_ - r_) / d + 2 : (r_ - g_) / d + 4; h *= 60; if (h < 0) h += 360; }
  return [h, mx ? d / mx : 0, mx]; };
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lab = (R, G, B) => { const r_ = lin(R), g_ = lin(G), b_ = lin(B);
  let x = (0.4124564 * r_ + 0.3575761 * g_ + 0.1804375 * b_) / 0.95047, y = 0.2126729 * r_ + 0.7151522 * g_ + 0.072175 * b_, z = (0.0193339 * r_ + 0.119192 * g_ + 0.9503041 * b_) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116); x = f(x); y = f(y); z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]; };
const de00 = (l1, l2) => { // CIEDE2000 (same as tele-roi.mjs)
  const [L1, a1, b1] = l1, [L2, a2, b2] = l2, rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2, G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + G), a2p = a2 * (1 + G), C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const hh = (b, a) => { if (!b && !a) return 0; const v = Math.atan2(b, a) / rad; return v < 0 ? v + 360 : v; };
  const h1p = hh(b1, a1p), h2p = hh(b2, a2p), dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = 0; if (C1p * C2p) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp / 2 * rad), Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p; if (C1p * C2p) { if (Math.abs(h1p - h2p) > 180) hbp += h1p + h2p < 360 ? 360 : -360; hbp /= 2; }
  const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
  const dth = 30 * Math.exp(-(((hbp - 275) / 25) ** 2)), RC = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const SL = 1 + 0.015 * (Lbp - 50) ** 2 / Math.sqrt(20 + (Lbp - 50) ** 2), SC = 1 + 0.045 * Cbp, SH = 1 + 0.015 * Cbp * T, RT = -Math.sin(2 * dth * rad) * RC;
  return Math.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2 + RT * (dCp / SC) * (dHp / SH)); };
const chroma = (R, G, B) => { const [, a, b] = lab(R, G, B); return Math.hypot(a, b); };
const r3 = (v) => (v == null || Number.isNaN(v) ? null : +v.toFixed(3));

/** img = { d: RGBA buffer, w } ; rect = [x0,y0,x1,y1) */
function lumaStats(img, [x0, y0, x1, y1], pred = null) {
  const v = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * img.w + x) * 4; if (pred && !pred(img.d[i], img.d[i + 1], img.d[i + 2])) continue; v.push(luma(img.d[i], img.d[i + 1], img.d[i + 2])); }
  v.sort((a, b) => a - b);
  const q = (k) => (v.length ? v[Math.min(v.length - 1, Math.floor(v.length * k))] : null);
  return { n: v.length, mean: v.length ? r3(v.reduce((a, b) => a + b, 0) / v.length) : null, p90: r3(q(0.9)), max: r3(v[v.length - 1]), min: r3(v[0]) };
}
/** crystal colours: "lumen/blue" hue 150-215 deg, "violet" hue 230-300 deg, both S > 0.25 and V > 0.45 (calibrated on the r0 frame, see README) */
const isLumen = (R, G, B) => { const [h, s, v] = hsv(R, G, B); return h >= 150 && h <= 215 && s > 0.25 && v > 0.45; };
const isViolet = (R, G, B) => { const [h, s, v] = hsv(R, G, B); return h >= 230 && h <= 300 && s > 0.25 && v > 0.45; };
/** "glow" = the same hues, brighter and more saturated (V >= 0.75, S >= 0.35): what reads as a lit crystal point, not a tinted stone */
const isGlow = (R, G, B) => { const [h, s, v] = hsv(R, G, B); return ((h >= 150 && h <= 215) || (h >= 230 && h <= 300)) && s >= 0.35 && v >= 0.75; };
function count(img, [x0, y0, x1, y1], pred) { let n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * img.w + x) * 4; if (pred(img.d[i], img.d[i + 1], img.d[i + 2])) n++; } return n; }
/** roughness = mean |luma difference| of horizontally and vertically adjacent pixels (target doc issue 5) */
function rough(img, [x0, y0, x1, y1]) { let s = 0, n = 0; const L = (x, y) => { const i = (y * img.w + x) * 4; return luma(img.d[i], img.d[i + 1], img.d[i + 2]); };
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { if (x + 1 < x1) { s += Math.abs(L(x, y) - L(x + 1, y)); n++; } if (y + 1 < y1) { s += Math.abs(L(x, y) - L(x, y + 1)); n++; } } return r3(s / n); }
const scarf = (R, G, B) => { const [h, s, v] = hsv(R, G, B); return h >= 160 && h <= 185 && s >= 0.55 && v >= 0.35 && v <= 0.85; };
const warnHue = (R, G, B) => { const [h, s, v] = hsv(R, G, B); return h >= 10 && h <= 35 && s > 0.6 && v > 0.55; };
const frameMean = (img) => { let s = 0; for (let i = 0; i < img.d.length; i += 4) s += luma(img.d[i], img.d[i + 1], img.d[i + 2]); return r3(s / (img.d.length / 4)); };
const fromB64 = (s) => ({ d: Buffer.from(s, 'base64'), w: W });

/** warning-edge ROI on canvas buffers (tele-roi.mjs method, without the boss parts) + O8 (screen ROI 330,300,520,352 for pathA) */
function edgeStats(g, o8rect) {
  const N = fromB64(g.N).d, N0 = fromB64(g.N0).d, Hd = fromB64(g.H).d, M = fromB64(g.M).d, target = g.targets[0] ?? [255, 122, 26], tLab = lab(...target);
  const diff = (A, B, i) => Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]);
  let n = 0, sr = 0, sg = 0, sb = 0, ss = 0, sv = 0, hx = 0, hy = 0, sde = 0, close = 0, lE = 0, lU = 0; const roiSV = [], roiC = [], roi = new Uint8Array(W * H);
  for (let p = 0, i = 0; p < W * H; p++, i += 4) {
    if (!(M[i] > 127 || M[i + 1] > 127 || M[i + 2] > 127)) continue;
    if (diff(N, Hd, i) <= 3 || diff(N, N0, i) > 3) continue;
    roi[p] = 1; n++;
    const R = N[i], G = N[i + 1], B = N[i + 2], [h, s, v] = hsv(R, G, B), d = de00(lab(R, G, B), tLab);
    sr += R; sg += G; sb += B; ss += s; sv += v; hx += Math.cos(h * Math.PI / 180) * s; hy += Math.sin(h * Math.PI / 180) * s; sde += d; if (d < 10) close++;
    lE += luma(R, G, B); lU += luma(Hd[i], Hd[i + 1], Hd[i + 2]); roiSV.push(s * v); roiC.push(chroma(R, G, B));
  }
  const other = [], otherC = []; let foot = 0;
  for (let i = 0; i < N.length; i += 4) {
    if (diff(N, Hd, i) > 3) { foot++; continue; }
    const [h, s, v] = hsv(N[i], N[i + 1], N[i + 2]); if ((h >= 320 || h < 50) && v > 0.35) { other.push(s * v); otherC.push(chroma(N[i], N[i + 1], N[i + 2])); }
  }
  for (const a of [roiSV, roiC, other, otherC]) a.sort((x, y) => x - y);
  const q = (a, k) => (a.length ? a[Math.min(a.length - 1, Math.floor(a.length * k))] : null);
  let hue = Math.atan2(hy, hx) * 180 / Math.PI; if (hue < 0) hue += 360;
  const mean = n ? [sr / n, sg / n, sb / n].map(Math.round) : null;
  const res = { target: '#' + target.map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase(), roiPx: n,
    meanHex: mean ? '#' + mean.map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase() : null, hue: n ? +hue.toFixed(1) : null, sat: n ? r3(ss / n) : null, val: n ? r3(sv / n) : null,
    dE00mean: n ? +(sde / n).toFixed(1) : null, shareDE10: n ? r3(close / n) : null, edgeLuma: n ? r3(lE / n) : null, underLuma: n ? r3(lU / n) : null,
    roiSVmedian: r3(q(roiSV, 0.5)), roiCmedian: roiC.length ? +q(roiC, 0.5).toFixed(1) : null, sceneWarmOtherSVmax: r3(q(other, 1)), sceneWarmOtherCmax: otherC.length ? +q(otherC, 1).toFixed(1) : null, footprintPx: foot };
  res.edgeMostVivid = res.roiSVmedian != null && (res.sceneWarmOtherSVmax ?? 0) < res.roiSVmedian && (res.sceneWarmOtherCmax ?? 0) < res.roiCmedian;
  if (o8rect) { // O8 as written in the target doc: screen pixels S > 0.8, hue 15-35 deg inside the rect (canvas = no HUD there) vs the same pixels with telegraphs hidden
    const [x0, y0, x1, y1] = o8rect; let k = 0, le = 0, lu = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * W + x) * 4, [h, s] = hsv(N[i], N[i + 1], N[i + 2]); if (s > 0.8 && h >= 15 && h <= 35) { k++; le += luma(N[i], N[i + 1], N[i + 2]); lu += luma(Hd[i], Hd[i + 1], Hd[i + 2]); } }
    res.o8 = { px: k, ringLuma: k ? r3(le / k) : null, pathUnderLuma: k ? r3(lu / k) : null, delta: k ? r3((lu - le) / k) : null };
  }
  let warnOutside = 0; for (let p = 0, i = 0; p < W * H; p++, i += 4) if (diff(N, Hd, i) <= 3 && warnHue(N[i], N[i + 1], N[i + 2])) warnOutside++;
  res.o9WarmOutsideTelegraph = warnOutside;
  return res;
}

// ---------------------------------------------------------------- run
const R = {
  sky: [395, 22, 415, 30], archL: [421, 36, 427, 54], archR: [463, 38, 468, 54], archBox: [410, 26, 480, 62],
  crystal: [532, 90, 540, 104], crystalCount: [505, 70, 565, 125], crystalW2: [622, 152, 638, 184], crystalW2Count: [600, 120, 665, 200],
  pathFar: [430, 64, 470, 72], pathMid: [440, 150, 500, 200], pathNear: [600, 250, 690, 290], grass: [140, 150, 200, 175],
  treeR: [645, 70, 700, 100], treeL: [266, 60, 292, 90], hair: [400, 218, 440, 232], aboveHead: [405, 200, 440, 214], scarfBox: [370, 215, 470, 335],
  capTop: [442, 86, 458, 92], capBody: [446, 96, 456, 103], underPuffL: [430, 92, 440, 100], underPuffR: [462, 92, 472, 100], tentLit: [262, 195, 292, 235], tentDoor: [232, 230, 262, 265],
  ditherR: [795, 205, 825, 255], ditherL: [120, 170, 190, 205], o8: [330, 300, 520, 352],
};
const T = { // per-option targets (§2) : [lo, hi]
  A: { sky: [0.82, 0.88], pathFar: [0.80, 0.86], pathMidNear: [0.76, 0.80], grass: [0.58, 0.66], trees: [0.28, 0.45], frame: [0.58, 0.65], crystalP90: 0.92, crystalMean: 0.80, puff: 0.15 },
  B: { sky: [0.72, 0.80], pathFar: [0.68, 0.74], pathMidNear: [0.67, 0.72], grass: [0.48, 0.58], trees: [0.25, 0.42], frame: [0.50, 0.57], crystalP90: 0.86, crystalMean: 0.76, puff: 0.12 },
};
const optName = /opening=B/i.test(qs) ? 'B' : 'A'; // the current look is judged against the A numbers (A keeps its sky/field)

try {
  for (const tier of TIERS) {
    const res = { shots: {} }; report.tiers[tier] = res;
    // ---- opening start (tick 0) + walk 2 s
    let { ctx, page } = await open(tier);
    await page.waitForTimeout(250);
    const shot0 = await page.screenshot({ path: path.join(outDir, `opening-start-844-${tier}.png`) });
    const g0 = await page.evaluate(grab, { withTele: false, withHero: true });
    await page.keyboard.down('KeyW'); await page.evaluate(() => window.__synesQA.stepTicks(60)); await page.keyboard.up('KeyW');
    await page.waitForTimeout(250);
    const shot1 = await page.screenshot({ path: path.join(outDir, `opening-walk2s-844-${tier}.png`) });
    const g1 = await page.evaluate(grab, { withTele: false });
    await ctx.close();
    // ---- pathA
    ({ ctx, page } = await open(tier)); await tp(page, 1.4, -10);
    const gotA = await page.evaluate(() => { const w = window.__synes.world; let n = 0; for (; n < 240 && !w.tele.length; n++) window.__synesQA.stepTicks(1, false); window.__synesQA.stepTicks(10); return { n, teleCount: w.tele.length }; });
    await page.waitForTimeout(250);
    const shotA = await page.screenshot({ path: path.join(outDir, `pathA-844-${tier}.png`) });
    const gA = await page.evaluate(grab, { withTele: true });
    await ctx.close();
    // ---- plaza
    ({ ctx, page } = await open(tier)); await tp(page, 3, -31);
    const gotP = await page.evaluate(() => {
      const w = window.__synes.world; let n = 0, both = false, line = false;
      for (; n < 420; n++) { window.__synesQA.stepTicks(1, false); const l = w.tele.some((t) => t.shape === 'line'), c = w.tele.some((t) => t.shape === 'circle'); if (l && c) { both = true; break; } if (l) line = true; if (line && !l) break; }
      window.__synesQA.stepTicks(4); return { n, both, teleShapes: w.tele.map((t) => t.shape) };
    });
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(outDir, `plaza-844-${tier}.png`) });
    const gP = await page.evaluate(grab, { withTele: true });
    await ctx.close();

    const s0 = { d: decodePng(shot0), w: W }, s1 = { d: decodePng(shot1), w: W };
    // O5 alternative: the hair's top-edge pixels = the first 3 hero-mask rows of every column whose top hero pixel is on the head (y < 250)
    const HM = fromB64(g0.HM).d, band = [];
    for (let x = 360; x < 480; x++) { let y = 150; while (y < 340 && HM[(y * W + x) * 4] < 128) y++; if (y >= 250) continue; for (let k = 0; k < 3 && HM[((y + k) * W + x) * 4] >= 128; k++) { const i = ((y + k) * W + x) * 4; band.push(luma(s0.d[i], s0.d[i + 1], s0.d[i + 2])); } }
    const hairEdge = { px: band.length, mean: r3(band.reduce((a, b) => a + b, 0) / Math.max(1, band.length)), shareGE092: r3(band.filter((v) => v >= 0.92).length / Math.max(1, band.length)) };
    const c0 = fromB64(g0.N), c1 = fromB64(g1.N);
    const L = (img, k) => lumaStats(img, R[k]);
    const m = {
      calls: { start: g0.calls, walk2s: g1.calls, pathA: gA.calls, plaza: gP.calls }, tris: { start: g0.tris, pathA: gA.tris },
      sky: L(s0, 'sky').mean, archL: L(s0, 'archL').mean, archR: L(s0, 'archR').mean,
      archGlowPx: count(s0, R.archBox, isGlow), archLumenPx: count(s0, R.archBox, isLumen), archVioletPx: count(s0, R.archBox, isViolet),
      crystal: L(s0, 'crystal'), crystalLumenPx: count(s0, R.crystalCount, isLumen), crystalVioletPx: count(s0, R.crystalCount, isViolet), crystalGlowPx: count(s0, R.crystalCount, isGlow),
      crystalW2: L(s1, 'crystalW2'), crystalW2Px: count(s1, R.crystalW2Count, (r, g, b) => isLumen(r, g, b) || isViolet(r, g, b)),
      pathFar: L(s0, 'pathFar').mean, pathMid: L(s0, 'pathMid').mean, pathNear: L(s0, 'pathNear').mean, grass: L(s0, 'grass').mean,
      treeR: L(s0, 'treeR').mean, treeL: L(s0, 'treeL').mean, hair: L(s0, 'hair').mean, aboveHead: L(s0, 'aboveHead').mean,
      hairEdge,
      scarfPx: count(s0, R.scarfBox, scarf), scarfLuma: lumaStats(s0, R.scarfBox, scarf).mean,
      capTop: L(s0, 'capTop').mean, capBody: L(s0, 'capBody').mean, underPuff: r3((L(s0, 'underPuffL').mean + L(s0, 'underPuffR').mean) / 2), // path at the puffcap's depth, both flanks
      tentLit: L(s0, 'tentLit'), tentDoor: L(s0, 'tentDoor').mean,
      lanterns: g0.lanterns.map((b) => ({ box: b, ...lumaStats(s0, b) })),
      lanternWarm: g0.lanterns.map((b) => { let smax = 0, hmin = 360; const [x0, y0, x1, y1] = b; for (let y = Math.max(0, y0); y < Math.min(H, y1); y++) for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) { const i = (y * W + x) * 4, [h, s, v] = hsv(s0.d[i], s0.d[i + 1], s0.d[i + 2]); if (h >= 20 && h <= 60 && v > 0.55 && s > 0.3) { smax = Math.max(smax, s); hmin = Math.min(hmin, h); } } return { satMax: r3(smax), hueMin: hmin === 360 ? null : +hmin.toFixed(1) }; }),
      frameMean: frameMean(s0), frameMeanW2: frameMean(s1),
      roughR: rough(s1, R.ditherR), roughL: rough(s1, R.ditherL),
      o9: { startScene: count(c0, [0, 0, W, H], warnHue), walk2sScene: count(c1, [0, 0, W, H], warnHue), startScreen: count(s0, [0, 0, W, H], warnHue) },
      pathA: { setup: gotA, tele: gA.tele, ...edgeStats(gA, R.o8) }, plaza: { setup: gotP, tele: gP.tele, ...edgeStats(gP, null) },
    };
    m.pathMidNear = Math.max(m.pathMid, m.pathNear);
    // ---- rules
    const t = T[optName], cp90 = m.crystal.p90, puffDiff = Math.min(Math.abs(m.underPuff - m.capTop), Math.abs(m.underPuff - m.capBody));
    const lanternMax = Math.max(...m.lanterns.map((l) => l.mean ?? 0));
    const midGround = { pathFar: m.pathFar, pathMid: m.pathMid, pathNear: m.pathNear, tentMax: m.tentLit.max, lantern: lanternMax, puffcap: Math.max(m.capTop, m.capBody) };
    const archDiff = Math.min(Math.abs(m.sky - m.archL), Math.abs(m.sky - m.archR));
    const o = {
      O1: { pass: cp90 > m.pathMidNear + 0.08, v: `p90 ${cp90} vs path ${m.pathMidNear} (+${r3(cp90 - m.pathMidNear)})` },
      O2: { pass: Object.values(midGround).every((x) => cp90 >= x) && cp90 >= m.sky - 0.02, v: `p90 ${cp90} vs max mid/ground ${r3(Math.max(...Object.values(midGround)))} (${Object.entries(midGround).sort((a, b) => b[1] - a[1])[0][0]}), sky-0.02 ${r3(m.sky - 0.02)}` },
      O3: { pass: archDiff >= 0.12 && m.archGlowPx >= 12, v: `arch-sky ${r3(m.sky - m.archL)}/${r3(m.sky - m.archR)}, glow px ${m.archGlowPx}` },
      O4: { pass: optName === 'B' ? [m.pathFar, m.pathMid, m.pathNear].every((x) => x >= 0.67 && x <= 0.74) && m.pathFar >= m.pathNear : m.pathFar > m.pathNear + 0.03, v: `far ${m.pathFar} mid ${m.pathMid} near ${m.pathNear}` },
      O5: { pass: m.hair - m.aboveHead >= 0.10 || m.hairEdge.shareGE092 >= 0.5, v: `ROI ${m.hair} - path ${m.aboveHead} = ${r3(m.hair - m.aboveHead)} · top-edge ${m.hairEdge.px} px mean ${m.hairEdge.mean} (${r3(m.hairEdge.mean - m.aboveHead)} vs path), share >=0.92 ${m.hairEdge.shareGE092}` },
      O6: { pass: Math.max(m.treeR, m.treeL) <= Math.min(m.pathMid, m.pathNear, m.pathFar) - 0.25, v: `trees ${m.treeR}/${m.treeL} vs path-0.25 ${r3(Math.min(m.pathMid, m.pathNear, m.pathFar) - 0.25)}` },
      O7: { pass: puffDiff >= t.puff, v: `cap ${m.capTop} body ${m.capBody} vs path ${m.underPuff} (min diff ${r3(puffDiff)}, need ${t.puff})` },
      O8: { pass: (m.pathA.o8?.delta ?? 0) >= 0.10, v: `ring ${m.pathA.o8?.ringLuma} vs path under ${m.pathA.o8?.pathUnderLuma} (${m.pathA.o8?.delta}, ${m.pathA.o8?.px} px)` },
      O9: { pass: m.o9.startScene === 0 && m.o9.walk2sScene === 0 && m.pathA.o9WarmOutsideTelegraph === 0 && m.plaza.o9WarmOutsideTelegraph === 0, v: `scene px start ${m.o9.startScene} walk2s ${m.o9.walk2sScene} pathA ${m.pathA.o9WarmOutsideTelegraph} plaza ${m.plaza.o9WarmOutsideTelegraph} (screen incl. HUD ${m.o9.startScreen})` },
    };
    const extra = {
      crystalMean: { pass: m.crystal.mean >= t.crystalMean, v: `${m.crystal.mean} (need ${t.crystalMean})` },
      crystalP90: { pass: cp90 >= t.crystalP90, v: `${cp90} (need ${t.crystalP90})` },
      crystalPx: { pass: m.crystalLumenPx + m.crystalVioletPx >= 250, v: `${m.crystalLumenPx} lumen + ${m.crystalVioletPx} violet = ${m.crystalLumenPx + m.crystalVioletPx} (glow ${m.crystalGlowPx})` },
      crystalW2: { pass: m.crystalW2.p90 >= t.crystalP90 && m.crystalW2.mean >= t.crystalMean, v: `walk2s mean ${m.crystalW2.mean} p90 ${m.crystalW2.p90}, ${m.crystalW2Px} px` },
      tent: { pass: m.tentLit.max <= cp90 - 0.08, v: `tent max ${m.tentLit.max} vs crystal p90-0.08 ${r3(cp90 - 0.08)}` },
      scarf: { pass: m.scarfPx >= 470 && m.scarfPx <= 600, v: `${m.scarfPx} px luma ${m.scarfLuma}` },
      sky: { pass: m.sky >= t.sky[0] && m.sky <= t.sky[1], v: `${m.sky} in ${t.sky}` },
      pathFar: { pass: m.pathFar >= t.pathFar[0] && m.pathFar <= t.pathFar[1], v: `${m.pathFar} in ${t.pathFar}` },
      pathMidNear: { pass: [m.pathMid, m.pathNear].every((x) => x >= t.pathMidNear[0] && x <= t.pathMidNear[1]), v: `${m.pathMid}/${m.pathNear} in ${t.pathMidNear}` },
      grass: { pass: m.grass >= t.grass[0] && m.grass <= t.grass[1], v: `${m.grass} in ${t.grass}` },
      trees: { pass: [m.treeR, m.treeL].every((x) => x >= t.trees[0] && x <= t.trees[1]), v: `${m.treeR}/${m.treeL} in ${t.trees}` },
      frame: { pass: m.frameMean >= t.frame[0] && m.frameMean <= t.frame[1], v: `${m.frameMean} in ${t.frame}` },
      lantern: { pass: m.lanternWarm.every((l) => l.satMax <= 0.75 && (l.hueMin == null || l.hueMin >= 38)), v: m.lanternWarm.map((l) => `s ${l.satMax} h>=${l.hueMin}`).join(' · ') },
      dither: { pass: m.roughR <= 0.03 && m.roughL <= 0.03, v: `${m.roughR} / ${m.roughL}` },
      edgePathA: { pass: !!m.pathA.edgeMostVivid && (m.pathA.dE00mean ?? 99) < 10, v: `${m.pathA.meanHex} dE00 ${m.pathA.dE00mean} s ${m.pathA.sat} most vivid ${m.pathA.edgeMostVivid}` },
      edgePlaza: { pass: !!m.plaza.edgeMostVivid && (m.plaza.dE00mean ?? 99) < 10, v: `${m.plaza.meanHex} dE00 ${m.plaza.dE00mean} s ${m.plaza.sat} most vivid ${m.plaza.edgeMostVivid}` },
    };
    res.measure = m; res.rules = o; res.extra = extra; res.judgedAs = optName;
    console.log(`\n== ${tag} ${tier} (judged as ${optName}) calls start ${m.calls.start} walk ${m.calls.walk2s} pathA ${m.calls.pathA} plaza ${m.calls.plaza}`);
    for (const [k, r] of Object.entries(o)) console.log(`${k} ${r.pass ? 'PASS' : 'FAIL'}  ${r.v}`);
    for (const [k, r] of Object.entries(extra)) console.log(`  ${k.padEnd(12)} ${r.pass ? 'ok  ' : 'miss'}  ${r.v}`);
  }
} finally { await browser.close(); srv.close(); }
fs.writeFileSync(path.join(outDir, 'probe.json'), JSON.stringify(report, null, 1));
console.log(`done ${tag}: errors ${report.errors.length}${report.errors.length ? '\n' + report.errors.join('\n') : ''}`);
