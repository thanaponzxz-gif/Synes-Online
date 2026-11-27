// DES-008 v2 §10.3 / §10.6: live play with the bot. Per configuration: 10 s warm-up, then a 60 s window.
//   node tools/qa/dmg-perf.mjs <outDir> [--root dist] [--tag v2] [--port 4193] [--warm 10] [--secs 60] [--only roam-medium,boss-low]
//     [--oracle]  record every placement attempt in the window and check it with dmg-oracle.mjs (adds CPU cost: not for timing)
//     [--deep]    keep JS heap change on kept frames (spike hunting; adds cost)
//   An older build without __synesQA.floaters() still gives the total frame times (the "before" side of §10.6).
// Reported per window: counters (events → created / painted / readable ≥ 180 ms, per kind, drop and retire reasons), overlay CPU per
// rendered frame (intake + screen + protected gather + placement + paint; tool checks excluded and shown apart), total rAF frame time,
// long tasks, DOM nodes, frames over 8 ms with their parts, and the cold first-hit frame from the warm-up.
// LIMITS: Edge + SwiftShader (software GPU) on this PC. Not a phone.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http'; import os from 'node:os';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';
import { tally, preferredY } from './dmg-oracle.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const VAL = new Set(['--tag', '--root', '--port', '--warm', '--secs', '--only']);
const outDir = args.find((a, i) => !a.startsWith('--') && !VAL.has(args[i - 1])) || 'tools/qa/out/dmg-perf';
const tag = opt('tag', 'v2'), root = path.resolve(opt('root', 'dist')), port = +opt('port', '4193'), warm = +opt('warm', '10'), secs = +opt('secs', '60');
const only = opt('only', '').split(',').filter(Boolean), ORACLE = args.includes('--oracle'), DEEP = args.includes('--deep');
fs.mkdirSync(outDir, { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
}).listen(port);
const edge = process.env.SYNES_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });

const SCEN = { roam: 'seed=3&bot=1&botskills=1', boss: 'seed=5&bot=1&botskills=1&start=boss' };
const CONFIGS = [];
for (const q of ['medium', 'low']) for (const s of ['roam', 'boss']) CONFIGS.push({ name: `${s}-${q}`, scen: s, quality: q, reduced: false });
for (const s of ['roam', 'boss']) CONFIGS.push({ name: `${s}-medium-reduced`, scen: s, quality: 'medium', reduced: true });

const stats = (a) => {
  if (!a.length) return { n: 0, p50: 0, p95: 0, max: 0 };
  const s = [...a].sort((x, y) => x - y), pc = (p) => +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2);
  return { n: s.length, p50: pc(0.5), p95: pc(0.95), max: +s[s.length - 1].toFixed(2) };
};
/** numeric difference of two counter objects (nested), keys of `b` */
const diff = (b, a) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, typeof v === 'number' ? v - (a?.[k] ?? 0) : diff(v, a?.[k] ?? {})]));
const COUNTERS = ['created', 'painted', 'readable', 'merged', 'deduped', 'invalid', 'dropCap', 'dropPlace', 'replaced', 'retiredSafety', 'retiredLife', 'cleared', 'retiredUnpainted', 'safetyUnread', 'why', 'retireWhy', 'byKind'];
const pick = (o) => Object.fromEntries(COUNTERS.filter((k) => k in o).map((k) => [k, o[k]]));

/** why labels end before they were readable, next to how much room they had when they were placed (px between the accepted R and the
 *  nearest protected area or label; the rule asks for ≥ 0.5·S) and whether a side label sits at the preferred y or at the end of a free range */
function retireStudy(attempts, ends) {
  const end = new Map(ends.map((e) => [e.uid, e]));
  const gap = (R, blocks) => blocks.reduce((m, p) => Math.min(m, Math.max(p.l - R.r, R.l - p.r, p.t - R.b, R.t - p.b)), Infinity);
  const rows = attempts.filter((x) => x.uid && end.has(x.uid)).map((x) => {
    const e = end.get(x.uid), side = x.result === 'right' || x.result === 'left', cy = (x.R.t + x.R.b) / 2;
    return { place: x.result, readable: e.readable, cause: e.cause, why: e.why, age: e.age, gap: gap(x.R, x.blocks), atRangeEnd: side && Math.abs(cy - preferredY(x)) > 0.11 };
  });
  const med = (a) => (a.length ? +[...a].sort((p, q) => p - q)[Math.floor(a.length / 2)].toFixed(1) : null);
  const group = (list) => ({ n: list.length, gapAtSpawnP50: med(list.map((r) => Math.min(r.gap, 999))), gapAtSpawnUnder2px: list.filter((r) => r.gap < 2).length,
    sideAtRangeEnd: list.filter((r) => r.atRangeEnd).length, sidePlaced: list.filter((r) => r.place === 'right' || r.place === 'left').length, endAgeP50ms: med(list.map((r) => r.age)) });
  const unread = rows.filter((r) => !r.readable && r.cause === 'safety');
  const whys = {};
  for (const r of unread) whys[r.why] = (whys[r.why] || 0) + 1;
  const byPlace = {};
  for (const r of rows) { const p = (byPlace[r.place] ??= { placed: 0, readable: 0 }); p.placed++; if (r.readable) p.readable++; }
  return { ended: rows.length, byPlace, readable: group(rows.filter((r) => r.readable)), safetyBeforeReadable: { ...group(unread), why: whys } };
}

const report = { tag, root: path.basename(root), warm, secs, oracle: ORACLE, deep: DEEP, viewport: '844x390 dpr 1',
  machine: { cpu: os.cpus()[0].model.trim(), cores: os.cpus().length, os: `${os.platform()} ${os.release()}`, browser: browser.version() }, configs: [] };

for (const c of CONFIGS.filter((x) => !only.length || only.includes(x.name))) {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, reducedMotion: c.reduced ? 'reduce' : 'no-preference' });
  await context.addInitScript((q) => { try { localStorage.setItem('synes.quality', q); } catch { /* blocked */ } }, c.quality);
  const page = await context.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !(m.location().url || '').endsWith('/favicon.ico')) errors.push(`${m.text()} ${(m.location().url || '').replace(/^http:\/\/localhost:\d+/, '')}`); });
  const cdp = await context.newCDPSession(page);
  await page.goto(`http://localhost:${port}/?offline&autostart&${SCEN[c.scen]}`);
  await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 120000 });
  await page.evaluate(() => {
    window.__ft = []; window.__lt = [];
    let last = performance.now();
    const loop = (t) => { window.__ft.push(t - last); last = t; requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(e.duration); }).observe({ type: 'longtask' });
  });
  const has = await page.evaluate(() => !!window.__synesQA?.floaters);
  let restarts = 0;
  const dom = { totalMax: 0, layerMax: 0, ebarMax: 0, total: [], layer: [] };
  const attempts = [], ends = [];
  const poll = async (seconds, sample) => {
    const end = Date.now() + seconds * 1000;
    while (Date.now() < end) {
      await page.waitForTimeout(500);
      const s = await page.evaluate((rec) => {
        const layer = document.querySelector('#floaters');
        const out = { state: window.__synes.state, finished: window.__synes.world.finished, total: document.getElementsByTagName('*').length,
          layer: layer.getElementsByTagName('*').length, ebar: layer.getElementsByClassName('ebar').length, log: rec ? window.__synesQA.floatAttempts() : null };
        return out;
      }, sample && ORACLE && has);
      if (s.finished || s.state === 'done') {
        // the bot won: play the same scene again. Wait for the result panel first (it is opened by a 1.4 s timer; restarting sooner
        // lets the old timer open it over the new run, which then covers every label with a full-screen HUD area)
        await page.waitForFunction(() => document.querySelector('#victory').classList.contains('show'), null, { timeout: 10000 });
        await page.waitForTimeout(300);
        await page.evaluate(() => document.querySelector('#btn-restart').click());
        restarts++;
      }
      if (sample) {
        dom.totalMax = Math.max(dom.totalMax, s.total); dom.layerMax = Math.max(dom.layerMax, s.layer); dom.ebarMax = Math.max(dom.ebarMax, s.ebar);
        dom.total.push(s.total); dom.layer.push(s.layer);
        if (s.log) { attempts.push(...s.log.attempts); ends.push(...s.log.ends); }
      }
    }
  };
  await poll(warm, false);
  const start = await page.evaluate(({ deep, rec }) => {
    const qa = window.__synesQA; let s = null;
    if (qa.floaters) { s = qa.floaters(); qa.floatPerfReset(deep); if (rec) { qa.floatRecord(true); qa.floatAttempts(); } }
    window.__ft.length = 0; window.__lt.length = 0;
    return { s, tick: window.__synes.world.tick };
  }, { deep: DEEP, rec: ORACLE });
  const t0 = Date.now();
  await poll(secs, true);
  const end = await page.evaluate(() => ({ s: window.__synesQA.floaters?.() ?? null, ft: window.__ft.slice(1), lt: window.__lt.slice(), quality: window.__synes.view.settings?.tier ?? null }));
  const wall = (Date.now() - t0) / 1000;
  const counters = await cdp.send('Memory.getDOMCounters');
  const rec = {
    ...c, errors: errors.slice(0, 5), errorCount: errors.length, restarts, wallSecs: +wall.toFixed(1),
    frame: { ...stats(end.ft), fps: +(end.ft.length / wall).toFixed(1) },
    longTasks: { count: end.lt.length, totalMs: Math.round(end.lt.reduce((a, b) => a + b, 0)), max: Math.round(Math.max(0, ...end.lt)) },
    dom: { totalMax: dom.totalMax, layerMax: dom.layerMax, ebarMax: dom.ebarMax, totalFirst: dom.total[0], totalLast: dom.total.at(-1), layerFirst: dom.layer[0], layerLast: dom.layer.at(-1), nodesAtEnd: counters.nodes },
  };
  if (has) {
    const s = end.s;
    rec.reducedSeen = s.reduced; rec.qualitySeen = s.quality;
    rec.counters = diff(pick(s), pick(start.s));
    rec.cpuMs = s.cpuMs; rec.partMsPerFrame = s.partMsPerFrame; rec.toolMsPerFrame = s.toolMsPerFrame;
    rec.pool = s.pool; rec.maxDomLive = s.maxDomLive; rec.paintedOverlap = s.paintedOverlap; rec.domOutsideR = s.domOutsideR;
    rec.firstHit = s.firstHit; rec.worst = s.worst; rec.spikes = s.spikes; rec.hudRead = s.hudRead;
    // cold frames: everything from page load to the end of the warm-up, kept apart from the window (not dropped)
    rec.warmupFrames = { n: start.s.cpuMs.n, max: start.s.cpuMs.max, over8: start.s.samplesOver8, worst: start.s.worst, spikes: start.s.spikes.slice(0, 20) };
    if (ORACLE) { rec.oracle = tally(attempts); rec.retireStudy = retireStudy(attempts, ends); }
  }
  report.configs.push(rec);
  console.log(c.name, JSON.stringify({ fps: rec.frame.fps, frameP95: rec.frame.p95, cpu: rec.cpuMs && { n: rec.cpuMs.n, p50: rec.cpuMs.p50, p95: rec.cpuMs.p95, max: rec.cpuMs.max, over8: rec.cpuMs.over8 },
    created: rec.counters?.created, painted: rec.counters?.painted, readable: rec.counters?.readable, dropCap: rec.counters?.dropCap, dropPlace: rec.counters?.dropPlace, retiredSafety: rec.counters?.retiredSafety,
    unpainted: rec.counters?.retiredUnpainted, oracle: rec.oracle?.total, overlap: rec.paintedOverlap, layerMax: rec.dom.layerMax, errors: rec.errorCount, restarts }));
  await context.close();
  fs.writeFileSync(path.join(outDir, `${tag}-perf.json`), JSON.stringify(report, null, 2));
}
await browser.close(); srv.close();
