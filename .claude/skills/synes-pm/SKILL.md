---
name: synes-pm
description: Routine ของผู้จัดการโปรเจค Synes ใช้ตอนเริ่มหรือจบรอบงาน, เมื่อเจ้าของถามว่าทำอะไรต่อ, เมื่อจะแบ่งงานหลายเซสชันหรือหลาย agent และเมื่อถึงเวลาขึ้นเซสชันใหม่ (rollover) ครอบคลุมการตรวจสถานะ ตรวจความต้องการ วางแผน แยกสายงาน และส่งต่อเซสชัน
---

# synes-pm

ใช้กับ repo Synes Online เท่านั้น ทำตาม `CLAUDE.md` เสมอ

**กฎเหล็ก (CLAUDE.md ข้อ 0, ADR-007):** งานออกแบบหรือปรับดีไซน์ทุกประเภทต้องให้ GPT Codex (ทีม A) ออกแบบหรือเขียนบรีฟก่อน
PM ทำได้แค่เขียนใบขอออกแบบ (`docs/design/REQ-*`) แล้วรอดีไซน์ (`DES-*`) ก่อนจึงแบ่งงานให้ลงมือ ถ้าต้องเปลี่ยนดีไซน์ระหว่างทำให้ส่งกลับทีม A ก่อน

## A. ต้นรอบ: ตรวจสถานะ
1. รันคำสั่งตรวจตาม CLAUDE.md ข้อ 1 (รวมข้อ 1.5: อ่านหมวดที่เกี่ยวใน `docs/knowledge/LESSONS_LEARNED.md` ถ้างานแตะเครื่องมือ/pipeline/asset)
2. ถ้าต้องการความเห็นที่ไม่ผูกกับความคิดของเซสชันนี้ ให้เรียก agent `project-synes` (Agent tool, subagent_type `project-synes`)
   แล้วนำผลมาตรวจซ้ำก่อนใช้ ถ้าเซสชันนี้ยังไม่รู้จัก agent ชนิดนี้ (เพราะสร้างหลังเริ่มเซสชัน) ให้ทำตามขั้นใน `.claude/agents/project-synes.md` เอง
3. อัปเดตหัวข้อ 4–5 ของ `docs/PROJECT_SYNES.md`

## B. ตรวจความต้องการ
| เช็ก | วิธี |
|---|---|
| GitHub remote | `git remote -v` ถ้าไม่มี ให้เจ้าของสร้าง repo แล้วเชื่อมที่ https://claude.ai/connect-github จากนั้นใช้ `add_repo` แนบ repo เข้าเซสชันแล้ว `git remote add origin … && git push -u origin main` |
| ส่วนเสริม | `SearchPlugins` เฉพาะเมื่อมีงานติดขัดจริง ต้องอ่านโค้ด plugin ก่อนเสนอ และติดตั้งเมื่อเจ้าของยืนยันแล้วเท่านั้น |
| connector | `ListConnectors` เช่น Google Drive (มีแล้ว) ใช้สำรองไฟล์ได้เมื่อเจ้าของอนุญาต |
| สกิล | งานที่ทำซ้ำ ≥ 2 รอบให้ทำเป็น skill ใน `.claude/skills/` |
| environment | `get_environment` ใช้เมื่อ network ถูกบล็อกจริงเท่านั้น และปฏิบัติตามคำอธิบายของ tool |

## C. แบ่งงานหลายสาย
1. เลือกงานที่เป็นอิสระต่อกันจาก backlog แล้วจับคู่กับเจ้าของไฟล์ใน `docs/OWNERSHIP.md` (ไม่เกิน 3 สาย)
2. **สายในเซสชันนี้:** Agent tool + `isolation: "worktree"` + `run_in_background: true` และในบรีฟต้องบอก branch `lane/<ชื่อ>`, ไฟล์ที่แก้ได้, เกณฑ์ว่าเสร็จ และรูปแบบ handoff
3. **สายแบบเซสชันแยก (ต้องมี GitHub):** `create_session` ด้วย `source_url` = repo, `outcome_branch` = `lane/<ชื่อ>`,
   `title` = `Project Synes · <สาย> · รอบ N` และ prompt มาตรฐานด้านล่าง (เติมงานของสายนั้น)
   จากนั้นติดตามด้วย `list_sessions` (children: true), `get_session` และ `list_events` (kinds: result)
4. เมื่อแต่ละสายส่งงาน: ตรวจ diff เอง → merge เข้า `main` → รัน `npm test` + lifecycle → push
5. ห้ามบอกเจ้าของว่าการแยกสายทำให้ได้โทเคนเพิ่ม ประโยชน์จริงคือทำงานขนานกันได้และบริบทไม่ปนกัน

## D. Rollover: ขึ้นเซสชันใหม่
เงื่อนไขอยู่ใน CLAUDE.md ข้อ 5 ขั้นตอนมีดังนี้
1. อัปเดต PROJECT_SYNES.md (สถานะ, backlog, เพิ่มบรรทัดในบันทึกเซสชัน) และเพิ่ม handoff ใน `docs/HANDOFF.md`
2. `npm test` → commit → `git push` (ถ้า push ไม่ได้ให้หยุดและแจ้งเจ้าของ)
3. `create_session` ด้วยค่า:
   - `source_url`: URL ของ GitHub repo
   - `title`: `🟢 MAIN · Synes Online · รอบ <N>`
   - `tags`: `["project-synes"]`
   - `prompt`: prompt มาตรฐานด้านล่าง (ใส่ id ของเซสชันเดิมด้วย)
4. แจ้งเจ้าของด้วยลิงก์เซสชันใหม่ 1 บรรทัด
5. **เซสชันใหม่เป็นผู้ปิดเซสชันเดิม** (CLAUDE.md ข้อ 5.1)
   - ตรวจก่อนว่า push ล่าสุดของเซสชันเดิมอยู่บน remote และเซสชันเดิมมีแท็ก `project-synes`
   - จากนั้นใช้ `set_session_title` เปลี่ยนชื่อเป็น `⚪ OLD · Synes · รอบ <N-1>` แล้ว `archive_session`
   - ห้ามแตะเซสชันที่ไม่มีแท็กนี้

### Prompt มาตรฐานสำหรับเซสชันใหม่
```
คุณคือผู้จัดการโปรเจค Synes (Synes Online) ทำงานต่อจากเซสชันก่อน (เซสชันเดิม: <session_id เดิม>)
0) set_session_tags เพิ่มแท็ก project-synes ให้เซสชันนี้ จากนั้นปิดเซสชันเดิมตาม CLAUDE.md ข้อ 5.1 หลังตรวจว่า push แล้ว
1) อ่าน CLAUDE.md และ docs/PROJECT_SYNES.md แล้วทำขั้นเริ่มเซสชันให้ครบ
2) อ่าน docs/HANDOFF.md ส่วนล่าสุด
3) ทำงานรอบถัดไปตาม backlog ข้อแรกที่ยังไม่เสร็จ (หรืองานที่ระบุ: <งาน>)
4) รายงานเจ้าของเป็นภาษาไทยตามรูปแบบใน CLAUDE.md
```

## E. ท้ายรอบ: รายงาน
- เปลี่ยนอะไร, วิธีเปิดเล่น, ผลทดสอบแยกตามอุปกรณ์, ปัญหาที่เหลือ, branch/commit และงานถัดไป
- อัปเดตบันทึกเซสชันใน PROJECT_SYNES.md ทุกครั้ง
- ถ้ามีบทเรียนใหม่ เพิ่มใน `docs/knowledge/LESSONS_LEARNED.md` (1–3 บรรทัด) และอัปเดตสถานะการทดลองใน `EXPERIMENT_RESULTS.md` (CLAUDE.md ข้อ 7)
