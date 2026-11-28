# DES-011 Hero 002 private T0

Run from repo root using the existing Blender 5.3 and Node 26. No VRM add-on,
service, account, download or live Blender connection is used. Set `$heroBlender`
and `$heroNode` to the local executables; no account-specific path is stored here.

```powershell
& $heroBlender --background --factory-startup --disable-autoexec --python-exit-code 1 --python tools/blender/hero002/inspect_source.py
& $heroBlender --background --factory-startup --disable-autoexec --python-exit-code 1 --python tools/blender/hero002/build_t0.py
& $heroNode tools/blender/hero002/pack_t0.mjs
& $heroNode --experimental-strip-types --no-warnings tools/blender/hero002/check_t0.mjs
& $heroBlender --background --factory-startup --disable-autoexec --python-exit-code 1 --python tools/blender/hero002/verify_t0.py
& $heroNode --experimental-strip-types --no-warnings tools/blender/hero002/verify_loader.mjs
```

Stop on any nonzero exit. Build reads raw VRM plus the private, artist-produced
Seyrin P1 master as a motion reference; both remain unchanged. It writes only
Hero002 art/notes/metrics under ignored `assets/_inbox/`. Pack after each build;
do not use pack as a geometry optimizer. `verify_t0.py -- --metrics-only` skips
the renders. It checks actual GLB poses at quarter ticks, not the working rig.

The check tool prefers Team B's sibling `seyrin-engine-0af27e` inspector when
available. It retains strict blocking checks and reports the expected Seyrin
check failures: 27 body bones instead of 45, no cloth anchors, MASK/double-sided
avatar. Its separate T0 profile check does not change the game inspector.
The original loader currently accepts these non-blocking differences; do not
claim all Seyrin checks pass or weaken that profile for other characters.

This is six preview clips, not twenty finished combat clips. Private sample
tryout only; no source-rights or originality approval is inferred for release.
