// QA for the player VFX of `ninja-roam-1` (DES-007 §3.4): each effect is caught on the exact sim tick, and the draw calls of
// that frame are counted with and without the batch (ceiling +5 Medium / +3 Low).
// Needs the vite dev server with the private inbox:  SYNES_SEYRIN_DIR=<inbox> npx vite --port 5181 --strictPort
// Usage: node tools/qa/ninja-fx.mjs [http://localhost:5181] [screenshotDir] [low|medium]
// The pictures show the private model: keep them out of git (default tools/qa/out/ninja-fx, which is ignored).
// The script moves the player next to an enemy and fills the meter by hand to stage each effect: a picture test, not a rules test.
// Emulated Chromium + SwiftShader on a PC: not a phone result.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const base = process.argv[2] || 'http://localhost:5181';
const shots = process.argv[3] || 'tools/qa/out/ninja-fx';
const tier = process.argv[4] || 'medium';
const ceiling = tier === 'low' ? 3 : 5;
fs.mkdirSync(shots, { recursive: true });
const edge = process.env.SYNES_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
const page = await ctx.newPage(), errors = [];
page.on('pageerror', (e) => errors.push(e.message));
// slow motion: software rendering here makes a frame last several sim ticks, longer than the 3-tick trail lives. The game's clock
// (the rAF timestamp and performance.now) runs at 1/5 speed, so every sim tick gets rendered frames. Timing in ticks is unchanged.
await page.addInitScript(() => {
  const S = 0.2, raf = window.requestAnimationFrame.bind(window), now = performance.now.bind(performance), t0 = now();
  window.requestAnimationFrame = (cb) => raf((n) => cb(t0 + (n - t0) * S));
  performance.now = () => t0 + (now() - t0) * S;
});
await page.addInitScript((t) => { try { localStorage.setItem('synes.quality', t); } catch { /* storage blocked */ } }, tier);
await page.goto(`${base}/?ruleset=ninja-roam-1&offline&autostart&seed=7`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__synes?.state === 'playing' && window.__ninjaFx, null, { timeout: 90000 });
await page.waitForTimeout(800);

// in the page: on every frame keep the player alive, and when a staged moment comes, grab the canvas + the draw calls of that frame
await page.evaluate(() => {
  const Q = (window.__fxq = { want: [], got: {}, maxTris: 0 });
  const loop = () => {
    requestAnimationFrame(loop);
    const w = window.__synes.world, a = w.ns.action, k = a ? w.tick - 2 - a.start : -1;
    w.player.hp = w.player.maxHp;
    const snap = window.__ninjaFx.snapshot();
    Q.maxTris = Math.max(Q.maxTris, snap.tris);
    for (let i = Q.want.length - 1; i >= 0; i--) {
      const m = Q.want[i];
      if (!new Function('w', 'a', 'k', 'snap', 'return ' + m.when)(w, a, k, snap)) continue;
      Q.want.splice(i, 1);
      const calls = window.__ninjaFx.calls(); // renders this frame twice more: with the batch, then without
      window.__synes.view.renderer.render(window.__synes.view.scene, window.__synes.view.camera);
      // a 3x close-up around the player, to read thin lines in a 844 px picture
      const cv = window.__synes.view.renderer.domElement, pr = cv.width / cv.clientWidth, at = { x: 0, y: 0, vis: false };
      const focus = (m.focus && w.actors.find((e) => e.id === m.focus)) || w.player;
      window.__synes.view.project(focus.x, 0.8, focus.z, at);
      const zoom = document.createElement('canvas'); zoom.width = 780; zoom.height = 480;
      const g2 = zoom.getContext('2d'); g2.imageSmoothingEnabled = false;
      g2.drawImage(cv, (at.x - 130) * pr, (at.y - 80) * pr, 260 * pr, 160 * pr, 0, 0, 780, 480);
      Q.got[m.name] = { png: cv.toDataURL('image/png'), zoom: zoom.toDataURL('image/png'), tris: snap.tris, calls, tick: w.tick, k };
    }
  };
  requestAnimationFrame(loop);
});
const stage = (list) => page.evaluate((l) => { window.__fxq.want.push(...l); }, list);
const got = async (name, timeout = 60000) => {
  await page.waitForFunction((n) => window.__fxq.got[n], name, { timeout }).catch(() => {});
  const g = await page.evaluate((n) => window.__fxq.got[n] ?? null, name);
  if (g) fs.writeFileSync(path.join(shots, `${tier}-${name}.png`), Buffer.from(g.png.split(',')[1], 'base64'));
  if (g) fs.writeFileSync(path.join(shots, `${tier}-${name}-zoom.png`), Buffer.from(g.zoom.split(',')[1], 'base64'));
  return g;
};
/** put the player `d` metres in front of the nearest living small enemy, facing it; returns that enemy's id */
const near = (d, id = 0) => page.evaluate(([d, id]) => {
  const w = window.__synes.world, p = w.player;
  const foes = w.actors.filter((e) => e.kind !== 'player' && e.kind !== 'prismback' && e.alive).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
  const e = id ? w.actors.find((x) => x.id === id) : foes[0]; if (!e) return null;
  e.hp = e.maxHp = 9999;
  p.x = e.x; p.z = e.z - d; p.fx = 0; p.fz = 1;
  return e.id;
}, [d, id]);
const idle = () => page.waitForFunction(() => !window.__synes.world.ns.action, null, { timeout: 60000 });
/** press until the sim starts that action (a key press can land before the page takes the keyboard) */
const act = async (press, kind) => {
  for (let i = 0; i < 6; i++) {
    await press();
    if (await page.waitForFunction((k) => window.__synes.world.ns.action?.kind === k, kind, { timeout: 4000 }).then(() => true, () => false)) return true;
  }
  return false;
};
const key = (code) => () => page.keyboard.press(code);
const report = (name, g, wantTris = true) => {
  check(`${name}: caught on its tick`, !!g, g ? `tick ${g.tick} k ${g.k.toFixed(1)} · ${g.tris} tris · calls ${g.calls.without} -> ${g.calls.withFx}` : 'not seen');
  if (!g) return;
  if (wantTris) check(`${name}: the batch draws`, g.tris > 0, `${g.tris} tris`);
  const d = g.calls.withFx - g.calls.without;
  check(`${name}: at most +1 draw call (ceiling +${ceiling})`, d <= 1 && d <= ceiling, `+${d}`);
};

const first = await page.evaluate(() => ({ ...window.__ninjaFx.snapshot(), tier: window.__synes.view.q.tier }));
console.log(`tier ${first.tier} · blade sockets: ${first.blade ? 'yes (Seyrin)' : 'no (placeholder: no combo trail)'}`);
check(`the game runs on the ${tier} tier`, first.tier === tier, first.tier);

// ---- 1. combo trail: the edge of each of the three steps
await near(1.6);
for (const step of [0, 1, 2]) {
  await stage([{ name: `combo${step + 1}`, when: `a && a.kind === 'attack' && a.step === ${step} && (${first.blade} ? snap.tris > 0 && k >= 2 : k >= 5)` }]);
  await act(key('KeyJ'), 'attack');
  report(`combo ${step + 1} trail`, await got(`combo${step + 1}`), first.blade);
  await page.waitForFunction((s) => { const a = window.__synes.world.ns.action; return !a || a.step !== s; }, step, { timeout: 30000 }).catch(() => {});
}
await idle();
await page.waitForTimeout(2500);
check('combo trail: gone after the swing', (await page.evaluate(() => window.__ninjaFx.snapshot().tris)) === 0);

// ---- 2. needle, mark, mark eaten
const foe = await near(5);
await stage([{ name: 'needle', when: `w.ns.needles.length && snap.tris > 0 && k >= 7` }, { name: 'mark', focus: foe, when: `w.ns.mark && w.tick - 2 >= w.ns.mark.at + 12` }]);
await act(key('Digit1'), 'echo_needle');
report('needle', await got('needle'));
const mark = await got('mark');
report('mark', mark);
if (mark) check('mark: three strokes = 6 triangles and nothing else', mark.tris === 6, `${mark.tris} tris`);
await idle();
await stage([{ name: 'mark-break', focus: foe, when: `!w.ns.mark && a && a.kind === 'attack' && snap.tris > 0` }]);
for (let i = 0; i < 4 && (await page.evaluate(() => !!window.__synes.world.ns.mark)); i++) { // a swing can miss a foe that walked off
  await near(1.6, foe);
  await act(key('KeyJ'), 'attack');
  await page.waitForFunction(() => { const a = window.__synes.world.ns.action; return a && window.__synes.world.tick - a.start > 7; }, null, { timeout: 30000 }).catch(() => {});
}
const eaten = await got('mark-break', 15000);
if (!eaten) console.log('mark state:', JSON.stringify(await page.evaluate(() => ({ mark: window.__synes.world.ns.mark, tick: window.__synes.world.tick, want: window.__fxq.want.map((m) => m.name) }))));
report('mark eaten', eaten);
await idle();

// ---- 3. shadow-thread step
await page.evaluate(() => { const p = window.__synes.world.player; p.fx = 0; p.fz = -1; });
await stage([{ name: 'shadow', when: `a && a.kind === 'shadow_thread' && k >= 8` }]);
await act(key('Digit2'), 'shadow_thread');
report('shadow-thread step', await got('shadow'));
await idle();

// ---- 4. resonant knot: threads, then the edge
await near(1.8);
await stage([{ name: 'knot-threads', when: `a && a.kind === 'resonant_knot' && k >= 10 && k < 13` }, { name: 'knot-edge', when: `a && a.kind === 'resonant_knot' && k >= 15` }]);
await act(key('Digit3'), 'resonant_knot');
report('knot threads', await got('knot-threads'));
report('knot edge', await got('knot-edge'));
await idle();

// ---- 5. the ult: three pulses (meter filled by hand)
await near(2.0);
await page.evaluate(() => { window.__synes.world.ns.meter = 4; });
await stage([9, 15, 21].map((h, i) => ({ name: `ult${i + 1}`, when: `a && a.kind === 'lumen_loom' && k >= ${h} + 0.5` })).concat([{ name: 'ult-gone', when: `window.__fxq.got.ult3 && w.tick >= window.__fxq.got.ult3.tick + 10` }]));
await act(() => page.dispatchEvent('#btn-ult', 'pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' }), 'lumen_loom');
const u = [await got('ult1'), await got('ult2'), await got('ult3')];
u.forEach((g, i) => report(`ult pulse ${i + 1}`, g));
if (u[0] && u[1] && u[2]) check('ult: each pulse adds to the picture', u[0].tris < u[1].tris && u[1].tris < u[2].tris, u.map((g) => g.tris).join(' / '));
const gone = await got('ult-gone');
check('ult: gone 8 ticks after the last pulse', !!gone && gone.tris === 0, gone ? `${gone.tris} tris` : 'not seen');

const maxTris = await page.evaluate(() => window.__fxq.maxTris);
check('the batch never fills up (640 triangles)', maxTris < 640, `max ${maxTris}`);
check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
process.exit(results.every(Boolean) ? 0 : 1);
