# perf-field v01: field draw calls, same image (lane/perf-field)

Perf only. No visual, gameplay, tuning or layout change. Files touched: `src/render/models.ts`, `src/render/view.ts`, `tools/qa/perf-field.mjs`, `tools/qa/pixeldiff.mjs` and this folder.

## Result (measured)
- Field draw calls at 844x390: **149 / 146 / 124 -> 45 / 43 / 56 (low)**, **152 / 152 / 130 -> 46 / 45 / 58 (medium)** (goal <= 75: met in all 3 field scenes, both tiers).
- Boss arena: **126 -> 58 (low)**, **133 -> 61 (medium)** (not higher: lower).
- Pixel diff vs `main` (762b985): **0 differing pixels in all 12 scene/tier shots**, plus 0 in 9 extra shots (fading pillar, fading gate, `high` tier with shadows).
- Triangle count unchanged (bench: 40,169 low / 59,129 medium before and after).

## Method
- Before = `main` 762b985 built to a separate dir; after = this branch. Both are driven by the same script, `node tools/qa/perf-field.mjs <baseUrl> <outDir> [tiers] [scenes]`.
- Scenes (`?offline&seed=11&q=<tier>&autostart&qafreeze`, sim frozen and stepped with `__synesQA.stepTicks`, viewport 844x390, DPR 2, Chromium + SwiftShader):
  - `camp` = start (0,1.5) · `clearing` = (3,-33.5) until 2 telegraphs (the "clearing / fight mobs" scene) · `spring` = `?start=boss` checkpoint
  - `boss` (player in front of the boss), `boss-flank` (player 7 m beside it), `boss-behind` (player 6 m behind it): the boss scene of `tools/qa/baseline.mjs`, then the player is moved.
  - extra: `pillar-fade`, `gate-fade` (hero right behind a pillar / the gate so the fade path is exercised).
- Draw calls are counted per category by walking the scene (visible + frustum-intersecting objects). The category sum equals `renderer.info.render.calls` in every row (`counted == total` in the JSON). Shadow pass: shadows are off on low/medium; on `high` the same walk is used (camp 215 -> 62, boss 240 -> 104, boss-flank 236 -> 103, total).
- The 5 shots of `camera-low-v01/compare-844.png`: I found no script for it in the repo, so I rebuilt the 5 scenarios from the picture: camp, clearing with mushrooms, boss in front, boss at the side, boss behind = `camp`, `clearing`, `boss`, `boss-flank`, `boss-behind` above. This is my reconstruction, not the original script.
- Pixel diff: `node tools/qa/pixeldiff.mjs <dirBefore> <dirAfter> [out.json]` (exact, every channel, decoded in a browser page).
- To make shots reproducible the harness (a) holds the free-running frame loop while the scene is set up, so only frames drawn by `stepTicks` exist, (b) seeds `Math.random`, then sets it to a constant before the final frame (camera shake, dust, particles), (c) hides the HUD DOM (it has its own timers, e.g. the hint fade; it is not part of this change), (d) pins the campfire flame (see "Unexpected finding"). Main against main gives 0 diff in this harness (checked twice).

## Draw calls by category (before -> after)
Categories: terrain = ground + outer plane + arena floor · arena ruins = instanced backdrop batches · atmosphere = glow/rays · scatter = instanced trees/rocks/flowers · landmarks = tent, fire, signposts, lamps, fences, spring, pillars, gates · characters = hero, mobs, boss (no blob shadows) · blob shadows = one transparent disc per actor.

**low**

| scene | terrain | arena ruins | atmosphere | scatter | landmarks | characters | blob shadows | telegraphs | other | total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| field 1: camp/start | 3 -> 3 | 1 -> 1 | 0 -> 0 | 23 -> 7 | 45 -> 12 | 69 -> 14 | 7 -> 7 | 0 -> 0 | 1 -> 1 | **149 -> 45** |
| field 2: clearing | 3 -> 3 | 6 -> 6 | 0 -> 0 | 20 -> 6 | 58 -> 10 | 51 -> 10 | 5 -> 5 | 2 -> 2 | 1 -> 1 | **146 -> 43** |
| field 3: spring | 3 -> 3 | 6 -> 6 | 0 -> 0 | 20 -> 6 | 45 -> 7 | 47 -> 31 | 2 -> 2 | 0 -> 0 | 1 -> 1 | **124 -> 56** |
| boss arena (front) | 3 -> 3 | 6 -> 6 | 1 -> 1 | 20 -> 6 | 45 -> 7 | 47 -> 31 | 2 -> 2 | 1 -> 1 | 1 -> 1 | **126 -> 58** |
| boss arena (flank) | 3 -> 3 | 6 -> 6 | 1 -> 1 | 20 -> 6 | 43 -> 7 | 47 -> 31 | 2 -> 2 | 1 -> 1 | 1 -> 1 | **124 -> 58** |
| boss arena (boss behind) | 3 -> 3 | 6 -> 6 | 1 -> 1 | 20 -> 6 | 39 -> 11 | 47 -> 31 | 2 -> 2 | 1 -> 1 | 1 -> 1 | **120 -> 62** |

**medium**

| scene | terrain | arena ruins | atmosphere | scatter | landmarks | characters | blob shadows | telegraphs | other | total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| field 1: camp/start | 3 -> 3 | 1 -> 1 | 0 -> 0 | 26 -> 8 | 45 -> 12 | 69 -> 14 | 7 -> 7 | 0 -> 0 | 1 -> 1 | **152 -> 46** |
| field 2: clearing | 3 -> 3 | 6 -> 6 | 0 -> 0 | 26 -> 8 | 58 -> 10 | 51 -> 10 | 5 -> 5 | 2 -> 2 | 1 -> 1 | **152 -> 45** |
| field 3: spring | 3 -> 3 | 6 -> 6 | 0 -> 0 | 26 -> 8 | 45 -> 7 | 47 -> 31 | 2 -> 2 | 0 -> 0 | 1 -> 1 | **130 -> 58** |
| boss arena (front) | 3 -> 3 | 6 -> 6 | 2 -> 2 | 26 -> 8 | 45 -> 7 | 47 -> 31 | 2 -> 2 | 1 -> 1 | 1 -> 1 | **133 -> 61** |
| boss arena (flank) | 3 -> 3 | 6 -> 6 | 2 -> 2 | 26 -> 8 | 43 -> 7 | 47 -> 31 | 2 -> 2 | 1 -> 1 | 1 -> 1 | **131 -> 61** |
| boss arena (boss behind) | 3 -> 3 | 6 -> 6 | 2 -> 2 | 26 -> 8 | 39 -> 11 | 47 -> 31 | 2 -> 2 | 1 -> 1 | 1 -> 1 | **127 -> 65** |

Extra (fade paths, low / medium): pillar-fade 100 -> 59 / 111 -> 63, gate-fade 100 -> 29 / 106 -> 31 (`calls-fade-*.json`). Both are pixel-identical.

The "before" numbers differ a little from the camera-low README (149/148/151 there, 149/146/124 here) because the scenes are not the same positions; the baseline here is `main` measured by the same harness.

## What changed
1. **Kit meshes are baked per node** (`models.ts` `bakeKit`, run once after the GLB loads). Sibling meshes under one node (e.g. `hero_body`, `tent`, `lantern_post`) are merged into one mesh. Colour and emissive light go into per-vertex attributes (`aCol`, `aEm = emissive * emissiveIntensity`) and one shared Lambert variant (`BakedLambert`) reads them. The attributes are `flat`, so there is no interpolation rounding and the result equals the per-material uniform path. Vertices do not move (all kit meshes have an identity local transform).
2. **Draw order is kept where surfaces tie in depth.** Opaque draw order is by `material.id`; merged parts are laid out in the old order (original material id, or, for pillars/gates, traversal order, because `addOccluder` clones one material per mesh). Without this, coplanar faces (lamp vs cap, rock vs moss) flipped in a few pixels.
3. **Fading objects (pillars, gates)** keep their separate meshes and also get a hidden merged twin. `View.addOccluder` / `updateOccluders` show the twin while the object is opaque and the separate meshes while it is faded, because blending overlapping parts of one merged mesh would not match blending separate meshes. Boss: not merged (its crystals pulse through `emissiveIntensity`, and it fades); unchanged.
4. **Scatter** (`flattenPropMerged`, `view.ts`): one instanced batch per prop type instead of one per material. Parts are laid out in the old draw order via a shared first-use rank, and each batch gets its own near-fade clone created in that order. `nearFade()` now chains the source material's own `onBeforeCompile` / cache key (needed for the baked shader).
5. Tools: `tools/qa/perf-field.mjs` (breakdown + deterministic shots), `tools/qa/pixeldiff.mjs`.

Not done / not needed: spatial chunking of scatter (all types are in view in every scene anyway, so it would not reduce calls), shadow-pass changes (shadows are off on low/medium; `high` also drops, 215 -> 62 in camp, but the goal was low/medium), blob shadows (7 transparent discs in camp, left alone), boss merge (arena only; the arena already went down).

## Checks
- `npm test` 115/115, `npm run typecheck` clean, `npm run build` ok.
- `node tools/qa/lifecycle.mjs http://localhost:8080` (after `npm run build && npm run server`): 20/20 PASS (includes context loss/restore).
- Bench (`node tools/qa/bench.mjs`, SwiftShader, **relative only**; "before" served from a static server of the `main` build on another port, "after" likewise):

| profile | tier | draw calls | tris | fpsAvg | firstPlayMs | heapMB |
|---|---|---:|---:|---:|---:|---:|
| android-low | low | 144 -> 41 | 40169 -> 40169 | 14.1 -> 23.0 | 4306 -> 3755 | 11.9 -> 17.8 |
| android-mid | low | 143 -> 41 | 40061 -> 40169 | 20.1 -> 20.9 | 1717 -> 1420 | 14.0 -> 15.0 |
| iphone-class | low | 144 -> 41 | 40169 -> 40169 | 15.4 -> 26.6 | 1139 -> 1137 | 14.1 -> 16.4 |
| pc | medium | 150 -> 43 | 59129 -> 59129 | 12.9 -> 16.5 | 571 -> 426 | 14.3 -> 16.0 |

  The FPS values vary between runs on a software GPU (the bot run is also not identical frame by frame); read them only as "not worse". Heap is a bit higher (baked vertex attributes, geometry kept for scatter).

## Unexpected finding
The campfire flame flicker uses `Object3D.id` (a session-wide counter) as its phase: `f.scale.y = 0.85 + sin(time*17 + f.id) * 0.15` in `View.render`. Any change that creates a different number of Object3Ds shifts that phase, so a screenshot at a fixed time differs in the flame by a few hundred pixels. This is not a design change (the flicker is time-varying and the amplitude is the same), but it means "pixel-identical" for that object can only be checked with the flame pinned; the harness resets the flame scale/rotation and stops animating it (`view.flames.length = 0`) in both builds. Everything else around the fire is compared as normal.

## Limits (state of knowledge)
- Measured: Chromium + SwiftShader in a container. Draw-call counts are renderer-side and device independent; timings/FPS are not.
- **Not tested**: real iPhone / Android GPUs. The change adds `flat` varyings and two extra vertex attributes (WebGL2, three requires it); I expect no problem but did not verify on a device or Safari.
- The 5-scene set is my reconstruction (see Method), only 844x390 was compared, portrait and the unfrozen (live) path were not pixel-compared (lifecycle covers a live run without page errors).
- Pixel equality holds for these scenes; it relies on keeping the old draw order at depth ties. A different camera position could in principle expose a tie I did not reproduce; I found none in 21 shots (3 tiers, fade states).
- Raw data: `calls-*.json`, `pixeldiff-*.json`, `bench-*.jsonl` in this folder. Screenshots are not committed (large); regenerate with the commands above.
