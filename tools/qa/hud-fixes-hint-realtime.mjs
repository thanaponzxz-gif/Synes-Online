// Real-time check (no ?qafreeze): does the opening "ลากนิ้ว…" hint really stay up into the boss arena, as the frozen R0 baseline shots show?
//   node tools/qa/hud-fixes-hint-realtime.mjs <distDir> [outJson]
// Two runs at 844x390, medium, seed 1, the built-in bot playing in real time: (1) a normal start from the camp until the boss fight has run
// 5 s; (2) ?start=boss (QA shortcut that spawns at the spring right before the arena). Samples the hint box every 250 ms of wall-clock time.
// LIMITS: Chromium headless + SwiftShader (slow frames; the sim keeps real time up to 8 ticks per frame), bot input, not a phone.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const [distDir, outJson] = process.argv.slice(2);
if (!distDir) { console.error('usage: hud-fixes-hint-realtime.mjs <distDir> [outJson]'); process.exit(2); }
const root = path.resolve(distDir);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${srv.address().port}`;
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const result = { note: 'real time, bot input, Chromium headless + SwiftShader', runs: {} };

async function run(name, query, maxWallS) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${base}/?offline&seed=1&q=low&bot=1&${query}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__synes?.state === 'playing' && window.__synes.world, null, { timeout: 60000 });
  const t0 = Date.now(), samples = []; let bossAt = null;
  while ((Date.now() - t0) / 1000 < maxWallS) {
    const s = await page.evaluate(() => { const w = window.__synes.world, h = document.getElementById('hint');
      return { tick: w.tick, boss: w.bossStarted, z: +w.player.z.toFixed(1), show: h.classList.contains('show'), text: h.textContent.slice(0, 28) }; });
    s.wall = +((Date.now() - t0) / 1000).toFixed(2); samples.push(s);
    if (s.boss && bossAt === null) bossAt = s;
    if (bossAt && s.wall - bossAt.wall > 5) break;
    await page.waitForTimeout(250);
  }
  const moveShown = samples.filter((s) => s.show && s.text.includes('ลากนิ้ว'));
  const lastMove = moveShown.at(-1) ?? null;
  const atBoss = bossAt ? samples.filter((s) => s.wall >= bossAt.wall) : [];
  result.runs[name] = {
    query, samples: samples.length, moveHintLastSeen: lastMove && { wall: lastMove.wall, simS: +(lastMove.tick / 30).toFixed(1), z: lastMove.z },
    bossStarted: bossAt && { wall: bossAt.wall, simS: +(bossAt.tick / 30).toFixed(1) },
    moveHintDuringBoss: atBoss.some((s) => s.show && s.text.includes('ลากนิ้ว')),
    hintsDuringBoss: [...new Set(atBoss.filter((s) => s.show).map((s) => s.text))],
    // one row per change of the hint box (shown/hidden or new text): when it started and the last sample before the next change
    timeline: samples.reduce((rows, s) => { const k = `${s.show}|${s.text}`, last = rows.at(-1);
      if (last && last.k === k) { last.toWall = s.wall; last.toSimS = +(s.tick / 30).toFixed(1); } else rows.push({ k, fromWall: s.wall, fromSimS: +(s.tick / 30).toFixed(1), toWall: s.wall, toSimS: +(s.tick / 30).toFixed(1), show: s.show, boss: s.boss, text: s.text });
      return rows; }, []).map(({ k, ...r }) => r),
  };
  console.log(name, JSON.stringify({ moveHintLastSeen: result.runs[name].moveHintLastSeen, bossStarted: result.runs[name].bossStarted, moveHintDuringBoss: result.runs[name].moveHintDuringBoss }));
  await ctx.close();
}
try {
  await run('from-camp', '', 150);
  await run('start-boss', 'start=boss', 60);
} finally { await browser.close(); srv.close(); }
if (outJson) fs.writeFileSync(outJson, JSON.stringify(result, null, 1));
