// QA for the public Seyrin test build (SYNES_SEYRIN_PUBLIC=1): the crab pair shipped next to the page is loaded and shown in the
// boss fight, and when the pair cannot be had the fight goes on with Prismback and no page error.
// Build + serve first (the folder holds the private files: keep it out of git, never publish it from here):
//   SYNES_SEYRIN_PUBLIC=1 SYNES_SEYRIN_DIR=<inbox> npx vite build --outDir <dir> --emptyOutDir
//   npx vite preview --outDir <dir> --port 5183 --strictPort
// Usage: node tools/qa/crab-public.mjs [http://localhost:5183] [screenshotDir]
// Emulated Chromium + SwiftShader on a PC: not a phone result.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const base = process.argv[2] || 'http://localhost:5183';
const shots = process.argv[3] || 'tools/qa/out/crab-public';
fs.mkdirSync(shots, { recursive: true });
const edge = process.env.SYNES_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });

for (const mode of ['crab', 'no-file', 'slow-file']) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  const page = await ctx.newPage(), errors = [], asked = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => { if (r.url().includes('seyrin-boss/')) asked.push(r.url().split('/').slice(-2).join('/')); });
  if (mode === 'no-file') await page.route('**/seyrin-boss/**', (r) => r.fulfill({ status: 404, body: 'gone' }));
  if (mode === 'slow-file') await page.route('**/seyrin-boss/boss.glb', async (r) => { await new Promise((ok) => setTimeout(ok, 6000)); await r.continue(); });
  await page.goto(`${base}/?offline&seed=7&start=boss`, { waitUntil: 'load' });
  // press Start by hand: with a slow file the run begins before the crab is there
  await page.waitForSelector('#btn-start', { state: 'visible', timeout: 60000 }).catch(() => {});
  await page.click('#btn-start').catch(() => {});
  const crab = () => page.evaluate(() => window.__crabBoss?.snapshot?.() ?? null);
  const canvasOk = () => page.evaluate(() => { const c = document.querySelector('canvas'); return !!c && c.width > 0; });
  if (mode === 'crab') {
    await page.waitForFunction(() => window.__crabBoss?.snapshot?.().attached, null, { timeout: 60000 }).catch(() => {});
    const s = await crab();
    check('public build: the crab pair is asked for next to the page', asked.includes('seyrin-boss/boss.glb') && asked.includes('seyrin-boss/boss.manifest.json'), asked.join(', '));
    check('public build: loaded, accepted by the checker and attached to the boss', !!s && s.loaded && s.accepted && s.attached, s ? `clips ${s.stats?.clips?.length} · tris ${s.stats?.tris}` : 'no crab');
    await page.waitForTimeout(2500);
  } else if (mode === 'no-file') {
    await page.waitForTimeout(5000);
    const s = await crab();
    check('no file: the game runs with Prismback', (await canvasOk()) && (!s || s.loaded === false), JSON.stringify(s));
  } else {
    await page.waitForTimeout(2500);
    const before = await crab();
    check('slow file: the run has begun without the crab', (await canvasOk()) && !before?.attached, JSON.stringify(before && { loaded: before.loaded, attached: before.attached }));
    await page.waitForFunction(() => window.__crabBoss?.snapshot?.().attached, null, { timeout: 60000 }).catch(() => {});
    const s = await crab();
    check('slow file: the crab joins the run that is already going', !!s && s.attached && s.live === 1, s ? `live ${s.live}` : 'never attached');
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: path.join(shots, `${mode}.png`) });
  check(`${mode}: no page errors`, errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}
await browser.close();
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
process.exit(results.every(Boolean) ? 0 : 1);
