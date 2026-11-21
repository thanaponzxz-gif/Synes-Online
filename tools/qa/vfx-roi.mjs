// exp/stage1-vfx: run tools/qa/tele-roi.mjs (DES-006 §2 telegraph-edge ROI) against the VFX options, without editing tele-roi.mjs.
//   node tools/qa/vfx-roi.mjs [outDir] --vfx cur|A|B [tele-roi options: --dist dir --tiers low,medium --sizes 844 --only circle,circle-vfx6,circle-vfx]
// The tele-roi source is loaded, patched in memory (each patch must match exactly once, otherwise this script stops) and run:
//   1. `&vfx=<A|B>` is appended to the game URL (nothing for cur)
//   2. the "VFX" layer that tele-roi hides for its H2 render also holds the new layers (impact mesh, sparkles), so "overVfx" sees them
//   3. one more render of the same state: telegraphs ON, every VFX layer OFF (NV). For each ROI edge pixel where the effects change
//      the picture (N != NV), CIEDE2000(N, NV) = how far the effects shift the edge colour -> report.vfxShift {n, mean, p95, max, shareOver5}
//   4. scene `circle-vfx6`: like tele-roi's circle-vfx (slam +12 ticks, Chime pressed) but 6 ticks after the press = the Q26 prep cue
// Everything else (mask shader, ROI rule, vividness checks, frames) is tele-roi's own code. LIMITS: Chromium + SwiftShader, not a phone.
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const vi = argv.indexOf('--vfx'), VFX = vi >= 0 ? argv[vi + 1] : 'cur';
if (vi >= 0) argv.splice(vi, 2);
if (!['cur', 'A', 'B'].includes(VFX)) throw new Error('--vfx cur|A|B');
let src = fs.readFileSync(path.join(here, 'tele-roi.mjs'), 'utf8');
const patch = (a, b) => { const n = src.split(a).length - 1; if (n !== 1) throw new Error(`tele-roi.mjs changed: anchor found ${n}x: ${a.slice(0, 80)}`); src = src.replace(a, b); };
patch("from './pw.mjs'", `from '${pathToFileURL(path.join(here, 'pw.mjs')).href}'`);
patch("from './profiles.mjs'", `from '${pathToFileURL(path.join(here, 'profiles.mjs')).href}'`);
patch("autostart&qafreeze&start=boss`", `autostart&qafreeze&start=boss${VFX === 'cur' ? '' : '&vfx=' + VFX}\``);
patch("...['chime', 'cres', 'crys'].map((k) => view.skillFx?.[k]?.mesh)]", "...['chime', 'cres', 'crys'].map((k) => view.skillFx?.[k]?.mesh), view.stageVfx?.impact?.buf?.mesh, view.stageVfx?.sparkles?.points]");
patch("r.render(scene, cam); const H2 = read();", "r.render(scene, cam); const H2 = read();\n  for (const t of teles) t.m.visible = true; r.render(scene, cam); const NV = read(); for (const t of teles) t.m.visible = false; // vfx-roi: telegraphs on, VFX off");
patch("const roi = new Uint8Array(W * H);", "const vfxShift = []; const roi = new Uint8Array(W * H);");
patch("    const vfxBelow =", "    if (Math.abs(N[i] - NV[i]) + Math.abs(N[i + 1] - NV[i + 1]) + Math.abs(N[i + 2] - NV[i + 2]) > 0) vfxShift.push(de00(lab(R, G, B), lab(NV[i], NV[i + 1], NV[i + 2])));\n    const vfxBelow =");
patch("for (const k of Object.keys(groups)) out.roi[k] = fin(groups[k]);", "for (const k of Object.keys(groups)) out.roi[k] = fin(groups[k]);\n  vfxShift.sort((x, y) => x - y); out.vfxShift = { n: vfxShift.length, shareOfRoi: +(vfxShift.length / Math.max(1, groups.all.n)).toFixed(3), mean: vfxShift.length ? +(vfxShift.reduce((a, b) => a + b, 0) / vfxShift.length).toFixed(2) : 0, p95: vfxShift.length ? +vfxShift[Math.floor(vfxShift.length * 0.95)].toFixed(2) : 0, max: vfxShift.length ? +vfxShift[vfxShift.length - 1].toFixed(2) : 0, shareOver5: +(vfxShift.filter((d) => d > 5).length / Math.max(1, vfxShift.length)).toFixed(3) };");
patch("const ATK = { circle: 'slam',", "const ATK = { 'circle-vfx6': 'slam', circle: 'slam',");
patch("if (sc === 'circle-vfx') {", "if (sc === 'circle-vfx' || sc === 'circle-vfx6') {");
patch("window.__synesQA.stepTicks(14);", "window.__synesQA.stepTicks(SC === 'circle-vfx6' ? 6 : 14);");
patch("got.vfx = await page.evaluate(() => {", "got.vfx = await page.evaluate((SC) => {");
patch("return { tick: w.tick, tele: w.tele.length, cast: w.ps.cast?.slot ?? null }; });", "return { tick: w.tick, tele: w.tele.length, cast: w.ps.cast?.slot ?? null }; }, sc);");
patch("const name = `boss-${sc}-${size[0]}-${tier}`;", "const name = `boss-${sc}-${size[0]}-${tier}-${'" + VFX + "'}`;");
patch("face ${rec.bossFace.meanAbsDiff}`);", "face ${rec.bossFace.meanAbsDiff}`);\n    console.log(`  vfxShift ${JSON.stringify(rec.vfxShift)} overVfx ${rec.roi.overVfx ? rec.roi.overVfx.n + 'px dE00 ' + rec.roi.overVfx.dE00mean : 'none'}`);");
patch("const tag = opt('tag', 'run');", `const tag = opt('tag', 'vfx-${VFX}');`);
const out = path.resolve('tools/qa/out'); fs.mkdirSync(out, { recursive: true });
const tmp = path.join(out, `.tele-roi-vfx-${VFX}.mjs`);
fs.writeFileSync(tmp, src);
process.argv = [process.argv[0], tmp, ...argv];
await import(pathToFileURL(tmp).href);
