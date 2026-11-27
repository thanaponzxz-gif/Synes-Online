# `ninja-roam-1` เล่นด้วยตัวสำรอง (DES-009 §10): หลักฐาน QA

**ตัวที่เห็นในภาพคือ Wayfarer (ตัวสำรองที่ลงทะเบียนไว้) ที่เล่นตามกติกาของเซย์ริน ไม่ใช่โมเดลเซย์ริน** → **ยังไม่ผ่าน asset** ทุกข้อ
HUD ไอคอนสกิล ชื่อ "นักเดินทาง" และป้าย "ล็อก" บนปุ่มอัลติยังเป็นของ Wayfarer (งาน P2 ตามแบบทีม A) · ไม่มีท่า/VFX/เสียงของนินจา

## เปิดใช้ (เฉพาะเครื่องเจ้าของ)
```powershell
npx vite --port 5173 --strictPort
```
แล้วเปิด `http://localhost:5173/?ruleset=ninja-roam-1` (เพิ่ม `&bot=1` ให้บอทเล่น) · คีย์ 4 หรือปุ่มอัลติ = `lumen_loom` เมื่อเกจครบ 4
เปิดผ่าน IP ในวง LAN หรือบิลด์ production ไม่ได้ (`src/seyrin/gate.ts`; บิลด์ production ไม่มีโค้ด `NinjaWorld`)
server ปกติไม่รับ run ของ ruleset นี้ (422 `ruleset-in-review`) ต้องตั้ง `SYNES_REVIEW_RULESETS=1` และจะไม่ให้รางวัล (`reward: null`)

## ตรวจอัตโนมัติ (2026-11-28, PC, Edge headless + SwiftShader)
`node tools/qa/ninja-placeholder.mjs http://localhost:5173 http://localhost:8081 docs/qa/ninja-roam-v01` → **9/9 ผ่าน**
- dev server ใช้ `NinjaWorld` และมีป้าย "ninja-roam-1 · ตัวสำรอง Wayfarer · ยังไม่ผ่าน asset" (`n0-start.png`)
- บอทเล่น 25 วินาที: มีท่า หลบ และตีโดน (`n1-bot-25s.png`) · บอทชนะที่ tick 2395 (`n2-end.png`; เวลานาฬิกาจริงขึ้นกับ frame rate ของ SwiftShader)
- ไม่มี page error, ไม่เรียก `/api/run/*` · ปุ่มอัลติเริ่ม `lumen_loom` และหักเกจเป็น 0 โดยไม่มีข้อความ "อัลติจะปลดล็อก"
- บิลด์ production (`npm run build && npm run server` บน :8081) ไม่สนใจ `?ruleset=ninja-roam-1`: ยังเป็น `roam-1` ไม่มีป้าย

**ยังไม่ได้ตรวจ:** Android, iPhone, คนเล่นจริง, ความยาก/ความสนุก (บอทเขียนไว้สำหรับ Wayfarer และไม่เคยได้เพอร์เฟกต์), perf ของตัวจริง

**รันซ้ำหลังแก้ตามทีม A รอบ 1 (DES-009 §10.5), 02:15–02:17:** 9/9 ผ่าน, บอทชนะที่ tick 2548 · ภาพในโฟลเดอร์นี้ยังเป็นของรอบแรก (หน้าจอเหมือนเดิม)
