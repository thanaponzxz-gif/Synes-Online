// DES-008 §10.7 / §14.5 R3-5: compatibility checks of the damage numbers in the real game scene, on this PC only.
//   node tools/qa/dmg-compat.mjs <outDir> [--root dist] [--port 4196]
// Cases: normal; forced fallbacks (CSS.supports answers "no" for background-clip:text and -webkit-text-stroke, so the game takes
// its own fallback paths); another system font, forced the same way into the measuring canvas and the DOM (stands for a device whose
// system font differs); iPhone-landscape-like safe-area insets; viewport resizes while labels are alive; reduced motion switched on
// mid-run; pointer events pass through the numbers. Checked per case: painted overlap, DOM layers outside their reserved R
// (?floatdebug), R inside the safe view minus 8·S, computed styles of a painted label. Pictures (JPEG) per case.
// LIMITS: Edge + SwiftShader on Windows. Not a phone; a forced fallback shows that the fallback path works here, not how a given
// phone renders it.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const outDir = args.find((a, i) => !a.startsWith('--') && !['--root', '--port'].includes(args[i - 1])) || 'tools/qa/out/dmg-compat';
const root = path.resolve(opt('root', 'dist')), port = +opt('port', '4196');
fs.mkdirSync(outDir, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
}).listen(port);
const edge = process.env.SYNES_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });

const FALLBACKS = () => {
  const real = CSS.supports.bind(CSS);
  CSS.supports = (a, b) => (/background-clip|text-stroke/.test(b === undefined ? a : a + ' ' + b) ? false : real(...(b === undefined ? [a] : [a, b])));
};
const forceFont = (family) => {
  const desc = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'font');
  Object.defineProperty(CanvasRenderingContext2D.prototype, 'font', { configurable: true, get: desc.get, set(v) { desc.set.call(this, String(v).replace(/system-ui.*$/, family)); } });
  addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `.fl > span { font-family: ${family} !important; }`; document.head.appendChild(s); });
};

async function open(q, { init, reduced = false, size = [844, 390] } = {}) {
  const context = await browser.newContext({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 1, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await context.addInitScript((v) => { try { localStorage.setItem('synes.quality', v); } catch { /* blocked */ } }, q);
  if (init) await context.addInitScript(...init);
  const page = await context.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`http://localhost:${port}/?offline&autostart&qafreeze&floatdebug&seed=3&bot=1&botskills=1`);
  await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 120000 });
  // a bot-played moment with enemies near the player, then still
  for (let i = 0; i < 100; i++) { const t = await page.evaluate(() => window.__synes.world.tick); if (t >= 258) break; await page.evaluate(() => window.__synesQA.stepTicks(3)); }
  await page.waitForTimeout(1200);
  await page.evaluate(() => { window.__synesQA.floatRecord(true); window.__synesQA.floatClear(); window.__synesQA.floatPerfReset(false); });
  return { context, page, errors };
}
/** a mixed group: damage and bonus on the two nearest enemies, hurt / heal / perfect on the player, stagger on an enemy */
const group = (page) => page.evaluate(() => {
  const { world: w, view } = window.__synes, p = w.player, r = { l: 0, t: 0, r: 0, b: 0 };
  const near = w.actors.filter((a) => a.kind !== 'player' && a.alive && view.actorRect(a.id, r) === 0).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z)).map((a) => a.id);
  const list = [{ kind: 'damage', amount: 128, actor: near[0] }, { kind: 'bonus', amount: 56, actor: near[1] ?? near[0] }, { kind: 'hurt', amount: 18 }, { kind: 'heal', amount: 24 }, { kind: 'perfect', amount: 0 }, { kind: 'stagger', amount: 0, actor: near[2] ?? near[0] }];
  window.__synesQA.floatAttempts(); window.__synesQA.floatSample(list);
  for (let t = 0; t < 192; t += 16) window.__synesQA.floatAdvance(16);
});
/** what is on screen now: labels, their R against the safe view, styles of the first painted number, and what a tap on it would hit */
const inspect = (page) => page.evaluate(() => {
  const f = window.__synesQA.floaters(), att = window.__synesQA.floatAttempts().attempts;
  // the safe view and scale of this moment, worked out as the design gives them (the viewport minus the env() insets the page has)
  const probe = [...document.body.children].find((e) => e.style && e.style.cssText.includes('safe-area-inset-top')), pad = getComputedStyle(probe), px = (v) => parseFloat(v) || 0;
  const safe = { l: px(pad.paddingLeft), t: px(pad.paddingTop), r: innerWidth - px(pad.paddingRight), b: innerHeight - px(pad.paddingBottom) };
  const S = Math.min(1.25, Math.max(0.85, Math.min((safe.r - safe.l) / 844, (safe.b - safe.t) / 390)));
  const usedS = att.find((a) => a.S)?.S ?? null;
  const layer = document.querySelector('#floaters');
  const shown = [...layer.querySelectorAll('.fl')].filter((e) => e.style.display === 'block');
  const num = shown.find((e) => e.classList.contains('fl-num'));
  const css = (el) => { if (!el) return null; const s = getComputedStyle(el); return { fontFamily: s.fontFamily.slice(0, 60), fontSize: s.fontSize, stroke: s.webkitTextStrokeWidth, fill: s.webkitTextFillColor, clip: s.webkitBackgroundClip || s.backgroundClip, background: s.backgroundImage.slice(0, 40), shadows: s.textShadow === 'none' ? 0 : s.textShadow.split('px, ').length }; };
  const tap = f.labels.map((l) => { const e = document.elementFromPoint((l.R.l + l.R.r) / 2, (l.R.t + l.R.b) / 2); return e && layer.contains(e) && e !== layer ? 'number' : 'through'; });
  const margin = f.labels.length ? Math.min(...f.labels.map((l) => Math.min(l.R.l - safe.l, safe.r - l.R.r, l.R.t - safe.t, safe.b - l.R.b))) : null;
  return { viewport: [innerWidth, innerHeight], S: +S.toFixed(3), usedS, safe, labels: f.labels.map((l) => ({ kind: l.kind, text: l.text, place: l.place, R: l.R })), count: f.labels.length,
    attempts: att.map((a) => a.result), minSafeMargin: margin === null ? null : +margin.toFixed(2), safeMarginOk: margin === null || margin >= 8 * S - 0.05, paintedOverlap: f.paintedOverlap, domOutsideR: f.domOutsideR,
    classes: shown.map((e) => e.className), number: num ? { o: css(num.querySelector('.fl-o')), i: css(num.querySelector('.fl-i')), f: css(num.querySelector('.fl-f')) } : null, tap };
});
const out = { cases: [] };
async function run(name, q, setup = {}, during = null) {
  const { context, page, errors } = await open(q, setup);
  const extra = setup.cdp ? await setup.cdp(context, page) : undefined;
  const steps = [];
  const shot = async (label) => { await page.waitForTimeout(250); await page.screenshot({ path: path.join(outDir, `compat-${name}-${q}-${label}.jpg`), type: 'jpeg', quality: 80 }); };
  if (during) await during(page, steps, shot);
  else { await group(page); await shot('a'); steps.push({ step: 'group', ...(await inspect(page)) }); }
  const f = await page.evaluate(() => window.__synesQA.floaters());
  out.cases.push({ name, quality: q, extra, steps, clearWhy: f.clearWhy, retireWhy: f.retireWhy, errors: errors.length });
  console.log(name, q, steps.map((s) => `${s.step}: ${s.count} labels, S ${s.S}/${s.usedS ?? '-'}, overlap ${s.paintedOverlap}, outsideR ${s.domOutsideR}, margin ${s.minSafeMargin}${s.safeMarginOk ? '' : ' BELOW 8S'}, tap ${[...new Set(s.tap)].join('/')}`).join(' | '), 'errors', errors.length, extra ? JSON.stringify(extra) : '');
  await context.close();
}

for (const q of ['medium', 'low']) {
  await run('normal', q);
  await run('no-gradient-no-stroke', q, { init: [FALLBACKS] });
  await run('font-tahoma', q, { init: [forceFont, 'Tahoma'] });
  await run('font-courier', q, { init: [forceFont, '"Courier New", monospace'] });
}
// safe-area: iPhone-landscape-like insets. CDP override where this browser has it, else the same env() values through CSS
await run('safe-area', 'medium', {
  cdp: async (context, page) => {
    const cdp = await context.newCDPSession(page);
    let how = 'CDP Emulation.setSafeAreaInsetsOverride';
    try { await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 0, left: 47, right: 47, bottom: 21 } }); }
    catch {
      how = 'CSS stand-in (probe padding + --sl/--sr/--sb); env() itself not emulated';
      await page.addStyleTag({ content: ':root{--sl:47px!important;--sr:47px!important;--sb:21px!important}' });
      await page.evaluate(() => { const p = [...document.body.children].find((e) => e.style && e.style.cssText.includes('safe-area-inset-top')); p.style.padding = '0px 47px 21px 47px'; });
    }
    await page.evaluate(() => dispatchEvent(new Event('resize')));
    await page.waitForTimeout(600);
    await page.evaluate(() => window.__synesQA.floatClear());
    return how;
  },
});
// resize while labels are alive: each new size, the live ones are re-checked before paint; then a new group at that size
await run('resize', 'medium', {}, async (page, steps, shot) => {
  await group(page); steps.push({ step: '844x390', ...(await inspect(page)) });
  for (const [w, h] of [[667, 375], [932, 430], [568, 320], [844, 390]]) {
    await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(600);
    steps.push({ step: `${w}x${h} live`, ...(await inspect(page)) });
    await page.evaluate(() => window.__synesQA.floatClear()); await group(page); await shot(`${w}x${h}`);
    steps.push({ step: `${w}x${h} new`, ...(await inspect(page)) });
  }
});
// reduced motion switched on while labels are alive: they are cleared, the next ones follow the reduced paths
await run('reduced-switch', 'medium', {}, async (page, steps, shot) => {
  await group(page); steps.push({ step: 'before', ...(await inspect(page)) });
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(600);
  steps.push({ step: 'switched', ...(await inspect(page)) });
  await group(page); await shot('after'); steps.push({ step: 'after', ...(await inspect(page)) });
});
fs.writeFileSync(path.join(outDir, 'compat.json'), JSON.stringify(out, null, 1));
await browser.close(); srv.close();
