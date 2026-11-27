# โหมดดูท่าเซย์ริน (DES-009 P1): หลักฐานเครื่องมือ

**ภาพในโฟลเดอร์นี้ใช้กล่องทดสอบที่สร้างจากโค้ด (`tests/seyrinFixture.ts`) ไม่ใช่โมเดลเซย์ริน** ยังไม่มีไฟล์ G1/P1 จริง จึง **ยังไม่ผ่าน asset** ทุกข้อ

## เปิดใช้ (เฉพาะเครื่องเจ้าของ)
```powershell
npm run dev
```
แล้วเปิด `http://localhost:5173/?seyrin=preview` (เพิ่ม `&q=low` สำหรับคุณภาพต่ำ) · เลือกไฟล์ GLB และ manifest จากเครื่อง
เปิดผ่าน IP ในวง LAN หรือบิลด์ production ไม่ได้ (ตรวจใน `src/seyrin/gate.ts`; บิลด์ production ตัดโค้ดโหมดนี้ออก)

## ตรวจอัตโนมัติ (2026-11-28, PC, Edge headless + SwiftShader)
`node tools/qa/seyrin-preview.mjs http://localhost:5173 <โฟลเดอร์ภาพ>` → **28/28 ผ่าน**
- โหลดกล่องทดสอบ, 6 คลิป (เล่นทีละ action เดียว), one-shot กลับ idle, เลื่อนทีละ tick (attack_03 tick 6 ยก 0.12 ม., tick 9 ลงพื้น), pause/ซ่อนหน้าแล้วเวลาไม่เดิน
- สลับ Low/Medium และเปิด-ปิด 20 รอบ: ไม่มีตัวซ้อน/แผงซ้อน, จำนวน geometry 81→81 texture 7→7 (**เป็นจำนวนวัตถุ ไม่ใช่การพิสูจน์ว่าไม่มี memory leak**)
- ไฟล์ texture ภายนอกและ manifest ผิดไฟล์: ปฏิเสธ, คงตัวสำรองพร้อมข้อความ "ยังไม่ผ่าน asset", ไม่มี request ออกนอก dev server
- world ไม่ถูก step, ไม่มีการเรียก `/api/run/*` (มีแค่ `/api/health` ที่ตัวเกมเรียกตอนบูตเพื่อรู้ว่าออนไลน์หรือไม่ → 404 บน dev server)

**ยังไม่ได้ตรวจ:** ไฟล์จริงจาก Codex, ภาพ/แสง/เงาของตัวจริง, perf ที่มีความหมาย, Android, iPhone
