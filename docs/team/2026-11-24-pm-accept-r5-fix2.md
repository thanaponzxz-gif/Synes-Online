# PM ตรวจรับ R5 รอบแก้ 2 + เทียบ v01/v02 · 2026-11-24 · 🟡 MAIN · Synes Online · รอบ 2-E
ที่มา: เจ้าของแนบ zip 3 ไฟล์ในแชต PM · SHA256 ตรงกับที่ Local Art แจ้งทั้ง 3 ไฟล์ (v05c `84119AC4…`, v05d `3EFCED7B…`, v05e `283C4852…`)
PM ตรวจซ้ำเองบนคลาวด์ตาม CLAUDE.md ข้อ 4 (ไม่ใช้ผลของ Local Art แทน) · Chromium headless + SwiftShader **ไม่ใช่เครื่องจริง**

## 1. ตรวจซ้ำ `fix2_code.patch` (`8E37A1B7…`)
| เรื่อง | ผล |
|---|---|
| SHA256 patch / GLB | ตรง (`8E37A1B7…` / `876F1AAD…`) · `art/env-polish` โค้ดเท่ากับ `24f56b4` ทุกไฟล์ จึงเทียบกันได้ตรง |
| ขอบเขต | 7 ไฟล์: `cameraField.ts` (ใหม่), `envPilot.ts` (ใหม่), `models.ts`, `view.ts`, `tests/cameraField.test.ts`, `arena-probe.mjs`, GLB · ไม่พบ fetch/eval/child_process/URL ภายนอกในโค้ดที่เพิ่ม |
| apply บน `24f56b4` | ผ่าน (`--ignore-whitespace --binary`) |
| vitest / typecheck / build / lifecycle | **168/168 · ผ่าน · ผ่าน · 20/20** |
| ปิด flag = ภาพเดิม | `stage1-shots.mjs` 34 ภาพ (ทุ่ง + บอส, low/medium, 844/1672): ฉาก 3D ตรง v01 · จุดที่ต่างอยู่ใน HUD/CSS ที่เคลื่อนตามเวลาจริงเท่านั้น (ไอคอนสกิล 1, แถบชื่อบอส, ป้ายชื่อบอส) ตรวจด้วยตาจากภาพ diff แล้ว |
| `envlib=1` ฉากบอส | ฉาก 3D ตรง v01 ทุกภาพ (กฎ Golden Reference ข้อ 5 ผ่าน) · calls/tris เท่ากันทุกภาพ |
| draw calls ทุ่ง v01 → v02 | low 48–53 → 51–53 · medium 50–55 → 53–55 (ในงบ ≤ 56 / ≤ 60) · tris ทุ่ง low +6–8k, medium +14k · บ่อน้ำเท่าเดิม |

**คำตัดสิน: ตรวจรับ QA รอบแก้ 2 = ผ่าน (PASS with notes ตามรายงาน QA)** · Minor 1–2 = TD-1/TD-2 อยู่ใน C-1 แล้ว · Minor 3–4 ปิด

## 2. ข้อค้นพบใหม่จากรายงาน QA (ข้อเท็จจริง)
- ฉากบอส phase 2 มี draw calls สูงสุด **low 62 / medium 65** ทั้งก่อนและหลังแก้ = **เกินเพดานชั่วคราว C-9 ที่ PM ตั้งไว้ (56 / 60) อยู่แล้วในเกมปัจจุบัน** ไม่ใช่ผลของ pilot
- C-9 พักตามคำสั่งเจ้าของ → บันทึกเป็นข้อเกินที่ทราบแล้ว (known exceedance) ไม่ใช่ blocker ของ pilot · ส่งทีม A ทบทวนเพดานฉากบอส (PENDING_QUEUE)
- ภาพชุด stage1-shots ของ PM ไม่มีจังหวะ phase 2 ที่วงเตือนซ้อนมากสุด (บอสสูงสุดในชุดนี้ = low 56 / medium 59) จึงยังไม่ได้วัดซ้ำค่า 62/65 เอง

## 3. Environment v02 (= pilot `?envlib=1`) เทียบ v01 กล้อง/แสง/ตำแหน่งเดียวกัน
- ชุดภาพเทียบ (seed 1, tick เดียวกัน) ส่งให้เจ้าของในแชตแล้ว · **ไม่ commit ภาพเข้า repo Public** จนกว่าเจ้าของอนุมัติ push pilot
- สิ่งที่ PM เห็นจากภาพ (ไม่ใช่ QA อิสระ): สีต้นไม้ไปทาง violet/teal ตรงตัวตนเกมขึ้น, มีต้นเห็ด violet และหินรูนก้นหอย · ต้นไม้ฝั่งขวายังอยู่ใกล้ปุ่ม Potion (R-1 เดิม), สนใกล้กล้องยังจางเป็นลายจุด
- **ไม่ทำ QA ภาพอิสระซ้ำ:** QA ภาพรอบ 5 ของ Local Art = FAIL และทีม A กำลังออกแบบต้นไม้ใหม่ (Concept B, H8) → QA ภาพอิสระของ v02 ทำเมื่อได้แบบใหม่จากทีม A

## 4. สถานะงาน
- C-1: เจ้าของอนุมัติ · Codex Local ทำบน `lane/codex-r5` ฐาน `839c9c0` · เกณฑ์ = `CODEX_PROMPTS_R5.md` งานที่ 1 + เกณฑ์ (ก)(ข)(ค) ใน `2026-11-24-pm-reply-local-art.md` · C-2…C-9 พักจนตรวจรับ C-1
- การ push `art/env-r5-pilot` ขึ้น repo Public: ยังรอเจ้าของ (CLAUDE.md ข้อ 6)
- Android / iPhone: ยังไม่ได้ทดสอบ · PC: Chromium headless เท่านั้น
