import { chromium } from '/home/user/Synes-Online/tools/qa/pw.mjs';
import fs from 'node:fs';
const base = process.env.BASE || 'http://localhost:8121', tier = process.argv[2] || 'medium', env = process.env.ENVLIB ? '&envlib=1' : '';
const LAUNCH = ['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl'];
const browser = await chromium.launch({ args: LAUNCH });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(`${base}/?offline&seed=1&q=${tier}&autostart&qafreeze&start=boss${env}`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__synes?.world && window.__synes.state === 'playing', null, { timeout: 90000 });
const out = await page.evaluate(() => {
  const s = window.__synes, w = s.world, Q = window.__synesQA, v = s.view, R = v.renderer;
  const info = { shadow: R.shadowMap.enabled, pr: R.getPixelRatio() };
  w.player.hp = w.player.maxHp = 99999;
  // path name of an object (names up to the scene root)
  const pathOf = (o) => { const a = []; for (let p = o; p && p !== v.scene; p = p.parent) a.push(p.name || p.type); return a.reverse(); };
  // hook onBeforeRender on all objects every frame (new objects appear during sim)
  let cur = null;
  const hook = () => v.scene.traverse((o) => { if (o.__h) return; o.__h = 1; const old = o.onBeforeRender; o.onBeforeRender = function (r, sc, cam, g, m) { if (cur) cur.push({ o, cam: cam.type + (cam.isShadow ? 's' : ''), mat: m && m.type, g: g && g.groupIndex, inst: !!o.isInstancedMesh, pts: !!o.isPoints, spr: !!o.isSprite }); return old.apply(this, arguments); }; });
  const draw = () => { hook(); cur = []; Q.stepTicks(0); const rec = cur; cur = null; return { rec, calls: R.info.render.calls, tris: R.info.render.triangles }; };
  const classify = (o) => { const p = pathOf(o); return p.join('/'); };
  // enter phase 2 deterministically: park player, start fight, then set boss hp just under phase2At
  w.player.x = -2; w.player.z = -74; w.player.fx = 0; w.player.fz = -1;
  let n = 0; for (; n < 600 && !w.bossStarted; n++) { Q.stepTicks(1, false); w.player.x = -2; w.player.z = -74; }
  const boss = w.actors.find(a => a.kind === 'prismback');
  boss.hp = Math.floor(boss.maxHp * 0.49);
  // player at 5.8 m from boss like QA
  const place = () => { w.player.x = boss.x; w.player.z = boss.z + 5.8; w.player.fx = 0; w.player.fz = -1; };
  let k = 0; for (; k < 400 && w.phase !== 2; k++) { Q.stepTicks(1, false); if (boss.hp > boss.maxHp*0.49) boss.hp = Math.floor(boss.maxHp*0.49); }
  info.p2At = { tick: w.tick, phase: w.phase, started: w.bossStarted };
  // timeline: step one tick at a time, draw each tick, record calls + owner buckets
  const tl = [];
  const peak = { calls: 0 };
  for (let i = 0; i < 1500; i++) {
    place(); w.player.hp = w.player.maxHp;
    Q.stepTicks(1, false);
    const teles = w.tele.map(t => t.atk.id + ':' + t.shape);
    const interesting = teles.length > 0 || i % 10 === 0;
    if (!interesting) continue;
    const d = draw();
    const byCam = {}; const byPath = {};
    for (const e of d.rec) { byCam[e.cam] = (byCam[e.cam] || 0) + 1; const pp = pathOf(e.o); const root = pp[0] === 'Group' ? pp.slice(0, 2).join('/') : pp[0]; const key = (e.cam.endsWith('s') ? 'SHADOW|' : '') + root + ' {' + (e.mat || e.o.type) + (e.o.material && e.o.material.transparent ? ',T' : '') + '}' + (e.inst ? ' [inst]' : '') + (e.pts ? ' [pts]' : ''); byPath[key] = (byPath[key] || 0) + 1; }
    const row = { i, tick: w.tick, phase: w.phase, bossState: boss.state, teles, calls: d.calls, tris: d.tris, hooked: d.rec.length, byCam, byPath };
    tl.push(row);
    if (d.calls > peak.calls) { peak.calls = d.calls; peak.row = row; peak.detail = d.rec.map(e => ({ path: pathOf(e.o).join('/'), cam: e.cam, mat: e.mat, grp: e.g, inst: e.inst, vis: true, geo: e.o.geometry && (e.o.geometry.index ? e.o.geometry.index.count/3 : e.o.geometry.attributes.position.count/3), nm: e.o.material && (e.o.material.name || e.o.material.type), tr: e.o.material && e.o.material.transparent, dw: e.o.material && e.o.material.depthWrite })); }
  }
  
  const mats = {}; v.scene.traverse((o)=>{ if(!o.isMesh) return; const pp=pathOf(o); if(pp.some(x=>/prismback/.test(x))){ const m=o.material; mats[m.uuid.slice(0,6)] = (mats[m.uuid.slice(0,6)]||0)+1; } });
  info.bossMatUse = mats;
  let sceneCount = {meshes:0,inst:0,pts:0,vis:0}; v.scene.traverse(o=>{ if(o.isMesh){sceneCount.meshes++; if(o.isInstancedMesh) sceneCount.inst++;} if(o.isPoints) sceneCount.pts++; });
  info.sceneCount = sceneCount;
  return { info, tl, peak };
});
fs.writeFileSync(process.argv[3] || '/tmp/p2.json', JSON.stringify(out));
console.log(JSON.stringify(out.info), 'rows', out.tl.length, 'peak', out.peak.calls, 'errs', errs.length);
await browser.close();
