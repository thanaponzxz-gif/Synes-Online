# Environment Art v01 · ด่านแรก "ทุ่งน้ำค้างแสง"
คำสั่งเจ้าของ 2026-11-23 (ADR-010) · ทุกภาพถ่ายจากกล้องเล่นจริงด้วย `tools/qa/stage1-shots.mjs` (seed 1, tick เดียวกัน, Chromium headless + SwiftShader **ไม่ใช่เครื่องจริง**)

## R0 baseline (`r0-baseline/`, build = `main` `3136fe0`)
14 ภาพ: opening-start, opening-walk2s (844 + 1672, สี + ขาวดำ), pathA, plaza, pool · low + medium · draw calls 49–54 (medium)

## วิเคราะห์ Art Direction จากภาพ baseline (PM ดูภาพเอง)
| # | จุดอ่อน | เห็นในภาพ |
|---|---|---|
| 1 | พื้นหญ้าเป็นสีเขียวเรียบสีเดียว ไม่มีกอหญ้า ดอกไม้ หรือความต่างของค่าสี → รู้สึกโล่งที่สุด | ทุกภาพ |
| 2 | ทางดินเป็นแถบสีแทนเรียบ ขอบไม่แตก ไม่มีกรวด รอยล้อ หรือหญ้าเลื้อยเข้า | opening-walk2s, pathA |
| 3 | ไม่มีเงาต้นไม้บนพื้น (tier low/medium ปิดเงา) ต้นไม้ดูลอย แสงแบน | opening-walk2s, plaza |
| 4 | พื้นที่ระหว่างต้นไม้ว่าง หินน้อยและหน้าตาซ้ำ ไม่มีของเล็ก (เห็ด ใบไม้ ตอไม้) | plaza, pool |
| 5 | ต้นไม้ใกล้กล้องจางเป็นลายตาข่าย ดูเหมือนบั๊ก | pathA (ขวา), opening (ซ้าย) |
| 6 | ต้นไม้เขียวสดสองสีซ้ำกันทั้งฉาก ไม่แยกระยะใกล้ไกล | opening, pathA |

## แผนรอบ
- **R1 พื้นที่ตัวอย่าง** (`r1-sample/`, branch `exp/env-sample-a`): ช่วงค่าย → ลานแรก · พื้น, กอหญ้า, ดอกไม้, เงาปลอม, แสง · สวิตช์ `?env=0` = ภาพเดิม
- **Library** (`lane/env-assets`): คัด asset CC0 (Quaternius ก่อน) → `env_library_v01.glb` + `docs/art/ENV_ASSET_LIBRARY.md`
- **Visual QA อิสระ** ตรวจ R1 จากภาพจริง → ผ่านแล้วเป็น Golden Reference → ขยายทั้งด่านแรก
