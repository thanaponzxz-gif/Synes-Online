# PM → 🟢 SUB · Synes · Local Art (เครื่อง Windows) · 2026-11-23
เซสชัน PM บนคลาวด์ส่งข้อความตรงถึงเซสชันบนเครื่องเจ้าของไม่ได้ (เจ้าของไม่อนุญาตการเชื่อมข้ามเครื่อง) และมองไม่เห็น `C:\SYNES_ASSETS\SYNES_OUTPUT` จึงประสานงานผ่านไฟล์นี้ใน repo (branch `art/env-polish`)

## คำสั่งเจ้าของล่าสุด
Environment v01 = Golden Reference ชั่วคราว (branch `baseline/env-v01` = `8b4f602`) · ยังไม่ merge `main` / ไม่ขึ้น Pages · ทำ **Environment v02** ด้วย Asset Library ที่ผ่านตรวจ แล้วเทียบ v01 กับ v02 มุมกล้อง แสง ตำแหน่งเดียวกัน → QA อิสระ → ส่งภาพให้ทีม A และเจ้าของเลือกก่อน merge · ห้ามทำงานซ้ำกัน · เร่ง Hero 001

## แบ่งงาน (กันซ้ำ)
| งาน | เจ้าของงาน |
|---|---|
| ผลิต/แก้/ตรวจ Environment Library 160 ชิ้น, แก้ 21 ชิ้นที่ QA รอบ 2 ไม่ผ่าน | **Local Art** |
| คัดชุดย่อยด่านแรก → `env_library_v01.glb` ตามสัญญาด้านล่าง | **Local Art** |
| Hero 001: เจนใหม่จากภาพตัวละครเดี่ยว (Tripo) + ตรวจ | **Local Art** (ไฟล์อยู่ในเครื่องเท่านั้น) |
| โค้ดจัดวางในเกม (`src/render/envArt.ts`), ภาพเทียบ v01/v02, perf, QA อิสระ, รายงาน | **PM (คลาวด์)** |
| สายคลาวด์ `lane/env-assets` | **หยุดผลิต** (ไม่มีไฟล์) · สคริปต์ `tools/blender/build_env_library.py` + `render_env_gallery.py` บน branch นั้นนำไปใช้ได้ |

## คำตอบ Q1–Q4 (ชั่วคราว: Claude รับช่วง Technical Art ตาม ADR-010 ทีม A ทบทวนภายหลัง)
- **Q1 → A:** Quaternius เป็นหลัก (ต้นไม้ พืช หิน) + Kenney เฉพาะชิ้น modular + shading เดียว · เหตุผล: ตรงกับ Golden Reference (ต้นไม้ทรงพุ่มมีปริมาตร แดดข้าง สีหลายโทน)
- **Q2 → ไม่เพิ่มเป็น 500 แบบทั่วไป:** แม่แบบกอหญ้า/ดอกไม้ที่กระจายทั่วฉาก ≤ 120 tris ต่อกอ (เกมรวมเป็น mesh เดียวหลายร้อยกอ) · ≤ 500 tris ได้เฉพาะ "กลุ่มดอกไม้จุดเด่น" ไม่เกิน ~10 จุดต่อด่าน ชื่อโหนด `flower_bed_*`
- **Q3:** Hero สูง **1.5 m** (`docs/art/ASSET_CONTRACT.md`: โหนด `hero_body`, `hero_head`, `hero_sword`, origin ดาบที่ด้ามจับ, หัว ~40%) · ตอนนี้ 1,968 tris ไม่มี texture · งบชั่วคราวของต้นแบบ Tripo: ≤ 8k tris, texture 1 ใบ ≤ 1024², ไฟล์ ≤ 600 KB, 1–2 material (ต้องวัดบนมือถือจริงก่อนเป็นงบถาวร) · เกมขยับตัวละครเป็นชิ้นส่วนแยกโหนด ไม่ใช่ skeleton (ดู `src/render/models.ts`)
- **Q4:** PM ตัดสินไม่ได้ รอเจ้าของ · ข้อเท็จจริง: Wayfarer = ผ้าพันคอ teal และสีแดง/ส้มสงวนให้วงเตือน (PROJECT_SYNES ข้อ 2) → อย่าเจนใหม่โดยยึดสีแดงจนเจ้าของตอบ

## สัญญา `env_library_v01.glb` (สิ่งที่เกมรับได้ตอนนี้)
- ไฟล์เดียว `public/assets/models/env_library_v01.glb` โหลดเมื่อใส่ `?envlib=1` (ไม่มีไฟล์ = ไม่ทำอะไร)
- ชื่อโหนดที่โค้ดรู้จัก: `tree_*` (แทนต้นไม้ใน kit), `rock_a`, `bush`, `grass_tuft`, `flower_small` (แม่แบบหญ้า/ดอกไม้) — ถ้าต้องการชื่อ/ชนิดเพิ่ม (เช่น `rock_b..f`, `mushroom_*`, `stump_*`, `flower_bed_*`) ให้เขียนรายการไว้ท้ายไฟล์นี้ PM จะเพิ่มในโค้ด
- คัดชุดย่อย: ต้นไม้ 5–6, พุ่ม 3, หิน 5–6, หญ้า 3–4, ดอกไม้ 4–5, เห็ด 2, ตอ/ไม้ล้ม 1–2 · **ไฟล์ ≤ 1.5 MB รวม texture** (160 ชิ้น 5.21 MB เก็บเป็นคลังนอกเกม)
- หนึ่งโหนด = หนึ่ง mesh หนึ่ง material (วาดด้วย InstancedMesh) · origin ฐานกลาง · +Y ขึ้น · หน่วยเมตร (ฮีโร่ 1.5 m) · ไม่ใช้ Draco/meshopt
- ต้นไม้ ≤ 1,500 tris · หิน/พุ่ม ≤ 400 · ห้ามสีใกล้ `#FF7A1A` / `#FF3355`
- งบเกมที่ 844×390: draw calls ทุ่ง ≤ 60 (medium) / ≤ 56 (low) ตอนนี้ใช้ 55 / 53 → ทรงใหม่ต้อง**แทน**ของเดิม ไม่เพิ่ม batch

## วิธีส่งไฟล์ให้ PM (เลือกทางที่เจ้าของอนุมัติ)
1. **push ชุดย่อย** (`env_library_v01.glb` + ตารางแหล่งที่มา/license ต่อโหนด) ขึ้น branch `lane/env-library-local` — asset เป็น CC0 แต่ repo เป็น Public จึงต้องให้เจ้าของอนุมัติก่อน push · **ห้าม push ไฟล์/ภาพ Hero**
2. หรือ Local Art checkout `art/env-polish` แล้วทำ v02 บนเครื่องเอง (`npm run build`, ถ่ายภาพด้วย `node tools/qa/stage1-shots.mjs <out> --qs envlib=1 --only opening,pathA,plaza,pool --jpeg`) แล้ว push เฉพาะภาพและตัวเลขให้ PM ตรวจ
