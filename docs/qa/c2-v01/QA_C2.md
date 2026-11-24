# QA C-2 (dispose level-owned render resources on rebuild): independent verification

Date: 2026-11-24. Environment: cloud container, Playwright Chromium 158 headless, ANGLE + SwiftShader (software GPU). This is not a real device.
BEFORE = `b84ad90` (24f56b4 + fix2_code.patch). AFTER = BEFORE + C-2 patch (HANDOFF hunk excluded). Both were built from source with `npm run build`. Servers ran on :8101 (BEFORE) and :8102 (AFTER) and were stopped when testing ended.
The WebGL2 probe printed `WEBGL2 READY` before any game test (`webgl2-probe.json`).

## Overall verdict: **PASS with notes**
Blocker 0 · Major 0 · Minor 3 (F1, F2, F3) · Info 2 (F4, F5)

All 6 acceptance criteria hold. The patch removes the leak. Rendered pixels, draw calls and triangles do not change. I found no error and no double dispose. Two side effects need a PM decision: F1 (shared cached materials are disposed when the kit GLB is missing) and F2 (more shader programs are rebuilt on each level rebuild).

## Criteria table

| # | Criterion | Result | Measured |
|---|---|---|---|
| 1 | Leak = 0 geometries and textures per rebuild on AFTER (10 rebuilds × low / medium / medium+envlib) | **PASS** | **Author tool, AFTER:** Δgeo 0 and Δtex 0 on all 30 rebuilds. low 38→38 / 3→3, medium 40→40 / 4→4, envlib 47→47 / 4→4. Programs 17 / 18 / 20, flat. **Author tool, BEFORE:** +16 / +17 / +17 geo and +1 tex per rebuild (38→198, 40→210, 47→217). The leak is detected. **Independent tool, "forced" frame** (frustumCulled off, so every level object is uploaded). AFTER: Δgeo 0, Δtex 0, Δprog 0 on all 30 rebuilds (46 / 48 / 55 geo). BEFORE: +17 / +18 / +18 geo and +1 tex. AFTER: 0 resources dropped from the scene without dispose (BEFORE: 131–133 per rebuild). Extra paths, AFTER (5 rebuilds each): `arena=B&spire=B` 0/0, `vfx=cur` 0/0, `nokit` 0/0 (BEFORE nokit: +150 / +152 geo per rebuild). |
| 2 | No new errors, no double dispose, nothing missing or broken after rebuild | **PASS** (with F1, F2) | Page errors and console errors: 0 in every run, BEFORE and AFTER. The only messages were browser warnings (autoplay, fullscreen, ReadPixels stall, willReadFrequently), the same on both sides. Double dispose in one rebuild, AFTER: 0. BEFORE: 1 per rebuild (kit material ×3, see F5). Shared resource disposed while still in the new scene, AFTER with kit (default): 0. AFTER with `nokit`: 15 per rebuild (F1). Object census after 5 rebuilds matches a fresh load (meshes 142 / 143 / 144, instanced 14 / 15 / 21; hero, puffcap×5, thornling, prismback, spire, shrine, pillars×4, gates×2, opening guide and halo present). Frames after 5 rebuilds (camp + boss arena with telegraph) are **pixel-identical BEFORE vs AFTER**: 6/6, and 6/6 with `nokit`. Fresh vs rebuilt on the same build: arena 0 px. Camp: the campfire flame and the puffcap idle animation differ (768–856 px). This is identical in BEFORE, comes from animation phase seeded by `Object3D.id`, and is not caused by the patch. |
| 3 | WebGL context loss/restore after rebuilds | **PASS** | AFTER, 5 rebuilds then `loseContext` and `restoreContext`. Lost = true, then restored with state `playing`, 0 errors, memory back to the fresh-load values (geo 38 / 40 / 47). Frames: BEFORE-ctxloss vs AFTER-ctxloss is 0 px on all 6. AFTER-ctxloss vs AFTER-6-rebuilds: arena 0 px, camp differs only in the flame (242–328 px), the same as in BEFORE. The same holds with `nokit`. `opening-smoke.mjs` on AFTER passed 10/10 (quality change, context loss/restore, live bot run). |
| 4 | stage1-shots BEFORE vs AFTER, low + medium, envlib off and on: 3D identical; calls and tris identical | **PASS** (see limitation) | 100 shots per side, all PNG (0 JPEG). **Draw calls are identical in 100/100.** Triangles are identical in 92/100. The 8 mismatches are vfx skill1/skill3, which also vary BEFORE vs BEFORE (7 mismatches): the particles use `Math.random`. Non-VFX scenes (opening, pathA, plaza, pool, boss-open / circle / fan / dash, chars): every pixel diff sits on HUD/DOM only: the boss name banner (1672 px wide), the top-left hint box, skill icon 1 and the settings edge. I looked at the diff images, and the same classes show up BEFORE vs BEFORE. 3D pixels are identical. With a seeded `Math.random` copy of the tool, vfx calls and tris are identical BEFORE vs AFTER (0 mismatches, envlib off and on). The pixels still vary BEFORE vs BEFORE, so the vfx shots cannot be compared pixel-exact. |
| 5 | lifecycle 20/20 | **PASS** | AFTER 20/20, BEFORE 20/20 |
| 6 | vitest / tsc / build on AFTER | **PASS** | vitest 168/168 (7 files) · `tsc --noEmit` exit 0 · `npm run build` exit 0 |

## Findings

**F1 (Minor): shared cached materials are disposed when the kit GLB is missing (`?nokit` or a failed load).**
`ownProceduralModel` disposes every material on procedural stand-ins. Those materials come from the module cache `lam()` (`models.ts:17 matCache`). This contradicts the patch comment at `view.ts:112`: "Shared model/texture caches never enter this set".
Measured on AFTER with nokit: 15 cached `MeshLambertMaterial` per rebuild are disposed and still used by the new level. Examples: tent, spring gem, puffcap cap and stem, thornling body.
Consequence I tested: no errors and no visual change (pixel-identical to BEFORE). Three.js re-initialises the materials, so the cost is a re-compile.
With the kit loaded (the normal game) this path is not taken: 0 shared disposals. A fix could be to not own materials that came from `lam()`, or to own only geometries for procedural models.

**F2 (Minor, perf/feel, PM decision): each rebuild re-creates more shader programs, so the first frame after a rebuild is slower.**
Correct disposal drops a program's reference count to 0, so Three.js deletes the program and compiles it again for the new level's materials. Before the patch, leaked materials kept those programs alive.
New programs per rebuild, BEFORE vs AFTER: medium 9 → 15, medium+nokit 7 → 16, low+nokit 6 → 15.
First frame after rebuild, under SwiftShader: medium about 230–290 → 330–380 ms, low+nokit about 120–155 → 270–350 ms. Consistent over 6/6 rebuilds.
Rebuilds happen on retry (new run), quality change and context restore. The program count itself stays flat (no program leak). Cost on real phones is unknown.
Possible mitigation: dispose the old level's resources after the first frame of the new level. This needs a decision, because it could change hitch timing.

**F3 (Minor, tool): the author's `level-leak.mjs` only sees what the start camera renders.**
It reads `renderer.info.memory` after a normal frame at the camp, so arena and boss resources that are off-screen are never uploaded or counted. BEFORE: author +16 / +17 vs forced +17 / +18 per rebuild. It also does not fail on console errors and does not check programs.
Its AFTER result (0) agrees with my forced measurement, so the conclusion stands. The tool is under-sensitive, though.

**F4 (Info): positive side effect.**
BEFORE disposed the kit's shared baked material on every rebuild: the `crystal_spire` InstancedMesh material is the kit material also used by thornling. It was disposed 3× per rebuild (double dispose). AFTER no longer does this.

**F5 (Info): pre-existing behaviour, not from C-2.**
After a rebuild, the campfire flame and puffcap idle phases differ from a fresh load, because the phase uses `Object3D.id`. This is identical BEFORE and AFTER.

**Player-visible change:** none found. Pixels are identical in the 3D scene, and draw calls and triangles are identical. The only "feel" item is F2, a longer hitch on the first frame after a rebuild.
**Patch scope:** `src/render/view.ts`, `src/render/models.ts`, `src/render/arena.ts`, `src/render/opening.ts`, new `tools/qa/level-leak.mjs`, plus a `docs/HANDOFF.md` section that was excluded from the tested tree.
The HANDOFF claims match my numbers: baseline +16 / +17, textures +1, vitest 168. One claim, "kit resources kept / factory identifies owner", is false for the procedural fallback (F1).

## Not tested / limits
- Real devices: Android not tested, iPhone not tested, PC GPU not tested. Everything ran on SwiftShader. F2 timings are software-GPU numbers.
- VFX scenes: pixel-exact comparison is impossible with the current tools (real-time `Math.random` particles plus RAF frames). Only calls and tris were compared (identical when seeded), and I looked at the diffs.
- I did not run a long real-time session with many retries via the UI. Rebuilds were driven with `view.buildLevel(world, 7)`, plus the quality-change and context-restore paths in opening-smoke.
- GPU memory in bytes was not measured; only `renderer.info` counts.
- `?spire=B` and `?arena=B` were checked for leaks and shared disposals only, not for pixels.

## Evidence files (under this folder)
- `webgl2-probe.json`, `build-before.log`, `build-after.log`, `vitest-after.log`, `tsc-after.log`
- `level-leak-author-before.json`, `level-leak-author-after.json` (author tool)
- `indep-leak-{before,after}.json/.txt`, `indep-leak-{before,after}-nokit.json/.txt`, `indep-leak-after-arenaB-spireB.*`, `indep-leak-after-vfxcur.*` (independent tool: per-rebuild memory normal and forced, programs, dispose counts, double dispose, shared-disposed list, dropped-not-disposed)
- `programs-per-rebuild.jsonl` (F2)
- `frames/<side>-<mode>[-nokit]/` (canvas frames, `frames.json` with calls / tris / memory / census / ctx-loss state), `frames/diff-*.json`, `frames/crop-*.png`
- `shots/{before,after}-{noenv,envlib}/g*/` (stage1-shots PNG + report.json), `shots/before-*-rerun/` (noise control), `shots/pixeldiff-*.txt/.json`, `shots/calls-tris-compare.txt`, `shots/calls-tris-BB.txt`, `shots/view-diff-*.png`
- `shots-seeded/` (vfx with seeded Math.random)
- `lifecycle-{before,after}.log`, `opening-smoke-after.log`
- `scripts/` (c2-indep.mjs, c2-frames.mjs, c2-progs.mjs, stage1-shots-seeded.mjs), `after.diff`, `after-status.txt`
