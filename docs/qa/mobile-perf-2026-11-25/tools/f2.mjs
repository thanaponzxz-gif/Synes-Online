import { chromium } from '/home/user/Synes-Online/tools/qa/pw.mjs';
const base = 'http://localhost:8121';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const res = [];
for (const tier of ['medium', 'low']) for (const mode of ['normal', 'deferred', 'normal', 'deferred']) {
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  await p.goto(`${base}/?offline&seed=1&autostart&qafreeze&q=${tier}`); await p.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 60000 });
  const r = await p.evaluate((mode) => { const { view, world } = window.__synes, QA = window.__synesQA; QA.stepTicks(2);
    const R = view.renderer; const ids = () => new Set(R.info.programs.map((x) => x.id));
    const P = Object.getPrototypeOf(Object.getPrototypeOf(view.arenaFloor.material)); const orig = P.dispose; // Material.prototype
    const out = [];
    for (let k = 0; k < 6; k++) {
      const a = ids(); const pend = new Set();
      if (mode === 'deferred') P.dispose = function () { pend.add(this); };
      view.buildLevel(world, 7);
      P.dispose = orig;
      const t0 = performance.now(); QA.stepTicks(0); const ms = performance.now() - t0;
      const t1 = performance.now(); for (const m of pend) orig.call(m); const dms = performance.now() - t1;
      QA.stepTicks(0);
      const bb = ids();
      out.push({ newPrograms: [...bb].filter((i) => !a.has(i)).length, total: bb.size, firstFrameMs: Math.round(ms), deferredDisposeMs: Math.round(dms * 10) / 10, deferredN: pend.size, tex: R.info.memory.textures, geo: R.info.memory.geometries });
    }
    return out; }, mode);
  res.push({ tier, mode, r }); console.log(tier, mode, r.map(x => `${x.newPrograms}p/${x.firstFrameMs}ms/g${x.geo}/t${x.tex}`).join(' '));
  await p.close();
}
import fs from 'node:fs'; fs.writeFileSync('f2-deferred-dispose.json', JSON.stringify(res, null, 1));
await b.close();
