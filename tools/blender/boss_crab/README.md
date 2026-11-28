# DES-010 local crab production

Uses the owner's existing Blender 5.3, its bundled NumPy and installed Node/Three.js.
No download, service, live Blender session, game-code edit or upload is needed.
Run from repository root. Set `$crabBlender` to the local Blender executable and
`$crabNode` to the local Node 26 executable; no machine-specific paths are stored here.

```powershell
& $crabBlender --background --factory-startup --disable-autoexec --python-exit-code 1 --python tools/blender/boss_crab/build_crab.py -- --stage preview
& $crabNode tools/blender/boss_crab/pack_crab.mjs
& $crabNode --experimental-strip-types --no-warnings tools/blender/boss_crab/check_crab.mjs
& $crabBlender --background --factory-startup --disable-autoexec --python-exit-code 1 --python tools/blender/boss_crab/verify_crab.py
& $crabNode tools/blender/boss_crab/verify_three.mjs

& $crabBlender --background --factory-startup --disable-autoexec --python-exit-code 1 --python tools/blender/boss_crab/build_crab.py -- --stage combat
& $crabNode tools/blender/boss_crab/pack_crab.mjs --combat
& $crabNode --experimental-strip-types --no-warnings tools/blender/boss_crab/check_crab.mjs --combat
& $crabBlender --background --factory-startup --disable-autoexec --python-exit-code 1 --python tools/blender/boss_crab/verify_crab.py -- --combat
& $crabNode tools/blender/boss_crab/verify_three.mjs --combat
& $crabBlender --background --factory-startup --disable-autoexec --python-exit-code 1 --python tools/blender/boss_crab/make_sheets.py
```

Stop on any nonzero exit code. `verify_crab.py --metrics-only` skips renders;
append `--combat` to select C1. Checks use the actual delivered GLB. Quarter-tick
pose checks cover interpolation, floor, envelope, loop/hold and bone-length error.
The Three.js check uses a PNG-dimension shim and CPU skinning; it is not WebGL QA.

Input hash is pinned. `preview` starts from raw; `combat` loads the same private
production mesh/rig and preserves its two locomotion actions. The library `.blend`
includes packed source atlases, independently of delivery texture quantization.
Packing is skipped when the current file already matches its packed record.
Run the validator after packing to regenerate the matching hash/manifest.

All outputs, including private source, production master, images, metrics and
manifests, stay in ignored `assets/_inbox/`. Preview has 2 clips; combat has 10.
Manifest schema is `synes.boss-manifest/1`, not the hero contract. Status remains
`REVIEW`. Game integration, VFX/telegraph timing, mobile/performance/lifecycle QA
and owner approval are separate work; these scripts do not claim them complete.

## v02 pose revision

`build_crab.py --stage combat --version v02` reads the v01 private production
master and writes `mon_boss_crab_work_v02.blend` plus the v02 GLB/production record.
It preserves v01/raw. Run packing and both validators with `--combat --version v02`.
Use `verify_crab.py -- --combat --version v02 --metrics-only` for metrics without
studio renders. `verify_master.py` reopens and checks the private v02 master.
`compare_game_angle.py` renders v01/v02 at fixed perspective, 844x390, with v01
idle 110 pixels wide; compare images are left v01/right v02. It writes hashes
and projected measurements into the private comparison JSON. These Blender
renders do not reproduce in-game lighting, fade, telegraphs or mobile performance.
