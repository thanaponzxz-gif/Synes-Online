# C-1 QA prep: กล้อง pull-back ค้างหลังหมุนจอ landscape เป็น portrait (TD-2)

เตรียมโดย QA tooling (2026-11-24) เพื่อให้ตัดสิน patch C-1 ได้เร็วบน cloud เมื่อ patch มาถึง
**ไม่ได้แก้ C-1 และไม่ได้แตะ `src/ shared/ server/ public/`** ไฟล์ที่เพิ่ม: `tools/qa/c1-rotate.mjs` และโฟลเดอร์นี้

## 0. สรุปบั๊กและเกณฑ์ (จากงานที่ได้รับ)
- `View.updateCamera` ตั้งเป้า `camPull` = 0 ใน portrait (`need = 0`) แต่ตำแหน่งกล้องยังคูณ `(1 + camPull)` เมื่อหมุนจอตอน pull ค้างอยู่ กล้อง portrait จะมองไกลไปทาง +z ราว 2 วินาที (hold 0.7 วินาที แล้วลด 0.9 ต่อวินาทีจาก 1.2)
- แนวแก้ที่ได้รับอนุมัติ (ไม่ใช่งานของเรา): portrait ไม่ใช้ camPull วางกล้อง + ตั้ง `camPull = 0` ตอนเข้า portrait, landscape ต้องเหมือนเดิมทุกพิกเซล, ห้ามขยับ `viewLimitZ`
- เกณฑ์รับ: (ก) หมุนจอตอน pull ค้าง แล้วตั้งแต่เฟรมถัดไปกล้อง portrait ต้องไม่เห็นเลย `viewLimitZ` · (ข) ภาพ 3D landscape ต่างจากเดิม 0 พิกเซล · (ค) `npm test`, `npm run typecheck`, `npm run build`, lifecycle 20/20

## 1. ขั้นตอนรับ/ปฏิเสธ patch (cloud)
`$BASE` = สำเนา repo ที่ commit ฐานเดียวกับ BEFORE (`839c9c0` ของ Codex ยังไม่อยู่บน remote · บนคลาวด์ใช้ `b84ad90` = commit ในเครื่องของ PM = `24f56b4` + `fix2_code.patch` ซึ่งโค้ดเท่ากับ `839c9c0` ทุกไฟล์ (PM ตรวจแล้ว 2026-11-24) · ถ้าสร้างฐานใหม่ ให้ทำแบบเดียวกันแล้วตรวจ SHA256 ของ patch = `8E37A1B7…`) · `$OUT` = โฟลเดอร์ชั่วคราวนอก repo

1. **apply patch**: ใน `$BASE` รัน `git apply --check c1.patch && git apply c1.patch` (ต้องใช้ฐานเดียวกับ BEFORE ถ้า patch ซ้อนบน C-2 ให้เทียบกับ AFTER ของ C-2 และบอกไว้ในรายงาน) ตรวจ diff ว่าแตะ `src/render/view.ts` (+ test) ไม่แตะ `viewLimitZ` / ค่าใน `cameraField.ts`
2. **build**: `npm ci` (ถ้ายังไม่มี node_modules) แล้ว `npm run build`
3. **Minimal WebGL2**: `timeout 120 node tools/qa/webgl2-probe.mjs` ต้องขึ้น `WEBGL2 READY` ก่อนรันอย่างอื่น (ไม่ READY = หยุดและรายงานว่าตรวจไม่ได้ ไม่ใช่ FAIL ของ patch)
4. **เกณฑ์ (ก)**: `timeout 290 node tools/qa/c1-rotate.mjs --dist $BASE/dist --label c1 --src $BASE --out $OUT/c1-rotate-c1.json` ต้องได้ `C1-ROTATE c1: PASS` 4/4 เคส (exit 0) ใช้ port 8111 (`--port` เปลี่ยนได้) เทียบกับ `c1-rotate-before.json` ในโฟลเดอร์นี้ (ต้อง FAIL ตามบั๊ก) ถ้าต้องการยืนยันเครื่องมือเอง: `--emulate-fix` บน dist เดิมต้อง PASS
5. **เกณฑ์ (ข)**: สร้างภาพ landscape ใหม่ 4 กลุ่มต่อ 2 โหมด (noenv, envlib) ตามหัวข้อ 3 แล้ว `node tools/qa/pixeldiff.mjs <BEFORE/gN> <NEW/gN> out.json` ต่อกลุ่ม ผ่านเมื่อ **พิกเซลของฉาก 3D ต่าง 0** และ calls/tris ใน `report.json` เท่าเดิม ความต่างที่ยอมรับได้คือ HUD/DOM เท่านั้น (ดูหัวข้อ 4)
6. **เกณฑ์ (ค)**: `npm test` (baseline 168/168 บน AFTER ของ C-2), `npm run typecheck`, `npm run build` และ lifecycle: `node tools/qa/serve.mjs $BASE/dist 8111 &` แล้ว `node tools/qa/lifecycle.mjs http://127.0.0.1:8111` ต้อง `20/20 passed` (kill server ตอนจบ)
7. **ตัดสิน**: รับเมื่อ (ก) PASS 4/4 + (ข) 3D diff 0 + (ค) ครบ · ปฏิเสธเมื่อข้อใดไม่ผ่าน แนบเฟรมแย่สุดจาก JSON (`cases[].worst`) ในรายงาน
8. จบงาน: kill server/เบราว์เซอร์ที่เปิด, ห้ามคัดลอก PNG เข้า repo, push ต้องให้เจ้าของอนุมัติตาม CLAUDE.md ข้อ 6

## 2. Baseline ของ c1-rotate (`c1-rotate-before.json`, `c1-rotate-after.json`)
สภาพ: `?offline&seed=1&autostart&qafreeze&q=<tier>` ที่ 844x390 (mobile emulation), settle กล้อง, บังคับ `view.camPull = 1.2` + `camPullHold = 0.7` ผ่านอินสแตนซ์ View จริง (`window.__synes.view`), วาด 1 เฟรม landscape, `setViewportSize(390x844)`, แล้วเดิน 90 เฟรม (1 tick + 1 เฟรมวาด ต่อเฟรม = 3 วินาทีเกม) แล้วหมุนกลับ 60 เฟรม (ข้อมูลเฉย ๆ)
reach = z ของพื้นที่ที่ขอบล่างจอเห็น (รังสีคอลัมน์กลางของกล้อง three.js จริงตัดระนาบ y = 0) ค่าอ้างอิงคำนวณจากสูตรใน `cameraField.ts` ที่คัดลอกมาใส่สคริปต์ (`--src` ตรวจแล้วว่าตรงกับไฟล์จริง ต่าง 0)

| เคส | ค่าที่คาด (เมตร) | BEFORE และ AFTER(C-2) วัดได้ |
|---|---|---|
| player z -41.02 ("off" ขอบโซน pilot, pin ทุก step) | landscape pull 1.2 = -32.143, portrait ไม่ pull = **-35.348**, `viewLimitZ(-41)` = **-29.623** | เฟรมแรกหลังหมุน reach -29.96 (เกิน limit ตั้งแต่เฟรม 2), สูงสุด **-25.64** ที่เฟรม 21 (hold หมด, camPull ยัง 1.2), camPull > 0 จนถึงเฟรม 60 (2.0 วินาที), เฟรม 90 reach -35.33 |
| จุดเริ่มเกม (player z 1.5) | portrait ไม่ pull = **7.172**, landscape pull 1.2 = 10.377 | เฟรมแรก 12.53, สูงสุด **16.86** ที่เฟรม 20 (เกิน 9.69 ม.), เฟรม 90 = 7.17 |

- ทั้ง 4 เคส (low/medium x off/opening): **BEFORE = FAIL 0/4, AFTER(C-2) = FAIL 0/4 ตัวเลขเท่ากัน** (C-2 ไม่แตะกล้อง) ตรงกับการวัดของ QA อิสระ (-25.5 ที่ pull 1.2) ไม่มี page error
- เกณฑ์ PASS ของสคริปต์: ทุกเฟรม portrait `reach <= limit + 0.05` โดย limit = max(portrait ที่คาด, `viewLimitZ(-41)`) สำหรับเคส off และ portrait ที่คาดสำหรับเคส opening บรรทัด strict (เสริม) เทียบ portrait ที่คาด + 0.3 ม. ทุกเฟรม
- self-test เครื่องมือ: `--emulate-fix` (ตั้ง camPull = 0 ทันทีหลังหมุน) บน dist เดิม = **PASS** 2/2 (low) เฟรมแรกของ off = -38.5 แล้วเลื่อนเข้า -35.33 ตามการ lerp ของกล้อง
- patch ที่ถูกต้องต้องให้เห็น: `camPull` = 0 ตั้งแต่เฟรมแรกหลังหมุน, reach ไม่เกิน -35.35 (off) และ 7.17 (opening) บวก lag ไม่เกิน ~0.15 ม.
- ย้อนกลับ portrait เป็น landscape: บันทึกใน `cases[].reverse` เป็นข้อมูลอย่างเดียว (ไม่มีผล PASS/FAIL)
- ไฟล์ JSON ~145 KB ต่อไฟล์ (มีทุกเฟรม)

## 3. Baseline landscape สำหรับเกณฑ์ (ข) (ตรวจแล้ว ไม่ได้สร้างใหม่ ไม่ได้คัดลอก PNG เข้า repo)
ที่อยู่ (นอก repo เพราะภาพ pilot ยังไม่อนุมัติให้ขึ้น repo สาธารณะ): `/tmp/claude-0/-home-user-Synes-Online/12b9d42d-65d2-53be-9769-fbb7314cceb4/scratchpad/c2qa/evidence/` (หายเมื่อ container ถูกเก็บ ให้สร้างใหม่ด้วยคำสั่งด้านล่าง)
- `shots/before-noenv/g1..g4` (50 ช็อต) และ `shots/before-envlib/g1a,g1b,g2..g4` (50 ช็อต, `?envlib=1`) รวม **100 ช็อต BEFORE** ทุกกลุ่มมี `report.json` (calls/tris/tick) + PNG (noenv 62 ไฟล์ รวม `-gray.png` ของ opening/boss-open) ไม่มี error/note ใน report
- ชุดวัด noise: `shots/before-noenv-rerun`, `shots/before-envlib-rerun` · ชุด AFTER ของ C-2: `shots/after-*` · ผล diff เดิม: `shots/pixeldiff-*.json`, `shots/calls-tris-compare.txt`
- ชุด seeded (Math.random คงที่ เทียบ vfx ได้): `shots-seeded/before-noenv`, `shots-seeded/before-envlib` (vfx 12 ช็อตต่อชุด) สคริปต์ `c2qa/qa-scripts/stage1-shots-seeded.mjs` (= stage1-shots + `addInitScript` seed Math.random)
- ฉาก: opening (start, walk2s; 844 และ 1672), pathA, plaza, pool, boss-open, boss-circle, boss-fan, boss-dash (844 และ 1672), chars (hero, puffcap, thornling, prismback, DPR 2 ตัดภาพ), vfx (skill1-chime, skill2-crescent, skill3-crystal, hit-spark, perfect-dodge, ult-locked) · tier: low, medium · ขนาด 844x390 ทุกฉาก, 1672x941 เพิ่มสำหรับ opening/boss-*
- คำสั่งสร้างใหม่ (บน dist ของ BEFORE เทียบกับ dist ใหม่; ชื่อโฟลเดอร์เหมือนกันทั้งสองฝั่งให้ pixeldiff จับคู่ชื่อไฟล์ได้; envlib เพิ่ม `--qs 'envlib=1'`):
```
node tools/qa/serve.mjs <dist> 8111 &
B="--base http://127.0.0.1:8111"
node tools/qa/stage1-shots.mjs $OUT/<side>-noenv/g1 --only opening,pathA,plaza,pool $B
node tools/qa/stage1-shots.mjs $OUT/<side>-noenv/g2 --only boss-open,boss-circle $B
node tools/qa/stage1-shots.mjs $OUT/<side>-noenv/g3 --only boss-fan,boss-dash $B
node tools/qa/stage1-shots.mjs $OUT/<side>-noenv/g4 --only chars,vfx $B
node tools/qa/pixeldiff.mjs $OUT/before-noenv/g1 $OUT/new-noenv/g1 $OUT/pd-g1.json
```
(การแบ่ง g1..g4 ตรงกับจำนวนช็อตใน report: 14 / 8 / 8 / 20 ต่อโหมด; ผมอนุมานคำสั่ง `--only` จากจำนวนและชื่อช็อต ไม่ได้อ่านจากบันทึกเดิม) vfx ต้องใช้สคริปต์ seeded จึงจะเทียบ pixel ได้

## 4. ข้อจำกัดที่ต้องรู้
- **setViewportSize ใน headless Chromium ไม่ใช่การหมุนเครื่องจริง**: ไม่มี `orientationchange`, ไม่มี safe-area/visualViewport ที่ iOS/Android ปรับระหว่างหมุน, `screen.orientation.lock` ไม่มีผล ยืนยันได้เฉพาะตรรกะกล้องเมื่อ `innerWidth/innerHeight` เปลี่ยน (Android/iPhone จริง ยังไม่ได้ทดสอบ)
- เฟรมเดินด้วย `__synesQA.stepTicks` (sim หยุด, dt = 1/30 วินาทีต่อเฟรม, ไม่มีเวลาจริง) เครื่อง 60 fps มีเฟรมละเอียดกว่า แต่ hold/decay เป็นวินาทีเท่ากัน
- เกมไม่หยุดตอนจอ portrait: `checkOrientation` แค่โชว์ overlay `#rotate` (เมื่อ pointer coarse และยังไม่กด "เล่นแนวตั้ง") การวาดและ `stepTicks` ยังทำงานใต้ overlay จึงวัดได้ ซึ่งเป็นเส้นทางที่ผู้เล่นเจอจริง
- GPU เป็น SwiftShader ซอฟต์แวร์: ภาพไม่ตรงเครื่องจริง, ไม่บอก FPS มือถือ
- ผู้เล่นเคส off ถูก pin ที่ (0, -41.02) ก่อนทุก step (ถ้าไม่ pin z เลื่อนเป็น -41.6) pz ใน JSON เลื่อนได้ไม่เกิน ~0.1 ม.; pull ธรรมชาติก่อนบังคับที่จุด off คือ 0.6 (pullNeeded) แล้วเราบังคับเป็น 1.2
- pixeldiff: HUD/DOM ต่างได้แม้ BEFORE กับ BEFORE (ป้ายชื่อบอส 1672, กล่อง hint ซ้ายบน, ไอคอนสกิล 1, ขอบ settings) และ vfx ไม่ pixel-exact ถ้าไม่ seed จึงตัดสิน (ข) จาก 3D scene, calls/tris และดูภาพ diff ด้วยตา
- เคส off ใช้ `viewLimitZ` (-29.62) เป็นเพดาน ซึ่งหลวมกว่าค่า portrait ที่ถูกต้อง (-35.35) 5.7 ม. จึงมีบรรทัด strict เสริม ถ้า patch ผ่าน (ก) แต่ strict FAIL ให้ดูเฟรมแย่สุดก่อนตัดสิน
- `view.camPull` / `camPullHold` เป็นฟิลด์ private ที่ชื่อไม่ถูก minify (ใช้ได้กับ build ปัจจุบัน) ถ้า patch เปลี่ยนชื่อฟิลด์ สคริปต์จะ ERROR ให้ปรับสคริปต์ ไม่ใช่ปฏิเสธ patch

## 5. เวลาที่ใช้ (c1-rotate วัดจริง ที่เหลือประมาณการ)
- c1-rotate: ~2 นาทีต่อ dist (4 เคส, เครื่อง 4 คอร์แชร์กับงานอื่น: 117-123 วินาที) · webgl2-probe: ไม่ได้จับเวลา (วินาที)
- `npm test` ~3 วินาที, `tsc` และ `build` ~3 วินาที (จาก log ของ QA_C2)
- lifecycle 20 เคส, stage1-shots 100 ช็อต, pixeldiff: ไม่ได้จับเวลา; ประมาณการ stage1-shots 10-20 นาทีรวมสองโหมด (ใส่ `timeout` ไม่เกิน 300 วินาทีต่อกลุ่ม)
- รวมประมาณ 25-40 นาทีต่อ patch (ประมาณการ)
