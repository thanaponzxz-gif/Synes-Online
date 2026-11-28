// The crab is a picture only (DES-010 §5.3 item 4): the same seeded run with the same inputs (the bot, which reads only the
// sim) must give the same sim with the crab on screen as with Prismback (`?boss=old`): positions, HP, damage, phase, stuns,
// pillars, meter, victory, stats, on the same ticks.
// Usage: node tools/qa/crab-same-result.mjs [http://localhost:5181] [seed=7]
import fs from 'node:fs';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const base = process.argv[2] || 'http://localhost:5181';
const seed = process.argv[3] || '7';
const TICKS = [150, 450, 900, 1500, 2100, 2700];
const edge = process.env.SYNES_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });

async function run(which) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${base}/?ruleset=ninja-roam-1&offline&autostart&seed=${seed}&start=boss&bot=1&botskills=1${which === 'old' ? '&boss=old' : ''}`, { waitUntil: 'load' });
  await page.waitForFunction((crab) => window.__synes?.state && (!crab || window.__crabBoss?.snapshot().loaded), which === 'crab', { timeout: 120000 });
  await page.evaluate((ticks) => {
    const w = window.__synes.world, step = w.step.bind(w), D = (window.__dig = { at: {}, end: null, crab: !!window.__crabBoss?.snapshot().loaded, first: w.tick });
    const dig = () => JSON.stringify({ tick: w.tick, p: [w.player.x, w.player.z, w.player.hp], b: [w.boss.x, w.boss.z, w.boss.hp, w.boss.state, w.boss.atk, w.boss.st], phase: w.phase, started: w.bossStarted,
      pillars: w.pillars.map((p) => p.alive), tele: w.tele.map((t) => [t.id, t.atk.id, t.x, t.z, t.t]), stats: w.stats, ns: { meter: w.ns?.meter, down: w.ns?.down }, victory: w.victory, finished: w.finished });
    w.step = (inp) => { const e = step(inp); if (ticks.includes(w.tick)) D.at[w.tick] = dig(); if (w.finished && !D.end) D.end = dig(); return e; };
  }, TICKS);
  await page.waitForFunction((last) => window.__dig.end || window.__dig.at[last], TICKS[TICKS.length - 1], { timeout: 420000 }).catch(() => {});
  const out = await page.evaluate(() => window.__dig);
  await ctx.close();
  return out;
}
const old = await run('old'), crab = await run('crab');
await browser.close();
let ok = crab.crab === true && old.crab === false, n = 0;
console.log(`${ok ? 'PASS' : 'FAIL'}  one run shows the crab, the other Prismback  — crab run: ${crab.crab}, old run: ${old.crab} · hooks set at tick ${old.first} / ${crab.first}`);
for (const t of TICKS) {
  if (old.at[t] === undefined && crab.at[t] === undefined) continue;
  const same = old.at[t] === crab.at[t]; ok &&= same; n++;
  console.log(`${same ? 'PASS' : 'FAIL'}  tick ${t}: the sim is the same in both  — ${same ? old.at[t].slice(0, 150) + '…' : `old ${old.at[t]}\n      crab ${crab.at[t]}`}`);
}
if (old.end || crab.end) { const same = old.end === crab.end; ok &&= same; console.log(`${same ? 'PASS' : 'FAIL'}  the run ends the same  — ${(old.end ?? 'old run did not end').slice(0, 400)}`); }
else console.log('NOTE  neither run ended inside the time given; the ticks above are the comparison');
if (!n) { ok = false; console.log('FAIL  no tick was compared'); }
process.exit(ok ? 0 : 1);
