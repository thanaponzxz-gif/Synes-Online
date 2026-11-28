// QA for the home Wi-Fi playtest of Seyrin (owner 2026-11-28): the dev server started with SYNES_SEYRIN_LAN=1, opened by this
// machine's LAN address (pass it as the argument; never write an address into the repo) in a phone-sized landscape touch screen.
// Usage: node tools/qa/seyrin-lan.mjs http://<lan-ip>:5181 [screenshotDir]   (http://localhost:5181 = the touch checks only)
// Emulated Chromium + SwiftShader on a PC: not a phone result, and not iOS Safari.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const base = process.argv[2];
if (!base) { console.error('usage: node tools/qa/seyrin-lan.mjs http://<lan-ip>:5181'); process.exit(2); }
const shots = process.argv[3] || 'tools/qa/out/seyrin-play';
fs.mkdirSync(shots, { recursive: true });
const edge = process.env.SYNES_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage(), errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${base}/?ruleset=ninja-roam-1&offline`, { waitUntil: 'load' });
const local = /\/\/(localhost|127\.0\.0\.1)[:/]/.test(base + '/'); // on localhost only the touch checks mean anything
if (!local) check('plain http by address is not a secure context (the hash runs in script)', await page.evaluate(() => !window.isSecureContext && !crypto.subtle));
await page.waitForFunction(() => !document.querySelector('#btn-start').disabled, null, { timeout: 90000 });
await page.tap('#btn-start');
await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 60000 });
await page.waitForTimeout(800);
const snap = () => page.evaluate(() => ({ ...window.__seyrinHero?.snapshot(), label: document.querySelector('#ninja-qa')?.textContent,
  ruleset: window.__synes.world.ruleset, action: window.__synes.world.ns?.action?.kind ?? null, meter: window.__synes.world.ns?.meter ?? null,
  ultLabel: document.querySelector('#btn-ult .lbl')?.textContent, ultLocked: document.querySelector('#btn-ult').classList.contains('locked'),
  x: window.__synes.world.player.x, z: window.__synes.world.player.z, portrait: document.querySelector('#rotate').classList.contains('show') }));
let s = await snap();
check('ninja-roam-1 runs over the LAN address', s.ruleset === 'ninja-roam-1', String(s.ruleset));
check('Seyrin is on the player (the model came through the LAN route)', !!s.attached && s.live === 1, s.label);
check('the ult button is not shown as locked', !s.ultLocked && s.ultLabel === 'อัลติ', `${s.ultLabel}`);
await page.screenshot({ path: path.join(shots, 'lan-touch-idle.png') });
// the stick: drag up from its centre
const stick = await page.locator('#stick-base').boundingBox();
const cx = stick.x + stick.width / 2, cy = stick.y + stick.height / 2;
const cdp = await ctx.newCDPSession(page);
const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
await touch('touchStart', cx, cy); await touch('touchMove', cx, cy - 45); await page.waitForTimeout(900);
const moved = await snap(); await touch('touchEnd');
check('the touch stick walks her', Math.hypot(moved.x - s.x, moved.z - s.z) > 1, `moved ${Math.hypot(moved.x - s.x, moved.z - s.z).toFixed(2)} m`);
await page.screenshot({ path: path.join(shots, 'lan-touch-run.png') });
for (const [btn, kind] of [['#btn-attack', 'attack'], ['#btn-dodge', 'dodge'], ['#btn-skill', null], ['#btn-skill2', null], ['#btn-skill3', null]]) {
  await page.waitForTimeout(900);
  await page.tap(btn); await page.waitForTimeout(100);
  const a = (await snap()).action;
  check(`tap ${btn} starts an action`, kind ? a === kind : a !== null, String(a));
}
// the ult needs a full meter in the rules; the tap must reach the sim as the `ult` command either way
await page.waitForTimeout(900);
const pressed = await page.evaluate(async () => {
  const seen = []; const inp = window.__synes.log; const n0 = inp.data?.length ?? 0;
  document.querySelector('#btn-ult').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' }));
  await new Promise((r) => setTimeout(r, 200));
  return { banner: document.body.innerText.includes('อัลติจะปลดล็อกในอัปเดตถัดไป'), n0, seen };
});
check('tap on the ult button no longer shows the "locked" message', !pressed.banner);
check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
// a public-looking client is refused by the route: checked in tests/seyrinGate.test.ts (cannot be faked from here)
await browser.close();
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
process.exit(results.every(Boolean) ? 0 : 1);
