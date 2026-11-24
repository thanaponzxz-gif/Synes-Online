# รายงานประสิทธิภาพมือถือ 2026-11-25 (วิเคราะห์ + วัด ไม่แก้โค้ด)

ผู้จัดทำ: เอเยนต์วิเคราะห์ perf (cloud) · branch `art/env-polish` (HEAD `60126d1`) · ไม่แก้ `src/ shared/ server/ public/` ไม่ commit ไม่ push
ข้อมูลดิบ: `docs/qa/mobile-perf-2026-11-25/` (JSON + สคริปต์วัดใน `tools/`)

## 0. ข้อจำกัดของตัวเลข (อ่านก่อน)
- **ทุกอย่างวัดบน Chromium headless + SwiftShader (GPU ซอฟต์แวร์) ใน container 4 คอร์** ตัวเลข ms/FPS **ไม่ใช่ตัวเลขของมือถือ** ใช้เทียบกันเองเท่านั้น
- ตัวเลขที่เชื่อได้ข้าม GPU: draw calls, triangles, จำนวน geometry/texture/program, ไบต์ของไฟล์, จำนวน request (อ่านจาก `renderer.info` และการเดิน scene graph)
- Android / iPhone / PC GPU: **ยังไม่ได้ทดสอบ** ในรายงานนี้
- Build ที่ใช้: `Q/before/dist` = base `839c9c0` + pilot env library (หลัง `?envlib=1`), `Q/after/dist` = base + patch C-2 (ใช้กับข้อ 4 เท่านั้น), `dist/` ใน repo = branch ปัจจุบัน (ไม่มี pilot) ใช้วัดขนาดไฟล์
- ไม่มีข้อเสนอใดในรายงานนี้เพิ่มเพดาน draw call และไม่ได้เปิด C-9 ทุกข้อเป็น "ข้อเสนอ" เท่านั้น

## 1. สรุปผู้บริหาร
1. **KPI-001 ทำซ้ำได้บนคลาวด์** (medium 64 / low 61 เทียบ QA เจ้าของ 65 / 62, ต่างกัน 1 call ตามเบราว์เซอร์และตำแหน่งผู้เล่น) จุดสูงสุดเกิดช่วง "ฝนผลึก" (shard rain) ใน phase 2
2. **ผู้ก่อ draw call อันดับ 1 คือโมเดลบอสเอง 20 calls จาก 64 (31%)** บอสเป็น 20 mesh แยก ใช้ material โคลนส่วนตัว 20 อัน (`KEEP_SEPARATE` ใน `models.ts`) ทั้งที่ตัวอื่นของด่าน (ต้นไม้ หิน หอ ประตู เสา) ถูกรวมเป็น baked mesh ไปแล้ว นี่คือจุดเดียวที่ลดได้มากที่สุดโดยไม่เปลี่ยนภาพ (ข้อ 5 ข้อ P1) ยืนยันซ้ำจากฉาก `chars-prismback` ในทุ่งที่มี 72 calls เทียบ 51 เมื่อไม่มีบอส
3. ช่วงที่ไม่มีวงเตือนเลย phase 2 อยู่ที่ medium 53–57 / low 49–54 (ไม่เกินเพดาน) ส่วนที่เกินมาจากวงเตือน shard +1…+5, ring/VFX +1…+2 และประตูคริสตัลที่จางแล้วแตกเป็น 5 draws (+4)
4. **F2 (hitch หลัง rebuild) แก้ได้โดยเลื่อนการ dispose วัสดุเก่าไปหลังเฟรมแรกของด่านใหม่** วัดจริงบน Q/after: program ที่ต้องคอมไพล์ใหม่ 15 → **0** (medium) / 14 → **0** (low), เฟรมแรก SwiftShader ~330 → ~100 ms (medium) และ ~270 → ~45 ms (low) geometry/texture ไม่รั่ว (40/4 และ 38/3 คงที่ 6 รอบ)
5. เส้นทางโหลด: ข้อมูลที่ต้องโหลดก่อนเล่น ≈ 1.0 MB บนสาย (gzip) **UI PNG 8 ไฟล์ 520 KB (51%) ใหญ่กว่า GLB ของด่าน (226 KB) และใหญ่เท่า JS (245 KB) ทั้งที่บีบไม่ลง** GLB เริ่มโหลดหลัง JS รันเสร็จ (ไม่ได้ preload)
6. หน่วยความจำ GPU ไม่ใช่คอขวด: texture รวม ~2.2 MB (low) / ~8.2 MB (medium, high) ทั้งหมดเป็น canvas สร้างเอง ไม่มี texture ใน GLB เลย **KTX2/Basis จึงใช้ไม่ได้กับเกมนี้ตอนนี้** (ไม่มี texture ให้บีบ)

## 2. KPI-001: draw calls ฉากบอส phase 2 แยกตามผู้ก่อ

### 2.1 วิธีวัด
- โหลด `?offline&seed=1&q=<tier>&autostart&qafreeze&start=boss` (844×390, DPR 1) ผู้เล่นอมตะ จอดที่ 5.8 ม. หน้าบอส (เหมือน `vfx-calls.mjs`/QA เจ้าของ) บังคับ HP บอสต่ำกว่า `phase2At` เพื่อเข้า phase 2 (tick 137) แล้วเดิน sim ทีละ tick ด้วย `__synesQA.stepTicks` (deterministic) วาดทุก tick ที่มีวงเตือน และทุก 10 tick ที่ไม่มี รวม 768 จุดต่อ tier
- **นับ draw call ต่อ object**: ฝัง `onBeforeRender` ทุก object แล้วบันทึกว่า object ใดถูกวาดจริงในเฟรม (หลัง frustum culling) จัดกลุ่มตามชื่อ/พาธ/ชนิด material ได้ยอดตรงกับ `renderer.info.render.calls` ยกเว้น **2 calls ที่ระบุตัวไม่ได้** (calls 64 vs hooked 62; ไม่ผ่าน `onBeforeRender` เช่นตัวพื้นหลัง/โค้ดภายใน three) ยอดข้างล่างจึงเป็นของ 62 จาก 64
- tier high ไม่ได้วัด (ใช้รอบเงา realtime ไม่ใช่เป้าของ KPI) · `?envlib=1` ให้ผลเหมือนกันทุก tick (ฉากบอสไม่วาดชุด pilot ตามกฎ Golden Reference ข้อ 5)
- ข้อมูล: `boss-p2-timeline.json`, `kpi001-breakdown.json`, สคริปต์ `tools/p2probe.mjs`, `tools/an.py`

### 2.2 เทียบกับหลักฐานของ QA เจ้าของ
| | QA เจ้าของ (Edge, `boss_telegraph_matrix.json`) | วัดซ้ำนี้ (Chromium + SwiftShader) |
|---|---|---|
| peak medium | 65 (tick 286, `shard/circle ×5`) | **64** (tick 412, shard ×3 + ring VFX) |
| peak low | 62 | **61** |
| phase 2 ไม่มีวงเตือน | 58 / 61 (`charge/line`) | 49–54 low / 53–57 medium |
| ท่า | charge/line 58, sweep 58, slam 58, shard 61–62 (low) | charge 54–56, slam 54, shard 57–61 (low) |
ต่างกัน 1–4 calls เพราะจุดยืน/กล้องของผู้เล่นต่างกัน (ผลต่อ frustum culling ของเสา ประตู โคมไฟ) **ลำดับและสาเหตุเหมือนกัน: ยอดสูงสุดเกิดตอน shard rain ทุกครั้ง**

### 2.3 ผู้ก่อ draw call ที่แถวสูงสุด (medium 64 / low 61)
| ผู้ก่อ | medium | low | % ของ 64 | หมายเหตุ |
|---|---|---|---|---|
| **บอส prismback** (body 5, horn 4, legs 3, shell 8) | **20** | **20** | **31%** | 20 mesh, 20 material โคลนส่วนตัว ทุก tick คงที่ |
| ซากปรัก/เสา/ประตู/โคม (`prismatic_ruins`, `crystal_pillar` ×4, `crystal_gate`, `lantern_post` ×2) | 13 (10–17) | 13 (10–17) | 20% | ruins = ศาล 1 + instanced 5 (หอ 1 + รูปเล็ก 4: 32/12/36/20 tris) · เสา 4 (twin baked) · ประตู 1 (**5 เมื่อจาง**) · โคม 2 |
| env batches ใน `Group/Mesh` (InstancedMesh 8 ชิ้นส่วน ต้นไม้/หิน/พุ่ม + พื้น 2 + ใบหญ้า/โปร่ง 2) | 12 | 10 | 19% | ไม่แปรผันตามจังหวะบอส |
| วงเตือน (ShaderMaterial 1 Mesh ต่อวง) | 3 (0–5) | 3 (0–5) | 5% | ตัวแปรหลักของ KPI: +1 ต่อวง shard |
| ฉากประกอบ arena (`arena_deco`: rim cards, น้ำตก, spray) | 3 | 3 | 5% | โปร่งใส ShaderMaterial/Basic |
| ผู้เล่น (hero 3 + `hero_ring` 1) | 4 | 4 | 6% | |
| VFX ลอย (Mesh Basic: ring, hit, ฯลฯ) | 2 (1–3) | 2 | 3% | |
| แสง (`arena_shafts` + `arena_glow`) | 2 | 1 | 3% | shafts ปิดใน low |
| พื้นลาน `arena_floor` · sparkles (Points) · พื้นหลัง scene | 1 · 1 · 1 | เท่ากัน | 5% | |
| ไม่ระบุตัว | 2 | 2 | 3% | ดูข้อ 2.1 |
tris ที่ peak: medium 57.7k / low 38.0k (ทั้งสอง tier ตัวเลขใกล้เคียง QA เจ้าของ: 57,737 / 38,035)

### 2.4 ยอดเปลี่ยนไปตามเวลาใน phase 2 (medium)
| สถานะ | calls | สาเหตุของส่วนต่าง |
|---|---|---|
| ไม่มีวงเตือน (เสา/ประตูบางส่วนอยู่นอกจอ) | **53**–61 | พื้นฐาน: บอส 20 + ที่เหลือ 33 |
| `charge:line` (340 จุด) | 57–59 | +1 วงเตือน +1 VFX |
| `slam:circle` | 57 | |
| `shard ×1…×5` | 60–64 | +1 ต่อวง + ring/hit VFX +1…+2 + ประตูจาง (+4) ทำให้ได้ 64 |
| **เกินเพดาน medium 60** | **262 จาก 768 จุด (34%)** | ทั้งหมดอยู่ในช่วง shard rain และหลังจากนั้นเล็กน้อย (`recover`) ตัวอย่างถูกเก็บเอนไปทางจุดที่มีวงเตือน จึงอย่าอ่านเป็นสัดส่วนเวลาจริง |
| **เกินเพดาน low 56** | **287 จาก 768 จุด** | ช่วงเดียวกัน |
**ข้อสังเกต:** ถ้าไม่มีบอส 20 calls ค่าเฉลี่ยทั้ง phase 2 อยู่ที่ ~39 / ยอดสูงสุด ~44 (medium) นั่นคือบอสเป็นเรื่องของ "จำนวนชิ้นส่วน" ไม่ใช่จำนวนศัตรู/VFX

## 3. เส้นทางโหลด

### 3.1 ขนาดไฟล์ (raw / gzip / brotli ด้วย node zlib, ข้อมูล `bundle-sizes.json`)
| ไฟล์ | raw | gzip | brotli |
|---|---|---|---|
| `index-*.js` (main dist, ไม่มี pilot) | 866,034 | 240,755 | 199,227 |
| `index-*.js` (Q, มี pilot) | 876,593 | 244,815 | 202,598 |
| `synes_kit.glb` | 646,964 | 225,415 | 170,693 |
| `env_library_v01.glb` (pilot, ?envlib=1) | 361,000 | 102,710 | 82,527 |
| `spire_shrine_B.glb` (?spire=B) | 56,020 | 23,108 | 18,271 |
| UI PNG 8 ไฟล์ รวม | 520,257 | ~519,000 | ~519,000 (บีบไม่ลง) |
| `index.html` / CSS / `study-*.js` | 13,327 / 20,141 / 5,300 | 4,417 / 5,618 / 2,215 | 3,671 / 4,959 / 1,988 |
| **รวมทั้ง dist (main)** | **2,129,479** | **1,021,379** | **918,948** |
- โฮสต์ปัจจุบัน GitHub Pages ให้ gzip (ไม่มี brotli) จึงใช้คอลัมน์ gzip ของจริง ≈ **1.0 MB** เมื่อโหลดทุกอย่าง; ทางวิกฤติก่อนปุ่มเริ่มเล่น = html 4 + css 6 + js 241 + GLB 225 ≈ **476 KB** (+ PNG อีก ~520 KB ที่ขนานกัน)
- ส่วนประกอบ JS (esbuild metafile, minify): **three.js 614 KB (70%)** + GLTFLoader 45 KB + BufferGeometryUtils 5 KB, โค้ดเกม ~177 KB (view.ts 31, hud 16, models 15, envArt 14, shared 32 ฯลฯ) `tests/bot.ts` ถูก bundle เข้าไปด้วยแต่เล็กมาก (2 KB) ไม่คุ้มแตะ

### 3.2 GLB (ข้อมูล `glb-composition.json`)
| GLB | node | mesh | primitive | tris | verts | material | texture | ส่วนไบต์ |
|---|---|---|---|---|---|---|---|---|
| synes_kit | 43 | 39 | 195 | 17,137 | 17,840 | 28 | **0** | index 103 KB + POSITION 214 KB + NORMAL 214 KB |
| env_library_v01 | 8 | 8 | 8 | 3,532 | 10,406 | 1 | **0** | index 21 KB + POS 125 KB + NORMAL 125 KB + COLOR_0 83 KB |
| spire_shrine_B | 2 | 2 | 17 | 1,318 | 1,474 | 10 | 0 | |
- ไม่มี texture, skin หรือ animation ใน GLB เลย สีมาจาก material/vertex color ทั้งหมด · ไม่มี extension (ไม่ meshopt, ไม่ quantization) · float32 ทุก attribute
- env_library: verts 10,406 ≈ tris×3 (ไม่ได้ index ร่วม, flat-shaded) ทำให้ 3.5k tris หนัก 361 KB (ใหญ่เกือบเท่าครึ่งของ kit ทั้งที่มี tris 1/5)
- **ประมาณการ (คำนวณ ไม่ได้วัดด้วยเครื่องมือจริง):** quantization int16/int8 + meshopt ลดไบต์ดิบของ kit จาก ~531 KB เป็น ~280 KB (~−47%) และ env_library ~354 KB → ~146 KB (~−59%) ผลบนสาย (gzip) น้อยกว่านี้เพราะข้อมูลที่ quantize แล้วบีบต่อได้น้อยลง ต้องวัดจริงหลังมีเครื่องมือ (NEEDS OWNER)

### 3.3 หน่วยความจำและทรัพยากรหลังโหลด (844×390, DPR 3 มือถือจำลอง, `load-path-844x390.json`)
| รายการ | low | medium | high |
|---|---|---|---|
| shader programs | **17** | **18** | **22** (pilot envlib: 20 ที่ medium, จาก QA C-2) |
| geometries / textures (`renderer.info.memory`) | 38 / 3 | 40 / 4 | 40 / 6 |
| pixelRatio จริง / drawing buffer | 0.85 (adaptive ลดแล้ว) / 717×331 | 1.5 / 1266×585 | 2 / 1688×780 |
| texture ใน scene (ประมาณจาก w×h×4×4/3) | **2.15 MB** | **8.15 MB** | 8.15 MB (+ shadow map 1024² ที่ high ไม่ได้นับ) |
| JS heap หลังเริ่มเล่น | 19.7 MB | 20.3 MB | 21.3 MB |
| JS heap ตอนปุ่มเริ่มพร้อม (ก่อนสร้างด่าน) | ~13 MB | | |
| request ทั้งหมด | 11 | 11 | 11 |
| frame buffer สี+depth (ประมาณ w×h×8) | ~1.9 MB | ~5.9 MB | ~10.5 MB (ไม่มี MSAA: `antialias:false`) |
- texture ทั้งหมดเป็น canvas สร้างตอน `buildLevel`: **`arena_floor` 1024² (5.3 MB กับ mipmap)** และ **พื้นทุ่ง 512×1024 (2.7 MB)** รวมสองอันนี้ = 98% ของ texture memory ที่ medium/high (low: 512² 1.3 MB + 256×512 0.7 MB) ที่เหลือคือ น้ำตก 64×256, rim cards 128×64, blob shadow 64² (รวม <0.2 MB)
- UI PNG ถอดรหัสเป็น RGBA ใน DOM ≈ 2.8 MB (นอก GPU texture ที่นับไว้)
- GPU memory จริง (ไบต์) ไม่ได้วัด; ค่าทั้งหมดข้างบนเป็นการประมาณจากขนาดภาพ

### 3.4 อะไรขวางเฟรมแรก
ลำดับ (SwiftShader, localhost, ไม่มี throttle เครือข่าย จึงบอกได้แค่ลำดับ ไม่ใช่เวลาบนมือถือ):
1. html (13 KB inline CSS/start screen) → first paint **~104 ms**
2. ดาวน์โหลด + parse JS 866 KB (บนมือถือเป็นต้นทุน parse/compile ที่ไม่ได้วัด)
3. รัน module: `new View()` สร้าง WebGLRenderer + HUD ทันที แล้ว **ค่อยเริ่ม fetch GLB** (เห็นใน resource timing: JS จบ 32 ms แต่ GLB เริ่ม 122 ms = รอ JS รัน ~90 ms ที่นี่; **ไม่มี `<link rel=preload>`**)
4. GLTFLoader parse 17k tris → ปุ่ม "แตะเพื่อเริ่ม" เปิด (**270–305 ms** บนเครื่อง cloud)
5. แตะเริ่ม → `buildLevel` (วาด canvas พื้น 512×1024 / 1024×2048 + arena floor 1024², scatter, bake) + **เฟรมแรกคอมไพล์ shader 17–22 โปรแกรมแบบ synchronous** (ไม่มี `compileAsync`) → แตะจนถึง state playing: **627–1313 ms** บน SwiftShader (ค่าบนมือถือไม่ทราบ; ส่วนคอมไพล์ shader ขึ้นกับ driver)
- UI PNG ไม่ได้ขวางปุ่มเริ่ม แต่ดาวน์โหลดแข่งแบนด์วิดท์กับ GLB (ลำดับ request: html → css → js → glb → png ×7)

## 4. Runtime ต่อฉากและ tier (จาก stage1-shots `report.json` เดิม ไม่วัดซ้ำ)
แหล่ง: `Q/evidence/shots/before-noenv` และ `before-envlib` (50 shots/ฝั่ง) สรุปใน `stage1-shots-calls-tris.json` ฝั่ง `after` (patch C-2) เท่ากันทุก shot ตาม QA_C2 (calls ตรงกัน 100/100)
| ฉาก (844×390) | low calls | medium calls | low tris | medium tris | หมายเหตุ |
|---|---|---|---|---|---|
| opening / pathA / plaza (ทุ่ง) | 48–50 | 50–52 | 47–49k | 74–77k | |
| pool | 53 | 55 | 44k | 72k | |
| **boss-open / circle / fan** | 49–50 | 53–54 | 36.6k | 56.7k | |
| **boss-dash** | **56** | **59** | 37.6k | 57.3k | ฉาก stage1 ที่หนักที่สุด (ติดเพดาน) |
| vfx สกิล (6 shots) | 51–56 | 53–58 | 49.5–49.9k | 77.0–77.5k | skill1 chime สูงสุด (58 medium) |
| chars (hero/puff/thorn/prismback close-up) | 49–**70** | 51–**72** | 47–50k | 74–77k | `chars-prismback` = ทุ่ง 51 + บอส 20 |
| envlib (`?envlib=1`) เฉพาะทุ่ง | +2…+3 | +2…+3 | +6–7k | +14k | ฉากบอสเท่า `?env=0` (ไม่เปลี่ยน) |
- ฉากที่หนักสุดต่อ draw call: (1) บอสใกล้ + วงเตือน (boss-dash 59, chars-prismback 72), (2) VFX สกิล (58), (3) pool (55) เทียบทุ่งทั่วไป ~50
- **ทุ่งใกล้เพดาน** pilot envlib ทำให้ทุ่งเป็น 53–55 (medium) จากเพดาน 60 ซึ่งเหลือ ~5 calls ถ้าทุ่งต้องเพิ่มของอีก
- tris ไม่ใช่ประเด็น: ทุกฉาก ≤ 91k (envlib medium) ไม่ได้ใกล้ปัญหาบนมือถือสมัยใหม่ แต่ยังไม่ทราบจริง
- tier `high` ไม่ได้อยู่ใน report.json เดิม

## 5. Hitch หลัง rebuild (F2 ใน QA_C2)

### 5.1 สาเหตุ
- `View.buildLevel` ล้างด่านเก่าก่อนสร้างด่านใหม่ (`dispose` วัสดุ/geometry แล้ว `env.clear()`) three.js นับการใช้ shader program ตาม material ที่ใช้งาน เมื่อ `material.dispose()` ทำให้ `usedTimes` ของ program เป็น 0 program ถูก **ลบ** (`releaseProgram`) แล้ววัสดุตัวใหม่ที่เหมือนกัน (cache key เดียวกัน) ต้อง **คอมไพล์/ลิงก์ใหม่แบบ synchronous ตอนวาดเฟรมแรก**
- เดิม (ก่อน patch C-2) วัสดุรั่วจึงค้างอยู่และ program ถูกใช้ซ้ำ (ใหม่ 9) การแก้รั่วทำให้ถูกต้องแต่ program ใหม่ต่อ rebuild เป็น 15 (medium) / 14 (low) และเฟรมแรก SwiftShader ~330–450 ms (medium), ~230–350 ms (low)
- rebuild เกิดตอนลองใหม่ (retry), เปลี่ยนคุณภาพ, context restore

### 5.2 ทดลองเลื่อน dispose (วัดจริง ไม่แก้ source)
บน `Q/after/dist` ใช้ monkeypatch ใน page: ระหว่าง `buildLevel` สกัด `Material.prototype.dispose` เก็บคิวไว้ แล้ว dispose หลังเฟรมแรกของด่านใหม่วาดเสร็จ (6 รอบ × 2 ชุด × 2 tier, `f2-deferred-dispose.json`, `tools/f2.mjs`)
| tier | โหมด | program ใหม่/รอบ | เฟรมแรก (ms, SwiftShader) | geo / tex หลัง rebuild |
|---|---|---|---|---|
| medium | ปกติ | 15 | 307–456 | 40 / 4 |
| medium | เลื่อน dispose | **0** | **77–169** | 40 / 4 |
| low | ปกติ | 14 | 205–351 | 38 / 3 |
| low | เลื่อน dispose | **0** | **35–137** | 38 / 3 |
ค่า dispose ที่เลื่อน ใช้เวลาเล็กน้อยหลังเฟรมแรก และ geo/tex ไม่เพิ่มต่อรอบ (ไม่รั่ว) ค่าใช้จ่าย: หน่วยความจำของด่านเก่าค้างอีกราวหนึ่งเฟรม (≈ texture 8 MB ที่ medium + geometry)

### 5.3 ตัวเลือก (วิเคราะห์เท่านั้น)
| ตัวเลือก | ผล | ความเสี่ยง |
|---|---|---|
| **A. เลื่อน dispose ไปหลังเฟรมแรกของด่านใหม่** (วัดแล้วข้างบน) | program ใหม่ 0, hitch ลดชัด | ต่ำ; ต้องจัดลำดับให้ dispose ครั้งเดียว (Set กัน double dispose ที่ C-2 มีอยู่แล้ว) |
| B. `renderer.compileAsync(scene, camera)` ก่อนสลับด่าน (ใช้ `KHR_parallel_shader_compile`) | คอมไพล์ขนานไม่บล็อก main thread; ใช้ได้กับการบูตครั้งแรกด้วย (17–22 program) | กลาง: ต้องสร้างด่านใหม่เป็น scene แยกก่อน, รองรับแตกต่างกันระหว่างอุปกรณ์/iOS |
| C. ถือ "program anchor" (mesh ตัวอย่างต่อ program ที่ไม่เคย dispose) | program ไม่ถูกลบเลย | ต่ำ-กลาง: ต้องรู้ cache key ทุกตัว (`customProgramCacheKey`, `onBeforeCompile`) บำรุงยาก |
| D. pre-warm หน้าเริ่ม: สร้างด่านซ่อนระหว่างรอ GLB แล้ว `compileAsync` | ลดเวลา "แตะ→เล่น" (627–1313 ms SwiftShader) | กลาง: เปลี่ยน lifecycle การสร้างด่าน (มีบั๊กเดิมเรื่อง rebuild/seed) |
- ไม่เปลี่ยนภาพที่ผู้เล่นเห็น (A, B, C, D) QA_C2 ระบุว่า "อาจเปลี่ยนจังหวะ hitch" ซึ่งเป็นการตัดสินของ PM ไม่ใช่ทีม A

## 6. ข้อเสนอเรียงลำดับ (คงคุณภาพงานศิลป์ทุกข้อ)
ลำดับตาม (ผลต่อ KPI-001 / โหลด) × ความปลอดภัย เกณฑ์ผ่านของทุกข้อที่เกี่ยวกับภาพ = pixel-diff 0 บน stage1-shots/boss + draw calls ลดตามที่ระบุ ถ้า pixel-diff ไม่เป็น 0 ให้หยุดและส่ง **ต้องให้ทีม A ตัดสิน**

| # | ข้อเสนอ | ผลคาดหวัง | ความเสี่ยง | ผู้เล่นเห็น? | ผู้ทำ / ตรวจ | Acceptance test |
|---|---|---|---|---|---|---|
| **P1** | **รวมโมเดลบอส 20 mesh เป็น baked mesh** ตามแบบเดียวกับเสา/ประตู (`TWIN`/`BakedLambert` มีอยู่แล้ว): body 5→1, horn 4→1, legs 3→1 (material คงที่) และ shell 8→1 ด้วย emissive ต่อ vertex คูณ uniform ตัวเดียว (ใช้แทน `emissiveIntensity` ที่ pulse ใน `animateActor` บรรทัด ~691) แสดง twin เมื่อบอสทึบ และใช้ชิ้นแยกเมื่อบอสจางหรือ stun ตามแบบ `addOccluder` | **−16 calls ตลอด phase 1–2** (peak medium 64→48, low 61→45; ไม่มีบอสในทุ่ง) ไม่เปลี่ยน tris | กลาง: ลำดับ depth ของพื้นผิวที่ตรงกัน, fade ของบอส, stun glow, การ flash/pulse ต้องเท่าเดิมทุก pixel | **ตั้งใจให้ไม่เห็น** ถ้า pixel-diff ≠ 0 → ทีม A ตัดสิน | Codex Local เขียน / cloud QA ตรวจ | `boss-open/circle/fan/dash` + `chars-prismback` pixel-diff 0 (low+medium); stun + phase2 + fade (ผู้เล่นหลังบอส) 3 มุม pixel-diff 0; `arena-probe.mjs`; p2probe ซ้ำ: boss ≤ 4 draws, peak ≤ 48 |
| **P2** | **เลื่อน dispose หลังเฟรมแรก (F2 ตัวเลือก A)** | program ใหม่ต่อ rebuild 15→0; เฟรมแรก −200…−300 ms (SwiftShader; มือถือไม่ทราบ) ไม่เปลี่ยน calls/tris | ต่ำ | ไม่ (เฉพาะ hitch ลดลง; PM ตัดสินเรื่องจังหวะ) | Codex Local / cloud QA | `tools/qa/level-leak.mjs` (Δgeo/Δtex 0 ×10 rebuild ทุก tier), `f2.mjs` newPrograms=0, lifecycle 20/20, `opening-smoke` (quality change + context loss) |
| **P3** | **preload GLB + ลำดับความสำคัญ UI PNG**: `<link rel=preload as=fetch crossorigin>` ให้ `synes_kit.glb` ใน `index.html` (ไฟล์ไม่ hash อยู่แล้ว) และให้ PNG HUD โหลดหลัง GLB (`fetchpriority=low`/เริ่มหลัง GLB เสร็จ) | GLB เริ่มขนานกับ JS แทนรอ JS รัน (ที่นี่ ~90 ms ในเครื่องเร็ว; บนมือถือ/เครือข่ายช้าคาดว่ามากกว่า ไม่ได้วัด) ปุ่มเริ่มเปิดเร็วขึ้นโดยแบนด์วิดท์ 520 KB ไม่แย่งกับ GLB | ต่ำ; ถ้าผู้เล่นแตะเริ่มก่อน PNG มาถึง HUD อาจ pop-in เล็กน้อย | ไม่ (ถ้า HUD ไม่ pop-in) หาก pop-in → ทีม A | Codex Local / cloud QA | resource timing: GLB `startTime` < JS `responseEnd`+10 ms; throttle เครือข่าย (CDP, เช่น 1.6 Mbps/150 ms) เทียบ "ปุ่มเริ่มพร้อม" ก่อน/หลัง; ภาพ HUD แรกเหมือนเดิม |
| **P4** | **รวมวงเตือนวงกลมเป็น instanced/pooled quad เดียว** (ปัจจุบัน `makeTele` สร้าง Mesh + PlaneGeometry + ShaderMaterial ใหม่ต่อวง) | −(n−1) calls ที่ shard rain (สูงสุด −4) และลด allocation/GC ต่อวง | กลาง: ลำดับ blend/`renderOrder 10`, uniform ต่อวง (progress/โทนสี) ต้องตรงทุก pixel; กฎ "วงเตือนทับทุกอย่าง" (ADR-005) | **ตั้งใจให้ไม่เห็น**; ถ้าต่าง → ทีม A | Codex Local / cloud QA | `tele-roi.mjs` + `stage1-shots` boss-circle/fan pixel-diff 0; `boss_telegraph_matrix` ซ้ำ: shard ×5 calls ลด ≥ 3 |
| **P5** | **รวมของเล็กใน arena ที่ไม่ขยับเป็น baked mesh**: `prismatic_ruins` instanced 4 รูปเล็ก (32/12/36/20 tris) + หอ → 1 mesh; (ขั้นต่อ, เสี่ยงกว่า) ชิ้นส่วน env batches ต้นไม้/หินที่ใช้ vertex color ได้ | ruins −4 calls (ฉากบอสทั้งหมด); env batches −3…−5 (ประมาณ ต้องสำรวจ) ทั้งทุ่งและบอส | ruins ต่ำ; env batches กลาง (โค้ดเดิมระบุความไวของลำดับ depth และ `nearFade`/`aSolid` shader patch) | ไม่ถ้า pixel-diff 0 | Codex Local / cloud QA | stage1-shots ทุกฉาก pixel-diff 0 low+medium (envlib off/on); calls ลดตามที่ระบุ; `level-leak` ไม่รั่ว |
| P6 | **meshopt + quantization ของ GLB** (EXP-103 รอเจ้าของ) | ไบต์ดิบ kit ~−47%, env_library ~−59% (ประมาณ ต้องวัดจริง); เวลา parse น่าจะลด; ผลบนสาย gzip น้อยกว่านี้ | กลาง: ต้องเพิ่มตัวถอดรหัส + เครื่องมือ pipeline, ความแม่นยำ quantize ต้องตรวจ | ไม่ถ้า pixel-diff 0 | **NEEDS OWNER** (เครื่องมือใหม่) → Codex Local / cloud QA | ขนาดไฟล์ก่อน/หลัง (gzip), เวลา parse GLB, pixel-diff 0, tris/calls เท่าเดิม |
| P7 | **PNG UI บีบแบบ lossless** (oxipng/zopfli) | 520 KB → คาดลด 10–25% (ไม่ได้วัด) | ต่ำ (lossless) | ไม่ | **NEEDS OWNER** (เครื่องมือใหม่) | md5 ของ pixel ที่ถอดรหัสเท่าเดิม |
| P8 | **สร้าง `arena_floor` 1024² (5.3 MB) แบบ lazy** เมื่อเข้าใกล้ลานบอส | ลด texture ตอนอยู่ทุ่ง −5.3 MB (medium) | **สูง**: ขัด Golden Reference ข้อ 5 "สร้างทุกอย่างก่อนเฟรมแรก" เสี่ยง hitch/pop-in ตอนเข้าลาน | อาจ (pop-in) → **ต้องให้ทีม A ตัดสิน** | ไม่แนะนำตอนนี้ | — |
| — | KTX2/Basis | **ใช้ไม่ได้ตอนนี้**: ไม่มี texture ใน GLB; texture ทั้งหมดเป็น canvas สร้างขณะรัน ถ้าจะทำต้องเปลี่ยน pipeline ศิลป์ (NEEDS OWNER + ทีม A) | | | | |
- **adaptive quality** มีแล้ว (`AdaptiveResolution` ปรับ pixelRatio ตาม FPS) แต่ไม่ได้ผูกกับจำนวน draw call การลด effect ตามภาระ (เช่น ปิด spray/shafts) เปลี่ยนภาพ → **ต้องให้ทีม A ตัดสิน**
- ผลรวมโดยประมาณถ้าทำ P1 + P4 + P5(ruins): peak medium 64 → ~41–44, low 61 → ~38–41 (คำนวณจากการลบ ไม่ได้วัดหลังแก้) ข้อเสนอเหล่านี้ **ไม่ต้องแตะเพดาน**

## 7. สิ่งที่ยังไม่ทราบ
- FPS บนมือถือจริง (Android / iPhone), ความร้อน/throttling ระยะยาว, ความสัมพันธ์ระหว่าง draw call 64 กับ frame time บน GPU มือถือ (tile-based, overdraw ของวงเตือน/โปร่งใสอาจสำคัญกว่าจำนวน call)
- หน่วยความจำ GPU จริงเป็นไบต์ (วัดแค่ `renderer.info` และการประมาณจากขนาดภาพ); การปล่อย memory ของ iOS Safari เมื่อ context หาย
- เวลาโหลดจริงบนเครือข่ายมือถือ (ที่นี่ localhost ไม่มี RTT/throttle); ต้นทุน parse/compile JS 866 KB บน CPU มือถือ; ต้นทุนการลิงก์ shader 17–22 โปรแกรมบน driver มือถือ (SwiftShader ไม่แทน)
- tier `high` ไม่ได้วัดใน KPI-001 และ stage1-shots เดิม
- 2 calls ในเฟรมบอสที่ระบุตัวไม่ได้ (ข้อ 2.1)
- ตำแหน่ง/มุมกล้องจริงของผู้เล่นใน phase 2 (ผมใช้ 5.8 ม. หน้าบอสเหมือน QA) ผู้เล่นจริงอาจเห็นเสา/ประตู/โคมมากกว่าหรือน้อยกว่า ± ~7 calls ตามช่วง ruins 10–17
- ประสิทธิภาพของ meshopt/quantization บนสายจริง (ต้องมีเครื่องมือ), ผลลัพธ์ P1/P4/P5 (ประมาณจากการลบเท่านั้น)

## 8. ไฟล์หลักฐาน
`docs/qa/mobile-perf-2026-11-25/`: `boss-p2-timeline.json` (768 จุด/tier, ผู้ก่อต่อกลุ่ม), `kpi001-breakdown.json` (สรุป min/mean/max), `load-path-844x390.json`, `bundle-sizes.json`, `glb-composition.json`, `f2-deferred-dispose.json`, `stage1-shots-calls-tris.json`, `tools/` (p2probe.mjs, load.mjs, f2.mjs, sizes.mjs, glb.mjs, an.py) ไม่มีภาพของ pilot และไม่มีสำเนา GLB
