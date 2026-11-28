// Lifecycle of the crab picture (DES-010 §5.3 item 8) and its fallback:
//  A. 20 x (new round -> into the arena -> phase 2 -> death) with the crab, against the same 20 rounds with `?boss=old`:
//     one live instance at any time, and no geometries / textures / programs beyond what the level itself leaves with the old boss.
//  B. a wrong file (the two-clip C0 preview pair served as the boss) is refused: the old boss stays, and the label says so.
//     Needs a second dev server whose boss stem is the C0 pair:  SYNES_BOSS_STEM=mon_boss_crab_preview_v01 ... --port 5182
// Usage: node tools/qa/crab-lifecycle.mjs [http://localhost:5181] [http://localhost:5182 | none] [rounds=20]
// Emulated Chromium + SwiftShader on a PC: not a phone result.
import fs from 'node:fs';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const base = process.argv[2] || 'http://localhost:5181';
const wrong = process.argv[3] || 'none';
const rounds = +(process.argv[4] || 20);
const edge = process.env.SYNES_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });

async function open(url, crab) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction((c) => window.__synes?.state === 'playing' && (!c || window.__crabBoss), crab, { timeout: 120000 });
  return { ctx, page, errors };
}
const mem = (page) => page.evaluate(() => { const i = window.__synes.view.renderer.info; return { geometries: i.memory.geometries, textures: i.memory.textures, programs: i.programs?.length ?? 0 }; });
/** one round: walk in, wait for the fight, phase 2 by hand, a few frames of it, death by hand (as the sim's own death sets it), restart */
async function round(page) {
  await page.evaluate(async () => {
    const S = window.__synes, frames = (n) => new Promise((r) => { const f = () => (--n <= 0 ? r() : requestAnimationFrame(f)); f(); });
    const w = S.world, t = w.level.boss.trigger;
    w.player.x = t.x; w.player.z = t.z;
    for (let i = 0; i < 200 && !w.bossStarted; i++) await frames(1);
    for (let i = 0; i < 400 && w.boss.state === 'intro'; i++) { w.player.hp = w.player.maxHp; await frames(1); }
    w.boss.hp = Math.floor(w.boss.maxHp * 0.4);
    for (let i = 0; i < 25; i++) { w.player.hp = w.player.maxHp; await frames(1); }
    const b = w.boss; b.hp = 0; b.alive = false; b.deadT = 0; b.state = 'dead'; w.tele = w.tele.filter((x) => x.owner !== b.id);
    await frames(12);
  });
  await page.click('#btn-pause'); await page.click('#btn-restart');
  await page.waitForFunction(() => window.__synes?.state === 'playing' && window.__synes.world.tick < 30, null, { timeout: 60000 });
  await page.waitForTimeout(120);
}

const q = '/?ruleset=ninja-roam-1&offline&autostart&seed=7&start=boss';
const grow = {};
for (const which of ['old', 'crab']) {
  const { ctx, page, errors } = await open(base + q + (which === 'old' ? '&boss=old' : ''), which === 'crab');
  await round(page); // the first round settles one-time allocations
  const a = await mem(page), live = [];
  let mid = a;
  for (let i = 0; i < rounds; i++) { await round(page); if (i + 1 === rounds >> 1) mid = await mem(page); if (which === 'crab') live.push(await page.evaluate(() => window.__crabBoss.snapshot().live)); }
  const b = await mem(page);
  // measured over the second half: the crab's own one-time buffers (its meshes, the two effect batches, the depth-only fade pass) are
  // first drawn at different moments of the first rounds, so the first half mixes one-time uploads with what a round leaves behind
  grow[which] = { geometries: b.geometries - mid.geometries, textures: b.textures - mid.textures, programs: b.programs - mid.programs };
  console.log(`${which}: over ${rounds} rounds  geometries ${a.geometries} -> ${b.geometries} · textures ${a.textures} -> ${b.textures} · programs ${a.programs} -> ${b.programs} · at half: ${mid.geometries} geo ${mid.textures} tex ${mid.programs} prog`);
  if (which === 'crab') {
    check(`crab: one live instance after every one of ${rounds} restarts`, live.every((n) => n === 1), `live counts: ${[...new Set(live)].join(', ')}`);
    const s = await page.evaluate(() => window.__crabBoss.snapshot());
    check('crab: still loaded and accepted after the restarts', s.loaded && s.accepted);
  }
  check(`${which}: no page errors over ${rounds} rounds`, errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}
check(`crab: over the last ${rounds - (rounds >> 1)} rounds it adds no geometries / textures / programs beyond what the level leaves with the old boss`,
  // The level itself leaves 11-13 geometries per restart with either boss (its own props are not freed: not the crab's code, reported
  // to the PM). How many of them were uploaded depends on what came on screen in that round, so two level pieces per round are allowed.
  // A probe of the geometries left after 3 rounds (2026-11-28) found none of the crab's: only level pieces, in both modes.
  grow.crab.geometries <= grow.old.geometries + 2 * (rounds - (rounds >> 1)) && grow.crab.textures <= grow.old.textures && grow.crab.programs <= grow.old.programs,
  `crab +${grow.crab.geometries} geo +${grow.crab.textures} tex +${grow.crab.programs} prog · old +${grow.old.geometries} geo +${grow.old.textures} tex +${grow.old.programs} prog`);

if (wrong !== 'none') {
  const { ctx, page, errors } = await open(wrong + q, true);
  const s = await page.evaluate(() => ({ snap: window.__crabBoss.snapshot(), label: document.querySelector('#boss-qa')?.textContent ?? '', oldVisible: (() => { const S = window.__synes; return S.view.actorNode(S.world.boss.id).visible; })(), crabInScene: !!window.__synes.view.scene.getObjectByName('crab-boss') }));
  check('wrong file (C0 two-clip pair as the boss): refused', s.snap.loaded === false, s.snap.why);
  check('wrong file: the old boss stays on screen and no crab is in the scene', s.oldVisible === true && !s.crabInScene);
  check('wrong file: the label says it is the fallback', /สำรอง/.test(s.label), s.label);
  check('wrong file: no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
} else console.log('NOTE  wrong-file run skipped (no second dev server given)');
await browser.close();
const fail = results.filter((r) => !r).length;
console.log(`\n${results.length - fail}/${results.length} passed`);
process.exit(fail ? 1 : 0);
