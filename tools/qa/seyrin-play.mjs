// QA for Seyrin's P1 file in the dev playtest of `ninja-roam-1` (owner order 2026-11-28) and in the P1 pose viewer.
// Needs the vite dev server with the private inbox:  SYNES_SEYRIN_DIR=<inbox> npx vite --port 5181 --strictPort
// Usage: node tools/qa/seyrin-play.mjs [http://localhost:5181] [inboxDir] [screenshotDir]
// Screenshots show the private model: keep them out of git (default tools/qa/out/seyrin-play, which is ignored).
// Emulated Chromium + SwiftShader on a PC: not a phone result.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const base = process.argv[2] || 'http://localhost:5181';
const inbox = process.argv[3] || process.env.SYNES_SEYRIN_DIR || 'assets/_inbox';
const shots = process.argv[4] || 'tools/qa/out/seyrin-play';
const stem = 'char_hero001_ninja_preview_v01';
fs.mkdirSync(shots, { recursive: true });
const edge = process.env.SYNES_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });
const newPage = async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/status of 404/.test(m.text())) errors.push(m.text()); }); // no API on the vite server
  return { ctx, page, errors };
};

// ---- 1. the pose viewer with the real pair -------------------------------------------------------------------------------
{
  const { ctx, page, errors } = await newPage();
  await page.goto(`${base}/?seyrin=preview&offline`, { waitUntil: 'load' });
  await page.waitForSelector('#sp-glb', { timeout: 90000 });
  await page.setInputFiles('#sp-glb', path.join(inbox, `${stem}.glb`));
  await page.setInputFiles('#sp-manifest', path.join(inbox, `${stem}.manifest.json`));
  await page.click('#sp-load');
  await page.waitForFunction(() => window.__seyrinPreview.snapshot().loaded || /ไม่ผ่าน/.test(document.querySelector('#sp-state').textContent), null, { timeout: 60000 });
  const s = await page.evaluate(() => window.__seyrinPreview.snapshot());
  check('preview: the real pair is accepted and shown', s.loaded && s.accepted, `failed checks: ${s.failed.join(', ') || 'none'}`);
  for (const yaw of ['0', '180']) {
    await page.click(`[data-yaw="${yaw}"]`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(shots, `preview-idle-yaw${yaw}.png`) });
  }
  await page.click('[data-yaw="90"]');
  for (const clip of ['run', 'attack_01', 'attack_03', 'skill_shadow_thread', 'dodge_f']) {
    await page.click(`[data-clip="${clip}"]`);
    await page.click('#sp-pause');
    for (let i = 0; i < 6; i++) await page.click('#sp-next');
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(shots, `preview-${clip}.png`) });
    const now = await page.evaluate(() => window.__seyrinPreview.snapshot());
    check(`preview: ${clip} plays`, now.clip === clip && now.actions.includes(clip), `tick ${now.tick}`);
  }
  check('preview: no page errors', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// ---- 2. playing ninja-roam-1 as Seyrin ------------------------------------------------------------------------------------
const mem = (page) => page.evaluate(() => ({ ...window.__synes.view.renderer.info.memory, tick: window.__synes.world.tick }));
async function restarts(page, n) {
  for (let i = 0; i < n; i++) {
    await page.click('#btn-pause'); await page.click('#btn-restart');
    await page.waitForFunction(() => window.__synes.world.tick < 20, null, { timeout: 30000 });
    await page.waitForTimeout(700);
  }
}
let placeholderGrowth;
{ // what the level itself leaves behind per restart, with the placeholder (not Seyrin's)
  const { ctx, page } = await newPage();
  await page.goto(`${base}/?ruleset=ninja-roam-1&offline&autostart&seed=7&placeholder`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 90000 });
  await page.waitForTimeout(1500);
  const a = await mem(page); await restarts(page, 3); const b = await mem(page);
  placeholderGrowth = { geometries: b.geometries - a.geometries, textures: b.textures - a.textures };
  await ctx.close();
}
{
  const { ctx, page, errors } = await newPage();
  await page.goto(`${base}/?ruleset=ninja-roam-1&offline&autostart&seed=7`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 90000 });
  await page.waitForTimeout(600);
  const snap = () => page.evaluate(() => ({ ...window.__seyrinHero?.snapshot(), label: document.querySelector('#ninja-qa')?.textContent, tick: window.__synes.world.tick }));
  let s = await snap();
  check('play: Seyrin is on the player (not the placeholder)', !!s.attached && s.live === 1, s.label);
  await page.screenshot({ path: path.join(shots, 'play-idle.png') });
  await page.keyboard.down('KeyW'); await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(shots, 'play-run.png') });
  await page.keyboard.up('KeyW');
  await page.keyboard.press('KeyJ'); await page.waitForTimeout(170);
  await page.screenshot({ path: path.join(shots, 'play-attack.png') });
  await page.waitForTimeout(600);
  await page.keyboard.press('Space'); await page.waitForTimeout(130);
  await page.screenshot({ path: path.join(shots, 'play-dodge.png') });
  await page.waitForTimeout(800);
  const base0 = await snap();
  // new rounds must not pile up instances, geometries or textures
  await restarts(page, 3);
  s = await snap();
  check('play: three restarts keep one live instance', s.live === 1 && s.attached, `live ${s.live}`);
  const grow = { geometries: s.geometries - base0.geometries, textures: s.textures - base0.textures };
  check('play: over three restarts Seyrin adds no geometries / textures beyond what the level leaves with the placeholder', grow.geometries <= placeholderGrowth.geometries && grow.textures <= placeholderGrowth.textures, `Seyrin +${grow.geometries} geo +${grow.textures} tex · placeholder +${placeholderGrowth.geometries} geo +${placeholderGrowth.textures} tex`);
  console.log('stand-ins used:', s.standIns.join(', ') || 'none', '· label:', s.label);
  check('play: no page errors', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
}
await browser.close();
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
process.exit(results.every(Boolean) ? 0 : 1);
