// DES-006 §2-4 HUD fixes (lane/hud-fixes): same-scene/same-tick shots + DOM measurements for before/after comparison.
//   node tools/qa/hud-fixes-shots.mjs <distDir> <tag> [outDir] [--only field,boss,cooldown,early,fadetip,menus,top,swatch] [--css '<extra css>']
// --css injects a style tag into every page (used to compare fade values on the same frames).
// Serves <distDir> in-process on a free port (run `npm run build` first; copy dist/ aside for the "before" build).
// Landscape 844x390 and portrait 390x844 (Q73 prototype; the rotate card is dismissed with its own button), tier medium, dpr 1
// (top-HUD crops dpr 2), seed 1, sim frozen (?qafreeze) and advanced only with __synesQA.stepTicks. Shots are JPEG q85.
// Writes <outDir>/<tag>-<scene>-<L|P>.jpg and <outDir>/<tag>-measure.json:
//   controls: ring/visual size, CSS box, real hit target found with elementFromPoint (1 px grid), neighbours' gap, cells taken by another control
//   text:     computed font sizes of the boss name, name line, HP text, potion bottles/count, cooldown number, slot/lock badges, early-dodge text
//   overlap:  HP frame vs boss frame and the other top-HUD boxes, also with simulated safe-area insets (landscape 47/47/21, portrait top 47 bottom 34)
//   tele:     per action button, share of the telegraph's pixel signal that still shows through the button (A-D)/(B-C) on the 3 boss telegraphs
// LIMITS: Chromium headless + SwiftShader, CSS animations run on wall-clock time; not a real phone (Android / iPhone not tested).
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const pos = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--only' && args[i - 1] !== '--css');
const extraCss = opt('css', '');
const [distDir, tag = 'run', outDir = 'tools/qa/out/hud-fixes'] = pos;
if (!distDir) { console.error('usage: hud-fixes-shots.mjs <distDir> <tag> [outDir] [--only ...]'); process.exit(2); }
const only = opt('only', '') ? opt('only').split(',') : null;
const want = (s) => !only || only.includes(s);
fs.mkdirSync(outDir, { recursive: true });

const root = path.resolve(distDir);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' }); res.end(fs.readFileSync(f));
});
await new Promise((r) => srv.listen(Number(process.env.SYNES_QA_PORT || 0), '127.0.0.1', r));
const base = `http://127.0.0.1:${srv.address().port}`;
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const out = { tag, dist: distDir, generatedAt: new Date().toISOString(), note: 'Chromium headless + SwiftShader; not a real device', measure: {}, tele: {}, notes: [], errors: [] };

const L = { key: 'L', size: [844, 390] }, P = { key: 'P', size: [390, 844] };
const SAFE = { L: ':root{--sl:47px!important;--sr:47px!important;--sb:21px!important}', P: ':root{--st:47px!important;--sb:34px!important}' };
/** Boss telegraph scenes: player distance in front of the boss so the warning reaches the bottom button row. */
const TELE = [['circle', 'slam', 2.5], ['fan', 'sweep', 3.5], ['dash', 'charge', 6.7]];

async function open(o, { start = '', dpr = 1, safe = false } = {}) {
  const [width, height] = o.size;
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => out.errors.push(`${o.key} ${start}: ${e.message}`));
  await page.goto(`${base}/?offline&seed=1&q=medium&autostart&qafreeze${start ? '&start=' + start : ''}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__synes?.state === 'playing' && window.__synes.world, null, { timeout: 60000 });
  if (o === P) await page.click('#btn-portrait');
  if (safe) await page.addStyleTag({ content: SAFE[o.key] });
  if (extraCss) await page.addStyleTag({ content: extraCss });
  await page.evaluate(() => window.__synesQA.stepTicks(0));
  return { ctx, page };
}
const step = (page, n) => page.evaluate((k) => window.__synesQA.stepTicks(k), n);
/** wait until the boss bar finished sliding in (its CSS transition runs on wall-clock time; SwiftShader frames are slow) */
const settleBoss = (page) => page.waitForFunction(() => { const b = document.getElementById('boss'); return b.classList.contains('show') && Math.abs(new DOMMatrix(getComputedStyle(b).transform).m42) < 0.5; }, null, { timeout: 15000 }).catch(() => out.notes.push('boss bar did not settle'));
/** QA only: keep HUD removal timers of the given lengths (ms) from firing, so a CSS animation can be frozen at a fixed time for the shot. */
const holdTimers = (page, list) => page.evaluate((list) => { const st = window.__qaST || (window.__qaST = window.setTimeout); window.setTimeout = (fn, ms, ...a) => (list.includes(ms) ? 0 : st(fn, ms, ...a)); }, list);
/** freeze every running CSS animation whose target matches `sel` (or sits inside it) at `ms` */
const freezeAnims = (page, sel, ms) => page.evaluate(([sel, ms]) => { let n = 0; for (const a of document.getAnimations()) { const t = a.effect?.target; if (t && (t.matches?.(sel) || t.closest?.(sel))) { a.pause(); a.currentTime = ms; n++; } } return n; }, [sel, ms]);
const jpg = (page, name, extra = {}) => page.screenshot({ path: path.join(outDir, `${tag}-${name}.jpg`), type: 'jpeg', quality: 85, ...extra });

/** Everything measured from the DOM in one place (runs in the page). */
function domMeasure() {
  const R = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { l: +b.left.toFixed(1), t: +b.top.toFixed(1), r: +b.right.toFixed(1), b: +b.bottom.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  const px = (v) => +parseFloat(v).toFixed(2);
  const fs = (sel) => { const el = document.querySelector(sel); return el ? px(getComputedStyle(el).fontSize) : null; };
  const ids = ['btn-attack', 'btn-skill', 'btn-skill2', 'btn-skill3', 'btn-ult', 'btn-dodge', 'btn-potion', 'btn-pause', 'btn-auto', 'btn-auto-set'];
  const els = ids.map((id) => document.getElementById(id));
  const owner = (x, y) => { const h = document.elementFromPoint(x, y); if (!h) return -1; return els.findIndex((e) => e && e.contains(h)); };
  const controls = {};
  ids.forEach((id, i) => {
    const el = els[i], b = el?.getBoundingClientRect(); if (!b || !b.width) { controls[id] = null; return; }
    // real hit target: 1 px grid over the box + 12 px margin, cells whose topmost element is this control (or its child)
    let n = 0, l = 1e9, t = 1e9, r = -1e9, bt = -1e9, stolen = 0;
    const isAct = el.classList.contains('act'), cx = b.left + b.width / 2, cy = b.top + b.height / 2, rad = b.width / 2;
    for (let y = Math.floor(b.top - 12); y <= b.bottom + 12; y++) for (let x = Math.floor(b.left - 12); x <= b.right + 12; x++) {
      const o = owner(x + 0.5, y + 0.5);
      if (o === i) { n++; if (x < l) l = x; if (y < t) t = y; if (x + 1 > r) r = x + 1; if (y + 1 > bt) bt = y + 1; }
      else if (o >= 0) { const inside = isAct ? (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= rad * rad : x >= b.left && x < b.right && y >= b.top && y < b.bottom; if (inside) stolen++; }
    }
    const cs = getComputedStyle(el);
    let visual = +b.width.toFixed(1);
    if (id === 'btn-pause' || id === 'btn-auto-set') { const s = cs.backgroundSize.split(' ')[0]; if (s.endsWith('px')) visual = px(s); }
    controls[id] = { box: R(el), visual, hitW: r - l, hitH: bt - t, hitArea: n, stolenCells: stolen, circle: isAct };
  });
  // nearest-neighbour gap between the action buttons' circles (CSS px, negative = the shapes overlap)
  const acts = ids.filter((id) => controls[id]?.circle);
  for (const a of acts) {
    const A = controls[a].box; let best = 1e9, who = '';
    for (const c of acts) { if (c === a) continue; const B = controls[c].box; const d = Math.hypot((A.l + A.r) / 2 - (B.l + B.r) / 2, (A.t + A.b) / 2 - (B.t + B.b) / 2) - A.w / 2 - B.w / 2; if (d < best) { best = d; who = c; } }
    controls[a].gap = +best.toFixed(1); controls[a].gapTo = who;
  }
  // potion count badge extends the potion button's box: distance from badge box to the dodge circle
  const badge = document.querySelector('#btn-potion .count');
  // text
  const tmp = document.createElement('div'); tmp.className = 'floater early'; tmp.textContent = 'หลบเร็วไป'; tmp.style.animation = 'none'; tmp.style.left = '-500px';
  document.getElementById('floaters').appendChild(tmp); const early = { fontSize: px(getComputedStyle(tmp).fontSize), bg: getComputedStyle(tmp).backgroundColor, stroke: getComputedStyle(tmp).webkitTextStrokeWidth }; tmp.remove();
  const textRect = (sel) => { const el = document.querySelector(sel); if (!el || !el.firstChild) return null; const rg = document.createRange(); rg.selectNodeContents(el); return R(rg); };
  const text = {
    bossName: fs('#boss-name'), bossNameRect: textRect('#boss-name'), nameLine: fs('.who'), hpText: fs('#hp-text'), hpTextRect: textRect('#hp-text'),
    hpTrough: R(document.querySelector('.bar.hp .trough')), potionBottle: (() => { const s = document.querySelector('#potions svg'); return s ? +s.getBoundingClientRect().height.toFixed(1) : null; })(),
    potionCount: fs('#btn-potion .count'), cooldownNum: fs('#btn-skill .cdnum'), slotBadge: fs('#btn-skill .slot'), ultLabel: fs('#btn-ult .lbl'), early,
    timer: fs('#timer'), chip: fs('#net-chip'), hint: fs('#hint'),
  };
  // top HUD boxes and their overlaps
  const box = {
    hpFrame: R(document.querySelector('.bar.hp')), nameLine: R(document.querySelector('.who')), potions: R(document.getElementById('potions')), topLeft: R(document.getElementById('top-left')),
    boss: R(document.getElementById('boss')), bossFrame: R(document.querySelector('.bar.boss')), bossName: text.bossNameRect, topRight: R(document.getElementById('top-right')),
    chip: R(document.getElementById('net-chip')), timer: R(document.getElementById('timer')), pause: R(document.getElementById('btn-pause')),
    hint: document.getElementById('hint').classList.contains('show') ? R(document.getElementById('hint')) : null, potionBadge: R(badge),
  };
  const ov = (a, b) => (!a || !b) ? null : { x: +Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)).toFixed(1), y: +Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t)).toFixed(1), gapX: +Math.max(b.l - a.r, a.l - b.r).toFixed(1) };
  const bossShown = document.getElementById('boss').classList.contains('show');
  const overlap = bossShown ? {
    hpFrame_bossFrame: ov(box.hpFrame, box.bossFrame), topLeft_boss: ov(box.topLeft, box.boss), nameLine_boss: ov(box.nameLine, box.boss), potions_boss: ov(box.potions, box.boss),
    bossName_topLeft: ov(box.bossName, box.topLeft), bossName_topRight: ov(box.bossName, box.topRight), topRight_boss: ov(box.topRight, box.boss), hint_boss: ov(box.hint, box.boss),
    chip_boss: ov(box.chip, box.boss), timer_boss: ov(box.timer, box.boss), pause_boss: ov(box.pause, box.boss), bossName_chip: ov(box.bossName, box.chip),
  } : null;
  const nameAboveTrough = box.nameLine && text.hpTrough ? +(text.hpTrough.t - box.nameLine.b).toFixed(1) : null;
  return { viewport: [innerWidth, innerHeight], controls, text, box, overlap, bossShown, nameAboveTrough, faded: [...document.querySelectorAll('.seethru')].map((e) => e.id) };
}

/** Telegraph signal under each action button: A = HUD+tele, D = HUD no tele, C = no HUD no tele, B = no HUD + tele (all PNG, same frame). */
async function teleRetention(page) {
  const setTele = (v) => page.evaluate((v) => { for (const tv of window.__synes.view.teles.values()) tv.m.visible = v; }, v);
  const setHud = (v) => page.evaluate((v) => { document.getElementById('hud').style.visibility = v ? '' : 'hidden'; }, v);
  const settle = () => page.waitForTimeout(120);
  const A = await page.screenshot(); await setTele(false); await settle(); const D = await page.screenshot();
  await setHud(false); await settle(); const C = await page.screenshot(); await setTele(true); await settle(); const B = await page.screenshot(); await setHud(true); await settle();
  return page.evaluate(async ([a, b, c, d]) => {
    const load = async (s) => { const img = new Image(); img.src = 'data:image/png;base64,' + s; await img.decode(); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0); return g.getImageData(0, 0, cv.width, cv.height).data; };
    const [A, B, C, D] = await Promise.all([a, b, c, d].map(load));
    const W = innerWidth, res = {};
    for (const id of ['btn-skill', 'btn-skill2', 'btn-skill3', 'btn-ult', 'btn-attack', 'btn-dodge', 'btn-potion']) {
      const el = document.getElementById(id), bb = el.getBoundingClientRect(), cx = bb.left + bb.width / 2, cy = bb.top + bb.height / 2, rr = bb.width / 2;
      const sig = []; let sHud = 0, sRaw = 0;
      for (let y = Math.floor(bb.top); y < bb.bottom; y++) for (let x = Math.floor(bb.left); x < bb.right; x++) {
        if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 > rr * rr || x < 0 || y < 0 || x >= W || y >= innerHeight) continue;
        const i = (y * W + x) * 4; const raw = Math.abs(B[i] - C[i]) + Math.abs(B[i + 1] - C[i + 1]) + Math.abs(B[i + 2] - C[i + 2]);
        if (raw < 30) continue; const hud = Math.abs(A[i] - D[i]) + Math.abs(A[i + 1] - D[i + 1]) + Math.abs(A[i + 2] - D[i + 2]);
        sig.push([raw, hud]); sRaw += raw; sHud += hud;
      }
      sig.sort((p, q) => q[0] - p[0]); const top = sig.slice(0, Math.max(1, Math.ceil(sig.length * 0.15)));
      const eRaw = top.reduce((s, p) => s + p[0], 0), eHud = top.reduce((s, p) => s + p[1], 0);
      res[id] = { telePx: sig.length, faded: el.classList.contains('seethru'), retention: sig.length ? +(sHud / sRaw).toFixed(3) : null, edgeRetention: sig.length ? +(eHud / eRaw).toFixed(3) : null };
    }
    return res;
  }, [A, B, C, D].map((x) => x.toString('base64')));
}

async function bossScene(o, atk, d) {
  const { ctx, page } = await open(o, { start: 'boss' });
  const got = await page.evaluate(([atk, d]) => { const { world } = window.__synes; const { player, boss } = world; player.x = boss.x; player.z = boss.z + d; player.fx = 0; player.fz = -1;
    for (let i = 0; i < 60 && !world.bossStarted; i++) window.__synesQA.stepTicks(1, false);
    if (!atk) { window.__synesQA.stepTicks(15); return { tick: world.tick }; }
    world.bossNext = atk; let n = 0; for (; n < 200 && !world.tele.some((t) => t.owner === world.boss.id && t.atk.id === atk); n++) window.__synesQA.stepTicks(1, false);
    window.__synesQA.stepTicks(12); const t = world.tele.find((x) => x.owner === world.boss.id);
    return { tick: world.tick, atk: t?.atk.id ?? null, fill: t ? +(1 - t.t / t.total).toFixed(2) : null, player: [+(player.x - boss.x).toFixed(2), +(player.z - boss.z).toFixed(2)] }; }, [atk, d]);
  await settleBoss(page); await page.waitForTimeout(300); // boss bar slide-in + button fade transition
  return { ctx, page, got };
}

try {
  for (const o of [L, P]) {
    const M = (out.measure[o.key] = {});
    if (want('field')) { // field opening: HUD at rest, Q21 sizes and hit targets
      const { ctx, page } = await open(o);
      await step(page, 30); await page.waitForTimeout(300);
      M.field = await page.evaluate(domMeasure); await jpg(page, `field-${o.key}`);
      await ctx.close();
    }
    if (want('menus')) { // pause + Auto panel (field, Auto is hidden in the boss area)
      const { ctx, page } = await open(o);
      await step(page, 10);
      await page.click('#btn-pause'); await page.waitForTimeout(350);
      M.pause = await page.evaluate(() => { const R = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return { l: b.left, t: b.top, w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
        return { card: R('#paused .card'), sound: R('#chk-sound'), soundLabel: R('label:has(#chk-sound)'), role: document.getElementById('chk-sound').getAttribute('role'), cardOverflow: document.querySelector('#paused .card').scrollHeight - document.querySelector('#paused .card').clientHeight }; });
      await jpg(page, `pause-${o.key}`);
      await page.click('#btn-resume'); await page.waitForTimeout(200);
      await page.click('#btn-auto-set'); await page.waitForTimeout(350);
      M.autoPanel = await page.evaluate(() => { const R = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return { l: b.left, t: b.top, w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
        const keep = document.getElementById('ap-keep'); keep.focus({ focusVisible: true });
        return { card: R('#auto-panel .card'), keep: R('#ap-keep'), keepLabel: R('label:has(#ap-keep)'), role: keep.getAttribute('role'), focusOutline: getComputedStyle(keep).outlineStyle + ' ' + getComputedStyle(keep).outlineWidth, cardScroll: document.querySelector('#auto-panel .card').scrollHeight > document.querySelector('#auto-panel .card').clientHeight + 1 }; });
      await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab'); await page.waitForTimeout(150); // keyboard focus ring on the switch
      await jpg(page, `autopanel-${o.key}`);
      await ctx.close();
    }
    if (want('top')) { // Q41/42/44: boss fight top HUD, with and without simulated safe-area insets; dpr 2 crops
      for (const safe of [false, true]) {
        const [w] = o.size;
        const { ctx, page } = await open(o, { start: 'boss', dpr: 2, safe });
        await page.evaluate(() => { const { world } = window.__synes; const { player, boss } = world; player.x = boss.x; player.z = boss.z + 6.7; for (let i = 0; i < 60 && !world.bossStarted; i++) window.__synesQA.stepTicks(1, false); world.player.hp = 74; world.ps.potions = 1; window.__synesQA.stepTicks(15); });
        await settleBoss(page); await page.waitForTimeout(200);
        M[safe ? 'topSafe' : 'top'] = await page.evaluate(domMeasure);
        await jpg(page, `top${safe ? '-safe' : ''}-${o.key}`, { clip: { x: 0, y: 0, width: w, height: o === L ? 72 : 150 } });
        await ctx.close();
      }
    }
    if (want('boss')) for (const [name, atk, d] of TELE) { // Q72: warnings under the bottom row
      const { ctx, page, got } = await bossScene(o, atk, d);
      M['boss-' + name] = { got, ...(await page.evaluate(domMeasure)) };
      await jpg(page, `boss-${name}-${o.key}`);
      out.tele[`${o.key}-${name}`] = { got, buttons: await teleRetention(page) };
      await ctx.close();
    }
    if (want('cooldown')) { // Q33 cooldown look, Q30 pressing a skill that is not ready
      const { ctx, page } = await open(o);
      await page.evaluate(() => { const w = window.__synes.world; w.player.hp = 70; });
      for (const k of ['Digit1', 'Digit2', 'Digit3']) { await page.keyboard.press(k); await step(page, 32); }
      await page.keyboard.press('KeyQ'); await step(page, 4);
      await page.waitForTimeout(300);
      M.cooldown = await page.evaluate(() => ({ cd: [1, 2, 3].map((s) => +window.__synes.world.skillCooldown(s).remaining.toFixed(2)), cls: ['btn-skill', 'btn-skill2', 'btn-skill3'].map((id) => document.getElementById(id).className) }));
      await jpg(page, `cooldown-${o.key}`);
      // press skill 2 (cooling) with a real pointer: feedback must appear on the button, no skill event
      const b = await page.evaluate(() => { const r = document.getElementById('btn-skill2').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      const cdBefore = await page.evaluate(() => window.__synes.world.ps.cdT[1]);
      await holdTimers(page, [400]);
      await page.mouse.move(b[0], b[1]); await page.mouse.down();
      const clsAtPress = await page.evaluate(() => document.getElementById('btn-skill2').className);
      const frozen = await freezeAnims(page, '#btn-skill2', 70); // the edge flash peak of the 0.34 s feedback
      await jpg(page, `denied-${o.key}`);
      await page.mouse.up(); await step(page, 3);
      // the press reached the sim (it is in the input log) but started nothing: no cast, cooldown just kept ticking down
      M.denied = await page.evaluate((cdBefore) => { const w = window.__synes.world; return { clsAtPress: '', cdTicksBefore: cdBefore, cdTicksAfter3: w.ps.cdT[1], cast: w.ps.cast ? w.ps.cast.slot : null, qaLogTail: window.__synesQA.log.slice(-2) }; }, cdBefore);
      M.denied.clsAtPress = clsAtPress; M.denied.frozenAnimations = frozen;
      await ctx.close();
    }
    if (want('early')) { // Q29/Q31: "หลบเร็วไป" in the middle of the slam circle
      const { ctx, page } = await open(o, { start: 'boss' });
      const got = await page.evaluate(() => { const { world } = window.__synes; const { player, boss } = world; player.x = boss.x; player.z = boss.z + 2.5; player.fx = 0; player.fz = -1;
        for (let i = 0; i < 60 && !world.bossStarted; i++) window.__synesQA.stepTicks(1, false);
        world.bossNext = 'slam'; let n = 0; for (; n < 200 && !world.tele.some((t) => t.owner === world.boss.id && t.atk.id === 'slam'); n++) window.__synesQA.stepTicks(1, false);
        return { n }; });
      await holdTimers(page, [900, 1300]); // floaters stay so they can be frozen 0.5 s into their animation
      await page.keyboard.press('KeyK'); // dodge right away: i-frames end long before the slam lands
      const hit = await page.evaluate(() => { const w = window.__synes.world, hp0 = w.player.hp; let n = 0; for (; n < 80 && w.player.hp === hp0; n++) window.__synesQA.stepTicks(1, n % 6 === 5); window.__synesQA.stepTicks(1); return { n, hp: w.player.hp, early: window.__synesQA.log.filter((e) => e.e === 'dodge-early').length }; });
      const frozen = await freezeAnims(page, '.floater', 500); await page.waitForTimeout(150);
      M.early = { got, hit, frozenAt: 500, frozen, count: await page.evaluate(() => document.querySelectorAll('.floater.early').length) };
      await jpg(page, `early-${o.key}`);
      await ctx.close();
    }
    if (want('fadetip')) { // Q32: first-time hint that faded buttons still work (waits for the opening hint to expire on wall-clock time)
      const { ctx, page, got } = await bossScene(o, 'charge', 6.7); // the dash line fades bottom buttons in both orientations
      let seen = null;
      for (let i = 0; i < 50 && !seen; i++) { await page.waitForTimeout(500); seen = await page.evaluate(() => { const h = document.getElementById('hint'); return h.classList.contains('show') && /ยังกดได้/.test(h.textContent) ? h.textContent : null; }); }
      M.fadetip = { got, seen };
      if (seen) await jpg(page, `fadetip-${o.key}`); else out.notes.push(`${o.key}: no faded-button hint seen in 25 s`);
      await ctx.close();
    }
    if (want('swatch') && o === L) { // "หลบเร็วไป" 22 px on flat colours (palette, ground, warning orange/red), frozen 0.5 s into its animation
      const { ctx, page } = await open(o);
      await page.evaluate(() => {
        const host = document.createElement('div'); host.id = 'qa-swatch'; host.style.cssText = 'position:fixed;left:0;top:0;width:844px;height:120px;display:grid;grid-template-columns:repeat(8,1fr);z-index:99';
        for (const c of ['#ffffff', '#5cf2e6', '#ffc857', '#ff9ec7', '#ff7a1a', '#ff3355', '#6b8f4e', '#1d2340']) {
          const cell = document.createElement('div'); cell.style.cssText = `position:relative;background:${c}`;
          const f = document.createElement('div'); f.className = 'floater early'; f.textContent = 'หลบเร็วไป'; f.style.left = '50%'; f.style.top = '70%'; f.style.animationPlayState = 'paused'; f.style.animationDelay = '-0.5s';
          cell.appendChild(f); host.appendChild(cell);
        }
        document.body.appendChild(host);
      });
      await page.waitForTimeout(200);
      await jpg(page, 'swatch-early', { clip: { x: 0, y: 0, width: 844, height: 120 } });
      await ctx.close();
    }
  }
} finally { await browser.close(); srv.close(); }
fs.writeFileSync(path.join(outDir, `${tag}-measure.json`), JSON.stringify(out, null, 1));
console.log(`done ${tag}: errors ${out.errors.length}, notes ${out.notes.length}`);
