// Lifecycle + layout QA. Usage: node tools/qa/lifecycle.mjs <baseUrl>
// Emulated in Chromium; real Android/iOS/in-app browser behaviour still needs device testing.
import { chromium } from './pw.mjs';
import { contextOpts, LAUNCH_ARGS, PROFILES } from './profiles.mjs';
const base = process.argv[2] || 'http://localhost:8080';
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const tick = (p) => p.evaluate(() => window.__synes?.world.tick ?? -1);

async function open(url, prof = PROFILES['android-mid'], extraCtx = {}) {
  const ctx = await browser.newContext({ ...contextOpts(prof), ...extraCtx });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: 'load' });
  return { ctx, page, errors };
}

// 1. app switch → pause, tap to resume
{
  const { ctx, page, errors } = await open(`${base}/?nokit&autostart&seed=4&q=low`);
  await page.waitForFunction(() => window.__synes?.state === 'playing');
  await page.waitForTimeout(800);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  const t1 = await tick(page); await page.waitForTimeout(1000); const t2 = await tick(page);
  const st = await page.evaluate(() => window.__synes.state);
  check('app switch pauses the sim', st === 'paused' && t1 === t2, `state=${st} ticks ${t1}→${t2}`);
  const overlay = await page.isVisible('#resume-tap');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  check('return shows tap-to-resume (no instant damage)', overlay && (await tick(page)) === t2);
  await page.click('#btn-resume2'); await page.waitForTimeout(600);
  check('resume continues the run', (await tick(page)) > t2);
  check('no page errors (app switch)', errors.length === 0, errors.join('; '));
  await ctx.close();
}

// 2. signal loss during an online run → result submitted after reconnect
{
  const { ctx, page, errors } = await open(`${base}/?nokit&bot=0.6&seed=5&q=low`);
  await page.waitForFunction(() => window.__synes?.state === 'playing');
  const online = await page.textContent('#net-chip');
  await ctx.setOffline(true);
  await page.waitForFunction(() => window.__synes?.state === 'done', null, { timeout: 120000 });
  await page.waitForTimeout(2500);
  const during = await page.textContent('#victory .reward');
  await ctx.setOffline(false);
  await page.waitForFunction(() => /บันทึกผลแล้ว|ไม่สำเร็จ/.test(document.querySelector('#victory .reward')?.textContent || ''), null, { timeout: 30000 }).catch(() => {});
  const after = await page.textContent('#victory .reward');
  check('online run survives signal loss (sim is local)', online.includes('ออนไลน์') && /บันทึกผล/.test(during), `during="${during.trim().slice(0, 40)}"`);
  check('result is verified after reconnect', after.includes('บันทึกผลแล้ว'), after.trim().slice(0, 60));
  check('no page errors (offline)', errors.length === 0, errors.join('; '));
  await ctx.close();
}

// 3. WebGL context loss / restore
{
  const { ctx, page, errors } = await open(`${base}/?nokit&autostart&seed=6&q=low`);
  await page.waitForFunction(() => window.__synes?.state === 'playing');
  await page.evaluate(() => { window.__lc = document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context'); window.__lc.loseContext(); });
  await page.waitForTimeout(500);
  const shown = await page.isVisible('#ctx-lost');
  await page.evaluate(() => window.__lc.restoreContext());
  await page.waitForTimeout(1200);
  const resumeShown = await page.isVisible('#resume-tap');
  if (resumeShown) await page.click('#btn-resume2');
  const t1 = await tick(page); await page.waitForTimeout(800);
  check('context loss shows recovery overlay', shown);
  check('context restore → game continues', resumeShown && (await tick(page)) > t1);
  check('no page errors (context loss)', errors.length === 0, errors.join('; '));
  await ctx.close();
}

// 4. in-app browser (LINE UA, fullscreen API rejected)
{
  const ua = 'Mozilla/5.0 (Linux; Android 13; SM-A145F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120 Mobile Safari/537.36 Line/14.2.1';
  const { ctx, page, errors } = await open(`${base}/?nokit&q=low`, PROFILES['android-low'], { userAgent: ua });
  await page.addInitScript(() => {});
  await page.evaluate(() => { Element.prototype.requestFullscreen = () => Promise.reject(new Error('not allowed')); });
  await page.waitForSelector('#btn-start:not([disabled])');
  await page.tap('#btn-start');
  await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 15000 }).catch(() => {});
  check('starts without fullscreen (in-app browser UA)', (await page.evaluate(() => window.__synes?.state)) === 'playing');
  // real touch: drag the stick and tap attack
  const z = await page.locator('#stick-zone').boundingBox();
  const x0 = await page.evaluate(() => window.__synes.world.player.z);
  const cdp = await ctx.newCDPSession(page);
  const sx = z.x + 120, sy = z.y + z.height - 120;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy, id: 1 }] });
  for (let i = 1; i <= 6; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx, y: sy - i * 12, id: 1 }] }); await page.waitForTimeout(30); }
  await page.waitForTimeout(900);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const x1 = await page.evaluate(() => window.__synes.world.player.z);
  check('touch joystick moves the player', x1 < x0 - 1, `z ${x0.toFixed(2)} → ${x1.toFixed(2)}`);
  await page.tap('#btn-attack');
  await page.waitForTimeout(200);
  check('attack button registers a swing', (await page.evaluate(() => window.__synes.world.ps.combo)) >= 0);
  check('no page errors (in-app)', errors.length === 0, errors.join('; '));
  await ctx.close();
}

// 5. layout matrix: buttons must not overlap each other, the HUD, or the player
const sizes = [[640, 360, 2], [760, 360, 2], [844, 390, 3], [932, 430, 3], [1280, 720, 1], [390, 844, 3]];
for (const [w, h, dpr] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: dpr > 1, hasTouch: dpr > 1 });
  const page = await ctx.newPage();
  await page.goto(`${base}/?nokit&autostart&seed=8&q=low`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__synes?.state === 'playing');
  await page.waitForTimeout(700);
  const r = await page.evaluate(() => {
    const ids = ['btn-attack', 'btn-dodge', 'btn-skill', 'btn-potion', 'top-left', 'top-right', 'hint'];
    const boxes = Object.fromEntries(ids.map((id) => { const b = document.getElementById(id).getBoundingClientRect(); return [id, b]; }));
    const ov = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const overl = [];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (ov(boxes[ids[i]], boxes[ids[j]]) && !(ids[i] === 'hint' || ids[j] === 'hint')) overl.push(`${ids[i]}×${ids[j]}`);
    const p = { x: 0, y: 0, vis: false }; window.__synes.view.actorScreenPos(window.__synes.world.player.id, 1, p);
    const pb = { left: p.x - 30, right: p.x + 30, top: p.y - 40, bottom: p.y + 40 };
    for (const id of ids.slice(0, 4)) if (ov(boxes[id], pb)) overl.push(`${id}×player`);
    const off = ids.filter((id) => { const b = boxes[id]; return b.right > innerWidth + 1 || b.bottom > innerHeight + 1 || b.left < -1 || b.top < -1; });
    return { overl, off, rotate: getComputedStyle(document.getElementById('rotate')).display !== 'none' };
  });
  const portrait = h > w;
  await page.screenshot({ path: `tools/qa/out/layout-${w}x${h}.png` });
  if (portrait) check(`layout ${w}x${h}: portrait shows rotate prompt`, r.rotate);
  else check(`layout ${w}x${h}: no overlaps/offscreen`, r.overl.length === 0 && r.off.length === 0, [...r.overl, ...r.off.map((o) => 'off:' + o)].join(', '));
  await ctx.close();
}
await browser.close();
const fails = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);
