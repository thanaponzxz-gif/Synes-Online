// QA for `ninja-roam-1` in the client, played by the registered Wayfarer placeholder (DES-009 §3; Seyrin's files are not in).
// Needs the vite dev server (npx vite --port 5173 --strictPort); with a second URL it also checks that a production build
// (npm run build && npm run server) ignores ?ruleset=ninja-roam-1.
// Usage: node tools/qa/ninja-placeholder.mjs [http://localhost:5173] [http://localhost:8080] [screenshotDir]
// Emulated Chromium + SwiftShader on a PC: not a phone result.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const dev = process.argv[2] || 'http://localhost:5173';
const prod = process.argv[3] || '';
const shots = process.argv[4] || '';
if (shots) fs.mkdirSync(shots, { recursive: true });
const edge = process.env.SYNES_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });
async function open(url) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), errors = [], requests = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => requests.push(r.url()));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 90000 });
  return { ctx, page, errors, requests };
}
const state = (page) => page.evaluate(() => {
  const w = window.__synes.world;
  return { ruleset: w.ruleset, sim: w.constructor.name, tick: w.tick, victory: w.victory, finished: w.finished, stats: w.stats, ns: w.ns ? { seq: w.ns.seq, meter: w.ns.meter, action: w.ns.action?.kind ?? null, potions: w.ns.potions } : null,
    label: document.querySelector('#ninja-qa')?.textContent ?? null };
});

// 1. the bot plays the ninja rules with the placeholder
{
  const { ctx, page, errors, requests } = await open(`${dev}/?ruleset=ninja-roam-1&bot=1`);
  let s = await state(page);
  check('dev server: ?ruleset=ninja-roam-1 runs the ninja sim', s.ruleset === 'ninja-roam-1' && s.sim === 'NinjaWorld', `${s.ruleset} ${s.sim}`);
  check('the screen says it is the placeholder, not passed as an asset', s.label === 'ninja-roam-1 · ตัวสำรอง Wayfarer · ยังไม่ผ่าน asset', s.label);
  if (shots) await page.screenshot({ path: path.join(shots, 'n0-start.png') });
  await page.waitForTimeout(25000);
  s = await state(page);
  check('25 s of bot play: actions, dodges and hits happen', s.ns.seq > 20 && s.stats.dodges > 0 && s.stats.hitsLanded > 5, JSON.stringify({ tick: s.tick, seq: s.ns.seq, ...s.stats }));
  if (shots) await page.screenshot({ path: path.join(shots, 'n1-bot-25s.png') });
  await page.waitForFunction(() => window.__synes.world.finished || window.__synes.world.tick > 30 * 150, null, { timeout: 240000 }).catch(() => {});
  s = await state(page);
  console.log(`INFO  bot run: ${s.victory ? 'victory' : 'no victory'} at tick ${s.tick} (wall clock, a SwiftShader frame rate decides how far it got)`);
  if (shots) await page.screenshot({ path: path.join(shots, 'n2-end.png') });
  check('no page errors', errors.length === 0, errors.slice(0, 3).join('; '));
  check('dev server is offline: no run API call', !requests.some((u) => /\/api\/run\//.test(u)));
  await ctx.close();
}

// 2. the ult button is a real command here (no "locked" message)
{
  const { ctx, page, errors } = await open(`${dev}/?ruleset=ninja-roam-1&autostart=1`);
  await page.evaluate(() => { window.__synes.world.ns.meter = 4; });
  await page.dispatchEvent('#btn-ult', 'pointerdown');
  await page.waitForTimeout(300);
  const s = await state(page), banner = await page.evaluate(() => document.body.innerText.includes('อัลติจะปลดล็อก'));
  check('the ult button starts lumen_loom and spends the meter', s.ns.meter === 0 && !banner, JSON.stringify({ meter: s.ns.meter, action: s.ns.action, banner }));
  check('no page errors (ult)', errors.length === 0, errors.slice(0, 3).join('; '));
  await ctx.close();
}

// 3. a production build never takes the flag
if (prod) {
  const { ctx, page, errors } = await open(`${prod}/?ruleset=ninja-roam-1&bot=1`);
  const s = await state(page);
  check('production build ignores ?ruleset=ninja-roam-1 (published default unchanged)', s.ruleset === 'roam-1' && s.ns === null && s.label === null, `${s.ruleset} ${s.sim} ${s.label}`);
  check('no page errors (production)', errors.length === 0, errors.slice(0, 3).join('; '));
  await ctx.close();
}
await browser.close();
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
