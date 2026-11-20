// DES-004 step 1 (arena light + atmosphere) QA: before/after frames at the same tick, grayscale copies, value samples,
// warm-colour check, Thai HUD checks and renderer.info per tier.
//   node tools/qa/atmos-shots.mjs [outDir]          (builds are served from dist/ by server/index.ts; run `vite build` first)
// "before" = ?atmos=0 (same build, step 1 switched off); "after" = default.
import fs from 'node:fs'; import path from 'node:path';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';
import { server } from '../../server/index.ts';

const outDir = process.argv[2] || 'docs/qa/des004-step1';
fs.mkdirSync(outDir, { recursive: true });
const port = Number(process.env.SYNES_QA_PORT || 18751);
await new Promise((r) => server.listen(port, '127.0.0.1', r));
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });
const report = { shots: [], perf: [], errors: [] };

async function open(size, q, atmos) {
  const [width, height, mobile] = size;
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => report.errors.push(`${width} ${atmos}: ${e.message}`));
  await page.goto(`http://127.0.0.1:${port}/?offline&seed=1&start=boss&q=${q}&autostart&qafreeze${atmos ? '' : '&atmos=0'}`);
  await page.waitForFunction(() => window.__synes?.state === 'playing');
  // same setup as tools/qa/out/prismatic-preview.mjs: player in front of the boss, run until the fight starts
  await page.evaluate(() => {
    const { world } = window.__synes; const { player, boss } = world;
    player.x = boss.x; player.z = boss.z + 6.7; player.fx = 0; player.fz = -1;
    for (let i = 0; i < 48; i++) { window.__synesQA.stepTicks(1); if (world.tele.some((t) => t.owner === boss.id)) break; }
  });
  return { ctx, page };
}

/** Grayscale copy + value samples + warm-colour stats, computed in the page from the PNG bytes. */
async function analyse(page, png, file) {
  const probes = await page.evaluate(() => {
    const { view, world } = window.__synes; const out = { x: 0, y: 0, vis: false };
    const p = (x, y, z) => { view.project(x, y, z, out); return { x: out.x, y: out.y, vis: out.vis }; };
    const A = { x: -2, z: -76 };
    return {
      shrineCrystal: p(A.x, 3.65, A.z - 14.0), crystalL: p(A.x - 8.8, 2.9, A.z - 12.4), crystalR: p(A.x + 8.8, 2.9, A.z - 12.4),
      floorNearPlayer: p(world.player.x + 1.4, 0, world.player.z - 1.2), floorMid: p(A.x + 3, 0, A.z + 1),
      dpr: window.devicePixelRatio, atmosW: view.atmosW,
    };
  });
  const res = await page.evaluate(async ({ b64, probes }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height); const px = d.data;
    let warmVivid = 0; const goldSat = [];
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i] / 255, gg = px[i + 1] / 255, b = px[i + 2] / 255;
      const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), v = mx, s = mx ? (mx - mn) / mx : 0;
      let h = 0; if (mx !== mn) { h = mx === r ? ((gg - b) / (mx - mn)) % 6 : mx === gg ? (b - r) / (mx - mn) + 2 : (r - gg) / (mx - mn) + 4; h *= 60; if (h < 0) h += 360; }
      if ((h >= 340 || h < 38) && s > 0.7 && v > 0.55) warmVivid++;
      if (h >= 38 && h < 62 && v > 0.6) goldSat.push(s);
      const l = 0.2126 * r + 0.7152 * gg + 0.0722 * b; px[i] = px[i + 1] = px[i + 2] = l * 255;
    }
    goldSat.sort((a, b) => a - b);
    const luma = (pt) => {
      if (!pt.vis) return null; const cx = Math.round(pt.x * probes.dpr), cy = Math.round(pt.y * probes.dpr); let sum = 0, n = 0;
      for (let y = cy - 6; y <= cy + 6; y++) for (let x = cx - 6; x <= cx + 6; x++) { if (x < 0 || y < 0 || x >= c.width || y >= c.height) continue; sum += px[(y * c.width + x) * 4]; n++; }
      return n ? +(sum / n / 255).toFixed(3) : null;
    };
    // top 12% of the frame = far background / sky
    let top = 0, tn = 0; for (let y = 0; y < c.height * 0.12; y += 2) for (let x = 0; x < c.width; x += 4) { top += px[(y * c.width + x) * 4]; tn++; }
    g.putImageData(d, 0, 0);
    return {
      gray: c.toDataURL('image/png').split(',')[1], warmVivid, goldSatP99: goldSat.length ? +goldSat[Math.floor(goldSat.length * 0.99)].toFixed(3) : null,
      luma: { shrineCrystal: luma(probes.shrineCrystal), crystalL: luma(probes.crystalL), crystalR: luma(probes.crystalR), floorNearPlayer: luma(probes.floorNearPlayer), floorMid: luma(probes.floorMid), skyTop: +(top / tn / 255).toFixed(3) },
    };
  }, { b64: png.toString('base64'), probes });
  fs.writeFileSync(file.replace(/\.png$/, '-gray.png'), Buffer.from(res.gray, 'base64'));
  return { atmosW: probes.atmosW, warmVivid: res.warmVivid, goldSatP99: res.goldSatP99, luma: res.luma };
}

async function hudCheck(page) {
  return page.evaluate(() => {
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(), cs = getComputedStyle(el); return { text: el.textContent.trim(), h: +b.height.toFixed(1), font: cs.fontSize, visible: b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' }; };
    const { view, world } = window.__synes; const o = { x: 0, y: 0, vis: false };
    view.actorScreenPos(world.boss.id, 2.2, o);
    const atBoss = document.elementFromPoint(o.x, o.y);
    const t = world.tele[0]; let atTele = null;
    if (t) { view.project(t.x, 0.06, t.z, o); const el = document.elementFromPoint(o.x, o.y); atTele = el ? (el.id || el.tagName) : null; }
    return { bossName: r(document.getElementById('boss-name')), hp: r(document.getElementById('hp-text')), lock: r(document.querySelector('#btn-ult .lbl')),
      elementAtBoss: atBoss ? (atBoss.id || atBoss.tagName) : null, elementAtTelegraph: atTele };
  });
}

const SIZES = [[1672, 941, false], [844, 390, true]];
try {
  for (const size of SIZES) for (const atk of ['slam', 'sweep', 'charge']) for (const atmos of [false, true]) {
    const { ctx, page } = await open(size, 'high', atmos);
    const tag = `${atmos ? 'after' : 'before'}-${size[0]}`;
    if (atk === 'slam') { // opening frame once per size/variant
      await page.waitForTimeout(450);
      await page.evaluate(() => { document.getElementById('banner').className = ''; document.getElementById('hint').className = ''; });
      const file = path.join(outDir, `${tag}-open.png`); const png = await page.screenshot({ path: file });
      report.shots.push({ file, ...(await analyse(page, png, file)) });
    }
    const got = await page.evaluate((atk) => {
      const { world } = window.__synes; world.bossNext = atk;
      for (let i = 0; i < 120 && world.tele.length === 0; i++) window.__synesQA.stepTicks(1);
      window.__synesQA.stepTicks(12);
      document.getElementById('banner').hidden = true; document.getElementById('hint').hidden = true;
      return { atk: world.tele.find((t) => t.owner === world.boss.id)?.atk.id, tick: world.tick };
    }, atk);
    await page.waitForTimeout(350);
    const file = path.join(outDir, `${tag}-${atk}.png`); const png = await page.screenshot({ path: file });
    report.shots.push({ file, telegraph: got.atk, tick: got.tick, ...(await analyse(page, png, file)), hud: await hudCheck(page) });
    await ctx.close();
  }
  for (const q of ['low', 'medium', 'high']) for (const atmos of [false, true]) {
    const { ctx, page } = await open([844, 390, true], q, atmos);
    await page.waitForTimeout(600);
    const info = await page.evaluate(() => { const i = window.__synes.view.renderer.info.render; return { calls: i.calls, tris: i.triangles }; });
    report.perf.push({ tier: q, atmos, ...info });
    await ctx.close();
  }
} finally {
  await browser.close(); server.close();
}
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
