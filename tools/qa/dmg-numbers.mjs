// DES-008 damage numbers: shots + numbers for team A review (also works on an older build, for "before" shots).
//   node tools/qa/dmg-numbers.mjs <outDir> [--tag after|before] [--root dist] [--port 4192] [--debug] [--secs 40]
// Serves <root> in-process. Two passes per scenario (roam field / boss arena, same seeds):
//  1. shots: ?qafreeze, the sim + numbers advance only through __synesQA.stepTicks, a shot whenever a new label shows (≤ 8 per scenario);
//  2. live: unfrozen bot play for --secs, then __synesQA.floaters() (counters, CPU per frame, overlap checks) and the on-screen body
//     widths of the actors (DES-008 §6: a label's reserved box covers its whole path, so narrow bodies fit fewer labels).
// --samples: DES-008 §10.2 sheet (values 1 8 12 28 120 9999 −18 +45, Thai statuses, a timing strip) → <tag>-samples.png, then exit.
// --debug adds ?floatdebug (reserved boxes green, protected areas red). --video records the live pass (<tag>-<scenario>.webm). LIMITS: Edge/Chromium + SwiftShader on this PC, not a phone.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const flags = new Set(args.filter((a) => a.startsWith('--')));
const VAL = new Set(['--tag', '--root', '--port', '--secs', '--every', '--only']);
const outDir = args.find((a, i) => !a.startsWith('--') && !VAL.has(args[i - 1])) || 'tools/qa/out/dmg';
const tag = opt('tag', 'after'), port = +opt('port', '4192'), secs = +opt('secs', '40'), EVERY = +opt('every', '0'), ONLY = opt('only', '');
const root = path.resolve(opt('root', 'dist'));
fs.mkdirSync(outDir, { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
}).listen(port);

const edge = process.env.SYNES_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });
const SCEN = [
  { name: 'roam', qs: 'seed=3&bot=1&botskills=1' },
  { name: 'boss', qs: 'seed=5&bot=1&botskills=1&start=boss' },
];
const report = { tag, root: path.relative(process.cwd(), root).split(path.sep).join('/'), debug: flags.has('--debug'), scenarios: [] }; // relative: the repo is public
const DBG = flags.has('--debug') ? '&floatdebug' : '';

/** labels on screen: new build → __synesQA.floaters(), old build → .floater elements */
const labelsNow = (page) => page.evaluate(() => {
  const qa = window.__synesQA;
  if (qa?.floaters) return qa.floaters().labels.map((l) => ({ kind: l.kind, text: l.text, age: l.age }));
  return [...document.querySelectorAll('.floater')].map((e) => ({ kind: e.className.replace('floater', '').trim(), text: e.textContent, age: -1 }));
});

if (flags.has('--samples')) {
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  await page.goto(`http://localhost:${port}/?offline&autostart&qafreeze&seed=3${DBG}`);
  await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 90000 });
  await page.evaluate(() => window.__synesQA.stepTicks(2));
  const crop = async (title) => {
    const L = await page.evaluate(() => window.__synesQA.floaters().labels);
    if (!L.length) return { title, img: null, note: 'no label (dropped)' };
    const R = L[L.length - 1].R, g = 10;
    const clip = { x: Math.max(0, R.l - g), y: Math.max(0, R.t - g), width: R.r - R.l + 2 * g, height: R.b - R.t + 2 * g };
    return { title, img: (await page.screenshot({ clip })).toString('base64'), note: `${L[L.length - 1].text} · age ${L[L.length - 1].age} ms` };
  };
  const cells = [];
  const SAMPLES = [['damage', 1], ['damage', 8], ['damage', 12], ['damage', 28], ['damage', 120], ['damage', 9999], ['bonus', 28], ['hurt', 18], ['heal', 45],
    ['perfect', 0], ['stagger', 0], ['interrupt', 0], ['early', 0]];
  for (const [kind, amount] of SAMPLES) {
    await page.evaluate((e) => window.__synesQA.floatSample([e]), { kind, amount });
    await page.evaluate(() => window.__synesQA.stepTicks(3)); // ≈100 ms: just after the pop peak
    cells.push(await crop(`${kind} ${amount || ''}`));
    await page.evaluate(() => window.__synesQA.stepTicks(40)); // let it finish before the next one
  }
  const strip = [];
  await page.evaluate(() => window.__synesQA.floatSample([{ kind: 'damage', amount: 28 }]));
  for (const [k, t] of [[0, 'spawn'], [3, '≈100 ms'], [2, '≈170 ms'], [9, '≈470 ms (70%)'], [5, '≈630 ms (end)']]) {
    await page.evaluate((n) => window.__synesQA.stepTicks(n), k);
    strip.push(await crop(`damage 28 · ${t}`));
  }
  const cell = (c) => `<figure>${c.img ? `<img src="data:image/png;base64,${c.img}">` : '<div class=none>—</div>'}<figcaption>${c.title}<br><small>${c.note}</small></figcaption></figure>`;
  const html = `<style>body{margin:0;background:#1d1830;color:#eee;font:12px system-ui;padding:12px}h2{font-size:14px;margin:6px 0}.g{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}
    figure{margin:0;text-align:center}img{display:block;max-height:180px;background:#000}.none{width:80px;height:60px;display:grid;place-items:center;border:1px dashed #888}</style>
    <h2>DES-008 §10.2 samples (game scene, 844×390, S=1, Medium, crop = reserved box R + 10 px)</h2><div class=g>${cells.map(cell).join('')}</div>
    <h2>timing strip: damage 28</h2><div class=g>${strip.map(cell).join('')}</div>`;
  const sheet = await browser.newPage({ viewport: { width: 1400, height: 400 }, deviceScaleFactor: 1 });
  await sheet.setContent(html); await sheet.screenshot({ path: path.join(outDir, `${tag}-samples.png`), fullPage: true });
  console.log('samples', cells.map((c) => c.note).join(' | '), '|| strip', strip.map((c) => c.note).join(' | '));
  await browser.close(); srv.close(); process.exit(0);
}
for (const sc of SCEN.filter((x) => !ONLY || x.name === ONLY)) {
  const rec = { name: sc.name, shots: [], live: null, errors: [] };
  // ---- 1. shots (frozen, stepped)
  if (!flags.has('--noshots')) {
    const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
    page.on('pageerror', (e) => rec.errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') rec.errors.push(m.text()); });
    await page.goto(`http://localhost:${port}/?offline&autostart&qafreeze&${sc.qs}${DBG}`);
    await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 90000 });
    let seen = new Set(), n = 0;
    for (let t = 0; t < 2400 && n < 8; t++) {
      await page.evaluate(() => window.__synesQA.stepTicks(1));
      const L = await labelsNow(page);
      // a shot when a label is ~3 ticks old (just past its pop) and not shot yet
      const fresh = L.filter((l) => !seen.has(l.kind + l.text) && (l.age < 0 || (l.age >= 90 && l.age <= 140)));
      if (!fresh.length && !(EVERY && t > 0 && t % EVERY === 0)) continue;
      for (const l of L) seen.add(l.kind + l.text);
      if (seen.size > 60) seen = new Set();
      const file = `${tag}-${sc.name}-${String(++n).padStart(2, '0')}.png`;
      await page.screenshot({ path: path.join(outDir, file) });
      rec.shots.push({ file, tick: await page.evaluate(() => window.__synes.world.tick), labels: L });
    }
    await page.close();
  }
  // ---- 2. live play: counters, CPU per frame, body widths
  if (!flags.has('--nolive')) {
    const vid = flags.has('--video') ? { recordVideo: { dir: outDir, size: { width: 844, height: 390 } } } : {};
    const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, ...vid });
    page.on('pageerror', (e) => rec.errors.push(String(e)));
    await page.goto(`http://localhost:${port}/?offline&autostart&${sc.qs}${DBG}`); // --debug: also the DOM-outside-R check and debug cost
    await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 90000 });
    const widths = [];
    for (let s = 0; s < secs * 2; s++) {
      await page.waitForTimeout(500);
      const w = await page.evaluate(() => {
        const { world, view } = window.__synes; if (!view.actorRect) return [];
        const out = { l: 0, t: 0, r: 0, b: 0 }, res = [];
        for (const a of world.actors) if (a.alive && view.actorRect(a.id, out) === 0) res.push({ kind: a.kind, w: Math.round(out.r - out.l), h: Math.round(out.b - out.t) });
        return res;
      });
      widths.push(...w);
      if (await page.evaluate(() => window.__synes.world.finished)) break;
    }
    const byKind = {};
    for (const x of widths) (byKind[x.kind] ??= []).push(x.w);
    const stat = (a) => { const s = [...a].sort((p, q) => p - q); return { n: s.length, min: s[0], p50: s[Math.floor(s.length / 2)], max: s[s.length - 1] }; };
    rec.bodyWidthPx = Object.fromEntries(Object.entries(byKind).map(([k, a]) => [k, stat(a)]));
    rec.live = await page.evaluate(() => { const f = window.__synesQA.floaters?.(); if (f) delete f.labels; return f ?? null; });
    rec.fps = await page.evaluate(() => window.__synes.adaptive?.fps ?? null);
    const video = page.video();
    await page.close();
    if (video) { const f = path.join(outDir, `${tag}-${sc.name}.webm`); await video.saveAs(f); await video.delete(); rec.video = path.basename(f); }
  }
  report.scenarios.push(rec);
  console.log(sc.name, JSON.stringify({ shots: rec.shots.length, live: rec.live, body: rec.bodyWidthPx, errors: rec.errors.length }));
}
fs.writeFileSync(path.join(outDir, `${tag}-report.json`), JSON.stringify(report, null, 2));
await browser.close(); srv.close();
