# Handoff: Synes Online

## Rollover รอบ 1–2 → รอบ 2 · 2026-11-20
**เหตุผล:** แชตหลักใช้ไป ~535k token ซึ่งเกินเกณฑ์ 450k (CLAUDE.md ข้อ 5)
**สถานะ:** `main` push แล้วที่ https://github.com/thanaponzxz-gif/Synes-Online, test 16/16, lifecycle 20/20 (ผลเดิม ยังไม่ได้รันซ้ำหลังเพิ่มไฟล์ governance)
**สิ่งที่ทำหลัง handoff รอบ 1:**
- เพลย์เทสต์ agent รอบ 1 (`docs/qa/playtest-agent-round1.md`) และชุดควบคุม (`tools/qa/playtest-harness.mjs`)
- ต้นแบบปรับภาพบน branch `art/visual-pass-poc` (ยังไม่ merge)
- มติทีม (`docs/team/2026-11-20-review.md`) ให้ทำความชัดก่อน
- ตั้งกฎโปรเจค (CLAUDE.md, PROJECT_SYNES.md, agent `project-synes`, skills `synes-pm`/`synes-playtest`), บีบอัดที่ 450k + hook หลังบีบอัด และสคริปต์ Windows Remote Control
**งานถัดไปของเซสชันใหม่:** รอบ 2-A (backlog ข้อ 1–3) แล้วเพลย์เทสต์ซ้ำเพื่อเทียบคะแนนความชัด (รอบ 1 ได้ 5/10)
**หมายเหตุสำหรับเซสชันใหม่:**
- ต้องรัน `npm ci` ก่อน (node_modules ไม่อยู่ใน repo)
- Blender ใช้ได้หลัง `uv venv tools/blender/.venv && uv pip install --python tools/blender/.venv/bin/python bpy==5.3.0`
- จะอัปเดต Artifact เดิมต้องส่ง `url` ของ artifact นั้นและ `read` ก่อน (ลิงก์อยู่ใน PROJECT_SYNES.md)

## รอบที่ 1 · 2026-11-19
**commit ล่าสุด:** ดู `git log --oneline` บน `main` (merge `art/blender-kit` ที่ f07a730)
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
  - แกลเลอรีโทนภาพ 10 แบบ: https://claude.ai/artifact/B512M87CqpnicvUrNCrCvT
  - โฮสต์ Artifact ไม่รับ `.glb` build สำหรับ Artifact จึงใช้โมเดลแบบ glTF JSON ฝังข้อมูล (`synes_kit.json` 699 KB) แทน

### ผลทดสอบ
- `npm test` ผ่าน 16/16 รายการ และ `node tools/qa/lifecycle.mjs` ผ่าน 20/20 รายการทั้งก่อนและหลัง merge โมเดล (รายละเอียดใน `docs/qa/round-1.md`)
- โมเดล Blender: รัน `verify_kit.py` ซ้ำเองแล้ว ผ่าน 293 ข้อ, 15,232 tris, 537.6 KB และ hash ตรงกับรายงานของ agent
- **ยังไม่ได้ทดสอบบน Android, iPhone หรือเบราว์เซอร์ในแอปแชตของจริง** ตัวเลขทั้งหมดมาจาก Chromium จำลองที่ใช้ GPU แบบซอฟต์แวร์
- ยังไม่ได้เปิดลิงก์ Artifact ใน viewer ของ claude.ai เพื่อยืนยันว่าเกมรันได้ เพราะ container เปิดหน้า claude.ai ที่ต้องล็อกอินไม่ได้
  ส่วนรูปแบบไฟล์ทดสอบแล้วในเบราว์เซอร์ local

### งานค้าง / ความเสี่ยง
1. **ไม่มี remote git:** ถ้า container ถูกเก็บคืน งานจะหายทั้งหมด เจ้าของต้องสร้าง GitHub repo (เช่น `synes-online`) แล้วเปิดสิทธิ์ให้ Claude ก่อน จึงจะ push ได้
2. **ลิงก์สาธารณะที่มี server ตรวจผล:** ต้องมีโฮสต์ (static CDN + Node server) ซึ่งต้องใช้บัญชีของเจ้าของ
3. ความยากปรับจากบอทเท่านั้น ต้องให้คนเล่นจริง
4. draw calls ~81 (เป้าต่ำกว่า 40) เพราะตัวละครแยกชิ้นเพื่อทำแอนิเมชัน ส่วน triangle ในฉากอยู่ที่ 30k (tier low) ถึง 49k (tier medium)
   ขนาดดาวน์โหลดขึ้นกับว่าโฮสต์บีบอัด GLB ให้หรือไม่ (192 KB ถ้าบีบอัด, 538 KB ถ้าไม่) และ meshopt คืองานรอบถัดไป
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
