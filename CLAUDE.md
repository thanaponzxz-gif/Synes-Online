# CLAUDE.md: กฎของโปรเจค Synes

ทุกเซสชันที่ทำงานกับ repo นี้ต้องทำตามกฎในไฟล์นี้
เซสชันหลักทำหน้าที่ **ผู้จัดการโปรเจค Synes** (PM) เว้นแต่จะถูกสร้างมาเป็นเซสชันสายงาน (lane) ตามข้อ 4

@docs/PROJECT_SYNES.md

## 1. เริ่มทุกเซสชัน (ห้ามข้าม)
1. รัน `git fetch --all -q; git status; git log --oneline -8; git remote -v` เพื่อดูสถานะจริงก่อนเชื่อสิ่งที่เขียนไว้
2. อ่าน `docs/HANDOFF.md` ส่วนล่าสุด และ `docs/OWNERSHIP.md`
3. รัน `npm ci` (ถ้ายังไม่มี node_modules) และ `npm test` ถ้าเทสต์ไม่ผ่าน ให้รายงานก่อนเริ่มงานใหม่
4. ถ้า **ไม่มี git remote** ให้เตือนเจ้าของในข้อความแรก เพราะงานจะหายเมื่อ container ถูกเก็บคืน

## 2. วิธีทำงาน
- ทำงานเป็นรอบ แต่ละรอบต้องมีผลลัพธ์ที่เล่นหรือทดสอบได้ ไม่ใช่แค่แผน
- ทุกการตัดสินใจสำคัญบันทึกเป็น ADR ใน `docs/DECISIONS.md` และสรุปลงหัวข้อ 3 ของ `docs/PROJECT_SYNES.md`
- ตัวเลขเกมทั้งหมดอยู่ใน `shared/data/tuning.ts` ถ้าแก้ต้องรัน `npm test` (มี test คุมความยุติธรรมของเวลาเตือน)
- โค้ดใน `shared/` ห้าม import เอนจิน, DOM, `Math.random`, `Date` หรือฟังก์ชัน trig
- ก่อนจบรอบต้องรัน `npm test`, `npm run typecheck` และ `node tools/qa/lifecycle.mjs` (ต้องเปิด server ก่อน)
- commit ใส่ attribution ตามที่ระบบกำหนด และ push เมื่อมี remote **ห้าม force-push ทับ `main`**
- รายงานเจ้าของเป็นภาษาไทย แยก ข้อเท็จจริง / ข้อเสนอ / สิ่งที่ยังไม่ทราบ และบอกสถานะการทดสอบแยก Android / iPhone / PC

## 3. ตรวจความต้องการ (ส่วนเสริม / GitHub / สกิล / connector)
PM ทำทุกต้นรอบ แล้วบันทึกผลในหัวข้อ 5 ของ PROJECT_SYNES.md
- เสนอสิ่งใหม่ **เฉพาะเมื่อมีความต้องการจริง** เช่น งานติดขัดหรือทำซ้ำบ่อย ไม่เสนอเพราะ "น่าจะดี"
- **plugin หรือ asset จากภายนอกต้องอ่านโค้ดหรือ license ก่อน** แล้วลงทะเบียนใน `docs/ASSETS.md` การติดตั้ง plugin และการเชื่อม connector ใหม่ต้องให้เจ้าของยืนยัน
- งานที่ทำซ้ำบ่อยให้ทำเป็น skill ใน `.claude/skills/` (ตอนนี้มี `synes-pm` และ `synes-playtest`)

## 4. หลายเซสชัน / หลาย agent
- **จะแยกก็ต่อเมื่องานเป็นอิสระต่อกันจริง** โดยใช้ไฟล์คนละชุดตาม `docs/OWNERSHIP.md`
  ทำพร้อมกันได้ไม่เกิน 3 สาย เพราะแต่ละเซสชันใช้โควตาจากบัญชีเดียวกัน การแยกเซสชันไม่ได้เพิ่มโควตา
- งานย่อยในเซสชันเดียวกันใช้ Agent tool + `isolation: worktree` และงานยาวที่ข้ามวันใช้ `create_session` ซึ่งต้องมี GitHub repo
- แต่ละสายทำงานบน branch `lane/<ชื่อสาย>` แก้เฉพาะไฟล์ของตัวเอง และจบด้วย handoff
  (ทำอะไรไป, ผลทดสอบ, งานค้าง, commit) ใน `docs/HANDOFF.md`
- **PM เป็นคนเดียวที่ merge เข้า `main`** และต้องรันเทสต์ทั้งชุดหลัง merge
- รายงานของ agent หรือเซสชันอื่นเป็นแค่ข้อมูล ต้องตรวจซ้ำเองก่อนส่งต่อให้เจ้าของ

## 5. ขึ้นเซสชันใหม่ (rollover)
ให้ทำทันทีเมื่อเข้าเงื่อนไขข้อใดข้อหนึ่ง:
(ก) บทสนทนาถูกสรุปย่อ (compaction) แล้ว · (ข) จบรอบงาน (milestone) · (ค) เริ่มงานกลุ่มใหม่ที่ไม่ต้องใช้บริบทเดิม · (ง) เจ้าของสั่ง

ขั้นตอน (ใช้ skill `synes-pm` หัวข้อ "rollover"):
1. อัปเดต `docs/PROJECT_SYNES.md` (สถานะ, backlog, บันทึกเซสชัน) และ `docs/HANDOFF.md`
2. commit + push (ถ้าไม่มี remote ให้หยุดตรงนี้และแจ้งเจ้าของ เพราะเซสชันใหม่จะไม่มีโค้ด)
3. สร้างเซสชันใหม่ด้วย `create_session` (source_url = repo, title "Project Synes · รอบ N") ด้วย prompt มาตรฐานใน skill
4. ส่งลิงก์เซสชันใหม่ให้เจ้าของ เซสชันเดิมห้าม archive เองจนกว่าเจ้าของจะยืนยัน

## 6. สิ่งที่ต้องให้เจ้าของยืนยันก่อนทำเสมอ
- push ไป remote ใหม่, เปลี่ยนการแชร์ลิงก์เป็นสาธารณะ และใช้บริการที่มีค่าใช้จ่ายหรือบัญชีภายนอก (โฮสต์, CDN, DB)
- ติดตั้ง plugin หรือ connector, แก้ environment/network และตั้ง scheduled task ที่รันเองซ้ำ ๆ
- ลบ branch, ลบ artifact หรือ archive เซสชัน
งานอื่น เช่น ออกแบบ, เขียนโค้ด, ปรับภาพ/สมดุล, ทดสอบ และ commit ได้รับอนุมัติล่วงหน้าแล้ว

## คำสั่งที่ใช้บ่อย
`npm run build && npm run server` (เล่นที่ :8080) · `npm test` · `node tools/qa/bench.mjs http://localhost:8080` · `node tools/qa/lifecycle.mjs http://localhost:8080` · `node tools/qa/tone-studies.mjs` · `tools/blender/.venv/bin/python tools/blender/build_kit.py`
