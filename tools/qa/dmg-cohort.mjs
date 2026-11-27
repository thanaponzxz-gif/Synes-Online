// DES-008 §14.5 R3-4: cohort of the damage numbers born in a live window, and the same recorded game replayed with only the side
// inset changed (7.5·S, this round, against 0, the round-2 rule).
//   node tools/qa/dmg-cohort.mjs <outDir> [--root dist] [--port 4195] [--warm 10] [--secs 60] [--follow 2] [--only roam-medium,...]
// Per configuration: bot play, 10 s warm-up; then the DOM layer records every frame it gives the book (clock, protected areas, actor
// rects, waiting batches with their event times) for 60 s, plus 2 s so the labels born in the window can end. Cohort = labels born in
// the window. The replay with the live inset must reproduce the live attempts and ends exactly (checked on every run); only then is
// the inset-0 replay of the same trace compared, event by event. Both replays are checked by dmg-oracle.mjs with their own inset.
// This is not a perf run (recording costs time; use dmg-perf.mjs for timing). The trace itself stays in tools/qa/out (not committed).
// LIMITS: Edge + SwiftShader (software GPU) on this PC, bot play. Not a phone, not a person.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';
import { bandOf, judge } from './dmg-oracle.mjs';
import { replay } from './dmg-replay.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const VAL = new Set(['--root', '--port', '--warm', '--secs', '--follow', '--only']);
const outDir = args.find((a, i) => !a.startsWith('--') && !VAL.has(args[i - 1])) || 'tools/qa/out/dmg-cohort';
const root = path.resolve(opt('root', 'dist')), port = +opt('port', '4195'), warm = +opt('warm', '10'), secs = +opt('secs', '60'), follow = +opt('follow', '2');
const only = opt('only', '').split(',').filter(Boolean);
const traceDir = path.resolve('tools/qa/out/dmg-cohort-trace');
fs.mkdirSync(outDir, { recursive: true }); fs.mkdirSync(traceDir, { recursive: true });

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

const round = (v, d = 2) => (v === null || v === undefined || !Number.isFinite(v) ? null : +v.toFixed(d));
const pct = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return round(s[Math.min(s.length - 1, Math.floor(p * s.length))]); };
const spread = (a) => ({ n: a.length, min: pct(a, 0), p50: pct(a, 0.5), max: a.length ? round(Math.max(...a)) : null });
const count = (list, f) => list.reduce((o, x) => { const k = f(x); o[k] = (o[k] || 0) + 1; return o; }, {});

/** replay, measuring in the page any text size only this replay needs, until none is missing */
async function replayFull(page, trace, boxes, inset) {
  for (let i = 0; i < 20; i++) {
    const r = replay(trace, { boxes, inset });
    if (!r.missing.length) return r;
    const got = await page.evaluate((keys) => keys.map((k) => { const [kind, , text, n] = k.split('|'); return [k, window.__synesQA.floatBox(kind, text, +n || 1)]; }), r.missing);
    for (const [k, v] of got) boxes[k] = v;
  }
  throw new Error('replay: text sizes still missing');
}

const attemptKey = (a) => JSON.stringify([a.t, a.uid ?? null, a.kind, a.actor, a.result, a.n, a.R && [a.R.l, a.R.t, a.R.r, a.R.b]]);
const endKey = (e) => JSON.stringify([e.uid, e.cause, e.why, e.readable, e.age]);

/** what happened to the events and labels born before trace entry `windowEnd` */
function cohort(r, trace, windowEnd, inset) {
  const born = r.attempts.filter((a) => a.frame < windowEnd), made = born.filter((a) => a.uid), ends = new Map(r.ends.map((e) => [e.uid, e]));
  const rows = made.map((a) => {
    const e = ends.get(a.uid), band = bandOf(a), g = r.gaps[a.uid];
    return { uid: a.uid, kind: a.kind, place: a.result, centreY: a.R ? round((a.R.t + a.R.b) / 2) : null, slack: band ? round(band.slack) : null, bandWidth: band ? round(band.width) : null,
      readable: !!e?.readable, end: e ? (e.why ? `${e.cause}:${e.why}` : e.cause) : 'alive', endAgeMs: e?.age ?? null, minGapAny: round(g?.any), minGapVertical: round(g?.vertical) };
  });
  const side = rows.filter((x) => x.slack !== null);
  const verdicts = count(born, (a) => judge(a, { inset }).v);
  const bad = born.map((a) => ({ a, j: judge(a, { inset }) })).filter((x) => x.j.v.endsWith('-bad')).slice(0, 10).map((x) => ({ v: x.j.v, detail: x.j.detail, uid: x.a.uid ?? null }));
  let events = 0;
  for (let i = 0; i < windowEnd; i++) for (const b of trace[i].batches ?? []) events += b.list.length;
  return {
    inset, eventsFed: events, attempts: born.length, created: rows.length, notCreated: count(born.filter((a) => !a.uid), (a) => a.result),
    readable: rows.filter((x) => x.readable).length, safetyUnread: rows.filter((x) => !x.readable && x.end.startsWith('safety')).length,
    ends: count(rows, (x) => `${x.end}${x.readable ? '' : ' (unread)'}`), byPlace: count(rows, (x) => `${x.place}${x.readable ? '' : ' (unread)'}`),
    side: { placed: side.length, slack: spread(side.map((x) => x.slack)), slackUnder7_5: side.filter((x) => x.slack < 7.5 - 0.01).length, bandWidth: spread(side.map((x) => x.bandWidth)) },
    minGapPainted: { any: spread(rows.map((x) => x.minGapAny).filter((v) => v !== null)), vertical: spread(rows.map((x) => x.minGapVertical).filter((v) => v !== null)) },
    checker: verdicts, checkerBad: bad, rows,
  };
}

/** the same events in both replays, matched by (trace entry, time, actor, kind, occurrence): readable in which? */
function paired(a, b, windowEnd) {
  const index = (r) => {
    const seen = {}, m = new Map(), ends = new Map(r.ends.map((e) => [e.uid, e]));
    for (const x of r.attempts.filter((y) => y.frame < windowEnd)) {
      const k = `${x.frame}|${x.t}|${x.actor}|${x.kind}`, n = (seen[k] = (seen[k] || 0) + 1);
      m.set(`${k}|${n}`, !x.uid ? 'not made' : ends.get(x.uid)?.readable ? 'readable' : 'unread');
    }
    return m;
  };
  const A = index(a), B = index(b), keys = new Set([...A.keys(), ...B.keys()]);
  return count([...keys], (k) => `inset7.5 ${A.get(k) ?? 'no attempt'} / inset0 ${B.get(k) ?? 'no attempt'}`);
}

const report = { window: { warm, secs, follow }, viewport: '844x390 dpr 1', browser: browser.version(), configs: [] };
for (const c of CONFIGS.filter((x) => !only.length || only.includes(x.name))) {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, reducedMotion: c.reduced ? 'reduce' : 'no-preference' });
  await context.addInitScript((q) => { try { localStorage.setItem('synes.quality', q); } catch { /* blocked */ } }, c.quality);
  const page = await context.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`http://localhost:${port}/?offline&autostart&${SCEN[c.scen]}`);
  await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 120000 });
  let restarts = 0, recording = false;
  const trace = [], attempts = [], ends = [];
  const take = async () => {
    const s = await page.evaluate((rec) => ({ finished: window.__synes.world.finished, state: window.__synes.state,
      trace: rec ? window.__synesQA.floatTraceTake() : [], log: rec ? window.__synesQA.floatAttempts() : null }), recording);
    trace.push(...s.trace); if (s.log) { attempts.push(...s.log.attempts); ends.push(...s.log.ends); }
    return s;
  };
  const poll = async (seconds) => {
    const end = Date.now() + seconds * 1000;
    while (Date.now() < end) {
      await page.waitForTimeout(500);
      const s = await take();
      if (s.finished || s.state === 'done') { // the bot won: wait for the result panel (opened by a timer), then play again
        await page.waitForFunction(() => document.querySelector('#victory').classList.contains('show'), null, { timeout: 10000 });
        await page.waitForTimeout(300);
        await page.evaluate(() => document.querySelector('#btn-restart').click());
        restarts++;
      }
    }
  };
  await poll(warm);
  const start = await page.evaluate(() => { const qa = window.__synesQA; qa.floatRecord(true); qa.floatTrace(true); qa.floatAttempts(); return { s: qa.floaters(), tick: window.__synes.world.tick }; });
  recording = true;
  await poll(secs); await take();
  const windowEnd = trace.length;
  const endStats = await page.evaluate(() => window.__synesQA.floaters());
  await poll(follow); await take();
  const boxes = await page.evaluate(() => window.__synesQA.floatTraceBoxes());
  await page.evaluate(() => window.__synesQA.floatTrace(false));

  const live = await replayFull(page, trace, boxes, 7.5), old = await replayFull(page, trace, boxes, 0);
  // the harness check: same inset -> exactly the live attempts and ends (the ends of labels the trace start cleared are not in it)
  const ids = new Set(live.attempts.filter((a) => a.uid).map((a) => a.uid));
  const liveA = attempts.map(attemptKey), repA = live.attempts.map(attemptKey);
  const liveE = ends.filter((e) => ids.has(e.uid)).map(endKey), repE = live.ends.filter((e) => ids.has(e.uid)).map(endKey);
  const diffCount = (x, y) => { let n = Math.abs(x.length - y.length); for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) n++; return n; };
  const harness = { attemptsLive: liveA.length, attemptsReplay: repA.length, attemptDiffs: diffCount(liveA, repA), endsLive: liveE.length, endsReplay: repE.length, endDiffs: diffCount(liveE, repE) };
  fs.writeFileSync(path.join(traceDir, `${c.name}.json`), JSON.stringify({ trace, boxes, attempts, ends, windowEnd }));
  const A = cohort(live, trace, windowEnd, 7.5), B = cohort(old, trace, windowEnd, 0);
  const counters = Object.fromEntries(['created', 'readable', 'merged', 'deduped', 'dropCap', 'dropPlace', 'replaced', 'retiredSafety', 'safetyUnread', 'expired'].map((k) => [k, (endStats[k] ?? 0) - (start.s[k] ?? 0)]));
  const rec = { ...c, restarts, errors: errors.length, traceEntries: trace.length, windowEntries: windowEnd, harness, liveCountersInWindow: counters,
    replayInset7_5: A, replayInset0: B, pairedSameEvents: paired(live, old, windowEnd) };
  report.configs.push(rec);
  const line = (x) => `created ${x.created} readable ${x.readable} safetyUnread ${x.safetyUnread} notMade ${JSON.stringify(x.notCreated)} side slack p50 ${x.side.slack.p50} min ${x.side.slack.min} (<7.5: ${x.side.slackUnder7_5}/${x.side.placed}) checker ${JSON.stringify(x.checker)}`;
  console.log(c.name, 'harness', JSON.stringify(harness), 'restarts', restarts, 'errors', errors.length);
  console.log('  7.5:', line(A)); console.log('  0  :', line(B)); console.log('  paired:', JSON.stringify(rec.pairedSameEvents));
  await context.close();
  fs.writeFileSync(path.join(outDir, 'cohort.json'), JSON.stringify(report, null, 1));
}
await browser.close(); srv.close();
