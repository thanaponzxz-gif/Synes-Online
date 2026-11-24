# REQ-004: ข้อจำกัดทางเทคนิคของไฟล์งานศิลป์ที่จะเข้าเกม (ต้นไม้ หิน texture material) สำหรับ R5.2
**จาก:** ทีม B (Claude PM) · **ถึง:** ทีม A (GPT Codex) · **วันที่:** 2026-11-25 · **สถานะ:** REQ เปิด
ใบนี้มีความต้องการ ข้อเท็จจริง และข้อจำกัดเท่านั้น **ทีม B ไม่ได้ใส่ข้อเสนอดีไซน์** ตามกฎ ADR-007 · รายละเอียดเต็ม: `docs/art/ART_INTEGRATION_READINESS.md`

## 1. ความต้องการของเจ้าของ (2026-11-24/25)
> "Team A กำลังออกแบบ R5.2 โดยเน้นแก้ต้นไม้บัง Potion ปรับต้นสน และสร้าง Visual Identity ของ Synes Online"
> "P5 — Art Integration Readiness: … ตรวจสอบระบบ Import, Naming, LOD, Shader และ Mobile Compatibility … โดยไม่ออกแบบแทน Team A"

## 2. ข้อเท็จจริงในโค้ด (branch `art/env-polish` และ pilot `839c9c0`)
| เรื่อง | ข้อเท็จจริง | ที่มา |
|---|---|---|
| รูปแบบไฟล์ | `.glb` จาก Blender · ไม่มี decoder ของ Draco/meshopt/KTX2 ในเกม | `src/render/models.ts`, `tools/qa/glb-check.mjs` |
| material | ทุก material ถูกแปลงเป็น `MeshLambertMaterial` แบบ flat shading · เก็บแค่สี + emissive | `models.ts:56-66` (`lambertize`) |
| vertex colour | pipeline หลักลบ attribute ทุกตัวยกเว้น position/normal (`COLOR_0` หาย) · มีทางรองรับเฉพาะในโค้ด pilot (`envlib=1`) | `models.ts:119` · pilot `LibLambert`/`paintLib` |
| texture / alpha / UV | ถูกทิ้งทั้งหมด (`map`, `alphaMode`, UV) · ไม่มี GLB ใดในเกมมี texture | readiness ข้อ 3 |
| ด้านหลังของหน้า | `doubleSided` ถูกทิ้ง → หน้าด้านหลังไม่ถูกวาด | readiness ข้อ 3 |
| LOD | ไม่มี | readiness ข้อ 6 |
| draw calls | 1 call ต่อชิ้น mesh ต่อ batch · ทุ่งใช้แล้ว medium 53–55 / low 51–53 จากเพดาน 60 / 56 (คงเดิมตามคำสั่งเจ้าของ) | `docs/qa/env-art-v01/README.md`, `2026-11-24-pm-accept-r5-fix2.md` |
| สีสงวน | ส้ม #FF7A1A และแดง #FF3355 ใช้กับวงเตือนเท่านั้น · `glb-check` ตรวจสีของ material/vertex colour แบบประมาณ | PROJECT_SYNES ข้อ 2 |
| ชื่อไฟล์ | กฎ `<ประเภท>_<ชื่อ>_vNN.glb` · ไฟล์เก่า `synes_kit.glb`, `spire_shrine_B.glb` ไม่ตรงกฎ | CLAUDE.md ข้อ 5.2 |
| ชื่อ node | โค้ดค้นชิ้นจากชื่อ node (เช่น `tree_secondary`, `tree_conifer`, `grass_tuft`, `flower_small`) ถ้าชื่อไม่ตรง เกมใช้ของเดิมแทนโดยไม่แจ้ง error | readiness ข้อ 2 |
| library pilot v01 | 361,000 B · 8 node · 3,532 tris · 1 material + `COLOR_0` · ไม่มี `grass_tuft`/`flower_small` | `glb-check` |
| เพดาน tris | สคริปต์ 2 ตัวใช้ตัวเลขต่างกัน: `verify_kit.py` ต้นไม้ 350 · `build_env_library.py` 1500 | readiness G4 |

## 3. สิ่งที่ทีม B ต้องได้กลับไป (คำถาม)
1. ไฟล์ R5.2 จะใช้ **vertex colour** หรือ **สีต่อ material** หรือ **texture** · ถ้าใช้ vertex colour หรือ texture โค้ดหลักต้องเปิดรับก่อน (งานโค้ดของทีม B ที่ไม่เปลี่ยนภาพเอง แต่ผลภาพต้องให้ทีม A ตรวจ)
2. มีชิ้นที่ต้องเห็น **ด้านหลังของหน้า** หรือ **ขอบโปร่ง (alpha-cut)** ไหม · ตอนนี้เกมไม่รองรับทั้งสองอย่าง
3. เพดาน **tris ต่อชิ้น** และ **ขนาด texture สูงสุด** ที่ทีม A ใช้ออกแบบ (เพื่อให้ `glb-check --max-tris/--max-tex` ตรวจตามตัวเลขเดียวกัน) · ตัวเลขบนมือถือจริงยังไม่ได้วัด
4. จำนวน **ชนิด material / ชนิดชิ้น** ในทุ่งที่ทีม A วางแผนไว้ (แต่ละชนิดเพิ่ม draw call · ทุ่งเหลือ medium ~5 / low ~3 จากเพดาน)
5. ต้องการ **LOD** หรือไม่ (ถ้าต้องการ ทีม B ต้องขอเจ้าของเปิดรอบงานโค้ด)
6. รายชื่อ **node** ของไฟล์ส่ง (ทีม B จะใช้ `glb-check --expect` ตรวจตอนรับไฟล์)

## 4. ขั้นตอนรับไฟล์ (มีอยู่แล้ว ไม่เปลี่ยน)
`assets/_inbox/` → `node tools/qa/glb-check.mjs <ไฟล์> --expect <node,...> [--max-tris N] [--max-tex N]` → นำเข้าเกมหลัง flag → ภาพเทียบในเกม + draw calls → QA อิสระ → ทีม A ตรวจ → เจ้าของอนุมัติ (ADR-006)
ไฟล์ Hero และไฟล์จาก third-party ห้ามเข้า repo Public (`.gitignore` มีกฎกันแล้ว)
