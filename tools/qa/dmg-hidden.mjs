// DES-008 §15.3 (D3-A) browser check: after a win, the page goes hidden while rAF keeps running (headless Edge keeps calling it),
// then visible again. The damage numbers must not age while hidden and must not catch up afterwards. document.hidden is overridden
// in the page and visibilitychange dispatched, the way a real tab switch reaches main.ts; the result screen then clears them.
//   node tools/qa/dmg-hidden.mjs <url, e.g. http://localhost:8093> [outFile]      (PC Edge + SwiftShader only)
import fs from 'node:fs';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const [url, outFile] = process.argv.slice(2);
const edge = process.env.SYNES_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });
const context = await browser.newContext({ viewport: { width: 844, height: 390 } });
await context.addInitScript(() => {
  window.__hide = false;
  Object.defineProperty(Document.prototype, 'hidden', { configurable: true, get: () => window.__hide });
  Object.defineProperty(Document.prototype, 'visibilityState', { configurable: true, get: () => (window.__hide ? 'hidden' : 'visible') });
});
const page = await context.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`${url}/?offline&autostart&qafreeze&seed=5&bot=1&botskills=1&start=boss`);
await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 120000 });
// play the boss fight frozen, tick by tick, until the winning tick; then let the loop run again (state becomes 'done')
let won = false;
for (let i = 0; i < 400 && !won; i++) won = await page.evaluate(() => { window.__synesQA.stepTicks(15); return window.__synes.world.finished; });
if (!won) throw new Error('the bot did not win within 6000 ticks');
const snap = (tag) => page.evaluate((tag) => {
  const f = window.__synesQA.floaters();
  return { tag, t: Math.round(performance.now()), state: window.__synes.state, hidden: document.hidden, clock: +f.clock?.toFixed?.(1) || null,
    labels: f.labels.map((l) => ({ kind: l.kind, text: l.text, age: Math.round(l.age) })), clearWhy: f.clearWhy, retiredLife: f.retiredLife, victory: document.querySelector('#victory').classList.contains('show') };
}, tag);
const rows = [];
await page.evaluate(() => { window.__frames = 0; const c = () => { window.__frames++; requestAnimationFrame(c); }; requestAnimationFrame(c); window.__synesQA.unfreeze(); });
// a number born after the win (the boss's last hit may have had no room): placed by the next frame, then 100 ms of visible time
await page.waitForTimeout(150);
await page.evaluate(() => window.__synesQA.floatSample([{ kind: 'damage', amount: 28, actor: window.__synes.world.player.id }]));
await page.waitForTimeout(100); rows.push(await snap('visible after win, number injected'));
await page.evaluate(() => { window.__hide = true; document.dispatchEvent(new Event('visibilitychange')); window.__f0 = window.__frames; });
await page.waitForTimeout(500);
rows.push({ ...(await snap('hidden 500 ms')), rafFramesWhileHidden: await page.evaluate(() => window.__frames - window.__f0) });
await page.evaluate(() => { window.__hide = false; document.dispatchEvent(new Event('visibilitychange')); });
await page.waitForTimeout(40); rows.push(await snap('visible again'));
await page.waitForTimeout(150); rows.push(await snap('visible +150 ms'));
// the result screen opens while hidden (its timer fires 1.4 s after the win)
await page.evaluate(() => { window.__hide = true; document.dispatchEvent(new Event('visibilitychange')); });
await page.waitForFunction(() => document.querySelector('#victory').classList.contains('show'), null, { timeout: 10000 });
await page.waitForTimeout(100); rows.push(await snap('result screen opened while hidden'));
await page.evaluate(() => { window.__hide = false; document.dispatchEvent(new Event('visibilitychange')); document.querySelector('#btn-restart').click(); });
await page.waitForFunction(() => window.__synes.state === 'playing', null, { timeout: 60000 });
await page.waitForTimeout(200); rows.push(await snap('after restart'));
for (const r of rows) console.log(JSON.stringify(r));
console.log('errors', errors.length);
if (outFile) fs.writeFileSync(outFile, JSON.stringify({ rows, errors: errors.length }, null, 1));
await browser.close();
