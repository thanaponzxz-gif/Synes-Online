# ความพร้อมของ pipeline รับงานศิลป์ Environment (ART INTEGRATION READINESS)

> เขียนโดย Claude (ทีม B, technical art) วันที่ 2026-11-25 บน branch `art/env-polish` · **เอกสารนี้ไม่มีข้อเสนอดีไซน์** (รูปทรง สี สไตล์ องค์ประกอบ เป็นของทีม A ตาม ADR-007)
> เนื้อหาคือ ข้อเท็จจริงจากโค้ด/เอกสารใน repo + ข้อจำกัดทางเทคนิค + ช่องว่าง + เครื่องมือที่เตรียมไว้
> ทุกข้อที่ต้องติดตั้งหรือจ่ายเงินติดป้าย **NEEDS OWNER** · ทุกข้อที่ผู้เล่นมองเห็นได้ติดป้าย **ต้องให้ทีม A ตัดสิน**
> สถานะการทดสอบ: เครื่องมือตรวจนี้ทดสอบกับไฟล์ GLB 3 ไฟล์เท่านั้น · Android / iPhone: **ยังไม่ได้ทดสอบ** · ภาพในเกมกับ asset ใหม่: **ยังไม่ได้ตรวจ** (ไม่มี asset ใหม่ให้ตรวจ)

## 0. สรุปสั้น
- เกมโหลด GLB แบบ `GLTFLoader` เพียงอย่างเดียว (ไม่มี Draco / meshopt / KTX2) แล้ว **แปลงวัสดุทุกชิ้นเป็น Lambert สีเดียว** (`lambertize`) เก็บแค่ base colour กับ emissive **texture, UV, vertex colour, alpha, double-sided ถูกทิ้งหมด**
- pipeline ปัจจุบันบน `art/env-polish` รองรับ asset ที่ "สีแบน ต่อ material" แบบ `synes_kit.glb` เท่านั้น ส่วน library ที่ใช้ vertex colour (`env_library_v01.glb` ของ pilot R5) ต้องมีโค้ดรองรับ (`paintLib`/`LibLambert`) ซึ่งมีเฉพาะใน pilot (นอก repo นี้) **ยังไม่ได้ merge**
- ยังไม่มี LOD ไม่มีไฟล์รายการ node ที่ต้องมี สำหรับ environment และ `.gitignore` บน branch นี้ยังไม่มีกฎกัน Hero 001 (มีเฉพาะบน `lane/env-assets`)
- เครื่องมือใหม่: `tools/qa/glb-check.mjs` (ไม่มี dependency) ตรวจไฟล์ GLB ก่อนเข้า inbox/ก่อนเปรียบเทียบในเกม

## 1. งานศิลป์เข้าเกมทุกวันนี้อย่างไร

### 1.1 เส้นทางโหลด (อ้างอิงโค้ด)
| ขั้น | ที่ | ทำอะไร |
|---|---|---|
| 1 | `src/main.ts` boot | `loadKit('./assets/models/synes_kit.glb')` เสมอ (ข้ามด้วย `?nokit`) · `?spire=B` โหลด side-car `spire_shrine_B.glb` · `?envlib=1` (และ `env≠0`) โหลด `./assets/models/env_library_v01.glb` **ถ้ามีไฟล์** (ตรวจด้วย HEAD ถ้าไม่มี = no-op) |
| 2 | `models.ts` `lambertize(root)` | ทุก mesh ได้ `MeshLambertMaterial` ใหม่ จาก `color` + `emissive` ของ material เดิม (ดูหัวข้อ 3) |
| 3 | `models.ts` `bakeKit(root)` | รวม mesh พี่น้องที่ชื่อ `*_geo`/`*_geo_N` ใต้ node เดียวกันเป็น mesh เดียว ใช้สีต่อ vertex (`aCol`, `aEm`) กับ `BakedLambert` ตัวเดียวทั้งเกม |
| 4 | `models.ts` `fromKit(name)` | ค้น node ตาม **ชื่อ** ลำดับ `envLib` → `kitExtra` (side-car) → `kit` แล้ว `clone(true)` ตั้ง position/rotation เป็น 0 (**scale ไม่ถูกรีเซ็ต**) |
| 5 | `makeProp(name)` | ถ้าไม่เจอ node ใช้ `PROCEDURAL[name]` (ของสำรองในโค้ด) ถ้าไม่มีก็ `Group` ว่าง |
| 6 | `view.ts` scatter | วางต้นไม้/หิน/พุ่ม/ดอกไม้เป็นกลุ่มด้วย `flattenPropMerged(name)` → `InstancedMesh` ต่อ (ชนิด prop × material) พร้อม `nearFade` |
| 7 | `envArt.ts` | `?env=0` = ภาพเดิม · ค้น `grass_tuft`, `flower_small` ใน library เป็นแม่แบบ (ถ้าไม่มี ใช้กอหญ้าที่สร้างจากโค้ด) |

ผลของลำดับใน `fromKit`: **node ใน library ที่ชื่อซ้ำกับ kit (เช่น `tree_round`, `rock_a`, `bush`) จะแทนที่ทั้งเกม** รวมถึงจุดที่เรียก `makeProp` ตรง ๆ (landmark) ไม่ใช่แค่ scatter

### 1.2 ไฟล์ที่เกมโหลดจริงตอนนี้ (บน `art/env-polish`)
`public/assets/models/synes_kit.glb` (ตัวละคร ศัตรู ฉาก 30+ node) และ `spire_shrine_B.glb` (side-car) · **ไม่มี** `env_library_v01.glb` ใน repo นี้ (มีเฉพาะสำเนา QA ที่อ่านอย่างเดียวนอก repo ห้ามคัดลอกเข้า repo)

## 2. ข้อตกลงรูปแบบ ชื่อ มาตราส่วน (สัญญาที่มีอยู่แล้ว)
แหล่ง: `docs/art/ASSET_CONTRACT.md`, `tools/blender/build_kit.py`, `docs/ASSET_PIPELINE.md` ข้อ 4
- **รูปแบบ:** `.glb` (glTF 2.0 binary) เท่านั้น · ภาพ `.png` ใช้กับ UI/ไอคอน/texture ตามกฎ pipeline
- **ชื่อไฟล์:** `<ประเภท>_<ชื่อ>_vNN.glb` ประเภท: `char enemy prop env ui tex concept fx` (กฎโปรเจกต์) · ไฟล์เดิม `synes_kit.glb`, `spire_shrine_B.glb` **ไม่ตรงรูปแบบ** (เป็นของเก่า/ชื่อที่โค้ดอ้างตรง ๆ) `glb-check` จึงรายงานว่า FAIL ชื่อไฟล์ ให้ PM ตัดสินว่าจะยกเว้นหรือเปลี่ยนชื่อ (ถ้าเปลี่ยนต้องแก้ URL ใน `main.ts`)
- **ชื่อ node:** เกมค้นด้วยชื่อเท่านั้น ต้องตรงทุกตัวอักษร (ตัวพิมพ์เล็ก, `_`) · รายชื่อ node ที่โค้ดค้นหา:
  - kit: ตาม `ASSET_CONTRACT.md` (`hero`, `puffcap`, `thornling`, `prismback`, `tree_round`, `tree_round_b`, `tree_pine`, `bush`, `rock_a`, `rock_b`, `crystal_cluster`, `flower_patch`, `mushroom_glow`, `tent`, `campfire`, `signpost`, `lantern_post`, `crystal_pillar`, `crystal_gate`, `lumen_spring`, `fence`, ... ) ตัวละครต้องมี node ลูกตามตาราง (ไม่ครบ = ใช้ของสำรอง)
  - library (โค้ดหลัก `envArt.ts`): `grass_tuft`, `flower_small` (ไม่มีใน `env_library_v01.glb` v01)
  - library (โค้ด pilot R5 `envPilot.ts`, ยังไม่อยู่ใน repo นี้): `tree_signature_focal`, `tree_signature`, `tree_conifer`, `tree_secondary`, `rock_a_mossmass`, `rock_b_tallcracked`, `rock_c_roadside`, `rune_stone` (ต้องมีครบทั้ง 8 ไม่เช่นนั้น `pilotReady()` = false และ pilot ไม่ทำงาน)
  - node ลูกของฉาก: `flame`, `flame2`, `campfire_flame` (ไฟ), `water`, `gem` (บ่อ) ถูกค้นด้วยชื่อ
  - ชื่อที่ผูกกับพฤติกรรม: `prismback` ห้ามรวม mesh (บอสเรืองแสง/จางทั้งตัว) · `crystal_pillar`/`crystal_gate` ต้องคง mesh แยกต่อชิ้น (จางด้วย `addOccluder`) · ชื่อที่ขึ้นต้น `tree` ได้ shadow/instance tint ชนิด tree, `rock_a` ชนิด rock, `bush` ชนิด bush (`tintKind` ใน `view.ts` เทียบ**ชื่อ**) node ชื่ออื่นจะไม่ได้ tint
- **ชื่อ mesh ลูก (ผลต่อ draw call):** ใน three.js node ที่มี **1 primitive** กลายเป็น Mesh ชื่อตาม node · node ที่มี **หลาย primitive** กลายเป็น Group ชื่อ node และมี Mesh ลูกชื่อตาม **ชื่อ mesh** (+ `_1`, `_2`) · `bakeKit` รวมเฉพาะลูกที่ชื่อลงท้าย `_geo` / `_geo_N` ดังนั้นต้องตั้งชื่อ mesh ใน Blender เป็น `<node>_geo` (build_kit ทำอยู่แล้ว)
- **หน่วย/แกน/จุดหมุน:** 1 หน่วย = 1 เมตร · glTF +Y ขึ้น (Blender Z-up, exporter แปลงให้ `export_yup=True`) · ตัวละครหันหน้า +Z · **origin ของ node แม่อยู่ที่พื้นใต้วัตถุตรงกลาง** (`minY = 0`) วางที่ origin โลก root ไม่มี rotation/scale (เกม clone แล้ววางเอง จึงต้อง apply transform ก่อน export) · mesh ลูกที่ต้องหมุนใน animation เก็บ pivot ไว้ที่ข้อต่อ (ลูกที่มี local transform ไม่ identity จะไม่ถูกรวมโดย `bakeKit`)
- **Blender export ที่ใช้อยู่:** `export_yup=True, export_apply=True, export_materials=EXPORT, export_vertex_color=NONE, export_texcoords=False, export_image_format=NONE, ไม่ใช้ Draco/meshopt, ไม่ export animation/skin/camera/light` (`build_kit.py` `export_glb`) · สคริปต์ library บน `lane/env-assets` (`build_env_library.py`) ใช้ `export_vertex_color=ACTIVE, export_texcoords=True, export_image_format=AUTO`

## 3. วัสดุถูกแปลงอย่างไร (lambertize + bakeKit + flattenPropMerged)
จากโค้ด `src/render/models.ts` (อ่านแล้ว ไม่ได้เปลี่ยน)

| คุณสมบัติใน GLB | สิ่งที่เกิดในเกม |
|---|---|
| `baseColorFactor` | คงไว้ (เป็น `color` ของ Lambert, ค่า linear ที่ GLTFLoader แปลงแล้ว) |
| `emissiveFactor` + `emissive_strength` | คงไว้ถ้าผลรวม rgb > 0.01 · `emissiveIntensity = min(1, ค่าเดิม) × 0.8` (ค่า strength > 1 ถูกตัดที่ 1) |
| `metallic`, `roughness` | **ทิ้ง** (Lambert) |
| texture ทุกช่อง (`map`, `normalMap`, `aoMap`, `emissiveMap`, `alphaMap`) | **ทิ้ง** (materialใหม่ไม่ตั้ง `map`) |
| `TEXCOORD_n` (UV) | ติดไปกับ geometry เฉพาะ mesh ที่ไม่ผ่าน batch · **ถูกลบ** ใน `bakeKit` และ `flattenPropMerged` (เหลือแค่ `position`, `normal`, `aCol`, `aEm`) ดังนั้น prop ที่ scatter แบบ instance ไม่มี UV แน่นอน |
| `COLOR_0` (vertex colour) | **ทิ้ง** ใน pipeline หลัก (`vertexColors` ไม่ถูกตั้ง และ attribute ถูกลบตอน batch) → asset ที่ใช้ material ขาว + vertex colour จะออกมา **สีขาว/เทาเรียบ** · pilot R5 แก้ด้วย `paintLib`+`LibLambert` (ดู 3.1) |
| `alphaMode` BLEND/MASK, `alphaCutoff`, opacity | **ทิ้ง** → ทึบ (ใบไม้แบบ alpha-cut จะเป็นแผ่นสี่เหลี่ยมทึบ) · mesh ที่โปร่งใสจะไม่เข้า `bakeKit` ตามเงื่อนไข `bakeEligible` |
| `doubleSided` | **ทิ้ง** → หน้าเดียว (Front, culled ด้านหลัง) · Blender export ตั้ง `doubleSided=true` เป็นค่าปริยาย (28/28 material ของ kit) จึงไม่มีผล · เปลือกบางต้อง **ทำให้มีความหนา** หรือ **ต้องให้ทีม A/PM ตัดสิน** ว่าจะรับ DoubleSide เหมือน pilot |
| `KHR_materials_unlit`, `KHR_texture_transform` ฯลฯ | ไม่อ่านค่า (ถูกแทนเป็น Lambert) |
| shading | `flatShading: true` ทั้ง Lambert และ `BakedLambert` → normal ใน GLB **ไม่มีผลต่อการเฉด** (เห็นเป็นหน้าเหลี่ยมทั้งหมด) |
| ช่องสี | `renderer.outputColorSpace = SRGBColorSpace` · สี material ที่ GLTFLoader อ่านเป็น linear แล้วเกมออก sRGB · ground canvas texture ตั้ง `colorSpace = SRGBColorSpace` · ค่า `COLOR_0` ใน glTF เป็น linear |

### 3.1 สิ่งที่ pilot R5 ทำเพิ่ม (อ้างอิง `Q/before/src/render/models.ts`, อ่านอย่างเดียว)
- `paintLib(root)` (แทน `lambertize+bakeKit` สำหรับ library): `COLOR_0` เป็น **RGBA** → rgb = สี, **alpha = สัดส่วนเรืองแสง** (`aEm`) · แปลง geometry เป็น non-indexed · ทุก mesh ใช้ material เดียว `LibLambert` (`vertexColors`, `flatShading`, **DoubleSide**, emissive = `vColor × (aEm + 0.14)`)
- pilot อ่าน geometry ของ node ใน library ตรง ๆ: `(envLibNode(n) as Mesh).geometry` → **node ใน library ต้องเป็น Mesh เดี่ยว 1 primitive ที่ root** (ไม่ใช่ Group หลาย primitive) · `env_library_v01.glb` เป็นแบบนี้ (8 node = 8 mesh = 8 primitive, material เดียว `syn_env`)
- ค่าตัวเลขเช่น `+0.14` เป็นการเลือกด้านภาพของ pilot **ต้องให้ทีม A ตัดสิน** ก่อนถือเป็นมาตรฐาน

## 4. Shader และข้อจำกัดของ GPU
- เกมมี material 2 ตระกูลเท่านั้น: Lambert มาตรฐาน กับ Lambert + `onBeforeCompile` (`BakedLambert` สำหรับ `aCol/aEm` flat varying, และ `nearFade`) **ไม่มี PBR ไม่มี normal map ไม่มี environment map** ใน asset
- `nearFade(material, ...)` (`view.ts` ~846): clone material แล้วต่อ shader ท่อน `discard` แบบ dither (ตาราง 2×2 หรือ interleaved-gradient-noise เมื่อเปิด env fade) ใช้ `vViewPosition` ของ Lambert → **ใช้ได้กับ Lambert/MeshStandard เท่านั้นที่มี `vViewPosition`**; ใช้ `attribute float aSolid` ต่อ instance (geometry ของ prop ถูกตั้ง `aSolid` ร่วมกันทุก part ของชนิดนั้น) และ `instanceColor` (tint) → **ทุก batch ต้องรองรับ `InstancedMesh` + `instanceColor`**
- ผลของ `discard`: early-Z ใช้ไม่ได้บนวัตถุเหล่านี้ → fragment cost สูงกว่าปกติเมื่อซ้อนกันมาก (ข้อสังเกตทางเทคนิค ยังไม่ได้วัดบนเครื่องจริง)
- ไม่มีโปร่งใสจริงใน scatter (ทึบ + dither) · กฎ HUD: วัตถุใกล้กล้องที่ทับโซน HUD หรือกินจอ > 12% ต้องจางแบบลายจุด (Golden Reference ข้อ 4)
- เงา: tier `high` เท่านั้นที่มี shadow map (`castShadow` เฉพาะ instance ที่ชื่อขึ้นต้น `tree`) · tier low/medium ใช้เงาอบในพื้น (`bakeContactShadows`) ที่ใช้ `Caster {r, h}` จาก **bounding box ของ prop** → ขนาด/รัศมี/ความสูงใน GLB มีผลต่อเงาที่อบ
- ตัวแปรสภาพแวดล้อมเทียบ: `?env=0` ปิดทุกอย่างของ `envArt.ts` · ฉากบอสต้องเหมือน `?env=0`

## 5. Instancing / batching และผลต่อ draw call
- ต้นไม้ หิน พุ่ม ฯลฯ ใน scatter: `flattenPropMerged` รวมทุก part ที่ใช้ **material เดียวกัน** เป็น geometry เดียว → **1 draw call ต่อ (ชนิด prop × material ที่ต่างกัน) ต่อ 1 batch** · ตัวอย่าง: prop ที่ใช้ 3 material = 3 draw call ต่อชนิด ไม่ว่ากี่ต้น
- ดังนั้นเพิ่ม **จำนวนชนิด prop** หรือ **จำนวน material ต่อ prop** = เพิ่ม draw call · เพิ่มจำนวนต้น (instance) ไม่เพิ่ม draw call แต่เพิ่ม triangle
- material ที่ใช้ร่วมกัน (ชื่อ/ค่าเดียวกัน) ถูกรวมเป็นก้อนเดียวต่อชนิด prop (key = object material ตัวเดียวกัน) · library แบบ material เดียว (`syn_env`) = 1 draw call ต่อชนิด prop (pilot รวมของ static ทั้งหมดเป็น mesh เดียว +1)
- กอหญ้า+ดอกไม้: mesh เดียวรวมทุกอย่าง (+1 draw call) ใช้ vertex colour (`col`) และ `sway` ใน `envArt.ts` · แม่แบบจาก library (`grass_tuft`, `flower_small`) ใช้ **สีจาก `material.color`** ไม่ใช่ `COLOR_0` (ดูช่องว่าง G2)
- landmark (เต็นท์ ไฟ ป้าย ฯลฯ) ผ่าน `makeProp` เป็น Object3D ปกติ (ไม่ instance) ถูก `bakeKit` รวม part ลูกที่ identity-transform ให้แล้ว

## 6. LOD
**ไม่มี LOD ในโค้ด** (ค้น `LOD` ใน `src/` ไม่พบ; `docs/HANDOFF.md` ข้อ 6 ระบุเป็นงานค้าง) ไฟล์ GLB ต้องส่ง **ระดับเดียว** · วิธีลดต้นทุนที่มีจริง: tier คุณภาพ (`decoDensity` low 0.45 / medium 0.8 / high 1), ระยะ fog (22–60 m, far 62), culling แบบ frustum ของ `InstancedMesh` (`computeBoundingSphere`), `nearFade` · ถ้าต้องการ LOD ต้องเพิ่มโค้ด render (แตะ `src/render/` — **ต้องให้ทีม A ตัดสิน** เรื่องการสลับรูปทรงที่ผู้เล่นเห็น และขออนุมัติ PM เพราะกระทบ perf)

## 7. งบ (budgets)
| รายการ | ค่า | แหล่ง |
|---|---|---|
| draw calls ทุ่ง 844×390 | **medium ≤ 60, low ≤ 56** (Golden Reference r3 วัดสูงสุด 55 / 53) | `docs/qa/env-art-v01/README.md` กฎข้อ 6, `PENDING_QUEUE` P6 |
| draw calls ฉากบอส phase 2 | 62/65 = Known Performance Issue **KPI-001** ห้ามเพิ่มเพดานเพื่อให้ผ่าน ฉากบอสต้องเท่า `?env=0` | `docs/qa/KNOWN_ISSUES.md` (ตาม PENDING_QUEUE P6 ไฟล์มีอยู่แล้ว) |
| triangles ที่ทุ่งเพิ่มจาก Golden Reference r3 | low +6.6k, medium +14.5k (ตัวเลขที่เกิดขึ้น ไม่ใช่เพดานที่ทีม A กำหนด) | README ข้างต้น |
| FPS | headless ไม่แย่กว่า −10% (SwiftShader ใช้เทียบกันเองเท่านั้น) | README ข้างต้น |
| ไฟล์ kit | ≤ 60k tris, ≤ 1.2 MB (เป้า ≤ 700 KB), ไม่ใช้ Draco/meshopt | `ASSET_CONTRACT.md`, `verify_kit.py` |
| tris ต่อ prop ที่ scatter (kit) | tree ≤ 350, bush/rock/flower/mushroom/crystal_cluster ≤ 150 | `verify_kit.py` `SCATTER_CAPS` |
| tris ต่อชิ้น (library, ค่าปริยายในสคริปต์) | tree ≤ 1500, bush/rock/log/mushroom ≤ 400, grass/flower ≤ 120 · GLB ≤ 1.5 MB | `build_env_library.py` (lane/env-assets) |
| texture | **ยังไม่มีเพดาน** ในเอกสารใด · ข้อเท็จจริง: ใน scene มี texture 2 ใบ (ground canvas 512 low / 1024 medium+high, detail 256×256) รวม ~0.69 MB (low) / ~2.68 MB (medium) ตาม baseline-2b · GLB ปัจจุบันไม่มี texture | `quality.ts`, `docs/qa/baseline-2b.md` |
| ปริมาณ draw call ที่ asset ใหม่ "กิน" | ต่อชนิด prop = จำนวน material ที่ต่างกันของ prop นั้น (ดูหัวข้อ 5) | วิเคราะห์โค้ด |

หมายเหตุ: ตัวเลข baseline-2b (86–92 draw calls) เป็นของเกมรุ่นเก่ากว่า Golden Reference · ใช้ตัวเลข Golden Reference เป็นเพดานปัจจุบัน

## 8. สีที่สงวน (ตรวจเชิงเทคนิค ไม่ใช่การเลือกดีไซน์)
- ส้ม **#FF7A1A** และแดง **#FF3355** สงวนไว้สำหรับวงเตือนการโจมตีเท่านั้น (`ASSET_CONTRACT.md`, `ASSET_PIPELINE.md` ข้อ 4, `PROJECT_SYNES.md` ข้อ 2) ห้ามอยู่บนโมเดลใด ๆ
- เกณฑ์ที่มีอยู่แล้ว: `verify_kit.py` ระยะ sRGB ≥ 60 · `build_env_library.py` ระยะ < 100 หรือ (hue ≤ 35° หรือ ≥ 345°) และ s > 0.45 และ v > 0.6 ถือว่าต้องห้าม (bark #8A5A3B ผ่านตามเกณฑ์นี้)
- `glb-check.mjs` ตรวจ base colour / emissive / `COLOR_0` โดยประมาณ (ผลรวม |ΔR|+|ΔG|+|ΔB| < 60 หลังแปลง linear→sRGB แบบ gamma 2.2) เป็น **ตัวคัดกรองเบื้องต้น** ถ้าติดธงต้องดูสีจริงด้วยตา และไม่แทนเกณฑ์ HSV ของ `build_env_library.py`
- ดอกไม้ในเกมใช้ชุดสี violet / blossom / ขาว / lumen อ่อน (ไม่มีส้ม/แดง/ทอง) ใน `envArt.ts` `FLOWER_COLS`

## 9. license / ทะเบียน asset
- ทุก asset ที่อยู่ใน build ต้องมีแถวใน `docs/ASSETS.md` (ผู้สร้าง แหล่งที่มา license เครดิต ผู้ตรวจ/วันที่) · ภาพจาก GPT/Tripo/Blender ต้องเก็บ tool, prompt เต็ม, license, วันที่ (ใบสั่งงาน `docs/handoff/TEMPLATE.md`)
- **ADR-010 (2026-11-23):** environment ทั่วไป (ต้นไม้ หญ้า ดอกไม้ หิน เห็ด พื้นผิว) ใช้ asset ฟรี **CC0** ได้ เริ่มจาก Quaternius Stylized Nature MegaKit (รุ่น Standard ฟรีเท่านั้น `[Pro]`/`[Source]` ห้ามใช้เพราะเสียเงิน) · ตัวละคร ศัตรู บอส UI เสียง ยังต้องเป็นต้นฉบับ · ต้องอ่านไฟล์ license ในแพ็กจริง บันทึก sha256 ของ zip ลง `docs/art/ENV_ASSET_LIBRARY.md` (ไฟล์นี้อยู่บน `lane/env-assets` ยังไม่ merge เข้า branch นี้) และ `docs/ASSETS.md` · ห้ามใช้โควตา GPT Image/Tripo กับ asset ทั่วไป
- zip และโฟลเดอร์ `extracted/` ของ third-party ไม่เข้า git (`.gitignore` ของ `lane/env-assets`) · repo เป็น **Public** ห้าม commit ข้อมูลส่วนตัว อีเมล key
- **Hero 001 ห้ามขึ้น repo สาธารณะ** (เจ้าของสั่ง 2026-11-23): `lane/env-assets/.gitignore` มีกฎ `assets/source/**/*[Hh]ero*001*` และ `assets/_inbox/**/*[Hh]ero*001*` แต่ **`.gitignore` ของ `art/env-polish` ยังไม่มีกฎนี้** (ช่องว่าง G5) · `glb-check` ไม่ตรวจเรื่องนี้ (ตรวจแค่ชื่อไฟล์ตามที่ผู้ใช้ส่งเข้ามา)
- ก่อน push ใด ๆ ที่มีไฟล์ library ต้องได้รับอนุมัติจากเจ้าของ (ตอนนี้ push `art/env-r5-pilot` **ยังไม่อนุมัติ**)

## 10. ลำดับการรับงาน: inbox → ตรวจ → เปรียบเทียบในเกม → QA อิสระ → เจ้าของอนุมัติ
1. **ใบสั่งงาน/บรีฟจากทีม A** ใน `docs/handoff/<asset>.md` (DRAFT) · Claude ไม่เขียนบรีฟเอง
2. ไฟล์ที่ส่งกลับวางใน `assets/_inbox/` ชื่อ `ประเภท_ชื่อ_vNN.glb` (เกมห้ามโหลดจากโฟลเดอร์นี้) สถานะ REVIEW
3. **ตรวจไฟล์ด้วยเครื่องมือ:** `node tools/qa/glb-check.mjs assets/_inbox/<file>.glb --expect <nodes> --max-tris N --max-bytes N --max-tex 1024 --json <out>` ต้อง exit 0 (หรือ FAIL เฉพาะข้อที่ PM ยกเว้นเป็นลายลักษณ์อักษร) · รันซ้ำด้วย `tools/blender/verify_kit.py` ถ้าเป็น kit
4. **ใส่เข้าเกมบน branch ทดลอง** (`exp/*` หรือ `art/*`) ผ่านสวิตช์ query (เช่น `?envlib=1`) ไม่ทำให้ `?env=0` เปลี่ยน · ลงทะเบียน `docs/ASSETS.md` สถานะ placeholder/ยังไม่ APPROVED
5. **เปรียบเทียบในเกมจริง:** ถ่ายภาพก่อน/หลังจากกล้องเล่นจริงด้วย `tools/qa/stage1-shots.mjs` (seed เดียวกัน tick เดียวกัน) · วัด draw calls / triangles / heap / เวลาโหลดด้วย harness ที่มี (`tools/qa/baseline.mjs`, `perf-field.mjs`) · low + medium 844×390 · ผลทุกตัวเป็น headless SwiftShader **ไม่ใช่เครื่องจริง**
6. **QA ภาพอิสระ:** agent ที่ไม่ใช่ผู้ผลิต ตรวจจากภาพในเกม ถ้าไม่ดีขึ้นให้ย้อนกลับ (ADR-010) · ผ่านแล้วเป็น Golden Reference
7. **ทีม A ทบทวน** ตัวเลือกที่ Claude เลือกเองทุกข้อ (E1–E18 ฯลฯ ใน README ของ `r1-sample`, `PENDING_QUEUE.md`)
8. **เจ้าของอนุมัติ** (APPROVED) ก่อนย้ายเข้า `public/assets/` และ merge เข้า `main` (PM เท่านั้นที่ merge) · ทดสอบ Android/iPhone จริงก่อนขึ้น Pages (ยังไม่ได้ทดสอบ) · Pages ห้ามอัปเดตโดยไม่ถามเจ้าของ

## 11. ข้อกำหนดทางเทคนิคสำหรับไฟล์ที่ส่งเข้า (ข้อเท็จจริง/ข้อจำกัด ไม่ใช่ดีไซน์)
ตรวจได้ด้วย `glb-check` เว้นแต่ระบุ "ตรวจมือ"

| # | ข้อกำหนด | วิธีวัด / ค่า |
|---|---|---|
| R1 | ไฟล์ `.glb` glTF 2.0 ตัวเดียว (self-contained, มี BIN chunk, ไม่มี uri ภายนอก) | `glb-check` (parse) |
| R2 | ชื่อไฟล์ `<ประเภท>_<ชื่อ>_vNN.glb` ตัวพิมพ์เล็ก | `glb-check` check `filename` |
| R3 | `extensionsRequired` ว่าง · **ห้าม** `KHR_draco_mesh_compression`, `EXT_meshopt_compression`, `KHR_texture_basisu` (เกมไม่มีตัวถอด) · `EXT_texture_webp/avif` ไม่อยู่ในสัญญา | `glb-check` check `extensions` |
| R4 | node ที่โค้ดค้นหาต้องมีครบและชื่อตรงตัวอักษร (ส่งรายชื่อด้วย `--expect`) · ไม่มีชื่อ node ซ้ำ | `glb-check` `--expect`, เตือน duplicate |
| R5 | root ของแต่ละ prop: translation (0,0,0), rotation identity, scale 1, `minY ≈ 0` (วางบนพื้น) origin ตรงกลางฐาน | ดูคอลัมน์ `minY` และ `(xform)` ในรายงาน · ขนาด/ความสูง: ตรวจมือกับบรีฟทีม A |
| R6 | หน่วยเมตร +Y ขึ้น · ตัวละครหัน +Z | ตรวจมือ (bbox ในรายงานช่วยดูขนาด) |
| R7 | mesh ลูกของ prop หลาย primitive ตั้งชื่อ mesh ลงท้าย `_geo` | `glb-check` เตือน |
| R8 | ทุก primitive เป็น TRIANGLES · มี `NORMAL` (เกมใช้ flat shading อยู่แล้ว แต่ exporter ควรใส่) · ไม่มี morph/skin/animation (ไม่ถูกเล่น) | `glb-check` เตือน |
| R9 | งบ triangles ต่อไฟล์/ต่อ prop ตามตารางข้อ 7 (ส่ง `--max-tris`) · จำนวน primitive ต่อ prop = จำนวน draw call ต่อชนิด (ส่ง `--max-parts`) | `glb-check` |
| R10 | ขนาดไฟล์ ≤ 1.2 MB (kit) / ≤ 1.5 MB (library) ตามชุด · ส่ง `--max-bytes` | `glb-check` |
| R11 | ไม่ใช้ texture เป็นค่าตั้งต้น (เกมทิ้ง texture) ถ้าจำเป็นต้องมี: ≤ 1024 px ต่อด้าน (ค่าตรวจ `--max-tex 1024` เป็น **ค่าเสนอ** ยังไม่มีเพดานทางการ) | `glb-check` check `max-tex` · **ต้องให้ทีม A/PM ตัดสิน** |
| R12 | สีทั้งหมดอยู่เป็น base colour ต่อ material, emissive ต่อ material, หรือ (library) `COLOR_0` RGBA ตามข้อ 3.1 · material ที่ใช้ซ้ำใช้ชื่อเดียวกัน (ลดจำนวน draw call) | `glb-check` (ตารางวัสดุ) |
| R13 | ไม่มีสีใกล้ #FF7A1A / #FF3355 ใน base colour, emissive, vertex colour | `glb-check` check `reserved-colours` + ตรวจตา |
| R14 | `alphaMode` = OPAQUE (เกมทิ้งค่าอื่น) · `doubleSided` ไม่มีผล (เปลือกบางจะหายด้านหลัง) | `glb-check` เตือน |
| R15 | license CC0/เป็นของโปรเจกต์ มีแถวใน `docs/ASSETS.md` ก่อนใช้ใน build · ไม่มีไฟล์ Hero 001 หรือไฟล์ต้นฉบับ third-party ใน repo | ตรวจมือ + `git status` |
| R16 | ทำซ้ำได้: สร้างจากสคริปต์/manifest (`build_env_library.py` + `env_library_manifest.json` บน `lane/env-assets`) ได้ไฟล์เดิมทุกไบต์ในเครื่องมือรุ่นเดียวกัน | `--check-determinism` ของสคริปต์ |

## 12. ผล `glb-check` กับ GLB ที่มีอยู่ 3 ไฟล์
รันด้วย `node tools/qa/glb-check.mjs <ไฟล์> --quiet` (ไม่ส่ง `--expect/--max-*`) เมื่อ 2026-11-25 · generator ทั้ง 3 = Khronos glTF Blender I/O v5.3.43 · ไม่มี extension ใด ๆ ไม่มี texture/skin/animation ทั้งหมด

| ไฟล์ | ขนาด | nodes | primitives | triangles | materials | attribute | ชื่อไฟล์ | สีสงวน | หมายเหตุ |
|---|---:|---:|---:|---:|---:|---|---|---|---|
| `public/assets/models/synes_kit.glb` | 646,964 B (631.8 KB) | 43 | 195 | 17,137 | 28 | NORMAL+POSITION | FAIL (ไม่ตรง `<type>_<name>_vNN`) | ผ่าน | doubleSided ทั้ง 28 (เกมไม่ใช้) · 4 mesh ลูกมี local transform (`campfire_flame`, `hero_head`, `hero_sword`, `prismback_horn`; ตรวจพบ 5 รายการ) · bbox 6.55×7.90×5.04 m (รวมทุก node ซ้อนที่ origin) |
| `public/assets/models/spire_shrine_B.glb` | 56,020 B (54.7 KB) | 2 | 17 | 1,318 | 10 | NORMAL+POSITION | FAIL (ไม่ตรงรูปแบบ) | ผ่าน | node `crystal_spire` 256 tris (9.15 m สูง) และ `ruin_arch_shrine` 1,062 tris · side-car: node ชื่อซ้ำกับ kit จึงแทนที่ (`kitExtra`) · doubleSided ทั้ง 10 |
| `…/c2qa/before/public/assets/models/env_library_v01.glb` (สำเนา QA อ่านอย่างเดียว) | 361,000 B (352.5 KB) | 8 | 8 | 3,532 | 1 (`syn_env`) | COLOR_0+NORMAL+POSITION | **PASS** | ผ่าน | 8 node = 8 mesh เดี่ยว · tris/ตัว: rock_a_mossmass 174, rock_b_tallcracked 104, rock_c_roadside 142, rune_stone 212, tree_conifer 340, tree_secondary 394, tree_signature 790, tree_signature_focal 1,376 · ความสูง 0.58–5.0 m ทุก node `minY = 0` · ไม่มี `grass_tuft`/`flower_small` |

ข้อสังเกตจากผล: (ก) `env_library_v01` ผ่านงบ tris ต่อชิ้นของสคริปต์ (tree ≤ 1500, rock ≤ 400) แต่ไม่ผ่าน `SCATTER_CAPS` ของ kit (tree ≤ 350) ถ้าถือเป็นเพดานเดียวกัน (`tree_secondary` 394, `tree_signature` 790) · (ข) ตัวเลขใน `docs/ASSETS.md` ของ kit (15,604 tris, 579.4 KB) เป็นของรุ่นก่อน ปัจจุบัน branch นี้ 17,137 tris / 631.8 KB (รวมตัวละคร DES-004 ตัวเลือก A และ spire/shrine) ควรปรับแถวทะเบียนให้ตรง (PM)

## 13. ช่องว่าง (gaps) และเครื่องมือ/ข้อเสนอแก้
| # | ช่องว่าง | ผล | ข้อเสนอ | สถานะ |
|---|---|---|---|---|
| G1 | **pipeline หลักไม่รองรับ vertex colour** (`lambertize` ทิ้ง `COLOR_0`, `bakeKit`/`flattenPropMerged` ลบ attribute) | library แบบ material ขาว + `COLOR_0` (เช่น `env_library_v01`) จะเรนเดอร์เป็นสีเรียบขาว/เทา | พอร์ต `LibLambert` + `paintLib` จาก pilot (`Q/before/src/render/models.ts`) และให้ `flattenPropMerged` คง `color`/`aEm` สำหรับ node ของ library · แตะ `src/render/` ต้องผ่านขั้นตอนรอบงานปกติ (ไม่ทำในงานนี้) | รอ PM จัดรอบ · ส่วนที่ผู้เล่นเห็น (DoubleSide, เรืองแสง `+0.14`) **ต้องให้ทีม A ตัดสิน** |
| G2 | แม่แบบ `grass_tuft`/`flower_small` อ่านสีจาก `material.color` ไม่ใช่ `COLOR_0` และ library v01 ไม่มี 2 node นี้ | ถ้าส่ง 2 node นี้แบบ vertex colour สีจะผิด (ขาว × tint) | ให้ `libTemplate` อ่าน `color` attribute เมื่อมี (แก้โค้ด render) และกำหนดรายชื่อ node ให้ทีม A ทราบ | รอ PM |
| G3 | `doubleSided`, `alphaMode`, `map`/`alphaMap` ถูกทิ้ง และ UV ถูกลบก่อน instance (ข้อ 3) | asset แบบแผ่นใบไม้ alpha-cut/ texture จะผิดรูป (สี่เหลี่ยมทึบ/หายด้านหลัง) · สคริปต์ `build_env_library.py` มีโหมด "texture" (material `env_tex_*` ไม่มีผู้ใช้ในเกม) | ทางเลือก: (ก) ห้ามส่ง texture/alpha-cut ใช้ geometry ทึบ (ไม่เปลี่ยนโค้ด) (ข) เพิ่มรองรับ `alphaTest` + UV ใน batch (เปลี่ยนโค้ด+ perf) | **ต้องให้ทีม A ตัดสิน** (ผลต่อรูปทรงที่เห็น) · ข้อ (ข) ต้อง PM อนุมัติ perf |
| G4 | ไม่มีเพดาน texture บนมือถือ · ไม่มีเพดาน tris ต่อ prop สำหรับ library ที่เป็นทางการ (ตัวเลขใน `build_env_library.py` กับ `verify_kit.py` ไม่ตรงกัน: tree 1500 vs 350) | ตรวจ pass/fail ไม่ได้อย่างเป็นทางการ | ให้ PM+ทีม A กำหนดเพดานเดียว ตัวเลขที่ glb-check รับผ่าน `--max-*` อยู่แล้ว (ตัวอย่างเริ่มต้น: `--max-tex 1024` เป็นค่าเสนอ) | **ต้องให้ทีม A ตัดสิน** + ต้องวัดบน Android/iPhone จริง (ยังไม่ได้ทดสอบ) |
| G5 | `.gitignore` ของ `art/env-polish` ไม่มีกฎกัน Hero 001 และ third-party zip/extracted (มีเฉพาะบน `lane/env-assets`) · repo เป็น Public | เสี่ยงหลุดไฟล์ต้องห้ามตอน `git add` | เติม 4 บรรทัดจาก `lane/env-assets/.gitignore` (assets/source/third_party zip + extracted, Hero*001 ใน source และ _inbox) · การแก้ไฟล์ config ของ repo ต้องให้ PM กดอนุมัติ ไม่ได้แก้ในงานนี้ | รอ PM |
| G6 | ไม่มี LOD (ข้อ 6) · KPI-001 (บอส phase 2 62/65 เกินเพดาน) | เพิ่มชนิด prop/material ต้องจ่ายด้วย draw call ที่ไม่มีเหลือ (ทุ่ง 55/60 medium, 53/56 low) | งบเหลือจริงมีน้อย: ทุ่งเหลือ 5 (medium)/3 (low) draw call → แนะนำให้ library ใช้ **material เดียว** และจำกัดจำนวนชนิด prop (ตัวเลขนี้คำนวณจากตัวเลข r3 ใน README) · รวม mesh/LOD เป็นงานโค้ดแยก | ข้อกำหนด R9 · LOD **NEEDS OWNER/PM** อนุมัติรอบงาน |
| G7 | การเชื่อมชื่อ node ↔ โค้ดกระจายอยู่ในหลายไฟล์ (`PILOT_NODES`, `tintKind`, ชื่อ `grass_tuft`, `ASSET_CONTRACT.md`) ไม่มีไฟล์รายการเดียวให้ทีม A/เครื่องมือใช้ | ส่งงานแล้วชื่อไม่ตรงจะ fallback เงียบ ๆ (ไม่ error) | ใช้ `glb-check --expect` ตามรายการในข้อ 2 · ข้อเสนอ: ทำ `docs/art/env_library_nodes.json` เป็นแหล่งเดียว (PM อนุมัติ) | ใช้ได้ทันทีด้วย `--expect` |
| G8 | `glb-check` ตรวจโครงสร้างเท่านั้น: ไม่เห็นรูปทรง ความเรียบร้อยของ normal การทับซ้อนหน้า (z-fight) หรือภาพจริงในเกม · ตรวจสีสงวนแบบประมาณ | ผ่านเครื่องมือ ≠ ผ่านภาพ | ขั้นตอนข้อ 10 ข้อ 5–6 (ภาพจริง + QA อิสระ) ยังจำเป็น | ตามขั้นตอน |
| G9 | ชื่อไฟล์เดิม (`synes_kit.glb`, `spire_shrine_B.glb`, `env_library_v01.glb`) ไม่เสมอกันกับกฎ `<type>_<name>_vNN` (`env_library_v01.glb` ผ่านรูปแบบ regex เพราะ `env` เป็นประเภท ตามรายการประเภทในข้อ 4 ของ pipeline) | `glb-check` ติด FAIL ไฟล์เก่า | PM ตัดสิน: ยกเว้นไฟล์เก่า (`--no-name-check`) หรือเปลี่ยนชื่อ+แก้ URL | รอ PM |
| G10 | ถ้าจะใช้ meshopt/Draco/KTX2 เพื่อลดขนาด ต้องเพิ่มตัวถอดใน build | ไฟล์ที่บีบอัดจะโหลดไม่ได้ | ติดตั้งแพ็กเกจ/เพิ่ม decoder (backlog #6 `meshopt`, EXP-103) | **NEEDS OWNER** (ติดตั้ง) |
| G11 | ดาวน์โหลดแพ็ก Quaternius/Kenney (ADR-010) ติดที่สิทธิ์ของเครื่องมือและขนาดไฟล์ Drive 10 MB (`ENV_ASSET_LIBRARY.md`) · Tripo ต้องสมัครแบบเสียเงิน | ไม่มี source สำหรับสร้าง library ใหม่ | เจ้าของแบ่งไฟล์ zip ≤ 9 MB หรือเพิ่มสิทธิ์ตามเอกสาร · ห้ามใช้ Tripo กับ asset ทั่วไป (ADR-010) | **NEEDS OWNER** |

## 14. คำสั่งเครื่องมือ
```
node tools/qa/glb-check.mjs <file.glb> [more.glb ...] \
  [--expect name1,name2] [--max-tris N] [--max-tex 1024] [--max-bytes N] [--max-parts N] \
  [--json out.json] [--quiet] [--no-name-check]
```
- exit code 0 = ทุก check ผ่าน · 1 = มี check ล้มเหลวหรืออ่านไฟล์ไม่ได้ · 2 = ใช้คำสั่งผิด
- รายงานสรุป: generator, extensions (ธงถ้าต้องใช้ตัวถอดที่เกมไม่มี), ต้นไม้ node, ตาราง root group (tris/primitives/ขนาด/minY), วัสดุ (สี sRGB โดยประมาณ, emissive, alpha, doubleSided, texture), รูปภาพ (mime, ไบต์, ขนาดพิกเซลจากหัว PNG/JPEG/WebP), bbox โลก (รวม transform ของ node), คำเตือน
- ขอบเขต: ไม่แก้ไฟล์ ไม่เขียนอะไรนอกจาก `--json` · ไม่ใช้ network
- ทดสอบแล้วกับ 3 ไฟล์ในข้อ 12 + ไฟล์เสีย (exit 1) + `--expect` ที่ขาด node และ `--max-tris` ที่เกินงบ (ผลเป็น FAIL ตามคาด)
