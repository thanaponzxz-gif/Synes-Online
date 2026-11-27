// DES-008 v2 §10.3 controlled sets in the real game scene (and §10.5 reset / memory checks with --resets).
//   node tools/qa/dmg-control.mjs <outDir> [--root dist] [--port 4194] [--only open,boss,crowd] [--resets | --shots | --seq]
// --shots: §10.4 pictures with ?floatdebug (reserved boxes green, protected areas red). --seq: §10.8 stepped PNG sequence + trace
// (PNG frames go to tools/qa/out/dmg2-seq/, not committed; the trace and a contact sheet go to <outDir>).
// Controlled sets: the sim is frozen, then groups of hits are injected and only the damage-number clock advances, all inside one
// synchronous page call, so nothing in the scene (camera, bodies, warnings, HUD) can change while a set runs.
//   open  : roam start, 10 groups one after another on the player (clear sky around)
//   boss  : boss arena, bot-played moments where the checker says the above spot fails but a side lane has room; 10 groups on the boss
//   crowd : 10 bot-played moments with 2+ enemies near the player; one batch (one hit per near enemy) at each moment
// "shown" = readable: painted at opacity ≥ 0.8 for ≥ 180 ms. Each placement attempt is also checked by dmg-oracle.mjs.
// LIMITS: Edge + SwiftShader (software GPU) on this PC. Not a phone.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';
import { judge, preferredY, spot, tally } from './dmg-oracle.mjs';

const PLACES = ['above', 'right', 'left', 'below'];

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const ONLY = opt('only', 'open,boss,crowd').split(',');
const outDir = args.find((a, i) => !a.startsWith('--') && !['--root', '--port', '--only'].includes(args[i - 1])) || 'tools/qa/out/dmg-control';
const root = path.resolve(opt('root', 'dist')), port = +opt('port', '4194'), RESETS = args.includes('--resets'), SHOTS = args.includes('--shots'), SEQ = args.includes('--seq');
fs.mkdirSync(outDir, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
}).listen(port);
const edge = process.env.SYNES_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });

async function open(q, qs, reduced = false) {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await context.addInitScript((v) => { try { localStorage.setItem('synes.quality', v); } catch { /* blocked */ } }, q);
  const page = await context.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`http://localhost:${port}/?offline&autostart&${qs}`);
  await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 120000 });
  return { context, page, errors };
}
/** inject one batch and let it live out its life; returns counter changes and the recorded attempts */
const runBatch = (page, batch, ms = 960) => page.evaluate(({ batch, ms }) => {
  const qa = window.__synesQA, key = ['created', 'painted', 'readable', 'merged', 'deduped', 'dropCap', 'dropPlace', 'retiredSafety', 'replaced'];
  const s0 = qa.floaters(); qa.floatAttempts();
  qa.floatSample(batch);
  let placed = null;
  for (let t = 0; t < ms; t += 16) { qa.floatAdvance(16); if (t === 192) placed = qa.floaters(); }
  const s1 = qa.floaters();
  return { delta: Object.fromEntries(key.map((k) => [k, s1[k] - s0[k]])), attempts: qa.floatAttempts().attempts, at192: placed && { labels: placed.labels, protected: placed.protected }, overlap: s1.paintedOverlap };
}, { batch, ms });
/** step the bot-played sim (frozen between calls) */
const step = (page, n) => page.evaluate((k) => window.__synesQA.stepTicks(k), n);
const scene = (page) => page.evaluate(() => {
  const { world: w, view } = window.__synes, r = { l: 0, t: 0, r: 0, b: 0 }, p = w.player;
  const near = w.actors.filter((a) => a.kind !== 'player' && a.alive && Math.hypot(a.x - p.x, a.z - p.z) < 7)
    .map((a) => ({ id: a.id, kind: a.kind, d: +Math.hypot(a.x - p.x, a.z - p.z).toFixed(1), rect: view.actorRect(a.id, r) === 0 ? { ...r } : null })).filter((a) => a.rect);
  return { tick: w.tick, bossStarted: w.bossStarted && w.boss.alive, bossId: w.boss.id, tele: w.tele.length, playerId: p.id, near, finished: w.finished };
});
/** wait until ~0.8 s passes without a live or just-ended warning, so nothing protected can change mid-set */
async function quietMoment(page, want, maxTicks = 2400) {
  let quiet = 0;
  for (let t = 0; t < maxTicks; t += 3) {
    await step(page, 3);
    const s = await scene(page);
    if (s.finished) return null;
    quiet = s.tele ? 0 : quiet + 3;
    if (quiet >= 15 && (await want(s))) return s;
  }
  return null;
}
/** next bot-played moment matching want (warnings may be on screen; nothing can change while a set runs) */
async function anyMoment(page, want, maxTick = 900) {
  for (;;) { await step(page, 3); const s = await scene(page); if (s.finished || s.tick > maxTick) return null; if (want(s)) return s; }
}
/** what the checker says about a probe on this actor, now (the probe itself is cleared) */
async function probe(page, actor) {
  const r = await runBatch(page, [{ kind: 'damage', amount: 28, actor }], 32);
  await page.evaluate(() => window.__synesQA.floatClear());
  const at = r.attempts[0];
  if (!at || !at.a) return null;
  const g = { S: at.S, safe: at.safe, a: at.a, blocks: at.blocks };
  return { at, above: !!spot('above', at.w, at.h, g), right: !!spot('right', at.w, at.h, g), left: !!spot('left', at.w, at.h, g) };
}

const out = { viewport: '844x390 dpr 1', sets: [] };
if (!RESETS && !SHOTS && !SEQ) {
  for (const q of ['medium', 'low']) {
    // ---- open
    if (ONLY.includes('open')) {
      const { context, page, errors } = await open(q, 'qafreeze&seed=3');
      await step(page, 2); await page.waitForTimeout(1500);
      await page.evaluate(() => { window.__synesQA.floatRecord(true); window.__synesQA.floatClear(); });
      const s = await scene(page); const rows = [], atts = [];
      for (let i = 0; i < 10; i++) { const r = await runBatch(page, [{ kind: 'damage', amount: 12 + i, actor: s.playerId }]); rows.push(r.delta); atts.push(...r.attempts); }
      out.sets.push({ set: 'open', quality: q, groups: 10, shown: rows.reduce((n, r) => n + r.readable, 0), rows, oracle: tally(atts).total, errors: errors.length });
      await context.close();
    }
    // ---- boss: up to 3 different moments where above fails but a side lane has room
    if (ONLY.includes('boss')) {
      const { context, page, errors } = await open(q, 'qafreeze&seed=5&bot=1&botskills=1&start=boss');
      await page.evaluate(() => window.__synesQA.floatRecord(true));
      const moments = [];
      let lastTick = -1e9;
      for (let k = 0; k < 3; k++) {
        const s = await quietMoment(page, async (x) => {
          if (!x.bossStarted || x.tick - lastTick < 90 || !x.near.some((a) => a.id === x.bossId)) return false;
          await page.waitForTimeout(900); // HUD banners / hints finish their slide
          const p = await probe(page, x.bossId);
          return !!p && !p.above && (p.right || p.left);
        });
        if (!s) break;
        lastTick = s.tick;
        const p = await probe(page, s.bossId), rows = [], atts = [];
        let sample = null;
        for (let i = 0; i < 10; i++) {
          const r = await runBatch(page, [{ kind: 'damage', amount: 28, actor: s.bossId }]); rows.push(r.delta); atts.push(...r.attempts);
          if (i === 0) sample = { labels: r.at192.labels, protected: r.at192.protected };
        }
        moments.push({ tick: s.tick, bossRect: s.near.find((a) => a.id === s.bossId).rect, probe: { above: p.above, right: p.right, left: p.left, R: { w: +p.at.w.toFixed(1), h: +p.at.h.toFixed(1) } },
          groups: 10, shown: rows.reduce((n, r) => n + r.readable, 0), places: atts.map((a) => a.result), centreY: atts.filter((a) => a.R).map((a) => +((a.R.t + a.R.b) / 2).toFixed(1)),
          oracle: tally(atts).total, sampleAt192ms: sample });
      }
      out.sets.push({ set: 'boss', quality: q, moments, errors: errors.length });
      await context.close();
    }
    // ---- crowd: 10 eligible batches (2..4 enemies near the player). A moment is eligible when the checker alone (dmg-oracle on the
    // reported rectangles, before any batch is placed) finds a legal spot for at least one of the targets. Fresh page per seed.
    if (ONLY.includes('crowd')) {
      const batches = [], skipped = [], seen = []; let errs = 0, repeats = 0;
      // two moments are the same layout when they hold the same enemies with every body rectangle within 12 px
      const same = (x, y) => x.length === y.length && x.every((a, i) => a.kind === y[i].kind && ['l', 't', 'r', 'b'].every((k) => Math.abs(a.rect[k] - y[i].rect[k]) < 12));
      const RUNS = ['seed=3&bot=1&botskills=1', 'seed=4&bot=1&botskills=1', 'seed=6&bot=1&botskills=1', 'seed=3&bot=1', 'seed=3&bot=2&botskills=1', 'seed=4&bot=2', 'seed=6&bot=3&botskills=1', 'seed=7&bot=3', 'seed=8&bot=4'];
      for (const [k, run] of RUNS.entries()) {
        if (batches.length >= 10) break;
        const { context, page, errors } = await open(q, 'qafreeze&' + run);
        await page.evaluate(() => window.__synesQA.floatRecord(true));
        if (process.env.CTL_LOG) console.error(q, 'crowd run', run, 'have', batches.length);
        let lastTick = 150 + 3 * k, taken = 0;
        while (batches.length < 10 && taken < 6) {
          const s = await anyMoment(page, (x) => x.tick - lastTick >= 12 && x.near.length >= 2);
          if (!s) break;
          lastTick = s.tick;
          await page.waitForTimeout(900);
          const targets = s.near.sort((a, b) => a.d - b.d).slice(0, 4);
          const layout = [...targets].sort((a, b) => a.id - b.id);
          if (seen.some((x) => same(x, layout))) { repeats++; continue; }
          seen.push(layout);
          const room = [];
          for (const t of targets) { const p = await probe(page, t.id); room.push(!!p && PLACES.some((k) => spot(k, p.at.w, p.at.h, { S: p.at.S, safe: p.at.safe, a: p.at.a, blocks: p.at.blocks }))); }
          if (!room.some(Boolean)) { skipped.push({ run, tick: s.tick, targets: targets.length }); continue; }
          await page.evaluate(() => window.__synesQA.floatClear());
          const r = await runBatch(page, targets.map((a, i) => ({ kind: 'damage', amount: 10 + i, actor: a.id })));
          taken++;
          batches.push({ run, tick: s.tick, warnings: s.tele, rects: targets.map((a) => Object.values(a.rect).map(Math.round)), targets: targets.map((a, i) => ({ kind: a.kind, w: Math.round(a.rect.r - a.rect.l), h: Math.round(a.rect.b - a.rect.t), roomAlone: room[i] })), created: r.delta.created, shown: r.delta.readable, dropPlace: r.delta.dropPlace, dropCap: r.delta.dropCap, retiredSafety: r.delta.retiredSafety, verdicts: r.attempts.map((a) => judge(a).v), why: r.attempts.map((a) => (a.result === 'none' ? a.why : a.result)), overlap: r.overlap });
        }
        errs += errors.length;
        await context.close();
      }
      out.sets.push({ set: 'crowd', quality: q, batches, total: batches.length, batchesWithOneShown: batches.filter((b) => b.shown >= 1).length, ineligibleMomentsSkipped: skipped, repeatedLayoutsSkipped: repeats,
        verdicts: batches.flatMap((b) => b.verdicts).reduce((o, v) => ((o[v] = (o[v] || 0) + 1), o), {}), errors: errs });
    }
  }
  fs.writeFileSync(path.join(outDir, 'control-' + ONLY.join('-') + '.json'), JSON.stringify(out, null, 2));
  for (const s of out.sets) {
    if (s.set === 'open') console.log(s.quality, 'open', `${s.shown}/10 shown`, JSON.stringify(s.oracle));
    if (s.set === 'boss') for (const m of s.moments) console.log(s.quality, 'boss tick', m.tick, 'bossTop', Math.round(m.bossRect.t), `${m.shown}/10 shown`, [...new Set(m.places)].join('/'), 'y', Math.min(...m.centreY), '-', Math.max(...m.centreY), JSON.stringify(m.oracle), JSON.stringify(m.probe));
    if (s.set === 'crowd') console.log(s.quality, 'crowd', `${s.batchesWithOneShown}/${s.total} eligible batches shown ≥1 (ineligible moments skipped ${s.ineligibleMomentsSkipped.length}, repeated layouts skipped ${s.repeatedLayoutsSkipped})`, JSON.stringify(s.verdicts), s.batches.map((b) => '[' + b.run + ']@' + b.tick + ':' + b.shown + '/' + b.targets.length + (b.warnings ? 'w' : '')).join(' '), 'overlap', s.batches.reduce((n, b) => n + b.overlap, 0), 'errors', s.errors);
  }
}

// ---------------------------------------------------------------- §10.5 / §10.6: 20 restarts and memory after clear
if (RESETS) {
  for (const q of ['medium', 'low']) {
    const { context, page, errors } = await open(q, 'seed=3&bot=1&botskills=1');
    const cdp = await context.newCDPSession(page);
    const measure = async () => {
      await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage');
      const heap = await cdp.send('Runtime.getHeapUsage'), dom = await cdp.send('Memory.getDOMCounters');
      const d = await page.evaluate(() => { const layer = document.querySelector('#floaters'), f = window.__synesQA.floaters(); return { elements: document.getElementsByTagName('*').length, floatEls: layer.querySelectorAll('.fl, .fl *, .fl-spark').length, ebars: layer.getElementsByClassName('ebar').length, live: f.live, pool: f.pool }; });
      return { heapMB: +(heap.usedSize / 1048576).toFixed(2), nodes: dom.nodes, listeners: dom.jsEventListeners, ...d };
    };
    const burst = () => page.evaluate(() => {
      const { world: w } = window.__synes, p = w.player, ids = w.actors.filter((a) => a.alive).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z)).slice(0, 10).map((a) => a.id);
      const list = []; for (let i = 0; i < 32; i++) list.push({ kind: i % 5 === 0 ? 'bonus' : 'damage', amount: 3 + i, actor: ids[i % ids.length] });
      for (const kind of ['hurt', 'heal', 'perfect', 'early']) list.push({ kind, amount: kind === 'hurt' || kind === 'heal' ? 18 : 0 });
      window.__synesQA.floatSample(list);
    });
    await page.waitForTimeout(4000);
    // A. floaters only: 20 x (burst, paint, clear), same level
    await page.evaluate(() => window.__synesQA.floatClear());
    const a0 = await measure();
    const caps = { total: 0, num: 0, status: 0, actorNum: 0, actorStatus: 0 };
    for (let i = 0; i < 20; i++) {
      await burst(); await page.waitForTimeout(300);
      const L = await page.evaluate(() => window.__synesQA.floaters().labels);
      const isNum = (l) => ['damage', 'bonus', 'hurt', 'heal'].includes(l.kind), per = (f) => Math.max(0, ...Object.values(L.filter(f).reduce((o, l) => ((o[l.actor] = (o[l.actor] || 0) + 1), o), {})));
      caps.total = Math.max(caps.total, L.length); caps.num = Math.max(caps.num, L.filter(isNum).length); caps.status = Math.max(caps.status, L.filter((l) => !isNum(l)).length);
      caps.actorNum = Math.max(caps.actorNum, per(isNum)); caps.actorStatus = Math.max(caps.actorStatus, per((l) => !isNum(l)));
      await page.evaluate(() => window.__synesQA.floatClear());
    }
    const a1 = await measure();
    // B. whole game restarts: 20 x (burst + 1 s of play, restart)
    const rows = [];
    for (let i = 0; i < 20; i++) {
      await burst(); await page.waitForTimeout(1000);
      await page.evaluate(() => document.querySelector('#btn-restart').click());
      await page.waitForFunction(() => window.__synes.state === 'playing' && window.__synes.world.tick > 3, null, { timeout: 60000 });
      if (i === 0 || i % 5 === 4) rows.push({ restart: i + 1, ...(await measure()) });
    }
    await page.evaluate(() => { window.__synesQA.freeze(); window.__synesQA.floatClear(); });
    const after = await measure();
    out.sets.push({ set: 'resets', quality: q, floatersOnly: { before: a0, after20: a1 }, maxLiveSeenInBursts: caps, gameRestarts: rows, afterFinalClear: after, errors: errors.length });
    console.log(q, 'floaters-only 20 clears', JSON.stringify({ before: a0, after: a1 }));
    console.log(q, 'caps seen in 20 bursts', JSON.stringify(caps));
    for (const r of rows) console.log(q, 'restart', r.restart, JSON.stringify(r));
    console.log(q, 'after final clear', JSON.stringify(after));
    await context.close();
  }
  fs.writeFileSync(path.join(outDir, 'resets.json'), JSON.stringify(out, null, 2));
}
// ---------------------------------------------------------------- §10.4 pictures
if (SHOTS) {
  const shots = [];
  /** place one batch and hold the labels at age 192 ms (past the pop, fully opaque) */
  const hold = (page, batch) => page.evaluate((b) => { const qa = window.__synesQA; qa.floatClear(); qa.floatAttempts(); qa.floatSample(b); for (let t = 0; t < 192; t += 16) qa.floatAdvance(16); return qa.floatAttempts().attempts; }, batch);
  const take = async (page, file, note, attempts, extra = {}) => {
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(outDir, file) });
    const f = await page.evaluate(() => window.__synesQA.floaters());
    shots.push({ file, note, tick: await page.evaluate(() => window.__synes.world.tick), paintedOverlap: f.paintedOverlap,
      labels: f.labels.map((l) => ({ kind: l.kind, text: l.text, actor: l.actor, place: l.place, age: l.age, R: l.R })),
      attempts: attempts.map((a) => ({ kind: a.kind, actor: a.actor, result: a.result, why: a.why, verdict: judge(a).v })), ...extra });
    console.log(file, attempts.map((a) => a.result).join(','), 'overlap', f.paintedOverlap);
  };
  for (const [tag, q, reduced] of [['medium', 'medium', false], ['low', 'low', false], ['reduced', 'medium', true]]) {
    {
      const { context, page } = await open(q, 'qafreeze&floatdebug&seed=5&bot=1&botskills=1&start=boss', reduced);
      await page.evaluate(() => window.__synesQA.floatRecord(true));
      const s = await quietMoment(page, async (x) => { if (!x.bossStarted || !x.near.some((a) => a.id === x.bossId)) return false; await page.waitForTimeout(900); const p = await probe(page, x.bossId); return !!p && !p.above && (p.right || p.left); });
      const atts = await hold(page, [{ kind: 'damage', amount: 28, actor: s.bossId }]);
      await take(page, 'boss-side-' + tag + '.png', 'boss: the above spot fails (head under the boss HP bar), the number sits in a free side lane', atts, { bossRect: s.near.find((a) => a.id === s.bossId).rect });
      await context.close();
    }
    {
      const { context, page } = await open(q, 'qafreeze&floatdebug&seed=3&bot=1&botskills=1', reduced);
      await page.evaluate(() => window.__synesQA.floatRecord(true));
      for (const [tick, name, note] of [[258, 'small-enemies', 'two small enemies, one number each'], [294, 'crowd', 'four enemies near the player: numbers only where a pattern passes']]) {
        let s = await scene(page);
        while (s.tick < tick) { await step(page, 3); s = await scene(page); }
        await page.waitForTimeout(900);
        const targets = s.near.sort((a, b) => a.d - b.d).slice(0, 4);
        const atts = await hold(page, targets.map((a, i) => ({ kind: 'damage', amount: 10 + i, actor: a.id })));
        await take(page, name + '-' + tag + '.png', note, atts);
        // the correct-drop picture: the four patterns at their start position for the first dropped target, from the §6.2 formulas
        const d = name === 'crowd' && tag === 'medium' ? atts.find((a) => a.result === 'none') : null;
        if (d) {
          const g = 10 * d.S, a = d.a, cx = (a.l + a.r) / 2, py = preferredY(d);
          const centres = { above: [cx, a.t - g - d.h / 2], right: [a.r + g + d.w / 2, py], left: [a.l - g - d.w / 2, py], below: [cx, a.b + g + d.h / 2] };
          const order = d.n % 2 === 1 ? PLACES : ['above', 'left', 'right', 'below'];
          const boxes = order.map((k, i) => ({ l: centres[k][0] - d.w / 2, t: centres[k][1] - d.h / 2, w: d.w, h: d.h, text: (i + 1) + ' ' + k + ': ' + (d.why.find((x) => x.startsWith(k + ':')) || '').slice(k.length + 1), i }));
          await page.evaluate(({ boxes, a }) => {
            const add = (css, text) => { const e = document.createElement('div'); e.className = 'qa-cand'; e.style.cssText = 'position:fixed;pointer-events:none;z-index:99;box-sizing:border-box;' + css; e.textContent = text || ''; document.body.appendChild(e); };
            add('left:' + a.l + 'px;top:' + a.t + 'px;width:' + (a.r - a.l) + 'px;height:' + (a.b - a.t) + 'px;border:2px solid #fff;');
            for (const b of boxes) {
              add('left:' + b.l + 'px;top:' + b.t + 'px;width:' + b.w + 'px;height:' + b.h + 'px;border:1.5px dashed #FFE066;font:bold 12px system-ui;color:#FFE066;padding:1px 3px;', String(b.i + 1));
              add('left:6px;top:' + (322 + b.i * 15) + 'px;font:11px/14px system-ui;color:#FFE066;background:rgba(0,0,0,.8);padding:0 4px;white-space:nowrap;', b.text);
            }
          }, { boxes, a });
          await take(page, 'drop-' + tag + '.png', 'correct drop: white = target body, yellow dashed = the four patterns at their start position (the two side lanes are then searched up and down within 128 px; no free height exists), red = protected', [d], { dropped: d.why, candidates: boxes });
          await page.evaluate(() => document.querySelectorAll('.qa-cand').forEach((e) => e.remove()));
        }
      }
      await context.close();
    }
  }
  fs.writeFileSync(path.join(outDir, 'shots.json'), JSON.stringify(shots, null, 2));
}

// ---------------------------------------------------------------- §10.8 stepped sequence: 120 frames = 12 s of sim, one every 3 ticks
if (SEQ) {
  const seqDir = path.resolve('tools/qa/out/dmg2-seq');
  for (const [name, qs, from] of [['roam', 'seed=3&bot=1&botskills=1', 240], ['boss', 'seed=5&bot=1&botskills=1&start=boss', 90]]) {
    const dir = path.join(seqDir, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const { context, page, errors } = await open('medium', 'qafreeze&floatdebug&' + qs);
    for (let t = (await scene(page)).tick; t < from; t = (await scene(page)).tick) await step(page, 3);
    await page.waitForTimeout(900);
    await page.evaluate(() => { window.__synesQA.floatRecord(true); window.__synesQA.floatClear(); });
    const frames = [], thumbs = [];
    const rr = (R) => R && Object.fromEntries(Object.entries(R).filter(([k]) => k !== 'k').map(([k, v]) => [k, Math.round(v)]));
    for (let i = 0; i < 120; i++) {
      await step(page, 3);
      const r = await page.evaluate(() => ({ tick: window.__synes.world.tick, f: window.__synesQA.floaters(), d: window.__synesQA.floatAttempts() }));
      const file = 'f' + String(i).padStart(3, '0') + '.png';
      const png = await page.screenshot({ path: path.join(dir, file) });
      if (i % 4 === 0) thumbs.push({ cap: file + ' · tick ' + r.tick, img: png.toString('base64') });
      frames.push({ file, tick: r.tick, ms: i * 100,
        labels: r.f.labels.map((l) => ({ kind: l.kind, text: l.text, actor: l.actor, place: l.place, age: Math.round(l.age), R: rr(l.R), painted: l.painted, readable: l.readable })),
        spawn: r.d.attempts.map((a) => ({ kind: a.kind, actor: a.actor, uid: a.uid, result: a.result, why: a.result === 'none' ? a.why : undefined, a: rr(a.a) })),
        ended: r.d.ends.map((e) => ({ uid: e.uid, cause: e.cause, why: e.why, age: e.age, readable: e.readable })) });
      if (await page.evaluate(() => window.__synes.world.finished)) break;
    }
    const overlap = await page.evaluate(() => window.__synesQA.floaters().paintedOverlap);
    await context.close();
    fs.writeFileSync(path.join(outDir, 'seq-' + name + '.json'), JSON.stringify({ name, qs, fromTick: from, stepTicks: 3, frames, paintedOverlap: overlap, errors: errors.length }));
    const sheet = await browser.newPage({ viewport: { width: 5 * 338 + 24, height: 400 }, deviceScaleFactor: 1 });
    await sheet.setContent('<style>body{margin:0;padding:8px;background:#15111f;color:#eee;font:10px system-ui;display:grid;grid-template-columns:repeat(5,338px);gap:2px 2px}figure{margin:0}img{width:338px;display:block}</style>' + thumbs.map((t) => '<figure><img src="data:image/png;base64,' + t.img + '"><figcaption>' + t.cap + '</figcaption></figure>').join(''));
    await sheet.screenshot({ path: path.join(outDir, 'seq-' + name + '-sheet.jpg'), type: 'jpeg', quality: 72, fullPage: true });
    await sheet.close();
    console.log(name, 'frames', frames.length, 'spawned', frames.reduce((n, f) => n + f.spawn.filter((x) => x.result !== 'none' && x.result !== 'cap' && x.result !== 'offscreen').length, 0), 'dropped', frames.reduce((n, f) => n + f.spawn.filter((x) => x.result === 'none').length, 0), 'overlap', overlap, 'errors', errors.length);
  }
}
await browser.close(); srv.close();
