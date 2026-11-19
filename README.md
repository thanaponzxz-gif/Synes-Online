# Synes Online

เกมผจญภัยแฟนตาซี 3D ที่เล่นบนเบราว์เซอร์มือถือได้ทันทีโดยไม่ต้องติดตั้งแอป ตอนนี้อยู่ในระยะ **vertical slice 1** คือด่าน "ทุ่งน้ำค้างแสง" ยาวราว 2–3 นาที

> โปรเจกต์นี้แยกจาก TERRAVIA โดยสมบูรณ์ ไม่มีโค้ด asset หรือประวัติ git ร่วมกัน

## เริ่มเล่นบนเครื่อง
```bash
npm install
npm run build
npm run server        # http://localhost:8080 (มี server ตรวจผลจริง)
```
- โหมดพัฒนา: `npm run dev` (Vite, `--host` เปิดให้มือถือในวง Wi-Fi เดียวกันเข้าได้ แต่ไม่มี server จึงเป็นโหมดออฟไลน์)
- ตัวเลือกใน URL: `?debug` (FPS/draw calls), `?q=low|medium|high`, `?bot=1` (ให้บอทเล่นอัตโนมัติ), `?tone=<id>`, `?nokit` (ไม่โหลด GLB), `?offline`
- บนโฮสต์ที่ส่งได้แค่ hash ให้ใช้ `#debug` หรือ `#offline`

## โครงสร้าง
| path | คืออะไร |
|---|---|
| `shared/` | กฎเกม: simulation แบบ deterministic, ข้อมูลด่านและตัวเลข, กฎรางวัล ไม่ import เอนจิน |
| `server/` | Node server ตรวจผลโดยจำลองจาก input log ซ้ำ และให้บริการไฟล์ static |
| `src/` | client: Three.js render, input สัมผัส, HUD ภาษาไทย, เสียงสังเคราะห์ |
| `tools/blender/` | สคริปต์ Blender ที่สร้างโมเดลทั้งชุด (`synes_kit.glb`) |
| `tools/qa/` | benchmark ตามโปรไฟล์อุปกรณ์, ทดสอบวงจรชีวิตแอปและ layout, เรนเดอร์ภาพโทน |
| `spike/` | technical spike ที่เทียบ PlayCanvas กับ Three.js |
| `docs/` | การตัดสินใจ (ADR), เอกสารออกแบบ, รายงาน QA, ทะเบียน asset, handoff |

## ทดสอบ
```bash
npm test                                         # sim + server authority (vitest)
npm run typecheck
node tools/qa/lifecycle.mjs http://localhost:8080   # สลับแอป/หลุดเน็ต/context loss/in-app/layout
node tools/qa/bench.mjs http://localhost:8080       # เวลาโหลด, FPS, heap ตามโปรไฟล์
```
ผลทั้งหมดมาจาก Chromium จำลอง **ยังไม่ได้ทดสอบบน Android หรือ iPhone จริง** ดู `docs/qa/round-1.md`
