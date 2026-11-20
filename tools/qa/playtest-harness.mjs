// Playtest harness: lets a tester agent play the real build through touch input, turn by turn.
// The sim is frozen between actions (no overlay), so the tester can look at a screenshot and decide.
// Usage: node tools/qa/playtest-harness.mjs <gameUrl> <outDir> [port]
// API (POST JSON to http://localhost:<port>):
//   /start                         → open game, tap the start button, return first screenshot
//   /act {move:[dx,dy], ms, taps}  → run the game for ms (100–3000) with the stick held toward (dx,dy) in screen space
//                                    (dx right+, dy down+), tapping buttons in `taps` (e.g. ["attack","attack","dodge"])
//                                    spread evenly across the window; returns screenshot after re-freezing
//   /ui {target}                   → tap an on-screen UI button: "retry" | "replay" | "resume" | "portrait"
//   /screen                        → screenshot only
//   /log                           → game event log (for the final report only)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const [url = 'http://localhost:8080/?q=medium', outDir = 'tools/qa/out/playtest', port = '7777'] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const W = 844, H = 390;
let browser, ctx, page, cdp, n = 0;
const actions = fs.createWriteStream(path.join(outDir, 'actions.jsonl'), { flags: 'a' });

const BTN = { attack: '#btn-attack', dodge: '#btn-dodge', skill: '#btn-skill', potion: '#btn-potion' };
const UI = { retry: '#defeat button', replay: '#victory .replay', resume: '#btn-resume2', portrait: '#btn-portrait', start: '#btn-start' };
const center = async (sel) => { const b = await page.locator(sel).boundingBox(); return b ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : null; };
const freeze = () => page.evaluate(() => window.__synesQA?.freeze());
const unfreeze = () => page.evaluate(() => window.__synesQA?.unfreeze());
async function shot(tag) {
  n++; const file = path.resolve(outDir, `step-${String(n).padStart(3, '0')}${tag ? '-' + tag : ''}.png`);
  await page.waitForTimeout(120); // let the frozen frame render
  await page.screenshot({ path: file });
  const st = await page.evaluate(() => window.__synes ? { state: window.__synes.state, time: +(window.__synes.world.tick / 30).toFixed(1) } : { state: 'menu' });
  return { step: n, screenshot: file, gameTime: st.time, overlay: await visibleOverlay() };
}
async function visibleOverlay() {
  return page.evaluate(() => ['#defeat', '#victory', '#resume-tap', '#rotate', '#paused'].filter((s) => document.querySelector(s)?.classList.contains('show')).map((s) => s.slice(1)));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function act({ move, ms = 500, taps = [] }) {
  ms = Math.max(100, Math.min(3000, ms | 0));
  const stick = { x: W * 0.17, y: H * 0.74 };
  const active = [];
  const send = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  await unfreeze();
  const t0 = Date.now();
  if (move && (move[0] || move[1])) {
    const l = Math.hypot(move[0], move[1]) || 1, R = 52;
    const tx = stick.x + (move[0] / l) * R, ty = stick.y + (move[1] / l) * R;
    active.push({ x: stick.x, y: stick.y, id: 1 }); await send('touchStart', [...active]);
    for (let i = 1; i <= 4; i++) { active[0] = { x: stick.x + (tx - stick.x) * i / 4, y: stick.y + (ty - stick.y) * i / 4, id: 1 }; await send('touchMove', [...active]); }
  }
  const plan = taps.map((b, i) => ({ b, at: taps.length === 1 ? 0 : Math.round((ms * i) / taps.length) }));
  for (const p of plan) {
    const wait = p.at - (Date.now() - t0); if (wait > 0) await sleep(wait);
    const c = BTN[p.b] && await center(BTN[p.b]); if (!c) continue;
    const pt = { x: c.x, y: c.y, id: 2 };
    await send('touchStart', [...active, pt]); await sleep(40); await send('touchEnd', [...active]);
  }
  const rest = ms - (Date.now() - t0); if (rest > 0) await sleep(rest);
  if (active.length) await send('touchEnd', []);
  await freeze();
}

async function handle(route, body) {
  if (route === '/start') {
    if (browser) await browser.close();
    browser = await chromium.launch({ args: LAUNCH_ARGS });
    ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    page = await ctx.newPage(); cdp = await ctx.newCDPSession(page); n = 0;
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForSelector('#btn-start:not([disabled])', { timeout: 30000 });
    const title = await shot('title');
    const c = await center(UI.start); await page.touchscreen.tap(c.x, c.y);
    await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 15000 });
    await freeze();
    return { title, first: await shot() };
  }
  if (!page) return { error: 'call /start first' };
  if (route === '/act') { await act(body); return shot(); }
  if (route === '/ui') { const c = await center(UI[body.target]); if (!c) return { error: 'not visible: ' + body.target }; await unfreeze(); await page.touchscreen.tap(c.x, c.y); await sleep(400); await freeze(); return shot(); }
  if (route === '/screen') return shot();
  if (route === '/log') return page.evaluate(() => ({ log: window.__synesQA.log, summary: window.__synes?.world.summary(), net: document.querySelector('#net-chip')?.textContent, reward: document.querySelector('#victory .reward')?.textContent }));
  return { error: 'unknown route' };
}

http.createServer((req, res) => {
  let data = ''; req.on('data', (c) => (data += c));
  req.on('end', async () => {
    let body = {}; try { body = data ? JSON.parse(data) : {}; } catch { /* empty */ }
    let out; try { out = await handle(req.url, body); } catch (e) { out = { error: String(e.message || e) }; }
    actions.write(JSON.stringify({ at: new Date().toISOString(), route: req.url, body, out }) + '\n');
    res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(out));
  });
}).listen(+port, () => console.log(`playtest harness on :${port} → ${url}`));
