// QA for the crab picture of the boss in `ninja-roam-1` (DES-010 §5.3, the parts a PC can do): the C1 file is shown in place of
// Prismback, each of the ten clips is caught in its own sim state, the effects are caught on the tick the warning really ran
// out, and the draw calls of that frame are counted with and without the effect batches (ceiling +2 Medium / +1 Low).
// Needs the vite dev server with the private inbox:  SYNES_SEYRIN_DIR=<inbox> npx vite --port 5181 --strictPort
// Usage: node tools/qa/crab-boss.mjs [http://localhost:5181] [screenshotDir] [low|medium] [WxH]
// The pictures show a private REVIEW model: keep them out of git (default tools/qa/out/crab-boss, which is ignored).
// The script keeps the player alive, walks them into the arena and (where said) sets the boss's HP or state by hand to stage
// a moment: a picture test, not a rules test. Emulated Chromium + SwiftShader on a PC: not a phone result.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const base = process.argv[2] || 'http://localhost:5181';
const shots = process.argv[3] || 'tools/qa/out/crab-boss';
const tier = process.argv[4] || 'medium';
const [VW, VH] = (process.argv[5] || '844x390').split('x').map(Number);
const ceiling = tier === 'low' ? 1 : 2;
const tag = `${tier}-${VW}x${VH}`;
fs.mkdirSync(shots, { recursive: true });
const edge = process.env.SYNES_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const note = (text) => console.log(`NOTE  ${text}`);
const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
const page = await ctx.newPage(), errors = [];
page.on('pageerror', (e) => errors.push(e.message));
// slow motion (as tools/qa/ninja-fx.mjs): software rendering makes a frame last several sim ticks; at 1/5 speed every tick is drawn
await page.addInitScript(() => {
  const S = 0.2, raf = window.requestAnimationFrame.bind(window), now = performance.now.bind(performance), t0 = now();
  window.requestAnimationFrame = (cb) => raf((n) => cb(t0 + (n - t0) * S));
  performance.now = () => t0 + (now() - t0) * S;
});
await page.addInitScript((t) => { try { localStorage.setItem('synes.quality', t); } catch { /* storage blocked */ } }, tier);
await page.goto(`${base}/?ruleset=ninja-roam-1&offline&autostart&seed=7&start=boss`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__synes?.state === 'playing' && window.__crabBoss, null, { timeout: 120000 });
await page.waitForTimeout(600);

const snap0 = await page.evaluate(() => window.__crabBoss.snapshot());
check('the C1 file is loaded and accepted by the boss checker', snap0.loaded && snap0.accepted, snap0.loaded ? `${snap0.stats.tris} tris · ${snap0.stats.joints} joints · ${snap0.stats.clips.length} clips · ${snap0.stats.bytes} bytes` : snap0.why);
if (!snap0.loaded) { console.log('the old boss stays on screen (fallback); nothing else to check'); await browser.close(); process.exit(1); }
check('every delivery rule of the checker passes', snap0.failedChecks.length === 0, snap0.failedChecks.join(', ') || 'none failed');
check('the label on screen says it is a REVIEW file', await page.evaluate(() => /REVIEW/.test(document.querySelector('#boss-qa')?.textContent ?? '')), await page.evaluate(() => document.querySelector('#boss-qa')?.textContent));

// in the page: every frame keep the player alive and where the script wants them; when a staged moment comes, grab that frame
await page.evaluate(() => {
  const Q = (window.__cq = { want: [], got: {}, hold: null, seen: {}, maxInst: 0, maxLines: 0, weightBad: 0, frames: 0, impactLate: [], worstCalls: null });
  const loop = () => {
    requestAnimationFrame(loop);
    const S = window.__synes, w = S.world, b = w.boss, c = window.__crabBoss.snapshot();
    w.player.hp = w.player.maxHp;
    if (Q.hold) { const h = Q.hold(w, b); if (h) { w.player.x = h[0]; w.player.z = h[1]; } }
    Q.frames++;
    Q.maxInst = Math.max(Q.maxInst, c.instances); Q.maxLines = Math.max(Q.maxLines, c.lineTris);
    const sum = c.poses.reduce((s, p) => s + p.weight, 0);
    if (c.poses.length && Math.abs(sum - 1) > 1e-6) Q.weightBad++;
    for (const p of c.poses) if (p.weight > 0.5) Q.seen[p.clip] = (Q.seen[p.clip] ?? 0) + 1;
    const top = c.poses.slice().sort((x, y) => y.weight - x.weight)[0] ?? null;
    for (let i = Q.want.length - 1; i >= 0; i--) {
      const m = Q.want[i];
      if (!new Function('w', 'b', 'c', 'top', 'return ' + m.when)(w, b, c, top)) continue;
      Q.want.splice(i, 1);
      const calls = window.__crabBoss.calls(); // renders this frame twice more: with the effect batches, then without
      S.view.renderer.render(S.view.scene, S.view.camera);
      const cv = S.view.renderer.domElement, pr = cv.width / cv.clientWidth, at = { x: 0, y: 0, vis: false };
      S.view.project(b.x, 1.4, b.z, at);
      const zoom = document.createElement('canvas'); zoom.width = 780; zoom.height = 600;
      const g2 = zoom.getContext('2d');
      g2.drawImage(cv, (at.x - 195) * pr, (at.y - 170) * pr, 390 * pr, 300 * pr, 0, 0, 780, 600);
      Q.got[m.name] = { png: cv.toDataURL('image/png'), zoom: zoom.toDataURL('image/png'), calls, tick: c.tick, state: c.state, top, poses: c.poses, opacity: c.opacity, occl: c.occl, extraDraws: c.extraDraws, sweepWidth: c.sweepWidth, fx: c.fx, lineTris: c.lineTris, instances: c.instances, tracks: c.tracks, visible: c.visible, stars: S.view.actors.get(b.id)?.stars.visible ?? null, total: S.view.renderer.info.render.calls };
    }
  };
  requestAnimationFrame(loop);
});
const stage = (list) => page.evaluate((l) => { window.__cq.want.push(...l); }, list);
const hold = (src) => page.evaluate((s) => { window.__cq.hold = s ? new Function('w', 'b', 'return ' + s) : null; }, src);
const got = async (name, timeout = 90000) => {
  await page.waitForFunction((n) => window.__cq.got[n], name, { timeout }).catch(() => {});
  const g = await page.evaluate((n) => window.__cq.got[n] ?? null, name);
  if (g) fs.writeFileSync(path.join(shots, `${tag}-${name}.png`), Buffer.from(g.png.split(',')[1], 'base64'));
  if (g) fs.writeFileSync(path.join(shots, `${tag}-${name}-zoom.png`), Buffer.from(g.zoom.split(',')[1], 'base64'));
  return g;
};
const delta = (g) => g.calls.withFx - g.calls.without;
const fmt = (g) => (g ? `tick ${g.tick.toFixed(1)} · ${g.top?.clip} @${g.top ? (g.top.time * 30).toFixed(1) : '-'} · lines ${g.lineTris} tris · ${g.instances} inst · +${delta(g)} draw` : 'not seen');

// ---- 1. walk in: intro (roar clip), then stand / walk
await hold('[w.level.boss.trigger.x, w.level.boss.trigger.z]');
await stage([
  { name: '01-intro-roar', when: "c.state && c.state.state === 'intro' && top && top.clip === 'roar' && top.time > 0.5" },
  { name: '02-walk', when: "c.state && c.state.state === 'approach' && top && top.clip === 'walk' && top.weight > 0.95" },
]);
await page.waitForFunction(() => window.__synes.world.bossStarted, null, { timeout: 30000 }).catch(() => {});
// stand still some way from the boss so it walks to the player
await hold('w.tick < 0 ? null : (window.__cq.spot ??= [w.player.x, w.player.z])');
let g = await got('01-intro-roar');
check('intro: the roar clip plays over the real intro state', !!g && g.visible, fmt(g));
g = await got('02-walk');
check('walk: the walk clip shows while the boss really moves', !!g, fmt(g));
const at = await page.evaluate(() => window.__crabBoss.snapshot());
check('the crab is attached under the boss actor and the old model is hidden', at.attached && await page.evaluate(() => { const S = window.__synes; return S.view.actorNode(S.world.boss.id).visible === false; }));

// ---- 2. the four moves, each caught on its own state; effects on the tick the warning really ran out
const moves = [
  { name: '03-sweep-windup', when: "b.state === 'windup' && b.atk === 'sweep' && top && top.clip === 'sweep' && top.time > 0.55 && top.time < 0.9" },
  { name: '04-sweep-impact', when: "c.tracks.some((k) => k.atk === 'sweep' && k.impact === true && c.tick >= k.impactTick && c.tick - k.impactTick < 2.5)" },
  { name: '05-slam-windup', when: "b.state === 'windup' && b.atk === 'slam' && top && top.clip === 'slam' && top.time > 0.55 && top.time < 0.9" },
  { name: '06-slam-impact', when: "c.tracks.some((k) => k.atk === 'slam' && k.impact === true && c.tick >= k.impactTick && c.tick - k.impactTick < 2.5)" },
  { name: '07-charge-windup', when: "b.state === 'windup' && b.atk === 'charge' && top && top.clip === 'charge_windup' && top.time > 0.5" },
  { name: '08-charge', when: "top && top.clip === 'charge' && top.weight > 0.95 && c.instances >= 2" },
];
await stage(moves);
// far from the boss it prefers the charge (the sim's own weights): after the close moves, stand across the arena from it
const FAR = "(() => { const A = [-2, -67.5], B = [-2, -84.5]; if (b.state === 'windup' || b.state === 'charge') return window.__cq.far ?? A; return (window.__cq.far = Math.hypot(b.x - A[0], b.z - A[1]) > 8.5 ? A : B); })()";
for (const m of moves) {
  if (m.name === '07-charge-windup') await hold(FAR);
  g = await got(m.name, 240000);
  check(`${m.name}: seen in its own sim state`, !!g, fmt(g));
  if (g && /impact/.test(m.name)) {
    const atk = m.name.includes('sweep') ? 'sweep' : 'slam';
    const top = g.poses.find((p) => p.clip === atk);
    check(`${atk}: on screen the pose is at or just past marker 30 when the effect shows`, !!top && top.time * 30 >= 30 - 1e-6 && top.time * 30 < 34, top ? `clip tick ${(top.time * 30).toFixed(2)}` : 'clip not playing');
    if (tier === 'low') check(`${atk}: Low draws no arc / ring, only pieces`, g.lineTris === 0 && g.instances > 0, `${g.lineTris} line tris, ${g.instances} pieces`);
    else check(`${atk}: Medium draws the lumen ${atk === 'sweep' ? 'arc' : 'ring'} and pieces`, g.lineTris > 0 && g.instances > 0, `${g.lineTris} line tris, ${g.instances} pieces`);
    check(`${atk}: effect batches cost <= +${ceiling} draw calls`, delta(g) <= ceiling, `+${delta(g)} (${g.calls.without} -> ${g.calls.withFx})`);
    if (atk === 'sweep' && tier !== 'low') check('sweep (G13): the line is drawn 0.16 m wide, or wider for the picture up to 0.24 m', g.sweepWidth >= 0.16 - 1e-9 && g.sweepWidth <= 0.24 + 1e-9, `${g.sweepWidth.toFixed(3)} m`);
  }
  if (g && m.name === '08-charge') check(`charge: dust follows the real movement, <= +${ceiling} draw calls`, delta(g) <= ceiling && g.instances <= (tier === 'low' ? 6 : 12), `${g.instances} puffs, +${delta(g)}`);
}

await hold('(window.__cq.spot3 ??= [w.player.x, w.player.z])');
// ---- 3. phase 2 (HP set to 40% by hand): roar, then the crystal rain with five warnings by id
await page.evaluate(() => { const b = window.__synes.world.boss; if (b.alive) b.hp = Math.floor(b.maxHp * 0.4); });
const p2 = [
  { name: '09-roar', when: "b.state === 'roar' && top && top.clip === 'roar' && top.time > 0.1 && c.tick - c.state.start > 2 && c.tick - c.state.start < 7" },
  { name: '10-shard-cast', when: "b.state === 'cast' && top && top.clip === 'shard_cast' && top.time > 0.3" },
  { name: '11-shard-fall', when: "c.tracks.some((k) => k.atk === 'shard' && k.impact === null && k.impactTick - c.tick < 3 && k.impactTick - c.tick > 0.5)" },
  { name: '12-shard-impact', when: "c.tracks.some((k) => k.atk === 'shard' && k.impact === true && c.tick - k.impactTick >= 0 && c.tick - k.impactTick < 2)" },
];
await stage(p2);
for (const m of p2) {
  g = await got(m.name, 240000);
  if (g && m.name === '09-roar') check(tier === 'low' ? 'roar: Low adds no motes' : 'roar: four lumen motes at the shell socket (Medium)', tier === 'low' ? g.instances === 0 : g.instances === 4, `${g.instances} instances`); check(`${m.name}: seen in its own sim state`, !!g, fmt(g));
  if (g) check(`${m.name}: effect batches cost <= +${ceiling} draw calls`, delta(g) <= ceiling, `+${delta(g)} (${g.calls.without} -> ${g.calls.withFx})`);
}
g = await page.evaluate(() => window.__cq.got['11-shard-fall'] ?? null);
if (g) {
  const falling = g.tracks.filter((k) => k.atk === 'shard' && k.impact === null);
  check('rain: a crystal falls for a warning that is really there (by id)', g.instances >= 1 && falling.length >= 1, `${falling.length} warnings pending, ${g.instances} instances`);
}
const shardIds = await page.evaluate(async () => {
  const ids = new Set(), t0 = performance.now();
  while (performance.now() - t0 < 1600) { for (const k of window.__crabBoss.snapshot().tracks) if (k.atk === 'shard') ids.add(k.id); await new Promise((r) => requestAnimationFrame(r)); }
  return ids.size;
});
check('rain: the clock follows all five warnings of a cast by their own id', shardIds >= 5, `${shardIds} shard warnings tracked`);

// ---- 4. stun (state set by hand for the picture; in play it comes from the pillar): stars above the crystal, only while stunned
await page.evaluate(() => { const w = window.__synes.world, b = w.boss; w.tele = w.tele.filter((t) => t.owner !== b.id); b.state = 'stunned'; b.st = 2.6; });
await stage([{ name: '13-stunned', when: "b.state === 'stunned' && top && top.clip === 'stunned' && top.weight > 0.99 && c.tick - c.state.start > 6" }]);
g = await got('13-stunned');
check('stunned: the stunned clip and the three stars show', !!g && g.stars === true, fmt(g));
const starsAfter = await page.evaluate(async () => {
  const S = window.__synes; await new Promise((r) => { const f = () => (S.world.boss.state !== 'stunned' ? setTimeout(r, 400) : requestAnimationFrame(f)); f(); });
  return S.view.actors.get(S.world.boss.id).stars.visible;
});
check('stunned: the stars are gone when the state ends', starsAfter === false);
check('stunned: the stars sit 0.18 m above the crystal top, radius 0.55 m', !!at.stars && Math.abs(at.stars[0] * 1.05 - (at.stats.maxYM + 0.18)) < 1e-6 && Math.abs(at.stars[1] * 1.05 - 0.55) < 1e-6, at.stars ? `h ${(at.stars[0] * 1.05).toFixed(3)} m (top ${at.stats.maxYM.toFixed(3)}), r ${(at.stars[1] * 1.05).toFixed(2)} m` : 'not set');

// ---- 5. the boss between the camera and the player: the whole crab fades to 28%
await hold('[b.x, b.z - 2.2]');
await stage([{ name: '14-fade', when: 'c.opacity < 0.3' }]);
g = await got('14-fade', 30000);
check('hiding the player: the whole crab fades to 28%', !!g && Math.abs(g.opacity - 0.28) < 0.02, g ? `opacity ${g.opacity.toFixed(2)}` : 'never faded');
check('fade (G12): one depth-only draw of the same pose makes only the nearest surface show (+1 draw while see-through)', !!g && g.extraDraws === 1, g ? `+${g.extraDraws} draw · scene total ${g.total} draw calls in that frame` : '');
check(`fade: the scene stays within the profile budget while fading (<= ${tier === 'low' ? 56 : 60} draw calls)`, !!g && g.total <= (tier === 'low' ? 56 : 60), g ? `${g.total}` : '');
await hold('(window.__cq.spot2 ??= [b.x + 4, b.z + 3])');
const back = await page.evaluate(async () => { const t0 = performance.now(); while (performance.now() - t0 < 1500) { if (window.__crabBoss.snapshot().opacity > 0.99) return true; await new Promise((r) => requestAnimationFrame(r)); } return window.__crabBoss.snapshot().opacity; });
check('and comes back solid when it no longer hides the player', back === true, String(back));
check('solid again: the depth-only draw is gone', (await page.evaluate(() => window.__crabBoss.snapshot().extraDraws)) === 0);

// ---- 6. death (HP set to 0 the way the sim's own death does): down clip from the real death, then gone with the view's 0.45 s
await page.evaluate(() => { const w = window.__synes.world, b = w.boss; b.hp = 0; b.alive = false; b.deadT = 0; b.state = 'dead'; w.tele = w.tele.filter((t) => t.owner !== b.id); });
await stage([{ name: '15-down', when: "c.state && c.state.state === 'dead' && top && top.clip === 'down' && top.time > 0.2 && c.visible" },
  { name: '16-death-fade', when: "c.state && c.state.state === 'dead' && c.visible && c.opacity < 0.85 && c.opacity > 0.02" }]);
g = await got('15-down', 30000);
check('down: the down clip starts on the real death', !!g, fmt(g));
check('down (G8): solid while it falls', !!g && g.opacity / g.occl > 0.99, g ? `opacity ${g.opacity.toFixed(2)}` : '');
g = await got('16-death-fade', 15000);
if (g) check('death (G8): fades out over the last 0.10 s, with the depth-only draw when the player is an opaque model', g.opacity < 0.85 && g.extraDraws <= 1, `opacity ${g.opacity.toFixed(2)}, +${g.extraDraws} draw`);
else note('death fade: no frame fell inside the last 0.10 s on this machine (software rendering frames are longer than that)');
await page.waitForTimeout(1500);
const end = await page.evaluate(() => ({ q: { seen: window.__cq.seen, maxInst: window.__cq.maxInst, maxLines: window.__cq.maxLines, weightBad: window.__cq.weightBad, frames: window.__cq.frames }, s: window.__crabBoss.snapshot(), cpu: window.__crabBoss.cpu() }));
check('down: the crab leaves with the actor (the view hides the boss 0.45 s after death)', end.s.visible === false);

// ---- 7. totals
const clips = ['idle', 'walk', 'sweep', 'slam', 'charge_windup', 'charge', 'shard_cast', 'stunned', 'roar', 'down'];
const missing = clips.filter((c) => !end.q.seen[c]);
check('all ten clips were on screen (weight > 0.5) in this run', missing.length === 0, missing.length ? `not seen: ${missing.join(', ')}` : Object.entries(end.q.seen).map(([k, v]) => `${k} ${v}`).join(' · '));
check('pose weights sum to 1 on every frame', end.q.weightBad === 0, `${end.q.weightBad} of ${end.q.frames} frames`);
check(`cosmetic instances stay within the budget (<= ${tier === 'low' ? 12 : 32})`, end.q.maxInst <= (tier === 'low' ? 12 : 32), `most at once ${end.q.maxInst}; line tris most ${end.q.maxLines}`);
note(`boss controller + mixer + effect fill, real ms per frame (SwiftShader PC; the slow-motion clock is undone here, timer steps are coarse; tools/qa/crab-perf.mjs measures it at normal speed): p50 ${(end.cpu.p50 * 5).toFixed(3)} · p95 ${(end.cpu.p95 * 5).toFixed(3)} · max ${(end.cpu.max * 5).toFixed(3)} over ${end.cpu.frames} frames`);
check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const fail = results.filter((r) => !r).length;
console.log(`\n${tag}: ${results.length - fail}/${results.length} passed`);
process.exit(fail ? 1 : 0);
