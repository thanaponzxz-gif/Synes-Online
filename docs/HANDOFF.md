# Handoff: Synes Online

## รอบที่ 1 · 2026-11-19
**สายงานที่ทำในรอบนี้:** gameplay/engine, UI/UX, web perf/QA (เซสชันหลัก บน `main`) และ art/Blender (agent แยก บน worktree `art/blender-kit` แล้ว merge เข้า `main`)

### สิ่งที่ทำเสร็จ
- ตรวจพื้นที่ทำงาน: ไม่มี repo ของ Synes Online มาก่อน, บัญชีมองไม่เห็น repo ใดเลย (รวมถึง TERRAVIA) และ GH_TOKEN ใช้ไม่ได้
  จึงสร้าง repo ใหม่ที่ `/home/user/synes-online` (local git, branch `main`, **ยังไม่มี remote**)
- Technical spike PlayCanvas เทียบ Three.js แล้วเลือก Three.js (ADR-001, `docs/spike-results.md`)
- Simulation แบบ deterministic + server ที่ตัดสินผลโดยจำลองจาก input ซ้ำ (ADR-002)
- Vertical slice "ทุ่งน้ำค้างแสง" เล่นได้ครบ: ค่ายพัก → เส้นทางสอนหลบ → ลานโล่งที่ยากขึ้น → บ่อแสง → บอสปริซึมแบ็ก (2 เฟส) → ผลจบ/รางวัลที่ server ตรวจ
- UI ภาษาไทยแนวนอน: จอยสติ๊กลอย, ปุ่ม 4 ปุ่ม, คำแนะนำตามสถานการณ์, หน้าจอแพ้ที่บอกสาเหตุและเคล็ดลับ
- ระบบคุณภาพภาพ 3 ระดับ + adaptive resolution, หยุดเกมเมื่อสลับแอป, รองรับสัญญาณหลุดและ WebGL context loss
- โมเดลต้นฉบับจากสคริปต์ Blender headless (`tools/blender/`) และภาพโทน 10 แบบที่เรนเดอร์จากเอนจินจริง
- ลิงก์ทดลองเล่น (claude.ai Artifact เป็นส่วนตัว ต้องกด Share ก่อนส่งให้คนอื่น):
  - เกม: https://claude.ai/artifact/5jsDtTKaLN22JGykznhNnA (โหมดออฟไลน์ เพราะโฮสต์แบบ static ไม่มี server)
  - เทียบเอนจิน: https://claude.ai/artifact/8jRQgx5Rp3jNVFznHGkSZ8

### ผลทดสอบ
- `npm test` ผ่าน 13/13 รายการ และ `node tools/qa/lifecycle.mjs` ผ่าน 20/20 รายการ (รายละเอียดใน `docs/qa/round-1.md`)
- **ยังไม่ได้ทดสอบบน Android, iPhone หรือเบราว์เซอร์ในแอปแชตของจริง** ตัวเลขทั้งหมดมาจาก Chromium จำลองที่ใช้ GPU แบบซอฟต์แวร์
- ยังไม่ได้เปิดลิงก์ Artifact ใน viewer ของ claude.ai เพื่อยืนยันว่าเกมรันได้ เพราะ container เปิดหน้า claude.ai ที่ต้องล็อกอินไม่ได้
  ส่วนรูปแบบไฟล์ทดสอบแล้วในเบราว์เซอร์ local

### งานค้าง / ความเสี่ยง
1. **ไม่มี remote git:** ถ้า container ถูกเก็บคืน งานจะหายทั้งหมด เจ้าของต้องสร้าง GitHub repo (เช่น `synes-online`) แล้วเปิดสิทธิ์ให้ Claude ก่อน จึงจะ push ได้
2. **ลิงก์สาธารณะที่มี server ตรวจผล:** ต้องมีโฮสต์ (static CDN + Node server) ซึ่งต้องใช้บัญชีของเจ้าของ
3. ความยากปรับจากบอทเท่านั้น ต้องให้คนเล่นจริง
4. draw calls 56–65 (เป้าต่ำกว่า 40) และงบ triangle ของโมเดลชุดใหม่ต้องเฝ้าดู
5. ยังไม่มี "ร่วมมือ" (co-op) และ "พัฒนาตัวละคร" (EXP/อุปกรณ์ถาวร) ในวงจรเล่น
6. iOS Safari: fullscreen และการล็อกแนวจอใช้ไม่ได้ จึงใช้ข้อความให้หมุนจอแทน ต้องตรวจบนเครื่องจริง

### งานถัดไป (เรียงตามลำดับ)
1. **เจ้าของ:** เปิดลิงก์เกมบนมือถือจริง (Android/iPhone/LINE) ใส่ `#debug` ต่อท้ายลิงก์เพื่อดู FPS แล้วเปิดหน้าเทียบเอนจินและจดผลลง ADR-001
2. **เจ้าของ:** เลือกโทนภาพจากหน้าแกลเลอรี และสร้าง GitHub repo + โฮสต์
3. Gameplay: เล่นทดสอบกับคน 5 คนแล้วปรับ `shared/data/tuning.ts`, เพิ่มระบบเลเวลและอุปกรณ์ที่ server บันทึก (guest id → DB)
4. Online: ย้าย sim ไปรันบน server แบบ real-time (WebSocket) เพื่อทำ co-op 2–4 คนในลานบอส
5. Art: ทำตามโทนที่เลือก, เพิ่ม toon ramp/outline เฉพาะตัวละคร และ rig แอนิเมชันพื้นฐาน
6. Perf: รวม mesh ของตัวละครและพร็อพเดี่ยว, ทำ LOD และทดสอบบนเครื่องจริง 3 ระดับ
7. PWA/ปุ่มเพิ่มลงหน้าจอหลัก ทำหลังจากยืนยันว่าการเล่นจากลิงก์ใช้ได้แล้ว

### วิธีเริ่มเซสชันถัดไป
```bash
cd /home/user/synes-online && git status && git log --oneline -10
npm install && npm test && npm run build && npm run server
```
อ่าน `docs/OWNERSHIP.md` ก่อนแก้ไฟล์ของสายงานอื่น
