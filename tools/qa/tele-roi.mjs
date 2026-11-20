// DES-006 §2 telegraph colour QA: ROI of the telegraph EDGE only (not whole-screen pixel counts), same frames as
// tools/qa/stage1-shots.mjs (seed 1, ?q=<tier>&autostart&qafreeze, boss telegraph + 12 ticks, tick 80).
//   node tools/qa/tele-roi.mjs [outDir] [--dist dir] [--tag name] [--only circle,fan,dash,circle-vfx] [--tiers low,medium] [--sizes 844,1672]
// circle-vfx = the slam frame 14 ticks later with Chime Burst (skill 1) crossing the slam edge: "edge over VFX" stats.
// Serves <dist> (default dist/) in-process. For every shot, five renders of the SAME state are read back with gl.readPixels
// (canvas only, no DOM HUD), right after the frame the game itself drew:
//   N = normal · N0 = renderOrder > 10 hidden · H = telegraphs hidden · H2 = telegraphs + VFX hidden · M = edge mask (all else hidden, telegraph
//   meshes drawn with a QA-only mask shader that marks pixels whose centre lies in the opaque core of the thin edge band:
//   circle/cone arc d >= 0.97, cone sides ang <= 0.01 (d >= inner), line sides |x| >= 0.96, line ends v <= 0.004 | v >= 0.996;
//   floor under the boss body (distance < boss r = 1.9 m) is left out: the sim keeps the player >= r + 0.42 m away).
// ROI = mask pixels where N differs from H and N equals N0 (N0 = objects drawn after the telegraph hidden: the hero, its foot
// marker and stun stars cover the warning on purpose, ADR-005; those pixels drop out). Reported per shot: mean RGB / circular-mean hue / mean S, V (HSV) / mean CIEDE2000 and RGB distance to
// the target hex, share of ROI pixels with dE00 < 10, the colour beneath the edge (H), the grayscale read (Rec.709 luma of edge vs
// beneath, WCAG contrast ratio), ROI split by what is beneath (floor / crystal-or-glow / dark) and over VFX, the boss-face ROI and the "most saturated
// warm pixel" check (scene canvas, and the screenshot incl. HUD). The mask shader is the same for every build (it only reads
// uShape/uCos/uInner/vUv), so "before" and "after" are measured identically. Draw calls are read from the game's own frame
// (renderer.info) before the QA renders. LIMITS: Chromium + SwiftShader (software GPU), not a real phone.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const valued = new Set(['--tag', '--only', '--dist', '--tiers', '--sizes']);
const pos = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
const outDir = pos[0] || 'tools/qa/out/tele-roi';
const tag = opt('tag', 'run');
const distDir = path.resolve(opt('dist', 'dist'));
const ONLY = opt('only', 'circle,fan,dash').split(',');
const TIERS = opt('tiers', 'low,medium').split(',');
const SIZES = opt('sizes', '844,1672').split(',').map((s) => (s === '844' ? [844, 390] : [1672, 941]));
const SEED = 1;
const ATK = { circle: 'slam', fan: 'sweep', dash: 'charge', 'circle-vfx': 'slam' }; // circle-vfx: slam + Chime Burst VFX over its edge
const TARGET = { slam: [255, 51, 85], charge: [255, 51, 85], sweep: [255, 122, 26] }; // HEAVY (slam, charge) = #FF3355, normal = #FF7A1A
fs.mkdirSync(outDir, { recursive: true });

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(distDir, p);
  if (!f.startsWith(distDir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' }); res.end(fs.readFileSync(f));
});
const port = Number(process.env.SYNES_QA_PORT || 18753);
await new Promise((r) => srv.listen(port, '127.0.0.1', r));
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const report = { tag, dist: path.relative(process.cwd(), distDir) || distDir, seed: SEED, generatedAt: new Date().toISOString(), note: 'Chromium headless + SwiftShader, not a real device', shots: [], errors: [] };

async function open(size, tier) {
  const [width, height] = size, mobile = width < 1000;
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => report.errors.push(`${width} ${tier}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') report.errors.push(`console ${width} ${tier}: ${m.text()}`); });
  await page.goto(`${base}/?offline&seed=${SEED}&q=${tier}&autostart&qafreeze&start=boss`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__synes?.state === 'playing' && window.__synes.world, null, { timeout: 60000 });
  await page.evaluate(() => window.__synesQA.stepTicks(0));
  return { ctx, page };
}

/** In-page: N / N0 / H / H2 / M renders of the current state (all read back synchronously, before the first await) + statistics.
 *  shot = the page screenshot (PNG base64, DOM HUD included) of the same frame. */
async function measure({ target, atk, shot }) {
  const { view, world } = window.__synes, r = view.renderer, gl = r.getContext(), scene = view.scene, cam = view.camera;
  const calls = r.info.render.calls, tris = r.info.render.triangles; // the game's own frame (read before the QA renders)
  const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
  const read = () => { const b = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b); return b; };
  const teles = [...view.teles.values()];
  const tv = teles.find((t) => t.t.owner === world.boss.id && t.t.atk.id === atk) || teles[0];
  r.render(scene, cam); const N = read();
  // N0: objects drawn after the telegraph (renderOrder > 10: hero 13, hero foot marker 12, stun stars 11) hidden; where N != N0
  // the edge is covered on purpose (ADR-005: the player is never hidden by a warning) and is not part of the ROI
  const later = []; scene.traverse((o) => { if ((o.isMesh || o.isPoints || o.isLine || o.isSprite) && o.visible && o.renderOrder > 10) { later.push(o); o.visible = false; } });
  r.render(scene, cam); const N0 = read();
  for (const o of later) o.visible = true;
  for (const t of teles) t.m.visible = false;
  r.render(scene, cam); const Hd = read();
  // VFX hidden too (particles, rings, skill meshes): pixels where H != H2 carry VFX under the telegraph
  const vfxObjs = [view.particles?.mesh, ...(view.rings?.items ?? []).map((it) => it.m), ...['chime', 'cres', 'crys'].map((k) => view.skillFx?.[k]?.mesh)].filter((o) => o && o.visible);
  for (const o of vfxObjs) o.visible = false;
  r.render(scene, cam); const H2 = read();
  for (const o of vfxObjs) o.visible = true;
  // mask render
  const hidden = []; scene.traverse((o) => { if ((o.isMesh || o.isPoints || o.isLine || o.isSprite) && o.visible && !teles.some((t) => t.m === o)) { hidden.push(o); o.visible = false; } });
  const bg = scene.background, fog = scene.fog; scene.background = new bg.constructor(0x000000); scene.fog = null;
  const SM = tv.mat.constructor, masks = [], bv = view.actors.get(world.boss.id), bp = bv.root.position;
  for (const t of teles) {
    const u = t.mat.uniforms;
    const mm = new SM({ depthTest: false, depthWrite: false, transparent: false, side: t.mat.side,
      uniforms: { uShape: { value: u.uShape.value }, uCos: { value: u.uCos.value }, uInner: { value: u.uInner.value }, uBx: { value: bp.x }, uBz: { value: bp.z }, uBr: { value: world.boss.r } },
      vertexShader: 'varying vec2 vUv; varying vec2 vWp; void main(){ vUv = uv; vWp = (modelMatrix * vec4(position,1.0)).xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform float uShape; uniform float uCos; uniform float uInner; uniform float uBx; uniform float uBz; uniform float uBr; varying vec2 vUv; varying vec2 vWp;
        void main(){
          if (distance(vWp, vec2(uBx, uBz)) < uBr) discard; // floor under the boss body: nobody can stand there (sim keeps the player >= r + 0.42 away)
          float arc = 0.0, side = 0.0, endc = 0.0;
          if (uShape < 0.5) { vec2 p = vUv * 2.0 - 1.0; float d = length(p); if (d > 1.0) discard; arc = step(0.97, d); }
          else if (uShape < 1.5) { vec2 p = vUv * 2.0 - 1.0; float d = length(p); if (d > 1.0) discard; float c = d > 0.001 ? p.y / d : 1.0;
            if (c < uCos && d > uInner) discard; if (c < uCos) discard; // inner disc outside the cone: not part of the outer outline
            float ang = (c - uCos) / max(0.0001, 1.0 - uCos); arc = step(0.97, d); side = (1.0 - step(0.01, ang)) * step(uInner, d) * (1.0 - arc); }
          else { float sx = abs(vUv.x - 0.5) * 2.0; side = step(0.96, sx); endc = max(1.0 - step(0.004, vUv.y), step(0.996, vUv.y)) * (1.0 - side); }
          if (arc + side + endc < 0.5) discard;
          gl_FragColor = vec4(arc, side, endc, 1.0);
        }` });
    masks.push([t, t.mat, mm]); t.m.material = mm; t.m.visible = true;
  }
  r.render(scene, cam); const M = read();
  for (const [t, orig, mm] of masks) { t.m.material = orig; mm.dispose(); }
  for (const o of hidden) o.visible = true; scene.background = bg; scene.fog = fog;
  r.render(scene, cam); // canvas shows the normal frame again (identical state)

  // ---- colour helpers
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lab = (R, G, B) => { const r_ = lin(R), g_ = lin(G), b_ = lin(B);
    let x = (0.4124564 * r_ + 0.3575761 * g_ + 0.1804375 * b_) / 0.95047, y = 0.2126729 * r_ + 0.7151522 * g_ + 0.072175 * b_, z = (0.0193339 * r_ + 0.119192 * g_ + 0.9503041 * b_) / 1.08883;
    const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116); x = f(x); y = f(y); z = f(z);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)]; };
  const de00 = (l1, l2) => { // CIEDE2000
    const [L1, a1, b1] = l1, [L2, a2, b2] = l2, rad = Math.PI / 180;
    const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2, G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
    const a1p = a1 * (1 + G), a2p = a2 * (1 + G), C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
    const h = (b, a) => { if (!b && !a) return 0; const v = Math.atan2(b, a) / rad; return v < 0 ? v + 360 : v; };
    const h1p = h(b1, a1p), h2p = h(b2, a2p), dLp = L2 - L1, dCp = C2p - C1p;
    let dhp = 0; if (C1p * C2p) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp / 2 * rad), Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
    let hbp = h1p + h2p; if (C1p * C2p) { if (Math.abs(h1p - h2p) > 180) hbp += h1p + h2p < 360 ? 360 : -360; hbp /= 2; }
    const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
    const dth = 30 * Math.exp(-(((hbp - 275) / 25) ** 2)), RC = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
    const SL = 1 + 0.015 * (Lbp - 50) ** 2 / Math.sqrt(20 + (Lbp - 50) ** 2), SC = 1 + 0.045 * Cbp, SH = 1 + 0.015 * Cbp * T, RT = -Math.sin(2 * dth * rad) * RC;
    return Math.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2 + RT * (dCp / SC) * (dHp / SH)); };
  const hsv = (R, G, B) => { const r_ = R / 255, g_ = G / 255, b_ = B / 255, mx = Math.max(r_, g_, b_), mn = Math.min(r_, g_, b_), d = mx - mn;
    let h = 0; if (d) { h = mx === r_ ? ((g_ - b_) / d) % 6 : mx === g_ ? (b_ - r_) / d + 2 : (r_ - g_) / d + 4; h *= 60; if (h < 0) h += 360; }
    return [h, mx ? d / mx : 0, mx]; };
  const isWarm = (h) => h >= 320 || h < 50; // red, pink-red, orange, amber (gold #FFC857 = 41 deg is included on purpose)
  const tLab = lab(...target);

  // ---- ROI stats (rows from readPixels are bottom-up; convert to top-down y for screen positions)
  const acc = () => ({ n: 0, r: 0, g: 0, b: 0, hx: 0, hy: 0, s: 0, v: 0, de: 0, rgbd: 0, close: 0, under: [0, 0, 0], des: [], lE: 0, lU: 0, cr: 0 });
  // grayscale read: Rec.709 luma of the sRGB values (same formula as the -gray.png images) and WCAG contrast ratio (linear luminance)
  const luma = (R, G, B) => (0.2126 * R + 0.7152 * G + 0.0722 * B) / 255;
  const relL = (R, G, B) => 0.2126 * lin(R) + 0.7152 * lin(G) + 0.0722 * lin(B);
  const groups = { all: acc(), arc: acc(), side: acc(), end: acc(), overFloor: acc(), overCrystalGlow: acc(), overDark: acc(), overVfx: acc() };
  const roi = new Uint8Array(W * H); let maskN = 0, hidByLater = 0;
  for (let i = 0, p = 0; p < W * H; p++, i += 4) {
    if (!(M[i] > 127 || M[i + 1] > 127 || M[i + 2] > 127)) continue;
    maskN++;
    if (Math.abs(N[i] - Hd[i]) + Math.abs(N[i + 1] - Hd[i + 1]) + Math.abs(N[i + 2] - Hd[i + 2]) <= 3 ||
        Math.abs(N[i] - N0[i]) + Math.abs(N[i + 1] - N0[i + 1]) + Math.abs(N[i + 2] - N0[i + 2]) > 3) { hidByLater++; continue; }
    roi[p] = 1;
    const R = N[i], G = N[i + 1], B = N[i + 2], [h, s, v] = hsv(R, G, B), d = de00(lab(R, G, B), tLab), rd = Math.hypot(R - target[0], G - target[1], B - target[2]);
    // what is beneath the edge (H = same frame without telegraphs): bright cyan/blue/violet = crystal or its glow, V < 0.3 = boss/dark
    const [hb, sb, vb] = hsv(Hd[i], Hd[i + 1], Hd[i + 2]);
    const below = hb >= 160 && hb <= 290 && sb > 0.3 && vb > 0.45 ? 'overCrystalGlow' : vb < 0.3 ? 'overDark' : 'overFloor';
    const vfxBelow = Math.abs(Hd[i] - H2[i]) + Math.abs(Hd[i + 1] - H2[i + 1]) + Math.abs(Hd[i + 2] - H2[i + 2]) > 6;
    for (const k of ['all', M[i] > 127 ? 'arc' : M[i + 1] > 127 ? 'side' : 'end', below, ...(vfxBelow ? ['overVfx'] : [])]) {
      const a = groups[k]; a.n++; a.r += R; a.g += G; a.b += B; a.hx += Math.cos(h * Math.PI / 180) * s; a.hy += Math.sin(h * Math.PI / 180) * s; a.s += s; a.v += v; a.de += d; a.rgbd += rd; if (d < 10) a.close++;
      a.under[0] += Hd[i]; a.under[1] += Hd[i + 1]; a.under[2] += Hd[i + 2]; a.des.push(d);
      a.lE += luma(R, G, B); a.lU += luma(Hd[i], Hd[i + 1], Hd[i + 2]);
      { const l1 = relL(R, G, B), l2 = relL(Hd[i], Hd[i + 1], Hd[i + 2]); a.cr += (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
    }
  }
  const fin = (a) => {
    if (!a.n) return null; const n = a.n, mean = [a.r / n, a.g / n, a.b / n].map((x) => Math.round(x)); let hue = Math.atan2(a.hy, a.hx) * 180 / Math.PI; if (hue < 0) hue += 360;
    a.des.sort((x, y) => x - y);
    return { n, meanRGB: mean, meanHex: '#' + mean.map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase(), hue: +hue.toFixed(1), sat: +(a.s / n).toFixed(3), val: +(a.v / n).toFixed(3),
      dE00mean: +(a.de / n).toFixed(1), dE00median: +a.des[n >> 1].toFixed(1), dE00ofMean: +de00(lab(...mean), tLab).toFixed(1), rgbDist: +(a.rgbd / n).toFixed(1), shareDE10: +(a.close / n).toFixed(3),
      underRGB: a.under.map((x) => Math.round(x / n)), grayEdge: +(a.lE / n).toFixed(3), grayUnder: +(a.lU / n).toFixed(3), grayDelta: +((a.lE - a.lU) / n).toFixed(3), wcagContrast: +(a.cr / n).toFixed(2) };
  };
  const out = { calls, tris, W, H, target: '#' + target.map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase(), maskPx: maskN, hiddenByLaterPx: hidByLater, roi: {} };
  for (const k of Object.keys(groups)) out.roi[k] = fin(groups[k]);

  // ---- most saturated warm pixels in the 3D scene, telegraph footprint excluded (N vs H differ there).
  //      vividness = HSV S*V (= max-min, 0..1) and CIELAB chroma C*; warm = hue 320..50 deg with V > 0.35
  const chroma = (R, G, B) => { const [, a, b] = lab(R, G, B); return Math.hypot(a, b); };
  const roiSV = [], roiC = []; for (let p = 0, i = 0; p < W * H; p++, i += 4) if (roi[p]) { const [, s, v] = hsv(N[i], N[i + 1], N[i + 2]); roiSV.push(s * v); roiC.push(chroma(N[i], N[i + 1], N[i + 2])); }
  const other = [], otherC = []; let teleFoot = 0;
  for (let i = 0; i < N.length; i += 4) {
    if (Math.abs(N[i] - Hd[i]) + Math.abs(N[i + 1] - Hd[i + 1]) + Math.abs(N[i + 2] - Hd[i + 2]) > 3) { teleFoot++; continue; }
    const [h, s, v] = hsv(N[i], N[i + 1], N[i + 2]); if (isWarm(h) && v > 0.35) { other.push(s * v); otherC.push(chroma(N[i], N[i + 1], N[i + 2])); }
  }
  for (const a of [roiSV, roiC, other, otherC]) a.sort((x, y) => x - y);
  const q = (arr, k, f = 3) => (arr.length ? +arr[Math.min(arr.length - 1, Math.floor(arr.length * k))].toFixed(f) : null);
  out.vivid = { roiSVmedian: q(roiSV, 0.5), roiSVp10: q(roiSV, 0.1), roiCmedian: q(roiC, 0.5, 1), roiCp10: q(roiC, 0.1, 1),
    sceneWarmOtherN: other.length, sceneWarmOtherSVp99: q(other, 0.99), sceneWarmOtherSVmax: q(other, 1), sceneWarmOtherCp99: q(otherC, 0.99, 1), sceneWarmOtherCmax: q(otherC, 1, 1), telegraphFootprintPx: teleFoot };
  out.vivid.edgeMostVividInScene = out.vivid.roiSVmedian != null && (out.vivid.sceneWarmOtherSVmax ?? 0) < out.vivid.roiSVmedian && (out.vivid.sceneWarmOtherCmax ?? 0) < out.vivid.roiCmedian;

  // ---- boss face ROI: box around the projected head (kit: head ellipsoid centre 1.86 m forward, 1.1 m up, r 0.7/0.55;
  //      boss rendered at scale 1.05) = 2.0 m forward, 0.5-1.8 m high, +-0.8 m wide. N vs H (what the telegraph changes there).
  const o = { x: 0, y: 0, vis: false };
  const fl = Math.hypot(world.boss.fx, world.boss.fz) || 1, fx = world.boss.fx / fl, fz = world.boss.fz / fl;
  const bx = bv.root.position.x + fx * 2.0, bz = bv.root.position.z + fz * 2.0;
  view.project(bx, 1.8, bz, o); const top = o.y; view.project(bx, 0.5, bz, o); const bot = o.y, cx = o.x;
  view.project(bx + fz * 0.8, 1.15, bz - fx * 0.8, o); const half = Math.max(8, Math.abs(o.x - cx));
  let fn = 0, fchg = 0, fsum = 0, fedge = 0;
  for (let y = Math.max(0, Math.round(top)); y < Math.min(H, Math.round(bot)); y++) for (let x = Math.max(0, Math.round(cx - half)); x < Math.min(W, Math.round(cx + half)); x++) {
    const p = (H - 1 - y) * W + x, i = p * 4; fn++;
    const dd = Math.abs(N[i] - Hd[i]) + Math.abs(N[i + 1] - Hd[i + 1]) + Math.abs(N[i + 2] - Hd[i + 2]); fsum += dd / 3;
    if (dd > 3 * 24) fchg++; if (roi[p]) fedge++;
  }
  out.bossFace = { box: [Math.round(cx - half), Math.round(top), Math.round(2 * half), Math.round(bot - top)], px: fn, meanAbsDiff: +(fsum / Math.max(1, fn)).toFixed(1), shareChangedOver24: +(fchg / Math.max(1, fn)).toFixed(3), shareEdgePx: +(fedge / Math.max(1, fn)).toFixed(3) };
  out.tele = world.tele.map((t) => `${t.atk.id}:${t.shape}:${(1 - t.t / t.total).toFixed(2)}`); out.tick = world.tick;
  // ROI as a mask image for the README overlay (white = ROI)
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), id = g.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = (H - 1 - y) * W + x, j = (y * W + x) * 4; const k = roi[p] ? 255 : 0; id.data[j] = id.data[j + 1] = id.data[j + 2] = k; id.data[j + 3] = 255; }
  g.putImageData(id, 0, 0); out.maskPng = c.toDataURL('image/png').split(',')[1];

  // ---- the screenshot (DOM HUD included): grayscale copy (Rec.709 luma) + warm vividness outside the telegraph footprint,
  //      and the same for HUD pixels only (screenshot differs from the canvas readback by > 12 levels)
  const img = new Image(); img.src = 'data:image/png;base64,' + shot; await img.decode();
  const sc = document.createElement('canvas'); sc.width = img.width; sc.height = img.height;
  const sg = sc.getContext('2d', { willReadFrequently: true }); sg.drawImage(img, 0, 0);
  const sd = sg.getImageData(0, 0, sc.width, sc.height), px = sd.data, same = sc.width === W && sc.height === H;
  const scr = [], scrC = [], hud = [], hudC = [];
  for (let y = 0; y < sc.height; y++) for (let x = 0; x < sc.width; x++) {
    const j = (y * sc.width + x) * 4, R = px[j], G = px[j + 1], B = px[j + 2];
    let foot = false, isHud = false;
    if (same) { const i = ((H - 1 - y) * W + x) * 4; foot = Math.abs(N[i] - Hd[i]) + Math.abs(N[i + 1] - Hd[i + 1]) + Math.abs(N[i + 2] - Hd[i + 2]) > 3;
      isHud = Math.abs(R - N[i]) + Math.abs(G - N[i + 1]) + Math.abs(B - N[i + 2]) > 36; }
    const [h, s, v] = hsv(R, G, B);
    if (!foot && isWarm(h) && v > 0.35) { scr.push(s * v); scrC.push(chroma(R, G, B)); if (isHud) { hud.push(s * v); hudC.push(chroma(R, G, B)); } }
    const l = Math.round(0.2126 * R + 0.7152 * G + 0.0722 * B); px[j] = px[j + 1] = px[j + 2] = l;
  }
  sg.putImageData(sd, 0, 0); out.grayPng = sc.toDataURL('image/png').split(',')[1];
  for (const a of [scr, scrC, hud, hudC]) a.sort((x, y) => x - y);
  out.screen = { warmOtherSVmax: q(scr, 1), warmOtherCmax: q(scrC, 1, 1), hudWarmSVmax: q(hud, 1), hudWarmCmax: q(hudC, 1, 1), hudWarmN: hud.length };
  out.screen.edgeMostVividOnScreen = out.vivid.roiSVmedian != null && (out.screen.warmOtherSVmax ?? 0) < out.vivid.roiSVmedian && (out.screen.warmOtherCmax ?? 0) < out.vivid.roiCmedian;
  return out;
}

try {
  for (const tier of TIERS) for (const size of SIZES) for (const sc of ONLY) {
    const atk = ATK[sc];
    const { ctx, page } = await open(size, tier);
    const got = await page.evaluate((atk) => { const { world } = window.__synes; const { player, boss } = world; player.x = boss.x; player.z = boss.z + 6.7; player.fx = 0; player.fz = -1;
      for (let i = 0; i < 60 && !world.bossStarted; i++) window.__synesQA.stepTicks(1, false);
      world.bossNext = atk; let n = 0; for (; n < 200 && !world.tele.some((t) => t.owner === world.boss.id && t.atk.id === atk); n++) window.__synesQA.stepTicks(1, false);
      window.__synesQA.stepTicks(12); return { n, atk: world.tele.find((t) => t.owner === world.boss.id)?.atk.id ?? null }; }, atk);
    if (sc === 'circle-vfx') { // Chime Burst ring (lumen/gold, 0.5 -> 3.6 m in 9 ticks from its hit tick 10) crosses the slam edge 2.1 m ahead
      await page.keyboard.press('Digit1');
      got.vfx = await page.evaluate(() => { window.__synesQA.stepTicks(14); const w = window.__synes.world; return { tick: w.tick, tele: w.tele.length, cast: w.ps.cast?.slot ?? null }; });
    }
    if (got.atk !== atk) report.errors.push(`${sc} ${tier} ${size[0]}: wanted ${atk}, got ${got.atk}`);
    await page.waitForTimeout(250);
    const name = `boss-${sc}-${size[0]}-${tier}`;
    const png = await page.screenshot({ path: path.join(outDir, name + '.png') });
    const m = await page.evaluate(measure, { target: TARGET[atk], atk, shot: png.toString('base64') });
    fs.writeFileSync(path.join(outDir, name + '-gray.png'), Buffer.from(m.grayPng, 'base64'));
    fs.writeFileSync(path.join(outDir, name + '-roimask.png'), Buffer.from(m.maskPng, 'base64'));
    delete m.maskPng; delete m.grayPng;
    const rec = { name, attack: atk, size: `${size[0]}x${size[1]}`, tier, setup: got, ...m };
    report.shots.push(rec);
    const a = rec.roi.all;
    console.log(`${name} calls ${rec.calls} roi ${a ? `${a.n}px ${a.meanHex} h${a.hue} s${a.sat} v${a.val} dE00 ${a.dE00mean} rgbd ${a.rgbDist}` : 'none'} vivid scene ${rec.vivid.edgeMostVividInScene} screen ${rec.screen.edgeMostVividOnScreen} (hud ${rec.screen.hudWarmSVmax}) face ${rec.bossFace.meanAbsDiff}`);
    await ctx.close();
  }
} finally { await browser.close(); srv.close(); }
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1));
console.log(`done: ${report.shots.length} shots, errors ${report.errors.length}`);
