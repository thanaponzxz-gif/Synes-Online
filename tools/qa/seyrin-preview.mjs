// QA for the DES-009 P1 pose viewer, with the code-generated TEST fixture (a grey box on a bone chain — not Seyrin art).
// Needs the vite dev server:  npx vite --port 5173 --strictPort
// Usage: node tools/qa/seyrin-preview.mjs [http://localhost:5173] [screenshotDir]
// Emulated Chromium + SwiftShader on a PC: not a phone result, and frame times here mean nothing for devices.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';
import { buildFixtureGlb, buildFixtureManifest } from '../../tests/seyrinFixture.ts';

const base = process.argv[2] || 'http://localhost:5173';
const shots = process.argv[3] || '';
if (shots) fs.mkdirSync(shots, { recursive: true });
const edge = process.env.SYNES_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

async function pack(options, stage = options.stage ?? 'preview') {
  const glb = buildFixtureGlb(options);
  return { glb: Buffer.from(glb), manifest: Buffer.from(JSON.stringify(await buildFixtureManifest(glb, stage))) };
}
const good = await pack({});
const external = await pack({ externalImage: true });
const wrongManifest = { glb: good.glb, manifest: (await pack({ stage: 'full' })).manifest };

const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [], consoleErrors = [], requests = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('request', (r) => requests.push(r.url()));
await page.goto(`${base}/?seyrin=preview`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__seyrinPreview, null, { timeout: 60000 });
await page.waitForTimeout(1500);
const snap = () => page.evaluate(() => window.__seyrinPreview.snapshot());
const shot = async (name) => { if (shots) await page.screenshot({ path: path.join(shots, `${name}.png`) }); };
const files = async (p) => {
  await page.setInputFiles('#sp-glb', { name: 'fixture_box_hero001_test.glb', mimeType: 'model/gltf-binary', buffer: p.glb });
  await page.setInputFiles('#sp-manifest', { name: 'fixture_box_hero001_test.json', mimeType: 'application/json', buffer: p.manifest });
};
const load = async (p) => {
  await files(p);
  await page.click('#sp-load');
  await page.waitForFunction(() => !window.__seyrinPreview.snapshot().loading, null, { timeout: 60000 });
  await page.waitForTimeout(400);
};

check('banner says it is a preview, not a run', (await page.textContent('#sp-banner')) === 'ตัวอย่างเซย์ริน · ยังไม่ใช่รอบเล่น');
check('no game HUD or start button is usable', !(await page.isVisible('#hud')) && !(await page.isVisible('#btn-start')));
let s = await snap();
check('placeholder before any file', !s.loaded && s.holders === 0 && s.skinned === 0);
await shot('00-placeholder');

await load(good);
s = await snap();
check('fixture loads: one skinned model in the scene, one instance', s.loaded && s.accepted && s.holders === 1 && s.skinned === 1 && s.liveInstances === 1, JSON.stringify({ holders: s.holders, skinned: s.skinned, failed: s.failed }));
check('starts on idle with exactly one running action', s.clip === 'idle' && s.actions.join() === 'idle', s.actions.join());
check('no check failed for the fixture', s.failed.length === 0, s.failed.join());
console.log(`INFO  draw calls: placeholder ${s.callsPlaceholder}, with fixture ${s.calls}`);
await shot('01-idle');

for (const clip of ['run', 'attack_01', 'attack_03', 'skill_shadow_thread', 'dodge_f']) {
  await page.click(`#sp-clips button[data-clip="${clip}"]`);
  await page.waitForTimeout(120);
  s = await snap();
  check(`clip ${clip} plays alone`, s.clip === clip && s.actions.join() === clip, `${s.clip} [${s.actions}] tick ${s.tick}`);
}
await page.click('#sp-clips button[data-clip="attack_01"]');
await page.waitForTimeout(1500);
s = await snap();
check('a one-shot clip returns to idle', s.clip === 'idle' && s.actions.join() === 'idle', s.clip);

await page.click('#sp-clips button[data-clip="attack_03"]');
await page.click('#sp-pause');
for (let i = 0; i < 20; i++) await page.click('#sp-prev');
for (let i = 0; i < 6; i++) await page.click('#sp-next');
await page.waitForTimeout(300);
s = await snap();
check('tick stepping: attack_03 tick 6 shows the lift', s.tick === 6 && Math.abs(s.pelvisY - 0.92) < 0.002, `tick ${s.tick} pelvisY ${s.pelvisY}`);
await shot('02-attack03-t6');
for (let i = 0; i < 3; i++) await page.click('#sp-next');
await page.waitForTimeout(300);
s = await snap();
check('tick 9 (hit) is back on the ground', s.tick === 9 && Math.abs(s.pelvisY - 0.8) < 0.002, `tick ${s.tick} pelvisY ${s.pelvisY}`);
check('marker tick is highlighted', await page.evaluate(() => document.querySelector('#sp-time').classList.contains('marker')));
await page.waitForTimeout(700);
check('paused time does not move', (await snap()).tick === 9);

// hidden tab: the preview clock must not catch up
await page.click('#sp-pause');
await page.click('#sp-clips button[data-clip="run"]');
await page.click('#sp-pause');
const tBefore = (await snap()).tick;
await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
await page.click('#sp-pause', { force: true });
await page.waitForTimeout(900);
const tHidden = (await snap()).tick;
await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
check('nothing advances while the page reports hidden', tHidden === tBefore, `${tBefore} -> ${tHidden}`);
await page.click('#sp-clips button[data-clip="idle"]');

for (const [yaw, name] of [[0, 'front'], [90, 'side'], [180, 'back']]) {
  await page.click(`#sp-panel button[data-yaw="${yaw}"]`);
  await page.waitForTimeout(400);
  await shot(`03-yaw-${name}`);
}
await page.click('#sp-panel button[data-scale="1"]');
await page.waitForTimeout(300);
await shot('04-scale-1');
await page.click('#sp-panel button[data-scale="1.22"]');
await page.click('#sp-panel button[data-q="low"]');
await page.waitForTimeout(1500);
s = await snap();
check('quality Low rebuilds the scene and keeps exactly one model', s.loaded && s.holders === 1 && s.skinned === 1, `holders ${s.holders} skinned ${s.skinned}`);
await shot('05-low');
await page.click('#sp-panel button[data-q="medium"]');
await page.waitForTimeout(1500);
await page.click('#sp-toggle'); await page.waitForTimeout(200); await shot('06-panel-hidden'); await page.click('#sp-toggle');

// 20 rounds of load / switch / unload
const counts = [];
for (let i = 0; i < 20; i++) {
  await load(good);
  await page.click(`#sp-clips button[data-clip="${['run', 'attack_03', 'dodge_f'][i % 3]}"]`);
  await page.waitForTimeout(60);
  const a = await snap();
  await page.click('#sp-unload');
  await page.waitForTimeout(150);
  const b = await snap();
  counts.push({ a, b });
}
check('20 rounds: one model while loaded, none after unload', counts.every(({ a, b }) => a.holders === 1 && a.skinned === 1 && a.liveInstances === 1 && a.actions.length === 1 && b.holders === 0 && b.skinned === 0 && b.actions.length === 0 && !b.loaded));
const first = counts[1].b, lastRound = counts[19].b;
check('20 rounds: renderer geometry/texture counts do not grow', lastRound.geometries <= first.geometries && lastRound.textures <= first.textures, `geometries ${first.geometries} -> ${lastRound.geometries}, textures ${first.textures} -> ${lastRound.textures} (counts only, not a memory-leak proof)`);
check('20 rounds: still one panel', lastRound.uiRoots === 1);

// loading again while loaded, and two quick clicks
await load(good); await load(good);
await files(good); await page.click('#sp-load'); await page.click('#sp-load', { force: true });
await page.waitForFunction(() => !window.__seyrinPreview.snapshot().loading, null, { timeout: 60000 });
await page.waitForTimeout(500);
s = await snap();
check('reloading never stacks models', s.holders === 1 && s.skinned === 1 && s.liveInstances === 1, `holders ${s.holders} skinned ${s.skinned} live ${s.liveInstances}`);

for (const [name, p, id] of [['external texture URI', external, 'self-contained'], ['manifest of another file', wrongManifest, 'sha256']]) {
  await load(p);
  s = await snap();
  const text = await page.textContent('#sp-state');
  check(`${name} is refused and the placeholder stays, marked "ยังไม่ผ่าน asset"`, !s.loaded && s.holders === 0 && s.skinned === 0 && text.includes('ยังไม่ผ่าน asset') && s.failed.includes(id), `${text} [${s.failed}]`);
}
await shot('07-rejected');

check('the world was never stepped', (await snap()).worldTick === 0);
check('no run API call', !requests.some((u) => /\/api\/run\//.test(u)), requests.filter((u) => u.includes('/api/')).join(' '));
const outside = requests.filter((u) => !u.startsWith(base) && !/^(blob:|data:)/.test(u));
check('no request outside this dev server (external texture never fetched)', outside.length === 0 && !requests.some((u) => u.includes('tex_basecolor')), outside.slice(0, 3).join(' '));
check('no page errors', errors.length === 0, errors.join('; '));
if (consoleErrors.length) console.log('INFO  console errors:', consoleErrors.slice(0, 5).join(' | '));
await browser.close();
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
